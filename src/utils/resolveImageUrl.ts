const BUNDLED_HERO_NIPAH = '/images/hero_nipah_mall_panaikang_1791355921119.jpg';
const BUNDLED_NIPAH_MALL = '/images/gedung_nipah_mall_makassar_1791355936725.jpg';
const BUNDLED_KERJA_BAKTI = '/images/dokumentasi_kerja_bakti_1_1791349247077.jpg';
const BUNDLED_BANK_SAMPAH = '/images/dokumentasi_bank_sampah_1791349262115.jpg';
const BUNDLED_DRAINASE = '/images/dokumentasi_drainase_bersih_1791349273322.jpg';
const BUNDLED_HERO_PANAIKANG = '/images/hero_panaikang_makassar_1791349230903.jpg';

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

  if (combined.includes('Dfiuay9j8M0') || combined.includes('ig_post_latest_0_')) return 'Dfiuay9j8M0';
  if (combined.includes('DfgPz35v2Ed') || combined.includes('ig_post_latest_0b_')) return 'DfgPz35v2Ed';
  if (combined.includes('DfZsJAUvDQG') || combined.includes('ig_post_kerjabakti_0_')) return 'DfZsJAUvDQG';
  if (combined.includes('DfYirNrJjaT') || combined.includes('ig_post_kerjabakti_1_')) return 'DfYirNrJjaT';
  if (combined.includes('DfHDLK2vqk0') || combined.includes('ig_post_kerjabakti_2_')) return 'DfHDLK2vqk0';
  if (combined.includes('DfT7acUJdwh') || combined.includes('ig_post_latest_1_')) return 'DfT7acUJdwh';
  if (combined.includes('DfM0_MZvZON') || combined.includes('ig_post_latest_2_')) return 'DfM0_MZvZON';
  if (combined.includes('DfM0LNqPFR5') || combined.includes('ig_post_latest_3_')) return 'DfM0LNqPFR5';
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

  // Check ?code= parameter from /api/ig-media?code=...
  const codeQueryMatch = combined.match(/[?&]code=([A-Za-z0-9_-]+)/i);
  if (codeQueryMatch && codeQueryMatch[1]) {
    return codeQueryMatch[1];
  }

  // Generic Instagram /p/ or /reel/ URL parser
  const match = combined.match(/instagram\.com\/(?:p|reel|tv)\/([A-Za-z0-9_-]+)/i);
  if (match && match[1]) {
    return match[1];
  }

  return null;
}

const SHORTCODE_TO_STATIC_PATH: Record<string, string> = {
  Dfiuay9j8M0: '/images/ig_post_latest_0_Dfiuay9j8M0.jpg',
  DfgPz35v2Ed: '/images/ig_post_latest_0b_DfgPz35v2Ed.jpg',
  DfZsJAUvDQG: '/images/ig_post_kerjabakti_0_DfZsJAUvDQG.jpg',
  DfYirNrJjaT: '/images/ig_post_kerjabakti_1_DfYirNrJjaT.jpg',
  DfHDLK2vqk0: '/images/ig_post_kerjabakti_2_DfHDLK2vqk0.jpg',
  DfT7acUJdwh: '/images/ig_post_latest_1_DfT7acUJdwh.jpg',
  DfM0_MZvZON: '/images/ig_post_latest_2_DfM0_MZvZON.jpg',
  DfM0LNqPFR5: '/images/ig_post_latest_3_DfM0LNqPFR5.jpg',
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
    return '/images/ig_profile_panaikang.jpg';
  }
  const code = extractInstagramShortcode(rawUrl, instagramPostUrl);
  if (!code) return null;
  return SHORTCODE_TO_STATIC_PATH[code] || `/api/ig-media?code=${code}`;
}

/**
 * Resolves any stored or initial image path (including legacy `/src/assets/images/...`,
 * `/images/...`, Instagram shortcodes, or data URLs) to a production-ready static URL
 * that works on Vercel (`dist/images/...`), static builds, and local development.
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

  // Map @kelurahan.panaikang Instagram post images to static build path or live proxy
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
  if (trimmed.includes('uf_kesadaran_rw07')) {
    return '/images/uf_kesadaran_rw07.jpg';
  }
  if (trimmed.includes('uf_angkasa_rw05')) {
    return '/images/uf_angkasa_rw05.jpg';
  }
  if (trimmed.includes('uf_teratai_rw05')) {
    return '/images/uf_teratai_rw05.jpg';
  }
  if (trimmed.includes('uf_sipakainga_rw04')) {
    return '/images/uf_sipakainga_rw04.jpg';
  }
  if (trimmed.includes('uf_campagaya_rw03')) {
    return '/images/uf_campagaya_rw03.jpg';
  }
  if (trimmed.includes('uf_bersatu_rw02')) {
    return '/images/uf_bersatu_rw02.jpg';
  }
  if (trimmed.includes('uf_asteba_rw01')) {
    return '/images/uf_asteba_rw01.jpg';
  }

  return trimmed;
}

export const URBAN_FARMING_DEFAULT_PHOTOS: string[] = [
  '/images/uf_kesadaran_rw07.jpg',
  '/images/uf_angkasa_rw05.jpg',
  '/images/uf_teratai_rw05.jpg',
  '/images/uf_sipakainga_rw04.jpg',
  '/images/uf_campagaya_rw03.jpg',
  '/images/uf_bersatu_rw02.jpg',
  '/images/uf_asteba_rw01.jpg',
];

/**
 * Resolves the photo URL for an Urban Farming spot so that:
 * 1) Custom uploaded photos (data: URLs, external URLs, or explicit /images/uf_* paths) are preserved.
 * 2) Empty photoUrl ("") or legacy Instagram fallback URLs (/images/ig_post_*) are mapped to
 *    each of the 7 distinct Urban Farming KWT photos based on spot ID, name/group, RW, or index.
 */
export function resolveUrbanFarmingPhoto(
  spotOrUrl?:
    | {
        id?: string;
        name?: string;
        groupName?: string;
        rw?: string;
        locationAddress?: string;
        photoUrl?: string | null;
      }
    | string
    | null,
  fallbackIndex = 0
): string {
  const rawPhoto =
    typeof spotOrUrl === 'string'
      ? spotOrUrl.trim()
      : (spotOrUrl?.photoUrl || '').trim();

  // If the spot has a genuine custom photo (not empty and not an Instagram post image), use it
  const isIgFallback =
    !rawPhoto ||
    rawPhoto.includes('ig_post_') ||
    Boolean(extractInstagramShortcode(rawPhoto, null));

  if (!isIgFallback) {
    return resolveImageUrl(rawPhoto);
  }

  if (typeof spotOrUrl === 'object' && spotOrUrl !== null) {
    const id = (spotOrUrl.id || '').toLowerCase();
    const text = `${spotOrUrl.name || ''} ${spotOrUrl.groupName || ''} ${spotOrUrl.locationAddress || ''}`.toUpperCase();
    const rw = (spotOrUrl.rw || '').toUpperCase();

    if (id === 'uf-1793540638611' || text.includes('KESADARAN')) {
      return '/images/uf_kesadaran_rw07.jpg';
    }
    if (id === 'uf-1793540562848' || text.includes('RT04 RW 05') || text.includes('ANGKASA I')) {
      return '/images/uf_angkasa_rw05.jpg';
    }
    if (id === 'uf-1793540452922' || text.includes('TERATAI') || text.includes('KALLA RAYA')) {
      return '/images/uf_teratai_rw05.jpg';
    }
    if (id === 'uf-1793540321274' || text.includes('SIPAKAINGA') || text.includes('ANGKASA IV')) {
      return '/images/uf_sipakainga_rw04.jpg';
    }
    if (id === 'uf-1793540217986' || text.includes('CAMPAGAYA')) {
      return '/images/uf_campagaya_rw03.jpg';
    }
    if (id === 'uf-1793540084454' || (text.includes('BERSATU') && !text.includes('KESADARAN'))) {
      return '/images/uf_bersatu_rw02.jpg';
    }
    if (id === 'uf-1793539872515' || text.includes('ASTEBA') || text.includes('TUNAS HIJAU') || text.includes('ASPOL')) {
      return '/images/uf_asteba_rw01.jpg';
    }

    if (rw.includes('07')) return '/images/uf_kesadaran_rw07.jpg';
    if (rw.includes('06')) return '/images/uf_angkasa_rw05.jpg';
    if (rw.includes('05')) return '/images/uf_teratai_rw05.jpg';
    if (rw.includes('04')) return '/images/uf_sipakainga_rw04.jpg';
    if (rw.includes('03')) return '/images/uf_campagaya_rw03.jpg';
    if (rw.includes('02')) return '/images/uf_bersatu_rw02.jpg';
    if (rw.includes('01')) return '/images/uf_asteba_rw01.jpg';
  }

  const safeIdx = Math.abs(fallbackIndex) % URBAN_FARMING_DEFAULT_PHOTOS.length;
  return URBAN_FARMING_DEFAULT_PHOTOS[safeIdx];
}

