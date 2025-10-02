/**
 * Intervention Tracking Schema - Field Agent App
 * Extension to existing database for fleet management
 */

import { pgTable, text, timestamp, integer, jsonb, boolean, uuid, index, uniqueIndex, decimal } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
// Note: Using Supabase directly, not Drizzle schema
// import { users, organizations } from './schema';

// ==================== CLIENTS TABLE ====================
export const clients = pgTable('clients', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id'),

  name: text('name').notNull(),
  code: text('code').notNull(), // Client identifier code
  contactName: text('contact_name'),
  contactEmail: text('contact_email'),
  contactPhone: text('contact_phone'),
  address: text('address'),
  city: text('city'),
  postalCode: text('postal_code'),
  country: text('country').default('France'),

  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  orgIdx: index('clients_org_idx').on(table.organizationId),
  codeIdx: index('clients_code_idx').on(table.code),
  orgCodeUniq: uniqueIndex('clients_org_code_uniq').on(table.organizationId, table.code),
}));

// ==================== VEHICLES TABLE ====================
export const vehicles = pgTable('vehicles', {
  id: uuid('id').defaultRandom().primaryKey(),
  clientId: uuid('client_id').notNull().references(() => clients.id, { onDelete: 'cascade' }),

  registrationNumber: text('registration_number').notNull(),
  brand: text('brand').notNull(),
  model: text('model').notNull(),
  year: integer('year'),
  vin: text('vin'), // Vehicle Identification Number

  vehicleType: text('vehicle_type').notNull(), // truck, van, car, trailer, etc.
  fuelType: text('fuel_type'), // diesel, gasoline, electric, hybrid

  mileage: integer('mileage'), // Current mileage in km
  lastServiceDate: timestamp('last_service_date'),
  nextServiceDate: timestamp('next_service_date'),

  notes: text('notes'),
  isActive: boolean('is_active').notNull().default(true),

  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  clientIdx: index('vehicles_client_idx').on(table.clientId),
  regIdx: index('vehicles_reg_idx').on(table.registrationNumber),
  regUniq: uniqueIndex('vehicles_reg_uniq').on(table.registrationNumber),
  typeIdx: index('vehicles_type_idx').on(table.vehicleType),
}));

// ==================== INTERVENTION TYPES TABLE ====================
export const interventionTypes = pgTable('intervention_types', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id'),

  name: text('name').notNull(),
  code: text('code').notNull(),
  description: text('description'),
  color: text('color').default('#3B82F6'), // For UI display
  icon: text('icon').default('wrench'), // Icon identifier

  // Default fields for this type
  defaultFields: jsonb('default_fields').default('[]'), // Array of field definitions
  requiredFields: text('required_fields').array().default([]), // Required field names

  estimatedDuration: integer('estimated_duration'), // Minutes
  isActive: boolean('is_active').notNull().default(true),

  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  orgIdx: index('intervention_types_org_idx').on(table.organizationId),
  codeIdx: index('intervention_types_code_idx').on(table.code),
  orgCodeUniq: uniqueIndex('intervention_types_org_code_uniq').on(table.organizationId, table.code),
}));

// ==================== INTERVENTIONS TABLE ====================
export const interventions = pgTable('interventions', {
  id: uuid('id').defaultRandom().primaryKey(),

  // References
  clientId: uuid('client_id').notNull().references(() => clients.id, { onDelete: 'cascade' }),
  vehicleId: uuid('vehicle_id').notNull().references(() => vehicles.id, { onDelete: 'cascade' }),
  typeId: uuid('type_id').notNull().references(() => interventionTypes.id, { onDelete: 'restrict' }),
  agentId: uuid('agent_id').notNull(),

  // Intervention Details
  interventionNumber: text('intervention_number').notNull().unique(), // Auto-generated unique number
  title: text('title').notNull(),
  description: text('description'),

  status: text('status').notNull().default('pending'), // pending, in_progress, completed, cancelled
  priority: text('priority').notNull().default('normal'), // low, normal, high, urgent

  // Scheduling
  scheduledDate: timestamp('scheduled_date'),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),

  // Location
  location: text('location'),
  latitude: decimal('latitude', { precision: 10, scale: 7 }),
  longitude: decimal('longitude', { precision: 10, scale: 7 }),

  // Custom Fields (dynamic based on intervention type)
  customFields: jsonb('custom_fields').default('{}'),

  // Mileage tracking
  mileageStart: integer('mileage_start'),
  mileageEnd: integer('mileage_end'),

  // Time tracking
  durationMinutes: integer('duration_minutes'),

  // Work performed
  workPerformed: text('work_performed'),
  partsUsed: jsonb('parts_used').default('[]'), // Array of parts

  // Costs
  laborCost: decimal('labor_cost', { precision: 10, scale: 2 }),
  partsCost: decimal('parts_cost', { precision: 10, scale: 2 }),
  totalCost: decimal('total_cost', { precision: 10, scale: 2 }),

  // Signatures
  agentSignature: text('agent_signature'), // Base64 image
  clientSignature: text('client_signature'), // Base64 image
  clientName: text('client_name'),

  // Sync tracking for offline mode
  isSynced: boolean('is_synced').notNull().default(true),
  localId: text('local_id'), // Local ID from offline device
  syncedAt: timestamp('synced_at'),

  // Metadata
  notes: text('notes'),
  internalNotes: text('internal_notes'), // Not visible to client

  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  clientIdx: index('interventions_client_idx').on(table.clientId),
  vehicleIdx: index('interventions_vehicle_idx').on(table.vehicleId),
  typeIdx: index('interventions_type_idx').on(table.typeId),
  agentIdx: index('interventions_agent_idx').on(table.agentId),
  statusIdx: index('interventions_status_idx').on(table.status),
  numberIdx: uniqueIndex('interventions_number_idx').on(table.interventionNumber),
  scheduledIdx: index('interventions_scheduled_idx').on(table.scheduledDate),
  createdIdx: index('interventions_created_idx').on(table.createdAt),
  localIdIdx: index('interventions_local_id_idx').on(table.localId),
  syncedIdx: index('interventions_synced_idx').on(table.isSynced),
}));

// ==================== INTERVENTION PHOTOS TABLE ====================
export const interventionPhotos = pgTable('intervention_photos', {
  id: uuid('id').defaultRandom().primaryKey(),
  interventionId: uuid('intervention_id').notNull().references(() => interventions.id, { onDelete: 'cascade' }),

  url: text('url').notNull(), // Storage URL
  fileName: text('file_name').notNull(),
  fileSize: integer('file_size').notNull(), // Bytes
  mimeType: text('mime_type').notNull(),

  // Photo metadata
  caption: text('caption'),
  photoType: text('photo_type').default('general'), // before, after, damage, general, part
  order: integer('order').notNull().default(0),

  // Geolocation when photo was taken
  latitude: decimal('latitude', { precision: 10, scale: 7 }),
  longitude: decimal('longitude', { precision: 10, scale: 7 }),

  // Sync tracking
  isSynced: boolean('is_synced').notNull().default(true),
  localPath: text('local_path'), // Local file path before upload

  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  interventionIdx: index('intervention_photos_intervention_idx').on(table.interventionId),
  typeIdx: index('intervention_photos_type_idx').on(table.photoType),
  orderIdx: index('intervention_photos_order_idx').on(table.interventionId, table.order),
}));

// ==================== AGENT SESSIONS TABLE ====================
export const agentSessions = pgTable('agent_sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  agentId: uuid('agent_id').notNull(),

  token: text('token').notNull().unique(),
  deviceId: text('device_id'),
  deviceName: text('device_name'),
  deviceType: text('device_type'), // mobile, tablet

  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),

  isActive: boolean('is_active').notNull().default(true),
  expiresAt: timestamp('expires_at').notNull(),
  lastActivityAt: timestamp('last_activity_at').notNull().defaultNow(),

  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  agentIdx: index('agent_sessions_agent_idx').on(table.agentId),
  tokenIdx: uniqueIndex('agent_sessions_token_idx').on(table.token),
  activeIdx: index('agent_sessions_active_idx').on(table.isActive),
  expiresIdx: index('agent_sessions_expires_idx').on(table.expiresAt),
}));

// ==================== RELATIONS ====================

export const clientsRelations = relations(clients, ({ many }) => ({
  // organization: one(organizations, {
  //   fields: [clients.organizationId],
  //   references: [organizations.id],
  // }),
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
  // organization: one(organizations, {
  //   fields: [interventionTypes.organizationId],
  //   references: [organizations.id],
  // }),
  interventions: many(interventions),
}));

export const interventionsRelations = relations(interventions, ({ one, many }) => ({
  client: one(clients, {
    fields: [interventions.clientId],
    references: [clients.id],
  }),
  vehicle: one(vehicles, {
    fields: [interventions.vehicleId],
    references: [vehicles.id],
  }),
  type: one(interventionTypes, {
    fields: [interventions.typeId],
    references: [interventionTypes.id],
  }),
  // agent: one(users, {
  //   fields: [interventions.agentId],
  //   references: [users.id],
  // }),
  photos: many(interventionPhotos),
}));

export const interventionPhotosRelations = relations(interventionPhotos, ({ one }) => ({
  intervention: one(interventions, {
    fields: [interventionPhotos.interventionId],
    references: [interventions.id],
  }),
}));

// export const agentSessionsRelations = relations(agentSessions, ({ one }) => ({
//   agent: one(users, {
//     fields: [agentSessions.agentId],
//     references: [users.id],
//   }),
// }));

// ==================== TYPES ====================

export type Client = typeof clients.$inferSelect;
export type NewClient = typeof clients.$inferInsert;

export type Vehicle = typeof vehicles.$inferSelect;
export type NewVehicle = typeof vehicles.$inferInsert;

export type InterventionType = typeof interventionTypes.$inferSelect;
export type NewInterventionType = typeof interventionTypes.$inferInsert;

export type Intervention = typeof interventions.$inferSelect;
export type NewIntervention = typeof interventions.$inferInsert;

export type InterventionPhoto = typeof interventionPhotos.$inferSelect;
export type NewInterventionPhoto = typeof interventionPhotos.$inferInsert;

export type AgentSession = typeof agentSessions.$inferSelect;
export type NewAgentSession = typeof agentSessions.$inferInsert;
