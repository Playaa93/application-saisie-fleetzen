import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminMobileToggle } from '@/components/admin/AdminMobileToggle';

/**
 * Admin Layout - Protected route group
 *
 * Vérifie que l'utilisateur est admin ou super_admin.
 * Applique un layout desktop optimisé avec sidebar.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  // Vérifier l'authentification
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/login?redirect=/admin');
  }

  // Lire user_type depuis JWT custom claims (pas de SELECT = pas de récursion)
  const userType = user.app_metadata?.user_type;

  console.log('🔒 Admin Layout - Auth check:', {
    email: user.email,
    userType,
    isAdmin: ['admin', 'super_admin'].includes(userType || '')
  });

  if (!userType || !['admin', 'super_admin'].includes(userType)) {
    // Not an admin - redirect to field agent app
    console.log('❌ Not admin, redirecting to /');
    redirect('/');
  }

  console.log('✅ Admin access granted');

  return (
    <div className="min-h-screen bg-background">
      <div className="md:hidden border-b border-border bg-card">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex flex-col">
            <span className="text-base font-semibold">FleetZen</span>
            <span className="text-xs text-muted-foreground">Portail Admin</span>
          </div>
          <AdminMobileToggle />
        </div>
      </div>

      <div className="flex">
        <AdminSidebar />

        {/* Main content */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
