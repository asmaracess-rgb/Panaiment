const FONNTE_ENDPOINT = 'https://api.fonnte.com/send';
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

function normalizePhone(rawPhone) {
  if (!rawPhone) return '';
  const str = String(rawPhone).trim();
  if (!str || str === '-' || /x/i.test(str)) return '';
  let digits = str.replace(/\D+/g, '');
  if (!digits) return '';
  if (digits.startsWith('0062')) {
    digits = `62${digits.slice(4)}`;
  } else if (digits.startsWith('620')) {
    digits = `62${digits.slice(3)}`;
  } else if (digits.startsWith('0')) {
    digits = `62${digits.slice(1)}`;
  } else if (digits.startsWith('8')) {
    digits = `62${digits}`;
  }
  return digits.length >= 10 ? digits : '';
}

function sanitizeErrorText(rawError, token) {
  if (!rawError) return 'Gagal mengirim pesan WhatsApp melalui Fonnte.';
  let msg = String(rawError);
  if (token && token.length > 0) {
    msg = msg.split(token).join('[REDACTED]');
  }
  if (/disconnected|disconnect/i.test(msg)) {
    return 'Perangkat WhatsApp belum tersambung di Fonnte (Status: Disconnected). Silakan buka fonnte.com > menu Device, lalu scan QR Code WhatsApp di HP Anda.';
  }
  if (/invalid token|token invalid/i.test(msg)) {
    return 'Token Fonnte tidak valid (pastikan menggunakan Token Perangkat dari menu Device di fonnte.com). Silakan klik "Ganti Token Fonnte" di Kartu 01 untuk memperbarui token.';
  }
  if (/out of quota|quota habis/i.test(msg)) {
    return 'Kuota pesan WhatsApp di akun Fonnte telah habis. Silakan top up di fonnte.com.';
  }
  if (/package expired/i.test(msg)) {
    return 'Paket langganan Fonnte Anda telah kedaluwarsa. Silakan perpanjang di fonnte.com.';
  }
  return msg.slice(0, 240);
}

function buildComplaintAutoMessage(report, recipient, totalRecipients) {
  const greetingName = recipient?.name
    ? `Yth. *${recipient.name}* (${recipient.role || 'Pejabat / Tim Terkait'})`
    : 'Yth. *Lurah Panaikang & Tim Penerima Laporan Warga*';

  return [
    `*🔔 NOTIFIKASI OTOMATIS PENGADUAN WARGA MASUK*`,
    `*PEMERINTAH KELURAHAN PANAIKANG — KOTA MAKASSAR*`,
    `----------------------------------------`,
    greetingName,
    `Telah masuk laporan pengaduan warga baru yang diteruskan otomatis oleh sistem ke *${totalRecipients} nomor pejabat/pihak terkait terdaftar*:`,
    ``,
    `• *No. Tiket:* ${report.ticketCode || '-'}`,
    `• *Judul Pengaduan:* ${report.title || '-'}`,
    `• *Kategori:* ${report.category || 'Pengaduan Warga'}`,
    `• *Tingkat Urgensi:* ${report.urgency || 'Normal'}`,
    `• *Wilayah:* ${report.rw || '-'} / ${report.rt || '-'}`,
    `• *Lokasi Kejadian:* ${report.locationName || '-'}`,
    `• *Tanggal / Waktu:* ${report.submittedAt || report.createdAt || '-'}`,
    `• *Pelapor:* ${report.reporterName || 'Warga Kelurahan Panaikang'}`,
    `• *Kontak Pelapor:* ${report.reporterPhone && report.reporterPhone !== '-' ? report.reporterPhone : 'Anonim / Tidak Dicantumkan'}`,
    `----------------------------------------`,
    `*Uraian Masalah / Isi Pengaduan:*`,
    `${report.description || report.content || '-'}`,
    `----------------------------------------`,
    `_Pesan ini dikirim secara otomatis oleh Sistem Satu Data Kelurahan Panaikang saat laporan disubmit warga (tanpa melalui WA pribadi pelapor)._`,
  ].join('\n');
}

async function sendViaFonnte(phoneNumber, message) {
  let fonnteToken = await getFonnteToken();

  if (!fonnteToken) {
    return {
      delivered: false,
      provider: 'fonnte',
      errorMessage:
        'Token FONNTE_TOKEN belum dikonfigurasi di server. Silakan masukkan Token Fonnte Anda pada Kartu 01 di menu Kelola WhatsApp Gateway.',
    };
  }

  const executeSend = async (tokenToUse) => {
    const params = new URLSearchParams();
    params.append('target', phoneNumber);
    params.append('message', message);
    params.append('countryCode', '62');

    const resp = await fetch(FONNTE_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: tokenToUse,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    let payload = null;
    let rawText = '';
    try {
      rawText = await resp.text();
      try {
        payload = JSON.parse(rawText);
      } catch {
        payload = { message: rawText };
      }
    } catch {
      payload = null;
    }
    return { resp, payload, rawText };
  };

  try {
    let { resp, payload, rawText } = await executeSend(fonnteToken);
    const firstReason = String(
      (payload && (payload.reason || payload.detail || payload.message)) || ''
    );
    if (/token invalid|invalid token/i.test(firstReason)) {
      const resolved = await resolveDeviceTokenIfAccountToken(fonnteToken);
      if (resolved && resolved !== fonnteToken) {
        fonnteToken = resolved;
        const retry = await executeSend(fonnteToken);
        resp = retry.resp;
        payload = retry.payload;
        rawText = retry.rawText;
      }
    }

    const fonnteOk =
      resp.ok &&
      payload &&
      (payload.status === true ||
        payload.status === 'true' ||
        String(payload.status).toLowerCase() === 'connect' ||
        String(payload.status).toLowerCase() === 'connected' ||
        String(payload.status).toLowerCase() === 'success' ||
        Boolean(payload.id) ||
        Boolean(payload.requestid) ||
        /success/i.test(String(payload.detail || payload.message || rawText)));

    if (fonnteOk) {
      return {
        delivered: true,
        provider: 'fonnte',
        errorMessage: '',
      };
    }

    const reason =
      (payload && (payload.reason || payload.detail || payload.message)) ||
      rawText ||
      `HTTP ${resp.status}`;
    return {
      delivered: false,
      provider: 'fonnte',
      errorMessage: sanitizeErrorText(reason, fonnteToken),
    };
  } catch (err) {
    return {
      delivered: false,
      provider: 'fonnte',
      errorMessage: sanitizeErrorText(
        err instanceof Error ? err.message : 'Koneksi ke endpoint Fonnte gagal.',
        fonnteToken
      ),
    };
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );
  res.setHeader('Cache-Control', 'no-store, max-age=0');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Method Not Allowed' });
    return;
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const report = body.report || {};
    const isExplicitRecipients = Array.isArray(body.recipients);
    const rawRecipients = isExplicitRecipients ? body.recipients : [];

    const reportRw = String(report.rw || '').trim();
    const validRecipients = rawRecipients.filter((r) => {
      if (!r) return false;
      const norm = normalizePhone(r.phoneNumber);
      if (!norm) return false;
      if (isExplicitRecipients) {
        // If explicitly specified by caller, accept directly
        return true;
      }
      if (r.isActive === false) return false;
      const scope = String(r.rwScope || 'Seluruh Wilayah').trim();
      return !scope || scope === 'Seluruh Wilayah' || !reportRw || scope === reportRw;
    });

    const dispatchedAt = new Date().toISOString();
    const deliveries = await Promise.all(
      validRecipients.map(async (recipient) => {
        const normalizedPhone = normalizePhone(recipient.phoneNumber);
        const message = buildComplaintAutoMessage(report, recipient, validRecipients.length);
        const result = await sendViaFonnte(normalizedPhone, message);
        return {
          id: `wad-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          ticketCode: report.ticketCode || '-',
          reportTitle: report.title || '-',
          reportCategory: report.category || 'Pengaduan Warga',
          reportRw: report.rw || '-',
          reportRt: report.rt || '-',
          recipientId: recipient.id || normalizedPhone,
          recipientName: recipient.name || 'Pejabat Terkait',
          recipientRole: recipient.role || 'Tim Kelurahan Panaikang',
          phoneNumber: normalizedPhone,
          rwScope: recipient.rwScope || 'Seluruh Wilayah',
          status: result.delivered ? 'TERKIRIM_OTOMATIS' : 'GAGAL_KIRIM',
          provider: 'fonnte',
          errorMessage: result.errorMessage || undefined,
          dispatchedAt,
          messagePreview: message,
        };
      })
    );

    const successCount = deliveries.filter((d) => d.status === 'TERKIRIM_OTOMATIS').length;
    const failedCount = deliveries.length - successCount;

    res.status(200).json({
      ok: failedCount === 0 && deliveries.length > 0,
      ticketCode: report.ticketCode || '-',
      totalDispatched: successCount,
      failedCount,
      dispatchedAt,
      deliveries,
    });
  } catch (err) {
    const token = (process.env.FONNTE_TOKEN || '').trim();
    res.status(500).json({
      ok: false,
      error: sanitizeErrorText(
        err instanceof Error ? err.message : 'Gagal memproses pengiriman WhatsApp Fonnte.',
        token
      ),
    });
  }
}
