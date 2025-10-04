import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ClientSidebar } from '@/components/client/ClientSidebar';

/**
 * Client Layout - Protected route group
 *
 * Vérifie que l'utilisateur est un client (client_users).
 * Applique un layout desktop optimisé read-only.
 */
export default async function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  // Vérifier l'authentification
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/login');
  }

  // Vérifier que l'utilisateur est un client
  const { data: clientUser } = await supabase
    .from('client_users')
    .select('*, client:clients(name)')
    .eq('id', user.id)
    .single();

  if (!clientUser || !clientUser.is_active) {
    redirect('/'); // Rediriger si pas client ou inactif
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Layout with Sidebar */}
      <div className="flex">
        <ClientSidebar clientName={clientUser.client?.name || 'Client'} />

        {/* Main content */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
