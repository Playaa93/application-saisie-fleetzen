'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { deleteAgent, reactivateAgent, permanentlyDeleteAgent } from '@/app/(admin)/admin/agents/actions';
import type { Agent } from './AgentsDataTable';
import { Loader2, AlertTriangle } from 'lucide-react';

interface AgentDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agent: Agent | null;
}

export function AgentDeleteDialog({ open, onOpenChange, agent }: AgentDeleteDialogProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [permanentDelete, setPermanentDelete] = useState(false);

  if (!agent) return null;

  // Réinitialiser le checkbox quand le dialog se ferme
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setPermanentDelete(false);
    }
    onOpenChange(isOpen);
  };

  const handleDelete = async () => {
    startTransition(async () => {
      try {
        // Si suppression définitive demandée
        if (permanentDelete) {
          const result = await permanentlyDeleteAgent(agent.id);

          if (result.error) {
            toast.error('Erreur', {
              description: result.error,
            });
            return;
          }

          toast.success('✅ Agent supprimé définitivement', {
            description: `${agent.first_name} ${agent.last_name} a été supprimé définitivement`,
          });

          handleOpenChange(false);
          router.refresh();
          return;
        }

        // Sinon, soft delete
        const result = await deleteAgent(agent.id);

        if (result.error) {
          toast.error('Erreur', {
            description: result.error,
          });
          return;
        }

        toast.success('✅ Agent désactivé avec succès', {
          description: `${agent.first_name} ${agent.last_name} a été désactivé`,
        });

        handleOpenChange(false);
        router.refresh();
      } catch (error) {
        console.error('Error deleting agent:', error);
        toast.error('Erreur inattendue');
      }
    });
  };

  const handleReactivate = async () => {
    startTransition(async () => {
      try {
        const result = await reactivateAgent(agent.id);

        if (result.error) {
          toast.error('Erreur', {
            description: result.error,
          });
          return;
        }

        toast.success('✅ Agent réactivé avec succès', {
          description: `${agent.first_name} ${agent.last_name} a été réactivé`,
        });

        handleOpenChange(false);
        router.refresh();
      } catch (error) {
        console.error('Error reactivating agent:', error);
        toast.error('Erreur inattendue');
      }
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {agent.is_active ? 'Désactiver cet agent ?' : 'Réactiver cet agent ?'}
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            {agent.is_active ? (
              <>
                <div>
                  Vous êtes sur le point de désactiver <strong>{agent.first_name} {agent.last_name}</strong> ({agent.email}).
                  <br /><br />
                  L'agent ne pourra plus se connecter, mais ses données seront conservées. Vous pourrez le réactiver plus tard.
                </div>

                {/* Option de suppression définitive */}
                <div className="flex items-start space-x-2 pt-4 border-t">
                  <Checkbox
                    id="permanent-delete"
                    checked={permanentDelete}
                    onCheckedChange={(checked) => setPermanentDelete(checked === true)}
                    disabled={isPending}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <Label
                      htmlFor="permanent-delete"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      Supprimer définitivement (irréversible)
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Cette action supprimera le compte et l'avatar de manière permanente.
                    </p>
                  </div>
                </div>

                {/* Avertissement si suppression définitive */}
                {permanentDelete && (
                  <div className="flex gap-2 p-3 bg-destructive/10 rounded-md border border-destructive/20">
                    <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
                    <div className="space-y-1 text-xs">
                      <p className="font-semibold text-destructive">Attention : Action irréversible</p>
                      <ul className="list-disc list-inside space-y-0.5 text-muted-foreground">
                        <li>Le compte auth sera supprimé</li>
                        <li>L'avatar sera supprimé du storage</li>
                        <li>L'agent ne pourra plus jamais se reconnecter</li>
                        <li>Les interventions seront conservées pour l'historique</li>
                      </ul>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                Vous êtes sur le point de réactiver <strong>{agent.first_name} {agent.last_name}</strong> ({agent.email}).
                <br /><br />
                L'agent pourra à nouveau se connecter et accéder à l'application.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              if (agent.is_active) {
                handleDelete();
              } else {
                handleReactivate();
              }
            }}
            disabled={isPending}
            className={agent.is_active ? 'bg-destructive hover:bg-destructive/90' : ''}
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {agent.is_active ? (permanentDelete ? 'Supprimer définitivement' : 'Désactiver') : 'Réactiver'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
