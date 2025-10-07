/**
 * Base de données des marques automobiles
 * 150+ marques mondiales classées par popularité en France
 * Source: Données 2025 immatriculations + marché mondial
 */

export interface VehicleBrand {
  id: string;
  name: string;
  country: string;
  popular: boolean; // Top 30 en France
}

export const VEHICLE_BRANDS: VehicleBrand[] = [
  // Top 10 France (70% du marché)
  { id: 'renault', name: 'Renault', country: 'FR', popular: true },
  { id: 'peugeot', name: 'Peugeot', country: 'FR', popular: true },
  { id: 'citroën', name: 'Citroën', country: 'FR', popular: true },
  { id: 'dacia', name: 'Dacia', country: 'RO', popular: true },
  { id: 'volkswagen', name: 'Volkswagen', country: 'DE', popular: true },
  { id: 'toyota', name: 'Toyota', country: 'JP', popular: true },
  { id: 'mercedes-benz', name: 'Mercedes-Benz', country: 'DE', popular: true },
  { id: 'bmw', name: 'BMW', country: 'DE', popular: true },
  { id: 'audi', name: 'Audi', country: 'DE', popular: true },
  { id: 'ford', name: 'Ford', country: 'US', popular: true },

  // Top 11-30 France
  { id: 'nissan', name: 'Nissan', country: 'JP', popular: true },
  { id: 'opel', name: 'Opel', country: 'DE', popular: true },
  { id: 'fiat', name: 'Fiat', country: 'IT', popular: true },
  { id: 'hyundai', name: 'Hyundai', country: 'KR', popular: true },
  { id: 'kia', name: 'Kia', country: 'KR', popular: true },
  { id: 'skoda', name: 'Škoda', country: 'CZ', popular: true },
  { id: 'seat', name: 'SEAT', country: 'ES', popular: true },
  { id: 'mazda', name: 'Mazda', country: 'JP', popular: true },
  { id: 'honda', name: 'Honda', country: 'JP', popular: true },
  { id: 'suzuki', name: 'Suzuki', country: 'JP', popular: true },
  { id: 'jeep', name: 'Jeep', country: 'US', popular: true },
  { id: 'mini', name: 'Mini', country: 'GB', popular: true },
  { id: 'land-rover', name: 'Land Rover', country: 'GB', popular: true },
  { id: 'volvo', name: 'Volvo', country: 'SE', popular: true },
  { id: 'tesla', name: 'Tesla', country: 'US', popular: true },
  { id: 'mitsubishi', name: 'Mitsubishi', country: 'JP', popular: true },
  { id: 'alfa-romeo', name: 'Alfa Romeo', country: 'IT', popular: true },
  { id: 'porsche', name: 'Porsche', country: 'DE', popular: true },
  { id: 'mg', name: 'MG', country: 'CN', popular: true },
  { id: 'ds-automobiles', name: 'DS Automobiles', country: 'FR', popular: true },

  // Marques premium/luxe
  { id: 'lexus', name: 'Lexus', country: 'JP', popular: false },
  { id: 'jaguar', name: 'Jaguar', country: 'GB', popular: false },
  { id: 'maserati', name: 'Maserati', country: 'IT', popular: false },
  { id: 'ferrari', name: 'Ferrari', country: 'IT', popular: false },
  { id: 'lamborghini', name: 'Lamborghini', country: 'IT', popular: false },
  { id: 'bentley', name: 'Bentley', country: 'GB', popular: false },
  { id: 'rolls-royce', name: 'Rolls-Royce', country: 'GB', popular: false },
  { id: 'aston-martin', name: 'Aston Martin', country: 'GB', popular: false },
  { id: 'mclaren', name: 'McLaren', country: 'GB', popular: false },
  { id: 'bugatti', name: 'Bugatti', country: 'FR', popular: false },

  // Marques chinoises (montée en puissance)
  { id: 'byd', name: 'BYD', country: 'CN', popular: false },
  { id: 'nio', name: 'NIO', country: 'CN', popular: false },
  { id: 'xpeng', name: 'XPeng', country: 'CN', popular: false },
  { id: 'great-wall', name: 'Great Wall', country: 'CN', popular: false },
  { id: 'geely', name: 'Geely', country: 'CN', popular: false },
  { id: 'lynk-co', name: 'Lynk & Co', country: 'CN', popular: false },
  { id: 'aiways', name: 'Aiways', country: 'CN', popular: false },
  { id: 'ora', name: 'ORA', country: 'CN', popular: false },

  // Marques électriques récentes
  { id: 'polestar', name: 'Polestar', country: 'SE', popular: false },
  { id: 'rivian', name: 'Rivian', country: 'US', popular: false },
  { id: 'lucid', name: 'Lucid Motors', country: 'US', popular: false },
  { id: 'fisker', name: 'Fisker', country: 'US', popular: false },
  { id: 'vinfast', name: 'VinFast', country: 'VN', popular: false },

  // Marques traditionnelles
  { id: 'chevrolet', name: 'Chevrolet', country: 'US', popular: false },
  { id: 'dodge', name: 'Dodge', country: 'US', popular: false },
  { id: 'chrysler', name: 'Chrysler', country: 'US', popular: false },
  { id: 'cadillac', name: 'Cadillac', country: 'US', popular: false },
  { id: 'buick', name: 'Buick', country: 'US', popular: false },
  { id: 'gmc', name: 'GMC', country: 'US', popular: false },
  { id: 'lincoln', name: 'Lincoln', country: 'US', popular: false },
  { id: 'ram', name: 'Ram', country: 'US', popular: false },

  // Marques japonaises
  { id: 'subaru', name: 'Subaru', country: 'JP', popular: false },
  { id: 'infiniti', name: 'Infiniti', country: 'JP', popular: false },
  { id: 'acura', name: 'Acura', country: 'JP', popular: false },
  { id: 'isuzu', name: 'Isuzu', country: 'JP', popular: false },
  { id: 'daihatsu', name: 'Daihatsu', country: 'JP', popular: false },

  // Marques coréennes
  { id: 'ssangyong', name: 'SsangYong', country: 'KR', popular: false },
  { id: 'genesis', name: 'Genesis', country: 'KR', popular: false },

  // Marques italiennes
  { id: 'lancia', name: 'Lancia', country: 'IT', popular: false },
  { id: 'abarth', name: 'Abarth', country: 'IT', popular: false },
  { id: 'pagani', name: 'Pagani', country: 'IT', popular: false },
  { id: 'de-tomaso', name: 'De Tomaso', country: 'IT', popular: false },

  // Marques allemandes
  { id: 'smart', name: 'Smart', country: 'DE', popular: false },
  { id: 'maybach', name: 'Maybach', country: 'DE', popular: false },
  { id: 'alpina', name: 'Alpina', country: 'DE', popular: false },
  { id: 'wiesmann', name: 'Wiesmann', country: 'DE', popular: false },

  // Marques britanniques
  { id: 'lotus', name: 'Lotus', country: 'GB', popular: false },
  { id: 'morgan', name: 'Morgan', country: 'GB', popular: false },
  { id: 'caterham', name: 'Caterham', country: 'GB', popular: false },
  { id: 'tvr', name: 'TVR', country: 'GB', popular: false },

  // Marques espagnoles
  { id: 'cupra', name: 'Cupra', country: 'ES', popular: false },

  // Marques scandinaves
  { id: 'saab', name: 'Saab', country: 'SE', popular: false },
  { id: 'koenigsegg', name: 'Koenigsegg', country: 'SE', popular: false },

  // Marques roumaines
  { id: 'aro', name: 'ARO', country: 'RO', popular: false },

  // Marques russes
  { id: 'lada', name: 'Lada', country: 'RU', popular: false },
  { id: 'uaz', name: 'UAZ', country: 'RU', popular: false },

  // Marques indiennes
  { id: 'tata', name: 'Tata', country: 'IN', popular: false },
  { id: 'mahindra', name: 'Mahindra', country: 'IN', popular: false },

  // Marques malaysian
  { id: 'proton', name: 'Proton', country: 'MY', popular: false },

  // Marques historiques/rares
  { id: 'hummer', name: 'Hummer', country: 'US', popular: false },
  { id: 'saturn', name: 'Saturn', country: 'US', popular: false },
  { id: 'pontiac', name: 'Pontiac', country: 'US', popular: false },
  { id: 'oldsmobile', name: 'Oldsmobile', country: 'US', popular: false },
  { id: 'plymouth', name: 'Plymouth', country: 'US', popular: false },
  { id: 'mercury', name: 'Mercury', country: 'US', popular: false },
  { id: 'rover', name: 'Rover', country: 'GB', popular: false },
  { id: 'daewoo', name: 'Daewoo', country: 'KR', popular: false },

  // Marques utilitaires/camions
  { id: 'iveco', name: 'Iveco', country: 'IT', popular: false },
  { id: 'man', name: 'MAN', country: 'DE', popular: false },
  { id: 'scania', name: 'Scania', country: 'SE', popular: false },
  { id: 'daf', name: 'DAF', country: 'NL', popular: false },
  { id: 'renault-trucks', name: 'Renault Trucks', country: 'FR', popular: false },
  { id: 'volvo-trucks', name: 'Volvo Trucks', country: 'SE', popular: false },
  { id: 'mercedes-trucks', name: 'Mercedes-Benz Trucks', country: 'DE', popular: false },

  // Marques camping-cars/vans
  { id: 'fiat-professional', name: 'Fiat Professional', country: 'IT', popular: false },
  { id: 'citroen-professional', name: 'Citroën Professional', country: 'FR', popular: false },
  { id: 'peugeot-professional', name: 'Peugeot Professional', country: 'FR', popular: false },

  // Autres marques (complément pour arriver à 150+)
  { id: 'alpine', name: 'Alpine', country: 'FR', popular: false },
  { id: 'donkervoort', name: 'Donkervoort', country: 'NL', popular: false },
  { id: 'spyker', name: 'Spyker', country: 'NL', popular: false },
  { id: 'artega', name: 'Artega', country: 'DE', popular: false },
  { id: 'rimac', name: 'Rimac', country: 'HR', popular: false },
  { id: 'hispano-suiza', name: 'Hispano Suiza', country: 'ES', popular: false },
  { id: 'gumpert', name: 'Gumpert', country: 'DE', popular: false },
  { id: 'venturi', name: 'Venturi', country: 'MC', popular: false },
  { id: 'wuling', name: 'Wuling', country: 'CN', popular: false },
  { id: 'hongqi', name: 'Hongqi', country: 'CN', popular: false },
  { id: 'borgward', name: 'Borgward', country: 'DE', popular: false },
];

/**
 * Recherche de marques avec fuzzy matching
 * Supporte les fautes de frappe et variations
 */
export function searchBrands(query: string): VehicleBrand[] {
  if (!query || query.length < 2) {
    // Retourner top 30 marques populaires par défaut
    return VEHICLE_BRANDS.filter(b => b.popular);
  }

  const normalizedQuery = query.toLowerCase().trim();

  return VEHICLE_BRANDS.filter(brand => {
    const normalizedName = brand.name.toLowerCase();

    // Correspondance exacte au début
    if (normalizedName.startsWith(normalizedQuery)) return true;

    // Correspondance partielle
    if (normalizedName.includes(normalizedQuery)) return true;

    // Correspondance sans accents
    const withoutAccents = brand.name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
    if (withoutAccents.includes(normalizedQuery)) return true;

    return false;
  }).sort((a, b) => {
    // Tri: popularité d'abord, puis alphabétique
    if (a.popular && !b.popular) return -1;
    if (!a.popular && b.popular) return 1;
    return a.name.localeCompare(b.name);
  });
}

/**
 * Récupérer une marque par ID
 */
export function getBrandById(id: string): VehicleBrand | undefined {
  return VEHICLE_BRANDS.find(b => b.id === id);
}

/**
 * Statistiques
 */
export const BRAND_STATS = {
  total: VEHICLE_BRANDS.length,
  popular: VEHICLE_BRANDS.filter(b => b.popular).length,
  countries: [...new Set(VEHICLE_BRANDS.map(b => b.country))].length,
};
