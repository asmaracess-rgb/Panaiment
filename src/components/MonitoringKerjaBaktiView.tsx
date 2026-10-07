import React, { useState } from 'react';
import {
  ArrowLeft,
  MapPin,
  Users,
  CheckCircle2,
  UserPlus,
  Sparkles,
  Plus,
  Camera,
  Image as ImageIcon,
  X,
} from 'lucide-react';
import { CleanupEvent, AppView } from '../types';
import { IMG_KERJA_BAKTI } from '../data/initialData';

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

  // Add new schedule state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('Sabtu, 17 Oktober 2026');
  const [newRw, setNewRw] = useState('RW 01');
  const [newLocation, setNewLocation] = useState('');
  const [newTarget, setNewTarget] = useState<number>(80);

  const filteredEvents = cleanupEvents.filter(
    (ev) => filterStatus === 'Semua' || ev.status === filterStatus
  );

  // Collect all documentation photos from executed/documented Kerja Bakti events
  const allDocumentationGallery = cleanupEvents.flatMap((ev) => {
    const photos =
      Array.isArray(ev.documentationPhotos) && ev.documentationPhotos.length > 0
        ? ev.documentationPhotos
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
      imageUrl: IMG_KERJA_BAKTI,
      documentationPhotos: [IMG_KERJA_BAKTI],
      summaryNote: 'Agenda gotong royong rutin warga Kelurahan Panaikang.',
    });
    setNewTitle('');
    setNewLocation('');
    setShowAddForm(false);
  };

  const totalParticipants = cleanupEvents.reduce(
    (acc, ev) => acc + ev.registeredParticipants,
    0
  );
  const totalCollectedKg = cleanupEvents.reduce((acc, ev) => acc + ev.collectedWasteKg, 0);

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
            Jadwal aksi Sabtu Bersih, titik kumpul gotong royong RW/RT, registrasi peserta warga,
            dan galeri foto dokumentasi kegiatan yang telah dilaksanakan.
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
          <div className="text-xs font-medium text-slate-500">Total Agenda Kerja Bakti</div>
          <div className="mt-1.5 text-2xl sm:text-3xl font-extrabold text-[#0D3868] font-mono-num">
            {cleanupEvents.length} Kegiatan
          </div>
          <div className="mt-1 text-xs text-slate-500">Kolaborasi RT/RW & Satgas</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5">
          <div className="text-xs font-medium text-slate-500">Partisipasi Warga Terdaftar</div>
          <div className="mt-1.5 text-2xl sm:text-3xl font-extrabold text-[#5E35B1] font-mono-num">
            {totalParticipants} Warga
          </div>
          <div className="mt-1 text-xs text-slate-500">RW 01 s/d RW 06 Panaikang</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5">
          <div className="text-xs font-medium text-slate-500">Sampah Terangkat Aksi Bersih</div>
          <div className="mt-1.5 text-2xl sm:text-3xl font-extrabold text-emerald-700 font-mono-num">
            {totalCollectedKg} kg
          </div>
          <div className="mt-1 text-xs text-slate-500">Disalurkan ke BSU & kompos</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5">
          <div className="text-xs font-medium text-slate-500">Foto Dokumentasi Kegiatan</div>
          <div className="mt-1.5 text-2xl sm:text-3xl font-extrabold text-[#4527A0] font-mono-num">
            {allDocumentationGallery.length} Foto
          </div>
          <div className="mt-1 text-xs text-slate-500">Diunggah Admin & Koordinator RW</div>
        </div>
      </div>

      {/* ================= GALERI FOTO DOKUMENTASI KEGIATAN KERJA BAKTI ================= */}
      {allDocumentationGallery.length > 0 && (
        <div className="mt-6 bg-white rounded-2xl border border-slate-200 p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-[#5E35B1]" />
                <h2 className="text-base sm:text-lg font-extrabold text-[#0D3868]">
                  Galeri Foto Dokumentasi Kegiatan Kerja Bakti yang Telah Dilaksanakan
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Dokumentasi lapangan kegiatan gotong royong warga yang diunggah melalui Panel
                Administrator Kelurahan Panaikang. Klik foto untuk memperbesar.
              </p>
            </div>
            <span className="text-xs font-semibold text-[#5E35B1] font-mono-num">
              {allDocumentationGallery.length} Foto Terpublikasi
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
                <div className="relative h-36 sm:h-40 w-full overflow-hidden bg-slate-200">
                  <img
                    src={item.photoUrl}
                    alt={item.event.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/80 via-slate-950/35 to-transparent p-2.5">
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
                  <span className="font-mono-num font-bold text-[#5E35B1] shrink-0 ml-2">
                    {item.event.status === 'Tuntas' ? `${item.event.collectedWasteKg} kg` : item.event.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Optional Add Schedule Form */}
      {showAddForm && (
        <div className="mt-6 bg-white rounded-2xl border border-purple-200 p-6">
          <h2 className="text-base font-bold text-[#0D3868]">
            Tambah Jadwal Kerja Bakti Lingkungan RW/RT Baru
          </h2>
          <form onSubmit={handleCreateSchedule} className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Kegiatan Kerja Bakti *
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
                Terbitkan Jadwal Kerja Bakti
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter Bar */}
      <div className="mt-6 flex items-center gap-2">
        {(['Semua', 'Terjadwal', 'Tuntas'] as const).map((st) => (
          <button
            key={st}
            type="button"
            onClick={() => setFilterStatus(st)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              filterStatus === st
                ? 'bg-[#5E35B1] text-white'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            {st === 'Semua'
              ? 'Semua Kegiatan'
              : st === 'Tuntas'
              ? 'Telah Dilaksanakan (Tuntas)'
              : 'Terjadwal Akan Datang'}
          </button>
        ))}
      </div>

      {/* Cleanup Event Cards */}
      <div className="mt-6 space-y-6">
        {filteredEvents.map((ev) => {
          const participationPct = Math.min(
            100,
            Math.round((ev.registeredParticipants / Math.max(ev.targetParticipants, 1)) * 100)
          );
          const eventPhotos =
            Array.isArray(ev.documentationPhotos) && ev.documentationPhotos.length > 0
              ? ev.documentationPhotos
              : [ev.imageUrl];
          const currentMainPhoto = activePhotoByEvent[ev.id] || ev.imageUrl || eventPhotos[0];

          return (
            <div
              key={ev.id}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden grid grid-cols-1 lg:grid-cols-12"
            >
              {/* Documentary Photo & Album Thumbnails Column */}
              <div className="lg:col-span-4 bg-slate-50 border-b lg:border-b-0 lg:border-r border-slate-100 flex flex-col">
                <div
                  onClick={() =>
                    setLightboxItem({
                      photoUrl: currentMainPhoto,
                      event: ev,
                      photoIndex: Math.max(1, eventPhotos.indexOf(currentMainPhoto) + 1),
                      totalPhotos: eventPhotos.length,
                    })
                  }
                  className="relative h-52 sm:h-56 lg:flex-1 bg-slate-100 cursor-pointer group overflow-hidden"
                >
                  <img
                    src={currentMainPhoto}
                    alt={ev.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                  <div className="absolute bottom-2.5 right-2.5 px-2.5 py-1 rounded-lg bg-slate-900/75 text-white text-[11px] font-semibold flex items-center gap-1">
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>{eventPhotos.length} Foto Dokumentasi</span>
                  </div>
                </div>

                {/* Multi-Photo Thumbnail Strip when multiple photos exist */}
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
                            ? 'border-[#5E35B1] scale-105'
                            : 'border-slate-200 opacity-75 hover:opacity-100'
                        }`}
                      >
                        <img
                          src={photo}
                          alt={`Dokumentasi ${idx + 1}`}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Event Content & Registration Column */}
              <div className="lg:col-span-8 p-6 flex flex-col justify-between">
                <div>
                  {/* Unboxed Metadata Line */}
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span className="font-bold text-[#5E35B1]">{ev.rw}</span>
                    <span aria-hidden="true">·</span>
                    <span>{ev.rtScope}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono-num font-medium text-slate-700">
                      {ev.date} ({ev.timeRange})
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="inline-flex items-center gap-1 font-semibold">
                      {ev.status === 'Tuntas' ? (
                        <span className="text-emerald-700 inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Telah Dilaksanakan ({ev.collectedWasteKg} kg terangkat)
                        </span>
                      ) : (
                        <span className="text-purple-700 inline-flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5" />
                          {ev.status === 'Sedang Berlangsung'
                            ? 'Sedang Berlangsung'
                            : 'Terjadwal Akan Datang'}
                        </span>
                      )}
                    </span>
                  </div>

                  <h2 className="mt-2 text-lg sm:text-xl font-bold text-slate-900">{ev.title}</h2>
                  <p className="mt-1 text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {ev.summaryNote}
                  </p>

                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-700">
                    <span className="inline-flex items-center gap-1 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-[#5E35B1]" />
                      {ev.locationName}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>Penanggung Jawab: {ev.coordinator}</span>
                  </div>

                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-100 text-xs">
                    <div>
                      <div className="font-semibold text-slate-800 mb-1">Sasaran Lokasi & Aksi:</div>
                      <ul className="space-y-1 text-slate-600 list-disc list-inside">
                        {ev.focusAreas.map((fa) => (
                          <li key={fa}>{fa}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <div className="font-semibold text-slate-800 mb-1">
                        Peralatan Gotong Royong:
                      </div>
                      <div className="text-slate-600">
                        {ev.equipmentNeeded.join(' · ')}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Action & Progress */}
                <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1 max-w-xs">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-600 inline-flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-[#5E35B1]" />
                        Partisipasi Warga:
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

                  <div className="flex items-center gap-3">
                    {joinConfirmedId === ev.id && (
                      <span className="text-xs font-semibold text-emerald-700">
                        Kehadiran tercatat!
                      </span>
                    )}
                    {ev.status !== 'Tuntas' && (
                      <button
                        type="button"
                        onClick={() =>
                          setJoiningEventId(joiningEventId === ev.id ? null : ev.id)
                        }
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#5E35B1] hover:bg-[#4527A0] text-white text-xs font-bold transition-colors cursor-pointer"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Daftar Hadir Warga / RT</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Inline Attendance Form */}
                {joiningEventId === ev.id && (
                  <form
                    onSubmit={(e) => handleConfirmJoin(e, ev.id)}
                    className="mt-4 p-4 rounded-xl bg-purple-50/70 border border-purple-200 grid grid-cols-1 sm:grid-cols-4 gap-3 items-end"
                  >
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Nama Warga / Perwakilan KK *
                      </label>
                      <input
                        type="text"
                        value={participantName}
                        onChange={(e) => setParticipantName(e.target.value)}
                        placeholder="Nama Anda"
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Asal RT
                      </label>
                      <select
                        value={participantRt}
                        onChange={(e) => setParticipantRt(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs"
                      >
                        <option value="RT 01">RT 01</option>
                        <option value="RT 02">RT 02</option>
                        <option value="RT 03">RT 03</option>
                        <option value="RT 04">RT 04</option>
                        <option value="RT 05">RT 05</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Jumlah Peserta (Orang)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="25"
                        value={participantCount}
                        onChange={(e) => setParticipantCount(Number(e.target.value) || 1)}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-mono-num"
                      />
                    </div>
                    <button
                      type="submit"
                      className="py-2 px-3 rounded-lg bg-[#5E35B1] text-white text-xs font-bold hover:bg-[#4527A0] cursor-pointer"
                    >
                      Konfirmasi Hadir
                    </button>
                  </form>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Lightbox Modal for Viewing Uploaded Kerja Bakti Documentation Photos */}
      {lightboxItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs"
          onClick={() => setLightboxItem(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-3xl w-full overflow-hidden border border-slate-200 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative h-72 sm:h-96 bg-slate-900">
              <img
                src={lightboxItem.photoUrl}
                alt={lightboxItem.event.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain"
              />
              <button
                type="button"
                onClick={() => setLightboxItem(null)}
                className="absolute top-3 right-3 p-2 rounded-full bg-slate-900/75 hover:bg-slate-900 text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                <span>
                  <strong className="text-[#5E35B1]">{lightboxItem.event.rw}</strong> ·{' '}
                  {lightboxItem.event.date} · Foto {lightboxItem.photoIndex} dari{' '}
                  {lightboxItem.totalPhotos}
                </span>
                <span className="font-mono-num font-bold text-emerald-700">
                  {lightboxItem.event.status === 'Tuntas'
                    ? `Telah Dilaksanakan · ${lightboxItem.event.collectedWasteKg} kg Sampah Terangkat`
                    : lightboxItem.event.status}
                </span>
              </div>
              <h3 className="mt-1.5 text-base sm:text-lg font-bold text-[#0D3868]">
                {lightboxItem.event.title}
              </h3>
              <p className="mt-1 text-xs sm:text-sm text-slate-600">
                {lightboxItem.event.summaryNote}
              </p>
              <div className="mt-2 text-xs text-slate-500">
                Lokasi: <span className="font-semibold text-slate-700">{lightboxItem.event.locationName}</span> · Koordinator:{' '}
                <span className="font-semibold text-slate-700">{lightboxItem.event.coordinator}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
