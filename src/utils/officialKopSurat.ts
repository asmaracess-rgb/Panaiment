import { jsPDF } from 'jspdf';
import { KelurahanProfile } from '../types';

export type ReportHeaderSizePreset = 'spacious' | 'standard' | 'compact';

export interface KopSuratSizeSpec {
  preset: ReportHeaderPresetMeta;
  htmlLogoWidthPx: number;
  htmlLogoHeightPx: number;
  pdfLogoWidthMm: number;
  pdfLogoHeightMm: number;
  previewLogoClass: string;
}

export interface ReportHeaderPresetMeta {
  id: ReportHeaderSizePreset;
  label: string;
  govFontPx: number;
  kecFontPx: number;
  kelFontPx: number;
  addrFontPx: number;
  pdfGovPt: number;
  pdfKecPt: number;
  pdfKelPt: number;
  pdfAddrPt: number;
}

const PRESET_SPECS: Record<ReportHeaderSizePreset, KopSuratSizeSpec> = {
  spacious: {
    preset: {
      id: 'spacious',
      label: 'Proporsi Laporan Fokus / Surat Resmi (Ukuran Penuh)',
      govFontPx: 13.5,
      kecFontPx: 14.5,
      kelFontPx: 18,
      addrFontPx: 10.5,
      pdfGovPt: 11,
      pdfKecPt: 12,
      pdfKelPt: 14.2,
      pdfAddrPt: 7.8,
    },
    htmlLogoWidthPx: 66,
    htmlLogoHeightPx: 75,
    pdfLogoWidthMm: 17.5,
    pdfLogoHeightMm: 19.8,
    previewLogoClass: 'w-14 h-16 sm:w-16 sm:h-[74px]',
  },
  standard: {
    preset: {
      id: 'standard',
      label: 'Proporsi Laporan Wilayah / Bulanan (Ukuran Standar A4)',
      govFontPx: 12.5,
      kecFontPx: 13.5,
      kelFontPx: 16.5,
      addrFontPx: 10,
      pdfGovPt: 10.5,
      pdfKecPt: 11.2,
      pdfKelPt: 13.2,
      pdfAddrPt: 7.4,
    },
    htmlLogoWidthPx: 58,
    htmlLogoHeightPx: 66,
    pdfLogoWidthMm: 15.8,
    pdfLogoHeightMm: 17.8,
    previewLogoClass: 'w-12 h-14 sm:w-14 sm:h-16',
  },
  compact: {
    preset: {
      id: 'compact',
      label: 'Proporsi Rekapitulasi Tabel Padat (Ukuran Kompak Proporsional)',
      govFontPx: 11.5,
      kecFontPx: 12.5,
      kelFontPx: 15,
      addrFontPx: 9.5,
      pdfGovPt: 9.8,
      pdfKecPt: 10.5,
      pdfKelPt: 12.4,
      pdfAddrPt: 7,
    },
    htmlLogoWidthPx: 50,
    htmlLogoHeightPx: 57,
    pdfLogoWidthMm: 14.2,
    pdfLogoHeightMm: 16,
    previewLogoClass: 'w-11 h-13 sm:w-12 sm:h-14',
  },
};

export function getKopSuratSizeSpec(preset: ReportHeaderSizePreset = 'standard'): KopSuratSizeSpec {
  return PRESET_SPECS[preset] || PRESET_SPECS.standard;
}

/**
 * Returns standalone SVG markup for Lambang Pemerintah Kota Makassar
 */
export function getMakassarLogoSvgMarkup(widthPx = 58, heightPx = 66): string {
  return `<svg width="${widthPx}" height="${heightPx}" viewBox="0 0 180 200" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Lambang Pemerintah Kota Makassar">
    <defs>
      <path id="makassarRibbonPathPrint" d="M 24,158 Q 90,192 156,158" />
      <linearGradient id="shieldGoldPrint" x1="30" y1="30" x2="150" y2="160" gradientUnits="userSpaceOnUse">
        <stop stop-color="#FDE047" />
        <stop offset="0.5" stop-color="#EAB308" />
        <stop offset="1" stop-color="#CA8A04" />
      </linearGradient>
      <linearGradient id="sunBurstPrint" x1="90" y1="54" x2="90" y2="112" gradientUnits="userSpaceOnUse">
        <stop stop-color="#FEF08A" />
        <stop offset="1" stop-color="#FACC15" />
      </linearGradient>
    </defs>
    <g>
      <path d="M54 14H68V20H82V14H98V20H112V14H126V36H54V14Z" fill="#C81E1E" stroke="#450A0A" stroke-width="2.2" stroke-linejoin="round" />
      <line x1="55" y1="21" x2="125" y2="21" stroke="#FECACA" stroke-width="1.3" />
      <line x1="55" y1="27" x2="125" y2="27" stroke="#FECACA" stroke-width="1.3" />
      <line x1="55" y1="32.5" x2="125" y2="32.5" stroke="#FECACA" stroke-width="1.3" />
      <line x1="68" y1="21" x2="68" y2="27" stroke="#FECACA" stroke-width="1.2" />
      <line x1="90" y1="21" x2="90" y2="27" stroke="#FECACA" stroke-width="1.2" />
      <line x1="112" y1="21" x2="112" y2="27" stroke="#FECACA" stroke-width="1.2" />
      <line x1="78" y1="27" x2="78" y2="32.5" stroke="#FECACA" stroke-width="1.2" />
      <line x1="102" y1="27" x2="102" y2="32.5" stroke="#FECACA" stroke-width="1.2" />
      <rect x="58" y="34" width="64" height="4" rx="1.5" fill="#FACC15" stroke="#78350F" stroke-width="1.2" />
    </g>
    <path d="M36 38H144V98C144 134 90 158 90 158C90 158 36 134 36 98V38Z" fill="#FFFFFF" stroke="#7F1D1D" stroke-width="4.5" stroke-linejoin="round" />
    <path d="M40 42H140V97C140 130 90 152 90 152C90 152 40 130 40 97V42Z" fill="#FFFFFF" stroke="url(#shieldGoldPrint)" stroke-width="3" stroke-linejoin="round" />
    <path d="M84 136C56 128 48 102 52 68" stroke="#15803D" stroke-width="3.5" stroke-linecap="round" />
    <ellipse cx="50" cy="74" rx="6" ry="3" transform="rotate(-40 50 74)" fill="#16A34A" />
    <ellipse cx="49" cy="84" rx="6.5" ry="3.2" transform="rotate(-30 49 84)" fill="#15803D" />
    <ellipse cx="51" cy="95" rx="6.5" ry="3.2" transform="rotate(-20 51 95)" fill="#16A34A" />
    <ellipse cx="55" cy="106" rx="6.5" ry="3.2" transform="rotate(-10 55 106)" fill="#15803D" />
    <ellipse cx="61" cy="117" rx="6.5" ry="3.2" transform="rotate(10 61 117)" fill="#16A34A" />
    <ellipse cx="70" cy="126" rx="6" ry="3" transform="rotate(25 70 126)" fill="#15803D" />
    <circle cx="57" cy="72" r="2.3" fill="#EAB308" />
    <circle cx="55" cy="81" r="2.3" fill="#EAB308" />
    <circle cx="56" cy="90" r="2.3" fill="#EAB308" />
    <circle cx="59" cy="100" r="2.3" fill="#EAB308" />
    <circle cx="64" cy="109" r="2.3" fill="#EAB308" />
    <path d="M96 136C124 128 132 102 128 68" stroke="#15803D" stroke-width="3.5" stroke-linecap="round" />
    <ellipse cx="130" cy="74" rx="6" ry="3" transform="rotate(40 130 74)" fill="#16A34A" />
    <ellipse cx="131" cy="84" rx="6.5" ry="3.2" transform="rotate(30 131 84)" fill="#15803D" />
    <ellipse cx="129" cy="95" rx="6.5" ry="3.2" transform="rotate(20 129 95)" fill="#16A34A" />
    <ellipse cx="125" cy="106" rx="6.5" ry="3.2" transform="rotate(10 125 106)" fill="#15803D" />
    <ellipse cx="119" cy="117" rx="6.5" ry="3.2" transform="rotate(-10 119 117)" fill="#16A34A" />
    <ellipse cx="110" cy="126" rx="6" ry="3" transform="rotate(-25 110 126)" fill="#15803D" />
    <circle cx="123" cy="72" r="2.6" fill="#FFFFFF" stroke="#15803D" stroke-width="1.2" />
    <circle cx="125" cy="82" r="2.6" fill="#FFFFFF" stroke="#15803D" stroke-width="1.2" />
    <circle cx="124" cy="92" r="2.6" fill="#FFFFFF" stroke="#15803D" stroke-width="1.2" />
    <circle cx="121" cy="102" r="2.6" fill="#FFFFFF" stroke="#15803D" stroke-width="1.2" />
    <rect x="83" y="131" width="14" height="7" rx="2" fill="#C81E1E" stroke="#7F1D1D" stroke-width="1" />
    <line x1="86" y1="131" x2="86" y2="138" stroke="#FACC15" stroke-width="1.5" />
    <line x1="94" y1="131" x2="94" y2="138" stroke="#FACC15" stroke-width="1.5" />
    <circle cx="90" cy="88" r="31" fill="url(#sunBurstPrint)" stroke="#CA8A04" stroke-width="2.5" />
    <g stroke="#EAB308" stroke-width="1.2" opacity="0.8">
      <line x1="90" y1="58" x2="90" y2="95" />
      <line x1="68" y1="66" x2="90" y2="95" />
      <line x1="112" y1="66" x2="90" y2="95" />
      <line x1="61" y1="80" x2="90" y2="95" />
      <line x1="119" y1="80" x2="90" y2="95" />
    </g>
    <path d="M62 100C70 97 78 102 86 99C94 96 102 102 110 99C114 98 116 99 118 100C114 111 103 118 90 118C77 118 66 111 62 100Z" fill="#0D3868" />
    <path d="M65 104C73 102 81 106 89 104C97 102 105 106 115 104" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round" />
    <path d="M70 110C78 108 86 112 94 110C101 108 106 111 110 110" stroke="#38BDF8" stroke-width="2" stroke-linecap="round" />
    <path d="M67 95L75 102H105L113 92L106 95H67Z" fill="#0F172A" />
    <line x1="87" y1="62" x2="87" y2="96" stroke="#0F172A" stroke-width="2.2" />
    <line x1="97" y1="67" x2="97" y2="96" stroke="#0F172A" stroke-width="1.8" />
    <path d="M86 63L71 92H86V63Z" fill="#FFFFFF" stroke="#1E293B" stroke-width="1.3" stroke-linejoin="round" />
    <path d="M88 66L96 92H88V66Z" fill="#F8FAFC" stroke="#1E293B" stroke-width="1.2" stroke-linejoin="round" />
    <path d="M98 69L110 92H98V69Z" fill="#FFFFFF" stroke="#1E293B" stroke-width="1.2" stroke-linejoin="round" />
    <path d="M10 144L28 136L32 154L16 162L18 151L10 144Z" fill="#991B1B" stroke="#450A0A" stroke-width="1.8" stroke-linejoin="round" />
    <path d="M170 144L152 136L148 154L164 162L162 151L170 144Z" fill="#991B1B" stroke="#450A0A" stroke-width="1.8" stroke-linejoin="round" />
    <path d="M22 142C55 174 125 174 158 142L152 162C120 192 60 192 28 162L22 142Z" fill="#C81E1E" stroke="#450A0A" stroke-width="2.2" stroke-linejoin="round" />
    <path d="M25 145C56 175 124 175 155 145" stroke="#FCA5A5" stroke-width="1" fill="none" />
    <text fill="#FFFFFF" font-family="Arial, sans-serif" font-size="11.5" font-weight="800" letter-spacing="1.1">
      <textPath href="#makassarRibbonPathPrint" startOffset="50%" text-anchor="middle">KOTA MAKASSAR</textPath>
    </text>
  </svg>`;
}

/**
 * Returns standalone SVG markup for Lambang Resmi Kelurahan Panaikang
 */
export function getPanaikangLogoSvgMarkup(widthPx = 58, heightPx = 66): string {
  return `<svg width="${widthPx}" height="${heightPx}" viewBox="45 35 410 420" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Lambang Kelurahan Panaikang">
    <defs>
      <path id="kelurahanArcPrint" d="M 106,368 Q 250,336 394,368" />
      <path id="panaikangArcPrint" d="M 102,414 Q 250,382 398,414" />
    </defs>
    <circle cx="250" cy="222" r="174" fill="#461708" />
    <circle cx="250" cy="222" r="165" fill="#E8A317" />
    <circle cx="250" cy="222" r="153" fill="#461708" />
    <circle cx="250" cy="222" r="146" fill="#7D1010" />
    <path d="M 244 172 Q 250 166 256 172 L 392 326 L 108 326 Z" fill="#461708" />
    <path d="M 246 176 Q 250 172 254 176 L 384 324 L 116 324 Z" fill="#E8A317" />
    <path d="M 247 182 Q 250 179 253 182 L 362 326 L 138 326 Z" fill="#481B09" stroke="#461708" stroke-width="5" stroke-linejoin="round" />
    <rect x="247" y="198" width="6" height="15" rx="3" fill="#E8A317" />
    <rect x="246" y="223" width="8" height="20" rx="3.5" fill="#E8A317" />
    <rect x="244.5" y="254" width="11" height="25" rx="4" fill="#E8A317" />
    <rect x="243" y="291" width="14" height="30" rx="4.5" fill="#E8A317" />
    <polygon points="250,72 264,106 301,109 273,133 281,169 250,150 219,169 227,133 199,109 236,106" fill="#E8A317" stroke="#461708" stroke-width="7" stroke-linejoin="round" />
    <path d="M 159 306 C 122 258, 120 186, 152 132" stroke="#461708" stroke-width="12" stroke-linecap="round" />
    <path d="M 159 306 C 122 258, 120 186, 152 132" stroke="#E8A317" stroke-width="5.5" stroke-linecap="round" />
    <path d="M 134 268 C 110 262, 104 238, 114 222 C 128 232, 136 250, 134 268 Z" fill="#E8A317" stroke="#461708" stroke-width="5.5" stroke-linejoin="round" />
    <path d="M 129 238 C 106 228, 104 204, 116 188 C 128 200, 133 218, 129 238 Z" fill="#E8A317" stroke="#461708" stroke-width="5.5" stroke-linejoin="round" />
    <path d="M 130 206 C 110 194, 110 170, 124 156 C 134 168, 136 188, 130 206 Z" fill="#E8A317" stroke="#461708" stroke-width="5.5" stroke-linejoin="round" />
    <path d="M 136 176 C 120 162, 122 140, 136 128 C 144 142, 144 160, 136 176 Z" fill="#E8A317" stroke="#461708" stroke-width="5.5" stroke-linejoin="round" />
    <path d="M 145 146 C 138 128, 148 108, 166 102 C 168 120, 158 138, 145 146 Z" fill="#E8A317" stroke="#461708" stroke-width="5.5" stroke-linejoin="round" />
    <path d="M 138 272 C 154 264, 166 248, 164 230 C 148 238, 138 254, 138 272 Z" fill="#E8A317" stroke="#461708" stroke-width="5.5" stroke-linejoin="round" />
    <path d="M 133 242 C 150 234, 162 218, 162 200 C 146 208, 135 224, 133 242 Z" fill="#E8A317" stroke="#461708" stroke-width="5.5" stroke-linejoin="round" />
    <path d="M 134 210 C 152 202, 164 186, 164 170 C 148 178, 136 194, 134 210 Z" fill="#E8A317" stroke="#461708" stroke-width="5.5" stroke-linejoin="round" />
    <path d="M 140 180 C 156 172, 168 158, 168 142 C 152 150, 142 164, 140 180 Z" fill="#E8A317" stroke="#461708" stroke-width="5.5" stroke-linejoin="round" />
    <path d="M 322 162 C 308 158, 306 138, 320 132 C 324 114, 348 112, 356 128 C 372 132, 372 154, 356 160 C 346 166, 332 166, 322 162 Z" fill="#FAF0D7" stroke="#461708" stroke-width="6" stroke-linejoin="round" />
    <path d="M 318 220 C 306 216, 306 198, 318 192 C 322 178, 342 178, 348 192 C 358 198, 356 216, 342 220 C 334 224, 324 224, 318 220 Z" fill="#FAF0D7" stroke="#461708" stroke-width="6" stroke-linejoin="round" />
    <path d="M 358 214 C 348 208, 350 190, 362 184 C 368 172, 386 174, 390 188 C 398 196, 394 214, 380 216 C 372 218, 364 218, 358 214 Z" fill="#FAF0D7" stroke="#461708" stroke-width="6" stroke-linejoin="round" />
    <path d="M 350 264 C 332 256, 326 240, 334 230 C 346 236, 354 248, 350 264 Z" fill="#5B8427" stroke="#461708" stroke-width="5.5" stroke-linejoin="round" />
    <path d="M 356 248 C 368 234, 382 228, 392 234 C 386 246, 372 252, 356 248 Z" fill="#5B8427" stroke="#461708" stroke-width="5.5" stroke-linejoin="round" />
    <path d="M 350 280 C 364 264, 382 258, 394 264 C 386 278, 368 286, 350 280 Z" fill="#5B8427" stroke="#461708" stroke-width="5.5" stroke-linejoin="round" />
    <path d="M 323 308 C 344 276, 356 226, 344 156" stroke="#461708" stroke-width="11" stroke-linecap="round" />
    <path d="M 323 308 C 344 276, 356 226, 344 156" stroke="#5B8427" stroke-width="5.5" stroke-linecap="round" />
    <path d="M 349 232 L 336 214" stroke="#461708" stroke-width="9" stroke-linecap="round" />
    <path d="M 349 232 L 336 214" stroke="#5B8427" stroke-width="4.5" stroke-linecap="round" />
    <path d="M 351 224 L 368 206" stroke="#461708" stroke-width="9" stroke-linecap="round" />
    <path d="M 351 224 L 368 206" stroke="#5B8427" stroke-width="4.5" stroke-linecap="round" />
    <path d="M 94 342 C 90 318, 175 300, 250 300 C 325 300, 410 318, 406 342 L 412 394 C 414 420, 394 434, 368 431 C 310 423, 190 423, 132 431 C 106 434, 86 420, 88 394 Z" fill="#7D1010" stroke="#461708" stroke-width="8.5" stroke-linejoin="round" />
    <text fill="#E8A317" stroke="#461708" stroke-width="9" paint-order="stroke fill" stroke-linejoin="round" font-family="Arial, sans-serif" font-size="36" font-weight="900" letter-spacing="2">
      <textPath href="#kelurahanArcPrint" startOffset="50%" text-anchor="middle">KELURAHAN</textPath>
    </text>
    <text fill="#E8A317" stroke="#461708" stroke-width="9" paint-order="stroke fill" stroke-linejoin="round" font-family="Arial, sans-serif" font-size="38" font-weight="900" letter-spacing="2.5">
      <textPath href="#panaikangArcPrint" startOffset="50%" text-anchor="middle">PANAIKANG</textPath>
    </text>
  </svg>`;
}

/**
 * Builds the HTML Kop Surat block with Logo Pemerintah Kota Makassar on top-left
 * and Logo Kelurahan Panaikang on top-right, sized proportionally to the report.
 */
export function buildOfficialKopSuratHtml(
  profile: KelurahanProfile,
  preset: ReportHeaderSizePreset = 'standard'
): string {
  const spec = getKopSuratSizeSpec(preset);
  const leftSvg = getMakassarLogoSvgMarkup(spec.htmlLogoWidthPx, spec.htmlLogoHeightPx);
  const rightSvg = getPanaikangLogoSvgMarkup(spec.htmlLogoWidthPx, spec.htmlLogoHeightPx);

  return `
    <div style="display:flex;align-items:center;justify-content:space-between;gap:14px;border-bottom:3px double #0d3868;padding-bottom:10px;margin-bottom:14px;">
      <div style="flex-shrink:0;display:flex;align-items:center;justify-content:center;">
        ${leftSvg}
      </div>
      <div style="flex:1;text-align:center;padding:0 6px;">
        <div style="font-size:${spec.preset.govFontPx}px;font-weight:700;color:#0d3868;letter-spacing:0.6px;text-transform:uppercase;">
          PEMERINTAH KOTA MAKASSAR
        </div>
        <div style="font-size:${spec.preset.kecFontPx}px;font-weight:700;color:#0d3868;margin-top:2px;letter-spacing:0.4px;text-transform:uppercase;">
          KECAMATAN PANAKKUKANG
        </div>
        <div style="font-size:${spec.preset.kelFontPx}px;font-weight:800;color:#0d3868;margin-top:2px;letter-spacing:0.5px;text-transform:uppercase;">
          KELURAHAN PANAIKANG
        </div>
        <div style="font-size:${spec.preset.addrFontPx}px;color:#475569;margin-top:4px;line-height:1.35;">
          ${profile.officeAddress} &middot; Telp: ${profile.phoneContact} &middot; Email: ${profile.emailContact} &middot; Kode Pos ${profile.postalCode}
        </div>
      </div>
      <div style="flex-shrink:0;display:flex;align-items:center;justify-content:center;">
        ${rightSvg}
      </div>
    </div>
  `;
}

// High-resolution PNG Data URL cache for jsPDF embedding
let cachedMakassarPngUrl: string | null = null;
let cachedPanaikangPngUrl: string | null = null;

function rasterizeSvgToPngDataUrl(svgString: string, widthPx: number, heightPx: number): Promise<string | null> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      const encoded = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgString);
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = widthPx;
          canvas.height = heightPx;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(null);
            return;
          }
          ctx.clearRect(0, 0, widthPx, heightPx);
          ctx.drawImage(img, 0, 0, widthPx, heightPx);
          resolve(canvas.toDataURL('image/png'));
        } catch {
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = encoded;
    } catch {
      resolve(null);
    }
  });
}

// Eagerly warm up the high-DPI PNG logo cache in the browser
if (typeof window !== 'undefined') {
  rasterizeSvgToPngDataUrl(getMakassarLogoSvgMarkup(360, 400), 360, 400).then((url) => {
    if (url) cachedMakassarPngUrl = url;
  });
  rasterizeSvgToPngDataUrl(getPanaikangLogoSvgMarkup(360, 400), 360, 400).then((url) => {
    if (url) cachedPanaikangPngUrl = url;
  });
}

/**
 * Fallback vector drawing for Lambang Kota Makassar in jsPDF if PNG cache is not yet ready
 */
function drawMakassarVectorInPdf(doc: jsPDF, x: number, y: number, w: number, h: number) {
  const cx = x + w / 2;
  // 1. Fort Crown at top
  doc.setFillColor(200, 30, 30);
  doc.setDrawColor(69, 10, 10);
  doc.setLineWidth(0.25);
  doc.roundedRect(x + w * 0.26, y + h * 0.04, w * 0.48, h * 0.12, 0.5, 0.5, 'FD');
  doc.setFillColor(250, 204, 21);
  doc.rect(x + w * 0.28, y + h * 0.15, w * 0.44, h * 0.025, 'F');

  // 2. Main Shield
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(127, 29, 29);
  doc.setLineWidth(0.6);
  doc.roundedRect(x + w * 0.14, y + h * 0.18, w * 0.72, h * 0.58, 2.5, 2.5, 'FD');
  doc.setDrawColor(234, 179, 8);
  doc.setLineWidth(0.35);
  doc.roundedRect(x + w * 0.17, y + h * 0.205, w * 0.66, h * 0.53, 2, 2, 'D');

  // 3. Center Medallion with Phinisi & Sea
  const medY = y + h * 0.45;
  const medR = Math.min(w, h) * 0.21;
  doc.setFillColor(254, 240, 138);
  doc.setDrawColor(202, 138, 4);
  doc.setLineWidth(0.3);
  doc.circle(cx, medY, medR, 'FD');

  // Sea at bottom of medallion
  doc.setFillColor(13, 56, 104);
  doc.rect(cx - medR * 0.85, medY + medR * 0.15, medR * 1.7, medR * 0.65, 'F');

  // Phinisi Sails (white triangles)
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.2);
  doc.triangle(cx - medR * 0.55, medY + medR * 0.12, cx - medR * 0.05, medY - medR * 0.65, cx - medR * 0.05, medY + medR * 0.12, 'FD');
  doc.triangle(cx + medR * 0.05, medY - medR * 0.5, cx + medR * 0.55, medY + medR * 0.12, cx + medR * 0.05, medY + medR * 0.12, 'FD');

  // Green Wreath arcs
  doc.setDrawColor(21, 128, 61);
  doc.setLineWidth(0.45);
  doc.circle(cx, medY, medR * 1.18, 'D');

  // 4. Bottom Red Ribbon "KOTA MAKASSAR"
  doc.setFillColor(200, 30, 30);
  doc.setDrawColor(69, 10, 10);
  doc.setLineWidth(0.25);
  doc.roundedRect(x + w * 0.06, y + h * 0.79, w * 0.88, h * 0.14, 1, 1, 'FD');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(Math.max(4, w * 0.25));
  doc.text('KOTA MAKASSAR', cx, y + h * 0.88, { align: 'center' });
}

/**
 * Fallback vector drawing for Lambang Kelurahan Panaikang in jsPDF if PNG cache is not yet ready
 */
function drawPanaikangVectorInPdf(doc: jsPDF, x: number, y: number, w: number, h: number) {
  const cx = x + w / 2;
  const cy = y + h * 0.44;
  const r = Math.min(w, h) * 0.42;

  // 1. Circular Maroon Dome with Golden-Amber Ring
  doc.setFillColor(70, 23, 8);
  doc.circle(cx, cy, r, 'F');
  doc.setFillColor(232, 163, 23);
  doc.circle(cx, cy, r * 0.94, 'F');
  doc.setFillColor(125, 16, 16);
  doc.circle(cx, cy, r * 0.84, 'F');

  // 2. Perspective Road in Center
  doc.setFillColor(232, 163, 23);
  doc.triangle(cx, cy - r * 0.25, cx - r * 0.65, cy + r * 0.62, cx + r * 0.65, cy + r * 0.62, 'F');
  doc.setFillColor(72, 27, 9);
  doc.triangle(cx, cy - r * 0.2, cx - r * 0.52, cy + r * 0.62, cx + r * 0.52, cy + r * 0.62, 'F');

  // Dashed road markings
  doc.setFillColor(232, 163, 23);
  doc.rect(cx - 0.3, cy - r * 0.08, 0.6, r * 0.16, 'F');
  doc.rect(cx - 0.4, cy + r * 0.15, 0.8, r * 0.18, 'F');
  doc.rect(cx - 0.5, cy + r * 0.38, 1.0, r * 0.2, 'F');

  // 3. Top Golden Star
  doc.setFillColor(232, 163, 23);
  doc.circle(cx, cy - r * 0.46, r * 0.18, 'F');

  // 4. Bottom Maroon Arched Banner "KELURAHAN PANAIKANG"
  doc.setFillColor(125, 16, 16);
  doc.setDrawColor(70, 23, 8);
  doc.setLineWidth(0.3);
  doc.roundedRect(x + w * 0.06, y + h * 0.72, w * 0.88, h * 0.22, 1.2, 1.2, 'FD');
  doc.setTextColor(232, 163, 23);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(Math.max(3.8, w * 0.23));
  doc.text('KELURAHAN', cx, y + h * 0.815, { align: 'center' });
  doc.text('PANAIKANG', cx, y + h * 0.905, { align: 'center' });
}

/**
 * Draws the official Kop Surat on a jsPDF page with:
 * - Logo Pemerintah Kota Makassar on the top-left
 * - Logo Kelurahan Panaikang on the top-right
 * - Size automatically scaled to the report preset ('spacious' | 'standard' | 'compact')
 */
export function drawOfficialPdfKopSurat(
  doc: jsPDF,
  profile: KelurahanProfile,
  marginX: number,
  preset: ReportHeaderSizePreset = 'standard'
): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  const spec = getKopSuratSizeSpec(preset);
  const logoW = spec.pdfLogoWidthMm;
  const logoH = spec.pdfLogoHeightMm;
  const topY = 11.5;

  const leftLogoX = marginX;
  const rightLogoX = pageWidth - marginX - logoW;

  // Top-Left: Logo Pemerintah Kota Makassar
  if (cachedMakassarPngUrl) {
    try {
      doc.addImage(cachedMakassarPngUrl, 'PNG', leftLogoX, topY, logoW, logoH);
    } catch {
      drawMakassarVectorInPdf(doc, leftLogoX, topY, logoW, logoH);
    }
  } else {
    drawMakassarVectorInPdf(doc, leftLogoX, topY, logoW, logoH);
  }

  // Top-Right: Logo Kelurahan Panaikang
  if (cachedPanaikangPngUrl) {
    try {
      doc.addImage(cachedPanaikangPngUrl, 'PNG', rightLogoX, topY, logoW, logoH);
    } catch {
      drawPanaikangVectorInPdf(doc, rightLogoX, topY, logoW, logoH);
    }
  } else {
    drawPanaikangVectorInPdf(doc, rightLogoX, topY, logoW, logoH);
  }

  // Center Official Kop Surat Text
  const centerX = pageWidth / 2;
  doc.setTextColor(13, 56, 104);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(spec.preset.pdfGovPt);
  doc.text('PEMERINTAH KOTA MAKASSAR', centerX, topY + 4.5, { align: 'center' });

  doc.setFontSize(spec.preset.pdfKecPt);
  doc.text('KECAMATAN PANAKKUKANG', centerX, topY + 9.4, { align: 'center' });

  doc.setFontSize(spec.preset.pdfKelPt);
  doc.text('KELURAHAN PANAIKANG', centerX, topY + 14.8, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(spec.preset.pdfAddrPt);
  doc.setTextColor(71, 85, 105);
  doc.text(
    `${profile.officeAddress} · Telp: ${profile.phoneContact} · Kode Pos ${profile.postalCode}`,
    centerX,
    topY + 19.2,
    { align: 'center' }
  );

  const lineY = topY + Math.max(logoH + 1.5, 21.2);
  doc.setDrawColor(13, 56, 104);
  doc.setLineWidth(0.75);
  doc.line(marginX, lineY, pageWidth - marginX, lineY);
  doc.setLineWidth(0.25);
  doc.line(marginX, lineY + 1, pageWidth - marginX, lineY + 1);

  return lineY + 6;
}

/**
 * Draws a compact continuation header on page 2+ of multi-page PDF reports
 * so every printed page displays the Makassar logo (top-left) and Panaikang logo (top-right).
 */
export function drawContinuationPdfHeader(
  doc: jsPDF,
  reportTitle: string,
  documentNumber: string,
  marginX: number
): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  const topY = 9;
  const miniW = 10;
  const miniH = 11.2;

  if (cachedMakassarPngUrl) {
    try {
      doc.addImage(cachedMakassarPngUrl, 'PNG', marginX, topY, miniW, miniH);
    } catch {
      drawMakassarVectorInPdf(doc, marginX, topY, miniW, miniH);
    }
  } else {
    drawMakassarVectorInPdf(doc, marginX, topY, miniW, miniH);
  }

  if (cachedPanaikangPngUrl) {
    try {
      doc.addImage(cachedPanaikangPngUrl, 'PNG', pageWidth - marginX - miniW, topY, miniW, miniH);
    } catch {
      drawPanaikangVectorInPdf(doc, pageWidth - marginX - miniW, topY, miniW, miniH);
    }
  } else {
    drawPanaikangVectorInPdf(doc, pageWidth - marginX - miniW, topY, miniW, miniH);
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.2);
  doc.setTextColor(13, 56, 104);
  doc.text('PEMERINTAH KOTA MAKASSAR · KELURAHAN PANAIKANG', pageWidth / 2, topY + 4.2, {
    align: 'center',
  });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text(`${reportTitle} — No: ${documentNumber}`, pageWidth / 2, topY + 8.4, {
    align: 'center',
  });

  const lineY = topY + miniH + 1.5;
  doc.setDrawColor(13, 56, 104);
  doc.setLineWidth(0.4);
  doc.line(marginX, lineY, pageWidth - marginX, lineY);

  return lineY + 5;
}
