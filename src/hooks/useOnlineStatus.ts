'use client'

import { useEffect, useState } from 'react'

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true)
  const [justReconnected, setJustReconnected] = useState(false)

  useEffect(() => {
    // Vérifier l'état initial
    setIsOnline(navigator.onLine)

    const handleOnline = () => {
      setIsOnline(true)
      setJustReconnected(true)

      // Auto-cacher le message de reconnexion après 3 secondes
      setTimeout(() => {
        setJustReconnected(false)
      }, 3000)
    }

    const handleOffline = () => {
      setIsOnline(false)
      setJustReconnected(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return { isOnline, justReconnected }
}
