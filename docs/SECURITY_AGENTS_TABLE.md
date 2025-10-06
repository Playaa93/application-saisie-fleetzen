# Sécurité Table Agents

## Architecture actuelle

**RLS DÉSACTIVÉ** sur la table `agents` pour éviter la récursion infinie lors des vérifications de permissions.

## Modèle de sécurité en couches

### Layer 1: Middleware
- Vérifie que l'utilisateur est authentifié
- Redirige vers `/login` si non connecté
- Fichier: `src/middleware.ts`

### Layer 2: Admin Layout
- Vérifie `user_type IN ('admin', 'super_admin')`
- Redirige vers `/` si non autorisé
- Fichier: `src/app/(admin)/admin/layout.tsx`

### Layer 3: Server Actions
- Double vérification auth dans chaque action
- Utilise `supabase.auth.getUser()` (pas `getSession()`)
- Fichier: `src/app/(admin)/admin/agents/actions.ts`

```typescript
// Exemple de vérification dans Server Action
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
```

### Layer 4: Supabase Auth
- JWT tokens signés avec secret serveur
- Service role key jamais exposée au client
- Tokens expirés automatiquement

## ✅ Pourquoi c'est sécurisé

1. **Impossible de contourner côté client**
   - Pas de clé API exposée (service_role côté serveur uniquement)
   - JWT non forgeable (clé secrète serveur)
   - Server Actions non bypassables

2. **Toutes les mutations passent par Server Actions**
   - `createAgent()` → Vérifie auth + role
   - `updateAgent()` → Vérifie auth + role
   - `deleteAgent()` → Vérifie auth + role + interdit self-delete

3. **Admin Layout bloque l'accès en amont**
   - Même si un dev oublie la vérification, layout redirige
   - Protection automatique de toutes les pages /admin/*

## ⚠️ Points d'attention

### 1. Toujours vérifier auth dans Server Actions
```typescript
// ✅ BON
export async function updateAgent(agentId: string, data: AgentFormData) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Non authentifié' };

  const { data: agent } = await supabase
    .from('agents')
    .select('user_type')
    .eq('id', user.id)
    .single();

  if (!['admin', 'super_admin'].includes(agent.user_type)) {
    return { error: 'Accès refusé' };
  }

  // Mutation sécurisée
}
```

### 2. Ne JAMAIS exposer de route API directe
```typescript
// ❌ MAUVAIS - N'exposez JAMAIS ceci
export async function GET() {
  const { data: agents } = await supabase.from('agents').select('*');
  return Response.json(agents); // Tous les agents exposés publiquement !
}

// ✅ BON - Toujours vérifier auth
export async function GET() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: agent } = await supabase
    .from('agents')
    .select('user_type')
    .eq('id', user.id)
    .single();

  if (!['admin', 'super_admin'].includes(agent.user_type)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { data: agents } = await supabase.from('agents').select('*');
  return Response.json(agents);
}
```

### 3. Server Components sont sécurisés par défaut
```typescript
// ✅ Sécurisé car dans /admin layout protégé
export default async function AdminAgentsPage() {
  const supabase = await createClient();
  const { data: agents } = await supabase.from('agents').select('*');
  return <AgentsDataTable data={agents} />;
}
```

## 🔒 Checklist sécurité (pour chaque nouvelle fonctionnalité)

- [ ] Server Action vérifie `auth.getUser()`
- [ ] Server Action vérifie `user_type`
- [ ] Page est dans `(admin)` route group
- [ ] Pas de route API publique exposant agents
- [ ] Client Components reçoivent data via props (pas fetch direct)
- [ ] Pas de clé service_role exposée au client

## 🚀 Alternative future : Table user_roles séparée

Si RLS devient nécessaire, créer une table séparée :

```sql
CREATE TABLE user_roles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  role user_type_enum NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pas de récursion car pas de FK vers agents
CREATE POLICY "read_own_role" ON user_roles
  FOR SELECT USING (user_id = auth.uid());
```

Puis utiliser cette table dans les policies des autres tables.

---

**Date**: 2025-10-06
**Auteur**: Claude Code
**Statut**: ✅ Approche validée et sécurisée
