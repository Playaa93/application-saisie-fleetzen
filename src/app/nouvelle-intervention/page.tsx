'use client';

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import StepsSidebar from '@/components/StepsSidebar';
import Step1TypePrestation from '@/components/interventions/Step1TypePrestation';
import LavageSteps from '@/components/interventions/LavageSteps';
import CarburantLivraisonSteps from '@/components/interventions/CarburantLivraisonSteps';
import CarburantCuveSteps from '@/components/interventions/CarburantCuveSteps';
import { BottomNav } from '@/components/mobile/BottomNav';
import { requestGeolocation, type GeolocationData } from '@/hooks/useGeolocation';
import { errorLogger } from '@/lib/errorLogger';

export default function NouvelleInterventionPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [typePrestation, setTypePrestation] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gpsData, setGpsData] = useState<GeolocationData | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // Capture GPS location when component mounts
  useEffect(() => {
    const captureGPS = async () => {
      try {
        const location = await requestGeolocation(true, 10000);
        setGpsData(location);
        console.log('📍 GPS capturé:', location);
      } catch (error) {
        console.error('❌ Erreur GPS:', error);
        const errorMessage = error instanceof Error ? error.message : 'Erreur GPS';
        setGpsError(errorMessage);
        errorLogger.log('validation_error', 'GPS capture failed', {
          error: errorMessage
        });
      }
    };

    captureGPS();

    // Global error handler for uncaught errors
    const handleGlobalError = (event: ErrorEvent) => {
      errorLogger.log('unknown', 'Global error caught', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      errorLogger.log('unknown', 'Unhandled promise rejection', {
        reason: event.reason?.toString()
      });
    };

    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

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
    // Log début de soumission (avant toute validation)
    errorLogger.log('api_error', '🚀 handleSubmit called', {
      typePrestation,
      hasFinalData: !!finalData,
      finalDataKeys: finalData ? Object.keys(finalData) : [],
      isSubmitting
    });

    // Protection contre les double-clics
    if (isSubmitting) {
      console.log('⚠️ Soumission déjà en cours, ignoré');
      errorLogger.log('validation_error', 'Double submission prevented', { isSubmitting: true });
      return;
    }

    setIsSubmitting(true);

    // Debug: vérifier les photos dans finalData
    console.log('📸 Photos in finalData:', {
      photosAvant: finalData.photosAvant,
      photosAvantLength: finalData.photosAvant?.length,
      photosApres: finalData.photosApres,
      photosApresLength: finalData.photosApres?.length
    });

    const completeData = {
      ...finalData, // ← finalData en premier pour ne pas être écrasé
      ...formData,  // ← formData en second (ne devrait pas contenir photos)
      type: typePrestation === 'lavage' ? 'Lavage Véhicule' :
            typePrestation === 'carburant-livraison' ? 'Livraison Carburant' :
            typePrestation === 'carburant-cuve' ? 'Remplissage Cuve' : null,
      // Add GPS data if available
      ...(gpsData && {
        latitude: gpsData.latitude,
        longitude: gpsData.longitude,
        gpsAccuracy: gpsData.accuracy,
        gpsCapturedAt: new Date(gpsData.timestamp).toISOString(),
      }),
    };

    // Debug: vérifier les photos dans completeData
    console.log('📸 Photos in completeData:', {
      photosAvant: completeData.photosAvant,
      photosAvantLength: completeData.photosAvant?.length,
      photosApres: completeData.photosApres,
      photosApresLength: completeData.photosApres?.length
    });

    try {
      errorLogger.log('api_error', 'Starting intervention submission', {
        type: completeData.type,
        hasPhotosAvant: !!completeData.photosAvant,
        hasPhotosApres: !!completeData.photosApres,
        hasGPS: !!(gpsData?.latitude && gpsData?.longitude)
      });

      const formDataToSend = new FormData();
      Object.keys(completeData).forEach(key => {
        const value = completeData[key];

        // Gérer les photos AVANT
        if (key === 'photosAvant' && Array.isArray(value)) {
          console.log(`📸 Adding ${value.length} photos AVANT to FormData`);
          value.forEach((photo: File) => {
            console.log(`  - Photo AVANT:`, photo?.name, photo?.size);
            formDataToSend.append('photosAvant', photo);
          });
        }
        // Gérer les photos APRÈS
        else if (key === 'photosApres' && Array.isArray(value)) {
          console.log(`📸 Adding ${value.length} photos APRÈS to FormData`);
          value.forEach((photo: File) => {
            console.log(`  - Photo APRÈS:`, photo?.name, photo?.size);
            formDataToSend.append('photosApres', photo);
          });
        }
        // Gérer les photos MANOMETRE (pour livraison carburant)
        else if (key === 'photoManometre' && Array.isArray(value)) {
          console.log(`📸 Adding ${value.length} photos MANOMETRE to FormData`);
          value.forEach((photo: File) => {
            // Vérifier que c'est bien un File valide
            if (photo instanceof File && photo.size > 0) {
              console.log(`  - Photo MANOMETRE:`, photo.name, photo.size);
              formDataToSend.append('photoManometre', photo);
            } else {
              console.warn(`⚠️ Invalid photo MANOMETRE:`, photo);
            }
          });
        }
        // Gérer les photos JAUGES AVANT (Remplissage Cuve)
        else if (key === 'photosJaugesAvant' && Array.isArray(value)) {
          console.log(`📸 Adding ${value.length} photos JAUGES AVANT to FormData`);
          value.forEach((photo: File) => {
            if (photo instanceof File && photo.size > 0) {
              console.log(`  - Photo JAUGES AVANT:`, photo.name, photo.size);
              formDataToSend.append('photosJaugesAvant', photo);
            } else {
              console.warn(`⚠️ Invalid photo JAUGES AVANT:`, photo);
            }
          });
        }
        // Gérer les photos JAUGES APRÈS (Remplissage Cuve)
        else if (key === 'photosJaugesApres' && Array.isArray(value)) {
          console.log(`📸 Adding ${value.length} photos JAUGES APRÈS to FormData`);
          value.forEach((photo: File) => {
            if (photo instanceof File && photo.size > 0) {
              console.log(`  - Photo JAUGES APRÈS:`, photo.name, photo.size);
              formDataToSend.append('photosJaugesApres', photo);
            } else {
              console.warn(`⚠️ Invalid photo JAUGES APRÈS:`, photo);
            }
          });
        }
        // Gérer la photo TICKET (Remplissage Cuve)
        else if (key === 'photoTicket' && Array.isArray(value)) {
          console.log(`📸 Adding ${value.length} photo(s) TICKET to FormData`);
          value.forEach((photo: File) => {
            if (photo instanceof File && photo.size > 0) {
              console.log(`  - Photo TICKET:`, photo.name, photo.size);
              formDataToSend.append('photoTicket', photo);
            } else {
              console.warn(`⚠️ Invalid photo TICKET:`, photo);
            }
          });
        }
        // Gérer les anciennes photos (compatibilité)
        else if (key === 'photos' && Array.isArray(value)) {
          value.forEach((photo: File, index: number) => {
            formDataToSend.append(`photo${index}`, photo);
          });
        }
        else if (value !== null && value !== undefined) {
          // Sérialiser les objets en JSON (ex: carburant)
          if (typeof value === 'object' && !Array.isArray(value)) {
            formDataToSend.append(key, JSON.stringify(value));
          } else {
            formDataToSend.append(key, value);
          }
        }
      });

      // Get token for Authorization header (more reliable than cookies on mobile)
      const token = typeof window !== 'undefined' ? localStorage.getItem('sb-access-token') : null;

      errorLogger.log('api_error', 'Sending request', {
        hasToken: !!token,
        formDataKeys: Array.from(formDataToSend.keys()),
        url: '/api/interventions'
      });

      const response = await fetch('/api/interventions', {
        method: 'POST',
        headers: token ? {
          'Authorization': `Bearer ${token}`
        } : {},
        body: formDataToSend,
      });

      const responseText = await response.text();
      let responseData;

      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        responseData = { rawText: responseText };
      }

      errorLogger.log('api_error', `Response received: ${response.status}`, {
        status: response.status,
        ok: response.ok,
        response: responseData
      });

      if (response.ok) {
        alert('✅ Intervention enregistrée avec succès !');
        router.push('/interventions');
      } else {
        const errorMessage = responseData?.error || `Erreur ${response.status}`;

        errorLogger.log('api_error', 'Submission failed', {
          status: response.status,
          error: responseData,
          fullResponse: responseText
        });

        alert(`❌ ${errorMessage}`);
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error('Erreur:', error);

      errorLogger.log('network_error', 'Request failed completely', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });

      alert('❌ Erreur de connexion. Vérifiez votre connexion internet.');
      setIsSubmitting(false);
    }
  };

  const steps = getSteps();

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row pb-16">
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
      <BottomNav />
    </div>
  );
}
