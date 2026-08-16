import { Suspense } from 'react';
import MultiplayerClient from './MultiplayerClient';
import { getT } from '../../../lib/i18n-server';

export async function generateMetadata() {
  const t = await getT();
  return {
    title: `${t('nav.multiplayer') || 'Multiplayer'} - AlgoRythmics`,
    description:
      'Valós idejű többjátékos algoritmus tanulás és aréna térbeli mozgással és diszkrét irányítással.',
  };
}

export default function MultiplayerPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-teal-500 border-t-transparent" />
        </div>
      }
    >
      <MultiplayerClient />
    </Suspense>
  );
}
