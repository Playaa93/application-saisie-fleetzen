'use client';

import { useState, useRef, useEffect } from 'react';

interface SearchableComboboxProps {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  onOtherSelected?: (isOther: boolean) => void;
}

export default function SearchableCombobox({
  label,
  options,
  value,
  onChange,
  placeholder = 'Rechercher...',
  required = false,
  onOtherSelected,
}: SearchableComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [openUpward, setOpenUpward] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  console.log('🔄 SearchableCombobox render', {
    label,
    value,
    optionsCount: options.length,
    isOpen
  });

  const filteredOptions = options.filter(option =>
    option.toLowerCase().includes(search.toLowerCase())
  );

  // Calculate dropdown position when opening
  const handleToggle = () => {
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const dropdownHeight = 300; // max-h-60 (240px) + padding

      // Open upward if not enough space below and more space above
      setOpenUpward(spaceBelow < dropdownHeight && spaceAbove > spaceBelow);
    }
    setIsOpen(!isOpen);
  };

  const handleSelect = (option: string) => {
    console.log('🎯 SearchableCombobox handleSelect', {
      label,
      option,
      currentValue: value
    });
    console.log('🔥 Calling onChange with:', option);
    onChange(option);
    console.log('✅ onChange called successfully');
    setSearch('');
    setIsOpen(false);
    if (onOtherSelected) {
      console.log('🔥 Calling onOtherSelected with:', option === 'Autre');
      onOtherSelected(option === 'Autre');
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearch('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <label className="block text-sm font-medium mb-2">
        {label} {required && '*'}
      </label>

      <div className="relative">
        <button
          ref={buttonRef}
          type="button"
          onClick={handleToggle}
          className="w-full p-3 border rounded-lg text-left flex items-center justify-between bg-white hover:border-fleetzen-teal transition"
        >
          <span className={value ? 'text-gray-900' : 'text-gray-400'}>
            {value || placeholder}
          </span>
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform ${
              isOpen ? (openUpward ? '' : 'rotate-180') : (openUpward ? 'rotate-180' : '')
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isOpen && (
          <div className={`absolute z-10 w-full bg-white border rounded-lg shadow-lg max-h-60 overflow-hidden ${
            openUpward ? 'bottom-full mb-1' : 'top-full mt-1'
          }`}>
            {/* Search input */}
            <div className="p-2 border-b sticky top-0 bg-white">
              <div className="relative">
                <svg
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Rechercher..."
                  className="w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-fleetzen-teal"
                />
              </div>
            </div>

            {/* Options list */}
            <div className="overflow-y-auto max-h-48">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => handleSelect(option)}
                    className={`w-full text-left px-4 py-2 hover:bg-fleetzen-teal/10 transition ${
                      value === option ? 'bg-fleetzen-teal/5 text-fleetzen-teal font-medium' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{option}</span>
                      {value === option && (
                        <svg className="w-5 h-5 text-fleetzen-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </button>
                ))
              ) : (
                <div className="px-4 py-3 text-gray-500 text-sm text-center">
                  Aucun résultat trouvé
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
