import React, { useState, useMemo, useEffect } from 'react';
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
  FileText,
  FileCheck,
  Eye,
  Check,
  XCircle,
  RotateCcw,
  Search,
  ExternalLink,
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
  PraRegistrasiRecord,
  PengaduanOnlineRecord,
  PraRegistrasiStatus,
  PengaduanOnlineStatus,
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
import { downloadOfficialLetterOrReceiptPdf } from '../utils/officialLetterPdfGenerator';
import { Download } from 'lucide-react';

interface DashboardLurahViewProps {
  reports: CitizenReport[];
  wasteUnits: WasteBankUnit[];
  cleanupEvents: CleanupEvent[];
  praRegistrasiList?: PraRegistrasiRecord[];
  pengaduanList?: PengaduanOnlineRecord[];
  profile?: KelurahanProfile;
  rwGroups?: RwGroup[];
  whatsappRecipients?: WhatsAppRecipient[];
  onUpdateReportStatus: (
    id: string,
    newStatus: ReportStatus,
    assignedTeam: string,
    responseNote: string
  ) => void;
  onLurahApproveService?: (
    ticketCode: string,
    action: 'SETUJUI' | 'TOLAK' | 'KEMBALIKAN',
    lurahNote: string
  ) => Promise<void>;
  onLurahFollowUpPengaduan?: (ticketCode: string, note: string) => Promise<void>;
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

type LurahSubSection = 'semua' | 'persetujuan' | 'disposisi' | 'tren' | 'arsip_pdf';

export const DashboardLurahView: React.FC<DashboardLurahViewProps> = ({
  reports,
  wasteUnits,
  cleanupEvents,
  praRegistrasiList = [],
  pengaduanList = [],
  profile = INITIAL_KELURAHAN_PROFILE,
  rwGroups = INITIAL_RW_GROUPS,
  whatsappRecipients = INITIAL_WHATSAPP_RECIPIENTS,
  onUpdateReportStatus,
  onLurahApproveService,
  onLurahFollowUpPengaduan,
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

  // Persetujuan Pelayanan state
  const [persetujuanTab, setPersetujuanTab] = useState<'pra_registrasi' | 'pengaduan'>('pra_registrasi');
  const [praStatusFilter, setPraStatusFilter] = useState<'SEMUA' | 'MENUNGGU' | 'DIPROSES' | 'DISETUJUI' | 'DITOLAK' | 'SELESAI'>('SEMUA');
  const [pengaduanFilterMode, setPengaduanFilterMode] = useState<'SEMUA' | 'AKTIF' | 'PRIORITAS' | 'SELESAI'>('SEMUA');
  const [selectedPraRecord, setSelectedPraRecord] = useState<PraRegistrasiRecord | null>(null);
  const [lurahNoteInput, setLurahNoteInput] = useState<string>('');
  const [isProcessingApproval, setIsProcessingApproval] = useState<boolean>(false);
  const [approvalFeedback, setApprovalFeedback] = useState<string>('');

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

  useEffect(() => {
    if (selectedReport) {
      setEditStatus(selectedReport.status);
      setEditTeam(selectedReport.assignedTeam || TEAM_OPTIONS[0]);
      setEditNote(selectedReport.responseNote || '');
    }
  }, [selectedReport?.id]);

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
    if (!INITIAL_MONTHLY_TRENDS || INITIAL_MONTHLY_TRENDS.length === 0) {
      if (reports.length > 0) {
        return [
          {
            month: 'Okt',
            fullMonth: 'Oktober 2026 (Periode Berjalan)',
            totalLaporan: reports.length,
            selesai: completedCount,
            proses: inProgressCount + waitingCount,
            sampahLiar: reports.filter((r) => r.category.includes('Sampah')).length,
            drainase: reports.filter((r) => r.category.includes('Drainase')).length,
            pohonHijau: reports.filter((r) => r.category.includes('Pohon')).length,
            fasum: reports.filter((r) => r.category.includes('Fasilitas')).length,
            indeksKebersihan: 95,
          },
        ];
      }
      return [];
    }
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
  }, [reports, completedCount, inProgressCount, waitingCount, timeRange]);

  const firstTrend = chartData[0];
  const latestTrend = chartData.length > 0 ? chartData[chartData.length - 1] : undefined;
  const janTotal = INITIAL_MONTHLY_TRENDS?.[0]?.totalLaporan ?? (firstTrend?.totalLaporan ?? 0);
  const currentOktTotal = latestTrend?.totalLaporan ?? 0;
  const dropPercentage =
    janTotal > 0
      ? Math.round(((janTotal - currentOktTotal) / janTotal) * 100)
      : 0;

  const filteredReports = reports.filter((r) => {
    const matchStatus = statusFilter === 'Semua' || r.status === statusFilter;
    const matchRw = rwFilter === 'Semua' || r.rw === rwFilter;
    return matchStatus && matchRw;
  });

  // Guarantee that all records from reports (e.g. 5 existing reports with Selesai / Sedang Ditangani)
  // are incorporated into Pra Registrasi and Pengaduan Online lists
  const mergedPraList = useMemo<PraRegistrasiRecord[]>(() => {
    const list = [...praRegistrasiList];
    const ticketSet = new Set(list.map((p) => p.ticketCode));

    for (const r of reports) {
      if (!r || !r.id) continue;
      const isSurat =
        r.ticketCode?.startsWith('SRT-') ||
        r.ticketCode?.startsWith('REG-') ||
        (r.documentCode && r.documentCode.startsWith('PM-')) ||
        r.serviceCategoryId === 'surat_keterangan' ||
        r.category === 'Surat Keterangan';

      if (isSurat && !ticketSet.has(r.ticketCode)) {
        let mappedStatus: PraRegistrasiStatus = 'SURAT_SELESAI';
        if (r.status === 'Menunggu Verifikasi') mappedStatus = 'MENUNGGU_PERSETUJUAN';
        else if (r.status === 'Sedang Ditangani') mappedStatus = 'DIPROSES';
        else if (r.status === 'Selesai') mappedStatus = 'SURAT_SELESAI';

        list.push({
          id: r.id,
          ticketCode: r.ticketCode || `SRT-2026-${r.id.slice(-4)}`,
          serviceId: r.serviceSubItemId || r.serviceCategoryId || 'sk-usaha',
          serviceCode: r.documentCode || r.serviceSubItemId || 'PM-01',
          serviceName: r.serviceSubItemLabel || r.serviceCategoryTitle || r.title || 'Surat Keterangan',
          applicantNik: r.applicantNik || '7371110000000001',
          applicantName: r.reporterName || 'Warga Panaikang',
          applicantPhone: r.reporterPhone || '',
          applicantRw: r.rw || 'RW 01',
          applicantRt: r.rt || 'RT 01',
          applicantAddress: r.locationName || 'Kelurahan Panaikang',
          formData: {},
          uploadedDocs: [],
          status: mappedStatus,
          submittedAt: r.createdAt || '01 November 2026',
          updatedAt: r.updatedAt || r.createdAt || '01 November 2026',
          assignedOfficerName: r.verifiedBy || r.assignedTeam || 'Petugas Loket Pelayanan',
          officerNotes: r.responseNote || 'Berkas telah diverifikasi oleh petugas loket.',
          physicalDocsChecked: r.status === 'Selesai' || r.status === 'Sedang Ditangani',
          lurahApprovalStatus:
            r.status === 'Selesai' || r.status === 'Sedang Ditangani'
              ? 'DISETUJUI'
              : 'MENUNGGU',
          letterRegisterNumber: r.letterRegisterNumber,
        });
        ticketSet.add(r.ticketCode);
      }
    }
    return list;
  }, [praRegistrasiList, reports]);

  const mergedPengaduanList = useMemo<PengaduanOnlineRecord[]>(() => {
    const list = [...pengaduanList];
    const ticketSet = new Set(list.map((p) => p.ticketCode));

    for (const r of reports) {
      if (!r || !r.id) continue;
      const isSurat =
        r.ticketCode?.startsWith('SRT-') ||
        r.ticketCode?.startsWith('REG-') ||
        (r.documentCode && r.documentCode.startsWith('PM-')) ||
        r.serviceCategoryId === 'surat_keterangan' ||
        r.category === 'Surat Keterangan';

      if (!isSurat && !ticketSet.has(r.ticketCode)) {
        let mappedStatus: PengaduanOnlineStatus = 'DIAJUKAN';
        if (r.status === 'Selesai') mappedStatus = 'SELESAI';
        else if (r.status === 'Sedang Ditangani') mappedStatus = 'DITINDAKLANJUTI';
        else mappedStatus = 'DIVERIFIKASI';

        list.push({
          id: r.id,
          ticketCode: r.ticketCode || `ADU-2026-${r.id.slice(-4)}`,
          category: (r.category as any) || 'Lainnya',
          title: r.title,
          content: r.description,
          locationAddress: r.locationName,
          incidentDate: r.createdAt?.slice(0, 10) || '01 November 2026',
          proofPhotos: r.imageUrl ? [r.imageUrl] : [],
          isAnonymous: r.reporterName?.toLowerCase().includes('anonim') || false,
          reporterName: r.reporterName || 'Warga Panaikang',
          reporterPhone: r.reporterPhone || '',
          reporterRw: r.rw || 'RW 01',
          reporterRt: r.rt || 'RT 01',
          status: mappedStatus,
          isPriority: r.urgency === 'Darurat' || r.urgency === 'Tinggi',
          submittedAt: r.createdAt || '01 November 2026',
          updatedAt: r.updatedAt || r.createdAt || '01 November 2026',
          assignedUnit: r.assignedTeam,
          assignedOfficer: r.verifiedBy || r.assignedTeam,
          followUpNotes: r.responseNote,
        });
        ticketSet.add(r.ticketCode);
      }
    }
    return list;
  }, [pengaduanList, reports]);

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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
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
              onClick={() => setActiveSection('persetujuan')}
              className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-colors cursor-pointer ${
                activeSection === 'persetujuan'
                  ? 'bg-amber-600 border-amber-600 text-white shadow-xs'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <ShieldCheck
                className={`w-4 h-4 shrink-0 ${
                  activeSection === 'persetujuan' ? 'text-amber-200' : 'text-amber-600'
                }`}
              />
              <div className="min-w-0">
                <div className="text-xs font-bold truncate">01. Persetujuan Layanan</div>
                <div
                  className={`text-[11px] truncate ${
                    activeSection === 'persetujuan' ? 'text-amber-100' : 'text-slate-500'
                  }`}
                >
                  Pra Registrasi & Pengaduan
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
                <div className="text-xs font-bold truncate">02. Disposisi & Laporan</div>
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
                <div className="text-xs font-bold truncate">03. Grafik Tren & Kinerja RW</div>
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
                <div className="text-xs font-bold truncate">04. Arsip Laporan PDF</div>
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

      {/* ================= MODUL 00: PERSETUJUAN PELAYANAN KELURAHAN & MONITORING PENGADUAN ================= */}
      {(activeSection === 'semua' || activeSection === 'persetujuan') && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 uppercase tracking-wider mb-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Otoritas Eksekutif Lurah · Persetujuan Pelayanan & Pengaduan</span>
                </div>
                <h3 className="text-lg font-black text-[#0D3868]">
                  Persetujuan Pelayanan Warga & Monitoring Aduan Wilayah
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Verifikasi final berkas pra registrasi loket sebelum penerbitan nomor surat resmi, serta pengawasan tindak lanjut aduan warga.
                </p>
              </div>

              {/* Subtabs: Pra Registrasi vs Pengaduan */}
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl self-start sm:self-center shrink-0">
                <button
                  type="button"
                  onClick={() => setPersetujuanTab('pra_registrasi')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    persetujuanTab === 'pra_registrasi'
                      ? 'bg-white text-[#0D3868] shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Pra Registrasi ({mergedPraList.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPersetujuanTab('pengaduan')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    persetujuanTab === 'pengaduan'
                      ? 'bg-white text-[#0D3868] shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                  <span>Pengaduan Online ({mergedPengaduanList.length})</span>
                </button>
              </div>
            </div>

            {/* Important Notice for Lurah */}
            <div className="mt-4 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Catatan Penting Otoritas: </span>
                Upload dokumen oleh warga hanya berarti dokumen tersedia secara online, bukan otomatis berarti dokumen sudah sah/terverifikasi. Pastikan petugas loket telah memeriksa keabsahan fisik dokumen asli pemohon sebelum Anda menandatangani atau menyetujui surat.
              </div>
            </div>

            {/* Approval Notice Feedback */}
            {approvalFeedback && (
              <div className="mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center justify-between">
                <span>{approvalFeedback}</span>
                <button
                  type="button"
                  onClick={() => setApprovalFeedback('')}
                  className="text-emerald-700 hover:text-emerald-950 font-black cursor-pointer"
                >
                  ✕
                </button>
              </div>
            )}

            {/* TAB CONTENT: PRA REGISTRASI ONLINE */}
            {persetujuanTab === 'pra_registrasi' && (
              <div className="mt-5 space-y-4">
                {/* 4 Summary Cards for Pra Registrasi */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="text-[10px] font-bold uppercase text-slate-500">Total Pra Registrasi</div>
                    <div className="text-xl font-mono font-black text-slate-900 mt-0.5">{mergedPraList.length}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Semua berkas layanan</div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200">
                    <div className="text-[10px] font-bold uppercase text-amber-700">Menunggu Persetujuan</div>
                    <div className="text-xl font-mono font-black text-amber-900 mt-0.5">
                      {mergedPraList.filter((p) => p.status === 'MENUNGGU_PERSETUJUAN' || p.status === 'BERKAS_LENGKAP' || p.lurahApprovalStatus === 'MENUNGGU').length}
                    </div>
                    <div className="text-[10px] text-amber-700 mt-0.5">Perlu tanda tangan/persetujuan</div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-sky-50 border border-sky-200">
                    <div className="text-[10px] font-bold uppercase text-sky-700">Sedang Diproses</div>
                    <div className="text-xl font-mono font-black text-sky-900 mt-0.5">
                      {mergedPraList.filter((p) => p.status === 'DIPROSES' || p.status === 'VERIFIKASI_PETUGAS' || p.status === 'MENUNGGU_KEDATANGAN').length}
                    </div>
                    <div className="text-[10px] text-sky-700 mt-0.5">Verifikasi di loket</div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200">
                    <div className="text-[10px] font-bold uppercase text-emerald-700">Disetujui & Selesai</div>
                    <div className="text-xl font-mono font-black text-emerald-900 mt-0.5">
                      {mergedPraList.filter((p) => p.status === 'DISETUJUI' || p.status === 'SURAT_SELESAI').length}
                    </div>
                    <div className="text-[10px] text-emerald-700 mt-0.5">Nomor surat terbit</div>
                  </div>
                </div>

                {/* Status Filters */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mr-1">
                    Status:
                  </span>
                  {(
                    [
                      { key: 'SEMUA', label: 'Semua Pengajuan' },
                      { key: 'MENUNGGU', label: 'Menunggu Persetujuan' },
                      { key: 'DIPROSES', label: 'Sedang Diproses' },
                      { key: 'DISETUJUI', label: 'Disetujui' },
                      { key: 'SELESAI', label: 'Selesai' },
                      { key: 'DITOLAK', label: 'Ditolak' },
                    ] as const
                  ).map((st) => (
                    <button
                      key={st.key}
                      type="button"
                      onClick={() => setPraStatusFilter(st.key)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                        praStatusFilter === st.key
                          ? 'bg-[#0D3868] text-white shadow-2xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>

                {/* Pra Registrasi List */}
                {(() => {
                  const filteredPra = mergedPraList.filter((item) => {
                    if (praStatusFilter === 'MENUNGGU') {
                      return (
                        item.status === 'MENUNGGU_PERSETUJUAN' ||
                        item.status === 'BERKAS_LENGKAP' ||
                        item.status === 'VERIFIKASI_PETUGAS' ||
                        item.status === 'MENUNGGU_KEDATANGAN' ||
                        item.status === 'DIAJUKAN' ||
                        item.lurahApprovalStatus === 'MENUNGGU'
                      );
                    }
                    if (praStatusFilter === 'DIPROSES') {
                      return (
                        item.status === 'DIPROSES' ||
                        item.status === 'VERIFIKASI_PETUGAS' ||
                        item.status === 'BERKAS_LENGKAP'
                      );
                    }
                    if (praStatusFilter === 'DISETUJUI') {
                      return item.status === 'DISETUJUI' || item.lurahApprovalStatus === 'DISETUJUI';
                    }
                    if (praStatusFilter === 'DITOLAK') {
                      return item.status === 'DITUTUP' || item.lurahApprovalStatus === 'DITOLAK';
                    }
                    if (praStatusFilter === 'SELESAI') {
                      return item.status === 'SURAT_SELESAI';
                    }
                    return true;
                  });

                  if (filteredPra.length === 0) {
                    return (
                      <div className="p-8 text-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-slate-500 text-xs">
                        Tidak ada berkas pra registrasi dalam status &ldquo;{praStatusFilter}&rdquo;.
                      </div>
                    );
                  }

                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {filteredPra.map((pra) => {
                        const isSelected = selectedPraRecord?.ticketCode === pra.ticketCode;
                        return (
                          <div
                            key={pra.id}
                            className={`p-4 rounded-2xl border transition-all ${
                              isSelected
                                ? 'border-[#0D3868] ring-2 ring-sky-300 bg-sky-50/30'
                                : 'border-slate-200 bg-white hover:border-slate-300 shadow-2xs'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <span className="font-mono text-xs font-black text-[#0D3868] bg-sky-100 px-2 py-0.5 rounded-md">
                                  {pra.ticketCode}
                                </span>
                                <h4 className="text-sm font-black text-slate-900 mt-1">
                                  {pra.serviceName}
                                </h4>
                                <div className="text-xs text-slate-600 mt-0.5">
                                  Pemohon: <span className="font-bold text-slate-800">{pra.applicantName}</span> ({pra.applicantRw})
                                </div>
                              </div>
                              <span
                                className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
                                  pra.status === 'SURAT_SELESAI'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : pra.status === 'DISETUJUI'
                                    ? 'bg-teal-100 text-teal-800'
                                    : pra.status === 'DIPROSES'
                                    ? 'bg-blue-100 text-blue-800'
                                    : pra.status === 'PERLU_PERBAIKAN'
                                    ? 'bg-amber-100 text-amber-800'
                                    : pra.status === 'MENUNGGU_PERSETUJUAN'
                                    ? 'bg-purple-100 text-purple-800'
                                    : pra.status === 'BERKAS_LENGKAP'
                                    ? 'bg-sky-100 text-sky-800'
                                    : pra.status === 'VERIFIKASI_PETUGAS'
                                    ? 'bg-indigo-100 text-indigo-800'
                                    : pra.status === 'MENUNGGU_KEDATANGAN'
                                    ? 'bg-orange-100 text-orange-800'
                                    : pra.status === 'DITUTUP'
                                    ? 'bg-rose-100 text-rose-800'
                                    : 'bg-slate-100 text-slate-700'
                                }`}
                              >
                                {pra.status === 'SURAT_SELESAI'
                                  ? 'Surat Selesai'
                                  : pra.status === 'DISETUJUI'
                                  ? 'Disetujui Lurah'
                                  : pra.status === 'DIPROSES'
                                  ? 'Sedang Diproses'
                                  : pra.status === 'MENUNGGU_PERSETUJUAN'
                                  ? 'Menunggu Persetujuan'
                                  : pra.status === 'BERKAS_LENGKAP'
                                  ? 'Berkas Lengkap'
                                  : pra.status === 'VERIFIKASI_PETUGAS'
                                  ? 'Verifikasi Petugas'
                                  : pra.status === 'MENUNGGU_KEDATANGAN'
                                  ? 'Menunggu Kedatangan'
                                  : pra.status.replace(/_/g, ' ')}
                              </span>
                            </div>

                            {/* Verification status & notes */}
                            <div className="mt-3 p-2.5 rounded-xl bg-slate-50 text-xs space-y-1">
                              <div className="flex items-center justify-between text-slate-600">
                                <span>Tgl Pengajuan:</span>
                                <span className="font-bold text-slate-800">{pra.submittedAt}</span>
                              </div>
                              <div className="flex items-center justify-between text-slate-600">
                                <span>Verifikasi Fisik Loket:</span>
                                <span
                                  className={`font-black ${
                                    pra.physicalDocsChecked ? 'text-emerald-700' : 'text-amber-700'
                                  }`}
                                >
                                  {pra.physicalDocsChecked ? '✓ Dokumen Asli Diperiksa' : '⏳ Belum Verifikasi Fisik'}
                                </span>
                              </div>
                              {pra.officerNotes && (
                                <div className="text-slate-600 pt-1 border-t border-slate-200">
                                  <span className="font-bold">Catatan Petugas:</span> {pra.officerNotes}
                                </div>
                              )}
                              {pra.uploadedDocs && pra.uploadedDocs.length > 0 && (
                                <div className="text-slate-600 pt-1 border-t border-slate-200">
                                  <span className="font-bold">Dokumen Di-upload:</span> {pra.uploadedDocs.length} berkas
                                </div>
                              )}
                            </div>

                            {/* Action toggle */}
                            <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedPraRecord(pra);
                                  setLurahNoteInput(pra.lurahNotes || '');
                                }}
                                className="px-3 py-1.5 rounded-lg bg-[#0D3868] text-white text-xs font-bold hover:bg-[#072647] transition flex items-center gap-1 cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Periksa Dossier & Persetujuan</span>
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  downloadOfficialLetterOrReceiptPdf(
                                    {
                                      ticketCode: pra.ticketCode,
                                      isSurat:
                                        pra.status === 'SURAT_SELESAI' || pra.status === 'DISETUJUI',
                                      documentTitle:
                                        pra.status === 'SURAT_SELESAI' || pra.status === 'DISETUJUI'
                                          ? `SURAT KETERANGAN / PENGANTAR (${pra.serviceName.toUpperCase()})`
                                          : 'TANDA TERIMA PRA REGISTRASI LAYANAN KELURAHAN',
                                      registerNumber: pra.serviceCode,
                                      applicantName: pra.applicantName,
                                      applicantNik: pra.applicantNik,
                                      applicantPhone: pra.applicantPhone,
                                      rw: pra.applicantRw,
                                      rt: pra.applicantRt,
                                      address: pra.applicantAddress,
                                      serviceOrCategoryName: pra.serviceName,
                                      descriptionOrPurpose:
                                        String(pra.formData?.keperluan || `Permohonan ${pra.serviceName}`),
                                      statusText: pra.status.replace(/_/g, ' '),
                                      assignedUnit:
                                        pra.assignedOfficerName || 'Operator Loket Kelurahan Panaikang',
                                      officerNotes:
                                        pra.lurahNotes ||
                                        pra.officerNotes ||
                                        'Telah diverifikasi oleh Lurah Panaikang.',
                                      submittedAt: pra.submittedAt,
                                    },
                                    profile
                                  )
                                }
                                className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                              >
                                <Printer className="w-3.5 h-3.5" />
                                <span>Cetak Surat / Tanda Terima</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}

                {/* Dossier Modal / Inspector when selected */}
                {selectedPraRecord && (
                  <div className="p-5 rounded-2xl border-2 border-[#0D3868] bg-white shadow-lg space-y-4 animate-fadeIn">
                    <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-200">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-black text-[#0D3868] bg-sky-100 px-2.5 py-0.5 rounded-lg">
                            {selectedPraRecord.ticketCode}
                          </span>
                          <span className="text-xs font-extrabold uppercase px-2 py-0.5 rounded-md bg-amber-100 text-amber-900">
                            Status: {selectedPraRecord.status.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <h4 className="text-base font-black text-slate-900 mt-1">
                          {selectedPraRecord.serviceName}
                        </h4>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedPraRecord(null)}
                        className="text-slate-400 hover:text-slate-700 font-black text-sm cursor-pointer"
                      >
                        ✕ Tutup
                      </button>
                    </div>

                    {/* Dossier Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                        <div className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                          Data Pemohon
                        </div>
                        <div><span className="text-slate-500">Nama:</span> <strong className="text-slate-900">{selectedPraRecord.applicantName}</strong></div>
                        <div><span className="text-slate-500">NIK:</span> <strong className="font-mono text-slate-900">{selectedPraRecord.applicantNik}</strong></div>
                        <div><span className="text-slate-500">Wilayah:</span> <strong className="text-slate-900">{selectedPraRecord.applicantRw} / {selectedPraRecord.applicantRt}</strong></div>
                        <div><span className="text-slate-500">Alamat:</span> <span className="text-slate-800">{selectedPraRecord.applicantAddress}</span></div>
                        <div><span className="text-slate-500">No. HP:</span> <strong className="text-slate-900">{selectedPraRecord.applicantPhone}</strong></div>
                      </div>

                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                        <div className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                          Hasil Verifikasi Loket Petugas
                        </div>
                        <div>
                          <span className="text-slate-500">Verifikator Loket:</span>{' '}
                          <strong className="text-slate-900">{selectedPraRecord.assignedOfficerName || 'Petugas Loket Pelayanan'}</strong>
                        </div>
                        <div>
                          <span className="text-slate-500">Pemeriksaan Fisik Asli:</span>{' '}
                          <strong className={selectedPraRecord.physicalDocsChecked ? 'text-emerald-700' : 'text-amber-700'}>
                            {selectedPraRecord.physicalDocsChecked ? '✓ Sudah diverifikasi fisik asli di loket' : '⏳ Belum diverifikasi fisik'}
                          </strong>
                        </div>
                        <div>
                          <span className="text-slate-500">Catatan Petugas:</span>{' '}
                          <span className="text-slate-800">{selectedPraRecord.officerNotes || 'Berkas lengkap dan sesuai.'}</span>
                        </div>
                        {selectedPraRecord.lurahNotes && (
                          <div className="pt-1 border-t border-slate-200 text-amber-900">
                            <span className="font-bold">Arahan Lurah Sebelumnya:</span> {selectedPraRecord.lurahNotes}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Uploaded Documents */}
                    {selectedPraRecord.uploadedDocs && selectedPraRecord.uploadedDocs.length > 0 && (
                      <div className="p-3.5 rounded-xl bg-sky-50/50 border border-sky-200">
                        <div className="font-bold text-[#0D3868] uppercase tracking-wider text-[11px] mb-2 flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5" />
                          <span>Dokumen Persyaratan yang Di-upload Pemohon ({selectedPraRecord.uploadedDocs.length} Berkas)</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {selectedPraRecord.uploadedDocs.map((doc, idx) => (
                            <div key={idx} className="p-2.5 rounded-lg bg-white border border-slate-200 flex items-center justify-between gap-2 text-xs">
                              <div className="min-w-0">
                                <div className="font-bold text-slate-800 truncate">{doc.persyaratanLabel || doc.fileName}</div>
                                <div className="text-[10px] text-slate-500 truncate">{doc.fileName} {doc.fileSizeKb ? `(${doc.fileSizeKb} KB)` : ''}</div>
                              </div>
                              {doc.fileUrl && (
                                <a
                                  href={doc.fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-2 py-1 rounded-md bg-sky-100 hover:bg-sky-200 text-[#0D3868] text-[11px] font-bold shrink-0 flex items-center gap-1"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  <span>Buka</span>
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Lurah Action & Notes Controls */}
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                      <label className="block text-xs font-bold text-slate-800">
                        Catatan & Arahan Lurah (Ditampilkan pada status pemohon & diteruskan ke loket):
                      </label>
                      <textarea
                        rows={2}
                        value={lurahNoteInput}
                        onChange={(e) => setLurahNoteInput(e.target.value)}
                        placeholder="Contoh: Berkas telah diperiksa dan disetujui. Silakan petugas loket menerbitkan nomor registrasi surat resmi."
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0D3868]"
                      />

                      <div className="flex flex-wrap items-center gap-2 pt-2">
                        <button
                          type="button"
                          disabled={isProcessingApproval}
                          onClick={async () => {
                            if (!onLurahApproveService) return;
                            setIsProcessingApproval(true);
                            await onLurahApproveService(selectedPraRecord.ticketCode, 'SETUJUI', lurahNoteInput || 'Disetujui oleh Lurah Panaikang.');
                            setIsProcessingApproval(false);
                            setApprovalFeedback(`Permohonan ${selectedPraRecord.ticketCode} berhasil DISETUJUI oleh Lurah.`);
                            setSelectedPraRecord(null);
                          }}
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                        >
                          <Check className="w-4 h-4 text-emerald-200" />
                          <span>Setujui Permohonan</span>
                        </button>

                        <button
                          type="button"
                          disabled={isProcessingApproval}
                          onClick={async () => {
                            if (!onLurahApproveService) return;
                            const noteToUse =
                              lurahNoteInput.trim() ||
                              'Mohon lengkapi atau perbaiki berkas persyaratan sesuai ketentuan kelurahan.';
                            setIsProcessingApproval(true);
                            await onLurahApproveService(selectedPraRecord.ticketCode, 'KEMBALIKAN', noteToUse);
                            setIsProcessingApproval(false);
                            setApprovalFeedback(`Permohonan ${selectedPraRecord.ticketCode} dikembalikan untuk perbaikan berkas.`);
                            setSelectedPraRecord(null);
                          }}
                          className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                        >
                          <RotateCcw className="w-4 h-4 text-slate-950" />
                          <span>Kembalikan untuk Perbaikan</span>
                        </button>

                        <button
                          type="button"
                          disabled={isProcessingApproval}
                          onClick={async () => {
                            if (!onLurahApproveService) return;
                            const noteToUse =
                              lurahNoteInput.trim() ||
                              'Permohonan ditolak karena belum memenuhi persyaratan administrasi.';
                            setIsProcessingApproval(true);
                            await onLurahApproveService(selectedPraRecord.ticketCode, 'TOLAK', noteToUse);
                            setIsProcessingApproval(false);
                            setApprovalFeedback(`Permohonan ${selectedPraRecord.ticketCode} telah ditolak.`);
                            setSelectedPraRecord(null);
                          }}
                          className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                        >
                          <XCircle className="w-4 h-4 text-rose-200" />
                          <span>Tolak Permohonan</span>
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            downloadOfficialLetterOrReceiptPdf(
                              {
                                ticketCode: selectedPraRecord.ticketCode,
                                isSurat:
                                  selectedPraRecord.status === 'SURAT_SELESAI' ||
                                  selectedPraRecord.status === 'DISETUJUI',
                                documentTitle:
                                  selectedPraRecord.status === 'SURAT_SELESAI' ||
                                  selectedPraRecord.status === 'DISETUJUI'
                                    ? `SURAT KETERANGAN / PENGANTAR (${selectedPraRecord.serviceName.toUpperCase()})`
                                    : 'TANDA TERIMA PRA REGISTRASI LAYANAN KELURAHAN',
                                registerNumber: selectedPraRecord.serviceCode,
                                applicantName: selectedPraRecord.applicantName,
                                applicantNik: selectedPraRecord.applicantNik,
                                applicantPhone: selectedPraRecord.applicantPhone,
                                rw: selectedPraRecord.applicantRw,
                                rt: selectedPraRecord.applicantRt,
                                address: selectedPraRecord.applicantAddress,
                                serviceOrCategoryName: selectedPraRecord.serviceName,
                                descriptionOrPurpose:
                                  String(
                                    selectedPraRecord.formData?.keperluan ||
                                      `Permohonan ${selectedPraRecord.serviceName}`
                                  ),
                                statusText: selectedPraRecord.status.replace(/_/g, ' '),
                                assignedUnit:
                                  selectedPraRecord.assignedOfficerName ||
                                  'Operator Loket Kelurahan Panaikang',
                                officerNotes:
                                  lurahNoteInput ||
                                  selectedPraRecord.lurahNotes ||
                                  selectedPraRecord.officerNotes ||
                                  'Telah diperiksa oleh Lurah Panaikang.',
                                submittedAt: selectedPraRecord.submittedAt,
                              },
                              profile
                            )
                          }
                          className="px-4 py-2 rounded-xl bg-[#0D3868] hover:bg-[#072647] text-white text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-xs ml-auto"
                        >
                          <Download className="w-4 h-4 text-sky-200" />
                          <span>Cetak Surat / Tanda Terima (PDF)</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: MONITORING PENGADUAN ONLINE */}
            {persetujuanTab === 'pengaduan' && (
              <div className="mt-5 space-y-4">
                {/* 4 Summary Cards for Complaints */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="text-[10px] font-bold uppercase text-slate-500">Total Pengaduan</div>
                    <div className="text-xl font-mono font-black text-slate-900 mt-0.5">{mergedPengaduanList.length}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Semua laporan warga</div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200">
                    <div className="text-[10px] font-bold uppercase text-amber-700">Aduan Aktif</div>
                    <div className="text-xl font-mono font-black text-amber-900 mt-0.5">
                      {mergedPengaduanList.filter((p) => p.status !== 'SELESAI').length}
                    </div>
                    <div className="text-[10px] text-amber-700 mt-0.5">Belum selesai</div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200">
                    <div className="text-[10px] font-bold uppercase text-rose-700">Aduan Prioritas</div>
                    <div className="text-xl font-mono font-black text-rose-900 mt-0.5">
                      {mergedPengaduanList.filter((p) => p.isPriority).length}
                    </div>
                    <div className="text-[10px] text-rose-700 mt-0.5">Mendesak / Darurat</div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200">
                    <div className="text-[10px] font-bold uppercase text-emerald-700">Aduan Selesai</div>
                    <div className="text-xl font-mono font-black text-emerald-900 mt-0.5">
                      {mergedPengaduanList.filter((p) => p.status === 'SELESAI').length}
                    </div>
                    <div className="text-[10px] text-emerald-700 mt-0.5">Tuntas ditangani</div>
                  </div>
                </div>

                {/* Complaint Filters */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mr-1">
                    Filter:
                  </span>
                  {(
                    [
                      { key: 'SEMUA', label: 'Semua Pengaduan' },
                      { key: 'AKTIF', label: 'Pengaduan Aktif' },
                      { key: 'PRIORITAS', label: 'Pengaduan Prioritas' },
                      { key: 'SELESAI', label: 'Pengaduan Selesai' },
                    ] as const
                  ).map((f) => (
                    <button
                      key={f.key}
                      type="button"
                      onClick={() => setPengaduanFilterMode(f.key)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                        pengaduanFilterMode === f.key
                          ? 'bg-[#0D3868] text-white shadow-2xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                {/* Complaints List Table / Cards */}
                {(() => {
                  const filteredPengaduan = mergedPengaduanList.filter((item) => {
                    if (pengaduanFilterMode === 'AKTIF') return item.status !== 'SELESAI';
                    if (pengaduanFilterMode === 'PRIORITAS') return item.isPriority;
                    if (pengaduanFilterMode === 'SELESAI') return item.status === 'SELESAI';
                    return true;
                  });

                  if (filteredPengaduan.length === 0) {
                    return (
                      <div className="p-8 text-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-slate-500 text-xs">
                        Tidak ada pengaduan dalam kategori filter &ldquo;{pengaduanFilterMode}&rdquo;.
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-3">
                      {filteredPengaduan.map((pgd) => (
                        <div
                          key={pgd.id}
                          className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 shadow-2xs space-y-2.5"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-black text-[#0D3868] bg-sky-100 px-2 py-0.5 rounded-md">
                                {pgd.ticketCode}
                              </span>
                              <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                                {pgd.category}
                              </span>
                              {pgd.isPriority && (
                                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-rose-100 text-rose-800">
                                  Prioritas Tinggi
                                </span>
                              )}
                            </div>
                            <span
                              className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md self-start sm:self-auto ${
                                pgd.status === 'SELESAI'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : pgd.status === 'DITINDAKLANJUTI'
                                  ? 'bg-blue-100 text-blue-800'
                                  : pgd.status === 'MENUNGGU_INFORMASI'
                                  ? 'bg-amber-100 text-amber-800'
                                  : pgd.status === 'DIVERIFIKASI'
                                  ? 'bg-purple-100 text-purple-800'
                                  : pgd.status === 'DITERIMA'
                                  ? 'bg-sky-100 text-sky-800'
                                  : 'bg-slate-100 text-slate-800'
                              }`}
                            >
                              {pgd.status === 'DITINDAKLANJUTI' ? 'Sedang Ditindaklanjuti' : pgd.status}
                            </span>
                          </div>

                          <h4 className="text-sm font-black text-slate-900">{pgd.title}</h4>
                          <p className="text-xs text-slate-600 leading-relaxed">{pgd.content}</p>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-2.5 rounded-xl bg-slate-50 text-xs">
                            <div>
                              <span className="text-slate-500">Lokasi:</span>{' '}
                              <strong className="text-slate-800">{pgd.locationAddress}</strong> ({pgd.reporterRw})
                            </div>
                            <div>
                              <span className="text-slate-500">Pelapor:</span>{' '}
                              <strong className="text-slate-800">{pgd.isAnonymous ? 'Anonim (Dirahasiakan)' : pgd.reporterName}</strong>
                            </div>
                            <div>
                              <span className="text-slate-500">Tgl Kejadian:</span>{' '}
                              <strong className="text-slate-800">{pgd.incidentDate}</strong>
                            </div>
                          </div>

                          {pgd.followUpNotes && (
                            <div className="p-2.5 rounded-xl bg-sky-50 text-xs border border-sky-200 text-sky-950">
                              <span className="font-bold">Tindak Lanjut Petugas:</span> {pgd.followUpNotes}
                            </div>
                          )}

                          <div className="pt-2 border-t border-slate-100 flex justify-end">
                            <button
                              type="button"
                              onClick={() =>
                                downloadOfficialLetterOrReceiptPdf(
                                  {
                                    ticketCode: pgd.ticketCode,
                                    isSurat: false,
                                    documentTitle: 'TANDA TERIMA PENGADUAN & ASPIRASI WARGA',
                                    applicantName: pgd.isAnonymous
                                      ? 'Warga Pelapor (Identitas Dirahasiakan)'
                                      : pgd.reporterName,
                                    applicantPhone: pgd.reporterPhone,
                                    rw: pgd.reporterRw || 'RW 001',
                                    rt: pgd.reporterRt || 'RT 001',
                                    address: pgd.locationAddress,
                                    serviceOrCategoryName: `${pgd.category} — ${pgd.title}`,
                                    descriptionOrPurpose: pgd.content,
                                    statusText: pgd.status.replace(/_/g, ' '),
                                    assignedUnit:
                                      pgd.assignedOfficer || 'Tim Respon Kelurahan Panaikang',
                                    officerNotes:
                                      pgd.followUpNotes ||
                                      'Pengaduan warga tercatat dalam sistem monitoring Kelurahan Panaikang.',
                                    submittedAt: pgd.submittedAt || pgd.incidentDate,
                                  },
                                  profile
                                )
                              }
                              className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span>Cetak Tanda Terima Pengaduan (PDF)</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      )}

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
                    {filteredReports.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-10 text-center text-slate-400 bg-slate-50/40">
                          <AlertCircle className="w-6 h-6 mx-auto mb-1 text-slate-300" />
                          <p className="font-semibold text-slate-600">Belum ada laporan pengaduan warga</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">Laporan dari warga atau input admin akan tampil di sini</p>
                        </td>
                      </tr>
                    ) : (
                      filteredReports.map((rep) => {
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
                      })
                    )}
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

                    <div className="flex flex-col sm:flex-row gap-2">
                      <button
                        type="submit"
                        className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#2E7D32] hover:bg-[#1B5E20] text-white text-xs sm:text-sm font-bold transition-colors cursor-pointer shadow-xs"
                      >
                        <UserCheck className="w-4 h-4" />
                        <span>Simpan Perubahan & Teruskan ke Satgas</span>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          downloadOfficialLetterOrReceiptPdf(
                            {
                              ticketCode: selectedReport.ticketCode || selectedReport.id,
                              isSurat:
                                Boolean(selectedReport.serviceCategoryId) &&
                                selectedReport.status === 'Selesai',
                              documentTitle:
                                Boolean(selectedReport.serviceCategoryId) &&
                                selectedReport.status === 'Selesai'
                                  ? `SURAT KETERANGAN / PENGANTAR (${(selectedReport.serviceSubItemLabel || selectedReport.category).toUpperCase()})`
                                  : 'TANDA TERIMA PELAYANAN & PENGADUAN KELURAHAN',
                              registerNumber: selectedReport.documentCode,
                              applicantName: selectedReport.reporterName,
                              applicantNik: selectedReport.applicantNik,
                              applicantPhone: selectedReport.reporterPhone,
                              rw: selectedReport.rw,
                              rt: selectedReport.rt || 'RT 001',
                              address: selectedReport.locationName,
                              serviceOrCategoryName:
                                selectedReport.serviceSubItemLabel ||
                                selectedReport.title ||
                                selectedReport.category,
                              descriptionOrPurpose: selectedReport.description,
                              statusText: editStatus,
                              assignedUnit: editTeam || selectedReport.assignedTeam,
                              officerNotes: editNote || selectedReport.responseNote,
                              submittedAt: selectedReport.createdAt,
                            },
                            profile
                          )
                        }
                        className="inline-flex items-center justify-center gap-1.5 py-2.5 px-3.5 rounded-xl bg-[#0D3868] hover:bg-[#072647] text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
                      >
                        <Printer className="w-4 h-4" />
                        <span>Cetak Surat / Tanda Terima</span>
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 h-full flex flex-col items-center justify-center text-center">
                  <SlidersHorizontal className="w-10 h-10 text-slate-300 mb-2" />
                  <div className="text-sm font-bold text-slate-700">Panel Disposisi & Instruksi Lurah</div>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs leading-relaxed">
                    Belum ada laporan pengaduan warga yang dipilih untuk didisposisikan kepada Satgas.
                  </p>
                </div>
              )}
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
                {chartData.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 rounded-2xl text-center bg-slate-50/50">
                    <BarChart3 className="w-10 h-10 text-slate-300 mb-2" />
                    <p className="text-sm font-bold text-slate-700">Belum Ada Data Grafik Tren Bulanan</p>
                    <p className="text-xs text-slate-500 max-w-sm mt-1">
                      Grafik tren dan kategori akan terbentuk otomatis setelah administrator menginput laporan warga atau data rekapitulasi bulanan kelurahan.
                    </p>
                  </div>
                ) : (
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
                )}
              </div>

              {/* Executive Insight Summary Panel (4 cols) */}
              <div className="lg:col-span-4 space-y-4 border-t lg:border-t-0 lg:border-l border-slate-200 pt-5 lg:pt-0 lg:pl-6">
                <div>
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                    <TrendingDown className="w-4 h-4" />
                    <span>Analisis Tren Kebersihan Wilayah</span>
                  </div>
                  <div className="mt-1.5 text-2xl font-extrabold text-[#0D3868] font-mono-num">
                    {dropPercentage > 0 ? `-${dropPercentage}%` : `${dropPercentage}%`} Keluhan Lingkungan
                  </div>
                  <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                    {janTotal > 0 ? (
                      <>
                        Volume laporan masalah lingkungan warga tercatat{' '}
                        <span className="font-mono-num font-semibold text-slate-900">
                          {janTotal} laporan
                        </span>{' '}
                        pada awal periode dan{' '}
                        <span className="font-mono-num font-semibold text-slate-900">
                          {currentOktTotal} laporan
                        </span>{' '}
                        pada periode berjalan.
                      </>
                    ) : (
                      <>
                        Belum ada riwayat laporan periode sebelumnya. Volume laporan aktif saat ini tercatat{' '}
                        <span className="font-mono-num font-semibold text-slate-900">
                          {currentOktTotal} laporan
                        </span>.
                      </>
                    )}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Indeks Kebersihan Periode Awal:</span>
                    <span className="font-mono-num font-semibold text-slate-700">{janTotal > 0 ? '76 / 100' : '-'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Indeks Kebersihan Saat Ini:</span>
                    <span className="font-mono-num font-bold text-emerald-700">
                      {janTotal > 0 ? '95 / 100 (+19 poin)' : '100 / 100'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Penanganan Titik Sampah:</span>
                    <span className="font-mono-num font-semibold text-sky-700">
                      {totalReports} laporan tercatat
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 leading-relaxed">
                  <span className="font-semibold text-slate-900">Catatan Evaluasi Lurah: </span>
                  Kinerja lingkungan dan evaluasi wilayah terkoordinasi langsung dengan Bank Sampah Unit (BSU) RW, motor sampah Tangkasaki, dan Satgas Drainase/Kebersihan Kelurahan Panaikang.
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
              {wasteUnits.length === 0 ? (
                <div className="col-span-full p-8 rounded-xl border border-dashed border-slate-300 bg-slate-50 text-center">
                  <FileSpreadsheet className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-700">Belum Ada Data Bank Sampah Unit RW</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Silakan input data Bank Sampah Unit melalui Panel Admin &gt; Pengelolaan Sampah.
                  </p>
                </div>
              ) : (
                wasteUnits.map((u) => {
                  const totalRwKg = u.organikKg + u.anorganikKg + u.residuKg;
                  const cleanRatio = totalRwKg > 0 ? Math.round(((u.organikKg + u.anorganikKg) / totalRwKg) * 100) : 0;
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
                })
              )}
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
