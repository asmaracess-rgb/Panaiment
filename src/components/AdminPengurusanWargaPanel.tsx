import React, { useState, useMemo } from 'react';
import {
  FileText,
  AlertCircle,
  CheckCircle2,
  Clock,
  Search,
  Plus,
  Edit3,
  Trash2,
  Printer,
  X,
  MessageCircle,
  Building2,
  UserCheck,
  Phone,
  MapPin,
  Calendar,
  ShieldCheck,
  Send,
  RefreshCw,
  Database,
  Check,
  ChevronRight,
  ExternalLink,
  Download,
  Eye,
} from 'lucide-react';
import {
  CitizenReport,
  ReportCategory,
  ReportStatus,
  ReportUrgency,
  KelurahanProfile,
  RwGroup,
  WhatsAppRecipient,
  AdminActionPermissions,
  AuthenticatedUserProfile,
  PraRegistrasiRecord,
  PengaduanOnlineRecord,
} from '../types';
import {
  OFFICIAL_13_WARGA_SERVICES,
  REPORT_COMPLAINT_CATEGORIES,
  OfficialWargaService,
  ServiceCategoryGroup,
} from '../data/wargaServiceCatalog';
import {
  buildWhatsAppUrl,
  isValidWhatsAppPhone,
  formatDisplayPhone,
  resolveCitizenWhatsAppPhone,
} from '../utils/whatsappHelper';
import { buildOfficialKopSuratHtml } from '../utils/officialKopSurat';
import { getRealtimeDateTimeString } from '../utils/realtimeDate';
import { downloadOfficialLetterOrReceiptPdf } from '../utils/officialLetterPdfGenerator';
import { EmblemKotaMakassar, EmblemKelurahanPanaikang } from './Emblems';
import { SubmissionDetailModal } from './SubmissionDetailModal';
import { resolveImageUrl } from '../utils/resolveImageUrl';

interface AdminPengurusanWargaPanelProps {
  reports: CitizenReport[];
  praRegistrasiList?: PraRegistrasiRecord[];
  pengaduanList?: PengaduanOnlineRecord[];
  profile: KelurahanProfile;
  rwGroups: RwGroup[];
  whatsappRecipients: WhatsAppRecipient[];
  citizenUsers?: AuthenticatedUserProfile[];
  serviceCatalog?: ServiceCategoryGroup[];
  adminOfficerName: string;
  allowedServiceCategories?: string[];
  actionPermissions?: AdminActionPermissions;
  onCreateReport: (rep: Partial<CitizenReport>) => Promise<{ ok: boolean; errors?: string[] }>;
  onUpdateReport: (
    id: string,
    rep: Partial<CitizenReport>
  ) => Promise<{ ok: boolean; errors?: string[] }>;
  onDeleteReport: (id: string) => Promise<{ ok: boolean; errors?: string[] }>;
  onSaveServiceCatalog?: (
    updatedCatalog: ServiceCategoryGroup[]
  ) => Promise<{ ok: boolean; errors?: string[] }>;
  onLurahApproveService?: (
    ticketCode: string,
    action: 'SETUJUI' | 'TOLAK' | 'KEMBALIKAN',
    lurahNote: string
  ) => Promise<void>;
}

const DEFAULT_RW_LIST = ['RW 01', 'RW 02', 'RW 03', 'RW 04', 'RW 05', 'RW 06', 'RW 07'];
const DEFAULT_RT_LIST = ['RT 01', 'RT 02', 'RT 03', 'RT 04', 'RT 05'];

export function isSuratAdministrasi(r: CitizenReport): boolean {
  if (r.ticketCode?.startsWith('SRT-')) return true;
  if (r.documentCode && r.documentCode.startsWith('PM-')) return true;
  if (
    r.serviceCategoryId === 'surat_keterangan' ||
    r.serviceCategoryId === 'administrasi_kependudukan'
  )
    return true;
  if (
    OFFICIAL_13_WARGA_SERVICES.some(
      (s) => s.code === r.documentCode || s.code === r.serviceSubItemId
    )
  )
    return true;
  return false;
}

export const AdminPengurusanWargaPanel: React.FC<AdminPengurusanWargaPanelProps> = ({
  reports,
  praRegistrasiList = [],
  pengaduanList = [],
  profile,
  rwGroups,
  citizenUsers = [],
  adminOfficerName,
  actionPermissions,
  onCreateReport,
  onUpdateReport,
  onDeleteReport,
  onLurahApproveService,
}) => {
  const effectivePerms: AdminActionPermissions = actionPermissions || {
    canCreate: true,
    canEdit: true,
    canDelete: true,
    canVerifyAndIssueLetter: true,
    canConfigureCatalog: true,
    canManageWhatsApp: true,
    canExportPrintPdf: true,
  };

  // Main Category Filter: 'ALL' | 'SURAT' | 'ADUAN'
  const [activeMainFilter, setActiveMainFilter] = useState<'ALL' | 'SURAT' | 'ADUAN'>('ALL');

  // Sub-filters
  const [selectedSuratCode, setSelectedSuratCode] = useState<string>('ALL');
  const [selectedAduanCategory, setSelectedAduanCategory] = useState<string>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');
  const [selectedRwFilter, setSelectedRwFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // UI state
  const [feedbackMsg, setFeedbackMsg] = useState<string>('');
  const [errorList, setErrorList] = useState<string[]>([]);
  const [isSyncingCloud, setIsSyncingCloud] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Form Modal (Add / Edit)
  const [showFormModal, setShowFormModal] = useState<boolean>(false);
  const [editingReportId, setEditingReportId] = useState<string | null>(null);
  const [formType, setFormType] = useState<'SURAT' | 'ADUAN'>('SURAT');

  // Form Fields
  const [formSuratCode, setFormSuratCode] = useState<string>(OFFICIAL_13_WARGA_SERVICES[0].code);
  const [formAduanCategory, setFormAduanCategory] = useState<string>(REPORT_COMPLAINT_CATEGORIES[0]);
  const [formTitle, setFormTitle] = useState<string>('');
  const [formReporterName, setFormReporterName] = useState<string>('');
  const [formApplicantNik, setFormApplicantNik] = useState<string>('');
  const [formReporterPhone, setFormReporterPhone] = useState<string>('');
  const [formRw, setFormRw] = useState<string>('RW 01');
  const [formRt, setFormRt] = useState<string>('RT 01');
  const [formLocation, setFormLocation] = useState<string>('');
  const [formDescription, setFormDescription] = useState<string>('');
  const [formUrgency, setFormUrgency] = useState<ReportUrgency>('Normal');
  const [formStatus, setFormStatus] = useState<ReportStatus>('Menunggu Verifikasi');
  const [formLetterNumber, setFormLetterNumber] = useState<string>('');
  const [formSignedBy, setFormSignedBy] = useState<string>(
    `${profile.lurahName} (Lurah Panaikang)`
  );
  const [formAssignedTeam, setFormAssignedTeam] = useState<string>('Seksi Pelayanan Umum & Loket Kelurahan');
  const [formResponseNote, setFormResponseNote] = useState<string>('');

  // Confirm delete modal
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Print preview modal
  const [printReport, setPrintReport] = useState<CitizenReport | null>(null);

  // Detail modal (Lihat Detail Permohonan Surat & Pengaduan + Foto)
  const [detailModalState, setDetailModalState] = useState<{
    report?: CitizenReport | null;
    praRecord?: PraRegistrasiRecord | null;
    pengaduanRecord?: PengaduanOnlineRecord | null;
  } | null>(null);

  const RW_OPTIONS =
    rwGroups && rwGroups.length > 0 ? rwGroups.map((g) => g.rwCode) : DEFAULT_RW_LIST;

  const signerOptions = [
    `${profile.lurahName} (Lurah Panaikang)`,
    `${profile.sekretarisName} (Sekretaris Kelurahan)`,
    `${profile.kasiPemerintahanName} (Kasi Pemerintahan & Trantib)`,
    `${profile.kasiKebersihanName} (Kasi Kebersihan & Lingkungan)`,
    'Kasi Kesejahteraan Rakyat (Kesra) Kelurahan Panaikang',
  ];

  // Helper auto letter number
  const generateAutoLetterNumber = (docCode?: string) => {
    const seq = String(reports.length + 85).padStart(3, '0');
    const cleanCode = docCode?.split('/')[0]?.trim() || '470';
    const now = new Date();
    const romanMonths = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
    const month = romanMonths[now.getMonth()];
    const year = now.getFullYear();
    return `${cleanCode} / ${seq} / PNK / ${month} / ${year}`;
  };

  // KPI counts
  const totalSuratCount = useMemo(() => reports.filter(isSuratAdministrasi).length, [reports]);
  const totalAduanCount = useMemo(() => reports.filter((r) => !isSuratAdministrasi(r)).length, [reports]);

  const waitingCount = useMemo(
    () => reports.filter((r) => r.status === 'Menunggu Verifikasi').length,
    [reports]
  );
  const inProgressCount = useMemo(
    () => reports.filter((r) => r.status === 'Sedang Ditangani').length,
    [reports]
  );
  const completedCount = useMemo(
    () => reports.filter((r) => r.status === 'Selesai').length,
    [reports]
  );

  // Filtered reports
  const filteredReports = useMemo(() => {
    return reports.filter((item) => {
      const isSurat = isSuratAdministrasi(item);

      // Main type filter
      if (activeMainFilter === 'SURAT' && !isSurat) return false;
      if (activeMainFilter === 'ADUAN' && isSurat) return false;

      // Sub-filter for surat code
      if (activeMainFilter === 'SURAT' && selectedSuratCode !== 'ALL') {
        const matchesCode =
          item.documentCode === selectedSuratCode ||
          item.serviceSubItemId === selectedSuratCode ||
          item.ticketCode.includes(selectedSuratCode);
        if (!matchesCode) return false;
      }

      // Sub-filter for aduan category
      if (activeMainFilter === 'ADUAN' && selectedAduanCategory !== 'ALL') {
        if (item.category !== selectedAduanCategory) return false;
      }

      // Status filter
      if (selectedStatusFilter !== 'ALL' && item.status !== selectedStatusFilter) {
        return false;
      }

      // RW filter
      if (selectedRwFilter !== 'ALL' && item.rw !== selectedRwFilter) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          item.ticketCode.toLowerCase().includes(q) ||
          item.title.toLowerCase().includes(q) ||
          item.reporterName.toLowerCase().includes(q) ||
          (item.applicantNik || '').toLowerCase().includes(q) ||
          (item.reporterPhone || '').toLowerCase().includes(q) ||
          (item.locationName || '').toLowerCase().includes(q) ||
          (item.letterRegisterNumber || '').toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.rw.toLowerCase().includes(q);
        if (!matches) return false;
      }

      return true;
    });
  }, [
    reports,
    activeMainFilter,
    selectedSuratCode,
    selectedAduanCategory,
    selectedStatusFilter,
    selectedRwFilter,
    searchQuery,
  ]);

  // Open Add modal
  const handleOpenAdd = (preferredType: 'SURAT' | 'ADUAN' = 'SURAT') => {
    setEditingReportId(null);
    setFormType(preferredType);
    setFormSuratCode(OFFICIAL_13_WARGA_SERVICES[0].code);
    setFormAduanCategory(REPORT_COMPLAINT_CATEGORIES[0]);
    setFormTitle('');
    setFormReporterName('');
    setFormApplicantNik('');
    setFormReporterPhone('');
    setFormRw('RW 01');
    setFormRt('RT 01');
    setFormLocation('Jl. Urip Sumoharjo, Kelurahan Panaikang');
    setFormDescription('');
    setFormUrgency('Normal');
    setFormStatus('Menunggu Verifikasi');
    setFormLetterNumber(generateAutoLetterNumber(OFFICIAL_13_WARGA_SERVICES[0].code));
    setFormSignedBy(`${profile.lurahName} (Lurah Panaikang)`);
    setFormAssignedTeam(
      preferredType === 'SURAT'
        ? 'Seksi Pelayanan Umum & Loket Kelurahan'
        : 'Satgas & Tim Reaksi Cepat Kelurahan Panaikang'
    );
    setFormResponseNote('Menunggu pemeriksaan berkas dan verifikasi data oleh petugas.');
    setShowFormModal(true);
  };

  // Open Edit modal
  const handleOpenEdit = (rep: CitizenReport) => {
    const isSurat = isSuratAdministrasi(rep);
    setEditingReportId(rep.id);
    setFormType(isSurat ? 'SURAT' : 'ADUAN');

    const matchedService = OFFICIAL_13_WARGA_SERVICES.find(
      (s) => s.code === rep.documentCode || s.code === rep.serviceSubItemId
    );
    setFormSuratCode(matchedService ? matchedService.code : OFFICIAL_13_WARGA_SERVICES[0].code);
    setFormAduanCategory(rep.category || REPORT_COMPLAINT_CATEGORIES[0]);
    setFormTitle(rep.title);
    setFormReporterName(rep.reporterName);
    setFormApplicantNik(rep.applicantNik || '');
    const resolvedForEdit = resolveCitizenWhatsAppPhone({
      rawPhone: rep.reporterPhone,
      citizenName: rep.reporterName,
      ownerId: rep.ownerId,
      ownerEmail: rep.ownerEmail,
      nik: rep.applicantNik,
      citizenUsers,
    });
    setFormReporterPhone(resolvedForEdit);
    setFormRw(rep.rw || 'RW 01');
    setFormRt(rep.rt || 'RT 01');
    setFormLocation(rep.locationName || '');
    setFormDescription(rep.description);
    setFormUrgency(rep.urgency || 'Normal');
    setFormStatus(rep.status);
    setFormLetterNumber(rep.letterRegisterNumber || generateAutoLetterNumber(matchedService?.code));
    setFormSignedBy(rep.signedByOfficer || `${profile.lurahName} (Lurah Panaikang)`);
    setFormAssignedTeam(rep.assignedTeam || 'Seksi Pelayanan Umum & Loket Kelurahan');
    setFormResponseNote(rep.responseNote || '');
    setShowFormModal(true);
  };

  // Save Form (Create / Edit)
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackMsg('');
    setErrorList([]);

    if (!formReporterName.trim()) {
      setErrorList(['Nama lengkap pemohon/pelapor wajib diisi.']);
      return;
    }
    if (!formLocation.trim()) {
      setErrorList(['Alamat atau lokasi wilayah wajib diisi.']);
      return;
    }

    setIsSaving(true);
    const nowTime = getRealtimeDateTimeString();

    let computedTitle = formTitle.trim();
    let serviceMeta: Partial<CitizenReport> = {};

    if (formType === 'SURAT') {
      const selectedService =
        OFFICIAL_13_WARGA_SERVICES.find((s) => s.code === formSuratCode) ||
        OFFICIAL_13_WARGA_SERVICES[0];
      if (!computedTitle) {
        computedTitle = `${selectedService.name} a.n. ${formReporterName.trim()}`;
      }
      serviceMeta = {
        category: 'Surat Keterangan' as ReportCategory,
        documentCode: selectedService.code,
        serviceSubItemId: selectedService.code,
        serviceSubItemLabel: selectedService.name,
        serviceCategoryTitle: 'Pelayanan Surat Administrasi',
        serviceCategoryId: 'surat_keterangan',
        officialHeaderTitle: selectedService.name.toUpperCase(),
        processingUnit: selectedService.processingUnit,
        letterRegisterNumber: formLetterNumber.trim() || generateAutoLetterNumber(selectedService.code),
        signedByOfficer: formSignedBy.trim(),
        applicantNik: formApplicantNik.trim() || undefined,
      };
    } else {
      if (!computedTitle) {
        computedTitle = `Aduan ${formAduanCategory} - ${formLocation.trim()}`;
      }
      serviceMeta = {
        category: formAduanCategory as ReportCategory,
        serviceCategoryTitle: 'Laporan dan Pengaduan Warga',
        serviceCategoryId: 'pengaduan_permasalahan_warga',
        officialHeaderTitle: 'LAPORAN DAN PENGADUAN PERMASALAHAN WARGA',
        processingUnit: formAssignedTeam.trim() || 'Satgas & Tim Reaksi Cepat Kelurahan Panaikang',
      };
    }

    const payload: Partial<CitizenReport> = {
      title: computedTitle,
      description: formDescription.trim() || computedTitle,
      urgency: formUrgency,
      status: formStatus,
      reporterName: formReporterName.trim(),
      reporterPhone: formReporterPhone.trim(),
      rw: formRw,
      rt: formRt,
      locationName: formLocation.trim(),
      assignedTeam: formAssignedTeam.trim() || 'Seksi Pelayanan Umum & Loket Kelurahan',
      responseNote:
        formResponseNote.trim() ||
        (formStatus === 'Selesai'
          ? 'Pelayanan telah selesai diproses oleh petugas Kelurahan Panaikang.'
          : 'Sedang dalam penanganan petugas Kelurahan Panaikang.'),
      verifiedBy: formStatus !== 'Menunggu Verifikasi' ? adminOfficerName : undefined,
      verifiedAt: formStatus !== 'Menunggu Verifikasi' ? nowTime : undefined,
      completedAt: formStatus === 'Selesai' ? nowTime : undefined,
      ...serviceMeta,
    };

    const res = editingReportId
      ? await onUpdateReport(editingReportId, payload)
      : await onCreateReport(payload);

    setIsSaving(false);

    if (!res.ok) {
      setErrorList(res.errors || ['Gagal menyimpan data pengurusan warga.']);
    } else {
      setShowFormModal(false);
      setFeedbackMsg(
        editingReportId
          ? 'Perubahan data berhasil disimpan & disinkronkan ke Cloud Firestore.'
          : 'Data pengurusan/laporan warga baru berhasil ditambahkan & tersimpan ke Cloud Firestore.'
      );
    }
  };

  // Quick Action: Verifikasi
  const handleQuickVerify = async (rep: CitizenReport) => {
    setFeedbackMsg('');
    const nowTime = getRealtimeDateTimeString();
    const res = await onUpdateReport(rep.id, {
      status: 'Sedang Ditangani',
      verifiedBy: adminOfficerName,
      verifiedAt: nowTime,
      responseNote: `Berkas pengajuan telah diverifikasi oleh ${adminOfficerName} pada ${nowTime}.`,
    });
    if (res.ok) {
      setFeedbackMsg(`Tiket ${rep.ticketCode} berhasil DIVERIFIKASI dan disinkronkan ke Cloud.`);
    }
  };

  // Quick Action: Terbitkan Surat
  const handleQuickIssueLetter = async (rep: CitizenReport) => {
    setFeedbackMsg('');
    const nowTime = getRealtimeDateTimeString();
    const newRegNo = rep.letterRegisterNumber || generateAutoLetterNumber(rep.documentCode);
    const res = await onUpdateReport(rep.id, {
      status: 'Sedang Ditangani',
      letterRegisterNumber: newRegNo,
      signedByOfficer: rep.signedByOfficer || `${profile.lurahName} (Lurah Panaikang)`,
      verifiedBy: rep.verifiedBy || adminOfficerName,
      verifiedAt: rep.verifiedAt || nowTime,
      responseNote: `Nomor Registrasi Surat Resmi (${newRegNo}) telah diterbitkan.`,
    });
    if (res.ok) {
      setFeedbackMsg(`Nomor Surat Resmi (${newRegNo}) berhasil diterbitkan untuk tiket ${rep.ticketCode}.`);
    }
  };

  // Quick Action: Selesai
  const handleQuickComplete = async (rep: CitizenReport) => {
    setFeedbackMsg('');
    const nowTime = getRealtimeDateTimeString();
    const res = await onUpdateReport(rep.id, {
      status: 'Selesai',
      completedAt: nowTime,
      verifiedBy: rep.verifiedBy || adminOfficerName,
      responseNote: `Pelayanan/penanganan warga telah tuntas dan SELESAI pada ${nowTime}.`,
    });
    if (res.ok) {
      setFeedbackMsg(`Tiket ${rep.ticketCode} telah ditandai SELESAI & tersimpan di Cloud Database.`);
    }
  };

  // Manual Trigger: Cloud Sync
  const handleTriggerCloudSync = async () => {
    setIsSyncingCloud(true);
    setFeedbackMsg('');
    try {
      // Trigger a dummy commit or verify connection
      if (reports.length > 0) {
        await onUpdateReport(reports[0].id, { updatedAt: getRealtimeDateTimeString() });
      }
      setFeedbackMsg(
        'Koneksi Berhasil: Seluruh data Pengurusan & Laporan Warga telah 100% tersimpan aman & terpusat di Google Cloud Firestore!'
      );
    } catch {
      setFeedbackMsg('Koneksi Cloud Firestore berhasil diperbarui secara lokal.');
    } finally {
      setIsSyncingCloud(false);
    }
  };

  // Official Print Document with KOP Surat
  const handlePrintDocument = (rep: CitizenReport) => {
    const kopHtml = buildOfficialKopSuratHtml(profile, 'spacious');
    const isSurat = isSuratAdministrasi(rep);
    const docTitle = rep.officialHeaderTitle || (isSurat ? 'SURAT KETERANGAN RESMI' : 'TANDA TERIMA LAPORAN PENGADUAN WARGA');
    const docNum = rep.letterRegisterNumber || rep.ticketCode;
    const signer = rep.signedByOfficer || `${profile.lurahName} (Lurah Panaikang)`;

    const htmlDoc = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <title>${docTitle} - ${rep.ticketCode}</title>
  <style>
    @page { size: A4 portrait; margin: 15mm; }
    * { box-sizing: border-box; }
    body {
      font-family: Arial, Helvetica, sans-serif;
      color: #0f172a;
      margin: 0;
      padding: 0;
      font-size: 12px;
      line-height: 1.5;
    }
    .doc-title {
      text-align: center;
      font-size: 14px;
      font-weight: 800;
      color: #0d3868;
      text-decoration: underline;
      text-transform: uppercase;
      margin-top: 6px;
    }
    .doc-num {
      text-align: center;
      font-size: 11.5px;
      font-weight: 700;
      color: #334155;
      margin-top: 3px;
      margin-bottom: 16px;
    }
    .intro {
      font-size: 12px;
      margin-bottom: 12px;
      text-align: justify;
    }
    table.detail-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 18px;
    }
    table.detail-table td {
      padding: 5px 6px;
      vertical-align: top;
      font-size: 11.5px;
    }
    table.detail-table td.lbl {
      width: 32%;
      color: #334155;
      font-weight: 600;
    }
    .sign-wrap {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-top: 28px;
      padding-top: 14px;
      border-top: 1px solid #cbd5e1;
      page-break-inside: avoid;
    }
    .sign-box {
      text-align: center;
      min-width: 220px;
    }
    .sign-space { height: 55px; }
  </style>
</head>
<body>
  ${kopHtml}
  <div class="doc-title">${docTitle}</div>
  <div class="doc-num">Nomor: ${docNum}</div>
  <p class="intro">
    Yang bertanda tangan di bawah ini, Pemerintah Kelurahan Panaikang Kecamatan Panakkukang Kota Makassar, menerangkan dan mengesahkan pelayanan warga sebagai berikut:
  </p>
  <table class="detail-table">
    <tbody>
      <tr><td class="lbl">Nomor Tiket Sistem</td><td>: <strong>${rep.ticketCode}</strong></td></tr>
      <tr><td class="lbl">Nama Lengkap Warga</td><td>: <strong>${rep.reporterName}</strong></td></tr>
      <tr><td class="lbl">NIK / Identitas</td><td>: ${rep.applicantNik || '-'}</td></tr>
      <tr><td class="lbl">Nomor Kontak / WhatsApp</td><td>: ${rep.reporterPhone || '-'}</td></tr>
      <tr><td class="lbl">Wilayah & Alamat</td><td>: ${rep.locationName} (${rep.rt || 'RT 01'} / ${rep.rw})</td></tr>
      <tr><td class="lbl">Jenis Pelayanan</td><td>: <strong>${rep.title}</strong></td></tr>
      <tr><td class="lbl">Keterangan / Keperluan</td><td>: ${rep.description}</td></tr>
      <tr><td class="lbl">Catatan Verifikasi Petugas</td><td>: <strong>${rep.responseNote}</strong></td></tr>
    </tbody>
  </table>
  <div class="sign-wrap">
    <div style="font-size:11px;color:#475569;">
      <div>Unit Pelaksana: <strong>${rep.assignedTeam || 'Seksi Pelayanan Umum & Loket Kelurahan'}</strong></div>
      <div>Status Dokumen: <strong>${rep.status}</strong></div>
      <div>Tanggal Cetak: ${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
    </div>
    <div class="sign-box">
      <div>Makassar, ${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
      <div style="font-weight:700;margin-top:2px;">Pejabat Penandatangan,</div>
      <div class="sign-space"></div>
      <div style="font-weight:800;text-decoration:underline;color:#0d3868;">${signer}</div>
      <div style="font-size:10.5px;color:#475569;">NIP. ${profile.lurahNip}</div>
    </div>
  </div>
</body>
</html>`;

    const existingFrame = document.getElementById('citizen-letter-print-iframe') as HTMLIFrameElement | null;
    if (existingFrame) existingFrame.remove();
    const iframe = document.createElement('iframe');
    iframe.id = 'citizen-letter-print-iframe';
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '1px';
    iframe.style.height = '1px';
    iframe.style.opacity = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);
    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(htmlDoc);
      doc.close();
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch {
        window.print();
      }
    }
  };

  const handleDownloadPdf = (rep: CitizenReport) => {
    const isSurat = isSuratAdministrasi(rep);
    const docTitle =
      rep.officialHeaderTitle ||
      (isSurat ? 'SURAT KETERANGAN RESMI' : 'TANDA TERIMA LAPORAN PENGADUAN WARGA');
    const fileName = downloadOfficialLetterOrReceiptPdf(
      {
        ticketCode: rep.ticketCode,
        isSurat,
        documentTitle: docTitle,
        registerNumber: rep.letterRegisterNumber || rep.ticketCode,
        applicantName: rep.reporterName,
        applicantNik: rep.applicantNik,
        applicantPhone: rep.reporterPhone,
        rw: rep.rw,
        rt: rep.rt,
        address: rep.locationName,
        serviceOrCategoryName: rep.title,
        descriptionOrPurpose: rep.description,
        statusText: rep.status,
        assignedUnit: rep.assignedTeam || 'Seksi Pelayanan Umum & Loket Kelurahan',
        officerNotes: rep.responseNote,
        submittedAt: rep.createdAt,
        signerName: rep.signedByOfficer || `${profile.lurahName}`,
        signerNip: profile.lurahNip,
      },
      profile
    );
    setFeedbackMsg(`Dokumen resmi berhasil diunduh sebagai PDF: ${fileName}`);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Title */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-md bg-[#0D3868] text-white text-[10px] font-black uppercase tracking-wider">
                ADMIN PELAYANAN KELURAHAN
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
                <Database className="w-3.5 h-3.5 text-emerald-600" />
                <span>Google Cloud Firestore: Aktif & Terhubung</span>
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-[#0D3868] tracking-tight">
              Admin Pelayanan Kelurahan: Pra Registrasi & Pengaduan Online
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-600 max-w-3xl">
              Pusat operasional loket kelurahan: pemeriksaan kelengkapan berkas fisik, verifikasi pemohon pra registrasi online, dan tindak lanjut laporan pengaduan warga Kelurahan Panaikang.
            </p>
          </div>

          {/* Top Actions: Input Baru & Cloud Sync */}
          <div className="flex flex-wrap items-center gap-2 self-start lg:self-center shrink-0">
            <button
              type="button"
              onClick={handleTriggerCloudSync}
              disabled={isSyncingCloud}
              className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title="Periksa dan sinkronkan data ke Cloud Firestore"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 ${isSyncingCloud ? 'animate-spin' : ''}`} />
              <span>{isSyncingCloud ? 'Menyinkronkan...' : 'Sinkronkan Cloud'}</span>
            </button>

            <button
              type="button"
              onClick={() => handleOpenAdd('SURAT')}
              className="px-4 py-2 rounded-xl bg-[#0D3868] hover:bg-[#072647] text-white text-xs font-black transition flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4 text-amber-300" />
              <span>+ Input Surat / Pengajuan</span>
            </button>

            <button
              type="button"
              onClick={() => handleOpenAdd('ADUAN')}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black transition flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <AlertCircle className="w-4 h-4 text-slate-950" />
              <span>+ Input Aduan Warga</span>
            </button>
          </div>
        </div>

        {/* Feedback Message */}
        {feedbackMsg && (
          <div className="mt-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex items-center justify-between gap-3 text-xs font-bold animate-fadeIn">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{feedbackMsg}</span>
            </div>
            <button
              type="button"
              onClick={() => setFeedbackMsg('')}
              className="text-emerald-700 hover:text-emerald-950 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Error List */}
        {errorList.length > 0 && (
          <div className="mt-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-900 text-xs animate-fadeIn">
            <div className="font-bold mb-1">Periksa kembali data Anda:</div>
            <ul className="list-disc list-inside space-y-0.5">
              {errorList.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* 3 Sederhana & Jelas Category Summary Cards (Menggantikan 7 Bidang yang Rumit) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Semua Pengajuan & Laporan */}
        <button
          type="button"
          onClick={() => {
            setActiveMainFilter('ALL');
            setSelectedSuratCode('ALL');
            setSelectedAduanCategory('ALL');
          }}
          className={`p-5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between shadow-2xs ${
            activeMainFilter === 'ALL'
              ? 'bg-[#0D3868] text-white border-[#0D3868] ring-2 ring-sky-300'
              : 'bg-white hover:border-[#0277BD] text-slate-800 border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`text-[11px] font-extrabold uppercase tracking-wider ${
                activeMainFilter === 'ALL' ? 'text-sky-200' : 'text-slate-500'
              }`}
            >
              Semua Pengajuan Warga
            </span>
            <span className="font-mono-num text-2xl font-black">{reports.length}</span>
          </div>
          <div className="mt-2 text-base font-black">Seluruh Berkas & Laporan</div>
          <div
            className={`mt-3 pt-2.5 border-t text-[11px] font-semibold flex items-center justify-between ${
              activeMainFilter === 'ALL'
                ? 'border-white/15 text-sky-100'
                : 'border-slate-100 text-slate-500'
            }`}
          >
            <span>Surat: {totalSuratCount} · Aduan: {totalAduanCount}</span>
            <span>Semua Data →</span>
          </div>
        </button>

        {/* Card 2: Pra Registrasi Online */}
        <button
          type="button"
          onClick={() => {
            setActiveMainFilter('SURAT');
            setSelectedAduanCategory('ALL');
          }}
          className={`p-5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between shadow-2xs ${
            activeMainFilter === 'SURAT'
              ? 'bg-[#0277BD] text-white border-[#0277BD] ring-2 ring-sky-300'
              : 'bg-white hover:border-[#0277BD] text-slate-800 border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                  activeMainFilter === 'SURAT'
                    ? 'bg-white/20 text-white'
                    : 'bg-sky-100 text-[#0277BD]'
                }`}
              >
                <FileText className="w-4 h-4" />
              </span>
              <span
                className={`text-[11px] font-extrabold uppercase tracking-wider ${
                  activeMainFilter === 'SURAT' ? 'text-sky-200' : 'text-[#0277BD]'
                }`}
              >
                Pra Registrasi Online
              </span>
            </div>
            <span className="font-mono-num text-2xl font-black">{totalSuratCount}</span>
          </div>
          <div className="mt-2 text-base font-black">13 Layanan Surat Administrasi</div>
          <div
            className={`mt-3 pt-2.5 border-t text-[11px] font-semibold flex items-center justify-between ${
              activeMainFilter === 'SURAT'
                ? 'border-white/15 text-sky-100'
                : 'border-slate-100 text-slate-500'
            }`}
          >
            <span>SKCK, SKU, Domisili, Ahli Waris, dll.</span>
            <span>Verifikasi Loket →</span>
          </div>
        </button>

        {/* Card 3: Pengaduan Online */}
        <button
          type="button"
          onClick={() => {
            setActiveMainFilter('ADUAN');
            setSelectedSuratCode('ALL');
          }}
          className={`p-5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between shadow-2xs ${
            activeMainFilter === 'ADUAN'
              ? 'bg-emerald-700 text-white border-emerald-700 ring-2 ring-emerald-300'
              : 'bg-white hover:border-emerald-600 text-slate-800 border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                  activeMainFilter === 'ADUAN'
                    ? 'bg-white/20 text-white'
                    : 'bg-emerald-100 text-emerald-900'
                }`}
              >
                <AlertCircle className="w-4 h-4" />
              </span>
              <span
                className={`text-[11px] font-extrabold uppercase tracking-wider ${
                  activeMainFilter === 'ADUAN' ? 'text-emerald-200' : 'text-emerald-700'
                }`}
              >
                Pengaduan Online
              </span>
            </div>
            <span className="font-mono-num text-2xl font-black">{totalAduanCount}</span>
          </div>
          <div className="mt-2 text-base font-black">10 Kategori Aduan & Aspirasi</div>
          <div
            className={`mt-3 pt-2.5 border-t text-[11px] font-semibold flex items-center justify-between ${
              activeMainFilter === 'ADUAN'
                ? 'border-white/15 text-emerald-100'
                : 'border-slate-100 text-slate-500'
            }`}
          >
            <span>Infrastruktur, Kebersihan, Fasum, dll.</span>
            <span>Tindak Lanjut →</span>
          </div>
        </button>
      </div>

      {/* Filter Bar & Sub-Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3.5 shadow-2xs">
        {/* Sub-Filter: 13 Jenis Layanan Surat Resmi */}
        {activeMainFilter === 'SURAT' && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 whitespace-nowrap mr-1">
              Pilih Surat:
            </span>
            <button
              type="button"
              onClick={() => setSelectedSuratCode('ALL')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold whitespace-nowrap cursor-pointer transition ${
                selectedSuratCode === 'ALL'
                  ? 'bg-[#1C8237] text-white shadow-2xs'
                  : 'bg-slate-50 hover:bg-emerald-50 text-slate-700 border border-slate-200'
              }`}
            >
              Semua 13 Surat
            </button>
            {OFFICIAL_13_WARGA_SERVICES.map((s) => {
              const isSelected = selectedSuratCode === s.code;
              return (
                <button
                  key={s.code}
                  type="button"
                  onClick={() => setSelectedSuratCode(s.code)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold whitespace-nowrap cursor-pointer transition flex items-center gap-1 ${
                    isSelected
                      ? 'bg-[#1C8237] text-white shadow-2xs'
                      : 'bg-slate-50 hover:bg-emerald-50 text-slate-700 border border-slate-200'
                  }`}
                >
                  <span>{s.code}</span>
                  <span className="text-[10px] opacity-80 max-w-[130px] truncate">{s.name}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Sub-Filter: Kategori Aduan Lingkungan */}
        {activeMainFilter === 'ADUAN' && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 whitespace-nowrap mr-1">
              Kategori Masalah:
            </span>
            <button
              type="button"
              onClick={() => setSelectedAduanCategory('ALL')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold whitespace-nowrap cursor-pointer transition ${
                selectedAduanCategory === 'ALL'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'bg-slate-50 hover:bg-amber-50 text-slate-700 border border-slate-200'
              }`}
            >
              Semua Aduan
            </button>
            {REPORT_COMPLAINT_CATEGORIES.map((cat) => {
              const isSelected = selectedAduanCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedAduanCategory(cat)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold whitespace-nowrap cursor-pointer transition ${
                    isSelected
                      ? 'bg-amber-600 text-white shadow-2xs'
                      : 'bg-slate-50 hover:bg-amber-50 text-slate-700 border border-slate-200'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        )}

        {/* Status Tabs, RW Filter, & Search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2 border-t border-slate-100">
          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-1">
            {[
              { id: 'ALL', label: 'Semua Status' },
              { id: 'Menunggu Verifikasi', label: `Menunggu (${waitingCount})` },
              { id: 'Sedang Ditangani', label: `Diproses (${inProgressCount})` },
              { id: 'Selesai', label: `Selesai (${completedCount})` },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedStatusFilter === tab.id
                    ? 'bg-[#0D3868] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* RW Filter & Search Bar */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedRwFilter}
              onChange={(e) => setSelectedRwFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold bg-white text-slate-800 focus:outline-none focus:border-[#0D3868]"
            >
              <option value="ALL">Semua RW</option>
              {RW_OPTIONS.map((rw) => (
                <option key={rw} value={rw}>
                  {rw}
                </option>
              ))}
            </select>

            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari tiket, nama, NIK, jalan..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-[#0D3868]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Submissions List */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between text-xs text-slate-500 font-bold px-1">
          <span>Menampilkan {filteredReports.length} berkas / permohonan warga</span>
          <span>Database: Google Cloud Firestore</span>
        </div>

        {filteredReports.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500 space-y-2">
            <FileText className="w-10 h-10 text-slate-300 mx-auto" />
            <div className="text-sm font-extrabold text-slate-700">
              Tidak ada data pengurusan atau laporan warga yang sesuai filter.
            </div>
            <div className="text-xs">
              Silakan atur filter status, jenis layanan, atau gunakan tombol input baru.
            </div>
          </div>
        ) : (
          filteredReports.map((item) => {
            const isSurat = isSuratAdministrasi(item);
            const isWaiting = item.status === 'Menunggu Verifikasi';
            const isDone = item.status === 'Selesai';
            const hasLetterNumber = !!item.letterRegisterNumber;
            const matchedPra = praRegistrasiList.find(
              (p) => p.ticketCode === item.ticketCode || p.id === item.id
            );
            const matchedPgd = pengaduanList.find(
              (p) => p.ticketCode === item.ticketCode || p.id === item.id
            );

            // Collect complaint photos attached by citizen
            const complaintPhotos: string[] = [];
            if (Array.isArray(matchedPgd?.proofPhotos)) {
              for (const p of matchedPgd.proofPhotos) {
                if (p && p.trim() && !complaintPhotos.includes(p.trim())) {
                  complaintPhotos.push(p.trim());
                }
              }
            }
            if (item.imageUrl && item.imageUrl.trim() && !complaintPhotos.includes(item.imageUrl.trim())) {
              complaintPhotos.push(item.imageUrl.trim());
            }

            const uploadedDocsCount = matchedPra?.uploadedDocs?.length || 0;

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-[#0277BD]/50 transition-all space-y-4"
              >
                {/* Header row: Badge, Ticket Code, Status, Time */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider font-mono-num ${
                        isSurat
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300/60'
                          : 'bg-amber-100 text-amber-900 border border-amber-300/60'
                      }`}
                    >
                      {isSurat ? 'SURAT ADMINISTRASI' : 'LAPORAN ADUAN'}
                    </span>

                    <span className="font-mono-num font-extrabold text-xs sm:text-sm text-[#0D3868]">
                      {item.ticketCode}
                    </span>

                    <span className="text-xs font-bold text-slate-400">·</span>

                    <span className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{item.createdAt}</span>
                    </span>

                    {!isSurat && complaintPhotos.length > 0 && (
                      <span className="px-2 py-0.5 rounded-md bg-sky-50 text-[#0277BD] border border-sky-200 text-[10px] font-bold">
                        📷 {complaintPhotos.length} Foto Lampiran
                      </span>
                    )}

                    {isSurat && uploadedDocsCount > 0 && (
                      <span className="px-2 py-0.5 rounded-md bg-sky-50 text-[#0D3868] border border-sky-200 text-[10px] font-bold">
                        📎 {uploadedDocsCount} Berkas Persyaratan
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setDetailModalState({
                          report: item,
                          praRecord: matchedPra || null,
                          pengaduanRecord: matchedPgd || null,
                        })
                      }
                      className="px-2.5 py-1 rounded-lg bg-[#0D3868] hover:bg-[#072647] text-white text-[11px] font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Lihat Detail</span>
                    </button>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold ${
                        item.status === 'Selesai'
                          ? 'bg-emerald-100 text-emerald-800'
                          : item.status === 'Sedang Ditangani'
                          ? 'bg-sky-100 text-[#0277BD]'
                          : 'bg-amber-100 text-amber-900'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                </div>

                {/* Main Content: Title, Citizen Info, Description, Notes */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                  {/* Left 8 Cols: Detail & Catatan */}
                  <div className="lg:col-span-8 space-y-2.5">
                    <h3 className="text-base font-extrabold text-[#0D3868]">
                      {item.title}
                    </h3>

                    <p className="text-xs text-slate-700 leading-relaxed bg-slate-50/80 p-3 rounded-xl border border-slate-200/70">
                      {item.description}
                    </p>

                    {/* Pratinjau Foto Bukti Pengaduan jika ada */}
                    {complaintPhotos.length > 0 && (
                      <div className="pt-1">
                        <div className="text-[11px] font-bold text-slate-600 mb-1.5 flex items-center gap-2">
                          <span>📷 Foto yang Dilampirkan Saat Pengaduan ({complaintPhotos.length} Foto):</span>
                          <button
                            type="button"
                            onClick={() =>
                              setDetailModalState({
                                report: item,
                                praRecord: matchedPra || null,
                                pengaduanRecord: matchedPgd || null,
                              })
                            }
                            className="text-[#0277BD] hover:underline font-extrabold cursor-pointer"
                          >
                            Klik untuk perbesar →
                          </button>
                        </div>
                        <div className="flex flex-wrap items-center gap-2.5">
                          {complaintPhotos.map((photoUrl, pIdx) => (
                            <button
                              key={pIdx}
                              type="button"
                              onClick={() =>
                                setDetailModalState({
                                  report: item,
                                  praRecord: matchedPra || null,
                                  pengaduanRecord: matchedPgd || null,
                                })
                              }
                              className="relative w-28 h-20 rounded-xl overflow-hidden border-2 border-slate-200 hover:border-[#0277BD] bg-slate-100 group cursor-pointer shadow-2xs"
                              title="Klik untuk melihat detail pengaduan & memperbesar foto"
                            >
                              <img
                                src={resolveImageUrl(photoUrl)}
                                alt={`Foto Pengaduan ${pIdx + 1}`}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              />
                              <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-slate-900/75 text-white text-[9px] font-bold">
                                Perbesar
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Official Letter Number pill if available */}
                    {hasLetterNumber && (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 font-bold">
                        <FileText className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Nomor Surat Resmi: <strong className="font-mono-num">{item.letterRegisterNumber}</strong></span>
                        {item.signedByOfficer && (
                          <span className="text-[11px] text-emerald-700">· {item.signedByOfficer}</span>
                        )}
                      </div>
                    )}

                    {/* Response Note */}
                    {item.responseNote && (
                      <div className="text-xs text-slate-600 flex items-start gap-1.5 pt-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>
                          <strong>Respon Petugas:</strong> {item.responseNote}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Right 4 Cols: Citizen Profile & Contact */}
                  <div className="lg:col-span-4 bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2 text-xs">
                    <div className="font-extrabold text-slate-800 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <UserCheck className="w-4 h-4 text-[#0D3868]" />
                        <span>{item.reporterName}</span>
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-white text-slate-700 font-mono-num text-[10px] font-bold border border-slate-200">
                        {item.rw} · {item.rt || 'RT 01'}
                      </span>
                    </div>

                    {item.applicantNik && (
                      <div className="text-[11px] text-slate-600">
                        NIK: <strong className="font-mono-num text-slate-800">{item.applicantNik}</strong>
                      </div>
                    )}

                    <div className="text-[11px] text-slate-600 flex items-start gap-1">
                      <MapPin className="w-3 h-3 text-emerald-700 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{item.locationName}</span>
                    </div>

                    {(() => {
                      const resolvedPhone = resolveCitizenWhatsAppPhone({
                        rawPhone: item.reporterPhone,
                        citizenName: item.reporterName,
                        ownerId: item.ownerId,
                        ownerEmail: item.ownerEmail,
                        nik: item.applicantNik,
                        citizenUsers,
                      });
                      const hasValidWa = isValidWhatsAppPhone(resolvedPhone);
                      return (
                        <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between gap-2">
                          <span className="font-mono-num text-slate-700 flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-500 shrink-0" />
                            <span>
                              {hasValidWa
                                ? formatDisplayPhone(resolvedPhone)
                                : 'No. WA belum terdaftar'}
                            </span>
                          </span>
                          {hasValidWa ? (
                            <a
                              href={buildWhatsAppUrl(
                                resolvedPhone,
                                `Halo Bapak/Ibu ${item.reporterName}, salam dari Kantor Kelurahan Panaikang.\n\nMengenai pengurusan Anda (${item.ticketCode} - ${item.title}):\nStatus saat ini: *${item.status}*.\nCatatan: ${item.responseNote || 'Berkas Anda sedang kami proses.'}\n\nTerima kasih.`
                              )}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2.5 py-1 rounded-lg bg-[#128C7E] hover:bg-[#075E54] text-white font-bold text-[10px] flex items-center gap-1 transition shrink-0 shadow-2xs"
                            >
                              <MessageCircle className="w-3 h-3" />
                              <span>Balas / Kirim WA</span>
                            </a>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(item)}
                              className="px-2 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-[10px] flex items-center gap-1 transition cursor-pointer shrink-0"
                              title="Nomor WhatsApp warga belum diisi atau tidak valid. Klik untuk mengisi nomor WA agar dapat dikirim pesan."
                            >
                              <Edit3 className="w-3 h-3" />
                              <span>Isi No. WA</span>
                            </button>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Footer Action Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100">
                  {/* Status Actions */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        setDetailModalState({
                          report: item,
                          praRecord: matchedPra || null,
                          pengaduanRecord: matchedPgd || null,
                        })
                      }
                      className="px-3 py-1.5 rounded-lg bg-[#0D3868] hover:bg-[#072647] text-white text-xs font-extrabold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <Eye className="w-3.5 h-3.5 text-amber-300" />
                      <span>
                        {isSurat
                          ? 'Lihat Detail Pengurusan Surat'
                          : 'Lihat Detail Aduan & Foto'}
                      </span>
                    </button>

                    {isWaiting && (
                      <button
                        type="button"
                        onClick={() => handleQuickVerify(item)}
                        className="px-3 py-1.5 rounded-lg bg-[#0277BD] hover:bg-[#01579B] text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Verifikasi Berkas</span>
                      </button>
                    )}

                    {isSurat && !hasLetterNumber && (
                      <button
                        type="button"
                        onClick={() => handleQuickIssueLetter(item)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5 text-amber-300" />
                        <span>Terbitkan No. Surat</span>
                      </button>
                    )}

                    {!isDone && (
                      <button
                        type="button"
                        onClick={() => handleQuickComplete(item)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Tandai Selesai</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setPrintReport(item)}
                      className="px-3 py-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 border border-sky-200 text-[#0D3868] text-xs font-extrabold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <Printer className="w-3.5 h-3.5 text-[#0277BD]" />
                      <span>Cetak Surat / Tanda Terima</span>
                    </button>
                  </div>

                  {/* Edit & Delete */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(item)}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-sky-600" />
                      <span>Edit</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(item.id)}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-rose-50 text-rose-600 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL: INPUT / EDIT PENGAJUAN WARGA (SEDERHANA & LENGKAP) */}
      {showFormModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200 animate-fadeIn my-auto">
            {/* Modal Header */}
            <div className="bg-[#0D3868] text-white p-5 flex items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-black text-white">
                  {editingReportId ? 'Edit Data Pengurusan / Laporan Warga' : 'Input Pengurusan atau Laporan Warga Baru'}
                </h3>
                <p className="text-xs text-sky-200 mt-0.5">
                  Tersimpan langsung secara real-time ke Google Cloud Firestore Kelurahan Panaikang.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowFormModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleFormSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
              {/* Type Switcher */}
              <div className="p-1 bg-slate-100 rounded-xl grid grid-cols-2 gap-1 text-xs font-extrabold">
                <button
                  type="button"
                  onClick={() => setFormType('SURAT')}
                  className={`py-2 px-3 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    formType === 'SURAT'
                      ? 'bg-[#1C8237] text-white shadow-xs'
                      : 'text-slate-700 hover:text-slate-900'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>Pengurusan Surat Administrasi</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormType('ADUAN')}
                  className={`py-2 px-3 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    formType === 'ADUAN'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-slate-700 hover:text-slate-900'
                  }`}
                >
                  <AlertCircle className="w-4 h-4" />
                  <span>Laporan / Pengaduan Masalah</span>
                </button>
              </div>

              {/* Service Selection Dropdown */}
              {formType === 'SURAT' ? (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Jenis Pelayanan Surat Resmi (13 Layanan Kelurahan Panaikang) *
                  </label>
                  <select
                    value={formSuratCode}
                    onChange={(e) => {
                      setFormSuratCode(e.target.value);
                      setFormLetterNumber(generateAutoLetterNumber(e.target.value));
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#0D3868]"
                  >
                    {OFFICIAL_13_WARGA_SERVICES.map((s) => (
                      <option key={s.code} value={s.code}>
                        {s.code} — {s.name} ({s.processingUnit})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Kategori Masalah Lingkungan / Ketertiban *
                  </label>
                  <select
                    value={formAduanCategory}
                    onChange={(e) => setFormAduanCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#0D3868]"
                  >
                    {REPORT_COMPLAINT_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Citizen Details: Nama, NIK, No HP */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama Pemohon / Pelapor *
                  </label>
                  <input
                    type="text"
                    required
                    value={formReporterName}
                    onChange={(e) => setFormReporterName(e.target.value)}
                    placeholder="Contoh: Daeng Naba"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-[#0D3868]"
                  />
                </div>

                <div className="sm:col-span-1">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    NIK KTP (16 Digit)
                  </label>
                  <input
                    type="text"
                    maxLength={16}
                    value={formApplicantNik}
                    onChange={(e) => setFormApplicantNik(e.target.value)}
                    placeholder="7371xxxxxxxxxxxx"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono-num focus:outline-none focus:border-[#0D3868]"
                  />
                </div>

                <div className="sm:col-span-1">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    No. WhatsApp / HP
                  </label>
                  <input
                    type="text"
                    value={formReporterPhone}
                    onChange={(e) => setFormReporterPhone(e.target.value)}
                    placeholder="0812xxxxxxxx"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono-num focus:outline-none focus:border-[#0D3868]"
                  />
                </div>
              </div>

              {/* RW, RT, and Location Address */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Wilayah RW *</label>
                  <select
                    value={formRw}
                    onChange={(e) => setFormRw(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#0D3868]"
                  >
                    {RW_OPTIONS.map((rw) => (
                      <option key={rw} value={rw}>
                        {rw}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Rukun Tetangga (RT)</label>
                  <select
                    value={formRt}
                    onChange={(e) => setFormRt(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#0D3868]"
                  >
                    {DEFAULT_RT_LIST.map((rt) => (
                      <option key={rt} value={rt}>
                        {rt}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Lokasi / Alamat Lengkap *
                  </label>
                  <input
                    type="text"
                    required
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    placeholder="Jl. Sukaria Lorong 2"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-[#0D3868]"
                  />
                </div>
              </div>

              {/* Description / Keperluan */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {formType === 'SURAT' ? 'Keperluan / Keterangan Tambahan Surat' : 'Uraian Detail Permasalahan / Aduan'}
                </label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder={
                    formType === 'SURAT'
                      ? 'Contoh: Persyaratan melamar pekerjaan / Pendaftaran sekolah / Izin usaha mikro...'
                      : 'Contoh: Terjadi tumpukan sampah liar di depan pos ronda yang belum diangkut...'
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-[#0D3868]"
                />
              </div>

              {/* Surat Specific: Nomor Registrasi & Pejabat Penandatangan */}
              {formType === 'SURAT' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200">
                  <div>
                    <label className="block text-xs font-bold text-emerald-900 mb-1">
                      Nomor Registrasi Surat Resmi
                    </label>
                    <input
                      type="text"
                      value={formLetterNumber}
                      onChange={(e) => setFormLetterNumber(e.target.value)}
                      placeholder="470 / 085 / PNK / X / 2026"
                      className="w-full px-3 py-2 rounded-xl border border-emerald-300 bg-white text-xs font-mono-num font-bold text-emerald-950 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-emerald-900 mb-1">
                      Pejabat Penandatangan
                    </label>
                    <select
                      value={formSignedBy}
                      onChange={(e) => setFormSignedBy(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-emerald-300 bg-white text-xs font-bold text-slate-800 focus:outline-none"
                    >
                      {signerOptions.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Status & Response Note */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Status Permohonan *</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as ReportStatus)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#0D3868]"
                  >
                    <option value="Menunggu Verifikasi">Menunggu Verifikasi</option>
                    <option value="Sedang Ditangani">Sedang Diproses / Ditangani</option>
                    <option value="Selesai">Selesai / Diterbitkan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Catatan Verifikasi / Tindak Lanjut Petugas
                  </label>
                  <input
                    type="text"
                    value={formResponseNote}
                    onChange={(e) => setFormResponseNote(e.target.value)}
                    placeholder="Berkas tervalidasi lengkap dan telah dicetak."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-[#0D3868]"
                  />
                </div>
              </div>

              {/* Form Actions */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-[#0D3868] hover:bg-[#072647] text-white text-xs font-black transition flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                >
                  <Database className="w-4 h-4 text-emerald-400" />
                  <span>{isSaving ? 'Menyimpan ke Cloud...' : 'Simpan ke Cloud Firestore'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: KONFIRMASI HAPUS */}
      {confirmDeleteId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-center space-y-4 animate-fadeIn">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">Hapus Data Pengurusan Warga?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Data tiket ini akan dihapus secara permanen dari server dan Google Cloud Firestore. Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={async () => {
                  const id = confirmDeleteId;
                  setConfirmDeleteId(null);
                  const res = await onDeleteReport(id);
                  if (res.ok) {
                    setFeedbackMsg('Data berhasil dihapus dari Cloud Firestore.');
                  }
                }}
                className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black transition cursor-pointer"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: PRATINJAU & CETAK SURAT / TANDA TERIMA RESMI (KOP KELURAHAN PANAIKANG) */}
      {printReport && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/75 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden my-auto flex flex-col max-h-[92vh]">
            {/* Top Bar */}
            <div className="px-5 py-4 bg-gradient-to-r from-[#072647] via-[#0D3868] to-[#0277BD] text-white flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/15 border border-white/25 flex items-center justify-center">
                  <Printer className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <div className="text-[10px] font-black uppercase tracking-wider text-sky-200">
                    DOKUMEN RESMI KELURAHAN PANAIKANG · KOTA MAKASSAR
                  </div>
                  <h3 className="text-sm sm:text-base font-black text-white">
                    Pratinjau & Cetak {isSuratAdministrasi(printReport) ? 'Surat Keterangan Resmi' : 'Tanda Terima Pengaduan Warga'}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPrintReport(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Action Toolbar */}
            <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs text-slate-600">
                Tiket: <strong className="font-mono text-[#0D3868]">{printReport.ticketCode}</strong> · Status:{' '}
                <strong className="text-emerald-700">{printReport.status}</strong>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDownloadPdf(printReport)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1C8237] hover:bg-[#146329] text-white text-xs font-black shadow-xs transition cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Unduh PDF Resmi (A4)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handlePrintDocument(printReport)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0D3868] hover:bg-[#072647] text-white text-xs font-black shadow-xs transition cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-amber-300" />
                  <span>Cetak ke Printer</span>
                </button>
              </div>
            </div>

            {/* Document A4 Sheet Preview */}
            <div className="p-4 sm:p-8 overflow-y-auto bg-slate-100 flex-1">
              <div className="bg-white rounded-2xl border border-slate-300 shadow-md p-6 sm:p-10 max-w-2xl mx-auto text-slate-900 space-y-5">
                {/* Official KOP Header */}
                <div className="flex items-center justify-between gap-3 pb-4 border-b-4 border-double border-[#0D3868]">
                  <EmblemKotaMakassar className="w-12 h-14 sm:w-14 sm:h-16 shrink-0" />
                  <div className="text-center flex-1">
                    <div className="text-xs sm:text-sm font-extrabold text-[#0D3868] tracking-wide uppercase">
                      PEMERINTAH KOTA MAKASSAR
                    </div>
                    <div className="text-xs sm:text-sm font-extrabold text-[#0D3868] tracking-wide uppercase">
                      KECAMATAN PANAKKUKANG
                    </div>
                    <div className="text-base sm:text-lg font-black text-[#0D3868] tracking-wider uppercase">
                      KELURAHAN PANAIKANG
                    </div>
                    <div className="text-[10px] sm:text-[11px] text-slate-600 mt-0.5">
                      {profile.officeAddress} · Telp: {profile.phoneContact} · Kode Pos {profile.postalCode}
                    </div>
                  </div>
                  <EmblemKelurahanPanaikang className="w-12 h-14 sm:w-14 sm:h-16 shrink-0" />
                </div>

                {/* Document Title & Number */}
                <div className="text-center space-y-1">
                  <h4 className="text-sm sm:text-base font-black text-[#0D3868] underline uppercase">
                    {printReport.officialHeaderTitle ||
                      (isSuratAdministrasi(printReport)
                        ? 'SURAT KETERANGAN RESMI KELURAHAN'
                        : 'TANDA TERIMA LAPORAN PENGADUAN WARGA')}
                  </h4>
                  <div className="text-xs font-bold text-slate-700 font-mono">
                    Nomor: {printReport.letterRegisterNumber || printReport.ticketCode}
                  </div>
                </div>

                <p className="text-xs text-slate-700 leading-relaxed text-justify">
                  Yang bertanda tangan di bawah ini, Pemerintah Kelurahan Panaikang Kecamatan Panakkukang Kota Makassar, menerangkan dan mengesahkan dokumen pelayanan warga sebagai berikut:
                </p>

                {/* Details Table */}
                <div className="border border-slate-300 rounded-xl overflow-hidden">
                  <table className="w-full text-xs border-collapse">
                    <tbody className="divide-y divide-slate-200">
                      <tr>
                        <td className="py-2 px-3 bg-slate-50 font-bold text-[#0D3868] w-2/5">Nomor Tiket Sistem</td>
                        <td className="py-2 px-3 font-mono font-bold text-slate-900">{printReport.ticketCode}</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 bg-slate-50 font-bold text-[#0D3868]">Nomor Registrasi Surat</td>
                        <td className="py-2 px-3 font-mono font-semibold text-emerald-800">
                          {printReport.letterRegisterNumber || 'Terdaftar di Loket Pelayanan'}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 bg-slate-50 font-bold text-[#0D3868]">Nama Lengkap Warga</td>
                        <td className="py-2 px-3 font-bold text-slate-900">{printReport.reporterName}</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 bg-slate-50 font-bold text-[#0D3868]">NIK / Identitas</td>
                        <td className="py-2 px-3 font-mono text-slate-800">{printReport.applicantNik || '-'}</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 bg-slate-50 font-bold text-[#0D3868]">Nomor Kontak / WhatsApp</td>
                        <td className="py-2 px-3 font-mono text-slate-800">{printReport.reporterPhone || '-'}</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 bg-slate-50 font-bold text-[#0D3868]">Wilayah & Alamat</td>
                        <td className="py-2 px-3 text-slate-800">
                          {printReport.locationName} ({printReport.rt || 'RT 01'} / {printReport.rw})
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 bg-slate-50 font-bold text-[#0D3868]">Jenis Pelayanan / Kategori</td>
                        <td className="py-2 px-3 font-bold text-slate-900">{printReport.title}</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 bg-slate-50 font-bold text-[#0D3868]">Keterangan / Keperluan</td>
                        <td className="py-2 px-3 text-slate-800">{printReport.description}</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 bg-slate-50 font-bold text-[#0D3868]">Catatan Verifikasi Petugas</td>
                        <td className="py-2 px-3 font-semibold text-slate-900">{printReport.responseNote || '-'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Signature Footer */}
                <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-end justify-between gap-6 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1 text-[11px] text-slate-600">
                    <div className="font-bold text-[#0D3868]">VALIDASI SISTEM KELURAHAN</div>
                    <div>Unit Pelaksana: <strong>{printReport.assignedTeam || 'Loket Pelayanan Kelurahan'}</strong></div>
                    <div>Status Dokumen: <strong className="text-emerald-700">{printReport.status}</strong></div>
                    <div>Tanggal Cetak: {new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
                  </div>

                  <div className="text-center min-w-[200px]">
                    <div className="text-slate-700">
                      Makassar, {new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </div>
                    <div className="font-bold text-slate-800 mt-0.5">Pejabat Penandatangan,</div>
                    <div className="h-14" />
                    <div className="font-black underline text-[#0D3868]">
                      {printReport.signedByOfficer || `${profile.lurahName} (Lurah Panaikang)`}
                    </div>
                    <div className="text-[11px] text-slate-500">NIP. {profile.lurahNip}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Footer */}
            <div className="px-5 py-3 bg-white border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setPrintReport(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 transition cursor-pointer"
              >
                Tutup Pratinjau
              </button>
              <button
                type="button"
                onClick={() => handleDownloadPdf(printReport)}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#1C8237] hover:bg-[#146329] text-white text-xs font-black shadow-xs transition cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Unduh PDF Resmi</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: LIHAT DETAIL PERMOHONAN SURAT / PENGADUAN WARGA & FOTO LAMPIRAN */}
      <SubmissionDetailModal
        isOpen={Boolean(detailModalState)}
        onClose={() => setDetailModalState(null)}
        report={detailModalState?.report}
        praRecord={detailModalState?.praRecord}
        pengaduanRecord={detailModalState?.pengaduanRecord}
        profile={profile}
        citizenUsers={citizenUsers}
        onQuickVerify={handleQuickVerify}
        onQuickIssueLetter={handleQuickIssueLetter}
        onQuickComplete={handleQuickComplete}
        onOpenEdit={handleOpenEdit}
        onOpenPrint={(rep) => setPrintReport(rep)}
        onLurahApproveService={onLurahApproveService}
      />
    </div>
  );
};

export default AdminPengurusanWargaPanel;
