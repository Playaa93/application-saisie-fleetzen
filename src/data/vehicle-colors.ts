/**
 * Couleurs standards pour véhicules
 * 12 couleurs principales + variations
 */

export interface VehicleColor {
  id: string;
  name: string;
  hex: string; // Couleur d'affichage (pastille)
  popular: boolean;
}

export const VEHICLE_COLORS: VehicleColor[] = [
  // Top 5 couleurs (75% du marché)
  {
    id: 'noir',
    name: 'Noir',
    hex: '#000000',
    popular: true,
  },
  {
    id: 'blanc',
    name: 'Blanc',
    hex: '#FFFFFF',
    popular: true,
  },
  {
    id: 'gris',
    name: 'Gris',
    hex: '#808080',
    popular: true,
  },
  {
    id: 'argent',
    name: 'Argent',
    hex: '#C0C0C0',
    popular: true,
  },
  {
    id: 'bleu',
    name: 'Bleu',
    hex: '#0047AB',
    popular: true,
  },

  // Top 6-12 couleurs
  {
    id: 'rouge',
    name: 'Rouge',
    hex: '#DC143C',
    popular: true,
  },
  {
    id: 'marron',
    name: 'Marron',
    hex: '#8B4513',
    popular: true,
  },
  {
    id: 'beige',
    name: 'Beige',
    hex: '#F5F5DC',
    popular: true,
  },
  {
    id: 'vert',
    name: 'Vert',
    hex: '#228B22',
    popular: false,
  },
  {
    id: 'jaune',
    name: 'Jaune',
    hex: '#FFD700',
    popular: false,
  },
  {
    id: 'orange',
    name: 'Orange',
    hex: '#FF8C00',
    popular: false,
  },
  {
    id: 'violet',
    name: 'Violet',
    hex: '#8B008B',
    popular: false,
  },

  // Variations spécifiques (moins courantes)
  {
    id: 'bleu-nuit',
    name: 'Bleu nuit',
    hex: '#191970',
    popular: false,
  },
  {
    id: 'gris-anthracite',
    name: 'Gris anthracite',
    hex: '#2F4F4F',
    popular: false,
  },
  {
    id: 'bronze',
    name: 'Bronze',
    hex: '#CD7F32',
    popular: false,
  },
  {
    id: 'dore',
    name: 'Doré',
    hex: '#FFD700',
    popular: false,
  },
  {
    id: 'rose',
    name: 'Rose',
    hex: '#FFC0CB',
    popular: false,
  },
];

/**
 * Récupérer une couleur par ID
 */
export function getColorById(id: string): VehicleColor | undefined {
  return VEHICLE_COLORS.find(c => c.id === id);
}

/**
 * Récupérer les couleurs populaires
 */
export function getPopularColors(): VehicleColor[] {
  return VEHICLE_COLORS.filter(c => c.popular);
}

/**
 * Statistiques
 */
export const COLOR_STATS = {
  total: VEHICLE_COLORS.length,
  popular: VEHICLE_COLORS.filter(c => c.popular).length,
};
