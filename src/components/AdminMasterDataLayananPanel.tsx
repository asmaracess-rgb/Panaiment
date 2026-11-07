import React, { useState } from 'react';
import {
  FileText,
  Plus,
  Edit3,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Search,
  Check,
  X,
  Sliders,
  Layers,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  Eye,
  Info,
  QrCode,
  Tag,
  ToggleLeft,
  ToggleRight,
  ArrowRight,
} from 'lucide-react';
import {
  MasterLayananItem,
  MasterPersyaratanItem,
  DynamicFormField,
  PengaduanKategori,
  FormFieldType,
} from '../types';
import {
  INITIAL_MASTER_LAYANAN,
  INITIAL_MASTER_PERSYARATAN,
  DAFTAR_KATEGORI_PENGADUAN,
} from '../data/pelayananMasterData';

interface AdminMasterDataLayananPanelProps {
  masterLayananList: MasterLayananItem[];
  masterPersyaratanList: MasterPersyaratanItem[];
  kategoriPengaduanList: PengaduanKategori[];
  onSaveMasterLayanan: (list: MasterLayananItem[]) => Promise<{ ok: boolean; errors?: string[] }>;
  onSaveMasterPersyaratan: (list: MasterPersyaratanItem[]) => Promise<{ ok: boolean; errors?: string[] }>;
  onSaveKategoriPengaduan?: (list: PengaduanKategori[]) => Promise<{ ok: boolean; errors?: string[] }>;
}

export const AdminMasterDataLayananPanel: React.FC<AdminMasterDataLayananPanelProps> = ({
  masterLayananList,
  masterPersyaratanList,
  kategoriPengaduanList,
  onSaveMasterLayanan,
  onSaveMasterPersyaratan,
  onSaveKategoriPengaduan,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<
    'layanan' | 'persyaratan' | 'form_builder' | 'kategori_pengaduan' | 'alur_status'
  >('layanan');

  // Search
  const [searchQuery, setSearchQuery] = useState('');

  // Service Edit / Add Modal
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [serviceForm, setServiceForm] = useState<MasterLayananItem>({
    id: '',
    code: '',
    name: '',
    category: 'Administrasi Kependudukan',
    description: '',
    estimatedProcessingTime: '1 - 2 Hari Kerja',
    isActive: true,
    approverRole: 'Lurah Panaikang',
    requiredDocs: [],
    dynamicFields: [],
  });

  // Requirement Edit / Add Modal
  const [isReqModalOpen, setIsReqModalOpen] = useState(false);
  const [editingReqId, setEditingReqId] = useState<string | null>(null);
  const [reqForm, setReqForm] = useState<MasterPersyaratanItem>({
    id: '',
    code: '',
    name: '',
    description: '',
    requirementType: 'Wajib',
    fileFormatAccepted: 'JPG, PNG, PDF',
    maxSizeMb: 5,
  });

  // Form Builder Field Modal
  const [isFieldModalOpen, setIsFieldModalOpen] = useState(false);
  const [selectedServiceForFields, setSelectedServiceForFields] = useState<string>(
    masterLayananList[0]?.id || ''
  );
  const [fieldForm, setFieldForm] = useState<DynamicFormField>({
    id: '',
    label: '',
    type: 'text',
    placeholder: '',
    required: true,
    options: [],
  });
  const [fieldOptionsText, setFieldOptionsText] = useState('');

  // Status message
  const [feedbackSuccess, setFeedbackSuccess] = useState('');
  const [feedbackError, setFeedbackError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- SERVICE HANDLERS ---
  const handleOpenAddService = () => {
    setEditingServiceId(null);
    setServiceForm({
      id: `srv_${Date.now()}`,
      code: `SK-${masterLayananList.length + 1}`,
      name: '',
      category: 'Administrasi Kependudukan',
      description: '',
      estimatedProcessingTime: '1 - 2 Hari Kerja',
      isActive: true,
      approverRole: 'Lurah Panaikang',
      requiredDocs: [
        { persyaratanId: 'req_ktp', persyaratanName: 'Fotokopi / Scan e-KTP Pemohon', requirementType: 'Wajib' },
        { persyaratanId: 'req_kk', persyaratanName: 'Fotokopi / Scan Kartu Keluarga (KK)', requirementType: 'Wajib' },
        { persyaratanId: 'req_pengantar_rtrw', persyaratanName: 'Surat Pengantar dari Ketua RT & RW', requirementType: 'Wajib' },
      ],
      dynamicFields: [],
    });
    setIsServiceModalOpen(true);
  };

  const handleOpenEditService = (srv: MasterLayananItem) => {
    setEditingServiceId(srv.id);
    setServiceForm({ ...srv });
    setIsServiceModalOpen(true);
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackError('');
    setFeedbackSuccess('');

    if (!serviceForm.name.trim()) {
      setFeedbackError('Nama layanan wajib diisi.');
      return;
    }
    if (!serviceForm.code.trim()) {
      setFeedbackError('Kode layanan wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    let nextList: MasterLayananItem[];
    if (editingServiceId) {
      nextList = masterLayananList.map((s) => (s.id === editingServiceId ? serviceForm : s));
    } else {
      nextList = [...masterLayananList, serviceForm];
    }

    const res = await onSaveMasterLayanan(nextList);
    setIsSubmitting(false);

    if (res.ok) {
      setIsServiceModalOpen(false);
      setFeedbackSuccess(`Layanan "${serviceForm.name}" berhasil disimpan.`);
    } else {
      setFeedbackError(res.errors?.[0] || 'Gagal menyimpan master data layanan.');
    }
  };

  const handleToggleServiceActive = async (serviceId: string) => {
    const nextList = masterLayananList.map((s) =>
      s.id === serviceId ? { ...s, isActive: !s.isActive } : s
    );
    await onSaveMasterLayanan(nextList);
  };

  // --- PERSYARATAN HANDLERS ---
  const handleOpenAddReq = () => {
    setEditingReqId(null);
    setReqForm({
      id: `req_${Date.now()}`,
      code: `DOC_${Date.now().toString().slice(-4)}`,
      name: '',
      description: '',
      requirementType: 'Wajib',
      fileFormatAccepted: 'JPG, PNG, PDF',
      maxSizeMb: 5,
    });
    setIsReqModalOpen(true);
  };

  const handleOpenEditReq = (req: MasterPersyaratanItem) => {
    setEditingReqId(req.id);
    setReqForm({ ...req });
    setIsReqModalOpen(true);
  };

  const handleSaveReq = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackError('');
    setFeedbackSuccess('');

    if (!reqForm.name.trim()) {
      setFeedbackError('Nama persyaratan dokumen wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    let nextList: MasterPersyaratanItem[];
    if (editingReqId) {
      nextList = masterPersyaratanList.map((r) => (r.id === editingReqId ? reqForm : r));
    } else {
      nextList = [...masterPersyaratanList, reqForm];
    }

    const res = await onSaveMasterPersyaratan(nextList);
    setIsSubmitting(false);

    if (res.ok) {
      setIsReqModalOpen(false);
      setFeedbackSuccess(`Persyaratan "${reqForm.name}" berhasil disimpan.`);
    } else {
      setFeedbackError(res.errors?.[0] || 'Gagal menyimpan master data persyaratan.');
    }
  };

  // --- FORM BUILDER HANDLERS ---
  const targetServiceForFields = masterLayananList.find((s) => s.id === selectedServiceForFields);

  const handleAddFieldToService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetServiceForFields || !fieldForm.label.trim()) return;

    const options = fieldOptionsText
      .split('\n')
      .map((o) => o.trim())
      .filter(Boolean);

    const newField: DynamicFormField = {
      id: `field_${Date.now()}`,
      label: fieldForm.label.trim(),
      type: fieldForm.type,
      placeholder: fieldForm.placeholder?.trim() || '',
      required: fieldForm.required,
      options: options.length > 0 ? options : undefined,
    };

    const nextFields = [...(targetServiceForFields.dynamicFields || []), newField];
    const nextList = masterLayananList.map((s) =>
      s.id === targetServiceForFields.id ? { ...s, dynamicFields: nextFields } : s
    );

    await onSaveMasterLayanan(nextList);
    setIsFieldModalOpen(false);
    setFieldForm({
      id: '',
      label: '',
      type: 'text',
      placeholder: '',
      required: true,
      options: [],
    });
    setFieldOptionsText('');
    setFeedbackSuccess(`Field "${newField.label}" berhasil ditambahkan ke formulir.`);
  };

  const handleRemoveFieldFromService = async (fieldId: string) => {
    if (!targetServiceForFields) return;
    const nextFields = (targetServiceForFields.dynamicFields || []).filter((f) => f.id !== fieldId);
    const nextList = masterLayananList.map((s) =>
      s.id === targetServiceForFields.id ? { ...s, dynamicFields: nextFields } : s
    );
    await onSaveMasterLayanan(nextList);
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0D3868] to-[#0277BD] text-white flex items-center justify-center shadow-xs">
            <Sliders className="w-6 h-6 text-sky-200" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-black text-[#0D3868]">
                Manajemen Pelayanan & Master Data Layanan
              </h3>
              <span className="px-2.5 py-0.5 rounded-full bg-sky-100 text-[#0277BD] text-[10px] font-black uppercase">
                Dynamic Engine
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Konfigurasi daftar surat, persyaratan berkas, formulir dinamis, dan alur permohonan secara real-time tanpa ubah kode.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Tersinkronisasi Firestore</span>
          </span>
        </div>
      </div>

      {/* Sub-Tabs */}
      <div className="flex flex-wrap items-center gap-2 bg-slate-100 p-1.5 rounded-2xl">
        {[
          { id: 'layanan', label: `Master Layanan (${masterLayananList.length})` },
          { id: 'persyaratan', label: `Master Persyaratan (${masterPersyaratanList.length})` },
          { id: 'form_builder', label: 'Form Builder Dinamis' },
          { id: 'kategori_pengaduan', label: `Kategori Pengaduan (${kategoriPengaduanList.length})` },
          { id: 'alur_status', label: 'Status & Alur Pelayanan' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              setActiveSubTab(tab.id as any);
              setFeedbackError('');
              setFeedbackSuccess('');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer ${
              activeSubTab === tab.id
                ? 'bg-white text-[#0D3868] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Feedback Alert */}
      {feedbackSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{feedbackSuccess}</span>
          </div>
          <button type="button" onClick={() => setFeedbackSuccess('')} className="cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {feedbackError && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{feedbackError}</span>
          </div>
          <button type="button" onClick={() => setFeedbackError('')} className="cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* =========================================================================
          SUB-TAB 1: MASTER LAYANAN
      ========================================================================= */}
      {activeSubTab === 'layanan' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari kode atau nama layanan..."
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#0277BD]"
              />
            </div>

            <button
              type="button"
              onClick={handleOpenAddService}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0D3868] hover:bg-[#072647] text-white text-xs font-bold transition shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Layanan Baru</span>
            </button>
          </div>

          <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-white">
            {masterLayananList
              .filter(
                (s) =>
                  !searchQuery ||
                  s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  s.code.toLowerCase().includes(searchQuery.toLowerCase())
              )
              .map((service) => (
                <div
                  key={service.id}
                  className="p-4 hover:bg-slate-50 transition flex flex-col md:flex-row md:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded-md bg-sky-50 text-[#0277BD] text-[10px] font-mono-num font-black border border-sky-100">
                        {service.code}
                      </span>
                      <h4 className="font-extrabold text-slate-900 text-sm">{service.name}</h4>
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
                          service.isActive
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {service.isActive ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-1">{service.description}</p>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 pt-1">
                      <span>Estimasi: <strong>{service.estimatedProcessingTime}</strong></span>
                      <span>·</span>
                      <span>Pejabat: <strong>{service.approverRole || 'Lurah'}</strong></span>
                      <span>·</span>
                      <span>Persyaratan: <strong>{service.requiredDocs.length} berkas</strong></span>
                      <span>·</span>
                      <span>Form Field: <strong>{service.dynamicFields?.length || 0} kolom</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleToggleServiceActive(service.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                        service.isActive
                          ? 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                          : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                      }`}
                    >
                      {service.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenEditService(service)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          SUB-TAB 2: MASTER PERSYARATAN
      ========================================================================= */}
      {activeSubTab === 'persyaratan' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Daftar master dokumen yang dapat dipasangkan ke dalam masing-masing jenis layanan permohonan.
            </p>
            <button
              type="button"
              onClick={handleOpenAddReq}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0D3868] hover:bg-[#072647] text-white text-xs font-bold transition shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Persyaratan Dokumen</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {masterPersyaratanList.map((req) => (
              <div
                key={req.id}
                className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-[#0277BD] transition-all flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-mono-num font-bold">
                      {req.code}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                        req.requirementType === 'Wajib'
                          ? 'bg-rose-100 text-rose-800'
                          : req.requirementType === 'Kondisional'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {req.requirementType}
                    </span>
                  </div>

                  <h4 className="font-bold text-slate-900 text-sm mt-1">{req.name}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">{req.description || 'Tidak ada catatan tambahan.'}</p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                  <span>Format: {req.fileFormatAccepted || 'JPG, PNG, PDF'}</span>
                  <button
                    type="button"
                    onClick={() => handleOpenEditReq(req)}
                    className="inline-flex items-center gap-1 text-[#0277BD] font-bold hover:underline cursor-pointer"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Edit</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          SUB-TAB 3: FORM BUILDER DINAMIS
      ========================================================================= */}
      {activeSubTab === 'form_builder' && (
        <div className="space-y-5">
          <div className="p-4 rounded-2xl bg-sky-50 border border-sky-100 text-xs text-sky-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="font-extrabold text-[#0D3868]">Pilih Layanan untuk Dikonfigurasi Formulirnya:</div>
              <p className="text-slate-600 mt-0.5">
                Admin dapat menambah kolom input teks, angka, tanggal, pilihan dropdown, checkbox, upload, alamat, maupun NIK.
              </p>
            </div>
            <select
              value={selectedServiceForFields}
              onChange={(e) => setSelectedServiceForFields(e.target.value)}
              className="px-3.5 py-2 rounded-xl border border-sky-200 bg-white font-bold text-slate-800 text-xs focus:outline-none"
            >
              {masterLayananList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.code} - {s.name}
                </option>
              ))}
            </select>
          </div>

          {targetServiceForFields && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-extrabold text-[#0D3868] text-sm">
                  Kolom Formulir Khusus: {targetServiceForFields.name}
                </h4>
                <button
                  type="button"
                  onClick={() => setIsFieldModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Kolom Form</span>
                </button>
              </div>

              {(!targetServiceForFields.dynamicFields || targetServiceForFields.dynamicFields.length === 0) ? (
                <div className="p-8 text-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 text-slate-500 text-xs">
                  Belum ada kolom isian formulir tambahan untuk layanan ini. Layanan hanya menggunakan formulir identitas standar.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {targetServiceForFields.dynamicFields.map((field, idx) => (
                    <div
                      key={field.id}
                      className="p-3.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between gap-3 shadow-2xs"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center text-xs font-mono-num font-bold">
                          {idx + 1}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-xs">{field.label}</span>
                            <span className="px-2 py-0.2 rounded-md bg-slate-100 text-slate-700 text-[10px] font-mono-num uppercase">
                              {field.type}
                            </span>
                            {field.required && (
                              <span className="text-[10px] font-black text-rose-600 bg-rose-50 px-1.5 rounded">
                                Wajib
                              </span>
                            )}
                          </div>
                          {field.placeholder && (
                            <p className="text-[11px] text-slate-400 mt-0.5">Placeholder: "{field.placeholder}"</p>
                          )}
                          {field.options && field.options.length > 0 && (
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              Pilihan: {field.options.join(', ')}
                            </p>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveFieldFromService(field.id)}
                        className="text-rose-600 hover:bg-rose-50 p-1.5 rounded-lg text-xs font-bold transition cursor-pointer"
                        title="Hapus Kolom"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          SUB-TAB 4: KATEGORI PENGADUAN
      ========================================================================= */}
      {activeSubTab === 'kategori_pengaduan' && (
        <div className="space-y-4">
          <p className="text-xs text-slate-500">
            Daftar 10 kategori pengaduan online yang dapat dipilih warga saat menyampaikan keluhan atau aspirasi.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {kategoriPengaduanList.map((cat, i) => (
              <div
                key={cat}
                className="p-4 rounded-xl border border-slate-200 bg-white flex items-center gap-3 shadow-2xs"
              >
                <span className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center text-xs font-bold font-mono-num shrink-0">
                  {i + 1}
                </span>
                <span className="font-bold text-slate-900 text-xs">{cat}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          SUB-TAB 5: STATUS & ALUR PELAYANAN
      ========================================================================= */}
      {activeSubTab === 'alur_status' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Pra Registrasi Pipeline */}
            <div className="p-5 rounded-2xl border border-sky-200 bg-sky-50/50 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">📝</span>
                <h4 className="font-extrabold text-[#0D3868] text-sm">
                  Alur Status Pra Registrasi Online (Persuratan)
                </h4>
              </div>
              <p className="text-xs text-slate-600">
                Format Nomor Tiket: <code className="font-mono-num font-bold text-[#0D3868]">REG-YYYYMM-XXXX</code>
              </p>
              <div className="space-y-1.5 pt-2 text-xs">
                {[
                  { code: 'DRAFT', desc: 'Pemohon mengisi formulir di aplikasi' },
                  { code: 'DIAJUKAN', desc: 'Tiket pra-registrasi terbit & masuk ke antrean' },
                  { code: 'MENUNGGU_KEDATANGAN', desc: 'Pemohon membawa berkas fisik ke kantor kelurahan' },
                  { code: 'VERIFIKASI_PETUGAS', desc: 'Petugas memeriksa berkas fisik di loket' },
                  { code: 'PERLU_PERBAIKAN', desc: 'Ada dokumen buram/kurang yang perlu perbaikan' },
                  { code: 'BERKAS_LENGKAP', desc: 'Dokumen fisik sah & siap diproses' },
                  { code: 'DIPROSES', desc: 'Draf surat administrasi diketik petugas' },
                  { code: 'MENUNGGU_PERSETUJUAN', desc: 'Surat diajukan ke Lurah / Pejabat' },
                  { code: 'DISETUJUI', desc: 'Lurah menyetujui surat keterangan' },
                  { code: 'SURAT_SELESAI', desc: 'Surat diterbitkan, diregister & ditandatangani' },
                  { code: 'DITUTUP', desc: 'Pemohon telah mengambil surat fisik di kantor' },
                ].map((st, i) => (
                  <div key={st.code} className="p-2.5 rounded-xl bg-white border border-sky-100 flex items-center justify-between gap-2">
                    <span className="font-mono-num font-black text-[#0D3868] text-[11px]">
                      {i + 1}. {st.code}
                    </span>
                    <span className="text-slate-500 text-[11px] text-right">{st.desc}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Pengaduan Pipeline */}
            <div className="p-5 rounded-2xl border border-emerald-200 bg-emerald-50/50 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">📢</span>
                <h4 className="font-extrabold text-emerald-950 text-sm">
                  Alur Status Pengaduan Online Warga
                </h4>
              </div>
              <p className="text-xs text-slate-600">
                Format Nomor Tiket: <code className="font-mono-num font-bold text-emerald-800">PGD-YYYYMM-XXXX</code>
              </p>
              <div className="space-y-1.5 pt-2 text-xs">
                {[
                  { code: 'DIAJUKAN', desc: 'Pengaduan dikirim warga melalui sistem' },
                  { code: 'DITERIMA', desc: 'Diterima oleh Operator Admin Kelurahan' },
                  { code: 'DIVERIFIKASI', desc: 'Lokasi & urgensi diverifikasi satgas' },
                  { code: 'DITINDAKLANJUTI', desc: 'Tim lapangan/kebersihan turun menangani' },
                  { code: 'MENUNGGU_INFORMASI', desc: 'Menunggu konfirmasi tambahan dari pelapor' },
                  { code: 'SELESAI', desc: 'Masalah tuntas ditangani & didokumentasikan' },
                ].map((st, i) => (
                  <div key={st.code} className="p-2.5 rounded-xl bg-white border border-emerald-100 flex items-center justify-between gap-2">
                    <span className="font-mono-num font-black text-emerald-800 text-[11px]">
                      {i + 1}. {st.code}
                    </span>
                    <span className="text-slate-500 text-[11px] text-right">{st.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: EDIT / ADD SERVICE
      ========================================================================= */}
      {isServiceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <form
            onSubmit={handleSaveService}
            className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4 my-8"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="font-extrabold text-slate-900 text-base">
                {editingServiceId ? 'Edit Master Layanan' : 'Tambah Layanan Baru'}
              </h4>
              <button
                type="button"
                onClick={() => setIsServiceModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Kode Layanan</label>
                <input
                  type="text"
                  value={serviceForm.code}
                  onChange={(e) => setServiceForm({ ...serviceForm, code: e.target.value })}
                  placeholder="Contoh: SK-14"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono-num focus:outline-none focus:border-[#0277BD]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Kategori</label>
                <select
                  value={serviceForm.category}
                  onChange={(e) => setServiceForm({ ...serviceForm, category: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:border-[#0277BD]"
                >
                  <option value="Administrasi Kependudukan">Administrasi Kependudukan</option>
                  <option value="Layanan Perizinan & Usaha">Layanan Perizinan & Usaha</option>
                  <option value="Keterangan Umum">Keterangan Umum</option>
                </select>
              </div>

              <div className="col-span-2">
                <label className="block font-bold text-slate-700 mb-1">Nama Layanan</label>
                <input
                  type="text"
                  value={serviceForm.name}
                  onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                  placeholder="Contoh: Surat Keterangan Domisili Organisasi..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#0277BD]"
                />
              </div>

              <div className="col-span-2">
                <label className="block font-bold text-slate-700 mb-1">Deskripsi & Tujuan</label>
                <textarea
                  rows={2}
                  value={serviceForm.description}
                  onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                  placeholder="Keterangan kegunaan surat..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#0277BD]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Estimasi Waktu</label>
                <input
                  type="text"
                  value={serviceForm.estimatedProcessingTime}
                  onChange={(e) => setServiceForm({ ...serviceForm, estimatedProcessingTime: e.target.value })}
                  placeholder="Contoh: 1 - 2 Hari Kerja"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#0277BD]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Pejabat Penyetuju</label>
                <input
                  type="text"
                  value={serviceForm.approverRole}
                  onChange={(e) => setServiceForm({ ...serviceForm, approverRole: e.target.value })}
                  placeholder="Lurah / Kasi"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#0277BD]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsServiceModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl bg-[#0D3868] text-white text-xs font-extrabold hover:bg-[#072647] transition cursor-pointer shadow-xs"
              >
                {isSubmitting ? 'Menyimpan...' : 'Simpan Layanan'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* =========================================================================
          MODAL: ADD FIELD DINAMIS
      ========================================================================= */}
      {isFieldModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <form
            onSubmit={handleAddFieldToService}
            className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4 my-8"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="font-extrabold text-slate-900 text-base">Tambah Kolom Formulir</h4>
              <button
                type="button"
                onClick={() => setIsFieldModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Label Kolom</label>
                <input
                  type="text"
                  value={fieldForm.label}
                  onChange={(e) => setFieldForm({ ...fieldForm, label: e.target.value })}
                  placeholder="Contoh: Nama Usaha / Alamat Asal..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#0277BD]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tipe Input</label>
                <select
                  value={fieldForm.type}
                  onChange={(e) => setFieldForm({ ...fieldForm, type: e.target.value as FormFieldType })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:border-[#0277BD]"
                >
                  <option value="text">Teks Singkat (Text)</option>
                  <option value="number">Angka (Number)</option>
                  <option value="date">Tanggal (Date)</option>
                  <option value="select">Pilihan Dropdown (Select)</option>
                  <option value="textarea">Teks Panjang (Textarea)</option>
                  <option value="address">Alamat Lengkap</option>
                  <option value="nik">Nomor KTP / NIK</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Placeholder (Opsional)</label>
                <input
                  type="text"
                  value={fieldForm.placeholder}
                  onChange={(e) => setFieldForm({ ...fieldForm, placeholder: e.target.value })}
                  placeholder="Contoh: Masukkan nama toko..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#0277BD]"
                />
              </div>

              {fieldForm.type === 'select' && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Daftar Pilihan (1 baris per opsi)
                  </label>
                  <textarea
                    rows={3}
                    value={fieldOptionsText}
                    onChange={(e) => setFieldOptionsText(e.target.value)}
                    placeholder="Pilihan 1&#10;Pilihan 2&#10;Pilihan 3"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#0277BD]"
                  />
                </div>
              )}

              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={fieldForm.required}
                  onChange={(e) => setFieldForm({ ...fieldForm, required: e.target.checked })}
                  className="rounded text-[#0277BD] focus:ring-[#0277BD]"
                />
                <span className="font-bold text-slate-800">Kolom ini wajib diisi oleh pemohon</span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsFieldModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-emerald-700 text-white text-xs font-extrabold hover:bg-emerald-800 transition cursor-pointer shadow-xs"
              >
                Tambahkan Kolom
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
