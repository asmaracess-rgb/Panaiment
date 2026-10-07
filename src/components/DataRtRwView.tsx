import React, { useState } from 'react';
import {
  ArrowLeft,
  Users,
  MapPin,
  Phone,
  Search,
  Building2,
  Home,
  UserCheck,
} from 'lucide-react';
import { RwGroup, AppView } from '../types';

interface DataRtRwViewProps {
  rwGroups: RwGroup[];
  onNavigate: (view: AppView) => void;
}

export const DataRtRwView: React.FC<DataRtRwViewProps> = ({ rwGroups, onNavigate }) => {
  const [selectedRwCode, setSelectedRwCode] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const totalRwCount = rwGroups.length;
  const totalRtCount = rwGroups.reduce((acc, rw) => acc + (rw.rtList?.length || 0), 0);
  const totalHouseholds = rwGroups.reduce(
    (acc, rw) =>
      acc + (rw.rtList || []).reduce((sum, rt) => sum + (Number(rt.householdsCount) || 0), 0),
    0
  );

  const filteredRwGroups = rwGroups
    .filter((rw) => selectedRwCode === 'Semua' || rw.rwCode === selectedRwCode)
    .map((rw) => {
      if (!searchQuery.trim()) return rw;
      const q = searchQuery.toLowerCase();
      const rwMatches =
        rw.rwCode.toLowerCase().includes(q) ||
        rw.rwName.toLowerCase().includes(q) ||
        rw.ketuaRwName.toLowerCase().includes(q) ||
        rw.areaDescription.toLowerCase().includes(q);
      if (rwMatches) return rw;
      const matchingRts = (rw.rtList || []).filter(
        (rt) =>
          rt.rtCode.toLowerCase().includes(q) ||
          rt.rtName.toLowerCase().includes(q) ||
          rt.ketuaRtName.toLowerCase().includes(q) ||
          rt.areaDescription.toLowerCase().includes(q)
      );
      if (matchingRts.length > 0) {
        return { ...rw, rtList: matchingRts };
      }
      return null;
    })
    .filter((item): item is RwGroup => item !== null);

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <button
            type="button"
            onClick={() => onNavigate('beranda')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0D3868] hover:text-[#0277BD] mb-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Portal Utama</span>
          </button>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0D3868] tracking-tight">
            Data RT dan RW Kelurahan Panaikang
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Direktori resmi Nama RW dan RT se-Kelurahan Panaikang di mana setiap RT dikelompokkan
            berdasarkan wilayah RW masing-masing.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start">
          <button
            type="button"
            onClick={() => onNavigate('profil')}
            className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-800 transition-colors cursor-pointer whitespace-nowrap"
          >
            Profil Kelurahan
          </button>
          <button
            type="button"
            onClick={() => onNavigate('peta')}
            className="px-3.5 py-2 rounded-xl bg-[#0D3868] hover:bg-[#072647] text-white text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
          >
            Peta Wilayah RW
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500">Total Rukun Warga (RW)</div>
            <div className="mt-1 text-2xl sm:text-3xl font-extrabold text-[#0D3868] font-mono-num">
              {totalRwCount} Wilayah RW
            </div>
            <div className="mt-0.5 text-xs text-slate-500">Terdata aktif di Kelurahan Panaikang</div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-sky-50 border border-sky-200 flex items-center justify-center text-[#0277BD]">
            <Building2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500">Total Rukun Tetangga (RT)</div>
            <div className="mt-1 text-2xl sm:text-3xl font-extrabold text-[#1C8237] font-mono-num">
              {totalRtCount} Unit RT
            </div>
            <div className="mt-0.5 text-xs text-slate-500">
              Terbagi ke dalam masing-masing wilayah RW
            </div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[#1C8237]">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500">Total Kepala Keluarga (KK)</div>
            <div className="mt-1 text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono-num">
              {totalHouseholds.toLocaleString('id-ID')} KK
            </div>
            <div className="mt-0.5 text-xs text-slate-500">Cakupan warga seluruh RT & RW</div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
            <Home className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter RW & Search Bar */}
      <div className="mt-6 bg-white rounded-2xl border border-slate-200 p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setSelectedRwCode('Semua')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              selectedRwCode === 'Semua'
                ? 'bg-[#0D3868] text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Semua RW ({rwGroups.length})
          </button>
          {rwGroups.map((rw) => (
            <button
              key={rw.id}
              type="button"
              onClick={() => setSelectedRwCode(rw.rwCode)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                selectedRwCode === rw.rwCode
                  ? 'bg-[#1C8237] text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {rw.rwCode} ({rw.rtList?.length || 0} RT)
            </button>
          ))}
        </div>

        <div className="relative w-full lg:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari Nama RW, Nama RT, Ketua, atau jalan..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:border-[#0D3868] focus:outline-none"
          />
        </div>
      </div>

      {/* Grouped RW & RT Cards */}
      <div className="mt-6 space-y-6">
        {filteredRwGroups.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-sm text-slate-500">
            Data RW atau RT yang dicari tidak ditemukan.
          </div>
        ) : (
          filteredRwGroups.map((rw) => {
            const rwHouseholds = (rw.rtList || []).reduce(
              (sum, rt) => sum + (Number(rt.householdsCount) || 0),
              0
            );
            return (
              <section
                key={rw.id}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs"
              >
                {/* RW Header Banner */}
                <div className="bg-gradient-to-r from-[#0D3868] to-[#0277BD] px-5 sm:px-6 py-4 text-white flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-extrabold tracking-wider uppercase text-emerald-300 font-mono-num">
                        {rw.rwCode}
                      </span>
                      <span aria-hidden="true" className="text-white/50">
                        ·
                      </span>
                      <span className="text-xs font-semibold text-sky-100">
                        Membawahi {rw.rtList?.length || 0} Rukun Tetangga (RT) ·{' '}
                        <span className="font-mono-num">{rwHouseholds} KK</span>
                      </span>
                    </div>
                    <h2 className="mt-0.5 text-lg sm:text-xl font-extrabold text-white">
                      {rw.rwName}
                    </h2>
                    <p className="mt-0.5 text-xs text-sky-100 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 shrink-0 text-emerald-300" />
                      <span>{rw.areaDescription}</span>
                    </p>
                  </div>

                  <div className="bg-white/10 backdrop-blur-xs rounded-xl px-4 py-2.5 border border-white/20 shrink-0">
                    <div className="text-[11px] text-sky-100 flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-emerald-300" />
                      <span>Ketua {rw.rwCode}:</span>
                    </div>
                    <div className="text-sm font-extrabold text-white mt-0.5">
                      {rw.ketuaRwName}
                    </div>
                    {rw.phone && (
                      <div className="text-[11px] font-mono-num text-sky-100 flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3" />
                        <span>{rw.phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* RT Division List under this RW */}
                <div className="p-5 sm:p-6">
                  <div className="flex items-center justify-between mb-3.5">
                    <h3 className="text-xs sm:text-sm font-extrabold text-slate-800 uppercase tracking-wide">
                      Daftar Rukun Tetangga (RT) di Wilayah {rw.rwCode} ({rw.rtList?.length || 0}{' '}
                      RT)
                    </h3>
                  </div>

                  {!rw.rtList || rw.rtList.length === 0 ? (
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500">
                      Belum ada data RT pada {rw.rwCode}. Tambahkan melalui halaman Administrator.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                      {rw.rtList.map((rt) => (
                        <div
                          key={rt.id}
                          className="rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-white hover:border-slate-300 transition-colors p-4 flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-200/80">
                              <span className="text-xs font-extrabold text-[#1C8237] font-mono-num">
                                {rt.rtCode} · {rw.rwCode}
                              </span>
                              <span className="text-xs font-semibold text-slate-600 font-mono-num">
                                {rt.householdsCount} KK
                              </span>
                            </div>

                            <h4 className="mt-2.5 text-sm font-bold text-[#0D3868]">
                              {rt.rtName}
                            </h4>

                            <div className="mt-2 space-y-1 text-xs text-slate-600">
                              <div className="flex items-start gap-1.5">
                                <UserCheck className="w-3.5 h-3.5 text-[#0277BD] shrink-0 mt-0.5" />
                                <span>
                                  Ketua RT:{' '}
                                  <strong className="text-slate-900">{rt.ketuaRtName}</strong>
                                </span>
                              </div>
                              <div className="flex items-start gap-1.5">
                                <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
                                <span>{rt.areaDescription}</span>
                              </div>
                              {rt.phone && (
                                <div className="flex items-center gap-1.5 font-mono-num text-slate-500">
                                  <Phone className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                  <span>{rt.phone}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            );
          })
        )}
      </div>
    </div>
  );
};
