-- ============================================================================
-- VÉRIFICATION CONFIGURATION BUCKET SUPABASE
-- Script pour diagnostiquer les problèmes d'upload photos
-- ============================================================================

-- 1. Vérifier que le bucket 'intervention-photos' existe
SELECT
  id,
  name,
  public,
  created_at,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
WHERE name = 'intervention-photos';

-- Résultat attendu:
-- name: intervention-photos
-- public: true (pour générer URLs publiques)
-- file_size_limit: NULL ou >= 10485760 (10MB)
-- allowed_mime_types: NULL ou ['image/jpeg', 'image/png', 'image/webp']

-- ============================================================================

-- 2. Vérifier les RLS policies sur storage.objects
SELECT
  policyname,
  tablename,
  cmd,
  qual,
  with_check,
  roles
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects';

-- Policies attendues:
-- - Service role peut tout faire (bypasse RLS)
-- - INSERT policy pour agents authentifiés
-- - SELECT policy pour lecture publique si bucket public

-- ============================================================================

-- 3. Compter les fichiers existants dans le bucket
SELECT
  COUNT(*) as total_files,
  SUM(metadata->>'size')::bigint as total_size_bytes,
  pg_size_pretty(SUM(metadata->>'size')::bigint) as total_size_human,
  MIN(created_at) as oldest_file,
  MAX(created_at) as newest_file
FROM storage.objects
WHERE bucket_id = 'intervention-photos';

-- ============================================================================

-- 4. Lister les derniers fichiers uploadés (20 derniers)
SELECT
  name,
  bucket_id,
  owner,
  created_at,
  metadata->>'size' as size_bytes,
  pg_size_pretty((metadata->>'size')::bigint) as size_human,
  metadata->>'mimetype' as mime_type
FROM storage.objects
WHERE bucket_id = 'intervention-photos'
ORDER BY created_at DESC
LIMIT 20;

-- ============================================================================

-- 5. Vérifier les interventions avec photos
SELECT
  i.id,
  i.created_at,
  i.intervention_type_id,
  it.name as intervention_type,
  jsonb_array_length(i.metadata->'photos'->'photosAvant') as photos_avant,
  jsonb_array_length(i.metadata->'photos'->'photosApres') as photos_apres,
  i.metadata->'photos'->'photosAvant'->0->>'url' as first_photo_url
FROM interventions i
LEFT JOIN intervention_types it ON i.intervention_type_id = it.id
WHERE i.metadata->'photos' IS NOT NULL
ORDER BY i.created_at DESC
LIMIT 10;

-- ============================================================================

-- 6. Détecter les photos corrompues (URLs invalides)
SELECT
  i.id,
  i.created_at,
  photo_type,
  photo_data->>'url' as photo_url,
  CASE
    WHEN photo_data->>'url' NOT LIKE '%supabase.co%' THEN 'URL invalide'
    WHEN photo_data->>'url' IS NULL THEN 'URL NULL'
    ELSE 'OK'
  END as status
FROM interventions i,
  LATERAL (
    SELECT 'avant' as photo_type, jsonb_array_elements(i.metadata->'photos'->'photosAvant') as photo_data
    UNION ALL
    SELECT 'apres', jsonb_array_elements(i.metadata->'photos'->'photosApres')
  ) photos
WHERE i.metadata->'photos' IS NOT NULL
  AND (photo_data->>'url' IS NULL OR photo_data->>'url' NOT LIKE '%supabase.co%')
ORDER BY i.created_at DESC;

-- ============================================================================

-- 7. Statistiques upload par jour (derniers 7 jours)
SELECT
  DATE(created_at) as date,
  COUNT(*) as photos_uploaded,
  SUM((metadata->>'size')::bigint) as total_bytes,
  pg_size_pretty(SUM((metadata->>'size')::bigint)) as total_size
FROM storage.objects
WHERE bucket_id = 'intervention-photos'
  AND created_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- ============================================================================
-- COMMANDES DE RÉPARATION (À EXÉCUTER SI PROBLÈMES DÉTECTÉS)
-- ============================================================================

-- Si le bucket n'existe pas, le créer:
-- INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
-- VALUES (
--   'intervention-photos',
--   'intervention-photos',
--   true,  -- Public pour URLs publiques
--   10485760,  -- 10MB max
--   ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic']
-- );

-- Si le bucket existe mais n'est pas public:
-- UPDATE storage.buckets
-- SET public = true
-- WHERE name = 'intervention-photos';

-- Créer policy pour Service Role (bypass RLS):
-- CREATE POLICY "Service role can upload intervention photos"
-- ON storage.objects
-- FOR INSERT
-- TO service_role
-- USING (bucket_id = 'intervention-photos');

-- CREATE POLICY "Service role can read intervention photos"
-- ON storage.objects
-- FOR SELECT
-- TO service_role
-- USING (bucket_id = 'intervention-photos');

-- CREATE POLICY "Service role can delete intervention photos"
-- ON storage.objects
-- FOR DELETE
-- TO service_role
-- USING (bucket_id = 'intervention-photos');

-- Policy pour lecture publique (si bucket public):
-- CREATE POLICY "Public can view intervention photos"
-- ON storage.objects
-- FOR SELECT
-- USING (bucket_id = 'intervention-photos');

-- ============================================================================
-- NETTOYAGE (DANGER - Supprimer tous les fichiers du bucket)
-- ============================================================================

-- ⚠️ ATTENTION: Ceci supprimera TOUS les fichiers du bucket
-- DELETE FROM storage.objects WHERE bucket_id = 'intervention-photos';
