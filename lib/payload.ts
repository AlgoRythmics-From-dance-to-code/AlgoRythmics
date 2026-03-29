import { getPayload } from 'payload';
import payloadConfig from '../payload.config';
import type { Payload } from 'payload';

let payloadPromise: Promise<Payload> | null = null;

/**
 * Gets the Payload instance, caching it for subsequent calls.
 * This helps avoid repeated heavy initialization during the login flow.
 * Caches the initialization promise to handle concurrent calls efficiently.
 */
export async function getPayloadInstance(): Promise<Payload> {
  if (payloadPromise) {
    return payloadPromise;
  }

  // Assign the promise first to handle concurrent invocations
  payloadPromise = getPayload({ config: payloadConfig });

  try {
    return await payloadPromise;
  } catch (error) {
    // Reset if initialization failed to allow retry
    payloadPromise = null;
    throw error;
  }
}
