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

// Real @kelurahan.panaikang Instagram Profile & 12 Post Images
const BUNDLED_IG_PROFILE = new URL(
  '../assets/images/ig_profile_panaikang.jpg',
  import.meta.url
).href;

const BUNDLED_IG_POST_1 = new URL(
  '../assets/images/ig_post_1_DdrMaapvrr4.jpg',
  import.meta.url
).href;

const BUNDLED_IG_POST_2 = new URL(
  '../assets/images/ig_post_2_DbnJW3OvANh.jpg',
  import.meta.url
).href;

const BUNDLED_IG_POST_3 = new URL(
  '../assets/images/ig_post_3_DcN5ah3vZdT.jpg',
  import.meta.url
).href;

const BUNDLED_IG_POST_4 = new URL(
  '../assets/images/ig_post_4_DeJpFcVJ6jq.jpg',
  import.meta.url
).href;

const BUNDLED_IG_POST_5 = new URL(
  '../assets/images/ig_post_5_DeGDDkFPvJs.jpg',
  import.meta.url
).href;

const BUNDLED_IG_POST_6 = new URL(
  '../assets/images/ig_post_6_Dd-xlSLvXKn.jpg',
  import.meta.url
).href;

const BUNDLED_IG_POST_7 = new URL(
  '../assets/images/ig_post_7_Dd33fJSy13M.jpg',
  import.meta.url
).href;

const BUNDLED_IG_POST_8 = new URL(
  '../assets/images/ig_post_8_Ddtg69NPsBB.jpg',
  import.meta.url
).href;

const BUNDLED_IG_POST_9 = new URL(
  '../assets/images/ig_post_9_Ddn9BnBvEId.jpg',
  import.meta.url
).href;

const BUNDLED_IG_POST_10 = new URL(
  '../assets/images/ig_post_10_DdfhgGQPaJX.jpg',
  import.meta.url
).href;

const BUNDLED_IG_POST_11 = new URL(
  '../assets/images/ig_post_11_DdfU_r-PUM3.jpg',
  import.meta.url
).href;

const BUNDLED_IG_POST_12 = new URL(
  '../assets/images/ig_post_12_Dda51qXP4nb.jpg',
  import.meta.url
).href;

/**
 * Resolves any stored or initial image path (including legacy `/src/assets/images/...`,
 * `/images/...`, Instagram shortcodes, or data URLs) to a production-ready bundled URL
 * that works on Vercel, static builds (`vite build`), and local development.
 */
export function resolveImageUrl(rawUrl?: string | null): string {
  if (!rawUrl) return BUNDLED_IG_POST_4;
  const trimmed = rawUrl.trim();
  if (!trimmed) return BUNDLED_IG_POST_4;

  // Map real @kelurahan.panaikang Instagram images
  if (trimmed.includes('ig_profile_panaikang')) return BUNDLED_IG_PROFILE;
  if (trimmed.includes('DdrMaapvrr4') || trimmed.includes('ig_post_1_')) return BUNDLED_IG_POST_1;
  if (trimmed.includes('DbnJW3OvANh') || trimmed.includes('ig_post_2_')) return BUNDLED_IG_POST_2;
  if (trimmed.includes('DcN5ah3vZdT') || trimmed.includes('ig_post_3_')) return BUNDLED_IG_POST_3;
  if (trimmed.includes('DeJpFcVJ6jq') || trimmed.includes('ig_post_4_')) return BUNDLED_IG_POST_4;
  if (trimmed.includes('DeGDDkFPvJs') || trimmed.includes('ig_post_5_')) return BUNDLED_IG_POST_5;
  if (trimmed.includes('Dd-xlSLvXKn') || trimmed.includes('ig_post_6_')) return BUNDLED_IG_POST_6;
  if (trimmed.includes('Dd33fJSy13M') || trimmed.includes('ig_post_7_')) return BUNDLED_IG_POST_7;
  if (trimmed.includes('Ddtg69NPsBB') || trimmed.includes('ig_post_8_')) return BUNDLED_IG_POST_8;
  if (trimmed.includes('Ddn9BnBvEId') || trimmed.includes('ig_post_9_')) return BUNDLED_IG_POST_9;
  if (trimmed.includes('DdfhgGQPaJX') || trimmed.includes('ig_post_10_')) return BUNDLED_IG_POST_10;
  if (trimmed.includes('DdfU_r-PUM3') || trimmed.includes('ig_post_11_')) return BUNDLED_IG_POST_11;
  if (trimmed.includes('Dda51qXP4nb') || trimmed.includes('ig_post_12_')) return BUNDLED_IG_POST_12;

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
