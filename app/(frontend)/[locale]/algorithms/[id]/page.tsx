import AlgorithmDetailClient from './AlgorithmDetailClient';
import { getT } from '../../../../../lib/i18n-server';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const t = await getT();
  return {
    title: t(`algorithms.list.${id}.name`),
    description: t(`algorithms.list.${id}.description`),
  };
}

export default async function AlgorithmDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AlgorithmDetailClient id={id} />;
}
