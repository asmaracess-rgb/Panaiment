const FONNTE_DEVICE_ENDPOINT = 'https://api.fonnte.com/device';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );
  res.setHeader('Cache-Control', 'no-store, max-age=0');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const rawToken =
    process.env.FONNTE_TOKEN ||
    process.env.FONNTE_API_TOKEN ||
    process.env.FONNTETOKEN ||
    '';

  const fonnteToken = rawToken
    .replace(/^Bearer\s+/i, '')
    .replace(/^["']|["']$/g, '')
    .trim();

  if (!fonnteToken) {
    res.status(200).json({
      ok: false,
      configured: false,
      deviceStatus: 'unconfigured',
      message: 'Environment variable FONNTE_TOKEN belum dikonfigurasi di server.',
    });
    return;
  }

  try {
    const resp = await fetch(FONNTE_DEVICE_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: fonnteToken,
      },
    });

    let data = null;
    try {
      data = await resp.json();
    } catch {
      data = null;
    }

    if (resp.ok && data && (data.status === true || data.status === 'true')) {
      const rawStatus = String(data.device_status || data.status || '').toLowerCase();
      const isConnected = rawStatus === 'connect' || rawStatus === 'connected' || rawStatus === 'true';

      res.status(200).json({
        ok: isConnected,
        configured: true,
        deviceStatus: isConnected ? 'connect' : 'disconnect',
        device: data.device || '',
        name: data.name || '',
        quota: data.quota !== undefined ? String(data.quota) : '',
        package: data.package || '',
        expired: data.expired || '',
        messagesCount: data.messages !== undefined ? Number(data.messages) : undefined,
        message: isConnected
          ? 'Perangkat WhatsApp terhubung dan siap mengirim pesan.'
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
        'Token Fonnte tidak valid. Periksa kembali nilai environment variable FONNTE_TOKEN di server.';
    }

    res.status(200).json({
      ok: false,
      configured: true,
      deviceStatus: /invalid token/i.test(reason) ? 'invalid_token' : 'disconnect',
      reason,
      message: humanMessage,
    });
  } catch (err) {
    res.status(200).json({
      ok: false,
      configured: true,
      deviceStatus: 'error',
      message:
        err instanceof Error
          ? err.message
          : 'Gagal menghubungi server Fonnte untuk memeriksa status perangkat.',
    });
  }
}
