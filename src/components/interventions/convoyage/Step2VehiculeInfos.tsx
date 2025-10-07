'use client';

import { useState } from 'react';
import { InterventionFormData } from '@/types/intervention';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { VehicleBrandCombobox } from '@/components/ui/vehicle-brand-combobox';
import { VehicleModelCombobox } from '@/components/ui/vehicle-model-combobox';
import { ColorRadioGroup } from '@/components/ui/color-radio-group';

interface Step2VehiculeInfosProps {
  formData: Partial<InterventionFormData>;
  onNext: (data: Partial<InterventionFormData>) => void;
  onPrevious: () => void;
}

export default function Step2VehiculeInfos({ formData, onNext, onPrevious }: Step2VehiculeInfosProps) {
  const [immatriculation, setImmatriculation] = useState(formData.immatriculation || '');
  const [vin, setVin] = useState(formData.vin || '');
  const [marque, setMarque] = useState(formData.marque || '');
  const [modele, setModele] = useState(formData.modele || '');
  const [couleur, setCouleur] = useState(formData.couleur || '');
  const [kilometrage, setKilometrage] = useState(formData.kilometrage || '');
  const [etatCarburant, setEtatCarburant] = useState(formData.etatCarburant || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!immatriculation || !marque || !modele) {
      alert('⚠️ Veuillez remplir tous les champs obligatoires');
      return;
    }

    onNext({
      immatriculation: immatriculation.toUpperCase(),
      vin: vin.toUpperCase(),
      marque,
      modele,
      couleur,
      kilometrage: kilometrage ? parseInt(kilometrage) : undefined,
      etatCarburant,
    });
  };

  return (
    <div className="bg-card rounded-lg border border-border shadow-lg p-6 md:p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Informations véhicule</h2>
        <p className="text-muted-foreground">Identification complète du véhicule à convoyer</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Identification */}
        <div className="space-y-4 p-4 bg-muted/30 rounded-lg border">
          <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Identification</h3>

          <div>
            <Label htmlFor="immatriculation">Plaque d'immatriculation *</Label>
            <Input
              id="immatriculation"
              type="text"
              value={immatriculation}
              onChange={(e) => setImmatriculation(e.target.value)}
              placeholder="AB-123-CD"
              className="font-mono uppercase"
              required
            />
          </div>

          <div>
            <Label htmlFor="vin">
              Numéro VIN (17 caractères)
              <span className="ml-2 text-xs text-muted-foreground">(optionnel mais recommandé)</span>
            </Label>
            <Input
              id="vin"
              type="text"
              value={vin}
              onChange={(e) => setVin(e.target.value)}
              placeholder="1HGBH41JXMN109186"
              className="font-mono uppercase"
              maxLength={17}
            />
            {vin && vin.length > 0 && vin.length !== 17 && (
              <p className="text-xs text-destructive mt-1">⚠️ Le VIN doit contenir exactement 17 caractères</p>
            )}
          </div>
        </div>

        {/* Caractéristiques */}
        <div className="space-y-4 p-4 bg-muted/30 rounded-lg border">
          <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Caractéristiques</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="marque">Marque *</Label>
              <VehicleBrandCombobox
                value={marque}
                onChange={(brandId) => {
                  setMarque(brandId);
                  setModele(''); // Reset model when brand changes
                }}
                placeholder="Sélectionner une marque..."
              />
            </div>

            <div>
              <Label htmlFor="modele">Modèle *</Label>
              <VehicleModelCombobox
                brandId={marque}
                value={modele}
                onChange={setModele}
                placeholder="Sélectionner un modèle..."
                disabled={!marque}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="couleur">Couleur</Label>
            <ColorRadioGroup
              value={couleur}
              onValueChange={setCouleur}
              showAllColors={false}
              cols={4}
              colsMobile={3}
            />
          </div>
        </div>

        {/* État véhicule */}
        <div className="space-y-4 p-4 bg-muted/30 rounded-lg border">
          <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">État au départ</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="kilometrage">Kilométrage (km)</Label>
              <Input
                id="kilometrage"
                type="number"
                value={kilometrage}
                onChange={(e) => setKilometrage(e.target.value)}
                placeholder="Ex: 45000"
                min="0"
                step="1"
              />
            </div>

            <div>
              <Label htmlFor="etatCarburant">Niveau de carburant</Label>
              <Select value={etatCarburant} onValueChange={setEtatCarburant}>
                <SelectTrigger id="etatCarburant">
                  <SelectValue placeholder="Sélectionner..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vide">🟥 Vide (0-10%)</SelectItem>
                  <SelectItem value="reserve">🟧 Réserve (10-25%)</SelectItem>
                  <SelectItem value="faible">🟨 Faible (25-50%)</SelectItem>
                  <SelectItem value="moyen">🟦 Moyen (50-75%)</SelectItem>
                  <SelectItem value="plein">🟩 Plein (75-100%)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
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
            Suivant →
          </Button>
        </div>
      </form>
    </div>
  );
}
