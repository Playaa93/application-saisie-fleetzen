'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Calendar, User, Truck, FileText, MapPin, Image as ImageIcon } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';

export type InterventionDetail = {
  id: string;
  status: string;
  created_at: string;
  completed_at?: string | null;
  notes?: string | null;
  metadata?: {
    site?: string;
    photos?: {
      photosAvant?: Array<{ url: string }>;
      photosApres?: Array<{ url: string }>;
      photoManometre?: Array<{ url: string }>;
      photosJaugesAvant?: Array<{ url: string }>;
      photosJaugesApres?: Array<{ url: string }>;
      photoTicket?: Array<{ url: string }>;
    };
    [key: string]: any;
  };
  location_accuracy?: number | null;
  intervention_type: { name: string } | null;
  client: { name: string } | null;
  vehicle: { license_plate: string; make?: string; model?: string } | null;
  agent: { first_name: string; last_name: string; email?: string } | null;
};

interface InterventionDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  intervention: InterventionDetail | null;
}

export function InterventionDetailModal({ open, onOpenChange, intervention }: InterventionDetailModalProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [lightboxSlides, setLightboxSlides] = useState<Array<{ src: string; alt: string }>>([]);

  if (!intervention) return null;

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      completed: { label: 'Terminée', class: 'bg-green-100 text-green-800' },
      in_progress: { label: 'En cours', class: 'bg-blue-100 text-blue-800' },
      pending: { label: 'En attente', class: 'bg-gray-100 text-gray-800' },
      cancelled: { label: 'Annulée', class: 'bg-red-100 text-red-800' },
    };
    const config = statusConfig[status as keyof typeof statusConfig] || {
      label: status,
      class: 'bg-gray-100 text-gray-800',
    };

    return (
      <Badge variant="outline" className={config.class}>
        {config.label}
      </Badge>
    );
  };

  const formatDateTime = (date: string) => {
    return format(new Date(date), 'dd/MM/yyyy à HH:mm', { locale: fr });
  };

  const openLightbox = (photos: Array<{ url: string }>, initialIndex: number, label: string) => {
    const slides = photos.map((photo, idx) => ({
      src: photo.url,
      alt: `${label} ${idx + 1}`,
    }));
    setLightboxSlides(slides);
    setLightboxIndex(initialIndex);
    setLightboxOpen(true);
  };

  const photos = intervention.metadata?.photos;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-start justify-between">
              <DialogTitle className="text-xl">
                {intervention.intervention_type?.name || 'Intervention'} #{intervention.id.slice(0, 8)}
              </DialogTitle>
              {getStatusBadge(intervention.status)}
            </div>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            {/* Informations générales */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>Date</span>
                </div>
                <p className="font-medium">
                  {formatDateTime(intervention.completed_at || intervention.created_at)}
                </p>
              </div>

              {intervention.agent && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="w-4 h-4" />
                    <span>Agent</span>
                  </div>
                  <p className="font-medium">
                    {intervention.agent.first_name} {intervention.agent.last_name}
                  </p>
                  {intervention.agent.email && (
                    <p className="text-sm text-muted-foreground">{intervention.agent.email}</p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="w-4 h-4" />
                  <span>Client</span>
                </div>
                <p className="font-medium">{intervention.client?.name || 'Inconnu'}</p>
                {intervention.site && (
                  <p className="text-sm text-muted-foreground">{intervention.site.name}</p>
                )}
              </div>

              {intervention.vehicle && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Truck className="w-4 h-4" />
                    <span>Véhicule</span>
                  </div>
                  <p className="font-medium">{intervention.vehicle.license_plate}</p>
                  {(intervention.vehicle.make || intervention.vehicle.model) && (
                    <p className="text-sm text-muted-foreground">
                      {intervention.vehicle.make} {intervention.vehicle.model}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Notes */}
            {intervention.notes && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="w-4 h-4" />
                  <span>Notes</span>
                </div>
                <p className="text-sm whitespace-pre-wrap p-3 bg-muted rounded-md">
                  {intervention.notes}
                </p>
              </div>
            )}

            {/* Photos AVANT */}
            {photos?.photosAvant && photos.photosAvant.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <ImageIcon className="w-4 h-4" />
                  <span>Photos AVANT ({photos.photosAvant.length})</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {photos.photosAvant.map((photo, index) => (
                    <div
                      key={index}
                      className="relative aspect-square rounded-lg overflow-hidden border border-border cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => openLightbox(photos.photosAvant!, index, 'Photo AVANT')}
                    >
                      <img
                        src={photo.url}
                        alt={`Photo avant ${index + 1}`}
                        className="object-cover w-full h-full"
                      />
                      <div className="absolute bottom-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                        AVANT
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Photos APRÈS */}
            {photos?.photosApres && photos.photosApres.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <ImageIcon className="w-4 h-4" />
                  <span>Photos APRÈS ({photos.photosApres.length})</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {photos.photosApres.map((photo, index) => (
                    <div
                      key={index}
                      className="relative aspect-square rounded-lg overflow-hidden border border-border cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => openLightbox(photos.photosApres!, index, 'Photo APRÈS')}
                    >
                      <img
                        src={photo.url}
                        alt={`Photo après ${index + 1}`}
                        className="object-cover w-full h-full"
                      />
                      <div className="absolute bottom-2 left-2 bg-green-600 text-white text-xs px-2 py-1 rounded">
                        APRÈS
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Photo Manomètre */}
            {photos?.photoManometre && photos.photoManometre.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <ImageIcon className="w-4 h-4" />
                  <span>Photo Manomètre ({photos.photoManometre.length})</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {photos.photoManometre.map((photo, index) => (
                    <div
                      key={index}
                      className="relative aspect-square rounded-lg overflow-hidden border border-border cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => openLightbox(photos.photoManometre!, index, 'Manomètre')}
                    >
                      <img
                        src={photo.url}
                        alt={`Manomètre ${index + 1}`}
                        className="object-cover w-full h-full"
                      />
                      <div className="absolute bottom-2 left-2 bg-orange-600 text-white text-xs px-2 py-1 rounded">
                        MANOMÈTRE
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Photos Jauges AVANT */}
            {photos?.photosJaugesAvant && photos.photosJaugesAvant.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <ImageIcon className="w-4 h-4" />
                  <span>Photos Jauges AVANT ({photos.photosJaugesAvant.length})</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {photos.photosJaugesAvant.map((photo, index) => (
                    <div
                      key={index}
                      className="relative aspect-square rounded-lg overflow-hidden border border-border cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => openLightbox(photos.photosJaugesAvant!, index, 'Jauge AVANT')}
                    >
                      <img
                        src={photo.url}
                        alt={`Jauge avant ${index + 1}`}
                        className="object-cover w-full h-full"
                      />
                      <div className="absolute bottom-2 left-2 bg-purple-600 text-white text-xs px-2 py-1 rounded">
                        JAUGE AVANT
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Photos Jauges APRÈS */}
            {photos?.photosJaugesApres && photos.photosJaugesApres.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <ImageIcon className="w-4 h-4" />
                  <span>Photos Jauges APRÈS ({photos.photosJaugesApres.length})</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {photos.photosJaugesApres.map((photo, index) => (
                    <div
                      key={index}
                      className="relative aspect-square rounded-lg overflow-hidden border border-border cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => openLightbox(photos.photosJaugesApres!, index, 'Jauge APRÈS')}
                    >
                      <img
                        src={photo.url}
                        alt={`Jauge après ${index + 1}`}
                        className="object-cover w-full h-full"
                      />
                      <div className="absolute bottom-2 left-2 bg-pink-600 text-white text-xs px-2 py-1 rounded">
                        JAUGE APRÈS
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Photo Ticket */}
            {photos?.photoTicket && photos.photoTicket.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <ImageIcon className="w-4 h-4" />
                  <span>Photo Ticket ({photos.photoTicket.length})</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {photos.photoTicket.map((photo, index) => (
                    <div
                      key={index}
                      className="relative aspect-square rounded-lg overflow-hidden border border-border cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => openLightbox(photos.photoTicket!, index, 'Ticket')}
                    >
                      <img
                        src={photo.url}
                        alt={`Ticket ${index + 1}`}
                        className="object-cover w-full h-full"
                      />
                      <div className="absolute bottom-2 left-2 bg-yellow-600 text-white text-xs px-2 py-1 rounded">
                        TICKET
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Métadonnées supplémentaires */}
            {intervention.metadata && Object.keys(intervention.metadata).length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="w-4 h-4" />
                  <span>Détails supplémentaires</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {Object.entries(intervention.metadata)
                    .filter(([key]) => !key.includes('photo') && !key.includes('Photo'))
                    .map(([key, value]) => (
                      <div key={key} className="flex justify-between p-2 bg-muted rounded">
                        <span className="text-muted-foreground capitalize">
                          {key.replace(/_/g, ' ')}:
                        </span>
                        <span className="font-medium">{String(value)}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Lightbox */}
      <Lightbox
        open={lightboxOpen}
        close={() => setLightboxOpen(false)}
        slides={lightboxSlides}
        index={lightboxIndex}
      />
    </>
  );
}
