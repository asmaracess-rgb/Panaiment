import React, { useState } from 'react';
import {
  X,
  FileText,
  AlertCircle,
  CheckCircle2,
  Clock,
  UserCheck,
  Phone,
  MapPin,
  Calendar,
  ShieldCheck,
  Printer,
  Download,
  ExternalLink,
  MessageCircle,
  ZoomIn,
  Check,
  RotateCcw,
  XCircle,
  Edit3,
  Image as ImageIcon,
  Layers,
  Info,
} from 'lucide-react';
import {
  CitizenReport,
  PraRegistrasiRecord,
  PengaduanOnlineRecord,
  KelurahanProfile,
  AuthenticatedUserProfile,
  UploadedDocFile,
} from '../types';
import { INITIAL_KELURAHAN_PROFILE } from '../data/initialData';
import { resolveImageUrl } from '../utils/resolveImageUrl';
import {
  buildWhatsAppUrl,
  isValidWhatsAppPhone,
  formatDisplayPhone,
  resolveCitizenWhatsAppPhone,
} from '../utils/whatsappHelper';
import { downloadOfficialLetterOrReceiptPdf } from '../utils/officialLetterPdfGenerator';
import { getRealtimeDateTimeString } from '../utils/realtimeDate';

export type DecisionPopupActionType = 'SETUJUI' | 'KEMBALIKAN' | 'TOLAK' | 'GUIDE';

export interface DecisionPopupData {
  action: DecisionPopupActionType;
  ticketCode: string;
  serviceName: string;
  applicantName: string;
  applicantNik?: string;
  rw?: string;
  rt?: string;
  phone?: string;
  note: string;
  decidedAt: string;
}

export interface DecisionInfoPopupModalProps {
  data: DecisionPopupData | null;
  onClose: () => void;
}

export const DecisionInfoPopupModal: React.FC<DecisionInfoPopupModalProps> = ({
  data,
  onClose,
}) => {
  if (!data) return null;

  const isApprove = data.action === 'SETUJUI';
  const isReturn = data.action === 'KEMBALIKAN';
  const isReject = data.action === 'TOLAK';
  const isGuide = data.action === 'GUIDE';

  const headerBg = isApprove
    ? 'bg-gradient-to-r from-emerald-800 via-emerald-700 to-emerald-600'
    : isReturn
    ? 'bg-gradient-to-r from-amber-700 via-amber-600 to-amber-500'
    : isReject
    ? 'bg-gradient-to-r from-rose-800 via-rose-700 to-rose-600'
    : 'bg-gradient-to-r from-[#072647] via-[#0D3868] to-[#0277BD]';

  const badgeText = isApprove
    ? 'STATUS KEPUTUSAN: BERKAS DISETUJUI'
    : isReturn
    ? 'STATUS KEPUTUSAN: BERKAS DIKEMBALIKAN'
    : isReject
    ? 'STATUS KEPUTUSAN: BERKAS DITOLAK'
    : 'PANDUAN INFORMASI STATUS KEPUTUSAN BERKAS';

  const mainTitle = isApprove
    ? 'Informasi Berkas Disetujui'
    : isReturn
    ? 'Informasi Berkas Dikembalikan (Perlu Perbaikan)'
    : isReject
    ? 'Informasi Berkas Ditolak'
    : 'Informasi Status Berkas: Disetujui, Dikembalikan & Ditolak';

  const hasValidWa = isValidWhatsAppPhone(data.phone || '');

  const waMessage = isApprove
    ? `Halo Bapak/Ibu *${data.applicantName}*, salam dari Pemerintah Kelurahan Panaikang.\n\n*INFORMASI BERKAS DISETUJUI*\nNomor Tiket: *${data.ticketCode}*\nLayanan: *${data.serviceName}*\nStatus: *BERKAS DISETUJUI*\nCatatan: ${data.note}\n\nBerkas permohonan Anda telah disetujui. Silakan mengambil atau mengunduh dokumen surat resmi Anda. Terima kasih.`
    : isReturn
    ? `Halo Bapak/Ibu *${data.applicantName}*, salam dari Pemerintah Kelurahan Panaikang.\n\n*INFORMASI BERKAS DIKEMBALIKAN (PERLU PERBAIKAN)*\nNomor Tiket: *${data.ticketCode}*\nLayanan: *${data.serviceName}*\nStatus: *DIKEMBALIKAN UNTUK PERBAIKAN*\nCatatan Perbaikan: ${data.note}\n\nMohon melengkapi/memperbaiki berkas persyaratan sesuai catatan di atas. Terima kasih.`
    : `Halo Bapak/Ibu *${data.applicantName}*, salam dari Pemerintah Kelurahan Panaikang.\n\n*INFORMASI BERKAS DITOLAK*\nNomor Tiket: *${data.ticketCode}*\nLayanan: *${data.serviceName}*\nStatus: *PERMOHONAN DITOLAK*\nAlasan Penolakan: ${data.note}\n\nTerima kasih atas pengertian Anda.`;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto animate-fadeIn"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-200 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className={`${headerBg} px-5 sm:px-6 py-5 text-white flex items-start justify-between gap-4`}>
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center shrink-0 shadow-xs">
              {isApprove && <CheckCircle2 className="w-7 h-7 text-white" />}
              {isReturn && <RotateCcw className="w-7 h-7 text-white" />}
              {isReject && <XCircle className="w-7 h-7 text-white" />}
              {isGuide && <Info className="w-7 h-7 text-amber-300" />}
            </div>
            <div>
              <span className="inline-block px-2.5 py-0.5 rounded-md bg-black/25 text-white text-[10px] font-black uppercase tracking-wider">
                {badgeText}
              </span>
              <h3 className="text-lg sm:text-xl font-black text-white mt-1">
                {mainTitle}
              </h3>
              <p className="text-xs text-white/90 mt-0.5">
                Tiket #{data.ticketCode} · {data.serviceName}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Popup Body */}
        <div className="p-5 sm:p-6 space-y-4 max-h-[78vh] overflow-y-auto bg-slate-50/50">
          {/* Active Decision Detail Banner (When Setujui / Kembalikan / Tolak is clicked) */}
          {!isGuide && (
            <div
              className={`p-4 rounded-2xl border-2 space-y-2.5 ${
                isApprove
                  ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950'
                  : isReturn
                  ? 'bg-amber-50/90 border-amber-300 text-amber-950'
                  : 'bg-rose-50/90 border-rose-300 text-rose-950'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-black/10">
                <div className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                  {isApprove && <CheckCircle2 className="w-4 h-4 text-emerald-700" />}
                  {isReturn && <RotateCcw className="w-4 h-4 text-amber-700" />}
                  {isReject && <XCircle className="w-4 h-4 text-rose-700" />}
                  <span>
                    {isApprove
                      ? 'Keputusan Berhasil Disimpan: Berkas Disetujui'
                      : isReturn
                      ? 'Keputusan Berhasil Disimpan: Berkas Dikembalikan'
                      : 'Keputusan Berhasil Disimpan: Berkas Ditolak'}
                  </span>
                </div>
                <span className="text-[11px] font-mono font-bold opacity-80">
                  {data.decidedAt}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="opacity-75">Nama Pemohon:</span>{' '}
                  <strong>{data.applicantName}</strong>
                  {data.rw ? ` (${data.rw}/${data.rt || 'RT 01'})` : ''}
                </div>
                {data.applicantNik && (
                  <div>
                    <span className="opacity-75">NIK Pemohon:</span>{' '}
                    <strong className="font-mono">{data.applicantNik}</strong>
                  </div>
                )}
              </div>

              <div className="p-3 rounded-xl bg-white/90 border border-black/10 text-xs space-y-1">
                <div className="font-bold text-slate-700">
                  {isApprove
                    ? 'Catatan Persetujuan Berkas:'
                    : isReturn
                    ? 'Catatan & Instruksi Perbaikan Berkas:'
                    : 'Alasan Penolakan Berkas:'}
                </div>
                <div className="font-semibold text-slate-900 leading-relaxed">
                  {data.note}
                </div>
              </div>
            </div>
          )}

          {/* Complete Information Cards About the 3 Statuses: Disetujui, Dikembalikan, Ditolak */}
          <div className="space-y-3">
            <div className="text-xs font-black uppercase tracking-wider text-[#0D3868] flex items-center gap-1.5">
              <Info className="w-4 h-4 text-[#0277BD]" />
              <span>Penjelasan Lengkap Status Berkas (Disetujui, Dikembalikan & Ditolak)</span>
            </div>

            {/* 1. Informasi Berkas Disetujui */}
            <div
              className={`p-4 rounded-2xl border transition-all ${
                isApprove
                  ? 'bg-emerald-50 border-2 border-emerald-500 shadow-sm ring-2 ring-emerald-200'
                  : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5 font-bold">
                  <Check className="w-5 h-5" />
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    <h4 className="font-black text-emerald-900 text-sm">
                      1. Berkas Disetujui (Setujui Permohonan)
                    </h4>
                    {isApprove && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-black uppercase">
                        Status Aktif Saat Ini
                      </span>
                    )}
                  </div>
                  <p className="text-slate-700 leading-relaxed">
                    <strong>Arti Status:</strong> Seluruh dokumen persyaratan dan data formulir pemohon telah diperiksa, dinyatakan <strong>lengkap, sah, dan disetujui</strong> oleh Lurah / Pejabat Berwenang Kelurahan Panaikang.
                  </p>
                  <p className="text-slate-600 leading-relaxed">
                    <strong>Tindak Lanjut:</strong> Berkas diteruskan ke loket untuk penerbitan <strong>Nomor Registrasi Surat Resmi</strong>. Warga dapat langsung mengambil fisik surat atau mengunduh PDF surat resmi ber-QR Code.
                  </p>
                </div>
              </div>
            </div>

            {/* 2. Informasi Berkas Dikembalikan */}
            <div
              className={`p-4 rounded-2xl border transition-all ${
                isReturn
                  ? 'bg-amber-50 border-2 border-amber-500 shadow-sm ring-2 ring-amber-200'
                  : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5 font-bold">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    <h4 className="font-black text-amber-900 text-sm">
                      2. Berkas Dikembalikan (Kembalikan untuk Perbaikan)
                    </h4>
                    {isReturn && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black uppercase">
                        Status Aktif Saat Ini
                      </span>
                    )}
                  </div>
                  <p className="text-slate-700 leading-relaxed">
                    <strong>Arti Status:</strong> Berkas permohonan <strong>dikembalikan sementara kepada warga</strong> karena masih ada dokumen persyaratan yang belum lengkap, foto dokumen buram/tidak terbaca, atau data isian yang perlu diperbaiki.
                  </p>
                  <p className="text-slate-600 leading-relaxed">
                    <strong>Tindak Lanjut:</strong> Permohonan <strong>tidak ditolak permanen</strong>. Warga akan melihat catatan perbaikan dari kelurahan dan dapat melengkapi kekurangan berkas untuk diverifikasi kembali.
                  </p>
                </div>
              </div>
            </div>

            {/* 3. Informasi Berkas Ditolak */}
            <div
              className={`p-4 rounded-2xl border transition-all ${
                isReject
                  ? 'bg-rose-50 border-2 border-rose-500 shadow-sm ring-2 ring-rose-200'
                  : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 mt-0.5 font-bold">
                  <XCircle className="w-5 h-5" />
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    <h4 className="font-black text-rose-900 text-sm">
                      3. Berkas Ditolak (Tolak Permohonan)
                    </h4>
                    {isReject && (
                      <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-black uppercase">
                        Status Aktif Saat Ini
                      </span>
                    )}
                  </div>
                  <p className="text-slate-700 leading-relaxed">
                    <strong>Arti Status:</strong> Permohonan berkas warga <strong>ditolak secara resmi</strong> karena tidak memenuhi syarat administratif, bukan warga/domisili Kelurahan Panaikang, atau bertentangan dengan ketentuan yang berlaku.
                  </p>
                  <p className="text-slate-600 leading-relaxed">
                    <strong>Tindak Lanjut:</strong> Status tiket pengajuan berubah menjadi <strong>Ditolak / Ditutup</strong> disertai alasan penolakan yang tercatat pada riwayat pemohon dan audit sistem.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Popup Footer */}
        <div className="px-5 sm:px-6 py-4 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
          {!isGuide && hasValidWa && data.phone ? (
            <a
              href={buildWhatsAppUrl(data.phone, waMessage)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#128C7E] hover:bg-[#075E54] text-white text-xs font-bold transition shadow-xs"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Kirim Info Status via WhatsApp ke Pemohon</span>
            </a>
          ) : (
            <span className="text-[11px] text-slate-500">
              Status berkas tersimpan otomatis ke database Cloud Firestore.
            </span>
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#0D3868] hover:bg-[#072647] text-white text-xs font-black transition cursor-pointer ml-auto shadow-xs"
          >
            Mengerti & Tutup Popup
          </button>
        </div>
      </div>
    </div>
  );
};

export interface SubmissionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  report?: CitizenReport | null;
  praRecord?: PraRegistrasiRecord | null;
  pengaduanRecord?: PengaduanOnlineRecord | null;
  profile?: KelurahanProfile;
  citizenUsers?: AuthenticatedUserProfile[];
  isLurahMode?: boolean;
  onLurahApproveService?: (
    ticketCode: string,
    action: 'SETUJUI' | 'TOLAK' | 'KEMBALIKAN',
    lurahNote: string
  ) => Promise<void>;
  onQuickVerify?: (report: CitizenReport) => void;
  onQuickIssueLetter?: (report: CitizenReport) => void;
  onQuickComplete?: (report: CitizenReport) => void;
  onOpenEdit?: (report: CitizenReport) => void;
  onOpenPrint?: (report: CitizenReport) => void;
}

function formatFieldLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim();
}

function isImageSource(url?: string, fileName?: string): boolean {
  if (!url) return false;
  const lowerUrl = url.toLowerCase();
  const lowerName = (fileName || '').toLowerCase();
  if (lowerUrl.startsWith('data:image/')) return true;
  if (lowerUrl.startsWith('blob:')) return true;
  if (
    lowerUrl.endsWith('.jpg') ||
    lowerUrl.endsWith('.jpeg') ||
    lowerUrl.endsWith('.png') ||
    lowerUrl.endsWith('.webp') ||
    lowerUrl.endsWith('.gif') ||
    lowerName.endsWith('.jpg') ||
    lowerName.endsWith('.jpeg') ||
    lowerName.endsWith('.png') ||
    lowerName.endsWith('.webp')
  ) {
    return true;
  }
  if (
    lowerUrl.includes('unsplash.com') ||
    lowerUrl.includes('/images/') ||
    lowerUrl.includes('googleusercontent')
  ) {
    return true;
  }
  return false;
}

export const SubmissionDetailModal: React.FC<SubmissionDetailModalProps> = ({
  isOpen,
  onClose,
  report,
  praRecord,
  pengaduanRecord,
  profile = INITIAL_KELURAHAN_PROFILE,
  citizenUsers = [],
  onLurahApproveService,
  onQuickVerify,
  onQuickIssueLetter,
  onQuickComplete,
  onOpenEdit,
  onOpenPrint,
}) => {
  const [zoomedImage, setZoomedImage] = useState<{ url: string; caption: string } | null>(null);
  const [lurahNoteInput, setLurahNoteInput] = useState<string>(
    praRecord?.lurahNotes || report?.responseNote || ''
  );
  const [isProcessingApproval, setIsProcessingApproval] = useState<boolean>(false);
  const [actionFeedback, setActionFeedback] = useState<string>('');
  const [decisionPopupData, setDecisionPopupData] = useState<DecisionPopupData | null>(null);

  React.useEffect(() => {
    setLurahNoteInput(praRecord?.lurahNotes || report?.responseNote || '');
    setActionFeedback('');
    setDecisionPopupData(null);
  }, [praRecord?.ticketCode, pengaduanRecord?.ticketCode, report?.id, isOpen]);

  if (!isOpen || (!report && !praRecord && !pengaduanRecord)) {
    return null;
  }

  // Determine whether this is a Surat / Pra-Registrasi or Pengaduan / Laporan
  const ticketCode =
    praRecord?.ticketCode || pengaduanRecord?.ticketCode || report?.ticketCode || '-';

  const isSurat = Boolean(
    praRecord ||
      ticketCode.startsWith('REG-') ||
      ticketCode.startsWith('SRT-') ||
      (report?.documentCode && report.documentCode.startsWith('PM-')) ||
      report?.serviceCategoryId === 'surat_keterangan' ||
      report?.serviceCategoryId === 'administrasi_kependudukan' ||
      report?.category === 'Surat Keterangan'
  );

  const title =
    praRecord?.serviceName ||
    pengaduanRecord?.title ||
    report?.title ||
    (isSurat ? 'Permohonan Surat Administrasi' : 'Pengaduan Warga');

  const categoryOrCode =
    (praRecord?.serviceCode ? `${praRecord.serviceCode} · ${praRecord.serviceName}` : '') ||
    pengaduanRecord?.category ||
    report?.serviceSubItemLabel ||
    report?.category ||
    '-';

  const statusLabel =
    praRecord?.status?.replace(/_/g, ' ') ||
    pengaduanRecord?.status?.replace(/_/g, ' ') ||
    report?.status ||
    'Menunggu Verifikasi';

  const submittedAt =
    praRecord?.submittedAt ||
    pengaduanRecord?.submittedAt ||
    report?.createdAt ||
    '-';

  const incidentDate = pengaduanRecord?.incidentDate || '';

  const applicantName =
    praRecord?.applicantName ||
    (pengaduanRecord?.isAnonymous
      ? `${pengaduanRecord.reporterName || 'Warga'} (Mode Anonim)`
      : pengaduanRecord?.reporterName) ||
    report?.reporterName ||
    'Warga Kelurahan Panaikang';

  const applicantNik = praRecord?.applicantNik || report?.applicantNik || '';

  const rawPhone =
    praRecord?.applicantPhone ||
    pengaduanRecord?.reporterPhone ||
    report?.reporterPhone ||
    '';

  const resolvedPhone = resolveCitizenWhatsAppPhone({
    rawPhone,
    citizenName: applicantName,
    ownerId: report?.ownerId || praRecord?.applicantUid || pengaduanRecord?.reporterUid,
    ownerEmail: report?.ownerEmail || praRecord?.applicantEmail,
    nik: applicantNik,
    citizenUsers,
  });

  const hasValidWa = isValidWhatsAppPhone(resolvedPhone);

  const rw =
    praRecord?.applicantRw ||
    pengaduanRecord?.reporterRw ||
    report?.rw ||
    'RW 01';

  const rt =
    praRecord?.applicantRt ||
    pengaduanRecord?.reporterRt ||
    report?.rt ||
    'RT 01';

  const addressOrLocation =
    praRecord?.applicantAddress ||
    pengaduanRecord?.locationAddress ||
    report?.citizenAddress ||
    report?.locationName ||
    'Kelurahan Panaikang';

  const descriptionOrContent =
    pengaduanRecord?.content ||
    report?.description ||
    (praRecord?.formData?.keperluan
      ? String(praRecord.formData.keperluan)
      : `Permohonan pengurusan ${title}`);

  const letterRegisterNumber =
    praRecord?.letterRegisterNumber || report?.letterRegisterNumber || '';

  const assignedUnitOrOfficer =
    praRecord?.assignedOfficerName ||
    pengaduanRecord?.assignedOfficer ||
    pengaduanRecord?.assignedUnit ||
    report?.verifiedBy ||
    report?.assignedTeam ||
    (isSurat ? 'Loket Pelayanan Kelurahan Panaikang' : 'Tim Respon & Satgas Kelurahan Panaikang');

  const officerNotes =
    praRecord?.officerNotes ||
    pengaduanRecord?.followUpNotes ||
    report?.responseNote ||
    '';

  const lurahNotes = praRecord?.lurahNotes || '';

  const isPriority = Boolean(
    pengaduanRecord?.isPriority ||
      report?.urgency === 'Darurat' ||
      report?.urgency === 'Tinggi'
  );

  // Collect all citizen complaint proof photos (without duplicates)
  const citizenComplaintPhotos: string[] = [];
  if (Array.isArray(pengaduanRecord?.proofPhotos)) {
    for (const p of pengaduanRecord.proofPhotos) {
      if (p && p.trim() && !citizenComplaintPhotos.includes(p.trim())) {
        citizenComplaintPhotos.push(p.trim());
      }
    }
  }
  if (report?.imageUrl && report.imageUrl.trim()) {
    const img = report.imageUrl.trim();
    if (!citizenComplaintPhotos.includes(img)) {
      citizenComplaintPhotos.push(img);
    }
  }

  // Collect all officer follow-up / completion photos
  const officerFollowUpPhotos: string[] = [];
  if (report?.completionPhotoUrl && report.completionPhotoUrl.trim()) {
    officerFollowUpPhotos.push(report.completionPhotoUrl.trim());
  }
  if (Array.isArray(report?.followUpPhotos)) {
    for (const p of report.followUpPhotos) {
      if (p && p.trim() && !officerFollowUpPhotos.includes(p.trim())) {
        officerFollowUpPhotos.push(p.trim());
      }
    }
  }
  if (Array.isArray(pengaduanRecord?.followUpPhotos)) {
    for (const p of pengaduanRecord.followUpPhotos) {
      if (p && p.trim() && !officerFollowUpPhotos.includes(p.trim())) {
        officerFollowUpPhotos.push(p.trim());
      }
    }
  }

  // Collect uploaded documents for Surat / Pra-Registrasi
  const uploadedDocs: UploadedDocFile[] = Array.isArray(praRecord?.uploadedDocs)
    ? praRecord.uploadedDocs
    : [];

  // Collect dynamic form fields
  const dynamicFormEntries: Array<[string, string]> = [];
  if (praRecord?.formData && typeof praRecord.formData === 'object') {
    for (const [k, v] of Object.entries(praRecord.formData)) {
      if (v !== undefined && v !== null && String(v).trim() !== '') {
        dynamicFormEntries.push([formatFieldLabel(k), String(v)]);
      }
    }
  }
  if (report?.specificFieldsData && typeof report.specificFieldsData === 'object') {
    for (const [k, v] of Object.entries(report.specificFieldsData)) {
      if (v !== undefined && v !== null && String(v).trim() !== '') {
        const label = formatFieldLabel(k);
        if (
          !dynamicFormEntries.some(
            ([existingKey]) => existingKey.toLowerCase() === label.toLowerCase()
          )
        ) {
          dynamicFormEntries.push([label, String(v)]);
        }
      }
    }
  }

  const handleDecisionClick = async (action: 'SETUJUI' | 'KEMBALIKAN' | 'TOLAK') => {
    const defaultNote =
      action === 'SETUJUI'
        ? 'Berkas persyaratan telah lengkap, sesuai, dan disetujui oleh Kelurahan Panaikang.'
        : action === 'KEMBALIKAN'
        ? 'Mohon lengkapi atau perbaiki berkas persyaratan sesuai ketentuan kelurahan.'
        : 'Permohonan ditolak karena belum memenuhi persyaratan administrasi kelurahan.';

    const finalNote = lurahNoteInput.trim() || defaultNote;
    setIsProcessingApproval(true);
    try {
      if (onLurahApproveService) {
        await onLurahApproveService(ticketCode, action, finalNote);
      } else if (report) {
        if (action === 'SETUJUI' && onQuickVerify) {
          onQuickVerify(report);
        } else if (action === 'TOLAK' && onQuickComplete) {
          onQuickComplete(report);
        }
      }
      setActionFeedback(
        action === 'SETUJUI'
          ? `Berkas permohonan ${ticketCode} berhasil DISETUJUI.`
          : action === 'KEMBALIKAN'
          ? `Berkas permohonan ${ticketCode} DIKEMBALIKAN untuk perbaikan.`
          : `Berkas permohonan ${ticketCode} telah DITOLAK.`
      );
      setDecisionPopupData({
        action,
        ticketCode,
        serviceName: title,
        applicantName,
        applicantNik,
        rw,
        rt,
        phone: resolvedPhone || rawPhone,
        note: finalNote,
        decidedAt: getRealtimeDateTimeString(),
      });
    } finally {
      setIsProcessingApproval(false);
    }
  };

  const handleDownloadPdfSummary = () => {
    downloadOfficialLetterOrReceiptPdf(
      {
        ticketCode,
        isSurat:
          isSurat &&
          (statusLabel.includes('SELESAI') ||
            statusLabel.includes('Selesai') ||
            statusLabel.includes('DISETUJUI') ||
            Boolean(letterRegisterNumber)),
        documentTitle: isSurat
          ? `SURAT KETERANGAN / PENGANTAR (${title.toUpperCase()})`
          : 'TANDA TERIMA LAPORAN & PENGADUAN WARGA',
        registerNumber: letterRegisterNumber || praRecord?.serviceCode || ticketCode,
        applicantName,
        applicantNik,
        applicantPhone: resolvedPhone || rawPhone,
        rw,
        rt,
        address: addressOrLocation,
        serviceOrCategoryName: title,
        descriptionOrPurpose: descriptionOrContent,
        statusText: statusLabel,
        assignedUnit: assignedUnitOrOfficer,
        officerNotes:
          lurahNotes || officerNotes || 'Telah tercatat dalam sistem Kelurahan Panaikang.',
        submittedAt,
        signerName: report?.signedByOfficer || profile.lurahName,
        signerNip: profile.lurahNip,
      },
      profile
    );
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto"
        role="dialog"
        aria-modal="true"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200 animate-fadeIn my-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ================= HEADER MODAL ================= */}
          <div
            className={`px-5 sm:px-6 py-4 text-white flex items-start sm:items-center justify-between gap-4 ${
              isSurat
                ? 'bg-gradient-to-r from-[#072647] via-[#0D3868] to-[#0277BD]'
                : 'bg-gradient-to-r from-[#0D3868] via-[#146329] to-[#1C8237]'
            }`}
          >
            <div className="space-y-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md bg-white/20 text-white text-[10px] font-black uppercase tracking-wider">
                  {isSurat
                    ? 'DETAIL PERMOHONAN SURAT / PRA REGISTRASI'
                    : 'DETAIL PENGADUAN & LAPORAN WARGA'}
                </span>
                <span className="font-mono text-xs font-black bg-amber-400 text-slate-950 px-2.5 py-0.5 rounded-md">
                  #{ticketCode}
                </span>
                {isPriority && (
                  <span className="px-2 py-0.5 rounded-md bg-rose-600 text-white text-[10px] font-black uppercase">
                    Prioritas / Mendesak
                  </span>
                )}
              </div>
              <h3 className="text-base sm:text-xl font-black text-white truncate">{title}</h3>
              <div className="flex flex-wrap items-center gap-3 text-xs text-sky-100">
                <span className="inline-flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Diajukan: {submittedAt}</span>
                </span>
                {incidentDate && (
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Tgl Kejadian: {incidentDate}</span>
                  </span>
                )}
                <span>·</span>
                <span className="font-bold text-amber-200">Status: {statusLabel}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition cursor-pointer shrink-0"
              title="Tutup Detail"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* ================= BODY MODAL (SCROLLABLE) ================= */}
          <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1 bg-slate-50/60">
            {actionFeedback && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{actionFeedback}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setActionFeedback('')}
                  className="text-emerald-700 hover:text-emerald-950 font-black cursor-pointer"
                >
                  ✕
                </button>
              </div>
            )}

            {/* 1. IDENTITAS PEMOHON / PELAPOR & INFORMASI LAYANAN */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Card A: Data Pemohon / Pelapor */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-2.5 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="font-black text-[#0D3868] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-[#0277BD]" />
                    <span>{isSurat ? 'Identitas Pemohon Surat' : 'Identitas Warga Pelapor'}</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-sky-50 text-[#0D3868] font-mono font-bold text-[11px] border border-sky-200">
                    {rw} / {rt}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between gap-2">
                    <span className="text-slate-500">Nama Lengkap:</span>
                    <strong className="text-slate-900 text-right">{applicantName}</strong>
                  </div>
                  {applicantNik && (
                    <div className="flex justify-between gap-2">
                      <span className="text-slate-500">NIK (16 Digit):</span>
                      <strong className="font-mono text-slate-900">{applicantNik}</strong>
                    </div>
                  )}
                  <div className="flex justify-between gap-2">
                    <span className="text-slate-500">Wilayah RT / RW:</span>
                    <strong className="text-slate-900">
                      {rt} · {rw}
                    </strong>
                  </div>
                  <div className="pt-1 border-t border-slate-100">
                    <span className="text-slate-500 block mb-0.5">
                      {isSurat ? 'Alamat Domisili Pemohon:' : 'Lokasi Kejadian / Alamat:'}
                    </span>
                    <div className="font-semibold text-slate-800 flex items-start gap-1">
                      <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
                      <span>{addressOrLocation}</span>
                    </div>
                  </div>
                </div>

                {/* WhatsApp Contact Bar */}
                <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 font-mono text-slate-700">
                    <Phone className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    <span className="font-bold">
                      {hasValidWa
                        ? formatDisplayPhone(resolvedPhone)
                        : rawPhone || 'No. WA belum dicantumkan'}
                    </span>
                  </div>
                  {hasValidWa && (
                    <a
                      href={buildWhatsAppUrl(
                        resolvedPhone,
                        `Halo Bapak/Ibu ${applicantName}, salam dari Pemerintah Kelurahan Panaikang.\n\nMengenai ${
                          isSurat ? 'permohonan surat' : 'laporan pengaduan'
                        } Anda dengan Nomor Tiket *${ticketCode}* (${title}):\nStatus saat ini: *${statusLabel}*.\n${
                          officerNotes ? `Catatan: ${officerNotes}\n` : ''
                        }\nTerima kasih.`
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#128C7E] hover:bg-[#075E54] text-white font-bold text-[11px] transition shadow-2xs shrink-0"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Hubungi WA Warga</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Card B: Status & Verifikasi Petugas */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-2.5 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="font-black text-[#0D3868] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Status Pelayanan & Verifikasi</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 font-bold text-[11px] border border-emerald-200">
                    {statusLabel}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between gap-2">
                    <span className="text-slate-500">Kategori / Layanan:</span>
                    <strong className="text-slate-900 text-right">{categoryOrCode}</strong>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-slate-500">Unit / Petugas Pelaksana:</span>
                    <strong className="text-slate-900 text-right">{assignedUnitOrOfficer}</strong>
                  </div>
                  {letterRegisterNumber && (
                    <div className="flex justify-between gap-2">
                      <span className="text-slate-500">No. Registrasi Surat:</span>
                      <strong className="font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {letterRegisterNumber}
                      </strong>
                    </div>
                  )}
                  {isSurat && (
                    <div className="flex justify-between gap-2">
                      <span className="text-slate-500">Verifikasi Berkas Fisik:</span>
                      <strong
                        className={
                          praRecord?.physicalDocsChecked || report?.status === 'Selesai'
                            ? 'text-emerald-700'
                            : 'text-amber-700'
                        }
                      >
                        {praRecord?.physicalDocsChecked || report?.status === 'Selesai'
                          ? '✓ Dokumen Fisik Asli Telah Diperiksa'
                          : '⏳ Menunggu Pemeriksaan Fisik di Loket'}
                      </strong>
                    </div>
                  )}
                  {praRecord?.scheduledArrivalDate && (
                    <div className="flex justify-between gap-2">
                      <span className="text-slate-500">Rencana Kedatangan:</span>
                      <strong className="text-slate-900">{praRecord.scheduledArrivalDate}</strong>
                    </div>
                  )}
                </div>

                {officerNotes && (
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700">
                    <span className="font-bold text-slate-900 block mb-0.5">
                      Catatan Petugas / Respon Tindak Lanjut:
                    </span>
                    <p className="leading-relaxed">{officerNotes}</p>
                  </div>
                )}

                {lurahNotes && (
                  <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-950">
                    <span className="font-bold block mb-0.5">Arahan / Catatan Lurah:</span>
                    <p className="leading-relaxed">{lurahNotes}</p>
                  </div>
                )}
              </div>
            </div>

            {/* 2. URAIAN KEPERLUAN SURAT / ISI LENGKAP PENGADUAN & DATA FORMULIR */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs space-y-4">
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-[#0D3868] flex items-center gap-1.5 mb-2">
                  <FileText className="w-4 h-4 text-[#0277BD]" />
                  <span>
                    {isSurat
                      ? 'Rincian Keperluan & Keterangan Permohonan Surat'
                      : 'Uraian Lengkap Laporan / Pengaduan Warga'}
                  </span>
                </h4>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-line">
                  {descriptionOrContent}
                </div>
              </div>

              {/* Dynamic Form Fields Table if available */}
              {dynamicFormEntries.length > 0 && (
                <div className="pt-3 border-t border-slate-100">
                  <h5 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5 mb-2.5">
                    <Layers className="w-3.5 h-3.5 text-[#0277BD]" />
                    <span>Data Isian Formulir Permohonan ({dynamicFormEntries.length} Kolom)</span>
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {dynamicFormEntries.map(([label, val], idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex flex-col justify-between"
                      >
                        <span className="text-[11px] font-semibold text-slate-500">{label}</span>
                        <span className="font-bold text-slate-900 mt-0.5 break-words">{val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 3. LAMPIRAN FOTO BUKTI PENGADUAN WARGA (KHUSUS ADUAN ATAU JIKA ADA FOTO) */}
            {(!isSurat || citizenComplaintPhotos.length > 0) && (
              <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs font-black uppercase tracking-wider text-[#0D3868] flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-amber-600" />
                    <span>
                      Foto Bukti yang Dilampirkan Warga Saat Pengaduan ({citizenComplaintPhotos.length} Foto)
                    </span>
                  </h4>
                  {citizenComplaintPhotos.length > 0 && (
                    <span className="text-[11px] font-semibold text-slate-500">
                      Klik foto untuk memperbesar layar penuh
                    </span>
                  )}
                </div>

                {citizenComplaintPhotos.length === 0 ? (
                  <div className="p-6 rounded-xl bg-slate-50 border border-dashed border-slate-300 text-center text-xs text-slate-500">
                    Warga tidak melampirkan foto bukti pada laporan pengaduan ini.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {citizenComplaintPhotos.map((photoUrl, idx) => {
                      const resolvedUrl = resolveImageUrl(photoUrl);
                      return (
                        <div
                          key={idx}
                          onClick={() =>
                            setZoomedImage({
                              url: resolvedUrl,
                              caption: `Foto Bukti Pengaduan #${idx + 1} — Tiket ${ticketCode} (${title})`,
                            })
                          }
                          className="group relative rounded-2xl overflow-hidden border-2 border-slate-200 hover:border-[#0277BD] bg-slate-100 cursor-pointer shadow-xs transition-all"
                        >
                          <img
                            src={resolvedUrl}
                            alt={`Foto Bukti Pengaduan ${idx + 1}`}
                            referrerPolicy="no-referrer"
                            className="w-full h-56 sm:h-64 object-cover group-hover:scale-[1.02] transition-transform duration-200"
                          />
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/85 via-slate-950/40 to-transparent p-3 flex items-center justify-between text-white">
                            <span className="text-xs font-bold">
                              Foto Lampiran Pengaduan #{idx + 1}
                            </span>
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/20 backdrop-blur-xs text-[11px] font-bold">
                              <ZoomIn className="w-3.5 h-3.5" />
                              <span>Perbesar</span>
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* 4. DOKUMEN PERSYARATAN YANG DI-UPLOAD PEMOHON (KHUSUS SURAT / PRA REGISTRASI) */}
            {isSurat && (
              <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs font-black uppercase tracking-wider text-[#0D3868] flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-[#0277BD]" />
                    <span>
                      Lampiran Berkas / Dokumen Persyaratan Pemohon ({uploadedDocs.length} Berkas)
                    </span>
                  </h4>
                  {uploadedDocs.length > 0 && (
                    <span className="text-[11px] font-semibold text-slate-500">
                      Klik gambar berkas untuk memperbesar
                    </span>
                  )}
                </div>

                {uploadedDocs.length === 0 ? (
                  <div className="p-5 rounded-xl bg-slate-50 border border-dashed border-slate-300 text-center text-xs text-slate-500">
                    Permohonan ini diajukan melalui pencatatan loket atau belum ada file persyaratan digital yang diunggah. Pemeriksaan dilakukan menggunakan berkas fisik asli di loket.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {uploadedDocs.map((doc, idx) => {
                      const docLabel = doc.persyaratanLabel || doc.docName || `Dokumen #${idx + 1}`;
                      const hasImg = isImageSource(doc.fileUrl, doc.fileName);
                      const resolvedDocUrl = hasImg ? resolveImageUrl(doc.fileUrl) : doc.fileUrl;

                      return (
                        <div
                          key={idx}
                          className="rounded-2xl border border-slate-200 bg-slate-50 overflow-hidden flex flex-col justify-between"
                        >
                          {hasImg && doc.fileUrl && (
                            <div
                              onClick={() =>
                                setZoomedImage({
                                  url: resolvedDocUrl,
                                  caption: `${docLabel} — Pemohon: ${applicantName} (${ticketCode})`,
                                })
                              }
                              className="relative h-44 bg-slate-200 cursor-pointer group overflow-hidden border-b border-slate-200"
                            >
                              <img
                                src={resolvedDocUrl}
                                alt={docLabel}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              />
                              <div className="absolute bottom-2 right-2 px-2.5 py-1 rounded-lg bg-slate-900/80 text-white text-[11px] font-bold flex items-center gap-1">
                                <ZoomIn className="w-3.5 h-3.5" />
                                <span>Perbesar Berkas</span>
                              </div>
                            </div>
                          )}

                          <div className="p-3 flex items-center justify-between gap-2 text-xs">
                            <div className="min-w-0">
                              <div className="font-bold text-slate-900 truncate">{docLabel}</div>
                              <div className="text-[11px] text-slate-500 truncate">
                                {doc.fileName || 'Berkas Persyaratan'}{' '}
                                {doc.fileSizeKb ? `(${doc.fileSizeKb} KB)` : ''}
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              {hasImg && doc.fileUrl && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setZoomedImage({
                                      url: resolvedDocUrl,
                                      caption: `${docLabel} — Pemohon: ${applicantName} (${ticketCode})`,
                                    })
                                  }
                                  className="px-2.5 py-1.5 rounded-lg bg-sky-100 hover:bg-sky-200 text-[#0D3868] text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                                >
                                  <ZoomIn className="w-3 h-3" />
                                  <span>Lihat</span>
                                </button>
                              )}
                              {doc.fileUrl && (
                                <a
                                  href={doc.fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  download={doc.fileName || `${docLabel}.jpg`}
                                  className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-[11px] font-bold flex items-center gap-1"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  <span>Buka</span>
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* 5. FOTO BUKTI TINDAK LANJUT / PENGERJAAN PETUGAS (JIKA ADA) */}
            {officerFollowUpPhotos.length > 0 && (
              <div className="bg-emerald-50/70 rounded-2xl border border-emerald-200 p-4 sm:p-5 space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  <span>
                    Foto Bukti Tindak Lanjut / Penyelesaian Petugas ({officerFollowUpPhotos.length} Foto)
                  </span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {officerFollowUpPhotos.map((photoUrl, idx) => {
                    const resolvedUrl = resolveImageUrl(photoUrl);
                    return (
                      <div
                        key={idx}
                        onClick={() =>
                          setZoomedImage({
                            url: resolvedUrl,
                            caption: `Foto Bukti Penyelesaian Petugas #${idx + 1} — Tiket ${ticketCode}`,
                          })
                        }
                        className="group relative rounded-2xl overflow-hidden border-2 border-emerald-300 bg-white cursor-pointer shadow-xs"
                      >
                        <img
                          src={resolvedUrl}
                          alt={`Bukti Pengerjaan ${idx + 1}`}
                          referrerPolicy="no-referrer"
                          className="w-full h-48 object-cover group-hover:scale-[1.02] transition-transform"
                        />
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-emerald-950/85 to-transparent p-2.5 flex items-center justify-between text-white text-xs font-bold">
                          <span>Bukti Tindak Lanjut Petugas #{idx + 1}</span>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white/20 text-[11px]">
                            <ZoomIn className="w-3 h-3" />
                            <span>Perbesar</span>
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 6. PANEL KEPUTUSAN PERMOHONAN BERKAS: DISETUJUI, DIKEMBALIKAN, DITOLAK (SELALU TAMPIL UNTUK SURAT) */}
            {isSurat && (
              <div className="bg-white rounded-2xl border-2 border-[#0D3868] p-4 sm:p-5 space-y-3.5 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-[#0D3868] flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-amber-600" />
                      <span>Keputusan & Persetujuan Permohonan Berkas</span>
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Klik tombol Disetujui, Dikembalikan, atau Ditolak untuk menyimpan keputusan dan menampilkan popup informasi berkas.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setDecisionPopupData({
                        action: 'GUIDE',
                        ticketCode,
                        serviceName: title,
                        applicantName,
                        applicantNik,
                        rw,
                        rt,
                        phone: resolvedPhone || rawPhone,
                        note:
                          lurahNoteInput.trim() ||
                          officerNotes ||
                          'Panduan informasi status keputusan berkas permohonan warga.',
                        decidedAt: getRealtimeDateTimeString(),
                      })
                    }
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-[#0D3868] border border-sky-200 text-[11px] font-extrabold transition cursor-pointer shrink-0 self-start sm:self-auto"
                  >
                    <Info className="w-3.5 h-3.5 text-[#0277BD]" />
                    <span>Info Status (Disetujui / Dikembalikan / Ditolak)</span>
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Catatan / Alasan Keputusan Berkas (Ditampilkan pada Popup & Status Warga):
                  </label>
                  <textarea
                    rows={2}
                    value={lurahNoteInput}
                    onChange={(e) => setLurahNoteInput(e.target.value)}
                    placeholder="Contoh: Berkas persyaratan telah lengkap dan disetujui / Mohon lengkapi fotokopi KK yang jelas..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-[#0D3868]"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    disabled={isProcessingApproval}
                    onClick={() => handleDecisionClick('SETUJUI')}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" />
                    <span>Disetujui (Setujui Permohonan)</span>
                  </button>

                  <button
                    type="button"
                    disabled={isProcessingApproval}
                    onClick={() => handleDecisionClick('KEMBALIKAN')}
                    className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Dikembalikan (Perlu Perbaikan)</span>
                  </button>

                  <button
                    type="button"
                    disabled={isProcessingApproval}
                    onClick={() => handleDecisionClick('TOLAK')}
                    className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Ditolak (Tolak Permohonan)</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ================= FOOTER ACTION BAR ================= */}
          <div className="px-5 sm:px-6 py-3.5 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              {report && onQuickVerify && report.status === 'Menunggu Verifikasi' && (
                <button
                  type="button"
                  onClick={() => {
                    onQuickVerify(report);
                    setActionFeedback(`Tiket ${report.ticketCode} berhasil diverifikasi.`);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-[#0D3868] hover:bg-[#072647] text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Verifikasi Berkas</span>
                </button>
              )}

              {report && isSurat && !report.letterRegisterNumber && onQuickIssueLetter && (
                <button
                  type="button"
                  onClick={() => {
                    onQuickIssueLetter(report);
                    setActionFeedback(
                      `Nomor surat resmi untuk ${report.ticketCode} berhasil diterbitkan.`
                    );
                  }}
                  className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-amber-300" />
                  <span>Terbitkan No. Surat</span>
                </button>
              )}

              {report && report.status !== 'Selesai' && onQuickComplete && (
                <button
                  type="button"
                  onClick={() => {
                    onQuickComplete(report);
                    setActionFeedback(`Tiket ${report.ticketCode} ditandai Selesai.`);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Tandai Selesai</span>
                </button>
              )}

              {report && onOpenEdit && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenEdit(report);
                  }}
                  className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5 text-[#0277BD]" />
                  <span>Edit / Tindak Lanjut</span>
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 ml-auto">
              {report && onOpenPrint ? (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenPrint(report);
                  }}
                  className="px-4 py-2 rounded-xl bg-sky-50 hover:bg-sky-100 border border-sky-200 text-[#0D3868] text-xs font-extrabold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-[#0277BD]" />
                  <span>Pratinjau & Cetak Resmi</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleDownloadPdfSummary}
                  className="px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-900 text-xs font-extrabold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-700" />
                  <span>
                    Unduh PDF {isSurat ? 'Surat / Tanda Terima' : 'Tanda Terima Aduan'}
                  </span>
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-black transition cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ================= POPUP INFORMASI KEPUTUSAN BERKAS (DISETUJUI / DIKEMBALIKAN / DITOLAK) ================= */}
      <DecisionInfoPopupModal
        data={decisionPopupData}
        onClose={() => setDecisionPopupData(null)}
      />

      {/* ================= LIGHTBOX FULL-SCREEN IMAGE ZOOM ================= */}
      {zoomedImage && (
        <div
          className="fixed inset-0 z-[80] flex flex-col items-center justify-center bg-black/90 p-4 animate-fadeIn"
          onClick={() => setZoomedImage(null)}
        >
          <div
            className="max-w-5xl w-full flex flex-col items-center space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full flex items-center justify-between text-white px-2">
              <span className="text-xs sm:text-sm font-bold truncate pr-4">
                {zoomedImage.caption}
              </span>
              <button
                type="button"
                onClick={() => setZoomedImage(null)}
                className="px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
                <span>Tutup Foto</span>
              </button>
            </div>
            <div className="w-full max-h-[82vh] rounded-2xl overflow-hidden bg-slate-950 border border-white/20 flex items-center justify-center">
              <img
                src={zoomedImage.url}
                alt={zoomedImage.caption}
                referrerPolicy="no-referrer"
                className="max-w-full max-h-[80vh] object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};
