'use client';

import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function LogoutButton() {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.clear();
    document.cookie = 'sb-access-token=; path=/; max-age=0';
    router.push('/login');
  };

  return (
    <Button variant="outline" size="icon" onClick={handleLogout} title="Déconnexion">
      <LogOut className="h-5 w-5" />
    </Button>
  );
}
