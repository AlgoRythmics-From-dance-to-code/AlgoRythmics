import { Metadata } from 'next';
import AdminStatisticsClient from './AdminStatisticsClient';

export const metadata: Metadata = {
  title: 'Admin Statisztikák & Pedagógiai Elemzés | AlgoRythmics',
  description: 'Részletes tanulási statisztikák, hibagócok és kognitív tanulási mutatók elemzése.',
};

export default function AdminStatisticsPage() {
  return <AdminStatisticsClient />;
}
