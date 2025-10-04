-- ============================================================================
-- Migration: Fix RLS Infinite Recursion
-- Date: 2025-10-05
-- Description: Corriger récursion infinie policies agents/interventions
-- ============================================================================

-- ============================================================================
-- 1. CRÉER FONCTIONS HELPER SECURITY DEFINER (contournent RLS)
-- ============================================================================

-- Fonction pour vérifier si l'utilisateur est admin (bypass RLS)
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM agents
        WHERE id = user_id
        AND user_type IN ('admin', 'super_admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION is_admin(UUID) IS 'Vérifie si l''utilisateur est admin (SECURITY DEFINER bypass RLS)';

-- Fonction pour vérifier si l'utilisateur est agent field
CREATE OR REPLACE FUNCTION is_field_agent(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM agents
        WHERE id = user_id
        AND user_type = 'field_agent'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION is_field_agent(UUID) IS 'Vérifie si l''utilisateur est field agent (SECURITY DEFINER bypass RLS)';

-- ============================================================================
-- 2. RECRÉER POLICIES INTERVENTIONS AVEC FONCTIONS HELPER
-- ============================================================================

-- DROP policies existantes
DROP POLICY IF EXISTS agents_own_interventions ON interventions;
DROP POLICY IF EXISTS admins_all_interventions ON interventions;
DROP POLICY IF EXISTS clients_own_fleet_interventions ON interventions;

-- Policy 1: Agents voient leurs propres interventions (utilise fonction helper)
CREATE POLICY agents_own_interventions ON interventions
    FOR SELECT
    USING (
        agent_id = auth.uid()
        AND is_field_agent(auth.uid())
    );

-- Policy 2: Admins voient TOUTES les interventions (utilise fonction helper)
CREATE POLICY admins_all_interventions ON interventions
    FOR ALL
    USING (is_admin(auth.uid()));

-- Policy 3: Clients voient interventions de LEUR flotte uniquement
CREATE POLICY clients_own_fleet_interventions ON interventions
    FOR SELECT
    USING (
        client_id IN (
            SELECT client_id FROM client_users
            WHERE id = auth.uid()
            AND is_active = true
        )
    );

COMMENT ON POLICY agents_own_interventions ON interventions IS 'Agents field voient leurs interventions (utilise is_field_agent())';
COMMENT ON POLICY admins_all_interventions ON interventions IS 'Admins voient toutes interventions (utilise is_admin())';
COMMENT ON POLICY clients_own_fleet_interventions ON interventions IS 'Clients voient interventions de leur flotte';
