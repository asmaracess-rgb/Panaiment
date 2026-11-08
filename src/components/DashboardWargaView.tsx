import React, { useState, useEffect, useMemo } from 'react';
import {
  User,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  LogOut,
  Plus,
  Send,
  Edit3,
  Trash2,
  ShieldCheck,
  MapPin,
  Phone,
  Mail,
  CreditCard,
  ArrowRight,
  ArrowLeft,
  Home,
  X,
  Loader2,
  Building2,
  Bell,
  HelpCircle,
  Layers,
  QrCode,
  Calendar,
  MessageCircle,
  Sprout,
} from 'lucide-react';
import {
  AppView,
  AuthenticatedUserProfile,
  CitizenReport,
  CitizenSubmission,
  ReportCategory,
  ReportUrgency,
  RwGroup,
  PraRegistrasiRecord,
  PengaduanOnlineRecord,
  MasterLayananItem,
  MasterPersyaratanItem,
  PengaduanKategori,
  KelurahanProfile,
  SeedRequestItem,
} from '../types';
import {
  OFFICIAL_13_WARGA_SERVICES,
  REPORT_COMPLAINT_CATEGORIES,
} from '../data/wargaServiceCatalog';
import {
  INITIAL_MASTER_LAYANAN,
  INITIAL_MASTER_PERSYARATAN,
  DAFTAR_KATEGORI_PENGADUAN,
} from '../data/pelayananMasterData';
import { INITIAL_KELURAHAN_PROFILE } from '../data/initialData';
import {
  subscribeToMyCitizenSubmissions,
  updateCitizenProfileInFirestore,
  AUTH_SCHEMA_LIMITS,
} from '../firebase/authService';
import { PelayananKelurahanModule } from './PelayananKelurahanModule';
import { QRCodeModal } from './QRCodeModal';
import { getRealtimeDateTimeString } from '../utils/realtimeDate';
import {
  buildWhatsAppUrl,
  formatDisplayPhone,
  isValidWhatsAppPhone,
  normalizeWhatsAppPhone,
} from '../utils/whatsappHelper';

interface DashboardWargaViewProps {
  userProfile: AuthenticatedUserProfile | null;
  profile?: KelurahanProfile;
  rwGroups: RwGroup[];
  reports: CitizenReport[];
  seedRequests?: SeedRequestItem[];
  praRegistrasiList?: PraRegistrasiRecord[];
  pengaduanList?: PengaduanOnlineRecord[];
  masterLayananList?: MasterLayananItem[];
  masterPersyaratanList?: MasterPersyaratanItem[];
  kategoriPengaduanList?: PengaduanKategori[];
  onAddReport: (
    newReport: Omit<
      CitizenReport,
      | 'id'
      | 'ticketCode'
      | 'createdAt'
      | 'updatedAt'
      | 'upvotes'
      | 'status'
      | 'assignedTeam'
      | 'responseNote'
    >
  ) => string;
  onAddPraRegistrasi?: (
    record: Omit<PraRegistrasiRecord, 'id' | 'ticketCode' | 'submittedAt' | 'updatedAt' | 'status'>
  ) => Promise<string>;
  onAddPengaduan?: (
    record: Omit<PengaduanOnlineRecord, 'id' | 'ticketCode' | 'submittedAt' | 'updatedAt' | 'status'>
  ) => Promise<string>;
  onProfileUpdated: (updated: AuthenticatedUserProfile) => void;
  onLogout: () => Promise<void>;
  onNavigate: (view: AppView) => void;
}

const DEFAULT_RW_OPTIONS = ['RW 01', 'RW 02', 'RW 03', 'RW 04', 'RW 05', 'RW 06', 'RW 07'];
const DEFAULT_RT_OPTIONS = ['RT 01', 'RT 02', 'RT 03', 'RT 04', 'RT 05'];

export const DashboardWargaView: React.FC<DashboardWargaViewProps> = ({
  userProfile,
  profile = INITIAL_KELURAHAN_PROFILE,
  rwGroups,
  reports,
  seedRequests = [],
  praRegistrasiList = [],
  pengaduanList = [],
  masterLayananList = INITIAL_MASTER_LAYANAN,
  masterPersyaratanList = INITIAL_MASTER_PERSYARATAN,
  kategoriPengaduanList = DAFTAR_KATEGORI_PENGADUAN,
  onAddReport,
  onAddPraRegistrasi,
  onAddPengaduan,
  onProfileUpdated,
  onLogout,
  onNavigate,
}) => {
  // Navigation matching the exact user specification:
  // Dashboard | Pelayanan Kelurahan (Pra Registrasi & Pengaduan) | Riwayat Saya | Profil Saya | Notifikasi | Bantuan | Keluar
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'pelayanan' | 'riwayat' | 'profil' | 'notifikasi' | 'bantuan'
  >('dashboard');

  const [pelayananSubModule, setPelayananSubModule] = useState<'hub' | 'pra_registrasi' | 'pengaduan'>('hub');
  const [riwayatSubTab, setRiwayatSubTab] = useState<'pra_registrasi' | 'pengaduan'>('pra_registrasi');

  // Edit Citizen Profile Form
  const [profName, setProfName] = useState(userProfile?.fullName || '');
  const [profNik, setProfNik] = useState(userProfile?.nik || '');
  const [profPhone, setProfPhone] = useState(userProfile?.phone || '');
  const [profRw, setProfRw] = useState(userProfile?.rw || 'RW 01');
  const [profRt, setProfRt] = useState(userProfile?.rt || 'RT 01');
  const [profAddress, setProfAddress] = useState(userProfile?.address || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Feedback
  const [feedbackError, setFeedbackError] = useState('');
  const [feedbackSuccess, setFeedbackSuccess] = useState('');

  // QR Modal
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrModalData, setQrModalData] = useState<{
    ticketCode: string;
    title: string;
    applicantName?: string;
    categoryOrService?: string;
    submittedAt?: string;
    statusBadge?: string;
  }>({
    ticketCode: '',
    title: '',
  });

  useEffect(() => {
    if (!userProfile) return;
    setProfName(userProfile.fullName);
    setProfNik(userProfile.nik || '');
    setProfPhone(userProfile.phone || '');
    setProfRw(userProfile.rw || 'RW 01');
    setProfRt(userProfile.rt || 'RT 01');
    setProfAddress(userProfile.address || '');
  }, [userProfile]);

  // Citizen's submissions
  const myPraList = useMemo(() => {
    return praRegistrasiList.filter((r) => {
      if (userProfile?.uid && r.applicantUid === userProfile.uid) return true;
      if (userProfile?.nik && r.applicantNik === userProfile.nik) return true;
      return false;
    });
  }, [praRegistrasiList, userProfile]);

  const myPengaduanList = useMemo(() => {
    return pengaduanList.filter((p) => {
      if (userProfile?.uid && p.reporterUid === userProfile.uid) return true;
      if (userProfile?.phone && p.reporterPhone === userProfile.phone) return true;
      if (
        userProfile?.fullName &&
        p.reporterName &&
        p.reporterName.trim().toLowerCase() === userProfile.fullName.trim().toLowerCase()
      ) {
        return true;
      }
      return false;
    });
  }, [pengaduanList, userProfile]);

  // Citizen's Seed Requests (Permohonan Bibit Gratis Urban Farming)
  const mySeedRequests = useMemo(() => {
    if (!seedRequests || seedRequests.length === 0 || !userProfile) return [];
    const userPhoneNorm = normalizeWhatsAppPhone(userProfile?.phone);
    const userNameClean = (userProfile?.fullName || '').trim().toLowerCase();

    return seedRequests.filter((req) => {
      const reqNameClean = (req.applicantName || '').trim().toLowerCase();
      const reqPhoneNorm = normalizeWhatsAppPhone(req.applicantPhone);
      if (userNameClean && reqNameClean && (reqNameClean === userNameClean || reqNameClean.includes(userNameClean) || userNameClean.includes(reqNameClean))) {
        return true;
      }
      if (userPhoneNorm && reqPhoneNorm && reqPhoneNorm === userPhoneNorm) {
        return true;
      }
      return false;
    });
  }, [seedRequests, userProfile]);

  const totalNotifCount = myPraList.length + myPengaduanList.length + mySeedRequests.length;

  // Stats
  const totalSubmissions = myPraList.length + myPengaduanList.length;
  const waitingPra = myPraList.filter(
    (r) => r.status === 'DIAJUKAN' || r.status === 'MENUNGGU_KEDATANGAN' || r.status === 'VERIFIKASI_PETUGAS'
  ).length;
  const inProgressPra = myPraList.filter(
    (r) => r.status === 'BERKAS_LENGKAP' || r.status === 'DIPROSES' || r.status === 'MENUNGGU_PERSETUJUAN'
  ).length;
  const completedPra = myPraList.filter(
    (r) => r.status === 'DISETUJUI' || r.status === 'SURAT_SELESAI' || r.status === 'DITUTUP'
  ).length;

  const activePengaduan = myPengaduanList.filter((p) => p.status !== 'SELESAI').length;
  const completedPengaduan = myPengaduanList.filter((p) => p.status === 'SELESAI').length;

  // Save Profile Handler
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackError('');
    setFeedbackSuccess('');

    if (profName.trim().length < AUTH_SCHEMA_LIMITS.NAME_MIN) {
      setFeedbackError('Nama lengkap minimal 2 karakter.');
      return;
    }
    const cleanNik = profNik.replace(/\D/g, '').trim();
    if (cleanNik && cleanNik.length !== 16) {
      setFeedbackError('NIK harus terdiri dari 16 digit angka.');
      return;
    }

    if (!userProfile?.uid) return;
    setIsSavingProfile(true);

    const res = await updateCitizenProfileInFirestore(userProfile.uid, {
      fullName: profName.trim(),
      nik: cleanNik,
      phone: profPhone.trim(),
      rw: profRw,
      rt: profRt,
      address: profAddress.trim(),
    });
    setIsSavingProfile(false);

    if (!res.ok) {
      setFeedbackError(res.error || 'Gagal memperbarui profil warga.');
      return;
    }

    onProfileUpdated({
      ...userProfile,
      fullName: profName.trim(),
      nik: cleanNik,
      phone: profPhone.trim(),
      rw: profRw,
      rt: profRt,
      address: profAddress.trim(),
    });
    setFeedbackSuccess('Profil domisili warga berhasil diperbarui.');
  };

  // Fallback Add Handlers if not passed
  const handleAddPraFallback = async (record: any): Promise<string> => {
    if (onAddPraRegistrasi) {
      return await onAddPraRegistrasi(record);
    }
    const ticketCode = onAddReport({
      ownerId: userProfile?.uid,
      ownerEmail: userProfile?.email,
      title: `Pra Registrasi: ${record.serviceName} - ${record.applicantName}`,
      description: `Registrasi pelayanan online untuk ${record.serviceName}. NIK: ${record.applicantNik}`,
      category: 'Ketertiban & Fasum',
      urgency: 'Normal',
      reporterName: record.applicantName,
      reporterPhone: record.applicantPhone,
      rw: record.applicantRw,
      rt: record.applicantRt,
      locationName: record.applicantAddress,
      mapX: 50,
      mapY: 50,
      coordinatesLabel: 'Loket Pelayanan Kelurahan Panaikang',
      imageUrl: record.uploadedDocs?.[0]?.fileUrl || '',
      serviceCategoryId: 'surat_keterangan',
      serviceCategoryTitle: 'Layanan Administrasi & Persuratan',
      serviceSubItemId: record.serviceCode,
      serviceSubItemLabel: record.serviceName,
      documentCode: record.serviceCode,
      applicantNik: record.applicantNik,
    });
    return ticketCode;
  };

  const handleAddPengaduanFallback = async (record: any): Promise<string> => {
    if (onAddPengaduan) {
      return await onAddPengaduan(record);
    }
    const ticketCode = onAddReport({
      ownerId: userProfile?.uid,
      ownerEmail: userProfile?.email,
      title: record.title,
      description: record.content,
      category: record.category === 'Infrastruktur' ? 'Drainase & Genangan' : 'Sampah Liar & TPS',
      urgency: 'Normal',
      reporterName: record.reporterName,
      reporterPhone: record.reporterPhone,
      rw: record.reporterRw,
      rt: record.reporterRt,
      locationName: record.locationAddress,
      mapX: 50,
      mapY: 50,
      coordinatesLabel: 'Kelurahan Panaikang',
      imageUrl: record.proofPhotos?.[0] || '',
    });
    return ticketCode;
  };

  if (!userProfile) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-lg space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-black text-slate-900">Akses Dashboard Warga</h2>
          <p className="text-xs text-slate-600">
            Silakan masuk terlebih dahulu untuk mengakses layanan dan memantau permohonan Anda.
          </p>
          <button
            type="button"
            onClick={() => onNavigate('login')}
            className="px-5 py-2.5 rounded-xl bg-[#0D3868] text-white text-xs font-black hover:bg-[#072647] cursor-pointer"
          >
            Masuk Akun Warga
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner Identity */}
      <div className="rounded-3xl bg-gradient-to-r from-[#072647] via-[#0D3868] to-[#0277BD] text-white p-6 sm:p-7 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-400/20 border border-emerald-300/40 text-emerald-200 text-[11px] font-extrabold uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Akun Warga Terverifikasi</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-white/15 text-sky-100 text-xs font-mono-num font-bold">
                {userProfile.rw} / {userProfile.rt}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Dashboard Warga — {userProfile.fullName}
            </h1>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-sky-100">
              <span className="inline-flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-sky-300" />
                <span>{userProfile.email}</span>
              </span>
              {userProfile.nik && (
                <span className="inline-flex items-center gap-1.5 font-mono-num">
                  <CreditCard className="w-3.5 h-3.5 text-sky-300" />
                  <span>NIK: {userProfile.nik}</span>
                </span>
              )}
              {userProfile.phone && (
                <span className="inline-flex items-center gap-1.5 font-mono-num">
                  <Phone className="w-3.5 h-3.5 text-sky-300" />
                  <span>{userProfile.phone}</span>
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => onNavigate('beranda')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-white text-xs font-bold transition cursor-pointer"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Beranda Publik</span>
            </button>

            {userProfile.role === 'admin' && (
              <button
                type="button"
                onClick={() => onNavigate('admin')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black transition cursor-pointer shadow-xs"
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Panel Admin</span>
              </button>
            )}

            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Keluar</span>
            </button>
          </div>
        </div>

        {/* 4 Metric Counters */}
        <div className="mt-6 pt-5 border-t border-white/15 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-2xl bg-white/10 border border-white/15 px-4 py-3">
            <div className="text-[11px] text-sky-200 font-semibold">Total Pengajuan Saya</div>
            <div className="text-2xl font-black font-mono-num mt-0.5">{totalSubmissions}</div>
          </div>
          <div className="rounded-2xl bg-amber-400/15 border border-amber-300/30 px-4 py-3">
            <div className="text-[11px] text-amber-200 font-semibold">Menunggu Kedatangan</div>
            <div className="text-2xl font-black font-mono-num text-amber-300 mt-0.5">{waitingPra}</div>
          </div>
          <div className="rounded-2xl bg-sky-400/15 border border-sky-300/30 px-4 py-3">
            <div className="text-[11px] text-sky-200 font-semibold">Sedang Diproses</div>
            <div className="text-2xl font-black font-mono-num text-sky-200 mt-0.5">
              {inProgressPra + activePengaduan}
            </div>
          </div>
          <div className="rounded-2xl bg-emerald-400/15 border border-emerald-300/30 px-4 py-3">
            <div className="text-[11px] text-emerald-200 font-semibold">Selesai / Terbit</div>
            <div className="text-2xl font-black font-mono-num text-emerald-300 mt-0.5">
              {completedPra + completedPengaduan}
            </div>
          </div>
        </div>
      </div>

      {/* Main Tab Navigation Bar */}
      <div className="flex flex-wrap items-center gap-2 bg-white p-2 rounded-2xl border border-slate-200 shadow-2xs">
        <button
          type="button"
          onClick={() => setActiveTab('dashboard')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'dashboard'
              ? 'bg-[#0D3868] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Dashboard</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('pelayanan');
            setPelayananSubModule('hub');
          }}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'pelayanan' && pelayananSubModule === 'hub'
              ? 'bg-[#0277BD] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span>Pelayanan Kelurahan</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('pelayanan');
            setPelayananSubModule('pra_registrasi');
          }}
          className={`px-3.5 py-2.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'pelayanan' && pelayananSubModule === 'pra_registrasi'
              ? 'bg-[#0D3868] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span>📝 Pra Registrasi Online</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('pelayanan');
            setPelayananSubModule('pengaduan');
          }}
          className={`px-3.5 py-2.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'pelayanan' && pelayananSubModule === 'pengaduan'
              ? 'bg-[#E65100] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span>📢 Pengaduan Online</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('riwayat')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'riwayat'
              ? 'bg-[#1C8237] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Riwayat Saya ({totalSubmissions})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('profil')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'profil'
              ? 'bg-slate-800 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Profil Saya</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('notifikasi')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'notifikasi'
              ? 'bg-amber-500 text-slate-950 shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>Notifikasi {totalNotifCount > 0 ? `(${totalNotifCount})` : ''}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('bantuan')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'bantuan'
              ? 'bg-indigo-700 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          <span>Bantuan</span>
        </button>
      </div>

      {/* =========================================================================
          TAB 1: DASHBOARD OVERVIEW
      ========================================================================= */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Quick Action Shortcuts */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <button
              type="button"
              onClick={() => {
                setActiveTab('pelayanan');
                setPelayananSubModule('pra_registrasi');
              }}
              className="p-5 rounded-2xl border-2 border-slate-200 hover:border-[#0277BD] bg-white hover:shadow-md transition text-left flex flex-col justify-between group cursor-pointer"
            >
              <div className="space-y-2">
                <span className="text-2xl">📝</span>
                <h4 className="font-extrabold text-slate-900 text-sm group-hover:text-[#0277BD]">
                  Pra Registrasi Online
                </h4>
                <p className="text-xs text-slate-500">
                  Daftar layanan administrasi sebelum ke kantor kelurahan.
                </p>
              </div>
              <div className="mt-4 text-xs font-bold text-[#0277BD] flex items-center gap-1">
                <span>Daftar Sekarang →</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('pelayanan');
                setPelayananSubModule('pengaduan');
              }}
              className="p-5 rounded-2xl border-2 border-slate-200 hover:border-emerald-600 bg-white hover:shadow-md transition text-left flex flex-col justify-between group cursor-pointer"
            >
              <div className="space-y-2">
                <span className="text-2xl">📢</span>
                <h4 className="font-extrabold text-slate-900 text-sm group-hover:text-emerald-700">
                  Pengaduan Online
                </h4>
                <p className="text-xs text-slate-500">
                  Sampaikan laporan masalah lingkungan atau aspirasi.
                </p>
              </div>
              <div className="mt-4 text-xs font-bold text-emerald-700 flex items-center gap-1">
                <span>Buat Aduan →</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('riwayat')}
              className="p-5 rounded-2xl border-2 border-slate-200 hover:border-[#0D3868] bg-white hover:shadow-md transition text-left flex flex-col justify-between group cursor-pointer"
            >
              <div className="space-y-2">
                <span className="text-2xl">📄</span>
                <h4 className="font-extrabold text-slate-900 text-sm group-hover:text-[#0D3868]">
                  Riwayat & Lacak Tiket
                </h4>
                <p className="text-xs text-slate-500">
                  Lihat QR Code dan status penanganan permohonan Anda.
                </p>
              </div>
              <div className="mt-4 text-xs font-bold text-[#0D3868] flex items-center gap-1">
                <span>Cek Riwayat ({totalSubmissions}) →</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('profil')}
              className="p-5 rounded-2xl border-2 border-slate-200 hover:border-slate-800 bg-white hover:shadow-md transition text-left flex flex-col justify-between group cursor-pointer"
            >
              <div className="space-y-2">
                <span className="text-2xl">👤</span>
                <h4 className="font-extrabold text-slate-900 text-sm group-hover:text-slate-800">
                  Profil Saya
                </h4>
                <p className="text-xs text-slate-500">
                  Perbarui NIK, nomor WhatsApp, dan alamat domisili.
                </p>
              </div>
              <div className="mt-4 text-xs font-bold text-slate-800 flex items-center gap-1">
                <span>Edit Profil →</span>
              </div>
            </button>
          </div>

          {/* Quick Active Submissions */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-black text-[#0D3868] text-base">
                Permohonan Aktif Terkini
              </h3>
              <button
                type="button"
                onClick={() => setActiveTab('riwayat')}
                className="text-xs font-bold text-[#0277BD] hover:underline cursor-pointer"
              >
                Lihat Semua ({totalSubmissions})
              </button>
            </div>

            {totalSubmissions === 0 ? (
              <div className="py-8 text-center text-slate-500 text-xs">
                Belum ada pengajuan aktif. Gunakan menu <strong>Pra Registrasi Online</strong> untuk mengurus surat atau <strong>Pengaduan Online</strong> untuk menyampaikan laporan.
              </div>
            ) : (
              <div className="space-y-3">
                {myPraList.slice(0, 3).map((r) => (
                  <div
                    key={r.id}
                    className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono-num font-black text-xs text-[#0D3868]">
                          #{r.ticketCode}
                        </span>
                        <span className="font-bold text-slate-900 text-xs sm:text-sm">
                          {r.serviceName}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Diajukan pada {r.submittedAt} · Jadwal Datang: {r.scheduledArrivalDate || '-'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-sky-100 text-[#0D3868]">
                        ● {r.status.replace(/_/g, ' ')}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setQrModalData({
                            ticketCode: r.ticketCode,
                            title: `Tiket Pra Registrasi: ${r.serviceName}`,
                            applicantName: r.applicantName,
                            categoryOrService: r.serviceName,
                            submittedAt: r.submittedAt,
                            statusBadge: r.status,
                          });
                          setQrModalOpen(true);
                        }}
                        className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                        title="Buka QR Code"
                      >
                        <QrCode className="w-4 h-4 text-[#0277BD]" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: PELAYANAN KELURAHAN (PRA REGISTRASI & PENGADUAN)
      ========================================================================= */}
      {activeTab === 'pelayanan' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs">
          <PelayananKelurahanModule
            userProfile={userProfile}
            rwGroups={rwGroups}
            praRegistrasiList={praRegistrasiList}
            pengaduanList={pengaduanList}
            masterLayananList={masterLayananList}
            masterPersyaratanList={masterPersyaratanList}
            kategoriPengaduanList={kategoriPengaduanList}
            onAddPraRegistrasi={handleAddPraFallback}
            onAddPengaduan={handleAddPengaduanFallback}
            onNavigate={onNavigate}
            defaultActiveModule={pelayananSubModule}
          />
        </div>
      )}

      {/* =========================================================================
          TAB 3: RIWAYAT SAYA (RIWAYAT PRA REGISTRASI & RIWAYAT PENGADUAN)
      ========================================================================= */}
      {activeTab === 'riwayat' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base sm:text-lg font-black text-[#0D3868]">
                Riwayat Pengajuan & Laporan Saya
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Pantau proses verifikasi dokumen dan status tindak lanjut petugas loket.
              </p>
            </div>

            {/* Sub-tab selection */}
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setRiwayatSubTab('pra_registrasi')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  riwayatSubTab === 'pra_registrasi'
                    ? 'bg-white text-[#0D3868] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Pra Registrasi ({myPraList.length})
              </button>
              <button
                type="button"
                onClick={() => setRiwayatSubTab('pengaduan')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  riwayatSubTab === 'pengaduan'
                    ? 'bg-white text-[#0D3868] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Pengaduan Online ({myPengaduanList.length})
              </button>
            </div>
          </div>

          {/* Riwayat Pra Registrasi */}
          {riwayatSubTab === 'pra_registrasi' && (
            <div className="space-y-4">
              {myPraList.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs">
                  Belum ada riwayat pra-registrasi surat.
                </div>
              ) : (
                myPraList.map((item) => (
                  <div
                    key={item.id}
                    className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-[#0277BD] transition shadow-xs space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="font-mono-num font-black text-sm text-[#0D3868]">
                          #{item.ticketCode}
                        </span>
                        <span className="font-bold text-slate-900 text-sm">
                          {item.serviceName}
                        </span>
                      </div>
                      <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-sky-100 text-[#0D3868] self-start sm:self-auto">
                        ● {item.status.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-600">
                      <div>Waktu Pengajuan: <strong>{item.submittedAt}</strong></div>
                      <div>Pemohon: <strong>{item.applicantName}</strong></div>
                      <div>Berkas Diunggah: <strong>{item.uploadedDocs?.length || 0} Dokumen</strong></div>
                    </div>

                    {item.officerNotes && (
                      <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950">
                        <strong>Catatan Petugas:</strong> {item.officerNotes}
                      </div>
                    )}

                    <div className="flex justify-end pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setQrModalData({
                            ticketCode: item.ticketCode,
                            title: `Tiket Pra Registrasi: ${item.serviceName}`,
                            applicantName: item.applicantName,
                            categoryOrService: item.serviceName,
                            submittedAt: item.submittedAt,
                            statusBadge: item.status,
                          });
                          setQrModalOpen(true);
                        }}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition cursor-pointer"
                      >
                        <QrCode className="w-3.5 h-3.5 text-[#0277BD]" />
                        <span>Buka QR Code & Tiket</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Riwayat Pengaduan */}
          {riwayatSubTab === 'pengaduan' && (
            <div className="space-y-4">
              {myPengaduanList.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs">
                  Belum ada riwayat pengaduan warga.
                </div>
              ) : (
                myPengaduanList.map((item) => (
                  <div
                    key={item.id}
                    className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-emerald-600 transition shadow-xs space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="font-mono-num font-black text-sm text-[#0D3868]">
                          #{item.ticketCode}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-[10px] font-bold">
                          {item.category}
                        </span>
                      </div>
                      <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 self-start sm:self-auto">
                        ● {item.status}
                      </span>
                    </div>

                    <h4 className="font-extrabold text-slate-900 text-sm">{item.title}</h4>
                    <p className="text-xs text-slate-600">{item.content}</p>

                    {item.followUpNotes && (
                      <div className="p-3 rounded-xl bg-sky-50 border border-sky-100 text-xs text-slate-700">
                        <strong>Tindak Lanjut Petugas:</strong> {item.followUpNotes}
                      </div>
                    )}

                    <div className="flex justify-end pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setQrModalData({
                            ticketCode: item.ticketCode,
                            title: `Tiket Pengaduan: ${item.title}`,
                            categoryOrService: item.category,
                            submittedAt: item.submittedAt,
                            statusBadge: item.status,
                          });
                          setQrModalOpen(true);
                        }}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition cursor-pointer"
                      >
                        <QrCode className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Buka QR Tiket</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 4: PROFIL SAYA
      ========================================================================= */}
      {activeTab === 'profil' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs">
          <div className="pb-4 border-b border-slate-100 mb-6">
            <h2 className="text-base sm:text-lg font-black text-[#0D3868]">
              Profil & Data Domisili Warga
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Data ini digunakan untuk mengisi formulir permohonan surat administrasi secara otomatis.
            </p>
          </div>

          {feedbackSuccess && (
            <div className="mb-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-900 flex items-center justify-between">
              <span>{feedbackSuccess}</span>
              <button type="button" onClick={() => setFeedbackSuccess('')} className="cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {feedbackError && (
            <div className="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-900 flex items-center justify-between">
              <span>{feedbackError}</span>
              <button type="button" onClick={() => setFeedbackError('')} className="cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="space-y-4 max-w-xl text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Nama Lengkap (Sesuai KTP)</label>
              <input
                type="text"
                value={profName}
                onChange={(e) => setProfName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#0277BD]"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Nomor Induk Kependudukan (NIK - 16 Digit)</label>
              <input
                type="text"
                maxLength={16}
                value={profNik}
                onChange={(e) => setProfNik(e.target.value.replace(/\D/g, ''))}
                placeholder="7371xxxxxxxxxxxx"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono-num focus:outline-none focus:border-[#0277BD]"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Nomor WhatsApp Aktif</label>
              <input
                type="text"
                value={profPhone}
                onChange={(e) => setProfPhone(e.target.value)}
                placeholder="08xxxxxxxxxx"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono-num focus:outline-none focus:border-[#0277BD]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">RW</label>
                <select
                  value={profRw}
                  onChange={(e) => setProfRw(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:border-[#0277BD]"
                >
                  {DEFAULT_RW_OPTIONS.map((rw) => (
                    <option key={rw} value={rw}>
                      {rw}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">RT</label>
                <select
                  value={profRt}
                  onChange={(e) => setProfRt(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:border-[#0277BD]"
                >
                  {DEFAULT_RT_OPTIONS.map((rt) => (
                    <option key={rt} value={rt}>
                      {rt}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Alamat Domisili Lengkap</label>
              <textarea
                rows={3}
                value={profAddress}
                onChange={(e) => setProfAddress(e.target.value)}
                placeholder="Nama jalan, nomor rumah, lorong..."
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#0277BD]"
              />
            </div>

            <div className="pt-3">
              <button
                type="submit"
                disabled={isSavingProfile}
                className="px-6 py-2.5 rounded-xl bg-[#0D3868] hover:bg-[#072647] text-white text-xs font-black transition cursor-pointer shadow-xs disabled:opacity-50"
              >
                {isSavingProfile ? 'Menyimpan Perubahan...' : 'Simpan Profil Warga'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* =========================================================================
          TAB 5: NOTIFIKASI (TERMASUK STATUS PERMOHONAN BIBIT GRATIS)
      ========================================================================= */}
      {activeTab === 'notifikasi' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="pb-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="font-black text-[#0D3868] text-base">
                Notifikasi Pelayanan, Pengaduan & Permohonan Bibit Gratis
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Pantau status perkembangan pengajuan administrasi, tindak lanjut pengaduan, dan permohonan bibit tanaman gratis Anda secara real-time.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-extrabold self-start sm:self-auto">
              {totalNotifCount} Pembaruan Status
            </span>
          </div>

          <div className="space-y-4">
            {/* Welcome / Active Account Notice */}
            <div className="p-4 rounded-2xl bg-sky-50 border border-sky-100 flex items-start gap-3 text-xs">
              <Bell className="w-4 h-4 text-[#0277BD] shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-bold text-slate-900">
                  Selamat datang di Portal Pelayanan Kelurahan Panaikang
                </span>
                <p className="text-slate-600">
                  Akun Anda telah aktif. Setiap perubahan status Pra Registrasi Online, Pengaduan Online, maupun Permohonan Bibit Gratis akan langsung diinformasikan pada halaman ini.
                </p>
                <span className="text-[10px] text-slate-400 font-mono-num">Aktif · Real-Time</span>
              </div>
            </div>

            {/* 1. Notifikasi Status Permohonan Bibit Gratis (Urban Farming) */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                  <Sprout className="w-4 h-4 text-emerald-600" />
                  <span>Status Permohonan Bibit Gratis ({mySeedRequests.length})</span>
                </h4>
                <button
                  type="button"
                  onClick={() => onNavigate('urbanfarming')}
                  className="text-[11px] font-bold text-emerald-700 hover:underline cursor-pointer"
                >
                  + Ajukan / Lihat Katalog Bibit →
                </button>
              </div>

              {mySeedRequests.length === 0 ? (
                <div className="p-4 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-xs text-slate-500 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span>
                    Belum ada permohonan bibit tanaman gratis yang diajukan. Anda dapat mengajukan benih sayuran/tanaman produktif gratis melalui menu Urban Farming.
                  </span>
                  <button
                    type="button"
                    onClick={() => onNavigate('urbanfarming')}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shrink-0 cursor-pointer"
                  >
                    Ajukan Bibit Gratis
                  </button>
                </div>
              ) : (
                mySeedRequests.map((seedReq) => {
                  const isApproved = seedReq.status === 'Disetujui';
                  const isDistributed = seedReq.status === 'Telah Didistribusikan';
                  const isRejected = seedReq.status === 'Ditolak';

                  let statusDesc =
                    'Permohonan bibit Anda sedang diverifikasi dan disiapkan oleh Kader Tani Urban Farming Kelurahan Panaikang.';
                  if (isApproved) {
                    statusDesc =
                      'Permohonan bibit Anda telah DISETUJUI! Silakan datang mengambil paket bibit di Kebun Bibit / Kantor Kelurahan Panaikang pada jam kerja.';
                  } else if (isDistributed) {
                    statusDesc =
                      'Paket bibit tanaman gratis telah diserahkan/didistribusikan. Selamat menanam dan semoga panen melimpah!';
                  } else if (isRejected) {
                    statusDesc =
                      'Mohon maaf, permohonan bibit belum dapat dipenuhi karena stok benih sedang dalam masa penyemaian ulang.';
                  }

                  return (
                    <div
                      key={seedReq.id}
                      className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-start justify-between gap-3 text-xs transition ${
                        isApproved
                          ? 'bg-sky-50/70 border-sky-200'
                          : isDistributed
                          ? 'bg-emerald-50/70 border-emerald-200'
                          : isRejected
                          ? 'bg-rose-50/70 border-rose-200'
                          : 'bg-amber-50/60 border-amber-200'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                            isApproved
                              ? 'bg-sky-100 text-sky-700'
                              : isDistributed
                              ? 'bg-emerald-100 text-emerald-700'
                              : isRejected
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          <Sprout className="w-4 h-4" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono-num font-black text-[#0D3868]">
                              #{seedReq.id}
                            </span>
                            <span className="font-extrabold text-slate-900">
                              Permohonan Bibit Gratis — {seedReq.applicantName}
                            </span>
                            <span className="text-[11px] text-slate-500">
                              ({seedReq.rw} / {seedReq.rt})
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                            <span className="text-slate-600 font-semibold">Benih Diminta:</span>
                            {seedReq.requestedSeeds.map((seed, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 rounded-md bg-white border border-emerald-200 text-emerald-800 text-[10px] font-bold"
                              >
                                🌱 {seed}
                              </span>
                            ))}
                            <span className="text-slate-500 text-[11px]">
                              · Metode: <strong>{seedReq.plantingMethod}</strong>
                            </span>
                          </div>

                          <p className="text-slate-700 leading-relaxed pt-0.5">{statusDesc}</p>

                          <div className="text-[10px] text-slate-400 font-mono-num pt-0.5">
                            Diajukan: {seedReq.createdAt}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col sm:items-end gap-2 shrink-0">
                        <span
                          className={`px-3 py-1 rounded-full text-[10px] font-black uppercase self-start sm:self-end ${
                            isDistributed
                              ? 'bg-emerald-600 text-white'
                              : isApproved
                              ? 'bg-[#0277BD] text-white'
                              : isRejected
                              ? 'bg-rose-600 text-white'
                              : 'bg-amber-500 text-slate-950'
                          }`}
                        >
                          ● {seedReq.status}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* 2. Notifikasi Status Pra Registrasi Layanan Surat */}
            {myPraList.length > 0 && (
              <div className="space-y-2.5 pt-2 border-t border-slate-100">
                <h4 className="text-xs font-black uppercase tracking-wider text-[#0D3868] flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-[#0277BD]" />
                  <span>Status Pra Registrasi Layanan ({myPraList.length})</span>
                </h4>
                {myPraList.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3 text-xs"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="space-y-0.5 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-bold text-slate-900">
                          Tiket #{item.ticketCode} — {item.serviceName}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full bg-sky-100 text-[#0D3868] text-[10px] font-black uppercase">
                          {item.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <p className="text-slate-600">
                        Status saat ini: <strong>{item.status.replace(/_/g, ' ')}</strong>.{' '}
                        {item.officerNotes ? `Catatan Petugas: ${item.officerNotes}` : ''}
                      </p>
                      <span className="text-[10px] text-slate-400 font-mono-num">{item.updatedAt}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 3. Notifikasi Status Pengaduan Online */}
            {myPengaduanList.length > 0 && (
              <div className="space-y-2.5 pt-2 border-t border-slate-100">
                <h4 className="text-xs font-black uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-emerald-600" />
                  <span>Status Pengaduan Online ({myPengaduanList.length})</span>
                </h4>
                {myPengaduanList.map((pgd) => (
                  <div
                    key={pgd.id}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3 text-xs"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="space-y-0.5 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-bold text-slate-900">
                          Tiket #{pgd.ticketCode} — {pgd.title} ({pgd.category})
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase">
                          {pgd.status}
                        </span>
                      </div>
                      <p className="text-slate-600">
                        Status penanganan: <strong>{pgd.status}</strong>.{' '}
                        {pgd.followUpNotes ? `Tindak Lanjut: ${pgd.followUpNotes}` : ''}
                      </p>
                      <span className="text-[10px] text-slate-400 font-mono-num">{pgd.updatedAt}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 6: BANTUAN & KONTAK LOKET (DISESUAIKAN DENGAN PROFIL KELURAHAN)
      ========================================================================= */}
      {activeTab === 'bantuan' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="font-black text-[#0D3868] text-base">Pusat Bantuan & Layanan Loket</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Informasi prosedur loket fisik, jam pelayanan, dan kontak resmi sesuai Profil Kelurahan Panaikang.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
              <span className="font-bold text-slate-900 text-sm block">📍 Alamat Kantor Kelurahan</span>
              <p className="text-slate-600 leading-relaxed">
                {profile.officeAddress
                  ? `${profile.officeAddress}, ${profile.subDistrict || 'Kecamatan Panakkukang'}, ${profile.city || 'Kota Makassar'} ${profile.postalCode || '90231'}`
                  : 'Kantor Kelurahan Panaikang, Kecamatan Panakkukang, Kota Makassar, Sulawesi Selatan 90231.'}
              </p>
              <div className="pt-1 text-slate-600 space-y-1">
                <div>
                  Jam Pelayanan: <strong>{profile.serviceHours || 'Senin – Jumat · 08:00 – 16:00 WITA'}</strong>
                </div>
                {profile.emailContact && (
                  <div>
                    Email Resmi: <strong className="font-mono">{profile.emailContact}</strong>
                  </div>
                )}
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-2.5">
              <span className="font-bold text-emerald-950 text-sm block">
                💬 Call Center & WhatsApp Resmi Kelurahan
              </span>
              <p className="text-slate-600 leading-relaxed">
                Butuh bantuan terkait persyaratan berkas, permohonan bibit, atau kendala teknis? Hubungi nomor telepon/WhatsApp resmi Kelurahan Panaikang:
              </p>

              <div className="p-3 rounded-xl bg-white border border-emerald-200 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-emerald-700 shrink-0" />
                  <div>
                    <div className="text-[10px] font-bold uppercase text-slate-400">
                      Nomor Telepon / WhatsApp Kelurahan (Profil Kelurahan)
                    </div>
                    <div className="font-mono-num font-black text-sm text-emerald-950">
                      {profile.phoneContact && profile.phoneContact.trim()
                        ? profile.phoneContact
                        : 'Belum diisi pada Profil Kelurahan'}
                    </div>
                  </div>
                </div>
                {isValidWhatsAppPhone(profile.phoneContact) && (
                  <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-mono text-[10px] font-bold">
                    +{normalizeWhatsAppPhone(profile.phoneContact)}
                  </span>
                )}
              </div>

              <div className="pt-1">
                {isValidWhatsAppPhone(profile.phoneContact) ? (
                  <a
                    href={buildWhatsAppUrl(
                      profile.phoneContact,
                      `Halo Admin Pelayanan Kelurahan Panaikang, saya ${userProfile.fullName} (${userProfile.rw}/${userProfile.rt}) ingin menanyakan informasi layanan kelurahan.`
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold transition shadow-xs"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Hubungi WhatsApp Kelurahan ({profile.phoneContact})</span>
                  </a>
                ) : (
                  <a
                    href={buildWhatsAppUrl(
                      '',
                      `Halo Admin Pelayanan Kelurahan Panaikang, saya ${userProfile.fullName} (${userProfile.rw}/${userProfile.rt}) ingin menanyakan informasi layanan kelurahan.`
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold transition shadow-xs"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Buka WhatsApp Layanan Loket</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QR Modal */}
      <QRCodeModal
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        ticketCode={qrModalData.ticketCode}
        title={qrModalData.title}
        applicantName={qrModalData.applicantName}
        categoryOrService={qrModalData.categoryOrService}
        submittedAt={qrModalData.submittedAt}
        statusBadge={qrModalData.statusBadge}
      />
    </div>
  );
};
