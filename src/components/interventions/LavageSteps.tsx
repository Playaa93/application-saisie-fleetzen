'use client';

import { useState, useEffect } from 'react';
import PhotoUploadMultiple from '@/components/PhotoUploadMultiple';
import SearchableCombobox from '@/components/SearchableCombobox';

interface LavageStepsProps {
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

const sites = [
  'ITM - PMS', 'LIDL - Coudray', 'LIDL - Barbery',
  'LIDL - Meaux', 'LIDL - Chanteloup', 'STG - STO', 'Autre'
];

const typesVehicule = [
  'Ensemble complet', 'Porteur', 'Tracteur seul', 'Remorque seule', 'Autre'
];

export default function LavageSteps({ currentStep, formData, onNext, onPrevious, onSubmit, isSubmitting = false }: LavageStepsProps) {
  const [data, setData] = useState(formData);
  const [clients, setClients] = useState<Client[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [tracteurVehicles, setTracteurVehicles] = useState<Vehicle[]>([]);
  const [remorqueVehicles, setRemorqueVehicles] = useState<Vehicle[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [loadingTracteurs, setLoadingTracteurs] = useState(false);
  const [loadingRemorques, setLoadingRemorques] = useState(false);

  // Synchroniser data avec formData seulement au changement de step
  useEffect(() => {
    console.log('📝 LavageSteps - Syncing formData to data on step change', { formData, currentStep });
    setData(prevData => ({ ...prevData, ...formData }));
  }, [currentStep]); // Seulement quand l'étape change, pas quand formData change

  // Charger les clients depuis Supabase
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await fetch('/api/clients');
        const result = await response.json();
        if (result.success) {
          setClients(result.clients);
        }
      } catch (error) {
        console.error('Error fetching clients:', error);
      } finally {
        setLoadingClients(false);
      }
    };
    fetchClients();
  }, []);

  // Charger les véhicules quand un client est sélectionné
  useEffect(() => {
    if (data.clientId) {
      setLoadingVehicles(true);
      const fetchVehicles = async () => {
        try {
          const response = await fetch(`/api/vehicles?clientId=${data.clientId}`);
          const result = await response.json();
          if (result.success) {
            setVehicles(result.vehicles);
          }
        } catch (error) {
          console.error('Error fetching vehicles:', error);
        } finally {
          setLoadingVehicles(false);
        }
      };
      fetchVehicles();
    } else {
      setVehicles([]);
    }
  }, [data.clientId]);

  // Charger les tracteurs/porteurs quand le type de véhicule est sélectionné
  useEffect(() => {
    if (data.clientId && data.typeVehicule &&
        (data.typeVehicule === 'Ensemble complet' || data.typeVehicule === 'Tracteur seul' || data.typeVehicule === 'Porteur')) {
      setLoadingTracteurs(true);
      const category = data.typeVehicule === 'Porteur' ? 'porteur' : 'tracteur';

      const fetchTracteurs = async () => {
        try {
          const response = await fetch(`/api/vehicles?clientId=${data.clientId}&category=${category}`);
          const result = await response.json();
          if (result.success) {
            setTracteurVehicles(result.vehicles);
          }
        } catch (error) {
          console.error('Error fetching tracteurs:', error);
        } finally {
          setLoadingTracteurs(false);
        }
      };
      fetchTracteurs();
    } else {
      setTracteurVehicles([]);
    }
  }, [data.clientId, data.typeVehicule]);

  // Charger les remorques quand le type de véhicule est sélectionné
  useEffect(() => {
    if (data.clientId && data.typeVehicule &&
        (data.typeVehicule === 'Ensemble complet' || data.typeVehicule === 'Remorque seule')) {
      setLoadingRemorques(true);

      const fetchRemorques = async () => {
        try {
          const response = await fetch(`/api/vehicles?clientId=${data.clientId}&category=remorque`);
          const result = await response.json();
          if (result.success) {
            setRemorqueVehicles(result.vehicles);
          }
        } catch (error) {
          console.error('Error fetching remorques:', error);
        } finally {
          setLoadingRemorques(false);
        }
      };
      fetchRemorques();
    } else {
      setRemorqueVehicles([]);
    }
  }, [data.clientId, data.typeVehicule]);

  // Étape 1: Prestation lavage
  if (currentStep === 1) {
    return (
      <div className="bg-card rounded-lg border border-border shadow-lg p-6 md:p-8">
        <h2 className="text-2xl font-bold mb-6">Prestation lavage</h2>
        <form onSubmit={(e) => { e.preventDefault(); onNext(data); }}>
          <div className="space-y-4">
            {['Lavage Intérieur / Extérieur', 'Lavage extérieur', 'Lavage intérieur', 'Fin de journée'].map((option) => (
              <label
                key={option}
                className={`block p-4 border-2 rounded-lg cursor-pointer transition
                  ${data.prestationLavage === option ? 'border-fleetzen-teal bg-fleetzen-teal/5' : 'border-border hover:bg-accent'}`}
              >
                <input
                  type="radio"
                  name="prestationLavage"
                  value={option}
                  checked={data.prestationLavage === option}
                  onChange={(e) => setData({ ...data, prestationLavage: e.target.value })}
                  className="sr-only"
                  required
                />
                <div className="flex items-center justify-between">
                  <span className="font-medium">{option}</span>
                  {data.prestationLavage === option && (
                    <svg className="w-5 h-5 text-fleetzen-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </label>
            ))}
          </div>
          <div className="flex gap-4 mt-6">
            <button type="button" onClick={onPrevious} className="px-6 py-3 border border-border rounded-lg hover:bg-accent">
              ← Retour
            </button>
            <button type="submit" className="flex-1 bg-fleetzen-teal text-white py-3 rounded-lg hover:bg-fleetzen-teal-dark">
              Suivant →
            </button>
          </div>
        </form>
      </div>
    );
  }

  // Étape 2: Renseignement clients
  if (currentStep === 2) {
    const clientOptions = [...clients.map(c => `${c.name} (${c.code})`), 'Autre'];
    const vehicleOptions = vehicles.map(v => `${v.license_plate} - ${v.make} ${v.model}`);

    console.log('🔍 LavageSteps - Step 2 Render', {
      clients,
      clientOptions,
      currentValue: data.client,
      data,
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
              console.log('👤 LavageSteps - Client onChange called', { value });
              const selectedClient = clients.find(c => `${c.name} (${c.code})` === value);
              console.log('👤 LavageSteps - Selected client:', selectedClient);

              const newData = {
                ...data,
                client: value,
                clientId: selectedClient?.id || null,
                clientAutre: '',
                vehicleId: null,
                vehicle: ''
              };
              console.log('👤 LavageSteps - New data:', newData);
              setData(newData);
            }}
            placeholder={loadingClients ? "Chargement..." : "Sélectionnez un client"}
            required
            onOtherSelected={(isOther) => {
              console.log('🔔 LavageSteps - onOtherSelected', { isOther });
              if (!isOther) {
                setData(prevData => {
                  console.log('🔔 Clearing only clientAutre (keeping clientId)', { prevData });
                  return { ...prevData, clientAutre: '' };
                });
              }
            }}
          />
          {data.client === 'Autre' && (
            <div>
              <label className="block text-sm font-medium mb-2">Précisez le client *</label>
              <input
                type="text"
                value={data.clientAutre || ''}
                onChange={(e) => setData({ ...data, clientAutre: e.target.value })}
                className="w-full p-3 border rounded-lg"
                placeholder="Nom du client"
                required
              />
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
              <input
                type="text"
                value={data.siteAutre || ''}
                onChange={(e) => setData({ ...data, siteAutre: e.target.value })}
                className="w-full p-3 border rounded-lg"
                placeholder="Nom du site"
                required
              />
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

          {/* Sélecteur de Tracteur/Porteur depuis les véhicules du client filtrés par catégorie */}
          {(data.typeVehicule === 'Ensemble complet' || data.typeVehicule === 'Tracteur seul' || data.typeVehicule === 'Porteur') && data.clientId && (
            <div>
              <SearchableCombobox
                label={data.typeVehicule === 'Porteur' ? 'Véhicule Porteur *' : 'Véhicule Tracteur *'}
                options={[...tracteurVehicles.map(v => `${v.license_plate} - ${v.make} ${v.model}`), 'Saisie manuelle']}
                value={data.vehicleTracteur || ''}
                onChange={(value) => {
                  const selectedVehicle = tracteurVehicles.find(v => `${v.license_plate} - ${v.make} ${v.model}` === value);
                  setData(prevData => ({
                    ...prevData,
                    vehicleTracteur: value,
                    immatTracteur: value === 'Saisie manuelle' ? '' : (selectedVehicle?.license_plate || '')
                  }));
                }}
                placeholder={loadingTracteurs ? "Chargement..." : "Sélectionnez le véhicule"}
                required={true}
              />

              {/* Message si aucun véhicule de cette catégorie */}
              {tracteurVehicles.length === 0 && !loadingTracteurs && (
                <p className="text-sm text-amber-600 dark:text-amber-500 mt-1">
                  ⚠️ Aucun {data.typeVehicule === 'Porteur' ? 'porteur' : 'tracteur'} trouvé pour ce client. Utilisez "Saisie manuelle".
                </p>
              )}

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

          {/* Sélecteur de Remorque depuis les véhicules du client filtrés par catégorie */}
          {(data.typeVehicule === 'Ensemble complet' || data.typeVehicule === 'Remorque seule') && (
            <div>
              {data.clientId ? (
                <>
                  <SearchableCombobox
                    label="Véhicule Remorque *"
                    options={[...remorqueVehicles.map(v => `${v.license_plate} - ${v.make} ${v.model}`), 'Saisie manuelle']}
                    value={data.vehicleRemorque || ''}
                    onChange={(value) => {
                      const selectedVehicle = remorqueVehicles.find(v => `${v.license_plate} - ${v.make} ${v.model}` === value);
                      setData(prevData => ({
                        ...prevData,
                        vehicleRemorque: value,
                        immatRemorque: value === 'Saisie manuelle' ? '' : (selectedVehicle?.license_plate || '')
                      }));
                    }}
                    placeholder={loadingRemorques ? "Chargement..." : "Sélectionnez le véhicule"}
                    required={true}
                  />

                  {/* Message si aucune remorque trouvée */}
                  {remorqueVehicles.length === 0 && !loadingRemorques && (
                    <p className="text-sm text-amber-600 dark:text-amber-500 mt-1">
                      ⚠️ Aucune remorque trouvée pour ce client. Utilisez "Saisie manuelle".
                    </p>
                  )}
                </>
              ) : (
                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <p className="text-sm text-amber-800 dark:text-amber-300">⚠️ Veuillez d'abord sélectionner un client</p>
                </div>
              )}

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

  // Étape 3: Photos
  if (currentStep === 3) {
    return (
      <div className="bg-card rounded-lg border border-border shadow-lg p-6 md:p-8">
        <h2 className="text-2xl font-bold mb-6">Photos</h2>
        <form onSubmit={(e) => { e.preventDefault(); onNext(data); }} className="space-y-6">
          <PhotoUploadMultiple
            label="Photo avant"
            helperText="Prenez des photos avant l'intervention"
            maxFiles={5}
            onChange={(files) => setData({ ...data, photosAvant: files })}
            value={data.photosAvant}
          />
          <PhotoUploadMultiple
            label="Photo après"
            helperText="Prenez des photos après l'intervention"
            maxFiles={5}
            onChange={(files) => setData({ ...data, photosApres: files })}
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
              <li>• Prestation: {data.prestationLavage}</li>
              <li>• Client: {data.client}</li>
              <li>• Site: {data.siteTravail}</li>
              <li>• Véhicule: {data.typeVehicule}</li>
              <li>• Photos: {(data.photosAvant?.length || 0) + (data.photosApres?.length || 0)} fichiers</li>
            </ul>
          </div>
          <div className="flex gap-4">
            <button type="button" onClick={onPrevious} className="px-6 py-3 border rounded-lg" disabled={isSubmitting}>← Retour</button>
            <button
              type="submit"
              className="flex items-center justify-center gap-2 flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Envoi en cours...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Valider l'intervention
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return null;
}
