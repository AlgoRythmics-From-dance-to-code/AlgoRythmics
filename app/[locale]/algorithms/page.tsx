import AlgorithmsClient from './AlgorithmsClient';
import { getT } from '../../../lib/i18n-server';

export async function generateMetadata() {
  const t = await getT();
  return {
    title: t('nav.algorithms'),
  };
}

export default function AlgorithmsPage() {
  return <AlgorithmsClient />;
}
