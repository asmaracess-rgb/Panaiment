import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  X,
  Users,
  Printer,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ExternalLink,
  Maximize2,
  Smartphone,
  Tablet,
  Monitor,
  Move,
} from 'lucide-react';
import { RwGroup, KelurahanProfile } from '../types';
import { EmblemKotaMakassar, EmblemKelurahanPanaikang } from './Emblems';

interface BaganStrukturRtRwModalProps {
  isOpen: boolean;
  onClose: () => void;
  rwGroups: RwGroup[];
  profile?: KelurahanProfile;
  onNavigateToRtRw?: () => void;
}

const CHART_BASE_WIDTH = 1320;
const CHART_MIN_HEIGHT = 780;
const MIN_ZOOM = 0.22;
const MAX_ZOOM = 1.5;
const ZOOM_STEP = 0.1;

const formatThreeDigits = (raw: string | number | undefined, fallbackIndex: number): string => {
  const digits = String(raw || '').replace(/\D/g, '');
  const num = digits ? parseInt(digits, 10) : fallbackIndex;
  return String(num || fallbackIndex).padStart(3, '0');
};

export const BaganStrukturRtRwChart: React.FC<{
  rwGroups: RwGroup[];
  profile?: KelurahanProfile;
  className?: string;
}> = ({ rwGroups, profile, className = '' }) => {
  const sortedRwGroups = [...(Array.isArray(rwGroups) ? rwGroups : [])].sort((a, b) =>
    (a?.rwCode || '').localeCompare(b?.rwCode || '', undefined, { numeric: true })
  );

  const lurahName = (profile?.lurahName || '').trim() || '-';
  const ketuaLpmName = (profile?.ketuaLpmName || '').trim() || '-';

  return (
    <div
      className={`relative w-[1320px] min-h-[780px] bg-gradient-to-b from-[#EAF6FF] via-[#F7FCFF] to-[#E1F3FE] rounded-2xl border-2 border-[#0D47A1]/25 shadow-xl overflow-hidden select-none flex flex-col justify-between ${className}`}
    >
      {/* Top Corner Geometric Ribbons (Matching Reference Image 2) */}
      <div className="pointer-events-none absolute -top-14 -left-14 w-52 h-52 bg-gradient-to-br from-[#0277BD] via-[#29B6F6] to-transparent opacity-85 -rotate-45 transform" />
      <div className="pointer-events-none absolute -top-14 -right-14 w-52 h-52 bg-gradient-to-bl from-[#0277BD] via-[#29B6F6] to-transparent opacity-85 rotate-45 transform" />

      <div className="p-6 sm:p-8 flex-1 flex flex-col">
        {/* ================= HEADER SECTION ================= */}
        <div className="relative z-10 flex items-center justify-between px-6">
          {/* Left Emblem: Kota Makassar */}
          <div className="w-28 flex flex-col items-center shrink-0">
            <EmblemKotaMakassar className="w-24 h-28 drop-shadow-md" />
          </div>

          {/* Center Title Block */}
          <div className="flex-1 max-w-[760px] mx-auto flex flex-col items-center text-center">
            <div className="text-[28px] font-black text-[#083A7A] tracking-[0.06em] uppercase leading-none">
              STRUKTUR ORGANISASI
            </div>
            <div className="text-[54px] font-black text-[#083A7A] tracking-[0.04em] uppercase leading-none my-1 drop-shadow-xs">
              RT/RW
            </div>

            {/* Rounded Pill: KELURAHAN PANAIKANG */}
            <div className="mt-1 px-12 py-1.5 rounded-full bg-gradient-to-r from-[#083A7A] via-[#0D47A1] to-[#083A7A] border-2 border-[#29B6F6] shadow-md">
              <span className="text-[24px] font-black text-white tracking-[0.06em] uppercase leading-none">
                KELURAHAN PANAIKANG
              </span>
            </div>

            {/* Subtitle: KECAMATAN PANAKKUKANG KOTA MAKASSAR */}
            <div className="mt-1.5 text-[14px] font-extrabold text-[#083A7A] tracking-[0.12em] uppercase">
              {(profile?.subDistrict || 'KECAMATAN PANAKKUKANG').toUpperCase()} KOTA MAKASSAR
            </div>
          </div>

          {/* Right Emblem: Kelurahan Panaikang */}
          <div className="w-28 flex flex-col items-center shrink-0">
            <EmblemKelurahanPanaikang className="w-24 h-28 drop-shadow-md" />
          </div>
        </div>

        {/* ================= TOP LEADERSHIP: LURAH PANAIKANG & KETUA LPM ================= */}
        <div className="relative z-10 mt-5 flex flex-col items-center">
          <div className="relative flex items-center justify-center w-full">
            {/* Center Node: LURAH PANAIKANG */}
            <div className="relative z-10 w-[340px] rounded-xl border-[2.5px] border-[#083A7A] bg-white shadow-md overflow-hidden">
              <div className="bg-gradient-to-r from-[#083A7A] via-[#0D47A1] to-[#1565C0] text-white text-center py-1.5 px-4">
                <span className="text-[17px] font-black tracking-[0.06em] uppercase">
                  LURAH PANAIKANG
                </span>
              </div>
              <div className="px-4 py-2 text-center bg-gradient-to-b from-[#E6F4FE] to-white">
                <span className="text-[16px] font-black text-[#083A7A] uppercase tracking-tight">
                  {lurahName}
                </span>
              </div>
            </div>

            {/* Right Side Coordination Node: KETUA LPM (Connected Horizontally from Lurah) */}
            <div className="absolute left-[calc(50%+170px)] flex items-center">
              {/* Horizontal Connector Line */}
              <div className="w-16 h-[2.5px] bg-[#083A7A]" />
              {/* Connector Dot */}
              <div className="w-3 h-3 rounded-full bg-[#083A7A] -ml-1.5 z-20 ring-2 ring-white" />
              {/* KETUA LPM Box */}
              <div className="-ml-1.5 w-[240px] rounded-xl border-[2.5px] border-[#083A7A] bg-white shadow-md overflow-hidden">
                <div className="bg-gradient-to-r from-[#083A7A] via-[#0D47A1] to-[#1565C0] text-white text-center py-1 px-3">
                  <span className="text-[13px] font-black tracking-[0.06em] uppercase">
                    KETUA LPM
                  </span>
                </div>
                <div className="px-3 py-1.5 text-center bg-gradient-to-b from-[#E6F4FE] to-white">
                  <span className="text-[13.5px] font-black text-[#083A7A] uppercase tracking-tight">
                    {ketuaLpmName}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Vertical Stem from Lurah down to Horizontal RW Distribution Line */}
          <div className="w-[2.5px] h-5 bg-[#083A7A]" />
        </div>

        {/* ================= 7 RW COLUMNS & RT LISTS ================= */}
        <div className="relative z-10 flex-1 flex flex-col">
          {/* Horizontal Connector Line across RW Columns */}
          {sortedRwGroups.length > 1 && (
            <div
              className="mx-auto w-[calc(100%-175px)] h-[2.5px] bg-[#083A7A]"
            />
          )}

          {/* Grid of RW Columns */}
          <div
            className="grid gap-2.5 w-full"
            style={{
              gridTemplateColumns: `repeat(${Math.max(sortedRwGroups.length, 1)}, minmax(0, 1fr))`,
            }}
          >
            {sortedRwGroups.map((rw, rwIndex) => {
              const rwNum3 = formatThreeDigits(rw.rwCode, rwIndex + 1);
              const sortedRtList = [...(Array.isArray(rw.rtList) ? rw.rtList : [])].sort((a, b) =>
                (a?.rtCode || '').localeCompare(b?.rtCode || '', undefined, { numeric: true })
              );

              return (
                <div key={rw.id || rwIndex} className="flex flex-col items-center">
                  {/* Vertical Drop Stem from Horizontal Distribution Bar */}
                  <div className="w-[2.5px] h-4 bg-[#083A7A]" />

                  {/* RW Header Card */}
                  <div className="w-full rounded-xl border-2 border-[#083A7A] bg-white shadow-sm overflow-hidden">
                    <div className="bg-gradient-to-r from-[#083A7A] via-[#0D47A1] to-[#1565C0] text-white text-center py-1 px-2">
                      <span className="text-[15px] font-black tracking-[0.06em] uppercase">
                        RW {rwNum3}
                      </span>
                    </div>
                    <div className="px-2 py-2 text-center bg-gradient-to-b from-[#E1F3FE] to-[#F5FBFF] min-h-[48px] flex flex-col justify-center">
                      <div className="text-[10.5px] font-bold text-[#083A7A]">
                        Ketua RW
                      </div>
                      <div className="text-[11.5px] font-black text-[#083A7A] uppercase leading-tight mt-0.5 break-words">
                        {(rw.ketuaRwName || '').trim() || '-'}
                      </div>
                    </div>
                  </div>

                  {/* RT List Box directly under RW Card */}
                  <div className="mt-2 w-full flex-1 rounded-xl border-2 border-[#4FC3F7] bg-[#E8F6FF]/85 p-1.5 shadow-xs flex flex-col gap-1">
                    {sortedRtList.length > 0 ? (
                      sortedRtList.map((rt, rtIdx) => {
                        const rtNum3 = formatThreeDigits(rt.rtCode, rtIdx + 1);
                        return (
                          <div
                            key={rt.id || rtIdx}
                            className="flex items-center gap-1.5 py-0.5 px-1 rounded-md bg-white/60 border border-[#B3E5FC]/80"
                          >
                            <span className="px-1.5 py-0.5 rounded bg-[#B3E5FC] text-[#083A7A] font-extrabold text-[9.5px] font-mono-num shrink-0 tracking-tighter border border-[#81D4FA]">
                              RT {rtNum3}/{rwNum3}
                            </span>
                            <span className="text-[9.5px] font-bold text-[#0A2540] uppercase leading-tight truncate" title={rt.ketuaRtName || '-'}>
                              {(rt.ketuaRtName || '').trim() || '-'}
                            </span>
                          </div>
                        );
                      })
                    ) : (
                      <div className="py-6 text-center text-[10px] font-semibold text-slate-400">
                        Belum ada data RT
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ================= BOTTOM TAGLINE BAR ================= */}
      <div className="relative z-10 bg-gradient-to-r from-[#072A6C] via-[#083A7A] to-[#072A6C] text-white py-2.5 px-8 flex items-center justify-center gap-5 border-t-2 border-[#29B6F6]/50">
        <div className="h-[1.5px] w-24 bg-sky-200/70" />
        <span className="text-[18px] font-serif italic font-semibold tracking-wide text-sky-50">
          Bersama Warga, Membangun Panaikang yang Lebih Baik
        </span>
        <div className="h-[1.5px] w-24 bg-sky-200/70" />
      </div>
    </div>
  );
};

/**
 * Reusable Interactive Viewport for Bagan Struktur Organisasi RT/RW
 * Automatically calculates optimal fit scale for HP, Tablet, and PC,
 * and provides Perkecil (-), Perbesar (+), Slider, Pas Layar, and 100% controls.
 */
export const BaganStrukturRtRwInteractiveViewer: React.FC<{
  rwGroups: RwGroup[];
  profile?: KelurahanProfile;
  onExpandFullScreen?: () => void;
  maxViewportHeightClass?: string;
}> = ({ rwGroups, profile, onExpandFullScreen, maxViewportHeightClass = 'max-h-[75vh]' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartMeasureRef = useRef<HTMLDivElement>(null);

  const [zoom, setZoom] = useState<number>(0.68);
  const [fitScale, setFitScale] = useState<number>(0.68);
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
  }, [rwGroups, profile]);

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
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-[#146329] text-[11px] font-bold">
            {deviceCategory === 'HP' ? (
              <Smartphone className="w-3.5 h-3.5 text-[#1C8237]" />
            ) : deviceCategory === 'Tablet' ? (
              <Tablet className="w-3.5 h-3.5 text-[#1C8237]" />
            ) : (
              <Monitor className="w-3.5 h-3.5 text-[#1C8237]" />
            )}
            <span>Mode Layar {deviceCategory}</span>
          </span>
          <span className="hidden md:inline-flex items-center gap-1 text-[11px] text-slate-500 font-medium">
            <Move className="w-3 h-3" />
            <span>Geser untuk membaca daftar RT per RW</span>
          </span>
        </div>

        {/* Zoom Toolbar (Perkecil / Slider / Perbesar / Pas Layar / 100%) */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <div className="inline-flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200">
            <button
              type="button"
              onClick={handleZoomOut}
              disabled={zoom <= MIN_ZOOM}
              className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg bg-white hover:bg-emerald-50 disabled:opacity-40 text-slate-800 border border-slate-200/80 text-xs font-bold shadow-2xs transition cursor-pointer"
              title="Perkecil tampilan bagan RT/RW"
            >
              <ZoomOut className="w-3.5 h-3.5 text-[#1C8237]" />
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
                className="w-16 sm:w-24 accent-[#1C8237] cursor-pointer hidden xs:block"
                aria-label="Skala Zoom Bagan RT/RW"
              />
              <span className="min-w-[42px] text-center text-xs font-mono-num font-extrabold text-[#146329]">
                {Math.round(zoom * 100)}%
              </span>
            </div>

            <button
              type="button"
              onClick={handleZoomIn}
              disabled={zoom >= MAX_ZOOM}
              className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg bg-white hover:bg-emerald-50 disabled:opacity-40 text-slate-800 border border-slate-200/80 text-xs font-bold shadow-2xs transition cursor-pointer"
              title="Perbesar tampilan bagan RT/RW"
            >
              <ZoomIn className="w-3.5 h-3.5 text-[#1C8237]" />
              <span>Perbesar</span>
            </button>
          </div>

          <div className="inline-flex items-center gap-1">
            <button
              type="button"
              onClick={handleApplyFit}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                isAutoFit
                  ? 'bg-[#1C8237] text-white border-[#1C8237]'
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
                  ? 'bg-[#0D3868] text-white border-[#0D3868]'
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
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#0D3868] hover:bg-[#072647] text-white text-xs font-bold transition shadow-2xs cursor-pointer"
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
            <BaganStrukturRtRwChart rwGroups={rwGroups} profile={profile} />
          </div>
        </div>
      </div>
    </div>
  );
};

export const BaganStrukturRtRwModal: React.FC<BaganStrukturRtRwModalProps> = ({
  isOpen,
  onClose,
  rwGroups,
  profile,
  onNavigateToRtRw,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const chartInnerRef = useRef<HTMLDivElement>(null);

  const [zoom, setZoom] = useState<number>(0.85);
  const [fitScale, setFitScale] = useState<number>(0.85);
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
  }, [isOpen, rwGroups, profile]);

  if (!isOpen) return null;

  const totalRt = (rwGroups || []).reduce((acc, rw) => acc + (rw.rtList?.length || 0), 0);

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
        className="relative w-full max-w-7xl bg-slate-50 rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-2xl overflow-hidden my-auto max-h-[96vh] flex flex-col print:max-h-none print:shadow-none print:border-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Modal Header */}
        <div className="bg-gradient-to-r from-[#072647] via-[#0D3868] to-[#1C8237] text-white px-3.5 sm:px-6 py-3 sm:py-4 flex flex-col gap-2.5 shrink-0 print:hidden">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <div className="p-2 rounded-xl bg-white/10 border border-white/20 shrink-0">
                <Users className="w-5 h-5 text-emerald-300" />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm sm:text-lg font-extrabold tracking-tight text-white truncate">
                  Bagan Struktur Organisasi RT dan RW Kelurahan Panaikang
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {onNavigateToRtRw && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigateToRtRw();
                  }}
                  className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Direktori RT/RW</span>
                </button>
              )}

              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold border border-white/20 transition cursor-pointer"
                title="Cetak Bagan Struktur RT/RW"
              >
                <Printer className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Cetak Bagan</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 sm:p-2 rounded-xl bg-white/10 hover:bg-rose-500/80 text-white transition cursor-pointer"
                aria-label="Tutup bagan struktur RT/RW"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Dedicated Responsive Zoom Toolbar */}
          <div className="flex items-center justify-start pt-2 border-t border-white/15">
            {/* Perkecil / Slider / Perbesar Controls */}
            <div className="flex items-center gap-1.5 bg-slate-950/35 rounded-xl p-1 border border-white/15">
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={zoom <= MIN_ZOOM}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/25 disabled:opacity-40 text-white text-xs font-bold transition cursor-pointer"
                title="Perkecil ukuran bagan RT/RW"
              >
                <ZoomOut className="w-3.5 h-3.5 text-emerald-300" />
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
                  className="w-16 sm:w-28 accent-emerald-400 cursor-pointer"
                  aria-label="Pengatur ukuran bagan RT/RW"
                />
                <span className="min-w-[42px] text-center text-xs font-mono-num font-extrabold text-emerald-200">
                  {Math.round(zoom * 100)}%
                </span>
              </div>

              <button
                type="button"
                onClick={handleZoomIn}
                disabled={zoom >= MAX_ZOOM}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/25 disabled:opacity-40 text-white text-xs font-bold transition cursor-pointer"
                title="Perbesar ukuran bagan RT/RW"
              >
                <ZoomIn className="w-3.5 h-3.5 text-emerald-300" />
                <span>Perbesar</span>
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable Canvas with True Scaled Footprint */}
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
              <BaganStrukturRtRwChart rwGroups={rwGroups} profile={profile} />
            </div>
          </div>

          {/* Unscaled 100% Print Version */}
          <div className="hidden print:block print:w-full">
            <BaganStrukturRtRwChart rwGroups={rwGroups} profile={profile} />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-white border-t border-slate-200 px-4 sm:px-6 py-2.5 flex items-center justify-end shrink-0 print:hidden">
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
  );
};
