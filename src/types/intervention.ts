export type InterventionType = 'lavage' | 'carburant' | 'cuve';

export type InterventionStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export interface Vehicle {
  id: string;
  plateNumber: string;
  brand: string;
  model: string;
  type: string;
}

export interface Client {
  id: string;
  name: string;
  company?: string;
  phone: string;
  email?: string;
  address: string;
}

export interface PhotoData {
  id: string;
  url: string;
  type: 'before' | 'after' | 'during';
  timestamp: Date;
}

export interface BaseIntervention {
  id: string;
  type: InterventionType;
  agentId: string;
  agentName: string;
  vehicleId: string;
  vehicle: Vehicle;
  clientId: string;
  client: Client;
  status: InterventionStatus;
  photos: PhotoData[];
  notes?: string;
  startTime: Date;
  endTime?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface LavageIntervention extends BaseIntervention {
  type: 'lavage';
  washType: 'exterior' | 'interior' | 'complete' | 'express';
  products: string[];
  waterUsed?: number; // in liters
  duration?: number; // in minutes
}

export interface CarburantIntervention extends BaseIntervention {
  type: 'carburant';
  fuelType: 'diesel' | 'essence' | 'gpl' | 'electric';
  quantity: number; // in liters or kWh
  pricePerUnit: number;
  totalPrice: number;
  pumpNumber?: string;
  odometerReading?: number;
}

export interface CuveIntervention extends BaseIntervention {
  type: 'cuve';
  tankId: string;
  taskType: 'inspection' | 'cleaning' | 'maintenance' | 'filling';
  currentLevel?: number; // percentage
  capacity?: number; // in liters
  productType?: string;
  findings?: string;
  actionsTaken?: string[];
}

export type Intervention = LavageIntervention | CarburantIntervention | CuveIntervention;

// ============================================================================
// FORMULAIRES - TYPES STRICTS (remplace [key: string]: any)
// ============================================================================

export interface PhotoFile {
  file: File;
  url: string;
  timestamp: Date;
}

export interface LavageFormData {
  type: 'lavage';
  vehicleId: string | null;
  clientId: string | null;
  notes?: string;
  // Step 1: Type de prestation
  prestationLavage?: string;
  // Step 2: Client & Vehicle info
  client?: string;
  clientAutre?: string;
  siteTravail?: string;
  siteAutre?: string;
  typeVehicule?: string;
  vehicle?: string;
  // Step 3: Photos
  photosAvant?: File[];
  photosApres?: File[];
  // Step 4: Commentaires
  commentaires?: string;
}

export interface CarburantLivraisonFormData {
  type: 'carburant_livraison';
  vehicleId: string | null;
  clientId: string | null;
  notes?: string;
  // Step 2: Client & Vehicle info
  client?: string;
  clientAutre?: string;
  siteTravail?: string;
  siteAutre?: string;
  typeVehicule?: string;
  vehicle?: string;
  // Step 3: Carburant info
  fuelType?: 'diesel' | 'essence' | 'gpl';
  quantity?: number;
  pricePerUnit?: number;
  // Step 4: Photos
  photoManometre?: File[];
  photosAvant?: File[];
  photosApres?: File[];
  photoTicket?: File[];
  // Step 5: Commentaires
  commentaires?: string;
}

export interface CarburantCuveFormData {
  type: 'carburant_cuve';
  vehicleId: string | null;
  clientId: string | null;
  notes?: string;
  // Step 2: Client & Vehicle info
  client?: string;
  clientAutre?: string;
  siteTravail?: string;
  siteAutre?: string;
  typeVehicule?: string;
  vehicle?: string;
  // Step 3: Tank info
  tankLevel?: number;
  tankLevelAfter?: number;
  // Step 4: Photos
  photosJaugesAvant?: File[];
  photosJaugesApres?: File[];
  // Step 5: Commentaires
  commentaires?: string;
}

export type InterventionFormData =
  | LavageFormData
  | CarburantLivraisonFormData
  | CarburantCuveFormData;

// Photo metadata in stored interventions
export interface PhotoMetadata {
  url: string;
  timestamp: string;
}

// Metadata structure for stored interventions
export interface InterventionMetadata {
  photos: {
    photosAvant?: PhotoMetadata[];
    photosApres?: PhotoMetadata[];
    photoManometre?: PhotoMetadata[];
    photoTicket?: PhotoMetadata[];
    photosJaugesAvant?: PhotoMetadata[];
    photosJaugesApres?: PhotoMetadata[];
  };
  washType?: string;
  fuelType?: string;
  quantity?: number;
  pricePerUnit?: number;
  tankLevel?: number;
  latitude?: string;
  longitude?: string;
  gpsAccuracy?: string;
}

// Coordonnées GPS
export interface Coordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp?: string;
}

// ============================================================================
// VEHICLES
// ============================================================================

export interface VehicleData {
  id: string;
  registration_number: string;
  brand?: string;
  model?: string;
  year?: number;
  vehicle_category?: string;
  work_site?: string;
  client_id: string;
  clients?: {
    name: string;
  };
}

// ============================================================================
// INTERVENTION DETAIL (from DB)
// ============================================================================

export interface PhotoRecord {
  id: number;
  url: string;
  type: string;
}

export interface InterventionDetail {
  id: string;
  type: string;
  typeCode: string;
  typeIcon: string;
  typeColor: string;
  client: string;
  clientId: string;
  vehicule: string;
  vehicleId: string | null;
  vehicleCategory: string;
  agent: string;
  agentEmail: string;
  status: string;
  notes: string | null;
  internalNotes: string | null;
  coordinates: Coordinates | null;
  locationAccuracy: number | null;
  scheduledAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  signedAt: string | null;
  clientSignature: string | null;
  agentSignature: string | null;
  metadata: InterventionMetadata;
  createdAt: string;
  updatedAt: string;
  syncedAt: string | null;
  photos: PhotoRecord[];
}
