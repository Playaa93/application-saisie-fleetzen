"use client"

export const dynamic = 'force-dynamic'

import { MobileHeader } from '@/components/mobile/MobileHeader'
import { AppShell } from '@/components/mobile/AppShell'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Sun, Moon, Monitor } from 'lucide-react'
import { useTheme } from '@/components/providers/ThemeProvider'

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()

  const themeOptions = [
    { value: 'light' as const, label: 'Jour', icon: Sun },
    { value: 'dark' as const, label: 'Nuit', icon: Moon },
    { value: 'system' as const, label: 'Système', icon: Monitor }
  ]

  return (
    <AppShell>
      <MobileHeader title="Paramètres" backHref="/profile" />

      <div className="p-4 space-y-6">
        {/* Apparence */}
        <Card>
          <CardHeader>
            <CardTitle>Apparence</CardTitle>
            <CardDescription>Thème de l'interface</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              {themeOptions.map((option) => {
                const Icon = option.icon
                return (
                  <button
                    key={option.value}
                    onClick={() => setTheme(option.value)}
                    className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2
                      ${theme === option.value
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50 hover:bg-accent'
                      }`}
                  >
                    <Icon className={`h-5 w-5 ${theme === option.value ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className={`text-sm font-medium ${theme === option.value ? 'text-primary' : 'text-foreground'}`}>
                      {option.label}
                    </span>
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Futures sections */}
        {/*
        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>Gérer les notifications</CardDescription>
          </CardHeader>
          <CardContent>
            ...
          </CardContent>
        </Card>
        */}
      </div>
    </AppShell>
  )
}
