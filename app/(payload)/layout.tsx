import config from '../../payload.config';
import { handleServerFunctions, RootLayout } from '@payloadcms/next/layouts';
import React from 'react';
import LocaleProvider from '../i18n/LocaleProvider';

import { importMap } from './admin/importMap.js';
import '@payloadcms/next/css';

type ServerFunctionArgs = {
  args: Record<string, unknown>;
  name: string;
  [key: string]: unknown;
};

type Args = {
  children: React.ReactNode;
};

const serverFunction = async function (args: ServerFunctionArgs) {
  'use server';
  return handleServerFunctions({
    ...args,
    config,
    importMap,
  });
};

export default function Layout({ children }: Args) {
  return (
    <RootLayout config={config} importMap={importMap} serverFunction={serverFunction}>
      <LocaleProvider initialLocale="hu">{children}</LocaleProvider>
    </RootLayout>
  );
}
