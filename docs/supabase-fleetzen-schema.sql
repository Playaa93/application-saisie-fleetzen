-- ============================================================================
-- FLEETZEN DATABASE SCHEMA FOR SUPABASE
-- PostgreSQL 15+ with Supabase extensions
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis"; -- For geospatial coordinates

-- ============================================================================
-- 1. AGENTS (Field Agents & Users)
-- ============================================================================

CREATE TYPE agent_role AS ENUM ('admin', 'supervisor', 'field_agent');

CREATE TABLE agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    role agent_role NOT NULL DEFAULT 'field_agent',
    password_hash VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_agents_email ON agents(email);
CREATE INDEX idx_agents_role ON agents(role);
CREATE INDEX idx_agents_active ON agents(is_active);

-- ============================================================================
-- 2. CLIENTS
-- ============================================================================

CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    address TEXT,
    city VARCHAR(100),
    postal_code VARCHAR(10),
    contact_name VARCHAR(100),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(20),
    coordinates JSONB, -- {lat: number, lng: number}
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_clients_code ON clients(code);
CREATE INDEX idx_clients_city ON clients(city);
CREATE INDEX idx_clients_active ON clients(is_active);

-- ============================================================================
-- 3. VEHICLES
-- ============================================================================

CREATE TYPE fuel_type AS ENUM ('Diesel', 'SP95', 'SP98', 'E85', 'Electric', 'Hybrid', 'GNV');

CREATE TABLE vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
    license_plate VARCHAR(20) UNIQUE NOT NULL,
    make VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    year INTEGER,
    fuel_type fuel_type,
    tank_capacity DECIMAL(10, 2), -- in liters
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_vehicles_client ON vehicles(client_id);
CREATE INDEX idx_vehicles_plate ON vehicles(license_plate);
CREATE INDEX idx_vehicles_active ON vehicles(is_active);

-- ============================================================================
-- 4. INTERVENTION TYPES
-- ============================================================================

CREATE TABLE intervention_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    icon VARCHAR(50), -- Lucide icon name
    color VARCHAR(7), -- Hex color code
    requires_vehicle BOOLEAN DEFAULT true,
    requires_photos BOOLEAN DEFAULT false,
    min_photos INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_intervention_types_code ON intervention_types(code);
CREATE INDEX idx_intervention_types_active ON intervention_types(is_active);

-- ============================================================================
-- 5. INTERVENTION FIELDS (Dynamic Form Fields)
-- ============================================================================

CREATE TYPE field_type AS ENUM ('text', 'number', 'select', 'checkbox', 'date', 'time');

CREATE TABLE intervention_fields (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    intervention_type_id UUID NOT NULL REFERENCES intervention_types(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL,
    field_type field_type NOT NULL,
    is_required BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    placeholder TEXT,
    help_text TEXT,
    validation_rules JSONB DEFAULT '{}', -- {min, max, pattern, options}
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(intervention_type_id, code)
);

CREATE INDEX idx_intervention_fields_type ON intervention_fields(intervention_type_id);
CREATE INDEX idx_intervention_fields_order ON intervention_fields(intervention_type_id, sort_order);

-- ============================================================================
-- 6. INTERVENTIONS
-- ============================================================================

CREATE TYPE intervention_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');

CREATE TABLE interventions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    intervention_type_id UUID NOT NULL REFERENCES intervention_types(id) ON DELETE RESTRICT,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
    agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
    status intervention_status DEFAULT 'pending',
    scheduled_at TIMESTAMP WITH TIME ZONE,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    location JSONB, -- {address, city, coordinates: {lat, lng}}
    field_data JSONB DEFAULT '{}', -- Dynamic fields from intervention_fields
    photos TEXT[], -- Array of photo URLs
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_interventions_type ON interventions(intervention_type_id);
CREATE INDEX idx_interventions_client ON interventions(client_id);
CREATE INDEX idx_interventions_vehicle ON interventions(vehicle_id);
CREATE INDEX idx_interventions_agent ON interventions(agent_id);
CREATE INDEX idx_interventions_status ON interventions(status);
CREATE INDEX idx_interventions_scheduled ON interventions(scheduled_at);
CREATE INDEX idx_interventions_created ON interventions(created_at);

-- ============================================================================
-- 7. AUDIT LOG
-- ============================================================================

CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name VARCHAR(100) NOT NULL,
    record_id UUID NOT NULL,
    action VARCHAR(20) NOT NULL, -- INSERT, UPDATE, DELETE
    old_data JSONB,
    new_data JSONB,
    changed_by UUID REFERENCES agents(id),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_audit_table_record ON audit_log(table_name, record_id);
CREATE INDEX idx_audit_changed_at ON audit_log(changed_at);

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to all tables with updated_at
CREATE TRIGGER update_agents_updated_at BEFORE UPDATE ON agents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON vehicles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_intervention_types_updated_at BEFORE UPDATE ON intervention_types
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_intervention_fields_updated_at BEFORE UPDATE ON intervention_fields
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_interventions_updated_at BEFORE UPDATE ON interventions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE intervention_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE intervention_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE interventions ENABLE ROW LEVEL SECURITY;

-- Agents policies
CREATE POLICY "Agents can view all agents" ON agents
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage agents" ON agents
    FOR ALL USING (
        auth.uid() IN (
            SELECT id FROM agents WHERE role = 'admin' AND is_active = true
        )
    );

-- Clients policies (all authenticated users can view)
CREATE POLICY "Authenticated users can view clients" ON clients
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage clients" ON clients
    FOR ALL USING (
        auth.uid() IN (
            SELECT id FROM agents WHERE role IN ('admin', 'supervisor') AND is_active = true
        )
    );

-- Vehicles policies
CREATE POLICY "Authenticated users can view vehicles" ON vehicles
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage vehicles" ON vehicles
    FOR ALL USING (
        auth.uid() IN (
            SELECT id FROM agents WHERE role IN ('admin', 'supervisor') AND is_active = true
        )
    );

-- Intervention types policies
CREATE POLICY "Everyone can view intervention types" ON intervention_types
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage intervention types" ON intervention_types
    FOR ALL USING (
        auth.uid() IN (
            SELECT id FROM agents WHERE role = 'admin' AND is_active = true
        )
    );

-- Intervention fields policies
CREATE POLICY "Everyone can view intervention fields" ON intervention_fields
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage intervention fields" ON intervention_fields
    FOR ALL USING (
        auth.uid() IN (
            SELECT id FROM agents WHERE role = 'admin' AND is_active = true
        )
    );

-- Interventions policies
CREATE POLICY "Agents can view their own interventions" ON interventions
    FOR SELECT USING (
        agent_id = auth.uid() OR
        auth.uid() IN (
            SELECT id FROM agents WHERE role IN ('admin', 'supervisor') AND is_active = true
        )
    );

CREATE POLICY "Field agents can create interventions" ON interventions
    FOR INSERT WITH CHECK (
        auth.uid() IN (
            SELECT id FROM agents WHERE is_active = true
        )
    );

CREATE POLICY "Agents can update their own interventions" ON interventions
    FOR UPDATE USING (
        agent_id = auth.uid() OR
        auth.uid() IN (
            SELECT id FROM agents WHERE role IN ('admin', 'supervisor') AND is_active = true
        )
    );

-- ============================================================================
-- SAMPLE VIEWS FOR COMMON QUERIES
-- ============================================================================

-- View: Interventions with full details
CREATE VIEW interventions_detailed AS
SELECT
    i.id,
    i.status,
    i.scheduled_at,
    i.completed_at,
    it.name AS intervention_type,
    it.code AS intervention_code,
    it.icon,
    it.color,
    c.name AS client_name,
    c.code AS client_code,
    c.city AS client_city,
    v.license_plate,
    v.make AS vehicle_make,
    v.model AS vehicle_model,
    a.first_name || ' ' || a.last_name AS agent_name,
    a.email AS agent_email,
    i.field_data,
    i.photos,
    i.notes,
    i.location,
    i.created_at,
    i.updated_at
FROM interventions i
LEFT JOIN intervention_types it ON i.intervention_type_id = it.id
LEFT JOIN clients c ON i.client_id = c.id
LEFT JOIN vehicles v ON i.vehicle_id = v.id
LEFT JOIN agents a ON i.agent_id = a.id;

-- ============================================================================
-- GRANT PERMISSIONS FOR SERVICE ROLE
-- ============================================================================

-- Grant all permissions to service role (for API access)
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- Grant appropriate permissions to authenticated role
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ============================================================================
-- NOTES
-- ============================================================================
--
-- 1. Run this schema in Supabase SQL Editor
-- 2. Then run the seed script: npm run db:seed
-- 3. Test the API endpoints at /api/clients, /api/vehicles, etc.
--
-- ============================================================================
