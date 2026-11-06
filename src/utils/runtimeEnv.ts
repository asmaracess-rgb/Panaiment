/**
 * Runtime environment detection & circuit-breaker for local Express (server.ts)
 * vs Vercel Serverless Production hosting.
 *
 * Ensures 100% compatibility between local/AI Studio development (Express + SSE)
 * and Vercel Production (Static CDN + Firebase Firestore real-time sync) without
 * causing 404 reconnect loops or redundant Fast Origin Transfer (FOT).
 */

let expressBackendDetected: boolean | null = null;

/**
 * Returns true if the current hostname is a Vercel deployment domain
 * or if the local Express backend has been marked unavailable (e.g. 404 on Express-only routes).
 */
export function isVercelServerlessRuntime(): boolean {
  if (typeof window === 'undefined') return false;
  const host = (window.location.hostname || '').toLowerCase();
  if (host.endsWith('.vercel.app')) {
    return true;
  }
  if (expressBackendDetected === false) {
    return true;
  }
  return false;
}

/**
 * Returns true only when local Express routes (/api/realtime/stream, /api/traffic, /api/profile, etc.)
 * are expected to be available.
 */
export function isLocalExpressAvailable(): boolean {
  return !isVercelServerlessRuntime();
}

/**
 * Marks the local Express backend as unavailable for the remainder of the browser session
 * if an Express-only endpoint returns 404 Not Found.
 */
export function markLocalExpressUnavailable(): void {
  expressBackendDetected = false;
}

/**
 * Wrapper for fire-and-forget calls to Express-only persistence routes
 * (such as /api/profile, /api/rw-groups, /api/siskamling, etc. which only exist in server.ts
 * while Firestore handles cloud persistence in production).
 */
export async function fetchLocalExpressOnly(
  url: string,
  init?: RequestInit
): Promise<Response | null> {
  if (isVercelServerlessRuntime()) {
    return null;
  }
  try {
    const res = await fetch(url, init);
    if (res.status === 404) {
      markLocalExpressUnavailable();
      return null;
    }
    return res;
  } catch {
    return null;
  }
}
