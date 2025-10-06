import { createClient, createAdminClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

/**
 * Schéma de validation Zod pour mise à jour véhicule
 */
const updateVehicleSchema = z.object({
  license_plate: z.string().min(2, 'Le numéro d\'immatriculation doit contenir au moins 2 caractères').optional(),
  make: z.string().min(2, 'La marque doit contenir au moins 2 caractères').optional(),
  model: z.string().nullable().optional(),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 1).nullable().optional(),
  vehicle_category: z.string().nullable().optional(),
  work_site: z.string().nullable().optional(),
  client_id: z.string().uuid('ID client invalide').optional(),
});

/**
 * GET /api/vehicles/[id]
 * Récupérer un véhicule spécifique
 */
export async function GET(
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

    // Récupérer le véhicule
    const adminClient = createAdminClient();
    const { data: vehicle, error: vehicleError } = await adminClient
      .from('vehicles')
      .select(`
        id,
        license_plate,
        make,
        model,
        year,
        vehicle_category,
        work_site,
        created_at,
        client:clients(id, name)
      `)
      .eq('id', id)
      .single();

    if (vehicleError || !vehicle) {
      return NextResponse.json(
        { error: 'Véhicule introuvable' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      vehicle,
    });

  } catch (error) {
    console.error('Get vehicle error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de la récupération' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/vehicles/[id]
 * Mettre à jour un véhicule
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
    const validationResult = updateVehicleSchema.safeParse(body);

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

    // Mettre à jour le véhicule avec service role key
    const adminClient = createAdminClient();
    const { data: updatedVehicle, error: updateError } = await adminClient
      .from('vehicles')
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select(`
        id,
        license_plate,
        make,
        model,
        year,
        vehicle_category,
        work_site,
        created_at,
        client:clients(id, name)
      `)
      .single();

    if (updateError) {
      console.error('Error updating vehicle:', updateError);
      return NextResponse.json(
        { error: 'Erreur lors de la mise à jour du véhicule' },
        { status: 500 }
      );
    }

    if (!updatedVehicle) {
      return NextResponse.json(
        { error: 'Véhicule introuvable' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Véhicule mis à jour avec succès',
      vehicle: updatedVehicle,
    });

  } catch (error) {
    console.error('Update vehicle error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de la mise à jour' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/vehicles/[id]
 * Supprimer un véhicule
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

    // Récupérer le véhicule avant suppression
    const { data: vehicle, error: fetchError } = await adminClient
      .from('vehicles')
      .select('id, license_plate, make, model')
      .eq('id', id)
      .single();

    if (fetchError || !vehicle) {
      return NextResponse.json(
        { error: 'Véhicule introuvable' },
        { status: 404 }
      );
    }

    // Supprimer le véhicule
    const { error: deleteError } = await adminClient
      .from('vehicles')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting vehicle:', deleteError);
      return NextResponse.json(
        { error: 'Erreur lors de la suppression du véhicule' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Véhicule supprimé avec succès',
      deleted: {
        id: vehicle.id,
        license_plate: vehicle.license_plate,
        make: vehicle.make,
        model: vehicle.model,
      },
    });

  } catch (error) {
    console.error('Delete vehicle error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de la suppression' },
      { status: 500 }
    );
  }
}
