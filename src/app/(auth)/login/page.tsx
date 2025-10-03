"use client"

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogIn, Mail, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

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
      setError('Erreur de connexion. Veuillez reessayer.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex-1 flex items-center justify-center p-4 bg-gradient-to-b from-primary/10 to-background">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <LogIn className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Connexion Agent</CardTitle>
          <CardDescription>
            Connectez-vous pour acceder a vos interventions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="agent@fleetzen.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="pl-10"
                  required
                  autoComplete="email"
                  autoFocus
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="********"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="pl-10"
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-sm text-destructive font-medium">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
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
                  <LogIn className="h-4 w-4 mr-2" />
                  Se connecter
                </>
              )}
            </Button>

            <div className="text-center">
              <button
                type="button"
                className="text-sm text-primary hover:underline"
                onClick={() => { /* TODO: mot de passe oublie */ }}
              >
                Mot de passe oublie ?
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
