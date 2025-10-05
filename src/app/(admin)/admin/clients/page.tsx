import { createClient } from '@/lib/supabase/server';
import { ClientsDataTable } from '@/components/admin/ClientsDataTable';
import { Card } from '@/components/ui/card';

/**
 * Page Admin - Gestion des clients
 *
 * CRUD complet des clients.
 * Accessible uniquement aux admins (RLS policy).
 */
export default async function AdminClientsPage() {
  const supabase = await createClient();

  // Fetch all clients (RLS policy allows admins to see all)
  const { data: clients, error } = await supabase
    .from('clients')
    .select('id, name, code, city, contact_name, contact_phone, is_active, created_at')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching clients:', error);
    return (
      <div className="p-8">
        <div className="text-destructive">
          Erreur lors du chargement des clients
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Gestion des Clients</h1>
        <p className="text-muted-foreground">
          Gérer les entreprises clientes
        </p>
      </div>

      <Card className="p-6">
        <ClientsDataTable data={clients || []} />
      </Card>
    </div>
  );
}
