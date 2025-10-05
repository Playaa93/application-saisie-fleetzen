'use client';

import { useState } from 'react';
import Image from 'next/image';
import { toast } from 'sonner';
import Compressor from 'compressorjs';

interface PhotoUploadProps {
  onChange: (files: File[]) => void;
  maxPhotos?: number;
}

export default function PhotoUpload({ onChange, maxPhotos = 2 }: PhotoUploadProps) {
  const [previews, setPreviews] = useState<string[]>([]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    if (files.length > maxPhotos) {
      toast.error(`Maximum ${maxPhotos} photos`, {
        description: 'Vous avez atteint la limite',
        duration: 2000
      });
      return;
    }

    toast.loading('Compression des photos...', { id: 'compress' });

    try {
      const compressedFiles: File[] = [];
      const newPreviews: string[] = [];

      for (const file of files) {
        // Compression avec Compressor.js (EXIF + orientation préservés)
        await new Promise<void>((resolve, reject) => {
          new Compressor(file, {
            quality: 0.85, // Qualité 85% (bon compromis)
            maxWidth: 1920, // Max 1920px (Full HD)
            maxHeight: 1920,
            convertTypes: ['image/png', 'image/webp'], // Convertir PNG/WebP -> JPEG
            convertSize: 1000000, // Convertir si > 1MB
            mimeType: 'image/jpeg', // Force JPEG (meilleure compression)

            // ✅ CRITIQUE pour anti-magouille
            checkOrientation: true, // Corriger orientation EXIF automatiquement

            success: (compressedFile) => {
              // Renommer pour garder nom original
              const renamedFile = new File(
                [compressedFile],
                file.name.replace(/\.[^/.]+$/, '.jpg'),
                { type: 'image/jpeg', lastModified: file.lastModified }
              );

              compressedFiles.push(renamedFile);
              newPreviews.push(URL.createObjectURL(renamedFile));
              resolve();
            },
            error: (err) => {
              console.error('Compression error:', err);
              reject(err);
            }
          });
        });
      }

      setPreviews(newPreviews);
      onChange(compressedFiles);

      toast.success('Photos compressées', {
        id: 'compress',
        description: `${compressedFiles.length} photo(s) prête(s)`,
        duration: 1500
      });
    } catch (error) {
      console.error('Compression error:', error);
      toast.error('Erreur de compression', {
        id: 'compress',
        description: 'Impossible de compresser les photos',
        duration: 2500
      });
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">
          Photos (max {maxPhotos})
        </label>
        <input
          type="file"
          accept="image/*"
          multiple
          capture="environment"
          onChange={handleFileChange}
          className="block w-full text-sm text-muted-foreground
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-primary/10 file:text-primary
            hover:file:bg-primary/20"
        />
      </div>

      {/* Previews des photos */}
      {previews.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          {previews.map((preview, index) => (
            <div key={index} className="relative h-48 rounded-lg overflow-hidden border">
              <Image
                src={preview}
                alt={`Photo ${index + 1}`}
                fill
                className="object-cover"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
