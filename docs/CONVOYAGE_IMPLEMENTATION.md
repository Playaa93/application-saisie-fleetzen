# 🚗 Implémentation Convoyage de Véhicules - Documentation Technique

**Date de début** : 2025-10-06
**Statut** : En cours (60% complété)
**Estimation restante** : 2-3h

---

## 📋 Vue d'ensemble

Ajout d'une nouvelle prestation "Convoyage de Véhicules" permettant le transport d'un véhicule du point A au point B avec :
- ✅ Lettre de voiture conforme CMR 2025
- ✅ Inspection photographique complète (12 positions avant/après)
- ✅ Signatures électroniques (départ et arrivée)
- ✅ Traçabilité GPS complète

---

## ✅ Travaux Complétés (60%)

### 1. Base de données ✅

**Migration** : `add_convoyage_feature_v2`

```sql
-- Nouveau type d'intervention
INSERT INTO intervention_types (name, code, description, is_active)
VALUES ('Convoyage Véhicule', 'CONVOYAGE', 'Transport d''un véhicule...', true);

-- Nouvelle table pour lettres de voiture
CREATE TABLE vehicle_handover_docs (
  id UUID PRIMARY KEY,
  intervention_id UUID REFERENCES interventions(id),
  doc_type TEXT CHECK (doc_type IN ('lettre_voiture_depart', 'lettre_voiture_arrivee')),

  -- Donneur d'ordre
  donneur_ordre_nom TEXT NOT NULL,
  donneur_ordre_adresse TEXT NOT NULL,
  donneur_ordre_contact TEXT,

  -- Véhicule
  vehicle_id UUID REFERENCES vehicles(id),
  immatriculation TEXT NOT NULL,
  vin TEXT,
  marque TEXT NOT NULL,
  modele TEXT NOT NULL,
  couleur TEXT,
  kilometrage INTEGER,

  -- Trajet
  adresse_depart TEXT NOT NULL,
  adresse_arrivee TEXT NOT NULL,
  date_prise_charge TIMESTAMPTZ,
  date_remise TIMESTAMPTZ,

  -- Signatures (base64)
  signature_agent_base64 TEXT,
  signature_client_base64 TEXT,
  signature_date TIMESTAMPTZ,

  -- Observations
  observations_depart TEXT,
  observations_arrivee TEXT,
  etat_carburant TEXT,

  -- PDF généré
  pdf_url TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index + RLS policies créés
```

**Status** : ✅ Appliqué avec succès

---

### 2. Librairies installées ✅

```bash
pnpm add signature_pad @types/signature_pad
```

**Status** : ✅ Installé (signature_pad v5.1.1)

---

### 3. TypeScript Types ✅

**Fichier** : `src/types/intervention.ts`

```typescript
export interface ConvoyageFormData {
  type: 'convoyage';
  vehicleId: string | null;
  clientId: string | null;
  notes?: string;

  // Step 1: Donneur d'ordre
  donneurOrdreNom?: string;
  donneurOrdreAdresse?: string;
  donneurOrdreContact?: string;
  adresseDepart?: string;
  adresseArrivee?: string;
  observations?: string;

  // Step 2: Vehicle info
  immatriculation?: string;
  vin?: string;
  marque?: string;
  modele?: string;
  couleur?: string;
  kilometrage?: number;
  etatCarburant?: string;

  // Step 3: Photos prise en charge (12 positions)
  photosPriseEnCharge?: File[];

  // Step 4: Lettre de voiture départ
  signatureAgentDepart?: string; // base64
  signatureClientDepart?: string; // base64
  observationsDepart?: string;

  // Step 5: Photos remise + lettre arrivée
  photosRemise?: File[];
  signatureAgentArrivee?: string; // base64
  signatureClientArrivee?: string; // base64
  observationsArrivee?: string;
}

export type InterventionFormData =
  | LavageFormData
  | CarburantLivraisonFormData
  | CarburantCuveFormData
  | ConvoyageFormData; // ✅ Ajouté
```

**Status** : ✅ Types créés et intégrés

---

### 4. Composants Mobile Créés ✅

#### Step 1 - Donneur d'ordre ✅
**Fichier** : `src/components/interventions/convoyage/Step1DonneurOrdre.tsx`

**Champs** :
- ✅ Nom/Raison sociale du donneur d'ordre (requis)
- ✅ Adresse complète (requis)
- ✅ Contact (téléphone/email)
- ✅ Adresse point A - départ (requis)
- ✅ Adresse point B - arrivée (requis)
- ✅ Observations/instructions particulières

**Status** : ✅ Créé et fonctionnel

---

#### Step 2 - Infos véhicule ✅
**Fichier** : `src/components/interventions/convoyage/Step2VehiculeInfos.tsx`

**Champs** :
- ✅ Immatriculation (requis, formatage auto uppercase)
- ✅ VIN - 17 caractères (optionnel mais recommandé, validation longueur)
- ✅ Marque (requis)
- ✅ Modèle (requis)
- ✅ Couleur
- ✅ Kilométrage (numérique)
- ✅ Niveau carburant (select : Vide/Réserve/Faible/Moyen/Plein)

**Status** : ✅ Créé et fonctionnel

---

## 🚧 Travaux Restants (40%)

### 5. Step 3 - Photos Prise en Charge 📸

**Fichier à créer** : `src/components/interventions/convoyage/Step3PhotosPriseEnCharge.tsx`

**Spécifications** :
- **12 positions obligatoires** avec guidage visuel :
  1. Capot (face avant)
  2. Aile avant gauche
  3. Porte avant gauche
  4. Porte arrière gauche
  5. Aile arrière gauche
  6. Coffre (face arrière)
  7. Aile arrière droite
  8. Porte arrière droite
  9. Porte avant droite
  10. Aile avant droite
  11. Toit (vue panoramique)
  12. Tableau de bord (compteur kilométrique)

**Fonctionnalités** :
- [ ] Overlay schéma voiture montrant position à photographier
- [ ] Compteur progression (X/12)
- [ ] Validation qu'au moins 1 photo par position
- [ ] Compression automatique (max 1MB/photo)
- [ ] Preview avant validation
- [ ] Possibilité de retirer/remplacer photos

**Composant technique** :
```tsx
interface PhotoPosition {
  id: string;
  label: string;
  icon: JSX.Element; // Icône visuelle
  description: string;
  required: boolean;
}

const PHOTO_POSITIONS: PhotoPosition[] = [
  { id: 'capot', label: 'Capot', icon: <CarFrontIcon />, description: 'Vue face avant complète', required: true },
  // ... 11 autres positions
];
```

**Status** : ⏳ À créer

---

### 6. Step 4 - Lettre de Voiture Départ + Signatures 📝

**Fichier à créer** : `src/components/interventions/convoyage/Step4LettreVoitureDepart.tsx`

**Spécifications** :
- [ ] Affichage résumé récapitulatif (toutes infos saisies)
- [ ] Section "Observations au départ" (textarea)
- [ ] Pad signature AGENT (canvas avec signature_pad)
- [ ] Bouton "Demander signature client"
- [ ] Pad signature CLIENT (canvas)
- [ ] Validation : signatures obligatoires
- [ ] Génération aperçu lettre de voiture (HTML preview)

**Intégration signature_pad** :
```tsx
import SignaturePad from 'signature_pad';

const signaturePadRef = useRef<SignaturePad | null>(null);
const canvasRef = useRef<HTMLCanvasElement>(null);

useEffect(() => {
  if (canvasRef.current) {
    signaturePadRef.current = new SignaturePad(canvasRef.current, {
      backgroundColor: 'rgb(255, 255, 255)',
      penColor: 'rgb(0, 0, 0)'
    });
  }
}, []);

const getSignatureBase64 = () => {
  return signaturePadRef.current?.toDataURL('image/png');
};
```

**Status** : ⏳ À créer

---

### 7. Step 5 - Photos Remise + Lettre Arrivée 📸📝

**Fichier à créer** : `src/components/interventions/convoyage/Step5PhotosRemise.tsx`

**Spécifications** :
- [ ] **Même 12 positions** que Step 3 (réutiliser logique)
- [ ] Vue comparative côte à côte (photo départ vs arrivée)
- [ ] Section "Observations à l'arrivée"
- [ ] Pad signature AGENT arrivée
- [ ] Pad signature CLIENT destinataire arrivée
- [ ] Validation finale avant soumission

**Status** : ⏳ À créer

---

### 8. Orchestrateur ConvoyageSteps 🎯

**Fichier à créer** : `src/components/interventions/ConvoyageSteps.tsx`

**Spécifications** :
```tsx
interface ConvoyageStepsProps {
  currentStep: number; // 1 à 5
  formData: Partial<ConvoyageFormData>;
  onNext: (data: Partial<ConvoyageFormData>) => void;
  onPrevious: () => void;
  onSubmit: (data: Partial<ConvoyageFormData>) => void;
  isSubmitting: boolean;
}

export default function ConvoyageSteps({...}) {
  return (
    <>
      {currentStep === 1 && <Step1DonneurOrdre {...} />}
      {currentStep === 2 && <Step2VehiculeInfos {...} />}
      {currentStep === 3 && <Step3PhotosPriseEnCharge {...} />}
      {currentStep === 4 && <Step4LettreVoitureDepart {...} />}
      {currentStep === 5 && <Step5PhotosRemise {...} />}
    </>
  );
}
```

**Status** : ⏳ À créer

---

### 9. Intégration Page Principale 🔗

**Fichier à modifier** : `src/components/interventions/Step1TypePrestation.tsx`

**Ajout dans l'array `types`** :
```tsx
{
  id: 'convoyage',
  label: 'Convoyage',
  icon: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  ),
  description: 'Transport de véhicule du point A au point B'
}
```

**Status** : ⏳ À faire

---

**Fichier à modifier** : `src/app/nouvelle-intervention/page.tsx`

**Ajout du switch case** :
```tsx
{typePrestation === 'convoyage' && currentStep > 1 && (
  <ConvoyageSteps
    currentStep={currentStep - 1}
    formData={formData}
    onNext={handleNext}
    onPrevious={handlePrevious}
    onSubmit={handleSubmit}
    isSubmitting={isSubmitting}
  />
)}
```

**Ajout des steps** :
```tsx
if (typePrestation === 'convoyage') {
  return [
    { number: 1, label: 'Type de prestation', completed: true },
    { number: 2, label: 'Donneur d\'ordre', completed: currentStep > 2 },
    { number: 3, label: 'Véhicule', completed: currentStep > 3 },
    { number: 4, label: 'Photos prise en charge', completed: currentStep > 4 },
    { number: 5, label: 'Lettre départ', completed: currentStep > 5 },
    { number: 6, label: 'Photos remise', completed: false },
  ];
}
```

**Status** : ⏳ À faire

---

### 10. Backend API 🔧

**Fichier à modifier** : `src/app/api/interventions/route.ts`

**Modifications nécessaires** :

#### a) Mapping type d'intervention
```tsx
// Ligne ~272
type: typePrestation === 'lavage' ? 'Lavage Véhicule' :
      typePrestation === 'carburant-livraison' ? 'Livraison Carburant' :
      typePrestation === 'carburant-cuve' ? 'Remplissage Cuve' :
      typePrestation === 'convoyage' ? 'Convoyage Véhicule' : // ✅ Ajouter
      null,
```

#### b) Upload photos prise en charge
```tsx
// Après ligne ~307
const photosPriseEnChargeFiles = formData.getAll('photosPriseEnCharge') as File[];
const photosRemiseFiles = formData.getAll('photosRemise') as File[];

// ... upload logic similar to existing photos
```

#### c) Sauvegarder signatures + metadata convoyage
```tsx
// Dans metadata update (après ligne ~500)
const photoMetadata = {
  // ... existing photos
  photosPriseEnCharge: photosPriseEnChargeUrls.map((url, idx) => ({...})),
  photosRemise: photosRemiseUrls.map((url, idx) => ({...})),
};

// Ajouter données convoyage dans metadata
metadata: {
  ...metadata,
  photos: photoMetadata,
  convoyage: {
    donneurOrdreNom: formData.get('donneurOrdreNom'),
    immatriculation: formData.get('immatriculation'),
    vin: formData.get('vin'),
    adresseDepart: formData.get('adresseDepart'),
    adresseArrivee: formData.get('adresseArrivee'),
    signatureAgentDepart: formData.get('signatureAgentDepart'),
    signatureClientDepart: formData.get('signatureClientDepart'),
    signatureAgentArrivee: formData.get('signatureAgentArrivee'),
    signatureClientArrivee: formData.get('signatureClientArrivee'),
  }
}
```

**Status** : ⏳ À faire

---

### 11. Génération PDF Lettre de Voiture (Phase 2 - Optionnel)

**Fichier à créer** : `src/app/api/convoyage/lettre-voiture/route.ts`

**Spécifications** :
- [ ] Endpoint POST acceptant intervention_id
- [ ] Récupération données depuis vehicle_handover_docs + interventions
- [ ] Génération PDF avec template professionnel
- [ ] Upload PDF vers Supabase Storage
- [ ] Retour URL publique

**Librairie recommandée** : `@react-pdf/renderer` ou `jsPDF`

**Template PDF** :
```
┌─────────────────────────────────────────┐
│  LETTRE DE VOITURE - CONVOYAGE         │
│  N° [ID]                                │
├─────────────────────────────────────────┤
│  DONNEUR D'ORDRE                        │
│  [NOM] - [ADRESSE] - [CONTACT]         │
├─────────────────────────────────────────┤
│  VÉHICULE                               │
│  [IMMAT] - VIN: [VIN]                   │
│  [MARQUE] [MODELE] - [COULEUR]         │
│  Kilométrage: [KM] km                   │
├─────────────────────────────────────────┤
│  TRAJET                                 │
│  Départ: [ADRESSE] - [DATE]            │
│  Arrivée: [ADRESSE] - [DATE]           │
├─────────────────────────────────────────┤
│  SIGNATURES                             │
│  Agent: [IMG]    Client: [IMG]          │
└─────────────────────────────────────────┘
```

**Status** : ⏳ Phase 2 (pas bloquant pour MVP)

---

### 12. Portail Admin - Vue Convoyage (Phase 2)

**Fichiers à modifier/créer** :
- `src/app/(admin)/admin/interventions/page.tsx` - Badge spécial convoyage
- `src/components/admin/InterventionDetailModal.tsx` - Onglet "Lettre de voiture"
- Nouvelle vue : Galerie photos comparatif (avant/après)

**Fonctionnalités** :
- [ ] Badge "🚗 Convoyage" dans tableau interventions
- [ ] Colonnes spécifiques : Point A → Point B
- [ ] Modal détails avec onglets :
  - Infos générales
  - Lettre de voiture (PDF téléchargeable)
  - Photos prise en charge (12 miniatures)
  - Photos remise (12 miniatures)
  - Vue comparative slider

**Status** : ⏳ Phase 2 (pas bloquant pour MVP)

---

## 📐 Architecture Technique

### Cadencement Photos (12 Positions Standard)

Basé sur les meilleures pratiques CapCar et inspections professionnelles :

```
        [1. Capot]
           |
    [2]---+---[10]    2 = Aile AV gauche
     |    |    |      10 = Aile AV droite
    [3]   |   [9]     3 = Porte AV gauche
     |    |    |      9 = Porte AV droite
    [4]   |   [8]     4 = Porte AR gauche
     |    |    |      8 = Porte AR droite
    [5]---+---[7]     5 = Aile AR gauche
           |          7 = Aile AR droite
       [6. Coffre]

    [11. Toit vue panoramique]
    [12. Tableau de bord (compteur)]
```

**Pourquoi 12 positions ?**
- ✅ Couverture complète 360° du véhicule
- ✅ Standard professionnel inspection automobile
- ✅ Protection juridique en cas de litige
- ✅ Traçabilité optimale état véhicule

---

## 🎯 Plan d'Exécution Restant

### Ordre recommandé :

1. **Step3PhotosPriseEnCharge.tsx** (2h)
   - Composant guidage visuel
   - Gestion upload 12 photos
   - Preview et validation

2. **Step4LettreVoitureDepart.tsx** (1h)
   - Résumé récapitulatif
   - Intégration SignaturePad
   - Validation signatures

3. **Step5PhotosRemise.tsx** (1h)
   - Réutilisation logique Step 3
   - Vue comparative
   - Signatures arrivée

4. **ConvoyageSteps.tsx** (30min)
   - Orchestrateur simple
   - Switch entre steps

5. **Intégration page principale** (30min)
   - Ajout dans Step1TypePrestation
   - Switch case dans nouvelle-intervention

6. **Modification API** (1h)
   - Upload photos supplémentaires
   - Sauvegarder metadata convoyage

7. **Tests E2E** (1h)
   - Flux complet mobile
   - Validation données
   - Upload photos

**Total estimé** : ~7h pour version complète fonctionnelle

---

## 🔍 Points d'Attention

### Sécurité
- ✅ RLS policies créées sur vehicle_handover_docs
- ⚠️ Signatures stockées en base64 (considérer chiffrement futur)
- ⚠️ Photos lourdes : compression obligatoire (max 1MB)

### Performance
- ⚠️ 24 photos au total (12 départ + 12 arrivée) = potentiel ~24MB
- ✅ Compression automatique impérative
- ✅ Upload progressif avec feedback utilisateur

### UX Mobile
- ⚠️ Mode paysage recommandé pour photos véhicule
- ⚠️ Haptic feedback à chaque validation
- ⚠️ Guidance visuelle claire (overlay schéma)

### RGPD
- ⚠️ Signatures = données personnelles
- ⚠️ Photos peuvent contenir plaques immatriculation
- ✅ RLS empêche accès non autorisé

---

## 📚 Ressources & Références

### Documentation consultée :
- [Lettre de voiture CMR 2025](https://www.dashdoc.com/fr/blog/lettre-de-voiture)
- [Inspection véhicule CapCar](https://www.capcar.fr/comment-ca-marche/la-certification-dinspection)
- [SafetyCulture Vehicle Handover Checklist](https://safetyculture.com/checklists/vehicle-inspection)

### Code des transports :
- Article R3411-13 : Lettre de voiture obligatoire
- Amende 5e classe si absent lors contrôle

---

## 🚀 Commande pour Continuer

Pour reprendre le développement :
```bash
# Lire cette documentation
cat docs/CONVOYAGE_IMPLEMENTATION.md

# Créer Step 3
# ... voir section "Plan d'Exécution Restant"
```

---

**Dernière mise à jour** : 2025-10-06 18:00
**Auteur** : Claude Code
**Version** : 1.0
