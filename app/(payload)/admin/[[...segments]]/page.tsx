import config from '../../../../payload.config';
import { RootPage } from '@payloadcms/next/views';
import { importMap } from '../importMap.js';

type Args = {
  params: Promise<{
    segments: string[];
  }>;
  searchParams: Promise<{
    [key: string]: string | string[];
  }>;
};

export default function Page(args: Args) {
  return RootPage({ config, importMap, ...args });
}
