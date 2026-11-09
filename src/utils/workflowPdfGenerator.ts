import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { KelurahanProfile } from '../types';
import { INITIAL_KELURAHAN_PROFILE } from '../data/initialData';
import {
  drawContinuationPdfHeader,
  drawOfficialPdfKopSurat,
} from './officialKopSurat';

export interface WorkflowPdfResult {
  fileName: string;
  generatedAt: string;
  totalPages: number;
}

export function generateApplicationWorkflowPdf(
  customProfile?: Partial<KelurahanProfile>
): WorkflowPdfResult {
  const profile: KelurahanProfile = {
    ...INITIAL_KELURAHAN_PROFILE,
    ...(customProfile || {}),
    officeAddress:
      customProfile?.officeAddress && customProfile.officeAddress.trim()
        ? customProfile.officeAddress
        : 'Jl. Urip Sumoharjo KM. 5, Kelurahan Panaikang, Kecamatan Panakkukang, Kota Makassar',
    phoneContact:
      customProfile?.phoneContact && customProfile.phoneContact.trim()
        ? customProfile.phoneContact
        : '0895-0895-6512',
    postalCode:
      customProfile?.postalCode && customProfile.postalCode.trim()
        ? customProfile.postalCode
        : '90231',
    lurahName:
      customProfile?.lurahName && customProfile.lurahName.trim()
        ? customProfile.lurahName
        : 'Muthmainnah, SE, MM',
  };

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 14;
  const docNumber = 'SOP-MODUL/PNK/XI/2026';
  const docTitleShort = 'PANDUAN ALUR KERJA MENU APLIKASI SATU DATA KELURAHAN PANAIKANG';

  const now = new Date();
  const formattedPrintDate = new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(now);

  // 1. Draw Official Kop Surat on Page 1
  let cursorY = drawOfficialPdfKopSurat(doc, profile, marginX, 'standard');

  // Document Main Title Banner
  doc.setFillColor(13, 56, 104);
  doc.roundedRect(marginX, cursorY, pageWidth - marginX * 2, 18, 2, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text(
    'DOKUMEN PANDUAN & ALUR KERJA (SOP) SELURUH MENU APLIKASI',
    pageWidth / 2,
    cursorY + 6.5,
    { align: 'center' }
  );

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(224, 242, 254);
  doc.text(
    'Sistem Satu Data, Pelayanan Kelurahan & Smart Environment Kelurahan Panaikang — Kota Makassar',
    pageWidth / 2,
    cursorY + 12,
    { align: 'center' }
  );
  doc.setFontSize(7.5);
  doc.text(
    `Nomor Dokumen: ${docNumber}   |   Tanggal Cetak: ${formattedPrintDate}`,
    pageWidth / 2,
    cursorY + 16,
    { align: 'center' }
  );

  cursorY += 23;

  // Intro Summary Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.roundedRect(marginX, cursorY, pageWidth - marginX * 2, 15, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.2);
  doc.setTextColor(13, 56, 104);
  doc.text('RINGKASAN CARA KERJA APLIKASI:', marginX + 3, cursorY + 4.8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.8);
  doc.setTextColor(51, 65, 85);
  const introText = doc.splitTextToSize(
    'Aplikasi ini terbagi menjadi 2 bagian utama yang saling terhubung secara otomatis (Real-Time): (1) Halaman Warga/Publik untuk masyarakat mengakses informasi, mengurus pra-registrasi surat, dan mengirim pengaduan online; serta (2) Halaman Panel Admin & Dashboard Lurah untuk petugas kelurahan memverifikasi berkas, menindaklanjuti laporan warga, dan menerima notifikasi WhatsApp otomatis.',
    pageWidth - marginX * 2 - 6
  );
  doc.text(introText, marginX + 3, cursorY + 9.2);

  cursorY += 20;

  // Section 1 Header
  doc.setFillColor(16, 185, 129);
  doc.roundedRect(marginX, cursorY, pageWidth - marginX * 2, 7.5, 1.2, 1.2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text(
    'BAGIAN I : ALUR KERJA HALAMAN WARGA / PUBLIK ( AKSES MASYARAKAT )',
    marginX + 3,
    cursorY + 5.1
  );

  cursorY += 9.5;

  const citizenWorkflowRows = [
    [
      '1',
      'Beranda\n(Halaman Utama)',
      'Pusat informasi cepat saat warga pertama kali membuka aplikasi.',
      '1. Warga membuka aplikasi -> langsung melihat sambutan Lurah Panaikang, ringkasan statistik wilayah (RW/RT), dan pengumuman penting.\n' +
        '2. Warga membaca berita/warta kegiatan kelurahan terbaru atau membuka tautan Instagram resmi @kelurahan.panaikang.\n' +
        '3. Warga menekan tombol pintasan cepat untuk langsung menuju menu Pelayanan Surat atau Pengaduan Warga.',
    ],
    [
      '2',
      'Profil Kelurahan\n& Struktur RT/RW',
      'Menampilkan data resmi pemerintahan, pejabat, dan wilayah Kelurahan Panaikang.',
      '1. Warga memilih menu Profil Kelurahan -> sistem menampilkan Visi & Misi, alamat kantor, jam layanan, dan batas wilayah (Utara, Selatan, Timur, Barat).\n' +
        '2. Warga melihat Bagan Struktur Organisasi (Lurah, Sekretaris Lurah, Kasi Pemerintahan, Kasi Pemberdayaan Masyarakat, Kasi Kebersihan beserta staf).\n' +
        '3. Warga memilih wilayah RW (RW 01 s.d. RW 07) untuk melihat daftar nama Ketua RW dan Ketua RT di lingkungannya.',
    ],
    [
      '3A',
      'Pelayanan Kelurahan:\nPra-Registrasi Surat\n(Urus Surat Online)',
      'Warga mendaftarkan berkas persyaratan surat dari rumah sebelum datang ke loket kantor kelurahan.',
      '1. Login Akun Warga -> warga masuk menggunakan akun warga terdaftar.\n' +
        '2. Pilih Jenis Layanan Surat -> memilih kategori (Kependudukan, Surat Keterangan Usaha, Domisili, Belum Menikah, Ahli Waris, SKTM, dll.).\n' +
        '3. Cek Syarat & Unggah Berkas -> melihat syarat wajib (KTP, KK, Pengantar RT/RW, Lunas PBB/Retribusi), mengisi NIK & biodata, lalu mengunggah foto berkas.\n' +
        '4. Terbit Nomor Tiket (REG-2026-XXXX) -> warga menyimpan/mencetak Bukti Pra-Registrasi.\n' +
        '5. Verifikasi Petugas & Lurah -> berkas diperiksa petugas di Panel Admin dan disetujui Lurah di Dashboard Lurah.\n' +
        '6. Datang ke Loket Kelurahan -> warga cukup menunjukkan Nomor Tiket sambil membawa berkas fisik asli untuk mengambil surat.',
    ],
    [
      '3B',
      'Pelayanan Kelurahan:\nPengaduan & Aspirasi\nWarga Online',
      'Tempat warga melaporkan masalah lingkungan (sampah, drainase, lampu jalan, ketertiban) secara online.',
      '1. Pilih Buat Pengaduan -> warga memilih kategori masalah, mengisi judul laporan, lokasi kejadian (RW/RT), uraian masalah, dan foto bukti.\n' +
        '2. Pilih Mode Identitas -> warga dapat menampilkan nama asli atau memilih Mode Anonim (identitas pelapor dirahasiakan).\n' +
        '3. Klik Kirim Pengaduan -> sistem otomatis melakukan 2 proses sekaligus:\n' +
        '   a) Memberikan Nomor Tiket Pengaduan (PGD-2026-XXXX) kepada warga.\n' +
        '   b) Mengirim pesan WhatsApp otomatis (via Fonnte Gateway) langsung ke HP Lurah & Admin tanpa memakai WA pribadi warga.\n' +
        '4. Lacak Status Laporan -> warga memasukkan Nomor Tiket untuk memantau apakah laporan Menunggu Verifikasi, Sedang Ditangani Satgas, atau Selesai.',
    ],
    [
      '4',
      'Pengelolaan Sampah\n(Bank Sampah, Teba\n& Biopori)',
      'Memantau kebersihan lingkungan, Bank Sampah Unit (BSU), kompos Teba, dan resapan Biopori.',
      '1. Warga membuka menu Pengelolaan Sampah -> melihat grafik total volume sampah organik, anorganik, dan residu di Kelurahan Panaikang.\n' +
        '2. Cek Bank Sampah Unit (BSU) -> melihat daftar BSU di tiap RW, nama koordinator, jadwal penimbangan, dan jumlah nasabah aktif.\n' +
        '3. Cek Titik Teba & Biopori -> melihat lokasi, foto, dan status lubang kompos organik (Teba Modern) serta lubang resapan air (Biopori) per RW.',
    ],
    [
      '5',
      'Kerja Bakti &\nJadwal Siskamling\n(Ronda Malam)',
      'Informasi jadwal gotong royong kebersihan dan jadwal ronda malam Poskamling RW 01 - RW 07.',
      '1. Jadwal Kerja Bakti -> warga melihat pengumuman kerja bakti terdekat (tanggal, jam, titik kumpul, fokus kegiatan) serta galeri dokumentasi.\n' +
        '2. Jadwal Siskamling -> warga memilih wilayah RW (RW 01 s.d. RW 07) untuk melihat lokasi Posko Siskamling dan daftar petugas ronda malam Senin s.d. Minggu.',
    ],
    [
      '6',
      'Urban Farming\n(Kebun Lorong &\nPermintaan Bibit)',
      'Informasi kebun kelompok tani/PKK dan formulir pengajuan bibit tanaman gratis bagi warga.',
      '1. Lihat Kebun & Hasil Panen -> warga melihat lokasi kebun lorong di tiap RW, jenis tanaman yang dibudidayakan, dan rekap panen.\n' +
        '2. Ajukan Permintaan Bibit -> warga/kelompok tani mengisi form permintaan bibit (nama, RW/RT, jenis bibit, jumlah) -> dikirim ke Admin Kelurahan untuk disalurkan.',
    ],
  ];

  autoTable(doc, {
    startY: cursorY,
    margin: { left: marginX, right: marginX, top: 27, bottom: 18 },
    head: [['No', 'Nama Menu Warga', 'Fungsi Utama', 'Alur Kerja Langkah demi Langkah (Mudah Dipahami)']],
    body: citizenWorkflowRows,
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 7.8,
      cellPadding: 2.5,
      textColor: [30, 41, 59],
      lineColor: [203, 213, 225],
      lineWidth: 0.25,
      valign: 'top',
    },
    headStyles: {
      fillColor: [13, 56, 104],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'left',
    },
    columnStyles: {
      0: { cellWidth: 9, halign: 'center', fontStyle: 'bold' },
      1: { cellWidth: 34, fontStyle: 'bold', textColor: [13, 56, 104] },
      2: { cellWidth: 42 },
      3: { cellWidth: pageWidth - marginX * 2 - 85 },
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    didDrawPage: (data) => {
      if (data.pageNumber > 1) {
        drawContinuationPdfHeader(doc, docTitleShort, docNumber, marginX);
      }
    },
  });

  // Get Y position after first table
  let afterTable1Y = (doc as any).lastAutoTable?.finalY || cursorY + 80;

  if (afterTable1Y + 35 > pageHeight - 20) {
    doc.addPage();
    afterTable1Y = drawContinuationPdfHeader(doc, docTitleShort, docNumber, marginX);
  } else {
    afterTable1Y += 7;
  }

  // Section 2 Header: Panel Admin & Dashboard Lurah
  doc.setFillColor(13, 56, 104);
  doc.roundedRect(marginX, afterTable1Y, pageWidth - marginX * 2, 7.5, 1.2, 1.2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text(
    'BAGIAN II : ALUR KERJA PANEL ADMIN & DASHBOARD EKSEKUTIF LURAH ( INTERNAL KELURAHAN )',
    marginX + 3,
    afterTable1Y + 5.1
  );

  const adminStartY = afterTable1Y + 9.5;

  const adminWorkflowRows = [
    [
      '1',
      'Dashboard Eksekutif\nLurah Panaikang',
      'Lurah &\nMaster Admin',
      '1. Lurah login -> melihat ringkasan eksekutif seluruh kondisi kelurahan dalam 1 layar (statistik surat masuk, pengaduan warga, bank sampah, dan grafik kinerja RW).\n' +
        '2. Persetujuan Layanan & Disposisi -> Lurah memeriksa berkas pra-registrasi surat atau pengaduan prioritas, memberi catatan instruksi, lalu klik Setujui / Tolak / Kembalikan.\n' +
        '3. Pantau WhatsApp Gateway -> melihat log pengiriman pesan otomatis dan menguji koneksi WA langsung dari dashboard.',
    ],
    [
      '2',
      'Kelola Pelayanan &\nPengaduan Warga',
      'Petugas Loket,\nSeklur & Kasi',
      '1. Permohonan surat / pengaduan warga yang baru dikirim muncul di daftar antrean dengan status "Menunggu Verifikasi".\n' +
        '2. Untuk Pra-Registrasi Surat: Petugas memeriksa unggahan KTP/KK/Pengantar RT-RW, mengisi Nomor Registrasi Surat, lalu mengubah status ke Diproses / Selesai.\n' +
        '3. Untuk Pengaduan Warga: Petugas menugaskan tim lapangan (Satgas Kebersihan/Drainase), mengisi tanggapan resmi, dan mengunggah foto bukti tindak lanjut.\n' +
        '4. Cetak Bukti / Rekap PDF -> mencetak lembar pelayanan resmi atau laporan rekapitulasi bulanan ber-Kop Surat Kelurahan.',
    ],
    [
      '3',
      'Kelola WhatsApp\nGateway (Fonnte)',
      'Master Admin\n& Lurah',
      '1. Kartu 01 (Status & Token Fonnte) -> memantau status perangkat pengirim (089508956512 - Layanan Kelurahan Panaikang), sisa kuota pesan, dan menyimpan Token Fonnte ke Cloud Database.\n' +
        '2. Kartu 02 (Daftar Nomor Penerima) -> menambah/mengatur nomor WhatsApp pejabat (Lurah, Master Admin, Kasi, Ketua RW) yang otomatis menerima pesan saat laporan warga masuk, serta tombol "Tes Auto-WA".\n' +
        '3. Kartu 03 (Riwayat & Log Pengiriman) -> memantau status setiap pengiriman WA otomatis (Terkirim Otomatis / Gagal Kirim) yang tersinkronisasi di server & Cloud.',
    ],
    [
      '4',
      'Kelola Profil Kelurahan\n& Struktur Pejabat',
      'Sekretaris Lurah\n& Master Admin',
      '1. Memperbarui data Lurah (Nama, NIP, Pangkat, Periode, Foto, Sambutan), Visi & Misi, alamat kantor, jam layanan, dan batas wilayah.\n' +
        '2. Mengelola data Pejabat Struktural (Seklur, Kasi Pemerintahan, Kasi Pemberdayaan, Kasi Kebersihan) serta daftar staf per seksi -> saat disimpan, halaman publik langsung terupdate otomatis.',
    ],
    [
      '5',
      'Kelola Informasi &\nWarta Kelurahan',
      'Admin Humas /\nSekretariat',
      '1. Klik "+ Tambah Informasi Baru" -> mengisi judul berita, kategori pengumuman, tanggal, ringkasan, isi lengkap, dan mengunggah foto kegiatan.\n' +
        '2. Memilih opsi "Sematkan di Utama (Pin)" bila pengumuman bersifat penting -> berita langsung tampil di Beranda Warga.',
    ],
    [
      '6',
      'Kelola Bank Sampah,\nTeba & Biopori',
      'Kasi Kebersihan\n& Lingkungan',
      '1. Mencatat dan memperbarui data Bank Sampah Unit (BSU) per RW serta log penimbangan sampah (Organik, Anorganik, Residu dalam Kg).\n' +
        '2. Menambah/mengedit lokasi Titik Teba Modern dan Lubang Resapan Biopori beserta foto dan kondisinya -> grafik di halaman depan otomatis terhitung ulang.',
    ],
    [
      '7',
      'Kelola Kerja Bakti &\nUrban Farming',
      'Kasi Kebersihan &\nKasi Pemberdayaan',
      '1. Menu Kerja Bakti -> membuat jadwal gotong royong baru (lokasi, tanggal, target peserta) dan mengunggah foto dokumentasi pelaksanaan.\n' +
        '2. Menu Urban Farming -> mengelola data lokasi kebun lorong, kelompok tani, stok bibit/sarana pertanian, serta memverifikasi permohonan bibit dari warga.',
    ],
    [
      '8',
      'Kelola Data RT/RW &\nJadwal Siskamling',
      'Kasi Pemerintahan\n& Sekretariat',
      '1. Data Wilayah RT/RW -> memilih RW 01 s.d. RW 07 untuk memperbarui nama Ketua RW, nomor HP, cakupan jalan, serta daftar Ketua RT di bawahnya.\n' +
        '2. Jadwal Siskamling -> mengatur nama Posko Siskamling tiap RW dan daftar petugas jaga ronda malam dari hari Senin sampai Minggu.',
    ],
    [
      '9',
      'Otoritas Admin, Akun\nWarga, Parameter Menu\n& Log Aktivitas',
      'Master Admin\n& Lurah',
      '1. Otoritas Admin -> menambah/mengatur akun petugas kelurahan dan membatasi hak akses tab/modul sesuai jabatan masing-masing.\n' +
        '2. Parameter Menu Warga -> mengatur menu mana saja yang dapat dibuka oleh Tamu (tanpa login) dan Warga Terdaftar.\n' +
        '3. Log Aktivitas & Trafik -> memantau rekaman audit otomatis setiap perubahan data oleh admin (siapa, kapan, apa yang diubah) serta statistik pengunjung harian.',
    ],
  ];

  autoTable(doc, {
    startY: adminStartY,
    margin: { left: marginX, right: marginX, top: 27, bottom: 18 },
    head: [['No', 'Nama Modul Admin', 'Pengguna', 'Alur Kerja Langkah demi Langkah (Mudah Dipahami)']],
    body: adminWorkflowRows,
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 7.8,
      cellPadding: 2.5,
      textColor: [30, 41, 59],
      lineColor: [203, 213, 225],
      lineWidth: 0.25,
      valign: 'top',
    },
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'left',
    },
    columnStyles: {
      0: { cellWidth: 9, halign: 'center', fontStyle: 'bold' },
      1: { cellWidth: 34, fontStyle: 'bold', textColor: [13, 56, 104] },
      2: { cellWidth: 28, fontStyle: 'bold', textColor: [5, 150, 105] },
      3: { cellWidth: pageWidth - marginX * 2 - 71 },
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    didDrawPage: (data) => {
      if (data.pageNumber > 1) {
        drawContinuationPdfHeader(doc, docTitleShort, docNumber, marginX);
      }
    },
  });

  // Bagian III: Skema Alur Otomatisasi & Tanda Tangan
  let finalY = (doc as any).lastAutoTable?.finalY || adminStartY + 80;
  if (finalY + 68 > pageHeight - 18) {
    doc.addPage();
    finalY = drawContinuationPdfHeader(doc, docTitleShort, docNumber, marginX);
  } else {
    finalY += 7;
  }

  // Box Skema Alur Terpadu
  doc.setFillColor(240, 253, 244);
  doc.setDrawColor(16, 185, 129);
  doc.setLineWidth(0.35);
  doc.roundedRect(marginX, finalY, pageWidth - marginX * 2, 24, 1.8, 1.8, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(6, 95, 70);
  doc.text(
    'BAGIAN III : RINGKASAN ALUR SINKRONISASI REAL-TIME & NOTIFIKASI WHATSAPP OTOMATIS',
    marginX + 3.5,
    finalY + 5.5
  );

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.8);
  doc.setTextColor(20, 83, 45);
  const flowSummaryLines = [
    '1. ALUR PENGADUAN WARGA : Warga mengisi Form Pengaduan -> Klik Kirim -> (a) Tiket PGD-2026-XXXX terbit di layar warga, (b) Data tersimpan di Server & Cloud Firestore, (c) Fonnte WhatsApp Gateway otomatis mengirim pesan ke nomor Lurah & Admin -> Petugas menindaklanjuti -> Status berubah jadi "Selesai".',
    '2. ALUR URUS SURAT (PRA-REGISTRASI) : Warga pilih jenis surat & unggah syarat -> Tiket REG-2026-XXXX terbit -> Petugas Loket memverifikasi berkas -> Lurah menyetujui di Dashboard Lurah -> Warga datang ke kantor kelurahan membawa berkas asli untuk mengambil surat.',
  ];
  const wrappedFlow = doc.splitTextToSize(flowSummaryLines.join('\n'), pageWidth - marginX * 2 - 7);
  doc.text(wrappedFlow, marginX + 3.5, finalY + 10.5);

  finalY += 30;

  // Signature Block on Right
  const sigX = pageWidth - marginX - 68;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  doc.text(`Makassar, ${formattedPrintDate}`, sigX, finalY);
  doc.setFont('helvetica', 'bold');
  doc.text('LURAH PANAIKANG', sigX, finalY + 4.8);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(13, 56, 104);
  doc.text(profile.lurahName || 'Muthmainnah, SE, MM', sigX, finalY + 21);

  if (profile.lurahNip && profile.lurahNip.trim()) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text(`NIP. ${profile.lurahNip}`, sigX, finalY + 25.2);
  }

  // Page numbers & footer on all pages
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.25);
    doc.line(marginX, pageHeight - 12, pageWidth - marginX, pageHeight - 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.2);
    doc.setTextColor(100, 116, 139);
    doc.text(
      'Dokumen Panduan & Alur Kerja Aplikasi Satu Data — Pemerintah Kelurahan Panaikang, Kota Makassar',
      marginX,
      pageHeight - 8
    );
    doc.setFont('helvetica', 'bold');
    doc.text(`Halaman ${p} dari ${totalPages}`, pageWidth - marginX, pageHeight - 8, {
      align: 'right',
    });
  }

  const fileName = 'Panduan_Alur_Kerja_Aplikasi_Kelurahan_Panaikang.pdf';
  doc.save(fileName);

  return {
    fileName,
    generatedAt: formattedPrintDate,
    totalPages,
  };
}
