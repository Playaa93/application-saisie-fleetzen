import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Clock, Wrench, ArrowRight, CheckCircle } from 'lucide-react';
import Link from 'next/link';

interface Alert {
  id: string;
  type: 'danger' | 'warning' | 'success';
  icon: typeof AlertCircle;
  title: string;
  description: string;
  action?: {
    label: string;
    href: string;
  };
  count?: number;
}

interface AlertsCardProps {
  alerts: Alert[];
}

export function AlertsCard({ alerts }: AlertsCardProps) {
  const getAlertColor = (type: Alert['type']) => {
    switch (type) {
      case 'danger':
        return 'border-l-red-500 bg-red-50 dark:bg-red-950/10';
      case 'warning':
        return 'border-l-orange-500 bg-orange-50 dark:bg-orange-950/10';
      case 'success':
        return 'border-l-green-500 bg-green-50 dark:bg-green-950/10';
    }
  };

  const getIconColor = (type: Alert['type']) => {
    switch (type) {
      case 'danger':
        return 'text-red-600 dark:text-red-400';
      case 'warning':
        return 'text-orange-600 dark:text-orange-400';
      case 'success':
        return 'text-green-600 dark:text-green-400';
    }
  };

  const getBadgeVariant = (type: Alert['type']) => {
    switch (type) {
      case 'danger':
        return 'destructive' as const;
      case 'warning':
        return 'secondary' as const;
      case 'success':
        return 'default' as const;
    }
  };

  if (alerts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Alertes & Actions
          </CardTitle>
          <CardDescription>
            Aucune alerte nécessitant une action
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle className="h-12 w-12 text-green-600 mb-3" />
            <p className="text-sm font-medium">Tout est en ordre !</p>
            <p className="text-xs text-muted-foreground mt-1">
              Aucune action requise pour le moment
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          Alertes & Actions
        </CardTitle>
        <CardDescription>
          {alerts.length} action{alerts.length > 1 ? 's' : ''} recommandée{alerts.length > 1 ? 's' : ''}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {alerts.map((alert) => {
          const Icon = alert.icon;
          return (
            <div
              key={alert.id}
              className={`p-4 border-l-4 rounded-lg transition-all hover:shadow-md ${getAlertColor(alert.type)}`}
            >
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 ${getIconColor(alert.type)}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-sm">{alert.title}</p>
                    {alert.count !== undefined && (
                      <Badge variant={getBadgeVariant(alert.type)}>
                        {alert.count}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{alert.description}</p>
                  {alert.action && (
                    <Link href={alert.action.href}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2 w-full sm:w-auto"
                      >
                        {alert.action.label}
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
