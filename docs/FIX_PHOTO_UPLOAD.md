# 🔧 Fix: Upload Photos vers Supabase Storage

**Date**: 2025-10-05
**Problème**: Photos capturées mais n'arrivent jamais dans le bucket Supabase
**Symptômes**: Toast "succès" affiché, nombre de photos visible dans historique, mais bucket vide et photos corrompues

---

## 🚨 Problème Identifié

### 1. **Conversion File manquante** (CRITIQUE)

**Fichier**: [`src/app/api/interventions/route.ts:357`](src/app/api/interventions/route.ts#L357)

**Code problématique**:
```typescript
// ❌ AVANT: Envoi direct du File object (ne fonctionne pas en Node.js)
const { error: uploadError } = await storageClient.storage
  .from('intervention-photos')
  .upload(fileName, photoFile, { ... }); // photoFile est un File object du navigateur
```

**Problème**: Dans l'API route Next.js (environnement Node.js), le `File` object du navigateur doit être converti en `Buffer` ou `ArrayBuffer` avant l'upload vers Supabase Storage.

### 2. **Gestion d'erreur silencieuse**

```typescript
if (uploadError) {
  logError(uploadError);
  return null; // ⚠️ Continue sans bloquer ni alerter l'utilisateur
}
```

Le système retournait `null` sans lever d'exception, donc l'intervention était marquée "créée avec succès" même si les photos n'avaient pas été uploadées.

---

## ✅ Solution Implémentée

### Changements dans `src/app/api/interventions/route.ts`

#### 1. **Conversion File → Buffer**

```typescript
// ✅ APRÈS: Conversion explicite File → ArrayBuffer → Buffer
const uploadPhoto = async (photoFile: File, type: string, index: number): Promise<string | null> => {
  if (!photoFile || photoFile.size === 0) {
    logger.warn({ type, index }, '⚠️ Photo file is null or empty');
    return null;
  }

  try {
    // 🔑 CONVERSION CRITIQUE
    const arrayBuffer = await photoFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const fileExtension = photoFile.name.split('.').pop() || 'jpg';
    const fileName = `${data.id}/${type}-${Date.now()}-${index}.${fileExtension}`;

    logger.info({
      type,
      index,
      size: photoFile.size,
      bufferSize: buffer.length, // ✅ Vérifier taille Buffer
      name: photoFile.name || 'unnamed',
      contentType: photoFile.type,
      fileName
    }, '📤 Uploading photo to Supabase Storage');

    // Upload avec Buffer au lieu de File
    const { data: uploadData, error: uploadError } = await storageClient.storage
      .from('intervention-photos')
      .upload(fileName, buffer, { // ✅ buffer au lieu de photoFile
        contentType: photoFile.type || 'image/jpeg',
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      logError(uploadError, {
        context: 'Photo upload FAILED',
        type,
        index,
        fileName,
        errorMessage: uploadError.message
      });
      return null;
    }

    logger.info({
      fileName,
      type,
      uploadPath: uploadData?.path
    }, '✅ Photo uploaded to Supabase Storage');

    const { data: { publicUrl } } = storageClient.storage
      .from('intervention-photos')
      .getPublicUrl(fileName);

    logger.debug({ publicUrl }, 'Public URL generated');

    return publicUrl;
  } catch (error) {
    logError(error, {
      context: 'Photo upload exception',
      type,
      index
    });
    return null;
  }
};
```

#### 2. **Logs détaillés**

- `📤 Starting photo upload` - Avant upload (avec taille buffer)
- `✅ Photo uploaded` - Après succès (avec path Supabase)
- `⚠️ Photo file is null or empty` - Si File vide
- `Photo upload FAILED` - Si erreur Supabase avec message détaillé

---

## 🔍 Vérifications à Effectuer

### 1. **Configuration Bucket Supabase**

Vérifier que le bucket `intervention-photos` existe et est configuré :

```sql
-- Dans Supabase SQL Editor
SELECT * FROM storage.buckets WHERE name = 'intervention-photos';
```

**Configuration requise**:
- ✅ Bucket public (`public = true`) pour génération d'URLs publiques
- ✅ RLS policies pour `INSERT` avec Service Role Key

### 2. **Permissions Storage**

Vérifier les RLS policies sur `storage.objects` :

```sql
-- Policy pour Service Role (bypasse RLS)
CREATE POLICY "Service role can upload intervention photos"
ON storage.objects
FOR INSERT
TO service_role
USING (bucket_id = 'intervention-photos');
```

### 3. **Variables d'environnement**

Vérifier que la **Service Role Key** est bien configurée :

```bash
# .env.local
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...  # Clé avec bypass RLS
```

---

## 📊 Tests à Effectuer

### Test 1: Upload photo réelle

1. Prendre une photo depuis mobile
2. Soumettre l'intervention
3. Vérifier logs Vercel :
   ```
   📤 Uploading photo to Supabase Storage
   ✅ Photo uploaded to Supabase Storage
   ```
4. Vérifier bucket Supabase : fichier présent dans `{intervention_id}/avant-{timestamp}-0.jpg`
5. Vérifier URL publique accessible

### Test 2: Vérifier métadonnées BDD

```sql
SELECT
  id,
  metadata->'photos'->>'photosAvant' as photos_avant,
  metadata->'photos'->>'photosApres' as photos_apres
FROM interventions
WHERE id = '{intervention_id}';
```

### Test 3: Compression photos

Vérifier que les photos utilisent bien `PhotoUploadMultiple.tsx` (AVEC compression) :

- ✅ **LavageSteps** - Utilise `PhotoUploadMultiple`
- ✅ **CarburantLivraisonSteps** - Utilise `PhotoUploadMultiple`
- ✅ **CarburantCuveSteps** - Utilise `PhotoUploadMultiple`
- ❌ **InterventionForm** - Utilise `PhotoCapture` (SANS compression) ⚠️

---

## 🎯 Prochaines Étapes

### Priorité HAUTE

1. **Vérifier bucket Supabase** existe et est public
2. **Tester upload** avec vraie photo depuis mobile
3. **Consulter logs Vercel** pour détecter erreurs upload

### Améliorations Futures

1. **Ajouter compression dans PhotoCapture.tsx** (actuellement seul PhotoUploadMultiple compresse)
2. **Créer table `intervention_photos`** dédiée (au lieu de stocker dans `metadata`)
3. **Ajouter retry logic** en cas d'échec upload temporaire
4. **Implémenter upload progressif** avec indicateur de progression

---

## 📚 Références

- [Supabase Storage Upload](https://supabase.com/docs/reference/javascript/storage-from-upload)
- [Next.js File Upload](https://nextjs.org/docs/app/building-your-application/routing/route-handlers#formdata)
- [Buffer vs File in Node.js](https://nodejs.org/api/buffer.html)

---

## 🔄 Changelog

**[2025-10-05]** - Fix conversion File → Buffer pour upload Supabase Storage
- Ajout conversion explicite `photoFile.arrayBuffer()` → `Buffer.from()`
- Ajout logs détaillés pour debug upload
- Correction gestion erreur (logs plus explicites)
