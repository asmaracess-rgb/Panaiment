/// <reference types="@types/google.maps" />
import React, { useState, useEffect, useMemo } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  InfoWindow,
  useMap,
} from '@vis.gl/react-google-maps';
import {
  ArrowLeft,
  MapPin,
  CheckCircle2,
  Clock,
  AlertCircle,
  Recycle,
  Calendar,
  Navigation,
  Building2,
  Layers,
  Compass,
  Check,
  ExternalLink,
  Shield,
  ShieldCheck,
  Users,
  ChevronRight,
  Phone,
  Mail,
  UserCheck,
  User,
} from 'lucide-react';
import {
  CitizenReport,
  ReportStatus,
  WasteBankUnit,
  CleanupEvent,
  AppView,
  KelurahanProfile,
  RwGroup,
} from '../types';

interface PetaDigitalViewProps {
  reports?: CitizenReport[];
  wasteUnits: WasteBankUnit[];
  cleanupEvents: CleanupEvent[];
  rwGroups?: RwGroup[];
  onUpdateReportStatus?: (
    id: string,
    newStatus: ReportStatus,
    assignedTeam: string,
    responseNote: string
  ) => void;
  onNavigate: (view: AppView) => void;
  profile?: KelurahanProfile;
}

type LayerType = 'semua' | 'bsu' | 'kerjabakti';

// Official Google Maps Link for Kelurahan Panaikang, Panakkukang, Kota Makassar
export const OFFICIAL_GOOGLE_MAPS_LINK = 'https://maps.app.goo.gl/k3F6BTUhgcErbeJv7?g_st=aw';

import {
  PANAIKANG_CENTER,
  PANAIKANG_DEFAULT_ZOOM,
  KANTOR_LURAH_COORDINATE,
  PANAIKANG_PERIMETER_POLYGON,
  RW_ZONES,
  BOUNDARY_POINTS,
  resolvePanaikangCoordinate,
} from '../data/panaikangSpatialBoundary';

// Coordinate resolution helper guaranteed to stay inside Kelurahan Panaikang polygon
function resolveCoordinate(
  coordinatesLabel?: string,
  mapX: number = 50,
  mapY: number = 50,
  rwHint?: string
): google.maps.LatLngLiteral {
  return resolvePanaikangCoordinate(coordinatesLabel, mapX, mapY, rwHint);
}

// Map Controller for initial fitBounds and smooth pan/zoom
function MapController({
  targetCenter,
  triggerKey,
  fitBoundsTrigger,
}: {
  targetCenter: google.maps.LatLngLiteral | null;
  triggerKey: number;
  fitBoundsTrigger: number;
}) {
  const map = useMap();

  // Fit map bounds to the exact official Kelurahan Panaikang polygon on mount & reset
  useEffect(() => {
    if (!map) return;
    try {
      const bounds = new google.maps.LatLngBounds();
      for (const pt of PANAIKANG_PERIMETER_POLYGON) {
        bounds.extend(pt);
      }
      map.fitBounds(bounds, 28);
    } catch {
      map.panTo(PANAIKANG_CENTER);
      map.setZoom(PANAIKANG_DEFAULT_ZOOM);
    }
  }, [map, fitBoundsTrigger]);

  useEffect(() => {
    if (map && targetCenter && triggerKey > 0) {
      map.panTo(targetCenter);
      map.setZoom(16);
    }
  }, [map, targetCenter, triggerKey]);

  return null;
}

// GoogleMapsPolygon helper
function GoogleMapsPolygon({
  paths,
  strokeColor,
  strokeOpacity = 0.8,
  strokeWeight = 2,
  fillColor,
  fillOpacity = 0.12,
}: {
  paths: google.maps.LatLngLiteral[];
  strokeColor: string;
  strokeOpacity?: number;
  strokeWeight?: number;
  fillColor: string;
  fillOpacity?: number;
}) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    const polygon = new google.maps.Polygon({
      paths,
      strokeColor,
      strokeOpacity,
      strokeWeight,
      fillColor,
      fillOpacity,
      map,
    });

    return () => {
      polygon.setMap(null);
    };
  }, [map, paths, strokeColor, strokeOpacity, strokeWeight, fillColor, fillOpacity]);

  return null;
}



export const PetaDigitalView: React.FC<PetaDigitalViewProps> = ({
  wasteUnits,
  cleanupEvents,
  rwGroups = [],
  onNavigate,
  profile,
}) => {
  const [activeLayer, setActiveLayer] = useState<LayerType>('semua');
  const [showRwBoundaries, setShowRwBoundaries] = useState<boolean>(true);
  const [showBoundaryMarkers, setShowBoundaryMarkers] = useState<boolean>(true);
  const [mapTypeId, setMapTypeId] = useState<'roadmap' | 'hybrid'>('roadmap');

  // Boundaries directly connected from Lurah/Admin input in Profil Kelurahan
  const batasUtara = profile?.boundaries?.utara?.trim() || '-';
  const batasTimur = profile?.boundaries?.timur?.trim() || '-';
  const batasSelatan = profile?.boundaries?.selatan?.trim() || '-';
  const batasBarat = profile?.boundaries?.barat?.trim() || '-';

  const formattedOfficeAddress = useMemo(() => {
    const addr = profile?.officeAddress?.trim();
    const city = profile?.city?.trim() || 'Kota Makassar, Provinsi Sulawesi Selatan';
    const postal = profile?.postalCode?.trim() || '90231';
    if (addr) {
      return `${addr}, ${city} (${postal})`;
    }
    return `- (${city} · ${postal})`;
  }, [profile]);

  const [selectedBoundaryDir, setSelectedBoundaryDir] = useState<
    'utara' | 'timur' | 'selatan' | 'barat' | null
  >(null);

  const [selectedItem, setSelectedItem] = useState<{
    type: 'bsu' | 'kerjabakti' | 'kantor' | 'batas';
    id: string;
  }>({
    type: 'kantor',
    id: 'kantor-lurah',
  });

  const [infoWindowTarget, setInfoWindowTarget] = useState<{
    type: 'bsu' | 'kerjabakti' | 'kantor' | 'batas';
    id: string;
    position: google.maps.LatLngLiteral;
    title: string;
    description: string;
    badge: string;
    badgeColor: string;
  } | null>(null);

  const [panTarget, setPanTarget] = useState<google.maps.LatLngLiteral | null>(null);
  const [panTrigger, setPanTrigger] = useState<number>(0);
  const [fitBoundsTrigger, setFitBoundsTrigger] = useState<number>(0);
  const [mapSourceView, setMapSourceView] = useState<'spatial' | 'embed'>('spatial');

  const selectedBsu =
    selectedItem.type === 'bsu'
      ? wasteUnits.find((u) => u.id === selectedItem.id) || wasteUnits[0]
      : null;

  const selectedCleanup =
    selectedItem.type === 'kerjabakti'
      ? cleanupEvents.find((c) => c.id === selectedItem.id) || cleanupEvents[0]
      : null;

  const handleSelectBsu = (unit: WasteBankUnit) => {
    const pos = resolveCoordinate(undefined, unit.mapX, unit.mapY, unit.rw);
    setSelectedItem({ type: 'bsu', id: unit.id });
    setInfoWindowTarget({
      type: 'bsu',
      id: unit.id,
      position: pos,
      title: unit.unitName,
      description: `${unit.rw} · ${unit.locationLabel}`,
      badge: `BSU ${unit.rw}`,
      badgeColor: 'bg-orange-600',
    });
    setPanTarget(pos);
    setPanTrigger((k) => k + 1);
  };

  const handleSelectCleanup = (ev: CleanupEvent) => {
    const pos = resolveCoordinate(undefined, ev.mapX, ev.mapY, ev.rw);
    setSelectedItem({ type: 'kerjabakti', id: ev.id });
    setInfoWindowTarget({
      type: 'kerjabakti',
      id: ev.id,
      position: pos,
      title: ev.title,
      description: `${ev.rw} · ${ev.date}`,
      badge: 'Kerja Bakti',
      badgeColor: 'bg-purple-600',
    });
    setPanTarget(pos);
    setPanTrigger((k) => k + 1);
  };

  const handleSelectKantor = () => {
    setSelectedItem({ type: 'kantor', id: 'kantor-lurah' });
    setInfoWindowTarget({
      type: 'kantor',
      id: 'kantor-lurah',
      position: KANTOR_LURAH_COORDINATE,
      title: 'Kantor Lurah Panaikang',
      description: `${formattedOfficeAddress} · Jam Layanan: ${profile?.serviceHours || '-'}`,
      badge: 'Kantor Kelurahan',
      badgeColor: 'bg-[#0D3868]',
    });
    setPanTarget(KANTOR_LURAH_COORDINATE);
    setPanTrigger((k) => k + 1);
  };

  const handleSelectBoundary = (dir: 'utara' | 'timur' | 'selatan' | 'barat') => {
    const point = BOUNDARY_POINTS[dir];
    setSelectedBoundaryDir(dir);
    setSelectedItem({ type: 'batas', id: dir });

    const boundaryText =
      dir === 'utara'
        ? batasUtara
        : dir === 'timur'
        ? batasTimur
        : dir === 'selatan'
        ? batasSelatan
        : batasBarat;

    setInfoWindowTarget({
      type: 'batas',
      id: dir,
      position: point.pos,
      title: `${point.title}: ${boundaryText}`,
      description: `Batas resmi wilayah administratif berdasarkan data Profil Kelurahan yang dikelola langsung oleh Lurah & Administrator.`,
      badge: `Batas Administrasi (${point.directionLabel})`,
      badgeColor: point.badgeBg,
    });
    setPanTarget(point.pos);
    setPanTrigger((k) => k + 1);
  };

  const handleResetCamera = () => {
    setPanTarget(null);
    setFitBoundsTrigger((k) => k + 1);
    setInfoWindowTarget(null);
    setSelectedBoundaryDir(null);
  };

  const apiKey =
    import.meta.env.VITE_GOOGLE_MAPS_API_KEY ||
    'AIzaSyA8mWm8VCvHzQRy1pYB-z-w5yTsSjlBzhI';

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <button
            type="button"
            onClick={() => onNavigate('beranda')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#00838F] hover:text-[#005662] mb-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Portal Utama</span>
          </button>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0D3868] tracking-tight">
              Peta Spasial & Jadwal Siskamling Kelurahan Panaikang
            </h1>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-100 text-sky-800 border border-sky-200">
                <Navigation className="w-3 h-3 text-[#0284C7]" />
                <span>Google Maps Live</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                <span>Roster Siskamling 7 RW</span>
              </span>
            </div>
          </div>
          <p className="mt-1 text-sm text-slate-600">
            Pemetaan spasial wilayah Kelurahan Panaikang (Kec. Panakkukang, Makassar)
            dengan Posko & Jadwal Siskamling RT/RW, Bank Sampah Unit, batas administrasi, dan koordinat resmi.
          </p>
        </div>

        {/* Actions & Layer Filter Buttons */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 self-start">
          <a
            href={OFFICIAL_GOOGLE_MAPS_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold shadow-xs transition-colors cursor-pointer shrink-0"
            title="Buka Peta Wilayah Kelurahan Panaikang langsung di Google Maps"
          >
            <Navigation className="w-3.5 h-3.5 text-white" />
            <span>Buka di Google Maps ↗</span>
            <ExternalLink className="w-3 h-3 text-emerald-200" />
          </a>

          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200">
            {[
              { id: 'semua', label: 'Semua Layer' },
              { id: 'bsu', label: `Bank Sampah (${wasteUnits.length})` },
              { id: 'kerjabakti', label: `Kerja Bakti (${cleanupEvents.length})` },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveLayer(tab.id as LayerType)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  activeLayer === tab.id
                    ? 'bg-[#00838F] text-white shadow-xs'
                    : 'text-slate-700 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Map Options & Layer Quick Toolbar */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 bg-white px-4 py-3 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[#0D3868] whitespace-nowrap flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-[#0277BD]" />
            <span>Peta Tematik Titik Fasilitas Bank Sampah & Kerja Bakti Kelurahan Panaikang</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowRwBoundaries(!showRwBoundaries)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer flex items-center gap-1.5 ${
              showRwBoundaries
                ? 'bg-sky-50 text-[#0277BD] border-sky-300'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Polygon 7 RW: {showRwBoundaries ? 'Aktif' : 'Nonaktif'}</span>
          </button>

          <button
            type="button"
            onClick={handleResetCamera}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1.5 cursor-pointer"
          >
            <Compass className="w-3.5 h-3.5 text-slate-500" />
            <span>Pusatkan Peta</span>
          </button>
        </div>
      </div>

      {/* Boundary Badges Strip */}
      <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
        <button
          type="button"
          onClick={() => handleSelectBoundary('utara')}
          className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
            selectedBoundaryDir === 'utara' && selectedItem.type === 'batas'
              ? 'bg-sky-100 border-sky-400 ring-2 ring-sky-300 shadow-xs'
              : 'bg-sky-50/80 border-sky-200 hover:bg-sky-100/70'
          }`}
          title="Klik untuk memusatkan peta ke Batas Bagian Utara"
        >
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-bold text-sky-900">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-600 shrink-0" />
              <span>Batas Utara</span>
            </span>
            <span className="text-[10px] text-sky-700 font-mono">U</span>
          </div>
          <div className="mt-1 text-slate-800 font-semibold truncate text-xs" title={batasUtara}>
            {batasUtara}
          </div>
        </button>

        <button
          type="button"
          onClick={() => handleSelectBoundary('timur')}
          className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
            selectedBoundaryDir === 'timur' && selectedItem.type === 'batas'
              ? 'bg-amber-100 border-amber-400 ring-2 ring-amber-300 shadow-xs'
              : 'bg-amber-50/80 border-amber-200 hover:bg-amber-100/70'
          }`}
          title="Klik untuk memusatkan peta ke Batas Bagian Timur"
        >
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-bold text-amber-900">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-600 shrink-0" />
              <span>Batas Timur</span>
            </span>
            <span className="text-[10px] text-amber-700 font-mono">T</span>
          </div>
          <div className="mt-1 text-slate-800 font-semibold truncate text-xs" title={batasTimur}>
            {batasTimur}
          </div>
        </button>

        <button
          type="button"
          onClick={() => handleSelectBoundary('selatan')}
          className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
            selectedBoundaryDir === 'selatan' && selectedItem.type === 'batas'
              ? 'bg-emerald-100 border-emerald-400 ring-2 ring-emerald-300 shadow-xs'
              : 'bg-emerald-50/80 border-emerald-200 hover:bg-emerald-100/70'
          }`}
          title="Klik untuk memusatkan peta ke Batas Bagian Selatan"
        >
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-bold text-emerald-900">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 shrink-0" />
              <span>Batas Selatan</span>
            </span>
            <span className="text-[10px] text-emerald-700 font-mono">S</span>
          </div>
          <div className="mt-1 text-slate-800 font-semibold truncate text-xs" title={batasSelatan}>
            {batasSelatan}
          </div>
        </button>

        <button
          type="button"
          onClick={() => handleSelectBoundary('barat')}
          className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
            selectedBoundaryDir === 'barat' && selectedItem.type === 'batas'
              ? 'bg-purple-100 border-purple-400 ring-2 ring-purple-300 shadow-xs'
              : 'bg-purple-50/80 border-purple-200 hover:bg-purple-100/70'
          }`}
          title="Klik untuk memusatkan peta ke Batas Bagian Barat"
        >
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-bold text-purple-900">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-600 shrink-0" />
              <span>Batas Barat</span>
            </span>
            <span className="text-[10px] text-purple-700 font-mono">B</span>
          </div>
          <div className="mt-1 text-slate-800 font-semibold truncate text-xs" title={batasBarat}>
            {batasBarat}
          </div>
        </button>
      </div>

      {/* Map Canvas + Right Inspection Panel */}
      <div className="mt-4 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Google Maps Container */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col shadow-xs">
          <div className="px-4 py-2.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 bg-slate-50">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <Navigation className="w-3.5 h-3.5 text-[#00838F]" />
              <span>Peta Spasial Resmi Batas Wilayah Kelurahan Panaikang (-5.138977, 119.458652)</span>
            </div>

            <div className="flex items-center gap-1.5 p-1 bg-white rounded-xl border border-slate-200 shadow-2xs">
              <button
                type="button"
                onClick={() => setMapSourceView('spatial')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  mapSourceView === 'spatial'
                    ? 'bg-[#0D3868] text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Peta Spasial Smart
              </button>
              <button
                type="button"
                onClick={() => setMapSourceView('embed')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  mapSourceView === 'embed'
                    ? 'bg-[#0D3868] text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Google Maps Resmi (Sesuai Tautan)
              </button>
            </div>
          </div>

          <div className="relative h-[480px] sm:h-[540px] w-full bg-slate-100">
            {mapSourceView === 'embed' ? (
              <iframe
                title="Peta Resmi Kelurahan Panaikang"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15895.048997973807!2d119.46088!3d-5.137261!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2dbee2b70f074d25%3A0x6b9d6796eb0eb13e!2sPanaikang%2C%20Panakkukang%2C%20Makassar%20City%2C%20South%20Sulawesi!5e0!3m2!1sid!2sid!4v1700000000000!5m2!1sid!2sid"
                className="w-full h-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            ) : (
              <APIProvider apiKey={apiKey}>
                <Map
                  defaultCenter={PANAIKANG_CENTER}
                  defaultZoom={PANAIKANG_DEFAULT_ZOOM}
                  mapId="panaikang-spatial-map"
                  mapTypeId={mapTypeId}
                  gestureHandling="greedy"
                  disableDefaultUI={false}
                  className="w-full h-full"
                >
                  {/* Controller for camera changes & initial exact boundary fitBounds */}
                  <MapController
                    targetCenter={panTarget}
                    triggerKey={panTrigger}
                    fitBoundsTrigger={fitBoundsTrigger}
                  />

                  {/* Main Perimeter Boundary Polygon of Kelurahan Panaikang (Matching Google Maps Red Boundary) */}
                  <GoogleMapsPolygon
                    paths={PANAIKANG_PERIMETER_POLYGON}
                    strokeColor="#DC2626"
                    strokeOpacity={0.95}
                    strokeWeight={3.2}
                    fillColor="#EF4444"
                    fillOpacity={0.07}
                  />

                  {/* Sub-polygons for RW 01 – RW 07 strictly clipped inside Kelurahan Panaikang */}
                  {showRwBoundaries &&
                    RW_ZONES.map((zone) => (
                      <GoogleMapsPolygon
                        key={zone.rw}
                        paths={zone.paths}
                        strokeColor={zone.color}
                        strokeOpacity={0.75}
                        strokeWeight={1.8}
                        fillColor={zone.color}
                        fillOpacity={0.11}
                      />
                    ))}

                  {/* RW Center Labels */}
                  {showRwBoundaries &&
                    RW_ZONES.map((zone) => (
                      <AdvancedMarker
                        key={`label-${zone.rw}`}
                        position={zone.center}
                      >
                        <div className="px-2 py-0.5 rounded-md bg-white/95 border border-slate-300 shadow-xs text-[10px] font-extrabold text-slate-800 pointer-events-none select-none">
                          {zone.rw}
                        </div>
                      </AdvancedMarker>
                    ))}

                  {/* Marker: Kantor Lurah Panaikang */}
                  <AdvancedMarker
                    position={KANTOR_LURAH_COORDINATE}
                    onClick={handleSelectKantor}
                    title="Kantor Lurah Panaikang"
                  >
                    <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#0D3868] text-white border-2 border-white shadow-lg cursor-pointer hover:scale-110 transition-transform">
                      <Building2 className="w-3.5 h-3.5 text-amber-300" />
                      <span className="text-[11px] font-bold">Kantor Lurah</span>
                    </div>
                  </AdvancedMarker>

                  {/* Markers: Bank Sampah Units (BSU) */}
                  {(activeLayer === 'semua' || activeLayer === 'bsu') &&
                    wasteUnits.map((unit) => {
                      const pos = resolveCoordinate(undefined, unit.mapX, unit.mapY, unit.rw);
                      const isSelected =
                        selectedItem.type === 'bsu' && selectedItem.id === unit.id;

                      return (
                        <AdvancedMarker
                          key={`bsu-${unit.id}`}
                          position={pos}
                          onClick={() => handleSelectBsu(unit)}
                          title={unit.unitName}
                        >
                          <div
                            className={`flex items-center gap-1 px-2 py-1 rounded-lg bg-[#EA580C] text-white border-2 border-white shadow-md cursor-pointer transition-transform ${
                              isSelected ? 'scale-125 ring-4 ring-amber-400' : 'hover:scale-110'
                            }`}
                          >
                            <Recycle className="w-3 h-3" />
                            <span className="text-[10px] font-bold">BSU {unit.rw}</span>
                          </div>
                        </AdvancedMarker>
                      );
                    })}

                  {/* Markers: Kerja Bakti */}
                  {(activeLayer === 'semua' || activeLayer === 'kerjabakti') &&
                    cleanupEvents.map((ev) => {
                      const pos = resolveCoordinate(undefined, ev.mapX, ev.mapY, ev.rw);
                      const isSelected =
                        selectedItem.type === 'kerjabakti' && selectedItem.id === ev.id;

                      return (
                        <AdvancedMarker
                          key={`cleanup-${ev.id}`}
                          position={pos}
                          onClick={() => handleSelectCleanup(ev)}
                          title={ev.title}
                        >
                          <div
                            className={`flex items-center gap-1 px-2 py-1 rounded-lg bg-[#7C3AED] text-white border-2 border-white shadow-md cursor-pointer transition-transform ${
                              isSelected ? 'scale-125 ring-4 ring-purple-400' : 'hover:scale-110'
                            }`}
                          >
                            <Calendar className="w-3 h-3" />
                            <span className="text-[10px] font-bold">Kerja Bakti</span>
                          </div>
                        </AdvancedMarker>
                      );
                    })}

                  {/* Cardinal Boundary Markers */}
                  {showBoundaryMarkers &&
                    Object.entries(BOUNDARY_POINTS).map(([dirKey, point]) => {
                      const isSelected =
                        selectedItem.type === 'batas' && selectedBoundaryDir === dirKey;

                      return (
                        <AdvancedMarker
                          key={`boundary-${dirKey}`}
                          position={point.pos}
                          onClick={() =>
                            handleSelectBoundary(dirKey as 'utara' | 'timur' | 'selatan' | 'barat')
                          }
                          title={point.title}
                        >
                          <div
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-white border-2 border-white shadow-lg cursor-pointer transition-all ${
                              point.badgeBg
                            } ${
                              isSelected
                                ? `scale-125 ring-4 ${point.borderRing} shadow-xl`
                                : 'hover:scale-110'
                            }`}
                          >
                            <span className="w-2 h-2 rounded-full bg-white shrink-0" />
                            <span className="text-[11px] font-bold font-mono">
                              Batas {point.directionLabel}
                            </span>
                          </div>
                        </AdvancedMarker>
                      );
                    })}

                  {/* InfoWindow */}
                  {infoWindowTarget && (
                    <InfoWindow
                      position={infoWindowTarget.position}
                      onCloseClick={() => setInfoWindowTarget(null)}
                    >
                      <div className="p-1 max-w-[220px] text-slate-800">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold text-white mb-1 ${infoWindowTarget.badgeColor}`}
                        >
                          {infoWindowTarget.badge}
                        </span>
                        <h4 className="text-xs font-bold leading-snug">
                          {infoWindowTarget.title}
                        </h4>
                        <p className="mt-1 text-[11px] text-slate-600 leading-snug">
                          {infoWindowTarget.description}
                        </p>
                      </div>
                    </InfoWindow>
                  )}
                </Map>
              </APIProvider>
            )}
          </div>
        </div>

        {/* Right: Inspection Sidebar */}
        <div className="lg:col-span-4 space-y-4">
          {/* Kantor Lurah Card - Tersinkronisasi 100% dengan Profil Kelurahan */}
          {selectedItem.type === 'kantor' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-xs">
              <div className="pb-3 border-b border-slate-200">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#1C8237] bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-[#1C8237]" />
                    <span>ALAMAT & KONTAK KANTOR KELURAHAN</span>
                  </span>
                </div>
                <h3 className="mt-2 text-base font-extrabold text-[#0D3868]">
                  Kantor Lurah Panaikang
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {profile?.subDistrict || 'Kecamatan Panakkukang'}, {profile?.city || 'Kota Makassar, Provinsi Sulawesi Selatan'}
                </p>
              </div>

              {/* Informasi Pimpinan Lurah (Sesuai Profil Kelurahan) */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
                <img
                  src={
                    profile?.lurahPhotoUrl ||
                    '/images/lurah_muthmainnah_panaikang_1791548085422.jpg'
                  }
                  alt={profile?.lurahName || 'Lurah Panaikang'}
                  className="w-11 h-14 rounded-lg object-cover object-top border border-[#0D3868]/30 shrink-0 bg-white"
                />
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] font-bold text-[#0277BD] uppercase tracking-wider flex items-center gap-1">
                    <UserCheck className="w-3 h-3" />
                    <span>Pimpinan Lurah Panaikang</span>
                  </div>
                  <div className="text-xs font-extrabold text-[#0D3868] truncate mt-0.5">
                    {profile?.lurahName || 'Nama Lurah Belum Diisi'}
                  </div>
                  <div className="text-[11px] text-slate-600 truncate">
                    {profile?.lurahNip ? `NIP. ${profile.lurahNip}` : 'Lurah Panaikang'}
                    {profile?.lurahRank ? ` · ${profile.lurahRank}` : ''}
                  </div>
                </div>
              </div>

              {/* Alamat, Jam Pelayanan, Telepon & Email (Sesuai Profil Kelurahan) */}
              <div className="text-xs space-y-2.5 text-slate-700">
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-[#0277BD] shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-slate-900">Alamat Kantor Pelayanan:</div>
                    <div className="text-slate-600 leading-relaxed">
                      {formattedOfficeAddress}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Clock className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-slate-900">Jam Pelayanan Warga:</div>
                    <div className="text-slate-600 font-mono-num">
                      {profile?.serviceHours || '-'}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Phone className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-slate-900">
                      Telepon & Hotline Posko Smart Environment:
                    </div>
                    <div className="text-slate-600 font-mono-num">
                      {profile?.phoneContact || '-'}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Mail className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-slate-900">Surat Elektronik Resmi:</div>
                    <div className="text-slate-600 font-mono-num">
                      {profile?.emailContact || '-'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Demografi & Batas Administratif Wilayah (Sesuai Profil Kelurahan) */}
              <div className="pt-3 border-t border-slate-200 space-y-3">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="text-[10px] text-slate-500">Luas Wilayah</div>
                    <div className="text-xs font-extrabold text-[#0D3868] font-mono-num mt-0.5">
                      {profile?.areaKm2 || '-'}
                    </div>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="text-[10px] text-slate-500">Cakupan RT/RW</div>
                    <div className="text-xs font-extrabold text-[#0D3868] font-mono-num mt-0.5">
                      {profile?.totalRw || 7} RW · {profile?.totalRt || 0} RT
                    </div>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="text-[10px] text-slate-500">Penduduk</div>
                    <div className="text-[11px] font-extrabold text-[#0D3868] font-mono-num mt-0.5">
                      {profile?.totalPopulation
                        ? `${profile.totalPopulation.split(' ')[0]} Jiwa`
                        : '-'}
                    </div>
                  </div>
                </div>

                <div className="text-[11px] space-y-1 text-slate-600">
                  <div className="font-semibold text-slate-900 flex items-center gap-1.5 mb-1">
                    <Compass className="w-3.5 h-3.5 text-[#0D3868]" />
                    <span>Batas Administratif Wilayah:</span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-800">Utara:</span>{' '}
                    {profile?.boundaries?.utara || '-'}
                  </div>
                  <div>
                    <span className="font-semibold text-slate-800">Selatan:</span>{' '}
                    {profile?.boundaries?.selatan || '-'}
                  </div>
                  <div>
                    <span className="font-semibold text-slate-800">Timur:</span>{' '}
                    {profile?.boundaries?.timur || '-'}
                  </div>
                  <div>
                    <span className="font-semibold text-slate-800">Barat:</span>{' '}
                    {profile?.boundaries?.barat || '-'}
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onNavigate('profil')}
                  className="flex-1 py-2 px-3 rounded-xl bg-[#0D3868] hover:bg-[#072647] text-white text-xs font-bold transition cursor-pointer text-center"
                >
                  Lihat Profil Kelurahan →
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('rtrw')}
                  className="py-2 px-3 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold transition cursor-pointer text-center"
                >
                  Data RT/RW
                </button>
              </div>
            </div>
          )}

          {/* Batas Wilayah Card */}
          {selectedItem.type === 'batas' && selectedBoundaryDir && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3 shadow-xs">
              <div className="pb-2.5 border-b border-slate-200">
                <span className="text-[10px] font-bold text-sky-800 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200">
                  BATAS WILAYAH ADMINISTRATIF
                </span>
                <h3 className="mt-1 text-base font-extrabold text-[#0D3868]">
                  Batas {selectedBoundaryDir.charAt(0).toUpperCase() + selectedBoundaryDir.slice(1)}
                </h3>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                {selectedBoundaryDir === 'utara' && batasUtara}
                {selectedBoundaryDir === 'timur' && batasTimur}
                {selectedBoundaryDir === 'selatan' && batasSelatan}
                {selectedBoundaryDir === 'barat' && batasBarat}
              </p>
              <div className="text-[11px] text-slate-500">
                Batas resmi ini terhubung langsung dengan data resmi Profil Kelurahan Panaikang.
              </div>
            </div>
          )}

          {/* Quick List of Bank Sampah Units */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-2.5 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-extrabold text-[#0D3868] flex items-center gap-1.5">
                <Recycle className="w-4 h-4 text-emerald-600" />
                <span>Unit Bank Sampah ({wasteUnits.length} BSU)</span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono-num font-bold">
                Panaikang
              </span>
            </div>

            <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
              {wasteUnits.map((unit) => {
                const isSelected = selectedItem.type === 'bsu' && selectedItem.id === unit.id;
                return (
                  <button
                    key={unit.id}
                    type="button"
                    onClick={() => handleSelectBsu(unit)}
                    className={`w-full p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-amber-50 border-amber-400 ring-1 ring-amber-300'
                        : 'bg-white hover:bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-xs text-[#0D3868]">
                          {unit.unitName}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-orange-100 text-orange-800 font-bold">
                          {unit.rw}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-600 truncate mt-0.5">
                        {unit.locationLabel}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected BSU Card */}
          {selectedBsu && selectedItem.type === 'bsu' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3.5 shadow-xs">
              <div className="pb-2.5 border-b border-slate-200">
                <span className="text-[10px] font-bold text-orange-700 bg-orange-50 px-2 py-0.5 rounded-md border border-orange-200">
                  BANK SAMPAH UNIT (BSU)
                </span>
                <h3 className="mt-1 text-base font-extrabold text-[#0D3868]">
                  {selectedBsu.unitName}
                </h3>
                <div className="text-xs text-slate-500 mt-0.5">
                  {selectedBsu.rw} · {selectedBsu.locationLabel}
                </div>
              </div>

              <div className="text-xs space-y-1.5 text-slate-600">
                <div>
                  <strong>Koordinator:</strong> {selectedBsu.coordinator}
                </div>
                <div>
                  <strong>Wilayah Layanan:</strong> {selectedBsu.locationLabel}
                </div>
                <div>
                  <strong>Jadwal Timbang:</strong> {selectedBsu.pickupSchedule}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-orange-50/70 border border-orange-200 text-center font-mono-num text-xs">
                <div>
                  <div className="text-[10px] text-emerald-800 font-bold">Organik</div>
                  <div className="font-bold text-slate-900">{selectedBsu.organikKg} kg</div>
                </div>
                <div>
                  <div className="text-[10px] text-sky-800 font-bold">Anorganik</div>
                  <div className="font-bold text-slate-900">{selectedBsu.anorganikKg} kg</div>
                </div>
                <div>
                  <div className="text-[10px] text-amber-800 font-bold">Residu</div>
                  <div className="font-bold text-slate-900">{selectedBsu.residuKg} kg</div>
                </div>
              </div>
            </div>
          )}

          {/* Selected Kerja Bakti Card */}
          {selectedCleanup && selectedItem.type === 'kerjabakti' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3.5 shadow-xs">
              <div className="pb-2.5 border-b border-slate-200">
                <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                  DOKUMENTASI KERJA BAKTI
                </span>
                <h3 className="mt-1 text-base font-extrabold text-[#0D3868]">
                  {selectedCleanup.title}
                </h3>
                <div className="text-xs text-slate-500 mt-0.5">
                  {selectedCleanup.rw} · {selectedCleanup.date}
                </div>
              </div>

              <div className="text-xs space-y-1 text-slate-600">
                <div>
                  <strong>Lokasi:</strong> {selectedCleanup.locationName}
                </div>
                <div>
                  <strong>Peserta:</strong> {selectedCleanup.registeredParticipants}/
                  {selectedCleanup.targetParticipants} warga
                </div>
                <div>
                  <strong>Sampah Terkumpul:</strong> {selectedCleanup.collectedWasteKg} kg
                </div>
              </div>

              <button
                type="button"
                onClick={() => onNavigate('kerjabakti')}
                className="w-full py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition cursor-pointer text-center"
              >
                Lihat Monitoring Kerja Bakti →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PetaDigitalView;
