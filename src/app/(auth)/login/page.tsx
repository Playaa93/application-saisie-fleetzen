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
    <div className="flex-1 flex items-center justify-center p-4 min-h-screen bg-background">
      <Card className="w-full max-w-md shadow-lg border">
        <CardHeader className="space-y-6 text-center pb-8">
          {/* Logo FleetZen */}
          <div className="flex justify-center animate-in fade-in duration-300">
            <Image
              src="/logo-fleetzen.svg"
              alt="FleetZen"
              width={188}
              height={188}
              priority
            />
          </div>

          <div className="space-y-2 animate-in fade-in duration-300 delay-75">
            <CardTitle className="text-2xl font-bold text-foreground">
              Votre espace agent
            </CardTitle>
            <CardDescription className="text-base text-muted-foreground">
              Connectez-vous pour gérer vos interventions terrain
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="animate-in fade-in duration-300 delay-150">
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
              className="w-full h-11 text-base font-semibold transition-all duration-200"
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
        <p className="text-xs text-muted-foreground/60">
          FleetZen © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  )
}
