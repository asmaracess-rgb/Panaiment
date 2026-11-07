import React, { useRef } from 'react';
import { X, Printer, Copy, Check, QrCode, Download } from 'lucide-react';
import { downloadOfficialLetterOrReceiptPdf } from '../utils/officialLetterPdfGenerator';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticketCode: string;
  title: string;
  subtitle?: string;
  applicantName?: string;
  categoryOrService?: string;
  submittedAt?: string;
  statusBadge?: string;
  instructions?: string[];
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({
  isOpen,
  onClose,
  ticketCode,
  title,
  subtitle = 'Kelurahan Panaikang, Kota Makassar',
  applicantName,
  categoryOrService,
  submittedAt,
  statusBadge,
  instructions = [
    'Simpan atau cetak tiket ini sebagai bukti registrasi resmi.',
    'Bawa dokumen asli dan tunjukkan QR Code / Nomor Tiket ini kepada petugas loket.',
    'Datang ke Kantor Kelurahan Panaikang pada jam pelayanan kerja (Senin - Jumat, 08.00 - 15.30 WITA).',
  ],
}) => {
  const [copied, setCopied] = React.useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(ticketCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isSurat =
    ticketCode.startsWith('REG-') ||
    ticketCode.startsWith('SRT-') ||
    title.toLowerCase().includes('registrasi') ||
    title.toLowerCase().includes('surat');

  const handleDownloadPdf = () => {
    downloadOfficialLetterOrReceiptPdf({
      ticketCode,
      isSurat,
      documentTitle: isSurat
        ? 'TANDA TERIMA PRA-REGISTRASI LAYANAN KELURAHAN'
        : 'TANDA TERIMA RESMI PENGADUAN ONLINE WARGA',
      registerNumber: ticketCode,
      applicantName: applicantName || 'Warga Kelurahan Panaikang',
      serviceOrCategoryName: categoryOrService || title,
      descriptionOrPurpose: instructions.join(' '),
      statusText: statusBadge || 'TERDAFTAR',
      submittedAt: submittedAt || new Date().toLocaleDateString('id-ID'),
    });
  };

  const handlePrint = () => {
    try {
      window.print();
    } catch {
      handleDownloadPdf();
    }
  };

  // Generate a high-contrast standard QR Code visual via quickchart svg endpoint (fully client-rendered via img)
  const qrUrl = `https://quickchart.io/qr?text=${encodeURIComponent(
    `PANAIKANG:${ticketCode}`
  )}&size=240&margin=2&ecLevel=M`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white">
      <div
        ref={printRef}
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8 print:border-none print:shadow-none print:my-0 print:max-w-none"
      >
        {/* Top institutional header */}
        <div className="bg-gradient-to-r from-[#072647] via-[#0D3868] to-[#0277BD] text-white p-6 text-center relative print:bg-slate-900 print:text-black">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition cursor-pointer print:hidden"
            title="Tutup"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center mx-auto mb-2 text-white">
            <QrCode className="w-5 h-5" />
          </div>

          <div className="text-[10px] font-black tracking-widest text-sky-200 uppercase">
            PEMERINTAH KOTA MAKASSAR · KELURAHAN PANAIKANG
          </div>
          <h3 className="text-lg font-black text-white mt-0.5">{title}</h3>
          <p className="text-xs text-sky-100">{subtitle}</p>
        </div>

        {/* Content body */}
        <div className="p-6 space-y-5">
          {/* Ticket code badge */}
          <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl p-4 text-center">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Nomor Tiket Registrasi
            </span>
            <div className="text-2xl font-black font-mono-num text-[#0D3868] tracking-wider mt-1 select-all">
              {ticketCode}
            </div>

            <div className="mt-2 flex items-center justify-center gap-2 print:hidden">
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-sky-100 hover:bg-sky-200 text-[#0277BD] text-xs font-bold transition cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Tersalin!' : 'Salin Nomor Tiket'}</span>
              </button>
            </div>
          </div>

          {/* QR Code */}
          <div className="flex flex-col items-center justify-center p-3 bg-white rounded-2xl border border-slate-200">
            <div className="w-48 h-48 bg-white p-2 rounded-xl border border-slate-200 flex items-center justify-center shadow-xs">
              <img
                src={qrUrl}
                alt={`QR Code ${ticketCode}`}
                className="w-full h-full object-contain"
                loading="lazy"
              />
            </div>
            <span className="text-[10px] text-slate-400 font-mono-num mt-2">
              Scan untuk validasi loket pelayanan kelurahan
            </span>
          </div>

          {/* Meta details */}
          <div className="bg-slate-50 rounded-2xl p-3.5 text-xs space-y-2 border border-slate-100">
            {applicantName && (
              <div className="flex justify-between py-0.5 border-b border-slate-200/60">
                <span className="text-slate-500">Nama Pemohon:</span>
                <span className="font-bold text-slate-900">{applicantName}</span>
              </div>
            )}
            {categoryOrService && (
              <div className="flex justify-between py-0.5 border-b border-slate-200/60">
                <span className="text-slate-500">Layanan / Kategori:</span>
                <span className="font-bold text-slate-900 text-right">{categoryOrService}</span>
              </div>
            )}
            {submittedAt && (
              <div className="flex justify-between py-0.5 border-b border-slate-200/60">
                <span className="text-slate-500">Waktu Diajukan:</span>
                <span className="font-mono-num font-semibold text-slate-700">{submittedAt}</span>
              </div>
            )}
            {statusBadge && (
              <div className="flex justify-between py-0.5">
                <span className="text-slate-500">Status Saat Ini:</span>
                <span className="font-bold text-sky-700">{statusBadge}</span>
              </div>
            )}
          </div>

          {/* Petunjuk Kedatangan */}
          <div className="bg-sky-50 border border-sky-100 rounded-2xl p-3.5 text-xs text-sky-950 space-y-1.5">
            <div className="font-extrabold text-[#0D3868] flex items-center gap-1.5">
              <span>📌 Petunjuk Penting:</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-slate-600 text-[11px] leading-relaxed">
              {instructions.map((ins, i) => (
                <li key={i}>{ins}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer actions (hidden in print) */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 print:hidden">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition cursor-pointer"
          >
            Tutup
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadPdf}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1C8237] hover:bg-[#146329] text-white text-xs font-extrabold transition shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh PDF Tanda Terima</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0D3868] hover:bg-[#072647] text-white text-xs font-extrabold transition shadow-xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
