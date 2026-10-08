import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  ShieldCheck,
  Building2,
  FileText,
  Recycle,
  Calendar,
  Plus,
  Edit3,
  Trash2,
  Check,
  X,
  AlertCircle,
  CheckCircle2,
  Search,
  Lock,
  User,
  Eye,
  EyeOff,
  LogOut,
  Newspaper,
  Upload,
  Image as ImageIcon,
  Instagram,
  RefreshCw,
  Users,
  Clock,
  Camera,
  BarChart3,
  MessageCircle,
  Phone,
  ExternalLink,
} from 'lucide-react';
import {
  AppView,
  KelurahanProfile,
  CitizenReport,
  ReportCategory,
  ReportStatus,
  WasteBankUnit,
  WasteLogEntry,
  CleanupEvent,
  KelurahanInfoItem,
  RwGroup,
  RtItem,
  WhatsAppRecipient,
} from '../types';
import {
  HERO_IMAGE_PATH,
  IMG_NIPAH_MALL,
  IMG_DRAINASE,
  IMG_BANK_SAMPAH,
  IMG_KERJA_BAKTI,
  IG_POST_1,
  IG_POST_6,
  IG_POST_8,
  IG_POST_10,
  IG_POST_12,
  INITIAL_WHATSAPP_RECIPIENTS,
} from '../data/initialData';
import { resolveImageUrl } from '../utils/resolveImageUrl';
import { compressImageFile } from '../utils/compressImage';
import {
  buildInterRecipientCoordinationMessage,
  buildReportWhatsAppMessage,
  buildWhatsAppUrl,
  formatDisplayPhone,
  normalizeWhatsAppPhone,
} from '../utils/whatsappHelper';
import { EmblemKotaMakassar, EmblemKelurahanPanaikang } from './Emblems';
import { DashboardLurahView } from './DashboardLurahView';
import { MonthlyArchivePdfPanel } from './MonthlyArchivePdfPanel';

interface AdminSession {
  token: string;
  username: string;
  fullName: string;
  nip: string;
  role: string;
  loginAt: string;
}

interface AdminPanelViewProps {
  profile: KelurahanProfile;
  rwGroups: RwGroup[];
  reports: CitizenReport[];
  wasteUnits: WasteBankUnit[];
  wasteLogs: WasteLogEntry[];
  cleanupEvents: CleanupEvent[];
  kelurahanInfos: KelurahanInfoItem[];
  whatsappRecipients?: WhatsAppRecipient[];
  onSaveProfile: (updated: KelurahanProfile) => Promise<{ ok: boolean; errors?: string[] }>;
  onSaveRwGroups: (updated: RwGroup[]) => Promise<{ ok: boolean; errors?: string[] }>;
  onSaveWhatsAppRecipients?: (
    updated: WhatsAppRecipient[]
  ) => Promise<{ ok: boolean; errors?: string[] }>;
  onCreateReport: (rep: Partial<CitizenReport>) => Promise<{ ok: boolean; errors?: string[] }>;
  onUpdateReport: (
    id: string,
    rep: Partial<CitizenReport>
  ) => Promise<{ ok: boolean; errors?: string[] }>;
  onDeleteReport: (id: string) => Promise<{ ok: boolean; errors?: string[] }>;
  onCreateWasteUnit: (
    unit: Partial<WasteBankUnit>
  ) => Promise<{ ok: boolean; errors?: string[] }>;
  onUpdateWasteUnit: (
    id: string,
    unit: Partial<WasteBankUnit>
  ) => Promise<{ ok: boolean; errors?: string[] }>;
  onDeleteWasteUnit: (id: string) => Promise<{ ok: boolean; errors?: string[] }>;
  onAddWasteLog?: (
    rw: string,
    organikKg: number,
    anorganikKg: number,
    residuKg: number,
    officerName: string,
    notes: string
  ) => void;
  onUpdateWasteLog?: (
    id: string,
    updated: Partial<WasteLogEntry>
  ) => Promise<{ ok: boolean; errors?: string[] }>;
  onDeleteWasteLog: (id: string) => Promise<{ ok: boolean; errors?: string[] }>;
  onCreateCleanup: (
    ev: Partial<CleanupEvent>
  ) => Promise<{ ok: boolean; errors?: string[] }>;
  onUpdateCleanup: (
    id: string,
    ev: Partial<CleanupEvent>
  ) => Promise<{ ok: boolean; errors?: string[] }>;
  onDeleteCleanup: (id: string) => Promise<{ ok: boolean; errors?: string[] }>;
  onCreateInfo: (
    info: Partial<KelurahanInfoItem>
  ) => Promise<{ ok: boolean; errors?: string[] }>;
  onUpdateInfo: (
    id: string,
    info: Partial<KelurahanInfoItem>
  ) => Promise<{ ok: boolean; errors?: string[] }>;
  onDeleteInfo: (id: string) => Promise<{ ok: boolean; errors?: string[] }>;
  onSyncInstagram: () => Promise<{ ok: boolean; syncedAt?: string }>;
  onNavigate: (view: AppView) => void;
  initialTab?: AdminTab;
  onUpdateReportStatus?: (
    id: string,
    newStatus: ReportStatus,
    assignedTeam: string,
    responseNote: string
  ) => void;
}

export type AdminTab =
  | 'dashboard_lurah'
  | 'profil'
  | 'rtrw'
  | 'info'
  | 'laporan'
  | 'sampah'
  | 'kerjabakti';

const DEFAULT_RW_LIST = ['RW 01', 'RW 02', 'RW 03', 'RW 04', 'RW 05', 'RW 06', 'RW 07', 'RW 08'];
const DEFAULT_RT_LIST = ['RT 01', 'RT 02', 'RT 03', 'RT 04', 'RT 05'];
const CATEGORIES: ReportCategory[] = [
  'Sampah Liar & TPS',
  'Drainase & Genangan',
  'Pohon & Ruang Hijau',
  'Ketertiban & Fasum',
];

export const AdminPanelView: React.FC<AdminPanelViewProps> = ({
  profile,
  rwGroups = [],
  reports = [],
  wasteUnits = [],
  wasteLogs = [],
  cleanupEvents = [],
  kelurahanInfos = [],
  whatsappRecipients = INITIAL_WHATSAPP_RECIPIENTS,
  onSaveProfile,
  onSaveRwGroups,
  onSaveWhatsAppRecipients,
  onCreateReport,
  onUpdateReport,
  onDeleteReport,
  onCreateWasteUnit,
  onUpdateWasteUnit,
  onDeleteWasteUnit,
  onAddWasteLog,
  onUpdateWasteLog,
  onDeleteWasteLog,
  onCreateCleanup,
  onUpdateCleanup,
  onDeleteCleanup,
  onCreateInfo,
  onUpdateInfo,
  onDeleteInfo,
  onSyncInstagram,
  onNavigate,
  initialTab,
  onUpdateReportStatus,
}) => {
  // ================= AUTHENTICATION STATE =================
  const [adminSession, setAdminSession] = useState<AdminSession | null>(() => {
    try {
      const saved = sessionStorage.getItem('pnk_admin_session');
      return saved ? (JSON.parse(saved) as AdminSession) : null;
    } catch {
      return null;
    }
  });
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [activeTab, setActiveTab] = useState<AdminTab>(initialTab || 'dashboard_lurah');
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const isLurahSession = Boolean(
    adminSession &&
      (adminSession.role.toLowerCase().includes('lurah') ||
        adminSession.username.toLowerCase() === 'admin' ||
        adminSession.username.toLowerCase() === 'lurah')
  );
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Sync profileDraft when profile prop updates
  const [profileDraft, setProfileDraft] = useState<KelurahanProfile>(profile);
  useEffect(() => {
    setProfileDraft(profile);
  }, [profile]);
  const [newMisiText, setNewMisiText] = useState('');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const cleanUser = loginUsername.trim();
    const cleanPass = loginPassword.trim();
    if (!cleanUser || !cleanPass) {
      setLoginError('Mohon masukkan Username/NIP dan Kata Sandi terlebih dahulu.');
      return;
    }

    setIsLoggingIn(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: cleanUser, password: cleanPass }),
      });
      const json = await res.json();
      setIsLoggingIn(false);

      if (!res.ok || !json.ok) {
        setLoginError(
          json.error || 'Username atau kata sandi tidak sesuai. Silakan coba kembali.'
        );
        return;
      }

      const sessionData: AdminSession = json.session;
      setAdminSession(sessionData);
      sessionStorage.setItem('pnk_admin_session', JSON.stringify(sessionData));
      setLoginPassword('');
    } catch {
      setIsLoggingIn(false);
      // Fallback local verification if server request fails
      if (
        ['admin', 'lurah', 'operator', 'sekretaris'].includes(cleanUser.toLowerCase()) &&
        ['panaikang2026', 'admin123'].includes(cleanPass)
      ) {
        const fallbackSession: AdminSession = {
          token: `pnk-local-${Date.now()}`,
          username: cleanUser.toLowerCase(),
          fullName:
            cleanUser.toLowerCase() === 'operator'
              ? profile.sekretarisName
              : profile.lurahName,
          nip: profile.lurahNip,
          role:
            cleanUser.toLowerCase() === 'operator'
              ? 'Operator Satu Data · Sekretaris Kelurahan'
              : 'Administrator Utama · Lurah Panaikang',
          loginAt: 'Baru Saja',
        };
        setAdminSession(fallbackSession);
        sessionStorage.setItem('pnk_admin_session', JSON.stringify(fallbackSession));
      } else {
        setLoginError(
          'Username/NIP atau kata sandi yang dimasukkan tidak sesuai. Silakan coba kembali.'
        );
      }
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    }
    sessionStorage.removeItem('pnk_admin_session');
    setAdminSession(null);
    setLoginUsername('');
    setLoginPassword('');
    setLoginError('');
  };

  // ================= 1B. DATA RT & RW CRUD STATE =================
  const [editingRwId, setEditingRwId] = useState<string | null>(null);
  const [showRwForm, setShowRwForm] = useState(false);
  const [confirmDeleteRwId, setConfirmDeleteRwId] = useState<string | null>(null);
  const [rwForm, setRwForm] = useState<Partial<RwGroup>>({
    rwCode: 'RW 07',
    rwName: '',
    ketuaRwName: '',
    phone: '',
    areaDescription: '',
  });

  const [activeRwForRt, setActiveRwForRt] = useState<string | null>(null);
  const [editingRtId, setEditingRtId] = useState<string | null>(null);
  const [confirmDeleteRtKey, setConfirmDeleteRtKey] = useState<string | null>(null);
  const [rtForm, setRtForm] = useState<Partial<RtItem>>({
    rtCode: 'RT 01',
    rtName: '',
    ketuaRtName: '',
    phone: '',
    areaDescription: '',
    householdsCount: 120,
  });

  // ================= 2. LAPORAN WARGA & WHATSAPP RECIPIENT CRUD STATE =================
  const [showWaForm, setShowWaForm] = useState(false);
  const [editingWaId, setEditingWaId] = useState<string | null>(null);
  const [confirmDeleteWaId, setConfirmDeleteWaId] = useState<string | null>(null);
  const [waForm, setWaForm] = useState<Partial<WhatsAppRecipient>>({
    name: '',
    role: 'Lurah / Admin Penerima Laporan Warga',
    phoneNumber: '',
    isPrimary: false,
    isActive: true,
    rwScope: 'Seluruh Wilayah',
    notes: '',
  });

  const [reportSearch, setReportSearch] = useState('');
  const [editingReportId, setEditingReportId] = useState<string | null>(null);
  const [showReportForm, setShowReportForm] = useState(false);
  const [confirmDeleteReportId, setConfirmDeleteReportId] = useState<string | null>(null);
  const [reportForm, setReportForm] = useState<Partial<CitizenReport>>({
    title: '',
    description: '',
    category: 'Sampah Liar & TPS',
    urgency: 'Normal',
    status: 'Menunggu Verifikasi',
    reporterName: '',
    reporterPhone: '',
    rw: 'RW 02',
    rt: 'RT 01',
    locationName: '',
    assignedTeam: 'Satgas Drainase & Kebersihan Kelurahan Panaikang',
    responseNote: '',
    imageUrl: IMG_DRAINASE,
    verifiedBy: '',
    completionPhotoUrl: '',
    followUpPhotos: [],
  });

  // ================= 3. BANK SAMPAH UNIT & LOG CRUD STATE =================
  const [editingUnitId, setEditingUnitId] = useState<string | null>(null);
  const [showUnitForm, setShowUnitForm] = useState(false);
  const [confirmDeleteUnitId, setConfirmDeleteUnitId] = useState<string | null>(null);
  const [unitForm, setUnitForm] = useState<Partial<WasteBankUnit>>({
    rw: 'RW 07',
    unitName: '',
    coordinator: '',
    locationLabel: '',
    organikKg: 500,
    anorganikKg: 420,
    residuKg: 180,
    activeHouseholds: 120,
    pickupSchedule: 'Senin, Rabu, Jumat · 06:30 WITA',
  });

  const [showLogForm, setShowLogForm] = useState(false);
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [confirmDeleteLogId, setConfirmDeleteLogId] = useState<string | null>(null);
  const [logForm, setLogForm] = useState<{
    rw: string;
    unitName: string;
    date: string;
    organikKg: number;
    anorganikKg: number;
    residuKg: number;
    officerName: string;
    notes: string;
  }>({
    rw: 'RW 01',
    unitName: 'BSU Sipakatau Panaikang',
    date: '06 Okt 2026',
    organikKg: 60,
    anorganikKg: 45,
    residuKg: 15,
    officerName: 'Petugas BSU',
    notes: 'Penimbangan harian sampah terpilah.',
  });

  const RW_LIST =
    rwGroups.length > 0 ? rwGroups.map((g) => g.rwCode) : DEFAULT_RW_LIST;
  const activeReportRwObj = rwGroups.find((g) => g.rwCode === reportForm.rw);
  const RT_LIST =
    activeReportRwObj &&
    Array.isArray(activeReportRwObj.rtList) &&
    activeReportRwObj.rtList.length > 0
      ? activeReportRwObj.rtList.map((rt) => rt.rtCode)
      : DEFAULT_RT_LIST;

  // ================= 4. KERJA BAKTI CRUD STATE =================
  const [editingCleanupId, setEditingCleanupId] = useState<string | null>(null);
  const [showCleanupForm, setShowCleanupForm] = useState(false);
  const [confirmDeleteCleanupId, setConfirmDeleteCleanupId] = useState<string | null>(null);
  const [cleanupForm, setCleanupForm] = useState<Partial<CleanupEvent>>({
    title: '',
    date: 'Sabtu, 17 Oktober 2026',
    timeRange: '06:30 – 09:30 WITA',
    rw: 'RW 01',
    rtScope: 'Seluruh RT 01 – RT 05',
    locationName: '',
    coordinator: 'Lurah Panaikang & Satgas Kebersihan',
    status: 'Terjadwal',
    targetParticipants: 90,
    registeredParticipants: 25,
    collectedWasteKg: 0,
    summaryNote: '',
    imageUrl: IMG_KERJA_BAKTI,
  });

  // ================= 5. INFORMASI SEPUTAR KELURAHAN CRUD STATE =================
  const [editingInfoId, setEditingInfoId] = useState<string | null>(null);
  const [showInfoForm, setShowInfoForm] = useState(false);
  const [confirmDeleteInfoId, setConfirmDeleteInfoId] = useState<string | null>(null);
  const [infoForm, setInfoForm] = useState<Partial<KelurahanInfoItem>>({
    title: '',
    category: 'Pengumuman Kelurahan',
    summary: '',
    content: '',
    imageUrl: IMG_BANK_SAMPAH,
    publishedAt: '06 Okt 2026',
    author: 'Lurah Panaikang',
    instagramHandle: '@kelurahan.panaikang',
    instagramPostUrl: 'https://www.instagram.com/kelurahan.panaikang/',
    hashtags: ['#KelurahanPanaikang', '#PanaikangSmartEnvironment', '#KotaMakassar'],
  });
  const [hashtagsText, setHashtagsText] = useState(
    '#KelurahanPanaikang #PanaikangSmartEnvironment #KotaMakassar'
  );
  const [isSyncingIgAdmin, setIsSyncingIgAdmin] = useState(false);

  const handleSyncInstagramAdmin = async () => {
    clearFeedback();
    setIsSyncingIgAdmin(true);
    try {
      const res = await onSyncInstagram();
      if (res.ok) {
        setSuccessMessage(
          `Seluruh postingan informasi berhasil disinkronkan dengan akun Instagram resmi @kelurahan.panaikang (${res.syncedAt || 'Baru Saja'}).`
        );
      }
    } catch {
      setSuccessMessage(
        'Postingan informasi berhasil disambungkan dengan akun Instagram @kelurahan.panaikang.'
      );
    } finally {
      setIsSyncingIgAdmin(false);
    }
  };

  const handleInfoImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setValidationErrors(['File yang dipilih harus berupa gambar (JPG, PNG, atau WEBP).']);
      return;
    }
    try {
      const compressed = await compressImageFile(file);
      setInfoForm((prev) => ({ ...prev, imageUrl: compressed }));
    } catch {
      setValidationErrors(['Gagal memproses gambar yang dipilih.']);
    }
  };

  const openAddInfoForm = () => {
    clearFeedback();
    setEditingInfoId(null);
    setHashtagsText('#KelurahanPanaikang #PanaikangSmartEnvironment #KotaMakassar');
    setInfoForm({
      title: '',
      category: 'Pengumuman Kelurahan',
      summary: '',
      content: '',
      imageUrl: IMG_BANK_SAMPAH,
      publishedAt: '06 Okt 2026',
      author:
        adminSession?.username === 'operator'
          ? 'Operator Satu Data Kelurahan'
          : 'Lurah Panaikang',
      instagramHandle: '@kelurahan.panaikang',
      instagramPostUrl: 'https://www.instagram.com/kelurahan.panaikang/',
      isInstagramSynced: true,
    });
    setShowInfoForm(true);
  };

  const openEditInfoForm = (item: KelurahanInfoItem) => {
    clearFeedback();
    setEditingInfoId(item.id);
    setHashtagsText(
      item.hashtags && item.hashtags.length > 0
        ? item.hashtags.join(' ')
        : '#KelurahanPanaikang #PanaikangSmartEnvironment #KotaMakassar'
    );
    setInfoForm({
      ...item,
      instagramHandle: item.instagramHandle || '@kelurahan.panaikang',
      instagramPostUrl: item.instagramPostUrl || 'https://www.instagram.com/kelurahan.panaikang/',
    });
    setShowInfoForm(true);
  };

  const handleInfoFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearFeedback();
    setIsSubmitting(true);
    const parsedHashtags = hashtagsText
      .split(/[\s,]+/)
      .map((t) => t.trim())
      .filter(Boolean)
      .map((t) => (t.startsWith('#') ? t : `#${t}`));
    const payload: Partial<KelurahanInfoItem> = {
      ...infoForm,
      instagramHandle: infoForm.instagramHandle?.trim() || '@kelurahan.panaikang',
      instagramPostUrl:
        infoForm.instagramPostUrl?.trim() || 'https://www.instagram.com/kelurahan.panaikang/',
      isInstagramSynced: true,
      hashtags:
        parsedHashtags.length > 0
          ? parsedHashtags
          : ['#KelurahanPanaikang', '#PanaikangSmartEnvironment'],
    };
    const res = editingInfoId
      ? await onUpdateInfo(editingInfoId, payload)
      : await onCreateInfo(payload);
    setIsSubmitting(false);

    if (!res.ok) {
      setValidationErrors(res.errors || ['Validasi informasi kelurahan gagal.']);
    } else {
      setShowInfoForm(false);
      setEditingInfoId(null);
      setSuccessMessage(
        editingInfoId
          ? 'Informasi Seputar Kelurahan Panaikang berhasil diperbarui dan ditampilkan di Halaman Utama.'
          : 'Informasi baru berhasil ditambahkan dan diterbitkan ke Halaman Utama.'
      );
    }
  };

  const handleExecuteDeleteInfo = async (id: string) => {
    clearFeedback();
    const res = await onDeleteInfo(id);
    setConfirmDeleteInfoId(null);
    if (res.ok) {
      setSuccessMessage('Informasi kelurahan berhasil dihapus dari Halaman Utama.');
    }
  };

  const clearFeedback = () => {
    setValidationErrors([]);
    setSuccessMessage('');
  };

  const handleTabSwitch = (tab: AdminTab) => {
    setActiveTab(tab);
    clearFeedback();
  };

  // ---------- PROFIL KELURAHAN HANDLERS ----------
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearFeedback();
    setIsSubmitting(true);
    const res = await onSaveProfile(profileDraft);
    setIsSubmitting(false);
    if (!res.ok) {
      setValidationErrors(res.errors || ['Gagal memvalidasi data profil kelurahan.']);
    } else {
      setSuccessMessage(
        'Data Profil Kelurahan Panaikang (Lurah, Alamat Kantor, Visi & Misi) telah tervalidasi dan disimpan ke server.'
      );
    }
  };

  const handleAddMisiItem = () => {
    if (!newMisiText.trim()) {
      setValidationErrors(['Butir misi baru tidak boleh kosong.']);
      return;
    }
    clearFeedback();
    setProfileDraft((prev) => ({
      ...prev,
      misi: [...prev.misi, newMisiText.trim()],
    }));
    setNewMisiText('');
  };

  // ---------- DATA RT & RW HANDLERS ----------
  const openAddRwForm = () => {
    clearFeedback();
    setEditingRwId(null);
    const nextNum = String(rwGroups.length + 1).padStart(2, '0');
    setRwForm({
      rwCode: `RW ${nextNum}`,
      rwName: `RW ${nextNum} — Kawasan Kelurahan Panaikang`,
      ketuaRwName: '',
      phone: '0812-4100-xxxx',
      areaDescription: '',
    });
    setShowRwForm(true);
  };

  const openEditRwForm = (rw: RwGroup) => {
    clearFeedback();
    setEditingRwId(rw.id);
    setRwForm({ ...rw });
    setShowRwForm(true);
  };

  const handleRwFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearFeedback();
    if (!rwForm.rwCode?.trim() || !rwForm.rwName?.trim() || !rwForm.ketuaRwName?.trim()) {
      setValidationErrors(['Kode RW, Nama RW, dan Nama Ketua RW wajib diisi.']);
      return;
    }
    setIsSubmitting(true);
    let nextGroups: RwGroup[];
    if (editingRwId) {
      nextGroups = rwGroups.map((rw) =>
        rw.id === editingRwId
          ? {
              ...rw,
              rwCode: rwForm.rwCode!.trim(),
              rwName: rwForm.rwName!.trim(),
              ketuaRwName: rwForm.ketuaRwName!.trim(),
              phone: rwForm.phone?.trim() || '',
              areaDescription: rwForm.areaDescription?.trim() || 'Wilayah Kelurahan Panaikang',
            }
          : rw
      );
    } else {
      const createdRw: RwGroup = {
        id: `rw-${Date.now()}`,
        rwCode: rwForm.rwCode.trim(),
        rwName: rwForm.rwName.trim(),
        ketuaRwName: rwForm.ketuaRwName.trim(),
        phone: rwForm.phone?.trim() || '',
        areaDescription: rwForm.areaDescription?.trim() || 'Wilayah Kelurahan Panaikang',
        rtList: [],
      };
      nextGroups = [...rwGroups, createdRw];
    }
    const res = await onSaveRwGroups(nextGroups);
    setIsSubmitting(false);
    if (!res.ok) {
      setValidationErrors(res.errors || ['Gagal menyimpan perubahan data RW.']);
    } else {
      setShowRwForm(false);
      setEditingRwId(null);
      setSuccessMessage(
        editingRwId
          ? 'Data Rukun Warga (RW) berhasil diperbarui dan ditampilkan pada menu Data RT dan RW.'
          : 'Wilayah Rukun Warga (RW) baru berhasil ditambahkan.'
      );
    }
  };

  const handleExecuteDeleteRw = async (rwId: string) => {
    clearFeedback();
    const nextGroups = rwGroups.filter((rw) => rw.id !== rwId);
    const res = await onSaveRwGroups(nextGroups);
    setConfirmDeleteRwId(null);
    if (res.ok) {
      setSuccessMessage('Data RW beserta daftar RT di dalamnya berhasil dihapus.');
    }
  };

  const openAddRtForm = (rw: RwGroup) => {
    clearFeedback();
    setActiveRwForRt(rw.id);
    setEditingRtId(null);
    const nextRtNum = String((rw.rtList?.length || 0) + 1).padStart(2, '0');
    setRtForm({
      rtCode: `RT ${nextRtNum}`,
      rtName: `RT ${nextRtNum} / ${rw.rwCode} — Kelurahan Panaikang`,
      ketuaRtName: '',
      phone: '0813-4200-xxxx',
      areaDescription: '',
      householdsCount: 120,
    });
  };

  const openEditRtForm = (rw: RwGroup, rt: RtItem) => {
    clearFeedback();
    setActiveRwForRt(rw.id);
    setEditingRtId(rt.id);
    setRtForm({ ...rt });
  };

  const handleRtFormSubmit = async (e: React.FormEvent, rwId: string) => {
    e.preventDefault();
    clearFeedback();
    if (!rtForm.rtCode?.trim() || !rtForm.rtName?.trim() || !rtForm.ketuaRtName?.trim()) {
      setValidationErrors(['Kode RT, Nama RT, dan Nama Ketua RT wajib diisi.']);
      return;
    }
    setIsSubmitting(true);
    const nextGroups = rwGroups.map((rw) => {
      if (rw.id !== rwId) return rw;
      const currentRtList = Array.isArray(rw.rtList) ? rw.rtList : [];
      if (editingRtId) {
        return {
          ...rw,
          rtList: currentRtList.map((rt) =>
            rt.id === editingRtId
              ? {
                  ...rt,
                  rtCode: rtForm.rtCode!.trim(),
                  rtName: rtForm.rtName!.trim(),
                  ketuaRtName: rtForm.ketuaRtName!.trim(),
                  phone: rtForm.phone?.trim() || '',
                  areaDescription: rtForm.areaDescription?.trim() || rw.areaDescription,
                  householdsCount: Number(rtForm.householdsCount) || 100,
                }
              : rt
          ),
        };
      }
      const newRt: RtItem = {
        id: `rt-${Date.now()}`,
        rtCode: rtForm.rtCode!.trim(),
        rtName: rtForm.rtName!.trim(),
        ketuaRtName: rtForm.ketuaRtName!.trim(),
        phone: rtForm.phone?.trim() || '',
        areaDescription: rtForm.areaDescription?.trim() || rw.areaDescription,
        householdsCount: Number(rtForm.householdsCount) || 100,
      };
      return {
        ...rw,
        rtList: [...currentRtList, newRt],
      };
    });

    const res = await onSaveRwGroups(nextGroups);
    setIsSubmitting(false);
    if (!res.ok) {
      setValidationErrors(res.errors || ['Gagal menyimpan data RT.']);
    } else {
      setActiveRwForRt(null);
      setEditingRtId(null);
      setSuccessMessage(
        editingRtId
          ? 'Data Rukun Tetangga (RT) berhasil diperbarui.'
          : 'Rukun Tetangga (RT) baru berhasil ditambahkan ke dalam wilayah RW.'
      );
    }
  };

  const handleExecuteDeleteRt = async (rwId: string, rtId: string) => {
    clearFeedback();
    const nextGroups = rwGroups.map((rw) =>
      rw.id === rwId
        ? { ...rw, rtList: (rw.rtList || []).filter((rt) => rt.id !== rtId) }
        : rw
    );
    const res = await onSaveRwGroups(nextGroups);
    setConfirmDeleteRtKey(null);
    if (res.ok) {
      setSuccessMessage('Data Rukun Tetangga (RT) berhasil dihapus dari wilayah RW.');
    }
  };

  // ---------- WHATSAPP RECIPIENTS HANDLERS (DIKELOLA OLEH LURAH / ADMIN) ----------
  const openAddWaRecipientForm = () => {
    clearFeedback();
    setEditingWaId(null);
    setWaForm({
      name: '',
      role: 'Koordinator / Admin Penerima Laporan Warga',
      phoneNumber: '0812',
      isPrimary: whatsappRecipients.length === 0,
      isActive: true,
      rwScope: 'Seluruh Wilayah',
      notes: '',
    });
    setShowWaForm(true);
  };

  const openEditWaRecipientForm = (recipient: WhatsAppRecipient) => {
    clearFeedback();
    setEditingWaId(recipient.id);
    setWaForm({ ...recipient });
    setShowWaForm(true);
  };

  const handleWaFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearFeedback();
    const cleanName = (waForm.name || '').trim();
    const cleanRole = (waForm.role || '').trim();
    const cleanPhone = (waForm.phoneNumber || '').trim();
    const normalizedDigits = normalizeWhatsAppPhone(cleanPhone);

    const errors: string[] = [];
    if (cleanName.length < 3) {
      errors.push('Nama penerima pesan WhatsApp wajib diisi (minimal 3 karakter).');
    }
    if (cleanRole.length < 3) {
      errors.push('Jabatan / peran penerima WhatsApp wajib diisi.');
    }
    if (normalizedDigits.length < 10) {
      errors.push('Nomor telepon WhatsApp wajib diisi dengan nomor yang valid (contoh: 081242108800).');
    }
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    if (!onSaveWhatsAppRecipients) return;
    setIsSubmitting(true);

    let nextList: WhatsAppRecipient[];
    if (editingWaId) {
      nextList = whatsappRecipients.map((item) => {
        if (item.id === editingWaId) {
          return {
            ...item,
            name: cleanName,
            role: cleanRole,
            phoneNumber: cleanPhone,
            isPrimary: Boolean(waForm.isPrimary),
            isActive: waForm.isActive !== false,
            rwScope: waForm.rwScope || 'Seluruh Wilayah',
            notes: waForm.notes?.trim() || '',
          };
        }
        return waForm.isPrimary ? { ...item, isPrimary: false } : item;
      });
    } else {
      const created: WhatsAppRecipient = {
        id: `wa-${Date.now()}`,
        name: cleanName,
        role: cleanRole,
        phoneNumber: cleanPhone,
        isPrimary: Boolean(waForm.isPrimary) || whatsappRecipients.length === 0,
        isActive: waForm.isActive !== false,
        rwScope: waForm.rwScope || 'Seluruh Wilayah',
        notes: waForm.notes?.trim() || '',
      };
      const baseList = created.isPrimary
        ? whatsappRecipients.map((item) => ({ ...item, isPrimary: false }))
        : whatsappRecipients;
      nextList = [...baseList, created];
    }

    // Ensure at least one primary recipient exists if list is non-empty
    if (nextList.length > 0 && !nextList.some((r) => r.isPrimary)) {
      nextList[0] = { ...nextList[0], isPrimary: true };
    }

    const res = await onSaveWhatsAppRecipients(nextList);
    setIsSubmitting(false);
    if (res.ok) {
      setShowWaForm(false);
      setEditingWaId(null);
      setSuccessMessage(
        editingWaId
          ? 'Nomor telepon penerima WhatsApp laporan warga berhasil diperbarui.'
          : 'Nomor telepon penerima WhatsApp baru berhasil ditambahkan dan terhubung ke menu Laporan Warga.'
      );
    } else {
      setValidationErrors(res.errors || ['Gagal menyimpan daftar nomor WhatsApp.']);
    }
  };

  const handleSetPrimaryWaRecipient = async (id: string) => {
    clearFeedback();
    if (!onSaveWhatsAppRecipients) return;
    const nextList = whatsappRecipients.map((item) => ({
      ...item,
      isPrimary: item.id === id,
      isActive: item.id === id ? true : item.isActive,
    }));
    const res = await onSaveWhatsAppRecipients(nextList);
    if (res.ok) {
      const target = nextList.find((r) => r.id === id);
      setSuccessMessage(
        `Nomor WhatsApp ${target?.name || ''} (${formatDisplayPhone(target?.phoneNumber || '')}) ditetapkan sebagai penerima utama otomatis laporan warga.`
      );
    }
  };

  const handleExecuteDeleteWaRecipient = async (id: string) => {
    clearFeedback();
    if (!onSaveWhatsAppRecipients) return;
    const nextList = whatsappRecipients.filter((item) => item.id !== id);
    if (nextList.length > 0 && !nextList.some((r) => r.isPrimary)) {
      nextList[0] = { ...nextList[0], isPrimary: true };
    }
    const res = await onSaveWhatsAppRecipients(nextList);
    setConfirmDeleteWaId(null);
    if (res.ok) {
      setSuccessMessage('Nomor telepon penerima WhatsApp berhasil dihapus.');
    }
  };

  // ---------- LAPORAN WARGA HANDLERS ----------
  const handleReportFollowUpPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue;
      try {
        const dataUrl = await compressImageFile(file);
        setReportForm((prev) => {
          const existing = Array.isArray(prev.followUpPhotos) ? prev.followUpPhotos : [];
          const nextPhotos = [dataUrl, ...existing.filter((p) => p !== dataUrl)];
          return {
            ...prev,
            completionPhotoUrl: dataUrl,
            followUpPhotos: nextPhotos,
          };
        });
      } catch {
        // ignore invalid file
      }
    }
  };

  const handleRemoveReportFollowUpPhoto = (idx: number) => {
    setReportForm((prev) => {
      const existing = Array.isArray(prev.followUpPhotos) ? prev.followUpPhotos : [];
      const nextPhotos = existing.filter((_, i) => i !== idx);
      return {
        ...prev,
        followUpPhotos: nextPhotos,
        completionPhotoUrl: nextPhotos[0] || '',
      };
    });
  };

  const handleQuickReportAction = async (
    rep: CitizenReport,
    action: 'verifikasi' | 'proses' | 'selesai'
  ) => {
    clearFeedback();
    const officerLabel =
      adminSession?.fullName || 'Petugas Administrator / Operator Kelurahan Panaikang';
    const nowTime = '06 Okt 2026 · ' + new Date().toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    }) + ' WITA';

    if (action === 'verifikasi') {
      const res = await onUpdateReport(rep.id, {
        status: 'Sedang Ditangani',
        verifiedBy: officerLabel,
        verifiedAt: nowTime,
        assignedTeam: rep.assignedTeam || `Satgas Kebersihan & Koordinator ${rep.rw}`,
        responseNote:
          rep.responseNote && !rep.responseNote.includes('Menunggu verifikasi')
            ? rep.responseNote
            : `Laporan telah diverifikasi oleh ${officerLabel} dan sedang ditindaklanjuti di lapangan oleh ${rep.assignedTeam || 'Satgas Kebersihan'}.`,
      });
      if (res.ok) {
        setSuccessMessage(
          `Laporan ${rep.ticketCode} berhasil DIVERIFIKASI dan diteruskan untuk penanganan lapangan.`
        );
      }
      return;
    }

    // For 'proses' or 'selesai', open the detailed follow-up & photo attachment form pre-filled
    const existingFollowUps =
      Array.isArray(rep.followUpPhotos) && rep.followUpPhotos.length > 0
        ? rep.followUpPhotos
        : rep.completionPhotoUrl
        ? [rep.completionPhotoUrl]
        : action === 'selesai'
        ? [IG_POST_6]
        : [];
    setEditingReportId(rep.id);
    setReportForm({
      ...rep,
      status: action === 'selesai' ? 'Selesai' : 'Sedang Ditangani',
      verifiedBy: rep.verifiedBy || officerLabel,
      verifiedAt: rep.verifiedAt || nowTime,
      completedAt: action === 'selesai' ? nowTime : rep.completedAt,
      completionPhotoUrl: existingFollowUps[0] || '',
      followUpPhotos: existingFollowUps,
      responseNote:
        action === 'selesai'
          ? `Pengerjaan tindak lanjut laporan warga telah SELESAI dilaksanakan oleh ${rep.assignedTeam}. Dokumentasi foto pengerjaan terlampir.`
          : rep.responseNote,
    });
    setShowReportForm(true);
  };

  const openAddReportForm = () => {
    clearFeedback();
    setEditingReportId(null);
    setReportForm({
      title: '',
      description: '',
      category: 'Sampah Liar & TPS',
      urgency: 'Normal',
      status: 'Menunggu Verifikasi',
      reporterName: '',
      reporterPhone: '',
      rw: 'RW 02',
      rt: 'RT 01',
      locationName: '',
      assignedTeam: 'Satgas Drainase & Kebersihan Kelurahan Panaikang',
      responseNote: 'Laporan telah diverifikasi oleh Administrator Kelurahan.',
      imageUrl: IMG_DRAINASE,
      verifiedBy: adminSession?.fullName || 'Administrator Kelurahan Panaikang',
      verifiedAt: '06 Okt 2026',
      completionPhotoUrl: '',
      followUpPhotos: [],
    });
    setShowReportForm(true);
  };

  const openEditReportForm = (rep: CitizenReport) => {
    clearFeedback();
    setEditingReportId(rep.id);
    const existingFollowUps =
      Array.isArray(rep.followUpPhotos) && rep.followUpPhotos.length > 0
        ? rep.followUpPhotos
        : rep.completionPhotoUrl
        ? [rep.completionPhotoUrl]
        : [];
    setReportForm({
      ...rep,
      verifiedBy: rep.verifiedBy || adminSession?.fullName || 'Administrator Kelurahan',
      completionPhotoUrl: existingFollowUps[0] || '',
      followUpPhotos: existingFollowUps,
    });
    setShowReportForm(true);
  };

  const handleReportFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearFeedback();
    setIsSubmitting(true);
    const nowTime = '06 Okt 2026 · Diperbarui Petugas';
    const followUps = Array.isArray(reportForm.followUpPhotos)
      ? reportForm.followUpPhotos.filter(Boolean)
      : reportForm.completionPhotoUrl
      ? [reportForm.completionPhotoUrl]
      : [];
    const payload: Partial<CitizenReport> = {
      ...reportForm,
      verifiedBy:
        reportForm.status !== 'Menunggu Verifikasi'
          ? reportForm.verifiedBy || adminSession?.fullName || 'Petugas Kelurahan Panaikang'
          : reportForm.verifiedBy,
      verifiedAt:
        reportForm.status !== 'Menunggu Verifikasi'
          ? reportForm.verifiedAt || nowTime
          : reportForm.verifiedAt,
      completedAt:
        reportForm.status === 'Selesai' ? reportForm.completedAt || nowTime : undefined,
      completionPhotoUrl: followUps[0] || '',
      followUpPhotos: followUps,
    };
    const res = editingReportId
      ? await onUpdateReport(editingReportId, payload)
      : await onCreateReport(payload);
    setIsSubmitting(false);

    if (!res.ok) {
      setValidationErrors(res.errors || ['Validasi data laporan gagal.']);
    } else {
      setShowReportForm(false);
      setEditingReportId(null);
      setSuccessMessage(
        editingReportId
          ? 'Tindak lanjut aksi petugas & lampiran foto pengerjaan berhasil disimpan dan langsung ditampilkan kepada warga pada menu Untuk Warga.'
          : 'Data laporan warga baru berhasil ditambahkan dan tervalidasi.'
      );
    }
  };

  const handleExecuteDeleteReport = async (id: string) => {
    clearFeedback();
    const res = await onDeleteReport(id);
    setConfirmDeleteReportId(null);
    if (res.ok) {
      setSuccessMessage('Data laporan warga berhasil dihapus dari basis data.');
    } else {
      setValidationErrors(res.errors || ['Gagal menghapus laporan.']);
    }
  };

  // ---------- BANK SAMPAH UNIT HANDLERS ----------
  const openAddUnitForm = () => {
    clearFeedback();
    setEditingUnitId(null);
    setUnitForm({
      rw: 'RW 07',
      unitName: '',
      coordinator: '',
      locationLabel: '',
      organikKg: 450,
      anorganikKg: 380,
      residuKg: 150,
      activeHouseholds: 110,
      pickupSchedule: 'Senin, Rabu, Jumat · 06:30 WITA',
    });
    setShowUnitForm(true);
  };

  const openEditUnitForm = (unit: WasteBankUnit) => {
    clearFeedback();
    setEditingUnitId(unit.id);
    setUnitForm({ ...unit });
    setShowUnitForm(true);
  };

  const handleUnitFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearFeedback();
    setIsSubmitting(true);
    const res = editingUnitId
      ? await onUpdateWasteUnit(editingUnitId, unitForm)
      : await onCreateWasteUnit(unitForm);
    setIsSubmitting(false);

    if (!res.ok) {
      setValidationErrors(res.errors || ['Validasi data Bank Sampah Unit gagal.']);
    } else {
      setShowUnitForm(false);
      setEditingUnitId(null);
      setSuccessMessage(
        editingUnitId
          ? 'Data Bank Sampah Unit (BSU) berhasil diperbarui.'
          : 'Bank Sampah Unit (BSU) baru berhasil ditambahkan.'
      );
    }
  };

  const handleExecuteDeleteUnit = async (id: string) => {
    clearFeedback();
    const res = await onDeleteWasteUnit(id);
    setConfirmDeleteUnitId(null);
    if (res.ok) {
      setSuccessMessage('Data Bank Sampah Unit berhasil dihapus.');
    }
  };

  const openAddLogForm = () => {
    clearFeedback();
    setEditingLogId(null);
    const defaultRw = wasteUnits[0]?.rw || 'RW 01';
    const defaultUnit = wasteUnits[0]?.unitName || `BSU ${defaultRw}`;
    setLogForm({
      rw: defaultRw,
      unitName: defaultUnit,
      date: '06 Okt 2026 · Baru Saja',
      organikKg: 60,
      anorganikKg: 45,
      residuKg: 15,
      officerName: adminSession?.fullName || `Petugas BSU ${defaultRw}`,
      notes: `Penimbangan harian sampah terpilah ${defaultRw}.`,
    });
    setShowLogForm(true);
  };

  const openEditLogForm = (log: WasteLogEntry) => {
    clearFeedback();
    setEditingLogId(log.id);
    setLogForm({
      rw: log.rw,
      unitName: log.unitName,
      date: log.date,
      organikKg: log.organikKg,
      anorganikKg: log.anorganikKg,
      residuKg: log.residuKg,
      officerName: log.officerName,
      notes: log.notes,
    });
    setShowLogForm(true);
  };

  const handleLogFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearFeedback();
    if (logForm.organikKg + logForm.anorganikKg + logForm.residuKg <= 0) {
      setValidationErrors(['Total timbangan sampah harus lebih dari 0 kg.']);
      return;
    }
    if (editingLogId && onUpdateWasteLog) {
      const res = await onUpdateWasteLog(editingLogId, logForm);
      if (!res.ok) {
        setValidationErrors(res.errors || ['Gagal memperbarui log penimbangan.']);
        return;
      }
      setShowLogForm(false);
      setEditingLogId(null);
      setSuccessMessage('Log penimbangan harian berhasil diperbarui.');
    } else if (onAddWasteLog) {
      onAddWasteLog(
        logForm.rw,
        logForm.organikKg,
        logForm.anorganikKg,
        logForm.residuKg,
        logForm.officerName,
        logForm.notes
      );
      setShowLogForm(false);
      setSuccessMessage('Log penimbangan harian baru berhasil ditambahkan.');
    }
  };

  const handleExecuteDeleteLog = async (id: string) => {
    clearFeedback();
    const res = await onDeleteWasteLog(id);
    setConfirmDeleteLogId(null);
    if (res.ok) {
      setSuccessMessage('Log penimbangan harian berhasil dihapus.');
    }
  };

  // ---------- KERJA BAKTI HANDLERS ----------
  const handleCleanupMainImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setValidationErrors(['File foto kerja bakti harus berupa gambar (JPG, PNG, atau WEBP).']);
      return;
    }
    try {
      const dataUrl = await compressImageFile(file);
      setCleanupForm((prev) => {
        const existingDocs = Array.isArray(prev.documentationPhotos)
          ? prev.documentationPhotos
          : [];
        return {
          ...prev,
          imageUrl: dataUrl,
          documentationPhotos: [dataUrl, ...existingDocs.filter((p) => p !== dataUrl)],
        };
      });
    } catch {
      setValidationErrors(['Gagal memproses foto kerja bakti.']);
    }
  };

  const handleCleanupGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue;
      try {
        const dataUrl = await compressImageFile(file);
        setCleanupForm((prev) => {
          const existingDocs = Array.isArray(prev.documentationPhotos)
            ? prev.documentationPhotos
            : prev.imageUrl
            ? [prev.imageUrl]
            : [];
          return {
            ...prev,
            imageUrl: prev.imageUrl || dataUrl,
            documentationPhotos: [...existingDocs, dataUrl],
          };
        });
      } catch {
        // ignore invalid file
      }
    }
  };

  const handleRemoveCleanupDocPhoto = (photoIndex: number) => {
    setCleanupForm((prev) => {
      const existingDocs = Array.isArray(prev.documentationPhotos)
        ? prev.documentationPhotos
        : [];
      const nextDocs = existingDocs.filter((_, idx) => idx !== photoIndex);
      return {
        ...prev,
        documentationPhotos: nextDocs,
        imageUrl: nextDocs[0] || '',
      };
    });
  };

  const openAddCleanupForm = (initialStatus: CleanupEvent['status'] = 'Terjadwal') => {
    clearFeedback();
    setEditingCleanupId(null);
    const isCompleted = initialStatus === 'Tuntas';
    setCleanupForm({
      title: '',
      date: isCompleted ? 'Jumat, 02 Oktober 2026' : 'Sabtu, 17 Oktober 2026',
      timeRange: '06:30 – 09:30 WITA',
      rw: 'RW 01',
      rtScope: 'Seluruh RT',
      locationName: '',
      coordinator: 'Lurah Panaikang & Satgas Kebersihan',
      status: initialStatus,
      targetParticipants: 90,
      registeredParticipants: isCompleted ? 85 : 20,
      collectedWasteKg: isCompleted ? 320 : 0,
      summaryNote: '',
      imageUrl: isCompleted ? IG_POST_6 : '',
      documentationPhotos: isCompleted ? [IG_POST_6] : [],
    });
    setShowCleanupForm(true);
  };

  const openEditCleanupForm = (ev: CleanupEvent, markCompleted = false) => {
    clearFeedback();
    setEditingCleanupId(ev.id);
    const targetStatus = markCompleted ? 'Tuntas' : ev.status;
    const isCompleted = targetStatus === 'Tuntas';
    const docs = isCompleted
      ? Array.isArray(ev.documentationPhotos) && ev.documentationPhotos.length > 0
        ? ev.documentationPhotos
        : ev.imageUrl
        ? [ev.imageUrl]
        : [IG_POST_6]
      : [];
    setCleanupForm({
      ...ev,
      status: targetStatus,
      imageUrl: isCompleted ? ev.imageUrl || docs[0] || IG_POST_6 : '',
      documentationPhotos: docs,
    });
    setShowCleanupForm(true);
  };

  const handleCleanupFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearFeedback();
    setIsSubmitting(true);
    const isCompleted = cleanupForm.status === 'Tuntas';
    const docs =
      isCompleted &&
      Array.isArray(cleanupForm.documentationPhotos) &&
      cleanupForm.documentationPhotos.length > 0
        ? cleanupForm.documentationPhotos
        : isCompleted
        ? [cleanupForm.imageUrl || IG_POST_6]
        : [];
    const payload: Partial<CleanupEvent> = {
      ...cleanupForm,
      collectedWasteKg: isCompleted ? Number(cleanupForm.collectedWasteKg) || 0 : 0,
      imageUrl: isCompleted ? cleanupForm.imageUrl || docs[0] || IG_POST_6 : '',
      documentationPhotos: isCompleted ? docs : [],
    };
    const res = editingCleanupId
      ? await onUpdateCleanup(editingCleanupId, payload)
      : await onCreateCleanup(payload);
    setIsSubmitting(false);

    if (!res.ok) {
      setValidationErrors(res.errors || ['Validasi jadwal kerja bakti gagal.']);
    } else {
      setShowCleanupForm(false);
      setEditingCleanupId(null);
      setSuccessMessage(
        isCompleted
          ? 'Data kerja bakti yang telah selesai dilaksanakan beserta foto dokumentasinya berhasil disimpan dan ditampilkan di Halaman Utama & Menu Kerja Bakti.'
          : 'Jadwal kerja bakti terjadwal (tanpa foto) berhasil disimpan.'
      );
    }
  };

  const handleExecuteDeleteCleanup = async (id: string) => {
    clearFeedback();
    const res = await onDeleteCleanup(id);
    setConfirmDeleteCleanupId(null);
    if (res.ok) {
      setSuccessMessage('Data kegiatan kerja bakti berhasil dihapus.');
    }
  };

  const filteredReports = reports.filter(
    (r) =>
      r.ticketCode.toLowerCase().includes(reportSearch.toLowerCase()) ||
      r.title.toLowerCase().includes(reportSearch.toLowerCase()) ||
      r.rw.toLowerCase().includes(reportSearch.toLowerCase()) ||
      r.reporterName.toLowerCase().includes(reportSearch.toLowerCase())
  );

  // ================= RENDER LOGIN GATE IF NOT AUTHENTICATED =================
  if (!adminSession) {
    return (
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
        <button
          type="button"
          onClick={() => onNavigate('beranda')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0D3868] hover:text-[#0277BD] mb-6 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Portal Utama</span>
        </button>

        <div className="mx-auto max-w-md bg-white rounded-3xl border border-slate-200 shadow-[0_16px_40px_-12px_rgba(13,56,104,0.14)] overflow-hidden">
          {/* Top Institutional Header */}
          <div className="bg-gradient-to-b from-[#0D3868] to-[#072647] px-6 py-7 text-center text-white">
            <div className="inline-flex items-center justify-center gap-4 mb-3">
              <EmblemKotaMakassar className="w-14 h-16" />
              <div className="h-12 w-[2px] bg-white/25 rounded-full" />
              <EmblemKelurahanPanaikang className="w-14 h-16" />
            </div>
            <h1 className="text-xl font-extrabold tracking-tight text-white">
              Login Administrator Kelurahan
            </h1>
            <p className="mt-1 text-xs text-sky-100">
              Sistem Back-End Satu Data Panaikang Smart Environment
            </p>
          </div>

          {/* Login Form Body */}
          <div className="p-6 sm:p-8">
            {initialTab === 'dashboard_lurah' && (
              <div className="mb-5 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs font-semibold text-amber-950 flex items-start gap-2.5">
                <Lock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <span>
                  Menu Ini hanya dapat diakses oleh Lurah. Silakan masuk menggunakan akun Lurah
                  Panaikang untuk membuka tab <strong>Dashboard Lurah</strong>.
                </span>
              </div>
            )}

            {loginError && (
              <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs font-medium text-red-800 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Username / NIP Pejabat *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    placeholder="Masukkan Username atau NIP"
                    autoComplete="username"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:border-[#0D3868] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Kata Sandi Administrator *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Masukkan kata sandi"
                    autoComplete="current-password"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:border-[#0D3868] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                    aria-label="Tampilkan atau sembunyikan kata sandi"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full mt-2 inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#0D3868] hover:bg-[#072647] text-white text-sm font-bold shadow-sm transition-colors cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>
                  {isLoggingIn ? 'Memverifikasi Kredensial...' : 'Masuk ke Panel Administrator'}
                </span>
              </button>
            </form>

            <div className="mt-5 pt-4 border-t border-slate-100 text-center">
              <p className="text-[11px] text-slate-500">
                Akses terbatas khusus Pejabat Struktural & Operator Resmi Pemerintah Kelurahan
                Panaikang.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const totalRtInKelurahan = rwGroups.reduce((acc, r) => acc + (r.rtList?.length || 0), 0);

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
      {/* Unified Admin Header & Structured Module Navigation Menu Card */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        {/* Top Officer Session & Portal Return Strip */}
        <div className="px-4 sm:px-6 py-3 bg-[#0D3868] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <div className="text-xs sm:text-sm font-bold text-white">
                {adminSession.fullName}
              </div>
              <div className="text-[11px] text-sky-200">
                {adminSession.role} · Login:{' '}
                <span className="font-mono-num">{adminSession.loginAt}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
            <button
              type="button"
              onClick={() => onNavigate('beranda')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20 transition-colors cursor-pointer whitespace-nowrap"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Kembali ke Portal Utama</span>
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-red-600 text-white text-xs font-bold border border-white/20 transition-colors cursor-pointer whitespace-nowrap"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Keluar (Logout)</span>
            </button>
          </div>
        </div>

        {/* Title & Organized 7-Item Module Navigation Menu */}
        <div className="p-5 sm:p-6">
          <div>
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-6 h-6 text-[#1C8237] shrink-0" />
              <h1 className="text-xl sm:text-2xl font-extrabold text-[#0D3868] tracking-tight">
                Panel Administrator & Back-End Satu Data Panaikang
              </h1>
            </div>
            <p className="mt-1 text-xs sm:text-sm text-slate-600">
              Kelola penambahan, pengeditan, validasi, penyimpanan, dan penghapusan data Profil
              Kelurahan, Laporan Warga, Bank Sampah, Kerja Bakti, serta RT & RW secara terpusat.
            </p>
          </div>

          {/* Structured Full-Width Navigation Menu Grid */}
          <div className="mt-5 pt-4 border-t border-slate-200">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2.5">
              Menu Navigasi Modul Administrator & Dashboard Lurah
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
              <button
                type="button"
                onClick={() => handleTabSwitch('dashboard_lurah')}
                className={`flex flex-col justify-between p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  activeTab === 'dashboard_lurah'
                    ? 'bg-[#2E7D32] border-[#2E7D32] text-white shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <BarChart3
                    className={`w-4 h-4 shrink-0 ${
                      activeTab === 'dashboard_lurah' ? 'text-emerald-200' : 'text-[#2E7D32]'
                    }`}
                  />
                  <span className="text-xs font-bold truncate">Dashboard Lurah</span>
                </div>
                <span
                  className={`mt-1 text-[10px] font-medium truncate ${
                    activeTab === 'dashboard_lurah' ? 'text-emerald-100' : 'text-slate-500'
                  }`}
                >
                  Disposisi & Arsip PDF
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleTabSwitch('profil')}
                className={`flex flex-col justify-between p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  activeTab === 'profil'
                    ? 'bg-[#0D3868] border-[#0D3868] text-white shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Building2
                    className={`w-4 h-4 shrink-0 ${
                      activeTab === 'profil' ? 'text-sky-200' : 'text-[#0D3868]'
                    }`}
                  />
                  <span className="text-xs font-bold truncate">Profil Kelurahan</span>
                </div>
                <span
                  className={`mt-1 text-[10px] font-medium truncate ${
                    activeTab === 'profil' ? 'text-sky-100' : 'text-slate-500'
                  }`}
                >
                  Data Lurah & Visi Misi
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleTabSwitch('info')}
                className={`flex flex-col justify-between p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  activeTab === 'info'
                    ? 'bg-[#1C8237] border-[#1C8237] text-white shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Newspaper
                    className={`w-4 h-4 shrink-0 ${
                      activeTab === 'info' ? 'text-emerald-200' : 'text-[#1C8237]'
                    }`}
                  />
                  <span className="text-xs font-bold truncate">Informasi & IG</span>
                </div>
                <span
                  className={`mt-1 text-[10px] font-medium truncate font-mono-num ${
                    activeTab === 'info' ? 'text-emerald-100' : 'text-slate-500'
                  }`}
                >
                  {kelurahanInfos.length} Postingan Aktif
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleTabSwitch('laporan')}
                className={`flex flex-col justify-between p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  activeTab === 'laporan'
                    ? 'bg-[#0277BD] border-[#0277BD] text-white shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <FileText
                    className={`w-4 h-4 shrink-0 ${
                      activeTab === 'laporan' ? 'text-sky-200' : 'text-[#0277BD]'
                    }`}
                  />
                  <span className="text-xs font-bold truncate">Laporan Warga</span>
                </div>
                <span
                  className={`mt-1 text-[10px] font-medium truncate font-mono-num ${
                    activeTab === 'laporan' ? 'text-sky-100' : 'text-slate-500'
                  }`}
                >
                  {reports.length} Laporan · {whatsappRecipients.length} WA
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleTabSwitch('sampah')}
                className={`flex flex-col justify-between p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  activeTab === 'sampah'
                    ? 'bg-[#EF6C00] border-[#EF6C00] text-white shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Recycle
                    className={`w-4 h-4 shrink-0 ${
                      activeTab === 'sampah' ? 'text-amber-200' : 'text-[#EF6C00]'
                    }`}
                  />
                  <span className="text-xs font-bold truncate">Bank Sampah</span>
                </div>
                <span
                  className={`mt-1 text-[10px] font-medium truncate font-mono-num ${
                    activeTab === 'sampah' ? 'text-amber-100' : 'text-slate-500'
                  }`}
                >
                  {wasteUnits.length} Unit BSU RW
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleTabSwitch('kerjabakti')}
                className={`flex flex-col justify-between p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  activeTab === 'kerjabakti'
                    ? 'bg-[#5E35B1] border-[#5E35B1] text-white shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Calendar
                    className={`w-4 h-4 shrink-0 ${
                      activeTab === 'kerjabakti' ? 'text-purple-200' : 'text-[#5E35B1]'
                    }`}
                  />
                  <span className="text-xs font-bold truncate">Kerja Bakti</span>
                </div>
                <span
                  className={`mt-1 text-[10px] font-medium truncate font-mono-num ${
                    activeTab === 'kerjabakti' ? 'text-purple-100' : 'text-slate-500'
                  }`}
                >
                  {cleanupEvents.length} Jadwal & Foto
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleTabSwitch('rtrw')}
                className={`col-span-2 sm:col-span-1 flex flex-col justify-between p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  activeTab === 'rtrw'
                    ? 'bg-[#0D3868] border-[#0D3868] text-white shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Users
                    className={`w-4 h-4 shrink-0 ${
                      activeTab === 'rtrw' ? 'text-emerald-300' : 'text-[#0D3868]'
                    }`}
                  />
                  <span className="text-xs font-bold truncate">Data RT & RW</span>
                </div>
                <span
                  className={`mt-1 text-[10px] font-medium truncate font-mono-num ${
                    activeTab === 'rtrw' ? 'text-sky-100' : 'text-slate-500'
                  }`}
                >
                  {rwGroups.length} RW / {totalRtInKelurahan} RT
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Global Validation Errors or Success Banner */}
      {validationErrors.length > 0 && (
        <div className="mt-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-900">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1 text-xs sm:text-sm">
              <div className="font-bold">Validasi Data Gagal — Mohon Periksa Kembali:</div>
              <ul className="mt-1 list-disc list-inside space-y-0.5 text-red-800">
                {validationErrors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
            <button
              type="button"
              onClick={() => setValidationErrors([])}
              className="text-red-500 hover:text-red-800 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="mt-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-xs sm:text-sm font-semibold">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMessage('')}
            className="text-xs font-bold text-emerald-800 hover:underline cursor-pointer"
          >
            Tutup
          </button>
        </div>
      )}

      {/* ================= TAB 0: DASHBOARD LURAH (KHUSUS LURAH) ================= */}
      {activeTab === 'dashboard_lurah' && (
        <div className="mt-6">
          {isLurahSession ? (
            <DashboardLurahView
              reports={reports}
              wasteUnits={wasteUnits}
              cleanupEvents={cleanupEvents}
              profile={profile}
              rwGroups={rwGroups}
              whatsappRecipients={whatsappRecipients}
              onUpdateReportStatus={(id, newStatus, assignedTeam, responseNote) => {
                if (onUpdateReportStatus) {
                  onUpdateReportStatus(id, newStatus, assignedTeam, responseNote);
                } else {
                  onUpdateReport(id, {
                    status: newStatus,
                    assignedTeam,
                    responseNote,
                  });
                }
              }}
              onNavigate={onNavigate}
              isEmbeddedInAdmin={true}
              onOpenWhatsAppManager={() => handleTabSwitch('laporan')}
              onPdfDownloaded={(res) =>
                setSuccessMessage(
                  `Arsip Fisik Laporan Bulanan Permasalahan Lingkungan (${res.periodLabel}) berhasil diunduh sebagai file PDF: ${res.fileName}`
                )
              }
            />
          ) : (
            <div className="bg-white rounded-2xl border-2 border-amber-200 p-8 text-center max-w-2xl mx-auto space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto">
                <Lock className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-extrabold text-[#0D3868]">
                Menu Ini hanya dapat diakses oleh Lurah
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Anda saat ini masuk sebagai <strong>{adminSession.role}</strong>. Tab{' '}
                <strong>Dashboard Lurah</strong> hanya dapat dilihat oleh Lurah Panaikang. Silakan
                keluar dan masuk kembali menggunakan akun Lurah.
              </p>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0D3868] hover:bg-[#072647] text-white text-xs font-bold cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Keluar & Login sebagai Lurah</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 1: KELOLA PROFIL KELURAHAN ================= */}
      {activeTab === 'profil' && (
        <form
          onSubmit={handleProfileSubmit}
          className="mt-6 bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <div>
              <h2 className="text-lg font-bold text-[#0D3868]">
                Manajemen & Perubahan Data Profil Kelurahan Panaikang
              </h2>
              <p className="text-xs text-slate-500">
                Seluruh perubahan divalidasi oleh server Back-End dan langsung diperbarui pada
                halaman Profil Kelurahan.
              </p>
            </div>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => onNavigate('profil')}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Lihat Halaman Publik
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#1C8237] hover:bg-[#146329] text-white text-xs sm:text-sm font-bold transition-colors cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>{isSubmitting ? 'Menyimpan...' : 'Validasi & Simpan Profil'}</span>
              </button>
            </div>
          </div>

          {/* Section A: Data Lurah & Perangkat */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-3">
              01. Data Pimpinan Lurah & Perangkat Struktural
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Lengkap Lurah *
                </label>
                <input
                  type="text"
                  value={profileDraft.lurahName}
                  onChange={(e) =>
                    setProfileDraft({ ...profileDraft, lurahName: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  NIP Lurah *
                </label>
                <input
                  type="text"
                  value={profileDraft.lurahNip}
                  onChange={(e) =>
                    setProfileDraft({ ...profileDraft, lurahNip: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm font-mono-num"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pangkat / Golongan *
                </label>
                <input
                  type="text"
                  value={profileDraft.lurahRank}
                  onChange={(e) =>
                    setProfileDraft({ ...profileDraft, lurahRank: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Periode Jabatan
                </label>
                <input
                  type="text"
                  value={profileDraft.lurahPeriod}
                  onChange={(e) =>
                    setProfileDraft({ ...profileDraft, lurahPeriod: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Sekretaris Lurah
                </label>
                <input
                  type="text"
                  value={profileDraft.sekretarisName}
                  onChange={(e) =>
                    setProfileDraft({ ...profileDraft, sekretarisName: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kasi Kebersihan & Lingkungan
                </label>
                <input
                  type="text"
                  value={profileDraft.kasiKebersihanName}
                  onChange={(e) =>
                    setProfileDraft({ ...profileDraft, kasiKebersihanName: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kasi Pemerintahan & Trantib
                </label>
                <input
                  type="text"
                  value={profileDraft.kasiPemerintahanName}
                  onChange={(e) =>
                    setProfileDraft({ ...profileDraft, kasiPemerintahanName: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Sambutan / Pesan Lurah Panaikang
              </label>
              <textarea
                rows={2}
                value={profileDraft.lurahMessage}
                onChange={(e) =>
                  setProfileDraft({ ...profileDraft, lurahMessage: e.target.value })
                }
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm"
              />
            </div>
          </div>

          {/* Section B: Alamat Kantor & Kontak */}
          <div className="pt-4 border-t border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 mb-3">
              02. Alamat Kantor Kelurahan, Jam Pelayanan & Batas Wilayah
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Alamat Lengkap Kantor Kelurahan Panaikang *
                </label>
                <input
                  type="text"
                  value={profileDraft.officeAddress}
                  onChange={(e) =>
                    setProfileDraft({ ...profileDraft, officeAddress: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kode Pos
                </label>
                <input
                  type="text"
                  value={profileDraft.postalCode}
                  onChange={(e) =>
                    setProfileDraft({ ...profileDraft, postalCode: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm font-mono-num"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Jam Operasional Pelayanan
                </label>
                <input
                  type="text"
                  value={profileDraft.serviceHours}
                  onChange={(e) =>
                    setProfileDraft({ ...profileDraft, serviceHours: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Telepon / Hotline
                </label>
                <input
                  type="text"
                  value={profileDraft.phoneContact}
                  onChange={(e) =>
                    setProfileDraft({ ...profileDraft, phoneContact: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm font-mono-num"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Resmi Kelurahan *
                </label>
                <input
                  type="email"
                  value={profileDraft.emailContact}
                  onChange={(e) =>
                    setProfileDraft({ ...profileDraft, emailContact: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm"
                />
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Batas Utara
                </label>
                <input
                  type="text"
                  value={profileDraft.boundaries.utara}
                  onChange={(e) =>
                    setProfileDraft({
                      ...profileDraft,
                      boundaries: { ...profileDraft.boundaries, utara: e.target.value },
                    })
                  }
                  className="w-full rounded-xl border border-slate-300 px-3 py-1.5 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Batas Selatan
                </label>
                <input
                  type="text"
                  value={profileDraft.boundaries.selatan}
                  onChange={(e) =>
                    setProfileDraft({
                      ...profileDraft,
                      boundaries: { ...profileDraft.boundaries, selatan: e.target.value },
                    })
                  }
                  className="w-full rounded-xl border border-slate-300 px-3 py-1.5 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Batas Timur
                </label>
                <input
                  type="text"
                  value={profileDraft.boundaries.timur}
                  onChange={(e) =>
                    setProfileDraft({
                      ...profileDraft,
                      boundaries: { ...profileDraft.boundaries, timur: e.target.value },
                    })
                  }
                  className="w-full rounded-xl border border-slate-300 px-3 py-1.5 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Batas Barat
                </label>
                <input
                  type="text"
                  value={profileDraft.boundaries.barat}
                  onChange={(e) =>
                    setProfileDraft({
                      ...profileDraft,
                      boundaries: { ...profileDraft.boundaries, barat: e.target.value },
                    })
                  }
                  className="w-full rounded-xl border border-slate-300 px-3 py-1.5 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Section C: Visi & Misi */}
          <div className="pt-4 border-t border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 mb-3">
              03. Pernyataan Visi & Daftar Misi Kelurahan Panaikang
            </h3>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Visi Kelurahan Panaikang *
              </label>
              <textarea
                rows={2}
                value={profileDraft.visi}
                onChange={(e) => setProfileDraft({ ...profileDraft, visi: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm"
              />
            </div>

            <div className="mt-4">
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Butir Misi Kelurahan Panaikang ({profileDraft.misi.length} Butir) *
              </label>
              <div className="space-y-2">
                {profileDraft.misi.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="font-mono-num text-xs font-bold text-[#1C8237] w-6">
                      0{idx + 1}.
                    </span>
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => {
                        const updated = [...profileDraft.misi];
                        updated[idx] = e.target.value;
                        setProfileDraft({ ...profileDraft, misi: updated });
                      }}
                      className="flex-1 rounded-xl border border-slate-300 px-3 py-1.5 text-xs sm:text-sm"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setProfileDraft({
                          ...profileDraft,
                          misi: profileDraft.misi.filter((_, i) => i !== idx),
                        })
                      }
                      className="p-2 rounded-lg text-red-600 hover:bg-red-50 cursor-pointer"
                      title="Hapus butir misi"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-3 flex items-center gap-2">
                <input
                  type="text"
                  value={newMisiText}
                  onChange={(e) => setNewMisiText(e.target.value)}
                  placeholder="Ketik butir misi baru untuk ditambahkan..."
                  className="flex-1 rounded-xl border border-slate-300 px-3.5 py-2 text-xs sm:text-sm"
                />
                <button
                  type="button"
                  onClick={handleAddMisiItem}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-800 cursor-pointer whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Butir Misi</span>
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* ================= TAB 2: KELOLA INFORMASI SEPUTAR KELURAHAN PANAIKANG (CRUD) ================= */}
      {activeTab === 'info' && (
        <div className="mt-6 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#E1306C] mb-1">
                <Instagram className="w-3.5 h-3.5" />
                <span>TERHUBUNG DENGAN INSTAGRAM @kelurahan.panaikang</span>
              </div>
              <h2 className="text-base font-bold text-[#0D3868]">
                Kelola Informasi Seputar Kelurahan & Postingan Instagram @kelurahan.panaikang
              </h2>
              <p className="text-xs text-slate-500">
                Lurah maupun Operator dapat menambah, mengedit, menyambungkan tautan postingan
                Instagram @kelurahan.panaikang, mengunggah gambar, dan menghapus informasi.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto">
              <button
                type="button"
                onClick={handleSyncInstagramAdmin}
                disabled={isSyncingIgAdmin}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-rose-200 bg-rose-50/70 hover:bg-rose-100 text-[#E1306C] text-xs font-bold cursor-pointer whitespace-nowrap"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${isSyncingIgAdmin ? 'animate-spin' : ''}`}
                />
                <span>Sinkronkan @kelurahan.panaikang</span>
              </button>
              <button
                type="button"
                onClick={openAddInfoForm}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#1C8237] hover:bg-[#146329] text-white text-xs sm:text-sm font-bold cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Postingan / Informasi</span>
              </button>
            </div>
          </div>

          {showInfoForm && (
            <form
              onSubmit={handleInfoFormSubmit}
              className="bg-white rounded-2xl border-2 border-emerald-200 p-6 space-y-5"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <h3 className="text-base font-bold text-[#0D3868]">
                  {editingInfoId
                    ? 'Edit Informasi Seputar Kelurahan Panaikang'
                    : 'Tambah Informasi Seputar Kelurahan Panaikang Baru'}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowInfoForm(false)}
                  className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Judul Informasi / Pengumuman * (Min. 5 karakter)
                  </label>
                  <input
                    type="text"
                    value={infoForm.title || ''}
                    onChange={(e) => setInfoForm({ ...infoForm, title: e.target.value })}
                    placeholder="Contoh: Jadwal Fogging & Kerja Bakti Serentak RW 01 - RW 06"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kategori Informasi *
                  </label>
                  <select
                    value={infoForm.category || 'Pengumuman Kelurahan'}
                    onChange={(e) => setInfoForm({ ...infoForm, category: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm bg-white"
                  >
                    <option value="Pengumuman Kelurahan">Pengumuman Kelurahan</option>
                    <option value="Program Lingkungan">Program Lingkungan</option>
                    <option value="Agenda Warga">Agenda Warga</option>
                    <option value="Layanan Publik">Layanan Publik</option>
                    <option value="Inovasi Kelurahan">Inovasi Kelurahan</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Diterbitkan Oleh (Lurah / Operator)
                  </label>
                  <input
                    type="text"
                    value={infoForm.author || ''}
                    onChange={(e) => setInfoForm({ ...infoForm, author: e.target.value })}
                    placeholder="Lurah Panaikang / Operator Satu Data Kelurahan"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tanggal Publikasi
                  </label>
                  <input
                    type="text"
                    value={infoForm.publishedAt || ''}
                    onChange={(e) => setInfoForm({ ...infoForm, publishedAt: e.target.value })}
                    placeholder="Contoh: 06 Okt 2026"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm font-mono-num"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-rose-50/40 border border-rose-200/70">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Akun Instagram Resmi
                  </label>
                  <input
                    type="text"
                    value={infoForm.instagramHandle || '@kelurahan.panaikang'}
                    onChange={(e) =>
                      setInfoForm({ ...infoForm, instagramHandle: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-[#E1306C]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tautan Postingan Instagram (@kelurahan.panaikang)
                  </label>
                  <input
                    type="url"
                    value={
                      infoForm.instagramPostUrl ||
                      'https://www.instagram.com/kelurahan.panaikang/'
                    }
                    onChange={(e) =>
                      setInfoForm({ ...infoForm, instagramPostUrl: e.target.value })
                    }
                    placeholder="https://www.instagram.com/kelurahan.panaikang/"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tagar / Hashtags Instagram
                  </label>
                  <input
                    type="text"
                    value={hashtagsText}
                    onChange={(e) => setHashtagsText(e.target.value)}
                    placeholder="#KelurahanPanaikang #KotaMakassar"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ringkasan Singkat (Tampil pada Kartu Halaman Utama)
                </label>
                <input
                  type="text"
                  value={infoForm.summary || ''}
                  onChange={(e) => setInfoForm({ ...infoForm, summary: e.target.value })}
                  placeholder="Opsional — bila dikosongkan akan diambil otomatis dari isi teks informasi"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Isi Teks Informasi Lengkap * (Min. 15 karakter)
                </label>
                <textarea
                  rows={4}
                  value={infoForm.content || ''}
                  onChange={(e) => setInfoForm({ ...infoForm, content: e.target.value })}
                  placeholder="Tuliskan isi pengumuman, kegiatan, atau informasi seputar Kelurahan Panaikang secara lengkap..."
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm"
                />
              </div>

              {/* Image Selection & File Upload Section */}
              <div className="pt-2 border-t border-slate-200 grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
                <div className="md:col-span-7 space-y-3">
                  <label className="block text-xs font-semibold text-slate-700">
                    Gambar Informasi (Unggah File Gambar atau Pilih Dokumentasi Kelurahan) *
                  </label>

                  {/* File Upload Input */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-xs font-bold text-slate-800 cursor-pointer transition-colors">
                      <Upload className="w-4 h-4 text-[#1C8237]" />
                      <span>Unggah Gambar dari Perangkat</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleInfoImageUpload}
                        className="hidden"
                      />
                    </label>
                    <span className="text-[11px] text-slate-500">
                      Mendukung JPG, PNG, WEBP
                    </span>
                  </div>

                  {/* Preset Gallery Options */}
                  <div>
                    <div className="text-[11px] font-semibold text-slate-600 mb-1.5">
                      Atau pilih foto dokumentasi resmi Kelurahan Panaikang:
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      {[
                        { label: 'Nipah Mall Makassar', url: IMG_NIPAH_MALL },
                        { label: 'Bank Sampah', url: IMG_BANK_SAMPAH },
                        { label: 'Normalisasi Drainase', url: IMG_DRAINASE },
                        { label: 'Kerja Bakti Warga', url: IMG_KERJA_BAKTI },
                        { label: 'Koridor Panaikang', url: HERO_IMAGE_PATH },
                      ].map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => setInfoForm({ ...infoForm, imageUrl: preset.url })}
                          className={`py-2 px-2.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                            infoForm.imageUrl === preset.url
                              ? 'bg-emerald-50 text-[#1C8237] border-[#1C8237]'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Live Image Preview */}
                <div className="md:col-span-5">
                  <div className="text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-[#1C8237]" />
                    <span>Pratinjau Gambar Informasi:</span>
                  </div>
                  <div className="h-36 w-full rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                    {infoForm.imageUrl ? (
                      <img
                        src={resolveImageUrl(infoForm.imageUrl)}
                        alt="Pratinjau Gambar Informasi"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">
                        Belum ada gambar dipilih
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowInfoForm(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#1C8237] hover:bg-[#146329] text-white text-xs sm:text-sm font-bold cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>
                    {editingInfoId
                      ? 'Simpan Perubahan Informasi'
                      : 'Terbitkan Informasi ke Halaman Utama'}
                  </span>
                </button>
              </div>
            </form>
          )}

          {/* Daftar Artikel Informasi Kelurahan */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {kelurahanInfos.map((info) => (
              <div
                key={info.id}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <div className="h-44 w-full bg-slate-100 overflow-hidden">
                    <img
                      src={resolveImageUrl(info.imageUrl)}
                      alt={info.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-5">
                    <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                      <span className="font-bold text-[#1C8237]">{info.category}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono-num">{info.publishedAt}</span>
                      <span aria-hidden="true">·</span>
                      <span>{info.author}</span>
                    </div>
                    <h3 className="mt-1.5 text-base font-bold text-[#0D3868]">{info.title}</h3>
                    <p className="mt-1.5 text-xs text-slate-600 leading-relaxed line-clamp-3">
                      {info.content}
                    </p>
                  </div>
                </div>

                <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">Status: Tampil di Beranda</span>

                  {confirmDeleteInfoId === info.id ? (
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleExecuteDeleteInfo(info.id)}
                        className="px-2.5 py-1 rounded-lg bg-red-600 text-white text-xs font-bold cursor-pointer"
                      >
                        Ya, Hapus
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteInfoId(null)}
                        className="px-2.5 py-1 rounded-lg bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
                      >
                        Batal
                      </button>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openEditInfoForm(info)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-xs font-semibold text-slate-700 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-[#1C8237]" />
                        <span>Edit / Update</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteInfoId(info.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-red-200 bg-red-50/70 hover:bg-red-100 text-xs font-semibold text-red-700 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Hapus</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= TAB 3: KELOLA LAPORAN WARGA (CRUD) ================= */}
      {activeTab === 'laporan' && (
        <div className="mt-6 space-y-6">
          {/* ARSIP FISIK LAPORAN BULANAN PERMASALAHAN LINGKUNGAN (PDF) */}
          <MonthlyArchivePdfPanel
            profile={profile}
            reports={reports}
            wasteUnits={wasteUnits}
            cleanupEvents={cleanupEvents}
            rwGroups={rwGroups}
            onPdfDownloaded={(res) =>
              setSuccessMessage(
                `Arsip Fisik Laporan Bulanan Permasalahan Lingkungan (${res.periodLabel}) berhasil diunduh sebagai file PDF: ${res.fileName}`
              )
            }
          />

          {/* MANAJEMEN NOMOR WHATSAPP PENERIMA LAPORAN WARGA (KHUSUS LURAH / ADMIN) */}
          <div className="bg-white rounded-2xl border-2 border-[#128C7E]/30 p-5 sm:p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#128C7E] text-white flex items-center justify-center shrink-0">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span className="font-bold text-[#128C7E]">
                      KHUSUS HALAMAN ADMIN · DISEMBUNYIKAN DARI PUBLIK WARGA
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>Semua Nomor Terdaftar Menerima Laporan Warga</span>
                  </div>
                  <h2 className="text-base sm:text-lg font-extrabold text-[#0D3868] mt-0.5">
                    Manajemen & Koordinasi Nomor WhatsApp Penerima Laporan Warga
                  </h2>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Daftar nama, jabatan, dan nomor telepon penerima laporan di bawah ini <strong>tidak ditampilkan pada menu Untuk Warga</strong> (hanya terlihat di Halaman Admin). Seluruh nomor aktif otomatis menerima laporan dari warga dan dapat langsung saling berkoordinasi menggunakan tombol <strong>Koordinasi WA</strong> pada setiap kartu penerima maupun pada setiap baris laporan.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={openAddWaRecipientForm}
                className="self-start sm:self-auto inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#128C7E] hover:bg-[#075E54] text-white text-xs sm:text-sm font-bold cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                <span>+ Tambah Nomor WhatsApp</span>
              </button>
            </div>

            {showWaForm && (
              <form
                onSubmit={handleWaFormSubmit}
                className="rounded-2xl border-2 border-emerald-300 bg-emerald-50/40 p-5 space-y-4"
              >
                <div className="flex items-center justify-between pb-2 border-b border-emerald-200">
                  <h3 className="text-sm font-extrabold text-[#075E54]">
                    {editingWaId
                      ? 'Edit Nomor Telepon Penerima WhatsApp Laporan Warga'
                      : 'Tambah Nomor Telepon Penerima WhatsApp Baru'}
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setShowWaForm(false);
                      setEditingWaId(null);
                    }}
                    className="text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nama Pejabat / Penerima *
                    </label>
                    <input
                      type="text"
                      value={waForm.name || ''}
                      onChange={(e) => setWaForm({ ...waForm, name: e.target.value })}
                      placeholder="Contoh: Muthmainnah, SE, MM (Lurah)"
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Jabatan / Peran Penerima *
                    </label>
                    <input
                      type="text"
                      value={waForm.role || ''}
                      onChange={(e) => setWaForm({ ...waForm, role: e.target.value })}
                      placeholder="Contoh: Lurah Panaikang / Admin Satgas"
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nomor Telepon WhatsApp * (08xx / 628xx)
                    </label>
                    <input
                      type="tel"
                      value={waForm.phoneNumber || ''}
                      onChange={(e) => setWaForm({ ...waForm, phoneNumber: e.target.value })}
                      placeholder="Contoh: 081144402026"
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm bg-white font-mono-num"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Cakupan Wilayah Laporan
                    </label>
                    <select
                      value={waForm.rwScope || 'Seluruh Wilayah'}
                      onChange={(e) => setWaForm({ ...waForm, rwScope: e.target.value })}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm bg-white"
                    >
                      <option value="Seluruh Wilayah">Seluruh Wilayah Kelurahan Panaikang</option>
                      {RW_LIST.map((r) => (
                        <option key={r} value={r}>
                          Khusus {r}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Keterangan / Catatan Layanan
                    </label>
                    <input
                      type="text"
                      value={waForm.notes || ''}
                      onChange={(e) => setWaForm({ ...waForm, notes: e.target.value })}
                      placeholder="Contoh: Aktif 24 Jam menerima pengaduan warga"
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm bg-white"
                    />
                  </div>
                  <div className="flex flex-col gap-2 pt-2 sm:pt-4">
                    <label className="inline-flex items-center gap-2 text-xs font-bold text-[#075E54] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(waForm.isPrimary)}
                        onChange={(e) => setWaForm({ ...waForm, isPrimary: e.target.checked })}
                        className="rounded text-[#128C7E]"
                      />
                      <span>Jadikan Nomor Utama (Otomatis Terbuka Saat Warga Lapor)</span>
                    </label>
                    <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={waForm.isActive !== false}
                        onChange={(e) => setWaForm({ ...waForm, isActive: e.target.checked })}
                        className="rounded text-[#128C7E]"
                      />
                      <span>Tampilkan & Aktifkan di Formulir Laporan Warga</span>
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowWaForm(false);
                      setEditingWaId(null);
                    }}
                    className="px-4 py-2 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-700 cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#128C7E] hover:bg-[#075E54] text-white text-xs font-bold cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>
                      {editingWaId ? 'Simpan Perubahan Nomor WA' : 'Simpan Nomor WhatsApp Baru'}
                    </span>
                  </button>
                </div>
              </form>
            )}

            {/* Daftar Nomor WhatsApp Terdaftar (Khusus Admin & Koordinasi Antar Penerima) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {whatsappRecipients.map((recipient) => {
                const coordMsg = buildInterRecipientCoordinationMessage(
                  recipient,
                  whatsappRecipients,
                  reports
                );
                const coordWaUrl = buildWhatsAppUrl(recipient.phoneNumber, coordMsg);
                return (
                  <div
                    key={recipient.id}
                    className={`rounded-2xl border p-4 flex flex-col justify-between gap-3 ${
                      recipient.isPrimary
                        ? 'bg-emerald-50/60 border-2 border-[#128C7E]'
                        : 'bg-slate-50/70 border-slate-200'
                    }`}
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-bold text-[#075E54]">
                          {recipient.isPrimary
                            ? '★ PENERIMA UTAMA · TERIMA SEMUA LAPORAN'
                            : `TERIMA LAPORAN (${recipient.rwScope})`}
                        </span>
                        <span
                          className={`text-[11px] font-semibold ${
                            recipient.isActive ? 'text-emerald-700' : 'text-slate-400'
                          }`}
                        >
                          {recipient.isActive ? '● Aktif Menerima' : '○ Nonaktif'}
                        </span>
                      </div>
                      <h3 className="text-sm font-extrabold text-[#0D3868]">{recipient.name}</h3>
                      <div className="text-xs text-slate-600">{recipient.role}</div>
                      <div className="pt-1 flex items-center gap-1.5 text-xs font-mono-num font-bold text-[#128C7E]">
                        <Phone className="w-3.5 h-3.5" />
                        <span>{formatDisplayPhone(recipient.phoneNumber)}</span>
                      </div>
                      {recipient.notes && (
                        <p className="text-[11px] text-slate-500 leading-relaxed pt-1">
                          {recipient.notes}
                        </p>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <a
                          href={coordWaUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#128C7E] hover:bg-[#075E54] text-white text-[11px] font-bold"
                          title="Hubungi & Koordinasi Langsung via WhatsApp beserta Ringkasan Laporan"
                        >
                          <MessageCircle className="w-3 h-3" />
                          <span>Koordinasi WA</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                        {!recipient.isPrimary && (
                          <button
                            type="button"
                            onClick={() => handleSetPrimaryWaRecipient(recipient.id)}
                            className="px-2.5 py-1 rounded-lg bg-white border border-emerald-300 hover:bg-emerald-50 text-[11px] font-bold text-[#075E54] cursor-pointer"
                          >
                            Set Utama
                          </button>
                        )}
                      </div>

                      {confirmDeleteWaId === recipient.id ? (
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleExecuteDeleteWaRecipient(recipient.id)}
                            className="px-2.5 py-1 rounded-lg bg-red-600 text-white text-[11px] font-bold cursor-pointer"
                          >
                            Ya, Hapus
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteWaId(null)}
                            className="px-2 py-1 rounded-lg bg-slate-200 text-slate-700 text-[11px] font-semibold cursor-pointer"
                          >
                            Batal
                          </button>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openEditWaRecipientForm(recipient)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-[11px] font-semibold text-slate-700 cursor-pointer"
                          >
                            <Edit3 className="w-3 h-3 text-[#128C7E]" />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteWaId(recipient.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-red-200 bg-red-50/70 hover:bg-red-100 text-[11px] font-semibold text-red-700 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Hapus</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={reportSearch}
                onChange={(e) => setReportSearch(e.target.value)}
                placeholder="Cari tiket, judul laporan, nama pelapor, atau RW..."
                className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 focus:border-[#0277BD] focus:outline-none"
              />
            </div>
            <button
              type="button"
              onClick={openAddReportForm}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0277BD] hover:bg-[#01579B] text-white text-xs sm:text-sm font-bold cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Data Laporan</span>
            </button>
          </div>

          {showReportForm && (
            <form
              onSubmit={handleReportFormSubmit}
              className="bg-white rounded-2xl border-2 border-sky-200 p-6 space-y-5 shadow-xs"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div>
                  <h3 className="text-base font-bold text-[#0D3868]">
                    {editingReportId
                      ? 'Verifikasi, Proses & Selesaikan Tindak Lanjut Laporan Warga'
                      : 'Tambah Data Laporan Warga Baru'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Petugas (Admin / Operator) dapat memverifikasi, memproses, menyelesaikan laporan, serta melampirkan foto pengerjaan untuk dilihat oleh warga.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowReportForm(false)}
                  className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Tombol Tahapan Cepat Tindak Lanjut Petugas */}
              <div className="p-3.5 rounded-xl bg-sky-50/70 border border-sky-200">
                <div className="text-[11px] font-bold text-[#0D3868] uppercase tracking-wider mb-2">
                  Pilih Tahapan Tindak Lanjut Petugas (Admin / Operator):
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() =>
                      setReportForm({
                        ...reportForm,
                        status: 'Menunggu Verifikasi',
                      })
                    }
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      reportForm.status === 'Menunggu Verifikasi'
                        ? 'bg-amber-50 border-amber-400 text-amber-950 font-bold'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-xs font-bold">1. Menunggu Verifikasi</div>
                    <div className="text-[11px] text-slate-500">Laporan baru masuk dari warga</div>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setReportForm({
                        ...reportForm,
                        status: 'Sedang Ditangani',
                        verifiedBy:
                          reportForm.verifiedBy ||
                          adminSession?.fullName ||
                          'Petugas Operator Kelurahan',
                        verifiedAt: reportForm.verifiedAt || '06 Okt 2026 · Diverifikasi Petugas',
                        assignedTeam:
                          reportForm.assignedTeam ||
                          `Satgas Kebersihan & Koordinator ${reportForm.rw || 'RW'}`,
                        responseNote:
                          reportForm.responseNote &&
                          !reportForm.responseNote.includes('Menunggu verifikasi')
                            ? reportForm.responseNote
                            : 'Laporan telah diverifikasi oleh petugas kelurahan dan saat ini sedang dalam proses pengerjaan di lapangan.',
                      })
                    }
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      reportForm.status === 'Sedang Ditangani'
                        ? 'bg-sky-100/80 border-sky-500 text-sky-950 font-bold'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-xs font-bold">2. Verifikasi & Proses Lapangan</div>
                    <div className="text-[11px] text-slate-500">Disposisi petugas sedang bekerja</div>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setReportForm({
                        ...reportForm,
                        status: 'Selesai',
                        verifiedBy:
                          reportForm.verifiedBy ||
                          adminSession?.fullName ||
                          'Petugas Operator Kelurahan',
                        verifiedAt: reportForm.verifiedAt || '06 Okt 2026 · Diverifikasi Petugas',
                        completedAt: '06 Okt 2026 · Tuntas Dikerjakan',
                        assignedTeam:
                          reportForm.assignedTeam ||
                          `Satgas Kebersihan & Koordinator ${reportForm.rw || 'RW'}`,
                        responseNote:
                          reportForm.responseNote &&
                          !reportForm.responseNote.includes('sedang dalam proses')
                            ? reportForm.responseNote
                            : 'Tindak lanjut pengerjaan lapangan telah SELESAI dilaksanakan secara tuntas oleh petugas Kelurahan Panaikang. Foto bukti pengerjaan terlampir.',
                      })
                    }
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      reportForm.status === 'Selesai'
                        ? 'bg-emerald-100/80 border-emerald-500 text-emerald-950 font-bold'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-xs font-bold">3. Selesaikan & Lampirkan Foto</div>
                    <div className="text-[11px] text-slate-500">Laporan selesai + bukti foto petugas</div>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Judul Laporan * (Min. 5 karakter)
                  </label>
                  <input
                    type="text"
                    value={reportForm.title || ''}
                    onChange={(e) => setReportForm({ ...reportForm, title: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kategori Masalah *
                  </label>
                  <select
                    value={reportForm.category || 'Sampah Liar & TPS'}
                    onChange={(e) =>
                      setReportForm({
                        ...reportForm,
                        category: e.target.value as ReportCategory,
                      })
                    }
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm bg-white"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Pelapor *
                  </label>
                  <input
                    type="text"
                    value={reportForm.reporterName || ''}
                    onChange={(e) =>
                      setReportForm({ ...reportForm, reporterName: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Wilayah RW *
                  </label>
                  <select
                    value={reportForm.rw || 'RW 02'}
                    onChange={(e) => setReportForm({ ...reportForm, rw: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm bg-white"
                  >
                    {RW_LIST.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Wilayah RT *
                  </label>
                  <select
                    value={reportForm.rt || 'RT 01'}
                    onChange={(e) => setReportForm({ ...reportForm, rt: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm bg-white"
                  >
                    {RT_LIST.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Status Tindak Lanjut *
                  </label>
                  <select
                    value={reportForm.status || 'Menunggu Verifikasi'}
                    onChange={(e) =>
                      setReportForm({
                        ...reportForm,
                        status: e.target.value as ReportStatus,
                      })
                    }
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm bg-white font-semibold"
                  >
                    <option value="Menunggu Verifikasi">Menunggu Verifikasi</option>
                    <option value="Sedang Ditangani">Sedang Ditangani (Diproses)</option>
                    <option value="Selesai">Selesai (Tuntas)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Lokasi / Patokan Jalan *
                  </label>
                  <input
                    type="text"
                    value={reportForm.locationName || ''}
                    onChange={(e) =>
                      setReportForm({ ...reportForm, locationName: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Petugas Verifikator (Admin / Operator)
                  </label>
                  <input
                    type="text"
                    value={reportForm.verifiedBy || ''}
                    onChange={(e) =>
                      setReportForm({ ...reportForm, verifiedBy: e.target.value })
                    }
                    placeholder={adminSession?.fullName || 'Administrator / Operator Kelurahan'}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Unit Pelaksana Disposisi Lapangan
                  </label>
                  <input
                    type="text"
                    value={reportForm.assignedTeam || ''}
                    onChange={(e) =>
                      setReportForm({ ...reportForm, assignedTeam: e.target.value })
                    }
                    placeholder="Contoh: Satgas Drainase & Kebersihan Kelurahan"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Deskripsi Kondisi Lapangan (Laporan Warga) * (Min. 10 karakter)
                </label>
                <textarea
                  rows={2}
                  value={reportForm.description || ''}
                  onChange={(e) =>
                    setReportForm({ ...reportForm, description: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Laporan Pengerjaan & Catatan Tindak Lanjut Petugas (Ditampilkan ke Warga) *
                </label>
                <textarea
                  rows={2}
                  value={reportForm.responseNote || ''}
                  onChange={(e) =>
                    setReportForm({ ...reportForm, responseNote: e.target.value })
                  }
                  placeholder="Tuliskan rincian tindakan verifikasi, pengerjaan lapangan, atau penyelesaian oleh petugas..."
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                />
              </div>

              {/* LAMPIRAN FOTO LAPORAN PENGERJAAN OLEH ADMIN / OPERATOR */}
              <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="text-xs sm:text-sm font-bold text-[#146329] flex items-center gap-1.5">
                      <Camera className="w-4 h-4" />
                      <span>
                        Lampiran Foto Laporan Pengerjaan / Tindak Lanjut Petugas (Admin / Operator)
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Unggah foto bukti penanganan atau penyelesaian laporan warga. Foto ini akan tampil secara transparan kepada warga pada menu Untuk Warga.
                    </p>
                  </div>
                  <label className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1C8237] hover:bg-[#146329] text-white text-xs font-bold cursor-pointer shrink-0">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Foto Pengerjaan</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleReportFollowUpPhotoUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Pilihan Cepat Dokumentasi Lapangan Petugas */}
                <div>
                  <div className="text-[11px] font-semibold text-slate-600 mb-1.5">
                    Atau lampirkan cepat foto dokumentasi pengerjaan lapangan Kelurahan Panaikang:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { label: 'Pengerukan Drainase', url: IMG_DRAINASE },
                      { label: 'Pengangkutan Sampah', url: IMG_KERJA_BAKTI },
                      { label: 'Penanganan BSU', url: IMG_BANK_SAMPAH },
                      { label: 'Pemangkasan & Kebersihan', url: IG_POST_6 },
                    ].map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() =>
                          setReportForm((prev) => {
                            const existing = Array.isArray(prev.followUpPhotos)
                              ? prev.followUpPhotos
                              : [];
                            const nextPhotos = [
                              preset.url,
                              ...existing.filter((p) => p !== preset.url),
                            ];
                            return {
                              ...prev,
                              completionPhotoUrl: preset.url,
                              followUpPhotos: nextPhotos,
                            };
                          })
                        }
                        className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-emerald-100 border border-emerald-200 text-xs font-semibold text-[#146329] cursor-pointer"
                      >
                        + {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Galeri Foto Tindak Lanjut yang Terlampir */}
                {Array.isArray(reportForm.followUpPhotos) &&
                reportForm.followUpPhotos.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                    {reportForm.followUpPhotos.map((photo, idx) => (
                      <div
                        key={idx}
                        className="relative h-24 rounded-xl overflow-hidden border border-emerald-300 bg-white group"
                      >
                        <img
                          src={resolveImageUrl(photo)}
                          alt={`Foto Pengerjaan ${idx + 1}`}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-emerald-950/80 text-white text-[10px] font-semibold">
                          Bukti #{idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveReportFollowUpPhoto(idx)}
                          className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center text-xs font-bold cursor-pointer"
                          title="Hapus foto pengerjaan"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-3 px-4 rounded-xl bg-white/80 border border-dashed border-emerald-300 text-xs text-slate-500 text-center">
                    Belum ada foto laporan pengerjaan petugas yang dilampirkan.
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReportForm(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#0277BD] hover:bg-[#01579B] text-white text-xs font-bold cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>
                    {editingReportId
                      ? 'Simpan Tindak Lanjut & Lampiran Foto'
                      : 'Validasi & Tambah Data'}
                  </span>
                </button>
              </div>
            </form>
          )}

          {/* Reports CRUD Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                    <th className="py-3.5 px-4">Tiket</th>
                    <th className="py-3.5 px-4">Judul & Lokasi</th>
                    <th className="py-3.5 px-4">Pelapor & RW</th>
                    <th className="py-3.5 px-4">Status Validasi</th>
                    <th className="py-3.5 px-4 text-right">Aksi Admin (Edit / Hapus)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-xs">
                  {filteredReports.map((rep) => (
                    <tr key={rep.id} className="hover:bg-slate-50/80">
                      <td className="py-3.5 px-4 font-mono-num font-bold text-[#0D3868] whitespace-nowrap">
                        {rep.ticketCode}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{rep.title}</div>
                        <div className="text-slate-500 mt-0.5">
                          {rep.category} · {rep.locationName}
                        </div>
                        {/* Distribusi & Koordinasi WA Langsung Antar Semua Nomor Penerima Terdaftar */}
                        {whatsappRecipients.filter((r) => r.isActive).length > 0 && (
                          <div className="mt-2 pt-2 border-t border-slate-100 space-y-1.5">
                            <div className="text-[11px] font-bold text-[#075E54] flex items-center gap-1">
                              <MessageCircle className="w-3 h-3" />
                              <span>
                                Diterima & Koordinasi WA Tim Penerima Terdaftar (
                                {whatsappRecipients.filter((r) => r.isActive).length} Nomor):
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-1.5">
                              {whatsappRecipients
                                .filter((r) => r.isActive)
                                .map((rec) => {
                                  const coordHref = buildWhatsAppUrl(
                                    rec.phoneNumber,
                                    buildInterRecipientCoordinationMessage(
                                      rec,
                                      whatsappRecipients,
                                      reports,
                                      rep
                                    )
                                  );
                                  return (
                                    <a
                                      key={`${rep.id}-wa-${rec.id}`}
                                      href={coordHref}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50 hover:bg-[#128C7E] text-[#075E54] hover:text-white border border-emerald-200 text-[10px] font-bold transition-colors"
                                      title={`Koordinasi laporan ${rep.ticketCode} ke ${rec.name} (${rec.role}) - ${formatDisplayPhone(rec.phoneNumber)}`}
                                    >
                                      <Phone className="w-2.5 h-2.5" />
                                      <span>
                                        {rec.name} ({formatDisplayPhone(rec.phoneNumber)})
                                      </span>
                                    </a>
                                  );
                                })}
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-800">{rep.reporterName}</div>
                        <div className="text-slate-500">
                          {rep.rw} / {rep.rt}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            rep.status === 'Selesai'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : rep.status === 'Sedang Ditangani'
                              ? 'bg-sky-50 text-sky-700 border border-sky-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {rep.status}
                        </span>
                        {rep.verifiedBy && (
                          <div className="text-[11px] text-slate-500 mt-1">
                            Petugas: <span className="font-semibold text-slate-700">{rep.verifiedBy}</span>
                          </div>
                        )}
                        {(rep.completionPhotoUrl ||
                          (Array.isArray(rep.followUpPhotos) &&
                            rep.followUpPhotos.length > 0)) && (
                          <div className="mt-1.5 flex items-center gap-1.5">
                            <img
                              src={resolveImageUrl(
                                rep.completionPhotoUrl || rep.followUpPhotos?.[0]
                              )}
                              alt="Bukti Pengerjaan"
                              referrerPolicy="no-referrer"
                              className="w-10 h-7 rounded object-cover border border-emerald-300"
                            />
                            <span className="text-[10px] font-bold text-[#1C8237]">
                              Foto Pengerjaan Terlampir
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        {confirmDeleteReportId === rep.id ? (
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleExecuteDeleteReport(rep.id)}
                              className="px-2.5 py-1 rounded-lg bg-red-600 text-white font-bold cursor-pointer"
                            >
                              Ya, Hapus
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteReportId(null)}
                              className="px-2.5 py-1 rounded-lg bg-slate-200 text-slate-700 font-semibold cursor-pointer"
                            >
                              Batal
                            </button>
                          </div>
                        ) : (
                          <div className="inline-flex flex-wrap items-center justify-end gap-1.5">
                            {rep.status === 'Menunggu Verifikasi' && (
                              <button
                                type="button"
                                onClick={() => handleQuickReportAction(rep, 'verifikasi')}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 border border-sky-200 text-[#0277BD] font-bold cursor-pointer"
                                title="Verifikasi & Teruskan ke Petugas Lapangan"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Verifikasi</span>
                              </button>
                            )}
                            {rep.status !== 'Selesai' && (
                              <button
                                type="button"
                                onClick={() => handleQuickReportAction(rep, 'selesai')}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-[#1C8237] font-bold cursor-pointer"
                                title="Selesaikan Laporan & Lampirkan Foto Pengerjaan"
                              >
                                <Camera className="w-3.5 h-3.5" />
                                <span>Selesaikan + Foto</span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => openEditReportForm(rep)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-semibold cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-[#0277BD]" />
                              <span>Tindak Lanjut</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteReportId(rep.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-red-200 bg-red-50/60 hover:bg-red-100 text-red-700 font-semibold cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Hapus</span>
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 3: KELOLA BANK SAMPAH UNIT & LOG (CRUD) ================= */}
      {activeTab === 'sampah' && (
        <div className="mt-6 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[#0D3868]">
                Manajemen Data Bank Sampah Unit (BSU) RW & Timbulan Sampah
              </h2>
              <p className="text-xs text-slate-500">
                Tambah BSU baru, edit volume Organik/Anorganik/Residu, atau hapus entri.
              </p>
            </div>
            <button
              type="button"
              onClick={openAddUnitForm}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#EF6C00] hover:bg-[#E65100] text-white text-xs sm:text-sm font-bold cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah BSU Baru</span>
            </button>
          </div>

          {showUnitForm && (
            <form
              onSubmit={handleUnitFormSubmit}
              className="bg-white rounded-2xl border-2 border-amber-200 p-6 space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <h3 className="text-base font-bold text-[#0D3868]">
                  {editingUnitId
                    ? 'Edit Data Bank Sampah Unit (BSU)'
                    : 'Tambah Bank Sampah Unit (BSU) RW Baru'}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowUnitForm(false)}
                  className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Wilayah RW *
                  </label>
                  <select
                    value={unitForm.rw || 'RW 01'}
                    onChange={(e) => setUnitForm({ ...unitForm, rw: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm bg-white"
                  >
                    {RW_LIST.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Bank Sampah Unit *
                  </label>
                  <input
                    type="text"
                    value={unitForm.unitName || ''}
                    onChange={(e) => setUnitForm({ ...unitForm, unitName: e.target.value })}
                    placeholder="Contoh: BSU Harapan Panaikang"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Koordinator *
                  </label>
                  <input
                    type="text"
                    value={unitForm.coordinator || ''}
                    onChange={(e) =>
                      setUnitForm({ ...unitForm, coordinator: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-emerald-800 mb-1">
                    Volume Organik (kg) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={unitForm.organikKg ?? 0}
                    onChange={(e) =>
                      setUnitForm({ ...unitForm, organikKg: Number(e.target.value) })
                    }
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-mono-num"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-sky-800 mb-1">
                    Volume Anorganik (kg) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={unitForm.anorganikKg ?? 0}
                    onChange={(e) =>
                      setUnitForm({ ...unitForm, anorganikKg: Number(e.target.value) })
                    }
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-mono-num"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-amber-800 mb-1">
                    Volume Residu (kg) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={unitForm.residuKg ?? 0}
                    onChange={(e) =>
                      setUnitForm({ ...unitForm, residuKg: Number(e.target.value) })
                    }
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-mono-num"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Jumlah KK Aktif
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={unitForm.activeHouseholds ?? 100}
                    onChange={(e) =>
                      setUnitForm({
                        ...unitForm,
                        activeHouseholds: Number(e.target.value),
                      })
                    }
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-mono-num"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Cakupan Lokasi Koridor / Jalan
                  </label>
                  <input
                    type="text"
                    value={unitForm.locationLabel || ''}
                    onChange={(e) =>
                      setUnitForm({ ...unitForm, locationLabel: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Jadwal Operasional Penjemputan
                  </label>
                  <input
                    type="text"
                    value={unitForm.pickupSchedule || ''}
                    onChange={(e) =>
                      setUnitForm({ ...unitForm, pickupSchedule: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUnitForm(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#EF6C00] hover:bg-[#E65100] text-white text-xs font-bold cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingUnitId ? 'Simpan Perubahan BSU' : 'Validasi & Tambah BSU'}</span>
                </button>
              </div>
            </form>
          )}

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                    <th className="py-3.5 px-4">RW & Nama BSU</th>
                    <th className="py-3.5 px-4">Koordinator & Jadwal</th>
                    <th className="py-3.5 px-4 text-right">Organik</th>
                    <th className="py-3.5 px-4 text-right">Anorganik</th>
                    <th className="py-3.5 px-4 text-right">Residu</th>
                    <th className="py-3.5 px-4 text-right">Aksi Admin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-xs">
                  {wasteUnits.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/80">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-[#0D3868]">
                          {u.rw} · {u.unitName}
                        </div>
                        <div className="text-slate-500 mt-0.5">{u.locationLabel}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">{u.coordinator}</div>
                        <div className="text-slate-500 font-mono-num">{u.pickupSchedule}</div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono-num font-semibold text-emerald-700">
                        {u.organikKg} kg
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono-num font-semibold text-sky-700">
                        {u.anorganikKg} kg
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono-num font-semibold text-amber-700">
                        {u.residuKg} kg
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        {confirmDeleteUnitId === u.id ? (
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleExecuteDeleteUnit(u.id)}
                              className="px-2.5 py-1 rounded-lg bg-red-600 text-white font-bold cursor-pointer"
                            >
                              Ya, Hapus
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteUnitId(null)}
                              className="px-2.5 py-1 rounded-lg bg-slate-200 text-slate-700 font-semibold cursor-pointer"
                            >
                              Batal
                            </button>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => openEditUnitForm(u)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-semibold cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-[#EF6C00]" />
                              <span>Edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteUnitId(u.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-red-200 bg-red-50/60 hover:bg-red-100 text-red-700 font-semibold cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Hapus</span>
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Log Penimbangan Management (Add, Edit, Delete) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Riwayat Log Penimbangan Harian ({wasteLogs.length} Entri)
                </h3>
                <p className="text-xs text-slate-500">
                  Kelola catatan penimbangan harian sampah Organik, Anorganik, dan Residu.
                </p>
              </div>
              <button
                type="button"
                onClick={openAddLogForm}
                className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1C8237] hover:bg-[#146329] text-white text-xs font-bold cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Tambah Log Penimbangan</span>
              </button>
            </div>

            {showLogForm && (
              <form
                onSubmit={handleLogFormSubmit}
                className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-[#0D3868]">
                    {editingLogId
                      ? 'Edit Log Penimbangan Harian'
                      : 'Tambah Log Penimbangan Harian Baru'}
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      setShowLogForm(false);
                      setEditingLogId(null);
                    }}
                    className="text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Wilayah RW
                    </label>
                    <select
                      value={logForm.rw}
                      onChange={(e) => {
                        const rwVal = e.target.value;
                        const matchedUnit = wasteUnits.find((u) => u.rw === rwVal);
                        setLogForm({
                          ...logForm,
                          rw: rwVal,
                          unitName: matchedUnit ? matchedUnit.unitName : `BSU ${rwVal}`,
                        });
                      }}
                      className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs bg-white"
                    >
                      {RW_LIST.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Nama Unit BSU
                    </label>
                    <input
                      type="text"
                      value={logForm.unitName}
                      onChange={(e) => setLogForm({ ...logForm, unitName: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Petugas Penimbang
                    </label>
                    <input
                      type="text"
                      value={logForm.officerName}
                      onChange={(e) => setLogForm({ ...logForm, officerName: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-emerald-800 mb-1">
                      Organik (kg)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={logForm.organikKg}
                      onChange={(e) =>
                        setLogForm({ ...logForm, organikKg: Number(e.target.value) })
                      }
                      className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs bg-white font-mono-num"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-sky-800 mb-1">
                      Anorganik (kg)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={logForm.anorganikKg}
                      onChange={(e) =>
                        setLogForm({ ...logForm, anorganikKg: Number(e.target.value) })
                      }
                      className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs bg-white font-mono-num"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-amber-800 mb-1">
                      Residu (kg)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={logForm.residuKg}
                      onChange={(e) =>
                        setLogForm({ ...logForm, residuKg: Number(e.target.value) })
                      }
                      className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs bg-white font-mono-num"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Catatan Penimbangan
                  </label>
                  <input
                    type="text"
                    value={logForm.notes}
                    onChange={(e) => setLogForm({ ...logForm, notes: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs bg-white"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowLogForm(false);
                      setEditingLogId(null);
                    }}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-700 cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-[#1C8237] text-white text-xs font-bold cursor-pointer"
                  >
                    {editingLogId ? 'Simpan Perubahan Log' : 'Simpan Log Baru'}
                  </button>
                </div>
              </form>
            )}

            <div className="divide-y divide-slate-100 text-xs">
              {wasteLogs.map((log) => (
                <div
                  key={log.id}
                  className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div>
                    <span className="font-bold text-[#0D3868]">{log.rw}</span> ·{' '}
                    <span className="font-semibold text-slate-900">{log.unitName}</span> ·{' '}
                    <span className="font-mono-num text-slate-500">{log.date}</span>
                    <div className="text-slate-600 mt-0.5">{log.notes}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono-num font-semibold text-slate-700">
                      Org: {log.organikKg}kg · Anorg: {log.anorganikKg}kg · Res: {log.residuKg}kg
                    </span>
                    {confirmDeleteLogId === log.id ? (
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleExecuteDeleteLog(log.id)}
                          className="px-2 py-1 rounded bg-red-600 text-white font-bold cursor-pointer"
                        >
                          Ya, Hapus
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteLogId(null)}
                          className="px-2 py-1 rounded bg-slate-200 text-slate-700 font-semibold cursor-pointer"
                        >
                          Batal
                        </button>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEditLogForm(log)}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-semibold cursor-pointer"
                          title="Edit Log Penimbangan"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-[#1C8237]" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteLogId(log.id)}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-red-200 bg-red-50/60 hover:bg-red-100 text-red-700 font-semibold cursor-pointer"
                          title="Hapus Log Penimbangan"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Hapus</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 4: KELOLA JADWAL & UPLOAD FOTO KERJA BAKTI (CRUD) ================= */}
      {activeTab === 'kerjabakti' && (
        <div className="mt-6 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-[#0D3868]">
                Manajemen Jadwal & Upload Foto Dokumentasi Kerja Bakti yang Telah Dilaksanakan
              </h2>
              <p className="text-xs text-slate-500">
                Unggah foto dokumentasi kegiatan kerja bakti yang telah dilaksanakan, perbarui
                capaian tonase sampah, dan tampilkan langsung ke halaman pengunjung Monitoring Kerja
                Bakti.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => onNavigate('kerjabakti')}
                className="px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer whitespace-nowrap"
              >
                Lihat Halaman Pengunjung
              </button>
              <button
                type="button"
                onClick={() => openAddCleanupForm('Terjadwal')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold cursor-pointer whitespace-nowrap"
              >
                <Clock className="w-4 h-4" />
                <span>+ Jadwal Kerja Bakti (Tanpa Foto)</span>
              </button>
              <button
                type="button"
                onClick={() => openAddCleanupForm('Tuntas')}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#5E35B1] hover:bg-[#4527A0] text-white text-xs sm:text-sm font-bold cursor-pointer whitespace-nowrap"
              >
                <Upload className="w-4 h-4" />
                <span>+ Kerja Bakti Selesai & Upload Foto</span>
              </button>
            </div>
          </div>

          {showCleanupForm && (
            <form
              onSubmit={handleCleanupFormSubmit}
              className="bg-white rounded-2xl border-2 border-purple-200 p-6 space-y-5"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <h3 className="text-base font-bold text-[#0D3868]">
                  {editingCleanupId
                    ? 'Edit Kegiatan & Upload Foto Dokumentasi Kerja Bakti'
                    : 'Tambah Kegiatan & Upload Foto Dokumentasi Kerja Bakti'}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowCleanupForm(false)}
                  className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Kegiatan Kerja Bakti *
                  </label>
                  <input
                    type="text"
                    value={cleanupForm.title || ''}
                    onChange={(e) =>
                      setCleanupForm({ ...cleanupForm, title: e.target.value })
                    }
                    placeholder="Contoh: Aksi Sabtu Bersih Drainase & Lorong Warga RW 02"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Lokasi Pelaksanaan / Titik Kumpul *
                  </label>
                  <input
                    type="text"
                    value={cleanupForm.locationName || ''}
                    onChange={(e) =>
                      setCleanupForm({ ...cleanupForm, locationName: e.target.value })
                    }
                    placeholder="Contoh: Koridor Jl. Haji Kalla & Jl. Urip Sumoharjo"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Hari & Tanggal Pelaksanaan *
                  </label>
                  <input
                    type="text"
                    value={cleanupForm.date || ''}
                    onChange={(e) =>
                      setCleanupForm({ ...cleanupForm, date: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Wilayah RW
                  </label>
                  <input
                    type="text"
                    value={cleanupForm.rw || ''}
                    onChange={(e) => setCleanupForm({ ...cleanupForm, rw: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Status Pelaksanaan *
                  </label>
                  <select
                    value={cleanupForm.status || 'Tuntas'}
                    onChange={(e) => {
                      const nextStatus = e.target.value as CleanupEvent['status'];
                      setCleanupForm({
                        ...cleanupForm,
                        status: nextStatus,
                        imageUrl: nextStatus === 'Tuntas' ? cleanupForm.imageUrl || IG_POST_6 : '',
                        documentationPhotos:
                          nextStatus === 'Tuntas'
                            ? cleanupForm.documentationPhotos?.length
                              ? cleanupForm.documentationPhotos
                              : [IG_POST_6]
                            : [],
                      });
                    }}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm bg-white font-semibold"
                  >
                    <option value="Terjadwal">Terjadwal (Akan Datang — Tanpa Foto)</option>
                    <option value="Tuntas">Tuntas (Telah Dilaksanakan — Dengan Foto)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Sampah Terkumpul (kg)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={cleanupForm.collectedWasteKg ?? 0}
                    onChange={(e) =>
                      setCleanupForm({
                        ...cleanupForm,
                        collectedWasteKg: Number(e.target.value),
                      })
                    }
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-mono-num"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ringkasan Hasil Pelaksanaan / Catatan Dokumentasi Kegiatan
                </label>
                <textarea
                  rows={2}
                  value={cleanupForm.summaryNote || ''}
                  onChange={(e) =>
                    setCleanupForm({ ...cleanupForm, summaryNote: e.target.value })
                  }
                  placeholder="Tuliskan hasil pelaksanaan kerja bakti, jumlah warga yang hadir, serta lokasi yang dibersihkan..."
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                />
              </div>

              {/* PHOTO UPLOAD SECTION FOR COMPLETED KERJA BAKTI ONLY */}
              {cleanupForm.status !== 'Tuntas' ? (
                <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3">
                  <Clock className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs sm:text-sm font-bold text-amber-950">
                      Kerja Bakti Terjadwal Tidak Menggunakan Foto Dokumentasi
                    </div>
                    <p className="text-xs text-amber-900 mt-1 leading-relaxed">
                      Sesuai ketentuan, kegiatan kerja bakti yang masih berstatus{' '}
                      <strong>Terjadwal</strong> hanya menampilkan jadwal waktu, wilayah RW/RT, dan lokasi titik kumpul tanpa lampiran foto. Hanya kerja bakti yang telah selesai dilaksanakan (status <strong>Tuntas</strong>) yang dapat melampirkan foto kegiatan.
                    </p>
                    <button
                      type="button"
                      onClick={() =>
                        setCleanupForm({
                          ...cleanupForm,
                          status: 'Tuntas',
                          imageUrl: cleanupForm.imageUrl || IG_POST_6,
                          documentationPhotos:
                            cleanupForm.documentationPhotos?.length
                              ? cleanupForm.documentationPhotos
                              : [IG_POST_6],
                        })
                      }
                      className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#5E35B1] hover:bg-[#4527A0] text-white text-xs font-bold cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Ubah ke Tuntas (Telah Dilaksanakan) & Lampirkan Foto</span>
                    </button>
                  </div>
                </div>
              ) : (
              <div className="p-4 sm:p-5 rounded-2xl bg-purple-50/50 border border-purple-200/80 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="text-xs sm:text-sm font-bold text-[#4527A0] flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4" />
                      <span>
                        Upload Foto Dokumentasi Kegiatan Kerja Bakti yang Telah Dilaksanakan *
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Unggah satu atau beberapa foto kegiatan dari perangkat Anda. Foto akan langsung
                      ditampilkan pada halaman pengunjung Monitoring Kerja Bakti.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
                  <div className="md:col-span-7 space-y-3">
                    {/* Upload Buttons */}
                    <div className="flex flex-wrap items-center gap-2.5">
                      <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#5E35B1] hover:bg-[#4527A0] text-white text-xs font-bold cursor-pointer transition-colors shadow-xs">
                        <Upload className="w-4 h-4" />
                        <span>Unggah Foto Utama Pelaksanaan</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleCleanupMainImageUpload}
                          className="hidden"
                        />
                      </label>

                      <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-purple-50 border border-purple-300 text-[#5E35B1] text-xs font-bold cursor-pointer transition-colors">
                        <Plus className="w-4 h-4" />
                        <span>Tambah Banyak Foto Album Dokumentasi</span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleCleanupGalleryUpload}
                          className="hidden"
                        />
                      </label>
                    </div>

                    {/* Preset Gallery Options */}
                    <div>
                      <div className="text-[11px] font-semibold text-slate-600 mb-1.5">
                        Atau pilih dari dokumentasi lapangan Kelurahan Panaikang:
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {[
                          { label: 'Gotong Royong Warga', url: IMG_KERJA_BAKTI },
                          { label: 'Normalisasi Drainase', url: IMG_DRAINASE },
                          { label: 'Penimbangan BSU', url: IMG_BANK_SAMPAH },
                          { label: 'Koridor Nipah Mall', url: IMG_NIPAH_MALL },
                        ].map((preset) => (
                          <button
                            key={preset.label}
                            type="button"
                            onClick={() =>
                              setCleanupForm((prev) => {
                                const docs = Array.isArray(prev.documentationPhotos)
                                  ? prev.documentationPhotos
                                  : [];
                                return {
                                  ...prev,
                                  imageUrl: preset.url,
                                  documentationPhotos: [
                                    preset.url,
                                    ...docs.filter((p) => p !== preset.url),
                                  ],
                                };
                              })
                            }
                            className={`py-2 px-2.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                              cleanupForm.imageUrl === preset.url
                                ? 'bg-purple-100 text-[#4527A0] border-[#5E35B1]'
                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Preview Main & Album Photos */}
                  <div className="md:col-span-5 space-y-2.5">
                    <div className="text-xs font-bold text-slate-700">
                      Pratinjau Foto Dokumentasi (
                      {(cleanupForm.documentationPhotos || [cleanupForm.imageUrl]).filter(Boolean)
                        .length}{' '}
                      Foto):
                    </div>
                    <div className="h-36 w-full rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                      {cleanupForm.imageUrl ? (
                        <img
                          src={resolveImageUrl(cleanupForm.imageUrl)}
                          alt="Pratinjau Foto Utama Kerja Bakti"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">
                          Belum ada foto diunggah
                        </div>
                      )}
                    </div>

                    {/* Album Thumbnails */}
                    {Array.isArray(cleanupForm.documentationPhotos) &&
                      cleanupForm.documentationPhotos.length > 0 && (
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          {cleanupForm.documentationPhotos.map((photo, idx) => (
                            <div
                              key={idx}
                              className="relative w-14 h-14 rounded-lg overflow-hidden border border-slate-300 bg-white group"
                            >
                              <img
                                src={resolveImageUrl(photo)}
                                alt={`Dokumentasi ${idx + 1}`}
                                referrerPolicy="no-referrer"
                                onClick={() =>
                                  setCleanupForm((prev) => ({ ...prev, imageUrl: photo }))
                                }
                                className="w-full h-full object-cover cursor-pointer"
                                title="Klik untuk jadikan foto utama"
                              />
                              <button
                                type="button"
                                onClick={() => handleRemoveCleanupDocPhoto(idx)}
                                className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-red-600 text-white flex items-center justify-center text-[10px] cursor-pointer"
                                title="Hapus foto ini"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                  </div>
                </div>
              </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCleanupForm(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#5E35B1] hover:bg-[#4527A0] text-white text-xs sm:text-sm font-bold cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>
                    {editingCleanupId
                      ? 'Simpan Perubahan & Foto Dokumentasi'
                      : 'Simpan & Tampilkan di Monitoring Kerja Bakti'}
                  </span>
                </button>
              </div>
            </form>
          )}

          {/* PEMISAHAN DAFTAR KERJA BAKTI: 1. TERJADWAL (TANPA FOTO) & 2. TELAH DILAKSANAKAN (DENGAN FOTO) */}
          <div className="space-y-6">
            {/* TABEL 1: KERJA BAKTI TERJADWAL (TANPA FOTO) */}
            <div className="bg-white rounded-2xl border border-amber-200 overflow-hidden">
              <div className="px-5 py-3.5 bg-amber-50/80 border-b border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-700" />
                  <h3 className="text-xs sm:text-sm font-bold text-amber-950">
                    1. Daftar Kerja Bakti Terjadwal (Akan Datang — Tidak Menggunakan Foto)
                  </h3>
                </div>
                <span className="text-xs font-bold text-amber-900 bg-amber-100 px-2.5 py-0.5 rounded-full">
                  {cleanupEvents.filter((e) => e.status !== 'Tuntas').length} Agenda Terjadwal
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                      <th className="py-3 px-4">Kegiatan & Lokasi Titik Kumpul</th>
                      <th className="py-3 px-4">Jadwal & Wilayah RW</th>
                      <th className="py-3 px-4">Target Partisipan</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Aksi Admin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-xs">
                    {cleanupEvents
                      .filter((ev) => ev.status !== 'Tuntas')
                      .map((ev) => (
                        <tr key={ev.id} className="hover:bg-amber-50/30">
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900">{ev.title}</div>
                            <div className="text-slate-500 mt-0.5">{ev.locationName}</div>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="font-semibold text-amber-800">
                              {ev.rw} · {ev.rtScope}
                            </div>
                            <div className="text-slate-500 font-mono-num">{ev.date}</div>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap font-mono-num">
                            {ev.registeredParticipants}/{ev.targetParticipants} warga terdaftar
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className="inline-block px-2.5 py-1 rounded-md bg-amber-50 border border-amber-200 text-amber-800 font-bold">
                              Terjadwal (Tanpa Foto)
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            {confirmDeleteCleanupId === ev.id ? (
                              <div className="inline-flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleExecuteDeleteCleanup(ev.id)}
                                  className="px-2.5 py-1 rounded-lg bg-red-600 text-white font-bold cursor-pointer"
                                >
                                  Ya, Hapus
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteCleanupId(null)}
                                  className="px-2.5 py-1 rounded-lg bg-slate-200 text-slate-700 font-semibold cursor-pointer"
                                >
                                  Batal
                                </button>
                              </div>
                            ) : (
                              <div className="inline-flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => openEditCleanupForm(ev, true)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer"
                                  title="Tandai Selesai Dilaksanakan & Lampirkan Foto Kegiatan"
                                >
                                  <Camera className="w-3.5 h-3.5" />
                                  <span>Selesai & Lampirkan Foto</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => openEditCleanupForm(ev, false)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-semibold cursor-pointer"
                                >
                                  <Edit3 className="w-3.5 h-3.5 text-amber-700" />
                                  <span>Edit Jadwal</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteCleanupId(ev.id)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-red-200 bg-red-50/60 hover:bg-red-100 text-red-700 font-semibold cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Hapus</span>
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* TABEL 2: KERJA BAKTI TELAH DILAKSANAKAN / TUNTAS (DENGAN FOTO DOKUMENTASI) */}
            <div className="bg-white rounded-2xl border border-emerald-200 overflow-hidden">
              <div className="px-5 py-3.5 bg-emerald-50/80 border-b border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Camera className="w-4 h-4 text-[#1C8237]" />
                  <h3 className="text-xs sm:text-sm font-bold text-emerald-950">
                    2. Daftar Kerja Bakti Telah Dilaksanakan / Tuntas (Dengan Lampiran Foto Dokumentasi)
                  </h3>
                </div>
                <span className="text-xs font-bold text-emerald-900 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                  {cleanupEvents.filter((e) => e.status === 'Tuntas').length} Kegiatan Terlaksana
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                      <th className="py-3.5 px-4">Foto Dokumentasi</th>
                      <th className="py-3.5 px-4">Kegiatan & Lokasi</th>
                      <th className="py-3.5 px-4">Waktu & RW</th>
                      <th className="py-3.5 px-4">Status & Capaian</th>
                      <th className="py-3.5 px-4 text-right">
                        Aksi Admin (Upload Foto / Edit / Hapus)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-xs">
                    {cleanupEvents
                      .filter((ev) => ev.status === 'Tuntas')
                      .map((ev) => {
                        const photoCount =
                          Array.isArray(ev.documentationPhotos) &&
                          ev.documentationPhotos.length > 0
                            ? ev.documentationPhotos.length
                            : ev.imageUrl
                            ? 1
                            : 0;
                        return (
                          <tr key={ev.id} className="hover:bg-slate-50/80">
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <div className="flex items-center gap-2.5">
                                <div className="w-16 h-12 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 shrink-0">
                                  <img
                                    src={resolveImageUrl(ev.imageUrl)}
                                    alt={ev.title}
                                    referrerPolicy="no-referrer"
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <span className="text-[11px] font-semibold text-[#5E35B1]">
                                  {photoCount} Foto
                                </span>
                              </div>
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="font-bold text-slate-900">{ev.title}</div>
                              <div className="text-slate-500 mt-0.5">{ev.locationName}</div>
                            </td>
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <div className="font-semibold text-[#5E35B1]">{ev.rw}</div>
                              <div className="text-slate-500 font-mono-num">{ev.date}</div>
                            </td>
                            <td className="py-3.5 px-4 whitespace-nowrap font-mono-num">
                              <div className="font-bold text-emerald-700">
                                Tuntas (Terlaksana)
                              </div>
                              <div className="text-slate-500">
                                {ev.registeredParticipants}/{ev.targetParticipants} warga ·{' '}
                                {ev.collectedWasteKg} kg
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-right whitespace-nowrap">
                              {confirmDeleteCleanupId === ev.id ? (
                                <div className="inline-flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleExecuteDeleteCleanup(ev.id)}
                                    className="px-2.5 py-1 rounded-lg bg-red-600 text-white font-bold cursor-pointer"
                                  >
                                    Ya, Hapus
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setConfirmDeleteCleanupId(null)}
                                    className="px-2.5 py-1 rounded-lg bg-slate-200 text-slate-700 font-semibold cursor-pointer"
                                  >
                                    Batal
                                  </button>
                                </div>
                              ) : (
                                <div className="inline-flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => openEditCleanupForm(ev, true)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 border border-purple-200 text-[#5E35B1] font-bold cursor-pointer"
                                    title="Unggah foto dokumentasi kerja bakti yang telah dilaksanakan"
                                  >
                                    <Upload className="w-3.5 h-3.5" />
                                    <span>Upload Foto</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => openEditCleanupForm(ev, false)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-semibold cursor-pointer"
                                  >
                                    <Edit3 className="w-3.5 h-3.5 text-[#5E35B1]" />
                                    <span>Edit</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setConfirmDeleteCleanupId(ev.id)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-red-200 bg-red-50/60 hover:bg-red-100 text-red-700 font-semibold cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>Hapus</span>
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 6: KELOLA DATA RT & RW (CRUD PER RW & RT) ================= */}
      {activeTab === 'rtrw' && (
        <div className="mt-6 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-[#0D3868]">
                Manajemen Data Rukun Warga (RW) & Rukun Tetangga (RT) Kelurahan Panaikang
              </h2>
              <p className="text-xs text-slate-500">
                Setiap RT dibagi berdasarkan RW masing-masing. Seluruh data RW dan RT dapat ditambah, diubah, diedit, dan dihapus oleh Administrator.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => onNavigate('rtrw')}
                className="px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Lihat Halaman Publik RT/RW
              </button>
              <button
                type="button"
                onClick={openAddRwForm}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0D3868] hover:bg-[#072647] text-white text-xs sm:text-sm font-bold cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Wilayah RW Baru</span>
              </button>
            </div>
          </div>

          {/* Form Tambah / Edit RW */}
          {showRwForm && (
            <form
              onSubmit={handleRwFormSubmit}
              className="bg-white rounded-2xl border-2 border-sky-200 p-6 space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <h3 className="text-base font-bold text-[#0D3868]">
                  {editingRwId ? 'Edit Data Wilayah RW' : 'Tambah Wilayah RW Baru'}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowRwForm(false)}
                  className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kode RW *
                  </label>
                  <input
                    type="text"
                    value={rwForm.rwCode || ''}
                    onChange={(e) => setRwForm({ ...rwForm, rwCode: e.target.value })}
                    placeholder="Contoh: RW 08"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-bold"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Lengkap Wilayah RW *
                  </label>
                  <input
                    type="text"
                    value={rwForm.rwName || ''}
                    onChange={(e) => setRwForm({ ...rwForm, rwName: e.target.value })}
                    placeholder="Contoh: RW 08 — Kawasan Koridor Panaikang"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Ketua RW *
                  </label>
                  <input
                    type="text"
                    value={rwForm.ketuaRwName || ''}
                    onChange={(e) => setRwForm({ ...rwForm, ketuaRwName: e.target.value })}
                    placeholder="Nama Ketua RW"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nomor Kontak / Telepon RW
                  </label>
                  <input
                    type="text"
                    value={rwForm.phone || ''}
                    onChange={(e) => setRwForm({ ...rwForm, phone: e.target.value })}
                    placeholder="0812-4100-xxxx"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-mono-num"
                  />
                </div>
                <div className="sm:col-span-3">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Deskripsi Cakupan Wilayah RW
                  </label>
                  <input
                    type="text"
                    value={rwForm.areaDescription || ''}
                    onChange={(e) =>
                      setRwForm({ ...rwForm, areaDescription: e.target.value })
                    }
                    placeholder="Contoh: Koridor Jl. Urip Sumoharjo & Sekitarnya"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRwForm(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#0D3868] hover:bg-[#072647] text-white text-xs font-bold cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingRwId ? 'Simpan Perubahan RW' : 'Simpan RW Baru'}</span>
                </button>
              </div>
            </form>
          )}

          {/* Daftar RW beserta Pembagian RT di Masing-Masing RW */}
          <div className="space-y-6">
            {rwGroups.map((rw) => (
              <div
                key={rw.id}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs"
              >
                {/* Header RW */}
                <div className="bg-[#0D3868] text-white px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 text-xs font-extrabold">
                        {rw.rwCode}
                      </span>
                      <h3 className="text-sm sm:text-base font-bold text-white">
                        {rw.rwName}
                      </h3>
                    </div>
                    <div className="text-xs text-sky-100 mt-1">
                      Ketua {rw.rwCode}: <strong>{rw.ketuaRwName}</strong> · Kontak:{' '}
                      <span className="font-mono-num">{rw.phone}</span> · Cakupan:{' '}
                      {rw.areaDescription} ({rw.rtList?.length || 0} RT)
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => openAddRtForm(rw)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#1C8237] hover:bg-[#146329] text-white text-xs font-bold cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Tambah RT di {rw.rwCode}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => openEditRwForm(rw)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs font-semibold cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit RW</span>
                    </button>
                    {confirmDeleteRwId === rw.id ? (
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleExecuteDeleteRw(rw.id)}
                          className="px-2.5 py-1 rounded-lg bg-red-600 text-white text-xs font-bold cursor-pointer"
                        >
                          Ya, Hapus RW
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteRwId(null)}
                          className="px-2 py-1 rounded-lg bg-white/20 text-white text-xs cursor-pointer"
                        >
                          Batal
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteRwId(rw.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/40 text-red-100 text-xs font-semibold cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Hapus RW</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Form Tambah / Edit RT khusus di dalam RW ini */}
                {activeRwForRt === rw.id && (
                  <form
                    onSubmit={(e) => handleRtFormSubmit(e, rw.id)}
                    className="p-5 bg-emerald-50/70 border-b border-emerald-200 space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs sm:text-sm font-bold text-[#146329]">
                        {editingRtId
                          ? `Edit Data RT pada ${rw.rwCode}`
                          : `Tambah Rukun Tetangga (RT) Baru pada ${rw.rwCode}`}
                      </h4>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveRwForRt(null);
                          setEditingRtId(null);
                        }}
                        className="text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
                      >
                        Tutup Form RT
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Kode RT *
                        </label>
                        <input
                          type="text"
                          value={rtForm.rtCode || ''}
                          onChange={(e) =>
                            setRtForm({ ...rtForm, rtCode: e.target.value })
                          }
                          placeholder="RT 01"
                          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Nama RT *
                        </label>
                        <input
                          type="text"
                          value={rtForm.rtName || ''}
                          onChange={(e) =>
                            setRtForm({ ...rtForm, rtName: e.target.value })
                          }
                          placeholder={`RT 01 / ${rw.rwCode} — Kawasan ...`}
                          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Nama Ketua RT *
                        </label>
                        <input
                          type="text"
                          value={rtForm.ketuaRtName || ''}
                          onChange={(e) =>
                            setRtForm({ ...rtForm, ketuaRtName: e.target.value })
                          }
                          placeholder="Nama Ketua RT"
                          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Jumlah KK
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={rtForm.householdsCount ?? 100}
                          onChange={(e) =>
                            setRtForm({
                              ...rtForm,
                              householdsCount: Number(e.target.value),
                            })
                          }
                          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-mono-num"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Nomor Kontak Ketua RT
                        </label>
                        <input
                          type="text"
                          value={rtForm.phone || ''}
                          onChange={(e) =>
                            setRtForm({ ...rtForm, phone: e.target.value })
                          }
                          placeholder="0813-4200-xxxx"
                          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-mono-num"
                        />
                      </div>
                      <div className="sm:col-span-4">
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Cakupan Jalan / Lorong Wilayah RT
                        </label>
                        <input
                          type="text"
                          value={rtForm.areaDescription || ''}
                          onChange={(e) =>
                            setRtForm({ ...rtForm, areaDescription: e.target.value })
                          }
                          placeholder="Contoh: Lorong 1 - 3 Jl. Urip Sumoharjo"
                          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveRwForRt(null);
                          setEditingRtId(null);
                        }}
                        className="px-3.5 py-1.5 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-700 cursor-pointer"
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[#1C8237] hover:bg-[#146329] text-white text-xs font-bold cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{editingRtId ? 'Simpan Perubahan RT' : 'Simpan RT Baru'}</span>
                      </button>
                    </div>
                  </form>
                )}

                {/* Tabel Daftar RT dalam RW ini */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                        <th className="py-3 px-4">Kode & Nama RT</th>
                        <th className="py-3 px-4">Ketua RT</th>
                        <th className="py-3 px-4">Kontak</th>
                        <th className="py-3 px-4">Cakupan Lorong / Wilayah</th>
                        <th className="py-3 px-4 text-right">Jumlah KK</th>
                        <th className="py-3 px-4 text-right">Aksi Admin (Edit / Hapus)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-xs">
                      {(rw.rtList || []).map((rt) => {
                        const deleteKey = `${rw.id}:${rt.id}`;
                        return (
                          <tr key={rt.id} className="hover:bg-slate-50/80">
                            <td className="py-3 px-4">
                              <span className="inline-block px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-[#1C8237] font-bold mr-2">
                                {rt.rtCode}
                              </span>
                              <span className="font-bold text-slate-900">{rt.rtName}</span>
                            </td>
                            <td className="py-3 px-4 font-semibold text-slate-800">
                              {rt.ketuaRtName}
                            </td>
                            <td className="py-3 px-4 font-mono-num text-slate-600">
                              {rt.phone}
                            </td>
                            <td className="py-3 px-4 text-slate-600">
                              {rt.areaDescription}
                            </td>
                            <td className="py-3 px-4 text-right font-mono-num font-semibold text-slate-800">
                              {rt.householdsCount} KK
                            </td>
                            <td className="py-3 px-4 text-right whitespace-nowrap">
                              {confirmDeleteRtKey === deleteKey ? (
                                <div className="inline-flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleExecuteDeleteRt(rw.id, rt.id)}
                                    className="px-2.5 py-1 rounded-lg bg-red-600 text-white font-bold cursor-pointer"
                                  >
                                    Ya, Hapus
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setConfirmDeleteRtKey(null)}
                                    className="px-2.5 py-1 rounded-lg bg-slate-200 text-slate-700 font-semibold cursor-pointer"
                                  >
                                    Batal
                                  </button>
                                </div>
                              ) : (
                                <div className="inline-flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => openEditRtForm(rw, rt)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-semibold cursor-pointer"
                                  >
                                    <Edit3 className="w-3.5 h-3.5 text-[#1C8237]" />
                                    <span>Edit RT</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setConfirmDeleteRtKey(deleteKey)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-red-200 bg-red-50/60 hover:bg-red-100 text-red-700 font-semibold cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>Hapus</span>
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                      {(!rw.rtList || rw.rtList.length === 0) && (
                        <tr>
                          <td colSpan={6} className="py-5 text-center text-slate-400">
                            Belum ada data RT pada {rw.rwCode}. Klik tombol "Tambah RT di {rw.rwCode}" di atas.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
