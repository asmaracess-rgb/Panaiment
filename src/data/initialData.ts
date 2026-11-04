import type {
  CitizenReport,
  WasteBankUnit,
  WasteLogEntry,
  TebaSpot,
  BioporiPoint,
  CleanupEvent,
  MonthlyReportTrend,
  KelurahanProfile,
  StructuralOfficial,
  KelurahanInfoItem,
  RwGroup,
  WhatsAppRecipient,
  AdminUserAccount,
  AdminActivityLog,
  UrbanFarmingSpot,
  SeedRequestItem,
  UrbanFarmingLocation,
  FarmerGroup,
  CropItem,
  PlantCareLog,
  HarvestRecord,
  FarmingInventoryItem,
  SupplyRequestItem,
} from '../types.ts';

export const HERO_IMAGE_PATH = '/images/hero_nipah_mall_panaikang_1791355921119.jpg';
export const IMG_NIPAH_MALL = '/images/gedung_nipah_mall_makassar_1791355936725.jpg';
export const IMG_KERJA_BAKTI = '/images/dokumentasi_kerja_bakti_1_1791349247077.jpg';
export const IMG_BANK_SAMPAH = '/images/dokumentasi_bank_sampah_1791349262115.jpg';
export const IMG_DRAINASE = '/images/dokumentasi_drainase_bersih_1791349273322.jpg';

// Official @kelurahan.panaikang Instagram Image Assets
export const IG_PROFILE_PANAIKANG = '/images/ig_profile_panaikang.jpg';
export const IG_POST_1 = '/images/ig_post_1_DdrMaapvrr4.jpg';
export const IG_POST_2 = '/images/ig_post_2_DbnJW3OvANh.jpg';
export const IG_POST_3 = '/images/ig_post_3_DcN5ah3vZdT.jpg';
export const IG_POST_4 = '/images/ig_post_4_DeJpFcVJ6jq.jpg';
export const IG_POST_5 = '/images/ig_post_5_DeGDDkFPvJs.jpg';
export const IG_POST_6 = '/images/ig_post_6_Dd-xlSLvXKn.jpg';
export const IG_POST_7 = '/images/ig_post_7_Dd33fJSy13M.jpg';
export const IG_POST_8 = '/images/ig_post_8_Ddtg69NPsBB.jpg';
export const IG_POST_9 = '/images/ig_post_9_Ddn9BnBvEId.jpg';
export const IG_POST_10 = '/images/ig_post_10_DdfhgGQPaJX.jpg';
export const IG_POST_11 = '/images/ig_post_11_DdfU_r-PUM3.jpg';
export const IG_POST_12 = '/images/ig_post_12_Dda51qXP4nb.jpg';

// Seluruh data bawaan sistem dikosongkan sesuai permintaan pengguna.
// Administrator kelurahan akan menginput seluruh data dari awal melalui Panel Admin.

export const INITIAL_REPORTS: CitizenReport[] = [];

export const INITIAL_WASTE_UNITS: WasteBankUnit[] = [];

export const INITIAL_WASTE_LOGS: WasteLogEntry[] = [];

export const INITIAL_TEBA_SPOTS: TebaSpot[] = [];

export const INITIAL_BIOPORI_POINTS: BioporiPoint[] = [];

export const INITIAL_CLEANUP_EVENTS: CleanupEvent[] = [];

export const INITIAL_RW_GROUPS: RwGroup[] = [
  {
    id: 'rw-01',
    rwCode: 'RW 01',
    rwName: 'RW 01',
    ketuaRwName: '',
    phone: '',
    areaDescription: '',
    rtList: [],
  },
  {
    id: 'rw-02',
    rwCode: 'RW 02',
    rwName: 'RW 02',
    ketuaRwName: '',
    phone: '',
    areaDescription: '',
    rtList: [],
  },
  {
    id: 'rw-03',
    rwCode: 'RW 03',
    rwName: 'RW 03',
    ketuaRwName: '',
    phone: '',
    areaDescription: '',
    rtList: [],
  },
  {
    id: 'rw-04',
    rwCode: 'RW 04',
    rwName: 'RW 04',
    ketuaRwName: '',
    phone: '',
    areaDescription: '',
    rtList: [],
  },
  {
    id: 'rw-05',
    rwCode: 'RW 05',
    rwName: 'RW 05',
    ketuaRwName: '',
    phone: '',
    areaDescription: '',
    rtList: [],
  },
  {
    id: 'rw-06',
    rwCode: 'RW 06',
    rwName: 'RW 06',
    ketuaRwName: '',
    phone: '',
    areaDescription: '',
    rtList: [],
  },
  {
    id: 'rw-07',
    rwCode: 'RW 07',
    rwName: 'RW 07',
    ketuaRwName: '',
    phone: '',
    areaDescription: '',
    rtList: [],
  },
];

export const INITIAL_MONTHLY_TRENDS: MonthlyReportTrend[] = [];

export const INITIAL_OFFICIALS: StructuralOfficial[] = [];

export const INITIAL_KELURAHAN_PROFILE: KelurahanProfile = {
  lurahName: '',
  lurahNip: '',
  lurahRank: '',
  lurahPeriod: '',
  lurahMessage: '',
  lurahPhotoUrl: '',
  sekretarisName: '',
  sekretarisNip: '',
  kasiKebersihanName: '',
  kasiKebersihanNip: '',
  kasiPemerintahanName: '',
  kasiPemerintahanNip: '',
  kasiPemberdayaanName: '',
  kasiPemberdayaanNip: '',
  stafPemerintahan: [],
  stafPemberdayaan: [],
  stafKebersihan: [],
  perwaliReference: 'PERWALI KOTA MAKASSAR NOMOR 65 TAHUN 2023',
  ketuaLpmName: '',
  officials: [],
  officeAddress: '',
  subDistrict: 'Kecamatan Panakkukang',
  city: 'Kota Makassar, Provinsi Sulawesi Selatan',
  postalCode: '90231',
  serviceHours: 'Senin – Jumat · 08:00 – 16:00 WITA',
  phoneContact: '',
  emailContact: '',
  areaKm2: '',
  totalRw: 7,
  totalRt: 0,
  totalPopulation: '',
  visi: '',
  misi: [],
  boundaries: {
    utara: '',
    selatan: '',
    timur: '',
    barat: '',
  },
};

export const INITIAL_KELURAHAN_INFOS: KelurahanInfoItem[] = [];

export const INITIAL_WHATSAPP_RECIPIENTS: WhatsAppRecipient[] = [];

export const INITIAL_ADMIN_USERS: AdminUserAccount[] = [
  {
    id: 'usr-master-lurah',
    username: 'lurah',
    password: 'panaikang2026',
    fullName: 'Lurah Panaikang',
    nip: '',
    jabatan: 'Lurah Panaikang · Master / Super Admin',
    unitBidang: 'Pimpinan Kelurahan Panaikang',
    phone: '',
    roleLevel: 'master_admin',
    isMasterLurah: true,
    isActive: true,
    allowedAdminTabs: [
      'dashboard_lurah',
      'pengurusan_warga',
      'profil',
      'info',
      'laporan',
      'sampah',
      'kerjabakti',
      'urban_farming',
      'rtrw',
      'traffic',
      'parameter_user',
      'log_aktivitas',
    ],
    allowedServiceCategories: [
      'adminduk',
      'surat_keterangan',
      'pelayanan_usaha',
      'masalah_lingkungan',
      'bantuan_sosial',
      'sosial_kemasyarakatan',
      'pengaduan_warga',
    ],
    actionPermissions: {
      canCreate: true,
      canEdit: true,
      canDelete: true,
      canVerifyAndIssueLetter: true,
      canConfigureCatalog: true,
      canManageWhatsApp: true,
      canExportPrintPdf: true,
    },
    createdAt: '01 Jan 2026',
    updatedAt: '01 Jan 2026',
    lastLoginAt: 'Belum login',
    notes: 'Akun Master Admin / Super Admin Lurah Panaikang dengan otoritas penuh seluruh modul dan pengaturan batasan akses user.',
  },
  {
    id: 'usr-sekretaris',
    username: 'sekretaris',
    password: 'panaikang2026',
    fullName: 'Sekretaris Kelurahan',
    nip: '',
    jabatan: 'Sekretaris Kelurahan · Koordinator Satu Data',
    unitBidang: 'Sekretariat Kelurahan Panaikang',
    phone: '',
    roleLevel: 'admin_bidang',
    isMasterLurah: false,
    isActive: true,
    allowedAdminTabs: [
      'pengurusan_warga',
      'profil',
      'info',
      'laporan',
      'rtrw',
      'traffic',
    ],
    allowedServiceCategories: [
      'adminduk',
      'surat_keterangan',
      'pelayanan_usaha',
      'masalah_lingkungan',
      'bantuan_sosial',
      'sosial_kemasyarakatan',
      'pengaduan_warga',
    ],
    actionPermissions: {
      canCreate: true,
      canEdit: true,
      canDelete: false,
      canVerifyAndIssueLetter: true,
      canConfigureCatalog: true,
      canManageWhatsApp: true,
      canExportPrintPdf: true,
    },
    createdAt: '05 Jan 2026',
    updatedAt: '05 Jan 2026',
    lastLoginAt: 'Belum login',
    notes: 'Mengelola verifikasi administrasi surat menyurat, profil kelurahan, dan publikasi informasi kelurahan.',
  },
  {
    id: 'usr-kasi-pemerintahan',
    username: 'kasi.pemerintahan',
    password: 'panaikang2026',
    fullName: 'Kasi Pemerintahan',
    nip: '',
    jabatan: 'Kasi Pemerintahan, Ketenteraman & Ketertiban',
    unitBidang: 'Seksi Pemerintahan & Trantib',
    phone: '',
    roleLevel: 'admin_bidang',
    isMasterLurah: false,
    isActive: true,
    allowedAdminTabs: [
      'pengurusan_warga',
      'laporan',
      'rtrw',
    ],
    allowedServiceCategories: [
      'adminduk',
      'surat_keterangan',
      'pengaduan_warga',
    ],
    actionPermissions: {
      canCreate: true,
      canEdit: true,
      canDelete: false,
      canVerifyAndIssueLetter: true,
      canConfigureCatalog: false,
      canManageWhatsApp: false,
      canExportPrintPdf: true,
    },
    createdAt: '10 Jan 2026',
    updatedAt: '10 Jan 2026',
    lastLoginAt: 'Belum login',
    notes: 'Khusus menangani Administrasi Kependudukan, Surat Keterangan, Data RT/RW, dan Mediasi Pengaduan Warga.',
  },
  {
    id: 'usr-kasi-kebersihan',
    username: 'kasi.kebersihan',
    password: 'panaikang2026',
    fullName: 'Kasi Kebersihan & Lingkungan Hidup',
    nip: '',
    jabatan: 'Kasi Pengelolaan Kebersihan & Lingkungan Hidup',
    unitBidang: 'Seksi Kebersihan & BSU RW',
    phone: '',
    roleLevel: 'admin_bidang',
    isMasterLurah: false,
    isActive: true,
    allowedAdminTabs: [
      'pengurusan_warga',
      'laporan',
      'sampah',
      'kerjabakti',
    ],
    allowedServiceCategories: [
      'masalah_lingkungan',
      'pengaduan_warga',
    ],
    actionPermissions: {
      canCreate: true,
      canEdit: true,
      canDelete: false,
      canVerifyAndIssueLetter: true,
      canConfigureCatalog: false,
      canManageWhatsApp: true,
      canExportPrintPdf: true,
    },
    createdAt: '10 Jan 2026',
    updatedAt: '10 Jan 2026',
    lastLoginAt: 'Belum login',
    notes: 'Khusus menangani Masalah Lingkungan, Bank Sampah Unit (BSU), dan Jadwal Kerja Bakti.',
  },
  {
    id: 'usr-operator-loket',
    username: 'operator',
    password: 'panaikang2026',
    fullName: 'Operator Pelayanan Terpadu',
    nip: '',
    jabatan: 'Operator Pelayanan Terpadu Satu Pintu',
    unitBidang: 'Loket Pelayanan Warga & Ekonomi Kemasyarakatan',
    phone: '',
    roleLevel: 'operator',
    isMasterLurah: false,
    isActive: true,
    allowedAdminTabs: [
      'pengurusan_warga',
      'info',
      'laporan',
    ],
    allowedServiceCategories: [
      'adminduk',
      'surat_keterangan',
      'pelayanan_usaha',
      'bantuan_sosial',
      'sosial_kemasyarakatan',
      'pengaduan_warga',
    ],
    actionPermissions: {
      canCreate: true,
      canEdit: true,
      canDelete: false,
      canVerifyAndIssueLetter: true,
      canConfigureCatalog: false,
      canManageWhatsApp: false,
      canExportPrintPdf: true,
    },
    createdAt: '15 Jan 2026',
    updatedAt: '15 Jan 2026',
    lastLoginAt: 'Belum login',
    notes: 'Operator loket kelurahan untuk registrasi berkas pengajuan dan pelayanan pengurusan warga.',
  },
];

export const INITIAL_ACTIVITY_LOGS: AdminActivityLog[] = [];

export const INITIAL_URBAN_FARMING_SPOTS: UrbanFarmingSpot[] = [];

export const INITIAL_URBAN_FARMING_LOCATIONS: UrbanFarmingLocation[] = [];

export const INITIAL_FARMER_GROUPS: FarmerGroup[] = [];

export const INITIAL_CROPS: CropItem[] = [];

export const INITIAL_PLANT_CARE_LOGS: PlantCareLog[] = [];

export const INITIAL_HARVEST_RECORDS: HarvestRecord[] = [];

export const INITIAL_FARMING_INVENTORIES: FarmingInventoryItem[] = [];

export const INITIAL_SUPPLY_REQUESTS: SupplyRequestItem[] = [];

export const INITIAL_SEED_REQUESTS: SeedRequestItem[] = [];
