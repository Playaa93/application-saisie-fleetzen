'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  ClipboardList,
  ImageIcon,
  Truck,
  LogOut,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const navigation = [
  { name: 'Dashboard', href: '/client', icon: LayoutDashboard },
  { name: 'Interventions', href: '/client/interventions', icon: ClipboardList },
  { name: 'Photos', href: '/client/photos', icon: ImageIcon },
  { name: 'Ma flotte', href: '/client/vehicles', icon: Truck },
];

interface ClientSidebarProps {
  clientName: string;
}

export function ClientSidebar({ clientName }: ClientSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex w-64 border-r border-border flex-col bg-card">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <h1 className="text-2xl font-bold">FleetZen</h1>
        <p className="text-sm text-muted-foreground mt-1">Espace Client</p>
        <p className="text-xs font-medium mt-2 truncate">{clientName}</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <form action="/api/auth/logout" method="POST">
          <Button
            variant="ghost"
            className="w-full justify-start"
            type="submit"
          >
            <LogOut className="h-5 w-5 mr-3" />
            Déconnexion
          </Button>
        </form>
      </div>
    </aside>
  );
}
