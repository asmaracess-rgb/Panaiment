import React, { useState, useMemo, useEffect } from 'react';
import {
  History,
  Search,
  ShieldCheck,
  AlertTriangle,
  FileText,
  Download,
  Printer,
  Plus,
  Trash2,
  Clock,
  CheckCircle2,
  Eye,
  X,
  RefreshCw,
  Layers,
  Users,
  Recycle,
  Sprout,
  Calendar,
  Activity,
  Sliders,
  Building2,
  Bell,
  Lock,
  Sparkles,
  Check,
} from 'lucide-react';
import {
  AdminActivityLog,
  AdminActivityActionType,
  AdminActivityModule,
  AdminUserAccount,
  KelurahanProfile,
} from '../types';
import { INITIAL_KELURAHAN_PROFILE } from '../data/initialData';
import { buildOfficialKopSuratHtml } from '../utils/officialKopSurat';
import {
  getRealtimeNow,
  getRealtimeDateString,
  getRealtimeDateTimeString,
  getRealtimeFullDateTimeWita,
  isStaleOrFutureLoginString,
} from '../utils/realtimeDate';

interface AdminActivityLogPanelProps {
  activityLogs: AdminActivityLog[];
  adminUsers: AdminUserAccount[];
  currentUser: AdminUserAccount;
  profile?: KelurahanProfile;
  onAddManualLog: (entry: {
    actionType: AdminActivityActionType;
    module: AdminActivityModule;
    targetLabel: string;
    summary: string;
    details?: string;
    beforeValue?: string;
    afterValue?: string;
    severity: 'info' | 'warning' | 'critical';
  }) => void;
  onDeleteLogEntry?: (logId: string) => void;
  onClearLogs?: () => void;
}

export const MODULE_LABELS: Record<AdminActivityModule, string> = {
  AUTENTIKASI: 'Autentikasi & Sesi Login WITA',
  DASHBOARD_LURAH: 'Dashboard Lurah & Disposisi Eksekutif',
  PENGURUSAN_WARGA: 'Pengurusan Warga (13 Surat Resmi & 9 Pengaduan)',
  PROFIL_KELURAHAN: 'Profil & Bagan Struktur Kelurahan (Perwali 65/2023)',
  STRUKTUR_RTRW: 'Data RT/RW, Bagan LPM & Rekap Wilayah (RW 001–007)',
  SISKAMLING: 'Jadwal Ronda Siskamling RT/RW',
  INFORMASI_KELURAHAN: 'Informasi & Sinkronisasi IG @kelurahan.panaikang',
  LAPORAN_WARGA: 'Laporan Warga & Direktori Notifikasi WA',
  BANK_SAMPAH: 'Pengelolaan Sampah (BSU, Teba Komunal & Biopori LRB)',
  KERJA_BAKTI: 'Jadwal & Dokumentasi Kerja Bakti Gotong Royong',
  URBAN_FARMING: 'Urban Farming (7 Sub-Modul Ketahanan Pangan)',
  TRAFFIC_ANALITIK: 'Traffic Web & Aplikasi Real-Time',
  PARAMETER_USER: 'Parameter User & Hak Akses RBAC (Perwali 65/2023)',
  KATALOG_SOP: 'Katalog SOP (7 Bidang · 13 Layanan Surat & Pengaduan)',
  PETA_DIGITAL_GIS: 'Peta Digital & Spasial Smart GIS',
  DAFTAR_WARGA: 'Daftar User Warga (Registrasi Akun Firestore)',
};

const MODULE_SHORT_LABELS: Record<AdminActivityModule, string> = {
  AUTENTIKASI: 'Login & Sesi',
  DASHBOARD_LURAH: 'Dashboard Lurah',
  PENGURUSAN_WARGA: 'Pengurusan Warga (13 Surat)',
  DAFTAR_WARGA: 'Daftar Warga',
  PROFIL_KELURAHAN: 'Profil & Bagan Kelurahan',
  STRUKTUR_RTRW: 'Data RT/RW & Bagan LPM',
  SISKAMLING: 'Jadwal Siskamling',
  INFORMASI_KELURAHAN: 'Informasi & IG',
  LAPORAN_WARGA: 'Laporan & WA',
  BANK_SAMPAH: 'Sampah (BSU/Teba/Biopori)',
  KERJA_BAKTI: 'Kerja Bakti',
  URBAN_FARMING: 'Urban Farming (7 Modul)',
  TRAFFIC_ANALITIK: 'Traffic Real-Time',
  PARAMETER_USER: 'Parameter User RBAC',
  KATALOG_SOP: 'Katalog SOP Layanan',
  PETA_DIGITAL_GIS: 'Peta Spasial GIS',
};

const ACTION_BADGE_CONFIG: Record<
  AdminActivityActionType,
  { label: string; bg: string; text: string; border: string }
> = {
  LOGIN: {
    label: 'Login Sesi WITA',
    bg: 'bg-sky-50',
    text: 'text-sky-800',
    border: 'border-sky-200',
  },
  LOGOUT: {
    label: 'Logout Sesi',
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-300',
  },
  CREATE: {
    label: 'Tambah Data',
    bg: 'bg-emerald-50',
    text: 'text-emerald-800',
    border: 'border-emerald-200',
  },
  UPDATE: {
    label: 'Ubah / Simpan Data',
    bg: 'bg-blue-50',
    text: 'text-blue-800',
    border: 'border-blue-200',
  },
  VERIFY_STATUS: {
    label: 'Verifikasi & Terbit Surat',
    bg: 'bg-indigo-50',
    text: 'text-indigo-800',
    border: 'border-indigo-200',
  },
  ACCESS_CHANGE: {
    label: 'Hak Akses RBAC User',
    bg: 'bg-amber-50',
    text: 'text-amber-900',
    border: 'border-amber-300',
  },
  DELETE: {
    label: 'Hapus Data',
    bg: 'bg-rose-50',
    text: 'text-rose-800',
    border: 'border-rose-200',
  },
  EXPORT: {
    label: 'Cetak / Ekspor PDF',
    bg: 'bg-teal-50',
    text: 'text-teal-800',
    border: 'border-teal-200',
  },
};

const AUDIT_SUPERVISION_TEMPLATES: {
  label: string;
  module: AdminActivityModule;
  actionType: AdminActivityActionType;
  targetLabel: string;
  summary: string;
  details: string;
  severity: 'info' | 'warning' | 'critical';
}[] = [
  {
    label: 'Audit 13 Layanan Surat Resmi (PM-01 s/d SL-13)',
    module: 'PENGURUSAN_WARGA',
    actionType: 'VERIFY_STATUS',
    targetLabel: 'Loket PTSP · 13 Layanan Administrasi Surat Resmi (PM-01 s/d SL-13)',
    summary: 'Supervisi kelengkapan berkas & ketepatan SLA penerbitan 13 jenis Surat Keterangan/Pengantar Warga',
    details:
      'Pemeriksaan kesesuaian Pengantar KTP-el, KK, Surat Pindah, Kelahiran, Kematian, Domisili, SKU, SKTM, SKCK, Belum Menikah, Pengantar Nikah (N1-N4), Keterangan Penghasilan & Ahli Waris.',
    severity: 'info',
  },
  {
    label: 'Evaluasi 9 Kategori Pengaduan Warga & WA',
    module: 'LAPORAN_WARGA',
    actionType: 'VERIFY_STATUS',
    targetLabel: '9 Kategori Pengaduan Lingkungan & Sosial Kemasyarakatan',
    summary: 'Evaluasi kecepatan tindak lanjut laporan warga & pengiriman notifikasi WhatsApp otomatis',
    details:
      'Memastikan setiap tiket pengaduan memiliki dokumentasi foto tindak lanjut lapangan dan status terverifikasi.',
    severity: 'info',
  },
  {
    label: 'Audit Bagan Struktur Kelurahan (Perwali 65/2023)',
    module: 'PROFIL_KELURAHAN',
    actionType: 'UPDATE',
    targetLabel: 'Bagan Struktur Organisasi Kelurahan Panaikang (Perwali No. 65 Tahun 2023)',
    summary: 'Verifikasi kesesuaian data Lurah, Sekretaris, 3 Kasi & Staf Seksi pada Bagan Struktur Dinamis',
    details:
      'Kesesuaian data pejabat & daftar staf pada Seksi Pemerintahan & Trantibum, Seksi Pemberdayaan Masyarakat & Sosial, serta Seksi Pengelolaan Kebersihan & Pertamanan.',
    severity: 'info',
  },
  {
    label: 'Audit Bagan Struktur RT/RW & Ketua LPM',
    module: 'STRUKTUR_RTRW',
    actionType: 'UPDATE',
    targetLabel: 'Bagan Struktur RT/RW Dinamis (RW 001–007 & Ketua LPM)',
    summary: 'Verifikasi sinkronisasi data Ketua LPM, 7 Ketua RW, dan seluruh Ketua RT se-Kelurahan Panaikang',
    details:
      'Memastikan perubahan data RT/RW dan Ketua LPM langsung tampil akurat pada Bagan Struktur RT/RW responsif.',
    severity: 'info',
  },
  {
    label: 'Monitoring BSU, Teba Komunal & Biopori LRB',
    module: 'BANK_SAMPAH',
    actionType: 'UPDATE',
    targetLabel: 'Unit Bank Sampah (BSU), Titik Teba Komunal & Lubang Resapan Biopori',
    summary: 'Supervisi pencatatan timbangan harian BSU RW, kapasitas Teba Komunal, dan fungsi titik Biopori',
    details:
      'Evaluasi reduksi sampah organik dan anorganik di tingkat RW 001 s/d RW 007.',
    severity: 'info',
  },
  {
    label: 'Supervisi 7 Sub-Modul Urban Farming',
    module: 'URBAN_FARMING',
    actionType: 'UPDATE',
    targetLabel: 'Ketahanan Pangan & Urban Farming (7 Sub-Modul)',
    summary: 'Monitoring kebun lorong produktif, kelompok tani, log perawatan, hasil panen & penyaluran bibit',
    details:
      'Pemeriksaan realisasi produksi sayuran/komoditas dan distribusi bibit gratis bagi warga.',
    severity: 'info',
  },
  {
    label: 'Review Matriks Hak Akses User (RBAC)',
    module: 'PARAMETER_USER',
    actionType: 'ACCESS_CHANGE',
    targetLabel: 'Parameter User & Batasan Hak Akses Admin',
    summary: 'Audit berkala pembagian hak akses 12 modul menu dan 7 bidang layanan per pejabat/staf',
    details:
      'Penyesuaian otoritas akun admin berdasarkan struktur jabatan Perwali Kota Makassar Nomor 65 Tahun 2023.',
    severity: 'warning',
  },
];

/**
 * Normalizes any log timestamp that was accidentally recorded with the container's
 * skewed "Nov 2026" / "November 2026" date into the real Makassar WITA date.
 */
function normalizeLogTimestamp(rawTimestamp: string, createdAtMs?: number): string {
  if (!rawTimestamp) return getRealtimeDateTimeString();
  if (isStaleOrFutureLoginString(rawTimestamp)) {
    const timePartMatch = rawTimestamp.match(/(\d{1,2}[:.]\d{2}(?:[:.]\d{2})?\s*WITA)/i);
    const todayStr = getRealtimeDateString(getRealtimeNow());
    if (timePartMatch) {
      return `${todayStr} · ${timePartMatch[1].replace('.', ':')}`;
    }
    return getRealtimeDateTimeString(createdAtMs ? new Date(createdAtMs) : getRealtimeNow());
  }
  return rawTimestamp;
}

export const AdminActivityLogPanel: React.FC<AdminActivityLogPanelProps> = ({
  activityLogs,
  adminUsers,
  currentUser,
  profile,
  onAddManualLog,
  onDeleteLogEntry,
  onClearLogs,
}) => {
  const activeProfile = profile || INITIAL_KELURAHAN_PROFILE;

  const [liveWitaClock, setLiveWitaClock] = useState<string>(() =>
    getRealtimeFullDateTimeWita(new Date())
  );

  useEffect(() => {
    const timer = window.setInterval(() => {
      setLiveWitaClock(getRealtimeFullDateTimeWita(new Date()));
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterActor, setFilterActor] = useState<string>('ALL');
  const [filterRoleGroup, setFilterRoleGroup] = useState<
    'ALL' | 'LURAH' | 'SEKRETARIS' | 'KASI' | 'STAF_OPERATOR'
  >('ALL');
  const [filterModule, setFilterModule] = useState<'ALL' | AdminActivityModule>('ALL');
  const [filterAction, setFilterAction] = useState<'ALL' | AdminActivityActionType>('ALL');
  const [filterSeverity, setFilterSeverity] = useState<'ALL' | 'info' | 'warning' | 'critical'>(
    'ALL'
  );
  const [filterPeriod, setFilterPeriod] = useState<'ALL' | 'TODAY' | '7DAYS' | '30DAYS'>('ALL');
  const [selectedLogDetail, setSelectedLogDetail] = useState<AdminActivityLog | null>(null);
  const [confirmClearModal, setConfirmClearModal] = useState(false);

  // Manual Audit Note Modal State
  const [showAddNoteModal, setShowAddNoteModal] = useState(false);
  const [noteModule, setNoteModule] = useState<AdminActivityModule>('PENGURUSAN_WARGA');
  const [noteActionType, setNoteActionType] = useState<AdminActivityActionType>('VERIFY_STATUS');
  const [noteTarget, setNoteTarget] = useState('');
  const [noteSummary, setNoteSummary] = useState('');
  const [noteDetails, setNoteDetails] = useState('');
  const [noteBeforeValue, setNoteBeforeValue] = useState('');
  const [noteAfterValue, setNoteAfterValue] = useState('');
  const [noteSeverity, setNoteSeverity] = useState<'info' | 'warning' | 'critical'>('info');

  const isMasterLurah = Boolean(
    currentUser.isMasterLurah || currentUser.roleLevel === 'master_admin'
  );

  // Normalized logs with real-time WITA timestamp safety
  const normalizedLogs = useMemo(() => {
    return activityLogs.map((log) => ({
      ...log,
      timestamp: normalizeLogTimestamp(log.timestamp, log.createdAtMs),
    }));
  }, [activityLogs]);

  // Count per module for quick-filter chips
  const moduleCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const log of normalizedLogs) {
      counts[log.module] = (counts[log.module] || 0) + 1;
    }
    return counts;
  }, [normalizedLogs]);

  const todayDateLabel = useMemo(() => getRealtimeDateString(getRealtimeNow()), []);

  const filteredLogs = useMemo(() => {
    const nowMs = Date.now();
    return normalizedLogs.filter((log) => {
      if (filterActor !== 'ALL' && log.actorUsername !== filterActor) return false;
      if (filterModule !== 'ALL' && log.module !== filterModule) return false;
      if (filterAction !== 'ALL' && log.actionType !== filterAction) return false;
      if (filterSeverity !== 'ALL' && log.severity !== filterSeverity) return false;

      if (filterRoleGroup !== 'ALL') {
        const jab = `${log.actorJabatan || ''} ${log.actorUsername || ''}`.toLowerCase();
        if (filterRoleGroup === 'LURAH') {
          if (
            log.actorRoleLevel !== 'master_admin' &&
            !jab.includes('lurah') &&
            log.actorUsername !== 'lurah' &&
            log.actorUsername !== 'admin'
          ) {
            return false;
          }
          if (jab.includes('sekretaris')) return false;
        } else if (filterRoleGroup === 'SEKRETARIS') {
          if (!jab.includes('sekretaris')) return false;
        } else if (filterRoleGroup === 'KASI') {
          if (!jab.includes('kasi') && !jab.includes('kepala seksi')) return false;
        } else if (filterRoleGroup === 'STAF_OPERATOR') {
          if (
            log.actorRoleLevel !== 'operator' &&
            !jab.includes('staf') &&
            !jab.includes('operator') &&
            !jab.includes('lpm')
          ) {
            return false;
          }
        }
      }

      if (filterPeriod !== 'ALL') {
        if (filterPeriod === 'TODAY') {
          const isTodayMatch =
            log.timestamp.includes(todayDateLabel) ||
            (log.createdAtMs && Math.abs(nowMs - log.createdAtMs) <= 24 * 60 * 60 * 1000);
          if (!isTodayMatch) return false;
        } else if (filterPeriod === '7DAYS') {
          if (log.createdAtMs && Math.abs(nowMs - log.createdAtMs) > 7 * 24 * 60 * 60 * 1000) {
            return false;
          }
        } else if (filterPeriod === '30DAYS') {
          if (log.createdAtMs && Math.abs(nowMs - log.createdAtMs) > 30 * 24 * 60 * 60 * 1000) {
            return false;
          }
        }
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const haystack = [
          log.id,
          log.timestamp,
          log.actorName,
          log.actorUsername,
          log.actorJabatan,
          log.actorNip || '',
          log.targetLabel,
          log.summary,
          log.details || '',
          log.beforeValue || '',
          log.afterValue || '',
          MODULE_LABELS[log.module] || log.module,
          ACTION_BADGE_CONFIG[log.actionType]?.label || log.actionType,
        ]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      return true;
    });
  }, [
    normalizedLogs,
    filterActor,
    filterRoleGroup,
    filterModule,
    filterAction,
    filterSeverity,
    filterPeriod,
    searchQuery,
    todayDateLabel,
  ]);

  // Summary metrics
  const stats = useMemo(() => {
    const total = normalizedLogs.length;
    const todayLogs = normalizedLogs.filter(
      (l) =>
        l.timestamp.includes(todayDateLabel) ||
        (l.createdAtMs && Math.abs(Date.now() - l.createdAtMs) <= 24 * 60 * 60 * 1000)
    ).length;
    const verifications = normalizedLogs.filter(
      (l) =>
        l.actionType === 'VERIFY_STATUS' ||
        l.actionType === 'UPDATE' ||
        l.actionType === 'CREATE'
    ).length;
    const criticalOrWarning = normalizedLogs.filter(
      (l) =>
        l.severity === 'critical' ||
        l.severity === 'warning' ||
        l.actionType === 'DELETE' ||
        l.actionType === 'ACCESS_CHANGE'
    ).length;
    const uniqueActors = new Set(normalizedLogs.map((l) => l.actorUsername)).size;
    const activeModulesCount = new Set(normalizedLogs.map((l) => l.module)).size;
    return {
      total,
      todayLogs,
      verifications,
      criticalOrWarning,
      uniqueActors,
      activeModulesCount,
    };
  }, [normalizedLogs, todayDateLabel]);

  const handleExportCsv = () => {
    const headers = [
      'ID Log',
      'Waktu Real-Time (WITA)',
      'Username',
      'Nama Pejabat / Petugas Admin',
      'Jabatan Struktural (Perwali 65/2023)',
      'NIP',
      'Modul Menu',
      'Jenis Aksi',
      'Objek Data / Target',
      'Ringkasan Aktivitas',
      'Rincian Lengkap',
      'Nilai Sebelum (Before)',
      'Nilai Sesudah (After)',
      'Tingkat',
    ];
    const rows = filteredLogs.map((log) => [
      log.id,
      log.timestamp,
      log.actorUsername,
      log.actorName,
      log.actorJabatan,
      log.actorNip || '-',
      MODULE_LABELS[log.module] || log.module,
      ACTION_BADGE_CONFIG[log.actionType]?.label || log.actionType,
      log.targetLabel,
      log.summary,
      log.details || '-',
      log.beforeValue || '-',
      log.afterValue || '-',
      log.severity.toUpperCase(),
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers, ...rows]
        .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        .join('\n');

    const realDateSlug = getRealtimeDateString(getRealtimeNow()).replace(/\s+/g, '_');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `Audit_Trail_Log_Aktivitas_Kelurahan_Panaikang_${realDateSlug}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleApplyTemplate = (tpl: (typeof AUDIT_SUPERVISION_TEMPLATES)[number]) => {
    setNoteModule(tpl.module);
    setNoteActionType(tpl.actionType);
    setNoteTarget(tpl.targetLabel);
    setNoteSummary(tpl.summary);
    setNoteDetails(tpl.details);
    setNoteSeverity(tpl.severity);
  };

  const handleSubmitManualNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTarget.trim() || !noteSummary.trim()) return;
    onAddManualLog({
      actionType: noteActionType,
      module: noteModule,
      targetLabel: noteTarget.trim(),
      summary: noteSummary.trim(),
      details:
        noteDetails.trim() ||
        `Catatan supervisi & audit langsung oleh ${currentUser.fullName} (${currentUser.jabatan}).`,
      beforeValue: noteBeforeValue.trim() || undefined,
      afterValue: noteAfterValue.trim() || undefined,
      severity: noteSeverity,
    });
    setNoteTarget('');
    setNoteSummary('');
    setNoteDetails('');
    setNoteBeforeValue('');
    setNoteAfterValue('');
    setShowAddNoteModal(false);
  };

  const handlePrintAuditReport = () => {
    const kopHtml = buildOfficialKopSuratHtml(
      activeProfile,
      filteredLogs.length > 15 ? 'compact' : 'standard'
    );
    const realNow = getRealtimeNow();
    const nowStr = realNow.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      timeZone: 'Asia/Makassar',
    });
    const nowTimeWita = getRealtimeDateTimeString(realNow);

    const rowsHtml = filteredLogs
      .map(
        (log, i) => `
      <tr>
        <td style="text-align:center">${i + 1}</td>
        <td><strong>${log.id}</strong><br/><span style="color:#0277bd;font-weight:700">${log.timestamp}</span></td>
        <td><strong>${log.actorName}</strong><br/><span style="color:#475569">${log.actorJabatan || 'Staf / Operator'}</span><br/><span style="color:#64748b;font-size:8.5px">NIP: ${log.actorNip || '-'} (@${log.actorUsername})</span></td>
        <td><strong>${MODULE_SHORT_LABELS[log.module] || log.module}</strong><br/><span style="color:#0d3868;font-size:8.5px">${ACTION_BADGE_CONFIG[log.actionType]?.label || log.actionType}</span></td>
        <td>
          <strong>${log.summary}</strong><br/>
          <span style="color:#0277bd;font-weight:600">Objek: ${log.targetLabel}</span>
          ${log.details ? `<br/><span style="color:#475569">${log.details}</span>` : ''}
          ${
            log.beforeValue || log.afterValue
              ? `<br/><span style="color:#64748b;font-size:8.5px">Sebelum: ${log.beforeValue || '-'} &rarr; Sesudah: <strong>${log.afterValue || '-'}</strong></span>`
              : ''
          }
        </td>
      </tr>`
      )
      .join('');

    const htmlDoc = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <title>Laporan Audit Trail Admin Kelurahan Panaikang — ${nowStr}</title>
  <style>
    @page { size: A4 portrait; margin: 14mm; }
    * { box-sizing: border-box; }
    body { font-family: Arial, Helvetica, sans-serif; color: #1e293b; margin: 0; font-size: 10.5px; line-height: 1.4; }
    .doc-title { text-align: center; font-size: 13px; font-weight: 800; color: #0d3868; text-decoration: underline; text-transform: uppercase; }
    .doc-meta { text-align: center; font-size: 9.5px; color: #475569; margin-top: 3px; margin-bottom: 12px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 14px; }
    th { background: #0d3868; color: #fff; border: 1px solid #0d3868; padding: 6px; font-size: 9.5px; text-align: left; }
    td { border: 1px solid #cbd5e1; padding: 5px 6px; font-size: 9px; vertical-align: top; }
    .sign-row { display: flex; justify-content: flex-end; margin-top: 18px; page-break-inside: avoid; }
    .sign-box { text-align: center; width: 240px; }
  </style>
</head>
<body>
  ${kopHtml}
  <div class="doc-title">LAPORAN AUDIT TRAIL & RIWAYAT AKTIVITAS ADMINISTRATOR</div>
  <div class="doc-meta">
    Basis Struktur: <strong>${activeProfile.perwaliReference || 'PERWALI KOTA MAKASSAR NOMOR 65 TAHUN 2023'}</strong><br/>
    Total Log Tercetak: <strong>${filteredLogs.length} Aktivitas</strong> &nbsp;|&nbsp; Waktu Cetak Real-Time: <strong>${nowTimeWita}</strong>
  </div>
  <table>
    <thead>
      <tr>
        <th style="width:28px;text-align:center">No</th>
        <th style="width:112px">ID & Waktu (WITA)</th>
        <th style="width:138px">Pejabat / Staf Pelaksana</th>
        <th style="width:115px">Modul & Jenis Aksi</th>
        <th>Ringkasan Aktivitas, Objek Data & Perubahan</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml}
    </tbody>
  </table>
  <div class="sign-row">
    <div class="sign-box">
      <div>Makassar, ${nowStr}</div>
      <div style="font-weight:700;margin-top:2px;">LURAH PANAIKANG</div>
      <div style="height:52px;"></div>
      <div style="font-weight:800;text-decoration:underline;color:#0d3868;">${activeProfile.lurahName || INITIAL_KELURAHAN_PROFILE.lurahName}</div>
      <div style="font-size:9.5px;color:#475569;">NIP. ${activeProfile.lurahNip || INITIAL_KELURAHAN_PROFILE.lurahNip}</div>
    </div>
  </div>
</body>
</html>`;

    const existing = document.getElementById('audit-print-iframe') as HTMLIFrameElement | null;
    if (existing) existing.remove();
    const iframe = document.createElement('iframe');
    iframe.id = 'audit-print-iframe';
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);
    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(htmlDoc);
      doc.close();
      window.setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      }, 250);
    }
  };

  const hasActiveFilter =
    Boolean(searchQuery.trim()) ||
    filterActor !== 'ALL' ||
    filterRoleGroup !== 'ALL' ||
    filterModule !== 'ALL' ||
    filterAction !== 'ALL' ||
    filterSeverity !== 'ALL' ||
    filterPeriod !== 'ALL';

  const resetAllFilters = () => {
    setSearchQuery('');
    setFilterActor('ALL');
    setFilterRoleGroup('ALL');
    setFilterModule('ALL');
    setFilterAction('ALL');
    setFilterSeverity('ALL');
    setFilterPeriod('ALL');
  };

  return (
    <div className="space-y-6">
      {/* Top Executive Banner (Compact & Simplified) */}
      <div className="bg-gradient-to-r from-[#0D3868] via-[#134B8A] to-[#0277BD] rounded-2xl p-3.5 sm:p-4 text-white shadow-xs space-y-2.5">
        <div className="w-full space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 border border-white/25 text-[10px] font-extrabold text-amber-300">
              <History className="w-3 h-3" />
              <span>AUDIT TRAIL REAL-TIME WITA · PERWALI KOTA MAKASSAR NO. 65 TAHUN 2023</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-300/40 text-[10px] font-mono-num font-bold text-emerald-200">
              <Clock className="w-3 h-3 text-emerald-300" />
              <span>{liveWitaClock}</span>
            </div>
          </div>
          <h2 className="text-base sm:text-lg font-extrabold tracking-tight">
            Log Aktivitas &amp; Riwayat Audit Seluruh Modul Admin
          </h2>
          <p className="text-xs text-sky-100 w-full leading-relaxed">
            Rekam jejak otomatis (audit trail) waktu nyata Makassar (WITA) untuk seluruh{' '}
            <strong>12 Menu Admin</strong>: 13 Layanan Administrasi Surat Resmi (
            <span className="font-mono-num">PM-01 s/d SL-13</span>), 9 Kategori Pengaduan Warga,
            Profil &amp; Bagan Struktur Kelurahan Dinamis, Bagan RT/RW &amp; Ketua LPM, Jadwal Siskamling,
            Bank Sampah (BSU, Teba, Biopori), Kerja Bakti, 7 Sub-Modul Urban Farming, hingga
            Parameter User RBAC.
          </p>
        </div>

        {/* Action Buttons Below Text (Kuning, Hijau, Biru) */}
        <div className="flex flex-wrap items-center gap-2 pt-0.5">
          <button
            type="button"
            onClick={() => setShowAddNoteModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-extrabold transition-colors cursor-pointer shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Catat Supervisi Audit</span>
          </button>
          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold border border-emerald-400/40 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Unduh CSV Audit</span>
          </button>
          <button
            type="button"
            onClick={handlePrintAuditReport}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500/30 hover:bg-sky-500/45 text-white text-xs font-extrabold border border-sky-300/40 transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak Laporan Resmi</span>
          </button>
        </div>

        {/* 5 Compact KPI Number Boxes */}
        <div className="pt-2.5 border-t border-white/15 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          <div className="px-3 py-2 rounded-xl bg-white/10 border border-white/15 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="text-[11px] text-sky-200 font-bold truncate">Total Aktivitas</div>
              <div className="text-[10px] text-emerald-300 truncate">Sinkron WITA</div>
            </div>
            <div className="text-sm sm:text-base font-extrabold font-mono-num text-white shrink-0">
              {stats.total}
            </div>
          </div>

          <div className="px-3 py-2 rounded-xl bg-white/10 border border-white/15 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="text-[11px] text-sky-200 font-bold truncate">Hari Ini (WITA)</div>
              <div className="text-[10px] text-sky-100 truncate">{todayDateLabel}</div>
            </div>
            <div className="text-sm sm:text-base font-extrabold font-mono-num text-emerald-300 shrink-0">
              {stats.todayLogs}
            </div>
          </div>

          <div className="px-3 py-2 rounded-xl bg-white/10 border border-white/15 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="text-[11px] text-sky-200 font-bold truncate">Verifikasi &amp; Update</div>
              <div className="text-[10px] text-sky-100 truncate">Surat, Aduan &amp; Modul</div>
            </div>
            <div className="text-sm sm:text-base font-extrabold font-mono-num text-amber-300 shrink-0">
              {stats.verifications}
            </div>
          </div>

          <div className="px-3 py-2 rounded-xl bg-white/10 border border-white/15 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="text-[11px] text-sky-200 font-bold truncate">Akses &amp; Hapus</div>
              <div className="text-[10px] text-sky-100 truncate">Pengawasan Lurah</div>
            </div>
            <div className="text-sm sm:text-base font-extrabold font-mono-num text-rose-300 shrink-0">
              {stats.criticalOrWarning}
            </div>
          </div>

          <div className="px-3 py-2 rounded-xl bg-white/10 border border-white/15 flex items-center justify-between gap-2 col-span-2 sm:col-span-1">
            <div className="min-w-0">
              <div className="text-[11px] text-sky-200 font-bold truncate">Pejabat &amp; Modul</div>
              <div className="text-[10px] text-sky-100 truncate">
                {stats.activeModulesCount} modul · {adminUsers.length} user
              </div>
            </div>
            <div className="text-sm sm:text-base font-extrabold font-mono-num text-white shrink-0">
              {stats.uniqueActors}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Module Filter Bar (Synced with Current Active Menus) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#0D3868]" />
            <span className="text-xs font-extrabold text-[#0D3868] uppercase tracking-wider">
              Filter Cepat Berdasarkan Modul Menu Saat Ini
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                { id: 'ALL', label: 'Semua Waktu' },
                { id: 'TODAY', label: `Hari Ini (${todayDateLabel})` },
                { id: '7DAYS', label: '7 Hari Terakhir' },
                { id: '30DAYS', label: '30 Hari Terakhir' },
              ] as const
            ).map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setFilterPeriod(p.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                  filterPeriod === p.id
                    ? 'bg-[#0D3868] text-white'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setFilterModule('ALL')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
              filterModule === 'ALL'
                ? 'bg-[#0D3868] border-[#0D3868] text-white shadow-2xs'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <span>Semua Modul</span>
            <span
              className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono-num font-extrabold ${
                filterModule === 'ALL' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {normalizedLogs.length}
            </span>
          </button>

          {(Object.keys(MODULE_SHORT_LABELS) as AdminActivityModule[]).map((modKey) => {
            const count = moduleCounts[modKey] || 0;
            const isSelected = filterModule === modKey;
            return (
              <button
                key={modKey}
                type="button"
                onClick={() => setFilterModule(isSelected ? 'ALL' : modKey)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#0277BD] border-[#0277BD] text-white shadow-2xs'
                    : count > 0
                    ? 'bg-sky-50/70 border-sky-200 text-[#0D3868] hover:bg-sky-100/80'
                    : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                }`}
              >
                <span>{MODULE_SHORT_LABELS[modKey]}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono-num font-extrabold ${
                    isSelected
                      ? 'bg-white/20 text-white'
                      : count > 0
                      ? 'bg-sky-200/70 text-[#0D3868]'
                      : 'bg-slate-200/70 text-slate-500'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari berdasarkan nama pejabat/staf, NIP, nomor tiket (SRT-2026 / ADU-2026), RW/RT, atau rincian perubahan..."
              className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:border-[#0277BD] focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Filter by Structural Group (Perwali 65/2023) */}
            <select
              value={filterRoleGroup}
              onChange={(e) =>
                setFilterRoleGroup(
                  e.target.value as 'ALL' | 'LURAH' | 'SEKRETARIS' | 'KASI' | 'STAF_OPERATOR'
                )
              }
              className="px-3 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-xs font-bold text-slate-700 focus:border-[#0277BD] focus:outline-none"
            >
              <option value="ALL">Semua Unsur Jabatan (Perwali 65/2023)</option>
              <option value="LURAH">Pimpinan Lurah (Master Admin)</option>
              <option value="SEKRETARIS">Sekretaris Lurah</option>
              <option value="KASI">Kepala Seksi (3 Kasi Kelurahan)</option>
              <option value="STAF_OPERATOR">Staf Seksi, Ketua LPM & Operator PTSP</option>
            </select>

            {/* Filter by User Admin */}
            <select
              value={filterActor}
              onChange={(e) => setFilterActor(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-xs font-bold text-slate-700 focus:border-[#0277BD] focus:outline-none"
            >
              <option value="ALL">Semua Akun Admin ({adminUsers.length})</option>
              {adminUsers.map((u) => (
                <option key={u.id} value={u.username}>
                  {u.fullName} (@{u.username})
                </option>
              ))}
            </select>

            {/* Filter by Module */}
            <select
              value={filterModule}
              onChange={(e) => setFilterModule(e.target.value as 'ALL' | AdminActivityModule)}
              className="px-3 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-xs font-bold text-slate-700 focus:border-[#0277BD] focus:outline-none"
            >
              <option value="ALL">Semua Modul Menu (15 Modul)</option>
              {(Object.keys(MODULE_LABELS) as AdminActivityModule[]).map((mod) => (
                <option key={mod} value={mod}>
                  {MODULE_LABELS[mod]}
                </option>
              ))}
            </select>

            {/* Filter by Action Type */}
            <select
              value={filterAction}
              onChange={(e) =>
                setFilterAction(e.target.value as 'ALL' | AdminActivityActionType)
              }
              className="px-3 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-xs font-bold text-slate-700 focus:border-[#0277BD] focus:outline-none"
            >
              <option value="ALL">Semua Jenis Aksi</option>
              <option value="VERIFY_STATUS">Verifikasi & Penerbitan Surat Resmi</option>
              <option value="CREATE">Tambah Data Baru</option>
              <option value="UPDATE">Perubahan / Simpan Data</option>
              <option value="ACCESS_CHANGE">Pengaturan Hak Akses RBAC User</option>
              <option value="EXPORT">Cetak / Ekspor Laporan PDF</option>
              <option value="DELETE">Penghapusan Data</option>
              <option value="LOGIN">Login Sesi Admin (WITA)</option>
              <option value="LOGOUT">Logout Sesi Admin</option>
            </select>

            {/* Filter by Severity */}
            <select
              value={filterSeverity}
              onChange={(e) =>
                setFilterSeverity(e.target.value as 'ALL' | 'info' | 'warning' | 'critical')
              }
              className="px-3 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-xs font-bold text-slate-700 focus:border-[#0277BD] focus:outline-none"
            >
              <option value="ALL">Semua Tingkat</option>
              <option value="info">Normal / Operasional</option>
              <option value="warning">Perhatian (Akses / Konfigurasi)</option>
              <option value="critical">Kritis (Hapus Data)</option>
            </select>
          </div>
        </div>

        {/* Active filter summary & quick reset */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
          <div>
            Menampilkan <strong className="text-[#0D3868]">{filteredLogs.length}</strong> dari{' '}
            <strong>{normalizedLogs.length}</strong> riwayat aktivitas admin (Zona Waktu: Makassar
            WITA / UTC+8)
          </div>
          <div className="flex items-center gap-3">
            {hasActiveFilter && (
              <button
                type="button"
                onClick={resetAllFilters}
                className="inline-flex items-center gap-1 text-xs font-bold text-[#0277BD] hover:underline cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset Semua Filter</span>
              </button>
            )}
            {isMasterLurah && onClearLogs && normalizedLogs.length > 0 && (
              <button
                type="button"
                onClick={() => setConfirmClearModal(true)}
                className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 hover:text-rose-800 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Bersihkan Riwayat Log ({normalizedLogs.length})</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Audit Trail Timeline / List */}
      <div className="space-y-3">
        {filteredLogs.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center space-y-3">
            <History className="w-10 h-10 text-slate-300 mx-auto" />
            <div className="text-base font-extrabold text-slate-700">
              {normalizedLogs.length === 0
                ? 'Belum Ada Riwayat Aktivitas Admin Tercatat'
                : 'Tidak Ada Log Aktivitas yang Sesuai Filter'}
            </div>
            <p className="text-xs text-slate-500 max-w-lg mx-auto leading-relaxed">
              {normalizedLogs.length === 0
                ? 'Setiap aktivitas login/logout, verifikasi 13 layanan surat resmi warga, tindak lanjut laporan, pembaruan bagan struktur kelurahan & RT/RW, pengelolaan sampah (BSU/Teba/Biopori), kerja bakti, urban farming, dan pengaturan hak akses user akan otomatis tercatat secara real-time (WITA) di halaman ini.'
                : 'Coba ubah kata kunci pencarian atau klik "Reset Semua Filter" untuk melihat seluruh riwayat audit trail.'}
            </p>
            <div className="pt-1 flex flex-wrap items-center justify-center gap-2">
              {hasActiveFilter && (
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0277BD] hover:bg-[#0D3868] text-white text-xs font-extrabold cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reset Semua Filter</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowAddNoteModal(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-extrabold cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Catat Supervisi Audit Pertama</span>
              </button>
            </div>
          </div>
        ) : (
          filteredLogs.map((log) => {
            const actionBadge = ACTION_BADGE_CONFIG[log.actionType] || ACTION_BADGE_CONFIG.UPDATE;
            const isCritical = log.severity === 'critical' || log.actionType === 'DELETE';
            const isWarning = log.severity === 'warning' || log.actionType === 'ACCESS_CHANGE';

            return (
              <div
                key={log.id}
                className={`bg-white rounded-2xl border p-5 transition-all hover:shadow-sm ${
                  isCritical
                    ? 'border-rose-200 bg-rose-50/20'
                    : isWarning
                    ? 'border-amber-200 bg-amber-50/15'
                    : 'border-slate-200'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  {/* Left: Actor & Action Info */}
                  <div className="space-y-2.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono-num text-[11px] font-bold px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
                        {log.id}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-[#0D3868] bg-sky-50 px-2.5 py-0.5 rounded-lg border border-sky-200/80 font-mono-num">
                        <Clock className="w-3.5 h-3.5 text-[#0277BD]" />
                        {log.timestamp}
                      </span>
                      <span
                        className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-lg border ${actionBadge.bg} ${actionBadge.text} ${actionBadge.border}`}
                      >
                        {actionBadge.label}
                      </span>
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-lg bg-slate-100 text-[#0D3868]">
                        {MODULE_LABELS[log.module] || log.module}
                      </span>
                      {isCritical && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-0.5 rounded-lg bg-rose-100 text-rose-800 border border-rose-300">
                          <AlertTriangle className="w-3 h-3" />
                          Aksi Kritis
                        </span>
                      )}
                    </div>

                    <div>
                      <div className="text-sm sm:text-base font-extrabold text-[#0D3868]">
                        {log.summary}
                      </div>
                      <div className="mt-0.5 text-xs font-semibold text-slate-700">
                        Objek Data: <span className="text-[#0277BD]">{log.targetLabel}</span>
                      </div>
                      {log.details && (
                        <p className="mt-1 text-xs text-slate-600 leading-relaxed">{log.details}</p>
                      )}
                    </div>

                    {/* Before / After Audit Diff Box */}
                    {(log.beforeValue || log.afterValue) && (
                      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-2">
                        {log.beforeValue && (
                          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/90 text-xs">
                            <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-0.5">
                              Sebelum Perubahan (Before)
                            </div>
                            <div className="font-mono-num text-slate-700 font-semibold break-words">
                              {log.beforeValue}
                            </div>
                          </div>
                        )}
                        {log.afterValue && (
                          <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs">
                            <div className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 mb-0.5">
                              Sesudah Perubahan (After)
                            </div>
                            <div className="font-mono-num text-emerald-950 font-bold break-words">
                              {log.afterValue}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Right: User Admin Identity Card */}
                  <div className="lg:w-76 shrink-0 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between gap-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                          Dieksekusi Oleh Pejabat / Admin
                        </div>
                        <div className="text-xs font-extrabold text-[#0D3868] mt-0.5">
                          {log.actorName}
                        </div>
                        <div className="text-[11px] text-slate-600 font-medium">
                          {log.actorJabatan}
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[10px] font-mono-num font-bold text-[#0277BD]">
                        @{log.actorUsername}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-slate-200/70 flex items-center justify-between gap-2 text-[11px] text-slate-500">
                      <span className="font-mono-num truncate">NIP: {log.actorNip || '-'}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => setSelectedLogDetail(log)}
                          className="inline-flex items-center gap-1 font-bold text-[#0277BD] hover:text-[#0D3868] cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Detail</span>
                        </button>
                        {isMasterLurah && onDeleteLogEntry && (
                          <button
                            type="button"
                            onClick={() => onDeleteLogEntry(log.id)}
                            title="Hapus entri log ini"
                            className="inline-flex items-center gap-1 font-bold text-rose-600 hover:text-rose-800 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal Detail Audit Log */}
      {selectedLogDetail && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-xl w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <div className="text-xs font-extrabold uppercase tracking-wider text-[#0277BD]">
                  Rincian Rekaman Audit Trail · {selectedLogDetail.id}
                </div>
                <h3 className="text-lg font-extrabold text-[#0D3868] mt-0.5">
                  {selectedLogDetail.summary}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLogDetail(null)}
                className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-3 gap-2 py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Waktu Real-Time (WITA)</span>
                <span className="col-span-2 font-bold text-slate-800 font-mono-num">
                  {selectedLogDetail.timestamp}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Pejabat / User Admin</span>
                <span className="col-span-2 font-bold text-[#0D3868]">
                  {selectedLogDetail.actorName} (@{selectedLogDetail.actorUsername})
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Jabatan & NIP</span>
                <span className="col-span-2 text-slate-700">
                  {selectedLogDetail.actorJabatan} · NIP: {selectedLogDetail.actorNip || '-'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Modul & Jenis Aksi</span>
                <span className="col-span-2 font-bold text-slate-800">
                  {MODULE_LABELS[selectedLogDetail.module] || selectedLogDetail.module} ·{' '}
                  {ACTION_BADGE_CONFIG[selectedLogDetail.actionType]?.label ||
                    selectedLogDetail.actionType}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Objek Target</span>
                <span className="col-span-2 font-bold text-[#0277BD]">
                  {selectedLogDetail.targetLabel}
                </span>
              </div>
              {selectedLogDetail.details && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 leading-relaxed">
                  <div className="text-[11px] font-extrabold text-slate-500 mb-1">
                    Keterangan Lengkap:
                  </div>
                  {selectedLogDetail.details}
                </div>
              )}
              {(selectedLogDetail.beforeValue || selectedLogDetail.afterValue) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="text-[10px] font-extrabold uppercase text-slate-400">
                      Data Sebelum
                    </div>
                    <div className="mt-1 font-mono-num font-semibold text-slate-700">
                      {selectedLogDetail.beforeValue || '-'}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                    <div className="text-[10px] font-extrabold uppercase text-emerald-700">
                      Data Sesudah
                    </div>
                    <div className="mt-1 font-mono-num font-bold text-emerald-950">
                      {selectedLogDetail.afterValue || '-'}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end gap-2">
              {isMasterLurah && onDeleteLogEntry && (
                <button
                  type="button"
                  onClick={() => {
                    onDeleteLogEntry(selectedLogDetail.id);
                    setSelectedLogDetail(null);
                  }}
                  className="px-4 py-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-extrabold cursor-pointer"
                >
                  Hapus Log Ini
                </button>
              )}
              <button
                type="button"
                onClick={() => setSelectedLogDetail(null)}
                className="px-5 py-2 rounded-xl bg-[#0D3868] text-white text-xs font-extrabold cursor-pointer"
              >
                Tutup Detail
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Bersihkan Riwayat Log */}
      {confirmClearModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-md w-full p-6 space-y-4 shadow-xl text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[#0D3868]">
                Bersihkan Seluruh Riwayat Log Aktivitas?
              </h3>
              <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                Seluruh <strong>{normalizedLogs.length} catatan audit trail</strong> yang tersimpan
                saat ini akan dikosongkan. Pastikan Anda telah mengunduh CSV atau mencetak laporan
                audit jika diperlukan sebagai arsip.
              </p>
            </div>
            <div className="pt-2 flex items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={() => setConfirmClearModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onClearLogs) onClearLogs();
                  setConfirmClearModal(false);
                }}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold cursor-pointer"
              >
                Ya, Bersihkan Log
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tambah Catatan Supervisi Audit Manual */}
      {showAddNoteModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <form
            onSubmit={handleSubmitManualNote}
            className="bg-white rounded-3xl border border-slate-200 max-w-2xl w-full p-6 space-y-4 shadow-xl my-8"
          >
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <div className="text-xs font-extrabold uppercase tracking-wider text-[#0277BD]">
                  Supervisi Lurah / Audit Internal WITA
                </div>
                <h3 className="text-lg font-extrabold text-[#0D3868]">
                  Catat Rekaman Audit Trail Baru
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Dieksekusi oleh: <strong>{currentUser.fullName}</strong> ({currentUser.jabatan}) ·{' '}
                  <span className="font-mono-num">{liveWitaClock}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddNoteModal(false)}
                className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Supervision Templates */}
            <div className="p-3.5 rounded-2xl bg-sky-50/70 border border-sky-200 space-y-2">
              <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-[#0D3868]">
                <Sparkles className="w-3.5 h-3.5 text-[#0277BD]" />
                <span>Isi Cepat dari Template Supervisi Modul Saat Ini:</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {AUDIT_SUPERVISION_TEMPLATES.map((tpl) => (
                  <button
                    key={tpl.label}
                    type="button"
                    onClick={() => handleApplyTemplate(tpl)}
                    className="px-2.5 py-1 rounded-lg bg-white hover:bg-[#0D3868] text-[#0D3868] hover:text-white border border-sky-200 text-[11px] font-bold transition-colors cursor-pointer"
                  >
                    {tpl.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Modul Menu Terkait</label>
                  <select
                    value={noteModule}
                    onChange={(e) => setNoteModule(e.target.value as AdminActivityModule)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-semibold"
                  >
                    {(Object.keys(MODULE_LABELS) as AdminActivityModule[]).map((mod) => (
                      <option key={mod} value={mod}>
                        {MODULE_LABELS[mod]}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Jenis Aksi Audit</label>
                  <select
                    value={noteActionType}
                    onChange={(e) => setNoteActionType(e.target.value as AdminActivityActionType)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-semibold"
                  >
                    <option value="VERIFY_STATUS">Verifikasi & Penerbitan Surat</option>
                    <option value="UPDATE">Perubahan / Evaluasi Data</option>
                    <option value="CREATE">Penambahan Data Baru</option>
                    <option value="ACCESS_CHANGE">Penyesuaian Hak Akses RBAC</option>
                    <option value="EXPORT">Cetak / Ekspor Dokumen Resmi</option>
                    <option value="DELETE">Penghapusan / Penertiban Data</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Objek Data / Nomor Tiket / Nama Sub-Modul *
                </label>
                <input
                  type="text"
                  required
                  value={noteTarget}
                  onChange={(e) => setNoteTarget(e.target.value)}
                  placeholder="Misal: Evaluasi 13 Layanan Surat Resmi (PM-01 s/d SL-13) / Bagan Struktur Perwali 65/2023"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Ringkasan Aktivitas / Temuan Supervisi *
                </label>
                <input
                  type="text"
                  required
                  value={noteSummary}
                  onChange={(e) => setNoteSummary(e.target.value)}
                  placeholder="Misal: Pemeriksaan kesesuaian berkas SKTM, SKU & waktu layanan SLA loket kelurahan"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Rincian Catatan Tindak Lanjut
                </label>
                <textarea
                  rows={2}
                  value={noteDetails}
                  onChange={(e) => setNoteDetails(e.target.value)}
                  placeholder="Uraikan catatan supervisi, disposisi Lurah, atau perubahan yang dilakukan..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Kondisi Sebelum (Opsional)
                  </label>
                  <input
                    type="text"
                    value={noteBeforeValue}
                    onChange={(e) => setNoteBeforeValue(e.target.value)}
                    placeholder="Contoh: Menunggu Verifikasi"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono-num"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Kondisi Sesudah (Opsional)
                  </label>
                  <input
                    type="text"
                    value={noteAfterValue}
                    onChange={(e) => setNoteAfterValue(e.target.value)}
                    placeholder="Contoh: Terverifikasi & Selesai"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono-num"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tingkat Kepentingan</label>
                  <select
                    value={noteSeverity}
                    onChange={(e) =>
                      setNoteSeverity(e.target.value as 'info' | 'warning' | 'critical')
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-semibold"
                  >
                    <option value="info">Normal / Operasional</option>
                    <option value="warning">Perhatian / Evaluasi Khusus</option>
                    <option value="critical">Kritis / Penting</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddNoteModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#0D3868] hover:bg-[#0277BD] text-white text-xs font-extrabold cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Simpan ke Audit Trail WITA</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
