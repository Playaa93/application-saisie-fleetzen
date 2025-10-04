import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

// Types pour IndexedDB
interface PendingIntervention {
  id?: number;
  tempId: string; // UUID temporaire
  data: any; // Données du formulaire
  photos?: {
    before?: Blob;
    after?: Blob;
  };
  createdAt: number;
  retryCount: number;
  lastError?: string;
  status: 'pending' | 'syncing' | 'failed';
}

interface FleetZenDB extends DBSchema {
  'pending-interventions': {
    key: number;
    value: PendingIntervention;
    indexes: {
      'by-status': string;
      'by-created': number;
      'by-temp-id': string;
    };
  };
}

const DB_NAME = 'FleetZenOfflineDB';
const DB_VERSION = 1;

let dbInstance: IDBPDatabase<FleetZenDB> | null = null;

/**
 * Initialise et ouvre la base de données IndexedDB
 */
export async function getDB(): Promise<IDBPDatabase<FleetZenDB>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<FleetZenDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Table des interventions en attente
      if (!db.objectStoreNames.contains('pending-interventions')) {
        const store = db.createObjectStore('pending-interventions', {
          keyPath: 'id',
          autoIncrement: true,
        });

        // Index pour requêtes optimisées
        store.createIndex('by-status', 'status');
        store.createIndex('by-created', 'createdAt');
        store.createIndex('by-temp-id', 'tempId', { unique: true });
      }
    },
  });

  return dbInstance;
}

/**
 * Ajoute une intervention à la queue offline
 */
export async function queueIntervention(
  tempId: string,
  data: any,
  photos?: { before?: Blob; after?: Blob }
): Promise<number> {
  const db = await getDB();

  const intervention: PendingIntervention = {
    tempId,
    data,
    photos,
    createdAt: Date.now(),
    retryCount: 0,
    status: 'pending',
  };

  const id = await db.add('pending-interventions', intervention);
  return id as number;
}

/**
 * Récupère toutes les interventions en attente
 */
export async function getPendingInterventions(): Promise<PendingIntervention[]> {
  const db = await getDB();
  const tx = db.transaction('pending-interventions', 'readonly');
  const store = tx.objectStore('pending-interventions');
  const index = store.index('by-status');

  return await index.getAll('pending');
}

/**
 * Récupère le nombre d'interventions en attente
 */
export async function getPendingCount(): Promise<number> {
  const db = await getDB();
  const tx = db.transaction('pending-interventions', 'readonly');
  const store = tx.objectStore('pending-interventions');
  const index = store.index('by-status');

  return await index.count('pending');
}

/**
 * Met à jour le statut d'une intervention
 */
export async function updateInterventionStatus(
  id: number,
  status: 'pending' | 'syncing' | 'failed',
  error?: string
): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('pending-interventions', 'readwrite');
  const store = tx.objectStore('pending-interventions');

  const intervention = await store.get(id);
  if (intervention) {
    intervention.status = status;
    if (status === 'syncing') {
      intervention.retryCount += 1;
    }
    if (error) {
      intervention.lastError = error;
    }
    await store.put(intervention);
  }

  await tx.done;
}

/**
 * Supprime une intervention après sync réussi
 */
export async function deleteIntervention(id: number): Promise<void> {
  const db = await getDB();
  await db.delete('pending-interventions', id);
}

/**
 * Nettoie les interventions en échec depuis plus de 7 jours
 */
export async function cleanupOldFailed(): Promise<number> {
  const db = await getDB();
  const tx = db.transaction('pending-interventions', 'readwrite');
  const store = tx.objectStore('pending-interventions');
  const index = store.index('by-status');

  const failedItems = await index.getAll('failed');
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

  let deletedCount = 0;
  for (const item of failedItems) {
    if (item.createdAt < sevenDaysAgo && item.id) {
      await store.delete(item.id);
      deletedCount++;
    }
  }

  await tx.done;
  return deletedCount;
}

/**
 * Récupère toutes les interventions (pour debug/admin)
 */
export async function getAllInterventions(): Promise<PendingIntervention[]> {
  const db = await getDB();
  return await db.getAll('pending-interventions');
}
