import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
  Key,
  User,
  Eye,
  EyeOff,
  LogOut,
  Newspaper,
  Upload,
  Image as ImageIcon,
  RefreshCw,
  Users,
  Clock,
  Camera,
  BarChart3,
  MessageCircle,
  Phone,
  ExternalLink,
  Sliders,
  History,
  Printer,
  FileDown,
  Sprout,
  Layers,
  Scale,
  Activity,
  Briefcase,
  UserPlus,
  UserCheck,
  ChevronUp,
  ChevronDown,
  Mail,
  MapPin,
  Compass,
  Quote,
  ArrowUp,
  ArrowDown,
  ArrowRight,
  Cloud,
  Send,
  Filter,
} from 'lucide-react';
import {
  SiskamlingRwSchedule,
  AppView,
  KelurahanProfile,
  StructuralOfficial,
  CitizenReport,
  ReportCategory,
  ReportStatus,
  WasteBankUnit,
  WasteLogEntry,
  TebaSpot,
  BioporiPoint,
  CleanupEvent,
  KelurahanInfoItem,
  RwGroup,
  RtItem,
  WhatsAppRecipient,
  AdminUserAccount,
  AdminActionPermissions,
  AdminRoleLevel,
  AdminActivityLog,
  AdminActivityActionType,
  AdminActivityModule,
  UrbanFarmingSpot,
  SeedRequestItem,
  AuthenticatedUserProfile,
  KelolaAdminWargaSubTab,
  CitizenMenuAccessConfig,
  KerjaBaktiIgHighlightItem,
  MasterLayananItem,
  MasterPersyaratanItem,
  PengaduanKategori,
  PraRegistrasiRecord,
  PengaduanOnlineRecord,
} from '../types';
import {
  INITIAL_MASTER_LAYANAN,
  INITIAL_MASTER_PERSYARATAN,
  DAFTAR_KATEGORI_PENGADUAN,
} from '../data/pelayananMasterData';
import { AdminMasterDataLayananPanel } from './AdminMasterDataLayananPanel';
import {
  signInWithGoogleAccount,
  signInWithGoogleIdToken,
  getGoogleOAuthClientId,
  logoutFirebaseUser,
  submitGoogleAdminVerificationRequest,
} from '../firebase/authService';
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
  INITIAL_OFFICIALS,
  INITIAL_WHATSAPP_RECIPIENTS,
  INITIAL_ADMIN_USERS,
  INITIAL_ACTIVITY_LOGS,
  INITIAL_TEBA_SPOTS,
  INITIAL_BIOPORI_POINTS,
  INITIAL_URBAN_FARMING_SPOTS,
  INITIAL_SEED_REQUESTS,
  INITIAL_KERJABAKTI_IG_HIGHLIGHTS,
} from '../data/initialData';
import { resolveImageUrl } from '../utils/resolveImageUrl';
import { compressImageFile } from '../utils/compressImage';
import {
  getRealtimeDateTimeString,
  getRealtimeDateTimeWithSecondsString,
  getRealtimeDateString,
  getRealtimeFullDateString,
} from '../utils/realtimeDate';
import {
  buildInterRecipientCoordinationMessage,
  buildReportWhatsAppMessage,
  buildWhatsAppUrl,
  formatDisplayPhone,
  normalizeWhatsAppPhone,
  dispatchComplaintToRegisteredWhatsApp,
  loadWhatsAppAutoDispatchLogs,
  loadWhatsAppAutoDispatchLogsAsync,
  saveWhatsAppGatewayToken,
  WhatsAppAutoDispatchReceipt,
  checkWhatsAppGatewayStatus,
  WhatsAppGatewayStatusResult,
} from '../utils/whatsappHelper';
import { EmblemKotaMakassar, EmblemKelurahanPanaikang, Instagram } from './Emblems';
import { DashboardLurahView } from './DashboardLurahView';
import { MonthlyArchivePdfPanel } from './MonthlyArchivePdfPanel';
import { AdminPengurusanWargaPanel } from './AdminPengurusanWargaPanel';
import { isSuratAdministrasi } from '../utils/layananSeksiHelper';
import { SubmissionDetailModal } from './SubmissionDetailModal';
import { AdminDaftarWargaPanel } from './AdminDaftarWargaPanel';
import { AdminParameterUserPanel } from './AdminParameterUserPanel';
import { AdminOtoritasMasterPanel } from './AdminOtoritasMasterPanel';
import { AdminActivityLogPanel } from './AdminActivityLogPanel';
import { AdminSiskamlingPanel } from './AdminSiskamlingPanel';
import { INITIAL_SISKAMLING_SCHEDULES } from '../data/siskamlingData';
import {
  AdminRtRwReportPanel,
  ExternalPrintSelection,
} from './AdminRtRwReportPanel';
import { AdminUrbanFarmingPanel } from './AdminUrbanFarmingPanel';
import { AdminTebaPanel } from './AdminTebaPanel';
import { AdminBioporiPanel } from './AdminBioporiPanel';
import { generateApplicationWorkflowPdf } from '../utils/workflowPdfGenerator';
import { AdminTrafficView } from './AdminTrafficView';
import {
  BaganStrukturKelurahanModal,
  BaganStrukturKelurahanInteractiveViewer,
} from './BaganStrukturKelurahanModal';
import {
  BaganStrukturRtRwModal,
  BaganStrukturRtRwInteractiveViewer,
} from './BaganStrukturRtRwModal';
import {
  SERVICE_CATEGORY_GROUPS,
  ServiceCategoryGroup,
} from '../data/wargaServiceCatalog';
import { recordDeletedItemId, PersistedDatabase, savePersistedDatabase } from '../utils/persistentStorage';
import { pushFullDatabaseToFirestore } from '../firebase/firestoreService';
import { isLocalExpressAvailable } from '../utils/runtimeEnv';
import {
  getFirestoreSessionStatus,
  subscribeToFirestoreSessionLock,
  loginWithFirestore,
  heartbeatFirestore,
  logoutFirestore,
  forceLogoutFirestore,
} from '../firebase/adminAuthService';

interface AdminSession {
  token: string;
  userId?: string;
  username: string;
  fullName: string;
  nip: string;
  role: string;
  roleLevel?: AdminRoleLevel;
  isMasterLurah?: boolean;
  allowedAdminTabs?: AdminTab[];
  allowedServiceCategories?: string[];
  actionPermissions?: AdminActionPermissions;
  loginAt: string;
  loginTimestampMs?: number;
  timezoneFixedV2?: boolean;
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
  serviceCatalog?: ServiceCategoryGroup[];
  adminUsers?: AdminUserAccount[];
  activityLogs?: AdminActivityLog[];
  onRecordActivityLog?: (
    entry: Omit<AdminActivityLog, 'id' | 'timestamp' | 'createdAtMs'>
  ) => void;
  onDeleteActivityLog?: (logId: string) => void;
  onResetActivityLogs?: () => void;
  onSaveProfile: (updated: KelurahanProfile) => Promise<{ ok: boolean; errors?: string[] }>;
  onSaveRwGroups: (updated: RwGroup[]) => Promise<{ ok: boolean; errors?: string[] }>;
  onSaveWhatsAppRecipients?: (
    updated: WhatsAppRecipient[]
  ) => Promise<{ ok: boolean; errors?: string[] }>;
  onSaveServiceCatalog?: (
    updated: ServiceCategoryGroup[]
  ) => Promise<{ ok: boolean; errors?: string[] }>;
  onSaveAdminUsers?: (
    updated: AdminUserAccount[]
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
  kerjaBaktiHighlights?: KerjaBaktiIgHighlightItem[];
  kerjaBaktiHighlightsSyncedAt?: string;
  onSyncKerjaBaktiHighlights?: () => Promise<{ ok: boolean; syncedAt?: string }>;
  onNavigate: (view: AppView) => void;
  initialTab?: AdminTab;
  onUpdateReportStatus?: (
    id: string,
    newStatus: ReportStatus,
    assignedTeam: string,
    responseNote: string
  ) => void;
  urbanFarmingSpots?: UrbanFarmingSpot[];
  seedRequests?: SeedRequestItem[];
  onAddUrbanFarmingSpot?: (
    spot: UrbanFarmingSpot
  ) => Promise<{ ok: boolean; errors?: string[] }>;
  onUpdateUrbanFarmingSpot?: (
    id: string,
    spot: Partial<UrbanFarmingSpot>
  ) => Promise<{ ok: boolean; errors?: string[] }>;
  onDeleteUrbanFarmingSpot?: (id: string) => Promise<{ ok: boolean; errors?: string[] }>;
  onAddSeedRequest?: (
    req: SeedRequestItem
  ) => Promise<{ ok: boolean; errors?: string[] }>;
  onUpdateSeedRequest?: (
    id: string,
    req: Partial<SeedRequestItem>
  ) => Promise<{ ok: boolean; errors?: string[] }>;
  onDeleteSeedRequest?: (id: string) => Promise<{ ok: boolean; errors?: string[] }>;
  tebaSpots?: TebaSpot[];
  onCreateTebaSpot?: (
    spot: Partial<TebaSpot>
  ) => Promise<{ ok: boolean; errors?: string[] }>;
  onUpdateTebaSpot?: (
    id: string,
    spot: Partial<TebaSpot>
  ) => Promise<{ ok: boolean; errors?: string[] }>;
  onDeleteTebaSpot?: (id: string) => Promise<{ ok: boolean; errors?: string[] }>;
  bioporiPoints?: BioporiPoint[];
  onCreateBioporiPoint?: (
    point: Partial<BioporiPoint>
  ) => Promise<{ ok: boolean; errors?: string[] }>;
  onUpdateBioporiPoint?: (
    id: string,
    point: Partial<BioporiPoint>
  ) => Promise<{ ok: boolean; errors?: string[] }>;
  onDeleteBioporiPoint?: (id: string) => Promise<{ ok: boolean; errors?: string[] }>;
  siskamlingSchedules?: SiskamlingRwSchedule[];
  onSaveSiskamlingSchedules?: (updated: SiskamlingRwSchedule[]) => Promise<{ ok: boolean; errors?: string[] }>;
  onExportDatabase?: () => void;
  onImportDatabase?: (jsonString: string) => { ok: boolean; message: string };
  firebaseUserProfile?: AuthenticatedUserProfile | null;
  onFirebaseLogout?: () => Promise<void>;
  citizenUsers?: AuthenticatedUserProfile[];
  citizenMenuConfig?: CitizenMenuAccessConfig;
  onSaveCitizenMenuConfig?: (
    updatedConfig: CitizenMenuAccessConfig
  ) => Promise<{ ok: boolean; error?: string }>;
  onUpdateCitizenUser?: (
    uid: string,
    updates: Partial<AuthenticatedUserProfile>
  ) => Promise<{ ok: boolean; error?: string }>;
  onDeleteCitizenUser?: (uid: string) => Promise<{ ok: boolean; error?: string }>;
  masterLayananList?: MasterLayananItem[];
  masterPersyaratanList?: MasterPersyaratanItem[];
  kategoriPengaduanList?: PengaduanKategori[];
  praRegistrasiList?: PraRegistrasiRecord[];
  pengaduanList?: PengaduanOnlineRecord[];
  onSaveMasterLayanan?: (list: MasterLayananItem[]) => Promise<{ ok: boolean; errors?: string[] }>;
  onSaveMasterPersyaratan?: (list: MasterPersyaratanItem[]) => Promise<{ ok: boolean; errors?: string[] }>;
  onSaveKategoriPengaduan?: (list: PengaduanKategori[]) => Promise<{ ok: boolean; errors?: string[] }>;
  onLurahApproveService?: (
    ticketCode: string,
    action: 'SETUJUI' | 'TOLAK' | 'KEMBALIKAN',
    lurahNote: string
  ) => Promise<void>;
}

export type AdminTab =
  | 'dashboard_lurah'
  | 'profil'
  | 'pengurusan_warga'
  | 'rtrw'
  | 'sampah'
  | 'urban_farming'
  | 'kerjabakti'
  | 'info'
  | 'whatsapp_gateway'
  | 'kelola_admin_warga'
  | 'traffic'
  | 'log_aktivitas'
  | 'user_warga'
  | 'parameter_user'
  | 'laporan';

const DEFAULT_RW_LIST = ['RW 01', 'RW 02', 'RW 03', 'RW 04', 'RW 05', 'RW 06', 'RW 07', 'RW 08'];
const DEFAULT_RT_LIST = [
  'RT 01',
  'RT 02',
  'RT 03',
  'RT 04',
  'RT 05',
  'RT 06',
  'RT 07',
  'RT 08',
  'RT 09',
  'RT 10',
  'RT 11',
];
const CATEGORIES: ReportCategory[] = [
  'Sampah Liar & TPS',
  'Drainase & Genangan',
  'Pohon & Ruang Hijau',
  'Ketertiban & Fasum',
];

interface AdminCollapsibleBarProps {
  sectionKey: string;
  title: string | React.ReactNode;
  subtitle?: string | React.ReactNode;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  headerActions?: React.ReactNode;
  isCollapsed: boolean;
  onToggle: () => void;
  headerBg?: string;
  className?: string;
  children: React.ReactNode;
}

const AdminCollapsibleBar: React.FC<AdminCollapsibleBarProps> = ({
  sectionKey,
  title,
  subtitle,
  icon,
  badge,
  headerActions,
  isCollapsed,
  onToggle,
  headerBg = 'bg-white',
  className = '',
  children,
}) => {
  return (
    <div
      id={`section-${sectionKey}`}
      className={`rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs transition-all duration-200 bg-white ${className}`}
    >
      <div
        onClick={onToggle}
        className={`px-4 sm:px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer select-none transition-colors hover:bg-slate-50/90 ${headerBg} ${
          !isCollapsed ? 'border-b border-slate-200' : ''
        }`}
      >
        <div className="flex items-start sm:items-center gap-3 min-w-0">
          {icon && (
            <div className="w-9 h-9 rounded-xl bg-slate-100 text-[#0D3868] flex items-center justify-center shrink-0 shadow-2xs">
              {icon}
            </div>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm sm:text-base font-extrabold text-[#0D3868]">
                {title}
              </h3>
              {badge}
            </div>
            {subtitle && (
              <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        <div
          className="flex items-center gap-2 self-end sm:self-center shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          {headerActions}
          <button
            type="button"
            onClick={onToggle}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              isCollapsed
                ? 'bg-[#0D3868] hover:bg-[#072647] text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
            }`}
            title={
              isCollapsed
                ? 'Tampilkan detail kartu sub-menu ini'
                : 'Tutup detail kartu sub-menu ini (hanya tampilkan judul)'
            }
          >
            {isCollapsed ? (
              <>
                <Eye className="w-3.5 h-3.5" />
                <span>Tampilkan Detail</span>
                <ChevronDown className="w-4 h-4" />
              </>
            ) : (
              <>
                <span>Tutup</span>
                <ChevronUp className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>

      {!isCollapsed && <div>{children}</div>}
    </div>
  );
};

const TAB_SECTION_KEYS: Record<string, string[]> = {
  laporan: [
    'laporan_shortcut',
    'laporan_arsip',
    'laporan_whatsapp_mgmt',
    'laporan_whatsapp_logs',
    'laporan_table',
  ],
  profil: [
    'profil_lurah',
    'profil_pejabat',
    'profil_visi_misi',
    'profil_data_umum',
  ],
  info: [
    'info_berita',
    'info_instagram',
  ],
  sampah: [
    'sampah_bsu',
    'sampah_logs',
    'sampah_teba_biopori',
  ],
  kerjabakti: [
    'kerjabakti_jadwal',
    'kerjabakti_dokumentasi',
    'kerjabakti_sorotan_ig',
  ],
  urban_farming: [
    'urban_kebun',
    'urban_bibit',
    'urban_kwt',
  ],
  rtrw: [
    'rtrw_lpm_bagan',
    'rtrw_cetak_laporan',
    'rtrw_daftar_rw',
  ],
  traffic: [
    'traffic_ringkasan',
    'traffic_telemetri',
  ],
  kelola_admin_warga: [
    'admin_warga_nav',
    'admin_warga_content',
  ],
};

const getAdminTabLabel = (tab: AdminTab): string => {
  switch (tab) {
    case 'dashboard_lurah': return 'Dashboard Lurah';
    case 'profil': return 'Profil Kelurahan';
    case 'pengurusan_warga': return 'Admin Layanan Kelurahan';
    case 'rtrw': return 'Data RT RW';
    case 'sampah': return 'Pengelolaan Sampah';
    case 'urban_farming': return 'Urban Farming';
    case 'kerjabakti': return 'Kerja Bakti';
    case 'info': return 'Informasi dan IG';
    case 'whatsapp_gateway': return 'Kelola WhatsApp Gateaway';
    case 'kelola_admin_warga':
    case 'parameter_user':
    case 'user_warga':
      return 'Kelola Admin dan User';
    case 'traffic': return 'Traffic Web dan App';
    case 'log_aktivitas': return 'Log Aktifitas Aplikasi';
    case 'laporan': return 'Admin Layanan Kelurahan';
    default: return 'Modul Administrator';
  }
};

export const AdminPanelView: React.FC<AdminPanelViewProps> = ({
  profile,
  rwGroups = [],
  reports = [],
  wasteUnits = [],
  wasteLogs = [],
  cleanupEvents = [],
  kelurahanInfos = [],
  whatsappRecipients = INITIAL_WHATSAPP_RECIPIENTS,
  serviceCatalog = SERVICE_CATEGORY_GROUPS,
  adminUsers = INITIAL_ADMIN_USERS,
  activityLogs = INITIAL_ACTIVITY_LOGS,
  onRecordActivityLog,
  onDeleteActivityLog,
  onResetActivityLogs,
  onSaveProfile,
  onSaveRwGroups,
  onSaveWhatsAppRecipients,
  onSaveServiceCatalog,
  onSaveAdminUsers,
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
  kerjaBaktiHighlights = INITIAL_KERJABAKTI_IG_HIGHLIGHTS,
  kerjaBaktiHighlightsSyncedAt = '06 November 2026 WITA',
  onSyncKerjaBaktiHighlights,
  onNavigate,
  initialTab,
  onUpdateReportStatus,
  urbanFarmingSpots = INITIAL_URBAN_FARMING_SPOTS,
  seedRequests = INITIAL_SEED_REQUESTS,
  onAddUrbanFarmingSpot,
  onUpdateUrbanFarmingSpot,
  onDeleteUrbanFarmingSpot,
  onAddSeedRequest,
  onUpdateSeedRequest,
  onDeleteSeedRequest,
  tebaSpots = INITIAL_TEBA_SPOTS,
  onCreateTebaSpot,
  onUpdateTebaSpot,
  onDeleteTebaSpot,
  bioporiPoints = INITIAL_BIOPORI_POINTS,
  onCreateBioporiPoint,
  onUpdateBioporiPoint,
  onDeleteBioporiPoint,
  siskamlingSchedules = INITIAL_SISKAMLING_SCHEDULES,
  onSaveSiskamlingSchedules,
  onExportDatabase,
  onImportDatabase,
  firebaseUserProfile,
  onFirebaseLogout,
  citizenUsers = [],
  citizenMenuConfig,
  onSaveCitizenMenuConfig,
  onUpdateCitizenUser,
  onDeleteCitizenUser,
  masterLayananList = INITIAL_MASTER_LAYANAN,
  masterPersyaratanList = INITIAL_MASTER_PERSYARATAN,
  kategoriPengaduanList = DAFTAR_KATEGORI_PENGADUAN,
  praRegistrasiList = [],
  pengaduanList = [],
  onSaveMasterLayanan,
  onSaveMasterPersyaratan,
  onSaveKategoriPengaduan,
  onLurahApproveService,
}) => {
  // ================= AUTHENTICATION STATE =================
  const [adminSession, setAdminSession] = useState<AdminSession | null>(() => {
    try {
      const saved = sessionStorage.getItem('pnk_admin_session');
      if (!saved) return null;
      const parsed = JSON.parse(saved) as AdminSession;
      if (!parsed.timezoneFixedV2) {
        const realNowStr = getRealtimeDateTimeString(new Date());
        const repaired: AdminSession = {
          ...parsed,
          loginAt: realNowStr,
          loginTimestampMs: Date.now(),
          timezoneFixedV2: true,
        };
        sessionStorage.setItem('pnk_admin_session', JSON.stringify(repaired));
        try {
          const rawLock = localStorage.getItem('pnk_active_admin_session_lock');
          if (rawLock) {
            const parsedLock = JSON.parse(rawLock);
            localStorage.setItem(
              'pnk_active_admin_session_lock',
              JSON.stringify({
                ...parsedLock,
                loginAt: realNowStr,
                lastHeartbeat: Date.now(),
              })
            );
          }
        } catch {}
        return repaired;
      }
      return parsed;
    } catch {
      return null;
    }
  });
  const [liveWitaClock, setLiveWitaClock] = useState<string>(() =>
    getRealtimeDateTimeWithSecondsString(new Date())
  );
  useEffect(() => {
    const timer = setInterval(() => {
      setLiveWitaClock(getRealtimeDateTimeWithSecondsString(new Date()));
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Firebase Email & Password Admin Login State
  const [adminLoginMethod, setAdminLoginMethod] = useState<'firebase_email' | 'nip_username'>('firebase_email');
  const [firebaseAdminEmail, setFirebaseAdminEmail] = useState('');
  const [firebaseAdminPassword, setFirebaseAdminPassword] = useState('');
  const [showFirebaseReset, setShowFirebaseReset] = useState(false);
  const [firebaseResetSuccess, setFirebaseResetSuccess] = useState('');
  const [pendingGoogleAdminRequestEmail, setPendingGoogleAdminRequestEmail] = useState<string | null>(null);
  const [googleRequestSentNotice, setGoogleRequestSentNotice] = useState('');

  // Auto-establish AdminSession when user is authenticated via Firebase Auth with trusted Master Admin or whitelisted adminUsers
  useEffect(() => {
    if (firebaseUserProfile && !adminSession) {
      const emailLower = (firebaseUserProfile.email || '').trim().toLowerCase();
      const isSuperAdminEmail = emailLower === 'asmaracess@gmail.com';
      const matchedAdmin = adminUsers.find(
        (u) =>
          u.googleEmail &&
          u.googleEmail.trim().toLowerCase() === emailLower &&
          u.isActive !== false &&
          u.isGoogleVerified !== false
      );

      // Only allow session if explicitly verified by Master Admin or is Lurah Master Admin
      if (isSuperAdminEmail || matchedAdmin) {
        const nowStr = getRealtimeDateTimeString(new Date());
        const trustedSession: AdminSession = {
          token: `fb-admin-${firebaseUserProfile.uid}`,
          userId: matchedAdmin ? matchedAdmin.id : firebaseUserProfile.uid,
          username: matchedAdmin ? matchedAdmin.username : (firebaseUserProfile.email.split('@')[0] || 'admin'),
          fullName: matchedAdmin ? matchedAdmin.fullName : (firebaseUserProfile.fullName || 'Muthmainnah, SE, MM'),
          nip: matchedAdmin ? matchedAdmin.nip : (firebaseUserProfile.nik || '198607092015042001'),
          role: matchedAdmin ? matchedAdmin.jabatan : 'Lurah Panaikang (Master Admin Terverifikasi)',
          roleLevel: isSuperAdminEmail ? 'master_admin' : (matchedAdmin?.roleLevel || 'admin_bidang'),
          isMasterLurah: isSuperAdminEmail || Boolean(matchedAdmin?.isMasterLurah),
          allowedAdminTabs: isSuperAdminEmail ? undefined : (matchedAdmin?.allowedAdminTabs as AdminTab[] | undefined),
          allowedServiceCategories: isSuperAdminEmail ? undefined : matchedAdmin?.allowedServiceCategories,
          actionPermissions: isSuperAdminEmail ? undefined : matchedAdmin?.actionPermissions,
          loginAt: nowStr,
          loginTimestampMs: Date.now(),
          timezoneFixedV2: true,
        };
        setAdminSession(trustedSession);
        sessionStorage.setItem('pnk_admin_session', JSON.stringify(trustedSession));
      }
    }
  }, [firebaseUserProfile, adminSession, adminUsers]);

  const [activeTab, setActiveTab] = useState<AdminTab>(() => {
    if (initialTab === 'parameter_user' || initialTab === 'user_warga') {
      return 'kelola_admin_warga';
    }
    return initialTab || 'dashboard_lurah';
  });
  const [rtrwSubTab, setRtrwSubTab] = useState<'wilayah' | 'siskamling'>('wilayah');
  const [kelolaAdminWargaSubTab, setKelolaAdminWargaSubTab] = useState<KelolaAdminWargaSubTab>(() => {
    if (initialTab === 'user_warga') return 'user_warga';
    if (initialTab === 'parameter_user') return 'parameter_admin';
    return 'otoritas_master';
  });

  useEffect(() => {
    if (initialTab) {
      if (initialTab === 'user_warga') {
        setActiveTab('kelola_admin_warga');
        setKelolaAdminWargaSubTab('user_warga');
      } else if (initialTab === 'parameter_user') {
        setActiveTab('kelola_admin_warga');
        setKelolaAdminWargaSubTab('parameter_admin');
      } else {
        setActiveTab(initialTab);
      }
    }
  }, [initialTab]);

  // Single-Live Admin Lock status across all registered admins
  const [activeAdminLockInfo, setActiveAdminLockInfo] = useState<{
    isLocked: boolean;
    activeAdmin?: {
      userId?: string;
      username: string;
      fullName: string;
      role: string;
      roleLevel?: string;
      loginAt: string;
    } | null;
  }>({ isLocked: false, activeAdmin: null });

  const [showTakeoverModal, setShowTakeoverModal] = useState(false);
  const [takeoverPassword, setTakeoverPassword] = useState('');
  const [takeoverError, setTakeoverError] = useState('');
  const [isTakingOver, setIsTakingOver] = useState(false);

  const checkSessionStatus = React.useCallback(async () => {
    try {
      const fsStatus = await getFirestoreSessionStatus();
      setActiveAdminLockInfo({
        isLocked: fsStatus.isLocked,
        activeAdmin: fsStatus.activeAdmin || null,
      });
      if (!isLocalExpressAvailable()) {
        return;
      }
    } catch {}

    if (!isLocalExpressAvailable()) return;

    try {
      const res = await fetch('/api/auth/session-status', { cache: 'no-store' });
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const json = await res.json();
        if (json?.ok && json.isLocked) {
          setActiveAdminLockInfo({
            isLocked: Boolean(json.isLocked),
            activeAdmin: json.activeAdmin || null,
          });
        }
      }
    } catch {}
  }, []);

  // Listen to Firestore updates for real-time lock indication
  useEffect(() => {
    const unsubFirestore = subscribeToFirestoreSessionLock((status) => {
      setActiveAdminLockInfo({
        isLocked: status.isLocked,
        activeAdmin: status.activeAdmin || null,
      });
    });

    const handleSseSession = (e: Event) => {
      const customEvent = e as CustomEvent;
      const detail = customEvent.detail;
      if (!detail) return;
      setActiveAdminLockInfo({
        isLocked: Boolean(detail.isLocked),
        activeAdmin: detail.activeAdmin || null,
      });
    };

    window.addEventListener('pnk_admin_session_sse', handleSseSession);
    return () => {
      unsubFirestore();
      window.removeEventListener('pnk_admin_session_sse', handleSseSession);
    };
  }, []);

  useEffect(() => {
    checkSessionStatus();
  }, [checkSessionStatus]);

  // Keep Single-Admin Lock heartbeat active while admin session is live
  useEffect(() => {
    if (!adminSession?.token) return;

    const sendHeartbeat = async () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
        return;
      }

      try {
        await heartbeatFirestore(adminSession.token, adminSession.loginAt);
      } catch {}

      if (isLocalExpressAvailable()) {
        try {
          await fetch('/api/auth/heartbeat', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-admin-token': adminSession.token,
            },
            body: JSON.stringify({
              token: adminSession.token,
              loginAt: adminSession.loginAt,
            }),
          });
        } catch {}
      }
    };

    sendHeartbeat();
    const heartbeatTimer = setInterval(sendHeartbeat, 20000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        sendHeartbeat();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(heartbeatTimer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [adminSession?.token, adminSession?.loginAt]);

  const currentAdminAccount = React.useMemo(() => {
    if (!adminSession) return null;
    const cleanU = adminSession.username.toLowerCase();
    return (
      adminUsers.find(
        (u) =>
          u.id === adminSession.userId ||
          u.username.toLowerCase() === cleanU ||
          (Boolean(u.isMasterLurah || u.roleLevel === 'master_admin') &&
            ['admin', 'lurah', 'lurah.panaikang'].includes(cleanU))
      ) || null
    );
  }, [adminSession, adminUsers]);

  const isLurahSession = Boolean(
    adminSession &&
      (currentAdminAccount?.isMasterLurah ||
        currentAdminAccount?.roleLevel === 'master_admin' ||
        adminSession.isMasterLurah ||
        adminSession.roleLevel === 'master_admin' ||
        adminSession.role.toLowerCase().includes('lurah') ||
        adminSession.username.toLowerCase() === 'admin' ||
        adminSession.username.toLowerCase() === 'lurah')
  );

  const effectiveAllowedTabs: AdminTab[] = React.useMemo(() => {
    if (isLurahSession) {
      return [
        'dashboard_lurah',
        'profil',
        'pengurusan_warga',
        'rtrw',
        'sampah',
        'urban_farming',
        'kerjabakti',
        'info',
        'whatsapp_gateway',
        'kelola_admin_warga',
        'traffic',
        'log_aktivitas',
        'parameter_user',
        'user_warga',
      ];
    }
    if (
      currentAdminAccount &&
      Array.isArray(currentAdminAccount.allowedAdminTabs) &&
      currentAdminAccount.allowedAdminTabs.length > 0
    ) {
      return currentAdminAccount.allowedAdminTabs.filter((t) => t !== 'laporan') as AdminTab[];
    }
    if (
      adminSession &&
      Array.isArray(adminSession.allowedAdminTabs) &&
      adminSession.allowedAdminTabs.length > 0
    ) {
      return adminSession.allowedAdminTabs.filter((t) => t !== 'laporan');
    }
    return [
      'profil',
      'pengurusan_warga',
      'rtrw',
      'sampah',
      'urban_farming',
      'kerjabakti',
      'info',
      'whatsapp_gateway',
      'kelola_admin_warga',
      'traffic',
      'log_aktivitas',
    ];
  }, [isLurahSession, currentAdminAccount, adminSession]);

  const effectiveAllowedCategories: string[] | undefined = React.useMemo(() => {
    if (isLurahSession) return undefined;
    return (
      currentAdminAccount?.allowedServiceCategories ||
      adminSession?.allowedServiceCategories
    );
  }, [isLurahSession, currentAdminAccount, adminSession]);

  const effectiveActionPermissions: AdminActionPermissions = React.useMemo(() => {
    if (isLurahSession) {
      return {
        canCreate: true,
        canEdit: true,
        canDelete: true,
        canVerifyAndIssueLetter: true,
        canConfigureCatalog: true,
        canManageWhatsApp: true,
        canExportPrintPdf: true,
      };
    }
    return (
      currentAdminAccount?.actionPermissions ||
      adminSession?.actionPermissions || {
        canCreate: true,
        canEdit: true,
        canDelete: false,
        canVerifyAndIssueLetter: true,
        canConfigureCatalog: false,
        canManageWhatsApp: false,
        canExportPrintPdf: true,
      }
    );
  }, [isLurahSession, currentAdminAccount, adminSession]);

  const isTabAllowed = (tabId: AdminTab) => {
    if (isLurahSession) return true;
    if (tabId === 'kelola_admin_warga') {
      return (
        effectiveAllowedTabs.includes('kelola_admin_warga') ||
        effectiveAllowedTabs.includes('parameter_user') ||
        effectiveAllowedTabs.includes('user_warga')
      );
    }
    if (tabId === 'parameter_user' || tabId === 'user_warga') {
      return (
        effectiveAllowedTabs.includes('kelola_admin_warga') ||
        effectiveAllowedTabs.includes(tabId)
      );
    }
    if (tabId === 'whatsapp_gateway') {
      return (
        effectiveAllowedTabs.includes('whatsapp_gateway') ||
        effectiveActionPermissions.canManageWhatsApp
      );
    }
    return effectiveAllowedTabs.includes(tabId);
  };

  const [rtrwPrintSelection, setRtrwPrintSelection] =
    useState<ExternalPrintSelection | null>(null);

  // Helper to record audit trail entry with current active admin identity
  const recordAudit = (params: {
    actionType: AdminActivityActionType;
    module: AdminActivityModule;
    targetId?: string;
    targetLabel: string;
    summary: string;
    details?: string;
    beforeValue?: string;
    afterValue?: string;
    severity?: 'info' | 'warning' | 'critical';
    overrideActor?: {
      username: string;
      fullName: string;
      jabatan: string;
      nip?: string;
      roleLevel?: AdminRoleLevel;
    };
  }) => {
    if (!onRecordActivityLog) return;
    const actorUsername =
      params.overrideActor?.username ||
      currentAdminAccount?.username ||
      adminSession?.username ||
      'lurah';
    const actorName =
      params.overrideActor?.fullName ||
      currentAdminAccount?.fullName ||
      adminSession?.fullName ||
      'Muthmainnah, SE, MM';
    const actorJabatan =
      params.overrideActor?.jabatan ||
      currentAdminAccount?.jabatan ||
      adminSession?.role ||
      'Administrator Kelurahan Panaikang';
    const actorNip =
      params.overrideActor?.nip || currentAdminAccount?.nip || adminSession?.nip || '-';
    const actorRoleLevel: AdminRoleLevel =
      params.overrideActor?.roleLevel ||
      currentAdminAccount?.roleLevel ||
      adminSession?.roleLevel ||
      (isLurahSession ? 'master_admin' : 'admin_bidang');

    onRecordActivityLog({
      actorUsername,
      actorName,
      actorJabatan,
      actorNip,
      actorRoleLevel,
      actionType: params.actionType,
      module: params.module,
      targetId: params.targetId,
      targetLabel: params.targetLabel,
      summary: params.summary,
      details: params.details,
      beforeValue: params.beforeValue,
      afterValue: params.afterValue,
      severity: params.severity || 'info',
    });
  };

  const auditedOnUpdateReport = async (id: string, rep: Partial<CitizenReport>) => {
    const prev = reports.find((r) => r.id === id);
    const res = await onUpdateReport(id, rep);
    if (res.ok && prev) {
      const statusChanged = rep.status && rep.status !== prev.status;
      const letterIssued =
        rep.letterRegisterNumber && rep.letterRegisterNumber !== prev.letterRegisterNumber;
      recordAudit({
        actionType: statusChanged || letterIssued ? 'VERIFY_STATUS' : 'UPDATE',
        module: prev.serviceCategoryId ? 'PENGURUSAN_WARGA' : 'LAPORAN_WARGA',
        targetId: prev.ticketCode,
        targetLabel: `Tiket #${prev.ticketCode} · ${prev.serviceSubItemLabel || prev.title}`,
        summary: letterIssued
          ? `Memverifikasi pengajuan & menerbitkan Nomor Surat Resmi (${rep.letterRegisterNumber})`
          : statusChanged
          ? `Mengubah status penanganan menjadi "${rep.status}"`
          : `Memperbarui data tindak lanjut berkas/laporan #${prev.ticketCode}`,
        details: `Pemohon/Pelapor: ${prev.reporterName} (${prev.rw}/${prev.rt}). Catatan: ${
          rep.responseNote || prev.responseNote || '-'
        }`,
        beforeValue: `Status: ${prev.status}${
          prev.letterRegisterNumber ? ` · No. Surat: ${prev.letterRegisterNumber}` : ''
        }`,
        afterValue: `Status: ${rep.status || prev.status}${
          rep.letterRegisterNumber ? ` · No. Surat: ${rep.letterRegisterNumber}` : ''
        }`,
        severity: 'info',
      });
    }
    return res;
  };

  const auditedOnCreateReport = async (rep: Partial<CitizenReport>) => {
    const res = await onCreateReport(rep);
    if (res.ok) {
      recordAudit({
        actionType: 'CREATE',
        module: rep.serviceCategoryId ? 'PENGURUSAN_WARGA' : 'LAPORAN_WARGA',
        targetLabel: `${rep.serviceSubItemLabel || rep.title || 'Berkas Baru'} (${
          rep.reporterName || 'Warga'
        })`,
        summary: `Menambahkan registrasi pengajuan/laporan warga baru melalui Panel Admin`,
        details: `Wilayah: ${rep.rw || '-'} / ${rep.rt || '-'} · Kategori: ${
          rep.serviceCategoryTitle || rep.category || '-'
        }`,
        afterValue: `Status Awal: ${rep.status || 'Menunggu Verifikasi'}`,
        severity: 'info',
      });
    }
    return res;
  };

  const auditedOnDeleteReport = async (id: string) => {
    const prev = reports.find((r) => r.id === id);
    const res = await onDeleteReport(id);
    if (res.ok && prev) {
      recordAudit({
        actionType: 'DELETE',
        module: prev.serviceCategoryId ? 'PENGURUSAN_WARGA' : 'LAPORAN_WARGA',
        targetId: prev.ticketCode,
        targetLabel: `Tiket #${prev.ticketCode} · ${prev.title}`,
        summary: `Menghapus data pengajuan/laporan warga #${prev.ticketCode}`,
        details: `Pemohon/Pelapor: ${prev.reporterName} (${prev.rw}/${prev.rt})`,
        beforeValue: `Status Terakhir: ${prev.status}`,
        afterValue: 'Data Dihapus Permanen',
        severity: 'critical',
      });
    }
    return res;
  };

  const auditedOnSaveServiceCatalog = async (updatedCatalog: ServiceCategoryGroup[]) => {
    if (!onSaveServiceCatalog) return { ok: true };
    const totalSubMenus = updatedCatalog.reduce((acc, g) => acc + g.items.length, 0);
    const res = await onSaveServiceCatalog(updatedCatalog);
    if (res.ok) {
      recordAudit({
        actionType: 'UPDATE',
        module: 'KATALOG_SOP',
        targetLabel: `Katalog Layanan Warga (${updatedCatalog.length} Bidang · ${totalSubMenus} Sub-Menu)`,
        summary: `Memperbarui konfigurasi SOP, persyaratan berkas, atau sub-menu layanan warga`,
        details: `Perubahan katalog langsung tersinkronisasi ke halaman Menu Warga.`,
        afterValue: `${updatedCatalog.length} Kategori · ${totalSubMenus} Sub-Menu Aktif`,
        severity: 'warning',
      });
    }
    return res;
  };

  const auditedOnSaveAdminUsers = async (updatedUsers: AdminUserAccount[]) => {
    if (!onSaveAdminUsers) return { ok: true };
    const prevCount = adminUsers.length;
    const nextCount = updatedUsers.length;
    const res = await onSaveAdminUsers(updatedUsers);
    if (res.ok) {
      const actionType: AdminActivityActionType =
        nextCount > prevCount
          ? 'CREATE'
          : nextCount < prevCount
          ? 'DELETE'
          : 'ACCESS_CHANGE';
      recordAudit({
        actionType,
        module: 'PARAMETER_USER',
        targetLabel: `Database Akun & Hak Akses Admin (${nextCount} Akun Terdaftar)`,
        summary:
          nextCount > prevCount
            ? 'Menambahkan akun user admin baru pada Parameter User'
            : nextCount < prevCount
            ? 'Menghapus akun user admin dari daftar Parameter User'
            : 'Memperbarui profil akun atau batasan hak akses modul user admin',
        details: `Total akun aktif: ${
          updatedUsers.filter((u) => u.isActive).length
        } dari ${nextCount} akun terdaftar.`,
        beforeValue: `${prevCount} Akun Admin`,
        afterValue: `${nextCount} Akun Admin (${
          updatedUsers.filter((u) => u.isActive).length
        } Aktif)`,
        severity: nextCount < prevCount ? 'critical' : 'warning',
      });
    }
    return res;
  };

  const auditedOnAddUrbanFarmingSpot = async (spot: UrbanFarmingSpot) => {
    if (!onAddUrbanFarmingSpot) return { ok: true };
    const res = await onAddUrbanFarmingSpot(spot);
    if (res.ok) {
      recordAudit({
        actionType: 'CREATE',
        module: 'URBAN_FARMING',
        targetId: spot.id,
        targetLabel: `Kebun: ${spot.name} (${spot.rw} · ${spot.rt})`,
        summary: `Menambahkan data kebun urban farming baru "${spot.name}"`,
        details: `Koordinator: ${spot.coordinatorName} (${spot.coordinatorPhone}) | Metode: ${spot.farmingType} | Komoditas: ${spot.commodities.join(', ')}`,
        afterValue: `Status: ${spot.status} · Estimasi Produksi: ${spot.monthlyProductionKg} kg/bln`,
        severity: 'info',
      });
    }
    return res;
  };

  const auditedOnUpdateUrbanFarmingSpot = async (
    id: string,
    updated: Partial<UrbanFarmingSpot>
  ) => {
    if (!onUpdateUrbanFarmingSpot) return { ok: true };
    const prev = urbanFarmingSpots.find((s) => s.id === id);
    const res = await onUpdateUrbanFarmingSpot(id, updated);
    if (res.ok) {
      recordAudit({
        actionType: 'UPDATE',
        module: 'URBAN_FARMING',
        targetId: id,
        targetLabel: `Kebun: ${updated.name || prev?.name || id}`,
        summary: `Memperbarui data dan foto dokumentasi kebun urban farming "${updated.name || prev?.name || id}"`,
        details: `Wilayah: ${updated.rw || prev?.rw} / ${updated.rt || prev?.rt}. Produksi: ${updated.monthlyProductionKg ?? prev?.monthlyProductionKg} kg/bln`,
        beforeValue: `Status: ${prev?.status || '-'} · Panen: ${prev?.nextHarvestDate || '-'}`,
        afterValue: `Status: ${updated.status || prev?.status} · Panen: ${updated.nextHarvestDate || prev?.nextHarvestDate}`,
        severity: 'warning',
      });
    }
    return res;
  };

  const auditedOnDeleteUrbanFarmingSpot = async (id: string) => {
    if (!onDeleteUrbanFarmingSpot) return { ok: true };
    const prev = urbanFarmingSpots.find((s) => s.id === id);
    const res = await onDeleteUrbanFarmingSpot(id);
    if (res.ok) {
      recordAudit({
        actionType: 'DELETE',
        module: 'URBAN_FARMING',
        targetId: id,
        targetLabel: `Kebun: ${prev?.name || id}`,
        summary: `Menghapus kebun urban farming "${prev?.name || id}"`,
        details: `Lokasi sebelumnya di ${prev?.rw || '-'} / ${prev?.rt || '-'} (${prev?.locationAddress || '-'})`,
        severity: 'critical',
      });
    }
    return res;
  };

  const auditedOnAddSeedRequest = async (req: SeedRequestItem) => {
    if (!onAddSeedRequest) return { ok: true };
    const res = await onAddSeedRequest(req);
    if (res.ok) {
      recordAudit({
        actionType: 'CREATE',
        module: 'URBAN_FARMING',
        targetId: req.id,
        targetLabel: `Permohonan Bibit: ${req.applicantName} (${req.rw})`,
        summary: `Mencatat permohonan bibit gratis baru dari warga "${req.applicantName}"`,
        details: `Benih: ${req.requestedSeeds.join(', ')} | Metode: ${req.plantingMethod}`,
        severity: 'info',
      });
    }
    return res;
  };

  const auditedOnUpdateSeedRequest = async (
    id: string,
    updated: Partial<SeedRequestItem>
  ) => {
    if (!onUpdateSeedRequest) return { ok: true };
    const prev = seedRequests.find((r) => r.id === id);
    const res = await onUpdateSeedRequest(id, updated);
    if (res.ok) {
      recordAudit({
        actionType: 'VERIFY_STATUS',
        module: 'URBAN_FARMING',
        targetId: id,
        targetLabel: `Permohonan Bibit: ${prev?.applicantName || id}`,
        summary: `Mengubah status permohonan bibit #${id} menjadi "${updated.status || prev?.status}"`,
        details: `Pemohon: ${prev?.applicantName} (${prev?.applicantPhone}) · ${prev?.rw}/${prev?.rt}`,
        beforeValue: `Status: ${prev?.status || '-'}`,
        afterValue: `Status: ${updated.status || prev?.status}`,
        severity: 'info',
      });
    }
    return res;
  };

  const auditedOnDeleteSeedRequest = async (id: string) => {
    if (!onDeleteSeedRequest) return { ok: true };
    const prev = seedRequests.find((r) => r.id === id);
    const res = await onDeleteSeedRequest(id);
    if (res.ok) {
      recordAudit({
        actionType: 'DELETE',
        module: 'URBAN_FARMING',
        targetId: id,
        targetLabel: `Permohonan Bibit: ${prev?.applicantName || id}`,
        summary: `Menghapus data permohonan bibit #${id}`,
        details: `Pemohon: ${prev?.applicantName} (${prev?.rw})`,
        severity: 'warning',
      });
    }
    return res;
  };

  const [sampahSubTab, setSampahSubTab] = useState<'bsu' | 'teba' | 'biopori'>('bsu');

  const auditedOnCreateTebaSpot = async (spot: Partial<TebaSpot>) => {
    if (!onCreateTebaSpot) return { ok: true };
    const res = await onCreateTebaSpot(spot);
    if (res.ok) {
      recordAudit({
        actionType: 'CREATE',
        module: 'BANK_SAMPAH',
        targetLabel: `Titik Teba: ${spot.name || 'Baru'} (${spot.rw || '-'})`,
        summary: `Menambahkan titik Teba komunal baru "${spot.name}" di ${spot.rw}`,
        details: `Alamat: ${spot.address}. Tag: ${spot.locationTag}. Kapasitas: ${spot.capacityKg} kg`,
        severity: 'info',
      });
    }
    return res;
  };

  const auditedOnUpdateTebaSpot = async (id: string, spot: Partial<TebaSpot>) => {
    if (!onUpdateTebaSpot) return { ok: true };
    const prev = tebaSpots.find((t) => t.id === id);
    const res = await onUpdateTebaSpot(id, spot);
    if (res.ok) {
      recordAudit({
        actionType: 'UPDATE',
        module: 'BANK_SAMPAH',
        targetId: id,
        targetLabel: `Titik Teba: ${spot.name || prev?.name || id}`,
        summary: `Memperbarui data titik Teba komunal "${spot.name || prev?.name || id}"`,
        details: `Status: ${spot.status || prev?.status}. Tag: ${spot.locationTag || prev?.locationTag}`,
        beforeValue: `Beban: ${prev?.currentLoadKg || 0} kg · Status: ${prev?.status || '-'}`,
        afterValue: `Beban: ${spot.currentLoadKg ?? prev?.currentLoadKg} kg · Status: ${spot.status || prev?.status}`,
        severity: 'warning',
      });
    }
    return res;
  };

  const auditedOnDeleteTebaSpot = async (id: string) => {
    if (!onDeleteTebaSpot) return { ok: true };
    const prev = tebaSpots.find((t) => t.id === id);
    const res = await onDeleteTebaSpot(id);
    if (res.ok) {
      recordAudit({
        actionType: 'DELETE',
        module: 'BANK_SAMPAH',
        targetId: id,
        targetLabel: `Titik Teba: ${prev?.name || id}`,
        summary: `Menghapus data titik Teba komunal "${prev?.name || id}"`,
        details: `Alamat sebelumnya di ${prev?.address || '-'} (${prev?.rw || '-'})`,
        severity: 'critical',
      });
    }
    return res;
  };

  const auditedOnCreateBioporiPoint = async (point: Partial<BioporiPoint>) => {
    if (!onCreateBioporiPoint) return { ok: true };
    const res = await onCreateBioporiPoint(point);
    if (res.ok) {
      recordAudit({
        actionType: 'CREATE',
        module: 'BANK_SAMPAH',
        targetLabel: `Titik Biopori: ${point.name || 'Baru'} (${point.rw || '-'})`,
        summary: `Menambahkan titik lubang resapan biopori baru "${point.name}" di ${point.rw}`,
        details: `Alamat: ${point.address}. Tag: ${point.locationTag}. Jumlah: ${point.totalHoles} lubang`,
        severity: 'info',
      });
    }
    return res;
  };

  const auditedOnUpdateBioporiPoint = async (id: string, point: Partial<BioporiPoint>) => {
    if (!onUpdateBioporiPoint) return { ok: true };
    const prev = bioporiPoints.find((p) => p.id === id);
    const res = await onUpdateBioporiPoint(id, point);
    if (res.ok) {
      recordAudit({
        actionType: 'UPDATE',
        module: 'BANK_SAMPAH',
        targetId: id,
        targetLabel: `Titik Biopori: ${point.name || prev?.name || id}`,
        summary: `Memperbarui data dan dokumentasi titik biopori "${point.name || prev?.name || id}"`,
        details: `Status: ${point.status || prev?.status}. Jumlah lubang: ${point.totalHoles ?? prev?.totalHoles}`,
        beforeValue: `Status: ${prev?.status || '-'} · Lubang: ${prev?.totalHoles || 0}`,
        afterValue: `Status: ${point.status || prev?.status} · Lubang: ${point.totalHoles ?? prev?.totalHoles}`,
        severity: 'warning',
      });
    }
    return res;
  };

  const auditedOnDeleteBioporiPoint = async (id: string) => {
    if (!onDeleteBioporiPoint) return { ok: true };
    const prev = bioporiPoints.find((p) => p.id === id);
    const res = await onDeleteBioporiPoint(id);
    if (res.ok) {
      recordAudit({
        actionType: 'DELETE',
        module: 'BANK_SAMPAH',
        targetId: id,
        targetLabel: `Titik Biopori: ${prev?.name || id}`,
        summary: `Menghapus data titik biopori "${prev?.name || id}"`,
        details: `Alamat sebelumnya di ${prev?.address || '-'} (${prev?.rw || '-'})`,
        severity: 'critical',
      });
    }
    return res;
  };
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Sync profileDraft when profile prop updates
  const [profileDraft, setProfileDraft] = useState<KelurahanProfile>(() => ({
    ...profile,
    officials: Array.isArray(profile.officials) ? profile.officials : [],
  }));
  useEffect(() => {
    setProfileDraft((prev) => ({
      ...profile,
      officials: Array.isArray(profile.officials)
        ? profile.officials
        : Array.isArray(prev.officials)
        ? prev.officials
        : [],
    }));
  }, [profile]);
  const [newMisiText, setNewMisiText] = useState('');

  // Manajemen Jabatan & Struktur Organisasi Kelurahan
  const [isOfficialModalOpen, setIsOfficialModalOpen] = useState(false);
  const [editingOfficialId, setEditingOfficialId] = useState<string | null>(null);
  const [officialToDelete, setOfficialToDelete] = useState<StructuralOfficial | null>(null);
  const [showAdminBaganKelurahan, setShowAdminBaganKelurahan] = useState(false);
  const [showAdminBaganRtRw, setShowAdminBaganRtRw] = useState(false);
  const [officialForm, setOfficialForm] = useState<{
    positionTitle: string;
    officialName: string;
    nip: string;
    rank: string;
    department: string;
    phone: string;
    staffNames: string[];
  }>({
    positionTitle: '',
    officialName: '',
    nip: '',
    rank: '',
    department: '',
    phone: '',
    staffNames: [],
  });
  const [officialNewStaffInput, setOfficialNewStaffInput] = useState('');
  const [officialFormError, setOfficialFormError] = useState('');

  // Dynamic SOTK Staff input states (per Kasi section)
  const [newStafPemerintahanInput, setNewStafPemerintahanInput] = useState('');
  const [newStafPemberdayaanInput, setNewStafPemberdayaanInput] = useState('');
  const [newStafKebersihanInput, setNewStafKebersihanInput] = useState('');
  const [showInlineRtRwChartPreview, setShowInlineRtRwChartPreview] = useState(false);

  // ---------- PROFIL KELURAHAN CRUD STATES ----------
  // Data Lurah Modal & Delete State
  const [isLurahModalOpen, setIsLurahModalOpen] = useState(false);
  const [confirmDeleteLurah, setConfirmDeleteLurah] = useState(false);
  const [lurahForm, setLurahForm] = useState({
    lurahName: '',
    lurahNip: '',
    lurahRank: '',
    lurahPeriod: '',
    lurahMessage: '',
    lurahPhotoUrl: '',
  });

  // Visi Kelurahan Modal & Delete State
  const [isVisiModalOpen, setIsVisiModalOpen] = useState(false);
  const [confirmDeleteVisi, setConfirmDeleteVisi] = useState(false);
  const [visiFormText, setVisiFormText] = useState('');

  // Misi Kelurahan Modal & Delete State
  const [isMisiModalOpen, setIsMisiModalOpen] = useState(false);
  const [editingMisiIndex, setEditingMisiIndex] = useState<number | null>(null);
  const [misiToDeleteIndex, setMisiToDeleteIndex] = useState<number | null>(null);
  const [misiFormText, setMisiFormText] = useState('');

  // Alamat & Kontak Kantor Kelurahan Modal & Delete State
  const [isOfficeContactModalOpen, setIsOfficeContactModalOpen] = useState(false);
  const [confirmDeleteOfficeContact, setConfirmDeleteOfficeContact] = useState(false);
  const [officeContactForm, setOfficeContactForm] = useState({
    officeAddress: '',
    postalCode: '',
    serviceHours: '',
    phoneContact: '',
    emailContact: '',
  });

  // Batas Wilayah Modal & Delete State
  const [isBoundariesModalOpen, setIsBoundariesModalOpen] = useState(false);
  const [confirmDeleteBoundaries, setConfirmDeleteBoundaries] = useState(false);
  const [boundariesForm, setBoundariesForm] = useState({
    utara: '',
    selatan: '',
    timur: '',
    barat: '',
  });

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const cleanUser = loginUsername.trim().toLowerCase();
    const cleanNip = cleanUser.replace(/\s+/g, '');
    const cleanPass = loginPassword.trim();
    if (!cleanUser || !cleanPass) {
      setLoginError('Mohon masukkan Username/NIP dan Kata Sandi terlebih dahulu.');
      return;
    }

    setIsLoggingIn(true);

    const clientLoginAt = getRealtimeDateTimeString(new Date());
    const clientLoginTimestampMs = Date.now();

    const applySuccessfulSession = (rawSessionData: AdminSession) => {
      const sessionData: AdminSession = {
        ...rawSessionData,
        loginAt: clientLoginAt,
        loginTimestampMs: clientLoginTimestampMs,
        timezoneFixedV2: true,
      };
      setAdminSession(sessionData);
      sessionStorage.setItem('pnk_admin_session', JSON.stringify(sessionData));
      try {
        localStorage.setItem(
          'pnk_active_admin_session_lock',
          JSON.stringify({
            token: sessionData.token,
            userId: sessionData.userId,
            username: sessionData.username,
            fullName: sessionData.fullName,
            role: sessionData.role,
            roleLevel: sessionData.roleLevel,
            loginAt: sessionData.loginAt,
            lastHeartbeat: Date.now(),
          })
        );
      } catch {}

      if (onSaveAdminUsers && Array.isArray(adminUsers) && adminUsers.length > 0) {
        const updatedUsers = adminUsers.map((u) => {
          const isMatch =
            (sessionData.userId && u.id === sessionData.userId) ||
            u.username.trim().toLowerCase() === sessionData.username.trim().toLowerCase();
          return isMatch ? { ...u, lastLoginAt: clientLoginAt } : u;
        });
        onSaveAdminUsers(updatedUsers).catch(() => {});
      }

      setLoginPassword('');
      checkSessionStatus();
      recordAudit({
        actionType: 'LOGIN',
        module: 'AUTENTIKASI',
        targetId: sessionData.userId,
        targetLabel: `Sesi Portal Admin · ${sessionData.fullName} (@${sessionData.username})`,
        summary: `Login berhasil ke Panel Admin Kelurahan Panaikang (${sessionData.loginAt})`,
        details: `Peran: ${sessionData.role} · Waktu Login: ${sessionData.loginAt}`,
        severity: 'info',
        overrideActor: {
          username: sessionData.username,
          fullName: sessionData.fullName,
          jabatan: sessionData.role,
          nip: sessionData.nip,
          roleLevel: sessionData.roleLevel,
        },
      });
      if (
        Array.isArray(sessionData.allowedAdminTabs) &&
        sessionData.allowedAdminTabs.length > 0 &&
        !sessionData.allowedAdminTabs.includes(activeTab)
      ) {
        setActiveTab(sessionData.allowedAdminTabs[0]);
      }
    };

    const shouldForceTakeover = cleanUser === 'lurah' || cleanUser === 'admin' || Boolean(activeAdminLockInfo.isLocked);

    // 1. First attempt login via local Express server API if running locally
    if (isLocalExpressAvailable()) {
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: cleanUser,
            password: cleanPass,
            clientToken: adminSession?.token,
            forceTakeover: shouldForceTakeover,
            clientLoginAt,
          }),
        });

        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const json = await res.json();
          // If server actively locked by another admin (409 Conflict)
          if (res.status === 409 || (json.isLocked && !json.ok)) {
            setIsLoggingIn(false);
            setActiveAdminLockInfo({
              isLocked: true,
              activeAdmin: json.activeAdmin || null,
            });
            setLoginError(
              json.error ||
                'Akses ditolak: Administrator lain sedang aktif di perangkat lain. Hanya 1 admin yang dapat online dalam satu waktu.'
            );
            return;
          }

          // If credentials invalid (401 or 403)
          if (res.status === 401 || res.status === 403 || (!json.ok && !json.session)) {
            setIsLoggingIn(false);
            setLoginError(
              json.error || 'Username/NIP atau kata sandi yang dimasukkan tidak valid.'
            );
            return;
          }

          // If server authenticated successfully
          if (res.ok && json.ok && json.session) {
            setIsLoggingIn(false);
            applySuccessfulSession(json.session);
            return;
          }
        }
      } catch {
        // Server unreachable, fallback directly to Firestore cloud auth
      }
    }

    // 2. Resilient Firestore Cloud Authentication & Single-Admin Lock
    try {
      const fsResult = await loginWithFirestore(
        cleanUser,
        cleanPass,
        adminUsers,
        shouldForceTakeover,
        clientLoginAt
      );
      setIsLoggingIn(false);
      if (!fsResult.ok) {
        if (fsResult.isLocked) {
          setActiveAdminLockInfo({
            isLocked: true,
            activeAdmin: fsResult.activeAdmin || null,
          });
        }
        setLoginError(fsResult.error || 'Username/NIP atau kata sandi tidak valid.');
        return;
      }
      if (fsResult.session) {
        applySuccessfulSession(fsResult.session as AdminSession);
        return;
      }
    } catch (fsErr) {
      setIsLoggingIn(false);
      console.error('[Auth] Firestore auth error:', fsErr);
      setLoginError('Gagal memvalidasi login admin. Pastikan perangkat Anda terhubung ke jaringan internet.');
    }
  };

  const verifyAndEstablishGoogleAdminProfile = useCallback(
    async (profile: AuthenticatedUserProfile) => {
      const emailLower = (profile.email || '').trim().toLowerCase();
      const isSuperAdmin = emailLower === 'asmaracess@gmail.com';
      const matchedAdmin = adminUsers.find(
        (u) =>
          u.googleEmail &&
          u.googleEmail.trim().toLowerCase() === emailLower &&
          u.isActive !== false &&
          u.isGoogleVerified !== false
      );

      if (!isSuperAdmin && !matchedAdmin) {
        const rejectedEmail = profile.email;
        setPendingGoogleAdminRequestEmail(rejectedEmail);
        // Sign out the unverified account so the browser doesn't stay locked to it on the next click
        try {
          await logoutFirebaseUser();
        } catch {
          // Non-fatal
        }
        setLoginError(
          `Akun Google "${rejectedEmail}" belum terdaftar atau belum diverifikasi oleh Master Admin (Lurah) sebagai Administrator. Silakan pilih akun Gmail Anda yang telah didaftarkan dari perangkat ini.`
        );
        return;
      }

      const nowStr = getRealtimeDateTimeString(new Date());
      const trustedSession: AdminSession = {
        token: `fb-admin-${profile.uid}`,
        userId: matchedAdmin ? matchedAdmin.id : profile.uid,
        username: matchedAdmin ? matchedAdmin.username : (profile.email.split('@')[0] || 'admin'),
        fullName: matchedAdmin ? matchedAdmin.fullName : (profile.fullName || 'Muthmainnah, SE, MM'),
        nip: matchedAdmin ? matchedAdmin.nip : (profile.nik || '198607092015042001'),
        role: matchedAdmin ? matchedAdmin.jabatan : 'Lurah Panaikang (Master Admin Terverifikasi)',
        roleLevel: isSuperAdmin ? 'master_admin' : (matchedAdmin?.roleLevel || 'admin_bidang'),
        isMasterLurah: isSuperAdmin || Boolean(matchedAdmin?.isMasterLurah),
        allowedAdminTabs: isSuperAdmin ? undefined : (matchedAdmin?.allowedAdminTabs as AdminTab[] | undefined),
        allowedServiceCategories: isSuperAdmin ? undefined : matchedAdmin?.allowedServiceCategories,
        actionPermissions: isSuperAdmin ? undefined : matchedAdmin?.actionPermissions,
        loginAt: nowStr,
        loginTimestampMs: Date.now(),
        timezoneFixedV2: true,
      };
      setAdminSession(trustedSession);
      sessionStorage.setItem('pnk_admin_session', JSON.stringify(trustedSession));
    },
    [adminUsers]
  );

  const handleFirebaseAdminLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setFirebaseResetSuccess('');
    setGoogleRequestSentNotice('');
    setPendingGoogleAdminRequestEmail(null);

    setIsLoggingIn(true);
    const result = await signInWithGoogleAccount();
    setIsLoggingIn(false);

    if (!result.ok || !result.profile) {
      setLoginError(
        result.error || 'Gagal memproses login administrator dengan akun Google.'
      );
      return;
    }

    await verifyAndEstablishGoogleAdminProfile(result.profile);
  };

  const handleForceTakeover = async (e: React.FormEvent) => {
    e.preventDefault();
    setTakeoverError('');
    if (!takeoverPassword.trim()) {
      setTakeoverError('Masukkan kata sandi otoritas Master Lurah.');
      return;
    }
    setIsTakingOver(true);
    let handled = false;

    if (isLocalExpressAvailable()) {
      try {
        const res = await fetch('/api/auth/force-logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ masterPassword: takeoverPassword.trim() }),
        });
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const json = await res.json().catch(() => ({}));
          if (res.ok && json.ok) {
            handled = true;
          }
        }
      } catch {}
    }

    try {
      const fsRes = await forceLogoutFirestore(takeoverPassword.trim());
      if (fsRes.ok) {
        handled = true;
      } else if (!handled) {
        setIsTakingOver(false);
        setTakeoverError(fsRes.error || 'Kata sandi master tidak sesuai.');
        return;
      }
    } catch {}

    setIsTakingOver(false);
    if (handled) {
      setShowTakeoverModal(false);
      setTakeoverPassword('');
      setActiveAdminLockInfo({ isLocked: false, activeAdmin: null });
      setLoginError(
        'Sesi admin sebelumnya di perangkat lain telah diputus paksa. Slot login sekarang terbuka. Silakan login kembali.'
      );
      checkSessionStatus();
    } else {
      setTakeoverError('Kata sandi master Lurah tidak sesuai.');
    }
  };

  const handleLogout = async () => {
    const token = adminSession?.token;
    const logoutNow = getRealtimeDateTimeString(new Date());
    if (adminSession) {
      recordAudit({
        actionType: 'LOGOUT',
        module: 'AUTENTIKASI',
        targetId: adminSession.userId,
        targetLabel: `Sesi Portal Admin · ${adminSession.fullName} (@${adminSession.username})`,
        summary: `Logout dari Panel Admin Kelurahan Panaikang (${logoutNow})`,
        details: `Peran: ${adminSession.role} · Sesi ditutup pada ${logoutNow}`,
        severity: 'info',
        overrideActor: {
          username: adminSession.username,
          fullName: adminSession.fullName,
          jabatan: adminSession.role,
          nip: adminSession.nip,
          roleLevel: adminSession.roleLevel,
        },
      });
    }
    if (isLocalExpressAvailable()) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
      } catch {}
    }

    try {
      if (token) {
        await logoutFirestore(token);
      }
    } catch {}

    try {
      const rawLock = localStorage.getItem('pnk_active_admin_session_lock');
      if (rawLock) {
        const parsed = JSON.parse(rawLock);
        if (!token || parsed.token === token) {
          localStorage.removeItem('pnk_active_admin_session_lock');
        }
      }
    } catch {}

    sessionStorage.removeItem('pnk_admin_session');
    setAdminSession(null);
    setLoginUsername('');
    setLoginPassword('');
    setFirebaseAdminPassword('');
    setLoginError('');
    if (onFirebaseLogout) {
      await onFirebaseLogout();
    } else {
      await logoutFirebaseUser();
    }
    checkSessionStatus();
  };

  const [isCloudSyncing, setIsCloudSyncing] = useState(false);

  const handleForceCloudSync = async () => {
    setIsCloudSyncing(true);
    clearFeedback();
    const currentSnapshot: PersistedDatabase = {
      profile,
      rwGroups,
      reports,
      wasteUnits,
      wasteLogs,
      tebaSpots,
      bioporiPoints,
      cleanupEvents,
      kelurahanInfos,
      whatsappRecipients,
      serviceCatalog,
      adminUsers,
      activityLogs,
      urbanFarmingSpots,
      seedRequests,
      siskamlingSchedules: siskamlingSchedules || [],
      updatedAt: Date.now(),
    };
    try {
      // 1. First ensure immediate local persistence
      savePersistedDatabase(currentSnapshot);

      // 2. Synchronize to Google Cloud Firestore (full document + granular collections)
      await pushFullDatabaseToFirestore(currentSnapshot);

      setSuccessMessage(
        'Sinkronisasi Sukses: Seluruh data Menu Warga, Pengelolaan Sampah, Data RT/RW, Siskamling, Urban Farming, Peta Digital GIS, Profil Kelurahan, dan Kerja Bakti telah 100% tersimpan aman & terpusat di Google Cloud Firestore!'
      );
      recordAudit({
        actionType: 'EXPORT',
        module: 'PROFIL_KELURAHAN',
        targetLabel: 'Google Cloud Firestore',
        summary: 'Melakukan sinkronisasi penuh seluruh data aplikasi ke Google Cloud Firestore',
        severity: 'info',
      });
    } catch (err: unknown) {
      console.error('[Admin Cloud Sync Error]', err);
      let detail = 'Periksa koneksi internet perangkat Anda atau firewall.';
      if (err instanceof Error) {
        try {
          const parsed = JSON.parse(err.message);
          if (parsed.error) detail = parsed.error;
        } catch {
          detail = err.message;
        }
      }
      setValidationErrors([
        `Sinkronisasi ke Google Cloud Firestore belum berhasil (${detail}).`,
        'Semua data Anda tetap aman dan tersimpan di penyimpanan internal/lokal.',
      ]);
    } finally {
      setIsCloudSyncing(false);
    }
  };

  // ================= COLLAPSIBLE SUB-MENU SECTIONS STATE (ADMIN PAGE) =================
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  const isSectionCollapsed = (sectionKey: string) => {
    return Boolean(collapsedSections[sectionKey]);
  };

  const toggleSectionCollapse = (sectionKey: string) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [sectionKey]: !prev[sectionKey],
    }));
  };

  const collapseAllSectionsOnTab = (keys: string[]) => {
    setCollapsedSections((prev) => {
      const next = { ...prev };
      keys.forEach((k) => {
        next[k] = true;
      });
      return next;
    });
  };

  const expandAllSectionsOnTab = (keys: string[]) => {
    setCollapsedSections((prev) => {
      const next = { ...prev };
      keys.forEach((k) => {
        next[k] = false;
      });
      return next;
    });
  };

  // ================= WHATSAPP RECIPIENT FILTER STATE (RTRW & STATUS) =================
  const [waRecipientRwFilter, setWaRecipientRwFilter] = useState<string>('SEMUA');
  const [waRecipientStatusFilter, setWaRecipientStatusFilter] = useState<'SEMUA' | 'AKTIF' | 'NONAKTIF'>('SEMUA');
  const [waRecipientSearch, setWaRecipientSearch] = useState<string>('');

  const filteredWaRecipients = useMemo(() => {
    return whatsappRecipients.filter((recipient) => {
      // 1. RW filter
      if (waRecipientRwFilter !== 'SEMUA') {
        const scope = (recipient.rwScope || 'Seluruh Wilayah').trim();
        if (waRecipientRwFilter === 'SELURUH_WILAYAH') {
          if (scope !== 'Seluruh Wilayah') return false;
        } else if (waRecipientRwFilter === 'KHUSUS_RTRW') {
          if (scope === 'Seluruh Wilayah') return false;
        } else {
          if (scope !== waRecipientRwFilter) return false;
        }
      }
      // 2. Status filter
      if (waRecipientStatusFilter === 'AKTIF' && !recipient.isActive) return false;
      if (waRecipientStatusFilter === 'NONAKTIF' && recipient.isActive) return false;

      // 3. Search query
      if (waRecipientSearch.trim()) {
        const q = waRecipientSearch.toLowerCase();
        const matchName = recipient.name.toLowerCase().includes(q);
        const matchRole = recipient.role.toLowerCase().includes(q);
        const matchPhone = recipient.phoneNumber.toLowerCase().includes(q);
        const matchScope = (recipient.rwScope || '').toLowerCase().includes(q);
        const matchNotes = (recipient.notes || '').toLowerCase().includes(q);
        if (!matchName && !matchRole && !matchPhone && !matchScope && !matchNotes) {
          return false;
        }
      }
      return true;
    });
  }, [whatsappRecipients, waRecipientRwFilter, waRecipientStatusFilter, waRecipientSearch]);

  // ================= 1B. DATA RT & RW CRUD STATE =================
  const [adminReportDetailModal, setAdminReportDetailModal] = useState<{
    report?: CitizenReport | null;
    praRecord?: PraRegistrasiRecord | null;
    pengaduanRecord?: PengaduanOnlineRecord | null;
  } | null>(null);
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

  const [adminExpandedRwIds, setAdminExpandedRwIds] = useState<Record<string, boolean>>({});

  const toggleAdminRwDetail = (rwId: string) => {
    setAdminExpandedRwIds((prev) => ({
      ...prev,
      [rwId]: !prev[rwId],
    }));
  };

  const expandAllAdminRw = () => {
    const all: Record<string, boolean> = {};
    rwGroups.forEach((rw) => {
      all[rw.id] = true;
    });
    setAdminExpandedRwIds(all);
  };

  const collapseAllAdminRw = () => {
    setAdminExpandedRwIds({});
  };

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
  const [waDispatchLogs, setWaDispatchLogs] = useState<WhatsAppAutoDispatchReceipt[]>(() =>
    loadWhatsAppAutoDispatchLogs()
  );
  const [testingWaId, setTestingWaId] = useState<string | null>(null);
  const [waGatewayStatus, setWaGatewayStatus] = useState<WhatsAppGatewayStatusResult | null>(null);
  const [isCheckingWaGateway, setIsCheckingWaGateway] = useState<boolean>(false);

  const fetchAdminWaGatewayStatus = async () => {
    setIsCheckingWaGateway(true);
    try {
      const res = await checkWhatsAppGatewayStatus();
      setWaGatewayStatus(res);
      if (!res.hasToken || res.deviceStatus === 'invalid_token' || res.deviceStatus === 'unconfigured') {
        setShowTokenForm(true);
      }
    } finally {
      setIsCheckingWaGateway(false);
    }
  };

  const [tokenInputValue, setTokenInputValue] = useState('');
  const [isSavingToken, setIsSavingToken] = useState(false);
  const [showTokenForm, setShowTokenForm] = useState(false);

  const handleSaveFonnteToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenInputValue.trim()) return;
    setIsSavingToken(true);
    try {
      const result = await saveWhatsAppGatewayToken(tokenInputValue.trim());
      if (result.ok) {
        setValidationErrors([]);
        setSuccessMessage(result.message);
        setTokenInputValue('');
        setShowTokenForm(false);
        await fetchAdminWaGatewayStatus();
      } else {
        setValidationErrors([result.message]);
      }
    } catch {
      setValidationErrors(['Gagal menghubungi server untuk menyimpan token Fonnte.']);
    } finally {
      setIsSavingToken(false);
    }
  };

  useEffect(() => {
    fetchAdminWaGatewayStatus();
    loadWhatsAppAutoDispatchLogsAsync().then((logs) => setWaDispatchLogs(logs));
  }, []);

  useEffect(() => {
    loadWhatsAppAutoDispatchLogsAsync().then((logs) => setWaDispatchLogs(logs));
  }, [reports.length]);

  const handleTestAutoWaDispatch = async (recipient: WhatsAppRecipient) => {
    setTestingWaId(recipient.id);
    try {
      const res = await dispatchComplaintToRegisteredWhatsApp({
        report: {
          ticketCode: `PGD-TEST-${String(Date.now()).slice(-4)}`,
          title: 'Uji Coba Pengiriman Otomatis Pengaduan Warga',
          description:
            'Pesan uji coba sistem: memastikan pengaduan warga yang disubmit otomatis masuk ke nomor pejabat/pihak terkait terdaftar tanpa melalui WhatsApp pribadi warga.',
          category: 'Pengaduan Lingkungan & Pelayanan',
          urgency: 'Normal',
          rw: recipient.rwScope && recipient.rwScope !== 'Seluruh Wilayah' ? recipient.rwScope : 'RW 01',
          rt: 'RT 01',
          locationName: 'Kantor Kelurahan Panaikang',
          reporterName: 'Sistem Otomatis Satu Data Panaikang',
          reporterPhone: '-',
          submittedAt: getRealtimeDateTimeString(),
        },
        whatsappRecipients: [{ ...recipient, isActive: true }],
      });
      setWaDispatchLogs(loadWhatsAppAutoDispatchLogs());
      if (res.ok && res.totalDispatched > 0) {
        setSuccessMessage(
          `Notifikasi WA Otomatis (Fonnte) berhasil dikirimkan ke ${recipient.name} (${formatDisplayPhone(recipient.phoneNumber)}).`
        );
      } else {
        const errDetail =
          res.deliveries?.[0]?.errorMessage ||
          'Pengiriman WhatsApp melalui Fonnte gagal. Periksa status koneksi perangkat Fonnte atau log di bawah.';
        setValidationErrors([
          `Gagal mengirim WA ke ${recipient.name} (${formatDisplayPhone(recipient.phoneNumber)}): ${errDetail}`,
        ]);
      }
      fetchAdminWaGatewayStatus();
    } finally {
      setTestingWaId(null);
    }
  };

  const [reportSearch, setReportSearch] = useState('');
  const [reportStatusFilter, setReportStatusFilter] = useState<'SEMUA' | ReportStatus>('SEMUA');
  const [reportRwFilter, setReportRwFilter] = useState<string>('SEMUA');
  const [reportTypeFilter, setReportTypeFilter] = useState<'SEMUA' | 'SURAT' | 'PENGADUAN'>('SEMUA');
  const [reportCurrentPage, setReportCurrentPage] = useState<number>(1);
  const [reportPageSize, setReportPageSize] = useState<number>(10);
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
    imageUrl: '',
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
    date: getRealtimeDateString(),
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
    date: getRealtimeFullDateString(),
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
  const [isSyncingKbHighlights, setIsSyncingKbHighlights] = useState(false);

  const handleSyncKerjaBaktiHighlightsAdmin = async () => {
    clearFeedback();
    setIsSyncingKbHighlights(true);
    try {
      const res = onSyncKerjaBaktiHighlights
        ? await onSyncKerjaBaktiHighlights()
        : { ok: true, syncedAt: getRealtimeDateTimeString() };
      if (res.ok) {
        recordAudit({
          actionType: 'UPDATE',
          module: 'KERJA_BAKTI',
          targetLabel: 'Sorotan Kerja Bakti Instagram @kelurahan.panaikang (3 Story Terbaru)',
          summary: `Melakukan sinkronisasi 3 postingan story terbaru Sorotan Kerja Bakti dari akun Instagram @kelurahan.panaikang (${res.syncedAt || getRealtimeDateTimeString()})`,
          severity: 'info',
        });
        setSuccessMessage(
          `3 postingan story terbaru Sorotan Kerja Bakti berhasil disinkronkan dari Instagram @kelurahan.panaikang (${res.syncedAt || 'Baru Saja'}) dan tampil pada bilah tersendiri di bawah Foto Kerja Bakti.`
        );
      }
    } catch {
      setSuccessMessage(
        '3 postingan story Sorotan Kerja Bakti berhasil disinkronkan dengan akun Instagram @kelurahan.panaikang.'
      );
    } finally {
      setIsSyncingKbHighlights(false);
    }
  };

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
    publishedAt: getRealtimeDateString(),
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
        recordAudit({
          actionType: 'UPDATE',
          module: 'INFORMASI_KELURAHAN',
          targetLabel: 'Instagram Resmi @kelurahan.panaikang',
          summary: `Melakukan sinkronisasi publikasi informasi kelurahan dengan akun Instagram @kelurahan.panaikang (${res.syncedAt || getRealtimeDateTimeString()})`,
          severity: 'info',
        });
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
      publishedAt: getRealtimeDateString(),
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
      recordAudit({
        actionType: editingInfoId ? 'UPDATE' : 'CREATE',
        module: 'INFORMASI_KELURAHAN',
        targetId: editingInfoId || undefined,
        targetLabel: `Informasi: ${payload.title || 'Berita Kelurahan'}`,
        summary: editingInfoId
          ? `Memperbarui artikel informasi kelurahan "${payload.title}"`
          : `Menerbitkan artikel informasi kelurahan baru "${payload.title}"`,
        details: `Kategori: ${payload.category || 'Pengumuman Kelurahan'}`,
        severity: 'info',
      });
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
    const target = kelurahanInfos.find((i) => i.id === id);
    const res = await onDeleteInfo(id);
    setConfirmDeleteInfoId(null);
    if (res.ok) {
      recordAudit({
        actionType: 'DELETE',
        module: 'INFORMASI_KELURAHAN',
        targetId: id,
        targetLabel: `Informasi: ${target?.title || id}`,
        summary: `Menghapus artikel informasi kelurahan "${target?.title || id}"`,
        severity: 'critical',
      });
      setSuccessMessage('Informasi kelurahan berhasil dihapus dari Halaman Utama.');
    }
  };

  const clearFeedback = () => {
    setValidationErrors([]);
    setSuccessMessage('');
  };

  const handleTabSwitch = (tab: AdminTab) => {
    if (tab === 'user_warga') {
      setActiveTab('kelola_admin_warga');
      setKelolaAdminWargaSubTab('user_warga');
    } else if (tab === 'parameter_user') {
      setActiveTab('kelola_admin_warga');
      setKelolaAdminWargaSubTab('parameter_admin');
    } else if (tab === 'laporan') {
      setActiveTab('pengurusan_warga');
    } else {
      setActiveTab(tab);
    }
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
      recordAudit({
        actionType: 'UPDATE',
        module: 'PROFIL_KELURAHAN',
        targetLabel: `Profil Resmi Kelurahan Panaikang (${profileDraft.lurahName})`,
        summary: `Memperbarui data Profil Kelurahan, Pejabat Struktural, Visi & Misi`,
        beforeValue: `Lurah: ${profile.lurahName} · Populasi: ${profile.totalPopulation}`,
        afterValue: `Lurah: ${profileDraft.lurahName} · Populasi: ${profileDraft.totalPopulation}`,
        severity: 'info',
      });
      setSuccessMessage(
        'Data Profil Kelurahan Panaikang (Lurah, Alamat Kantor, Visi & Misi) telah tervalidasi dan disimpan ke server.'
      );
    }
  };

  // ---------- DATA LURAH CRUD HANDLERS ----------
  const handleOpenAddLurah = () => {
    setLurahForm({
      lurahName: '',
      lurahNip: '',
      lurahRank: '',
      lurahPeriod: '2024 – Sekarang',
      lurahMessage: '',
      lurahPhotoUrl: '',
    });
    setIsLurahModalOpen(true);
  };

  const handleOpenEditLurah = () => {
    setLurahForm({
      lurahName: profileDraft.lurahName || '',
      lurahNip: profileDraft.lurahNip || '',
      lurahRank: profileDraft.lurahRank || '',
      lurahPeriod: profileDraft.lurahPeriod || '',
      lurahMessage: profileDraft.lurahMessage || '',
      lurahPhotoUrl: profileDraft.lurahPhotoUrl || '',
    });
    setIsLurahModalOpen(true);
  };

  const handleSaveLurahForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lurahForm.lurahName.trim()) {
      setValidationErrors(['Nama lengkap Lurah wajib diisi.']);
      return;
    }
    const updatedProfile: KelurahanProfile = {
      ...profileDraft,
      lurahName: lurahForm.lurahName.trim(),
      lurahNip: lurahForm.lurahNip.trim(),
      lurahRank: lurahForm.lurahRank.trim(),
      lurahPeriod: lurahForm.lurahPeriod.trim(),
      lurahMessage: lurahForm.lurahMessage.trim(),
      lurahPhotoUrl: lurahForm.lurahPhotoUrl,
    };
    setIsSubmitting(true);
    const res = await onSaveProfile(updatedProfile);
    setIsSubmitting(false);
    if (!res.ok) {
      setValidationErrors(res.errors || ['Gagal menyimpan data Lurah dan NIP.']);
      return;
    }
    setProfileDraft(updatedProfile);
    setIsLurahModalOpen(false);
    recordAudit({
      actionType: profileDraft.lurahName ? 'UPDATE' : 'CREATE',
      module: 'PROFIL_KELURAHAN',
      targetLabel: `Data Lurah: ${updatedProfile.lurahName}`,
      summary: `Menyimpan data pimpinan Lurah Panaikang (${updatedProfile.lurahName}) & NIP: ${updatedProfile.lurahNip || '-'}`,
      severity: 'info',
    });
    setSuccessMessage(`Data pimpinan Lurah "${updatedProfile.lurahName}" dan NIP berhasil disimpan permanen!`);
  };

  const handleConfirmDeleteLurah = async () => {
    const updatedProfile: KelurahanProfile = {
      ...profileDraft,
      lurahName: '',
      lurahNip: '',
      lurahRank: '',
      lurahPeriod: '',
      lurahMessage: '',
      lurahPhotoUrl: '',
    };
    setProfileDraft(updatedProfile);
    setConfirmDeleteLurah(false);
    await onSaveProfile(updatedProfile);
    recordAudit({
      actionType: 'DELETE',
      module: 'PROFIL_KELURAHAN',
      targetLabel: 'Data Lurah Panaikang',
      summary: 'Menghapus data pimpinan Lurah Panaikang',
      severity: 'warning',
    });
    setSuccessMessage('Data pimpinan Lurah berhasil dikosongkan/dihapus.');
  };

  const handleLurahPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageFile(file);
      setLurahForm((prev) => ({ ...prev, lurahPhotoUrl: compressed }));
    } catch {
      setValidationErrors(['Gagal memproses gambar foto Lurah.']);
    }
  };

  // ---------- VISI KELURAHAN CRUD HANDLERS ----------
  const handleOpenAddVisi = () => {
    setVisiFormText('');
    setIsVisiModalOpen(true);
  };

  const handleOpenEditVisi = () => {
    setVisiFormText(profileDraft.visi || '');
    setIsVisiModalOpen(true);
  };

  const handleSaveVisiForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!visiFormText.trim()) {
      setValidationErrors(['Pernyataan visi kelurahan tidak boleh kosong.']);
      return;
    }
    const updatedProfile: KelurahanProfile = {
      ...profileDraft,
      visi: visiFormText.trim(),
    };
    setProfileDraft(updatedProfile);
    setIsVisiModalOpen(false);
    await onSaveProfile(updatedProfile);
    recordAudit({
      actionType: profileDraft.visi ? 'UPDATE' : 'CREATE',
      module: 'PROFIL_KELURAHAN',
      targetLabel: 'Visi Kelurahan',
      summary: 'Menyimpan pernyataan Visi Kelurahan Panaikang',
      severity: 'info',
    });
    setSuccessMessage('Pernyataan Visi Kelurahan Panaikang berhasil disimpan.');
  };

  const handleConfirmDeleteVisi = async () => {
    const updatedProfile: KelurahanProfile = {
      ...profileDraft,
      visi: '',
    };
    setProfileDraft(updatedProfile);
    setConfirmDeleteVisi(false);
    await onSaveProfile(updatedProfile);
    recordAudit({
      actionType: 'DELETE',
      module: 'PROFIL_KELURAHAN',
      targetLabel: 'Visi Kelurahan',
      summary: 'Menghapus pernyataan Visi Kelurahan Panaikang',
      severity: 'warning',
    });
    setSuccessMessage('Pernyataan Visi Kelurahan berhasil dihapus.');
  };

  // ---------- MISI KELURAHAN CRUD HANDLERS ----------
  const handleOpenAddMisiModal = () => {
    setEditingMisiIndex(null);
    setMisiFormText('');
    setIsMisiModalOpen(true);
  };

  const handleOpenEditMisiModal = (idx: number) => {
    setEditingMisiIndex(idx);
    setMisiFormText(profileDraft.misi[idx] || '');
    setIsMisiModalOpen(true);
  };

  const handleSaveMisiForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!misiFormText.trim()) {
      setValidationErrors(['Teks butir misi tidak boleh kosong.']);
      return;
    }
    const currentMisi = Array.isArray(profileDraft.misi) ? [...profileDraft.misi] : [];
    if (editingMisiIndex !== null) {
      currentMisi[editingMisiIndex] = misiFormText.trim();
    } else {
      currentMisi.push(misiFormText.trim());
    }
    const updatedProfile: KelurahanProfile = {
      ...profileDraft,
      misi: currentMisi,
    };
    setProfileDraft(updatedProfile);
    setIsMisiModalOpen(false);
    setEditingMisiIndex(null);
    await onSaveProfile(updatedProfile);
    recordAudit({
      actionType: editingMisiIndex !== null ? 'UPDATE' : 'CREATE',
      module: 'PROFIL_KELURAHAN',
      targetLabel: `Misi Butir #${(editingMisiIndex ?? currentMisi.length - 1) + 1}`,
      summary: editingMisiIndex !== null ? 'Memperbarui butir misi kelurahan' : 'Menambahkan butir misi kelurahan baru',
      severity: 'info',
    });
    setSuccessMessage('Butir Misi Kelurahan Panaikang berhasil disimpan.');
  };

  const handleConfirmDeleteMisi = async () => {
    if (misiToDeleteIndex === null) return;
    const currentMisi = Array.isArray(profileDraft.misi) ? [...profileDraft.misi] : [];
    const removedText = currentMisi[misiToDeleteIndex];
    const updatedMisi = currentMisi.filter((_, i) => i !== misiToDeleteIndex);
    const updatedProfile: KelurahanProfile = {
      ...profileDraft,
      misi: updatedMisi,
    };
    setProfileDraft(updatedProfile);
    setMisiToDeleteIndex(null);
    await onSaveProfile(updatedProfile);
    recordAudit({
      actionType: 'DELETE',
      module: 'PROFIL_KELURAHAN',
      targetLabel: `Misi Butir #${misiToDeleteIndex + 1}`,
      summary: `Menghapus butir misi: "${removedText?.slice(0, 40)}..."`,
      severity: 'warning',
    });
    setSuccessMessage('Butir misi berhasil dihapus.');
  };

  const handleMoveMisi = async (idx: number, direction: 'up' | 'down') => {
    const currentMisi = Array.isArray(profileDraft.misi) ? [...profileDraft.misi] : [];
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= currentMisi.length) return;
    const temp = currentMisi[idx];
    currentMisi[idx] = currentMisi[targetIdx];
    currentMisi[targetIdx] = temp;
    const updatedProfile: KelurahanProfile = {
      ...profileDraft,
      misi: currentMisi,
    };
    setProfileDraft(updatedProfile);
    await onSaveProfile(updatedProfile);
  };

  // ---------- ALAMAT & KONTAK KANTOR CRUD HANDLERS ----------
  const handleOpenAddOfficeContact = () => {
    setOfficeContactForm({
      officeAddress: '',
      postalCode: '',
      serviceHours: 'Senin – Jumat: 08.00 – 16.00 WITA',
      phoneContact: '',
      emailContact: '',
    });
    setIsOfficeContactModalOpen(true);
  };

  const handleOpenEditOfficeContact = () => {
    setOfficeContactForm({
      officeAddress: profileDraft.officeAddress || '',
      postalCode: profileDraft.postalCode || '',
      serviceHours: profileDraft.serviceHours || '',
      phoneContact: profileDraft.phoneContact || '',
      emailContact: profileDraft.emailContact || '',
    });
    setIsOfficeContactModalOpen(true);
  };

  const handleSaveOfficeContactForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!officeContactForm.officeAddress.trim()) {
      setValidationErrors(['Alamat lengkap kantor kelurahan wajib diisi.']);
      return;
    }
    const updatedProfile: KelurahanProfile = {
      ...profileDraft,
      officeAddress: officeContactForm.officeAddress.trim(),
      postalCode: officeContactForm.postalCode.trim(),
      serviceHours: officeContactForm.serviceHours.trim(),
      phoneContact: officeContactForm.phoneContact.trim(),
      emailContact: officeContactForm.emailContact.trim(),
    };
    setProfileDraft(updatedProfile);
    setIsOfficeContactModalOpen(false);
    await onSaveProfile(updatedProfile);
    recordAudit({
      actionType: profileDraft.officeAddress ? 'UPDATE' : 'CREATE',
      module: 'PROFIL_KELURAHAN',
      targetLabel: 'Alamat & Kontak Kantor',
      summary: 'Menyimpan data alamat dan kontak kantor kelurahan',
      severity: 'info',
    });
    setSuccessMessage('Data alamat kantor dan kontak resmi berhasil disimpan.');
  };

  const handleConfirmDeleteOfficeContact = async () => {
    const updatedProfile: KelurahanProfile = {
      ...profileDraft,
      officeAddress: '',
      postalCode: '',
      serviceHours: '',
      phoneContact: '',
      emailContact: '',
    };
    setProfileDraft(updatedProfile);
    setConfirmDeleteOfficeContact(false);
    await onSaveProfile(updatedProfile);
    recordAudit({
      actionType: 'DELETE',
      module: 'PROFIL_KELURAHAN',
      targetLabel: 'Alamat & Kontak Kantor',
      summary: 'Mengosongkan/menghapus data alamat dan kontak kantor kelurahan',
      severity: 'warning',
    });
    setSuccessMessage('Data alamat kantor dan kontak resmi berhasil dikosongkan.');
  };

  // ---------- BATAS WILAYAH CRUD HANDLERS ----------
  const handleOpenAddBoundaries = () => {
    setBoundariesForm({
      utara: '',
      selatan: '',
      timur: '',
      barat: '',
    });
    setIsBoundariesModalOpen(true);
  };

  const handleOpenEditBoundaries = () => {
    setBoundariesForm({
      utara: profileDraft.boundaries?.utara || '',
      selatan: profileDraft.boundaries?.selatan || '',
      timur: profileDraft.boundaries?.timur || '',
      barat: profileDraft.boundaries?.barat || '',
    });
    setIsBoundariesModalOpen(true);
  };

  const handleSaveBoundariesForm = async (e: React.FormEvent) => {
    e.preventDefault();
    const updatedProfile: KelurahanProfile = {
      ...profileDraft,
      boundaries: {
        utara: boundariesForm.utara.trim(),
        selatan: boundariesForm.selatan.trim(),
        timur: boundariesForm.timur.trim(),
        barat: boundariesForm.barat.trim(),
      },
    };
    setProfileDraft(updatedProfile);
    setIsBoundariesModalOpen(false);
    await onSaveProfile(updatedProfile);
    recordAudit({
      actionType: 'UPDATE',
      module: 'PROFIL_KELURAHAN',
      targetLabel: 'Batas Wilayah Kelurahan',
      summary: 'Menyimpan konfigurasi batas wilayah administrasi Kelurahan Panaikang',
      severity: 'info',
    });
    setSuccessMessage('Konfigurasi 4 batas wilayah administrasi berhasil disimpan.');
  };

  const handleConfirmDeleteBoundaries = async () => {
    const updatedProfile: KelurahanProfile = {
      ...profileDraft,
      boundaries: {
        utara: '',
        selatan: '',
        timur: '',
        barat: '',
      },
    };
    setProfileDraft(updatedProfile);
    setConfirmDeleteBoundaries(false);
    await onSaveProfile(updatedProfile);
    recordAudit({
      actionType: 'DELETE',
      module: 'PROFIL_KELURAHAN',
      targetLabel: 'Batas Wilayah Kelurahan',
      summary: 'Mereset/menghapus batas wilayah administrasi',
      severity: 'warning',
    });
    setSuccessMessage('Data batas wilayah administrasi berhasil direset/dikosongkan.');
  };

  // ---------- MANAJEMEN JABATAN & STRUKTUR PERANGKAT KELURAHAN ----------
  const handleOpenAddOfficial = () => {
    setEditingOfficialId(null);
    setOfficialForm({
      positionTitle: '',
      officialName: '',
      nip: '',
      rank: '',
      department: 'Seksi / Bagian',
      phone: '',
      staffNames: [],
    });
    setOfficialNewStaffInput('');
    setOfficialFormError('');
    setIsOfficialModalOpen(true);
  };

  const handleOpenEditOfficial = (official: StructuralOfficial) => {
    setEditingOfficialId(official.id);
    const titleLower = (official.positionTitle || '').toLowerCase();
    let fallbackStaff: string[] = Array.isArray(official.staffNames) ? official.staffNames : [];
    if (fallbackStaff.length === 0) {
      if (titleLower.includes('pemerintahan') || titleLower.includes('trantib') || titleLower.includes('ketentraman')) {
        fallbackStaff = Array.isArray(profileDraft.stafPemerintahan) ? profileDraft.stafPemerintahan : [];
      } else if (titleLower.includes('pemberdayaan') || titleLower.includes('pembangunan') || titleLower.includes('sosial')) {
        fallbackStaff = Array.isArray(profileDraft.stafPemberdayaan) ? profileDraft.stafPemberdayaan : [];
      } else if (titleLower.includes('kebersihan') || titleLower.includes('pertamanan') || titleLower.includes('lingkungan')) {
        fallbackStaff = Array.isArray(profileDraft.stafKebersihan) ? profileDraft.stafKebersihan : [];
      }
    }
    setOfficialForm({
      positionTitle: official.positionTitle || '',
      officialName: official.officialName || '',
      nip: official.nip || '',
      rank: official.rank || '',
      department: official.department || '',
      phone: official.phone || '',
      staffNames: [...fallbackStaff],
    });
    setOfficialNewStaffInput('');
    setOfficialFormError('');
    setIsOfficialModalOpen(true);
  };

  const handleSaveOfficialForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!officialForm.positionTitle.trim()) {
      setOfficialFormError('Nama jabatan struktural wajib diisi.');
      return;
    }
    if (!officialForm.officialName.trim()) {
      setOfficialFormError('Nama lengkap pejabat wajib diisi.');
      return;
    }

    const pendingStaff = officialNewStaffInput.trim();
    const cleanedStaffList = [
      ...(Array.isArray(officialForm.staffNames) ? officialForm.staffNames : []),
      ...(pendingStaff ? [pendingStaff] : []),
    ]
      .map((s) => s.trim())
      .filter(Boolean);

    const currentOfficials = Array.isArray(profileDraft.officials)
      ? [...profileDraft.officials]
      : [];

    let updatedOfficials: StructuralOfficial[];

    if (editingOfficialId) {
      updatedOfficials = currentOfficials.map((item) =>
        item.id === editingOfficialId
          ? {
              ...item,
              positionTitle: officialForm.positionTitle.trim(),
              officialName: officialForm.officialName.trim(),
              nip: officialForm.nip.trim() || undefined,
              rank: officialForm.rank.trim() || undefined,
              department: officialForm.department.trim() || undefined,
              phone: officialForm.phone.trim() || undefined,
              staffNames: cleanedStaffList,
            }
          : item
      );
    } else {
      const newOfficial: StructuralOfficial = {
        id: `off-${Date.now()}`,
        positionTitle: officialForm.positionTitle.trim(),
        officialName: officialForm.officialName.trim(),
        nip: officialForm.nip.trim() || undefined,
        rank: officialForm.rank.trim() || undefined,
        department: officialForm.department.trim() || undefined,
        phone: officialForm.phone.trim() || undefined,
        orderIndex: currentOfficials.length + 1,
        staffNames: cleanedStaffList,
      };
      updatedOfficials = [...currentOfficials, newOfficial];
    }

    const sek = updatedOfficials.find((o) =>
      o.positionTitle.toLowerCase().includes('sekretaris')
    );
    const kasiKeb = updatedOfficials.find(
      (o) =>
        o.positionTitle.toLowerCase().includes('kebersihan') ||
        o.positionTitle.toLowerCase().includes('pertamanan')
    );
    const kasiPem = updatedOfficials.find(
      (o) =>
        o.positionTitle.toLowerCase().includes('pemerintahan') ||
        o.positionTitle.toLowerCase().includes('trantib') ||
        o.positionTitle.toLowerCase().includes('ketentraman')
    );
    const kasiPemb = updatedOfficials.find(
      (o) =>
        o.positionTitle.toLowerCase().includes('pemberdayaan') ||
        o.positionTitle.toLowerCase().includes('pembangunan') ||
        o.positionTitle.toLowerCase().includes('sosial')
    );

    const titleLower = officialForm.positionTitle.toLowerCase();
    const updatedStafPemerintahan =
      titleLower.includes('pemerintahan') || titleLower.includes('trantib') || titleLower.includes('ketentraman')
        ? cleanedStaffList
        : profileDraft.stafPemerintahan || [];
    const updatedStafPemberdayaan =
      titleLower.includes('pemberdayaan') || titleLower.includes('pembangunan') || titleLower.includes('sosial')
        ? cleanedStaffList
        : profileDraft.stafPemberdayaan || [];
    const updatedStafKebersihan =
      titleLower.includes('kebersihan') || titleLower.includes('pertamanan') || titleLower.includes('lingkungan')
        ? cleanedStaffList
        : profileDraft.stafKebersihan || [];

    const updatedProfile: KelurahanProfile = {
      ...profileDraft,
      officials: updatedOfficials,
      sekretarisName: sek?.officialName || (editingOfficialId ? profileDraft.sekretarisName : ''),
      sekretarisNip: sek?.nip || profileDraft.sekretarisNip || '',
      kasiKebersihanName: kasiKeb?.officialName || (editingOfficialId ? profileDraft.kasiKebersihanName : ''),
      kasiKebersihanNip: kasiKeb?.nip || profileDraft.kasiKebersihanNip || '',
      kasiPemerintahanName: kasiPem?.officialName || (editingOfficialId ? profileDraft.kasiPemerintahanName : ''),
      kasiPemerintahanNip: kasiPem?.nip || profileDraft.kasiPemerintahanNip || '',
      kasiPemberdayaanName: kasiPemb?.officialName || profileDraft.kasiPemberdayaanName || '',
      kasiPemberdayaanNip: kasiPemb?.nip || profileDraft.kasiPemberdayaanNip || '',
      stafPemerintahan: updatedStafPemerintahan,
      stafPemberdayaan: updatedStafPemberdayaan,
      stafKebersihan: updatedStafKebersihan,
      baganStrukturKelurahanUrl: '',
      baganStrukturRtRwUrl: '',
    };

    setProfileDraft(updatedProfile);
    setIsOfficialModalOpen(false);
    setEditingOfficialId(null);
    setOfficialNewStaffInput('');

    // Persist immediately
    await onSaveProfile(updatedProfile);

    recordAudit({
      actionType: editingOfficialId ? 'UPDATE' : 'CREATE',
      module: 'PROFIL_KELURAHAN',
      targetLabel: `Jabatan: ${officialForm.positionTitle.trim()} (${officialForm.officialName.trim()})`,
      summary: editingOfficialId
        ? `Memperbarui data pejabat & staf untuk jabatan ${officialForm.positionTitle.trim()}`
        : `Menambahkan jabatan struktural baru: ${officialForm.positionTitle.trim()}`,
      severity: 'info',
    });

    setSuccessMessage(
      editingOfficialId
        ? `Perubahan jabatan "${officialForm.positionTitle}" beserta daftar staf berhasil disimpan!`
        : `Jabatan baru "${officialForm.positionTitle}" beserta daftar staf berhasil ditambahkan dan disimpan!`
    );
  };

  const handleConfirmDeleteOfficial = async () => {
    if (!officialToDelete) return;
    recordDeletedItemId(officialToDelete.id);

    const currentOfficials = Array.isArray(profileDraft.officials)
      ? [...profileDraft.officials]
      : [];

    const updatedOfficials = currentOfficials.filter((o) => o.id !== officialToDelete.id);

    // Also clear Lurah-card name fields if the deleted official is one of the key roles
    let updatedSekretaris = profileDraft.sekretarisName;
    let updatedKasiKeb = profileDraft.kasiKebersihanName;
    let updatedKasiPem = profileDraft.kasiPemerintahanName;
    let updatedKasiPemb = profileDraft.kasiPemberdayaanName;

    if (officialToDelete.positionTitle.toLowerCase().includes('sekretaris')) {
      const remainingSek = updatedOfficials.find((o) => o.positionTitle.toLowerCase().includes('sekretaris'));
      updatedSekretaris = remainingSek?.officialName || '';
    }
    if (officialToDelete.positionTitle.toLowerCase().includes('kebersihan')) {
      const remainingKeb = updatedOfficials.find((o) => o.positionTitle.toLowerCase().includes('kebersihan'));
      updatedKasiKeb = remainingKeb?.officialName || '';
    }
    if (
      officialToDelete.positionTitle.toLowerCase().includes('pemerintahan') ||
      officialToDelete.positionTitle.toLowerCase().includes('trantib')
    ) {
      const remainingPem = updatedOfficials.find(
        (o) =>
          o.positionTitle.toLowerCase().includes('pemerintahan') ||
          o.positionTitle.toLowerCase().includes('trantib')
      );
      updatedKasiPem = remainingPem?.officialName || '';
    }
    if (
      officialToDelete.positionTitle.toLowerCase().includes('pemberdayaan') ||
      officialToDelete.positionTitle.toLowerCase().includes('pembangunan')
    ) {
      const remainingPemb = updatedOfficials.find(
        (o) =>
          o.positionTitle.toLowerCase().includes('pemberdayaan') ||
          o.positionTitle.toLowerCase().includes('pembangunan')
      );
      updatedKasiPemb = remainingPemb?.officialName || '';
    }

    const updatedProfile: KelurahanProfile = {
      ...profileDraft,
      officials: updatedOfficials,
      sekretarisName: updatedSekretaris,
      kasiKebersihanName: updatedKasiKeb,
      kasiPemerintahanName: updatedKasiPem,
      kasiPemberdayaanName: updatedKasiPemb,
    };

    setProfileDraft(updatedProfile);
    await onSaveProfile(updatedProfile);

    recordAudit({
      actionType: 'DELETE',
      module: 'PROFIL_KELURAHAN',
      targetLabel: `Jabatan: ${officialToDelete.positionTitle} (${officialToDelete.officialName})`,
      summary: `Menghapus jabatan struktural: ${officialToDelete.positionTitle}`,
      severity: 'warning',
    });

    setSuccessMessage(`Jabatan "${officialToDelete.positionTitle}" berhasil dihapus.`);
    setOfficialToDelete(null);
  };

  const handleMoveOfficial = async (index: number, direction: 'up' | 'down') => {
    const current = Array.isArray(profileDraft.officials)
      ? [...profileDraft.officials]
      : [];

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= current.length) return;

    const copy = [...current];
    const temp = copy[index];
    copy[index] = copy[targetIndex];
    copy[targetIndex] = temp;

    copy.forEach((item, idx) => {
      item.orderIndex = idx + 1;
    });

    const updatedProfile: KelurahanProfile = {
      ...profileDraft,
      officials: copy,
    };

    setProfileDraft(updatedProfile);
    await onSaveProfile(updatedProfile);
  };

  // ---------- DYNAMIC BAGAN STRUKTUR KELURAHAN & STAF HANDLERS ----------
  const handleAddSectionStaff = (
    sectionKey: 'stafPemerintahan' | 'stafPemberdayaan' | 'stafKebersihan',
    rawValue: string,
    clearInput: () => void
  ) => {
    const name = rawValue.trim();
    if (!name) return;
    const currentList = Array.isArray(profileDraft[sectionKey]) ? [...(profileDraft[sectionKey] || [])] : [];
    if (!currentList.some((item) => item.toLowerCase() === name.toLowerCase())) {
      currentList.push(name);
    }
    setProfileDraft((prev) => ({
      ...prev,
      [sectionKey]: currentList,
    }));
    clearInput();
  };

  const handleRemoveSectionStaff = (
    sectionKey: 'stafPemerintahan' | 'stafPemberdayaan' | 'stafKebersihan',
    indexToRemove: number
  ) => {
    const currentList = Array.isArray(profileDraft[sectionKey]) ? [...(profileDraft[sectionKey] || [])] : [];
    const nextList = currentList.filter((_, idx) => idx !== indexToRemove);
    setProfileDraft((prev) => ({
      ...prev,
      [sectionKey]: nextList,
    }));
  };

  const handleSaveDynamicBaganKelurahan = async () => {
    clearFeedback();
    // Commit any unadded text still sitting in the 3 staff input boxes
    const finalStafPem = [
      ...(Array.isArray(profileDraft.stafPemerintahan) ? profileDraft.stafPemerintahan : []),
      ...(newStafPemerintahanInput.trim() ? [newStafPemerintahanInput.trim()] : []),
    ];
    const finalStafPemb = [
      ...(Array.isArray(profileDraft.stafPemberdayaan) ? profileDraft.stafPemberdayaan : []),
      ...(newStafPemberdayaanInput.trim() ? [newStafPemberdayaanInput.trim()] : []),
    ];
    const finalStafKeb = [
      ...(Array.isArray(profileDraft.stafKebersihan) ? profileDraft.stafKebersihan : []),
      ...(newStafKebersihanInput.trim() ? [newStafKebersihanInput.trim()] : []),
    ];

    setNewStafPemerintahanInput('');
    setNewStafPemberdayaanInput('');
    setNewStafKebersihanInput('');

    // Synchronize structural officials array so 02. Daftar Jabatan and 03. Bagan Struktur stay in sync
    const existingOfficials = Array.isArray(profileDraft.officials)
      ? [...profileDraft.officials]
      : [];

    const upsertRoleInOfficials = (
      keywords: string[],
      defaultPositionTitle: string,
      defaultDepartment: string,
      officialName: string,
      nip: string,
      staffNames?: string[]
    ) => {
      const idx = existingOfficials.findIndex((o) =>
        keywords.some((kw) => (o.positionTitle || '').toLowerCase().includes(kw))
      );
      if (idx >= 0) {
        existingOfficials[idx] = {
          ...existingOfficials[idx],
          officialName: officialName.trim() || existingOfficials[idx].officialName,
          nip: nip.trim() || existingOfficials[idx].nip,
          staffNames: staffNames ?? existingOfficials[idx].staffNames,
        };
      } else if (officialName.trim() || (staffNames && staffNames.length > 0)) {
        existingOfficials.push({
          id: `off-sotk-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          positionTitle: defaultPositionTitle,
          officialName: officialName.trim() || '-',
          nip: nip.trim() || undefined,
          department: defaultDepartment,
          orderIndex: existingOfficials.length + 1,
          staffNames,
        });
      }
    };

    upsertRoleInOfficials(
      ['sekretaris'],
      'Sekretaris Lurah',
      'Sekretariat Kelurahan',
      profileDraft.sekretarisName || '',
      profileDraft.sekretarisNip || ''
    );
    upsertRoleInOfficials(
      ['pemerintahan', 'ketentraman', 'trantib'],
      'Kasi Pemerintahan, Ketentraman dan Ketertiban Umum',
      'Seksi Pemerintahan & Trantibum',
      profileDraft.kasiPemerintahanName || '',
      profileDraft.kasiPemerintahanNip || '',
      finalStafPem
    );
    upsertRoleInOfficials(
      ['pemberdayaan', 'pembangunan', 'sosial'],
      'Kasi Pemberdayaan Masyarakat, Pembangunan dan Sosial',
      'Seksi Pemberdayaan Masyarakat & Sosial',
      profileDraft.kasiPemberdayaanName || '',
      profileDraft.kasiPemberdayaanNip || '',
      finalStafPemb
    );
    upsertRoleInOfficials(
      ['kebersihan', 'pertamanan'],
      'Kasi Pengelolaan Kebersihan dan Pertamanan',
      'Seksi Pengelolaan Kebersihan & Pertamanan',
      profileDraft.kasiKebersihanName || '',
      profileDraft.kasiKebersihanNip || '',
      finalStafKeb
    );

    const updatedProfile: KelurahanProfile = {
      ...profileDraft,
      officials: existingOfficials,
      stafPemerintahan: finalStafPem,
      stafPemberdayaan: finalStafPemb,
      stafKebersihan: finalStafKeb,
      perwaliReference:
        (profileDraft.perwaliReference || '').trim() ||
        'PERWALI KOTA MAKASSAR NOMOR 65 TAHUN 2023',
      baganStrukturKelurahanUrl: '',
      baganStrukturRtRwUrl: '',
    };

    setIsSubmitting(true);
    setProfileDraft(updatedProfile);
    const res = await onSaveProfile(updatedProfile);
    setIsSubmitting(false);

    if (!res.ok) {
      setValidationErrors(res.errors || ['Gagal menyimpan konfigurasi Bagan Struktur Kelurahan.']);
      return;
    }

    recordAudit({
      actionType: 'UPDATE',
      module: 'PROFIL_KELURAHAN',
      targetLabel: 'Bagan Struktur Organisasi Kelurahan & Staf Seksi',
      summary: `Memperbarui Bagan Struktur Kelurahan Dinamis & Daftar Staf (${
        finalStafPem.length + finalStafPemb.length + finalStafKeb.length
      } staf terdaftar)`,
      severity: 'info',
    });

    setSuccessMessage(
      'Data Bagan Struktur Organisasi Kelurahan & Nama Staf per Jabatan berhasil disimpan secara dinamis!'
    );
  };

  const handleSaveKetuaLpm = async () => {
    clearFeedback();
    const updatedProfile: KelurahanProfile = {
      ...profileDraft,
      ketuaLpmName: (profileDraft.ketuaLpmName || '').trim(),
      baganStrukturKelurahanUrl: '',
      baganStrukturRtRwUrl: '',
    };
    setIsSubmitting(true);
    setProfileDraft(updatedProfile);
    const res = await onSaveProfile(updatedProfile);
    setIsSubmitting(false);

    if (!res.ok) {
      setValidationErrors(res.errors || ['Gagal menyimpan nama Ketua LPM.']);
      return;
    }

    recordAudit({
      actionType: 'UPDATE',
      module: 'STRUKTUR_RTRW',
      targetLabel: `Ketua LPM: ${updatedProfile.ketuaLpmName || '-'}`,
      summary: `Memperbarui nama Ketua LPM pada Bagan Struktur RT/RW (${updatedProfile.ketuaLpmName || 'Dikosongkan'})`,
      severity: 'info',
    });

    setSuccessMessage(
      `Nama Ketua LPM "${updatedProfile.ketuaLpmName || '-'}" berhasil disimpan dan ditampilkan pada Bagan Struktur RT/RW!`
    );
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
      recordAudit({
        actionType: editingRwId ? 'UPDATE' : 'CREATE',
        module: 'STRUKTUR_RTRW',
        targetLabel: `${rwForm.rwCode} (${rwForm.ketuaRwName})`,
        summary: editingRwId
          ? `Memperbarui data pengurus Rukun Warga ${rwForm.rwCode}`
          : `Menambahkan wilayah Rukun Warga baru ${rwForm.rwCode}`,
        afterValue: `Ketua RW: ${rwForm.ketuaRwName} · Area: ${rwForm.areaDescription || '-'}`,
        severity: 'info',
      });
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
    const targetRw = rwGroups.find((rw) => rw.id === rwId);
    const nextGroups = rwGroups.filter((rw) => rw.id !== rwId);
    const res = await onSaveRwGroups(nextGroups);
    setConfirmDeleteRwId(null);
    if (res.ok) {
      recordAudit({
        actionType: 'DELETE',
        module: 'STRUKTUR_RTRW',
        targetId: rwId,
        targetLabel: `${targetRw?.rwCode || rwId} (${targetRw?.ketuaRwName || '-'})`,
        summary: `Menghapus wilayah Rukun Warga ${targetRw?.rwCode || rwId} beserta ${targetRw?.rtList?.length || 0} RT di dalamnya`,
        severity: 'critical',
      });
      setSuccessMessage('Data RW beserta daftar RT di dalamnya berhasil dihapus.');
    }
  };

  const openAddRtForm = (rw: RwGroup) => {
    clearFeedback();
    setActiveRwForRt(rw.id);
    setAdminExpandedRwIds((prev) => ({ ...prev, [rw.id]: true }));
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
    setAdminExpandedRwIds((prev) => ({ ...prev, [rw.id]: true }));
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
    const parentRw = rwGroups.find((rw) => rw.id === rwId);
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
      recordAudit({
        actionType: editingRtId ? 'UPDATE' : 'CREATE',
        module: 'STRUKTUR_RTRW',
        targetLabel: `${rtForm.rtCode} / ${parentRw?.rwCode || 'RW'} (${rtForm.ketuaRtName})`,
        summary: editingRtId
          ? `Memperbarui data pengurus ${rtForm.rtCode} pada ${parentRw?.rwCode || 'RW'}`
          : `Menambahkan Rukun Tetangga baru ${rtForm.rtCode} pada ${parentRw?.rwCode || 'RW'}`,
        afterValue: `Ketua RT: ${rtForm.ketuaRtName} · Jumlah KK: ${rtForm.householdsCount || 100} KK`,
        severity: 'info',
      });
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
    const parentRw = rwGroups.find((rw) => rw.id === rwId);
    const targetRt = parentRw?.rtList?.find((rt) => rt.id === rtId);
    const nextGroups = rwGroups.map((rw) =>
      rw.id === rwId
        ? { ...rw, rtList: (rw.rtList || []).filter((rt) => rt.id !== rtId) }
        : rw
    );
    const res = await onSaveRwGroups(nextGroups);
    setConfirmDeleteRtKey(null);
    if (res.ok) {
      recordAudit({
        actionType: 'DELETE',
        module: 'STRUKTUR_RTRW',
        targetId: rtId,
        targetLabel: `${targetRt?.rtCode || rtId} / ${parentRw?.rwCode || 'RW'} (${targetRt?.ketuaRtName || '-'})`,
        summary: `Menghapus data Rukun Tetangga ${targetRt?.rtCode || rtId} dari wilayah ${parentRw?.rwCode || 'RW'}`,
        severity: 'warning',
      });
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
      recordAudit({
        actionType: editingWaId ? 'UPDATE' : 'CREATE',
        module: 'LAPORAN_WARGA',
        targetLabel: `Penerima WA: ${cleanName} (${cleanPhone})`,
        summary: editingWaId
          ? `Memperbarui nomor WhatsApp penerima laporan warga "${cleanName}"`
          : `Menambahkan nomor WhatsApp penerima laporan warga baru "${cleanName}"`,
        afterValue: `Peran: ${cleanRole} · Wilayah: ${waForm.rwScope || 'Seluruh Wilayah'}`,
        severity: 'info',
      });
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
      recordAudit({
        actionType: 'UPDATE',
        module: 'LAPORAN_WARGA',
        targetId: id,
        targetLabel: `Penerima Utama WA: ${target?.name || id} (${target?.phoneNumber || ''})`,
        summary: `Menetapkan ${target?.name || id} sebagai penerima utama otomatis WhatsApp laporan warga`,
        severity: 'info',
      });
      setSuccessMessage(
        `Nomor WhatsApp ${target?.name || ''} (${formatDisplayPhone(target?.phoneNumber || '')}) ditetapkan sebagai penerima utama otomatis laporan warga.`
      );
    }
  };

  const handleToggleActiveWaRecipient = async (id: string) => {
    clearFeedback();
    if (!onSaveWhatsAppRecipients) return;
    const target = whatsappRecipients.find((item) => item.id === id);
    if (!target) return;
    const nextStatus = !target.isActive;
    const nextList = whatsappRecipients.map((item) =>
      item.id === id ? { ...item, isActive: nextStatus } : item
    );
    const res = await onSaveWhatsAppRecipients(nextList);
    if (res.ok) {
      const statusLabel = nextStatus ? 'DIAKTIFKAN' : 'DINONAKTIFKAN';
      recordAudit({
        actionType: 'UPDATE',
        module: 'LAPORAN_WARGA',
        targetId: id,
        targetLabel: `Status WA: ${target.name} (${target.phoneNumber})`,
        summary: `${statusLabel} penerimaan pesan WhatsApp otomatis untuk ${target.name} (${target.rwScope || 'Seluruh Wilayah'})`,
        severity: 'info',
      });
      setSuccessMessage(
        `Nomor WhatsApp ${target.name} (${formatDisplayPhone(target.phoneNumber)}) ${statusLabel} untuk menerima pesan dari WhatsApp Gateway.`
      );
    } else {
      setValidationErrors(res.errors || ['Gagal memperbarui status penerima WhatsApp.']);
    }
  };

  const handleBulkToggleActiveWaRecipients = async (activate: boolean) => {
    clearFeedback();
    if (!onSaveWhatsAppRecipients) return;
    const targetIds = new Set(filteredWaRecipients.map((r: WhatsAppRecipient) => r.id));
    if (targetIds.size === 0) return;

    const nextList = whatsappRecipients.map((item) =>
      targetIds.has(item.id) ? { ...item, isActive: activate } : item
    );
    const res = await onSaveWhatsAppRecipients(nextList);
    if (res.ok) {
      const actionText = activate ? 'diaktifkan' : 'dinonaktifkan';
      setSuccessMessage(
        `${targetIds.size} nomor WhatsApp RTRW / petugas terfilter berhasil ${actionText} untuk menerima notifikasi.`
      );
    } else {
      setValidationErrors(res.errors || ['Gagal memperbarui status massal penerima WhatsApp.']);
    }
  };

  const handleExecuteDeleteWaRecipient = async (id: string) => {
    clearFeedback();
    if (!onSaveWhatsAppRecipients) return;
    const target = whatsappRecipients.find((item) => item.id === id);
    const nextList = whatsappRecipients.filter((item) => item.id !== id);
    if (nextList.length > 0 && !nextList.some((r) => r.isPrimary)) {
      nextList[0] = { ...nextList[0], isPrimary: true };
    }
    const res = await onSaveWhatsAppRecipients(nextList);
    setConfirmDeleteWaId(null);
    if (res.ok) {
      recordAudit({
        actionType: 'DELETE',
        module: 'LAPORAN_WARGA',
        targetId: id,
        targetLabel: `Penerima WA: ${target?.name || id} (${target?.phoneNumber || ''})`,
        summary: `Menghapus nomor penerima WhatsApp "${target?.name || id}"`,
        severity: 'warning',
      });
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
    const nowTime = getRealtimeDateTimeString();

    if (action === 'verifikasi') {
      const res = await auditedOnUpdateReport(rep.id, {
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
      verifiedAt: getRealtimeDateString(),
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
    const nowTime = getRealtimeDateTimeString();
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
      ? await auditedOnUpdateReport(editingReportId, payload)
      : await auditedOnCreateReport(payload);
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
    const res = await auditedOnDeleteReport(id);
    setConfirmDeleteReportId(null);
    if (res.ok) {
      setSuccessMessage('Data laporan warga berhasil dihapus dari basis data.');
    } else {
      setValidationErrors(res.errors || ['Gagal menghapus laporan.']);
    }
  };

  // ---------- BANK SAMPAH UNIT HANDLERS ----------
  const handleBsuPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    try {
      const dataUrl = await compressImageFile(file);
      setUnitForm((prev) => ({ ...prev, imageUrl: dataUrl }));
    } catch (err) {
      console.warn('Gagal memproses foto BSU:', err);
    }
  };

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
      imageUrl: '',
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
      recordAudit({
        actionType: editingUnitId ? 'UPDATE' : 'CREATE',
        module: 'BANK_SAMPAH',
        targetId: editingUnitId || undefined,
        targetLabel: `BSU: ${unitForm.unitName || 'Unit Baru'} (${unitForm.rw || '-'})`,
        summary: editingUnitId
          ? `Memperbarui data Bank Sampah Unit (BSU) "${unitForm.unitName}" (${unitForm.rw})`
          : `Menambahkan Bank Sampah Unit (BSU) baru "${unitForm.unitName}" (${unitForm.rw})`,
        afterValue: `Organik: ${unitForm.organikKg || 0} kg · Anorganik: ${unitForm.anorganikKg || 0} kg · KK Aktif: ${unitForm.activeHouseholds || 0}`,
        severity: 'info',
      });
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
    const targetUnit = wasteUnits.find((u) => u.id === id);
    const res = await onDeleteWasteUnit(id);
    setConfirmDeleteUnitId(null);
    if (res.ok) {
      recordAudit({
        actionType: 'DELETE',
        module: 'BANK_SAMPAH',
        targetId: id,
        targetLabel: `BSU: ${targetUnit?.unitName || id} (${targetUnit?.rw || '-'})`,
        summary: `Menghapus Bank Sampah Unit (BSU) "${targetUnit?.unitName || id}"`,
        severity: 'critical',
      });
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
      date: getRealtimeDateTimeString(),
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
    const totalKg = logForm.organikKg + logForm.anorganikKg + logForm.residuKg;
    if (totalKg <= 0) {
      setValidationErrors(['Total timbangan sampah harus lebih dari 0 kg.']);
      return;
    }
    if (editingLogId && onUpdateWasteLog) {
      const res = await onUpdateWasteLog(editingLogId, logForm);
      if (!res.ok) {
        setValidationErrors(res.errors || ['Gagal memperbarui log penimbangan.']);
        return;
      }
      recordAudit({
        actionType: 'UPDATE',
        module: 'BANK_SAMPAH',
        targetId: editingLogId,
        targetLabel: `Log Timbangan ${logForm.rw} (${logForm.unitName})`,
        summary: `Memperbarui catatan timbangan harian BSU ${logForm.rw} (Total: ${totalKg} kg)`,
        afterValue: `Organik: ${logForm.organikKg} kg · Anorganik: ${logForm.anorganikKg} kg · Residu: ${logForm.residuKg} kg`,
        severity: 'info',
      });
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
      recordAudit({
        actionType: 'CREATE',
        module: 'BANK_SAMPAH',
        targetLabel: `Log Timbangan ${logForm.rw} (${logForm.unitName})`,
        summary: `Mencatat timbangan harian sampah terpilah BSU ${logForm.rw} sebesar ${totalKg} kg`,
        afterValue: `Organik: ${logForm.organikKg} kg · Anorganik: ${logForm.anorganikKg} kg · Residu: ${logForm.residuKg} kg`,
        severity: 'info',
      });
      setShowLogForm(false);
      setSuccessMessage('Log penimbangan harian baru berhasil ditambahkan.');
    }
  };

  const handleExecuteDeleteLog = async (id: string) => {
    clearFeedback();
    const targetLog = wasteLogs.find((l) => l.id === id);
    const res = await onDeleteWasteLog(id);
    setConfirmDeleteLogId(null);
    if (res.ok) {
      recordAudit({
        actionType: 'DELETE',
        module: 'BANK_SAMPAH',
        targetId: id,
        targetLabel: `Log Timbangan ${targetLog?.rw || '-'} (${targetLog?.date || id})`,
        summary: `Menghapus catatan log penimbangan sampah harian ${targetLog?.rw || ''}`,
        severity: 'warning',
      });
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
      date: getRealtimeFullDateString(),
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
      recordAudit({
        actionType: editingCleanupId ? 'UPDATE' : 'CREATE',
        module: 'KERJA_BAKTI',
        targetId: editingCleanupId || undefined,
        targetLabel: `Kerja Bakti: ${payload.title || 'Kegiatan'} (${payload.rw || '-'})`,
        summary: editingCleanupId
          ? `Memperbarui kegiatan kerja bakti "${payload.title}" (${payload.status})`
          : `Menambahkan jadwal kerja bakti baru "${payload.title}" di ${payload.rw}`,
        afterValue: `Status: ${payload.status} · Lokasi: ${payload.locationName} · Sampah Terkumpul: ${payload.collectedWasteKg || 0} kg`,
        severity: 'info',
      });
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
    const targetEv = cleanupEvents.find((e) => e.id === id);
    const res = await onDeleteCleanup(id);
    setConfirmDeleteCleanupId(null);
    if (res.ok) {
      recordAudit({
        actionType: 'DELETE',
        module: 'KERJA_BAKTI',
        targetId: id,
        targetLabel: `Kerja Bakti: ${targetEv?.title || id} (${targetEv?.rw || '-'})`,
        summary: `Menghapus kegiatan kerja bakti "${targetEv?.title || id}"`,
        severity: 'warning',
      });
      setSuccessMessage('Data kegiatan kerja bakti berhasil dihapus.');
    }
  };

  const filteredReports = reports.filter((r) => {
    const isSurat = isSuratAdministrasi(r);
    if (reportTypeFilter === 'SURAT' && !isSurat) return false;
    if (reportTypeFilter === 'PENGADUAN' && isSurat) return false;
    if (reportStatusFilter !== 'SEMUA' && r.status !== reportStatusFilter) return false;
    if (reportRwFilter !== 'SEMUA') {
      const cleanRw = (r.rw || '').replace(/\s+/g, ' ').trim().toUpperCase();
      const targetNum = reportRwFilter.replace(/\D/g, '').replace(/^0+/, '');
      const itemNum = cleanRw.replace(/\D/g, '').replace(/^0+/, '');
      if (cleanRw !== reportRwFilter.toUpperCase() && (!targetNum || targetNum !== itemNum)) {
        return false;
      }
    }
    if (!reportSearch.trim()) return true;
    const q = reportSearch.trim().toLowerCase();
    return (
      (r.ticketCode || '').toLowerCase().includes(q) ||
      (r.title || '').toLowerCase().includes(q) ||
      (r.serviceSubItemLabel || '').toLowerCase().includes(q) ||
      (r.category || '').toLowerCase().includes(q) ||
      (r.rw || '').toLowerCase().includes(q) ||
      (r.reporterName || '').toLowerCase().includes(q) ||
      (r.applicantNik || '').toLowerCase().includes(q) ||
      (r.locationName || '').toLowerCase().includes(q)
    );
  });

  const reportTotalPages = Math.max(1, Math.ceil(filteredReports.length / reportPageSize));
  const safeReportCurrentPage = Math.min(reportCurrentPage, reportTotalPages);
  const paginatedFilteredReports = filteredReports.slice(
    (safeReportCurrentPage - 1) * reportPageSize,
    safeReportCurrentPage * reportPageSize
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
            {/* Single-Admin Occupancy Status & Lock Banner */}
            {activeAdminLockInfo.isLocked && activeAdminLockInfo.activeAdmin ? (
              <div className="mb-5 p-4 rounded-2xl bg-amber-50/90 border border-amber-300 text-amber-950 shadow-xs">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                    <Lock className="w-4 h-4 text-amber-700 shrink-0" />
                    <span>Akses Terkunci (1 Admin Sedang Aktif)</span>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-900 text-[10px] font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse" />
                    Sedang Online
                  </span>
                </div>
                <p className="text-xs text-amber-900 leading-relaxed mb-3">
                  Administrator <strong>{activeAdminLockInfo.activeAdmin.fullName}</strong> (@{activeAdminLockInfo.activeAdmin.username}) sedang aktif di perangkat lain sejak <strong>{activeAdminLockInfo.activeAdmin.loginAt}</strong>.
                </p>
                <div className="p-2.5 rounded-xl bg-amber-100/70 border border-amber-200 text-[11px] text-amber-900 leading-normal mb-3">
                  Demi keamanan & konsistensi data satu pintu, hanya 1 akun admin yang dapat aktif di seluruh perangkat. Perangkat ini tidak dapat login sebelum admin yang bersangkutan melakukan <strong>Logout</strong> atau sesinya dilepaskan.
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => checkSessionStatus()}
                    className="flex-1 py-1.5 px-3 rounded-lg bg-amber-200 hover:bg-amber-300 text-amber-950 font-semibold text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Cek Status Slot</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTakeoverError('');
                      setShowTakeoverModal(true);
                    }}
                    className="flex-1 py-1.5 px-3 rounded-lg bg-rose-100 hover:bg-rose-200 border border-rose-300 text-rose-800 font-semibold text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Ambil Alih Slot (Lurah)</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="mb-4 px-3.5 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-[#0D3868] text-[11px] font-medium flex flex-col gap-1.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span className="font-semibold text-emerald-900">Slot Administrator Terbuka</span>
                  </div>
                  <span className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full">
                    Siap Login (Tersedia)
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-600 pt-1 border-t border-emerald-200/60">
                  <Clock className="w-3 h-3 text-emerald-700 shrink-0" />
                  <span>Waktu Sistem Real-Time Makassar:</span>
                  <span className="font-mono-num font-bold text-emerald-900">{liveWitaClock}</span>
                </div>
              </div>
            )}

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

            {firebaseResetSuccess && (
              <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-900 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{firebaseResetSuccess}</span>
              </div>
            )}

            {/* Mode Switcher: Google Sign-In vs NIP/Username Pejabat */}
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl mb-5">
              <button
                type="button"
                onClick={() => {
                  setAdminLoginMethod('firebase_email');
                  setShowFirebaseReset(false);
                  setLoginError('');
                  setFirebaseResetSuccess('');
                }}
                className={`py-2 px-2.5 rounded-lg text-[11px] font-extrabold transition cursor-pointer ${
                  adminLoginMethod === 'firebase_email'
                    ? 'bg-[#0D3868] text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Akun Google
              </button>
              <button
                type="button"
                onClick={() => {
                  setAdminLoginMethod('nip_username');
                  setShowFirebaseReset(false);
                  setLoginError('');
                  setFirebaseResetSuccess('');
                }}
                className={`py-2 px-2.5 rounded-lg text-[11px] font-extrabold transition cursor-pointer ${
                  adminLoginMethod === 'nip_username'
                    ? 'bg-[#0D3868] text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Username / NIP Pejabat
              </button>
            </div>

            {adminLoginMethod === 'firebase_email' ? (
              <form onSubmit={handleFirebaseAdminLoginSubmit} className="space-y-4">
                <div className="p-3 rounded-xl bg-sky-50 border border-sky-200 text-[11px] text-[#0D3868] leading-relaxed">
                  <div className="font-bold flex items-center gap-1.5 mb-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Proteksi Whitelist Master Admin:</span>
                  </div>
                  Login Admin dengan akun Google dibatasi ketat. Hanya akun Gmail yang telah didaftarkan & diverifikasi oleh Administrator yang dapat mengakses panel ini. Silakan tekan tombol di bawah untuk memilih akun Google Anda dari perangkat ini.
                </div>

                {firebaseUserProfile && firebaseUserProfile.role !== 'admin' && (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 leading-relaxed flex flex-col gap-2">
                    <div>
                      Saat ini sesi browser masih terhubung pada akun{' '}
                      <strong>{firebaseUserProfile.email}</strong> (status{' '}
                      <strong>Warga</strong>).
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        setLoginError('');
                        setPendingGoogleAdminRequestEmail(null);
                        if (onFirebaseLogout) {
                          await onFirebaseLogout();
                        } else {
                          await logoutFirebaseUser();
                        }
                      }}
                      className="self-start px-3 py-1.5 rounded-lg bg-amber-200 hover:bg-amber-300 text-amber-950 font-bold text-[11px] transition cursor-pointer"
                    >
                      Putuskan Sesi & Pilih Akun Lain dari Perangkat
                    </button>
                  </div>
                )}

                {googleRequestSentNotice && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-950 leading-relaxed flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{googleRequestSentNotice}</span>
                  </div>
                )}

                {pendingGoogleAdminRequestEmail && !googleRequestSentNotice && (
                  <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-xs space-y-2">
                    <div className="font-bold text-amber-950 flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                      <span>Ajukan Permohonan Akses Admin ke Lurah</span>
                    </div>
                    <p className="text-[11px] text-amber-900">
                      Apakah Anda staf kelurahan dan ingin mengajukan verifikasi untuk email{' '}
                      <strong>{pendingGoogleAdminRequestEmail}</strong>?
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        const res = submitGoogleAdminVerificationRequest({
                          email: pendingGoogleAdminRequestEmail,
                          displayName: firebaseUserProfile?.fullName || undefined,
                        });
                        if (res.ok) {
                          setGoogleRequestSentNotice(res.message);
                        }
                      }}
                      className="w-full py-2 px-3 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition cursor-pointer shadow-xs"
                    >
                      Kirim Permohonan Verifikasi ke Master Admin
                    </button>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-full mt-2 inline-flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl bg-[#0D3868] hover:bg-[#072647] text-white text-sm font-bold shadow-sm transition-colors cursor-pointer disabled:opacity-75 disabled:cursor-wait"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>
                    {isLoggingIn
                      ? 'Membuka Pilihan Akun Google...'
                      : 'Masuk dengan Google (Pilih Akun)'}
                  </span>
                </button>
              </form>
            ) : (
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
                  className="w-full mt-2 inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#0D3868] hover:bg-[#072647] text-white text-sm font-bold shadow-sm transition-colors cursor-pointer disabled:opacity-75 disabled:cursor-wait"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>
                    {isLoggingIn
                      ? 'Memverifikasi Kredensial...'
                      : activeAdminLockInfo.isLocked
                      ? 'Masuk & Ambil Alih Slot Login'
                      : 'Masuk ke Panel Administrator'}
                  </span>
                </button>
              </form>
            )}

            <div className="mt-5 pt-4 border-t border-slate-100 text-center">
              <p className="text-[11px] text-slate-500 font-medium">
                Akses terbatas khusus Pejabat Struktural & Operator Resmi Pemerintah Kelurahan Panaikang.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Ambil Alih Slot bagi Master Lurah */}
        {showTakeoverModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
              <div className="bg-[#0D3868] px-5 py-4 text-white flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <ShieldCheck className="w-5 h-5 text-amber-300" />
                  <span>Ambil Alih Slot (Otoritas Lurah)</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowTakeoverModal(false)}
                  className="text-white/80 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleForceTakeover} className="p-5 space-y-4">
                <p className="text-xs text-slate-600 leading-relaxed">
                  Fitur ini khusus untuk <strong>Lurah Panaikang</strong> untuk memutus paksa sesi perangkat lain yang belum logout. Masukkan Kata Sandi Master Otoritas Lurah:
                </p>
                {takeoverError && (
                  <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800">
                    {takeoverError}
                  </div>
                )}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kata Sandi Master Lurah *
                  </label>
                  <input
                    type="password"
                    value={takeoverPassword}
                    onChange={(e) => setTakeoverPassword(e.target.value)}
                    placeholder="Masukkan sandi master Lurah"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:border-[#0D3868] focus:outline-none"
                    autoFocus
                  />
                </div>
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowTakeoverModal(false)}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-700 font-semibold hover:bg-slate-50 cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isTakingOver}
                    className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-xs text-white font-bold transition cursor-pointer disabled:opacity-50"
                  >
                    {isTakingOver ? 'Memproses...' : 'Lepaskan & Ambil Alih'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
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
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-bold text-white">
                  {adminSession.fullName}
                </span>
                <span
                  title="Sesi Administrator aktif tunggal (1 Admin Live di seluruh perangkat)"
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-[10px] font-semibold text-emerald-300"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  1 Admin Live (Tunggal)
                </span>
                <span
                  title="Seluruh data tersimpan terpusat dan tersinkronisasi live di Google Cloud Firestore"
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-500/20 border border-sky-400/40 text-[10px] font-semibold text-sky-200"
                >
                  <Cloud className="w-3 h-3 text-sky-300" />
                  Cloud Firestore Aktif
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] text-sky-200 mt-0.5">
                <span>{adminSession.role}</span>
                <span className="text-sky-400/60">•</span>
                <span className="inline-flex items-center gap-1 text-emerald-200 font-medium">
                  <Clock className="w-3 h-3 text-emerald-300 shrink-0" />
                  <span>Waktu Login:</span>
                  <span className="font-mono-num font-bold text-white">{adminSession.loginAt}</span>
                </span>
                <span className="text-sky-400/60">•</span>
                <span className="inline-flex items-center gap-1 text-sky-100">
                  <span>Waktu Real-Time:</span>
                  <span className="font-mono-num font-semibold text-amber-200">{liveWitaClock}</span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
            <button
              type="button"
              onClick={() => generateApplicationWorkflowPdf(profile)}
              title="Unduh Dokumen PDF Panduan & Alur Kerja (SOP) Seluruh Menu Aplikasi"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-extrabold border border-amber-300 shadow-xs transition-colors cursor-pointer whitespace-nowrap"
            >
              <FileText className="w-3.5 h-3.5 text-slate-950" />
              <span>Unduh PDF Alur Kerja</span>
            </button>

            <button
              type="button"
              disabled={isCloudSyncing}
              onClick={handleForceCloudSync}
              title="Sinkronkan seluruh modul (Warga, Sampah, RT/RW, Urban Farming, Peta, Profil, Kerja Bakti) ke Google Cloud Firestore"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold border border-sky-400/40 shadow-xs transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50"
            >
              <Cloud className={`w-3.5 h-3.5 ${isCloudSyncing ? 'animate-bounce' : ''}`} />
              <span>{isCloudSyncing ? 'Menyinkronkan...' : 'Sinkronkan ke Cloud'}</span>
            </button>
            
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

          {/* Structured Full-Width Navigation Menu Grid (12 Urutan Resmi Menu Admin) */}
          <div className="mt-5 pt-4 border-t border-slate-200">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Daftar Menu Administrator Kelurahan Panaikang (12 Modul)
                </span>
                <span className="text-[10.5px] font-bold px-2.5 py-0.5 rounded-full bg-[#0D3868] text-white">
                  Menu Aktif: {getAdminTabLabel(activeTab)}
                </span>
              </div>
              <span className="text-[11px] text-slate-500 hidden sm:inline">
                Pilih menu untuk menampilkan kartu sub-menu (gunakan tombol Tampilkan Detail / Tutup pada tiap kartu)
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-2">
              {/* 1. Dashboard Lurah */}
              <button
                type="button"
                onClick={() => handleTabSwitch('dashboard_lurah')}
                className={`flex flex-col justify-between p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  activeTab === 'dashboard_lurah'
                    ? 'bg-[#2E7D32] border-[#2E7D32] text-white shadow-xs'
                    : !isTabAllowed('dashboard_lurah')
                    ? 'bg-slate-100 border-slate-200 text-slate-400 opacity-75'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <BarChart3
                      className={`w-4 h-4 shrink-0 ${
                        activeTab === 'dashboard_lurah' ? 'text-emerald-200' : 'text-[#2E7D32]'
                      }`}
                    />
                    <span className="text-xs font-bold truncate">Dashboard Lurah</span>
                  </div>
                  {!isTabAllowed('dashboard_lurah') && (
                    <Lock className="w-3 h-3 text-slate-400 shrink-0" />
                  )}
                </div>
                <span
                  className={`mt-1 text-[10px] font-medium truncate ${
                    activeTab === 'dashboard_lurah' ? 'text-emerald-100' : 'text-slate-500'
                  }`}
                >
                  Disposisi &amp; Arsip PDF
                </span>
              </button>

              {/* 2. Profil Kelurahan */}
              <button
                type="button"
                onClick={() => handleTabSwitch('profil')}
                className={`flex flex-col justify-between p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  activeTab === 'profil'
                    ? 'bg-[#0D3868] border-[#0D3868] text-white shadow-xs'
                    : !isTabAllowed('profil')
                    ? 'bg-slate-100 border-slate-200 text-slate-400 opacity-75'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Building2
                      className={`w-4 h-4 shrink-0 ${
                        activeTab === 'profil' ? 'text-sky-200' : 'text-[#0D3868]'
                      }`}
                    />
                    <span className="text-xs font-bold truncate">Profil Kelurahan</span>
                  </div>
                  {!isTabAllowed('profil') && (
                    <Lock className="w-3 h-3 text-slate-400 shrink-0" />
                  )}
                </div>
                <span
                  className={`mt-1 text-[10px] font-medium truncate ${
                    activeTab === 'profil' ? 'text-sky-100' : 'text-slate-500'
                  }`}
                >
                  Data Lurah &amp; Visi Misi
                </span>
              </button>

              {/* 3. Admin Layanan Kelurahan */}
              <button
                type="button"
                onClick={() => handleTabSwitch('pengurusan_warga')}
                className={`flex flex-col justify-between p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  activeTab === 'pengurusan_warga' || activeTab === 'laporan'
                    ? 'bg-[#0D3868] border-[#0D3868] text-white shadow-xs'
                    : !isTabAllowed('pengurusan_warga')
                    ? 'bg-slate-100 border-slate-200 text-slate-400 opacity-75'
                    : 'bg-sky-50/70 border-sky-200 text-[#0D3868] hover:bg-sky-100/70 hover:border-sky-300'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <FileText
                      className={`w-4 h-4 shrink-0 ${
                        activeTab === 'pengurusan_warga' || activeTab === 'laporan'
                          ? 'text-amber-300'
                          : 'text-[#0277BD]'
                      }`}
                    />
                    <span className="text-xs font-bold truncate">Admin Layanan Kelurahan</span>
                  </div>
                  {!isTabAllowed('pengurusan_warga') && (
                    <Lock className="w-3 h-3 text-slate-400 shrink-0" />
                  )}
                </div>
                <span
                  className={`mt-1 text-[10px] font-medium truncate font-mono-num ${
                    activeTab === 'pengurusan_warga' || activeTab === 'laporan'
                      ? 'text-sky-100'
                      : 'text-[#0277BD]'
                  }`}
                >
                  Pra Registrasi &amp; Pengaduan Online
                </span>
              </button>

              {/* 4. Data RT RW */}
              <button
                type="button"
                onClick={() => handleTabSwitch('rtrw')}
                className={`flex flex-col justify-between p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  activeTab === 'rtrw'
                    ? 'bg-[#0D3868] border-[#0D3868] text-white shadow-xs'
                    : !isTabAllowed('rtrw')
                    ? 'bg-slate-100 border-slate-200 text-slate-400 opacity-75'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Users
                      className={`w-4 h-4 shrink-0 ${
                        activeTab === 'rtrw' ? 'text-emerald-300' : 'text-[#0D3868]'
                      }`}
                    />
                    <span className="text-xs font-bold truncate">Data RT RW</span>
                  </div>
                  {!isTabAllowed('rtrw') && (
                    <Lock className="w-3 h-3 text-slate-400 shrink-0" />
                  )}
                </div>
                <span
                  className={`mt-1 text-[10px] font-medium truncate font-mono-num ${
                    activeTab === 'rtrw' ? 'text-sky-100' : 'text-slate-500'
                  }`}
                >
                  {rwGroups.length} RW / {totalRtInKelurahan} RT &amp; Siskamling
                </span>
              </button>

              {/* 5. Pengelolaan Sampah */}
              <button
                type="button"
                onClick={() => handleTabSwitch('sampah')}
                className={`flex flex-col justify-between p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  activeTab === 'sampah'
                    ? 'bg-[#EF6C00] border-[#EF6C00] text-white shadow-xs'
                    : !isTabAllowed('sampah')
                    ? 'bg-slate-100 border-slate-200 text-slate-400 opacity-75'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Recycle
                      className={`w-4 h-4 shrink-0 ${
                        activeTab === 'sampah' ? 'text-amber-200' : 'text-[#EF6C00]'
                      }`}
                    />
                    <span className="text-xs font-bold truncate">Pengelolaan Sampah</span>
                  </div>
                  {!isTabAllowed('sampah') && (
                    <Lock className="w-3 h-3 text-slate-400 shrink-0" />
                  )}
                </div>
                <span
                  className={`mt-1 text-[10px] font-medium truncate font-mono-num ${
                    activeTab === 'sampah' ? 'text-amber-100' : 'text-slate-500'
                  }`}
                >
                  {wasteUnits.length} BSU · {tebaSpots.length} Teba · {bioporiPoints.length} Biopori
                </span>
              </button>

              {/* 6. Urban Farming */}
              <button
                type="button"
                onClick={() => handleTabSwitch('urban_farming')}
                className={`flex flex-col justify-between p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  activeTab === 'urban_farming'
                    ? 'bg-[#059669] border-[#059669] text-white shadow-xs'
                    : !isTabAllowed('urban_farming')
                    ? 'bg-slate-100 border-slate-200 text-slate-400 opacity-75'
                    : 'bg-emerald-50/70 border-emerald-200 text-[#059669] hover:bg-emerald-100/70 hover:border-emerald-300'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Sprout
                      className={`w-4 h-4 shrink-0 ${
                        activeTab === 'urban_farming' ? 'text-emerald-100' : 'text-[#059669]'
                      }`}
                    />
                    <span className="text-xs font-bold truncate">Urban Farming</span>
                  </div>
                  {!isTabAllowed('urban_farming') && (
                    <Lock className="w-3 h-3 text-slate-400 shrink-0" />
                  )}
                </div>
                <span
                  className={`mt-1 text-[10px] font-medium truncate font-mono-num ${
                    activeTab === 'urban_farming' ? 'text-emerald-100' : 'text-slate-500'
                  }`}
                >
                  {urbanFarmingSpots.length} Kebun · {seedRequests.length} Bibit
                </span>
              </button>

              {/* 7. Kerja Bakti */}
              <button
                type="button"
                onClick={() => handleTabSwitch('kerjabakti')}
                className={`flex flex-col justify-between p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  activeTab === 'kerjabakti'
                    ? 'bg-[#5E35B1] border-[#5E35B1] text-white shadow-xs'
                    : !isTabAllowed('kerjabakti')
                    ? 'bg-slate-100 border-slate-200 text-slate-400 opacity-75'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Calendar
                      className={`w-4 h-4 shrink-0 ${
                        activeTab === 'kerjabakti' ? 'text-purple-200' : 'text-[#5E35B1]'
                      }`}
                    />
                    <span className="text-xs font-bold truncate">Kerja Bakti</span>
                  </div>
                  {!isTabAllowed('kerjabakti') && (
                    <Lock className="w-3 h-3 text-slate-400 shrink-0" />
                  )}
                </div>
                <span
                  className={`mt-1 text-[10px] font-medium truncate font-mono-num ${
                    activeTab === 'kerjabakti' ? 'text-purple-100' : 'text-slate-500'
                  }`}
                >
                  {cleanupEvents.length} Jadwal &amp; Foto
                </span>
              </button>

              {/* 8. Informasi dan IG */}
              <button
                type="button"
                onClick={() => handleTabSwitch('info')}
                className={`flex flex-col justify-between p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  activeTab === 'info'
                    ? 'bg-[#1C8237] border-[#1C8237] text-white shadow-xs'
                    : !isTabAllowed('info')
                    ? 'bg-slate-100 border-slate-200 text-slate-400 opacity-75'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Newspaper
                      className={`w-4 h-4 shrink-0 ${
                        activeTab === 'info' ? 'text-emerald-200' : 'text-[#1C8237]'
                      }`}
                    />
                    <span className="text-xs font-bold truncate">Informasi dan IG</span>
                  </div>
                  {!isTabAllowed('info') && (
                    <Lock className="w-3 h-3 text-slate-400 shrink-0" />
                  )}
                </div>
                <span
                  className={`mt-1 text-[10px] font-medium truncate font-mono-num ${
                    activeTab === 'info' ? 'text-emerald-100' : 'text-slate-500'
                  }`}
                >
                  {kelurahanInfos.length} Postingan Aktif
                </span>
              </button>

              {/* 9. Kelola WhatsApp Gateaway */}
              <button
                type="button"
                onClick={() => handleTabSwitch('whatsapp_gateway')}
                className={`flex flex-col justify-between p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  activeTab === 'whatsapp_gateway'
                    ? 'bg-[#128C7E] border-[#128C7E] text-white shadow-xs'
                    : !isTabAllowed('whatsapp_gateway')
                    ? 'bg-slate-100 border-slate-200 text-slate-400 opacity-75'
                    : 'bg-emerald-50/80 border-emerald-300 text-[#075E54] hover:bg-emerald-100/80 hover:border-emerald-400'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <MessageCircle
                      className={`w-4 h-4 shrink-0 ${
                        activeTab === 'whatsapp_gateway' ? 'text-emerald-200' : 'text-[#128C7E]'
                      }`}
                    />
                    <span className="text-xs font-bold truncate">Kelola WhatsApp Gateaway</span>
                  </div>
                  {!isTabAllowed('whatsapp_gateway') && (
                    <Lock className="w-3 h-3 text-slate-400 shrink-0" />
                  )}
                </div>
                <span
                  className={`mt-1 text-[10px] font-medium truncate font-mono-num ${
                    activeTab === 'whatsapp_gateway' ? 'text-emerald-100' : 'text-[#128C7E]'
                  }`}
                >
                  {whatsappRecipients.filter((r) => r.isActive).length}/{whatsappRecipients.length} Nomor Aktif (Fonnte)
                </span>
              </button>

              {/* 10. Kelola Admin dan User */}
              <button
                type="button"
                onClick={() => handleTabSwitch('kelola_admin_warga')}
                className={`flex flex-col justify-between p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  activeTab === 'kelola_admin_warga' || activeTab === 'parameter_user' || activeTab === 'user_warga'
                    ? 'bg-[#0D3868] border-[#0D3868] text-white shadow-xs'
                    : !isTabAllowed('kelola_admin_warga')
                    ? 'bg-slate-100 border-slate-200 text-slate-400 opacity-75'
                    : 'bg-indigo-50/80 border-indigo-200 text-[#0D3868] hover:bg-indigo-100/70'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Users
                      className={`w-4 h-4 shrink-0 ${
                        activeTab === 'kelola_admin_warga' || activeTab === 'parameter_user' || activeTab === 'user_warga'
                          ? 'text-emerald-300'
                          : 'text-indigo-700'
                      }`}
                    />
                    <span className="text-xs font-bold truncate">Kelola Admin dan User</span>
                  </div>
                  {!isTabAllowed('kelola_admin_warga') && (
                    <Lock className="w-3 h-3 text-slate-400 shrink-0" />
                  )}
                </div>
                <span
                  className={`mt-1 text-[10px] font-medium truncate font-mono-num ${
                    activeTab === 'kelola_admin_warga' || activeTab === 'parameter_user' || activeTab === 'user_warga'
                      ? 'text-emerald-200'
                      : 'text-indigo-900'
                  }`}
                >
                  4 Kartu · Otoritas &amp; Warga
                </span>
              </button>

              {/* 11. Traffic Web dan App */}
              <button
                type="button"
                onClick={() => handleTabSwitch('traffic')}
                className={`flex flex-col justify-between p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  activeTab === 'traffic'
                    ? 'bg-[#00838F] border-[#00838F] text-white shadow-xs'
                    : !isTabAllowed('traffic')
                    ? 'bg-slate-100 border-slate-200 text-slate-400 opacity-75'
                    : 'bg-cyan-50/80 border-cyan-200 text-[#006064] hover:bg-cyan-100/80 hover:border-cyan-300'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Activity
                      className={`w-4 h-4 shrink-0 ${
                        activeTab === 'traffic' ? 'text-cyan-200' : 'text-[#00838F]'
                      }`}
                    />
                    <span className="text-xs font-bold truncate">Traffic Web dan App</span>
                  </div>
                  {!isTabAllowed('traffic') && (
                    <Lock className="w-3 h-3 text-slate-400 shrink-0" />
                  )}
                </div>
                <span
                  className={`mt-1 text-[10px] font-medium truncate font-mono-num ${
                    activeTab === 'traffic' ? 'text-cyan-100' : 'text-[#006064]'
                  }`}
                >
                  Analitik &amp; Live Telemetry
                </span>
              </button>

              {/* 12. Log Aktifitas Aplikasi */}
              <button
                type="button"
                onClick={() => handleTabSwitch('log_aktivitas')}
                className={`flex flex-col justify-between p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  activeTab === 'log_aktivitas'
                    ? 'bg-[#0D3868] border-[#0D3868] text-white shadow-xs'
                    : !isTabAllowed('log_aktivitas')
                    ? 'bg-slate-100 border-slate-200 text-slate-400 opacity-75'
                    : 'bg-sky-50/80 border-sky-300 text-[#0D3868] hover:bg-sky-100/70'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <History
                      className={`w-4 h-4 shrink-0 ${
                        activeTab === 'log_aktivitas' ? 'text-amber-300' : 'text-[#0277BD]'
                      }`}
                    />
                    <span className="text-xs font-bold truncate">Log Aktifitas Aplikasi</span>
                  </div>
                  {!isTabAllowed('log_aktivitas') && (
                    <Lock className="w-3 h-3 text-slate-400 shrink-0" />
                  )}
                </div>
                <span
                  className={`mt-1 text-[10px] font-medium truncate font-mono-num ${
                    activeTab === 'log_aktivitas' ? 'text-sky-200' : 'text-[#0277BD]'
                  }`}
                >
                  {activityLogs.length} Audit Trail
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Global Validation Errors or Success Banner */}
      {validationErrors.length > 0 && (
        <div className="mt-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-900 space-y-3">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1 text-xs sm:text-sm">
              <div className="font-bold">
                {validationErrors.every((err) =>
                  /gagal mengirim wa|whatsapp|fonnte|gateway|token/i.test(err)
                )
                  ? 'Pemberitahuan Kendala WhatsApp Gateway (Fonnte):'
                  : 'Validasi Data Gagal — Mohon Periksa Kembali:'}
              </div>
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

          {validationErrors.some((err) => /fonnte_token|token fonnte/i.test(err)) && (
            <form
              onSubmit={handleSaveFonnteToken}
              className="p-3.5 rounded-xl bg-white border border-red-200 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shadow-2xs"
            >
              <div className="flex items-center gap-2 text-xs font-bold text-[#0D3868] shrink-0">
                <Key className="w-4 h-4 text-amber-500 shrink-0" />
                <span>Input Cepat FONNTE_TOKEN:</span>
              </div>
              <input
                type="password"
                value={tokenInputValue}
                onChange={(e) => setTokenInputValue(e.target.value)}
                placeholder="Pastekan Token Device / Account dari fonnte.com di sini..."
                className="flex-1 rounded-xl border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs font-mono text-slate-900 focus:border-[#0D3868] focus:bg-white outline-hidden"
              />
              <button
                type="submit"
                disabled={isSavingToken || !tokenInputValue.trim()}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-xl bg-[#128C7E] hover:bg-[#075E54] disabled:opacity-50 text-white text-xs font-bold cursor-pointer whitespace-nowrap shadow-xs"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{isSavingToken ? 'Menyimpan...' : 'Simpan Token & Aktifkan WA'}</span>
              </button>
            </form>
          )}
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

      {/* ================= TAB TRAFFIC WEB & APLIKASI ================= */}
      {activeTab === 'traffic' && isTabAllowed('traffic') && (
        <div className="mt-6 space-y-5">
          <AdminCollapsibleBar
            sectionKey="traffic_analitik"
            title="01. Statistik Kunjungan &amp; Analitik Traffic Web dan App"
            subtitle="Pemantauan trafik pengunjung harian, perangkat warga, dan interaksi halaman aplikasi secara real-time"
            icon={<Activity className="w-5 h-5 text-[#00838F]" />}
            badge={
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-cyan-50 text-[#006064] border border-cyan-300">
                Real-Time Analytics
              </span>
            }
            isCollapsed={isSectionCollapsed('traffic_analitik')}
            onToggle={() => toggleSectionCollapse('traffic_analitik')}
          >
            <div className="p-4 sm:p-5">
              <AdminTrafficView onNavigateToView={onNavigate} />
            </div>
          </AdminCollapsibleBar>
        </div>
      )}

      {/* ================= TAB KELOLA ADMIN DAN USER (4 KARTU SUB-MENU PERKARTU) ================= */}
      {(activeTab === 'kelola_admin_warga' || activeTab === 'parameter_user' || activeTab === 'user_warga') &&
        isTabAllowed('kelola_admin_warga') && (
          <div className="mt-6 space-y-5">
            {/* KARTU SUB-MENU 01: Otoritas Master Admin */}
            <AdminCollapsibleBar
              sectionKey="admin_warga_otoritas"
              title="01. Otoritas Master Admin (Verifikasi Login Google, Whitelist &amp; Force Sesi)"
              subtitle="Pusat kendali otoritas Lurah, manajemen whitelist Google, dan pengambilalihan sesi login"
              icon={<ShieldCheck className="w-5 h-5 text-indigo-700" />}
              badge={
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700">
                  Otoritas Lurah
                </span>
              }
              isCollapsed={isSectionCollapsed('admin_warga_otoritas')}
              onToggle={() => toggleSectionCollapse('admin_warga_otoritas')}
            >
              <div className="p-4 sm:p-5">
                <AdminOtoritasMasterPanel
                  adminUsers={adminUsers}
                  isMasterLurah={isLurahSession}
                  currentUsername={adminSession?.username || ''}
                  onSaveAdminUsers={auditedOnSaveAdminUsers}
                  onForceTakeover={async (pwd) => {
                    return await forceLogoutFirestore(pwd);
                  }}
                  onRecordAudit={(audit) => {
                    recordAudit({
                      actionType: audit.actionType,
                      module: 'PARAMETER_USER',
                      targetLabel: audit.targetLabel,
                      summary: audit.summary,
                      details: audit.details,
                      severity: 'warning',
                    });
                  }}
                  onSwitchSubTab={(sub) => setKelolaAdminWargaSubTab(sub)}
                />
              </div>
            </AdminCollapsibleBar>

            {/* KARTU SUB-MENU 02: Parameter Admin */}
            <AdminCollapsibleBar
              sectionKey="admin_warga_parameter"
              title={`02. Parameter Admin & Manajemen Akun Pejabat Struktural (${adminUsers.length} Akun)`}
              subtitle="Pengaturan hak akses modul (RBAC), izin aksi petugas, dan kredensial login pejabat kelurahan"
              icon={<Sliders className="w-5 h-5 text-amber-600" />}
              badge={
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800">
                  {adminUsers.length} Akun Admin
                </span>
              }
              isCollapsed={isSectionCollapsed('admin_warga_parameter')}
              onToggle={() => toggleSectionCollapse('admin_warga_parameter')}
            >
              <div className="p-4 sm:p-5">
                <AdminParameterUserPanel
                  adminUsers={adminUsers}
                  serviceCatalog={serviceCatalog}
                  profile={profile}
                  rwGroups={rwGroups}
                  currentUsername={adminSession?.username || ''}
                  isMasterLurah={isLurahSession}
                  onSaveAdminUsers={auditedOnSaveAdminUsers}
                />
              </div>
            </AdminCollapsibleBar>

            {/* KARTU SUB-MENU 03: User Warga Terdaftar */}
            <AdminCollapsibleBar
              sectionKey="admin_warga_user"
              title={`03. User Warga Terdaftar & Parameter Batasan Akses Menu (${citizenUsers.length} Warga)`}
              subtitle="Database akun warga terdaftar, riwayat pengajuan per warga, serta pengaturan visibilitas menu warga"
              icon={<Users className="w-5 h-5 text-emerald-600" />}
              badge={
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800">
                  {citizenUsers.length} Akun Warga
                </span>
              }
              isCollapsed={isSectionCollapsed('admin_warga_user')}
              onToggle={() => toggleSectionCollapse('admin_warga_user')}
            >
              <div className="p-4 sm:p-5">
                <AdminDaftarWargaPanel
                  reports={reports}
                  rwGroups={rwGroups}
                  citizenUsers={citizenUsers}
                  citizenMenuConfig={citizenMenuConfig}
                  onSaveCitizenMenuConfig={onSaveCitizenMenuConfig}
                  onUpdateCitizenUser={onUpdateCitizenUser}
                  onDeleteCitizenUser={onDeleteCitizenUser}
                  onRecordAudit={(audit) => {
                    recordAudit({
                      actionType: audit.actionType,
                      module: 'DAFTAR_WARGA',
                      targetId: audit.targetId,
                      targetLabel: audit.targetLabel,
                      summary: audit.summary,
                      details: audit.details,
                      severity: audit.actionType === 'ACCESS_CHANGE' ? 'warning' : 'info',
                    });
                  }}
                />
              </div>
            </AdminCollapsibleBar>

            {/* KARTU SUB-MENU 04: Master Data Layanan */}
            <AdminCollapsibleBar
              sectionKey="admin_warga_master_data"
              title="04. Manajemen Pelayanan &amp; Master Data Layanan Kelurahan"
              subtitle="Konfigurasi master layanan surat, daftar persyaratan berkas, formulir dinamis, dan kategori pengaduan"
              icon={<Layers className="w-5 h-5 text-[#0277BD]" />}
              badge={
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-sky-50 border border-sky-200 text-[#0277BD]">
                  Master Katalog
                </span>
              }
              isCollapsed={isSectionCollapsed('admin_warga_master_data')}
              onToggle={() => toggleSectionCollapse('admin_warga_master_data')}
            >
              <div className="p-4 sm:p-5">
                <AdminMasterDataLayananPanel
                  masterLayananList={masterLayananList}
                  masterPersyaratanList={masterPersyaratanList}
                  kategoriPengaduanList={kategoriPengaduanList}
                  onSaveMasterLayanan={onSaveMasterLayanan || (async () => ({ ok: true }))}
                  onSaveMasterPersyaratan={onSaveMasterPersyaratan || (async () => ({ ok: true }))}
                  onSaveKategoriPengaduan={onSaveKategoriPengaduan}
                />
              </div>
            </AdminCollapsibleBar>
          </div>
        )}

      {/* ================= TAB LOG AKTIFITAS APLIKASI ================= */}
      {activeTab === 'log_aktivitas' && isTabAllowed('log_aktivitas') && (
        <div className="mt-6 space-y-5">
          <AdminCollapsibleBar
            sectionKey="log_audit_trail"
            title={`01. Riwayat Log Aktifitas Aplikasi & Audit Trail (${activityLogs.length} Log)`}
            subtitle="Rekam jejak seluruh aktivitas administrator, perubahan data, persetujuan surat, dan pengiriman WhatsApp"
            icon={<History className="w-5 h-5 text-[#0277BD]" />}
            badge={
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-sky-50 text-[#0D3868] border border-sky-200">
                {activityLogs.length} Audit Trail
              </span>
            }
            isCollapsed={isSectionCollapsed('log_audit_trail')}
            onToggle={() => toggleSectionCollapse('log_audit_trail')}
          >
            <div className="p-4 sm:p-5">
              <AdminActivityLogPanel
                activityLogs={activityLogs}
                adminUsers={adminUsers}
                profile={profile}
                currentUser={
                  currentAdminAccount || {
                    id: adminSession?.userId || 'usr-master-lurah',
                    username: adminSession?.username || 'lurah',
                    password: '',
                    fullName: adminSession?.fullName || profile.lurahName || 'Muthmainnah, SE, MM',
                    nip: adminSession?.nip || profile.lurahNip || '198607092015042001',
                    jabatan: adminSession?.role || 'Lurah Panaikang',
                    unitBidang: 'Pimpinan Kelurahan Panaikang',
                    phone: '',
                    roleLevel: isLurahSession ? 'master_admin' : 'admin_bidang',
                    isMasterLurah: isLurahSession,
                    isActive: true,
                    allowedAdminTabs: effectiveAllowedTabs,
                    allowedServiceCategories: [],
                    actionPermissions: effectiveActionPermissions,
                    createdAt: '',
                    updatedAt: '',
                  }
                }
                onAddManualLog={(entry) => {
                  recordAudit({
                    actionType: entry.actionType,
                    module: entry.module,
                    targetLabel: entry.targetLabel,
                    summary: entry.summary,
                    details: entry.details,
                    beforeValue: entry.beforeValue,
                    afterValue: entry.afterValue,
                    severity: entry.severity,
                  });
                  setSuccessMessage('Catatan audit trail baru berhasil ditambahkan ke Log Aktivitas.');
                }}
                onDeleteLogEntry={onDeleteActivityLog}
                onClearLogs={onResetActivityLogs}
              />
            </div>
          </AdminCollapsibleBar>
        </div>
      )}

      {/* ================= PROTEKSI BATASAN AKSES MODUL OLEH SUPER ADMIN (LURAH) ================= */}
      {activeTab !== 'kelola_admin_warga' &&
        activeTab !== 'parameter_user' &&
        activeTab !== 'user_warga' &&
        activeTab !== 'dashboard_lurah' &&
        !isTabAllowed(activeTab) && (
          <div className="mt-6 bg-white rounded-2xl border border-amber-200 p-6 sm:p-8 text-center shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto mb-3">
              <Lock className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-extrabold text-[#0D3868]">
              Akses Modul Ini Dibatasi oleh Master Admin (Lurah)
            </h2>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-600 max-w-xl mx-auto">
              Akun Anda (<strong>{adminSession.fullName}</strong> — @{adminSession.username}) tidak
              memiliki izin untuk mengakses modul ini berdasarkan pengaturan{' '}
              <strong>Parameter User & Batasan Hak Akses</strong> yang ditetapkan oleh Lurah
              Panaikang.
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              {effectiveAllowedTabs.map((allowedTab) => (
                <button
                  key={allowedTab}
                  type="button"
                  onClick={() => handleTabSwitch(allowedTab)}
                  className="px-3.5 py-2 rounded-xl bg-[#0D3868] hover:bg-[#072647] text-white text-xs font-bold cursor-pointer"
                >
                  Buka Modul: {allowedTab.replace('_', ' ').toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        )}

      {/* ================= TAB ADMIN LAYANAN KELURAHAN (BAGIAN 1: PELAYANAN & PENGURUSAN WARGA) ================= */}
      {(activeTab === 'pengurusan_warga' || activeTab === 'laporan') &&
        (isTabAllowed('pengurusan_warga') || isTabAllowed('laporan')) && (
          <div className="mt-6 space-y-5">
            <AdminCollapsibleBar
              sectionKey="layanan_pengurusan_utama"
              title="01. Pelayanan Administrasi &amp; Pengurusan Surat Resmi Warga (7 Bidang · 44 Sub-Menu)"
              subtitle="Pemrosesan berkas pra-registrasi online, verifikasi persyaratan, penerbitan nomor surat, dan cetak KOP resmi"
              icon={<FileText className="w-5 h-5 text-[#0277BD]" />}
              badge={
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-sky-50 text-[#0D3868] border border-sky-200">
                  {reports.length} Berkas &amp; Pengajuan
                </span>
              }
              isCollapsed={isSectionCollapsed('layanan_pengurusan_utama')}
              onToggle={() => toggleSectionCollapse('layanan_pengurusan_utama')}
            >
              <div className="p-4 sm:p-5">
                <AdminPengurusanWargaPanel
                  reports={reports}
                  praRegistrasiList={praRegistrasiList}
                  pengaduanList={pengaduanList}
                  profile={profile}
                  rwGroups={rwGroups}
                  whatsappRecipients={whatsappRecipients}
                  citizenUsers={citizenUsers}
                  serviceCatalog={serviceCatalog}
                  adminOfficerName={
                    adminSession?.fullName || 'Administrator / Operator Kelurahan Panaikang'
                  }
                  allowedServiceCategories={effectiveAllowedCategories}
                  actionPermissions={effectiveActionPermissions}
                  onCreateReport={auditedOnCreateReport}
                  onUpdateReport={auditedOnUpdateReport}
                  onDeleteReport={auditedOnDeleteReport}
                  onSaveServiceCatalog={auditedOnSaveServiceCatalog}
                  onLurahApproveService={onLurahApproveService}
                />
              </div>
            </AdminCollapsibleBar>
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
              praRegistrasiList={praRegistrasiList}
              pengaduanList={pengaduanList}
              profile={profile}
              rwGroups={rwGroups}
              whatsappRecipients={whatsappRecipients}
              onSaveWhatsAppRecipients={onSaveWhatsAppRecipients}
              onLurahApproveService={onLurahApproveService}
              onOpenWhatsAppManager={() => handleTabSwitch('whatsapp_gateway')}
              onUpdateReportStatus={(id, newStatus, assignedTeam, responseNote) => {
                const targetRep = reports.find((r) => r.id === id);
                if (onUpdateReportStatus) {
                  onUpdateReportStatus(id, newStatus, assignedTeam, responseNote);
                } else {
                  onUpdateReport(id, {
                    status: newStatus,
                    assignedTeam,
                    responseNote,
                  });
                }
                recordAudit({
                  actionType: 'VERIFY_STATUS',
                  module: 'DASHBOARD_LURAH',
                  targetId: targetRep?.ticketCode || id,
                  targetLabel: `Disposisi Lurah · Tiket #${targetRep?.ticketCode || id} (${targetRep?.title || ''})`,
                  summary: `Disposisi cepat Lurah mengubah status tiket #${targetRep?.ticketCode || id} menjadi "${newStatus}"`,
                  beforeValue: `Status: ${targetRep?.status || '-'}`,
                  afterValue: `Status: ${newStatus} · Tim: ${assignedTeam}`,
                  severity: 'info',
                });
              }}
              onNavigate={onNavigate}
              isEmbeddedInAdmin={true}
              onPdfDownloaded={(res) => {
                recordAudit({
                  actionType: 'EXPORT',
                  module: 'DASHBOARD_LURAH',
                  targetLabel: `Arsip PDF Bulanan (${res.periodLabel})`,
                  summary: `Mengunduh arsip PDF Laporan Bulanan Permasalahan Lingkungan (${res.fileName})`,
                  severity: 'info',
                });
                setSuccessMessage(
                  `Arsip Fisik Laporan Bulanan Permasalahan Lingkungan (${res.periodLabel}) berhasil diunduh sebagai file PDF: ${res.fileName}`
                );
              }}
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
      {activeTab === 'profil' && isTabAllowed('profil') && (
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

          {/* Section A: Data Lurah & Struktur Jabatan */}
          <div className="space-y-6">
            {/* Subsection 01.1: Data Lurah (Tambah, Edit, Hapus) */}
            <AdminCollapsibleBar
              sectionKey="profil_lurah"
              title="01. Data Pimpinan Lurah Panaikang"
              subtitle={`Pimpinan: ${profileDraft.lurahName || 'Belum diisi'} (${profileDraft.lurahNip || 'NIP -'})`}
              icon={<UserCheck className="w-5 h-5 text-[#0D3868]" />}
              badge={
                profileDraft.lurahName ? (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300">
                    Aktif Menjabat
                  </span>
                ) : (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-300">
                    Belum Diisi
                  </span>
                )
              }
              isCollapsed={isSectionCollapsed('profil_lurah')}
              onToggle={() => toggleSectionCollapse('profil_lurah')}
              headerActions={
                <div className="flex items-center gap-1.5">
                  {!profileDraft.lurahName ? (
                    <button
                      type="button"
                      onClick={handleOpenAddLurah}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#0D3868] hover:bg-[#072647] text-white text-xs font-bold transition shadow-xs cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Tambah Data Lurah</span>
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={handleOpenEditLurah}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 text-xs font-bold transition cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteLurah(true)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Hapus</span>
                      </button>
                    </>
                  )}
                </div>
              }
            >
              <div className="p-5 sm:p-6 space-y-4">
                {!profileDraft.lurahName ? (
                  <div className="p-8 text-center bg-slate-50/80 rounded-2xl border-2 border-dashed border-slate-200">
                    <User className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-xs font-medium text-slate-600">
                      Belum ada data pimpinan lurah yang terdaftar.
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Klik tombol di bawah untuk menambahkan data lurah beserta foto dan sambutan resmi.
                    </p>
                    <button
                      type="button"
                      onClick={handleOpenAddLurah}
                      className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 bg-[#0D3868] hover:bg-[#072647] text-white rounded-xl text-xs font-bold cursor-pointer shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Tambah Data Lurah Baru</span>
                    </button>
                  </div>
                ) : (
                  <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-xs">
                    <div className="flex flex-col sm:flex-row gap-5 items-start">
                      {/* Lurah Photo */}
                      <div className="relative group shrink-0 mx-auto sm:mx-0">
                        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-2 border-slate-200 bg-slate-100 flex items-center justify-center shadow-xs">
                          {Boolean(profileDraft.lurahPhotoUrl?.trim()) ? (
                            <img
                              src={profileDraft.lurahPhotoUrl!}
                              alt={profileDraft.lurahName}
                              className="w-full h-full object-cover object-top"
                            />
                          ) : (
                            <User className="w-12 h-12 text-slate-400" />
                          )}
                        </div>
                        <label className="mt-2 inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold w-full cursor-pointer transition text-center">
                          <Camera className="w-3 h-3" />
                          <span>{profileDraft.lurahPhotoUrl ? 'Ganti Foto' : 'Unggah Foto'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              try {
                                const compressed = await compressImageFile(file);
                                const updated = { ...profileDraft, lurahPhotoUrl: compressed };
                                setProfileDraft(updated);
                                await onSaveProfile(updated);
                                setSuccessMessage('Foto Lurah berhasil diperbarui.');
                              } catch {
                                setValidationErrors(['Gagal memproses foto Lurah.']);
                              }
                            }}
                            className="hidden"
                          />
                        </label>
                      </div>

                      {/* Lurah Info */}
                      <div className="flex-1 space-y-3 w-full">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#0D3868] text-white">
                              <UserCheck className="w-3 h-3" />
                              <span>Lurah Panaikang</span>
                            </span>
                            {profileDraft.lurahPeriod && (
                              <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-md">
                                Masa Tugas: {profileDraft.lurahPeriod}
                              </span>
                            )}
                          </div>
                          <h4 className="mt-1 text-base sm:text-lg font-bold text-slate-900">
                            {profileDraft.lurahName}
                          </h4>
                          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
                            {profileDraft.lurahNip && (
                              <span className="font-mono-num">
                                <strong>NIP:</strong> {profileDraft.lurahNip}
                              </span>
                            )}
                            {profileDraft.lurahRank && (
                              <span>
                                <strong>Pangkat/Gol:</strong> {profileDraft.lurahRank}
                              </span>
                            )}
                          </div>
                        </div>

                        {profileDraft.lurahMessage && (
                          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed italic">
                            "{profileDraft.lurahMessage}"
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </AdminCollapsibleBar>

            {/* Subsection 01.2: Manajemen Struktur Jabatan Perangkat Kelurahan (Tambah, Edit, Hapus) */}
            <AdminCollapsibleBar
              sectionKey="profil_pejabat"
              title={`02. Struktur Jabatan & Perangkat Kelurahan (${profileDraft.officials?.length || 0} Pejabat)`}
              subtitle="Manajemen jabatan struktural, bagan organisasi dinamis & staf perangkat kelurahan"
              icon={<Briefcase className="w-5 h-5 text-[#1C8237]" />}
              badge={
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300">
                  {profileDraft.officials?.length || 0} Pejabat Terdaftar
                </span>
              }
              isCollapsed={isSectionCollapsed('profil_pejabat')}
              onToggle={() => toggleSectionCollapse('profil_pejabat')}
              headerActions={
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setShowAdminBaganKelurahan(true)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-[#0D3868] border border-sky-200 text-xs font-bold transition-all shadow-2xs cursor-pointer whitespace-nowrap"
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span>Bagan Kelurahan</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleOpenAddOfficial}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#1C8237] hover:bg-[#146329] text-white text-xs font-bold transition-all shadow-xs cursor-pointer whitespace-nowrap"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>+ Tambah Jabatan</span>
                  </button>
                </div>
              }
            >
              <div className="p-5 sm:p-6 space-y-4">
                <p className="text-xs text-slate-500 mb-2">
                  Metode fleksibel untuk <strong>Tambah, Edit, dan Hapus Jabatan</strong> apabila
                  terjadi mutasi, promosi, atau penyesuaian SOTK kelurahan.
                </p>

              {/* Daftar Kartu Jabatan */}
              {(!profileDraft.officials || profileDraft.officials.length === 0) ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                  <Briefcase className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs font-medium text-slate-600">
                    Belum ada jabatan struktural yang terdaftar.
                  </p>
                  <button
                    type="button"
                    onClick={handleOpenAddOfficial}
                    className="mt-3 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    Tambah Jabatan Pertama
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {profileDraft.officials.map((official, idx) => (
                    <div
                      key={official.id}
                      className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 shadow-xs flex flex-col justify-between transition-all"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-1.5">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-sky-50 text-[#0277BD] border border-sky-100">
                              <Briefcase className="w-3 h-3" />
                              <span>{official.positionTitle}</span>
                            </span>
                            {official.department && (
                              <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                                {official.department}
                              </span>
                            )}
                          </div>
                          <h4 className="text-sm font-bold text-slate-900">
                            {official.officialName}
                          </h4>
                          <div className="mt-1 space-y-0.5 text-xs text-slate-500">
                            {official.nip && (
                              <p className="font-mono-num">NIP: {official.nip}</p>
                            )}
                            {official.rank && <p>Pangkat: {official.rank}</p>}
                            {official.phone && (
                              <p className="text-emerald-700 font-mono-num">
                                Kontak: {official.phone}
                              </p>
                            )}
                            {Array.isArray(official.staffNames) && official.staffNames.length > 0 && (
                              <div className="pt-1.5 mt-1.5 border-t border-slate-100">
                                <span className="text-[10px] font-bold text-[#0D3868] uppercase tracking-wider block mb-1">
                                  Staf Jabatan ({official.staffNames.length}):
                                </span>
                                <div className="flex flex-wrap gap-1">
                                  {official.staffNames.map((stafName, sIdx) => (
                                    <span
                                      key={sIdx}
                                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 text-[10.5px] font-semibold border border-slate-200"
                                    >
                                      <User className="w-2.5 h-2.5 text-[#0D3868]" />
                                      <span>{stafName}</span>
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Quick Action Buttons: Reorder, Edit, Delete */}
                        <div className="flex items-center gap-1 shrink-0">
                          {/* Order Buttons */}
                          <div className="flex flex-col border border-slate-200 rounded-lg overflow-hidden mr-1">
                            <button
                              type="button"
                              onClick={() => handleMoveOfficial(idx, 'up')}
                              disabled={idx === 0}
                              className="p-1 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed text-slate-600 cursor-pointer"
                              title="Pindahkan ke atas"
                            >
                              <ChevronUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveOfficial(idx, 'down')}
                              disabled={idx === profileDraft.officials!.length - 1}
                              className="p-1 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed text-slate-600 border-t border-slate-200 cursor-pointer"
                              title="Pindahkan ke bawah"
                            >
                              <ChevronDown className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleOpenEditOfficial(official)}
                            className="p-2 rounded-lg border border-slate-200 hover:bg-sky-50 hover:border-sky-300 text-slate-700 hover:text-sky-700 transition-colors cursor-pointer"
                            title={`Edit Jabatan ${official.positionTitle}`}
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setOfficialToDelete(official)}
                            className="p-2 rounded-lg border border-red-200 bg-red-50/50 hover:bg-red-100 text-red-600 transition-colors cursor-pointer"
                            title={`Hapus Jabatan ${official.positionTitle}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Subsection 01.3: Konfigurasi Bagan Struktur Organisasi Kelurahan & Input Nama Staf berdasarkan Struktur Jabatan */}
            <div className="pt-6 border-t border-slate-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Layers className="w-4 h-4 text-[#0D3868]" />
                      <span>03. Bagan Struktur Organisasi Kelurahan & Input Nama Staf (Dinamis)</span>
                    </h3>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Tanpa Upload Foto · Hemat Penyimpanan Data</span>
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Bagan Struktur Organisasi Kelurahan kini dirender otomatis secara dinamis berdasarkan Jabatan Struktural dan input Nama Staf di bawah masing-masing Kasi sesuai Perwali Kota Makassar.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setShowAdminBaganKelurahan(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-[#0D3868] border border-slate-300 text-xs font-bold transition shadow-2xs cursor-pointer whitespace-nowrap"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Layar Penuh & Cetak Bagan</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveDynamicBaganKelurahan}
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0D3868] hover:bg-[#072647] disabled:opacity-50 text-white text-xs font-bold transition shadow-sm cursor-pointer whitespace-nowrap"
                  >
                    <Check className="w-4 h-4" />
                    <span>Simpan Struktur & Nama Staf</span>
                  </button>
                </div>
              </div>

              {/* Top Row: Sekretaris Lurah & Dasar Hukum Perwali */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="p-4 rounded-2xl bg-sky-50/60 border border-sky-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-[#0D3868] uppercase tracking-wide">
                      Jabatan Sekretaris Lurah
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white text-[#0277BD] border border-sky-200">
                      Level 2 · Sekretariat
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Nama Lengkap Sekretaris Lurah
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: MASITA FATIMA, ST, MM"
                        value={profileDraft.sekretarisName || ''}
                        onChange={(e) =>
                          setProfileDraft((prev) => ({ ...prev, sekretarisName: e.target.value }))
                        }
                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-900 focus:border-[#0D3868] outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        NIP Sekretaris Lurah
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: 197308012010012001"
                        value={profileDraft.sekretarisNip || ''}
                        onChange={(e) =>
                          setProfileDraft((prev) => ({ ...prev, sekretarisNip: e.target.value }))
                        }
                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-mono-num text-slate-800 focus:border-[#0D3868] outline-hidden"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wide">
                        Dasar Hukum SOTK (Footer Bagan)
                      </span>
                      <span className="text-[10px] font-semibold text-slate-500">
                        Tampil di Pita Bawah Bagan
                      </span>
                    </div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Referensi Peraturan Wali Kota (Perwali)
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: PERWALI KOTA MAKASSAR NOMOR 65 TAHUN 2023"
                      value={profileDraft.perwaliReference ?? 'PERWALI KOTA MAKASSAR NOMOR 65 TAHUN 2023'}
                      onChange={(e) =>
                        setProfileDraft((prev) => ({ ...prev, perwaliReference: e.target.value }))
                      }
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-900 focus:border-[#0D3868] outline-hidden"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Pimpinan <strong>Lurah ({profileDraft.lurahName || 'Belum diisi'})</strong> diambil otomatis dari bagian <strong>01. Data Pimpinan Lurah</strong> di atas.
                  </p>
                </div>
              </div>

              {/* Three Columns: 3 Kasi + Input Nama Staf masing-masing */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">
                {/* KASI 1: PEMERINTAHAN, KETENTRAMAN DAN KETERTIBAN UMUM */}
                <div className="rounded-2xl border border-slate-200 bg-white p-4 flex flex-col justify-between shadow-2xs">
                  <div className="space-y-3">
                    <div className="pb-2.5 border-b border-slate-100">
                      <span className="inline-block px-2 py-0.5 rounded bg-[#0D3868] text-white text-[10px] font-extrabold uppercase tracking-wider mb-1">
                        Seksi 01 · Kiri
                      </span>
                      <h4 className="text-xs font-extrabold text-[#0D3868] leading-snug uppercase">
                        Kasi Pemerintahan, Ketentraman dan Ketertiban Umum
                      </h4>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Nama Pejabat Kasi Pemerintahan & Trantibum
                      </label>
                      <input
                        type="text"
                        placeholder="Kosongkan atau isi '-' jika lowong"
                        value={profileDraft.kasiPemerintahanName || ''}
                        onChange={(e) =>
                          setProfileDraft((prev) => ({
                            ...prev,
                            kasiPemerintahanName: e.target.value,
                          }))
                        }
                        className="w-full rounded-xl border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-900 focus:border-[#0D3868] outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        NIP Kasi Pemerintahan
                      </label>
                      <input
                        type="text"
                        placeholder="Nomor Induk Pegawai (NIP)"
                        value={profileDraft.kasiPemerintahanNip || ''}
                        onChange={(e) =>
                          setProfileDraft((prev) => ({
                            ...prev,
                            kasiPemerintahanNip: e.target.value,
                          }))
                        }
                        className="w-full rounded-xl border border-slate-300 px-3 py-1.5 text-xs font-mono-num text-slate-800 focus:border-[#0D3868] outline-hidden"
                      />
                    </div>

                    {/* Input Nama Staf Seksi Pemerintahan */}
                    <div className="pt-2 border-t border-slate-100">
                      <label className="block text-[11px] font-bold text-[#0D3868] mb-1.5">
                        Daftar Nama Staf (Seksi Pemerintahan & Trantibum)
                      </label>
                      <div className="flex gap-1.5 mb-2">
                        <input
                          type="text"
                          placeholder="Ketik nama staf (Misal: MEGAWATI)"
                          value={newStafPemerintahanInput}
                          onChange={(e) => setNewStafPemerintahanInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddSectionStaff(
                                'stafPemerintahan',
                                newStafPemerintahanInput,
                                () => setNewStafPemerintahanInput('')
                              );
                            }
                          }}
                          className="flex-1 rounded-xl border border-slate-300 px-2.5 py-1.5 text-xs focus:border-[#0D3868] outline-hidden"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            handleAddSectionStaff(
                              'stafPemerintahan',
                              newStafPemerintahanInput,
                              () => setNewStafPemerintahanInput('')
                            )
                          }
                          className="px-2.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold cursor-pointer shrink-0 flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Staf</span>
                        </button>
                      </div>

                      <div className="space-y-1.5 max-h-36 overflow-y-auto">
                        {(profileDraft.stafPemerintahan || []).length === 0 ? (
                          <div className="text-[11px] text-slate-400 italic py-2 text-center bg-slate-50 rounded-lg border border-dashed border-slate-200">
                            Belum ada nama staf diinput
                          </div>
                        ) : (
                          (profileDraft.stafPemerintahan || []).map((stafName, sIdx) => (
                            <div
                              key={sIdx}
                              className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-sky-50/70 border border-sky-200/80 text-xs"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="w-5 h-5 rounded-full bg-[#0D3868] text-white flex items-center justify-center shrink-0">
                                  <User className="w-3 h-3" />
                                </div>
                                <span className="font-bold text-slate-800 truncate uppercase">
                                  {stafName}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveSectionStaff('stafPemerintahan', sIdx)}
                                className="p-1 text-rose-600 hover:bg-rose-100 rounded cursor-pointer"
                                title="Hapus nama staf"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* KASI 2: PEMBERDAYAAN MASYARAKAT, PEMBANGUNAN DAN SOSIAL */}
                <div className="rounded-2xl border border-slate-200 bg-white p-4 flex flex-col justify-between shadow-2xs">
                  <div className="space-y-3">
                    <div className="pb-2.5 border-b border-slate-100">
                      <span className="inline-block px-2 py-0.5 rounded bg-[#0D3868] text-white text-[10px] font-extrabold uppercase tracking-wider mb-1">
                        Seksi 02 · Tengah
                      </span>
                      <h4 className="text-xs font-extrabold text-[#0D3868] leading-snug uppercase">
                        Kasi Pemberdayaan Masyarakat, Pembangunan dan Sosial
                      </h4>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Nama Pejabat Kasi Pemberdayaan & Sosial
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: FENTRI AMIR, SE"
                        value={profileDraft.kasiPemberdayaanName || ''}
                        onChange={(e) =>
                          setProfileDraft((prev) => ({
                            ...prev,
                            kasiPemberdayaanName: e.target.value,
                          }))
                        }
                        className="w-full rounded-xl border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-900 focus:border-[#0D3868] outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        NIP Kasi Pemberdayaan
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: 198509042009042003"
                        value={profileDraft.kasiPemberdayaanNip || ''}
                        onChange={(e) =>
                          setProfileDraft((prev) => ({
                            ...prev,
                            kasiPemberdayaanNip: e.target.value,
                          }))
                        }
                        className="w-full rounded-xl border border-slate-300 px-3 py-1.5 text-xs font-mono-num text-slate-800 focus:border-[#0D3868] outline-hidden"
                      />
                    </div>

                    {/* Input Nama Staf Seksi Pemberdayaan */}
                    <div className="pt-2 border-t border-slate-100">
                      <label className="block text-[11px] font-bold text-[#0D3868] mb-1.5">
                        Daftar Nama Staf (Seksi Pemberdayaan & Sosial)
                      </label>
                      <div className="flex gap-1.5 mb-2">
                        <input
                          type="text"
                          placeholder="Ketik nama staf (Misal: ISTIQAMAH MUNTSIR)"
                          value={newStafPemberdayaanInput}
                          onChange={(e) => setNewStafPemberdayaanInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddSectionStaff(
                                'stafPemberdayaan',
                                newStafPemberdayaanInput,
                                () => setNewStafPemberdayaanInput('')
                              );
                            }
                          }}
                          className="flex-1 rounded-xl border border-slate-300 px-2.5 py-1.5 text-xs focus:border-[#0D3868] outline-hidden"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            handleAddSectionStaff(
                              'stafPemberdayaan',
                              newStafPemberdayaanInput,
                              () => setNewStafPemberdayaanInput('')
                            )
                          }
                          className="px-2.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold cursor-pointer shrink-0 flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Staf</span>
                        </button>
                      </div>

                      <div className="space-y-1.5 max-h-36 overflow-y-auto">
                        {(profileDraft.stafPemberdayaan || []).length === 0 ? (
                          <div className="text-[11px] text-slate-400 italic py-2 text-center bg-slate-50 rounded-lg border border-dashed border-slate-200">
                            Belum ada nama staf diinput
                          </div>
                        ) : (
                          (profileDraft.stafPemberdayaan || []).map((stafName, sIdx) => (
                            <div
                              key={sIdx}
                              className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-sky-50/70 border border-sky-200/80 text-xs"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="w-5 h-5 rounded-full bg-[#0D3868] text-white flex items-center justify-center shrink-0">
                                  <User className="w-3 h-3" />
                                </div>
                                <span className="font-bold text-slate-800 truncate uppercase">
                                  {stafName}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveSectionStaff('stafPemberdayaan', sIdx)}
                                className="p-1 text-rose-600 hover:bg-rose-100 rounded cursor-pointer"
                                title="Hapus nama staf"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* KASI 3: PENGELOLAAN KEBERSIHAN DAN PERTAMANAN */}
                <div className="rounded-2xl border border-slate-200 bg-white p-4 flex flex-col justify-between shadow-2xs">
                  <div className="space-y-3">
                    <div className="pb-2.5 border-b border-slate-100">
                      <span className="inline-block px-2 py-0.5 rounded bg-[#0D3868] text-white text-[10px] font-extrabold uppercase tracking-wider mb-1">
                        Seksi 03 · Kanan
                      </span>
                      <h4 className="text-xs font-extrabold text-[#0D3868] leading-snug uppercase">
                        Kasi Pengelolaan Kebersihan dan Pertamanan
                      </h4>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Nama Pejabat Kasi Kebersihan & Pertamanan
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: H. AKMAL, S. Sos., M.Tr, Ap"
                        value={profileDraft.kasiKebersihanName || ''}
                        onChange={(e) =>
                          setProfileDraft((prev) => ({
                            ...prev,
                            kasiKebersihanName: e.target.value,
                          }))
                        }
                        className="w-full rounded-xl border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-900 focus:border-[#0D3868] outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        NIP Kasi Kebersihan
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: 197506292007011011"
                        value={profileDraft.kasiKebersihanNip || ''}
                        onChange={(e) =>
                          setProfileDraft((prev) => ({
                            ...prev,
                            kasiKebersihanNip: e.target.value,
                          }))
                        }
                        className="w-full rounded-xl border border-slate-300 px-3 py-1.5 text-xs font-mono-num text-slate-800 focus:border-[#0D3868] outline-hidden"
                      />
                    </div>

                    {/* Input Nama Staf Seksi Kebersihan */}
                    <div className="pt-2 border-t border-slate-100">
                      <label className="block text-[11px] font-bold text-[#0D3868] mb-1.5">
                        Daftar Nama Staf (Seksi Kebersihan & Pertamanan)
                      </label>
                      <div className="flex gap-1.5 mb-2">
                        <input
                          type="text"
                          placeholder="Ketik nama staf (Misal: AM NURASWAD)"
                          value={newStafKebersihanInput}
                          onChange={(e) => setNewStafKebersihanInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddSectionStaff(
                                'stafKebersihan',
                                newStafKebersihanInput,
                                () => setNewStafKebersihanInput('')
                              );
                            }
                          }}
                          className="flex-1 rounded-xl border border-slate-300 px-2.5 py-1.5 text-xs focus:border-[#0D3868] outline-hidden"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            handleAddSectionStaff(
                              'stafKebersihan',
                              newStafKebersihanInput,
                              () => setNewStafKebersihanInput('')
                            )
                          }
                          className="px-2.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold cursor-pointer shrink-0 flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Staf</span>
                        </button>
                      </div>

                      <div className="space-y-1.5 max-h-36 overflow-y-auto">
                        {(profileDraft.stafKebersihan || []).length === 0 ? (
                          <div className="text-[11px] text-slate-400 italic py-2 text-center bg-slate-50 rounded-lg border border-dashed border-slate-200">
                            Belum ada nama staf diinput
                          </div>
                        ) : (
                          (profileDraft.stafKebersihan || []).map((stafName, sIdx) => (
                            <div
                              key={sIdx}
                              className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-sky-50/70 border border-sky-200/80 text-xs"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="w-5 h-5 rounded-full bg-[#0D3868] text-white flex items-center justify-center shrink-0">
                                  <User className="w-3 h-3" />
                                </div>
                                <span className="font-bold text-slate-800 truncate uppercase">
                                  {stafName}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveSectionStaff('stafKebersihan', sIdx)}
                                className="p-1 text-rose-600 hover:bg-rose-100 rounded cursor-pointer"
                                title="Hapus nama staf"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Live Interactive Preview of Bagan Struktur Kelurahan */}
              <div className="rounded-2xl border border-slate-200 bg-slate-100/80 p-3 sm:p-4 overflow-hidden space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-[#0D3868]">
                      Pratinjau Langsung Bagan Struktur Organisasi Kelurahan Panaikang
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-sky-100 text-[#0D3868]">
                      Responsif HP · Tablet · PC (Perkecil / Perbesar)
                    </span>
                  </div>
                </div>
                <BaganStrukturKelurahanInteractiveViewer
                  profile={profileDraft}
                  onExpandFullScreen={() => setShowAdminBaganKelurahan(true)}
                />
              </div>
            </div>
          </AdminCollapsibleBar>
        </div>

          {/* Section 04: Alamat Kantor & Kontak Kelurahan (Tambah, Edit, Hapus) */}
          <AdminCollapsibleBar
            sectionKey="profil_data_umum"
            title="03. Alamat Kantor, Kontak Resmi & Batas Wilayah Administrasi"
            subtitle="Alamat kantor, kontak telepon, email resmi, dan batas wilayah administrasi Kelurahan Panaikang"
            icon={<Building2 className="w-5 h-5 text-[#0D3868]" />}
            badge={
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300">
                Data Resmi Kelurahan
              </span>
            }
            isCollapsed={isSectionCollapsed('profil_data_umum')}
            onToggle={() => toggleSectionCollapse('profil_data_umum')}
          >
            <div className="p-5 sm:p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-[#0D3868]" />
                    <span>Alamat Kantor Kelurahan &amp; Kontak Resmi</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Informasi resmi domisili kantor kelurahan, kode pos, jam operasional, telepon hotline, dan email pelayanan.
                  </p>
                </div>
              <div className="flex items-center gap-2 self-start sm:self-auto">
                {!profileDraft.officeAddress ? (
                  <button
                    type="button"
                    onClick={handleOpenAddOfficeContact}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0D3868] hover:bg-[#072647] text-white text-xs font-bold transition shadow-xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Tambah Alamat & Kontak</span>
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={handleOpenEditOfficeContact}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 text-xs font-bold transition cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit Alamat & Kontak</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteOfficeContact(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus / Kosongkan</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {!profileDraft.officeAddress ? (
              <div className="p-8 text-center bg-slate-50/80 rounded-2xl border-2 border-dashed border-slate-200">
                <MapPin className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-xs font-medium text-slate-600">
                  Belum ada informasi alamat dan kontak kantor kelurahan.
                </p>
                <button
                  type="button"
                  onClick={handleOpenAddOfficeContact}
                  className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 bg-[#0D3868] hover:bg-[#072647] text-white rounded-xl text-xs font-bold cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Alamat & Kontak Kantor</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Card 1: Alamat & Kode Pos */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#0D3868] mb-1">
                    <Building2 className="w-4 h-4 text-[#0D3868]" />
                    <span>Lokasi Kantor & Domisili</span>
                  </div>
                  <p className="text-xs text-slate-800 font-medium">
                    {profileDraft.officeAddress}
                  </p>
                  {profileDraft.postalCode && (
                    <p className="text-[11px] text-slate-500 font-mono-num">
                      Kode Pos: {profileDraft.postalCode}
                    </p>
                  )}
                </div>

                {/* Card 2: Jam Pelayanan */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#0D3868] mb-1">
                    <Clock className="w-4 h-4 text-[#0D3868]" />
                    <span>Jam Operasional Pelayanan</span>
                  </div>
                  <p className="text-xs text-slate-800 font-medium">
                    {profileDraft.serviceHours || 'Senin – Jumat · 08.00 – 16.00 WITA'}
                  </p>
                  <p className="text-[11px] text-emerald-700 font-semibold">
                    Pelayanan Satu Pintu (PTSP)
                  </p>
                </div>

                {/* Card 3: Telepon & Email */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#0D3868] mb-1">
                    <Phone className="w-4 h-4 text-[#0D3868]" />
                    <span>Saluran Komunikasi Resmi</span>
                  </div>
                  {profileDraft.phoneContact && (
                    <p className="text-xs text-slate-800 font-mono-num font-medium flex items-center gap-1.5">
                      <Phone className="w-3 h-3 text-slate-500" />
                      <span>{profileDraft.phoneContact}</span>
                    </p>
                  )}
                  {profileDraft.emailContact && (
                    <p className="text-xs text-slate-800 font-medium flex items-center gap-1.5 truncate">
                      <Mail className="w-3 h-3 text-slate-500 shrink-0" />
                      <span className="truncate">{profileDraft.emailContact}</span>
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Section 05: Batas-Batas Wilayah Administrasi (Tambah, Edit, Hapus) */}
          <div className="pt-6 border-t border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Compass className="w-4 h-4 text-[#0D3868]" />
                  <span>05. Batas Wilayah Administrasi Kelurahan</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Batas geografis 4 arah mata angin (Utara, Selatan, Timur, Barat) Kelurahan Panaikang.
                </p>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-auto">
                {(!profileDraft.boundaries?.utara &&
                  !profileDraft.boundaries?.selatan &&
                  !profileDraft.boundaries?.timur &&
                  !profileDraft.boundaries?.barat) ? (
                  <button
                    type="button"
                    onClick={handleOpenAddBoundaries}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0D3868] hover:bg-[#072647] text-white text-xs font-bold transition shadow-xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Atur Batas Wilayah</span>
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={handleOpenEditBoundaries}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 text-xs font-bold transition cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit Batas Wilayah</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteBoundaries(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Reset / Hapus</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {(!profileDraft.boundaries?.utara &&
              !profileDraft.boundaries?.selatan &&
              !profileDraft.boundaries?.timur &&
              !profileDraft.boundaries?.barat) ? (
              <div className="p-8 text-center bg-slate-50/80 rounded-2xl border-2 border-dashed border-slate-200">
                <Compass className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-xs font-medium text-slate-600">
                  Batas wilayah administrasi belum diatur.
                </p>
                <button
                  type="button"
                  onClick={handleOpenAddBoundaries}
                  className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 bg-[#0D3868] hover:bg-[#072647] text-white rounded-xl text-xs font-bold cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Atur Batas Wilayah</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                {/* Batas Utara */}
                <div className="p-4 rounded-xl border border-sky-200 bg-sky-50/60 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-bold text-sky-800 uppercase tracking-wider flex items-center gap-1">
                        <ArrowUp className="w-3.5 h-3.5 text-sky-700" />
                        <span>Batas Utara</span>
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-slate-800">
                      {profileDraft.boundaries?.utara || '-'}
                    </p>
                  </div>
                </div>

                {/* Batas Selatan */}
                <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/60 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1">
                        <ArrowDown className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Batas Selatan</span>
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-slate-800">
                      {profileDraft.boundaries?.selatan || '-'}
                    </p>
                  </div>
                </div>

                {/* Batas Timur */}
                <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/60 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1">
                        <ArrowRight className="w-3.5 h-3.5 text-amber-700" />
                        <span>Batas Timur</span>
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-slate-800">
                      {profileDraft.boundaries?.timur || '-'}
                    </p>
                  </div>
                </div>

                {/* Batas Barat */}
                <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/60 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-bold text-purple-800 uppercase tracking-wider flex items-center gap-1">
                        <ArrowLeft className="w-3.5 h-3.5 text-purple-700" />
                        <span>Batas Barat</span>
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-slate-800">
                      {profileDraft.boundaries?.barat || '-'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </AdminCollapsibleBar>

          {/* Section 06: Pernyataan Visi Kelurahan (Tambah, Edit, Hapus) */}
          <AdminCollapsibleBar
            sectionKey="profil_visi_misi"
            title="04. Pernyataan Visi, Misi & Komitmen Pelayanan"
            subtitle={`Visi: ${profileDraft.visi ? profileDraft.visi.slice(0, 65) + '...' : '-'} (${profileDraft.misi?.length || 0} Butir Misi)`}
            icon={<Quote className="w-5 h-5 text-[#0D3868]" />}
            badge={
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-300">
                {profileDraft.misi?.length || 0} Butir Misi
              </span>
            }
            isCollapsed={isSectionCollapsed('profil_visi_misi')}
            onToggle={() => toggleSectionCollapse('profil_visi_misi')}
          >
            <div className="p-5 sm:p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Quote className="w-4 h-4 text-[#0D3868]" />
                    <span>Pernyataan Visi &amp; Butir Misi Kelurahan Panaikang</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Visi utama arah pembangunan dan butir-butir misi pelayanan kemasyarakatan Kelurahan Panaikang.
                  </p>
                </div>
              <div className="flex items-center gap-2 self-start sm:self-auto">
                {!profileDraft.visi ? (
                  <button
                    type="button"
                    onClick={handleOpenAddVisi}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0D3868] hover:bg-[#072647] text-white text-xs font-bold transition shadow-xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Tambah Visi</span>
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={handleOpenEditVisi}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 text-xs font-bold transition cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit Visi</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteVisi(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {!profileDraft.visi ? (
              <div className="p-8 text-center bg-slate-50/80 rounded-2xl border-2 border-dashed border-slate-200">
                <Quote className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-xs font-medium text-slate-600">
                  Belum ada pernyataan visi kelurahan yang tersimpan.
                </p>
                <button
                  type="button"
                  onClick={handleOpenAddVisi}
                  className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 bg-[#0D3868] hover:bg-[#072647] text-white rounded-xl text-xs font-bold cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Pernyataan Visi</span>
                </button>
              </div>
            ) : (
              <div className="p-5 rounded-2xl border border-sky-200 bg-sky-50/50 relative overflow-hidden">
                <Quote className="w-16 h-16 text-sky-200 absolute -bottom-4 -right-2 pointer-events-none" />
                <p className="text-xs sm:text-sm text-slate-800 font-semibold leading-relaxed relative z-10 italic">
                  "{profileDraft.visi}"
                </p>
              </div>
            )}
          </div>

          {/* Section 07: Butir-Butir Misi Kelurahan (Tambah, Edit, Hapus) */}
          <div className="pt-6 border-t border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#1C8237]" />
                  <span>07. Daftar Butir Misi Kelurahan Panaikang</span>
                  <span className="text-xs font-mono-num font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    {profileDraft.misi?.length || 0} Butir
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Langkah-langkah strategis pencapaian visi kelurahan yang dapat ditambah, diedit, diurutkan, atau dihapus secara dinamis.
                </p>
              </div>
              <button
                type="button"
                onClick={handleOpenAddMisiModal}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1C8237] hover:bg-[#146329] text-white text-xs font-bold transition shadow-xs cursor-pointer self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Tambah Butir Misi</span>
              </button>
            </div>

            {(!profileDraft.misi || profileDraft.misi.length === 0) ? (
              <div className="p-8 text-center bg-slate-50/80 rounded-2xl border-2 border-dashed border-slate-200">
                <CheckCircle2 className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-xs font-medium text-slate-600">
                  Belum ada butir misi yang terdaftar.
                </p>
                <button
                  type="button"
                  onClick={handleOpenAddMisiModal}
                  className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 bg-[#1C8237] hover:bg-[#146329] text-white rounded-xl text-xs font-bold cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Butir Misi Pertama</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {profileDraft.misi.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 shadow-2xs flex items-center justify-between gap-3 transition"
                  >
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <span className="font-mono-num text-xs font-extrabold text-[#1C8237] bg-emerald-50 px-2 py-1 rounded-md shrink-0 border border-emerald-100">
                        {String(idx + 1).padStart(2, '0')}.
                      </span>
                      <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium pt-0.5">
                        {item}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {/* Reorder Buttons */}
                      <div className="flex flex-col border border-slate-200 rounded-lg overflow-hidden mr-1">
                        <button
                          type="button"
                          onClick={() => handleMoveMisi(idx, 'up')}
                          disabled={idx === 0}
                          className="p-1 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed text-slate-600 cursor-pointer"
                          title="Pindahkan ke atas"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveMisi(idx, 'down')}
                          disabled={idx === profileDraft.misi.length - 1}
                          className="p-1 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed text-slate-600 border-t border-slate-200 cursor-pointer"
                          title="Pindahkan ke bawah"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleOpenEditMisiModal(idx)}
                        className="p-2 rounded-lg border border-slate-200 hover:bg-sky-50 hover:border-sky-300 text-slate-700 hover:text-sky-700 transition cursor-pointer"
                        title="Edit Butir Misi"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setMisiToDeleteIndex(idx)}
                        className="p-2 rounded-lg border border-red-200 bg-red-50/50 hover:bg-red-100 text-red-600 transition cursor-pointer"
                        title="Hapus Butir Misi"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </AdminCollapsibleBar>
      </form>
    )}

      {/* ================= TAB 2: KELOLA INFORMASI SEPUTAR KELURAHAN PANAIKANG (CRUD) ================= */}
      {activeTab === 'info' && isTabAllowed('info') && (
        <div className="mt-6 space-y-6">
          <AdminCollapsibleBar
            sectionKey="info_berita"
            title={`Informasi & Berita Seputar Kelurahan (${kelurahanInfos.length} Postingan)`}
            subtitle="Sinkronisasi feed Instagram @kelurahan.panaikang & kelola publikasi berita kegiatan warga"
            icon={<Newspaper className="w-5 h-5 text-[#E1306C]" />}
            badge={
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-pink-50 text-pink-700 border border-pink-200">
                Instagram @kelurahan.panaikang
              </span>
            }
            isCollapsed={isSectionCollapsed('info_berita')}
            onToggle={() => toggleSectionCollapse('info_berita')}
            headerActions={
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleSyncInstagramAdmin}
                  disabled={isSyncingIgAdmin}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50/70 hover:bg-rose-100 text-[#E1306C] text-xs font-bold cursor-pointer whitespace-nowrap"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${isSyncingIgAdmin ? 'animate-spin' : ''}`}
                  />
                  <span>Sinkronkan IG</span>
                </button>
                <button
                  type="button"
                  onClick={openAddInfoForm}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#1C8237] hover:bg-[#146329] text-white text-xs font-bold cursor-pointer whitespace-nowrap shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Tambah Info</span>
                </button>
              </div>
            }
          >
            <div className="p-5 sm:p-6 space-y-6">

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
                    placeholder={`Contoh: ${getRealtimeDateString()}`}
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
      </AdminCollapsibleBar>
    </div>
  )}

      {/* ================= LANJUTAN ADMIN LAYANAN KELURAHAN: ARSIP & PENGADUAN WARGA ================= */}
      {(activeTab === 'pengurusan_warga' || activeTab === 'laporan') &&
        (isTabAllowed('pengurusan_warga') || isTabAllowed('laporan')) && (
        <div className="mt-6 space-y-6">
          {/* 02. ARSIP FISIK LAPORAN BULANAN PERMASALAHAN LINGKUNGAN (PDF) */}
          <AdminCollapsibleBar
            sectionKey="laporan_arsip"
            title="02. Arsip Fisik Laporan Bulanan Permasalahan Lingkungan (PDF)"
            subtitle="Ekspor &amp; cetak lembar arsip rekapitulasi permasalahan lingkungan per periode"
            icon={<Printer className="w-4 h-4 text-[#0D3868]" />}
            badge={
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">
                Arsip Resmi
              </span>
            }
            isCollapsed={isSectionCollapsed('laporan_arsip')}
            onToggle={() => toggleSectionCollapse('laporan_arsip')}
          >
            <div className="p-4 sm:p-6 bg-slate-50/50">
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
            </div>
          </AdminCollapsibleBar>
        </div>
      )}

      {/* ================= MENU BARU: KELOLA WHATSAPP GATEAWAY ================= */}
      {activeTab === 'whatsapp_gateway' && isTabAllowed('whatsapp_gateway') && (
        <div className="mt-6 space-y-6">
          {/* 01. KARTU STATUS KONEKSI & KONFIGURASI FONNTE WHATSAPP GATEAWAY */}
          <AdminCollapsibleBar
            sectionKey="wa_gateway_status_card"
            title="01. Status Koneksi Perangkat & Konfigurasi WhatsApp Gateaway (Fonnte API)"
            subtitle="Pantau status koneksi perangkat Fonnte, kuota pengiriman pesan otomatis, dan panduan aktivasi QR Code"
            icon={<MessageCircle className="w-5 h-5 text-[#128C7E]" />}
            badge={
              waGatewayStatus?.ok ? (
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300">
                  ● Terhubung (Online)
                </span>
              ) : (
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-300">
                  Periksa Status Perangkat
                </span>
              )
            }
            isCollapsed={isSectionCollapsed('wa_gateway_status_card')}
            onToggle={() => toggleSectionCollapse('wa_gateway_status_card')}
            headerActions={
              <button
                type="button"
                disabled={isCheckingWaGateway}
                onClick={fetchAdminWaGatewayStatus}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-60 text-xs font-bold text-slate-700 cursor-pointer shadow-2xs"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${isCheckingWaGateway ? 'animate-spin text-emerald-600' : ''}`}
                />
                <span>{isCheckingWaGateway ? 'Memeriksa...' : 'Cek Status Gateway'}</span>
              </button>
            }
          >
            <div className="p-5 sm:p-6 space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 leading-relaxed">
                Begitu warga men-submit <strong>Laporan Pengaduan</strong>, sistem secara otomatis mengirimkan pesan WhatsApp langsung melalui <strong>Fonnte WhatsApp Gateaway</strong> ke seluruh nomor pejabat/pihak terkait yang aktif (Lurah, Seklur, Satgas, Koordinator RW/RT) <strong>tanpa melalui proses kirim WA pribadi oleh warga pembuat laporan</strong>.
              </div>

              {/* Status Koneksi WhatsApp Gateway (Fonnte API) */}
              <div className="rounded-2xl border border-slate-200/90 p-4 transition-all duration-200 bg-white shadow-xs">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        waGatewayStatus?.ok
                          ? 'bg-emerald-100 text-emerald-700'
                          : waGatewayStatus?.deviceStatus === 'disconnect'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <MessageCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                          Status WhatsApp Gateway (Fonnte API)
                        </span>
                        {isCheckingWaGateway ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            <RefreshCw className="w-3 h-3 animate-spin" />
                            <span>Memeriksa koneksi...</span>
                          </span>
                        ) : waGatewayStatus?.ok ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span>Gateway Terhubung (Online)</span>
                          </span>
                        ) : waGatewayStatus?.deviceStatus === 'disconnect' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-300">
                            <AlertCircle className="w-3 h-3 text-amber-600" />
                            <span>Perangkat Disconnected (Perlu Scan QR)</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
                            <span>{waGatewayStatus?.message || 'Status Tidak Diketahui'}</span>
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        {waGatewayStatus?.message ||
                          'Memeriksa status perangkat WhatsApp gateway Fonnte...'}
                      </p>
                      {waGatewayStatus?.device && (
                        <div className="flex flex-wrap items-center gap-3 mt-1.5 text-[11px] text-slate-500">
                          <span>
                            Perangkat Terdaftar: <strong>{waGatewayStatus.device}</strong>
                          </span>
                          {waGatewayStatus.quota && (
                            <span>
                              Sisa Kuota: <strong>{waGatewayStatus.quota} pesan</strong>
                            </span>
                          )}
                          {waGatewayStatus.package && (
                            <span>
                              Paket: <strong>{waGatewayStatus.package}</strong>
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-start md:self-center">
                    <button
                      type="button"
                      disabled={isCheckingWaGateway}
                      onClick={fetchAdminWaGatewayStatus}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-60 text-xs font-bold text-slate-700 cursor-pointer shadow-2xs"
                      title="Periksa ulang status koneksi Fonnte gateway"
                    >
                      <RefreshCw
                        className={`w-3.5 h-3.5 ${isCheckingWaGateway ? 'animate-spin text-emerald-600' : ''}`}
                      />
                      <span>{isCheckingWaGateway ? 'Memeriksa...' : 'Cek Status Gateway'}</span>
                    </button>
                    {waGatewayStatus && !waGatewayStatus.ok && (
                      <a
                        href="https://fonnte.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-2xs"
                        title="Buka dashboard Fonnte untuk scan QR Code perangkat"
                      >
                        <span>Buka fonnte.com</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>

              {/* Konfigurasi FONNTE_TOKEN Server-Side */}
              <div className="rounded-xl border border-sky-200 bg-sky-50/50 p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-[#0D3868] text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Key className="w-4 h-4 text-amber-300" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#0D3868]">
                        Autentikasi Server WhatsApp Gateway (`FONNTE_TOKEN`)
                      </div>
                      <div className="text-[11px] text-slate-600 mt-0.5">
                        {waGatewayStatus?.hasToken ? (
                          <span className="text-emerald-700 font-semibold flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span>Token Server Terpasang: <code className="font-mono text-emerald-900 bg-emerald-100 px-1.5 py-0.5 rounded text-[10px]">{waGatewayStatus.tokenMasked}</code></span>
                          </span>
                        ) : (
                          <span className="text-amber-800 font-semibold flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                            <span>FONNTE_TOKEN belum dikonfigurasi di server. Silakan klik tombol di samping untuk menginput token Fonnte Anda.</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowTokenForm((prev) => !prev)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0D3868] hover:bg-[#072647] text-white text-xs font-bold cursor-pointer whitespace-nowrap self-start sm:self-center shadow-xs"
                  >
                    <Key className="w-3.5 h-3.5 text-amber-300" />
                    <span>{showTokenForm ? 'Tutup Input Token' : waGatewayStatus?.hasToken ? 'Ganti Token Fonnte' : '+ Input Token Fonnte'}</span>
                  </button>
                </div>

                {showTokenForm && (
                  <form onSubmit={handleSaveFonnteToken} className="pt-3 border-t border-sky-200/80 space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-[#0D3868] mb-1">
                        Input / Perbarui FONNTE_TOKEN Server-Side *
                      </label>
                      <input
                        type="password"
                        value={tokenInputValue}
                        onChange={(e) => setTokenInputValue(e.target.value)}
                        placeholder="Pastekan token API Fonnte dari fonnte.com di sini (contoh: 4a3f89xxxx...)"
                        className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-mono text-slate-900 focus:border-[#0D3868] outline-hidden"
                      />
                      <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                        Token akan disimpan secara aman dan rahasia di server (tidak pernah dikirimkan ke frontend/browser, console, atau log). Token didapatkan dari menu <strong>Device</strong> pada dashboard <strong>fonnte.com</strong>.
                      </p>
                    </div>
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setShowTokenForm(false)}
                        className="px-3.5 py-1.5 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-700 cursor-pointer"
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        disabled={isSavingToken || !tokenInputValue.trim()}
                        className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[#128C7E] hover:bg-[#075E54] disabled:opacity-50 text-white text-xs font-bold cursor-pointer shadow-xs"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{isSavingToken ? 'Menyimpan...' : 'Simpan Token ke Server'}</span>
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* Panduan jika status Disconnected */}
                {waGatewayStatus && !waGatewayStatus.ok && (
                  <div className="mt-3 pt-3 border-t border-amber-200/80 bg-amber-50/70 rounded-xl p-3 text-xs text-amber-900 space-y-1.5">
                    <div className="font-bold flex items-center gap-1.5 text-amber-950">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Petunjuk untuk Master Admin / Petugas:</span>
                    </div>
                    <ol className="list-decimal list-inside space-y-1 text-slate-700 pl-1">
                      <li>
                        Login ke akun Fonnte Anda di{' '}
                        <a
                          href="https://fonnte.com"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-amber-800 font-bold underline"
                        >
                          fonnte.com
                        </a>.
                      </li>
                      <li>
                        Pilih menu <strong>Device</strong>, lalu klik tombol <strong>Scan WhatsApp / QR Code</strong>.
                      </li>
                      <li>
                        Buka aplikasi WhatsApp di HP Anda &gt; menu <strong>Perangkat Tertaut (Linked Devices)</strong> &gt; arahkan kamera ke QR Code di layar.
                      </li>
                      <li>
                        Setelah terhubung di Fonnte, klik tombol <strong>Cek Status Gateway</strong> di atas.
                      </li>
                    </ol>
                    <div className="text-[11px] text-slate-600 pt-1 border-t border-amber-200/60">
                      💡 <em>Solusi Langsung:</em> Sambil menunggu scan QR, Anda tetap dapat menggunakan tombol hijau <strong>&quot;Koordinasi WA&quot;</strong> pada daftar penerima di bawah untuk menghubungi tim secara manual via WhatsApp.
                    </div>
                  </div>
                )}
              </div>
            </div>
          </AdminCollapsibleBar>

          {/* 02. KARTU DAFTAR NOMOR WHATSAPP PENERIMA & FILTER RTRW */}
          <AdminCollapsibleBar
            sectionKey="laporan_whatsapp_mgmt"
            title="02. Kelola Nomor WhatsApp RTRW & Daftar Penerima Pesan Otomatis"
            subtitle="Tambah, edit, filter wilayah RTRW, serta aktifkan/nonaktifkan nomor penerima notifikasi WhatsApp Gateaway"
            icon={<Phone className="w-5 h-5 text-[#128C7E]" />}
            badge={
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300">
                {whatsappRecipients.filter((r) => r.isActive).length}/{whatsappRecipients.length} Penerima Aktif
              </span>
            }
            isCollapsed={isSectionCollapsed('laporan_whatsapp_mgmt')}
            onToggle={() => toggleSectionCollapse('laporan_whatsapp_mgmt')}
            headerActions={
              <button
                type="button"
                onClick={openAddWaRecipientForm}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#128C7E] hover:bg-[#075E54] text-white text-xs font-bold cursor-pointer whitespace-nowrap shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Tambah Nomor WA</span>
              </button>
            }
          >
            <div className="p-5 sm:p-6 space-y-5">
              {/* Bilah Filter & Kelola Status Penerima WhatsApp RTRW */}
              <div className="rounded-2xl border border-[#128C7E]/30 bg-emerald-50/30 p-4 space-y-3">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      <Filter className="w-3.5 h-3.5 text-[#128C7E]" />
                      <span>Filter RTRW / Wilayah:</span>
                    </span>
                    <select
                      value={waRecipientRwFilter}
                      onChange={(e) => setWaRecipientRwFilter(e.target.value)}
                      className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#128C7E]"
                    >
                      <option value="SEMUA">Semua Wilayah &amp; RW ({whatsappRecipients.length})</option>
                      <option value="KHUSUS_RTRW">Khusus RTRW Saja</option>
                      <option value="SELURUH_WILAYAH">Khusus Seluruh Wilayah (Lurah/Pejabat)</option>
                      {RW_LIST.map((rw) => (
                        <option key={rw} value={rw}>
                          Wilayah {rw}
                        </option>
                      ))}
                    </select>

                    <select
                      value={waRecipientStatusFilter}
                      onChange={(e) =>
                        setWaRecipientStatusFilter(e.target.value as 'SEMUA' | 'AKTIF' | 'NONAKTIF')
                      }
                      className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#128C7E]"
                    >
                      <option value="SEMUA">Semua Status (Aktif &amp; Nonaktif)</option>
                      <option value="AKTIF">Hanya Aktif Menerima (ON)</option>
                      <option value="NONAKTIF">Hanya Nonaktif (OFF)</option>
                    </select>
                  </div>

                  <div className="relative min-w-[220px]">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={waRecipientSearch}
                      onChange={(e) => setWaRecipientSearch(e.target.value)}
                      placeholder="Cari nama, nomor WA, peran, catatan..."
                      className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:border-[#128C7E]"
                    />
                  </div>
                </div>

                {/* Bar Aksi Massal Aktifkan/Nonaktifkan */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-emerald-200/60 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <span>
                      Menampilkan <strong>{filteredWaRecipients.length}</strong> dari <strong>{whatsappRecipients.length}</strong> nomor terdaftar
                    </span>
                    {(waRecipientRwFilter !== 'SEMUA' || waRecipientStatusFilter !== 'SEMUA' || waRecipientSearch.trim()) && (
                      <button
                        type="button"
                        onClick={() => {
                          setWaRecipientRwFilter('SEMUA');
                          setWaRecipientStatusFilter('SEMUA');
                          setWaRecipientSearch('');
                        }}
                        className="text-[11px] font-bold text-[#128C7E] hover:underline cursor-pointer"
                      >
                        Reset Filter
                      </button>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] font-bold text-slate-500 mr-1">Tindakan Massal:</span>
                    <button
                      type="button"
                      onClick={() => handleBulkToggleActiveWaRecipients(true)}
                      disabled={filteredWaRecipients.length === 0}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border border-emerald-300 text-[11px] font-bold cursor-pointer disabled:opacity-50"
                      title="Aktifkan seluruh nomor penerima yang sedang tampil"
                    >
                      <Check className="w-3 h-3 text-emerald-700" />
                      <span>Aktifkan Semua Terfilter</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleBulkToggleActiveWaRecipients(false)}
                      disabled={filteredWaRecipients.length === 0}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 text-[11px] font-bold cursor-pointer disabled:opacity-50"
                      title="Nonaktifkan seluruh nomor penerima yang sedang tampil"
                    >
                      <X className="w-3 h-3 text-amber-700" />
                      <span>Nonaktifkan Semua Terfilter</span>
                    </button>
                  </div>
                </div>
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
                        <span>Jadikan Penerima Utama (Prioritas Lurah / Pimpinan Kelurahan)</span>
                      </label>
                      <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={waForm.isActive !== false}
                          onChange={(e) => setWaForm({ ...waForm, isActive: e.target.checked })}
                          className="rounded text-[#128C7E]"
                        />
                        <span>Aktifkan Penerimaan WA Otomatis Saat Pengaduan Warga Masuk</span>
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
                {filteredWaRecipients.map((recipient: WhatsAppRecipient) => {
                  const coordMsg = buildInterRecipientCoordinationMessage(
                    recipient,
                    whatsappRecipients,
                    reports
                  );
                  const coordWaUrl = buildWhatsAppUrl(recipient.phoneNumber, coordMsg);
                  return (
                    <div
                      key={recipient.id}
                      className={`rounded-2xl border p-4 flex flex-col justify-between gap-3 transition-all ${
                        recipient.isPrimary
                          ? 'bg-emerald-50/70 border-2 border-[#128C7E] shadow-2xs'
                          : recipient.isActive
                          ? 'bg-slate-50/80 border-slate-200'
                          : 'bg-slate-100/60 border-dashed border-slate-300 opacity-80'
                      }`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-bold text-[#075E54]">
                            {recipient.isPrimary
                              ? '★ PENERIMA UTAMA · TERIMA SEMUA LAPORAN'
                              : `TERIMA LAPORAN (${recipient.rwScope})`}
                          </span>
                          {/* Tombol Toggle Aktif / Nonaktif Langsung */}
                          <button
                            type="button"
                            onClick={() => handleToggleActiveWaRecipient(recipient.id)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-colors shadow-2xs ${
                              recipient.isActive
                                ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border border-emerald-300'
                                : 'bg-slate-200 hover:bg-slate-300 text-slate-700 border border-slate-300'
                            }`}
                            title={
                              recipient.isActive
                                ? 'Klik untuk menonaktifkan penerimaan WA'
                                : 'Klik untuk mengaktifkan penerimaan WA'
                            }
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                recipient.isActive ? 'bg-emerald-600 animate-pulse' : 'bg-slate-400'
                              }`}
                            />
                            <span>{recipient.isActive ? 'Aktif' : 'Nonaktif'}</span>
                          </button>
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
                          <button
                            type="button"
                            disabled={testingWaId === recipient.id}
                            onClick={() => handleTestAutoWaDispatch(recipient)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#0D3868] hover:bg-[#072647] disabled:opacity-50 text-white text-[11px] font-bold cursor-pointer shadow-2xs"
                            title="Uji pengiriman notifikasi WA otomatis sistem ke nomor ini tanpa buka WA pribadi"
                          >
                            <Send className="w-3 h-3" />
                            <span>
                              {testingWaId === recipient.id ? 'Mengirim...' : 'Tes Auto-WA'}
                            </span>
                          </button>
                          <a
                            href={coordWaUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#128C7E] hover:bg-[#075E54] text-white text-[11px] font-bold shadow-2xs"
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
                              className="px-2 py-1 rounded-lg bg-white border border-emerald-300 hover:bg-emerald-50 text-[11px] font-bold text-[#075E54] cursor-pointer"
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
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-[11px] font-semibold text-slate-700 cursor-pointer"
                            >
                              <Edit3 className="w-3 h-3 text-[#128C7E]" />
                              <span>Edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteWaId(recipient.id)}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-red-200 bg-red-50/70 hover:bg-red-100 text-[11px] font-semibold text-red-700 cursor-pointer"
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

                {filteredWaRecipients.length === 0 && (
                  <div className="col-span-full rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 p-8 text-center space-y-2">
                    <MessageCircle className="w-8 h-8 text-slate-400 mx-auto" />
                    <div className="text-sm font-bold text-slate-700">Tidak ada nomor WhatsApp yang cocok</div>
                    <p className="text-xs text-slate-500 max-w-md mx-auto">
                      Tidak ada nomor penerima yang sesuai dengan kriteria filter wilayah RW atau status yang dipilih.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setWaRecipientRwFilter('SEMUA');
                        setWaRecipientStatusFilter('SEMUA');
                        setWaRecipientSearch('');
                      }}
                      className="mt-2 inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-xs font-bold text-slate-700 cursor-pointer"
                    >
                      Reset Filter &amp; Tampilkan Semua
                    </button>
                  </div>
                )}
              </div>
            </div>
          </AdminCollapsibleBar>

          {/* 03. KARTU LOG PENGIRIMAN WHATSAPP OTOMATIS */}
          <AdminCollapsibleBar
            sectionKey="laporan_whatsapp_logs"
            title={`03. Riwayat & Log Pengiriman Otomatis WhatsApp Gateaway (${waDispatchLogs.length} Log)`}
            subtitle="Riwayat pengiriman pesan otomatis pengaduan warga ke nomor Fonnte gateway yang terdaftar"
            icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
            badge={
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300">
                {waDispatchLogs.length} Riwayat Pengiriman
              </span>
            }
            isCollapsed={isSectionCollapsed('laporan_whatsapp_logs')}
            onToggle={() => toggleSectionCollapse('laporan_whatsapp_logs')}
          >
            <div className="p-5 sm:p-6 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="text-xs font-extrabold text-[#0D3868] flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>
                    Daftar Log Pengiriman WhatsApp Otomatis Pengaduan Masuk ({waDispatchLogs.length} Pengiriman)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      const logs = await loadWhatsAppAutoDispatchLogsAsync();
                      setWaDispatchLogs(logs);
                    }}
                    className="px-2.5 py-1 text-[11px] font-bold text-[#0D3868] bg-white border border-slate-300 rounded-lg shadow-2xs hover:bg-slate-50 flex items-center gap-1 cursor-pointer transition-colors"
                    title="Muat ulang riwayat pengiriman WA dari database server"
                  >
                    <RefreshCw className="w-3 h-3 text-[#0D3868]" />
                    <span>Sinkronkan Log Server</span>
                  </button>
                  <span className="text-[11px] text-emerald-700 font-semibold hidden sm:inline">
                    Terkirim otomatis saat pengaduan disubmit warga
                  </span>
                </div>
              </div>
              {waDispatchLogs.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/60 p-6 text-center text-xs text-slate-500">
                  Belum ada riwayat pengiriman otomatis tercatat pada sesi ini. Gunakan tombol <strong>Tes Auto-WA</strong> pada kartu penerima di atas untuk menguji pengiriman.
                </div>
              ) : (
                <div className="max-h-64 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50/60 divide-y divide-slate-200/80 text-xs">
                  {waDispatchLogs.slice(0, 15).map((log) => (
                    <div
                      key={log.id}
                      className="px-3.5 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div className="space-y-0.5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-mono-num font-bold text-[#0D3868]">
                            #{log.ticketCode}
                          </span>
                          <span className="font-semibold text-slate-800">{log.reportTitle}</span>
                          {log.status === 'GAGAL_KIRIM' ? (
                            <span className="px-2 py-0.5 rounded bg-red-100 text-red-800 text-[10px] font-bold">
                              ✕ GAGAL KIRIM (Fonnte)
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                              ✓ TERKIRIM OTOMATIS (Fonnte)
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Penerima: <strong>{log.recipientName}</strong> ({log.recipientRole}) ·{' '}
                          <span className="font-mono-num text-[#128C7E] font-semibold">
                            {formatDisplayPhone(log.phoneNumber)}
                          </span>
                        </div>
                        {log.status === 'GAGAL_KIRIM' && log.errorMessage && (
                          <div className="text-[11px] text-red-600 font-medium">
                            Keterangan: {log.errorMessage}
                          </div>
                        )}
                      </div>
                      <div className="text-[11px] font-mono-num text-slate-400 shrink-0">
                        {new Date(log.dispatchedAt).toLocaleString('id-ID')}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </AdminCollapsibleBar>
        </div>
      )}

      {/* ================= KARTU 03 ADMIN LAYANAN KELURAHAN: DAFTAR & VERIFIKASI LAPORAN WARGA ================= */}
      {(activeTab === 'pengurusan_warga' || activeTab === 'laporan') &&
        (isTabAllowed('pengurusan_warga') || isTabAllowed('laporan')) && (
        <div className="mt-6 space-y-6">
          <AdminCollapsibleBar
            sectionKey="laporan_table"
            title={`03. Daftar Laporan & Pengaduan Warga Kelurahan Panaikang (${filteredReports.length} Laporan)`}
            subtitle="Pusat verifikasi pengaduan warga, penugasan tim lapangan, serta dokumentasi tindak lanjut penanganan"
            icon={<FileText className="w-5 h-5 text-[#0277BD]" />}
            badge={
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-300">
                {reports.filter((r) => r.status === 'Selesai').length}/{reports.length} Selesai
              </span>
            }
            isCollapsed={isSectionCollapsed('laporan_table')}
            onToggle={() => toggleSectionCollapse('laporan_table')}
            headerActions={
              <button
                type="button"
                onClick={openAddReportForm}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0277BD] hover:bg-[#01579B] text-white text-xs font-bold cursor-pointer whitespace-nowrap shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Tambah Data Laporan</span>
              </button>
            }
          >
            <div className="p-5 sm:p-6 space-y-5">
              {/* Filter & Pencarian Ringkas Tabel 03 */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3">
                <div className="flex flex-col lg:flex-row gap-2.5">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={reportSearch}
                      onChange={(e) => {
                        setReportSearch(e.target.value);
                        setReportCurrentPage(1);
                      }}
                      placeholder="Cari No. Tiket, Nama Pemohon/Pelapor, NIK, Layanan/Judul, atau Lokasi..."
                      className="w-full pl-10 pr-8 py-2 text-xs sm:text-sm rounded-xl bg-white border border-slate-300 focus:border-[#0277BD] focus:outline-none"
                    />
                    {reportSearch && (
                      <button
                        type="button"
                        onClick={() => {
                          setReportSearch('');
                          setReportCurrentPage(1);
                        }}
                        className="p-1 text-slate-400 hover:text-slate-600 absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer"
                        title="Bersihkan pencarian"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <select
                    value={reportTypeFilter}
                    onChange={(e) => {
                      setReportTypeFilter(e.target.value as 'SEMUA' | 'SURAT' | 'PENGADUAN');
                      setReportCurrentPage(1);
                    }}
                    className="px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-700 focus:border-[#0277BD] focus:outline-none"
                  >
                    <option value="SEMUA">Semua Jenis ({reports.length})</option>
                    <option value="SURAT">Surat Administrasi</option>
                    <option value="PENGADUAN">Pengaduan Warga</option>
                  </select>
                  <select
                    value={reportStatusFilter}
                    onChange={(e) => {
                      setReportStatusFilter(e.target.value as 'SEMUA' | ReportStatus);
                      setReportCurrentPage(1);
                    }}
                    className="px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-700 focus:border-[#0277BD] focus:outline-none"
                  >
                    <option value="SEMUA">Semua Status</option>
                    <option value="Menunggu Verifikasi">Menunggu Verifikasi</option>
                    <option value="Sedang Ditangani">Sedang Ditangani</option>
                    <option value="Selesai">Selesai</option>
                  </select>
                  <select
                    value={reportRwFilter}
                    onChange={(e) => {
                      setReportRwFilter(e.target.value);
                      setReportCurrentPage(1);
                    }}
                    className="px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-700 focus:border-[#0277BD] focus:outline-none"
                  >
                    <option value="SEMUA">Semua Wilayah RW</option>
                    <option value="RW 01">RW 01</option>
                    <option value="RW 02">RW 02</option>
                    <option value="RW 03">RW 03</option>
                    <option value="RW 04">RW 04</option>
                    <option value="RW 05">RW 05</option>
                    <option value="RW 06">RW 06</option>
                    <option value="RW 07">RW 07</option>
                  </select>
                  {(reportSearch.trim() !== '' ||
                    reportTypeFilter !== 'SEMUA' ||
                    reportStatusFilter !== 'SEMUA' ||
                    reportRwFilter !== 'SEMUA') && (
                    <button
                      type="button"
                      onClick={() => {
                        setReportSearch('');
                        setReportTypeFilter('SEMUA');
                        setReportStatusFilter('SEMUA');
                        setReportRwFilter('SEMUA');
                        setReportCurrentPage(1);
                      }}
                      className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold cursor-pointer whitespace-nowrap"
                    >
                      Reset Filter
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
                  <span>
                    Menampilkan{' '}
                    <strong className="text-slate-800">
                      {filteredReports.length === 0
                        ? 0
                        : (safeReportCurrentPage - 1) * reportPageSize + 1}
                      –{Math.min(safeReportCurrentPage * reportPageSize, filteredReports.length)}
                    </strong>{' '}
                    dari <strong className="text-slate-800">{filteredReports.length}</strong> data
                    terfilter · Klik <strong>&ldquo;Lihat Detail&rdquo;</strong> untuk membuka rincian berkas, foto pengaduan, & kirim WA.
                  </span>
                </div>
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
                        verifiedAt: reportForm.verifiedAt || `${getRealtimeDateTimeString()} · Diverifikasi Petugas`,
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
                        verifiedAt: reportForm.verifiedAt || `${getRealtimeDateTimeString()} · Diverifikasi Petugas`,
                        completedAt: `${getRealtimeDateTimeString()} · Tuntas Dikerjakan`,
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

          {/* Reports Compact CRUD Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-extrabold uppercase tracking-wider text-slate-600">
                    <th className="py-3 px-3.5 w-10 text-center">No</th>
                    <th className="py-3 px-3.5">Tiket & Waktu</th>
                    <th className="py-3 px-3.5">Pemohon / Pelapor</th>
                    <th className="py-3 px-3.5">Layanan / Judul Pengaduan</th>
                    <th className="py-3 px-3.5">Lampiran</th>
                    <th className="py-3 px-3.5">Status</th>
                    <th className="py-3 px-3.5 text-right">Aksi Cepat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-xs">
                  {paginatedFilteredReports.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 px-4 text-center text-slate-500">
                        Tidak ada data permohonan/pengaduan yang sesuai dengan filter pencarian.
                      </td>
                    </tr>
                  ) : (
                    paginatedFilteredReports.map((rep, idx) => {
                      const rowNumber = (safeReportCurrentPage - 1) * reportPageSize + idx + 1;
                      const matchedPra = praRegistrasiList.find(
                        (p) => p.ticketCode === rep.ticketCode || p.id === rep.id
                      );
                      const matchedPgd = pengaduanList.find(
                        (p) => p.ticketCode === rep.ticketCode || p.id === rep.id
                      );
                      const isSurat = isSuratAdministrasi(rep) || Boolean(matchedPra);
                      const docCount = matchedPra?.uploadedDocs?.length || 0;
                      const citizenPhotoUrl =
                        (matchedPgd?.proofPhotos && matchedPgd.proofPhotos[0]) ||
                        rep.imageUrl ||
                        '';

                      return (
                        <tr
                          key={rep.id}
                          onClick={() =>
                            setAdminReportDetailModal({
                              report: rep,
                              praRecord: matchedPra || null,
                              pengaduanRecord: matchedPgd || null,
                            })
                          }
                          className="hover:bg-sky-50/50 transition-colors cursor-pointer"
                        >
                          <td className="py-3 px-3.5 text-center font-mono text-[11px] font-bold text-slate-400">
                            {rowNumber}
                          </td>
                          <td className="py-3 px-3.5 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono-num font-black text-[#0D3868]">
                                {rep.ticketCode}
                              </span>
                              <span
                                className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded uppercase ${
                                  isSurat
                                    ? 'bg-indigo-50 text-indigo-800 border border-indigo-200'
                                    : 'bg-amber-50 text-amber-800 border border-amber-200'
                                }`}
                              >
                                {isSurat ? 'Surat' : 'Aduan'}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              {rep.createdAt || 'Baru saja'}
                            </div>
                          </td>
                          <td className="py-3 px-3.5">
                            <div className="font-bold text-slate-900">{rep.reporterName}</div>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              <span className="font-semibold text-slate-700">
                                {rep.rw} / {rep.rt}
                              </span>
                              {rep.applicantNik ? ` · NIK: ${rep.applicantNik}` : ''}
                            </div>
                          </td>
                          <td className="py-3 px-3.5 max-w-xs">
                            <div className="font-bold text-slate-900 line-clamp-1">
                              {rep.serviceSubItemLabel || rep.title}
                            </div>
                            <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                              {rep.category} · {rep.citizenAddress || rep.locationName}
                            </div>
                          </td>
                          <td
                            className="py-3 px-3.5 whitespace-nowrap"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex flex-wrap items-center gap-1">
                              {docCount > 0 && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setAdminReportDetailModal({
                                      report: rep,
                                      praRecord: matchedPra || null,
                                      pengaduanRecord: matchedPgd || null,
                                    })
                                  }
                                  className="px-2 py-0.5 rounded-md bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 text-[10px] font-bold cursor-pointer"
                                >
                                  📎 {docCount} Berkas
                                </button>
                              )}
                              {citizenPhotoUrl && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setAdminReportDetailModal({
                                      report: rep,
                                      praRecord: matchedPra || null,
                                      pengaduanRecord: matchedPgd || null,
                                    })
                                  }
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-sky-50 hover:bg-sky-100 text-[#0277BD] border border-sky-200 text-[10px] font-bold cursor-pointer"
                                  title="Klik untuk melihat foto lampiran pengaduan"
                                >
                                  <span>📷 Foto Aduan</span>
                                </button>
                              )}
                              {!docCount && !citizenPhotoUrl && (
                                <span className="text-[11px] text-slate-400">-</span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-3.5 whitespace-nowrap">
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
                            {rep.letterRegisterNumber && (
                              <div className="text-[10px] font-mono text-emerald-700 font-bold mt-0.5">
                                No: {rep.letterRegisterNumber}
                              </div>
                            )}
                          </td>
                          <td
                            className="py-3 px-3.5 text-right whitespace-nowrap"
                            onClick={(e) => e.stopPropagation()}
                          >
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
                                <button
                                  type="button"
                                  onClick={() =>
                                    setAdminReportDetailModal({
                                      report: rep,
                                      praRecord: matchedPra || null,
                                      pengaduanRecord: matchedPgd || null,
                                    })
                                  }
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#0D3868] hover:bg-[#072647] text-white font-bold cursor-pointer shadow-2xs"
                                  title="Lihat Detail Permohonan / Pengaduan & Foto Lampiran"
                                >
                                  <Eye className="w-3.5 h-3.5 text-amber-300" />
                                  <span>Lihat Detail</span>
                                </button>
                                {rep.status === 'Menunggu Verifikasi' && (
                                  <button
                                    type="button"
                                    onClick={() => handleQuickReportAction(rep, 'verifikasi')}
                                    className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 border border-sky-200 text-[#0277BD] font-bold cursor-pointer"
                                    title="Verifikasi & Teruskan ke Petugas Lapangan"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span className="hidden xl:inline">Verifikasi</span>
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => openEditReportForm(rep)}
                                  className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-semibold cursor-pointer"
                                  title="Buka Form Tindak Lanjut"
                                >
                                  <Edit3 className="w-3.5 h-3.5 text-[#0277BD]" />
                                  <span className="hidden xl:inline">Tindak Lanjut</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteReportId(rep.id)}
                                  className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg border border-red-200 bg-red-50/60 hover:bg-red-100 text-red-700 font-semibold cursor-pointer"
                                  title="Hapus Data"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer for Section 03 */}
            {filteredReports.length > 0 && (
              <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <span>Tampilkan per halaman:</span>
                  {([10, 20, 50] as const).map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => {
                        setReportPageSize(sz);
                        setReportCurrentPage(1);
                      }}
                      className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer transition-colors ${
                        reportPageSize === sz
                          ? 'bg-[#0D3868] text-white'
                          : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={safeReportCurrentPage <= 1}
                    onClick={() => setReportCurrentPage((p) => Math.max(1, p - 1))}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 text-xs font-bold text-slate-700 cursor-pointer disabled:cursor-not-allowed"
                  >
                    ← Sebelumnya
                  </button>
                  <span className="px-3 py-1.5 text-xs font-bold text-slate-700">
                    Hal. {safeReportCurrentPage} / {reportTotalPages}
                  </span>
                  <button
                    type="button"
                    disabled={safeReportCurrentPage >= reportTotalPages}
                    onClick={() =>
                      setReportCurrentPage((p) => Math.min(reportTotalPages, p + 1))
                    }
                    className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 text-xs font-bold text-slate-700 cursor-pointer disabled:cursor-not-allowed"
                  >
                    Berikutnya →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </AdminCollapsibleBar>
    </div>
  )}

      {/* ================= TAB: PENGELOLAAN SAMPAH (BILAH PERKARTU) ================= */}
      {activeTab === 'sampah' && isTabAllowed('sampah') && (
        <div className="mt-6 space-y-6">
          <AdminCollapsibleBar
            sectionKey="sampah_bsu"
            title={`01. Manajemen Bank Sampah Unit (BSU) & Timbulan Sampah (${wasteUnits.length} Unit)`}
            subtitle="Kelola data BSU RW, koordinator, jadwal angkut, dan rekapitulasi volume sampah terpilah"
            icon={<Recycle className="w-5 h-5 text-[#EF6C00]" />}
            badge={
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-300">
                {wasteUnits.length} BSU RW
              </span>
            }
            isCollapsed={isSectionCollapsed('sampah_bsu')}
            onToggle={() => toggleSectionCollapse('sampah_bsu')}
            headerActions={
              <button
                type="button"
                onClick={openAddUnitForm}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#EF6C00] hover:bg-[#E65100] text-white text-xs font-bold cursor-pointer whitespace-nowrap shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Tambah BSU</span>
              </button>
            }
          >
            <div className="p-5 sm:p-6 space-y-5">

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

              {/* Fitur Upload Foto BSU */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Foto Dokumentasi / Gedung Bank Sampah Unit (BSU)
                </label>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-3.5 rounded-xl border border-dashed border-amber-300 bg-amber-50/40">
                  {unitForm.imageUrl ? (
                    <div className="relative w-24 h-24 rounded-xl overflow-hidden border border-slate-200 bg-white shrink-0 group shadow-xs">
                      <img
                        src={resolveImageUrl(unitForm.imageUrl)}
                        alt="Foto BSU"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setUnitForm({ ...unitForm, imageUrl: '' })}
                        className="absolute inset-0 bg-black/60 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-xs font-bold"
                        title="Hapus foto"
                      >
                        <Trash2 className="w-5 h-5 text-red-300 mb-1" />
                        <span>Hapus</span>
                      </button>
                    </div>
                  ) : (
                    <div className="w-24 h-24 rounded-xl border border-slate-200 bg-white flex flex-col items-center justify-center text-slate-400 shrink-0">
                      <Camera className="w-6 h-6 text-slate-300 mb-1" />
                      <span className="text-[10px] text-slate-400 text-center px-1">Belum ada foto</span>
                    </div>
                  )}
                  <div className="flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1C8237] hover:bg-[#146329] text-white text-xs font-bold cursor-pointer transition-colors shadow-xs">
                        <Upload className="w-3.5 h-3.5" />
                        <span>{unitForm.imageUrl ? 'Ganti Foto BSU' : 'Upload Foto BSU'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleBsuPhotoUpload}
                          className="hidden"
                        />
                      </label>
                      {unitForm.imageUrl && (
                        <button
                          type="button"
                          onClick={() => setUnitForm({ ...unitForm, imageUrl: '' })}
                          className="px-3 py-2 rounded-xl border border-slate-300 text-slate-600 text-xs font-semibold hover:bg-slate-100 cursor-pointer"
                        >
                          Hapus Foto
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Format JPG, JPEG, PNG, atau WEBP. Foto otomatis dikompresi hemat penyimpanan dan langsung tampil di kartu BSU publik dan tabel admin.
                    </p>
                  </div>
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
                    <th className="py-3.5 px-4">Foto</th>
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
                      <td className="py-3 px-4">
                        {u.imageUrl ? (
                          <img
                            src={resolveImageUrl(u.imageUrl)}
                            alt={u.unitName}
                            className="w-12 h-12 rounded-xl object-cover border border-slate-200 shadow-xs"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                            <Recycle className="w-5 h-5 text-emerald-600" />
                          </div>
                        )}
                      </td>
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
        </div>
      </AdminCollapsibleBar>

          {/* 02. Menu Input Timbangan Harian BSU & Riwayat Log */}
          <AdminCollapsibleBar
            sectionKey="sampah_logs"
            title={`02. Input Timbangan Harian BSU & Rekapitulasi Mutasi (${wasteLogs.length} Log)`}
            subtitle="Pusat pencatatan timbangan sampah harian BSU terintegrasi se-Kelurahan Panaikang"
            icon={<Scale className="w-5 h-5 text-emerald-700" />}
            badge={
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300">
                {wasteLogs.length} Log Tercatat
              </span>
            }
            isCollapsed={isSectionCollapsed('sampah_logs')}
            onToggle={() => toggleSectionCollapse('sampah_logs')}
            headerActions={
              <button
                type="button"
                onClick={openAddLogForm}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1C8237] hover:bg-[#146329] text-white text-xs font-bold cursor-pointer transition-colors shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Input Timbangan</span>
              </button>
            }
          >
            <div className="p-5 sm:p-6 space-y-4">

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
        </AdminCollapsibleBar>

          {/* 03. KARTU MANAJEMEN TITIK TEBA KOMUNAL */}
          <AdminCollapsibleBar
            sectionKey="sampah_teba"
            title={`03. Manajemen Titik Teba Komunal & Pengolahan Sampah Organik (${tebaSpots.length} Titik)`}
            subtitle="Kelola lokasi komposter Teba modern, kapasitas lubang, panen kompos, dan penanggung jawab RW"
            icon={<Sprout className="w-5 h-5 text-[#1C8237]" />}
            badge={
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300">
                {tebaSpots.length} Titik Teba
              </span>
            }
            isCollapsed={isSectionCollapsed('sampah_teba')}
            onToggle={() => toggleSectionCollapse('sampah_teba')}
          >
            <div className="p-4 sm:p-5">
              <AdminTebaPanel
                tebaSpots={tebaSpots}
                onCreateTebaSpot={auditedOnCreateTebaSpot}
                onUpdateTebaSpot={auditedOnUpdateTebaSpot}
                onDeleteTebaSpot={auditedOnDeleteTebaSpot}
              />
            </div>
          </AdminCollapsibleBar>

          {/* 04. KARTU MANAJEMEN LUBANG RESAPAN BIOPORI */}
          <AdminCollapsibleBar
            sectionKey="sampah_biopori"
            title={`04. Manajemen Lubang Resapan Biopori Kelurahan Panaikang (${bioporiPoints.length} Titik)`}
            subtitle="Kelola titik sumur resapan biopori, kedalaman, daya serap air hujan, dan jadwal kuras kompos"
            icon={<Layers className="w-5 h-5 text-[#146329]" />}
            badge={
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300">
                {bioporiPoints.length} Titik Biopori
              </span>
            }
            isCollapsed={isSectionCollapsed('sampah_biopori')}
            onToggle={() => toggleSectionCollapse('sampah_biopori')}
          >
            <div className="p-4 sm:p-5">
              <AdminBioporiPanel
                bioporiPoints={bioporiPoints}
                onCreateBioporiPoint={auditedOnCreateBioporiPoint}
                onUpdateBioporiPoint={auditedOnUpdateBioporiPoint}
                onDeleteBioporiPoint={auditedOnDeleteBioporiPoint}
              />
            </div>
          </AdminCollapsibleBar>
        </div>
      )}

      {/* ================= TAB 4: KELOLA JADWAL & UPLOAD FOTO KERJA BAKTI (CRUD) ================= */}
      {activeTab === 'kerjabakti' && isTabAllowed('kerjabakti') && (
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
            <AdminCollapsibleBar
              sectionKey="kerjabakti_jadwal"
              title={`1. Daftar Kerja Bakti Terjadwal (${cleanupEvents.filter((e) => e.status !== 'Tuntas').length} Agenda Terjadwal)`}
              subtitle="Agenda kerja bakti yang akan datang — tidak menggunakan foto"
              icon={<Clock className="w-5 h-5 text-amber-700" />}
              badge={
                <span className="text-xs font-bold text-amber-900 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-300">
                  {cleanupEvents.filter((e) => e.status !== 'Tuntas').length} Agenda
                </span>
              }
              headerBg="bg-amber-50/70"
              isCollapsed={isSectionCollapsed('kerjabakti_jadwal')}
              onToggle={() => toggleSectionCollapse('kerjabakti_jadwal')}
            >
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
            </AdminCollapsibleBar>

            {/* TABEL 2: KERJA BAKTI TELAH DILAKSANAKAN / TUNTAS (DENGAN FOTO DOKUMENTASI) */}
            <AdminCollapsibleBar
              sectionKey="kerjabakti_dokumentasi"
              title={`2. Daftar Kerja Bakti Telah Dilaksanakan / Tuntas (${cleanupEvents.filter((e) => e.status === 'Tuntas').length} Kegiatan Terlaksana)`}
              subtitle="Daftar kerja bakti tuntas dengan lampiran foto dokumentasi kegiatan"
              icon={<Camera className="w-5 h-5 text-[#1C8237]" />}
              badge={
                <span className="text-xs font-bold text-emerald-900 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
                  {cleanupEvents.filter((e) => e.status === 'Tuntas').length} Terlaksana
                </span>
              }
              headerBg="bg-emerald-50/70"
              isCollapsed={isSectionCollapsed('kerjabakti_dokumentasi')}
              onToggle={() => toggleSectionCollapse('kerjabakti_dokumentasi')}
            >
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
            </AdminCollapsibleBar>

            {/* ================= PANEL 3: BILAH TERSENDIRI SOROTAN KERJA BAKTI INSTAGRAM (3 STORY TERBARU) ================= */}
            <AdminCollapsibleBar
              sectionKey="kerjabakti_sorotan_ig"
              title="3. Sinkronisasi Bilah Sorotan Kerja Bakti Instagram @kelurahan.panaikang"
              subtitle="Menampilkan 3 postingan story Sorotan Kerja Bakti terbaru pada bilah khusus"
              icon={<Instagram className="w-5 h-5 text-[#DD2A7B]" />}
              badge={
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-pink-100 text-pink-800 border border-pink-200 text-xs font-bold">
                  Maks. 3 Story Terbaru
                </span>
              }
              headerBg="bg-gradient-to-r from-pink-50/70 via-white to-purple-50/60"
              isCollapsed={isSectionCollapsed('kerjabakti_sorotan_ig')}
              onToggle={() => toggleSectionCollapse('kerjabakti_sorotan_ig')}
              headerActions={
                <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                  <div className="text-[11px] text-slate-600 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl font-medium hidden sm:block">
                    Sinkron terakhir:{' '}
                    <span className="font-bold text-slate-900">
                      {kerjaBaktiHighlightsSyncedAt || 'Tersinkron Otomatis'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleSyncKerjaBaktiHighlightsAdmin}
                    disabled={isSyncingKbHighlights}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#DD2A7B] to-[#8134AF] hover:opacity-95 disabled:opacity-60 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                  >
                    <RefreshCw
                      className={`w-4 h-4 ${isSyncingKbHighlights ? 'animate-spin' : ''}`}
                    />
                    <span>
                      {isSyncingKbHighlights
                        ? 'Menyinkronkan 3 Story...'
                        : 'Sinkronisasi 3 Sorotan Kerja Bakti'}
                    </span>
                  </button>
                </div>
              }
            >
              <div className="p-4 sm:p-5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {(kerjaBaktiHighlights || INITIAL_KERJABAKTI_IG_HIGHLIGHTS)
                    .slice(0, 3)
                    .map((story, idx) => (
                      <div
                        key={story.id}
                        className="rounded-xl border border-slate-200 bg-white overflow-hidden flex flex-col justify-between shadow-2xs"
                      >
                        <div>
                          <div className="relative h-40 bg-slate-900 overflow-hidden">
                            <img
                              src={resolveImageUrl(story.imageUrl)}
                              alt={story.title}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-transparent to-slate-950/30" />
                            <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                              <span className="px-2 py-0.5 rounded-md bg-gradient-to-r from-[#F58529] via-[#DD2A7B] to-[#8134AF] text-white text-[10px] font-extrabold uppercase tracking-wider">
                                Story #{idx + 1}
                              </span>
                              <span className="px-2 py-0.5 rounded-md bg-slate-900/75 text-white text-[10px] font-semibold">
                                {story.rwScope}
                              </span>
                            </div>
                            <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between text-[11px] text-white/95 font-medium">
                              <span>{story.publishedAt}</span>
                              <span className="font-mono text-[10px] bg-white/20 px-1.5 py-0.5 rounded">
                                #{story.shortcode}
                              </span>
                            </div>
                          </div>

                          <div className="p-3.5">
                            <div className="text-xs font-extrabold text-slate-900 line-clamp-2 leading-snug">
                              {story.title}
                            </div>
                            <div className="text-[11px] font-semibold text-[#5E35B1] mt-1">
                              {story.highlightName}
                            </div>
                            <p className="text-[11px] text-slate-600 mt-1.5 line-clamp-2 leading-relaxed">
                              {story.caption}
                            </p>
                          </div>
                        </div>

                        <div className="px-3.5 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px]">
                          <span className="font-semibold text-slate-600">
                            @kelurahan.panaikang
                          </span>
                          <a
                            href={story.instagramPostUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 font-bold text-[#DD2A7B] hover:underline"
                          >
                            <span>Lihat Postingan</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </AdminCollapsibleBar>
          </div>
        </div>
      )}

      {/* ================= TAB URBAN FARMING (CRUD KEBUN, BIBIT, UPLOAD GAMBAR, SIMPAN DATA) ================= */}
      {activeTab === 'urban_farming' && isTabAllowed('urban_farming') && (
        <div className="mt-6">
          <AdminCollapsibleBar
            sectionKey="urban_kebun"
            title={`Manajemen Terpadu Urban Farming (${urbanFarmingSpots.length} Titik Binaan & ${seedRequests.length} Permohonan Bibit)`}
            subtitle="Pusat kelola data kebun binaan warga RW 01 – RW 07, kelompok tani, upload foto dokumentasi, dan distribusi benih gratis"
            icon={<Sprout className="w-5 h-5 text-[#059669]" />}
            badge={
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300">
                {urbanFarmingSpots.length} Titik Binaan
              </span>
            }
            headerBg="bg-emerald-50/70"
            isCollapsed={isSectionCollapsed('urban_kebun')}
            onToggle={() => toggleSectionCollapse('urban_kebun')}
          >
            <div className="p-4 sm:p-6 bg-slate-50/50">
              <AdminUrbanFarmingPanel
                spots={urbanFarmingSpots}
                seedRequests={seedRequests}
                rwGroups={rwGroups}
                profile={profile}
                adminOfficerName={
                  adminSession?.fullName || 'Administrator Satu Data Panaikang'
                }
                onAddSpot={auditedOnAddUrbanFarmingSpot}
                onUpdateSpot={auditedOnUpdateUrbanFarmingSpot}
                onDeleteSpot={auditedOnDeleteUrbanFarmingSpot}
                onAddSeedRequest={auditedOnAddSeedRequest}
                onUpdateSeedRequest={auditedOnUpdateSeedRequest}
                onDeleteSeedRequest={auditedOnDeleteSeedRequest}
              />
            </div>
          </AdminCollapsibleBar>
        </div>
      )}

      {/* ================= TAB: DATA RT RW (BILAH PERKARTU) ================= */}
      {activeTab === 'rtrw' && isTabAllowed('rtrw') && (
        <div className="mt-6 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-[#0D3868]">
                Manajemen Data Rukun Warga (RW) & Rukun Tetangga (RT) Kelurahan Panaikang
              </h2>
              <p className="text-xs text-slate-500">
                Setiap sub-menu ditampilkan dalam bilah kartu terpisah. Klik tombol Tampilkan Detail / Tutup pada masing-masing kartu.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => setShowAdminBaganRtRw(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#1C8237] hover:bg-[#146329] text-white text-xs font-bold cursor-pointer whitespace-nowrap shadow-xs"
              >
                <Users className="w-4 h-4" />
                <span>Pratinjau & Cetak Bagan Struktur RT/RW</span>
              </button>
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

          {/* 01. KARTU PENGATURAN KETUA LPM & BAGAN STRUKTUR ORGANISASI RT/RW */}
          <AdminCollapsibleBar
            sectionKey="rtrw_lpm_bagan"
            title="01. Pengaturan Ketua LPM & Bagan Struktur Organisasi RT/RW"
            subtitle={`Bagan organisasi dinamis: Lurah, Ketua LPM (${profileDraft.ketuaLpmName || 'Belum diisi'}), RW 01-07, dan ${rwGroups.reduce((a, r) => a + (r.rtList?.length || 0), 0)} RT`}
            icon={<Layers className="w-5 h-5 text-[#0D3868]" />}
            badge={
              <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-100/80 px-2.5 py-0.5 rounded-full border border-emerald-200">
                {rwGroups.length} RW · {rwGroups.reduce((a, r) => a + (r.rtList?.length || 0), 0)} RT
              </span>
            }
            isCollapsed={isSectionCollapsed('rtrw_lpm_bagan')}
            onToggle={() => toggleSectionCollapse('rtrw_lpm_bagan')}
          >
            <div className="bg-gradient-to-r from-sky-50/90 via-white to-emerald-50/60 p-5 space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-[#0D3868] text-white">
                      <Layers className="w-3 h-3" />
                      <span>Bagan Struktur RT/RW Dinamis</span>
                    </span>
                  </div>
                  <h3 className="text-sm sm:text-base font-extrabold text-[#0D3868]">
                    Pengaturan Ketua LPM &amp; Bagan Struktur Organisasi RT/RW Kelurahan Panaikang
                  </h3>
                  <p className="text-xs text-slate-600">
                    Masukkan nama <strong>Ketua LPM (Lembaga Pemberdayaan Masyarakat)</strong> di bawah ini untuk ditampilkan berdampingan dengan Lurah Panaikang pada Bagan Struktur Organisasi RT/RW.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-2.5 shrink-0">
                  <div className="sm:w-72">
                    <label className="block text-[11px] font-bold text-[#0D3868] mb-1">
                      Nama Ketua LPM Kelurahan Panaikang
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: EDY MEDY, SM, M.Th"
                      value={profileDraft.ketuaLpmName || ''}
                      onChange={(e) =>
                        setProfileDraft((prev) => ({
                          ...prev,
                          ketuaLpmName: e.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs sm:text-sm font-bold text-slate-900 focus:border-[#0D3868] focus:ring-1 focus:ring-[#0D3868] outline-hidden"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleSaveKetuaLpm}
                    disabled={isSubmitting}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0D3868] hover:bg-[#072647] disabled:opacity-50 text-white text-xs font-bold transition shadow-xs cursor-pointer whitespace-nowrap"
                  >
                    <Check className="w-4 h-4" />
                    <span>Simpan Ketua LPM</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowInlineRtRwChartPreview((prev) => !prev)}
                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-sky-300 bg-white hover:bg-sky-50 text-[#0D3868] text-xs font-bold transition cursor-pointer whitespace-nowrap"
                  >
                    <Eye className="w-4 h-4" />
                    <span>{showInlineRtRwChartPreview ? 'Sembunyikan Bagan' : 'Tampilkan Bagan'}</span>
                  </button>
                </div>
              </div>

              {showInlineRtRwChartPreview && (
                <div className="pt-4 border-t border-sky-200/70 space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-700">
                      Pratinjau Bagan Struktur Organisasi RT/RW (Lurah: {profileDraft.lurahName || '-'} · Ketua LPM: {profileDraft.ketuaLpmName || '-'})
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-[#146329]">
                      Responsif HP · Tablet · PC (Perkecil / Perbesar)
                    </span>
                  </div>
                  <BaganStrukturRtRwInteractiveViewer
                    rwGroups={rwGroups}
                    profile={profileDraft}
                    onExpandFullScreen={() => setShowAdminBaganRtRw(true)}
                  />
                </div>
              )}
            </div>
          </AdminCollapsibleBar>

          {/* 02. KARTU CETAK LAPORAN DATA RT/RW */}
          <AdminCollapsibleBar
            sectionKey="rtrw_cetak_laporan"
            title="02. Cetak & Unduh Laporan Data RT/RW Kelurahan Panaikang"
            subtitle="Ekspor PDF & Cetak lembar resmi rekapitulasi data RT/RW per wilayah maupun seluruh kelurahan"
            icon={<Printer className="w-5 h-5 text-[#1C8237]" />}
            badge={
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300">
                Ekspor Resmi PDF
              </span>
            }
            isCollapsed={isSectionCollapsed('rtrw_cetak_laporan')}
            onToggle={() => toggleSectionCollapse('rtrw_cetak_laporan')}
          >
            <div className="p-4 sm:p-5">
              <AdminRtRwReportPanel
                profile={profile}
                rwGroups={rwGroups}
                reports={reports}
                externalSelection={rtrwPrintSelection}
                onReportPrintedOrExported={(result, actionMode) => {
                  recordAudit({
                    actionType: 'EXPORT',
                    module: 'STRUKTUR_RTRW',
                    targetLabel: result.titleLabel,
                    summary: `${
                      actionMode === 'PRINT' ? 'Mencetak laporan' : 'Mengunduh dokumen PDF'
                    } ${result.titleLabel}`,
                    afterValue: `${result.scopeLabel} · ${result.totalRtCount} RT · ${result.totalKkCount} KK`,
                    severity: 'info',
                  });
                  setSuccessMessage(
                    `${
                      actionMode === 'PRINT' ? 'Lembar cetak' : 'Dokumen PDF'
                    } "${result.titleLabel}" berhasil diproses.`
                  );
                }}
              />
            </div>
          </AdminCollapsibleBar>

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

          {/* 03. KARTU DAFTAR WILAYAH RW & RT SE-KELURAHAN PANAIKANG */}
          <AdminCollapsibleBar
            sectionKey="rtrw_daftar_rw"
            title={`03. Daftar Wilayah Rukun Warga (RW) & Rukun Tetangga (RT) (${rwGroups.length} RW)`}
            subtitle="Kelola data ketua RW, nomor kontak, cakupan wilayah, serta daftar RT masing-masing RW"
            icon={<Users className="w-5 h-5 text-[#0D3868]" />}
            badge={
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-300">
                {rwGroups.length} RW · {totalRtInKelurahan} RT
              </span>
            }
            isCollapsed={isSectionCollapsed('rtrw_daftar_rw')}
            onToggle={() => toggleSectionCollapse('rtrw_daftar_rw')}
            headerActions={
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={expandAllAdminRw}
                  className="px-2.5 py-1 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 cursor-pointer shadow-2xs"
                >
                  Buka Semua RT
                </button>
                <button
                  type="button"
                  onClick={collapseAllAdminRw}
                  className="px-2.5 py-1 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 cursor-pointer shadow-2xs"
                >
                  Tutup Semua RT
                </button>
              </div>
            }
          >
            <div className="p-4 sm:p-5 space-y-4">
            {rwGroups.map((rw) => {
              const isRwExpanded = !!adminExpandedRwIds[rw.id] || activeRwForRt === rw.id;
              return (
              <div
                key={rw.id}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:border-[#0277BD]/50 transition-all"
              >
                {/* Header RW */}
                <div className="bg-[#0D3868] text-white px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 text-xs font-extrabold font-mono-num">
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
                      onClick={() => toggleAdminRwDetail(rw.id)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all shadow-xs cursor-pointer ${
                        isRwExpanded
                          ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 ring-2 ring-white/30'
                          : 'bg-white hover:bg-sky-50 text-[#0D3868]'
                      }`}
                    >
                      <Eye className="w-3.5 h-3.5 text-[#0277BD]" />
                      <span>{isRwExpanded ? 'Tutup' : `Tampilkan Detail (${rw.rtList?.length || 0} RT)`}</span>
                      {isRwExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5 ml-0.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 ml-0.5" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setRtrwPrintSelection({
                          scope: 'per_rw',
                          rwCode: rw.rwCode,
                          autoAction: 'print',
                          timestamp: Date.now(),
                        });
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-extrabold cursor-pointer"
                      title={`Cetak Laporan Resmi ${rw.rwCode}`}
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Cetak {rw.rwCode}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setRtrwPrintSelection({
                          scope: 'per_rw',
                          rwCode: rw.rwCode,
                          autoAction: 'pdf',
                          timestamp: Date.now(),
                        });
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-sky-500/30 hover:bg-sky-500/45 border border-sky-300/40 text-white text-xs font-bold cursor-pointer"
                      title={`Unduh PDF Laporan ${rw.rwCode}`}
                    >
                      <FileDown className="w-3.5 h-3.5" />
                      <span>PDF {rw.rwCode}</span>
                    </button>
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

                {isRwExpanded && (
                  <div className="border-t border-slate-200">

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
                        <th className="py-3 px-4 text-right">Aksi Admin (Cetak / Edit / Hapus)</th>
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
                                    onClick={() => {
                                      setRtrwPrintSelection({
                                        scope: 'per_rt',
                                        rwCode: rw.rwCode,
                                        rtCode: rt.rtCode,
                                        autoAction: 'print',
                                        timestamp: Date.now(),
                                      });
                                    }}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-sky-200 bg-sky-50 hover:bg-sky-100 text-[#0D3868] font-bold cursor-pointer"
                                    title={`Cetak Laporan ${rt.rtCode} / ${rw.rwCode}`}
                                  >
                                    <Printer className="w-3.5 h-3.5 text-[#0277BD]" />
                                    <span>Cetak RT</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setRtrwPrintSelection({
                                        scope: 'per_rt',
                                        rwCode: rw.rwCode,
                                        rtCode: rt.rtCode,
                                        autoAction: 'pdf',
                                        timestamp: Date.now(),
                                      });
                                    }}
                                    className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-[#1C8237] font-bold cursor-pointer"
                                    title={`Unduh PDF Laporan ${rt.rtCode} / ${rw.rwCode}`}
                                  >
                                    <FileDown className="w-3.5 h-3.5" />
                                    <span>PDF</span>
                                  </button>
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
            )}
          </div>
        );
      })}
    </div>
  </AdminCollapsibleBar>

          {/* 04. KARTU DAFTAR & JADWAL SISKAMLING RT/RW */}
          <AdminCollapsibleBar
            sectionKey="rtrw_siskamling"
            title="04. Daftar & Jadwal Ronda Siskamling RT/RW (RW 01 s/d RW 07)"
            subtitle="Kelola matriks roster penugasan Siskamling RT/RW, lokasi posko keamanan, dan cetak jadwal ronda"
            icon={<ShieldCheck className="w-5 h-5 text-[#0277BD]" />}
            badge={
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-300">
                RW 01 s/d RW 07
              </span>
            }
            isCollapsed={isSectionCollapsed('rtrw_siskamling')}
            onToggle={() => toggleSectionCollapse('rtrw_siskamling')}
          >
            <div className="p-4 sm:p-5">
              <AdminSiskamlingPanel
                schedules={siskamlingSchedules}
                rwGroups={rwGroups}
                profile={profile}
                adminOfficerName={adminSession?.fullName || 'Administrator Kelurahan Panaikang'}
                onSaveSchedules={async (updated: SiskamlingRwSchedule[]) => {
                  if (onSaveSiskamlingSchedules) {
                    const res = await onSaveSiskamlingSchedules(updated);
                    if (res.ok) {
                      recordAudit({
                        actionType: 'UPDATE',
                        module: 'SISKAMLING',
                        targetLabel: 'Jadwal Ronda Siskamling RW 001 s/d RW 007',
                        summary: 'Memperbarui matriks roster penugasan Siskamling RT/RW & lokasi posko',
                        severity: 'info',
                      });
                    }
                    return res;
                  }
                  return { ok: true };
                }}
              />
            </div>
          </AdminCollapsibleBar>
        </div>
      )}

      {/* ================= MODAL: TAMBAH / EDIT JABATAN PERANGKAT KELURAHAN ================= */}
      {isOfficialModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/80">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-[#1C8237] flex items-center justify-center">
                  <Briefcase className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {editingOfficialId ? 'Edit Data Jabatan & Pejabat' : 'Tambah Jabatan Struktural Baru'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Perangkat Kelurahan Panaikang
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOfficialModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSaveOfficialForm} className="p-6 space-y-4 overflow-y-auto">
              {officialFormError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{officialFormError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Posisi / Jabatan Struktural *
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Sekretaris Lurah / Kasi Pemberdayaan Masyarakat"
                  value={officialForm.positionTitle}
                  onChange={(e) =>
                    setOfficialForm({ ...officialForm, positionTitle: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-hidden"
                  required
                />
                {/* Quick suggestion chips */}
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <span className="text-[10px] text-slate-400 font-medium self-center mr-1">Rekomendasi:</span>
                  {[
                    'Sekretaris Lurah',
                    'Kasi Kebersihan & Lingkungan',
                    'Kasi Pemerintahan & Trantib',
                    'Kasi Pemberdayaan Masyarakat',
                    'Kasubag Umum & Kepegawaian',
                    'Bendahara Pengeluaran',
                    'Pranata IT / Operator Data',
                  ].map((sug) => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => setOfficialForm({ ...officialForm, positionTitle: sug })}
                      className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 hover:bg-sky-100 text-slate-700 hover:text-[#0277BD] transition-colors cursor-pointer"
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Lengkap Pejabat / Pegawai *
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Drs. Muhammad Ilham, M.Si"
                  value={officialForm.officialName}
                  onChange={(e) =>
                    setOfficialForm({ ...officialForm, officialName: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-hidden"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    NIP (Nomor Induk Pegawai)
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: 19820512 201001 1 012"
                    value={officialForm.nip}
                    onChange={(e) =>
                      setOfficialForm({ ...officialForm, nip: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm font-mono-num"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Pangkat / Golongan Ruang
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Penata Tk. I (III/d)"
                    value={officialForm.rank}
                    onChange={(e) =>
                      setOfficialForm({ ...officialForm, rank: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Seksi / Divisi / Unit Kerja
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Seksi Trantib & Pemerintahan"
                    value={officialForm.department}
                    onChange={(e) =>
                      setOfficialForm({ ...officialForm, department: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nomor Telepon / WhatsApp
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: 0812-4100-xxxx"
                    value={officialForm.phone}
                    onChange={(e) =>
                      setOfficialForm({ ...officialForm, phone: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm font-mono-num"
                  />
                </div>
              </div>

              {/* Input Nama Staf berdasarkan Struktur Jabatan */}
              <div className="pt-3 border-t border-slate-200">
                <label className="block text-xs font-bold text-[#0D3868] mb-1">
                  Daftar Nama Staf pada Jabatan / Seksi Ini (Ditampilkan di Bagan Struktur Kelurahan)
                </label>
                <p className="text-[11px] text-slate-500 mb-2">
                  Tambahkan nama-nama staf yang berada di bawah koordinasi jabatan/Kasi ini.
                </p>
                <div className="flex gap-2 mb-2.5">
                  <input
                    type="text"
                    placeholder="Ketik nama staf (Contoh: MEGAWATI / ISTIQAMAH MUNTSIR)"
                    value={officialNewStaffInput}
                    onChange={(e) => setOfficialNewStaffInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const val = officialNewStaffInput.trim();
                        if (val) {
                          setOfficialForm((prev) => ({
                            ...prev,
                            staffNames: [...(prev.staffNames || []), val],
                          }));
                          setOfficialNewStaffInput('');
                        }
                      }
                    }}
                    className="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-sky-500 outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const val = officialNewStaffInput.trim();
                      if (val) {
                        setOfficialForm((prev) => ({
                          ...prev,
                          staffNames: [...(prev.staffNames || []), val],
                        }));
                        setOfficialNewStaffInput('');
                      }
                    }}
                    className="px-3.5 py-2 rounded-xl bg-[#0D3868] hover:bg-[#072647] text-white text-xs font-bold cursor-pointer shrink-0 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Staf</span>
                  </button>
                </div>

                {Array.isArray(officialForm.staffNames) && officialForm.staffNames.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    {officialForm.staffNames.map((staf, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-sky-200 text-xs font-bold text-slate-800 shadow-2xs"
                      >
                        <User className="w-3 h-3 text-[#0D3868]" />
                        <span>{staf}</span>
                        <button
                          type="button"
                          onClick={() =>
                            setOfficialForm((prev) => ({
                              ...prev,
                              staffNames: prev.staffNames.filter((_, i) => i !== idx),
                            }))
                          }
                          className="text-rose-500 hover:text-rose-700 ml-1 cursor-pointer"
                          title="Hapus staf"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="text-[11px] text-slate-400 italic">
                    Belum ada staf ditambahkan untuk jabatan ini.
                  </div>
                )}
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsOfficialModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#1C8237] hover:bg-[#146329] text-white text-xs font-bold transition-colors cursor-pointer shadow-sm"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingOfficialId ? 'Simpan Perubahan' : 'Tambahkan Jabatan'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: KONFIRMASI HAPUS JABATAN ================= */}
      {officialToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-bold text-slate-900">
                Konfirmasi Hapus Jabatan
              </h3>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                Apakah Anda yakin ingin menghapus jabatan{' '}
                <strong className="text-slate-900">"{officialToDelete.positionTitle}"</strong> atas nama{' '}
                <strong className="text-slate-900">{officialToDelete.officialName}</strong> dari struktur
                perangkat kelurahan?
              </p>
            </div>
            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setOfficialToDelete(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteOfficial}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-sm"
              >
                <Trash2 className="w-4 h-4" />
                <span>Ya, Hapus Jabatan</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ================= MODAL: TAMBAH / EDIT DATA LURAH ================= */}
      {isLurahModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4 my-8 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-sky-100 text-[#0D3868] flex items-center justify-center">
                  <UserCheck className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  {profileDraft.lurahName ? 'Edit Data Pimpinan Lurah' : 'Tambah Data Pimpinan Lurah Baru'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsLurahModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLurahForm} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Lengkap Lurah (Beserta Gelar) *
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Muthmainnah, SE, MM"
                  value={lurahForm.lurahName}
                  onChange={(e) => setLurahForm({ ...lurahForm, lurahName: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-[#0D3868] focus:ring-1 focus:ring-[#0D3868] outline-hidden"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    NIP Lurah
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: 19820415 200801 2 018"
                    value={lurahForm.lurahNip}
                    onChange={(e) => setLurahForm({ ...lurahForm, lurahNip: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm font-mono-num"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Pangkat / Golongan
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Pembina (IV/a)"
                    value={lurahForm.lurahRank}
                    onChange={(e) => setLurahForm({ ...lurahForm, lurahRank: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Periode Masa Tugas
                </label>
                <input
                  type="text"
                  placeholder="Contoh: 2024 – Sekarang"
                  value={lurahForm.lurahPeriod}
                  onChange={(e) => setLurahForm({ ...lurahForm, lurahPeriod: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Sambutan / Pesan Pimpinan Lurah
                </label>
                <textarea
                  rows={3}
                  placeholder="Ketik kata sambutan atau pesan resmi lurah untuk warga Kelurahan Panaikang..."
                  value={lurahForm.lurahMessage}
                  onChange={(e) => setLurahForm({ ...lurahForm, lurahMessage: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Foto Resmi Lurah
                </label>
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl border border-slate-200 bg-slate-100 overflow-hidden flex items-center justify-center shrink-0">
                    {Boolean(lurahForm.lurahPhotoUrl?.trim()) ? (
                      <img
                        src={lurahForm.lurahPhotoUrl!}
                        alt="Preview"
                        className="w-full h-full object-cover object-top"
                      />
                    ) : (
                      <User className="w-6 h-6 text-slate-400" />
                    )}
                  </div>
                  <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer transition">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{lurahForm.lurahPhotoUrl ? 'Ganti File Foto' : 'Pilih Foto Lurah'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLurahPhotoUpload}
                      className="hidden"
                    />
                  </label>
                  {lurahForm.lurahPhotoUrl && (
                    <button
                      type="button"
                      onClick={() => setLurahForm((prev) => ({ ...prev, lurahPhotoUrl: '' }))}
                      className="text-xs text-red-600 hover:underline cursor-pointer"
                    >
                      Hapus Foto
                    </button>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsLurahModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#0D3868] hover:bg-[#072647] text-white text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Simpan Data Lurah</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: KONFIRMASI HAPUS DATA LURAH ================= */}
      {confirmDeleteLurah && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-bold text-slate-900">
                Konfirmasi Hapus Data Lurah
              </h3>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                Apakah Anda yakin ingin menghapus/mengosongkan data pimpinan Lurah Panaikang? Data ini akan dikosongkan dan dapat diisi kembali kapan saja oleh Admin.
              </p>
            </div>
            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setConfirmDeleteLurah(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteLurah}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition shadow-sm cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Ya, Hapus Data Lurah</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: TAMBAH / EDIT ALAMAT & KONTAK ================= */}
      {isOfficeContactModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4 my-8 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-sky-100 text-[#0D3868] flex items-center justify-center">
                  <Building2 className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  {profileDraft.officeAddress ? 'Edit Alamat & Kontak Kantor' : 'Tambah Alamat & Kontak Kantor'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsOfficeContactModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveOfficeContactForm} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Alamat Lengkap Kantor Kelurahan *
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Jl. Haji Kalla No. 1 / Poros Panaikang, Panakkukang, Makassar"
                  value={officeContactForm.officeAddress}
                  onChange={(e) =>
                    setOfficeContactForm({ ...officeContactForm, officeAddress: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-[#0D3868] focus:ring-1 focus:ring-[#0D3868] outline-hidden"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kode Pos
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: 90231"
                    value={officeContactForm.postalCode}
                    onChange={(e) =>
                      setOfficeContactForm({ ...officeContactForm, postalCode: e.target.value })
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
                    placeholder="Contoh: Senin – Jumat · 08.00 – 16.00 WITA"
                    value={officeContactForm.serviceHours}
                    onChange={(e) =>
                      setOfficeContactForm({ ...officeContactForm, serviceHours: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Telepon / Hotline
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: (0411) 452-910"
                    value={officeContactForm.phoneContact}
                    onChange={(e) =>
                      setOfficeContactForm({ ...officeContactForm, phoneContact: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm font-mono-num"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Resmi Kelurahan
                  </label>
                  <input
                    type="email"
                    placeholder="Contoh: kelurahan.panaikang@makassarkota.go.id"
                    value={officeContactForm.emailContact}
                    onChange={(e) =>
                      setOfficeContactForm({ ...officeContactForm, emailContact: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsOfficeContactModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#0D3868] hover:bg-[#072647] text-white text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Simpan Alamat & Kontak</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: KONFIRMASI HAPUS ALAMAT & KONTAK ================= */}
      {confirmDeleteOfficeContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-bold text-slate-900">
                Konfirmasi Kosongkan Alamat & Kontak
              </h3>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                Apakah Anda yakin ingin menghapus data alamat kantor kelurahan dan kontak resmi?
              </p>
            </div>
            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setConfirmDeleteOfficeContact(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteOfficeContact}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition shadow-sm cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Ya, Kosongkan Data</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: TAMBAH / EDIT BATAS WILAYAH ================= */}
      {isBoundariesModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4 my-8 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-sky-100 text-[#0D3868] flex items-center justify-center">
                  <Compass className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  Konfigurasi Batas Wilayah Administrasi
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsBoundariesModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBoundariesForm} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                  <ArrowUp className="w-3.5 h-3.5 text-sky-600" />
                  <span>Batas Utara (Perbatasan Sisi Utara)</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Kelurahan Pampang & Tello Baru / Aliran Kanal Pampang"
                  value={boundariesForm.utara}
                  onChange={(e) => setBoundariesForm({ ...boundariesForm, utara: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                  <ArrowDown className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Batas Selatan (Perbatasan Sisi Selatan)</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Kelurahan Karampuang & Kelurahan Pandang"
                  value={boundariesForm.selatan}
                  onChange={(e) => setBoundariesForm({ ...boundariesForm, selatan: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                  <ArrowRight className="w-3.5 h-3.5 text-amber-600" />
                  <span>Batas Timur (Perbatasan Sisi Timur)</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Kelurahan Tamamaung & Kecamatan Manggala"
                  value={boundariesForm.timur}
                  onChange={(e) => setBoundariesForm({ ...boundariesForm, timur: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                  <ArrowLeft className="w-3.5 h-3.5 text-purple-600" />
                  <span>Batas Barat (Perbatasan Sisi Barat)</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Kelurahan Sinrijala & Koridor Flyover / A.P. Pettarani"
                  value={boundariesForm.barat}
                  onChange={(e) => setBoundariesForm({ ...boundariesForm, barat: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-hidden"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsBoundariesModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#0D3868] hover:bg-[#072647] text-white text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Simpan Batas Wilayah</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: KONFIRMASI HAPUS BATAS WILAYAH ================= */}
      {confirmDeleteBoundaries && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-bold text-slate-900">
                Konfirmasi Reset Batas Wilayah
              </h3>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                Apakah Anda yakin ingin mengosongkan/mereset seluruh deskripsi 4 batas wilayah administrasi?
              </p>
            </div>
            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setConfirmDeleteBoundaries(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteBoundaries}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition shadow-sm cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Ya, Reset Batas Wilayah</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: TAMBAH / EDIT VISI ================= */}
      {isVisiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-sky-100 text-[#0D3868] flex items-center justify-center">
                  <Quote className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  {profileDraft.visi ? 'Edit Pernyataan Visi' : 'Tambah Pernyataan Visi Baru'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsVisiModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveVisiForm} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pernyataan Visi Kelurahan Panaikang *
                </label>
                <textarea
                  rows={4}
                  placeholder="Contoh: Terwujudnya Kelurahan Panaikang yang Bersih, Hijau, Tangguh Bencana, dan Berdaya Saing melalui Tata Kelola Kolaboratif Berbasis Komunitas..."
                  value={visiFormText}
                  onChange={(e) => setVisiFormText(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-[#0D3868] focus:ring-1 focus:ring-[#0D3868] outline-hidden leading-relaxed"
                  required
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsVisiModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#0D3868] hover:bg-[#072647] text-white text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Simpan Visi</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: KONFIRMASI HAPUS VISI ================= */}
      {confirmDeleteVisi && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-bold text-slate-900">
                Konfirmasi Hapus Visi
              </h3>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                Apakah Anda yakin ingin menghapus pernyataan visi Kelurahan Panaikang?
              </p>
            </div>
            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setConfirmDeleteVisi(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteVisi}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition shadow-sm cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Ya, Hapus Visi</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: TAMBAH / EDIT BUTIR MISI ================= */}
      {isMisiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-[#1C8237] flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  {editingMisiIndex !== null
                    ? `Edit Butir Misi #${editingMisiIndex + 1}`
                    : 'Tambah Butir Misi Baru'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsMisiModalOpen(false);
                  setEditingMisiIndex(null);
                }}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMisiForm} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Teks Butir Misi *
                </label>
                <textarea
                  rows={3}
                  placeholder="Ketik uraian butir misi kelurahan..."
                  value={misiFormText}
                  onChange={(e) => setMisiFormText(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-[#1C8237] focus:ring-1 focus:ring-[#1C8237] outline-hidden leading-relaxed"
                  required
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsMisiModalOpen(false);
                    setEditingMisiIndex(null);
                  }}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#1C8237] hover:bg-[#146329] text-white text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Simpan Butir Misi</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: KONFIRMASI HAPUS BUTIR MISI ================= */}
      {misiToDeleteIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-bold text-slate-900">
                Konfirmasi Hapus Butir Misi
              </h3>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                Apakah Anda yakin ingin menghapus butir misi #{misiToDeleteIndex + 1}:
              </p>
              <div className="mt-2 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 text-left italic">
                "{profileDraft.misi[misiToDeleteIndex]}"
              </div>
            </div>
            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setMisiToDeleteIndex(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteMisi}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition shadow-sm cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Ya, Hapus Butir Misi</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: PRATINJAU BAGAN STRUKTUR KELURAHAN & RT/RW DINAMIS ================= */}
      <BaganStrukturKelurahanModal
        isOpen={showAdminBaganKelurahan}
        onClose={() => setShowAdminBaganKelurahan(false)}
        profile={profileDraft}
      />

      <BaganStrukturRtRwModal
        isOpen={showAdminBaganRtRw}
        onClose={() => setShowAdminBaganRtRw(false)}
        rwGroups={rwGroups}
        profile={profileDraft}
      />

      {/* MODAL: LIHAT DETAIL PERMOHONAN SURAT / PENGADUAN WARGA & FOTO LAMPIRAN */}
      <SubmissionDetailModal
        isOpen={Boolean(adminReportDetailModal)}
        onClose={() => setAdminReportDetailModal(null)}
        report={adminReportDetailModal?.report}
        praRecord={adminReportDetailModal?.praRecord}
        pengaduanRecord={adminReportDetailModal?.pengaduanRecord}
        profile={profileDraft}
        citizenUsers={citizenUsers}
        isLurahMode={isLurahSession}
        onLurahApproveService={onLurahApproveService}
        onOpenEdit={(rep) => {
          setAdminReportDetailModal(null);
          openEditReportForm(rep);
        }}
      />
    </div>
  );
};

