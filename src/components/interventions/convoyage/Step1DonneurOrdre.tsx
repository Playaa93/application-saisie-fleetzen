'use client';

import { useState, useEffect } from 'react';
import { InterventionFormData } from '@/types/intervention';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AddressAutocomplete } from '@/components/ui/address-autocomplete';

interface Step1DonneurOrdreProps {
  formData: Partial<InterventionFormData>;
  onNext: (data: Partial<InterventionFormData>) => void;
  onPrevious: () => void;
}

export default function Step1DonneurOrdre({ formData, onNext, onPrevious }: Step1DonneurOrdreProps) {
  const [donneurOrdreNom, setDonneurOrdreNom] = useState(formData.donneurOrdreNom || '');
  const [donneurOrdreAdresse, setDonneurOrdreAdresse] = useState(formData.donneurOrdreAdresse || '');
  const [donneurOrdreContact, setDonneurOrdreContact] = useState(formData.donneurOrdreContact || '');
  const [adresseDepart, setAdresseDepart] = useState(formData.adresseDepart || '');
  const [adresseArrivee, setAdresseArrivee] = useState(formData.adresseArrivee || '');
  const [observations, setObservations] = useState(formData.observations || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!donneurOrdreNom || !donneurOrdreAdresse || !adresseDepart || !adresseArrivee) {
      alert('⚠️ Veuillez remplir tous les champs obligatoires');
      return;
    }

    onNext({
      donneurOrdreNom,
      donneurOrdreAdresse,
      donneurOrdreContact,
      adresseDepart,
      adresseArrivee,
      observations,
    });
  };

  return (
    <div className="bg-card rounded-lg border border-border shadow-lg p-6 md:p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Donneur d'ordre</h2>
        <p className="text-muted-foreground">Informations du client commanditaire du transport</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Donneur d'ordre */}
        <div className="space-y-4 p-4 bg-muted/30 rounded-lg border">
          <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Client / Donneur d'ordre</h3>

          <div>
            <Label htmlFor="donneurOrdreNom">Nom / Raison sociale *</Label>
            <Input
              id="donneurOrdreNom"
              type="text"
              value={donneurOrdreNom}
              onChange={(e) => setDonneurOrdreNom(e.target.value)}
              placeholder="Ex: Entreprise SARL"
              required
            />
          </div>

          <div>
            <Label htmlFor="donneurOrdreAdresse">Adresse complète *</Label>
            <AddressAutocomplete
              value={donneurOrdreAdresse}
              onChange={setDonneurOrdreAdresse}
              placeholder="Commencez à taper l'adresse..."
              country="fr"
            />
          </div>

          <div>
            <Label htmlFor="donneurOrdreContact">Contact (téléphone / email)</Label>
            <Input
              id="donneurOrdreContact"
              type="text"
              value={donneurOrdreContact}
              onChange={(e) => setDonneurOrdreContact(e.target.value)}
              placeholder="06 XX XX XX XX ou email@example.com"
            />
          </div>
        </div>

        {/* Trajet */}
        <div className="space-y-4 p-4 bg-muted/30 rounded-lg border">
          <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Trajet de convoyage</h3>

          <div>
            <Label htmlFor="adresseDepart">
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Point A - Adresse de départ *
              </span>
            </Label>
            <AddressAutocomplete
              value={adresseDepart}
              onChange={setAdresseDepart}
              placeholder="Adresse de prise en charge..."
              country="fr"
            />
          </div>

          <div>
            <Label htmlFor="adresseArrivee">
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Point B - Adresse d'arrivée *
              </span>
            </Label>
            <AddressAutocomplete
              value={adresseArrivee}
              onChange={setAdresseArrivee}
              placeholder="Adresse de livraison..."
              country="fr"
            />
          </div>
        </div>

        {/* Observations */}
        <div>
          <Label htmlFor="observations">Observations / Instructions particulières</Label>
          <Textarea
            id="observations"
            value={observations}
            onChange={(e) => setObservations(e.target.value)}
            placeholder="Toute information utile pour le transport..."
            rows={3}
          />
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
