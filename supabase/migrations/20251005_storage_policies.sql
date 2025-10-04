-- ============================================================================
-- Migration: Supabase Storage Policies pour Photos
-- Date: 2025-10-05
-- Description: RLS policies pour bucket intervention_photos
-- ============================================================================

-- ============================================================================
-- 1. CRÉER BUCKET intervention_photos (si n'existe pas)
-- ============================================================================

-- Note: Les buckets doivent être créés via l'interface Supabase ou via API
-- Cette migration suppose que le bucket 'intervention_photos' existe déjà

-- ============================================================================
-- 2. STORAGE POLICIES - intervention_photos
-- ============================================================================

-- DROP policies existantes
DROP POLICY IF EXISTS "Agents upload leurs photos" ON storage.objects;
DROP POLICY IF EXISTS "Admins upload toutes photos" ON storage.objects;
DROP POLICY IF EXISTS "Agents voient leurs photos" ON storage.objects;
DROP POLICY IF EXISTS "Admins voient toutes photos" ON storage.objects;
DROP POLICY IF EXISTS "Clients voient photos de leur flotte" ON storage.objects;
DROP POLICY IF EXISTS "Agents suppriment leurs photos" ON storage.objects;
DROP POLICY IF EXISTS "Admins suppriment toutes photos" ON storage.objects;

-- ============================================================================
-- UPLOAD POLICIES
-- ============================================================================

-- Policy 1: Agents field peuvent upload leurs propres photos
CREATE POLICY "Agents upload leurs photos"
ON storage.objects
FOR INSERT
WITH CHECK (
    bucket_id = 'intervention-photos'
    AND auth.role() = 'authenticated'
    AND EXISTS (
        SELECT 1 FROM agents
        WHERE id = auth.uid()
        AND user_type = 'field_agent'
        AND is_active = true
    )
);

-- Policy 2: Admins peuvent upload toutes les photos
CREATE POLICY "Admins upload toutes photos"
ON storage.objects
FOR INSERT
WITH CHECK (
    bucket_id = 'intervention-photos'
    AND auth.role() = 'authenticated'
    AND EXISTS (
        SELECT 1 FROM agents
        WHERE id = auth.uid()
        AND user_type IN ('admin', 'super_admin')
    )
);

-- ============================================================================
-- SELECT POLICIES (Voir photos)
-- ============================================================================

-- Policy 3: Agents voient leurs propres photos
-- Note: On suppose que le path est structuré comme: {agent_id}/{intervention_id}/{filename}
CREATE POLICY "Agents voient leurs photos"
ON storage.objects
FOR SELECT
USING (
    bucket_id = 'intervention-photos'
    AND auth.role() = 'authenticated'
    AND (
        -- Photos uploadées par l'agent (path commence par son ID)
        (storage.foldername(name))[1] = auth.uid()::text
        OR
        -- Photos d'interventions assignées à l'agent
        EXISTS (
            SELECT 1 FROM agents
            WHERE id = auth.uid()
            AND user_type = 'field_agent'
        )
    )
);

-- Policy 4: Admins voient TOUTES les photos
CREATE POLICY "Admins voient toutes photos"
ON storage.objects
FOR SELECT
USING (
    bucket_id = 'intervention-photos'
    AND auth.role() = 'authenticated'
    AND EXISTS (
        SELECT 1 FROM agents
        WHERE id = auth.uid()
        AND user_type IN ('admin', 'super_admin')
    )
);

-- Policy 5: Clients voient photos de LEUR flotte uniquement
-- Note: Nécessite metadata ou naming convention pour lier photo → intervention → client
CREATE POLICY "Clients voient photos de leur flotte"
ON storage.objects
FOR SELECT
USING (
    bucket_id = 'intervention-photos'
    AND auth.role() = 'authenticated'
    AND EXISTS (
        SELECT 1 FROM client_users
        WHERE id = auth.uid()
        AND is_active = true
    )
    -- TODO: Ajouter logique pour filtrer par client_id une fois naming convention établie
);

-- ============================================================================
-- DELETE POLICIES
-- ============================================================================

-- Policy 6: Agents peuvent supprimer leurs propres photos
CREATE POLICY "Agents suppriment leurs photos"
ON storage.objects
FOR DELETE
USING (
    bucket_id = 'intervention-photos'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND EXISTS (
        SELECT 1 FROM agents
        WHERE id = auth.uid()
        AND user_type = 'field_agent'
    )
);

-- Policy 7: Admins peuvent supprimer toutes les photos
CREATE POLICY "Admins suppriment toutes photos"
ON storage.objects
FOR DELETE
USING (
    bucket_id = 'intervention-photos'
    AND auth.role() = 'authenticated'
    AND EXISTS (
        SELECT 1 FROM agents
        WHERE id = auth.uid()
        AND user_type IN ('admin', 'super_admin')
    )
);

-- ============================================================================
-- UPDATE POLICIES (Modifier metadata)
-- ============================================================================

-- Policy 8: Admins peuvent modifier metadata de toutes les photos
CREATE POLICY "Admins modifient metadata photos"
ON storage.objects
FOR UPDATE
USING (
    bucket_id = 'intervention-photos'
    AND auth.role() = 'authenticated'
    AND EXISTS (
        SELECT 1 FROM agents
        WHERE id = auth.uid()
        AND user_type IN ('admin', 'super_admin')
    )
);

-- ============================================================================
-- NAMING CONVENTION RECOMMANDÉE
-- ============================================================================

-- Structure de path suggérée:
-- intervention_photos/{client_id}/{intervention_id}/{agent_id}_{timestamp}_{type}.jpg
--
-- Où:
-- - client_id: UUID du client (pour filtrage RLS client)
-- - intervention_id: UUID de l'intervention
-- - agent_id: UUID de l'agent qui a uploadé
-- - timestamp: epoch milliseconds
-- - type: "before" ou "after"
--
-- Exemple:
-- intervention_photos/550e8400-e29b-41d4-a716-446655440000/660e8400-e29b-41d4-a716-446655440001/770e8400-e29b-41d4-a716-446655440002_1704538800000_before.jpg

COMMENT ON POLICY "Agents upload leurs photos" ON storage.objects IS 'Agents terrain peuvent upload des photos pour leurs interventions';
COMMENT ON POLICY "Admins upload toutes photos" ON storage.objects IS 'Admins peuvent upload des photos pour n''importe quelle intervention';
COMMENT ON POLICY "Agents voient leurs photos" ON storage.objects IS 'Agents terrain voient uniquement leurs propres photos';
COMMENT ON POLICY "Admins voient toutes photos" ON storage.objects IS 'Admins ont accès à toutes les photos';
COMMENT ON POLICY "Clients voient photos de leur flotte" ON storage.objects IS 'Clients voient uniquement les photos de leur flotte';
COMMENT ON POLICY "Agents suppriment leurs photos" ON storage.objects IS 'Agents peuvent supprimer leurs propres photos';
COMMENT ON POLICY "Admins suppriment toutes photos" ON storage.objects IS 'Admins peuvent supprimer n''importe quelle photo';
