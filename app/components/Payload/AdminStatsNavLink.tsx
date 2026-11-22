'use client';

import React, { useEffect, useState } from 'react';

/**
 * Custom navigation widget in Payload Admin sidebar
 * linking directly to the Learning Analytics dashboard
 * and providing a 1-click Global AI Mascot Master Switch for Admins.
 */
export default function AdminStatsNavLink() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [mascotEnabled, setMascotEnabled] = useState<boolean>(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    fetch('/api/admin/ai-settings', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!active || !data) return;
        setIsAdmin(Boolean(data.isAdmin));
        setMascotEnabled(data.mascotEnabled !== false);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleToggleMascot = async () => {
    if (saving) return;
    const nextVal = !mascotEnabled;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/ai-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ mascotEnabled: nextVal }),
      });
      if (res.ok) {
        const json = await res.json();
        setMascotEnabled(json.mascotEnabled !== false);
      }
    } catch {
      // Ignore error
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', margin: '12px 16px' }}>
      {/* 1. Global AI Mascot Master Switch (Admins only) */}
      {!loading && isAdmin && (
        <div
          style={{
            padding: '16px',
            borderRadius: '16px',
            background: mascotEnabled
              ? 'linear-gradient(135deg, rgba(38, 153, 132, 0.16), rgba(16, 185, 129, 0.1))'
              : 'linear-gradient(135deg, rgba(239, 68, 68, 0.16), rgba(185, 28, 28, 0.08))',
            border: mascotEnabled
              ? '1.5px solid rgba(38, 153, 132, 0.45)'
              : '1.5px solid rgba(239, 68, 68, 0.45)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '8px',
              marginBottom: '6px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '18px' }}>🤖</span>
              <span
                style={{
                  fontSize: '13px',
                  fontWeight: '800',
                  color: mascotEnabled ? '#269984' : '#ef4444',
                  letterSpacing: '0.02em',
                }}
              >
                AI Kabala (Bubi)
              </span>
            </div>
            <span
              style={{
                fontSize: '10px',
                fontWeight: '800',
                padding: '2px 8px',
                borderRadius: '999px',
                backgroundColor: mascotEnabled
                  ? 'rgba(38, 153, 132, 0.2)'
                  : 'rgba(239, 68, 68, 0.2)',
                color: mascotEnabled ? '#269984' : '#ef4444',
                textTransform: 'uppercase',
              }}
            >
              {mascotEnabled ? 'AKTÍV' : 'KIKAPCSOLVA'}
            </span>
          </div>

          <p
            style={{
              fontSize: '11px',
              color: 'var(--theme-text, #888)',
              margin: '0 0 10px 0',
              lineHeight: '1.4',
            }}
          >
            {mascotEnabled
              ? 'Az AI kabala és chat aktív a kurzusokban. (AI kurzusgenerálás: aktív)'
              : 'Az AI chat ki van kapcsolva (a sima manuális kabala és az AI kurzusgenerálás továbbra is működik).'}
          </p>

          <button
            type="button"
            onClick={handleToggleMascot}
            disabled={saving}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '9px 12px',
              backgroundColor: mascotEnabled ? '#ef4444' : '#269984',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              fontSize: '12px',
              fontWeight: '700',
              cursor: saving ? 'wait' : 'pointer',
              opacity: saving ? 0.7 : 1,
              transition: 'background-color 0.2s',
            }}
          >
            <span>
              {saving
                ? 'Mentés...'
                : mascotEnabled
                  ? '⛔ AI Kabala Globális Kikapcsolása'
                  : '✅ AI Kabala Globális Bekapcsolása'}
            </span>
          </button>
        </div>
      )}

      {/* 2. Learning Analytics Dashboard Link */}
      <div
        style={{
          padding: '16px',
          borderRadius: '16px',
          background: 'linear-gradient(135deg, rgba(38, 153, 132, 0.15), rgba(16, 185, 129, 0.12))',
          border: '1px solid rgba(38, 153, 132, 0.3)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <span style={{ fontSize: '18px' }}>📊</span>
          <span
            style={{
              fontSize: '13px',
              fontWeight: '700',
              color: '#269984',
              letterSpacing: '0.02em',
            }}
          >
            Tanulási Elemzés
          </span>
        </div>
        <p
          style={{
            fontSize: '11px',
            color: 'var(--theme-text, #888)',
            margin: '0 0 10px 0',
            lineHeight: '1.4',
          }}
        >
          Pedagógiai hőtérkép, hibagócok, AI főkapcsoló és diák-előrehaladás.
        </p>
        <a
          href="/admin-statistics"
          rel="external"
          onClick={(e) => {
            e.preventDefault();
            window.location.href = '/admin-statistics';
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            padding: '8px 12px',
            backgroundColor: '#269984',
            color: '#ffffff',
            borderRadius: '10px',
            fontSize: '12px',
            fontWeight: '600',
            textDecoration: 'none',
            transition: 'background-color 0.2s',
            cursor: 'pointer',
          }}
        >
          <span>Megnyitás</span>
          <span>→</span>
        </a>
      </div>
    </div>
  );
}
