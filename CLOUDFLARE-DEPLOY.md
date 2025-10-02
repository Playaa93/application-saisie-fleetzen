# 🚀 Cloudflare Pages Deployment Guide - FleetZen PWA

## Pourquoi Cloudflare Pages ?

✅ **Edge Computing Global** - 330+ data centers dans le monde
✅ **PWA Optimisé** - Workers parfaits pour Service Worker
✅ **Bande passante illimitée** - 0€ pour toujours
✅ **Build ultra-rapide** - 30-60 secondes
✅ **Next.js 15 natif** - Support excellent
✅ **0 cold start** - Workers toujours chauds

## 📋 Prérequis

- Compte Cloudflare (gratuit)
- Wrangler CLI installé ✅
- Repository GitHub connecté

## 🔧 Configuration

### 1. Authentification Cloudflare

```bash
# Se connecter à Cloudflare
wrangler login

# Vérifier l'authentification
wrangler whoami
```

### 2. Variables d'environnement

Créer les variables dans le dashboard Cloudflare Pages :

```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

**OU** utiliser le CLI :

```bash
# Définir les variables pour production
wrangler pages secret put NEXT_PUBLIC_SUPABASE_URL
wrangler pages secret put NEXT_PUBLIC_SUPABASE_ANON_KEY
```

### 3. Développement local

```bash
# Copier le fichier d'environnement
cp .dev.vars.example .dev.vars

# Ajouter vos variables dans .dev.vars
# Lancer le serveur de dev local
npm run preview
```

## 🚀 Déploiement

### Option 1 : Via CLI (Recommandé)

```bash
# Build + Deploy en une commande
npm run deploy

# OU manuellement
npm run build
wrangler pages deploy .vercel/output/static
```

### Option 2 : Via GitHub (Auto-deploy)

1. Connecter le repo sur [dash.cloudflare.com](https://dash.cloudflare.com)
2. Aller dans **Pages** → **Create a project**
3. Sélectionner le repository GitHub
4. Configuration :
   - **Build command**: `npm run build`
   - **Build output directory**: `.vercel/output/static`
   - **Root directory**: `/`
   - **Node version**: `20`

5. Ajouter les variables d'environnement
6. **Deploy**

## 📊 Configuration Build

Le projet est configuré avec :

```json
{
  "scripts": {
    "build": "npx @cloudflare/next-on-pages",
    "preview": "npm run build && wrangler pages dev",
    "deploy": "npm run build && wrangler pages deploy"
  }
}
```

**wrangler.toml** :
```toml
name = "application-agents-fleetzen"
compatibility_date = "2025-10-02"
pages_build_output_dir = ".vercel/output/static"
```

## 🌍 URLs de déploiement

- **Production** : `https://application-agents-fleetzen.pages.dev`
- **Preview** : `https://[branch]--application-agents-fleetzen.pages.dev`

## ✅ Post-Déploiement

### Vérifier que tout fonctionne :

```bash
# Tester le build localement
npm run preview

# Ouvrir http://localhost:8788
```

**Checklist** :
- [ ] Service Worker enregistré (`/sw.js` accessible)
- [ ] Mode offline fonctionne (`/offline`)
- [ ] PWA installable (icône + dans barre d'adresse)
- [ ] API Supabase connectée
- [ ] Images chargent correctement
- [ ] Formulaires d'intervention fonctionnent
- [ ] Photos uploadées

## 🔥 Fonctionnalités Cloudflare

### Workers Edge Computing
- **0ms cold start** - Toujours chaud
- **Latence < 50ms** - Partout dans le monde
- **Auto-scaling** - Gère n'importe quelle charge

### Cache & CDN
- **Cache intelligent** - Assets statiques mis en cache automatiquement
- **Image optimization** - Compression et formats modernes (WebP, AVIF)
- **Gzip/Brotli** - Compression automatique

### Analytics (gratuit)
- **Web Analytics** - Visiteurs, pages vues, performance
- **Performance metrics** - Core Web Vitals
- **Logs en temps réel** - Debugging facile

## 🐛 Dépannage

### Build échoue

```bash
# Nettoyer et rebuilder
rm -rf .next node_modules
npm install
npm run build
```

### Service Worker ne s'enregistre pas

Vérifier les headers dans `next.config.js` :
```javascript
{
  source: '/sw.js',
  headers: [
    { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' },
    { key: 'Service-Worker-Allowed', value: '/' }
  ]
}
```

### Variables d'environnement manquantes

```bash
# Lister les variables
wrangler pages deployment list

# Ajouter une variable
wrangler pages secret put VARIABLE_NAME
```

### Logs de débogage

```bash
# Voir les logs en temps réel
wrangler pages deployment tail

# Voir les logs d'un déploiement spécifique
wrangler pages deployment logs [DEPLOYMENT_ID]
```

## 📈 Performance attendue

- **Build time** : 30-60 secondes
- **Deploy time** : 10-20 secondes
- **TTFB** : < 50ms (Edge)
- **Lighthouse Score** : 95+ (PWA)
- **Bundle size** : ~100KB (gzippé)

## 🔐 Sécurité

Cloudflare ajoute automatiquement :
- **DDoS protection** - Protection L3/L4/L7
- **Bot protection** - Filtrage des bots malveillants
- **SSL/TLS** - HTTPS automatique
- **WAF** - Web Application Firewall (plan payant)

## 💰 Coûts

**Plan gratuit** (largement suffisant) :
- ✅ Builds illimités
- ✅ Bande passante illimitée
- ✅ 500 builds/mois
- ✅ 1 build concurrent
- ✅ Web Analytics
- ✅ SSL automatique

**Plan Pro** (20$/mois) - Si besoin :
- ⚡ 5000 builds/mois
- ⚡ 5 builds concurrents
- ⚡ Advanced Analytics
- ⚡ Support prioritaire

## 🚀 Commandes utiles

```bash
# Voir les déploiements
wrangler pages deployment list

# Rollback à un déploiement précédent
wrangler pages deployment rollback [DEPLOYMENT_ID]

# Voir les logs
wrangler pages deployment tail

# Supprimer un projet
wrangler pages project delete application-agents-fleetzen

# Mettre à jour wrangler
npm update -g wrangler
```

## 🎯 Prochaines étapes

1. **Custom Domain** : Ajouter `fleetzen.votredomaine.com`
2. **Analytics** : Activer Web Analytics gratuit
3. **Monitoring** : Configurer les alertes
4. **CI/CD** : Auto-deploy sur push

## 📞 Support

- **Documentation** : [developers.cloudflare.com/pages](https://developers.cloudflare.com/pages)
- **Discord** : [discord.gg/cloudflaredev](https://discord.gg/cloudflaredev)
- **Status** : [cloudflarestatus.com](https://cloudflarestatus.com)

---

**Pro tip** : Utilise `wrangler pages deployment tail` pour voir les logs en temps réel pendant le développement ! 🔥
