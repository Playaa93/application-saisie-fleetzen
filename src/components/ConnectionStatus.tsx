'use client'

import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import { WifiOff, Wifi } from 'lucide-react'

export function ConnectionStatus() {
  const { isOnline, justReconnected } = useOnlineStatus()

  // Ne rien afficher si en ligne et pas de reconnexion récente
  if (isOnline && !justReconnected) return null

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 py-2 px-4 flex items-center justify-center gap-2 text-sm font-medium transition-all ${
        isOnline
          ? 'bg-green-500 text-white'
          : 'bg-destructive text-destructive-foreground'
      }`}
    >
      {isOnline ? (
        <>
          <Wifi className="h-4 w-4" />
          <span>Connexion rétablie</span>
        </>
      ) : (
        <>
          <WifiOff className="h-4 w-4" />
          <span>Hors ligne - Les données seront synchronisées une fois reconnecté</span>
        </>
      )}
    </div>
  )
}
