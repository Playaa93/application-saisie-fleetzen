'use client';

import { useState } from 'react';
import PhotoUploadMultiple from '@/components/PhotoUploadMultiple';

interface CarburantCuveStepsProps {
  currentStep: number;
  formData: any;
  onNext: (data: any) => void;
  onPrevious: () => void;
  onSubmit: (data: any) => void;
  isSubmitting?: boolean;
}

export default function CarburantCuveSteps({ currentStep, formData, onNext, onPrevious, onSubmit }: CarburantCuveStepsProps) {
  const [data, setData] = useState(formData);

  // Étape 1: Remplissage de la cuve
  if (currentStep === 1) {
    return (
      <div className="bg-card rounded-lg border border-border shadow-lg p-6 md:p-8">
        <h2 className="text-2xl font-bold mb-6">Remplissage de la cuve</h2>
        <form onSubmit={(e) => { e.preventDefault(); onNext(data); }} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Carburant chargé *</label>
            <div className="space-y-2">
              {['Diesel', 'AdBlue', 'GNR'].map(type => (
                <label key={type} className="flex items-center p-3 border border-border rounded-lg cursor-pointer hover:bg-accent">
                  <input
                    type="checkbox"
                    checked={data.carburant?.[type] || false}
                    onChange={(e) => setData({ ...data, carburant: { ...data.carburant, [type]: e.target.checked } })}
                    className="mr-3"
                  />
                  <span>{type}</span>
                </label>
              ))}
            </div>
          </div>

          <PhotoUploadMultiple
            label="Photo des jauges avant remplissage (cuve mobile) *"
            helperText="La jauge mécanique est sur la cuve dans le véhicule"
            maxFiles={5}
            onChange={(files) => setData({ ...data, photosJaugesAvant: files })}
            value={data.photosJaugesAvant}
          />

          <div>
            <label className="block text-sm font-medium mb-2">Prix d'achat carburant au litre (TTC) *</label>
            <input
              type="number"
              step="0.01"
              value={data.prixLitre || ''}
              onChange={(e) => setData({ ...data, prixLitre: e.target.value })}
              className="w-full p-3 border rounded-lg"
              placeholder="1.50"
              required
            />
            <p className="text-xs text-muted-foreground mt-1">Utiliser le "." et non la virgule comme séparateur</p>
          </div>

          <PhotoUploadMultiple
            label="Photo du manomètre de la pompe (litrage visible) *"
            helperText="La jauge mécanique est sur la cuve"
            maxFiles={5}
            onChange={(files) => setData({ ...data, photoManometre: files })}
            value={data.photoManometre}
          />

          <div>
            <label className="block text-sm font-medium mb-2">Quantité chargée (L) *</label>
            <input
              type="number"
              value={data.quantiteChargee || ''}
              onChange={(e) => setData({ ...data, quantiteChargee: e.target.value })}
              className="w-full p-3 border rounded-lg"
              placeholder="0"
              required
            />
          </div>

          <PhotoUploadMultiple
            label="Photo du ticket de prise du carburant (si station)"
            maxFiles={5}
            onChange={(files) => setData({ ...data, photoTicket: files })}
            value={data.photoTicket}
          />

          <PhotoUploadMultiple
            label="Photo des jauges après livraison (cuve mobile) *"
            helperText="La jauge mécanique est sur la cuve"
            maxFiles={5}
            onChange={(files) => setData({ ...data, photosJaugesApres: files })}
            value={data.photosJaugesApres}
          />

          <div className="flex gap-4">
            <button type="button" onClick={onPrevious} className="px-6 py-3 border rounded-lg">← Retour</button>
            <button type="submit" className="flex-1 bg-fleetzen-teal text-white py-3 rounded-lg hover:bg-fleetzen-teal-dark">Suivant →</button>
          </div>
        </form>
      </div>
    );
  }

  // Étape 2: Validation
  if (currentStep === 2) {
    return (
      <div className="bg-card rounded-lg border border-border shadow-lg p-6 md:p-8">
        <h2 className="text-2xl font-bold mb-6">Commentaires et validation</h2>
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(data); }} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Commentaires (optionnel)</label>
            <textarea
              value={data.commentaires || ''}
              onChange={(e) => setData({ ...data, commentaires: e.target.value })}
              className="w-full p-3 border rounded-lg"
              rows={4}
              placeholder="Observations, remarques..."
            />
          </div>

          <div className="bg-fleetzen-teal/10 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Récapitulatif</h3>
            <ul className="text-sm space-y-1">
              <li>• Quantité chargée: {data.quantiteChargee} L</li>
              <li>• Prix au litre: {data.prixLitre} € TTC</li>
              <li>• Total photos: {
                (data.photosJaugesAvant?.length || 0) +
                (data.photoManometre?.length || 0) +
                (data.photoTicket?.length || 0) +
                (data.photosJaugesApres?.length || 0)
              } fichiers</li>
            </ul>
          </div>

          <div className="flex gap-4">
            <button type="button" onClick={onPrevious} className="px-6 py-3 border rounded-lg">← Retour</button>
            <button type="submit" className="flex items-center justify-center gap-2 flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Valider l'intervention
            </button>
          </div>
        </form>
      </div>
    );
  }

  return null;
}
