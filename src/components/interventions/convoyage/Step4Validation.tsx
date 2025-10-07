'use client';

import { useState } from 'react';
import { InterventionFormData } from '@/types/intervention';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2 } from 'lucide-react';

interface Step4ValidationProps {
  formData: Partial<InterventionFormData>;
  onNext: (data: Partial<InterventionFormData>) => void;
  onPrevious: () => void;
}

export default function Step4Validation({ formData, onNext, onPrevious }: Step4ValidationProps) {
  const [observationsDepart, setObservationsDepart] = useState(formData.observationsDepart || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    onNext({
      observationsDepart,
      // Pour MVP: on simule les signatures avec un timestamp
      signatureAgentDepart: `signature_agent_${Date.now()}`,
      signatureClientDepart: `signature_client_${Date.now()}`,
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

        {/* Info signatures (MVP simplifié) */}
        <div className="p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-300 dark:border-blue-700 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            ℹ️ <strong>Validation automatique</strong> - Les signatures électroniques seront demandées lors de la remise du véhicule.
          </p>
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
          <Button type="submit" className="flex-1">
            Démarrer le convoyage →
          </Button>
        </div>
      </form>
    </div>
  );
}
