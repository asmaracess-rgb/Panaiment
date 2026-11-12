import React, { useState } from 'react';
import {
  X,
  FileText,
  Clock,
  ShieldCheck,
  Users,
  Building2,
  Recycle,
  Sprout,
  Calendar,
  Newspaper,
  MessageCircle,
  Activity,
  FileCheck,
  Send,
  Download,
  Search,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Layers,
  SlidersHorizontal,
} from 'lucide-react';
import { KelurahanProfile } from '../types';
import { generateApplicationWorkflowPdf } from '../utils/workflowPdfGenerator';

interface AdminWorkflowGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: KelurahanProfile;
}

interface WorkflowStep {
  stepNumber: number;
  title: string;
  actor: string;
  action: string;
  statusOutput?: string;
  notes?: string;
}

interface MenuWorkflowItem {
  id: string;
  category: 'pelayanan' | 'pemerintahan' | 'lingkungan' | 'sistem';
  categoryLabel: string;
  menuName: string;
  roleLevel: string;
  description: string;
  slaTarget?: string;
  inputs: string[];
  steps: WorkflowStep[];
  statusStates: { label: string; color: string; desc: string }[];
  automatedIntegrations: string[];
  finalOutput: string;
}

export const ADMIN_MENU_WORKFLOWS: MenuWorkflowItem[] = [
  // 1. Dashboard Admin Operator Layanan
  {
    id: 'wf-dashboard-operator',
    category: 'pelayanan',
    categoryLabel: 'Pelayanan & Operasional',
    menuName: 'Dashboard Admin Operator Layanan',
    roleLevel: 'Admin Operator / Front Office',
    description:
      'Pusat kendali dan monitor operasional harian front-office untuk memantau antrean registrasi online, aduan warga, peringatan SLA, dan daftar pekerjaan yang membutuhkan tindakan segera.',
    slaTarget: 'Tindak lanjut antrean maksimal 30–60 menit setelah diajukan warga',
    inputs: [
      'Aliran data pengajuan Pra Registrasi real-time dari Firestore',
      'Aliran laporan Pengaduan Online masuk dari masyarakat',
      'Status deadline SLA otomatis per tiket',
    ],
    steps: [
      {
        stepNumber: 1,
        title: 'Pemantauan Indikator Statistik Real-Time',
        actor: 'Admin Operator',
        action: 'Memantau kartu metrik: Pra Registrasi Masuk, Menunggu Verifikasi, Aduan Masuk, Perlu Perbaikan, Mendekati SLA, dan Terlambat.',
        notes: 'Angka bersumber langsung dari Firestore secara real-time.',
      },
      {
        stepNumber: 2,
        title: 'Pemeriksaan Panel "Perlu Tindakan"',
        actor: 'Admin Operator',
        action: 'Melihat tiket yang membutuhkan aksi darurat atau tindakan prioritas tinggi (tiket dengan SLA kritis atau status Verifikasi).',
      },
      {
        stepNumber: 3,
        title: 'Navigasi Cepat Tiket',
        actor: 'Admin Operator',
        action: 'Menekan tombol "Detail" pada tiket untuk langsung membuka berkas pemohon atau detail kronologi pengaduan.',
      },
    ],
    statusStates: [
      { label: 'Normal', color: 'bg-emerald-100 text-emerald-800 border-emerald-300', desc: 'Tiket masih dalam rentang waktu SLA standar' },
      { label: 'Mendekati SLA', color: 'bg-amber-100 text-amber-800 border-amber-300', desc: 'Sisa waktu < 4 jam dari batas penanganan' },
      { label: 'Terlambat', color: 'bg-red-100 text-red-800 border-red-300', desc: 'Melewati batas waktu SLA penanganan' },
    ],
    automatedIntegrations: [
      'Sinkronisasi Real-Time Firestore onSnapshot',
      'Pemberitahuan badge notifikasi saat ada berkas baru',
      'Pencatatan waktu respons awal operator',
    ],
    finalOutput: 'Distribusi tiket terarah tanpa penumpukan antrean dan kepatuhan SLA terpantau.',
  },

  // 2. Pra Registrasi Online
  {
    id: 'wf-pra-registrasi',
    category: 'pelayanan',
    categoryLabel: 'Pelayanan & Operasional',
    menuName: 'Pra Registrasi Online',
    roleLevel: 'Admin Operator Layanan & Staf Seksi Terkait',
    description:
      'Penerimaan, verifikasi awal keabsahan berkas permohonan administrasi kependudukan (KTP, KK, Surat Pengantar RT/RW), permintaan perbaikan data, penolakan berlandaskan aturan, hingga penerusan ke seksi teknis.',
    slaTarget: 'Verifikasi berkas: 2–4 Jam Kerja | Penerusan: Segera',
    inputs: [
      'Nomor Registrasi otomatis (Format: PR-YYYY-XXXXX)',
      'Identitas Pemohon (Nama, NIK, No. KK, No. WhatsApp, Alamat RT/RW)',
      'Dokumen digital persyaratan (Foto/PDF KTP, KK, Pengantar RT/RW, Berkas Pendukung)',
      'Keperluan & keterangan surat',
    ],
    steps: [
      {
        stepNumber: 1,
        title: 'Penerimaan Permohonan Masuk',
        actor: 'Sistem & Admin Operator',
        action: 'Sistem mencatat tiket status "Baru" dan mengirimkan notifikasi instan ke WhatsApp pemohon & dashboard admin.',
        statusOutput: 'Baru / Menunggu Verifikasi',
      },
      {
        stepNumber: 2,
        title: 'Pemeriksaan Dokumen & Keabsahan Data',
        actor: 'Admin Operator',
        action: 'Operator membuka modal detail, mencocokkan NIK & KK pemohon, serta memeriksa keterbacaan lampiran berkas.',
        statusOutput: 'Verifikasi',
      },
      {
        stepNumber: 3,
        title: 'Pengambilan Keputusan Verifikasi',
        actor: 'Admin Operator',
        action:
          'A) Jika Lengkap: Klik "Terima / Verifikasi" -> pilih Bidang, Petugas, dan tenggat SLA -> status "Terverifikasi / Diteruskan".\nB) Jika Kurang/Buram: Klik "Perlu Perbaikan", centang komponen perbaikan, tulis catatan perbaikan -> status "Perlu Perbaikan" -> notifikasi WA terkirim otomatis ke pemohon.\nC) Jika Tidak Sesuai/Palsu: Klik "Tolak", isi alasan penolakan resmi -> status "Ditolak".',
        statusOutput: 'Terverifikasi / Perlu Perbaikan / Ditolak',
      },
      {
        stepNumber: 4,
        title: 'Pemrosesan Petugas Seksi & Penyelesaian',
        actor: 'Petugas / Kasi Terkait',
        action: 'Petugas mencetak draf dokumen/surat keterangan, meminta paraf/tanda tangan Lurah, lalu menandai "Selesai".',
        statusOutput: 'Diproses -> Selesai',
      },
    ],
    statusStates: [
      { label: 'Baru', color: 'bg-blue-100 text-blue-800 border-blue-300', desc: 'Permohonan baru masuk dari warga' },
      { label: 'Verifikasi', color: 'bg-amber-100 text-amber-800 border-amber-300', desc: 'Berkas sedang diteliti oleh Admin Operator' },
      { label: 'Perlu Perbaikan', color: 'bg-orange-100 text-orange-800 border-orange-300', desc: 'Warga diminta upload ulang dokumen kurang/kabur' },
      { label: 'Terverifikasi', color: 'bg-emerald-100 text-emerald-800 border-emerald-300', desc: 'Berkas dinyatakan lengkap dan sah' },
      { label: 'Diteruskan / Diproses', color: 'bg-purple-100 text-purple-800 border-purple-300', desc: 'Sedang dikerjakan oleh petugas bidang terkait' },
      { label: 'Selesai', color: 'bg-teal-100 text-teal-800 border-teal-300', desc: 'Surat selesai ditandatangani dan siap diambil/diunduh' },
      { label: 'Ditolak', color: 'bg-red-100 text-red-800 border-red-300', desc: 'Ditolak dengan alasan resmi yang tercatat di audit log' },
    ],
    automatedIntegrations: [
      'Notifikasi WhatsApp Gateway otomatis ke nomor HP pemohon setiap kali status berubah',
      'Pencatatan Audit Trail lengkap (actorUid, action, before, after, timestamp)',
      'Penghitungan mundur SLA durasi penanganan',
    ],
    finalOutput: 'Surat Keterangan / Administrasi Kelurahan resmi yang terverifikasi dan siap diambil warga.',
  },

  // 3. Pengaduan Online
  {
    id: 'wf-pengaduan',
    category: 'pelayanan',
    categoryLabel: 'Pelayanan & Operasional',
    menuName: 'Pengaduan Online',
    roleLevel: 'Admin Operator Layanan & Petugas Lapangan',
    description:
      'Kanal penerimaan laporan permasalahan lingkungan (sampah liar, drainase tersumbat, lampu jalan, ketertiban umum, bansos), penentuan skala prioritas darurat, penugasan ke petugas teknis, hingga publikasi bukti penanganan.',
    slaTarget: 'Darurat: < 2 Jam | Tinggi: < 12 Jam | Sedang: 24 Jam | Rendah: 48 Jam',
    inputs: [
      'Nomor Pengaduan otomatis (Format: ADU-YYYY-XXXXX)',
      'Identitas Pelapor (Nama, NIK, No. HP WhatsApp, Alamat)',
      'Kategori & Titik Lokasi Masalah (RT/RW, Koordinat/Patokan)',
      'Uraian & Kronologi Kejadian',
      'Bukti Lampiran (Foto lokasi, Video singkat, Dokumen)',
    ],
    steps: [
      {
        stepNumber: 1,
        title: 'Penerimaan Aduan & Validasi Awal',
        actor: 'Admin Operator',
        action: 'Membuka tiket pengaduan masuk status "BARU", memvalidasi foto kondisi lapangan dan lokasi kejadian.',
        statusOutput: 'BARU -> VERIFIKASI ADMIN',
      },
      {
        stepNumber: 2,
        title: 'Klasifikasi Kategori & Penentuan Skala Prioritas',
        actor: 'Admin Operator',
        action:
          'Mengklasifikasikan bidang (Pemerintahan, Kebersihan, Pembangunan/Sosial, Trantib) dan menentukan prioritas:\n• DARURAT: Bencana, pohon tumbang, banjir tinggi (SLA < 2 jam, tampil paling atas)\n• TINGGI: Tumpukan sampah jalan protokol, drainase buntu parah\n• SEDANG: PJU mati, keluhan fasilitas umum\n• RENDAH: Masalah biasa yang butuh penjadwalan berkala.',
        statusOutput: 'TERKLASIFIKASI',
      },
      {
        stepNumber: 3,
        title: 'Penugasan Lapangan & Penerusan Tiket',
        actor: 'Admin Operator',
        action: 'Memilih Seksi penanggung jawab dan Petugas Lapangan yang ditugaskan beserta instruksi teknis penanganan.',
        statusOutput: 'DITERUSKAN -> DITERIMA PETUGAS',
      },
      {
        stepNumber: 4,
        title: 'Penanganan Lapangan & Unggah Bukti Hasil',
        actor: 'Petugas Lapangan / Kasi',
        action: 'Petugas terjun ke lokasi, melakukan eksekusi/kerja bakti, dan mengunggah foto "Sebelum" dan "Sesudah" (After/Before).',
        statusOutput: 'DITANGANI -> MENUNGGU HASIL',
      },
      {
        stepNumber: 5,
        title: 'Verifikasi Hasil & Penutupan Aduan',
        actor: 'Admin Operator / Lurah',
        action: 'Memvalidasi bukti hasil penanganan. Jika tuntas, ubah status menjadi "SELESAI". Sistem mengirim WA konfirmasi terima kasih ke warga pelapor.',
        statusOutput: 'SELESAI',
      },
    ],
    statusStates: [
      { label: 'BARU', color: 'bg-blue-100 text-blue-800 border-blue-300', desc: 'Pengaduan baru terkirim dari warga' },
      { label: 'VERIFIKASI ADMIN', color: 'bg-amber-100 text-amber-800 border-amber-300', desc: 'Sedang diperiksa oleh Admin Operator' },
      { label: 'TERKLASIFIKASI', color: 'bg-indigo-100 text-indigo-800 border-indigo-300', desc: 'Kategori & prioritas telah ditetapkan' },
      { label: 'DITERUSKAN', color: 'bg-purple-100 text-purple-800 border-purple-300', desc: 'Diteruskan ke pejabat/seksi yang berwenang' },
      { label: 'DITERIMA PETUGAS', color: 'bg-cyan-100 text-cyan-800 border-cyan-300', desc: 'Petugas lapangan mengonfirmasi menerima tugas' },
      { label: 'DITANGANI', color: 'bg-orange-100 text-orange-800 border-orange-300', desc: 'Petugas sedang melakukan aksi di lapangan' },
      { label: 'MENUNGGU HASIL', color: 'bg-yellow-100 text-yellow-800 border-yellow-300', desc: 'Menunggu foto bukti penanganan diunggah' },
      { label: 'SELESAI', color: 'bg-emerald-100 text-emerald-800 border-emerald-300', desc: 'Masalah tuntas diselesaikan dan diverifikasi' },
    ],
    automatedIntegrations: [
      'Notifikasi WA otomatis ke pelapor saat aduan diterima, ditangani, dan selesai',
      'Notifikasi WA tugas darurat langsung ke HP petugas kebersihan / trantib',
      'Penandaan peta digital titik lokasi aduan (Digital Map Tagging)',
    ],
    finalOutput: 'Masalah lingkungan warga teratasi tuntas dengan dokumentasi foto hasil penanganan terarsip.',
  },

  // 4. Daftar Layanan & Persyaratan Layanan
  {
    id: 'wf-master-layanan',
    category: 'pelayanan',
    categoryLabel: 'Pelayanan & Operasional',
    menuName: 'Daftar Layanan & Persyaratan Layanan',
    roleLevel: 'Master Admin / Lurah / Sekretaris',
    description:
      'Pengelolaan basis data katalog jenis layanan administrasi kelurahan (nama layanan, kode, bidang, estimasi waktu penyelesaian, biaya/gratis) serta checklist dokumen persyaratan yang wajib diunggah warga.',
    slaTarget: 'Pembaruan data instan ke formulir warga',
    inputs: [
      'Kode Layanan, Nama Layanan, Deskripsi',
      'Bidang Penanggung Jawab (Pemerintahan / PMK / Kebersihan)',
      'Estimasi Durasi (Jam/Hari Kerja) untuk perhitungan SLA otomatis',
      'Daftar Persyaratan (Wajib / Opsional, format file yang diizinkan)',
    ],
    steps: [
      {
        stepNumber: 1,
        title: 'Penyusunan / Edit Jenis Layanan',
        actor: 'Admin Master',
        action: 'Menambah atau memperbarui jenis layanan kelurahan (misal: Surat Domisili, SKU, Keterangan Belum Menikah, dll.).',
      },
      {
        stepNumber: 2,
        title: 'Penetapan Dokumen Persyaratan Wajib',
        actor: 'Admin Master',
        action: 'Menghubungkan persyaratan wajib seperti KTP, Kartu Keluarga, Pengantar RT/RW, atau dokumen spesifik per izin usaha.',
      },
      {
        stepNumber: 3,
        title: 'Aktivasi Layanan',
        actor: 'Admin Master',
        action: 'Menyimpan konfigurasi. Data langsung tampil secara dinamis pada formulir Pra Registrasi Warga.',
      },
    ],
    statusStates: [
      { label: 'Aktif', color: 'bg-emerald-100 text-emerald-800 border-emerald-300', desc: 'Layanan dapat dipilih warga di portal' },
      { label: 'Nonaktif / Draf', color: 'bg-slate-100 text-slate-800 border-slate-300', desc: 'Disembunyikan sementara dari warga' },
    ],
    automatedIntegrations: [
      'Formulir warga otomatis menyesuaikan berkas upload berdasarkan master persyaratan',
      'Durasi SLA layanan otomatis menjadi acuan countdown timer tiket registrasi',
    ],
    finalOutput: 'Katalog layanan kelurahan yang terstandar dan transparan bagi masyarakat.',
  },

  // 5. Penugasan & Disposisi
  {
    id: 'wf-penugasan',
    category: 'pelayanan',
    categoryLabel: 'Pelayanan & Operasional',
    menuName: 'Penugasan & Disposisi Petugas',
    roleLevel: 'Admin Operator, Sekretaris Lurah & Lurah',
    description:
      'Pusat pendelegasian perintah kerja tindak lanjut pengaduan dan verifikasi berkas kepada jajaran kepala seksi atau petugas lapangan berdasarkan spesialisasi bidang.',
    slaTarget: 'Disposisi penugasan maksimal 2 jam setelah tiket terverifikasi',
    inputs: [
      'ID Tiket Sumber (PR-XXXXX atau ADU-XXXXX)',
      'Bidang Tujuan (Pemerintahan / Pemberdayaan / Kebersihan)',
      'Petugas Penerima Tugas (Diambil dari database user aktif)',
      'Prioritas & Instruksi Khusus Penanganan',
      'Batas Waktu Target (SLA Deadline)',
    ],
    steps: [
      {
        stepNumber: 1,
        title: 'Pembuatan Lembar Penugasan',
        actor: 'Admin Operator / Pimpinan',
        action: 'Membuka tiket terkait, memilih menu "Tugaskan", memilih seksi, nama petugas, dan menuliskan instruksi lapangan.',
      },
      {
        stepNumber: 2,
        title: 'Pengiriman Perintah Tugas',
        actor: 'Sistem',
        action: 'Sistem membuat record task baru, mengupdate status sumber, membuat notifikasi in-app, dan mengirim WhatsApp instruksi tugas ke petugas.',
      },
      {
        stepNumber: 3,
        title: 'Monitoring Progres & Konfirmasi',
        actor: 'Admin Operator',
        action: 'Memantau apakah tugas sudah dibuka, diterima, dan dilaporkan progresnya oleh petugas.',
      },
    ],
    statusStates: [
      { label: 'Menunggu Konfirmasi', color: 'bg-amber-100 text-amber-800 border-amber-300', desc: 'Tugas baru dikirim ke petugas' },
      { label: 'Sedang Berjalan', color: 'bg-blue-100 text-blue-800 border-blue-300', desc: 'Petugas sedang menangani instruksi' },
      { label: 'Selesai Dilaporkan', color: 'bg-emerald-100 text-emerald-800 border-emerald-300', desc: 'Hasil tugas telah dilaporkan dan diverifikasi' },
    ],
    automatedIntegrations: [
      'Pengiriman pesan WhatsApp otomatis ke nomor HP petugas lapangan',
      'Pencatatan riwayat disposisi ke lembar digital disposisi pimpinan',
    ],
    finalOutput: 'Akuntabilitas penanganan jelas dengan pembagian tugas yang terpantau.',
  },

  // 6. Monitoring SLA (Service Level Agreement)
  {
    id: 'wf-sla-monitoring',
    category: 'pelayanan',
    categoryLabel: 'Pelayanan & Operasional',
    menuName: 'Monitoring SLA & Kepatuhan Layanan',
    roleLevel: 'Admin Operator, Kasi, Sekretaris & Lurah',
    description:
      'Halaman dashboard analitik pemantauan kepatuhan durasi penyelesaian layanan publik dan penanganan aduan berdasarkan target waktu yang ditetapkan.',
    slaTarget: 'Target Kepatuhan SLA Kelurahan: ≥ 90%',
    inputs: [
      'Timestamp pendaftaran tiket (createdAt)',
      'Durasi SLA kebijakan layanan (slaDuration)',
      'Timestamp penyelesaian aktual (completedAt)',
    ],
    steps: [
      {
        stepNumber: 1,
        title: 'Penghitungan Deadline Berbasis Server',
        actor: 'Sistem Backend',
        action: 'Sistem menghitung slaDeadline = createdAt + slaDuration dengan server-side timestamp terpercaya.',
      },
      {
        stepNumber: 2,
        title: 'Klasifikasi Status Waktu Real-Time',
        actor: 'Sistem & Operator',
        action:
          'Mengelompokkan tiket ke dalam 4 kategori:\n• NORMAL: Masih jauh dari batas waktu\n• NEAR_DUE: Sisa waktu mendekati habis (< 25% durasi tersisa)\n• OVERDUE: Melewati batas waktu (peringatan merah)\n• COMPLETED: Selesai tepat waktu.',
      },
      {
        stepNumber: 3,
        title: 'Eskalasi Tiket Terlambat / Kritis',
        actor: 'Admin Operator / Lurah',
        action: 'Menindaklanjuti tiket berstatus Overdue langsung ke petugas penanggung jawab untuk segera dieksekusi hari itu juga.',
      },
    ],
    statusStates: [
      { label: 'NORMAL', color: 'bg-emerald-100 text-emerald-800 border-emerald-300', desc: 'Tiket aman dalam koridor SLA' },
      { label: 'NEAR_DUE', color: 'bg-amber-100 text-amber-800 border-amber-300', desc: 'Mendekati tenggat batas waktu penanganan' },
      { label: 'OVERDUE', color: 'bg-red-100 text-red-800 border-red-300', desc: 'Melewati tenggat SLA (butuh eskalasi cepat)' },
      { label: 'COMPLETED', color: 'bg-teal-100 text-teal-800 border-teal-300', desc: 'Telah selesai ditangani' },
    ],
    automatedIntegrations: [
      'Perhitungan persentase kepatuhan SLA Kelurahan secara otomatis',
      'Peringatan otomatis saat tiket memasuki status Near-Due',
    ],
    finalOutput: 'Laporan metrik performa kepatuhan kecepatan layanan publik Kelurahan Panaikang.',
  },

  // 7. Notifikasi Operasional
  {
    id: 'wf-notifikasi',
    category: 'pelayanan',
    categoryLabel: 'Pelayanan & Operasional',
    menuName: 'Notifikasi & Peringatan Operasional',
    roleLevel: 'Seluruh Role Admin',
    description:
      'Pusat pemberitahuan internal untuk setiap kejadian sistem (Pra Registrasi Baru, Pengaduan Baru, Peringatan SLA Kritis, Hasil Penanganan Petugas, dan Penugasan Baru).',
    slaTarget: 'Notifikasi instan (real-time push)',
    inputs: [
      'Pemicu kejadian (Event trigger: registrasi baru, aduan baru, perbaikan diunggah, dll.)',
      'ID Tiket Sumber & Jenis Sumber (service / complaint / task)',
    ],
    steps: [
      {
        stepNumber: 1,
        title: 'Penerimaan Alert Notifikasi',
        actor: 'Petugas / Admin',
        action: 'Menerima alert visual badge lonceng merah di header admin saat ada kejadian baru.',
      },
      {
        stepNumber: 2,
        title: 'Akses Langsung ke Sumber Masalah',
        actor: 'Petugas / Admin',
        action: 'Mengklik item notifikasi, sistem langsung otomatis membuka data tiket yang bersangkutan.',
      },
      {
        stepNumber: 3,
        title: 'Penandaan Terbaca',
        actor: 'Petugas / Admin',
        action: 'Menandai notifikasi sebagai terbaca setelah dipelajari/ditindaklanjuti.',
      },
    ],
    statusStates: [
      { label: 'Belum Dibaca', color: 'bg-red-100 text-red-800 border-red-300', desc: 'Pemberitahuan baru yang butuh perhatian' },
      { label: 'Sudah Dibaca', color: 'bg-slate-100 text-slate-700 border-slate-300', desc: 'Telah dibuka oleh petugas' },
    ],
    automatedIntegrations: [
      'Sinkronisasi Firestore real-time',
      'Gateway push notifikasi multi-device',
    ],
    finalOutput: 'Respon cepat tanpa ada tiket atau permohonan warga yang terlewatkan.',
  },

  // 8. Riwayat Aktivitas / Audit Trail
  {
    id: 'wf-audit-trail',
    category: 'pelayanan',
    categoryLabel: 'Pelayanan & Operasional',
    menuName: 'Riwayat Aktivitas & Audit Trail',
    roleLevel: 'Admin Operator, Master Admin & Lurah (Append-Only)',
    description:
      'Log audit seluruh aksi dan perubahan data oleh operator/admin. Bersifat permanen (append-only), tidak dapat diubah maupun dihapus oleh pihak mana pun demi menjamin akuntabilitas dan transparansi integritas.',
    slaTarget: 'Pencatatan real-time otomatis tanpa jeda',
    inputs: [
      'Identitas Aktor (actorUid, actorName, actorRole)',
      'Tindakan (Action: Verifikasi, Minta Perbaikan, Tolak, Tugaskan, Teruskan, Update Data)',
      'Data Sebelum (before) & Data Sesudah (after)',
      'Timestamp & Modul Terkait',
    ],
    steps: [
      {
        stepNumber: 1,
        title: 'Pencatatan Otomatis Setiap Aksi',
        actor: 'Sistem Backend',
        action: 'Setiap kali admin menekan tombol aksi di menu mana pun, sistem secara atomik mencatat 1 baris log audit ke koleksi Firestore.',
      },
      {
        stepNumber: 2,
        title: 'Pemeriksaan & Audit Akuntabilitas',
        actor: 'Lurah & Master Admin',
        action: 'Melihat urutan kronologis siapa yang memverifikasi berkas, jam berapa diteruskan, dan apa catatan perubahan yang dibuat.',
      },
      {
        stepNumber: 3,
        title: 'Pencarian & Filter Investigasi',
        actor: 'Lurah & Master Admin',
        action: 'Memfilter riwayat berdasarkan tanggal, nama petugas, modul, atau nomor registrasi tiket.',
      },
    ],
    statusStates: [
      { label: 'Permanen (Append-Only)', color: 'bg-emerald-100 text-emerald-800 border-emerald-300', desc: 'Terkunci secara hukum dan tidak dapat dimanipulasi' },
    ],
    automatedIntegrations: [
      'Penyimpanan otomatis ke koleksi activityLogs Firestore',
      'Proteksi security rules: create only (update/delete blocked)',
    ],
    finalOutput: 'Rekam jejak digital yang valid untuk audit internal maupun kepatuhan pelayanan publik.',
  },

  // 9. Dashboard Lurah (Executive View)
  {
    id: 'wf-dashboard-lurah',
    category: 'pemerintahan',
    categoryLabel: 'Pemerintahan & Eksekutif',
    menuName: 'Dashboard Lurah & Disposisi Pimpinan',
    roleLevel: 'Lurah & Sekretaris Lurah',
    description:
      'Panel eksekutif pimpinan wilayah untuk meninjau ringkasan pelayanan, memberi disposisi resmi pada pengaduan warga, serta mencetak arsip laporan berkala format resmi berkop surat.',
    slaTarget: 'Disposisi pimpinan harian',
    inputs: [
      'Agregasi seluruh data pelayanan (warga, sampah, RT/RW, urban farming)',
      'Catatan disposisi dan arahan pimpinan',
    ],
    steps: [
      {
        stepNumber: 1,
        title: 'Tinjauan Eksekutif Kelurahan',
        actor: 'Lurah / Seklur',
        action: 'Melihat ringkasan metrik 360 derajat kondisi kelurahan (kinerja pelayanan, kebersihan, ketertiban).',
      },
      {
        stepNumber: 2,
        title: 'Pemberian Disposisi Pimpinan',
        actor: 'Lurah',
        action: 'Memberikan arahan resmi pimpinan pada pengaduan warga yang diteruskan ke Kasi.',
      },
      {
        stepNumber: 3,
        title: 'Ekspor Dokumen & Laporan PDF',
        actor: 'Lurah / Operator',
        action: 'Mencetak dokumen resmi berstandar kop surat dinas untuk arsip atau rapat koordinasi di tingkat Kecamatan Panakkukang.',
      },
    ],
    statusStates: [
      { label: 'Tinjauan Pimpinan', color: 'bg-emerald-100 text-emerald-800 border-emerald-300', desc: 'Akses penuh eksekutif' },
    ],
    automatedIntegrations: [
      'Generator PDF resmi berstandar Kop Surat Pemerintah Kota Makassar',
      'Kalkulasi tren bulanan laporan masyarakat',
    ],
    finalOutput: 'Arahan pimpinan yang terarah dan dokumen pelaporan kinerja resmi kelurahan.',
  },

  // 10. Profil Kelurahan & SOTK
  {
    id: 'wf-profil-kelurahan',
    category: 'pemerintahan',
    categoryLabel: 'Pemerintahan & Eksekutif',
    menuName: 'Profil Kelurahan & SOTK',
    roleLevel: 'Master Admin / Lurah',
    description:
      'Pengelolaan biodata resmi pimpinan Lurah, NIP, pangkat/golongan, sambutan, susunan pejabat struktural (Sekretaris, Kasi, Staf), batas wilayah, visi misi, dan kontak resmi kantor kelurahan.',
    slaTarget: 'Pembaruan berkala sesuai SK Mutasi / Keputusan Walikota',
    inputs: [
      'Biodata Lurah (Nama, NIP, Pangkat, Foto Resmi)',
      'Susunan Pejabat Struktural & Staf Seksi',
      'Visi, Misi, Batas Wilayah, Alamat Kantor, Jam Layanan',
    ],
    steps: [
      {
        stepNumber: 1,
        title: 'Pembaruan Data & Foto Pejabat',
        actor: 'Master Admin',
        action: 'Mengisi form data pejabat, mengunggah foto resmi pimpinan (otomatis terkompresi).',
      },
      {
        stepNumber: 2,
        title: 'Verifikasi & Simpan Permanen',
        actor: 'Master Admin',
        action: 'Menyimpan perubahan. Sistem otomatis menyinkronkan data ke Firestore dan file database lokal.',
      },
      {
        stepNumber: 3,
        title: 'Tayang Multi-Platform',
        actor: 'Sistem',
        action: 'Data otomatis tampil di Halaman Profil Publik, Peta Digital, Kop Surat PDF, dan Panel Admin.',
      },
    ],
    statusStates: [
      { label: 'Terverifikasi Resmi', color: 'bg-blue-100 text-blue-800 border-blue-300', desc: 'Sesuai SK Perwali Kota Makassar No. 65 Th. 2023' },
    ],
    automatedIntegrations: [
      'Sinkronisasi otomatis ke seluruh template kop surat PDF',
      'Fallback multi-tier aset foto resmi untuk menjamin zero-blank state',
    ],
    finalOutput: 'Identitas resmi Kelurahan Panaikang yang akurat dan tersinkronisasi di semua kanal.',
  },

  // 11. Data RT/RW & Siskamling
  {
    id: 'wf-rtrw',
    category: 'pemerintahan',
    categoryLabel: 'Pemerintahan & Eksekutif',
    menuName: 'Data RT/RW & Siskamling Kamtibmas',
    roleLevel: 'Admin Operator & Kasi Pemerintahan/Ketertiban',
    description:
      'Manajemen database 7 RW dan 62 RT se-Kelurahan Panaikang, identitas ketua RT/RW, nomor kontak darurat, serta rotasi jadwal siskamling ronda malam per lingkungan.',
    slaTarget: 'Pembaruan data kepengurusan RT/RW',
    inputs: [
      'Data RW (RW 01 s/d RW 07)',
      'Data RT (Nama Ketua RT, Kontak HP WhatsApp, Lingkup Jalan/Lorong)',
      'Jadwal dan pos ronda siskamling',
    ],
    steps: [
      {
        stepNumber: 1,
        title: 'Pemeliharaan Basis Data RT/RW',
        actor: 'Admin Operator',
        action: 'Mengecek dan memperbarui data ketua RT/RW terpilih serta nomor kontak aktif.',
      },
      {
        stepNumber: 2,
        title: 'Penjadwalan Siskamling Ronda Malam',
        actor: 'Kasi Ketertiban / Admin',
        action: 'Menyusun jadwal piket jaga pos kamling per RW untuk menjaga ketertiban lingkungan.',
      },
      {
        stepNumber: 3,
        title: 'Penerbitan Jadwal & Kontak',
        actor: 'Admin Operator',
        action: 'Menerbitkan informasi ke publik agar warga dapat menghubungi ketua RT/RW mereka secara langsung.',
      },
    ],
    statusStates: [
      { label: '7 RW / 62 RT Terdaftar', color: 'bg-emerald-100 text-emerald-800 border-emerald-300', desc: 'Data cakupan wilayah 100% lengkap' },
    ],
    automatedIntegrations: [
      'Peta Digital terintegrasi titik batas dan posko RT/RW',
      'Kontak RT/RW terhubung ke WhatsApp Gateway untuk koordinasi darurat',
    ],
    finalOutput: 'Struktur kepengurusan lingkungan yang tertata dan siap merespons kebutuhan warga.',
  },

  // 12. Pengelolaan Sampah & Lingkungan
  {
    id: 'wf-sampah',
    category: 'lingkungan',
    categoryLabel: 'Lingkungan & Kebersihan',
    menuName: 'Pengelolaan Sampah (BSU, Teba & Biopori)',
    roleLevel: 'Kasi Kebersihan & Operator Bank Sampah',
    description:
      'Pemantauan 12 Bank Sampah Unit (BSU), titik komposter Teba Modern, dan lubang resapan biopori dalam program inovasi Panaikang Smart Environment.',
    slaTarget: 'Pencatatan penimbangan sampah rutin setiap jadwal operasional',
    inputs: [
      'Titik Bank Sampah Unit (Nama BSU, RW Lokasi, Pengurus)',
      'Log Penimbangan Sampah (Kategori Plastik, Kertas, Logam, Organik, Nilai Rupiah)',
      'Titik Teba Modern & Biopori resapan air',
    ],
    steps: [
      {
        stepNumber: 1,
        title: 'Pencatatan Timbangan Sampah Masuk',
        actor: 'Operator BSU / Kasi Kebersihan',
        action: 'Menginput volume sampah terpilah yang disetor warga/nasabah bank sampah.',
      },
      {
        stepNumber: 2,
        title: 'Monitoring Kapasitas Teba & Biopori',
        actor: 'Petugas Kebersihan',
        action: 'Memeriksa dekomposisi sampah organik pada teba komposter dan kondisi resapan biopori.',
      },
      {
        stepNumber: 3,
        title: 'Kalkulasi Reduksi Sampah Kelurahan',
        actor: 'Sistem',
        action: 'Sistem secara otomatis menghitung total tonase sampah tereduksi dari sumbernya.',
      },
    ],
    statusStates: [
      { label: 'Aktif Beroperasi', color: 'bg-emerald-100 text-emerald-800 border-emerald-300', desc: 'BSU rutin melayani penyetoran sampah' },
    ],
    automatedIntegrations: [
      'Integrasi data ke laporan Indeks Kebersihan Kelurahan tingkat Kota Makassar',
      'Pinpoint peta digital sebaran lokasi BSU, Teba, dan Biopori',
    ],
    finalOutput: 'Lingkungan kelurahan bersih, sampah tereduksi, dan bernilai ekonomi sirkular bagi warga.',
  },

  // 13. Urban Farming
  {
    id: 'wf-urban-farming',
    category: 'lingkungan',
    categoryLabel: 'Lingkungan & Kebersihan',
    menuName: 'Urban Farming & Ketahanan Pangan',
    roleLevel: 'Kasi Pemberdayaan Masyarakat & Kelompok Tani Lorong',
    description:
      'Pendataan titik kebun sayur lorong, fasilitasi permohonan bibit tanaman dari kelompok wanita tani (KWT), pencatatan siklus perawatan, dan rekap hasil panen.',
    slaTarget: 'Verifikasi permohonan bibit: Maksimal 2x24 jam',
    inputs: [
      'Lokasi Kebun Urban Farming (RW, Luas Lahan, Jenis Tanaman)',
      'Permohonan Bibit Sayur (Cabai, Tomat, Sawi, Kangkung, dll.)',
      'Log Perawatan Tanaman & Catatan Hasil Panen (Kg)',
    ],
    steps: [
      {
        stepNumber: 1,
        title: 'Pendaftaran / Inventarisasi Kebun',
        actor: 'Admin / Pengurus KWT',
        action: 'Mendaftarkan titik kebun lorong produktif beserta foto dokumentasi kebun.',
      },
      {
        stepNumber: 2,
        title: 'Pengajuan & Verifikasi Bibit',
        actor: 'Kelompok Tani & Kasi Pemberdayaan',
        action: 'Kelompok mengajukan bibit sayuran -> Kasi menyetujui dan mendistribusikan bibit.',
      },
      {
        stepNumber: 3,
        title: 'Pencatatan Panen Bersama',
        actor: 'Kasi Pemberdayaan / Admin',
        action: 'Mencatat bobot hasil panen sayur segar yang dimanfaatkan warga untuk ketahanan pangan lorong.',
      },
    ],
    statusStates: [
      { label: 'Produktif', color: 'bg-emerald-100 text-emerald-800 border-emerald-300', desc: 'Kebun aktif ditanami dan terawat' },
    ],
    automatedIntegrations: [
      'Peta digital lokasi sebaran kebun sayur lorong',
      'Katalog inventaris stok sarana pertanian perkotaan',
    ],
    finalOutput: 'Ketahanan pangan lorong mandiri dan lingkungan hijau asri.',
  },

  // 14. Kerja Bakti & Jumat ASRI
  {
    id: 'wf-kerja-bakti',
    category: 'lingkungan',
    categoryLabel: 'Lingkungan & Kebersihan',
    menuName: 'Kerja Bakti & Jumat ASRI',
    roleLevel: 'Kasi Kebersihan & Koordinator Kerja Bakti',
    description:
      'Penjadwalan giat gotong royong pembersihan drainase, Jumat ASRI bersama TNI/Polri/Tokoh Agama, dokumentasi foto lapangan, dan sinkronisasi dengan Instagram resmi.',
    slaTarget: 'Publikasi jadwal H-2 sebelum kegiatan',
    inputs: [
      'Jadwal Kegiatan (Hari, Tanggal, Jam WITA)',
      'Lokasi RW/RT sasaran pembersihan saluran/lorong',
      'Elemen yang terlibat (Satgas, Warga, Mitra TNI/Gereja/Masjid)',
      'Foto dokumentasi kegiatan lapangan',
    ],
    steps: [
      {
        stepNumber: 1,
        title: 'Penyusunan Jadwal & Undangan Giat',
        actor: 'Kasi Kebersihan / Admin',
        action: 'Menetapkan titik sasaran kerja bakti dan menyebarkan pengumuman ke RT/RW.',
      },
      {
        stepNumber: 2,
        title: 'Pelaksanaan Aksi Gotong Royong',
        actor: 'Warga, Satgas & Pimpinan',
        action: 'Pelaksanaan giat lapangan bersama Lurah/Camat dan jajaran lintas elemen.',
      },
      {
        stepNumber: 3,
        title: 'Unggah Dokumentasi & Prestasi',
        actor: 'Admin Operator',
        action: 'Mengunggah foto dan narasi keberhasilan ke portal dan sorotan Instagram kelurahan.',
      },
    ],
    statusStates: [
      { label: 'Terlaksana', color: 'bg-emerald-100 text-emerald-800 border-emerald-300', desc: 'Kegiatan sukses dilaksanakan dan terarsip' },
    ],
    automatedIntegrations: [
      'Sinkronisasi ke feed dan story sorotan @kelurahan.panaikang',
      'Pemberitahuan agenda otomatis di beranda portal publik',
    ],
    finalOutput: 'Saluran drainase bersih lancar dan semangat gotong royong warga terpelihara.',
  },

  // 15. Informasi & Pengumuman (@kelurahan.panaikang)
  {
    id: 'wf-informasi-ig',
    category: 'pemerintahan',
    categoryLabel: 'Pemerintahan & Eksekutif',
    menuName: 'Informasi Kelurahan & Media Sosial',
    roleLevel: 'Humas / Admin Operator / Lurah',
    description:
      'Penyampaian pengumuman kedinasan, peringatan dini cuaca, penyaluran bantuan sosial, kegiatan kemasyarakatan, serta kurasi postingan dari Instagram resmi @kelurahan.panaikang.',
    slaTarget: 'Publikasi berita aktual < 24 jam',
    inputs: [
      'Judul Pengumuman, Kategori (Pengumuman, Berita, Lingkungan, HUT)',
      'Isi Ringkasan & Konten Berita Lengkap',
      'Foto dokumentasi berkualitas tinggi',
      'Tautan postingan Instagram resmi & hashtag',
    ],
    steps: [
      {
        stepNumber: 1,
        title: 'Penyusunan Draf Informasi',
        actor: 'Humas / Admin Operator',
        action: 'Menulis teks pengumuman/berita resmi dengan bahasa yang mudah dipahami warga.',
      },
      {
        stepNumber: 2,
        title: 'Validasi & Penautan Media',
        actor: 'Admin Operator',
        action: 'Menyematkan foto dokumentasi dan tautan ke postingan resmi Instagram kelurahan.',
      },
      {
        stepNumber: 3,
        title: 'Publikasi ke Portal Warga',
        actor: 'Admin Operator',
        action: 'Menekan simpan. Informasi langsung tayang di beranda dan halaman informasi publik warga.',
      },
    ],
    statusStates: [
      { label: 'Tayang Publik', color: 'bg-emerald-100 text-emerald-800 border-emerald-300', desc: 'Dapat dibaca oleh seluruh masyarakat' },
    ],
    automatedIntegrations: [
      'Penyelarasan otomatis tagar (#KelurahanPanaikang, #PanaikangSmartEnvironment)',
      'Tampilan responsif di layar ponsel warga',
    ],
    finalOutput: 'Transparansi informasi kelurahan yang cepat, akurat, dan terpercaya bagi warga.',
  },

  // 16. WhatsApp Gateway (Fonnte API)
  {
    id: 'wf-whatsapp-gateway',
    category: 'sistem',
    categoryLabel: 'Keamanan & Sistem',
    menuName: 'Kelola WhatsApp Gateway',
    roleLevel: 'Master Admin & Sekretaris',
    description:
      'Konfigurasi integrasi WhatsApp Business API via Fonnte, manajemen nomor penerima notifikasi kedinasan (Lurah, Seklur, Kasi Trantib, Kasi Kebersihan, Tim Reaksi Cepat), dan log riwayat pesan terkirim.',
    slaTarget: 'Pengiriman pesan < 5 detik per notifikasi',
    inputs: [
      'API Token Fonnte aktif',
      'Daftar Nomor Penerima (Nama, Jabatan, Nomor HP format 08/62, Status Aktif)',
      'Template pesan otomatis (Status Tiket, Peringatan SLA, Tugas Baru)',
    ],
    steps: [
      {
        stepNumber: 1,
        title: 'Pendaftaran Nomor Pejabat / Petugas',
        actor: 'Master Admin',
        action: 'Memasukkan nomor WhatsApp resmi pejabat struktural dan petugas lapangan.',
      },
      {
        stepNumber: 2,
        title: 'Uji Konektivitas Pesan (Test Dispatch)',
        actor: 'Master Admin',
        action: 'Melakukan uji kirim pesan notifikasi untuk memastikan nomor terhubung dengan API Fonnte.',
      },
      {
        stepNumber: 3,
        title: 'Pengiriman Pesan Otomatis Sistem',
        actor: 'Sistem Otomatis',
        action: 'Setiap ada event tiket warga (Pra Registrasi / Pengaduan), gateway otomatis mengirim pesan WA resmi ke nomor yang bersangkutan.',
      },
    ],
    statusStates: [
      { label: 'Terhubung (Online)', color: 'bg-emerald-100 text-emerald-800 border-emerald-300', desc: 'API Token aktif dan siap mengirim pesan' },
      { label: 'Nomor Aktif', color: 'bg-teal-100 text-teal-800 border-teal-300', desc: 'Nomor terdaftar menerima notifikasi resmi' },
    ],
    automatedIntegrations: [
      'Pengiriman otomatis tanpa biaya pulsa SMS',
      'Log pencatatan riwayat kirim dan status sukses Fonnte',
    ],
    finalOutput: 'Komunikasi dua arah instan antara kelurahan, petugas lapangan, dan warga pemohon.',
  },

  // 17. Kelola Admin & User (Whitelist Google Auth)
  {
    id: 'wf-kelola-admin',
    category: 'sistem',
    categoryLabel: 'Keamanan & Sistem',
    menuName: 'Kelola Admin, Whitelist & Otoritas RBAC',
    roleLevel: 'Master Admin (Hak Akses Tertinggi)',
    description:
      'Manajemen akun login administrator berbasis peran (Role-Based Access Control), whitelist akun email resmi, dan verifikasi permohonan login akun Google Admin.',
    slaTarget: 'Verifikasi akun permohonan admin < 24 jam',
    inputs: [
      'Daftar akun admin terdaftar (Username, Role, Divisi/Bidang, Hak Akses Modul)',
      'Daftar permohonan verifikasi email Google Admin (Nama, Email, Alasan, Bukti Penugasan)',
      'Konfigurasi izin modul per role',
    ],
    steps: [
      {
        stepNumber: 1,
        title: 'Penerimaan Permohonan Akun Google Admin',
        actor: 'Master Admin',
        action: 'Melihat daftar permohonan email Google yang diajukan oleh staf/petugas di halaman kelola admin.',
      },
      {
        stepNumber: 2,
        title: 'Verifikasi Identitas & Penugasan Bidang',
        actor: 'Master Admin',
        action: 'Mencocokkan identitas pemohon dengan SK penugasan, memilih Role Level (Admin Operator, Kasi, Staf), lalu menekan "Setujui & Whitelist".',
      },
      {
        stepNumber: 3,
        title: 'Aktivasi Akses Login Seketika',
        actor: 'Sistem',
        action: 'Akun Google otomatis terdaftar di whitelist. Pengguna kini dapat login sekali klik via Google OAuth dengan hak akses sesuai bidangnya.',
      },
    ],
    statusStates: [
      { label: 'Terverifikasi & Aktif', color: 'bg-emerald-100 text-emerald-800 border-emerald-300', desc: 'Akun diizinkan login ke panel admin' },
      { label: 'Menunggu Persetujuan', color: 'bg-amber-100 text-amber-800 border-amber-300', desc: 'Permohonan baru yang butuh persetujuan Master Admin' },
      { label: 'Dicabut / Ditolak', color: 'bg-red-100 text-red-800 border-red-300', desc: 'Akses login dicabut demi keamanan' },
    ],
    automatedIntegrations: [
      'Firebase Authentication & Google OAuth Client-side login',
      'Penyimpanan aman di cloud Firestore & multi-tier journal sync',
    ],
    finalOutput: 'Keamanan sistem terjamin bebas akses tanpa izin dengan pembagian wewenang yang tegas.',
  },

  // 18. Traffic Web & Analitik
  {
    id: 'wf-traffic',
    category: 'sistem',
    categoryLabel: 'Keamanan & Sistem',
    menuName: 'Traffic Web & Analitik Pengunjung',
    roleLevel: 'Master Admin & Pimpinan',
    description:
      'Pemantauan jumlah kunjungan warga ke portal kelurahan, halaman layanan yang paling sering dibuka, tipe perangkat pengunjung (Mobile/Desktop), dan telemetri performa sistem.',
    slaTarget: 'Pembaruan data kunjungan real-time',
    inputs: [
      'Hit counter kunjungan halaman per sesi',
      'Data agregasi jenis perangkat dan peramban',
    ],
    steps: [
      {
        stepNumber: 1,
        title: 'Pengumpulan Data Kunjungan Anonim',
        actor: 'Sistem Frontend',
        action: 'Sistem mencatat statistik agregat kunjungan tanpa mengumpulkan data pribadi warga.',
      },
      {
        stepNumber: 2,
        title: 'Analisis Minat Layanan Warga',
        actor: 'Admin / Pimpinan',
        action: 'Melihat layanan mana yang paling banyak dicari warga untuk bahan evaluasi alokasi petugas kelurahan.',
      },
    ],
    statusStates: [
      { label: 'Live Telemetry', color: 'bg-cyan-100 text-cyan-800 border-cyan-300', desc: 'Data diperbarui secara dinamis' },
    ],
    automatedIntegrations: [
      'Grafik visual responsif pemantauan beban trafik sistem',
    ],
    finalOutput: 'Wawasan berbasis data untuk peningkatan mutu pelayanan publik kelurahan.',
  },
];

export const AdminWorkflowGuideModal: React.FC<AdminWorkflowGuideModalProps> = ({
  isOpen,
  onClose,
  profile,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<
    'all' | 'pelayanan' | 'pemerintahan' | 'lingkungan' | 'sistem'
  >('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string>(
    ADMIN_MENU_WORKFLOWS[0].id
  );

  if (!isOpen) return null;

  const filteredWorkflows = ADMIN_MENU_WORKFLOWS.filter((item) => {
    const matchCategory =
      selectedCategory === 'all' || item.category === selectedCategory;
    const matchSearch =
      item.menuName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.roleLevel.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  const activeWorkflow =
    ADMIN_MENU_WORKFLOWS.find((w) => w.id === selectedWorkflowId) ||
    filteredWorkflows[0] ||
    ADMIN_MENU_WORKFLOWS[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 py-4 bg-[#0D3868] text-white flex items-center justify-between gap-3 border-b border-sky-900">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
              <Layers className="w-5 h-5 text-amber-300" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold truncate">
                  Buku Panduan &amp; Diagram Alur Kerja (SOP) Seluruh Menu Admin
                </h2>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-[10px] font-semibold text-emerald-300">
                  Standar Resmi 2026
                </span>
              </div>
              <p className="text-xs text-sky-200 truncate">
                Panaikang Smart Environment · Standar Operasional Prosedur Pelayanan &amp; Operasional Kelurahan
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => generateApplicationWorkflowPdf(profile)}
              title="Unduh Dokumen PDF SOP Resmi Berkop Surat"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-extrabold shadow-xs transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Unduh PDF SOP</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search & Category Filter Bar */}
        <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none text-xs font-bold">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-[#0D3868] text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              Semua Menu ({ADMIN_MENU_WORKFLOWS.length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategory('pelayanan')}
              className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap cursor-pointer ${
                selectedCategory === 'pelayanan'
                  ? 'bg-[#0D3868] text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              Pelayanan &amp; Operasional (8)
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategory('pemerintahan')}
              className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap cursor-pointer ${
                selectedCategory === 'pemerintahan'
                  ? 'bg-[#0D3868] text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              Pemerintahan &amp; Eksekutif (4)
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategory('lingkungan')}
              className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap cursor-pointer ${
                selectedCategory === 'lingkungan'
                  ? 'bg-[#0D3868] text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              Lingkungan &amp; Kebersihan (3)
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategory('sistem')}
              className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap cursor-pointer ${
                selectedCategory === 'sistem'
                  ? 'bg-[#0D3868] text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              Sistem &amp; Keamanan (3)
            </button>
          </div>

          {/* Search Box */}
          <div className="relative min-w-[220px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari alur kerja menu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-[#0D3868] bg-white"
            />
          </div>
        </div>

        {/* Content Body: Sidebar List + Detail Panel */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-slate-200">
          {/* Left Column: List of Menus */}
          <div className="md:col-span-4 p-3 overflow-y-auto max-h-[60vh] md:max-h-[650px] space-y-1.5 bg-slate-50/50">
            {filteredWorkflows.map((item) => {
              const isSelected = item.id === activeWorkflow.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedWorkflowId(item.id)}
                  className={`w-full p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col gap-1 ${
                    isSelected
                      ? 'bg-sky-50 border-[#0D3868] text-[#0D3868] shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-bold leading-snug line-clamp-1">
                      {item.menuName}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium shrink-0">
                      {item.categoryLabel}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 line-clamp-1">
                    Role: {item.roleLevel}
                  </span>
                </button>
              );
            })}
            {filteredWorkflows.length === 0 && (
              <div className="p-6 text-center text-xs text-slate-500">
                Tidak ditemukan menu yang sesuai dengan pencarian Anda.
              </div>
            )}
          </div>

          {/* Right Column: Workflow Detail & Interactive Steps */}
          <div className="md:col-span-8 p-5 sm:p-6 overflow-y-auto max-h-[70vh] md:max-h-[650px] space-y-6 bg-white">
            {/* Title & Metadata */}
            <div className="border-b border-slate-200 pb-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-1 rounded-full bg-[#0D3868] text-white text-[11px] font-bold">
                  {activeWorkflow.categoryLabel}
                </span>
                <span className="px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-semibold">
                  Aktor: {activeWorkflow.roleLevel}
                </span>
                {activeWorkflow.slaTarget && (
                  <span className="px-2.5 py-1 rounded-full bg-amber-100 border border-amber-300 text-amber-900 text-[11px] font-semibold flex items-center gap-1">
                    <Clock className="w-3 h-3 text-amber-700" />
                    <span>SLA: {activeWorkflow.slaTarget}</span>
                  </span>
                )}
              </div>

              <h3 className="text-lg sm:text-xl font-extrabold text-[#0D3868] mt-2 tracking-tight">
                {activeWorkflow.menuName}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                {activeWorkflow.description}
              </p>
            </div>

            {/* Input Data Prasyarat */}
            <div>
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                <FileText className="w-4 h-4 text-[#0277BD]" />
                <span>Input Data &amp; Dokumen Prasyarat</span>
              </h4>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {activeWorkflow.inputs.map((inp, idx) => (
                  <li
                    key={idx}
                    className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-700 flex items-start gap-2"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{inp}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Tahapan Alur Kerja (Step-by-Step Flow Diagram) */}
            <div>
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 mb-3">
                <SlidersHorizontal className="w-4 h-4 text-[#2E7D32]" />
                <span>Tahapan Alur Kerja (Step-by-Step Execution Flow)</span>
              </h4>

              <div className="space-y-3 relative before:absolute before:inset-0 before:left-4 before:w-0.5 before:bg-slate-200 before:top-4 before:bottom-4">
                {activeWorkflow.steps.map((step) => (
                  <div
                    key={step.stepNumber}
                    className="relative flex items-start gap-3.5 pl-0.5"
                  >
                    {/* Step Number Circle */}
                    <div className="w-8 h-8 rounded-full bg-[#0D3868] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs z-10">
                      {step.stepNumber}
                    </div>

                    {/* Step Card */}
                    <div className="flex-1 p-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white hover:border-sky-300 transition shadow-2xs">
                      <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                        <span className="text-xs font-bold text-slate-900">
                          {step.title}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-sky-100 text-[#0D3868] font-bold">
                          {step.actor}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                        {step.action}
                      </p>
                      {step.statusOutput && (
                        <div className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-lg">
                          <ArrowRight className="w-3 h-3" />
                          <span>Status: {step.statusOutput}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* State Machine / Status Pelayanan */}
            {activeWorkflow.statusStates.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 mb-2.5">
                  <Activity className="w-4 h-4 text-[#EF6C00]" />
                  <span>Daftar Status &amp; Transisi Data (State Transitions)</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {activeWorkflow.statusStates.map((st, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl border border-slate-200 bg-white flex flex-col gap-1"
                    >
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${st.color}`}
                        >
                          {st.label}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-600">
                        {st.desc}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Integrasi Otomatis & Output Akhir */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-slate-50 to-sky-50/60 border border-slate-200 space-y-3">
              <div>
                <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>Integrasi Sistem Otomatis</span>
                </span>
                <ul className="text-xs text-slate-600 space-y-1">
                  {activeWorkflow.automatedIntegrations.map((integ, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-[#0277BD] font-bold">•</span>
                      <span>{integ}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-2 border-t border-slate-200">
                <span className="text-[11px] font-bold text-[#0D3868] uppercase tracking-wider flex items-center gap-1.5 mb-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Output / Hasil Akhir</span>
                </span>
                <p className="text-xs font-medium text-slate-800">
                  {activeWorkflow.finalOutput}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="text-slate-500 text-center sm:text-left">
            <span>Standar Operasional Prosedur Kelurahan Panaikang · Kota Makassar</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => generateApplicationWorkflowPdf(profile)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold border border-amber-300 shadow-2xs transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Cetak / Unduh PDF SOP Resmi</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold transition cursor-pointer"
            >
              Tutup Panduan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
