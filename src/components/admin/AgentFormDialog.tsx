'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { createAgent, updateAgent, type AgentFormData } from '@/app/(admin)/admin/agents/actions';
import type { Agent } from './AgentsDataTable';
import { Loader2 } from 'lucide-react';
import { AvatarUpload } from './AvatarUpload';

interface AgentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agent?: Agent | null; // Si fourni, mode édition
  mode: 'create' | 'edit';
}

export function AgentFormDialog({ open, onOpenChange, agent, mode }: AgentFormDialogProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [formData, setFormData] = useState<AgentFormData>({
    email: agent?.email || '',
    first_name: agent?.first_name || '',
    last_name: agent?.last_name || '',
    phone: agent?.phone || '',
    role: agent?.role || '',
    user_type: agent?.user_type || 'field_agent',
    is_active: agent?.is_active ?? true,
    password: '',
  });

  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email requis';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email invalide';
    }

    if (!formData.first_name.trim()) {
      newErrors.first_name = 'Prénom requis';
    }

    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Nom requis';
    }

    if (mode === 'create' && !formData.password) {
      newErrors.password = 'Mot de passe requis';
    }

    if (formData.password && formData.password.length < 6) {
      newErrors.password = 'Minimum 6 caractères';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    startTransition(async () => {
      try {
        if (mode === 'create') {
          const dataToSubmit: AgentFormData = {
            ...formData,
            avatar: avatarFile || undefined,
          };

          const result = await createAgent(dataToSubmit);

          if (result.error) {
            toast.error('Erreur', {
              description: result.error,
            });
            return;
          }

          toast.success('✅ Agent créé avec succès !');
        } else if (mode === 'edit' && agent) {
          const updateData: Partial<AgentFormData> = {
            email: formData.email,
            first_name: formData.first_name,
            last_name: formData.last_name,
            phone: formData.phone,
            role: formData.role,
            user_type: formData.user_type,
            is_active: formData.is_active,
          };

          // Ajouter le mot de passe seulement s'il est fourni
          if (formData.password) {
            updateData.password = formData.password;
          }

          // Ajouter l'avatar si un nouveau fichier est sélectionné
          if (avatarFile) {
            updateData.avatar = avatarFile;
          }

          const result = await updateAgent(agent.id, updateData);

          if (result.error) {
            toast.error('Erreur', {
              description: result.error,
            });
            return;
          }

          toast.success('✅ Agent modifié avec succès !');
        }

        onOpenChange(false);
        router.refresh();
      } catch (error) {
        console.error('Error submitting form:', error);
        toast.error('Erreur inattendue');
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Créer un agent' : 'Modifier l\'agent'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Créer un nouveau compte utilisateur (agent, admin ou super-admin)'
              : 'Modifier les informations de l\'agent'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => {
                setFormData({ ...formData, email: e.target.value });
                if (errors.email) setErrors({ ...errors, email: '' });
              }}
              className={errors.email ? 'border-red-500' : ''}
              disabled={isPending}
              required
            />
            {errors.email && (
              <p className="text-xs text-red-500">{errors.email}</p>
            )}
          </div>

          {/* Prénom */}
          <div className="space-y-2">
            <Label htmlFor="first_name">Prénom *</Label>
            <Input
              id="first_name"
              value={formData.first_name}
              onChange={(e) => {
                setFormData({ ...formData, first_name: e.target.value });
                if (errors.first_name) setErrors({ ...errors, first_name: '' });
              }}
              className={errors.first_name ? 'border-red-500' : ''}
              disabled={isPending}
              required
            />
            {errors.first_name && (
              <p className="text-xs text-red-500">{errors.first_name}</p>
            )}
          </div>

          {/* Nom */}
          <div className="space-y-2">
            <Label htmlFor="last_name">Nom *</Label>
            <Input
              id="last_name"
              value={formData.last_name}
              onChange={(e) => {
                setFormData({ ...formData, last_name: e.target.value });
                if (errors.last_name) setErrors({ ...errors, last_name: '' });
              }}
              className={errors.last_name ? 'border-red-500' : ''}
              disabled={isPending}
              required
            />
            {errors.last_name && (
              <p className="text-xs text-red-500">{errors.last_name}</p>
            )}
          </div>

          {/* Téléphone */}
          <div className="space-y-2">
            <Label htmlFor="phone">Téléphone</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              disabled={isPending}
              placeholder="+33 6 12 34 56 78"
            />
          </div>

          {/* Rôle */}
          <div className="space-y-2">
            <Label htmlFor="role">Rôle / Fonction</Label>
            <Input
              id="role"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              disabled={isPending}
              placeholder="Ex: Responsable d'exploitation"
            />
          </div>

          {/* Photo de profil */}
          <AvatarUpload
            label="Photo de profil"
            onPhotoCapture={(file) => setAvatarFile(file)}
            existingPhotoUrl={agent?.avatar_url || null}
            required={false}
          />

          {/* Type utilisateur */}
          <div className="space-y-2">
            <Label htmlFor="user_type">Type d'utilisateur *</Label>
            <Select
              value={formData.user_type}
              onValueChange={(value: 'field_agent' | 'admin' | 'super_admin') =>
                setFormData({ ...formData, user_type: value })
              }
              disabled={isPending}
            >
              <SelectTrigger id="user_type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="field_agent">Agent Terrain</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="super_admin">Super Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Mot de passe */}
          <div className="space-y-2">
            <Label htmlFor="password">
              {mode === 'create' ? 'Mot de passe *' : 'Nouveau mot de passe (optionnel)'}
            </Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => {
                setFormData({ ...formData, password: e.target.value });
                if (errors.password) setErrors({ ...errors, password: '' });
              }}
              className={errors.password ? 'border-red-500' : ''}
              disabled={isPending}
              placeholder={mode === 'edit' ? 'Laisser vide pour ne pas changer' : ''}
              required={mode === 'create'}
            />
            {errors.password && (
              <p className="text-xs text-red-500">{errors.password}</p>
            )}
            {mode === 'create' && (
              <p className="text-xs text-muted-foreground">Minimum 6 caractères</p>
            )}
          </div>

          {/* Statut actif */}
          <div className="flex items-center justify-between space-x-2 py-2">
            <Label htmlFor="is_active" className="cursor-pointer">
              Compte actif
            </Label>
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, is_active: checked })
              }
              disabled={isPending}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === 'create' ? 'Créer' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
