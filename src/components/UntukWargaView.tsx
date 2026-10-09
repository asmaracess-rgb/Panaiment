import React, { useState, useEffect } from 'react';
import {
  Send,
  Search,
  MapPin,
  ThumbsUp,
  CheckCircle2,
  Clock,
  AlertCircle,
  Truck,
  ArrowLeft,
  FileCheck2,
  Camera,
  ShieldCheck,
  X,
  MessageCircle,
  Upload,
  Copy,
  Check,
  Lock,
  FileText,
  UserCheck,
  Briefcase,
  HeartHandshake,
  Siren,
  Trees,
  Calendar,
  Megaphone,
  PhoneCall,
  Building2,
  ChevronRight,
  LayoutGrid,
  Users,
  ExternalLink,
  Printer,
  ClipboardCheck,
  FolderOpen,
} from 'lucide-react';
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
} from '../types';
import {
  IMG_DRAINASE,
  IMG_BANK_SAMPAH,
  IMG_KERJA_BAKTI,
  INITIAL_WHATSAPP_RECIPIENTS,
  INITIAL_KELURAHAN_PROFILE,
  INITIAL_KELURAHAN_INFOS,
} from '../data/initialData';
import {
  MAIN_WARGA_MENUS,
  SERVICE_CATEGORY_GROUPS,
  MainWargaMenuId,
  DetailedCategoryId,
  ServiceSubItem,
  ServiceCategoryGroup,
  MainMenuCardConfig,
} from '../data/wargaServiceCatalog';
import { resolveImageUrl } from '../utils/resolveImageUrl';
import { compressImageFile } from '../utils/compressImage';
import {
  buildReportWhatsAppMessage,
  buildWhatsAppUrl,
  getPreferredWhatsAppRecipient,
  triggerWhatsAppRedirect,
} from '../utils/whatsappHelper';

export {
  MAIN_WARGA_MENUS,
  SERVICE_CATEGORY_GROUPS,
  type MainWargaMenuId,
  type DetailedCategoryId,
  type ServiceSubItem,
  type ServiceCategoryGroup,
  type MainMenuCardConfig,
};

interface UntukWargaViewProps {
  reports: CitizenReport[];
  wasteUnits: WasteBankUnit[];
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
}

type WargaPageMode =
  | 'menu_hub'
  | 'category_page'
  | 'sub_menu_page'
  | 'cek_status_page'
  | 'pengumuman_page'
  | 'hubungi_page';

const DEFAULT_RW_OPTIONS = ['RW 01', 'RW 02', 'RW 03', 'RW 04', 'RW 05', 'RW 06', 'RW 07'];
const DEFAULT_RT_OPTIONS = ['RT 01', 'RT 02', 'RT 03', 'RT 04', 'RT 05'];
const CATEGORY_OPTIONS: ReportCategory[] = [
  'Sampah Liar & TPS',
  'Drainase & Genangan',
  'Pohon & Ruang Hijau',
  'Ketertiban & Fasum',
];

const LANDMARK_PRESETS: Record<string, { label: string; x: number; y: number; coords: string }> = {
  'RW 01': {
    label: 'Jl. Racing Centre / Sisi Barat Nipah Mall',
    x: 24,
    y: 47,
    coords: '-5.1388, 119.4408',
  },
  'RW 02': {
    label: 'Koridor Jl. Urip Sumoharjo / Seberang Kampus UMI',
    x: 50,
    y: 45,
    coords: '-5.1379, 119.4470',
  },
  'RW 03': {
    label: 'Jl. Urip Sumoharjo Lorong 2 / Sekitar UMI',
    x: 57,
    y: 35,
    coords: '-5.1355, 119.4485',
  },
  'RW 04': {
    label: 'Jl. Sukaria Raya & Lorong Warga',
    x: 37,
    y: 64,
    coords: '-5.1415, 119.4432',
  },
  'RW 05': {
    label: 'Kompleks Kejaksaan / Jl. Abd. Dg. Sirua Utara',
    x: 65,
    y: 67,
    coords: '-5.1422, 119.4496',
  },
  'RW 06': {
    label: 'Bantaran Kanal Panaikang / Akses Jl. Pampang',
    x: 73,
    y: 34,
    coords: '-5.1345, 119.4515',
  },
  'RW 07': {
    label: 'Kawasan Lorong Celloe / Sekitar RW 07 Panaikang',
    x: 62,
    y: 52,
    coords: '-5.1395, 119.4502',
  },
};

function renderCategoryIcon(
  iconName: ServiceCategoryGroup['iconName'],
  className = 'w-5 h-5'
): React.ReactNode {
  switch (iconName) {
    case 'UserCheck':
      return <UserCheck className={className} />;
    case 'FileText':
      return <FileText className={className} />;
    case 'Briefcase':
      return <Briefcase className={className} />;
    case 'Trees':
      return <Trees className={className} />;
    case 'HeartHandshake':
      return <HeartHandshake className={className} />;
    case 'Users':
      return <Users className={className} />;
    case 'Siren':
      return <Siren className={className} />;
    default:
      return <FileText className={className} />;
  }
}

export const UntukWargaView: React.FC<UntukWargaViewProps> = ({
  reports,
  wasteUnits,
  rwGroups = [],
  whatsappRecipients = INITIAL_WHATSAPP_RECIPIENTS,
  kelurahanProfile = INITIAL_KELURAHAN_PROFILE,
  kelurahanInfos = INITIAL_KELURAHAN_INFOS,
  cleanupEvents = [],
  serviceCatalog = SERVICE_CATEGORY_GROUPS,
  onAddReport,
  onUpvoteReport,
  onNavigate,
}) => {
  const catalogGroups =
    Array.isArray(serviceCatalog) && serviceCatalog.length > 0
      ? serviceCatalog
      : SERVICE_CATEGORY_GROUPS;

  // Multi-page navigation state: starts on 'menu_hub' so sub-menus open on a NEW page!
  const [activePage, setActivePage] = useState<WargaPageMode>('menu_hub');
  const [activeMainMenu, setActiveMainMenu] = useState<MainWargaMenuId>('buat_surat');
  const [selectedCategoryId, setSelectedCategoryId] =
    useState<DetailedCategoryId>('administrasi_kependudukan');
  const [selectedSubItemId, setSelectedSubItemId] = useState<string>('adminduk-ktp-kk');
  const [hubSearchQuery, setHubSearchQuery] = useState<string>('');

  // Interactive checklist &specific fields for the selected sub-menu page
  const [checkedReqs, setCheckedReqs] = useState<Record<string, boolean>>({});
  const [specificFieldValues, setSpecificFieldValues] = useState<Record<string, string>>({});
  const [showDraftPreview, setShowDraftPreview] = useState<boolean>(false);

  // Filter & Search for Cek Status Pengajuan page
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('Semua');
  const [filterStatus, setFilterStatus] = useState<'Semua' | ReportStatus>('Semua');
  const [lightboxImage, setLightboxImage] = useState<{
    url: string;
    caption: string;
    ticketCode: string;
  } | null>(null);

  // Form states
  const [reporterName, setReporterName] = useState('');
  const [applicantNik, setApplicantNik] = useState('');
  const [reporterPhone, setReporterPhone] = useState('');
  const [rw, setRw] = useState('RW 02');
  const [rt, setRt] = useState('RT 01');
  const [locationName, setLocationName] = useState(
    'Koridor Jl. Urip Sumoharjo / Seberang Kampus UMI'
  );
  const [urgency, setUrgency] = useState<ReportUrgency>('Normal');
  const [customTitle, setCustomTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState<string>(IMG_DRAINASE);
  const [formError, setFormError] = useState('');
  const [submittedTicket, setSubmittedTicket] = useState<string | null>(null);

  // Selected Category & SubItem Objects
  const currentCategoryObj =
    catalogGroups.find((c) => c.id === selectedCategoryId) || catalogGroups[0];
  const currentSubItemObj =
    currentCategoryObj.items.find((i) => i.id === selectedSubItemId) ||
    currentCategoryObj.items[0];

  // WhatsApp connection states
  const activeRecipients =
    whatsappRecipients.filter((r) => r.isActive).length > 0
      ? whatsappRecipients.filter((r) => r.isActive)
      : whatsappRecipients;
  const preferredRecipient = getPreferredWhatsAppRecipient(whatsappRecipients, rw);
  const [selectedWaRecipientId, setSelectedWaRecipientId] = useState<string>(
    preferredRecipient?.id || ''
  );
  const [autoSendWhatsApp, setAutoSendWhatsApp] = useState<boolean>(true);
  const [copiedWaText, setCopiedWaText] = useState<boolean>(false);
  const [lastSubmittedReport, setLastSubmittedReport] = useState<{
    ticketCode: string;
    title: string;
    description: string;
    category: ReportCategory;
    urgency: ReportUrgency;
    rw: string;
    rt: string;
    locationName: string;
    coordinatesLabel: string;
    reporterName: string;
    reporterPhone: string;
    recipientId: string;
  } | null>(null);

  useEffect(() => {
    if (
      !selectedWaRecipientId ||
      !activeRecipients.some((r) => r.id === selectedWaRecipientId)
    ) {
      const fallback = getPreferredWhatsAppRecipient(whatsappRecipients, rw);
      if (fallback) {
        setSelectedWaRecipientId(fallback.id);
      }
    }
  }, [whatsappRecipients, activeRecipients, selectedWaRecipientId, rw]);

  const scrollToTopSmooth = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Return to Menu Warga Hub
  const handleBackToMenuWarga = () => {
    setActivePage('menu_hub');
    setSubmittedTicket(null);
    setFormError('');
    scrollToTopSmooth();
  };

  // Open a Main Menu (from the 10-item 🏛️ PELAYANAN DIGITAL KELURAHAN) on a NEW page
  const handleOpenMainMenuPage = (menu: MainMenuCardConfig) => {
    setActiveMainMenu(menu.id);
    setSubmittedTicket(null);
    setFormError('');
    if (menu.id === 'cek_status') {
      setActivePage('cek_status_page');
    } else if (menu.id === 'pengumuman') {
      setActivePage('pengumuman_page');
    } else if (menu.id === 'hubungi_kelurahan') {
      setActivePage('hubungi_page');
    } else if (menu.defaultCategory) {
      const targetGroup = catalogGroups.find((g) => g.id === menu.defaultCategory);
      if (targetGroup && targetGroup.items.length > 0) {
        setSelectedCategoryId(targetGroup.id);
        setSelectedSubItemId(targetGroup.items[0].id);
        setUrgency(targetGroup.items[0].defaultUrgency);
      }
      setActivePage('category_page');
    }
    scrollToTopSmooth();
  };

  // Open a Category Page on a NEW page
  const handleOpenCategoryPage = (group: ServiceCategoryGroup) => {
    setSelectedCategoryId(group.id);
    setActiveMainMenu(group.linkedMainMenu);
    if (group.items.length > 0) {
      setSelectedSubItemId(group.items[0].id);
      setUrgency(group.items[0].defaultUrgency);
    }
    setSubmittedTicket(null);
    setFormError('');
    setActivePage('category_page');
    scrollToTopSmooth();
  };

  // Open a specific Sub-Menu directly on its own NEW page
  const handleOpenSubMenuPage = (catId: DetailedCategoryId, subItem: ServiceSubItem) => {
    const catGroup = catalogGroups.find((c) => c.id === catId);
    setSelectedCategoryId(catId);
    setSelectedSubItemId(subItem.id);
    setUrgency(subItem.defaultUrgency);
    setSubmittedTicket(null);
    setFormError('');
    setCheckedReqs({});
    const initialSpecific: Record<string, string> = {};
    subItem.specificFields.forEach((f) => {
      if (f.type === 'select' && f.options && f.options.length > 0) {
        initialSpecific[f.key] = f.options[0];
      } else {
        initialSpecific[f.key] = '';
      }
    });
    setSpecificFieldValues(initialSpecific);
    if (catGroup) {
      setActiveMainMenu(catGroup.linkedMainMenu);
    }
    setActivePage('sub_menu_page');
    scrollToTopSmooth();
  };

  const RW_OPTIONS =
    rwGroups.length > 0 ? rwGroups.map((g) => g.rwCode) : DEFAULT_RW_OPTIONS;
  const selectedRwGroup = rwGroups.find((g) => g.rwCode === rw);
  const RT_OPTIONS =
    selectedRwGroup && Array.isArray(selectedRwGroup.rtList) && selectedRwGroup.rtList.length > 0
      ? selectedRwGroup.rtList.map((item) => item.rtCode)
      : DEFAULT_RT_OPTIONS;

  const selectedWaRecipient =
    activeRecipients.find((r) => r.id === selectedWaRecipientId) || preferredRecipient;

  const handleRwChange = (newRw: string) => {
    setRw(newRw);
    if (LANDMARK_PRESETS[newRw]) {
      setLocationName(LANDMARK_PRESETS[newRw].label);
    } else {
      const rwObj = rwGroups.find((g) => g.rwCode === newRw);
      if (rwObj?.areaDescription) {
        setLocationName(rwObj.areaDescription);
      }
    }
    const rwSpecificRecipient = activeRecipients.find((r) => r.rwScope === newRw);
    if (rwSpecificRecipient) {
      setSelectedWaRecipientId(rwSpecificRecipient.id);
    }
  };

  const handleCitizenPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    try {
      const compressed = await compressImageFile(file);
      setSelectedPhoto(compressed);
    } catch {
      // ignore
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reporterName.trim() || !description.trim() || !locationName.trim()) {
      setFormError(
        'Mohon lengkapi Nama Lengkap Pemohon/Pelapor, Alamat/Lokasi, dan Keperluan/Rincian Pengajuan.'
      );
      return;
    }
    setFormError('');
    const preset = LANDMARK_PRESETS[rw] || LANDMARK_PRESETS['RW 02'];
    const composedTitle = customTitle.trim()
      ? `[${currentCategoryObj.title} — ${currentSubItemObj.label}] ${customTitle.trim()}`
      : `${currentSubItemObj.label} (${currentCategoryObj.title})`;

    const specificDetailsSummary = currentSubItemObj.specificFields
      .map((field) => {
        const val = specificFieldValues[field.key]?.trim();
        return val ? `${field.label}: ${val}` : null;
      })
      .filter(Boolean)
      .join(' | ');

    const baseParts = [
      `Layanan: ${currentCategoryObj.title} › ${currentSubItemObj.label}`,
      applicantNik.trim() ? `NIK/KK: ${applicantNik.trim()}` : null,
      specificDetailsSummary || null,
    ].filter(Boolean);

    const composedDescription = `${baseParts.join(' | ')} — ${description.trim()}`;

    const cleanPayload = {
      title: composedTitle,
      description: composedDescription,
      category: currentSubItemObj.reportCategory,
      urgency,
      reporterName: reporterName.trim(),
      reporterPhone: reporterPhone.trim() || '0812-xxxx-xxxx',
      rw,
      rt,
      locationName: locationName.trim(),
      mapX: preset.x + Math.floor(Math.random() * 6 - 3),
      mapY: preset.y + Math.floor(Math.random() * 6 - 3),
      coordinatesLabel: preset.coords,
      imageUrl: selectedPhoto,
      serviceCategoryId: currentCategoryObj.id,
      serviceCategoryTitle: currentCategoryObj.title,
      serviceSubItemId: currentSubItemObj.id,
      serviceSubItemLabel: currentSubItemObj.label,
      documentCode: currentSubItemObj.documentCode,
      officialHeaderTitle: currentSubItemObj.officialHeaderTitle,
      processingUnit: currentSubItemObj.processingUnit,
      applicantNik: applicantNik.trim() || undefined,
      specificFieldsData: { ...specificFieldValues },
    };
    const ticket = onAddReport(cleanPayload);
    const submittedData = {
      ...cleanPayload,
      ticketCode: ticket,
      recipientId: selectedWaRecipient?.id || '',
    };
    setSubmittedTicket(ticket);
    setLastSubmittedReport(submittedData);
    setCustomTitle('');
    setDescription('');

    fetch('/api/reports/dispatch-whatsapp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ticketCode: ticket,
        report: submittedData,
      }),
    }).catch(() => {
      // Offline / local fallback handled seamlessly
    });

    if (autoSendWhatsApp && selectedWaRecipient) {
      const waMessage = buildReportWhatsAppMessage(
        submittedData,
        null,
        activeRecipients
      );
      const waUrl = buildWhatsAppUrl(selectedWaRecipient.phoneNumber, waMessage);
      triggerWhatsAppRedirect(waUrl);
    }
  };

  const filteredReports = reports.filter((r) => {
    const matchesSearch =
      r.ticketCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.reporterName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.locationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.rw.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'Semua' || r.category === filterCategory;
    const matchesStatus = filterStatus === 'Semua' || r.status === filterStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Filter categories and sub-items on the Menu Hub when searching
  const filteredCategoryGroups = catalogGroups.map((group) => {
    if (!hubSearchQuery.trim()) return group;
    const q = hubSearchQuery.toLowerCase();
    const groupMatches =
      group.title.toLowerCase().includes(q) || group.subtitle.toLowerCase().includes(q);
    const matchingItems = group.items.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.officialHeaderTitle.toLowerCase().includes(q)
    );
    if (groupMatches) return group;
    return { ...group, items: matchingItems };
  }).filter((g) => g.items.length > 0);

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 space-y-6">
      {/* =====================================================================================
          HALAMAN 1: MENU WARGA HUB (TAMPILAN UTAMA GRID CARD RAPI TANPA ISI MENU DI BAWAH)
      ===================================================================================== */}
      {activePage === 'menu_hub' && (
        <div className="space-y-7">
          {/* Top Banner Header Menu Warga */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="bg-gradient-to-r from-[#0D3868] via-[#134B8A] to-[#0277BD] px-5 sm:px-8 py-6 text-white flex flex-col lg:flex-row lg:items-center justify-between gap-5">
              <div className="space-y-1.5">
                <button
                  type="button"
                  onClick={() => onNavigate('beranda')}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-200 hover:text-white mb-1 cursor-pointer transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Kembali ke Halaman Utama Portal</span>
                </button>
                <div className="text-xs font-bold tracking-wider uppercase text-amber-300">
                  🏛️ PELAYANAN DIGITAL KELURAHAN · KEC. PANAKKUKANG · KOTA MAKASSAR
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                  Menu Warga Kelurahan Panaikang
                </h1>
                <p className="text-xs sm:text-sm text-sky-100 max-w-3xl leading-relaxed">
                  Pilih salah satu menu utama atau sub-menu layanan di bawah ini. Setiap layanan
                  yang Anda pilih akan langsung terbuka pada <strong>halaman baru tersendiri</strong>{' '}
                  agar pengisian surat dan pengaduan lebih fokus, rapi, dan nyaman.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setActivePage('cek_status_page');
                    scrollToTopSmooth();
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold border border-emerald-400/40 shadow-xs transition-colors cursor-pointer"
                >
                  <Search className="w-4 h-4" />
                  <span>🔎 Cek Status Pengajuan ({reports.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActivePage('hubungi_page');
                    scrollToTopSmooth();
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-extrabold border border-white/25 transition-colors cursor-pointer"
                >
                  <PhoneCall className="w-4 h-4" />
                  <span>📞 Hubungi Kelurahan</span>
                </button>
              </div>
            </div>

            {/* 10 Menu Utama 🏛️ PELAYANAN DIGITAL KELURAHAN */}
            <div className="p-5 sm:p-7 bg-slate-50/80 border-b border-slate-200/80">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-[#0D3868]" />
                  <h2 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-[#0D3868]">
                    🏛️ Pelayanan Digital Kelurahan (10 Menu Utama)
                  </h2>
                </div>
                <span className="text-xs text-slate-500">
                  Klik kartu menu untuk membuka halaman layanan terkait
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {MAIN_WARGA_MENUS.map((menu) => (
                  <button
                    key={menu.id}
                    type="button"
                    onClick={() => handleOpenMainMenuPage(menu)}
                    className="group text-left p-4 rounded-2xl bg-white border border-slate-200/90 hover:border-[#0277BD] hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="w-10 h-10 rounded-xl bg-slate-100 group-hover:bg-sky-50 flex items-center justify-center text-xl select-none transition-colors">
                        {menu.emoji}
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-[#0277BD] group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
                    </div>
                    <div className="mt-3">
                      <div className="text-xs sm:text-sm font-extrabold text-[#0D3868] group-hover:text-[#0277BD] leading-snug transition-colors">
                        {menu.label}
                      </div>
                      <div className="mt-1 text-[11px] text-slate-500 leading-tight line-clamp-2">
                        {menu.shortDesc}
                      </div>
                      <div className="mt-2 pt-2 border-t border-slate-100 text-[11px] font-bold text-[#0277BD] flex items-center justify-between">
                        <span>{menu.badgeText}</span>
                        <span>Buka →</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Search Filter Bar for 7 Categories & 44 Sub-Menus */}
            <div className="px-5 sm:px-7 py-4 bg-white flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h2 className="text-base sm:text-lg font-extrabold text-[#0D3868]">
                  Katalog Grid 7 Kategori Layanan & 44 Sub-Menu Warga
                </h2>
                <p className="text-xs text-slate-600">
                  Klik langsung salah satu sub-menu di dalam kartu kategori untuk membuka halaman
                  formulir layanan tersebut.
                </p>
              </div>
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={hubSearchQuery}
                  onChange={(e) => setHubSearchQuery(e.target.value)}
                  placeholder="Cari layanan (mis. SKTM, KTP, UMKM, Banjir)..."
                  className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:border-[#0277BD] focus:outline-none"
                />
                {hubSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setHubSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* GRID CARD 7 KATEGORI LAYANAN BESERTA IKON & DAFTAR SUB-MENU */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredCategoryGroups.map((group) => (
              <div
                key={group.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
              >
                <div>
                  {/* Card Header with Representative Category Icon */}
                  <div className={`p-5 border-b ${group.accentBorder} ${group.accentBg}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-11 h-11 rounded-xl ${group.iconBg} flex items-center justify-center shrink-0 shadow-xs`}
                        >
                          {renderCategoryIcon(group.iconName, 'w-5 h-5')}
                        </div>
                        <div>
                          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                            Kategori {group.number} · {group.items.length} Sub-Menu
                          </div>
                          <h3 className="text-base sm:text-lg font-extrabold text-[#0D3868] leading-snug">
                            {group.title}
                          </h3>
                        </div>
                      </div>
                    </div>
                    <p className="mt-2.5 text-xs text-slate-600 leading-relaxed">
                      {group.subtitle}
                    </p>
                  </div>

                  {/* Interactive Sub-Menu List inside the Grid Card */}
                  <div className="p-4 sm:p-5">
                    <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-2.5">
                      Pilih Sub-Menu Layanan (Buka Halaman Baru):
                    </div>
                    <ul className="space-y-1.5">
                      {group.items.map((item, idx) => (
                        <li key={item.id}>
                          <button
                            type="button"
                            onClick={() => handleOpenSubMenuPage(group.id, item)}
                            className="w-full text-left px-3 py-2 rounded-xl border border-slate-200/80 bg-slate-50/60 hover:bg-[#0D3868] hover:text-white hover:border-[#0D3868] text-slate-800 transition-all cursor-pointer flex items-center justify-between gap-2.5 group"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="w-5 h-5 rounded-md bg-white group-hover:bg-white/20 text-[#0D3868] group-hover:text-white border border-slate-200/80 group-hover:border-transparent text-[11px] font-mono-num font-bold flex items-center justify-center shrink-0">
                                {idx + 1}
                              </span>
                              <span className="text-xs font-bold leading-snug truncate">
                                {item.label}
                              </span>
                            </div>
                            <ChevronRight className="w-3.5 h-3.5 shrink-0 text-slate-400 group-hover:text-amber-300 group-hover:translate-x-0.5 transition-transform" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Card Footer: Open Full Category Page */}
                <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 font-medium">
                    Gratis · Terhubung WA Petugas
                  </span>
                  <button
                    type="button"
                    onClick={() => handleOpenCategoryPage(group)}
                    className="inline-flex items-center gap-1 text-xs font-extrabold text-[#0277BD] hover:text-[#0D3868] cursor-pointer"
                  >
                    <FolderOpen className="w-3.5 h-3.5" />
                    <span>Buka Halaman Kategori →</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =====================================================================================
          HALAMAN 2: HALAMAN BARU KATEGORI LAYANAN (DAFTAR KARTU SUB-MENU DALAM 1 KATEGORI)
      ===================================================================================== */}
      {activePage === 'category_page' && (
        <div className="space-y-6">
          {/* Top Navigation Bar with Back to Menu Warga Button */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 shadow-xs">
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleBackToMenuWarga}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0D3868] hover:bg-[#0277BD] text-white text-xs sm:text-sm font-extrabold transition-colors cursor-pointer shadow-xs"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Kembali ke Menu Warga</span>
              </button>
              <div className="text-xs text-slate-500 hidden sm:flex items-center gap-1.5">
                <span>Menu Warga</span>
                <span aria-hidden="true">/</span>
                <span className="font-bold text-[#0D3868]">
                  {currentCategoryObj.number}. {currentCategoryObj.title}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setActivePage('cek_status_page');
                scrollToTopSmooth();
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold cursor-pointer"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Cek Status Pengajuan</span>
            </button>
          </div>

          {/* Category Hero Header */}
          <div
            className={`rounded-3xl border ${currentCategoryObj.accentBorder} ${currentCategoryObj.accentBg} p-6 sm:p-7 flex flex-col md:flex-row md:items-center justify-between gap-4`}
          >
            <div className="flex items-start gap-4">
              <div
                className={`w-14 h-14 rounded-2xl ${currentCategoryObj.iconBg} flex items-center justify-center shrink-0 shadow-sm`}
              >
                {renderCategoryIcon(currentCategoryObj.iconName, 'w-7 h-7')}
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Kategori Layanan {currentCategoryObj.number} · Kelurahan Panaikang
                </div>
                <h1 className="mt-0.5 text-xl sm:text-2xl font-extrabold text-[#0D3868]">
                  {currentCategoryObj.title}
                </h1>
                <p className="mt-1 text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
                  {currentCategoryObj.subtitle}
                </p>
              </div>
            </div>
            <div className="text-xs font-bold text-[#0D3868] bg-white px-4 py-2.5 rounded-xl border border-slate-200 self-start md:self-center shrink-0">
              Total {currentCategoryObj.items.length} Sub-Menu Tersedia
            </div>
          </div>

          {/* Grid Cards of Sub-Menus in this Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentCategoryObj.items.map((item, idx) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col justify-between hover:border-[#0277BD] hover:shadow-md transition-all"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className="w-7 h-7 rounded-lg bg-[#0D3868] text-white font-mono-num text-xs font-extrabold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <div>
                        <div className="text-[11px] font-mono-num text-slate-500">
                          Kode: {item.documentCode}
                        </div>
                        <h3 className="text-base font-extrabold text-[#0D3868] leading-snug">
                          {item.label}
                        </h3>
                      </div>
                    </div>
                  </div>

                  <div className="text-xs text-slate-600 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#0277BD] shrink-0" />
                    <span>Estimasi:</span>
                    <strong className="text-slate-800">{item.estimation}</strong>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                    <div className="text-[11px] font-bold text-slate-700 mb-1.5">
                      Persyaratan Utama:
                    </div>
                    <ul className="space-y-1">
                      {item.requirements.map((req) => (
                        <li
                          key={req}
                          className="text-xs text-slate-600 flex items-start gap-1.5 leading-snug"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-500 truncate">{item.processingUnit}</span>
                  <button
                    type="button"
                    onClick={() => handleOpenSubMenuPage(currentCategoryObj.id, item)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0D3868] hover:bg-[#0277BD] text-white text-xs font-extrabold transition-colors cursor-pointer shrink-0"
                  >
                    <span>Pilih & Buka Halaman Baru</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Back Button */}
          <div className="pt-2 flex items-center justify-between">
            <button
              type="button"
              onClick={handleBackToMenuWarga}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-[#0D3868] border border-slate-300 text-xs sm:text-sm font-extrabold transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Menu Warga</span>
            </button>
          </div>
        </div>
      )}

      {/* =====================================================================================
          HALAMAN 3: HALAMAN BARU SUB-MENU TERPILIH (LENGKAP DENGAN SOP, FORM SPESIFIK & DRAF)
      ===================================================================================== */}
      {activePage === 'sub_menu_page' && (
        <div className="space-y-6">
          {/* Top Bar: Prominent "Kembali ke Menu Warga" Button */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 shadow-xs">
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={handleBackToMenuWarga}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0D3868] hover:bg-[#0277BD] text-white text-xs sm:text-sm font-extrabold transition-colors cursor-pointer shadow-xs"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Kembali ke Menu Warga</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActivePage('category_page');
                  scrollToTopSmooth();
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Sub-Menu {currentCategoryObj.title}</span>
              </button>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>Kategori {currentCategoryObj.number}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono-num font-bold text-[#0277BD]">
                {currentSubItemObj.documentCode}
              </span>
            </div>
          </div>

          {/* Dedicated Sub-Menu Page Banner */}
          <div className="bg-gradient-to-r from-[#0D3868] via-[#134B8A] to-[#0277BD] rounded-3xl p-6 sm:p-7 text-white flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center shrink-0">
                {renderCategoryIcon(currentCategoryObj.iconName, 'w-6 h-6 text-amber-300')}
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-amber-300">
                  {currentCategoryObj.number}. {currentCategoryObj.title} ·{' '}
                  {currentSubItemObj.processingUnit}
                </div>
                <h1 className="mt-1 text-xl sm:text-2xl font-extrabold text-white">
                  {currentSubItemObj.label}
                </h1>
                <p className="mt-1 text-xs sm:text-sm text-sky-100">
                  {currentSubItemObj.officialHeaderTitle} — Estimasi Pelayanan:{' '}
                  <strong className="text-white">{currentSubItemObj.estimation}</strong>
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowDraftPreview((prev) => !prev)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-extrabold transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>
                  {showDraftPreview ? 'Sembunyikan Pratinjau Surat' : 'Pratinjau & Cetak Draf Surat'}
                </span>
              </button>
            </div>
          </div>

          {/* Main 2-Column Layout for the Selected Sub-Menu Page */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT COLUMN (5 Cols): Checklist Persyaratan Interaktif, Alur SOP & Pilih Sub-Menu Sebidang */}
            <div className="lg:col-span-5 space-y-5">
              {/* Interactive Requirements Checklist Card */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
                <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <ClipboardCheck className="w-4 h-4 text-[#0277BD]" />
                    <h2 className="text-sm font-extrabold text-[#0D3868]">
                      Checklist Persyaratan Dokumen
                    </h2>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-700">
                    Gratis / Tanpa Biaya
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  Centang dokumen pendukung yang telah Anda siapkan untuk pengajuan{' '}
                  <strong>{currentSubItemObj.label}</strong>:
                </p>

                <div className="space-y-2">
                  {currentSubItemObj.requirements.map((req, idx) => {
                    const isChecked = Boolean(checkedReqs[req]);
                    return (
                      <label
                        key={idx}
                        className={`flex items-start gap-2.5 p-3 rounded-xl border text-xs cursor-pointer transition-colors ${
                          isChecked
                            ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950 font-semibold'
                            : 'bg-slate-50 border-slate-200/80 text-slate-700 hover:bg-slate-100/80'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) =>
                            setCheckedReqs((prev) => ({ ...prev, [req]: e.target.checked }))
                          }
                          className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="leading-snug">{req}</span>
                      </label>
                    );
                  })}
                </div>

                {/* 3-Step SOP */}
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <div className="text-xs font-extrabold text-[#0D3868]">
                    Alur Standar Operasional Prosedur (SOP):
                  </div>
                  <ol className="space-y-2">
                    {currentSubItemObj.sopSteps.map((step, sIdx) => (
                      <li
                        key={sIdx}
                        className="flex items-start gap-2.5 text-xs text-slate-600 leading-relaxed"
                      >
                        <span className="w-5 h-5 rounded-full bg-sky-100 text-[#0D3868] font-mono-num text-[11px] font-extrabold flex items-center justify-center shrink-0 mt-0.5">
                          {sIdx + 1}
                        </span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                {/* Internal WhatsApp Privacy Notice */}
                <div className="pt-3 border-t border-slate-100 flex items-start gap-2.5 text-[11px] text-slate-600">
                  <Lock className="w-4 h-4 text-[#128C7E] shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    Terintegrasi otomatis dengan{' '}
                    <strong>{activeRecipients.length} nomor WhatsApp penerima resmi</strong> di
                    Kelurahan Panaikang. Nomor telepon penerima hanya ditampilkan di Halaman Admin.
                  </p>
                </div>
              </div>

              {/* Quick Sub-Menu Switcher within same Category */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                    Sub-Menu Lain di {currentCategoryObj.title}
                  </h3>
                  <button
                    type="button"
                    onClick={handleBackToMenuWarga}
                    className="text-xs font-bold text-[#0277BD] hover:underline cursor-pointer"
                  >
                    Semua Kategori
                  </button>
                </div>
                <div className="space-y-1.5">
                  {currentCategoryObj.items.map((item, idx) => {
                    const isCurrent = item.id === currentSubItemObj.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleOpenSubMenuPage(currentCategoryObj.id, item)}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-between gap-2 ${
                          isCurrent
                            ? 'bg-[#0D3868] text-white'
                            : 'bg-slate-50 hover:bg-sky-50 text-slate-700 border border-slate-200/70'
                        }`}
                      >
                        <span className="truncate">
                          {idx + 1}. {item.label}
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-75" />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN (7 Cols): Formulir Spesifik Sub-Menu + Pratinjau Draf Resmi */}
            <div className="lg:col-span-7 space-y-6">
              {/* Interactive Official Draft Preview (Collapsible / Printable) */}
              {showDraftPreview && (
                <div className="bg-white rounded-2xl border-2 border-[#0D3868] p-6 space-y-4 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200">
                    <div className="text-xs font-extrabold uppercase tracking-wider text-[#0D3868]">
                      Pratinjau Draf Dokumen / Bukti Registrasi Kelurahan
                    </div>
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#0D3868] hover:bg-[#0277BD] text-white text-xs font-bold cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Cetak / Simpan PDF</span>
                    </button>
                  </div>

                  <div className="p-5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 space-y-3 font-serif">
                    <div className="text-center border-b-2 border-slate-800 pb-3">
                      <div className="text-xs font-bold uppercase tracking-widest">
                        PEMERINTAH KOTA MAKASSAR · KECAMATAN PANAKKUKANG
                      </div>
                      <div className="text-base font-extrabold uppercase">
                        KELURAHAN PANAIKANG
                      </div>
                      <div className="text-[11px] text-slate-600 font-sans">
                        {kelurahanProfile.officeAddress} · Telp: {kelurahanProfile.phoneContact}
                      </div>
                    </div>

                    <div className="text-center pt-1">
                      <div className="text-xs font-bold underline uppercase">
                        {currentSubItemObj.officialHeaderTitle}
                      </div>
                      <div className="text-[11px] font-mono-num text-slate-600 font-sans mt-0.5">
                        Nomor Registrasi: {submittedTicket || 'REG-ONLINE'} /{' '}
                        {currentSubItemObj.documentCode} / {new Date().getFullYear()}
                      </div>
                    </div>

                    <div className="text-xs space-y-1.5 font-sans pt-2">
                      <div className="grid grid-cols-3 gap-2">
                        <span className="text-slate-500">Nama Pemohon / Pelapor</span>
                        <span className="col-span-2 font-bold">
                          : {reporterName || '[Nama Lengkap Pemohon]'}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <span className="text-slate-500">NIK / Nomor KK</span>
                        <span className="col-span-2 font-mono-num">
                          : {applicantNik || '[16 Digit NIK / KK]'}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <span className="text-slate-500">Alamat / Wilayah RT-RW</span>
                        <span className="col-span-2">
                          : {locationName} ({rt} / {rw})
                        </span>
                      </div>
                      {currentSubItemObj.specificFields.map((f) => (
                        <div key={f.key} className="grid grid-cols-3 gap-2">
                          <span className="text-slate-500">{f.label}</span>
                          <span className="col-span-2 font-semibold">
                            : {specificFieldValues[f.key] || '-'}
                          </span>
                        </div>
                      ))}
                      <div className="grid grid-cols-3 gap-2">
                        <span className="text-slate-500">Rincian Keperluan</span>
                        <span className="col-span-2">
                          : {description || currentSubItemObj.placeholderNote}
                        </span>
                      </div>
                    </div>

                    <div className="pt-4 flex justify-between items-end text-[11px] font-sans border-t border-slate-200">
                      <div className="text-slate-500">
                        Unit Pelaksana: <strong>{currentSubItemObj.processingUnit}</strong>
                      </div>
                      <div className="text-right">
                        <div>Makassar, {new Date().toLocaleDateString('id-ID')}</div>
                        <div className="font-bold text-slate-800 mt-4">
                          {kelurahanProfile.lurahName}
                        </div>
                        <div className="text-[10px] text-slate-500">Lurah Panaikang</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Formulir Pengajuan / Laporan Spesifik Sub-Menu */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7">
                <div className="pb-4 border-b border-slate-100">
                  <div className="text-xs font-extrabold uppercase tracking-wider text-[#0277BD]">
                    Formulir Pengajuan & Pelayanan Digital Warga
                  </div>
                  <h2 className="mt-1 text-lg sm:text-xl font-extrabold text-[#0D3868]">
                    {currentSubItemObj.label}
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Bidang: <strong>{currentCategoryObj.title}</strong> · Kode Layanan:{' '}
                    <span className="font-mono-num">{currentSubItemObj.documentCode}</span>
                  </p>
                </div>

                {submittedTicket && (
                  <div className="mt-5 p-4 sm:p-5 rounded-2xl bg-emerald-50 border-2 border-emerald-300 text-emerald-950 space-y-3.5">
                    <div className="flex items-start gap-3">
                      <FileCheck2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <div className="text-sm font-extrabold text-emerald-900">
                          Pengajuan "{currentSubItemObj.label}" Berhasil Tersimpan!
                        </div>
                        <p className="mt-1 text-xs text-emerald-800 leading-relaxed">
                          Nomor Tiket Layanan Anda:{' '}
                          <span className="font-mono-num font-bold underline">
                            {submittedTicket}
                          </span>
                          . Pengajuan telah masuk ke Dashboard Petugas Kelurahan Panaikang dan
                          diteruskan otomatis ke seluruh ({activeRecipients.length}) nomor WhatsApp
                          penerima terdaftar di halaman Administrator.
                        </p>

                        {lastSubmittedReport && (
                          <div className="mt-3 p-3.5 rounded-xl bg-white border border-emerald-200 flex flex-wrap items-center justify-between gap-2.5">
                            <div className="flex items-center gap-2 text-xs text-slate-700">
                              <div className="w-7 h-7 rounded-lg bg-[#25D366]/15 text-[#128C7E] flex items-center justify-center shrink-0">
                                <MessageCircle className="w-4 h-4" />
                              </div>
                              <span>
                                Terdistribusi otomatis ke{' '}
                                <strong>{activeRecipients.length} Nomor Penerima Terdaftar</strong>
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                const msg = buildReportWhatsAppMessage(
                                  lastSubmittedReport,
                                  null,
                                  activeRecipients
                                );
                                navigator.clipboard?.writeText(msg);
                                setCopiedWaText(true);
                                window.setTimeout(() => setCopiedWaText(false), 2500);
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
                            >
                              {copiedWaText ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>Bukti Pengajuan Tersalin</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" />
                                  <span>Salin Bukti Pengajuan</span>
                                </>
                              )}
                            </button>
                          </div>
                        )}

                        <div className="mt-3 flex flex-wrap items-center gap-2.5">
                          <button
                            type="button"
                            onClick={() => {
                              setActivePage('cek_status_page');
                              scrollToTopSmooth();
                            }}
                            className="px-3.5 py-1.5 rounded-lg bg-emerald-700 text-white text-xs font-semibold hover:bg-emerald-800 transition-colors cursor-pointer"
                          >
                            🔎 Cek Status Pengajuan
                          </button>
                          <button
                            type="button"
                            onClick={handleBackToMenuWarga}
                            className="px-3.5 py-1.5 rounded-lg bg-white border border-emerald-300 text-emerald-800 text-xs font-semibold hover:bg-emerald-100 transition-colors cursor-pointer"
                          >
                            ← Kembali ke Menu Warga
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {formError && (
                  <div className="mt-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs font-medium text-red-800">
                    {formError}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                  {/* Identitas Pemohon / Pelapor */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Nama Lengkap Pemohon / Pelapor *
                      </label>
                      <input
                        type="text"
                        value={reporterName}
                        onChange={(e) => setReporterName(e.target.value)}
                        placeholder="Contoh: Muh. Rizal Dg. Sikki"
                        className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-[#0277BD] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        NIK / Nomor KK
                      </label>
                      <input
                        type="text"
                        value={applicantNik}
                        onChange={(e) => setApplicantNik(e.target.value)}
                        placeholder="16 digit NIK / KK"
                        className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-[#0277BD] focus:outline-none font-mono-num"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Nomor WhatsApp Aktif *
                      </label>
                      <input
                        type="tel"
                        value={reporterPhone}
                        onChange={(e) => setReporterPhone(e.target.value)}
                        placeholder="Contoh: 0812-4210-xxxx"
                        className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-[#0277BD] focus:outline-none font-mono-num"
                      />
                    </div>
                  </div>

                  {/* Wilayah RW / RT / Alamat */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Wilayah RW *
                      </label>
                      <select
                        value={rw}
                        onChange={(e) => handleRwChange(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-900 bg-white focus:border-[#0277BD] focus:outline-none"
                      >
                        {RW_OPTIONS.map((item) => (
                          <option key={item} value={item}>
                            {item}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Wilayah RT *
                      </label>
                      <select
                        value={rt}
                        onChange={(e) => setRt(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-900 bg-white focus:border-[#0277BD] focus:outline-none"
                      >
                        {RT_OPTIONS.map((item) => (
                          <option key={item} value={item}>
                            {item}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Alamat Domisili / Lokasi di Kelurahan Panaikang *
                      </label>
                      <input
                        type="text"
                        value={locationName}
                        onChange={(e) => setLocationName(e.target.value)}
                        placeholder="Contoh: Jl. Urip Sumoharjo / Jl. Sukaria Lr. 2"
                        className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-[#0277BD] focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* KOLOM INPUT SPESIFIK SESUAI SUB-MENU YANG DIPILIH */}
                  {currentSubItemObj.specificFields.length > 0 && (
                    <div className="p-4 rounded-2xl bg-sky-50/60 border border-sky-200/80 space-y-3.5">
                      <div className="text-xs font-extrabold uppercase tracking-wider text-[#0D3868]">
                        Data Khusus Layanan: {currentSubItemObj.label}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        {currentSubItemObj.specificFields.map((field) => (
                          <div key={field.key}>
                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                              {field.label}
                            </label>
                            {field.type === 'select' && field.options ? (
                              <select
                                value={specificFieldValues[field.key] || field.options[0]}
                                onChange={(e) =>
                                  setSpecificFieldValues((prev) => ({
                                    ...prev,
                                    [field.key]: e.target.value,
                                  }))
                                }
                                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-900 bg-white focus:border-[#0277BD] focus:outline-none"
                              >
                                {field.options.map((opt) => (
                                  <option key={opt} value={opt}>
                                    {opt}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <input
                                type="text"
                                value={specificFieldValues[field.key] || ''}
                                onChange={(e) =>
                                  setSpecificFieldValues((prev) => ({
                                    ...prev,
                                    [field.key]: e.target.value,
                                  }))
                                }
                                placeholder={field.placeholder}
                                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 bg-white focus:border-[#0277BD] focus:outline-none"
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Rincian Keperluan Surat / Kronologi Lengkap *
                    </label>
                    <textarea
                      rows={3}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder={currentSubItemObj.placeholderNote}
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-[#0277BD] focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Tingkat Prioritas Layanan
                      </label>
                      <div className="flex items-center gap-2">
                        {(['Normal', 'Tinggi', 'Darurat'] as ReportUrgency[]).map((level) => (
                          <button
                            key={level}
                            type="button"
                            onClick={() => setUrgency(level)}
                            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                              urgency === level
                                ? 'bg-[#0D3868] text-white border-[#0D3868]'
                                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {level}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Lampiran Foto / Dokumen Pengantar
                      </label>
                      <div className="flex items-center gap-1.5">
                        {[
                          { label: 'Lokasi/Drainase', url: IMG_DRAINASE },
                          { label: 'Lingkungan', url: IMG_BANK_SAMPAH },
                          { label: 'Berkas/Warga', url: IMG_KERJA_BAKTI },
                        ].map((item) => (
                          <button
                            key={item.label}
                            type="button"
                            onClick={() => setSelectedPhoto(item.url)}
                            className={`flex-1 py-2 px-2 rounded-xl text-[11px] font-semibold border transition-colors whitespace-nowrap cursor-pointer ${
                              selectedPhoto === item.url
                                ? 'bg-sky-50 text-[#0277BD] border-[#0277BD]'
                                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {item.label}
                          </button>
                        ))}
                        <label className="inline-flex items-center justify-center gap-1 py-2 px-2.5 rounded-xl text-xs font-bold border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 cursor-pointer whitespace-nowrap">
                          <Upload className="w-3.5 h-3.5" />
                          <span>Unggah</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleCitizenPhotoUpload}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Distribusi Otomatis ke Seluruh Nomor WhatsApp Terdaftar */}
                  <div className="p-4 rounded-2xl bg-[#25D366]/10 border border-[#128C7E]/30">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <div className="flex items-start gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-[#128C7E] text-white flex items-center justify-center shrink-0 mt-0.5">
                          <MessageCircle className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs sm:text-sm font-extrabold text-[#075E54]">
                            Terhubung Otomatis ke WhatsApp Pelayanan Kelurahan
                          </div>
                          <p className="text-[11px] text-slate-600 leading-relaxed mt-0.5">
                            Pengajuan ini otomatis dikirim ke seluruh ({activeRecipients.length})
                            nomor WhatsApp penerima terdaftar di Halaman Admin tanpa menampilkan
                            nomor di halaman warga.
                          </p>
                        </div>
                      </div>
                      <label className="inline-flex items-center gap-2 text-xs font-bold text-[#075E54] bg-white px-3 py-1.5 rounded-xl border border-emerald-300 cursor-pointer self-start sm:self-auto shrink-0">
                        <input
                          type="checkbox"
                          checked={autoSendWhatsApp}
                          onChange={(e) => setAutoSendWhatsApp(e.target.checked)}
                          className="rounded text-[#128C7E] focus:ring-[#128C7E]"
                        />
                        <span>Kirim Otomatis via WA</span>
                      </label>
                    </div>
                  </div>

                  <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                    <button
                      type="submit"
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#128C7E] hover:bg-[#075E54] text-white text-sm font-bold shadow-xs transition-colors cursor-pointer"
                    >
                      <Send className="w-4 h-4" />
                      <span>Kirim Pengajuan ({currentSubItemObj.label})</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleBackToMenuWarga}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Kembali ke Menu Warga</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Contextual Info when on Masalah Lingkungan Sub-Menu */}
              {selectedCategoryId === 'masalah_lingkungan' && (
                <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <h3 className="text-sm sm:text-base font-extrabold text-[#0D3868] flex items-center gap-2">
                      <Truck className="w-4 h-4 text-[#1C8237]" />
                      <span>Jadwal Armada Kebersihan & Bank Sampah RW</span>
                    </h3>
                    <button
                      type="button"
                      onClick={() => onNavigate('sampah')}
                      className="text-xs font-bold text-[#0277BD] hover:underline cursor-pointer"
                    >
                      Monitoring Bank Sampah →
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {wasteUnits.slice(0, 4).map((unit) => (
                      <div
                        key={unit.id}
                        className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 space-y-1"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-extrabold text-[#0D3868]">{unit.rw}</span>
                          <span className="font-semibold text-emerald-700">
                            {unit.activeHouseholds} KK Aktif
                          </span>
                        </div>
                        <div className="text-xs font-bold text-slate-900">{unit.unitName}</div>
                        <div className="text-[11px] text-slate-600">
                          Jadwal: <strong>{unit.pickupSchedule}</strong>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Contextual Info when on Sosial Kemasyarakatan Sub-Menu */}
              {selectedCategoryId === 'sosial_kemasyarakatan' && (
                <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <h3 className="text-sm sm:text-base font-extrabold text-[#0D3868] flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-purple-700" />
                      <span>Agenda Kegiatan Kemasyarakatan & Kerja Bakti</span>
                    </h3>
                    <button
                      type="button"
                      onClick={() => onNavigate('kerjabakti')}
                      className="text-xs font-bold text-[#0277BD] hover:underline cursor-pointer"
                    >
                      Lihat Kerja Bakti →
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {cleanupEvents.slice(0, 4).map((ev) => (
                      <div
                        key={ev.id}
                        className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 space-y-1"
                      >
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-[#0D3868]">
                            {ev.rw} · {ev.rtScope}
                          </span>
                          <span className="font-semibold text-emerald-700">{ev.status}</span>
                        </div>
                        <div className="text-xs font-extrabold text-slate-900 line-clamp-1">
                          {ev.title}
                        </div>
                        <div className="text-[11px] text-slate-600">
                          {ev.date} · {ev.timeRange}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================================
          HALAMAN 4: HALAMAN BARU 🔎 CEK STATUS PENGAJUAN & TINDAK LANJUT
      ===================================================================================== */}
      {activePage === 'cek_status_page' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 shadow-xs">
            <button
              type="button"
              onClick={handleBackToMenuWarga}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0D3868] hover:bg-[#0277BD] text-white text-xs sm:text-sm font-extrabold transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Menu Warga</span>
            </button>
            <span className="text-xs font-bold text-slate-500">
              Menu Warga / Cek Status Pengajuan ({reports.length} Tiket)
            </span>
          </div>

          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-lg sm:text-xl font-extrabold text-[#0D3868]">
                  🔎 Cek Status Pengajuan Surat & Laporan Warga
                </h2>
                <p className="text-xs sm:text-sm text-slate-600">
                  Lacak progres verifikasi berkas surat pengantar, pelayanan administrasi, maupun
                  tindak lanjut pengaduan lingkungan Anda menggunakan Nomor Tiket atau Nama.
                </p>
              </div>
              <button
                type="button"
                onClick={handleBackToMenuWarga}
                className="self-start sm:self-auto px-3.5 py-2 rounded-xl bg-[#0D3868] text-white text-xs font-bold hover:bg-[#0277BD] transition-colors cursor-pointer"
              >
                + Pilih Layanan Baru di Menu Warga
              </button>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari nomor tiket (mis. PNK-2026-0148), nama pemohon, jenis surat, atau RW..."
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:border-[#0277BD] focus:outline-none"
                />
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
                {(['Semua', 'Menunggu Verifikasi', 'Sedang Ditangani', 'Selesai'] as const).map(
                  (st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setFilterStatus(st)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                        filterStatus === st
                          ? 'bg-[#0277BD] text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {st}
                    </button>
                  )
                )}
              </div>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-slate-100">
              <span className="text-xs font-semibold text-slate-500 mr-1 whitespace-nowrap">
                Filter Kelompok:
              </span>
              {['Semua', ...CATEGORY_OPTIONS].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setFilterCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                    filterCategory === cat
                      ? 'bg-[#0D3868] text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {filteredReports.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-slate-500 text-sm">
                Tidak ditemukan data pengajuan atau laporan yang sesuai dengan kata kunci pencarian.
              </div>
            ) : (
              filteredReports.map((rep) => {
                const isVerified =
                  rep.status === 'Sedang Ditangani' ||
                  rep.status === 'Selesai' ||
                  Boolean(rep.verifiedBy);
                const isInProgress =
                  rep.status === 'Sedang Ditangani' || rep.status === 'Selesai';
                const isCompleted = rep.status === 'Selesai';

                const officerPhotos =
                  Array.isArray(rep.followUpPhotos) && rep.followUpPhotos.length > 0
                    ? rep.followUpPhotos
                    : rep.completionPhotoUrl
                    ? [rep.completionPhotoUrl]
                    : [];

                return (
                  <div
                    key={rep.id}
                    className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-4 shadow-xs"
                  >
                    <div className="flex flex-col md:flex-row gap-4 justify-between">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                          <span className="font-mono-num font-bold text-[#0D3868]">
                            {rep.ticketCode}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="font-medium text-slate-700">{rep.category}</span>
                          <span aria-hidden="true">·</span>
                          <span>
                            {rep.rw} / {rep.rt}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono-num">{rep.createdAt}</span>
                          <span aria-hidden="true">·</span>
                          <span className="inline-flex items-center gap-1 font-bold">
                            {rep.status === 'Selesai' && (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span className="text-emerald-700">Selesai Diproses Petugas</span>
                              </>
                            )}
                            {rep.status === 'Sedang Ditangani' && (
                              <>
                                <Clock className="w-3.5 h-3.5 text-sky-600" />
                                <span className="text-sky-700">Diverifikasi & Sedang Diproses</span>
                              </>
                            )}
                            {rep.status === 'Menunggu Verifikasi' && (
                              <>
                                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                                <span className="text-amber-700">
                                  Menunggu Verifikasi Admin/Operator
                                </span>
                              </>
                            )}
                          </span>
                        </div>

                        <h3 className="text-base sm:text-lg font-extrabold text-[#0D3868]">
                          {rep.title}
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                          {rep.description}
                        </p>

                        <div className="pt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                          <span className="inline-flex items-center gap-1 font-medium text-slate-800">
                            <MapPin className="w-3.5 h-3.5 text-[#0277BD]" />
                            {rep.locationName}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>Pemohon / Pelapor: {rep.reporterName}</span>
                        </div>
                      </div>

                      <div className="flex md:flex-col items-center md:items-end justify-between gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => onUpvoteReport(rep.id)}
                          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-sky-50 hover:border-sky-300 text-xs font-semibold text-slate-800 transition-colors cursor-pointer"
                        >
                          <ThumbsUp className="w-3.5 h-3.5 text-[#0277BD]" />
                          <span>Dukung Prioritas</span>
                          <span className="font-mono-num font-bold text-[#0277BD]">
                            {rep.upvotes}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onNavigate('peta')}
                          className="text-xs font-semibold text-[#0277BD] hover:underline cursor-pointer"
                        >
                          Lihat Titik di Peta →
                        </button>
                      </div>
                    </div>

                    {/* 3-Step Visual Progress Tracker */}
                    <div className="pt-3 border-t border-slate-100">
                      <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mb-2.5 flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-[#1C8237]" />
                        <span>Alur Status Pengajuan & Tindak Lanjut Petugas Kelurahan</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        <div
                          className={`p-3 rounded-xl border text-xs ${
                            isVerified
                              ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                              : 'bg-amber-50/60 border-amber-200 text-amber-950'
                          }`}
                        >
                          <div className="flex items-center justify-between font-bold">
                            <span>1. Verifikasi Berkas / Laporan</span>
                            {isVerified ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <Clock className="w-4 h-4 text-amber-600" />
                            )}
                          </div>
                          <div className="mt-1 text-[11px] text-slate-600">
                            {isVerified
                              ? `Diverifikasi oleh: ${rep.verifiedBy || 'Admin Kelurahan'}`
                              : 'Menunggu pemeriksaan petugas loket / operator'}
                          </div>
                        </div>

                        <div
                          className={`p-3 rounded-xl border text-xs ${
                            isInProgress
                              ? 'bg-sky-50/70 border-sky-200 text-sky-950'
                              : 'bg-slate-50 border-slate-200 text-slate-500'
                          }`}
                        >
                          <div className="flex items-center justify-between font-bold">
                            <span>2. Pemrosesan & Tindak Lanjut</span>
                            {isInProgress ? (
                              <CheckCircle2 className="w-4 h-4 text-[#0277BD]" />
                            ) : (
                              <Clock className="w-4 h-4 text-slate-400" />
                            )}
                          </div>
                          <div className="mt-1 text-[11px]">
                            Unit Pelaksana: <strong>{rep.assignedTeam}</strong>
                          </div>
                        </div>

                        <div
                          className={`p-3 rounded-xl border text-xs ${
                            isCompleted
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                              : 'bg-slate-50 border-slate-200 text-slate-500'
                          }`}
                        >
                          <div className="flex items-center justify-between font-bold">
                            <span>3. Penyelesaian Layanan</span>
                            {isCompleted ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <Clock className="w-4 h-4 text-slate-400" />
                            )}
                          </div>
                          <div className="mt-1 text-[11px]">
                            {isCompleted
                              ? `Tuntas pada: ${rep.completedAt || rep.updatedAt}`
                              : 'Menunggu penyelesaian akhir'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Catatan Tindak Lanjut & Dokumentasi */}
                    <div className="pt-3 border-t border-slate-100 flex flex-col lg:flex-row gap-4 justify-between bg-slate-50/70 -mx-5 sm:-mx-6 -mb-5 sm:-mb-6 p-4 sm:p-5 rounded-b-2xl">
                      <div className="space-y-1.5 flex-1">
                        <div className="text-xs font-bold text-slate-800">
                          Keterangan Tindak Lanjut Petugas ({rep.assignedTeam}):
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">{rep.responseNote}</p>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 shrink-0">
                        <button
                          type="button"
                          onClick={() =>
                            setLightboxImage({
                              url: resolveImageUrl(rep.imageUrl),
                              caption: `Lampiran Pengajuan/Laporan: ${rep.title}`,
                              ticketCode: rep.ticketCode,
                            })
                          }
                          className="group relative w-20 h-16 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shrink-0 cursor-pointer"
                        >
                          <img
                            src={resolveImageUrl(rep.imageUrl)}
                            alt={rep.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <span className="absolute bottom-0 inset-x-0 bg-slate-900/75 text-white text-[9px] font-semibold py-0.5 text-center">
                            Lampiran
                          </span>
                        </button>

                        {officerPhotos.map((photoUrl, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() =>
                              setLightboxImage({
                                url: resolveImageUrl(photoUrl),
                                caption: `Dokumentasi Tindak Lanjut Petugas (#${idx + 1}) — ${rep.title}`,
                                ticketCode: rep.ticketCode,
                              })
                            }
                            className="group relative w-20 h-16 rounded-xl overflow-hidden border-2 border-emerald-400 bg-emerald-50 shrink-0 cursor-pointer"
                          >
                            <img
                              src={resolveImageUrl(photoUrl)}
                              alt={`Bukti Tindak Lanjut ${idx + 1}`}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                            <span className="absolute bottom-0 inset-x-0 bg-emerald-900/85 text-white text-[9px] font-bold py-0.5 text-center flex items-center justify-center gap-0.5">
                              <Camera className="w-2.5 h-2.5" />
                              <span>Bukti #{idx + 1}</span>
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={handleBackToMenuWarga}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-[#0D3868] border border-slate-300 text-xs sm:text-sm font-extrabold transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Menu Warga</span>
            </button>
          </div>
        </div>
      )}

      {/* =====================================================================================
          HALAMAN 5: HALAMAN BARU 📢 PENGUMUMAN KELURAHAN
      ===================================================================================== */}
      {activePage === 'pengumuman_page' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 shadow-xs">
            <button
              type="button"
              onClick={handleBackToMenuWarga}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0D3868] hover:bg-[#0277BD] text-white text-xs sm:text-sm font-extrabold transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Menu Warga</span>
            </button>
            <span className="text-xs font-bold text-slate-500">
              Menu Warga / Pengumuman Resmi Kelurahan Panaikang
            </span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-lg sm:text-xl font-extrabold text-[#0D3868] flex items-center gap-2">
                  <Megaphone className="w-5 h-5 text-[#0277BD]" />
                  <span>📢 Pengumuman Resmi & Informasi Layanan Kelurahan Panaikang</span>
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                  Informasi resmi pelayanan kependudukan, jadwal program bantuan pemerintah,
                  pemberdayaan UMKM, dan kegiatan warga Kelurahan Panaikang.
                </p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-200">
                <div className="text-xs font-extrabold uppercase tracking-wider text-[#0277BD]">
                  Jam Pelayanan Loket Surat
                </div>
                <div className="mt-1 text-sm font-extrabold text-[#0D3868]">
                  {kelurahanProfile.serviceHours}
                </div>
                <p className="mt-1 text-xs text-slate-600">
                  Pelayanan surat pengantar KTP/KK, SKTM, SKU, domisili, dan pengantar nikah tidak
                  dipungut biaya (Gratis).
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200">
                <div className="text-xs font-extrabold uppercase tracking-wider text-emerald-800">
                  Pendataan UMKM & Bantuan Sosial
                </div>
                <div className="mt-1 text-sm font-extrabold text-emerald-950">
                  Terbuka bagi Warga RW 01 – RW 07
                </div>
                <p className="mt-1 text-xs text-slate-600">
                  Pelaku usaha mikro dan warga prasejahtera dapat mengajukan pendataan langsung
                  melalui Menu Pelayanan Usaha & Bantuan Sosial.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200">
                <div className="text-xs font-extrabold uppercase tracking-wider text-amber-800">
                  Posko Pengaduan & Mediasi Warga
                </div>
                <div className="mt-1 text-sm font-extrabold text-amber-950">
                  Sinergi Lurah, RT/RW & Tiga Pilar
                </div>
                <p className="mt-1 text-xs text-slate-600">
                  Layanan pengaduan lingkungan, banjir, lampu jalan, hingga fasilitasi mediasi warga
                  ditindaklanjuti secara terukur.
                </p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-5">
              {kelurahanInfos.slice(0, 6).map((info) => (
                <div
                  key={info.id}
                  className="rounded-2xl border border-slate-200 bg-white overflow-hidden flex flex-col justify-between shadow-xs"
                >
                  <div>
                    <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-xs">
                      <span className="font-bold text-[#0D3868]">{info.category}</span>
                      <span className="text-slate-500 font-mono-num">{info.publishedAt}</span>
                    </div>
                    <div className="p-4 space-y-2">
                      <h3 className="text-sm font-extrabold text-slate-900 line-clamp-2">
                        {info.title}
                      </h3>
                      <p className="text-xs text-slate-600 line-clamp-4 leading-relaxed">
                        {info.summary || info.content}
                      </p>
                    </div>
                  </div>
                  <div className="px-4 py-2.5 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold">
                    <span className="text-slate-500">{info.author}</span>
                    {info.instagramPostUrl && (
                      <a
                        href={info.instagramPostUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#E1306C] hover:underline inline-flex items-center gap-1"
                      >
                        <span>Buka IG</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={handleBackToMenuWarga}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-[#0D3868] border border-slate-300 text-xs sm:text-sm font-extrabold transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Menu Warga</span>
            </button>
          </div>
        </div>
      )}

      {/* =====================================================================================
          HALAMAN 6: HALAMAN BARU 📞 HUBUNGI KELURAHAN
      ===================================================================================== */}
      {activePage === 'hubungi_page' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 shadow-xs">
            <button
              type="button"
              onClick={handleBackToMenuWarga}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0D3868] hover:bg-[#0277BD] text-white text-xs sm:text-sm font-extrabold transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Menu Warga</span>
            </button>
            <span className="text-xs font-bold text-slate-500">
              Menu Warga / Hubungi Kelurahan Panaikang
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-lg sm:text-xl font-extrabold text-[#0D3868]">
                  📞 Hubungi Kantor Kelurahan Panaikang
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                  Informasi alamat kantor, jam pelayanan loket administrasi, dan saluran komunikasi
                  resmi Pemerintah Kelurahan Panaikang.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Alamat Kantor Kelurahan
                  </div>
                  <div className="text-sm font-extrabold text-slate-900">
                    {kelurahanProfile.officeAddress}
                  </div>
                  <div className="text-xs text-slate-600">
                    Kec. {kelurahanProfile.subDistrict}, {kelurahanProfile.city}{' '}
                    {kelurahanProfile.postalCode}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Jam Operasional Pelayanan
                  </div>
                  <div className="text-sm font-extrabold text-[#0D3868]">
                    {kelurahanProfile.serviceHours}
                  </div>
                  <div className="text-xs text-emerald-700 font-semibold">
                    Pengajuan Digital & Pengaduan Online Buka 24 Jam
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Telepon & Pos-el Resmi
                  </div>
                  <div className="text-sm font-extrabold text-slate-900 font-mono-num">
                    {kelurahanProfile.phoneContact}
                  </div>
                  <div className="text-xs text-[#0277BD] font-semibold">
                    {kelurahanProfile.emailContact}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Pejabat Pelayanan Kelurahan
                  </div>
                  <div className="text-sm font-extrabold text-slate-900">
                    Lurah: {kelurahanProfile.lurahName}
                  </div>
                  <div className="text-xs text-slate-600">
                    Seklur: {kelurahanProfile.sekretarisName}
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#25D366]/10 border border-[#128C7E]/30 space-y-2">
                <div className="flex items-center gap-2 text-xs sm:text-sm font-extrabold text-[#075E54]">
                  <Lock className="w-4 h-4 text-[#128C7E]" />
                  <span>
                    Sistem Distribusi Pesan WhatsApp Terpadu ({activeRecipients.length} Penerima
                    Aktif)
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Seluruh pengajuan surat dan laporan warga yang dikirim melalui Menu Warga akan
                  diteruskan secara otomatis ke seluruh nomor WhatsApp perangkat kelurahan yang
                  terdaftar di halaman Administrator agar segera ditindaklanjuti.
                </p>
              </div>
            </div>

            <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-base font-extrabold text-[#0D3868]">
                    Direktori Wilayah RW Kelurahan Panaikang
                  </h3>
                  <p className="text-xs text-slate-500">
                    Koordinasi pengantar RT/RW sebelum pengesahan kelurahan
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('rtrw')}
                  className="text-xs font-bold text-[#0277BD] hover:underline cursor-pointer"
                >
                  Data Lengkap RT/RW →
                </button>
              </div>

              <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                {rwGroups.map((group) => (
                  <div
                    key={group.id}
                    className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="text-xs font-extrabold text-[#0D3868]">
                        {group.rwCode} — {group.ketuaRwName}
                      </div>
                      <div className="text-[11px] text-slate-600">{group.areaDescription}</div>
                    </div>
                    <span className="text-[11px] font-bold text-slate-700 shrink-0">
                      {group.rtList?.length || 0} RT
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={handleBackToMenuWarga}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-[#0D3868] border border-slate-300 text-xs sm:text-sm font-extrabold transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Menu Warga</span>
            </button>
          </div>
        </div>
      )}

      {/* Lightbox Modal for Report & Officer Follow-Up Photos */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/80 flex items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-2xl w-full overflow-hidden border border-slate-200 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-xs font-mono-num font-bold text-[#0277BD]">
                  {lightboxImage.ticketCode}
                </span>
                <h4 className="text-sm font-bold text-slate-900">{lightboxImage.caption}</h4>
              </div>
              <button
                type="button"
                onClick={() => setLightboxImage(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="bg-slate-950 flex items-center justify-center max-h-[70vh] overflow-hidden">
              <img
                src={lightboxImage.url}
                alt={lightboxImage.caption}
                className="w-full h-auto max-h-[70vh] object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
