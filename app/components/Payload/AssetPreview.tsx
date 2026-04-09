'use client';
import React from 'react';
import Image from 'next/image';
import { useField } from '@payloadcms/ui';

const PreviewBase: React.FC<{ value: string | undefined }> = ({ value }) => {
  if (!value) {
    return (
      <div
        style={{
          marginTop: '10px',
          padding: '20px',
          border: '2px dashed #ddd',
          borderRadius: '8px',
          textAlign: 'center',
          color: '#999',
          fontSize: '12px',
        }}
      >
        Nincs kiválasztott kép
      </div>
    );
  }

  return (
    <div
      style={{
        marginTop: '10px',
        padding: '10px',
        border: '1px solid #ddd',
        borderRadius: '8px',
        backgroundColor: '#f9f9f9',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '10px',
      }}
    >
      <span
        style={{ fontSize: '10px', color: '#666', fontWeight: 'bold', textTransform: 'uppercase' }}
      >
        Előnézet:
      </span>
      <Image
        src={`/assets/${value}`}
        alt="Preview"
        width={300}
        height={150}
        style={{
          maxWidth: '100%',
          maxHeight: '150px',
          objectFit: 'contain',
          borderRadius: '4px',
        }}
      />
      <code style={{ fontSize: '10px', color: '#269984' }}>{value}</code>
    </div>
  );
};

export const IllustrationPreview: React.FC = () => {
  const { value } = useField<string>({ path: 'illustrationAsset' });
  return <PreviewBase value={value} />;
};

export const MascotPreview: React.FC = () => {
  const { value } = useField<string>({ path: 'mascot.asset' });
  return <PreviewBase value={value} />;
};
