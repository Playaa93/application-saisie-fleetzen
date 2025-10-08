'use client';

import { useState } from 'react';
import { InterventionFormData } from '@/types/intervention';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SignaturePadComponent } from '@/components/ui/signature-pad';
import { CheckCircle2, AlertCircle } from 'lucide-react';

interface Step4ValidationProps {
  formData: Partial<InterventionFormData>;
  onNext: (data: Partial<InterventionFormData>) => void;
  onPrevious: () => void;
}

export default function Step4Validation({ formData, onNext, onPrevious }: Step4ValidationProps) {
  const [observationsDepart, setObservationsDepart] = useState(formData.observationsDepart || '');
  const [signatureAgent, setSignatureAgent] = useState<string | null>(null);
  const [signatureClient, setSignatureClient] = useState<string | null>(null);

  const canSubmit = signatureAgent !== null && signatureClient !== null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!canSubmit) {
      alert('⚠️ Les deux signatures sont obligatoires pour continuer');
      return;
    }

    onNext({
      observationsDepart,
      signatureAgentDepart: signatureAgent,
      signatureClientDepart: signatureClient,
    });
  };

  return (
    <div className="bg-card rounded-lg border border-border shadow-lg p-6 md:p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Validation prise en charge</h2>
        <p className="text-muted-foreground">Vérification et observations avant départ</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Résumé des informations */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg border-b pb-2">Récapitulatif</h3>

          {/* Donneur d'ordre */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Donneur d'ordre</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-1">
              <p><span className="font-medium">Nom:</span> {formData.donneurOrdreNom || '-'}</p>
              <p><span className="font-medium">Adresse:</span> {formData.donneurOrdreAdresse || '-'}</p>
              {formData.donneurOrdreContact && (
                <p><span className="font-medium">Contact:</span> {formData.donneurOrdreContact}</p>
              )}
            </CardContent>
          </Card>

          {/* Trajet */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Trajet</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-1">
              <div className="flex items-start gap-2">
                <span className="text-green-600 font-bold">A:</span>
                <span>
                  {typeof formData.adresseDepart === 'string'
                    ? formData.adresseDepart
                    : formData.adresseDepart?.adresse || '-'}
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-red-600 font-bold">B:</span>
                <span>
                  {typeof formData.adresseArrivee === 'string'
                    ? formData.adresseArrivee
                    : formData.adresseArrivee?.adresse || '-'}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Véhicule */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Véhicule</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-1">
              <p><span className="font-medium">Immatriculation:</span> {formData.immatriculation || '-'}</p>
              <p><span className="font-medium">Marque/Modèle:</span> {formData.marque} {formData.modele}</p>
              {formData.vin && <p><span className="font-medium">VIN:</span> {formData.vin}</p>}
              {formData.couleur && <p><span className="font-medium">Couleur:</span> {formData.couleur}</p>}
              {formData.kilometrage && (
                <p><span className="font-medium">Kilométrage:</span> {formData.kilometrage} km</p>
              )}
              {formData.etatCarburant && (
                <p><span className="font-medium">Carburant:</span> {formData.etatCarburant}</p>
              )}
            </CardContent>
          </Card>

          {/* Photos */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Photos de prise en charge</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="h-5 w-5" />
                <span className="text-sm font-medium">
                  12 photos capturées
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Observations au départ */}
        <div className="space-y-4 p-4 bg-muted/30 rounded-lg border">
          <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
            Observations au départ
          </h3>

          <div>
            <Label htmlFor="observationsDepart">
              État général, dommages visibles, particularités...
            </Label>
            <Textarea
              id="observationsDepart"
              value={observationsDepart}
              onChange={(e) => setObservationsDepart(e.target.value)}
              placeholder="Ex: Rayure sur aile avant droite, pneu avant gauche usé..."
              rows={4}
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Ces observations seront incluses dans la lettre de voiture
            </p>
          </div>
        </div>

        {/* Signatures électroniques */}
        <div className="space-y-6 p-4 bg-muted/30 rounded-lg border">
          <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
            Signatures de prise en charge
          </h3>

          {/* Signature Agent */}
          <SignaturePadComponent
            label="Signature de l'agent convoyeur"
            required
            onSignatureChange={setSignatureAgent}
            width={Math.min(500, window.innerWidth - 100)}
            height={180}
          />

          {/* Signature Client */}
          <SignaturePadComponent
            label="Signature du client / donneur d'ordre"
            required
            onSignatureChange={setSignatureClient}
            width={Math.min(500, window.innerWidth - 100)}
            height={180}
          />

          {(!signatureAgent || !signatureClient) && (
            <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-300 dark:border-yellow-700 rounded-md">
              <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                Les deux signatures sont obligatoires pour démarrer le convoyage
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
            disabled={!canSubmit}
          >
            {canSubmit ? 'Démarrer le convoyage →' : 'Signatures requises'}
          </Button>
        </div>
      </form>
    </div>
  );
}
