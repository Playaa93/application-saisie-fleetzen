import { createClient, createAdminClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

/**
 * Schéma de validation Zod pour mise à jour client
 */
const updateClientSchema = z.object({
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  code: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  contact_name: z.string().nullable().optional(),
  contact_phone: z
    .string()
    .regex(/^[\d\s+()-]*$/, 'Format de téléphone invalide')
    .nullable()
    .optional(),
  is_active: z.boolean().optional(),
});

/**
 * PATCH /api/clients/[id]
 * Mettre à jour les informations d'un client
 */
export async function PATCH(
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

    // Parser et valider les données
    const body = await request.json();
    const validationResult = updateClientSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Données invalides',
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const updateData = validationResult.data;

    // Mettre à jour le client avec service role key
    const adminClient = createAdminClient();
    const { data: updatedClient, error: updateError } = await adminClient
      .from('clients')
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('id, name, code, city, contact_name, contact_phone, is_active, created_at')
      .single();

    if (updateError) {
      console.error('Error updating client:', updateError);
      return NextResponse.json(
        { error: 'Erreur lors de la mise à jour du client' },
        { status: 500 }
      );
    }

    if (!updatedClient) {
      return NextResponse.json(
        { error: 'Client introuvable' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Client mis à jour avec succès',
      client: updatedClient,
    });

  } catch (error) {
    console.error('Update client error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de la mise à jour' },
      { status: 500 }
    );
  }
}
