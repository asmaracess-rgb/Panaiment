import type {
  CitizenReport,
  WasteBankUnit,
  WasteLogEntry,
  TebaSpot,
  BioporiPoint,
  CleanupEvent,
  KerjaBaktiIgHighlightItem,
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
export const IG_POST_KERJABAKTI_1 = '/images/ig_post_kerjabakti_1_DfYirNrJjaT.jpg';
export const IG_POST_KERJABAKTI_2 = '/images/ig_post_kerjabakti_2_DfHDLK2vqk0.jpg';
export const IG_POST_LATEST_1 = '/images/ig_post_latest_1_DfT7acUJdwh.jpg';
export const IG_POST_LATEST_2 = '/images/ig_post_latest_2_DfM0_MZvZON.jpg';
export const IG_POST_LATEST_3 = '/images/ig_post_latest_3_DfM0LNqPFR5.jpg';
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

export const INITIAL_REPORTS: CitizenReport[] = [];

export const INITIAL_WASTE_UNITS: WasteBankUnit[] = [];

export const INITIAL_WASTE_LOGS: WasteLogEntry[] = [];

export const INITIAL_TEBA_SPOTS: TebaSpot[] = [];

export const INITIAL_BIOPORI_POINTS: BioporiPoint[] = [];

export const INITIAL_CLEANUP_EVENTS: CleanupEvent[] = [];

// 3 Postingan Story Sorotan Kerja Bakti Terbaru dari Akun Resmi @kelurahan.panaikang
export const INITIAL_KERJABAKTI_IG_HIGHLIGHTS: KerjaBaktiIgHighlightItem[] = [
  {
    id: 'kb-ig-story-1-DfYirNrJjaT',
    shortcode: 'DfYirNrJjaT',
    title: 'Kerja Bakti Kolaborasi & Toleransi di Kelurahan Panaikang',
    caption:
      'Camat Panakkukang Syahril turun langsung memantau pelaksanaan kegiatan kerja bakti di wilayah Kelurahan Panaikang, Jumat (06/11/2026) bersama PKBGT Klasis Makassar Tengah, jajaran pemerintah kelurahan, serta warga setempat.',
    publishedAt: '06 November 2026',
    rwScope: 'RW 01 – RW 07',
    imageUrl: IG_POST_KERJABAKTI_1,
    instagramPostUrl: 'https://www.instagram.com/reel/DfYirNrJjaT/',
    highlightName: 'Sorotan: Kerja Bakti',
  },
  {
    id: 'kb-ig-story-2-DfHDLK2vqk0',
    shortcode: 'DfHDLK2vqk0',
    title: 'Giat Jumat ASRI Aspol Tello Baru Kelurahan Panaikang',
    caption:
      'Giat Jumat ASRI tanggal 30 Oktober 2026 di Aspol Tello Baru (RW 01) Kelurahan Panaikang. Aksi gotong royong jajaran kelurahan bersama pengurus RT/RW dan warga menjaga kebersihan lingkungan.',
    publishedAt: '30 Oktober 2026',
    rwScope: 'RW 01 · Aspol Tello Baru',
    imageUrl: IG_POST_KERJABAKTI_2,
    instagramPostUrl: 'https://www.instagram.com/reel/DfHDLK2vqk0/',
    highlightName: 'Sorotan: Kerja Bakti',
  },
  {
    id: 'kb-ig-story-3-Dd-xlSLvXKn',
    shortcode: 'Dd-xlSLvXKn',
    title: 'Jumat ASRI RW 05: Jebolkan Drainase Mampet',
    caption:
      'Jumat ASRI 2 Oktober 2026 RT-RW Kelurahan Panaikang melaksanakan kerja bakti. Saluran yang mampet dibersihkan, endapan dan sampah diangkat agar aliran air kembali lancar dan potensi genangan diminimalkan.',
    publishedAt: '02 Oktober 2026',
    rwScope: 'RW 05 Kelurahan Panaikang',
    imageUrl: IG_POST_6,
    instagramPostUrl: 'https://www.instagram.com/reel/Dd-xlSLvXKn/',
    highlightName: 'Sorotan: Kerja Bakti',
  },
];

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

export const INITIAL_KELURAHAN_INFOS: KelurahanInfoItem[] = [
  {
    id: 'ig-latest-1-DfT7acUJdwh',
    title: 'Kunjungan Lapangan Wali Kota Makassar Munafri Arifuddin di Kelurahan Panaikang',
    category: 'Kegiatan Lingkungan',
    summary:
      'Wali Kota Makassar Munafri Arifuddin didampingi Camat Panakkukang Syahril dan Lurah Panaikang Muthmainnah melakukan kunjungan lapangan dan dialog langsung bersama warga Kelurahan Panaikang.',
    content: `Wali Kota Makassar Munafri Arifuddin melakukan kunjungan lapangan ke Kelurahan Panaikang, Kecamatan Panakkukang, Rabu (04/11/2026).

Kunjungan ini bertujuan untuk bertatap muka dan berdialog langsung dengan warga serta para pemilik usaha ternak hewan, guna menyerap aspirasi dan merumuskan solusi bersama demi kesejahteraan masyarakat dan kelestarian lingkungan.

Wali Kota Makassar Munafri Arifuddin didampingi oleh Camat Panakkukang Syahril dan Lurah Panaikang Muthmainnah.

Sebelumnya, Pemerintah Kota Makassar telah menertibkan peternakan babi di area pemukiman Kelurahan Panaikang. Penertiban tersebut dilakukan lantaran aktivitas peternakan memicu pencemaran lingkungan, menimbulkan bau tak sedap, serta mengganggu kenyamanan dan kesehatan warga sekitar.

Wali Kota Makassar menegaskan pemerintah kota ingin memastikan proses penataan tidak mengabaikan keberlangsungan ekonomi masyarakat yang selama ini menggantungkan hidup dari usaha peternakan.

Selain menyiapkan solusi relokasi, Wali Kota Makassar Munafri Arifuddin juga membuka peluang pemberian dukungan permodalan bagi para pelaku usaha yang terdampak penataan.

Salah satunya melalui fasilitasi akses Kredit Usaha Rakyat (KUR) dengan menggandeng perbankan, termasuk Bank Sulselbar.`,
    imageUrl: IG_POST_LATEST_1,
    publishedAt: '04 November 2026',
    author: 'Lurah Panaikang · @kelurahan.panaikang',
    instagramHandle: '@kelurahan.panaikang',
    instagramPostUrl: 'https://www.instagram.com/reel/DfT7acUJdwh/',
    instagramLikes: 83,
    instagramCommentsCount: 30,
    isInstagramSynced: true,
    hashtags: [
      '#KelurahanPanaikang',
      '#KecamatanPanakkukang',
      '#PemkotMakassar',
      '#WaliKotaMakassar',
      '#PanaikangSmartEnvironment',
    ],
  },
  {
    id: 'ig-latest-2-DfM0_MZvZON',
    title: 'Panaikang Smart Environment Dalam Genggamanmu!',
    category: 'Edukasi & Sosialisasi',
    summary:
      'Kelurahan Panaikang terus berinovasi dalam mewujudkan pelayanan publik yang modern, transparan, informatif, dan berbasis digital melalui inovasi Panaikang Smart Environment.',
    content: `PANAIKANG SMART ENVIRONMENT Dalam Genggamanmu!

Kelurahan Panaikang terus berinovasi dalam mewujudkan pelayanan publik yang modern, transparan, informatif, dan berbasis digital melalui inovasi Panaikang Smart Environment.

Sebuah platform digital yang dirancang untuk memudahkan masyarakat dalam mengakses informasi, menyampaikan laporan, serta berpartisipasi aktif dalam menjaga kebersihan dan ketertiban lingkungan Kelurahan Panaikang.`,
    imageUrl: IG_POST_LATEST_2,
    publishedAt: '01 November 2026',
    author: 'Lurah Panaikang · @kelurahan.panaikang',
    instagramHandle: '@kelurahan.panaikang',
    instagramPostUrl: 'https://www.instagram.com/p/DfM0_MZvZON/',
    instagramLikes: 20,
    instagramCommentsCount: 3,
    isInstagramSynced: true,
    hashtags: [
      '#PanaikangSmartEnvironment',
      '#KelurahanPanaikang',
      '#SatuLaporanSatuDataSatuAksi',
      '#KecamatanPanakkukang',
      '#KotaMakassar',
    ],
  },
  {
    id: 'ig-latest-3-DfM0LNqPFR5',
    title: 'Suara Anda Sangat Berarti! Survei Kepuasan Masyarakat (SKM) Pelayanan Kelurahan Panaikang',
    category: 'Pengumuman Kelurahan',
    summary:
      'Dalam rangka meningkatkan kualitas pelayanan publik, Kelurahan Panaikang mengajak seluruh masyarakat berpartisipasi dalam Survei Kepuasan Masyarakat (SKM).',
    content: `SUARA ANDA SANGAT BERARTI!

Dalam rangka meningkatkan kualitas pelayanan publik, Kelurahan Panaikang mengajak seluruh masyarakat untuk berpartisipasi dalam Survei Kepuasan Masyarakat (SKM) terhadap Pelayanan Kelurahan Panaikang.

Survei ini merupakan salah satu sarana bagi masyarakat untuk menyampaikan penilaian, saran, kritik, serta masukan terhadap pelayanan yang telah diberikan oleh pemerintah kelurahan.
Melalui partisipasi masyarakat, kami dapat mengetahui sejauh mana kualitas pelayanan yang telah berjalan, sekaligus menjadi bahan evaluasi untuk melakukan perbaikan dan peningkatan pelayanan ke depannya.

Cara berpartisipasi sangat mudah :
1. Scan QR Code yang tersedia pada poster.
2. Isi survei sesuai dengan pengalaman dan penilaian Anda.
3. Sampaikan pendapat secara jujur dan objektif.

⏱️ Cepat, mudah, dan hanya membutuhkan waktu sekitar 1 menit!

Kami percaya bahwa pelayanan publik yang berkualitas tidak dapat terwujud tanpa adanya keterlibatan dan partisipasi masyarakat.`,
    imageUrl: IG_POST_LATEST_3,
    publishedAt: '01 November 2026',
    author: 'Lurah Panaikang · @kelurahan.panaikang',
    instagramHandle: '@kelurahan.panaikang',
    instagramPostUrl: 'https://www.instagram.com/p/DfM0LNqPFR5/',
    instagramLikes: 14,
    instagramCommentsCount: 0,
    isInstagramSynced: true,
    hashtags: [
      '#SurveiKepuasanMasyarakat',
      '#PelayananPublik',
      '#KelurahanPanaikang',
      '#MelayaniDenganHati',
      '#KotaMakassar',
    ],
  },
];

export const INITIAL_WHATSAPP_RECIPIENTS: WhatsAppRecipient[] = [];

export const INITIAL_ADMIN_USERS: AdminUserAccount[] = [
  {
    id: 'usr-master-lurah',
    username: 'lurah',
    password: 'panaikang2026',
    fullName: 'Lurah Panaikang',
    nip: '',
    jabatan: 'Lurah Panaikang · Master / Super Admin',
    unitBidang: 'Pimpinan Pemerintah Kelurahan Panaikang',
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
      'user_warga',
    ],
    allowedServiceCategories: [
      'administrasi_kependudukan',
      'surat_keterangan',
      'pelayanan_usaha',
      'masalah_lingkungan',
      'bantuan_sosial',
      'sosial_kemasyarakatan',
      'pengaduan_permasalahan_warga',
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
    updatedAt: '04 Nov 2026',
    lastLoginAt: 'Belum login',
    notes: 'Akun Master Admin / Super Admin Lurah Panaikang dengan otoritas penuh seluruh modul, bagan struktur dinamis, dan pengaturan batasan akses user.',
    googleEmail: 'AsmaraCess@gmail.com',
    isGoogleVerified: true,
    googleVerifiedAt: '04 Nov 2026',
    googleVerifiedBy: 'Master Admin Utama',
  },
  {
    id: 'usr-sekretaris',
    username: 'sekretaris',
    password: 'panaikang2026',
    fullName: 'Sekretaris Lurah',
    nip: '',
    jabatan: 'Sekretaris Lurah · Koordinator Satu Data',
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
      'sampah',
      'kerjabakti',
      'urban_farming',
      'rtrw',
      'traffic',
      'log_aktivitas',
    ],
    allowedServiceCategories: [
      'administrasi_kependudukan',
      'surat_keterangan',
      'pelayanan_usaha',
      'masalah_lingkungan',
      'bantuan_sosial',
      'sosial_kemasyarakatan',
      'pengaduan_permasalahan_warga',
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
    updatedAt: '04 Nov 2026',
    lastLoginAt: 'Belum login',
    notes: 'Koordinator Sekretariat Satu Data: verifikasi 13 layanan surat resmi, profil & bagan struktur kelurahan, data RT/RW & Siskamling, serta monitoring trafik.',
  },
  {
    id: 'usr-kasi-pemerintahan',
    username: 'kasi.pemerintahan',
    password: 'panaikang2026',
    fullName: 'Kasi Pemerintahan, Ketentraman dan Ketertiban Umum',
    nip: '',
    jabatan: 'Kasi Pemerintahan, Ketentraman dan Ketertiban Umum',
    unitBidang: 'Seksi Pemerintahan, Ketentraman & Ketertiban Umum',
    phone: '',
    roleLevel: 'admin_bidang',
    isMasterLurah: false,
    isActive: true,
    allowedAdminTabs: [
      'pengurusan_warga',
      'profil',
      'laporan',
      'rtrw',
      'traffic',
    ],
    allowedServiceCategories: [
      'administrasi_kependudukan',
      'surat_keterangan',
      'pengaduan_permasalahan_warga',
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
    updatedAt: '04 Nov 2026',
    lastLoginAt: 'Belum login',
    notes: 'Menangani Administrasi Kependudukan, Surat Keterangan (Pindah, Kelahiran, Kematian, Domisili, SKCK, Ahli Waris), Data RT/RW, Bagan LPM, Jadwal Siskamling & Trantibum.',
  },
  {
    id: 'usr-kasi-pemberdayaan',
    username: 'kasi.pemberdayaan',
    password: 'panaikang2026',
    fullName: 'Kasi Pemberdayaan Masyarakat, Pembangunan dan Sosial',
    nip: '',
    jabatan: 'Kasi Pemberdayaan Masyarakat, Pembangunan dan Sosial',
    unitBidang: 'Seksi Pemberdayaan Masyarakat, Pembangunan & Sosial',
    phone: '',
    roleLevel: 'admin_bidang',
    isMasterLurah: false,
    isActive: true,
    allowedAdminTabs: [
      'pengurusan_warga',
      'info',
      'laporan',
      'urban_farming',
      'rtrw',
    ],
    allowedServiceCategories: [
      'pelayanan_usaha',
      'bantuan_sosial',
      'sosial_kemasyarakatan',
      'surat_keterangan',
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
    updatedAt: '04 Nov 2026',
    lastLoginAt: 'Belum login',
    notes: 'Menangani Pelayanan Usaha & UMKM (SKU/Domisili Usaha), Bantuan Sosial, Sosial Kemasyarakatan, Pengantar Nikah, Urban Farming (7 Sub-Modul Pangan) & Publikasi Informasi.',
  },
  {
    id: 'usr-kasi-kebersihan',
    username: 'kasi.kebersihan',
    password: 'panaikang2026',
    fullName: 'Kasi Pengelolaan Kebersihan dan Pertamanan',
    nip: '',
    jabatan: 'Kasi Pengelolaan Kebersihan dan Pertamanan',
    unitBidang: 'Seksi Pengelolaan Kebersihan & Pertamanan',
    phone: '',
    roleLevel: 'admin_bidang',
    isMasterLurah: false,
    isActive: true,
    allowedAdminTabs: [
      'pengurusan_warga',
      'laporan',
      'sampah',
      'kerjabakti',
      'urban_farming',
    ],
    allowedServiceCategories: [
      'masalah_lingkungan',
      'pengaduan_permasalahan_warga',
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
    updatedAt: '04 Nov 2026',
    lastLoginAt: 'Belum login',
    notes: 'Menangani Pengelolaan Sampah Terpadu (Bank Sampah Unit BSU RW, Titik Teba Komunal, Lubang Resapan Biopori), Jadwal Kerja Bakti, Masalah Lingkungan & Ruang Hijau.',
  },
  {
    id: 'usr-operator-loket',
    username: 'operator',
    password: 'panaikang2026',
    fullName: 'Operator Pelayanan Terpadu',
    nip: '',
    jabatan: 'Operator Pelayanan Terpadu Satu Pintu (PTSP)',
    unitBidang: 'Loket Pelayanan Terpadu Kelurahan Panaikang',
    phone: '',
    roleLevel: 'operator',
    isMasterLurah: false,
    isActive: true,
    allowedAdminTabs: [
      'pengurusan_warga',
      'info',
      'laporan',
      'rtrw',
    ],
    allowedServiceCategories: [
      'administrasi_kependudukan',
      'surat_keterangan',
      'pelayanan_usaha',
      'masalah_lingkungan',
      'bantuan_sosial',
      'sosial_kemasyarakatan',
      'pengaduan_permasalahan_warga',
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
    updatedAt: '04 Nov 2026',
    lastLoginAt: 'Belum login',
    notes: 'Operator loket kelurahan untuk registrasi 13 Layanan Administrasi Surat Resmi (PM-01 s/d SL-13) dan penerimaan pengaduan warga.',
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
