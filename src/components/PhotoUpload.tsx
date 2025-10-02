'use client';

import { useState } from 'react';
import Image from 'next/image';

interface PhotoUploadProps {
  onChange: (files: File[]) => void;
  maxPhotos?: number;
}

export default function PhotoUpload({ onChange, maxPhotos = 2 }: PhotoUploadProps) {
  const [previews, setPreviews] = useState<string[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    if (files.length > maxPhotos) {
      alert(`Maximum ${maxPhotos} photos autorisées`);
      return;
    }

    // Créer les previews
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setPreviews(newPreviews);

    // Envoyer les fichiers au parent
    onChange(files);
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
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100"
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
