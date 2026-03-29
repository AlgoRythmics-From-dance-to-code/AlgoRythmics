import { getPayload } from 'payload';
import configPromise from '../payload.config';
import type { Payload } from 'payload';

let cachedPayload: Payload | null = null;

/**
 * Gets the Payload instance, caching it for subsequent calls.
 * This helps avoid repeated heavy initialization during the login flow.
 */
export async function getPayloadInstance(): Promise<Payload> {
  if (cachedPayload) {
    return cachedPayload;
  }

  cachedPayload = (await getPayload({ config: configPromise })) as unknown as Payload;
  return cachedPayload;
}
