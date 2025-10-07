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
import { searchModels, VehicleModel } from '@/data/vehicle-models';

interface VehicleModelComboboxProps {
  brandId: string;
  value?: string;
  onChange?: (modelId: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function VehicleModelCombobox({
  brandId,
  value,
  onChange,
  placeholder = 'Sélectionner un modèle...',
  disabled = false,
  className,
}: VehicleModelComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');

  // Get filtered models based on brand and search query
  const filteredModels = React.useMemo(() => {
    if (!brandId) return [];
    return searchModels(brandId, searchQuery);
  }, [brandId, searchQuery]);

  // Find selected model name
  const selectedModel = React.useMemo(() => {
    if (!value) return null;
    return filteredModels.find((model) => model.id === value);
  }, [value, filteredModels]);

  // Reset value when brand changes
  React.useEffect(() => {
    if (value && !filteredModels.find((m) => m.id === value)) {
      onChange?.('');
    }
  }, [brandId, value, filteredModels, onChange]);

  // Handle model selection
  const handleSelect = (modelId: string) => {
    onChange?.(modelId === value ? '' : modelId);
    setOpen(false);
    setSearchQuery('');
  };

  const isDisabled = disabled || !brandId;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label="Sélectionner un modèle de véhicule"
          disabled={isDisabled}
          className={cn(
            'w-full justify-between',
            !value && 'text-muted-foreground',
            className
          )}
        >
          {selectedModel ? selectedModel.name : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Rechercher un modèle..."
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            <CommandEmpty>
              {brandId
                ? 'Aucun modèle trouvé.'
                : 'Sélectionnez d\'abord une marque.'}
            </CommandEmpty>
            <CommandGroup>
              {filteredModels.map((model) => (
                <CommandItem
                  key={model.id}
                  value={model.id}
                  onSelect={() => handleSelect(model.id)}
                  className="cursor-pointer"
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === model.id ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  <div className="flex items-center justify-between w-full">
                    <span>{model.name}</span>
                    <div className="flex items-center gap-2">
                      {model.popular && (
                        <span className="text-xs text-muted-foreground">
                          Populaire
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground capitalize">
                        {model.category}
                      </span>
                    </div>
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
