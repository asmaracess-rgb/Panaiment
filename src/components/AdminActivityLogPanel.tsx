import React, { useState, useMemo } from 'react';
import {
  History,
  Search,
  Filter,
  ShieldCheck,
  UserCheck,
  AlertTriangle,
  FileText,
  Download,
  Printer,
  Plus,
  Trash2,
  Clock,
  ArrowRight,
  CheckCircle2,
  KeyRound,
  LogIn,
  Edit3,
  Eye,
  X,
  RefreshCw,
} from 'lucide-react';
import {
  AdminActivityLog,
  AdminActivityActionType,
  AdminActivityModule,
  AdminUserAccount,
} from '../types';

interface AdminActivityLogPanelProps {
  activityLogs: AdminActivityLog[];
  adminUsers: AdminUserAccount[];
  currentUser: AdminUserAccount;
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
  onClearLogs?: () => void;
}

const MODULE_LABELS: Record<AdminActivityModule, string> = {
  AUTENTIKASI: 'Autentikasi & Sesi Login',
  PENGURUSAN_WARGA: 'Pengurusan Warga (7 Bidang)',
  PROFIL_KELURAHAN: 'Profil Kelurahan',
  STRUKTUR_RTRW: 'Struktur RT / RW',
  INFORMASI_KELURAHAN: 'Informasi & Publikasi IG',
  LAPORAN_WARGA: 'Laporan & Pengaduan Warga',
  BANK_SAMPAH: 'Bank Sampah Unit (BSU)',
  KERJA_BAKTI: 'Jadwal Kerja Bakti',
  PARAMETER_USER: 'Parameter User & Hak Akses',
  KATALOG_SOP: 'Katalog SOP 44 Sub-Menu',
};

const ACTION_BADGE_CONFIG: Record<
  AdminActivityActionType,
  { label: string; bg: string; text: string; border: string }
> = {
  LOGIN: {
    label: 'Login Sesi',
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
    label: 'Ubah Data',
    bg: 'bg-blue-50',
    text: 'text-blue-800',
    border: 'border-blue-200',
  },
  VERIFY_STATUS: {
    label: 'Verifikasi & Surat',
    bg: 'bg-indigo-50',
    text: 'text-indigo-800',
    border: 'border-indigo-200',
  },
  ACCESS_CHANGE: {
    label: 'Hak Akses User',
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
    label: 'Ekspor Laporan',
    bg: 'bg-teal-50',
    text: 'text-teal-800',
    border: 'border-teal-200',
  },
};

export const AdminActivityLogPanel: React.FC<AdminActivityLogPanelProps> = ({
  activityLogs,
  adminUsers,
  currentUser,
  onAddManualLog,
  onClearLogs,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterActor, setFilterActor] = useState<string>('ALL');
  const [filterModule, setFilterModule] = useState<'ALL' | AdminActivityModule>('ALL');
  const [filterAction, setFilterAction] = useState<'ALL' | AdminActivityActionType>('ALL');
  const [filterSeverity, setFilterSeverity] = useState<'ALL' | 'info' | 'warning' | 'critical'>(
    'ALL'
  );
  const [selectedLogDetail, setSelectedLogDetail] = useState<AdminActivityLog | null>(null);

  // Manual Audit Note Modal State
  const [showAddNoteModal, setShowAddNoteModal] = useState(false);
  const [noteModule, setNoteModule] = useState<AdminActivityModule>('PENGURUSAN_WARGA');
  const [noteTarget, setNoteTarget] = useState('');
  const [noteSummary, setNoteSummary] = useState('');
  const [noteDetails, setNoteDetails] = useState('');
  const [noteSeverity, setNoteSeverity] = useState<'info' | 'warning' | 'critical'>('info');

  const isMasterLurah = Boolean(
    currentUser.isMasterLurah || currentUser.roleLevel === 'master_admin'
  );

  const filteredLogs = useMemo(() => {
    return activityLogs.filter((log) => {
      if (filterActor !== 'ALL' && log.actorUsername !== filterActor) return false;
      if (filterModule !== 'ALL' && log.module !== filterModule) return false;
      if (filterAction !== 'ALL' && log.actionType !== filterAction) return false;
      if (filterSeverity !== 'ALL' && log.severity !== filterSeverity) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const haystack = [
          log.id,
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
        ]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      return true;
    });
  }, [activityLogs, filterActor, filterModule, filterAction, filterSeverity, searchQuery]);

  // Summary metrics
  const stats = useMemo(() => {
    const total = activityLogs.length;
    const verifications = activityLogs.filter(
      (l) => l.actionType === 'VERIFY_STATUS' || l.actionType === 'UPDATE' || l.actionType === 'CREATE'
    ).length;
    const criticalOrWarning = activityLogs.filter(
      (l) =>
        l.severity === 'critical' ||
        l.severity === 'warning' ||
        l.actionType === 'DELETE' ||
        l.actionType === 'ACCESS_CHANGE'
    ).length;
    const uniqueActors = new Set(activityLogs.map((l) => l.actorUsername)).size;
    return { total, verifications, criticalOrWarning, uniqueActors };
  }, [activityLogs]);

  const handleExportCsv = () => {
    const headers = [
      'ID Log',
      'Waktu (WITA)',
      'Username',
      'Nama Petugas Admin',
      'Jabatan',
      'Modul',
      'Jenis Aksi',
      'Target Objek',
      'Ringkasan Perubahan',
      'Nilai Sebelum',
      'Nilai Sesudah',
      'Tingkat',
    ];
    const rows = filteredLogs.map((log) => [
      log.id,
      log.timestamp,
      log.actorUsername,
      log.actorName,
      log.actorJabatan,
      MODULE_LABELS[log.module] || log.module,
      ACTION_BADGE_CONFIG[log.actionType]?.label || log.actionType,
      log.targetLabel,
      log.summary,
      log.beforeValue || '-',
      log.afterValue || '-',
      log.severity.toUpperCase(),
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers, ...rows]
        .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        .join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `Audit_Trail_Log_Aktivitas_Kelurahan_Panaikang_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSubmitManualNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTarget.trim() || !noteSummary.trim()) return;
    onAddManualLog({
      actionType: 'UPDATE',
      module: noteModule,
      targetLabel: noteTarget.trim(),
      summary: noteSummary.trim(),
      details: noteDetails.trim() || 'Catatan supervisi & audit langsung oleh Lurah Panaikang.',
      severity: noteSeverity,
    });
    setNoteTarget('');
    setNoteSummary('');
    setNoteDetails('');
    setShowAddNoteModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Executive Banner */}
      <div className="bg-gradient-to-r from-[#0D3868] via-[#134B8A] to-[#0277BD] rounded-3xl p-6 sm:p-7 text-white shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 border border-white/25 text-xs font-extrabold text-amber-300">
              <History className="w-3.5 h-3.5" />
              <span>AUDIT TRAIL & MONITORING PENGAWASAN LURAH PANAIKANG</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Log Aktivitas & Riwayat Perubahan Data Admin
            </h2>
            <p className="text-xs sm:text-sm text-sky-100 max-w-3xl leading-relaxed">
              Rekam jejak otomatis (audit trail) seluruh aktivitas user admin: verifikasi surat
              warga, perubahan status laporan, pembaruan data RT/RW, transaksi Bank Sampah, hingga
              pengaturan hak akses user.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setShowAddNoteModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-extrabold transition-colors cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Catat Supervisi Audit</span>
            </button>
            <button
              type="button"
              onClick={handleExportCsv}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold border border-emerald-400/40 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Unduh CSV Audit</span>
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-extrabold border border-white/25 transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Audit</span>
            </button>
          </div>
        </div>

        {/* 4 KPI Cards */}
        <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="p-4 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-xs">
            <div className="text-xs text-sky-200 font-semibold">Total Aktivitas Tercatat</div>
            <div className="mt-1 text-2xl sm:text-3xl font-extrabold font-mono-num text-white">
              {stats.total}
            </div>
            <div className="mt-1 text-[11px] text-emerald-300 font-semibold">
              Tersinkronisasi Real-Time
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-xs">
            <div className="text-xs text-sky-200 font-semibold">Verifikasi & Perubahan Data</div>
            <div className="mt-1 text-2xl sm:text-3xl font-extrabold font-mono-num text-amber-300">
              {stats.verifications}
            </div>
            <div className="mt-1 text-[11px] text-sky-100">
              Surat warga, laporan & pembaruan modul
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-xs">
            <div className="text-xs text-sky-200 font-semibold">Perubahan Akses & Hapus Data</div>
            <div className="mt-1 text-2xl sm:text-3xl font-extrabold font-mono-num text-rose-300">
              {stats.criticalOrWarning}
            </div>
            <div className="mt-1 text-[11px] text-sky-100">
              Aksi sensitif dalam pengawasan Lurah
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-xs">
            <div className="text-xs text-sky-200 font-semibold">Akun Admin Beraktivitas</div>
            <div className="mt-1 text-2xl sm:text-3xl font-extrabold font-mono-num text-white">
              {stats.uniqueActors} Akun
            </div>
            <div className="mt-1 text-[11px] text-sky-100">
              Dari total {adminUsers.length} user admin terdaftar
            </div>
          </div>
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
              placeholder="Cari berdasarkan nama admin, NIP, nomor tiket surat/laporan, atau rincian perubahan..."
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
            {/* Filter by User Admin */}
            <select
              value={filterActor}
              onChange={(e) => setFilterActor(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-xs font-bold text-slate-700 focus:border-[#0277BD] focus:outline-none"
            >
              <option value="ALL">Semua User Admin ({adminUsers.length})</option>
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
              <option value="ALL">Semua Modul Menu</option>
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
              <option value="VERIFY_STATUS">Verifikasi & Penerbitan Surat</option>
              <option value="CREATE">Tambah Data Baru</option>
              <option value="UPDATE">Perubahan / Edit Data</option>
              <option value="ACCESS_CHANGE">Pengaturan Hak Akses User</option>
              <option value="DELETE">Penghapusan Data</option>
              <option value="LOGIN">Login Sesi Admin</option>
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
            <strong>{activityLogs.length}</strong> riwayat aktivitas admin
          </div>
          <div className="flex items-center gap-3">
            {(searchQuery ||
              filterActor !== 'ALL' ||
              filterModule !== 'ALL' ||
              filterAction !== 'ALL' ||
              filterSeverity !== 'ALL') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setFilterActor('ALL');
                  setFilterModule('ALL');
                  setFilterAction('ALL');
                  setFilterSeverity('ALL');
                }}
                className="inline-flex items-center gap-1 text-xs font-bold text-[#0277BD] hover:underline cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset Filter</span>
              </button>
            )}
            {isMasterLurah && onClearLogs && (
              <button
                type="button"
                onClick={onClearLogs}
                className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 hover:text-rose-800 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Reset ke Log Standar</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Audit Trail Timeline / List */}
      <div className="space-y-3">
        {filteredLogs.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center space-y-2">
            <History className="w-10 h-10 text-slate-300 mx-auto" />
            <div className="text-base font-extrabold text-slate-700">
              Tidak Ada Log Aktivitas yang Sesuai Filter
            </div>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Coba ubah kata kunci pencarian atau pilih filter &quot;Semua User Admin&quot; dan
              &quot;Semua Modul Menu&quot; untuk melihat seluruh riwayat audit trail.
            </p>
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
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
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
                  <div className="lg:w-72 shrink-0 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between gap-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                          Dieksekusi Oleh Admin
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

                    <div className="pt-2 border-t border-slate-200/70 flex items-center justify-between text-[11px] text-slate-500">
                      <span className="font-mono-num truncate">NIP: {log.actorNip || '-'}</span>
                      <button
                        type="button"
                        onClick={() => setSelectedLogDetail(log)}
                        className="inline-flex items-center gap-1 font-bold text-[#0277BD] hover:text-[#0D3868] cursor-pointer shrink-0"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Detail</span>
                      </button>
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
                <span className="text-slate-500">Waktu Kejadian</span>
                <span className="col-span-2 font-bold text-slate-800">
                  {selectedLogDetail.timestamp}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Pelaku / User Admin</span>
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
                  {MODULE_LABELS[selectedLogDetail.module]} ·{' '}
                  {ACTION_BADGE_CONFIG[selectedLogDetail.actionType]?.label}
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

            <div className="pt-2 flex justify-end">
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

      {/* Modal Tambah Catatan Supervisi Audit Manual */}
      {showAddNoteModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSubmitManualNote}
            className="bg-white rounded-3xl border border-slate-200 max-w-lg w-full p-6 space-y-4 shadow-xl"
          >
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <div className="text-xs font-extrabold uppercase tracking-wider text-[#0277BD]">
                  Supervisi Lurah / Audit Internal
                </div>
                <h3 className="text-lg font-extrabold text-[#0D3868]">
                  Catat Rekaman Audit Trail Baru
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddNoteModal(false)}
                className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Modul Terkait</label>
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
                <label className="block font-bold text-slate-700 mb-1">
                  Objek Data / Tiket / Nama Layanan
                </label>
                <input
                  type="text"
                  required
                  value={noteTarget}
                  onChange={(e) => setNoteTarget(e.target.value)}
                  placeholder="Misal: Evaluasi Pelayanan Loket Adminduk Mingguan"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Ringkasan Aktivitas / Temuan Audit
                </label>
                <input
                  type="text"
                  required
                  value={noteSummary}
                  onChange={(e) => setNoteSummary(e.target.value)}
                  placeholder="Misal: Pemeriksaan kesesuaian berkas SKTM & waktu layanan SLA"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Rincian Catatan Tindak Lanjut
                </label>
                <textarea
                  rows={3}
                  value={noteDetails}
                  onChange={(e) => setNoteDetails(e.target.value)}
                  placeholder="Uraikan catatan supervisi atau perubahan yang dilakukan..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
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
                className="px-5 py-2 rounded-xl bg-[#0D3868] hover:bg-[#0277BD] text-white text-xs font-extrabold cursor-pointer"
              >
                Simpan ke Audit Trail
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
