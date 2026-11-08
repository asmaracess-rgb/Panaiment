import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  UserPlus,
  Users,
  Edit3,
  Trash2,
  Lock,
  Unlock,
  Check,
  X,
  Eye,
  EyeOff,
  Search,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Sliders,
  FileText,
  Building2,
  Newspaper,
  Recycle,
  Calendar,
  BarChart3,
  Phone,
  Sparkles,
  RefreshCw,
  Sprout,
  Activity,
  History,
  Layers,
  Mail,
  UserCheck,
  Clock,
  ShieldAlert,
} from 'lucide-react';
import {
  AdminUserAccount,
  AdminTabId,
  AdminRoleLevel,
  AdminActionPermissions,
  KelurahanProfile,
  RwGroup,
  GoogleAdminVerificationRequest,
} from '../types';
import {
  loadGoogleAdminVerificationRequests,
  saveGoogleAdminVerificationRequests,
} from '../firebase/authService';
import {
  ServiceCategoryGroup,
  OFFICIAL_13_WARGA_SERVICES,
  REPORT_COMPLAINT_CATEGORIES,
} from '../data/wargaServiceCatalog';
import { getRealtimeDateString } from '../utils/realtimeDate';
import { saveAdminUsersJournal } from '../utils/persistentStorage';

interface AdminParameterUserPanelProps {
  adminUsers: AdminUserAccount[];
  serviceCatalog: ServiceCategoryGroup[];
  currentUsername: string;
  isMasterLurah: boolean;
  profile?: KelurahanProfile;
  rwGroups?: RwGroup[];
  onSaveAdminUsers: (
    updatedUsers: AdminUserAccount[]
  ) => Promise<{ ok: boolean; errors?: string[] }>;
}

export function normalizeServiceCategoryId(catId: string): string {
  if (catId === 'adminduk') return 'administrasi_kependudukan';
  if (catId === 'pengaduan_warga') return 'pengaduan_permasalahan_warga';
  return catId;
}

export function normalizeCategoryList(categories: string[] = []): string[] {
  return Array.from(new Set(categories.map(normalizeServiceCategoryId)));
}

export const ADMIN_MODULE_OPTIONS: {
  id: AdminTabId;
  label: string;
  description: string;
  subMenus: string[];
  structuralUnit: string;
  badgeColor: string;
}[] = [
  {
    id: 'dashboard_lurah',
    label: 'Dashboard Lurah',
    description:
      'Monitoring eksekutif Lurah, persetujuan layanan, disposisi cepat laporan, grafik kinerja & cetak arsip PDF bulanan',
    subMenus: ['Ringkasan Eksekutif', 'Persetujuan Layanan', 'Disposisi Cepat', 'Cetak Arsip PDF Bulanan'],
    structuralUnit: 'Lurah Panaikang',
    badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  },
  {
    id: 'profil',
    label: 'Profil Kelurahan',
    description:
      'Data & Foto Lurah, Sekretaris, 3 Kasi & Staf (Perwali No. 65/2023), Visi-Misi, Batas Wilayah & Bagan Struktur Dinamis',
    subMenus: [
      'Data & Foto Lurah',
      'Pejabat & Staf 3 Seksi (Perwali 65/2023)',
      'Bagan Struktur Kelurahan Dinamis',
      'Visi Misi & Batas Wilayah',
    ],
    structuralUnit: 'Sekretariat Kelurahan',
    badgeColor: 'bg-indigo-50 text-indigo-800 border-indigo-200',
  },
  {
    id: 'pengurusan_warga',
    label: 'Admin Layanan Kelurahan',
    description:
      'Operasional Pelayanan Kelurahan terpadu: Pra Registrasi Online (13 Layanan Surat), Pengaduan Online (10 Kategori), Verifikasi Berkas Fisik & Koordinasi Petugas',
    subMenus: [
      'Pra Registrasi Online',
      'Pengaduan Online',
      'Scan QR / Cek Tiket',
      'Verifikasi Dokumen Fisik',
      'Notifikasi & Riwayat Aktivitas',
    ],
    structuralUnit: 'Operator Admin Layanan Kelurahan & Loket PTSP',
    badgeColor: 'bg-sky-50 text-[#0D3868] border-sky-200',
  },
  {
    id: 'rtrw',
    label: 'Data RT RW',
    description:
      'Database Ketua LPM, Ketua RW 001–007 & RT, Bagan Struktur RT/RW Dinamis, Laporan RT/RW & Jadwal Siskamling',
    subMenus: [
      'Database RW 001–007, RT & Ketua LPM',
      'Bagan Struktur RT/RW Dinamis',
      'Cetak Laporan RT/RW',
      'Jadwal Ronda Siskamling',
    ],
    structuralUnit: 'Seksi Pemerintahan, Trantibum & LPM',
    badgeColor: 'bg-slate-100 text-slate-800 border-slate-300',
  },
  {
    id: 'sampah',
    label: 'Pengelolaan Sampah',
    description:
      'Manajemen terpadu Unit Bank Sampah (BSU RW), Log Timbangan, Titik Teba Komunal & Lubang Resapan Biopori (LRB)',
    subMenus: [
      'Unit Bank Sampah (BSU RW)',
      'Log Timbangan Sampah',
      'Titik Teba Komunal',
      'Lubang Resapan Biopori (LRB)',
    ],
    structuralUnit: 'Seksi Pengelolaan Kebersihan & Pertamanan',
    badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
  },
  {
    id: 'urban_farming',
    label: 'Urban Farming',
    description:
      'Manajemen Lokasi Lahan, Kelompok Tani, Data Tanaman, Log Perawatan, Hasil Panen, Inventaris & Permohonan Bibit',
    subMenus: [
      'Kebun & Lokasi Lahan',
      'Kelompok Tani',
      'Tanaman & Log Perawatan',
      'Data Panen',
      'Inventaris & Permohonan Bibit',
    ],
    structuralUnit: 'Seksi Pemberdayaan Masyarakat & Kebersihan',
    badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  },
  {
    id: 'kerjabakti',
    label: 'Kerja Bakti',
    description:
      'Jadwal gotong royong warga RW/RT, target peserta, rekap tonase sampah & dokumentasi kegiatan tuntas',
    subMenus: ['Jadwal Kerja Bakti RW/RT', 'Dokumentasi & Tonase Sampah', 'Sorotan Kerja Bakti IG'],
    structuralUnit: 'Seksi Pengelolaan Kebersihan & Pertamanan',
    badgeColor: 'bg-purple-50 text-purple-800 border-purple-200',
  },
  {
    id: 'info',
    label: 'Informasi dan IG',
    description:
      'Publikasi pengumuman resmi warga, agenda kelurahan & sinkronisasi feed Instagram @kelurahan.panaikang',
    subMenus: ['Artikel & Pengumuman Warga', 'Sinkronisasi IG @kelurahan.panaikang'],
    structuralUnit: 'Sekretariat & Seksi Pemberdayaan',
    badgeColor: 'bg-teal-50 text-teal-800 border-teal-200',
  },
  {
    id: 'whatsapp_gateway',
    label: 'Kelola WhatsApp Gateaway',
    description:
      'Konfigurasi Fonnte WhatsApp Gateway, filter RTRW & aktivasi nomor penerima pesan otomatis, uji pengiriman & log otomatis',
    subMenus: [
      'Status Koneksi WhatsApp Gateway (Fonnte)',
      'Kelola & Filter Nomor WhatsApp RTRW',
      'Log Pengiriman Otomatis WhatsApp',
    ],
    structuralUnit: 'Lurah & Sekretariat Satu Data',
    badgeColor: 'bg-emerald-50 text-[#075E54] border-emerald-300',
  },
  {
    id: 'kelola_admin_warga',
    label: 'Kelola Admin dan User',
    description:
      'Pusat terpadu: Otoritas Master Admin, Parameter Admin, User Warga, serta Manajemen Pelayanan & Master Data Layanan',
    subMenus: [
      'Otoritas Master Admin',
      'Parameter Admin',
      'User Warga Terdaftar',
      'Manajemen Pelayanan & Master Data Layanan',
    ],
    structuralUnit: 'Khusus Otoritas Lurah & Administrator',
    badgeColor: 'bg-indigo-50 text-indigo-900 border-indigo-200',
  },
  {
    id: 'traffic',
    label: 'Traffic Web dan App',
    description:
      'Monitoring analitik pengunjung real-time (tanpa simulasi), sumber trafik, perangkat, sebaran RW & log telemetri live',
    subMenus: [
      'Analitik Kunjungan Real-Time',
      'Sebaran Perangkat & Wilayah RW',
      'Log Telemetri Live & PWA Install',
    ],
    structuralUnit: 'Lurah & Sekretariat Satu Data',
    badgeColor: 'bg-cyan-50 text-cyan-800 border-cyan-200',
  },
  {
    id: 'log_aktivitas',
    label: 'Log Aktifitas Aplikasi',
    description:
      'Rekam jejak real-time WITA seluruh aktivitas login, tambah, ubah, hapus & verifikasi oleh admin untuk pengawasan Lurah',
    subMenus: ['Audit Trail Real-Time WITA', 'Filter Modul & Pejabat', 'Reset / Ekspor Log'],
    structuralUnit: 'Lurah & Sekretaris Lurah',
    badgeColor: 'bg-amber-50 text-amber-900 border-amber-200',
  },
];

// Mapping of the 7 Service Categories to the current 13 Official Letters (PM-01..SL-13) & 9 Complaint Categories
export const CATEGORY_CURRENT_SERVICES_MAP: Record<
  string,
  { officialLetters: string[]; complaintTopics: string[]; responsibleSection: string }
> = {
  administrasi_kependudukan: {
    officialLetters: [
      'PM-01 Pindah Masuk Penduduk',
      'PK-02 Pindah Keluar Penduduk',
      'SK-03 Surat Kelahiran',
      'SK-04 Surat Kematian',
      'DK-05 Domisili Sementara',
    ],
    complaintTopics: ['Administrasi pelayanan'],
    responsibleSection: 'Kasi Pemerintahan, Ketentraman dan Ketertiban Umum',
  },
  surat_keterangan: {
    officialLetters: [
      'SK-06 Pengantar SKCK',
      'BM-10 Keterangan Belum Menikah',
      'PN-11 Surat Pengantar Nikah',
      'AW-12 Persyaratan Ahli Waris',
      'SL-13 Surat Keterangan Lainnya',
    ],
    complaintTopics: ['Administrasi pelayanan'],
    responsibleSection: 'Kasi Pemerintahan & Seksi Pelayanan Umum',
  },
  pelayanan_usaha: {
    officialLetters: [
      'DU-07 Keterangan Domisili Usaha',
      'SU-08 Surat Keterangan Usaha (SKU)',
      'SU-09 Keterangan Usaha (Tambahan)',
    ],
    complaintTopics: ['Administrasi pelayanan'],
    responsibleSection: 'Kasi Pemberdayaan Masyarakat, Pembangunan dan Sosial',
  },
  masalah_lingkungan: {
    officialLetters: [],
    complaintTopics: [
      'Infrastruktur jalan/drainase',
      'Sampah dan kebersihan',
      'Lampu jalan/penerangan',
      'Gangguan lingkungan',
      'Fasilitas umum',
    ],
    responsibleSection: 'Kasi Pengelolaan Kebersihan dan Pertamanan',
  },
  bantuan_sosial: {
    officialLetters: ['SL-13 Surat Keterangan Tidak Mampu / Bansos'],
    complaintTopics: ['Bantuan sosial'],
    responsibleSection: 'Kasi Pemberdayaan Masyarakat, Pembangunan dan Sosial',
  },
  sosial_kemasyarakatan: {
    officialLetters: [
      'BM-10 Keterangan Belum Menikah',
      'PN-11 Surat Pengantar Nikah',
      'SL-13 Rekomendasi Kegiatan Warga',
    ],
    complaintTopics: ['Fasilitas umum', 'Lainnya'],
    responsibleSection: 'Kasi Pemberdayaan Masyarakat, Pembangunan dan Sosial',
  },
  pengaduan_permasalahan_warga: {
    officialLetters: ['SK-06 Pengantar SKCK', 'AW-12 Mediasi Ahli Waris'],
    complaintTopics: [
      'Keamanan dan ketertiban',
      'Infrastruktur jalan/drainase',
      'Sampah dan kebersihan',
      'Gangguan lingkungan',
      'Lainnya',
    ],
    responsibleSection: 'Kasi Pemerintahan, Ketentraman dan Ketertiban Umum',
  },
};

export const ACTION_PERMISSION_OPTIONS: {
  key: keyof AdminActionPermissions;
  label: string;
  description: string;
}[] = [
  {
    key: 'canCreate',
    label: 'Tambah / Input Data Baru',
    description:
      'Mengizinkan user menambah berkas 13 surat resmi, jadwal, titik BSU/Teba/Biopori, kebun, atau data baru',
  },
  {
    key: 'canEdit',
    label: 'Edit & Perbarui Status Data',
    description:
      'Mengizinkan user mengubah data struktur, RT/RW, Siskamling, dan memperbarui status tindak lanjut',
  },
  {
    key: 'canDelete',
    label: 'Hapus Data / Berkas',
    description: 'Mengizinkan user menghapus record data atau berkas pengajuan dari sistem',
  },
  {
    key: 'canVerifyAndIssueLetter',
    label: 'Verifikasi & Terbitkan Nomor Surat',
    description:
      'Mengizinkan user memverifikasi 13 layanan surat resmi (PM-01 s/d SL-13) & menerbitkan nomor registrasi',
  },
  {
    key: 'canConfigureCatalog',
    label: 'Konfigurasi Katalog SOP & Menu Warga',
    description:
      'Mengizinkan user menambah/mengubah sub-menu layanan warga & daftar persyaratan berkas',
  },
  {
    key: 'canManageWhatsApp',
    label: 'Kelola & Kirim Notifikasi WhatsApp',
    description:
      'Mengizinkan user mengelola direktori nomor WA penerima & mengirim disposisi/koordinasi WA resmi',
  },
  {
    key: 'canExportPrintPdf',
    label: 'Cetak Kop Surat, Bagan & Unduh PDF',
    description:
      'Mengizinkan user mencetak surat resmi kelurahan, laporan RT/RW, bagan struktur & arsip PDF bulanan',
  },
];

export const ROLE_LEVEL_LABELS: Record<
  AdminRoleLevel,
  { label: string; badgeClass: string; desc: string }
> = {
  master_admin: {
    label: 'Master / Super Admin (Lurah)',
    badgeClass: 'bg-[#0D3868] text-white border-[#0D3868]',
    desc: 'Otoritas penuh seluruh 12 modul, penerbitan surat, bagan struktur dinamis, dan pengaturan batasan akses user.',
  },
  admin_bidang: {
    label: 'Admin Bidang (Seklur / 3 Kasi)',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    desc: 'Pejabat struktural (Perwali No. 65/2023) pengelola seksi/bidang layanan tertentu beserta verifikasi berkas.',
  },
  operator: {
    label: 'Staf Seksi / Operator Pelayanan',
    badgeClass: 'bg-sky-50 text-sky-800 border-sky-200',
    desc: 'Staf seksi kelurahan atau operator loket PTSP untuk input berkas 13 surat, pembaruan data & operasional lapangan.',
  },
  viewer: {
    label: 'Viewer / Monitoring & LPM',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-300',
    desc: 'Akses baca/monitoring data pada menu yang diizinkan (termasuk laporan & bagan) tanpa hak hapus.',
  },
};

export type AccessPresetKey =
  | 'master_lurah'
  | 'sekretaris'
  | 'kasi_pemerintahan'
  | 'kasi_pemberdayaan'
  | 'kasi_kebersihan'
  | 'staf_pemerintahan'
  | 'staf_pemberdayaan'
  | 'staf_kebersihan'
  | 'ketua_lpm'
  | 'operator_loket'
  | 'viewer_monitoring';

interface StructuralCandidate {
  key: string;
  label: string;
  fullName: string;
  nip: string;
  suggestedUsername: string;
  jabatan: string;
  unitBidang: string;
  presetKey: AccessPresetKey;
}

export const AdminParameterUserPanel: React.FC<AdminParameterUserPanelProps> = ({
  adminUsers,
  serviceCatalog,
  currentUsername,
  isMasterLurah,
  profile,
  rwGroups = [],
  onSaveAdminUsers,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | AdminRoleLevel>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Modal Form State (Add / Edit User & Access Restrictions)
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [showPasswordInForm, setShowPasswordInForm] = useState(false);
  const [revealedPasswordIds, setRevealedPasswordIds] = useState<Record<string, boolean>>({});
  const [confirmDeleteUserId, setConfirmDeleteUserId] = useState<string | null>(null);

  // Quick Access Matrix Drawer / Expanded Card per User
  const [expandedPermissionUserId, setExpandedPermissionUserId] = useState<string | null>(null);

  // Feedback banners
  const [feedbackSuccess, setFeedbackSuccess] = useState('');
  const [feedbackErrors, setFeedbackErrors] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const allCategoryIds = useMemo(
    () => serviceCatalog.map((c) => normalizeServiceCategoryId(c.id)),
    [serviceCatalog]
  );

  // Build candidates dynamically from current Profil Kelurahan (Perwali 65/2023) & Data RT/RW (LPM)
  const structuralCandidates = useMemo<StructuralCandidate[]>(() => {
    const list: StructuralCandidate[] = [];
    if (!profile) return list;

    list.push({
      key: 'struct-lurah',
      label: `Lurah Panaikang — ${profile.lurahName || 'Belum diisi di Profil'}`,
      fullName: profile.lurahName || 'Lurah Panaikang',
      nip: profile.lurahNip || '',
      suggestedUsername: 'lurah',
      jabatan: 'Lurah Panaikang · Master / Super Admin',
      unitBidang: 'Pimpinan Pemerintah Kelurahan Panaikang',
      presetKey: 'master_lurah',
    });

    list.push({
      key: 'struct-sekretaris',
      label: `Sekretaris Lurah — ${profile.sekretarisName || 'Belum diisi di Profil'}`,
      fullName: profile.sekretarisName || 'Sekretaris Lurah',
      nip: profile.sekretarisNip || '',
      suggestedUsername: 'sekretaris',
      jabatan: 'Sekretaris Lurah · Koordinator Satu Data',
      unitBidang: 'Sekretariat Kelurahan Panaikang',
      presetKey: 'sekretaris',
    });

    list.push({
      key: 'struct-kasi-pemerintahan',
      label: `Kasi Pemerintahan, Trantibum — ${profile.kasiPemerintahanName || 'Belum diisi di Profil'}`,
      fullName:
        profile.kasiPemerintahanName || 'Kasi Pemerintahan, Ketentraman dan Ketertiban Umum',
      nip: profile.kasiPemerintahanNip || '',
      suggestedUsername: 'kasi.pemerintahan',
      jabatan: 'Kasi Pemerintahan, Ketentraman dan Ketertiban Umum',
      unitBidang: 'Seksi Pemerintahan, Ketentraman & Ketertiban Umum',
      presetKey: 'kasi_pemerintahan',
    });

    list.push({
      key: 'struct-kasi-pemberdayaan',
      label: `Kasi Pemberdayaan Masyarakat, Pembangunan & Sosial — ${profile.kasiPemberdayaanName || 'Belum diisi di Profil'}`,
      fullName:
        profile.kasiPemberdayaanName ||
        'Kasi Pemberdayaan Masyarakat, Pembangunan dan Sosial',
      nip: profile.kasiPemberdayaanNip || '',
      suggestedUsername: 'kasi.pemberdayaan',
      jabatan: 'Kasi Pemberdayaan Masyarakat, Pembangunan dan Sosial',
      unitBidang: 'Seksi Pemberdayaan Masyarakat, Pembangunan & Sosial',
      presetKey: 'kasi_pemberdayaan',
    });

    list.push({
      key: 'struct-kasi-kebersihan',
      label: `Kasi Pengelolaan Kebersihan & Pertamanan — ${profile.kasiKebersihanName || 'Belum diisi di Profil'}`,
      fullName:
        profile.kasiKebersihanName || 'Kasi Pengelolaan Kebersihan dan Pertamanan',
      nip: profile.kasiKebersihanNip || '',
      suggestedUsername: 'kasi.kebersihan',
      jabatan: 'Kasi Pengelolaan Kebersihan dan Pertamanan',
      unitBidang: 'Seksi Pengelolaan Kebersihan & Pertamanan',
      presetKey: 'kasi_kebersihan',
    });

    (profile.stafPemerintahan || []).forEach((stafName, idx) => {
      if (!stafName || !stafName.trim()) return;
      const slug = stafName
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '.')
        .replace(/^\.+|\.+$/g, '')
        .slice(0, 20);
      list.push({
        key: `struct-staf-pem-${idx}`,
        label: `Staf Seksi Pemerintahan — ${stafName}`,
        fullName: stafName.trim(),
        nip: '-',
        suggestedUsername: slug || `staf.pemerintahan.${idx + 1}`,
        jabatan: 'Staf Seksi Pemerintahan, Ketentraman dan Ketertiban Umum',
        unitBidang: 'Seksi Pemerintahan, Ketentraman & Ketertiban Umum',
        presetKey: 'staf_pemerintahan',
      });
    });

    (profile.stafPemberdayaan || []).forEach((stafName, idx) => {
      if (!stafName || !stafName.trim()) return;
      const slug = stafName
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '.')
        .replace(/^\.+|\.+$/g, '')
        .slice(0, 20);
      list.push({
        key: `struct-staf-pmb-${idx}`,
        label: `Staf Seksi Pemberdayaan Masyarakat — ${stafName}`,
        fullName: stafName.trim(),
        nip: '-',
        suggestedUsername: slug || `staf.pemberdayaan.${idx + 1}`,
        jabatan: 'Staf Seksi Pemberdayaan Masyarakat, Pembangunan dan Sosial',
        unitBidang: 'Seksi Pemberdayaan Masyarakat, Pembangunan & Sosial',
        presetKey: 'staf_pemberdayaan',
      });
    });

    (profile.stafKebersihan || []).forEach((stafName, idx) => {
      if (!stafName || !stafName.trim()) return;
      const slug = stafName
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '.')
        .replace(/^\.+|\.+$/g, '')
        .slice(0, 20);
      list.push({
        key: `struct-staf-kbr-${idx}`,
        label: `Staf Seksi Kebersihan & Pertamanan — ${stafName}`,
        fullName: stafName.trim(),
        nip: '-',
        suggestedUsername: slug || `staf.kebersihan.${idx + 1}`,
        jabatan: 'Staf Seksi Pengelolaan Kebersihan dan Pertamanan',
        unitBidang: 'Seksi Pengelolaan Kebersihan & Pertamanan',
        presetKey: 'staf_kebersihan',
      });
    });

    if (profile.ketuaLpmName && profile.ketuaLpmName.trim()) {
      list.push({
        key: 'struct-ketua-lpm',
        label: `Ketua LPM Kelurahan Panaikang — ${profile.ketuaLpmName}`,
        fullName: profile.ketuaLpmName.trim(),
        nip: '-',
        suggestedUsername: 'ketua.lpm',
        jabatan: 'Ketua LPM Kelurahan Panaikang',
        unitBidang: 'Lembaga Pemberdayaan Masyarakat (LPM) & Mitra RT/RW',
        presetKey: 'ketua_lpm',
      });
    }

    return list;
  }, [profile]);

  const [googleRequests, setGoogleRequests] = useState<GoogleAdminVerificationRequest[]>(() =>
    loadGoogleAdminVerificationRequests()
  );
  const [newGoogleEmail, setNewGoogleEmail] = useState('');
  const [selectedAdminIdForGoogle, setSelectedAdminIdForGoogle] = useState('');

  const [userForm, setUserForm] = useState<{
    username: string;
    password: string;
    fullName: string;
    nip: string;
    jabatan: string;
    unitBidang: string;
    phone: string;
    googleEmail: string;
    isGoogleVerified: boolean;
    roleLevel: AdminRoleLevel;
    isMasterLurah: boolean;
    isActive: boolean;
    allowedAdminTabs: AdminTabId[];
    allowedServiceCategories: string[];
    actionPermissions: AdminActionPermissions;
    notes: string;
  }>({
    username: '',
    password: '',
    fullName: '',
    nip: '',
    jabatan: '',
    unitBidang: 'Loket Pelayanan Terpadu Kelurahan Panaikang',
    phone: '',
    googleEmail: '',
    isGoogleVerified: false,
    roleLevel: 'operator',
    isMasterLurah: false,
    isActive: true,
    allowedAdminTabs: ['pengurusan_warga', 'rtrw'],
    allowedServiceCategories: ['administrasi_kependudukan', 'surat_keterangan'],
    actionPermissions: {
      canCreate: true,
      canEdit: true,
      canDelete: false,
      canVerifyAndIssueLetter: false,
      canConfigureCatalog: false,
      canManageWhatsApp: false,
      canExportPrintPdf: true,
    },
    notes: '',
  });

  const filteredUsers = useMemo(() => {
    return adminUsers.filter((u) => {
      if (roleFilter !== 'ALL' && u.roleLevel !== roleFilter) return false;
      if (statusFilter === 'ACTIVE' && !u.isActive) return false;
      if (statusFilter === 'INACTIVE' && u.isActive) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          u.username.toLowerCase().includes(q) ||
          u.fullName.toLowerCase().includes(q) ||
          u.nip.toLowerCase().includes(q) ||
          u.jabatan.toLowerCase().includes(q) ||
          u.unitBidang.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [adminUsers, roleFilter, statusFilter, searchQuery]);

  // Preset Role Templates aligned with Perwali Kota Makassar No. 65 Tahun 2023 & all 12 current menus
  const applyAccessPreset = (presetKey: AccessPresetKey, keepIdentity = true) => {
    if (presetKey === 'master_lurah') {
      setUserForm((prev) => ({
        ...prev,
        roleLevel: 'master_admin',
        isMasterLurah: true,
        jabatan: keepIdentity && prev.jabatan ? prev.jabatan : 'Lurah Panaikang · Master / Super Admin',
        unitBidang:
          keepIdentity && prev.unitBidang
            ? prev.unitBidang
            : 'Pimpinan Pemerintah Kelurahan Panaikang',
        allowedAdminTabs: ADMIN_MODULE_OPTIONS.map((m) => m.id),
        allowedServiceCategories: [...allCategoryIds],
        actionPermissions: {
          canCreate: true,
          canEdit: true,
          canDelete: true,
          canVerifyAndIssueLetter: true,
          canConfigureCatalog: true,
          canManageWhatsApp: true,
          canExportPrintPdf: true,
        },
        notes:
          prev.notes ||
          'Otoritas penuh seluruh 12 modul, bagan struktur dinamis, dan pengaturan batasan akses user.',
      }));
    } else if (presetKey === 'sekretaris') {
      setUserForm((prev) => ({
        ...prev,
        roleLevel: 'admin_bidang',
        isMasterLurah: false,
        jabatan:
          keepIdentity && prev.jabatan
            ? prev.jabatan
            : 'Sekretaris Lurah · Koordinator Satu Data',
        unitBidang: 'Sekretariat Kelurahan Panaikang',
        allowedAdminTabs: [
          'pengurusan_warga',
          'profil',
          'info',
          'sampah',
          'kerjabakti',
          'urban_farming',
          'rtrw',
          'traffic',
          'log_aktivitas',
        ],
        allowedServiceCategories: [...allCategoryIds],
        actionPermissions: {
          canCreate: true,
          canEdit: true,
          canDelete: false,
          canVerifyAndIssueLetter: true,
          canConfigureCatalog: true,
          canManageWhatsApp: true,
          canExportPrintPdf: true,
        },
        notes:
          'Koordinator Sekretariat Satu Data: verifikasi 13 layanan surat resmi, profil & bagan struktur kelurahan, data RT/RW & Siskamling, serta monitoring trafik.',
      }));
    } else if (presetKey === 'kasi_pemerintahan') {
      setUserForm((prev) => ({
        ...prev,
        roleLevel: 'admin_bidang',
        isMasterLurah: false,
        jabatan: 'Kasi Pemerintahan, Ketentraman dan Ketertiban Umum',
        unitBidang: 'Seksi Pemerintahan, Ketentraman & Ketertiban Umum',
        allowedAdminTabs: ['pengurusan_warga', 'profil', 'rtrw', 'traffic'],
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
        notes:
          'Menangani Administrasi Kependudukan, Surat Keterangan (Pindah, Kelahiran, Kematian, Domisili, SKCK, Ahli Waris), Data RT/RW, Bagan LPM, Jadwal Siskamling & Trantibum.',
      }));
    } else if (presetKey === 'kasi_pemberdayaan') {
      setUserForm((prev) => ({
        ...prev,
        roleLevel: 'admin_bidang',
        isMasterLurah: false,
        jabatan: 'Kasi Pemberdayaan Masyarakat, Pembangunan dan Sosial',
        unitBidang: 'Seksi Pemberdayaan Masyarakat, Pembangunan & Sosial',
        allowedAdminTabs: ['pengurusan_warga', 'info', 'urban_farming', 'rtrw'],
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
        notes:
          'Menangani Pelayanan Usaha & UMKM (SKU/Domisili Usaha), Bantuan Sosial, Sosial Kemasyarakatan, Pengantar Nikah, Urban Farming (7 Sub-Modul Pangan) & Publikasi Informasi.',
      }));
    } else if (presetKey === 'kasi_kebersihan') {
      setUserForm((prev) => ({
        ...prev,
        roleLevel: 'admin_bidang',
        isMasterLurah: false,
        jabatan: 'Kasi Pengelolaan Kebersihan dan Pertamanan',
        unitBidang: 'Seksi Pengelolaan Kebersihan & Pertamanan',
        allowedAdminTabs: ['pengurusan_warga', 'sampah', 'kerjabakti', 'urban_farming'],
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
        notes:
          'Menangani Pengelolaan Sampah Terpadu (Bank Sampah Unit BSU RW, Titik Teba Komunal, Lubang Resapan Biopori), Jadwal Kerja Bakti, Masalah Lingkungan & Ruang Hijau.',
      }));
    } else if (presetKey === 'staf_pemerintahan') {
      setUserForm((prev) => ({
        ...prev,
        roleLevel: 'operator',
        isMasterLurah: false,
        jabatan: 'Staf Seksi Pemerintahan, Ketentraman dan Ketertiban Umum',
        unitBidang: 'Seksi Pemerintahan, Ketentraman & Ketertiban Umum',
        allowedAdminTabs: ['pengurusan_warga', 'rtrw'],
        allowedServiceCategories: [
          'administrasi_kependudukan',
          'surat_keterangan',
          'pengaduan_permasalahan_warga',
        ],
        actionPermissions: {
          canCreate: true,
          canEdit: true,
          canDelete: false,
          canVerifyAndIssueLetter: false,
          canConfigureCatalog: false,
          canManageWhatsApp: false,
          canExportPrintPdf: true,
        },
        notes:
          'Staf Seksi Pemerintahan: pelayanan berkas Adminduk, Surat Keterangan, pembaruan Data RT/RW & Jadwal Siskamling.',
      }));
    } else if (presetKey === 'staf_pemberdayaan') {
      setUserForm((prev) => ({
        ...prev,
        roleLevel: 'operator',
        isMasterLurah: false,
        jabatan: 'Staf Seksi Pemberdayaan Masyarakat, Pembangunan dan Sosial',
        unitBidang: 'Seksi Pemberdayaan Masyarakat, Pembangunan & Sosial',
        allowedAdminTabs: ['pengurusan_warga', 'info', 'urban_farming'],
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
          canVerifyAndIssueLetter: false,
          canConfigureCatalog: false,
          canManageWhatsApp: false,
          canExportPrintPdf: true,
        },
        notes:
          'Staf Seksi Pemberdayaan Masyarakat: pelayanan berkas UMKM, Bansos, Sosial Kemasyarakatan, dan pendataan Urban Farming.',
      }));
    } else if (presetKey === 'staf_kebersihan') {
      setUserForm((prev) => ({
        ...prev,
        roleLevel: 'operator',
        isMasterLurah: false,
        jabatan: 'Staf Seksi Pengelolaan Kebersihan dan Pertamanan',
        unitBidang: 'Seksi Pengelolaan Kebersihan & Pertamanan',
        allowedAdminTabs: ['sampah', 'kerjabakti', 'urban_farming'],
        allowedServiceCategories: [
          'masalah_lingkungan',
          'pengaduan_permasalahan_warga',
        ],
        actionPermissions: {
          canCreate: true,
          canEdit: true,
          canDelete: false,
          canVerifyAndIssueLetter: false,
          canConfigureCatalog: false,
          canManageWhatsApp: true,
          canExportPrintPdf: true,
        },
        notes:
          'Staf Seksi Kebersihan & Pertamanan: pencatatan BSU RW, Titik Teba Komunal, Biopori (LRB), dan dokumentasi Kerja Bakti.',
      }));
    } else if (presetKey === 'ketua_lpm') {
      setUserForm((prev) => ({
        ...prev,
        roleLevel: 'viewer',
        isMasterLurah: false,
        jabatan: 'Ketua LPM Kelurahan Panaikang',
        unitBidang: 'Lembaga Pemberdayaan Masyarakat (LPM) & Mitra RT/RW',
        allowedAdminTabs: ['info', 'kerjabakti', 'urban_farming', 'rtrw'],
        allowedServiceCategories: [
          'pelayanan_usaha',
          'bantuan_sosial',
          'sosial_kemasyarakatan',
          'masalah_lingkungan',
        ],
        actionPermissions: {
          canCreate: true,
          canEdit: true,
          canDelete: false,
          canVerifyAndIssueLetter: false,
          canConfigureCatalog: false,
          canManageWhatsApp: false,
          canExportPrintPdf: true,
        },
        notes:
          'Mitra LPM Kelurahan: koordinasi struktur RT/RW, pemberdayaan masyarakat, kerja bakti, dan ketahanan pangan.',
      }));
    } else if (presetKey === 'operator_loket') {
      setUserForm((prev) => ({
        ...prev,
        roleLevel: 'operator',
        isMasterLurah: false,
        jabatan: 'Operator Pelayanan Terpadu Satu Pintu (PTSP)',
        unitBidang: 'Loket Pelayanan Terpadu Kelurahan Panaikang',
        allowedAdminTabs: ['pengurusan_warga', 'info', 'rtrw'],
        allowedServiceCategories: [...allCategoryIds],
        actionPermissions: {
          canCreate: true,
          canEdit: true,
          canDelete: false,
          canVerifyAndIssueLetter: true,
          canConfigureCatalog: false,
          canManageWhatsApp: false,
          canExportPrintPdf: true,
        },
        notes:
          'Operator loket kelurahan untuk registrasi 13 Layanan Administrasi Surat Resmi (PM-01 s/d SL-13) dan penerimaan pengaduan warga.',
      }));
    } else if (presetKey === 'viewer_monitoring') {
      setUserForm((prev) => ({
        ...prev,
        roleLevel: 'viewer',
        isMasterLurah: false,
        jabatan: 'Staf Monitoring & Evaluasi Satu Data',
        unitBidang: 'Monitoring Satu Data Kelurahan Panaikang',
        allowedAdminTabs: [
          'pengurusan_warga',
          'profil',
          'info',
          'sampah',
          'kerjabakti',
          'urban_farming',
          'rtrw',
          'traffic',
        ],
        allowedServiceCategories: [...allCategoryIds],
        actionPermissions: {
          canCreate: false,
          canEdit: false,
          canDelete: false,
          canVerifyAndIssueLetter: false,
          canConfigureCatalog: false,
          canManageWhatsApp: false,
          canExportPrintPdf: true,
        },
        notes: 'Akses monitoring dan cetak laporan tanpa kewenangan mengubah atau menghapus data.',
      }));
    }
  };

  // Sync existing accounts & create missing structural accounts from Profil Kelurahan (Perwali 65/2023) & LPM
  const handleSyncWithStructuralProfile = async () => {
    setFeedbackErrors([]);
    setFeedbackSuccess('');
    setIsSaving(true);

    const nowLabel = getRealtimeDateString(new Date());
    const nextUsers: AdminUserAccount[] = adminUsers.map((u) => {
      const normalizedCats = normalizeCategoryList(u.allowedServiceCategories);
      const cleanU = u.username.toLowerCase();

      if (cleanU === 'lurah' || u.isMasterLurah) {
        return {
          ...u,
          fullName:
            profile?.lurahName && profile.lurahName.trim()
              ? profile.lurahName.trim()
              : u.fullName,
          nip:
            profile?.lurahNip && profile.lurahNip.trim()
              ? profile.lurahNip.trim()
              : u.nip,
          allowedAdminTabs: ADMIN_MODULE_OPTIONS.map((m) => m.id),
          allowedServiceCategories: [...allCategoryIds],
          updatedAt: `${nowLabel} · Disinkronkan`,
        };
      }
      if (cleanU === 'sekretaris') {
        return {
          ...u,
          fullName:
            profile?.sekretarisName && profile.sekretarisName.trim()
              ? profile.sekretarisName.trim()
              : u.fullName,
          nip:
            profile?.sekretarisNip && profile.sekretarisNip.trim()
              ? profile.sekretarisNip.trim()
              : u.nip,
          jabatan: 'Sekretaris Lurah · Koordinator Satu Data',
          allowedAdminTabs: Array.from(
            new Set([
              ...u.allowedAdminTabs.filter((t) => t !== 'laporan'),
              'pengurusan_warga',
              'profil',
              'info',
              'sampah',
              'kerjabakti',
              'urban_farming',
              'rtrw',
              'traffic',
              'log_aktivitas',
            ])
          ) as AdminTabId[],
          allowedServiceCategories: [...allCategoryIds],
          updatedAt: `${nowLabel} · Disinkronkan`,
        };
      }
      if (cleanU === 'kasi.pemerintahan') {
        return {
          ...u,
          fullName:
            profile?.kasiPemerintahanName && profile.kasiPemerintahanName.trim()
              ? profile.kasiPemerintahanName.trim()
              : u.fullName,
          nip:
            profile?.kasiPemerintahanNip && profile.kasiPemerintahanNip.trim()
              ? profile.kasiPemerintahanNip.trim()
              : u.nip,
          jabatan: 'Kasi Pemerintahan, Ketentraman dan Ketertiban Umum',
          unitBidang: 'Seksi Pemerintahan, Ketentraman & Ketertiban Umum',
          allowedAdminTabs: Array.from(
            new Set([...u.allowedAdminTabs, 'pengurusan_warga', 'profil', 'rtrw', 'traffic'])
          ) as AdminTabId[],
          allowedServiceCategories: normalizeCategoryList([
            ...normalizedCats,
            'administrasi_kependudukan',
            'surat_keterangan',
            'pengaduan_permasalahan_warga',
          ]),
          updatedAt: `${nowLabel} · Disinkronkan`,
        };
      }
      if (cleanU === 'kasi.pemberdayaan' || cleanU === 'kasi.kesra') {
        return {
          ...u,
          username: 'kasi.pemberdayaan',
          fullName:
            profile?.kasiPemberdayaanName && profile.kasiPemberdayaanName.trim()
              ? profile.kasiPemberdayaanName.trim()
              : u.fullName,
          nip:
            profile?.kasiPemberdayaanNip && profile.kasiPemberdayaanNip.trim()
              ? profile.kasiPemberdayaanNip.trim()
              : u.nip,
          jabatan: 'Kasi Pemberdayaan Masyarakat, Pembangunan dan Sosial',
          unitBidang: 'Seksi Pemberdayaan Masyarakat, Pembangunan & Sosial',
          allowedAdminTabs: Array.from(
            new Set([...u.allowedAdminTabs, 'pengurusan_warga', 'info', 'urban_farming', 'rtrw'])
          ) as AdminTabId[],
          allowedServiceCategories: normalizeCategoryList([
            ...normalizedCats,
            'pelayanan_usaha',
            'bantuan_sosial',
            'sosial_kemasyarakatan',
            'surat_keterangan',
          ]),
          updatedAt: `${nowLabel} · Disinkronkan`,
        };
      }
      if (cleanU === 'kasi.kebersihan') {
        return {
          ...u,
          fullName:
            profile?.kasiKebersihanName && profile.kasiKebersihanName.trim()
              ? profile.kasiKebersihanName.trim()
              : u.fullName,
          nip:
            profile?.kasiKebersihanNip && profile.kasiKebersihanNip.trim()
              ? profile.kasiKebersihanNip.trim()
              : u.nip,
          jabatan: 'Kasi Pengelolaan Kebersihan dan Pertamanan',
          unitBidang: 'Seksi Pengelolaan Kebersihan & Pertamanan',
          allowedAdminTabs: Array.from(
            new Set([...u.allowedAdminTabs, 'pengurusan_warga', 'sampah', 'kerjabakti', 'urban_farming'])
          ) as AdminTabId[],
          allowedServiceCategories: normalizeCategoryList([
            ...normalizedCats,
            'masalah_lingkungan',
            'pengaduan_permasalahan_warga',
          ]),
          updatedAt: `${nowLabel} · Disinkronkan`,
        };
      }
      return {
        ...u,
        allowedServiceCategories: normalizedCats,
      };
    });

    // Ensure Kasi Pemberdayaan exists if not yet in list
    if (
      !nextUsers.some(
        (u) => u.username.toLowerCase() === 'kasi.pemberdayaan' || u.id === 'usr-kasi-pemberdayaan'
      )
    ) {
      nextUsers.push({
        id: 'usr-kasi-pemberdayaan',
        username: 'kasi.pemberdayaan',
        password: 'panaikang2026',
        fullName:
          profile?.kasiPemberdayaanName && profile.kasiPemberdayaanName.trim()
            ? profile.kasiPemberdayaanName.trim()
            : 'Kasi Pemberdayaan Masyarakat, Pembangunan dan Sosial',
        nip: profile?.kasiPemberdayaanNip?.trim() || '-',
        jabatan: 'Kasi Pemberdayaan Masyarakat, Pembangunan dan Sosial',
        unitBidang: 'Seksi Pemberdayaan Masyarakat, Pembangunan & Sosial',
        phone: '',
        roleLevel: 'admin_bidang',
        isMasterLurah: false,
        isActive: true,
        allowedAdminTabs: ['pengurusan_warga', 'info', 'urban_farming', 'rtrw'],
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
        createdAt: nowLabel,
        updatedAt: `${nowLabel} · Disinkronkan`,
        lastLoginAt: 'Belum login',
        notes:
          'Menangani Pelayanan Usaha & UMKM (SKU/Domisili Usaha), Bantuan Sosial, Sosial Kemasyarakatan, Urban Farming & Publikasi Informasi.',
      });
    }

    const res = await onSaveAdminUsers(nextUsers);
    setIsSaving(false);
    if (res.ok) {
      setFeedbackSuccess(
        'Seluruh akun pejabat struktural, daftar modul admin (termasuk Admin Pelayanan Kelurahan & Master Data Layanan), serta bidang layanan berhasil disinkronkan dengan struktur terbaru.'
      );
    } else {
      setFeedbackErrors(res.errors || ['Gagal menyinkronkan data parameter user.']);
    }
  };

  const openAddUserModal = () => {
    setFeedbackErrors([]);
    setFeedbackSuccess('');
    setEditingUserId(null);
    setShowPasswordInForm(true);
    setUserForm({
      username: '',
      password: 'panaikang2026',
      fullName: '',
      nip: '',
      jabatan: 'Staf / Operator Pelayanan Kelurahan',
      unitBidang: 'Loket Pelayanan Terpadu Kelurahan Panaikang',
      phone: '',
      googleEmail: '',
      isGoogleVerified: false,
      roleLevel: 'operator',
      isMasterLurah: false,
      isActive: true,
      allowedAdminTabs: ['pengurusan_warga', 'user_warga', 'info', 'rtrw'],
      allowedServiceCategories: [...allCategoryIds],
      actionPermissions: {
        canCreate: true,
        canEdit: true,
        canDelete: false,
        canVerifyAndIssueLetter: false,
        canConfigureCatalog: false,
        canManageWhatsApp: false,
        canExportPrintPdf: true,
      },
      notes: '',
    });
    setShowUserModal(true);
  };

  const openEditUserModal = (user: AdminUserAccount) => {
    setFeedbackErrors([]);
    setFeedbackSuccess('');
    setEditingUserId(user.id);
    setShowPasswordInForm(false);
    setUserForm({
      username: user.username,
      password: user.password,
      fullName: user.fullName,
      nip: user.nip,
      jabatan: user.jabatan,
      unitBidang: user.unitBidang,
      phone: user.phone,
      googleEmail: user.googleEmail || '',
      isGoogleVerified: Boolean(user.isGoogleVerified),
      roleLevel: user.roleLevel,
      isMasterLurah: Boolean(user.isMasterLurah || user.roleLevel === 'master_admin'),
      isActive: user.isActive,
      allowedAdminTabs: [...user.allowedAdminTabs],
      allowedServiceCategories: normalizeCategoryList(user.allowedServiceCategories),
      actionPermissions: { ...user.actionPermissions },
      notes: user.notes || '',
    });
    setShowUserModal(true);
  };

  const toggleTabPermissionInForm = (tabId: AdminTabId) => {
    setUserForm((prev) => {
      const exists = prev.allowedAdminTabs.includes(tabId);
      const nextTabs = exists
        ? prev.allowedAdminTabs.filter((t) => t !== tabId)
        : [...prev.allowedAdminTabs, tabId];
      return { ...prev, allowedAdminTabs: nextTabs };
    });
  };

  const toggleCategoryPermissionInForm = (categoryId: string) => {
    const cleanId = normalizeServiceCategoryId(categoryId);
    setUserForm((prev) => {
      const normalized = normalizeCategoryList(prev.allowedServiceCategories);
      const exists = normalized.includes(cleanId);
      const nextCats = exists
        ? normalized.filter((c) => c !== cleanId)
        : [...normalized, cleanId];
      return { ...prev, allowedServiceCategories: nextCats };
    });
  };

  const toggleActionPermissionInForm = (key: keyof AdminActionPermissions) => {
    setUserForm((prev) => ({
      ...prev,
      actionPermissions: {
        ...prev.actionPermissions,
        [key]: !prev.actionPermissions[key],
      },
    }));
  };

  const handleApproveGoogleRequest = async (
    req: GoogleAdminVerificationRequest,
    targetAdminId: string
  ) => {
    const targetAdmin = adminUsers.find((u) => u.id === targetAdminId);
    if (!targetAdmin) return;
    const nowStr = getRealtimeDateString(new Date());
    const nextUsers = adminUsers.map((u) =>
      u.id === targetAdminId
        ? {
            ...u,
            googleEmail: req.email.toLowerCase(),
            isGoogleVerified: true,
            googleVerifiedAt: nowStr,
            googleVerifiedBy: 'Master Admin (Lurah Panaikang)',
            updatedAt: `${nowStr} · Verifikasi Google Disetujui`,
          }
        : u
    );
    const res = await onSaveAdminUsers(nextUsers);
    if (res.ok) {
      const updatedReqs = googleRequests.map((r) =>
        r.id === req.id
          ? {
              ...r,
              status: 'Disetujui' as const,
              processedAt: nowStr,
              processedBy: 'Master Admin (Lurah)',
              linkedAdminId: targetAdmin.id,
              linkedAdminName: targetAdmin.fullName,
            }
          : r
      );
      saveGoogleAdminVerificationRequests(updatedReqs);
      setGoogleRequests(updatedReqs);
      setFeedbackSuccess(
        `Akun Google "${req.email}" telah disetujui & diverifikasi untuk ${targetAdmin.fullName}. Pejabat ini sekarang dapat masuk via Google.`
      );
    }
  };

  const handleRejectGoogleRequest = (reqId: string) => {
    const nowStr = getRealtimeDateString(new Date());
    const updatedReqs = googleRequests.map((r) =>
      r.id === reqId
        ? {
            ...r,
            status: 'Ditolak' as const,
            processedAt: nowStr,
            processedBy: 'Master Admin (Lurah)',
          }
        : r
    );
    saveGoogleAdminVerificationRequests(updatedReqs);
    setGoogleRequests(updatedReqs);
    setFeedbackSuccess('Permohonan verifikasi akun Google berhasil ditolak.');
  };

  const handleDirectWhitelistGoogle = async () => {
    if (!newGoogleEmail.trim() || !newGoogleEmail.includes('@')) {
      setFeedbackErrors(['Masukkan alamat email Google yang valid.']);
      return;
    }
    if (!selectedAdminIdForGoogle) {
      setFeedbackErrors(['Pilih akun pejabat/staf admin yang akan dihubungkan dengan email Google ini.']);
      return;
    }
    const cleanEmail = newGoogleEmail.trim().toLowerCase();
    const targetAdmin = adminUsers.find((u) => u.id === selectedAdminIdForGoogle);
    if (!targetAdmin) return;
    const nowStr = getRealtimeDateString(new Date());
    const nextUsers = adminUsers.map((u) =>
      u.id === selectedAdminIdForGoogle
        ? {
            ...u,
            googleEmail: cleanEmail,
            isGoogleVerified: true,
            googleVerifiedAt: nowStr,
            googleVerifiedBy: 'Master Admin (Lurah Panaikang)',
            updatedAt: `${nowStr} · Verifikasi Google Master Admin`,
          }
        : u
    );
    const res = await onSaveAdminUsers(nextUsers);
    if (res.ok) {
      setNewGoogleEmail('');
      setSelectedAdminIdForGoogle('');
      setFeedbackSuccess(
        `Email Google "${cleanEmail}" berhasil diverifikasi dan didaftarkan untuk ${targetAdmin.fullName}.`
      );
    }
  };

  const handleRevokeGoogleVerification = async (userId: string) => {
    const targetAdmin = adminUsers.find((u) => u.id === userId);
    if (!targetAdmin) return;
    const nowStr = getRealtimeDateString(new Date());
    const nextUsers = adminUsers.map((u) =>
      u.id === userId
        ? {
            ...u,
            isGoogleVerified: false,
            googleVerifiedAt: undefined,
            updatedAt: `${nowStr} · Verifikasi Google Dicabut`,
          }
        : u
    );
    const res = await onSaveAdminUsers(nextUsers);
    if (res.ok) {
      setFeedbackSuccess(
        `Otoritas login Google untuk pejabat "${targetAdmin.fullName}" telah dicabut.`
      );
    }
  };

  const handleSaveUserForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackErrors([]);
    setFeedbackSuccess('');

    const errors: string[] = [];
    const cleanUsername = userForm.username.trim().toLowerCase().replace(/\s+/g, '.');
    if (!cleanUsername || cleanUsername.length < 3) {
      errors.push('Username wajib diisi (minimal 3 karakter, tanpa spasi).');
    }
    if (!userForm.fullName || userForm.fullName.trim().length < 3) {
      errors.push('Nama lengkap pejabat/staf user wajib diisi.');
    }
    if (!userForm.password || userForm.password.trim().length < 4) {
      errors.push('Kata sandi akun wajib diisi (minimal 4 karakter).');
    }
    if (!userForm.jabatan || userForm.jabatan.trim().length < 3) {
      errors.push('Jabatan user wajib diisi.');
    }
    if (userForm.allowedAdminTabs.length === 0) {
      errors.push('Pilih minimal 1 Menu / Modul Admin yang diizinkan untuk diakses user ini.');
    }
    const normalizedFormCategories = normalizeCategoryList(userForm.allowedServiceCategories);
    if (
      userForm.allowedAdminTabs.includes('pengurusan_warga') &&
      normalizedFormCategories.length === 0
    ) {
      errors.push(
        'Karena user diberi akses ke menu Pengurusan Warga, pilih minimal 1 Bidang Layanan yang diizinkan.'
      );
    }

    const duplicate = adminUsers.some(
      (u) => u.id !== editingUserId && u.username.toLowerCase() === cleanUsername
    );
    if (duplicate) {
      errors.push(`Username "${cleanUsername}" sudah terdaftar. Gunakan username lain.`);
    }

    if (errors.length > 0) {
      setFeedbackErrors(errors);
      return;
    }

    setIsSaving(true);
    const nowLabel = getRealtimeDateString(new Date());

    let nextUsers: AdminUserAccount[];
    if (editingUserId) {
      nextUsers = adminUsers.map((u) =>
        u.id === editingUserId
          ? {
              ...u,
              username: cleanUsername,
              password: userForm.password.trim(),
              fullName: userForm.fullName.trim(),
              nip: userForm.nip.trim() || '-',
              jabatan: userForm.jabatan.trim(),
              unitBidang: userForm.unitBidang.trim() || 'Kelurahan Panaikang',
              phone: userForm.phone.trim(),
              googleEmail: userForm.googleEmail.trim().toLowerCase() || undefined,
              isGoogleVerified: userForm.isGoogleVerified,
              googleVerifiedAt: userForm.isGoogleVerified
                ? u.googleVerifiedAt || nowLabel
                : undefined,
              googleVerifiedBy: userForm.isGoogleVerified
                ? u.googleVerifiedBy || 'Master Admin (Lurah Panaikang)'
                : undefined,
              roleLevel: userForm.roleLevel,
              isMasterLurah: Boolean(
                userForm.isMasterLurah || userForm.roleLevel === 'master_admin'
              ),
              isActive: u.isMasterLurah ? true : userForm.isActive,
              allowedAdminTabs: userForm.isMasterLurah
                ? ADMIN_MODULE_OPTIONS.map((m) => m.id)
                : userForm.allowedAdminTabs,
              allowedServiceCategories: userForm.isMasterLurah
                ? [...allCategoryIds]
                : normalizedFormCategories,
              actionPermissions: userForm.isMasterLurah
                ? {
                    canCreate: true,
                    canEdit: true,
                    canDelete: true,
                    canVerifyAndIssueLetter: true,
                    canConfigureCatalog: true,
                    canManageWhatsApp: true,
                    canExportPrintPdf: true,
                  }
                : userForm.actionPermissions,
              updatedAt: `${nowLabel} · Diperbarui`,
              notes: userForm.notes.trim(),
            }
          : u
      );
    } else {
      const created: AdminUserAccount = {
        id: `usr-${Date.now()}`,
        username: cleanUsername,
        password: userForm.password.trim(),
        fullName: userForm.fullName.trim(),
        nip: userForm.nip.trim() || '-',
        jabatan: userForm.jabatan.trim(),
        unitBidang: userForm.unitBidang.trim() || 'Kelurahan Panaikang',
        phone: userForm.phone.trim(),
        googleEmail: userForm.googleEmail.trim().toLowerCase() || undefined,
        isGoogleVerified: userForm.isGoogleVerified,
        googleVerifiedAt: userForm.isGoogleVerified ? nowLabel : undefined,
        googleVerifiedBy: userForm.isGoogleVerified
          ? 'Master Admin (Lurah Panaikang)'
          : undefined,
        roleLevel: userForm.roleLevel,
        isMasterLurah: Boolean(
          userForm.isMasterLurah || userForm.roleLevel === 'master_admin'
        ),
        isActive: userForm.isActive,
        allowedAdminTabs: userForm.allowedAdminTabs,
        allowedServiceCategories: normalizedFormCategories,
        actionPermissions: userForm.actionPermissions,
        createdAt: nowLabel,
        updatedAt: nowLabel,
        lastLoginAt: 'Belum login',
        notes: userForm.notes.trim(),
      };
      nextUsers = [...adminUsers, created];
    }

    const res = await onSaveAdminUsers(nextUsers);
    setIsSaving(false);

    if (!res.ok) {
      setFeedbackErrors(res.errors || ['Gagal menyimpan parameter user admin.']);
      return;
    }

    setShowUserModal(false);
    setEditingUserId(null);
    setFeedbackSuccess(
      editingUserId
        ? `Akun user "${userForm.fullName}" beserta batasan aksesnya berhasil diperbarui.`
        : `Akun user admin baru "${userForm.fullName}" (@${cleanUsername}) berhasil ditambahkan.`
    );
  };

  // Direct inline toggle for active status or permissions from the Quick Matrix
  const handleQuickToggleActive = async (user: AdminUserAccount) => {
    if (user.isMasterLurah) {
      setFeedbackErrors(['Akun Master Admin (Lurah) utama tidak dapat dinonaktifkan.']);
      return;
    }
    const nextUsers = adminUsers.map((u) =>
      u.id === user.id
        ? { ...u, isActive: !u.isActive, updatedAt: `${getRealtimeDateString(new Date())} · Diperbarui` }
        : u
    );
    await onSaveAdminUsers(nextUsers);
    setFeedbackSuccess(
      `Status akun "${user.fullName}" diubah menjadi ${!user.isActive ? 'AKTIF' : 'NONAKTIF'}.`
    );
  };

  const handleQuickUpdateUserPermissions = async (
    userId: string,
    updater: (u: AdminUserAccount) => AdminUserAccount,
    summaryText: string
  ) => {
    const nextUsers = adminUsers.map((u) => (u.id === userId ? updater(u) : u));
    saveAdminUsersJournal(nextUsers, Date.now());
    await onSaveAdminUsers(nextUsers);
    setFeedbackSuccess(summaryText);
  };

  const handleDeleteUser = async (userId: string) => {
    const target = adminUsers.find((u) => u.id === userId);
    if (!target) return;
    if (target.isMasterLurah && adminUsers.filter((u) => u.isMasterLurah).length <= 1) {
      setFeedbackErrors(['Akun Master Admin (Lurah) utama tidak dapat dihapus.']);
      setConfirmDeleteUserId(null);
      return;
    }
    const nextUsers = adminUsers.filter((u) => u.id !== userId);
    const res = await onSaveAdminUsers(nextUsers);
    setConfirmDeleteUserId(null);
    if (res.ok) {
      setFeedbackSuccess(`Akun user "${target.fullName}" (@${target.username}) telah dihapus.`);
    }
  };

  if (!isMasterLurah) {
    return (
      <div className="bg-white rounded-2xl border border-amber-200 p-6 sm:p-8 text-center shadow-xs">
        <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto mb-3">
          <Lock className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-extrabold text-[#0D3868]">
          Menu Parameter User & Hak Akses Khusus Master Admin (Lurah)
        </h2>
        <p className="mt-1.5 text-xs sm:text-sm text-slate-600 max-w-xl mx-auto">
          Pengelolaan akun user admin (tambah, edit, hapus) serta penentuan batasan akses modul
          hanya dapat dilakukan oleh <strong>Master Admin / Super Admin (Lurah Panaikang)</strong>.
        </p>
      </div>
    );
  }

  const totalActiveUsers = adminUsers.filter((u) => u.isActive).length;
  const totalMasterUsers = adminUsers.filter(
    (u) => u.isMasterLurah || u.roleLevel === 'master_admin'
  ).length;
  const totalBidangAndOperator = adminUsers.length - totalMasterUsers;
  const totalSubMenusCount = ADMIN_MODULE_OPTIONS.reduce(
    (acc, m) => acc + m.subMenus.length,
    0
  );

  return (
    <div className="space-y-6">
      {/* Top Banner & Summary Metrics */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="bg-gradient-to-r from-[#0D3868] via-[#0B2F57] to-[#1C8237] px-5 sm:px-6 py-5 text-white flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-white/15 text-[11px] font-bold uppercase tracking-wider text-emerald-200 mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>
                Sub-Menu 2: Parameter Admin · Struktur Perwali Kota Makassar No. 65 Tahun 2023
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-white">
              Parameter Admin: Manajemen Akun Pejabat & Batasan Hak Akses (RBAC)
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-sky-100 max-w-3xl">
              Kelola akun pejabat struktural (Lurah, Sekretaris Lurah, 3 Kasi, Staf Seksi, Ketua
              LPM & Operator PTSP) serta atur hak akses ke <strong>12 Menu Utama Admin</strong> (
              {totalSubMenusCount} Sub-Modul),{' '}
              <strong>13 Layanan Administrasi Surat Resmi (PM-01 s/d SL-13)</strong>, dan{' '}
              <strong>9 Kategori Pengaduan Warga</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              disabled={isSaving}
              onClick={handleSyncWithStructuralProfile}
              title="Sinkronkan Nama, NIP, Jabatan & Hak Akses dari Struktur Profil Kelurahan (Perwali 65/2023)"
              className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/25 text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isSaving ? 'animate-spin' : ''}`} />
              <span>Sinkronkan dari Struktur Profil</span>
            </button>

            <button
              type="button"
              onClick={openAddUserModal}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs sm:text-sm font-extrabold shadow-sm transition-colors cursor-pointer shrink-0"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Tambah Akun User Admin</span>
            </button>
          </div>
        </div>

        {/* 4 Summary Cards */}
        <div className="p-5 sm:p-6 grid grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-50/70 border-b border-slate-200">
          <div className="bg-white p-3.5 rounded-xl border border-slate-200">
            <div className="text-[11px] font-bold text-slate-500 uppercase">
              Total Akun Terdaftar
            </div>
            <div className="mt-1 text-2xl font-extrabold text-[#0D3868] font-mono-num">
              {adminUsers.length} Akun
            </div>
            <div className="mt-0.5 text-[11px] text-slate-500">
              Lurah, Seklur, 3 Kasi, Staf & Operator
            </div>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-emerald-200">
            <div className="text-[11px] font-bold text-emerald-700 uppercase">
              Status Akun Aktif
            </div>
            <div className="mt-1 text-2xl font-extrabold text-emerald-700 font-mono-num">
              {totalActiveUsers} Aktif
            </div>
            <div className="mt-0.5 text-[11px] text-slate-500">
              {adminUsers.length - totalActiveUsers} Akun Nonaktif / Dibekukan
            </div>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-sky-200">
            <div className="text-[11px] font-bold text-[#0277BD] uppercase">
              Cakupan Menu & ModulSaat Ini
            </div>
            <div className="mt-1 text-2xl font-extrabold text-[#0277BD] font-mono-num">
              {ADMIN_MODULE_OPTIONS.length} Menu
            </div>
            <div className="mt-0.5 text-[11px] text-slate-500">
              {totalSubMenusCount} Sub-Modul (BSU/Teba/Biopori, Siskamling, Bagan, dll.)
            </div>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-amber-200">
            <div className="text-[11px] font-bold text-amber-800 uppercase">
              Layanan Surat & Aduan Warga
            </div>
            <div className="mt-1 text-2xl font-extrabold text-amber-700 font-mono-num">
              {OFFICIAL_13_WARGA_SERVICES.length} Surat · {REPORT_COMPLAINT_CATEGORIES.length} Aduan
            </div>
            <div className="mt-0.5 text-[11px] text-slate-500">
              Terpetakan dalam {serviceCatalog.length} Bidang Layanan
            </div>
          </div>
        </div>

        {/* Overview of Current Menu Architecture & Structural Mapping */}
        <div className="px-5 sm:px-6 py-3.5 bg-sky-50/60 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-[#0D3868] font-bold">
            <Layers className="w-4 h-4 text-[#0277BD] shrink-0" />
            <span>
              Struktur Menu Aktif Saat Ini: Dashboard Lurah · Pengurusan Warga (13 Surat & 9 Aduan)
              · Profil & Bagan Kelurahan · Info & IG · Laporan & WA · Sampah (BSU, Teba, Biopori) ·
              Kerja Bakti · Urban Farming (7 Sub-Modul) · RT/RW, Bagan LPM & Siskamling · Traffic
              Real-Time · Parameter User · Log Aktivitas WITA
            </span>
          </div>
        </div>

        {/* Search & Filter Controls */}
        <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama pejabat/staf, username, NIP, seksi bidang, atau jabatan..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-900 focus:border-[#0D3868] focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as 'ALL' | AdminRoleLevel)}
              className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 bg-white focus:border-[#0D3868] focus:outline-none"
            >
              <option value="ALL">Semua Level Peran ({adminUsers.length})</option>
              <option value="master_admin">Master / Super Admin (Lurah)</option>
              <option value="admin_bidang">Admin Bidang (Seklur / 3 Kasi)</option>
              <option value="operator">Staf Seksi / Operator Pelayanan</option>
              <option value="viewer">Viewer / Monitoring & LPM</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as 'ALL' | 'ACTIVE' | 'INACTIVE')
              }
              className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 bg-white focus:border-[#0D3868] focus:outline-none"
            >
              <option value="ALL">Semua Status Akun</option>
              <option value="ACTIVE">Status Aktif</option>
              <option value="INACTIVE">Status Nonaktif</option>
            </select>
          </div>
        </div>
      </div>

      {/* Feedback Notifications */}
      {feedbackErrors.length > 0 && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-900 flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5 text-xs sm:text-sm">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold">Validasi Parameter User Gagal:</div>
              <ul className="mt-1 list-disc list-inside space-y-0.5">
                {feedbackErrors.map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackErrors([])}
            className="text-red-500 hover:text-red-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {feedbackSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-xs sm:text-sm font-semibold">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{feedbackSuccess}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackSuccess('')}
            className="text-xs font-bold text-emerald-800 hover:underline cursor-pointer"
          >
            Tutup
          </button>
        </div>
      )}

      {/* User Account Cards & Interactive Access Restrictions List */}
      <div className="space-y-4">
        {filteredUsers.map((user) => {
          const roleMeta = ROLE_LEVEL_LABELS[user.roleLevel] || ROLE_LEVEL_LABELS.operator;
          const isExpanded = expandedPermissionUserId === user.id;
          const isPasswordVisible = Boolean(revealedPasswordIds[user.id]);
          const isCurrentSessionUser =
            user.username.toLowerCase() === currentUsername.toLowerCase();
          const normalizedUserCats = normalizeCategoryList(user.allowedServiceCategories);

          return (
            <div
              key={user.id}
              className={`bg-white rounded-2xl border transition-all overflow-hidden shadow-xs ${
                !user.isActive
                  ? 'border-slate-200 bg-slate-50/60 opacity-85'
                  : user.isMasterLurah
                  ? 'border-[#0D3868]/35'
                  : 'border-slate-200'
              }`}
            >
              {/* Card Header: Identity, Credentials, Status & CRUD Buttons */}
              <div className="p-5 sm:p-6 flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold border ${roleMeta.badgeClass}`}
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      {roleMeta.label}
                    </span>

                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold border ${
                        user.isActive
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-red-50 text-red-800 border-red-200'
                      }`}
                    >
                      {user.isActive ? (
                        <>
                          <Unlock className="w-3 h-3" /> Akun Aktif
                        </>
                      ) : (
                        <>
                          <Lock className="w-3 h-3" /> Akun Nonaktif
                        </>
                      )}
                    </span>

                    {isCurrentSessionUser && (
                      <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 text-[10px] font-extrabold">
                        Sesi Anda Saat Ini
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
                      {user.fullName}
                    </h3>
                    <div className="text-xs font-semibold text-[#0D3868]">
                      {user.jabatan} · <span className="text-slate-600">{user.unitBidang}</span>
                    </div>
                  </div>

                  {/* Credentials & Metadata Strip */}
                  <div className="pt-1 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-600">
                    <div className="inline-flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                      <span className="text-slate-500 font-medium">Username:</span>
                      <span className="font-mono-num font-bold text-[#0D3868]">
                        {user.username}
                      </span>
                    </div>

                    <div className="inline-flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                      <KeyRound className="w-3.5 h-3.5 text-slate-500" />
                      <span className="text-slate-500 font-medium">Sandi:</span>
                      <span className="font-mono-num font-bold text-slate-800">
                        {isPasswordVisible ? user.password : '••••••••••'}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setRevealedPasswordIds((prev) => ({
                            ...prev,
                            [user.id]: !prev[user.id],
                          }))
                        }
                        className="text-slate-500 hover:text-[#0D3868] cursor-pointer ml-0.5"
                        title="Lihat / Sembunyikan Kata Sandi"
                      >
                        {isPasswordVisible ? (
                          <EyeOff className="w-3.5 h-3.5" />
                        ) : (
                          <Eye className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    <div>
                      <span className="text-slate-400">NIP:</span>{' '}
                      <span className="font-mono-num font-semibold text-slate-800">
                        {user.nip || '-'}
                      </span>
                    </div>

                    {user.phone && (
                      <div className="inline-flex items-center gap-1">
                        <Phone className="w-3 h-3 text-emerald-700" />
                        <span className="font-mono-num font-semibold text-slate-700">
                          {user.phone}
                        </span>
                      </div>
                    )}

                    {user.lastLoginAt && (
                      <div className="text-[11px] text-slate-500">
                        Login Terakhir:{' '}
                        <span className="font-mono-num font-semibold text-slate-700">
                          {user.lastLoginAt}
                        </span>
                      </div>
                    )}
                  </div>

                  {user.notes && (
                    <p className="text-xs text-slate-500 italic">{user.notes}</p>
                  )}
                </div>

                {/* Right Action Buttons: Atur Batasan Akses, Edit Akun, Aktif/Nonaktif, Hapus */}
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedPermissionUserId(isExpanded ? null : user.id)
                    }
                    className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                      isExpanded
                        ? 'bg-[#0D3868] text-white border-[#0D3868]'
                        : 'bg-sky-50 text-[#0D3868] border-sky-200 hover:bg-sky-100'
                    }`}
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>
                      {isExpanded ? 'Tutup Batasan Akses' : 'Atur Batasan Akses'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => openEditUserModal(user)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold border border-slate-200 transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit User</span>
                  </button>

                  {!user.isMasterLurah && (
                    <button
                      type="button"
                      onClick={() => handleQuickToggleActive(user)}
                      className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                        user.isActive
                          ? 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-200'
                          : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border-emerald-200'
                      }`}
                    >
                      {user.isActive ? (
                        <>
                          <Lock className="w-3.5 h-3.5" />
                          <span>Nonaktifkan</span>
                        </>
                      ) : (
                        <>
                          <Unlock className="w-3.5 h-3.5" />
                          <span>Aktifkan</span>
                        </>
                      )}
                    </button>
                  )}

                  {!user.isMasterLurah && (
                    <>
                      {confirmDeleteUserId === user.id ? (
                        <div className="inline-flex items-center gap-1 bg-red-50 border border-red-200 px-2.5 py-1.5 rounded-xl">
                          <span className="text-[11px] font-bold text-red-800 mr-1">
                            Hapus akun?
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDeleteUser(user.id)}
                            className="px-2 py-1 rounded-lg bg-red-600 text-white text-[11px] font-bold hover:bg-red-700 cursor-pointer"
                          >
                            Ya, Hapus
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteUserId(null)}
                            className="px-2 py-1 rounded-lg bg-white text-slate-700 text-[11px] font-semibold border border-slate-200 cursor-pointer"
                          >
                            Batal
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteUserId(user.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold border border-red-200 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Hapus</span>
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Compact Summary of Allowed Access */}
              <div className="px-5 sm:px-6 py-3 bg-slate-50 border-t border-slate-200/80 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-bold text-slate-500 mr-1">
                    Akses Menu Admin ({user.allowedAdminTabs.length}/{ADMIN_MODULE_OPTIONS.length}):
                  </span>
                  {ADMIN_MODULE_OPTIONS.map((mod) => {
                    const allowed = user.allowedAdminTabs.includes(mod.id);
                    return (
                      <span
                        key={mod.id}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                          allowed
                            ? mod.badgeColor
                            : 'bg-slate-100 text-slate-400 border-slate-200 line-through'
                        }`}
                      >
                        {allowed ? <Check className="w-2.5 h-2.5" /> : <Lock className="w-2.5 h-2.5" />}
                        {mod.label}
                      </span>
                    );
                  })}
                </div>

                <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                  <span className="text-[11px] font-bold text-slate-500">
                    Bidang Layanan Warga:
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-sky-100 text-[#0D3868] text-[11px] font-extrabold font-mono-num">
                    {normalizedUserCats.length} / {serviceCatalog.length} Bidang
                  </span>
                </div>
              </div>

              {/* Expanded Interactive Access Restriction Matrix (Direct Toggle by Super Admin / Lurah) */}
              {isExpanded && (
                <div className="p-5 sm:p-6 bg-sky-50/40 border-t border-sky-200 space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-sky-200/80">
                    <div>
                      <h4 className="text-sm font-extrabold text-[#0D3868] flex items-center gap-2">
                        <Sliders className="w-4 h-4 text-[#0277BD]" />
                        <span>
                          Konfigurasi Langsung Batasan Akses User: {user.fullName} (@{user.username})
                        </span>
                      </h4>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Klik pada kotak modul (beserta sub-fiturnya), bidang layanan (13 Surat Resmi &
                        9 Aduan), atau hak aksi di bawah ini untuk mengatur akses secara langsung.
                      </p>
                    </div>
                    {user.isMasterLurah && (
                      <span className="px-3 py-1 rounded-lg bg-amber-100 text-amber-900 text-xs font-bold border border-amber-300">
                        Akun Master Lurah memiliki akses penuh ke seluruh 12 modul
                      </span>
                    )}
                  </div>

                  {/* Section 1: Batasan Akses 12 Modul Halaman Admin & Sub-Fitur Terkini */}
                  <div>
                    <div className="text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-2.5">
                      1. Batasan Akses 12 Menu / Modul Halaman Admin (Beserta Sub-Modul Terkini)
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                      {ADMIN_MODULE_OPTIONS.map((mod) => {
                        const isChecked = user.allowedAdminTabs.includes(mod.id);
                        return (
                          <button
                            key={mod.id}
                            type="button"
                            disabled={Boolean(user.isMasterLurah)}
                            onClick={() => {
                              const nextTabs = isChecked
                                ? user.allowedAdminTabs.filter((t) => t !== mod.id)
                                : [...user.allowedAdminTabs, mod.id];
                              if (nextTabs.length === 0) return;
                              handleQuickUpdateUserPermissions(
                                user.id,
                                (u) => ({
                                  ...u,
                                  allowedAdminTabs: nextTabs,
                                  updatedAt: `${getRealtimeDateString(new Date())} · Diperbarui`,
                                }),
                                `Batasan akses menu "${mod.label}" untuk ${user.fullName} berhasil diperbarui.`
                              );
                            }}
                            className={`flex items-start gap-2.5 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                              isChecked
                                ? 'bg-white border-[#0D3868] shadow-2xs'
                                : 'bg-slate-100/70 border-slate-200 opacity-65 hover:opacity-100'
                            }`}
                          >
                            <div
                              className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center shrink-0 border ${
                                isChecked
                                  ? 'bg-[#0D3868] border-[#0D3868] text-white'
                                  : 'bg-white border-slate-300'
                              }`}
                            >
                              {isChecked && <Check className="w-3 h-3" />}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-bold text-slate-900">{mod.label}</div>
                              <div className="text-[11px] text-slate-500 leading-snug mt-0.5">
                                {mod.description}
                              </div>
                              <div className="mt-1.5 flex flex-wrap gap-1">
                                {mod.subMenus.map((sub, sIdx) => (
                                  <span
                                    key={sIdx}
                                    className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[9px] font-semibold border border-slate-200"
                                  >
                                    {sub}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Section 2: Batasan Akses 7 Bidang Pengurusan Warga (13 Surat Resmi & 9 Kategori Aduan) */}
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <div className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                        2. Batasan Akses 7 Bidang Layanan Warga (13 Layanan Surat Resmi & 9 Kategori Aduan)
                      </div>
                      {!user.isMasterLurah && (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              handleQuickUpdateUserPermissions(
                                user.id,
                                (u) => ({
                                  ...u,
                                  allowedServiceCategories: [...allCategoryIds],
                                  updatedAt: `${getRealtimeDateString(new Date())} · Diperbarui`,
                                }),
                                `Seluruh 7 bidang layanan diaktifkan untuk ${user.fullName}.`
                              )
                            }
                            className="text-[11px] font-bold text-[#0277BD] hover:underline cursor-pointer"
                          >
                            Pilih Semua 7 Bidang
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                      {serviceCatalog.map((cat) => {
                        const canonicalId = normalizeServiceCategoryId(cat.id);
                        const isChecked = normalizedUserCats.includes(canonicalId);
                        const mapInfo = CATEGORY_CURRENT_SERVICES_MAP[canonicalId];
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            disabled={Boolean(user.isMasterLurah)}
                            onClick={() => {
                              const nextCats = isChecked
                                ? normalizedUserCats.filter((c) => c !== canonicalId)
                                : [...normalizedUserCats, canonicalId];
                              if (nextCats.length === 0) return;
                              handleQuickUpdateUserPermissions(
                                user.id,
                                (u) => ({
                                  ...u,
                                  allowedServiceCategories: nextCats,
                                  updatedAt: `${getRealtimeDateString(new Date())} · Diperbarui`,
                                }),
                                `Batasan bidang "${cat.title}" untuk ${user.fullName} berhasil diperbarui.`
                              );
                            }}
                            className={`flex items-start gap-2.5 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                              isChecked
                                ? 'bg-white border-emerald-600 shadow-2xs'
                                : 'bg-slate-100/70 border-slate-200 opacity-65 hover:opacity-100'
                            }`}
                          >
                            <div
                              className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center shrink-0 border ${
                                isChecked
                                  ? 'bg-emerald-600 border-emerald-600 text-white'
                                  : 'bg-white border-slate-300'
                              }`}
                            >
                              {isChecked && <Check className="w-3 h-3" />}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-bold text-slate-900">
                                {cat.number}. {cat.title}
                              </div>
                              <div className="text-[10px] text-emerald-800 font-semibold mt-0.5">
                                {mapInfo?.responsibleSection || 'Seksi Pelayanan Kelurahan'}
                              </div>
                              {mapInfo && mapInfo.officialLetters.length > 0 && (
                                <div className="mt-1 flex flex-wrap gap-1">
                                  {mapInfo.officialLetters.map((ltr, lIdx) => (
                                    <span
                                      key={lIdx}
                                      className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-900 text-[9px] font-semibold border border-emerald-200"
                                    >
                                      {ltr}
                                    </span>
                                  ))}
                                </div>
                              )}
                              {mapInfo && mapInfo.complaintTopics.length > 0 && (
                                <div className="mt-1 text-[10px] text-slate-500">
                                  Aduan: {mapInfo.complaintTopics.join(', ')}
                                </div>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Section 3: Batasan Kewenangan Aksi CRUD & Operasional */}
                  <div>
                    <div className="text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-2.5">
                      3. Batasan Kewenangan Aksi Operasional & CRUD
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                      {ACTION_PERMISSION_OPTIONS.map((perm) => {
                        const isChecked = Boolean(user.actionPermissions?.[perm.key]);
                        return (
                          <button
                            key={perm.key}
                            type="button"
                            disabled={Boolean(user.isMasterLurah)}
                            onClick={() => {
                              handleQuickUpdateUserPermissions(
                                user.id,
                                (u) => ({
                                  ...u,
                                  actionPermissions: {
                                    ...u.actionPermissions,
                                    [perm.key]: !isChecked,
                                  },
                                  updatedAt: `${getRealtimeDateString(new Date())} · Diperbarui`,
                                }),
                                `Kewenangan "${perm.label}" untuk ${user.fullName} berhasil diperbarui.`
                              );
                            }}
                            className={`flex items-start gap-2.5 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                              isChecked
                                ? 'bg-white border-[#0277BD] shadow-2xs'
                                : 'bg-slate-100/70 border-slate-200 opacity-65 hover:opacity-100'
                            }`}
                          >
                            <div
                              className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center shrink-0 border ${
                                isChecked
                                  ? 'bg-[#0277BD] border-[#0277BD] text-white'
                                  : 'bg-white border-slate-300'
                              }`}
                            >
                              {isChecked && <Check className="w-3 h-3" />}
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-slate-900">{perm.label}</div>
                              <div className="text-[11px] text-slate-500 leading-snug mt-0.5">
                                {perm.description}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Action Footer in Quick Access Matrix */}
                  <div className="pt-3 border-t border-sky-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-xs text-emerald-800 font-semibold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>
                        Setiap perubahan centang pada modul, bidang layanan & kewenangan otomatis tersimpan.
                      </span>
                    </div>
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        type="button"
                        onClick={async () => {
                          saveAdminUsersJournal(adminUsers, Date.now());
                          await onSaveAdminUsers(adminUsers);
                          setFeedbackSuccess(
                            `Parameter hak akses untuk pejabat "${user.fullName}" (@${user.username}) berhasil disimpan.`
                          );
                          setExpandedPermissionUserId(null);
                        }}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1C8237] hover:bg-[#146329] text-white text-xs font-extrabold shadow-xs transition cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Simpan Parameter & Tutup Panel</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ================= SEKSI VERIFIKASI & WHITELIST LOGIN ADMIN GOOGLE (OTORITAS MASTER ADMIN) ================= */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="bg-gradient-to-r from-[#0D3868] to-[#1C8237] px-5 sm:px-6 py-4 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center text-emerald-300">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-white">
                Otoritas Master Admin: Verifikasi Login Admin Akun Google
              </h3>
              <p className="text-xs text-sky-100">
                Pencegahan Akses Tak Berizin: Hanya akun Google yang telah diverifikasi Master Admin yang dapat masuk ke Panel Admin.
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-emerald-400/20 text-emerald-200 text-xs font-bold border border-emerald-400/30 w-fit">
            Mode Whitelist Ketat
          </span>
        </div>

        <div className="p-5 sm:p-6 space-y-6">
          {/* Penjelasan Keamanan */}
          <div className="p-4 rounded-xl bg-sky-50/80 border border-sky-200 flex items-start gap-3 text-xs sm:text-sm text-sky-950">
            <ShieldAlert className="w-5 h-5 text-[#0277BD] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">
                Mekanisme Keamanan Login Admin dengan Akun Google:
              </p>
              <p className="text-slate-600 leading-relaxed text-xs">
                Secara default, setiap login Google baru diperlakukan sebagai <strong>Warga</strong> dan diblokir dari Panel Admin.
                Untuk menjadi Administrator, akun Google staf harus <strong>diverifikasi & ditautkan ke akun pejabat</strong> oleh Master Admin Lurah di bawah ini, atau melalui persetujuan permohonan masuk.
              </p>
            </div>
          </div>

          {/* 1. Permohonan Verifikasi Masuk (Pending Requests) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600" />
                <h4 className="text-sm font-extrabold text-slate-900">
                  Permohonan Verifikasi Akun Google Masuk ({googleRequests.filter((r) => r.status === 'Menunggu Persetujuan').length})
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setGoogleRequests(loadGoogleAdminVerificationRequests())}
                className="text-xs text-[#0277BD] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" /> Refresh Data
              </button>
            </div>

            {googleRequests.filter((r) => r.status === 'Menunggu Persetujuan').length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500">
                Tidak ada permohonan verifikasi baru dari staf yang sedang menunggu persetujuan.
              </div>
            ) : (
              <div className="space-y-2">
                {googleRequests
                  .filter((r) => r.status === 'Menunggu Persetujuan')
                  .map((req) => (
                    <div
                      key={req.id}
                      className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/60 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-amber-200 text-amber-900 font-bold flex items-center justify-center shrink-0">
                          {req.email.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-extrabold text-slate-900 flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-slate-500" />
                            <span>{req.email}</span>
                          </div>
                          <div className="text-slate-500 text-[11px] mt-0.5">
                            Nama Google: {req.displayName || '-'} · Diajukan pada: {req.requestedAt}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <select
                          id={`select-admin-${req.id}`}
                          defaultValue=""
                          className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-700"
                        >
                          <option value="">-- Tautkan ke Akun Pejabat --</option>
                          {adminUsers.map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.fullName} ({u.jabatan})
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => {
                            const sel = document.getElementById(
                              `select-admin-${req.id}`
                            ) as HTMLSelectElement | null;
                            if (!sel || !sel.value) {
                              setFeedbackErrors(['Pilih akun pejabat yang ingin ditautkan terlebih dahulu.']);
                              return;
                            }
                            handleApproveGoogleRequest(req, sel.value);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1 cursor-pointer shadow-xs"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Setujui & Verifikasi</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRejectGoogleRequest(req.id)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold cursor-pointer"
                        >
                          Tolak
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* 2. Daftarkan Email Google Baru Langsung (Pre-Whitelist) */}
          <div className="pt-4 border-t border-slate-200">
            <h4 className="text-sm font-extrabold text-slate-900 mb-2 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-700" />
              <span>Daftarkan & Verifikasi Email Google Staf Baru (Pre-Registration)</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
              <div className="sm:col-span-5">
                <input
                  type="email"
                  value={newGoogleEmail}
                  onChange={(e) => setNewGoogleEmail(e.target.value)}
                  placeholder="Contoh: staf.kelurahan@gmail.com"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:border-[#0D3868] focus:outline-none"
                />
              </div>
              <div className="sm:col-span-4">
                <select
                  value={selectedAdminIdForGoogle}
                  onChange={(e) => setSelectedAdminIdForGoogle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 bg-white focus:border-[#0D3868] focus:outline-none"
                >
                  <option value="">-- Pilih Akun Pejabat/Staf --</option>
                  {adminUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.fullName} ({u.jabatan})
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-3">
                <button
                  type="button"
                  onClick={handleDirectWhitelistGoogle}
                  className="w-full py-2 px-3 rounded-xl bg-[#0D3868] hover:bg-[#072647] text-white text-xs font-bold transition-colors cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Verifikasi Email</span>
                </button>
              </div>
            </div>
          </div>

          {/* 3. Daftar Akun Admin yang Memiliki Otoritas Login Google */}
          <div className="pt-4 border-t border-slate-200">
            <h4 className="text-sm font-extrabold text-slate-900 mb-2 flex items-center gap-2">
              <Mail className="w-4 h-4 text-[#0D3868]" />
              <span>Daftar Akun Administrator Terverifikasi Google Saat Ini</span>
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-2.5 rounded-l-lg">Pejabat / Staf</th>
                    <th className="p-2.5">Jabatan & Seksi</th>
                    <th className="p-2.5">Email Google Tertaut</th>
                    <th className="p-2.5">Status Verifikasi</th>
                    <th className="p-2.5 rounded-r-lg text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {adminUsers
                    .filter((u) => u.googleEmail || u.isMasterLurah)
                    .map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50">
                        <td className="p-2.5 font-bold text-slate-900">
                          {u.fullName}
                          {u.isMasterLurah && (
                            <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] bg-amber-100 text-amber-900">
                              Master Lurah
                            </span>
                          )}
                        </td>
                        <td className="p-2.5 text-slate-600">{u.jabatan}</td>
                        <td className="p-2.5 font-mono-num font-semibold text-[#0D3868]">
                          {u.googleEmail || (u.isMasterLurah ? 'AsmaraCess@gmail.com' : '-')}
                        </td>
                        <td className="p-2.5">
                          {u.isGoogleVerified || u.isMasterLurah ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Terverifikasi Master Admin
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-bold">
                              Belum Terverifikasi
                            </span>
                          )}
                        </td>
                        <td className="p-2.5 text-right">
                          {!u.isMasterLurah && u.isGoogleVerified && (
                            <button
                              type="button"
                              onClick={() => handleRevokeGoogleVerification(u.id)}
                              className="text-xs font-semibold text-red-600 hover:text-red-800 hover:underline cursor-pointer"
                            >
                              Cabut Izin
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* ================= MODAL ADD / EDIT USER & ACCESS PERMISSIONS ================= */}
      {showUserModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-4xl w-full max-h-[92vh] overflow-y-auto shadow-2xl">
            {/* Modal Header */}
            <div className="sticky top-0 z-10 bg-[#0D3868] text-white px-6 py-4 flex items-center justify-between border-b border-white/15">
              <div className="flex items-center gap-2.5">
                <UserPlus className="w-5 h-5 text-emerald-300" />
                <div>
                  <h3 className="text-base sm:text-lg font-extrabold">
                    {editingUserId
                      ? 'Edit Akun User Admin & Batasan Akses (12 Modul & Layanan Terkini)'
                      : 'Tambah Akun User Admin Baru & Tentukan Batasan Akses'}
                  </h3>
                  <p className="text-[11px] text-sky-200">
                    Otoritas Master Admin (Lurah Panaikang) · Struktur Perwali Kota Makassar No. 65 Tahun 2023
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowUserModal(false)}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveUserForm} className="p-6 space-y-6">
              {/* Auto-Fill from Profil Kelurahan / Struktur Organisasi */}
              {structuralCandidates.length > 0 && (
                <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200">
                  <label className="block text-xs font-extrabold text-emerald-950 mb-1.5">
                    Ambil Otomatis Nama, NIP & Jabatan dari Struktur Profil Kelurahan / LPM Saat Ini:
                  </label>
                  <select
                    defaultValue=""
                    onChange={(e) => {
                      const chosen = structuralCandidates.find((c) => c.key === e.target.value);
                      if (!chosen) return;
                      applyAccessPreset(chosen.presetKey, false);
                      setUserForm((prev) => ({
                        ...prev,
                        fullName: chosen.fullName,
                        nip: chosen.nip || prev.nip,
                        username: editingUserId ? prev.username : chosen.suggestedUsername,
                        jabatan: chosen.jabatan,
                        unitBidang: chosen.unitBidang,
                      }));
                    }}
                    className="w-full px-3.5 py-2 rounded-xl border border-emerald-300 bg-white text-xs sm:text-sm font-semibold text-slate-900 focus:border-[#0D3868] focus:outline-none"
                  >
                    <option value="">
                      -- Pilih Pejabat Struktural / Staf Seksi / Ketua LPM dari Data Profil Kelurahan --
                    </option>
                    {structuralCandidates.map((cand) => (
                      <option key={cand.key} value={cand.key}>
                        {cand.label} {cand.nip && cand.nip !== '-' ? `(NIP. ${cand.nip})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Quick Role Preset Selector */}
              <div className="p-4 rounded-2xl bg-sky-50/80 border border-sky-200">
                <div className="flex items-center gap-1.5 text-xs font-extrabold text-[#0D3868] mb-2">
                  <Sparkles className="w-4 h-4 text-[#0277BD]" />
                  <span>
                    Template Cepat Batasan Akses Berdasarkan Struktur Jabatan Perwali No. 65 Tahun 2023 (1-Klik):
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => applyAccessPreset('sekretaris', false)}
                    className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-[#0D3868] hover:text-white text-slate-800 border border-slate-300 text-[11px] font-bold transition-colors cursor-pointer"
                  >
                    Sekretaris Lurah (10 Modul Koordinator)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyAccessPreset('kasi_pemerintahan', false)}
                    className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-[#0D3868] hover:text-white text-slate-800 border border-slate-300 text-[11px] font-bold transition-colors cursor-pointer"
                  >
                    Kasi Pemerintahan & Trantibum (Adminduk, Surat, RT/RW & Siskamling)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyAccessPreset('kasi_pemberdayaan', false)}
                    className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-[#0D3868] hover:text-white text-slate-800 border border-slate-300 text-[11px] font-bold transition-colors cursor-pointer"
                  >
                    Kasi Pemberdayaan Masyarakat, Pembangunan & Sosial (Usaha, Bansos, Urban Farming)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyAccessPreset('kasi_kebersihan', false)}
                    className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-[#0D3868] hover:text-white text-slate-800 border border-slate-300 text-[11px] font-bold transition-colors cursor-pointer"
                  >
                    Kasi Pengelolaan Kebersihan & Pertamanan (BSU, Teba, Biopori, Kerja Bakti)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyAccessPreset('staf_pemerintahan', false)}
                    className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-[#0D3868] hover:text-white text-slate-800 border border-slate-300 text-[11px] font-bold transition-colors cursor-pointer"
                  >
                    Staf Seksi Pemerintahan
                  </button>
                  <button
                    type="button"
                    onClick={() => applyAccessPreset('staf_pemberdayaan', false)}
                    className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-[#0D3868] hover:text-white text-slate-800 border border-slate-300 text-[11px] font-bold transition-colors cursor-pointer"
                  >
                    Staf Seksi Pemberdayaan Masyarakat
                  </button>
                  <button
                    type="button"
                    onClick={() => applyAccessPreset('staf_kebersihan', false)}
                    className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-[#0D3868] hover:text-white text-slate-800 border border-slate-300 text-[11px] font-bold transition-colors cursor-pointer"
                  >
                    Staf Seksi Kebersihan & Pertamanan
                  </button>
                  <button
                    type="button"
                    onClick={() => applyAccessPreset('ketua_lpm', false)}
                    className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-[#0D3868] hover:text-white text-slate-800 border border-slate-300 text-[11px] font-bold transition-colors cursor-pointer"
                  >
                    Ketua LPM / Mitra RT-RW
                  </button>
                  <button
                    type="button"
                    onClick={() => applyAccessPreset('operator_loket', false)}
                    className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-[#0D3868] hover:text-white text-slate-800 border border-slate-300 text-[11px] font-bold transition-colors cursor-pointer"
                  >
                    Operator Loket PTSP (13 Layanan Surat)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyAccessPreset('viewer_monitoring', false)}
                    className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-[#0D3868] hover:text-white text-slate-800 border border-slate-300 text-[11px] font-bold transition-colors cursor-pointer"
                  >
                    Viewer / Monitoring Saja
                  </button>
                  <button
                    type="button"
                    onClick={() => applyAccessPreset('master_lurah', false)}
                    className="px-2.5 py-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300 text-[11px] font-bold transition-colors cursor-pointer"
                  >
                    Super Admin / Lurah (12 Modul Penuh)
                  </button>
                </div>
              </div>

              {/* Section A: Identitas & Kredensial Login */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama Lengkap Pejabat / Staf (Beserta Gelar) *
                  </label>
                  <input
                    type="text"
                    required
                    value={userForm.fullName}
                    onChange={(e) =>
                      setUserForm((prev) => ({ ...prev, fullName: e.target.value }))
                    }
                    placeholder="Contoh: Fentri Amir, SE"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:border-[#0D3868] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    NIP / ID Pegawai
                  </label>
                  <input
                    type="text"
                    value={userForm.nip}
                    onChange={(e) => setUserForm((prev) => ({ ...prev, nip: e.target.value }))}
                    placeholder="Contoh: 198509042009042003"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono-num text-slate-900 focus:border-[#0D3868] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Username Login *
                  </label>
                  <input
                    type="text"
                    required
                    value={userForm.username}
                    onChange={(e) =>
                      setUserForm((prev) => ({
                        ...prev,
                        username: e.target.value.toLowerCase().replace(/\s+/g, '.'),
                      }))
                    }
                    placeholder="Contoh: kasi.pemberdayaan"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono-num text-slate-900 focus:border-[#0D3868] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Kata Sandi Login *
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswordInForm ? 'text' : 'password'}
                      required
                      value={userForm.password}
                      onChange={(e) =>
                        setUserForm((prev) => ({ ...prev, password: e.target.value }))
                      }
                      placeholder="Masukkan kata sandi user"
                      className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-300 text-sm font-mono-num text-slate-900 focus:border-[#0D3868] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswordInForm((p) => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      {showPasswordInForm ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Jabatan Struktural / Fungsional *
                  </label>
                  <input
                    type="text"
                    required
                    value={userForm.jabatan}
                    onChange={(e) =>
                      setUserForm((prev) => ({ ...prev, jabatan: e.target.value }))
                    }
                    placeholder="Contoh: Kasi Pemberdayaan Masyarakat, Pembangunan dan Sosial"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:border-[#0D3868] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Unit / Seksi Bidang Kerja
                  </label>
                  <input
                    type="text"
                    value={userForm.unitBidang}
                    onChange={(e) =>
                      setUserForm((prev) => ({ ...prev, unitBidang: e.target.value }))
                    }
                    placeholder="Contoh: Seksi Pemberdayaan Masyarakat, Pembangunan & Sosial"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:border-[#0D3868] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Level Otoritas Peran *
                  </label>
                  <select
                    value={userForm.roleLevel}
                    onChange={(e) => {
                      const nextRole = e.target.value as AdminRoleLevel;
                      setUserForm((prev) => ({
                        ...prev,
                        roleLevel: nextRole,
                        isMasterLurah: nextRole === 'master_admin',
                      }));
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-900 bg-white focus:border-[#0D3868] focus:outline-none"
                  >
                    <option value="master_admin">Master / Super Admin (Lurah)</option>
                    <option value="admin_bidang">Admin Bidang (Sekretaris / 3 Kasi)</option>
                    <option value="operator">Staf Seksi / Operator Pelayanan</option>
                    <option value="viewer">Viewer / Monitoring & LPM</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nomor WhatsApp / Telepon Aktif
                  </label>
                  <input
                    type="text"
                    value={userForm.phone}
                    onChange={(e) => setUserForm((prev) => ({ ...prev, phone: e.target.value }))}
                    placeholder="Contoh: 081242108800"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono-num text-slate-900 focus:border-[#0D3868] focus:outline-none"
                  />
                </div>

                {/* Email Akun Google & Otorisasi Login Master Admin */}
                <div className="sm:col-span-2 p-4 rounded-2xl bg-sky-50/80 border border-sky-200 space-y-3">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-[#0D3868]" />
                    <span className="text-xs font-bold text-[#0D3868]">
                      Integrasi Login Admin Akun Google (Otoritas Whitelist Master Admin)
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Alamat Email Google Resmi Pejabat / Staf
                      </label>
                      <input
                        type="email"
                        value={userForm.googleEmail}
                        onChange={(e) => {
                          const nextVal = e.target.value.toLowerCase().trim();
                          setUserForm((prev) => ({
                            ...prev,
                            googleEmail: nextVal,
                            isGoogleVerified: nextVal.includes('@') ? true : prev.isGoogleVerified,
                          }));
                        }}
                        placeholder="nama.pejabat@gmail.com"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white focus:border-[#0D3868] focus:outline-none font-mono-num"
                      />
                      <p className="mt-1 text-[10px] text-slate-500">
                        Email Google yang diizinkan untuk tombol Masuk dengan Google.
                      </p>
                    </div>

                    <div className="pt-2 sm:pt-0">
                      <label className="flex items-center gap-2.5 p-3 rounded-xl border border-emerald-300 bg-emerald-50/70 hover:bg-emerald-50 cursor-pointer transition">
                        <input
                          type="checkbox"
                          checked={userForm.isGoogleVerified}
                          onChange={(e) =>
                            setUserForm((prev) => ({
                              ...prev,
                              isGoogleVerified: e.target.checked,
                            }))
                          }
                          className="w-4 h-4 text-emerald-600 rounded-sm focus:ring-emerald-500"
                        />
                        <div>
                          <div className="text-xs font-bold text-emerald-950">
                            Verifikasi Akun Google Ini (Whitelist Aktif)
                          </div>
                          <div className="text-[10px] text-emerald-800">
                            Hanya akun yang dicentang verifikasinya oleh Lurah yang dapat masuk.
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Akun Toggle */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <div className="text-xs font-bold text-slate-800">Status Aktif Akun User</div>
                  <div className="text-[11px] text-slate-500">
                    Jika dinonaktifkan, user ini tidak dapat login ke Panel Administrator.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setUserForm((prev) => ({ ...prev, isActive: !prev.isActive }))
                  }
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                    userForm.isActive
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-slate-200 text-slate-700 border-slate-300'
                  }`}
                >
                  {userForm.isActive ? 'AKTIF (Dapat Login)' : 'NONAKTIF (Dibekukan)'}
                </button>
              </div>

              {/* Section B: Batasan Akses 12 Modul Halaman Admin */}
              <div className="border-t border-slate-200 pt-5">
                <div className="flex items-center justify-between mb-2.5">
                  <div>
                    <h4 className="text-sm font-extrabold text-[#0D3868]">
                      1. Tentukan Batasan Akses 12 Menu / Modul Halaman Admin *
                    </h4>
                    <p className="text-xs text-slate-500">
                      Pilih modul beserta sub-fitur terbaru pada halaman Admin yang dapat dibuka oleh user ini:
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setUserForm((prev) => ({
                          ...prev,
                          allowedAdminTabs: ADMIN_MODULE_OPTIONS.map((m) => m.id),
                        }))
                      }
                      className="text-xs font-bold text-[#0277BD] hover:underline cursor-pointer"
                    >
                      Pilih Semua 12 Modul
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() =>
                        setUserForm((prev) => ({
                          ...prev,
                          allowedAdminTabs: ['pengurusan_warga'],
                        }))
                      }
                      className="text-xs font-bold text-slate-500 hover:underline cursor-pointer"
                    >
                      Hanya Pengurusan Warga
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {ADMIN_MODULE_OPTIONS.map((mod) => {
                    const checked = userForm.allowedAdminTabs.includes(mod.id);
                    return (
                      <button
                        key={mod.id}
                        type="button"
                        onClick={() => toggleTabPermissionInForm(mod.id)}
                        className={`flex items-start gap-2.5 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          checked
                            ? 'bg-sky-50/70 border-[#0D3868] text-slate-900'
                            : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                        }`}
                      >
                        <div
                          className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center shrink-0 border ${
                            checked
                              ? 'bg-[#0D3868] border-[#0D3868] text-white'
                              : 'bg-white border-slate-300'
                          }`}
                        >
                          {checked && <Check className="w-3 h-3" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-bold">{mod.label}</div>
                          <div className="text-[11px] text-slate-500 leading-snug mt-0.5">
                            {mod.description}
                          </div>
                          <div className="mt-1.5 flex flex-wrap gap-1">
                            {mod.subMenus.map((sub, sIdx) => (
                              <span
                                key={sIdx}
                                className="px-1.5 py-0.5 rounded bg-white text-slate-700 text-[9px] font-semibold border border-slate-200"
                              >
                                {sub}
                              </span>
                            ))}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Section C: Batasan Akses 7 Bidang Layanan Pengurusan Warga (13 Surat Resmi & 9 Kategori Aduan) */}
              <div className="border-t border-slate-200 pt-5">
                <div className="flex items-center justify-between mb-2.5">
                  <div>
                    <h4 className="text-sm font-extrabold text-[#0D3868]">
                      2. Tentukan Batasan Bidang Layanan Pengurusan Warga (13 Surat Resmi & 9 Kategori Aduan)
                    </h4>
                    <p className="text-xs text-slate-500">
                      Pilih kategori layanan surat & pengaduan warga yang boleh ditangani oleh user ini:
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setUserForm((prev) => ({
                        ...prev,
                        allowedServiceCategories: [...allCategoryIds],
                      }))
                    }
                    className="text-xs font-bold text-emerald-700 hover:underline cursor-pointer"
                  >
                    Izinkan Semua 7 Bidang
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  {serviceCatalog.map((cat) => {
                    const canonicalId = normalizeServiceCategoryId(cat.id);
                    const normalizedFormCats = normalizeCategoryList(
                      userForm.allowedServiceCategories
                    );
                    const checked = normalizedFormCats.includes(canonicalId);
                    const mapInfo = CATEGORY_CURRENT_SERVICES_MAP[canonicalId];
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => toggleCategoryPermissionInForm(canonicalId)}
                        className={`flex items-start gap-2.5 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          checked
                            ? 'bg-emerald-50/70 border-emerald-600 text-slate-900'
                            : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                        }`}
                      >
                        <div
                          className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center shrink-0 border ${
                            checked
                              ? 'bg-emerald-600 border-emerald-600 text-white'
                              : 'bg-white border-slate-300'
                          }`}
                        >
                          {checked && <Check className="w-3 h-3" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-bold">
                            {cat.number}. {cat.title}
                          </div>
                          <div className="text-[10px] text-emerald-800 font-semibold mt-0.5">
                            {mapInfo?.responsibleSection || 'Seksi Pelayanan Kelurahan'}
                          </div>
                          {mapInfo && mapInfo.officialLetters.length > 0 && (
                            <div className="mt-1 flex flex-wrap gap-1">
                              {mapInfo.officialLetters.map((ltr, lIdx) => (
                                <span
                                  key={lIdx}
                                  className="px-1.5 py-0.5 rounded bg-white text-emerald-900 text-[9px] font-semibold border border-emerald-200"
                                >
                                  {ltr}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Section D: Batasan Kewenangan Aksi CRUD & Operasional */}
              <div className="border-t border-slate-200 pt-5">
                <h4 className="text-sm font-extrabold text-[#0D3868] mb-1">
                  3. Tentukan Batasan Kewenangan Aksi Operasional & CRUD
                </h4>
                <p className="text-xs text-slate-500 mb-2.5">
                  Atur kewenangan spesifik (Tambah, Edit, Hapus, Terbitkan Nomor Surat, Cetak PDF):
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  {ACTION_PERMISSION_OPTIONS.map((perm) => {
                    const checked = Boolean(userForm.actionPermissions[perm.key]);
                    return (
                      <button
                        key={perm.key}
                        type="button"
                        onClick={() => toggleActionPermissionInForm(perm.key)}
                        className={`flex items-start gap-2.5 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          checked
                            ? 'bg-sky-50/70 border-[#0277BD] text-slate-900'
                            : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                        }`}
                      >
                        <div
                          className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center shrink-0 border ${
                            checked
                              ? 'bg-[#0277BD] border-[#0277BD] text-white'
                              : 'bg-white border-slate-300'
                          }`}
                        >
                          {checked && <Check className="w-3 h-3" />}
                        </div>
                        <div>
                          <div className="text-xs font-bold">{perm.label}</div>
                          <div className="text-[11px] text-slate-500 leading-snug mt-0.5">
                            {perm.description}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Catatan Tugas */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Catatan Tupoksi / Keterangan Akses
                </label>
                <input
                  type="text"
                  value={userForm.notes}
                  onChange={(e) => setUserForm((prev) => ({ ...prev, notes: e.target.value }))}
                  placeholder="Contoh: Penanggung jawab verifikasi surat kependudukan dan pengantar RT/RW"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-900 focus:border-[#0D3868] focus:outline-none"
                />
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0D3868] hover:bg-[#072647] text-white text-xs sm:text-sm font-extrabold shadow-sm cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>
                    {isSaving
                      ? 'Menyimpan...'
                      : editingUserId
                      ? 'Simpan Perubahan User & Hak Akses'
                      : 'Simpan Akun User Baru'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
