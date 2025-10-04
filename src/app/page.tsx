'use client';

import { useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { BottomNav } from '@/components/mobile/BottomNav';
import { CompletionCard } from '@/components/dashboard/CompletionCard';
import { TaskList } from '@/components/dashboard/TaskList';
import { DraftsListHome } from '@/components/dashboard/DraftsListHome';
import { Plus, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { triggerHaptic, HapticPattern } from '@/utils/haptics';
import { usePullToRefreshPreference } from '@/hooks/usePullToRefreshPreference';

// Dynamically import PullToRefresh to avoid SSR issues
const PullToRefresh = dynamic(() => import('react-pull-to-refresh'), { ssr: false });

export default function HomePage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [pullToRefreshEnabled] = usePullToRefreshPreference();

  const handleRefresh = async () => {
    // Trigger light haptic feedback
    triggerHaptic(HapticPattern.LIGHT);

    // Force re-render of task lists
    setRefreshKey(prev => prev + 1);

    // Wait a bit for components to refresh
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Success haptic
    triggerHaptic(HapticPattern.SUCCESS);
  };

  const MainContent = () => (
    <div className="flex-1 p-4 space-y-4 max-w-6xl mx-auto pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tableau de bord</h1>
          <p className="text-sm text-muted-foreground">Gérez vos interventions</p>
        </div>
      </div>

      {/* Completion Card */}
      <CompletionCard key={`completion-${refreshKey}`} />

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/interventions/history">
          <Button variant="secondary" className="w-full h-auto flex-col gap-2 py-4">
            <History className="h-6 w-6" />
            <span>Historique</span>
          </Button>
        </Link>
        <Link href="/nouvelle-intervention">
          <Button className="w-full h-auto flex-col gap-2 py-4">
            <Plus className="h-6 w-6" />
            <span>Nouvelle intervention</span>
          </Button>
        </Link>
      </div>

      {/* À faire maintenant (interventions from database) */}
      <TaskList key={`tasks-${refreshKey}`} />

      {/* Brouillons (drafts from IndexedDB) */}
      <DraftsListHome key={`drafts-${refreshKey}`} />
    </div>
  );

  return (
    <>
      {pullToRefreshEnabled ? (
        <PullToRefresh onRefresh={handleRefresh}>
          <MainContent />
        </PullToRefresh>
      ) : (
        <MainContent />
      )}
      <BottomNav />
    </>
  );
}
