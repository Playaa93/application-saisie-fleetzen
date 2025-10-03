'use client';

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { AppShell } from "@/components/mobile/AppShell";

interface Intervention {
  id: number;
  type: string;
  client: string;
  vehicule: string;
  kilometres: number | null;
  notes: string | null;
  creeLe: string;
  photos: { id: number; url: string; type: string }[];
}

export default function InterventionsPage() {
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/interventions')
      .then(res => res.json())
      .then(data => {
        setInterventions(data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Erreur:', error);
        setLoading(false);
      });
  }, []);

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      lavage: '🚿 Lavage',
      carburant: '⛽ Carburant',
      cuve: '🛢️ Remplissage Cuve',
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>Chargement...</p>
      </div>
    );
  }

  return (
    <AppShell>
      <div className="bg-background p-4">
        <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Interventions</h1>
          <Link
            href="/nouvelle-intervention"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            + Nouvelle
          </Link>
        </div>

        {interventions.length === 0 ? (
          <div className="bg-card rounded-lg border border-border p-8 text-center">
            <p className="text-muted-foreground mb-4">Aucune intervention enregistrée</p>
            <Link
              href="/nouvelle-intervention"
              className="inline-block bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:bg-primary/90"
            >
              Créer la première intervention
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {interventions.map((intervention) => (
              <div key={intervention.id} className="bg-card rounded-lg border border-border p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="text-lg font-semibold">
                      {getTypeLabel(intervention.type)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(intervention.creeLe).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                  <div>
                    <span className="text-muted-foreground">Client:</span>{' '}
                    <span className="font-medium">{intervention.client}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Véhicule:</span>{' '}
                    <span className="font-medium">{intervention.vehicule}</span>
                  </div>
                  {intervention.kilometres && (
                    <div>
                      <span className="text-muted-foreground">Km:</span>{' '}
                      <span className="font-medium">{intervention.kilometres}</span>
                    </div>
                  )}
                </div>

                {intervention.notes && (
                  <p className="text-sm text-foreground mb-3 italic">
                    {intervention.notes}
                  </p>
                )}

                {/* Photos */}
                {intervention.photos && intervention.photos.length > 0 && (
                  <div className="grid grid-cols-2 gap-2">
                    {intervention.photos.map((photo) => (
                      <div key={photo.id} className="relative h-32 rounded overflow-hidden border border-border">
                        <Image
                          src={photo.url}
                          alt={`Photo ${photo.type}`}
                          fill
                          className="object-cover"
                        />
                        {photo.type && (
                          <div className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                            {photo.type}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        </div>
      </div>
    </AppShell>
  );
}
