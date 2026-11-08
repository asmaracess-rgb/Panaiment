const FONNTE_ENDPOINT = 'https://api.fonnte.com/send';

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
    return 'Token Fonnte tidak valid. Periksa kembali environment variable FONNTE_TOKEN di server.';
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
    return {
      delivered: false,
      provider: 'fonnte',
      errorMessage: 'Konfigurasi FONNTE_TOKEN belum tersedia di environment server.',
    };
  }

  try {
    const resp = await fetch(FONNTE_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: fonnteToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        target: phoneNumber,
        message,
        countryCode: '62',
        connectOnly: false,
      }),
    });

    let payload = null;
    try {
      payload = await resp.json();
    } catch {
      payload = null;
    }

    if (resp.ok && payload && payload.status !== false) {
      return {
        delivered: true,
        provider: 'fonnte',
        errorMessage: '',
      };
    }

    const reason =
      (payload && (payload.reason || payload.detail || payload.message)) ||
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
