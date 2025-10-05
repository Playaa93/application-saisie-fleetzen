/**
 * Schémas de validation Zod centralisés pour les API routes
 * Phase 1.2 - Audit de code 2025
 */

import { z } from 'zod';

// ============================================================================
// SCHÉMAS COMMUNS
// ============================================================================

export const uuidSchema = z.string().uuid({ message: 'ID invalide (UUID requis)' });

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const timestampSchema = z.string().datetime({ message: 'Format de date invalide (ISO 8601 requis)' });

// ============================================================================
// CLIENTS
// ============================================================================

export const clientCreateSchema = z.object({
  name: z.string().min(1, 'Nom requis').max(200),
  code: z.string().min(1).max(50).optional(),
  city: z.string().max(100).optional(),
  postal_code: z.string().max(10).optional(),
  contact_name: z.string().max(200).optional(),
  contact_phone: z.string().max(20).optional(),
  coordinates: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }).optional(),
});

export const clientUpdateSchema = clientCreateSchema.partial();

export const clientQuerySchema = z.object({
  search: z.string().optional(),
  active: z.coerce.boolean().default(true),
  ...paginationSchema.shape,
});

// ============================================================================
// VEHICLES
// ============================================================================

export const vehicleCreateSchema = z.object({
  client_id: uuidSchema,
  registration_number: z.string().min(1, 'Immatriculation requise').max(20),
  brand: z.string().max(100).optional(),
  model: z.string().max(100).optional(),
  work_site: z.string().max(200).optional(),
  vehicle_category: z.string().max(50).optional(),
  vin: z.string().max(17).optional(),
  year: z.coerce.number().int().min(1900).max(new Date().getFullYear() + 1).optional(),
});

export const vehicleUpdateSchema = vehicleCreateSchema.partial();

export const vehicleQuerySchema = z.object({
  clientId: uuidSchema.optional(),
  site: z.string().optional(),
  category: z.string().optional(),
  search: z.string().optional(),
  ...paginationSchema.shape,
});

export const vehicleCheckSchema = z.object({
  registration: z.string().min(1, 'Immatriculation requise'),
});

export const vehicleLinkSchema = z.object({
  vehicle_id: uuidSchema,
  client_id: uuidSchema,
});

// ============================================================================
// INTERVENTIONS
// ============================================================================

export const interventionStatusEnum = z.enum([
  'pending',
  'in_progress',
  'completed',
  'cancelled'
]);

export const interventionPriorityEnum = z.enum([
  'low',
  'normal',
  'high',
  'urgent'
]);

export const interventionCreateSchema = z.object({
  client_id: uuidSchema,
  vehicle_id: uuidSchema.optional(),
  type_id: uuidSchema,
  title: z.string().min(1, 'Titre requis').max(255),
  description: z.string().optional(),
  status: interventionStatusEnum.default('pending'),
  priority: interventionPriorityEnum.default('normal'),
  scheduled_date: timestampSchema.optional(),
  location: z.string().max(500).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  custom_fields: z.record(z.any()).optional(),
  notes: z.string().optional(),
});

export const interventionUpdateSchema = z.object({
  status: interventionStatusEnum.optional(),
  priority: interventionPriorityEnum.optional(),
  started_at: timestampSchema.optional(),
  completed_at: timestampSchema.optional(),
  mileage_start: z.coerce.number().int().min(0).optional(),
  mileage_end: z.coerce.number().int().min(0).optional(),
  duration_minutes: z.coerce.number().int().min(0).optional(),
  work_performed: z.string().optional(),
  parts_used: z.array(z.any()).optional(),
  labor_cost: z.coerce.number().min(0).optional(),
  parts_cost: z.coerce.number().min(0).optional(),
  total_cost: z.coerce.number().min(0).optional(),
  agent_signature: z.string().optional(),
  client_signature: z.string().optional(),
  client_name: z.string().max(200).optional(),
  notes: z.string().optional(),
  internal_notes: z.string().optional(),
  custom_fields: z.record(z.any()).optional(),
});

export const interventionQuerySchema = z.object({
  status: interventionStatusEnum.optional(),
  priority: interventionPriorityEnum.optional(),
  client_id: uuidSchema.optional(),
  vehicle_id: uuidSchema.optional(),
  type_id: uuidSchema.optional(),
  date_from: timestampSchema.optional(),
  date_to: timestampSchema.optional(),
  search: z.string().optional(),
  ...paginationSchema.shape,
});

// ============================================================================
// PHOTOS
// ============================================================================

export const photoTypeEnum = z.enum([
  'before',
  'after',
  'during',
  'general',
  'damage',
  'signature'
]);

export const photoUploadSchema = z.object({
  interventionId: uuidSchema,
  caption: z.string().max(500).optional(),
  photoType: photoTypeEnum.default('general'),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
});

// Validation fichier (à utiliser après formData.get())
export const photoFileSchema = z.instanceof(File)
  .refine((file) => file.size <= 10 * 1024 * 1024, {
    message: 'Fichier trop volumineux (max 10MB)',
  })
  .refine(
    (file) => ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type),
    { message: 'Format invalide (JPEG, PNG ou WebP uniquement)' }
  );

// ============================================================================
// SITES
// ============================================================================

export const siteQuerySchema = z.object({
  clientId: uuidSchema,
});

// ============================================================================
// INTERVENTION TYPES
// ============================================================================

export const interventionTypeCreateSchema = z.object({
  name: z.string().min(1, 'Nom requis').max(100),
  code: z.string().min(1).max(50),
  description: z.string().optional(),
  icon: z.string().max(50).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Couleur hexadécimale invalide').optional(),
  requires_vehicle: z.boolean().default(true),
  requires_photos: z.boolean().default(false),
  min_photos: z.coerce.number().int().min(0).default(0),
  sort_order: z.coerce.number().int().min(0).default(0),
});

// ============================================================================
// AUTH
// ============================================================================

export const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
});

// ============================================================================
// TYPES INFÉRÉS (pour TypeScript)
// ============================================================================

export type ClientCreate = z.infer<typeof clientCreateSchema>;
export type ClientUpdate = z.infer<typeof clientUpdateSchema>;
export type ClientQuery = z.infer<typeof clientQuerySchema>;

export type VehicleCreate = z.infer<typeof vehicleCreateSchema>;
export type VehicleUpdate = z.infer<typeof vehicleUpdateSchema>;
export type VehicleQuery = z.infer<typeof vehicleQuerySchema>;

export type InterventionCreate = z.infer<typeof interventionCreateSchema>;
export type InterventionUpdate = z.infer<typeof interventionUpdateSchema>;
export type InterventionQuery = z.infer<typeof interventionQuerySchema>;

export type PhotoUpload = z.infer<typeof photoUploadSchema>;

export type Login = z.infer<typeof loginSchema>;
