'use client';

import { useEffect, useRef } from 'react';
import { saveDraft, getDraft, deleteDraft, type DraftData } from '@/lib/indexedDB';
import { useToast } from '@/hooks/use-toast';

/**
 * Hook to auto-save and restore form drafts using IndexedDB
 * PWA-compatible persistent storage
 */
export function useFormDraft<T = any>(
  draftId: string,
  typePrestation: string,
  formData: T,
  currentStep: number,
  onRestore: (draft: { typePrestation: string; formData: T; currentStep: number }) => void
) {
  const { toast } = useToast();
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasRestoredRef = useRef(false);
  const initialFormDataRef = useRef<string>(JSON.stringify(formData));

  // Auto-restore on mount
  useEffect(() => {
    if (hasRestoredRef.current) return;
    hasRestoredRef.current = true;

    const restoreDraft = async () => {
      try {
        const draft = await getDraft(draftId);

        if (draft && draft.formData) {
          // Only restore if there's actual data (not just empty form)
          const hasData = Object.keys(draft.formData).some(key => {
            const value = draft.formData[key];
            return value !== '' && value !== null && value !== undefined;
          });

          if (hasData) {
            onRestore({
              typePrestation: draft.typePrestation,
              formData: draft.formData as T,
              currentStep: draft.currentStep,
            });

            toast({
              title: 'Brouillon récupéré',
              description: 'Votre intervention en cours a été restaurée.',
              variant: 'default',
            });
          }
        }
      } catch (error) {
        console.warn('Erreur lors de la récupération du brouillon:', error);
        // Silent fail - IndexedDB might not be available
      }
    };

    restoreDraft();
  }, [draftId, onRestore, toast]);

  // Auto-save with debounce (2 seconds)
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
        const draft: DraftData = {
          id: draftId,
          typePrestation,
          formData,
          currentStep,
          timestamp: Date.now(),
        };

        await saveDraft(draft);
        console.log('✅ Brouillon sauvegardé automatiquement');
      } catch (error) {
        console.warn('Erreur lors de la sauvegarde du brouillon:', error);
        // Silent fail - IndexedDB might not be available
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
      console.log('✅ Brouillon supprimé après soumission');
    } catch (error) {
      console.warn('Erreur lors de la suppression du brouillon:', error);
    }
  };

  return { clearDraft };
}
