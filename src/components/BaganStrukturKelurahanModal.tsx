import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  X,
  Building2,
  Printer,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Settings,
  User,
  Maximize2,
  Smartphone,
  Tablet,
  Monitor,
  Move,
} from 'lucide-react';
import { KelurahanProfile, StructuralOfficial } from '../types';
import { EmblemKotaMakassar, EmblemKelurahanPanaikang } from './Emblems';

interface BaganStrukturKelurahanModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: KelurahanProfile;
  onOpenAdminManage?: () => void;
}

export interface ResolvedKelurahanStructure {
  lurah: { name: string; nip: string };
  sekretaris: { name: string; nip: string };
  kasiPemerintahan: { name: string; nip: string; staff: string[] };
  kasiPemberdayaan: { name: string; nip: string; staff: string[] };
  kasiKebersihan: { name: string; nip: string; staff: string[] };
  perwaliReference: string;
}

const CHART_BASE_WIDTH = 1080;
const CHART_MIN_HEIGHT = 675;
const MIN_ZOOM = 0.25;
const MAX_ZOOM = 1.6;
const ZOOM_STEP = 0.1;

export const resolveKelurahanStructure = (
  profile: KelurahanProfile
): ResolvedKelurahanStructure => {
  const officials: StructuralOfficial[] = Array.isArray(profile?.officials)
    ? profile.officials
    : [];

  const isStaffTitle = (title: string) => {
    const t = title.toLowerCase().trim();
    return t.startsWith('staf') || t.startsWith('staff') || t.includes('staf seksi');
  };

  const findKasiOrSek = (keywords: string[]): StructuralOfficial | undefined => {
    return officials.find((o) => {
      if (!o || !o.positionTitle) return false;
      const title = o.positionTitle.toLowerCase();
      if (isStaffTitle(title)) return false;
      return keywords.some((kw) => title.includes(kw));
    });
  };

  const collectStaffForSection = (
    explicitList: string[] | undefined,
    officialObj: StructuralOfficial | undefined,
    sectionKeywords: string[]
  ): string[] => {
    const combined: string[] = [];
    const addUnique = (name?: string) => {
      const clean = (name || '').trim();
      if (
        clean &&
        !combined.some((existing) => existing.toLowerCase() === clean.toLowerCase())
      ) {
        combined.push(clean);
      }
    };

    if (Array.isArray(explicitList)) {
      explicitList.forEach(addUnique);
    }
    if (officialObj && Array.isArray(officialObj.staffNames)) {
      officialObj.staffNames.forEach(addUnique);
    }
    officials.forEach((o) => {
      if (!o) return;
      const title = (o.positionTitle || '').toLowerCase();
      const dept = (o.department || '').toLowerCase();
      if (isStaffTitle(title)) {
        const matchesSection = sectionKeywords.some(
          (kw) => title.includes(kw) || dept.includes(kw)
        );
        if (matchesSection) {
          addUnique(o.officialName);
        }
      }
    });

    return combined;
  };

  const sekOfficial = findKasiOrSek(['sekretaris']);
  const pemOfficial = findKasiOrSek(['pemerintahan', 'ketentraman', 'ketertiban', 'trantib']);
  const pembOfficial = findKasiOrSek(['pemberdayaan', 'pembangunan', 'sosial', 'kesejahteraan']);
  const kebOfficial = findKasiOrSek(['kebersihan', 'pertamanan', 'lingkungan']);

  return {
    lurah: {
      name: (profile?.lurahName || '').trim() || '-',
      nip: (profile?.lurahNip || '').trim(),
    },
    sekretaris: {
      name:
        (profile?.sekretarisName || '').trim() ||
        (sekOfficial?.officialName || '').trim() ||
        '-',
      nip:
        (profile?.sekretarisNip || '').trim() ||
        (sekOfficial?.nip || '').trim(),
    },
    kasiPemerintahan: {
      name:
        (profile?.kasiPemerintahanName || '').trim() ||
        (pemOfficial?.officialName || '').trim() ||
        '-',
      nip:
        (profile?.kasiPemerintahanNip || '').trim() ||
        (pemOfficial?.nip || '').trim(),
      staff: collectStaffForSection(profile?.stafPemerintahan, pemOfficial, [
        'pemerintahan',
        'ketentraman',
        'ketertiban',
        'trantib',
      ]),
    },
    kasiPemberdayaan: {
      name:
        (profile?.kasiPemberdayaanName || '').trim() ||
        (pembOfficial?.officialName || '').trim() ||
        '-',
      nip:
        (profile?.kasiPemberdayaanNip || '').trim() ||
        (pembOfficial?.nip || '').trim(),
      staff: collectStaffForSection(profile?.stafPemberdayaan, pembOfficial, [
        'pemberdayaan',
        'pembangunan',
        'sosial',
        'kesejahteraan',
      ]),
    },
    kasiKebersihan: {
      name:
        (profile?.kasiKebersihanName || '').trim() ||
        (kebOfficial?.officialName || '').trim() ||
        '-',
      nip:
        (profile?.kasiKebersihanNip || '').trim() ||
        (kebOfficial?.nip || '').trim(),
      staff: collectStaffForSection(profile?.stafKebersihan, kebOfficial, [
        'kebersihan',
        'pertamanan',
        'lingkungan',
      ]),
    },
    perwaliReference:
      (profile?.perwaliReference || '').trim() ||
      'PERWALI KOTA MAKASSAR NOMOR 65 TAHUN 2023',
  };
};

export const BaganStrukturKelurahanChart: React.FC<{
  profile: KelurahanProfile;
  className?: string;
}> = ({ profile, className = '' }) => {
  const data = resolveKelurahanStructure(profile);

  return (
    <div
      className={`relative w-[1080px] min-h-[675px] bg-gradient-to-b from-[#EBF5FF] via-[#F7FBFF] to-[#E1F1FF] rounded-2xl border-2 border-[#0D47A1]/25 shadow-xl overflow-hidden select-none p-7 flex flex-col justify-between ${className}`}
    >
      {/* Decorative Geometric Corner Accents (Matching Reference Image 1) */}
      <div className="pointer-events-none absolute -top-12 -left-12 w-48 h-48 bg-gradient-to-br from-[#0D47A1] via-[#1976D2] to-transparent opacity-90 -rotate-45 transform" />
      <div className="pointer-events-none absolute top-0 left-0 w-28 h-28 border-b-4 border-r-4 border-[#29B6F6]/40 -rotate-45 -translate-x-10 -translate-y-10" />
      <div className="pointer-events-none absolute -top-12 -right-12 w-48 h-48 bg-gradient-to-bl from-[#0D47A1] via-[#1976D2] to-transparent opacity-90 rotate-45 transform" />
      <div className="pointer-events-none absolute -bottom-16 -left-16 w-52 h-52 bg-gradient-to-tr from-[#0D47A1] via-[#1976D2] to-transparent opacity-85 rotate-45 transform" />
      <div className="pointer-events-none absolute -bottom-16 -right-16 w-52 h-52 bg-gradient-to-tl from-[#0D47A1] via-[#1976D2] to-transparent opacity-85 -rotate-45 transform" />

      {/* Subtle Watermark Pattern in Center */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.045]">
        <EmblemKotaMakassar className="w-[420px] h-[480px]" />
      </div>

      {/* ================= TOP HEADER BANNER ================= */}
      <div className="relative z-10 flex items-center justify-between px-4 pt-1">
        {/* Left Logo: Kota Makassar */}
        <div className="w-28 flex flex-col items-center shrink-0">
          <EmblemKotaMakassar className="w-24 h-28 drop-shadow-md" />
        </div>

        {/* Center Banner Title */}
        <div className="flex-1 max-w-[680px] mx-auto flex flex-col items-center">
          {/* Top Bar: STRUKTUR ORGANISASI */}
          <div
            className="w-[88%] bg-gradient-to-r from-[#0A3D91] via-[#0D47A1] to-[#0A3D91] text-white text-center py-1.5 px-6 shadow-md border-t border-white/30"
            style={{
              clipPath: 'polygon(3% 0%, 97% 0%, 100% 100%, 0% 100%)',
            }}
          >
            <div className="text-[24px] font-black tracking-[0.08em] uppercase leading-tight drop-shadow-xs">
              STRUKTUR ORGANISASI
            </div>
          </div>

          {/* Main Bar: KELURAHAN PANAIKANG */}
          <div
            className="w-full -mt-0.5 bg-gradient-to-r from-[#0D47A1] via-[#1565C0] to-[#0D47A1] text-white text-center py-2 px-8 shadow-lg border-y border-sky-300/40"
            style={{
              clipPath: 'polygon(2% 0%, 98% 0%, 96% 100%, 4% 100%)',
            }}
          >
            <div className="text-[31px] font-black tracking-[0.05em] uppercase leading-none drop-shadow-sm">
              KELURAHAN PANAIKANG
            </div>
          </div>

          {/* Subtitle Pill: KEC. PANAKKUKANG KOTA MAKASSAR */}
          <div className="mt-1.5 flex items-center gap-3 w-full justify-center">
            <div className="h-[3px] w-14 bg-[#0D47A1] rounded-full" />
            <div className="px-6 py-1 rounded-full bg-[#B3E5FC] border border-[#4FC3F7] shadow-xs">
              <span className="text-[14px] font-extrabold text-[#0A2E5C] tracking-[0.08em] uppercase">
                {(profile?.subDistrict || 'KEC. PANAKKUKANG').toUpperCase()} KOTA MAKASSAR
              </span>
            </div>
            <div className="h-[3px] w-14 bg-[#0D47A1] rounded-full" />
          </div>
        </div>

        {/* Right Logo: Kelurahan Panaikang */}
        <div className="w-28 flex flex-col items-center shrink-0">
          <EmblemKelurahanPanaikang className="w-24 h-28 drop-shadow-md" />
        </div>
      </div>

      {/* ================= HIERARCHY CHART BODY ================= */}
      <div className="relative z-10 flex flex-col items-center mt-3 mb-2">
        {/* LEVEL 1: LURAH */}
        <div className="w-[330px] rounded-xl border-[2.5px] border-[#0A3D91] bg-white shadow-md overflow-hidden">
          <div className="bg-gradient-to-r from-[#0A3D91] via-[#1565C0] to-[#0288D1] text-white text-center py-1 px-3 border-b border-[#0A3D91]">
            <span className="text-[16px] font-black tracking-[0.08em] uppercase">
              LURAH
            </span>
          </div>
          <div className="px-3 py-1.5 text-center bg-gradient-to-b from-white to-[#F0F7FF]">
            <div className="text-[14px] font-black text-[#0A2540] uppercase tracking-tight leading-snug">
              {data.lurah.name}
            </div>
            <div className="mt-0.5 mx-auto w-[85%] border-t border-slate-300 pt-0.5 text-[11px] font-bold text-[#0A2540] font-mono-num">
              NIP. {data.lurah.nip || '-'}
            </div>
          </div>
        </div>

        {/* Vertical Connector from Lurah to Sekretaris */}
        <div className="w-[3px] h-4 bg-[#0A3D91]" />

        {/* LEVEL 2: SEKRETARIS LURAH */}
        <div className="relative flex flex-col items-center w-full">
          <div className="relative z-10 w-[310px] rounded-xl border-[2.5px] border-[#0A3D91] bg-white shadow-md overflow-hidden">
            <div className="bg-gradient-to-r from-[#0A3D91] via-[#1565C0] to-[#0288D1] text-white text-center py-1 px-3 border-b border-[#0A3D91]">
              <span className="text-[14px] font-black tracking-[0.06em] uppercase">
                SEKRETARIS LURAH
              </span>
            </div>
            <div className="px-3 py-1.5 text-center bg-gradient-to-b from-white to-[#F0F7FF]">
              <div className="text-[13.5px] font-black text-[#0A2540] uppercase tracking-tight leading-snug">
                {data.sekretaris.name}
              </div>
              <div className="mt-0.5 mx-auto w-[85%] border-t border-slate-300 pt-0.5 text-[11px] font-bold text-[#0A2540] font-mono-num">
                NIP. {data.sekretaris.nip || '-'}
              </div>
            </div>
          </div>

          {/* Horizontal Line from Sekretaris sides out to Left & Right Kasi, plus center vertical stem to Middle Kasi */}
          <div
            className="pointer-events-none absolute top-1/2 left-[16.666%] right-[16.666%] h-[46px] border-t-[3px] border-x-[3px] border-[#0A3D91] z-0"
          />
          {/* Vertical Stem from bottom of Sekretaris down to Center Kasi */}
          <div className="w-[3px] h-5 bg-[#0A3D91]" />
        </div>

        {/* LEVEL 3 & 4: THREE KASI COLUMNS + STAF BOXES BELOW EACH KASI */}
        <div className="grid grid-cols-3 gap-6 w-full px-2">
          {/* COLUMN 1: KASI PEMERINTAHAN, KETENTRAMAN DAN KETERTIBAN UMUM */}
          <div className="flex flex-col items-center">
            {/* Kasi Card */}
            <div className="w-full rounded-xl border-[2.5px] border-[#0A3D91] bg-white shadow-md overflow-hidden">
              <div className="bg-gradient-to-r from-[#0A3D91] via-[#1565C0] to-[#0288D1] text-white text-center py-1.5 px-2.5 border-b border-[#0A3D91] min-h-[42px] flex items-center justify-center">
                <span className="text-[11.5px] font-black tracking-wide uppercase leading-tight">
                  KASI PEMERINTAHAN,
                  <br />
                  KETENTRAMAN DAN KETERTIBAN UMUM
                </span>
              </div>
              <div className="px-3 py-2 text-center bg-gradient-to-b from-white to-[#F0F7FF] min-h-[54px] flex flex-col justify-center">
                <div className="text-[13.5px] font-black text-[#0A2540] uppercase tracking-tight leading-snug">
                  {data.kasiPemerintahan.name || '-'}
                </div>
                {data.kasiPemerintahan.nip ||
                (data.kasiPemerintahan.name && data.kasiPemerintahan.name !== '-') ? (
                  <div className="mt-1 mx-auto w-[85%] border-t border-slate-300 pt-0.5 text-[11px] font-bold text-[#0A2540] font-mono-num">
                    NIP. {data.kasiPemerintahan.nip || '-'}
                  </div>
                ) : (
                  <div className="mt-1 mx-auto w-[85%] border-t border-slate-300 pt-0.5 text-[11px] font-bold text-transparent select-none">
                    -
                  </div>
                )}
              </div>
            </div>

            {/* Vertical Connector to Staf */}
            <div className="w-[3px] h-5 bg-[#0A3D91]" />

            {/* Staf Card */}
            <div className="w-full rounded-xl border-[2.5px] border-[#0A3D91] bg-white shadow-md overflow-hidden">
              <div className="bg-gradient-to-r from-[#0A3D91] via-[#1565C0] to-[#0288D1] text-white text-center py-1 px-3 border-b border-[#0A3D91]">
                <span className="text-[12.5px] font-black tracking-[0.08em] uppercase">
                  STAF
                </span>
              </div>
              <div className="p-2.5 bg-gradient-to-b from-white to-[#F0F7FF] min-h-[96px] flex flex-col justify-center divide-y divide-slate-200">
                {data.kasiPemerintahan.staff.length > 0 ? (
                  data.kasiPemerintahan.staff.map((stafName, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3 py-1.5 first:pt-0.5 last:pb-0.5 px-2"
                    >
                      <div className="w-8 h-8 rounded-full bg-[#0A3D91] text-white flex items-center justify-center shrink-0 shadow-xs">
                        <User className="w-4 h-4" />
                      </div>
                      <div className="flex-1 text-center pr-2">
                        <span className="text-[13px] font-black text-[#0A2540] uppercase tracking-tight">
                          {stafName}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex items-center gap-3 py-2 px-2">
                    <div className="w-8 h-8 rounded-full bg-[#0A3D91]/80 text-white flex items-center justify-center shrink-0">
                      <User className="w-4 h-4" />
                    </div>
                    <div className="flex-1 text-center pr-2 text-xs font-bold text-slate-400">
                      -
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* COLUMN 2: KASI PEMBERDAYAAN MASYARAKAT, PEMBANGUNAN DAN SOSIAL */}
          <div className="flex flex-col items-center">
            {/* Kasi Card */}
            <div className="w-full rounded-xl border-[2.5px] border-[#0A3D91] bg-white shadow-md overflow-hidden">
              <div className="bg-gradient-to-r from-[#0A3D91] via-[#1565C0] to-[#0288D1] text-white text-center py-1.5 px-2.5 border-b border-[#0A3D91] min-h-[42px] flex items-center justify-center">
                <span className="text-[11.5px] font-black tracking-wide uppercase leading-tight">
                  KASI PEMBERDAYAAN MASYARAKAT,
                  <br />
                  PEMBANGUNAN DAN SOSIAL
                </span>
              </div>
              <div className="px-3 py-2 text-center bg-gradient-to-b from-white to-[#F0F7FF] min-h-[54px] flex flex-col justify-center">
                <div className="text-[13.5px] font-black text-[#0A2540] uppercase tracking-tight leading-snug">
                  {data.kasiPemberdayaan.name || '-'}
                </div>
                {data.kasiPemberdayaan.nip ||
                (data.kasiPemberdayaan.name && data.kasiPemberdayaan.name !== '-') ? (
                  <div className="mt-1 mx-auto w-[85%] border-t border-slate-300 pt-0.5 text-[11px] font-bold text-[#0A2540] font-mono-num">
                    NIP. {data.kasiPemberdayaan.nip || '-'}
                  </div>
                ) : (
                  <div className="mt-1 mx-auto w-[85%] border-t border-slate-300 pt-0.5 text-[11px] font-bold text-transparent select-none">
                    -
                  </div>
                )}
              </div>
            </div>

            {/* Vertical Connector to Staf */}
            <div className="w-[3px] h-5 bg-[#0A3D91]" />

            {/* Staf Card */}
            <div className="w-full rounded-xl border-[2.5px] border-[#0A3D91] bg-white shadow-md overflow-hidden">
              <div className="bg-gradient-to-r from-[#0A3D91] via-[#1565C0] to-[#0288D1] text-white text-center py-1 px-3 border-b border-[#0A3D91]">
                <span className="text-[12.5px] font-black tracking-[0.08em] uppercase">
                  STAF
                </span>
              </div>
              <div className="p-2.5 bg-gradient-to-b from-white to-[#F0F7FF] min-h-[96px] flex flex-col justify-center divide-y divide-slate-200">
                {data.kasiPemberdayaan.staff.length > 0 ? (
                  data.kasiPemberdayaan.staff.map((stafName, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3 py-1.5 first:pt-0.5 last:pb-0.5 px-2"
                    >
                      <div className="w-8 h-8 rounded-full bg-[#0A3D91] text-white flex items-center justify-center shrink-0 shadow-xs">
                        <User className="w-4 h-4" />
                      </div>
                      <div className="flex-1 text-center pr-2">
                        <span className="text-[13px] font-black text-[#0A2540] uppercase tracking-tight">
                          {stafName}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex items-center gap-3 py-2 px-2">
                    <div className="w-8 h-8 rounded-full bg-[#0A3D91]/80 text-white flex items-center justify-center shrink-0">
                      <User className="w-4 h-4" />
                    </div>
                    <div className="flex-1 text-center pr-2 text-xs font-bold text-slate-400">
                      -
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* COLUMN 3: KASI PENGELOLAAN KEBERSIHAN DAN PERTAMANAN */}
          <div className="flex flex-col items-center">
            {/* Kasi Card */}
            <div className="w-full rounded-xl border-[2.5px] border-[#0A3D91] bg-white shadow-md overflow-hidden">
              <div className="bg-gradient-to-r from-[#0A3D91] via-[#1565C0] to-[#0288D1] text-white text-center py-1.5 px-2.5 border-b border-[#0A3D91] min-h-[42px] flex items-center justify-center">
                <span className="text-[11.5px] font-black tracking-wide uppercase leading-tight">
                  KASI PENGELOLAAN KEBERSIHAN
                  <br />
                  DAN PERTAMANAN
                </span>
              </div>
              <div className="px-3 py-2 text-center bg-gradient-to-b from-white to-[#F0F7FF] min-h-[54px] flex flex-col justify-center">
                <div className="text-[13.5px] font-black text-[#0A2540] uppercase tracking-tight leading-snug">
                  {data.kasiKebersihan.name || '-'}
                </div>
                {data.kasiKebersihan.nip ||
                (data.kasiKebersihan.name && data.kasiKebersihan.name !== '-') ? (
                  <div className="mt-1 mx-auto w-[85%] border-t border-slate-300 pt-0.5 text-[11px] font-bold text-[#0A2540] font-mono-num">
                    NIP. {data.kasiKebersihan.nip || '-'}
                  </div>
                ) : (
                  <div className="mt-1 mx-auto w-[85%] border-t border-slate-300 pt-0.5 text-[11px] font-bold text-transparent select-none">
                    -
                  </div>
                )}
              </div>
            </div>

            {/* Vertical Connector to Staf */}
            <div className="w-[3px] h-5 bg-[#0A3D91]" />

            {/* Staf Card */}
            <div className="w-full rounded-xl border-[2.5px] border-[#0A3D91] bg-white shadow-md overflow-hidden">
              <div className="bg-gradient-to-r from-[#0A3D91] via-[#1565C0] to-[#0288D1] text-white text-center py-1 px-3 border-b border-[#0A3D91]">
                <span className="text-[12.5px] font-black tracking-[0.08em] uppercase">
                  STAF
                </span>
              </div>
              <div className="p-2.5 bg-gradient-to-b from-white to-[#F0F7FF] min-h-[96px] flex flex-col justify-center divide-y divide-slate-200">
                {data.kasiKebersihan.staff.length > 0 ? (
                  data.kasiKebersihan.staff.map((stafName, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3 py-1.5 first:pt-0.5 last:pb-0.5 px-2"
                    >
                      <div className="w-8 h-8 rounded-full bg-[#0A3D91] text-white flex items-center justify-center shrink-0 shadow-xs">
                        <User className="w-4 h-4" />
                      </div>
                      <div className="flex-1 text-center pr-2">
                        <span className="text-[13px] font-black text-[#0A2540] uppercase tracking-tight">
                          {stafName}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex items-center gap-3 py-2 px-2">
                    <div className="w-8 h-8 rounded-full bg-[#0A3D91]/80 text-white flex items-center justify-center shrink-0">
                      <User className="w-4 h-4" />
                    </div>
                    <div className="flex-1 text-center pr-2 text-xs font-bold text-slate-400">
                      -
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ================= BOTTOM PERWALI BANNER ================= */}
      <div className="relative z-10 flex justify-center mt-2">
        <div
          className="px-12 py-1.5 bg-gradient-to-r from-[#072A6C] via-[#0D47A1] to-[#072A6C] text-white shadow-md"
          style={{
            clipPath: 'polygon(4% 0%, 96% 0%, 100% 50%, 96% 100%, 4% 100%, 0% 50%)',
          }}
        >
          <span className="text-[13px] font-extrabold tracking-[0.08em] uppercase">
            {data.perwaliReference}
          </span>
        </div>
      </div>
    </div>
  );
};

/**
 * Reusable Interactive Viewport for Bagan Struktur Kelurahan
 * Automatically calculates optimal fit scale for HP, Tablet, and PC,
 * and provides Perkecil (-), Perbesar (+), Slider, Pas Layar, and 100% controls.
 */
export const BaganStrukturKelurahanInteractiveViewer: React.FC<{
  profile: KelurahanProfile;
  onExpandFullScreen?: () => void;
  maxViewportHeightClass?: string;
}> = ({ profile, onExpandFullScreen, maxViewportHeightClass = 'max-h-[72vh]' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartMeasureRef = useRef<HTMLDivElement>(null);

  const [zoom, setZoom] = useState<number>(0.75);
  const [fitScale, setFitScale] = useState<number>(0.75);
  const [isAutoFit, setIsAutoFit] = useState<boolean>(true);
  const [naturalHeight, setNaturalHeight] = useState<number>(CHART_MIN_HEIGHT);
  const [deviceCategory, setDeviceCategory] = useState<'HP' | 'Tablet' | 'PC'>('PC');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number; scrollLeft: number; scrollTop: number }>({
    x: 0,
    y: 0,
    scrollLeft: 0,
    scrollTop: 0,
  });

  const computeFitScale = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const availableWidth = Math.max(240, el.clientWidth - 24);
    const calculated = Math.min(1, Math.max(MIN_ZOOM, +(availableWidth / CHART_BASE_WIDTH).toFixed(2)));
    setFitScale(calculated);

    const vw = window.innerWidth;
    if (vw < 640) {
      setDeviceCategory('HP');
    } else if (vw < 1024) {
      setDeviceCategory('Tablet');
    } else {
      setDeviceCategory('PC');
    }

    if (isAutoFit) {
      setZoom(calculated);
    }
  }, [isAutoFit]);

  useEffect(() => {
    computeFitScale();
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      computeFitScale();
    });
    ro.observe(el);
    window.addEventListener('resize', computeFitScale);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', computeFitScale);
    };
  }, [computeFitScale]);

  useEffect(() => {
    const chartEl = chartMeasureRef.current;
    if (!chartEl) return;
    const updateHeight = () => {
      if (chartEl.offsetHeight > 0) {
        setNaturalHeight(chartEl.offsetHeight);
      }
    };
    updateHeight();
    const ro = new ResizeObserver(updateHeight);
    ro.observe(chartEl);
    return () => ro.disconnect();
  }, [profile]);

  const handleZoomOut = () => {
    setIsAutoFit(false);
    setZoom((z) => Math.max(MIN_ZOOM, +(z - ZOOM_STEP).toFixed(2)));
  };

  const handleZoomIn = () => {
    setIsAutoFit(false);
    setZoom((z) => Math.min(MAX_ZOOM, +(z + ZOOM_STEP).toFixed(2)));
  };

  const handleApplyFit = () => {
    setIsAutoFit(true);
    setZoom(fitScale);
  };

  const handleReset100 = () => {
    setIsAutoFit(false);
    setZoom(1);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = containerRef.current;
    if (!el) return;
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      scrollLeft: el.scrollLeft,
      scrollTop: el.scrollTop,
    };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !containerRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    containerRef.current.scrollLeft = dragStartRef.current.scrollLeft - dx;
    containerRef.current.scrollTop = dragStartRef.current.scrollTop - dy;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const scaledWidth = Math.round(CHART_BASE_WIDTH * zoom);
  const scaledHeight = Math.round(naturalHeight * zoom);

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-slate-100/90 overflow-hidden shadow-inner">
      {/* Responsive Control Bar for HP, Tablet, PC */}
      <div className="bg-white border-b border-slate-200 px-3 sm:px-4 py-2.5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-50 border border-sky-200 text-[#0D3868] text-[11px] font-bold">
            {deviceCategory === 'HP' ? (
              <Smartphone className="w-3.5 h-3.5 text-[#0277BD]" />
            ) : deviceCategory === 'Tablet' ? (
              <Tablet className="w-3.5 h-3.5 text-[#0277BD]" />
            ) : (
              <Monitor className="w-3.5 h-3.5 text-[#0277BD]" />
            )}
            <span>Mode Layar {deviceCategory}</span>
          </span>
          <span className="hidden md:inline-flex items-center gap-1 text-[11px] text-slate-500 font-medium">
            <Move className="w-3 h-3" />
            <span>Geser untuk melihat detail saat diperbesar</span>
          </span>
        </div>

        {/* Zoom Toolbar (Perkecil / Slider / Perbesar / Pas Layar / 100%) */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <div className="inline-flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200">
            <button
              type="button"
              onClick={handleZoomOut}
              disabled={zoom <= MIN_ZOOM}
              className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg bg-white hover:bg-sky-50 disabled:opacity-40 text-slate-800 border border-slate-200/80 text-xs font-bold shadow-2xs transition cursor-pointer"
              title="Perkecil tampilan bagan"
            >
              <ZoomOut className="w-3.5 h-3.5 text-[#0D3868]" />
              <span>Perkecil</span>
            </button>

            <div className="flex items-center gap-1.5 px-2">
              <input
                type="range"
                min={Math.round(MIN_ZOOM * 100)}
                max={Math.round(MAX_ZOOM * 100)}
                step={5}
                value={Math.round(zoom * 100)}
                onChange={(e) => {
                  setIsAutoFit(false);
                  setZoom(Number(e.target.value) / 100);
                }}
                className="w-16 sm:w-24 accent-[#0D3868] cursor-pointer hidden xs:block"
                aria-label="Skala Zoom Bagan Kelurahan"
              />
              <span className="min-w-[42px] text-center text-xs font-mono-num font-extrabold text-[#0D3868]">
                {Math.round(zoom * 100)}%
              </span>
            </div>

            <button
              type="button"
              onClick={handleZoomIn}
              disabled={zoom >= MAX_ZOOM}
              className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg bg-white hover:bg-sky-50 disabled:opacity-40 text-slate-800 border border-slate-200/80 text-xs font-bold shadow-2xs transition cursor-pointer"
              title="Perbesar tampilan bagan"
            >
              <ZoomIn className="w-3.5 h-3.5 text-[#0D3868]" />
              <span>Perbesar</span>
            </button>
          </div>

          <div className="inline-flex items-center gap-1">
            <button
              type="button"
              onClick={handleApplyFit}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                isAutoFit
                  ? 'bg-[#0D3868] text-white border-[#0D3868]'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
              }`}
              title="Sesuaikan otomatis agar pas dengan layar perangkat (HP/Tablet/PC)"
            >
              Pas Layar
            </button>
            <button
              type="button"
              onClick={handleReset100}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                !isAutoFit && Math.round(zoom * 100) === 100
                  ? 'bg-[#0277BD] text-white border-[#0277BD]'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
              }`}
              title="Ukuran asli 100%"
            >
              100%
            </button>
            {onExpandFullScreen && (
              <button
                type="button"
                onClick={onExpandFullScreen}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-2xs cursor-pointer"
                title="Buka tampilan layar penuh & cetak"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Layar Penuh</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Scrollable & Pan-able Canvas Container */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className={`w-full overflow-auto p-3 sm:p-5 ${maxViewportHeightClass} ${
          isDragging ? 'cursor-grabbing' : zoom > fitScale ? 'cursor-grab' : 'cursor-default'
        }`}
      >
        <div
          style={{
            width: `${scaledWidth}px`,
            height: `${scaledHeight}px`,
          }}
          className="relative mx-auto transition-all duration-150"
        >
          <div
            ref={chartMeasureRef}
            style={{
              width: `${CHART_BASE_WIDTH}px`,
              transform: `scale(${zoom})`,
              transformOrigin: 'top left',
            }}
            className="transition-transform duration-150"
          >
            <BaganStrukturKelurahanChart profile={profile} />
          </div>
        </div>
      </div>
    </div>
  );
};

export const BaganStrukturKelurahanModal: React.FC<BaganStrukturKelurahanModalProps> = ({
  isOpen,
  onClose,
  profile,
  onOpenAdminManage,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const chartInnerRef = useRef<HTMLDivElement>(null);

  const [zoom, setZoom] = useState<number>(1);
  const [fitScale, setFitScale] = useState<number>(1);
  const [isAutoFit, setIsAutoFit] = useState<boolean>(true);
  const [naturalHeight, setNaturalHeight] = useState<number>(CHART_MIN_HEIGHT);
  const [deviceCategory, setDeviceCategory] = useState<'HP' | 'Tablet' | 'PC'>('PC');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number; scrollLeft: number; scrollTop: number }>({
    x: 0,
    y: 0,
    scrollLeft: 0,
    scrollTop: 0,
  });

  const updateResponsiveScale = useCallback(() => {
    const container = scrollContainerRef.current;
    const vw = typeof window !== 'undefined' ? window.innerWidth : 1280;

    if (vw < 640) {
      setDeviceCategory('HP');
    } else if (vw < 1024) {
      setDeviceCategory('Tablet');
    } else {
      setDeviceCategory('PC');
    }

    const availableWidth = container
      ? Math.max(260, container.clientWidth - (vw < 640 ? 16 : 40))
      : Math.max(260, vw - 32);

    const computedFit = Math.min(
      1,
      Math.max(MIN_ZOOM, +(availableWidth / CHART_BASE_WIDTH).toFixed(2))
    );
    setFitScale(computedFit);

    if (isAutoFit) {
      setZoom(computedFit);
    }
  }, [isAutoFit]);

  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(updateResponsiveScale, 20);
    const container = scrollContainerRef.current;
    let ro: ResizeObserver | null = null;
    if (container && typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => updateResponsiveScale());
      ro.observe(container);
    }
    window.addEventListener('resize', updateResponsiveScale);
    return () => {
      clearTimeout(timer);
      if (ro) ro.disconnect();
      window.removeEventListener('resize', updateResponsiveScale);
    };
  }, [isOpen, updateResponsiveScale]);

  useEffect(() => {
    if (!isOpen) return;
    const chartEl = chartInnerRef.current;
    if (!chartEl) return;
    const measure = () => {
      if (chartEl.offsetHeight > 0) {
        setNaturalHeight(chartEl.offsetHeight);
      }
    };
    measure();
    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(measure);
      ro.observe(chartEl);
    }
    return () => {
      if (ro) ro.disconnect();
    };
  }, [isOpen, profile]);

  if (!isOpen) return null;

  const handleZoomOut = () => {
    setIsAutoFit(false);
    setZoom((z) => Math.max(MIN_ZOOM, +(z - ZOOM_STEP).toFixed(2)));
  };

  const handleZoomIn = () => {
    setIsAutoFit(false);
    setZoom((z) => Math.min(MAX_ZOOM, +(z + ZOOM_STEP).toFixed(2)));
  };

  const handleApplyFit = () => {
    setIsAutoFit(true);
    setZoom(fitScale);
  };

  const handleReset100 = () => {
    setIsAutoFit(false);
    setZoom(1);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = scrollContainerRef.current;
    if (!el) return;
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      scrollLeft: el.scrollLeft,
      scrollTop: el.scrollTop,
    };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !scrollContainerRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    scrollContainerRef.current.scrollLeft = dragStartRef.current.scrollLeft - dx;
    scrollContainerRef.current.scrollTop = dragStartRef.current.scrollTop - dy;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const scaledWidth = Math.round(CHART_BASE_WIDTH * zoom);
  const scaledHeight = Math.round(naturalHeight * zoom);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-1.5 sm:p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto print:bg-white print:p-0"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-6xl bg-slate-50 rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-2xl overflow-hidden my-auto max-h-[96vh] flex flex-col print:max-h-none print:shadow-none print:border-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Modal Action Bar */}
        <div className="bg-gradient-to-r from-[#072647] via-[#0D3868] to-[#0277BD] text-white px-3.5 sm:px-6 py-3 sm:py-4 flex flex-col gap-2.5 shrink-0 print:hidden">
          <div className="flex items-start sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <div className="p-2 rounded-xl bg-white/10 border border-white/20 shrink-0">
                <Building2 className="w-5 h-5 text-sky-300" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-sky-400/20 text-sky-200 border border-sky-300/30">
                    Bagan SOTK Dinamis
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/15 text-white">
                    {deviceCategory === 'HP' ? (
                      <Smartphone className="w-3 h-3 text-sky-200" />
                    ) : deviceCategory === 'Tablet' ? (
                      <Tablet className="w-3 h-3 text-sky-200" />
                    ) : (
                      <Monitor className="w-3 h-3 text-sky-200" />
                    )}
                    <span>Tampilan {deviceCategory}</span>
                  </span>
                </div>
                <h2 className="text-sm sm:text-lg font-extrabold tracking-tight text-white mt-0.5 truncate">
                  Bagan Struktur Organisasi Pemerintah Kelurahan Panaikang
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {onOpenAdminManage && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenAdminManage();
                  }}
                  className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Kelola Jabatan & Staf</span>
                </button>
              )}

              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold border border-white/20 transition cursor-pointer"
                title="Cetak Bagan Struktur Kelurahan"
              >
                <Printer className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Cetak Bagan</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 sm:p-2 rounded-xl bg-white/10 hover:bg-rose-500/80 text-white transition cursor-pointer"
                aria-label="Tutup bagan struktur"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Dedicated Responsive Zoom & Fit Toolbar (Visible on HP, Tablet, and PC) */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/15">
            {/* Perkecil / Slider / Perbesar Controls */}
            <div className="flex items-center gap-1.5 bg-slate-950/35 rounded-xl p-1 border border-white/15">
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={zoom <= MIN_ZOOM}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/25 disabled:opacity-40 text-white text-xs font-bold transition cursor-pointer"
                title="Perkecil ukuran bagan"
              >
                <ZoomOut className="w-3.5 h-3.5 text-sky-300" />
                <span>Perkecil</span>
              </button>

              <div className="flex items-center gap-2 px-1.5 sm:px-2.5">
                <input
                  type="range"
                  min={Math.round(MIN_ZOOM * 100)}
                  max={Math.round(MAX_ZOOM * 100)}
                  step={5}
                  value={Math.round(zoom * 100)}
                  onChange={(e) => {
                    setIsAutoFit(false);
                    setZoom(Number(e.target.value) / 100);
                  }}
                  className="w-16 sm:w-28 accent-sky-400 cursor-pointer"
                  aria-label="Pengatur ukuran bagan"
                />
                <span className="min-w-[42px] text-center text-xs font-mono-num font-extrabold text-sky-200">
                  {Math.round(zoom * 100)}%
                </span>
              </div>

              <button
                type="button"
                onClick={handleZoomIn}
                disabled={zoom >= MAX_ZOOM}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/25 disabled:opacity-40 text-white text-xs font-bold transition cursor-pointer"
                title="Perbesar ukuran bagan"
              >
                <ZoomIn className="w-3.5 h-3.5 text-sky-300" />
                <span>Perbesar</span>
              </button>
            </div>

            {/* Quick Scale Presets for HP, Tablet, PC */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={handleApplyFit}
                className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  isAutoFit
                    ? 'bg-sky-400 text-slate-950 shadow-xs'
                    : 'bg-white/10 hover:bg-white/20 text-white border border-white/15'
                }`}
                title="Sesuaikan otomatis dengan lebar layar HP, Tablet, atau PC"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Pas Layar ({Math.round(fitScale * 100)}%)</span>
              </button>

              {[
                { label: '50%', val: 0.5 },
                { label: '75%', val: 0.75 },
                { label: '100%', val: 1 },
                { label: '125%', val: 1.25 },
              ].map((preset) => {
                const isActive = !isAutoFit && Math.abs(zoom - preset.val) < 0.03;
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      setIsAutoFit(false);
                      setZoom(preset.val);
                    }}
                    className={`px-2 py-1.5 rounded-lg text-xs font-mono-num font-bold transition cursor-pointer ${
                      isActive
                        ? 'bg-white text-[#0D3868] shadow-xs'
                        : 'bg-white/10 hover:bg-white/20 text-sky-100'
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Scrollable Content Canvas with True Scaled Footprint */}
        <div
          ref={scrollContainerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className={`relative flex-1 overflow-auto p-2 sm:p-6 bg-slate-200/80 print:p-0 print:bg-white print:overflow-visible ${
            isDragging ? 'cursor-grabbing' : zoom > fitScale ? 'cursor-grab' : 'cursor-default'
          }`}
        >
          {/* Screen Scaled Wrapper */}
          <div
            style={{
              width: `${scaledWidth}px`,
              height: `${scaledHeight}px`,
            }}
            className="relative mx-auto transition-all duration-150 print:hidden"
          >
            <div
              ref={chartInnerRef}
              style={{
                width: `${CHART_BASE_WIDTH}px`,
                transform: `scale(${zoom})`,
                transformOrigin: 'top left',
              }}
              className="transition-transform duration-150"
            >
              <BaganStrukturKelurahanChart profile={profile} />
            </div>
          </div>

          {/* Unscaled 100% Print Version */}
          <div className="hidden print:block print:w-full">
            <BaganStrukturKelurahanChart profile={profile} />
          </div>
        </div>

        {/* Floating Quick Zoom Bar for Mobile/Tablet Convenience + Footer Note */}
        <div className="bg-white border-t border-slate-200 px-4 sm:px-6 py-2.5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 shrink-0 print:hidden">
          <div className="text-center sm:text-left text-[11px] sm:text-xs">
            Gunakan tombol <strong className="text-slate-700">Perkecil (-)</strong> atau{' '}
            <strong className="text-slate-700">Perbesar (+)</strong> untuk menyesuaikan tampilan di HP, Tablet, atau PC.
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleApplyFit}
              className="px-3 py-1.5 rounded-lg border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs transition cursor-pointer"
            >
              Pas Layar
            </button>
            <button
              type="button"
              onClick={handleReset100}
              className="px-3 py-1.5 rounded-lg border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs transition cursor-pointer"
            >
              100%
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition cursor-pointer"
            >
              Tutup Pratinjau
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
