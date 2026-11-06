import React from 'react';
import { Lock, UserCheck, X, ShieldAlert } from 'lucide-react';

interface RestrictedAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  isLoggedIn?: boolean;
  onNavigateToLogin?: () => void;
  onLogin?: () => void;
}

export const RestrictedAccessModal: React.FC<RestrictedAccessModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  isLoggedIn = false,
  onNavigateToLogin,
  onLogin,
}) => {
  if (!isOpen) return null;
  const handleLoginClick = onNavigateToLogin || onLogin;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0D3868] via-[#072647] to-[#0277BD] p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center text-amber-300 font-bold shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base">Akses Fitur Dibatasi</h3>
              <p className="text-xs text-sky-100">Diperlukan Akun Warga Terdaftar</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/90 hover:text-white cursor-pointer transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-center">
          <div className="inline-flex items-center justify-center px-3.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold max-w-full">
            <ShieldAlert className="w-3.5 h-3.5 mr-1.5 text-amber-600 shrink-0" />
            <span className="truncate">Fitur: {title}</span>
          </div>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            {description ||
              (!isLoggedIn
                ? `Fitur "${title}" memerlukan akun warga terdaftar. Silakan masuk atau mendaftar akun warga terlebih dahulu untuk mengakses layanan dan informasi ini.`
                : `Fitur "${title}" saat ini sedang dibatasi oleh Administrator Kelurahan Panaikang.`)}
          </p>

          <div className="pt-2 flex flex-col gap-2">
            {!isLoggedIn && handleLoginClick && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  handleLoginClick();
                }}
                className="w-full py-3 px-4 rounded-xl bg-[#0D3868] hover:bg-[#072647] text-white text-xs sm:text-sm font-extrabold shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <UserCheck className="w-4 h-4 text-emerald-400" />
                <span>Masuk / Daftar Akun Warga</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all cursor-pointer"
            >
              {isLoggedIn ? 'Mengerti' : 'Tutup & Kembali'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
