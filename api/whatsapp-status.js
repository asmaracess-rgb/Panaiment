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

async function getFonnteToken() {
  const rawToken =
    process.env.FONNTE_TOKEN ||
    process.env.FONNTE_API_TOKEN ||
    process.env.FONNTETOKEN ||
    '';
  const cleaned = rawToken
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
      if (decoded) {
        process.env.FONNTE_TOKEN = decoded;
        return decoded;
      }
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

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );
  res.setHeader('Cache-Control', 'no-store, max-age=0');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  let fonnteToken = await getFonnteToken();
  const getMasked = (tok) =>
    tok ? (tok.length >= 8 ? `${tok.slice(0, 4)}••••••••${tok.slice(-4)}` : `${tok.slice(0, 2)}••••`) : '';

  if (!fonnteToken) {
    res.status(200).json({
      ok: false,
      configured: false,
      hasToken: false,
      tokenMasked: '',
      deviceStatus: 'unconfigured',
      message:
        'Token FONNTE_TOKEN belum dikonfigurasi di server. Silakan klik tombol "+ Input Token Fonnte" di bawah untuk menyimpan Token Perangkat dari fonnte.com.',
    });
    return;
  }

  try {
    const checkDevice = async (tokenToUse) => {
      const resp = await fetch(FONNTE_DEVICE_ENDPOINT, {
        method: 'POST',
        headers: {
          Authorization: tokenToUse,
        },
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

      res.status(200).json({
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
      });
      return;
    }

    const reason = (data && (data.reason || data.detail || data.message)) || `HTTP ${resp.status}`;
    let humanMessage = reason;
    if (/disconnected|disconnect/i.test(reason)) {
      humanMessage =
        'Perangkat WhatsApp belum tersambung di Fonnte (Status: Disconnected). Silakan buka fonnte.com > Device, lalu scan QR Code WhatsApp di HP Anda.';
    } else if (/invalid token|token invalid/i.test(reason)) {
      humanMessage =
        'Token Fonnte tidak valid (pastikan menggunakan Token Perangkat dari menu Device di fonnte.com). Silakan klik "Ganti Token Fonnte" di Kartu 01 untuk memperbarui token.';
    }

    res.status(200).json({
      ok: false,
      configured: true,
      hasToken: true,
      tokenMasked,
      deviceStatus: /invalid token|token invalid/i.test(reason) ? 'invalid_token' : 'disconnect',
      reason,
      message: humanMessage,
    });
  } catch (err) {
    res.status(200).json({
      ok: false,
      configured: true,
      hasToken: true,
      tokenMasked: getMasked(fonnteToken),
      deviceStatus: 'error',
      message:
        err instanceof Error
          ? err.message
          : 'Gagal menghubungi server Fonnte untuk memeriksa status perangkat.',
    });
  }
}
