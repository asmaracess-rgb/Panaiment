import React, { useState, useMemo } from 'react';
import {
  FileText,
  AlertCircle,
  CheckCircle2,
  Clock,
  Search,
  Upload,
  ArrowRight,
  ArrowLeft,
  Check,
  ChevronRight,
  Copy,
  Printer,
  Sparkles,
  ShieldCheck,
  MapPin,
  Calendar,
  User,
  Phone,
  CreditCard,
  Building2,
  Send,
  Eye,
  Info,
  QrCode,
  Layers,
  X,
  FileCheck,
  HelpCircle,
  Lock,
  ExternalLink,
  Smartphone,
  Megaphone,
} from 'lucide-react';
import { RestrictedAccessModal } from './RestrictedAccessModal';
import {
  MasterLayananItem,
  MasterPersyaratanItem,
  DynamicFormField,
  PraRegistrasiRecord,
  PengaduanOnlineRecord,
  PengaduanKategori,
  PraRegistrasiStatus,
  PengaduanOnlineStatus,
  UploadedDocFile,
  AuthenticatedUserProfile,
  RwGroup,
  AppView,
} from '../types';
import {
  INITIAL_MASTER_LAYANAN,
  INITIAL_MASTER_PERSYARATAN,
  DAFTAR_KATEGORI_PENGADUAN,
} from '../data/pelayananMasterData';
import { QRCodeModal } from './QRCodeModal';
import { compressImageFile } from '../utils/compressImage';
import { getRealtimeDateTimeString, getRealtimeDateString } from '../utils/realtimeDate';
import { downloadOfficialLetterOrReceiptPdf } from '../utils/officialLetterPdfGenerator';

interface PelayananKelurahanModuleProps {
  userProfile?: AuthenticatedUserProfile | null;
  rwGroups?: RwGroup[];
  praRegistrasiList: PraRegistrasiRecord[];
  pengaduanList: PengaduanOnlineRecord[];
  masterLayananList?: MasterLayananItem[];
  masterPersyaratanList?: MasterPersyaratanItem[];
  kategoriPengaduanList?: PengaduanKategori[];
  onAddPraRegistrasi: (record: Omit<PraRegistrasiRecord, 'id' | 'ticketCode' | 'submittedAt' | 'updatedAt' | 'status'>) => Promise<string>;
  onAddPengaduan: (record: Omit<PengaduanOnlineRecord, 'id' | 'ticketCode' | 'submittedAt' | 'updatedAt' | 'status'>) => Promise<string>;
  onNavigate?: (view: AppView) => void;
  defaultActiveModule?: 'hub' | 'pra_registrasi' | 'pengaduan';
}

export const PelayananKelurahanModule: React.FC<PelayananKelurahanModuleProps> = ({
  userProfile,
  rwGroups = [],
  praRegistrasiList,
  pengaduanList,
  masterLayananList = INITIAL_MASTER_LAYANAN,
  masterPersyaratanList = INITIAL_MASTER_PERSYARATAN,
  kategoriPengaduanList = DAFTAR_KATEGORI_PENGADUAN,
  onAddPraRegistrasi,
  onAddPengaduan,
  onNavigate,
  defaultActiveModule = 'hub',
}) => {
  // Navigation within module
  const [activeModule, setActiveModule] = useState<'hub' | 'pra_registrasi' | 'pengaduan'>(defaultActiveModule);
  const [restrictedModal, setRestrictedModal] = useState<{
    isOpen: boolean;
    title: string;
    description?: string;
  } | null>(null);

  const checkAuthOrPrompt = (title: string, description?: string): boolean => {
    if (!userProfile) {
      setRestrictedModal({
        isOpen: true,
        title,
        description:
          description ||
          `Layanan "${title}" memerlukan akun warga terdaftar. Silakan masuk atau mendaftar akun warga terlebih dahulu untuk melanjutkan.`,
      });
      return false;
    }
    return true;
  };

  React.useEffect(() => {
    if ((defaultActiveModule === 'pra_registrasi' || defaultActiveModule === 'pengaduan') && !userProfile) {
      setActiveModule('hub');
      setRestrictedModal({
        isOpen: true,
        title: defaultActiveModule === 'pra_registrasi' ? 'Pra Registrasi Online' : 'Pengaduan Online',
        description: `Layanan ${
          defaultActiveModule === 'pra_registrasi' ? 'Pra Registrasi Online' : 'Pengaduan Online'
        } memerlukan akun warga terdaftar. Silakan masuk atau mendaftar akun warga terlebih dahulu untuk mengakses layanan ini.`,
      });
      return;
    }
    setActiveModule(defaultActiveModule);
  }, [defaultActiveModule, userProfile]);
  
  // Pra Registrasi Submenus: 'daftar' | 'form' | 'saya' | 'sukses'
  const [praSubmenu, setPraSubmenu] = useState<'daftar' | 'form' | 'saya' | 'sukses'>('daftar');
  
  // Pengaduan Submenus: 'buat' | 'saya' | 'sukses'
  const [pengaduanSubmenu, setPengaduanSubmenu] = useState<'buat' | 'saya' | 'sukses'>('buat');

  // Selected Service for Pra-Registrasi
  const [selectedService, setSelectedService] = useState<MasterLayananItem | null>(null);

  // Pra-Registrasi 7-Step Wizard:
  // 1: Detail Layanan, 2: Persyaratan, 3: Formulir, 4: Upload Dokumen, 5: Pemeriksaan Kelengkapan, 6: Konfirmasi, 7: Tiket + QR
  const [praStep, setPraStep] = useState<number>(1);

  // Pra-Registrasi Form Inputs
  const [applicantName, setApplicantName] = useState(userProfile?.fullName || '');
  const [applicantNik, setApplicantNik] = useState(userProfile?.nik || '');
  const [applicantPhone, setApplicantPhone] = useState(userProfile?.phone || '');
  const [applicantRw, setApplicantRw] = useState(userProfile?.rw || 'RW 01');
  const [applicantRt, setApplicantRt] = useState(userProfile?.rt || 'RT 01');
  const [applicantAddress, setApplicantAddress] = useState(userProfile?.address || '');
  const [dynamicFormValues, setDynamicFormValues] = useState<Record<string, any>>({});
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, UploadedDocFile>>({});
  const [confirmedDeclaration, setConfirmedDeclaration] = useState(false);
  const [isSubmittingPra, setIsSubmittingPra] = useState(false);
  const [createdPraTicket, setCreatedPraTicket] = useState<string>('');

  // Pengaduan Form Inputs
  const [aduanCategory, setAduanCategory] = useState<PengaduanKategori>(kategoriPengaduanList[0] || 'Infrastruktur');
  const [aduanTitle, setAduanTitle] = useState('');
  const [aduanContent, setAduanContent] = useState('');
  const [aduanLocation, setAduanLocation] = useState('');
  const [aduanDate, setAduanDate] = useState(getRealtimeDateString());
  const [aduanPhotos, setAduanPhotos] = useState<string[]>([]);
  const [aduanIsAnonymous, setAduanIsAnonymous] = useState(false);
  const [aduanReporterName, setAduanReporterName] = useState(userProfile?.fullName || '');
  const [aduanReporterPhone, setAduanReporterPhone] = useState(userProfile?.phone || '');
  const [aduanReporterRw, setAduanReporterRw] = useState(userProfile?.rw || 'RW 01');
  const [aduanReporterRt, setAduanReporterRt] = useState(userProfile?.rt || 'RT 01');
  const [isSubmittingAduan, setIsSubmittingAduan] = useState(false);
  const [createdAduanTicket, setCreatedAduanTicket] = useState<string>('');

  // QR Modal State
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrModalData, setQrModalData] = useState<{
    ticketCode: string;
    title: string;
    applicantName?: string;
    categoryOrService?: string;
    submittedAt?: string;
    statusBadge?: string;
  }>({
    ticketCode: '',
    title: '',
  });

  // Filters & Search
  const [serviceSearch, setServiceSearch] = useState('');
  const [selectedServiceCat, setSelectedServiceCat] = useState('ALL');
  const [praStatusFilter, setPraStatusFilter] = useState<string>('ALL');
  const [pengaduanStatusFilter, setPengaduanStatusFilter] = useState<string>('ALL');

  // Error & Feedback
  const [formError, setFormError] = useState('');
  const [uploadLoading, setUploadLoading] = useState<string | null>(null);

  // Sync profile when userProfile changes
  React.useEffect(() => {
    if (userProfile) {
      if (!applicantName) setApplicantName(userProfile.fullName);
      if (!applicantNik) setApplicantNik(userProfile.nik || '');
      if (!applicantPhone) setApplicantPhone(userProfile.phone || '');
      if (!applicantRw) setApplicantRw(userProfile.rw || 'RW 01');
      if (!applicantRt) setApplicantRt(userProfile.rt || 'RT 01');
      if (!applicantAddress) setApplicantAddress(userProfile.address || '');
      if (!aduanReporterName) setAduanReporterName(userProfile.fullName);
      if (!aduanReporterPhone) setAduanReporterPhone(userProfile.phone || '');
    }
  }, [userProfile]);

  // Filtered Services
  const filteredServices = useMemo(() => {
    return masterLayananList.filter((s) => {
      if (!s.isActive) return false;
      const matchCat = selectedServiceCat === 'ALL' || s.category === selectedServiceCat;
      const matchQuery =
        !serviceSearch.trim() ||
        s.name.toLowerCase().includes(serviceSearch.toLowerCase()) ||
        s.code.toLowerCase().includes(serviceSearch.toLowerCase()) ||
        s.description.toLowerCase().includes(serviceSearch.toLowerCase());
      return matchCat && matchQuery;
    });
  }, [masterLayananList, selectedServiceCat, serviceSearch]);

  // Unique Service Categories
  const serviceCategories = useMemo(() => {
    const set = new Set<string>();
    masterLayananList.forEach((s) => set.add(s.category));
    return Array.from(set);
  }, [masterLayananList]);

  // Citizen's Own Submissions Only (No fallback to all records)
  const myPraList = useMemo(() => {
    if (!userProfile) return [];
    return praRegistrasiList.filter((r) => {
      if (userProfile.uid && r.applicantUid === userProfile.uid) return true;
      if (userProfile.email && r.applicantEmail?.toLowerCase() === userProfile.email.toLowerCase()) return true;
      if (applicantNik && r.applicantNik === applicantNik) return true;
      if (userProfile.fullName && r.applicantName?.toLowerCase() === userProfile.fullName.toLowerCase()) return true;
      if (userProfile.phone && r.applicantPhone === userProfile.phone) return true;
      return false;
    });
  }, [praRegistrasiList, userProfile, applicantNik]);

  const filteredMyPra = useMemo(() => {
    if (praStatusFilter === 'ALL') return myPraList;
    if (praStatusFilter === 'MENUNGGU_KEDATANGAN') {
      return myPraList.filter((r) => r.status === 'MENUNGGU_KEDATANGAN' || r.status === 'DIAJUKAN');
    }
    if (praStatusFilter === 'SEDANG_DIPROSES') {
      return myPraList.filter(
        (r) =>
          r.status === 'VERIFIKASI_PETUGAS' ||
          r.status === 'BERKAS_LENGKAP' ||
          r.status === 'DIPROSES' ||
          r.status === 'MENUNGGU_PERSETUJUAN' ||
          r.status === 'PERLU_PERBAIKAN'
      );
    }
    if (praStatusFilter === 'SELESAI') {
      return myPraList.filter((r) => r.status === 'DISETUJUI' || r.status === 'SURAT_SELESAI' || r.status === 'DITUTUP');
    }
    return myPraList;
  }, [myPraList, praStatusFilter]);

  const myPengaduanList = useMemo(() => {
    if (!userProfile) return [];
    return pengaduanList.filter((p) => {
      if (userProfile.uid && p.reporterUid === userProfile.uid) return true;
      if (userProfile.phone && p.reporterPhone === userProfile.phone) return true;
      if (userProfile.fullName && p.reporterName?.toLowerCase() === userProfile.fullName.toLowerCase()) return true;
      return false;
    });
  }, [pengaduanList, userProfile]);

  const filteredMyPengaduan = useMemo(() => {
    if (pengaduanStatusFilter === 'ALL') return myPengaduanList;
    if (pengaduanStatusFilter === 'SEDANG_DIPROSES') {
      return myPengaduanList.filter(
        (p) =>
          p.status === 'DIAJUKAN' ||
          p.status === 'DITERIMA' ||
          p.status === 'DIVERIFIKASI' ||
          p.status === 'DITINDAKLANJUTI' ||
          p.status === 'MENUNGGU_INFORMASI'
      );
    }
    if (pengaduanStatusFilter === 'SELESAI') {
      return myPengaduanList.filter((p) => p.status === 'SELESAI');
    }
    return myPengaduanList;
  }, [myPengaduanList, pengaduanStatusFilter]);

  // File Upload Handler for Pra-Registrasi
  const handleFileUpload = async (persyaratanId: string, docName: string, file: File) => {
    setUploadLoading(persyaratanId);
    setFormError('');
    try {
      const isImg = file.type.startsWith('image/');
      let fileUrl = '';
      if (isImg) {
        fileUrl = await compressImageFile(file, 1200, 0.75);
      } else {
        // Read as data URL
        fileUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      }

      const uploadedDoc: UploadedDocFile = {
        persyaratanId,
        docName,
        persyaratanLabel: docName,
        fileUrl,
        fileName: file.name,
        fileSizeKb: Math.round(file.size / 1024),
        uploadedAt: getRealtimeDateTimeString(),
        verificationStatus: 'Belum Diperiksa',
      };

      setUploadedFiles((prev) => ({
        ...prev,
        [persyaratanId]: uploadedDoc,
      }));
    } catch (err) {
      setFormError(`Gagal membaca berkas ${file.name}. Silakan gunakan format file JPG/PNG atau PDF.`);
    } finally {
      setUploadLoading(null);
    }
  };

  // Complaint Photo Upload Handler
  const handleAduanPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadLoading('aduan_photo');
    setFormError('');
    try {
      const newUrls: string[] = [];
      for (let i = 0; i < Math.min(files.length, 3); i++) {
        const file = files[i];
        const compressed = await compressImageFile(file, 1000, 0.7);
        newUrls.push(compressed);
      }
      setAduanPhotos((prev) => [...prev, ...newUrls].slice(0, 4));
    } catch {
      setFormError('Gagal mengunggah foto bukti. Pastikan format gambar berupa JPG atau PNG.');
    } finally {
      setUploadLoading(null);
    }
  };

  // Start registration for a specific service
  const handleSelectServiceToRegister = (service: MasterLayananItem) => {
    if (
      !checkAuthOrPrompt(
        `Pra Registrasi ${service.name}`,
        `Layanan Pra Registrasi "${service.name}" memerlukan akun warga terdaftar. Silakan masuk atau mendaftar akun warga terlebih dahulu.`
      )
    ) {
      return;
    }
    setSelectedService(service);
    setPraStep(1);
    setPraSubmenu('form');
    setDynamicFormValues({});
    setUploadedFiles({});
    setConfirmedDeclaration(false);
    setFormError('');
  };

  // Submit Pra-Registrasi
  const handleSubmitPraRegistrasi = async () => {
    if (!selectedService) return;
    setFormError('');

    if (
      !checkAuthOrPrompt(
        'Pra Registrasi Online',
        'Anda harus masuk dengan akun warga terdaftar untuk mengirimkan permohonan Pra Registrasi.'
      )
    ) {
      return;
    }

    if (!applicantName.trim() || applicantName.trim().length < 2) {
      setFormError('Nama lengkap pemohon wajib diisi.');
      setPraStep(3);
      return;
    }
    const cleanNik = applicantNik.replace(/\D/g, '').trim();
    if (cleanNik.length !== 16) {
      setFormError('Nomor Induk Kependudukan (NIK) harus terdiri dari 16 digit angka.');
      setPraStep(3);
      return;
    }
    if (!applicantPhone.trim() || applicantPhone.trim().length < 8) {
      setFormError('Nomor WhatsApp / HP aktif pemohon wajib diisi.');
      setPraStep(3);
      return;
    }
    if (!applicantAddress.trim()) {
      setFormError('Alamat domisili pemohon wajib diisi.');
      setPraStep(3);
      return;
    }

    // Check required docs
    const missingDocs: string[] = [];
    selectedService.requiredDocs.forEach((doc) => {
      if (doc.requirementType === 'Wajib' && !uploadedFiles[doc.persyaratanId]) {
        missingDocs.push(doc.persyaratanName);
      }
    });

    if (missingDocs.length > 0) {
      setFormError(`Mohon upload dokumen wajib berikut terlebih dahulu: ${missingDocs.join(', ')}`);
      setPraStep(4);
      return;
    }

    if (!confirmedDeclaration) {
      setFormError('Harap centang surat pernyataan kebenaran berkas sebelum mengirimkan registrasi.');
      setPraStep(6);
      return;
    }

    setIsSubmittingPra(true);
    try {
      const uploadedDocsList: UploadedDocFile[] = Object.values(uploadedFiles);
      const ticketCode = await onAddPraRegistrasi({
        serviceId: selectedService.id,
        serviceCode: selectedService.code,
        serviceName: selectedService.name,
        applicantUid: userProfile?.uid,
        applicantEmail: userProfile?.email,
        applicantName: applicantName.trim(),
        applicantNik: cleanNik,
        applicantPhone: applicantPhone.trim(),
        applicantRw,
        applicantRt,
        applicantAddress: applicantAddress.trim(),
        formData: dynamicFormValues,
        uploadedDocs: uploadedDocsList,
        scheduledArrivalDate: getRealtimeDateString(),
      });

      setCreatedPraTicket(ticketCode);
      setPraStep(7);
      setPraSubmenu('sukses');
    } catch (err) {
      setFormError('Terjadi kendala saat mengirimkan pra-registrasi. Silakan coba kembali.');
    } finally {
      setIsSubmittingPra(false);
    }
  };

  // Submit Pengaduan Online
  const handleSubmitPengaduan = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (
      !checkAuthOrPrompt(
        'Pengaduan Online',
        'Anda harus masuk dengan akun warga terdaftar untuk menyampaikan pengaduan online.'
      )
    ) {
      return;
    }

    if (!aduanTitle.trim() || aduanTitle.trim().length < 5) {
      setFormError('Judul pengaduan minimal 5 karakter.');
      return;
    }
    if (!aduanContent.trim() || aduanContent.trim().length < 10) {
      setFormError('Isi pengaduan atau uraian masalah minimal 10 karakter.');
      return;
    }
    if (!aduanLocation.trim() || aduanLocation.trim().length < 3) {
      setFormError('Lokasi kejadian wajib diisi dengan jelas.');
      return;
    }
    if (!aduanIsAnonymous && (!aduanReporterName.trim() || aduanReporterName.trim().length < 2)) {
      setFormError('Nama pelapor wajib diisi bila tidak memilih mode anonim.');
      return;
    }

    setIsSubmittingAduan(true);
    try {
      const ticketCode = await onAddPengaduan({
        category: aduanCategory,
        title: aduanTitle.trim(),
        content: aduanContent.trim(),
        locationAddress: aduanLocation.trim(),
        incidentDate: aduanDate || getRealtimeDateString(),
        proofPhotos: aduanPhotos,
        isAnonymous: aduanIsAnonymous,
        reporterUid: userProfile?.uid,
        reporterName: aduanIsAnonymous ? 'Warga Panaikang (Anonim)' : aduanReporterName.trim(),
        reporterPhone: aduanIsAnonymous ? '-' : aduanReporterPhone.trim() || '-',
        reporterRw: aduanReporterRw,
        reporterRt: aduanReporterRt,
      });

      setCreatedAduanTicket(ticketCode);
      setPengaduanSubmenu('sukses');
      setAduanTitle('');
      setAduanContent('');
      setAduanLocation('');
      setAduanPhotos([]);
    } catch {
      setFormError('Gagal mengirim pengaduan. Mohon periksa koneksi Anda lalu coba kembali.');
    } finally {
      setIsSubmittingAduan(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* =========================================================================
          HUB VIEW: 2 MAIN CARDS ("Pelayanan Kelurahan")
      ========================================================================= */}
      {activeModule === 'hub' && (
        <div className="space-y-6">
          {/* Header Title */}
          <div className="pb-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-xs font-black tracking-wider text-[#0277BD] uppercase">
                PORTAL RESMI PELAYANAN
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0D3868] mt-1">
                Pelayanan Kelurahan Panaikang
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1.5 max-w-2xl leading-relaxed">
                Pilih modul pelayanan yang ingin Anda gunakan. Selesaikan pra-registrasi berkas administrasi sebelum datang ke kantor, atau sampaikan pengaduan dan aspirasi lingkungan Anda secara online.
              </p>
            </div>
            <span className="inline-flex items-center px-3.5 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-extrabold self-start border border-emerald-200">
              ◉ Layanan Terintegrasi
            </span>
          </div>

          {!userProfile && (
            <div className="bg-sky-50/90 border border-sky-200 rounded-2xl px-4 py-3.5 sm:px-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-sky-950 shadow-2xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-sky-100/80 border border-sky-200/80 flex items-center justify-center shrink-0">
                  <Lock className="w-4 h-4 text-sky-600 shrink-0" strokeWidth={1.75} />
                </div>
                <div className="leading-relaxed">
                  <span className="font-bold text-sky-950">Akses Layanan Terkunci: </span>
                  <span className="text-sky-800">
                    Proses Pra Registrasi dan Pengaduan Online mengharuskan Anda masuk atau mendaftar akun warga terlebih dahulu.
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onNavigate && onNavigate('login')}
                className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold shrink-0 cursor-pointer shadow-2xs transition-colors"
              >
                Masuk / Daftar Akun Warga
              </button>
            </div>
          )}

          {/* 2 Primary Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch">
            {/* CARD 1: Pra Registrasi Online */}
            <article className="rounded-2xl border border-slate-200 hover:border-[#0277BD] p-5 sm:p-6 bg-white hover:shadow-md transition-all flex flex-col justify-between h-full group relative overflow-hidden">
              <div className="relative z-10 space-y-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="w-11 h-11 rounded-xl bg-sky-50 border border-sky-200/80 flex items-center justify-center text-[#0277BD] group-hover:scale-105 transition-transform shadow-2xs shrink-0">
                    <FileText className="w-5 h-5" strokeWidth={1.75} />
                  </div>
                  <span className="text-[11px] font-bold tracking-wide uppercase text-[#0277BD] bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-100">
                    Administrasi Persuratan
                  </span>
                </div>

                <div>
                  <h3 className="text-lg sm:text-xl font-extrabold text-[#0D3868]">
                    Pra Registrasi Online
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mt-1">
                    Daftar layanan administrasi sebelum datang ke kantor kelurahan. Pilih jenis surat, unggah dokumen persyaratan, dan dapatkan tiket QR Code resmi untuk verifikasi di loket.
                  </p>
                </div>

                <div className="pt-1">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Alur Proses:
                  </div>
                  <div className="flex flex-wrap items-center gap-1 text-[11px] font-semibold text-slate-700">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100">Detail</span>
                    <span className="text-slate-400">→</span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-100">Persyaratan</span>
                    <span className="text-slate-400">→</span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-100">Formulir</span>
                    <span className="text-slate-400">→</span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-100">Upload</span>
                    <span className="text-slate-400">→</span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-100">Konfirmasi</span>
                    <span className="text-slate-400">→</span>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold">Tiket + QR</span>
                  </div>
                </div>
              </div>

              <div className="relative z-10 mt-5 -mx-5 sm:-mx-6 -mb-5 sm:-mb-6 px-5 sm:px-6 py-3.5 bg-slate-50 border-t border-slate-200/90 rounded-b-2xl flex items-center justify-between gap-3">
                <span className="text-xs font-bold text-slate-600">
                  13 Layanan Surat Resmi
                </span>
                <button
                  type="button"
                  onClick={() => {
                    if (
                      !checkAuthOrPrompt(
                        'Pra Registrasi Online',
                        'Layanan Pra Registrasi Online memerlukan akun warga terdaftar. Silakan masuk atau mendaftar akun warga terlebih dahulu untuk mengajukan permohonan persuratan.'
                      )
                    ) {
                      return;
                    }
                    setActiveModule('pra_registrasi');
                    setPraSubmenu('daftar');
                  }}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#0277BD] hover:bg-[#0D3868] text-white text-xs font-bold transition shadow-2xs cursor-pointer shrink-0"
                >
                  <span>Buka Pra Registrasi</span>
                  {!userProfile && <Lock className="w-3.5 h-3.5 shrink-0 opacity-90" strokeWidth={1.75} />}
                  <ArrowRight className="w-4 h-4 shrink-0" strokeWidth={1.75} />
                </button>
              </div>
            </article>

            {/* CARD 2: Pengaduan Online */}
            <article className="rounded-2xl border border-slate-200 hover:border-emerald-600 p-5 sm:p-6 bg-white hover:shadow-md transition-all flex flex-col justify-between h-full group relative overflow-hidden">
              <div className="relative z-10 space-y-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-600 group-hover:scale-105 transition-transform shadow-2xs shrink-0">
                    <Megaphone className="w-5 h-5" strokeWidth={1.75} />
                  </div>
                  <span className="text-[11px] font-bold tracking-wide uppercase text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
                    Aspirasi &amp; Keluhan Warga
                  </span>
                </div>

                <div>
                  <h3 className="text-lg sm:text-xl font-extrabold text-[#0D3868]">
                    Pengaduan Online
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mt-1">
                    Sampaikan pengaduan, keluhan, aspirasi, atau laporan kepada Kelurahan Panaikang. Lampirkan foto bukti dan pantau status penanganan petugas secara transparan.
                  </p>
                </div>

                <div className="pt-1">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    10 Kategori Layanan Pengaduan:
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {kategoriPengaduanList.slice(0, 6).map((cat) => (
                      <span key={cat} className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-[11px] font-semibold border border-emerald-100">
                        {cat}
                      </span>
                    ))}
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[11px] font-semibold">
                      +{kategoriPengaduanList.length - 6} Lainnya
                    </span>
                  </div>
                </div>
              </div>

              <div className="relative z-10 mt-5 -mx-5 sm:-mx-6 -mb-5 sm:-mb-6 px-5 sm:px-6 py-3.5 bg-slate-50 border-t border-slate-200/90 rounded-b-2xl flex items-center justify-between gap-3">
                <span className="text-xs font-bold text-slate-600">
                  Pelacakan Tiket Terbuka
                </span>
                <button
                  type="button"
                  onClick={() => {
                    if (
                      !checkAuthOrPrompt(
                        'Pengaduan Online',
                        'Layanan Pengaduan Online memerlukan akun warga terdaftar. Silakan masuk atau mendaftar akun warga terlebih dahulu untuk menyampaikan pengaduan atau keluhan.'
                      )
                    ) {
                      return;
                    }
                    setActiveModule('pengaduan');
                    setPengaduanSubmenu('buat');
                  }}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition shadow-2xs cursor-pointer shrink-0"
                >
                  <span>Sampaikan Pengaduan</span>
                  {!userProfile && <Lock className="w-3.5 h-3.5 shrink-0 opacity-90" strokeWidth={1.75} />}
                  <ArrowRight className="w-4 h-4 shrink-0" strokeWidth={1.75} />
                </button>
              </div>
            </article>
          </div>

          {/* Lontara+ Reference Card (Subtle, without colored banner, fine border separator) */}
          <div className="pt-5 border-t border-slate-200 mt-5">
            <a
              href="https://lontaraplus.go.id/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-200 hover:border-[#0277BD] transition shadow-2xs group"
            >
              <div className="flex items-center gap-3">
                <div className="w-16 h-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform overflow-hidden border border-slate-200 px-1.5 py-1">
                  <img
                    src="/images/lontara-plus-logo.svg"
                    alt="Lontara+ Logo"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-[#0D3868] tracking-wide">Lontara+</span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold">
                      Aplikasi Layanan Publik Kota Makassar
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Portal resmi terintegrasi layanan pemerintah &amp; adminduk Kota Makassar
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#0277BD] group-hover:underline shrink-0">
                <span>Buka</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </div>
            </a>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODULE A: PRA REGISTRASI ONLINE
      ========================================================================= */}
      {activeModule === 'pra_registrasi' && (
        <div className="space-y-6">
          {/* Sub-Header & Navigation */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setActiveModule('hub')}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 transition cursor-pointer"
                title="Kembali ke Menu Utama Pelayanan"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h3 className="text-lg font-black text-[#0D3868] flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#0277BD]" strokeWidth={1.75} />
                  <span>Pra Registrasi Online</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Daftar layanan administrasi persuratan sebelum datang ke kantor kelurahan.
                </p>
              </div>
            </div>

            {/* Submenu Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setPraSubmenu('daftar')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  praSubmenu === 'daftar'
                    ? 'bg-white text-[#0D3868] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Daftar Layanan ({filteredServices.length})
              </button>
              <button
                type="button"
                onClick={() => {
                  if (
                    !checkAuthOrPrompt(
                      'Pra Registrasi Baru',
                      'Layanan Registrasi Baru memerlukan akun warga terdaftar. Silakan masuk atau mendaftar akun warga terlebih dahulu.'
                    )
                  ) {
                    return;
                  }
                  if (!selectedService && filteredServices.length > 0) {
                    handleSelectServiceToRegister(filteredServices[0]);
                  } else {
                    setPraSubmenu('form');
                  }
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  praSubmenu === 'form'
                    ? 'bg-white text-[#0D3868] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>Registrasi Baru</span>
                {!userProfile && <Lock className="w-3.5 h-3.5 shrink-0 opacity-75" strokeWidth={1.75} />}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (
                    !checkAuthOrPrompt(
                      'Riwayat Registrasi Saya',
                      'Untuk melihat daftar riwayat pra registrasi Anda, silakan masuk atau mendaftar akun warga terlebih dahulu.'
                    )
                  ) {
                    return;
                  }
                  setPraSubmenu('saya');
                  setPraStatusFilter('ALL');
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  praSubmenu === 'saya' && praStatusFilter === 'ALL'
                    ? 'bg-white text-[#0D3868] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>Registrasi Saya ({myPraList.length})</span>
                {!userProfile && <Lock className="w-3.5 h-3.5 shrink-0 opacity-75" strokeWidth={1.75} />}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (
                    !checkAuthOrPrompt(
                      'Menunggu Kedatangan',
                      'Untuk melihat status permohonan antrean kedatangan Anda, silakan masuk atau mendaftar akun warga terlebih dahulu.'
                    )
                  ) {
                    return;
                  }
                  setPraSubmenu('saya');
                  setPraStatusFilter('MENUNGGU_KEDATANGAN');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  praSubmenu === 'saya' && praStatusFilter === 'MENUNGGU_KEDATANGAN'
                    ? 'bg-white text-[#0D3868] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Menunggu Kedatangan
              </button>
              <button
                type="button"
                onClick={() => {
                  if (
                    !checkAuthOrPrompt(
                      'Sedang Diproses',
                      'Untuk melihat status pemrosesan persuratan Anda, silakan masuk atau mendaftar akun warga terlebih dahulu.'
                    )
                  ) {
                    return;
                  }
                  setPraSubmenu('saya');
                  setPraStatusFilter('SEDANG_DIPROSES');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  praSubmenu === 'saya' && praStatusFilter === 'SEDANG_DIPROSES'
                    ? 'bg-white text-[#0D3868] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Sedang Diproses
              </button>
              <button
                type="button"
                onClick={() => {
                  if (
                    !checkAuthOrPrompt(
                      'Registrasi Selesai',
                      'Untuk melihat berkas surat yang telah selesai, silakan masuk atau mendaftar akun warga terlebih dahulu.'
                    )
                  ) {
                    return;
                  }
                  setPraSubmenu('saya');
                  setPraStatusFilter('SELESAI');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  praSubmenu === 'saya' && praStatusFilter === 'SELESAI'
                    ? 'bg-white text-[#0D3868] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Selesai
              </button>
            </div>
          </div>

          {/* Submenu: DAFTAR LAYANAN (13 Official Services) */}
          {praSubmenu === 'daftar' && (
            <div className="space-y-5">
              {/* Search & Filter Bar */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={serviceSearch}
                    onChange={(e) => setServiceSearch(e.target.value)}
                    placeholder="Cari jenis surat (misal: SKCK, Domisili, SKU, Pindah Masuk)..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0277BD]"
                  />
                </div>
                <select
                  value={selectedServiceCat}
                  onChange={(e) => setSelectedServiceCat(e.target.value)}
                  className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:border-[#0277BD]"
                >
                  <option value="ALL">Semua Kategori ({masterLayananList.length})</option>
                  {serviceCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Service Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredServices.map((service) => (
                  <div
                    key={service.id}
                    className="rounded-2xl border border-slate-200 p-5 bg-white hover:border-[#0277BD] hover:shadow-md transition-all flex flex-col justify-between group"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-sky-50 text-[#0277BD] text-[10px] font-black font-mono-num border border-sky-100">
                          {service.code}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{service.estimatedProcessingTime}</span>
                        </span>
                      </div>

                      <h4 className="text-base font-extrabold text-[#0D3868] group-hover:text-[#0277BD] transition-colors">
                        {service.name}
                      </h4>

                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {service.description}
                      </p>

                      <div className="pt-2 border-t border-slate-100">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                          Persyaratan ({service.requiredDocs.length} Berkas):
                        </div>
                        <ul className="text-[11px] text-slate-600 space-y-0.5 list-disc list-inside">
                          {service.requiredDocs.slice(0, 3).map((d, i) => (
                            <li key={i} className="truncate">
                              {d.persyaratanName}{' '}
                              {d.requirementType === 'Wajib' && (
                                <span className="text-rose-500 font-bold">*</span>
                              )}
                            </li>
                          ))}
                          {service.requiredDocs.length > 3 && (
                            <li className="text-slate-400 list-none text-[10px] pl-3">
                              +{service.requiredDocs.length - 3} berkas lainnya
                            </li>
                          )}
                        </ul>
                      </div>
                    </div>

                    <div className="mt-5 pt-3 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => handleSelectServiceToRegister(service)}
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-[#0277BD] text-white text-xs font-bold transition cursor-pointer shadow-xs"
                      >
                        <span>Pilih & Mulai Registrasi</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Submenu: 7-STEP PRA-REGISTRASI WIZARD */}
          {praSubmenu === 'form' && selectedService && (
            <div className="space-y-6">
              {/* Service header banner */}
              <div className="bg-gradient-to-r from-[#072647] to-[#0277BD] rounded-2xl p-5 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-white/20 text-sky-100 text-[10px] font-black font-mono-num">
                      {selectedService.code}
                    </span>
                    <span className="text-xs text-sky-200">
                      Estimasi: {selectedService.estimatedProcessingTime}
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-white mt-1">
                    Pra Registrasi: {selectedService.name}
                  </h3>
                  <p className="text-xs text-sky-100 max-w-xl mt-0.5">
                    {selectedService.description}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setPraSubmenu('daftar')}
                  className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition cursor-pointer self-start sm:self-auto"
                >
                  Ganti Layanan
                </button>
              </div>

              {/* Step Progression Bar (7 Steps) */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 overflow-x-auto">
                <div className="flex items-center justify-between min-w-[580px] gap-2">
                  {[
                    { step: 1, label: 'Detail' },
                    { step: 2, label: 'Persyaratan' },
                    { step: 3, label: 'Formulir' },
                    { step: 4, label: 'Upload' },
                    { step: 5, label: 'Kelengkapan' },
                    { step: 6, label: 'Konfirmasi' },
                    { step: 7, label: 'Tiket + QR' },
                  ].map((s) => (
                    <div key={s.step} className="flex items-center gap-2 flex-1">
                      <button
                        type="button"
                        onClick={() => {
                          if (s.step < praStep) setPraStep(s.step);
                        }}
                        disabled={s.step > praStep}
                        className={`flex items-center gap-1.5 text-xs font-bold transition cursor-pointer ${
                          praStep === s.step
                            ? 'text-[#0277BD]'
                            : praStep > s.step
                            ? 'text-emerald-700'
                            : 'text-slate-400 cursor-not-allowed'
                        }`}
                      >
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-mono-num font-black ${
                            praStep === s.step
                              ? 'bg-[#0277BD] text-white shadow-xs'
                              : praStep > s.step
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-400'
                          }`}
                        >
                          {praStep > s.step ? '✓' : s.step}
                        </span>
                        <span className="whitespace-nowrap">{s.label}</span>
                      </button>
                      {s.step < 7 && <span className="text-slate-300">─</span>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Error Alert */}
              {formError && (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-800 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{formError}</span>
                  </div>
                  <button type="button" onClick={() => setFormError('')} className="cursor-pointer">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* STEP 1: DETAIL LAYANAN */}
              {praStep === 1 && (
                <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
                  <h4 className="text-base font-extrabold text-[#0D3868] flex items-center gap-2">
                    <span>1. Detail Informasi Layanan</span>
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                      <span className="text-slate-500 font-semibold">Nama Layanan:</span>
                      <p className="font-extrabold text-[#0D3868] text-sm">{selectedService.name}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                      <span className="text-slate-500 font-semibold">Estimasi Waktu Penyelesaian:</span>
                      <p className="font-extrabold text-emerald-700 text-sm">{selectedService.estimatedProcessingTime}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                      <span className="text-slate-500 font-semibold">Pejabat yang Menyetujui:</span>
                      <p className="font-bold text-slate-800">{selectedService.approverRole || 'Lurah Panaikang / Kasi Pelayanan'}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                      <span className="text-slate-500 font-semibold">Kategori:</span>
                      <p className="font-bold text-slate-800">{selectedService.category}</p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-sky-50 border border-sky-100 text-xs text-sky-950 space-y-1.5">
                    <div className="font-bold text-[#0D3868]">📌 Prosedur Pra Registrasi:</div>
                    <p className="text-slate-600 leading-relaxed">
                      Pra-registrasi online ini mempermudah pemeriksaan awal dokumen Anda dari rumah. Setelah selesai mengisi formulir dan mengunggah dokumen, Anda akan memperoleh <strong>Nomor Tiket + QR Code</strong> untuk dibawa bersama dokumen fisik asli saat verifikasi loket kantor kelurahan.
                    </p>
                  </div>

                  <div className="flex justify-end pt-3">
                    <button
                      type="button"
                      onClick={() => setPraStep(2)}
                      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#0277BD] hover:bg-[#0D3868] text-white text-xs font-extrabold transition shadow-xs cursor-pointer"
                    >
                      <span>Lanjut: Lihat Persyaratan</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: PERSYARATAN */}
              {praStep === 2 && (
                <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-base font-extrabold text-[#0D3868] flex items-center gap-2">
                      <span>2. Persyaratan Dokumen</span>
                    </h4>
                    <span className="text-xs font-semibold text-slate-500">
                      Total {selectedService.requiredDocs.length} Berkas
                    </span>
                  </div>

                  <div className="space-y-3">
                    {selectedService.requiredDocs.map((doc, idx) => {
                      const master = masterPersyaratanList.find((p) => p.id === doc.persyaratanId);
                      return (
                        <div
                          key={doc.persyaratanId}
                          className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-start gap-3.5"
                        >
                          <span className="w-6 h-6 rounded-full bg-sky-100 text-[#0277BD] flex items-center justify-center text-xs font-bold font-mono-num shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h5 className="font-bold text-slate-900 text-xs sm:text-sm">
                                {doc.persyaratanName}
                              </h5>
                              <span
                                className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                                  doc.requirementType === 'Wajib'
                                    ? 'bg-rose-100 text-rose-800'
                                    : doc.requirementType === 'Kondisional'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-slate-200 text-slate-700'
                                }`}
                              >
                                {doc.requirementType}
                              </span>
                            </div>
                            {master?.description && (
                              <p className="text-xs text-slate-500">{master.description}</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setPraStep(1)}
                      className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
                    >
                      Kembali
                    </button>
                    <button
                      type="button"
                      onClick={() => setPraStep(3)}
                      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#0277BD] hover:bg-[#0D3868] text-white text-xs font-extrabold transition shadow-xs cursor-pointer"
                    >
                      <span>Lanjut: Isi Formulir</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: FORMULIR PEMOHON & KETERANGAN */}
              {praStep === 3 && (
                <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
                  <h4 className="text-base font-extrabold text-[#0D3868]">
                    3. Formulir Data Pemohon
                  </h4>

                  {/* Standard Applicant Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Nama Lengkap Pemohon (Sesuai KTP) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={applicantName}
                        onChange={(e) => setApplicantName(e.target.value)}
                        placeholder="Masukkan nama lengkap..."
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#0277BD]"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Nomor Induk Kependudukan (NIK - 16 Digit) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        maxLength={16}
                        value={applicantNik}
                        onChange={(e) => setApplicantNik(e.target.value.replace(/\D/g, ''))}
                        placeholder="7371xxxxxxxxxxxx"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono-num focus:outline-none focus:border-[#0277BD]"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Nomor HP / WhatsApp Aktif <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={applicantPhone}
                        onChange={(e) => setApplicantPhone(e.target.value)}
                        placeholder="08xxxxxxxxxx"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono-num focus:outline-none focus:border-[#0277BD]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">RW Wilayah</label>
                        <select
                          value={applicantRw}
                          onChange={(e) => setApplicantRw(e.target.value)}
                          className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:border-[#0277BD]"
                        >
                          {['RW 01', 'RW 02', 'RW 03', 'RW 04', 'RW 05', 'RW 06', 'RW 07'].map((rw) => (
                            <option key={rw} value={rw}>
                              {rw}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">RT</label>
                        <select
                          value={applicantRt}
                          onChange={(e) => setApplicantRt(e.target.value)}
                          className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:border-[#0277BD]"
                        >
                          {['RT 01', 'RT 02', 'RT 03', 'RT 04', 'RT 05'].map((rt) => (
                            <option key={rt} value={rt}>
                              {rt}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block font-bold text-slate-700 mb-1">
                        Alamat Domisili Lengkap di Kelurahan Panaikang <span className="text-rose-500">*</span>
                      </label>
                      <textarea
                        rows={2}
                        value={applicantAddress}
                        onChange={(e) => setApplicantAddress(e.target.value)}
                        placeholder="Nama jalan, nomor rumah, lorong, RT/RW..."
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#0277BD]"
                      />
                    </div>
                  </div>

                  {/* Dynamic Fields Specific to Service */}
                  {selectedService.dynamicFields && selectedService.dynamicFields.length > 0 && (
                    <div className="pt-4 border-t border-slate-200 space-y-4">
                      <h5 className="font-extrabold text-[#0D3868] text-xs uppercase tracking-wider">
                        Informasi Tambahan Khusus {selectedService.name}:
                      </h5>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                        {selectedService.dynamicFields.map((field) => (
                          <div
                            key={field.id}
                            className={field.type === 'textarea' || field.type === 'address' ? 'sm:col-span-2' : ''}
                          >
                            <label className="block font-bold text-slate-700 mb-1">
                              {field.label}{' '}
                              {field.required && <span className="text-rose-500">*</span>}
                            </label>

                            {field.type === 'select' ? (
                              <select
                                value={dynamicFormValues[field.id] || ''}
                                onChange={(e) =>
                                  setDynamicFormValues({
                                    ...dynamicFormValues,
                                    [field.id]: e.target.value,
                                  })
                                }
                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:border-[#0277BD]"
                              >
                                <option value="">-- Pilih {field.label} --</option>
                                {field.options?.map((opt) => (
                                  <option key={opt} value={opt}>
                                    {opt}
                                  </option>
                                ))}
                              </select>
                            ) : field.type === 'textarea' || field.type === 'address' ? (
                              <textarea
                                rows={2}
                                value={dynamicFormValues[field.id] || ''}
                                onChange={(e) =>
                                  setDynamicFormValues({
                                    ...dynamicFormValues,
                                    [field.id]: e.target.value,
                                  })
                                }
                                placeholder={field.placeholder || `Tuliskan ${field.label}...`}
                                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#0277BD]"
                              />
                            ) : (
                              <input
                                type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                                value={dynamicFormValues[field.id] || ''}
                                onChange={(e) =>
                                  setDynamicFormValues({
                                    ...dynamicFormValues,
                                    [field.id]: e.target.value,
                                  })
                                }
                                placeholder={field.placeholder || `Tuliskan ${field.label}...`}
                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#0277BD]"
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setPraStep(2)}
                      className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
                    >
                      Kembali
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!applicantName.trim()) {
                          setFormError('Nama pemohon wajib diisi.');
                          return;
                        }
                        if (applicantNik.replace(/\D/g, '').length !== 16) {
                          setFormError('NIK harus 16 digit.');
                          return;
                        }
                        setFormError('');
                        setPraStep(4);
                      }}
                      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#0277BD] hover:bg-[#0D3868] text-white text-xs font-extrabold transition shadow-xs cursor-pointer"
                    >
                      <span>Lanjut: Upload Dokumen</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 4: UPLOAD DOKUMEN */}
              {praStep === 4 && (
                <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <h4 className="text-base font-extrabold text-[#0D3868]">
                      4. Upload Dokumen Persyaratan
                    </h4>
                    <span className="text-[11px] font-semibold text-slate-500">
                      Format: JPG, PNG, PDF (Maks. 5 MB)
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
                    <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                    <p className="leading-relaxed">
                      <strong>Catatan Petugas:</strong> Dokumen yang Anda unggah secara online ini digunakan untuk verifikasi kelengkapan berkas awal. Pastikan foto atau scan terlihat terang, tajam, dan tidak terpotong. <em>Bawa dokumen fisik asli saat datang ke loket kelurahan.</em>
                    </p>
                  </div>

                  <div className="space-y-4">
                    {selectedService.requiredDocs.map((doc, idx) => {
                      const uploaded = uploadedFiles[doc.persyaratanId];
                      const isLoading = uploadLoading === doc.persyaratanId;

                      return (
                        <div
                          key={doc.persyaratanId}
                          className={`p-4 rounded-xl border transition-all ${
                            uploaded
                              ? 'border-emerald-300 bg-emerald-50/40'
                              : 'border-slate-200 bg-white hover:border-sky-300'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-[10px] font-bold font-mono-num">
                                  {idx + 1}
                                </span>
                                <span className="font-extrabold text-slate-900 text-xs sm:text-sm">
                                  {doc.persyaratanName}
                                </span>
                                <span
                                  className={`px-2 py-0.2 rounded-md text-[10px] font-black uppercase ${
                                    doc.requirementType === 'Wajib'
                                      ? 'bg-rose-100 text-rose-800'
                                      : 'bg-slate-100 text-slate-600'
                                  }`}
                                >
                                  {doc.requirementType}
                                </span>
                              </div>

                              {uploaded ? (
                                <div className="text-xs text-emerald-800 font-semibold flex items-center gap-2">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>{uploaded.fileName} ({uploaded.fileSizeKb} KB)</span>
                                  <span className="text-slate-400">· Siap diperiksa</span>
                                </div>
                              ) : (
                                <p className="text-[11px] text-slate-500">
                                  Belum diunggah. Silakan pilih foto atau berkas scan.
                                </p>
                              )}
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {uploaded && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const next = { ...uploadedFiles };
                                    delete next[doc.persyaratanId];
                                    setUploadedFiles(next);
                                  }}
                                  className="px-2.5 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 text-xs font-bold transition cursor-pointer"
                                >
                                  Hapus
                                </button>
                              )}

                              <label
                                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer shadow-xs ${
                                  uploaded
                                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                    : 'bg-[#0277BD] hover:bg-[#0D3868] text-white'
                                }`}
                              >
                                {isLoading ? (
                                  <span>Memproses...</span>
                                ) : (
                                  <>
                                    <Upload className="w-3.5 h-3.5" />
                                    <span>{uploaded ? 'Ganti File' : 'Unggah Berkas'}</span>
                                  </>
                                )}
                                <input
                                  type="file"
                                  accept="image/jpeg,image/png,application/pdf"
                                  className="hidden"
                                  disabled={isLoading}
                                  onChange={(e) => {
                                    const f = e.target.files?.[0];
                                    if (f) handleFileUpload(doc.persyaratanId, doc.persyaratanName, f);
                                  }}
                                />
                              </label>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setPraStep(3)}
                      className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
                    >
                      Kembali
                    </button>
                    <button
                      type="button"
                      onClick={() => setPraStep(5)}
                      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#0277BD] hover:bg-[#0D3868] text-white text-xs font-extrabold transition shadow-xs cursor-pointer"
                    >
                      <span>Lanjut: Periksa Kelengkapan</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 5: PEMERIKSAAN KELENGKAPAN */}
              {praStep === 5 && (
                <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
                  <h4 className="text-base font-extrabold text-[#0D3868]">
                    5. Pemeriksaan Kelengkapan Berkas
                  </h4>

                  <div className="rounded-2xl bg-slate-50 border border-slate-200 p-5 space-y-4">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Ringkasan Pengajuan:
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-slate-500">Layanan:</span>
                        <p className="font-extrabold text-slate-900">{selectedService.name} ({selectedService.code})</p>
                      </div>
                      <div>
                        <span className="text-slate-500">Pemohon:</span>
                        <p className="font-extrabold text-slate-900">{applicantName}</p>
                      </div>
                      <div>
                        <span className="text-slate-500">NIK:</span>
                        <p className="font-mono-num font-bold text-slate-800">{applicantNik}</p>
                      </div>
                      <div>
                        <span className="text-slate-500">Nomor WhatsApp:</span>
                        <p className="font-mono-num font-bold text-slate-800">{applicantPhone}</p>
                      </div>
                      <div className="sm:col-span-2">
                        <span className="text-slate-500">Domisili:</span>
                        <p className="text-slate-800 font-semibold">{applicantAddress} ({applicantRw} / {applicantRt})</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="text-xs font-bold text-slate-700">Status Kelengkapan Dokumen:</div>
                    {selectedService.requiredDocs.map((doc) => {
                      const isUp = Boolean(uploadedFiles[doc.persyaratanId]);
                      return (
                        <div
                          key={doc.persyaratanId}
                          className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white text-xs"
                        >
                          <span className="font-semibold text-slate-800">{doc.persyaratanName}</span>
                          {isUp ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700 font-extrabold">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              <span>Lengkap</span>
                            </span>
                          ) : doc.requirementType === 'Wajib' ? (
                            <span className="text-rose-600 font-bold">Wajib diunggah</span>
                          ) : (
                            <span className="text-slate-400 italic">Opsional (Belum diunggah)</span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setPraStep(4)}
                      className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
                    >
                      Kembali
                    </button>
                    <button
                      type="button"
                      onClick={() => setPraStep(6)}
                      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#0277BD] hover:bg-[#0D3868] text-white text-xs font-extrabold transition shadow-xs cursor-pointer"
                    >
                      <span>Lanjut: Konfirmasi</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 6: KONFIRMASI */}
              {praStep === 6 && (
                <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
                  <h4 className="text-base font-extrabold text-[#0D3868]">
                    6. Konfirmasi & Pernyataan Pemohon
                  </h4>

                  <div className="rounded-2xl bg-amber-50 border border-amber-200 p-5 text-xs text-amber-950 space-y-3">
                    <div className="font-extrabold text-amber-900 flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-amber-700" />
                      <span>Surat Pernyataan Tanggung Jawab Mutlak:</span>
                    </div>
                    <p className="leading-relaxed text-slate-700">
                      Dengan mengirimkan pra-registrasi ini, saya menyatakan dengan sesungguhnya bahwa seluruh data dan dokumen yang saya unggah adalah benar dan sah. Saya bersedia memperlihatkan dokumen fisik asli kepada petugas loket Kelurahan Panaikang. Apabila di kemudian hari ditemukan keterangan yang tidak benar, saya bersedia menerima konsekuensi hukum sesuai ketentuan peraturan perundang-undangan yang berlaku.
                    </p>

                    <label className="flex items-start gap-3 pt-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={confirmedDeclaration}
                        onChange={(e) => setConfirmedDeclaration(e.target.checked)}
                        className="w-4 h-4 mt-0.5 rounded text-[#0277BD] focus:ring-[#0277BD]"
                      />
                      <span className="font-bold text-slate-900 text-xs">
                        Saya menyetujui pernyataan di atas dan mengonfirmasi bahwa data yang saya kirimkan telah benar.
                      </span>
                    </label>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setPraStep(5)}
                      className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
                    >
                      Kembali
                    </button>
                    <button
                      type="button"
                      onClick={handleSubmitPraRegistrasi}
                      disabled={isSubmittingPra || !confirmedDeclaration}
                      className="inline-flex items-center gap-2 px-7 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-black transition shadow-md cursor-pointer"
                    >
                      {isSubmittingPra ? (
                        <span>Menerbitkan Tiket...</span>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Kirim Pra Registrasi & Terbitkan Tiket</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 7: TIKET + QR (SUKSES) */}
              {praStep === 7 && (
                <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center space-y-6 shadow-md max-w-xl mx-auto">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto text-2xl">
                    ✓
                  </div>

                  <div>
                    <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-black border border-emerald-200 uppercase">
                      Pra Registrasi Berhasil
                    </span>
                    <h3 className="text-2xl font-black text-[#0D3868] mt-2">
                      Nomor Tiket Antrean Resmi Diterbitkan
                    </h3>
                    <p className="text-xs text-slate-600 mt-1">
                      Simpan tiket ini untuk ditunjukkan kepada petugas loket Kelurahan Panaikang.
                    </p>
                  </div>

                  <div className="p-5 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-300 space-y-2">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Nomor Tiket Registrasi
                    </div>
                    <div className="text-3xl font-black font-mono-num text-[#0D3868] select-all">
                      {createdPraTicket}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setQrModalData({
                          ticketCode: createdPraTicket,
                          title: `Tiket Pra Registrasi: ${selectedService.name}`,
                          applicantName,
                          categoryOrService: selectedService.name,
                          submittedAt: getRealtimeDateTimeString(),
                          statusBadge: 'MENUNGGU KEDATANGAN',
                        });
                        setQrModalOpen(true);
                      }}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0D3868] hover:bg-[#072647] text-white text-xs font-extrabold transition shadow-xs cursor-pointer"
                    >
                      <QrCode className="w-4 h-4" />
                      <span>Buka QR Code & Cetak Tiket</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setPraSubmenu('saya');
                        setSelectedService(null);
                      }}
                      className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition cursor-pointer"
                    >
                      Lihat Registrasi Saya
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Submenu: REGISTRASI SAYA (Tracking Status Flow) */}
          {praSubmenu === 'saya' && (
            <div className="space-y-5">
              {/* Filter Tabs */}
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { id: 'ALL', label: 'Semua Status' },
                  { id: 'MENUNGGU_KEDATANGAN', label: 'Menunggu Kedatangan' },
                  { id: 'SEDANG_DIPROSES', label: 'Sedang Diproses' },
                  { id: 'SELESAI', label: 'Selesai' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setPraStatusFilter(tab.id)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      praStatusFilter === tab.id
                        ? 'bg-[#0D3868] text-white shadow-xs'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {filteredMyPra.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-sky-50 text-[#0277BD] flex items-center justify-center mx-auto">
                    <FileText className="w-6 h-6" strokeWidth={1.75} />
                  </div>
                  <h4 className="text-base font-bold text-slate-800">
                    Belum Ada Registrasi
                  </h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Anda belum memiliki riwayat pra-registrasi. Klik tombol di bawah untuk mengajukan berkas layanan.
                  </p>
                  <button
                    type="button"
                    onClick={() => setPraSubmenu('daftar')}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#0277BD] hover:bg-[#0D3868] text-white text-xs font-bold transition shadow-xs cursor-pointer"
                  >
                    <span>Pilih Layanan Administrasi</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredMyPra.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-2.5">
                          <span className="font-mono-num font-black text-sm text-[#0D3868]">
                            #{item.ticketCode}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-md bg-sky-50 text-[#0277BD] text-[10px] font-bold border border-sky-100">
                            {item.serviceName}
                          </span>
                        </div>

                        <span
                          className={`px-3 py-1 rounded-full text-[11px] font-extrabold uppercase self-start sm:self-auto ${
                            item.status === 'SURAT_SELESAI' || item.status === 'DISETUJUI'
                              ? 'bg-emerald-100 text-emerald-800'
                              : item.status === 'PERLU_PERBAIKAN'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-sky-100 text-[#0D3868]'
                          }`}
                        >
                          ● {item.status.replace(/_/g, ' ')}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                        <div>
                          <span className="text-slate-500">Nama Pemohon:</span>
                          <p className="font-bold text-slate-900">{item.applicantName}</p>
                        </div>
                        <div>
                          <span className="text-slate-500">NIK:</span>
                          <p className="font-mono-num text-slate-800">{item.applicantNik}</p>
                        </div>
                        <div>
                          <span className="text-slate-500">Waktu Pengajuan:</span>
                          <p className="font-mono-num text-slate-700">{item.submittedAt}</p>
                        </div>
                      </div>

                      {item.officerNotes && (
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                          <span className="font-bold text-slate-700">Catatan Petugas Verifikasi:</span>
                          <p className="text-slate-600 mt-0.5">{item.officerNotes}</p>
                        </div>
                      )}

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                        <span className="text-[11px] text-slate-500">
                          {item.uploadedDocs?.length || 0} Dokumen Terlampir
                        </span>

                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              downloadOfficialLetterOrReceiptPdf({
                                ticketCode: item.ticketCode,
                                isSurat: true,
                                documentTitle:
                                  item.status === 'SURAT_SELESAI' || item.status === 'DISETUJUI'
                                    ? `SURAT KETERANGAN RESMI (${item.serviceName})`
                                    : `TANDA TERIMA PRA-REGISTRASI (${item.serviceName})`,
                                registerNumber: item.letterRegisterNumber || item.ticketCode,
                                applicantName: item.applicantName,
                                applicantNik: item.applicantNik,
                                applicantPhone: item.applicantPhone,
                                rw: item.applicantRw,
                                rt: item.applicantRt,
                                address: item.applicantAddress,
                                serviceOrCategoryName: item.serviceName,
                                descriptionOrPurpose:
                                  Object.values(item.formData || {}).join(' · ') ||
                                  `Pengajuan layanan ${item.serviceName}`,
                                statusText: item.status.replace(/_/g, ' '),
                                assignedUnit: item.assignedOfficerName || 'Loket Pelayanan Kelurahan Panaikang',
                                officerNotes: item.officerNotes,
                                submittedAt: item.submittedAt,
                              })
                            }
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 border border-sky-200 text-[#0D3868] text-xs font-extrabold transition cursor-pointer"
                          >
                            <Printer className="w-3.5 h-3.5 text-[#0277BD]" />
                            <span>Cetak Surat / Tanda Terima</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setQrModalData({
                                ticketCode: item.ticketCode,
                                title: `Tiket Pra Registrasi: ${item.serviceName}`,
                                applicantName: item.applicantName,
                                categoryOrService: item.serviceName,
                                submittedAt: item.submittedAt,
                                statusBadge: item.status,
                              });
                              setQrModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition cursor-pointer"
                          >
                            <QrCode className="w-3.5 h-3.5 text-[#0277BD]" />
                            <span>QR Code & Tiket</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          MODULE B: PENGADUAN ONLINE
      ========================================================================= */}
      {activeModule === 'pengaduan' && (
        <div className="space-y-6">
          {/* Sub-Header & Navigation */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setActiveModule('hub')}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 transition cursor-pointer"
                title="Kembali ke Menu Utama Pelayanan"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h3 className="text-lg font-black text-[#0D3868] flex items-center gap-2">
                  <Megaphone className="w-5 h-5 text-emerald-600" strokeWidth={1.75} />
                  <span>Pengaduan Online Warga</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Sampaikan pengaduan, keluhan, aspirasi, atau laporan kepada Kelurahan Panaikang.
                </p>
              </div>
            </div>

            {/* Submenu Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl self-start sm:self-auto">
              <button
                type="button"
                onClick={() => {
                  if (
                    !checkAuthOrPrompt(
                      'Buat Pengaduan Online',
                      'Layanan menyampaikan pengaduan online memerlukan akun warga terdaftar. Silakan masuk atau mendaftar akun warga terlebih dahulu.'
                    )
                  ) {
                    return;
                  }
                  setPengaduanSubmenu('buat');
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  pengaduanSubmenu === 'buat'
                    ? 'bg-white text-[#0D3868] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>Buat Pengaduan</span>
                {!userProfile && <Lock className="w-3.5 h-3.5 shrink-0 opacity-75" strokeWidth={1.75} />}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (
                    !checkAuthOrPrompt(
                      'Daftar Pengaduan Saya',
                      'Untuk melihat status dan riwayat pengaduan Anda, silakan masuk atau mendaftar akun warga terlebih dahulu.'
                    )
                  ) {
                    return;
                  }
                  setPengaduanSubmenu('saya');
                  setPengaduanStatusFilter('ALL');
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  pengaduanSubmenu === 'saya' && pengaduanStatusFilter === 'ALL'
                    ? 'bg-white text-[#0D3868] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>Pengaduan Saya ({myPengaduanList.length})</span>
                {!userProfile && <Lock className="w-3.5 h-3.5 shrink-0 opacity-75" strokeWidth={1.75} />}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (
                    !checkAuthOrPrompt(
                      'Pengaduan Diproses',
                      'Untuk melihat status pengaduan yang sedang diproses, silakan masuk atau mendaftar akun warga terlebih dahulu.'
                    )
                  ) {
                    return;
                  }
                  setPengaduanSubmenu('saya');
                  setPengaduanStatusFilter('SEDANG_DIPROSES');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  pengaduanSubmenu === 'saya' && pengaduanStatusFilter === 'SEDANG_DIPROSES'
                    ? 'bg-white text-[#0D3868] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Pengaduan Diproses
              </button>
              <button
                type="button"
                onClick={() => {
                  if (
                    !checkAuthOrPrompt(
                      'Pengaduan Selesai',
                      'Untuk melihat daftar pengaduan yang telah selesai ditindaklanjuti, silakan masuk atau mendaftar akun warga terlebih dahulu.'
                    )
                  ) {
                    return;
                  }
                  setPengaduanSubmenu('saya');
                  setPengaduanStatusFilter('SELESAI');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  pengaduanSubmenu === 'saya' && pengaduanStatusFilter === 'SELESAI'
                    ? 'bg-white text-[#0D3868] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Pengaduan Selesai
              </button>
            </div>
          </div>

          {/* Form Buat Pengaduan */}
          {pengaduanSubmenu === 'buat' && (
            <form onSubmit={handleSubmitPengaduan} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
              {formError && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-800 flex items-center justify-between">
                  <span>{formError}</span>
                  <button type="button" onClick={() => setFormError('')} className="cursor-pointer">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {/* Kategori Pengaduan */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Kategori Pengaduan <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={aduanCategory}
                    onChange={(e) => setAduanCategory(e.target.value as PengaduanKategori)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs bg-white font-semibold text-slate-800 focus:outline-none focus:border-emerald-600"
                  >
                    {kategoriPengaduanList.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Tanggal Kejadian */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Tanggal Kejadian <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={aduanDate}
                    onChange={(e) => setAduanDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-emerald-600"
                  />
                </div>

                {/* Judul Pengaduan */}
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">
                    Judul Pengaduan <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={aduanTitle}
                    onChange={(e) => setAduanTitle(e.target.value)}
                    placeholder="Contoh: Drainase tersumbat di Jl. Racing Centre RW 02..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-emerald-600"
                  />
                </div>

                {/* Isi Pengaduan */}
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">
                    Isi Pengaduan & Uraian Masalah <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={4}
                    value={aduanContent}
                    onChange={(e) => setAduanContent(e.target.value)}
                    placeholder="Jelaskan secara rinci permasalahan yang terjadi, dampak lingkungan, dan harapan tindak lanjut..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-emerald-600"
                  />
                </div>

                {/* Lokasi Kejadian */}
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">
                    Lokasi Kejadian (Patokan Jalan / Alamat) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={aduanLocation}
                    onChange={(e) => setAduanLocation(e.target.value)}
                    placeholder="Contoh: Depan Pos Kamling RT 03 / RW 04, Jl. Urip Sumoharjo..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-emerald-600"
                  />
                </div>

                {/* Identitas Pelapor & Mode Anonim */}
                <div className="sm:col-span-2 p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-[#0D3868]">Pilihan Identitas Pelapor:</span>
                    <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                      <input
                        type="checkbox"
                        checked={aduanIsAnonymous}
                        onChange={(e) => setAduanIsAnonymous(e.target.checked)}
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>Kirim Sebagai Anonim (Rahasia)</span>
                    </label>
                  </div>

                  {!aduanIsAnonymous && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      <div>
                        <label className="block font-semibold text-slate-600 mb-1">Nama Lengkap</label>
                        <input
                          type="text"
                          value={aduanReporterName}
                          onChange={(e) => setAduanReporterName(e.target.value)}
                          placeholder="Nama pelapor..."
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:border-emerald-600"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-600 mb-1">Nomor WhatsApp Aktif</label>
                        <input
                          type="text"
                          value={aduanReporterPhone}
                          onChange={(e) => setAduanReporterPhone(e.target.value)}
                          placeholder="08xxxxxxxxxx"
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white font-mono-num focus:outline-none focus:border-emerald-600"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Upload Foto / Bukti */}
                <div className="sm:col-span-2 space-y-2">
                  <label className="block font-bold text-slate-700">
                    Foto / Video / Bukti Kejadian (Maksimal 4 Foto)
                  </label>

                  <div className="flex flex-wrap items-center gap-3">
                    {aduanPhotos.map((url, i) => (
                      <div key={i} className="relative w-24 h-24 rounded-xl overflow-hidden border border-slate-200 group">
                        <img src={url} alt="Bukti" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setAduanPhotos(aduanPhotos.filter((_, idx) => idx !== i))}
                          className="absolute top-1 right-1 w-6 h-6 rounded-full bg-slate-900/70 text-white flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                    ))}

                    {aduanPhotos.length < 4 && (
                      <label className="w-24 h-24 rounded-xl border-2 border-dashed border-slate-300 hover:border-emerald-600 flex flex-col items-center justify-center text-slate-400 hover:text-emerald-700 transition cursor-pointer bg-slate-50">
                        <Upload className="w-5 h-5 mb-1" />
                        <span className="text-[10px] font-bold">Tambah Foto</span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleAduanPhotoUpload}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>
              </div>

              {/* Action */}
              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmittingAduan}
                  className="inline-flex items-center gap-2 px-7 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-black transition shadow-md cursor-pointer"
                >
                  {isSubmittingAduan ? (
                    <span>Mengirimkan Pengaduan...</span>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Kirim Pengaduan & Dapatkan Tiket Pelacakan</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Pengaduan Sukses */}
          {pengaduanSubmenu === 'sukses' && (
            <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center space-y-6 shadow-md max-w-xl mx-auto">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto text-2xl">
                ✓
              </div>

              <div>
                <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-black border border-emerald-200 uppercase">
                  Pengaduan Diterima
                </span>
                <h3 className="text-2xl font-black text-[#0D3868] mt-2">
                  Nomor Tiket Pengaduan Resmi Diterbitkan
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  Pengaduan Anda telah tercatat pada sistem operasional Kelurahan Panaikang.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-300 space-y-2">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Nomor Tiket Pengaduan
                </div>
                <div className="text-3xl font-black font-mono-num text-[#0D3868] select-all">
                  {createdAduanTicket}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setQrModalData({
                      ticketCode: createdAduanTicket,
                      title: 'Tiket Pengaduan Online Warga',
                      categoryOrService: aduanCategory,
                      submittedAt: getRealtimeDateTimeString(),
                      statusBadge: 'DIAJUKAN',
                    });
                    setQrModalOpen(true);
                  }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0D3868] hover:bg-[#072647] text-white text-xs font-extrabold transition shadow-xs cursor-pointer"
                >
                  <QrCode className="w-4 h-4" />
                  <span>Buka QR Code & Cetak Tiket</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPengaduanSubmenu('saya')}
                  className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition cursor-pointer"
                >
                  Lihat Riwayat Pengaduan Saya
                </button>
              </div>
            </div>
          )}

          {/* Submenu: PENGADUAN SAYA */}
          {pengaduanSubmenu === 'saya' && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { id: 'ALL', label: 'Semua Pengaduan' },
                  { id: 'SEDANG_DIPROSES', label: 'Sedang Ditindaklanjuti' },
                  { id: 'SELESAI', label: 'Selesai Ditangani' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setPengaduanStatusFilter(tab.id)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      pengaduanStatusFilter === tab.id
                        ? 'bg-[#0D3868] text-white shadow-xs'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {filteredMyPengaduan.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto">
                    <Megaphone className="w-6 h-6" strokeWidth={1.75} />
                  </div>
                  <h4 className="text-base font-bold text-slate-800">
                    Belum Ada Pengaduan
                  </h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Anda belum memiliki riwayat pengaduan. Sampaikan aspirasi atau kendala lingkungan Anda sekarang.
                  </p>
                  <button
                    type="button"
                    onClick={() => setPengaduanSubmenu('buat')}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition shadow-xs cursor-pointer"
                  >
                    <span>Buat Pengaduan Baru</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredMyPengaduan.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-2.5">
                          <span className="font-mono-num font-black text-sm text-[#0D3868]">
                            #{item.ticketCode}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-100">
                            {item.category}
                          </span>
                        </div>

                        <span
                          className={`px-3 py-1 rounded-full text-[11px] font-extrabold uppercase self-start sm:self-auto ${
                            item.status === 'SELESAI'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-sky-100 text-[#0D3868]'
                          }`}
                        >
                          ● {item.status}
                        </span>
                      </div>

                      <h4 className="font-bold text-slate-900 text-sm">{item.title}</h4>
                      <p className="text-xs text-slate-600 leading-relaxed">{item.content}</p>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 pt-1">
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>{item.locationAddress}</span>
                        </span>
                        <span className="inline-flex items-center gap-1 font-mono-num">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{item.incidentDate}</span>
                        </span>
                      </div>

                      {item.followUpNotes && (
                        <div className="p-3 rounded-xl bg-sky-50 border border-sky-100 text-xs">
                          <span className="font-bold text-[#0D3868]">Tindak Lanjut Petugas:</span>
                          <p className="text-slate-700 mt-0.5">{item.followUpNotes}</p>
                        </div>
                      )}

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                        <span className="text-[11px] text-slate-400 font-mono-num">
                          Diajukan: {item.submittedAt}
                        </span>

                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              downloadOfficialLetterOrReceiptPdf({
                                ticketCode: item.ticketCode,
                                isSurat: false,
                                documentTitle: 'TANDA TERIMA RESMI PENGADUAN WARGA',
                                registerNumber: item.ticketCode,
                                applicantName: item.isAnonymous ? 'Warga Anonim' : item.reporterName,
                                applicantPhone: item.reporterPhone,
                                rw: item.reporterRw,
                                rt: item.reporterRt,
                                address: item.locationAddress,
                                serviceOrCategoryName: `${item.category} — ${item.title}`,
                                descriptionOrPurpose: item.content,
                                statusText: item.status,
                                assignedUnit: item.assignedUnit || 'Tim Tindak Lanjut Kelurahan Panaikang',
                                officerNotes: item.followUpNotes,
                                submittedAt: item.submittedAt,
                              })
                            }
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-900 text-xs font-extrabold transition cursor-pointer"
                          >
                            <Printer className="w-3.5 h-3.5 text-emerald-700" />
                            <span>Cetak Tanda Terima</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setQrModalData({
                                ticketCode: item.ticketCode,
                                title: `Tiket Pengaduan: ${item.title}`,
                                categoryOrService: item.category,
                                submittedAt: item.submittedAt,
                                statusBadge: item.status,
                              });
                              setQrModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition cursor-pointer"
                          >
                            <QrCode className="w-3.5 h-3.5 text-emerald-700" />
                            <span>QR Tiket</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* QR Modal Component */}
      <QRCodeModal
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        ticketCode={qrModalData.ticketCode}
        title={qrModalData.title}
        applicantName={qrModalData.applicantName}
        categoryOrService={qrModalData.categoryOrService}
        submittedAt={qrModalData.submittedAt}
        statusBadge={qrModalData.statusBadge}
      />

      {/* Restricted Access Modal */}
      {restrictedModal && (
        <RestrictedAccessModal
          isOpen={restrictedModal.isOpen}
          onClose={() => setRestrictedModal(null)}
          title={restrictedModal.title}
          description={restrictedModal.description}
          isLoggedIn={!!userProfile}
          onNavigateToLogin={() => {
            setRestrictedModal(null);
            if (onNavigate) onNavigate('login');
          }}
        />
      )}
    </div>
  );
};
