import React, { useState } from 'react';
import {
  ArrowLeft,
  MapPin,
  Users,
  CheckCircle2,
  UserPlus,
  Calendar,
  Plus,
  Camera,
  Image as ImageIcon,
  Clock,
  X,
} from 'lucide-react';
import { CleanupEvent, AppView } from '../types';
import { resolveImageUrl } from '../utils/resolveImageUrl';

interface MonitoringKerjaBaktiViewProps {
  cleanupEvents: CleanupEvent[];
  onJoinCleanup: (eventId: string, participantCount: number) => void;
  onAddCleanupEvent: (newEvent: Omit<CleanupEvent, 'id'>) => void;
  onNavigate: (view: AppView) => void;
}

export const MonitoringKerjaBaktiView: React.FC<MonitoringKerjaBaktiViewProps> = ({
  cleanupEvents,
  onJoinCleanup,
  onAddCleanupEvent,
  onNavigate,
}) => {
  const [filterStatus, setFilterStatus] = useState<'Semua' | 'Terjadwal' | 'Tuntas'>('Semua');
  const [joiningEventId, setJoiningEventId] = useState<string | null>(null);
  const [participantName, setParticipantName] = useState('');
  const [participantRt, setParticipantRt] = useState('RT 01');
  const [participantCount, setParticipantCount] = useState<number>(3);
  const [joinConfirmedId, setJoinConfirmedId] = useState<string | null>(null);
  const [activePhotoByEvent, setActivePhotoByEvent] = useState<Record<string, string>>({});
  const [lightboxItem, setLightboxItem] = useState<{
    photoUrl: string;
    event: CleanupEvent;
    photoIndex: number;
    totalPhotos: number;
  } | null>(null);

  // Add new scheduled cleanup state (scheduled events do NOT use photos)
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('Sabtu, 17 Oktober 2026');
  const [newRw, setNewRw] = useState('RW 01');
  const [newLocation, setNewLocation] = useState('');
  const [newTarget, setNewTarget] = useState<number>(80);

  // Separate Scheduled vs Completed Kerja Bakti
  const scheduledEvents = cleanupEvents.filter((ev) => ev.status !== 'Tuntas');
  const completedEvents = cleanupEvents.filter((ev) => ev.status === 'Tuntas');

  // Only completed Kerja Bakti (status === 'Tuntas') have documentation photos
  const allDocumentationGallery = completedEvents.flatMap((ev) => {
    const photos =
      Array.isArray(ev.documentationPhotos) && ev.documentationPhotos.length > 0
        ? ev.documentationPhotos.filter(Boolean)
        : ev.imageUrl
        ? [ev.imageUrl]
        : [];
    return photos.map((photoUrl, idx) => ({
      id: `${ev.id}-photo-${idx}`,
      photoUrl,
      photoIndex: idx + 1,
      totalPhotos: photos.length,
      event: ev,
    }));
  });

  const handleConfirmJoin = (e: React.FormEvent, eventId: string) => {
    e.preventDefault();
    if (!participantName.trim()) return;
    onJoinCleanup(eventId, Math.max(1, participantCount));
    setJoinConfirmedId(eventId);
    setJoiningEventId(null);
    setParticipantName('');
  };

  const handleCreateSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newLocation.trim()) return;
    // Kerja bakti terjadwal TIDAK menggunakan foto
    onAddCleanupEvent({
      title: newTitle.trim(),
      date: newDate.trim(),
      timeRange: '06:30 – 09:30 WITA',
      rw: newRw,
      rtScope: 'Seluruh RT',
      locationName: newLocation.trim(),
      mapX: 45,
      mapY: 52,
      coordinator: `Ketua ${newRw} & Satgas Kebersihan Panaikang`,
      status: 'Terjadwal',
      targetParticipants: Math.max(20, newTarget),
      registeredParticipants: 12,
      collectedWasteKg: 0,
      focusAreas: [
        'Pembersihan saluran drainase dan bahu jalan lingkungan',
        'Pengumpulan sampah terpilah untuk Bank Sampah Unit',
      ],
      equipmentNeeded: ['Sapu lidi', 'Cangkul / sekop', 'Kantong pilah sampah'],
      imageUrl: '',
      documentationPhotos: [],
      summaryNote: 'Agenda gotong royong terjadwal warga Kelurahan Panaikang.',
    });
    setNewTitle('');
    setNewLocation('');
    setShowAddForm(false);
  };

  const totalParticipants = cleanupEvents.reduce(
    (acc, ev) => acc + ev.registeredParticipants,
    0
  );
  const totalCollectedKg = completedEvents.reduce((acc, ev) => acc + ev.collectedWasteKg, 0);

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <button
            type="button"
            onClick={() => onNavigate('beranda')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#5E35B1] hover:text-[#4527A0] mb-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Portal Utama</span>
          </button>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0D3868] tracking-tight">
            Monitoring Kerja Bakti Kelurahan Panaikang
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Pemisahan agenda Kerja Bakti yang masih terjadwal (tanpa foto) dan Kerja Bakti yang
            telah selesai dilaksanakan beserta dokumentasi foto lapangan.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start">
          <button
            type="button"
            onClick={() => setShowAddForm((prev) => !prev)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#5E35B1] hover:bg-[#4527A0] text-white text-xs sm:text-sm font-bold transition-colors cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>{showAddForm ? 'Tutup Formulir' : 'Usulkan Jadwal Kerja Bakti'}</span>
          </button>
        </div>
      </div>

      {/* Summary Strip */}
      <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5">
          <div className="text-xs font-medium text-slate-500">Kerja Bakti Terjadwal</div>
          <div className="mt-1.5 text-2xl sm:text-3xl font-extrabold text-[#0D3868] font-mono-num">
            {scheduledEvents.length} Agenda
          </div>
          <div className="mt-1 text-xs text-slate-500">Jadwal akan datang (tanpa foto)</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5">
          <div className="text-xs font-medium text-slate-500">Telah Dilaksanakan</div>
          <div className="mt-1.5 text-2xl sm:text-3xl font-extrabold text-emerald-700 font-mono-num">
            {completedEvents.length} Kegiatan
          </div>
          <div className="mt-1 text-xs text-slate-500">Tuntas dengan lampiran foto</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5">
          <div className="text-xs font-medium text-slate-500">Sampah Terangkat (Tuntas)</div>
          <div className="mt-1.5 text-2xl sm:text-3xl font-extrabold text-[#1C8237] font-mono-num">
            {totalCollectedKg} kg
          </div>
          <div className="mt-1 text-xs text-slate-500">Total partisipasi {totalParticipants} warga</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5">
          <div className="text-xs font-medium text-slate-500">Foto Kegiatan Selesai</div>
          <div className="mt-1.5 text-2xl sm:text-3xl font-extrabold text-[#5E35B1] font-mono-num">
            {allDocumentationGallery.length} Foto
          </div>
          <div className="mt-1 text-xs text-slate-500">Khusus kegiatan yang telah selesai</div>
        </div>
      </div>

      {/* Optional Add Schedule Form (Scheduled = No Photo) */}
      {showAddForm && (
        <div className="mt-6 bg-white rounded-2xl border border-purple-200 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-[#0D3868]">
                Tambah Jadwal Kerja Bakti Terjadwal (Belum Dilaksanakan)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Catatan: Kerja bakti yang masih terjadwal tidak menggunakan foto. Foto dokumentasi
                hanya dilampirkan setelah kegiatan selesai dilaksanakan.
              </p>
            </div>
          </div>

          <form onSubmit={handleCreateSchedule} className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Kegiatan Kerja Bakti Terjadwal *
              </label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Contoh: Sabtu Bersih Drainase & Taman RW 01"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Hari & Tanggal Pelaksanaan *
              </label>
              <input
                type="text"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Wilayah RW Penyelenggara
              </label>
              <select
                value={newRw}
                onChange={(e) => setNewRw(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm bg-white"
              >
                <option value="RW 01">RW 01</option>
                <option value="RW 02">RW 02</option>
                <option value="RW 03">RW 03</option>
                <option value="RW 04">RW 04</option>
                <option value="RW 05">RW 05</option>
                <option value="RW 06">RW 06</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Lokasi Titik Kumpul *
              </label>
              <input
                type="text"
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
                placeholder="Contoh: Posko Kontainer Makassar Recover RW 01"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Target Jumlah Peserta (Orang)
              </label>
              <input
                type="number"
                min="10"
                value={newTarget}
                onChange={(e) => setNewTarget(Number(e.target.value) || 50)}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm font-mono-num"
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-[#5E35B1] hover:bg-[#4527A0] text-white text-xs sm:text-sm font-bold cursor-pointer"
              >
                Terbitkan Jadwal Kerja Bakti (Tanpa Foto)
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter Bar to Switch Between Both Sections or View Specifically */}
      <div className="mt-6 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setFilterStatus('Semua')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            filterStatus === 'Semua'
              ? 'bg-[#0D3868] text-white'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
          }`}
        >
          Tampilkan Semua Bagian ({cleanupEvents.length})
        </button>
        <button
          type="button"
          onClick={() => setFilterStatus('Terjadwal')}
          className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            filterStatus === 'Terjadwal'
              ? 'bg-[#5E35B1] text-white'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>1. Kerja Bakti Terjadwal — Tanpa Foto ({scheduledEvents.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setFilterStatus('Tuntas')}
          className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            filterStatus === 'Tuntas'
              ? 'bg-[#1C8237] text-white'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>2. Kerja Bakti Telah Dilaksanakan & Foto ({completedEvents.length})</span>
        </button>
      </div>

      {/* ================= BAGIAN 1: KERJA BAKTI YANG MASIH TERJADWAL (TANPA FOTO) ================= */}
      {(filterStatus === 'Semua' || filterStatus === 'Terjadwal') && (
        <section className="mt-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b-2 border-purple-200">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-[#5E35B1]">
                <Calendar className="w-4 h-4" />
                <span>BAGIAN 1 · AGENDA AKAN DATANG (TANPA LAMPIRAN FOTO)</span>
              </div>
              <h2 className="mt-1 text-xl font-extrabold text-[#0D3868]">
                Jadwal Kerja Bakti yang Masih Terjadwal ({scheduledEvents.length} Jadwal)
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Daftar rencana kerja bakti warga yang masih terjadwal dan belum dilaksanakan. Kegiatan
                terjadwal tidak menggunakan foto dokumentasi.
              </p>
            </div>
          </div>

          {scheduledEvents.length === 0 ? (
            <div className="mt-4 bg-white rounded-2xl border border-slate-200 p-6 text-center text-sm text-slate-500">
              Belum ada agenda kerja bakti terjadwal saat ini.
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-5">
              {scheduledEvents.map((ev) => {
                const participationPct = Math.min(
                  100,
                  Math.round(
                    (ev.registeredParticipants / Math.max(ev.targetParticipants, 1)) * 100
                  )
                );

                return (
                  <div
                    key={ev.id}
                    className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 flex flex-col justify-between shadow-xs"
                  >
                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 text-xs">
                        <div className="flex flex-wrap items-center gap-1.5 text-slate-600">
                          <span className="font-extrabold text-[#5E35B1]">{ev.rw}</span>
                          <span aria-hidden="true">·</span>
                          <span>{ev.rtScope}</span>
                        </div>
                        <span className="inline-flex items-center gap-1 font-bold text-amber-700">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Masih Terjadwal (Belum Dilaksanakan)</span>
                        </span>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-mono-num font-bold text-[#0D3868]">
                        <Calendar className="w-3.5 h-3.5 text-[#5E35B1]" />
                        <span>{ev.date}</span>
                        <span aria-hidden="true">·</span>
                        <span>{ev.timeRange}</span>
                      </div>

                      <h3 className="mt-2 text-base sm:text-lg font-extrabold text-slate-900 leading-snug">
                        {ev.title}
                      </h3>
                      <p className="mt-1.5 text-xs sm:text-sm text-slate-600 leading-relaxed">
                        {ev.summaryNote}
                      </p>

                      <div className="mt-3 space-y-1 text-xs text-slate-700">
                        <div className="flex items-start gap-1.5 font-medium">
                          <MapPin className="w-3.5 h-3.5 text-[#5E35B1] shrink-0 mt-0.5" />
                          <span>{ev.locationName}</span>
                        </div>
                        <div className="text-slate-500 pl-5">
                          Koordinator: <strong className="text-slate-800">{ev.coordinator}</strong>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div>
                          <div className="font-bold text-slate-800 mb-1">Sasaran Aksi:</div>
                          <ul className="space-y-0.5 text-slate-600 list-disc list-inside">
                            {ev.focusAreas.map((fa) => (
                              <li key={fa}>{fa}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <div className="font-bold text-slate-800 mb-1">Peralatan Warga:</div>
                          <div className="text-slate-600">{ev.equipmentNeeded.join(' · ')}</div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 pt-4 border-t border-slate-100 space-y-3">
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-slate-600 inline-flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-[#5E35B1]" />
                            Pendaftar Hadir Warga:
                          </span>
                          <span className="font-mono-num font-bold text-slate-900">
                            {ev.registeredParticipants} / {ev.targetParticipants} Peserta (
                            {participationPct}%)
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="bg-[#5E35B1] h-full transition-all"
                            style={{ width: `${participationPct}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        {joinConfirmedId === ev.id ? (
                          <span className="text-xs font-semibold text-emerald-700">
                            Kehadiran Anda telah tercatat!
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-500">
                            Terbuka bagi warga RT/RW setempat
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() =>
                            setJoiningEventId(joiningEventId === ev.id ? null : ev.id)
                          }
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#5E35B1] hover:bg-[#4527A0] text-white text-xs font-bold transition-colors cursor-pointer"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>Daftar Hadir Warga</span>
                        </button>
                      </div>

                      {joiningEventId === ev.id && (
                        <form
                          onSubmit={(e) => handleConfirmJoin(e, ev.id)}
                          className="p-3.5 rounded-xl bg-purple-50/70 border border-purple-200 grid grid-cols-1 sm:grid-cols-3 gap-2.5 items-end"
                        >
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                              Nama Warga *
                            </label>
                            <input
                              type="text"
                              value={participantName}
                              onChange={(e) => setParticipantName(e.target.value)}
                              placeholder="Nama Anda"
                              className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                              Asal RT & Jumlah
                            </label>
                            <div className="flex items-center gap-1.5">
                              <select
                                value={participantRt}
                                onChange={(e) => setParticipantRt(e.target.value)}
                                className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs"
                              >
                                <option value="RT 01">RT 01</option>
                                <option value="RT 02">RT 02</option>
                                <option value="RT 03">RT 03</option>
                                <option value="RT 04">RT 04</option>
                                <option value="RT 05">RT 05</option>
                              </select>
                              <input
                                type="number"
                                min="1"
                                max="25"
                                value={participantCount}
                                onChange={(e) =>
                                  setParticipantCount(Number(e.target.value) || 1)
                                }
                                className="w-16 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs font-mono-num"
                              />
                            </div>
                          </div>
                          <button
                            type="submit"
                            className="py-1.5 px-3 rounded-lg bg-[#5E35B1] text-white text-xs font-bold hover:bg-[#4527A0] cursor-pointer"
                          >
                            Konfirmasi
                          </button>
                        </form>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* ================= BAGIAN 2: KERJA BAKTI YANG TELAH DILAKSANAKAN (DENGAN LAMPIRAN FOTO) ================= */}
      {(filterStatus === 'Semua' || filterStatus === 'Tuntas') && (
        <section className="mt-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b-2 border-emerald-200">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-[#1C8237]">
                <Camera className="w-4 h-4" />
                <span>BAGIAN 2 · TELAH SELESAI DILAKSANAKAN (DENGAN DOKUMENTASI FOTO)</span>
              </div>
              <h2 className="mt-1 text-xl font-extrabold text-[#0D3868]">
                Kegiatan Kerja Bakti yang Telah Dilaksanakan ({completedEvents.length} Kegiatan ·{' '}
                {allDocumentationGallery.length} Foto)
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Hanya kegiatan kerja bakti yang telah selesai dilaksanakan yang melampirkan foto
                dokumentasi lapangan dan capaian pengangkutan sampah.
              </p>
            </div>
          </div>

          {/* Galeri Foto Dokumentasi Khusus Kegiatan yang Telah Dilaksanakan */}
          {allDocumentationGallery.length > 0 && (
            <div className="mt-5 bg-white rounded-2xl border border-slate-200 p-5 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Camera className="w-4 h-4 text-[#1C8237]" />
                  <h3 className="text-sm sm:text-base font-extrabold text-[#0D3868]">
                    Galeri Foto Kerja Bakti yang Telah Selesai Dilaksanakan
                  </h3>
                </div>
                <span className="text-xs font-semibold text-emerald-700 font-mono-num">
                  {allDocumentationGallery.length} Foto Dokumentasi Terlampir
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5">
                {allDocumentationGallery.map((item) => (
                  <div
                    key={item.id}
                    onClick={() =>
                      setLightboxItem({
                        photoUrl: item.photoUrl,
                        event: item.event,
                        photoIndex: item.photoIndex,
                        totalPhotos: item.totalPhotos,
                      })
                    }
                    className="group relative rounded-xl overflow-hidden border border-slate-200 bg-slate-100 cursor-pointer flex flex-col"
                  >
                    <div className="relative h-36 sm:h-40 w-full overflow-hidden bg-slate-900">
                      <img
                        src={resolveImageUrl(item.photoUrl)}
                        alt={item.event.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-200"
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/85 via-slate-950/35 to-transparent p-2.5">
                        <div className="text-[10px] font-bold text-emerald-300">
                          {item.event.rw} · {item.event.date}
                        </div>
                        <div className="text-xs font-bold text-white line-clamp-1">
                          {item.event.title}
                        </div>
                      </div>
                    </div>
                    <div className="p-2.5 bg-white flex items-center justify-between text-[11px] text-slate-600">
                      <span className="truncate font-medium">{item.event.locationName}</span>
                      <span className="font-mono-num font-bold text-emerald-700 shrink-0 ml-2">
                        {item.event.collectedWasteKg} kg
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Detailed Completed Event Cards with Attached Photos */}
          <div className="mt-5 space-y-5">
            {completedEvents.map((ev) => {
              const eventPhotos =
                Array.isArray(ev.documentationPhotos) && ev.documentationPhotos.length > 0
                  ? ev.documentationPhotos.filter(Boolean)
                  : ev.imageUrl
                  ? [ev.imageUrl]
                  : [];
              const currentMainPhoto = activePhotoByEvent[ev.id] || ev.imageUrl || eventPhotos[0];

              return (
                <div
                  key={ev.id}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden grid grid-cols-1 lg:grid-cols-12 shadow-xs"
                >
                  {/* Documentary Photo & Album Thumbnails Column (Only on Completed Events) */}
                  <div className="lg:col-span-5 bg-slate-950 border-b lg:border-b-0 lg:border-r border-slate-100 flex flex-col">
                    {currentMainPhoto ? (
                      <div
                        onClick={() =>
                          setLightboxItem({
                            photoUrl: currentMainPhoto,
                            event: ev,
                            photoIndex: Math.max(1, eventPhotos.indexOf(currentMainPhoto) + 1),
                            totalPhotos: eventPhotos.length,
                          })
                        }
                        className="relative h-60 sm:h-64 lg:flex-1 bg-slate-950 cursor-pointer group overflow-hidden flex items-center justify-center"
                      >
                        <img
                          src={resolveImageUrl(currentMainPhoto)}
                          alt=""
                          aria-hidden="true"
                          referrerPolicy="no-referrer"
                          className="absolute inset-0 w-full h-full object-cover blur-xl opacity-45 scale-110"
                        />
                        <img
                          src={resolveImageUrl(currentMainPhoto)}
                          alt={ev.title}
                          referrerPolicy="no-referrer"
                          className="relative z-10 max-h-full max-w-full object-contain group-hover:scale-[1.02] transition-transform duration-200"
                        />
                        <div className="absolute bottom-2.5 right-2.5 z-20 px-2.5 py-1 rounded-lg bg-slate-900/80 text-white text-[11px] font-semibold flex items-center gap-1">
                          <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{eventPhotos.length} Foto Pelaksanaan</span>
                        </div>
                      </div>
                    ) : (
                      <div className="h-56 flex items-center justify-center text-xs text-slate-400">
                        Belum ada foto dokumentasi
                      </div>
                    )}

                    {eventPhotos.length > 1 && (
                      <div className="p-2.5 bg-white border-t border-slate-100 flex items-center gap-2 overflow-x-auto">
                        {eventPhotos.map((photo, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() =>
                              setActivePhotoByEvent((prev) => ({ ...prev, [ev.id]: photo }))
                            }
                            className={`relative w-12 h-12 rounded-lg overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                              currentMainPhoto === photo
                                ? 'border-[#1C8237] scale-105'
                                : 'border-slate-200 opacity-75 hover:opacity-100'
                            }`}
                          >
                            <img
                              src={resolveImageUrl(photo)}
                              alt={`Dokumentasi ${idx + 1}`}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Completed Event Content Column */}
                  <div className="lg:col-span-7 p-6 flex flex-col justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span className="font-bold text-[#0D3868]">{ev.rw}</span>
                        <span aria-hidden="true">·</span>
                        <span>{ev.rtScope}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono-num font-medium text-slate-700">
                          {ev.date} ({ev.timeRange})
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="text-emerald-700 font-bold inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Telah Selesai Dilaksanakan ({ev.collectedWasteKg} kg sampah terangkat)
                        </span>
                      </div>

                      <h3 className="mt-2 text-lg sm:text-xl font-extrabold text-[#0D3868]">
                        {ev.title}
                      </h3>
                      <p className="mt-1.5 text-xs sm:text-sm text-slate-600 leading-relaxed">
                        {ev.summaryNote}
                      </p>

                      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-700">
                        <span className="inline-flex items-center gap-1 font-medium">
                          <MapPin className="w-3.5 h-3.5 text-[#1C8237]" />
                          {ev.locationName}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>Penanggung Jawab: {ev.coordinator}</span>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                        <div>
                          <div className="font-semibold text-slate-800 mb-1">
                            Hasil & Sasaran yang Diselesaikan:
                          </div>
                          <ul className="space-y-1 text-slate-600 list-disc list-inside">
                            {ev.focusAreas.map((fa) => (
                              <li key={fa}>{fa}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <div className="font-semibold text-slate-800 mb-1">
                            Capaian Pelaksanaan:
                          </div>
                          <div className="space-y-1 text-slate-600 font-mono-num">
                            <div>Peserta Hadir: {ev.registeredParticipants} Warga & Petugas</div>
                            <div>Total Sampah Diangkut: {ev.collectedWasteKg} kg</div>
                            <div>Lampiran Dokumentasi: {eventPhotos.length} Foto</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Lightbox Modal for Viewing Uploaded Kerja Bakti Documentation Photos */}
      {lightboxItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs"
          onClick={() => setLightboxItem(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-[#1C8237]">
                  Dokumentasi Kerja Bakti Selesai · {lightboxItem.event.rw} ·{' '}
                  {lightboxItem.event.date} (Foto {lightboxItem.photoIndex}/
                  {lightboxItem.totalPhotos})
                </div>
                <h3 className="text-base font-extrabold text-[#0D3868] line-clamp-1">
                  {lightboxItem.event.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setLightboxItem(null)}
                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative h-80 sm:h-[420px] w-full bg-slate-900 flex items-center justify-center">
              <img
                src={resolveImageUrl(lightboxItem.photoUrl)}
                alt={lightboxItem.event.title}
                referrerPolicy="no-referrer"
                className="max-h-full max-w-full object-contain"
              />
            </div>

            <div className="p-5 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600">
              <div>
                <div className="font-bold text-slate-900">{lightboxItem.event.locationName}</div>
                <p className="mt-0.5 text-slate-600">{lightboxItem.event.summaryNote}</p>
              </div>
              <div className="shrink-0 font-mono-num font-bold text-emerald-700">
                {lightboxItem.event.registeredParticipants} Peserta ·{' '}
                {lightboxItem.event.collectedWasteKg} kg Sampah
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
