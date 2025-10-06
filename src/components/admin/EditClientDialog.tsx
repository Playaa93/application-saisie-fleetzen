'use client';

import { useState, useEffect, useOptimistic, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Building2, UserCheck, Loader2, PlusCircle, Trash2, Pencil, Save, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

/**
 * Schéma Zod pour la validation des données client
 */
const clientSchema = z.object({
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  code: z.string().nullable(),
  city: z.string().nullable(),
  contact_name: z.string().nullable(),
  contact_phone: z
    .string()
    .regex(/^[\d\s+()-]*$/, 'Format de téléphone invalide')
    .nullable(),
  is_active: z.boolean(),
});

type ClientFormData = z.infer<typeof clientSchema>;

interface Client {
  id: string;
  name: string;
  code: string | null;
  city: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  is_active: boolean;
}

interface ClientUser {
  id: string;
  email: string;
  full_name: string | null;
  is_active: boolean;
  created_at: string;
}

interface EditClientDialogProps {
  client: Client | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditClientDialog({ client, open, onOpenChange }: EditClientDialogProps) {
  const router = useRouter();
  const { toast } = useToast();

  // États pour l'édition du client
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();

  // État local du client pour optimistic updates
  const [localClient, setLocalClient] = useState(client);
  const [optimisticClient, setOptimisticClient] = useOptimistic(localClient);

  // États pour les utilisateurs
  const [clientUsers, setClientUsers] = useState<ClientUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [showUserForm, setShowUserForm] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);
  const [newUserData, setNewUserData] = useState({
    email: '',
    password: '',
    full_name: '',
  });

  // React Hook Form avec Zod validation
  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: client?.name || '',
      code: client?.code || '',
      city: client?.city || '',
      contact_name: client?.contact_name || '',
      contact_phone: client?.contact_phone || '',
      is_active: client?.is_active ?? true,
    },
  });

  // Synchroniser l'état local avec les props
  useEffect(() => {
    if (client) {
      setLocalClient(client);
    }
  }, [client]);

  // Reset form quand le client change
  useEffect(() => {
    if (localClient) {
      form.reset({
        name: localClient.name,
        code: localClient.code || '',
        city: localClient.city || '',
        contact_name: localClient.contact_name || '',
        contact_phone: localClient.contact_phone || '',
        is_active: localClient.is_active,
      });
      setIsEditing(false);
    }
  }, [localClient, form]);

  // Fetch client users
  useEffect(() => {
    if (open && client) {
      fetchClientUsers();
    }
  }, [open, client]);

  const fetchClientUsers = async () => {
    if (!client) return;

    setLoadingUsers(true);
    try {
      const res = await fetch(`/api/client-users?client_id=${client.id}`);
      if (res.ok) {
        const data = await res.json();
        setClientUsers(data.users || []);
      }
    } catch (error) {
      console.error('Error fetching client users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Submit form - Update client
  const onSubmit = async (data: ClientFormData) => {
    if (!localClient) return;

    startTransition(async () => {
      try {
        // Optimistic update (inside transition)
        const updatedClient = { ...localClient, ...data };
        setOptimisticClient(updatedClient);

        const res = await fetch(`/api/clients/${localClient.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        const result = await res.json();

        if (!res.ok) {
          // Rollback optimistic update
          setOptimisticClient(localClient);
          throw new Error(result.error || 'Erreur lors de la mise à jour');
        }

        // Mettre à jour l'état local avec les données du serveur
        setLocalClient(result.client);

        toast({
          title: 'Client mis à jour',
          description: 'Les informations ont été enregistrées avec succès',
        });

        setIsEditing(false);
        router.refresh();
      } catch (error: any) {
        toast({
          variant: 'destructive',
          title: 'Erreur',
          description: error.message || 'Impossible de mettre à jour le client',
        });
      }
    });
  };

  // Cancel edit
  const handleCancel = () => {
    if (localClient) {
      form.reset({
        name: localClient.name,
        code: localClient.code || '',
        city: localClient.city || '',
        contact_name: localClient.contact_name || '',
        contact_phone: localClient.contact_phone || '',
        is_active: localClient.is_active,
      });
    }
    setIsEditing(false);
  };

  // Create user
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!client) return;

    setCreatingUser(true);
    try {
      const res = await fetch('/api/auth/register-client-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newUserData,
          client_id: client.id,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de la création');
      }

      toast({
        title: 'Utilisateur créé',
        description: `Compte créé pour ${newUserData.email}`,
      });

      setNewUserData({ email: '', password: '', full_name: '' });
      setShowUserForm(false);
      fetchClientUsers();
      router.refresh();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error.message || 'Impossible de créer l\'utilisateur',
      });
    } finally {
      setCreatingUser(false);
    }
  };

  // Delete user
  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur ${userEmail} ?\n\nCette action est irréversible.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/client-users/${userId}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de la suppression');
      }

      toast({
        title: 'Utilisateur supprimé',
        description: `Le compte de ${userEmail} a été supprimé`,
      });

      fetchClientUsers();
      router.refresh();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error.message || 'Impossible de supprimer l\'utilisateur',
      });
    }
  };

  if (!localClient) return null;

  const displayClient = optimisticClient || localClient;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {displayClient.name}
          </DialogTitle>
          <DialogDescription>
            Code: {displayClient.code || '-'} | Ville: {displayClient.city || '-'}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="info">Informations</TabsTrigger>
            <TabsTrigger value="users">
              Utilisateurs ({clientUsers.length})
            </TabsTrigger>
          </TabsList>

          {/* ONGLET INFORMATIONS - MODE LECTURE/ÉDITION */}
          <TabsContent value="info" className="space-y-4">
            {!isEditing ? (
              // MODE LECTURE
              <>
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Modifier
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Nom</Label>
                    <p className="font-medium">{displayClient.name}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Code</Label>
                    <p className="font-medium font-mono text-sm">{displayClient.code || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Ville</Label>
                    <p className="font-medium">{displayClient.city || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Contact</Label>
                    <p className="font-medium">{displayClient.contact_name || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Téléphone</Label>
                    <p className="font-medium">{displayClient.contact_phone || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Statut</Label>
                    <Badge variant={displayClient.is_active ? 'default' : 'secondary'}>
                      {displayClient.is_active ? 'Actif' : 'Inactif'}
                    </Badge>
                  </div>
                </div>
              </>
            ) : (
              // MODE ÉDITION
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleCancel}
                      disabled={isPending}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Annuler
                    </Button>
                    <Button
                      type="submit"
                      size="sm"
                      disabled={isPending}
                    >
                      {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {!isPending && <Save className="h-4 w-4 mr-2" />}
                      Enregistrer
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nom *</FormLabel>
                          <FormControl>
                            <Input placeholder="Transport Vertigo" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="code"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Code</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="VERT-001"
                              {...field}
                              value={field.value || ''}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ville</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Paris"
                              {...field}
                              value={field.value || ''}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="contact_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contact</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Jules Martin"
                              {...field}
                              value={field.value || ''}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="contact_phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Téléphone</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="01 23 45 67 89"
                              {...field}
                              value={field.value || ''}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="is_active"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel>Statut</FormLabel>
                            <FormDescription>
                              Client actif dans le système
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </form>
              </Form>
            )}
          </TabsContent>

          {/* ONGLET UTILISATEURS (inchangé) */}
          <TabsContent value="users" className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                Gérer les utilisateurs ayant accès au portail client
              </p>
              {!showUserForm && (
                <Button size="sm" onClick={() => setShowUserForm(true)}>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Ajouter
                </Button>
              )}
            </div>

            {showUserForm && (
              <form onSubmit={handleCreateUser} className="border rounded-lg p-4 space-y-3 bg-muted/20">
                <h4 className="font-medium">Nouvel utilisateur</h4>
                <div className="grid gap-3">
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="contact@entreprise.com"
                      value={newUserData.email}
                      onChange={(e) =>
                        setNewUserData({ ...newUserData, email: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="password">Mot de passe *</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Minimum 8 caractères"
                      value={newUserData.password}
                      onChange={(e) =>
                        setNewUserData({ ...newUserData, password: e.target.value })
                      }
                      minLength={8}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="full_name">Nom complet (optionnel)</Label>
                    <Input
                      id="full_name"
                      type="text"
                      placeholder="Jean Dupont"
                      value={newUserData.full_name}
                      onChange={(e) =>
                        setNewUserData({ ...newUserData, full_name: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={creatingUser}>
                    {creatingUser && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Créer
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowUserForm(false);
                      setNewUserData({ email: '', password: '', full_name: '' });
                    }}
                    disabled={creatingUser}
                  >
                    Annuler
                  </Button>
                </div>
              </form>
            )}

            {loadingUsers ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : clientUsers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <UserCheck className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Aucun utilisateur pour ce client</p>
              </div>
            ) : (
              <div className="space-y-2">
                {clientUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{user.email}</p>
                      {user.full_name && (
                        <p className="text-sm text-muted-foreground">{user.full_name}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={user.is_active ? 'default' : 'secondary'}>
                        {user.is_active ? 'Actif' : 'Inactif'}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleDeleteUser(user.id, user.email)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
