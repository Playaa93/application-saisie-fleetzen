/**
 * Integration Tests - Interventions API Routes
 * Tests field agent intervention submission, photo upload, and offline sync
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import { sql } from 'drizzle-orm';
import { db } from '../../../src/db';
import { forms, formFields, submissions, submissionData } from '../../../src/db/schema';

// Mock API client for testing
class InterventionsAPI {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string = 'http://localhost:3000/api') {
    this.baseUrl = baseUrl;
  }

  setAuthToken(token: string) {
    this.token = token;
  }

  async createIntervention(data: any) {
    const response = await fetch(`${this.baseUrl}/interventions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { 'Authorization': `Bearer ${this.token}` }),
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    return response.json();
  }

  async uploadPhoto(interventionId: string, file: File) {
    const formData = new FormData();
    formData.append('photo', file);
    formData.append('interventionId', interventionId);

    const response = await fetch(`${this.baseUrl}/interventions/photos`, {
      method: 'POST',
      headers: {
        ...(this.token && { 'Authorization': `Bearer ${this.token}` }),
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    return response.json();
  }

  async getIntervention(id: string) {
    const response = await fetch(`${this.baseUrl}/interventions/${id}`, {
      headers: {
        ...(this.token && { 'Authorization': `Bearer ${this.token}` }),
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    return response.json();
  }

  async syncOfflineInterventions(interventions: any[]) {
    const response = await fetch(`${this.baseUrl}/interventions/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { 'Authorization': `Bearer ${this.token}` }),
      },
      body: JSON.stringify({ interventions }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    return response.json();
  }
}

describe('Interventions API Integration Tests', () => {
  let api: InterventionsAPI;
  let testFormId: string;

  beforeAll(async () => {
    api = new InterventionsAPI();

    // Create test form
    const [form] = await db.insert(forms).values({
      title: 'Field Intervention Form',
      description: 'Mobile field agent intervention tracking',
      status: 'published',
      userId: sql`uuid_generate_v4()`,
    }).returning();

    testFormId = form.id;

    // Create form fields
    await db.insert(formFields).values([
      {
        formId: testFormId,
        name: 'location',
        label: 'Intervention Location',
        type: 'text',
        isRequired: true,
        order: 1,
      },
      {
        formId: testFormId,
        name: 'description',
        label: 'Description',
        type: 'long_text',
        isRequired: true,
        order: 2,
      },
      {
        formId: testFormId,
        name: 'photo',
        label: 'Photo Evidence',
        type: 'file_upload',
        isRequired: false,
        order: 3,
      },
      {
        formId: testFormId,
        name: 'priority',
        label: 'Priority Level',
        type: 'dropdown',
        options: [
          { value: 'low', label: 'Low' },
          { value: 'medium', label: 'Medium' },
          { value: 'high', label: 'High' },
          { value: 'critical', label: 'Critical' },
        ],
        isRequired: true,
        order: 4,
      },
    ]);
  });

  afterAll(async () => {
    // Cleanup: Delete test data
    await db.delete(forms).where(sql`id = ${testFormId}`);
  });

  beforeEach(() => {
    // Setup for each test
  });

  afterEach(async () => {
    // Cleanup submissions after each test
    await db.delete(submissions).where(sql`form_id = ${testFormId}`);
  });

  describe('POST /api/interventions', () => {
    it('should create a new intervention with all required fields', async () => {
      const interventionData = {
        formId: testFormId,
        location: 'Building A, Floor 3',
        description: 'Water leak detected in ceiling',
        priority: 'high',
        timestamp: new Date().toISOString(),
      };

      const response = await api.createIntervention(interventionData);

      expect(response.success).toBe(true);
      expect(response.data).toHaveProperty('id');
      expect(response.data.location).toBe(interventionData.location);
      expect(response.data.priority).toBe('high');
    });

    it('should reject intervention with missing required fields', async () => {
      const invalidData = {
        formId: testFormId,
        location: 'Building A',
        // Missing description (required)
      };

      await expect(api.createIntervention(invalidData))
        .rejects
        .toThrow();
    });

    it('should validate priority field values', async () => {
      const invalidData = {
        formId: testFormId,
        location: 'Building A',
        description: 'Test',
        priority: 'invalid-priority',
      };

      await expect(api.createIntervention(invalidData))
        .rejects
        .toThrow();
    });

    it('should accept optional fields', async () => {
      const data = {
        formId: testFormId,
        location: 'Building B',
        description: 'Routine maintenance',
        priority: 'low',
        notes: 'Additional notes here',
      };

      const response = await api.createIntervention(data);

      expect(response.success).toBe(true);
      expect(response.data.notes).toBe(data.notes);
    });

    it('should store geolocation data when provided', async () => {
      const data = {
        formId: testFormId,
        location: 'Building C',
        description: 'Emergency repair',
        priority: 'critical',
        geolocation: {
          latitude: 40.7128,
          longitude: -74.0060,
          accuracy: 10,
        },
      };

      const response = await api.createIntervention(data);

      expect(response.success).toBe(true);
      expect(response.data.geolocation).toMatchObject(data.geolocation);
    });
  });

  describe('POST /api/interventions/photos', () => {
    it('should upload photo for an intervention', async () => {
      // Create intervention first
      const intervention = await api.createIntervention({
        formId: testFormId,
        location: 'Building D',
        description: 'Testing photo upload',
        priority: 'medium',
      });

      const photoFile = new File(
        ['fake-image-data'],
        'intervention-photo.jpg',
        { type: 'image/jpeg' }
      );

      const response = await api.uploadPhoto(intervention.data.id, photoFile);

      expect(response.success).toBe(true);
      expect(response.data).toHaveProperty('photoUrl');
      expect(response.data.fileName).toBe('intervention-photo.jpg');
    });

    it('should compress large photos automatically', async () => {
      const intervention = await api.createIntervention({
        formId: testFormId,
        location: 'Building E',
        description: 'Large photo test',
        priority: 'low',
      });

      // Simulate 5MB photo
      const largePhoto = new File(
        [new ArrayBuffer(5 * 1024 * 1024)],
        'large-photo.jpg',
        { type: 'image/jpeg' }
      );

      const response = await api.uploadPhoto(intervention.data.id, largePhoto);

      expect(response.success).toBe(true);
      expect(response.data.compressed).toBe(true);
      expect(response.data.originalSize).toBeGreaterThan(response.data.compressedSize);
    });

    it('should reject non-image files', async () => {
      const intervention = await api.createIntervention({
        formId: testFormId,
        location: 'Building F',
        description: 'Invalid file test',
        priority: 'low',
      });

      const pdfFile = new File(['pdf-content'], 'document.pdf', {
        type: 'application/pdf',
      });

      await expect(api.uploadPhoto(intervention.data.id, pdfFile))
        .rejects
        .toThrow();
    });

    it('should support multiple photos per intervention', async () => {
      const intervention = await api.createIntervention({
        formId: testFormId,
        location: 'Building G',
        description: 'Multiple photos test',
        priority: 'medium',
      });

      const photos = [
        new File(['photo1'], 'photo1.jpg', { type: 'image/jpeg' }),
        new File(['photo2'], 'photo2.jpg', { type: 'image/jpeg' }),
        new File(['photo3'], 'photo3.jpg', { type: 'image/jpeg' }),
      ];

      const uploads = await Promise.all(
        photos.map(photo => api.uploadPhoto(intervention.data.id, photo))
      );

      expect(uploads).toHaveLength(3);
      uploads.forEach(upload => {
        expect(upload.success).toBe(true);
      });
    });
  });

  describe('GET /api/interventions/:id', () => {
    it('should retrieve intervention by ID', async () => {
      const created = await api.createIntervention({
        formId: testFormId,
        location: 'Building H',
        description: 'Retrieval test',
        priority: 'low',
      });

      const retrieved = await api.getIntervention(created.data.id);

      expect(retrieved.success).toBe(true);
      expect(retrieved.data.id).toBe(created.data.id);
      expect(retrieved.data.location).toBe('Building H');
    });

    it('should return 404 for non-existent intervention', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';

      await expect(api.getIntervention(fakeId))
        .rejects
        .toThrow(/404/);
    });

    it('should include photo URLs in response', async () => {
      const intervention = await api.createIntervention({
        formId: testFormId,
        location: 'Building I',
        description: 'Photo retrieval test',
        priority: 'medium',
      });

      const photo = new File(['photo'], 'test.jpg', { type: 'image/jpeg' });
      await api.uploadPhoto(intervention.data.id, photo);

      const retrieved = await api.getIntervention(intervention.data.id);

      expect(retrieved.data.photos).toHaveLength(1);
      expect(retrieved.data.photos[0]).toHaveProperty('url');
    });
  });

  describe('POST /api/interventions/sync - Offline Sync', () => {
    it('should sync multiple offline interventions', async () => {
      const offlineInterventions = [
        {
          localId: 'offline-1',
          formId: testFormId,
          location: 'Offline Location 1',
          description: 'Created while offline',
          priority: 'medium',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          localId: 'offline-2',
          formId: testFormId,
          location: 'Offline Location 2',
          description: 'Another offline entry',
          priority: 'high',
          timestamp: new Date(Date.now() - 7200000).toISOString(),
        },
      ];

      const response = await api.syncOfflineInterventions(offlineInterventions);

      expect(response.success).toBe(true);
      expect(response.data.synced).toBe(2);
      expect(response.data.mapping).toHaveProperty('offline-1');
      expect(response.data.mapping).toHaveProperty('offline-2');
    });

    it('should detect and resolve conflicts', async () => {
      // Create intervention online
      const online = await api.createIntervention({
        formId: testFormId,
        location: 'Conflict Location',
        description: 'Online version',
        priority: 'low',
      });

      // Simulate offline modification of same intervention
      const offlineModification = [{
        localId: 'offline-conflict',
        serverId: online.data.id,
        formId: testFormId,
        location: 'Conflict Location',
        description: 'Offline modification',
        priority: 'high',
        timestamp: new Date().toISOString(),
      }];

      const response = await api.syncOfflineInterventions(offlineModification);

      expect(response.success).toBe(true);
      expect(response.data.conflicts).toHaveLength(1);
    });

    it('should handle partial sync failures gracefully', async () => {
      const mixed = [
        {
          localId: 'valid-1',
          formId: testFormId,
          location: 'Valid Location',
          description: 'Valid entry',
          priority: 'low',
        },
        {
          localId: 'invalid-1',
          formId: testFormId,
          location: 'Invalid',
          // Missing required description field
          priority: 'medium',
        },
      ];

      const response = await api.syncOfflineInterventions(mixed);

      expect(response.success).toBe(true);
      expect(response.data.synced).toBe(1);
      expect(response.data.failed).toBe(1);
      expect(response.data.errors).toHaveLength(1);
    });
  });

  describe('Performance & Load Tests', () => {
    it('should handle concurrent intervention creation', async () => {
      const promises = Array(10).fill(null).map((_, i) =>
        api.createIntervention({
          formId: testFormId,
          location: `Concurrent Location ${i}`,
          description: `Concurrent test ${i}`,
          priority: 'low',
        })
      );

      const start = performance.now();
      const results = await Promise.all(promises);
      const duration = performance.now() - start;

      expect(results).toHaveLength(10);
      expect(duration).toBeLessThan(5000); // Should complete under 5 seconds
    });

    it('should process large batch sync efficiently', async () => {
      const batch = Array(50).fill(null).map((_, i) => ({
        localId: `batch-${i}`,
        formId: testFormId,
        location: `Batch Location ${i}`,
        description: `Batch intervention ${i}`,
        priority: i % 2 === 0 ? 'low' : 'medium',
      }));

      const start = performance.now();
      const response = await api.syncOfflineInterventions(batch);
      const duration = performance.now() - start;

      expect(response.data.synced).toBe(50);
      expect(duration).toBeLessThan(10000); // Should complete under 10 seconds
    });
  });
});
