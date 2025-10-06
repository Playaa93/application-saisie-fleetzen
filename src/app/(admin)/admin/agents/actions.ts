'use server';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

/**
 * Server Actions pour CRUD agents
 * Authentification vérifiée via RLS policies (seuls admins/super_admins autorisés)
 */

export interface AgentFormData {
  email: string;
  first_name: string;
  last_name: string;
  phone?: string; // Téléphone
  role?: string; // Rôle métier (distinct de user_type)
  user_type: 'field_agent' | 'admin' | 'super_admin';
  is_active: boolean;
  password?: string; // Uniquement pour création
  avatar?: File; // Photo de profil
  avatar_url?: string; // URL de l'avatar existant
}

/**
 * Créer un nouvel agent
 */
export async function createAgent(data: AgentFormData) {
  const supabase = await createClient();

  // Vérifier que l'utilisateur est admin/super_admin
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: 'Non authentifié' };
  }

  // Vérifier le type d'utilisateur
  const { data: currentAgent } = await supabase
    .from('agents')
    .select('user_type')
    .eq('id', user.id)
    .single();

  if (!currentAgent || !['admin', 'super_admin'].includes(currentAgent.user_type)) {
    return { error: 'Accès refusé - réservé aux administrateurs' };
  }

  // 1. Créer l'utilisateur dans auth.users via Supabase Admin API
  if (!data.password) {
    return { error: 'Mot de passe requis' };
  }

  // Utiliser le client admin avec Service Role Key
  const adminClient = createAdminClient();

  const { data: authUser, error: signUpError } = await adminClient.auth.admin.createUser({
    email: data.email,
    password: data.password,
    email_confirm: true, // Auto-confirmer l'email
    user_metadata: {
      first_name: data.first_name,
      last_name: data.last_name,
    },
  });

  if (signUpError || !authUser.user) {
    console.error('Error creating auth user:', signUpError);
    return { error: signUpError?.message || 'Erreur lors de la création du compte' };
  }

  // 2. Upload avatar si fourni
  let avatar_url = data.avatar_url || null;

  if (data.avatar) {
    try {
      // Créer nom de fichier unique
      const fileExt = data.avatar.name.split('.').pop();
      const fileName = `${authUser.user.id}/${Date.now()}.${fileExt}`;

      // Convert File to ArrayBuffer then to Buffer
      const arrayBuffer = await data.avatar.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('agent-avatars')
        .upload(fileName, buffer, {
          contentType: data.avatar.type,
          upsert: true,
        });

      if (uploadError) {
        console.error('Error uploading avatar:', uploadError);
        // Continue sans avatar si upload échoue
      } else {
        // Get public URL
        const { data: urlData } = supabase.storage
          .from('agent-avatars')
          .getPublicUrl(fileName);

        avatar_url = urlData.publicUrl;
      }
    } catch (error) {
      console.error('Avatar upload error:', error);
      // Continue sans avatar
    }
  }

  // 3. Créer l'entrée dans la table agents (use admin client to bypass RLS)
  const { error: insertError } = await adminClient
    .from('agents')
    .insert({
      id: authUser.user.id,
      email: data.email,
      first_name: data.first_name,
      last_name: data.last_name,
      phone: data.phone || null,
      role: data.role || null,
      user_type: data.user_type,
      is_active: data.is_active,
      avatar_url,
    });

  if (insertError) {
    console.error('Error inserting agent into agents table:', insertError);
    console.error('Insert data was:', {
      id: authUser.user.id,
      email: data.email,
      first_name: data.first_name,
      last_name: data.last_name,
      phone: data.phone || null,
      role: data.role || null,
      user_type: data.user_type,
      is_active: data.is_active,
      avatar_url,
    });

    // Rollback: supprimer l'utilisateur auth si échec insertion agent
    try {
      await adminClient.auth.admin.deleteUser(authUser.user.id);
      console.log('Successfully rolled back auth user creation');
    } catch (rollbackError) {
      console.error('Failed to rollback auth user:', rollbackError);
    }

    return { error: `Erreur lors de la création dans la table agents: ${insertError.message}` };
  }

  revalidatePath('/admin/agents');
  return { success: true };
}

/**
 * Mettre à jour un agent existant
 */
export async function updateAgent(agentId: string, data: Partial<AgentFormData>) {
  const supabase = await createClient();

  // Vérifier que l'utilisateur est admin/super_admin
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: 'Non authentifié' };
  }

  const { data: currentAgent } = await supabase
    .from('agents')
    .select('user_type')
    .eq('id', user.id)
    .single();

  if (!currentAgent || !['admin', 'super_admin'].includes(currentAgent.user_type)) {
    return { error: 'Accès refusé - réservé aux administrateurs' };
  }

  // Upload avatar si fourni
  let avatar_url = data.avatar_url;

  if (data.avatar) {
    try {
      // Créer nom de fichier unique
      const fileExt = data.avatar.name.split('.').pop();
      const fileName = `${agentId}/${Date.now()}.${fileExt}`;

      // Convert File to ArrayBuffer then to Buffer
      const arrayBuffer = await data.avatar.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('agent-avatars')
        .upload(fileName, buffer, {
          contentType: data.avatar.type,
          upsert: true,
        });

      if (uploadError) {
        console.error('Error uploading avatar:', uploadError);
      } else {
        // Get public URL
        const { data: urlData } = supabase.storage
          .from('agent-avatars')
          .getPublicUrl(fileName);

        avatar_url = urlData.publicUrl;
      }
    } catch (error) {
      console.error('Avatar upload error:', error);
    }
  }

  // Préparer les données à mettre à jour
  const updateData: any = {};

  if (data.email) updateData.email = data.email;
  if (data.first_name) updateData.first_name = data.first_name;
  if (data.last_name) updateData.last_name = data.last_name;
  if (data.phone !== undefined) updateData.phone = data.phone;
  if (data.role !== undefined) updateData.role = data.role;
  if (data.user_type) updateData.user_type = data.user_type;
  if (data.is_active !== undefined) updateData.is_active = data.is_active;
  if (avatar_url) updateData.avatar_url = avatar_url;

  // Mettre à jour dans la table agents
  const { error: updateError } = await supabase
    .from('agents')
    .update(updateData)
    .eq('id', agentId);

  if (updateError) {
    console.error('Error updating agent:', updateError);
    return { error: updateError.message };
  }

  // Si changement d'email, mettre à jour auth.users aussi
  if (data.email) {
    await supabase.auth.admin.updateUserById(agentId, {
      email: data.email,
    });
  }

  // Si changement de nom/prénom, mettre à jour metadata
  if (data.first_name || data.last_name) {
    await supabase.auth.admin.updateUserById(agentId, {
      user_metadata: {
        first_name: data.first_name,
        last_name: data.last_name,
      },
    });
  }

  // Si nouveau mot de passe fourni
  if (data.password) {
    await supabase.auth.admin.updateUserById(agentId, {
      password: data.password,
    });
  }

  revalidatePath('/admin/agents');
  return { success: true };
}

/**
 * Supprimer un agent (soft delete via is_active = false)
 */
export async function deleteAgent(agentId: string) {
  const supabase = await createClient();

  // Vérifier que l'utilisateur est admin/super_admin
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: 'Non authentifié' };
  }

  const { data: currentAgent } = await supabase
    .from('agents')
    .select('user_type')
    .eq('id', user.id)
    .single();

  if (!currentAgent || !['admin', 'super_admin'].includes(currentAgent.user_type)) {
    return { error: 'Accès refusé - réservé aux administrateurs' };
  }

  // Interdire la suppression de son propre compte
  if (agentId === user.id) {
    return { error: 'Impossible de supprimer votre propre compte' };
  }

  // Soft delete: désactiver l'agent au lieu de le supprimer
  const { error: updateError } = await supabase
    .from('agents')
    .update({ is_active: false })
    .eq('id', agentId);

  if (updateError) {
    console.error('Error deleting agent:', updateError);
    return { error: updateError.message };
  }

  revalidatePath('/admin/agents');
  return { success: true };
}

/**
 * Réactiver un agent désactivé
 */
export async function reactivateAgent(agentId: string) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: 'Non authentifié' };
  }

  const { data: currentAgent } = await supabase
    .from('agents')
    .select('user_type')
    .eq('id', user.id)
    .single();

  if (!currentAgent || !['admin', 'super_admin'].includes(currentAgent.user_type)) {
    return { error: 'Accès refusé - réservé aux administrateurs' };
  }

  const { error: updateError } = await supabase
    .from('agents')
    .update({ is_active: true })
    .eq('id', agentId);

  if (updateError) {
    console.error('Error reactivating agent:', updateError);
    return { error: updateError.message };
  }

  revalidatePath('/admin/agents');
  return { success: true };
}

/**
 * Réinitialiser le mot de passe d'un agent
 */
export async function resetAgentPassword(agentId: string, newPassword: string) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: 'Non authentifié' };
  }

  const { data: currentAgent } = await supabase
    .from('agents')
    .select('user_type')
    .eq('id', user.id)
    .single();

  if (!currentAgent || !['admin', 'super_admin'].includes(currentAgent.user_type)) {
    return { error: 'Accès refusé - réservé aux administrateurs' };
  }

  const { error: resetError } = await supabase.auth.admin.updateUserById(agentId, {
    password: newPassword,
  });

  if (resetError) {
    console.error('Error resetting password:', resetError);
    return { error: resetError.message };
  }

  return { success: true };
}
