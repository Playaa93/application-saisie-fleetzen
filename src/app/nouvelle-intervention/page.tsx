'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import StepsSidebar from '@/components/StepsSidebar';
import Step1TypePrestation from '@/components/interventions/Step1TypePrestation';
import LavageSteps from '@/components/interventions/LavageSteps';
import CarburantLivraisonSteps from '@/components/interventions/CarburantLivraisonSteps';
import CarburantCuveSteps from '@/components/interventions/CarburantCuveSteps';

export default function NouvelleInterventionPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [typePrestation, setTypePrestation] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Définir les étapes selon le type de prestation
  const getSteps = () => {
    if (!typePrestation) {
      return [{ number: 1, label: 'Type de prestation', completed: false }];
    }

    if (typePrestation === 'lavage') {
      return [
        { number: 1, label: 'Type de prestation', completed: true },
        { number: 2, label: 'Prestation lavage', completed: currentStep > 2 },
        { number: 3, label: 'Renseignement clients', completed: currentStep > 3 },
        { number: 4, label: 'Photos', completed: currentStep > 4 },
        { number: 5, label: 'Validation', completed: false },
      ];
    }

    if (typePrestation === 'carburant-livraison') {
      return [
        { number: 1, label: 'Type de prestation', completed: true },
        { number: 2, label: 'Renseignement clients', completed: currentStep > 2 },
        { number: 3, label: 'Carburant livré', completed: currentStep > 3 },
        { number: 4, label: 'Photos', completed: currentStep > 4 },
        { number: 5, label: 'Validation', completed: false },
      ];
    }

    if (typePrestation === 'carburant-cuve') {
      return [
        { number: 1, label: 'Type de prestation', completed: true },
        { number: 2, label: 'Remplissage cuve', completed: currentStep > 2 },
        { number: 3, label: 'Validation', completed: false },
      ];
    }

    return [];
  };

  const handleNext = (data: any) => {
    setFormData({ ...formData, ...data });
    setCurrentStep(currentStep + 1);
  };

  const handlePrevious = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async (finalData: any) => {
    // Protection contre les double-clics
    if (isSubmitting) {
      console.log('⚠️ Soumission déjà en cours, ignoré');
      return;
    }

    setIsSubmitting(true);
    const completeData = { ...formData, ...finalData };

    try {
      const formDataToSend = new FormData();
      Object.keys(completeData).forEach(key => {
        if (key === 'photos' && Array.isArray(completeData[key])) {
          completeData[key].forEach((photo: File, index: number) => {
            formDataToSend.append(`photo${index}`, photo);
          });
        } else {
          formDataToSend.append(key, completeData[key]);
        }
      });

      const response = await fetch('/api/interventions', {
        method: 'POST',
        body: formDataToSend,
      });

      if (response.ok) {
        alert('✅ Intervention enregistrée avec succès !');
        router.push('/interventions');
      } else {
        alert('❌ Erreur lors de l\'enregistrement');
        setIsSubmitting(false); // Réactiver en cas d'erreur
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('❌ Erreur lors de l\'enregistrement');
      setIsSubmitting(false); // Réactiver en cas d'erreur
    }
  };

  const steps = getSteps();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Sidebar de progression */}
      <StepsSidebar steps={steps} currentStep={currentStep} />

      {/* Contenu principal */}
      <div className="flex-1 p-4 md:p-8">
        <div className="max-w-3xl mx-auto">
          {/* Étape 1: Choix du type */}
          {currentStep === 1 && (
            <Step1TypePrestation
              onNext={(type) => {
                setTypePrestation(type);
                setCurrentStep(2);
              }}
            />
          )}

          {/* Formulaires selon le type */}
          {typePrestation === 'lavage' && currentStep > 1 && (
            <LavageSteps
              currentStep={currentStep - 1} // Ajuster car étape 1 = choix type
              formData={formData}
              onNext={handleNext}
              onPrevious={handlePrevious}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
            />
          )}

          {typePrestation === 'carburant-livraison' && currentStep > 1 && (
            <CarburantLivraisonSteps
              currentStep={currentStep - 1}
              formData={formData}
              onNext={handleNext}
              onPrevious={handlePrevious}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
            />
          )}

          {typePrestation === 'carburant-cuve' && currentStep > 1 && (
            <CarburantCuveSteps
              currentStep={currentStep - 1}
              formData={formData}
              onNext={handleNext}
              onPrevious={handlePrevious}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
            />
          )}
        </div>
      </div>
    </div>
  );
}
