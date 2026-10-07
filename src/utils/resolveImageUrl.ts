const BUNDLED_HERO_NIPAH = new URL(
  '../assets/images/hero_nipah_mall_panaikang_1791355921119.jpg',
  import.meta.url
).href;

const BUNDLED_NIPAH_MALL = new URL(
  '../assets/images/gedung_nipah_mall_makassar_1791355936725.jpg',
  import.meta.url
).href;

const BUNDLED_KERJA_BAKTI = new URL(
  '../assets/images/dokumentasi_kerja_bakti_1_1791349247077.jpg',
  import.meta.url
).href;

const BUNDLED_BANK_SAMPAH = new URL(
  '../assets/images/dokumentasi_bank_sampah_1791349262115.jpg',
  import.meta.url
).href;

const BUNDLED_DRAINASE = new URL(
  '../assets/images/dokumentasi_drainase_bersih_1791349273322.jpg',
  import.meta.url
).href;

const BUNDLED_HERO_PANAIKANG = new URL(
  '../assets/images/hero_panaikang_makassar_1791349230903.jpg',
  import.meta.url
).href;

/**
 * Resolves any stored or initial image path (including legacy `/src/assets/images/...`,
 * `/images/...`, or data URLs) to a production-ready bundled URL that works on Vercel,
 * static builds (`vite build`), and local development.
 */
export function resolveImageUrl(rawUrl?: string | null): string {
  if (!rawUrl) return BUNDLED_KERJA_BAKTI;
  const trimmed = rawUrl.trim();
  if (!trimmed) return BUNDLED_KERJA_BAKTI;

  // Keep uploaded base64 data URLs or external https URLs intact
  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:') || /^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  if (trimmed.includes('hero_nipah_mall_panaikang')) {
    return BUNDLED_HERO_NIPAH;
  }
  if (trimmed.includes('gedung_nipah_mall_makassar')) {
    return BUNDLED_NIPAH_MALL;
  }
  if (trimmed.includes('dokumentasi_kerja_bakti')) {
    return BUNDLED_KERJA_BAKTI;
  }
  if (trimmed.includes('dokumentasi_bank_sampah')) {
    return BUNDLED_BANK_SAMPAH;
  }
  if (trimmed.includes('dokumentasi_drainase_bersih')) {
    return BUNDLED_DRAINASE;
  }
  if (trimmed.includes('hero_panaikang_makassar')) {
    return BUNDLED_HERO_PANAIKANG;
  }

  return trimmed;
}
