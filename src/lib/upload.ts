/**
 * File upload utilities
 * Handle photo uploads for interventions
 */

import { writeFile, mkdir, unlink } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

const UPLOAD_DIR = process.env.UPLOAD_DIR || './public/uploads/interventions';
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '10485760'); // 10MB default
const ALLOWED_TYPES = (process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/png,image/webp,image/heic').split(',');

// ============================================================================
// VALIDATION
// ============================================================================

export interface FileValidationError {
  field: string;
  message: string;
}

/**
 * Validate an uploaded file
 */
export function validateFile(file: File): FileValidationError | null {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      field: 'file',
      message: `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`
    };
  }

  // Check file type
  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      field: 'file',
      message: `File type ${file.type} not allowed. Allowed types: ${ALLOWED_TYPES.join(', ')}`
    };
  }

  return null;
}

// ============================================================================
// FILE OPERATIONS
// ============================================================================

/**
 * Ensure upload directory exists
 */
async function ensureUploadDir(dir: string): Promise<void> {
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true });
  }
}

/**
 * Generate unique filename
 */
function generateFilename(originalName: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  const ext = path.extname(originalName);
  const nameWithoutExt = path.basename(originalName, ext);
  const sanitized = nameWithoutExt.replace(/[^a-zA-Z0-9]/g, '-');
  return `${timestamp}-${random}-${sanitized}${ext}`;
}

/**
 * Save uploaded file to disk
 */
export async function saveFile(
  file: File,
  subdir: string = ''
): Promise<{ filename: string; filepath: string; url: string; size: number }> {
  // Validate file
  const validationError = validateFile(file);
  if (validationError) {
    throw new Error(validationError.message);
  }

  // Prepare directory
  const uploadPath = subdir ? path.join(UPLOAD_DIR, subdir) : UPLOAD_DIR;
  await ensureUploadDir(uploadPath);

  // Generate filename
  const filename = generateFilename(file.name);
  const filepath = path.join(uploadPath, filename);

  // Convert File to Buffer
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Write file
  await writeFile(filepath, buffer);

  // Generate public URL (relative to public folder)
  const relativePath = filepath.replace(/^\.\/public/, '');
  const url = relativePath.replace(/\\/g, '/'); // Windows compatibility

  return {
    filename,
    filepath: relativePath,
    url,
    size: file.size,
  };
}

/**
 * Save multiple files
 */
export async function saveMultipleFiles(
  files: File[],
  subdir: string = ''
): Promise<Array<{ filename: string; filepath: string; url: string; size: number }>> {
  const results = [];
  for (const file of files) {
    const result = await saveFile(file, subdir);
    results.push(result);
  }
  return results;
}

/**
 * Delete a file from disk
 */
export async function deleteFile(filepath: string): Promise<void> {
  try {
    // Ensure path is within uploads directory (security)
    const normalizedPath = path.normalize(filepath);
    if (!normalizedPath.includes('uploads')) {
      throw new Error('Invalid file path');
    }

    const fullPath = path.join('./public', filepath);
    if (existsSync(fullPath)) {
      await unlink(fullPath);
    }
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
}

/**
 * Delete multiple files
 */
export async function deleteMultipleFiles(filepaths: string[]): Promise<void> {
  for (const filepath of filepaths) {
    await deleteFile(filepath);
  }
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Get file extension
 */
export function getFileExtension(filename: string): string {
  return path.extname(filename).toLowerCase();
}

/**
 * Check if file is an image
 */
export function isImage(mimeType: string): boolean {
  return mimeType.startsWith('image/');
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}
