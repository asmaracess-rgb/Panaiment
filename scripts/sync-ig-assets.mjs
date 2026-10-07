import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const PUBLIC_IMAGES_DIR = path.join(ROOT_DIR, 'public', 'images');
const SRC_ASSETS_DIR = path.join(ROOT_DIR, 'src', 'assets', 'images');

const IG_ASSETS = [
  { filename: 'ig_profile_panaikang.jpg', shortcode: 'DeJpFcVJ6jq', isProfile: true },
  { filename: 'ig_post_1_DdrMaapvrr4.jpg', shortcode: 'DdrMaapvrr4', isProfile: false },
  { filename: 'ig_post_2_DbnJW3OvANh.jpg', shortcode: 'DbnJW3OvANh', isProfile: false },
  { filename: 'ig_post_3_DcN5ah3vZdT.jpg', shortcode: 'DcN5ah3vZdT', isProfile: false },
  { filename: 'ig_post_4_DeJpFcVJ6jq.jpg', shortcode: 'DeJpFcVJ6jq', isProfile: false },
  { filename: 'ig_post_5_DeGDDkFPvJs.jpg', shortcode: 'DeGDDkFPvJs', isProfile: false },
  { filename: 'ig_post_6_Dd-xlSLvXKn.jpg', shortcode: 'Dd-xlSLvXKn', isProfile: false },
  { filename: 'ig_post_7_Dd33fJSy13M.jpg', shortcode: 'Dd33fJSy13M', isProfile: false },
  { filename: 'ig_post_8_Ddtg69NPsBB.jpg', shortcode: 'Ddtg69NPsBB', isProfile: false },
  { filename: 'ig_post_9_Ddn9BnBvEId.jpg', shortcode: 'Ddn9BnBvEId', isProfile: false },
  { filename: 'ig_post_10_DdfhgGQPaJX.jpg', shortcode: 'DdfhgGQPaJX', isProfile: false },
  { filename: 'ig_post_11_DdfU_r-PUM3.jpg', shortcode: 'DdfU_r-PUM3', isProfile: false },
  { filename: 'ig_post_12_Dda51qXP4nb.jpg', shortcode: 'Dda51qXP4nb', isProfile: false },
];

function hasValidFile(filePath) {
  try {
    return fs.existsSync(filePath) && fs.statSync(filePath).size > 1500;
  } catch {
    return false;
  }
}

async function fetchInstagramMediaBuffer(shortcode, isProfile) {
  const embedUrl = `https://www.instagram.com/p/${shortcode}/embed/`;
  const res = await fetch(embedUrl, {
    headers: {
      'User-Agent': 'curl/8.5.0',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
  });
  if (!res.ok) {
    throw new Error(`Instagram embed HTTP ${res.status} for ${shortcode}`);
  }
  const html = await res.text();

  let targetImageUrl = null;
  if (isProfile) {
    const profileMatch =
      html.match(/<img[^>]+src="(https:\/\/[^"]*cdninstagram\.com\/v\/t51\.82787-19\/[^"]+)"/i) ||
      html.match(/class="EmbedFrame[^"]*"[\s\S]*?<img[^>]+src="([^"]+)"/i);
    if (profileMatch && profileMatch[1]) {
      targetImageUrl = profileMatch[1].replace(/&amp;/g, '&');
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
    throw new Error(`No media URL found in embed HTML for ${shortcode}`);
  }

  const imgRes = await fetch(targetImageUrl, {
    headers: {
      'User-Agent': 'curl/8.5.0',
      Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
    },
  });
  if (!imgRes.ok) {
    throw new Error(`Image CDN HTTP ${imgRes.status} for ${shortcode}`);
  }

  const arrayBuffer = await imgRes.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function syncAllInstagramAssets() {
  fs.mkdirSync(PUBLIC_IMAGES_DIR, { recursive: true });
  fs.mkdirSync(SRC_ASSETS_DIR, { recursive: true });

  await Promise.allSettled(
    IG_ASSETS.map(async (item) => {
      const publicPath = path.join(PUBLIC_IMAGES_DIR, item.filename);
      const srcAssetPath = path.join(SRC_ASSETS_DIR, item.filename);

      if (hasValidFile(publicPath) && !hasValidFile(srcAssetPath)) {
        fs.copyFileSync(publicPath, srcAssetPath);
        return;
      }
      if (hasValidFile(srcAssetPath) && !hasValidFile(publicPath)) {
        fs.copyFileSync(srcAssetPath, publicPath);
        return;
      }
      if (hasValidFile(publicPath) && hasValidFile(srcAssetPath)) {
        return;
      }

      try {
        const buffer = await fetchInstagramMediaBuffer(item.shortcode, item.isProfile);
        if (buffer && buffer.length > 1500) {
          fs.writeFileSync(publicPath, buffer);
          fs.writeFileSync(srcAssetPath, buffer);
          console.log(`[sync-ig-assets] Synced ${item.filename} (${buffer.length} bytes)`);
        }
      } catch (err) {
        console.warn(`[sync-ig-assets] Skipped ${item.filename}:`, err?.message || err);
      }
    })
  );
}

syncAllInstagramAssets();
