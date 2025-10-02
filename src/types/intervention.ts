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

export interface InterventionFormData {
  type: InterventionType;
  vehicleId: string;
  clientId: string;
  notes?: string;
  // Type-specific fields added dynamically
  [key: string]: any;
}
