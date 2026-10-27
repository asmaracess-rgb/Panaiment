import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Sprout,
  Users,
  MapPin,
  Calendar,
  Phone,
  Printer,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Sparkles,
  BookOpen,
  Package,
  Layers,
  Leaf,
  Droplets,
  Sun,
  X,
  Share2,
  Send,
  MessageCircle,
  HelpCircle,
  TrendingUp,
} from 'lucide-react';
import {
  AppView,
  KelurahanProfile,
  RwGroup,
  UrbanFarmingSpot,
  FarmType,
  SeedRequestItem,
} from '../types';
import {
  INITIAL_KELURAHAN_PROFILE,
  INITIAL_URBAN_FARMING_SPOTS,
  INITIAL_SEED_REQUESTS,
} from '../data/initialData';
import { buildOfficialKopSuratHtml } from '../utils/officialKopSurat';

interface UrbanFarmingViewProps {
  onNavigate: (view: AppView) => void;
  profile?: KelurahanProfile;
  rwGroups?: RwGroup[];
  spots?: UrbanFarmingSpot[];
  onAddSpot?: (spot: UrbanFarmingSpot) => void;
  seedRequests?: SeedRequestItem[];
  onAddSeedRequest?: (req: SeedRequestItem) => void;
}

const FARM_TYPE_CONFIG: Record<
  FarmType,
  { label: string; badgeBg: string; badgeText: string; icon: typeof Sprout }
> = {
  'Hidroponik / NFT': {
    label: 'Hidroponik / NFT',
    badgeBg: 'bg-emerald-50 border-emerald-200',
    badgeText: 'text-emerald-800',
    icon: Droplets,
  },
  'Akuaponik / Budikdamber': {
    label: 'Akuaponik / Budikdamber',
    badgeBg: 'bg-sky-50 border-sky-200',
    badgeText: 'text-sky-800',
    icon: Layers,
  },
  'Pekarangan & Polybag Organik': {
    label: 'Pekarangan & Polybag Organik',
    badgeBg: 'bg-amber-50 border-amber-200',
    badgeText: 'text-amber-800',
    icon: Leaf,
  },
  'Rumah Jamur & TOGA': {
    label: 'Rumah Jamur & TOGA',
    badgeBg: 'bg-purple-50 border-purple-200',
    badgeText: 'text-purple-800',
    icon: Sprout,
  },
};

const SEED_CATALOG = [
  {
    name: 'Benih Pakcoy Nauli F1 (Hidroponik / Tanah)',
    type: 'Sayuran Daun Hijau',
    estHarvestDays: '25 – 30 Hari',
    stockStatus: 'Tersedia Gratis',
    desc: 'Sayuran favorit lorong, renyah, cepat panen, dan cocok untuk instalasi pipa hidroponik maupun pot polybag.',
  },
  {
    name: 'Benih Selada Keriting Hijau (Grand Rapids)',
    type: 'Sayuran Salad / Lalapan',
    estHarvestDays: '35 – 40 Hari',
    stockStatus: 'Tersedia Gratis',
    desc: 'Memiliki nilai ekonomi tinggi untuk suplai kafe & konsumsi keluarga sehat di Kelurahan Panaikang.',
  },
  {
    name: 'Benih Cabai Rawit Khas Katokkon Toraja-Makassar',
    type: 'Bumbu Pedas Unggulan',
    estHarvestDays: '75 – 85 Hari',
    stockStatus: 'Tersedia Gratis',
    desc: 'Aroma khas dan tingkat kepedasan tinggi, cocok dibudidayakan dalam polybag pekarangan lorong.',
  },
  {
    name: 'Benih Kangkung Daun Sempit (Rajawali)',
    type: 'Sayuran Cepat Panen',
    estHarvestDays: '20 – 25 Hari',
    stockStatus: 'Tersedia Gratis',
    desc: 'Bisa dipadukan dengan ember ikan (Budikdamber) atau pot tanah dengan perawatan sangat mudah.',
  },
  {
    name: 'Bibit Rimpang TOGA (Kunyit, Jahe Merah, Temulawak)',
    type: 'Tanaman Obat Keluarga',
    estHarvestDays: '4 – 6 Bulan',
    stockStatus: 'Tersedia Terbatas',
    desc: 'Bahan herbal alami untuk menjaga kebugaran warga, imun tubuh, dan apotek hidup lingkungan.',
  },
  {
    name: 'Paket Polybag Tebal 30cm & Kompos BSU Panaikang',
    type: 'Media Tanam Daur Ulang',
    estHarvestDays: 'Siap Pakai',
    stockStatus: 'Tersedia (Sinergi BSU)',
    desc: 'Dihasilkan dari olahan sampah organik Bank Sampah Unit Kelurahan Panaikang, ramah lingkungan.',
  },
];

export const UrbanFarmingView: React.FC<UrbanFarmingViewProps> = ({
  onNavigate,
  profile = INITIAL_KELURAHAN_PROFILE,
  rwGroups = [],
  spots = [],
  onAddSpot,
  seedRequests = [],
  onAddSeedRequest,
}) => {
  const [activeTab, setActiveTab] = useState<'kebun' | 'panen' | 'edukasi' | 'bibit'>('kebun');
  const [selectedRwFilter, setSelectedRwFilter] = useState<string>('Semua');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSpotModal, setSelectedSpotModal] = useState<UrbanFarmingSpot | null>(null);

  // Form State: Permohonan Bibit Gratis
  const [showSeedFormModal, setShowSeedFormModal] = useState<boolean>(false);
  const [applicantName, setApplicantName] = useState<string>('');
  const [applicantPhone, setApplicantPhone] = useState<string>('');
  const [applicantRw, setApplicantRw] = useState<string>('RW 01');
  const [applicantRt, setApplicantRt] = useState<string>('RT 01');
  const [applicantAddress, setApplicantAddress] = useState<string>('');
  const [selectedSeeds, setSelectedSeeds] = useState<string[]>(['Benih Pakcoy Nauli F1 (Hidroponik / Tanah)']);
  const [plantingMethod, setPlantingMethod] = useState<string>('Hidroponik Botol / Pipa');
  const [needsTraining, setNeedsTraining] = useState<boolean>(true);
  const [formSuccessMessage, setFormSuccessMessage] = useState<string>('');

  // Form State: Tambah Titik Kebun Baru
  const [showAddSpotModal, setShowAddSpotModal] = useState<boolean>(false);
  const [newSpotName, setNewSpotName] = useState<string>('');
  const [newSpotRw, setNewSpotRw] = useState<string>('RW 01');
  const [newSpotRt, setNewSpotRt] = useState<string>('RT 01');
  const [newSpotAddress, setNewSpotAddress] = useState<string>('');
  const [newGroupName, setNewGroupName] = useState<string>('');
  const [newCoordName, setNewCoordName] = useState<string>('');
  const [newCoordPhone, setNewCoordPhone] = useState<string>('');
  const [newFarmType, setNewFarmType] = useState<FarmType>('Hidroponik / NFT');
  const [newCommodities, setNewCommodities] = useState<string>('Pakcoy, Selada, Seledri');
  const [newProductionKg, setNewProductionKg] = useState<number>(50);
  const [newMembers, setNewMembers] = useState<number>(15);
  const [newHarvestDate, setNewHarvestDate] = useState<string>('15 Nov 2026');
  const [newStatus, setNewStatus] = useState<'Aktif Produktif' | 'Masa Tanam' | 'Siap Panen'>('Masa Tanam');
  const [newDescription, setNewDescription] = useState<string>('');

  // Filtered Spots
  const filteredSpots = useMemo(() => {
    return spots.filter((spot) => {
      const matchRw = selectedRwFilter === 'Semua' || spot.rw === selectedRwFilter;
      const matchType = selectedTypeFilter === 'Semua' || spot.farmingType === selectedTypeFilter;
      const q = searchQuery.trim().toLowerCase();
      const matchQuery =
        !q ||
        spot.name.toLowerCase().includes(q) ||
        spot.groupName.toLowerCase().includes(q) ||
        spot.locationAddress.toLowerCase().includes(q) ||
        spot.commodities.some((c) => c.toLowerCase().includes(q));
      return matchRw && matchType && matchQuery;
    });
  }, [spots, selectedRwFilter, selectedTypeFilter, searchQuery]);

  // Aggregate Metrics
  const totalProductionKg = useMemo(() => {
    return spots.reduce((acc, s) => acc + (s.monthlyProductionKg || 0), 0);
  }, [spots]);

  const totalMembersCount = useMemo(() => {
    return spots.reduce((acc, s) => acc + (s.activeMembers || 0), 0);
  }, [spots]);

  const readyToHarvestCount = useMemo(() => {
    return spots.filter((s) => s.status === 'Siap Panen').length;
  }, [spots]);

  // Handle Submit Permohonan Bibit
  const handleSubmitSeedRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!applicantName.trim() || !applicantPhone.trim() || !applicantAddress.trim()) {
      alert('Mohon lengkapi Nama Pemohon, Nomor Telepon, dan Alamat Anda.');
      return;
    }
    const newReq: SeedRequestItem = {
      id: `REQ-SEED-${Date.now().toString().slice(-4)}`,
      applicantName: applicantName.trim(),
      applicantPhone: applicantPhone.trim(),
      rw: applicantRw,
      rt: applicantRt,
      address: applicantAddress.trim(),
      requestedSeeds: selectedSeeds.length > 0 ? selectedSeeds : ['Benih Pakcoy Nauli F1'],
      plantingMethod,
      needsTraining,
      status: 'Menunggu Pengambilan',
      createdAt: `${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })} · Baru Saja`,
    };

    if (onAddSeedRequest) {
      onAddSeedRequest(newReq);
    }
    setFormSuccessMessage(`Permohonan bibit atas nama ${applicantName} berhasil diajukan dengan ID: ${newReq.id}.`);
    setApplicantName('');
    setApplicantPhone('');
    setApplicantAddress('');
    window.setTimeout(() => {
      setShowSeedFormModal(false);
      setFormSuccessMessage('');
    }, 2000);
  };

  // Handle Submit Tambah Kebun Baru
  const handleCreateNewSpot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSpotName.trim() || !newSpotAddress.trim() || !newCoordName.trim()) {
      alert('Mohon lengkapi Nama Kebun, Alamat Lokasi, dan Nama Koordinator.');
      return;
    }
    const createdSpot: UrbanFarmingSpot = {
      id: `uf-${Date.now()}`,
      name: newSpotName.trim(),
      rw: newSpotRw,
      rt: newSpotRt,
      locationAddress: newSpotAddress.trim(),
      groupName: newGroupName.trim() || `Kelompok Tani ${newSpotRw}`,
      coordinatorName: newCoordName.trim(),
      coordinatorPhone: newCoordPhone.trim() || '0812-xxxx-xxxx',
      farmingType: newFarmType,
      commodities: newCommodities.split(',').map((c) => c.trim()).filter(Boolean),
      activeMembers: Number(newMembers) || 10,
      monthlyProductionKg: Number(newProductionKg) || 40,
      nextHarvestDate: newHarvestDate || '25 Nov 2026',
      harvestEstimatedKg: Math.round((Number(newProductionKg) || 40) * 0.4),
      status: newStatus,
      description: newDescription.trim() || 'Kebun lorong binaan ketahanan pangan Kelurahan Panaikang.',
      photoUrl: '/images/ig_post_5_DeGDDkFPvJs.jpg',
    };

    if (onAddSpot) {
      onAddSpot(createdSpot);
    }
    setShowAddSpotModal(false);
    setNewSpotName('');
    setNewSpotAddress('');
    setNewCoordName('');
    setNewCoordPhone('');
    setNewDescription('');
  };

  // Print Official Urban Farming Report with Official Kop Surat
  const handlePrintUrbanFarmingReport = () => {
    const kopHtml = buildOfficialKopSuratHtml(profile, 'standard');
    const nowStr = new Date().toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });

    const rowsHtml = spots
      .map(
        (spot, idx) => `
      <tr>
        <td style="text-align:center">${idx + 1}</td>
        <td><strong>${spot.name}</strong><br/><span style="color:#64748b;font-size:9px;">${spot.rw} / ${spot.rt} — ${spot.locationAddress}</span></td>
        <td><strong>${spot.groupName}</strong><br/><span style="color:#64748b;font-size:9px;">Koord: ${spot.coordinatorName} (${spot.coordinatorPhone})</span></td>
        <td><strong>${spot.farmingType}</strong><br/><span style="color:#059669;font-size:9px;">${spot.commodities.join(', ')}</span></td>
        <td style="text-align:center"><strong>${spot.monthlyProductionKg} kg</strong>/bln</td>
        <td style="text-align:center"><span style="font-weight:bold;color:#0d3868;">${spot.nextHarvestDate}</span><br/><span style="font-size:9px;color:#16a34a;">${spot.status}</span></td>
      </tr>`
      )
      .join('');

    const htmlDoc = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <title>Laporan Program Ketahanan Pangan & Urban Farming Kelurahan Panaikang</title>
  <style>
    @page { size: A4 portrait; margin: 14mm; }
    * { box-sizing: border-box; }
    body { font-family: Arial, Helvetica, sans-serif; color: #1e293b; margin: 0; font-size: 10.5px; line-height: 1.45; }
    .doc-title { text-align: center; font-size: 13.5px; font-weight: 800; color: #0d3868; text-decoration: underline; text-transform: uppercase; margin-bottom: 2px; }
    .doc-meta { text-align: center; font-size: 10px; color: #475569; margin-bottom: 14px; }
    .summary-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 10px 14px; margin-bottom: 14px; display: flex; justify-content: space-between; font-size: 10px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 14px; }
    th { background: #059669; color: #fff; border: 1px solid #059669; padding: 6px; font-size: 10px; text-align: left; }
    td { border: 1px solid #cbd5e1; padding: 6px; font-size: 9.5px; vertical-align: top; }
    .sign-row { display: flex; justify-content: space-between; margin-top: 24px; page-break-inside: avoid; }
    .sign-box { text-align: center; width: 220px; }
    .sign-space { height: 55px; }
  </style>
</head>
<body>
  ${kopHtml}
  <div class="doc-title">LAPORAN DATA KETAHANAN PANGAN & URBAN FARMING KELURAHAN PANAIKANG</div>
  <div class="doc-meta">Nomor Registrasi: <strong>521 / 088 / PNK-UF / X / 2026</strong> &nbsp;|&nbsp; Tanggal Cetak: ${nowStr}</div>

  <div class="summary-box">
    <div>Total Titik Kebun: <strong>${spots.length} Titik Binaan RW 01 – RW 07</strong></div>
    <div>Total Produksi: <strong>${totalProductionKg} kg / bulan</strong></div>
    <div>Warga & KWT Aktif: <strong>${totalMembersCount} Kepala Keluarga</strong></div>
    <div>Kebun Siap Panen: <strong>${readyToHarvestCount} Titik Lokasi</strong></div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width:28px">No</th>
        <th style="width:145px">Nama Kebun & Alamat</th>
        <th style="width:130px">Kelompok Tani / KWT</th>
        <th>Metode & Komoditas Pangan</th>
        <th style="width:75px;text-align:center">Produksi</th>
        <th style="width:90px;text-align:center">Panen / Status</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml}
    </tbody>
  </table>

  <div class="sign-row">
    <div class="sign-box">
      <div>Mengetahui,</div>
      <div style="font-weight:700;margin-top:2px;">KOORDINATOR URBAN FARMING</div>
      <div class="sign-space"></div>
      <div style="font-weight:800;text-decoration:underline;color:#0d3868;">Hj. Rahmawati Dg. Ngasseng, S.Sos</div>
      <div style="font-size:9.5px;color:#475569;">Penyuluh Pertanian Perkotaan</div>
    </div>
    <div class="sign-box">
      <div>Makassar, ${nowStr}</div>
      <div style="font-weight:700;margin-top:2px;">LURAH PANAIKANG</div>
      <div class="sign-space"></div>
      <div style="font-weight:800;text-decoration:underline;color:#0d3868;">${profile.lurahName}</div>
      <div style="font-size:9.5px;color:#475569;">NIP. ${profile.lurahNip}</div>
    </div>
  </div>
</body>
</html>`;

    const existingFrame = document.getElementById('urban-farming-print-iframe') as HTMLIFrameElement | null;
    if (existingFrame) existingFrame.remove();
    const iframe = document.createElement('iframe');
    iframe.id = 'urban-farming-print-iframe';
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);
    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(htmlDoc);
      doc.close();
      window.setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      }, 250);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* ================= TOP NAVIGATION & HERO BANNER ================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => onNavigate('beranda')}
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-[#0D3868] hover:text-[#0277BD] transition-colors cursor-pointer self-start"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Portal Utama</span>
        </button>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handlePrintUrbanFarmingReport}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-emerald-700" />
            <span>Cetak Laporan Ketahanan Pangan</span>
          </button>

          <button
            type="button"
            onClick={() => setShowSeedFormModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#059669] hover:bg-[#047857] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Sprout className="w-3.5 h-3.5" />
            <span>Ajukan Bibit Gratis</span>
          </button>
        </div>
      </div>

      {/* Hero Welcome Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#065F46] via-[#047857] to-[#0D3868] text-white p-6 sm:p-8 shadow-sm">
        <div className="relative z-10 max-w-3xl space-y-2.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-xs font-extrabold text-emerald-200">
            <Sprout className="w-3.5 h-3.5" />
            <span>PROGRAM KETAHANAN PANGAN URBAN FARMING · KELURAHAN PANAIKANG</span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
            Urban Farming Kelurahan Panaikang
          </h1>

          <p className="text-xs sm:text-sm text-emerald-50 leading-relaxed max-w-2xl">
            Inisiatif pemanfaatan pekarangan sempit, instalasi hidroponik perkotaan, dan budidaya tanaman
            pangan keluarga di 7 wilayah RW Kelurahan Panaikang. Terintegrasi dengan pupuk kompos Bank
            Sampah Unit (BSU) untuk mewujudkan kelurahan hijau, mandiri, dan berdaya saing.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3 text-xs font-semibold text-emerald-100">
            <span className="inline-flex items-center gap-1 bg-white/10 px-3 py-1 rounded-lg">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
              <span>7 Wilayah RW Aktif Bertani</span>
            </span>
            <span className="inline-flex items-center gap-1 bg-white/10 px-3 py-1 rounded-lg">
              <Droplets className="w-3.5 h-3.5 text-sky-300" />
              <span>Sistem Hidroponik & Akuaponik</span>
            </span>
            <span className="inline-flex items-center gap-1 bg-white/10 px-3 py-1 rounded-lg">
              <Leaf className="w-3.5 h-3.5 text-amber-300" />
              <span>Kompos Organik Daur Ulang BSU</span>
            </span>
          </div>
        </div>

        {/* Decorative Leaf Background Pattern */}
        <div className="absolute right-4 -bottom-8 pointer-events-none opacity-15 hidden sm:block">
          <Sprout className="w-72 h-72 text-white" />
        </div>
      </div>

      {/* ================= 4 KEY METRIC CARDS ================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Titik Kebun Binaan RW</span>
            <MapPin className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-[#0D3868] font-mono-num">
            {spots.length} <span className="text-sm font-bold text-slate-500">Titik Kebun</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Tersebar di seluruh <strong>RW 01 – RW 07</strong>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Hasil Panen Bulanan</span>
            <TrendingUp className="w-4 h-4 text-[#059669]" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-[#059669] font-mono-num">
            {totalProductionKg} <span className="text-sm font-bold text-slate-500">kg / bln</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Sayuran segar, jamur tiram & ikan lele
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Warga & KWT Terlibat</span>
            <Users className="w-4 h-4 text-[#0277BD]" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-[#0277BD] font-mono-num">
            {totalMembersCount} <span className="text-sm font-bold text-slate-500">KK Aktif</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Kelompok Wanita Tani & Komunitas Tani
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Kebun Siap Panen Raya</span>
            <Calendar className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-amber-600 font-mono-num">
            {readyToHarvestCount} <span className="text-sm font-bold text-slate-500">Lokasi</span>
          </div>
          <div className="mt-1 text-[11px] text-emerald-700 font-semibold">
            Panen raya terdekat: <strong>20 – 24 Okt 2026</strong>
          </div>
        </div>
      </div>

      {/* ================= TAB NAVIGATION ================= */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setActiveTab('kebun')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'kebun'
              ? 'bg-[#059669] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Sprout className="w-4 h-4" />
          <span>Daftar Kebun ({spots.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('panen')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'panen'
              ? 'bg-[#059669] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Jadwal Panen Raya</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('edukasi')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'edukasi'
              ? 'bg-[#059669] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Panduan Lahan Sempit</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('bibit')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'bibit'
              ? 'bg-[#059669] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Katalog Bibit Gratis ({SEED_CATALOG.length})</span>
        </button>
      </div>

      {/* ================= TAB 1: DAFTAR KEBUN LORONG ================= */}
      {activeTab === 'kebun' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 space-y-3.5 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari nama kebun, komoditas sayur (Pakcoy, Selada, dsb), atau jalan..."
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:border-[#059669] focus:outline-none"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Filter RW */}
                <select
                  value={selectedRwFilter}
                  onChange={(e) => setSelectedRwFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 text-xs font-bold text-[#0D3868] focus:border-[#059669] focus:outline-none"
                >
                  <option value="Semua">Semua Wilayah RW</option>
                  <option value="RW 01">RW 01 (Aspol Tello Baru)</option>
                  <option value="RW 02">RW 02 (Bilawaiyah)</option>
                  <option value="RW 03">RW 03 (Flamboyan)</option>
                  <option value="RW 04">RW 04 (Sukaria)</option>
                  <option value="RW 05">RW 05 (Urip Sumoharjo)</option>
                  <option value="RW 06">RW 06 (KM 5)</option>
                  <option value="RW 07">RW 07 (Kesadaran)</option>
                </select>

                {/* Filter Metode */}
                <select
                  value={selectedTypeFilter}
                  onChange={(e) => setSelectedTypeFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 text-xs font-bold text-slate-700 focus:border-[#059669] focus:outline-none"
                >
                  <option value="Semua">Semua Metode Bertani</option>
                  <option value="Hidroponik / NFT">Hidroponik / NFT</option>
                  <option value="Akuaponik / Budikdamber">Akuaponik / Budikdamber</option>
                  <option value="Pekarangan & Polybag Organik">Pekarangan & Polybag Organik</option>
                  <option value="Rumah Jamur & TOGA">Rumah Jamur & TOGA</option>
                </select>

                <button
                  type="button"
                  onClick={() => setShowAddSpotModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold border border-slate-200 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Daftarkan Kebun Baru</span>
                </button>
              </div>
            </div>

            {/* Quick Summary of Active Filter */}
            <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
              <div>
                Menampilkan <strong>{filteredSpots.length}</strong> dari {spots.length} titik kebun urban farming
              </div>
              {(selectedRwFilter !== 'Semua' || selectedTypeFilter !== 'Semua' || searchQuery) && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedRwFilter('Semua');
                    setSelectedTypeFilter('Semua');
                    setSearchQuery('');
                  }}
                  className="text-emerald-700 font-bold hover:underline cursor-pointer"
                >
                  Reset Filter
                </button>
              )}
            </div>
          </div>

          {/* Grid of Urban Farming Spots */}
          {filteredSpots.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center space-y-2">
              <Sprout className="w-10 h-10 text-slate-300 mx-auto" />
              <div className="text-base font-bold text-slate-700">Tidak ada kebun yang sesuai filter</div>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Coba sesuaikan pilihan RW, metode bertani, atau kata kunci pencarian Anda.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSpots.map((spot) => {
                const typeInfo = FARM_TYPE_CONFIG[spot.farmingType] || FARM_TYPE_CONFIG['Hidroponik / NFT'];
                const TypeIcon = typeInfo.icon;

                return (
                  <div
                    key={spot.id}
                    className="bg-white rounded-2xl border border-slate-200/90 hover:border-emerald-300 hover:shadow-md transition-all overflow-hidden flex flex-col justify-between"
                  >
                    <div>
                      {/* Photo Header */}
                      <div className="relative h-44 w-full bg-slate-100 overflow-hidden">
                        <img
                          src={spot.photoUrl}
                          alt={spot.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/images/ig_post_5_DeGDDkFPvJs.jpg';
                          }}
                        />
                        <div className="absolute top-3 left-3 flex items-center gap-1.5">
                          <span className="px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-xs text-white text-xs font-bold font-mono-num">
                            {spot.rw} · {spot.rt}
                          </span>
                          <span
                            className={`px-2.5 py-1 rounded-lg text-xs font-extrabold ${
                              spot.status === 'Siap Panen'
                                ? 'bg-emerald-600 text-white'
                                : spot.status === 'Masa Tanam'
                                ? 'bg-amber-500 text-white'
                                : 'bg-sky-600 text-white'
                            }`}
                          >
                            {spot.status}
                          </span>
                        </div>

                        <div className="absolute bottom-2 right-2">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold border backdrop-blur-md bg-white/90 ${typeInfo.badgeText}`}>
                            <TypeIcon className="w-3 h-3" />
                            <span>{typeInfo.label}</span>
                          </span>
                        </div>
                      </div>

                      {/* Content Body */}
                      <div className="p-4 space-y-2.5">
                        <div>
                          <h3 className="text-sm font-extrabold text-[#0D3868] line-clamp-1">
                            {spot.name}
                          </h3>
                          <div className="text-xs text-slate-500 font-semibold mt-0.5 line-clamp-1">
                            {spot.groupName}
                          </div>
                        </div>

                        <div className="text-xs text-slate-600 flex items-start gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
                          <span className="line-clamp-2">{spot.locationAddress}</span>
                        </div>

                        {/* Commodities Tags */}
                        <div className="flex flex-wrap gap-1 pt-1">
                          {spot.commodities.map((item) => (
                            <span
                              key={item}
                              className="px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-bold"
                            >
                              {item}
                            </span>
                          ))}
                        </div>

                        {/* Production Stats */}
                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 grid grid-cols-2 gap-2 text-center text-xs">
                          <div>
                            <div className="text-[10px] text-slate-500 font-semibold">Produksi Bulanan</div>
                            <div className="font-extrabold text-[#059669] font-mono-num mt-0.5">
                              {spot.monthlyProductionKg} kg
                            </div>
                          </div>
                          <div>
                            <div className="text-[10px] text-slate-500 font-semibold">Panen Berikutnya</div>
                            <div className="font-extrabold text-[#0D3868] font-mono-num mt-0.5">
                              {spot.nextHarvestDate}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-4 pt-0 border-t border-slate-100 flex items-center justify-between gap-2 mt-2">
                      <div className="text-[11px] text-slate-500">
                        Koord: <strong>{spot.coordinatorName}</strong>
                      </div>

                      <button
                        type="button"
                        onClick={() => setSelectedSpotModal(spot)}
                        className="px-3 py-1.5 rounded-lg bg-[#059669] hover:bg-[#047857] text-white text-xs font-bold transition-colors cursor-pointer"
                      >
                        Detail & Panen
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 2: JADWAL PANEN RAYA ================= */}
      {activeTab === 'panen' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 space-y-6 shadow-xs">
          <div className="max-w-2xl">
            <h2 className="text-lg sm:text-xl font-extrabold text-[#0D3868] flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#059669]" />
              <span>Kalender Panen Raya Bersama Lorong Panaikang (Oktober – November 2026)</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Jadwal pemetikan hasil sayuran segar, ikan budikdamber, dan jamur tiram warga. Sebagian hasil panen
              dibagikan untuk program gizi keluarga dan sebagian dijual di pasar murah lorong.
            </p>
          </div>

          <div className="space-y-3.5">
            {spots.map((spot, idx) => (
              <div
                key={spot.id}
                className="p-4 sm:p-5 rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-white hover:border-emerald-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 border border-emerald-200 text-emerald-800 flex flex-col items-center justify-center font-mono-num font-extrabold shrink-0">
                    <span className="text-[10px] uppercase text-emerald-600">Okt</span>
                    <span className="text-sm leading-none">{spot.nextHarvestDate.slice(0, 2)}</span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-extrabold text-[#0D3868] text-sm sm:text-base">
                        {spot.name}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                        {spot.rw} · {spot.rt}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-slate-200 text-slate-700 text-[10px] font-semibold">
                        {spot.farmingType}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600">
                      Komoditas Panen:{' '}
                      <strong className="text-emerald-900">{spot.commodities.join(', ')}</strong>
                    </div>

                    <div className="text-[11px] text-slate-500">
                      Lokasi: {spot.locationAddress} · Koordinator: {spot.coordinatorName} ({spot.coordinatorPhone})
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                  <div className="text-right">
                    <div className="text-[10px] text-slate-500 font-semibold">Estimasi Berat</div>
                    <div className="text-sm font-extrabold text-[#059669] font-mono-num">
                      ~{spot.harvestEstimatedKg} kg
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedSpotModal(spot)}
                    className="px-3.5 py-2 rounded-xl bg-[#0D3868] hover:bg-[#0277BD] text-white text-xs font-bold transition-colors cursor-pointer"
                  >
                    Ikuti Panen
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= TAB 3: PANDUAN EDUKASI LAHAN SEMPIT ================= */}
      {activeTab === 'edukasi' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Droplets className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-extrabold text-[#0D3868]">
                1. Hidroponik Sistem Wick & NFT Lahan Sempit
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Memanfaatkan botol air mineral bekas atau pipa PVC yang ditempel pada dinding lorong.
                Tidak memerlukan tanah, menggunakan larutan nutrisi AB Mix dengan pergantian air berkala.
              </p>
              <div className="text-[11px] text-emerald-700 font-bold">
                Cocok untuk: Pakcoy, Selada, Seledri, Bayam
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-extrabold text-[#0D3868]">
                2. Budikdamber (Ikan Lele & Kangkung)
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Budidaya ikan dalam ember 80 liter yang di atasnya diberi gelas plastik berpori berisi
                bibit kangkung. Kotoran ikan diuraikan bakteri menjadi pupuk alami bagi sayuran di atasnya.
              </p>
              <div className="text-[11px] text-sky-700 font-bold">
                Cocok untuk: Ikan Lele, Nila, Kangkung Air
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                <Leaf className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-extrabold text-[#0D3868]">
                3. Kompos Organik dari Bank Sampah Unit
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Mengolah sisa sayuran dan daun kering dari pemukiman warga menjadi pupuk kascing/kompos
                organik berkualitas tinggi tanpa bahan kimia sintetis.
              </p>
              <div className="text-[11px] text-amber-700 font-bold">
                Tersedia di: Seluruh BSU RW 01 – RW 07
              </div>
            </div>
          </div>

          {/* Sinergi Bank Sampah & Ketahanan Pangan Banner */}
          <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-sky-50 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="text-xs font-extrabold text-emerald-800 uppercase tracking-wider">
                Sirkular Ekonomi & Sinergi Bank Sampah Kelurahan Panaikang
              </div>
              <h4 className="text-base font-extrabold text-[#0D3868]">
                Sampah Organik Rumah Tangga Menjadi Pangan Segar Bergizi
              </h4>
              <p className="text-xs text-slate-600 max-w-xl">
                Warga menyetorkan sampah organik ke Bank Sampah Unit terdekat, diolah menjadi pupuk kompos,
                dan digunakan untuk menyuburkan tanaman sayur lorong di RW masing-masing.
              </p>
            </div>

            <button
              type="button"
              onClick={() => onNavigate('sampah')}
              className="self-start sm:self-center px-4 py-2.5 rounded-xl bg-[#0D3868] hover:bg-[#072647] text-white text-xs font-bold transition-colors cursor-pointer whitespace-nowrap"
            >
              Lihat Bank Sampah Unit →
            </button>
          </div>
        </div>
      )}

      {/* ================= TAB 4: KATALOG BIBIT & PERMOHONAN ================= */}
      {activeTab === 'bibit' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 space-y-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg sm:text-xl font-extrabold text-[#0D3868]">
                  Katalog Bibit Pangan & Bantuan Saprodi Kelurahan Panaikang
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                  Disediakan secara gratis untuk kelompok warga, pengurus RT/RW, dan rumah tangga pemula di Kelurahan Panaikang.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowSeedFormModal(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#059669] hover:bg-[#047857] text-white text-xs font-bold cursor-pointer self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Ajukan Paket Bibit Sekarang</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {SEED_CATALOG.map((seed) => (
                <div
                  key={seed.name}
                  className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-white hover:border-emerald-300 transition-all space-y-2 flex flex-col justify-between"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[#059669]">{seed.type}</span>
                      <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                        {seed.stockStatus}
                      </span>
                    </div>

                    <h4 className="text-sm font-extrabold text-[#0D3868]">{seed.name}</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">{seed.desc}</p>
                  </div>

                  <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500">
                    <span>Masa Panen: <strong>{seed.estHarvestDays}</strong></span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedSeeds([seed.name]);
                        setShowSeedFormModal(true);
                      }}
                      className="text-xs font-bold text-[#059669] hover:underline cursor-pointer"
                    >
                      Pilih Bibit Ini →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Seed Requests Table */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs">
            <h3 className="text-base font-extrabold text-[#0D3868] flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#059669]" />
              <span>Daftar Permohonan Bibit Warga Terverifikasi</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                    <th className="py-2.5 px-3">No. Tiket</th>
                    <th className="py-2.5 px-3">Nama Pemohon</th>
                    <th className="py-2.5 px-3">Wilayah</th>
                    <th className="py-2.5 px-3">Bibit yang Diminta</th>
                    <th className="py-2.5 px-3">Metode Tanam</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {seedRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-mono-num font-bold text-[#0D3868]">{req.id}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">{req.applicantName}</td>
                      <td className="py-2.5 px-3">{req.rw} / {req.rt}</td>
                      <td className="py-2.5 px-3 font-medium text-emerald-800">{req.requestedSeeds.join(', ')}</td>
                      <td className="py-2.5 px-3 text-slate-600">{req.plantingMethod}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                          {req.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL DETAIL KEBUN ================= */}
      {selectedSpotModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/80 flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setSelectedSpotModal(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 border border-slate-200 shadow-2xl space-y-4 my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-xs font-bold text-emerald-700 font-mono-num">
                  {selectedSpotModal.rw} · {selectedSpotModal.rt}
                </span>
                <h3 className="text-lg font-extrabold text-[#0D3868]">
                  {selectedSpotModal.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSpotModal(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="h-52 w-full rounded-2xl overflow-hidden bg-slate-100">
              <img
                src={selectedSpotModal.photoUrl}
                alt={selectedSpotModal.name}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <div className="text-slate-500 font-semibold">Kelompok Pengelola:</div>
                  <div className="font-bold text-slate-900">{selectedSpotModal.groupName}</div>
                </div>
                <div>
                  <div className="text-slate-500 font-semibold">Metode Bertani:</div>
                  <div className="font-bold text-emerald-800">{selectedSpotModal.farmingType}</div>
                </div>
                <div>
                  <div className="text-slate-500 font-semibold">Koordinator:</div>
                  <div className="font-bold text-slate-900">{selectedSpotModal.coordinatorName}</div>
                </div>
                <div>
                  <div className="text-slate-500 font-semibold">Panen Terdekat:</div>
                  <div className="font-bold text-[#0D3868]">{selectedSpotModal.nextHarvestDate} (~{selectedSpotModal.harvestEstimatedKg} kg)</div>
                </div>
              </div>

              <div>
                <div className="font-bold text-slate-700 mb-1">Komoditas yang Dibudidayakan:</div>
                <div className="flex flex-wrap gap-1.5">
                  {selectedSpotModal.commodities.map((c) => (
                    <span key={c} className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 font-bold">
                      {c}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <div className="font-bold text-slate-700 mb-0.5">Deskripsi & Profil Kebun:</div>
                <p className="text-slate-600 leading-relaxed">{selectedSpotModal.description}</p>
              </div>

              <div>
                <div className="font-bold text-slate-700 mb-0.5">Alamat Lokasi:</div>
                <p className="text-slate-600">{selectedSpotModal.locationAddress}</p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
              <a
                href={`https://wa.me/${selectedSpotModal.coordinatorPhone.replace(/[^0-9]/g, '')}?text=Halo%20${encodeURIComponent(selectedSpotModal.coordinatorName)},%20saya%20warga%20Panaikang%20ingin%20bertanya%20tentang%20hasil%20panen%20kebun%20${encodeURIComponent(selectedSpotModal.name)}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#128C7E] hover:bg-[#075E54] text-white text-xs font-bold transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Hubungi Pengurus Kebun</span>
              </a>

              <button
                type="button"
                onClick={() => setSelectedSpotModal(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL PENGAJUAN BIBIT ================= */}
      {showSeedFormModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/80 flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setShowSeedFormModal(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 border border-slate-200 shadow-2xl space-y-4 my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-xs font-extrabold text-emerald-700 uppercase">Layanan Warga</span>
                <h3 className="text-base sm:text-lg font-extrabold text-[#0D3868]">
                  Formulir Permohonan Bibit Sayuran & Kompos Gratis
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSeedFormModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formSuccessMessage ? (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <div>{formSuccessMessage}</div>
                <div className="text-[11px] font-normal text-slate-600">
                  Paket bibit dapat diambil di Kantor Kelurahan Panaikang pada jam kerja loket pelayanan.
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmitSeedRequest} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nama Lengkap Pemohon *</label>
                  <input
                    type="text"
                    required
                    value={applicantName}
                    onChange={(e) => setApplicantName(e.target.value)}
                    placeholder="Contoh: Ibu Nurhayati Daeng Kebo"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 focus:border-[#059669] focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Nomor WhatsApp / HP *</label>
                    <input
                      type="text"
                      required
                      value={applicantPhone}
                      onChange={(e) => setApplicantPhone(e.target.value)}
                      placeholder="0812-xxxx-xxxx"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 focus:border-[#059669] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Wilayah RW *</label>
                    <select
                      value={applicantRw}
                      onChange={(e) => setApplicantRw(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-bold text-[#0D3868] focus:border-[#059669] focus:outline-none"
                    >
                      <option value="RW 01">RW 01</option>
                      <option value="RW 02">RW 02</option>
                      <option value="RW 03">RW 03</option>
                      <option value="RW 04">RW 04</option>
                      <option value="RW 05">RW 05</option>
                      <option value="RW 06">RW 06</option>
                      <option value="RW 07">RW 07</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Alamat Rumah / Lokasi Rencana Tanam *</label>
                  <input
                    type="text"
                    required
                    value={applicantAddress}
                    onChange={(e) => setApplicantAddress(e.target.value)}
                    placeholder="Nama jalan, nomor rumah, atau lorong..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 focus:border-[#059669] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Rencana Metode Bertani</label>
                  <select
                    value={plantingMethod}
                    onChange={(e) => setPlantingMethod(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 focus:border-[#059669] focus:outline-none"
                  >
                    <option value="Pekarangan Rumah / Polybag">Pekarangan Rumah / Polybag</option>
                    <option value="Hidroponik Botol / Pipa">Hidroponik Botol / Pipa PVC</option>
                    <option value="Budikdamber (Ember Ikan & Sayur)">Budikdamber (Ember Ikan & Sayur)</option>
                    <option value="Kebun Kelompok Lorong Bersama">Kebun Kelompok Lorong Bersama</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Pilihan Paket Bibit Sayur</label>
                  <div className="space-y-1.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    {[
                      'Benih Pakcoy Nauli F1 (Hidroponik / Tanah)',
                      'Benih Selada Keriting Hijau (Grand Rapids)',
                      'Benih Cabai Rawit Khas Katokkon Toraja-Makassar',
                      'Benih Kangkung Daun Sempit (Rajawali)',
                      'Bibit Rimpang TOGA (Kunyit, Jahe Merah)',
                      'Paket Polybag Tebal 30cm & Kompos BSU Panaikang',
                    ].map((seedName) => (
                      <label key={seedName} className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                        <input
                          type="checkbox"
                          checked={selectedSeeds.includes(seedName)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedSeeds([...selectedSeeds, seedName]);
                            } else {
                              setSelectedSeeds(selectedSeeds.filter((s) => s !== seedName));
                            }
                          }}
                          className="rounded text-[#059669] focus:ring-[#059669]"
                        />
                        <span>{seedName}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 pt-1">
                  <input
                    type="checkbox"
                    checked={needsTraining}
                    onChange={(e) => setNeedsTraining(e.target.checked)}
                    className="rounded text-[#059669] focus:ring-[#059669]"
                  />
                  <span>Saya membutuhkan pendampingan & panduan tanam dari Penyuluh Kelurahan</span>
                </label>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowSeedFormModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-[#059669] hover:bg-[#047857] text-white font-bold transition-colors cursor-pointer"
                  >
                    Kirim Permohonan Bibit
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ================= MODAL TAMBAH TITIK KEBUN BARU ================= */}
      {showAddSpotModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/80 flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setShowAddSpotModal(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 border border-slate-200 shadow-2xl space-y-4 my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-xs font-extrabold text-emerald-700 uppercase">Administrator & Warga</span>
                <h3 className="text-base sm:text-lg font-extrabold text-[#0D3868]">
                  Pendaftaran Titik Kebun Urban Farming Baru
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddSpotModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNewSpot} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Kebun / Lokasi Lorong *</label>
                <input
                  type="text"
                  required
                  value={newSpotName}
                  onChange={(e) => setNewSpotName(e.target.value)}
                  placeholder="Contoh: Kebun Hidroponik Lorong Asoka"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 focus:border-[#059669] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Wilayah RW *</label>
                  <select
                    value={newSpotRw}
                    onChange={(e) => setNewSpotRw(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-bold text-[#0D3868] focus:border-[#059669] focus:outline-none"
                  >
                    <option value="RW 01">RW 01</option>
                    <option value="RW 02">RW 02</option>
                    <option value="RW 03">RW 03</option>
                    <option value="RW 04">RW 04</option>
                    <option value="RW 05">RW 05</option>
                    <option value="RW 06">RW 06</option>
                    <option value="RW 07">RW 07</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Unit RT</label>
                  <input
                    type="text"
                    value={newSpotRt}
                    onChange={(e) => setNewSpotRt(e.target.value)}
                    placeholder="RT 01"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 focus:border-[#059669] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Alamat Lengkap Titik Kebun *</label>
                <input
                  type="text"
                  required
                  value={newSpotAddress}
                  onChange={(e) => setNewSpotAddress(e.target.value)}
                  placeholder="Jl. Aspol Tello Baru, Lorong..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 focus:border-[#059669] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nama Kelompok Tani / KWT</label>
                  <input
                    type="text"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="KWT Asoka Mandiri"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 focus:border-[#059669] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Metode Budidaya</label>
                  <select
                    value={newFarmType}
                    onChange={(e) => setNewFarmType(e.target.value as FarmType)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 focus:border-[#059669] focus:outline-none"
                  >
                    <option value="Hidroponik / NFT">Hidroponik / NFT</option>
                    <option value="Akuaponik / Budikdamber">Akuaponik / Budikdamber</option>
                    <option value="Pekarangan & Polybag Organik">Pekarangan & Polybag Organik</option>
                    <option value="Rumah Jamur & TOGA">Rumah Jamur & TOGA</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nama Koordinator *</label>
                  <input
                    type="text"
                    required
                    value={newCoordName}
                    onChange={(e) => setNewCoordName(e.target.value)}
                    placeholder="Nama penanggung jawab..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 focus:border-[#059669] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">No. Kontak / WA</label>
                  <input
                    type="text"
                    value={newCoordPhone}
                    onChange={(e) => setNewCoordPhone(e.target.value)}
                    placeholder="0812-xxxx-xxxx"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 focus:border-[#059669] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Komoditas yang Ditanam (Pisahkan koma)</label>
                <input
                  type="text"
                  value={newCommodities}
                  onChange={(e) => setNewCommodities(e.target.value)}
                  placeholder="Pakcoy, Selada, Cabai Katokkon..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 focus:border-[#059669] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kapasitas (kg/bln)</label>
                  <input
                    type="number"
                    value={newProductionKg}
                    onChange={(e) => setNewProductionKg(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 focus:border-[#059669] focus:outline-none font-mono-num"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Jumlah Anggota</label>
                  <input
                    type="number"
                    value={newMembers}
                    onChange={(e) => setNewMembers(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 focus:border-[#059669] focus:outline-none font-mono-num"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Status Kebun</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 focus:border-[#059669] focus:outline-none font-bold"
                  >
                    <option value="Masa Tanam">Masa Tanam</option>
                    <option value="Siap Panen">Siap Panen</option>
                    <option value="Aktif Produktif">Aktif Produktif</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddSpotModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#059669] hover:bg-[#047857] text-white font-bold transition-colors cursor-pointer"
                >
                  Simpan Kebun Baru
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
