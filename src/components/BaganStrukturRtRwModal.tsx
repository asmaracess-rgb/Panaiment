import React, { useState } from 'react';
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Printer,
  Download,
  Users,
  ImageIcon,
  Upload,
  ChevronRight,
} from 'lucide-react';
import { KelurahanProfile, RwGroup } from '../types';
import { EmblemKotaMakassar, EmblemKelurahanPanaikang } from './Emblems';

interface BaganStrukturRtRwModalProps {
  isOpen: boolean;
  onClose: () => void;
  rwGroups?: RwGroup[];
  profile: KelurahanProfile;
  initialSelectedRw?: string;
  onNavigateToRtRw?: (rwCode: string) => void;
  onNavigateToAdmin?: () => void;
}

export const BaganStrukturRtRwModal: React.FC<BaganStrukturRtRwModalProps> = ({
  isOpen,
  onClose,
  profile,
  onNavigateToAdmin,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  if (!isOpen) return null;

  const imageUrl = profile.baganStrukturRtRwUrl;

  const handleZoomIn = () => setZoomLevel((z) => Math.min(z + 20, 250));
  const handleZoomOut = () => setZoomLevel((z) => Math.max(z - 20, 50));
  const handleResetZoom = () => setZoomLevel(100);

  const handlePrint = () => {
    if (!imageUrl) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      window.print();
      return;
    }
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Bagan Struktur Organisasi RT dan RW Kelurahan Panaikang</title>
          <style>
            body { margin: 0; padding: 20px; text-align: center; font-family: sans-serif; }
            h2 { color: #1C8237; margin-bottom: 4px; }
            p { color: #64748B; font-size: 13px; margin-top: 0; margin-bottom: 20px; }
            img { max-width: 100%; height: auto; border: 1px solid #CBD5E1; border-radius: 8px; }
          </style>
        </head>
        <body>
          <h2>Bagan Struktur Organisasi RT dan RW Kelurahan Panaikang</h2>
          <p>Lembaga Kemasyarakatan Kelurahan (LKK) · RW 01 – RW 07 & 62 RT</p>
          <img src="${imageUrl}" alt="Bagan Struktur Organisasi RT dan RW Kelurahan Panaikang" />
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleDownload = () => {
    if (!imageUrl) return;
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `bagan-struktur-rtrw-panaikang-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="bagan-rtrw-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-5xl h-[92vh] max-h-[900px] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-200 bg-gradient-to-r from-emerald-50/50 via-white to-teal-50/40 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <EmblemKotaMakassar className="w-8 h-10 shrink-0" />
              <div className="h-7 w-px bg-slate-200" />
              <EmblemKelurahanPanaikang className="w-8 h-10 shrink-0" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#1C8237]/10 text-[#1C8237] text-[10px] font-bold uppercase tracking-wider">
                  <Users className="w-3 h-3" />
                  <span>Struktur RT & RW (LKK)</span>
                </span>
                <span className="text-[11px] font-medium text-slate-500 hidden sm:inline">
                  7 RW & 62 RT Kelurahan Panaikang
                </span>
              </div>
              <h2
                id="bagan-rtrw-title"
                className="text-base sm:text-lg font-extrabold text-[#1C8237] tracking-tight leading-tight mt-0.5"
              >
                Bagan Struktur Organisasi RT & RW Kelurahan Panaikang
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {imageUrl && (
              <div className="hidden sm:flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-2xs mr-1">
                <button
                  type="button"
                  onClick={handleZoomOut}
                  disabled={zoomLevel <= 50}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-700 disabled:opacity-40 cursor-pointer"
                  title="Perkecil (-)"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-xs font-mono font-bold px-2 text-slate-700 min-w-[50px] text-center">
                  {zoomLevel}%
                </span>
                <button
                  type="button"
                  onClick={handleZoomIn}
                  disabled={zoomLevel >= 250}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-700 disabled:opacity-40 cursor-pointer"
                  title="Perbesar (+)"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleResetZoom}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 cursor-pointer"
                  title="Reset Zoom (100%)"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {imageUrl && (
              <>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                  title="Unduh Gambar Bagan RT/RW"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                  title="Cetak Bagan RT/RW"
                >
                  <Printer className="w-4 h-4" />
                </button>
              </>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 transition cursor-pointer"
              title="Tutup (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body / Image Viewer Area */}
        <div className="flex-1 overflow-auto bg-slate-100/80 p-4 sm:p-8 flex items-center justify-center relative">
          {imageUrl ? (
            <div
              className="transition-transform duration-150 ease-out origin-center flex items-center justify-center"
              style={{ transform: `scale(${zoomLevel / 100})` }}
            >
              <img
                src={imageUrl}
                alt="Bagan Struktur Organisasi RT dan RW Kelurahan Panaikang"
                className="max-w-full max-h-[72vh] object-contain rounded-2xl shadow-lg border border-slate-200/90 bg-white"
              />
            </div>
          ) : (
            <div className="w-full max-w-lg p-8 sm:p-10 text-center bg-white rounded-3xl border-2 border-dashed border-slate-300 shadow-sm flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[#1C8237] mb-4">
                <ImageIcon className="w-8 h-8" />
              </div>
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                Belum Ada Gambar Bagan Struktur RT & RW
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed max-w-md">
                Bagan Struktur Organisasi 7 RW dan 62 RT ditampilkan langsung dari gambar resmi
                yang diunggah oleh Administrator melalui Panel Admin.
              </p>

              {onNavigateToAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigateToAdmin();
                  }}
                  className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1C8237] hover:bg-[#146329] text-white text-xs font-bold transition shadow-sm cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  <span>Unggah Gambar Bagan di Panel Admin</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-slate-200 bg-white flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            <span className="font-semibold text-slate-700">Lembaga Kemasyarakatan Kelurahan (LKK)</span>
            <span aria-hidden="true">·</span>
            <span>7 RW & 62 RT Panaikang</span>
          </div>

          <div className="flex items-center gap-3">
            {imageUrl && (
              <span className="text-[11px] text-slate-400 font-mono">
                Klik tombol zoom (+ / -) untuk memperbesar detail
              </span>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 font-semibold text-slate-700 cursor-pointer text-xs"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
