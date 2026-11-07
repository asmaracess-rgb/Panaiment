import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { KelurahanProfile } from '../types';
import { drawOfficialPdfKopSurat } from './officialKopSurat';
import { INITIAL_KELURAHAN_PROFILE } from '../data/initialData';

export interface OfficialDocumentPrintPayload {
  ticketCode: string;
  isSurat: boolean;
  documentTitle?: string;
  registerNumber?: string;
  applicantName: string;
  applicantNik?: string;
  applicantPhone?: string;
  rw?: string;
  rt?: string;
  address?: string;
  serviceOrCategoryName: string;
  descriptionOrPurpose: string;
  statusText: string;
  assignedUnit?: string;
  officerNotes?: string;
  submittedAt?: string;
  signerName?: string;
  signerNip?: string;
}

export function downloadOfficialLetterOrReceiptPdf(
  payload: OfficialDocumentPrintPayload,
  profile: KelurahanProfile = INITIAL_KELURAHAN_PROFILE
): string {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const marginX = 16;
  const pageWidth = doc.internal.pageSize.getWidth();
  const centerX = pageWidth / 2;

  // 1. Official Kop Surat Kelurahan Panaikang
  let cursorY = drawOfficialPdfKopSurat(doc, profile, marginX, 'spacious');
  cursorY += 4;

  // 2. Document Title & Number
  const docTitle =
    payload.documentTitle ||
    (payload.isSurat
      ? 'SURAT KETERANGAN / TANDA BUKTI PELAYANAN WARGA'
      : 'TANDA TERIMA RESMI LAPORAN & PENGADUAN WARGA');
  const docNumber = payload.registerNumber || payload.ticketCode;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12.5);
  doc.setTextColor(13, 56, 104);
  doc.text(docTitle.toUpperCase(), centerX, cursorY, { align: 'center' });

  // Underline title
  const titleWidth = Math.min(doc.getTextWidth(docTitle.toUpperCase()) + 4, pageWidth - marginX * 2);
  doc.setDrawColor(13, 56, 104);
  doc.setLineWidth(0.4);
  doc.line(centerX - titleWidth / 2, cursorY + 1.2, centerX + titleWidth / 2, cursorY + 1.2);

  cursorY += 6.5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(51, 65, 85);
  doc.text(`Nomor Dokumen / Tiket: ${docNumber}`, centerX, cursorY, { align: 'center' });

  cursorY += 8;

  // 3. Intro Paragraph
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  const introText = payload.isSurat
    ? 'Yang bertanda tangan di bawah ini, Pemerintah Kelurahan Panaikang Kecamatan Panakkukang Kota Makassar, menerangkan dan mencatat berkas permohonan pelayanan administrasi warga sebagai berikut:'
    : 'Pemerintah Kelurahan Panaikang Kecamatan Panakkukang Kota Makassar telah menerima, memverifikasi, dan mencatat laporan/pengaduan resmi warga masyarakat dengan rincian sebagai berikut:';

  const splitIntro = doc.splitTextToSize(introText, pageWidth - marginX * 2);
  doc.text(splitIntro, marginX, cursorY);
  cursorY += splitIntro.length * 5 + 3;

  // 4. Structured Details Table
  const rows: [string, string][] = [
    ['Nomor Tiket Sistem', payload.ticketCode],
    ['Nomor Registrasi Surat', payload.registerNumber || 'Terdaftar di Loket Pelayanan'],
    ['Nama Lengkap Pemohon / Pelapor', payload.applicantName || 'Warga Kelurahan Panaikang'],
    ['NIK / Nomor Identitas', payload.applicantNik || '-'],
    ['Nomor Telepon / WhatsApp', payload.applicantPhone || '-'],
    [
      'Wilayah RT / RW & Alamat',
      `${payload.address || 'Kelurahan Panaikang'} (${payload.rt || 'RT 01'} / ${payload.rw || 'RW 01'})`,
    ],
    [
      payload.isSurat ? 'Jenis Layanan Administrasi' : 'Kategori Laporan / Pengaduan',
      payload.serviceOrCategoryName,
    ],
    [
      payload.isSurat ? 'Keperluan / Keterangan Permohonan' : 'Uraian Permasalahan / Laporan',
      payload.descriptionOrPurpose || '-',
    ],
    ['Waktu Pengajuan / Pencatatan', payload.submittedAt || '-'],
    ['Status Penanganan / Verifikasi', payload.statusText],
    [
      'Unit Pelaksana / Petugas',
      payload.assignedUnit || 'Seksi Pelayanan Umum & Loket Kelurahan Panaikang',
    ],
    [
      'Catatan Verifikasi / Tindak Lanjut',
      payload.officerNotes || 'Berkas telah tercatat dalam sistem pelayanan Kelurahan Panaikang.',
    ],
  ];

  autoTable(doc, {
    startY: cursorY,
    margin: { left: marginX, right: marginX },
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 9.5,
      cellPadding: 3.2,
      textColor: [15, 23, 42],
      lineColor: [203, 213, 225],
      lineWidth: 0.25,
    },
    columnStyles: {
      0: {
        cellWidth: 62,
        fontStyle: 'bold',
        fillColor: [248, 250, 252],
        textColor: [13, 56, 104],
      },
      1: {
        cellWidth: 'auto',
      },
    },
    body: rows,
  });

  const finalY = (doc as any).lastAutoTable?.finalY || cursorY + 85;
  let nextY = finalY + 8;

  // 5. Closing Paragraph
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(30, 41, 59);
  const closingText = payload.isSurat
    ? 'Demikian surat keterangan / tanda bukti pelayanan administrasi ini diterbitkan secara resmi melalui Sistem Pelayanan Digital Kelurahan Panaikang untuk dapat dipergunakan sebagaimana mestinya. Catatan: Keabsahan dokumen fisik diverifikasi langsung oleh petugas loket kelurahan.'
    : 'Demikian tanda terima laporan/pengaduan warga ini diterbitkan secara resmi sebagai bukti registrasi dan pemantauan tindak lanjut penanganan oleh petugas Kelurahan Panaikang.';

  const splitClosing = doc.splitTextToSize(closingText, pageWidth - marginX * 2);
  doc.text(splitClosing, marginX, nextY);
  nextY += splitClosing.length * 4.8 + 8;

  // Ensure signature fits on page
  if (nextY > 235) {
    doc.addPage();
    nextY = 25;
  }

  // 6. Signature Block & Verification Box
  const todayStr = new Date().toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  // Left Box: Bukti Validasi Sistem
  doc.setDrawColor(203, 213, 225);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(marginX, nextY, 85, 34, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(13, 56, 104);
  doc.text('VALIDASI SISTEM PELAYANAN KELURAHAN', marginX + 4, nextY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(`Kode Tiket : ${payload.ticketCode}`, marginX + 4, nextY + 12);
  doc.text(`Status     : ${payload.statusText}`, marginX + 4, nextY + 17);
  doc.text(`Tgl Cetak  : ${todayStr}`, marginX + 4, nextY + 22);
  doc.text('Dokumen sah tercatat di Cloud Database', marginX + 4, nextY + 28);

  // Right Box: Signature
  const signCenterX = pageWidth - marginX - 42;
  const signer = payload.signerName || `${profile.lurahName}`;
  const nip = payload.signerNip || profile.lurahNip || '19840719 201001 2 023';

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`Makassar, ${todayStr}`, signCenterX, nextY + 4, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.text('Pemerintah Kelurahan Panaikang', signCenterX, nextY + 9, { align: 'center' });
  doc.text('Pejabat Penandatangan,', signCenterX, nextY + 14, { align: 'center' });

  // Space for signature
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(13, 56, 104);
  doc.text(signer, signCenterX, nextY + 33, { align: 'center' });

  const signerW = doc.getTextWidth(signer);
  doc.setDrawColor(13, 56, 104);
  doc.setLineWidth(0.35);
  doc.line(signCenterX - signerW / 2, nextY + 34, signCenterX + signerW / 2, nextY + 34);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`NIP. ${nip}`, signCenterX, nextY + 38.5, { align: 'center' });

  const cleanCode = payload.ticketCode.replace(/[^a-zA-Z0-9_-]/g, '_');
  const prefix = payload.isSurat ? 'Surat_Pelayanan' : 'Tanda_Terima_Pengaduan';
  const fileName = `${prefix}_${cleanCode}.pdf`;

  doc.save(fileName);
  return fileName;
}
