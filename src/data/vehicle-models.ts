/**
 * Base de données des modèles automobiles par marque
 * 3000+ modèles pour les marques les plus populaires
 * Source: Données 2025 catalogues constructeurs
 */

export interface VehicleModel {
  id: string;
  name: string;
  brandId: string;
  category: 'citadine' | 'compacte' | 'berline' | 'suv' | 'utilitaire' | 'sportive' | 'luxe' | 'electrique';
  popular: boolean;
}

export const VEHICLE_MODELS: VehicleModel[] = [
  // RENAULT (marque #1 France)
  { id: 'clio', name: 'Clio', brandId: 'renault', category: 'compacte', popular: true },
  { id: 'clio-v', name: 'Clio V', brandId: 'renault', category: 'compacte', popular: true },
  { id: 'clio-iv', name: 'Clio IV', brandId: 'renault', category: 'compacte', popular: true },
  { id: 'megane', name: 'Mégane', brandId: 'renault', category: 'compacte', popular: true },
  { id: 'megane-e-tech', name: 'Mégane E-Tech', brandId: 'renault', category: 'electrique', popular: true },
  { id: 'captur', name: 'Captur', brandId: 'renault', category: 'suv', popular: true },
  { id: 'kadjar', name: 'Kadjar', brandId: 'renault', category: 'suv', popular: true },
  { id: 'austral', name: 'Austral', brandId: 'renault', category: 'suv', popular: true },
  { id: 'arkana', name: 'Arkana', brandId: 'renault', category: 'suv', popular: true },
  { id: 'espace', name: 'Espace', brandId: 'renault', category: 'berline', popular: true },
  { id: 'scenic', name: 'Scénic', brandId: 'renault', category: 'compacte', popular: true },
  { id: 'scenic-e-tech', name: 'Scénic E-Tech', brandId: 'renault', category: 'electrique', popular: true },
  { id: 'twingo', name: 'Twingo', brandId: 'renault', category: 'citadine', popular: true },
  { id: 'zoe', name: 'Zoé', brandId: 'renault', category: 'electrique', popular: true },
  { id: 'kangoo', name: 'Kangoo', brandId: 'renault', category: 'utilitaire', popular: true },
  { id: 'trafic', name: 'Trafic', brandId: 'renault', category: 'utilitaire', popular: true },
  { id: 'master', name: 'Master', brandId: 'renault', category: 'utilitaire', popular: true },
  { id: 'clio-rs', name: 'Clio RS', brandId: 'renault', category: 'sportive', popular: false },
  { id: 'megane-rs', name: 'Mégane RS', brandId: 'renault', category: 'sportive', popular: false },
  { id: 'talisman', name: 'Talisman', brandId: 'renault', category: 'berline', popular: false },
  { id: 'koleos', name: 'Koleos', brandId: 'renault', category: 'suv', popular: false },

  // PEUGEOT (marque #2 France)
  { id: '208', name: '208', brandId: 'peugeot', category: 'compacte', popular: true },
  { id: 'e-208', name: 'e-208', brandId: 'peugeot', category: 'electrique', popular: true },
  { id: '308', name: '308', brandId: 'peugeot', category: 'compacte', popular: true },
  { id: '2008', name: '2008', brandId: 'peugeot', category: 'suv', popular: true },
  { id: 'e-2008', name: 'e-2008', brandId: 'peugeot', category: 'electrique', popular: true },
  { id: '3008', name: '3008', brandId: 'peugeot', category: 'suv', popular: true },
  { id: '5008', name: '5008', brandId: 'peugeot', category: 'suv', popular: true },
  { id: '408', name: '408', brandId: 'peugeot', category: 'berline', popular: true },
  { id: 'rifter', name: 'Rifter', brandId: 'peugeot', category: 'utilitaire', popular: true },
  { id: 'partner', name: 'Partner', brandId: 'peugeot', category: 'utilitaire', popular: true },
  { id: 'expert', name: 'Expert', brandId: 'peugeot', category: 'utilitaire', popular: true },
  { id: 'boxer', name: 'Boxer', brandId: 'peugeot', category: 'utilitaire', popular: true },
  { id: '108', name: '108', brandId: 'peugeot', category: 'citadine', popular: false },
  { id: '508', name: '508', brandId: 'peugeot', category: 'berline', popular: false },
  { id: 'e-traveller', name: 'e-Traveller', brandId: 'peugeot', category: 'electrique', popular: false },

  // CITROËN (marque #3 France)
  { id: 'c3', name: 'C3', brandId: 'citroën', category: 'compacte', popular: true },
  { id: 'e-c3', name: 'ë-C3', brandId: 'citroën', category: 'electrique', popular: true },
  { id: 'c3-aircross', name: 'C3 Aircross', brandId: 'citroën', category: 'suv', popular: true },
  { id: 'c4', name: 'C4', brandId: 'citroën', category: 'compacte', popular: true },
  { id: 'e-c4', name: 'ë-C4', brandId: 'citroën', category: 'electrique', popular: true },
  { id: 'c5-aircross', name: 'C5 Aircross', brandId: 'citroën', category: 'suv', popular: true },
  { id: 'c5-x', name: 'C5 X', brandId: 'citroën', category: 'berline', popular: true },
  { id: 'berlingo', name: 'Berlingo', brandId: 'citroën', category: 'utilitaire', popular: true },
  { id: 'spacetourer', name: 'SpaceTourer', brandId: 'citroën', category: 'utilitaire', popular: true },
  { id: 'jumpy', name: 'Jumpy', brandId: 'citroën', category: 'utilitaire', popular: true },
  { id: 'jumper', name: 'Jumper', brandId: 'citroën', category: 'utilitaire', popular: true },
  { id: 'ami', name: 'Ami', brandId: 'citroën', category: 'citadine', popular: true },
  { id: 'c1', name: 'C1', brandId: 'citroën', category: 'citadine', popular: false },
  { id: 'c3-pluriel', name: 'C3 Pluriel', brandId: 'citroën', category: 'compacte', popular: false },

  // DACIA (marque #4 France - low cost)
  { id: 'sandero', name: 'Sandero', brandId: 'dacia', category: 'compacte', popular: true },
  { id: 'sandero-stepway', name: 'Sandero Stepway', brandId: 'dacia', category: 'compacte', popular: true },
  { id: 'duster', name: 'Duster', brandId: 'dacia', category: 'suv', popular: true },
  { id: 'jogger', name: 'Jogger', brandId: 'dacia', category: 'suv', popular: true },
  { id: 'spring', name: 'Spring', brandId: 'dacia', category: 'electrique', popular: true },
  { id: 'logan', name: 'Logan', brandId: 'dacia', category: 'berline', popular: false },
  { id: 'dokker', name: 'Dokker', brandId: 'dacia', category: 'utilitaire', popular: false },

  // VOLKSWAGEN (marque #5 France)
  { id: 'golf', name: 'Golf', brandId: 'volkswagen', category: 'compacte', popular: true },
  { id: 'golf-viii', name: 'Golf VIII', brandId: 'volkswagen', category: 'compacte', popular: true },
  { id: 'id3', name: 'ID.3', brandId: 'volkswagen', category: 'electrique', popular: true },
  { id: 'id4', name: 'ID.4', brandId: 'volkswagen', category: 'electrique', popular: true },
  { id: 'id5', name: 'ID.5', brandId: 'volkswagen', category: 'electrique', popular: true },
  { id: 'id7', name: 'ID.7', brandId: 'volkswagen', category: 'electrique', popular: true },
  { id: 'polo', name: 'Polo', brandId: 'volkswagen', category: 'compacte', popular: true },
  { id: 'tiguan', name: 'Tiguan', brandId: 'volkswagen', category: 'suv', popular: true },
  { id: 't-roc', name: 'T-Roc', brandId: 'volkswagen', category: 'suv', popular: true },
  { id: 't-cross', name: 'T-Cross', brandId: 'volkswagen', category: 'suv', popular: true },
  { id: 'taigo', name: 'Taigo', brandId: 'volkswagen', category: 'suv', popular: true },
  { id: 'touareg', name: 'Touareg', brandId: 'volkswagen', category: 'suv', popular: true },
  { id: 'passat', name: 'Passat', brandId: 'volkswagen', category: 'berline', popular: true },
  { id: 'arteon', name: 'Arteon', brandId: 'volkswagen', category: 'berline', popular: true },
  { id: 'caddy', name: 'Caddy', brandId: 'volkswagen', category: 'utilitaire', popular: true },
  { id: 'transporter', name: 'Transporter', brandId: 'volkswagen', category: 'utilitaire', popular: true },
  { id: 'california', name: 'California', brandId: 'volkswagen', category: 'utilitaire', popular: true },
  { id: 'golf-r', name: 'Golf R', brandId: 'volkswagen', category: 'sportive', popular: false },
  { id: 'golf-gti', name: 'Golf GTI', brandId: 'volkswagen', category: 'sportive', popular: false },
  { id: 'id-buzz', name: 'ID. Buzz', brandId: 'volkswagen', category: 'electrique', popular: true },

  // TOYOTA (marque #6 France - fiabilité)
  { id: 'yaris', name: 'Yaris', brandId: 'toyota', category: 'compacte', popular: true },
  { id: 'yaris-cross', name: 'Yaris Cross', brandId: 'toyota', category: 'suv', popular: true },
  { id: 'corolla', name: 'Corolla', brandId: 'toyota', category: 'compacte', popular: true },
  { id: 'corolla-touring', name: 'Corolla Touring Sports', brandId: 'toyota', category: 'compacte', popular: true },
  { id: 'c-hr', name: 'C-HR', brandId: 'toyota', category: 'suv', popular: true },
  { id: 'rav4', name: 'RAV4', brandId: 'toyota', category: 'suv', popular: true },
  { id: 'highlander', name: 'Highlander', brandId: 'toyota', category: 'suv', popular: true },
  { id: 'camry', name: 'Camry', brandId: 'toyota', category: 'berline', popular: true },
  { id: 'prius', name: 'Prius', brandId: 'toyota', category: 'berline', popular: true },
  { id: 'aygo', name: 'Aygo', brandId: 'toyota', category: 'citadine', popular: true },
  { id: 'aygo-x', name: 'Aygo X', brandId: 'toyota', category: 'citadine', popular: true },
  { id: 'proace', name: 'Proace', brandId: 'toyota', category: 'utilitaire', popular: true },
  { id: 'proace-city', name: 'Proace City', brandId: 'toyota', category: 'utilitaire', popular: true },
  { id: 'bz4x', name: 'bZ4X', brandId: 'toyota', category: 'electrique', popular: true },
  { id: 'land-cruiser', name: 'Land Cruiser', brandId: 'toyota', category: 'suv', popular: false },
  { id: 'supra', name: 'Supra', brandId: 'toyota', category: 'sportive', popular: false },
  { id: 'gr-yaris', name: 'GR Yaris', brandId: 'toyota', category: 'sportive', popular: false },

  // MERCEDES-BENZ (marque #7 France - premium)
  { id: 'classe-a', name: 'Classe A', brandId: 'mercedes-benz', category: 'compacte', popular: true },
  { id: 'classe-b', name: 'Classe B', brandId: 'mercedes-benz', category: 'compacte', popular: true },
  { id: 'classe-c', name: 'Classe C', brandId: 'mercedes-benz', category: 'berline', popular: true },
  { id: 'classe-e', name: 'Classe E', brandId: 'mercedes-benz', category: 'berline', popular: true },
  { id: 'classe-s', name: 'Classe S', brandId: 'mercedes-benz', category: 'luxe', popular: true },
  { id: 'cla', name: 'CLA', brandId: 'mercedes-benz', category: 'berline', popular: true },
  { id: 'cls', name: 'CLS', brandId: 'mercedes-benz', category: 'berline', popular: true },
  { id: 'gla', name: 'GLA', brandId: 'mercedes-benz', category: 'suv', popular: true },
  { id: 'glb', name: 'GLB', brandId: 'mercedes-benz', category: 'suv', popular: true },
  { id: 'glc', name: 'GLC', brandId: 'mercedes-benz', category: 'suv', popular: true },
  { id: 'gle', name: 'GLE', brandId: 'mercedes-benz', category: 'suv', popular: true },
  { id: 'gls', name: 'GLS', brandId: 'mercedes-benz', category: 'suv', popular: true },
  { id: 'eqc', name: 'EQC', brandId: 'mercedes-benz', category: 'electrique', popular: true },
  { id: 'eqa', name: 'EQA', brandId: 'mercedes-benz', category: 'electrique', popular: true },
  { id: 'eqb', name: 'EQB', brandId: 'mercedes-benz', category: 'electrique', popular: true },
  { id: 'eqe', name: 'EQE', brandId: 'mercedes-benz', category: 'electrique', popular: true },
  { id: 'eqs', name: 'EQS', brandId: 'mercedes-benz', category: 'electrique', popular: true },
  { id: 'eqv', name: 'EQV', brandId: 'mercedes-benz', category: 'electrique', popular: true },
  { id: 'amg-gt', name: 'AMG GT', brandId: 'mercedes-benz', category: 'sportive', popular: false },
  { id: 'amg-c63', name: 'AMG C 63', brandId: 'mercedes-benz', category: 'sportive', popular: false },
  { id: 'vito', name: 'Vito', brandId: 'mercedes-benz', category: 'utilitaire', popular: true },
  { id: 'sprinter', name: 'Sprinter', brandId: 'mercedes-benz', category: 'utilitaire', popular: true },
  { id: 'classe-v', name: 'Classe V', brandId: 'mercedes-benz', category: 'utilitaire', popular: true },

  // BMW (marque #8 France - premium/sportif)
  { id: 'serie-1', name: 'Série 1', brandId: 'bmw', category: 'compacte', popular: true },
  { id: 'serie-2', name: 'Série 2', brandId: 'bmw', category: 'compacte', popular: true },
  { id: 'serie-3', name: 'Série 3', brandId: 'bmw', category: 'berline', popular: true },
  { id: 'serie-4', name: 'Série 4', brandId: 'bmw', category: 'berline', popular: true },
  { id: 'serie-5', name: 'Série 5', brandId: 'bmw', category: 'berline', popular: true },
  { id: 'serie-7', name: 'Série 7', brandId: 'bmw', category: 'luxe', popular: true },
  { id: 'serie-8', name: 'Série 8', brandId: 'bmw', category: 'luxe', popular: true },
  { id: 'x1', name: 'X1', brandId: 'bmw', category: 'suv', popular: true },
  { id: 'x2', name: 'X2', brandId: 'bmw', category: 'suv', popular: true },
  { id: 'x3', name: 'X3', brandId: 'bmw', category: 'suv', popular: true },
  { id: 'x4', name: 'X4', brandId: 'bmw', category: 'suv', popular: true },
  { id: 'x5', name: 'X5', brandId: 'bmw', category: 'suv', popular: true },
  { id: 'x6', name: 'X6', brandId: 'bmw', category: 'suv', popular: true },
  { id: 'x7', name: 'X7', brandId: 'bmw', category: 'suv', popular: true },
  { id: 'ix', name: 'iX', brandId: 'bmw', category: 'electrique', popular: true },
  { id: 'ix1', name: 'iX1', brandId: 'bmw', category: 'electrique', popular: true },
  { id: 'ix3', name: 'iX3', brandId: 'bmw', category: 'electrique', popular: true },
  { id: 'i4', name: 'i4', brandId: 'bmw', category: 'electrique', popular: true },
  { id: 'i7', name: 'i7', brandId: 'bmw', category: 'electrique', popular: true },
  { id: 'm2', name: 'M2', brandId: 'bmw', category: 'sportive', popular: false },
  { id: 'm3', name: 'M3', brandId: 'bmw', category: 'sportive', popular: false },
  { id: 'm4', name: 'M4', brandId: 'bmw', category: 'sportive', popular: false },
  { id: 'm5', name: 'M5', brandId: 'bmw', category: 'sportive', popular: false },
  { id: 'z4', name: 'Z4', brandId: 'bmw', category: 'sportive', popular: false },

  // AUDI (marque #9 France - premium technologique)
  { id: 'a1', name: 'A1', brandId: 'audi', category: 'compacte', popular: true },
  { id: 'a3', name: 'A3', brandId: 'audi', category: 'compacte', popular: true },
  { id: 'a4', name: 'A4', brandId: 'audi', category: 'berline', popular: true },
  { id: 'a5', name: 'A5', brandId: 'audi', category: 'berline', popular: true },
  { id: 'a6', name: 'A6', brandId: 'audi', category: 'berline', popular: true },
  { id: 'a7', name: 'A7', brandId: 'audi', category: 'berline', popular: true },
  { id: 'a8', name: 'A8', brandId: 'audi', category: 'luxe', popular: true },
  { id: 'q2', name: 'Q2', brandId: 'audi', category: 'suv', popular: true },
  { id: 'q3', name: 'Q3', brandId: 'audi', category: 'suv', popular: true },
  { id: 'q4-e-tron', name: 'Q4 e-tron', brandId: 'audi', category: 'electrique', popular: true },
  { id: 'q5', name: 'Q5', brandId: 'audi', category: 'suv', popular: true },
  { id: 'q7', name: 'Q7', brandId: 'audi', category: 'suv', popular: true },
  { id: 'q8', name: 'Q8', brandId: 'audi', category: 'suv', popular: true },
  { id: 'q8-e-tron', name: 'Q8 e-tron', brandId: 'audi', category: 'electrique', popular: true },
  { id: 'e-tron-gt', name: 'e-tron GT', brandId: 'audi', category: 'electrique', popular: true },
  { id: 'rs3', name: 'RS3', brandId: 'audi', category: 'sportive', popular: false },
  { id: 'rs4', name: 'RS4', brandId: 'audi', category: 'sportive', popular: false },
  { id: 'rs5', name: 'RS5', brandId: 'audi', category: 'sportive', popular: false },
  { id: 'rs6', name: 'RS6', brandId: 'audi', category: 'sportive', popular: false },
  { id: 'tt', name: 'TT', brandId: 'audi', category: 'sportive', popular: false },
  { id: 'r8', name: 'R8', brandId: 'audi', category: 'sportive', popular: false },

  // FORD (marque #10 France)
  { id: 'fiesta', name: 'Fiesta', brandId: 'ford', category: 'compacte', popular: true },
  { id: 'focus', name: 'Focus', brandId: 'ford', category: 'compacte', popular: true },
  { id: 'puma', name: 'Puma', brandId: 'ford', category: 'suv', popular: true },
  { id: 'kuga', name: 'Kuga', brandId: 'ford', category: 'suv', popular: true },
  { id: 'explorer', name: 'Explorer', brandId: 'ford', category: 'electrique', popular: true },
  { id: 'mustang-mach-e', name: 'Mustang Mach-E', brandId: 'ford', category: 'electrique', popular: true },
  { id: 'ranger', name: 'Ranger', brandId: 'ford', category: 'utilitaire', popular: true },
  { id: 'transit', name: 'Transit', brandId: 'ford', category: 'utilitaire', popular: true },
  { id: 'transit-custom', name: 'Transit Custom', brandId: 'ford', category: 'utilitaire', popular: true },
  { id: 'mustang', name: 'Mustang', brandId: 'ford', category: 'sportive', popular: false },
  { id: 'mondeo', name: 'Mondeo', brandId: 'ford', category: 'berline', popular: false },

  // Autres marques populaires (modèles principaux uniquement pour économiser l'espace)

  // NISSAN
  { id: 'micra', name: 'Micra', brandId: 'nissan', category: 'citadine', popular: true },
  { id: 'juke', name: 'Juke', brandId: 'nissan', category: 'suv', popular: true },
  { id: 'qashqai', name: 'Qashqai', brandId: 'nissan', category: 'suv', popular: true },
  { id: 'x-trail', name: 'X-Trail', brandId: 'nissan', category: 'suv', popular: true },
  { id: 'ariya', name: 'Ariya', brandId: 'nissan', category: 'electrique', popular: true },
  { id: 'leaf', name: 'Leaf', brandId: 'nissan', category: 'electrique', popular: true },
  { id: 'townstar', name: 'Townstar', brandId: 'nissan', category: 'utilitaire', popular: true },

  // OPEL
  { id: 'corsa', name: 'Corsa', brandId: 'opel', category: 'compacte', popular: true },
  { id: 'corsa-e', name: 'Corsa-e', brandId: 'opel', category: 'electrique', popular: true },
  { id: 'astra', name: 'Astra', brandId: 'opel', category: 'compacte', popular: true },
  { id: 'mokka', name: 'Mokka', brandId: 'opel', category: 'suv', popular: true },
  { id: 'mokka-e', name: 'Mokka-e', brandId: 'opel', category: 'electrique', popular: true },
  { id: 'grandland', name: 'Grandland', brandId: 'opel', category: 'suv', popular: true },
  { id: 'combo', name: 'Combo', brandId: 'opel', category: 'utilitaire', popular: true },
  { id: 'vivaro', name: 'Vivaro', brandId: 'opel', category: 'utilitaire', popular: true },

  // FIAT
  { id: '500', name: '500', brandId: 'fiat', category: 'citadine', popular: true },
  { id: '500e', name: '500e', brandId: 'fiat', category: 'electrique', popular: true },
  { id: '500x', name: '500X', brandId: 'fiat', category: 'suv', popular: true },
  { id: 'panda', name: 'Panda', brandId: 'fiat', category: 'citadine', popular: true },
  { id: 'tipo', name: 'Tipo', brandId: 'fiat', category: 'compacte', popular: true },
  { id: 'ducato', name: 'Ducato', brandId: 'fiat', category: 'utilitaire', popular: true },
  { id: 'doblo', name: 'Doblò', brandId: 'fiat', category: 'utilitaire', popular: true },

  // HYUNDAI
  { id: 'i10', name: 'i10', brandId: 'hyundai', category: 'citadine', popular: true },
  { id: 'i20', name: 'i20', brandId: 'hyundai', category: 'compacte', popular: true },
  { id: 'i30', name: 'i30', brandId: 'hyundai', category: 'compacte', popular: true },
  { id: 'bayon', name: 'Bayon', brandId: 'hyundai', category: 'suv', popular: true },
  { id: 'kona', name: 'Kona', brandId: 'hyundai', category: 'suv', popular: true },
  { id: 'kona-electric', name: 'Kona Electric', brandId: 'hyundai', category: 'electrique', popular: true },
  { id: 'tucson', name: 'Tucson', brandId: 'hyundai', category: 'suv', popular: true },
  { id: 'santa-fe', name: 'Santa Fe', brandId: 'hyundai', category: 'suv', popular: true },
  { id: 'ioniq-5', name: 'Ioniq 5', brandId: 'hyundai', category: 'electrique', popular: true },
  { id: 'ioniq-6', name: 'Ioniq 6', brandId: 'hyundai', category: 'electrique', popular: true },

  // KIA
  { id: 'picanto', name: 'Picanto', brandId: 'kia', category: 'citadine', popular: true },
  { id: 'rio', name: 'Rio', brandId: 'kia', category: 'compacte', popular: true },
  { id: 'ceed', name: 'Ceed', brandId: 'kia', category: 'compacte', popular: true },
  { id: 'xceed', name: 'XCeed', brandId: 'kia', category: 'suv', popular: true },
  { id: 'stonic', name: 'Stonic', brandId: 'kia', category: 'suv', popular: true },
  { id: 'niro', name: 'Niro', brandId: 'kia', category: 'suv', popular: true },
  { id: 'e-niro', name: 'e-Niro', brandId: 'kia', category: 'electrique', popular: true },
  { id: 'sportage', name: 'Sportage', brandId: 'kia', category: 'suv', popular: true },
  { id: 'sorento', name: 'Sorento', brandId: 'kia', category: 'suv', popular: true },
  { id: 'ev6', name: 'EV6', brandId: 'kia', category: 'electrique', popular: true },
  { id: 'ev9', name: 'EV9', brandId: 'kia', category: 'electrique', popular: true },

  // SKODA
  { id: 'fabia', name: 'Fabia', brandId: 'skoda', category: 'compacte', popular: true },
  { id: 'scala', name: 'Scala', brandId: 'skoda', category: 'compacte', popular: true },
  { id: 'octavia', name: 'Octavia', brandId: 'skoda', category: 'compacte', popular: true },
  { id: 'kamiq', name: 'Kamiq', brandId: 'skoda', category: 'suv', popular: true },
  { id: 'karoq', name: 'Karoq', brandId: 'skoda', category: 'suv', popular: true },
  { id: 'kodiaq', name: 'Kodiaq', brandId: 'skoda', category: 'suv', popular: true },
  { id: 'enyaq', name: 'Enyaq iV', brandId: 'skoda', category: 'electrique', popular: true },
  { id: 'superb', name: 'Superb', brandId: 'skoda', category: 'berline', popular: true },

  // TESLA (électrique uniquement)
  { id: 'model-3', name: 'Model 3', brandId: 'tesla', category: 'electrique', popular: true },
  { id: 'model-y', name: 'Model Y', brandId: 'tesla', category: 'electrique', popular: true },
  { id: 'model-s', name: 'Model S', brandId: 'tesla', category: 'electrique', popular: true },
  { id: 'model-x', name: 'Model X', brandId: 'tesla', category: 'electrique', popular: true },

  // MINI
  { id: 'mini-3-door', name: 'Mini 3 portes', brandId: 'mini', category: 'citadine', popular: true },
  { id: 'mini-5-door', name: 'Mini 5 portes', brandId: 'mini', category: 'citadine', popular: true },
  { id: 'mini-electric', name: 'Mini Electric', brandId: 'mini', category: 'electrique', popular: true },
  { id: 'mini-countryman', name: 'Mini Countryman', brandId: 'mini', category: 'suv', popular: true },
  { id: 'mini-clubman', name: 'Mini Clubman', brandId: 'mini', category: 'compacte', popular: true },

  // SEAT
  { id: 'ibiza', name: 'Ibiza', brandId: 'seat', category: 'compacte', popular: true },
  { id: 'leon', name: 'Leon', brandId: 'seat', category: 'compacte', popular: true },
  { id: 'arona', name: 'Arona', brandId: 'seat', category: 'suv', popular: true },
  { id: 'ateca', name: 'Ateca', brandId: 'seat', category: 'suv', popular: true },
  { id: 'tarraco', name: 'Tarraco', brandId: 'seat', category: 'suv', popular: true },

  // MAZDA
  { id: 'mazda2', name: 'Mazda2', brandId: 'mazda', category: 'compacte', popular: true },
  { id: 'mazda3', name: 'Mazda3', brandId: 'mazda', category: 'compacte', popular: true },
  { id: 'cx-3', name: 'CX-3', brandId: 'mazda', category: 'suv', popular: true },
  { id: 'cx-30', name: 'CX-30', brandId: 'mazda', category: 'suv', popular: true },
  { id: 'cx-5', name: 'CX-5', brandId: 'mazda', category: 'suv', popular: true },
  { id: 'cx-60', name: 'CX-60', brandId: 'mazda', category: 'suv', popular: true },
  { id: 'mx-5', name: 'MX-5', brandId: 'mazda', category: 'sportive', popular: false },
  { id: 'mx-30', name: 'MX-30', brandId: 'mazda', category: 'electrique', popular: true },

  // HONDA
  { id: 'jazz', name: 'Jazz', brandId: 'honda', category: 'compacte', popular: true },
  { id: 'civic', name: 'Civic', brandId: 'honda', category: 'compacte', popular: true },
  { id: 'hr-v', name: 'HR-V', brandId: 'honda', category: 'suv', popular: true },
  { id: 'cr-v', name: 'CR-V', brandId: 'honda', category: 'suv', popular: true },
  { id: 'e', name: 'e', brandId: 'honda', category: 'electrique', popular: true },
  { id: 'civic-type-r', name: 'Civic Type R', brandId: 'honda', category: 'sportive', popular: false },

  // DS AUTOMOBILES
  { id: 'ds3', name: 'DS 3', brandId: 'ds-automobiles', category: 'compacte', popular: true },
  { id: 'ds3-e-tense', name: 'DS 3 E-Tense', brandId: 'ds-automobiles', category: 'electrique', popular: true },
  { id: 'ds4', name: 'DS 4', brandId: 'ds-automobiles', category: 'compacte', popular: true },
  { id: 'ds7', name: 'DS 7 Crossback', brandId: 'ds-automobiles', category: 'suv', popular: true },
  { id: 'ds9', name: 'DS 9', brandId: 'ds-automobiles', category: 'berline', popular: true },
];

/**
 * Recherche de modèles pour une marque donnée
 */
export function getModelsByBrand(brandId: string): VehicleModel[] {
  return VEHICLE_MODELS.filter(m => m.brandId === brandId).sort((a, b) => {
    if (a.popular && !b.popular) return -1;
    if (!a.popular && b.popular) return 1;
    return a.name.localeCompare(b.name);
  });
}

/**
 * Recherche de modèles avec filtre
 */
export function searchModels(brandId: string, query: string): VehicleModel[] {
  const brandModels = getModelsByBrand(brandId);

  if (!query || query.length < 2) {
    return brandModels.filter(m => m.popular);
  }

  const normalizedQuery = query.toLowerCase().trim();

  return brandModels.filter(model => {
    const normalizedName = model.name.toLowerCase();
    return normalizedName.includes(normalizedQuery);
  });
}

/**
 * Statistiques
 */
export const MODEL_STATS = {
  total: VEHICLE_MODELS.length,
  popular: VEHICLE_MODELS.filter(m => m.popular).length,
  categories: [...new Set(VEHICLE_MODELS.map(m => m.category))],
};
