import Link from 'next/link';
import { BottomNav } from '@/components/mobile/BottomNav';
import { CompletionCard } from '@/components/dashboard/CompletionCard';
import { TaskList } from '@/components/dashboard/TaskList';
import { DraftsListHome } from '@/components/dashboard/DraftsListHome';
import { Plus, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getDashboardStats } from '@/lib/dal';

/**
 * Homepage - Server Component (Next.js 15 Best Practice)
 *
 * Data fetching happens server-side via DAL.
 * Auth is verified automatically in getDashboardStats().
 * No client-side data fetching = no 401 errors, no flash of unauthenticated content.
 */
export default async function HomePage() {
  // ✅ Auth verified automatically in DAL
  // ✅ Data fetched server-side
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
