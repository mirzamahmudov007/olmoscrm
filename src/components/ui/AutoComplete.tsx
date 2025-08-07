import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';

interface Option {
  id: string;
  name: string;
}

interface AutoCompleteProps {
  options: Option[];
  value: Option | null;
  onChange: (option: Option | null) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
}

export const AutoComplete: React.FC<AutoCompleteProps> = ({
  options,
  value,
  onChange,
  placeholder = "Tanlang...",
  label,
  error,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter options based on search term
  const filteredOptions = options.filter(option =>
    option.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          setHighlightedIndex(prev => 
            prev < filteredOptions.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          event.preventDefault();
          setHighlightedIndex(prev => 
            prev > 0 ? prev - 1 : filteredOptions.length - 1
          );
          break;
        case 'Enter':
          event.preventDefault();
          if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
            handleSelect(filteredOptions[highlightedIndex]);
          }
          break;
        case 'Escape':
          setIsOpen(false);
          setSearchTerm('');
          setHighlightedIndex(-1);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, filteredOptions, highlightedIndex]);

  const handleSelect = (option: Option) => {
    onChange(option);
    setIsOpen(false);
    setSearchTerm('');
    setHighlightedIndex(-1);
  };

  const handleClear = () => {
    onChange(null);
    setSearchTerm('');
    setHighlightedIndex(-1);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setIsOpen(true);
    setHighlightedIndex(-1);
    
    // If input is cleared, clear selection
    if (!value) {
      onChange(null);
    }
  };

  const handleInputClick = () => {
    if (!disabled) {
      setIsOpen(true);
      setSearchTerm('');
      setHighlightedIndex(-1);
      inputRef.current?.focus();
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      
      <div className="relative">
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={isOpen ? searchTerm : (value?.name || '')}
            onChange={handleInputChange}
            onClick={handleInputClick}
            placeholder={placeholder}
            disabled={disabled}
            className={`w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
              disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white cursor-text'
            } ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}`}
          />
          
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
            {value && !isOpen && (
              <button
                type="button"
                onClick={handleClear}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
              >
                <X size={14} />
              </button>
            )}
            <ChevronDown 
              size={16} 
              className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
            />
          </div>
        </div>

        {/* Dropdown */}
        {isOpen && filteredOptions.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
            {filteredOptions.map((option, index) => (
              <button
                key={option.id}
                type="button"
                onClick={() => handleSelect(option)}
                className={`w-full px-3 py-2.5 text-left transition-colors ${
                  index === highlightedIndex 
                    ? 'bg-blue-50 text-blue-900' 
                    : 'hover:bg-gray-50 focus:bg-gray-50'
                } focus:outline-none`}
              >
                {option.name}
              </button>
            ))}
          </div>
        )}

        {/* No results */}
        {isOpen && searchTerm && filteredOptions.length === 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
            <div className="px-3 py-2.5 text-gray-500 text-sm">
              Hech narsa topilmadi
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}; 