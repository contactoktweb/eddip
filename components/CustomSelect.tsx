'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';

export interface SelectOption {
  value: string;
  label: string;
}

interface CustomSelectProps {
  id?: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: (SelectOption | string)[];
  placeholder?: string;
  disabled?: boolean;
  disabledMessage?: string;
  error?: string;
  required?: boolean;
  searchable?: boolean;
}

export default function CustomSelect({
  id,
  label,
  value,
  onChange,
  options,
  placeholder = 'Selecciona una opción...',
  disabled = false,
  disabledMessage,
  error,
  required = false,
  searchable = true,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Normalizar opciones a formato { value, label }
  const formattedOptions: SelectOption[] = useMemo(() => {
    return options.map(opt => (typeof opt === 'string' ? { value: opt, label: opt } : opt));
  }, [options]);

  // Encontrar opción seleccionada
  const selectedOption = useMemo(() => {
    return formattedOptions.find(opt => opt.value === value);
  }, [formattedOptions, value]);

  // Filtrado insensible a mayúsculas y tildes
  const filteredOptions = useMemo(() => {
    if (!search.trim()) return formattedOptions;
    const cleanSearch = search
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    return formattedOptions.filter(opt => {
      const cleanLabel = opt.label
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
      return cleanLabel.includes(cleanSearch);
    });
  }, [formattedOptions, search]);

  // Cerrar al hacer clic fuera del componente
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      // Autoenfoque en el buscador interno
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  // Manejador de teclado para accesibilidad
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (e.key === 'Escape') {
      setIsOpen(false);
      setSearch('');
    } else if (e.key === 'Enter' || e.key === ' ') {
      if (!isOpen) {
        e.preventDefault();
        setIsOpen(true);
      }
    }
  };

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearch('');
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      {label && (
        <label
          htmlFor={id}
          style={{
            display: 'block',
            fontSize: 12,
            fontWeight: 700,
            color: '#334155',
            marginBottom: 6,
          }}
        >
          {label} {required && <span style={{ color: '#dc2626' }}>*</span>}
        </label>
      )}

      {/* Disparador del Select */}
      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        title={disabled && disabledMessage ? disabledMessage : undefined}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 14px',
          borderRadius: 12,
          border: `1px solid ${error ? '#ef4444' : isOpen ? '#071F49' : '#cbd5e1'}`,
          fontSize: 14,
          textAlign: 'left',
          background: disabled ? '#f8fafc' : '#ffffff',
          color: disabled ? '#94a3b8' : selectedOption ? '#0f172a' : '#94a3b8',
          cursor: disabled ? 'not-allowed' : 'pointer',
          outline: 'none',
          boxShadow: isOpen ? '0 0 0 3px rgba(7, 31, 73, 0.08)' : 'none',
          transition: 'all 0.18s ease',
        }}
      >
        <span
          style={{
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            paddingRight: 8,
          }}
        >
          {selectedOption ? selectedOption.label : disabled && disabledMessage ? disabledMessage : placeholder}
        </span>

        {/* Icono Chevron SVG interactivo */}
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
            color: disabled ? '#cbd5e1' : '#64748b',
            flexShrink: 0,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </span>
      </button>

      {/* Dropdown flotante */}
      {isOpen && !disabled && (
        <div
          role="listbox"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            zIndex: 100,
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 14,
            boxShadow: '0 12px 28px -4px rgba(7, 31, 73, 0.14), 0 6px 14px -2px rgba(7, 31, 73, 0.08)',
            padding: '6px',
            animation: 'customSelectIn 0.15s ease-out forwards',
          }}
        >
          {/* Buscador interno si la lista tiene muchas opciones */}
          {searchable && formattedOptions.length > 5 && (
            <div style={{ position: 'relative', padding: '4px 4px 8px 4px', borderBottom: '1px solid #f1f5f9', marginBottom: 4 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 8,
                  padding: '6px 10px',
                  gap: 8,
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Escribe para buscar..."
                  style={{
                    width: '100%',
                    border: 'none',
                    outline: 'none',
                    background: 'transparent',
                    fontSize: 12.5,
                    color: '#0f172a',
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && filteredOptions.length > 0) {
                      e.preventDefault();
                      handleSelect(filteredOptions[0].value);
                    }
                  }}
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    style={{
                      border: 'none',
                      background: 'none',
                      cursor: 'pointer',
                      padding: 0,
                      color: '#94a3b8',
                      display: 'grid',
                      placeItems: 'center',
                    }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Lista de opciones scrolleable */}
          <div
            style={{
              maxHeight: 210,
              overflowY: 'auto',
              paddingRight: 2,
            }}
          >
            {filteredOptions.length === 0 ? (
              <div
                style={{
                  padding: '16px 12px',
                  textAlign: 'center',
                  fontSize: 12.5,
                  color: '#94a3b8',
                }}
              >
                No se encontraron resultados para &ldquo;{search}&rdquo;
              </div>
            ) : (
              filteredOptions.map(opt => {
                const isSelected = opt.value === value;
                return (
                  <div
                    key={opt.value}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(opt.value)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '9px 12px',
                      borderRadius: 8,
                      fontSize: 13.5,
                      cursor: 'pointer',
                      background: isSelected ? '#071F49' : 'transparent',
                      color: isSelected ? '#ffffff' : '#1e293b',
                      fontWeight: isSelected ? 600 : 400,
                      transition: 'background 0.12s ease, color 0.12s ease',
                      marginBottom: 2,
                    }}
                    onMouseEnter={e => {
                      if (!isSelected) {
                        e.currentTarget.style.background = '#f1f5f9';
                        e.currentTarget.style.color = '#071F49';
                      }
                    }}
                    onMouseLeave={e => {
                      if (!isSelected) {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = '#1e293b';
                      }
                    }}
                  >
                    <span>{opt.label}</span>
                    {isSelected && (
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {error && (
        <span style={{ fontSize: 11, color: '#dc2626', marginTop: 4, display: 'block' }}>
          {error}
        </span>
      )}
    </div>
  );
}
