"use client"

import { useState, useEffect } from 'react'

const STORAGE_KEY = 'fleetzen-connection-status-enabled'

/**
 * Hook pour gérer la préférence d'affichage de l'indicateur de connexion
 * @returns [enabled, setEnabled] - État et fonction de mise à jour
 */
export function useConnectionStatusPreference(): [boolean, (enabled: boolean) => void] {
  const [enabled, setEnabledState] = useState(true) // Activé par défaut

  // Charger la préférence au montage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored !== null) {
        setEnabledState(stored === 'true')
      }
    } catch (error) {
      console.error('Error loading connection status preference:', error)
    }
  }, [])

  // Fonction pour mettre à jour la préférence
  const setEnabled = (newValue: boolean) => {
    try {
      localStorage.setItem(STORAGE_KEY, String(newValue))
      setEnabledState(newValue)
    } catch (error) {
      console.error('Error saving connection status preference:', error)
    }
  }

  return [enabled, setEnabled]
}

/**
 * Vérifier si l'indicateur de connexion est activé (fonction utilitaire)
 */
export function isConnectionStatusEnabled(): boolean {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored === null || stored === 'true' // Activé par défaut si non défini
  } catch {
    return true // Activé par défaut en cas d'erreur
  }
}
