'use client';

import { useState, useEffect } from 'react';
import PhotoUploadMultiple from '@/components/PhotoUploadMultiple';
import SearchableCombobox from '@/components/SearchableCombobox';

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
}

const sites = ['ITM - PMS', 'LIDL - Coudray', 'LIDL - Barbery', 'LIDL - Meaux', 'LIDL - Chanteloup', 'STG - STO', 'Autre'];
const typesVehicule = ['Ensemble complet', 'Porteur', 'Tracteur seul', 'Remorque seule', 'Autre'];

export default function CarburantLivraisonSteps({ currentStep, formData, onNext, onPrevious, onSubmit }: CarburantLivraisonStepsProps) {
  const [data, setData] = useState(formData);
  const [clients, setClients] = useState<Client[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [loadingVehicles, setLoadingVehicles] = useState(false);

  // Synchroniser data avec formData seulement au changement de step
  useEffect(() => {
    console.log('📝 Syncing formData to data on step change', { formData, currentStep });
    setData(prevData => ({ ...prevData, ...formData }));
  }, [currentStep]); // Seulement quand l'étape change, pas quand formData change

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

  // Charger les véhicules quand un client est sélectionné
  useEffect(() => {
    console.log('🚗 Client ID changed:', data.clientId);
    if (data.clientId) {
      setLoadingVehicles(true);
      const fetchVehicles = async () => {
        try {
          console.log('🌍 Fetching vehicles for client:', data.clientId);
          const response = await fetch(`/api/vehicles?clientId=${data.clientId}`);
          const result = await response.json();
          console.log('✅ Vehicles fetched:', result);
          if (result.success) {
            setVehicles(result.vehicles);
          }
        } catch (error) {
          console.error('❌ Error fetching vehicles:', error);
        } finally {
          setLoadingVehicles(false);
        }
      };
      fetchVehicles();
    } else {
      console.log('❌ No client selected, clearing vehicles');
      setVehicles([]);
    }
  }, [data.clientId]);

  // Étape 1: Renseignement clients
  if (currentStep === 1) {
    const clientOptions = [...clients.map(c => `${c.name} (${c.code})`), 'Autre'];
    const vehicleOptions = vehicles.map(v => `${v.license_plate} - ${v.make} ${v.model}`);

    console.log('🔍 CarburantLivraisonSteps - Step 1 Render', {
      clients,
      clientOptions,
      currentValue: data.client,
      data,
      loadingClients,
      vehiclesCount: vehicles.length
    });

    return (
      <div className="bg-card rounded-lg border border-border shadow-lg p-6 md:p-8">
        <h2 className="text-2xl font-bold mb-6">Renseignement clients</h2>
        <form onSubmit={(e) => { e.preventDefault(); onNext(data); }} className="space-y-6">
          <SearchableCombobox
            label="Client"
            options={clientOptions}
            value={data.client || ''}
            onChange={(value) => {
              console.log('👤 Client onChange called', { value });
              const selectedClient = clients.find(c => `${c.name} (${c.code})` === value);
              console.log('👤 Selected client:', selectedClient);

              const newData = {
                ...data,
                client: value,
                clientId: selectedClient?.id || null,
                clientAutre: '',
                vehicleId: null,
                vehicle: ''
              };
              console.log('👤 New data:', newData);
              setData(newData);
            }}
            placeholder={loadingClients ? "Chargement..." : "Sélectionnez un client"}
            required
            onOtherSelected={(isOther) => {
              console.log('👤 onOtherSelected called', { isOther });
              if (!isOther) {
                setData(prevData => {
                  console.log('👤 Clearing only clientAutre (keeping clientId)', { prevData });
                  return { ...prevData, clientAutre: '' };
                });
              }
            }}
          />
          {data.client === 'Autre' && (
            <div>
              <label className="block text-sm font-medium mb-2">Précisez le client *</label>
              <input type="text" value={data.clientAutre || ''} onChange={(e) => setData({ ...data, clientAutre: e.target.value })} className="w-full p-3 border rounded-lg" placeholder="Nom du client" required />
            </div>
          )}
          <SearchableCombobox
            label="Site de travail"
            options={sites}
            value={data.siteTravail || ''}
            onChange={(value) => setData(prevData => ({ ...prevData, siteTravail: value, siteAutre: '' }))}
            placeholder="Sélectionnez un site"
            required
            onOtherSelected={(isOther) => {
              if (!isOther) {
                setData(prevData => ({ ...prevData, siteAutre: '' }));
              }
            }}
          />
          {data.siteTravail === 'Autre' && (
            <div>
              <label className="block text-sm font-medium mb-2">Précisez le site *</label>
              <input type="text" value={data.siteAutre || ''} onChange={(e) => setData({ ...data, siteAutre: e.target.value })} className="w-full p-3 border rounded-lg" placeholder="Nom du site" required />
            </div>
          )}

          {/* Type de véhicule EN PREMIER */}
          <SearchableCombobox
            label="Type de véhicule"
            options={typesVehicule}
            value={data.typeVehicule || ''}
            onChange={(value) => setData(prevData => ({
              ...prevData,
              typeVehicule: value,
              // Reset les immatriculations quand on change le type
              vehicleTracteur: '',
              vehicleRemorque: '',
              immatTracteur: '',
              immatRemorque: ''
            }))}
            placeholder="Sélectionnez un type"
            required
          />

          {/* Sélecteur de Tracteur/Porteur depuis les véhicules du client */}
          {(data.typeVehicule === 'Ensemble complet' || data.typeVehicule === 'Tracteur seul' || data.typeVehicule === 'Porteur') && data.clientId && (
            <div>
              <SearchableCombobox
                label={data.typeVehicule === 'Porteur' ? 'Véhicule Porteur *' : 'Véhicule Tracteur *'}
                options={[...vehicleOptions, 'Saisie manuelle']}
                value={data.vehicleTracteur || ''}
                onChange={(value) => {
                  const selectedVehicle = vehicles.find(v => `${v.license_plate} - ${v.make} ${v.model}` === value);
                  setData(prevData => ({
                    ...prevData,
                    vehicleTracteur: value,
                    immatTracteur: value === 'Saisie manuelle' ? '' : (selectedVehicle?.license_plate || '')
                  }));
                }}
                placeholder={loadingVehicles ? "Chargement..." : "Sélectionnez le véhicule"}
                required={true}
              />

              {/* Champ manuel si "Saisie manuelle" est sélectionné */}
              {data.vehicleTracteur === 'Saisie manuelle' && (
                <div className="mt-2">
                  <input
                    type="text"
                    value={data.immatTracteur || ''}
                    onChange={(e) => setData(prevData => ({ ...prevData, immatTracteur: e.target.value }))}
                    className="w-full p-3 border rounded-lg"
                    placeholder="AA-123-BB"
                    required
                  />
                </div>
              )}
            </div>
          )}

          {/* Sélecteur de Remorque depuis les véhicules du client */}
          {(data.typeVehicule === 'Ensemble complet' || data.typeVehicule === 'Remorque seule') && data.clientId && (
            <div>
              <SearchableCombobox
                label="Véhicule Remorque *"
                options={[...vehicleOptions, 'Saisie manuelle']}
                value={data.vehicleRemorque || ''}
                onChange={(value) => {
                  const selectedVehicle = vehicles.find(v => `${v.license_plate} - ${v.make} ${v.model}` === value);
                  setData(prevData => ({
                    ...prevData,
                    vehicleRemorque: value,
                    immatRemorque: value === 'Saisie manuelle' ? '' : (selectedVehicle?.license_plate || '')
                  }));
                }}
                placeholder={loadingVehicles ? "Chargement..." : "Sélectionnez le véhicule"}
                required={true}
              />

              {/* Champ manuel si "Saisie manuelle" est sélectionné */}
              {data.vehicleRemorque === 'Saisie manuelle' && (
                <div className="mt-2">
                  <input
                    type="text"
                    value={data.immatRemorque || ''}
                    onChange={(e) => setData(prevData => ({ ...prevData, immatRemorque: e.target.value }))}
                    className="w-full p-3 border rounded-lg"
                    placeholder="AA-123-BB"
                    required
                  />
                </div>
              )}
            </div>
          )}
          <div className="flex gap-4">
            <button type="button" onClick={onPrevious} className="px-6 py-3 border rounded-lg">← Retour</button>
            <button type="submit" className="flex-1 bg-fleetzen-teal text-white py-3 rounded-lg hover:bg-fleetzen-teal-dark">Suivant →</button>
          </div>
        </form>
      </div>
    );
  }

  // Étape 2: Carburant livré
  if (currentStep === 2) {
    return (
      <div className="bg-card rounded-lg border border-border shadow-lg p-6 md:p-8">
        <h2 className="text-2xl font-bold mb-6">Carburant livré</h2>
        <form onSubmit={(e) => { e.preventDefault(); onNext(data); }} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Type de carburant *</label>
            <div className="space-y-2">
              {['Diesel', 'AdBlue', 'GNR'].map(type => (
                <label key={type} className="flex items-center p-3 border border-border rounded-lg cursor-pointer hover:bg-accent">
                  <input
                    type="checkbox"
                    checked={data.carburant?.[type] || false}
                    onChange={(e) => setData({ ...data, carburant: { ...data.carburant, [type]: e.target.checked } })}
                    className="mr-3"
                  />
                  <span>{type}</span>
                </label>
              ))}
            </div>
          </div>
          <PhotoUploadMultiple
            label="Photo du manomètre de la cuve *"
            maxFiles={1}
            onChange={(files) => setData({ ...data, photoManometre: files })}
            value={data.photoManometre}
          />
          <div>
            <label className="block text-sm font-medium mb-2">Quantité livrée (L) *</label>
            <input
              type="number"
              value={data.quantiteLivree || ''}
              onChange={(e) => setData({ ...data, quantiteLivree: e.target.value })}
              className="w-full p-3 border rounded-lg"
              placeholder="0"
              required
            />
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
            <button type="submit" className="flex-1 bg-fleetzen-teal text-white py-3 rounded-lg hover:bg-fleetzen-teal-dark">Suivant →</button>
          </div>
        </form>
      </div>
    );
  }

  // Étape 3: Photos
  if (currentStep === 3) {
    return (
      <div className="bg-card rounded-lg border border-border shadow-lg p-6 md:p-8">
        <h2 className="text-2xl font-bold mb-6">Photos</h2>
        <form onSubmit={(e) => { e.preventDefault(); onNext(data); }} className="space-y-6">
          <PhotoUploadMultiple
            label="Photo avant"
            helperText="Si remplissage: photo de la jauge"
            maxFiles={5}
            onChange={(files) => setData(prevData => ({ ...prevData, photosAvant: files }))}
            value={data.photosAvant}
          />
          <PhotoUploadMultiple
            label="Photo après"
            helperText="Si remplissage: photo de la jauge"
            maxFiles={5}
            onChange={(files) => setData(prevData => ({ ...prevData, photosApres: files }))}
            value={data.photosApres}
          />
          <div className="flex gap-4">
            <button type="button" onClick={onPrevious} className="px-6 py-3 border rounded-lg">← Retour</button>
            <button type="submit" className="flex-1 bg-fleetzen-teal text-white py-3 rounded-lg hover:bg-fleetzen-teal-dark">Suivant →</button>
          </div>
        </form>
      </div>
    );
  }

  // Étape 4: Validation
  if (currentStep === 4) {
    return (
      <div className="bg-card rounded-lg border border-border shadow-lg p-6 md:p-8">
        <h2 className="text-2xl font-bold mb-6">Commentaires et validation</h2>
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(data); }} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Commentaires (optionnel)</label>
            <textarea value={data.commentaires || ''} onChange={(e) => setData({ ...data, commentaires: e.target.value })} className="w-full p-3 border rounded-lg" rows={4} placeholder="Observations, remarques..." />
          </div>
          <div className="bg-fleetzen-teal/10 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Récapitulatif</h3>
            <ul className="text-sm space-y-1">
              <li>• Client: {data.client}</li>
              <li>• Quantité: {data.quantiteLivree} L</li>
              <li>• Photos: {(data.photosAvant?.length || 0) + (data.photosApres?.length || 0) + (data.photoManometre?.length || 0)} fichiers</li>
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
