'use client';

import { useState } from 'react';
import Image from 'next/image';

interface PhotoUploadMultipleProps {
  label: string;
  helperText?: string;
  maxFiles?: number;
  maxSizeMB?: number;
  onChange: (files: File[]) => void;
  value?: File[];
}

export default function PhotoUploadMultiple({
  label,
  helperText,
  maxFiles = 5,
  maxSizeMB = 10,
  onChange,
  value = []
}: PhotoUploadMultipleProps) {
  const [previews, setPreviews] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>(value);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);

    // Validation
    if (files.length + selectedFiles.length > maxFiles) {
      alert(`Maximum ${maxFiles} photos autorisées`);
      return;
    }

    const validFiles: File[] = [];
    const newPreviews: string[] = [];

    selectedFiles.forEach(file => {
      // Check file size
      if (file.size > maxSizeMB * 1024 * 1024) {
        alert(`${file.name} dépasse ${maxSizeMB}MB`);
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
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-lg file:border-0
            file:text-sm file:font-semibold
            file:bg-fleetzen-teal/10 file:text-fleetzen-teal-dark
            hover:file:bg-fleetzen-teal/20
            disabled:opacity-50 disabled:cursor-not-allowed"
        />

        <p className="text-xs text-gray-500 mt-1">
          {files.length}/{maxFiles} photos • Max {maxSizeMB}MB par fichier
        </p>
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
