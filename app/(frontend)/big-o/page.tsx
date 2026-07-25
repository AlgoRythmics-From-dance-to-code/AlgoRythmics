import { Suspense } from 'react';
import BigOClient from './BigOClient';
import { getT } from '../../../lib/i18n-server';

export async function generateMetadata() {
  const t = await getT();
  return {
    title: `${t('nav.big_o')} - AlgoRythmics`,
    description: t('big_o.subtitle'),
  };
}

export default function BigOPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-[#269984] border-t-transparent"></div>
        </div>
      }
    >
      <BigOClient />
    </Suspense>
  );
}
