'use client';

import * as React from 'react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { VehicleColor, getPopularColors, VEHICLE_COLORS } from '@/data/vehicle-colors';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface ColorRadioGroupProps {
  value?: string;
  onValueChange?: (value: string) => void;
  showAllColors?: boolean; // false = couleurs populaires uniquement
  cols?: 3 | 4 | 6; // Colonnes desktop
  colsMobile?: 2 | 3; // Colonnes mobile
}

export function ColorRadioGroup({
  value,
  onValueChange,
  showAllColors = false,
  cols = 4,
  colsMobile = 3,
}: ColorRadioGroupProps) {
  const colors = showAllColors ? VEHICLE_COLORS : getPopularColors();

  const gridCols = {
    3: 'md:grid-cols-3',
    4: 'md:grid-cols-4',
    6: 'md:grid-cols-6',
  };

  const gridColsMobile = {
    2: 'grid-cols-2',
    3: 'grid-cols-3',
  };

  return (
    <RadioGroup value={value} onValueChange={onValueChange}>
      <div className={cn('grid gap-3', gridColsMobile[colsMobile], gridCols[cols])}>
        {colors.map((color) => (
          <ColorCard key={color.id} color={color} isSelected={value === color.id} />
        ))}
      </div>
    </RadioGroup>
  );
}

interface ColorCardProps {
  color: VehicleColor;
  isSelected: boolean;
}

function ColorCard({ color, isSelected }: ColorCardProps) {
  return (
    <label
      htmlFor={`color-${color.id}`}
      className={cn(
        'relative flex flex-col items-center p-3 rounded-lg border-2 cursor-pointer transition-all',
        'hover:border-primary/50 hover:bg-accent',
        isSelected ? 'border-primary bg-primary/5' : 'border-border'
      )}
    >
      <RadioGroupItem
        value={color.id}
        id={`color-${color.id}`}
        className="sr-only"
        aria-label={`Couleur: ${color.name}`}
      />

      {/* Pastille de couleur */}
      <div className="relative mb-2">
        <div
          className={cn(
            'w-12 h-12 rounded-full border-2',
            color.id === 'blanc' ? 'border-gray-300' : 'border-transparent'
          )}
          style={{ backgroundColor: color.hex }}
        />

        {/* Checkmark si sélectionné */}
        {isSelected && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-primary rounded-full p-1">
              <Check className="w-4 h-4 text-primary-foreground" />
            </div>
          </div>
        )}
      </div>

      {/* Label */}
      <span
        className={cn(
          'text-sm font-medium text-center',
          isSelected ? 'text-primary' : 'text-foreground'
        )}
      >
        {color.name}
      </span>
    </label>
  );
}

// Export pour utilisation standalone
export { ColorCard };
