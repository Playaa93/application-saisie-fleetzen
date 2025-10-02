# Database Schema Documentation

## Field Agent Intervention Tracking App

**ORM:** Drizzle ORM
**Database:** PostgreSQL
**Date:** 2025-10-02
**Version:** 1.0.0

---

## Overview

This database schema is designed for a field agent intervention tracking application with a focus on **modularity** and **offline-first capabilities**. The schema uses an **EAV (Entity-Attribute-Value)** pattern for dynamic fields, allowing easy addition of new intervention types without schema changes.

### Key Features

- **Modular intervention types** - Easy to add new types (Lavage, Carburant, Cuve, etc.)
- **Dynamic fields** - Each intervention type can have custom fields
- **Photo management** - Before/during/after photo tracking
- **Offline-first** - Sync queue for offline data synchronization
- **Audit trail** - Complete timestamp tracking on all entities
- **GPS tracking** - Location capture for interventions and photos

---

## Entity Relationship Diagram

```
┌─────────────┐       ┌──────────────────┐       ┌─────────────┐
│   AGENTS    │───────│  INTERVENTIONS   │───────│   CLIENTS   │
└─────────────┘       └──────────────────┘       └─────────────┘
                              │                          │
                              │                          │
                              ▼                          ▼
                      ┌───────────────┐         ┌──────────────┐
                      │    PHOTOS     │         │   VEHICLES   │
                      └───────────────┘         └──────────────┘

                              │
                              │
                              ▼
┌───────────────────┐  ┌──────────────────┐  ┌─────────────────────┐
│INTERVENTION_TYPES │──│INTERVENTION_FIELDS│──│ INTERVENTION_DATA  │
└───────────────────┘  └──────────────────┘  └─────────────────────┘

┌────────────────┐
│  SYNC_QUEUE    │
└────────────────┘
```

---

## Tables

### 1. `agents`

Field agents and users who perform interventions.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `email` | VARCHAR(255) | Unique email address |
| `first_name` | VARCHAR(100) | First name |
| `last_name` | VARCHAR(100) | Last name |
| `phone` | VARCHAR(20) | Phone number |
| `role` | ENUM | Role: admin, supervisor, field_agent |
| `is_active` | BOOLEAN | Active status |
| `password_hash` | TEXT | Hashed password |
| `last_login_at` | TIMESTAMP | Last login timestamp |
| `created_at` | TIMESTAMP | Creation timestamp |
| `updated_at` | TIMESTAMP | Last update timestamp |
| `metadata` | JSONB | Additional info (certifications, regions, etc.) |

**Indexes:**
- `agents_email_idx` on `email`
- `agents_active_idx` on `is_active`

---

### 2. `clients`

Client sites where interventions are performed.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `name` | VARCHAR(255) | Client name |
| `code` | VARCHAR(50) | Unique client reference code |
| `address` | TEXT | Street address |
| `city` | VARCHAR(100) | City |
| `postal_code` | VARCHAR(20) | Postal code |
| `country` | VARCHAR(100) | Country (default: France) |
| `contact_name` | VARCHAR(255) | Contact person name |
| `contact_email` | VARCHAR(255) | Contact email |
| `contact_phone` | VARCHAR(20) | Contact phone |
| `coordinates` | JSONB | GPS coordinates `{lat, lng}` |
| `is_active` | BOOLEAN | Active status |
| `created_at` | TIMESTAMP | Creation timestamp |
| `updated_at` | TIMESTAMP | Last update timestamp |
| `metadata` | JSONB | Additional info (contracts, notes, etc.) |

**Indexes:**
- `clients_name_idx` on `name`
- `clients_code_idx` on `code`
- `clients_active_idx` on `is_active`

---

### 3. `vehicles`

Vehicles at client sites that require interventions.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `client_id` | UUID | Foreign key to `clients` |
| `license_plate` | VARCHAR(20) | License plate (uppercase) |
| `make` | VARCHAR(100) | Vehicle manufacturer |
| `model` | VARCHAR(100) | Vehicle model |
| `year` | INTEGER | Manufacturing year |
| `vin` | VARCHAR(50) | Vehicle Identification Number |
| `fuel_type` | VARCHAR(50) | Fuel type (Diesel, Essence, etc.) |
| `tank_capacity` | INTEGER | Tank capacity in liters |
| `is_active` | BOOLEAN | Active status |
| `created_at` | TIMESTAMP | Creation timestamp |
| `updated_at` | TIMESTAMP | Last update timestamp |
| `metadata` | JSONB | Additional info (mileage, service, etc.) |

**Indexes:**
- `vehicles_client_idx` on `client_id`
- `vehicles_plate_idx` on `license_plate`
- `vehicles_active_idx` on `is_active`

**Constraints:**
- License plate must be uppercase

---

### 4. `intervention_types`

Configurable intervention types (modular).

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `name` | VARCHAR(100) | Display name |
| `code` | VARCHAR(50) | Machine-readable code (lowercase) |
| `description` | TEXT | Description |
| `icon` | VARCHAR(50) | Icon name for UI |
| `color` | VARCHAR(20) | Color code for UI |
| `requires_vehicle` | BOOLEAN | Whether vehicle is required |
| `requires_photos` | BOOLEAN | Whether photos are required |
| `min_photos` | INTEGER | Minimum photos required |
| `is_active` | BOOLEAN | Active status |
| `sort_order` | INTEGER | Display order |
| `created_at` | TIMESTAMP | Creation timestamp |
| `updated_at` | TIMESTAMP | Last update timestamp |
| `config` | JSONB | Additional configuration |

**Indexes:**
- `intervention_types_code_idx` on `code`
- `intervention_types_active_idx` on `is_active`

**Constraints:**
- Code must be lowercase

**Default Types:**
1. **Lavage** (lavage) - Vehicle washing
2. **Carburant** (carburant) - Fuel refill
3. **Remplissage cuve** (cuve) - Tank refill

---

### 5. `intervention_fields`

Dynamic field definitions per intervention type (EAV pattern).

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `intervention_type_id` | UUID | Foreign key to `intervention_types` |
| `name` | VARCHAR(100) | Display name |
| `code` | VARCHAR(50) | Machine-readable code (snake_case) |
| `field_type` | ENUM | Field type (text, number, date, etc.) |
| `is_required` | BOOLEAN | Required field |
| `sort_order` | INTEGER | Display order |
| `placeholder` | VARCHAR(255) | Placeholder text |
| `help_text` | TEXT | Help text |
| `default_value` | TEXT | Default value |
| `validation_rules` | JSONB | Validation rules JSON |
| `created_at` | TIMESTAMP | Creation timestamp |
| `updated_at` | TIMESTAMP | Last update timestamp |

**Field Types:**
- `text` - Text input
- `number` - Numeric input
- `date` - Date picker
- `datetime` - Date and time picker
- `boolean` - Checkbox
- `select` - Dropdown (single select)
- `multiselect` - Multi-select dropdown
- `file` - File upload

**Indexes:**
- `intervention_fields_type_idx` on `intervention_type_id`
- `intervention_fields_type_code_idx` (unique) on `intervention_type_id, code`

**Constraints:**
- Code must be snake_case format

---

### 6. `interventions`

Main intervention records linking all entities.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `intervention_type_id` | UUID | Foreign key to `intervention_types` |
| `agent_id` | UUID | Foreign key to `agents` |
| `client_id` | UUID | Foreign key to `clients` |
| `vehicle_id` | UUID | Foreign key to `vehicles` (nullable) |
| `status` | ENUM | Status: draft, pending, completed, validated, synced |
| `scheduled_at` | TIMESTAMP | Scheduled start time |
| `started_at` | TIMESTAMP | Actual start time |
| `completed_at` | TIMESTAMP | Completion time |
| `coordinates` | JSONB | GPS location `{lat, lng}` |
| `location_accuracy` | INTEGER | GPS accuracy in meters |
| `notes` | TEXT | Notes (visible to client) |
| `internal_notes` | TEXT | Internal notes (not visible to client) |
| `client_signature` | TEXT | Client signature (base64) |
| `agent_signature` | TEXT | Agent signature (base64) |
| `signed_at` | TIMESTAMP | Signature timestamp |
| `created_at` | TIMESTAMP | Creation timestamp |
| `updated_at` | TIMESTAMP | Last update timestamp |
| `synced_at` | TIMESTAMP | Server sync timestamp |
| `metadata` | JSONB | Additional data |

**Indexes:**
- `interventions_type_idx` on `intervention_type_id`
- `interventions_agent_idx` on `agent_id`
- `interventions_client_idx` on `client_id`
- `interventions_vehicle_idx` on `vehicle_id`
- `interventions_status_idx` on `status`
- `interventions_scheduled_idx` on `scheduled_at`
- `interventions_created_idx` on `created_at`

---

### 7. `intervention_data`

Actual field values using EAV pattern.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `intervention_id` | UUID | Foreign key to `interventions` |
| `field_id` | UUID | Foreign key to `intervention_fields` |
| `value_text` | TEXT | Text value |
| `value_number` | INTEGER | Numeric value |
| `value_boolean` | BOOLEAN | Boolean value |
| `value_json` | JSONB | JSON value (arrays, objects) |
| `value_date` | TIMESTAMP | Date/time value |
| `created_at` | TIMESTAMP | Creation timestamp |
| `updated_at` | TIMESTAMP | Last update timestamp |

**Indexes:**
- `intervention_data_intervention_idx` on `intervention_id`
- `intervention_data_field_idx` on `field_id`
- `intervention_data_unique_idx` (unique) on `intervention_id, field_id`

**Note:** Only one value column should be populated based on field type.

---

### 8. `photos`

Photo storage with metadata for interventions.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `intervention_id` | UUID | Foreign key to `interventions` |
| `type` | ENUM | Photo type: before, during, after, detail |
| `filename` | VARCHAR(255) | Original filename |
| `filepath` | TEXT | Storage path |
| `url` | TEXT | Public URL (if cloud-stored) |
| `mime_type` | VARCHAR(100) | MIME type (default: image/jpeg) |
| `file_size` | INTEGER | File size in bytes |
| `width` | INTEGER | Image width in pixels |
| `height` | INTEGER | Image height in pixels |
| `captured_at` | TIMESTAMP | Photo capture timestamp |
| `coordinates` | JSONB | GPS location `{lat, lng}` |
| `device_info` | JSONB | Device metadata |
| `caption` | TEXT | Photo caption |
| `sort_order` | INTEGER | Display order |
| `is_uploaded` | BOOLEAN | Upload status |
| `uploaded_at` | TIMESTAMP | Upload timestamp |
| `created_at` | TIMESTAMP | Creation timestamp |
| `updated_at` | TIMESTAMP | Last update timestamp |
| `metadata` | JSONB | EXIF data, thumbnails, etc. |

**Indexes:**
- `photos_intervention_idx` on `intervention_id`
- `photos_type_idx` on `type`
- `photos_uploaded_idx` on `is_uploaded`

---

### 9. `sync_queue`

Offline-first synchronization queue.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `entity_type` | VARCHAR(50) | Entity type to sync (intervention, photo) |
| `entity_id` | UUID | Entity ID |
| `operation` | VARCHAR(20) | Operation: create, update, delete |
| `status` | ENUM | Status: pending, in_progress, completed, failed |
| `priority` | INTEGER | Priority 1-10 (higher = more important) |
| `retry_count` | INTEGER | Number of retry attempts |
| `max_retries` | INTEGER | Maximum retries allowed |
| `last_error` | TEXT | Last error message |
| `payload` | JSONB | Data payload to sync |
| `created_at` | TIMESTAMP | Creation timestamp |
| `scheduled_for` | TIMESTAMP | Scheduled sync time |
| `started_at` | TIMESTAMP | Sync start timestamp |
| `completed_at` | TIMESTAMP | Sync completion timestamp |
| `device_id` | VARCHAR(100) | Device identifier |
| `agent_id` | UUID | Foreign key to `agents` |
| `metadata` | JSONB | Additional sync metadata |

**Indexes:**
- `sync_queue_status_idx` on `status`
- `sync_queue_entity_idx` on `entity_type, entity_id`
- `sync_queue_scheduled_idx` on `scheduled_for`
- `sync_queue_priority_idx` on `priority`
- `sync_queue_agent_idx` on `agent_id`

**Constraints:**
- Priority must be between 1 and 10
- Retry count cannot exceed max retries

---

## Modularity & Extensibility

### Adding a New Intervention Type

The schema is designed for easy extensibility. To add a new intervention type:

1. **Insert new intervention type**:
```sql
INSERT INTO intervention_types (name, code, description, requires_vehicle, requires_photos)
VALUES ('Inspection technique', 'inspection', 'Vehicle technical inspection', true, true);
```

2. **Define custom fields for the type**:
```sql
INSERT INTO intervention_fields (intervention_type_id, name, code, field_type, is_required)
VALUES
  ('{type_id}', 'Résultat inspection', 'inspection_result', 'select', true),
  ('{type_id}', 'Points à corriger', 'correction_points', 'multiselect', false),
  ('{type_id}', 'Prochaine inspection', 'next_inspection_date', 'date', true);
```

3. **No schema migration needed** - The EAV pattern handles dynamic fields automatically!

### Example Intervention Types to Add

- **Maintenance préventive** (preventive_maintenance)
- **Diagnostic moteur** (engine_diagnostic)
- **Changement pneumatiques** (tire_change)
- **Contrôle freinage** (brake_inspection)
- **Installation équipement** (equipment_installation)

---

## Offline-First Architecture

### How It Works

1. **Agent creates intervention offline** → Saved locally with `status: draft`
2. **Agent adds photos** → Stored locally with `is_uploaded: false`
3. **Agent completes intervention** → Added to `sync_queue` with `status: pending`
4. **App detects connectivity** → Processes `sync_queue` by priority
5. **Data synced to server** → Updates `synced_at` timestamp
6. **Photos uploaded** → Updates `is_uploaded: true` and `uploaded_at`

### Sync Priority

- **Priority 10**: Critical interventions (urgent, deadline)
- **Priority 7-9**: Standard interventions
- **Priority 4-6**: Photos and media
- **Priority 1-3**: Non-critical updates

---

## Example Queries

### Get all interventions for an agent

```sql
SELECT
  i.*,
  it.name as intervention_type_name,
  c.name as client_name,
  v.license_plate as vehicle_plate
FROM interventions i
JOIN intervention_types it ON i.intervention_type_id = it.id
JOIN clients c ON i.client_id = c.id
LEFT JOIN vehicles v ON i.vehicle_id = v.id
WHERE i.agent_id = '{agent_id}'
ORDER BY i.created_at DESC;
```

### Get intervention with all custom field data

```sql
SELECT
  i.*,
  jsonb_object_agg(
    if.code,
    COALESCE(
      id.value_text,
      id.value_number::text,
      id.value_boolean::text,
      id.value_json::text,
      id.value_date::text
    )
  ) as field_values
FROM interventions i
LEFT JOIN intervention_data id ON i.id = id.intervention_id
LEFT JOIN intervention_fields if ON id.field_id = if.id
WHERE i.id = '{intervention_id}'
GROUP BY i.id;
```

### Get pending sync items

```sql
SELECT *
FROM sync_queue
WHERE status = 'pending'
  AND scheduled_for <= NOW()
ORDER BY priority DESC, created_at ASC
LIMIT 10;
```

---

## Performance Considerations

### Indexes

All foreign keys have indexes for fast joins. Additional indexes on:
- Email, license plates, client codes (frequent lookups)
- Status fields (filtering)
- Timestamps (sorting, date ranges)
- GPS coordinates (future: spatial queries)

### Query Optimization

- Use `JOIN` instead of multiple queries
- Limit result sets with pagination
- Use partial indexes for active records only
- Consider materialized views for reporting

### Storage

- Photos should be stored in cloud storage (S3, CloudFlare R2)
- Store only metadata and URLs in database
- Consider thumbnail generation for fast loading
- Implement compression for offline storage

---

## Security Considerations

### Data Protection

- Passwords must be hashed with bcrypt (min cost factor: 10)
- Agent signatures stored as base64 encoded images
- Internal notes not accessible to clients
- RBAC implementation via `agent.role` field

### Data Retention

- Soft delete via `is_active` flags
- Audit trail via timestamps
- Consider archiving old interventions after X months
- GDPR compliance: implement data export/delete

---

## Migration Strategy

### Running Migrations

```bash
# Apply initial migration
psql -U postgres -d fleetzen_db -f src/db/migrations/0000_initial.sql

# Run seed data
npx tsx src/db/seed.ts
```

### Backup Strategy

- Daily automated backups
- Point-in-time recovery enabled
- Test restore procedures regularly
- Backup sync queue separately (critical for offline recovery)

---

## Future Enhancements

### Potential Additions

1. **Real-time tracking**: Add `agent_locations` table
2. **Reporting**: Add materialized views for analytics
3. **Notifications**: Add `notifications` table
4. **Documents**: Add `documents` table for contracts, invoices
5. **Scheduling**: Add `schedules` table for recurring interventions
6. **Approval workflow**: Add `approvals` table for multi-level validation
7. **Equipment tracking**: Add `equipment` table for agent tools
8. **Time tracking**: Add `time_entries` for detailed billing

---

## Support & Maintenance

### Schema Version

Current version: **1.0.0**

### Contact

For schema questions or feature requests, contact the development team.

---

**Generated:** 2025-10-02
**Last Updated:** 2025-10-02
**Database:** PostgreSQL 14+
**ORM:** Drizzle ORM
