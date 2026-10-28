/// <reference types="@types/google.maps" />
import React, { useState, useEffect } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin,
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
} from 'lucide-react';
import {
  CitizenReport,
  ReportStatus,
  WasteBankUnit,
  CleanupEvent,
  AppView,
  KelurahanProfile,
} from '../types';

interface PetaDigitalViewProps {
  reports: CitizenReport[];
  wasteUnits: WasteBankUnit[];
  cleanupEvents: CleanupEvent[];
  onUpdateReportStatus: (
    id: string,
    newStatus: ReportStatus,
    assignedTeam: string,
    responseNote: string
  ) => void;
  onNavigate: (view: AppView) => void;
  profile?: KelurahanProfile;
}

type LayerType = 'semua' | 'laporan' | 'bsu' | 'kerjabakti';

// Geographic center and bounds for Kelurahan Panaikang, Panakkukang, Makassar
const PANAIKANG_CENTER = { lat: -5.1385, lng: 119.4475 };
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

// Coordinate resolution helper: parses coordinatesLabel or projects mapX/mapY
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
  // Bounding box mapping
  const NORTH = -5.1320;
  const SOUTH = -5.1455;
  const WEST = 119.4385;
  const EAST = 119.4565;

  const lat = NORTH - (mapY / 100) * (NORTH - SOUTH);
  const lng = WEST + (mapX / 100) * (EAST - WEST);
  return { lat, lng };
}

// Subcomponent: Custom Google Maps Polygon renderer using useMap hook
function GoogleMapsPolygon({
  paths,
  strokeColor,
  strokeOpacity = 0.9,
  strokeWeight = 2,
  fillColor,
  fillOpacity = 0.15,
  onClick,
}: {
  paths: google.maps.LatLngLiteral[];
  strokeColor: string;
  strokeOpacity?: number;
  strokeWeight?: number;
  fillColor: string;
  fillOpacity?: number;
  onClick?: () => void;
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

    let listener: google.maps.MapsEventListener | null = null;
    if (onClick) {
      listener = polygon.addListener('click', onClick);
    }

    return () => {
      if (listener) google.maps.event.removeListener(listener);
      polygon.setMap(null);
    };
  }, [map, paths, strokeColor, strokeOpacity, strokeWeight, fillColor, fillOpacity, onClick]);

  return null;
}

// Subcomponent: Map Controller for Pan/Zoom actions
function MapController({
  targetCenter,
  triggerKey,
}: {
  targetCenter: google.maps.LatLngLiteral | null;
  triggerKey: number;
}) {
  const map = useMap();

  useEffect(() => {
    if (!map || !targetCenter) return;
    map.panTo(targetCenter);
  }, [map, targetCenter, triggerKey]);

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
  reports,
  wasteUnits,
  cleanupEvents,
  onUpdateReportStatus,
  onNavigate,
  profile,
}) => {
  const [activeLayer, setActiveLayer] = useState<LayerType>('semua');
  const [statusFilter, setStatusFilter] = useState<'Semua' | ReportStatus>('Semua');
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
    type: 'laporan' | 'bsu' | 'kerjabakti' | 'kantor' | 'batas';
    id: string;
  }>({
    type: 'laporan',
    id: reports[0]?.id || '',
  });

  const [infoWindowTarget, setInfoWindowTarget] = useState<{
    type: 'laporan' | 'bsu' | 'kerjabakti' | 'kantor' | 'batas';
    id: string;
    position: google.maps.LatLngLiteral;
    title: string;
    description: string;
    badge: string;
    badgeColor: string;
  } | null>(null);

  const [panTarget, setPanTarget] = useState<google.maps.LatLngLiteral | null>(null);
  const [panTrigger, setPanTrigger] = useState<number>(0);

  const visibleReports = reports.filter(
    (r) => statusFilter === 'Semua' || r.status === statusFilter
  );

  const selectedReport =
    selectedItem.type === 'laporan'
      ? reports.find((r) => r.id === selectedItem.id) || reports[0]
      : null;

  const selectedBsu =
    selectedItem.type === 'bsu'
      ? wasteUnits.find((u) => u.id === selectedItem.id) || wasteUnits[0]
      : null;

  const selectedCleanup =
    selectedItem.type === 'kerjabakti'
      ? cleanupEvents.find((c) => c.id === selectedItem.id) || cleanupEvents[0]
      : null;

  const handleSelectReport = (rep: CitizenReport) => {
    const pos = resolveCoordinate(rep.coordinatesLabel, rep.mapX, rep.mapY);
    setSelectedItem({ type: 'laporan', id: rep.id });
    setInfoWindowTarget({
      type: 'laporan',
      id: rep.id,
      position: pos,
      title: rep.title,
      description: `${rep.rw} / ${rep.rt} · ${rep.locationName}`,
      badge: rep.status,
      badgeColor:
        rep.status === 'Selesai'
          ? 'bg-emerald-600'
          : rep.status === 'Sedang Ditangani'
          ? 'bg-sky-600'
          : 'bg-amber-500',
    });
    setPanTarget(pos);
    setPanTrigger((k) => k + 1);
  };

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
    const boundaryText =
      dir === 'utara'
        ? batasUtara
        : dir === 'timur'
        ? batasTimur
        : dir === 'selatan'
        ? batasSelatan
        : batasBarat;

    setSelectedBoundaryDir(dir);
    setSelectedItem({ type: 'batas', id: dir });
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
              Peta Digital Kelurahan Panaikang
            </h1>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-100 text-sky-800 border border-sky-200">
                <Navigation className="w-3 h-3 text-[#0284C7]" />
                <span>Google Maps Live</span>
              </span>
              <span
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200"
                title="Data batas wilayah terkoneksi langsung dengan Profil Kelurahan"
              >
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>Terkoneksi Profil Kelurahan</span>
              </span>
            </div>
          </div>
          <p className="mt-1 text-sm text-slate-600">
            Pemetaan spasial resmi wilayah Kelurahan Panaikang (Kec. Panakkukang, Makassar)
            dengan garis batas administrasi wilayah, pembagian zona RW 01 – RW 07, titik laporan warga, dan Bank Sampah Unit.
          </p>
        </div>

        {/* Layer Filter Buttons */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200 self-start">
          {[
            { id: 'semua', label: 'Semua Titik' },
            { id: 'laporan', label: `Laporan (${reports.length})` },
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

      {/* Filter Bar & Map Controls */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 bg-white px-4 py-3 rounded-2xl border border-slate-200">
        <div className="flex items-center gap-2 overflow-x-auto">
          <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">
            Filter Status Laporan:
          </span>
          {(['Semua', 'Menunggu Verifikasi', 'Sedang Ditangani', 'Selesai'] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                statusFilter === st
                  ? 'bg-[#0D3868] text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Map View Controls: Satellite Toggle, RW Boundaries Toggle, Boundary Pins Toggle, Center Button */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setShowBoundaryMarkers((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
              showBoundaryMarkers
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
            title="Sembunyikan / Tampilkan Pin Titik Batas Administrasi di Peta"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>{showBoundaryMarkers ? 'Pin Batas: Aktif' : 'Pin Batas: Nonaktif'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowRwBoundaries((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
              showRwBoundaries
                ? 'bg-sky-50 border-sky-300 text-sky-800'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
            title="Sembunyikan / Tampilkan Batas Zona RW"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{showRwBoundaries ? 'Batas RW: Aktif' : 'Batas RW: Nonaktif'}</span>
          </button>

          <button
            type="button"
            onClick={() => setMapTypeId(mapTypeId === 'roadmap' ? 'hybrid' : 'roadmap')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 cursor-pointer"
            title="Ganti Tampilan Peta Jalan / Satelit"
          >
            <span>{mapTypeId === 'roadmap' ? 'Mode Satelit' : 'Mode Jalan'}</span>
          </button>

          <button
            type="button"
            onClick={handleResetCamera}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#0D3868] hover:bg-[#072647] text-white cursor-pointer shadow-2xs"
            title="Kembalikan Peta ke Pusat Kelurahan Panaikang"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Pusatkan Peta</span>
          </button>
        </div>
      </div>

      {/* Boundary Legend Badges - Dynamic from Profil Kelurahan */}
      <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
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
          <div className="px-4 py-2.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <Navigation className="w-3.5 h-3.5 text-[#00838F]" />
              <span>Peta Google Maps Spasial Wilayah Kelurahan Panaikang (-5.1385, 119.4475)</span>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-slate-500">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-sky-600" />
                <span>Garis Batas Kelurahan</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-sm bg-orange-500" />
                <span>Bank Sampah</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-sm bg-purple-600" />
                <span>Kerja Bakti</span>
              </span>
            </div>
          </div>

          {/* Google Maps Container */}
          <div className="relative h-[500px] sm:h-[560px] w-full">
            <APIProvider apiKey={apiKey}>
              <Map
                defaultCenter={PANAIKANG_CENTER}
                defaultZoom={PANAIKANG_DEFAULT_ZOOM}
                mapId="DEMO_MAP_ID"
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

                {/* Markers: Citizen Reports */}
                {(activeLayer === 'semua' || activeLayer === 'laporan') &&
                  visibleReports.map((rep) => {
                    const pos = resolveCoordinate(rep.coordinatesLabel, rep.mapX, rep.mapY);
                    const isSelected =
                      selectedItem.type === 'laporan' && selectedItem.id === rep.id;
                    const pinBg =
                      rep.status === 'Selesai'
                        ? '#059669' // emerald-600
                        : rep.status === 'Sedang Ditangani'
                        ? '#0284C7' // sky-600
                        : '#F59E0B'; // amber-500

                    return (
                      <AdvancedMarker
                        key={`rep-${rep.id}`}
                        position={pos}
                        onClick={() => handleSelectReport(rep)}
                        title={rep.title}
                      >
                        <div
                          className={`flex items-center gap-1 px-2 py-1 rounded-full text-white border-2 border-white shadow-md cursor-pointer transition-transform ${
                            isSelected ? 'scale-125 ring-4 ring-sky-400' : 'hover:scale-110'
                          }`}
                          style={{ backgroundColor: pinBg }}
                        >
                          <MapPin className="w-3 h-3" />
                          <span className="text-[10px] font-mono-num font-bold">{rep.rw}</span>
                        </div>
                      </AdvancedMarker>
                    );
                  })}

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
                        key={`kb-${ev.id}`}
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

                {/* 4 Cardinal Boundary Markers (Utara, Timur, Selatan, Barat) connected to Profil Kelurahan */}
                {showBoundaryMarkers &&
                  (['utara', 'timur', 'selatan', 'barat'] as const).map((dir) => {
                    const point = BOUNDARY_POINTS[dir];
                    const boundaryText =
                      dir === 'utara'
                        ? batasUtara
                        : dir === 'timur'
                        ? batasTimur
                        : dir === 'selatan'
                        ? batasSelatan
                        : batasBarat;
                    const isSelected =
                      selectedItem.type === 'batas' && selectedBoundaryDir === dir;

                    return (
                      <AdvancedMarker
                        key={`boundary-marker-${dir}`}
                        position={point.pos}
                        onClick={() => handleSelectBoundary(dir)}
                        title={`${point.title}: ${boundaryText}`}
                      >
                        <div
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-white text-[11px] font-bold shadow-lg border-2 border-white cursor-pointer transition-all ${
                            point.color
                          } ${
                            isSelected
                              ? 'scale-125 ring-4 ring-offset-1 ' + point.borderRing
                              : 'hover:scale-110'
                          }`}
                        >
                          <Compass className="w-3.5 h-3.5 text-white/90" />
                          <span className="whitespace-nowrap drop-shadow-xs">
                            Batas {point.directionLabel}: {boundaryText}
                          </span>
                        </div>
                      </AdvancedMarker>
                    );
                  })}

                {/* InfoWindow on Selected Marker */}
                {infoWindowTarget && (
                  <InfoWindow
                    position={infoWindowTarget.position}
                    onCloseClick={() => setInfoWindowTarget(null)}
                  >
                    <div className="p-1 max-w-[240px] text-slate-800">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold text-white ${infoWindowTarget.badgeColor}`}
                        >
                          {infoWindowTarget.badge}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-[#0D3868] line-clamp-2">
                        {infoWindowTarget.title}
                      </h4>
                      <p className="mt-1 text-[11px] text-slate-600">
                        {infoWindowTarget.description}
                      </p>
                    </div>
                  </InfoWindow>
                )}
              </Map>
            </APIProvider>
          </div>
        </div>

        {/* Right: Real-Time Detail Inspector Panel */}
        <div className="lg:col-span-4 space-y-4">
          {selectedItem.type === 'batas' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs">
              <div className="pb-3 border-b border-slate-200">
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-700">
                  <Compass className="w-4 h-4 text-sky-600" />
                  <span>DATA RESMI PROFIL KELURAHAN</span>
                </div>
                <h2 className="mt-1 text-base font-bold text-[#0D3868]">
                  Batas Wilayah Kelurahan Panaikang
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tersinkronisasi langsung dengan ketetapan batas administratif yang diisi oleh Lurah & Administrator.
                </p>
              </div>

              {/* Direction selector list */}
              <div className="space-y-2.5">
                {(['utara', 'timur', 'selatan', 'barat'] as const).map((dir) => {
                  const point = BOUNDARY_POINTS[dir];
                  const boundaryText =
                    dir === 'utara'
                      ? batasUtara
                      : dir === 'timur'
                      ? batasTimur
                      : dir === 'selatan'
                      ? batasSelatan
                      : batasBarat;
                  const isActive = selectedItem.type === 'batas' && selectedBoundaryDir === dir;

                  return (
                    <div
                      key={dir}
                      onClick={() => handleSelectBoundary(dir)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer ${
                        isActive
                          ? 'bg-sky-50 border-sky-400 ring-2 ring-sky-300 shadow-xs'
                          : 'bg-slate-50/70 border-slate-200 hover:bg-sky-50/40 hover:border-sky-300'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="flex items-center gap-2">
                          <span
                            className={`w-2.5 h-2.5 rounded-full ${point.color}`}
                          />
                          <span className="text-slate-900">{point.title}</span>
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700">
                          {point.directionLabel}
                        </span>
                      </div>
                      <div className="mt-1.5 text-xs font-bold text-[#0D3868] pl-4">
                        {boundaryText}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Geographic Overview */}
              <div className="pt-3 border-t border-slate-200 text-xs text-slate-600 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Luas Wilayah:</span>
                  <span className="font-semibold text-slate-800 font-mono-num">
                    {profile?.areaKm2 || '1.74 km²'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Cakupan Administrasi:</span>
                  <span className="font-semibold text-slate-800 font-mono-num">
                    {profile?.totalRw || 7} RW · {profile?.totalRt || 38} RT
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Pusat Pemerintahan:</span>
                  <span className="font-semibold text-slate-800 truncate max-w-[180px]">
                    {profile?.officeAddress || 'Jl. Kesadaran IV No. 1'}
                  </span>
                </div>
              </div>

              {/* Navigation Action Buttons */}
              <div className="flex flex-col gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => onNavigate('profil')}
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition cursor-pointer text-center"
                >
                  Buka Halaman Profil Kelurahan →
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('admin')}
                  className="w-full py-2.5 px-3 rounded-xl bg-[#0D3868] hover:bg-[#072647] text-white text-xs font-bold transition cursor-pointer text-center"
                >
                  Ubah Batas Wilayah di Panel Admin
                </button>
              </div>
            </div>
          )}

          {selectedItem.type === 'kantor' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs">
              <div className="pb-3 border-b border-slate-200">
                <div className="text-xs font-bold text-[#0D3868] flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-[#0D3868]" />
                  <span>PUSAT PEMERINTAHAN</span>
                </div>
                <h2 className="mt-1 text-base font-bold text-[#0D3868]">
                  Kantor Lurah Panaikang
                </h2>
              </div>

              <div className="space-y-2 text-xs text-slate-600">
                <div>
                  <span className="text-slate-500">Alamat: </span>
                  <span className="font-semibold text-slate-800">
                    Jl. Haji Kalla No. 1 / Poros Panaikang, Panakkukang, Makassar
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">Layanan: </span>
                  <span className="font-medium text-slate-800">
                    Senin – Jumat · 08:00 – 16:00 WITA
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">Hotline: </span>
                  <span className="font-mono-num font-semibold text-slate-800">
                    (0411) 452-910 · 0812-4210-9988
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-sky-50 border border-sky-100 text-xs text-sky-900 leading-relaxed">
                Posko Terpadu Smart Environment & Pelayanan Satu Pintu Kelurahan Panaikang. Seluruh data koordinat laporan diverifikasi di posko ini.
              </div>

              <button
                type="button"
                onClick={() => onNavigate('profil')}
                className="w-full py-2.5 px-4 rounded-xl bg-[#0D3868] hover:bg-[#072647] text-white text-xs font-bold transition cursor-pointer"
              >
                Buka Halaman Profil Kelurahan →
              </button>
            </div>
          )}

          {selectedReport && selectedItem.type === 'laporan' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs">
              <div className="pb-3 border-b border-slate-200">
                <div className="text-xs text-slate-500 font-mono-num">
                  TITIK LAPORAN WARGA · {selectedReport.ticketCode}
                </div>
                <h2 className="mt-1 text-base font-bold text-[#0D3868]">
                  {selectedReport.title}
                </h2>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                <span className="font-semibold text-slate-900">
                  {selectedReport.rw} / {selectedReport.rt}
                </span>
                <span aria-hidden="true">·</span>
                <span>{selectedReport.category}</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono-num">{selectedReport.coordinatesLabel}</span>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {selectedReport.description}
              </p>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Status Saat Ini:</span>
                  <span className="font-bold text-slate-900 inline-flex items-center gap-1">
                    {selectedReport.status === 'Selesai' && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    )}
                    {selectedReport.status === 'Sedang Ditangani' && (
                      <Clock className="w-3.5 h-3.5 text-sky-600" />
                    )}
                    {selectedReport.status === 'Menunggu Verifikasi' && (
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                    )}
                    {selectedReport.status}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Lokasi:</span>
                  <span className="font-medium text-slate-800 text-right">
                    {selectedReport.locationName}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Pelapor:</span>
                  <span className="font-medium text-slate-800">{selectedReport.reporterName}</span>
                </div>
              </div>

              <div className="text-xs text-slate-700">
                <span className="font-semibold text-slate-900">Catatan Petugas: </span>
                {selectedReport.responseNote || 'Belum ada catatan respons.'}
              </div>

              {/* Quick Status Action Buttons directly from Map */}
              <div className="pt-3 border-t border-slate-200">
                <div className="text-xs font-semibold text-slate-700 mb-2">
                  Perbarui Status Titik Secara Cepat:
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {(['Menunggu Verifikasi', 'Sedang Ditangani', 'Selesai'] as ReportStatus[]).map(
                    (st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() =>
                          onUpdateReportStatus(
                            selectedReport.id,
                            st,
                            selectedReport.assignedTeam,
                            selectedReport.responseNote
                          )
                        }
                        className={`py-2 px-2 rounded-lg text-[11px] font-semibold border transition-colors cursor-pointer ${
                          selectedReport.status === st
                            ? 'bg-[#00838F] text-white border-[#00838F]'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {st === 'Menunggu Verifikasi' ? 'Verifikasi' : st}
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>
          )}

          {selectedBsu && selectedItem.type === 'bsu' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs">
              <div className="pb-3 border-b border-slate-200">
                <div className="text-xs font-semibold text-amber-700">
                  TITIK BANK SAMPAH UNIT · {selectedBsu.rw}
                </div>
                <h2 className="mt-1 text-base font-bold text-[#0D3868]">
                  {selectedBsu.unitName}
                </h2>
              </div>

              <div className="text-xs text-slate-600 space-y-1.5">
                <div>
                  <span className="text-slate-500">Lokasi: </span>
                  <span className="font-medium text-slate-900">{selectedBsu.locationLabel}</span>
                </div>
                <div>
                  <span className="text-slate-500">Koordinator: </span>
                  <span className="font-medium text-slate-900">{selectedBsu.coordinator}</span>
                </div>
                <div>
                  <span className="text-slate-500">Jadwal Jemput: </span>
                  <span className="font-mono-num font-medium text-slate-900">
                    {selectedBsu.pickupSchedule}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2">
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                  <div className="text-[11px] text-emerald-800">Organik</div>
                  <div className="text-sm font-extrabold text-emerald-950 font-mono-num mt-0.5">
                    {selectedBsu.organikKg} kg
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-sky-50 border border-sky-200 text-center">
                  <div className="text-[11px] text-sky-800">Anorganik</div>
                  <div className="text-sm font-extrabold text-sky-950 font-mono-num mt-0.5">
                    {selectedBsu.anorganikKg} kg
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-center">
                  <div className="text-[11px] text-amber-800">Residu</div>
                  <div className="text-sm font-extrabold text-amber-950 font-mono-num mt-0.5">
                    {selectedBsu.residuKg} kg
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onNavigate('sampah')}
                className="w-full py-2.5 px-4 rounded-xl bg-[#EF6C00] hover:bg-[#E65100] text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Buka Modul Monitoring Sampah →
              </button>
            </div>
          )}

          {selectedCleanup && selectedItem.type === 'kerjabakti' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs">
              <div className="pb-3 border-b border-slate-200">
                <div className="text-xs font-semibold text-purple-700">
                  TITIK KERJA BAKTI · {selectedCleanup.rw}
                </div>
                <h2 className="mt-1 text-base font-bold text-[#0D3868]">
                  {selectedCleanup.title}
                </h2>
              </div>

              <div className="text-xs text-slate-600 space-y-1.5">
                <div>
                  <span className="text-slate-500">Jadwal: </span>
                  <span className="font-semibold text-slate-900">
                    {selectedCleanup.date} · {selectedCleanup.timeRange}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">Titik Kumpul: </span>
                  <span className="font-medium text-slate-900">{selectedCleanup.locationName}</span>
                </div>
                <div>
                  <span className="text-slate-500">Partisipasi Warga: </span>
                  <span className="font-mono-num font-bold text-purple-800">
                    {selectedCleanup.registeredParticipants} / {selectedCleanup.targetParticipants}{' '}
                    Peserta
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                {selectedCleanup.summaryNote}
              </p>

              <button
                type="button"
                onClick={() => onNavigate('kerjabakti')}
                className="w-full py-2.5 px-4 rounded-xl bg-[#5E35B1] hover:bg-[#4527A0] text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Lihat Detail & Daftar Kerja Bakti →
              </button>
            </div>
          )}

          {/* Quick Link to Boundaries when inspecting other items */}
          {selectedItem.type !== 'batas' && (
            <button
              type="button"
              onClick={() => handleSelectBoundary('utara')}
              className="w-full py-2.5 px-3 rounded-xl border border-sky-200 bg-sky-50/80 hover:bg-sky-100 text-sky-900 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs"
            >
              <Compass className="w-3.5 h-3.5 text-sky-700" />
              <span>Lihat Batas Wilayah Kelurahan (4 Arah)</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
