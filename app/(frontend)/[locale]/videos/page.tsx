import VideosClient from './VideosClient';
import { getT } from '../../../../lib/i18n-server';

export async function generateMetadata() {
  const t = await getT();
  return {
    title: t('nav.videos'),
  };
}

export default function VideosPage() {
  return <VideosClient />;
}
