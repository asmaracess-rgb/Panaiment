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

export interface WhatsAppAutoDispatchReceipt {
  id: string;
  ticketCode: string;
  reportTitle: string;
  reportCategory: string;
  reportRw: string;
  reportRt: string;
  recipientId: string;
  recipientName: string;
  recipientRole: string;
  phoneNumber: string;
  rwScope: string;
  status: 'TERKIRIM_OTOMATIS' | 'GAGAL_KIRIM' | 'TERCATAT_SISTEM';
  provider: string;
  errorMessage?: string;
  dispatchedAt: string;
  messagePreview: string;
}

const WA_AUTO_DISPATCH_LOGS_KEY = 'pnk_wa_auto_dispatch_logs_v1';

export function loadWhatsAppAutoDispatchLogs(): WhatsAppAutoDispatchReceipt[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(WA_AUTO_DISPATCH_LOGS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function loadWhatsAppAutoDispatchLogsAsync(): Promise<WhatsAppAutoDispatchReceipt[]> {
  if (typeof window === 'undefined') return loadWhatsAppAutoDispatchLogs();
  try {
    const res = await fetch('/api/whatsapp-dispatch-logs', { cache: 'no-store' });
    const data = await res.json().catch(() => null);
    if (data?.ok && Array.isArray(data.data)) {
      saveWhatsAppAutoDispatchLogs(data.data);
      return data.data;
    }
  } catch {}
  return loadWhatsAppAutoDispatchLogs();
}

export function saveWhatsAppAutoDispatchLogs(logs: WhatsAppAutoDispatchReceipt[]): void {
  if (typeof window === 'undefined') return;
  try {
    const sliced = logs.slice(0, 120);
    window.localStorage.setItem(WA_AUTO_DISPATCH_LOGS_KEY, JSON.stringify(sliced));
    fetch('/api/whatsapp-dispatch-logs', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ waDispatchLogs: sliced }),
    }).catch(() => {});
  } catch {
    // Ignore storage quota errors
  }
}

/**
 * Resolves all active registered WhatsApp recipients for an incoming complaint report
 * (Lurah, Sekretaris Lurah, Satgas, Koordinator RW, etc.) without exposing personal citizen WA.
 */
export function resolveRegisteredComplaintRecipients(params: {
  whatsappRecipients?: WhatsAppRecipient[];
  adminUsers?: Array<{
    id: string;
    fullName: string;
    jabatan: string;
    phone?: string;
    isActive?: boolean;
  }>;
  kelurahanPhone?: string;
  lurahName?: string;
  reportRw?: string;
}): WhatsAppRecipient[] {
  const result: WhatsAppRecipient[] = [];
  const seenPhones = new Set<string>();
  const targetRw = (params.reportRw || '').trim();

  // 1. Primary source: explicitly registered whatsappRecipients (active and matching RW scope)
  for (const rec of params.whatsappRecipients || []) {
    if (!rec || rec.isActive === false) continue;
    const norm = normalizeWhatsAppPhone(rec.phoneNumber);
    if (!norm || seenPhones.has(norm)) continue;
    const scope = (rec.rwScope || 'Seluruh Wilayah').trim();
    if (scope && scope !== 'Seluruh Wilayah' && targetRw && scope !== targetRw) {
      continue;
    }
    seenPhones.add(norm);
    result.push({
      ...rec,
      phoneNumber: norm,
    });
  }

  // 2. Also include active Admin / Lurah accounts that have a valid registered WhatsApp phone number
  for (const adm of params.adminUsers || []) {
    if (!adm || adm.isActive === false) continue;
    const norm = normalizeWhatsAppPhone(adm.phone);
    if (!norm || seenPhones.has(norm)) continue;
    seenPhones.add(norm);
    result.push({
      id: `adm-wa-${adm.id}`,
      name: adm.fullName || 'Pejabat Kelurahan Panaikang',
      role: adm.jabatan || 'Pimpinan / Admin Kelurahan',
      phoneNumber: norm,
      isPrimary: result.length === 0,
      isActive: true,
      rwScope: 'Seluruh Wilayah',
      notes: 'Terdaftar pada Otoritas Admin Kelurahan',
    });
  }

  // 3. Fallback to official Kelurahan WhatsApp contact if configured
  const kelNorm = normalizeWhatsAppPhone(params.kelurahanPhone);
  if (kelNorm && !seenPhones.has(kelNorm)) {
    seenPhones.add(kelNorm);
    result.push({
      id: 'kelurahan-official-wa',
      name: params.lurahName || 'Lurah & Call Center Kelurahan Panaikang',
      role: 'Pemerintah Kelurahan Panaikang',
      phoneNumber: kelNorm,
      isPrimary: result.length === 0,
      isActive: true,
      rwScope: 'Seluruh Wilayah',
      notes: 'Nomor Resmi Profil Kelurahan Panaikang',
    });
  }

  return result;
}

/**
 * Automatically dispatches an incoming Citizen Complaint Report (Pengaduan) in the background
 * to all registered active WhatsApp recipients (Lurah, Satgas, RW, etc.) via /api/whatsapp-dispatch
 * (Fonnte Gateway on backend) WITHOUT opening the citizen's personal WhatsApp app (`wa.me`).
 */
export async function dispatchComplaintToRegisteredWhatsApp(params: {
  report: {
    ticketCode: string;
    title: string;
    description: string;
    category: string;
    urgency?: string;
    rw: string;
    rt: string;
    locationName: string;
    reporterName: string;
    reporterPhone?: string;
    submittedAt?: string;
    createdAt?: string;
  };
  whatsappRecipients?: WhatsAppRecipient[];
  adminUsers?: Array<{
    id: string;
    fullName: string;
    jabatan: string;
    phone?: string;
    isActive?: boolean;
  }>;
  kelurahanPhone?: string;
  lurahName?: string;
}): Promise<{
  ok: boolean;
  totalDispatched: number;
  deliveries: WhatsAppAutoDispatchReceipt[];
}> {
  const { report } = params;
  // Strictly only for Complaint Reports (Pengaduan), never for Pra-Registrasi Surat (SRT- / REG-)
  if (
    report.ticketCode?.startsWith('SRT-') ||
    report.ticketCode?.startsWith('REG-')
  ) {
    return { ok: true, totalDispatched: 0, deliveries: [] };
  }

  let targetRecipients: WhatsAppRecipient[] = [];

  // If explicit recipient list is provided for testing or targeted dispatch:
  const isExplicitRecipients =
    Array.isArray(params.whatsappRecipients) &&
    params.whatsappRecipients.length > 0 &&
    !params.adminUsers &&
    !params.kelurahanPhone;

  if (isExplicitRecipients) {
    targetRecipients = (params.whatsappRecipients || [])
      .map((r) => ({
        ...r,
        isActive: true,
        phoneNumber: normalizeWhatsAppPhone(r.phoneNumber),
      }))
      .filter((r) => Boolean(r.phoneNumber));
  } else {
    targetRecipients = resolveRegisteredComplaintRecipients({
      whatsappRecipients: params.whatsappRecipients,
      adminUsers: params.adminUsers,
      kelurahanPhone: params.kelurahanPhone,
      lurahName: params.lurahName,
      reportRw: report.rw,
    });
  }

  if (targetRecipients.length === 0) {
    return { ok: true, totalDispatched: 0, deliveries: [] };
  }

  const nowIso = new Date().toISOString();
  let deliveries: WhatsAppAutoDispatchReceipt[] = [];
  let backendError = '';

  try {
    const response = await fetch('/api/whatsapp-dispatch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        report,
        recipients: targetRecipients,
      }),
    });

    const data = await response.json().catch(() => null);
    if (Array.isArray(data?.deliveries) && data.deliveries.length > 0) {
      deliveries = data.deliveries;
    } else if (!response.ok) {
      backendError = data?.error || `HTTP ${response.status} saat menghubungi endpoint pengiriman WhatsApp.`;
    }
  } catch (err) {
    backendError =
      err instanceof Error
        ? err.message
        : 'Gagal menghubungi endpoint pengiriman WhatsApp server.';
  }

  if (deliveries.length === 0) {
    const fallbackError =
      backendError || 'Pengiriman melalui server Fonnte belum berhasil dilakukan.';
    deliveries = targetRecipients.map((recipient) => ({
      id: `wad-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      ticketCode: report.ticketCode,
      reportTitle: report.title,
      reportCategory: report.category,
      reportRw: report.rw,
      reportRt: report.rt,
      recipientId: recipient.id,
      recipientName: recipient.name,
      recipientRole: recipient.role,
      phoneNumber: normalizeWhatsAppPhone(recipient.phoneNumber),
      rwScope: recipient.rwScope || 'Seluruh Wilayah',
      status: 'GAGAL_KIRIM',
      provider: 'fonnte',
      errorMessage: fallbackError,
      dispatchedAt: nowIso,
      messagePreview: buildReportWhatsAppMessage(
        {
          ticketCode: report.ticketCode,
          title: report.title,
          description: report.description,
          category: report.category,
          urgency: report.urgency || 'Normal',
          rw: report.rw,
          rt: report.rt,
          locationName: report.locationName,
          reporterName: report.reporterName,
          reporterPhone: report.reporterPhone || '-',
          status: 'Menunggu Verifikasi',
        },
        recipient,
        targetRecipients
      ),
    }));
  }

  const existingLogs = loadWhatsAppAutoDispatchLogs();
  saveWhatsAppAutoDispatchLogs([...deliveries, ...existingLogs]);

  const successCount = deliveries.filter((d) => d.status === 'TERKIRIM_OTOMATIS').length;

  return {
    ok: deliveries.length > 0 && successCount === deliveries.length,
    totalDispatched: successCount,
    deliveries,
  };
}

export interface WhatsAppGatewayStatusResult {
  ok: boolean;
  configured: boolean;
  hasToken?: boolean;
  tokenMasked?: string;
  deviceStatus: 'connect' | 'disconnect' | 'invalid_token' | 'unconfigured' | 'error';
  device?: string;
  name?: string;
  quota?: string;
  package?: string;
  expired?: string;
  messagesCount?: number;
  reason?: string;
  message: string;
  checkedAt?: string;
}

/**
 * Checks the live connection status of Fonnte WhatsApp Gateway device via backend API.
 * Never exposes FONNTE_TOKEN to the frontend/browser.
 */
export async function checkWhatsAppGatewayStatus(): Promise<WhatsAppGatewayStatusResult> {
  try {
    const response = await fetch('/api/whatsapp-status', {
      method: 'GET',
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });

    const data = await response.json().catch(() => null);
    if (data && typeof data === 'object') {
      const isOk = Boolean(data.ok);
      const rawStatus = String(data.deviceStatus || (isOk ? 'connect' : 'disconnect'));
      return {
        ok: isOk,
        configured: data.configured !== undefined ? Boolean(data.configured) : true,
        hasToken: Boolean(data.hasToken),
        tokenMasked: data.tokenMasked || '',
        deviceStatus: (rawStatus as WhatsAppGatewayStatusResult['deviceStatus']) || (isOk ? 'connect' : 'disconnect'),
        device: data.device || '',
        name: data.name || '',
        quota: data.quota !== undefined ? String(data.quota) : '',
        package: data.package || '',
        expired: data.expired || '',
        messagesCount: data.messagesCount !== undefined ? Number(data.messagesCount) : undefined,
        reason: data.reason || '',
        message:
          data.message ||
          (isOk
            ? 'Gateway WhatsApp (Fonnte) terhubung dan siap beroperasi.'
            : 'Perangkat WhatsApp belum tersambung ke Fonnte (Status: Disconnected).'),
        checkedAt: new Date().toISOString(),
      };
    }

    return {
      ok: false,
      configured: true,
      deviceStatus: 'error',
      message: `HTTP ${response.status} saat memeriksa status gateway WhatsApp.`,
      checkedAt: new Date().toISOString(),
    };
  } catch (err) {
    return {
      ok: false,
      configured: true,
      deviceStatus: 'error',
      message:
        err instanceof Error
          ? err.message
          : 'Gagal menghubungi server untuk memeriksa status gateway WhatsApp.',
      checkedAt: new Date().toISOString(),
    };
  }
}


