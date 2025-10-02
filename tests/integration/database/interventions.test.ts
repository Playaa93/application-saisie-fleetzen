/**
 * Integration Tests - Database Operations for Interventions
 * Tests CRUD operations, transactions, and data integrity
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { sql, eq, and, desc } from 'drizzle-orm';
import { db } from '../../../src/db';
import {
  forms,
  formFields,
  submissions,
  submissionData,
  users,
  organizations
} from '../../../src/db/schema';

describe('Interventions Database Integration', () => {
  let testUserId: string;
  let testOrgId: string;
  let testFormId: string;
  let fieldIds: Record<string, string> = {};

  beforeAll(async () => {
    // Create test organization
    const [org] = await db.insert(organizations).values({
      name: 'Test Organization',
      slug: 'test-org',
      planType: 'pro',
    }).returning();
    testOrgId = org.id;

    // Create test user
    const [user] = await db.insert(users).values({
      email: 'test-agent@example.com',
      passwordHash: 'hashed-password',
      fullName: 'Test Agent',
      organizationId: testOrgId,
      role: 'user',
    }).returning();
    testUserId = user.id;

    // Create intervention form
    const [form] = await db.insert(forms).values({
      title: 'Field Intervention Form',
      description: 'Track field agent interventions',
      slug: 'field-interventions',
      status: 'published',
      userId: testUserId,
      organizationId: testOrgId,
    }).returning();
    testFormId = form.id;

    // Create form fields
    const fields = await db.insert(formFields).values([
      {
        formId: testFormId,
        name: 'location',
        label: 'Location',
        type: 'short_text',
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
        name: 'priority',
        label: 'Priority',
        type: 'dropdown',
        isRequired: true,
        options: [
          { value: 'low', label: 'Low' },
          { value: 'medium', label: 'Medium' },
          { value: 'high', label: 'High' },
          { value: 'critical', label: 'Critical' },
        ],
        order: 3,
      },
      {
        formId: testFormId,
        name: 'photo',
        label: 'Photo',
        type: 'file_upload',
        isRequired: false,
        order: 4,
      },
    ]).returning();

    fields.forEach(field => {
      fieldIds[field.name] = field.id;
    });
  });

  afterAll(async () => {
    // Cleanup test data
    await db.delete(forms).where(eq(forms.id, testFormId));
    await db.delete(users).where(eq(users.id, testUserId));
    await db.delete(organizations).where(eq(organizations.id, testOrgId));
  });

  beforeEach(async () => {
    // Clean submissions before each test
    await db.delete(submissions).where(eq(submissions.formId, testFormId));
  });

  describe('Submission Creation', () => {
    it('should create a complete intervention submission', async () => {
      const [submission] = await db.insert(submissions).values({
        formId: testFormId,
        userId: testUserId,
        submissionToken: `token-${Date.now()}`,
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0...',
      }).returning();

      expect(submission.id).toBeTruthy();
      expect(submission.formId).toBe(testFormId);
      expect(submission.status).toBe('submitted');
    });

    it('should store intervention field data', async () => {
      const [submission] = await db.insert(submissions).values({
        formId: testFormId,
        userId: testUserId,
        submissionToken: `token-${Date.now()}`,
      }).returning();

      const fieldData = await db.insert(submissionData).values([
        {
          submissionId: submission.id,
          fieldId: fieldIds.location,
          fieldName: 'location',
          fieldType: 'short_text',
          value: 'Building A, Floor 3',
        },
        {
          submissionId: submission.id,
          fieldId: fieldIds.description,
          fieldName: 'description',
          fieldType: 'long_text',
          value: 'Water leak in ceiling',
        },
        {
          submissionId: submission.id,
          fieldId: fieldIds.priority,
          fieldName: 'priority',
          fieldType: 'dropdown',
          value: 'high',
        },
      ]).returning();

      expect(fieldData).toHaveLength(3);
    });

    it('should handle anonymous submissions', async () => {
      const [submission] = await db.insert(submissions).values({
        formId: testFormId,
        userId: null, // Anonymous
        submissionToken: `token-${Date.now()}`,
        ipAddress: '192.168.1.100',
      }).returning();

      expect(submission.userId).toBeNull();
      expect(submission.id).toBeTruthy();
    });

    it('should enforce unique submission tokens', async () => {
      const token = `unique-token-${Date.now()}`;

      await db.insert(submissions).values({
        formId: testFormId,
        userId: testUserId,
        submissionToken: token,
      });

      // Attempt duplicate
      await expect(
        db.insert(submissions).values({
          formId: testFormId,
          userId: testUserId,
          submissionToken: token,
        })
      ).rejects.toThrow();
    });
  });

  describe('Submission Retrieval', () => {
    it('should retrieve submission with all field data', async () => {
      // Create submission
      const [submission] = await db.insert(submissions).values({
        formId: testFormId,
        userId: testUserId,
        submissionToken: `token-${Date.now()}`,
      }).returning();

      await db.insert(submissionData).values([
        {
          submissionId: submission.id,
          fieldId: fieldIds.location,
          fieldName: 'location',
          fieldType: 'short_text',
          value: 'Test Location',
        },
      ]);

      // Retrieve with join
      const result = await db.query.submissions.findFirst({
        where: eq(submissions.id, submission.id),
        with: {
          data: true,
        },
      });

      expect(result).toBeTruthy();
      expect(result?.data).toHaveLength(1);
      expect(result?.data[0].value).toBe('Test Location');
    });

    it('should filter submissions by status', async () => {
      await db.insert(submissions).values([
        {
          formId: testFormId,
          userId: testUserId,
          submissionToken: `token-1-${Date.now()}`,
          status: 'submitted',
        },
        {
          formId: testFormId,
          userId: testUserId,
          submissionToken: `token-2-${Date.now()}`,
          status: 'reviewed',
        },
      ]);

      const submittedOnes = await db.query.submissions.findMany({
        where: and(
          eq(submissions.formId, testFormId),
          eq(submissions.status, 'submitted')
        ),
      });

      expect(submittedOnes).toHaveLength(1);
      expect(submittedOnes[0].status).toBe('submitted');
    });

    it('should retrieve submissions ordered by date', async () => {
      await db.insert(submissions).values([
        {
          formId: testFormId,
          userId: testUserId,
          submissionToken: `token-old-${Date.now()}`,
          createdAt: new Date('2024-01-01'),
        },
        {
          formId: testFormId,
          userId: testUserId,
          submissionToken: `token-new-${Date.now()}`,
          createdAt: new Date('2024-12-31'),
        },
      ]);

      const ordered = await db.query.submissions.findMany({
        where: eq(submissions.formId, testFormId),
        orderBy: [desc(submissions.createdAt)],
      });

      expect(ordered[0].createdAt.getFullYear()).toBe(2024);
      expect(ordered[0].createdAt.getMonth()).toBe(11); // December
    });
  });

  describe('Submission Updates', () => {
    it('should update submission status', async () => {
      const [submission] = await db.insert(submissions).values({
        formId: testFormId,
        userId: testUserId,
        submissionToken: `token-${Date.now()}`,
        status: 'submitted',
      }).returning();

      await db.update(submissions)
        .set({
          status: 'reviewed',
          reviewedBy: testUserId,
          reviewedAt: new Date(),
        })
        .where(eq(submissions.id, submission.id));

      const updated = await db.query.submissions.findFirst({
        where: eq(submissions.id, submission.id),
      });

      expect(updated?.status).toBe('reviewed');
      expect(updated?.reviewedBy).toBe(testUserId);
      expect(updated?.reviewedAt).toBeTruthy();
    });

    it('should flag submission as spam', async () => {
      const [submission] = await db.insert(submissions).values({
        formId: testFormId,
        submissionToken: `token-${Date.now()}`,
      }).returning();

      await db.update(submissions)
        .set({
          flaggedAsSpam: true,
          spamScore: 85,
        })
        .where(eq(submissions.id, submission.id));

      const flagged = await db.query.submissions.findFirst({
        where: eq(submissions.id, submission.id),
      });

      expect(flagged?.flaggedAsSpam).toBe(true);
      expect(flagged?.spamScore).toBe(85);
    });
  });

  describe('Submission Deletion', () => {
    it('should cascade delete submission data', async () => {
      const [submission] = await db.insert(submissions).values({
        formId: testFormId,
        userId: testUserId,
        submissionToken: `token-${Date.now()}`,
      }).returning();

      await db.insert(submissionData).values({
        submissionId: submission.id,
        fieldId: fieldIds.location,
        fieldName: 'location',
        fieldType: 'short_text',
        value: 'To be deleted',
      });

      // Delete submission
      await db.delete(submissions).where(eq(submissions.id, submission.id));

      // Check cascade
      const orphanedData = await db.query.submissionData.findMany({
        where: eq(submissionData.submissionId, submission.id),
      });

      expect(orphanedData).toHaveLength(0);
    });
  });

  describe('Transaction Handling', () => {
    it('should rollback on error', async () => {
      try {
        await db.transaction(async (tx) => {
          const [submission] = await tx.insert(submissions).values({
            formId: testFormId,
            userId: testUserId,
            submissionToken: `token-${Date.now()}`,
          }).returning();

          await tx.insert(submissionData).values({
            submissionId: submission.id,
            fieldId: fieldIds.location,
            fieldName: 'location',
            fieldType: 'short_text',
            value: 'Test',
          });

          // Force error
          throw new Error('Intentional error');
        });
      } catch (error) {
        // Expected error
      }

      // Check no submissions were created
      const count = await db.$count(submissions, eq(submissions.formId, testFormId));
      expect(count).toBe(0);
    });

    it('should commit successful transaction', async () => {
      await db.transaction(async (tx) => {
        const [submission] = await tx.insert(submissions).values({
          formId: testFormId,
          userId: testUserId,
          submissionToken: `token-${Date.now()}`,
        }).returning();

        await tx.insert(submissionData).values({
          submissionId: submission.id,
          fieldId: fieldIds.location,
          fieldName: 'location',
          fieldType: 'short_text',
          value: 'Committed',
        });
      });

      const count = await db.$count(submissions, eq(submissions.formId, testFormId));
      expect(count).toBe(1);
    });
  });

  describe('Performance', () => {
    it('should handle bulk inserts efficiently', async () => {
      const start = performance.now();

      const bulkSubmissions = Array(100).fill(null).map((_, i) => ({
        formId: testFormId,
        userId: testUserId,
        submissionToken: `bulk-token-${i}-${Date.now()}`,
      }));

      await db.insert(submissions).values(bulkSubmissions);

      const duration = performance.now() - start;

      expect(duration).toBeLessThan(5000); // Should complete under 5 seconds
    });

    it('should use indexes for fast queries', async () => {
      // Create test data
      await db.insert(submissions).values(
        Array(50).fill(null).map((_, i) => ({
          formId: testFormId,
          userId: testUserId,
          submissionToken: `perf-token-${i}-${Date.now()}`,
          status: i % 2 === 0 ? 'submitted' : 'reviewed',
        }))
      );

      const start = performance.now();

      // Query with indexed field
      await db.query.submissions.findMany({
        where: and(
          eq(submissions.formId, testFormId),
          eq(submissions.status, 'submitted')
        ),
      });

      const duration = performance.now() - start;

      expect(duration).toBeLessThan(100); // Indexed query should be fast
    });
  });
});
