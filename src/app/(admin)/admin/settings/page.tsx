import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Settings, Shield, Database, Bell, Users } from 'lucide-react';

/**
 * Page Admin - Paramètres système
 *
 * Configuration globale de l'application.
 * Accessible uniquement aux super_admin.
 */
export default async function AdminSettingsPage() {
  const supabase = await createClient();

  // Fetch system stats
  const [
    { count: totalUsers },
    { count: totalInterventionTypes },
  ] = await Promise.all([
    supabase.from('agents').select('*', { count: 'exact', head: true }),
    supabase.from('intervention_types').select('*', { count: 'exact', head: true }),
  ]);

  const settingsSections = [
    {
      icon: Users,
      title: 'Utilisateurs & Permissions',
      description: 'Gérer les rôles et permissions (agents, admins, clients)',
      badge: `${totalUsers || 0} utilisateurs`,
      status: 'active' as const,
    },
    {
      icon: Database,
      title: 'Types d\'Interventions',
      description: 'Configurer les types d\'interventions disponibles',
      badge: `${totalInterventionTypes || 0} types`,
      status: 'active' as const,
    },
    {
      icon: Shield,
      title: 'Sécurité',
      description: 'Configuration RLS, JWT, rate limiting',
      badge: 'RLS activé',
      status: 'active' as const,
    },
    {
      icon: Bell,
      title: 'Notifications',
      description: 'Email, SMS, push notifications',
      badge: 'Bientôt disponible',
      status: 'coming_soon' as const,
    },
  ];

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Paramètres Système</h1>
        <p className="text-muted-foreground">
          Configuration globale de l'application
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {settingsSections.map((section) => {
          const Icon = section.icon;
          return (
            <Card key={section.title} className="p-6 hover:shadow-lg transition-shadow">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{section.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {section.description}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <Badge variant={section.status === 'active' ? 'default' : 'outline'}>
                    {section.badge}
                  </Badge>
                  {section.status === 'coming_soon' && (
                    <span className="text-xs text-muted-foreground">
                      Version future
                    </span>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Quick Stats */}
      <Card className="p-6 mt-8">
        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Informations Système
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-muted-foreground">Version App</p>
            <p className="text-2xl font-bold mt-1">1.0.0</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Framework</p>
            <p className="text-2xl font-bold mt-1">Next.js 15</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Base de données</p>
            <p className="text-2xl font-bold mt-1">Supabase</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
