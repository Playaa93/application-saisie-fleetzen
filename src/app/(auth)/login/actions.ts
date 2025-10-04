'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function loginAction(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  console.log('🔐 Login attempt:', { email: email?.substring(0, 3) + '***' })

  if (!email || !password) {
    console.log('❌ Missing credentials')
    return { error: 'Email et mot de passe requis' }
  }

  const supabase = await createClient()

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase().trim(),
      password,
    })

    if (error || !data.session || !data.user) {
      console.error('❌ Login error:', error?.message || 'No session')
      return { error: error?.message || 'Erreur de connexion' }
    }

    console.log('✅ Login successful:', {
      email: data.user.email,
      user_type: data.user.app_metadata?.user_type
    })

    // Lire user_type depuis JWT custom claims
    const userType = data.user.app_metadata?.user_type

    // Redirection basée sur le rôle
    if (userType === 'admin' || userType === 'super_admin') {
      console.log('➡️ Redirecting to /admin')
      redirect('/admin')
    }

    // Si pas de user_type, vérifier si c'est un client
    if (!userType) {
      const { data: clientUser } = await supabase
        .from('client_users')
        .select('id')
        .eq('id', data.user.id)
        .single()

      if (clientUser) {
        console.log('➡️ Redirecting to /client')
        redirect('/client')
      }
    }

    // Field agent par défaut
    console.log('➡️ Redirecting to / (field agent)')
    redirect('/')
  } catch (err) {
    // Don't catch redirect() - it throws NEXT_REDIRECT which is expected
    // Only catch actual errors
    if (err && typeof err === 'object' && 'digest' in err && String(err.digest).startsWith('NEXT_REDIRECT')) {
      // This is a Next.js redirect - re-throw it
      throw err
    }

    console.error('❌ Unexpected login error:', err)
    return { error: 'Une erreur inattendue est survenue' }
  }
}
