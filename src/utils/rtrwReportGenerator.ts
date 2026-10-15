import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  CitizenReport,
  KelurahanProfile,
  RtItem,
  RwGroup,
} from '../types';
import {
  buildOfficialKopSuratHtml,
  drawContinuationPdfHeader,
  drawOfficialPdfKopSurat,
  ReportHeaderSizePreset,
} from './officialKopSurat';

export type RtRwReportScope = 'per_rw' | 'per_rt' | 'semua_rtrw';

export function getPresetForRtRwScope(scope: RtRwReportScope): ReportHeaderSizePreset {
  if (scope === 'per_rt') return 'spacious';
  if (scope === 'per_rw') return 'standard';
  return 'compact';
}

export interface RtRwReportOptions {
  scope: RtRwReportScope;
  selectedRwCode: string;
  selectedRtCode: string;
  documentNumber: string;
  includeCitizenReports: boolean;
  officialNote: string;
  profile: KelurahanProfile;
  rwGroups: RwGroup[];
  reports: CitizenReport[];
}

export interface RtRwReportResult {
  fileName: string;
  titleLabel: string;
  scopeLabel: string;
  generatedAt: string;
  totalRwCount: number;
  totalRtCount: number;
  totalKkCount: number;
}

function formatPrintDates(): { dateOnly: string; dateTime: string } {
  const now = new Date();
  const dateOnly = new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(now);
  const dateTime = `${dateOnly}, ${now.toTimeString().slice(0, 5)} WITA`;
  return { dateOnly, dateTime };
}

export function generateRtRwReportPdf(options: RtRwReportOptions): RtRwReportResult {
  const {
    scope,
    selectedRwCode,
    selectedRtCode,
    documentNumber,
    includeCitizenReports,
    officialNote,
    profile,
    rwGroups,
    reports,
  } = options;

  const { dateOnly, dateTime } = formatPrintDates();
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 14;
  const headerPreset = getPresetForRtRwScope(scope);
  let cursorY = drawOfficialPdfKopSurat(doc, profile, marginX, headerPreset);

  const targetRw: RwGroup =
    rwGroups.find((g) => g.rwCode === selectedRwCode) || rwGroups[0];
  const targetRt: RtItem | undefined =
    targetRw?.rtList?.find((r) => r.rtCode === selectedRtCode) || targetRw?.rtList?.[0];

  let titleLabel = 'LAPORAN DATA RT DAN RW KELURAHAN PANAIKANG';
  let scopeLabel = 'Seluruh Wilayah RW 01 – RW 07';
  let totalRwCount = rwGroups.length;
  let totalRtCount = rwGroups.reduce((acc, g) => acc + (g.rtList?.length || 0), 0);
  let totalKkCount = rwGroups.reduce(
    (acc, g) =>
      acc + (g.rtList || []).reduce((s, r) => s + (Number(r.householdsCount) || 0), 0),
    0
  );

  if (scope === 'per_rw' && targetRw) {
    titleLabel = `LAPORAN DATA PENGURUS & WILAYAH ${targetRw.rwCode}`;
    scopeLabel = `${targetRw.rwName}`;
    totalRwCount = 1;
    totalRtCount = targetRw.rtList?.length || 0;
    totalKkCount = (targetRw.rtList || []).reduce(
      (s, r) => s + (Number(r.householdsCount) || 0),
      0
    );
  } else if (scope === 'per_rt' && targetRw && targetRt) {
    titleLabel = `LAPORAN DATA PENGURUS & WILAYAH ${targetRt.rtCode} / ${targetRw.rwCode}`;
    scopeLabel = `${targetRt.rtName}`;
    totalRwCount = 1;
    totalRtCount = 1;
    totalKkCount = Number(targetRt.householdsCount) || 0;
  }

  // Document Title & Metadata
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(13, 56, 104);
  doc.text(titleLabel, pageWidth / 2, cursorY, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(
    `Nomor Dokumen: ${documentNumber}   |   Tanggal Cetak: ${dateTime}`,
    pageWidth / 2,
    cursorY + 4.8,
    { align: 'center' }
  );
  cursorY += 9;

  // ================= MODE 1: LAPORAN PER RT =================
  if (scope === 'per_rt' && targetRw && targetRt) {
    // Summary Box for RT & Parent RW
    autoTable(doc, {
      startY: cursorY,
      margin: { left: marginX, right: marginX },
      head: [
        [
          {
            content: `I. IDENTITAS PENGURUS & CAKUPAN WILAYAH ${targetRt.rtCode} / ${targetRw.rwCode}`,
            colSpan: 2,
          },
        ],
      ],
      body: [
        ['Kode & Nama Unit RT', `${targetRt.rtCode} — ${targetRt.rtName}`],
        ['Nama Ketua RT', targetRt.ketuaRtName || '-'],
        ['Nomor Telepon / HP Ketua RT', targetRt.phone || '-'],
        ['Cakupan Wilayah / Alamat RT', targetRt.areaDescription || '-'],
        ['Jumlah Kepala Keluarga (KK)', `${targetRt.householdsCount} KK`],
        ['Wilayah Induk Rukun Warga (RW)', `${targetRw.rwCode} — ${targetRw.rwName}`],
        ['Nama Ketua RW & Nomor Kontak', `${targetRw.ketuaRwName} (${targetRw.phone || '-'})`],
        ['Cakupan Wilayah / Alamat RW', targetRw.areaDescription || '-'],
        ['Kelurahan / Kecamatan', 'Kelurahan Panaikang, Kecamatan Panakkukang, Kota Makassar'],
      ],
      theme: 'grid',
      headStyles: {
        fillColor: [13, 56, 104],
        textColor: [255, 255, 255],
        fontSize: 8.5,
        fontStyle: 'bold',
      },
      bodyStyles: {
        fontSize: 8.2,
        textColor: [30, 41, 59],
        cellPadding: 2.5,
      },
      columnStyles: {
        0: { cellWidth: 62, fontStyle: 'bold', fillColor: [248, 250, 252] },
        1: { cellWidth: 'auto' },
      },
    });

    cursorY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;

    if (includeCitizenReports) {
      const rtReports = reports.filter(
        (r) =>
          r.rw.trim().toLowerCase() === targetRw.rwCode.trim().toLowerCase() &&
          r.rt.trim().toLowerCase() === targetRt.rtCode.trim().toLowerCase()
      );

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(13, 56, 104);
      doc.text(
        `II. REKAPITULASI LAPORAN & PENGAJUAN LAYANAN WARGA (${targetRt.rtCode} / ${targetRw.rwCode})`,
        marginX,
        cursorY
      );
      cursorY += 3;

      if (rtReports.length > 0) {
        autoTable(doc, {
          startY: cursorY,
          margin: { left: marginX, right: marginX },
          head: [['No', 'Tiket', 'Tanggal', 'Pemohon / Pelapor', 'Kategori / Layanan', 'Lokasi', 'Status']],
          body: rtReports.map((rep, idx) => [
            String(idx + 1),
            rep.ticketCode,
            rep.createdAt,
            rep.reporterName,
            rep.serviceSubItemLabel || rep.category,
            rep.locationName,
            rep.status,
          ]),
          theme: 'grid',
          headStyles: {
            fillColor: [28, 130, 55],
            textColor: [255, 255, 255],
            fontSize: 7.5,
            fontStyle: 'bold',
          },
          bodyStyles: {
            fontSize: 7.2,
            textColor: [30, 41, 59],
          },
        });
        cursorY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;
      } else {
        autoTable(doc, {
          startY: cursorY,
          margin: { left: marginX, right: marginX },
          body: [
            [
              `Belum terdapat catatan laporan/pengaduan aktif pada wilayah ${targetRt.rtCode} / ${targetRw.rwCode}. Kondisi lingkungan dan administrasi wilayah berjalan tertib dan kondusif.`,
            ],
          ],
          theme: 'grid',
          bodyStyles: {
            fontSize: 7.8,
            textColor: [71, 85, 105],
            fillColor: [248, 250, 252],
          },
        });
        cursorY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;
      }
    }
  }

  // ================= MODE 2: LAPORAN PER RW =================
  if (scope === 'per_rw' && targetRw) {
    autoTable(doc, {
      startY: cursorY,
      margin: { left: marginX, right: marginX },
      head: [
        [
          {
            content: `I. IDENTITAS PENGURUS & CAKUPAN WILAYAH ${targetRw.rwCode}`,
            colSpan: 2,
          },
        ],
      ],
      body: [
        ['Kode & Nama Wilayah RW', `${targetRw.rwCode} — ${targetRw.rwName}`],
        ['Nama Ketua RW', targetRw.ketuaRwName || '-'],
        ['Nomor Telepon / HP Ketua RW', targetRw.phone || '-'],
        ['Cakupan Wilayah / Alamat RW', targetRw.areaDescription || '-'],
        [
          'Jumlah Rukun Tetangga (RT) & KK',
          `${targetRw.rtList?.length || 0} Unit RT   |   Total ${totalKkCount.toLocaleString('id-ID')} Kepala Keluarga (KK)`,
        ],
      ],
      theme: 'grid',
      headStyles: {
        fillColor: [13, 56, 104],
        textColor: [255, 255, 255],
        fontSize: 8.5,
        fontStyle: 'bold',
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [30, 41, 59],
        cellPadding: 2.2,
      },
      columnStyles: {
        0: { cellWidth: 62, fontStyle: 'bold', fillColor: [248, 250, 252] },
        1: { cellWidth: 'auto' },
      },
    });

    cursorY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(13, 56, 104);
    doc.text(
      `II. DAFTAR PENGURUS RUKUN TETANGGA (RT) DI WILAYAH ${targetRw.rwCode} (${targetRw.rtList?.length || 0} RT)`,
      marginX,
      cursorY
    );
    cursorY += 3;

    autoTable(doc, {
      startY: cursorY,
      margin: { left: marginX, right: marginX },
      head: [['No', 'Kode RT', 'Nama Ketua RT', 'Nomor Telepon / HP', 'Cakupan Wilayah / Alamat RT', 'Jumlah KK']],
      body: (targetRw.rtList || []).map((rt, idx) => [
        String(idx + 1),
        rt.rtCode,
        rt.ketuaRtName,
        rt.phone || '-',
        rt.areaDescription,
        `${rt.householdsCount} KK`,
      ]),
      foot: [
        [
          '',
          'TOTAL',
          `${targetRw.rtList?.length || 0} Ketua RT Aktif`,
          '',
          `Wilayah ${targetRw.rwCode}`,
          `${totalKkCount} KK`,
        ],
      ],
      theme: 'grid',
      headStyles: {
        fillColor: [28, 130, 55],
        textColor: [255, 255, 255],
        fontSize: 7.8,
        fontStyle: 'bold',
      },
      bodyStyles: {
        fontSize: 7.5,
        textColor: [30, 41, 59],
      },
      footStyles: {
        fillColor: [241, 245, 249],
        textColor: [13, 56, 104],
        fontSize: 7.8,
        fontStyle: 'bold',
      },
    });

    cursorY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;

    if (includeCitizenReports) {
      const rwReports = reports.filter(
        (r) => r.rw.trim().toLowerCase() === targetRw.rwCode.trim().toLowerCase()
      );
      if (rwReports.length > 0) {
        if (cursorY > pageHeight - 55) {
          doc.addPage();
          cursorY = drawContinuationPdfHeader(doc, titleLabel, documentNumber, marginX);
        }
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(13, 56, 104);
        doc.text(
          `III. REKAPITULASI LAPORAN & PENGAJUAN LAYANAN WARGA WILAYAH ${targetRw.rwCode} (${rwReports.length} Laporan)`,
          marginX,
          cursorY
        );
        cursorY += 3;

        autoTable(doc, {
          startY: cursorY,
          margin: { left: marginX, right: marginX },
          head: [['No', 'Tiket', 'RT', 'Pemohon / Pelapor', 'Kategori / Layanan', 'Alamat / Lokasi', 'Status']],
          body: rwReports.map((rep, idx) => [
            String(idx + 1),
            rep.ticketCode,
            rep.rt,
            rep.reporterName,
            rep.serviceSubItemLabel || rep.category,
            rep.locationName,
            rep.status,
          ]),
          theme: 'grid',
          headStyles: {
            fillColor: [13, 56, 104],
            textColor: [255, 255, 255],
            fontSize: 7.5,
            fontStyle: 'bold',
          },
          bodyStyles: {
            fontSize: 7.2,
            textColor: [30, 41, 59],
          },
        });
        cursorY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;
      }
    }
  }

  // ================= MODE 3: REKAPITULASI SELURUH RW & RT =================
  if (scope === 'semua_rtrw') {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(13, 56, 104);
    doc.text(
      `I. RINGKASAN EKSEKUTIF DATA RUKUN WARGA (RW) SE-KELURAHAN PANAIKANG (${rwGroups.length} RW · ${totalRtCount} RT)`,
      marginX,
      cursorY
    );
    cursorY += 3;

    autoTable(doc, {
      startY: cursorY,
      margin: { left: marginX, right: marginX },
      head: [['No', 'Kode RW', 'Nama Ketua RW', 'Nomor Telepon / HP', 'Cakupan Wilayah / Alamat RW', 'Jumlah RT', 'Total KK']],
      body: rwGroups.map((rw, idx) => {
        const kk = (rw.rtList || []).reduce((s, r) => s + (Number(r.householdsCount) || 0), 0);
        return [
          String(idx + 1),
          rw.rwCode,
          rw.ketuaRwName,
          rw.phone || '-',
          rw.areaDescription,
          `${rw.rtList?.length || 0} RT`,
          `${kk} KK`,
        ];
      }),
      foot: [
        [
          '',
          'TOTAL',
          `${rwGroups.length} Ketua RW`,
          '',
          'Kelurahan Panaikang',
          `${totalRtCount} RT`,
          `${totalKkCount.toLocaleString('id-ID')} KK`,
        ],
      ],
      theme: 'grid',
      headStyles: {
        fillColor: [13, 56, 104],
        textColor: [255, 255, 255],
        fontSize: 7.8,
        fontStyle: 'bold',
      },
      bodyStyles: {
        fontSize: 7.4,
        textColor: [30, 41, 59],
      },
      footStyles: {
        fillColor: [241, 245, 249],
        textColor: [13, 56, 104],
        fontSize: 7.8,
        fontStyle: 'bold',
      },
    });

    cursorY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(13, 56, 104);
    doc.text(
      `II. DAFTAR LENGKAP PENGURUS RT PER WILAYAH RW SE-KELURAHAN PANAIKANG (${totalRtCount} RT)`,
      marginX,
      cursorY
    );
    cursorY += 3;

    const allRtRows: string[][] = [];
    let globalIdx = 1;
    rwGroups.forEach((rw) => {
      (rw.rtList || []).forEach((rt) => {
        allRtRows.push([
          String(globalIdx++),
          rw.rwCode,
          rt.rtCode,
          rt.ketuaRtName,
          rt.phone || '-',
          rt.areaDescription,
          `${rt.householdsCount} KK`,
        ]);
      });
    });

    autoTable(doc, {
      startY: cursorY,
      margin: { top: 26, left: marginX, right: marginX },
      head: [['No', 'RW', 'RT', 'Nama Ketua RT', 'Nomor Telepon / HP', 'Cakupan Wilayah / Alamat RT', 'KK']],
      body: allRtRows,
      theme: 'grid',
      headStyles: {
        fillColor: [28, 130, 55],
        textColor: [255, 255, 255],
        fontSize: 7.5,
        fontStyle: 'bold',
      },
      bodyStyles: {
        fontSize: 7,
        textColor: [30, 41, 59],
        cellPadding: 1.7,
      },
    });

    cursorY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;
  }

  // Official Note & Signature Block
  if (cursorY > pageHeight - 58) {
    doc.addPage();
    cursorY = drawContinuationPdfHeader(doc, titleLabel, documentNumber, marginX);
  }

  if (officialNote) {
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    const splitNote = doc.splitTextToSize(`Catatan Resmi: ${officialNote}`, pageWidth - marginX * 2 - 6);
    const boxH = splitNote.length * 4 + 4;
    doc.roundedRect(marginX, cursorY, pageWidth - marginX * 2, boxH, 1.5, 1.5, 'FD');
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(51, 65, 85);
    doc.text(splitNote, marginX + 3, cursorY + 4.2);
    cursorY += boxH + 6;
  }

  if (cursorY > pageHeight - 46) {
    doc.addPage();
    cursorY = drawContinuationPdfHeader(doc, titleLabel, documentNumber, marginX);
  }

  const leftSignX = marginX + 38;
  const rightSignX = pageWidth - marginX - 38;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);

  if (scope === 'per_rt' && targetRw && targetRt) {
    doc.text(`Mengetahui Pengurus Wilayah,`, leftSignX, cursorY, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.text(`KETUA ${targetRt.rtCode} / ${targetRw.rwCode}`, leftSignX, cursorY + 4.2, {
      align: 'center',
    });
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(13, 56, 104);
    doc.text(targetRt.ketuaRtName || '-', leftSignX, cursorY + 25, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.2);
    doc.setTextColor(71, 85, 105);
    doc.text(`Ketua ${targetRw.rwCode}: ${targetRw.ketuaRwName}`, leftSignX, cursorY + 29.5, {
      align: 'center',
    });
  } else if (scope === 'per_rw' && targetRw) {
    doc.text(`Mengetahui Pengurus Wilayah,`, leftSignX, cursorY, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.text(`KETUA ${targetRw.rwCode} KELURAHAN PANAIKANG`, leftSignX, cursorY + 4.2, {
      align: 'center',
    });
    doc.setTextColor(13, 56, 104);
    doc.text(targetRw.ketuaRwName || '-', leftSignX, cursorY + 25, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.2);
    doc.setTextColor(71, 85, 105);
    doc.text(`Kontak: ${targetRw.phone || '-'}`, leftSignX, cursorY + 29.5, { align: 'center' });
  } else {
    doc.text(`Disiapkan & Diverifikasi Oleh,`, leftSignX, cursorY, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.text(`SEKRETARIS KELURAHAN PANAIKANG`, leftSignX, cursorY + 4.2, { align: 'center' });
    doc.setTextColor(13, 56, 104);
    doc.text(profile.sekretarisName || 'Hj. Rahmawati Dg. Ngasseng, S.Sos.', leftSignX, cursorY + 25, {
      align: 'center',
    });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.2);
    doc.setTextColor(71, 85, 105);
    doc.text(`Koordinator Satu Data RT/RW`, leftSignX, cursorY + 29.5, { align: 'center' });
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text(`Makassar, ${dateOnly}`, rightSignX, cursorY, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.text('LURAH PANAIKANG', rightSignX, cursorY + 4.2, { align: 'center' });
  doc.setTextColor(13, 56, 104);
  doc.text(profile.lurahName, rightSignX, cursorY + 25, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  doc.setTextColor(71, 85, 105);
  doc.text(`NIP. ${profile.lurahNip}`, rightSignX, cursorY + 29.5, { align: 'center' });

  // Page Footers & Continuation Headers
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    if (p > 1) {
      drawContinuationPdfHeader(doc, titleLabel, documentNumber, marginX);
    }
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.25);
    doc.line(marginX, pageHeight - 10, pageWidth - marginX, pageHeight - 10);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `Dokumen Resmi Data RT/RW Kelurahan Panaikang · No: ${documentNumber}`,
      marginX,
      pageHeight - 6
    );
    doc.text(`Halaman ${p} dari ${totalPages}`, pageWidth - marginX, pageHeight - 6, {
      align: 'right',
    });
  }

  const slug =
    scope === 'per_rt' && targetRw && targetRt
      ? `${targetRw.rwCode}_${targetRt.rtCode}`
      : scope === 'per_rw' && targetRw
      ? `${targetRw.rwCode}`
      : 'Seluruh_RW_RT';
  const fileName = `Laporan_Data_${slug.replace(/\s+/g, '_')}_Kelurahan_Panaikang.pdf`;

  doc.save(fileName);

  return {
    fileName,
    titleLabel,
    scopeLabel,
    generatedAt: dateTime,
    totalRwCount,
    totalRtCount,
    totalKkCount,
  };
}

/**
 * Prints an A4 formatted official RT/RW report directly using a hidden iframe
 * (avoids window.open so it works reliably inside the preview environment).
 */
export function printRtRwReportDirect(options: RtRwReportOptions): RtRwReportResult {
  const {
    scope,
    selectedRwCode,
    selectedRtCode,
    documentNumber,
    includeCitizenReports,
    officialNote,
    profile,
    rwGroups,
    reports,
  } = options;

  const { dateOnly, dateTime } = formatPrintDates();
  const targetRw: RwGroup =
    rwGroups.find((g) => g.rwCode === selectedRwCode) || rwGroups[0];
  const targetRt: RtItem | undefined =
    targetRw?.rtList?.find((r) => r.rtCode === selectedRtCode) || targetRw?.rtList?.[0];

  let titleLabel = 'LAPORAN DATA RT DAN RW KELURAHAN PANAIKANG';
  let scopeLabel = 'Seluruh Wilayah RW 01 – RW 07';
  let totalRwCount = rwGroups.length;
  let totalRtCount = rwGroups.reduce((acc, g) => acc + (g.rtList?.length || 0), 0);
  let totalKkCount = rwGroups.reduce(
    (acc, g) =>
      acc + (g.rtList || []).reduce((s, r) => s + (Number(r.householdsCount) || 0), 0),
    0
  );

  if (scope === 'per_rw' && targetRw) {
    titleLabel = `LAPORAN DATA PENGURUS & WILAYAH ${targetRw.rwCode}`;
    scopeLabel = `${targetRw.rwName}`;
    totalRwCount = 1;
    totalRtCount = targetRw.rtList?.length || 0;
    totalKkCount = (targetRw.rtList || []).reduce(
      (s, r) => s + (Number(r.householdsCount) || 0),
      0
    );
  } else if (scope === 'per_rt' && targetRw && targetRt) {
    titleLabel = `LAPORAN DATA PENGURUS & WILAYAH ${targetRt.rtCode} / ${targetRw.rwCode}`;
    scopeLabel = `${targetRt.rtName}`;
    totalRwCount = 1;
    totalRtCount = 1;
    totalKkCount = Number(targetRt.householdsCount) || 0;
  }

  let bodyContentHtml = '';

  if (scope === 'per_rt' && targetRw && targetRt) {
    const rtReports = reports.filter(
      (r) =>
        r.rw.trim().toLowerCase() === targetRw.rwCode.trim().toLowerCase() &&
        r.rt.trim().toLowerCase() === targetRt.rtCode.trim().toLowerCase()
    );

    bodyContentHtml = `
      <div class="section-title">I. IDENTITAS PENGURUS & CAKUPAN WILAYAH ${targetRt.rtCode} / ${targetRw.rwCode}</div>
      <table class="info-table">
        <tbody>
          <tr><td class="lbl">Kode & Nama Unit RT</td><td><strong>${targetRt.rtCode}</strong> — ${targetRt.rtName}</td></tr>
          <tr><td class="lbl">Nama Ketua RT</td><td><strong>${targetRt.ketuaRtName}</strong></td></tr>
          <tr><td class="lbl">Nomor Telepon / HP Ketua RT</td><td>${targetRt.phone || '-'}</td></tr>
          <tr><td class="lbl">Cakupan Wilayah / Alamat RT</td><td>${targetRt.areaDescription}</td></tr>
          <tr><td class="lbl">Jumlah Kepala Keluarga (KK)</td><td><strong>${targetRt.householdsCount} KK</strong></td></tr>
          <tr><td class="lbl">Wilayah Induk Rukun Warga (RW)</td><td><strong>${targetRw.rwCode}</strong> — ${targetRw.rwName}</td></tr>
          <tr><td class="lbl">Nama Ketua RW & Kontak</td><td><strong>${targetRw.ketuaRwName}</strong> (${targetRw.phone || '-'})</td></tr>
          <tr><td class="lbl">Cakupan Wilayah / Alamat RW</td><td>${targetRw.areaDescription}</td></tr>
          <tr><td class="lbl">Kelurahan / Kecamatan</td><td>Kelurahan Panaikang, Kecamatan Panakkukang, Kota Makassar</td></tr>
        </tbody>
      </table>
      ${
        includeCitizenReports
          ? `
        <div class="section-title">II. REKAPITULASI LAPORAN & PENGAJUAN LAYANAN WARGA (${targetRt.rtCode} / ${targetRw.rwCode})</div>
        ${
          rtReports.length > 0
            ? `
          <table class="data-table">
            <thead>
              <tr>
                <th>No</th>
                <th>No. Tiket</th>
                <th>Tanggal</th>
                <th>Pemohon / Pelapor</th>
                <th>Kategori / Layanan</th>
                <th>Alamat / Lokasi</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${rtReports
                .map(
                  (rep, idx) => `
                <tr>
                  <td style="text-align:center">${idx + 1}</td>
                  <td><strong>${rep.ticketCode}</strong></td>
                  <td>${rep.createdAt}</td>
                  <td>${rep.reporterName}</td>
                  <td>${rep.serviceSubItemLabel || rep.category}</td>
                  <td>${rep.locationName}</td>
                  <td><strong>${rep.status}</strong></td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
        `
            : `<div class="note-box">Belum terdapat catatan laporan/pengaduan aktif pada wilayah <strong>${targetRt.rtCode} / ${targetRw.rwCode}</strong>. Kondisi lingkungan dan pelayanan warga berjalan tertib dan kondusif.</div>`
        }
      `
          : ''
      }
    `;
  } else if (scope === 'per_rw' && targetRw) {
    const rwReports = reports.filter(
      (r) => r.rw.trim().toLowerCase() === targetRw.rwCode.trim().toLowerCase()
    );

    bodyContentHtml = `
      <div class="section-title">I. IDENTITAS PENGURUS & CAKUPAN WILAYAH ${targetRw.rwCode}</div>
      <table class="info-table">
        <tbody>
          <tr><td class="lbl">Kode & Nama Wilayah RW</td><td><strong>${targetRw.rwCode}</strong> — ${targetRw.rwName}</td></tr>
          <tr><td class="lbl">Nama Ketua RW</td><td><strong>${targetRw.ketuaRwName}</strong></td></tr>
          <tr><td class="lbl">Nomor Telepon / HP Ketua RW</td><td>${targetRw.phone || '-'}</td></tr>
          <tr><td class="lbl">Cakupan Wilayah / Alamat RW</td><td>${targetRw.areaDescription}</td></tr>
          <tr><td class="lbl">Jumlah Unit RT & Total KK</td><td><strong>${targetRw.rtList?.length || 0} Unit RT</strong> &nbsp;|&nbsp; Total <strong>${totalKkCount} KK</strong></td></tr>
        </tbody>
      </table>

      <div class="section-title">II. DAFTAR PENGURUS RUKUN TETANGGA (RT) DI WILAYAH ${targetRw.rwCode} (${targetRw.rtList?.length || 0} RT)</div>
      <table class="data-table">
        <thead>
          <tr>
            <th style="width:36px">No</th>
            <th style="width:72px">Kode RT</th>
            <th>Nama Ketua RT</th>
            <th>Nomor Telepon / HP</th>
            <th>Cakupan Wilayah / Alamat RT</th>
            <th style="width:80px;text-align:right">Jumlah KK</th>
          </tr>
        </thead>
        <tbody>
          ${(targetRw.rtList || [])
            .map(
              (rt, idx) => `
            <tr>
              <td style="text-align:center">${idx + 1}</td>
              <td><strong>${rt.rtCode}</strong></td>
              <td><strong>${rt.ketuaRtName}</strong></td>
              <td>${rt.phone || '-'}</td>
              <td>${rt.areaDescription}</td>
              <td style="text-align:right">${rt.householdsCount} KK</td>
            </tr>
          `
            )
            .join('')}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="2"><strong>TOTAL</strong></td>
            <td colspan="3"><strong>${targetRw.rtList?.length || 0} Rukun Tetangga (RT) pada ${targetRw.rwCode}</strong></td>
            <td style="text-align:right"><strong>${totalKkCount} KK</strong></td>
          </tr>
        </tfoot>
      </table>

      ${
        includeCitizenReports && rwReports.length > 0
          ? `
        <div class="section-title">III. REKAPITULASI LAPORAN & PENGAJUAN LAYANAN WARGA WILAYAH ${targetRw.rwCode} (${rwReports.length} Laporan)</div>
        <table class="data-table">
          <thead>
            <tr>
              <th>No</th>
              <th>Tiket</th>
              <th>RT</th>
              <th>Pemohon / Pelapor</th>
              <th>Kategori / Layanan</th>
              <th>Lokasi</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${rwReports
              .map(
                (rep, idx) => `
              <tr>
                <td style="text-align:center">${idx + 1}</td>
                <td><strong>${rep.ticketCode}</strong></td>
                <td>${rep.rt}</td>
                <td>${rep.reporterName}</td>
                <td>${rep.serviceSubItemLabel || rep.category}</td>
                <td>${rep.locationName}</td>
                <td><strong>${rep.status}</strong></td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>
      `
          : ''
      }
    `;
  } else {
    bodyContentHtml = `
      <div class="section-title">I. REKAPITULASI PENGURUS RUKUN WARGA (RW) SE-KELURAHAN PANAIKANG (${rwGroups.length} RW · ${totalRtCount} RT)</div>
      <table class="data-table">
        <thead>
          <tr>
            <th style="width:32px">No</th>
            <th style="width:70px">Kode RW</th>
            <th>Nama Ketua RW</th>
            <th>Nomor Telepon / HP</th>
            <th>Cakupan Wilayah / Alamat RW</th>
            <th style="width:65px;text-align:center">Jml RT</th>
            <th style="width:75px;text-align:right">Total KK</th>
          </tr>
        </thead>
        <tbody>
          ${rwGroups
            .map((rw, idx) => {
              const kk = (rw.rtList || []).reduce(
                (s, r) => s + (Number(r.householdsCount) || 0),
                0
              );
              return `
                <tr>
                  <td style="text-align:center">${idx + 1}</td>
                  <td><strong>${rw.rwCode}</strong></td>
                  <td><strong>${rw.ketuaRwName}</strong></td>
                  <td>${rw.phone || '-'}</td>
                  <td>${rw.areaDescription}</td>
                  <td style="text-align:center">${rw.rtList?.length || 0} RT</td>
                  <td style="text-align:right">${kk} KK</td>
                </tr>
              `;
            })
            .join('')}
        </tbody>
      </table>

      <div class="section-title">II. DAFTAR LENGKAP PENGURUS RT PER WILAYAH RW SE-KELURAHAN PANAIKANG (${totalRtCount} RT)</div>
      <table class="data-table">
        <thead>
          <tr>
            <th style="width:32px">No</th>
            <th style="width:64px">RW</th>
            <th style="width:64px">RT</th>
            <th>Nama Ketua RT</th>
            <th>Nomor Telepon / HP</th>
            <th>Cakupan Wilayah / Alamat RT</th>
            <th style="width:68px;text-align:right">KK</th>
          </tr>
        </thead>
        <tbody>
          ${(() => {
            let n = 1;
            return rwGroups
              .map((rw) =>
                (rw.rtList || [])
                  .map(
                    (rt) => `
                  <tr>
                    <td style="text-align:center">${n++}</td>
                    <td><strong>${rw.rwCode}</strong></td>
                    <td><strong>${rt.rtCode}</strong></td>
                    <td><strong>${rt.ketuaRtName}</strong></td>
                    <td>${rt.phone || '-'}</td>
                    <td>${rt.areaDescription}</td>
                    <td style="text-align:right">${rt.householdsCount} KK</td>
                  </tr>
                `
                  )
                  .join('')
              )
              .join('');
          })()}
        </tbody>
      </table>
    `;
  }

  const leftSignHtml =
    scope === 'per_rt' && targetRw && targetRt
      ? `
        <div>Mengetahui Pengurus Wilayah,</div>
        <div class="sign-role">KETUA ${targetRt.rtCode} / ${targetRw.rwCode}</div>
        <div class="sign-space"></div>
        <div class="sign-name">${targetRt.ketuaRtName}</div>
        <div class="sign-sub">Ketua ${targetRw.rwCode}: ${targetRw.ketuaRwName}</div>
      `
      : scope === 'per_rw' && targetRw
      ? `
        <div>Mengetahui Pengurus Wilayah,</div>
        <div class="sign-role">KETUA ${targetRw.rwCode} KELURAHAN PANAIKANG</div>
        <div class="sign-space"></div>
        <div class="sign-name">${targetRw.ketuaRwName}</div>
        <div class="sign-sub">Kontak: ${targetRw.phone || '-'}</div>
      `
      : `
        <div>Disiapkan & Diverifikasi Oleh,</div>
        <div class="sign-role">SEKRETARIS KELURAHAN PANAIKANG</div>
        <div class="sign-space"></div>
        <div class="sign-name">${profile.sekretarisName}</div>
        <div class="sign-sub">Koordinator Satu Data RT/RW</div>
      `;

  const headerPreset = getPresetForRtRwScope(scope);
  const kopSuratHtml = buildOfficialKopSuratHtml(profile, headerPreset);

  const htmlDoc = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <title>${titleLabel}</title>
  <style>
    @page { size: A4 portrait; margin: 14mm; }
    * { box-sizing: border-box; }
    body {
      font-family: Arial, Helvetica, sans-serif;
      color: #1e293b;
      margin: 0;
      padding: 0;
      font-size: 11px;
      line-height: 1.45;
    }
    .doc-title {
      text-align: center;
      font-size: 13px;
      font-weight: bold;
      color: #0d3868;
      text-decoration: underline;
      margin-bottom: 3px;
    }
    .doc-meta {
      text-align: center;
      font-size: 10px;
      color: #475569;
      margin-bottom: 14px;
    }
    .section-title {
      font-size: 11px;
      font-weight: bold;
      color: #0d3868;
      margin: 12px 0 6px 0;
      text-transform: uppercase;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 10px;
    }
    .info-table td {
      border: 1px solid #cbd5e1;
      padding: 6px 8px;
      font-size: 10.5px;
    }
    .info-table td.lbl {
      width: 34%;
      background: #f8fafc;
      font-weight: bold;
      color: #0f172a;
    }
    .data-table th {
      background: #0d3868;
      color: #ffffff;
      border: 1px solid #0d3868;
      padding: 6px 7px;
      font-size: 10px;
      text-align: left;
    }
    .data-table td {
      border: 1px solid #cbd5e1;
      padding: 5px 7px;
      font-size: 10px;
    }
    .data-table tfoot td {
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      padding: 6px 7px;
      font-size: 10px;
      color: #0d3868;
    }
    .note-box {
      border: 1px solid #cbd5e1;
      background: #f8fafc;
      padding: 8px 10px;
      border-radius: 4px;
      font-size: 10px;
      color: #334155;
      margin-top: 8px;
      margin-bottom: 14px;
    }
    .sign-grid {
      display: flex;
      justify-content: space-between;
      margin-top: 22px;
      page-break-inside: avoid;
    }
    .sign-col {
      width: 44%;
      text-align: center;
      font-size: 10.5px;
    }
    .sign-role { font-weight: bold; color: #0f172a; margin-top: 2px; }
    .sign-space { height: 52px; }
    .sign-name { font-weight: bold; color: #0d3868; text-decoration: underline; }
    .sign-sub { font-size: 9.5px; color: #475569; margin-top: 2px; }
  </style>
</head>
<body>
  ${kopSuratHtml}

  <div class="doc-title">${titleLabel}</div>
  <div class="doc-meta">Nomor Dokumen: <strong>${documentNumber}</strong> &nbsp;|&nbsp; Tanggal Cetak: ${dateTime}</div>

  ${bodyContentHtml}

  ${officialNote ? `<div class="note-box"><strong>Catatan Resmi:</strong> ${officialNote}</div>` : ''}

  <div class="sign-grid">
    <div class="sign-col">
      ${leftSignHtml}
    </div>
    <div class="sign-col">
      <div>Makassar, ${dateOnly}</div>
      <div class="sign-role">LURAH PANAIKANG</div>
      <div class="sign-space"></div>
      <div class="sign-name">${profile.lurahName}</div>
      <div class="sign-sub">NIP. ${profile.lurahNip}</div>
    </div>
  </div>
</body>
</html>`;

  const existingFrame = document.getElementById('rtrw-print-iframe') as HTMLIFrameElement | null;
  if (existingFrame) {
    existingFrame.remove();
  }

  const iframe = document.createElement('iframe');
  iframe.id = 'rtrw-print-iframe';
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const frameDoc = iframe.contentWindow?.document;
  if (frameDoc) {
    frameDoc.open();
    frameDoc.write(htmlDoc);
    frameDoc.close();
    window.setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    }, 250);
  }

  return {
    fileName: `Cetak_${titleLabel.replace(/\s+/g, '_')}`,
    titleLabel,
    scopeLabel,
    generatedAt: dateTime,
    totalRwCount,
    totalRtCount,
    totalKkCount,
  };
}
