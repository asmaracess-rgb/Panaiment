import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Search,
  MapPin,
  CheckCircle2,
  Clock,
  AlertCircle,
  Upload,
  Copy,
  Check,
  FileText,
  UserCheck,
  ExternalLink,
  Printer,
  ChevronRight,
  Eye,
  Send,
  X,
  Phone,
  Home,
  ShieldCheck,
  Building2,
  Calendar,
  Layers,
  Sparkles,
  LogIn,
  UserPlus,
  Lock,
  Megaphone,
} from 'lucide-react';
import { EmblemKotaMakassar, EmblemKelurahanPanaikang } from './Emblems';
import { RestrictedAccessModal } from './RestrictedAccessModal';
import {
  CitizenReport,
  ReportCategory,
  ReportUrgency,
  ReportStatus,
  WasteBankUnit,
  AppView,
  RwGroup,
  WhatsAppRecipient,
  KelurahanProfile,
  KelurahanInfoItem,
  CleanupEvent,
  AuthenticatedUserProfile,
} from '../types';
import { createCitizenSubmissionInFirestore } from '../firebase/authService';
import {
  OFFICIAL_13_WARGA_SERVICES,
  REPORT_COMPLAINT_CATEGORIES,
  OfficialWargaService,
  MAIN_WARGA_MENUS,
  SERVICE_CATEGORY_GROUPS,
  MainWargaMenuId,
  DetailedCategoryId,
  ServiceSubItem,
  ServiceCategoryGroup,
  MainMenuCardConfig,
} from '../data/wargaServiceCatalog';
import { compressImageFile } from '../utils/compressImage';
import { getRealtimeDateTimeString } from '../utils/realtimeDate';

export {
  MAIN_WARGA_MENUS,
  SERVICE_CATEGORY_GROUPS,
  type MainWargaMenuId,
  type DetailedCategoryId,
  type ServiceSubItem,
  type ServiceCategoryGroup,
  type MainMenuCardConfig,
};

const LONTARA_LOGO_URL = '/assets/aistudio/198184-removebg-preview_e45b7839.png';
const LONTARA_PLUS_URL = 'https://lontaraplus.makassarkota.go.id';

const DEFAULT_RW_LIST = ['RW 01', 'RW 02', 'RW 03', 'RW 04', 'RW 05', 'RW 06', 'RW 07'];
const DEFAULT_RT_LIST = ['RT 01', 'RT 02', 'RT 03', 'RT 04', 'RT 05'];

interface UntukWargaViewProps {
  reports: CitizenReport[];
  wasteUnits?: WasteBankUnit[];
  rwGroups?: RwGroup[];
  whatsappRecipients?: WhatsAppRecipient[];
  kelurahanProfile?: KelurahanProfile;
  kelurahanInfos?: KelurahanInfoItem[];
  cleanupEvents?: CleanupEvent[];
  serviceCatalog?: ServiceCategoryGroup[];
  onAddReport: (
    newReport: Omit<
      CitizenReport,
      | 'id'
      | 'ticketCode'
      | 'createdAt'
      | 'updatedAt'
      | 'upvotes'
      | 'status'
      | 'assignedTeam'
      | 'responseNote'
    >
  ) => string;
  onUpvoteReport: (id: string) => void;
  onNavigate: (view: AppView) => void;
  userProfile?: AuthenticatedUserProfile | null;
  onRequireAuth?: (notice?: string) => void;
  onLogout?: () => void;
  allowedSubItems?: string[];
}

type SectionKey = 'home' | 'aduan' | 'admin';
type AduanTab = 'new' | 'track' | 'list' | 'success';
type AdminTab = 'catalog' | 'detail' | 'apply' | 'success';

export const UntukWargaView: React.FC<UntukWargaViewProps> = ({
  reports,
  rwGroups = [],
  onAddReport,
  onUpvoteReport,
  onNavigate,
  userProfile,
  onRequireAuth,
  onLogout,
  allowedSubItems,
}) => {
  const isAllowed = (key: string) => !allowedSubItems || allowedSubItems.includes(key);
  const [restrictedModal, setRestrictedModal] = useState<{ isOpen: boolean; title: string } | null>(null);

  const handleSubItemClick = (subKey: string, title: string, allowedAction: () => void) => {
    if (isAllowed(subKey)) {
      allowedAction();
    } else {
      setRestrictedModal({ isOpen: true, title });
    }
  };
  // Navigation section state (matches prototype)
  const [section, setSection] = useState<SectionKey>('home');
  const [aduanPage, setAduanPage] = useState<AduanTab>('new');
  const [adminPage, setAdminPage] = useState<AdminTab>('catalog');

  // Selected administrative service
  const [selectedService, setSelectedService] = useState<OfficialWargaService | null>(null);
  const [checkedDocs, setCheckedDocs] = useState<Record<number, boolean>>({});

  // Laporan Pengaduan Form State
  const [aduanForm, setAduanForm] = useState({
    title: '',
    category: REPORT_COMPLAINT_CATEGORIES[0],
    urgency: 'Normal' as ReportUrgency,
    rw: 'RW 01',
    rt: 'RT 01',
    location: '',
    description: '',
    reporterName: '',
    reporterPhone: '',
    isAnonymous: false,
    consent: false,
    photoDataUrl: '',
  });
  const [isCompressingPhoto, setIsCompressingPhoto] = useState(false);
  const [lastSubmittedAduan, setLastSubmittedAduan] = useState<{
    ticketCode: string;
    title: string;
    category: string;
    location: string;
  } | null>(null);

  // Lacak Laporan State
  const [searchTicketQuery, setSearchTicketQuery] = useState('');
  const [searchTicketResult, setSearchTicketResult] = useState<CitizenReport | null>(null);
  const [hasSearchedTicket, setHasSearchedTicket] = useState(false);
  const [copiedTicket, setCopiedTicket] = useState<string | null>(null);

  // Daftar Laporan Filter
  const [listSearchQuery, setListSearchQuery] = useState('');
  const [listStatusFilter, setListStatusFilter] = useState<string>('Semua');

  // Administrasi Catalog Search
  const [serviceSearchQuery, setServiceSearchQuery] = useState('');

  // Formulir Permohonan Surat State
  const [applyForm, setApplyForm] = useState({
    name: '',
    nik: '',
    contact: '',
    rw: 'RW 01',
    rt: 'RT 01',
    address: '',
    notes: '',
    consent: false,
  });
  const [lastSubmittedAdmin, setLastSubmittedAdmin] = useState<{
    ticketCode: string;
    serviceName: string;
    applicantName: string;
  } | null>(null);

  // Pre-fill forms when userProfile is authenticated
  React.useEffect(() => {
    if (!userProfile) return;
    setAduanForm((prev) => ({
      ...prev,
      reporterName: prev.reporterName || userProfile.fullName || '',
      reporterPhone: prev.reporterPhone || userProfile.phone || '',
      rw: userProfile.rw || prev.rw,
      rt: userProfile.rt || prev.rt,
    }));
    setApplyForm((prev) => ({
      ...prev,
      name: prev.name || userProfile.fullName || '',
      nik: prev.nik || userProfile.nik || '',
      contact: prev.contact || userProfile.phone || '',
      rw: userProfile.rw || prev.rw,
      rt: userProfile.rt || prev.rt,
      address: prev.address || userProfile.address || '',
    }));
  }, [userProfile]);

  // Available RT list dynamically based on chosen RW
  const currentRwObj = useMemo(() => {
    return rwGroups.find((g) => g.rwCode === aduanForm.rw);
  }, [rwGroups, aduanForm.rw]);

  const currentApplyRwObj = useMemo(() => {
    return rwGroups.find((g) => g.rwCode === applyForm.rw);
  }, [rwGroups, applyForm.rw]);

  const availableRtsForAduan = currentRwObj?.rtList?.map((r) => r.rtCode) || DEFAULT_RT_LIST;
  const availableRtsForApply = currentApplyRwObj?.rtList?.map((r) => r.rtCode) || DEFAULT_RT_LIST;

  // Checklist counts for selected service
  const doneCheckedCount = useMemo(() => {
    return Object.values(checkedDocs).filter(Boolean).length;
  }, [checkedDocs]);

  // Copy helper
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTicket(text);
    setTimeout(() => setCopiedTicket(null), 2500);
  };

  // Submit Aduan Handler
  const handleAduanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aduanForm.title.trim() || !aduanForm.description.trim()) {
      alert('Mohon isi Judul laporan dan Uraian permasalahan.');
      return;
    }
    if (!aduanForm.consent) {
      alert('Mohon centang konfirmasi pernyataan itikad baik.');
      return;
    }

    // Map Category to ReportCategory
    let repCategory: ReportCategory = 'Ketertiban & Fasum';
    if (aduanForm.category.toLowerCase().includes('sampah')) {
      repCategory = 'Sampah Liar & TPS';
    } else if (aduanForm.category.toLowerCase().includes('drainase') || aduanForm.category.toLowerCase().includes('jalan')) {
      repCategory = 'Drainase & Genangan';
    } else if (aduanForm.category.toLowerCase().includes('pohon') || aduanForm.category.toLowerCase().includes('lingkungan')) {
      repCategory = 'Pohon & Ruang Hijau';
    }

    const reporterDisplay = aduanForm.isAnonymous
      ? 'Warga Anonim'
      : aduanForm.reporterName.trim() || userProfile?.fullName || 'Warga Kelurahan Panaikang';
    const contactDisplay = aduanForm.isAnonymous
      ? ''
      : aduanForm.reporterPhone.trim() || userProfile?.phone || '';

    const createdTicket = onAddReport({
      title: aduanForm.title.trim(),
      description: aduanForm.description.trim(),
      category: repCategory,
      urgency: aduanForm.urgency,
      reporterName: reporterDisplay,
      reporterPhone: contactDisplay,
      rw: aduanForm.rw,
      rt: aduanForm.rt,
      locationName: aduanForm.location.trim()
        ? `${aduanForm.location.trim()} (${aduanForm.rw} / ${aduanForm.rt})`
        : `Wilayah ${aduanForm.rw} / ${aduanForm.rt}, Kelurahan Panaikang`,
      mapX: 50,
      mapY: 50,
      coordinatesLabel: '-5.1388, 119.4475',
      imageUrl: aduanForm.photoDataUrl || '',
      serviceCategoryTitle: 'Laporan dan Pengaduan Warga',
      serviceSubItemLabel: aduanForm.category,
      ownerId: userProfile?.uid,
      ownerEmail: userProfile?.email,
    });

    if (userProfile) {
      createCitizenSubmissionInFirestore({
        id: `sub-${Date.now()}`,
        ticketCode: createdTicket,
        submissionType: 'pengaduan_lingkungan',
        serviceCategoryId: 'masalah_lingkungan',
        serviceName: aduanForm.category,
        title: aduanForm.title.trim(),
        description: aduanForm.description.trim(),
        applicantName: reporterDisplay,
        applicantNik: userProfile.nik || '',
        applicantPhone: contactDisplay || userProfile.phone || '',
        rw: aduanForm.rw,
        rt: aduanForm.rt,
        address: aduanForm.location.trim() || userProfile.address || `Wilayah ${aduanForm.rw} / ${aduanForm.rt}`,
      }).catch((err) => {
        console.warn('[Firestore Citizen Submission]', err);
      });
    }

    setLastSubmittedAduan({
      ticketCode: createdTicket,
      title: aduanForm.title.trim(),
      category: aduanForm.category,
      location: aduanForm.location.trim() || `${aduanForm.rw} / ${aduanForm.rt}`,
    });

    // Reset Form
    setAduanForm({
      title: '',
      category: REPORT_COMPLAINT_CATEGORIES[0],
      urgency: 'Normal',
      rw: 'RW 01',
      rt: 'RT 01',
      location: '',
      description: '',
      reporterName: '',
      reporterPhone: '',
      isAnonymous: false,
      consent: false,
      photoDataUrl: '',
    });

    setAduanPage('success');
  };

  // Submit Administrasi Surat Handler
  const handleApplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService) return;
    if (!applyForm.name.trim() || !applyForm.address.trim()) {
      alert('Mohon isi Nama pemohon dan Alamat domisili.');
      return;
    }
    if (!applyForm.consent) {
      alert('Mohon centang persetujuan keabsahan data.');
      return;
    }

    const createdTicket = onAddReport({
      title: `${selectedService.name} — ${applyForm.name.trim()}`,
      description: `Permohonan surat resmi kelurahan: ${selectedService.name} (Kode: ${selectedService.code}).\nAlamat: ${applyForm.address.trim()}.\nCatatan Pemohon: ${applyForm.notes.trim() || 'Tidak ada catatan tambahan.'}`,
      category: 'Ketertiban & Fasum',
      urgency: 'Normal',
      reporterName: applyForm.name.trim(),
      reporterPhone: applyForm.contact.trim() || userProfile?.phone || '',
      rw: applyForm.rw,
      rt: applyForm.rt,
      locationName: `${applyForm.address.trim()} (${applyForm.rw} / ${applyForm.rt})`,
      mapX: 50,
      mapY: 50,
      coordinatesLabel: '-5.1388, 119.4475',
      imageUrl: '',
      serviceCategoryId: 'surat_keterangan',
      serviceCategoryTitle: 'Layanan Administrasi Warga',
      serviceSubItemId: selectedService.code,
      serviceSubItemLabel: selectedService.name,
      documentCode: selectedService.code,
      officialHeaderTitle: selectedService.name.toUpperCase(),
      processingUnit: selectedService.processingUnit || 'Seksi Pelayanan Umum & Loket Kelurahan',
      applicantNik: applyForm.nik.trim(),
      citizenAddress: applyForm.address.trim(),
      ownerId: userProfile?.uid,
      ownerEmail: userProfile?.email,
    });

    if (userProfile) {
      createCitizenSubmissionInFirestore({
        id: `sub-${Date.now()}`,
        ticketCode: createdTicket,
        submissionType: 'layanan_administrasi',
        serviceCategoryId: selectedService.code,
        serviceName: selectedService.name,
        title: `${selectedService.name} — ${applyForm.name.trim()}`,
        description: `Permohonan surat resmi kelurahan: ${selectedService.name} (Kode: ${selectedService.code}). Alamat: ${applyForm.address.trim()}. Catatan: ${applyForm.notes.trim() || '-'}`,
        applicantName: applyForm.name.trim(),
        applicantNik: applyForm.nik.trim() || userProfile.nik || '',
        applicantPhone: applyForm.contact.trim() || userProfile.phone || '',
        rw: applyForm.rw,
        rt: applyForm.rt,
        address: applyForm.address.trim(),
      }).catch((err) => {
        console.warn('[Firestore Citizen Submission]', err);
      });
    }

    setLastSubmittedAdmin({
      ticketCode: createdTicket,
      serviceName: selectedService.name,
      applicantName: applyForm.name.trim(),
    });

    setApplyForm({
      name: '',
      nik: '',
      contact: '',
      rw: 'RW 01',
      rt: 'RT 01',
      address: '',
      notes: '',
      consent: false,
    });

    setAdminPage('success');
  };

  // Handle Photo File Upload
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsCompressingPhoto(true);
      const compressed = await compressImageFile(file, 900, 0.75);
      setAduanForm((prev) => ({ ...prev, photoDataUrl: compressed }));
    } catch {
      alert('Gagal memproses gambar foto. Coba gunakan foto lain.');
    } finally {
      setIsCompressingPhoto(false);
    }
  };

  // Ticket Search
  const handleSearchTicket = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchTicketQuery.trim().toUpperCase();
    if (!query) return;
    setHasSearchedTicket(true);
    const found = reports.find(
      (r) =>
        r.ticketCode.toUpperCase() === query ||
        r.id.toUpperCase() === query ||
        r.ticketCode.toUpperCase().includes(query)
    );
    setSearchTicketResult(found || null);
  };

  // Filtered Catalog
  const filteredServices = useMemo(() => {
    if (!serviceSearchQuery.trim()) return OFFICIAL_13_WARGA_SERVICES;
    const q = serviceSearchQuery.toLowerCase();
    return OFFICIAL_13_WARGA_SERVICES.filter(
      (s) => s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q)
    );
  }, [serviceSearchQuery]);

  // Filtered Reports for List View
  const filteredReportsList = useMemo(() => {
    const q = listSearchQuery.trim().toLowerCase();
    return reports.filter((r) => {
      const matchSearch =
        !q ||
        r.ticketCode.toLowerCase().includes(q) ||
        r.title.toLowerCase().includes(q) ||
        r.locationName.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q);
      const matchStatus = listStatusFilter === 'Semua' || r.status === listStatusFilter;
      return matchSearch && matchStatus;
    });
  }, [reports, listSearchQuery, listStatusFilter]);

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 sm:py-8 font-sans">
      {/* =========================================================================
          TOP INSTITUTIONAL PORTAL BANNER (SESUAI GAMBAR 2)
      ========================================================================= */}
      <div className="mb-6">
        {/* Top Back Navigation Link (Gambar 2) */}
        <div className="mb-4">
          <button
            type="button"
            onClick={() => onNavigate('beranda')}
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-[#0D3868] hover:text-[#0277BD] transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Halaman Publik</span>
          </button>
        </div>

        {/* Main Blue Institutional Card (Gambar 2) */}
        <div className="bg-gradient-to-br from-[#072647] via-[#0D3868] to-[#0277BD] text-white rounded-3xl p-6 sm:p-8 shadow-[0_20px_50px_-15px_rgba(13,56,104,0.16)] relative overflow-hidden">
          <div className="relative z-10">
            {/* Logos / Emblems */}
            <div className="inline-flex items-center gap-3.5 mb-5">
              <EmblemKotaMakassar className="w-12 h-14 drop-shadow-md" />
              <div className="h-10 w-[1.5px] bg-white/25 rounded-full" />
              <EmblemKelurahanPanaikang className="w-12 h-14 drop-shadow-md" />
            </div>

            {/* Chip Badge */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/10 border border-white/20 text-sky-200 text-[10px] font-extrabold uppercase tracking-wider mb-3">
              <Building2 className="w-3.5 h-3.5" />
              <span>Portal Pelayanan Warga</span>
            </div>

            {/* Title */}
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white leading-snug">
              Pelayanan Administrasi & Pengaduan Warga Kelurahan Panaikang
            </h1>

            {/* Description */}
            <p className="mt-3 text-xs sm:text-sm text-sky-100/90 leading-relaxed max-w-3xl">
              Akses pengajuan surat keterangan resmi, penyampaian laporan lingkungan, serta
              pemantauan status berkas secara terpadu melalui Dashboard Warga.
            </p>

            {/* 3 Key Feature Bullets */}
            <div className="mt-6 space-y-3 border-t border-white/15 pt-5 text-xs text-sky-100">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-white">13 Layanan Persuratan Resmi:</strong> Ajukan
                  permohonan surat pengantar dan keterangan sesuai standar pelayanan kelurahan.
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-white">Riwayat & Status Real-Time:</strong> Pantau
                  perkembangan verifikasi berkas dan tindak lanjut laporan Anda di satu halaman.
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-white">Privasi Berkas Warga:</strong> Setiap warga
                  hanya dapat mengakses riwayat permohonan dan data domisili miliknya sendiri.
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Card Strip */}
          <div className="relative z-10 mt-8 pt-4 border-t border-white/15 text-[11px] text-sky-200/80 flex items-center justify-between">
            <span>Kecamatan Panakkukang · Kota Makassar</span>
            <span className="font-mono-num font-bold">Kode Pos 90231</span>
          </div>
        </div>

        {/* Action Mode Switch Buttons (Gambar 2) */}
        {!userProfile ? (
          <div className="grid grid-cols-2 gap-2 p-1.5 rounded-2xl bg-slate-100 border border-slate-200/80 mt-4 shadow-2xs">
            <button
              type="button"
              onClick={() =>
                onRequireAuth
                  ? onRequireAuth('Silakan masuk terlebih dahulu untuk mengakses layanan pengajuan warga.')
                  : onNavigate('login')
              }
              className="py-3 px-4 rounded-xl text-xs sm:text-sm font-extrabold transition-all flex items-center justify-center gap-2 cursor-pointer bg-[#0D3868] hover:bg-[#072647] text-white shadow-xs"
            >
              <LogIn className="w-4 h-4" />
              <span>Masuk Warga</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('login')}
              className="py-3 px-4 rounded-xl text-xs sm:text-sm font-extrabold transition-all flex items-center justify-center gap-2 cursor-pointer bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-200"
            >
              <UserPlus className="w-4 h-4" />
              <span>Pendaftaran Warga Baru</span>
            </button>
          </div>
        ) : (
          <div className="mt-4 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                ✓
              </div>
              <div>
                <div className="text-xs font-extrabold text-[#0D3868]">
                  {userProfile.fullName}
                  <span className="ml-2 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    {userProfile.role === 'admin' ? 'Admin Terverifikasi' : 'Warga Terautentikasi'}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                  {userProfile.email} · {userProfile.rw || 'RW 01'} / {userProfile.rt || 'RT 01'}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('dashboard_warga')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0D3868] hover:bg-[#072647] text-white text-xs font-bold transition shadow-xs cursor-pointer self-start sm:self-center"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Buka Dashboard Warga</span>
            </button>
          </div>
        )}
      </div>

      {/* Breadcrumb & Mobile Tab Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500 mb-4 px-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => onNavigate('beranda')}
            className="hover:text-[#0D3868] font-semibold flex items-center gap-1 cursor-pointer"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Beranda</span>
          </button>
          <span>/</span>
          <button
            type="button"
            onClick={() => {
              setSection('home');
            }}
            className={`font-semibold cursor-pointer ${
              section === 'home' ? 'text-[#0D3868] font-extrabold' : 'hover:text-[#0D3868]'
            }`}
          >
            Menu Warga
          </button>
          {section === 'aduan' && (
            <>
              <span>/</span>
              <span className="text-[#0D3868] font-extrabold">1. Laporan & Pengaduan Warga</span>
            </>
          )}
          {section === 'admin' && (
            <>
              <span>/</span>
              <span className="text-[#0D3868] font-extrabold">2. Layanan Administrasi Warga</span>
              {selectedService && (
                <>
                  <span>/</span>
                  <span className="text-[#0277BD] font-bold">{selectedService.code}</span>
                </>
              )}
            </>
          )}
        </div>

        {/* Mobile Fast Switcher Tabs (Hanya Tampil di Layar Kecil untuk menghemat ruang vertikal) */}
        <div className="lg:hidden flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setSection('home')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition shrink-0 cursor-pointer ${
              section === 'home'
                ? 'bg-[#0D3868] text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Menu Warga
          </button>
          <button
            type="button"
            onClick={() => {
              setSection('aduan');
              setAduanPage('new');
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition shrink-0 cursor-pointer ${
              section === 'aduan'
                ? 'bg-[#0277BD] text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            1. Laporan Warga
          </button>
          <button
            type="button"
            onClick={() => {
              setSection('admin');
              setAdminPage('catalog');
              setSelectedService(null);
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition shrink-0 cursor-pointer ${
              section === 'admin'
                ? 'bg-[#1C8237] text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            2. 13 Layanan Surat
          </button>
        </div>
      </div>

      {/* =========================================================================
          MAIN 2-COLUMN SHELL: SIDEBAR (DESKTOP ONLY) + CONTENT
      ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* ================= LEFT SIDEBAR NAVIGATION (Desktop Only, tanpa widget yang dicoret) ================= */}
        <aside className="hidden lg:block lg:col-span-3 bg-white rounded-2xl border border-slate-200 p-3.5 shadow-xs sticky top-4">
          <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-3 py-1.5">
            Menu Utama
          </div>

          <div className="space-y-1">
            <button
              type="button"
              onClick={() => onNavigate('beranda')}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-[#0D3868] transition cursor-pointer text-left"
            >
              <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
                <Home className="w-3.5 h-3.5" />
              </div>
              <span>Beranda Portal</span>
            </button>

            <button
              type="button"
              onClick={() => setSection('home')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer text-left ${
                section === 'home'
                  ? 'bg-sky-50 text-[#0D3868] border border-sky-200'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                    section === 'home' ? 'bg-[#0D3868] text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                </div>
                <span>Pelayanan Kelurahan</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Sub-Menu 1: Pra Registrasi Online */}
            <button
              type="button"
              onClick={() => {
                setSection('admin');
                setAdminPage('catalog');
                setSelectedService(null);
              }}
              className={`w-full flex items-center gap-2 pl-6 pr-3 py-2 rounded-xl text-xs transition cursor-pointer text-left ${
                section === 'admin'
                  ? 'bg-[#0277BD]/10 text-[#0277BD] font-bold border-l-4 border-[#0277BD]'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-[#0277BD] shrink-0" strokeWidth={1.75} />
              <span className="line-clamp-1">Pra Registrasi Online</span>
            </button>

            {/* Sub-Menu 2: Pengaduan Online */}
            <button
              type="button"
              onClick={() => {
                setSection('aduan');
                setAduanPage('new');
              }}
              className={`w-full flex items-center gap-2 pl-6 pr-3 py-2 rounded-xl text-xs transition cursor-pointer text-left ${
                section === 'aduan'
                  ? 'bg-emerald-600/10 text-emerald-800 font-bold border-l-4 border-emerald-600'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Megaphone className="w-3.5 h-3.5 text-emerald-600 shrink-0" strokeWidth={1.75} />
              <span className="line-clamp-1">Pengaduan Online</span>
            </button>
          </div>
        </aside>

        {/* ================= RIGHT MAIN CONTENT AREA ================= */}
        <section className="lg:col-span-9 bg-white rounded-2xl border border-slate-200 p-5 sm:p-7 shadow-xs min-h-[620px]">
          {/* =========================================================================
              VIEW 1: MENU UTAMA WARGA (HUB: 2 SUB-MENU KARTU BESAR)
          ========================================================================= */}
          {section === 'home' && (
            <div className="space-y-6">
              {/* Header section */}
              <div className="pb-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-black tracking-wider text-[#0277BD] uppercase">
                    PELAYANAN KELURAHAN
                  </div>
                  <h2 className="text-2xl font-extrabold text-[#0D3868] mt-0.5">
                    Pelayanan Kelurahan
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
                    Pilih modul pelayanan yang ingin Anda gunakan. Daftar layanan administrasi sebelum datang ke kantor kelurahan atau sampaikan pengaduan secara online.
                  </p>
                </div>
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-sky-100 text-[#0D3868] text-xs font-bold self-start">
                  ◉ Layanan Terpadu
                </span>
              </div>

              {/* 2 Main Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch">
                {/* Feature Card 1: Pra Registrasi Online */}
                <article className="rounded-2xl border border-slate-200 hover:border-[#0277BD] p-5 sm:p-6 bg-white hover:shadow-md transition-all flex flex-col justify-between h-full group">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="w-11 h-11 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center text-[#0277BD] group-hover:scale-105 transition-transform">
                        <FileText className="w-5 h-5" strokeWidth={1.75} />
                      </div>
                      <span className="text-[11px] font-bold tracking-wide uppercase text-[#0277BD] bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-100">
                        Administrasi Persuratan
                      </span>
                    </div>
                    <div>
                      <h3 className="text-lg font-extrabold text-[#0D3868]">
                        Pra Registrasi Online
                      </h3>
                      <p className="text-xs text-slate-600 leading-relaxed mt-1">
                        Daftar layanan administrasi sebelum datang ke kantor kelurahan. Lengkapi formulir dan berkas persyaratan secara mandiri untuk mempercepat proses di loket.
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 -mx-5 sm:-mx-6 -mb-5 sm:-mb-6 px-5 sm:px-6 py-3.5 bg-slate-50 border-t border-slate-200/90 rounded-b-2xl flex items-center justify-between gap-3">
                    <span className="text-xs font-semibold text-slate-600">
                      13 Layanan Administrasi
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setSection('admin');
                        setAdminPage('catalog');
                        setSelectedService(null);
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0277BD] hover:bg-[#0D3868] text-white text-xs font-bold transition shadow-xs cursor-pointer"
                    >
                      <span>Buka Layanan →</span>
                    </button>
                  </div>
                </article>

                {/* Feature Card 2: Pengaduan Online */}
                <article className="rounded-2xl border border-slate-200 hover:border-emerald-600 p-5 sm:p-6 bg-white hover:shadow-md transition-all flex flex-col justify-between h-full group">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 group-hover:scale-105 transition-transform">
                        <Megaphone className="w-5 h-5" strokeWidth={1.75} />
                      </div>
                      <span className="text-[11px] font-bold tracking-wide uppercase text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
                        Aspirasi &amp; Keluhan Warga
                      </span>
                    </div>
                    <div>
                      <h3 className="text-lg font-extrabold text-[#0D3868]">
                        Pengaduan Online
                      </h3>
                      <p className="text-xs text-slate-600 leading-relaxed mt-1">
                        Sampaikan pengaduan, keluhan, aspirasi, atau laporan kepada Kelurahan Panaikang. Lampirkan foto bukti dan pantau status tindak lanjut petugas secara transparan.
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 -mx-5 sm:-mx-6 -mb-5 sm:-mb-6 px-5 sm:px-6 py-3.5 bg-slate-50 border-t border-slate-200/90 rounded-b-2xl flex items-center justify-between gap-3">
                    <span className="text-xs font-semibold text-slate-600">
                      {reports.length} Pengaduan terdata
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setSection('aduan');
                        setAduanPage('new');
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition shadow-xs cursor-pointer"
                    >
                      <span>Buat Pengaduan →</span>
                    </button>
                  </div>
                </article>
              </div>

              {/* Ringkasan Layanan Info Panel */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 space-y-4">
                <h3 className="text-sm font-extrabold text-[#0D3868]">
                  Ringkasan Pelayanan Warga
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                    <div className="text-xl font-extrabold text-[#0277BD] font-mono-num">13</div>
                    <div className="text-[11px] text-slate-500 font-medium">Jenis Pengurusan Surat</div>
                  </div>
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                    <div className="text-xl font-extrabold text-emerald-600 font-mono-num">{reports.length}</div>
                    <div className="text-[11px] text-slate-500 font-medium">Laporan Tercatat</div>
                  </div>
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                    <div className="text-xl font-extrabold text-purple-600 font-mono-num">2</div>
                    <div className="text-[11px] text-slate-500 font-medium">Sub-Menu Utama Warga</div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-sky-50 border border-sky-200 text-xs text-sky-900 leading-relaxed flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-[#0277BD] shrink-0 mt-0.5" />
                  <div>
                    <strong>Koneksi Administrator:</strong> Seluruh permohonan surat dan laporan warga yang diajukan melalui portal ini langsung tersimpan ke basis data resmi kelurahan dan diproses oleh administrator serta Lurah Panaikang.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              VIEW 2: SUB-MENU 1 — LAPORAN DAN PENGADUAN WARGA
          ========================================================================= */}
          {section === 'aduan' && (
            <div className="space-y-6">
              {/* Header */}
              <div className="pb-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-black tracking-wider text-[#0277BD] uppercase">
                    SUB-MENU 1 · PENGADUAN LINGKUNGAN & PELAYANAN
                  </div>
                  <h2 className="text-2xl font-extrabold text-[#0D3868] mt-0.5">
                    Laporan dan Pengaduan Warga
                  </h2>
                  <p className="text-xs text-slate-600 mt-1">
                    Laporkan permasalahan lingkungan atau keluhan pelayanan, lalu gunakan nomor tiket resmi untuk melacak perkembangan penanganan.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setSection('home')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 cursor-pointer self-start sm:self-center"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Kembali ke Menu Warga</span>
                </button>
              </div>

              {/* Sub-Tabs: Buat Laporan | Lacak Laporan | Daftar Laporan */}
              <div className="flex flex-wrap items-center gap-2 pb-2">
                <button
                  type="button"
                  onClick={() =>
                    handleSubItemClick('warga_aduan_baru', 'Buat Laporan Baru', () => setAduanPage('new'))
                  }
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                    aduanPage === 'new'
                      ? 'bg-[#0277BD] text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <span>＋ Buat Laporan</span>
                  {!isAllowed('warga_aduan_baru') && (
                    <Lock className="w-3.5 h-3.5 shrink-0 opacity-80" strokeWidth={1.75} />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleSubItemClick('warga_lacak_tiket', 'Lacak Laporan / Tiket', () => setAduanPage('track'))
                  }
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                    aduanPage === 'track'
                      ? 'bg-[#0277BD] text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <span>⌕ Lacak Laporan</span>
                  {!isAllowed('warga_lacak_tiket') && (
                    <Lock className="w-3.5 h-3.5 shrink-0 opacity-80" strokeWidth={1.75} />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleSubItemClick('warga_daftar_laporan', 'Daftar Laporan Publik', () => setAduanPage('list'))
                  }
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                    aduanPage === 'list'
                      ? 'bg-[#0277BD] text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <span>☷ Daftar Laporan ({reports.length})</span>
                  {!isAllowed('warga_daftar_laporan') && (
                    <Lock className="w-3.5 h-3.5 shrink-0 opacity-80" strokeWidth={1.75} />
                  )}
                </button>
              </div>

              {/* TAB 1: FORMULIR BUAT LAPORAN */}
              {aduanPage === 'new' && !userProfile && (
                <div className="rounded-2xl border-2 border-sky-200 bg-sky-50/60 p-6 sm:p-8 text-center space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#0D3868] text-white mx-auto flex items-center justify-center shadow-sm">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div className="max-w-lg mx-auto space-y-1.5">
                    <span className="inline-block px-2.5 py-0.5 rounded-full bg-sky-100 text-[#0277BD] text-[10px] font-black uppercase tracking-wider">
                      Layanan Laporan Warga
                    </span>
                    <h3 className="text-lg font-extrabold text-[#0D3868]">
                      Masuk Diperlukan untuk Membuat Laporan Warga
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Penyampaian laporan baru memerlukan akses akun warga agar riwayat laporan Anda tercatat di <strong>Dashboard Warga</strong> dan dapat dipantau perkembangannya.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() =>
                        onRequireAuth
                          ? onRequireAuth('Silakan login terlebih dahulu untuk menyampaikan laporan pengaduan warga.')
                          : onNavigate('login')
                      }
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0D3868] hover:bg-[#072647] text-white text-xs font-extrabold shadow-sm transition cursor-pointer"
                    >
                      <UserCheck className="w-4 h-4" />
                      <span>Masuk / Daftar Akun Warga →</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setAduanPage('track')}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 transition cursor-pointer"
                    >
                      <span>Lacak Tiket Publik</span>
                    </button>
                  </div>
                </div>
              )}

              {aduanPage === 'new' && userProfile && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  {/* Left: Form Card */}
                  <form
                    onSubmit={handleAduanSubmit}
                    className="lg:col-span-8 rounded-2xl border border-slate-200 p-5 sm:p-6 bg-white space-y-4"
                  >
                    <h3 className="text-sm font-extrabold text-[#0D3868] pb-2 border-b border-slate-100">
                      Formulir Laporan Warga
                    </h3>

                    {/* Judul Laporan */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Judul Laporan *
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={120}
                        value={aduanForm.title}
                        onChange={(e) => setAduanForm({ ...aduanForm, title: e.target.value })}
                        placeholder="Contoh: Drainase tersumbat di Jalan Kesadaran RW 02..."
                        className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs focus:border-[#0277BD] focus:outline-none"
                      />
                    </div>

                    {/* Kategori & Urgensi */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Kategori Permasalahan *
                        </label>
                        <select
                          value={aduanForm.category}
                          onChange={(e) => setAduanForm({ ...aduanForm, category: e.target.value })}
                          className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-[#0277BD] focus:outline-none bg-white"
                        >
                          {REPORT_COMPLAINT_CATEGORIES.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Tingkat Urgensi *
                        </label>
                        <select
                          value={aduanForm.urgency}
                          onChange={(e) =>
                            setAduanForm({ ...aduanForm, urgency: e.target.value as ReportUrgency })
                          }
                          className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-[#0277BD] focus:outline-none bg-white"
                        >
                          <option value="Normal">Normal</option>
                          <option value="Tinggi">Perlu Perhatian (Tinggi)</option>
                          <option value="Darurat">Mendesak (Darurat)</option>
                        </select>
                      </div>
                    </div>

                    {/* RW & RT Selection */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Wilayah RW *
                        </label>
                        <select
                          value={aduanForm.rw}
                          onChange={(e) =>
                            setAduanForm({ ...aduanForm, rw: e.target.value, rt: 'RT 01' })
                          }
                          className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-mono-num bg-white"
                        >
                          {DEFAULT_RW_LIST.map((rw) => (
                            <option key={rw} value={rw}>
                              {rw}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Unit RT *
                        </label>
                        <select
                          value={aduanForm.rt}
                          onChange={(e) => setAduanForm({ ...aduanForm, rt: e.target.value })}
                          className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-mono-num bg-white"
                        >
                          {availableRtsForAduan.map((rt) => (
                            <option key={rt} value={rt}>
                              {rt}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Lokasi Kejadian */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Lokasi Kejadian / Alamat Spesifik *
                      </label>
                      <input
                        type="text"
                        required
                        value={aduanForm.location}
                        onChange={(e) => setAduanForm({ ...aduanForm, location: e.target.value })}
                        placeholder="Nama jalan, lorong, nomor rumah, atau patokan lokasi terdekat"
                        className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs focus:border-[#0277BD] focus:outline-none"
                      />
                    </div>

                    {/* Uraian Permasalahan */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Uraian Permasalahan *
                      </label>
                      <textarea
                        required
                        rows={4}
                        maxLength={1500}
                        value={aduanForm.description}
                        onChange={(e) => setAduanForm({ ...aduanForm, description: e.target.value })}
                        placeholder="Jelaskan secara rinci apa yang terjadi, sejak kapan masalah berlangsung, dan dampaknya bagi warga sekitar..."
                        className="w-full rounded-xl border border-slate-300 p-3 text-xs focus:border-[#0277BD] focus:outline-none"
                      />
                    </div>

                    {/* Upload Foto Pendukung */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Foto Pendukung <span className="text-slate-400 font-normal">(opsional)</span>
                      </label>
                      <div className="flex items-center gap-3">
                        <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 cursor-pointer">
                          <Upload className="w-3.5 h-3.5" />
                          <span>Pilih Foto dari Perangkat</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handlePhotoUpload}
                            className="hidden"
                          />
                        </label>
                        {isCompressingPhoto && (
                          <span className="text-xs text-sky-600 animate-pulse">
                            Mengompres foto...
                          </span>
                        )}
                        {Boolean(aduanForm.photoDataUrl && aduanForm.photoDataUrl.trim()) && (
                          <div className="flex items-center gap-2">
                            <img
                              src={aduanForm.photoDataUrl}
                              alt="Preview"
                              className="w-10 h-10 object-cover rounded-lg border border-slate-200"
                            />
                            <button
                              type="button"
                              onClick={() => setAduanForm({ ...aduanForm, photoDataUrl: '' })}
                              className="text-xs text-red-600 hover:underline cursor-pointer"
                            >
                              Hapus Foto
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Identitas Pelapor */}
                    {!aduanForm.isAnonymous && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2 border-t border-slate-100">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Nama Pelapor <span className="text-slate-400 font-normal">(opsional)</span>
                          </label>
                          <input
                            type="text"
                            value={aduanForm.reporterName}
                            onChange={(e) =>
                              setAduanForm({ ...aduanForm, reporterName: e.target.value })
                            }
                            placeholder="Nama Anda"
                            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Nomor Kontak / WhatsApp <span className="text-slate-400 font-normal">(opsional)</span>
                          </label>
                          <input
                            type="text"
                            value={aduanForm.reporterPhone}
                            onChange={(e) =>
                              setAduanForm({ ...aduanForm, reporterPhone: e.target.value })
                            }
                            placeholder="0812-xxxx-xxxx"
                            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-mono-num"
                          />
                        </div>
                      </div>
                    )}

                    {/* Checkbox Anonim */}
                    <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer pt-1">
                      <input
                        type="checkbox"
                        checked={aduanForm.isAnonymous}
                        onChange={(e) =>
                          setAduanForm({ ...aduanForm, isAnonymous: e.target.checked })
                        }
                        className="rounded text-[#0277BD] focus:ring-sky-500 w-4 h-4"
                      />
                      <span>Kirim secara anonim (nama dan kontak tidak dicantumkan ke publik).</span>
                    </label>

                    {/* Checkbox Pernyataan */}
                    <label className="flex items-start gap-2.5 text-xs text-slate-700 cursor-pointer bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <input
                        type="checkbox"
                        required
                        checked={aduanForm.consent}
                        onChange={(e) =>
                          setAduanForm({ ...aduanForm, consent: e.target.checked })
                        }
                        className="rounded text-[#0277BD] focus:ring-sky-500 w-4 h-4 mt-0.5"
                      />
                      <span>
                        Saya menyampaikan laporan ini dengan itikad baik dan informasi yang benar sejauh yang saya ketahui. *
                      </span>
                    </label>

                    {/* Submit Button */}
                    <div className="pt-2">
                      <button
                        type="submit"
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[#0277BD] hover:bg-[#0D3868] text-white text-xs font-extrabold shadow-sm transition cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Kirim Laporan Pengaduan →</span>
                      </button>
                    </div>
                  </form>

                  {/* Right: Info & Steps */}
                  <div className="lg:col-span-4 space-y-4">
                    <div className="rounded-2xl border border-slate-200 p-5 bg-white space-y-3">
                      <h4 className="text-xs font-black uppercase tracking-wider text-[#0D3868]">
                        Alur Penanganan Laporan
                      </h4>
                      <div className="space-y-3 text-xs">
                        <div className="flex gap-2.5">
                          <span className="w-6 h-6 rounded-full bg-sky-100 text-[#0277BD] font-black flex items-center justify-center shrink-0">1</span>
                          <div>
                            <strong className="block text-slate-800">Laporan Diterima</strong>
                            <p className="text-[11px] text-slate-500">Sistem otomatis menerbitkan nomor tiket resmi pelacakan.</p>
                          </div>
                        </div>
                        <div className="flex gap-2.5">
                          <span className="w-6 h-6 rounded-full bg-sky-100 text-[#0277BD] font-black flex items-center justify-center shrink-0">2</span>
                          <div>
                            <strong className="block text-slate-800">Verifikasi Petugas</strong>
                            <p className="text-[11px] text-slate-500">Petugas kelurahan memeriksa keabsahan laporan & lokasi kejadian.</p>
                          </div>
                        </div>
                        <div className="flex gap-2.5">
                          <span className="w-6 h-6 rounded-full bg-sky-100 text-[#0277BD] font-black flex items-center justify-center shrink-0">3</span>
                          <div>
                            <strong className="block text-slate-800">Dalam Penanganan</strong>
                            <p className="text-[11px] text-slate-500">Laporan ditindaklanjuti oleh tim satgas atau dikoordinasikan ke dinas teknis.</p>
                          </div>
                        </div>
                        <div className="flex gap-2.5">
                          <span className="w-6 h-6 rounded-full bg-emerald-100 text-[#1C8237] font-black flex items-center justify-center shrink-0">4</span>
                          <div>
                            <strong className="block text-slate-800">Selesai Ditangani</strong>
                            <p className="text-[11px] text-slate-500">Status diperbarui dan hasil penanganan diarsipkan pada Satu Data.</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-xs text-amber-950 space-y-2">
                      <div className="font-extrabold flex items-center gap-1.5 text-amber-900">
                        <AlertCircle className="w-4 h-4 text-amber-700" />
                        <span>Kedaruratan & Keluhan Lanjutan</span>
                      </div>
                      <p className="text-[11px] leading-relaxed">
                        Laporan Keluhan dan pelayanan tingkat lanjut silahkan gunakan aplikasi Lontara+. Untuk keadaan darurat langsung, hubungi Call Center 112 Kota Makassar.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: SUKSES KIRIM LAPORAN */}
              {aduanPage === 'success' && lastSubmittedAduan && (
                <div className="max-w-xl mx-auto rounded-2xl border-2 border-emerald-300 bg-white p-6 sm:p-8 text-center space-y-5 shadow-sm">
                  <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center text-2xl font-black">
                    ✓
                  </div>
                  <div>
                    <h3 className="text-xl font-extrabold text-[#0D3868]">
                      Laporan Anda Berhasil Tercatat
                    </h3>
                    <p className="text-xs text-slate-600 mt-1">
                      Laporan telah masuk ke sistem Satu Data Kelurahan Panaikang. Simpan nomor tiket di bawah ini untuk memantau status tindak lanjut.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-sky-50 border border-sky-200 space-y-1">
                    <span className="text-[10px] uppercase font-black tracking-widest text-[#0277BD]">
                      Nomor Tiket Laporan Resmi
                    </span>
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-2xl font-black text-[#0D3868] font-mono-num tracking-wide">
                        {lastSubmittedAduan.ticketCode}
                      </span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(lastSubmittedAduan.ticketCode)}
                        className="p-1 rounded-md text-slate-500 hover:text-slate-800 cursor-pointer"
                        title="Salin Nomor Tiket"
                      >
                        {copiedTicket === lastSubmittedAduan.ticketCode ? (
                          <Check className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    <span className="text-[11px] text-slate-500">
                      Status Awal: <strong>Menunggu Verifikasi</strong>
                    </span>
                  </div>

                  <div className="text-left text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    <div className="font-bold text-slate-800">{lastSubmittedAduan.title}</div>
                    <div className="text-slate-500 mt-0.5">
                      Kategori: {lastSubmittedAduan.category} · Lokasi: {lastSubmittedAduan.location}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSearchTicketQuery(lastSubmittedAduan.ticketCode);
                        setAduanPage('track');
                        const found = reports.find((r) => r.ticketCode === lastSubmittedAduan.ticketCode);
                        setSearchTicketResult(found || null);
                        setHasSearchedTicket(true);
                      }}
                      className="px-4 py-2 rounded-xl bg-[#0277BD] hover:bg-[#0D3868] text-white text-xs font-bold cursor-pointer"
                    >
                      Lacak Laporan Ini Sekarang
                    </button>
                    <button
                      type="button"
                      onClick={() => setAduanPage('new')}
                      className="px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 cursor-pointer"
                    >
                      Buat Laporan Lain
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 3: LACAK LAPORAN */}
              {aduanPage === 'track' && (
                <div className="max-w-2xl mx-auto space-y-5">
                  <div className="rounded-2xl border border-slate-200 p-5 bg-white space-y-4">
                    <h3 className="text-sm font-extrabold text-[#0D3868]">
                      Pencarian & Pelacakan Nomor Tiket
                    </h3>
                    <form onSubmit={handleSearchTicket} className="flex gap-2">
                      <input
                        type="text"
                        required
                        value={searchTicketQuery}
                        onChange={(e) => setSearchTicketQuery(e.target.value)}
                        placeholder="Contoh: ADU-2026-0001 atau SRT-2026-0001..."
                        className="flex-1 rounded-xl border border-slate-300 px-3.5 py-2 text-xs font-mono-num uppercase focus:border-[#0277BD] focus:outline-none"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-xl bg-[#0277BD] hover:bg-[#0D3868] text-white text-xs font-bold cursor-pointer"
                      >
                        Cari Laporan
                      </button>
                    </form>
                    <p className="text-[11px] text-slate-500">
                      Masukkan nomor tiket laporan atau permohonan surat yang telah diterbitkan sistem.
                    </p>
                  </div>

                  {hasSearchedTicket && (
                    <div>
                      {searchTicketResult ? (
                        <div className="rounded-2xl border border-slate-200 p-5 bg-white space-y-4 shadow-xs">
                          <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
                            <div>
                              <span className="text-xs font-mono-num font-black text-[#0277BD]">
                                {searchTicketResult.ticketCode}
                              </span>
                              <h4 className="text-base font-extrabold text-[#0D3868] mt-0.5">
                                {searchTicketResult.title}
                              </h4>
                              <div className="text-xs text-slate-500 mt-0.5">
                                Kategori: {searchTicketResult.category} · {searchTicketResult.rw} / {searchTicketResult.rt}
                              </div>
                            </div>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-bold ${
                                searchTicketResult.status === 'Selesai'
                                  ? 'bg-emerald-100 text-[#1C8237]'
                                  : searchTicketResult.status === 'Sedang Ditangani'
                                  ? 'bg-sky-100 text-[#0277BD]'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {searchTicketResult.status}
                            </span>
                          </div>

                          <div className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                            {searchTicketResult.description}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600">
                            <div>
                              <strong>Pelapor:</strong> {searchTicketResult.reporterName}
                            </div>
                            <div>
                              <strong>Waktu Pengajuan:</strong> {searchTicketResult.createdAt}
                            </div>
                            <div>
                              <strong>Lokasi:</strong> {searchTicketResult.locationName}
                            </div>
                            <div>
                              <strong>Tim Ditugaskan:</strong> {searchTicketResult.assignedTeam || 'Menunggu penugasan'}
                            </div>
                          </div>

                          {searchTicketResult.responseNote && (
                            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 space-y-1">
                              <strong>Tindak Lanjut Petugas:</strong>
                              <p>{searchTicketResult.responseNote}</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-500 text-xs bg-white">
                          Nomor tiket <strong>"{searchTicketQuery}"</strong> tidak ditemukan dalam basis data sistem. Pastikan nomor tiket ditulis dengan benar.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: DAFTAR LAPORAN WARGA */}
              {aduanPage === 'list' && (
                <div className="space-y-4">
                  {/* Filter Toolbar */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="relative">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={listSearchQuery}
                        onChange={(e) => setListSearchQuery(e.target.value)}
                        placeholder="Cari nomor tiket, judul, atau lokasi..."
                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs focus:border-[#0277BD] focus:outline-none"
                      />
                    </div>
                    <select
                      value={listStatusFilter}
                      onChange={(e) => setListStatusFilter(e.target.value)}
                      className="rounded-xl border border-slate-300 px-3 py-2 text-xs bg-white focus:border-[#0277BD] focus:outline-none"
                    >
                      <option value="Semua">Semua Status</option>
                      <option value="Menunggu Verifikasi">Menunggu Verifikasi</option>
                      <option value="Sedang Ditangani">Sedang Ditangani</option>
                      <option value="Selesai">Selesai</option>
                    </select>
                  </div>

                  {/* List Cards */}
                  <div className="space-y-3">
                    {filteredReportsList.length === 0 ? (
                      <div className="p-8 rounded-2xl border border-dashed border-slate-300 text-center text-xs text-slate-500">
                        Tidak ada laporan warga yang sesuai dengan pencarian atau filter.
                      </div>
                    ) : (
                      filteredReportsList.map((r) => (
                        <article
                          key={r.id}
                          className="rounded-2xl border border-slate-200 p-4 sm:p-5 bg-white hover:border-[#0277BD]/60 hover:shadow-xs transition space-y-3"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-mono-num font-black text-[#0277BD]">
                                  {r.ticketCode}
                                </span>
                                <span className="text-slate-300">·</span>
                                <span className="text-[11px] text-slate-500">{r.category}</span>
                              </div>
                              <h4 className="text-sm font-extrabold text-[#0D3868] mt-0.5">
                                {r.title}
                              </h4>
                            </div>
                            <span
                              className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                                r.status === 'Selesai'
                                  ? 'bg-emerald-100 text-[#1C8237]'
                                  : r.status === 'Sedang Ditangani'
                                  ? 'bg-sky-100 text-[#0277BD]'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {r.status}
                            </span>
                          </div>

                          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                            {r.description}
                          </p>

                          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                            <div className="flex items-center gap-3">
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-emerald-600" />
                                <span>{r.locationName}</span>
                              </span>
                              <span>·</span>
                              <span className="flex items-center gap-1 font-mono-num">
                                <Clock className="w-3 h-3 text-slate-400" />
                                <span>{r.createdAt}</span>
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => onUpvoteReport(r.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-sky-50 text-slate-700 hover:text-[#0277BD] font-bold cursor-pointer transition"
                              title="Dukung penanganan laporan ini"
                            >
                              <span>👍</span>
                              <span className="font-mono-num">{r.upvotes}</span>
                            </button>
                          </div>
                        </article>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* =========================================================================
              VIEW 3: SUB-MENU 2 — LAYANAN ADMINISTRASI WARGA (13 LAYANAN RESMI)
          ========================================================================= */}
          {section === 'admin' && (
            <div className="space-y-6">
              {/* Header */}
              <div className="pb-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-black tracking-wider text-[#1C8237] uppercase">
                    SUB-MENU 2 · 13 JENIS LAYANAN ADMINISTRASI SURAT
                  </div>
                  <h2 className="text-2xl font-extrabold text-[#0D3868] mt-0.5">
                    Layanan Administrasi Warga
                  </h2>
                  <p className="text-xs text-slate-600 mt-1">
                    Pilih jenis pengurusan surat resmi kelurahan untuk melihat checklist persyaratan dokumen, menandai berkas, dan mengajukan permohonan.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setSection('home')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 cursor-pointer self-start sm:self-center"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Kembali ke Menu Warga</span>
                </button>
              </div>

              {/* ADMIN VIEW 1: CATALOG OF 13 SERVICES */}
              {adminPage === 'catalog' && (
                <div className="space-y-5">
                  {/* Search Bar */}
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={serviceSearchQuery}
                      onChange={(e) => setServiceSearchQuery(e.target.value)}
                      placeholder="Cari nama layanan administrasi yang ingin diurus..."
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:border-[#0277BD] focus:outline-none"
                    />
                  </div>

                  {/* Grid of 13 Services (No redundant numbering in display) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredServices.map((srv) => (
                      <button
                        key={srv.code}
                        type="button"
                        onClick={() => {
                          setSelectedService(srv);
                          setCheckedDocs({});
                          setAdminPage('detail');
                        }}
                        className="rounded-2xl border border-slate-200 hover:border-[#0277BD] p-4 sm:p-5 bg-white hover:shadow-md transition text-left cursor-pointer flex flex-col justify-between group"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100">
                            <span className="text-xs font-extrabold text-[#0277BD] font-mono-num bg-sky-50 px-2 py-0.5 rounded-md border border-sky-100">
                              {srv.code}
                            </span>
                            <span className="text-[11px] font-semibold text-slate-500">
                              {srv.req.length} Persyaratan
                            </span>
                          </div>

                          <h3 className="text-sm font-extrabold text-[#0D3868] mt-2.5 group-hover:text-[#0277BD] transition-colors leading-snug">
                            {srv.name}
                          </h3>

                          <p className="text-xs text-slate-500 mt-1.5 line-clamp-2">
                            {srv.note}
                          </p>
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-[#0277BD] font-bold">
                          <span>Periksa Berkas & Detail</span>
                          <span className="group-hover:translate-x-1 transition-transform">→</span>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Catatan Umum */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 leading-relaxed">
                    <strong>Catatan Umum Pelayanan:</strong> Persyaratan dokumen di atas disusun berdasarkan standar pelayanan resmi Kelurahan Panaikang. Untuk dokumen tambahan atau situasi khusus, petugas loket kelurahan siap membantu verifikasi berkas Anda.
                  </div>
                </div>
              )}

              {/* ADMIN VIEW 2: DETAIL CHECKLIST FOR SELECTED SERVICE */}
              {adminPage === 'detail' && selectedService && (
                <div className="space-y-6">
                  {/* Top Action Header */}
                  <div className="flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setAdminPage('catalog')}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-[#0D3868] cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>← Kembali ke Daftar Layanan</span>
                    </button>

                    <span className="text-xs font-mono-num font-bold text-sky-700 bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-200">
                      Kode: {selectedService.code}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* Left: Checklist Card */}
                    <div className="lg:col-span-8 rounded-2xl border border-slate-200 p-5 sm:p-6 bg-white space-y-4">
                      <div>
                        <h3 className="text-base sm:text-lg font-extrabold text-[#0D3868]">
                          {selectedService.name}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Periksa persyaratan di bawah ini dan centang berkas yang sudah siap.
                        </p>
                      </div>

                      {/* Progress Bar */}
                      <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                          <span>Kelengkapan Berkas Pemohon:</span>
                          <span className="font-mono-num text-[#0277BD]">
                            {doneCheckedCount} dari {selectedService.req.length} berkas siap
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-[#0277BD] to-[#1C8237] transition-all duration-300"
                            style={{
                              width: `${(doneCheckedCount / selectedService.req.length) * 100}%`,
                            }}
                          />
                        </div>
                      </div>

                      {/* Checklist Items */}
                      <div className="space-y-2.5 pt-2">
                        {selectedService.req.map((reqText, idx) => {
                          const isDone = !!checkedDocs[idx];
                          return (
                            <label
                              key={idx}
                              className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                                isDone
                                  ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
                                  : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isDone}
                                onChange={(e) =>
                                  setCheckedDocs({ ...checkedDocs, [idx]: e.target.checked })
                                }
                                className="w-4 h-4 rounded text-[#1C8237] focus:ring-emerald-500 mt-0.5 cursor-pointer"
                              />
                              <div className="flex-1 text-xs leading-relaxed">
                                <span className="font-bold mr-1">{idx + 1}.</span>
                                <span className={isDone ? 'font-semibold' : ''}>{reqText}</span>
                              </div>
                              {isDone && (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                              )}
                            </label>
                          );
                        })}
                      </div>

                      {/* Actions: Cetak Checklist & Ajukan Permohonan */}
                      <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                        <button
                          type="button"
                          onClick={() => window.print()}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 cursor-pointer transition"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Cetak Checklist</span>
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleSubItemClick('warga_pengajuan_surat', `Ajukan Permohonan ${selectedService.name}`, () =>
                              setAdminPage('apply')
                            )
                          }
                          className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#0277BD] hover:bg-[#0D3868] text-white text-xs font-extrabold shadow-sm cursor-pointer transition"
                        >
                          <span>Ajukan Permohonan Ini →</span>
                          {!isAllowed('warga_pengajuan_surat') && (
                            <Lock className="w-3.5 h-3.5 shrink-0 opacity-85" strokeWidth={1.75} />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Right: Steps & Note Card */}
                    <div className="lg:col-span-4 space-y-4">
                      <div className="rounded-2xl border border-slate-200 p-5 bg-slate-50 space-y-3">
                        <h4 className="text-xs font-black uppercase tracking-wider text-[#0D3868]">
                          Ringkasan & Petunjuk
                        </h4>
                        <div className="text-xs text-slate-700 bg-white p-3 rounded-xl border border-slate-200 leading-relaxed">
                          {selectedService.note}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Unit Pelaksana:{' '}
                          <strong>{selectedService.processingUnit || 'Loket Pelayanan Kelurahan'}</strong>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-slate-200 p-5 bg-white space-y-3 text-xs">
                        <h4 className="text-xs font-black uppercase tracking-wider text-[#0D3868]">
                          Langkah Pengurusan
                        </h4>
                        <div className="space-y-2.5">
                          <div className="flex gap-2">
                            <span className="w-5 h-5 rounded-full bg-sky-100 text-[#0277BD] font-bold flex items-center justify-center shrink-0">1</span>
                            <span>Siapkan seluruh dokumen sesuai checklist di samping.</span>
                          </div>
                          <div className="flex gap-2">
                            <span className="w-5 h-5 rounded-full bg-sky-100 text-[#0277BD] font-bold flex items-center justify-center shrink-0">2</span>
                            <span>Ajukan formulir permohonan melalui tombol online ini.</span>
                          </div>
                          <div className="flex gap-2">
                            <span className="w-5 h-5 rounded-full bg-sky-100 text-[#0277BD] font-bold flex items-center justify-center shrink-0">3</span>
                            <span>Simpan nomor tiket permohonan untuk verifikasi berkas.</span>
                          </div>
                          <div className="flex gap-2">
                            <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center shrink-0">4</span>
                            <span>Petugas memproses dan mengesahkan dokumen surat resmi.</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ADMIN VIEW 3: FORMULIR AJUKAN PERMOHONAN */}
              {adminPage === 'apply' && selectedService && !userProfile && (
                <div className="max-w-xl mx-auto rounded-2xl border-2 border-sky-200 bg-sky-50/60 p-6 sm:p-8 text-center space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#0D3868] text-white mx-auto flex items-center justify-center shadow-sm">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div className="space-y-1.5">
                    <span className="inline-block px-2.5 py-0.5 rounded-full bg-sky-100 text-[#0277BD] text-[10px] font-black uppercase tracking-wider">
                      Layanan Administrasi Warga
                    </span>
                    <h3 className="text-lg font-extrabold text-[#0D3868]">
                      Masuk Diperlukan untuk Mengajukan Permohonan Surat
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Pengajuan permohonan <strong>{selectedService.name} ({selectedService.code})</strong> secara online membutuhkan akses akun warga agar berkas dan status surat Anda dapat dipantau langsung melalui <strong>Dashboard Warga</strong>.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() =>
                        onRequireAuth
                          ? onRequireAuth(`Silakan login untuk mengajukan permohonan ${selectedService.name}.`)
                          : onNavigate('login')
                      }
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0D3868] hover:bg-[#072647] text-white text-xs font-extrabold shadow-sm transition cursor-pointer"
                    >
                      <UserCheck className="w-4 h-4" />
                      <span>Masuk / Daftar Akun Warga →</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdminPage('detail')}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 transition cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Kembali ke Checklist Persyaratan</span>
                    </button>
                  </div>
                </div>
              )}

              {adminPage === 'apply' && selectedService && userProfile && (
                <div className="max-w-2xl mx-auto space-y-5">
                  <div className="flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setAdminPage('detail')}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-[#0D3868] cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>← Kembali ke Persyaratan Dokumen</span>
                    </button>
                  </div>

                  <form
                    onSubmit={handleApplySubmit}
                    className="rounded-2xl border border-slate-200 p-6 bg-white space-y-4 shadow-xs"
                  >
                    <div className="pb-3 border-b border-slate-100">
                      <span className="text-[10px] uppercase font-black tracking-wider text-[#0277BD] bg-sky-50 px-2 py-0.5 rounded-md border border-sky-100">
                        Formulir Permohonan Surat Online
                      </span>
                      <h3 className="text-base sm:text-lg font-extrabold text-[#0D3868] mt-1">
                        {selectedService.name}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Lengkapi identitas pemohon sesuai data KTP. Data akan diverifikasi langsung oleh petugas loket Kelurahan Panaikang.
                      </p>
                    </div>

                    {/* Nama Pemohon */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Nama Pemohon (Sesuai KTP) *
                      </label>
                      <input
                        type="text"
                        required
                        value={applyForm.name}
                        onChange={(e) => setApplyForm({ ...applyForm, name: e.target.value })}
                        placeholder="Nama lengkap pemohon"
                        className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs focus:border-[#0277BD] focus:outline-none"
                      />
                    </div>

                    {/* NIK & Kontak */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Nomor Induk Kependudukan (NIK)
                        </label>
                        <input
                          type="text"
                          maxLength={16}
                          value={applyForm.nik}
                          onChange={(e) => setApplyForm({ ...applyForm, nik: e.target.value })}
                          placeholder="7371xxxxxxxxxxxx"
                          className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs font-mono-num"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Nomor WhatsApp / HP Aktif *
                        </label>
                        <input
                          type="text"
                          required
                          value={applyForm.contact}
                          onChange={(e) => setApplyForm({ ...applyForm, contact: e.target.value })}
                          placeholder="0812-xxxx-xxxx"
                          className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs font-mono-num"
                        />
                      </div>
                    </div>

                    {/* RW & RT Domisili */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Wilayah RW Domisili *
                        </label>
                        <select
                          value={applyForm.rw}
                          onChange={(e) =>
                            setApplyForm({ ...applyForm, rw: e.target.value, rt: 'RT 01' })
                          }
                          className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-mono-num bg-white"
                        >
                          {DEFAULT_RW_LIST.map((rw) => (
                            <option key={rw} value={rw}>
                              {rw}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Unit RT Domisili *
                        </label>
                        <select
                          value={applyForm.rt}
                          onChange={(e) => setApplyForm({ ...applyForm, rt: e.target.value })}
                          className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-mono-num bg-white"
                        >
                          {availableRtsForApply.map((rt) => (
                            <option key={rt} value={rt}>
                              {rt}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Alamat Pemohon */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Alamat Domisili Pemohon *
                      </label>
                      <textarea
                        required
                        rows={2}
                        value={applyForm.address}
                        onChange={(e) => setApplyForm({ ...applyForm, address: e.target.value })}
                        placeholder="Alamat lengkap tempat tinggal pemohon di Kelurahan Panaikang"
                        className="w-full rounded-xl border border-slate-300 p-3 text-xs focus:border-[#0277BD] focus:outline-none"
                      />
                    </div>

                    {/* Keterangan Tambahan */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Keterangan Tambahan / Keperluan <span className="text-slate-400 font-normal">(opsional)</span>
                      </label>
                      <textarea
                        rows={2}
                        value={applyForm.notes}
                        onChange={(e) => setApplyForm({ ...applyForm, notes: e.target.value })}
                        placeholder="Misal: Keperluan untuk melamar pekerjaan / pendaftaran anak / kredit usaha..."
                        className="w-full rounded-xl border border-slate-300 p-3 text-xs focus:border-[#0277BD] focus:outline-none"
                      />
                    </div>

                    {/* Pernyataan Integritas */}
                    <label className="flex items-start gap-2.5 text-xs text-slate-700 cursor-pointer bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                      <input
                        type="checkbox"
                        required
                        checked={applyForm.consent}
                        onChange={(e) => setApplyForm({ ...applyForm, consent: e.target.checked })}
                        className="rounded text-[#0277BD] focus:ring-sky-500 w-4 h-4 mt-0.5"
                      />
                      <span>
                        Saya memastikan data yang diisi benar dan memahami bahwa berkas fisik persyaratan akan diverifikasi oleh petugas kelurahan saat pengesahan dokumen. *
                      </span>
                    </label>

                    {/* Submit Button */}
                    <div className="pt-2">
                      <button
                        type="submit"
                        className="w-full inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[#0277BD] hover:bg-[#0D3868] text-white text-xs font-extrabold shadow-sm transition cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Kirim Permohonan Surat Resmi →</span>
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* ADMIN VIEW 4: SUKSES AJUKAN PERMOHONAN */}
              {adminPage === 'success' && lastSubmittedAdmin && (
                <div className="max-w-xl mx-auto rounded-2xl border-2 border-emerald-300 bg-white p-6 sm:p-8 text-center space-y-5 shadow-sm">
                  <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center text-2xl font-black">
                    ✓
                  </div>
                  <div>
                    <h3 className="text-xl font-extrabold text-[#0D3868]">
                      Permohonan Surat Berhasil Diajukan
                    </h3>
                    <p className="text-xs text-slate-600 mt-1">
                      Permohonan dokumen <strong>{lastSubmittedAdmin.serviceName}</strong> atas nama <strong>{lastSubmittedAdmin.applicantName}</strong> telah tercatat pada loket digital kelurahan.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-sky-50 border border-sky-200 space-y-1">
                    <span className="text-[10px] uppercase font-black tracking-widest text-[#0277BD]">
                      Nomor Permohonan Dokumen
                    </span>
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-2xl font-black text-[#0D3868] font-mono-num tracking-wide">
                        {lastSubmittedAdmin.ticketCode}
                      </span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(lastSubmittedAdmin.ticketCode)}
                        className="p-1 rounded-md text-slate-500 hover:text-slate-800 cursor-pointer"
                        title="Salin Nomor Tiket"
                      >
                        {copiedTicket === lastSubmittedAdmin.ticketCode ? (
                          <Check className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    <span className="text-[11px] text-slate-500">
                      Tersambung ke Administrator Kelurahan Panaikang
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSection('aduan');
                        setAduanPage('track');
                        setSearchTicketQuery(lastSubmittedAdmin.ticketCode);
                        const found = reports.find((r) => r.ticketCode === lastSubmittedAdmin.ticketCode);
                        setSearchTicketResult(found || null);
                        setHasSearchedTicket(true);
                      }}
                      className="px-4 py-2 rounded-xl bg-[#0277BD] hover:bg-[#0D3868] text-white text-xs font-bold cursor-pointer"
                    >
                      Lacak Status Permohonan Ini
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAdminPage('catalog');
                        setSelectedService(null);
                      }}
                      className="px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 cursor-pointer"
                    >
                      Kembali ke Daftar Layanan
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      {/* Restricted Access Modal */}
      {restrictedModal && (
        <RestrictedAccessModal
          isOpen={restrictedModal.isOpen}
          title={restrictedModal.title}
          onClose={() => setRestrictedModal(null)}
          onLogin={() => {
            setRestrictedModal(null);
            onNavigate('login');
          }}
        />
      )}
    </div>
  );
};
