'use client';

import { useState } from 'react';
import { InterventionFormData } from '@/types/intervention';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { SignaturePadComponent } from '@/components/ui/signature-pad';
import { Camera, Check, X, AlertCircle } from 'lucide-react';
import Compressor from 'compressorjs';
import { toast } from 'sonner';

interface Step6RemiseProps {
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

const PHOTO_POSITIONS: PhotoPosition[] = [
  { id: 'capot', label: '1. Capot', description: 'Vue face avant complète', required: true },
  { id: 'roue_avant_gauche', label: '2. Roue avant gauche', description: 'Roue et passage de roue avant gauche', required: true },
  { id: 'lateral_gauche', label: '3. Latéral gauche', description: 'Côté conducteur complet', required: true },
  { id: 'roue_arriere_gauche', label: '4. Roue arrière gauche', description: 'Roue et passage de roue arrière gauche', required: true },
  { id: 'arriere', label: '5. Arrière', description: 'Vue face arrière complète', required: true },
  { id: 'coffre', label: '6. Coffre', description: 'Intérieur du coffre', required: true },
  { id: 'roue_arriere_droite', label: '7. Roue arrière droite', description: 'Roue et passage de roue arrière droite', required: true },
  { id: 'lateral_droit', label: '8. Latéral droit', description: 'Côté passager complet', required: true },
  { id: 'roue_avant_droite', label: '9. Roue avant droite', description: 'Roue et passage de roue avant droite', required: true },
  { id: 'interieur_avant', label: '10. Intérieur avant', description: 'Sièges avant et console centrale', required: true },
  { id: 'interieur_arriere', label: '11. Intérieur arrière', description: 'Sièges arrière', required: true },
  { id: 'tableau_bord', label: '12. Tableau de bord', description: 'Compteur kilométrique visible', required: true },
];

// Helper function to compress photos
const compressPhoto = async (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    new Compressor(file, {
      quality: 0.85,
      maxWidth: 1920,
      maxHeight: 1920,
      convertTypes: ['image/png', 'image/webp'],
      convertSize: 1000000,
      mimeType: 'image/jpeg',
      checkOrientation: true,
      success: (compressedFile) => {
        const renamedFile = new File(
          [compressedFile],
          file.name.replace(/\.[^/.]+$/, '.jpg'),
          { type: 'image/jpeg', lastModified: file.lastModified }
        );
        resolve(renamedFile);
      },
      error: (err) => reject(err)
    });
  });
};

export default function Step6Remise({ formData, onNext, onPrevious }: Step6RemiseProps) {
  const [photosRemise, setPhotosRemise] = useState<Record<string, File | null>>(() => {
    const initial: Record<string, File | null> = {};
    PHOTO_POSITIONS.forEach(pos => {
      initial[pos.id] = null;
    });
    return initial;
  });

  const [observationsArrivee, setObservationsArrivee] = useState('');
  const [signatureAgent, setSignatureAgent] = useState<string | null>(null);
  const [signatureClient, setSignatureClient] = useState<string | null>(null);

  const handlePhotoChange = (positionId: string, file: File) => {
    setPhotosRemise(prev => ({ ...prev, [positionId]: file }));
  };

  const handleRemovePhoto = (positionId: string) => {
    setPhotosRemise(prev => ({ ...prev, [positionId]: null }));
  };

  const handleFileInputChange = async (positionId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const toastId = toast.loading('Compression de la photo...');
      try {
        const compressed = await compressPhoto(file);
        handlePhotoChange(positionId, compressed);
        toast.success('Photo compressée', { id: toastId, duration: 1000 });
      } catch (error) {
        console.error('Erreur de compression:', error);
        toast.error('Erreur de compression', { id: toastId });
      }
    }
  };

  const getPhotoCount = () => {
    return Object.values(photosRemise).filter(photo => photo !== null).length;
  };

  const isComplete = () => {
    // Toutes les 12 photos + 2 signatures obligatoires
    const allPhotos = PHOTO_POSITIONS.every(pos => photosRemise[pos.id] !== null);
    return allPhotos && signatureAgent !== null && signatureClient !== null;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isComplete()) {
      alert('⚠️ Veuillez prendre les 12 photos et signer les deux signatures pour finaliser la remise');
      return;
    }

    // Convert photos to array for FormData
    const photosRemiseArray: File[] = [];
    PHOTO_POSITIONS.forEach(pos => {
      if (photosRemise[pos.id]) {
        photosRemiseArray.push(photosRemise[pos.id]!);
      }
    });

    onNext({
      photosRemise: photosRemiseArray,
      observationsArrivee,
      signatureAgentArrivee: signatureAgent,
      signatureClientArrivee: signatureClient,
    });
  };

  return (
    <div className="bg-card rounded-lg border border-border shadow-lg p-6 md:p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Remise du véhicule</h2>
        <p className="text-muted-foreground">Inspection complète à l'arrivée</p>

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

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Liste des photos à prendre */}
        <div className="space-y-3">
          {PHOTO_POSITIONS.map((position) => {
            const photo = photosRemise[position.id];
            const hasPhoto = photo !== null;

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
                      <label htmlFor={`photo-remise-${position.id}`}>
                        <input
                          type="file"
                          id={`photo-remise-${position.id}`}
                          accept="image/*"
                          capture="environment"
                          className="hidden"
                          onChange={(e) => handleFileInputChange(position.id, e)}
                        />
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => document.getElementById(`photo-remise-${position.id}`)?.click()}
                        >
                          <Camera className="h-4 w-4 mr-2" />
                          Prendre
                        </Button>
                      </label>
                    ) : (
                      <>
                        <label htmlFor={`photo-remise-${position.id}`}>
                          <input
                            type="file"
                            id={`photo-remise-${position.id}`}
                            accept="image/*"
                            capture="environment"
                            className="hidden"
                            onChange={(e) => handleFileInputChange(position.id, e)}
                          />
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => document.getElementById(`photo-remise-${position.id}`)?.click()}
                          >
                            <Camera className="h-4 w-4 mr-2" />
                            Remplacer
                          </Button>
                        </label>
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          onClick={() => handleRemovePhoto(position.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Observations à l'arrivée */}
        <div className="space-y-4 p-4 bg-muted/30 rounded-lg border">
          <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
            Observations à l'arrivée
          </h3>

          <div>
            <Label htmlFor="observationsArrivee">
              État général, nouveaux dommages, remarques...
            </Label>
            <Textarea
              id="observationsArrivee"
              value={observationsArrivee}
              onChange={(e) => setObservationsArrivee(e.target.value)}
              placeholder="Ex: Véhicule remis en bon état, aucun nouveau dommage constaté..."
              rows={4}
              className="mt-2"
            />
          </div>
        </div>

        {/* Signatures de remise */}
        <div className="space-y-6 p-4 bg-muted/30 rounded-lg border">
          <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
            Signatures de remise
          </h3>

          <SignaturePadComponent
            label="Signature de l'agent convoyeur"
            required
            onSignatureChange={setSignatureAgent}
            width={Math.min(500, window.innerWidth - 100)}
            height={180}
          />

          <SignaturePadComponent
            label="Signature du destinataire"
            required
            onSignatureChange={setSignatureClient}
            width={Math.min(500, window.innerWidth - 100)}
            height={180}
          />

          {!isComplete() && (
            <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-300 dark:border-yellow-700 rounded-md">
              <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                12 photos + 2 signatures obligatoires pour finaliser la remise
              </p>
            </div>
          )}
        </div>

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
            {isComplete() ? 'Finaliser la remise →' : `${getPhotoCount()}/12 photos + signatures`}
          </Button>
        </div>
      </form>
    </div>
  );
}
