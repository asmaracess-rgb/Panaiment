import React, { useState, useMemo } from 'react';
import {
  Sprout,
  Plus,
  Edit3,
  Trash2,
  Upload,
  Image as ImageIcon,
  Check,
  X,
  AlertCircle,
  Search,
  Filter,
  MapPin,
  Calendar,
  Users,
  TrendingUp,
  Package,
  Layers,
  Leaf,
  Droplets,
  Phone,
  MessageCircle,
  ExternalLink,
  Printer,
  Sparkles,
} from 'lucide-react';
import {
  UrbanFarmingSpot,
  FarmType,
  SeedRequestItem,
  RwGroup,
  KelurahanProfile,
} from '../types';
import { compressImageFile } from '../utils/compressImage';
import { resolveImageUrl } from '../utils/resolveImageUrl';
import { buildOfficialKopSuratHtml } from '../utils/officialKopSurat';

interface AdminUrbanFarmingPanelProps {
  spots: UrbanFarmingSpot[];
  seedRequests: SeedRequestItem[];
  rwGroups?: RwGroup[];
  profile?: KelurahanProfile;
  adminOfficerName?: string;
  onAddSpot: (spot: UrbanFarmingSpot) => Promise<{ ok: boolean; errors?: string[] }>;
  onUpdateSpot: (
    id: string,
    spot: Partial<UrbanFarmingSpot>
  ) => Promise<{ ok: boolean; errors?: string[] }>;
  onDeleteSpot: (id: string) => Promise<{ ok: boolean; errors?: string[] }>;
  onAddSeedRequest?: (
    req: SeedRequestItem
  ) => Promise<{ ok: boolean; errors?: string[] }>;
  onUpdateSeedRequest?: (
    id: string,
    req: Partial<SeedRequestItem>
  ) => Promise<{ ok: boolean; errors?: string[] }>;
  onDeleteSeedRequest?: (id: string) => Promise<{ ok: boolean; errors?: string[] }>;
}

const FARM_TYPES: FarmType[] = [
  'Hidroponik / NFT',
  'Akuaponik / Budikdamber',
  'Pekarangan & Polybag Organik',
  'Rumah Jamur & TOGA',
];

const PRESET_PHOTOS = [
  { label: 'Hidroponik Vertikal Selada', url: '/images/ig_post_5_DeGDDkFPvJs.jpg' },
  { label: 'Sayuran Hijau & Pembibitan', url: '/images/ig_post_6_Dd-xlSLvXKn.jpg' },
  { label: 'Pekarangan Cabe Katokkon', url: '/images/ig_post_7_Dd33fJSy13M.jpg' },
  { label: 'Akuaponik Budikdamber Lele', url: '/images/ig_post_4_DeJpFcVJ6jq.jpg' },
  { label: 'Kumbung Jamur Tiram', url: '/images/ig_post_2_DbnJW3OvANh.jpg' },
  { label: 'Green Wall Pipa PVC', url: '/images/ig_post_10_DdfhgGQPaJX.jpg' },
  { label: 'Bedengan Terong & Sayur', url: '/images/ig_post_1_DdrMaapvrr4.jpg' },
];

export const AdminUrbanFarmingPanel: React.FC<AdminUrbanFarmingPanelProps> = ({
  spots,
  seedRequests,
  rwGroups = [],
  profile,
  adminOfficerName = 'Administrator Satu Data Panaikang',
  onAddSpot,
  onUpdateSpot,
  onDeleteSpot,
  onAddSeedRequest,
  onUpdateSeedRequest,
  onDeleteSeedRequest,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'kebun' | 'bibit'>('kebun');

  // Filter & Search State for Spots
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRw, setFilterRw] = useState('Semua');
  const [filterType, setFilterType] = useState('Semua');
  const [filterStatus, setFilterStatus] = useState('Semua');

  // Modal State for Add / Edit Spot
  const [showSpotModal, setShowSpotModal] = useState(false);
  const [editingSpotId, setEditingSpotId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Spot Form State
  const [spotForm, setSpotForm] = useState<Partial<UrbanFarmingSpot>>({
    name: '',
    rw: 'RW 01',
    rt: 'RT 01',
    locationAddress: '',
    groupName: '',
    coordinatorName: '',
    coordinatorPhone: '',
    farmingType: 'Hidroponik / NFT',
    commodities: ['Pakcoy', 'Selada'],
    activeMembers: 15,
    monthlyProductionKg: 45,
    nextHarvestDate: '15 Nov 2026',
    harvestEstimatedKg: 20,
    status: 'Aktif Produktif',
    description: '',
    photoUrl: '/images/ig_post_5_DeGDDkFPvJs.jpg',
  });
  const [commoditiesText, setCommoditiesText] = useState('Pakcoy, Selada, Seledri');
  const [photoPreview, setPhotoPreview] = useState<string>('/images/ig_post_5_DeGDDkFPvJs.jpg');

  // Confirm Delete Dialog for Spot
  const [confirmDeleteSpotId, setConfirmDeleteSpotId] = useState<string | null>(null);

  // Seed Request Modal / Edit State
  const [showSeedModal, setShowSeedModal] = useState(false);
  const [seedSearchQuery, setSeedSearchQuery] = useState('');
  const [seedStatusFilter, setSeedStatusFilter] = useState('Semua');
  const [confirmDeleteSeedId, setConfirmDeleteSeedId] = useState<string | null>(null);

  const [seedForm, setSeedForm] = useState<Partial<SeedRequestItem>>({
    applicantName: '',
    applicantPhone: '',
    rw: 'RW 01',
    rt: 'RT 01',
    address: '',
    requestedSeeds: ['Benih Pakcoy Nauli F1 (Hidroponik / Tanah)'],
    plantingMethod: 'Hidroponik Botol / Pipa',
    needsTraining: true,
    status: 'Menunggu Pengambilan',
  });
  const [seedTypesText, setSeedTypesText] = useState('Benih Pakcoy Nauli F1, Selada Hijau');

  // Available RWs
  const availableRws = useMemo(() => {
    if (rwGroups && rwGroups.length > 0) {
      return rwGroups.map((g) => g.rwCode);
    }
    return ['RW 01', 'RW 02', 'RW 03', 'RW 04', 'RW 05', 'RW 06', 'RW 07'];
  }, [rwGroups]);

  // Available RTs for selected RW in spot modal
  const availableRts = useMemo(() => {
    const matched = rwGroups.find((g) => g.rwCode === (spotForm.rw || 'RW 01'));
    if (matched && matched.rtList && matched.rtList.length > 0) {
      return matched.rtList.map((r) => r.rtCode);
    }
    return ['RT 01', 'RT 02', 'RT 03', 'RT 04', 'RT 05', 'RT 06', 'RT 07'];
  }, [rwGroups, spotForm.rw]);

  // Aggregate Metrics
  const totalProductionKg = useMemo(() => {
    return spots.reduce((acc, s) => acc + (s.monthlyProductionKg || 0), 0);
  }, [spots]);

  const totalMembers = useMemo(() => {
    return spots.reduce((acc, s) => acc + (s.activeMembers || 0), 0);
  }, [spots]);

  const readyToHarvestSpots = useMemo(() => {
    return spots.filter((s) => s.status === 'Siap Panen');
  }, [spots]);

  // Filtered Spots List
  const filteredSpots = useMemo(() => {
    return spots.filter((s) => {
      const matchRw = filterRw === 'Semua' || s.rw === filterRw;
      const matchType = filterType === 'Semua' || s.farmingType === filterType;
      const matchStatus = filterStatus === 'Semua' || s.status === filterStatus;
      const q = searchQuery.trim().toLowerCase();
      const matchQuery =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.groupName.toLowerCase().includes(q) ||
        s.coordinatorName.toLowerCase().includes(q) ||
        s.locationAddress.toLowerCase().includes(q) ||
        s.commodities.some((c) => c.toLowerCase().includes(q));
      return matchRw && matchType && matchStatus && matchQuery;
    });
  }, [spots, filterRw, filterType, filterStatus, searchQuery]);

  // Filtered Seed Requests
  const filteredSeedRequests = useMemo(() => {
    return seedRequests.filter((r) => {
      const matchStatus = seedStatusFilter === 'Semua' || r.status === seedStatusFilter;
      const q = seedSearchQuery.trim().toLowerCase();
      const matchQuery =
        !q ||
        r.applicantName.toLowerCase().includes(q) ||
        r.applicantPhone.toLowerCase().includes(q) ||
        r.rw.toLowerCase().includes(q) ||
        r.address.toLowerCase().includes(q) ||
        r.requestedSeeds.some((s) => s.toLowerCase().includes(q));
      return matchStatus && matchQuery;
    });
  }, [seedRequests, seedStatusFilter, seedSearchQuery]);

  // Handle Photo Upload
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setFeedbackMessage({ type: 'error', text: 'File yang dipilih harus berupa gambar (JPG, PNG, atau WEBP).' });
      return;
    }
    try {
      const compressed = await compressImageFile(file);
      setPhotoPreview(compressed);
      setSpotForm((prev) => ({ ...prev, photoUrl: compressed }));
    } catch {
      setFeedbackMessage({ type: 'error', text: 'Gagal memproses gambar yang dipilih.' });
    }
  };

  // Open Add Spot Modal
  const openAddSpotModal = () => {
    setEditingSpotId(null);
    setSpotForm({
      name: '',
      rw: 'RW 01',
      rt: 'RT 01',
      locationAddress: '',
      groupName: '',
      coordinatorName: '',
      coordinatorPhone: '',
      farmingType: 'Hidroponik / NFT',
      commodities: ['Pakcoy', 'Selada'],
      activeMembers: 15,
      monthlyProductionKg: 45,
      nextHarvestDate: '20 Nov 2026',
      harvestEstimatedKg: 20,
      status: 'Aktif Produktif',
      description: '',
      photoUrl: '/images/ig_post_5_DeGDDkFPvJs.jpg',
    });
    setCommoditiesText('Pakcoy, Selada, Seledri');
    setPhotoPreview('/images/ig_post_5_DeGDDkFPvJs.jpg');
    setShowSpotModal(true);
    setFeedbackMessage(null);
  };

  // Open Edit Spot Modal
  const openEditSpotModal = (spot: UrbanFarmingSpot) => {
    setEditingSpotId(spot.id);
    setSpotForm({ ...spot });
    setCommoditiesText(spot.commodities.join(', '));
    setPhotoPreview(spot.photoUrl || '/images/ig_post_5_DeGDDkFPvJs.jpg');
    setShowSpotModal(true);
    setFeedbackMessage(null);
  };

  // Submit Spot Form (Add or Edit)
  const handleSpotFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!spotForm.name?.trim()) {
      setFeedbackMessage({ type: 'error', text: 'Nama kebun / titik urban farming wajib diisi.' });
      return;
    }
    if (!spotForm.locationAddress?.trim()) {
      setFeedbackMessage({ type: 'error', text: 'Alamat lengkap kebun wajib diisi.' });
      return;
    }
    if (!spotForm.coordinatorName?.trim()) {
      setFeedbackMessage({ type: 'error', text: 'Nama penanggung jawab / koordinator wajib diisi.' });
      return;
    }

    setIsSubmitting(true);
    setFeedbackMessage(null);

    const parsedCommodities = commoditiesText
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);

    const payload: UrbanFarmingSpot = {
      id: editingSpotId || `uf-${Date.now()}`,
      name: spotForm.name.trim(),
      rw: spotForm.rw || 'RW 01',
      rt: spotForm.rt || 'RT 01',
      locationAddress: spotForm.locationAddress.trim(),
      groupName: spotForm.groupName?.trim() || `Kelompok Tani ${spotForm.rw}`,
      coordinatorName: spotForm.coordinatorName.trim(),
      coordinatorPhone: spotForm.coordinatorPhone?.trim() || '0812-xxxx-xxxx',
      farmingType: spotForm.farmingType || 'Hidroponik / NFT',
      commodities: parsedCommodities.length > 0 ? parsedCommodities : ['Pakcoy', 'Selada'],
      activeMembers: Number(spotForm.activeMembers) || 10,
      monthlyProductionKg: Number(spotForm.monthlyProductionKg) || 30,
      nextHarvestDate: spotForm.nextHarvestDate?.trim() || 'Akhir Bulan Ini',
      harvestEstimatedKg: Number(spotForm.harvestEstimatedKg) || 15,
      status: spotForm.status || 'Aktif Produktif',
      description: spotForm.description?.trim() || 'Kebun binaan ketahanan pangan Kelurahan Panaikang.',
      photoUrl: photoPreview || '/images/ig_post_5_DeGDDkFPvJs.jpg',
    };

    try {
      if (editingSpotId) {
        const res = await onUpdateSpot(editingSpotId, payload);
        if (res.ok) {
          setFeedbackMessage({ type: 'success', text: `Data kebun "${payload.name}" berhasil diperbarui.` });
          setShowSpotModal(false);
        } else {
          setFeedbackMessage({ type: 'error', text: res.errors?.join(', ') || 'Gagal memperbarui data kebun.' });
        }
      } else {
        const res = await onAddSpot(payload);
        if (res.ok) {
          setFeedbackMessage({ type: 'success', text: `Kebun baru "${payload.name}" berhasil ditambahkan.` });
          setShowSpotModal(false);
        } else {
          setFeedbackMessage({ type: 'error', text: res.errors?.join(', ') || 'Gagal menambahkan kebun baru.' });
        }
      }
    } catch {
      setFeedbackMessage({ type: 'error', text: 'Terjadi kesalahan sistem saat menyimpan data.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Spot
  const handleDeleteSpot = async (id: string) => {
    const target = spots.find((s) => s.id === id);
    try {
      const res = await onDeleteSpot(id);
      if (res.ok) {
        setFeedbackMessage({ type: 'success', text: `Kebun "${target?.name || id}" berhasil dihapus.` });
      } else {
        setFeedbackMessage({ type: 'error', text: res.errors?.join(', ') || 'Gagal menghapus kebun.' });
      }
    } catch {
      setFeedbackMessage({ type: 'error', text: 'Gagal menghapus data kebun.' });
    } finally {
      setConfirmDeleteSpotId(null);
    }
  };

  // Seed Status Quick Update
  const handleUpdateSeedStatus = async (
    id: string,
    newStatus: SeedRequestItem['status']
  ) => {
    if (!onUpdateSeedRequest) return;
    try {
      const res = await onUpdateSeedRequest(id, { status: newStatus });
      if (res.ok) {
        setFeedbackMessage({ type: 'success', text: `Status permohonan bibit #${id} berhasil diubah ke "${newStatus}".` });
      }
    } catch {
      setFeedbackMessage({ type: 'error', text: 'Gagal memperbarui status permohonan bibit.' });
    }
  };

  // Delete Seed Request
  const handleDeleteSeedRequest = async (id: string) => {
    if (!onDeleteSeedRequest) return;
    try {
      const res = await onDeleteSeedRequest(id);
      if (res.ok) {
        setFeedbackMessage({ type: 'success', text: `Permohonan bibit #${id} berhasil dihapus.` });
      }
    } catch {
      setFeedbackMessage({ type: 'error', text: 'Gagal menghapus permohonan bibit.' });
    } finally {
      setConfirmDeleteSeedId(null);
    }
  };

  // Submit Manual Seed Request Form
  const handleSeedFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!seedForm.applicantName?.trim() || !seedForm.applicantPhone?.trim()) {
      setFeedbackMessage({ type: 'error', text: 'Nama pemohon dan nomor telepon wajib diisi.' });
      return;
    }
    if (!onAddSeedRequest) return;

    setIsSubmitting(true);
    const parsedSeeds = seedTypesText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const newReq: SeedRequestItem = {
      id: `REQ-SEED-${Date.now().toString().slice(-4)}`,
      applicantName: seedForm.applicantName.trim(),
      applicantPhone: seedForm.applicantPhone.trim(),
      rw: seedForm.rw || 'RW 01',
      rt: seedForm.rt || 'RT 01',
      address: seedForm.address?.trim() || '',
      requestedSeeds: parsedSeeds.length > 0 ? parsedSeeds : ['Benih Pakcoy Nauli F1'],
      plantingMethod: seedForm.plantingMethod || 'Pekarangan & Polybag',
      needsTraining: Boolean(seedForm.needsTraining),
      status: seedForm.status || 'Menunggu Pengambilan',
      createdAt: `${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })} · Diinput Admin`,
    };

    try {
      const res = await onAddSeedRequest(newReq);
      if (res.ok) {
        setFeedbackMessage({ type: 'success', text: `Permohonan bibit baru atas nama "${newReq.applicantName}" berhasil dicatat.` });
        setShowSeedModal(false);
        setSeedForm({
          applicantName: '',
          applicantPhone: '',
          rw: 'RW 01',
          rt: 'RT 01',
          address: '',
          requestedSeeds: ['Benih Pakcoy Nauli F1 (Hidroponik / Tanah)'],
          plantingMethod: 'Hidroponik Botol / Pipa',
          needsTraining: true,
          status: 'Menunggu Pengambilan',
        });
      }
    } catch {
      setFeedbackMessage({ type: 'error', text: 'Gagal mencatat permohonan bibit.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Print Official Urban Farming Report
  const handlePrintReport = () => {
    const kopHtml = profile ? buildOfficialKopSuratHtml(profile, 'standard') : '';
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
  <title>Laporan Data Urban Farming Kelurahan Panaikang</title>
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
  <div class="doc-title">BUKU INDUK DATA URBAN FARMING & KETAHANAN PANGAN KELURAHAN PANAIKANG</div>
  <div class="doc-meta">Nomor Registrasi: <strong>521 / UF-PNK / ${new Date().getFullYear()}</strong> &nbsp;|&nbsp; Tanggal Cetak: ${nowStr}</div>

  <div class="summary-box">
    <div>Total Titik Kebun: <strong>${spots.length} Titik Binaan RW 01 – RW 07</strong></div>
    <div>Total Produksi: <strong>${totalProductionKg} kg / bulan</strong></div>
    <div>Anggota & KWT Aktif: <strong>${totalMembers} KK</strong></div>
    <div>Kebun Siap Panen: <strong>${readyToHarvestSpots.length} Titik</strong></div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width:28px">No</th>
        <th style="width:145px">Nama Kebun & Alamat</th>
        <th style="width:130px">Kelompok Tani / KWT</th>
        <th>Metode & Komoditas</th>
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
      <div style="font-weight:800;text-decoration:underline;color:#0d3868;">${profile?.lurahName || 'Muthmainnah, SE, MM'}</div>
      <div style="font-size:9.5px;color:#475569;">NIP. ${profile?.lurahNip || '19880412 201010 1 002'}</div>
    </div>
  </div>
</body>
</html>`;

    const existingFrame = document.getElementById('urban-farming-admin-print-iframe') as HTMLIFrameElement | null;
    if (existingFrame) existingFrame.remove();
    const iframe = document.createElement('iframe');
    iframe.id = 'urban-farming-admin-print-iframe';
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
    <div className="space-y-6">
      {/* ================= PANEL HEADER & KPI STATS ================= */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-extrabold text-[#059669]">
              <Sprout className="w-3.5 h-3.5" />
              <span>ADMINISTRASI URBAN FARMING · KELURAHAN PANAIKANG</span>
            </div>
            <h2 className="mt-2 text-xl sm:text-2xl font-extrabold text-[#0D3868] tracking-tight">
              Manajemen Terpadu Urban Farming
            </h2>
            <p className="mt-0.5 text-xs sm:text-sm text-slate-600 max-w-2xl">
              Pusat kelola data kebun binaan warga RW 01 – RW 07, kelompok tani, upload foto dokumentasi, distribusi benih gratis, dan rekapitulasi hasil panen.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handlePrintReport}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-bold transition-colors cursor-pointer shadow-xs"
            >
              <Printer className="w-3.5 h-3.5 text-emerald-700" />
              <span>Cetak Laporan Lengkap</span>
            </button>

            {activeSubTab === 'kebun' ? (
              <button
                type="button"
                onClick={openAddSpotModal}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#059669] hover:bg-[#047857] text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>+ Tambah Kebun Baru</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowSeedModal(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#059669] hover:bg-[#047857] text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>+ Input Permohonan Bibit</span>
              </button>
            )}
          </div>
        </div>

        {/* 4 Metric Counters */}
        <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-3.5 pt-5 border-t border-slate-100">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
              <span>Total Kebun Terdata</span>
              <MapPin className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="mt-1 text-2xl font-extrabold text-[#0D3868] font-mono-num">
              {spots.length} <span className="text-xs font-bold text-slate-500">Kebun</span>
            </div>
            <div className="mt-0.5 text-[11px] text-slate-500">
              Binaan RW 01 – RW 07
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
              <span>Hasil Panen Bulanan</span>
              <TrendingUp className="w-4 h-4 text-[#059669]" />
            </div>
            <div className="mt-1 text-2xl font-extrabold text-[#059669] font-mono-num">
              {totalProductionKg} <span className="text-xs font-bold text-slate-500">kg/bln</span>
            </div>
            <div className="mt-0.5 text-[11px] text-slate-500">
              Akumulasi sayuran & pangan
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
              <span>Anggota / KK Terlibat</span>
              <Users className="w-4 h-4 text-[#0277BD]" />
            </div>
            <div className="mt-1 text-2xl font-extrabold text-[#0277BD] font-mono-num">
              {totalMembers} <span className="text-xs font-bold text-slate-500">KK Aktif</span>
            </div>
            <div className="mt-0.5 text-[11px] text-slate-500">
              Kelompok Tani & KWT
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
              <span>Permohonan Bibit</span>
              <Package className="w-4 h-4 text-amber-600" />
            </div>
            <div className="mt-1 text-2xl font-extrabold text-amber-600 font-mono-num">
              {seedRequests.length} <span className="text-xs font-bold text-slate-500">Pengajuan</span>
            </div>
            <div className="mt-0.5 text-[11px] text-slate-500">
              {seedRequests.filter((r) => r.status === 'Menunggu Pengambilan').length} Menunggu verifikasi
            </div>
          </div>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedbackMessage && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between gap-3 text-xs sm:text-sm font-semibold ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
              : 'bg-red-50 border border-red-200 text-red-900'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackMessage.type === 'success' ? (
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{feedbackMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackMessage(null)}
            className="text-slate-500 hover:text-slate-700 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Sub-Tabs: 1. Data Kebun | 2. Permohonan Bibit */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveSubTab('kebun')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeSubTab === 'kebun'
              ? 'border-[#059669] text-[#059669] bg-white'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Sprout className="w-4 h-4" />
          <span>Kelola Data Kebun ({spots.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('bibit')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeSubTab === 'bibit'
              ? 'border-[#059669] text-[#059669] bg-white'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Permohonan Bibit Gratis ({seedRequests.length})</span>
        </button>
      </div>

      {/* ================= SUB-TAB 1: KELOLA DATA KEBUN URBAN FARMING ================= */}
      {activeSubTab === 'kebun' && (
        <div className="space-y-4">
          {/* Search & Filter Toolbar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari nama kebun, kelompok tani, koordinator, alamat, atau tanaman..."
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:border-[#059669] focus:outline-none"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Filter RW */}
                <select
                  value={filterRw}
                  onChange={(e) => setFilterRw(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 text-xs font-bold text-[#0D3868] focus:border-[#059669] focus:outline-none"
                >
                  <option value="Semua">Semua Wilayah RW</option>
                  {availableRws.map((rw) => (
                    <option key={rw} value={rw}>
                      {rw}
                    </option>
                  ))}
                </select>

                {/* Filter Metode */}
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 text-xs font-bold text-slate-700 focus:border-[#059669] focus:outline-none"
                >
                  <option value="Semua">Semua Metode Bertani</option>
                  {FARM_TYPES.map((ft) => (
                    <option key={ft} value={ft}>
                      {ft}
                    </option>
                  ))}
                </select>

                {/* Filter Status */}
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 text-xs font-bold text-slate-700 focus:border-[#059669] focus:outline-none"
                >
                  <option value="Semua">Semua Status</option>
                  <option value="Aktif Produktif">Aktif Produktif</option>
                  <option value="Masa Tanam">Masa Tanam</option>
                  <option value="Siap Panen">Siap Panen</option>
                </select>

                {(searchQuery || filterRw !== 'Semua' || filterType !== 'Semua' || filterStatus !== 'Semua') && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setFilterRw('Semua');
                      setFilterType('Semua');
                      setFilterStatus('Semua');
                    }}
                    className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-emerald-700 hover:bg-slate-50 cursor-pointer"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
              <div>
                Menampilkan <strong>{filteredSpots.length}</strong> dari {spots.length} titik kebun terdaftar
              </div>
              <div className="text-[11px] text-slate-500">
                Penyimpanan tersinkronisasi otomatis ke basis data kelurahan
              </div>
            </div>
          </div>

          {/* Spots Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                    <th className="py-3 px-4">Foto & Nama Kebun</th>
                    <th className="py-3 px-4">Wilayah & Alamat</th>
                    <th className="py-3 px-4">Kelompok & Koordinator</th>
                    <th className="py-3 px-4">Metode & Komoditas</th>
                    <th className="py-3 px-4 text-center">Produksi & Panen</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Aksi Admin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-xs">
                  {filteredSpots.map((spot) => (
                    <tr key={spot.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Photo & Name */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={resolveImageUrl(spot.photoUrl)}
                            alt={spot.name}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/images/ig_post_5_DeGDDkFPvJs.jpg';
                            }}
                            className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0 bg-slate-100"
                          />
                          <div>
                            <div className="font-extrabold text-[#0D3868] text-xs sm:text-sm">
                              {spot.name}
                            </div>
                            <div className="text-[11px] text-slate-500 line-clamp-1 max-w-[200px]">
                              {spot.description}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Location */}
                      <td className="py-3 px-4">
                        <span className="inline-block px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-[#059669] font-bold text-[11px] mr-1.5 font-mono-num">
                          {spot.rw} · {spot.rt}
                        </span>
                        <div className="mt-1 text-slate-700 font-medium line-clamp-2 max-w-[180px]">
                          {spot.locationAddress}
                        </div>
                      </td>

                      {/* Group & Coordinator */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{spot.groupName}</div>
                        <div className="mt-0.5 text-slate-600 flex items-center gap-1">
                          <span>{spot.coordinatorName}</span>
                          {spot.coordinatorPhone && (
                            <a
                              href={`https://wa.me/${spot.coordinatorPhone.replace(/[^0-9]/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-emerald-600 hover:text-emerald-800"
                              title={`Hubungi WhatsApp ${spot.coordinatorPhone}`}
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono-num">
                          {spot.activeMembers} KK Aktif
                        </div>
                      </td>

                      {/* Farming Type & Commodities */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-emerald-800">{spot.farmingType}</div>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {spot.commodities.slice(0, 3).map((comm) => (
                            <span
                              key={comm}
                              className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-medium"
                            >
                              {comm}
                            </span>
                          ))}
                          {spot.commodities.length > 3 && (
                            <span className="text-[10px] text-slate-400">
                              +{spot.commodities.length - 3}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Production & Harvest */}
                      <td className="py-3 px-4 text-center">
                        <div className="font-extrabold text-[#059669] font-mono-num">
                          {spot.monthlyProductionKg} kg<span className="text-[10px] font-normal text-slate-500">/bln</span>
                        </div>
                        <div className="text-[11px] font-medium text-slate-700 mt-0.5">
                          Panen: <strong>{spot.nextHarvestDate}</strong>
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono-num">
                          ~{spot.harvestEstimatedKg} kg
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                            spot.status === 'Siap Panen'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : spot.status === 'Masa Tanam'
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : 'bg-sky-100 text-sky-800 border border-sky-300'
                          }`}
                        >
                          {spot.status}
                        </span>
                      </td>

                      {/* Admin Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        {confirmDeleteSpotId === spot.id ? (
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleDeleteSpot(spot.id)}
                              className="px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs cursor-pointer"
                            >
                              Ya, Hapus
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteSpotId(null)}
                              className="px-2.5 py-1 rounded-lg bg-slate-200 text-slate-700 font-semibold text-xs cursor-pointer"
                            >
                              Batal
                            </button>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => openEditSpotModal(spot)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-semibold cursor-pointer"
                              title="Edit Data Kebun & Ganti Gambar"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-[#059669]" />
                              <span>Edit</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setConfirmDeleteSpotId(spot.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-red-200 bg-red-50/70 hover:bg-red-100 text-red-700 font-semibold cursor-pointer"
                              title="Hapus Data Kebun"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Hapus</span>
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}

                  {filteredSpots.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        <Sprout className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <div>Tidak ada kebun yang sesuai filter pencarian.</div>
                        <button
                          type="button"
                          onClick={openAddSpotModal}
                          className="mt-2 text-xs font-bold text-[#059669] hover:underline cursor-pointer"
                        >
                          + Tambah Kebun Baru Sekarang
                        </button>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= SUB-TAB 2: KELOLA PERMOHONAN BIBIT GRATIS ================= */}
      {activeSubTab === 'bibit' && (
        <div className="space-y-4">
          {/* Toolbar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={seedSearchQuery}
                  onChange={(e) => setSeedSearchQuery(e.target.value)}
                  placeholder="Cari nama pemohon bibit, nomor kontak, RW/RT, atau jenis benih..."
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:border-[#059669] focus:outline-none"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={seedStatusFilter}
                  onChange={(e) => setSeedStatusFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 text-xs font-bold text-slate-700 focus:border-[#059669] focus:outline-none"
                >
                  <option value="Semua">Semua Status Permohonan</option>
                  <option value="Menunggu Pengambilan">Menunggu Pengambilan</option>
                  <option value="Disetujui">Disetujui</option>
                  <option value="Telah Didistribusikan">Telah Didistribusikan</option>
                  <option value="Ditolak">Ditolak</option>
                </select>

                <button
                  type="button"
                  onClick={() => setShowSeedModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#059669] hover:bg-[#047857] text-white text-xs font-bold cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Input Permohonan Manual</span>
                </button>
              </div>
            </div>
          </div>

          {/* Seed Requests Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                    <th className="py-3 px-4">Kode & Pemohon</th>
                    <th className="py-3 px-4">Kontak & Wilayah</th>
                    <th className="py-3 px-4">Benih yang Diminta</th>
                    <th className="py-3 px-4">Rencana Tanam & Pelatihan</th>
                    <th className="py-3 px-4 text-center">Status Distribusi</th>
                    <th className="py-3 px-4 text-right">Aksi Admin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-xs">
                  {filteredSeedRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-mono-num font-bold text-[#0D3868] text-[11px] block">
                          {req.id}
                        </span>
                        <div className="font-extrabold text-slate-900 text-xs sm:text-sm mt-0.5">
                          {req.applicantName}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          {req.createdAt}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 text-slate-800 font-semibold font-mono-num">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{req.applicantPhone}</span>
                          <a
                            href={`https://wa.me/${req.applicantPhone.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-600 hover:text-emerald-800"
                            title="Chat WhatsApp"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </a>
                        </div>
                        <div className="text-[11px] text-slate-600 mt-0.5">
                          <span className="font-bold text-[#059669]">{req.rw} · {req.rt}</span> — {req.address}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {req.requestedSeeds.map((seed, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-bold"
                            >
                              {seed}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">{req.plantingMethod}</div>
                        <div className="mt-0.5 text-[11px]">
                          {req.needsTraining ? (
                            <span className="text-amber-700 font-semibold">Memerlukan Pendampingan Kader Tani</span>
                          ) : (
                            <span className="text-slate-500">Mandiri (Tanpa Pendampingan)</span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <select
                          value={req.status}
                          onChange={(e) =>
                            handleUpdateSeedStatus(
                              req.id,
                              e.target.value as SeedRequestItem['status']
                            )
                          }
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold border cursor-pointer focus:outline-none ${
                            req.status === 'Telah Didistribusikan'
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                              : req.status === 'Disetujui'
                              ? 'bg-sky-50 border-sky-300 text-sky-800'
                              : req.status === 'Ditolak'
                              ? 'bg-red-50 border-red-300 text-red-800'
                              : 'bg-amber-50 border-amber-300 text-amber-800'
                          }`}
                        >
                          <option value="Menunggu Pengambilan">Menunggu Pengambilan</option>
                          <option value="Disetujui">Disetujui</option>
                          <option value="Telah Didistribusikan">Telah Didistribusikan</option>
                          <option value="Ditolak">Ditolak</option>
                        </select>
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        {confirmDeleteSeedId === req.id ? (
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleDeleteSeedRequest(req.id)}
                              className="px-2.5 py-1 rounded-lg bg-red-600 text-white font-bold text-xs cursor-pointer"
                            >
                              Ya, Hapus
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteSeedId(null)}
                              className="px-2.5 py-1 rounded-lg bg-slate-200 text-slate-700 text-xs cursor-pointer"
                            >
                              Batal
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteSeedId(req.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-red-200 bg-red-50/70 hover:bg-red-100 text-red-700 font-semibold cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Hapus</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}

                  {filteredSeedRequests.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        Belum ada permohonan bibit yang sesuai filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: TAMBAH / EDIT KEBUN URBAN FARMING ================= */}
      {showSpotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-7 space-y-5 shadow-2xl my-8 border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <Sprout className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-extrabold text-[#0D3868]">
                    {editingSpotId ? 'Edit Data Kebun Urban Farming' : 'Tambah Kebun Urban Farming Baru'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Isi detail kebun, komoditas panen, dan upload foto dokumentasi kebun
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSpotModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSpotFormSubmit} className="space-y-4 text-xs sm:text-sm">
              {/* Photo Upload & Preview Section */}
              <div className="space-y-2 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                <label className="block text-xs font-bold text-slate-700">
                  Foto Dokumentasi Kebun
                </label>
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="relative w-36 h-28 rounded-xl overflow-hidden bg-slate-200 border border-slate-300 shrink-0 shadow-xs">
                    <img
                      src={resolveImageUrl(photoPreview)}
                      alt="Pratinjau Kebun"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/images/ig_post_5_DeGDDkFPvJs.jpg';
                      }}
                    />
                    <div className="absolute inset-0 bg-black/20 flex items-end p-1.5">
                      <span className="text-[10px] text-white font-bold bg-black/60 px-1.5 py-0.5 rounded">
                        Pratinjau
                      </span>
                    </div>
                  </div>

                  <div className="flex-1 space-y-2">
                    <label className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 text-xs font-bold cursor-pointer shadow-xs">
                      <Upload className="w-4 h-4 text-[#059669]" />
                      <span>Upload Gambar dari Perangkat</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                    </label>

                    <div className="text-[11px] text-slate-500 leading-tight">
                      Mendukung format JPG, PNG, WEBP. Gambar otomatis dikompresi untuk kinerja optimal.
                    </div>

                    {/* Quick Preset Photos */}
                    <div className="pt-1">
                      <span className="text-[10px] font-bold text-slate-500 block mb-1">
                        Atau pilih foto dokumentasi kelurahan:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {PRESET_PHOTOS.map((p) => (
                          <button
                            key={p.url}
                            type="button"
                            onClick={() => {
                              setPhotoPreview(p.url);
                              setSpotForm((prev) => ({ ...prev, photoUrl: p.url }));
                            }}
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold border transition-colors cursor-pointer ${
                              photoPreview === p.url
                                ? 'bg-emerald-100 border-emerald-400 text-emerald-800'
                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Basic Info: Name & Address */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama Kebun / Sentra Urban Farming *
                  </label>
                  <input
                    type="text"
                    required
                    value={spotForm.name || ''}
                    onChange={(e) => setSpotForm({ ...spotForm, name: e.target.value })}
                    placeholder="Contoh: Sentra Hidroponik Aspol Tello Asri"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:border-[#059669] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Wilayah RW *
                  </label>
                  <select
                    value={spotForm.rw || 'RW 01'}
                    onChange={(e) => setSpotForm({ ...spotForm, rw: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs sm:text-sm focus:border-[#059669] focus:outline-none"
                  >
                    {availableRws.map((rw) => (
                      <option key={rw} value={rw}>
                        {rw}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Wilayah RT *
                  </label>
                  <select
                    value={spotForm.rt || 'RT 01'}
                    onChange={(e) => setSpotForm({ ...spotForm, rt: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs sm:text-sm focus:border-[#059669] focus:outline-none"
                  >
                    {availableRts.map((rt) => (
                      <option key={rt} value={rt}>
                        {rt}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Alamat Lengkap / Patokan Lokasi *
                  </label>
                  <input
                    type="text"
                    required
                    value={spotForm.locationAddress || ''}
                    onChange={(e) => setSpotForm({ ...spotForm, locationAddress: e.target.value })}
                    placeholder="Contoh: Jl. Aspol Tello Baru Blok B3 RW 01"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:border-[#059669] focus:outline-none"
                  />
                </div>
              </div>

              {/* Group & Coordinator */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Kelompok Tani / KWT
                  </label>
                  <input
                    type="text"
                    value={spotForm.groupName || ''}
                    onChange={(e) => setSpotForm({ ...spotForm, groupName: e.target.value })}
                    placeholder="KWT Asoka Mandiri"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:border-[#059669] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama Koordinator *
                  </label>
                  <input
                    type="text"
                    required
                    value={spotForm.coordinatorName || ''}
                    onChange={(e) => setSpotForm({ ...spotForm, coordinatorName: e.target.value })}
                    placeholder="Ibu Ratna Burhanuddin"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:border-[#059669] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nomor Kontak / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={spotForm.coordinatorPhone || ''}
                    onChange={(e) => setSpotForm({ ...spotForm, coordinatorPhone: e.target.value })}
                    placeholder="0812-4290-xxxx"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:border-[#059669] focus:outline-none font-mono-num"
                  />
                </div>
              </div>

              {/* Method, Commodities & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Metode Bertani
                  </label>
                  <select
                    value={spotForm.farmingType || 'Hidroponik / NFT'}
                    onChange={(e) => setSpotForm({ ...spotForm, farmingType: e.target.value as FarmType })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs sm:text-sm focus:border-[#059669] focus:outline-none"
                  >
                    {FARM_TYPES.map((ft) => (
                      <option key={ft} value={ft}>
                        {ft}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Status Kebun
                  </label>
                  <select
                    value={spotForm.status || 'Aktif Produktif'}
                    onChange={(e) =>
                      setSpotForm({
                        ...spotForm,
                        status: e.target.value as UrbanFarmingSpot['status'],
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs sm:text-sm focus:border-[#059669] focus:outline-none"
                  >
                    <option value="Aktif Produktif">Aktif Produktif</option>
                    <option value="Masa Tanam">Masa Tanam</option>
                    <option value="Siap Panen">Siap Panen</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Jumlah Anggota / KK
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={spotForm.activeMembers ?? 15}
                    onChange={(e) => setSpotForm({ ...spotForm, activeMembers: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:border-[#059669] focus:outline-none font-mono-num"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Komoditas Tanaman (Pisahkan dengan koma)
                  </label>
                  <input
                    type="text"
                    value={commoditiesText}
                    onChange={(e) => setCommoditiesText(e.target.value)}
                    placeholder="Contoh: Pakcoy, Selada Hijau, Daun Bawang, Cabai Rawit"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:border-[#059669] focus:outline-none"
                  />
                </div>
              </div>

              {/* Yield & Harvest Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Produksi Bulanan (kg)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={spotForm.monthlyProductionKg ?? 45}
                    onChange={(e) => setSpotForm({ ...spotForm, monthlyProductionKg: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:border-[#059669] focus:outline-none font-mono-num"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Estimasi Panen Sekali (kg)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={spotForm.harvestEstimatedKg ?? 20}
                    onChange={(e) => setSpotForm({ ...spotForm, harvestEstimatedKg: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:border-[#059669] focus:outline-none font-mono-num"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Perkiraan Tanggal Panen
                  </label>
                  <input
                    type="text"
                    value={spotForm.nextHarvestDate || '25 Nov 2026'}
                    onChange={(e) => setSpotForm({ ...spotForm, nextHarvestDate: e.target.value })}
                    placeholder="25 Nov 2026"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:border-[#059669] focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Deskripsi / Catatan Tambahan
                  </label>
                  <textarea
                    rows={2}
                    value={spotForm.description || ''}
                    onChange={(e) => setSpotForm({ ...spotForm, description: e.target.value })}
                    placeholder="Catatan kondisi instalasi, pupuk organik BSU, atau pemanfaatan hasil kebun..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:border-[#059669] focus:outline-none"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowSpotModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#059669] hover:bg-[#047857] text-white font-bold text-xs cursor-pointer shadow-xs disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingSpotId ? 'Simpan Perubahan Kebun' : 'Simpan Kebun Baru'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: INPUT PERMOHONAN BIBIT MANUAL ================= */}
      {showSeedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl my-8 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#0D3868]">
                    Input Permohonan Bibit Gratis
                  </h3>
                  <p className="text-xs text-slate-500">
                    Catat permohonan warga yang datang langsung ke loket kelurahan
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSeedModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSeedFormSubmit} className="space-y-3.5 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Warga / Pemohon *
                </label>
                <input
                  type="text"
                  required
                  value={seedForm.applicantName || ''}
                  onChange={(e) => setSeedForm({ ...seedForm, applicantName: e.target.value })}
                  placeholder="Nama Lengkap Pemohon"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:border-[#059669] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nomor WhatsApp / Telepon *
                  </label>
                  <input
                    type="text"
                    required
                    value={seedForm.applicantPhone || ''}
                    onChange={(e) => setSeedForm({ ...seedForm, applicantPhone: e.target.value })}
                    placeholder="0812-xxxx-xxxx"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:border-[#059669] focus:outline-none font-mono-num"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Wilayah RW & RT
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <select
                      value={seedForm.rw || 'RW 01'}
                      onChange={(e) => setSeedForm({ ...seedForm, rw: e.target.value })}
                      className="px-2 py-2 rounded-xl border border-slate-300 bg-white text-xs focus:border-[#059669] focus:outline-none"
                    >
                      {availableRws.map((rw) => (
                        <option key={rw} value={rw}>
                          {rw}
                        </option>
                      ))}
                    </select>

                    <input
                      type="text"
                      value={seedForm.rt || 'RT 01'}
                      onChange={(e) => setSeedForm({ ...seedForm, rt: e.target.value })}
                      placeholder="RT 01"
                      className="px-2 py-2 rounded-xl border border-slate-300 text-xs focus:border-[#059669] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Alamat Rumah / Lokasi Tanam
                </label>
                <input
                  type="text"
                  value={seedForm.address || ''}
                  onChange={(e) => setSeedForm({ ...seedForm, address: e.target.value })}
                  placeholder="Jl. Urip Sumoharjo Lr. ..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:border-[#059669] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Jenis Benih yang Diminta (Pisahkan koma)
                </label>
                <input
                  type="text"
                  value={seedTypesText}
                  onChange={(e) => setSeedTypesText(e.target.value)}
                  placeholder="Benih Pakcoy, Selada, Cabai Rawit"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:border-[#059669] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Metode Tanam
                  </label>
                  <select
                    value={seedForm.plantingMethod || 'Hidroponik Botol / Pipa'}
                    onChange={(e) => setSeedForm({ ...seedForm, plantingMethod: e.target.value })}
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-300 bg-white text-xs focus:border-[#059669] focus:outline-none"
                  >
                    <option value="Hidroponik Botol / Pipa">Hidroponik Botol / Pipa</option>
                    <option value="Polybag Pekarangan">Polybag Pekarangan</option>
                    <option value="Budikdamber Lele-Kangkung">Budikdamber Lele-Kangkung</option>
                    <option value="Bedengan Tanah Pekarangan">Bedengan Tanah</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Status Awal
                  </label>
                  <select
                    value={seedForm.status || 'Menunggu Pengambilan'}
                    onChange={(e) =>
                      setSeedForm({
                        ...seedForm,
                        status: e.target.value as SeedRequestItem['status'],
                      })
                    }
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-300 bg-white text-xs focus:border-[#059669] focus:outline-none"
                  >
                    <option value="Menunggu Pengambilan">Menunggu Pengambilan</option>
                    <option value="Disetujui">Disetujui</option>
                    <option value="Telah Didistribusikan">Telah Didistribusikan</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="needsTrainingAdmin"
                  checked={seedForm.needsTraining ?? true}
                  onChange={(e) => setSeedForm({ ...seedForm, needsTraining: e.target.checked })}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="needsTrainingAdmin" className="text-xs text-slate-700 font-semibold cursor-pointer">
                  Warga butuh pendampingan & pelatihan cara menanam dari kader tani
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowSeedModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#059669] hover:bg-[#047857] text-white font-bold text-xs cursor-pointer shadow-xs"
                >
                  <Check className="w-4 h-4" />
                  <span>Simpan Permohonan Bibit</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
