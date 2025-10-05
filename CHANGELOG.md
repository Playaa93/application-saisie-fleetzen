# Changelog - FleetZen Application

Toutes les modifications notables du projet sont documentées dans ce fichier.

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
