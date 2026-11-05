import React, { useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Lock,
  Unlock,
  Check,
  X,
  Mail,
  UserCheck,
  Clock,
  RefreshCw,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Users,
  Sliders,
  ExternalLink,
  Building2,
  UserX,
} from 'lucide-react';
import {
  AdminUserAccount,
  GoogleAdminVerificationRequest,
  KelolaAdminWargaSubTab,
} from '../types';
import {
  loadGoogleAdminVerificationRequests,
  saveGoogleAdminVerificationRequests,
} from '../firebase/authService';
import { getRealtimeDateString, getRealtimeDateTimeString } from '../utils/realtimeDate';

interface AdminOtoritasMasterPanelProps {
  adminUsers: AdminUserAccount[];
  isMasterLurah: boolean;
  currentUsername: string;
  onSaveAdminUsers: (
    updatedUsers: AdminUserAccount[]
  ) => Promise<{ ok: boolean; errors?: string[] }>;
  onForceTakeover?: (masterPassword: string) => Promise<{ ok: boolean; message?: string; error?: string }>;
  onRecordAudit?: (params: {
    actionType: 'CREATE' | 'UPDATE' | 'DELETE' | 'EXPORT';
    targetLabel: string;
    summary: string;
    details?: string;
  }) => void;
  onSwitchSubTab?: (tab: KelolaAdminWargaSubTab) => void;
}

export const AdminOtoritasMasterPanel: React.FC<AdminOtoritasMasterPanelProps> = ({
  adminUsers,
  isMasterLurah,
  currentUsername,
  onSaveAdminUsers,
  onForceTakeover,
  onRecordAudit,
  onSwitchSubTab,
}) => {
  const [googleRequests, setGoogleRequests] = useState<GoogleAdminVerificationRequest[]>(() =>
    loadGoogleAdminVerificationRequests()
  );
  const [newGoogleEmail, setNewGoogleEmail] = useState('');
  const [selectedAdminIdForGoogle, setSelectedAdminIdForGoogle] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState('');
  const [feedbackErrors, setFeedbackErrors] = useState<string[]>([]);

  // Takeover state
  const [takeoverPassword, setTakeoverPassword] = useState('');
  const [takeoverNotice, setTakeoverNotice] = useState('');

  const pendingRequests = googleRequests.filter(
    (r) => r.status === 'Menunggu Persetujuan'
  );
  const verifiedAdmins = adminUsers.filter(
    (u) => u.isGoogleVerified || u.isMasterLurah || u.googleEmail
  );

  const handleRefreshRequests = () => {
    setGoogleRequests(loadGoogleAdminVerificationRequests());
    setFeedbackSuccess('Daftar permohonan verifikasi berhasil dimuat ulang.');
  };

  const handleApproveRequest = async (
    req: GoogleAdminVerificationRequest,
    targetAdminId: string
  ) => {
    const targetAdmin = adminUsers.find((u) => u.id === targetAdminId);
    if (!targetAdmin) {
      setFeedbackErrors(['Pilih akun pejabat struktural terlebih dahulu.']);
      return;
    }

    setIsProcessing(true);
    setFeedbackErrors([]);
    setFeedbackSuccess('');

    const nowStr = getRealtimeDateTimeString(new Date());
    const nextUsers = adminUsers.map((u) =>
      u.id === targetAdminId
        ? {
            ...u,
            googleEmail: req.email.toLowerCase().trim(),
            isGoogleVerified: true,
            googleVerifiedAt: nowStr,
            googleVerifiedBy: 'Master Admin (Lurah Panaikang)',
            updatedAt: `${getRealtimeDateString(new Date())} · Verifikasi Google Disetujui`,
          }
        : u
    );

    const res = await onSaveAdminUsers(nextUsers);
    setIsProcessing(false);

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

      if (onRecordAudit) {
        onRecordAudit({
          actionType: 'UPDATE',
          targetLabel: `Otoritas Google Admin · ${targetAdmin.fullName}`,
          summary: `Master Admin menyetujui verifikasi login Google untuk ${req.email} ditautkan ke ${targetAdmin.fullName}`,
          details: `Email Google: ${req.email} · Jabatan: ${targetAdmin.jabatan}`,
        });
      }

      setFeedbackSuccess(
        `Akun Google "${req.email}" berhasil diverifikasi dan ditautkan ke pejabat "${targetAdmin.fullName}". Pejabat ini kini dapat masuk via Google.`
      );
    } else {
      setFeedbackErrors(res.errors || ['Gagal menyetujui permohonan verifikasi.']);
    }
  };

  const handleRejectRequest = (reqId: string) => {
    const target = googleRequests.find((r) => r.id === reqId);
    const nowStr = getRealtimeDateTimeString(new Date());
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

    if (onRecordAudit && target) {
      onRecordAudit({
        actionType: 'UPDATE',
        targetLabel: `Tolak Verifikasi Google · ${target.email}`,
        summary: `Master Admin menolak permohonan verifikasi login Google untuk ${target.email}`,
      });
    }

    setFeedbackSuccess('Permohonan verifikasi akun Google berhasil ditolak.');
  };

  const handleDirectWhitelist = async () => {
    setFeedbackErrors([]);
    setFeedbackSuccess('');

    if (!newGoogleEmail.trim() || !newGoogleEmail.includes('@')) {
      setFeedbackErrors(['Masukkan alamat email Google yang valid (misal: nama.staf@gmail.com).']);
      return;
    }
    if (!selectedAdminIdForGoogle) {
      setFeedbackErrors(['Pilih akun pejabat/staf struktural yang akan ditautkan dengan email Google ini.']);
      return;
    }

    const cleanEmail = newGoogleEmail.trim().toLowerCase();
    const targetAdmin = adminUsers.find((u) => u.id === selectedAdminIdForGoogle);
    if (!targetAdmin) return;

    setIsProcessing(true);
    const nowStr = getRealtimeDateTimeString(new Date());
    const nextUsers = adminUsers.map((u) =>
      u.id === selectedAdminIdForGoogle
        ? {
            ...u,
            googleEmail: cleanEmail,
            isGoogleVerified: true,
            googleVerifiedAt: nowStr,
            googleVerifiedBy: 'Master Admin (Lurah Panaikang)',
            updatedAt: `${getRealtimeDateString(new Date())} · Whitelist Google Mandiri`,
          }
        : u
    );

    const res = await onSaveAdminUsers(nextUsers);
    setIsProcessing(false);

    if (res.ok) {
      setNewGoogleEmail('');
      setSelectedAdminIdForGoogle('');

      if (onRecordAudit) {
        onRecordAudit({
          actionType: 'CREATE',
          targetLabel: `Whitelist Google · ${cleanEmail}`,
          summary: `Master Admin mendaftarkan email Google ${cleanEmail} untuk pejabat ${targetAdmin.fullName}`,
          details: `Jabatan: ${targetAdmin.jabatan} · Seksi: ${targetAdmin.unitBidang}`,
        });
      }

      setFeedbackSuccess(
        `Email Google "${cleanEmail}" berhasil didaftarkan dan diverifikasi untuk pejabat "${targetAdmin.fullName}".`
      );
    } else {
      setFeedbackErrors(res.errors || ['Gagal mendaftarkan email Google.']);
    }
  };

  const handleRevokeGoogle = async (userId: string) => {
    const targetAdmin = adminUsers.find((u) => u.id === userId);
    if (!targetAdmin) return;

    if (targetAdmin.isMasterLurah) {
      setFeedbackErrors(['Otoritas login Master Admin (Lurah) utama tidak dapat dicabut.']);
      return;
    }

    setIsProcessing(true);
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
    setIsProcessing(false);

    if (res.ok) {
      if (onRecordAudit) {
        onRecordAudit({
          actionType: 'DELETE',
          targetLabel: `Cabut Otoritas Google · ${targetAdmin.fullName}`,
          summary: `Master Admin mencabut otorisasi login Google untuk pejabat ${targetAdmin.fullName} (${targetAdmin.googleEmail || '-'})`,
        });
      }

      setFeedbackSuccess(
        `Otorisasi login Google untuk pejabat "${targetAdmin.fullName}" telah berhasil dicabut.`
      );
    } else {
      setFeedbackErrors(res.errors || ['Gagal mencabut otorisasi Google.']);
    }
  };

  const handleTakeoverSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTakeoverNotice('');
    if (!takeoverPassword.trim()) {
      setTakeoverNotice('Masukkan kata sandi otoritas Master Lurah.');
      return;
    }

    if (onForceTakeover) {
      setIsProcessing(true);
      const res = await onForceTakeover(takeoverPassword.trim());
      setIsProcessing(false);
      if (res.ok) {
        setTakeoverNotice('✓ Sesi admin pada perangkat lain berhasil diputus paksa. Slot portal kini terbuka.');
        setTakeoverPassword('');
      } else {
        setTakeoverNotice(`Gagal: ${res.error || 'Kata sandi master tidak cocok.'}`);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Otoritas Master Admin */}
      <div className="bg-gradient-to-r from-[#0D3868] via-[#0B2F57] to-[#1C8237] rounded-3xl p-6 sm:p-7 text-white shadow-sm border border-slate-200">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-emerald-200 text-xs font-extrabold uppercase tracking-wider border border-white/20">
              <ShieldCheck className="w-4 h-4 text-emerald-300" />
              <span>Sub-Menu 1: Otoritas Master Admin (Lurah Panaikang)</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Pusat Kendali Keamanan & Verifikasi Login Admin
            </h2>
            <p className="text-xs sm:text-sm text-sky-100 max-w-3xl leading-relaxed">
              Otoritas tertinggi pengelolaan keamanan portal Kelurahan Panaikang. Master Admin (Lurah) memegang hak mutlak atas verifikasi akun login Google pejabat/staf, pemutusan sesi perangkat lain, dan pengawasan hak akses sesuai Perwali No. 65 Tahun 2023.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/20 shrink-0 space-y-1.5 text-xs">
            <div className="text-slate-300 text-[11px] font-semibold uppercase">Pejabat Otoritas Tertinggi:</div>
            <div className="text-sm font-extrabold text-white flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-emerald-300" />
              <span>Muthmainnah, SE, MM</span>
            </div>
            <div className="text-sky-200 text-[11px]">Lurah Panaikang (Super Admin)</div>
            <div className="text-emerald-300 text-[11px] font-mono-num">Google: AsmaraCess@gmail.com</div>
          </div>
        </div>

        {/* 4 Cards Metrik Otoritas */}
        <div className="mt-6 pt-5 border-t border-white/20 grid grid-cols-2 md:grid-cols-4 gap-3 text-slate-800">
          <div className="p-3.5 rounded-2xl bg-white/95 border border-white/40 shadow-xs">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Status Otoritas
            </div>
            <div className="mt-1 text-base sm:text-lg font-black text-emerald-700 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Aktif Penuh</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Perwali Makassar No. 65/2023</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/95 border border-white/40 shadow-xs">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Permohonan Verifikasi
            </div>
            <div className="mt-1 text-base sm:text-lg font-black text-amber-700 font-mono-num flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-600" />
              <span>{pendingRequests.length} Menunggu</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Akun Google Staf Kelurahan</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/95 border border-white/40 shadow-xs">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Admin Google Terverifikasi
            </div>
            <div className="mt-1 text-base sm:text-lg font-black text-[#0D3868] font-mono-num flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-[#0277BD]" />
              <span>{verifiedAdmins.length} Akun Whitelist</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Dapat login via Google</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/95 border border-white/40 shadow-xs">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Proteksi Akses
            </div>
            <div className="mt-1 text-base sm:text-lg font-black text-[#0277BD] flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-emerald-600" />
              <span>Zero-Trust</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Warga otomatis diblokir admin</div>
          </div>
        </div>
      </div>

      {/* Feedback Alerts */}
      {feedbackErrors.length > 0 && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-900 flex items-start justify-between gap-3 text-xs sm:text-sm">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold">Perhatian:</div>
              <ul className="mt-1 list-disc list-inside space-y-0.5 text-xs">
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
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex items-start justify-between gap-3 text-xs sm:text-sm">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-semibold">{feedbackSuccess}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackSuccess('')}
            className="text-emerald-700 hover:text-emerald-900 cursor-pointer text-xs font-bold"
          >
            Tutup
          </button>
        </div>
      )}

      {/* SEKSI 1: ANTREAN PERMOHONAN VERIFIKASI AKUN GOOGLE MASUK */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="bg-gradient-to-r from-amber-500 to-amber-700 px-5 sm:px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
              <Clock className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-white">
                Permohonan Verifikasi Akun Google Masuk ({pendingRequests.length})
              </h3>
              <p className="text-[11px] text-amber-100">
                Staf yang mencoba login dengan Google dan memerlukan persetujuan Master Admin Lurah
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleRefreshRequests}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold cursor-pointer transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Muat Ulang</span>
          </button>
        </div>

        <div className="p-5 sm:p-6">
          {pendingRequests.length === 0 ? (
            <div className="p-6 rounded-2xl bg-slate-50 border border-dashed border-slate-300 text-center space-y-1.5">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
              <div className="text-xs font-bold text-slate-700">Tidak ada permohonan yang menunggu persetujuan</div>
              <div className="text-[11px] text-slate-500">
                Seluruh akun Google staf yang berhak telah diverifikasi atau belum ada staf baru yang mengajukan.
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingRequests.map((req) => (
                <div
                  key={req.id}
                  className="p-4 rounded-2xl border border-amber-200 bg-amber-50/50 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-amber-200 text-amber-900 font-bold flex items-center justify-center text-sm shrink-0">
                      {req.email.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                        <Mail className="w-4 h-4 text-amber-700" />
                        <span className="font-mono-num">{req.email}</span>
                      </div>
                      <div className="text-xs text-slate-600 mt-0.5">
                        Nama Google: <span className="font-semibold text-slate-800">{req.displayName || '-'}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Diajukan pada: <span className="font-mono-num">{req.requestedAt}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-2 lg:pt-0 border-t lg:border-t-0 border-amber-200">
                    <select
                      id={`select-role-${req.id}`}
                      defaultValue=""
                      className="px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-800 focus:border-[#0D3868] focus:outline-none"
                    >
                      <option value="">-- Tetapkan Jabatan Pejabat --</option>
                      {adminUsers.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.fullName} ({u.jabatan})
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() => {
                        const sel = document.getElementById(
                          `select-role-${req.id}`
                        ) as HTMLSelectElement | null;
                        if (!sel || !sel.value) {
                          setFeedbackErrors(['Pilih akun pejabat struktural untuk ditautkan terlebih dahulu.']);
                          return;
                        }
                        handleApproveRequest(req, sel.value);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Setujui & Verifikasi</span>
                    </button>

                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() => handleRejectRequest(req.id)}
                      className="px-3 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold cursor-pointer disabled:opacity-50"
                    >
                      Tolak
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* SEKSI 2: DAFTARKAN EMAIL GOOGLE STAF SECARA MANDIRI OLEH LURAH */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-200">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
            <UserCheck className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-extrabold text-[#0D3868]">
              Daftarkan & Verifikasi Email Google Staf Baru (Pre-Registration)
            </h3>
            <p className="text-[11px] text-slate-500">
              Lurah dapat mendaftarkan email Google staf terlebih dahulu agar staf dapat langsung login tanpa menunggu permohonan
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-5">
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Alamat Email Akun Google Staf
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={newGoogleEmail}
                onChange={(e) => setNewGoogleEmail(e.target.value)}
                placeholder="nama.staf@gmail.com"
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-900 font-mono-num focus:border-[#0D3868] focus:outline-none"
              />
            </div>
          </div>

          <div className="sm:col-span-4">
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Tautkan ke Akun Pejabat / Staf
            </label>
            <select
              value={selectedAdminIdForGoogle}
              onChange={(e) => setSelectedAdminIdForGoogle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-semibold text-slate-800 bg-white focus:border-[#0D3868] focus:outline-none"
            >
              <option value="">-- Pilih Akun Pejabat --</option>
              {adminUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.fullName} ({u.jabatan})
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-3 flex items-end">
            <button
              type="button"
              disabled={isProcessing}
              onClick={handleDirectWhitelist}
              className="w-full py-2.5 px-4 rounded-xl bg-[#0D3868] hover:bg-[#072647] text-white text-xs sm:text-sm font-extrabold transition shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-300" />
              <span>Verifikasi Email</span>
            </button>
          </div>
        </div>
      </div>

      {/* SEKSI 3: DAFTAR AKUN ADMIN TERVERIFIKASI GOOGLE SAAT INI */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-5 sm:p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#0D3868] text-white flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-emerald-300" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-[#0D3868]">
                Daftar Akun Administrator yang Memiliki Izin Login Google
              </h3>
              <p className="text-[11px] text-slate-500">
                Pejabat/staf yang telah diverifikasi oleh Master Admin (Lurah) dan berhak masuk ke panel
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold w-fit">
            {verifiedAdmins.length} Akun Terdaftar
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="p-3.5 pl-6">Pejabat / Staf</th>
                <th className="p-3.5">Jabatan & Seksi</th>
                <th className="p-3.5">Email Google Tertaut</th>
                <th className="p-3.5">Status Whitelist</th>
                <th className="p-3.5 pr-6 text-right">Aksi Lurah</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {verifiedAdmins.map((u) => {
                const isSuper = u.isMasterLurah || u.googleEmail === 'AsmaraCess@gmail.com';
                const isVerified = u.isGoogleVerified || isSuper;

                return (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3.5 pl-6">
                      <div className="font-extrabold text-slate-900 text-xs sm:text-sm">
                        {u.fullName}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono-num">
                        Username: @{u.username} · NIP. {u.nip}
                      </div>
                    </td>
                    <td className="p-3.5">
                      <div className="font-semibold text-[#0D3868]">{u.jabatan}</div>
                      <div className="text-[11px] text-slate-500">{u.unitBidang}</div>
                    </td>
                    <td className="p-3.5 font-mono-num font-bold text-slate-800">
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span>{u.googleEmail || (isSuper ? 'AsmaraCess@gmail.com' : '-')}</span>
                      </div>
                    </td>
                    <td className="p-3.5">
                      {isSuper ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-extrabold">
                          <ShieldCheck className="w-3 h-3 text-amber-700" />
                          Master Admin (Lurah)
                        </span>
                      ) : isVerified ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px] font-extrabold">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Terverifikasi Lurah
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-semibold">
                          Belum Diverifikasi
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 pr-6 text-right">
                      {!isSuper && isVerified && (
                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() => handleRevokeGoogle(u.id)}
                          className="px-2.5 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold cursor-pointer transition disabled:opacity-50"
                        >
                          Cabut Izin
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* SEKSI 4: KONTROL PUTUS PAKSA SESI PERANGKAT LAIN (FORCE TAKEOVER) & PINTASAN SUB-MENU */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Force Takeover Card */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-slate-900 font-extrabold text-sm">
            <KeyRound className="w-4 h-4 text-[#0D3868]" />
            <span>Putus Sesi Paksa Perangkat Lain (Force Takeover)</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Jika sesi admin terkunci karena ada perangkat lain yang belum logout, Master Admin dapat memutus sesi tersebut dengan sandi otoritas master.
          </p>
          <form onSubmit={handleTakeoverSubmit} className="space-y-2">
            <div className="flex gap-2">
              <input
                type="password"
                value={takeoverPassword}
                onChange={(e) => setTakeoverPassword(e.target.value)}
                placeholder="Kata Sandi Otoritas Master..."
                className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs focus:border-[#0D3868] focus:outline-none"
              />
              <button
                type="submit"
                disabled={isProcessing}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold cursor-pointer transition disabled:opacity-50 shrink-0"
              >
                Putus Sesi
              </button>
            </div>
            {takeoverNotice && (
              <div className="text-[11px] font-semibold text-[#0D3868] bg-sky-50 p-2 rounded-lg border border-sky-200">
                {takeoverNotice}
              </div>
            )}
          </form>
        </div>

        {/* Pintasan Sub-Menu Lain */}
        <div className="p-5 rounded-3xl bg-gradient-to-br from-slate-50 to-sky-50/50 border border-slate-200 shadow-xs flex flex-col justify-between gap-3">
          <div>
            <div className="text-xs font-bold text-[#0D3868] uppercase tracking-wider mb-1">
              Navigasi Cepat Kelola Admin & Warga
            </div>
            <p className="text-xs text-slate-600">
              Beralih cepat ke pengaturan akun pejabat atau direktori warga terdaftar:
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {onSwitchSubTab && (
              <>
                <button
                  type="button"
                  onClick={() => onSwitchSubTab('parameter_admin')}
                  className="flex-1 min-w-[140px] px-3.5 py-2.5 rounded-xl bg-[#0D3868] hover:bg-[#072647] text-white text-xs font-bold shadow-xs cursor-pointer flex items-center justify-center gap-1.5 transition"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Parameter Admin</span>
                </button>
                <button
                  type="button"
                  onClick={() => onSwitchSubTab('user_warga')}
                  className="flex-1 min-w-[140px] px-3.5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold shadow-xs cursor-pointer flex items-center justify-center gap-1.5 transition"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>User Warga Terdaftar</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
