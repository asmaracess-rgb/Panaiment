import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  UserPlus,
  LogIn,
  AlertCircle,
  CheckCircle2,
  User,
  Phone,
  MapPin,
  Loader2,
  Building2,
} from 'lucide-react';
import { AppView, AuthenticatedUserProfile, RwGroup } from '../types';
import {
  signInWithGoogleAccount,
  AUTH_SCHEMA_LIMITS,
} from '../firebase/authService';
import { EmblemKotaMakassar, EmblemKelurahanPanaikang } from './Emblems';

interface AuthViewProps {
  rwGroups: RwGroup[];
  onAuthSuccess?: (profile: AuthenticatedUserProfile) => void;
  onAuthenticated?: (profile: AuthenticatedUserProfile) => void;
  onNavigate: (view: AppView) => void;
  redirectNotice?: string;
  initialNotice?: string;
}

type AuthMode = 'login' | 'register';

const DEFAULT_RW_OPTIONS = ['RW 01', 'RW 02', 'RW 03', 'RW 04', 'RW 05', 'RW 06', 'RW 07'];
const DEFAULT_RT_OPTIONS = ['RT 01', 'RT 02', 'RT 03', 'RT 04', 'RT 05'];

const GoogleBrandIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="#4285F4"
      d="M23.49 12.275c0-.85-.075-1.675-.215-2.475H12v4.69h6.445c-.28 1.495-1.125 2.765-2.395 3.615v3.005h3.875c2.265-2.085 3.565-5.16 3.565-8.835z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.24 0 5.955-1.075 7.94-2.91l-3.875-3.005c-1.075.72-2.45 1.15-4.065 1.15-3.125 0-5.77-2.11-6.715-4.945H1.275v3.1C3.25 21.305 7.31 24 12 24z"
    />
    <path
      fill="#FBBC05"
      d="M5.285 14.29c-.24-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.61H1.275C.465 8.225 0 10.06 0 12s.465 3.775 1.275 5.39l4.01-3.1z"
    />
    <path
      fill="#EA4335"
      d="M12 4.765c1.76 0 3.34.605 4.585 1.795l3.44-3.44C17.95 1.19 15.235 0 12 0 7.31 0 3.25 2.695 1.275 6.61l4.01 3.1C6.23 6.875 8.875 4.765 12 4.765z"
    />
  </svg>
);

export const AuthView: React.FC<AuthViewProps> = ({
  rwGroups,
  onAuthSuccess,
  onAuthenticated,
  onNavigate,
  redirectNotice,
  initialNotice,
}) => {
  const [mode, setMode] = useState<AuthMode>('login');

  // Citizen Registration State
  const [regFullName, setRegFullName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regRw, setRegRw] = useState('RW 01');
  const [regRt, setRegRt] = useState('RT 01');
  const [regAddress, setRegAddress] = useState('');

  // Status & Feedback
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const effectiveNotice = redirectNotice || initialNotice;

  const notifyAuthenticated = (profile: AuthenticatedUserProfile) => {
    if (onAuthenticated) {
      onAuthenticated(profile);
    } else if (onAuthSuccess) {
      onAuthSuccess(profile);
    }
  };

  const availableRws = useMemo(() => {
    if (Array.isArray(rwGroups) && rwGroups.length > 0) {
      return rwGroups.map((g) => g.rwCode);
    }
    return DEFAULT_RW_OPTIONS;
  }, [rwGroups]);

  const availableRts = useMemo(() => {
    const found = rwGroups.find((g) => g.rwCode === regRw);
    if (found && Array.isArray(found.rtList) && found.rtList.length > 0) {
      return found.rtList.map((r) => r.rtCode);
    }
    return DEFAULT_RT_OPTIONS;
  }, [rwGroups, regRw]);

  const switchMode = (nextMode: AuthMode) => {
    setErrorMessage('');
    setSuccessMessage('');
    setMode(nextMode);
  };

  const handleGoogleLogin = async () => {
    setErrorMessage('');
    setSuccessMessage('');
    setIsLoading(true);

    const result = await signInWithGoogleAccount();
    setIsLoading(false);

    if (!result.ok || !result.profile) {
      setErrorMessage(result.error || 'Gagal memproses akses masuk. Silakan coba kembali.');
      return;
    }

    setSuccessMessage(`Selamat datang, ${result.profile.fullName}!`);
    notifyAuthenticated(result.profile);
  };

  const handleGoogleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const cleanName = regFullName.trim();
    const cleanPhone = regPhone.trim();
    const cleanAddr = regAddress.trim();

    if (cleanName.length < AUTH_SCHEMA_LIMITS.NAME_MIN) {
      setErrorMessage('Nama lengkap sesuai KTP wajib diisi (minimal 2 karakter).');
      return;
    }

    setIsLoading(true);
    const result = await signInWithGoogleAccount({
      fullName: cleanName,
      nik: '',
      phone: cleanPhone,
      rw: regRw,
      rt: regRt,
      address: cleanAddr || 'Kelurahan Panaikang, Kec. Panakkukang, Kota Makassar',
    });
    setIsLoading(false);

    if (!result.ok || !result.profile) {
      setErrorMessage(result.error || 'Gagal memproses pendaftaran warga.');
      return;
    }

    setSuccessMessage(`Pendaftaran warga berhasil! Selamat datang, ${result.profile.fullName}.`);
    notifyAuthenticated(result.profile);
  };

  return (
    <div className="min-h-[calc(100vh-56px)] bg-gradient-to-b from-slate-100 via-slate-50 to-white py-8 px-4 sm:px-6 flex flex-col justify-center">
      <div className="mx-auto w-full max-w-5xl">
        {/* Top Back Navigation */}
        <div className="mb-5 flex items-center justify-between flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onNavigate('beranda')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0D3868] hover:text-[#0277BD] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Halaman Publik</span>
          </button>
        </div>

        {/* Main Split Card */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-[0_20px_50px_-15px_rgba(13,56,104,0.16)] overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          {/* Left Institutional Info Column */}
          <div className="lg:col-span-5 bg-gradient-to-br from-[#072647] via-[#0D3868] to-[#0277BD] text-white p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden">
            <div className="relative z-10">
              <div className="inline-flex items-center gap-3.5 mb-5">
                <EmblemKotaMakassar className="w-12 h-14 drop-shadow-md" />
                <div className="h-10 w-[1.5px] bg-white/25 rounded-full" />
                <EmblemKelurahanPanaikang className="w-12 h-14 drop-shadow-md" />
              </div>

              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/10 border border-white/20 text-sky-200 text-[10px] font-extrabold uppercase tracking-wider mb-3">
                <Building2 className="w-3.5 h-3.5" />
                <span>Portal Pelayanan Warga</span>
              </div>

              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white leading-snug">
                Pelayanan Administrasi & Pengaduan Warga Kelurahan Panaikang
              </h1>

              <p className="mt-3 text-xs sm:text-sm text-sky-100/90 leading-relaxed">
                Akses pengajuan surat keterangan resmi, penyampaian laporan lingkungan, serta
                pemantauan status berkas secara terpadu melalui Dashboard Warga.
              </p>

              <div className="mt-6 space-y-3 border-t border-white/15 pt-5 text-xs text-sky-100">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-white">13 Layanan Persuratan Resmi:</strong> Ajukan
                    permohonan surat pengantar dan keterangan sesuai standar pelayanan kelurahan.
                  </span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-white">Riwayat & Status Real-Time:</strong> Pantau
                    perkembangan verifikasi berkas dan tindak lanjut laporan Anda di satu halaman.
                  </span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-white">Privasi Berkas Warga:</strong> Setiap warga
                    hanya dapat mengakses riwayat permohonan dan data domisili miliknya sendiri.
                  </span>
                </div>
              </div>
            </div>

            <div className="relative z-10 mt-8 pt-4 border-t border-white/15 text-[11px] text-sky-200/80 flex items-center justify-between">
              <span>Kecamatan Panakkukang · Kota Makassar</span>
              <span className="font-mono-num font-bold">Kode Pos 90231</span>
            </div>
          </div>

          {/* Right Form Column */}
          <div className="lg:col-span-7 p-6 sm:p-9 flex flex-col justify-center">
            {/* Mode Switch Tabs */}
            <div className="grid grid-cols-2 gap-1.5 p-1.5 rounded-2xl bg-slate-100 border border-slate-200/80 mb-6">
              <button
                type="button"
                onClick={() => switchMode('login')}
                className={`py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  mode === 'login'
                    ? 'bg-[#0D3868] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Masuk Warga</span>
              </button>
              <button
                type="button"
                onClick={() => switchMode('register')}
                className={`py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  mode === 'register'
                    ? 'bg-[#1C8237] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Pendaftaran Warga Baru</span>
              </button>
            </div>

            {effectiveNotice && (
              <div className="mb-4 p-3.5 rounded-xl bg-sky-50 border border-sky-200 text-xs font-semibold text-[#0D3868]">
                {effectiveNotice}
              </div>
            )}

            {errorMessage && (
              <div
                role="alert"
                className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs font-medium text-red-800 flex items-start gap-2.5"
              >
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div
                role="status"
                className="mb-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-900 flex items-start gap-2.5"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{successMessage}</span>
              </div>
            )}

            {mode === 'login' ? (
              /* ================= MODE 1: MASUK WARGA ================= */
              <div className="space-y-5">
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900">
                    Masuk ke Dashboard Warga
                  </h2>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Silakan masuk untuk mengajukan permohonan surat administrasi, membuat laporan
                    warga, serta memantau status pengajuan Anda.
                  </p>
                </div>

                <button
                  type="button"
                  disabled={isLoading}
                  onClick={handleGoogleLogin}
                  className="w-full py-3.5 px-4 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border-2 border-slate-200 hover:border-[#0D3868] text-sm font-extrabold shadow-xs transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-70 disabled:cursor-wait"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin text-[#0D3868]" />
                      <span>Memproses Akses Masuk...</span>
                    </>
                  ) : (
                    <>
                      <GoogleBrandIcon className="w-5 h-5 shrink-0" />
                      <span>Lanjutkan dengan Google</span>
                    </>
                  )}
                </button>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                  <span>Warga baru yang ingin melengkapi biodata RT/RW?</span>
                  <button
                    type="button"
                    onClick={() => switchMode('register')}
                    className="font-extrabold text-[#1C8237] hover:underline cursor-pointer"
                  >
                    Daftar Akun Warga Baru →
                  </button>
                </div>
              </div>
            ) : (
              /* ================= MODE 2: PENDAFTARAN WARGA BARU ================= */
              <form onSubmit={handleGoogleRegisterSubmit} className="space-y-3.5" noValidate>
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900">
                    Formulir Pendaftaran Warga
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    Lengkapi biodata domisili Anda di Kelurahan Panaikang untuk mempermudah
                    pengajuan surat dan layanan warga.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nama Lengkap (Sesuai KTP) *
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={regFullName}
                        onChange={(e) => setRegFullName(e.target.value)}
                        placeholder="Nama lengkap Anda"
                        maxLength={AUTH_SCHEMA_LIMITS.NAME_MAX}
                        required
                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-900 focus:border-[#1C8237] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nomor HP / WhatsApp (Aktif)
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        placeholder="0812xxxxxxxx"
                        maxLength={AUTH_SCHEMA_LIMITS.PHONE_MAX}
                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-900 font-mono-num focus:border-[#1C8237] focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Wilayah RW *
                    </label>
                    <select
                      value={regRw}
                      onChange={(e) => {
                        setRegRw(e.target.value);
                        setRegRt('RT 01');
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-900 bg-white focus:border-[#1C8237] focus:outline-none"
                    >
                      {availableRws.map((rwCode) => (
                        <option key={rwCode} value={rwCode}>
                          {rwCode}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Wilayah RT *
                    </label>
                    <select
                      value={regRt}
                      onChange={(e) => setRegRt(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-900 bg-white focus:border-[#1C8237] focus:outline-none"
                    >
                      {availableRts.map((rtCode) => (
                        <option key={rtCode} value={rtCode}>
                          {rtCode}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Alamat Domisili di Kelurahan Panaikang
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={regAddress}
                      onChange={(e) => setRegAddress(e.target.value)}
                      placeholder="Contoh: Jl. Urip Sumoharjo Lr. 2 No. 14"
                      maxLength={AUTH_SCHEMA_LIMITS.ADDRESS_MAX}
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-900 focus:border-[#1C8237] focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 px-4 rounded-xl bg-[#1C8237] hover:bg-[#146329] text-white text-sm font-extrabold shadow-sm transition-colors flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-70 disabled:cursor-wait"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Memproses Pendaftaran...</span>
                    </>
                  ) : (
                    <>
                      <span className="w-6 h-6 rounded-full bg-white flex items-center justify-center shrink-0">
                        <GoogleBrandIcon className="w-4 h-4" />
                      </span>
                      <span>Daftar & Lanjutkan dengan Google</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
