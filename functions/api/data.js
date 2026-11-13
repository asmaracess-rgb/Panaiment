const PROJECT_ID = 'panaikang-smart-environment';
const DATABASE_ID = 'ai-studio-panaikangsmarten-4feb23ef-f14d-4f7d-ab34-e0951be3a4fd';
const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/${DATABASE_ID}/documents`;

const FULL_SNAPSHOT_URL = `${FIRESTORE_BASE}/panaikang_app_data/full_snapshot`;
const LIVE_WARGA_URL = `${FIRESTORE_BASE}/panaikang_app_data/live_warga_state`;
const PROFILE_URL = `${FIRESTORE_BASE}/kelurahan_profiles/main_profile`;

function fromFirestoreValue(val) {
  if (!val || typeof val !== 'object') return null;
  if ('stringValue' in val) return val.stringValue;
  if ('integerValue' in val) return Number(val.integerValue);
  if ('doubleValue' in val) return Number(val.doubleValue);
  if ('booleanValue' in val) return Boolean(val.booleanValue);
  if ('nullValue' in val) return null;
  if ('timestampValue' in val) return val.timestampValue;
  if ('arrayValue' in val) {
    const arr = val.arrayValue?.values;
    return Array.isArray(arr) ? arr.map(fromFirestoreValue) : [];
  }
  if ('mapValue' in val) {
    const fields = val.mapValue?.fields || {};
    const out = {};
    for (const k of Object.keys(fields)) {
      out[k] = fromFirestoreValue(fields[k]);
    }
    return out;
  }
  return null;
}

function decodeFirestoreDocument(docJson) {
  if (!docJson || !docJson.fields || typeof docJson.fields !== 'object') return null;
  const out = {};
  for (const key of Object.keys(docJson.fields)) {
    out[key] = fromFirestoreValue(docJson.fields[key]);
  }
  return out;
}

async function fetchFirestoreDoc(url) {
  try {
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) return null;
    const json = await res.json();
    return decodeFirestoreDocument(json);
  } catch {
    return null;
  }
}

async function fetchSeedSnapshot(context, requestUrl) {
  try {
    const seedUrl = new URL('/seed-snapshot.json', requestUrl);
    const res =
      context?.env?.ASSETS && typeof context.env.ASSETS.fetch === 'function'
        ? await context.env.ASSETS.fetch(seedUrl.toString())
        : await fetch(seedUrl.toString());
    if (!res || !res.ok) return null;
    const json = await res.json();
    return json && typeof json === 'object' ? json : null;
  } catch {
    return null;
  }
}

function mergeByKey(baseArr, overlayArr, deletedSet, keyFn) {
  const map = new Map();
  for (const item of Array.isArray(baseArr) ? baseArr : []) {
    if (!item) continue;
    const k = keyFn(item);
    if (!k || deletedSet.has(k) || (item.id && deletedSet.has(item.id)) || (item.ticketCode && deletedSet.has(item.ticketCode))) {
      continue;
    }
    map.set(k, item);
  }
  for (const item of Array.isArray(overlayArr) ? overlayArr : []) {
    if (!item) continue;
    const k = keyFn(item);
    if (!k || deletedSet.has(k) || (item.id && deletedSet.has(item.id)) || (item.ticketCode && deletedSet.has(item.ticketCode))) {
      continue;
    }
    const prev = map.get(k);
    map.set(k, prev ? { ...prev, ...item } : item);
  }
  return Array.from(map.values());
}

function mergeRwGroups(baseRws, overlayRws) {
  const rwKey = (rw) =>
    String(rw?.rwCode || rw?.id || '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '');
  const map = new Map();
  for (const rw of Array.isArray(baseRws) ? baseRws : []) {
    const k = rwKey(rw);
    if (k) map.set(k, rw);
  }
  for (const rw of Array.isArray(overlayRws) ? overlayRws : []) {
    const k = rwKey(rw);
    if (!k) continue;
    const ex = map.get(k);
    if (!ex) {
      map.set(k, rw);
    } else {
      const rtMap = new Map();
      for (const rt of Array.isArray(ex.rtList) ? ex.rtList : []) {
        if (rt && rt.id) rtMap.set(rt.id, rt);
      }
      for (const rt of Array.isArray(rw.rtList) ? rw.rtList : []) {
        if (rt && rt.id) rtMap.set(rt.id, rt);
      }
      map.set(k, {
        ...ex,
        ...rw,
        ketuaRwName: (rw.ketuaRwName && String(rw.ketuaRwName).trim()) || ex.ketuaRwName || '',
        rwName: (rw.rwName && String(rw.rwName).trim()) || ex.rwName || rw.rwCode || ex.rwCode,
        phone: (rw.phone && String(rw.phone).trim()) || ex.phone || '',
        areaDescription: (rw.areaDescription && String(rw.areaDescription).trim()) || ex.areaDescription || '',
        rtList: Array.from(rtMap.values()),
      });
    }
  }
  return Array.from(map.values());
}

function mergeSnapshots(seedData, fullSnapshot, liveWarga, mainProfile) {
  const layers = [seedData, fullSnapshot, liveWarga].filter((x) => x && typeof x === 'object');
  if (layers.length === 0 && !mainProfile) return null;

  const deletedSet = new Set();
  for (const layer of layers) {
    if (Array.isArray(layer.deletedItemIds)) {
      for (const id of layer.deletedItemIds) {
        if (id) deletedSet.add(id);
      }
    }
  }

  let merged = {};
  for (const layer of layers) {
    merged = { ...merged, ...layer };
  }

  merged.deletedItemIds = Array.from(deletedSet);

  merged.rwGroups = mergeRwGroups(seedData?.rwGroups, fullSnapshot?.rwGroups);
  merged.citizenUsers = mergeByKey(
    mergeByKey(seedData?.citizenUsers, fullSnapshot?.citizenUsers, deletedSet, (c) => String(c.uid || c.email || '')),
    liveWarga?.citizenUsers,
    deletedSet,
    (c) => String(c.uid || c.email || '')
  );
  merged.reports = mergeByKey(
    mergeByKey(seedData?.reports, fullSnapshot?.reports, deletedSet, (r) => String(r.id || r.ticketCode || '')),
    liveWarga?.reports,
    deletedSet,
    (r) => String(r.id || r.ticketCode || '')
  );
  merged.pengaduanRecords = mergeByKey(
    mergeByKey(seedData?.pengaduanRecords, fullSnapshot?.pengaduanRecords, deletedSet, (p) => String(p.ticketCode || p.id || '')),
    liveWarga?.pengaduanRecords,
    deletedSet,
    (p) => String(p.ticketCode || p.id || '')
  );
  merged.praRegistrasiRecords = mergeByKey(
    mergeByKey(seedData?.praRegistrasiRecords, fullSnapshot?.praRegistrasiRecords, deletedSet, (p) => String(p.ticketCode || p.id || '')),
    liveWarga?.praRegistrasiRecords,
    deletedSet,
    (p) => String(p.ticketCode || p.id || '')
  );
  merged.seedRequests = mergeByKey(
    mergeByKey(seedData?.seedRequests, fullSnapshot?.seedRequests, deletedSet, (s) => String(s.id || '')),
    liveWarga?.seedRequests,
    deletedSet,
    (s) => String(s.id || '')
  );
  merged.wasteUnits = mergeByKey(seedData?.wasteUnits, fullSnapshot?.wasteUnits, deletedSet, (u) => String(u.id || ''));
  merged.wasteLogs = mergeByKey(seedData?.wasteLogs, fullSnapshot?.wasteLogs, deletedSet, (l) => String(l.id || ''));
  merged.tebaSpots = mergeByKey(seedData?.tebaSpots, fullSnapshot?.tebaSpots, deletedSet, (s) => String(s.id || ''));
  merged.bioporiPoints = mergeByKey(seedData?.bioporiPoints, fullSnapshot?.bioporiPoints, deletedSet, (b) => String(b.id || ''));
  merged.cleanupEvents = mergeByKey(seedData?.cleanupEvents, fullSnapshot?.cleanupEvents, deletedSet, (e) => String(e.id || ''));
  const getIgKey = (i) => {
    const combined = `${i?.instagramPostUrl || ''} ${i?.imageUrl || ''}`;
    const m1 = combined.match(/instagram\.com\/(?:p|reel|tv)\/([A-Za-z0-9_-]+)/i);
    if (m1?.[1]) return `ig:${m1[1]}`;
    const m2 = combined.match(/[?&]code=([A-Za-z0-9_-]+)/i);
    if (m2?.[1]) return `ig:${m2[1]}`;
    return String(i?.id || '');
  };
  merged.kelurahanInfos = mergeByKey(seedData?.kelurahanInfos, fullSnapshot?.kelurahanInfos, deletedSet, getIgKey).sort(
    (a, b) => (b?.takenAtMs || 0) - (a?.takenAtMs || 0)
  );
  merged.whatsappRecipients = mergeByKey(seedData?.whatsappRecipients, fullSnapshot?.whatsappRecipients, deletedSet, (w) => String(w.id || ''));
  merged.adminUsers = mergeByKey(seedData?.adminUsers, fullSnapshot?.adminUsers, deletedSet, (u) => String(u.id || ''));
  merged.urbanFarmingSpots = mergeByKey(seedData?.urbanFarmingSpots, fullSnapshot?.urbanFarmingSpots, deletedSet, (s) => String(s.id || ''));
  merged.activityLogs = mergeByKey(seedData?.activityLogs, fullSnapshot?.activityLogs, deletedSet, (l) => String(l.id || '')).slice(0, 50);

  const rawSchedules =
    Array.isArray(fullSnapshot?.siskamlingSchedules) && fullSnapshot.siskamlingSchedules.length > 0
      ? fullSnapshot.siskamlingSchedules
      : seedData?.siskamlingSchedules || [];
  merged.siskamlingSchedules = rawSchedules.filter((s) => s && s.rw);

  const baseProfile = seedData?.profile || {};
  const snapProfile = fullSnapshot?.profile || {};
  const cloudProfile = mainProfile || {};
  const combinedProfile = { ...baseProfile, ...snapProfile, ...cloudProfile };
  if (!combinedProfile.lurahPhotoUrl || !String(combinedProfile.lurahPhotoUrl).trim()) {
    combinedProfile.lurahPhotoUrl = '/images/lurah_muthmainnah_panaikang_1791548085422.jpg';
  }
  combinedProfile.officials = mergeByKey(
    mergeByKey(baseProfile.officials, snapProfile.officials, deletedSet, (o) => String(o.id || '')),
    cloudProfile.officials,
    deletedSet,
    (o) => String(o.id || '')
  );
  merged.profile = combinedProfile;

  merged.updatedAt = Math.max(
    Number(seedData?.updatedAt || 0),
    Number(fullSnapshot?.updatedAt || 0),
    Number(liveWarga?.updatedAt || 0),
    Number(mainProfile?.updatedAt || 0),
    Date.now()
  );

  return merged;
}

export async function onRequest(context) {
  const { request } = context;
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,OPTIONS,PATCH,DELETE,POST,PUT',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept, If-None-Match',
    'Content-Type': 'application/json',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (request.method === 'GET') {
    const [seedRes, fullRes, liveRes, profRes] = await Promise.allSettled([
      fetchSeedSnapshot(context, request.url),
      fetchFirestoreDoc(FULL_SNAPSHOT_URL),
      fetchFirestoreDoc(LIVE_WARGA_URL),
      fetchFirestoreDoc(PROFILE_URL),
    ]);

    const seedData = seedRes.status === 'fulfilled' ? seedRes.value : null;
    const fullSnapshot = fullRes.status === 'fulfilled' ? fullRes.value : null;
    const liveWarga = liveRes.status === 'fulfilled' ? liveRes.value : null;
    const mainProfile = profRes.status === 'fulfilled' ? profRes.value : null;

    const merged = mergeSnapshots(seedData, fullSnapshot, liveWarga, mainProfile);

    return new Response(
      JSON.stringify({
        ok: true,
        data: merged,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Cache-Control': 'private, no-cache, max-age=0, must-revalidate',
        },
      }
    );
  }

  if (request.method === 'PUT' || request.method === 'POST') {
    const nowMs = Date.now();
    return new Response(
      JSON.stringify({
        ok: true,
        updatedAt: nowMs,
        lastModified: new Date(nowMs).toISOString(),
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Cache-Control': 'private, no-store, max-age=0',
        },
      }
    );
  }

  return new Response(
    JSON.stringify({ ok: false, error: 'Method Not Allowed' }),
    { status: 405, headers: corsHeaders }
  );
}
