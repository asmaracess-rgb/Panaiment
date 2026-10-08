import React, { useState, useEffect } from 'react';
import {
  Send,
  Search,
  MapPin,
  ThumbsUp,
  CheckCircle2,
  Clock,
  AlertCircle,
  Truck,
  ArrowLeft,
  FileCheck2,
  Camera,
  ShieldCheck,
  X,
  MessageCircle,
  Upload,
  Copy,
  Check,
  Lock,
} from 'lucide-react';
import {
  CitizenReport,
  ReportCategory,
  ReportUrgency,
  ReportStatus,
  WasteBankUnit,
  AppView,
  RwGroup,
  WhatsAppRecipient,
} from '../types';
import {
  IMG_DRAINASE,
  IMG_BANK_SAMPAH,
  IMG_KERJA_BAKTI,
  INITIAL_WHATSAPP_RECIPIENTS,
} from '../data/initialData';
import { resolveImageUrl } from '../utils/resolveImageUrl';
import { compressImageFile } from '../utils/compressImage';
import {
  buildReportWhatsAppMessage,
  buildWhatsAppUrl,
  getPreferredWhatsAppRecipient,
  triggerWhatsAppRedirect,
} from '../utils/whatsappHelper';

interface UntukWargaViewProps {
  reports: CitizenReport[];
  wasteUnits: WasteBankUnit[];
  rwGroups?: RwGroup[];
  whatsappRecipients?: WhatsAppRecipient[];
  onAddReport: (
    newReport: Omit<
      CitizenReport,
      | 'id'
      | 'ticketCode'
      | 'createdAt'
      | 'updatedAt'
      | 'upvotes'
      | 'status'
      | 'assignedTeam'
      | 'responseNote'
    >
  ) => string;
  onUpvoteReport: (id: string) => void;
  onNavigate: (view: AppView) => void;
}

const DEFAULT_RW_OPTIONS = ['RW 01', 'RW 02', 'RW 03', 'RW 04', 'RW 05', 'RW 06', 'RW 07'];
const DEFAULT_RT_OPTIONS = ['RT 01', 'RT 02', 'RT 03', 'RT 04', 'RT 05'];
const CATEGORY_OPTIONS: ReportCategory[] = [
  'Sampah Liar & TPS',
  'Drainase & Genangan',
  'Pohon & Ruang Hijau',
  'Ketertiban & Fasum',
];

const LANDMARK_PRESETS: Record<string, { label: string; x: number; y: number; coords: string }> = {
  'RW 01': {
    label: 'Jl. Racing Centre / Sisi Barat Nipah Mall',
    x: 24,
    y: 47,
    coords: '-5.1388, 119.4408',
  },
  'RW 02': {
    label: 'Koridor Jl. Urip Sumoharjo / Seberang Kampus UMI',
    x: 50,
    y: 45,
    coords: '-5.1379, 119.4470',
  },
  'RW 03': {
    label: 'Jl. Urip Sumoharjo Lorong 2 / Sekitar UMI',
    x: 57,
    y: 35,
    coords: '-5.1355, 119.4485',
  },
  'RW 04': {
    label: 'Jl. Sukaria Raya & Lorong Warga',
    x: 37,
    y: 64,
    coords: '-5.1415, 119.4432',
  },
  'RW 05': {
    label: 'Kompleks Kejaksaan / Jl. Abd. Dg. Sirua Utara',
    x: 65,
    y: 67,
    coords: '-5.1422, 119.4496',
  },
  'RW 06': {
    label: 'Bantaran Kanal Panaikang / Akses Jl. Pampang',
    x: 73,
    y: 34,
    coords: '-5.1345, 119.4515',
  },
};

export const UntukWargaView: React.FC<UntukWargaViewProps> = ({
  reports,
  wasteUnits,
  rwGroups = [],
  whatsappRecipients = INITIAL_WHATSAPP_RECIPIENTS,
  onAddReport,
  onUpvoteReport,
  onNavigate,
}) => {
  const [activeTab, setActiveTab] = useState<'lapor' | 'pantau' | 'jadwal'>('lapor');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('Semua');
  const [filterStatus, setFilterStatus] = useState<'Semua' | ReportStatus>('Semua');
  const [lightboxImage, setLightboxImage] = useState<{
    url: string;
    caption: string;
    ticketCode: string;
  } | null>(null);

  // Form states
  const [reporterName, setReporterName] = useState('');
  const [reporterPhone, setReporterPhone] = useState('');
  const [rw, setRw] = useState('RW 02');
  const [rt, setRt] = useState('RT 01');
  const [locationName, setLocationName] = useState(
    'Koridor Jl. Urip Sumoharjo / Seberang Kampus UMI'
  );
  const [category, setCategory] = useState<ReportCategory>('Sampah Liar & TPS');
  const [urgency, setUrgency] = useState<ReportUrgency>('Normal');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState<string>(IMG_DRAINASE);
  const [formError, setFormError] = useState('');
  const [submittedTicket, setSubmittedTicket] = useState<string | null>(null);

  // WhatsApp connection states
  const activeRecipients =
    whatsappRecipients.filter((r) => r.isActive).length > 0
      ? whatsappRecipients.filter((r) => r.isActive)
      : whatsappRecipients;
  const preferredRecipient = getPreferredWhatsAppRecipient(whatsappRecipients, rw);
  const [selectedWaRecipientId, setSelectedWaRecipientId] = useState<string>(
    preferredRecipient?.id || ''
  );
  const [autoSendWhatsApp, setAutoSendWhatsApp] = useState<boolean>(true);
  const [copiedWaText, setCopiedWaText] = useState<boolean>(false);
  const [lastSubmittedReport, setLastSubmittedReport] = useState<{
    ticketCode: string;
    title: string;
    description: string;
    category: ReportCategory;
    urgency: ReportUrgency;
    rw: string;
    rt: string;
    locationName: string;
    coordinatesLabel: string;
    reporterName: string;
    reporterPhone: string;
    recipientId: string;
  } | null>(null);

  useEffect(() => {
    if (
      !selectedWaRecipientId ||
      !activeRecipients.some((r) => r.id === selectedWaRecipientId)
    ) {
      const fallback = getPreferredWhatsAppRecipient(whatsappRecipients, rw);
      if (fallback) {
        setSelectedWaRecipientId(fallback.id);
      }
    }
  }, [whatsappRecipients, activeRecipients, selectedWaRecipientId, rw]);

  const RW_OPTIONS =
    rwGroups.length > 0 ? rwGroups.map((g) => g.rwCode) : DEFAULT_RW_OPTIONS;
  const selectedRwGroup = rwGroups.find((g) => g.rwCode === rw);
  const RT_OPTIONS =
    selectedRwGroup && Array.isArray(selectedRwGroup.rtList) && selectedRwGroup.rtList.length > 0
      ? selectedRwGroup.rtList.map((item) => item.rtCode)
      : DEFAULT_RT_OPTIONS;

  const selectedWaRecipient =
    activeRecipients.find((r) => r.id === selectedWaRecipientId) || preferredRecipient;

  const handleRwChange = (newRw: string) => {
    setRw(newRw);
    if (LANDMARK_PRESETS[newRw]) {
      setLocationName(LANDMARK_PRESETS[newRw].label);
    } else {
      const rwObj = rwGroups.find((g) => g.rwCode === newRw);
      if (rwObj?.areaDescription) {
        setLocationName(rwObj.areaDescription);
      }
    }
    const rwSpecificRecipient = activeRecipients.find((r) => r.rwScope === newRw);
    if (rwSpecificRecipient) {
      setSelectedWaRecipientId(rwSpecificRecipient.id);
    }
  };

  const handleCitizenPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    try {
      const compressed = await compressImageFile(file);
      setSelectedPhoto(compressed);
    } catch {
      // ignore
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reporterName.trim() || !title.trim() || !description.trim() || !locationName.trim()) {
      setFormError('Mohon lengkapi nama pelapor, judul permasalahan, lokasi, dan rincian laporan.');
      return;
    }
    setFormError('');
    const preset = LANDMARK_PRESETS[rw] || LANDMARK_PRESETS['RW 02'];
    const cleanPayload = {
      title: title.trim(),
      description: description.trim(),
      category,
      urgency,
      reporterName: reporterName.trim(),
      reporterPhone: reporterPhone.trim() || '0812-xxxx-xxxx',
      rw,
      rt,
      locationName: locationName.trim(),
      mapX: preset.x + Math.floor(Math.random() * 6 - 3),
      mapY: preset.y + Math.floor(Math.random() * 6 - 3),
      coordinatesLabel: preset.coords,
      imageUrl: selectedPhoto,
    };
    const ticket = onAddReport(cleanPayload);
    const submittedData = {
      ...cleanPayload,
      ticketCode: ticket,
      recipientId: selectedWaRecipient?.id || '',
    };
    setSubmittedTicket(ticket);
    setLastSubmittedReport(submittedData);
    setTitle('');
    setDescription('');

    // Automatically distribute the newly saved report to all registered WhatsApp recipients
    fetch('/api/reports/dispatch-whatsapp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ticketCode: ticket,
        report: submittedData,
      }),
    }).catch(() => {
      // Offline / local fallback handled seamlessly
    });

    if (autoSendWhatsApp && selectedWaRecipient) {
      const waMessage = buildReportWhatsAppMessage(
        submittedData,
        null,
        activeRecipients
      );
      const waUrl = buildWhatsAppUrl(selectedWaRecipient.phoneNumber, waMessage);
      triggerWhatsAppRedirect(waUrl);
    }
  };

  const filteredReports = reports.filter((r) => {
    const matchesSearch =
      r.ticketCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.locationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.rw.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'Semua' || r.category === filterCategory;
    const matchesStatus = filterStatus === 'Semua' || r.status === filterStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
      {/* Header Navigation & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <button
            type="button"
            onClick={() => onNavigate('beranda')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0277BD] hover:text-[#0D3868] mb-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Portal Utama</span>
          </button>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0D3868] tracking-tight">
            Menu Warga Kelurahan Panaikang
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Sampaikan laporan lingkungan sekitar Anda, pantau tindak lanjut petugas, dan lihat jadwal
            armada kebersihan RW.
          </p>
        </div>

        {/* Functional Segmented Tab Control */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200 self-start">
          <button
            type="button"
            onClick={() => setActiveTab('lapor')}
            className={`px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'lapor'
                ? 'bg-[#0277BD] text-white shadow-xs'
                : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            Buat Laporan
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('pantau')}
            className={`px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'pantau'
                ? 'bg-[#0277BD] text-white shadow-xs'
                : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            Pantau & Tindak Lanjut ({reports.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('jadwal')}
            className={`px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'jadwal'
                ? 'bg-[#0277BD] text-white shadow-xs'
                : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            Jadwal Armada RW
          </button>
        </div>
      </div>

      {/* TAB 1: BUAT LAPORAN WARGA */}
      {activeTab === 'lapor' && (
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8">
              <h2 className="text-lg font-bold text-slate-900">
                Formulir Pengaduan & Laporan Lingkungan Warga
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-slate-500">
                Setiap laporan terhubung langsung ke Dashboard Lurah dan Peta Digital Kelurahan
                Panaikang.
              </p>

              {submittedTicket && (
                <div className="mt-5 p-4 sm:p-5 rounded-2xl bg-emerald-50 border-2 border-emerald-300 text-emerald-950 space-y-3.5">
                  <div className="flex items-start gap-3">
                    <FileCheck2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="text-sm font-extrabold text-emerald-900">
                        Laporan Berhasil Tersimpan & Terdistribusi ke Seluruh Penerima Terdaftar
                      </div>
                      <p className="mt-1 text-xs text-emerald-800 leading-relaxed">
                        Nomor Tiket Laporan Anda:{' '}
                        <span className="font-mono-num font-bold underline">{submittedTicket}</span>.
                        Laporan telah tersimpan di basis data Kelurahan Panaikang dan otomatis diteruskan ke seluruh ({activeRecipients.length}) nomor WhatsApp penerima resmi yang terdaftar di halaman Administrator untuk segera dikoordinasikan.
                      </p>

                      {lastSubmittedReport && (
                        <div className="mt-3 p-3.5 rounded-xl bg-white border border-emerald-200 flex flex-wrap items-center justify-between gap-2.5">
                          <div className="flex items-center gap-2 text-xs text-slate-700">
                            <div className="w-7 h-7 rounded-lg bg-[#25D366]/15 text-[#128C7E] flex items-center justify-center shrink-0">
                              <MessageCircle className="w-4 h-4" />
                            </div>
                            <span>
                              Terkirim otomatis ke{' '}
                              <strong>{activeRecipients.length} Nomor Penerima Terdaftar</strong>{' '}
                              (Detail nomor & koordinasi dikelola di Halaman Admin)
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              const msg = buildReportWhatsAppMessage(
                                lastSubmittedReport,
                                null,
                                activeRecipients
                              );
                              navigator.clipboard?.writeText(msg);
                              setCopiedWaText(true);
                              window.setTimeout(() => setCopiedWaText(false), 2500);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
                          >
                            {copiedWaText ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Ringkasan Laporan Tersalin</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Salin Ringkasan Laporan</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}

                      <div className="mt-3 flex flex-wrap items-center gap-2.5">
                        <button
                          type="button"
                          onClick={() => {
                            setSubmittedTicket(null);
                            setActiveTab('pantau');
                          }}
                          className="px-3.5 py-1.5 rounded-lg bg-emerald-700 text-white text-xs font-semibold hover:bg-emerald-800 transition-colors cursor-pointer"
                        >
                          Lihat Status Laporan
                        </button>
                        <button
                          type="button"
                          onClick={() => onNavigate('peta')}
                          className="px-3.5 py-1.5 rounded-lg bg-white border border-emerald-300 text-emerald-800 text-xs font-semibold hover:bg-emerald-100 transition-colors cursor-pointer"
                        >
                          Buka di Peta Digital
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {formError && (
                <div className="mt-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs font-medium text-red-800">
                  {formError}
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Nama Lengkap Pelapor *
                    </label>
                    <input
                      type="text"
                      value={reporterName}
                      onChange={(e) => setReporterName(e.target.value)}
                      placeholder="Contoh: Muh. Rizal Dg. Сикки"
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-[#0277BD] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Nomor WhatsApp / Telepon
                    </label>
                    <input
                      type="tel"
                      value={reporterPhone}
                      onChange={(e) => setReporterPhone(e.target.value)}
                      placeholder="Contoh: 0812-4210-xxxx"
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-[#0277BD] focus:outline-none font-mono-num"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Wilayah RW *
                    </label>
                    <select
                      value={rw}
                      onChange={(e) => handleRwChange(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-900 bg-white focus:border-[#0277BD] focus:outline-none"
                    >
                      {RW_OPTIONS.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Wilayah RT *
                    </label>
                    <select
                      value={rt}
                      onChange={(e) => setRt(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-900 bg-white focus:border-[#0277BD] focus:outline-none"
                    >
                      {RT_OPTIONS.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Kategori Permasalahan *
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as ReportCategory)}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-900 bg-white focus:border-[#0277BD] focus:outline-none"
                    >
                      {CATEGORY_OPTIONS.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Patokan Lokasi / Jalan di Kelurahan Panaikang *
                  </label>
                  <input
                    type="text"
                    value={locationName}
                    onChange={(e) => setLocationName(e.target.value)}
                    placeholder="Contoh: Jl. Urip Sumoharjo depan Kampus UMI / Jl. Sukaria Lr. 2"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-[#0277BD] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Judul Laporan Singkat *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Contoh: Saluran Drainase Tersumbat Sampah Plastik"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-[#0277BD] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Rincian Kondisi Lapangan *
                  </label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Jelaskan kondisi di lokasi agar Satgas Kebersihan dapat menyiapkan peralatan yang sesuai..."
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-[#0277BD] focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Tingkat Urgensi Penanganan
                    </label>
                    <div className="flex items-center gap-2">
                      {(['Normal', 'Tinggi', 'Darurat'] as ReportUrgency[]).map((level) => (
                        <button
                          key={level}
                          type="button"
                          onClick={() => setUrgency(level)}
                          className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                            urgency === level
                              ? 'bg-[#0D3868] text-white border-[#0D3868]'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Lampiran Visual Kondisi (Pilih / Unggah Foto)
                    </label>
                    <div className="flex items-center gap-1.5">
                      {[
                        { label: 'Drainase', url: IMG_DRAINASE },
                        { label: 'Sampah/TPS', url: IMG_BANK_SAMPAH },
                        { label: 'Jalur Hijau', url: IMG_KERJA_BAKTI },
                      ].map((item) => (
                        <button
                          key={item.label}
                          type="button"
                          onClick={() => setSelectedPhoto(item.url)}
                          className={`flex-1 py-2 px-2 rounded-xl text-xs font-semibold border transition-colors whitespace-nowrap cursor-pointer ${
                            selectedPhoto === item.url
                              ? 'bg-sky-50 text-[#0277BD] border-[#0277BD]'
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                      <label className="inline-flex items-center justify-center gap-1 py-2 px-2.5 rounded-xl text-xs font-bold border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 cursor-pointer whitespace-nowrap">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Foto</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleCitizenPhotoUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                </div>

                {/* Distribusi Otomatis ke Seluruh Nomor WhatsApp Terdaftar (Tanpa Menampilkan Nomor/Nama/Jabatan di Halaman Warga) */}
                <div className="p-4 rounded-2xl bg-[#25D366]/10 border border-[#128C7E]/30 space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-[#128C7E] text-white flex items-center justify-center shrink-0 mt-0.5">
                        <MessageCircle className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs sm:text-sm font-extrabold text-[#075E54]">
                          Distribusi Otomatis ke Seluruh Penerima WhatsApp Terdaftar
                        </div>
                        <p className="text-[11px] text-slate-600 leading-relaxed mt-0.5">
                          Saat laporan dikirim, sistem otomatis meneruskan laporan ke seluruh ({activeRecipients.length}) nomor WhatsApp penerima yang terdaftar di Menu Administrator. Demi privasi & keamanan, daftar nomor, nama, dan jabatan penerima hanya ditampilkan pada Halaman Admin untuk koordinasi petugas.
                        </p>
                      </div>
                    </div>
                    <label className="inline-flex items-center gap-2 text-xs font-bold text-[#075E54] bg-white px-3 py-1.5 rounded-xl border border-emerald-300 cursor-pointer self-start sm:self-auto shrink-0">
                      <input
                        type="checkbox"
                        checked={autoSendWhatsApp}
                        onChange={(e) => setAutoSendWhatsApp(e.target.checked)}
                        className="rounded text-[#128C7E] focus:ring-[#128C7E]"
                      />
                      <span>Teruskan Otomatis via WA</span>
                    </label>
                  </div>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row sm:items-center gap-3">
                  <button
                    type="submit"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#128C7E] hover:bg-[#075E54] text-white text-sm font-bold shadow-sm transition-colors cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>Simpan & Kirim Laporan Lingkungan</span>
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Right Column: Alur Satu Laporan Satu Data Satu Aksi */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h3 className="text-base font-bold text-[#0D3868]">
                Standar Layanan: Satu Laporan, Satu Data, Satu Aksi
              </h3>
              <div className="mt-4 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-sky-100 text-[#0277BD] font-mono-num text-xs font-bold flex items-center justify-center shrink-0">
                    01
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900">
                      Satu Laporan Warga Terverifikasi
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                      Warga melaporkan titik sampah, drainase tersumbat, atau pohon rawan tumbang
                      lengkap dengan titik RW/RT.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 font-mono-num text-xs font-bold flex items-center justify-center shrink-0">
                    02
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900">
                      Satu Data di Dashboard Lurah & Peta Digital
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                      Laporan otomatis tercatat dalam basis data spasial Kelurahan Panaikang untuk
                      penentuan prioritas Satgas.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 font-mono-num text-xs font-bold flex items-center justify-center shrink-0">
                    03
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900">
                      Satu Aksi Cepat Satgas & RT/RW
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                      Petugas kebersihan dan koordinator RW menindaklanjuti di lapangan dengan
                      target respon kurang dari 6 jam kerja.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Informasi Distribusi & Koordinasi Internal Penerima Laporan (Tanpa Menampilkan Nomor di Publik) */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-[#128C7E]" />
                  <h3 className="text-sm font-bold text-[#0D3868]">
                    Sistem Distribusi & Koordinasi WhatsApp Internal
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('admin')}
                  className="text-[11px] font-semibold text-[#0277BD] hover:underline cursor-pointer"
                >
                  Halaman Admin →
                </button>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Seluruh laporan warga secara otomatis diterima oleh{' '}
                <strong>{activeRecipients.length} nomor WhatsApp penerima terdaftar</strong> di
                sistem Kelurahan Panaikang. Daftar nomor telepon, nama, dan jabatan penerima hanya
                ditampilkan pada <strong>Halaman Admin</strong> agar seluruh penerima laporan dapat
                melihat dan langsung saling berkoordinasi.
              </p>
            </div>

            {/* Recent Reports Quick Preview */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-slate-900">Laporan Terbaru Warga</h3>
                <button
                  type="button"
                  onClick={() => setActiveTab('pantau')}
                  className="text-xs font-semibold text-[#0277BD] hover:underline cursor-pointer"
                >
                  Lihat Semua
                </button>
              </div>
              <div className="divide-y divide-slate-100">
                {reports.slice(0, 3).map((rep) => (
                  <div key={rep.id} className="py-3 first:pt-0 last:pb-0">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span className="font-mono-num font-semibold text-slate-700">
                        {rep.ticketCode}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{rep.rw}</span>
                      <span aria-hidden="true">·</span>
                      <span
                        className={`font-semibold ${
                          rep.status === 'Selesai'
                            ? 'text-emerald-700'
                            : rep.status === 'Sedang Ditangani'
                            ? 'text-sky-700'
                            : 'text-amber-700'
                        }`}
                      >
                        {rep.status}
                      </span>
                    </div>
                    <div className="mt-1 text-sm font-semibold text-slate-900 line-clamp-1">
                      {rep.title}
                    </div>
                    <div className="mt-0.5 text-xs text-slate-500">{rep.locationName}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PANTAU STATUS LAPORAN & TINDAK LANJUT PETUGAS */}
      {activeTab === 'pantau' && (
        <div className="mt-8 space-y-6">
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-3.5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari nomor tiket (mis. PNK-2026-0148), lokasi jalan, atau RW..."
                  className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 focus:border-[#0277BD] focus:outline-none"
                />
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
                {(['Semua', 'Menunggu Verifikasi', 'Sedang Ditangani', 'Selesai'] as const).map(
                  (st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setFilterStatus(st)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                        filterStatus === st
                          ? 'bg-[#0277BD] text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {st}
                    </button>
                  )
                )}
              </div>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-slate-100">
              <span className="text-xs font-semibold text-slate-500 mr-1 whitespace-nowrap">
                Kategori:
              </span>
              {['Semua', ...CATEGORY_OPTIONS].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setFilterCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                    filterCategory === cat
                      ? 'bg-[#0D3868] text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-5">
            {filteredReports.map((rep) => {
              const isVerified =
                rep.status === 'Sedang Ditangani' ||
                rep.status === 'Selesai' ||
                Boolean(rep.verifiedBy);
              const isInProgress =
                rep.status === 'Sedang Ditangani' || rep.status === 'Selesai';
              const isCompleted = rep.status === 'Selesai';

              const officerPhotos =
                Array.isArray(rep.followUpPhotos) && rep.followUpPhotos.length > 0
                  ? rep.followUpPhotos
                  : rep.completionPhotoUrl
                  ? [rep.completionPhotoUrl]
                  : [];

              return (
                <div
                  key={rep.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-4 shadow-xs"
                >
                  <div className="flex flex-col md:flex-row gap-4 justify-between">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span className="font-mono-num font-bold text-[#0D3868]">
                          {rep.ticketCode}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="font-medium text-slate-700">{rep.category}</span>
                        <span aria-hidden="true">·</span>
                        <span>
                          {rep.rw} / {rep.rt}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono-num">{rep.createdAt}</span>
                        <span aria-hidden="true">·</span>
                        <span className="inline-flex items-center gap-1 font-bold">
                          {rep.status === 'Selesai' && (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="text-emerald-700">Selesai Diselesaikan Petugas</span>
                            </>
                          )}
                          {rep.status === 'Sedang Ditangani' && (
                            <>
                              <Clock className="w-3.5 h-3.5 text-sky-600" />
                              <span className="text-sky-700">Diverifikasi & Sedang Diproses</span>
                            </>
                          )}
                          {rep.status === 'Menunggu Verifikasi' && (
                            <>
                              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                              <span className="text-amber-700">Menunggu Verifikasi Admin/Operator</span>
                            </>
                          )}
                        </span>
                      </div>

                      <h3 className="text-base sm:text-lg font-extrabold text-[#0D3868]">
                        {rep.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                        {rep.description}
                      </p>

                      <div className="pt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                        <span className="inline-flex items-center gap-1 font-medium text-slate-800">
                          <MapPin className="w-3.5 h-3.5 text-[#0277BD]" />
                          {rep.locationName}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>Pelapor: {rep.reporterName}</span>
                      </div>
                    </div>

                    <div className="flex md:flex-col items-center md:items-end justify-between gap-2 shrink-0">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onUpvoteReport(rep.id)}
                          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-sky-50 hover:border-sky-300 text-xs font-semibold text-slate-800 transition-colors cursor-pointer"
                        >
                          <ThumbsUp className="w-3.5 h-3.5 text-[#0277BD]" />
                          <span>Dukung Prioritas</span>
                          <span className="font-mono-num font-bold text-[#0277BD]">
                            {rep.upvotes}
                          </span>
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => onNavigate('peta')}
                        className="text-xs font-semibold text-[#0277BD] hover:underline cursor-pointer"
                      >
                        Lihat Titik di Peta →
                      </button>
                    </div>
                  </div>

                  {/* 3-Step Visual Progress Tracker: Verifikasi -> Diproses -> Selesai */}
                  <div className="pt-3 border-t border-slate-100">
                    <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mb-2.5 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#1C8237]" />
                      <span>Alur Tindak Lanjut Aksi Petugas (Admin / Operator & Satgas)</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {/* Step 1: Verifikasi */}
                      <div
                        className={`p-3 rounded-xl border text-xs ${
                          isVerified
                            ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                            : 'bg-amber-50/60 border-amber-200 text-amber-950'
                        }`}
                      >
                        <div className="flex items-center justify-between font-bold">
                          <span>1. Verifikasi Laporan</span>
                          {isVerified ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Clock className="w-4 h-4 text-amber-600" />
                          )}
                        </div>
                        <div className="mt-1 text-[11px] text-slate-600">
                          {isVerified
                            ? `Diverifikasi oleh: ${rep.verifiedBy || 'Admin / Operator Kelurahan'}`
                            : 'Menunggu verifikasi Admin / Operator di halaman Administrator'}
                        </div>
                        {rep.verifiedAt && (
                          <div className="mt-0.5 text-[10px] font-mono-num text-slate-500">
                            {rep.verifiedAt}
                          </div>
                        )}
                      </div>

                      {/* Step 2: Diproses Petugas */}
                      <div
                        className={`p-3 rounded-xl border text-xs ${
                          isInProgress
                            ? 'bg-sky-50/70 border-sky-200 text-sky-950'
                            : 'bg-slate-50 border-slate-200 text-slate-500'
                        }`}
                      >
                        <div className="flex items-center justify-between font-bold">
                          <span>2. Diproses Petugas</span>
                          {isInProgress && <Clock className="w-4 h-4 text-sky-600" />}
                        </div>
                        <div className="mt-1 text-[11px]">
                          {isInProgress
                            ? `Unit Pelaksana: ${rep.assignedTeam}`
                            : 'Menunggu penugasan tim petugas lapangan'}
                        </div>
                        {isInProgress && (
                          <div className="mt-0.5 text-[10px] font-mono-num text-slate-500">
                            Update: {rep.updatedAt}
                          </div>
                        )}
                      </div>

                      {/* Step 3: Selesai Dikerjakan */}
                      <div
                        className={`p-3 rounded-xl border text-xs ${
                          isCompleted
                            ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950'
                            : 'bg-slate-50 border-slate-200 text-slate-500'
                        }`}
                      >
                        <div className="flex items-center justify-between font-bold">
                          <span>3. Selesai Dikerjakan</span>
                          {isCompleted && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                        </div>
                        <div className="mt-1 text-[11px]">
                          {isCompleted
                            ? 'Pengerjaan lapangan telah tuntas diselesaikan oleh petugas'
                            : 'Menunggu penyelesaian pengerjaan lapangan'}
                        </div>
                        {rep.completedAt && (
                          <div className="mt-0.5 text-[10px] font-mono-num text-emerald-800">
                            Selesai: {rep.completedAt}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Detailed Officer Action Note & Work Completion Photo Proof */}
                  <div className="rounded-xl bg-slate-50 border border-slate-200/90 p-4 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <div className="text-xs font-extrabold text-[#0D3868]">
                        Laporan Tindak Lanjut & Pengerjaan Petugas Kelurahan:
                      </div>
                      <div className="text-[11px] font-mono-num text-slate-500">
                        Diperbarui: {rep.updatedAt}
                      </div>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                      {rep.responseNote}
                    </p>

                    {/* Photos Comparison: Citizen Initial Photo & Officer Completion Photo(s) */}
                    <div className="pt-2 grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                      {/* Citizen Initial Photo */}
                      {rep.imageUrl && (
                        <div className="md:col-span-4">
                          <div className="text-[11px] font-semibold text-slate-600 mb-1.5 flex items-center gap-1">
                            <Camera className="w-3.5 h-3.5 text-slate-500" />
                            <span>Foto Laporan Awal Warga:</span>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setLightboxImage({
                                url: resolveImageUrl(rep.imageUrl),
                                caption: `Foto Laporan Awal Warga — ${rep.title}`,
                                ticketCode: rep.ticketCode,
                              })
                            }
                            className="group relative h-36 w-full rounded-xl overflow-hidden border border-slate-200 bg-slate-900 cursor-pointer block"
                          >
                            <img
                              src={resolveImageUrl(rep.imageUrl)}
                              alt={`Laporan ${rep.ticketCode}`}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                          </button>
                        </div>
                      )}

                      {/* Officer Attached Follow-Up / Work Completion Photos */}
                      <div className={rep.imageUrl ? 'md:col-span-8' : 'md:col-span-12'}>
                        <div className="text-[11px] font-bold text-[#1C8237] mb-1.5 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#1C8237]" />
                          <span>
                            Lampiran Foto Bukti Tindak Lanjut / Pengerjaan Petugas (
                            {officerPhotos.length} Foto):
                          </span>
                        </div>

                        {officerPhotos.length === 0 ? (
                          <div className="h-36 rounded-xl border border-dashed border-slate-300 bg-white flex items-center justify-center p-4 text-center text-xs text-slate-500">
                            Petugas (Admin / Operator) belum melampirkan foto pengerjaan untuk
                            laporan ini.
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                            {officerPhotos.map((photoUrl, idx) => (
                              <button
                                key={`${rep.id}-followup-${idx}`}
                                type="button"
                                onClick={() =>
                                  setLightboxImage({
                                    url: resolveImageUrl(photoUrl),
                                    caption: `Bukti Pengerjaan Petugas (${rep.assignedTeam}) — ${rep.title}`,
                                    ticketCode: rep.ticketCode,
                                  })
                                }
                                className="group relative h-36 w-full rounded-xl overflow-hidden border-2 border-emerald-500/40 bg-slate-900 cursor-pointer block"
                              >
                                <img
                                  src={resolveImageUrl(photoUrl)}
                                  alt={`Bukti Pengerjaan ${rep.ticketCode} #${idx + 1}`}
                                  referrerPolicy="no-referrer"
                                  className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform"
                                />
                                <div className="absolute bottom-1.5 left-1.5 right-1.5 px-2 py-1 rounded-lg bg-slate-900/75 text-white text-[10px] font-semibold truncate">
                                  Bukti Pengerjaan #{idx + 1}
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: JADWAL ARMADA KEBERSIHAN & BANK SAMPAH RW */}
      {activeTab === 'jadwal' && (
        <div className="mt-8 bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-lg font-bold text-slate-900">
              Jadwal Operasional Armada Motor Sampah (Tangkasaki / Fukuda) & Bank Sampah RW
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-600">
              Warga diimbau mengeluarkan sampah terpilah (Organik & Anorganik) 30 menit sebelum jam
              penjemputan armada RW.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                  <th className="py-3.5 px-4">Wilayah RW</th>
                  <th className="py-3.5 px-4">Unit Bank Sampah / Armada</th>
                  <th className="py-3.5 px-4">Cakupan Koridor & Lorong</th>
                  <th className="py-3.5 px-4">Jadwal Penjemputan</th>
                  <th className="py-3.5 px-4">Koordinator</th>
                  <th className="py-3.5 px-4 text-right">KK Terlayani</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {wasteUnits.map((unit) => (
                  <tr key={unit.id} className="hover:bg-slate-50/80">
                    <td className="py-3.5 px-4 font-bold text-[#0D3868] whitespace-nowrap">
                      {unit.rw}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      <div className="inline-flex items-center gap-2">
                        <Truck className="w-4 h-4 text-emerald-700 shrink-0" />
                        <span>{unit.unitName}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 text-xs">{unit.locationLabel}</td>
                    <td className="py-3.5 px-4 text-xs font-mono-num font-medium text-slate-800 whitespace-nowrap">
                      {unit.pickupSchedule}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-700">{unit.coordinator}</td>
                    <td className="py-3.5 px-4 text-right font-mono-num font-semibold text-slate-900">
                      {unit.activeHouseholds} KK
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Lightbox Modal for Viewing Report / Officer Completion Photo */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-3xl w-full overflow-hidden border border-slate-200 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <div className="text-xs font-mono-num font-bold text-[#0277BD]">
                  Tiket Laporan: {lightboxImage.ticketCode}
                </div>
                <div className="text-sm font-extrabold text-slate-900">
                  {lightboxImage.caption}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setLightboxImage(null)}
                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="relative h-80 sm:h-[460px] w-full bg-slate-950 flex items-center justify-center">
              <img
                src={lightboxImage.url}
                alt={lightboxImage.caption}
                referrerPolicy="no-referrer"
                className="max-h-full max-w-full object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
