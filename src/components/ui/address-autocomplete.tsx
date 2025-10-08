'use client';

import * as React from 'react';
import { useJsApiLoader } from '@react-google-maps/api';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const libraries: ('places')[] = ['places'];

interface AddressAutocompleteProps {
  value?: string;
  onChange?: (address: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  country?: string;
}

export function AddressAutocomplete({
  value = '',
  onChange,
  placeholder = 'Commencez à taper une adresse...',
  disabled = false,
  className,
  country = 'fr',
}: AddressAutocompleteProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const autocompleteRef = React.useRef<google.maps.places.Autocomplete | null>(null);
  const sessionTokenRef = React.useRef<google.maps.places.AutocompleteSessionToken | null>(null);

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-maps-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries,
    language: 'fr',
    region: country.toUpperCase(),
  });

  // Initialize autocomplete when API is loaded
  React.useEffect(() => {
    if (!isLoaded || !inputRef.current || autocompleteRef.current) return;

    // Create session token for cost optimization
    sessionTokenRef.current = new google.maps.places.AutocompleteSessionToken();

    // Initialize autocomplete
    autocompleteRef.current = new google.maps.places.Autocomplete(inputRef.current, {
      componentRestrictions: { country: country },
      fields: ['formatted_address', 'address_components', 'geometry', 'name'],
      sessionToken: sessionTokenRef.current,
      // Removed types restriction to allow addresses AND establishments (POI)
    });

    // Listen to place selection
    const listener = autocompleteRef.current.addListener('place_changed', () => {
      const place = autocompleteRef.current?.getPlace();

      if (place) {
        // Use formatted_address for addresses, or combine name + formatted_address for POI
        const address = place.formatted_address || place.name || '';

        // If it's a POI with a name but no formatted_address, try to get vicinity or name
        const displayAddress = place.name && !place.formatted_address
          ? place.name
          : place.formatted_address || '';

        if (displayAddress) {
          onChange?.(displayAddress);

          // Create new session token after selection
          sessionTokenRef.current = new google.maps.places.AutocompleteSessionToken();
        }
      }
    });

    return () => {
      if (listener) {
        google.maps.event.removeListener(listener);
      }
    };
  }, [isLoaded, country, onChange]);

  // Handle manual input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(e.target.value);
  };

  if (loadError) {
    console.error('Google Maps API loading error:', loadError);
    return (
      <Input
        ref={inputRef}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        className={className}
      />
    );
  }

  if (!isLoaded) {
    return (
      <Input
        placeholder="Chargement de l'autocomplétion..."
        disabled
        className={className}
      />
    );
  }

  return (
    <Input
      ref={inputRef}
      value={value}
      onChange={handleChange}
      placeholder={placeholder}
      disabled={disabled}
      className={cn('autocomplete-input', className)}
      autoComplete="off"
    />
  );
}
