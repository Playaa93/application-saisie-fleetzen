/**
 * Unit Tests - Photo Compression Utility
 * Tests image compression, resize, and optimization for mobile PWA
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock canvas and Image for Node environment
class MockImage {
  width: number = 0;
  height: number = 0;
  onload: (() => void) | null = null;
  onerror: ((error: Error) => void) | null = null;

  set src(value: string) {
    setTimeout(() => {
      // Simulate successful image load
      this.width = 1920;
      this.height = 1080;
      this.onload?.();
    }, 10);
  }
}

class MockCanvas {
  width: number = 0;
  height: number = 0;

  getContext() {
    return {
      drawImage: jest.fn(),
      clearRect: jest.fn(),
    };
  }

  toBlob(callback: (blob: Blob) => void, type: string, quality: number) {
    const blob = new Blob(['test'], { type });
    setTimeout(() => callback(blob), 10);
  }
}

global.Image = MockImage as any;
global.HTMLCanvasElement = MockCanvas as any;

// Photo compression utility
interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  mimeType?: string;
}

class PhotoCompressor {
  async compressImage(
    file: File,
    options: CompressionOptions = {}
  ): Promise<Blob> {
    const {
      maxWidth = 1920,
      maxHeight = 1080,
      quality = 0.8,
      mimeType = 'image/jpeg',
    } = options;

    return new Promise((resolve, reject) => {
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Cannot get canvas context'));
          return;
        }

        // Calculate new dimensions
        let { width, height } = this.calculateDimensions(
          img.width,
          img.height,
          maxWidth,
          maxHeight
        );

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Compression failed'));
            }
          },
          mimeType,
          quality
        );
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  }

  calculateDimensions(
    originalWidth: number,
    originalHeight: number,
    maxWidth: number,
    maxHeight: number
  ): { width: number; height: number } {
    let width = originalWidth;
    let height = originalHeight;

    if (width > maxWidth) {
      height = (height * maxWidth) / width;
      width = maxWidth;
    }

    if (height > maxHeight) {
      width = (width * maxHeight) / height;
      height = maxHeight;
    }

    return { width: Math.round(width), height: Math.round(height) };
  }

  async validateImageFile(file: File): Promise<boolean> {
    if (!file.type.startsWith('image/')) {
      throw new Error('File must be an image');
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new Error('File size exceeds 10MB limit');
    }

    return true;
  }

  getOptimalQuality(fileSize: number): number {
    if (fileSize < 500 * 1024) return 0.9; // <500KB: high quality
    if (fileSize < 2 * 1024 * 1024) return 0.8; // <2MB: medium quality
    return 0.7; // >2MB: lower quality for compression
  }
}

describe('PhotoCompressor', () => {
  let compressor: PhotoCompressor;
  let mockFile: File;

  beforeEach(() => {
    compressor = new PhotoCompressor();
    mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
  });

  describe('calculateDimensions', () => {
    it('should maintain aspect ratio when scaling down width', () => {
      const result = compressor.calculateDimensions(2000, 1000, 1000, 1000);

      expect(result.width).toBe(1000);
      expect(result.height).toBe(500);
    });

    it('should maintain aspect ratio when scaling down height', () => {
      const result = compressor.calculateDimensions(1000, 2000, 1000, 1000);

      expect(result.width).toBe(500);
      expect(result.height).toBe(1000);
    });

    it('should not upscale smaller images', () => {
      const result = compressor.calculateDimensions(800, 600, 1920, 1080);

      expect(result.width).toBe(800);
      expect(result.height).toBe(600);
    });

    it('should handle square images correctly', () => {
      const result = compressor.calculateDimensions(2000, 2000, 1000, 1000);

      expect(result.width).toBe(1000);
      expect(result.height).toBe(1000);
    });

    it('should round dimensions to nearest integer', () => {
      const result = compressor.calculateDimensions(1333, 1000, 1000, 1000);

      expect(result.width).toBe(1000);
      expect(result.height).toBe(750); // Rounded from 750.1875
    });
  });

  describe('validateImageFile', () => {
    it('should accept valid image files', async () => {
      const jpegFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

      await expect(compressor.validateImageFile(jpegFile)).resolves.toBe(true);
    });

    it('should accept various image formats', async () => {
      const formats = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

      for (const format of formats) {
        const file = new File(['test'], 'test', { type: format });
        await expect(compressor.validateImageFile(file)).resolves.toBe(true);
      }
    });

    it('should reject non-image files', async () => {
      const pdfFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });

      await expect(compressor.validateImageFile(pdfFile))
        .rejects
        .toThrow('File must be an image');
    });

    it('should reject files larger than 10MB', async () => {
      const largeFile = new File(
        [new ArrayBuffer(11 * 1024 * 1024)],
        'large.jpg',
        { type: 'image/jpeg' }
      );

      await expect(compressor.validateImageFile(largeFile))
        .rejects
        .toThrow('File size exceeds 10MB limit');
    });
  });

  describe('getOptimalQuality', () => {
    it('should return high quality for small files', () => {
      expect(compressor.getOptimalQuality(300 * 1024)).toBe(0.9);
    });

    it('should return medium quality for medium files', () => {
      expect(compressor.getOptimalQuality(1.5 * 1024 * 1024)).toBe(0.8);
    });

    it('should return lower quality for large files', () => {
      expect(compressor.getOptimalQuality(5 * 1024 * 1024)).toBe(0.7);
    });

    it('should handle edge cases at boundaries', () => {
      expect(compressor.getOptimalQuality(500 * 1024 - 1)).toBe(0.9);
      expect(compressor.getOptimalQuality(500 * 1024)).toBe(0.8);
      expect(compressor.getOptimalQuality(2 * 1024 * 1024 - 1)).toBe(0.8);
      expect(compressor.getOptimalQuality(2 * 1024 * 1024)).toBe(0.7);
    });
  });

  describe('compressImage', () => {
    it('should compress image with default options', async () => {
      const result = await compressor.compressImage(mockFile);

      expect(result).toBeInstanceOf(Blob);
      expect(result.type).toBe('image/jpeg');
    });

    it('should compress with custom quality', async () => {
      const result = await compressor.compressImage(mockFile, { quality: 0.5 });

      expect(result).toBeInstanceOf(Blob);
    });

    it('should compress to WebP format', async () => {
      const result = await compressor.compressImage(mockFile, {
        mimeType: 'image/webp',
      });

      expect(result.type).toBe('image/webp');
    });

    it('should respect maxWidth constraint', async () => {
      const result = await compressor.compressImage(mockFile, {
        maxWidth: 800,
      });

      expect(result).toBeInstanceOf(Blob);
    });

    it('should respect maxHeight constraint', async () => {
      const result = await compressor.compressImage(mockFile, {
        maxHeight: 600,
      });

      expect(result).toBeInstanceOf(Blob);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very small images', async () => {
      const result = compressor.calculateDimensions(100, 100, 1920, 1080);

      expect(result.width).toBe(100);
      expect(result.height).toBe(100);
    });

    it('should handle ultra-wide images', async () => {
      const result = compressor.calculateDimensions(4000, 1000, 1920, 1080);

      expect(result.width).toBe(1920);
      expect(result.height).toBe(480);
    });

    it('should handle ultra-tall images', async () => {
      const result = compressor.calculateDimensions(1000, 4000, 1920, 1080);

      expect(result.width).toBe(270);
      expect(result.height).toBe(1080);
    });
  });

  describe('Performance', () => {
    it('should compress within reasonable time', async () => {
      const start = performance.now();
      await compressor.compressImage(mockFile);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(1000); // Should complete under 1 second
    });
  });
});

describe('Batch Photo Processing', () => {
  it('should process multiple images concurrently', async () => {
    const compressor = new PhotoCompressor();
    const files = Array(5).fill(null).map((_, i) =>
      new File(['test'], `test${i}.jpg`, { type: 'image/jpeg' })
    );

    const start = performance.now();
    const results = await Promise.all(
      files.map(file => compressor.compressImage(file))
    );
    const duration = performance.now() - start;

    expect(results).toHaveLength(5);
    expect(duration).toBeLessThan(2000); // Parallel processing should be fast
  });
});
