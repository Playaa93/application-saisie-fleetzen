'use client';

import { useState } from 'react';
import Image from 'next/image';
import { toast } from 'sonner';
import imageCompression from 'browser-image-compression';

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

    // Options de compression optimisées pour PWA mobile
    const compressionOptions = {
      maxSizeMB: 1, // Cible 1MB max après compression
      maxWidthOrHeight: 1920, // Max 1920px (Full HD)
      useWebWorker: true, // Utiliser Web Worker pour ne pas bloquer UI
      fileType: 'image/jpeg', // Force JPEG (meilleure compression que PNG)
      initialQuality: 0.85, // Qualité initiale 85% (bon compromis)
    };

    toast.loading('Compression des photos...', { id: 'compress' });

    try {
      const compressedFiles: File[] = [];
      const newPreviews: string[] = [];

      for (const file of files) {
        // Compression de l'image
        const compressedFile = await imageCompression(file, compressionOptions);

        // Renommer le fichier compressé pour garder le nom original
        const renamedFile = new File(
          [compressedFile],
          file.name.replace(/\.[^/.]+$/, '.jpg'), // Force extension .jpg
          { type: 'image/jpeg' }
        );

        compressedFiles.push(renamedFile);
        newPreviews.push(URL.createObjectURL(renamedFile));
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
