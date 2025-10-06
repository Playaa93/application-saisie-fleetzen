import { createClient, createAdminClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * DELETE /api/client-users/[id]
 * Supprimer un utilisateur client (admin only)
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

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
        { error: 'Accès interdit - Réservé aux administrateurs' },
        { status: 403 }
      );
    }

    // Utiliser adminClient pour supprimer
    const adminClient = createAdminClient();

    // Récupérer l'utilisateur client avant suppression
    const { data: clientUser, error: fetchError } = await adminClient
      .from('client_users')
      .select('id, email')
      .eq('id', id)
      .single();

    if (fetchError || !clientUser) {
      return NextResponse.json(
        { error: 'Utilisateur client introuvable' },
        { status: 404 }
      );
    }

    // Supprimer de client_users
    const { error: deleteDbError } = await adminClient
      .from('client_users')
      .delete()
      .eq('id', id);

    if (deleteDbError) {
      console.error('Error deleting client_user:', deleteDbError);
      return NextResponse.json(
        { error: 'Erreur lors de la suppression du profil' },
        { status: 500 }
      );
    }

    // Supprimer de auth.users
    const { error: deleteAuthError } = await adminClient.auth.admin.deleteUser(id);

    if (deleteAuthError) {
      console.error('Error deleting auth user:', deleteAuthError);
      // Note: L'entrée client_users est déjà supprimée, on continue
    }

    return NextResponse.json({
      success: true,
      message: 'Utilisateur client supprimé avec succès',
      deleted: {
        id: clientUser.id,
        email: clientUser.email,
      },
    });

  } catch (error) {
    console.error('Delete client user error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de la suppression' },
      { status: 500 }
    );
  }
}
