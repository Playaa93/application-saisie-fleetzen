'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { toast } from 'sonner';

interface PhotoUploadMultipleProps {
  label: string;
  helperText?: string;
  maxFiles?: number;
  maxSizeMB?: number;
  onChange: (files: File[]) => void;
  value?: File[];
  required?: boolean;
  error?: string;
}

export default function PhotoUploadMultiple({
  label,
  helperText,
  maxFiles = 5,
  maxSizeMB = 10,
  onChange,
  value = [],
  required = false,
  error
}: PhotoUploadMultipleProps) {
  const [previews, setPreviews] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>(value);

  // Synchroniser l'état interne avec la prop value
  useEffect(() => {
    // Seulement si le nombre de fichiers change ou si value devient vide
    if (value.length !== files.length) {
      setFiles(value);

      // Cleanup des anciennes previews
      previews.forEach(preview => URL.revokeObjectURL(preview));

      // Créer les nouvelles previews
      const newPreviews = value.map(file => URL.createObjectURL(file));
      setPreviews(newPreviews);
    }
  }, [value.length]); // Dépendance sur la longueur, pas le tableau entier

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);

    // Validation
    if (files.length + selectedFiles.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} photos`, {
        description: 'Vous avez atteint la limite',
        duration: 2000
      });
      return;
    }

    const validFiles: File[] = [];
    const newPreviews: string[] = [];

    selectedFiles.forEach(file => {
      // Check file size
      if (file.size > maxSizeMB * 1024 * 1024) {
        toast.error('Fichier trop volumineux', {
          description: `${file.name} dépasse ${maxSizeMB}MB`,
          duration: 2500
        });
        return;
      }

      validFiles.push(file);
      newPreviews.push(URL.createObjectURL(file));
    });

    const updatedFiles = [...files, ...validFiles];
    const updatedPreviews = [...previews, ...newPreviews];

    setFiles(updatedFiles);
    setPreviews(updatedPreviews);
    onChange(updatedFiles);
  };

  const removePhoto = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);

    setFiles(newFiles);
    setPreviews(newPreviews);
    onChange(newFiles);
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        {helperText && (
          <p className="text-xs text-gray-500 mb-2">{helperText}</p>
        )}

        <input
          type="file"
          accept="image/*"
          multiple
          capture="environment"
          onChange={handleFileChange}
          disabled={files.length >= maxFiles}
          className={`block w-full text-sm text-muted-foreground
            file:mr-4 file:py-2 file:px-4
            file:rounded-lg file:border-0
            file:text-sm file:font-semibold
            file:bg-primary/10 file:text-primary
            hover:file:bg-primary/20
            disabled:opacity-50 disabled:cursor-not-allowed
            ${error ? 'border border-red-500 rounded-lg' : ''}`}
        />

        <p className="text-xs text-gray-500 mt-1">
          {files.length}/{maxFiles} photos • Max {maxSizeMB}MB par fichier
        </p>
        {error && (
          <p className="text-xs text-red-500 mt-1">{error}</p>
        )}
      </div>

      {/* Previews */}
      {previews.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {previews.map((preview, index) => (
            <div key={index} className="relative group">
              <div className="relative h-32 rounded-lg overflow-hidden border border-gray-200">
                <Image
                  src={preview}
                  alt={`Photo ${index + 1}`}
                  fill
                  className="object-cover"
                />
              </div>

              {/* Remove button */}
              <button
                type="button"
                onClick={() => removePhoto(index)}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6
                  flex items-center justify-center text-xs opacity-0 group-hover:opacity-100
                  transition-opacity hover:bg-red-600"
              >
                ×
              </button>

              <p className="text-xs text-gray-600 mt-1 truncate">
                {files[index]?.name}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
