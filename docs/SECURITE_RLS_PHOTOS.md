# 🔒 Sécurité RLS - Bucket intervention-photos

**Date**: 2025-10-05
**Bucket**: `intervention-photos`
**Mode**: Public (`public: true`)

---

## 📋 Résumé de la Configuration

### Principe de Fonctionnement

**Upload** : Backend seulement (Service Role Key)
**Lecture** : URLs publiques (partageables dans emails/PDF)
**Sécurité** : RLS protège l'upload, URLs difficiles à deviner

---

## 🔐 Matrice des Permissions

### 1. **UPLOAD (INSERT)** - Qui peut uploader des photos ?

| Utilisateur | Peut uploader ? | Méthode | Policy RLS |
|-------------|----------------|---------|-----------|
| **Agent mobile** | ✅ OUI | Via API `/api/interventions` (Service Role) | Bypasse RLS |
| **Admin dashboard** | ✅ OUI | Via RLS authentifié | `Admins upload toutes photos` |
| **Client dashboard** | ❌ NON | Lecture seule | Aucune |
| **Non authentifié** | ❌ NON | ❌ Policy supprimée | ~~Allow public uploads~~ ✅ |

**⚠️ Note importante** : La policy `Agents upload leurs photos` existe mais n'est PAS utilisée car le chemin des photos est `{intervention_id}/` et non `{agent_id}/`. Les uploads agents passent par Service Role Key via l'API.

---

### 2. **LECTURE (SELECT)** - Qui peut lire les photos ?

| Utilisateur | Peut lire ? | Restriction | Policy RLS |
|-------------|------------|-------------|-----------|
| **Admin** | ✅ TOUT | Aucune | `Admins voient toutes photos` |
| **Agent** | ⚠️ Limité | Ses interventions (via RLS) | `Agents voient leurs photos` (non utilisée*) |
| **Client** | ✅ Sa flotte | Via `client_users` | `Clients voient photos de leur flotte` |
| **Public (URL)** | ✅ Si URL connue | Aucune | `Allow public reads` |

**\*Note** : Policy RLS agents existe mais chemin basé sur `intervention_id`, pas `agent_id`. En pratique, les agents accèdent via URLs publiques.

---

### 3. **SUPPRESSION (DELETE)** - Qui peut supprimer des photos ?

| Utilisateur | Peut supprimer ? | Restriction | Policy RLS |
|-------------|-----------------|-------------|-----------|
| **Admin** | ✅ TOUT | Aucune | `Admins suppriment toutes photos` |
| **Agent** | ⚠️ Limité | Ses interventions (théorique) | `Agents suppriment leurs photos` (non utilisée*) |
| **Client** | ❌ NON | Aucune | Aucune |
| **Public** | ❌ NON | Aucune | Aucune |

---

### 4. **MODIFICATION (UPDATE)** - Qui peut modifier metadata photos ?

| Utilisateur | Peut modifier ? | Restriction | Policy RLS |
|-------------|----------------|-------------|-----------|
| **Admin** | ✅ OUI | Metadata seulement | `Admins modifient metadata photos` |
| **Autres** | ❌ NON | Aucune | Aucune |

---

## 🎯 Architecture Actuelle

```
┌─────────────────────────────────────────────────────────────┐
│                    UPLOAD WORKFLOW                           │
└─────────────────────────────────────────────────────────────┘

Agent Mobile (PWA)
    │
    │ FormData + photos
    │
    ▼
POST /api/interventions
    │
    │ Service Role Key (SUPABASE_SERVICE_ROLE_KEY)
    │ Bypasse RLS ✅
    │
    ▼
Supabase Storage (intervention-photos)
    │
    │ File → Buffer → Upload
    │ Path: {intervention_id}/{type}-{timestamp}-{index}.jpg
    │
    ▼
getPublicUrl()
    │
    └──▶ https://xxx.supabase.co/storage/v1/object/public/...
         (Accessible à tous si URL connue)


┌─────────────────────────────────────────────────────────────┐
│                    READ WORKFLOW                             │
└─────────────────────────────────────────────────────────────┘

Option 1: Via RLS (Dashboard Admin/Client)
   ├─ Admin: SELECT * WHERE bucket_id = 'intervention-photos'
   ├─ Client: SELECT * WHERE client_id IN (client_users)
   └─ Agent: SELECT * WHERE agent_id = auth.uid() (non utilisé*)

Option 2: Via URL Publique (Emails, PDF, Partage)
   └─ N'importe qui avec l'URL peut voir la photo
      https://xxx.supabase.co/storage/v1/object/public/intervention-photos/...
```

---

## ⚠️ Considérations de Sécurité

### ✅ Sécurisé

1. **Upload protégé** : Seuls backend (Service Role) et admins peuvent uploader
2. **Policy dangereuse supprimée** : `Allow public uploads` ❌
3. **URLs difficiles à deviner** : UUID + timestamp rendent bruteforce impossible
4. **RLS actif** : Protège contre accès non autorisé via dashboard

### ⚠️ Points d'Attention

1. **URLs publiques** : N'importe qui avec l'URL peut voir la photo
   - **Acceptable** : Photos de véhicules (non sensibles)
   - **Risque** : Si URL divulguée (email intercepté, etc.)

2. **Pas de traçabilité lecture** : Impossible de savoir qui a consulté une photo publique

3. **Pas d'expiration** : URLs publiques valides indéfiniment
   - Avantage : Emails/PDF restent valides
   - Inconvénient : Impossible de révoquer accès

---

## 🔄 Alternative: URLs Signées

Pour sécurité maximale, possibilité de passer aux **URLs signées** :

### Changements Requis

**1. Supprimer "Allow public reads"**
```sql
DROP POLICY "Allow public reads" ON storage.objects;
```

**2. Modifier code backend**
```typescript
// ❌ AVANT: URL publique permanente
const { data: { publicUrl } } = supabase.storage
  .from('intervention-photos')
  .getPublicUrl(fileName);

// ✅ APRÈS: URL signée temporaire (1h)
const { data, error } = await supabase.storage
  .from('intervention-photos')
  .createSignedUrl(fileName, 3600); // 3600s = 1h
```

**3. Régénérer URLs périodiquement**
- URLs expirent après 1h
- Nécessite régénération pour emails/PDF

### Avantages URLs Signées

- ✅ Sécurité maximale (expiration automatique)
- ✅ Traçabilité (logs backend)
- ✅ Révocation possible (changer secret)

### Inconvénients URLs Signées

- ❌ URLs temporaires (complexité accrue)
- ❌ Emails/PDF deviennent obsolètes
- ❌ Plus de code backend nécessaire

---

## 📊 Matrice Décision: Public vs Signées

| Critère | URLs Publiques | URLs Signées |
|---------|---------------|--------------|
| **Simplicité** | ✅ Simple | ❌ Complexe |
| **Sécurité** | ⚠️ Moyenne | ✅ Maximale |
| **Partage** | ✅ Facile | ❌ Difficile |
| **Emails/PDF** | ✅ Permanent | ❌ Expire |
| **Traçabilité** | ❌ Aucune | ✅ Complète |
| **Révocation** | ❌ Impossible | ✅ Possible |

**Recommandation actuelle** : URLs publiques (suffisant pour photos véhicules)

---

## 🛡️ Bonnes Pratiques

### 1. Minimiser Divulgation URLs

- ❌ Ne PAS inclure URLs dans logs publics
- ❌ Ne PAS afficher URLs dans source HTML client
- ✅ Utiliser proxies/redirections si possible
- ✅ Monitorer accès suspect

### 2. Validation Upload

- ✅ Vérifier MIME type (image/jpeg, image/png, etc.)
- ✅ Limiter taille fichier (10MB max)
- ✅ Compresser photos côté client
- ✅ Scanner malware si critique

### 3. Archivage

- ✅ Lifecycle policies pour archivage (après 1 an → cold storage)
- ✅ Backup automatique
- ✅ Purge interventions supprimées

---

## 🔍 Audit Checklist

Pour vérifier la sécurité régulièrement :

```sql
-- 1. Vérifier que "Allow public uploads" n'existe pas
SELECT * FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname = 'Allow public uploads';
-- Résultat attendu: 0 lignes ✅

-- 2. Vérifier bucket est public
SELECT name, public FROM storage.buckets
WHERE name = 'intervention-photos';
-- Résultat attendu: public = true ✅

-- 3. Compter uploads suspects (hors heures bureau)
SELECT DATE(created_at), COUNT(*)
FROM storage.objects
WHERE bucket_id = 'intervention-photos'
  AND EXTRACT(HOUR FROM created_at) NOT BETWEEN 6 AND 22
GROUP BY DATE(created_at)
ORDER BY DATE(created_at) DESC;

-- 4. Vérifier tailles anormales (> 10MB)
SELECT name, pg_size_pretty((metadata->>'size')::bigint) as size
FROM storage.objects
WHERE bucket_id = 'intervention-photos'
  AND (metadata->>'size')::bigint > 10485760;
-- Résultat attendu: 0 lignes ✅
```

---

## 📚 Références

- [Supabase Storage Security](https://supabase.com/docs/guides/storage/security/access-control)
- [RLS Policies Best Practices](https://supabase.com/docs/guides/auth/row-level-security)
- [Signed URLs Documentation](https://supabase.com/docs/reference/javascript/storage-from-createsignedurl)

---

## 🔄 Changelog Sécurité

**[2025-10-05]** - Sécurisation bucket intervention-photos
- ✅ Suppression policy "Allow public uploads" (upload non-auth bloqué)
- ✅ Bucket mis en mode public pour URLs publiques
- ✅ Conservation "Allow public reads" (nécessaire pour emails/PDF)
- ✅ Upload via Service Role Key uniquement (backend)
- ⚠️ URLs publiques acceptées (photos véhicules non sensibles)
