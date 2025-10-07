'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { listDrafts, deleteDraft, deletePhotoBlobs, type DraftData } from '@/lib/indexedDB';
import { Trash2, PlayCircle, Clock, FileText, Image as ImageIcon, Truck } from 'lucide-react';
import { InterventionFormData } from '@/types/intervention';

interface DraftsListProps {
  onResumeDraft: (draft: DraftData) => void;
  onStartNew: () => void;
}

export default function DraftsList({ onResumeDraft, onStartNew }: DraftsListProps) {
  const [drafts, setDrafts] = useState<DraftData[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    loadDrafts();
  }, []);

  const loadDrafts = async () => {
    try {
      const allDrafts = await listDrafts();
      // Sort by timestamp descending (newest first)
      allDrafts.sort((a, b) => b.timestamp - a.timestamp);
      setDrafts(allDrafts);
    } catch (error) {
      console.error('Error loading drafts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (draftId: string) => {
    try {
      await deleteDraft(draftId);
      await deletePhotoBlobs(draftId);
      setDrafts(drafts.filter(d => d.id !== draftId));
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting draft:', error);
      toast.error('Erreur de suppression', {
        description: 'Le brouillon n\'a pas pu être supprimé',
        duration: 2500
      });
    }
  };

  const getInterventionLabel = (type: string) => {
    switch (type) {
      case 'lavage':
        return '🚛 Lavage Véhicule';
      case 'carburant-livraison':
        return '⛽ Livraison Carburant';
      case 'carburant-cuve':
        return '🛢️ Remplissage Cuve';
      case 'convoyage':
        return '🚗 Convoyage Véhicule';
      default:
        return type;
    }
  };

  const getStepLabel = (type: string, step: number) => {
    if (type === 'lavage') {
      const steps = ['Type de prestation', 'Prestation lavage', 'Renseignement clients', 'Photos', 'Validation'];
      return `Étape ${step}/${steps.length} - ${steps[step - 1] || ''}`;
    }
    if (type === 'carburant-livraison') {
      const steps = ['Type de prestation', 'Renseignement clients', 'Carburant livré', 'Photos', 'Validation'];
      return `Étape ${step}/${steps.length} - ${steps[step - 1] || ''}`;
    }
    if (type === 'carburant-cuve') {
      const steps = ['Type de prestation', 'Remplissage cuve', 'Validation'];
      return `Étape ${step}/${steps.length} - ${steps[step - 1] || ''}`;
    }
    if (type === 'convoyage') {
      const steps = ['Type de prestation', 'Donneur d\'ordre', 'Informations véhicule', 'Photos prise en charge', 'Validation'];
      return `Étape ${step}/${steps.length} - ${steps[step - 1] || ''}`;
    }
    return `Étape ${step}`;
  };

  const getTimeAgo = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `il y a ${days} jour${days > 1 ? 's' : ''}`;
    if (hours > 0) return `il y a ${hours} heure${hours > 1 ? 's' : ''}`;
    if (minutes > 0) return `il y a ${minutes} minute${minutes > 1 ? 's' : ''}`;
    return "à l'instant";
  };

  const countPhotos = (formData: InterventionFormData) => {
    let count = 0;
    const photoFields = ['photosAvant', 'photosApres', 'photoManometre', 'photosJaugesAvant', 'photosJaugesApres', 'photoTicket'] as const;
    photoFields.forEach(field => {
      const value = formData[field];
      if (Array.isArray(value)) {
        count += value.length;
      }
    });
    return count;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (drafts.length === 0) {
    return (
      <div className="text-center p-8">
        <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">Aucun brouillon</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Vous n'avez pas d'intervention en cours
        </p>
        <Button onClick={onStartNew}>
          Nouvelle intervention
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Brouillons en cours</h2>
          <p className="text-sm text-muted-foreground">
            {drafts.length} intervention{drafts.length > 1 ? 's' : ''} en attente
          </p>
        </div>
        <Button variant="outline" onClick={onStartNew}>
          + Nouvelle intervention
        </Button>
      </div>

      <div className="grid gap-4">
        {drafts.map((draft) => (
          <Card key={draft.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">
                    {getInterventionLabel(draft.typePrestation)}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2 text-xs">
                    <Clock className="h-3 w-3" />
                    {getTimeAgo(draft.timestamp)}
                  </CardDescription>
                </div>
                <Badge variant="secondary">
                  {getStepLabel(draft.typePrestation, draft.currentStep)}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              {/* Informations client/véhicule */}
              {(draft.formData?.client || draft.formData?.vehicule || draft.formData?.immatriculation) && (
                <div className="text-sm space-y-1">
                  {draft.formData.client && (
                    <div className="flex items-center gap-2">
                      <Truck className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Client:</span>
                      <span>{draft.formData.client}</span>
                    </div>
                  )}
                  {draft.formData.vehicule && typeof draft.formData.vehicule === 'string' && (
                    <div className="flex items-center gap-2 ml-6">
                      <span className="text-muted-foreground">Véhicule:</span>
                      <span className="font-mono">{draft.formData.vehicule}</span>
                    </div>
                  )}
                  {draft.formData.immatriculation && (
                    <div className="flex items-center gap-2 ml-6">
                      <span className="text-muted-foreground">Immatriculation:</span>
                      <span className="font-mono">{draft.formData.immatriculation}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Compteur photos */}
              {countPhotos(draft.formData) > 0 && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <ImageIcon className="h-4 w-4" />
                  <span>{countPhotos(draft.formData)} photo{countPhotos(draft.formData) > 1 ? 's' : ''}</span>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button
                  onClick={() => onResumeDraft(draft)}
                  className="flex-1"
                  size="sm"
                >
                  <PlayCircle className="h-4 w-4 mr-2" />
                  Reprendre
                </Button>
                <Button
                  onClick={() => setDeleteConfirm(draft.id)}
                  variant="outline"
                  size="sm"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dialog de confirmation de suppression */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce brouillon ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le brouillon et toutes les photos associées seront supprimés définitivement.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
              className="bg-destructive hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
