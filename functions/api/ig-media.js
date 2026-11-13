const SHORTCODE_MAP = {
  ig_post_kerjabakti_0: 'DfZsJAUvDQG',
  ig_post_kerjabakti_1: 'DfYirNrJjaT',
  ig_post_kerjabakti_2: 'DfHDLK2vqk0',
  ig_post_latest_1: 'DfT7acUJdwh',
  ig_post_latest_2: 'DfM0_MZvZON',
  ig_post_latest_3: 'DfM0LNqPFR5',
  ig_post_1: 'DdrMaapvrr4',
  ig_post_2: 'DbnJW3OvANh',
  ig_post_3: 'DcN5ah3vZdT',
  ig_post_4: 'DeJpFcVJ6jq',
  ig_post_5: 'DeGDDkFPvJs',
  ig_post_6: 'Dd-xlSLvXKn',
  ig_post_7: 'Dd33fJSy13M',
  ig_post_8: 'Ddtg69NPsBB',
  ig_post_9: 'Ddn9BnBvEId',
  ig_post_10: 'DdfhgGQPaJX',
  ig_post_11: 'DdfU_r-PUM3',
  ig_post_12: 'Dda51qXP4nb',
};

const FILE_BY_CODE = {
  profile: 'ig_profile_panaikang.jpg',
  Dfiuay9j8M0: 'ig_post_latest_0_Dfiuay9j8M0.jpg',
  DfgPz35v2Ed: 'ig_post_latest_0b_DfgPz35v2Ed.jpg',
  DfZsJAUvDQG: 'ig_post_kerjabakti_0_DfZsJAUvDQG.jpg',
  DfYirNrJjaT: 'ig_post_kerjabakti_1_DfYirNrJjaT.jpg',
  DfHDLK2vqk0: 'ig_post_kerjabakti_2_DfHDLK2vqk0.jpg',
  DfT7acUJdwh: 'ig_post_latest_1_DfT7acUJdwh.jpg',
  DfM0_MZvZON: 'ig_post_latest_2_DfM0_MZvZON.jpg',
  DfM0LNqPFR5: 'ig_post_latest_3_DfM0LNqPFR5.jpg',
  DdrMaapvrr4: 'ig_post_1_DdrMaapvrr4.jpg',
  DbnJW3OvANh: 'ig_post_2_DbnJW3OvANh.jpg',
  DcN5ah3vZdT: 'ig_post_3_DcN5ah3vZdT.jpg',
  DeJpFcVJ6jq: 'ig_post_4_DeJpFcVJ6jq.jpg',
  DeGDDkFPvJs: 'ig_post_5_DeGDDkFPvJs.jpg',
  'Dd-xlSLvXKn': 'ig_post_6_Dd-xlSLvXKn.jpg',
  Dd33fJSy13M: 'ig_post_7_Dd33fJSy13M.jpg',
  Ddtg69NPsBB: 'ig_post_8_Ddtg69NPsBB.jpg',
  Ddn9BnBvEId: 'ig_post_9_Ddn9BnBvEId.jpg',
  DdfhgGQPaJX: 'ig_post_10_DdfhgGQPaJX.jpg',
  'DdfU_r-PUM3': 'ig_post_11_DdfU_r-PUM3.jpg',
  Dda51qXP4nb: 'ig_post_12_Dda51qXP4nb.jpg',
};

export async function onRequest(context) {
  const { request } = context;
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Accept',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const reqUrl = new URL(request.url);
    const rawCode = String(reqUrl.searchParams.get('code') || 'DeJpFcVJ6jq').trim();
    const forceRemote = reqUrl.searchParams.get('remote') === '1';
    const isProfile = rawCode === 'profile' || rawCode.includes('ig_profile');
    const shortcode = isProfile
      ? 'DeJpFcVJ6jq'
      : SHORTCODE_MAP[rawCode] || rawCode.replace(/[^A-Za-z0-9_-]/g, '') || 'DeJpFcVJ6jq';

    const localFilename = isProfile ? FILE_BY_CODE.profile : FILE_BY_CODE[shortcode];
    if (localFilename && !forceRemote && context?.env?.ASSETS) {
      try {
        const assetUrl = new URL(`/images/${localFilename}`, request.url);
        const assetRes = await context.env.ASSETS.fetch(assetUrl.toString());
        if (assetRes && assetRes.ok) {
          const buf = await assetRes.arrayBuffer();
          return new Response(buf, {
            status: 200,
            headers: {
              ...corsHeaders,
              'Content-Type': assetRes.headers.get('content-type') || 'image/jpeg',
              'Cache-Control': 'public, max-age=86400, s-maxage=604800',
            },
          });
        }
      } catch {}
    }

    const embedUrl = `https://www.instagram.com/p/${shortcode}/embed/`;
    const embedResponse = await fetch(embedUrl, {
      headers: {
        'User-Agent': 'curl/8.5.0',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });
    if (!embedResponse.ok) {
      return new Response(JSON.stringify({ ok: false, error: 'Gagal memuat embed Instagram.' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const html = await embedResponse.text();
    let targetImageUrl = null;
    if (isProfile) {
      const avatarMatch =
        html.match(/<img[^>]+src="(https:\/\/[^"]*cdninstagram\.com\/v\/t51\.82787-19\/[^"]+)"/i) ||
        html.match(/class="EmbedFrame[^"]*"[\s\S]*?<img[^>]+src="([^"]+)"/i);
      if (avatarMatch && avatarMatch[1]) {
        targetImageUrl = avatarMatch[1].replace(/&amp;/g, '&');
      }
    }

    if (!targetImageUrl) {
      const mediaMatch =
        html.match(/class="EmbeddedMediaImage"[^>]*src="([^"]+)"/i) ||
        html.match(/src="([^"]+)"[^>]*class="EmbeddedMediaImage"/i) ||
        html.match(/<img[^>]+src="(https:\/\/[^"]*cdninstagram\.com\/v\/t51\.82787-15\/[^"]+)"/i) ||
        html.match(/<img[^>]+src="(https:\/\/[^"]*cdninstagram\.com[^"]+)"/i);
      if (mediaMatch && mediaMatch[1]) {
        targetImageUrl = mediaMatch[1].replace(/&amp;/g, '&');
      }
    }

    if (!targetImageUrl) {
      return new Response(JSON.stringify({ ok: false, error: 'Media tidak ditemukan.' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const imageResponse = await fetch(targetImageUrl, {
      headers: {
        'User-Agent': 'curl/8.5.0',
        Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
      },
    });
    if (!imageResponse.ok) {
      return new Response(JSON.stringify({ ok: false, error: 'Gagal mengunduh gambar CDN.' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
    const arrayBuffer = await imageResponse.arrayBuffer();
    return new Response(arrayBuffer, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, s-maxage=604800',
      },
    });
  } catch {
    return new Response(JSON.stringify({ ok: false, error: 'Gagal memproses media Instagram.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}
