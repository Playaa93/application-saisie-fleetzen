'use client';

import { useState, useEffect } from 'react';
import PhotoUploadMultiple from '@/components/PhotoUploadMultiple';
import SearchableCombobox from '@/components/SearchableCombobox';
import { AddVehicleDialog } from '@/components/AddVehicleDialog';

interface CarburantLivraisonStepsProps {
  currentStep: number;
  formData: any;
  onNext: (data: any) => void;
  onPrevious: () => void;
  onSubmit: (data: any) => void;
  isSubmitting?: boolean;
}

interface Client {
  id: string;
  name: string;
  code: string;
}

interface Vehicle {
  id: string;
  license_plate: string;
  make: string;
  model: string;
  work_site?: string;
  vehicle_category?: string;
}

export default function CarburantLivraisonSteps({ currentStep, formData, onNext, onPrevious, onSubmit }: CarburantLivraisonStepsProps) {
  const [data, setData] = useState(formData);
  const [clients, setClients] = useState<Client[]>([]);
  const [sites, setSites] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  const [loadingClients, setLoadingClients] = useState(true);
  const [loadingSites, setLoadingSites] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingVehicles, setLoadingVehicles] = useState(false);

  const [showAddVehicleDialog, setShowAddVehicleDialog] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Synchroniser data avec formData seulement au changement de step
  useEffect(() => {
    console.log('📝 Syncing formData to data on step change', { formData, currentStep });
    setData(prevData => ({ ...prevData, ...formData }));
  }, [currentStep]);

  // Charger les clients depuis Supabase
  useEffect(() => {
    console.log('🌍 Fetching clients from API...');
    const fetchClients = async () => {
      try {
        const response = await fetch('/api/clients');
        const result = await response.json();
        console.log('✅ Clients fetched:', result);
        if (result.success) {
          setClients(result.clients);
        }
      } catch (error) {
        console.error('❌ Error fetching clients:', error);
      } finally {
        setLoadingClients(false);
      }
    };
    fetchClients();
  }, []);

  // CASCADE 1: Charger les sites quand un client est sélectionné
  useEffect(() => {
    if (data.clientId) {
      setLoadingSites(true);
      const fetchSites = async () => {
        try {
          const response = await fetch(`/api/sites?clientId=${data.clientId}`);
          const result = await response.json();
          if (result.success) {
            setSites([...result.sites, 'Autre']);
          }
        } catch (error) {
          console.error('Error fetching sites:', error);
          setSites(['Autre']);
        } finally {
          setLoadingSites(false);
        }
      };
      fetchSites();
      setData(prev => ({ ...prev, siteTravail: '', siteAutre: '', typeVehicule: '', vehicleId: null }));
      setCategories([]);
      setVehicles([]);
    } else {
      setSites([]);
      setCategories([]);
      setVehicles([]);
    }
  }, [data.clientId]);

  // CASCADE 2: Charger les catégories quand client + site sont sélectionnés
  useEffect(() => {
    if (data.clientId && data.siteTravail && data.siteTravail !== 'Autre') {
      setLoadingCategories(true);
      const fetchCategories = async () => {
        try {
          const response = await fetch(`/api/vehicle-categories?clientId=${data.clientId}&site=${data.siteTravail}`);
          const result = await response.json();
          if (result.success) {
            const capitalizedCategories = result.categories.map((cat: string) =>
              cat.charAt(0).toUpperCase() + cat.slice(1)
            );
            setCategories([...capitalizedCategories, 'Autre']);
          }
        } catch (error) {
          console.error('Error fetching categories:', error);
          setCategories(['Autre']);
        } finally {
          setLoadingCategories(false);
        }
      };
      fetchCategories();
      setData(prev => ({ ...prev, typeVehicule: '', vehicleId: null }));
      setVehicles([]);
    } else {
      setCategories([]);
      setVehicles([]);
    }
  }, [data.clientId, data.siteTravail]);

  // CASCADE 3: Charger les véhicules quand client + site + catégorie sont sélectionnés
  useEffect(() => {
    if (data.clientId && data.siteTravail && data.siteTravail !== 'Autre' && data.typeVehicule && data.typeVehicule !== 'Autre') {
      setLoadingVehicles(true);
      const fetchVehicles = async () => {
        try {
          const response = await fetch(`/api/vehicles?clientId=${data.clientId}&site=${data.siteTravail}&category=${data.typeVehicule}`);
          const result = await response.json();
          if (result.success) {
            setVehicles(result.vehicles);
          }
        } catch (error) {
          console.error('Error fetching vehicles:', error);
          setVehicles([]);
        } finally {
          setLoadingVehicles(false);
        }
      };
      fetchVehicles();
      setData(prev => ({ ...prev, vehicleId: null, vehicle: '' }));
    } else {
      setVehicles([]);
    }
  }, [data.clientId, data.siteTravail, data.typeVehicule]);

  // Étape 1: Renseignement clients
  if (currentStep === 1) {
    const clientOptions = [...clients.map(c => `${c.name} (${c.code})`), 'Autre'];
    const isIntermarche = data.clientId === 'bfa6a081-34bf-4b8c-a425-e6b681a40355';
    const vehicleOptions = [
      ...vehicles.map(v => {
        const vehicleType = v.metadata?.vehicle_type || '';
        const numero = v.metadata?.numero;

        if (isIntermarche && v.vehicle_category === 'remorque' && numero) {
          return vehicleType ? `${numero} (${vehicleType})` : numero;
        }

        return vehicleType ? `${v.license_plate} (${vehicleType})` : v.license_plate;
      }),
      'Autre'
    ];

    const selectedClient = clients.find(c => c.id === data.clientId);

    return (
      <div className="bg-card rounded-lg border border-border shadow-lg p-6 md:p-8">
        <h2 className="text-2xl font-bold mb-6">Renseignement clients</h2>
        <form onSubmit={(e) => { e.preventDefault(); onNext(data); }} className="space-y-6">
          <SearchableCombobox
            label="Client"
            options={clientOptions}
            value={data.client || ''}
            onChange={(value) => {
              const selectedClient = clients.find(c => `${c.name} (${c.code})` === value);
              setData(prev => ({
                ...prev,
                client: value,
                clientId: selectedClient?.id || null,
                clientAutre: value === 'Autre' ? prev.clientAutre : '',
              }));
            }}
            placeholder={loadingClients ? "Chargement..." : "Sélectionnez un client"}
            required
          />
          {data.client === 'Autre' && (
            <div>
              <label className="block text-sm font-medium mb-2">Précisez le client *</label>
              <input
                type="text"
                value={data.clientAutre || ''}
                onChange={(e) => setData(prev => ({ ...prev, clientAutre: e.target.value }))}
                className="w-full p-3 border rounded-lg"
                placeholder="Nom du client"
                required
              />
            </div>
          )}

          {data.clientId && (
            <SearchableCombobox
              label="Site de travail"
              options={sites}
              value={data.siteTravail || ''}
              onChange={(value) => setData(prev => ({ ...prev, siteTravail: value, siteAutre: value === 'Autre' ? prev.siteAutre : '' }))}
              placeholder={loadingSites ? "Chargement..." : sites.length === 1 ? "Aucun site référencé" : "Sélectionnez un site"}
              required
              disabled={loadingSites}
            />
          )}
          {data.siteTravail === 'Autre' && (
            <div>
              <label className="block text-sm font-medium mb-2">Précisez le site *</label>
              <input
                type="text"
                value={data.siteAutre || ''}
                onChange={(e) => setData(prev => ({ ...prev, siteAutre: e.target.value }))}
                className="w-full p-3 border rounded-lg"
                placeholder="Nom du site"
                required
              />
            </div>
          )}

          {data.clientId && data.siteTravail && data.siteTravail !== 'Autre' && (
            <SearchableCombobox
              label="Type de véhicule"
              options={categories}
              value={data.typeVehicule || ''}
              onChange={(value) => setData(prev => ({ ...prev, typeVehicule: value }))}
              placeholder={loadingCategories ? "Chargement..." : categories.length === 1 ? "Aucun type référencé" : "Sélectionnez un type"}
              required
              disabled={loadingCategories}
            />
          )}

          {data.clientId && data.siteTravail && data.siteTravail !== 'Autre' && data.typeVehicule && data.typeVehicule !== 'Autre' && (
            <div>
              <SearchableCombobox
                label="Immatriculation"
                options={vehicleOptions}
                value={data.vehicle || ''}
                onChange={(value) => {
                  if (value === 'Autre') {
                    setShowAddVehicleDialog(true);
                  } else {
                    const selectedVehicle = vehicles.find(v => {
                      const vehicleType = v.metadata?.vehicle_type || '';
                      const displayValue = vehicleType ? `${v.license_plate} (${vehicleType})` : v.license_plate;
                      return displayValue === value;
                    });
                    setData(prev => ({
                      ...prev,
                      vehicle: value,
                      vehicleId: selectedVehicle?.id || null
                    }));
                  }
                }}
                placeholder={loadingVehicles ? "Chargement..." : vehicles.length === 0 ? "Aucun véhicule" : "Sélectionnez un véhicule"}
                required
                disabled={loadingVehicles}
              />
              {vehicles.length === 0 && !loadingVehicles && (
                <p className="text-sm text-amber-600 dark:text-amber-500 mt-1">
                  ⚠️ Aucun véhicule trouvé. Sélectionnez "Autre" pour en ajouter un.
                </p>
              )}
            </div>
          )}

          <div className="flex gap-4">
            <button type="button" onClick={onPrevious} className="px-6 py-3 border rounded-lg">← Retour</button>
            <button type="submit" className="flex-1 bg-primary text-primary-foreground py-3 rounded-lg hover:bg-primary/90">Suivant →</button>
          </div>
        </form>

        {selectedClient && data.siteTravail && data.siteTravail !== 'Autre' && data.typeVehicule && data.typeVehicule !== 'Autre' && (
          <AddVehicleDialog
            open={showAddVehicleDialog}
            onOpenChange={setShowAddVehicleDialog}
            prefilledClientId={data.clientId}
            prefilledClientName={selectedClient.name}
            prefilledSite={data.siteTravail}
            prefilledCategory={data.typeVehicule}
            onVehicleCreated={(newVehicle) => {
              setVehicles(prev => [...prev, newVehicle]);
              const vehicleType = newVehicle.metadata?.vehicle_type || '';
              const displayValue = vehicleType ? `${newVehicle.license_plate} (${vehicleType})` : newVehicle.license_plate;
              setData(prev => ({
                ...prev,
                vehicle: displayValue,
                vehicleId: newVehicle.id
              }));
            }}
            onVehicleLink={(linkedVehicle) => {
              setVehicles(prev => [...prev, linkedVehicle]);
              const vehicleType = linkedVehicle.metadata?.vehicle_type || '';
              const displayValue = vehicleType ? `${linkedVehicle.license_plate} (${vehicleType})` : linkedVehicle.license_plate;
              setData(prev => ({
                ...prev,
                vehicle: displayValue,
                vehicleId: linkedVehicle.id
              }));
            }}
          />
        )}
      </div>
    );
  }

  // Étape 2: Photo compteur AVANT
  if (currentStep === 2) {
    const validatePhotoAvant = () => {
      const newErrors: Record<string, string> = {};

      if (!data.photoCompteurAvant || data.photoCompteurAvant.length === 0) {
        newErrors.photoCompteurAvant = 'Au moins 1 photo du compteur avant requise';
      }

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    };

    const handleNext = (e: React.FormEvent) => {
      e.preventDefault();
      if (validatePhotoAvant()) {
        setErrors({});
        onNext(data);
      }
    };

    const isValid = !data.photoCompteurAvant || data.photoCompteurAvant.length === 0;

    return (
      <div className="bg-card rounded-lg border border-border shadow-lg p-6 md:p-8">
        <h2 className="text-2xl font-bold mb-6">Photo compteur AVANT remplissage</h2>
        <form onSubmit={handleNext} className="space-y-6">
          <PhotoUploadMultiple
            label="Photo compteur véhicule AVANT"
            helperText="Prenez une photo de la jauge du compteur avant le remplissage"
            maxFiles={5}
            onChange={(files) => {
              setData({ ...data, photoCompteurAvant: files });
              if (files.length > 0 && errors.photoCompteurAvant) {
                setErrors({ ...errors, photoCompteurAvant: '' });
              }
            }}
            value={data.photoCompteurAvant}
            required
            error={errors.photoCompteurAvant}
          />
          <div className="flex gap-4">
            <button type="button" onClick={onPrevious} className="px-6 py-3 border rounded-lg">← Retour</button>
            <button
              type="submit"
              className="flex-1 bg-fleetzen-teal text-white py-3 rounded-lg hover:bg-fleetzen-teal-dark disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isValid}
            >
              Suivant →
            </button>
          </div>
        </form>
      </div>
    );
  }

  // Étape 3: Carburant livré
  if (currentStep === 3) {
    const validateCarburant = () => {
      const newErrors: Record<string, string> = {};

      if (!data.typeCarburant) {
        newErrors.typeCarburant = 'Type de carburant requis';
      }

      if (!data.photoManometre || data.photoManometre.length === 0) {
        newErrors.photoManometre = 'Photo du manomètre requise';
      }

      if (!data.quantiteLivree || parseFloat(data.quantiteLivree) <= 0) {
        newErrors.quantiteLivree = 'Quantité livrée requise';
      }

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    };

    const handleNext = (e: React.FormEvent) => {
      e.preventDefault();
      if (validateCarburant()) {
        setErrors({});
        onNext(data);
      }
    };

    const isValid = !data.typeCarburant || (!data.photoManometre || data.photoManometre.length === 0) || !data.quantiteLivree || parseFloat(data.quantiteLivree) <= 0;

    return (
      <div className="bg-card rounded-lg border border-border shadow-lg p-6 md:p-8">
        <h2 className="text-2xl font-bold mb-6">Carburant livré</h2>
        <form onSubmit={handleNext} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">
              Type de carburant <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              {['Diesel', 'AdBlue', 'GNR'].map(type => (
                <label
                  key={type}
                  className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition ${
                    data.typeCarburant === type
                      ? 'border-fleetzen-teal bg-fleetzen-teal/5'
                      : 'border-border hover:bg-accent'
                  }`}
                >
                  <input
                    type="radio"
                    name="typeCarburant"
                    value={type}
                    checked={data.typeCarburant === type}
                    onChange={(e) => {
                      setData({ ...data, typeCarburant: e.target.value });
                      if (errors.typeCarburant) {
                        setErrors({ ...errors, typeCarburant: '' });
                      }
                    }}
                    className="mr-3"
                  />
                  <span className="font-medium">{type}</span>
                  {data.typeCarburant === type && (
                    <svg className="w-5 h-5 ml-auto text-fleetzen-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </label>
              ))}
            </div>
            {errors.typeCarburant && (
              <p className="text-xs text-red-500 mt-1">{errors.typeCarburant}</p>
            )}
          </div>

          <PhotoUploadMultiple
            label="Photo du manomètre de la cuve"
            helperText="Photo montrant la quantité livrée sur le manomètre"
            maxFiles={1}
            onChange={(files) => {
              setData({ ...data, photoManometre: files });
              if (files.length > 0 && errors.photoManometre) {
                setErrors({ ...errors, photoManometre: '' });
              }
            }}
            value={data.photoManometre}
            required
            error={errors.photoManometre}
          />

          <div>
            <label className="block text-sm font-medium mb-2">
              Quantité livrée (L) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={data.quantiteLivree || ''}
              onChange={(e) => {
                setData({ ...data, quantiteLivree: e.target.value });
                if (e.target.value && parseFloat(e.target.value) > 0 && errors.quantiteLivree) {
                  setErrors({ ...errors, quantiteLivree: '' });
                }
              }}
              className={`w-full p-3 border rounded-lg ${errors.quantiteLivree ? 'border-red-500' : ''}`}
              placeholder="0"
              required
            />
            {errors.quantiteLivree && (
              <p className="text-xs text-red-500 mt-1">{errors.quantiteLivree}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Kilométrage du tracteur / porteur *</label>
            <input
              type="number"
              value={data.kilometrage || ''}
              onChange={(e) => setData({ ...data, kilometrage: e.target.value })}
              className="w-full p-3 border rounded-lg"
              placeholder="0"
              required
            />
          </div>

          <div className="flex gap-4">
            <button type="button" onClick={onPrevious} className="px-6 py-3 border rounded-lg">← Retour</button>
            <button
              type="submit"
              className="flex-1 bg-fleetzen-teal text-white py-3 rounded-lg hover:bg-fleetzen-teal-dark disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isValid}
            >
              Suivant →
            </button>
          </div>
        </form>
      </div>
    );
  }

  // Étape 4: Photo compteur APRÈS
  if (currentStep === 4) {
    const validatePhotoApres = () => {
      const newErrors: Record<string, string> = {};

      if (!data.photoCompteurApres || data.photoCompteurApres.length === 0) {
        newErrors.photoCompteurApres = 'Au moins 1 photo du compteur après requise';
      }

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    };

    const handleNext = (e: React.FormEvent) => {
      e.preventDefault();
      if (validatePhotoApres()) {
        setErrors({});
        onNext(data);
      }
    };

    const isValid = !data.photoCompteurApres || data.photoCompteurApres.length === 0;

    return (
      <div className="bg-card rounded-lg border border-border shadow-lg p-6 md:p-8">
        <h2 className="text-2xl font-bold mb-6">Photo compteur APRÈS remplissage</h2>
        <form onSubmit={handleNext} className="space-y-6">
          <PhotoUploadMultiple
            label="Photo compteur véhicule APRÈS"
            helperText="Prenez une photo de la jauge du compteur après le remplissage"
            maxFiles={5}
            onChange={(files) => {
              setData({ ...data, photoCompteurApres: files });
              if (files.length > 0 && errors.photoCompteurApres) {
                setErrors({ ...errors, photoCompteurApres: '' });
              }
            }}
            value={data.photoCompteurApres}
            required
            error={errors.photoCompteurApres}
          />
          <div className="flex gap-4">
            <button type="button" onClick={onPrevious} className="px-6 py-3 border rounded-lg">← Retour</button>
            <button
              type="submit"
              className="flex-1 bg-fleetzen-teal text-white py-3 rounded-lg hover:bg-fleetzen-teal-dark disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isValid}
            >
              Suivant →
            </button>
          </div>
        </form>
      </div>
    );
  }

  // Étape 5: Validation
  if (currentStep === 5) {
    return (
      <div className="bg-card rounded-lg border border-border shadow-lg p-6 md:p-8">
        <h2 className="text-2xl font-bold mb-6">Commentaires et validation</h2>
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(data); }} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Commentaires (optionnel)</label>
            <textarea
              value={data.commentaires || ''}
              onChange={(e) => setData({ ...data, commentaires: e.target.value })}
              className="w-full p-3 border rounded-lg"
              rows={4}
              placeholder="Observations, remarques..."
            />
          </div>
          <div className="bg-fleetzen-teal/10 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Récapitulatif</h3>
            <ul className="text-sm space-y-1">
              <li>• Client: {data.client}</li>
              <li>• Véhicule: {data.vehicle}</li>
              <li>• Type carburant: {data.typeCarburant}</li>
              <li>• Quantité: {data.quantiteLivree} L</li>
              <li>• Photos: {(data.photoCompteurAvant?.length || 0) + (data.photoManometre?.length || 0) + (data.photoCompteurApres?.length || 0)} fichiers</li>
            </ul>
          </div>
          <div className="flex gap-4">
            <button type="button" onClick={onPrevious} className="px-6 py-3 border rounded-lg">← Retour</button>
            <button type="submit" className="flex items-center justify-center gap-2 flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Valider l'intervention
            </button>
          </div>
        </form>
      </div>
    );
  }

  return null;
}
