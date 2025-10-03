// PWA Service Worker Registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('[PWA] Service Worker enregistré avec succès:', registration.scope);

        // Vérifier les mises à jour du Service Worker
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          console.log('[PWA] Nouvelle version du Service Worker détectée');

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // Nouvelle version disponible
              console.log('[PWA] Nouvelle version disponible - rafraîchissement recommandé');

              // Vous pouvez afficher une notification à l'utilisateur ici
              if (confirm('Une nouvelle version de FleetZen est disponible. Voulez-vous actualiser ?')) {
                newWorker.postMessage({ type: 'SKIP_WAITING' });
                window.location.reload();
              }
            }
          });
        });
      })
      .catch((error) => {
        console.error('[PWA] Erreur lors de l\'enregistrement du Service Worker:', error);
      });

    // Gérer le contrôleur du Service Worker
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });
  });
}

// Prompt d'installation PWA
let deferredPrompt;
const installButton = document.getElementById('pwa-install-button');

window.addEventListener('beforeinstallprompt', (e) => {
  console.log('[PWA] Prompt d\'installation PWA disponible');

  // Empêcher le mini-infobar par défaut de Chrome
  e.preventDefault();

  // Stocker l'événement pour l'utiliser plus tard
  deferredPrompt = e;

  // Afficher le bouton d'installation personnalisé si présent
  if (installButton) {
    installButton.style.display = 'block';

    installButton.addEventListener('click', async () => {
      if (!deferredPrompt) {
        return;
      }

      // Afficher le prompt d'installation
      deferredPrompt.prompt();

      // Attendre la réponse de l'utilisateur
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`[PWA] L'utilisateur a ${outcome === 'accepted' ? 'accepté' : 'refusé'} l'installation`);

      // Réinitialiser la variable
      deferredPrompt = null;
      installButton.style.display = 'none';
    });
  }
});

// Détecter quand l'app est installée
window.addEventListener('appinstalled', () => {
  console.log('[PWA] FleetZen a été installé avec succès');

  // Masquer le bouton d'installation
  if (installButton) {
    installButton.style.display = 'none';
  }

  // Réinitialiser la variable
  deferredPrompt = null;

  // Vous pouvez afficher un message de remerciement ici
  console.log('[PWA] Merci d\'avoir installé FleetZen !');
});

// Détecter si l'app est lancée en mode standalone (installée)
if (window.matchMedia('(display-mode: standalone)').matches) {
  console.log('[PWA] FleetZen fonctionne en mode standalone (installée)');
}

// Gestion de la connectivité
window.addEventListener('online', () => {
  console.log('[PWA] Connexion rétablie');
  // Vous pouvez déclencher une synchronisation des données ici
});

window.addEventListener('offline', () => {
  console.log('[PWA] Connexion perdue - mode hors ligne activé');
});
