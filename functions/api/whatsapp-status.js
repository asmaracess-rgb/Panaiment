const FONNTE_DEVICE_ENDPOINT = 'https://api.fonnte.com/device';
const FONNTE_GET_DEVICES_ENDPOINT = 'https://api.fonnte.com/get-devices';
const FIRESTORE_WA_STATE_REST_URL =
  'https://firestore.googleapis.com/v1/projects/panaikang-smart-environment/databases/ai-studio-panaikangsmarten-4feb23ef-f14d-4f7d-ab34-e0951be3a4fd/documents/panaikang_app_data/wa_gateway_state';
const WA_CIPHER_KEY = 'pnk-wa-gw-2026-sec-key';

function decodeServerWaToken(encoded) {
  if (!encoded || !encoded.startsWith('v1:')) return '';
  const hex = encoded.slice(3);
  if (hex.length % 2 !== 0) return '';
  let out = '';
  for (let i = 0; i < hex.length; i += 2) {
    const byte = parseInt(hex.slice(i, i + 2), 16);
    if (Number.isNaN(byte)) return '';
    const idx = i / 2;
    out += String.fromCharCode(byte ^ WA_CIPHER_KEY.charCodeAt(idx % WA_CIPHER_KEY.length));
  }
  return out.trim();
}

async function getFonnteToken(env) {
  const rawToken =
    (env && (env.FONNTE_TOKEN || env.FONNTE_API_TOKEN || env.FONNTETOKEN)) || '';
  const cleaned = String(rawToken)
    .replace(/^Bearer\s+/i, '')
    .replace(/^["']|["']$/g, '')
    .trim();
  if (cleaned && !cleaned.includes('YOUR_FONNTE_TOKEN') && cleaned !== 'undefined') {
    return cleaned;
  }
  try {
    const resp = await fetch(FIRESTORE_WA_STATE_REST_URL);
    if (resp.ok) {
      const docJson = await resp.json().catch(() => null);
      const encoded = docJson?.fields?.encodedToken?.stringValue || '';
      const decoded = decodeServerWaToken(encoded);
      if (decoded) return decoded;
    }
  } catch {}
  return '';
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
  const { request, env } = context;
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept',
    'Cache-Control': 'no-store, max-age=0',
    'Content-Type': 'application/json',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  let fonnteToken = await getFonnteToken(env);
  const getMasked = (tok) =>
    tok ? (tok.length >= 8 ? `${tok.slice(0, 4)}••••••••${tok.slice(-4)}` : `${tok.slice(0, 2)}••••`) : '';

  if (!fonnteToken) {
    return new Response(
      JSON.stringify({
        ok: false,
        configured: false,
        hasToken: false,
        tokenMasked: '',
        deviceStatus: 'unconfigured',
        message:
          'Token FONNTE_TOKEN belum dikonfigurasi di server. Silakan klik tombol "+ Input Token Fonnte" di bawah untuk menyimpan Token Perangkat dari fonnte.com.',
      }),
      { status: 200, headers: corsHeaders }
    );
  }

  try {
    const checkDevice = async (tokenToUse) => {
      const resp = await fetch(FONNTE_DEVICE_ENDPOINT, {
        method: 'POST',
        headers: { Authorization: tokenToUse },
      });
      const data = await resp.json().catch(() => null);
      return { resp, data };
    };

    let { resp, data } = await checkDevice(fonnteToken);
    const firstReason = String((data && (data.reason || data.detail || data.message)) || '');
    if (/token invalid|invalid token/i.test(firstReason)) {
      const resolved = await resolveDeviceTokenIfAccountToken(fonnteToken);
      if (resolved && resolved !== fonnteToken) {
        fonnteToken = resolved;
        const retry = await checkDevice(fonnteToken);
        resp = retry.resp;
        data = retry.data;
      }
    }

    const tokenMasked = getMasked(fonnteToken);

    if (resp.ok && data && (data.status === true || data.status === 'true')) {
      const rawStatus = String(data.device_status || data.status || '').toLowerCase();
      const isConnected = rawStatus === 'connect' || rawStatus === 'connected' || rawStatus === 'true';

      return new Response(
        JSON.stringify({
          ok: isConnected,
          configured: true,
          hasToken: true,
          tokenMasked,
          deviceStatus: isConnected ? 'connect' : 'disconnect',
          device: data.device || '',
          name: data.name || '',
          quota: data.quota !== undefined ? String(data.quota) : '',
          package: data.package || '',
          expired: data.expired || '',
          messagesCount: data.messages !== undefined ? Number(data.messages) : undefined,
          message: isConnected
            ? 'Perangkat WhatsApp terhubung (Connect) dan siap mengirim pesan otomatis.'
            : 'Perangkat WhatsApp berstatus Disconnected di Fonnte. Silakan scan QR Code di menu Device pada dashboard fonnte.com.',
        }),
        { status: 200, headers: corsHeaders }
      );
    }

    const reason = (data && (data.reason || data.detail || data.message)) || `HTTP ${resp.status}`;
    return new Response(
      JSON.stringify({
        ok: false,
        configured: true,
        hasToken: true,
        tokenMasked,
        deviceStatus: /invalid token|token invalid/i.test(reason) ? 'invalid_token' : 'disconnect',
        reason,
        message: reason,
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({
        ok: false,
        configured: true,
        hasToken: true,
        tokenMasked: getMasked(fonnteToken),
        deviceStatus: 'error',
        message: err instanceof Error ? err.message : 'Gagal menghubungi server Fonnte.',
      }),
      { status: 200, headers: corsHeaders }
    );
  }
}
