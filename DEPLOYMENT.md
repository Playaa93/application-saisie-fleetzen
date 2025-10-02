# Guide de Déploiement - FleetZen

## 🚀 Déploiement sur Vercel (Recommandé)

### 1. Créer un compte Vercel
- Aller sur https://vercel.com
- Se connecter avec GitHub
- Autoriser Vercel à accéder à vos repos

### 2. Importer le projet
- Cliquer sur "Add New Project"
- Sélectionner le repo: `Playaa93/application-saisie-fleetzen`
- Framework Preset: Next.js (détecté automatiquement)

### 3. Configurer les variables d'environnement

**Variables REQUISES** (à copier depuis .env.local):

```
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_anon_key
SUPABASE_SERVICE_ROLE_KEY=votre_service_role_key
```

**Comment les ajouter:**
1. Dans Vercel, onglet "Environment Variables"
2. Ajouter chaque variable une par une
3. Sélectionner "Production", "Preview" et "Development"

### 4. Déployer
- Cliquer sur "Deploy"
- Attendre 2-3 minutes
- URL de production: `https://votre-app.vercel.app`

### 5. Tester la PWA sur mobile

**Installation:**
1. Ouvrir l'URL Vercel sur mobile (Chrome/Safari)
2. Menu → "Ajouter à l'écran d'accueil"
3. L'app s'installe comme une app native

**Test offline:**
1. Ouvrir une intervention
2. Activer le mode avion
3. Vérifier que la page reste accessible

## 📱 Fonctionnalités PWA

- ✅ Installation sur mobile (Android/iOS)
- ✅ Icône sur l'écran d'accueil
- ✅ Mode offline (Service Worker)
- ✅ Cache des ressources
- ✅ Synchronisation en arrière-plan (à venir)

## 🔄 Mises à jour

**Déploiement automatique:**
- Chaque push sur `main` déclenche un nouveau déploiement
- Preview deployments sur les PRs

**Rollback:**
- Dans Vercel Dashboard → Deployments
- Cliquer sur une version précédente → "Promote to Production"

## 🐛 Debug en production

**Logs:**
- Vercel Dashboard → Project → Logs
- Voir les erreurs runtime en temps réel

**Variables d'environnement:**
- Vercel Dashboard → Project → Settings → Environment Variables
- Modifier et redéployer

## 🔐 Sécurité

**Bonnes pratiques:**
- ✅ `.env.local` dans .gitignore
- ✅ Variables secrètes uniquement dans Vercel
- ✅ Service role key JAMAIS exposée au client
- ✅ CORS configuré dans Supabase pour le domaine Vercel

## 📊 Monitoring

**Vercel Analytics (optionnel):**
```bash
npm install @vercel/analytics
```

Ajouter dans `app/layout.tsx`:
```tsx
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

## 🌐 Domaine personnalisé (optionnel)

1. Vercel Dashboard → Project → Settings → Domains
2. Ajouter votre domaine (ex: fleetzen.com)
3. Configurer les DNS chez votre registrar
4. Certificat SSL automatique

---

**Support:** https://vercel.com/docs
