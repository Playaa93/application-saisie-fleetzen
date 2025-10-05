import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { BottomNav } from '@/components/mobile/BottomNav';
import { CompletionCard } from '@/components/dashboard/CompletionCard';
import { TaskList } from '@/components/dashboard/TaskList';
import { DraftsListHome } from '@/components/dashboard/DraftsListHome';
import { WelcomeHero } from '@/components/dashboard/WelcomeHero';
import { Plus, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getDashboardStats } from '@/lib/dal';

/**
 * Homepage - Server Component (Next.js 15 Best Practice)
 *
 * Default landing page for field agents.
 * Role-based redirects happen in layout files to prevent redirect loops.
 */
export default async function HomePage() {
  const supabase = await createClient();

  // Check authentication
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Field agent homepage - show mobile app interface
  // Note: Admin and client redirects are handled in their respective layout.tsx files
  // This prevents redirect loops during navigation

  // ✅ Field agent - show mobile app
  // Get agent name from database
  const { data: agent } = await supabase
    .from('agents')
    .select('first_name, last_name')
    .eq('id', user.id)
    .single();

  const agentName = agent
    ? `${agent.first_name} ${agent.last_name}`.trim()
    : user.email?.split('@')[0] || 'Agent';

  // Fetch dashboard stats with RLS verification
  const { stats, tasksToday } = await getDashboardStats();

  return (
    <>
      <div className="flex-1 p-4 space-y-4 max-w-6xl mx-auto pb-20">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Tableau de bord</h1>
            <p className="text-sm text-muted-foreground">Gérez vos interventions</p>
          </div>
        </div>

        {/* Welcome Hero - personalized greeting with weather */}
        <WelcomeHero name={agentName} />

        {/* Completion Card - receives pre-authenticated data */}
        <CompletionCard stats={stats} />

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Button variant="secondary" className="w-full h-auto flex-col gap-2 py-4" asChild>
            <Link href="/interventions/history">
              <History className="h-6 w-6" />
              <span>Historique</span>
            </Link>
          </Button>
          <Button className="w-full h-auto flex-col gap-2 py-4" asChild>
            <Link href="/nouvelle-intervention">
              <Plus className="h-6 w-6" />
              <span>Nouvelle intervention</span>
            </Link>
          </Button>
        </div>

        {/* À faire maintenant - receives pre-authenticated data */}
        <TaskList tasks={tasksToday} />

        {/* Brouillons (drafts from IndexedDB) - client-side only */}
        <DraftsListHome />
      </div>
      <BottomNav />
    </>
  );
}
