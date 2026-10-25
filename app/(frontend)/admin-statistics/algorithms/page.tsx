import { Metadata } from 'next';
import AdminAlgorithmsClient from './AdminAlgorithmsClient';

export const metadata: Metadata = {
  title: 'Admin Algoritmus Elemzés & Statisztika | AlgoRythmics',
  description: 'Önálló algoritmusok teljesítménye, hibagócai, hezitálási idők és kognitív tanulási mutatók elemzése.',
};

export default function AdminAlgorithmsPage() {
  return <AdminAlgorithmsClient />;
}
