import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * GET /api/client-users?client_id=xxx
 * Récupérer les utilisateurs d'un client spécifique (admin only)
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('client_id');

    // Vérifier authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    // Vérifier que l'utilisateur est admin
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('user_type')
      .eq('id', user.id)
      .single();

    if (agentError || !agent || !['admin', 'super_admin'].includes(agent.user_type)) {
      return NextResponse.json(
        { error: 'Accès interdit' },
        { status: 403 }
      );
    }

    // Construire la requête
    let query = supabase
      .from('client_users')
      .select('id, email, full_name, is_active, created_at')
      .order('created_at', { ascending: false });

    // Filtrer par client si spécifié
    if (clientId) {
      query = query.eq('client_id', clientId);
    }

    const { data: users, error } = await query;

    if (error) {
      console.error('Error fetching client users:', error);
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des utilisateurs' },
        { status: 500 }
      );
    }

    return NextResponse.json({ users: users || [] });

  } catch (error) {
    console.error('Get client users error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
