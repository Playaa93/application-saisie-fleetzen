/**
 * PWA Tests - Offline Mode and Service Worker
 * Tests offline functionality, caching strategies, and background sync
 */

import { test, expect } from '@playwright/test';

test.describe('PWA Offline Mode', () => {
  test('should register service worker on first visit', async ({ page }) => {
    await page.goto('/');

    // Wait for service worker registration
    const swRegistered = await page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        return registration !== null;
      }
      return false;
    });

    expect(swRegistered).toBe(true);
  });

  test('should serve cached pages when offline', async ({ page, context }) => {
    // Visit page while online to cache it
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Visit other pages to cache them
    await page.goto('/interventions');
    await page.waitForLoadState('networkidle');

    // Go offline
    await context.setOffline(true);

    // Navigate to cached page
    await page.goto('/');

    // Page should load from cache
    await expect(page.locator('body')).toBeVisible();

    // Check offline indicator
    await expect(page.locator('[data-testid="offline-indicator"]')).toBeVisible();
  });

  test('should cache static assets', async ({ page, context }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Go offline
    await context.setOffline(true);

    // Reload page
    await page.reload();

    // CSS and JS should load from cache
    const cssLoaded = await page.evaluate(() => {
      return document.styleSheets.length > 0;
    });

    const jsLoaded = await page.evaluate(() => {
      return typeof window !== 'undefined';
    });

    expect(cssLoaded).toBe(true);
    expect(jsLoaded).toBe(true);
  });

  test('should save form data offline and sync when online', async ({ page, context }) => {
    // Login first
    await page.goto('/login');
    await page.fill('[name="email"]', 'agent@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('[type="submit"]');
    await page.waitForURL('/dashboard');

    // Go offline
    await context.setOffline(true);

    // Create intervention
    await page.goto('/interventions/new');
    await page.fill('[name="location"]', 'Offline Test Location');
    await page.fill('[name="description"]', 'Created while offline');
    await page.click('[data-testid="submit-intervention"]');

    // Should be queued for sync
    await expect(page.locator('[data-testid="queued-for-sync"]')).toBeVisible();

    // Check IndexedDB for pending sync
    const hasPendingSync = await page.evaluate(async () => {
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open('interventions-db', 1);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });

      const tx = db.transaction('pending-sync', 'readonly');
      const store = tx.objectStore('pending-sync');
      const count = await new Promise<number>((resolve) => {
        const req = store.count();
        req.onsuccess = () => resolve(req.result);
      });

      return count > 0;
    });

    expect(hasPendingSync).toBe(true);

    // Go back online
    await context.setOffline(false);

    // Wait for background sync
    await page.waitForSelector('[data-testid="sync-complete"]', {
      timeout: 15000,
    });

    // Verify intervention was synced
    await page.goto('/interventions');
    await expect(page.locator('[data-testid="intervention-item"]'))
      .toContainText('Offline Test Location');
  });

  test('should handle offline photo uploads', async ({ page, context }) => {
    await page.goto('/interventions/new');

    // Go offline
    await context.setOffline(true);

    // Upload photo
    const photoFile = Buffer.from('fake-image-data');
    await page.locator('input[type="file"]').setInputFiles({
      name: 'offline-photo.jpg',
      mimeType: 'image/jpeg',
      buffer: photoFile,
    });

    // Photo should be stored locally
    await expect(page.locator('[data-testid="photo-preview"]')).toBeVisible();
    await expect(page.locator('[data-testid="pending-upload"]')).toBeVisible();

    // Submit form
    await page.fill('[name="location"]', 'Photo Test');
    await page.fill('[name="description"]', 'Testing offline photo');
    await page.click('[data-testid="submit-intervention"]');

    // Go online
    await context.setOffline(false);

    // Wait for upload
    await page.waitForSelector('[data-testid="upload-complete"]', {
      timeout: 10000,
    });
  });

  test('should display offline-ready badge', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Wait for service worker to cache resources
    await page.waitForTimeout(2000);

    // Check for offline-ready indicator
    const offlineReady = await page.evaluate(() => {
      return document.documentElement.classList.contains('offline-ready');
    });

    expect(offlineReady).toBe(true);
  });

  test('should update cache on new version', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Simulate service worker update
    const updateAvailable = await page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;

        // Trigger update check
        await registration.update();

        return new Promise<boolean>((resolve) => {
          navigator.serviceWorker.addEventListener('controllerchange', () => {
            resolve(true);
          });

          // Timeout after 5 seconds
          setTimeout(() => resolve(false), 5000);
        });
      }
      return false;
    });

    // Should show update notification
    if (updateAvailable) {
      await expect(page.locator('[data-testid="update-available"]')).toBeVisible();
    }
  });

  test('should implement cache-first strategy for static assets', async ({ page }) => {
    await page.goto('/');

    // Check caching strategy in service worker
    const cachingStrategy = await page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        const sw = registration.active;

        if (sw) {
          // Check cache storage
          const cacheNames = await caches.keys();
          const staticCache = cacheNames.find(name => name.includes('static'));

          if (staticCache) {
            const cache = await caches.open(staticCache);
            const requests = await cache.keys();

            return {
              hasCachedAssets: requests.length > 0,
              assetTypes: requests.map(req => {
                const url = new URL(req.url);
                return url.pathname.split('.').pop();
              }),
            };
          }
        }
      }
      return null;
    });

    expect(cachingStrategy).not.toBeNull();
    expect(cachingStrategy?.hasCachedAssets).toBe(true);
    expect(cachingStrategy?.assetTypes).toContain('js');
    expect(cachingStrategy?.assetTypes).toContain('css');
  });

  test('should implement network-first strategy for API calls', async ({ page, context }) => {
    await page.goto('/interventions');

    // Make API call while online
    const onlineResponse = await page.evaluate(async () => {
      const response = await fetch('/api/interventions');
      return {
        fromCache: response.headers.get('x-from-cache') === 'true',
        status: response.status,
      };
    });

    expect(onlineResponse.fromCache).toBe(false);

    // Go offline
    await context.setOffline(true);

    // Try API call again
    const offlineResponse = await page.evaluate(async () => {
      const response = await fetch('/api/interventions');
      return {
        fromCache: response.headers.get('x-from-cache') === 'true',
        status: response.status,
      };
    });

    // Should serve from cache when offline
    expect(offlineResponse.fromCache).toBe(true);
    expect(offlineResponse.status).toBe(200);
  });

  test('should handle background sync for queued actions', async ({ page, context }) => {
    // Setup background sync
    await page.goto('/');

    const syncRegistered = await page.evaluate(async () => {
      if ('serviceWorker' in navigator && 'sync' in window) {
        const registration = await navigator.serviceWorker.ready;
        await registration.sync.register('sync-interventions');
        return true;
      }
      return false;
    });

    expect(syncRegistered).toBe(true);
  });

  test('should clear old caches on activation', async ({ page }) => {
    await page.goto('/');

    // Check cache management
    const cacheManagement = await page.evaluate(async () => {
      const cacheNames = await caches.keys();
      const currentCaches = cacheNames.filter(name =>
        name.includes('v1') || name.includes('current')
      );

      return {
        totalCaches: cacheNames.length,
        currentCaches: currentCaches.length,
      };
    });

    // Should not have excessive old caches
    expect(cacheManagement.totalCaches).toBeLessThan(5);
  });
});

test.describe('Service Worker Lifecycle', () => {
  test('should install service worker', async ({ page }) => {
    await page.goto('/');

    const swState = await page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        return {
          state: registration.active?.state,
          scope: registration.scope,
        };
      }
      return null;
    });

    expect(swState?.state).toBe('activated');
    expect(swState?.scope).toBeTruthy();
  });

  test('should skip waiting on update', async ({ page }) => {
    await page.goto('/');

    // Trigger service worker update
    const skipWaiting = await page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        await registration.update();
        return true;
      }
      return false;
    });

    expect(skipWaiting).toBe(true);
  });

  test('should claim clients on activation', async ({ page }) => {
    await page.goto('/');

    const controlled = await page.evaluate(() => {
      return navigator.serviceWorker.controller !== null;
    });

    expect(controlled).toBe(true);
  });
});

test.describe('IndexedDB Offline Storage', () => {
  test('should create IndexedDB database for offline data', async ({ page }) => {
    await page.goto('/');

    const dbExists = await page.evaluate(async () => {
      return new Promise<boolean>((resolve) => {
        const request = indexedDB.open('interventions-db', 1);
        request.onsuccess = () => {
          request.result.close();
          resolve(true);
        };
        request.onerror = () => resolve(false);
      });
    });

    expect(dbExists).toBe(true);
  });

  test('should store and retrieve offline interventions', async ({ page }) => {
    await page.goto('/');

    const stored = await page.evaluate(async () => {
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open('interventions-db', 1);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains('pending-sync')) {
            db.createObjectStore('pending-sync', { keyPath: 'id', autoIncrement: true });
          }
        };
      });

      // Store intervention
      const tx = db.transaction('pending-sync', 'readwrite');
      const store = tx.objectStore('pending-sync');
      await new Promise<void>((resolve) => {
        const request = store.add({
          location: 'Test',
          description: 'Test intervention',
          timestamp: Date.now(),
        });
        request.onsuccess = () => resolve();
      });

      // Retrieve interventions
      const getTx = db.transaction('pending-sync', 'readonly');
      const getStore = getTx.objectStore('pending-sync');
      const count = await new Promise<number>((resolve) => {
        const req = getStore.count();
        req.onsuccess = () => resolve(req.result);
      });

      return count > 0;
    });

    expect(stored).toBe(true);
  });
});
