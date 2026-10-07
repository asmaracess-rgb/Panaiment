import fs from 'fs';
import path from 'path';

const SHORTCODE_MAP = {
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

export default async function handler(req, res) {
  try {
    const rawCode = String(req.query?.code || 'DeJpFcVJ6jq').trim();
    const isProfile = rawCode === 'profile' || rawCode.includes('ig_profile');
    const shortcode = isProfile
      ? 'DeJpFcVJ6jq'
      : SHORTCODE_MAP[rawCode] || rawCode.replace(/[^A-Za-z0-9_-]/g, '') || 'DeJpFcVJ6jq';

    const localFilename = isProfile ? FILE_BY_CODE.profile : FILE_BY_CODE[shortcode];
    if (localFilename) {
      const candidatePaths = [
        path.join(process.cwd(), 'public', 'images', localFilename),
        path.join(process.cwd(), 'dist', 'images', localFilename),
      ];
      for (const p of candidatePaths) {
        if (fs.existsSync(p) && fs.statSync(p).size > 1500) {
          const buf = fs.readFileSync(p);
          res.setHeader('Content-Type', 'image/jpeg');
          res.setHeader(
            'Cache-Control',
            'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800'
          );
          res.status(200).send(buf);
          return;
        }
      }
    }

    const embedUrl = `https://www.instagram.com/p/${shortcode}/embed/`;
    const embedResponse = await fetch(embedUrl, {
      headers: {
        'User-Agent': 'curl/8.5.0',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });

    if (!embedResponse.ok) {
      res.status(502).json({ ok: false, error: 'Gagal memuat embed Instagram.' });
      return;
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
        html.match(/<img[^>]+src="(https:\/\/[^"]*cdninstagram\.com\/v\/t51\.82787-15\/[^"]+)"/i);
      if (mediaMatch && mediaMatch[1]) {
        targetImageUrl = mediaMatch[1].replace(/&amp;/g, '&');
      }
    }

    if (!targetImageUrl) {
      res.status(404).json({ ok: false, error: 'Media tidak ditemukan.' });
      return;
    }

    const imageResponse = await fetch(targetImageUrl, {
      headers: {
        'User-Agent': 'curl/8.5.0',
        Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
      },
    });

    if (!imageResponse.ok) {
      res.status(502).json({ ok: false, error: 'Gagal mengunduh gambar CDN.' });
      return;
    }

    const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
    const arrayBuffer = await imageResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).send(buffer);
  } catch (err) {
    res.status(500).json({ ok: false, error: 'Gagal memproses media Instagram.' });
  }
}
