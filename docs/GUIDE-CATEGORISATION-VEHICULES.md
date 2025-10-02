# Guide de Catégorisation des Véhicules

## 🎯 Objectif
Résoudre le problème où une même immatriculation apparaissait dans plusieurs catégories différentes (tracteur ET remorque).

## 📋 Solution Mise en Place

### 1. Modification du Schéma Base de Données

**Fichier:** `docs/add-vehicle-category.sql`

- Ajout d'une colonne `vehicle_category` de type ENUM
- Valeurs possibles: `'tracteur'`, `'porteur'`, `'remorque'`, `'ensemble_complet'`, `'autre'`
- Index créé pour performance

**À FAIRE MAINTENANT:**
1. Allez dans **Supabase SQL Editor**
2. Exécutez le fichier `docs/add-vehicle-category.sql`
3. Catégorisez manuellement chaque véhicule:
   ```sql
   UPDATE vehicles SET vehicle_category = 'porteur' WHERE license_plate = 'IJ-789-KL';
   UPDATE vehicles SET vehicle_category = 'tracteur' WHERE license_plate = 'AB-123-CD';
   UPDATE vehicles SET vehicle_category = 'remorque' WHERE license_plate = 'EF-456-GH';
   ```

### 2. Modification de l'API

**Fichier:** `src/app/api/vehicles/route.ts`

- ✅ Ajout du paramètre optionnel `category`
- ✅ Filtrage des véhicules par catégorie
- Utilisation: `/api/vehicles?clientId=xxx&category=tracteur`

### 3. Modifications des Composants

**Fichiers modifiés:**
- ✅ `src/components/interventions/LavageSteps.tsx`
- ⏳ `src/components/interventions/CarburantLivraisonSteps.tsx` (à faire)

**Changements:**
- Ajout de 3 états séparés: `tracteurVehicles`, `remorqueVehicles`, `vehicles`
- 3 useEffect pour charger les véhicules filtrés par catégorie selon le type sélectionné
- Mapping intelligent:
  - **Ensemble complet** → Tracteurs + Remorques
  - **Tracteur seul** → Tracteurs uniquement
  - **Porteur** → Porteurs uniquement
  - **Remorque seule** → Remorques uniquement

## 📊 Flux de Données

```
1. User sélectionne CLIENT
   → Fetch /api/vehicles?clientId=xxx (tous les véhicules)

2. User sélectionne TYPE DE VÉHICULE
   → Si "Ensemble complet":
      - Fetch /api/vehicles?clientId=xxx&category=tracteur
      - Fetch /api/vehicles?clientId=xxx&category=remorque
   → Si "Tracteur seul":
      - Fetch /api/vehicles?clientId=xxx&category=tracteur
   → Si "Porteur":
      - Fetch /api/vehicles?clientId=xxx&category=porteur
   → Si "Remorque seule":
      - Fetch /api/vehicles?clientId=xxx&category=remorque

3. User sélectionne IMMATRICULATION(S)
   → Liste filtrée selon la catégorie
   → Une immatriculation ne peut être dans qu'une seule catégorie ✅
```

## ⚠️ Actions Requises

### Immédiat:
1. **Exécuter le SQL** dans Supabase pour ajouter la colonne
2. **Catégoriser manuellement** les 6 véhicules existants
3. **Appliquer les mêmes modifications** à CarburantLivraisonSteps.tsx

### Vérification:
```sql
-- Vérifier que tous les véhicules sont catégorisés
SELECT
  license_plate,
  make,
  model,
  vehicle_category,
  CASE
    WHEN vehicle_category IS NULL THEN '⚠️ NEEDS CATEGORIZATION'
    ELSE '✅ OK'
  END as status
FROM vehicles
ORDER BY license_plate;
```

## 🎉 Résultat Attendu

Après catégorisation:
- **Client:** Logistique Lyon
- **Type:** Remorque seule
- **Dropdown:** Affiche SEULEMENT les remorques de ce client
- **Plus de conflit:** Un tracteur n'apparaît plus dans le dropdown des remorques ✅

## 📝 Notes Techniques

- Les véhicules non catégorisés (`vehicle_category = NULL`) n'apparaîtront dans AUCUN dropdown filtré
- L'option "Saisie manuelle" reste disponible pour saisir manuellement une immatriculation
- Un message d'avertissement s'affiche si aucun véhicule de la catégorie demandée n'existe pour le client
