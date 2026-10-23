import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Filter,
  MapPin,
  Camera,
  Upload,
  Edit3,
  Trash2,
  ExternalLink,
  Check,
  X,
  AlertTriangle,
  Info,
  Phone,
  Layers,
  Calendar,
  Image as ImageIcon,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { BioporiPoint, BioporiStatus } from '../types';
import {
  IMG_BANK_SAMPAH,
  IMG_DRAINASE,
  IMG_KERJA_BAKTI,
  IG_POST_1,
  IG_POST_6,
  IG_POST_8,
} from '../data/initialData';
import { resolveImageUrl } from '../utils/resolveImageUrl';
import { compressImageFile } from '../utils/compressImage';

interface AdminBioporiPanelProps {
  bioporiPoints: BioporiPoint[];
  onCreateBioporiPoint: (point: Partial<BioporiPoint>) => Promise<{ ok: boolean; errors?: string[] }>;
  onUpdateBioporiPoint: (id: string, point: Partial<BioporiPoint>) => Promise<{ ok: boolean; errors?: string[] }>;
  onDeleteBioporiPoint: (id: string) => Promise<{ ok: boolean; errors?: string[] }>;
}

const RW_OPTIONS = ['RW 01', 'RW 02', 'RW 03', 'RW 04', 'RW 05', 'RW 06', 'RW 07'];
const RT_OPTIONS = [
  'RT 01',
  'RT 02',
  'RT 03',
  'RT 04',
  'RT 05',
  'RT 06',
  'RT 07',
  'RT 08',
  'RT 09',
  'RT 10',
  'RT 11',
];

const STATUS_OPTIONS: BioporiStatus[] = [
  'Aktif Digunakan',
  'Siap Panen Kompos',
  'Penuh Kompos',
  'Perlu Perawatan',
];

const QUICK_PHOTO_PRESETS = [
  { label: 'Biopori Komunal Asri (Pekarangan)', url: IMG_BANK_SAMPAH },
  { label: 'Biopori Taman Jalur Hijau', url: IG_POST_6 },
  { label: 'Lubang Peresapan Drainase', url: IMG_DRAINASE },
  { label: 'Gotong Royong Lubang Biopori', url: IMG_KERJA_BAKTI },
  { label: 'Edukasi Kompos Organik', url: IG_POST_8 },
  { label: 'Biopori Kebun Bibit RW', url: IG_POST_1 },
];

export const AdminBioporiPanel: React.FC<AdminBioporiPanelProps> = ({
  bioporiPoints,
  onCreateBioporiPoint,
  onUpdateBioporiPoint,
  onDeleteBioporiPoint,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRw, setFilterRw] = useState('Semua');
  const [filterStatus, setFilterStatus] = useState('Semua');

  // Form State
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [formSuccessMessage, setFormSuccessMessage] = useState<string | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [rw, setRw] = useState('RW 01');
  const [rt, setRt] = useState('RT 01');
  const [address, setAddress] = useState('');
  const [locationTag, setLocationTag] = useState('');
  const [totalHoles, setTotalHoles] = useState<number>(30);
  const [diameterCm, setDiameterCm] = useState<number>(10);
  const [depthCm, setDepthCm] = useState<number>(100);
  const [organicTypes, setOrganicTypes] = useState(
    'Dedaunan kering, sisa sayur dapur, kulit buah, sisa ampas kopi dan teh'
  );
  const [status, setStatus] = useState<BioporiStatus>('Aktif Digunakan');
  const [coordinatorName, setCoordinatorName] = useState('');
  const [coordinatorPhone, setCoordinatorPhone] = useState('');
  const [mapUrl, setMapUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [documentationPhotos, setDocumentationPhotos] = useState<string[]>([]);
  const [installationDate, setInstallationDate] = useState('15 Januari 2026');
  const [harvestHistory, setHarvestHistory] = useState('Panen kompos perdana 45 kg (Agustus 2026)');
  const [notes, setNotes] = useState('');

  // Delete modal state
  const [deleteCandidate, setDeleteCandidate] = useState<BioporiPoint | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Preview Photo Modal
  const [previewPhoto, setPreviewPhoto] = useState<{ title: string; url: string } | null>(null);

  // Filtered biopori points
  const filteredPoints = useMemo(() => {
    return bioporiPoints.filter((pt) => {
      const matchSearch =
        searchQuery.trim() === '' ||
        pt.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pt.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pt.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pt.locationTag.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (pt.coordinatorName && pt.coordinatorName.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchRw = filterRw === 'Semua' || pt.rw === filterRw;
      const matchStatus = filterStatus === 'Semua' || pt.status === filterStatus;

      return matchSearch && matchRw && matchStatus;
    });
  }, [bioporiPoints, searchQuery, filterRw, filterStatus]);

  // Aggregate statistics
  const stats = useMemo(() => {
    const totalTitik = bioporiPoints.length;
    const totalLubang = bioporiPoints.reduce((acc, p) => acc + (p.totalHoles || 0), 0);
    const aktifCount = bioporiPoints.filter((p) => p.status === 'Aktif Digunakan').length;
    const panenCount = bioporiPoints.filter((p) => p.status === 'Siap Panen Kompos').length;
    const rawatCount = bioporiPoints.filter((p) => p.status === 'Perlu Perawatan').length;
    return { totalTitik, totalLubang, aktifCount, panenCount, rawatCount };
  }, [bioporiPoints]);

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setCode('');
    setRw('RW 01');
    setRt('RT 01');
    setAddress('');
    setLocationTag('');
    setTotalHoles(30);
    setDiameterCm(10);
    setDepthCm(100);
    setOrganicTypes('Dedaunan kering, sisa sayur dapur, kulit buah, sisa ampas kopi dan teh');
    setStatus('Aktif Digunakan');
    setCoordinatorName('');
    setCoordinatorPhone('');
    setMapUrl('');
    setImageUrl(IMG_BANK_SAMPAH);
    setDocumentationPhotos([]);
    setInstallationDate('15 Januari 2026');
    setHarvestHistory('Panen kompos perdana 45 kg (Agustus 2026)');
    setNotes('');
    setFormErrors([]);
  };

  const handleOpenCreate = () => {
    resetForm();
    setShowFormModal(true);
  };

  const handleOpenEdit = (point: BioporiPoint) => {
    setEditingId(point.id);
    setName(point.name);
    setCode(point.code);
    setRw(point.rw);
    setRt(point.rt);
    setAddress(point.address);
    setLocationTag(point.locationTag);
    setTotalHoles(point.totalHoles);
    setDiameterCm(point.diameterCm);
    setDepthCm(point.depthCm);
    setOrganicTypes(point.organicTypes);
    setStatus(point.status);
    setCoordinatorName(point.coordinatorName);
    setCoordinatorPhone(point.coordinatorPhone || '');
    setMapUrl(point.mapUrl || '');
    setImageUrl(point.imageUrl);
    setDocumentationPhotos(point.documentationPhotos || []);
    setInstallationDate(point.installationDate || '15 Januari 2026');
    setHarvestHistory(point.harvestHistory || '');
    setNotes(point.notes || '');
    setFormErrors([]);
    setShowFormModal(true);
  };

  const handleMainPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await compressImageFile(file);
      setImageUrl(dataUrl);
    } catch {
      setFormErrors(['Gagal memproses file foto. Pastikan format foto valid.']);
    }
  };

  const handleDocumentationPhotosUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    try {
      const newPhotos: string[] = [];
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) continue;
        const compressed = await compressImageFile(file);
        newPhotos.push(compressed);
      }
      setDocumentationPhotos((prev) => [...prev, ...newPhotos]);
    } catch {
      setFormErrors(['Gagal mengunggah beberapa foto dokumentasi.']);
    }
  };

  const handleRemoveDocPhoto = (idx: number) => {
    setDocumentationPhotos((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors([]);
    setFormSuccessMessage(null);

    const errs: string[] = [];
    if (!name.trim()) errs.push('Nama titik biopori wajib diisi.');
    if (!address.trim()) errs.push('Alamat lengkap lokasi biopori wajib diisi.');
    if (!locationTag.trim()) errs.push('Tag patokan lokasi wajib diisi.');
    if (!coordinatorName.trim()) errs.push('Nama koordinator/penanggung jawab wajib diisi.');
    if (totalHoles <= 0) errs.push('Jumlah lubang biopori harus lebih dari 0.');

    if (errs.length > 0) {
      setFormErrors(errs);
      return;
    }

    setIsSubmitting(true);

    const generatedCode =
      code.trim() ||
      `BPR-${rw.replace(/\s+/g, '')}-${String(Math.floor(Math.random() * 90) + 10)}`;

    const pointPayload: Partial<BioporiPoint> = {
      name: name.trim(),
      code: generatedCode,
      rw,
      rt,
      address: address.trim(),
      locationTag: locationTag.trim(),
      totalHoles: Number(totalHoles),
      diameterCm: Number(diameterCm) || 10,
      depthCm: Number(depthCm) || 100,
      organicTypes: organicTypes.trim(),
      status,
      coordinatorName: coordinatorName.trim(),
      coordinatorPhone: coordinatorPhone.trim() || undefined,
      mapUrl: mapUrl.trim() || undefined,
      imageUrl: imageUrl.trim() || IMG_BANK_SAMPAH,
      documentationPhotos,
      installationDate: installationDate.trim() || '15 Januari 2026',
      harvestHistory: harvestHistory.trim() || undefined,
      notes: notes.trim() || undefined,
    };

    let res: { ok: boolean; errors?: string[] };
    if (editingId) {
      res = await onUpdateBioporiPoint(editingId, pointPayload);
    } else {
      res = await onCreateBioporiPoint(pointPayload);
    }

    setIsSubmitting(false);

    if (res.ok) {
      setShowFormModal(false);
      setFormSuccessMessage(
        editingId
          ? `Titik Biopori "${pointPayload.name}" berhasil diperbarui.`
          : `Titik Biopori baru "${pointPayload.name}" berhasil ditambahkan.`
      );
      setTimeout(() => setFormSuccessMessage(null), 4000);
    } else {
      setFormErrors(res.errors || ['Gagal menyimpan data titik biopori. Silakan coba lagi.']);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteCandidate) return;
    setIsDeleting(true);
    const res = await onDeleteBioporiPoint(deleteCandidate.id);
    setIsDeleting(false);
    if (res.ok) {
      setDeleteCandidate(null);
      setFormSuccessMessage(`Titik Biopori "${deleteCandidate.name}" berhasil dihapus.`);
      setTimeout(() => setFormSuccessMessage(null), 4000);
    } else {
      alert(res.errors?.[0] || 'Gagal menghapus data titik biopori.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner and Actions */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-[#146329]">
              Manajemen Data Biopori (LRB)
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Kelurahan Panaikang · Kota Makassar
            </span>
          </div>
          <h2 className="text-lg font-bold text-[#0D3868] mt-1">
            Data Sebaran Lubang Resapan Biopori (LRB)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola titik sebaran biopori RW/RT, jumlah lubang, dimensi, status kesiapan panen kompos, dan dokumentasi foto lapangan.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#1C8237] hover:bg-[#146329] text-white text-xs sm:text-sm font-bold shadow-xs transition-colors cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Titik Biopori Baru</span>
        </button>
      </div>

      {/* Success Notification */}
      {formSuccessMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{formSuccessMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setFormSuccessMessage(null)}
            className="text-emerald-700 hover:text-emerald-900 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Aggregated Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="p-4 rounded-2xl bg-white border border-slate-200">
          <div className="text-[11px] font-semibold text-slate-500">Total Titik Biopori</div>
          <div className="text-2xl font-black text-[#0D3868] font-mono-num mt-1">
            {stats.totalTitik}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Klaster RW Terdaftar</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200">
          <div className="text-[11px] font-semibold text-slate-500">Total Lubang (LRB)</div>
          <div className="text-2xl font-black text-emerald-700 font-mono-num mt-1">
            {stats.totalLubang}
          </div>
          <div className="text-[10px] text-emerald-600 mt-0.5 font-medium">Lubang Silinder Resapan</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200">
          <div className="text-[11px] font-semibold text-slate-500">Aktif Digunakan</div>
          <div className="text-2xl font-black text-sky-700 font-mono-num mt-1">
            {stats.aktifCount}
          </div>
          <div className="text-[10px] text-sky-600 mt-0.5 font-medium">Meresapkan Sampah Organik</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200">
          <div className="text-[11px] font-semibold text-slate-500">Siap Panen Kompos</div>
          <div className="text-2xl font-black text-amber-600 font-mono-num mt-1">
            {stats.panenCount}
          </div>
          <div className="text-[10px] text-amber-600 mt-0.5 font-medium">Penuh Matang / Kompos Jadi</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 col-span-2 lg:col-span-1">
          <div className="text-[11px] font-semibold text-slate-500">Perlu Perawatan</div>
          <div className="text-2xl font-black text-rose-600 font-mono-num mt-1">
            {stats.rawatCount}
          </div>
          <div className="text-[10px] text-rose-600 mt-0.5 font-medium">Pembersihan / Penggantian Tutup</div>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari titik biopori, RW, RT, alamat, tag lokasi, atau koordinator..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50/50"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
            >
              ×
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* RW Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={filterRw}
              onChange={(e) => setFilterRw(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="Semua">Semua RW</option>
              {RW_OPTIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="Semua">Semua Status</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Biopori Points Table and Cards */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="px-5 py-3.5 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
          <div className="text-xs font-bold text-slate-700 flex items-center gap-2">
            <span>Daftar Titik Biopori Terdata ({filteredPoints.length} Titik)</span>
          </div>
          <span className="text-[11px] text-slate-500">
            Terakhir diperbarui: Oktober 2026
          </span>
        </div>

        {filteredPoints.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Layers className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <div className="text-sm font-semibold text-slate-700">Tidak ada titik biopori ditemukan</div>
            <p className="text-xs text-slate-400 mt-1">
              Sesuaikan kata kunci pencarian atau filter wilayah RW di atas.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredPoints.map((pt) => {
              const statusColor =
                pt.status === 'Aktif Digunakan'
                  ? 'bg-emerald-100 text-[#146329] border-emerald-200'
                  : pt.status === 'Siap Panen Kompos'
                  ? 'bg-amber-100 text-amber-800 border-amber-200'
                  : pt.status === 'Penuh Kompos'
                  ? 'bg-sky-100 text-sky-800 border-sky-200'
                  : 'bg-rose-100 text-rose-800 border-rose-200';

              return (
                <div
                  key={pt.id}
                  className="p-4 sm:p-5 hover:bg-slate-50/70 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-4 min-w-0 flex-1">
                    {/* Photo Thumbnail */}
                    <div
                      onClick={() =>
                        setPreviewPhoto({
                          title: pt.name,
                          url: pt.imageUrl,
                        })
                      }
                      className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0 cursor-pointer group"
                    >
                      <img
                        src={resolveImageUrl(pt.imageUrl)}
                        alt={pt.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                        <ImageIcon className="w-4 h-4" />
                      </div>
                      <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/70 text-[9px] font-bold text-white">
                        {pt.totalHoles} Lubang
                      </span>
                    </div>

                    {/* Details */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold font-mono-num bg-slate-200 text-slate-800">
                          {pt.code}
                        </span>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#0D3868]/10 text-[#0D3868]">
                          {pt.rw} · {pt.rt}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusColor}`}
                        >
                          {pt.status}
                        </span>
                      </div>

                      <h3 className="text-sm sm:text-base font-bold text-[#0D3868] mt-1.5">
                        {pt.name}
                      </h3>

                      <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="truncate">{pt.address}</span>
                        <span className="hidden sm:inline text-slate-400">·</span>
                        <span className="hidden sm:inline font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                          {pt.locationTag}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 mt-2 text-[11px] text-slate-500">
                        <div>
                          <strong className="text-slate-700">Dimensi Lubang:</strong>{' '}
                          ⌀ {pt.diameterCm} cm × Kedalaman {pt.depthCm} cm
                        </div>
                        <div>
                          <strong className="text-slate-700">Koordinator:</strong>{' '}
                          {pt.coordinatorName}{' '}
                          {pt.coordinatorPhone ? `(${pt.coordinatorPhone})` : ''}
                        </div>
                        {pt.harvestHistory && (
                          <div className="sm:col-span-2 text-slate-600 italic">
                            Panen: {pt.harvestHistory}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(pt)}
                      className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-xs font-semibold text-slate-700 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Edit & Foto</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeleteCandidate(pt)}
                      className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-rose-200 bg-rose-50/60 hover:bg-rose-100 text-xs font-semibold text-rose-700 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Form Modal: Tambah / Edit Titik Biopori */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-3xl my-8 overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-[#146329] flex items-center justify-center font-bold">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#0D3868]">
                    {editingId ? 'Edit Data Titik Biopori' : 'Tambah Titik Biopori Baru'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Lengkapi atribut data teknis, lokasi, koordinator, dan dokumentasi foto.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowFormModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmitForm} className="p-6 space-y-4 overflow-y-auto flex-1">
              {formErrors.length > 0 && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>Mohon lengkapi data berikut:</span>
                  </div>
                  <ul className="list-disc pl-5 space-y-0.5">
                    {formErrors.map((err, idx) => (
                      <li key={idx}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Basic Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Titik Biopori *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Contoh: Klaster Biopori Asri RW 01"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kode Titik (Opsional)
                  </label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Contoh: BPR-RW01-01"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs sm:text-sm font-mono-num focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* RW & RT & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Wilayah RW *
                  </label>
                  <select
                    value={rw}
                    onChange={(e) => setRw(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {RW_OPTIONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Wilayah RT *
                  </label>
                  <select
                    value={rt}
                    onChange={(e) => setRt(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {RT_OPTIONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Status Biopori *
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as BioporiStatus)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs sm:text-sm bg-white font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Address & Tag Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Alamat Lengkap *
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Contoh: Jl. Urip Sumoharjo Lr. 7 No. 12"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tag Patokan Lokasi *
                  </label>
                  <input
                    type="text"
                    value={locationTag}
                    onChange={(e) => setLocationTag(e.target.value)}
                    placeholder="Contoh: Taman Depan Posyandu / Jalur Resapan Air"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
              </div>

              {/* Technical Dimensions: Total Holes, Diameter, Depth */}
              <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-3">
                <div className="text-xs font-bold text-[#146329] flex items-center gap-1.5">
                  <Layers className="w-4 h-4" />
                  <span>Kapasitas & Dimensi Lubang Resapan Biopori (LRB)</span>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Jumlah Lubang (LRB) *
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={totalHoles}
                      onChange={(e) => setTotalHoles(Number(e.target.value))}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs sm:text-sm font-mono-num focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Diameter (cm)
                    </label>
                    <input
                      type="number"
                      min="5"
                      value={diameterCm}
                      onChange={(e) => setDiameterCm(Number(e.target.value))}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs sm:text-sm font-mono-num focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Kedalaman (cm)
                    </label>
                    <input
                      type="number"
                      min="30"
                      value={depthCm}
                      onChange={(e) => setDepthCm(Number(e.target.value))}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs sm:text-sm font-mono-num focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Jenis Sampah Organik yang Diolah
                  </label>
                  <input
                    type="text"
                    value={organicTypes}
                    onChange={(e) => setOrganicTypes(e.target.value)}
                    placeholder="Contoh: Sisa sayur, dedaunan kering, kulit buah, ampas teh/kopi"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Coordinator Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Koordinator / PIC Lapangan *
                  </label>
                  <input
                    type="text"
                    value={coordinatorName}
                    onChange={(e) => setCoordinatorName(e.target.value)}
                    placeholder="Contoh: Daeng Sulo / Ketua RT 02"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nomor WhatsApp / HP Koordinator
                  </label>
                  <input
                    type="text"
                    value={coordinatorPhone}
                    onChange={(e) => setCoordinatorPhone(e.target.value)}
                    placeholder="Contoh: 081234567890"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs sm:text-sm font-mono-num focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Dates & History */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tanggal Pemasangan / Pembuatan
                  </label>
                  <input
                    type="text"
                    value={installationDate}
                    onChange={(e) => setInstallationDate(e.target.value)}
                    placeholder="Contoh: 15 Januari 2026"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Riwayat Panen / Kompos Terakhir
                  </label>
                  <input
                    type="text"
                    value={harvestHistory}
                    onChange={(e) => setHarvestHistory(e.target.value)}
                    placeholder="Contoh: Panen kompos 45 kg (Agustus 2026)"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Photo Upload & Presets */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Camera className="w-4 h-4 text-emerald-600" />
                      <span>Foto Utama Titik Biopori *</span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Unggah foto dokumentasi lokasi biopori atau pilih preset foto kelurahan.
                    </p>
                  </div>
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold cursor-pointer shrink-0">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Foto Baru</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleMainPhotoUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Preset Options */}
                <div>
                  <div className="text-[11px] font-semibold text-slate-600 mb-1.5">
                    Pilihan Preset Foto Lapangan Cepat:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_PHOTO_PRESETS.map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => setImageUrl(preset.url)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                          imageUrl === preset.url
                            ? 'bg-emerald-700 text-white'
                            : 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Current Photo Preview */}
                {imageUrl && (
                  <div className="relative w-full h-40 sm:h-48 rounded-xl overflow-hidden border border-slate-200 bg-black/5">
                    <img
                      src={resolveImageUrl(imageUrl)}
                      alt="Preview Titik Biopori"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/60 text-white text-[10px] font-semibold">
                      Foto Utama Aktif
                    </div>
                  </div>
                )}

                {/* Documentation Gallery Photos */}
                <div className="pt-2 border-t border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-700">
                      Foto Dokumentasi Tambahan ({documentationPhotos.length})
                    </span>
                    <label className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold cursor-pointer">
                      <Plus className="w-3 h-3" />
                      <span>Tambah Foto Galeri</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleDocumentationPhotosUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {documentationPhotos.length > 0 && (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {documentationPhotos.map((photo, idx) => (
                        <div
                          key={idx}
                          className="relative h-20 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 group"
                        >
                          <img
                            src={resolveImageUrl(photo)}
                            alt={`Dokumentasi ${idx + 1}`}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveDocPhoto(idx)}
                            className="absolute top-1 right-1 w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center text-xs font-bold cursor-pointer"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Catatan / Panduan Teknis Lapangan
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Catatan tambahan kondisi tanah, debit resapan saat hujan, dll."
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Modal Footer Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#1C8237] hover:bg-[#146329] text-white text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>
                    {isSubmitting
                      ? 'Menyimpan...'
                      : editingId
                      ? 'Simpan Perubahan Biopori'
                      : 'Validasi & Tambah Biopori'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="text-base font-bold text-slate-900">
                Hapus Titik Biopori?
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Apakah Anda yakin ingin menghapus data titik biopori{' '}
                <strong className="text-slate-800">
                  {deleteCandidate.name} ({deleteCandidate.rw})
                </strong>
                ? Data lubang resapan dan riwayat panen terkait akan dihapus secara permanen.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteCandidate(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? 'Menghapus...' : 'Ya, Hapus Data'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Photo Preview Modal */}
      {previewPhoto && (
        <div
          onClick={() => setPreviewPhoto(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm cursor-zoom-out"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-2xl w-full bg-white rounded-3xl overflow-hidden shadow-2xl"
          >
            <div className="relative aspect-4/3 bg-black">
              <img
                src={resolveImageUrl(previewPhoto.url)}
                alt={previewPhoto.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain"
              />
              <button
                type="button"
                onClick={() => setPreviewPhoto(null)}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/70 text-white flex items-center justify-center font-bold hover:bg-black cursor-pointer"
              >
                ×
              </button>
            </div>
            <div className="p-4 bg-white flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-800">{previewPhoto.title}</h4>
                <p className="text-xs text-slate-500">Dokumentasi Lapangan Biopori Kelurahan Panaikang</p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewPhoto(null)}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
