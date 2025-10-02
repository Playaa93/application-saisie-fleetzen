/**
 * Database Schema for Field Agent Intervention Tracking App
 * Using Drizzle ORM with PostgreSQL
 *
 * Features:
 * - Modular intervention types (easy to add new types)
 * - EAV pattern for dynamic fields per intervention type
 * - Photo management with before/after tracking
 * - Offline-first sync queue
 * - Audit trail with timestamps
 */

import { pgTable, uuid, varchar, text, timestamp, jsonb, integer, boolean, pgEnum, index, foreignKey } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ============================================================================
// ENUMS
// ============================================================================

export const agentRoleEnum = pgEnum('agent_role', ['admin', 'supervisor', 'field_agent']);
export const interventionStatusEnum = pgEnum('intervention_status', ['draft', 'pending', 'completed', 'validated', 'synced']);
export const fieldTypeEnum = pgEnum('field_type', ['text', 'number', 'date', 'datetime', 'boolean', 'select', 'multiselect', 'file']);
export const photoTypeEnum = pgEnum('photo_type', ['before', 'during', 'after', 'detail']);
export const syncStatusEnum = pgEnum('sync_status', ['pending', 'in_progress', 'completed', 'failed']);

// ============================================================================
// AGENTS - Field agents and users
// ============================================================================

export const agents = pgTable('agents', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  phone: varchar('phone', { length: 20 }),
  role: agentRoleEnum('role').notNull().default('field_agent'),
  isActive: boolean('is_active').notNull().default(true),
  passwordHash: text('password_hash').notNull(),
  lastLoginAt: timestamp('last_login_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  metadata: jsonb('metadata'), // Additional agent info (certifications, regions, etc.)
}, (table) => ({
  emailIdx: index('agents_email_idx').on(table.email),
  activeIdx: index('agents_active_idx').on(table.isActive),
}));

// ============================================================================
// CLIENTS - Client sites where interventions occur
// ============================================================================

export const clients = pgTable('clients', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  code: varchar('code', { length: 50 }).unique(), // Client reference code
  address: text('address'),
  city: varchar('city', { length: 100 }),
  postalCode: varchar('postal_code', { length: 20 }),
  country: varchar('country', { length: 100 }).default('France'),
  contactName: varchar('contact_name', { length: 255 }),
  contactEmail: varchar('contact_email', { length: 255 }),
  contactPhone: varchar('contact_phone', { length: 20 }),
  coordinates: jsonb('coordinates'), // { lat, lng } for GPS
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  metadata: jsonb('metadata'), // Additional client info (contracts, notes, etc.)
}, (table) => ({
  nameIdx: index('clients_name_idx').on(table.name),
  codeIdx: index('clients_code_idx').on(table.code),
  activeIdx: index('clients_active_idx').on(table.isActive),
}));

// ============================================================================
// VEHICLES - Vehicles at client sites
// ============================================================================

export const vehicles = pgTable('vehicles', {
  id: uuid('id').primaryKey().defaultRandom(),
  clientId: uuid('client_id').notNull().references(() => clients.id, { onDelete: 'cascade' }),
  licensePlate: varchar('license_plate', { length: 20 }).notNull(),
  make: varchar('make', { length: 100 }), // Manufacturer (Renault, Peugeot, etc.)
  model: varchar('model', { length: 100 }),
  year: integer('year'),
  vin: varchar('vin', { length: 50 }), // Vehicle Identification Number
  fuelType: varchar('fuel_type', { length: 50 }), // Diesel, Essence, Electric, etc.
  tankCapacity: integer('tank_capacity'), // In liters
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  metadata: jsonb('metadata'), // Additional vehicle info (mileage, last service, etc.)
}, (table) => ({
  clientIdx: index('vehicles_client_idx').on(table.clientId),
  plateIdx: index('vehicles_plate_idx').on(table.licensePlate),
  activeIdx: index('vehicles_active_idx').on(table.isActive),
}));

// ============================================================================
// INTERVENTION TYPES - Configurable types (lavage, carburant, cuve, etc.)
// ============================================================================

export const interventionTypes = pgTable('intervention_types', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  code: varchar('code', { length: 50 }).notNull().unique(), // Machine-readable code (lavage, carburant, cuve)
  description: text('description'),
  icon: varchar('icon', { length: 50 }), // Icon name for UI
  color: varchar('color', { length: 20 }), // Color code for UI
  requiresVehicle: boolean('requires_vehicle').notNull().default(false),
  requiresPhotos: boolean('requires_photos').notNull().default(true),
  minPhotos: integer('min_photos').default(2), // Minimum photos required
  isActive: boolean('is_active').notNull().default(true),
  sortOrder: integer('sort_order').default(0), // Display order
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  config: jsonb('config'), // Additional configuration (validation rules, workflows, etc.)
}, (table) => ({
  codeIdx: index('intervention_types_code_idx').on(table.code),
  activeIdx: index('intervention_types_active_idx').on(table.isActive),
}));

// ============================================================================
// INTERVENTION FIELDS - Dynamic field definitions per type (EAV pattern)
// ============================================================================

export const interventionFields = pgTable('intervention_fields', {
  id: uuid('id').primaryKey().defaultRandom(),
  interventionTypeId: uuid('intervention_type_id').notNull().references(() => interventionTypes.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 100 }).notNull(), // Display name
  code: varchar('code', { length: 50 }).notNull(), // Machine-readable code (snake_case)
  fieldType: fieldTypeEnum('field_type').notNull(),
  isRequired: boolean('is_required').notNull().default(false),
  sortOrder: integer('sort_order').default(0),
  placeholder: varchar('placeholder', { length: 255 }),
  helpText: text('help_text'),
  defaultValue: text('default_value'),
  validationRules: jsonb('validation_rules'), // { min, max, pattern, options, etc. }
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  typeIdx: index('intervention_fields_type_idx').on(table.interventionTypeId),
  uniqueTypeCode: index('intervention_fields_type_code_idx').on(table.interventionTypeId, table.code),
}));

// ============================================================================
// INTERVENTIONS - Main intervention records
// ============================================================================

export const interventions = pgTable('interventions', {
  id: uuid('id').primaryKey().defaultRandom(),
  interventionTypeId: uuid('intervention_type_id').notNull().references(() => interventionTypes.id),
  agentId: uuid('agent_id').notNull().references(() => agents.id),
  clientId: uuid('client_id').notNull().references(() => clients.id),
  vehicleId: uuid('vehicle_id').references(() => vehicles.id), // Nullable for non-vehicle interventions
  status: interventionStatusEnum('status').notNull().default('draft'),

  // Scheduling
  scheduledAt: timestamp('scheduled_at'),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),

  // Location (for offline GPS capture)
  coordinates: jsonb('coordinates'), // { lat, lng }
  locationAccuracy: integer('location_accuracy'), // GPS accuracy in meters

  // Notes and signatures
  notes: text('notes'),
  internalNotes: text('internal_notes'), // Not visible to client
  clientSignature: text('client_signature'), // Base64 encoded signature
  agentSignature: text('agent_signature'),
  signedAt: timestamp('signed_at'),

  // Audit trail
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  syncedAt: timestamp('synced_at'), // When synced from offline to server

  // Additional data
  metadata: jsonb('metadata'), // Custom fields, temp data, etc.
}, (table) => ({
  typeIdx: index('interventions_type_idx').on(table.interventionTypeId),
  agentIdx: index('interventions_agent_idx').on(table.agentId),
  clientIdx: index('interventions_client_idx').on(table.clientId),
  vehicleIdx: index('interventions_vehicle_idx').on(table.vehicleId),
  statusIdx: index('interventions_status_idx').on(table.status),
  scheduledIdx: index('interventions_scheduled_idx').on(table.scheduledAt),
  createdIdx: index('interventions_created_idx').on(table.createdAt),
}));

// ============================================================================
// INTERVENTION DATA - Actual field values (EAV pattern)
// ============================================================================

export const interventionData = pgTable('intervention_data', {
  id: uuid('id').primaryKey().defaultRandom(),
  interventionId: uuid('intervention_id').notNull().references(() => interventions.id, { onDelete: 'cascade' }),
  fieldId: uuid('field_id').notNull().references(() => interventionFields.id, { onDelete: 'cascade' }),

  // Polymorphic value storage
  valueText: text('value_text'),
  valueNumber: integer('value_number'),
  valueBoolean: boolean('value_boolean'),
  valueJson: jsonb('value_json'), // For complex values (arrays, objects)
  valueDate: timestamp('value_date'),

  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  interventionIdx: index('intervention_data_intervention_idx').on(table.interventionId),
  fieldIdx: index('intervention_data_field_idx').on(table.fieldId),
  uniqueInterventionField: index('intervention_data_unique_idx').on(table.interventionId, table.fieldId),
}));

// ============================================================================
// PHOTOS - Photo storage with metadata
// ============================================================================

export const photos = pgTable('photos', {
  id: uuid('id').primaryKey().defaultRandom(),
  interventionId: uuid('intervention_id').notNull().references(() => interventions.id, { onDelete: 'cascade' }),
  type: photoTypeEnum('type').notNull().default('detail'),

  // Storage
  filename: varchar('filename', { length: 255 }).notNull(),
  filepath: text('filepath').notNull(), // Relative or absolute path
  url: text('url'), // Public URL if stored in cloud
  mimeType: varchar('mime_type', { length: 100 }).default('image/jpeg'),
  fileSize: integer('file_size'), // In bytes

  // Image metadata
  width: integer('width'),
  height: integer('height'),

  // Capture metadata
  capturedAt: timestamp('captured_at'),
  coordinates: jsonb('coordinates'), // GPS location { lat, lng }
  deviceInfo: jsonb('device_info'), // Device model, OS, etc.

  // Organization
  caption: text('caption'),
  sortOrder: integer('sort_order').default(0),

  // Sync status
  isUploaded: boolean('is_uploaded').notNull().default(false),
  uploadedAt: timestamp('uploaded_at'),

  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),

  metadata: jsonb('metadata'), // EXIF data, thumbnails, etc.
}, (table) => ({
  interventionIdx: index('photos_intervention_idx').on(table.interventionId),
  typeIdx: index('photos_type_idx').on(table.type),
  uploadedIdx: index('photos_uploaded_idx').on(table.isUploaded),
}));

// ============================================================================
// SYNC QUEUE - Offline-first synchronization
// ============================================================================

export const syncQueue = pgTable('sync_queue', {
  id: uuid('id').primaryKey().defaultRandom(),

  // What to sync
  entityType: varchar('entity_type', { length: 50 }).notNull(), // intervention, photo, etc.
  entityId: uuid('entity_id').notNull(),
  operation: varchar('operation', { length: 20 }).notNull(), // create, update, delete

  // Sync status
  status: syncStatusEnum('status').notNull().default('pending'),
  priority: integer('priority').default(5), // 1-10, higher = more important
  retryCount: integer('retry_count').default(0),
  maxRetries: integer('max_retries').default(3),
  lastError: text('last_error'),

  // Data payload
  payload: jsonb('payload').notNull(), // The actual data to sync

  // Timing
  createdAt: timestamp('created_at').notNull().defaultNow(),
  scheduledFor: timestamp('scheduled_for').notNull().defaultNow(),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),

  // Device info
  deviceId: varchar('device_id', { length: 100 }),
  agentId: uuid('agent_id').references(() => agents.id),

  metadata: jsonb('metadata'),
}, (table) => ({
  statusIdx: index('sync_queue_status_idx').on(table.status),
  entityIdx: index('sync_queue_entity_idx').on(table.entityType, table.entityId),
  scheduledIdx: index('sync_queue_scheduled_idx').on(table.scheduledFor),
  priorityIdx: index('sync_queue_priority_idx').on(table.priority),
  agentIdx: index('sync_queue_agent_idx').on(table.agentId),
}));

// ============================================================================
// RELATIONS - Drizzle ORM relations for easier queries
// ============================================================================

export const agentsRelations = relations(agents, ({ many }) => ({
  interventions: many(interventions),
  syncQueue: many(syncQueue),
}));

export const clientsRelations = relations(clients, ({ many }) => ({
  vehicles: many(vehicles),
  interventions: many(interventions),
}));

export const vehiclesRelations = relations(vehicles, ({ one, many }) => ({
  client: one(clients, {
    fields: [vehicles.clientId],
    references: [clients.id],
  }),
  interventions: many(interventions),
}));

export const interventionTypesRelations = relations(interventionTypes, ({ many }) => ({
  fields: many(interventionFields),
  interventions: many(interventions),
}));

export const interventionFieldsRelations = relations(interventionFields, ({ one, many }) => ({
  interventionType: one(interventionTypes, {
    fields: [interventionFields.interventionTypeId],
    references: [interventionTypes.id],
  }),
  data: many(interventionData),
}));

export const interventionsRelations = relations(interventions, ({ one, many }) => ({
  interventionType: one(interventionTypes, {
    fields: [interventions.interventionTypeId],
    references: [interventionTypes.id],
  }),
  agent: one(agents, {
    fields: [interventions.agentId],
    references: [agents.id],
  }),
  client: one(clients, {
    fields: [interventions.clientId],
    references: [clients.id],
  }),
  vehicle: one(vehicles, {
    fields: [interventions.vehicleId],
    references: [vehicles.id],
  }),
  data: many(interventionData),
  photos: many(photos),
}));

export const interventionDataRelations = relations(interventionData, ({ one }) => ({
  intervention: one(interventions, {
    fields: [interventionData.interventionId],
    references: [interventions.id],
  }),
  field: one(interventionFields, {
    fields: [interventionData.fieldId],
    references: [interventionFields.id],
  }),
}));

export const photosRelations = relations(photos, ({ one }) => ({
  intervention: one(interventions, {
    fields: [photos.interventionId],
    references: [interventions.id],
  }),
}));

export const syncQueueRelations = relations(syncQueue, ({ one }) => ({
  agent: one(agents, {
    fields: [syncQueue.agentId],
    references: [agents.id],
  }),
}));

// ============================================================================
// TYPE EXPORTS - For TypeScript usage
// ============================================================================

export type Agent = typeof agents.$inferSelect;
export type NewAgent = typeof agents.$inferInsert;

export type Client = typeof clients.$inferSelect;
export type NewClient = typeof clients.$inferInsert;

export type Vehicle = typeof vehicles.$inferSelect;
export type NewVehicle = typeof vehicles.$inferInsert;

export type InterventionType = typeof interventionTypes.$inferSelect;
export type NewInterventionType = typeof interventionTypes.$inferInsert;

export type InterventionField = typeof interventionFields.$inferSelect;
export type NewInterventionField = typeof interventionFields.$inferInsert;

export type Intervention = typeof interventions.$inferSelect;
export type NewIntervention = typeof interventions.$inferInsert;

export type InterventionData = typeof interventionData.$inferSelect;
export type NewInterventionData = typeof interventionData.$inferInsert;

export type Photo = typeof photos.$inferSelect;
export type NewPhoto = typeof photos.$inferInsert;

export type SyncQueue = typeof syncQueue.$inferSelect;
export type NewSyncQueue = typeof syncQueue.$inferInsert;
