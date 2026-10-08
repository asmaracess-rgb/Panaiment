import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  AlertCircle,
  SlidersHorizontal,
  UserCheck,
  FileSpreadsheet,
  TrendingDown,
  BarChart3,
  Lock,
  ShieldCheck,
  LogIn,
  MessageCircle,
  Phone,
  Printer,
  LayoutGrid,
  ClipboardCheck,
  MapPin,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import {
  CitizenReport,
  ReportStatus,
  WasteBankUnit,
  CleanupEvent,
  AppView,
  KelurahanProfile,
  RwGroup,
  WhatsAppRecipient,
} from '../types';
import {
  INITIAL_MONTHLY_TRENDS,
  INITIAL_KELURAHAN_PROFILE,
  INITIAL_RW_GROUPS,
  INITIAL_WHATSAPP_RECIPIENTS,
} from '../data/initialData';
import { EmblemKotaMakassar, EmblemKelurahanPanaikang } from './Emblems';
import { MonthlyArchivePdfPanel } from './MonthlyArchivePdfPanel';
import { GeneratedPdfResult } from '../utils/monthlyReportPdfGenerator';

interface DashboardLurahViewProps {
  reports: CitizenReport[];
  wasteUnits: WasteBankUnit[];
  cleanupEvents: CleanupEvent[];
  profile?: KelurahanProfile;
  rwGroups?: RwGroup[];
  whatsappRecipients?: WhatsAppRecipient[];
  onUpdateReportStatus: (
    id: string,
    newStatus: ReportStatus,
    assignedTeam: string,
    responseNote: string
  ) => void;
  onNavigate: (view: AppView) => void;
  isEmbeddedInAdmin?: boolean;
  onRedirectToAdminLogin?: () => void;
  onOpenWhatsAppManager?: () => void;
  onPdfDownloaded?: (result: GeneratedPdfResult) => void;
}

const TEAM_OPTIONS = [
  'Satgas Drainase & Kebersihan Kelurahan Panaikang',
  'Armada Motor Sampah Tangkasaki / Fukuda RW',
  'Satgas Ruang Terbuka Hijau & DLH Kota Makassar',
  'Pengurus Bank Sampah Unit & Forum RT/RW',
];

type LurahSubSection = 'semua' | 'disposisi' | 'tren' | 'arsip_pdf';

export const DashboardLurahView: React.FC<DashboardLurahViewProps> = ({
  reports,
  wasteUnits,
  cleanupEvents,
  profile = INITIAL_KELURAHAN_PROFILE,
  rwGroups = INITIAL_RW_GROUPS,
  whatsappRecipients = INITIAL_WHATSAPP_RECIPIENTS,
  onUpdateReportStatus,
  onNavigate,
  isEmbeddedInAdmin = false,
  onRedirectToAdminLogin,
  onOpenWhatsAppManager,
  onPdfDownloaded,
}) => {
  const [activeSection, setActiveSection] = useState<LurahSubSection>('semua');
  const [statusFilter, setStatusFilter] = useState<'Semua' | ReportStatus>('Semua');
  const [rwFilter, setRwFilter] = useState<string>('Semua');
  const [selectedReportId, setSelectedReportId] = useState<string>(reports[0]?.id || '');

  // Recharts Interactive Controls
  const [chartType, setChartType] = useState<'tren' | 'kategori'>('tren');
  const [timeRange, setTimeRange] = useState<'6m' | '10m'>('10m');

  const selectedReport =
    reports.find((r) => r.id === selectedReportId) || reports[0] || null;

  const [editStatus, setEditStatus] = useState<ReportStatus>(
    selectedReport?.status || 'Sedang Ditangani'
  );
  const [editTeam, setEditTeam] = useState<string>(
    selectedReport?.assignedTeam || TEAM_OPTIONS[0]
  );
  const [editNote, setEditNote] = useState<string>(selectedReport?.responseNote || '');
  const [savedBanner, setSavedBanner] = useState(false);

  const handleSelectRow = (rep: CitizenReport) => {
    setSelectedReportId(rep.id);
    setEditStatus(rep.status);
    setEditTeam(rep.assignedTeam);
    setEditNote(rep.responseNote);
    setSavedBanner(false);
  };

  const handleSaveDisposition = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReport) return;
    onUpdateReportStatus(selectedReport.id, editStatus, editTeam, editNote);
    setSavedBanner(true);
  };

  const handleQuickStatusChange = (newStatus: ReportStatus) => {
    setEditStatus(newStatus);
    if (!selectedReport) return;
    onUpdateReportStatus(selectedReport.id, newStatus, editTeam, editNote);
    setSavedBanner(true);
  };

  const totalReports = reports.length;
  const waitingCount = reports.filter((r) => r.status === 'Menunggu Verifikasi').length;
  const inProgressCount = reports.filter((r) => r.status === 'Sedang Ditangani').length;
  const completedCount = reports.filter((r) => r.status === 'Selesai').length;
  const activeWaCount = whatsappRecipients.filter((r) => r.isActive).length;

  const totalOrganik = wasteUnits.reduce((sum, u) => sum + u.organikKg, 0);
  const totalAnorganik = wasteUnits.reduce((sum, u) => sum + u.anorganikKg, 0);
  const totalResidu = wasteUnits.reduce((sum, u) => sum + u.residuKg, 0);
  const totalAllWaste = totalOrganik + totalAnorganik + totalResidu;
  const reductionRate = Math.round(
    ((totalOrganik + totalAnorganik) / Math.max(totalAllWaste, 1)) * 100
  );

  // Dynamically sync the current month (Okt 2026) with live reports state
  const chartData = useMemo(() => {
    const extraReports = Math.max(0, reports.length - 5);
    const liveSelesaiDiff = completedCount - 2;
    const updated = INITIAL_MONTHLY_TRENDS.map((item, idx) => {
      if (idx === INITIAL_MONTHLY_TRENDS.length - 1) {
        const oktTotal = item.totalLaporan + extraReports;
        const oktSelesai = Math.min(oktTotal, Math.max(0, item.selesai + liveSelesaiDiff));
        return {
          ...item,
          totalLaporan: oktTotal,
          selesai: oktSelesai,
          proses: Math.max(0, oktTotal - oktSelesai),
        };
      }
      return item;
    });
    return timeRange === '6m' ? updated.slice(-6) : updated;
  }, [reports.length, completedCount, timeRange]);

  const janTotal = INITIAL_MONTHLY_TRENDS[0].totalLaporan;
  const currentOktTotal = chartData[chartData.length - 1].totalLaporan;
  const dropPercentage = Math.round(((janTotal - currentOktTotal) / janTotal) * 100);

  const filteredReports = reports.filter((r) => {
    const matchStatus = statusFilter === 'Semua' || r.status === statusFilter;
    const matchRw = rwFilter === 'Semua' || r.rw === rwFilter;
    return matchStatus && matchRw;
  });

  // If accessed from the public visitor menu (not inside the Lurah Admin Panel),
  // block regular user access and display the required notice directing Lurah to Admin Login.
  if (!isEmbeddedInAdmin) {
    return (
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-12">
        <button
          type="button"
          onClick={() => onNavigate('beranda')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0D3868] hover:text-[#0277BD] mb-6 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Portal Utama</span>
        </button>

        <div className="bg-white rounded-3xl border-2 border-amber-200/90 shadow-[0_16px_40px_-12px_rgba(13,56,104,0.12)] overflow-hidden">
          <div className="bg-gradient-to-r from-[#0D3868] via-[#0A2E56] to-[#1C8237] px-6 py-8 text-center text-white">
            <div className="inline-flex items-center justify-center gap-4 mb-4">
              <EmblemKotaMakassar className="w-12 h-14" />
              <div className="w-12 h-12 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center">
                <Lock className="w-6 h-6 text-amber-300" />
              </div>
              <EmblemKelurahanPanaikang className="w-12 h-14" />
            </div>
            <div className="inline-flex items-center gap-1.5 text-amber-200 text-xs font-bold uppercase tracking-wider mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Akses Terbatas Khusus Pimpinan Kelurahan</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Menu Ini hanya dapat diakses oleh Lurah
            </h1>
          </div>

          <div className="p-6 sm:p-10 text-center max-w-2xl mx-auto space-y-6">
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 text-sm font-semibold leading-relaxed">
              Menu Ini hanya dapat diakses oleh Lurah dan tidak dapat diakses oleh pengguna biasa.
            </div>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Halaman <strong>Dashboard Eksekutif Lurah Panaikang</strong> memuat kendali mutu
              disposisi laporan warga, evaluasi kinerja wilayah RW/RT, dan statistik eksekutif
              kelurahan. Apabila Bapak/Ibu <strong>Lurah</strong> ingin mengakses menu ini, silakan
              masuk melalui <strong>Menu Login Admin</strong> terlebih dahulu lalu buka tab{' '}
              <strong>Dashboard Lurah</strong>.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  if (onRedirectToAdminLogin) {
                    onRedirectToAdminLogin();
                  } else {
                    onNavigate('admin');
                  }
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#0D3868] hover:bg-[#072647] text-white text-xs sm:text-sm font-bold shadow-sm transition-colors cursor-pointer"
              >
                <LogIn className="w-4 h-4 text-emerald-300" />
                <span>Masuk ke Menu Login Admin (Khusus Lurah)</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('beranda')}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Kembali ke Halaman Utama</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={isEmbeddedInAdmin ? 'space-y-6' : 'mx-auto max-w-6xl px-4 sm:px-6 py-8 space-y-6'}>
      {/* ================= HEADER & SUB-MENU NAVIGASI DASHBOARD LURAH ================= */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            {!isEmbeddedInAdmin && (
              <button
                type="button"
                onClick={() => onNavigate('beranda')}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-900 mb-2 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Kembali ke Portal Utama</span>
              </button>
            )}
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-1">
              <span className="inline-flex items-center gap-1 font-bold text-[#1C8237]">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>AKSES EKSKLUSIF LURAH PANAIKANG</span>
              </span>
              <span aria-hidden="true">·</span>
              <span>Pimpinan: {profile.lurahName}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#0D3868] tracking-tight">
              Dashboard Eksekutif Lurah Panaikang
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-600">
              Kendali mutu penanganan laporan warga, disposisi Satgas Kebersihan, pengunduhan arsip
              fisik PDF bulanan, serta evaluasi kinerja lingkungan RW 01 – RW 06.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start lg:self-center shrink-0">
            {onOpenWhatsAppManager && (
              <button
                type="button"
                onClick={onOpenWhatsAppManager}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#128C7E] hover:bg-[#075E54] text-white text-xs font-bold transition-colors cursor-pointer whitespace-nowrap"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Kelola Nomor WA ({activeWaCount} Aktif)</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => onNavigate('peta')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-800 transition-colors cursor-pointer whitespace-nowrap"
            >
              <MapPin className="w-3.5 h-3.5 text-[#00838F]" />
              <span>Peta Sebaran Titik</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('sampah')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#2E7D32] hover:bg-[#1B5E20] text-white text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Rekap Data Sampah</span>
            </button>
          </div>
        </div>

        {/* Structured Sub-Menu Bar inside Dashboard Lurah */}
        <div className="mt-5 pt-4 border-t border-slate-200">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
            Menu Tampilan & Modul Eksekutif Lurah
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => setActiveSection('semua')}
              className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-colors cursor-pointer ${
                activeSection === 'semua'
                  ? 'bg-[#2E7D32] border-[#2E7D32] text-white shadow-xs'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <LayoutGrid
                className={`w-4 h-4 shrink-0 ${
                  activeSection === 'semua' ? 'text-emerald-200' : 'text-[#2E7D32]'
                }`}
              />
              <div className="min-w-0">
                <div className="text-xs font-bold truncate">Semua Modul Terpadu</div>
                <div
                  className={`text-[11px] truncate ${
                    activeSection === 'semua' ? 'text-emerald-100' : 'text-slate-500'
                  }`}
                >
                  Ringkasan penuh berurutan
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setActiveSection('disposisi')}
              className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-colors cursor-pointer ${
                activeSection === 'disposisi'
                  ? 'bg-[#0D3868] border-[#0D3868] text-white shadow-xs'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <ClipboardCheck
                className={`w-4 h-4 shrink-0 ${
                  activeSection === 'disposisi' ? 'text-sky-200' : 'text-[#0D3868]'
                }`}
              />
              <div className="min-w-0">
                <div className="text-xs font-bold truncate">01. Disposisi & Laporan</div>
                <div
                  className={`text-[11px] truncate ${
                    activeSection === 'disposisi' ? 'text-sky-100' : 'text-slate-500'
                  }`}
                >
                  {totalReports} laporan & koordinasi WA
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setActiveSection('tren')}
              className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-colors cursor-pointer ${
                activeSection === 'tren'
                  ? 'bg-[#0277BD] border-[#0277BD] text-white shadow-xs'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <BarChart3
                className={`w-4 h-4 shrink-0 ${
                  activeSection === 'tren' ? 'text-sky-200' : 'text-[#0277BD]'
                }`}
              />
              <div className="min-w-0">
                <div className="text-xs font-bold truncate">02. Grafik Tren & Kinerja RW</div>
                <div
                  className={`text-[11px] truncate ${
                    activeSection === 'tren' ? 'text-sky-100' : 'text-slate-500'
                  }`}
                >
                  Statistik 2026 & evaluasi BSU
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setActiveSection('arsip_pdf')}
              className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-colors cursor-pointer ${
                activeSection === 'arsip_pdf'
                  ? 'bg-[#1C8237] border-[#1C8237] text-white shadow-xs'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Printer
                className={`w-4 h-4 shrink-0 ${
                  activeSection === 'arsip_pdf' ? 'text-emerald-200' : 'text-[#1C8237]'
                }`}
              />
              <div className="min-w-0">
                <div className="text-xs font-bold truncate">03. Arsip Laporan PDF</div>
                <div
                  className={`text-[11px] truncate ${
                    activeSection === 'arsip_pdf' ? 'text-emerald-100' : 'text-slate-500'
                  }`}
                >
                  Cetak dokumen bulanan A4
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* ================= KPI METRIC STRIP (4 UNIFORM CARDS) ================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Total Laporan Warga</span>
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          </div>
          <div className="mt-2 text-3xl font-extrabold text-slate-900 font-mono-num">
            {totalReports}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            <span className="font-semibold text-amber-700 tabular-nums">{waitingCount}</span>{' '}
            menunggu verifikasi
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Sedang Ditangani Satgas</span>
            <Clock className="w-4 h-4 text-sky-600 shrink-0" />
          </div>
          <div className="mt-2 text-3xl font-extrabold text-sky-700 font-mono-num">
            {inProgressCount}
          </div>
          <div className="mt-1 text-xs text-slate-500">Target respon lapangan &lt; 6 jam</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Laporan Tuntas Selesai</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          </div>
          <div className="mt-2 text-3xl font-extrabold text-emerald-700 font-mono-num">
            {completedCount}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Rasio tuntas{' '}
            <span className="font-semibold text-emerald-700 tabular-nums">
              {Math.round((completedCount / Math.max(totalReports, 1)) * 100)}%
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Reduksi Sampah ke TPA</span>
            <FileSpreadsheet className="w-4 h-4 text-[#0D3868] shrink-0" />
          </div>
          <div className="mt-2 text-3xl font-extrabold text-[#0D3868] font-mono-num">
            {reductionRate}%
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Daur ulang & kompos{' '}
            <span className="font-mono-num font-semibold text-slate-800">
              {totalOrganik + totalAnorganik} kg
            </span>
          </div>
        </div>
      </div>

      {/* ================= MODUL 01: DISPOSISI LAPORAN WARGA & KOORDINASI WHATSAPP ================= */}
      {(activeSection === 'semua' || activeSection === 'disposisi') && (
        <div className="space-y-4">
          {/* Integrated WhatsApp Coordination Strip */}
          {onOpenWhatsAppManager && (
            <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#128C7E] text-white flex items-center justify-center shrink-0">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[11px] font-bold text-[#128C7E] uppercase tracking-wider">
                    01. Disposisi & Koordinasi Tim Penerima Laporan (Khusus Admin)
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-[#0D3868] mt-0.5">
                    Distribusi Otomatis ke {activeWaCount} Nomor WhatsApp Terdaftar
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Nomor telepon, nama, dan jabatan penerima disembunyikan dari halaman warga dan
                    hanya ditampilkan di Halaman Admin agar tim penerima dapat saling berkoordinasi.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onOpenWhatsAppManager}
                className="self-start sm:self-center inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#128C7E] hover:bg-[#075E54] text-white text-xs font-bold cursor-pointer whitespace-nowrap shrink-0"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Lihat Daftar Nomor & Koordinasi WA</span>
              </button>
            </div>
          )}

          {/* Main Workspace: Left Table + Right Disposition Inspector */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: High-Density Report Management Table */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col">
              <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="text-[11px] font-bold text-[#1C8237]">
                    01. DAFTAR PENGADUAN LINGKUNGAN WARGA
                  </div>
                  <h2 className="text-base font-bold text-[#0D3868] mt-0.5">
                    Daftar Laporan & Status Penanganan ({filteredReports.length})
                  </h2>
                  <p className="text-xs text-slate-500">
                    Klik baris laporan untuk memperbarui disposisi petugas atau status penyelesaian
                  </p>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-center">
                  <select
                    value={rwFilter}
                    onChange={(e) => setRwFilter(e.target.value)}
                    className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none"
                  >
                    <option value="Semua">Semua RW</option>
                    <option value="RW 01">RW 01</option>
                    <option value="RW 02">RW 02</option>
                    <option value="RW 03">RW 03</option>
                    <option value="RW 04">RW 04</option>
                    <option value="RW 05">RW 05</option>
                    <option value="RW 06">RW 06</option>
                  </select>
                </div>
              </div>

              {/* Interactive Status Filter Bar */}
              <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center gap-1.5 overflow-x-auto">
                {(['Semua', 'Menunggu Verifikasi', 'Sedang Ditangani', 'Selesai'] as const).map(
                  (st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setStatusFilter(st)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                        statusFilter === st
                          ? 'bg-[#2E7D32] text-white'
                          : 'text-slate-600 hover:bg-slate-200/70'
                      }`}
                    >
                      {st}
                    </button>
                  )
                )}
              </div>

              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-[11px] font-semibold text-slate-500 bg-slate-50/50">
                      <th className="py-3 px-4">Tiket & Waktu</th>
                      <th className="py-3 px-4">Permasalahan & Lokasi</th>
                      <th className="py-3 px-4">Wilayah</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-xs">
                    {filteredReports.map((rep) => {
                      const isSelected = selectedReport?.id === rep.id;
                      return (
                        <tr
                          key={rep.id}
                          onClick={() => handleSelectRow(rep)}
                          className={`cursor-pointer transition-colors ${
                            isSelected ? 'bg-emerald-50/70' : 'hover:bg-slate-50'
                          }`}
                        >
                          <td className="py-3.5 px-4 align-top whitespace-nowrap">
                            <div className="font-mono-num font-bold text-[#0D3868]">
                              {rep.ticketCode}
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono-num mt-0.5">
                              {rep.createdAt.split('·')[0]}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 align-top">
                            <div className="font-semibold text-slate-900 line-clamp-1">
                              {rep.title}
                            </div>
                            <div className="text-slate-500 mt-0.5 line-clamp-1">
                              {rep.locationName}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 align-top whitespace-nowrap font-semibold text-slate-700">
                            {rep.rw} · {rep.rt}
                          </td>
                          <td className="py-3.5 px-4 align-top whitespace-nowrap">
                            {rep.status === 'Selesai' && (
                              <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Selesai</span>
                              </span>
                            )}
                            {rep.status === 'Sedang Ditangani' && (
                              <span className="inline-flex items-center gap-1 font-semibold text-sky-700">
                                <Clock className="w-3.5 h-3.5" />
                                <span>Ditangani</span>
                              </span>
                            )}
                            {rep.status === 'Menunggu Verifikasi' && (
                              <span className="inline-flex items-center gap-1 font-semibold text-amber-700">
                                <AlertCircle className="w-3.5 h-3.5" />
                                <span>Verifikasi</span>
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right: Disposition & Action Update Panel */}
            <div className="lg:col-span-5">
              {selectedReport ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 h-full flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                      <div>
                        <div className="text-xs text-slate-500 font-mono-num">
                          {selectedReport.ticketCode} · {selectedReport.rw} / {selectedReport.rt}
                        </div>
                        <h3 className="text-base font-bold text-[#0D3868] mt-0.5">
                          Panel Disposisi & Tindak Lanjut Lurah
                        </h3>
                      </div>
                      <SlidersHorizontal className="w-4 h-4 text-slate-400" />
                    </div>

                    <div className="mt-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                      <div className="text-sm font-bold text-slate-900">{selectedReport.title}</div>
                      <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                        {selectedReport.description}
                      </p>
                      <div className="mt-2.5 text-xs text-slate-500">
                        Lokasi:{' '}
                        <span className="font-medium text-slate-800">
                          {selectedReport.locationName}
                        </span>{' '}
                        · Pelapor:{' '}
                        <span className="font-medium text-slate-800">
                          {selectedReport.reporterName}
                        </span>
                      </div>
                    </div>

                    {savedBanner && (
                      <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800">
                        Status dan disposisi laporan {selectedReport.ticketCode} berhasil diperbarui.
                      </div>
                    )}
                  </div>

                  <form onSubmit={handleSaveDisposition} className="mt-5 space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Status Penanganan Laporan (Klik untuk Ubah Instan)
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {(
                          ['Menunggu Verifikasi', 'Sedang Ditangani', 'Selesai'] as ReportStatus[]
                        ).map((st) => (
                          <button
                            key={st}
                            type="button"
                            onClick={() => handleQuickStatusChange(st)}
                            className={`py-2 px-2.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                              editStatus === st
                                ? 'bg-[#2E7D32] text-white border-[#2E7D32]'
                                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {st === 'Menunggu Verifikasi' ? 'Verifikasi' : st}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Unit Pelaksana / Disposisi Satgas
                      </label>
                      <select
                        value={editTeam}
                        onChange={(e) => setEditTeam(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs sm:text-sm text-slate-900 bg-white focus:border-[#2E7D32] focus:outline-none"
                      >
                        {TEAM_OPTIONS.map((team) => (
                          <option key={team} value={team}>
                            {team}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Catatan Instruksi Lurah / Hasil Tindak Lanjut
                      </label>
                      <textarea
                        rows={3}
                        value={editNote}
                        onChange={(e) => setEditNote(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs sm:text-sm text-slate-900 focus:border-[#2E7D32] focus:outline-none"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#2E7D32] hover:bg-[#1B5E20] text-white text-xs sm:text-sm font-bold transition-colors cursor-pointer shadow-xs"
                    >
                      <UserCheck className="w-4 h-4" />
                      <span>Simpan Perubahan & Teruskan ke Satgas</span>
                    </button>
                  </form>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* ================= MODUL 02: GRAFIK TREN & EVALUASI KINERJA RW ================= */}
      {(activeSection === 'semua' || activeSection === 'tren') && (
        <div className="space-y-6">
          {/* Recharts Data Visualization Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-200">
              <div>
                <div className="text-[11px] font-bold text-[#1C8237]">
                  02. ANALISIS PERKEMBANGAN BULANAN KELURAHAN
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <BarChart3 className="w-5 h-5 text-[#2E7D32]" />
                  <h2 className="text-base sm:text-lg font-bold text-[#0D3868]">
                    Visualisasi Tren Laporan Warga & Kebersihan Wilayah (2026)
                  </h2>
                </div>
                <p className="mt-1 text-xs sm:text-sm text-slate-600">
                  Penurunan jumlah titik keluhan bulanan menunjukkan peningkatan kebersihan koridor
                  dan efektivitas kerja bakti RW.
                </p>
              </div>

              {/* Interactive Chart Mode & Period Controls */}
              <div className="flex flex-wrap items-center gap-2 self-start">
                <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setChartType('tren')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                      chartType === 'tren'
                        ? 'bg-[#2E7D32] text-white shadow-xs'
                        : 'text-slate-700 hover:text-slate-900'
                    }`}
                  >
                    Tren Penyelesaian
                  </button>
                  <button
                    type="button"
                    onClick={() => setChartType('kategori')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                      chartType === 'kategori'
                        ? 'bg-[#2E7D32] text-white shadow-xs'
                        : 'text-slate-700 hover:text-slate-900'
                    }`}
                  >
                    Rincian Kategori Masalah
                  </button>
                </div>

                <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setTimeRange('6m')}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                      timeRange === '6m'
                        ? 'bg-[#0D3868] text-white shadow-xs'
                        : 'text-slate-700 hover:text-slate-900'
                    }`}
                  >
                    6 Bulan
                  </button>
                  <button
                    type="button"
                    onClick={() => setTimeRange('10m')}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                      timeRange === '10m'
                        ? 'bg-[#0D3868] text-white shadow-xs'
                        : 'text-slate-700 hover:text-slate-900'
                    }`}
                  >
                    Jan – Okt 2026
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              {/* Chart Canvas (8 cols) */}
              <div className="lg:col-span-8 h-[310px] sm:h-[340px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  {chartType === 'tren' ? (
                    <AreaChart
                      data={chartData}
                      margin={{ top: 10, right: 16, left: -12, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="gradTotal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0284C7" stopOpacity={0.28} />
                          <stop offset="95%" stopColor="#0284C7" stopOpacity={0.02} />
                        </linearGradient>
                        <linearGradient id="gradSelesai" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#16A34A" stopOpacity={0.32} />
                          <stop offset="95%" stopColor="#16A34A" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                      <XAxis
                        dataKey="month"
                        tick={{ fill: '#475569', fontSize: 12, fontWeight: 600 }}
                        axisLine={{ stroke: '#CBD5E1' }}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fill: '#475569', fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                        unit=" lap"
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#FFFFFF',
                          borderColor: '#CBD5E1',
                          borderRadius: '12px',
                          fontSize: '12px',
                          boxShadow: '0 8px 20px -4px rgba(15, 23, 42, 0.1)',
                        }}
                        labelFormatter={(_, payload) =>
                          payload?.[0]?.payload?.fullMonth || ''
                        }
                      />
                      <Legend
                        wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }}
                        iconType="circle"
                      />
                      <Area
                        type="monotone"
                        dataKey="totalLaporan"
                        name="Total Laporan Warga"
                        stroke="#0284C7"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#gradTotal)"
                      />
                      <Area
                        type="monotone"
                        dataKey="selesai"
                        name="Laporan Selesai Ditangani"
                        stroke="#16A34A"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#gradSelesai)"
                      />
                    </AreaChart>
                  ) : (
                    <BarChart
                      data={chartData}
                      margin={{ top: 10, right: 16, left: -12, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                      <XAxis
                        dataKey="month"
                        tick={{ fill: '#475569', fontSize: 12, fontWeight: 600 }}
                        axisLine={{ stroke: '#CBD5E1' }}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fill: '#475569', fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#FFFFFF',
                          borderColor: '#CBD5E1',
                          borderRadius: '12px',
                          fontSize: '12px',
                          boxShadow: '0 8px 20px -4px rgba(15, 23, 42, 0.1)',
                        }}
                        labelFormatter={(_, payload) =>
                          payload?.[0]?.payload?.fullMonth || ''
                        }
                      />
                      <Legend
                        wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }}
                        iconType="circle"
                      />
                      <Bar
                        dataKey="sampahLiar"
                        name="Sampah Liar & TPS"
                        stackId="a"
                        fill="#EF6C00"
                        radius={[0, 0, 0, 0]}
                      />
                      <Bar
                        dataKey="drainase"
                        name="Drainase & Genangan"
                        stackId="a"
                        fill="#0284C7"
                        radius={[0, 0, 0, 0]}
                      />
                      <Bar
                        dataKey="pohonHijau"
                        name="Pohon & Ruang Hijau"
                        stackId="a"
                        fill="#2E7D32"
                        radius={[0, 0, 0, 0]}
                      />
                      <Bar
                        dataKey="fasum"
                        name="Ketertiban & Fasum"
                        stackId="a"
                        fill="#5E35B1"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>

              {/* Executive Insight Summary Panel (4 cols) */}
              <div className="lg:col-span-4 space-y-4 border-t lg:border-t-0 lg:border-l border-slate-200 pt-5 lg:pt-0 lg:pl-6">
                <div>
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                    <TrendingDown className="w-4 h-4" />
                    <span>Analisis Tren Kebersihan Wilayah</span>
                  </div>
                  <div className="mt-1.5 text-2xl font-extrabold text-[#0D3868] font-mono-num">
                    -{dropPercentage}% Keluhan Lingkungan
                  </div>
                  <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                    Volume laporan masalah lingkungan warga turun dari{' '}
                    <span className="font-mono-num font-semibold text-slate-900">
                      {janTotal} laporan
                    </span>{' '}
                    pada Januari menjadi{' '}
                    <span className="font-mono-num font-semibold text-slate-900">
                      {currentOktTotal} laporan
                    </span>{' '}
                    pada Oktober 2026.
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Indeks Kebersihan Jan 2026:</span>
                    <span className="font-mono-num font-semibold text-slate-700">76 / 100</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Indeks Kebersihan Okt 2026:</span>
                    <span className="font-mono-num font-bold text-emerald-700">
                      95 / 100 (+19 poin)
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Penurunan Titik Sampah Liar:</span>
                    <span className="font-mono-num font-semibold text-sky-700">
                      20 → 5 titik/bln
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 leading-relaxed">
                  <span className="font-semibold text-slate-900">Catatan Evaluasi Lurah: </span>
                  Penurunan signifikan terjadi sejak pengaktifan 6 Bank Sampah Unit (BSU) RW dan
                  jadwal penjemputan motor sampah Tangkasaki pagi-sore di koridor Jl. Urip Sumoharjo
                  & Jl. Sukaria.
                </div>
              </div>
            </div>
          </div>

          {/* Matriks Kinerja Lingkungan per RW di Kelurahan Panaikang */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6">
            <div className="text-[11px] font-bold text-[#1C8237]">
              MATRIKS KINERJA WILAYAH RW 01 – RW 06
            </div>
            <h2 className="text-base font-bold text-[#0D3868] mt-0.5">
              Evaluasi Kinerja Kebersihan & Partisipasi Bank Sampah per RW
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Data komparasi RW 01 s/d RW 06 Kelurahan Panaikang periode berjalan
            </p>

            <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
              {wasteUnits.map((u) => {
                const totalRwKg = u.organikKg + u.anorganikKg + u.residuKg;
                const cleanRatio = Math.round(((u.organikKg + u.anorganikKg) / totalRwKg) * 100);
                return (
                  <div
                    key={u.id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span className="font-bold text-[#0D3868] text-sm">{u.rw}</span>
                        <span className="font-mono-num font-semibold text-emerald-700">
                          {cleanRatio}% Terpilah
                        </span>
                      </div>
                      <div className="mt-1 text-sm font-semibold text-slate-900">{u.unitName}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{u.locationLabel}</div>
                    </div>

                    <div className="mt-4">
                      <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden flex">
                        <div
                          className="bg-emerald-600 h-full"
                          style={{ width: `${cleanRatio}%` }}
                        />
                      </div>
                      <div className="mt-2 flex items-center justify-between text-xs text-slate-600 font-mono-num">
                        <span>{u.activeHouseholds} KK Aktif</span>
                        <span>Total {totalRwKg} kg</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ================= MODUL 03: UNDUH LAPORAN BULANAN (FILE PDF ARSIP FISIK) ================= */}
      {(activeSection === 'semua' || activeSection === 'arsip_pdf') && (
        <MonthlyArchivePdfPanel
          profile={profile}
          reports={reports}
          wasteUnits={wasteUnits}
          cleanupEvents={cleanupEvents}
          rwGroups={rwGroups}
          onPdfDownloaded={onPdfDownloaded}
        />
      )}
    </div>
  );
};
