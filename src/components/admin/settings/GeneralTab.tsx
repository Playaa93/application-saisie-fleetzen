'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Info, Server, Database, Code, Package } from 'lucide-react';

interface GeneralTabProps {
  stats: {
    totalUsers: number;
    totalInterventionTypes: number;
  };
}

export function GeneralTab({ stats }: GeneralTabProps) {
  const systemInfo = [
    {
      icon: Code,
      label: 'Version Application',
      value: '1.0.0',
      description: 'Version actuelle de FleetZen',
    },
    {
      icon: Package,
      label: 'Framework',
      value: 'Next.js 15.5.4',
      description: 'React 19 + App Router',
    },
    {
      icon: Database,
      label: 'Base de données',
      value: 'Supabase (PostgreSQL)',
      description: 'Hébergement cloud avec RLS',
    },
    {
      icon: Server,
      label: 'Environnement',
      value: process.env.NODE_ENV === 'production' ? 'Production' : 'Développement',
      description: 'Environnement d\'exécution actuel',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Informations système */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Informations Système
          </CardTitle>
          <CardDescription>
            Configuration et version de l'application
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {systemInfo.map((info) => {
            const Icon = info.icon;
            return (
              <div key={info.label} className="p-4 border rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-muted-foreground">
                      {info.label}
                    </p>
                    <p className="text-lg font-bold mt-1 truncate">
                      {info.value}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {info.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Statistiques rapides */}
      <Card>
        <CardHeader>
          <CardTitle>Statistiques Rapides</CardTitle>
          <CardDescription>
            Aperçu des données principales de l'application
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 border rounded-lg">
            <p className="text-sm text-muted-foreground">Utilisateurs</p>
            <p className="text-3xl font-bold mt-2">{stats.totalUsers}</p>
            <Badge variant="outline" className="mt-2">Agents + Admins</Badge>
          </div>
          <div className="p-4 border rounded-lg">
            <p className="text-sm text-muted-foreground">Types d'Interventions</p>
            <p className="text-3xl font-bold mt-2">{stats.totalInterventionTypes}</p>
            <Badge variant="outline" className="mt-2">Configurables</Badge>
          </div>
          <div className="p-4 border rounded-lg">
            <p className="text-sm text-muted-foreground">Base de données</p>
            <p className="text-3xl font-bold mt-2">✓</p>
            <Badge variant="default" className="mt-2">Connectée</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Licence */}
      <Card>
        <CardHeader>
          <CardTitle>Licence</CardTitle>
          <CardDescription>
            Informations sur la licence de l'application
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-sm">
              <strong>Propriétaire :</strong> FleetZen SAS
            </p>
            <p className="text-sm">
              <strong>Type :</strong> Licence commerciale propriétaire
            </p>
            <p className="text-sm text-muted-foreground">
              © 2025 FleetZen. Tous droits réservés.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
