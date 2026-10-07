import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  CitizenReport,
  CleanupEvent,
  KelurahanProfile,
  MonthlyReportTrend,
  RwGroup,
  WasteBankUnit,
} from '../types';

export interface MonthlyReportPdfOptions {
  periodKey: string; // 'Okt' | 'Sep' | ... | 'ALL_2026'
  rwFilter: string; // 'Semua' | 'RW 01' ...
  statusFilter: string; // 'Semua' | 'Selesai' | 'Sedang Ditangani' | 'Menunggu Verifikasi'
  archiveNumber: string;
  executiveNote: string;
  includeWasteBankSummary: boolean;
  includeCleanupSummary: boolean;
  includeRwBreakdown: boolean;
  profile: KelurahanProfile;
  reports: CitizenReport[];
  wasteUnits: WasteBankUnit[];
  cleanupEvents: CleanupEvent[];
  rwGroups: RwGroup[];
  monthlyTrends: MonthlyReportTrend[];
}

export interface GeneratedPdfResult {
  fileName: string;
  totalReportsIncluded: number;
  periodLabel: string;
  generatedAt: string;
}

const MONTH_KEYWORDS: Record<string, string[]> = {
  Jan: ['jan', 'januari', '-01-'],
  Feb: ['feb', 'februari', '-02-'],
  Mar: ['mar', 'maret', '-03-'],
  Apr: ['apr', 'april', '-04-'],
  Mei: ['mei', 'may', '-05-'],
  Jun: ['jun', 'juni', '-06-'],
  Jul: ['jul', 'juli', '-07-'],
  Agu: ['agu', 'agustus', 'aug', '-08-'],
  Sep: ['sep', 'september', '-09-'],
  Okt: ['okt', 'oktober', 'oct', '-10-'],
};

export function filterReportsForMonthlyArchive(
  reports: CitizenReport[],
  periodKey: string,
  rwFilter: string,
  statusFilter: string
): { matchedReports: CitizenReport[]; usedFallbackAllPeriod: boolean } {
  const byRwAndStatus = reports.filter((r) => {
    const matchRw = rwFilter === 'Semua' || r.rw === rwFilter;
    const matchStatus = statusFilter === 'Semua' || r.status === statusFilter;
    return matchRw && matchStatus;
  });

  if (periodKey === 'ALL_2026') {
    return { matchedReports: byRwAndStatus, usedFallbackAllPeriod: false };
  }

  const keywords = MONTH_KEYWORDS[periodKey] || [periodKey.toLowerCase()];
  const byMonth = byRwAndStatus.filter((r) => {
    const dateText = `${r.createdAt || ''} ${r.updatedAt || ''} ${r.completedAt || ''}`.toLowerCase();
    return keywords.some((kw) => dateText.includes(kw));
  });

  if (byMonth.length > 0) {
    return { matchedReports: byMonth, usedFallbackAllPeriod: false };
  }

  return { matchedReports: byRwAndStatus, usedFallbackAllPeriod: true };
}

export function generateMonthlyEnvironmentalPdf(
  options: MonthlyReportPdfOptions
): GeneratedPdfResult {
  const {
    periodKey,
    rwFilter,
    statusFilter,
    archiveNumber,
    executiveNote,
    includeWasteBankSummary,
    includeCleanupSummary,
    includeRwBreakdown,
    profile,
    reports,
    wasteUnits,
    cleanupEvents,
    rwGroups,
    monthlyTrends,
  } = options;

  const selectedTrend = monthlyTrends.find((m) => m.month === periodKey);
  const periodLabel =
    periodKey === 'ALL_2026'
      ? 'Rekapitulasi Tahunan (Januari – Oktober 2026)'
      : selectedTrend?.fullMonth.replace(' (Berjalan)', '') || `Bulan ${periodKey} 2026`;

  const { matchedReports, usedFallbackAllPeriod } = filterReportsForMonthlyArchive(
    reports,
    periodKey,
    rwFilter,
    statusFilter
  );

  const now = new Date();
  const formattedPrintDate = new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(now);
  const formattedPrintDateTime = `${formattedPrintDate}, ${now
    .toTimeString()
    .slice(0, 5)} WITA`;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 14;
  let cursorY = 14;

  // ================= 1. KOP SURAT RESMI PEMERINTAH KOTA MAKASSAR =================
  // Left decorative shield emblem box
  doc.setFillColor(13, 56, 104); // #0D3868
  doc.roundedRect(marginX, cursorY, 16, 19, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('KOTA', marginX + 8, cursorY + 7, { align: 'center' });
  doc.text('MAKASSAR', marginX + 8, cursorY + 11, { align: 'center' });
  doc.setFontSize(6);
  doc.text('PANAIKANG', marginX + 8, cursorY + 15.5, { align: 'center' });

  // Right decorative eco emblem box
  doc.setFillColor(28, 130, 55); // #1C8237
  doc.roundedRect(pageWidth - marginX - 16, cursorY, 16, 19, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text('ARSIP', pageWidth - marginX - 8, cursorY + 7, { align: 'center' });
  doc.text('FISIK', pageWidth - marginX - 8, cursorY + 11, { align: 'center' });
  doc.setFontSize(6);
  doc.text('RESMI', pageWidth - marginX - 8, cursorY + 15.5, { align: 'center' });

  // Center Official Header Text
  doc.setTextColor(13, 56, 104);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('PEMERINTAH KOTA MAKASSAR', pageWidth / 2, cursorY + 4.5, { align: 'center' });
  doc.setFontSize(12);
  doc.text('KECAMATAN PANAKKUKANG', pageWidth / 2, cursorY + 9.8, { align: 'center' });
  doc.setFontSize(14);
  doc.text('PEMERINTAH KELURAHAN PANAIKANG', pageWidth / 2, cursorY + 15.5, {
    align: 'center',
  });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(
    `Alamat: ${profile.officeAddress} | Telp: ${profile.phoneContact} | Email: ${profile.emailContact}`,
    pageWidth / 2,
    cursorY + 20.5,
    { align: 'center' }
  );

  cursorY += 23.5;

  // Double horizontal rule for official Indonesian government document
  doc.setDrawColor(13, 56, 104);
  doc.setLineWidth(0.75);
  doc.line(marginX, cursorY, pageWidth - marginX, cursorY);
  doc.setLineWidth(0.25);
  doc.line(marginX, cursorY + 1.2, pageWidth - marginX, cursorY + 1.2);

  cursorY += 6.5;

  // ================= 2. JUDUL DOKUMEN & IDENTITAS ARSIP FISIK =================
  doc.setTextColor(13, 56, 104);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11.5);
  doc.text(
    'LAPORAN BULANAN PERMASALAHAN LINGKUNGAN & KEBERSIHAN WILAYAH',
    pageWidth / 2,
    cursorY,
    { align: 'center' }
  );
  cursorY += 4.8;
  doc.setFontSize(8.5);
  doc.setTextColor(28, 130, 55);
  doc.text(
    `DOKUMEN ARSIP FISIK RESMI LURAH PANAIKANG — NOMOR: ${archiveNumber}`,
    pageWidth / 2,
    cursorY,
    { align: 'center' }
  );

  cursorY += 4.5;

  // Metadata Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.roundedRect(marginX, cursorY, pageWidth - marginX * 2, 18, 1.5, 1.5, 'FD');

  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  const leftColX = marginX + 3.5;
  const rightColX = pageWidth / 2 + 2;

  doc.setFont('helvetica', 'bold');
  doc.text('Periode Laporan', leftColX, cursorY + 5);
  doc.text('Cakupan Wilayah RW', leftColX, cursorY + 9.8);
  doc.text('Filter Status Laporan', leftColX, cursorY + 14.6);

  doc.setFont('helvetica', 'normal');
  doc.text(`: ${periodLabel}`, leftColX + 33, cursorY + 5);
  doc.text(
    `: ${rwFilter === 'Semua' ? `Seluruh Wilayah (${profile.totalRw} RW / ${profile.totalRt} RT)` : rwFilter}`,
    leftColX + 33,
    cursorY + 9.8
  );
  doc.text(`: ${statusFilter}`, leftColX + 33, cursorY + 14.6);

  doc.setFont('helvetica', 'bold');
  doc.text('Nomor Arsip Fisik', rightColX, cursorY + 5);
  doc.text('Pejabat Pengesah', rightColX, cursorY + 9.8);
  doc.text('Tanggal Cetak Arsip', rightColX, cursorY + 14.6);

  doc.setFont('helvetica', 'normal');
  doc.text(`: ${archiveNumber}`, rightColX + 32, cursorY + 5);
  doc.text(`: ${profile.lurahName}`, rightColX + 32, cursorY + 9.8);
  doc.text(`: ${formattedPrintDateTime}`, rightColX + 32, cursorY + 14.6);

  cursorY += 23;

  // ================= 3. BAGIAN I: RINGKASAN EKSEKUTIF & INDIKATOR KINERJA =================
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(13, 56, 104);
  doc.text(
    'I. RINGKASAN EKSEKUTIF PENANGANAN PERMASALAHAN LINGKUNGAN BULANAN',
    marginX,
    cursorY
  );
  cursorY += 2.5;

  const totalLive = matchedReports.length;
  const selesaiLive = matchedReports.filter((r) => r.status === 'Selesai').length;
  const prosesLive = matchedReports.filter((r) => r.status === 'Sedang Ditangani').length;
  const menungguLive = matchedReports.filter((r) => r.status === 'Menunggu Verifikasi').length;
  const completionRatio =
    totalLive > 0 ? Math.round((selesaiLive / totalLive) * 100) : 100;

  const totalOrganik = wasteUnits.reduce((acc, u) => acc + u.organikKg, 0);
  const totalAnorganik = wasteUnits.reduce((acc, u) => acc + u.anorganikKg, 0);
  const totalResidu = wasteUnits.reduce((acc, u) => acc + u.residuKg, 0);
  const totalWasteAll = totalOrganik + totalAnorganik + totalResidu;
  const reductionPct = Math.round(
    ((totalOrganik + totalAnorganik) / Math.max(totalWasteAll, 1)) * 100
  );

  const completedCleanupCount = cleanupEvents.filter((c) => c.status === 'Tuntas').length;
  const totalCleanupWasteKg = cleanupEvents.reduce(
    (acc, c) => acc + (Number(c.collectedWasteKg) || 0),
    0
  );

  const cleanlinessScore = selectedTrend?.indeksKebersihan || 95;

  autoTable(doc, {
    startY: cursorY,
    margin: { left: marginX, right: marginX },
    head: [
      [
        'Indikator Kinerja Lingkungan Kelurahan',
        'Capaian Terdaftar',
        'Indikator Pengelolaan Sampah & Kerja Bakti',
        'Capaian Wilayah',
      ],
    ],
    body: [
      [
        'Total Laporan Permasalahan Lingkungan',
        `${totalLive} Laporan Warga${
          selectedTrend ? ` (Tren Bulan ${selectedTrend.month}: ${selectedTrend.totalLaporan})` : ''
        }`,
        'Total Reduksi Sampah (Organik + Anorganik)',
        `${(totalOrganik + totalAnorganik).toLocaleString('id-ID')} kg (${reductionPct}% Reduksi TPA)`,
      ],
      [
        'Laporan Selesai Ditangani (Tuntas)',
        `${selesaiLive} Laporan (${completionRatio}% Tuntas)`,
        'Volume Sampah Organik / Kompos BSU',
        `${totalOrganik.toLocaleString('id-ID')} kg / bulan (${wasteUnits.length} Unit BSU)`,
      ],
      [
        'Laporan Sedang Ditangani Satgas',
        `${prosesLive} Laporan Aktif`,
        'Volume Sampah Anorganik Daur Ulang',
        `${totalAnorganik.toLocaleString('id-ID')} kg / bulan`,
      ],
      [
        'Laporan Menunggu Verifikasi',
        `${menungguLive} Laporan`,
        'Pelaksanaan Kerja Bakti Terpadu',
        `${cleanupEvents.length} Kegiatan (${completedCleanupCount} Tuntas · ${totalCleanupWasteKg} kg diangkut)`,
      ],
      [
        'Indeks Kebersihan Wilayah Kelurahan',
        `${cleanlinessScore} / 100 (Kategori Sangat Baik)`,
        'Partisipasi Rumah Tangga Nasabah BSU',
        `${wasteUnits.reduce((s, u) => s + u.activeHouseholds, 0)} KK Aktif Memilah`,
      ],
    ],
    theme: 'grid',
    headStyles: {
      fillColor: [13, 56, 104],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    bodyStyles: {
      fontSize: 7.8,
      textColor: [30, 41, 59],
      cellPadding: 2.2,
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 48, fillColor: [248, 250, 252] },
      1: { cellWidth: 43 },
      2: { fontStyle: 'bold', cellWidth: 48, fillColor: [248, 250, 252] },
      3: { cellWidth: 43 },
    },
  });

  cursorY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;

  // ================= 4. BAGIAN II: REKAPITULASI PER KATEGORI PERMASALAHAN =================
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(13, 56, 104);
  doc.text(
    'II. REKAPITULASI PERMASALAHAN LINGKUNGAN BERDASARKAN KATEGORI',
    marginX,
    cursorY
  );
  cursorY += 2.5;

  const categories = Array.from(
    new Set([
      'Sampah Liar & TPS',
      'Drainase & Genangan',
      'Pohon & Ruang Hijau',
      'Ketertiban & Fasum',
      ...matchedReports.map((r) => r.category),
    ])
  );

  const categoryRows = categories.map((cat, idx) => {
    const inCat = matchedReports.filter((r) => r.category === cat);
    const catTotal = inCat.length;
    const catSelesai = inCat.filter((r) => r.status === 'Selesai').length;
    const catProses = inCat.filter((r) => r.status === 'Sedang Ditangani').length;
    const catMenunggu = inCat.filter((r) => r.status === 'Menunggu Verifikasi').length;
    const pct = totalLive > 0 ? `${Math.round((catTotal / totalLive) * 100)}%` : '0%';
    return [
      String(idx + 1),
      cat,
      String(catTotal),
      String(catSelesai),
      String(catProses),
      String(catMenunggu),
      pct,
    ];
  });

  autoTable(doc, {
    startY: cursorY,
    margin: { left: marginX, right: marginX },
    head: [
      [
        'No',
        'Kategori Permasalahan Lingkungan',
        'Total Laporan',
        'Selesai (Tuntas)',
        'Sedang Ditangani',
        'Menunggu Verifikasi',
        'Proporsi (%)',
      ],
    ],
    body: categoryRows,
    theme: 'grid',
    headStyles: {
      fillColor: [28, 130, 55],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    bodyStyles: {
      fontSize: 7.8,
      textColor: [30, 41, 59],
      cellPadding: 2,
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { fontStyle: 'bold', cellWidth: 62 },
      2: { halign: 'center', cellWidth: 22 },
      3: { halign: 'center', cellWidth: 24 },
      4: { halign: 'center', cellWidth: 24 },
      5: { halign: 'center', cellWidth: 22 },
      6: { halign: 'center', cellWidth: 18 },
    },
  });

  cursorY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;

  // ================= 5. OPTIONAL: REKAPITULASI PER WILAYAH RW =================
  if (includeRwBreakdown && rwGroups.length > 0) {
    if (cursorY > pageHeight - 55) {
      doc.addPage();
      cursorY = 16;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(13, 56, 104);
    doc.text(
      'III. DISTRIBUSI PERMASALAHAN LINGKUNGAN & PENANGANAN PER WILAYAH RW',
      marginX,
      cursorY
    );
    cursorY += 2.5;

    const rwRows = rwGroups.map((rw, idx) => {
      const rwReports = matchedReports.filter((r) => r.rw === rw.rwCode);
      const rwSelesai = rwReports.filter((r) => r.status === 'Selesai').length;
      const rwProses = rwReports.filter((r) => r.status !== 'Selesai').length;
      const bsu = wasteUnits.find((u) => u.rw === rw.rwCode);
      return [
        String(idx + 1),
        rw.rwCode,
        rw.ketuaRwName,
        `${rw.rtList?.length || 0} RT`,
        String(rwReports.length),
        String(rwSelesai),
        String(rwProses),
        bsu ? `${bsu.unitName} (${bsu.organikKg + bsu.anorganikKg} kg pilah)` : '-',
      ];
    });

    autoTable(doc, {
      startY: cursorY,
      margin: { left: marginX, right: marginX },
      head: [
        [
          'No',
          'Wilayah',
          'Ketua RW Penanggung Jawab',
          'Jml RT',
          'Total Laporan',
          'Tuntas',
          'Proses/Baru',
          'Unit Bank Sampah (BSU) Aktif',
        ],
      ],
      body: rwRows,
      theme: 'grid',
      headStyles: {
        fillColor: [2, 119, 189],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 7.8,
      },
      bodyStyles: {
        fontSize: 7.5,
        textColor: [30, 41, 59],
        cellPadding: 1.9,
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 9 },
        1: { fontStyle: 'bold', cellWidth: 16 },
        2: { cellWidth: 42 },
        3: { halign: 'center', cellWidth: 15 },
        4: { halign: 'center', cellWidth: 18 },
        5: { halign: 'center', cellWidth: 15 },
        6: { halign: 'center', cellWidth: 18 },
        7: { cellWidth: 49 },
      },
    });

    cursorY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;
  }

  // ================= 6. DAFTAR RINCIAN LAPORAN PERMASALAHAN LINGKUNGAN WARGA =================
  if (cursorY > pageHeight - 55) {
    doc.addPage();
    cursorY = 16;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(13, 56, 104);
  const reportSectionNumber = includeRwBreakdown ? 'IV' : 'III';
  doc.text(
    `${reportSectionNumber}. DAFTAR RINCIAN LAPORAN PERMASALAHAN LINGKUNGAN WARGA & TINDAK LANJUT`,
    marginX,
    cursorY
  );
  cursorY += 2;

  if (usedFallbackAllPeriod) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `Catatan Arsip: Menampilkan daftar lengkap laporan warga yang tercatat di sistem Satu Data Kelurahan Panaikang.`,
      marginX,
      cursorY + 2.5
    );
    cursorY += 4.5;
  } else {
    cursorY += 1;
  }

  const reportTableRows =
    matchedReports.length > 0
      ? matchedReports.map((rep, idx) => [
          String(idx + 1),
          `${rep.ticketCode}\n${rep.createdAt}`,
          `${rep.rw} / ${rep.rt}\n${rep.locationName}`,
          `${rep.title}\n[${rep.category} · Urgensi: ${rep.urgency}]`,
          `${rep.reporterName}\n(${rep.reporterPhone})`,
          rep.status,
          `${rep.assignedTeam || '-'}\nHasil: ${rep.responseNote || '-'}`,
        ])
      : [
          [
            '-',
            '-',
            '-',
            'Tidak ada laporan pada filter ini',
            '-',
            '-',
            '-',
          ],
        ];

  autoTable(doc, {
    startY: cursorY,
    margin: { left: marginX, right: marginX },
    head: [
      [
        'No',
        'No. Tiket & Waktu Lapor',
        'Wilayah & Lokasi Titik',
        'Judul & Kategori Permasalahan',
        'Identitas Pelapor',
        'Status',
        'Tim Penindak & Hasil Tindak Lanjut',
      ],
    ],
    body: reportTableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [13, 56, 104],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
    },
    bodyStyles: {
      fontSize: 7,
      textColor: [30, 41, 59],
      cellPadding: 2,
      valign: 'top',
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      1: { cellWidth: 25 },
      2: { cellWidth: 28 },
      3: { cellWidth: 39 },
      4: { cellWidth: 24 },
      5: { halign: 'center', fontStyle: 'bold', cellWidth: 19 },
      6: { cellWidth: 39 },
    },
  });

  cursorY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;

  // ================= 7. OPTIONAL: BANK SAMPAH & KERJA BAKTI SUMMARY =================
  if (includeWasteBankSummary && wasteUnits.length > 0) {
    if (cursorY > pageHeight - 55) {
      doc.addPage();
      cursorY = 16;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(13, 56, 104);
    doc.text(
      'REKAPITULASI CAPAIAN BANK SAMPAH UNIT (BSU) KELURAHAN PANAIKANG',
      marginX,
      cursorY
    );
    cursorY += 2.5;

    autoTable(doc, {
      startY: cursorY,
      margin: { left: marginX, right: marginX },
      head: [
        [
          'No',
          'Wilayah',
          'Nama Bank Sampah Unit (BSU)',
          'Koordinator',
          'Organik (kg)',
          'Anorganik (kg)',
          'Residu TPA (kg)',
          'KK Aktif',
        ],
      ],
      body: wasteUnits.map((u, i) => [
        String(i + 1),
        u.rw,
        u.unitName,
        u.coordinator,
        String(u.organikKg),
        String(u.anorganikKg),
        String(u.residuKg),
        `${u.activeHouseholds} KK`,
      ]),
      theme: 'grid',
      headStyles: {
        fillColor: [239, 108, 0],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 7.5,
      },
      bodyStyles: {
        fontSize: 7.3,
        textColor: [30, 41, 59],
        cellPadding: 1.8,
      },
    });

    cursorY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;
  }

  if (includeCleanupSummary && cleanupEvents.length > 0) {
    if (cursorY > pageHeight - 55) {
      doc.addPage();
      cursorY = 16;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(13, 56, 104);
    doc.text(
      'REKAPITULASI PELAKSANAAN KERJA BAKTI & JUMAT ASRI WILAYAH',
      marginX,
      cursorY
    );
    cursorY += 2.5;

    autoTable(doc, {
      startY: cursorY,
      margin: { left: marginX, right: marginX },
      head: [
        [
          'No',
          'Tanggal Pelaksanaan',
          'Nama Kegiatan Kerja Bakti',
          'Wilayah RW/RT',
          'Status',
          'Partisipan',
          'Sampah Terangkut',
        ],
      ],
      body: cleanupEvents.map((ev, i) => [
        String(i + 1),
        ev.date,
        ev.title,
        `${ev.rw} (${ev.rtScope})`,
        ev.status,
        `${ev.registeredParticipants} Warga`,
        ev.status === 'Tuntas' ? `${ev.collectedWasteKg} kg` : 'Terjadwal',
      ]),
      theme: 'grid',
      headStyles: {
        fillColor: [94, 53, 177],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 7.5,
      },
      bodyStyles: {
        fontSize: 7.3,
        textColor: [30, 41, 59],
        cellPadding: 1.8,
      },
    });

    cursorY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;
  }

  // ================= 8. CATATAN EVALUASI & LEMBAR PENGESAHAN ARSIP FISIK =================
  if (cursorY > pageHeight - 72) {
    doc.addPage();
    cursorY = 18;
  }

  // Catatan Evaluasi Lurah Box
  doc.setFillColor(240, 253, 244);
  doc.setDrawColor(187, 247, 208);
  doc.roundedRect(marginX, cursorY, pageWidth - marginX * 2, 18, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(20, 83, 45);
  doc.text('CATATAN EVALUASI & ARAHAN EKSEKUTIF LURAH PANAIKANG:', marginX + 3.5, cursorY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  const wrappedNote = doc.splitTextToSize(
    executiveNote ||
      'Seluruh laporan permasalahan lingkungan warga pada periode ini telah diverifikasi dan ditindaklanjuti bersama Satgas Kebersihan, Koordinator Bank Sampah Unit (BSU), dan Ketua RT/RW. Dokumen ini dicetak sebagai arsip fisik resmi Kelurahan Panaikang.',
    pageWidth - marginX * 2 - 7
  );
  doc.text(wrappedNote.slice(0, 3), marginX + 3.5, cursorY + 9.8);

  cursorY += 24;

  // Dual Signature Block for Physical Archiving
  const leftSignCenterX = marginX + 42;
  const rightSignCenterX = pageWidth - marginX - 45;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);

  doc.text('Disiapkan & Diverifikasi Oleh,', leftSignCenterX, cursorY + 4, {
    align: 'center',
  });
  doc.setFont('helvetica', 'bold');
  doc.text('Sekretaris Kelurahan / Admin Satu Data', leftSignCenterX, cursorY + 8.5, {
    align: 'center',
  });

  doc.setFont('helvetica', 'normal');
  doc.text(`Makassar, ${formattedPrintDate}`, rightSignCenterX, cursorY, {
    align: 'center',
  });
  doc.text('Mengetahui & Mengesahkan,', rightSignCenterX, cursorY + 4, {
    align: 'center',
  });
  doc.setFont('helvetica', 'bold');
  doc.text('LURAH PANAIKANG', rightSignCenterX, cursorY + 8.5, {
    align: 'center',
  });

  // Dotted hint for wet stamp & physical signature
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(6.8);
  doc.setTextColor(148, 163, 184);
  doc.text('[ Tanda Tangan & Arsip ]', leftSignCenterX, cursorY + 20, { align: 'center' });
  doc.text('[ Tanda Tangan Basah & Stempel Kelurahan ]', rightSignCenterX, cursorY + 20, {
    align: 'center',
  });

  // Officer Names & NIP
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(13, 56, 104);
  doc.text(profile.sekretarisName || 'Adi (Sekretaris Kelurahan)', leftSignCenterX, cursorY + 30, {
    align: 'center',
  });
  doc.text(profile.lurahName, rightSignCenterX, cursorY + 30, {
    align: 'center',
  });

  // Underline names
  doc.setDrawColor(13, 56, 104);
  doc.setLineWidth(0.3);
  doc.line(leftSignCenterX - 30, cursorY + 31.2, leftSignCenterX + 30, cursorY + 31.2);
  doc.line(rightSignCenterX - 32, cursorY + 31.2, rightSignCenterX + 32, cursorY + 31.2);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('Koordinator Operator Satu Data', leftSignCenterX, cursorY + 35, {
    align: 'center',
  });
  doc.text(`NIP. ${profile.lurahNip}`, rightSignCenterX, cursorY + 35, {
    align: 'center',
  });

  // ================= 9. FOOTER ON ALL PAGES =================
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.25);
    doc.line(marginX, pageHeight - 11, pageWidth - marginX, pageHeight - 11);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `Arsip Fisik Resmi Pemerintah Kelurahan Panaikang · No: ${archiveNumber} · Periode: ${periodLabel}`,
      marginX,
      pageHeight - 7
    );
    doc.text(`Halaman ${p} dari ${totalPages}`, pageWidth - marginX, pageHeight - 7, {
      align: 'right',
    });
  }

  const safePeriodSlug = periodLabel
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
  const fileName = `Arsip_Laporan_Bulanan_Lingkungan_Kelurahan_Panaikang_${safePeriodSlug}.pdf`;

  doc.save(fileName);

  return {
    fileName,
    totalReportsIncluded: matchedReports.length,
    periodLabel,
    generatedAt: formattedPrintDateTime,
  };
}
