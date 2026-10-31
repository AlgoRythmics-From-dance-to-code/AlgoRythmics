'use client';

import { useAuth } from '@payloadcms/ui';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import '../../admin/custom.css';

/**
 * Client component that adds the user's role as a class to the document body.
 * This allows us to target specific roles in our admin CSS.
 */
export default function RoleBodyClass() {
  const { user } = useAuth();
  const role = (user as Record<string, unknown>)?.role;

  useEffect(() => {
    if (role) {
      document.body.classList.add(`role-${role}`);
      return () => {
        document.body.classList.remove(`role-${role}`);
      };
    }
  }, [role]);

  const [locale, setLocale] = useState('hu');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved =
        localStorage.getItem('locale') || localStorage.getItem('algorythmics_locale') || 'hu';
      setLocale(saved);
    }
  }, []);

  const statsText =
    locale === 'en'
      ? 'Pedagogical Statistics'
      : locale === 'ro'
        ? 'Statistici Pedagogice'
        : 'Pedagógiai Statisztikák';

  const backText =
    locale === 'en'
      ? 'Back to Main Page'
      : locale === 'ro'
        ? 'Înapoi la Pagina Principală'
        : 'Vissza a főoldalra';

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <Link
        href="/admin-statistics"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 12px',
          borderRadius: '8px',
          backgroundColor: '#269984',
          color: '#ffffff',
          fontWeight: 600,
          fontSize: '13px',
          textDecoration: 'none',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        }}
      >
        <span>📊</span>
        <span>{statsText}</span>
      </Link>
      <Link
        href="/"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 12px',
          borderRadius: '8px',
          backgroundColor: 'var(--theme-elevation-150, #222)',
          color: 'var(--theme-elevation-800, #ccc)',
          fontWeight: 600,
          fontSize: '13px',
          textDecoration: 'none',
          border: '1px solid var(--theme-elevation-250, #444)',
        }}
      >
        <span>🌐</span>
        <span>{backText}</span>
      </Link>
    </div>
  );
}
