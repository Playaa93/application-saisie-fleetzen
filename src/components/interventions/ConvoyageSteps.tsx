'use client';

import { InterventionFormData } from '@/types/intervention';
import Step1DonneurOrdre from './convoyage/Step1DonneurOrdre';
import Step2VehiculeInfos from './convoyage/Step2VehiculeInfos';
import Step3PhotosPriseEnCharge from './convoyage/Step3PhotosPriseEnCharge';
import Step4Validation from './convoyage/Step4Validation';

interface ConvoyageStepsProps {
  currentStep: number; // 1 à 4
  formData: Partial<InterventionFormData>;
  onNext: (data: Partial<InterventionFormData>) => void;
  onPrevious: () => void;
  onSubmit: (data: Partial<InterventionFormData>) => void;
  isSubmitting: boolean;
}

export default function ConvoyageSteps({
  currentStep,
  formData,
  onNext,
  onPrevious,
  onSubmit,
  isSubmitting,
}: ConvoyageStepsProps) {
  // Step 1: Donneur d'ordre
  if (currentStep === 1) {
    return (
      <Step1DonneurOrdre
        formData={formData}
        onNext={onNext}
        onPrevious={onPrevious}
      />
    );
  }

  // Step 2: Informations véhicule
  if (currentStep === 2) {
    return (
      <Step2VehiculeInfos
        formData={formData}
        onNext={onNext}
        onPrevious={onPrevious}
      />
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

  // Step 4: Validation et observations
  if (currentStep === 4) {
    return (
      <Step4Validation
        formData={formData}
        onNext={onSubmit}
        onPrevious={onPrevious}
      />
    );
  }

  return null;
}
