export type AppView =
  | 'beranda'
  | 'profil'
  | 'rtrw'
  | 'warga'
  | 'lurah'
  | 'peta'
  | 'sampah'
  | 'kerjabakti'
  | 'admin';

export type ReportStatus = 'Menunggu Verifikasi' | 'Sedang Ditangani' | 'Selesai';

export type ReportCategory =
  | 'Sampah Liar & TPS'
  | 'Drainase & Genangan'
  | 'Pohon & Ruang Hijau'
  | 'Ketertiban & Fasum';

export type ReportUrgency = 'Normal' | 'Tinggi' | 'Darurat';

export interface CitizenReport {
  id: string;
  ticketCode: string;
  title: string;
  description: string;
  category: ReportCategory;
  urgency: ReportUrgency;
  status: ReportStatus;
  reporterName: string;
  reporterPhone: string;
  rw: string;
  rt: string;
  locationName: string;
  // Normalized map coordinates (0-100 % on Kelurahan Panaikang spatial map)
  mapX: number;
  mapY: number;
  coordinatesLabel: string;
  createdAt: string;
  updatedAt: string;
  assignedTeam: string;
  responseNote: string;
  upvotes: number;
  imageUrl: string;
  // Follow-up & work completion proof fields populated by Admin / Operator
  verifiedBy?: string;
  verifiedAt?: string;
  completedAt?: string;
  completionPhotoUrl?: string;
  followUpPhotos?: string[];
  // Back-End Pengurusan Warga (7 Kategori & 44 Sub-Menu)
  serviceCategoryId?: string;
  serviceCategoryTitle?: string;
  serviceSubItemId?: string;
  serviceSubItemLabel?: string;
  documentCode?: string;
  officialHeaderTitle?: string;
  processingUnit?: string;
  applicantNik?: string;
  specificFieldsData?: Record<string, string>;
  letterRegisterNumber?: string;
  signedByOfficer?: string;
}

export interface RtItem {
  id: string;
  rtCode: string;
  rtName: string;
  ketuaRtName: string;
  phone: string;
  areaDescription: string;
  householdsCount: number;
}

export interface RwGroup {
  id: string;
  rwCode: string;
  rwName: string;
  ketuaRwName: string;
  phone: string;
  areaDescription: string;
  rtList: RtItem[];
}

export interface WasteBankUnit {
  id: string;
  rw: string;
  unitName: string;
  coordinator: string;
  locationLabel: string;
  mapX: number;
  mapY: number;
  organikKg: number;
  anorganikKg: number;
  residuKg: number;
  activeHouseholds: number;
  pickupSchedule: string;
  lastUpdated: string;
}

export interface WasteLogEntry {
  id: string;
  date: string;
  rw: string;
  unitName: string;
  organikKg: number;
  anorganikKg: number;
  residuKg: number;
  officerName: string;
  notes: string;
}

export interface CleanupEvent {
  id: string;
  title: string;
  date: string;
  timeRange: string;
  rw: string;
  rtScope: string;
  locationName: string;
  mapX: number;
  mapY: number;
  coordinator: string;
  status: 'Terjadwal' | 'Sedang Berlangsung' | 'Tuntas';
  targetParticipants: number;
  registeredParticipants: number;
  collectedWasteKg: number;
  focusAreas: string[];
  equipmentNeeded: string[];
  imageUrl: string;
  documentationPhotos?: string[];
  summaryNote: string;
}

export interface MonthlyReportTrend {
  month: string;
  fullMonth: string;
  totalLaporan: number;
  selesai: number;
  proses: number;
  sampahLiar: number;
  drainase: number;
  pohonHijau: number;
  fasum: number;
  indeksKebersihan: number;
}

export interface KelurahanProfile {
  lurahName: string;
  lurahNip: string;
  lurahRank: string;
  lurahPeriod: string;
  lurahMessage: string;
  lurahPhotoUrl?: string;
  sekretarisName: string;
  kasiKebersihanName: string;
  kasiPemerintahanName: string;
  officeAddress: string;
  subDistrict: string;
  city: string;
  postalCode: string;
  serviceHours: string;
  phoneContact: string;
  emailContact: string;
  areaKm2: string;
  totalRw: number;
  totalRt: number;
  totalPopulation: string;
  visi: string;
  misi: string[];
  boundaries: {
    utara: string;
    selatan: string;
    timur: string;
    barat: string;
  };
}

export interface KelurahanInfoItem {
  id: string;
  title: string;
  category: string;
  summary: string;
  content: string;
  imageUrl: string;
  publishedAt: string;
  author: string;
  instagramHandle?: string;
  instagramPostUrl?: string;
  instagramLikes?: number;
  instagramCommentsCount?: number;
  isInstagramSynced?: boolean;
  hashtags?: string[];
}

export interface WhatsAppRecipient {
  id: string;
  name: string;
  role: string;
  phoneNumber: string;
  isPrimary: boolean;
  isActive: boolean;
  rwScope: string;
  notes?: string;
}

export type AdminTabId =
  | 'dashboard_lurah'
  | 'pengurusan_warga'
  | 'profil'
  | 'info'
  | 'laporan'
  | 'sampah'
  | 'kerjabakti'
  | 'rtrw'
  | 'parameter_user'
  | 'log_aktivitas';

export type AdminRoleLevel = 'master_admin' | 'admin_bidang' | 'operator' | 'viewer';

export type AdminActivityActionType =
  | 'LOGIN'
  | 'LOGOUT'
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'VERIFY_STATUS'
  | 'ACCESS_CHANGE'
  | 'EXPORT';

export type AdminActivityModule =
  | 'AUTENTIKASI'
  | 'PENGURUSAN_WARGA'
  | 'PROFIL_KELURAHAN'
  | 'STRUKTUR_RTRW'
  | 'INFORMASI_KELURAHAN'
  | 'LAPORAN_WARGA'
  | 'BANK_SAMPAH'
  | 'KERJA_BAKTI'
  | 'PARAMETER_USER'
  | 'KATALOG_SOP';

export interface AdminActivityLog {
  id: string;
  timestamp: string;
  createdAtMs: number;
  actorUsername: string;
  actorName: string;
  actorJabatan: string;
  actorNip?: string;
  actorRoleLevel: AdminRoleLevel;
  actionType: AdminActivityActionType;
  module: AdminActivityModule;
  targetId?: string;
  targetLabel: string;
  summary: string;
  details?: string;
  beforeValue?: string;
  afterValue?: string;
  severity: 'info' | 'warning' | 'critical';
}

export interface AdminActionPermissions {
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canVerifyAndIssueLetter: boolean;
  canConfigureCatalog: boolean;
  canManageWhatsApp: boolean;
  canExportPrintPdf: boolean;
}

export interface AdminUserAccount {
  id: string;
  username: string;
  password: string;
  fullName: string;
  nip: string;
  jabatan: string;
  unitBidang: string;
  phone: string;
  roleLevel: AdminRoleLevel;
  isMasterLurah?: boolean;
  isActive: boolean;
  allowedAdminTabs: AdminTabId[];
  allowedServiceCategories: string[];
  actionPermissions: AdminActionPermissions;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  notes?: string;
}


