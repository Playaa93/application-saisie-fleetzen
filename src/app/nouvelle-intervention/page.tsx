'use client';

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import StepsSidebar from '@/components/StepsSidebar';
import Step1TypePrestation from '@/components/interventions/Step1TypePrestation';
import LavageSteps from '@/components/interventions/LavageSteps';
import CarburantLivraisonSteps from '@/components/interventions/CarburantLivraisonSteps';
import CarburantCuveSteps from '@/components/interventions/CarburantCuveSteps';
import DraftsList from '@/components/DraftsList';
import { BottomNav } from '@/components/mobile/BottomNav';
import { requestGeolocation, type GeolocationData } from '@/hooks/useGeolocation';
import { errorLogger } from '@/lib/errorLogger';
import { useUnsavedChangesWarning } from '@/hooks/useUnsavedChangesWarning';
import { useFormDraft } from '@/hooks/useFormDraft';
import { saveDraft, savePhotoBlobs, listDrafts, type DraftData } from '@/lib/indexedDB';
import { triggerHaptic, HapticPattern } from '@/utils/haptics';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function NouvelleInterventionPage() {
  const router = useRouter();
  const [showDraftsList, setShowDraftsList] = useState(true); // Show drafts list first
  const [currentStep, setCurrentStep] = useState(1);
  const [typePrestation, setTypePrestation] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false); // Loading state for manual save
  const [gpsData, setGpsData] = useState<GeolocationData | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false); // Double confirmation for delete

  // Determine if there are unsaved changes
  const hasUnsavedChanges = typePrestation !== null && Object.keys(formData).length > 0;

  // Hook: Navigation guard to prevent accidental data loss
  const {
    showDialog: showNavigationDialog,
    confirmNavigation,
    cancelNavigation,
    message: navigationMessage,
  } = useUnsavedChangesWarning(hasUnsavedChanges);

  // Hook: Auto-save drafts (NO AUTO-RESTORE)
  const { clearDraft, loadDraft } = useFormDraft(
    'intervention-draft', // Draft ID
    typePrestation || '',
    formData,
    currentStep
  );

  // Auto-skip drafts list if no drafts exist
  useEffect(() => {
    const checkDrafts = async () => {
      try {
        const drafts = await listDrafts();
        if (drafts.length === 0) {
          setShowDraftsList(false); // Skip directly to form
        }
      } catch (error) {
        console.error('Error checking drafts:', error);
        setShowDraftsList(false); // On error, show form
      }
    };

    checkDrafts();
  }, []);

  // Handle resuming a draft
  const handleResumeDraft = async (draft: DraftData) => {
    const loadedDraft = await loadDraft(draft.id);
    if (loadedDraft) {
      setTypePrestation(loadedDraft.typePrestation);
      setFormData(loadedDraft.formData);
      setCurrentStep(loadedDraft.currentStep);
      setShowDraftsList(false); // Hide drafts list
    }
  };

  // Handle starting new intervention
  const handleStartNew = () => {
    setShowDraftsList(false);
    setTypePrestation(null);
    setFormData({});
    setCurrentStep(1);
  };

  // Manual save with immediate feedback
  const handleSaveAndExit = async () => {
    if (!typePrestation) return;

    try {
      setIsSaving(true);

      // Prepare draft data (clone formData to separate photos)
      const photoFields = ['photosAvant', 'photosApres', 'photoManometre', 'photosJaugesAvant', 'photosJaugesApres', 'photoTicket'];
      const formDataCopy: any = { ...formData };

      // Save photos as Blobs
      for (const field of photoFields) {
        if (Array.isArray(formDataCopy[field]) && formDataCopy[field].length > 0) {
          await savePhotoBlobs('intervention-draft', field, formDataCopy[field]);
          // Replace with metadata for indexedDB
          formDataCopy[field] = formDataCopy[field].map((f: File) => ({
            name: f.name,
            size: f.size,
            type: f.type,
          }));
        }
      }

      // Save draft
      const draft: DraftData = {
        id: 'intervention-draft',
        typePrestation,
        formData: formDataCopy,
        currentStep,
        timestamp: Date.now(),
      };

      await saveDraft(draft);

      toast.success('✅ Brouillon sauvegardé', {
        description: 'Vous pouvez reprendre cette intervention plus tard',
        duration: 1500,
      });

      confirmNavigation();
    } catch (error) {
      console.error('Error saving draft:', error);
      toast.error('❌ Erreur lors de la sauvegarde', {
        description: 'Veuillez réessayer',
        duration: 2500,
      });
    } finally {
      setIsSaving(false);
    }
  };

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
    console.log('🚀 handleSubmit called', {
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
      console.log('🚀 Starting intervention submission', {
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

      console.log('📤 Sending request to /api/interventions', {
        hasToken: !!token,
        formDataKeys: Array.from(formDataToSend.keys())
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

      if (response.ok) {
        console.log('✅ Intervention created successfully', {
          status: response.status,
          response: responseData
        });

        // Clear draft after successful submission
        await clearDraft();

        // Reset form state to prevent auto-save after submission
        setTypePrestation(null);
        setFormData({});
        setCurrentStep(1);

        // Haptic feedback succès
        triggerHaptic(HapticPattern.SUCCESS);

        alert('✅ Intervention enregistrée avec succès !');
        router.push('/');
      } else {
        const errorMessage = responseData?.error || `Erreur ${response.status}`;

        errorLogger.log('api_error', 'Submission failed', {
          status: response.status,
          error: responseData,
          fullResponse: responseText
        });

        // Haptic feedback erreur
        triggerHaptic(HapticPattern.ERROR);

        alert(`❌ ${errorMessage}`);
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error('Erreur:', error);

      errorLogger.log('network_error', 'Request failed completely', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });

      // Haptic feedback erreur critique
      triggerHaptic(HapticPattern.ERROR);

      alert('❌ Erreur de connexion. Vérifiez votre connexion internet.');
      setIsSubmitting(false);
    }
  };

  const steps = getSteps();

  return (
    <>
      {/* Navigation Guard Dialog */}
      <AlertDialog open={showNavigationDialog} onOpenChange={() => {}}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sauvegarder votre intervention ?</AlertDialogTitle>
            <AlertDialogDescription>
              Vous avez des modifications non sauvegardées. Que souhaitez-vous faire ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel onClick={cancelNavigation}>
              Rester sur la page
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSaveAndExit}
              disabled={isSaving}
              className="bg-primary hover:bg-primary/90"
            >
              {isSaving ? (
                <>🔄 Sauvegarde en cours...</>
              ) : (
                <>💾 Sauvegarder brouillon</>
              )}
            </AlertDialogAction>
            <AlertDialogAction
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isSaving}
              className="bg-destructive hover:bg-destructive/90"
            >
              Quitter sans sauvegarder
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>⚠️ Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous certain de vouloir quitter sans sauvegarder ? Toutes les données de cette intervention seront définitivement perdues.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowDeleteConfirm(false)}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                try {
                  // Delete draft and navigate
                  await clearDraft();

                  toast.info('🗑️ Brouillon supprimé', {
                    description: 'Les données ont été effacées',
                    duration: 2000,
                  });

                  setShowDeleteConfirm(false);
                  confirmNavigation();
                } catch (error) {
                  console.error('Error deleting draft:', error);
                  toast.error('❌ Erreur lors de la suppression', {
                    description: 'Veuillez réessayer',
                    duration: 2500,
                  });
                }
              }}
              className="bg-destructive hover:bg-destructive/90"
            >
              Oui, supprimer tout
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="min-h-screen bg-background flex flex-col md:flex-row pb-16">
        {/* Show DraftsList if no intervention started */}
        {showDraftsList && !typePrestation && (
          <div className="flex-1 p-4 md:p-8">
            <div className="max-w-3xl mx-auto">
              <DraftsList
                onResumeDraft={handleResumeDraft}
                onStartNew={handleStartNew}
              />
            </div>
          </div>
        )}

        {/* Show intervention form if started */}
        {!showDraftsList && (
          <>
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
          </>
        )}

        <BottomNav />
      </div>
    </>
  );
}
