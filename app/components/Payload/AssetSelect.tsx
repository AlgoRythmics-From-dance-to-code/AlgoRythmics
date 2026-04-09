'use client';
import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { useField } from '@payloadcms/ui';

const assetOptions = [
  { label: 'Algo Backtracking Icon', value: 'algo_backtracking_icon.svg' },
  { label: 'Algo Binary Search', value: 'algo_binary_search.svg' },
  { label: 'Algo Bogosort', value: 'algo_bogosort.svg' },
  { label: 'Algo Group 109', value: 'algo_group_109.svg' },
  { label: 'Algo Group 119', value: 'algo_group_119.svg' },
  { label: 'Algo Group 132', value: 'algo_group_132.svg' },
  { label: 'Algo Group 142', value: 'algo_group_142.svg' },
  { label: 'Algo Group 166', value: 'algo_group_166.svg' },
  { label: 'Algo Group 167', value: 'algo_group_167.svg' },
  { label: 'Algo Group 168', value: 'algo_group_168.svg' },
  { label: 'Algo Group 170', value: 'algo_group_170.svg' },
  { label: 'Algo Group 174', value: 'algo_group_174.svg' },
  { label: 'Algo Group 176', value: 'algo_group_176.svg' },
  { label: 'Algo Group 177', value: 'algo_group_177.svg' },
  { label: 'Algo Group 181', value: 'algo_group_181.svg' },
  { label: 'Algo Group 182', value: 'algo_group_182.svg' },
  { label: 'Algo Group 184', value: 'algo_group_184.svg' },
  { label: 'Algo Linear Search', value: 'algo_linear_search.svg' },
  { label: 'Algo List Icon', value: 'algo_list_icon.svg' },
  { label: 'Algo Magnifying Glass', value: 'algo_magnifying_glass.svg' },
  { label: 'Algo N-Queens', value: 'algo_n_queens.svg' },
  { label: 'Algo Sorting Icon', value: 'algo_sorting_icon.svg' },
  { label: 'Bubble Dragon', value: 'bubble_dragon.png' },
  { label: 'Group 20', value: 'group_20.svg' },
  { label: 'Group 21', value: 'group_21.svg' },
  { label: 'Group 23', value: 'group_23.svg' },
  { label: 'Group 25', value: 'group_25.svg' },
  { label: 'Group 28', value: 'group_28.svg' },
  { label: 'Group 34', value: 'group_34.svg' },
  { label: 'Group 38', value: 'group_38.svg' },
  { label: 'Group 43', value: 'group_43.svg' },
  { label: 'Group 47', value: 'group_47.svg' },
  { label: 'Group 500', value: 'group_500.svg' },
  { label: 'Group 51', value: 'group_51.svg' },
  { label: 'Group 65', value: 'group_65.svg' },
  { label: 'Group 70', value: 'group_70.svg' },
  { label: 'Group 71', value: 'group_71.svg' },
  { label: 'Group 75', value: 'group_75.svg' },
  { label: 'Group 77', value: 'group_77.svg' },
  { label: 'Hero Ground Path', value: 'hero_ground_path.svg' },
  { label: 'Illustration No BG', value: 'illustration_no_bg.png' },
  { label: 'Login Girl Phone Illu', value: 'Login_girl_phone_illu.svg' },
  { label: 'Logo White', value: 'logowhite.svg' },
  { label: 'Path 1', value: 'path_1.svg' },
  { label: 'Path 1568', value: 'path_1568.svg' },
  { label: 'Path 3', value: 'path_3.svg' },
];

const VisualSelect: React.FC<{
  path: string;
  label?: string | { htmlFor: string };
}> = ({ path, label: labelFromProps }) => {
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

  const selectedOption = assetOptions.find((opt) => opt.value === value);
  const labelText =
    typeof labelFromProps === 'string'
      ? labelFromProps
      : labelFromProps?.htmlFor || 'Válassz képet';

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
          transition: 'all 0.15s ease-in-out',
          fontSize: '13px',
          boxShadow: isOpen ? '0 0 0 2px rgba(var(--theme-elevation-400-rgb), 0.05)' : 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {value ? (
            <>
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '2px',
                  backgroundColor: 'var(--theme-elevation-100)',
                  borderRadius: '1px',
                  border: '1px solid var(--theme-elevation-150)',
                }}
              >
                <Image
                  src={`/assets/${value}`}
                  alt=""
                  width={20}
                  height={20}
                  style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                />
              </div>
              <span style={{ color: 'var(--theme-elevation-900)', fontWeight: '500' }}>
                {selectedOption?.label || value}
              </span>
            </>
          ) : (
            <span style={{ color: 'var(--theme-elevation-400)', fontStyle: 'italic' }}>
              Válassz egy képet a könyvtárból...
            </span>
          )}
        </div>
        <span
          style={{
            fontSize: '10px',
            color: 'var(--theme-elevation-400)',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
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
            padding: '6px',
          }}
        >
          {assetOptions.map((option) => (
            <div
              key={option.value}
              onClick={() => {
                setValue(option.value);
                setIsOpen(false);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '8px 12px',
                cursor: 'pointer',
                borderRadius: '1px',
                backgroundColor:
                  value === option.value ? 'var(--theme-elevation-200)' : 'transparent',
                transition: 'background-color 0.1s ease',
                marginBottom: '2px',
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = 'var(--theme-elevation-250)')
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor =
                  value === option.value ? 'var(--theme-elevation-200)' : 'transparent')
              }
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  backgroundColor: 'var(--theme-elevation-0)',
                  borderRadius: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '4px',
                  border: '1px solid var(--theme-elevation-150)',
                }}
              >
                <Image
                  src={`/assets/${option.value}`}
                  alt=""
                  width={28}
                  height={28}
                  style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                />
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <span
                  style={{
                    fontSize: '13px',
                    fontWeight: value === option.value ? 'bold' : '500',
                    color: 'var(--theme-elevation-800)',
                  }}
                >
                  {option.label}
                </span>
                <span
                  style={{
                    fontSize: '10px',
                    color: 'var(--theme-elevation-400)',
                    fontFamily: 'monospace',
                  }}
                >
                  {option.value}
                </span>
              </div>
              {value === option.value && (
                <span
                  style={{
                    color: 'var(--theme-success-500)',
                    fontSize: '14px',
                    fontWeight: 'bold',
                  }}
                >
                  ✓
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const IllustrationSelect: React.FC<{
  path?: string;
  label?: string | { htmlFor: string };
}> = (props) => (
  <VisualSelect
    path={props.path || 'illustrationAsset'}
    label={props.label || 'Kurzus Illusztrációja'}
  />
);
export const MascotSelect: React.FC<{ path?: string; label?: string | { htmlFor: string } }> = (
  props,
) => <VisualSelect path={props.path || 'mascot.asset'} label={props.label || 'Kabala Figurája'} />;
