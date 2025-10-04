"use client"

import { useState, useEffect } from 'react'

const STORAGE_KEY = 'fleetzen-haptic-enabled'

/**
 * Hook pour gérer la préférence d'activation du retour haptique
 * @returns [enabled, setEnabled] - État et fonction de mise à jour
 */
export function useHapticPreference(): [boolean, (enabled: boolean) => void] {
  const [enabled, setEnabledState] = useState(true) // Activé par défaut

  // Charger la préférence au montage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored !== null) {
        setEnabledState(stored === 'true')
      }
    } catch (error) {
      console.error('Error loading haptic preference:', error)
    }
  }, [])

  // Fonction pour mettre à jour la préférence
  const setEnabled = (newValue: boolean) => {
    try {
      localStorage.setItem(STORAGE_KEY, String(newValue))
      setEnabledState(newValue)
    } catch (error) {
      console.error('Error saving haptic preference:', error)
    }
  }

  return [enabled, setEnabled]
}

/**
 * Vérifier si le retour haptique est activé (fonction utilitaire)
 * Utilisé dans haptics.ts pour vérifier avant de déclencher une vibration
 */
export function isHapticEnabled(): boolean {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored === null || stored === 'true' // Activé par défaut si non défini
  } catch {
    return true // Activé par défaut en cas d'erreur
  }
}
