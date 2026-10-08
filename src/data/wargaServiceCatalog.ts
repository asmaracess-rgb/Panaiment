import { ReportCategory, ReportUrgency } from '../types';

export type MainWargaMenuId =
  | 'buat_surat'
  | 'adminduk'
  | 'pelayanan_usaha'
  | 'bantuan_sosial'
  | 'pengaduan_warga'
  | 'layanan_lingkungan'
  | 'info_kegiatan'
  | 'cek_status'
  | 'pengumuman'
  | 'hubungi_kelurahan';

export type DetailedCategoryId =
  | 'administrasi_kependudukan'
  | 'surat_keterangan'
  | 'pelayanan_usaha'
  | 'masalah_lingkungan'
  | 'bantuan_sosial'
  | 'sosial_kemasyarakatan'
  | 'pengaduan_permasalahan_warga';

export interface SubMenuSpecificField {
  key: string;
  label: string;
  placeholder: string;
  type?: 'text' | 'select';
  options?: string[];
}

export interface ServiceSubItem {
  id: string;
  label: string;
  documentCode: string;
  officialHeaderTitle: string;
  processingUnit: string;
  requirements: string[];
  sopSteps: string[];
  estimation: string;
  reportCategory: ReportCategory;
  defaultUrgency: ReportUrgency;
  placeholderNote: string;
  isEnvironmental?: boolean;
  specificFields: SubMenuSpecificField[];
}

export interface ServiceCategoryGroup {
  id: DetailedCategoryId;
  number: string;
  title: string;
  subtitle: string;
  iconName:
    | 'UserCheck'
    | 'FileText'
    | 'Briefcase'
    | 'Trees'
    | 'HeartHandshake'
    | 'Users'
    | 'Siren';
  accentBg: string;
  accentText: string;
  accentBorder: string;
  iconBg: string;
  linkedMainMenu: MainWargaMenuId;
  items: ServiceSubItem[];
}

export interface MainMenuCardConfig {
  id: MainWargaMenuId;
  emoji: string;
  label: string;
  shortDesc: string;
  defaultCategory?: DetailedCategoryId;
  badgeText: string;
}

export const MAIN_WARGA_MENUS: MainMenuCardConfig[] = [
  {
    id: 'buat_surat',
    emoji: '📝',
    label: 'Buat Surat',
    shortDesc: '9 Layanan Surat Keterangan (SKTM, SKU, Domisili, Nikah, Ahli Waris, Sekolah)',
    defaultCategory: 'surat_keterangan',
    badgeText: '9 Sub-Menu Surat',
  },
  {
    id: 'adminduk',
    emoji: '👤',
    label: 'Administrasi Kependudukan',
    shortDesc: '7 Layanan Pengantar KTP/KK, Perubahan KK, Pindah/Datang, Kelahiran & Kematian',
    defaultCategory: 'administrasi_kependudukan',
    badgeText: '7 Sub-Menu Adminduk',
  },
  {
    id: 'pelayanan_usaha',
    emoji: '💼',
    label: 'Pelayanan Usaha',
    shortDesc: '5 Layanan SKU, Pengantar Izin Usaha, Informasi & Pemberdayaan UMKM',
    defaultCategory: 'pelayanan_usaha',
    badgeText: '5 Sub-Menu Usaha',
  },
  {
    id: 'bantuan_sosial',
    emoji: '🤝',
    label: 'Bantuan Sosial',
    shortDesc: '5 Layanan Pendataan Bansos, Pengaduan, Warga Kurang Mampu & Program Pemerintah',
    defaultCategory: 'bantuan_sosial',
    badgeText: '5 Sub-Menu Bansos',
  },
  {
    id: 'pengaduan_warga',
    emoji: '🚨',
    label: 'Pengaduan Warga',
    shortDesc: '5 Layanan Konflik Warga, Batas Tanah, Ketertiban, Layanan Publik & Mediasi',
    defaultCategory: 'pengaduan_permasalahan_warga',
    badgeText: '5 Sub-Menu Pengaduan',
  },
  {
    id: 'layanan_lingkungan',
    emoji: '🏘️',
    label: 'Layanan Lingkungan',
    shortDesc: '8 Layanan Drainase, Sampah, Jalan Rusak, Lampu Jalan, Pohon, Fasum & Banjir',
    defaultCategory: 'masalah_lingkungan',
    badgeText: '8 Sub-Menu Lingkungan',
  },
  {
    id: 'info_kegiatan',
    emoji: '📅',
    label: 'Informasi & Kegiatan Kelurahan',
    shortDesc: '5 Layanan Pengantar Kegiatan, Rekomendasi Acara, Izin Fasum & Kegiatan RT/RW',
    defaultCategory: 'sosial_kemasyarakatan',
    badgeText: '5 Sub-Menu Kemasyarakatan',
  },
  {
    id: 'cek_status',
    emoji: '🔎',
    label: 'Cek Status Pengajuan',
    shortDesc: 'Lacak Nomor Tiket Pengajuan Surat & Tindak Lanjut Laporan Warga',
    badgeText: 'Pelacakan Tiket',
  },
  {
    id: 'pengumuman',
    emoji: '📢',
    label: 'Pengumuman Kelurahan',
    shortDesc: 'Informasi Resmi, Maklumat Pelayanan & Agenda Pemerintah Kelurahan',
    badgeText: 'Info Resmi',
  },
  {
    id: 'hubungi_kelurahan',
    emoji: '📞',
    label: 'Hubungi Kelurahan',
    shortDesc: 'Alamat Kantor, Jam Operasional Loket & Direktori Ketua RW se-Panaikang',
    badgeText: 'Kontak & Lokasi',
  },
];

export const SERVICE_CATEGORY_GROUPS: ServiceCategoryGroup[] = [
  {
    id: 'administrasi_kependudukan',
    number: '01',
    title: 'Administrasi Kependudukan',
    subtitle:
      'Layanan pengantar KTP/KK, perubahan data KK, surat pindah/datang, domisili, tinggal sementara, kelahiran & kematian.',
    iconName: 'UserCheck',
    accentBg: 'bg-sky-50/70',
    accentText: 'text-[#0277BD]',
    accentBorder: 'border-sky-200',
    iconBg: 'bg-[#0277BD] text-white',
    linkedMainMenu: 'adminduk',
    items: [
      {
        id: 'adminduk-ktp-kk',
        label: 'Surat pengantar KTP/KK',
        documentCode: '474.4 / ADM-KTPKK / PNK',
        officialHeaderTitle: 'SURAT PENGANTAR PENERBITAN KTP-EL & KARTU KELUARGA',
        processingUnit: 'Seksi Pemerintahan & Loket Kependudukan',
        requirements: [
          'Surat Pengantar RT/RW setempat',
          'Fotokopi Kartu Keluarga (KK)',
          'Fotokopi Akta Kelahiran / Ijazah terakhir',
        ],
        sopSteps: [
          'Isi data pemohon & jenis pengajuan KTP-el/KK pada formulir ini',
          'Verifikasi berkas pengantar RT/RW oleh operator loket kelurahan',
          'Penerbitan Surat Pengantar Kelurahan untuk proses Disdukcapil Makassar',
        ],
        estimation: '1 Hari Kerja (Loket Kependudukan)',
        reportCategory: 'Ketertiban & Fasum',
        defaultUrgency: 'Normal',
        placeholderNote:
          'Contoh: Permohonan surat pengantar perekaman KTP-el baru (usia 17 tahun) atau penggantian KTP rusak/hilang...',
        specificFields: [
          {
            key: 'jenisDokumen',
            label: 'Jenis Dokumen yang Diajukan',
            placeholder: 'Pilih jenis dokumen',
            type: 'select',
            options: [
              'Perekaman KTP-el Baru (Pemula)',
              'Cetak Ulang KTP-el Rusak / Perubahan Data',
              'Penerbitan Kartu Keluarga (KK) Baru',
              'Cetak Ulang KK Hilang / Rusak',
            ],
          },
          {
            key: 'alasanPermohonan',
            label: 'Alasan / Keperluan Pengajuan',
            placeholder: 'Contoh: Telah berusia 17 tahun / Membentuk keluarga baru',
          },
        ],
      },
      {
        id: 'adminduk-perubahan-kk',
        label: 'Surat pengantar perubahan data KK',
        documentCode: '474.4 / ADM-UBAHKK / PNK',
        officialHeaderTitle: 'SURAT PENGANTAR PERUBAHAN ELEMEN DATA KARTU KELUARGA',
        processingUnit: 'Seksi Pemerintahan & Loket Kependudukan',
        requirements: [
          'Pengantar RT/RW setempat',
          'Kartu Keluarga (KK) Asli & Fotokopi',
          'Dokumen dasar perubahan (Ijazah / Buku Nikah / Akta Kelahiran / SK Kerja)',
        ],
        sopSteps: [
          'Pilih elemen data KK yang akan diubah dan isi rincian perubahannya',
          'Pemeriksaan kesesuaian dokumen pendukung oleh petugas kelurahan',
          'Pengesahan Surat Pengantar Perubahan KK oleh Lurah / Kasi Pemerintahan',
        ],
        estimation: '1 Hari Kerja',
        reportCategory: 'Ketertiban & Fasum',
        defaultUrgency: 'Normal',
        placeholderNote:
          'Contoh: Perubahan data pendidikan terakhir, pekerjaan, atau penambahan anggota keluarga pada KK...',
        specificFields: [
          {
            key: 'elemenDiubah',
            label: 'Elemen Data KK yang Diubah',
            placeholder: 'Pilih elemen perubahan',
            type: 'select',
            options: [
              'Penambahan Anggota Keluarga (Anak / Menantu)',
              'Perubahan Pendidikan Terakhir / Pekerjaan',
              'Perubahan Status Perkawinan',
              'Perbaikan Ejaan Nama / Tempat Tanggal Lahir',
            ],
          },
          {
            key: 'dataSemulaMenjadi',
            label: 'Rincian Data Semula → Menjadi',
            placeholder: 'Contoh: Pendidikan SMA menjadi S1 / Penambahan anak ke-2',
          },
        ],
      },
      {
        id: 'adminduk-pindah-datang',
        label: 'Surat pengantar pindah/datang',
        documentCode: '475 / ADM-PINDAH / PNK',
        officialHeaderTitle: 'SURAT PENGANTAR PINDAH / DATANG PENDUDUK (SKPWNI)',
        processingUnit: 'Seksi Pemerintahan Kelurahan Panaikang',
        requirements: [
          'Pengantar RT/RW setempat',
          'Fotokopi KTP & Kartu Keluarga (KK)',
          'Alamat lengkap tujuan pindah atau SKPWNI dari daerah asal',
        ],
        sopSteps: [
          'Lengkapi data jenis mutasi (Pindah Keluar atau Pindah Datang) beserta alamat tujuan/asal',
          'Verifikasi data anggota keluarga yang ikut pindah/datang',
          'Penerbitan pengantar mutasi penduduk Kelurahan Panaikang',
        ],
        estimation: '1 Hari Kerja',
        reportCategory: 'Ketertiban & Fasum',
        defaultUrgency: 'Normal',
        placeholderNote:
          'Contoh: Pengajuan surat pengantar pindah domisili satu keluarga (4 jiwa) ke Kecamatan Manggala...',
        specificFields: [
          {
            key: 'jenisMutasi',
            label: 'Jenis Layanan Pindah / Datang',
            placeholder: 'Pilih jenis mutasi',
            type: 'select',
            options: [
              'Pindah Keluar Antar Kelurahan / Kecamatan (Dalam Kota Makassar)',
              'Pindah Keluar Antar Kabupaten / Kota / Provinsi',
              'Kedatangan Penduduk Baru (Pindah Datang ke Panaikang)',
            ],
          },
          {
            key: 'alamatTujuanAsal',
            label: 'Alamat Lengkap Tujuan Pindah / Daerah Asal',
            placeholder: 'Contoh: Jl. Tamangapa Raya No. 14, Kota Makassar (3 Anggota Keluarga)',
          },
        ],
      },
      {
        id: 'adminduk-domisili',
        label: 'Surat keterangan domisili',
        documentCode: '470 / ADM-DOM / PNK',
        officialHeaderTitle: 'SURAT KETERANGAN DOMISILI PENDUDUK',
        processingUnit: 'Seksi Pemerintahan Kelurahan Panaikang',
        requirements: [
          'Pengantar RT/RW setempat',
          'Fotokopi KTP & KK pemohon',
          'Bukti tempat tinggal / keterangan menetap di wilayah RT/RW',
        ],
        sopSteps: [
          'Input identitas lengkap, alamat menetap di Panaikang, dan keperluan domisili',
          'Validasi status tempat tinggal berdasarkan pengantar RT/RW',
          'Penandatanganan Surat Keterangan Domisili oleh Lurah Panaikang',
        ],
        estimation: '1 Hari Kerja',
        reportCategory: 'Ketertiban & Fasum',
        defaultUrgency: 'Normal',
        placeholderNote:
          'Contoh: Permohonan surat keterangan domisili tempat tinggal di RW 02 untuk kelengkapan administrasi kerja...',
        specificFields: [
          {
            key: 'lamaMenetap',
            label: 'Lama Menetap di Alamat Sekarang',
            placeholder: 'Contoh: Sejak tahun 2019 (7 Tahun) / Rumah Milik Sendiri',
          },
          {
            key: 'keperluanDomisili',
            label: 'Keperluan Surat Keterangan Domisili',
            placeholder: 'Contoh: Persyaratan administrasi perbankan / melamar pekerjaan',
          },
        ],
      },
      {
        id: 'adminduk-tinggal-sementara',
        label: 'Surat keterangan tinggal sementara',
        documentCode: '470 / ADM-SKTS / PNK',
        officialHeaderTitle: 'SURAT KETERANGAN TINGGAL SEMENTARA (PENDUDUK NON-PERMANEN)',
        processingUnit: 'Seksi Pemerintahan & Trantib Kelurahan',
        requirements: [
          'Pengantar RT/RW tempat tinggal sementara',
          'Fotokopi KTP-el daerah asal',
          'Identitas pemilik rumah / pengelola kos di Kelurahan Panaikang',
        ],
        sopSteps: [
          'Isi alamat KTP daerah asal, nama rumah kos/kontrakan, dan tujuan tinggal sementara',
          'Pencatatan data penduduk non-permanen oleh petugas RT/RW & Kelurahan',
          'Penerbitan Surat Keterangan Tinggal Sementara',
        ],
        estimation: '1 Hari Kerja',
        reportCategory: 'Ketertiban & Fasum',
        defaultUrgency: 'Normal',
        placeholderNote:
          'Contoh: Permohonan surat keterangan tinggal sementara bagi mahasiswa UMI / pekerja perantau di wilayah RW 03...',
        specificFields: [
          {
            key: 'daerahAsal',
            label: 'Alamat KTP Daerah Asal',
            placeholder: 'Contoh: Kab. Bone / Kab. Gowa / Kota Parepare',
          },
          {
            key: 'pemilikPondokan',
            label: 'Nama Pemilik Kos / Kontrakan & Keperluan Tinggal',
            placeholder: 'Contoh: Kos Pondok Indah RW 03 — Kuliah di Kampus UMI Makassar',
          },
        ],
      },
      {
        id: 'adminduk-kelahiran',
        label: 'Surat keterangan kelahiran',
        documentCode: '472.11 / ADM-LAHIR / PNK',
        officialHeaderTitle: 'SURAT KETERANGAN KELAHIRAN',
        processingUnit: 'Seksi Pemerintahan Kelurahan Panaikang',
        requirements: [
          'Pengantar RT/RW setempat',
          'Surat Keterangan Lahir dari Rumah Sakit / Puskesmas / Bidan',
          'Fotokopi KTP & KK Orang Tua serta Buku Nikah / Akta Perkawinan',
        ],
        sopSteps: [
          'Input nama bayi, tempat/tanggal lahir, dan nama lengkap ayah & ibu',
          'Pemeriksaan surat keterangan lahir medis dan KK orang tua',
          'Penerbitan Surat Keterangan Kelahiran untuk pengurusan Akta Kelahiran',
        ],
        estimation: '1 Hari Kerja',
        reportCategory: 'Ketertiban & Fasum',
        defaultUrgency: 'Normal',
        placeholderNote:
          'Contoh: Pengajuan surat keterangan kelahiran anak pertama untuk penerbitan Akta Kelahiran & penambahan di KK...',
        specificFields: [
          {
            key: 'namaBayiDanTglLahir',
            label: 'Nama Lengkap Bayi & Tanggal/Tempat Lahir',
            placeholder: 'Contoh: Aisyah Putri — Lahir di RS Ibnu Sina, 02 Oktober 2026',
          },
          {
            key: 'namaOrangTua',
            label: 'Nama Ayah Kandung & Ibu Kandung',
            placeholder: 'Contoh: Ayah: Hendra Saputra | Ibu: Rahmawati',
          },
        ],
      },
      {
        id: 'adminduk-kematian',
        label: 'Surat keterangan kematian',
        documentCode: '472.12 / ADM-KMT / PNK',
        officialHeaderTitle: 'SURAT KETERANGAN KEMATIAN WARGA',
        processingUnit: 'Seksi Pemerintahan & Kesra Kelurahan (Layanan Prioritas)',
        requirements: [
          'Pengantar RT/RW setempat',
          'Surat Keterangan Kematian dari Rumah Sakit / Dokter (jika meninggal di Faskes)',
          'Fotokopi KTP & KK Almarhum/Almarhumah serta KTP Pelapor',
        ],
        sopSteps: [
          'Input identitas almarhum/almarhumah, waktu wafat, dan hubungan pelapor',
          'Verifikasi prioritas oleh petugas piket kelurahan',
          'Penerbitan Surat Keterangan Kematian untuk pemakaman & Akta Kematian',
        ],
        estimation: 'Prioritas Hari yang Sama',
        reportCategory: 'Ketertiban & Fasum',
        defaultUrgency: 'Tinggi',
        placeholderNote:
          'Contoh: Permohonan surat keterangan kematian warga RW 04 untuk kelengkapan administrasi pemakaman dan akta kematian...',
        specificFields: [
          {
            key: 'namaAlmarhum',
            label: 'Nama Lengkap Almarhum / Almarhumah & Usia',
            placeholder: 'Contoh: Alm. H. Bachtiar Dg. Nassa (68 Tahun)',
          },
          {
            key: 'waktuTempatWafat',
            label: 'Hari/Tanggal, Tempat Wafat & Lokasi Pemakaman',
            placeholder: 'Contoh: Rabu, 07 Okt 2026 di Rumah Duka RW 04 — Pemakaman Panaikang',
          },
        ],
      },
    ],
  },
  {
    id: 'surat_keterangan',
    number: '02',
    title: 'Surat Keterangan',
    subtitle:
      'Layanan pembuatan SKTM, SKU, domisili, penghasilan, belum menikah, ahli waris, pengantar nikah, kehilangan & sekolah/kuliah.',
    iconName: 'FileText',
    accentBg: 'bg-indigo-50/70',
    accentText: 'text-indigo-800',
    accentBorder: 'border-indigo-200',
    iconBg: 'bg-[#0D3868] text-white',
    linkedMainMenu: 'buat_surat',
    items: [
      {
        id: 'suket-sktm',
        label: 'Surat keterangan tidak mampu (SKTM)',
        documentCode: '401 / SKTM / PNK',
        officialHeaderTitle: 'SURAT KETERANGAN TIDAK MAMPU (SKTM)',
        processingUnit: 'Seksi Kesejahteraan Rakyat (Kesra) Kelurahan',
        requirements: [
          'Pengantar RT/RW setempat',
          'Fotokopi KTP & Kartu Keluarga (KK)',
          'Pernyataan kondisi sosial ekonomi / rincian keperluan SKTM',
        ],
        sopSteps: [
          'Isi data pemohon dan tujuan penggunaan SKTM (Kesehatan/Pendidikan/Sosial)',
          'Verifikasi data keluarga oleh Kasi Kesra & Pengantar RT/RW',
          'Penerbitan SKTM resmi yang ditandatangani Lurah Panaikang',
        ],
        estimation: '1 Hari Kerja',
        reportCategory: 'Ketertiban & Fasum',
        defaultUrgency: 'Tinggi',
        placeholderNote:
          'Contoh: Permohonan SKTM untuk keringanan biaya perawatan rumah sakit atau pengajuan beasiswa pendidikan anak...',
        specificFields: [
          {
            key: 'peruntukanSktm',
            label: 'Tujuan / Instansi Tujuan SKTM',
            placeholder: 'Pilih tujuan SKTM',
            type: 'select',
            options: [
              'Beasiswa / Keringanan Biaya Sekolah atau Kampus (KIP)',
              'Pelayanan Kesehatan / Rumah Sakit / JKN-KIS PBI',
              'Bantuan Sosial / Lembaga Amal / Baznas',
              'Keperluan Administrasi Keringanan Biaya Lainnya',
            ],
          },
          {
            key: 'pekerjaanTanggungan',
            label: 'Pekerjaan Kepala Keluarga & Jumlah Tanggungan',
            placeholder: 'Contoh: Buruh Harian Lepas — 4 Orang Tanggungan Keluarga',
          },
        ],
      },
      {
        id: 'suket-usaha',
        label: 'Surat keterangan usaha',
        documentCode: '503 / SKU / PNK',
        officialHeaderTitle: 'SURAT KETERANGAN USAHA (SKU)',
        processingUnit: 'Seksi Pemberdayaan Masyarakat & Ekonomi',
        requirements: [
          'Pengantar RT/RW setempat',
          'Fotokopi KTP & Kartu Keluarga (KK)',
          'Foto tempat/kegiatan usaha di wilayah Kelurahan Panaikang',
        ],
        sopSteps: [
          'Isi nama usaha, bidang kegiatan usaha, dan lokasi tempat usaha di Panaikang',
          'Pemeriksaan kesesuaian lokasi usaha berdasarkan pengantar RT/RW',
          'Penerbitan Surat Keterangan Usaha (SKU) Kelurahan Panaikang',
        ],
        estimation: '1 Hari Kerja',
        reportCategory: 'Ketertiban & Fasum',
        defaultUrgency: 'Normal',
        placeholderNote:
          'Contoh: Permohonan Surat Keterangan Usaha (SKU) warung makan / toko kelontong untuk persyaratan KUR perbankan...',
        specificFields: [
          {
            key: 'namaDanJenisUsaha',
            label: 'Nama Usaha & Bidang Usaha',
            placeholder: 'Contoh: Warung Berkah — Usaha Kuliner & Sembako',
          },
          {
            key: 'keperluanSku',
            label: 'Lama Berdiri & Keperluan SKU',
            placeholder: 'Contoh: Berdiri sejak 2022 — Pengajuan KUR Bank BRI / Administrasi NIB',
          },
        ],
      },
      {
        id: 'suket-domisili',
        label: 'Surat keterangan domisili',
        documentCode: '470 / SKD / PNK',
        officialHeaderTitle: 'SURAT KETERANGAN DOMISILI',
        processingUnit: 'Seksi Pemerintahan Kelurahan Panaikang',
        requirements: [
          'Pengantar RT/RW setempat',
          'Fotokopi KTP & Kartu Keluarga (KK)',
          'Keperluan administrasi domisili',
        ],
        sopSteps: [
          'Isi data alamat domisili lengkap beserta keperluan pembuatan surat',
          'Pemeriksaan berkas KTP/KK dan pengantar RT/RW',
          'Penerbitan Surat Keterangan Domisili',
        ],
        estimation: '1 Hari Kerja',
        reportCategory: 'Ketertiban & Fasum',
        defaultUrgency: 'Normal',
        placeholderNote:
          'Contoh: Permohonan Surat Keterangan Domisili warga untuk persyaratan pembukaan rekening bank / seleksi kerja...',
        specificFields: [
          {
            key: 'statusTempatTinggal',
            label: 'Status Tempat Tinggal',
            placeholder: 'Pilih status tempat tinggal',
            type: 'select',
            options: [
              'Rumah Milik Sendiri / Keluarga',
              'Rumah Kontrakan / Sewa',
              'Rumah Dinas / Mess',
              'Domisili Lembaga / Badan Usaha',
            ],
          },
          {
            key: 'tujuanDomisili',
            label: 'Instansi / Keperluan Penggunaan Surat',
            placeholder: 'Contoh: Persyaratan administrasi kepegawaian / perbankan',
          },
        ],
      },
      {
        id: 'suket-penghasilan',
        label: 'Surat keterangan penghasilan',
        documentCode: '400 / SKP / PNK',
        officialHeaderTitle: 'SURAT KETERANGAN PENGHASILAN ORANG TUA / WAGA',
        processingUnit: 'Seksi Kesejahteraan Rakyat (Kesra) Kelurahan',
        requirements: [
          'Pengantar RT/RW setempat',
          'Fotokopi KTP & Kartu Keluarga (KK)',
          'Surat pernyataan rata-rata penghasilan bulanan bagi pekerja informal/wiraswasta',
        ],
        sopSteps: [
          'Input profesi/pekerjaan, nominal rata-rata penghasilan per bulan, dan tujuan surat',
          'Verifikasi surat pernyataan penghasilan dan pengantar RT/RW',
          'Penerbitan Surat Keterangan Penghasilan resmi kelurahan',
        ],
        estimation: '1 Hari Kerja',
        reportCategory: 'Ketertiban & Fasum',
        defaultUrgency: 'Normal',
        placeholderNote:
          'Contoh: Permohonan surat keterangan penghasilan orang tua untuk pendaftaran KIP Kuliah / UKT Perguruan Tinggi...',
        specificFields: [
          {
            key: 'pekerjaanDanNominal',
            label: 'Pekerjaan & Rata-Rata Penghasilan per Bulan (Rp)',
            placeholder: 'Contoh: Pedagang Harian — Rp 2.200.000 / Bulan',
          },
          {
            key: 'tujuanSuratPenghasilan',
            label: 'Keperluan (Nama Anak / Sekolah / Universitas)',
            placeholder: 'Contoh: Penentuan UKT / Pendaftaran Beasiswa Mahasiswa Baru UNHAS/UMI',
          },
        ],
      },
      {
        id: 'suket-belum-menikah',
        label: 'Surat keterangan belum menikah',
        documentCode: '474.2 / SKBM / PNK',
        officialHeaderTitle: 'SURAT KETERANGAN BELUM PERNAH MENIKAH',
        processingUnit: 'Seksi Pemerintahan & Kesra Kelurahan',
        requirements: [
          'Pengantar RT/RW setempat',
          'Fotokopi KTP & Kartu Keluarga (KK)',
          'Surat pernyataan belum pernah menikah bermeterai diketahui saksi/RT/RW',
        ],
        sopSteps: [
          'Isi data diri pemohon dan tujuan penggunaan Surat Keterangan Belum Menikah',
          'Verifikasi status perkawinan pada KK dan pernyataan bermeterai',
          'Penerbitan Surat Keterangan Belum Menikah',
        ],
        estimation: '1 Hari Kerja',
        reportCategory: 'Ketertiban & Fasum',
        defaultUrgency: 'Normal',
        placeholderNote:
          'Contoh: Permohonan surat keterangan belum menikah untuk persyaratan melamar pekerjaan / seleksi TNI-Polri / KUA...',
        specificFields: [
          {
            key: 'statusPerkawinanSaatIni',
            label: 'Status Kependudukan pada KTP/KK',
            placeholder: 'Contoh: Belum Kawin (Jejaka / Gadis)',
          },
          {
            key: 'keperluanSkbm',
            label: 'Keperluan Surat Keterangan Belum Menikah',
            placeholder: 'Contoh: Persyaratan rekrutmen karyawan / kelengkapan berkas KUA',
          },
        ],
      },
      {
        id: 'suket-ahli-waris',
        label: 'Surat keterangan ahli waris',
        documentCode: '474.3 / SKAW / PNK',
        officialHeaderTitle: 'SURAT KETERANGAN & PERNYATAAN AHLI WARIS',
        processingUnit: 'Seksi Pemerintahan Kelurahan Panaikang',
        requirements: [
          'Pengantar RT/RW setempat',
          'Fotokopi Akta Kematian / Surat Kematian Pewaris',
          'Fotokopi KTP, KK & Akta Kelahiran seluruh ahli waris',
          'Bagan silsilah keluarga & 2 orang saksi',
        ],
        sopSteps: [
          'Input nama almarhum/almarhumah (pewaris) dan daftar nama ahli waris',
          'Pemeriksaan dokumen silsilah keluarga, akta kematian, dan KTP ahli waris',
          'Registrasi dan pengesahan Surat Keterangan Ahli Waris di Kelurahan & Kecamatan',
        ],
        estimation: '1–2 Hari Kerja (Verifikasi Kasi Pemerintahan)',
        reportCategory: 'Ketertiban & Fasum',
        defaultUrgency: 'Normal',
        placeholderNote:
          'Contoh: Permohonan registrasi surat keterangan ahli waris untuk pengurusan tabungan bank / balik nama sertifikat...',
        specificFields: [
          {
            key: 'namaPewaris',
            label: 'Nama Lengkap Pewaris (Almarhum/Almarhumah)',
            placeholder: 'Contoh: Alm. H. Syamsuddin Dg. Kulle',
          },
          {
            key: 'daftarAhliWaris',
            label: 'Jumlah & Nama Perwakilan Ahli Waris serta Keperluan',
            placeholder: 'Contoh: 4 Orang Ahli Waris — Pengurusan klaim Taspen / Perbankan',
          },
        ],
      },
      {
        id: 'suket-pengantar-nikah',
        label: 'Surat pengantar nikah',
        documentCode: '474.2 / N1-N4 / PNK',
        officialHeaderTitle: 'SURAT PENGANTAR PERKAWINAN (FORMULIR N1 – N4)',
        processingUnit: 'Seksi Kesejahteraan Rakyat (Kesra) Kelurahan',
        requirements: [
          'Pengantar RT/RW setempat',
          'Fotokopi KTP & KK calon mempelai dan kedua orang tua',
          'Fotokopi Akta Kelahiran & Ijazah terakhir',
          'Pasfoto latar biru/merah ukuran 2x3 dan 4x6',
        ],
        sopSteps: [
          'Isi identitas calon mempelai, nama orang tua, dan rencana lokasi/tanggal akad nikah',
          'Verifikasi kelengkapan berkas status perkawinan oleh Kasi Kesra',
          'Penerbitan Pengantar Nikah (Formulir N1–N4) menuju KUA Kec. Panakkukang',
        ],
        estimation: '1 Hari Kerja (Formulir N1–N4 KUA)',
        reportCategory: 'Ketertiban & Fasum',
        defaultUrgency: 'Normal',
        placeholderNote:
          'Contoh: Permohonan surat pengantar nikah (N1-N4) menuju KUA Kecamatan Panakkukang atau numpang nikah...',
        specificFields: [
          {
            key: 'namaCalonPasangan',
            label: 'Nama Lengkap Calon Pasangan (Mempelai Pria/Wanita)',
            placeholder: 'Contoh: Muhammad Fadli, S.Kom & Nurul Hidayah, S.Pd',
          },
          {
            key: 'kuaTujuanDanTanggal',
            label: 'KUA Tujuan & Rencana Tanggal Akad Nikah',
            placeholder: 'Contoh: KUA Kec. Panakkukang — Minggu, 25 Oktober 2026',
          },
        ],
      },
      {
        id: 'suket-kehilangan',
        label: 'Surat keterangan kehilangan',
        documentCode: '300 / SKK-HLG / PNK',
        officialHeaderTitle: 'SURAT PENGANTAR KETERANGAN KEHILANGAN',
        processingUnit: 'Seksi Pemerintahan & Trantib Kelurahan',
        requirements: [
          'Pengantar RT/RW setempat',
          'Fotokopi KTP & Kartu Keluarga (KK)',
          'Rincian nomor/identitas dokumen atau barang yang hilang beserta waktu & lokasi',
        ],
        sopSteps: [
          'Input rincian dokumen/barang yang hilang beserta perkiraan waktu dan lokasi',
          'Verifikasi identitas pemohon dan pengantar RT/RW',
          'Penerbitan Surat Pengantar Kehilangan untuk laporan Polsek/Polrestabes atau instansi terkait',
        ],
        estimation: '1 Hari Kerja',
        reportCategory: 'Ketertiban & Fasum',
        defaultUrgency: 'Normal',
        placeholderNote:
          'Contoh: Permohonan surat pengantar kehilangan dokumen buku tabungan / KK / STNK untuk pengurusan surat kehilangan kepolisian...',
        specificFields: [
          {
            key: 'dokumenBarangHilang',
            label: 'Nama Dokumen / Barang yang Hilang',
            placeholder: 'Contoh: Kartu Keluarga Asli / Buku Tabungan BRI / Ijazah',
          },
          {
            key: 'waktuLokasiHilang',
            label: 'Perkiraan Waktu & Lokasi Kehilangan',
            placeholder: 'Contoh: Senin, 05 Oktober 2026 di sekitar Jl. Urip Sumoharjo',
          },
        ],
      },
      {
        id: 'suket-sekolah-kuliah',
        label: 'Surat keterangan untuk keperluan sekolah/kuliah',
        documentCode: '420 / SUKET-DIK / PNK',
        officialHeaderTitle: 'SURAT KETERANGAN ADMINISTRASI SEKOLAH / PERGURUAN TINGGI',
        processingUnit: 'Seksi Kesejahteraan Rakyat (Kesra) Kelurahan',
        requirements: [
          'Pengantar RT/RW setempat',
          'Fotokopi KTP/KIA & Kartu Keluarga (KK)',
          'Kartu Pelajar / Mahasiswa atau informasi persyaratan dari sekolah/kampus',
        ],
        sopSteps: [
          'Input nama siswa/mahasiswa, nama sekolah/kampus, dan jenis surat keterangan yang dibutuhkan',
          'Pemeriksaan kesesuaian data KK dan domisili orang tua/wali',
          'Penerbitan Surat Keterangan Pendidikan Kelurahan Panaikang',
        ],
        estimation: '1 Hari Kerja',
        reportCategory: 'Ketertiban & Fasum',
        defaultUrgency: 'Normal',
        placeholderNote:
          'Contoh: Permohonan surat keterangan domisili zonasi PPDB sekolah atau keterangan wali mahasiswa untuk kampus...',
        specificFields: [
          {
            key: 'namaSekolahKampus',
            label: 'Nama Sekolah / Perguruan Tinggi Tujuan',
            placeholder: 'Contoh: SMAN 5 Makassar / Universitas Muslim Indonesia (UMI)',
          },
          {
            key: 'jenisKeperluanPendidikan',
            label: 'Jenis Keperluan Sekolah / Kuliah',
            placeholder: 'Contoh: Pendaftaran Jalur Domisili / Pengajuan Beasiswa Berprestasi',
          },
        ],
      },
    ],
  },
  {
    id: 'pelayanan_usaha',
    number: '03',
    title: 'Pelayanan Usaha',
    subtitle:
      'Layanan surat keterangan usaha, pengantar perizinan, informasi UMKM, program pemberdayaan & pendataan pelaku usaha.',
    iconName: 'Briefcase',
    accentBg: 'bg-amber-50/70',
    accentText: 'text-amber-800',
    accentBorder: 'border-amber-200',
    iconBg: 'bg-amber-600 text-white',
    linkedMainMenu: 'pelayanan_usaha',
    items: [
      {
        id: 'usaha-sku',
        label: 'Surat keterangan usaha',
        documentCode: '503 / EKO-SKU / PNK',
        officialHeaderTitle: 'SURAT KETERANGAN USAHA (PELAYANAN UMKM)',
        processingUnit: 'Seksi Pemberdayaan Masyarakat & Ekonomi',
        requirements: [
          'Pengantar RT/RW lokasi usaha',
          'Fotokopi KTP & KK pelaku usaha',
          'Foto tempat/kegiatan usaha & produk usaha',
        ],
        sopSteps: [
          'Lengkapi profil usaha, alamat tempat usaha, dan modal/skala usaha',
          'Verifikasi data usaha oleh Seksi Pemberdayaan Masyarakat',
          'Penerbitan SKU resmi & pencatatan otomatis ke direktori UMKM Panaikang',
        ],
        estimation: '1 Hari Kerja',
        reportCategory: 'Ketertiban & Fasum',
        defaultUrgency: 'Normal',
        placeholderNote:
          'Contoh: Pengajuan SKU untuk usaha kuliner rumahan / konveksi / bengkel di wilayah Kelurahan Panaikang...',
        specificFields: [
          {
            key: 'namaUsahaUmkm',
            label: 'Nama Brand / Toko / Usaha',
            placeholder: 'Contoh: Kedai Kopi & Kue Tradisional Panaikang',
          },
          {
            key: 'sektorDanOmzet',
            label: 'Bidang Usaha & Lama Operasional',
            placeholder: 'Contoh: Kuliner Mikro — Beroperasi 3 Tahun di RW 02',
          },
        ],
      },
      {
        id: 'usaha-izin',
        label: 'Pengantar perizinan usaha',
        documentCode: '503 / EKO-IZIN / PNK',
        officialHeaderTitle: 'SURAT PENGANTAR REKOMENDASI PERIZINAN USAHA',
        processingUnit: 'Seksi Pemberdayaan Masyarakat & Pemerintahan',
        requirements: [
          'Pengantar RT/RW lokasi tempat usaha',
          'Fotokopi KTP, KK & NPWP pemilik usaha',
          'Pernyataan menjaga kebersihan dan ketertiban lingkungan sekitar tempat usaha',
        ],
        sopSteps: [
          'Input nama badan usaha/toko, jenis perizinan (NIB/OSS/Izin Operasional), dan lokasi',
          'Verifikasi kesesuaian lokasi usaha terhadap ketertiban lingkungan',
          'Penerbitan Surat Pengantar Perizinan Usaha Kelurahan Panaikang',
        ],
        estimation: '1–2 Hari Kerja',
        reportCategory: 'Ketertiban & Fasum',
        defaultUrgency: 'Normal',
        placeholderNote:
          'Contoh: Permohonan surat pengantar kelurahan untuk kelengkapan NIB / OSS atau izin tempat usaha...',
        specificFields: [
          {
            key: 'jenisPerizinan',
            label: 'Jenis Perizinan yang Diurus',
            placeholder: 'Pilih jenis perizinan',
            type: 'select',
            options: [
              'Pengantar Nomor Induk Berusaha (NIB) / OSS RBA',
              'Rekomendasi Izin Tempat Usaha / Domisili Usaha',
              'Pengantar Sertifikasi Halal / PIRT UMKM',
              'Perpanjangan Administrasi Usaha Lainnya',
            ],
          },
          {
            key: 'ukuranDanTenagaKerja',
            label: 'Lokasi Usaha & Jumlah Tenaga Kerja',
            placeholder: 'Contoh: Ruko Jl. Urip Sumoharjo RW 02 — 5 Orang Karyawan',
          },
        ],
      },
      {
        id: 'usaha-info-umkm',
        label: 'Informasi UMKM',
        documentCode: '518 / INFO-UMKM / PNK',
        officialHeaderTitle: 'LAYANAN INFORMASI & KONSULTASI PEMBINAAN UMKM',
        processingUnit: 'Seksi Pemberdayaan Masyarakat Kelurahan Panaikang',
        requirements: [
          'Identitas pelaku usaha / warga Kelurahan Panaikang',
          'Nama usaha, kategori produk, dan kontak WhatsApp aktif',
        ],
        sopSteps: [
          'Sampaikan topik informasi UMKM yang dibutuhkan (pelatihan, bazar, NIB, atau sertifikasi halal)',
          'Tindak lanjut informasi & pendampingan oleh Kasi Pemberdayaan Masyarakat',
          'Penyampaian jadwal program UMKM melalui WhatsApp pemohon',
        ],
        estimation: 'Respon Hari yang Sama',
        reportCategory: 'Ketertiban & Fasum',
        defaultUrgency: 'Normal',
        placeholderNote:
          'Contoh: Permohonan informasi pendaftaran bazar UMKM kecamatan, fasilitasi halal gratis, atau pembinaan kemasan...',
        specificFields: [
          {
            key: 'topikInfoUmkm',
            label: 'Topik Informasi UMKM yang Dibutuhkan',
            placeholder: 'Pilih topik informasi',
            type: 'select',
            options: [
              'Informasi Pelatihan & Inkubasi UMKM Kota Makassar',
              'Fasilitasi Pembuatan NIB & Sertifikat Halal Gratis',
              'Pendaftaran Bazar / Pameran Produk UMKM Kelurahan',
              'Akses Permodalan KUR & Koperasi Kelurahan',
            ],
          },
          {
            key: 'produkUnggulan',
            label: 'Jenis Produk / Jasa UMKM Anda',
            placeholder: 'Contoh: Olahan Keripik Pisang & Sambal Kemasan',
          },
        ],
      },
      {
        id: 'usaha-bantuan-umkm',
        label: 'Pengajuan bantuan atau program pemberdayaan UMKM',
        documentCode: '518 / PROG-UMKM / PNK',
        officialHeaderTitle: 'USULAN PROGRAM BANTUAN & PEMBERDAYAAN UMKM',
        processingUnit: 'Seksi Pemberdayaan Masyarakat Kelurahan Panaikang',
        requirements: [
          'Pengantar RT/RW setempat',
          'Fotokopi KTP & KK warga Kelurahan Panaikang',
          'Surat Keterangan Usaha (SKU) / NIB',
          'Foto aktivitas usaha dan rincian peralatan/bantuan yang diajukan',
        ],
        sopSteps: [
          'Isi profil usaha dan jenis program pemberdayaan/bantuan sarana usaha yang diusulkan',
          'Verifikasi faktual usaha oleh petugas kelurahan & RT/RW',
          'Rekomendasi pengusulan ke Dinas Koperasi & UKM / instansi pembina',
        ],
        estimation: 'Verifikasi Berkala Kasi Pemberdayaan',
        reportCategory: 'Ketertiban & Fasum',
        defaultUrgency: 'Normal',
        placeholderNote:
          'Contoh: Pengajuan rekomendasi mengikuti program bantuan peralatan usaha kuliner / mesin jahit UMKM...',
        specificFields: [
          {
            key: 'jenisBantuanUsaha',
            label: 'Jenis Program / Bantuan Sarana yang Diajukan',
            placeholder: 'Contoh: Bantuan Etalase / Peralatan Produksi Kue / Pelatihan Digital',
          },
          {
            key: 'kondisiUsahaSaatIni',
            label: 'Keterangan Perkembangan Usaha Saat Ini',
            placeholder: 'Contoh: Usaha aktif berjalan 2 tahun, melayani pesanan warga sekitar RW 04',
          },
        ],
      },
      {
        id: 'usaha-pendataan',
        label: 'Pendataan pelaku usaha di wilayah kelurahan',
        documentCode: '503 / DATA-UMKM / PNK',
        officialHeaderTitle: 'FORMULIR PENDATAAN PELAKU USAHA & UMKM KELURAHAN PANAIKANG',
        processingUnit: 'Seksi Pemberdayaan Masyarakat & Ekonomi',
        requirements: [
          'KTP pemilik usaha (Warga / Pelaku Usaha di Panaikang)',
          'Nama usaha, alamat lengkap RT/RW, kategori usaha & nomor WhatsApp',
        ],
        sopSteps: [
          'Isi data lengkap usaha Anda untuk masuk ke Basis Data Resmi UMKM Kelurahan Panaikang',
          'Validasi titik lokasi RT/RW oleh operator kelurahan',
          'Terdaftar resmi untuk prioritas informasi program pemberdayaan pemerintah',
        ],
        estimation: 'Tercatat Langsung di Basis Data Kelurahan',
        reportCategory: 'Ketertiban & Fasum',
        defaultUrgency: 'Normal',
        placeholderNote:
          'Contoh: Pendaftaran data usaha baru (warung kelontong / laundry / kuliner / jasa) ke dalam basis data UMKM Kelurahan...',
        specificFields: [
          {
            key: 'kategoriSektorUsaha',
            label: 'Kategori Sektor Usaha',
            placeholder: 'Pilih sektor usaha',
            type: 'select',
            options: [
              'Kuliner / Makanan & Minuman',
              'Toko Kelontong / Sembako / Ritel',
              'Jasa (Laundry, Bengkel, Pangkas Rambut, Jahit)',
              'Kerajinan / Fashion / Kreatif',
              'Perdagangan Online / Lainnya',
            ],
          },
          {
            key: 'kepemilikanIzin',
            label: 'Status Kepemilikan NIB / SKU & Jumlah Pekerja',
            placeholder: 'Contoh: Sudah memiliki NIB — 2 Orang Pekerja',
          },
        ],
      },
    ],
  },
  {
    id: 'masalah_lingkungan',
    number: '04',
    title: 'Masalah Lingkungan',
    subtitle:
      'Pengaduan drainase tersumbat, sampah menumpuk, jalan rusak, lampu jalan mati, pohon berbahaya, fasum, keamanan & banjir.',
    iconName: 'Trees',
    accentBg: 'bg-emerald-50/70',
    accentText: 'text-emerald-800',
    accentBorder: 'border-emerald-200',
    iconBg: 'bg-[#1C8237] text-white',
    linkedMainMenu: 'layanan_lingkungan',
    items: [
      {
        id: 'lingkungan-drainase',
        label: 'Pengaduan drainase tersumbat',
        documentCode: '600 / ENV-DRN / PNK',
        officialHeaderTitle: 'LAPORAN PENANGANAN DRAINASE & SALURAN AIR TERSUMBAT',
        processingUnit: 'Satgas Kebersihan & Drainase Kelurahan Panaikang',
        requirements: [
          'Titik patokan lokasi jalan/lorong & RT/RW',
          'Foto kondisi saluran drainase tersumbat sedimen/sampah',
        ],
        sopSteps: [
          'Laporkan titik saluran drainase yang tersumbat beserta foto lapangan',
          'Penerjunan Satgas Kebersihan Kelurahan / koordinasi kerja bakti pengerukan sedimen',
          'Dokumentasi bukti pengerukan & pembaruan status selesai di portal',
        ],
        estimation: 'Respon Cepat Satgas < 6 Jam Kerja',
        reportCategory: 'Drainase & Genangan',
        defaultUrgency: 'Tinggi',
        placeholderNote:
          'Contoh: Saluran drainase di depan lorong tersumbat lumpur dan sampah plastik sehingga air meluap ke jalan...',
        isEnvironmental: true,
        specificFields: [
          {
            key: 'kondisiSaluran',
            label: 'Kondisi Penyumbatan Drainase',
            placeholder: 'Pilih kondisi saluran',
            type: 'select',
            options: [
              'Tersumbat Endapan Lumpur / Sedimen Tebal',
              'Tersumbat Tumpukan Sampah Plastik / Rumah Tangga',
              'Dinding / Penutup Plat Drainase Ambles',
              'Air Meluap ke Badan Jalan Saat Hujan',
            ],
          },
          {
            key: 'panjangPerkiraan',
            label: 'Patokan Titik Lokasi & Perkiraan Panjang Saluran',
            placeholder: 'Contoh: Depan Lorong 2 RW 03 sepanjang ±15 meter',
          },
        ],
      },
      {
        id: 'lingkungan-sampah',
        label: 'Sampah menumpuk',
        documentCode: '660 / ENV-SMP / PNK',
        officialHeaderTitle: 'LAPORAN PENGANGKUTAN TUMPUKAN SAMPAH & TPS LIAR',
        processingUnit: 'Armada Kebersihan Tiga Roda (Fukuda) & Bank Sampah Kelurahan',
        requirements: [
          'Titik lokasi tumpukan sampah & RT/RW',
          'Foto kondisi tumpukan sampah di lapangan',
        ],
        sopSteps: [
          'Kirimkan titik lokasi tumpukan sampah dan unggah foto kondisi lapangan',
          'Penugasan armada motor sampah kelurahan / petugas kebersihan RW',
          'Pengangkutan tuntas dan unggah foto bukti sesudah dibersihkan',
        ],
        estimation: 'Respon Armada Kebersihan < 6 Jam Kerja',
        reportCategory: 'Sampah Liar & TPS',
        defaultUrgency: 'Tinggi',
        placeholderNote:
          'Contoh: Tumpukan sampah rumah tangga belum terangkut di sudut jalan / muncul titik sampah liar...',
        isEnvironmental: true,
        specificFields: [
          {
            key: 'jenisTumpukanSampah',
            label: 'Jenis & Volume Tumpukan Sampah',
            placeholder: 'Pilih jenis sampah',
            type: 'select',
            options: [
              'Sampah Rumah Tangga Belum Terangkut Armada',
              'Tumpukan Sampah Liar di Pinggir Jalan / Kanal',
              'Sampah Pemangkasan Pohon / Material Kebun',
              'Volume Besar (Butuh Armada Truk / Fukuda Segera)',
            ],
          },
          {
            key: 'waktuTerlihat',
            label: 'Sejak Kapan Menumpuk & Patokan Lokasi',
            placeholder: 'Contoh: Sejak kemarin sore di dekat tikungan Jl. Sukaria',
          },
        ],
      },
      {
        id: 'lingkungan-jalan-rusak',
        label: 'Jalan rusak',
        documentCode: '620 / ENV-JLN / PNK',
        officialHeaderTitle: 'LAPORAN KERUSAKAN JALAN LINGKUNGAN / PAVING BLOK LORONG',
        processingUnit: 'Seksi Pemerintahan & Pembangunan (Koordinasi Dinas PU)',
        requirements: [
          'Nama jalan/lorong & titik RT/RW',
          'Foto kondisi jalan berlubang / paving blok rusak',
        ],
        sopSteps: [
          'Laporkan titik jalan berlubang atau paving lorong yang rusak disertai foto',
          'Survei pengukuran lapangan oleh petugas kelurahan bersama Ketua RT/RW',
          'Tindak lanjut perbaikan darurat / pengusulan ke Dinas PU Kota Makassar',
        ],
        estimation: 'Verifikasi Lapangan & Usulan Dinas PU',
        reportCategory: 'Ketertiban & Fasum',
        defaultUrgency: 'Normal',
        placeholderNote:
          'Contoh: Kondisi aspal berlubang cukup dalam / paving lorong ambles yang membahayakan pengendara motor...',
        isEnvironmental: true,
        specificFields: [
          {
            key: 'jenisKerusakanJalan',
            label: 'Jenis Permukaan & Kerusakan Jalan',
            placeholder: 'Pilih jenis kerusakan',
            type: 'select',
            options: [
              'Jalan Aspal Berlubang / Mengelupas',
              'Paving Blok Lorong Ambles / Rusak',
              'Bahu Jalan / Pinggir Kanal Retak',
              'Penutup Bak Kontrol di Tengah Jalan Pecah',
            ],
          },
          {
            key: 'dimensiKerusakan',
            label: 'Perkiraan Luas / Kedalaman Kerusakan',
            placeholder: 'Contoh: Lubang diameter ±1 meter, membahayakan saat malam hari',
          },
        ],
      },
      {
        id: 'lingkungan-lampu-jalan',
        label: 'Lampu jalan mati',
        documentCode: '671 / ENV-PJU / PNK',
        officialHeaderTitle: 'LAPORAN LAMPU PENERANGAN JALAN UMUM (PJU) PADAM',
        processingUnit: 'Seksi Trantib & Koordinasi UPT Lampu Jalan (PJU)',
        requirements: [
          'Titik tiang lampu jalan (PJU) / lorong & RT/RW',
          'Foto kondisi lokasi pada malam atau siang hari',
        ],
        sopSteps: [
          'Cantumkan lokasi tiang lampu jalan yang padam dan jumlah titik lampu',
          'Pencatatan dan penerusan tiket ke Satgas PJU Kota Makassar',
          'Perbaikan bola lampu / jaringan kabel PJU hingga kembali menyala',
        ],
        estimation: 'Koordinasi Satgas PJU Kota Makassar',
        reportCategory: 'Ketertiban & Fasum',
        defaultUrgency: 'Normal',
        placeholderNote:
          'Contoh: Lampu penerangan jalan umum (PJU) di pertigaan lorong padam total sejak 3 hari lalu sehingga lorong gelap...',
        isEnvironmental: true,
        specificFields: [
          {
            key: 'jumlahTitikLampu',
            label: 'Jumlah Titik Lampu Padam & Kondisi Tiang',
            placeholder: 'Contoh: 2 Titik lampu lorong padam total / kabel kendor',
          },
          {
            key: 'nomorTiangPatokan',
            label: 'Patokan Rumah / Simpang Jalan Terdekat',
            placeholder: 'Contoh: Tiang PJU depan Masjid / Pertigaan Lorong 4 RW 05',
          },
        ],
      },
      {
        id: 'lingkungan-pohon',
        label: 'Pohon berbahaya',
        documentCode: '660 / ENV-PHN / PNK',
        officialHeaderTitle: 'LAPORAN POHON RAWAN TUMBANG / PEMANGKASAN DAHAN',
        processingUnit: 'Satgas Kebersihan & Koordinasi Dinas Lingkungan Hidup (DLH)',
        requirements: [
          'Titik lokasi pohon miring/dahan rapuh & RT/RW',
          'Foto kondisi pohon yang membahayakan kabel/jalan/rumah',
        ],
        sopSteps: [
          'Laporkan lokasi pohon miring atau dahan rimbun yang menyentuh kabel/atap warga',
          'Peninjauan tingkat bahaya oleh petugas Trantib & Satgas Kelurahan',
          'Eksekusi pemangkasan bersama tim DLH Kota Makassar',
        ],
        estimation: 'Penanganan Prioritas Satgas Pemangkasan',
        reportCategory: 'Pohon & Ruang Hijau',
        defaultUrgency: 'Tinggi',
        placeholderNote:
          'Contoh: Dahan pohon besar miring ke arah badan jalan dan menyentuh jaringan kabel listrik...',
        isEnvironmental: true,
        specificFields: [
          {
            key: 'kondisiPohon',
            label: 'Kondisi Pohon di Lapangan',
            placeholder: 'Pilih kondisi pohon',
            type: 'select',
            options: [
              'Dahan Rimbun Menyentuh Kabel Listrik / Telkom',
              'Batang Pohon Miring / Akar Terangkat (Rawan Tumbang)',
              'Pohon Tumbang Menutup Akses Jalan',
              'Dahan Pohon Rapuh di Atas Atap Rumah Warga',
            ],
          },
          {
            key: 'jenisDanTinggiPohon',
            label: 'Jenis / Perkiraan Tinggi Pohon & Patokan Lokasi',
            placeholder: 'Contoh: Pohon Trambesi tinggi ±8 meter di pinggir jalan RW 01',
          },
        ],
      },
      {
        id: 'lingkungan-fasum',
        label: 'Gangguan fasilitas umum',
        documentCode: '640 / ENV-FSM / PNK',
        officialHeaderTitle: 'LAPORAN KERUSAKAN / GANGGUAN FASILITAS UMUM WARGA',
        processingUnit: 'Seksi Trantib & Pemerintahan Kelurahan Panaikang',
        requirements: [
          'Nama fasilitas umum & titik lokasi RT/RW',
          'Foto kondisi kerusakan atau gangguan fasilitas umum',
        ],
        sopSteps: [
          'Isi nama fasilitas umum yang mengalami kerusakan atau penyalahgunaan',
          'Pengecekan lapangan oleh petugas Trantib Kelurahan bersama Ketua RW',
          'Perbaikan / penertiban fasilitas umum agar kembali berfungsi baik',
        ],
        estimation: '1 Hari Kerja (Tindak Lanjut Trantib & Satgas)',
        reportCategory: 'Ketertiban & Fasum',
        defaultUrgency: 'Normal',
        placeholderNote:
          'Contoh: Penutup bak kontrol jembatan/trotoar rusak atau fasilitas posyandu/taman warga terganggu...',
        isEnvironmental: true,
        specificFields: [
          {
            key: 'namaFasum',
            label: 'Jenis Fasilitas Umum yang Dilaporkan',
            placeholder: 'Contoh: Jembatan Penyeberangan / Trotoar / Poskamling / Taman RW',
          },
          {
            key: 'bentukGangguanFasum',
            label: 'Bentuk Kerusakan / Gangguan',
            placeholder: 'Contoh: Pagar pengaman jembatan keropos dan membahayakan pejalan kaki',
          },
        ],
      },
      {
        id: 'lingkungan-keamanan',
        label: 'Masalah keamanan lingkungan',
        documentCode: '300 / ENV-KMN / PNK',
        officialHeaderTitle: 'LAPORAN KEAMANAN & KETENTERAMAN LINGKUNGAN (TIGA PILAR)',
        processingUnit: 'Tiga Pilar Kelurahan (Lurah, Bhabinkamtibmas, Babinsa) & Linmas',
        requirements: [
          'Lokasi titik rawan RT/RW',
          'Kronologi singkat gangguan keamanan/ketenteraman warga',
        ],
        sopSteps: [
          'Sampaikan titik lokasi rawan keamanan atau gangguan kamtibmas secara jelas',
          'Koordinasi langsung Lurah bersama Bhabinkamtibmas, Babinsa, dan Ketua RT/RW',
          'Patroli gabungan & penindakan preventif di lokasi laporan',
        ],
        estimation: 'Koordinasi Bhabinkamtibmas, Babinsa & Linmas',
        reportCategory: 'Ketertiban & Fasum',
        defaultUrgency: 'Tinggi',
        placeholderNote:
          'Contoh: Laporan kerawanan keamanan malam hari di ujung lorong untuk peningkatan patroli siskamling...',
        isEnvironmental: true,
        specificFields: [
          {
            key: 'jenisGangguanKeamanan',
            label: 'Kategori Masalah Keamanan Lingkungan',
            placeholder: 'Pilih kategori keamanan',
            type: 'select',
            options: [
              'Titik Rawan Tindak Kriminalitas / Pencurian',
              'Kumpul Larut Malam yang Meresahkan Warga',
              'Balap Liar / Knalpot Bising di Jalan Lingkungan',
              'Permohonan Patroli Rutin Bhabinkamtibmas & Babinsa',
            ],
          },
          {
            key: 'jamRawanKejadian',
            label: 'Waktu / Jam Rawan Kejadian',
            placeholder: 'Contoh: Sekitar pukul 23.30 – 03.00 WITA di akses perbatasan RW',
          },
        ],
      },
      {
        id: 'lingkungan-banjir',
        label: 'Laporan warga terkait banjir',
        documentCode: '360 / ENV-BJR / PNK',
        officialHeaderTitle: 'LAPORAN DARURAT GENANGAN AIR & BANJIR WILAYAH',
        processingUnit: 'Posko Siaga Bencana & Banjir Kelurahan Panaikang',
        requirements: [
          'Titik genangan/banjir & perkiraan ketinggian air (cm)',
          'Jumlah rumah/KK terdampak di RT/RW',
          'Foto kondisi genangan air saat ini',
        ],
        sopSteps: [
          'Kirimkan laporan titik banjir, tinggi muka air, dan kebutuhan mendesak warga',
          'Aktivasi respon cepat Posko Siaga Kelurahan, Satgas Drainase & BPBD',
          'Penanganan pembersihan saluran, pemompaan/evakuasi, dan pemantauan surut',
        ],
        estimation: 'Penanganan Darurat Posko Siaga Banjir Kelurahan',
        reportCategory: 'Drainase & Genangan',
        defaultUrgency: 'Darurat',
        placeholderNote:
          'Contoh: Genangan air setinggi 35 cm merendam badan jalan dan halaman warga akibat hujan deras & luapan saluran...',
        isEnvironmental: true,
        specificFields: [
          {
            key: 'tinggiAirBanjir',
            label: 'Ketinggian Genangan Air & Status Arus',
            placeholder: 'Pilih ketinggian genangan',
            type: 'select',
            options: [
              'Genangan Jalan (10 – 25 cm / Semata Kaki)',
              'Genangan Masuk Halaman / Teras (25 – 50 cm / Selutut)',
              'Banjir Masuk ke Dalam Rumah Warga (> 50 cm)',
              'Luapan Kanal / Drainase Utama Deras',
            ],
          },
          {
            key: 'jumlahKkTerdampak',
            label: 'Perkiraan Jumlah Rumah / KK Terdampak & Kebutuhan Mendesak',
            placeholder: 'Contoh: ±12 Rumah terdampak di RT 03 — Butuh pembersihan pintu air',
          },
        ],
      },
    ],
  },
  {
    id: 'bantuan_sosial',
    number: '05',
    title: 'Bantuan Sosial',
    subtitle:
      'Informasi & pendataan penerima bantuan, pengaduan bansos, pendataan warga kurang mampu, rekomendasi bantuan & program pemerintah.',
    iconName: 'HeartHandshake',
    accentBg: 'bg-rose-50/70',
    accentText: 'text-rose-800',
    accentBorder: 'border-rose-200',
    iconBg: 'bg-rose-600 text-white',
    linkedMainMenu: 'bantuan_sosial',
    items: [
      {
        id: 'bansos-info-pendataan',
        label: 'Informasi dan pendataan penerima bantuan',
        documentCode: '460 / SOS-DTKS / PNK',
        officialHeaderTitle: 'PERMOHONAN PENGECEKAN & PENDATAAN PENERIMA BANTUAN (DTKS)',
        processingUnit: 'Seksi Kesejahteraan Rakyat (Kesra) & Operator SIKS-NG',
        requirements: [
          'Fotokopi KTP & Kartu Keluarga (KK) warga Kelurahan Panaikang',
          'Pengantar RT/RW setempat',
          'Nomor telepon/WhatsApp aktif untuk konfirmasi hasil verifikasi',
        ],
        sopSteps: [
          'Masukkan NIK, nomor KK, dan jenis program bantuan yang ingin dicek/didata',
          'Pengecekan status kepesertaan pada sistem SIKS-NG / DTKS oleh operator kelurahan',
          'Informasi hasil pengecekan & jadwal musyawarah kelurahan (Muskel)',
        ],
        estimation: 'Verifikasi Operator DTKS Kelurahan',
        reportCategory: 'Ketertiban & Fasum',
        defaultUrgency: 'Normal',
        placeholderNote:
          'Contoh: Permohonan pengecekan status DTKS dan pengajuan pendataan calon penerima bantuan sosial kelurahan...',
        specificFields: [
          {
            key: 'programBansosTerkait',
            label: 'Jenis Program Bantuan yang Ditanyakan / Diajukan',
            placeholder: 'Pilih program bantuan',
            type: 'select',
            options: [
              'Pendaftaran / Pengecekan Status DTKS Kemensos',
              'Program Keluarga Harapan (PKH) / Sembako (BPNT)',
              'Bantuan Pangan Cadangan Beras Pemerintah (CBP)',
              'Penerima Bantuan Iuran JKN-KIS (BPJS Kesehatan Gratis)',
            ],
          },
          {
            key: 'kondisiKeluarga',
            label: 'Pekerjaan & Kondisi Ekonomi Keluarga Saat Ini',
            placeholder: 'Contoh: Pekerja harian lepas, memiliki 3 anak usia sekolah',
          },
        ],
      },
      {
        id: 'bansos-pengaduan',
        label: 'Pengaduan terkait bantuan sosial',
        documentCode: '460 / SOS-ADUAN / PNK',
        officialHeaderTitle: 'FORMULIR PENGADUAN & KLARIFIKASI PENYALURAN BANTUAN SOSIAL',
        processingUnit: 'Seksi Kesejahteraan Rakyat (Kesra) & Pendamping Sosial',
        requirements: [
          'Identitas pelapor (KTP & KK)',
          'Rincian kendala penyaluran atau ketidaksesuaian data penerima bantuan',
        ],
        sopSteps: [
          'Uraikan kendala bantuan sosial yang dialami (kartu KKS terblokir, saldo kosong, atau evaluasi ketepatan sasaran)',
          'Verifikasi silang oleh Kasi Kesra bersama Pendamping PKH/TKSK dan Ketua RT/RW',
          'Tindak lanjut perbaikan data atau fasilitasi ke Dinas Sosial Kota Makassar',
        ],
        estimation: '1–2 Hari Kerja (Verifikasi Kasi Kesra)',
        reportCategory: 'Ketertiban & Fasum',
        defaultUrgency: 'Tinggi',
        placeholderNote:
          'Contoh: Pengaduan kartu KKS tidak aktif / bantuan tiba-tiba terhenti padahal kondisi keluarga masih kurang mampu...',
        specificFields: [
          {
            key: 'jenisKendalaBansos',
            label: 'Jenis Kendala / Pengaduan Bantuan Sosial',
            placeholder: 'Pilih jenis kendala',
            type: 'select',
            options: [
              'Bantuan Terhenti / Nama Tidak Muncul di Daftar Salur',
              'Kendala Kartu KKS / Buku Tabungan / Undangan Pos',
              'Laporan Ketidaktepatan Sasaran Penerima (Warga Mampu/Pindah)',
              'Perubahan Pengurus / KPM Meninggal Dunia',
            ],
          },
          {
            key: 'riwayatPenerimaan',
            label: 'Riwayat Penerimaan Sebelumnya',
            placeholder: 'Contoh: Terakhir menerima bantuan tahap 1 bulan Maret 2026',
          },
        ],
      },
      {
        id: 'bansos-warga-kurang-mampu',
        label: 'Pendataan warga kurang mampu',
        documentCode: '460 / SOS-PRM / PNK',
        officialHeaderTitle: 'USULAN PENDATAAN KELUARGA PRASEJAHTERA / WARGA RENTAN',
        processingUnit: 'Seksi Kesejahteraan Rakyat (Kesra) Kelurahan Panaikang',
        requirements: [
          'Pengantar RT/RW setempat',
          'Fotokopi KTP & Kartu Keluarga (KK)',
          'Foto kondisi tempat tinggal tampak depan dan ruang dalam',
        ],
        sopSteps: [
          'Isi data warga kurang mampu/lansia/disabilitas yang diusulkan masuk basis data prioritas',
          'Kunjungan verifikasi rumah (home visit) oleh petugas Kesra & Ketua RT/RW',
          'Pengesahan dalam berita acara Musyawarah Kelurahan (Muskel)',
        ],
        estimation: 'Survei & Musyawarah Kelurahan (Muskel)',
        reportCategory: 'Ketertiban & Fasum',
        defaultUrgency: 'Tinggi',
        placeholderNote:
          'Contoh: Usulan pendataan keluarga prasejahtera / lansia sebatang kara di wilayah RT/RW agar mendapat perhatian bantuan...',
        specificFields: [
          {
            key: 'kategoriKerentanan',
            label: 'Kategori Kerentanan Sosial Warga',
            placeholder: 'Pilih kategori kerentanan',
            type: 'select',
            options: [
              'Keluarga Berpenghasilan Sangat Rendah / Prasejahtera',
              'Lansia Sebatang Kara / Tanpa Penghasilan Tetap',
              'Penyandang Disabilitas / Sakit Menahun',
              'Ibu Kepala Keluarga (Janda Kurang Mampu) dengan Anak Sekolah',
            ],
          },
          {
            key: 'kondisiHunian',
            label: 'Kondisi Tempat Tinggal & Penghasilan Bulanan',
            placeholder: 'Contoh: Menumpang / kontrakan petak sempit, penghasilan tidak menentu',
          },
        ],
      },
      {
        id: 'bansos-rekomendasi',
        label: 'Pengajuan/rekomendasi bantuan tertentu',
        documentCode: '460 / SOS-REK / PNK',
        officialHeaderTitle: 'SURAT REKOMENDASI BANTUAN KHUSUS KELURAHAN PANAIKANG',
        processingUnit: 'Seksi Kesejahteraan Rakyat (Kesra) Kelurahan',
        requirements: [
          'Pengantar RT/RW setempat',
          'Fotokopi KTP & Kartu Keluarga (KK)',
          'Dokumen pendukung (Surat Rujukan RS / Sekolah / Proposal Permohonan)',
        ],
        sopSteps: [
          'Isi jenis bantuan tertentu yang diajukan beserta lembaga tujuan rekomendasi',
          'Pemeriksaan kelengkapan berkas oleh Kasi Kesra',
          'Penerbitan Surat Rekomendasi Bantuan yang ditandatangani Lurah Panaikang',
        ],
        estimation: '1 Hari Kerja',
        reportCategory: 'Ketertiban & Fasum',
        defaultUrgency: 'Tinggi',
        placeholderNote:
          'Contoh: Pengajuan surat rekomendasi kelurahan untuk bantuan alat bantu dengar / kursi roda / reaktivasi BPJS PBI...',
        specificFields: [
          {
            key: 'jenisRekomendasiBantuan',
            label: 'Jenis Rekomendasi Bantuan yang Diajukan',
            placeholder: 'Contoh: Rekomendasi Aktifkan BPJS PBI / Bantuan Alat Bantu Disabilitas',
          },
          {
            key: 'instansiTujuanRekomendasi',
            label: 'Instansi / Lembaga Tujuan Surat Rekomendasi',
            placeholder: 'Contoh: Dinas Sosial Kota Makassar / BAZNAS / Dinas Kesehatan',
          },
        ],
      },
      {
        id: 'bansos-program-pemerintah',
        label: 'Informasi program pemerintah',
        documentCode: '460 / SOS-INFO / PNK',
        officialHeaderTitle: 'LAYANAN INFORMASI PROGRAM KESEJAHTERAAN PEMERINTAH',
        processingUnit: 'Seksi Kesejahteraan Rakyat & Pelayanan Publik',
        requirements: [
          'Identitas warga (KTP/KK Kelurahan Panaikang)',
          'Jenis informasi program pemerintah yang ditanyakan',
        ],
        sopSteps: [
          'Pilih jenis program pemerintah yang ingin ditanyakan syarat atau jadwalnya',
          'Penjelasan prosedur resmi dan jadwal tahapan oleh petugas Kesra',
          'Notifikasi tindak lanjut dikirimkan melalui sistem & WhatsApp',
        ],
        estimation: 'Respon Hari yang Sama',
        reportCategory: 'Ketertiban & Fasum',
        defaultUrgency: 'Normal',
        placeholderNote:
          'Contoh: Permohonan informasi jadwal penyaluran beras pemerintah, posyandu lansia, atau program beasiswa anak...',
        specificFields: [
          {
            key: 'namaProgramPemerintah',
            label: 'Program Pemerintah yang Ingin Ditanyakan',
            placeholder: 'Contoh: Jadwal Penyaluran Beras CBP / Program Pencegahan Stunting / KIP',
          },
          {
            key: 'pertanyaanSpesifik',
            label: 'Pertanyaan / Hal yang Ingin Dikonfirmasi',
            placeholder: 'Contoh: Persyaratan berkas pengambilan bantuan di Aula Kelurahan',
          },
        ],
      },
    ],
  },
  {
    id: 'sosial_kemasyarakatan',
    number: '06',
    title: 'Sosial Kemasyarakatan',
    subtitle:
      'Pengantar kegiatan masyarakat, rekomendasi acara warga, penggunaan fasum, surat pengantar organisasi & pelaporan kegiatan RT/RW.',
    iconName: 'Users',
    accentBg: 'bg-purple-50/70',
    accentText: 'text-purple-800',
    accentBorder: 'border-purple-200',
    iconBg: 'bg-purple-700 text-white',
    linkedMainMenu: 'info_kegiatan',
    items: [
      {
        id: 'sosmas-pengantar-kegiatan',
        label: 'Pengantar kegiatan masyarakat',
        documentCode: '400 / SOSMAS-KGT / PNK',
        officialHeaderTitle: 'SURAT PENGANTAR KEGIATAN KEMASYARAKATAN WARGA',
        processingUnit: 'Seksi Kesejahteraan Rakyat & Trantib Kelurahan',
        requirements: [
          'Surat pemberitahuan dari panitia pelaksana / Ketua RT/RW',
          'Rincian tanggal, waktu, lokasi, dan penanggung jawab kegiatan',
        ],
        sopSteps: [
          'Isi nama kegiatan masyarakat, jadwal pelaksanaan, dan penanggung jawab',
          'Koordinasi pemberitahuan kegiatan dengan Kasi Trantib & Tiga Pilar',
          'Penerbitan Surat Pengantar Kegiatan Masyarakat Kelurahan Panaikang',
        ],
        estimation: '1 Hari Kerja',
        reportCategory: 'Ketertiban & Fasum',
        defaultUrgency: 'Normal',
        placeholderNote:
          'Contoh: Permohonan surat pengantar kegiatan kerja bakti lingkungan / pengajian akbar / lomba warga tingkat RW...',
        specificFields: [
          {
            key: 'namaKegiatanWarga',
            label: 'Nama Kegiatan Masyarakat',
            placeholder: 'Contoh: Peringatan Maulid Nabi / Lomba Kebersihan Lorong RW 02',
          },
          {
            key: 'jadwalDanEstimasiPeserta',
            label: 'Hari/Tanggal, Waktu & Perkiraan Jumlah Peserta',
            placeholder: 'Contoh: Minggu, 18 Oktober 2026 Pukul 08.00 WITA — ±100 Warga',
          },
        ],
      },
      {
        id: 'sosmas-rekomendasi-acara',
        label: 'Rekomendasi kegiatan/acara warga',
        documentCode: '300 / SOSMAS-REK / PNK',
        officialHeaderTitle: 'SURAT REKOMENDASI PENYELENGGARAAN ACARA / HAJATAN WARGA',
        processingUnit: 'Seksi Pemerintahan & Trantib Kelurahan Panaikang',
        requirements: [
          'Pengantar RT/RW setempat',
          'Fotokopi KTP penanggung jawab acara / tuan rumah',
          'Jadwal, lokasi acara, serta komitmen menjaga ketertiban & kelancaran jalan',
        ],
        sopSteps: [
          'Input jenis acara/hajatan warga, waktu pelaksanaan, dan pengaturan akses jalan',
          'Pemeriksaan pengantar RT/RW dan ketertiban umum oleh Kasi Trantib',
          'Penerbitan Surat Rekomendasi Acara Warga (untuk pengantar Polsek jika diperlukan)',
        ],
        estimation: '1 Hari Kerja',
        reportCategory: 'Ketertiban & Fasum',
        defaultUrgency: 'Normal',
        placeholderNote:
          'Contoh: Permohonan surat rekomendasi acara resepsi pernikahan / syukuran aqiqah warga untuk izin keramaian...',
        specificFields: [
          {
            key: 'jenisHajatanAcara',
            label: 'Jenis Acara / Hajatan Warga',
            placeholder: 'Contoh: Resepsi Pernikahan / Syukuran Rumah / Aqiqah',
          },
          {
            key: 'tanggalDanPenggunaanJalan',
            label: 'Tanggal Acara & Keterangan Penggunaan Tenda/Jalan',
            placeholder: 'Contoh: Sabtu, 17 Okt 2026 — Menggunakan sebagian bahu lorong dengan jalur alternatif',
          },
        ],
      },
      {
        id: 'sosmas-penggunaan-fasum',
        label: 'Permohonan penggunaan fasilitas umum',
        documentCode: '030 / SOSMAS-FSM / PNK',
        officialHeaderTitle: 'SURAT IZIN PENGGUNAAN FASILITAS UMUM KELURAHAN',
        processingUnit: 'Sekretariat & Seksi Pemerintahan Kelurahan Panaikang',
        requirements: [
          'Surat permohonan dari panitia / pengurus RT/RW',
          'Nama fasilitas umum, tanggal/jam pemakaian & komitmen kebersihan pasca-acara',
        ],
        sopSteps: [
          'Pilih fasilitas umum yang diajukan beserta tanggal dan durasi pemakaian',
          'Pengecekan ketersediaan jadwal oleh Sekretariat Kelurahan',
          'Persetujuan izin pemakaian fasilitas umum dengan komitmen menjaga kebersihan',
        ],
        estimation: '1 Hari Kerja',
        reportCategory: 'Ketertiban & Fasum',
        defaultUrgency: 'Normal',
        placeholderNote:
          'Contoh: Permohonan izin penggunaan aula kelurahan / lapangan warga untuk rapat koordinasi RT/RW atau penyuluhan...',
        specificFields: [
          {
            key: 'fasilitasYangDipinjam',
            label: 'Nama Fasilitas Umum yang Diajukan',
            placeholder: 'Contoh: Aula Kantor Kelurahan Panaikang / Pelataran Posyandu RW',
          },
          {
            key: 'waktuPemakaianFasum',
            label: 'Tanggal, Jam Pemakaian & Nama Kegiatan',
            placeholder: 'Contoh: Jumat, 16 Oktober 2026 (09.00 – 11.30 WITA) — Rapat Warga',
          },
        ],
      },
      {
        id: 'sosmas-organisasi',
        label: 'Surat pengantar untuk organisasi/kelompok masyarakat',
        documentCode: '220 / SOSMAS-ORG / PNK',
        officialHeaderTitle: 'SURAT KETERANGAN KEBERADAAN ORGANISASI / KELOMPOK MASYARAKAT',
        processingUnit: 'Seksi Pemberdayaan Masyarakat & Kesra',
        requirements: [
          'Susunan pengurus organisasi / kelompok masyarakat (SK/Berita Acara)',
          'Pengantar RT/RW lokasi sekretariat kelompok',
          'Fotokopi KTP Ketua & Sekretaris kelompok',
        ],
        sopSteps: [
          'Isi nama organisasi/kelompok masyarakat, susunan pengurus inti, dan alamat sekretariat',
          'Verifikasi aktivitas kelompok masyarakat oleh Kasi Pemberdayaan',
          'Penerbitan Surat Pengantar / Keterangan Domisili Kelompok Masyarakat',
        ],
        estimation: '1–2 Hari Kerja',
        reportCategory: 'Ketertiban & Fasum',
        defaultUrgency: 'Normal',
        placeholderNote:
          'Contoh: Permohonan surat pengantar bagi kelompok Majelis Taklim, Karang Taruna unit RW, atau Kelompok Bank Sampah...',
        specificFields: [
          {
            key: 'namaOrganisasiKelompok',
            label: 'Nama Organisasi / Kelompok Masyarakat',
            placeholder: 'Contoh: Kelompok Wanita Tani / Majelis Taklim Nurul Iman RW 04',
          },
          {
            key: 'ketuaDanJumlahAnggota',
            label: 'Nama Ketua Kelompok & Jumlah Anggota Aktif',
            placeholder: 'Contoh: Ketua: Hj. Rosmawati — 35 Anggota Aktif',
          },
        ],
      },
      {
        id: 'sosmas-kegiatan-rtrw',
        label: 'Pelaporan atau pendataan kegiatan RT/RW',
        documentCode: '148 / SOSMAS-RTRW / PNK',
        officialHeaderTitle: 'LAPORAN & PENDATAAN KEGIATAN KEMASYARAKATAN RT/RW',
        processingUnit: 'Seksi Pemerintahan & Pemberdayaan Masyarakat',
        requirements: [
          'Identitas Pengurus RT/RW atau Koordinator Kegiatan',
          'Nama kegiatan, jumlah warga hadir, lokasi, dan foto dokumentasi kegiatan',
        ],
        sopSteps: [
          'Input laporan kegiatan RT/RW (Sabtu Bersih, Posyandu, Rapat Warga, Siskamling) beserta foto',
          'Pencatatan ke dalam rekapitulasi keaktifan RT/RW Kelurahan Panaikang',
          'Publikasi dan arsip resmi kegiatan kemasyarakatan kelurahan',
        ],
        estimation: 'Tercatat Langsung di Portal Kelurahan',
        reportCategory: 'Ketertiban & Fasum',
        defaultUrgency: 'Normal',
        placeholderNote:
          'Contoh: Pelaporan pelaksanaan kerja bakti Sabtu Bersih / pelayanan Posyandu Balita di wilayah RT 02 / RW 05...',
        specificFields: [
          {
            key: 'kategoriKegiatanRtRw',
            label: 'Kategori Kegiatan RT/RW',
            placeholder: 'Pilih kategori kegiatan',
            type: 'select',
            options: [
              'Kerja Bakti / Sabtu Bersih Lingkungan RT/RW',
              'Pelayanan Posyandu Balita & Lansia',
              'Musyawarah Warga / Rapat Koordinasi RT/RW',
              'Ronda Malam / Siskamling Warga',
              'Kegiatan Sosial & Keagamaan Tingkat RT/RW',
            ],
          },
          {
            key: 'jumlahPartisipanWarga',
            label: 'Tanggal Pelaksanaan & Jumlah Partisipan Warga',
            placeholder: 'Contoh: Sabtu, 10 Oktober 2026 — Diikuti 42 Warga RT 01 & RT 02',
          },
        ],
      },
    ],
  },
  {
    id: 'pengaduan_permasalahan_warga',
    number: '07',
    title: 'Pengaduan & Permasalahan Warga',
    subtitle:
      'Penanganan konflik antarwarga, permasalahan batas tanah/lingkungan, gangguan ketertiban, pelayanan publik & mediasi RT/RW.',
    iconName: 'Siren',
    accentBg: 'bg-orange-50/70',
    accentText: 'text-orange-800',
    accentBorder: 'border-orange-200',
    iconBg: 'bg-orange-600 text-white',
    linkedMainMenu: 'pengaduan_warga',
    items: [
      {
        id: 'aduan-konflik-warga',
        label: 'Konflik antarwarga',
        documentCode: '300 / ADU-KFL / PNK',
        officialHeaderTitle: 'PENGADUAN PENANGANAN PERMASALAHAN / KONFLIK ANTARWARGA',
        processingUnit: 'Forum Tiga Pilar Kelurahan (Lurah, Bhabinkamtibmas, Babinsa)',
        requirements: [
          'Identitas pelapor (kerahasiaan data pelapor dijamin sepenuhnya)',
          'Lokasi RT/RW & kronologi singkat permasalahan yang perlu ditengahi',
        ],
        sopSteps: [
          'Sampaikan pokok permasalahan secara objektif (data pelapor bersifat rahasia internal)',
          'Koordinasi penyejukan situasi oleh Ketua RT/RW bersama Bhabinkamtibmas & Babinsa',
          'Fasilitasi penyelesaian kekeluargaan / musyawarah mufakat di tingkat kelurahan',
        ],
        estimation: 'Penanganan Mediasi Lurah, Tiga Pilar & RT/RW',
        reportCategory: 'Ketertiban & Fasum',
        defaultUrgency: 'Tinggi',
        placeholderNote:
          'Contoh: Permohonan penengahan permasalahan kesalahpahaman antarwarga di lingkungan RT/RW secara kekeluargaan...',
        specificFields: [
          {
            key: 'pokokPermasalahan',
            label: 'Pokok Permasalahan Antarwarga',
            placeholder: 'Contoh: Kesalahpahaman saluran pembuangan air / parkir kendaraan di lorong',
          },
          {
            key: 'harapanPenyelesaian',
            label: 'Harapan Penanganan dari Pihak Kelurahan / RT/RW',
            placeholder: 'Contoh: Pendampingan Ketua RW dan Bhabinkamtibmas untuk musyawarah bersama',
          },
        ],
      },
      {
        id: 'aduan-batas-tanah',
        label: 'Permasalahan batas tanah/lingkungan',
        documentCode: '590 / ADU-BTS / PNK',
        officialHeaderTitle: 'PERMOHONAN PENINJAUAN & KLARIFIKASI BATAS TANAH / LINGKUNGAN',
        processingUnit: 'Seksi Pemerintahan Kelurahan Panaikang & Ketua RT/RW',
        requirements: [
          'Pengantar RT/RW setempat',
          'Fotokopi KTP & bukti kepemilikan/alas hak/SPPT PBB',
          'Kronologi titik batas tanah, pagar, atau lorong yang dipermasalahkan',
        ],
        sopSteps: [
          'Isi lokasi objek batas tanah/lingkungan dan dokumen alas hak yang dimiliki',
          'Penjadwalan peninjauan lapangan oleh Kasi Pemerintahan bersama Ketua RT/RW dan saksi batas',
          'Penyusunan berita acara peninjauan / mediasi batas lingkungan',
        ],
        estimation: 'Peninjauan Lapangan Kasi Pemerintahan & RT/RW',
        reportCategory: 'Ketertiban & Fasum',
        defaultUrgency: 'Normal',
        placeholderNote:
          'Contoh: Permohonan peninjauan dan klarifikasi batas pekarangan/pagar dengan akses jalan lorong umum...',
        specificFields: [
          {
            key: 'objekBatasTanah',
            label: 'Objek Batas yang Dipermasalahkan',
            placeholder: 'Pilih objek batas',
            type: 'select',
            options: [
              'Batas Kavling / Pekarangan Antar Tetangga',
              'Batas Pagar / Bangunan dengan Jalan Lorong Umum',
              'Batas Saluran Drainase / Sempadan Kanal',
              'Klarifikasi Riwayat Tanah / SPPT PBB',
            ],
          },
          {
            key: 'pihakSaksiBatas',
            label: 'Pihak Terkait / Tetangga Batas',
            placeholder: 'Contoh: Berbatasan langsung dengan lorong RT 03 / RW 04',
          },
        ],
      },
      {
        id: 'aduan-ketertiban',
        label: 'Gangguan ketertiban',
        documentCode: '300 / ADU-TRT / PNK',
        officialHeaderTitle: 'LAPORAN GANGGUAN KETERTIBAN UMUM & KENYAMANAN LINGKUNGAN',
        processingUnit: 'Seksi Ketenteraman dan Ketertiban (Trantib) Kelurahan',
        requirements: [
          'Titik lokasi RT/RW',
          'Rincian gangguan ketertiban umum & waktu kejadian',
        ],
        sopSteps: [
          'Laporkan jenis gangguan ketertiban umum beserta titik lokasi dan waktu kejadian',
          'Peninjauan dan teguran persuasif oleh Kasi Trantib bersama Linmas & RT/RW',
          'Penertiban lokasi agar kembali tertib, aman, dan nyaman bagi warga',
        ],
        estimation: 'Tindak Lanjut Cepat Trantib & Tiga Pilar',
        reportCategory: 'Ketertiban & Fasum',
        defaultUrgency: 'Tinggi',
        placeholderNote:
          'Contoh: Pengaduan kebisingan larut malam / parkir liar atau tumpukan material yang menutup akses jalan lorong warga...',
        specificFields: [
          {
            key: 'jenisGangguanKetertiban',
            label: 'Jenis Gangguan Ketertiban Umum',
            placeholder: 'Pilih jenis gangguan',
            type: 'select',
            options: [
              'Parkir Liar / Material Bangunan Menutup Jalan Lorong',
              'Kebisingan Suara / Musik Melewati Batas Jam Malam',
              'Pedagang / Bangunan Liar di Atas Drainase atau Trotoar',
              'Hewan Ternak / Peliharaan Mengganggu Lingkungan Warga',
            ],
          },
          {
            key: 'waktuDanFrekuensi',
            label: 'Waktu Kejadian & Dampak bagi Warga Sekitar',
            placeholder: 'Contoh: Setiap malam hari sehingga mobil ambulans/pemadam sulit lewat',
          },
        ],
      },
      {
        id: 'aduan-pelayanan-publik',
        label: 'Pengaduan pelayanan publik',
        documentCode: '060 / ADU-PLK / PNK',
        officialHeaderTitle: 'KOTAK PENGADUAN, SARAN & EVALUASI PELAYANAN PUBLIK KELURAHAN',
        processingUnit: 'Lurah & Sekretaris Kelurahan Panaikang',
        requirements: [
          'Identitas pelapor & nomor WhatsApp aktif',
          'Uraian saran, masukan, atau keluhan terkait layanan administrasi/petugas kelurahan',
        ],
        sopSteps: [
          'Sampaikan masukan, saran perbaikan, atau kendala pelayanan yang Anda alami di loket/lapangan',
          'Evaluasi langsung oleh Lurah dan Sekretaris Kelurahan Panaikang',
          'Tindak lanjut perbaikan mutu layanan dan konfirmasi penyelesaian kepada warga',
        ],
        estimation: 'Evaluasi Langsung Lurah & Sekretaris Kelurahan',
        reportCategory: 'Ketertiban & Fasum',
        defaultUrgency: 'Normal',
        placeholderNote:
          'Contoh: Masukan peningkatan kecepatan layanan administrasi atau fasilitas ruang tunggu ramah lansia di kantor kelurahan...',
        specificFields: [
          {
            key: 'unitLayananTerkait',
            label: 'Bidang Pelayanan yang Dinilai / Dilaporkan',
            placeholder: 'Pilih bidang pelayanan',
            type: 'select',
            options: [
              'Pelayanan Loket Administrasi & Surat-Menyurat',
              'Pelayanan Kebersihan & Pengangkutan Sampah',
              'Pelayanan Pendataan Bantuan Sosial',
              'Saran Fasilitas Kantor Kelurahan / Portal Digital',
            ],
          },
          {
            key: 'saranPerbaikan',
            label: 'Usulan / Saran Perbaikan Pelayanan',
            placeholder: 'Contoh: Penambahan kursi tunggu dan informasi persyaratan di loket depan',
          },
        ],
      },
      {
        id: 'aduan-mediasi',
        label: 'Permintaan mediasi dengan RT/RW atau pihak terkait',
        documentCode: '300 / ADU-MDS / PNK',
        officialHeaderTitle: 'PERMOHONAN FASILITASI MEDIASI WARGA BERSAMA RT/RW & TIGA PILAR',
        processingUnit: 'Rumah Mediasi / Forum Tiga Pilar Kelurahan Panaikang',
        requirements: [
          'Identitas pemohon mediasi',
          'Nama pihak terkait yang diharapkan hadir dalam mediasi',
          'Pokok permasalahan yang ingin dimediasi secara musyawarah',
        ],
        sopSteps: [
          'Isi pokok permasalahan, pihak-pihak yang ingin diundang, dan usulan waktu mediasi',
          'Penjadwalan undangan mediasi resmi oleh Kelurahan bersama Ketua RT/RW & Tiga Pilar',
          'Pelaksanaan musyawarah mediasi di Kantor Kelurahan Panaikang hingga kesepakatan bersama',
        ],
        estimation: 'Penjadwalan Ruang Mediasi Kantor Kelurahan',
        reportCategory: 'Ketertiban & Fasum',
        defaultUrgency: 'Tinggi',
        placeholderNote:
          'Contoh: Permohonan fasilitasi jadwal mediasi bersama Ketua RT/RW, Bhabinkamtibmas, dan pihak terkait di Aula Kelurahan...',
        specificFields: [
          {
            key: 'pihakYangDimediasi',
            label: 'Pihak Terkait yang Diharapkan Hadir dalam Mediasi',
            placeholder: 'Contoh: Ketua RT 02 / RW 03, Bhabinkamtibmas, dan Perwakilan Warga',
          },
          {
            key: 'usulanWaktuMediasi',
            label: 'Usulan Hari / Tanggal Pertemuan Mediasi',
            placeholder: 'Contoh: Kamis, 15 Oktober 2026 Pukul 10.00 WITA di Kantor Kelurahan',
          },
        ],
      },
    ],
  },
];
