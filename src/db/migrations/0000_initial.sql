-- Initial migration for Field Agent Intervention Tracking App
-- Generated: 2025-10-02
-- Database: PostgreSQL
-- ORM: Drizzle

-- ============================================================================
-- ENUMS
-- ============================================================================

CREATE TYPE agent_role AS ENUM ('admin', 'supervisor', 'field_agent');
CREATE TYPE intervention_status AS ENUM ('draft', 'pending', 'completed', 'validated', 'synced');
CREATE TYPE field_type AS ENUM ('text', 'number', 'date', 'datetime', 'boolean', 'select', 'multiselect', 'file');
CREATE TYPE photo_type AS ENUM ('before', 'during', 'after', 'detail');
CREATE TYPE sync_status AS ENUM ('pending', 'in_progress', 'completed', 'failed');

-- ============================================================================
-- AGENTS TABLE
-- ============================================================================

CREATE TABLE agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    role agent_role NOT NULL DEFAULT 'field_agent',
    is_active BOOLEAN NOT NULL DEFAULT true,
    password_hash TEXT NOT NULL,
    last_login_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB
);

CREATE INDEX agents_email_idx ON agents(email);
CREATE INDEX agents_active_idx ON agents(is_active);

COMMENT ON TABLE agents IS 'Field agents and users who perform interventions';
COMMENT ON COLUMN agents.metadata IS 'Additional agent info: certifications, regions, equipment';

-- ============================================================================
-- CLIENTS TABLE
-- ============================================================================

CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE,
    address TEXT,
    city VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'France',
    contact_name VARCHAR(255),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(20),
    coordinates JSONB,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB
);

CREATE INDEX clients_name_idx ON clients(name);
CREATE INDEX clients_code_idx ON clients(code);
CREATE INDEX clients_active_idx ON clients(is_active);

COMMENT ON TABLE clients IS 'Client sites where interventions are performed';
COMMENT ON COLUMN clients.coordinates IS 'GPS coordinates: {lat: number, lng: number}';
COMMENT ON COLUMN clients.metadata IS 'Additional client info: contracts, billing, notes';

-- ============================================================================
-- VEHICLES TABLE
-- ============================================================================

CREATE TABLE vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    license_plate VARCHAR(20) NOT NULL,
    make VARCHAR(100),
    model VARCHAR(100),
    year INTEGER,
    vin VARCHAR(50),
    fuel_type VARCHAR(50),
    tank_capacity INTEGER,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB
);

CREATE INDEX vehicles_client_idx ON vehicles(client_id);
CREATE INDEX vehicles_plate_idx ON vehicles(license_plate);
CREATE INDEX vehicles_active_idx ON vehicles(is_active);

COMMENT ON TABLE vehicles IS 'Vehicles at client sites that require interventions';
COMMENT ON COLUMN vehicles.tank_capacity IS 'Fuel tank capacity in liters';
COMMENT ON COLUMN vehicles.metadata IS 'Additional vehicle info: mileage, last service, custom fields';

-- ============================================================================
-- INTERVENTION TYPES TABLE
-- ============================================================================

CREATE TABLE intervention_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    icon VARCHAR(50),
    color VARCHAR(20),
    requires_vehicle BOOLEAN NOT NULL DEFAULT false,
    requires_photos BOOLEAN NOT NULL DEFAULT true,
    min_photos INTEGER DEFAULT 2,
    is_active BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    config JSONB
);

CREATE INDEX intervention_types_code_idx ON intervention_types(code);
CREATE INDEX intervention_types_active_idx ON intervention_types(is_active);

COMMENT ON TABLE intervention_types IS 'Configurable intervention types (lavage, carburant, cuve, etc.) - MODULAR';
COMMENT ON COLUMN intervention_types.code IS 'Machine-readable code for app logic (e.g., lavage, carburant, cuve)';
COMMENT ON COLUMN intervention_types.config IS 'Additional configuration: validation rules, workflows, notifications';

-- ============================================================================
-- INTERVENTION FIELDS TABLE (EAV Pattern)
-- ============================================================================

CREATE TABLE intervention_fields (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    intervention_type_id UUID NOT NULL REFERENCES intervention_types(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL,
    field_type field_type NOT NULL,
    is_required BOOLEAN NOT NULL DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    placeholder VARCHAR(255),
    help_text TEXT,
    default_value TEXT,
    validation_rules JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX intervention_fields_type_idx ON intervention_fields(intervention_type_id);
CREATE UNIQUE INDEX intervention_fields_type_code_idx ON intervention_fields(intervention_type_id, code);

COMMENT ON TABLE intervention_fields IS 'Dynamic field definitions per intervention type - enables modularity';
COMMENT ON COLUMN intervention_fields.validation_rules IS 'JSON rules: {min, max, pattern, options: [], required_if, etc.}';

-- ============================================================================
-- INTERVENTIONS TABLE
-- ============================================================================

CREATE TABLE interventions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    intervention_type_id UUID NOT NULL REFERENCES intervention_types(id),
    agent_id UUID NOT NULL REFERENCES agents(id),
    client_id UUID NOT NULL REFERENCES clients(id),
    vehicle_id UUID REFERENCES vehicles(id),
    status intervention_status NOT NULL DEFAULT 'draft',

    -- Scheduling
    scheduled_at TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,

    -- Location (for offline GPS capture)
    coordinates JSONB,
    location_accuracy INTEGER,

    -- Notes and signatures
    notes TEXT,
    internal_notes TEXT,
    client_signature TEXT,
    agent_signature TEXT,
    signed_at TIMESTAMP,

    -- Audit trail
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    synced_at TIMESTAMP,

    metadata JSONB
);

CREATE INDEX interventions_type_idx ON interventions(intervention_type_id);
CREATE INDEX interventions_agent_idx ON interventions(agent_id);
CREATE INDEX interventions_client_idx ON interventions(client_id);
CREATE INDEX interventions_vehicle_idx ON interventions(vehicle_id);
CREATE INDEX interventions_status_idx ON interventions(status);
CREATE INDEX interventions_scheduled_idx ON interventions(scheduled_at);
CREATE INDEX interventions_created_idx ON interventions(created_at);

COMMENT ON TABLE interventions IS 'Main intervention records - links all entities together';
COMMENT ON COLUMN interventions.coordinates IS 'GPS location where intervention was performed: {lat, lng}';
COMMENT ON COLUMN interventions.location_accuracy IS 'GPS accuracy in meters';
COMMENT ON COLUMN interventions.synced_at IS 'Timestamp when synced from offline device to server';

-- ============================================================================
-- INTERVENTION DATA TABLE (EAV Pattern)
-- ============================================================================

CREATE TABLE intervention_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    intervention_id UUID NOT NULL REFERENCES interventions(id) ON DELETE CASCADE,
    field_id UUID NOT NULL REFERENCES intervention_fields(id) ON DELETE CASCADE,

    -- Polymorphic value storage
    value_text TEXT,
    value_number INTEGER,
    value_boolean BOOLEAN,
    value_json JSONB,
    value_date TIMESTAMP,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX intervention_data_intervention_idx ON intervention_data(intervention_id);
CREATE INDEX intervention_data_field_idx ON intervention_data(field_id);
CREATE UNIQUE INDEX intervention_data_unique_idx ON intervention_data(intervention_id, field_id);

COMMENT ON TABLE intervention_data IS 'Actual field values using EAV pattern - enables dynamic fields per type';
COMMENT ON COLUMN intervention_data.value_json IS 'For complex values: arrays, objects, multiselect options';

-- ============================================================================
-- PHOTOS TABLE
-- ============================================================================

CREATE TABLE photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    intervention_id UUID NOT NULL REFERENCES interventions(id) ON DELETE CASCADE,
    type photo_type NOT NULL DEFAULT 'detail',

    -- Storage
    filename VARCHAR(255) NOT NULL,
    filepath TEXT NOT NULL,
    url TEXT,
    mime_type VARCHAR(100) DEFAULT 'image/jpeg',
    file_size INTEGER,

    -- Image metadata
    width INTEGER,
    height INTEGER,

    -- Capture metadata
    captured_at TIMESTAMP,
    coordinates JSONB,
    device_info JSONB,

    -- Organization
    caption TEXT,
    sort_order INTEGER DEFAULT 0,

    -- Sync status
    is_uploaded BOOLEAN NOT NULL DEFAULT false,
    uploaded_at TIMESTAMP,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB
);

CREATE INDEX photos_intervention_idx ON photos(intervention_id);
CREATE INDEX photos_type_idx ON photos(type);
CREATE INDEX photos_uploaded_idx ON photos(is_uploaded);

COMMENT ON TABLE photos IS 'Photo storage with metadata - supports before/during/after tracking';
COMMENT ON COLUMN photos.coordinates IS 'GPS location where photo was taken: {lat, lng}';
COMMENT ON COLUMN photos.device_info IS 'Device details: {model, os, version, etc.}';
COMMENT ON COLUMN photos.metadata IS 'EXIF data, thumbnails, compression info';

-- ============================================================================
-- SYNC QUEUE TABLE (Offline-First Support)
-- ============================================================================

CREATE TABLE sync_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- What to sync
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    operation VARCHAR(20) NOT NULL,

    -- Sync status
    status sync_status NOT NULL DEFAULT 'pending',
    priority INTEGER DEFAULT 5,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    last_error TEXT,

    -- Data payload
    payload JSONB NOT NULL,

    -- Timing
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    scheduled_for TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,

    -- Device info
    device_id VARCHAR(100),
    agent_id UUID REFERENCES agents(id),

    metadata JSONB
);

CREATE INDEX sync_queue_status_idx ON sync_queue(status);
CREATE INDEX sync_queue_entity_idx ON sync_queue(entity_type, entity_id);
CREATE INDEX sync_queue_scheduled_idx ON sync_queue(scheduled_for);
CREATE INDEX sync_queue_priority_idx ON sync_queue(priority);
CREATE INDEX sync_queue_agent_idx ON sync_queue(agent_id);

COMMENT ON TABLE sync_queue IS 'Offline-first synchronization queue - tracks pending syncs from devices';
COMMENT ON COLUMN sync_queue.entity_type IS 'Type of entity to sync: intervention, photo, etc.';
COMMENT ON COLUMN sync_queue.operation IS 'Operation type: create, update, delete';
COMMENT ON COLUMN sync_queue.priority IS 'Sync priority 1-10 (higher = more important)';
COMMENT ON COLUMN sync_queue.payload IS 'The actual data to sync (full entity JSON)';

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER agents_updated_at BEFORE UPDATE ON agents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER clients_updated_at BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER vehicles_updated_at BEFORE UPDATE ON vehicles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER intervention_types_updated_at BEFORE UPDATE ON intervention_types
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER intervention_fields_updated_at BEFORE UPDATE ON intervention_fields
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER interventions_updated_at BEFORE UPDATE ON interventions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER intervention_data_updated_at BEFORE UPDATE ON intervention_data
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER photos_updated_at BEFORE UPDATE ON photos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- INITIAL DATA CONSTRAINTS
-- ============================================================================

-- Ensure license plates are uppercase
ALTER TABLE vehicles ADD CONSTRAINT vehicles_license_plate_uppercase
    CHECK (license_plate = UPPER(license_plate));

-- Ensure intervention type codes are lowercase
ALTER TABLE intervention_types ADD CONSTRAINT intervention_types_code_lowercase
    CHECK (code = LOWER(code));

-- Ensure field codes are snake_case (lowercase with underscores)
ALTER TABLE intervention_fields ADD CONSTRAINT intervention_fields_code_format
    CHECK (code ~ '^[a-z][a-z0-9_]*$');

-- Ensure priority is between 1 and 10
ALTER TABLE sync_queue ADD CONSTRAINT sync_queue_priority_range
    CHECK (priority BETWEEN 1 AND 10);

-- Ensure retry count doesn't exceed max retries
ALTER TABLE sync_queue ADD CONSTRAINT sync_queue_retry_count_valid
    CHECK (retry_count <= max_retries);
