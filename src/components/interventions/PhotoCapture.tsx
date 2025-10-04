"use client"

import { useState, useRef } from "react"
import { Camera, X, Image as ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { triggerHaptic, HapticPattern } from "@/utils/haptics"

interface PhotoCaptureProps {
  type: "before" | "after" | "during"
  label: string
  onPhotoCapture: (file: File, type: string) => void
  existingPhoto?: string
  required?: boolean
}

export function PhotoCapture({
  type,
  label,
  onPhotoCapture,
  existingPhoto,
  required = false
}: PhotoCaptureProps) {
  const [preview, setPreview] = useState<string | null>(existingPhoto || null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(file)

      // Haptic feedback on successful capture
      triggerHaptic(HapticPattern.MEDIUM)

      // Pass file to parent
      onPhotoCapture(file, type)
    }
  }

  const handleRemove = () => {
    setPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={`photo-${type}`} className="flex items-center gap-1">
        {label}
        {required && <span className="text-destructive">*</span>}
      </Label>

      <div className="relative">
        {preview ? (
          <div className="relative rounded-lg overflow-hidden border-2 border-border">
            <img
              src={preview}
              alt={`Photo ${type}`}
              className="w-full h-48 object-cover"
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 h-8 w-8"
              onClick={handleRemove}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <label
            htmlFor={`photo-${type}`}
            className={cn(
              "flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer transition-colors",
              "hover:bg-accent/50 active:bg-accent/70 touch-manipulation",
              "border-border bg-background"
            )}
          >
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <Camera className="w-10 h-10 mb-3 text-muted-foreground" />
              <p className="mb-2 text-sm text-muted-foreground font-medium">
                Appuyer pour prendre une photo
              </p>
              <p className="text-xs text-muted-foreground">
                ou sélectionner depuis la galerie
              </p>
            </div>
          </label>
        )}

        <input
          ref={fileInputRef}
          id={`photo-${type}`}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFileChange}
          required={required && !preview}
        />
      </div>
    </div>
  )
}

interface PhotoGridProps {
  photos: Array<{
    id: string
    url: string
    type: "before" | "after" | "during"
  }>
  onRemove?: (id: string) => void
}

export function PhotoGrid({ photos, onRemove }: PhotoGridProps) {
  if (photos.length === 0) return null

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {photos.map((photo) => (
        <div key={photo.id} className="relative group">
          <img
            src={photo.url}
            alt={`Photo ${photo.type}`}
            className="w-full h-32 object-cover rounded-lg border border-border"
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent rounded-b-lg p-2">
            <p className="text-xs text-white font-medium capitalize">
              {photo.type === "before" ? "Avant" : photo.type === "after" ? "Après" : "Pendant"}
            </p>
          </div>
          {onRemove && (
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-1 right-1 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => onRemove(photo.id)}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      ))}
    </div>
  )
}
