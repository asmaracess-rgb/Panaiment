import React, { useState } from 'react';
import {
  Home,
  FileText,
  Megaphone,
  MapPin,
  Grid,
  X,
  Building2,
  Users,
  Recycle,
  Sparkles,
  Sprout,
  BarChart3,
  ShieldCheck,
  UserCheck,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  LogOut,
} from 'lucide-react';
import { AppView, AuthenticatedUserProfile, CitizenMenuKey } from '../types';

interface BottomNavBarProps {
  activeView: AppView;
  activeWargaModule?: 'hub' | 'pra_registrasi' | 'pengaduan';
  onNavigate: (view: AppView, initialWargaModule?: 'hub' | 'pra_registrasi' | 'pengaduan') => void;
  isCitizenMenuAllowed: (menuKey: CitizenMenuKey) => boolean;
  authUserProfile: AuthenticatedUserProfile | null;
  onLogout?: () => Promise<void> | void;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  activeView,
  activeWargaModule = 'hub',
  onNavigate,
  isCitizenMenuAllowed,
  authUserProfile,
  onLogout,
}) => {
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [hiddenOnAdmin, setHiddenOnAdmin] = useState(false);

  const isAdminPage = activeView === 'admin' || activeView === 'lurah';

  const secondaryViews: AppView[] = [
    'profil',
    'rtrw',
    'sampah',
    'kerjabakti',
    'urbanfarming',
    'lurah',
    'admin',
    'dashboard_warga',
    'login',
  ];
  const isSecondaryActive = secondaryViews.includes(activeView);

  const allDrawerItems: Array<{
    key: AppView;
    menuKey?: CitizenMenuKey;
    wargaSubModule?: 'hub' | 'pra_registrasi' | 'pengaduan';
    label: string;
    subtitle: string;
    icon: React.FC<{ className?: string }>;
    badgeColor: string;
  }> = [
    {
      key: 'beranda',
      menuKey: 'beranda',
      label: 'Beranda Utama',
      subtitle: 'Ringkasan informasi & sorotan Kelurahan Panaikang',
      icon: Home,
      badgeColor: 'bg-sky-100 text-[#0D3868]',
    },
    {
      key: 'profil',
      menuKey: 'profil',
      label: 'Profil Kelurahan',
      subtitle: 'Visi-misi, struktur organisasi & data wilayah',
      icon: Building2,
      badgeColor: 'bg-indigo-100 text-indigo-800',
    },
    {
      key: 'rtrw',
      menuKey: 'rtrw',
      label: 'Data RT & RW / Siskamling',
      subtitle: 'Direktori pengurus RW/RT & jadwal ronda malam',
      icon: Users,
      badgeColor: 'bg-blue-100 text-blue-800',
    },
    {
      key: 'warga',
      menuKey: 'warga',
      wargaSubModule: 'hub',
      label: 'Pelayanan Kelurahan',
      subtitle: 'Pra-registrasi persuratan & layanan administrasi',
      icon: FileText,
      badgeColor: 'bg-sky-100 text-sky-800',
    },
    {
      key: 'warga',
      menuKey: 'warga',
      wargaSubModule: 'pengaduan',
      label: 'Pengaduan Online Warga',
      subtitle: 'Kirim laporan lingkungan & fasilitas umum disertai foto',
      icon: Megaphone,
      badgeColor: 'bg-emerald-100 text-emerald-800',
    },
    {
      key: 'peta',
      menuKey: 'peta',
      label: 'Peta Digital Interaktif',
      subtitle: 'Sebaran titik pantau wilayah, BSU, Teba & Biopori',
      icon: MapPin,
      badgeColor: 'bg-cyan-100 text-cyan-800',
    },
    {
      key: 'sampah',
      menuKey: 'sampah',
      label: 'Pengelolaan Sampah',
      subtitle: 'Bank Sampah Unit (BSU), Teba Modern & Biopori',
      icon: Recycle,
      badgeColor: 'bg-amber-100 text-amber-800',
    },
    {
      key: 'kerjabakti',
      menuKey: 'kerjabakti',
      label: 'Kerja Bakti Wilayah',
      subtitle: 'Jadwal gotong royong & sorotan giat kebersihan',
      icon: Sparkles,
      badgeColor: 'bg-purple-100 text-purple-800',
    },
    {
      key: 'urbanfarming',
      menuKey: 'urbanfarming',
      label: 'Urban Farming & Bibit',
      subtitle: '7 kebun KWT produktif & permohonan bibit gratis',
      icon: Sprout,
      badgeColor: 'bg-emerald-100 text-emerald-800',
    },
    {
      key: 'lurah',
      menuKey: 'lurah',
      label: 'Dashboard Eksekutif Lurah',
      subtitle: 'Monitoring kinerja pelayanan & capaian lingkungan',
      icon: BarChart3,
      badgeColor: 'bg-slate-200 text-slate-800',
    },
  ];

  const allowedDrawerItems = allDrawerItems.filter(
    (item) => !item.menuKey || isCitizenMenuAllowed(item.menuKey)
  );

  const handleSelectNav = (
    view: AppView,
    wargaSubModule?: 'hub' | 'pra_registrasi' | 'pengaduan'
  ) => {
    setMoreMenuOpen(false);
    if (wargaSubModule) {
      onNavigate(view, wargaSubModule);
    } else {
      onNavigate(view);
    }
  };

  const isBerandaActive = activeView === 'beranda' && !moreMenuOpen;
  const isPelayananActive =
    activeView === 'warga' && activeWargaModule !== 'pengaduan' && !moreMenuOpen;
  const isPengaduanActive =
    activeView === 'warga' && activeWargaModule === 'pengaduan' && !moreMenuOpen;
  const isPetaActive = activeView === 'peta' && !moreMenuOpen;

  return (
    <>
      {/* Backdrop & Drawer for "Menu Lainnya" */}
      {moreMenuOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn"
          onClick={() => setMoreMenuOpen(false)}
        >
          <div
            className="w-full sm:max-w-2xl bg-white rounded-t-3xl sm:rounded-3xl border border-slate-200 shadow-2xl overflow-hidden max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="px-5 py-3.5 bg-gradient-to-r from-[#0D3868] to-[#155293] text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-sky-200 block">
                  Navigasi Satu Data Kelurahan
                </span>
                <h3 className="text-sm sm:text-base font-extrabold tracking-tight">
                  Menu Lainnya & Akun Layanan Warga
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setMoreMenuOpen(false)}
                className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-colors cursor-pointer"
                aria-label="Tutup menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Drawer Grid Content */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
              {/* Account & Portal Actions at Top of Drawer for Quick Access */}
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/90 flex flex-wrap items-center justify-between gap-2">
                {authUserProfile ? (
                  <div className="flex flex-wrap items-center gap-2">
                    {isCitizenMenuAllowed('dashboard_warga') && (
                      <button
                        type="button"
                        onClick={() => handleSelectNav('dashboard_warga')}
                        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#0D3868] hover:bg-[#09294D] text-white text-xs font-extrabold transition-colors cursor-pointer"
                      >
                        <UserCheck className="w-4 h-4" />
                        <span>Dashboard Warga ({authUserProfile.fullName})</span>
                      </button>
                    )}
                    {onLogout && (
                      <button
                        type="button"
                        onClick={async () => {
                          setMoreMenuOpen(false);
                          await onLogout();
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-extrabold transition-colors cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Keluar Akun</span>
                      </button>
                    )}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSelectNav('login')}
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#0D3868] hover:bg-[#09294D] text-white text-xs font-extrabold transition-colors cursor-pointer"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>Masuk / Daftar Akun Warga</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleSelectNav('admin')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4 text-[#0D3868]" />
                  <span>Portal Admin Kelurahan</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {allowedDrawerItems.map((item, idx) => {
                  const Icon = item.icon;
                  const isActive =
                    activeView === item.key &&
                    (!item.wargaSubModule || item.wargaSubModule === activeWargaModule);
                  return (
                    <button
                      key={`${item.key}-${idx}`}
                      type="button"
                      onClick={() => handleSelectNav(item.key, item.wargaSubModule)}
                      className={`w-full text-left p-3 rounded-2xl border transition-all flex items-center gap-3 cursor-pointer ${
                        isActive
                          ? 'bg-sky-50/90 border-[#0D3868] ring-1 ring-[#0D3868]/20 shadow-xs'
                          : 'bg-white border-slate-200/90 hover:border-slate-300 hover:bg-slate-50/70'
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${item.badgeColor}`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <p className="text-xs sm:text-sm font-extrabold text-slate-900 truncate">
                            {item.label}
                          </p>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        </div>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          {item.subtitle}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Show Button when hidden on Admin / Lurah pages */}
      {isAdminPage && hiddenOnAdmin ? (
        <div className="fixed bottom-3 right-3 sm:bottom-4 sm:right-5 z-40">
          <button
            type="button"
            onClick={() => setHiddenOnAdmin(false)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#0D3868] hover:bg-[#09294D] text-white text-xs font-extrabold shadow-lg border border-white/20 transition-all cursor-pointer"
            title="Tampilkan Bottom Navigation Bar"
          >
            <ChevronUp className="w-4 h-4" />
            <span>Tampilkan Navigasi</span>
          </button>
        </div>
      ) : (
        /* Fixed 5-Icon Bottom Navigation Bar (HP, Tablet & Desktop) */
        <div className="fixed bottom-0 inset-x-0 z-40 pointer-events-none flex flex-col items-center sm:bottom-3 sm:px-4">
          {/* Hide Toggle Pill on Admin / Lurah pages */}
          {isAdminPage && (
            <div className="pointer-events-auto mb-1">
              <button
                type="button"
                onClick={() => setHiddenOnAdmin(true)}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-800/90 hover:bg-slate-900 text-white text-[10px] font-bold shadow-sm border border-slate-700 transition-colors cursor-pointer"
                title="Sembunyikan navigasi bawah agar tabel admin terlihat penuh"
              >
                <ChevronDown className="w-3.5 h-3.5" />
                <span>Sembunyikan Navigasi</span>
              </button>
            </div>
          )}

          <nav
            aria-label="Navigasi Bawah Utama"
            className="pointer-events-auto w-full sm:w-auto sm:min-w-[500px] md:min-w-[600px] max-w-2xl bg-white/95 backdrop-blur-md border-t sm:border border-slate-200/90 sm:rounded-2xl shadow-[0_-4px_20px_-4px_rgba(15,23,42,0.12)] sm:shadow-[0_12px_32px_-8px_rgba(15,23,42,0.18)] px-2 sm:px-3.5 py-1.5 sm:py-2"
          >
            <div className="grid grid-cols-5 gap-1 sm:gap-2 items-center">
              {/* 1. Beranda */}
              <button
                type="button"
                onClick={() => handleSelectNav('beranda')}
                className={`group flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 py-1.5 sm:py-2 px-1 sm:px-3 rounded-xl border transition-all cursor-pointer ${
                  isBerandaActive
                    ? 'bg-sky-50 border-sky-200/80 text-[#0D3868] font-extrabold shadow-2xs'
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/70 font-semibold'
                }`}
              >
                <Home
                  className={`w-4 h-4 sm:w-4 sm:h-4 transition-transform group-hover:scale-105 shrink-0 ${
                    isBerandaActive ? 'text-[#0D3868]' : 'text-slate-500 group-hover:text-slate-800'
                  }`}
                />
                <span className="text-[10px] sm:text-xs tracking-tight truncate max-w-full">
                  Beranda
                </span>
              </button>

              {/* 2. Pelayanan */}
              <button
                type="button"
                onClick={() => handleSelectNav('warga', 'hub')}
                className={`group flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 py-1.5 sm:py-2 px-1 sm:px-3 rounded-xl border transition-all cursor-pointer ${
                  isPelayananActive
                    ? 'bg-sky-50 border-sky-200/80 text-[#0277BD] font-extrabold shadow-2xs'
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/70 font-semibold'
                }`}
              >
                <FileText
                  className={`w-4 h-4 sm:w-4 sm:h-4 transition-transform group-hover:scale-105 shrink-0 ${
                    isPelayananActive
                      ? 'text-[#0277BD]'
                      : 'text-slate-500 group-hover:text-slate-800'
                  }`}
                />
                <span className="text-[10px] sm:text-xs tracking-tight truncate max-w-full">
                  Pelayanan
                </span>
              </button>

              {/* 3. Pengaduan (Berwarna Hijau) */}
              <button
                type="button"
                onClick={() => handleSelectNav('warga', 'pengaduan')}
                className={`group flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 py-1.5 sm:py-2 px-1.5 sm:px-3.5 rounded-xl border transition-all cursor-pointer shadow-xs ${
                  isPengaduanActive
                    ? 'bg-[#146329] border-[#0f4d1f] text-white font-extrabold ring-2 ring-emerald-500/30'
                    : 'bg-[#1C8237] hover:bg-[#146329] border-[#15692b] text-white font-extrabold'
                }`}
              >
                <Megaphone className="w-4 h-4 sm:w-4 sm:h-4 transition-transform group-hover:scale-105 shrink-0 text-white" />
                <span className="text-[10px] sm:text-xs tracking-tight truncate max-w-full text-white">
                  Pengaduan
                </span>
              </button>

              {/* 4. Peta Digital */}
              <button
                type="button"
                onClick={() => handleSelectNav('peta')}
                className={`group flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 py-1.5 sm:py-2 px-1 sm:px-3 rounded-xl border transition-all cursor-pointer ${
                  isPetaActive
                    ? 'bg-cyan-50 border-cyan-200/80 text-[#00838F] font-extrabold shadow-2xs'
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/70 font-semibold'
                }`}
              >
                <MapPin
                  className={`w-4 h-4 sm:w-4 sm:h-4 transition-transform group-hover:scale-105 shrink-0 ${
                    isPetaActive ? 'text-[#00838F]' : 'text-slate-500 group-hover:text-slate-800'
                  }`}
                />
                <span className="text-[10px] sm:text-xs tracking-tight truncate max-w-full">
                  <span className="sm:hidden">Peta</span>
                  <span className="hidden sm:inline">Peta Digital</span>
                </span>
              </button>

              {/* 5. Menu Lainnya */}
              <button
                type="button"
                onClick={() => setMoreMenuOpen((prev) => !prev)}
                className={`group flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 py-1.5 sm:py-2 px-1 sm:px-3 rounded-xl border transition-all cursor-pointer ${
                  moreMenuOpen || isSecondaryActive
                    ? 'bg-[#0D3868] border-[#0D3868] text-white font-extrabold shadow-xs'
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/70 font-semibold'
                }`}
              >
                <Grid
                  className={`w-4 h-4 sm:w-4 sm:h-4 transition-transform group-hover:scale-105 shrink-0 ${
                    moreMenuOpen || isSecondaryActive
                      ? 'text-white'
                      : 'text-slate-500 group-hover:text-slate-800'
                  }`}
                />
                <span className="text-[10px] sm:text-xs tracking-tight truncate max-w-full">
                  <span className="sm:hidden">Lainnya</span>
                  <span className="hidden sm:inline">Menu Lainnya</span>
                </span>
              </button>
            </div>
          </nav>
        </div>
      )}
    </>
  );
};
