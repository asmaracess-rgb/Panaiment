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
  X,
  Loader2,
  Building2,
} from 'lucide-react';
import {
  AppView,
  AuthenticatedUserProfile,
  CitizenReport,
  CitizenSubmission,
  ReportCategory,
  ReportUrgency,
  RwGroup,
} from '../types';
import {
  OFFICIAL_13_WARGA_SERVICES,
  REPORT_COMPLAINT_CATEGORIES,
} from '../data/wargaServiceCatalog';
import {
  subscribeToMyCitizenSubmissions,
  createCitizenSubmissionInFirestore,
  updateMyCitizenSubmissionInFirestore,
  deleteMyCitizenSubmissionInFirestore,
  updateCitizenProfileInFirestore,
  AUTH_SCHEMA_LIMITS,
} from '../firebase/authService';

interface DashboardWargaViewProps {
  userProfile: AuthenticatedUserProfile | null;
  rwGroups: RwGroup[];
  reports: CitizenReport[];
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
  onProfileUpdated: (updated: AuthenticatedUserProfile) => void;
  onLogout: () => Promise<void>;
  onNavigate: (view: AppView) => void;
}

const DEFAULT_RW_OPTIONS = ['RW 01', 'RW 02', 'RW 03', 'RW 04', 'RW 05', 'RW 06', 'RW 07'];
const DEFAULT_RT_OPTIONS = ['RT 01', 'RT 02', 'RT 03', 'RT 04', 'RT 05'];

export const DashboardWargaView: React.FC<DashboardWargaViewProps> = ({
  userProfile,
  rwGroups,
  reports,
  onAddReport,
  onProfileUpdated,
  onLogout,
  onNavigate,
}) => {
  const [cloudSubmissions, setCloudSubmissions] = useState<CitizenSubmission[]>([]);
  const [activeTab, setActiveTab] = useState<'riwayat' | 'ajukan_surat' | 'lapor_masalah' | 'profil'>('riwayat');

  // Form Pengajuan Surat Administrasi
  const [selectedServiceCode, setSelectedServiceCode] = useState<string>(
    OFFICIAL_13_WARGA_SERVICES[0]?.code || 'SKD'
  );
  const [suratPurpose, setSuratPurpose] = useState('');
  const [isSubmittingSurat, setIsSubmittingSurat] = useState(false);

  // Form Laporan Pengaduan Lingkungan
  const [aduanTitle, setAduanTitle] = useState('');
  const [aduanCategory, setAduanCategory] = useState<string>(REPORT_COMPLAINT_CATEGORIES[0]);
  const [aduanUrgency, setAduanUrgency] = useState<ReportUrgency>('Normal');
  const [aduanLocation, setAduanLocation] = useState('');
  const [aduanDesc, setAduanDesc] = useState('');
  const [isSubmittingAduan, setIsSubmittingAduan] = useState(false);

  // Edit My Submission Modal (only allowed while status === 'Menunggu Verifikasi')
  const [editingSub, setEditingSub] = useState<CitizenSubmission | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [isSavingSubEdit, setIsSavingSubEdit] = useState(false);

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

  useEffect(() => {
    if (!userProfile) return;
    setProfName(userProfile.fullName);
    setProfNik(userProfile.nik);
    setProfPhone(userProfile.phone);
    setProfRw(userProfile.rw || 'RW 01');
    setProfRt(userProfile.rt || 'RT 01');
    setProfAddress(userProfile.address);
  }, [userProfile]);

  // Subscribe to citizen's own submissions in Firestore (enforced by where('ownerId', '==', uid))
  useEffect(() => {
    if (!userProfile?.uid) {
      setCloudSubmissions([]);
      return;
    }
    const unsub = subscribeToMyCitizenSubmissions(userProfile.uid, (items) => {
      setCloudSubmissions(items);
    });
    return () => unsub();
  }, [userProfile?.uid]);

  // Combine Firestore submissions with any local reports owned by this user
  const mySubmissions = useMemo(() => {
    if (!userProfile) return [];
    const map = new Map<string, CitizenSubmission>();
    for (const sub of cloudSubmissions) {
      if (sub.ownerId === userProfile.uid) {
        map.set(sub.ticketCode || sub.id, sub);
      }
    }
    for (const rep of reports) {
      if (rep.ownerId === userProfile.uid && !map.has(rep.ticketCode)) {
        map.set(rep.ticketCode, {
          id: rep.id,
          ownerId: userProfile.uid,
          ownerEmail: userProfile.email,
          ticketCode: rep.ticketCode,
          submissionType: rep.serviceCategoryId ? 'layanan_administrasi' : 'pengaduan_lingkungan',
          serviceCategoryId: rep.serviceCategoryId || 'pengaduan',
          serviceName: rep.serviceSubItemLabel || rep.category,
          title: rep.title,
          description: rep.description,
          applicantName: rep.reporterName,
          applicantNik: rep.applicantNik || userProfile.nik,
          applicantPhone: rep.reporterPhone,
          rw: rep.rw,
          rt: rep.rt,
          address: rep.citizenAddress || rep.locationName,
          status: rep.status,
          responseNote: rep.responseNote || '',
          letterRegisterNumber: rep.letterRegisterNumber || '',
          createdAtDisplay: rep.createdAt,
        });
      }
    }
    return Array.from(map.values());
  }, [cloudSubmissions, reports, userProfile]);

  const stats = useMemo(() => {
    const total = mySubmissions.length;
    const waiting = mySubmissions.filter((s) => s.status === 'Menunggu Verifikasi').length;
    const inProgress = mySubmissions.filter((s) => s.status === 'Sedang Ditangani').length;
    const completed = mySubmissions.filter((s) => s.status === 'Selesai').length;
    return { total, waiting, inProgress, completed };
  }, [mySubmissions]);

  // Private Route Authentication Check
  if (!userProfile) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-lg">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-extrabold text-slate-900">
            Akses Dashboard Warga
          </h2>
          <p className="mt-2 text-xs text-slate-600 leading-relaxed">
            Silakan masuk terlebih dahulu untuk melihat dan mengelola pengajuan layanan milik Anda.
          </p>
          <button
            type="button"
            onClick={() => onNavigate('login')}
            className="mt-5 px-5 py-2.5 rounded-xl bg-[#0D3868] hover:bg-[#072647] text-white text-xs font-extrabold transition cursor-pointer"
          >
            Masuk / Daftar Akun Warga
          </button>
        </div>
      </div>
    );
  }

  const handleCreateSurat = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackError('');
    setFeedbackSuccess('');

    const serviceObj =
      OFFICIAL_13_WARGA_SERVICES.find((s) => s.code === selectedServiceCode) ||
      OFFICIAL_13_WARGA_SERVICES[0];

    if (!suratPurpose.trim() || suratPurpose.trim().length < 5) {
      setFeedbackError('Mohon tuliskan keperluan pengajuan surat (minimal 5 karakter).');
      return;
    }

    setIsSubmittingSurat(true);

    const ticketCode = onAddReport({
      ownerId: userProfile.uid,
      ownerEmail: userProfile.email,
      title: `Permohonan ${serviceObj.name} - ${userProfile.fullName}`,
      description: `Keperluan: ${suratPurpose.trim()}`,
      category: 'Ketertiban & Fasum',
      urgency: 'Normal',
      reporterName: userProfile.fullName,
      reporterPhone: userProfile.phone || '-',
      rw: userProfile.rw || 'RW 01',
      rt: userProfile.rt || 'RT 01',
      locationName: userProfile.address || `${userProfile.rw} / ${userProfile.rt}`,
      mapX: 50,
      mapY: 50,
      coordinatesLabel: 'Pelayanan Terpadu Kelurahan Panaikang',
      imageUrl: '',
      serviceCategoryId: 'surat_keterangan',
      serviceCategoryTitle: 'Layanan Administrasi & Persuratan Warga',
      serviceSubItemId: serviceObj.code,
      serviceSubItemLabel: serviceObj.name,
      documentCode: serviceObj.code,
      applicantNik: userProfile.nik,
      citizenAddress: userProfile.address || `${userProfile.rw} / ${userProfile.rt}`,
    });

    const cloudRes = await createCitizenSubmissionInFirestore({
      id: `sub_${ticketCode.replace(/[^a-zA-Z0-9_-]/g, '_')}_${Date.now()}`,
      ticketCode,
      submissionType: 'layanan_administrasi',
      serviceCategoryId: 'surat_keterangan',
      serviceName: serviceObj.name,
      title: `Permohonan ${serviceObj.name}`,
      description: suratPurpose.trim(),
      applicantName: userProfile.fullName,
      applicantNik: userProfile.nik,
      applicantPhone: userProfile.phone,
      rw: userProfile.rw || 'RW 01',
      rt: userProfile.rt || 'RT 01',
      address:
        userProfile.address || 'Kelurahan Panaikang, Kec. Panakkukang, Kota Makassar',
    });

    setIsSubmittingSurat(false);

    if (!cloudRes.ok) {
      setFeedbackError(cloudRes.error || 'Terjadi kendala saat menyimpan pengajuan ke cloud.');
      return;
    }

    setSuratPurpose('');
    setFeedbackSuccess(
      `Permohonan "${serviceObj.name}" berhasil diajukan dengan Nomor Tiket #${ticketCode} dan tersimpan aman pada akun Anda.`
    );
    setActiveTab('riwayat');
  };

  const handleCreateAduan = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackError('');
    setFeedbackSuccess('');

    if (aduanTitle.trim().length < 3) {
      setFeedbackError('Judul laporan pengaduan wajib diisi (minimal 3 karakter).');
      return;
    }
    if (aduanDesc.trim().length < 5) {
      setFeedbackError('Uraian permasalahan wajib diisi (minimal 5 karakter).');
      return;
    }

    let repCategory: ReportCategory = 'Ketertiban & Fasum';
    if (aduanCategory.toLowerCase().includes('sampah')) {
      repCategory = 'Sampah Liar & TPS';
    } else if (
      aduanCategory.toLowerCase().includes('drainase') ||
      aduanCategory.toLowerCase().includes('jalan')
    ) {
      repCategory = 'Drainase & Genangan';
    } else if (
      aduanCategory.toLowerCase().includes('pohon') ||
      aduanCategory.toLowerCase().includes('lingkungan')
    ) {
      repCategory = 'Pohon & Ruang Hijau';
    }

    setIsSubmittingAduan(true);

    const loc =
      aduanLocation.trim() ||
      userProfile.address ||
      `Wilayah ${userProfile.rw} / ${userProfile.rt}`;

    const ticketCode = onAddReport({
      ownerId: userProfile.uid,
      ownerEmail: userProfile.email,
      title: aduanTitle.trim(),
      description: aduanDesc.trim(),
      category: repCategory,
      urgency: aduanUrgency,
      reporterName: userProfile.fullName,
      reporterPhone: userProfile.phone || '-',
      rw: userProfile.rw || 'RW 01',
      rt: userProfile.rt || 'RT 01',
      locationName: loc,
      mapX: 48,
      mapY: 52,
      coordinatesLabel: `${userProfile.rw} · Kelurahan Panaikang`,
      imageUrl: '',
    });

    const cloudRes = await createCitizenSubmissionInFirestore({
      id: `sub_${ticketCode.replace(/[^a-zA-Z0-9_-]/g, '_')}_${Date.now()}`,
      ticketCode,
      submissionType: 'pengaduan_lingkungan',
      serviceCategoryId: 'pengaduan_warga',
      serviceName: aduanCategory,
      title: aduanTitle.trim(),
      description: aduanDesc.trim(),
      applicantName: userProfile.fullName,
      applicantNik: userProfile.nik,
      applicantPhone: userProfile.phone,
      rw: userProfile.rw || 'RW 01',
      rt: userProfile.rt || 'RT 01',
      address: loc,
    });

    setIsSubmittingAduan(false);

    if (!cloudRes.ok) {
      setFeedbackError(cloudRes.error || 'Terjadi kendala saat menyimpan pengaduan.');
      return;
    }

    setAduanTitle('');
    setAduanLocation('');
    setAduanDesc('');
    setFeedbackSuccess(
      `Laporan pengaduan berhasil dikirim dengan Nomor Tiket #${ticketCode}.`
    );
    setActiveTab('riwayat');
  };

  const handleOpenEditModal = (sub: CitizenSubmission) => {
    setFeedbackError('');
    setEditingSub(sub);
    setEditTitle(sub.title);
    setEditDesc(sub.description);
    setEditPhone(sub.applicantPhone);
    setEditAddress(sub.address);
  };

  const handleSaveSubEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSub) return;
    setIsSavingSubEdit(true);
    const res = await updateMyCitizenSubmissionInFirestore(editingSub.id, {
      title: editTitle,
      description: editDesc,
      applicantPhone: editPhone,
      address: editAddress,
    });
    setIsSavingSubEdit(false);
    if (!res.ok) {
      setFeedbackError(res.error || 'Gagal memperbarui pengajuan.');
      return;
    }
    setEditingSub(null);
    setFeedbackSuccess(`Pengajuan #${editingSub.ticketCode} berhasil diperbarui.`);
  };

  const handleCancelSubmission = async (sub: CitizenSubmission) => {
    setFeedbackError('');
    const res = await deleteMyCitizenSubmissionInFirestore(sub.id);
    if (!res.ok) {
      setFeedbackError(res.error || 'Gagal membatalkan pengajuan.');
      return;
    }
    setFeedbackSuccess(`Pengajuan #${sub.ticketCode} berhasil dibatalkan.`);
  };

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

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 space-y-6">
      {/* Top Citizen Identity Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-[#072647] via-[#0D3868] to-[#0277BD] text-white p-6 sm:p-8 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-400/20 border border-emerald-300/40 text-emerald-200 text-[11px] font-extrabold uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>
                  Peran Terverifikasi:{' '}
                  {userProfile.role === 'admin' ? 'Administrator Kelurahan' : 'Warga Kelurahan'}
                </span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-white/15 text-sky-100 text-xs font-mono-num font-bold">
                {userProfile.rw} / {userProfile.rt}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
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
            {userProfile.role === 'admin' && (
              <button
                type="button"
                onClick={() => onNavigate('admin')}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-extrabold transition shadow-xs cursor-pointer"
              >
                <Building2 className="w-4 h-4" />
                <span>Buka Panel Admin</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => onNavigate('warga')}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-white text-xs font-bold transition cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>Katalog SOP Layanan</span>
            </button>

            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-extrabold transition shadow-xs cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Summary Counters for Citizen's Own Submissions */}
        <div className="mt-6 pt-5 border-t border-white/15 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-2xl bg-white/10 border border-white/15 px-4 py-3">
            <div className="text-[11px] text-sky-200 font-semibold">Total Pengajuan Saya</div>
            <div className="text-2xl font-black font-mono-num mt-0.5">{stats.total}</div>
          </div>
          <div className="rounded-2xl bg-amber-400/15 border border-amber-300/30 px-4 py-3">
            <div className="text-[11px] text-amber-200 font-semibold">Menunggu Verifikasi</div>
            <div className="text-2xl font-black font-mono-num text-amber-300 mt-0.5">
              {stats.waiting}
            </div>
          </div>
          <div className="rounded-2xl bg-sky-400/15 border border-sky-300/30 px-4 py-3">
            <div className="text-[11px] text-sky-200 font-semibold">Sedang Ditangani</div>
            <div className="text-2xl font-black font-mono-num text-sky-200 mt-0.5">
              {stats.inProgress}
            </div>
          </div>
          <div className="rounded-2xl bg-emerald-400/15 border border-emerald-300/30 px-4 py-3">
            <div className="text-[11px] text-emerald-200 font-semibold">Selesai / Terbit</div>
            <div className="text-2xl font-black font-mono-num text-emerald-300 mt-0.5">
              {stats.completed}
            </div>
          </div>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedbackError && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs font-semibold text-red-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{feedbackError}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackError('')}
            className="text-red-500 hover:text-red-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {feedbackSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-900 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{feedbackSuccess}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackSuccess('')}
            className="text-emerald-600 hover:text-emerald-900 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 bg-white p-2 rounded-2xl border border-slate-200 shadow-2xs">
        <button
          type="button"
          onClick={() => setActiveTab('riwayat')}
          className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'riwayat'
              ? 'bg-[#0D3868] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Pengajuan & Laporan Saya ({mySubmissions.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('ajukan_surat')}
          className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'ajukan_surat'
              ? 'bg-[#1C8237] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>Ajukan Surat Administrasi</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('lapor_masalah')}
          className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'lapor_masalah'
              ? 'bg-[#0277BD] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Send className="w-4 h-4" />
          <span>Buat Pengaduan Lingkungan</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('profil')}
          className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'profil'
              ? 'bg-slate-800 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Profil & Domisili Saya</span>
        </button>
      </div>

      {/* TAB 1: RIWAYAT PENGAJUAN SAYA */}
      {activeTab === 'riwayat' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
                Daftar Pengajuan Layanan & Pengaduan Milik Saya
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Hanya menampilkan dokumen yang terikat dengan UID akun Anda (
                <code className="font-mono-num text-[11px] bg-slate-100 px-1.5 py-0.5 rounded">
                  {userProfile.uid.slice(0, 12)}...
                </code>
                ).
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('ajukan_surat')}
                className="px-3.5 py-2 rounded-xl bg-[#1C8237] hover:bg-[#146329] text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Pengajuan Baru</span>
              </button>
            </div>
          </div>

          {mySubmissions.length === 0 ? (
            <div className="py-12 text-center">
              <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <div className="text-sm font-bold text-slate-800">
                Belum Ada Pengajuan pada Akun Anda
              </div>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                Anda dapat mengajukan permohonan surat pengantar/keterangan kelurahan atau mengirim
                laporan pengaduan lingkungan melalui tombol di bawah ini.
              </p>
              <div className="mt-5 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setActiveTab('ajukan_surat')}
                  className="px-4 py-2.5 rounded-xl bg-[#0D3868] hover:bg-[#072647] text-white text-xs font-extrabold transition cursor-pointer"
                >
                  Ajukan Surat Administrasi
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('lapor_masalah')}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition cursor-pointer"
                >
                  Buat Laporan Lingkungan
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-4 space-y-3.5">
              {mySubmissions.map((item) => {
                const isWaiting = item.status === 'Menunggu Verifikasi';
                return (
                  <div
                    key={item.id || item.ticketCode}
                    className="p-4 sm:p-5 rounded-2xl border border-slate-200 hover:border-[#0277BD]/50 bg-slate-50/60 transition-all"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2.5 py-1 rounded-lg bg-[#0D3868] text-white font-mono-num text-xs font-extrabold">
                          #{item.ticketCode}
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-slate-200/80 text-slate-700 text-[11px] font-bold">
                          {item.serviceName}
                        </span>
                        <span className="text-[11px] text-slate-500 font-mono-num">
                          {item.createdAtDisplay}
                        </span>
                      </div>

                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold self-start sm:self-auto ${
                          item.status === 'Selesai'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : item.status === 'Sedang Ditangani'
                            ? 'bg-sky-100 text-sky-800 border border-sky-300'
                            : item.status === 'Ditolak'
                            ? 'bg-rose-100 text-rose-800 border border-rose-300'
                            : 'bg-amber-100 text-amber-900 border border-amber-300'
                        }`}
                      >
                        {item.status === 'Selesai' ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Clock className="w-3.5 h-3.5" />
                        )}
                        <span>{item.status}</span>
                      </span>
                    </div>

                    <h3 className="mt-2.5 text-sm sm:text-base font-extrabold text-slate-900">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                      {item.description}
                    </p>

                    <div className="mt-3 pt-3 border-t border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
                      <div className="flex flex-wrap items-center gap-3">
                        <span>
                          Domisili: <strong className="text-slate-700">{item.rw} / {item.rt}</strong>
                        </span>
                        {item.letterRegisterNumber && (
                          <span className="px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 font-mono-num font-bold">
                            No. Register Surat: {item.letterRegisterNumber}
                          </span>
                        )}
                      </div>

                      {isWaiting && item.id.startsWith('sub_') && (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(item)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white hover:bg-sky-50 border border-slate-300 text-slate-700 text-xs font-bold transition cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-[#0277BD]" />
                            <span>Edit Pengajuan</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCancelSubmission(item)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white hover:bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Batalkan</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {item.responseNote && (
                      <div className="mt-3 p-3 rounded-xl bg-white border border-slate-200 text-xs text-slate-700">
                        <strong className="text-[#0D3868]">Tindak Lanjut Petugas Kelurahan:</strong>{' '}
                        {item.responseNote}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: AJUKAN SURAT ADMINISTRASI */}
      {activeTab === 'ajukan_surat' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
                Formulir Permohonan Layanan Administrasi Warga
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Data pemohon otomatis terisi dari profil akun terautentikasi Anda.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('warga')}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0277BD] hover:underline cursor-pointer"
            >
              <span>Lihat Persyaratan Dokumen SOP</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <form onSubmit={handleCreateSurat} className="mt-5 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Pilih Jenis Layanan Persuratan Kelurahan *
              </label>
              <select
                value={selectedServiceCode}
                onChange={(e) => setSelectedServiceCode(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 bg-white focus:border-[#0D3868] focus:outline-none"
              >
                {OFFICIAL_13_WARGA_SERVICES.map((srv) => (
                  <option key={srv.code} value={srv.code}>
                    [{srv.code}] {srv.name} (Estimasi 1-2 Hari Kerja)
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
              <div>
                <span className="text-slate-500 block">Nama Pemohon:</span>
                <strong className="text-slate-900">{userProfile.fullName}</strong>
              </div>
              <div>
                <span className="text-slate-500 block">NIK / Wilayah:</span>
                <strong className="text-slate-900 font-mono-num">
                  {userProfile.nik || 'Belum diisi'} ({userProfile.rw}/{userProfile.rt})
                </strong>
              </div>
              <div>
                <span className="text-slate-500 block">Email Akun:</span>
                <strong className="text-slate-900">{userProfile.email}</strong>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Keperluan / Keterangan Permohonan Surat *
              </label>
              <textarea
                rows={4}
                value={suratPurpose}
                onChange={(e) => setSuratPurpose(e.target.value)}
                placeholder="Tuliskan tujuan pengajuan surat serta informasi tambahan yang diperlukan petugas..."
                maxLength={AUTH_SCHEMA_LIMITS.DESC_MAX}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:border-[#0D3868] focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setActiveTab('riwayat')}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmittingSurat}
                className="px-5 py-2.5 rounded-xl bg-[#1C8237] hover:bg-[#146329] text-white text-xs font-extrabold transition flex items-center gap-2 cursor-pointer disabled:opacity-70"
              >
                {isSubmittingSurat ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Mengirim Permohonan...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Kirim Permohonan Resmi</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: LAPOR MASALAH LINGKUNGAN */}
      {activeTab === 'lapor_masalah' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs">
          <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
            Buat Laporan Pengaduan Lingkungan & Fasilitas Umum
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Laporan Anda tercatat resmi atas nama {userProfile.fullName} ({userProfile.rw}/
            {userProfile.rt}).
          </p>

          <form onSubmit={handleCreateAduan} className="mt-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Judul Laporan *
                </label>
                <input
                  type="text"
                  value={aduanTitle}
                  onChange={(e) => setAduanTitle(e.target.value)}
                  placeholder="Contoh: Tumpukan sampah di sudut jalan"
                  maxLength={AUTH_SCHEMA_LIMITS.TITLE_MAX}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:border-[#0D3868] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Kategori *
                  </label>
                  <select
                    value={aduanCategory}
                    onChange={(e) => setAduanCategory(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-900 bg-white focus:border-[#0D3868] focus:outline-none"
                  >
                    {REPORT_COMPLAINT_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Tingkat Urgensi
                  </label>
                  <select
                    value={aduanUrgency}
                    onChange={(e) => setAduanUrgency(e.target.value as ReportUrgency)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-900 bg-white focus:border-[#0D3868] focus:outline-none"
                  >
                    <option value="Normal">Normal</option>
                    <option value="Tinggi">Tinggi</option>
                    <option value="Darurat">Darurat</option>
                  </select>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Titik Lokasi Kejadian *
              </label>
              <input
                type="text"
                value={aduanLocation}
                onChange={(e) => setAduanLocation(e.target.value)}
                placeholder="Contoh: Depan Lorong 3 Jl. Urip Sumoharjo"
                maxLength={AUTH_SCHEMA_LIMITS.ADDRESS_MAX}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:border-[#0D3868] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Deskripsi Lengkap Permasalahan *
              </label>
              <textarea
                rows={4}
                value={aduanDesc}
                onChange={(e) => setAduanDesc(e.target.value)}
                placeholder="Jelaskan kondisi di lapangan agar tim Satgas Kelurahan dapat segera menindaklanjuti..."
                maxLength={AUTH_SCHEMA_LIMITS.DESC_MAX}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:border-[#0D3868] focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setActiveTab('riwayat')}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmittingAduan}
                className="px-5 py-2.5 rounded-xl bg-[#0277BD] hover:bg-[#0D3868] text-white text-xs font-extrabold transition flex items-center gap-2 cursor-pointer disabled:opacity-70"
              >
                {isSubmittingAduan ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Mengirim Laporan...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Kirim Laporan Pengaduan</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 4: PROFIL & DOMISILI WARGA */}
      {activeTab === 'profil' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs">
          <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
            Data Profil & Domisili Warga
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Data ini disimpan pada dokumen terproteksi{' '}
            <code className="font-mono-num bg-slate-100 px-1.5 py-0.5 rounded">
              /user_profiles/{userProfile.uid}
            </code>{' '}
            dan hanya dapat diakses oleh Anda sendiri serta Administrator Kelurahan.
          </p>

          <form onSubmit={handleSaveProfile} className="mt-5 space-y-4 max-w-2xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Lengkap Sesuai KTP *
                </label>
                <input
                  type="text"
                  value={profName}
                  onChange={(e) => setProfName(e.target.value)}
                  maxLength={AUTH_SCHEMA_LIMITS.NAME_MAX}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:border-[#0D3868] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  NIK (16 Digit)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={profNik}
                  onChange={(e) => setProfNik(e.target.value.replace(/\D/g, '').slice(0, 16))}
                  maxLength={16}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 font-mono-num focus:border-[#0D3868] focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nomor HP / WhatsApp
                </label>
                <input
                  type="tel"
                  value={profPhone}
                  onChange={(e) => setProfPhone(e.target.value)}
                  maxLength={AUTH_SCHEMA_LIMITS.PHONE_MAX}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 font-mono-num focus:border-[#0D3868] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Wilayah RW</label>
                <select
                  value={profRw}
                  onChange={(e) => setProfRw(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 bg-white focus:border-[#0D3868] focus:outline-none"
                >
                  {(rwGroups.length > 0 ? rwGroups.map((g) => g.rwCode) : DEFAULT_RW_OPTIONS).map(
                    (rw) => (
                      <option key={rw} value={rw}>
                        {rw}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Wilayah RT</label>
                <select
                  value={profRt}
                  onChange={(e) => setProfRt(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 bg-white focus:border-[#0D3868] focus:outline-none"
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
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Alamat Lengkap Domisili
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={profAddress}
                  onChange={(e) => setProfAddress(e.target.value)}
                  maxLength={AUTH_SCHEMA_LIMITS.ADDRESS_MAX}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:border-[#0D3868] focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSavingProfile}
                className="px-5 py-2.5 rounded-xl bg-[#0D3868] hover:bg-[#072647] text-white text-xs font-extrabold transition flex items-center gap-2 cursor-pointer disabled:opacity-70"
              >
                {isSavingProfile ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Menyimpan Profil...</span>
                  </>
                ) : (
                  <span>Simpan Perubahan Profil</span>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal Edit Pengajuan (Hanya untuk status Menunggu Verifikasi) */}
      {editingSub && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setEditingSub(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-lg w-full p-6 border border-slate-200 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-extrabold text-slate-900">
                Edit Pengajuan #{editingSub.ticketCode}
              </h3>
              <button
                type="button"
                onClick={() => setEditingSub(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSubEdit} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Judul Pengajuan *
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  maxLength={AUTH_SCHEMA_LIMITS.TITLE_MAX}
                  required
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Keterangan / Keperluan *
                </label>
                <textarea
                  rows={3}
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  maxLength={AUTH_SCHEMA_LIMITS.DESC_MAX}
                  required
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nomor HP / WhatsApp
                  </label>
                  <input
                    type="tel"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    maxLength={AUTH_SCHEMA_LIMITS.PHONE_MAX}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Alamat Domisili *
                  </label>
                  <input
                    type="text"
                    value={editAddress}
                    onChange={(e) => setEditAddress(e.target.value)}
                    maxLength={AUTH_SCHEMA_LIMITS.ADDRESS_MAX}
                    required
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingSub(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingSubEdit}
                  className="px-4 py-2 rounded-xl bg-[#0D3868] text-white text-xs font-extrabold cursor-pointer disabled:opacity-70"
                >
                  {isSavingSubEdit ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
