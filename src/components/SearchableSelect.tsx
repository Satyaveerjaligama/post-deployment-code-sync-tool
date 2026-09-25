import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, Check, Loader2 } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  sublabel?: string;
  badge?: string;
  badgeType?: 'default' | 'branch' | 'private' | 'public';
  icon?: React.ReactNode;
}

interface SearchableSelectProps {
  id?: string;
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  isLoading?: boolean;
  disabled?: boolean;
  emptyText?: string;
  allowCustomInput?: boolean;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  id,
  options,
  value,
  onChange,
  placeholder = 'Select an option...',
  searchPlaceholder = 'Search...',
  isLoading = false,
  disabled = false,
  emptyText = 'No options found',
  allowCustomInput = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    } else {
      setSearchTerm('');
    }
  }, [isOpen]);

  const filteredOptions = options.filter(
    (opt) =>
      opt.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (opt.sublabel && opt.sublabel.toLowerCase().includes(searchTerm.toLowerCase())) ||
      opt.value.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
  };

  const handleCustomSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && allowCustomInput && searchTerm.trim()) {
      onChange(searchTerm.trim());
      setIsOpen(false);
    }
  };

  return (
    <div className="custom-select-container" ref={containerRef}>
      <div
        id={id}
        className={`custom-select-trigger ${isOpen ? 'open' : ''} ${disabled ? 'disabled' : ''}`}
        onClick={() => {
          if (!disabled) setIsOpen(!isOpen);
        }}
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
            e.preventDefault();
            setIsOpen(!isOpen);
          }
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', overflow: 'hidden' }}>
          {isLoading ? (
            <Loader2 size={16} className="animate-spin" style={{ color: 'var(--accent-secondary)' }} />
          ) : selectedOption?.icon ? (
            selectedOption.icon
          ) : null}

          <span
            style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              color: selectedOption || value ? 'var(--text-primary)' : 'var(--text-muted)',
              fontFamily:
                selectedOption?.badgeType === 'branch' || selectedOption?.badgeType === 'default'
                  ? 'var(--font-mono)'
                  : 'inherit',
            }}
          >
            {selectedOption ? selectedOption.label : value ? value : placeholder}
          </span>

          {selectedOption?.badge && (
            <span
              className={`branch-tag ${
                selectedOption.badgeType === 'default' ? 'branch-tag-default' : ''
              }`}
            >
              {selectedOption.badge}
            </span>
          )}
        </div>

        <ChevronDown
          size={16}
          style={{
            color: 'var(--text-muted)',
            transform: isOpen ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.2s ease',
            flexShrink: 0,
          }}
        />
      </div>

      {isOpen && (
        <div className="custom-select-dropdown">
          <div className="custom-select-search">
            <Search size={14} style={{ color: 'var(--text-muted)' }} />
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleCustomSubmit}
              placeholder={searchPlaceholder}
            />
          </div>

          <div className="custom-select-options">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => {
                const isSelected = option.value === value;
                return (
                  <div
                    key={option.value}
                    className={`custom-select-option ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleSelect(option.value)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', overflow: 'hidden' }}>
                      {option.icon}
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span
                          style={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            fontFamily:
                              option.badgeType === 'branch' || option.badgeType === 'default'
                                ? 'var(--font-mono)'
                                : 'inherit',
                          }}
                        >
                          {option.label}
                        </span>
                        {option.sublabel && (
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            {option.sublabel}
                          </span>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                      {option.badge && (
                        <span
                          className={`branch-tag ${
                            option.badgeType === 'default' ? 'branch-tag-default' : ''
                          }`}
                        >
                          {option.badge}
                        </span>
                      )}
                      {isSelected && <Check size={14} style={{ color: 'var(--accent-primary)' }} />}
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.825rem' }}>
                {allowCustomInput && searchTerm.trim() ? (
                  <div
                    onClick={() => handleSelect(searchTerm.trim())}
                    style={{
                      cursor: 'pointer',
                      color: 'var(--accent-secondary)',
                      fontWeight: 600,
                    }}
                  >
                    Use custom value "{searchTerm.trim()}" (Press Enter)
                  </div>
                ) : (
                  emptyText
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
