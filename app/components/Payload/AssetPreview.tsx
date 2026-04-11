'use client';
import React from 'react';
import Image from 'next/image';
import { useFormFields } from '@payloadcms/ui';
import { useLocale } from '../../i18n/LocaleProvider';

const PreviewBase: React.FC<{ value: string | undefined }> = ({ value }) => {
  const { t } = useLocale();
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
        {t('admin.no_image_selected')}
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
        {t('admin.preview')}
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
  const value = useFormFields(([fields]) => fields['illustrationAsset']?.value as string);
  return <PreviewBase value={value} />;
};

export const MascotPreview: React.FC = () => {
  const value = useFormFields(([fields]) => fields['mascot.asset']?.value as string);
  return <PreviewBase value={value} />;
};
