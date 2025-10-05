'use client';

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Calendar, User, Truck, FileText, Image as ImageIcon, MapPin, CheckCircle2, Navigation } from 'lucide-react';
import { MobileHeader } from '@/components/mobile/MobileHeader';
import { AppShell } from '@/components/mobile/AppShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatDateShort } from '@/lib/utils';
import { reverseGeocode, getGoogleMapsUrl, getWazeUrl } from '@/lib/geocoding';
import { InterventionMap } from '@/components/InterventionMap';
import { InterventionDetail } from '@/types/intervention';

export default function InterventionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [intervention, setIntervention] = useState<InterventionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [address, setAddress] = useState<string | null>(null);
  const [geocoding, setGeocoding] = useState(false);

  useEffect(() => {
    if (!params.id) return;

    // Utiliser la route API dédiée pour récupérer tous les détails
    fetch(`/api/interventions/${params.id}`)
      .then(res => {
        if (!res.ok) throw new Error('Intervention not found');
        return res.json();
      })
      .then((data: Intervention) => {
        setIntervention(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Erreur chargement intervention:', err);
        setIntervention(null);
        setLoading(false);
      });
  }, [params.id]);

  // Géocoder l'adresse quand l'intervention est chargée
  useEffect(() => {
    if (!intervention) return;

    const fetchAddress = async () => {
      setGeocoding(true);
      try {
        // Chercher coordonnées dans coordinates ou metadata
        const lat = intervention.coordinates?.latitude || intervention.metadata?.latitude;
        const lng = intervention.coordinates?.longitude || intervention.metadata?.longitude;

        if (lat && lng) {
          const addr = await reverseGeocode(parseFloat(lat), parseFloat(lng));
          setAddress(addr);
        }
      } catch (error) {
        console.error('Erreur géocodage:', error);
      } finally {
        setGeocoding(false);
      }
    };

    fetchAddress();
  }, [intervention]);

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { label: string; className: string }> = {
      draft: { label: 'Brouillon', className: 'bg-gray-100 text-gray-800' },
      in_progress: { label: 'En cours', className: 'bg-blue-100 text-blue-800' },
      completed: { label: 'Terminée', className: 'bg-green-100 text-green-800' },
      cancelled: { label: 'Annulée', className: 'bg-red-100 text-red-800' },
    };
    const badge = badges[status] || { label: status, className: 'bg-gray-100 text-gray-800' };
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badge.className}`}>
        {status === 'completed' && <CheckCircle2 className="w-3 h-3" />}
        {badge.label}
      </span>
    );
  };

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </AppShell>
    );
  }

  if (!intervention) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center min-h-screen gap-4">
          <p className="text-muted-foreground">Intervention introuvable</p>
          <button
            onClick={() => router.push('/interventions/history')}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour à la liste
          </button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <MobileHeader
        title="Détails intervention"
        backHref="/interventions/history"
      />

      <div className="p-4 space-y-4 pb-24">
        {/* Type, statut et date */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <CardTitle className="text-xl">{intervention.type}</CardTitle>
              {getStatusBadge(intervention.status)}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>
                {new Date(intervention.completedAt || intervention.createdAt).toLocaleDateString('fr-FR')} à {new Date(intervention.completedAt || intervention.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </CardHeader>
        </Card>

        {/* Agent */}
        {intervention.agent && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <User className="w-4 h-4" />
                Agent
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium">{intervention.agent}</p>
              {intervention.agentEmail && (
                <p className="text-sm text-muted-foreground">{intervention.agentEmail}</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Client */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="w-4 h-4" />
              Client
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium">{intervention.client}</p>
          </CardContent>
        </Card>

        {/* Véhicule */}
        {intervention.vehicule && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Truck className="w-4 h-4" />
                Véhicule
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium">{intervention.vehicule}</p>
              {intervention.vehicleCategory && (
                <p className="text-sm text-muted-foreground capitalize mt-1">
                  {intervention.vehicleCategory}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Métadonnées (données du formulaire) */}
        {intervention.metadata && Object.keys(intervention.metadata).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Détails de l'intervention
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(intervention.metadata)
                  .filter(([key, value]) => {
                    // Exclude GPS fields (already in map section)
                    if (['latitude', 'longitude', 'gpsAccuracy', 'gpsCapturedAt'].includes(key)) return false;
                    // Exclude vehicle fields (already in vehicle section)
                    if (['vehicle', 'vehicule', 'typeVehicule', 'vehicleCategory'].includes(key)) return false;
                    // Exclude empty/null values
                    if (value === null || value === '' || value === undefined) return false;
                    // Exclude photo objects (already displayed separately)
                    if (key.toLowerCase().includes('photo')) return false;
                    // Exclude siteAutre and clientAutre if empty
                    if ((key === 'siteAutre' || key === 'clientAutre') && !value) return false;
                    return true;
                  })
                  .map(([key, value]) => (
                    <div key={key} className="flex justify-between text-sm">
                      <span className="text-muted-foreground capitalize">
                        {key.replace(/_/g, ' ')}:
                      </span>
                      <span className="font-medium">{String(value)}</span>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Notes */}
        {intervention.notes && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{intervention.notes}</p>
            </CardContent>
          </Card>
        )}

        {/* Signatures */}
        {(intervention.clientSignature || intervention.agentSignature) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Signatures</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {intervention.clientSignature && (
                <div>
                  <p className="text-sm font-medium mb-2">Client</p>
                  <img
                    src={intervention.clientSignature}
                    alt="Signature client"
                    className="border border-border rounded-lg max-h-32"
                  />
                </div>
              )}
              {intervention.agentSignature && (
                <div>
                  <p className="text-sm font-medium mb-2">Agent</p>
                  <img
                    src={intervention.agentSignature}
                    alt="Signature agent"
                    className="border border-border rounded-lg max-h-32"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Photos MANOMETRE (pour livraison carburant) */}
        {intervention.metadata?.photos?.photoManometre && intervention.metadata.photos.photoManometre.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                Photo du manomètre ({intervention.metadata.photos.photoManometre.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {intervention.metadata.photos.photoManometre?.map((photo, index) => (
                  <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-border">
                    <img
                      src={photo.url}
                      alt={`Photo manomètre ${index + 1}`}
                      className="object-cover w-full h-full"
                    />
                    <div className="absolute bottom-2 left-2 bg-orange-600 text-white text-xs px-2 py-1 rounded">
                      MANOMÈTRE
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Photos AVANT */}
        {intervention.metadata?.photos?.photosAvant && intervention.metadata.photos.photosAvant.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                Photos AVANT ({intervention.metadata.photos.photosAvant.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {intervention.metadata.photos.photosAvant?.map((photo, index) => (
                  <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-border">
                    <img
                      src={photo.url}
                      alt={`Photo avant ${index + 1}`}
                      className="object-cover w-full h-full"
                    />
                    <div className="absolute bottom-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                      AVANT
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Photos APRÈS */}
        {intervention.metadata?.photos?.photosApres && intervention.metadata.photos.photosApres.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                Photos APRÈS ({intervention.metadata.photos.photosApres.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {intervention.metadata.photos.photosApres?.map((photo, index) => (
                  <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-border">
                    <img
                      src={photo.url}
                      alt={`Photo après ${index + 1}`}
                      className="object-cover w-full h-full"
                    />
                    <div className="absolute bottom-2 left-2 bg-green-600 text-white text-xs px-2 py-1 rounded">
                      APRÈS
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Photos JAUGES AVANT (Remplissage Cuve) */}
        {intervention.metadata?.photos?.photosJaugesAvant && intervention.metadata.photos.photosJaugesAvant.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                Photos des jauges AVANT ({intervention.metadata.photos.photosJaugesAvant.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {intervention.metadata.photos.photosJaugesAvant?.map((photo, index) => (
                  <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-border">
                    <img
                      src={photo.url}
                      alt={`Photo jauge avant ${index + 1}`}
                      className="object-cover w-full h-full"
                    />
                    <div className="absolute bottom-2 left-2 bg-purple-600 text-white text-xs px-2 py-1 rounded">
                      JAUGE AVANT
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Photos JAUGES APRÈS (Remplissage Cuve) */}
        {intervention.metadata?.photos?.photosJaugesApres && intervention.metadata.photos.photosJaugesApres.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                Photos des jauges APRÈS ({intervention.metadata.photos.photosJaugesApres.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {intervention.metadata.photos.photosJaugesApres?.map((photo, index) => (
                  <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-border">
                    <img
                      src={photo.url}
                      alt={`Photo jauge après ${index + 1}`}
                      className="object-cover w-full h-full"
                    />
                    <div className="absolute bottom-2 left-2 bg-pink-600 text-white text-xs px-2 py-1 rounded">
                      JAUGE APRÈS
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Photo TICKET (Remplissage Cuve) */}
        {intervention.metadata?.photos?.photoTicket && intervention.metadata.photos.photoTicket.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                Photo du ticket ({intervention.metadata.photos.photoTicket.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {intervention.metadata.photos.photoTicket?.map((photo, index) => (
                  <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-border">
                    <img
                      src={photo.url}
                      alt={`Photo ticket ${index + 1}`}
                      className="object-cover w-full h-full"
                    />
                    <div className="absolute bottom-2 left-2 bg-yellow-600 text-white text-xs px-2 py-1 rounded">
                      TICKET
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Localisation */}
        {((intervention.coordinates?.latitude && intervention.coordinates?.longitude) ||
          (intervention.metadata?.latitude && intervention.metadata?.longitude)) && (() => {
          // Extraire coordonnées GPS
          const lat = parseFloat(intervention.coordinates?.latitude || intervention.metadata?.latitude);
          const lng = parseFloat(intervention.coordinates?.longitude || intervention.metadata?.longitude);
          const accuracy = parseFloat(intervention.locationAccuracy || intervention.metadata?.gpsAccuracy || 0);

          return (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Localisation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Carte interactive */}
                <InterventionMap
                  latitude={lat}
                  longitude={lng}
                  address={address || undefined}
                  accuracy={accuracy || undefined}
                  className="h-48 w-full rounded-lg mb-3"
                />

                {/* Adresse géocodée */}
                {geocoding ? (
                  <p className="text-sm text-muted-foreground">Chargement de l'adresse...</p>
                ) : address ? (
                  <p className="text-sm font-medium">{address}</p>
                ) : (
                  <p className="text-sm">
                    {lat.toFixed(6)}, {lng.toFixed(6)}
                  </p>
                )}

                {/* Précision GPS */}
                {accuracy > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Précision: ±{accuracy.toFixed(1)}m
                  </p>
                )}

                {/* Boutons de navigation */}
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    asChild
                  >
                    <a
                      href={getGoogleMapsUrl(lat, lng)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Navigation className="w-4 h-4 mr-2" />
                      Google Maps
                    </a>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    asChild
                  >
                    <a
                      href={getWazeUrl(lat, lng)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Navigation className="w-4 h-4 mr-2" />
                      Waze
                    </a>
                  </Button>
                </div>

                {/* Coordonnées brutes en petit */}
                <p className="text-xs text-muted-foreground pt-2">
                  Coordonnées: {lat.toFixed(6)}, {lng.toFixed(6)}
                </p>
              </CardContent>
            </Card>
          );
        })()}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={() => router.push('/interventions/history')}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour à la liste
          </button>
        </div>
      </div>
    </AppShell>
  );
}
