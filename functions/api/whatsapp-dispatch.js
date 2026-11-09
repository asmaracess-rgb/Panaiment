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

function normalizePhone(rawPhone) {
  if (!rawPhone) return '';
  const str = String(rawPhone).trim();
  if (!str || str === '-' || /x/i.test(str)) return '';
  let digits = str.replace(/\D+/g, '');
  if (!digits) return '';
  if (digits.startsWith('0062')) digits = `62${digits.slice(4)}`;
  else if (digits.startsWith('620')) digits = `62${digits.slice(3)}`;
  else if (digits.startsWith('0')) digits = `62${digits.slice(1)}`;
  else if (digits.startsWith('8')) digits = `62${digits}`;
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

export async function onRequest(context) {
  const { request, env } = context;
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
    return new Response(JSON.stringify({ ok: false, error: 'Method Not Allowed' }), {
      status: 405,
      headers: corsHeaders,
    });
  }

  let fonnteToken = await getFonnteToken(env);
  try {
    const body = await request.json().catch(() => ({}));
    const report = body.report || {};
    const rawRecipients = Array.isArray(body.recipients) ? body.recipients : [];
    const validRecipients = rawRecipients.filter((r) => r && Boolean(normalizePhone(r.phoneNumber)));

    if (validRecipients.length === 0) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: 'Tidak ada nomor WhatsApp penerima aktif yang valid.',
          totalDispatched: 0,
          deliveries: [],
        }),
        { status: 200, headers: corsHeaders }
      );
    }

    const executeSend = async (tokenToUse, phoneNumber, message) => {
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
      const rawText = await resp.text().catch(() => '');
      let payload = null;
      try {
        payload = JSON.parse(rawText);
      } catch {
        payload = { message: rawText };
      }
      return { resp, payload, rawText };
    };

    const dispatchedAt = new Date().toISOString();
    const deliveries = await Promise.all(
      validRecipients.map(async (recipient) => {
        const normalizedPhone = normalizePhone(recipient.phoneNumber);
        const message = buildComplaintAutoMessage(report, recipient, validRecipients.length);
        let delivered = false;
        let errorMessage = '';

        if (!fonnteToken) {
          errorMessage =
            'Token FONNTE_TOKEN belum dikonfigurasi di server. Silakan masukkan Token Fonnte Anda pada Kartu 01 di menu Kelola WhatsApp Gateway.';
        } else {
          let { resp, payload, rawText } = await executeSend(fonnteToken, normalizedPhone, message);
          const firstReason = String(
            (payload && (payload.reason || payload.detail || payload.message)) || ''
          );
          if (/token invalid|invalid token/i.test(firstReason)) {
            const resolved = await resolveDeviceTokenIfAccountToken(fonnteToken);
            if (resolved && resolved !== fonnteToken) {
              fonnteToken = resolved;
              const retry = await executeSend(fonnteToken, normalizedPhone, message);
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
              Boolean(payload.requestid));

          if (fonnteOk) {
            delivered = true;
          } else {
            const reason =
              (payload && (payload.reason || payload.detail || payload.message)) ||
              rawText ||
              `HTTP ${resp.status}`;
            errorMessage = sanitizeErrorText(reason, fonnteToken);
          }
        }

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
          status: delivered ? 'TERKIRIM_OTOMATIS' : 'GAGAL_KIRIM',
          provider: 'fonnte',
          errorMessage: errorMessage || undefined,
          dispatchedAt,
          messagePreview: message,
        };
      })
    );

    const successCount = deliveries.filter((d) => d.status === 'TERKIRIM_OTOMATIS').length;
    const failedCount = deliveries.length - successCount;

    return new Response(
      JSON.stringify({
        ok: failedCount === 0 && deliveries.length > 0,
        ticketCode: report.ticketCode || '-',
        totalDispatched: successCount,
        failedCount,
        dispatchedAt,
        deliveries,
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: sanitizeErrorText(
          err instanceof Error ? err.message : 'Gagal memproses pengiriman WhatsApp Fonnte.',
          fonnteToken
        ),
      }),
      { status: 500, headers: corsHeaders }
    );
  }
}
