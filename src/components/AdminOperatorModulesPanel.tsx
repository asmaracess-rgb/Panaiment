import React, { useState, useMemo } from 'react';
import {
  FileText,
  AlertCircle,
  Clock,
  CheckCircle2,
  UserCheck,
  Bell,
  Search,
  Send,
  ArrowRight,
  Eye,
  Filter,
  ShieldCheck,
  Briefcase,
  Check,
  AlertTriangle,
  MessageCircle,
  Sliders,
  Building2,
  Users,
  Recycle,
  Sprout,
  Calendar,
  Newspaper,
  Activity,
  History,
} from 'lucide-react';
import {
  CitizenReport,
  PraRegistrasiRecord,
  PengaduanOnlineRecord,
  MasterLayananItem,
  MasterPersyaratanItem,
  WhatsAppRecipient,
  AdminActivityLog,
  ReportStatus,
} from '../types';
import { isSuratAdministrasi, getLayananSeksiInfo } from '../utils/layananSeksiHelper';
import { buildWhatsAppUrl, normalizeWhatsAppPhone } from '../utils/whatsappHelper';
import { getRealtimeDateTimeString } from '../utils/realtimeDate';

export type OperatorSidebarItemKey =
  | 'dashboard'
  | 'pra_registrasi'
  | 'pengaduan'
  | 'daftar_layanan'
  | 'persyaratan_layanan'
  | 'penugasan'
  | 'sla'
  | 'notifikasi'
  | 'laporan_table'
  | 'laporan_arsip'
  | 'riwayat_aktivitas'
  | 'pengaturan';

interface AdminOperatorModulesPanelProps {
  activeSection: 'dashboard' | 'penugasan' | 'sla' | 'notifikasi' | 'pengaturan';
  reports: CitizenReport[];
  praRegistrasiList: PraRegistrasiRecord[];
  pengaduanList: PengaduanOnlineRecord[];
  masterLayananList: MasterLayananItem[];
  masterPersyaratanList: MasterPersyaratanItem[];
  whatsappRecipients: WhatsAppRecipient[];
  activityLogs: AdminActivityLog[];
  adminOfficerName: string;
  onSelectSidebarItem: (item: OperatorSidebarItemKey) => void;
  onOpenAdminModuleTab: (tab: any) => void;
  onOpenReportDetail: (report: CitizenReport) => void;
  onUpdateReport: (id: string, updates: Partial<CitizenReport>) => Promise<{ ok: boolean; errors?: string[] }>;
}

const SEKSI_OPTIONS = [
  'Seksi Pemerintahan & Ketertiban Umum',
  'Seksi Pemberdayaan Masyarakat & Sosial',
  'Seksi Kebersihan & Pertamanan',
  'Sekretariat & Loket Pelayanan Kelurahan',
  'Satgas Kebersihan & Tim Reaksi Cepat (TRC)',
];

// Parse date string safely for SLA calculation
function parseReportAgeHours(dateStr?: string): number {
  if (!dateStr) return 2;
  const parsed = Date.parse(dateStr);
  if (!Number.isNaN(parsed)) {
    const diffHours = (Date.now() - parsed) / (1000 * 60 * 60);
    return Math.max(0.5, Math.min(diffHours, 720));
  }
  return 3.5;
}

function computeSlaInfo(report: CitizenReport) {
  const isSurat = isSuratAdministrasi(report);
  // Target SLA in hours: Urgent complaints = 2h, High/Drainase = 12h, Normal complaint = 24h, Surat = 4h
  const targetHours = isSurat
    ? 4
    : report.urgency === 'Darurat'
    ? 2
    : report.urgency === 'Tinggi'
    ? 12
    : 24;

  const isCompleted = report.status === 'Selesai';
  const ageHours = parseReportAgeHours(report.createdAt);
  const remainingHours = targetHours - ageHours;

  let slaState: 'COMPLETED' | 'NORMAL' | 'NEAR_DUE' | 'OVERDUE' = 'NORMAL';
  if (isCompleted) {
    slaState = 'COMPLETED';
  } else if (remainingHours < 0) {
    slaState = 'OVERDUE';
  } else if (remainingHours <= targetHours * 0.35 || remainingHours <= 2) {
    slaState = 'NEAR_DUE';
  } else {
    slaState = 'NORMAL';
  }

  return {
    isSurat,
    targetHours,
    ageHours: Math.round(ageHours * 10) / 10,
    remainingHours: Math.round(remainingHours * 10) / 10,
    slaState,
  };
}

export const AdminOperatorModulesPanel: React.FC<AdminOperatorModulesPanelProps> = ({
  activeSection,
  reports,
  praRegistrasiList,
  pengaduanList,
  masterLayananList,
  masterPersyaratanList,
  whatsappRecipients,
  activityLogs,
  adminOfficerName,
  onSelectSidebarItem,
  onOpenAdminModuleTab,
  onOpenReportDetail,
  onUpdateReport,
}) => {
  // Penugasan state
  const [assignSearch, setAssignSearch] = useState('');
  const [assignFilterSeksi, setAssignFilterSeksi] = useState('ALL');
  const [assignFilterStatus, setAssignFilterStatus] = useState('ALL');
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [selectedTeam, setSelectedTeam] = useState(SEKSI_OPTIONS[0]);
  const [taskNote, setTaskNote] = useState('');
  const [savingTaskId, setSavingTaskId] = useState<string | null>(null);
  const [taskFeedback, setTaskFeedback] = useState('');

  // SLA state
  const [slaFilter, setSlaFilter] = useState<'ALL' | 'OVERDUE' | 'NEAR_DUE' | 'NORMAL' | 'COMPLETED'>('ALL');
  const [slaTypeFilter, setSlaTypeFilter] = useState<'ALL' | 'SURAT' | 'ADUAN'>('ALL');
  const [slaSearch, setSlaSearch] = useState('');

  // Notifikasi state
  const [readNotifIds, setReadNotifIds] = useState<string[]>(() => {
    try {
      const saved = window.localStorage.getItem('pnk_operator_read_notifs_v1');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [notifFilter, setNotifFilter] = useState<'ALL' | 'UNREAD' | 'SLA' | 'SURAT' | 'ADUAN'>('ALL');

  const markNotifRead = (id: string) => {
    setReadNotifIds((prev) => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      try {
        window.localStorage.setItem('pnk_operator_read_notifs_v1', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const markAllNotifsRead = (allIds: string[]) => {
    setReadNotifIds(allIds);
    try {
      window.localStorage.setItem('pnk_operator_read_notifs_v1', JSON.stringify(allIds));
    } catch {}
  };

  // Computed metrics across all reports
  const enrichedReports = useMemo(() => {
    return reports.map((r) => ({
      report: r,
      sla: computeSlaInfo(r),
    }));
  }, [reports]);

  const suratReports = useMemo(
    () => enrichedReports.filter((item) => item.sla.isSurat),
    [enrichedReports]
  );
  const aduanReports = useMemo(
    () => enrichedReports.filter((item) => !item.sla.isSurat),
    [enrichedReports]
  );

  const waitingVerificationCount = useMemo(
    () => reports.filter((r) => r.status === 'Menunggu Verifikasi').length,
    [reports]
  );
  const inProgressCount = useMemo(
    () => reports.filter((r) => r.status === 'Sedang Ditangani').length,
    [reports]
  );
  const completedCount = useMemo(
    () => reports.filter((r) => r.status === 'Selesai').length,
    [reports]
  );
  const nearDueCount = useMemo(
    () => enrichedReports.filter((i) => i.sla.slaState === 'NEAR_DUE').length,
    [enrichedReports]
  );
  const overdueCount = useMemo(
    () => enrichedReports.filter((i) => i.sla.slaState === 'OVERDUE').length,
    [enrichedReports]
  );

  const slaCompliancePercent = useMemo(() => {
    if (enrichedReports.length === 0) return 100;
    const compliant = enrichedReports.filter(
      (i) => i.sla.slaState === 'COMPLETED' || i.sla.slaState === 'NORMAL'
    ).length;
    return Math.round((compliant / enrichedReports.length) * 100);
  }, [enrichedReports]);

  // Action Queue for Operator Dashboard ("Perlu Tindakan Segera")
  const urgentActionQueue = useMemo(() => {
    return enrichedReports
      .filter((item) => item.report.status !== 'Selesai')
      .sort((a, b) => {
        const score = (s: typeof a.sla.slaState) =>
          s === 'OVERDUE' ? 3 : s === 'NEAR_DUE' ? 2 : 1;
        return score(b.sla.slaState) - score(a.sla.slaState);
      })
      .slice(0, 8);
  }, [enrichedReports]);

  // Operational Notifications list
  const notifications = useMemo(() => {
    const items: Array<{
      id: string;
      type: 'SURAT' | 'ADUAN' | 'SLA';
      title: string;
      subtitle: string;
      timestamp: string;
      severity: 'high' | 'medium' | 'normal';
      report: CitizenReport;
    }> = [];

    for (const { report, sla } of enrichedReports) {
      if (sla.slaState === 'OVERDUE' || sla.slaState === 'NEAR_DUE') {
        items.push({
          id: `sla-${report.id}`,
          type: 'SLA',
          title:
            sla.slaState === 'OVERDUE'
              ? `Peringatan SLA Terlambat: #${report.ticketCode}`
              : `Mendekati Batas SLA: #${report.ticketCode}`,
          subtitle: `${report.title} — Pemohon/Pelapor: ${report.reporterName} (${report.rw}/${report.rt})`,
          timestamp: report.updatedAt || report.createdAt,
          severity: sla.slaState === 'OVERDUE' ? 'high' : 'medium',
          report,
        });
      }

      if (report.status === 'Menunggu Verifikasi') {
        items.push({
          id: `new-${report.id}`,
          type: sla.isSurat ? 'SURAT' : 'ADUAN',
          title: sla.isSurat
            ? `Pra Registrasi Menunggu Verifikasi: #${report.ticketCode}`
            : `Pengaduan Warga Baru Masuk: #${report.ticketCode}`,
          subtitle: `${report.title} — Diajukan oleh ${report.reporterName} (${report.rw}/${report.rt})`,
          timestamp: report.createdAt,
          severity: report.urgency === 'Darurat' ? 'high' : 'normal',
          report,
        });
      }
    }

    return items;
  }, [enrichedReports]);

  const handleSaveTaskAssignment = async (rep: CitizenReport) => {
    setSavingTaskId(rep.id);
    setTaskFeedback('');
    const nextStatus: ReportStatus =
      rep.status === 'Menunggu Verifikasi' ? 'Sedang Ditangani' : rep.status;
    const notePrefix = `[Penugasan Operator ${adminOfficerName} - ${getRealtimeDateTimeString()}]: Ditugaskan ke ${selectedTeam}.`;
    const mergedNote = taskNote.trim()
      ? `${notePrefix} Instruksi: ${taskNote.trim()}`
      : notePrefix;

    await onUpdateReport(rep.id, {
      status: nextStatus,
      assignedTeam: selectedTeam,
      responseNote: mergedNote,
    });

    setSavingTaskId(null);
    setEditingTaskId(null);
    setTaskNote('');
    setTaskFeedback(`Tiket #${rep.ticketCode} berhasil ditugaskan ke ${selectedTeam}.`);
  };

  // ================= 1. DASHBOARD OPERATOR VIEW =================
  if (activeSection === 'dashboard') {
    return (
      <div className="space-y-6">
        {/* Top Operator Welcome & SLA Banner */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                <span className="font-bold text-[#0277BD] uppercase tracking-wider">
                  PUSAT KENDALI OPERASIONAL FRONT-OFFICE
                </span>
                <span aria-hidden="true">·</span>
                <span>Petugas Aktif: {adminOfficerName}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#0D3868] tracking-tight">
                Dashboard Admin Operator Pelayanan Kelurahan
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-slate-600">
                Pantau antrean Pra Registrasi Online, Pengaduan Warga, delegasi penugasan seksi, dan
                kepatuhan SLA secara real-time.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => onSelectSidebarItem('pra_registrasi')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0D3868] hover:bg-[#072647] text-white text-xs font-bold transition cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 text-sky-300" />
                <span>Buka Pra Registrasi ({suratReports.length})</span>
              </button>
              <button
                type="button"
                onClick={() => onSelectSidebarItem('pengaduan')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0277BD] hover:bg-[#01579B] text-white text-xs font-bold transition cursor-pointer"
              >
                <AlertCircle className="w-3.5 h-3.5 text-amber-300" />
                <span>Buka Pengaduan ({aduanReports.length})</span>
              </button>
            </div>
          </div>

          {/* 6 Operational KPI Cards */}
          <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
            <button
              type="button"
              onClick={() => onSelectSidebarItem('pra_registrasi')}
              className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-sky-50/60 hover:border-sky-300 text-left transition cursor-pointer"
            >
              <div className="text-[11px] font-semibold text-slate-500">Pra Registrasi Masuk</div>
              <div className="mt-1.5 text-2xl font-extrabold text-[#0D3868] tabular-nums">
                {suratReports.length + praRegistrasiList.length}
              </div>
              <div className="mt-1 text-[11px] text-slate-500">13 Layanan Surat</div>
            </button>

            <button
              type="button"
              onClick={() => onSelectSidebarItem('pra_registrasi')}
              className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 hover:bg-amber-50 text-left transition cursor-pointer"
            >
              <div className="text-[11px] font-semibold text-amber-900">Menunggu Verifikasi</div>
              <div className="mt-1.5 text-2xl font-extrabold text-amber-700 tabular-nums">
                {waitingVerificationCount}
              </div>
              <div className="mt-1 text-[11px] text-amber-800">Butuh cek berkas</div>
            </button>

            <button
              type="button"
              onClick={() => onSelectSidebarItem('pengaduan')}
              className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-sky-50/60 hover:border-sky-300 text-left transition cursor-pointer"
            >
              <div className="text-[11px] font-semibold text-slate-500">Pengaduan Online</div>
              <div className="mt-1.5 text-2xl font-extrabold text-[#0277BD] tabular-nums">
                {aduanReports.length + pengaduanList.length}
              </div>
              <div className="mt-1 text-[11px] text-slate-500">{inProgressCount} ditangani</div>
            </button>

            <button
              type="button"
              onClick={() => onSelectSidebarItem('sla')}
              className="p-4 rounded-xl border border-orange-200 bg-orange-50/50 hover:bg-orange-50 text-left transition cursor-pointer"
            >
              <div className="text-[11px] font-semibold text-orange-900">Mendekati SLA</div>
              <div className="mt-1.5 text-2xl font-extrabold text-orange-700 tabular-nums">
                {nearDueCount}
              </div>
              <div className="mt-1 text-[11px] text-orange-800">Sisa waktu &lt; 25%</div>
            </button>

            <button
              type="button"
              onClick={() => onSelectSidebarItem('sla')}
              className="p-4 rounded-xl border border-red-200 bg-red-50/50 hover:bg-red-50 text-left transition cursor-pointer"
            >
              <div className="text-[11px] font-semibold text-red-900">Melewati SLA</div>
              <div className="mt-1.5 text-2xl font-extrabold text-red-700 tabular-nums">
                {overdueCount}
              </div>
              <div className="mt-1 text-[11px] text-red-800">Kepatuhan {slaCompliancePercent}%</div>
            </button>

            <button
              type="button"
              onClick={() => onSelectSidebarItem('penugasan')}
              className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50 text-left transition cursor-pointer"
            >
              <div className="text-[11px] font-semibold text-emerald-900">Tuntas Selesai</div>
              <div className="mt-1.5 text-2xl font-extrabold text-emerald-700 tabular-nums">
                {completedCount}
              </div>
              <div className="mt-1 text-[11px] text-emerald-800">Terverifikasi resmi</div>
            </button>
          </div>
        </div>

        {/* Antrean Perlu Tindakan Segera (Action Queue) */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="px-5 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-[#0D3868]">
                Antrean Prioritas — Perlu Tindakan Operator Segera ({urgentActionQueue.length})
              </h3>
              <p className="text-xs text-slate-500">
                Diurutkan otomatis berdasarkan tenggat waktu SLA dan status verifikasi berkas
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onSelectSidebarItem('penugasan')}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition cursor-pointer"
              >
                Kelola Penugasan
              </button>
              <button
                type="button"
                onClick={() => onSelectSidebarItem('sla')}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition cursor-pointer"
              >
                Monitor SLA
              </button>
            </div>
          </div>

          <div className="divide-y divide-slate-200">
            {urgentActionQueue.length === 0 ? (
              <div className="p-8 text-center text-xs sm:text-sm text-slate-500">
                Seluruh tiket permohonan dan pengaduan telah selesai ditindaklanjuti.
              </div>
            ) : (
              urgentActionQueue.map(({ report, sla }) => (
                <div
                  key={report.id}
                  className="p-4 sm:px-6 flex flex-col lg:flex-row lg:items-center justify-between gap-3 hover:bg-slate-50/80 transition"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span className="font-mono font-bold text-[#0D3868]">#{report.ticketCode}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-semibold text-slate-700">
                        {sla.isSurat ? 'Pra Registrasi Surat' : 'Pengaduan Warga'}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span
                        className={
                          sla.slaState === 'OVERDUE'
                            ? 'font-bold text-red-600'
                            : sla.slaState === 'NEAR_DUE'
                            ? 'font-bold text-amber-600'
                            : 'text-emerald-700 font-medium'
                        }
                      >
                        {sla.slaState === 'OVERDUE'
                          ? `Terlambat ${Math.abs(sla.remainingHours)} jam`
                          : sla.slaState === 'NEAR_DUE'
                          ? `Sisa SLA ${sla.remainingHours} jam`
                          : `SLA Aman (${sla.remainingHours} jam)`}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>Status: {report.status}</span>
                    </div>
                    <div className="mt-1 text-sm font-bold text-slate-900 truncate">
                      {report.title}
                    </div>
                    <div className="mt-0.5 text-xs text-slate-600">
                      Pemohon/Pelapor: <strong>{report.reporterName}</strong> ({report.rw} / {report.rt}) · Unit:{' '}
                      <span className="text-slate-700 font-medium">{report.assignedTeam || 'Belum Ditugaskan'}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => onOpenReportDetail(report)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0D3868] hover:bg-[#072647] text-white text-xs font-bold transition cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Periksa &amp; Verifikasi</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onSelectSidebarItem(sla.isSurat ? 'pra_registrasi' : 'pengaduan');
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition cursor-pointer"
                    >
                      <span>Buka Meja Kerja</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  // ================= 2. PENUGASAN & DISPOSISI PETUGAS VIEW =================
  if (activeSection === 'penugasan') {
    const filteredTasks = enrichedReports.filter(({ report }) => {
      if (assignFilterSeksi !== 'ALL' && report.assignedTeam !== assignFilterSeksi) return false;
      if (assignFilterStatus !== 'ALL' && report.status !== assignFilterStatus) return false;
      if (assignSearch.trim()) {
        const q = assignSearch.toLowerCase();
        const match =
          report.ticketCode.toLowerCase().includes(q) ||
          report.title.toLowerCase().includes(q) ||
          report.reporterName.toLowerCase().includes(q) ||
          (report.assignedTeam || '').toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });

    return (
      <div className="space-y-5">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-xs font-bold text-[#0277BD] uppercase tracking-wider">
                DELEGASI TUGAS &amp; DISPOSISI SEKSI / PETUGAS LAPANGAN
              </div>
              <h2 className="mt-0.5 text-xl font-extrabold text-[#0D3868]">
                Manajemen Penugasan Pelayanan &amp; Penanganan Aduan
              </h2>
              <p className="mt-1 text-xs text-slate-600">
                Delegasikan berkas Pra Registrasi atau tiket Pengaduan ke Seksi Pemerintahan,
                Pemberdayaan, Kebersihan, maupun Tim Reaksi Cepat beserta instruksi kerja.
              </p>
            </div>
          </div>

          {taskFeedback && (
            <div className="mt-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs font-semibold flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{taskFeedback}</span>
              </div>
              <button
                type="button"
                onClick={() => setTaskFeedback('')}
                className="text-emerald-800 font-bold hover:underline cursor-pointer"
              >
                Tutup
              </button>
            </div>
          )}

          {/* Filter Bar */}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={assignSearch}
                onChange={(e) => setAssignSearch(e.target.value)}
                placeholder="Cari nomor tiket, pemohon, atau unit..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:border-[#0D3868] focus:outline-none"
              />
            </div>

            <select
              value={assignFilterSeksi}
              onChange={(e) => setAssignFilterSeksi(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 bg-white focus:border-[#0D3868] focus:outline-none"
            >
              <option value="ALL">Semua Seksi / Tim Penanganan</option>
              {SEKSI_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            <select
              value={assignFilterStatus}
              onChange={(e) => setAssignFilterStatus(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 bg-white focus:border-[#0D3868] focus:outline-none"
            >
              <option value="ALL">Semua Status Penugasan</option>
              <option value="Menunggu Verifikasi">Menunggu Penugasan / Konfirmasi</option>
              <option value="Sedang Ditangani">Sedang Berjalan di Seksi/Lapangan</option>
              <option value="Selesai">Selesai Dilaporkan</option>
            </select>
          </div>
        </div>

        {/* Task List */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs divide-y divide-slate-200">
          {filteredTasks.length === 0 ? (
            <div className="p-8 text-center text-xs sm:text-sm text-slate-500">
              Tidak ditemukan data penugasan yang sesuai filter.
            </div>
          ) : (
            filteredTasks.map(({ report, sla }) => {
              const isEditing = editingTaskId === report.id;
              const seksiDefault = getLayananSeksiInfo(
                report.documentCode || report.serviceSubItemId,
                report.title
              ).seksiName;

              return (
                <div key={report.id} className="p-4 sm:p-5 space-y-3 hover:bg-slate-50/60 transition">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span className="font-mono font-bold text-[#0D3868]">#{report.ticketCode}</span>
                        <span aria-hidden="true">·</span>
                        <span>{sla.isSurat ? 'Pelayanan Surat' : 'Pengaduan Lapangan'}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-semibold text-slate-800">{report.status}</span>
                        <span aria-hidden="true">·</span>
                        <span>{report.createdAt}</span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900">{report.title}</h4>
                      <div className="text-xs text-slate-600">
                        Warga: <strong>{report.reporterName}</strong> ({report.rw}/{report.rt}) · Unit Saat Ini:{' '}
                        <strong className="text-[#0D3868]">
                          {report.assignedTeam || seksiDefault}
                        </strong>
                      </div>
                      {report.responseNote && (
                        <div className="text-xs text-slate-500 italic">
                          Catatan Terakhir: "{report.responseNote}"
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          if (isEditing) {
                            setEditingTaskId(null);
                          } else {
                            setEditingTaskId(report.id);
                            setSelectedTeam(report.assignedTeam || seksiDefault || SEKSI_OPTIONS[0]);
                            setTaskNote('');
                          }
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0D3868] hover:bg-[#072647] text-white text-xs font-bold transition cursor-pointer"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>{isEditing ? 'Tutup Form' : 'Tugaskan / Disposisi'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onOpenReportDetail(report)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Detail</span>
                      </button>
                    </div>
                  </div>

                  {isEditing && (
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Pilih Seksi / Petugas Tujuan Penugasan
                          </label>
                          <select
                            value={selectedTeam}
                            onChange={(e) => setSelectedTeam(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs text-slate-900"
                          >
                            {SEKSI_OPTIONS.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Instruksi Kerja / Catatan Penugasan
                          </label>
                          <input
                            type="text"
                            value={taskNote}
                            onChange={(e) => setTaskNote(e.target.value)}
                            placeholder="Contoh: Segera verifikasi berkas KTP/KK atau cek lokasi RT 02..."
                            className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs text-slate-900"
                          />
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-end gap-2">
                        {whatsappRecipients.filter((w) => w.isActive).length > 0 && (
                          <a
                            href={buildWhatsAppUrl(
                              normalizeWhatsAppPhone(
                                whatsappRecipients.find((w) => w.isActive)?.phoneNumber || ''
                              ),
                              `Halo Petugas ${selectedTeam}, mohon tindak lanjuti Penugasan Tiket #${report.ticketCode} (${report.title}) a.n. ${report.reporterName} (${report.rw}/${report.rt}). Instruksi: ${taskNote || 'Segera diproses sesuai SLA.'}`
                            )}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#128C7E] hover:bg-[#075E54] text-white text-xs font-bold transition"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>Kirim WA ke Petugas</span>
                          </a>
                        )}
                        <button
                          type="button"
                          disabled={savingTaskId === report.id}
                          onClick={() => handleSaveTaskAssignment(report)}
                          className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#1C8237] hover:bg-[#146329] text-white text-xs font-bold transition cursor-pointer disabled:opacity-50"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>
                            {savingTaskId === report.id ? 'Menyimpan...' : 'Simpan & Kirim Penugasan'}
                          </span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  }

  // ================= 3. MONITORING SLA VIEW =================
  if (activeSection === 'sla') {
    const filteredSla = enrichedReports.filter(({ report, sla }) => {
      if (slaFilter !== 'ALL' && sla.slaState !== slaFilter) return false;
      if (slaTypeFilter === 'SURAT' && !sla.isSurat) return false;
      if (slaTypeFilter === 'ADUAN' && sla.isSurat) return false;
      if (slaSearch.trim()) {
        const q = slaSearch.toLowerCase();
        if (
          !report.ticketCode.toLowerCase().includes(q) &&
          !report.title.toLowerCase().includes(q) &&
          !report.reporterName.toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      return true;
    });

    return (
      <div className="space-y-5">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="text-xs font-bold text-[#0277BD] uppercase tracking-wider">
                SERVICE LEVEL AGREEMENT (SLA) &amp; KEPATUHAN WAKTU LAYANAN
              </div>
              <h2 className="mt-0.5 text-xl font-extrabold text-[#0D3868]">
                Monitoring SLA Pelayanan Surat &amp; Penanganan Pengaduan
              </h2>
              <p className="mt-1 text-xs text-slate-600">
                Target standar: Pra Registrasi Surat maksimal 4 Jam Kerja · Pengaduan Darurat &lt; 2
                Jam · Pengaduan Normal &lt; 24 Jam.
              </p>
            </div>

            <div className="px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-right">
              <div className="text-[11px] font-semibold text-slate-500">Indeks Kepatuhan SLA</div>
              <div className="text-2xl font-extrabold text-[#1C8237] tabular-nums">
                {slaCompliancePercent}%
              </div>
              <div className="text-[11px] text-slate-500">Target Kelurahan &ge; 90%</div>
            </div>
          </div>

          {/* SLA Filter Buttons */}
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
              {(
                [
                  { id: 'ALL', label: `Semua (${enrichedReports.length})` },
                  { id: 'OVERDUE', label: `Terlambat / Overdue (${overdueCount})` },
                  { id: 'NEAR_DUE', label: `Mendekati SLA (${nearDueCount})` },
                  {
                    id: 'NORMAL',
                    label: `Aman / Normal (${enrichedReports.filter((i) => i.sla.slaState === 'NORMAL').length})`,
                  },
                  { id: 'COMPLETED', label: `Tuntas (${completedCount})` },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSlaFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    slaFilter === tab.id
                      ? 'bg-[#0D3868] text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <select
                value={slaTypeFilter}
                onChange={(e) => setSlaTypeFilter(e.target.value as any)}
                className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs text-slate-800 bg-white"
              >
                <option value="ALL">Semua Jenis Tiket</option>
                <option value="SURAT">Pra Registrasi Surat</option>
                <option value="ADUAN">Pengaduan Online</option>
              </select>
              <input
                type="text"
                value={slaSearch}
                onChange={(e) => setSlaSearch(e.target.value)}
                placeholder="Cari tiket..."
                className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs text-slate-900"
              />
            </div>
          </div>
        </div>

        {/* SLA Table */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase">
                  <th className="py-3 px-4">Tiket &amp; Jenis</th>
                  <th className="py-3 px-4">Pemohon / Pelapor</th>
                  <th className="py-3 px-4">Target SLA</th>
                  <th className="py-3 px-4">Status Waktu</th>
                  <th className="py-3 px-4">Status Tiket</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs">
                {filteredSla.map(({ report, sla }) => (
                  <tr key={report.id} className="hover:bg-slate-50/80">
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-bold text-[#0D3868]">#{report.ticketCode}</div>
                      <div className="font-semibold text-slate-900 line-clamp-1">{report.title}</div>
                      <div className="text-[11px] text-slate-500">
                        {sla.isSurat ? 'Pra Registrasi Online' : `Pengaduan (${report.urgency})`}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-800">{report.reporterName}</div>
                      <div className="text-slate-500">
                        {report.rw} / {report.rt}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 tabular-nums">
                      <div className="font-bold text-slate-800">{sla.targetHours} Jam</div>
                      <div className="text-slate-500">Berjalan: {sla.ageHours} jam</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={
                          sla.slaState === 'OVERDUE'
                            ? 'font-bold text-red-600'
                            : sla.slaState === 'NEAR_DUE'
                            ? 'font-bold text-amber-600'
                            : sla.slaState === 'COMPLETED'
                            ? 'font-bold text-emerald-700'
                            : 'font-semibold text-sky-700'
                        }
                      >
                        {sla.slaState === 'OVERDUE'
                          ? `OVERDUE (-${Math.abs(sla.remainingHours)} jam)`
                          : sla.slaState === 'NEAR_DUE'
                          ? `NEAR DUE (Sisa ${sla.remainingHours} jam)`
                          : sla.slaState === 'COMPLETED'
                          ? 'SELESAI TEPAT WAKTU'
                          : `NORMAL (Sisa ${sla.remainingHours} jam)`}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-700">{report.status}</td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => onOpenReportDetail(report)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#0D3868] hover:bg-[#072647] text-white text-xs font-bold transition cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Tindak Lanjut</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // ================= 4. NOTIFIKASI OPERASIONAL VIEW =================
  if (activeSection === 'notifikasi') {
    const filteredNotifs = notifications.filter((n) => {
      const isRead = readNotifIds.includes(n.id);
      if (notifFilter === 'UNREAD' && isRead) return false;
      if (notifFilter === 'SLA' && n.type !== 'SLA') return false;
      if (notifFilter === 'SURAT' && n.type !== 'SURAT') return false;
      if (notifFilter === 'ADUAN' && n.type !== 'ADUAN') return false;
      return true;
    });

    const unreadCount = notifications.filter((n) => !readNotifIds.includes(n.id)).length;

    return (
      <div className="space-y-5">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-xs font-bold text-[#0277BD] uppercase tracking-wider">
                PUSAT PEMBERITAHUAN &amp; ALERT OPERASIONAL REAL-TIME
              </div>
              <h2 className="mt-0.5 text-xl font-extrabold text-[#0D3868]">
                Notifikasi Antrean Layanan, Pengaduan &amp; Peringatan SLA ({unreadCount} Belum Dibaca)
              </h2>
              <p className="mt-1 text-xs text-slate-600">
                Klik pada item notifikasi untuk langsung membuka berkas pemohon atau tiket pengaduan
                terkait.
              </p>
            </div>

            <button
              type="button"
              onClick={() => markAllNotifsRead(notifications.map((n) => n.id))}
              className="self-start sm:self-center px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 transition cursor-pointer"
            >
              Tandai Semua Sudah Dibaca
            </button>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-xl w-fit">
            {(
              [
                { id: 'ALL', label: `Semua (${notifications.length})` },
                { id: 'UNREAD', label: `Belum Dibaca (${unreadCount})` },
                { id: 'SLA', label: 'Peringatan SLA' },
                { id: 'SURAT', label: 'Pra Registrasi' },
                { id: 'ADUAN', label: 'Pengaduan' },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setNotifFilter(t.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  notifFilter === t.id
                    ? 'bg-[#0D3868] text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs divide-y divide-slate-200">
          {filteredNotifs.length === 0 ? (
            <div className="p-8 text-center text-xs sm:text-sm text-slate-500">
              Tidak ada notifikasi pada kategori ini.
            </div>
          ) : (
            filteredNotifs.map((n) => {
              const isRead = readNotifIds.includes(n.id);
              return (
                <div
                  key={n.id}
                  onClick={() => {
                    markNotifRead(n.id);
                    onOpenReportDetail(n.report);
                  }}
                  className={`p-4 sm:px-6 flex items-start justify-between gap-4 cursor-pointer transition ${
                    isRead ? 'bg-white hover:bg-slate-50' : 'bg-sky-50/40 hover:bg-sky-50/80'
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                        n.severity === 'high'
                          ? 'bg-red-100 text-red-700'
                          : n.type === 'SURAT'
                          ? 'bg-sky-100 text-[#0D3868]'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {n.type === 'SLA' ? (
                        <Clock className="w-4 h-4" />
                      ) : n.type === 'SURAT' ? (
                        <FileText className="w-4 h-4" />
                      ) : (
                        <Bell className="w-4 h-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        {!isRead && <span className="w-2 h-2 rounded-full bg-[#0277BD] shrink-0" />}
                        <h4 className="text-sm font-bold text-slate-900">{n.title}</h4>
                      </div>
                      <p className="mt-0.5 text-xs text-slate-600">{n.subtitle}</p>
                      <div className="mt-1 text-[11px] text-slate-400">{n.timestamp}</div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      markNotifRead(n.id);
                      onOpenReportDetail(n.report);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-[#0D3868] hover:text-white text-slate-700 text-xs font-bold transition shrink-0 cursor-pointer"
                  >
                    Buka Tiket
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  }

  // ================= 5. PENGATURAN & MODUL KELURAHAN HUB =================
  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs">
        <div className="text-xs font-bold text-[#0277BD] uppercase tracking-wider">
          PENGATURAN SISTEM &amp; KONFIGURASI MODUL KELURAHAN PANAIKANG
        </div>
        <h2 className="mt-0.5 text-xl font-extrabold text-[#0D3868]">
          Pusat Pengaturan Operasional, Hak Akses &amp; Modul Kewilayahan
        </h2>
        <p className="mt-1 text-xs text-slate-600">
          Pilih salah satu modul pengaturan di bawah ini untuk mengelola profil kelurahan, akun
          admin/warga, WhatsApp Gateway, serta basis data lingkungan RT/RW.
        </p>

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {[
            {
              tab: 'kelola_admin_warga',
              title: 'Kelola Admin, Whitelist & Parameter User',
              desc: 'Atur hak akses RBAC, verifikasi Google Admin, dan visibilitas menu warga',
              icon: <Users className="w-5 h-5 text-indigo-700" />,
            },
            {
              tab: 'whatsapp_gateway',
              title: 'Pengaturan WhatsApp Gateway (Fonnte)',
              desc: 'Kelola token perangkat, daftar nomor pejabat penerima, dan uji kirim WA',
              icon: <MessageCircle className="w-5 h-5 text-[#128C7E]" />,
            },
            {
              tab: 'profil',
              title: 'Profil Kelurahan, Pejabat SOTK & Visi Misi',
              desc: 'Perbarui foto & biodata Lurah, struktur perangkat kelurahan, dan kontak kantor',
              icon: <Building2 className="w-5 h-5 text-[#0D3868]" />,
            },
            {
              tab: 'rtrw',
              title: 'Basis Data 7 RW / 62 RT & Siskamling',
              desc: 'Kelola daftar ketua RT/RW, nomor telepon, dan jadwal ronda malam',
              icon: <ShieldCheck className="w-5 h-5 text-emerald-700" />,
            },
            {
              tab: 'sampah',
              title: 'Pengelolaan Sampah (BSU, Teba & Biopori)',
              desc: 'Kelola 12 Bank Sampah Unit, log timbangan, Teba Modern, dan Biopori',
              icon: <Recycle className="w-5 h-5 text-amber-600" />,
            },
            {
              tab: 'urban_farming',
              title: 'Urban Farming & Permohonan Bibit',
              desc: 'Kelola titik kebun lorong produktif dan persetujuan bibit tanaman warga',
              icon: <Sprout className="w-5 h-5 text-emerald-600" />,
            },
            {
              tab: 'kerjabakti',
              title: 'Jadwal & Dokumentasi Kerja Bakti',
              desc: 'Atur jadwal gotong royong Jumat ASRI dan dokumentasi kegiatan',
              icon: <Calendar className="w-5 h-5 text-purple-700" />,
            },
            {
              tab: 'info',
              title: 'Informasi Kelurahan & Feed Instagram',
              desc: 'Publikasi berita kelurahan dan sinkronisasi @kelurahan.panaikang',
              icon: <Newspaper className="w-5 h-5 text-emerald-700" />,
            },
            {
              tab: 'traffic',
              title: 'Traffic Web & Analitik Pengunjung',
              desc: 'Pantau statistik kunjungan warga dan perangkat pengguna secara live',
              icon: <Activity className="w-5 h-5 text-cyan-700" />,
            },
          ].map((item) => (
            <button
              key={item.tab}
              type="button"
              onClick={() => onOpenAdminModuleTab(item.tab)}
              className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-white hover:border-[#0D3868] text-left transition flex items-start gap-3.5 cursor-pointer shadow-2xs"
            >
              <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0">
                {item.icon}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-extrabold text-[#0D3868]">{item.title}</div>
                <p className="mt-1 text-[11px] text-slate-600 leading-relaxed">{item.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
