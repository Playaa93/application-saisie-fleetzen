-- ============================================================================
-- Migration: Fix Photos Table RLS (CRITICAL SECURITY)
-- Date: 2025-10-05
-- Description: Enable RLS and add policies for photos table
-- ============================================================================

-- ============================================================================
-- 1. ENABLE RLS ON PHOTOS TABLE
-- ============================================================================

ALTER TABLE photos ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE photos IS 'Photos d''interventions avec RLS activée pour sécurité multi-tenant';

-- ============================================================================
-- 2. DROP EXISTING POLICIES (si existent)
-- ============================================================================

DROP POLICY IF EXISTS "Agents upload photos de leurs interventions" ON photos;
DROP POLICY IF EXISTS "Admins upload toutes photos" ON photos;
DROP POLICY IF EXISTS "Agents voient photos de leurs interventions" ON photos;
DROP POLICY IF EXISTS "Admins voient toutes photos" ON photos;
DROP POLICY IF EXISTS "Clients voient photos de leur flotte" ON photos;
DROP POLICY IF EXISTS "Agents suppriment leurs photos" ON photos;
DROP POLICY IF EXISTS "Admins suppriment toutes photos" ON photos;
DROP POLICY IF EXISTS "Admins modifient metadata photos" ON photos;

-- ============================================================================
-- 3. INSERT POLICIES - Agents peuvent upload leurs photos
-- ============================================================================

-- Policy 1: Agents field peuvent créer des photos pour leurs interventions
CREATE POLICY "Agents upload photos de leurs interventions"
ON photos
FOR INSERT
WITH CHECK (
    auth.role() = 'authenticated'
    AND EXISTS (
        SELECT 1 FROM agents
        WHERE id = auth.uid()
        AND user_type = 'field_agent'
        AND is_active = true
    )
    AND EXISTS (
        -- Vérifie que l'intervention appartient à l'agent
        SELECT 1 FROM interventions
        WHERE id = photos.intervention_id
        AND agent_id = auth.uid()
    )
);

-- Policy 2: Admins peuvent créer n'importe quelle photo
CREATE POLICY "Admins upload toutes photos"
ON photos
FOR INSERT
WITH CHECK (
    auth.role() = 'authenticated'
    AND EXISTS (
        SELECT 1 FROM agents
        WHERE id = auth.uid()
        AND user_type IN ('admin', 'super_admin')
    )
);

-- ============================================================================
-- 4. SELECT POLICIES - Voir les photos
-- ============================================================================

-- Policy 3: Agents voient photos de leurs propres interventions
CREATE POLICY "Agents voient photos de leurs interventions"
ON photos
FOR SELECT
USING (
    auth.role() = 'authenticated'
    AND EXISTS (
        SELECT 1 FROM interventions
        WHERE id = photos.intervention_id
        AND agent_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM agents
            WHERE id = auth.uid()
            AND user_type = 'field_agent'
        )
    )
);

-- Policy 4: Admins voient TOUTES les photos
CREATE POLICY "Admins voient toutes photos"
ON photos
FOR SELECT
USING (
    auth.role() = 'authenticated'
    AND EXISTS (
        SELECT 1 FROM agents
        WHERE id = auth.uid()
        AND user_type IN ('admin', 'super_admin')
    )
);

-- Policy 5: Clients voient photos des interventions de LEUR flotte uniquement
CREATE POLICY "Clients voient photos de leur flotte"
ON photos
FOR SELECT
USING (
    auth.role() = 'authenticated'
    AND EXISTS (
        SELECT 1 FROM interventions i
        JOIN client_users cu ON cu.client_id = i.client_id
        WHERE i.id = photos.intervention_id
        AND cu.id = auth.uid()
        AND cu.is_active = true
    )
);

-- ============================================================================
-- 5. DELETE POLICIES
-- ============================================================================

-- Policy 6: Agents peuvent supprimer leurs propres photos
CREATE POLICY "Agents suppriment leurs photos"
ON photos
FOR DELETE
USING (
    auth.role() = 'authenticated'
    AND EXISTS (
        SELECT 1 FROM interventions
        WHERE id = photos.intervention_id
        AND agent_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM agents
            WHERE id = auth.uid()
            AND user_type = 'field_agent'
        )
    )
);

-- Policy 7: Admins peuvent supprimer n'importe quelle photo
CREATE POLICY "Admins suppriment toutes photos"
ON photos
FOR DELETE
USING (
    auth.role() = 'authenticated'
    AND EXISTS (
        SELECT 1 FROM agents
        WHERE id = auth.uid()
        AND user_type IN ('admin', 'super_admin')
    )
);

-- ============================================================================
-- 6. UPDATE POLICIES
-- ============================================================================

-- Policy 8: Admins peuvent modifier metadata de toutes les photos
CREATE POLICY "Admins modifient metadata photos"
ON photos
FOR UPDATE
USING (
    auth.role() = 'authenticated'
    AND EXISTS (
        SELECT 1 FROM agents
        WHERE id = auth.uid()
        AND user_type IN ('admin', 'super_admin')
    )
);

-- ============================================================================
-- 7. COMMENTS
-- ============================================================================

COMMENT ON POLICY "Agents upload photos de leurs interventions" ON photos IS 'Agents terrain peuvent créer des photos pour leurs propres interventions';
COMMENT ON POLICY "Admins upload toutes photos" ON photos IS 'Admins peuvent créer des photos pour n''importe quelle intervention';
COMMENT ON POLICY "Agents voient photos de leurs interventions" ON photos IS 'Agents voient uniquement les photos de leurs interventions';
COMMENT ON POLICY "Admins voient toutes photos" ON photos IS 'Admins ont accès à toutes les photos';
COMMENT ON POLICY "Clients voient photos de leur flotte" ON photos IS 'Clients voient uniquement les photos des interventions de leur flotte';
COMMENT ON POLICY "Agents suppriment leurs photos" ON photos IS 'Agents peuvent supprimer leurs propres photos';
COMMENT ON POLICY "Admins suppriment toutes photos" ON photos IS 'Admins peuvent supprimer n''importe quelle photo';
COMMENT ON POLICY "Admins modifient metadata photos" ON photos IS 'Admins peuvent modifier les metadata des photos';
