'use client';

import { useState, useRef } from 'react';
import { Camera, X, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface AvatarUploadProps {
  label?: string;
  onPhotoCapture: (file: File) => void;
  existingPhotoUrl?: string | null;
  required?: boolean;
}

/**
 * AvatarUpload Component
 *
 * Upload/capture component for agent profile pictures.
 * Adapted from PhotoCapture.tsx with 1:1 aspect ratio and preview.
 */
export function AvatarUpload({
  label = 'Photo de profil',
  onPhotoCapture,
  existingPhotoUrl,
  required = false,
}: AvatarUploadProps) {
  const [preview, setPreview] = useState<string | null>(existingPhotoUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Veuillez sélectionner une image');
        return;
      }

      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        alert('Taille maximale: 2MB');
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Pass file to parent
      onPhotoCapture(file);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-1">
        {label}
        {required && <span className="text-destructive">*</span>}
      </Label>

      <div className="flex items-center gap-4">
        {/* Avatar Preview */}
        <div className="relative">
          <div className="h-20 w-20 rounded-full overflow-hidden border-2 border-border bg-muted flex items-center justify-center">
            {preview ? (
              <img
                src={preview}
                alt="Avatar preview"
                className="h-full w-full object-cover"
              />
            ) : (
              <User className="h-10 w-10 text-muted-foreground" />
            )}
          </div>

          {preview && (
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute -top-1 -right-1 h-6 w-6 rounded-full"
              onClick={handleRemove}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* Upload Button */}
        <div className="flex flex-col gap-2">
          <input
            ref={fileInputRef}
            type="file"
            id="avatar-upload"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleFileChange}
            className="hidden"
          />
          <label htmlFor="avatar-upload">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <Camera className="h-4 w-4 mr-2" />
              {preview ? 'Changer la photo' : 'Ajouter une photo'}
            </Button>
          </label>
          <p className="text-xs text-muted-foreground">
            JPG, PNG ou WebP. Max 2MB.
          </p>
        </div>
      </div>
    </div>
  );
}
