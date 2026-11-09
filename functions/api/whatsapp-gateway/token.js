const FONNTE_GET_DEVICES_ENDPOINT = 'https://api.fonnte.com/get-devices';
const FIRESTORE_WA_STATE_REST_URL =
  'https://firestore.googleapis.com/v1/projects/panaikang-smart-environment/databases/ai-studio-panaikangsmarten-4feb23ef-f14d-4f7d-ab34-e0951be3a4fd/documents/panaikang_app_data/wa_gateway_state';
const WA_CIPHER_KEY = 'pnk-wa-gw-2026-sec-key';

function encodeServerWaToken(rawToken) {
  const clean = (rawToken || '').trim();
  if (!clean) return '';
  const bytes = [];
  for (let i = 0; i < clean.length; i++) {
    bytes.push(clean.charCodeAt(i) ^ WA_CIPHER_KEY.charCodeAt(i % WA_CIPHER_KEY.length));
  }
  return `v1:${bytes.map((b) => b.toString(16).padStart(2, '0')).join('')}`;
}

async function resolveDeviceTokenIfAccountToken(candidateToken) {
  if (!candidateToken) return '';
  try {
    const resp = await fetch(FONNTE_GET_DEVICES_ENDPOINT, {
      method: 'POST',
      headers: { Authorization: candidateToken },
    });
    if (!resp.ok) return candidateToken;
    const data = await resp.json().catch(() => null);
    if (data && (data.status === true || data.status === 'true') && Array.isArray(data.data) && data.data.length > 0) {
      const connectedDev =
        data.data.find((d) => String(d?.status || '').toLowerCase() === 'connect') ||
        data.data[0];
      if (connectedDev?.token && typeof connectedDev.token === 'string') {
        return connectedDev.token.trim();
      }
    }
  } catch {}
  return candidateToken;
}

export async function onRequest(context) {
  const { request } = context;
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept',
    'Cache-Control': 'no-store, max-age=0',
    'Content-Type': 'application/json',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ ok: false, message: 'Method Not Allowed' }), {
      status: 405,
      headers: corsHeaders,
    });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const tokenInput = String(body.token || body.fonnteToken || '').trim();
    if (!tokenInput) {
      return new Response(
        JSON.stringify({ ok: false, message: 'Token Fonnte tidak boleh kosong.' }),
        { status: 400, headers: corsHeaders }
      );
    }

    let cleaned = tokenInput
      .replace(/^Bearer\s+/i, '')
      .replace(/^["']|["']$/g, '')
      .trim();

    cleaned = await resolveDeviceTokenIfAccountToken(cleaned);

    const encodedToken = encodeServerWaToken(cleaned);
    const tokenMasked =
      cleaned.length >= 8
        ? `${cleaned.slice(0, 4)}••••••••${cleaned.slice(-4)}`
        : `${cleaned.slice(0, 2)}••••`;

    const patchUrl = `${FIRESTORE_WA_STATE_REST_URL}?updateMask.fieldPaths=encodedToken&updateMask.fieldPaths=tokenMasked&updateMask.fieldPaths=updatedAt`;
    await fetch(patchUrl, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: {
          encodedToken: { stringValue: encodedToken },
          tokenMasked: { stringValue: tokenMasked },
          updatedAt: { integerValue: String(Date.now()) },
        },
      }),
    });

    return new Response(
      JSON.stringify({
        ok: true,
        message:
          'FONNTE_TOKEN berhasil disimpan secara aman di Server & Cloud Database (tahan restart & tersinkronisasi lintas platform).',
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({
        ok: false,
        message: err instanceof Error ? err.message : 'Gagal menyimpan token Fonnte ke server.',
      }),
      { status: 500, headers: corsHeaders }
    );
  }
}
