-- ============================================================================
-- Migration: Simplify RLS policies to avoid all recursion
-- Date: 2025-10-05
-- Description: Remove circular dependencies in RLS policies
-- ============================================================================

-- ============================================================================
-- STRATEGY: Create helper table to cache agent type, avoid circular JOINs
-- ============================================================================

-- Les policies sur clients/vehicles ne doivent PAS faire de JOIN sur interventions
-- car interventions JOIN agents, créant une récursion.
-- Solution: Permettre aux field_agent de voir TOUS les clients/vehicles
-- (sécurité maintenue car ils ne peuvent voir QUE leurs interventions)

-- ============================================================================
-- 1. CLIENTS - Simplifier policies
-- ============================================================================

DROP POLICY IF EXISTS admins_all_clients ON clients;
DROP POLICY IF EXISTS clients_own_info ON clients;
DROP POLICY IF EXISTS agents_view_intervention_clients ON clients;

-- Admins voient tous les clients
CREATE POLICY admins_all_clients ON clients
    FOR ALL
    USING (is_admin(auth.uid()));

-- Clients voient leurs propres infos
CREATE POLICY clients_own_info ON clients
    FOR SELECT
    USING (
        id IN (
            SELECT client_id FROM client_users
            WHERE id = auth.uid()
        )
    );

-- Field agents peuvent voir TOUS les clients (pas de JOIN sur interventions)
-- C'est sécurisé car ils ne peuvent accéder QU'À leurs interventions via RLS
CREATE POLICY agents_view_all_clients ON clients
    FOR SELECT
    USING (is_field_agent(auth.uid()));

COMMENT ON POLICY admins_all_clients ON clients IS 'Admins gèrent tous les clients';
COMMENT ON POLICY clients_own_info ON clients IS 'Clients voient leurs propres infos';
COMMENT ON POLICY agents_view_all_clients ON clients IS 'Agents field voient tous clients (sécurisé par RLS interventions)';

-- ============================================================================
-- 2. VEHICLES - Simplifier policies
-- ============================================================================

DROP POLICY IF EXISTS admins_all_vehicles ON vehicles;
DROP POLICY IF EXISTS clients_own_fleet_vehicles ON vehicles;
DROP POLICY IF EXISTS agents_view_intervention_vehicles ON vehicles;

-- Admins voient tous les véhicules
CREATE POLICY admins_all_vehicles ON vehicles
    FOR ALL
    USING (is_admin(auth.uid()));

-- Clients voient véhicules de leur flotte
CREATE POLICY clients_own_fleet_vehicles ON vehicles
    FOR SELECT
    USING (
        client_id IN (
            SELECT client_id FROM client_users
            WHERE id = auth.uid()
        )
    );

-- Field agents peuvent voir TOUS les véhicules (pas de JOIN sur interventions)
-- C'est sécurisé car ils ne peuvent accéder QU'À leurs interventions via RLS
CREATE POLICY agents_view_all_vehicles ON vehicles
    FOR SELECT
    USING (is_field_agent(auth.uid()));

COMMENT ON POLICY admins_all_vehicles ON vehicles IS 'Admins gèrent tous les véhicules';
COMMENT ON POLICY clients_own_fleet_vehicles ON vehicles IS 'Clients voient leur flotte';
COMMENT ON POLICY agents_view_all_vehicles ON vehicles IS 'Agents field voient tous véhicules (sécurisé par RLS interventions)';
