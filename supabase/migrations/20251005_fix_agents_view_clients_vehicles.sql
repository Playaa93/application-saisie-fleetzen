-- ============================================================================
-- Migration: Allow agents to view clients/vehicles from their interventions
-- Date: 2025-10-05
-- Description: Agents field doivent pouvoir voir clients/véhicules de leurs interventions
-- ============================================================================

-- ============================================================================
-- 1. CLIENTS - Ajouter policy pour agents field
-- ============================================================================

-- DROP et recréer policies clients
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

-- NOUVEAU: Agents field peuvent voir les clients de leurs interventions
CREATE POLICY agents_view_intervention_clients ON clients
    FOR SELECT
    USING (
        is_field_agent(auth.uid())
        AND id IN (
            SELECT client_id FROM interventions
            WHERE agent_id = auth.uid()
        )
    );

COMMENT ON POLICY admins_all_clients ON clients IS 'Admins gèrent tous les clients';
COMMENT ON POLICY clients_own_info ON clients IS 'Clients voient leurs propres infos';
COMMENT ON POLICY agents_view_intervention_clients ON clients IS 'Agents field voient clients de leurs interventions';

-- ============================================================================
-- 2. VEHICLES - Ajouter policy pour agents field
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

-- NOUVEAU: Agents field peuvent voir les véhicules de leurs interventions
CREATE POLICY agents_view_intervention_vehicles ON vehicles
    FOR SELECT
    USING (
        is_field_agent(auth.uid())
        AND id IN (
            SELECT vehicle_id FROM interventions
            WHERE agent_id = auth.uid()
        )
    );

COMMENT ON POLICY admins_all_vehicles ON vehicles IS 'Admins gèrent tous les véhicules';
COMMENT ON POLICY clients_own_fleet_vehicles ON vehicles IS 'Clients voient leur flotte';
COMMENT ON POLICY agents_view_intervention_vehicles ON vehicles IS 'Agents field voient véhicules de leurs interventions';
