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
 * Extracts the official Instagram shortcode (e.g., "DdrMaapvrr4") from either an image path
 * (like "/images/ig_post_1_DdrMaapvrr4.jpg") or an Instagram post URL
 * (like "https://www.instagram.com/p/DdrMaapvrr4/").
 */
export function extractInstagramShortcode(
  rawUrl?: string | null,
  instagramPostUrl?: string | null
): string | null {
  const combined = `${rawUrl || ''} ${instagramPostUrl || ''}`;

  if (combined.includes('DdrMaapvrr4') || combined.includes('ig_post_1_')) return 'DdrMaapvrr4';
  if (combined.includes('DbnJW3OvANh') || combined.includes('ig_post_2_')) return 'DbnJW3OvANh';
  if (combined.includes('DcN5ah3vZdT') || combined.includes('ig_post_3_')) return 'DcN5ah3vZdT';
  if (combined.includes('DeJpFcVJ6jq') || combined.includes('ig_post_4_')) return 'DeJpFcVJ6jq';
  if (combined.includes('DeGDDkFPvJs') || combined.includes('ig_post_5_')) return 'DeGDDkFPvJs';
  if (combined.includes('Dd-xlSLvXKn') || combined.includes('ig_post_6_')) return 'Dd-xlSLvXKn';
  if (combined.includes('Dd33fJSy13M') || combined.includes('ig_post_7_')) return 'Dd33fJSy13M';
  if (combined.includes('Ddtg69NPsBB') || combined.includes('ig_post_8_')) return 'Ddtg69NPsBB';
  if (combined.includes('Ddn9BnBvEId') || combined.includes('ig_post_9_')) return 'Ddn9BnBvEId';
  if (combined.includes('DdfhgGQPaJX') || combined.includes('ig_post_10_')) return 'DdfhgGQPaJX';
  if (combined.includes('DdfU_r-PUM3') || combined.includes('ig_post_11_')) return 'DdfU_r-PUM3';
  if (combined.includes('Dda51qXP4nb') || combined.includes('ig_post_12_')) return 'Dda51qXP4nb';

  // Generic Instagram /p/ or /reel/ URL parser
  const match = combined.match(/instagram\.com\/(?:p|reel|tv)\/([A-Za-z0-9_-]+)/i);
  if (match && match[1]) {
    return match[1];
  }

  return null;
}

const SHORTCODE_TO_STATIC_PATH: Record<string, string> = {
  DdrMaapvrr4: '/images/ig_post_1_DdrMaapvrr4.jpg',
  DbnJW3OvANh: '/images/ig_post_2_DbnJW3OvANh.jpg',
  DcN5ah3vZdT: '/images/ig_post_3_DcN5ah3vZdT.jpg',
  DeJpFcVJ6jq: '/images/ig_post_4_DeJpFcVJ6jq.jpg',
  DeGDDkFPvJs: '/images/ig_post_5_DeGDDkFPvJs.jpg',
  'Dd-xlSLvXKn': '/images/ig_post_6_Dd-xlSLvXKn.jpg',
  Dd33fJSy13M: '/images/ig_post_7_Dd33fJSy13M.jpg',
  Ddtg69NPsBB: '/images/ig_post_8_Ddtg69NPsBB.jpg',
  Ddn9BnBvEId: '/images/ig_post_9_Ddn9BnBvEId.jpg',
  DdfhgGQPaJX: '/images/ig_post_10_DdfhgGQPaJX.jpg',
  'DdfU_r-PUM3': '/images/ig_post_11_DdfU_r-PUM3.jpg',
  Dda51qXP4nb: '/images/ig_post_12_Dda51qXP4nb.jpg',
};

/**
 * Returns the live Instagram embed URL (`https://www.instagram.com/p/<shortcode>/embed/`)
 * for any @kelurahan.panaikang post so it can be rendered directly on Vercel.
 */
export function getInstagramEmbedUrl(
  rawUrl?: string | null,
  instagramPostUrl?: string | null
): string | null {
  const code = extractInstagramShortcode(rawUrl, instagramPostUrl);
  if (!code) return null;
  return `https://www.instagram.com/p/${code}/embed/`;
}

/**
 * Returns the serverless proxy endpoint (`/api/ig-media?code=...`) as a runtime fallback
 * if a static image asset ever fails to load.
 */
export function getInstagramProxyUrl(
  rawUrl?: string | null,
  instagramPostUrl?: string | null
): string | null {
  const trimmed = (rawUrl || '').trim();
  if (trimmed.includes('ig_profile_panaikang')) {
    return '/api/ig-media?code=profile';
  }
  const code = extractInstagramShortcode(rawUrl, instagramPostUrl);
  if (!code) return null;
  return `/api/ig-media?code=${code}`;
}

/**
 * Resolves any stored or initial image path (including legacy `/src/assets/images/...`,
 * `/images/...`, Instagram shortcodes, or data URLs) to a production-ready URL
 * that works on Vercel (`dist/images/...` populated by `scripts/sync-ig-assets.mjs`
 * plus `/api/ig-media?code=...` fallback), static builds, and local development.
 */
export function resolveImageUrl(
  rawUrl?: string | null,
  instagramPostUrl?: string | null
): string {
  const trimmed = (rawUrl || '').trim();

  // Map @kelurahan.panaikang profile picture to static build path
  if (trimmed.includes('ig_profile_panaikang')) {
    return '/images/ig_profile_panaikang.jpg';
  }

  // Map @kelurahan.panaikang Instagram post images to static build path (or proxy for custom IG links)
  const shortcode = extractInstagramShortcode(trimmed, instagramPostUrl);
  if (shortcode) {
    return SHORTCODE_TO_STATIC_PATH[shortcode] || `/api/ig-media?code=${shortcode}`;
  }

  if (!trimmed) {
    return '/images/ig_post_4_DeJpFcVJ6jq.jpg';
  }

  // Keep uploaded base64 data URLs or external https URLs intact
  if (
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('/api/ig-media') ||
    /^https?:\/\//i.test(trimmed)
  ) {
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
