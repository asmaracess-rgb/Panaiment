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
  SponsorItem,
} from '../types.ts';

export const HERO_IMAGE_PATH = '/images/hero_nipah_mall_panaikang_1791355921119.jpg';
export const IMG_NIPAH_MALL = '/images/gedung_nipah_mall_makassar_1791355936725.jpg';
export const IMG_KERJA_BAKTI = '/images/dokumentasi_kerja_bakti_1_1791349247077.jpg';
export const IMG_BANK_SAMPAH = '/images/dokumentasi_bank_sampah_1791349262115.jpg';
export const IMG_DRAINASE = '/images/dokumentasi_drainase_bersih_1791349273322.jpg';

// Official @kelurahan.panaikang Instagram Image Assets
export const IG_PROFILE_PANAIKANG = '/images/ig_profile_panaikang.jpg';
export const IG_POST_LATEST_0 = '/images/ig_post_latest_0_Dfiuay9j8M0.jpg';
export const IG_POST_LATEST_0B = '/images/ig_post_latest_0b_DfgPz35v2Ed.jpg';
export const IG_POST_KERJABAKTI_0 = '/images/ig_post_kerjabakti_0_DfZsJAUvDQG.jpg';
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

// Postingan Story Sorotan Kerja Bakti & Kebersihan Terbaru dari Akun Resmi @kelurahan.panaikang
export const INITIAL_KERJABAKTI_IG_HIGHLIGHTS: KerjaBaktiIgHighlightItem[] = [
  {
    id: 'kb-ig-story-0-Dfiuay9j8M0',
    shortcode: 'Dfiuay9j8M0',
    title: 'Penghargaan Terbaik Lomba Kebersihan & Pengelolaan Sampah HUT Makassar ke-419',
    caption:
      'Alhamdulillah, dalam rangka HUT Kota Makassar ke-419 Tahun 2026, Kelurahan Panaikang meraih penghargaan Kelurahan Terbaik serta Juara Tingkat RT (RT 002 RW 002) dalam lomba kebersihan dan pengelolaan sampah berkat kerja bakti dan kekompakan seluruh RT/RW, warga, dan petugas kebersihan.',
    publishedAt: '10 November 2026',
    rwScope: 'Kelurahan Panaikang & RT 002 / RW 002',
    imageUrl: IG_POST_LATEST_0,
    instagramPostUrl: 'https://www.instagram.com/p/Dfiuay9j8M0/',
    highlightName: 'Sorotan: Kerja Bakti & Kebersihan',
  },
  {
    id: 'kb-ig-story-1-DfZsJAUvDQG',
    shortcode: 'DfZsJAUvDQG',
    title: 'Giat Jumat ASRI Bersama Arhanud dan Jemaat Gereja Silo',
    caption:
      'Jumat, 6 November 2026, giat Jumat ASRI bersama Arhanud dan Jamaat Gereja Silo di wilayah Kelurahan Panaikang. Sinergi lintas elemen menjaga kebersihan dan keasrian lingkungan.',
    publishedAt: '06 November 2026',
    rwScope: 'Kelurahan Panaikang',
    imageUrl: IG_POST_KERJABAKTI_0,
    instagramPostUrl: 'https://www.instagram.com/reel/DfZsJAUvDQG/',
    highlightName: 'Sorotan: Kerja Bakti',
  },
  {
    id: 'kb-ig-story-2-DfYirNrJjaT',
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
    id: 'kb-ig-story-3-DfHDLK2vqk0',
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

export const DEFAULT_LURAH_PHOTO_URL = '/images/lurah_muthmainnah_panaikang_1791548085422.jpg';
export const DEFAULT_LURAH_CUTOUT_URL = '/images/lurah_muthmainnah_cutout.png';

export const INITIAL_OFFICIALS: StructuralOfficial[] = [
  {
    id: 'off-1793520788867',
    officialName: 'MASITA FATIMA, SE, MM',
    positionTitle: 'Sekretaris Lurah (Plt.)',
    nip: '197308012010012001',
    rank: 'Pembina Tk.1 (IV/a)',
    department: 'Sekretariat Kelurahan',
    photoUrl: '',
    orderIndex: 1,
  },
  {
    id: 'off-1793520848590',
    officialName: '-',
    positionTitle: 'Kepala Seksi Pemerintahan dan Ketertiban Umum',
    nip: '-',
    rank: '-',
    department: 'Seksi Pemerintahan & Ketertiban',
    photoUrl: '',
    phone: '-',
    staffNames: ['MEGAWATI'],
    orderIndex: 2,
  },
  {
    id: 'off-1793520940195',
    officialName: 'FENTRI AMIR, SE',
    positionTitle: 'Kepala Seksi Pemberdayaan Masyarakat, Pembangunan dan Sosial',
    nip: '198509042009042003',
    rank: 'Penata (III/c)',
    department: 'Seksi Pemberdayaan Masyarakat',
    photoUrl: '',
    phone: '-',
    staffNames: ['ISTIQAMAH MUNTSIR', 'MUH RAFLI ALGIFARI, S.Ag'],
    orderIndex: 3,
  },
  {
    id: 'off-1793521049079',
    officialName: 'H. AKMAL, S.Sos., M.Tr, Ap',
    positionTitle: 'Plt. Kepala Seksi Kebersihan dan Pertamanan',
    nip: '197506292007011011',
    rank: 'Penata (III/c)',
    department: 'Seksi Kebersihan & Pertamanan',
    photoUrl: '',
    phone: '-',
    staffNames: ['AM NURASWAD'],
    orderIndex: 4,
  },
];

export const INITIAL_KELURAHAN_PROFILE: KelurahanProfile = {
  lurahName: 'MUTHMAINNAH, SE, MM',
  lurahNip: '198607092015042001',
  lurahRank: 'Penata (Golongan III/c)',
  lurahPeriod: '2025 – Sekarang',
  lurahMessage:
    'Melalui inovasi Panaikang Smart Environment, kami berkomitmen menyatukan partisipasi warga, pengurus RT/RW, akademisi, dan pelaku usaha dalam menjaga kebersihan, ketertiban drainase, serta kemandirian pengelolaan sampah di Kelurahan Panaikang.',
  lurahPhotoUrl: DEFAULT_LURAH_PHOTO_URL,
  sekretarisName: 'MASITA FATIMA, SE, MM',
  sekretarisNip: '197308012010012001',
  kasiKebersihanName: 'H. AKMAL, S.Sos., M.Tr, Ap',
  kasiKebersihanNip: '197506292007011011',
  kasiPemerintahanName: '-',
  kasiPemerintahanNip: '-',
  kasiPemberdayaanName: 'FENTRI AMIR, SE',
  kasiPemberdayaanNip: '198509042009042003',
  stafPemerintahan: ['MEGAWATI'],
  stafPemberdayaan: ['ISTIQAMAH MUNTSIR', 'MUH RAFLI ALGIFARI, S.Ag'],
  stafKebersihan: ['AM NURASWAD'],
  perwaliReference: 'PERWALI KOTA MAKASSAR NOMOR 65 TAHUN 2023',
  ketuaLpmName: 'EDY MEDY, SM, M.Th',
  officials: INITIAL_OFFICIALS,
  officeAddress:
    'Jl. Haji Kalla, Kompleks Panaikang Indah No 1, Kelurahan Panaikang, Kecamatan Panakkukang, Kota Makassar.',
  subDistrict: 'Kecamatan Panakkukang',
  city: 'Kota Makassar, Provinsi Sulawesi Selatan',
  postalCode: '90231',
  serviceHours: 'Senin – Jumat · 08:00 – 16:00 WITA',
  phoneContact: '089508956512',
  emailContact: 'kelurahanpanaikang.mks@gmail.com',
  areaKm2: '2,35 km²',
  totalRw: 7,
  totalRt: 62,
  totalPopulation: '16.480 Jiwa (4.120 KK)',
  visi:
    '“Terwujudnya Kelurahan Panaikang yang Maju, Mandiri, Sejahtera, Aman, dan Berbudaya melalui Pelayanan Publik yang Prima serta Pembangunan yang Partisipatif dan Berkelanjutan.”',
  misi: [
    'Mewujudkan pelayanan publik yang prima, transparan, cepat, dan berintegritas.',
    'Menciptakan lingkungan Kelurahan Panaikang yang bersih, sehat, aman, dan tertata.',
    'Meningkatkan kesejahteraan masyarakat melalui pemberdayaan ekonomi dan pengembangan UMKM.',
    'Membangun masyarakat yang harmonis, religius, mandiri, dan berbudaya melalui semangat kebersamaan dan gotong royong.',
    'Mendorong pembangunan infrastruktur dan fasilitas umum yang merata serta berkelanjutan.',
  ],
  boundaries: {
    utara: 'Kelurahan Lakkang',
    selatan: 'Kelurahan Tello Baru, Kelurahan Paropo, Kelurahan Karampuang',
    timur: 'Kelurahan Tamalanrea',
    barat: 'Kelurahan Pampang',
  },
};

export const INITIAL_KELURAHAN_INFOS: KelurahanInfoItem[] = [
  {
    id: 'ig-latest-1-Dfiuay9j8M0',
    title: 'Kelurahan Panaikang Raih Penghargaan Terbaik Lomba Kebersihan & Pengelolaan Sampah HUT Kota Makassar ke-419',
    category: 'Kegiatan Lingkungan',
    summary:
      'Alhamdulillah, dalam rangka memperingati HUT Kota Makassar ke-419 Tahun 2026, Kelurahan Panaikang berhasil meraih penghargaan pada dua kategori lomba kebersihan dan pengelolaan sampah (Tingkat RT 002 RW 002 & Tingkat Kelurahan Terbaik).',
    content: `Alhamdulillah, dalam rangka memperingati Hari Ulang Tahun (HUT) Kota Makassar ke-419 Tahun 2026, Kelurahan Panaikang berhasil menorehkan prestasi membanggakan dengan meraih penghargaan pada dua kategori lomba kebersihan dan pengelolaan sampah, yaitu:

🥇 TINGKAT RT
Diraih oleh RT 002 RW 002, dengan perwakilan Ibu Desy Arlin Nusu.

🏆 TINGKAT KELURAHAN
Kelurahan Panaikang berhasil meraih penghargaan sebagai kelurahan terbaik dalam lomba kebersihan dan pengelolaan sampah tingkat Kota Makassar.

Prestasi ini merupakan hasil dari kerja keras, kebersamaan, kekompakan, serta kepedulian seluruh elemen masyarakat dalam mewujudkan lingkungan yang bersih, sehat, indah, dan berkelanjutan.

Terima kasih dan apresiasi setinggi-tingginya kepada seluruh RT/RW, masyarakat dan petugas kebersihan, serta semua pihak yang telah berpartisipasi dan berkontribusi.
Kemenangan ini bukanlah akhir, melainkan motivasi untuk terus menjaga kebersihan, meningkatkan pengelolaan sampah, dan mempertahankan budaya hidup bersih di lingkungan kita.`,
    imageUrl: IG_POST_LATEST_0,
    publishedAt: '10 November 2026',
    author: 'Lurah Panaikang · @kelurahan.panaikang',
    instagramHandle: '@kelurahan.panaikang',
    instagramPostUrl: 'https://www.instagram.com/p/Dfiuay9j8M0/',
    instagramLikes: 148,
    instagramCommentsCount: 30,
    isInstagramSynced: true,
    hashtags: [
      '#HUTMakassar419',
      '#KelurahanPanaikang',
      '#PanaikangSmartEnvironment',
      '#KecamatanPanakkukang',
      '#KotaMakassar',
    ],
  },
  {
    id: 'ig-latest-2-DfgPz35v2Ed',
    title: 'Selamat Hari Ulang Tahun Kota Makassar ke-419 "Nyalakan Harapan, Merawat Masa Depan"',
    category: 'Pengumuman Kelurahan',
    summary:
      'Momentum HUT ke-419 Kota Makassar menjadi pengingat bagi kita semua untuk terus menyalakan harapan, menjaga persatuan, merawat lingkungan, serta memberikan kontribusi nyata demi masa depan yang lebih baik.',
    content: `SELAMAT HARI ULANG TAHUN KOTA MAKASSAR KE-419 "NYALAKAN HARAPAN, MERAWAT MASA DEPAN”

Momentum HUT ke-419 Kota Makassar menjadi pengingat bagi kita semua untuk terus menyalakan harapan, menjaga persatuan, merawat lingkungan, serta memberikan kontribusi nyata demi masa depan yang lebih baik.

Mari bersama-sama melangkah, berkolaborasi, dan berinovasi untuk mewujudkan Makassar yang semakin unggul, bersih, hijau, dan berkelanjutan.`,
    imageUrl: IG_POST_LATEST_0B,
    publishedAt: '09 November 2026',
    author: 'Lurah Panaikang · @kelurahan.panaikang',
    instagramHandle: '@kelurahan.panaikang',
    instagramPostUrl: 'https://www.instagram.com/p/DfgPz35v2Ed/',
    instagramLikes: 51,
    instagramCommentsCount: 3,
    isInstagramSynced: true,
    hashtags: [
      '#HUTMakassar419',
      '#NyalakanHarapan',
      '#KelurahanPanaikang',
      '#PanaikangSmartEnvironment',
      '#KotaMakassar',
    ],
  },
  {
    id: 'ig-latest-3-DfZsJAUvDQG',
    title: 'Jumat, 6 November 2026, Giat Jumat ASRI Bersama Arhanud dan Jemaat Gereja Silo',
    category: 'Kegiatan Lingkungan',
    summary:
      'Jumat, 6 November 2026, giat Jumat ASRI bersama Arhanud dan Jamaat Gereja Silo di wilayah Kelurahan Panaikang dalam rangka menjaga kebersihan dan ketertiban lingkungan.',
    content: `Jumat, 6 November 2026, giat Jumat ASRI bersama Arhanud dan Jamaat Gereja Silo di wilayah Kelurahan Panaikang.

Kegiatan gotong royong lintas elemen ini merupakan wujud nyata sinergi TNI (Arhanud), jemaat Gereja Silo, jajaran Pemerintah Kelurahan Panaikang, pengurus RT/RW, serta masyarakat dalam menjaga kebersihan saluran drainase dan keasrian lingkungan pemukiman.`,
    imageUrl: IG_POST_KERJABAKTI_0,
    publishedAt: '06 November 2026',
    author: 'Lurah Panaikang · @kelurahan.panaikang',
    instagramHandle: '@kelurahan.panaikang',
    instagramPostUrl: 'https://www.instagram.com/reel/DfZsJAUvDQG/',
    instagramLikes: 31,
    instagramCommentsCount: 3,
    isInstagramSynced: true,
    hashtags: [
      '#JumatASRI',
      '#KelurahanPanaikang',
      '#PanaikangSmartEnvironment',
      '#KecamatanPanakkukang',
      '#KotaMakassar',
    ],
  },
  {
    id: 'ig-latest-4-DfYirNrJjaT',
    title: 'Camat Panakkukang Pantau Kerja Bakti Kolaborasi & Toleransi di Kelurahan Panaikang',
    category: 'Kegiatan Lingkungan',
    summary:
      'Camat Panakkukang Syahril turun langsung memantau pelaksanaan kegiatan kerja bakti di wilayah Kelurahan Panaikang, Jumat (06/11/2026) bersama PKBGT Klasis Makassar Tengah dan warga.',
    content: `Camat Panakkukang Syahril turun langsung memantau pelaksanaan kegiatan kerja bakti di wilayah Kelurahan Panaikang, Jumat (06/11/2026).

Kegiatan bersih-bersih lingkungan ini menjadi potret nyata sinergi dan toleransi antarumat beragama di tengah masyarakat.

Kerja bakti kali ini mengusung semangat kolaborasi dan gotong royong bersama pengurus Persekutuan Kaum Bapak Gereja Toraja (PKBGT) Klasis Makassar Tengah bersama unsur Organisasi Intra Gereja, jajaran pemerintah kelurahan, serta warga setempat.

Dalam pantauannya, Camat Panakkukang mengapresiasi tinggi kepedulian dan keikutsertaan elemen gereja yang aktif mengambil peran menjaga kebersihan dan kenyamanan lingkungan sekitar. Selain menciptakan lingkungan pemukiman yang bersih dan asri, aksi gotong royong ini bertujuan untuk mempererat tali silaturahmi, memupuk semangat kepedulian sosial, serta menguatkan rasa saling memiliki antarwarga dan berbagai elemen masyarakat.`,
    imageUrl: IG_POST_KERJABAKTI_1,
    publishedAt: '06 November 2026',
    author: 'Lurah Panaikang · @kelurahan.panaikang',
    instagramHandle: '@kelurahan.panaikang',
    instagramPostUrl: 'https://www.instagram.com/reel/DfYirNrJjaT/',
    instagramLikes: 39,
    instagramCommentsCount: 6,
    isInstagramSynced: true,
    hashtags: [
      '#KerjaBaktiPanaikang',
      '#KelurahanPanaikang',
      '#KecamatanPanakkukang',
      '#ToleransiMakassar',
      '#PanaikangSmartEnvironment',
    ],
  },
  {
    id: 'ig-latest-5-DfT7acUJdwh',
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
    instagramLikes: 138,
    instagramCommentsCount: 34,
    isInstagramSynced: true,
    hashtags: [
      '#KelurahanPanaikang',
      '#KecamatanPanakkukang',
      '#PemkotMakassar',
      '#WaliKotaMakassar',
      '#PanaikangSmartEnvironment',
    ],
  },
];

export const INITIAL_WHATSAPP_RECIPIENTS: WhatsAppRecipient[] = [
  {
    id: 'wa-1793526913984',
    name: 'Muthmainnah, SE, MM',
    role: 'Lurah',
    phoneNumber: '08114122722',
    isPrimary: true,
    isActive: true,
    rwScope: 'Seluruh Wilayah',
    notes: '',
  },
  {
    id: 'wa-1793526951305',
    name: 'Master Admin',
    role: 'Master Admin',
    phoneNumber: '6289526283385',
    isPrimary: false,
    isActive: true,
    rwScope: 'Seluruh Wilayah',
    notes: '',
  },
];

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

export const INITIAL_URBAN_FARMING_SPOTS: UrbanFarmingSpot[] = [
  {
    id: 'uf-1793540638611',
    name: 'URBAN FARMING KESADARAN BERSATU',
    rw: 'RW 07',
    rt: 'RT 07',
    locationAddress: 'JL. KESADARAN IV RT. 07 RW. 07',
    groupName: 'KWT KESADARAN BERSATU',
    coordinatorName: 'NUR ALANG',
    coordinatorPhone: '6285341993164',
    farmingType: 'Hidroponik / NFT',
    commodities: ['KANGKUNG', 'TOMAT', 'CABAI', 'BAYAM', 'SAWI'],
    activeMembers: 15,
    monthlyProductionKg: 45,
    nextHarvestDate: '20 Nov 2026',
    harvestEstimatedKg: 20,
    status: 'Aktif Produktif',
    description: 'Kebun binaan ketahanan pangan Kelurahan Panaikang.',
    photoUrl: '/images/uf_kesadaran_rw07.jpg',
  },
  {
    id: 'uf-1793540562848',
    name: 'URBAN FARMING RT04 RW 05',
    rw: 'RW 05',
    rt: 'RT 04',
    locationAddress: 'JL. ANGKASA I LR. 3 RT. 04 RW. 05',
    groupName: 'KWT RT04 RW 05',
    coordinatorName: 'SYAMSIAH',
    coordinatorPhone: '62895392977493',
    farmingType: 'Hidroponik / NFT',
    commodities: ['PARIA', 'TIMUN', 'TOMAT', 'KACANG PANJANG', 'TERONG'],
    activeMembers: 15,
    monthlyProductionKg: 45,
    nextHarvestDate: '20 Nov 2026',
    harvestEstimatedKg: 20,
    status: 'Aktif Produktif',
    description: 'Kebun binaan ketahanan pangan Kelurahan Panaikang.',
    photoUrl: '/images/uf_angkasa_rw05.jpg',
  },
  {
    id: 'uf-1793540452922',
    name: 'URBAN FARMING TERATAI',
    rw: 'RW 05',
    rt: 'RT 04',
    locationAddress: 'JL. H KALLA RAYA RT. 04 RW. 05',
    groupName: 'KWT TERATAI',
    coordinatorName: 'HJ. MULIATI',
    coordinatorPhone: '6281241712447',
    farmingType: 'Hidroponik / NFT',
    commodities: ['TERONG', 'KANGKUNG', 'PARIA', 'CABAI'],
    activeMembers: 15,
    monthlyProductionKg: 45,
    nextHarvestDate: '20 Nov 2026',
    harvestEstimatedKg: 20,
    status: 'Aktif Produktif',
    description: 'Kebun binaan ketahanan pangan Kelurahan Panaikang.',
    photoUrl: '/images/uf_teratai_rw05.jpg',
  },
  {
    id: 'uf-1793540321274',
    name: 'URBAN FARMING SIPAKAINGA',
    rw: 'RW 04',
    rt: 'RT 02',
    locationAddress: 'JL. ANGKASA IV RT. 02 RW. 04',
    groupName: 'KWT SIPAKAINGA',
    coordinatorName: 'MULIATI, SP',
    coordinatorPhone: '6289510803627',
    farmingType: 'Hidroponik / NFT',
    commodities: ['KACANG PANJANG', 'SAWI', 'KANGKUNG', 'CABAI', 'IKAN NILA'],
    activeMembers: 15,
    monthlyProductionKg: 45,
    nextHarvestDate: '20 Nov 2026',
    harvestEstimatedKg: 20,
    status: 'Aktif Produktif',
    description: 'Kebun binaan ketahanan pangan Kelurahan Panaikang.',
    photoUrl: '/images/uf_sipakainga_rw04.jpg',
  },
  {
    id: 'uf-1793540217986',
    name: 'URBAN FARMING CAMPAGAYA',
    rw: 'RW 03',
    rt: 'RT 02',
    locationAddress: 'JL. H KALLA II CAMPAGAYA RT. 02 RW. 03',
    groupName: 'KWT CAMPAGAYA',
    coordinatorName: 'WARDA',
    coordinatorPhone: '6282398199836',
    farmingType: 'Hidroponik / NFT',
    commodities: ['LOMBOK', 'BAYAM', 'SAWI'],
    activeMembers: 15,
    monthlyProductionKg: 45,
    nextHarvestDate: '20 Nov 2026',
    harvestEstimatedKg: 20,
    status: 'Aktif Produktif',
    description: 'Kebun binaan ketahanan pangan Kelurahan Panaikang.',
    photoUrl: '/images/uf_campagaya_rw03.jpg',
  },
  {
    id: 'uf-1793540084454',
    name: 'URBAN FARMING BERSATU',
    rw: 'RW 02',
    rt: 'RT 02',
    locationAddress: 'KWT BERSATU',
    groupName: 'KWT BERSATU',
    coordinatorName: 'Daiti',
    coordinatorPhone: '6282196297716',
    farmingType: 'Hidroponik / NFT',
    commodities: ['KANGKUNG'],
    activeMembers: 15,
    monthlyProductionKg: 45,
    nextHarvestDate: '20 Nov 2026',
    harvestEstimatedKg: 20,
    status: 'Aktif Produktif',
    description: 'Kebun binaan ketahanan pangan Kelurahan Panaikang.',
    photoUrl: '/images/uf_bersatu_rw02.jpg',
  },
  {
    id: 'uf-1793539872515',
    name: 'URBAN FARMING TUNAS HIJAU ASTEBA',
    rw: 'RW 01',
    rt: 'RT 06',
    locationAddress: 'JL. ASPOL TELLO BARU RT. 06 RW. 01',
    groupName: 'KWT TUNAS HIJAU ASTEBA',
    coordinatorName: 'Hasia T',
    coordinatorPhone: '6282196297716',
    farmingType: 'Hidroponik / NFT',
    commodities: ['JAGUNG', 'LOMBOK', 'TOMAT', 'SAWI'],
    activeMembers: 15,
    monthlyProductionKg: 45,
    nextHarvestDate: '20 Nov 2026',
    harvestEstimatedKg: 20,
    status: 'Aktif Produktif',
    description: 'Kebun binaan ketahanan pangan Kelurahan Panaikang.',
    photoUrl: '/images/uf_asteba_rw01.jpg',
  },
];

export const INITIAL_URBAN_FARMING_LOCATIONS: UrbanFarmingLocation[] = [];

export const INITIAL_FARMER_GROUPS: FarmerGroup[] = [];

export const INITIAL_CROPS: CropItem[] = [];

export const INITIAL_PLANT_CARE_LOGS: PlantCareLog[] = [];

export const INITIAL_HARVEST_RECORDS: HarvestRecord[] = [];

export const INITIAL_FARMING_INVENTORIES: FarmingInventoryItem[] = [];

export const INITIAL_SUPPLY_REQUESTS: SupplyRequestItem[] = [];

export const INITIAL_SEED_REQUESTS: SeedRequestItem[] = [];

export const INITIAL_SPONSORS: SponsorItem[] = [];
