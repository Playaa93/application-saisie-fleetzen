'use client';

import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { RefreshCw, Clock } from 'lucide-react';

interface LastContextCardProps {
  context: {
    typePrestation: string;
    client: string;
    siteTravail: string;
    timestamp: number;
  };
  isActive: boolean;
  onToggle: (value: boolean) => void;
}

export default function LastContextCard({ context, isActive, onToggle }: LastContextCardProps) {
  // Format timestamp to relative time
  const getRelativeTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);

    if (minutes < 1) return 'À l\'instant';
    if (minutes < 60) return `il y a ${minutes} min`;
    if (hours < 8) return `il y a ${hours}h`;
    return 'Expiré';
  };

  // Format prestation type for display
  const getPrestationLabel = (type: string) => {
    switch (type) {
      case 'lavage':
        return 'Lavage';
      case 'carburant-livraison':
        return 'Livraison Carburant';
      case 'carburant-cuve':
        return 'Remplissage Cuve';
      default:
        return type;
    }
  };

  return (
    <Card className={`mb-6 border-2 transition-colors ${isActive ? 'border-fleetzen-teal bg-fleetzen-teal/5' : 'border-border'}`}>
      <CardContent className="pt-6">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <RefreshCw className={`h-5 w-5 ${isActive ? 'text-fleetzen-teal' : 'text-muted-foreground'}`} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold mb-1">Reprendre dernière intervention</h3>
            <div className="space-y-1 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">
                {getPrestationLabel(context.typePrestation)} • {context.client}
              </p>
              <p>{context.siteTravail}</p>
              <div className="flex items-center gap-1 text-xs">
                <Clock className="h-3 w-3" />
                <span>{getRelativeTime(context.timestamp)}</span>
              </div>
            </div>
          </div>
          <div className="flex-shrink-0">
            <Switch
              checked={isActive}
              onCheckedChange={onToggle}
              aria-label="Utiliser ces informations"
            />
          </div>
        </div>
        {isActive && (
          <p className="mt-3 text-xs text-muted-foreground bg-fleetzen-teal/10 p-2 rounded">
            ✓ Le type de prestation, client et site seront pré-remplis automatiquement
          </p>
        )}
      </CardContent>
    </Card>
  );
}
