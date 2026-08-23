'use client';

import React from 'react';

/**
 * Custom navigation widget in Payload Admin sidebar
 * linking directly to the comprehensive Learning Analytics dashboard.
 */
export default function AdminStatsNavLink() {
  return (
    <div
      style={{
        padding: '16px',
        margin: '12px 16px',
        borderRadius: '12px',
        background: 'linear-gradient(135deg, rgba(38, 153, 132, 0.15), rgba(16, 185, 129, 0.15))',
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
        Hibapontok, kognitív hezitálás és PES lelassulási mutatók.
      </p>
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
      <a
        href="/admin/statistics"
        rel="external"
        onClick={(e) => {
          e.preventDefault();
          window.location.href = '/admin/statistics';
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          padding: '8px 12px',
          backgroundColor: '#269984',
          color: '#ffffff',
          borderRadius: '8px',
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
  );
}
