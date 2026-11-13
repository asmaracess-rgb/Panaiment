const MONTHS_ID = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

const LOCAL_IG_FILE_MAP = {
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

function formatIndonesianDateWita(tsSeconds) {
  const ms = tsSeconds ? Number(tsSeconds) * 1000 : Date.now();
  const witaDate = new Date(ms + 8 * 60 * 60 * 1000);
  const day = String(witaDate.getUTCDate()).padStart(2, '0');
  const month = MONTHS_ID[witaDate.getUTCMonth()] || 'November';
  const year = witaDate.getUTCFullYear();
  return `${day} ${month} ${year}`;
}

function formatWitaTime(date = new Date()) {
  const witaDate = new Date(date.getTime() + 8 * 60 * 60 * 1000);
  const hh = String(witaDate.getUTCHours()).padStart(2, '0');
  const mm = String(witaDate.getUTCMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

function isKerjaBaktiCaption(rawCaption) {
  const lower = (rawCaption || '').toLowerCase();
  return (
    lower.includes('kerja bakti') ||
    lower.includes('jumat asri') ||
    lower.includes('jumat bersih') ||
    lower.includes('kebersihan') ||
    lower.includes('pengelolaan sampah') ||
    lower.includes('gotong royong') ||
    lower.includes('clean up') ||
    lower.includes('drainase') ||
    lower.includes('sabtu bersih')
  );
}

export async function onRequest(context) {
  const { request } = context;
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Accept',
    'Cache-Control': 'no-store, max-age=0',
    'Content-Type': 'application/json',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const embedRes = await fetch('https://www.instagram.com/kelurahan.panaikang/embed/', {
      headers: {
        'User-Agent': 'curl/8.5.0',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });
    if (!embedRes.ok) {
      return new Response(
        JSON.stringify({ ok: false, error: `Instagram embed HTTP ${embedRes.status}` }),
        { status: 502, headers: corsHeaders }
      );
    }

    const html = await embedRes.text();
    const match = html.match(/"contextJSON"\s*:\s*("(?:\\.|[^"\\])*")/);
    if (!match || !match[1]) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Gagal memparsing feed Instagram.' }),
        { status: 502, headers: corsHeaders }
      );
    }

    const parsed = JSON.parse(JSON.parse(match[1]));
    const allMedia = Array.isArray(parsed?.context?.graphql_media) ? parsed.context.graphql_media : [];
    const mediaList = allMedia.slice(0, 6);

    const fetchedItems = [];
    const kbMatches = [];

    for (let i = 0; i < allMedia.length; i++) {
      const sm = allMedia[i]?.shortcode_media;
      if (!sm || !sm.shortcode) continue;
      const code = String(sm.shortcode);
      const rawCaption =
        sm.edge_media_to_caption?.edges?.[0]?.node?.text?.trim() ||
        'Publikasi terbaru Instagram Resmi Pemerintah Kelurahan Panaikang (@kelurahan.panaikang).';
      const firstLine = rawCaption.split('\n')[0].trim();
      const takenAtMs = sm.taken_at_timestamp ? Number(sm.taken_at_timestamp) * 1000 : Date.now() - i * 1000;
      const dateFormatted = formatIndonesianDateWita(sm.taken_at_timestamp);
      const isVideo = Boolean(sm.is_video);
      const imageUrl = LOCAL_IG_FILE_MAP[code] ? `/images/${LOCAL_IG_FILE_MAP[code]}` : `/api/ig-media?code=${code}`;
      const postUrl = `https://www.instagram.com/${isVideo ? 'reel' : 'p'}/${code}/`;

      if (i < mediaList.length) {
        fetchedItems.push({
          id: `ig-latest-${i + 1}-${code}`,
          title:
            firstLine.length > 10 && firstLine.length <= 105
              ? firstLine
              : rawCaption.length > 85
              ? `${rawCaption.slice(0, 82)}...`
              : rawCaption,
          category: isKerjaBaktiCaption(rawCaption) ? 'Kegiatan Lingkungan' : 'Pengumuman Kelurahan',
          summary: rawCaption.length > 140 ? `${rawCaption.slice(0, 140)}...` : rawCaption,
          content: rawCaption,
          imageUrl,
          publishedAt: dateFormatted,
          takenAtMs,
          author: 'Lurah Panaikang · @kelurahan.panaikang',
          instagramHandle: '@kelurahan.panaikang',
          instagramPostUrl: postUrl,
          instagramLikes: sm.edge_liked_by?.count ?? sm.edge_media_preview_like?.count ?? 25,
          instagramCommentsCount: sm.edge_media_to_comment?.count ?? 2,
          isInstagramSynced: true,
          hashtags: ['#KelurahanPanaikang', '#PanaikangSmartEnvironment', '#KecamatanPanakkukang', '#KotaMakassar'],
        });
      }

      if (isKerjaBaktiCaption(rawCaption) && kbMatches.length < 3) {
        kbMatches.push({
          id: `kb-ig-story-${kbMatches.length + 1}-${code}`,
          shortcode: code,
          title:
            firstLine.length > 10 && firstLine.length <= 95
              ? firstLine
              : `${rawCaption.slice(0, 80)}...`,
          caption: rawCaption.length > 220 ? `${rawCaption.slice(0, 220)}...` : rawCaption,
          publishedAt: dateFormatted,
          rwScope: 'Kelurahan Panaikang',
          imageUrl,
          instagramPostUrl: postUrl,
          highlightName: 'Sorotan: Kerja Bakti & Kebersihan',
        });
      }
    }

    fetchedItems.sort((a, b) => (b.takenAtMs || 0) - (a.takenAtMs || 0));

    return new Response(
      JSON.stringify({
        ok: fetchedItems.length > 0,
        handle: '@kelurahan.panaikang',
        syncedAt: formatWitaTime(new Date()),
        data: fetchedItems,
        kerjaBaktiHighlights: kbMatches,
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: err instanceof Error ? err.message : 'Gagal sinkronisasi Instagram.',
      }),
      { status: 500, headers: corsHeaders }
    );
  }
}
