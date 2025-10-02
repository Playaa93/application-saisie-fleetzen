/**
 * POST /api/interventions/sync
 * Batch sync for offline interventions
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db';
import { interventions, interventionPhotos, clients, vehicles, interventionTypes } from '@/db/intervention-schema';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { requireAuth, AuthenticatedRequest } from '@/middleware/auth';

const syncInterventionSchema = z.object({
  localId: z.string(),
  clientId: z.string().uuid(),
  vehicleId: z.string().uuid(),
  typeId: z.string().uuid(),
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']).default('pending'),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  scheduledDate: z.string().datetime().optional(),
  startedAt: z.string().datetime().optional(),
  completedAt: z.string().datetime().optional(),
  location: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  customFields: z.record(z.any()).optional(),
  mileageStart: z.number().int().optional(),
  mileageEnd: z.number().int().optional(),
  durationMinutes: z.number().int().optional(),
  workPerformed: z.string().optional(),
  partsUsed: z.array(z.any()).optional(),
  laborCost: z.number().optional(),
  partsCost: z.number().optional(),
  totalCost: z.number().optional(),
  agentSignature: z.string().optional(),
  clientSignature: z.string().optional(),
  clientName: z.string().optional(),
  notes: z.string().optional(),
  internalNotes: z.string().optional(),
  createdAt: z.string().datetime().optional(),
  photos: z.array(z.object({
    localPath: z.string(),
    url: z.string(),
    fileName: z.string(),
    fileSize: z.number(),
    mimeType: z.string(),
    caption: z.string().optional(),
    photoType: z.string().default('general'),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
  })).optional(),
});

const batchSyncSchema = z.object({
  interventions: z.array(syncInterventionSchema),
});

export async function POST(request: NextRequest) {
  return requireAuth(request, async (authRequest: AuthenticatedRequest) => {
    try {
      const body = await request.json();
      const validatedData = batchSyncSchema.parse(body);

      const syncResults = {
        success: [] as any[],
        failed: [] as any[],
      };

      // Process each intervention in the batch
      for (const interventionData of validatedData.interventions) {
        try {
          // Check if intervention with this localId already exists
          const [existing] = await db
            .select()
            .from(interventions)
            .where(eq(interventions.localId, interventionData.localId))
            .limit(1);

          let savedIntervention;

          if (existing) {
            // Update existing intervention
            const photos = interventionData.photos;
            delete (interventionData as any).photos;

            [savedIntervention] = await db
              .update(interventions)
              .set({
                ...interventionData,
                scheduledDate: interventionData.scheduledDate ? new Date(interventionData.scheduledDate) : null,
                startedAt: interventionData.startedAt ? new Date(interventionData.startedAt) : null,
                completedAt: interventionData.completedAt ? new Date(interventionData.completedAt) : null,
                isSynced: true,
                syncedAt: new Date(),
                updatedAt: new Date(),
              })
              .where(eq(interventions.id, existing.id))
              .returning();

            // Update photos
            if (photos && photos.length > 0) {
              for (const photo of photos) {
                await db.insert(interventionPhotos).values({
                  interventionId: savedIntervention.id,
                  ...photo,
                  isSynced: true,
                }).onConflictDoNothing();
              }
            }
          } else {
            // Generate intervention number
            const now = new Date();
            const prefix = 'INT';
            const timestamp = now.getTime().toString().slice(-8);
            const random = Math.random().toString(36).substring(2, 6).toUpperCase();
            const interventionNumber = `${prefix}-${timestamp}-${random}`;

            const photos = interventionData.photos;
            delete (interventionData as any).photos;

            // Create new intervention
            [savedIntervention] = await db
              .insert(interventions)
              .values({
                ...interventionData,
                agentId: authRequest.user!.id,
                interventionNumber,
                scheduledDate: interventionData.scheduledDate ? new Date(interventionData.scheduledDate) : null,
                startedAt: interventionData.startedAt ? new Date(interventionData.startedAt) : null,
                completedAt: interventionData.completedAt ? new Date(interventionData.completedAt) : null,
                isSynced: true,
                syncedAt: new Date(),
                createdAt: interventionData.createdAt ? new Date(interventionData.createdAt) : new Date(),
              })
              .returning();

            // Insert photos
            if (photos && photos.length > 0) {
              await db.insert(interventionPhotos).values(
                photos.map((photo, index) => ({
                  interventionId: savedIntervention.id,
                  ...photo,
                  order: index,
                  isSynced: true,
                }))
              );
            }
          }

          // Fetch complete data for response
          const [completeData] = await db
            .select({
              intervention: interventions,
              client: {
                id: clients.id,
                name: clients.name,
                code: clients.code,
              },
              vehicle: {
                id: vehicles.id,
                registrationNumber: vehicles.registrationNumber,
                brand: vehicles.brand,
                model: vehicles.model,
              },
              type: {
                id: interventionTypes.id,
                name: interventionTypes.name,
                code: interventionTypes.code,
              },
            })
            .from(interventions)
            .leftJoin(clients, eq(interventions.clientId, clients.id))
            .leftJoin(vehicles, eq(interventions.vehicleId, vehicles.id))
            .leftJoin(interventionTypes, eq(interventions.typeId, interventionTypes.id))
            .where(eq(interventions.id, savedIntervention.id))
            .limit(1);

          syncResults.success.push({
            localId: interventionData.localId,
            intervention: completeData,
          });
        } catch (error) {
          console.error(`Sync failed for localId ${interventionData.localId}:`, error);
          syncResults.failed.push({
            localId: interventionData.localId,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      return NextResponse.json({
        success: true,
        data: syncResults,
        meta: {
          total: validatedData.interventions.length,
          succeeded: syncResults.success.length,
          failed: syncResults.failed.length,
        },
      });
    } catch (error) {
      console.error('Batch sync error:', error);

      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Validation error', details: error.errors },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  });
}
