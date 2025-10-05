'use client';

import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { saveDraft, getDraft, deleteDraft, savePhotoBlobs, getPhotoBlobs, deletePhotoBlobs, type DraftData } from '@/lib/indexedDB';
import { InterventionFormData } from '@/types/intervention';

/**
 * Hook to auto-save form drafts (NO AUTO-RESTORE)
 * PWA-compatible persistent storage with photo support
 */
export function useFormDraft<T extends InterventionFormData = InterventionFormData>(
  draftId: string,
  typePrestation: string,
  formData: T,
  currentStep: number
) {
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initialFormDataRef = useRef<string>(JSON.stringify(formData));

  // Auto-save with debounce (2 seconds) + photos
  useEffect(() => {
    // Don't save if form is empty or unchanged
    const currentFormDataStr = JSON.stringify(formData);
    if (currentFormDataStr === initialFormDataRef.current) return;

    // Clear previous timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout for auto-save
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        // Separate photos from formData
        const photoFields = ['photosAvant', 'photosApres', 'photoManometre', 'photosJaugesAvant', 'photosJaugesApres', 'photoTicket'] as const;
        const formDataCopy: T = { ...formData };

        // Save photos separately and remove from formData copy
        for (const field of photoFields) {
          if (Array.isArray(formDataCopy[field]) && formDataCopy[field].length > 0) {
            // Save photos as blobs
            await savePhotoBlobs(draftId, field, formDataCopy[field]);
            // Replace with metadata for indexedDB
            formDataCopy[field] = formDataCopy[field].map((f: File) => ({
              name: f.name,
              size: f.size,
              type: f.type,
            }));
          }
        }

        const draft: DraftData = {
          id: draftId,
          typePrestation,
          formData: formDataCopy,
          currentStep,
          timestamp: Date.now(),
        };

        await saveDraft(draft);

        console.log('✅ Brouillon sauvegardé automatiquement (avec photos)');
      } catch (error) {
        console.warn('Erreur lors de la sauvegarde du brouillon:', error);

        // Show error toast for auto-save failures
        toast.error('Échec de la sauvegarde automatique', {
          description: 'Vos données peuvent ne pas être sauvegardées',
          duration: 3000,
        });
      }
    }, 2000); // 2 seconds debounce

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [draftId, typePrestation, formData, currentStep]);

  // Delete draft (call this after successful submission)
  const clearDraft = async () => {
    try {
      await deleteDraft(draftId);
      await deletePhotoBlobs(draftId);
      console.log('✅ Brouillon supprimé après soumission');
    } catch (error) {
      console.warn('Erreur lors de la suppression du brouillon:', error);
    }
  };

  // Load draft manually (called from DraftsList)
  const loadDraft = async (draftIdToLoad: string): Promise<{ typePrestation: string; formData: T; currentStep: number } | null> => {
    try {
      const draft = await getDraft(draftIdToLoad);
      if (!draft) return null;

      // Restore photos from blobs
      const photoBlobs = await getPhotoBlobs(draftIdToLoad);
      const restoredFormData = { ...draft.formData, ...photoBlobs };

      return {
        typePrestation: draft.typePrestation,
        formData: restoredFormData as T,
        currentStep: draft.currentStep,
      };
    } catch (error) {
      console.error('Erreur lors du chargement du brouillon:', error);
      return null;
    }
  };

  return { clearDraft, loadDraft };
}
