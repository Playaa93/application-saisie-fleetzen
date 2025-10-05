'use client';

import { useState, useEffect } from 'react';
import LastContextCard from './LastContextCard';

interface Step1TypePrestationProps {
  onNext: (type: string) => void;
}

interface SavedContext {
  typePrestation: string;
  clientId: string;
  client: string;
  siteTravail: string;
  timestamp: number;
  expiresAt: number;
}

export default function Step1TypePrestation({ onNext }: Step1TypePrestationProps) {
  const [selectedType, setSelectedType] = useState<string>('');
  const [savedContext, setSavedContext] = useState<SavedContext | null>(null);
  const [useContext, setUseContext] = useState(false);

  // Load saved context from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('last-intervention-context');
      if (saved) {
        const context: SavedContext = JSON.parse(saved);

        // Check if context is still valid (not expired)
        if (Date.now() < context.expiresAt) {
          setSavedContext(context);
        } else {
          // Remove expired context
          localStorage.removeItem('last-intervention-context');
        }
      }
    } catch (error) {
      console.error('Failed to load saved context:', error);
    }
  }, []);

  // Auto-select and auto-navigate if toggle is ON
  useEffect(() => {
    if (useContext && savedContext) {
      setSelectedType(savedContext.typePrestation);

      // Auto-navigate after a short delay to let user see the selection
      const timer = setTimeout(() => {
        onNext(savedContext.typePrestation);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [useContext, savedContext, onNext]);

  const types = [
    {
      id: 'lavage',
      label: 'Lavage',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
      ),
      description: 'Lavage de véhicules'
    },
    {
      id: 'carburant-livraison',
      label: 'Carburant - Livraison',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      description: 'Livraison de carburant'
    },
    {
      id: 'carburant-cuve',
      label: 'Carburant - Remplissage cuve',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      description: 'Remplissage de la cuve mobile'
    },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedType) {
      onNext(selectedType);
    }
  };

  return (
    <div className="space-y-4">
      {/* Last Context Card - Show if context exists */}
      {savedContext && (
        <LastContextCard
          context={savedContext}
          isActive={useContext}
          onToggle={setUseContext}
        />
      )}

      <div className="bg-card rounded-lg border border-border shadow-lg p-6 md:p-8">
        <h2 className="text-2xl font-bold mb-2">Type de prestation</h2>
        <p className="text-muted-foreground mb-6">Sélectionnez le type d'intervention à effectuer</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {types.map((type) => (
            <label
              key={type.id}
              className={`block p-4 border-2 rounded-lg cursor-pointer transition-all hover:border-primary/50
                ${selectedType === type.id
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:bg-accent'
                }`}
            >
              <input
                type="radio"
                name="type"
                value={type.id}
                checked={selectedType === type.id}
                onChange={(e) => setSelectedType(e.target.value)}
                className="sr-only"
                disabled={useContext} // Disable manual selection if toggle is ON
              />
              <div className="flex items-center">
                <div className="text-primary mr-4">{type.icon}</div>
                <div className="flex-1">
                  <div className="font-semibold text-lg">{type.label}</div>
                  <div className="text-sm text-muted-foreground">{type.description}</div>
                </div>
                {selectedType === type.id && (
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </label>
          ))}

          <button
            type="submit"
            disabled={!selectedType || useContext} // Disable if toggle ON (auto-nav)
            className="w-full mt-6 bg-primary text-primary-foreground py-3 rounded-lg font-medium
              hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed transition-colors"
          >
            {useContext ? 'Chargement...' : 'Suivant →'}
          </button>
        </form>
      </div>
    </div>
  );
}
