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
};

function formatIndonesianDateWita(tsSeconds) {
  const ms = tsSeconds ? Number(tsSeconds) * 1000 : Date.now();
  const witaDate = new Date(ms + 8 * 60 * 60 * 1000);
  const day = String(witaDate.getUTCDate()).padStart(2, '0');
  const month = MONTHS_ID[witaDate.getUTCMonth()] || 'November';
  const year = witaDate.getUTCFullYear();
  return `${day} ${month} ${year}`;
}

function formatWitaDateTime(date = new Date()) {
  const witaDate = new Date(date.getTime() + 8 * 60 * 60 * 1000);
  const day = String(witaDate.getUTCDate()).padStart(2, '0');
  const month = MONTHS_ID[witaDate.getUTCMonth()] || 'November';
  const year = witaDate.getUTCFullYear();
  const hh = String(witaDate.getUTCHours()).padStart(2, '0');
  const mm = String(witaDate.getUTCMinutes()).padStart(2, '0');
  return `${day} ${month} ${year} · ${hh}:${mm} WITA`;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
  res.setHeader('Cache-Control', 'no-store, max-age=0');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  try {
    const embedRes = await fetch('https://www.instagram.com/kelurahan.panaikang/embed/', {
      headers: {
        'User-Agent': 'curl/8.5.0',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });
    if (!embedRes.ok) {
      return res.status(502).json({ ok: false, error: `Instagram embed HTTP ${embedRes.status}` });
    }

    const html = await embedRes.text();
    const match = html.match(/"contextJSON"\s*:\s*("(?:\\.|[^"\\])*")/);
    if (!match || !match[1]) {
      return res.status(502).json({ ok: false, error: 'Gagal memparsing sorotan Instagram.' });
    }

    const parsed = JSON.parse(JSON.parse(match[1]));
    const mediaList = Array.isArray(parsed?.context?.graphql_media) ? parsed.context.graphql_media : [];
    const kbMatches = [];

    for (let i = 0; i < mediaList.length; i++) {
      const sm = mediaList[i]?.shortcode_media;
      if (!sm || !sm.shortcode) continue;
      const code = String(sm.shortcode);
      const rawCaption = sm.edge_media_to_caption?.edges?.[0]?.node?.text?.trim() || '';
      const lowerCap = rawCaption.toLowerCase();
      const isKerjaBakti =
        lowerCap.includes('kerja bakti') ||
        lowerCap.includes('jumat asri') ||
        lowerCap.includes('jumat bersih') ||
        lowerCap.includes('kebersihan') ||
        lowerCap.includes('pengelolaan sampah') ||
        lowerCap.includes('gotong royong') ||
        lowerCap.includes('clean up') ||
        lowerCap.includes('drainase');
      if (!isKerjaBakti) continue;

      const firstLine = rawCaption.split('\n')[0].trim();
      const isVideo = Boolean(sm.is_video);
      kbMatches.push({
        id: `kb-ig-story-${kbMatches.length + 1}-${code}`,
        shortcode: code,
        title:
          firstLine.length > 10 && firstLine.length <= 95
            ? firstLine
            : `${rawCaption.slice(0, 80)}...`,
        caption: rawCaption.length > 220 ? `${rawCaption.slice(0, 220)}...` : rawCaption,
        publishedAt: formatIndonesianDateWita(sm.taken_at_timestamp),
        rwScope: 'Kelurahan Panaikang',
        imageUrl: LOCAL_IG_FILE_MAP[code] ? `/images/${LOCAL_IG_FILE_MAP[code]}` : `/api/ig-media?code=${code}`,
        instagramPostUrl: `https://www.instagram.com/${isVideo ? 'reel' : 'p'}/${code}/`,
        highlightName: 'Sorotan: Kerja Bakti & Kebersihan',
      });
      if (kbMatches.length >= 3) break;
    }

    return res.status(200).json({
      ok: kbMatches.length > 0,
      handle: '@kelurahan.panaikang',
      syncedAt: formatWitaDateTime(new Date()),
      data: kbMatches.slice(0, 3),
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: err instanceof Error ? err.message : 'Gagal sinkronisasi sorotan Instagram.',
    });
  }
}
