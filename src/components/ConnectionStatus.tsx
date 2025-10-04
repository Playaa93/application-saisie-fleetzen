'use client'

import { useState, useEffect } from 'react'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import { WifiOff, Wifi, CloudOff } from 'lucide-react'
import { listDrafts } from '@/lib/indexedDB'
import { useConnectionStatusPreference } from '@/hooks/useConnectionStatusPreference'

export function ConnectionStatus() {
  const { isOnline, justReconnected } = useOnlineStatus()
  const [pendingSync, setPendingSync] = useState(0)
  const [connectionStatusEnabled] = useConnectionStatusPreference()

  // Count pending items in IndexedDB
  useEffect(() => {
    const checkPending = async () => {
      try {
        const drafts = await listDrafts()
        setPendingSync(drafts.length)
      } catch (error) {
        console.error('Error checking pending sync:', error)
      }
    }

    checkPending()
    // Re-check every 30 seconds
    const interval = setInterval(checkPending, 30000)
    return () => clearInterval(interval)
  }, [])

  // Ne rien afficher si désactivé dans les paramètres
  if (!connectionStatusEnabled) return null

  // Ne rien afficher si en ligne, pas de reconnexion récente, et pas de sync en attente
  if (isOnline && !justReconnected && pendingSync === 0) return null

  // Indicateur discret en coin (top-right)
  return (
    <div
      className={`fixed top-4 right-4 z-50 safe-area-top transition-all rounded-full p-2 shadow-lg ${
        isOnline
          ? 'bg-green-500 text-white'
          : 'bg-destructive text-destructive-foreground'
      }`}
      title={
        isOnline
          ? 'Connexion rétablie'
          : `Mode hors ligne${pendingSync > 0 ? ` - ${pendingSync} en attente` : ''}`
      }
    >
      <div className="relative">
        {isOnline ? (
          <Wifi className="h-5 w-5" />
        ) : (
          <>
            <WifiOff className="h-5 w-5" />
            {pendingSync > 0 && (
              <div className="absolute -top-1 -right-1 bg-white text-destructive rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold">
                {pendingSync}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
