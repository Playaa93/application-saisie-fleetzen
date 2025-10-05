"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, MapPin, Car, Building2, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface LastInterventionCardProps {
  intervention: {
    id: string;
    type: string;
    createdAt: string;
    siteTravail: string | null;
    client: {
      id: string;
      name: string;
    } | null;
    vehicle: {
      id: string;
      license_plate: string;
      brand: string;
      model: string;
    } | null;
  } | null;
}

/**
 * LastInterventionCard - Client Component
 *
 * Displays the last completed intervention with "Resume" button.
 * Stores context in localStorage for Step1TypePrestation auto-fill.
 *
 * @see src/lib/dal.ts - Data fetched server-side via getLastCompletedIntervention()
 */
export function LastInterventionCard({ intervention }: LastInterventionCardProps) {
  const router = useRouter();

  if (!intervention) {
    return null;
  }

  // Format date
  const formattedDate = new Date(intervention.createdAt).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit'
  });

  // Map intervention type to typePrestation
  const getTypePrestation = (type: string) => {
    if (type.toLowerCase().includes('lavage')) return 'lavage';
    if (type.toLowerCase().includes('livraison')) return 'carburant-livraison';
    if (type.toLowerCase().includes('cuve')) return 'carburant-cuve';
    return 'lavage'; // Default
  };

  const handleResume = () => {
    try {
      // Save context for next intervention (8 hours expiry)
      const context = {
        typePrestation: getTypePrestation(intervention.type),
        clientId: intervention.client?.id,
        client: intervention.client,
        siteTravail: intervention.siteTravail,
        vehicleId: intervention.vehicle?.id,
        timestamp: Date.now(),
        expiresAt: Date.now() + (8 * 60 * 60 * 1000)
      };

      localStorage.setItem('last-intervention-context', JSON.stringify(context));

      toast.success('📋 Contexte chargé', {
        description: 'Formulaire pré-rempli avec les données précédentes',
        duration: 2000
      });

      router.push('/nouvelle-intervention');
    } catch (error) {
      console.error('Error saving context:', error);
      toast.error('Erreur lors du chargement', {
        description: 'Veuillez réessayer',
        duration: 2000
      });
    }
  };

  return (
    <Card className="border-border/40">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          Dernière intervention
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Type & Date */}
        <div className="flex items-start justify-between">
          <div>
            <p className="font-medium text-sm">{intervention.type}</p>
            <p className="text-xs text-muted-foreground">{formattedDate}</p>
          </div>
        </div>

        {/* Details */}
        <div className="space-y-2 text-sm">
          {intervention.client && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Building2 className="h-4 w-4 shrink-0" />
              <span className="truncate">{intervention.client.name}</span>
            </div>
          )}

          {intervention.siteTravail && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4 shrink-0" />
              <span className="truncate">{intervention.siteTravail}</span>
            </div>
          )}

          {intervention.vehicle && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Car className="h-4 w-4 shrink-0" />
              <span className="truncate">
                {intervention.vehicle.license_plate} - {intervention.vehicle.brand} {intervention.vehicle.model}
              </span>
            </div>
          )}
        </div>

        {/* Resume Button */}
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={handleResume}
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Reprendre avec ces paramètres
        </Button>
      </CardContent>
    </Card>
  );
}
