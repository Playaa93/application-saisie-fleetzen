'use client';

import * as React from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { searchBrands, VehicleBrand } from '@/data/vehicle-brands';

interface VehicleBrandComboboxProps {
  value?: string;
  onChange?: (brandId: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function VehicleBrandCombobox({
  value,
  onChange,
  placeholder = 'Sélectionner une marque...',
  disabled = false,
  className,
}: VehicleBrandComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');

  // Get filtered brands based on search query
  const filteredBrands = React.useMemo(() => {
    return searchBrands(searchQuery);
  }, [searchQuery]);

  // Find selected brand name
  const selectedBrand = React.useMemo(() => {
    if (!value) return null;
    return filteredBrands.find((brand) => brand.id === value);
  }, [value, filteredBrands]);

  // Handle brand selection
  const handleSelect = (brandId: string) => {
    onChange?.(brandId === value ? '' : brandId);
    setOpen(false);
    setSearchQuery('');
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label="Sélectionner une marque de véhicule"
          disabled={disabled}
          className={cn(
            'w-full justify-between',
            !value && 'text-muted-foreground',
            className
          )}
        >
          {selectedBrand ? selectedBrand.name : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Rechercher une marque..."
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            <CommandEmpty>Aucune marque trouvée.</CommandEmpty>
            <CommandGroup>
              {filteredBrands.map((brand) => (
                <CommandItem
                  key={brand.id}
                  value={brand.id}
                  onSelect={() => handleSelect(brand.id)}
                  className="cursor-pointer"
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === brand.id ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  <div className="flex items-center justify-between w-full">
                    <span>{brand.name}</span>
                    {brand.popular && (
                      <span className="text-xs text-muted-foreground ml-2">
                        Populaire
                      </span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
