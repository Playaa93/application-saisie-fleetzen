'use client';

import { InterventionFormData } from '@/types/intervention';
import Step1DonneurOrdre from './convoyage/Step1DonneurOrdre';
import Step2VehiculeInfos from './convoyage/Step2VehiculeInfos';
import Step3PhotosPriseEnCharge from './convoyage/Step3PhotosPriseEnCharge';
import Step4Validation from './convoyage/Step4Validation';
import Step5TrajetNavigation from './convoyage/Step5TrajetNavigation';
import Step6Remise from './convoyage/Step6Remise';
import { Button } from '@/components/ui/button';
import { Zap } from 'lucide-react';

interface ConvoyageStepsProps {
  currentStep: number; // 1 à 6
  formData: Partial<InterventionFormData>;
  onNext: (data: Partial<InterventionFormData>) => void;
  onPrevious: () => void;
  onSubmit: (data: Partial<InterventionFormData>) => void;
  isSubmitting: boolean;
}

// Fonction de génération de données de test
const generateTestData = (currentStep: number): Partial<InterventionFormData> => {
  const testData: Partial<InterventionFormData> = {};

  // Step 1: Donneur d'ordre
  if (currentStep >= 1) {
    testData.donneurOrdreNom = 'Société Test Transport';
    testData.donneurOrdreAdresse = '123 Avenue des Champs-Élysées, 75008 Paris, France';
    testData.donneurOrdreContact = '0123456789 / test@transport.fr';
    testData.adresseDepart = '10 Rue de la Paix, 75002 Paris, France';
    testData.adresseArrivee = '50 Avenue Montaigne, 75008 Paris, France';
    testData.observations = 'Transport de véhicule de test - Convoyage standard';
  }

  // Step 2: Informations véhicule
  if (currentStep >= 2) {
    testData.immatriculation = 'AB-123-CD';
    testData.vin = 'VF3LCYHZPHS123456';
    testData.marque = 'Peugeot';
    testData.modele = '308';
    testData.couleur = 'Bleu';
    testData.kilometrage = 45000;
    testData.etatCarburant = '1/2';
  }

  return testData;
};

export default function ConvoyageSteps({
  currentStep,
  formData,
  onNext,
  onPrevious,
  onSubmit,
  isSubmitting,
}: ConvoyageStepsProps) {
  // Fonction pour remplir automatiquement le step actuel
  const handleAutoFill = () => {
    const testData = generateTestData(currentStep);
    onNext(testData);
  };

  // Step 1: Donneur d'ordre
  if (currentStep === 1) {
    return (
      <div className="space-y-4">
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAutoFill}
              className="w-full"
            >
              <Zap className="w-4 h-4 mr-2" />
              🧪 Remplir automatiquement (DEV)
            </Button>
          </div>
        )}
        <Step1DonneurOrdre
          formData={formData}
          onNext={onNext}
          onPrevious={onPrevious}
        />
      </div>
    );
  }

  // Step 2: Informations véhicule
  if (currentStep === 2) {
    return (
      <div className="space-y-4">
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAutoFill}
              className="w-full"
            >
              <Zap className="w-4 h-4 mr-2" />
              🧪 Remplir automatiquement (DEV)
            </Button>
          </div>
        )}
        <Step2VehiculeInfos
          formData={formData}
          onNext={onNext}
          onPrevious={onPrevious}
        />
      </div>
    );
  }

  // Step 3: Photos prise en charge (12 positions)
  if (currentStep === 3) {
    return (
      <Step3PhotosPriseEnCharge
        formData={formData}
        onNext={onNext}
        onPrevious={onPrevious}
      />
    );
  }

  // Step 4: Validation et signatures prise en charge
  if (currentStep === 4) {
    return (
      <Step4Validation
        formData={formData}
        onNext={onNext}
        onPrevious={onPrevious}
      />
    );
  }

  // Step 5: Trajet et navigation GPS
  if (currentStep === 5) {
    return (
      <Step5TrajetNavigation
        formData={formData}
        onNext={onNext}
        onPrevious={onPrevious}
      />
    );
  }

  // Step 6: Remise du véhicule (photos + observations + signatures)
  if (currentStep === 6) {
    return (
      <Step6Remise
        formData={formData}
        onNext={onSubmit}
        onPrevious={onPrevious}
      />
    );
  }

  return null;
}
