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
} from 'lucide-react';
import {
  AdminUserAccount,
  AdminTabId,
  AdminRoleLevel,
  AdminActionPermissions,
} from '../types';
import { ServiceCategoryGroup } from '../data/wargaServiceCatalog';

interface AdminParameterUserPanelProps {
  adminUsers: AdminUserAccount[];
  serviceCatalog: ServiceCategoryGroup[];
  currentUsername: string;
  isMasterLurah: boolean;
  onSaveAdminUsers: (
    updatedUsers: AdminUserAccount[]
  ) => Promise<{ ok: boolean; errors?: string[] }>;
}

export const ADMIN_MODULE_OPTIONS: {
  id: AdminTabId;
  label: string;
  description: string;
  badgeColor: string;
}[] = [
  {
    id: 'dashboard_lurah',
    label: 'Dashboard Lurah',
    description: 'Monitoring eksekutif, disposisi cepat & arsip PDF bulanan',
    badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  },
  {
    id: 'pengurusan_warga',
    label: 'Pengurusan Warga (7 Bidang)',
    description: 'Back-end layanan surat, adminduk, usaha, bansos & pengaduan',
    badgeColor: 'bg-sky-50 text-[#0D3868] border-sky-200',
  },
  {
    id: 'profil',
    label: 'Profil Kelurahan',
    description: 'Data pejabat struktural, visi misi & batas wilayah kelurahan',
    badgeColor: 'bg-indigo-50 text-indigo-800 border-indigo-200',
  },
  {
    id: 'info',
    label: 'Informasi & IG Kelurahan',
    description: 'Publikasi pengumuman warga & sinkronisasi Instagram resmi',
    badgeColor: 'bg-teal-50 text-teal-800 border-teal-200',
  },
  {
    id: 'laporan',
    label: 'Laporan Warga & WA',
    description: 'Tindak lanjut laporan lapangan & daftar nomor WhatsApp penerima',
    badgeColor: 'bg-blue-50 text-blue-800 border-blue-200',
  },
  {
    id: 'sampah',
    label: 'Bank Sampah (BSU RW)',
    description: 'Manajemen unit Bank Sampah RW & log timbangan sampah',
    badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
  },
  {
    id: 'kerjabakti',
    label: 'Kerja Bakti',
    description: 'Jadwal gotong royong warga & dokumentasi kegiatan tuntas',
    badgeColor: 'bg-purple-50 text-purple-800 border-purple-200',
  },
  {
    id: 'rtrw',
    label: 'Data RT & RW',
    description: 'Database Ketua RW, Ketua RT, kontak & jumlah KK wilayah',
    badgeColor: 'bg-slate-100 text-slate-800 border-slate-300',
  },
  {
    id: 'parameter_user',
    label: 'Parameter User & Hak Akses',
    description: 'Manajemen akun admin & konfigurasi batasan akses (Khusus Lurah)',
    badgeColor: 'bg-rose-50 text-rose-800 border-rose-200',
  },
  {
    id: 'log_aktivitas',
    label: 'Log Aktivitas (Audit Trail)',
    description: 'Rekam jejak riwayat perubahan data oleh user admin untuk pengawasan Lurah',
    badgeColor: 'bg-amber-50 text-amber-900 border-amber-200',
  },
];

export const ACTION_PERMISSION_OPTIONS: {
  key: keyof AdminActionPermissions;
  label: string;
  description: string;
}[] = [
  {
    key: 'canCreate',
    label: 'Tambah / Input Data Baru',
    description: 'Mengizinkan user menambah berkas pengajuan, jadwal, atau data baru',
  },
  {
    key: 'canEdit',
    label: 'Edit & Perbarui Status Data',
    description: 'Mengizinkan user mengubah data dan memperbarui status tindak lanjut',
  },
  {
    key: 'canDelete',
    label: 'Hapus Data / Berkas',
    description: 'Mengizinkan user menghapus record data atau berkas pengajuan',
  },
  {
    key: 'canVerifyAndIssueLetter',
    label: 'Verifikasi & Terbitkan Nomor Surat',
    description: 'Mengizinkan user memverifikasi berkas & menerbitkan nomor registrasi surat resmi',
  },
  {
    key: 'canConfigureCatalog',
    label: 'Konfigurasi Katalog SOP & Menu Warga',
    description: 'Mengizinkan user menambah/mengubah sub-menu layanan & persyaratan berkas',
  },
  {
    key: 'canManageWhatsApp',
    label: 'Kelola & Kirim Notifikasi WhatsApp',
    description: 'Mengizinkan user mengelola nomor WA penerima & mengirim broadcast WA resmi',
  },
  {
    key: 'canExportPrintPdf',
    label: 'Cetak Surat Resmi & Unduh PDF',
    description: 'Mengizinkan user mencetak draf/surat resmi kelurahan & mengunduh laporan PDF',
  },
];

export const ROLE_LEVEL_LABELS: Record<
  AdminRoleLevel,
  { label: string; badgeClass: string; desc: string }
> = {
  master_admin: {
    label: 'Master / Super Admin (Lurah)',
    badgeClass: 'bg-[#0D3868] text-white border-[#0D3868]',
    desc: 'Otoritas penuh seluruh modul, penerbitan surat, dan pengaturan batasan akses user.',
  },
  admin_bidang: {
    label: 'Admin Bidang (Seklur / Kasi)',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    desc: 'Pejabat struktural pengelola bidang layanan tertentu beserta verifikasi berkas.',
  },
  operator: {
    label: 'Operator Pelayanan',
    badgeClass: 'bg-sky-50 text-sky-800 border-sky-200',
    desc: 'Petugas operasional input berkas warga, pembaruan status, dan pelayanan loket.',
  },
  viewer: {
    label: 'Viewer / Monitoring Saja',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-300',
    desc: 'Akses baca/monitoring data pada menu yang diizinkan tanpa hak ubah/hapus.',
  },
};

export const AdminParameterUserPanel: React.FC<AdminParameterUserPanelProps> = ({
  adminUsers,
  serviceCatalog,
  currentUsername,
  isMasterLurah,
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
    () => serviceCatalog.map((c) => c.id),
    [serviceCatalog]
  );

  const [userForm, setUserForm] = useState<{
    username: string;
    password: string;
    fullName: string;
    nip: string;
    jabatan: string;
    unitBidang: string;
    phone: string;
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
    unitBidang: 'Pelayanan Terpadu Kelurahan Panaikang',
    phone: '',
    roleLevel: 'operator',
    isMasterLurah: false,
    isActive: true,
    allowedAdminTabs: ['pengurusan_warga', 'laporan'],
    allowedServiceCategories: ['adminduk', 'surat_keterangan'],
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

  // Preset Role Templates for 1-click access configuration
  const applyAccessPreset = (
    presetKey:
      | 'master_lurah'
      | 'sekretaris'
      | 'kasi_pemerintahan'
      | 'kasi_kebersihan'
      | 'kasi_kesra'
      | 'operator_loket'
      | 'viewer_monitoring'
  ) => {
    if (presetKey === 'master_lurah') {
      setUserForm((prev) => ({
        ...prev,
        roleLevel: 'master_admin',
        isMasterLurah: true,
        jabatan: prev.jabatan || 'Lurah Panaikang · Master / Super Admin',
        unitBidang: prev.unitBidang || 'Pimpinan Kelurahan Panaikang',
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
      }));
    } else if (presetKey === 'sekretaris') {
      setUserForm((prev) => ({
        ...prev,
        roleLevel: 'admin_bidang',
        isMasterLurah: false,
        jabatan: prev.jabatan || 'Sekretaris Kelurahan · Koordinator Satu Data',
        unitBidang: 'Sekretariat Kelurahan Panaikang',
        allowedAdminTabs: ['pengurusan_warga', 'profil', 'info', 'laporan', 'rtrw'],
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
      }));
    } else if (presetKey === 'kasi_pemerintahan') {
      setUserForm((prev) => ({
        ...prev,
        roleLevel: 'admin_bidang',
        isMasterLurah: false,
        jabatan: prev.jabatan || 'Kasi Pemerintahan, Ketenteraman & Ketertiban',
        unitBidang: 'Seksi Pemerintahan & Trantib',
        allowedAdminTabs: ['pengurusan_warga', 'laporan', 'rtrw'],
        allowedServiceCategories: ['adminduk', 'surat_keterangan', 'pengaduan_warga'],
        actionPermissions: {
          canCreate: true,
          canEdit: true,
          canDelete: false,
          canVerifyAndIssueLetter: true,
          canConfigureCatalog: false,
          canManageWhatsApp: false,
          canExportPrintPdf: true,
        },
      }));
    } else if (presetKey === 'kasi_kebersihan') {
      setUserForm((prev) => ({
        ...prev,
        roleLevel: 'admin_bidang',
        isMasterLurah: false,
        jabatan: prev.jabatan || 'Kasi Pengelolaan Kebersihan & Lingkungan Hidup',
        unitBidang: 'Seksi Kebersihan & BSU RW',
        allowedAdminTabs: ['pengurusan_warga', 'laporan', 'sampah', 'kerjabakti'],
        allowedServiceCategories: ['masalah_lingkungan', 'pengaduan_warga'],
        actionPermissions: {
          canCreate: true,
          canEdit: true,
          canDelete: false,
          canVerifyAndIssueLetter: true,
          canConfigureCatalog: false,
          canManageWhatsApp: true,
          canExportPrintPdf: true,
        },
      }));
    } else if (presetKey === 'kasi_kesra') {
      setUserForm((prev) => ({
        ...prev,
        roleLevel: 'admin_bidang',
        isMasterLurah: false,
        jabatan: prev.jabatan || 'Kasi Kesejahteraan Rakyat & Pemberdayaan',
        unitBidang: 'Seksi Kesra & Pemberdayaan UMKM',
        allowedAdminTabs: ['pengurusan_warga', 'info'],
        allowedServiceCategories: [
          'pelayanan_usaha',
          'bantuan_sosial',
          'sosial_kemasyarakatan',
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
      }));
    } else if (presetKey === 'operator_loket') {
      setUserForm((prev) => ({
        ...prev,
        roleLevel: 'operator',
        isMasterLurah: false,
        jabatan: prev.jabatan || 'Operator Pelayanan Terpadu Satu Pintu',
        unitBidang: 'Loket Pelayanan Warga',
        allowedAdminTabs: ['pengurusan_warga', 'info', 'laporan'],
        allowedServiceCategories: [
          'adminduk',
          'surat_keterangan',
          'pelayanan_usaha',
          'bantuan_sosial',
          'sosial_kemasyarakatan',
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
      }));
    } else if (presetKey === 'viewer_monitoring') {
      setUserForm((prev) => ({
        ...prev,
        roleLevel: 'viewer',
        isMasterLurah: false,
        jabatan: prev.jabatan || 'Staf Monitoring & Evaluasi Kelurahan',
        unitBidang: 'Monitoring Satu Data',
        allowedAdminTabs: ['pengurusan_warga', 'laporan', 'sampah', 'kerjabakti', 'rtrw'],
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
      }));
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
      roleLevel: 'operator',
      isMasterLurah: false,
      isActive: true,
      allowedAdminTabs: ['pengurusan_warga', 'laporan'],
      allowedServiceCategories: ['adminduk', 'surat_keterangan'],
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
      roleLevel: user.roleLevel,
      isMasterLurah: Boolean(user.isMasterLurah || user.roleLevel === 'master_admin'),
      isActive: user.isActive,
      allowedAdminTabs: [...user.allowedAdminTabs],
      allowedServiceCategories: [...user.allowedServiceCategories],
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
    setUserForm((prev) => {
      const exists = prev.allowedServiceCategories.includes(categoryId);
      const nextCats = exists
        ? prev.allowedServiceCategories.filter((c) => c !== categoryId)
        : [...prev.allowedServiceCategories, categoryId];
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
    if (
      userForm.allowedAdminTabs.includes('pengurusan_warga') &&
      userForm.allowedServiceCategories.length === 0
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
    const nowLabel = '08 Okt 2026';

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
                : userForm.allowedServiceCategories,
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
        roleLevel: userForm.roleLevel,
        isMasterLurah: Boolean(
          userForm.isMasterLurah || userForm.roleLevel === 'master_admin'
        ),
        isActive: userForm.isActive,
        allowedAdminTabs: userForm.allowedAdminTabs,
        allowedServiceCategories: userForm.allowedServiceCategories,
        actionPermissions: userForm.actionPermissions,
        createdAt: nowLabel,
        updatedAt: nowLabel,
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
        ? { ...u, isActive: !u.isActive, updatedAt: '08 Okt 2026 · Diperbarui' }
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

  return (
    <div className="space-y-6">
      {/* Top Banner & Summary Metrics */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="bg-gradient-to-r from-[#0D3868] via-[#0B2F57] to-[#1C8237] px-5 sm:px-6 py-5 text-white flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-white/15 text-[11px] font-bold uppercase tracking-wider text-emerald-200 mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Otoritas Master Admin / Super Admin (Lurah Panaikang)</span>
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-white">
              Parameter User Admin & Konfigurasi Batasan Hak Akses (RBAC)
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-sky-100 max-w-3xl">
              Kelola penambahan, pengeditan, dan penghapusan akun pejabat/operator admin kelurahan,
              serta atur batasan akses menu modul, bidang layanan warga, dan kewenangan aksi CRUD
              untuk setiap user terdaftar.
            </p>
          </div>

          <button
            type="button"
            onClick={openAddUserModal}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs sm:text-sm font-extrabold shadow-sm transition-colors cursor-pointer shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Tambah Akun User Admin</span>
          </button>
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
              Pejabat Struktural & Operator Kelurahan
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
              Master / Super Admin
            </div>
            <div className="mt-1 text-2xl font-extrabold text-[#0277BD] font-mono-num">
              {totalMasterUsers} Lurah
            </div>
            <div className="mt-0.5 text-[11px] text-slate-500">
              Pemegang kendali penuh Parameter User
            </div>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-amber-200">
            <div className="text-[11px] font-bold text-amber-800 uppercase">
              Admin Bidang & Operator
            </div>
            <div className="mt-1 text-2xl font-extrabold text-amber-700 font-mono-num">
              {totalBidangAndOperator} Staf
            </div>
            <div className="mt-0.5 text-[11px] text-slate-500">
              Akses diatur sesuai batasan bidang & modul
            </div>
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
              placeholder="Cari nama pejabat/staf, username, NIP, atau jabatan..."
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
              <option value="admin_bidang">Admin Bidang (Seklur / Kasi)</option>
              <option value="operator">Operator Pelayanan</option>
              <option value="viewer">Viewer / Monitoring Saja</option>
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
                    {user.allowedServiceCategories.length} / {serviceCatalog.length} Bidang
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
                        Klik pada kotak modul, bidang layanan, atau hak aksi di bawah ini untuk
                        mengaktifkan/membatasi akses user secara langsung.
                      </p>
                    </div>
                    {user.isMasterLurah && (
                      <span className="px-3 py-1 rounded-lg bg-amber-100 text-amber-900 text-xs font-bold border border-amber-300">
                        Akun Master Lurah memiliki akses penuh ke seluruh modul
                      </span>
                    )}
                  </div>

                  {/* Section 1: Batasan Akses Modul Halaman Admin */}
                  <div>
                    <div className="text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-2.5">
                      1. Batasan Akses Modul / Menu Halaman Admin
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
                                  updatedAt: '08 Okt 2026 · Diperbarui',
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
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-slate-900">{mod.label}</div>
                              <div className="text-[11px] text-slate-500 leading-snug mt-0.5">
                                {mod.description}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Section 2: Batasan Akses 7 Bidang Pengurusan Warga */}
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <div className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                        2. Batasan Akses 7 Bidang Layanan Pengurusan Warga
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
                                  updatedAt: '08 Okt 2026 · Diperbarui',
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
                        const isChecked = user.allowedServiceCategories.includes(cat.id);
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            disabled={Boolean(user.isMasterLurah)}
                            onClick={() => {
                              const nextCats = isChecked
                                ? user.allowedServiceCategories.filter((c) => c !== cat.id)
                                : [...user.allowedServiceCategories, cat.id];
                              if (nextCats.length === 0) return;
                              handleQuickUpdateUserPermissions(
                                user.id,
                                (u) => ({
                                  ...u,
                                  allowedServiceCategories: nextCats,
                                  updatedAt: '08 Okt 2026 · Diperbarui',
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
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-slate-900">
                                {cat.number}. {cat.title}
                              </div>
                              <div className="text-[11px] text-slate-500 mt-0.5 font-mono-num">
                                {cat.items.length} Sub-Menu Layanan
                              </div>
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
                                  updatedAt: '08 Okt 2026 · Diperbarui',
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
                </div>
              )}
            </div>
          );
        })}
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
                      ? 'Edit Akun User Admin & Batasan Akses'
                      : 'Tambah Akun User Admin Baru & Tentukan Batasan Akses'}
                  </h3>
                  <p className="text-[11px] text-sky-200">
                    Otoritas Master Admin / Super Admin (Lurah Panaikang)
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
              {/* Quick Role Preset Selector */}
              <div className="p-4 rounded-2xl bg-sky-50/80 border border-sky-200">
                <div className="flex items-center gap-1.5 text-xs font-extrabold text-[#0D3868] mb-2">
                  <Sparkles className="w-4 h-4 text-[#0277BD]" />
                  <span>Template Cepat Batasan Akses Berdasarkan Jabatan (1-Klik):</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => applyAccessPreset('sekretaris')}
                    className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-[#0D3868] hover:text-white text-slate-800 border border-slate-300 text-[11px] font-bold transition-colors cursor-pointer"
                  >
                    Sekretaris Kelurahan (Semua Bidang)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyAccessPreset('kasi_pemerintahan')}
                    className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-[#0D3868] hover:text-white text-slate-800 border border-slate-300 text-[11px] font-bold transition-colors cursor-pointer"
                  >
                    Kasi Pemerintahan (Adminduk, Surat, RT/RW)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyAccessPreset('kasi_kebersihan')}
                    className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-[#0D3868] hover:text-white text-slate-800 border border-slate-300 text-[11px] font-bold transition-colors cursor-pointer"
                  >
                    Kasi Kebersihan (Lingkungan, Sampah, Kerja Bakti)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyAccessPreset('kasi_kesra')}
                    className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-[#0D3868] hover:text-white text-slate-800 border border-slate-300 text-[11px] font-bold transition-colors cursor-pointer"
                  >
                    Kasi Kesra (Bansos, Usaha UMKM, Kemasyarakatan)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyAccessPreset('operator_loket')}
                    className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-[#0D3868] hover:text-white text-slate-800 border border-slate-300 text-[11px] font-bold transition-colors cursor-pointer"
                  >
                    Operator Loket Pelayanan
                  </button>
                  <button
                    type="button"
                    onClick={() => applyAccessPreset('viewer_monitoring')}
                    className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-[#0D3868] hover:text-white text-slate-800 border border-slate-300 text-[11px] font-bold transition-colors cursor-pointer"
                  >
                    Viewer / Monitoring Saja
                  </button>
                  <button
                    type="button"
                    onClick={() => applyAccessPreset('master_lurah')}
                    className="px-2.5 py-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300 text-[11px] font-bold transition-colors cursor-pointer"
                  >
                    Super Admin / Lurah (Akses Penuh)
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
                    placeholder="Contoh: Andi Mappanyukki, S.IP"
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
                    placeholder="Contoh: 19871103 201101 1 006"
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
                    placeholder="Contoh: kasi.pemerintahan"
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
                    placeholder="Contoh: Kasi Pemerintahan / Operator Loket"
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
                    placeholder="Contoh: Seksi Pemerintahan & Trantib"
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
                    <option value="admin_bidang">Admin Bidang (Sekretaris / Kasi)</option>
                    <option value="operator">Operator Pelayanan</option>
                    <option value="viewer">Viewer / Monitoring Saja</option>
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

              {/* Section B: Batasan Akses Modul Halaman Admin */}
              <div className="border-t border-slate-200 pt-5">
                <div className="flex items-center justify-between mb-2.5">
                  <div>
                    <h4 className="text-sm font-extrabold text-[#0D3868]">
                      1. Tentukan Batasan Akses Menu / Modul Halaman Admin *
                    </h4>
                    <p className="text-xs text-slate-500">
                      Pilih modul mana saja pada halaman Admin yang dapat dibuka oleh user ini:
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
                      Pilih Semua Modul
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
                        <div>
                          <div className="text-xs font-bold">{mod.label}</div>
                          <div className="text-[11px] text-slate-500 leading-snug mt-0.5">
                            {mod.description}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Section C: Batasan Akses 7 Bidang Layanan Pengurusan Warga */}
              <div className="border-t border-slate-200 pt-5">
                <div className="flex items-center justify-between mb-2.5">
                  <div>
                    <h4 className="text-sm font-extrabold text-[#0D3868]">
                      2. Tentukan Batasan Bidang Layanan Pengurusan Warga (7 Bidang)
                    </h4>
                    <p className="text-xs text-slate-500">
                      Pilih kategori layanan warga yang boleh ditangani oleh user ini:
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
                    const checked = userForm.allowedServiceCategories.includes(cat.id);
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => toggleCategoryPermissionInForm(cat.id)}
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
                        <div>
                          <div className="text-xs font-bold">
                            {cat.number}. {cat.title}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono-num">
                            {cat.items.length} Sub-Menu
                          </div>
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
