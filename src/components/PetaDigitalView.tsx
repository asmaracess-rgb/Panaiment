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

// Geographic center and bounds for Kelurahan Panaikang, Panakkukang, Makassar
const PANAIKANG_CENTER = { lat: -5.1388, lng: 119.4475 };
const PANAIKANG_DEFAULT_ZOOM = 15;

// Perimeter administrative boundary polygon of Kelurahan Panaikang
const PANAIKANG_PERIMETER_POLYGON: google.maps.LatLngLiteral[] = [
  { lat: -5.1320, lng: 119.4402 }, // Barat Laut (Kanal Pampang / Flyover)
  { lat: -5.1315, lng: 119.4450 }, // Utara 1 (Kanal Pampang)
  { lat: -5.1328, lng: 119.4510 }, // Utara 2 (Aliran Kanal Panaikang)
  { lat: -5.1340, lng: 119.4552 }, // Timur Laut (Batas Kel. Tello Baru)
  { lat: -5.1375, lng: 119.4568 }, // Timur (Batas Kec. Manggala)
  { lat: -5.1412, lng: 119.4555 }, // Tenggara 1 (Batas Kel. Tamamaung)
  { lat: -5.1448, lng: 119.4522 }, // Tenggara 2 (Kompleks Kejaksaan Selatan)
  { lat: -5.1458, lng: 119.4470 }, // Selatan (Batas Kel. Pandang / Karampuang)
  { lat: -5.1442, lng: 119.4415 }, // Barat Daya (Jl. Sukaria Selatan)
  { lat: -5.1398, lng: 119.4390 }, // Barat (Jl. Racing Centre / Pettarani)
  { lat: -5.1355, lng: 119.4388 }, // Barat Tengah (Sisi Barat Nipah Mall)
  { lat: -5.1320, lng: 119.4402 }, // Close polygon
];

// RW Zone Sub-polygons within Kelurahan Panaikang
interface RwZone {
  rw: string;
  name: string;
  color: string;
  paths: google.maps.LatLngLiteral[];
  center: google.maps.LatLngLiteral;
}

const RW_ZONES: RwZone[] = [
  {
    rw: 'RW 01',
    name: 'Kawasan Nipah Mall & Racing Centre',
    color: '#0284C7', // Sky
    center: { lat: -5.1368, lng: 119.4412 },
    paths: [
      { lat: -5.1320, lng: 119.4402 },
      { lat: -5.1318, lng: 119.4442 },
      { lat: -5.1388, lng: 119.4435 },
      { lat: -5.1398, lng: 119.4390 },
      { lat: -5.1355, lng: 119.4388 },
      { lat: -5.1320, lng: 119.4402 },
    ],
  },
  {
    rw: 'RW 02',
    name: 'Koridor Poros Jl. Urip Sumoharjo',
    color: '#0D9488', // Teal
    center: { lat: -5.1375, lng: 119.4470 },
    paths: [
      { lat: -5.1350, lng: 119.4442 },
      { lat: -5.1352, lng: 119.4502 },
      { lat: -5.1398, lng: 119.4498 },
      { lat: -5.1395, lng: 119.4440 },
      { lat: -5.1350, lng: 119.4442 },
    ],
  },
  {
    rw: 'RW 03',
    name: 'Kawasan Kampus UMI & Lorong 2',
    color: '#16A34A', // Green
    center: { lat: -5.1340, lng: 119.4485 },
    paths: [
      { lat: -5.1315, lng: 119.4450 },
      { lat: -5.1325, lng: 119.4520 },
      { lat: -5.1352, lng: 119.4502 },
      { lat: -5.1350, lng: 119.4442 },
      { lat: -5.1315, lng: 119.4450 },
    ],
  },
  {
    rw: 'RW 04',
    name: 'Kawasan Jl. Sukaria Raya Lorong 1–5',
    color: '#D97706', // Amber
    center: { lat: -5.1415, lng: 119.4435 },
    paths: [
      { lat: -5.1395, lng: 119.4440 },
      { lat: -5.1398, lng: 119.4498 },
      { lat: -5.1455, lng: 119.4468 },
      { lat: -5.1442, lng: 119.4415 },
      { lat: -5.1398, lng: 119.4390 },
      { lat: -5.1395, lng: 119.4440 },
    ],
  },
  {
    rw: 'RW 05',
    name: 'Kawasan Kompleks Kejaksaan & Adhyaksa',
    color: '#9333EA', // Purple
    center: { lat: -5.1428, lng: 119.4505 },
    paths: [
      { lat: -5.1398, lng: 119.4498 },
      { lat: -5.1408, lng: 119.4542 },
      { lat: -5.1448, lng: 119.4522 },
      { lat: -5.1455, lng: 119.4468 },
      { lat: -5.1398, lng: 119.4498 },
    ],
  },
  {
    rw: 'RW 06',
    name: 'Kawasan Bantaran Kanal Pampang - Panaikang',
    color: '#2563EB', // Blue
    center: { lat: -5.1345, lng: 119.4538 },
    paths: [
      { lat: -5.1328, lng: 119.4510 },
      { lat: -5.1340, lng: 119.4552 },
      { lat: -5.1378, lng: 119.4565 },
      { lat: -5.1385, lng: 119.4522 },
      { lat: -5.1352, lng: 119.4502 },
      { lat: -5.1328, lng: 119.4510 },
    ],
  },
  {
    rw: 'RW 07',
    name: 'Kawasan Flamboyan & Sukaria Timur',
    color: '#E11D48', // Rose
    center: { lat: -5.1398, lng: 119.4545 },
    paths: [
      { lat: -5.1385, lng: 119.4522 },
      { lat: -5.1378, lng: 119.4565 },
      { lat: -5.1412, lng: 119.4555 },
      { lat: -5.1408, lng: 119.4542 },
      { lat: -5.1385, lng: 119.4522 },
    ],
  },
];

// Kantor Lurah Panaikang Coordinate
const KANTOR_LURAH_COORDINATE = { lat: -5.1388, lng: 119.4468 };

// Coordinate resolution helper
function resolveCoordinate(
  coordinatesLabel?: string,
  mapX: number = 50,
  mapY: number = 50
): google.maps.LatLngLiteral {
  if (coordinatesLabel && coordinatesLabel.includes(',')) {
    const parts = coordinatesLabel.split(',');
    if (parts.length === 2) {
      const lat = parseFloat(parts[0].trim());
      const lng = parseFloat(parts[1].trim());
      if (!isNaN(lat) && !isNaN(lng) && lat < 0 && lng > 100) {
        return { lat, lng };
      }
    }
  }
  const NORTH = -5.1320;
  const SOUTH = -5.1458;
  const WEST = 119.4388;
  const EAST = 119.4568;

  const lat = NORTH - (mapY / 100) * (NORTH - SOUTH);
  const lng = WEST + (mapX / 100) * (EAST - WEST);
  return { lat, lng };
}

// Map Controller for smooth pan and zoom
function MapController({
  targetCenter,
  triggerKey,
}: {
  targetCenter: google.maps.LatLngLiteral | null;
  triggerKey: number;
}) {
  const map = useMap();

  useEffect(() => {
    if (map && targetCenter) {
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

// Cardinal Boundary Points on Kelurahan Panaikang perimeter
const BOUNDARY_POINTS: Record<
  'utara' | 'timur' | 'selatan' | 'barat',
  {
    title: string;
    directionLabel: string;
    pos: google.maps.LatLngLiteral;
    color: string;
    badgeBg: string;
    borderRing: string;
  }
> = {
  utara: {
    title: 'Batas Wilayah Bagian Utara',
    directionLabel: 'Utara',
    pos: { lat: -5.1315, lng: 119.4475 },
    color: 'bg-sky-600',
    badgeBg: 'bg-sky-600',
    borderRing: 'ring-sky-400',
  },
  timur: {
    title: 'Batas Wilayah Bagian Timur',
    directionLabel: 'Timur',
    pos: { lat: -5.1375, lng: 119.4568 },
    color: 'bg-amber-600',
    badgeBg: 'bg-amber-600',
    borderRing: 'ring-amber-400',
  },
  selatan: {
    title: 'Batas Wilayah Bagian Selatan',
    directionLabel: 'Selatan',
    pos: { lat: -5.1458, lng: 119.4470 },
    color: 'bg-emerald-600',
    badgeBg: 'bg-emerald-600',
    borderRing: 'ring-emerald-400',
  },
  barat: {
    title: 'Batas Wilayah Bagian Barat',
    directionLabel: 'Barat',
    pos: { lat: -5.1375, lng: 119.4388 },
    color: 'bg-purple-600',
    badgeBg: 'bg-purple-600',
    borderRing: 'ring-purple-400',
  },
};

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
  const batasUtara = profile?.boundaries?.utara?.trim() || 'Kanal Pampang / Pampang';
  const batasTimur = profile?.boundaries?.timur?.trim() || 'Manggala & Tamamaung';
  const batasSelatan = profile?.boundaries?.selatan?.trim() || 'Karampuang & Pandang';
  const batasBarat = profile?.boundaries?.barat?.trim() || 'Sinrijala / Pettarani';

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
    const pos = resolveCoordinate(undefined, unit.mapX, unit.mapY);
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
    const pos = resolveCoordinate(undefined, ev.mapX, ev.mapY);
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
      description: 'Pusat Pemerintahan & Posko Smart Environment Kelurahan Panaikang',
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
    setPanTarget(PANAIKANG_CENTER);
    setPanTrigger((k) => k + 1);
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
              <span>Peta Spasial Posko Siskamling & Batas Kelurahan Panaikang (-5.1388, 119.4475)</span>
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
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15895.048997973807!2d119.4402!3d-5.1388!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2dbee2b70f074d25%3A0x6b9d6796eb0eb13e!2sPanaikang%2C%20Panakkukang%2C%20Makassar%20City%2C%20South%20Sulawesi!5e0!3m2!1sen!2sid!4v1700000000000!5m2!1sen!2sid"
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
                  {/* Controller for camera changes */}
                  <MapController targetCenter={panTarget} triggerKey={panTrigger} />

                  {/* Main Perimeter Boundary Polygon of Kelurahan Panaikang */}
                  <GoogleMapsPolygon
                    paths={PANAIKANG_PERIMETER_POLYGON}
                    strokeColor="#0284C7"
                    strokeOpacity={0.95}
                    strokeWeight={3.5}
                    fillColor="#0284C7"
                    fillOpacity={0.06}
                  />

                  {/* Sub-polygons for RW 01 – RW 07 */}
                  {showRwBoundaries &&
                    RW_ZONES.map((zone) => (
                      <GoogleMapsPolygon
                        key={zone.rw}
                        paths={zone.paths}
                        strokeColor={zone.color}
                        strokeOpacity={0.7}
                        strokeWeight={1.8}
                        fillColor={zone.color}
                        fillOpacity={0.09}
                      />
                    ))}

                  {/* RW Center Labels */}
                  {showRwBoundaries &&
                    RW_ZONES.map((zone) => (
                      <AdvancedMarker
                        key={`label-${zone.rw}`}
                        position={zone.center}
                      >
                        <div className="px-2 py-0.5 rounded-md bg-white/90 border border-slate-300 shadow-xs text-[10px] font-extrabold text-slate-700 pointer-events-none select-none">
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
                      const pos = resolveCoordinate(undefined, unit.mapX, unit.mapY);
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
                      const pos = resolveCoordinate(undefined, ev.mapX, ev.mapY);
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
          {/* Kantor Lurah Card */}
          {selectedItem.type === 'kantor' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3.5 shadow-xs">
              <div className="pb-3 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#0D3868] bg-sky-50 px-2.5 py-0.5 rounded-md border border-sky-200 flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-[#0277BD]" />
                    <span>KANTOR PEMERINTAHAN</span>
                  </span>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    Pusat Layanan
                  </span>
                </div>
                <h3 className="mt-2 text-base font-extrabold text-[#0D3868]">
                  Kantor Lurah Panaikang
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Kecamatan Panakkukang, Kota Makassar
                </p>
              </div>

              <div className="text-xs space-y-2 text-slate-600">
                <div className="flex items-start gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#0D3868] shrink-0 mt-0.5" />
                  <span>
                    <strong>Alamat:</strong> Jl. Babussalam No. 1, Kelurahan Panaikang, Makassar
                  </span>
                </div>
                <div className="flex items-start gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
                  <span>
                    <strong>Jam Pelayanan:</strong> Senin - Jumat: 08.00 - 15.30 WITA
                  </span>
                </div>
                <div className="flex items-start gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-[#0277BD] shrink-0 mt-0.5" />
                  <span>
                    <strong>Pusat Koordinasi:</strong> Wilayah administratif RW 01 s/d RW 07
                  </span>
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
