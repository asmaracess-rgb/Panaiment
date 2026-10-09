import React, { useState, useMemo } from 'react';
import {
  FileText,
  UserCheck,
  Briefcase,
  Trees,
  HeartHandshake,
  Users,
  Siren,
  Plus,
  Edit3,
  Trash2,
  Check,
  X,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  Printer,
  MessageCircle,
  Settings,
  ClipboardList,
  Upload,
  Sparkles,
  RefreshCw,
  Building2,
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
} from '../types';
import {
  SERVICE_CATEGORY_GROUPS,
  MAIN_WARGA_MENUS,
  DetailedCategoryId,
  ServiceCategoryGroup,
  ServiceSubItem,
} from '../data/wargaServiceCatalog';
import { IMG_DRAINASE, IMG_BANK_SAMPAH, IMG_KERJA_BAKTI, IG_POST_6 } from '../data/initialData';
import { compressImageFile } from '../utils/compressImage';
import { buildWhatsAppUrl } from '../utils/whatsappHelper';

interface AdminPengurusanWargaPanelProps {
  reports: CitizenReport[];
  profile: KelurahanProfile;
  rwGroups: RwGroup[];
  whatsappRecipients: WhatsAppRecipient[];
  serviceCatalog: ServiceCategoryGroup[];
  adminOfficerName: string;
  allowedServiceCategories?: string[];
  actionPermissions?: AdminActionPermissions;
  onCreateReport: (rep: Partial<CitizenReport>) => Promise<{ ok: boolean; errors?: string[] }>;
  onUpdateReport: (
    id: string,
    rep: Partial<CitizenReport>
  ) => Promise<{ ok: boolean; errors?: string[] }>;
  onDeleteReport: (id: string) => Promise<{ ok: boolean; errors?: string[] }>;
  onSaveServiceCatalog: (
    updatedCatalog: ServiceCategoryGroup[]
  ) => Promise<{ ok: boolean; errors?: string[] }>;
}

const DEFAULT_RW_LIST = ['RW 01', 'RW 02', 'RW 03', 'RW 04', 'RW 05', 'RW 06', 'RW 07'];
const DEFAULT_RT_LIST = ['RT 01', 'RT 02', 'RT 03', 'RT 04', 'RT 05'];

function renderCategoryIcon(
  iconName: ServiceCategoryGroup['iconName'],
  className = 'w-4 h-4'
): React.ReactNode {
  switch (iconName) {
    case 'UserCheck':
      return <UserCheck className={className} />;
    case 'FileText':
      return <FileText className={className} />;
    case 'Briefcase':
      return <Briefcase className={className} />;
    case 'Trees':
      return <Trees className={className} />;
    case 'HeartHandshake':
      return <HeartHandshake className={className} />;
    case 'Users':
      return <Users className={className} />;
    case 'Siren':
      return <Siren className={className} />;
    default:
      return <FileText className={className} />;
  }
}

export function inferReportServiceCategory(
  rep: CitizenReport,
  catalog: ServiceCategoryGroup[]
): {
  categoryId: DetailedCategoryId;
  categoryTitle: string;
  subItemId: string;
  subItemLabel: string;
  documentCode: string;
  officialHeaderTitle: string;
  processingUnit: string;
} {
  if (rep.serviceCategoryId && rep.serviceSubItemId) {
    const foundCat = catalog.find((c) => c.id === rep.serviceCategoryId);
    const foundSub = foundCat?.items.find((i) => i.id === rep.serviceSubItemId);
    if (foundCat && foundSub) {
      return {
        categoryId: foundCat.id,
        categoryTitle: foundCat.title,
        subItemId: foundSub.id,
        subItemLabel: foundSub.label,
        documentCode: rep.documentCode || foundSub.documentCode,
        officialHeaderTitle: rep.officialHeaderTitle || foundSub.officialHeaderTitle,
        processingUnit: rep.processingUnit || foundSub.processingUnit,
      };
    }
  }

  // Match from title or description if created prior to structured metadata
  const combined = `${rep.title} ${rep.description}`.toLowerCase();
  for (const cat of catalog) {
    for (const sub of cat.items) {
      if (combined.includes(sub.label.toLowerCase())) {
        return {
          categoryId: cat.id,
          categoryTitle: cat.title,
          subItemId: sub.id,
          subItemLabel: sub.label,
          documentCode: rep.documentCode || sub.documentCode,
          officialHeaderTitle: rep.officialHeaderTitle || sub.officialHeaderTitle,
          processingUnit: rep.processingUnit || sub.processingUnit,
        };
      }
    }
  }

  // Fallback for environmental reports
  const envCat = catalog.find((c) => c.id === 'masalah_lingkungan') || catalog[0];
  let envSub = envCat.items[0];
  if (rep.category === 'Sampah Liar & TPS') {
    envSub = envCat.items.find((i) => i.id === 'lingkungan-sampah') || envCat.items[0];
  } else if (rep.category === 'Drainase & Genangan') {
    envSub = envCat.items.find((i) => i.id === 'lingkungan-drainase') || envCat.items[0];
  } else if (rep.category === 'Pohon & Ruang Hijau') {
    envSub = envCat.items.find((i) => i.id === 'lingkungan-pohon') || envCat.items[0];
  } else {
    envSub = envCat.items.find((i) => i.id === 'lingkungan-fasum') || envCat.items[0];
  }

  return {
    categoryId: envCat.id,
    categoryTitle: envCat.title,
    subItemId: envSub.id,
    subItemLabel: envSub.label,
    documentCode: rep.documentCode || envSub.documentCode,
    officialHeaderTitle: rep.officialHeaderTitle || envSub.officialHeaderTitle,
    processingUnit: rep.processingUnit || envSub.processingUnit,
  };
}

export const AdminPengurusanWargaPanel: React.FC<AdminPengurusanWargaPanelProps> = ({
  reports,
  profile,
  rwGroups,
  serviceCatalog = SERVICE_CATEGORY_GROUPS,
  adminOfficerName,
  allowedServiceCategories,
  actionPermissions,
  onCreateReport,
  onUpdateReport,
  onDeleteReport,
  onSaveServiceCatalog,
}) => {
  const fullCatalog =
    Array.isArray(serviceCatalog) && serviceCatalog.length > 0
      ? serviceCatalog
      : SERVICE_CATEGORY_GROUPS;

  const catalog = useMemo(() => {
    if (Array.isArray(allowedServiceCategories) && allowedServiceCategories.length > 0) {
      const filtered = fullCatalog.filter((c) => allowedServiceCategories.includes(c.id));
      return filtered.length > 0 ? filtered : fullCatalog;
    }
    return fullCatalog;
  }, [fullCatalog, allowedServiceCategories]);

  const effectivePerms: AdminActionPermissions = actionPermissions || {
    canCreate: true,
    canEdit: true,
    canDelete: true,
    canVerifyAndIssueLetter: true,
    canConfigureCatalog: true,
    canManageWhatsApp: true,
    canExportPrintPdf: true,
  };

  const [subMode, setSubMode] = useState<'submissions' | 'catalog_config'>('submissions');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<'ALL' | DetailedCategoryId>(
    'ALL'
  );
  const [selectedSubItemFilter, setSelectedSubItemFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | ReportStatus>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [feedbackMsg, setFeedbackMsg] = useState<string>('');
  const [errorList, setErrorList] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Submission Form State (Add / Edit Pengurusan Warga)
  const [showForm, setShowForm] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formCategoryId, setFormCategoryId] = useState<DetailedCategoryId>(
    'administrasi_kependudukan'
  );
  const [formSubItemId, setFormSubItemId] = useState<string>('adminduk-ktp-kk');
  const [formReporterName, setFormReporterName] = useState<string>('');
  const [formApplicantNik, setFormApplicantNik] = useState<string>('');
  const [formReporterPhone, setFormReporterPhone] = useState<string>('');
  const [formRw, setFormRw] = useState<string>('RW 02');
  const [formRt, setFormRt] = useState<string>('RT 01');
  const [formLocationName, setFormLocationName] = useState<string>('');
  const [formUrgency, setFormUrgency] = useState<ReportUrgency>('Normal');
  const [formStatus, setFormStatus] = useState<ReportStatus>('Menunggu Verifikasi');
  const [formDescription, setFormDescription] = useState<string>('');
  const [formSpecificFields, setFormSpecificFields] = useState<Record<string, string>>({});
  const [formLetterNumber, setFormLetterNumber] = useState<string>('');
  const [formSignedBy, setFormSignedBy] = useState<string>(
    `${profile.lurahName} (Lurah Panaikang)`
  );
  const [formAssignedTeam, setFormAssignedTeam] = useState<string>('');
  const [formResponseNote, setFormResponseNote] = useState<string>('');
  const [formImageUrl, setFormImageUrl] = useState<string>(IMG_KERJA_BAKTI);
  const [formFollowUpPhotos, setFormFollowUpPhotos] = useState<string[]>([]);

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [printPreviewReport, setPrintPreviewReport] = useState<CitizenReport | null>(null);

  // Catalog Configuration State (Edit SOP & Requirements of 44 Sub-Menus)
  const [configCategoryId, setConfigCategoryId] = useState<DetailedCategoryId>(
    'administrasi_kependudukan'
  );
  const [editingCatalogSubItem, setEditingCatalogSubItem] = useState<ServiceSubItem | null>(null);
  const [isAddingNewSubItem, setIsAddingNewSubItem] = useState<boolean>(false);
  const [subItemLabelDraft, setSubItemLabelDraft] = useState<string>('');
  const [subItemDocCodeDraft, setSubItemDocCodeDraft] = useState<string>('');
  const [subItemHeaderDraft, setSubItemHeaderDraft] = useState<string>('');
  const [subItemUnitDraft, setSubItemUnitDraft] = useState<string>('');
  const [subItemEstimationDraft, setSubItemEstimationDraft] = useState<string>('');
  const [subItemReqsDraft, setSubItemReqsDraft] = useState<string>('');
  const [subItemSopDraft, setSubItemSopDraft] = useState<string>('');
  const [subItemPlaceholderDraft, setSubItemPlaceholderDraft] = useState<string>('');

  const RW_OPTIONS =
    rwGroups.length > 0 ? rwGroups.map((g) => g.rwCode) : DEFAULT_RW_LIST;

  const signerOptions = [
    `${profile.lurahName} (Lurah Panaikang)`,
    `${profile.sekretarisName} (Sekretaris Kelurahan)`,
    `${profile.kasiPemerintahanName} (Kasi Pemerintahan & Trantib)`,
    `${profile.kasiKebersihanName} (Kasi Kebersihan & Lingkungan)`,
    'Kasi Kesejahteraan Rakyat (Kesra) Kelurahan Panaikang',
    'Kasi Pemberdayaan Masyarakat & Ekonomi Kelurahan',
  ];

  // Enrich all reports with resolved category & sub-item metadata
  const enrichedReports = useMemo(() => {
    return reports.map((rep) => {
      const inferred = inferReportServiceCategory(rep, catalog);
      return {
        report: rep,
        ...inferred,
      };
    });
  }, [reports, catalog]);

  // Count per category
  const categoryStats = useMemo(() => {
    const map: Record<
      string,
      { total: number; waiting: number; inProgress: number; completed: number }
    > = {};
    catalog.forEach((c) => {
      map[c.id] = { total: 0, waiting: 0, inProgress: 0, completed: 0 };
    });
    enrichedReports.forEach((item) => {
      const st = map[item.categoryId];
      if (st) {
        st.total += 1;
        if (item.report.status === 'Menunggu Verifikasi') st.waiting += 1;
        else if (item.report.status === 'Sedang Ditangani') st.inProgress += 1;
        else if (item.report.status === 'Selesai') st.completed += 1;
      }
    });
    return map;
  }, [enrichedReports, catalog]);

  // Filtered submissions
  const allowedCategoryIdSet = useMemo(() => new Set(catalog.map((c) => c.id)), [catalog]);

  const filteredSubmissions = useMemo(() => {
    return enrichedReports.filter((item) => {
      if (!allowedCategoryIdSet.has(item.categoryId)) {
        return false;
      }
      if (selectedCategoryFilter !== 'ALL' && item.categoryId !== selectedCategoryFilter) {
        return false;
      }
      if (selectedSubItemFilter !== 'ALL' && item.subItemId !== selectedSubItemFilter) {
        return false;
      }
      if (statusFilter !== 'ALL' && item.report.status !== statusFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const r = item.report;
        const match =
          r.ticketCode.toLowerCase().includes(q) ||
          r.title.toLowerCase().includes(q) ||
          r.reporterName.toLowerCase().includes(q) ||
          (r.applicantNik || '').toLowerCase().includes(q) ||
          (r.letterRegisterNumber || '').toLowerCase().includes(q) ||
          item.subItemLabel.toLowerCase().includes(q) ||
          item.categoryTitle.toLowerCase().includes(q) ||
          r.rw.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [
    enrichedReports,
    selectedCategoryFilter,
    selectedSubItemFilter,
    statusFilter,
    searchQuery,
  ]);

  const currentFormCategory =
    catalog.find((c) => c.id === formCategoryId) || catalog[0];
  const currentFormSubItem =
    currentFormCategory.items.find((i) => i.id === formSubItemId) ||
    currentFormCategory.items[0];

  const generateAutoLetterNumber = (docCode: string) => {
    const seq = String(reports.length + 85).padStart(3, '0');
    const cleanCode = docCode.split('/')[0]?.trim() || '470';
    return `${cleanCode} / ${seq} / PNK / X / 2026`;
  };

  const handleOpenAddSubmission = (defaultCatId?: DetailedCategoryId, defaultSubId?: string) => {
    setFeedbackMsg('');
    setErrorList([]);
    setEditingId(null);
    const cat =
      catalog.find((c) => c.id === (defaultCatId || 'administrasi_kependudukan')) || catalog[0];
    const sub =
      cat.items.find((i) => i.id === defaultSubId) || cat.items[0];
    setFormCategoryId(cat.id);
    setFormSubItemId(sub.id);
    setFormReporterName('');
    setFormApplicantNik('');
    setFormReporterPhone('');
    setFormRw('RW 02');
    setFormRt('RT 01');
    setFormLocationName('Jl. Urip Sumoharjo RW 02, Kelurahan Panaikang');
    setFormUrgency(sub.defaultUrgency);
    setFormStatus('Sedang Ditangani');
    setFormDescription('');
    const initFields: Record<string, string> = {};
    sub.specificFields.forEach((f) => {
      initFields[f.key] = f.options && f.options.length > 0 ? f.options[0] : '';
    });
    setFormSpecificFields(initFields);
    setFormLetterNumber(generateAutoLetterNumber(sub.documentCode));
    setFormSignedBy(`${profile.lurahName} (Lurah Panaikang)`);
    setFormAssignedTeam(sub.processingUnit);
    setFormResponseNote(
      `Berkas pengajuan ${sub.label} telah diverifikasi oleh ${adminOfficerName}.`
    );
    setFormImageUrl(IMG_KERJA_BAKTI);
    setFormFollowUpPhotos([]);
    setShowForm(true);
  };

  const handleOpenEditSubmission = (rep: CitizenReport) => {
    setFeedbackMsg('');
    setErrorList([]);
    const inferred = inferReportServiceCategory(rep, catalog);
    const cat = catalog.find((c) => c.id === inferred.categoryId) || catalog[0];
    const sub = cat.items.find((i) => i.id === inferred.subItemId) || cat.items[0];

    setEditingId(rep.id);
    setFormCategoryId(cat.id);
    setFormSubItemId(sub.id);
    setFormReporterName(rep.reporterName);
    setFormApplicantNik(rep.applicantNik || '');
    setFormReporterPhone(rep.reporterPhone);
    setFormRw(rep.rw);
    setFormRt(rep.rt);
    setFormLocationName(rep.locationName);
    setFormUrgency(rep.urgency);
    setFormStatus(rep.status);
    setFormDescription(rep.description);
    setFormSpecificFields(rep.specificFieldsData || {});
    setFormLetterNumber(
      rep.letterRegisterNumber || generateAutoLetterNumber(sub.documentCode)
    );
    setFormSignedBy(rep.signedByOfficer || `${profile.lurahName} (Lurah Panaikang)`);
    setFormAssignedTeam(rep.assignedTeam || sub.processingUnit);
    setFormResponseNote(rep.responseNote);
    setFormImageUrl(rep.imageUrl || IMG_KERJA_BAKTI);
    setFormFollowUpPhotos(
      Array.isArray(rep.followUpPhotos) && rep.followUpPhotos.length > 0
        ? rep.followUpPhotos
        : rep.completionPhotoUrl
        ? [rep.completionPhotoUrl]
        : []
    );
    setShowForm(true);
  };

  const handleQuickAction = async (
    rep: CitizenReport,
    action: 'verifikasi' | 'terbitkan_surat' | 'selesai'
  ) => {
    setFeedbackMsg('');
    setErrorList([]);
    const inferred = inferReportServiceCategory(rep, catalog);
    const nowTime =
      '06 Okt 2026 · ' +
      new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) +
      ' WITA';
    const autoRegNo =
      rep.letterRegisterNumber || generateAutoLetterNumber(inferred.documentCode);

    if (action === 'verifikasi') {
      const res = await onUpdateReport(rep.id, {
        status: 'Sedang Ditangani',
        verifiedBy: adminOfficerName,
        verifiedAt: nowTime,
        serviceCategoryId: inferred.categoryId,
        serviceCategoryTitle: inferred.categoryTitle,
        serviceSubItemId: inferred.subItemId,
        serviceSubItemLabel: inferred.subItemLabel,
        documentCode: inferred.documentCode,
        officialHeaderTitle: inferred.officialHeaderTitle,
        processingUnit: inferred.processingUnit,
        assignedTeam: inferred.processingUnit,
        responseNote: `Berkas pengajuan "${inferred.subItemLabel}" telah diverifikasi oleh ${adminOfficerName} dan diteruskan ke ${inferred.processingUnit}.`,
      });
      if (res.ok) {
        setFeedbackMsg(
          `Pengajuan ${rep.ticketCode} (${inferred.subItemLabel}) berhasil DIVERIFIKASI.`
        );
      }
      return;
    }

    if (action === 'terbitkan_surat') {
      const res = await onUpdateReport(rep.id, {
        status: 'Sedang Ditangani',
        verifiedBy: rep.verifiedBy || adminOfficerName,
        verifiedAt: rep.verifiedAt || nowTime,
        serviceCategoryId: inferred.categoryId,
        serviceCategoryTitle: inferred.categoryTitle,
        serviceSubItemId: inferred.subItemId,
        serviceSubItemLabel: inferred.subItemLabel,
        documentCode: inferred.documentCode,
        officialHeaderTitle: inferred.officialHeaderTitle,
        processingUnit: inferred.processingUnit,
        letterRegisterNumber: autoRegNo,
        signedByOfficer: rep.signedByOfficer || `${profile.lurahName} (Lurah Panaikang)`,
        responseNote: `Nomor Registrasi Surat Resmi (${autoRegNo}) telah diterbitkan oleh ${inferred.processingUnit}.`,
      });
      if (res.ok) {
        setFeedbackMsg(
          `Nomor Surat Resmi (${autoRegNo}) berhasil diterbitkan untuk tiket ${rep.ticketCode}.`
        );
      }
      return;
    }

    if (action === 'selesai') {
      const res = await onUpdateReport(rep.id, {
        status: 'Selesai',
        verifiedBy: rep.verifiedBy || adminOfficerName,
        verifiedAt: rep.verifiedAt || nowTime,
        completedAt: nowTime,
        serviceCategoryId: inferred.categoryId,
        serviceCategoryTitle: inferred.categoryTitle,
        serviceSubItemId: inferred.subItemId,
        serviceSubItemLabel: inferred.subItemLabel,
        documentCode: inferred.documentCode,
        officialHeaderTitle: inferred.officialHeaderTitle,
        processingUnit: inferred.processingUnit,
        letterRegisterNumber: autoRegNo,
        signedByOfficer: rep.signedByOfficer || `${profile.lurahName} (Lurah Panaikang)`,
        completionPhotoUrl: rep.completionPhotoUrl || IG_POST_6,
        followUpPhotos:
          Array.isArray(rep.followUpPhotos) && rep.followUpPhotos.length > 0
            ? rep.followUpPhotos
            : [rep.completionPhotoUrl || IG_POST_6],
        responseNote: `Pelayanan "${inferred.subItemLabel}" telah SELESAI (No. Reg: ${autoRegNo}). Dokumen/tindak lanjut telah disahkan oleh ${
          rep.signedByOfficer || profile.lurahName
        }.`,
      });
      if (res.ok) {
        setFeedbackMsg(
          `Pengurusan ${rep.ticketCode} (${inferred.subItemLabel}) telah ditandai SELESAI.`
        );
      }
    }
  };

  const handleFollowUpPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue;
      try {
        const compressed = await compressImageFile(file);
        setFormFollowUpPhotos((prev) => [compressed, ...prev]);
      } catch {
        // ignore
      }
    }
  };

  const handleSubmissionFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackMsg('');
    setErrorList([]);

    if (!formReporterName.trim() || !formLocationName.trim()) {
      setErrorList(['Nama Lengkap Pemohon/Pelapor dan Alamat/Lokasi wajib diisi.']);
      return;
    }

    setIsSaving(true);
    const nowTime = '06 Okt 2026 · Diperbarui Admin';
    const composedTitle = `[${currentFormCategory.title} — ${currentFormSubItem.label}] a.n. ${formReporterName.trim()}`;

    const specificSummary = currentFormSubItem.specificFields
      .map((f) => {
        const val = formSpecificFields[f.key]?.trim();
        return val ? `${f.label}: ${val}` : null;
      })
      .filter(Boolean)
      .join(' | ');

    const composedDescription =
      formDescription.trim().length >= 10
        ? formDescription.trim()
        : `Layanan: ${currentFormCategory.title} › ${currentFormSubItem.label}${
            formApplicantNik.trim() ? ` | NIK/KK: ${formApplicantNik.trim()}` : ''
          }${specificSummary ? ` | ${specificSummary}` : ''} — ${
            formDescription.trim() || 'Pengajuan tervalidasi melalui loket pelayanan kelurahan.'
          }`;

    const payload: Partial<CitizenReport> = {
      title: composedTitle,
      description: composedDescription,
      category: currentFormSubItem.reportCategory as ReportCategory,
      urgency: formUrgency,
      status: formStatus,
      reporterName: formReporterName.trim(),
      reporterPhone: formReporterPhone.trim() || '0812-xxxx-xxxx',
      rw: formRw,
      rt: formRt,
      locationName: formLocationName.trim(),
      assignedTeam: formAssignedTeam.trim() || currentFormSubItem.processingUnit,
      responseNote:
        formResponseNote.trim() ||
        `Diproses oleh ${currentFormSubItem.processingUnit} Kelurahan Panaikang.`,
      imageUrl: formImageUrl,
      verifiedBy: formStatus !== 'Menunggu Verifikasi' ? adminOfficerName : undefined,
      verifiedAt: formStatus !== 'Menunggu Verifikasi' ? nowTime : undefined,
      completedAt: formStatus === 'Selesai' ? nowTime : undefined,
      completionPhotoUrl: formFollowUpPhotos[0] || '',
      followUpPhotos: formFollowUpPhotos,
      serviceCategoryId: currentFormCategory.id,
      serviceCategoryTitle: currentFormCategory.title,
      serviceSubItemId: currentFormSubItem.id,
      serviceSubItemLabel: currentFormSubItem.label,
      documentCode: currentFormSubItem.documentCode,
      officialHeaderTitle: currentFormSubItem.officialHeaderTitle,
      processingUnit: currentFormSubItem.processingUnit,
      applicantNik: formApplicantNik.trim() || undefined,
      specificFieldsData: { ...formSpecificFields },
      letterRegisterNumber: formLetterNumber.trim() || undefined,
      signedByOfficer: formSignedBy.trim() || undefined,
    };

    const res = editingId
      ? await onUpdateReport(editingId, payload)
      : await onCreateReport(payload);
    setIsSaving(false);

    if (!res.ok) {
      setErrorList(res.errors || ['Gagal menyimpan data pengurusan layanan warga.']);
    } else {
      setShowForm(false);
      setEditingId(null);
      setFeedbackMsg(
        editingId
          ? `Data pengurusan "${currentFormSubItem.label}" berhasil diperbarui.`
          : `Pengajuan baru "${currentFormSubItem.label}" berhasil ditambahkan ke sistem Back-End.`
      );
    }
  };

  // ================= CATALOG CONFIGURATION HANDLERS =================
  const currentConfigCategory =
    catalog.find((c) => c.id === configCategoryId) || catalog[0];

  const handleOpenEditCatalogSubItem = (item: ServiceSubItem) => {
    setIsAddingNewSubItem(false);
    setEditingCatalogSubItem(item);
    setSubItemLabelDraft(item.label);
    setSubItemDocCodeDraft(item.documentCode);
    setSubItemHeaderDraft(item.officialHeaderTitle);
    setSubItemUnitDraft(item.processingUnit);
    setSubItemEstimationDraft(item.estimation);
    setSubItemReqsDraft(item.requirements.join('\n'));
    setSubItemSopDraft(item.sopSteps.join('\n'));
    setSubItemPlaceholderDraft(item.placeholderNote);
  };

  const handleOpenAddCatalogSubItem = () => {
    setEditingCatalogSubItem(null);
    setIsAddingNewSubItem(true);
    setSubItemLabelDraft('');
    setSubItemDocCodeDraft('470 / SUKET-BARU / PNK');
    setSubItemHeaderDraft('SURAT KETERANGAN / LAYANAN KELURAHAN PANAIKANG');
    setSubItemUnitDraft('Seksi Pemerintahan & Pelayanan Umum');
    setSubItemEstimationDraft('1 Hari Kerja');
    setSubItemReqsDraft('Pengantar RT/RW setempat\nFotokopi KTP & Kartu Keluarga (KK)');
    setSubItemSopDraft(
      'Warga mengisi formulir pengajuan dan melampirkan pengantar RT/RW\nVerifikasi berkas oleh petugas loket kelurahan\nPenerbitan surat / tindak lanjut oleh pejabat berwenang'
    );
    setSubItemPlaceholderDraft('Contoh: Tuliskan rincian keperluan pengajuan layanan ini...');
  };

  const handleSaveCatalogSubItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackMsg('');
    setErrorList([]);
    if (!subItemLabelDraft.trim() || !subItemDocCodeDraft.trim()) {
      setErrorList(['Nama Sub-Menu Layanan dan Kode Klasifikasi Dokumen wajib diisi.']);
      return;
    }

    const cleanReqs = subItemReqsDraft
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    const cleanSops = subItemSopDraft
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    const updatedGroups = catalog.map((group) => {
      if (group.id !== configCategoryId) return group;
      if (isAddingNewSubItem) {
        const newSub: ServiceSubItem = {
          id: `${group.id}-${Date.now()}`,
          label: subItemLabelDraft.trim(),
          documentCode: subItemDocCodeDraft.trim(),
          officialHeaderTitle:
            subItemHeaderDraft.trim() || subItemLabelDraft.trim().toUpperCase(),
          processingUnit: subItemUnitDraft.trim() || 'Loket Pelayanan Kelurahan Panaikang',
          estimation: subItemEstimationDraft.trim() || '1 Hari Kerja',
          requirements:
            cleanReqs.length > 0 ? cleanReqs : ['Pengantar RT/RW', 'Fotokopi KTP & KK'],
          sopSteps:
            cleanSops.length > 0
              ? cleanSops
              : ['Pengajuan berkas', 'Verifikasi petugas', 'Penerbitan dokumen'],
          reportCategory:
            group.id === 'masalah_lingkungan' ? 'Drainase & Genangan' : 'Ketertiban & Fasum',
          defaultUrgency: 'Normal',
          placeholderNote:
            subItemPlaceholderDraft.trim() || 'Tuliskan rincian keperluan layanan...',
          isEnvironmental: group.id === 'masalah_lingkungan',
          specificFields: [
            {
              key: 'keteranganKhusus',
              label: `Rincian Khusus (${subItemLabelDraft.trim()})`,
              placeholder: 'Isi keterangan tambahan layanan',
            },
          ],
        };
        return { ...group, items: [...group.items, newSub] };
      }

      if (editingCatalogSubItem) {
        return {
          ...group,
          items: group.items.map((item) =>
            item.id === editingCatalogSubItem.id
              ? {
                  ...item,
                  label: subItemLabelDraft.trim(),
                  documentCode: subItemDocCodeDraft.trim(),
                  officialHeaderTitle: subItemHeaderDraft.trim(),
                  processingUnit: subItemUnitDraft.trim(),
                  estimation: subItemEstimationDraft.trim(),
                  requirements: cleanReqs.length > 0 ? cleanReqs : item.requirements,
                  sopSteps: cleanSops.length > 0 ? cleanSops : item.sopSteps,
                  placeholderNote: subItemPlaceholderDraft.trim() || item.placeholderNote,
                }
              : item
          ),
        };
      }
      return group;
    });

    setIsSaving(true);
    const res = await onSaveServiceCatalog(updatedGroups);
    setIsSaving(false);
    if (res.ok) {
      setEditingCatalogSubItem(null);
      setIsAddingNewSubItem(false);
      setFeedbackMsg(
        'Konfigurasi Katalog Sub-Menu & SOP berhasil disimpan ke Back-End dan langsung diperbarui pada halaman Menu Warga.'
      );
    } else {
      setErrorList(res.errors || ['Gagal menyimpan konfigurasi katalog layanan warga.']);
    }
  };

  const handleDeleteCatalogSubItem = async (subId: string) => {
    const updatedGroups = catalog.map((group) => {
      if (group.id !== configCategoryId) return group;
      if (group.items.length <= 1) return group;
      return {
        ...group,
        items: group.items.filter((i) => i.id !== subId),
      };
    });
    const res = await onSaveServiceCatalog(updatedGroups);
    if (res.ok) {
      setFeedbackMsg('Sub-menu layanan berhasil dihapus dari kategori.');
    }
  };

  const handleResetDefaultCatalog = async () => {
    setIsSaving(true);
    const res = await onSaveServiceCatalog(SERVICE_CATEGORY_GROUPS);
    setIsSaving(false);
    if (res.ok) {
      setFeedbackMsg(
        'Katalog 7 Kategori & 44 Sub-Menu berhasil dikembalikan ke pengaturan standar Kelurahan Panaikang.'
      );
    }
  };

  const totalSubMenusCount = catalog.reduce((acc, g) => acc + g.items.length, 0);

  return (
    <div className="space-y-6">
      {/* Top Banner Back-End Pengurusan Warga */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="bg-gradient-to-r from-[#0D3868] via-[#134B8A] to-[#0277BD] px-5 sm:px-7 py-5 text-white flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-amber-300">
              🏛️ BACK-END PELAYANAN DIGITAL KELURAHAN PANAIKANG
            </div>
            <h2 className="mt-1 text-lg sm:text-xl font-extrabold text-white">
              Manajemen Back-End Menu Pengurusan Warga (7 Bidang & {totalSubMenusCount} Sub-Menu)
            </h2>
            <p className="mt-1 text-xs text-sky-100 max-w-3xl leading-relaxed">
              Kelola seluruh pengajuan surat pengantar, administrasi kependudukan, surat keterangan,
              pelayanan usaha (UMKM), masalah lingkungan, bantuan sosial, kegiatan kemasyarakatan,
              pengaduan warga, hingga konfigurasi persyaratan & SOP tiap sub-menu.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setSubMode('submissions')}
              className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-extrabold border transition-all cursor-pointer ${
                subMode === 'submissions'
                  ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-xs'
                  : 'bg-white/10 hover:bg-white/20 text-white border-white/25'
              }`}
            >
              <ClipboardList className="w-4 h-4" />
              <span>Data Pengajuan & Surat ({reports.length})</span>
            </button>

            {effectivePerms.canConfigureCatalog && (
              <button
                type="button"
                onClick={() => setSubMode('catalog_config')}
                className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-extrabold border transition-all cursor-pointer ${
                  subMode === 'catalog_config'
                    ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-xs'
                    : 'bg-white/10 hover:bg-white/20 text-white border-white/25'
                }`}
              >
                <Settings className="w-4 h-4" />
                <span>Pengaturan Katalog & SOP ({totalSubMenusCount} Sub-Menu)</span>
              </button>
            )}
          </div>
        </div>

        {/* 10 Menu Utama Reference Strip */}
        <div className="px-5 sm:px-7 py-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2 overflow-x-auto">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#0D3868] whitespace-nowrap mr-1 flex items-center gap-1">
            <Building2 className="w-3.5 h-3.5" />
            <span>Pintasan 10 Menu Utama:</span>
          </span>
          {MAIN_WARGA_MENUS.filter((m) => m.defaultCategory).map((menu) => {
            const isSelected = selectedCategoryFilter === menu.defaultCategory;
            return (
              <button
                key={menu.id}
                type="button"
                onClick={() => {
                  setSubMode('submissions');
                  if (menu.defaultCategory) {
                    setSelectedCategoryFilter(menu.defaultCategory);
                    setSelectedSubItemFilter('ALL');
                  }
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap border transition-colors cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-[#0D3868] text-white border-[#0D3868]'
                    : 'bg-white hover:bg-sky-50 text-slate-700 border-slate-200'
                }`}
              >
                <span>{menu.emoji}</span>
                <span>{menu.label}</span>
              </button>
            );
          })}
          {selectedCategoryFilter !== 'ALL' && (
            <button
              type="button"
              onClick={() => {
                setSelectedCategoryFilter('ALL');
                setSelectedSubItemFilter('ALL');
              }}
              className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-slate-200 hover:bg-slate-300 text-slate-800 whitespace-nowrap cursor-pointer"
            >
              Tampilkan Semua Bidang
            </button>
          )}
        </div>
      </div>

      {/* Feedback & Errors */}
      {feedbackMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex items-center justify-between gap-3 text-xs sm:text-sm font-semibold">
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

      {errorList.length > 0 && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-900 text-xs sm:text-sm">
          <div className="font-bold mb-1">Periksa Kembali Input Anda:</div>
          <ul className="list-disc list-inside space-y-0.5">
            {errorList.map((e, idx) => (
              <li key={idx}>{e}</li>
            ))}
          </ul>
        </div>
      )}

      {/* =====================================================================================
          SUB-MODE 1: MANAJEMEN PENGAJUAN, VERIFIKASI & PENERBITAN SURAT (7 BIDANG & 44 SUB-MENU)
      ===================================================================================== */}
      {subMode === 'submissions' && (
        <div className="space-y-6">
          {/* 7-Category Interactive Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <button
              type="button"
              onClick={() => {
                setSelectedCategoryFilter('ALL');
                setSelectedSubItemFilter('ALL');
              }}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                selectedCategoryFilter === 'ALL'
                  ? 'bg-[#0D3868] text-white border-[#0D3868] shadow-sm'
                  : 'bg-white hover:border-[#0277BD] text-slate-800 border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider opacity-80">
                  Semua 7 Bidang Layanan
                </span>
                <span className="font-mono-num text-lg font-extrabold">{reports.length}</span>
              </div>
              <div className="mt-2 text-sm font-extrabold">Seluruh Pengurusan Warga</div>
              <div
                className={`mt-2 pt-2 border-t text-[11px] flex items-center justify-between ${
                  selectedCategoryFilter === 'ALL'
                    ? 'border-white/15 text-sky-100'
                    : 'border-slate-100 text-slate-500'
                }`}
              >
                <span>{totalSubMenusCount} Sub-Menu Aktif</span>
                <span>Semua Data →</span>
              </div>
            </button>

            {catalog.map((cat) => {
              const st = categoryStats[cat.id] || {
                total: 0,
                waiting: 0,
                inProgress: 0,
                completed: 0,
              };
              const isSelected = selectedCategoryFilter === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setSelectedCategoryFilter(cat.id);
                    setSelectedSubItemFilter('ALL');
                  }}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-[#0D3868] text-white border-[#0D3868] shadow-sm'
                      : 'bg-white hover:border-[#0277BD] text-slate-800 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-white/20 text-white' : cat.iconBg
                        }`}
                      >
                        {renderCategoryIcon(cat.iconName, 'w-4 h-4')}
                      </span>
                      <span className="text-[11px] font-bold opacity-80">
                        Bidang {cat.number} ({cat.items.length} Sub-Menu)
                      </span>
                    </div>
                    <span className="font-mono-num text-base font-extrabold">{st.total}</span>
                  </div>
                  <div className="mt-2 text-xs sm:text-sm font-extrabold line-clamp-1">
                    {cat.title}
                  </div>
                  <div
                    className={`mt-2 pt-2 border-t text-[11px] flex items-center justify-between ${
                      isSelected
                        ? 'border-white/15 text-sky-100'
                        : 'border-slate-100 text-slate-500'
                    }`}
                  >
                    <span>
                      Baru: {st.waiting} · Proses: {st.inProgress} · Selesai: {st.completed}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Sub-Menu Filter Strip when a specific Category is selected */}
          {selectedCategoryFilter !== 'ALL' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs font-extrabold uppercase tracking-wider text-[#0D3868]">
                  Filter Sub-Menu pada Bidang{' '}
                  {catalog.find((c) => c.id === selectedCategoryFilter)?.title}:
                </div>
                <button
                  type="button"
                  onClick={() =>
                    handleOpenAddSubmission(
                      selectedCategoryFilter,
                      selectedSubItemFilter !== 'ALL' ? selectedSubItemFilter : undefined
                    )
                  }
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1C8237] hover:bg-[#146329] text-white text-xs font-bold cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Input Pengajuan pada Bidang Ini</span>
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedSubItemFilter('ALL')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                    selectedSubItemFilter === 'ALL'
                      ? 'bg-[#0277BD] text-white border-[#0277BD]'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  Semua Sub-Menu
                </button>
                {catalog
                  .find((c) => c.id === selectedCategoryFilter)
                  ?.items.map((sub, idx) => {
                    const count = enrichedReports.filter((r) => r.subItemId === sub.id).length;
                    const active = selectedSubItemFilter === sub.id;
                    return (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => setSelectedSubItemFilter(sub.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                          active
                            ? 'bg-[#0D3868] text-white border-[#0D3868]'
                            : 'bg-slate-50 hover:bg-sky-50 text-slate-700 border-slate-200'
                        }`}
                      >
                        {idx + 1}. {sub.label} ({count})
                      </button>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Action & Search Toolbar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nomor tiket, NIK, nomor surat, nama warga, jenis sub-menu, atau RW..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:border-[#0D3868] focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {(['ALL', 'Menunggu Verifikasi', 'Sedang Ditangani', 'Selesai'] as const).map(
                (st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                      statusFilter === st
                        ? 'bg-[#0D3868] text-white border-[#0D3868]'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {st === 'ALL' ? 'Semua Status' : st}
                  </button>
                )
              )}

              <button
                type="button"
                onClick={() => handleOpenAddSubmission()}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#1C8237] hover:bg-[#146329] text-white text-xs font-extrabold shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Buat Surat / Input Pengurusan Warga</span>
              </button>
            </div>
          </div>

          {/* Add / Edit Pengurusan Warga Form Modal / Drawer */}
          {showForm && (
            <form
              onSubmit={handleSubmissionFormSubmit}
              className="bg-white rounded-2xl border-2 border-[#0D3868] p-5 sm:p-6 space-y-5 shadow-md"
            >
              <div className="flex items-center justify-between border-b border-slate-200 pb-3.5">
                <div>
                  <div className="text-xs font-extrabold uppercase tracking-wider text-[#0277BD]">
                    Formulir Back-End Petugas Loket & Operator Kelurahan
                  </div>
                  <h3 className="text-base sm:text-lg font-extrabold text-[#0D3868]">
                    {editingId
                      ? `Edit & Proses Pengurusan Warga — ${currentFormSubItem.label}`
                      : 'Input Pengurusan Layanan / Penerbitan Surat Warga Baru'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                  }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Step 1: Pilih Bidang (7 Kategori) & Sub-Menu (44 Layanan) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <label className="block text-xs font-bold text-[#0D3868] mb-1.5">
                    1. Pilih Bidang Layanan Warga (7 Kategori) *
                  </label>
                  <select
                    value={formCategoryId}
                    onChange={(e) => {
                      const nextCatId = e.target.value as DetailedCategoryId;
                      setFormCategoryId(nextCatId);
                      const nextCat = catalog.find((c) => c.id === nextCatId) || catalog[0];
                      const firstSub = nextCat.items[0];
                      if (firstSub) {
                        setFormSubItemId(firstSub.id);
                        setFormUrgency(firstSub.defaultUrgency);
                        setFormAssignedTeam(firstSub.processingUnit);
                        setFormLetterNumber(generateAutoLetterNumber(firstSub.documentCode));
                      }
                    }}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs sm:text-sm font-bold text-slate-900 bg-white"
                  >
                    {catalog.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.number}. {cat.title} ({cat.items.length} Sub-Menu)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0D3868] mb-1.5">
                    2. Pilih Sub-Menu Layanan / Pengaduan *
                  </label>
                  <select
                    value={formSubItemId}
                    onChange={(e) => {
                      const nextSubId = e.target.value;
                      setFormSubItemId(nextSubId);
                      const sub = currentFormCategory.items.find((i) => i.id === nextSubId);
                      if (sub) {
                        setFormUrgency(sub.defaultUrgency);
                        setFormAssignedTeam(sub.processingUnit);
                        setFormLetterNumber(generateAutoLetterNumber(sub.documentCode));
                      }
                    }}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs sm:text-sm font-bold text-slate-900 bg-white"
                  >
                    {currentFormCategory.items.map((sub, i) => (
                      <option key={sub.id} value={sub.id}>
                        {i + 1}. {sub.label} [{sub.documentCode}]
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Step 2: Data Pemohon / Warga */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Lengkap Pemohon / Warga *
                  </label>
                  <input
                    type="text"
                    value={formReporterName}
                    onChange={(e) => setFormReporterName(e.target.value)}
                    placeholder="Contoh: Andi Muh. Farhan"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    NIK / Nomor KK (16 Digit)
                  </label>
                  <input
                    type="text"
                    value={formApplicantNik}
                    onChange={(e) => setFormApplicantNik(e.target.value)}
                    placeholder="737109xxxxxxxxxx"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm font-mono-num"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nomor WhatsApp Pemohon
                  </label>
                  <input
                    type="text"
                    value={formReporterPhone}
                    onChange={(e) => setFormReporterPhone(e.target.value)}
                    placeholder="0812-xxxx-xxxx"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm font-mono-num"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Wilayah RW *
                  </label>
                  <select
                    value={formRw}
                    onChange={(e) => setFormRw(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm bg-white"
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
                    value={formRt}
                    onChange={(e) => setFormRt(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm bg-white"
                  >
                    {DEFAULT_RT_LIST.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Alamat Domisili / Lokasi di Panaikang *
                  </label>
                  <input
                    type="text"
                    value={formLocationName}
                    onChange={(e) => setFormLocationName(e.target.value)}
                    placeholder="Contoh: Jl. Urip Sumoharjo Lr. 2 No. 10"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm"
                  />
                </div>
              </div>

              {/* Step 3: Kolom Spesifik Sub-Menu */}
              {currentFormSubItem.specificFields.length > 0 && (
                <div className="p-4 rounded-xl bg-sky-50/70 border border-sky-200 space-y-3">
                  <div className="text-xs font-extrabold uppercase tracking-wider text-[#0D3868]">
                    Data Spesifik Sub-Menu: {currentFormSubItem.label}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {currentFormSubItem.specificFields.map((field) => (
                      <div key={field.key}>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          {field.label}
                        </label>
                        {field.type === 'select' && field.options ? (
                          <select
                            value={formSpecificFields[field.key] || field.options[0]}
                            onChange={(e) =>
                              setFormSpecificFields((prev) => ({
                                ...prev,
                                [field.key]: e.target.value,
                              }))
                            }
                            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm bg-white"
                          >
                            {field.options.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            value={formSpecificFields[field.key] || ''}
                            onChange={(e) =>
                              setFormSpecificFields((prev) => ({
                                ...prev,
                                [field.key]: e.target.value,
                              }))
                            }
                            placeholder={field.placeholder}
                            className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm bg-white"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 4: Penomoran Surat Resmi, Pejabat Penandatangan & Status */}
              <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 space-y-3.5">
                <div className="text-xs font-extrabold uppercase tracking-wider text-emerald-900">
                  Registrasi Surat Resmi, Disposisi Unit & Status Penyelesaian
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nomor Registrasi Surat / Dokumen Resmi
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={formLetterNumber}
                        onChange={(e) => setFormLetterNumber(e.target.value)}
                        placeholder="Contoh: 474.4 / 088 / PNK / X / 2026"
                        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs sm:text-sm font-mono-num bg-white"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setFormLetterNumber(
                            generateAutoLetterNumber(currentFormSubItem.documentCode)
                          )
                        }
                        title="Buat Nomor Otomatis"
                        className="px-2.5 py-2 rounded-xl bg-[#0D3868] text-white text-xs font-bold cursor-pointer shrink-0"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Pejabat Penandatangan / Pengesah
                    </label>
                    <select
                      value={formSignedBy}
                      onChange={(e) => setFormSignedBy(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs sm:text-sm bg-white"
                    >
                      {signerOptions.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Status Pengurusan Layanan *
                    </label>
                    <select
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value as ReportStatus)}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs sm:text-sm font-bold bg-white"
                    >
                      <option value="Menunggu Verifikasi">Menunggu Verifikasi</option>
                      <option value="Sedang Ditangani">Sedang Ditangani / Proses Surat</option>
                      <option value="Selesai">Selesai / Surat Terbit</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Unit Pelaksana / Seksi Penanggung Jawab
                    </label>
                    <input
                      type="text"
                      value={formAssignedTeam}
                      onChange={(e) => setFormAssignedTeam(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs sm:text-sm bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Unggah Bukti Tindak Lanjut / Scan Surat Selesai
                    </label>
                    <label className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-emerald-300 bg-white hover:bg-emerald-50 text-emerald-800 text-xs font-bold cursor-pointer">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Unggah Foto Bukti / Dokumen ({formFollowUpPhotos.length})</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleFollowUpPhotoUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Catatan Verifikasi / Keterangan Tindak Lanjut Petugas *
                  </label>
                  <textarea
                    rows={2}
                    value={formResponseNote}
                    onChange={(e) => setFormResponseNote(e.target.value)}
                    placeholder="Catatan tindak lanjut yang akan tampil pada halaman Cek Status Warga..."
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs sm:text-sm bg-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                  }}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#0D3868] hover:bg-[#0277BD] text-white text-xs sm:text-sm font-extrabold cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>
                    {editingId
                      ? 'Simpan Perubahan & Status Pengurusan'
                      : 'Simpan Pengurusan Warga Baru'}
                  </span>
                </button>
              </div>
            </form>
          )}

          {/* List of Citizen Submissions across the 7 Categories & 44 Sub-Menus */}
          <div className="space-y-3.5">
            {filteredSubmissions.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center space-y-2">
                <div className="text-sm font-bold text-slate-700">
                  Belum ada data pengajuan pada filter kategori/sub-menu ini.
                </div>
                <p className="text-xs text-slate-500">
                  Klik tombol "+ Buat Surat / Input Pengurusan Warga" di atas untuk menambahkan data
                  baru.
                </p>
              </div>
            ) : (
              filteredSubmissions.map((item) => {
                const rep = item.report;
                const waApplicantMsg = `Halo Bapak/Ibu *${rep.reporterName}*, menginformasikan pengajuan layanan *${item.subItemLabel}* (Tiket: *${rep.ticketCode}*${
                  rep.letterRegisterNumber ? `, No. Surat: *${rep.letterRegisterNumber}*` : ''
                }) di Kelurahan Panaikang saat ini berstatus: *${rep.status}*. Catatan Petugas: ${
                  rep.responseNote
                }`;
                const waApplicantUrl = buildWhatsAppUrl(rep.reporterPhone, waApplicantMsg);

                return (
                  <div
                    key={rep.id}
                    className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3.5 shadow-xs hover:border-slate-300 transition-all"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                          <span className="font-mono-num font-extrabold text-[#0D3868]">
                            {rep.ticketCode}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="font-bold text-[#0277BD]">{item.categoryTitle}</span>
                          <span aria-hidden="true">›</span>
                          <span className="font-extrabold text-slate-900">{item.subItemLabel}</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono-num">{rep.createdAt}</span>
                        </div>

                        <h3 className="text-sm sm:text-base font-extrabold text-[#0D3868]">
                          {rep.title}
                        </h3>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-700">
                          <span>
                            Pemohon: <strong>{rep.reporterName}</strong>
                          </span>
                          {rep.applicantNik && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="font-mono-num">
                                NIK/KK: <strong>{rep.applicantNik}</strong>
                              </span>
                            </>
                          )}
                          <span aria-hidden="true">·</span>
                          <span className="font-mono-num">WA: {rep.reporterPhone}</span>
                          <span aria-hidden="true">·</span>
                          <span>
                            Wilayah: <strong>{rep.rw} / {rep.rt}</strong> ({rep.locationName})
                          </span>
                        </div>

                        {/* Specific Sub-Menu Fields if present */}
                        {rep.specificFieldsData &&
                          Object.keys(rep.specificFieldsData).length > 0 && (
                            <div className="pt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
                              {Object.entries(rep.specificFieldsData).map(([k, v]) =>
                                v ? (
                                  <span key={k} className="bg-slate-100 px-2.5 py-0.5 rounded-md">
                                    <strong className="text-slate-800">{k}:</strong> {v}
                                  </span>
                                ) : null
                              )}
                            </div>
                          )}

                        {/* Official Letter Registration Info */}
                        {(rep.letterRegisterNumber || rep.signedByOfficer) && (
                          <div className="pt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-emerald-800 font-semibold">
                            {rep.letterRegisterNumber && (
                              <span>
                                No. Registrasi Surat:{' '}
                                <strong className="font-mono-num underline">
                                  {rep.letterRegisterNumber}
                                </strong>
                              </span>
                            )}
                            {rep.signedByOfficer && (
                              <span>Pejabat Pengesah: {rep.signedByOfficer}</span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Status Indicator & Quick 1-Click Actions */}
                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-extrabold px-2.5 py-1 rounded-lg ${
                            rep.status === 'Selesai'
                              ? 'bg-emerald-50 text-emerald-800'
                              : rep.status === 'Sedang Ditangani'
                              ? 'bg-sky-50 text-sky-800'
                              : 'bg-amber-50 text-amber-800'
                          }`}
                        >
                          {rep.status === 'Selesai' && <CheckCircle2 className="w-3.5 h-3.5" />}
                          {rep.status === 'Sedang Ditangani' && <Clock className="w-3.5 h-3.5" />}
                          {rep.status === 'Menunggu Verifikasi' && (
                            <AlertCircle className="w-3.5 h-3.5" />
                          )}
                          <span>{rep.status}</span>
                        </span>

                        <button
                          type="button"
                          onClick={() => setPrintPreviewReport(rep)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-extrabold cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Cetak Surat / PDF</span>
                        </button>

                        {waApplicantUrl && (
                          <a
                            href={waApplicantUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#075E54] text-xs font-bold"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>WA Pemohon</span>
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Bottom Action Bar */}
                    <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="text-slate-600">
                        <span className="font-semibold text-slate-800">
                          Unit: {rep.assignedTeam || item.processingUnit}
                        </span>{' '}
                        — {rep.responseNote}
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5">
                        {rep.status === 'Menunggu Verifikasi' && (
                          <button
                            type="button"
                            onClick={() => handleQuickAction(rep, 'verifikasi')}
                            className="px-2.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-bold cursor-pointer"
                          >
                            1. Verifikasi Berkas
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleQuickAction(rep, 'terbitkan_surat')}
                          className="px-2.5 py-1.5 rounded-lg bg-[#0D3868] hover:bg-[#0277BD] text-white font-bold cursor-pointer"
                        >
                          2. Terbitkan No. Surat
                        </button>
                        {rep.status !== 'Selesai' && (
                          <button
                            type="button"
                            onClick={() => handleQuickAction(rep, 'selesai')}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer"
                          >
                            3. Tandai Selesai
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleOpenEditSubmission(rep)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-[#0277BD]" />
                          <span>Edit Detail</span>
                        </button>
                        {confirmDeleteId === rep.id ? (
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={async () => {
                                await onDeleteReport(rep.id);
                                setConfirmDeleteId(null);
                                setFeedbackMsg(`Data pengajuan ${rep.ticketCode} berhasil dihapus.`);
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-red-600 text-white font-bold cursor-pointer"
                            >
                              Ya, Hapus
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              className="px-2 py-1.5 rounded-lg bg-slate-200 text-slate-700 font-semibold cursor-pointer"
                            >
                              Batal
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(rep.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-red-200 bg-red-50/60 hover:bg-red-100 text-red-700 font-semibold cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Hapus</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* =====================================================================================
          SUB-MODE 2: PENGATURAN BACK-END KATALOG & SOP 44 SUB-MENU WARGA
      ===================================================================================== */}
      {subMode === 'catalog_config' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base sm:text-lg font-extrabold text-[#0D3868]">
                  Konfigurasi Back-End Katalog 7 Bidang & {totalSubMenusCount} Sub-Menu Warga
                </h3>
                <p className="text-xs text-slate-600">
                  Ubah persyaratan dokumen, estimasi waktu pelayanan, unit pelaksana, kode surat,
                  atau tambahkan sub-menu layanan baru. Perubahan otomatis berlaku di halaman Menu
                  Warga.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleOpenAddCatalogSubItem}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1C8237] hover:bg-[#146329] text-white text-xs font-extrabold cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Tambah Sub-Menu di {currentConfigCategory.title}</span>
                </button>
                <button
                  type="button"
                  onClick={handleResetDefaultCatalog}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reset Standar</span>
                </button>
              </div>
            </div>

            {/* Category Selector Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {catalog.map((cat) => {
                const active = configCategoryId === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setConfigCategoryId(cat.id);
                      setEditingCatalogSubItem(null);
                      setIsAddingNewSubItem(false);
                    }}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap border transition-all cursor-pointer flex items-center gap-2 ${
                      active
                        ? 'bg-[#0D3868] text-white border-[#0D3868]'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    <span>
                      {cat.number}. {cat.title}
                    </span>
                    <span className="font-mono-num opacity-80">({cat.items.length})</span>
                  </button>
                );
              })}
            </div>

            {/* Form Edit / Add Sub-Menu in Catalog */}
            {(editingCatalogSubItem || isAddingNewSubItem) && (
              <form
                onSubmit={handleSaveCatalogSubItem}
                className="p-5 rounded-2xl bg-sky-50/70 border-2 border-[#0277BD] space-y-4"
              >
                <div className="flex items-center justify-between border-b border-sky-200 pb-2.5">
                  <div className="text-sm font-extrabold text-[#0D3868]">
                    {isAddingNewSubItem
                      ? `Tambah Sub-Menu Baru pada Kategori: ${currentConfigCategory.title}`
                      : `Edit Konfigurasi Sub-Menu: ${editingCatalogSubItem?.label}`}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingCatalogSubItem(null);
                      setIsAddingNewSubItem(false);
                    }}
                    className="text-slate-500 hover:text-slate-800 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nama Sub-Menu Layanan *
                    </label>
                    <input
                      type="text"
                      value={subItemLabelDraft}
                      onChange={(e) => setSubItemLabelDraft(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs sm:text-sm bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Kode Klasifikasi Dokumen / Surat *
                    </label>
                    <input
                      type="text"
                      value={subItemDocCodeDraft}
                      onChange={(e) => setSubItemDocCodeDraft(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs sm:text-sm font-mono-num bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Estimasi Waktu Penyelesaian *
                    </label>
                    <input
                      type="text"
                      value={subItemEstimationDraft}
                      onChange={(e) => setSubItemEstimationDraft(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs sm:text-sm bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Judul Resmi Kop Surat / Dokumen
                    </label>
                    <input
                      type="text"
                      value={subItemHeaderDraft}
                      onChange={(e) => setSubItemHeaderDraft(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs sm:text-sm bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Unit Pelaksana / Seksi Penanggung Jawab
                    </label>
                    <input
                      type="text"
                      value={subItemUnitDraft}
                      onChange={(e) => setSubItemUnitDraft(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs sm:text-sm bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Daftar Persyaratan Dokumen (1 baris = 1 syarat)
                    </label>
                    <textarea
                      rows={4}
                      value={subItemReqsDraft}
                      onChange={(e) => setSubItemReqsDraft(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Langkah SOP Pelayanan (1 baris = 1 langkah)
                    </label>
                    <textarea
                      rows={4}
                      value={subItemSopDraft}
                      onChange={(e) => setSubItemSopDraft(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs bg-white"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingCatalogSubItem(null);
                      setIsAddingNewSubItem(false);
                    }}
                    className="px-4 py-2 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-700 cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#0D3868] hover:bg-[#0277BD] text-white text-xs font-extrabold cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>Simpan ke Back-End Katalog</span>
                  </button>
                </div>
              </form>
            )}

            {/* Sub-Menu Cards in Selected Category */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentConfigCategory.items.map((sub, idx) => (
                <div
                  key={sub.id}
                  className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[11px] font-mono-num font-bold text-[#0277BD]">
                          #{idx + 1} · {sub.documentCode}
                        </span>
                        <h4 className="text-sm font-extrabold text-[#0D3868]">{sub.label}</h4>
                      </div>
                      <span className="text-[11px] font-semibold text-emerald-700">
                        {sub.estimation}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-600">
                      Unit Pelaksana: <strong>{sub.processingUnit}</strong>
                    </div>

                    <div className="text-xs text-slate-600">
                      <div className="font-bold text-slate-700 mb-1">Persyaratan:</div>
                      <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                        {sub.requirements.map((r, i) => (
                          <li key={i}>{r}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="pt-2.5 border-t border-slate-200/80 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSubMode('submissions');
                        handleOpenAddSubmission(currentConfigCategory.id, sub.id);
                      }}
                      className="text-xs font-bold text-[#1C8237] hover:underline cursor-pointer"
                    >
                      + Buat Surat Ini
                    </button>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenEditCatalogSubItem(sub)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-sky-50 text-xs font-bold text-[#0D3868] cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-[#0277BD]" />
                        <span>Edit SOP & Syarat</span>
                      </button>
                      {currentConfigCategory.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleDeleteCatalogSubItem(sub.id)}
                          className="p-1.5 rounded-lg border border-red-200 bg-red-50/70 hover:bg-red-100 text-red-700 cursor-pointer"
                          title="Hapus Sub-Menu"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================================
          MODAL CETAK SURAT RESMI / BUKTI PENGAJUAN KELURAHAN PANAIKANG
      ===================================================================================== */}
      {printPreviewReport && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/80 flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setPrintPreviewReport(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 border border-slate-200 shadow-2xl space-y-5 my-8"
            onClick={(e) => e.stopPropagation()}
          >
            {(() => {
              const info = inferReportServiceCategory(printPreviewReport, catalog);
              const regNumber =
                printPreviewReport.letterRegisterNumber ||
                generateAutoLetterNumber(info.documentCode);
              const signer =
                printPreviewReport.signedByOfficer ||
                `${profile.lurahName} (Lurah Panaikang)`;

              return (
                <>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                    <div>
                      <div className="text-xs font-extrabold uppercase tracking-wider text-[#0277BD]">
                        Dokumen Resmi Back-End Kelurahan Panaikang
                      </div>
                      <h3 className="text-base font-extrabold text-[#0D3868]">
                        {info.subItemLabel} — {printPreviewReport.ticketCode}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => window.print()}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0D3868] hover:bg-[#0277BD] text-white text-xs font-extrabold cursor-pointer"
                      >
                        <Printer className="w-4 h-4" />
                        <span>Cetak / Simpan PDF</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPrintPreviewReport(null)}
                        className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="p-6 rounded-xl border-2 border-slate-800 bg-white text-slate-900 space-y-4">
                    <div className="text-center border-b-2 border-slate-900 pb-3">
                      <div className="text-xs font-bold uppercase tracking-widest">
                        PEMERINTAH KOTA MAKASSAR · KECAMATAN PANAKKUKANG
                      </div>
                      <div className="text-lg font-extrabold uppercase tracking-wide">
                        KELURAHAN PANAIKANG
                      </div>
                      <div className="text-[11px] text-slate-600">
                        {profile.officeAddress} · Telp: {profile.phoneContact} · Kode Pos{' '}
                        {profile.postalCode}
                      </div>
                    </div>

                    <div className="text-center">
                      <div className="text-sm font-extrabold underline uppercase">
                        {info.officialHeaderTitle}
                      </div>
                      <div className="text-xs font-mono-num font-bold text-slate-700 mt-0.5">
                        Nomor: {regNumber}
                      </div>
                    </div>

                    <p className="text-xs leading-relaxed text-slate-800">
                      Yang bertanda tangan di bawah ini, Pemerintah Kelurahan Panaikang Kecamatan
                      Panakkukang Kota Makassar, menerangkan dan mencatat pengajuan layanan warga
                      sebagai berikut:
                    </p>

                    <div className="text-xs space-y-2 pl-2">
                      <div className="grid grid-cols-3 gap-2">
                        <span className="text-slate-600">Nomor Tiket Sistem</span>
                        <span className="col-span-2 font-mono-num font-bold">
                          : {printPreviewReport.ticketCode}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <span className="text-slate-600">Nama Lengkap Warga</span>
                        <span className="col-span-2 font-bold">
                          : {printPreviewReport.reporterName}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <span className="text-slate-600">NIK / Nomor KK</span>
                        <span className="col-span-2 font-mono-num">
                          : {printPreviewReport.applicantNik || '-'}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <span className="text-slate-600">Alamat / Wilayah RT-RW</span>
                        <span className="col-span-2">
                          : {printPreviewReport.locationName} ({printPreviewReport.rt} /{' '}
                          {printPreviewReport.rw})
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <span className="text-slate-600">Bidang & Jenis Layanan</span>
                        <span className="col-span-2 font-bold">
                          : {info.categoryTitle} — {info.subItemLabel}
                        </span>
                      </div>
                      {printPreviewReport.specificFieldsData &&
                        Object.entries(printPreviewReport.specificFieldsData).map(([k, v]) =>
                          v ? (
                            <div key={k} className="grid grid-cols-3 gap-2">
                              <span className="text-slate-600">{k}</span>
                              <span className="col-span-2 font-semibold">: {v}</span>
                            </div>
                          ) : null
                        )}
                      <div className="grid grid-cols-3 gap-2">
                        <span className="text-slate-600">Keterangan / Keperluan</span>
                        <span className="col-span-2">: {printPreviewReport.description}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <span className="text-slate-600">Catatan Verifikasi Petugas</span>
                        <span className="col-span-2 font-medium text-emerald-900">
                          : {printPreviewReport.responseNote}
                        </span>
                      </div>
                    </div>

                    <div className="pt-6 flex justify-between items-end text-xs border-t border-slate-200">
                      <div className="text-[11px] text-slate-600 space-y-0.5">
                        <div>Unit Pelaksana: {info.processingUnit}</div>
                        <div>Status: {printPreviewReport.status}</div>
                      </div>
                      <div className="text-right">
                        <div>Makassar, {new Date().toLocaleDateString('id-ID')}</div>
                        <div className="text-[11px] text-slate-600 mb-10">
                          Pejabat Penandatangan,
                        </div>
                        <div className="font-extrabold underline text-slate-900">{signer}</div>
                        <div className="text-[11px] font-mono-num text-slate-600">
                          NIP. {profile.lurahNip}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};
