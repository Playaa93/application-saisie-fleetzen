'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ImageIcon, Calendar, User, Car } from 'lucide-react';

export type PhotoWithIntervention = {
  id: string;
  type: 'before' | 'after';
  url: string;
  filename: string;
  created_at: string;
  intervention: {
    id: string;
    intervention_type: { name: string } | null;
    client: { name: string } | null;
    vehicle: { license_plate: string } | null;
    agent: { first_name: string; last_name: string } | null;
  };
};

interface PhotosGalleryProps {
  photos: PhotoWithIntervention[];
}

export function PhotosGallery({ photos }: PhotosGalleryProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoWithIntervention | null>(null);

  // Group photos by intervention
  const photosByIntervention = photos.reduce((acc, photo) => {
    const key = photo.intervention.id;
    if (!acc[key]) {
      acc[key] = {
        intervention: photo.intervention,
        before: [] as PhotoWithIntervention[],
        after: [] as PhotoWithIntervention[],
      };
    }
    if (photo.type === 'before') {
      acc[key].before.push(photo);
    } else {
      acc[key].after.push(photo);
    }
    return acc;
  }, {} as Record<string, { intervention: any; before: PhotoWithIntervention[]; after: PhotoWithIntervention[] }>);

  if (photos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold">Aucune photo</h3>
        <p className="text-sm text-muted-foreground">
          Les photos d'interventions apparaîtront ici
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {Object.entries(photosByIntervention).map(([interventionId, { intervention, before, after }]) => (
          <Card key={interventionId} className="p-6">
            {/* Intervention Info */}
            <div className="mb-4 space-y-2">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-lg">
                  {intervention.intervention_type?.name || 'Intervention'}
                </h3>
                <Badge variant="outline">{intervention.client?.name}</Badge>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Car className="h-4 w-4" />
                  {intervention.vehicle?.license_plate}
                </div>
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  {intervention.agent?.first_name} {intervention.agent?.last_name}
                </div>
              </div>
            </div>

            {/* Photos Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Before Photos */}
              <div>
                <h4 className="font-medium mb-3 text-sm uppercase text-muted-foreground">
                  Avant ({before.length})
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {before.map((photo) => (
                    <div
                      key={photo.id}
                      className="relative aspect-square rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity border"
                      onClick={() => setSelectedPhoto(photo)}
                    >
                      <Image
                        src={photo.url}
                        alt={`Avant - ${photo.filename}`}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* After Photos */}
              <div>
                <h4 className="font-medium mb-3 text-sm uppercase text-muted-foreground">
                  Après ({after.length})
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {after.map((photo) => (
                    <div
                      key={photo.id}
                      className="relative aspect-square rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity border"
                      onClick={() => setSelectedPhoto(photo)}
                    >
                      <Image
                        src={photo.url}
                        alt={`Après - ${photo.filename}`}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Photo Viewer Dialog */}
      <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {selectedPhoto?.type === 'before' ? 'Avant' : 'Après'} - {selectedPhoto?.filename}
            </DialogTitle>
          </DialogHeader>
          {selectedPhoto && (
            <div className="space-y-4">
              <div className="relative aspect-video w-full rounded-lg overflow-hidden">
                <Image
                  src={selectedPhoto.url}
                  alt={selectedPhoto.filename}
                  fill
                  className="object-contain"
                />
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                {new Date(selectedPhoto.created_at).toLocaleDateString('fr-FR', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
