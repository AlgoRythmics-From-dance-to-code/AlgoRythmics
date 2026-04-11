'use client';
import React, { useState, useRef, useEffect } from 'react';
import { useField, useFormFields } from '@payloadcms/ui';
import { useLocale } from '../../i18n/LocaleProvider';

// Import algorithm registry (client-side safe if structured correctly)
import { getAlgorithm } from '../../../lib/algorithms/registry';

// Static list of algo IDs for the main selector (we could also extract this from registry keys)
const algorithmOptions = (t: (key: string) => string) => [
  { label: `${t('common.not_available')} / ${t('common.custom')}`, value: '' },
  { label: 'Bubble Sort', value: 'bubble-sort' },
  { label: 'Insertion Sort', value: 'insertion-sort' },
  { label: 'Selection Sort', value: 'selection-sort' },
  { label: 'Merge Sort', value: 'merge-sort' },
  { label: 'Quick Sort', value: 'quick-sort' },
  { label: 'Linear Search', value: 'linear-search' },
  { label: 'Binary Search', value: 'binary-search' },
  { label: 'Shell Sort', value: 'shell-sort' },
  { label: 'Heap Sort', value: 'heap-sort' },
  { label: 'Bogosort', value: 'bogosort' },
  { label: 'N-Queens', value: 'n-queens' },
];

export const AlgorithmIdSelect: React.FC<{
  path: string;
  label?: string | { htmlFor: string };
}> = ({ path, label: labelFromProps }) => {
  const { t } = useLocale();
  const { value, setValue } = useField<string>({ path });
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMounted(true);
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isMounted) return null;

  const options = algorithmOptions(t);
  const selectedOption = options.find((opt) => opt.value === value) || {
    label: value,
    value,
  };
  const labelText = typeof labelFromProps === 'string' ? labelFromProps : t('admin.algorithm_type');

  return (
    <div
      className="field-type text"
      ref={containerRef}
      style={{ marginBottom: '25px', position: 'relative' }}
    >
      <div
        className="field-label"
        style={{
          marginBottom: '10px',
          fontSize: '11px',
          fontWeight: 'bold',
          letterSpacing: '0.05em',
          color: 'var(--theme-elevation-600)',
          textTransform: 'uppercase',
        }}
      >
        {labelText}
      </div>

      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 15px',
          border: isOpen
            ? '1px solid var(--theme-elevation-400)'
            : '1px solid var(--theme-elevation-150)',
          borderRadius: '2px',
          backgroundColor: 'var(--theme-elevation-0)',
          cursor: 'pointer',
          minHeight: '42px',
          fontSize: '13px',
        }}
      >
        <span
          style={{
            color: value ? 'var(--theme-elevation-900)' : 'var(--theme-elevation-400)',
            fontWeight: '500',
          }}
        >
          {selectedOption.label || t('admin.choose_algorithm')}
        </span>
        <span
          style={{
            fontSize: '10px',
            color: 'var(--theme-elevation-400)',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        >
          ▼
        </span>
      </div>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            zIndex: 1000,
            backgroundColor: 'var(--theme-elevation-100)',
            border: '1px solid var(--theme-elevation-300)',
            borderRadius: '2px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
            maxHeight: '280px',
            overflowY: 'auto',
          }}
        >
          {options.map((option) => (
            <div
              key={option.value}
              onClick={() => {
                setValue(option.value);
                setIsOpen(false);
              }}
              style={{
                padding: '10px 15px',
                cursor: 'pointer',
                backgroundColor:
                  value === option.value ? 'var(--theme-elevation-200)' : 'transparent',
                fontSize: '13px',
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = 'var(--theme-elevation-250)')
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor =
                  value === option.value ? 'var(--theme-elevation-200)' : 'transparent')
              }
            >
              {option.label}{' '}
              <span style={{ fontSize: '10px', opacity: 0.5 }}>
                ({option.value || t('common.not_available')})
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const PhaseIdSelect: React.FC<{
  path: string;
  label?: string | { htmlFor: string };
}> = ({ path, label: labelFromProps }) => {
  const { t } = useLocale();
  const { value, setValue } = useField<string>({ path });
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Determine the sibling field path for sourceAlgorithmId
  const pathParts = path.split('.');
  const siblingPath = [...pathParts.slice(0, -1), 'sourceAlgorithmId'].join('.');

  // In Payload 3, using the useFormFields hook is required to strictly read a sibling path, as useField can trigger ADD_FIELD registration conflicts resulting in infinite React update loops.
  const algorithmId = useFormFields(([fields]) => fields[siblingPath]?.value as string);
  const algoDef = algorithmId ? getAlgorithm(algorithmId) : null;
  const suggestedPhases = algoDef?.suggestedPhases || [];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isMounted) return null;

  const labelText = typeof labelFromProps === 'string' ? labelFromProps : t('admin.phase_id');

  return (
    <div
      className="field-type text"
      ref={containerRef}
      style={{ marginBottom: '15px', position: 'relative' }}
    >
      <div
        className="field-label"
        style={{
          marginBottom: '5px',
          fontSize: '11px',
          fontWeight: 'bold',
          color: 'var(--theme-elevation-600)',
        }}
      >
        {labelText}
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        <input
          type="text"
          value={value || ''}
          onChange={(e) => setValue(e.target.value)}
          placeholder="pl. bubble-sort-motivation"
          style={{
            flex: 1,
            padding: '8px 12px',
            border: '1px solid var(--theme-elevation-150)',
            borderRadius: '2px',
            backgroundColor: 'var(--theme-elevation-0)',
            fontSize: '13px',
          }}
        />

        {suggestedPhases.length > 0 && (
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            style={{
              padding: '0 12px',
              border: '1px solid var(--theme-elevation-150)',
              borderRadius: '2px',
              backgroundColor: 'var(--theme-elevation-100)',
              cursor: 'pointer',
              fontSize: '11px',
              fontWeight: 'bold',
            }}
          >
            {t('admin.suggestion')} ▼
          </button>
        )}
      </div>

      {isOpen && suggestedPhases.length > 0 && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            zIndex: 1000,
            backgroundColor: 'var(--theme-elevation-100)',
            border: '1px solid var(--theme-elevation-300)',
            borderRadius: '2px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
            maxHeight: '200px',
            overflowY: 'auto',
          }}
        >
          {suggestedPhases.map((phase) => {
            const fullId = algorithmId ? `${algorithmId}-${phase.id}` : phase.id;
            return (
              <div
                key={phase.id}
                onClick={() => {
                  setValue(fullId);
                  setIsOpen(false);
                }}
                style={{
                  padding: '8px 12px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  borderBottom: '1px solid var(--theme-elevation-150)',
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = 'var(--theme-elevation-250)')
                }
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <strong>{phase.label}</strong>
                <div style={{ fontSize: '10px', opacity: 0.6 }}>ID: {fullId}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
