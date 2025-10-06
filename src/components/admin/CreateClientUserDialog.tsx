'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { PlusCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Client {
  id: string;
  name: string;
}

export function CreateClientUserDialog() {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingClients, setLoadingClients] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    client_id: '',
  });

  const handleOpenChange = async (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen && clients.length === 0) {
      await fetchClients();
    }
  };

  const fetchClients = async () => {
    setLoadingClients(true);
    try {
      const res = await fetch('/api/clients?active=true&limit=100');
      if (res.ok) {
        const data = await res.json();
        // L'API retourne { success: true, clients: [...] }
        setClients(data.clients || []);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoadingClients(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/auth/register-client-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de la création');
      }

      toast({
        title: 'Utilisateur client créé',
        description: `Email de connexion envoyé à ${formData.email}`,
      });

      setFormData({
        email: '',
        password: '',
        full_name: '',
        client_id: '',
      });
      setOpen(false);
      router.refresh();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error.message || 'Impossible de créer l\'utilisateur client',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Nouvel utilisateur client
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Créer un utilisateur client</DialogTitle>
            <DialogDescription>
              Créer un accès client pour consulter les interventions et photos de sa flotte
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="client">Client *</Label>
              {loadingClients ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Chargement des clients...
                </div>
              ) : (
                <Select
                  value={formData.client_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, client_id: value })
                  }
                  required
                >
                  <SelectTrigger id="client">
                    <SelectValue placeholder="Sélectionner un client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="contact@entreprise.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="password">Mot de passe *</Label>
              <Input
                id="password"
                type="password"
                placeholder="Minimum 8 caractères"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                minLength={8}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="full_name">Nom complet (optionnel)</Label>
              <Input
                id="full_name"
                type="text"
                placeholder="Jean Dupont"
                value={formData.full_name}
                onChange={(e) =>
                  setFormData({ ...formData, full_name: e.target.value })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Créer l'utilisateur
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
