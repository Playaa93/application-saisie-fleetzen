"use client"

import { Sparkles, Vibrate, RefreshCw, Wifi } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { SettingRow } from "./SettingRow"
import { useHapticPreference } from "@/hooks/useHapticPreference"
import { usePullToRefreshPreference } from "@/hooks/usePullToRefreshPreference"
import { useConnectionStatusPreference } from "@/hooks/useConnectionStatusPreference"

export function ExperienceSection() {
  const [hapticEnabled, setHapticEnabled] = useHapticPreference()
  const [pullToRefreshEnabled, setPullToRefreshEnabled] = usePullToRefreshPreference()
  const [connectionStatusEnabled, setConnectionStatusEnabled] = useConnectionStatusPreference()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          Expérience & Interactions
        </CardTitle>
        <CardDescription>
          Personnaliser les interactions tactiles et visuelles
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-1">
        {/* Haptic Feedback */}
        <SettingRow
          icon={Vibrate}
          label="Retour haptique"
          description="Vibrations tactiles lors des actions (succès, erreurs, photos)"
        >
          <Switch
            checked={hapticEnabled}
            onCheckedChange={setHapticEnabled}
            aria-label="Activer le retour haptique"
          />
        </SettingRow>

        {/* Pull-to-Refresh */}
        <SettingRow
          icon={RefreshCw}
          label="Pull-to-refresh"
          description="Actualiser en glissant vers le bas sur l'écran d'accueil"
        >
          <Switch
            checked={pullToRefreshEnabled}
            onCheckedChange={setPullToRefreshEnabled}
            aria-label="Activer le pull-to-refresh"
          />
        </SettingRow>

        {/* Connection Status Indicator */}
        <SettingRow
          icon={Wifi}
          label="Indicateur de connexion"
          description="Afficher l'icône de statut réseau et brouillons en attente"
        >
          <Switch
            checked={connectionStatusEnabled}
            onCheckedChange={setConnectionStatusEnabled}
            aria-label="Afficher l'indicateur de connexion"
          />
        </SettingRow>
      </CardContent>
    </Card>
  )
}
