import { CitizenReport, WhatsAppRecipient } from '../types';

/**
 * Normalizes an Indonesian phone number (e.g., 0812-4210-8800, +62 812 4210 8800, 62812...)
 * into digits-only international format required by WhatsApp API (`628...`).
 */
export function normalizeWhatsAppPhone(rawPhone: string): string {
  const digits = (rawPhone || '').replace(/\D+/g, '');
  if (!digits) return '';
  if (digits.startsWith('0')) {
    return `62${digits.slice(1)}`;
  }
  if (digits.startsWith('8')) {
    return `62${digits}`;
  }
  return digits;
}

/**
 * Formats a phone number into a clean human-readable display string (e.g. +62 812-4210-8800).
 */
export function formatDisplayPhone(rawPhone: string): string {
  const normalized = normalizeWhatsAppPhone(rawPhone);
  if (!normalized) return rawPhone;
  const localPart = normalized.startsWith('62') ? normalized.slice(2) : normalized;
  if (localPart.length >= 9) {
    const p1 = localPart.slice(0, 3);
    const p2 = localPart.slice(3, 7);
    const p3 = localPart.slice(7);
    return `+62 ${p1}-${p2}-${p3}`;
  }
  return `+${normalized}`;
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
export function buildWhatsAppUrl(phoneNumber: string, message: string): string {
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
