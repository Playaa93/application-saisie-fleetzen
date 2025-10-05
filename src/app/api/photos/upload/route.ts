/**
 * POST /api/photos/upload
 * Upload and compress intervention photos (max 1MB)
 */

import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import sharp from 'sharp';
import { z } from 'zod';
import { db } from '@/db';
import { interventionPhotos, interventions } from '@/db/intervention-schema';
import { eq } from 'drizzle-orm';
import { requireAuth, AuthenticatedRequest } from '@/middleware/auth';
import logger, { logError } from '@/lib/logger';

const MAX_FILE_SIZE = 1024 * 1024; // 1MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads', 'interventions');

// Ensure upload directory exists
async function ensureUploadDir() {
  try {
    await mkdir(UPLOAD_DIR, { recursive: true });
  } catch (error) {
    logError(error, { context: 'ensureUploadDir' });
  }
}

/**
 * Compress image to target size (max 1MB)
 */
async function compressImage(buffer: Buffer, mimeType: string): Promise<Buffer> {
  let quality = 90;
  let compressed = buffer;

  // Convert to appropriate format
  let sharpInstance = sharp(buffer);

  // Set format based on mime type
  if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') {
    sharpInstance = sharpInstance.jpeg({ quality });
  } else if (mimeType === 'image/png') {
    sharpInstance = sharpInstance.png({ quality });
  } else if (mimeType === 'image/webp') {
    sharpInstance = sharpInstance.webp({ quality });
  }

  // Resize if too large (max 2048px on longest side)
  const metadata = await sharp(buffer).metadata();
  if (metadata.width && metadata.height) {
    const maxDimension = Math.max(metadata.width, metadata.height);
    if (maxDimension > 2048) {
      sharpInstance = sharpInstance.resize(2048, 2048, {
        fit: 'inside',
        withoutEnlargement: true,
      });
    }
  }

  compressed = await sharpInstance.toBuffer();

  // Reduce quality until under 1MB
  while (compressed.length > MAX_FILE_SIZE && quality > 10) {
    quality -= 10;

    sharpInstance = sharp(buffer);

    if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') {
      sharpInstance = sharpInstance.jpeg({ quality });
    } else if (mimeType === 'image/png') {
      sharpInstance = sharpInstance.png({ quality });
    } else if (mimeType === 'image/webp') {
      sharpInstance = sharpInstance.webp({ quality });
    }

    // Also resize
    sharpInstance = sharpInstance.resize(2048, 2048, {
      fit: 'inside',
      withoutEnlargement: true,
    });

    compressed = await sharpInstance.toBuffer();
  }

  return compressed;
}

export async function POST(request: NextRequest) {
  return requireAuth(request, async (authRequest: AuthenticatedRequest) => {
    try {
      await ensureUploadDir();

      const formData = await authRequest.formData();

      const interventionId = formData.get('interventionId') as string;
      const caption = formData.get('caption') as string | null;
      const photoType = (formData.get('photoType') as string) || 'general';
      const latitude = formData.get('latitude') ? parseFloat(formData.get('latitude') as string) : null;
      const longitude = formData.get('longitude') ? parseFloat(formData.get('longitude') as string) : null;

      if (!interventionId) {
        return NextResponse.json(
          { error: 'interventionId is required' },
          { status: 400 }
        );
      }

      // Verify intervention exists and belongs to user's organization
      const [intervention] = await db
        .select()
        .from(interventions)
        .where(eq(interventions.id, interventionId))
        .limit(1);

      if (!intervention) {
        return NextResponse.json(
          { error: 'Intervention not found' },
          { status: 404 }
        );
      }

      // Get all uploaded files
      const files = formData.getAll('photos') as File[];

      if (files.length === 0) {
        return NextResponse.json(
          { error: 'No photos provided' },
          { status: 400 }
        );
      }

      const uploadedPhotos = [];

      for (const file of files) {
        // Validate file type
        if (!ALLOWED_TYPES.includes(file.type)) {
          return NextResponse.json(
            { error: `Invalid file type: ${file.type}. Allowed types: ${ALLOWED_TYPES.join(', ')}` },
            { status: 400 }
          );
        }

        // Read file buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Compress image
        const compressedBuffer = await compressImage(buffer, file.type);

        // Generate unique filename
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8);
        const extension = file.name.split('.').pop() || 'jpg';
        const fileName = `${interventionId}-${timestamp}-${random}.${extension}`;
        const filePath = join(UPLOAD_DIR, fileName);

        // Save compressed file
        await writeFile(filePath, compressedBuffer);

        // Create database record
        const [photo] = await db
          .insert(interventionPhotos)
          .values({
            interventionId,
            url: `/uploads/interventions/${fileName}`,
            fileName: file.name,
            fileSize: compressedBuffer.length,
            mimeType: file.type,
            caption: caption || null,
            photoType,
            latitude: latitude ? latitude.toString() : null,
            longitude: longitude ? longitude.toString() : null,
            isSynced: true,
          })
          .returning();

        uploadedPhotos.push(photo);
      }

      logger.info({
        interventionId,
        photosCount: uploadedPhotos.length,
        totalSize: uploadedPhotos.reduce((sum, p) => sum + p.fileSize, 0)
      }, 'Photos uploaded successfully');

      return NextResponse.json({
        success: true,
        data: uploadedPhotos,
        meta: {
          count: uploadedPhotos.length,
        },
      });
    } catch (error) {
      logError(error, { context: 'POST /api/photos/upload' });

      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  });
}
