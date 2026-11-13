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
  | 'admin'
  | 'login'
  | 'dashboard_warga';

export type UserRole = 'warga' | 'admin';

export type CitizenMenuKey =
  | 'beranda'
  | 'profil'
  | 'rtrw'
  | 'warga'
  | 'peta'
  | 'sampah'
  | 'kerjabakti'
  | 'urbanfarming'
  | 'dashboard_warga'
  | 'lurah';

export const ALL_CITIZEN_MENU_KEYS: CitizenMenuKey[] = [
  'beranda',
  'profil',
  'rtrw',
  'warga',
  'peta',
  'sampah',
  'kerjabakti',
  'urbanfarming',
  'dashboard_warga',
  'lurah',
];

export interface CitizenMenuSubItem {
  key: string;
  label: string;
  description: string;
}

export interface CitizenMenuDefinition {
  key: CitizenMenuKey;
  label: string;
  shortLabel: string;
  category: string;
  description: string;
  subItems: CitizenMenuSubItem[];
}

export const CITIZEN_MENU_DEFINITIONS: CitizenMenuDefinition[] = [
  {
    key: 'beranda',
    label: 'Beranda Utama Portal',
    shortLabel: 'Beranda',
    category: 'Portal & Informasi',
    description: 'Halaman utama portal, ringkasan layanan kelurahan, dan berita Instagram resmi.',
    subItems: [
      {
        key: 'beranda_hero',
        label: 'Banner & Sambutan Utama Portal',
        description: 'Tampilan banner selamat datang dan identitas Kelurahan Panaikang.',
      },
      {
        key: 'beranda_quick_stats',
        label: 'Kartu Statistik Cepat Program',
        description: 'Metrik data ringkas persampahan, kerja bakti, aduan, dan posko.',
      },
      {
        key: 'beranda_instagram',
        label: 'Feed Berita Resmi Instagram',
        description: 'Integrasi update postingan akun Instagram @kelurahan.panaikang.',
      },
    ],
  },
  {
    key: 'profil',
    label: 'Profil Kelurahan & Struktur Organisasi',
    shortLabel: 'Profil Kelurahan',
    category: 'Portal & Informasi',
    description: 'Data pimpinan Lurah, struktur organisasi kelurahan, visi misi, dan demografi wilayah.',
    subItems: [
      {
        key: 'profil_data_lurah',
        label: 'Data & Foto Resmi Pimpinan Lurah',
        description: 'Foto dinas, nama lengkap, NIP, pangkat, masa tugas, dan sambutan resmi Lurah.',
      },
      {
        key: 'profil_bagan_kelurahan',
        label: 'Bagan Struktur Kelurahan (Modal Dinamis)',
        description: 'Tombol & diagram bagan struktur organisasi kelurahan interaktif.',
      },
      {
        key: 'profil_bagan_rtrw',
        label: 'Bagan Struktur Organisasi RT / RW',
        description: 'Tombol & diagram struktur kepengurusan RT dan RW se-Kelurahan Panaikang.',
      },
      {
        key: 'profil_perangkat_seksi',
        label: 'Pejabat Struktural & Staf 3 Seksi',
        description: 'Daftar pejabat Kasi, Kasubag, dan staf kelurahan sesuai Perwali No. 65/2023.',
      },
      {
        key: 'profil_alamat_kontak',
        label: 'Alamat Kantor, Jam Layanan & Kontak Hotline',
        description: 'Lokasi kantor lurah, jam buka pelayanan, nomor telepon/WA, dan email resmi.',
      },
      {
        key: 'profil_visi_misi',
        label: 'Visi, Misi & Batas Administratif Wilayah',
        description: 'Visi misi pembangunan kelurahan, demografi kependudukan, dan batas wilayah.',
      },
      {
        key: 'profil_direktori_rw',
        label: 'Direktori Wilayah RW 01–07 & Koordinator',
        description: 'Daftar ringkas wilayah RW dan koordinator kebersihan lingkungan.',
      },
    ],
  },
  {
    key: 'rtrw',
    label: 'Data RT & RW + Jadwal Siskamling',
    shortLabel: 'Data RT & RW',
    category: 'Wilayah & Keamanan',
    description: 'Direktori resmi Ketua RW 01–07, daftar Ketua RT, dan jadwal piket Posko Siskamling.',
    subItems: [
      {
        key: 'rtrw_direktori_rw',
        label: 'Direktori Ketua RW 01–07 & Daftar Ketua RT',
        description: 'Informasi nama ketua RW, cakupan RT, alamat, dan jumlah warga.',
      },
      {
        key: 'rtrw_bagan_struktur',
        label: 'Bagan Struktur Organisasi RT/RW',
        description: 'Akses melihat bagan struktur organisasi RT dan RW Kelurahan Panaikang (di halaman maupun layar penuh).',
      },
      {
        key: 'rtrw_kontak_pengurus',
        label: 'Kontak WhatsApp & Telepon Pengurus RT/RW',
        description: 'Nomor telepon dan link WhatsApp langsung untuk menghubungi pengurus lingkungan.',
      },
      {
        key: 'rtrw_jadwal_siskamling',
        label: 'Jadwal Ronda & Piket Siskamling Harian',
        description: 'Daftar giliran piket petugas ronda kamtibmas posko RW per hari.',
      },
      {
        key: 'rtrw_matriks_siskamling',
        label: 'Matriks Jadwal Posko 7 Hari Penuh & Cetak',
        description: 'Tampilan matriks jadwal posko kamtibmas sepekan dan opsi cetak.',
      },
    ],
  },
  {
    key: 'warga',
    label: 'Pelayanan Kelurahan (Pra Registrasi Online & Pengaduan Online)',
    shortLabel: 'Pelayanan Kelurahan',
    category: 'Pelayanan Publik',
    description: 'Kartu Pra Registrasi Online (13 Layanan Administrasi) dan Pengaduan Online Warga Kelurahan Panaikang.',
    subItems: [
      {
        key: 'warga_pengajuan_surat',
        label: 'Pra Registrasi Online (13 Layanan Administrasi)',
        description: 'Daftar layanan administrasi, persyaratan, formulir, upload dokumen, dan tiket QR Code.',
      },
      {
        key: 'warga_aduan_baru',
        label: 'Pengaduan Online (Keluhan, Aspirasi & Laporan Warga)',
        description: 'Sampaikan pengaduan, keluhan, aspirasi, atau laporan lengkap dengan foto bukti dan tiket QR.',
      },
      {
        key: 'warga_lacak_tiket',
        label: 'Cek Status & Lacak Tiket Pelayanan (QR / Nomor Tiket)',
        description: 'Pengecekan progres Pra Registrasi maupun Pengaduan Online menggunakan nomor tiket.',
      },
      {
        key: 'warga_katalog_sop',
        label: 'Daftar Layanan & Persyaratan Dokumen Kelurahan',
        description: 'Informasi persyaratan berkas, alur proses, dan estimasi waktu pelayanan kelurahan.',
      },
      {
        key: 'warga_daftar_laporan',
        label: 'Riwayat Pra Registrasi & Pengaduan Warga',
        description: 'Pemantauan daftar pengajuan layanan administrasi dan pengaduan yang sedang diproses maupun selesai.',
      },
    ],
  },
  {
    key: 'peta',
    label: 'Peta Digital GIS Kelurahan',
    shortLabel: 'Peta Digital',
    category: 'Wilayah & Keamanan',
    description: 'Peta interaktif sebaran titik laporan warga, Bank Sampah, Teba, Biopori, dan batas RW.',
    subItems: [
      {
        key: 'peta_sebaran_laporan',
        label: 'Layer Sebaran Titik Laporan Masalah Warga',
        description: 'Pin lokasi keluhan dan status penyelesaian tindak lanjut di peta.',
      },
      {
        key: 'peta_bank_sampah',
        label: 'Layer Titik Bank Sampah Unit (BSU RW)',
        description: 'Lokasi dan rute unit bank sampah di setiap wilayah RW.',
      },
      {
        key: 'peta_posko_siskamling',
        label: 'Layer Titik Posko Kamtibmas Siskamling',
        description: 'Lokasi posko ronda keamanan warga di RW 01–07.',
      },
      {
        key: 'peta_urban_farming',
        label: 'Layer Sentra Kebun Urban Farming',
        description: 'Sebaran lokasi budidaya tanaman pangan dan kelompok tani.',
      },
    ],
  },
  {
    key: 'sampah',
    label: 'Pengelolaan Sampah (BSU, Teba & Biopori)',
    shortLabel: 'Pengelolaan Sampah',
    category: 'Program Lingkungan',
    description: 'Monitoring Bank Sampah Unit (BSU), Teba Komunal Organik, dan Lubang Resapan Biopori.',
    subItems: [
      {
        key: 'sampah_bsu_units',
        label: 'Monitoring Bank Sampah Unit (BSU RW 01–07)',
        description: 'Data unit bank sampah, jadwal penimbangan, dan nasabah terdaftar.',
      },
      {
        key: 'sampah_kalkulator',
        label: 'Kalkulator Nilai Tabungan Sampah (Rupiah)',
        description: 'Simulasi nilai konversi sampah anorganik (plastik, kardus, minyak jelantah).',
      },
      {
        key: 'sampah_teba_komunal',
        label: 'Monitoring Titik Teba Komunal Organik',
        description: 'Titik pengolahan sampah daun dan sisa organik berbasis teba lorong.',
      },
      {
        key: 'sampah_biopori',
        label: 'Sebaran Lubang Resapan Biopori (LRB)',
        description: 'Monitoring titik lubang biopori pencegah genangan air dan penyubur tanah.',
      },
    ],
  },
  {
    key: 'kerjabakti',
    label: 'Monitoring Kerja Bakti Gotong Royong',
    shortLabel: 'Kerja Bakti',
    category: 'Program Lingkungan',
    description: 'Jadwal gotong royong warga, titik kumpul, pendaftaran peserta, dan dokumentasi aksi.',
    subItems: [
      {
        key: 'kerjabakti_jadwal',
        label: 'Jadwal Aksi Kerja Bakti RW/RT',
        description: 'Agenda kerja bakti yang terencana beserta titik lokasi dan target peserta.',
      },
      {
        key: 'kerjabakti_usulan',
        label: '+ Usulan Kerja Bakti',
        description: 'Tombol & formulir pengajuan usulan jadwal kerja bakti lingkungan oleh warga.',
      },
      {
        key: 'kerjabakti_daftar_relawan',
        label: 'Formulir Pendaftaran Partisipasi Relawan',
        description: 'Form pendaftaran warga untuk ikut serta gotong royong lingkungan.',
      },
      {
        key: 'kerjabakti_dokumentasi',
        label: 'Galeri Foto Dokumentasi & Bukti Aksi Tuntas',
        description: 'Dokumentasi foto pelaksanaan dan hasil nyata kegiatan kerja bakti.',
      },
    ],
  },
  {
    key: 'urbanfarming',
    label: 'Urban Farming & Ketahanan Pangan',
    shortLabel: 'Urban Farming',
    category: 'Program Lingkungan',
    description: 'Sentra kebun kelompok, hidroponik, akuaponik, tanaman obat, dan permohonan bibit.',
    subItems: [
      {
        key: 'urbanfarming_kebun',
        label: 'Sentra Kebun Lorong & Lokasi Lahan RW',
        description: 'Profil lokasi kebun, jenis budidaya, dan kelompok tani pengelola.',
      },
      {
        key: 'urbanfarming_panen',
        label: 'Kalender & Jadwal Panen Sayur / TOGA',
        description: 'Informasi perkiraan waktu panen sayuran daun, cabai, dan tanaman obat.',
      },
      {
        key: 'urbanfarming_edukasi',
        label: 'Panduan SOP Budidaya Tanaman Lorong',
        description: 'Materi edukasi cara bercocok tanam hidroponik, polybag, dan akuaponik.',
      },
      {
        key: 'urbanfarming_bibit',
        label: 'Katalog Bibit Gratis & Daftar Permohonan',
        description: 'Katalog jenis bibit sayuran, TOGA, sarana tani gratis, dan daftar permohonan terverifikasi.',
      },
      {
        key: 'urbanfarming_ajukan_bibit',
        label: '+ Ajukan Paket Bibit Sekarang',
        description: 'Tombol & formulir pengajuan paket bibit sayuran dan kompos gratis oleh warga.',
      },
    ],
  },
  {
    key: 'dashboard_warga',
    label: 'Dashboard Warga Terdaftar',
    shortLabel: 'Dashboard Warga',
    category: 'Pelayanan Publik',
    description: 'Panel akun pribadi warga untuk memantau riwayat permohonan surat, aduan, dan profil.',
    subItems: [
      {
        key: 'dashboard_riwayat_surat',
        label: 'Riwayat Permohonan Surat Administrasi',
        description: 'Arsip berkas surat yang telah diajukan dan bukti terbit.',
      },
      {
        key: 'dashboard_riwayat_laporan',
        label: 'Riwayat Laporan Pengaduan Lingkungan Warga',
        description: 'Daftar pelaporan pribadi dan progres penanganan lapangan.',
      },
      {
        key: 'dashboard_profil_warga',
        label: 'Informasi Profil & Data Domisili Warga',
        description: 'Data diri warga, nomor WhatsApp terdaftar, dan domisili RT/RW.',
      },
    ],
  },
  {
    key: 'lurah',
    label: 'Dashboard Kinerja Kelurahan',
    shortLabel: 'Kinerja Kelurahan',
    category: 'Portal & Informasi',
    description: 'Ringkasan statistik penanganan laporan warga dan indeks kebersihan lingkungan.',
    subItems: [
      {
        key: 'kinerja_statistik_eksekutif',
        label: 'Statistik Ringkasan Eksekutif Penanganan',
        description: 'Angka persentase penyelesaian laporan dan indeks kepuasan.',
      },
      {
        key: 'kinerja_grafik_kinerja',
        label: 'Grafik Tren & Rekap Kinerja Bulanan',
        description: 'Visualisasi grafik penanganan permasalahan lingkungan dari waktu ke waktu.',
      },
    ],
  },
];

export const ALL_CITIZEN_SUB_ITEM_KEYS: string[] = CITIZEN_MENU_DEFINITIONS.flatMap((m) =>
  m.subItems.map((s) => s.key)
);

export interface CitizenMenuAccessConfig {
  /** Daftar menu utama yang aktif & ditampilkan untuk Warga Belum Terdaftar (Pengunjung / Tanpa Login) */
  guestAllowedMenus: CitizenMenuKey[];
  /** Daftar menu utama yang aktif & ditampilkan untuk Warga Terdaftar (Sudah Login Akun Warga) */
  registeredAllowedMenus: CitizenMenuKey[];
  /** Opsional: kustomisasi menu utama spesifik per UID warga terdaftar */
  perCitizenAllowedMenus?: Record<string, CitizenMenuKey[]>;
  /** Sub-item detail menu spesifik yang diizinkan untuk Pengunjung (default: semua sub-item aktif) */
  guestAllowedSubItems?: string[];
  /** Sub-item detail menu spesifik yang diizinkan untuk Warga Login (default: semua sub-item aktif) */
  registeredAllowedSubItems?: string[];
  /** Kustomisasi sub-item detail menu per UID warga */
  perCitizenAllowedSubItems?: Record<string, string[]>;
  updatedAt?: string;
  updatedAtMs?: number;
  updatedBy?: string;
}

export interface AuthenticatedUserProfile {
  uid: string;
  email: string;
  fullName: string;
  nik: string;
  phone: string;
  rw: string;
  rt: string;
  address: string;
  role: UserRole;
  allowedMenus?: CitizenMenuKey[];
  adminDetails?: {
    nip: string;
    jabatan: string;
    unitBidang: string;
    roleLevel: AdminRoleLevel;
    isActive: boolean;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminRoleRecord {
  uid: string;
  email: string;
  fullName: string;
  nip: string;
  jabatan: string;
  unitBidang: string;
  roleLevel: AdminRoleLevel;
  isActive: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export type SubmissionStatus =
  | 'Menunggu Verifikasi'
  | 'Sedang Ditangani'
  | 'Selesai'
  | 'Ditolak';

export interface CitizenSubmission {
  id: string;
  ownerId: string;
  ownerEmail: string;
  ticketCode: string;
  submissionType: 'layanan_administrasi' | 'pengaduan_lingkungan';
  serviceCategoryId: string;
  serviceName: string;
  title: string;
  description: string;
  applicantName: string;
  applicantNik: string;
  applicantPhone: string;
  rw: string;
  rt: string;
  address: string;
  status: SubmissionStatus;
  responseNote: string;
  letterRegisterNumber: string;
  createdAtDisplay: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export type ReportStatus = 'Menunggu Verifikasi' | 'Sedang Ditangani' | 'Selesai';

export type ReportCategory =
  | 'Sampah Liar & TPS'
  | 'Drainase & Genangan'
  | 'Pohon & Ruang Hijau'
  | 'Ketertiban & Fasum'
  | 'Surat Keterangan'
  | 'Administrasi Kependudukan'
  | 'Laporan Pengaduan'
  | string;

export type ReportUrgency = 'Normal' | 'Tinggi' | 'Darurat';

export interface CitizenReport {
  id: string;
  ownerId?: string;
  ownerEmail?: string;
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
  citizenAddress?: string;
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
  imageUrl?: string;
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

export type TebaStatus =
  | 'Aktif Beroperasi'
  | 'Penuh / Masa Pengomposan'
  | 'Perawatan & Pembersihan'
  | 'Rencana Pembangunan';

export interface TebaSpot {
  id: string;
  name: string;
  code: string;
  rw: string;
  rt: string;
  address: string;
  locationTag: string;
  mapUrl?: string;
  latitude?: number;
  longitude?: number;
  imageUrl: string;
  documentationPhotos?: string[];
  capacityKg: number;
  currentLoadKg: number;
  wasteTypeProcessed: string;
  coordinatorName: string;
  coordinatorPhone: string;
  status: TebaStatus;
  description: string;
  lastHarvestDate?: string;
  createdAt: string;
  updatedAt?: string;
}

export type BioporiStatus =
  | 'Aktif Digunakan'
  | 'Penuh Kompos'
  | 'Perlu Perawatan'
  | 'Siap Panen Kompos';

export interface BioporiPoint {
  id: string;
  name: string;
  code: string;
  rw: string;
  rt: string;
  address: string;
  locationTag: string;
  totalHoles: number;
  diameterCm: number;
  depthCm: number;
  organicTypes: string;
  status: BioporiStatus;
  coordinatorName: string;
  coordinatorPhone?: string;
  mapUrl?: string;
  imageUrl: string;
  documentationPhotos?: string[];
  harvestHistory?: string;
  installationDate: string;
  notes?: string;
  updatedAt?: string;
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

export interface KerjaBaktiIgHighlightItem {
  id: string;
  shortcode: string;
  title: string;
  caption: string;
  publishedAt: string;
  rwScope: string;
  imageUrl: string;
  instagramPostUrl: string;
  highlightName: string;
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

export interface StructuralOfficial {
  id: string;
  positionTitle: string;
  officialName: string;
  nip?: string;
  rank?: string;
  department?: string;
  phone?: string;
  photoUrl?: string;
  orderIndex?: number;
  staffNames?: string[];
}

export interface KelurahanProfile {
  lurahName: string;
  lurahNip: string;
  lurahRank: string;
  lurahPeriod: string;
  lurahMessage: string;
  lurahPhotoUrl?: string;
  sekretarisName: string;
  sekretarisNip?: string;
  kasiKebersihanName: string;
  kasiKebersihanNip?: string;
  kasiPemerintahanName: string;
  kasiPemerintahanNip?: string;
  kasiPemberdayaanName?: string;
  kasiPemberdayaanNip?: string;
  stafPemerintahan?: string[];
  stafPemberdayaan?: string[];
  stafKebersihan?: string[];
  perwaliReference?: string;
  ketuaLpmName?: string;
  officials?: StructuralOfficial[];
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
  baganStrukturKelurahanUrl?: string;
  baganStrukturRtRwUrl?: string;
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
  takenAtMs?: number;
  author: string;
  instagramHandle?: string;
  instagramPostUrl?: string;
  instagramLikes?: number;
  instagramCommentsCount?: number;
  isInstagramSynced?: boolean;
  hashtags?: string[];
}

export interface SponsorItem {
  id: string;
  logoUrl: string;
  caption: string;
  linkUrl: string;
  createdAt?: string;
  updatedAt?: string;
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
  | 'laporan'
  | 'parameter_user'
  | 'user_warga';

export type KelolaAdminWargaSubTab =
  | 'otoritas_master'
  | 'parameter_admin'
  | 'user_warga'
  | 'master_data_layanan';

export interface RealtimeTrafficEvent {
  id: string;
  timestamp: string;
  createdAtMs: number;
  page: string;
  pageTitle: string;
  deviceType: 'Mobile' | 'Desktop' | 'Tablet';
  platform: string;
  browser: string;
  location: string;
  referrer: string;
  ipMasked: string;
  status: '200 OK' | '304 PWA Cache';
}

export interface TrafficAnalyticsData {
  totalPageviews: number;
  uniqueVisitors: number;
  activeVisitorsNow: number;
  todayPageviews: number;
  todayUniqueVisitors: number;
  avgSessionDuration: string;
  bounceRate: string;
  pwaInstalls: number;
  dailyPoints: {
    date: string;
    label: string;
    pageviews: number;
    uniqueVisitors: number;
    mobile: number;
    desktop: number;
  }[];
  sources: {
    channel: string;
    visits: number;
    percentage: number;
    color: string;
    description: string;
  }[];
  topPages: {
    path: string;
    title: string;
    views: number;
    percentage: number;
    avgDuration: string;
  }[];
  deviceBreakdown: {
    device: string;
    icon: 'mobile' | 'desktop' | 'tablet';
    percentage: number;
    visits: number;
  }[];
  rwBreakdown: {
    rw: string;
    visits: number;
    percentage: number;
    topService: string;
  }[];
  hourlyDistribution: {
    hour: string;
    visits: number;
  }[];
  realtimeLogs: RealtimeTrafficEvent[];
}

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
  | 'DASHBOARD_LURAH'
  | 'PENGURUSAN_WARGA'
  | 'DAFTAR_WARGA'
  | 'PROFIL_KELURAHAN'
  | 'STRUKTUR_RTRW'
  | 'SISKAMLING'
  | 'INFORMASI_KELURAHAN'
  | 'LAPORAN_WARGA'
  | 'BANK_SAMPAH'
  | 'KERJA_BAKTI'
  | 'URBAN_FARMING'
  | 'TRAFFIC_ANALITIK'
  | 'PARAMETER_USER'
  | 'KATALOG_SOP'
  | 'PETA_DIGITAL_GIS';

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

export interface GoogleAdminVerificationRequest {
  id: string;
  email: string;
  displayName: string;
  photoUrl?: string;
  requestedAt: string;
  requestedAtMs: number;
  updatedAtMs?: number;
  status: 'Menunggu Persetujuan' | 'Disetujui' | 'Ditolak';
  reviewedBy?: string;
  reviewedAt?: string;
  processedAt?: string;
  processedBy?: string;
  linkedAdminId?: string;
  linkedAdminName?: string;
  assignedRoleLevel?: AdminRoleLevel;
  assignedJabatan?: string;
  notes?: string;
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
  updatedAtMs?: number;
  lastLoginAt?: string;
  notes?: string;
  googleEmail?: string;
  additionalGoogleEmails?: string[];
  isGoogleVerified?: boolean;
  googleVerifiedAt?: string;
  googleVerifiedBy?: string;
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

export type SiskamlingDay =
  | 'Senin'
  | 'Selasa'
  | 'Rabu'
  | 'Kamis'
  | 'Jumat'
  | 'Sabtu'
  | 'Minggu';

export interface SiskamlingRwSchedule {
  rw: string; // e.g. 'RW 1' s/d 'RW 7'
  rwName?: string;
  poskoLocation?: string;
  schedules: Record<SiskamlingDay, string[]>; // list of officer names for each day
  notes?: string;
}
// ============================================================================
// PELAYANAN KELURAHAN (PRA REGISTRASI ONLINE & PENGADUAN ONLINE DEDICATED ARCHITECTURE)
// ============================================================================

export type PraRegistrasiStatus =
  | 'DRAFT'
  | 'DIAJUKAN'
  | 'MENUNGGU_KEDATANGAN'
  | 'VERIFIKASI_PETUGAS'
  | 'PERLU_PERBAIKAN'
  | 'BERKAS_LENGKAP'
  | 'DIPROSES'
  | 'MENUNGGU_PERSETUJUAN'
  | 'DISETUJUI'
  | 'SURAT_SELESAI'
  | 'DITUTUP';

export type PengaduanOnlineStatus =
  | 'DIAJUKAN'
  | 'DITERIMA'
  | 'DIVERIFIKASI'
  | 'DITINDAKLANJUTI'
  | 'MENUNGGU_INFORMASI'
  | 'SELESAI';

export type PengaduanKategori =
  | 'Infrastruktur'
  | 'Kebersihan'
  | 'Lingkungan'
  | 'Administrasi Pelayanan'
  | 'Fasilitas Umum'
  | 'Ketertiban'
  | 'Sosial'
  | 'Pelayanan Pemerintahan'
  | 'Aspirasi'
  | 'Lainnya';

export type FormFieldType =
  | 'text'
  | 'number'
  | 'date'
  | 'select'
  | 'checkbox'
  | 'radio'
  | 'textarea'
  | 'file'
  | 'address'
  | 'nik';

export interface DynamicFormField {
  id: string;
  label: string;
  type: FormFieldType;
  placeholder?: string;
  required: boolean;
  options?: string[];
  helpText?: string;
}

export interface MasterPersyaratanItem {
  id: string;
  name: string;
  code: string;
  description?: string;
  requirementType: 'Wajib' | 'Tidak wajib' | 'Kondisional';
  fileFormatAccepted?: string;
  maxSizeMb?: number;
}

export interface MasterLayananItem {
  id: string;
  code: string;
  name: string;
  category: string;
  description: string;
  estimatedProcessingTime: string;
  isActive: boolean;
  requiredDocs: Array<{
    persyaratanId: string;
    persyaratanName: string;
    requirementType: 'Wajib' | 'Tidak wajib' | 'Kondisional';
  }>;
  dynamicFields?: DynamicFormField[];
  assignedOfficers?: string[];
  approverRole?: string;
}

export interface UploadedDocFile {
  persyaratanId: string;
  docName: string;
  persyaratanLabel?: string;
  fileUrl: string;
  fileName: string;
  fileSizeKb?: number;
  uploadedAt: string;
  verificationStatus?: 'Belum Diperiksa' | 'Sesuai' | 'Tidak Sesuai / Buram';
  verificationNotes?: string;
}

export interface PraRegistrasiRecord {
  id: string;
  ticketCode: string;
  serviceId: string;
  serviceCode: string;
  serviceName: string;
  applicantUid?: string;
  applicantEmail?: string;
  applicantName: string;
  applicantNik: string;
  applicantPhone: string;
  applicantRw: string;
  applicantRt: string;
  applicantAddress: string;
  formData: Record<string, any>;
  uploadedDocs: UploadedDocFile[];
  status: PraRegistrasiStatus;
  submittedAt: string;
  updatedAt: string;
  scheduledArrivalDate?: string;
  assignedOfficerName?: string;
  officerVerificationResult?: 'LENGKAP' | 'PERLU_PERBAIKAN' | 'TIDAK_LENGKAP';
  officerNotes?: string;
  physicalDocsChecked?: boolean;
  lurahApprovalStatus?: 'MENUNGGU' | 'DISETUJUI' | 'DITOLAK' | 'KEMBALIKAN_PERBAIKAN';
  lurahNotes?: string;
  lurahActionAt?: string;
  letterRegisterNumber?: string;
  letterCompletedAt?: string;
  qrCodeUrl?: string;
}

export interface PengaduanOnlineRecord {
  id: string;
  ticketCode: string;
  category: PengaduanKategori;
  title: string;
  content: string;
  locationAddress: string;
  incidentDate: string;
  proofPhotos: string[];
  isAnonymous: boolean;
  reporterUid?: string;
  reporterName: string;
  reporterPhone: string;
  reporterRw: string;
  reporterRt: string;
  status: PengaduanOnlineStatus;
  isPriority?: boolean;
  submittedAt: string;
  updatedAt: string;
  assignedUnit?: string;
  assignedOfficer?: string;
  followUpNotes?: string;
  followUpPhotos?: string[];
  completedAt?: string;
}
