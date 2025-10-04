-- ============================================================================
-- Migration: Multi-Tenant RBAC (Role-Based Access Control)
-- Date: 2025-10-05
-- Description: Ajouter support multi-tenant avec client_users et user_type
-- ============================================================================

-- ============================================================================
-- 1. AJOUTER user_type DANS agents
-- ============================================================================

-- Créer ENUM pour user_type si n'existe pas
DO $$ BEGIN
    CREATE TYPE user_type_enum AS ENUM ('field_agent', 'admin', 'super_admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Ajouter colonne user_type dans agents
ALTER TABLE agents
ADD COLUMN IF NOT EXISTS user_type user_type_enum DEFAULT 'field_agent';

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_agents_user_type ON agents(user_type);

-- Mettre à jour agents existants avec role admin → user_type admin
UPDATE agents
SET user_type = 'admin'::user_type_enum
WHERE role = 'admin' AND user_type = 'field_agent';

COMMENT ON COLUMN agents.user_type IS 'Type utilisateur: field_agent (app mobile), admin (portail admin), super_admin (accès total)';

-- ============================================================================
-- 2. CRÉER TABLE client_users
-- ============================================================================

CREATE TABLE IF NOT EXISTS client_users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(200),
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes pour performance
CREATE INDEX IF NOT EXISTS idx_client_users_client ON client_users(client_id);
CREATE INDEX IF NOT EXISTS idx_client_users_email ON client_users(email);
CREATE INDEX IF NOT EXISTS idx_client_users_active ON client_users(is_active);

COMMENT ON TABLE client_users IS 'Utilisateurs côté client avec accès read-only à leur flotte';

-- Note: Trigger updated_at sera ajouté manuellement après migration si nécessaire

-- ============================================================================
-- 3. ROW-LEVEL SECURITY (RLS) - ENABLE
-- ============================================================================

-- Enable RLS sur toutes les tables critiques
ALTER TABLE interventions ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_users ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 4. RLS POLICIES - INTERVENTIONS
-- ============================================================================

-- DROP policies existantes si existent
DROP POLICY IF EXISTS agents_own_interventions ON interventions;
DROP POLICY IF EXISTS admins_all_interventions ON interventions;
DROP POLICY IF EXISTS clients_own_fleet_interventions ON interventions;

-- Policy 1: Agents voient leurs propres interventions
CREATE POLICY agents_own_interventions ON interventions
    FOR SELECT
    USING (
        agent_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM agents
            WHERE id = auth.uid()
            AND user_type = 'field_agent'
        )
    );

-- Policy 2: Admins voient TOUTES les interventions
CREATE POLICY admins_all_interventions ON interventions
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM agents
            WHERE id = auth.uid()
            AND user_type IN ('admin', 'super_admin')
        )
    );

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

-- ============================================================================
-- 5. RLS POLICIES - CLIENTS
-- ============================================================================

DROP POLICY IF EXISTS admins_all_clients ON clients;
DROP POLICY IF EXISTS clients_own_info ON clients;

-- Admins voient tous les clients
CREATE POLICY admins_all_clients ON clients
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM agents
            WHERE id = auth.uid()
            AND user_type IN ('admin', 'super_admin')
        )
    );

-- Clients voient leurs propres infos
CREATE POLICY clients_own_info ON clients
    FOR SELECT
    USING (
        id IN (
            SELECT client_id FROM client_users
            WHERE id = auth.uid()
        )
    );

-- ============================================================================
-- 6. RLS POLICIES - VEHICLES
-- ============================================================================

DROP POLICY IF EXISTS admins_all_vehicles ON vehicles;
DROP POLICY IF EXISTS clients_own_fleet_vehicles ON vehicles;

-- Admins voient tous les véhicules
CREATE POLICY admins_all_vehicles ON vehicles
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM agents
            WHERE id = auth.uid()
            AND user_type IN ('admin', 'super_admin')
        )
    );

-- Clients voient véhicules de leur flotte
CREATE POLICY clients_own_fleet_vehicles ON vehicles
    FOR SELECT
    USING (
        client_id IN (
            SELECT client_id FROM client_users
            WHERE id = auth.uid()
        )
    );

-- ============================================================================
-- 7. RLS POLICIES - AGENTS (Admin only)
-- ============================================================================

DROP POLICY IF EXISTS admins_manage_agents ON agents;

-- Seuls les admins peuvent gérer les agents
CREATE POLICY admins_manage_agents ON agents
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM agents
            WHERE id = auth.uid()
            AND user_type IN ('admin', 'super_admin')
        )
    );

-- ============================================================================
-- 8. RLS POLICIES - CLIENT_USERS (Admin + Self-read)
-- ============================================================================

DROP POLICY IF EXISTS admins_manage_client_users ON client_users;
DROP POLICY IF EXISTS client_users_own_profile ON client_users;

-- Admins gèrent tous les client_users
CREATE POLICY admins_manage_client_users ON client_users
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM agents
            WHERE id = auth.uid()
            AND user_type IN ('admin', 'super_admin')
        )
    );

-- Client_users peuvent voir leur propre profil
CREATE POLICY client_users_own_profile ON client_users
    FOR SELECT
    USING (id = auth.uid());

-- ============================================================================
-- 9. HELPER FUNCTION - Get User Role
-- ============================================================================

CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
DECLARE
    user_role TEXT;
BEGIN
    -- Check if user is admin/super_admin
    SELECT user_type::TEXT INTO user_role
    FROM agents
    WHERE id = auth.uid();

    IF user_role IS NOT NULL THEN
        RETURN user_role;
    END IF;

    -- Check if user is client
    IF EXISTS (SELECT 1 FROM client_users WHERE id = auth.uid()) THEN
        RETURN 'client';
    END IF;

    -- Default
    RETURN 'unknown';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_user_role() IS 'Retourne le rôle de l''utilisateur connecté (field_agent, admin, super_admin, client, unknown)';

-- ============================================================================
-- 10. HELPER FUNCTION - Get Client ID for Client User
-- ============================================================================

CREATE OR REPLACE FUNCTION get_user_client_id()
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT client_id
        FROM client_users
        WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_user_client_id() IS 'Retourne le client_id de l''utilisateur client connecté (NULL si pas client)';
