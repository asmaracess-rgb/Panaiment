import React, { useState, useMemo } from 'react';
import {
  Sprout,
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
  Scale,
  Calendar,
  Layers,
  Image as ImageIcon,
} from 'lucide-react';
import { TebaSpot, TebaStatus } from '../types';
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

interface AdminTebaPanelProps {
  tebaSpots: TebaSpot[];
  onCreateTebaSpot: (spot: Partial<TebaSpot>) => Promise<{ ok: boolean; errors?: string[] }>;
  onUpdateTebaSpot: (id: string, spot: Partial<TebaSpot>) => Promise<{ ok: boolean; errors?: string[] }>;
  onDeleteTebaSpot: (id: string) => Promise<{ ok: boolean; errors?: string[] }>;
}

const RW_OPTIONS = ['RW 01', 'RW 02', 'RW 03', 'RW 04', 'RW 05', 'RW 06', 'RW 07'];

const STATUS_OPTIONS: TebaStatus[] = [
  'Aktif Beroperasi',
  'Penuh / Masa Pengomposan',
  'Perawatan & Pembersihan',
  'Rencana Pembangunan',
];

const QUICK_PHOTO_PRESETS = [
  { label: 'Teba Komunal 1 (Standard Biopori)', url: IMG_BANK_SAMPAH },
  { label: 'Teba Komunal 2 (Area Hijau)', url: IG_POST_6 },
  { label: 'Teba Komunal 3 (Peresapan Organik)', url: IMG_DRAINASE },
  { label: 'Teba Komunal 4 (Pemilahan Bersama)', url: IMG_KERJA_BAKTI },
  { label: 'Teba Komunal 5 (Edukasi Warga)', url: IG_POST_8 },
  { label: 'Teba Komunal 6 (Kebun Bibit)', url: IG_POST_1 },
];

export const AdminTebaPanel: React.FC<AdminTebaPanelProps> = ({
  tebaSpots,
  onCreateTebaSpot,
  onUpdateTebaSpot,
  onDeleteTebaSpot,
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
  const [mapUrl, setMapUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [documentationPhotos, setDocumentationPhotos] = useState<string[]>([]);
  const [capacityKg, setCapacityKg] = useState<number>(350);
  const [currentLoadKg, setCurrentLoadKg] = useState<number>(120);
  const [wasteTypeProcessed, setWasteTypeProcessed] = useState(
    'Sisa sayuran dapur, dedaunan kering, kulit buah, dan ampas kopi'
  );
  const [coordinatorName, setCoordinatorName] = useState('');
  const [coordinatorPhone, setCoordinatorPhone] = useState('');
  const [status, setStatus] = useState<TebaStatus>('Aktif Beroperasi');
  const [description, setDescription] = useState('');
  const [lastHarvestDate, setLastHarvestDate] = useState('');

  // Delete modal state
  const [deleteCandidate, setDeleteCandidate] = useState<TebaSpot | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Preview Photo Modal
  const [previewPhoto, setPreviewPhoto] = useState<{ title: string; url: string } | null>(null);

  // Filtered spots
  const filteredSpots = useMemo(() => {
    return tebaSpots.filter((spot) => {
      const matchSearch =
        searchQuery.trim() === '' ||
        spot.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        spot.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        spot.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        spot.locationTag.toLowerCase().includes(searchQuery.toLowerCase()) ||
        spot.coordinatorName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchRw = filterRw === 'Semua' || spot.rw === filterRw;
      const matchStatus = filterStatus === 'Semua' || spot.status === filterStatus;

      return matchSearch && matchRw && matchStatus;
    });
  }, [tebaSpots, searchQuery, filterRw, filterStatus]);

  // Reset form
  const resetForm = () => {
    setEditingId(null);
    setName('');
    setCode('');
    setRw('RW 01');
    setRt('RT 01');
    setAddress('');
    setLocationTag('');
    setMapUrl('');
    setImageUrl(IMG_BANK_SAMPAH);
    setDocumentationPhotos([]);
    setCapacityKg(350);
    setCurrentLoadKg(100);
    setWasteTypeProcessed('Sisa sayuran dapur, dedaunan kering, kulit buah, dan ampas kopi');
    setCoordinatorName('');
    setCoordinatorPhone('');
    setStatus('Aktif Beroperasi');
    setDescription('');
    setLastHarvestDate('');
    setFormErrors([]);
  };

  const handleOpenCreate = () => {
    resetForm();
    setShowFormModal(true);
  };

  const handleOpenEdit = (spot: TebaSpot) => {
    setEditingId(spot.id);
    setName(spot.name);
    setCode(spot.code);
    setRw(spot.rw);
    setRt(spot.rt);
    setAddress(spot.address);
    setLocationTag(spot.locationTag);
    setMapUrl(spot.mapUrl || '');
    setImageUrl(spot.imageUrl);
    setDocumentationPhotos(spot.documentationPhotos || [spot.imageUrl]);
    setCapacityKg(spot.capacityKg);
    setCurrentLoadKg(spot.currentLoadKg);
    setWasteTypeProcessed(spot.wasteTypeProcessed);
    setCoordinatorName(spot.coordinatorName);
    setCoordinatorPhone(spot.coordinatorPhone);
    setStatus(spot.status);
    setDescription(spot.description);
    setLastHarvestDate(spot.lastHarvestDate || '');
    setFormErrors([]);
    setShowFormModal(true);
  };

  // Image upload handler
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressed = await compressImageFile(file, 1200, 0.78);
      setImageUrl(compressed);
      setDocumentationPhotos((prev) => [compressed, ...prev.filter((p) => p !== compressed)]);
    } catch {
      setFormErrors(['Gagal memproses file foto. Pastikan format gambar JPG/PNG valid.']);
    } finally {
      e.target.value = '';
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors([]);

    const errors: string[] = [];
    if (!name.trim()) errors.push('Nama Titik Teba wajib diisi.');
    if (!address.trim()) errors.push('Alamat lengkap titik Teba wajib diisi.');
    if (!locationTag.trim()) errors.push('Tag / patokan lokasi wajib diisi.');
    if (!imageUrl.trim()) errors.push('Foto titik Teba wajib diunggah atau dipilih.');

    if (errors.length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    const spotPayload: Partial<TebaSpot> = {
      name: name.trim(),
      code: code.trim() || `TEBA-${rw.replace(/\s+/g, '')}-${Date.now().toString().slice(-3)}`,
      rw,
      rt: rt.trim() || 'RT 01',
      address: address.trim(),
      locationTag: locationTag.trim(),
      mapUrl: mapUrl.trim(),
      imageUrl: imageUrl.trim(),
      documentationPhotos:
        documentationPhotos.length > 0 ? documentationPhotos : [imageUrl.trim()],
      capacityKg: Math.max(10, Number(capacityKg) || 300),
      currentLoadKg: Math.max(0, Number(currentLoadKg) || 0),
      wasteTypeProcessed: wasteTypeProcessed.trim(),
      coordinatorName: coordinatorName.trim() || `Kader Lingkungan ${rw}`,
      coordinatorPhone: coordinatorPhone.trim(),
      status,
      description:
        description.trim() ||
        `Fasilitas teba komunal biopori resapan organik mandiri warga ${rw} Kelurahan Panaikang.`,
      lastHarvestDate: lastHarvestDate.trim() || 'Belum ada panen',
    };

    try {
      if (editingId) {
        const res = await onUpdateTebaSpot(editingId, spotPayload);
        if (res.ok) {
          setFormSuccessMessage(`Titik Teba "${name}" berhasil diperbarui.`);
          setShowFormModal(false);
          resetForm();
        } else if (res.errors) {
          setFormErrors(res.errors);
        }
      } else {
        const res = await onCreateTebaSpot(spotPayload);
        if (res.ok) {
          setFormSuccessMessage(`Titik Teba baru "${name}" berhasil ditambahkan.`);
          setShowFormModal(false);
          resetForm();
        } else if (res.errors) {
          setFormErrors(res.errors);
        }
      }
    } catch {
      setFormErrors(['Terjadi kesalahan koneksi saat menyimpan data titik Teba.']);
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setFormSuccessMessage(null), 5000);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteCandidate) return;
    setIsDeleting(true);
    try {
      const res = await onDeleteTebaSpot(deleteCandidate.id);
      if (res.ok) {
        setFormSuccessMessage(`Titik Teba "${deleteCandidate.name}" berhasil dihapus.`);
        setDeleteCandidate(null);
      } else if (res.errors) {
        setFormErrors(res.errors);
      }
    } catch {
      setFormErrors(['Gagal menghapus data titik Teba.']);
    } finally {
      setIsDeleting(false);
      setTimeout(() => setFormSuccessMessage(null), 5000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Action */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-emerald-100 text-[#1C8237]">
                <Sprout className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-[#0D3868]">
                  Manajemen Data Titik Teba Komunal Kelurahan Panaikang
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Kelola sebaran lokasi titik teba organik komunal, tag patokan, foto dokumentasi, dan status operasional.
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#1C8237] hover:bg-[#146329] text-white text-xs sm:text-sm font-bold shadow-xs transition-colors cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Tambah Titik Teba Baru</span>
          </button>
        </div>

        {/* Stats Pill Row */}
        <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Total Titik Teba
            </span>
            <span className="text-xl font-extrabold text-slate-900 font-mono-num">
              {tebaSpots.length} Titik
            </span>
          </div>

          <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-200/80">
            <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider block">
              Aktif Beroperasi
            </span>
            <span className="text-xl font-extrabold text-[#1C8237] font-mono-num">
              {tebaSpots.filter((s) => s.status === 'Aktif Beroperasi').length} Titik
            </span>
          </div>

          <div className="bg-amber-50 rounded-xl p-3 border border-amber-200/80">
            <span className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider block">
              Penuh / Kompos
            </span>
            <span className="text-xl font-extrabold text-amber-700 font-mono-num">
              {tebaSpots.filter((s) => s.status === 'Penuh / Masa Pengomposan').length} Titik
            </span>
          </div>

          <div className="bg-sky-50 rounded-xl p-3 border border-sky-200/80">
            <span className="text-[11px] font-semibold text-sky-800 uppercase tracking-wider block">
              Total Kapasitas
            </span>
            <span className="text-xl font-extrabold text-sky-900 font-mono-num">
              {tebaSpots.reduce((acc, s) => acc + s.capacityKg, 0).toLocaleString('id-ID')} kg
            </span>
          </div>
        </div>
      </div>

      {/* Success Notification */}
      {formSuccessMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-semibold flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-700 shrink-0" />
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

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari titik teba, kode, alamat, tag lokasi..."
              className="w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>

          <div className="sm:col-span-4 flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 shrink-0">Wilayah:</span>
            <select
              value={filterRw}
              onChange={(e) => setFilterRw(e.target.value)}
              className="w-full text-xs sm:text-sm rounded-xl border border-slate-300 py-2 px-3 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="Semua">Semua Wilayah RW</option>
              {RW_OPTIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-3 flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 shrink-0">Status:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full text-xs sm:text-sm rounded-xl border border-slate-300 py-2 px-3 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
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

      {/* Spots List / Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900">Daftar Titik Teba Komunal</h3>
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold font-mono-num">
              {filteredSpots.length} Data
            </span>
          </div>
          {filteredSpots.length < tebaSpots.length && (
            <span className="text-xs text-slate-500">
              (Difilter dari total {tebaSpots.length} data)
            </span>
          )}
        </div>

        {filteredSpots.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Sprout className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold">Tidak ada data titik Teba yang sesuai.</p>
            <p className="text-xs text-slate-400 mt-1">Coba sesuaikan kata kunci pencarian atau filter wilayah.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-600">
                  <th className="py-3 px-4 w-28">Foto Lokasi</th>
                  <th className="py-3 px-4 min-w-[220px]">Nama Titik & Kode</th>
                  <th className="py-3 px-4 min-w-[240px]">Alamat & Tag Lokasi</th>
                  <th className="py-3 px-4 min-w-[140px]">Kapasitas & Beban</th>
                  <th className="py-3 px-4 min-w-[150px]">Status & Koordinator</th>
                  <th className="py-3 px-4 text-right w-28">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSpots.map((spot) => {
                  const percentFilled = Math.min(
                    100,
                    Math.round((spot.currentLoadKg / Math.max(spot.capacityKg, 1)) * 100)
                  );

                  return (
                    <tr key={spot.id} className="hover:bg-slate-50/75 transition-colors">
                      {/* Photo Thumbnail */}
                      <td className="py-3 px-4 align-top">
                        <div
                          onClick={() =>
                            setPreviewPhoto({
                              title: `${spot.name} (${spot.rw})`,
                              url: spot.imageUrl,
                            })
                          }
                          className="relative w-20 h-16 rounded-xl overflow-hidden border border-slate-200 group cursor-pointer bg-slate-100 shrink-0"
                          title="Klik untuk memperbesar foto"
                        >
                          <img
                            src={resolveImageUrl(spot.imageUrl)}
                            alt={spot.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          />
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                            <ImageIcon className="w-4 h-4" />
                          </div>
                        </div>
                      </td>

                      {/* Name & Code */}
                      <td className="py-3 px-4 align-top">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-slate-900 text-sm">{spot.name}</span>
                        </div>
                        <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono text-[10px] font-semibold border border-slate-200">
                            {spot.code}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                            {spot.rw} · {spot.rt}
                          </span>
                        </div>
                        <p className="mt-1 text-[11px] text-slate-500 line-clamp-2">
                          {spot.description}
                        </p>
                      </td>

                      {/* Address & Tag Lokasi */}
                      <td className="py-3 px-4 align-top">
                        <div className="text-slate-800 font-medium leading-relaxed">
                          {spot.address}
                        </div>
                        <div className="mt-1.5 flex items-start gap-1 p-1.5 rounded-lg bg-amber-50/80 border border-amber-200/70 text-amber-900 text-[11px]">
                          <MapPin className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                          <span className="font-semibold">{spot.locationTag}</span>
                        </div>
                        {spot.mapUrl && (
                          <a
                            href={spot.mapUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold text-[#0277BD] hover:underline"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>Buka Google Maps</span>
                          </a>
                        )}
                      </td>

                      {/* Capacity & Load */}
                      <td className="py-3 px-4 align-top">
                        <div className="flex items-baseline justify-between font-mono-num text-[11px]">
                          <span className="font-bold text-slate-800">{spot.currentLoadKg} kg</span>
                          <span className="text-slate-400">/ {spot.capacityKg} kg</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-1">
                          <div
                            className={`h-full rounded-full ${
                              percentFilled > 85
                                ? 'bg-amber-600'
                                : percentFilled > 60
                                ? 'bg-emerald-600'
                                : 'bg-emerald-500'
                            }`}
                            style={{ width: `${percentFilled}%` }}
                          />
                        </div>
                        <span className="mt-1 block text-[10px] text-slate-500 font-mono-num">
                          Terisi {percentFilled}%
                        </span>
                        <div className="mt-1.5 text-[10px] text-slate-500 line-clamp-2">
                          <span className="font-semibold">Olah:</span> {spot.wasteTypeProcessed}
                        </div>
                      </td>

                      {/* Status & Coordinator */}
                      <td className="py-3 px-4 align-top">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                            spot.status === 'Aktif Beroperasi'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : spot.status === 'Penuh / Masa Pengomposan'
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {spot.status}
                        </span>
                        <div className="mt-1.5 text-slate-800 font-medium">
                          {spot.coordinatorName}
                        </div>
                        {spot.coordinatorPhone && (
                          <div className="text-[11px] text-slate-500 font-mono-num flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{spot.coordinatorPhone}</span>
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 align-top text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(spot)}
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 cursor-pointer"
                            title="Edit data titik Teba"
                          >
                            <Edit3 className="w-4 h-4 text-[#0277BD]" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteCandidate(spot)}
                            className="p-1.5 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 cursor-pointer"
                            title="Hapus data titik Teba"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Tambah / Edit Titik Teba */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="px-6 py-4 bg-gradient-to-r from-emerald-800 to-teal-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sprout className="w-5 h-5" />
                <h3 className="text-base font-bold">
                  {editingId ? 'Edit Data Titik Teba Komunal' : 'Tambah Titik Teba Komunal Baru'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowFormModal(false)}
                className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {formErrors.length > 0 && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <span>Harap lengkapi kolom berikut:</span>
                  </div>
                  <ul className="list-disc list-inside pl-1 text-[11px] space-y-0.5">
                    {formErrors.map((err, idx) => (
                      <li key={idx}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Row 1: Nama & Kode */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama Titik Teba *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Contoh: Titik Teba Komunal RW 01 - Urip Sumoharjo"
                    className="w-full text-xs sm:text-sm rounded-xl border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Kode Registrasi
                  </label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Contoh: TEBA-RW01-01 (otomatis jika kosong)"
                    className="w-full text-xs sm:text-sm rounded-xl border border-slate-300 px-3 py-2 font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Row 2: RW & RT */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Wilayah RW *
                  </label>
                  <select
                    value={rw}
                    onChange={(e) => setRw(e.target.value)}
                    className="w-full text-xs sm:text-sm rounded-xl border border-slate-300 px-3 py-2 bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    {RW_OPTIONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Wilayah RT
                  </label>
                  <input
                    type="text"
                    value={rt}
                    onChange={(e) => setRt(e.target.value)}
                    placeholder="Contoh: RT 02"
                    className="w-full text-xs sm:text-sm rounded-xl border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Row 3: Alamat Lengkap & Tag Lokasi */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Alamat Lengkap Lokasi *
                </label>
                <textarea
                  rows={2}
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Contoh: Jl. Urip Sumoharjo No. 42, Belakang Kantor Posyandu RW 01"
                  className="w-full text-xs sm:text-sm rounded-xl border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tag Lokasi / Patokan Khusus *
                </label>
                <input
                  type="text"
                  required
                  value={locationTag}
                  onChange={(e) => setLocationTag(e.target.value)}
                  placeholder="Contoh: Depan Pos Ronda RT 02 / Samping Taman Bunga Mawar"
                  className="w-full text-xs sm:text-sm rounded-xl border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Patokan fisik yang mempermudah warga menemukan titik teba di lapangan.
                </span>
              </div>

              {/* Row 4: Google Maps Link */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Link Google Maps (Opsional)
                </label>
                <input
                  type="url"
                  value={mapUrl}
                  onChange={(e) => setMapUrl(e.target.value)}
                  placeholder="Contoh: https://maps.google.com/?q=-5.138450,119.447120"
                  className="w-full text-xs sm:text-sm rounded-xl border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* Row 5: Upload Foto & Presets */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-emerald-700" />
                    <span className="text-xs font-bold text-slate-800">
                      Foto Lokasi Titik Teba *
                    </span>
                  </div>
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1C8237] hover:bg-[#146329] text-white text-xs font-bold cursor-pointer">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Foto Baru</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Photo Preview */}
                {imageUrl && (
                  <div className="flex items-center gap-3">
                    <div className="relative w-24 h-20 rounded-xl overflow-hidden border-2 border-emerald-500 shrink-0 bg-slate-100">
                      <img
                        src={resolveImageUrl(imageUrl)}
                        alt="Preview Foto Teba"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="text-xs text-slate-600">
                      <span className="font-semibold text-emerald-800 block">
                        Foto Aktif Terpasang
                      </span>
                      <p className="text-[11px] text-slate-500">
                        Foto ini akan ditampilkan di kartu informasi lokasi titik teba publik.
                      </p>
                    </div>
                  </div>
                )}

                {/* Quick Presets */}
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 block mb-1.5">
                    Atau gunakan preset dokumentasi titik teba yang tersedia:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {QUICK_PHOTO_PRESETS.map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => {
                          setImageUrl(preset.url);
                          setDocumentationPhotos((prev) => [
                            preset.url,
                            ...prev.filter((p) => p !== preset.url),
                          ]);
                        }}
                        className={`flex items-center gap-2 p-1.5 rounded-lg border text-left cursor-pointer transition-colors ${
                          imageUrl === preset.url
                            ? 'bg-emerald-100 border-emerald-400 text-emerald-900 font-bold'
                            : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-700 text-[11px]'
                        }`}
                      >
                        <img
                          src={resolveImageUrl(preset.url)}
                          alt=""
                          className="w-8 h-8 rounded-md object-cover shrink-0"
                        />
                        <span className="truncate text-[10px] leading-tight">{preset.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Row 6: Kapasitas, Beban, Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Kapasitas Maksimal (Kg)
                  </label>
                  <input
                    type="number"
                    min={10}
                    value={capacityKg}
                    onChange={(e) => setCapacityKg(Number(e.target.value))}
                    className="w-full text-xs sm:text-sm rounded-xl border border-slate-300 px-3 py-2 font-mono-num focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Beban Terisi Saat Ini (Kg)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={currentLoadKg}
                    onChange={(e) => setCurrentLoadKg(Number(e.target.value))}
                    className="w-full text-xs sm:text-sm rounded-xl border border-slate-300 px-3 py-2 font-mono-num focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Status Operasional
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as TebaStatus)}
                    className="w-full text-xs sm:text-sm rounded-xl border border-slate-300 px-3 py-2 bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 7: Koordinator & Kontak */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama Koordinator / Kader
                  </label>
                  <input
                    type="text"
                    value={coordinatorName}
                    onChange={(e) => setCoordinatorName(e.target.value)}
                    placeholder="Contoh: Ibu Hartati (Kader Lingkungan)"
                    className="w-full text-xs sm:text-sm rounded-xl border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Kontak WhatsApp
                  </label>
                  <input
                    type="text"
                    value={coordinatorPhone}
                    onChange={(e) => setCoordinatorPhone(e.target.value)}
                    placeholder="Contoh: 0812-4210-8801"
                    className="w-full text-xs sm:text-sm rounded-xl border border-slate-300 px-3 py-2 font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Row 8: Jenis Sampah & Deskripsi */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Jenis Sampah Organik yang Diolah
                </label>
                <input
                  type="text"
                  value={wasteTypeProcessed}
                  onChange={(e) => setWasteTypeProcessed(e.target.value)}
                  placeholder="Contoh: Sisa sayuran dapur, dedaunan kering, kulit buah, dan ampas kopi"
                  className="w-full text-xs sm:text-sm rounded-xl border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Deskripsi / Catatan Teknis Titik Teba
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Keterangan diameter lubang, metode pengomposan (aerasi/maggot), frekuensi panen pupuk..."
                  className="w-full text-xs sm:text-sm rounded-xl border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* Footer Buttons */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#1C8237] hover:bg-[#146329] text-white text-xs sm:text-sm font-bold shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>{isSubmitting ? 'Menyimpan...' : editingId ? 'Simpan Perubahan' : 'Tambahkan Titik Teba'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Konfirmasi Hapus Titik Teba */}
      {deleteCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="p-2.5 rounded-full bg-red-100">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Hapus Titik Teba?</h3>
                <p className="text-xs text-slate-500">Tindakan ini tidak dapat dibatalkan.</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
              <div className="font-bold text-slate-800">{deleteCandidate.name}</div>
              <div className="text-slate-600">{deleteCandidate.address}</div>
              <div className="text-amber-800 font-semibold">{deleteCandidate.locationTag}</div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteCandidate(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? 'Menghapus...' : 'Ya, Hapus Data'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Preview Lightbox Foto */}
      {previewPhoto && (
        <div
          onClick={() => setPreviewPhoto(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm cursor-zoom-out"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-3xl w-full bg-white rounded-2xl overflow-hidden shadow-2xl cursor-default"
          >
            <div className="p-3 bg-slate-900 text-white flex items-center justify-between text-xs font-semibold">
              <span>{previewPhoto.title}</span>
              <button
                type="button"
                onClick={() => setPreviewPhoto(null)}
                className="p-1 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="max-h-[75vh] bg-slate-950 flex items-center justify-center">
              <img
                src={resolveImageUrl(previewPhoto.url)}
                alt={previewPhoto.title}
                className="max-h-[75vh] w-auto object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
