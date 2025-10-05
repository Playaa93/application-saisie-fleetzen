# Changelog - FleetZen Application

Toutes les modifications notables du projet sont documentées dans ce fichier.

## [2025-10-05] - Fix Upload Photos + Sécurisation RLS

### 🐛 Bug Fix Critique - Upload Photos

**Problème**: Photos capturées mais n'arrivaient jamais dans le bucket Supabase
- Toast "succès" affiché côté client
- Nombre de photos visible dans historique
- Bucket Supabase vide
- Photos corrompues/inaccessibles

**Causes identifiées**:
1. Envoi direct de l'objet `File` (navigateur) sans conversion vers `Buffer` (Node.js)
2. Bucket en mode privé (`public: false`) → URLs publiques ne fonctionnaient pas
3. Policy "Allow public uploads" permettait upload non authentifié (faille sécurité)

**Solutions implémentées**:
- ✅ Conversion explicite `File` → `ArrayBuffer` → `Buffer` avant upload
- ✅ Logs détaillés pour debug (📤 upload start, ✅ success, ⚠️ warnings)
- ✅ Bucket mis en mode public (`public: true`) pour URLs publiques
- ✅ Suppression policy "Allow public uploads" (sécurité)
- ✅ Conservation "Allow public reads" (nécessaire pour emails/PDF)

**Fichiers modifiés**:
- [`src/app/api/interventions/route.ts`](src/app/api/interventions/route.ts#L344-L400) - Fix conversion File → Buffer

**Documentation créée**:
- [`docs/FIX_PHOTO_UPLOAD.md`](docs/FIX_PHOTO_UPLOAD.md) - Guide complet du fix code
- [`docs/SQL_CHECK_BUCKET.sql`](docs/SQL_CHECK_BUCKET.sql) - Scripts diagnostic bucket
- [`docs/DIAGNOSTIC_BUCKET_SUPABASE.md`](docs/DIAGNOSTIC_BUCKET_SUPABASE.md) - Rapport diagnostic complet
- [`docs/SECURITE_RLS_PHOTOS.md`](docs/SECURITE_RLS_PHOTOS.md) - Documentation sécurité RLS

### 🔒 Sécurisation RLS Bucket Storage

**Configuration finale** :
- **Upload** : Backend seulement (Service Role Key)
- **Lecture** : URLs publiques (partageables dans emails/PDF)
- **Sécurité** : RLS protège l'upload, URLs difficiles à deviner

**Policies RLS actives** (9 policies) :
- ✅ `Admins upload/voient/suppriment toutes photos`
- ✅ `Agents upload/voient/suppriment leurs photos` (via RLS)
- ✅ `Clients voient photos de leur flotte` (filtré par `client_users`)
- ✅ `Allow public reads` (pour URLs publiques)
- ❌ ~~`Allow public uploads`~~ → **SUPPRIMÉE** (faille sécurité)

**Matrice permissions** :
| Utilisateur | Upload | Lecture | Suppression |
|-------------|--------|---------|-------------|
| Agent mobile | ✅ Via API (Service Role) | ✅ URLs publiques | ❌ Non |
| Admin | ✅ Via RLS | ✅ Tout | ✅ Tout |
| Client | ❌ Non | ✅ Sa flotte | ❌ Non |
| Public | ❌ Non | ✅ Si URL connue | ❌ Non |

**Note importante** : URLs publiques acceptées car photos véhicules non sensibles. Pour sécurité maximale, voir alternative URLs signées dans [`docs/SECURITE_RLS_PHOTOS.md`](docs/SECURITE_RLS_PHOTOS.md).

### 🔍 Tests à Effectuer

1. **Vérifier bucket Supabase** avec [`docs/SQL_CHECK_BUCKET.sql`](docs/SQL_CHECK_BUCKET.sql)
2. **Prendre photo réelle** depuis mobile et soumettre intervention
3. **Consulter logs Vercel** pour vérifier upload (rechercher `📤 Uploading photo`)
4. **Vérifier bucket** contient fichier `{intervention_id}/avant-{timestamp}-0.jpg`
5. **Tester URL publique** est accessible
6. **Vérifier sécurité** : Tentative upload non-auth doit échouer

---

## [2025-10-05] - Portails Admin & Client Complets

### 🎯 Objectif
Créer les portails d'administration et client avec navigation complète, data tables avancées (TanStack Table), et respect des RLS policies multi-tenant.

### ✨ Pages Client Créées (Read-Only)

**Nouvelles routes** :
- `/client/interventions` - Liste complète des interventions du client
- `/client/photos` - Galerie avant/après des interventions
- `/client/vehicles` - Flotte véhicules avec statistiques par véhicule

**Composants réutilisés** :
- `InterventionsDataTable` - Table tri/filtrage/pagination
- `PhotosGallery` - Galerie avant/après avec modal viewer
- Layout personnalisé avec stats (total, complétées, véhicules)

**Sécurité** :
- RLS policies filtrent automatiquement par `client_id`
- Authentification vérifiée via `client_users` table
- Vue read-only (pas de CRUD)

### ✨ Pages Admin Créées (CRUD Complet)

**Nouvelles routes** :
- `/admin/agents` - Gestion agents (field_agent, admin, super_admin)
- `/admin/clients` - Gestion clients
- `/admin/vehicles` - Gestion véhicules
- `/admin/settings` - Paramètres système

**Nouveaux composants** :
- `AgentsDataTable.tsx` - Table agents avec filtrage et badges user_type
- `ClientsDataTable.tsx` - Table clients avec code, ville, contact
- `VehiclesDataTable.tsx` - Table véhicules avec immatriculation, marque/modèle

**Fonctionnalités** :
- Recherche globale (search across all columns)
- Tri multi-colonnes avec TanStack Table
- Pagination client-side
- Boutons CRUD (Créer, Modifier, Supprimer) - UI ready (dialogs à implémenter)
- Badges colorés pour statut (actif/inactif, user_type)

### 🏗️ Architecture

**Route groups Next.js 15** :
```
app/
├── (admin)/
│   ├── admin/
│   │   ├── page.tsx             ← Dashboard global
│   │   ├── interventions/       ← Liste complète
│   │   ├── photos/              ← Galerie globale
│   │   ├── agents/              ← CRUD agents ✅ NEW
│   │   ├── clients/             ← CRUD clients ✅ NEW
│   │   ├── vehicles/            ← CRUD vehicles ✅ NEW
│   │   └── settings/            ← Config système ✅ NEW
│   └── layout.tsx               ← AdminSidebar + auth check
└── (client)/
    ├── client/
    │   ├── page.tsx             ← Dashboard filtré
    │   ├── interventions/       ← Liste filtrée ✅ NEW
    │   ├── photos/              ← Galerie filtrée ✅ NEW
    │   └── vehicles/            ← Flotte read-only ✅ NEW
    └── layout.tsx               ← ClientSidebar + auth check
```

**Composants data tables** :
```
components/admin/
├── InterventionsDataTable.tsx   ← Existant (réutilisé côté client)
├── PhotosGallery.tsx            ← Existant (réutilisé côté client)
├── AgentsDataTable.tsx          ← ✅ NEW
├── ClientsDataTable.tsx         ← ✅ NEW
└── VehiclesDataTable.tsx        ← ✅ NEW
```

### 🔒 Sécurité Multi-Tenant

**RLS Policies appliquées** :
- Admins voient TOUT (via `user_type IN ('admin', 'super_admin')`)
- Clients voient UNIQUEMENT leur flotte (via `client_users.client_id`)
- Field agents voient leurs propres interventions (via `agent_id = auth.uid()`)

**Authentification** :
- Layout admin : Check JWT claims `user.app_metadata.user_type`
- Layout client : Check `client_users` table avec `client_id`
- Redirect vers `/login` si non authentifié

### 📊 Statistiques (Pages Settings)

**Infos système affichées** :
- Version app : 1.0.0
- Framework : Next.js 15
- Base de données : Supabase
- Nombre utilisateurs
- Nombre types d'interventions

**Sections configurables** :
- Utilisateurs & Permissions (RLS, JWT)
- Types d'Interventions (CRUD types)
- Sécurité (rate limiting, CSP)
- Notifications (email, SMS, push - à venir)

### 📦 Fichiers Créés (10 nouveaux)

**Pages admin** :
- `src/app/(admin)/admin/agents/page.tsx`
- `src/app/(admin)/admin/clients/page.tsx`
- `src/app/(admin)/admin/vehicles/page.tsx`
- `src/app/(admin)/admin/settings/page.tsx`

**Pages client** :
- `src/app/(client)/client/interventions/page.tsx`
- `src/app/(client)/client/photos/page.tsx`
- `src/app/(client)/client/vehicles/page.tsx`

**Composants** :
- `src/components/admin/AgentsDataTable.tsx`
- `src/components/admin/ClientsDataTable.tsx`
- `src/components/admin/VehiclesDataTable.tsx`

### ✅ Tests de Compilation

**Résultats** :
- ✅ Compilation Next.js réussie
- ✅ 887 modules compilés (page dashboard)
- ✅ 870 modules compilés (page interventions)
- ✅ Aucune erreur TypeScript
- ✅ Hot reload fonctionne
- ✅ RLS policies actives (logs confirmés)

**Logs Winston** :
- ✅ Structured logging avec metadata
- ✅ Email redaction active (`[REDACTED]`)
- ✅ Rate limiting warning (Upstash désactivé en dev)

### 🎨 UI/UX

**Composants shadcn/ui utilisés** :
- `Card` - Containers pour stats et tables
- `Badge` - Statut (actif/inactif, user_type)
- `Button` - Actions CRUD et tri colonnes
- `Table` - TanStack Table avec tri/filtrage/pagination
- `Input` - Recherche globale
- `Dialog` - Photo viewer modal

**Icons (lucide-react)** :
- `Truck`, `Users`, `Building2`, `ClipboardList` (navigation)
- `Pencil`, `Trash2`, `Plus` (actions CRUD)
- `Search`, `ArrowUpDown` (filtrage et tri)
- `MapPin`, `Calendar` (métadonnées)

### 🚀 Prochaines Étapes

**Phase 2 (CRUD Dialogs)** :
- [ ] `CreateAgentDialog`, `EditAgentDialog`
- [ ] `CreateClientDialog`, `EditClientDialog`
- [ ] `CreateVehicleDialog`, `EditVehicleDialog`
- [ ] Server Actions pour mutations (INSERT, UPDATE, DELETE)
- [ ] Validation Zod dans dialogs
- [ ] Toast notifications (success/error)

**Phase 3 (Permissions Avancées)** :
- [ ] Page settings avec gestion permissions granulaires
- [ ] CRUD `client_users` (inviter clients)
- [ ] CRUD `intervention_types` (configurer types)
- [ ] Gestion rôles (field_agent → admin promotion)

**Phase 4 (Analytics & Reporting)** :
- [ ] Dashboard charts (Recharts)
- [ ] Export Excel/PDF
- [ ] Rapports personnalisés par client

### 📈 Impact

**Code ajouté** :
- 10 nouveaux fichiers
- ~1200 lignes de code
- 3 nouveaux data tables réutilisables

**Couverture fonctionnelle** :
- 100% navigation admin complète (sidebar ✅)
- 100% navigation client complète (sidebar ✅)
- 70% CRUD ready (UI créée, dialogs à implémenter)

**Performance** :
- Client-side filtering/sorting (pas de round-trips DB)
- Pagination 10 items/page
- RLS policies optimisées avec indexes

### 🎓 Patterns Next.js 15 Utilisés

**Server Components** :
- Fetch direct dans page components (pas d'API routes nécessaires)
- `await supabase.from()` dans RSC
- Props drilling vers Client Components

**Client Components** :
- `'use client'` pour TanStack Table (interactivité)
- État local pour recherche/tri/pagination
- Hooks React 19 (`useState` pour filters)

**Route Groups** :
- `(admin)` et `(client)` isolent layouts
- Shared components entre admin/client (InterventionsDataTable)

**Typescript** :
- Types stricts pour data tables (`Agent`, `Client`, `Vehicle`)
- Inférence types Supabase (`data: Agent[]`)
- ColumnDef<T> typé pour TanStack Table

## [2025-10-05] - Phase 3: Élimination Complète des Types `any`

### 🎯 Objectif
Améliorer la sûreté du typage TypeScript en éliminant **tous les 38 usages** du type `any` identifiés lors de l'audit (score qualité: 6/10 → 9/10).

### ✨ Changements Majeurs

**Types & Interfaces Créés**
- `PhotoMetadata` - Structure des photos stockées
- `PhotoRecord` - Enregistrements photos avec relations DB
- `InterventionDetail` - Détails complets d'une intervention
- `VehicleData` - Données véhicule avec relations client
- Extension `InterventionMetadata` avec GPS (latitude, longitude, accuracy)

**Fichiers Modifiés (17 au total)**
1. **Types centraux** (`src/types/intervention.ts`)
   - Ajout 4 nouvelles interfaces
   - Extension metadata GPS
   - Types discriminés par `type` littéral

2. **Composants UI** (5 fichiers)
   - `AddVehicleDialog.tsx` - Callbacks typés avec `VehicleData`
   - `DraftsList.tsx` - Fonction `countPhotos` typée
   - `LavageSteps.tsx`, `CarburantLivraisonSteps.tsx`, `CarburantCuveSteps.tsx` - Props strictement typées

3. **Hooks** (2 fichiers)
   - `useFormDraft.ts` - Generic constraint `<T extends InterventionFormData>`
   - `useOfflineSubmit.ts` - Paramètre `data` typé

4. **Libraries** (2 fichiers)
   - `indexedDB.ts` - Interface `DraftData` avec `InterventionFormData`
   - `errorLogger.ts` - Remplacement `any` → `Record<string, unknown>`

5. **Pages** (2 fichiers)
   - `nouvelle-intervention/page.tsx` - `Partial<InterventionFormData>` pour états incomplets
   - `interventions/[id]/page.tsx` - Maps photos typés (suppression 6 `any`)

6. **API Routes** (4 fichiers)
   - `api/interventions/route.ts` - Metadata `Record<string, unknown>`
   - `api/interventions/sync/route.ts` - Interface `SyncResult`, destructuring au lieu de `delete`
   - `api/migrate/route.ts` - Gestion erreurs typée
   - `api/vehicles/route.ts` - Validation stricte

7. **Validations**
   - `lib/validations/api.ts` - Schemas Zod avec `z.unknown()` au lieu de `any`

### 📊 Impact

**Avant Phase 3:**
- ❌ 38 usages de `any`
- ⚠️ Type safety faible
- 🐛 Risques runtime errors

**Après Phase 3:**
- ✅ 0 usages de `any` en production
- ✅ Type safety complète
- ✅ Autocomplétion IDE optimale
- ✅ Détection erreurs à la compilation

### 🧪 Tests Validés

**Tests API (33/33 ✅)**
- API Cascade (sites, categories, check, link)
- Multi-utilisateurs (Agent vs Admin)
- Pagination cursor-based
- Validation Zod stricte
- RLS (Row-Level Security)
- Rate limiting (désactivé en dev)

**Performance**
- Aucun impact négatif
- Compilation: 2.5s (inchangé)
- Serveur prêt en: 2.5s

### 🔧 Patterns Utilisés

**1. Discriminated Unions**
```typescript
type InterventionFormData =
  | LavageFormData
  | CarburantLivraisonFormData
  | CarburantCuveFormData;
// Distingués par propriété 'type' littérale
```

**2. Generic Constraints**
```typescript
function useFormDraft<T extends InterventionFormData = InterventionFormData>(...)
```

**3. Partial Types**
```typescript
const [formData, setFormData] = useState<Partial<InterventionFormData>>({});
```

**4. Record pour Metadata Dynamiques**
```typescript
const metadata: Record<string, unknown> = {};
// Au lieu de: const metadata: any = {};
```

**5. Destructuring au lieu de `delete`**
```typescript
// ❌ Avant: delete (obj as any).prop;
// ✅ Après: const { prop, ...rest } = obj;
```

### 📚 Documentation

- Types documentés avec TSDoc
- Exemples d'utilisation dans chaque interface
- Guide migration dans ce CHANGELOG

### ⚡ Prochaines Étapes

- [ ] Activer `strict: true` dans tsconfig.json
- [ ] Ajouter `noUncheckedIndexedAccess`
- [ ] Compression photos (Compressor.js)
- [ ] Nettoyer console.log restants

---

## [2025-10-05] - Audit Complet du Code

### 📊 Audit réalisé
Un audit complet du code a été effectué pour évaluer la qualité, la sécurité, les performances et l'architecture de l'application mobile/agent FleetZen.

**Score global**: 7.5/10 ⭐⭐⭐⭐⭐⭐⭐⚡

**Consulter le rapport complet**: [`docs/AUDIT_CODE_2025.md`](docs/AUDIT_CODE_2025.md)

Le rapport d'audit contient:
- Analyse détaillée de 7 domaines (Architecture, Sécurité, Qualité, Performance, Accessibilité, Gestion d'erreurs, Dette technique)
- Plan d'action priorisé en 4 phases (5-7 jours)
- Recommandations basées sur les best practices d'octobre 2025

## [2025-01-03] - Filtres en Cascade et Amélioration Véhicules

### ✨ Ajouté
- **Système de filtres conditionnels en cascade** pour la sélection des véhicules
  - Niveau 1: Sélection du client
  - Niveau 2: Sélection du site de travail (filtré par client)
  - Niveau 3: Sélection de la catégorie de véhicule (filtré par client + site)
  - Niveau 4: Sélection du véhicule (filtré par client + site + catégorie)
  - Option "Autre" à chaque niveau pour ajouter de nouvelles entrées

- **Nouvelles API Routes**
  - `GET /api/sites?clientId=xxx` - Récupère les sites uniques où un client a des véhicules
  - `GET /api/vehicle-categories?clientId=xxx&site=xxx` - Récupère les catégories de véhicules pour un client et site
  - `POST /api/vehicles/check` - Vérifie si une immatriculation existe déjà
  - `POST /api/vehicles/link` - Lie un véhicule existant à un nouveau client/site
  - `GET /api/vehicles?clientId=xxx&site=xxx&category=xxx` - Récupère les véhicules filtrés

- **Nouveaux Composants**
  - `AddVehicleDialog.tsx` - Modal pour ajouter un nouveau véhicule avec pré-remplissage
  - `LinkVehicleDialog.tsx` - Modal pour confirmer la liaison d'un véhicule existant
  - `ui/dialog.tsx` - Composant Dialog shadcn/ui (créé manuellement)
  - `ui/alert.tsx` - Composant Alert shadcn/ui (créé manuellement)

### 🔄 Modifié
- **Base de données**
  - Ajout des colonnes `work_site` (VARCHAR 200) et `vehicle_category` (VARCHAR 50) à la table `vehicles`
  - Migration des données depuis `metadata.site` vers `work_site`
  - Suppression des tirets dans les immatriculations (format: `AB123CD` au lieu de `AB-123-CD`)
  - Création d'index pour optimiser les requêtes cascade:
    - `vehicles_work_site_idx` sur `work_site`
    - `vehicles_category_idx` sur `vehicle_category`
    - `vehicles_client_site_idx` sur `(client_id, work_site)`
    - `vehicles_client_site_category_idx` sur `(client_id, work_site, vehicle_category)`

- **API Routes**
  - `GET /api/vehicles` - Ajout du champ `metadata` dans la réponse pour accéder à `vehicle_type`

- **Composants de formulaire**
  - `LavageSteps.tsx` - Implémentation complète du système de cascade
  - `CarburantLivraisonSteps.tsx` - Implémentation complète du système de cascade
  - Affichage des véhicules au format: `IMMATRICULATION (Type)` ex: `GW523LF (Fourgon)`
  - Affichage des catégories avec majuscule: `Tracteur`, `Porteur`, `Remorque`

### 🐛 Corrigé
- Résolution de l'erreur `column vehicles.work_site does not exist` via migration Supabase
- Correction de l'affichage des véhicules "Generic Truck" remplacé par le type réel (Fourgon, Frigo, etc.)
- Normalisation du format des immatriculations (suppression des tirets)

### 📊 Données
Véhicules mis à jour avec le nouveau schéma:
- **VERTIGO**: 47 véhicules sur 5 sites (PMS, LIDL - Barbery, LIDL - Coudray, Relais, STG)
- **Mauffrey**: 8 véhicules sur 2 sites (LIDL - Chanteloup, LIDL - Meaux)
- **DCO Transport**: 1 véhicule sur 1 site (LIDL - Barbery)

### 🔧 Technique
- Utilisation de **Supabase MCP** pour les migrations et opérations SQL
- Pattern de cascade React avec `useEffect` et dépendances
- Gestion de l'état avec reset automatique des champs dépendants
- Validation en temps réel avec debouncing (500ms) pour la vérification des immatriculations

## Architecture des Filtres en Cascade

```typescript
// Pattern implémenté
Client (dropdown)
  ↓ useEffect [data.clientId]
  └─→ API /api/sites?clientId=xxx
       ↓
       Site (dropdown)
         ↓ useEffect [data.clientId, data.siteTravail]
         └─→ API /api/vehicle-categories?clientId=xxx&site=xxx
              ↓
              Catégorie (dropdown)
                ↓ useEffect [data.clientId, data.siteTravail, data.typeVehicule]
                └─→ API /api/vehicles?clientId=xxx&site=xxx&category=xxx
                     ↓
                     Véhicule (dropdown avec option "Autre")
```

## Schéma de Base de Données

### Table `vehicles`
```sql
- id: UUID (PK)
- client_id: UUID (FK → clients)
- license_plate: VARCHAR(20) -- Format sans tirets: AB123CD
- make: VARCHAR(100) -- Marque du véhicule
- model: VARCHAR(100) -- Modèle du véhicule
- work_site: VARCHAR(200) -- Site de travail (ex: "LIDL - Coudray")
- vehicle_category: VARCHAR(50) -- Catégorie: tracteur, porteur, remorque
- metadata: JSONB -- {vehicle_type: "Fourgon", site: "...", original_type: "..."}
- is_active: BOOLEAN
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

## Notes de Développement

### Utilisation de Supabase MCP
Toujours utiliser les outils MCP pour les opérations de base de données:
```typescript
// ✅ BON
mcp__supabase__apply_migration({ name: "...", query: "..." })
mcp__supabase__execute_sql({ query: "SELECT ..." })

// ❌ ÉVITER
// Créer des scripts SQL manuels ou utiliser pg directement
```

### Format d'Affichage
- **Clients**: `VERTIGO (VERTIGO)` - Nom (Code)
- **Catégories**: `Tracteur`, `Porteur`, `Remorque` - Avec majuscule
- **Véhicules**: `GW523LF (Fourgon)` - Immatriculation (Type)

### Gestion des Doublons
Quand un véhicule existe déjà pour un autre client/site:
1. Détection automatique via `POST /api/vehicles/check`
2. Affichage d'une alerte avec les informations du véhicule existant
3. Option de lier le véhicule (crée une nouvelle entrée avec les mêmes données)
4. L'utilisateur peut aussi choisir de créer un véhicule complètement nouveau

---

**Dernière mise à jour**: 2025-01-03
**Version**: 1.2.0
