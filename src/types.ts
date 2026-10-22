export type AppView =
  | 'beranda'
  | 'profil'
  | 'rtrw'
  | 'warga'
  | 'lurah'
  | 'peta'
  | 'sampah'
  | 'kerjabakti'
  | 'urbanfarming'
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
  | 'urban_farming'
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
  | 'URBAN_FARMING'
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

export type FarmType =
  | 'Hidroponik / NFT'
  | 'Akuaponik / Budikdamber'
  | 'Pekarangan & Polybag Organik'
  | 'Rumah Jamur & TOGA';

export interface UrbanFarmingSpot {
  id: string;
  name: string;
  rw: string;
  rt: string;
  locationAddress: string;
  groupName: string;
  coordinatorName: string;
  coordinatorPhone: string;
  farmingType: FarmType;
  commodities: string[];
  activeMembers: number;
  monthlyProductionKg: number;
  nextHarvestDate: string;
  harvestEstimatedKg: number;
  status: 'Aktif Produktif' | 'Masa Tanam' | 'Siap Panen';
  description: string;
  photoUrl: string;
}

export interface SeedRequestItem {
  id: string;
  applicantName: string;
  applicantPhone: string;
  rw: string;
  rt: string;
  address: string;
  requestedSeeds: string[];
  plantingMethod: string;
  needsTraining: boolean;
  status: 'Menunggu Pengambilan' | 'Disetujui' | 'Telah Didistribusikan' | 'Ditolak';
  createdAt: string;
}

// ==================== FULL URBAN FARMING KELURAHAN PANAIKANG SPEC TYPES ====================

export type LandType =
  | 'Pekarangan rumah'
  | 'Kebun kelompok'
  | 'Lahan kosong'
  | 'Lahan fasilitas umum'
  | 'Lahan lainnya';

export type LandManagementStatus = 'Aktif' | 'Tidak aktif' | 'Dalam pengembangan';

export interface UrbanFarmingLocation {
  id: string;
  name: string;
  address: string;
  rw: string;
  rt: string;
  picName: string;
  picPhone: string;
  landAreaSqm: number;
  landType: LandType;
  latitude: number | null;
  longitude: number | null;
  managementStatus: LandManagementStatus;
  description: string;
  photoUrl: string;
  recordedDate: string;
  isPotentialLand?: boolean;
}

export type FarmerGroupStatus = 'Aktif' | 'Tidak aktif' | 'Pemula';

export interface FarmerGroup {
  id: string;
  name: string;
  leaderName: string;
  memberCount: number;
  membersList: string[];
  address: string;
  phone: string;
  managedLocationIds: string[];
  activityType: string;
  formationDate: string;
  status: FarmerGroupStatus;
  documentation: string;
}

export type CropCategory =
  | 'Sayuran daun'
  | 'Sayuran buah'
  | 'Tanaman obat'
  | 'Tanaman buah'
  | 'Tanaman pangan'
  | 'Tanaman lainnya';

export type GrowthStatus =
  | 'Persiapan lahan'
  | 'Baru ditanam'
  | 'Masa pertumbuhan'
  | 'Masa berbunga'
  | 'Masa berbuah'
  | 'Siap panen'
  | 'Sudah dipanen'
  | 'Gagal panen';

export type CropCondition = 'Sangat Baik' | 'Baik' | 'Perlu Perhatian' | 'Terserang Hama';

export interface CropItem {
  id: string;
  name: string;
  category: CropCategory;
  locationId: string;
  groupId: string;
  seedlingCount: number;
  plantingDate: string;
  estimatedHarvestDate: string;
  condition: CropCondition;
  growthStatus: GrowthStatus;
  notes: string;
  photoUrl: string;
}

export type CareActivityType =
  | 'Penyiraman'
  | 'Pemupukan'
  | 'Penyiangan'
  | 'Pengendalian hama'
  | 'Pemangkasan'
  | 'Penggantian tanaman'
  | 'Pemeriksaan kondisi tanaman'
  | 'Kegiatan lainnya';

export interface PlantCareLog {
  id: string;
  dateTime: string;
  locationId: string;
  cropId: string;
  activityType: CareActivityType;
  officerName: string;
  conditionBefore: string;
  conditionAfter: string;
  notes: string;
  photoUrl: string;
  nextScheduleDate: string;
  reminderStatus: 'Selesai' | 'Perlu Dilakukan' | 'Mendatang';
}

export type HarvestUnit = 'Kilogram' | 'Gram' | 'Buah' | 'Ikat' | 'Satuan lainnya';

export type HarvestQuality = 'Grade A (Super)' | 'Grade B (Baik)' | 'Grade C (Standar)';

export type HarvestUtilization =
  | 'Konsumsi kelompok'
  | 'Dibagikan kepada warga'
  | 'Dijual'
  | 'Bantuan sosial'
  | 'Pemanfaatan lainnya';

export interface HarvestRecord {
  id: string;
  harvestDate: string;
  locationId: string;
  cropId: string;
  groupId: string;
  yieldAmount: number;
  unit: HarvestUnit;
  quality: HarvestQuality;
  utilization: HarvestUtilization;
  recordedBy: string;
  notes: string;
  photoUrl: string;
}

export type InventoryCategory =
  | 'Bibit'
  | 'Pupuk'
  | 'Media tanam'
  | 'Pot dan polybag'
  | 'Peralatan berkebun'
  | 'Instalasi hidroponik'
  | 'Peralatan penyiraman'
  | 'Sarana lainnya';

export type InventoryCondition = 'Baik / Siap Pakai' | 'Perlu Perbaikan' | 'Habis / Perlu Pengadaan';

export interface FarmingInventoryItem {
  id: string;
  itemName: string;
  category: InventoryCategory;
  quantity: number;
  unit: string;
  condition: InventoryCondition;
  storageLocation: string;
  recordedDate: string;
  source: string;
  notes: string;
}

export type SupplyRequestStatus =
  | 'Diajukan'
  | 'Dalam verifikasi'
  | 'Disetujui'
  | 'Ditolak'
  | 'Dalam penyaluran'
  | 'Selesai disalurkan';

export interface SupplyRequestItem {
  id: string;
  requesterGroupId: string;
  requesterName: string;
  requesterPhone: string;
  locationId: string;
  itemNeeded: string;
  quantityNeeded: string;
  reason: string;
  requestDate: string;
  status: SupplyRequestStatus;
  verificationNotes?: string;
}



