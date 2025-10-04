'use client';

import Link from 'next/link';
import { BottomNav } from '@/components/mobile/BottomNav';
import { CompletionCard } from '@/components/dashboard/CompletionCard';
import { TaskList } from '@/components/dashboard/TaskList';
import { Plus, History } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function HomePage() {
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

        {/* Completion Card */}
        <CompletionCard />

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

        {/* Task List */}
        <TaskList />
      </div>
      <BottomNav />
    </>
  );
}
