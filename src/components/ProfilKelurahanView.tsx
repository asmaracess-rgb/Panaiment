import React from 'react';
import {
  ArrowLeft,
  Building2,
  MapPin,
  Phone,
  Mail,
  Clock,
  UserCheck,
  Target,
  Compass,
} from 'lucide-react';
import { KelurahanProfile, WasteBankUnit, AppView } from '../types';
import { EmblemKotaMakassar, EmblemKelurahanPanaikang } from './Emblems';

interface ProfilKelurahanViewProps {
  profile: KelurahanProfile;
  wasteUnits: WasteBankUnit[];
  onNavigate: (view: AppView) => void;
}

export const ProfilKelurahanView: React.FC<ProfilKelurahanViewProps> = ({
  profile,
  wasteUnits,
  onNavigate,
}) => {
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
            Profil Resmi Kelurahan Panaikang
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Data Pimpinan Lurah, Alamat & Layanan Kantor Kelurahan, Visi & Misi, serta Struktur
            Kewilayahan Kecamatan Panakkukang, Kota Makassar.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start">
          <button
            type="button"
            onClick={() => onNavigate('peta')}
            className="px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-800 transition-colors cursor-pointer whitespace-nowrap"
          >
            Peta Wilayah Kelurahan
          </button>
          <button
            type="button"
            onClick={() => onNavigate('warga')}
            className="px-4 py-2 rounded-xl bg-[#0D3868] hover:bg-[#072647] text-white text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
          >
            Layanan Warga
          </button>
        </div>
      </div>

      {/* PUBLIC DISPLAY CONTENT */}
      <div className="mt-8 space-y-8">
        {/* Top Section: Institutional Identity + Data Lurah + Alamat Kantor */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Card (7 cols): Data Lurah & Struktur Pimpinan Kelurahan */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
                <div className="flex items-center gap-4">
                  <EmblemKotaMakassar className="w-16 h-20 shrink-0" />
                  <div className="h-14 w-[2px] bg-slate-200" />
                  <EmblemKelurahanPanaikang className="w-16 h-20 shrink-0" />
                  <div>
                    <div className="text-xs font-semibold text-emerald-700">
                      PEMERINTAH KOTA MAKASSAR
                    </div>
                    <h2 className="text-lg sm:text-xl font-extrabold text-[#0D3868]">
                      Kelurahan Panaikang
                    </h2>
                    <div className="text-xs text-slate-500">{profile.subDistrict}</div>
                  </div>
                </div>
              </div>

              {/* Data Pejabat Lurah */}
              <div className="mt-6">
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0277BD]">
                  <UserCheck className="w-4 h-4" />
                  <span>DATA PIMPINAN LURAH PANAIKANG</span>
                </div>

                <div className="mt-3 p-5 rounded-xl bg-slate-50 border border-slate-200/90">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="text-lg sm:text-xl font-extrabold text-slate-900">
                        {profile.lurahName}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-600">
                        <span>Lurah Panaikang</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono-num">NIP. {profile.lurahNip}</span>
                        <span aria-hidden="true">·</span>
                        <span>{profile.lurahRank}</span>
                      </div>
                    </div>
                    <div className="text-xs font-mono-num font-semibold text-emerald-800">
                      Masa Tugas: {profile.lurahPeriod}
                    </div>
                  </div>

                  <p className="mt-4 pt-3 border-t border-slate-200/80 text-xs sm:text-sm italic text-slate-700 leading-relaxed">
                    "{profile.lurahMessage}"
                  </p>
                </div>
              </div>

              {/* Perangkat Struktural Kelurahan */}
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs">
                <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                  <div className="text-slate-500">Sekretaris Lurah</div>
                  <div className="font-bold text-slate-900 mt-1">{profile.sekretarisName}</div>
                </div>
                <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                  <div className="text-slate-500">Kasi Kebersihan & Lingkungan</div>
                  <div className="font-bold text-slate-900 mt-1">{profile.kasiKebersihanName}</div>
                </div>
                <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                  <div className="text-slate-500">Kasi Pemerintahan & Trantib</div>
                  <div className="font-bold text-slate-900 mt-1">
                    {profile.kasiPemerintahanName}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Card (5 cols): Alamat Kantor Kelurahan & Wilayah Geografis */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 flex flex-col justify-between space-y-6">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1C8237]">
                <Building2 className="w-4 h-4" />
                <span>ALAMAT & KONTAK KANTOR KELURAHAN</span>
              </div>

              <h3 className="mt-2 text-base sm:text-lg font-bold text-[#0D3868]">
                Kantor Lurah Panaikang
              </h3>

              <div className="mt-4 space-y-3.5 text-xs sm:text-sm text-slate-700">
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-[#0277BD] shrink-0 mt-1" />
                  <div>
                    <div className="font-semibold text-slate-900">Alamat Kantor Pelayanan:</div>
                    <div className="text-slate-600 leading-relaxed">
                      {profile.officeAddress}, {profile.city} ({profile.postalCode})
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="w-4 h-4 text-emerald-700 shrink-0 mt-1" />
                  <div>
                    <div className="font-semibold text-slate-900">Jam Pelayanan Warga:</div>
                    <div className="text-slate-600 font-mono-num">{profile.serviceHours}</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="w-4 h-4 text-amber-600 shrink-0 mt-1" />
                  <div>
                    <div className="font-semibold text-slate-900">
                      Telepon & Hotline Posko Smart Environment:
                    </div>
                    <div className="text-slate-600 font-mono-num">{profile.phoneContact}</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail className="w-4 h-4 text-purple-700 shrink-0 mt-1" />
                  <div>
                    <div className="font-semibold text-slate-900">Surat Elektronik Resmi:</div>
                    <div className="text-slate-600 font-mono-num">{profile.emailContact}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Demografi & Batas Wilayah */}
            <div className="pt-5 border-t border-slate-200">
              <div className="grid grid-cols-3 gap-2 text-center mb-4">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[11px] text-slate-500">Luas Wilayah</div>
                  <div className="text-sm font-extrabold text-[#0D3868] font-mono-num mt-0.5">
                    {profile.areaKm2}
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[11px] text-slate-500">Cakupan RT/RW</div>
                  <div className="text-sm font-extrabold text-[#0D3868] font-mono-num mt-0.5">
                    {profile.totalRw} RW · {profile.totalRt} RT
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[11px] text-slate-500">Penduduk</div>
                  <div className="text-xs font-extrabold text-[#0D3868] font-mono-num mt-0.5">
                    {profile.totalPopulation.split(' ')[0]} Jiwa
                  </div>
                </div>
              </div>

              <div className="text-xs space-y-1 text-slate-600">
                <div className="font-semibold text-slate-900 flex items-center gap-1.5 mb-1.5">
                  <Compass className="w-3.5 h-3.5 text-[#0D3868]" />
                  <span>Batas Administratif Wilayah:</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-800">Utara:</span>{' '}
                  {profile.boundaries.utara}
                </div>
                <div>
                  <span className="font-semibold text-slate-800">Selatan:</span>{' '}
                  {profile.boundaries.selatan}
                </div>
                <div>
                  <span className="font-semibold text-slate-800">Timur:</span>{' '}
                  {profile.boundaries.timur}
                </div>
                <div>
                  <span className="font-semibold text-slate-800">Barat:</span>{' '}
                  {profile.boundaries.barat}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* VISI & MISI KELURAHAN PANAIKANG SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Visi Card (5 cols) */}
          <div className="lg:col-span-5 bg-gradient-to-b from-[#0D3868] to-[#072647] text-white rounded-2xl p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-bold text-emerald-300 tracking-wider">
                <Target className="w-4 h-4" />
                <span>VISI KELURAHAN PANAIKANG</span>
              </div>

              <blockquote className="mt-4 text-lg sm:text-xl font-extrabold leading-relaxed text-white text-balance">
                "{profile.visi}"
              </blockquote>
            </div>

            <div className="mt-6 pt-5 border-t border-white/15 text-xs text-sky-100 leading-relaxed">
              Selaras dengan program strategis Pemerintah Kota Makassar dalam mewujudkan tata
              kelola lingkungan kelurahan yang bersih, inklusif, dan berbasis data digital.
            </div>
          </div>

          {/* Misi List Card (7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 sm:p-8">
            <h2 className="text-lg font-extrabold text-[#0D3868]">
              Misi Pembangunan & Pengelolaan Lingkungan Kelurahan Panaikang
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Langkah strategis pelaksanaan program Panaikang Smart Environment
            </p>

            <div className="mt-5 divide-y divide-slate-100">
              {profile.misi.map((item, index) => (
                <div key={index} className="py-3.5 first:pt-0 last:pb-0 flex items-start gap-3.5">
                  <span className="font-mono-num text-sm font-extrabold text-[#1C8237] shrink-0 mt-0.5">
                    0{index + 1}.
                  </span>
                  <p className="text-sm text-slate-700 leading-relaxed">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Direktori Koordinator RW & Unit Bank Sampah Kelurahan Panaikang */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h2 className="text-base font-bold text-[#0D3868]">
                Direktori Wilayah RW 01 – RW 06 & Koordinator Lingkungan Kelurahan Panaikang
              </h2>
              <p className="text-xs text-slate-500">
                Jajaran pelaksana lapangan program kebersihan dan Bank Sampah Unit (BSU) tiap RW
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('peta')}
              className="text-xs font-semibold text-[#0277BD] hover:underline cursor-pointer self-start sm:self-auto"
            >
              Lihat Peta Wilayah RW →
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {wasteUnits.map((unit) => (
              <div
                key={unit.id}
                className="p-4 rounded-xl bg-slate-50/70 border border-slate-200 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-extrabold text-[#0D3868] text-sm">{unit.rw}</span>
                    <span className="font-mono-num text-slate-500">
                      {unit.activeHouseholds} KK Aktif
                    </span>
                  </div>
                  <div className="mt-1 text-sm font-bold text-slate-900">{unit.locationLabel}</div>
                  <div className="mt-1 text-xs text-slate-600">
                    Koordinator BSU: <span className="font-semibold">{unit.coordinator}</span>
                  </div>
                </div>
                <div className="mt-3 pt-2.5 border-t border-slate-200/80 text-[11px] font-mono-num text-emerald-800">
                  Unit: {unit.unitName}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
