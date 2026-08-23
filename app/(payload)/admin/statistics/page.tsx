import React from 'react';
import { redirect } from 'next/navigation';
import { headers as getHeaders } from 'next/headers';
import { getPayloadInstance } from '../../../../lib/payload';
import { ROLES } from '../../../../lib/constants';
import AdminStatisticsClient from '../../../components/Admin/Statistics/AdminStatisticsClient';
import '@/app/globals.css';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Tanulási Elemzés & Statisztikák | AlgoRythmics Admin',
  description: 'Valós idejű pedagógiai metrikák, hibapontok és kognitív tanulási elemzések',
};

export default async function AdminStatisticsPage() {
  const headers = await getHeaders();
  const payload = await getPayloadInstance();

  // 1. Verify Payload Admin session
  const { user } = await payload.auth({ headers });

  if (!user) {
    redirect('/admin/login');
  }

  const role = (user as { role?: string }).role;
  if (role !== ROLES.ADMIN && role !== ROLES.EDITOR) {
    redirect('/admin/unauthorized');
  }

  return (
    <main className="w-full min-h-screen bg-slate-50 dark:bg-[#0b0f19] text-slate-900 dark:text-slate-100 transition-colors">
      <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <AdminStatisticsClient />
      </div>
    </main>
  );
}
