"use client"

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogIn, Mail, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Image from 'next/image'

type LoginResponse = {
  success: boolean
  data?: {
    user: { id: string; email: string | null; role?: string | null }
    session: {
      accessToken: string
      refreshToken: string
      expiresIn: number
      expiresAt: number | null
      tokenType: string
    }
  }
  error?: string
  message?: string
  errorCode?: string
}

export default function LoginPage(): JSX.Element {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      let payload: LoginResponse | null = null

      try {
        payload = await response.json()
      } catch (jsonError) {
        console.error('Login response parsing error:', jsonError)
      }

      if (!response.ok || !payload || !payload.success || !payload.data) {
        const message = payload?.error || payload?.message || 'Erreur de connexion'
        setError(message)
        return
      }

      const { session, user } = payload.data

      try {
        localStorage.setItem('sb-access-token', session.accessToken)
        localStorage.setItem('sb-refresh-token', session.refreshToken)
        localStorage.setItem('sb-token-type', session.tokenType)
        localStorage.setItem('sb-session-expires-at', String(session.expiresAt ?? ''))
        localStorage.setItem('agent', JSON.stringify(user))
      } catch (storageError) {
        console.error('Storage error:', storageError)
      }

      setPassword('')

      router.push('/')
      router.refresh()
    } catch (requestError) {
      console.error('Login error:', requestError)
      setError('Erreur de connexion. Veuillez réessayer.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex-1 flex items-center justify-center p-4 min-h-screen bg-gradient-to-br from-primary/5 via-primary/10 to-background relative overflow-hidden">
      {/* Decorative background pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5" />

      <Card className="w-full max-w-md relative z-10 shadow-2xl border-primary/20 backdrop-blur-sm bg-card/95">
        <CardHeader className="space-y-4 text-center pb-6">
          {/* Logo FleetZen avec animation */}
          <div className="flex justify-center">
            <div className="relative animate-in fade-in zoom-in duration-500">
              <Image
                src="/logo-fleetzen.svg"
                alt="FleetZen Logo"
                width={120}
                height={120}
                className="drop-shadow-lg"
                priority
              />
            </div>
          </div>

          <div className="space-y-2 animate-in slide-in-from-bottom-4 duration-700">
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Bienvenue sur FleetZen
            </CardTitle>
            <CardDescription className="text-base">
              Connectez-vous à votre espace agent
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="animate-in slide-in-from-bottom-6 duration-1000">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email professionnel
              </Label>
              <div className="relative group">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                <Input
                  id="email"
                  type="email"
                  placeholder="agent@fleetzen.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="pl-10 h-11 transition-all focus:ring-2 focus:ring-primary/20"
                  required
                  autoComplete="email"
                  autoFocus
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Mot de passe
              </Label>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="pl-10 h-11 transition-all focus:ring-2 focus:ring-primary/20"
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>

            {error && (
              <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg animate-in slide-in-from-top-2 duration-300">
                <p className="text-sm text-destructive font-medium text-center">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-11 text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                  Connexion en cours...
                </>
              ) : (
                <>
                  <LogIn className="h-5 w-5 mr-2" />
                  Se connecter
                </>
              )}
            </Button>

            <div className="text-center pt-2">
              <button
                type="button"
                className="text-sm text-primary hover:text-primary/80 hover:underline transition-colors font-medium"
                onClick={() => { /* TODO: mot de passe oublié */ }}
              >
                Mot de passe oublié ?
              </button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Footer branding */}
      <div className="absolute bottom-4 left-0 right-0 text-center">
        <p className="text-xs text-muted-foreground">
          FleetZen © {new Date().getFullYear()} - Gestion d'interventions terrain
        </p>
      </div>
    </div>
  )
}
