'use client';

import { useState } from 'react';
import { InterventionFormData } from '@/types/intervention';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Camera, Check, X, AlertTriangle } from 'lucide-react';

interface Step3PhotosPriseEnChargeProps {
  formData: Partial<InterventionFormData>;
  onNext: (data: Partial<InterventionFormData>) => void;
  onPrevious: () => void;
}

interface PhotoPosition {
  id: string;
  label: string;
  description: string;
  required: boolean;
}

interface PhotoWithAnomaly {
  position: string;
  mainPhoto: File | null;
  hasAnomaly: boolean;
  anomalyPhoto: File | null;
  anomalyDescription: string;
}

const PHOTO_POSITIONS: PhotoPosition[] = [
  { id: 'capot', label: '1. Capot', description: 'Vue face avant complète', required: true },
  { id: 'aile_av_gauche', label: '2. Aile avant gauche', description: 'Côté conducteur avant', required: true },
  { id: 'porte_av_gauche', label: '3. Porte avant gauche', description: 'Porte conducteur', required: true },
  { id: 'porte_ar_gauche', label: '4. Porte arrière gauche', description: 'Porte arrière côté conducteur', required: true },
  { id: 'aile_ar_gauche', label: '5. Aile arrière gauche', description: 'Arrière côté conducteur', required: true },
  { id: 'coffre', label: '6. Coffre', description: 'Vue face arrière complète', required: true },
  { id: 'aile_ar_droite', label: '7. Aile arrière droite', description: 'Arrière côté passager', required: true },
  { id: 'porte_ar_droite', label: '8. Porte arrière droite', description: 'Porte arrière côté passager', required: true },
  { id: 'porte_av_droite', label: '9. Porte avant droite', description: 'Porte passager avant', required: true },
  { id: 'aile_av_droite', label: '10. Aile avant droite', description: 'Côté passager avant', required: true },
  { id: 'toit', label: '11. Toit', description: 'Vue panoramique du toit', required: true },
  { id: 'tableau_bord', label: '12. Tableau de bord', description: 'Compteur kilométrique visible', required: true },
];

export default function Step3PhotosPriseEnCharge({ formData, onNext, onPrevious }: Step3PhotosPriseEnChargeProps) {
  const [photosData, setPhotosData] = useState<Record<string, PhotoWithAnomaly>>(() => {
    const initial: Record<string, PhotoWithAnomaly> = {};
    PHOTO_POSITIONS.forEach(pos => {
      initial[pos.id] = {
        position: pos.id,
        mainPhoto: null,
        hasAnomaly: false,
        anomalyPhoto: null,
        anomalyDescription: '',
      };
    });
    return initial;
  });

  const handleMainPhotoChange = (positionId: string, file: File) => {
    setPhotosData(prev => ({
      ...prev,
      [positionId]: { ...prev[positionId], mainPhoto: file },
    }));
  };

  const handleRemoveMainPhoto = (positionId: string) => {
    setPhotosData(prev => ({
      ...prev,
      [positionId]: { ...prev[positionId], mainPhoto: null },
    }));
  };

  const handleAnomalyToggle = (positionId: string, checked: boolean) => {
    setPhotosData(prev => ({
      ...prev,
      [positionId]: {
        ...prev[positionId],
        hasAnomaly: checked,
        anomalyPhoto: checked ? prev[positionId].anomalyPhoto : null,
        anomalyDescription: checked ? prev[positionId].anomalyDescription : '',
      },
    }));
  };

  const handleAnomalyPhotoChange = (positionId: string, file: File) => {
    setPhotosData(prev => ({
      ...prev,
      [positionId]: { ...prev[positionId], anomalyPhoto: file },
    }));
  };

  const handleAnomalyDescriptionChange = (positionId: string, description: string) => {
    setPhotosData(prev => ({
      ...prev,
      [positionId]: { ...prev[positionId], anomalyDescription: description },
    }));
  };

  const handleFileInputChange = (positionId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleMainPhotoChange(positionId, file);
    }
  };

  const handleAnomalyFileInputChange = (positionId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleAnomalyPhotoChange(positionId, file);
    }
  };

  const getPhotoCount = () => {
    return Object.values(photosData).filter(data => data.mainPhoto !== null).length;
  };

  const isComplete = () => {
    // PRODUCTION: Toutes les 12 photos sont obligatoires
    return PHOTO_POSITIONS.every(pos => photosData[pos.id].mainPhoto !== null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isComplete()) {
      alert('⚠️ Veuillez prendre les 12 photos obligatoires du véhicule pour continuer');
      return;
    }

    // Extract main photos with their positions
    const photosByPosition: Record<string, File> = {};
    PHOTO_POSITIONS.forEach(pos => {
      if (photosData[pos.id].mainPhoto) {
        photosByPosition[pos.id] = photosData[pos.id].mainPhoto!;
      }
    });

    // Extract anomaly photos
    const anomalyPhotos = Object.values(photosData)
      .filter(data => data.hasAnomaly && data.anomalyPhoto)
      .map(data => data.anomalyPhoto)
      .filter((p): p is File => p !== null);

    // Extract anomaly metadata (for later API processing)
    const anomalies = Object.values(photosData)
      .filter(data => data.hasAnomaly)
      .map(data => ({
        position: data.position,
        description: data.anomalyDescription,
        hasPhoto: data.anomalyPhoto !== null,
      }));

    onNext({
      photosPriseEnCharge: photosByPosition, // Envoyer un objet avec positions
      photosAnomalies: anomalyPhotos,
      anomaliesMetadata: anomalies,
    });
  };

  return (
    <div className="bg-card rounded-lg border border-border shadow-lg p-6 md:p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Photos de prise en charge</h2>
        <p className="text-muted-foreground">Inspection complète du véhicule avant convoyage</p>

        {/* Compteur de progression */}
        <div className="mt-4 p-3 bg-primary/10 rounded-lg border border-primary/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Progression</span>
            <span className="text-lg font-bold text-primary">
              {getPhotoCount()} / 12
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${(getPhotoCount() / 12) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Schéma véhicule simplifié */}
        <div className="p-4 bg-muted/30 rounded-lg border mb-6">
          <p className="text-sm text-muted-foreground text-center mb-4">
            📐 Suivez l'ordre des numéros pour une inspection méthodique
          </p>
          <div className="grid grid-cols-3 gap-2 text-xs text-center max-w-md mx-auto">
            <div></div>
            <div className="font-mono bg-green-100 dark:bg-green-900/20 p-2 rounded">1. Capot</div>
            <div></div>
            <div className="font-mono bg-blue-100 dark:bg-blue-900/20 p-2 rounded">2-5. Côté G</div>
            <div className="font-mono bg-yellow-100 dark:bg-yellow-900/20 p-2 rounded">11. Toit</div>
            <div className="font-mono bg-blue-100 dark:bg-blue-900/20 p-2 rounded">7-10. Côté D</div>
            <div></div>
            <div className="font-mono bg-red-100 dark:bg-red-900/20 p-2 rounded">6. Coffre</div>
            <div></div>
          </div>
          <p className="text-xs text-center mt-2 text-muted-foreground">
            + 12. Tableau de bord (intérieur)
          </p>
        </div>

        {/* Liste des photos à prendre */}
        <div className="space-y-3">
          {PHOTO_POSITIONS.map((position) => {
            const photoData = photosData[position.id];
            const hasPhoto = photoData.mainPhoto !== null;

            return (
              <div
                key={position.id}
                className={`p-4 rounded-lg border transition-all ${
                  hasPhoto
                    ? 'bg-green-50 dark:bg-green-900/10 border-green-300 dark:border-green-700'
                    : 'bg-card border-border'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {hasPhoto && (
                        <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
                      )}
                      <Label className="font-semibold cursor-pointer">
                        {position.label}
                      </Label>
                      {position.required && (
                        <span className="text-xs text-destructive">*</span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{position.description}</p>

                    {hasPhoto && (
                      <p className="text-xs text-green-600 dark:text-green-400 mt-1 font-medium">
                        ✓ Photo capturée
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {!hasPhoto ? (
                      <label htmlFor={`photo-${position.id}`}>
                        <input
                          type="file"
                          id={`photo-${position.id}`}
                          accept="image/*"
                          capture="environment"
                          className="hidden"
                          onChange={(e) => handleFileInputChange(position.id, e)}
                        />
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => document.getElementById(`photo-${position.id}`)?.click()}
                        >
                          <Camera className="h-4 w-4 mr-2" />
                          Prendre
                        </Button>
                      </label>
                    ) : (
                      <>
                        <label htmlFor={`photo-${position.id}`}>
                          <input
                            type="file"
                            id={`photo-${position.id}`}
                            accept="image/*"
                            capture="environment"
                            className="hidden"
                            onChange={(e) => handleFileInputChange(position.id, e)}
                          />
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => document.getElementById(`photo-${position.id}`)?.click()}
                          >
                            <Camera className="h-4 w-4 mr-2" />
                            Remplacer
                          </Button>
                        </label>
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          onClick={() => handleRemoveMainPhoto(position.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {/* Anomaly section */}
                {hasPhoto && (
                  <div className="mt-4 pt-4 border-t border-border space-y-3">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id={`anomaly-${position.id}`}
                        checked={photoData.hasAnomaly}
                        onCheckedChange={(checked) => handleAnomalyToggle(position.id, checked as boolean)}
                      />
                      <Label
                        htmlFor={`anomaly-${position.id}`}
                        className="text-sm font-medium cursor-pointer flex items-center gap-2"
                      >
                        <AlertTriangle className="h-4 w-4 text-orange-600" />
                        Anomalie détectée sur cette zone
                      </Label>
                    </div>

                    {photoData.hasAnomaly && (
                      <div className="pl-6 space-y-3 bg-orange-50 dark:bg-orange-900/10 p-3 rounded-md border border-orange-200 dark:border-orange-800">
                        <div>
                          <Label htmlFor={`anomaly-photo-${position.id}`} className="text-sm mb-2 block">
                            Photo rapprochée de l'anomalie
                          </Label>
                          <div className="flex gap-2">
                            {!photoData.anomalyPhoto ? (
                              <label htmlFor={`anomaly-photo-${position.id}`}>
                                <input
                                  type="file"
                                  id={`anomaly-photo-${position.id}`}
                                  accept="image/*"
                                  capture="environment"
                                  className="hidden"
                                  onChange={(e) => handleAnomalyFileInputChange(position.id, e)}
                                />
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() => document.getElementById(`anomaly-photo-${position.id}`)?.click()}
                                >
                                  <Camera className="h-4 w-4 mr-2" />
                                  Photographier
                                </Button>
                              </label>
                            ) : (
                              <div className="flex items-center gap-2">
                                <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                                  ✓ Photo anomalie capturée
                                </p>
                                <label htmlFor={`anomaly-photo-${position.id}`}>
                                  <input
                                    type="file"
                                    id={`anomaly-photo-${position.id}`}
                                    accept="image/*"
                                    capture="environment"
                                    className="hidden"
                                    onChange={(e) => handleAnomalyFileInputChange(position.id, e)}
                                  />
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => document.getElementById(`anomaly-photo-${position.id}`)?.click()}
                                  >
                                    Remplacer
                                  </Button>
                                </label>
                              </div>
                            )}
                          </div>
                        </div>

                        <div>
                          <Label htmlFor={`anomaly-desc-${position.id}`} className="text-sm mb-2 block">
                            Description de l'anomalie
                          </Label>
                          <Textarea
                            id={`anomaly-desc-${position.id}`}
                            value={photoData.anomalyDescription}
                            onChange={(e) => handleAnomalyDescriptionChange(position.id, e.target.value)}
                            placeholder="Ex: Rayure profonde 15cm verticale sur la porte..."
                            rows={3}
                            className="text-sm"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Avertissement si incomplet */}
        {!isComplete() && getPhotoCount() > 0 && (
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-300 dark:border-yellow-700 rounded-lg">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              ⚠️ Il vous reste {12 - getPhotoCount()} photo(s) à prendre pour compléter l'inspection
            </p>
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onPrevious}
            className="flex-1"
          >
            ← Retour
          </Button>
          <Button
            type="submit"
            className="flex-1"
            disabled={!isComplete()}
          >
            {isComplete() ? 'Suivant →' : `${getPhotoCount()}/12 photos`}
          </Button>
        </div>
      </form>
    </div>
  );
}
