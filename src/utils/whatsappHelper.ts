import {
  AuthenticatedUserProfile,
  CitizenReport,
  SeedRequestItem,
  WhatsAppRecipient,
} from '../types';

/**
 * Checks whether a raw phone string contains a real, dialable WhatsApp number
 * (not empty, not a masked placeholder like "0812-xxxx-xxxx", and at least 9 digits).
 */
export function isValidWhatsAppPhone(rawPhone?: string | null): rawPhone is string {
  if (!rawPhone) return false;
  const trimmed = String(rawPhone).trim();
  if (!trimmed || trimmed === '-' || /x/i.test(trimmed)) return false;
  const normalized = normalizeWhatsAppPhone(trimmed);
  return normalized.length >= 10 && normalized.length <= 16;
}

/**
 * Normalizes an Indonesian phone number (e.g., 0812-4210-8800, +62 812 4210 8800, +62 0812..., 62812...)
 * into digits-only international format required by WhatsApp API (`628...`).
 * Returns empty string if the input is a masked placeholder (e.g. `0812-xxxx-xxxx`) or too short.
 */
export function normalizeWhatsAppPhone(rawPhone?: string | null): string {
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

  // Must be at least 10 digits (e.g. 62 + 8 digits) to be a valid WhatsApp number
  if (digits.length < 10) return '';
  return digits;
}

/**
 * Formats a phone number into a clean human-readable display string (e.g. +62 812-4210-8800).
 */
export function formatDisplayPhone(rawPhone?: string | null): string {
  const normalized = normalizeWhatsAppPhone(rawPhone);
  if (!normalized) {
    if (!rawPhone || rawPhone === '-' || /x/i.test(String(rawPhone))) {
      return 'Nomor WA belum valid';
    }
    return String(rawPhone);
  }
  const localPart = normalized.startsWith('62') ? normalized.slice(2) : normalized;
  if (localPart.length >= 9) {
    const p1 = localPart.slice(0, 3);
    const p2 = localPart.slice(3, 7);
    const p3 = localPart.slice(7);
    return `0${p1}-${p2}-${p3} (+62)`;
  }
  return `+${normalized}`;
}

/**
 * Resolves a citizen's valid WhatsApp phone number from the record itself or by cross-referencing
 * registered citizen accounts (`citizenUsers`) by UID, Email, NIK, or Full Name.
 */
export function resolveCitizenWhatsAppPhone(params: {
  rawPhone?: string | null;
  citizenName?: string | null;
  ownerId?: string | null;
  ownerEmail?: string | null;
  nik?: string | null;
  citizenUsers?: AuthenticatedUserProfile[];
}): string {
  if (isValidWhatsAppPhone(params.rawPhone)) {
    return String(params.rawPhone).trim();
  }
  const list = params.citizenUsers || [];
  if (list.length === 0) return '';

  const cleanUid = (params.ownerId || '').trim();
  const cleanEmail = (params.ownerEmail || '').trim().toLowerCase();
  const cleanNik = (params.nik || '').replace(/\D+/g, '').trim();
  const cleanName = (params.citizenName || '').trim().toLowerCase();

  for (const c of list) {
    if (!c || !isValidWhatsAppPhone(c.phone)) continue;
    if (cleanUid && c.uid === cleanUid) return c.phone.trim();
    if (cleanEmail && c.email && c.email.trim().toLowerCase() === cleanEmail) return c.phone.trim();
    if (cleanNik && cleanNik.length >= 10 && c.nik && c.nik.replace(/\D+/g, '') === cleanNik) {
      return c.phone.trim();
    }
    if (
      cleanName &&
      cleanName !== 'warga anonim' &&
      cleanName !== 'warga panaikang' &&
      cleanName !== 'warga kelurahan panaikang' &&
      c.fullName &&
      c.fullName.trim().toLowerCase() === cleanName
    ) {
      return c.phone.trim();
    }
  }
  return '';
}

/**
 * Builds a structured WhatsApp notification message for an Urban Farming Seed Request (`SeedRequestItem`).
 */
export function buildSeedRequestWhatsAppMessage(req: SeedRequestItem): string {
  const seedsText =
    Array.isArray(req.requestedSeeds) && req.requestedSeeds.length > 0
      ? req.requestedSeeds.join(', ')
      : 'Bibit Tanaman Pangan';

  let statusInstruction =
    'Permohonan bibit gratis Anda telah kami terima dan sedang dalam proses verifikasi serta penyiapan benih oleh Kader Tani Kelurahan Panaikang.';
  if (req.status === 'Disetujui') {
    statusInstruction =
      'Permohonan bibit gratis Anda telah *DISETUJUI*. Silakan datang mengambil paket benih/bibit di Kebun Bibit / Kantor Kelurahan Panaikang pada jam pelayanan kerja dengan menunjukkan kode permohonan ini.';
  } else if (req.status === 'Telah Didistribusikan') {
    statusInstruction =
      'Paket bibit tanaman Anda tercatat *TELAH DIDISTRIBUSIKAN / DISERAHKAN*. Selamat menanam, semoga tumbuh subur dan mendukung ketahanan pangan keluarga di Kelurahan Panaikang.';
  } else if (req.status === 'Ditolak') {
    statusInstruction =
      'Mohon maaf, permohonan bibit Anda saat ini *BELUM DAPAT DIPENUHI* karena ketersediaan stok varietas benih sedang dalam masa penyemaian ulang. Silakan mengajukan kembali pada periode distribusi berikutnya.';
  }

  return [
    `*INFORMASI PERMOHONAN BIBIT GRATIS — URBAN FARMING KELURAHAN PANAIKANG*`,
    `----------------------------------------`,
    `Halo Bapak/Ibu *${req.applicantName}*, salam hangat dari Pemerintah Kelurahan Panaikang.`,
    ``,
    `Berikut informasi terkini mengenai permohonan bibit gratis yang Anda ajukan:`,
    `• *Kode Permohonan:* ${req.id}`,
    `• *Nama Pemohon:* ${req.applicantName}`,
    `• *Wilayah Domisili:* ${req.rw} / ${req.rt} (${req.address})`,
    `• *Jenis Benih Diminta:* ${seedsText}`,
    `• *Metode Tanam:* ${req.plantingMethod}`,
    `• *Pendampingan Kader:* ${req.needsTraining ? 'Ya, Didampingi Kader Tani' : 'Mandiri'}`,
    `• *Status Saat Ini:* *${req.status.toUpperCase()}*`,
    `----------------------------------------`,
    statusInstruction,
    ``,
    `Terima kasih atas partisipasi aktif Bapak/Ibu dalam program *Panaikang Smart Environment & Urban Farming*.`,
  ].join('\n');
}


/**
 * Builds the structured WhatsApp message for a CitizenReport.
 */
export function buildReportWhatsAppMessage(
  report: {
    ticketCode: string;
    title: string;
    description: string;
    category: string;
    urgency: string;
    rw: string;
    rt: string;
    locationName: string;
    coordinatesLabel?: string;
    reporterName: string;
    reporterPhone: string;
    status?: string;
    assignedTeam?: string;
    responseNote?: string;
  },
  recipient?: WhatsAppRecipient | null,
  allActiveRecipients?: WhatsAppRecipient[]
): string {
  const greetingName = recipient?.name
    ? `Yth. *${recipient.name}* (${recipient.role})`
    : 'Yth. *Tim Penerima Laporan Warga Kelurahan Panaikang*';

  const recipientCountNote =
    allActiveRecipients && allActiveRecipients.length > 0
      ? `_Terdistribusi otomatis ke seluruh (${allActiveRecipients.length}) nomor penerima laporan terdaftar di Sistem Administrator Kelurahan Panaikang._`
      : '_Sistem Satu Laporan, Satu Data, Satu Aksi_';

  const lines = [
    `*LAPORAN WARGA KELURAHAN PANAIKANG*`,
    recipientCountNote,
    `----------------------------------------`,
    greetingName,
    `Berikut laporan warga Kelurahan Panaikang yang telah tercatat dan didistribusikan ke seluruh penerima terdaftar:`,
    ``,
    `*No. Tiket:* ${report.ticketCode}`,
    `*Judul Laporan:* ${report.title}`,
    `*Kategori:* ${report.category}`,
    `*Tingkat Urgensi:* ${report.urgency}`,
    `*Wilayah:* ${report.rw} / ${report.rt}`,
    `*Lokasi / Patokan:* ${report.locationName}`,
    report.coordinatesLabel ? `*Titik Koordinat:* ${report.coordinatesLabel}` : '',
    `*Nama Pelapor:* ${report.reporterName}`,
    `*No. HP Pelapor:* ${report.reporterPhone || '-'}`,
    `*Status Laporan:* ${report.status || 'Menunggu Verifikasi'}`,
    report.assignedTeam ? `*Unit Pelaksana:* ${report.assignedTeam}` : '',
    `----------------------------------------`,
    `*Rincian Kondisi Lapangan:*`,
    `${report.description}`,
    report.responseNote ? `*Catatan Tindak Lanjut:* ${report.responseNote}` : '',
    `----------------------------------------`,
    `_Seluruh nomor penerima terdaftar dapat melihat daftar kontak tim dan saling berkoordinasi langsung melalui Halaman Administrator._`,
  ].filter((line) => line !== '');

  return lines.join('\n');
}

/**
 * Builds an internal coordination WhatsApp message between registered recipients in Admin Panel
 * so all recipients can directly coordinate with each other on active citizen reports.
 */
export function buildInterRecipientCoordinationMessage(
  targetRecipient: WhatsAppRecipient,
  allRecipients: WhatsAppRecipient[],
  reports: CitizenReport[],
  specificReport?: CitizenReport
): string {
  const activePeers = allRecipients.filter((r) => r.isActive);
  const peerListText = activePeers
    .map(
      (p, idx) =>
        `${idx + 1}. ${p.name} (${p.role}) — ${formatDisplayPhone(p.phoneNumber)} [${p.rwScope}]`
    )
    .join('\n');

  if (specificReport) {
    return [
      `*KOORDINASI TIM PENERIMA LAPORAN WARGA — KELURAHAN PANAIKANG*`,
      `Yth. *${targetRecipient.name}* (${targetRecipient.role}),`,
      `Mohon koordinasi tindak lanjut lapangan untuk laporan warga berikut:`,
      `----------------------------------------`,
      `*No. Tiket:* ${specificReport.ticketCode}`,
      `*Judul:* ${specificReport.title}`,
      `*Kategori & Urgensi:* ${specificReport.category} (${specificReport.urgency})`,
      `*Wilayah & Lokasi:* ${specificReport.rw} / ${specificReport.rt} — ${specificReport.locationName}`,
      `*Pelapor:* ${specificReport.reporterName} (${specificReport.reporterPhone})`,
      `*Status Saat Ini:* ${specificReport.status}`,
      `*Unit Disposisi:* ${specificReport.assignedTeam || 'Belum ditugaskan'}`,
      `*Rincian:* ${specificReport.description}`,
      `----------------------------------------`,
      `*Daftar Tim Penerima Terdaftar (Koordinasi Internal Admin):*`,
      peerListText,
      `----------------------------------------`,
      `_Pesan koordinasi dikirim dari Halaman Administrator Satu Data Kelurahan Panaikang._`,
    ].join('\n');
  }

  const waitingCount = reports.filter((r) => r.status === 'Menunggu Verifikasi').length;
  const inProgressCount = reports.filter((r) => r.status === 'Sedang Ditangani').length;
  const completedCount = reports.filter((r) => r.status === 'Selesai').length;
  const latestThree = reports.slice(0, 3);

  return [
    `*KOORDINASI INTERNAL PENERIMA LAPORAN WARGA — KELURAHAN PANAIKANG*`,
    `Yth. *${targetRecipient.name}* (${targetRecipient.role}),`,
    `Berikut ringkasan status laporan warga untuk koordinasi tim penerima terdaftar:`,
    `----------------------------------------`,
    `• *Total Laporan Masuk:* ${reports.length} Laporan`,
    `• *Menunggu Verifikasi:* ${waitingCount} Laporan`,
    `• *Sedang Ditangani:* ${inProgressCount} Laporan`,
    `• *Selesai (Tuntas):* ${completedCount} Laporan`,
    `----------------------------------------`,
    `*Laporan Terbaru yang Perlu Dikoordinasikan:*`,
    ...latestThree.map(
      (r, i) => `${i + 1}. *[${r.ticketCode}]* ${r.title} (${r.rw}/${r.rt} · Status: ${r.status})`
    ),
    `----------------------------------------`,
    `*Daftar Kontak Tim Penerima Terdaftar (Khusus Admin):*`,
    peerListText,
  ].join('\n');
}

/**
 * Builds a direct WhatsApp URL (`https://wa.me/<phone>?text=<encodedMessage>`)
 */
export function buildWhatsAppUrl(phoneNumber: string | undefined | null, message: string): string {
  const normalizedPhone = normalizeWhatsAppPhone(phoneNumber);
  const encodedText = encodeURIComponent(message);
  if (!normalizedPhone) {
    return `https://wa.me/?text=${encodedText}`;
  }
  return `https://wa.me/${normalizedPhone}?text=${encodedText}`;
}

/**
 * Triggers opening a WhatsApp link in a new tab using a temporary DOM anchor element
 * (compatible with iframe restrictions without calling window.open).
 */
export function triggerWhatsAppRedirect(url: string): void {
  if (typeof document === 'undefined') return;
  try {
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();
    window.setTimeout(() => {
      if (anchor.parentNode) {
        anchor.parentNode.removeChild(anchor);
      }
    }, 200);
  } catch {
    // Fallback if programmatic click is blocked
  }
}

/**
 * Selects the default active WhatsApp recipient for a given RW (or primary recipient).
 */
export function getPreferredWhatsAppRecipient(
  recipients: WhatsAppRecipient[],
  rw?: string
): WhatsAppRecipient | null {
  const activeList = recipients.filter((r) => r.isActive);
  if (activeList.length === 0) return recipients[0] || null;
  if (rw) {
    const rwMatch = activeList.find((r) => r.rwScope === rw);
    if (rwMatch) return rwMatch;
  }
  const primary = activeList.find((r) => r.isPrimary);
  return primary || activeList[0];
}
