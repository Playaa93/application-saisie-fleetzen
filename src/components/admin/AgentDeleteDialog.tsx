'use client';

import { useTransition } from 'react';
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
import { toast } from 'sonner';
import { deleteAgent, reactivateAgent } from '@/app/(admin)/admin/agents/actions';
import type { Agent } from './AgentsDataTable';
import { Loader2 } from 'lucide-react';

interface AgentDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agent: Agent | null;
}

export function AgentDeleteDialog({ open, onOpenChange, agent }: AgentDeleteDialogProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  if (!agent) return null;

  const handleDelete = async () => {
    startTransition(async () => {
      try {
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

        onOpenChange(false);
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

        onOpenChange(false);
        router.refresh();
      } catch (error) {
        console.error('Error reactivating agent:', error);
        toast.error('Erreur inattendue');
      }
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {agent.is_active ? 'Désactiver cet agent ?' : 'Réactiver cet agent ?'}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {agent.is_active ? (
              <>
                Vous êtes sur le point de désactiver <strong>{agent.first_name} {agent.last_name}</strong> ({agent.email}).
                <br /><br />
                L'agent ne pourra plus se connecter, mais ses données seront conservées. Vous pourrez le réactiver plus tard.
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
            {agent.is_active ? 'Désactiver' : 'Réactiver'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
