'use client';

export const dynamic = 'force-dynamic'

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function InterventionsPage() {
  const router = useRouter();

  useEffect(() => {
    // Rediriger automatiquement vers /interventions/history
    router.replace('/interventions/history');
  }, [router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <p>Redirection...</p>
    </div>
  );
}
