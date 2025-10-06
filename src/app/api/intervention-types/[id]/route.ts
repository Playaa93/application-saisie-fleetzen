import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// PATCH /api/intervention-types/[id]
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { id } = params;

    const { name, code, description, is_active } = body;

    // Validation
    if (!name?.trim() || !code?.trim()) {
      return NextResponse.json(
        { success: false, message: 'Le nom et le code sont obligatoires' },
        { status: 400 }
      );
    }

    // Check if code already exists (excluding current record)
    const { data: existing } = await supabase
      .from('intervention_types')
      .select('id')
      .eq('code', code)
      .neq('id', id)
      .single();

    if (existing) {
      return NextResponse.json(
        { success: false, message: 'Ce code existe déjà' },
        { status: 409 }
      );
    }

    const { data: updatedType, error } = await supabase
      .from('intervention_types')
      .update({
        name: name.trim(),
        code: code.trim().toUpperCase(),
        description: description?.trim() || null,
        is_active: is_active ?? true,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error(`❌ PATCH /api/intervention-types/${id} - Error:`, error);
      return NextResponse.json(
        { success: false, message: 'Erreur lors de la modification' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      type: updatedType,
    });
  } catch (error) {
    console.error('❌ PATCH /api/intervention-types/[id] - Unhandled error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/intervention-types/[id]
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { id } = params;

    // Check if type is used in interventions
    const { count } = await supabase
      .from('interventions')
      .select('*', { count: 'exact', head: true })
      .eq('intervention_type_id', id);

    if (count && count > 0) {
      return NextResponse.json(
        {
          success: false,
          message: `Impossible de supprimer : ce type est utilisé dans ${count} intervention(s)`,
        },
        { status: 409 }
      );
    }

    const { error } = await supabase
      .from('intervention_types')
      .delete()
      .eq('id', id);

    if (error) {
      console.error(`❌ DELETE /api/intervention-types/${id} - Error:`, error);
      return NextResponse.json(
        { success: false, message: 'Erreur lors de la suppression' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Type supprimé avec succès',
    });
  } catch (error) {
    console.error('❌ DELETE /api/intervention-types/[id] - Unhandled error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
