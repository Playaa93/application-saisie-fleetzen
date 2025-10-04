// FleetZen Service Worker - PWA Notifications
const CACHE_NAME = 'fleetzen-v1';
const RUNTIME_CACHE = 'fleetzen-runtime';

// Cache essential resources on install
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        '/',
        '/manifest.json',
        '/icons/icon-192x192.png',
        '/icons/icon-512x512.png',
      ]);
    })
  );
  self.skipWaiting();
});

// Clean up old caches on activate
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name \!== CACHE_NAME && name \!== RUNTIME_CACHE)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Network-first strategy with cache fallback
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method \!== 'GET') return;

  // Skip chrome extensions
  if (event.request.url.startsWith('chrome-extension://')) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful responses
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Fallback to cache on network failure
        return caches.match(event.request);
      })
  );
});

// Handle push notifications
self.addEventListener('push', (event) => {
  const options = {
    body: event.data?.text() || 'Nouvelle notification FleetZen',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    vibrate: [200, 100, 200],
    tag: 'fleetzen-notification',
    requireInteraction: false,
  };

  event.waitUntil(
    self.registration.showNotification('FleetZen', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Focus existing window if available
      for (const client of clientList) {
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open new window
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});

// Background Sync - Synchronisation automatique des interventions en attente
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-interventions') {
    event.waitUntil(syncPendingInterventions());
  }
});

async function syncPendingInterventions() {
  try {
    // Ouvrir IndexedDB
    const db = await openDB();
    const tx = db.transaction('pending-interventions', 'readonly');
    const store = tx.objectStore('pending-interventions');
    const index = store.index('by-status');

    // Récupérer toutes les interventions en attente
    const pending = await index.getAll('pending');

    console.log(`[SW] Synchronisation de ${pending.length} interventions en attente`);

    // Synchroniser chaque intervention
    for (const item of pending) {
      try {
        // Mettre le statut à "syncing"
        await updateStatus(db, item.id, 'syncing');

        // Envoyer à l'API
        const response = await fetch('/api/interventions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...item.data,
            tempId: item.tempId,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const result = await response.json();

        // Upload photos si présentes
        if (item.photos && (item.photos.before || item.photos.after)) {
          const formData = new FormData();
          if (item.photos.before) formData.append('before', item.photos.before);
          if (item.photos.after) formData.append('after', item.photos.after);
          formData.append('interventionId', result.id);

          await fetch('/api/interventions/photos', {
            method: 'POST',
            body: formData,
          });
        }

        // Supprimer de IndexedDB après succès
        await deleteFromDB(db, item.id);
        console.log(`[SW] ✅ Intervention ${item.tempId} synchronisée`);

      } catch (error) {
        console.error(`[SW] ❌ Erreur sync ${item.tempId}:`, error);
        await updateStatus(db, item.id, 'failed', error.message);
      }
    }

    // Notifier l'utilisateur si des interventions ont été synchronisées
    if (pending.length > 0) {
      await self.registration.showNotification('FleetZen', {
        body: `${pending.length} intervention(s) synchronisée(s)`,
        icon: '/icons/icon-192x192.png',
        tag: 'sync-complete',
      });
    }

  } catch (error) {
    console.error('[SW] Erreur synchronisation:', error);
    throw error; // Relancer pour que le sync soit réessayé
  }
}

// Helpers IndexedDB dans le Service Worker
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('FleetZenOfflineDB', 1);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function updateStatus(db, id, status, error) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('pending-interventions', 'readwrite');
    const store = tx.objectStore('pending-interventions');
    const getRequest = store.get(id);

    getRequest.onsuccess = () => {
      const item = getRequest.result;
      if (item) {
        item.status = status;
        if (status === 'syncing') item.retryCount += 1;
        if (error) item.lastError = error;

        const updateRequest = store.put(item);
        updateRequest.onsuccess = () => resolve();
        updateRequest.onerror = () => reject(updateRequest.error);
      } else {
        resolve();
      }
    };

    getRequest.onerror = () => reject(getRequest.error);
  });
}

function deleteFromDB(db, id) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('pending-interventions', 'readwrite');
    const store = tx.objectStore('pending-interventions');
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}
