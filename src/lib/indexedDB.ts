/**
 * IndexedDB utility for storing intervention form drafts
 * PWA-compatible persistent storage
 */

const DB_NAME = 'fleetzen-drafts';
const DB_VERSION = 2; // Upgraded for photo-blobs store
const STORE_NAME = 'interventions';
const PHOTO_STORE_NAME = 'photo-blobs';

import { InterventionFormData } from '@/types/intervention';

export interface DraftData {
  id: string;
  typePrestation: string;
  formData: InterventionFormData;
  currentStep: number;
  timestamp: number;
}

/**
 * Open IndexedDB connection
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create interventions store if not exists
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        objectStore.createIndex('timestamp', 'timestamp', { unique: false });
      }

      // Create photo-blobs store for version 2+
      if (!db.objectStoreNames.contains(PHOTO_STORE_NAME)) {
        const photoStore = db.createObjectStore(PHOTO_STORE_NAME, { keyPath: 'id', autoIncrement: true });
        photoStore.createIndex('draftId', 'draftId', { unique: false });
        photoStore.createIndex('photoKey', 'photoKey', { unique: false });
      }
    };
  });
}

/**
 * Save draft to IndexedDB
 */
export async function saveDraft(draft: DraftData): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(draft);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);

    transaction.oncomplete = () => db.close();
  });
}

/**
 * Get draft from IndexedDB
 */
export async function getDraft(id: string): Promise<DraftData | null> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);

    transaction.oncomplete = () => db.close();
  });
}

/**
 * Delete draft from IndexedDB
 */
export async function deleteDraft(id: string): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);

    transaction.oncomplete = () => db.close();
  });
}

/**
 * List all drafts from IndexedDB
 */
export async function listDrafts(): Promise<DraftData[]> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);

    transaction.oncomplete = () => db.close();
  });
}

/**
 * Clear all drafts (for testing/cleanup)
 */
export async function clearAllDrafts(): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);

    transaction.oncomplete = () => db.close();
  });
}

// ============================================
// Photo Blob Storage
// ============================================

export interface PhotoBlob {
  id?: number; // Auto-incremented
  draftId: string; // References draft.id
  photoKey: string; // 'photosAvant', 'photosApres', etc.
  index: number; // Position in array
  blob: Blob;
  name: string;
  type: string;
  size: number;
}

/**
 * Save photo blobs for a draft
 */
export async function savePhotoBlobs(draftId: string, photoKey: string, files: File[]): Promise<void> {
  if (!files || files.length === 0) return;

  try {
    const db = await openDB();

    // Check if photo store exists before trying to write
    if (!db.objectStoreNames.contains(PHOTO_STORE_NAME)) {
      console.warn('Photo store does not exist yet, skipping photo save');
      db.close();
      return;
    }

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([PHOTO_STORE_NAME], 'readwrite');
      const store = transaction.objectStore(PHOTO_STORE_NAME);

      // Delete existing photos for this draftId + photoKey combination
      const index = store.index('draftId');
      const cursorRequest = index.openCursor(IDBKeyRange.only(draftId));

      cursorRequest.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          const record = cursor.value as PhotoBlob;
          if (record.photoKey === photoKey) {
            cursor.delete();
          }
          cursor.continue();
        } else {
          // After deletion, save new photos
          files.forEach((file, idx) => {
            const photoBlob: PhotoBlob = {
              draftId,
              photoKey,
              index: idx,
              blob: file,
              name: file.name,
              type: file.type,
              size: file.size,
            };
            store.add(photoBlob);
          });
        }
      };

      transaction.oncomplete = () => {
        db.close();
        resolve();
      };
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (error) {
    console.warn('Error in savePhotoBlobs:', error);
    // Silent fail if store doesn't exist yet
  }
}

/**
 * Get all photo blobs for a draft
 * Returns object: { photosAvant: File[], photosApres: File[], ... }
 */
export async function getPhotoBlobs(draftId: string): Promise<Record<string, File[]>> {
  try {
    const db = await openDB();

    // Check if photo store exists before trying to read
    if (!db.objectStoreNames.contains(PHOTO_STORE_NAME)) {
      console.warn('Photo store does not exist yet, returning empty photos');
      db.close();
      return {};
    }

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([PHOTO_STORE_NAME], 'readonly');
      const store = transaction.objectStore(PHOTO_STORE_NAME);
      const index = store.index('draftId');
      const request = index.getAll(IDBKeyRange.only(draftId));

      request.onsuccess = () => {
        const photos = (request.result || []) as PhotoBlob[];

        // Group by photoKey and reconstruct Files
        const result: Record<string, File[]> = {};
        photos.forEach(photo => {
          if (!result[photo.photoKey]) {
            result[photo.photoKey] = [];
          }
          // Reconstruct File from Blob
          const file = new File([photo.blob], photo.name, { type: photo.type });
          result[photo.photoKey][photo.index] = file;
        });

        resolve(result);
      };
      request.onerror = () => reject(request.error);

      transaction.oncomplete = () => db.close();
    });
  } catch (error) {
    console.warn('Error in getPhotoBlobs:', error);
    // Return empty object if store doesn't exist yet
    return {};
  }
}

/**
 * Delete all photo blobs for a draft
 */
export async function deletePhotoBlobs(draftId: string): Promise<void> {
  try {
    const db = await openDB();

    // Check if photo store exists before trying to delete
    if (!db.objectStoreNames.contains(PHOTO_STORE_NAME)) {
      console.warn('Photo store does not exist yet, skipping photo deletion');
      db.close();
      return;
    }

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([PHOTO_STORE_NAME], 'readwrite');
      const store = transaction.objectStore(PHOTO_STORE_NAME);
      const index = store.index('draftId');
      const request = index.openCursor(IDBKeyRange.only(draftId));

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        }
      };

      transaction.oncomplete = () => {
        db.close();
        resolve();
      };
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (error) {
    console.warn('Error in deletePhotoBlobs:', error);
    // Silent fail if store doesn't exist yet
  }
}
