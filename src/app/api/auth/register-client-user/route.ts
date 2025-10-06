import { createClient, createAdminClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * POST /api/auth/register-client-user
 * Créer un nouvel utilisateur client avec accès read-only à sa flotte
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Vérifier que l'utilisateur actuel est admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('user_type')
      .eq('id', user.id)
      .single();

    if (agentError || !agent || !['admin', 'super_admin'].includes(agent.user_type)) {
      return NextResponse.json(
        { error: 'Accès interdit - Réservé aux administrateurs' },
        { status: 403 }
      );
    }

    // Récupérer les données du formulaire
    const body = await request.json();
    const { email, password, full_name, client_id } = body;

    // Validation
    if (!email || !password || !client_id) {
      return NextResponse.json(
        { error: 'Email, mot de passe et client sont requis' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Le mot de passe doit contenir au moins 8 caractères' },
        { status: 400 }
      );
    }

    // Vérifier que le client existe
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, name')
      .eq('id', client_id)
      .single();

    if (clientError || !client) {
      return NextResponse.json(
        { error: 'Client introuvable' },
        { status: 404 }
      );
    }

    // Créer l'utilisateur dans auth.users avec service role key
    const adminClient = createAdminClient();
    const { data: newUser, error: signUpError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm l'email
      user_metadata: {
        full_name: full_name || null,
        user_type: 'client',
      },
    });

    if (signUpError) {
      console.error('Supabase auth error:', signUpError);
      return NextResponse.json(
        { error: signUpError.message || 'Erreur lors de la création du compte' },
        { status: 400 }
      );
    }

    if (!newUser.user) {
      return NextResponse.json(
        { error: 'Erreur lors de la création du compte' },
        { status: 500 }
      );
    }

    // Créer l'entrée dans client_users (utiliser adminClient pour bypass RLS)
    const { error: insertError } = await adminClient
      .from('client_users')
      .insert({
        id: newUser.user.id,
        client_id,
        email,
        full_name: full_name || null,
        is_active: true,
        metadata: {},
      });

    if (insertError) {
      console.error('Error inserting client_user:', insertError);

      // Rollback: supprimer l'utilisateur auth
      await adminClient.auth.admin.deleteUser(newUser.user.id);

      return NextResponse.json(
        { error: 'Erreur lors de la création du profil client' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Utilisateur client créé avec succès',
      user: {
        id: newUser.user.id,
        email: newUser.user.email,
        client_id,
        client_name: client.name,
      },
    });

  } catch (error) {
    console.error('Register client user error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de la création' },
      { status: 500 }
    );
  }
}
