import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import {
  INITIAL_KELURAHAN_PROFILE,
  INITIAL_REPORTS,
  INITIAL_WASTE_UNITS,
  INITIAL_WASTE_LOGS,
  INITIAL_CLEANUP_EVENTS,
  INITIAL_KELURAHAN_INFOS,
  INITIAL_RW_GROUPS,
  INITIAL_WHATSAPP_RECIPIENTS,
  INITIAL_ADMIN_USERS,
  INITIAL_ACTIVITY_LOGS,
} from './src/data/initialData.ts';
import {
  KelurahanProfile,
  CitizenReport,
  WasteBankUnit,
  WasteLogEntry,
  CleanupEvent,
  KelurahanInfoItem,
  RwGroup,
  WhatsAppRecipient,
  AdminUserAccount,
  AdminActivityLog,
} from './src/types.ts';
import {
  SERVICE_CATEGORY_GROUPS,
  ServiceCategoryGroup,
} from './src/data/wargaServiceCatalog.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface DatabaseSchema {
  profile: KelurahanProfile;
  rwGroups: RwGroup[];
  reports: CitizenReport[];
  wasteUnits: WasteBankUnit[];
  wasteLogs: WasteLogEntry[];
  cleanupEvents: CleanupEvent[];
  kelurahanInfos: KelurahanInfoItem[];
  whatsappRecipients: WhatsAppRecipient[];
  serviceCatalog: ServiceCategoryGroup[];
  adminUsers: AdminUserAccount[];
  activityLogs: AdminActivityLog[];
  lastModified: string;
  updatedAt?: number;
}

const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'panaikang_db.json');

function loadDatabase(): DatabaseSchema {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw) as Partial<DatabaseSchema>;
      if (parsed && parsed.profile) {
        return {
          profile: parsed.profile,
          rwGroups: Array.isArray(parsed.rwGroups) ? parsed.rwGroups : INITIAL_RW_GROUPS,
          reports: Array.isArray(parsed.reports) ? parsed.reports : INITIAL_REPORTS,
          wasteUnits: Array.isArray(parsed.wasteUnits) ? parsed.wasteUnits : INITIAL_WASTE_UNITS,
          wasteLogs: Array.isArray(parsed.wasteLogs) ? parsed.wasteLogs : INITIAL_WASTE_LOGS,
          cleanupEvents: Array.isArray(parsed.cleanupEvents)
            ? parsed.cleanupEvents
            : INITIAL_CLEANUP_EVENTS,
          kelurahanInfos: Array.isArray(parsed.kelurahanInfos)
            ? parsed.kelurahanInfos
            : INITIAL_KELURAHAN_INFOS,
          whatsappRecipients: Array.isArray(parsed.whatsappRecipients)
            ? parsed.whatsappRecipients
            : INITIAL_WHATSAPP_RECIPIENTS,
          serviceCatalog:
            Array.isArray(parsed.serviceCatalog) && parsed.serviceCatalog.length > 0
              ? parsed.serviceCatalog
              : SERVICE_CATEGORY_GROUPS,
          adminUsers:
            Array.isArray(parsed.adminUsers) && parsed.adminUsers.length > 0
              ? parsed.adminUsers
              : INITIAL_ADMIN_USERS,
          activityLogs:
            Array.isArray(parsed.activityLogs) && parsed.activityLogs.length > 0
              ? parsed.activityLogs
              : INITIAL_ACTIVITY_LOGS,
          lastModified: parsed.lastModified || new Date().toISOString(),
          updatedAt: typeof parsed.updatedAt === 'number' ? parsed.updatedAt : 0,
        };
      }
    }
  } catch (err) {
    console.error('Failed to read DB file, seeding initial data:', err);
  }

  const initialDb: DatabaseSchema = {
    profile: INITIAL_KELURAHAN_PROFILE,
    rwGroups: INITIAL_RW_GROUPS,
    reports: INITIAL_REPORTS,
    wasteUnits: INITIAL_WASTE_UNITS,
    wasteLogs: INITIAL_WASTE_LOGS,
    cleanupEvents: INITIAL_CLEANUP_EVENTS,
    kelurahanInfos: INITIAL_KELURAHAN_INFOS,
    whatsappRecipients: INITIAL_WHATSAPP_RECIPIENTS,
    serviceCatalog: SERVICE_CATEGORY_GROUPS,
    adminUsers: INITIAL_ADMIN_USERS,
    activityLogs: INITIAL_ACTIVITY_LOGS,
    lastModified: new Date().toISOString(),
    updatedAt: 0,
  };
  saveDatabase(initialDb, 0);
  return initialDb;
}

function saveDatabase(db: DatabaseSchema, customUpdatedAt?: number): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    db.lastModified = new Date().toISOString();
    db.updatedAt = typeof customUpdatedAt === 'number' ? customUpdatedAt : Date.now();
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write DB file:', err);
  }
}

// Validation Helpers
function validateProfile(body: Partial<KelurahanProfile>): string[] {
  const errors: string[] = [];
  if (!body.lurahName || body.lurahName.trim().length < 3) {
    errors.push('Nama Lurah wajib diisi (minimal 3 karakter).');
  }
  if (!body.lurahNip || body.lurahNip.trim().length < 8) {
    errors.push('NIP Lurah wajib diisi dengan format yang valid.');
  }
  if (!body.officeAddress || body.officeAddress.trim().length < 10) {
    errors.push('Alamat Kantor Kelurahan wajib diisi secara lengkap.');
  }
  if (!body.visi || body.visi.trim().length < 10) {
    errors.push('Pernyataan Visi Kelurahan wajib diisi (minimal 10 karakter).');
  }
  if (!Array.isArray(body.misi) || body.misi.filter((m) => m && m.trim().length > 0).length === 0) {
    errors.push('Minimal harus terdapat 1 butir Misi Kelurahan yang tidak kosong.');
  }
  if (body.emailContact && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.emailContact.trim())) {
    errors.push('Format alamat email resmi kelurahan tidak valid.');
  }
  return errors;
}

function validateReport(body: Partial<CitizenReport>): string[] {
  const errors: string[] = [];
  if (!body.title || body.title.trim().length < 5) {
    errors.push('Judul laporan wajib diisi (minimal 5 karakter).');
  }
  if (!body.description || body.description.trim().length < 10) {
    errors.push('Deskripsi permasalahan wajib diisi (minimal 10 karakter).');
  }
  if (!body.reporterName || body.reporterName.trim().length < 2) {
    errors.push('Nama pelapor wajib diisi.');
  }
  if (!body.locationName || body.locationName.trim().length < 4) {
    errors.push('Lokasi atau patokan jalan wajib diisi.');
  }
  if (!body.rw || !body.rt) {
    errors.push('Wilayah RW dan RT wajib dipilih.');
  }
  return errors;
}

function validateWasteUnit(body: Partial<WasteBankUnit>): string[] {
  const errors: string[] = [];
  if (!body.rw || !body.rw.trim()) {
    errors.push('Wilayah RW wajib diisi.');
  }
  if (!body.unitName || body.unitName.trim().length < 3) {
    errors.push('Nama Bank Sampah Unit (BSU) wajib diisi.');
  }
  if (!body.coordinator || body.coordinator.trim().length < 3) {
    errors.push('Nama koordinator BSU wajib diisi.');
  }
  if (
    typeof body.organikKg !== 'number' ||
    body.organikKg < 0 ||
    typeof body.anorganikKg !== 'number' ||
    body.anorganikKg < 0 ||
    typeof body.residuKg !== 'number' ||
    body.residuKg < 0
  ) {
    errors.push('Volume sampah (Organik, Anorganik, Residu) harus berupa angka >= 0.');
  }
  return errors;
}

function validateCleanupEvent(body: Partial<CleanupEvent>): string[] {
  const errors: string[] = [];
  if (!body.title || body.title.trim().length < 5) {
    errors.push('Nama kegiatan kerja bakti wajib diisi (minimal 5 karakter).');
  }
  if (!body.date || !body.date.trim()) {
    errors.push('Hari & tanggal pelaksanaan wajib diisi.');
  }
  if (!body.locationName || !body.locationName.trim().length || body.locationName.trim().length < 4) {
    errors.push('Lokasi titik kumpul kerja bakti wajib diisi.');
  }
  if (typeof body.targetParticipants === 'number' && body.targetParticipants < 1) {
    errors.push('Target peserta minimal 1 orang.');
  }
  return errors;
}

function validateKelurahanInfo(body: Partial<KelurahanInfoItem>): string[] {
  const errors: string[] = [];
  if (!body.title || body.title.trim().length < 5) {
    errors.push('Judul informasi kelurahan wajib diisi (minimal 5 karakter).');
  }
  if (!body.content || body.content.trim().length < 15) {
    errors.push('Isi teks informasi kelurahan wajib diisi (minimal 15 karakter).');
  }
  if (!body.imageUrl || !body.imageUrl.trim()) {
    errors.push('Gambar informasi wajib dipilih atau diunggah.');
  }
  return errors;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  let db = loadDatabase();

  // Keep in-memory db synchronized with disk before every API request
  app.use('/api', (_req, _res, next) => {
    db = loadDatabase();
    next();
  });

  // ================= API ROUTES =================

  // 0. Administrator Authentication (Login & Logout with Dynamic Parameter User & RBAC)
  app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body as { username?: string; password?: string };
    const cleanUser = (username || '').trim().toLowerCase();
    const cleanNip = cleanUser.replace(/\s+/g, '');
    const cleanPass = (password || '').trim();

    if (!cleanUser || !cleanPass) {
      res.status(400).json({
        ok: false,
        error: 'Username/NIP dan kata sandi wajib diisi.',
      });
      return;
    }

    const users =
      Array.isArray(db.adminUsers) && db.adminUsers.length > 0
        ? db.adminUsers
        : INITIAL_ADMIN_USERS;

    const matchedUser = users.find((u) => {
      const uName = (u.username || '').trim().toLowerCase();
      const uNip = (u.nip || '').replace(/\s+/g, '').toLowerCase();
      const isMasterAlias =
        Boolean(u.isMasterLurah || u.roleLevel === 'master_admin') &&
        ['admin', 'lurah', 'lurah.panaikang'].includes(cleanUser);
      return uName === cleanUser || (uNip && uNip === cleanNip) || isMasterAlias;
    });

    if (matchedUser) {
      const legacyFallbackPasswords = ['panaikang2026', 'admin123', 'makassar2026'];
      const passwordMatches =
        matchedUser.password === cleanPass ||
        (matchedUser.password === 'panaikang2026' && legacyFallbackPasswords.includes(cleanPass));

      if (!passwordMatches) {
        res.status(401).json({
          ok: false,
          error: 'Kata sandi yang dimasukkan tidak sesuai untuk akun tersebut.',
        });
        return;
      }

      if (!matchedUser.isActive) {
        res.status(403).json({
          ok: false,
          error:
            'Akun user ini sedang dinonaktifkan oleh Master Admin (Lurah). Silakan hubungi Lurah Panaikang.',
        });
        return;
      }

      const loginTimeStr =
        new Date().toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
        }) + ' WITA';

      matchedUser.lastLoginAt = `Hari ini · ${loginTimeStr}`;
      saveDatabase(db);

      res.json({
        ok: true,
        session: {
          token: `pnk-usr-${matchedUser.id}-${Date.now()}`,
          userId: matchedUser.id,
          username: matchedUser.username,
          fullName: matchedUser.fullName,
          nip: matchedUser.nip,
          role: `${matchedUser.jabatan} · ${matchedUser.unitBidang}`,
          roleLevel: matchedUser.roleLevel,
          isMasterLurah: Boolean(
            matchedUser.isMasterLurah || matchedUser.roleLevel === 'master_admin'
          ),
          allowedAdminTabs: matchedUser.allowedAdminTabs,
          allowedServiceCategories: matchedUser.allowedServiceCategories,
          actionPermissions: matchedUser.actionPermissions,
          loginAt: loginTimeStr,
        },
      });
      return;
    }

    res.status(401).json({
      ok: false,
      error: 'Username/NIP atau kata sandi yang dimasukkan tidak terdaftar. Silakan coba kembali.',
    });
  });

  app.post('/api/auth/logout', (_req, res) => {
    res.json({ ok: true });
  });

  app.post('/api/lurah-photo', (req, res) => {
    try {
      const { imageDataUrl } = req.body as { imageDataUrl?: string };
      if (!imageDataUrl || typeof imageDataUrl !== 'string' || !imageDataUrl.startsWith('data:image/')) {
        res.status(400).json({ ok: false, error: 'Format gambar tidak valid.' });
        return;
      }
      const base64Match = imageDataUrl.match(/^data:image\/[a-zA-Z0-9+.-]+;base64,(.+)$/);
      if (!base64Match || !base64Match[1]) {
        res.status(400).json({ ok: false, error: 'Data base64 gambar tidak ditemukan.' });
        return;
      }
      const buffer = Buffer.from(base64Match[1], 'base64');
      const publicImgPath = path.join(__dirname, 'public', 'images', 'lurah_muthmainnah_cutout.png');
      const srcAssetPath = path.join(__dirname, 'src', 'assets', 'images', 'lurah_muthmainnah_cutout.png');
      fs.mkdirSync(path.dirname(publicImgPath), { recursive: true });
      fs.mkdirSync(path.dirname(srcAssetPath), { recursive: true });
      fs.writeFileSync(publicImgPath, buffer);
      fs.writeFileSync(srcAssetPath, buffer);

      const versionedUrl = `/images/lurah_muthmainnah_cutout.png?v=${Date.now()}`;
      db.profile.lurahPhotoUrl = versionedUrl;
      saveDatabase(db);
      res.json({ ok: true, photoUrl: versionedUrl });
    } catch (err) {
      console.error('Failed to save Lurah photo:', err);
      res.status(500).json({ ok: false, error: 'Gagal menyimpan foto Lurah.' });
    }
  });

  // 0b. Instagram Media Proxy for @kelurahan.panaikang (Local & Vercel parity)
  const LOCAL_IG_FILE_MAP: Record<string, string> = {
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

  app.get('/api/ig-media', async (req, res) => {
    try {
      const rawCode = String(req.query.code || 'DdrMaapvrr4').trim();
      const localFilename = LOCAL_IG_FILE_MAP[rawCode];
      if (localFilename) {
        const localFilePath = path.join(__dirname, 'public', 'images', localFilename);
        if (fs.existsSync(localFilePath)) {
          res.setHeader('Content-Type', 'image/jpeg');
          res.setHeader('Cache-Control', 'public, max-age=86400');
          res.sendFile(localFilePath);
          return;
        }
      }

      const isProfile = rawCode === 'profile' || rawCode.includes('ig_profile');
      const shortcode = isProfile
        ? 'DdrMaapvrr4'
        : rawCode.replace(/[^A-Za-z0-9_-]/g, '') || 'DdrMaapvrr4';
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
      let targetImageUrl: string | null = null;
      if (isProfile) {
        const avatarMatch =
          html.match(/class="EmbedFrame[^"]*"[\s\S]*?<img[^>]+src="([^"]+)"/i) ||
          html.match(
            /<img[^>]+src="(https:\/\/[^"]*cdninstagram\.com[^"]+)"[^>]+alt="kelurahan\.panaikang"/i
          );
        if (avatarMatch && avatarMatch[1]) {
          targetImageUrl = avatarMatch[1].replace(/&amp;/g, '&');
        }
      }
      if (!targetImageUrl) {
        const mediaMatch =
          html.match(/class="EmbeddedMediaImage"[^>]*src="([^"]+)"/i) ||
          html.match(/src="([^"]+)"[^>]*class="EmbeddedMediaImage"/i);
        if (mediaMatch && mediaMatch[1]) {
          targetImageUrl = mediaMatch[1].replace(/&amp;/g, '&');
        }
      }
      if (!targetImageUrl) {
        res.redirect(302, embedUrl);
        return;
      }
      const imageResponse = await fetch(targetImageUrl, {
        headers: { 'User-Agent': 'curl/8.5.0' },
      });
      if (!imageResponse.ok) {
        res.redirect(302, embedUrl);
        return;
      }
      const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
      const arrayBuffer = await imageResponse.arrayBuffer();
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.status(200).send(Buffer.from(arrayBuffer));
    } catch {
      res.status(500).json({ ok: false, error: 'Gagal memproses media Instagram.' });
    }
  });

  // 1. Get & Sync Full Application Data
  app.get('/api/data', (_req, res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.json({
      ok: true,
      data: db,
    });
  });

  app.put('/api/data', (req, res) => {
    const incoming = req.body as Partial<DatabaseSchema>;
    if (!incoming || typeof incoming !== 'object') {
      res.status(400).json({ ok: false, errors: ['Data sinkronisasi tidak valid.'] });
      return;
    }
    if (incoming.profile) db.profile = incoming.profile;
    if (Array.isArray(incoming.rwGroups)) {
      db.rwGroups = incoming.rwGroups;
      db.profile.totalRw = incoming.rwGroups.length;
      db.profile.totalRt = incoming.rwGroups.reduce(
        (acc, rw) => acc + (rw.rtList?.length || 0),
        0
      );
    }
    if (Array.isArray(incoming.reports)) db.reports = incoming.reports;
    if (Array.isArray(incoming.wasteUnits)) db.wasteUnits = incoming.wasteUnits;
    if (Array.isArray(incoming.wasteLogs)) db.wasteLogs = incoming.wasteLogs;
    if (Array.isArray(incoming.cleanupEvents)) db.cleanupEvents = incoming.cleanupEvents;
    if (Array.isArray(incoming.kelurahanInfos)) db.kelurahanInfos = incoming.kelurahanInfos;
    if (Array.isArray(incoming.whatsappRecipients))
      db.whatsappRecipients = incoming.whatsappRecipients;
    if (Array.isArray(incoming.serviceCatalog) && incoming.serviceCatalog.length > 0)
      db.serviceCatalog = incoming.serviceCatalog;
    if (Array.isArray(incoming.adminUsers) && incoming.adminUsers.length > 0)
      db.adminUsers = incoming.adminUsers;
    if (Array.isArray(incoming.activityLogs))
      db.activityLogs = incoming.activityLogs;

    saveDatabase(db, incoming.updatedAt);
    res.json({ ok: true, data: db });
  });

  // 1AB. Log Aktivitas / Audit Trail Admin Endpoints
  app.get('/api/activity-logs', (_req, res) => {
    res.json({
      ok: true,
      data: db.activityLogs || INITIAL_ACTIVITY_LOGS,
    });
  });

  app.post('/api/activity-logs', (req, res) => {
    const incoming = req.body as Partial<AdminActivityLog>;
    if (!incoming.summary || !incoming.targetLabel) {
      res.status(400).json({ ok: false, errors: ['Ringkasan dan target log wajib diisi.'] });
      return;
    }
    const created: AdminActivityLog = {
      id: incoming.id || `LOG-2026-${String(Date.now()).slice(-6)}`,
      timestamp:
        incoming.timestamp ||
        new Date().toLocaleDateString('id-ID', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }) +
          ' · ' +
          new Date().toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
          }) +
          ' WITA',
      createdAtMs: incoming.createdAtMs || Date.now(),
      actorUsername: incoming.actorUsername || 'lurah',
      actorName: incoming.actorName || 'Muthmainnah, SE, MM',
      actorJabatan: incoming.actorJabatan || 'Lurah Panaikang',
      actorNip: incoming.actorNip || '-',
      actorRoleLevel: incoming.actorRoleLevel || 'master_admin',
      actionType: incoming.actionType || 'UPDATE',
      module: incoming.module || 'PENGURUSAN_WARGA',
      targetId: incoming.targetId,
      targetLabel: incoming.targetLabel,
      summary: incoming.summary,
      details: incoming.details,
      beforeValue: incoming.beforeValue,
      afterValue: incoming.afterValue,
      severity: incoming.severity || 'info',
    };
    db.activityLogs = [created, ...(db.activityLogs || [])].slice(0, 500);
    saveDatabase(db);
    res.status(201).json({ ok: true, data: created, allLogs: db.activityLogs });
  });

  app.put('/api/activity-logs', (req, res) => {
    const incoming = Array.isArray(req.body)
      ? (req.body as AdminActivityLog[])
      : Array.isArray(req.body?.activityLogs)
      ? (req.body.activityLogs as AdminActivityLog[])
      : null;
    if (!incoming) {
      res.status(400).json({ ok: false, errors: ['Format daftar log aktivitas tidak valid.'] });
      return;
    }
    db.activityLogs = incoming.slice(0, 500);
    saveDatabase(db);
    res.json({ ok: true, data: db.activityLogs });
  });

  // 1AA. Parameter User & Batasan Akses Admin CRUD (Managed by Master Admin / Lurah)
  app.get('/api/admin-users', (_req, res) => {
    res.json({
      ok: true,
      data: db.adminUsers || INITIAL_ADMIN_USERS,
    });
  });

  app.put('/api/admin-users', (req, res) => {
    const incoming = Array.isArray(req.body)
      ? (req.body as AdminUserAccount[])
      : Array.isArray(req.body?.adminUsers)
      ? (req.body.adminUsers as AdminUserAccount[])
      : null;
    if (!incoming || incoming.length === 0) {
      res.status(400).json({ ok: false, errors: ['Format daftar akun user admin tidak valid.'] });
      return;
    }
    db.adminUsers = incoming;
    saveDatabase(db);
    res.json({ ok: true, data: db.adminUsers });
  });

  app.post('/api/admin-users', (req, res) => {
    const incoming = req.body as Partial<AdminUserAccount>;
    if (!incoming.username || !incoming.fullName || !incoming.password) {
      res.status(400).json({
        ok: false,
        errors: ['Username, Nama Lengkap, dan Kata Sandi wajib diisi.'],
      });
      return;
    }
    const cleanUsername = incoming.username.trim().toLowerCase();
    if (db.adminUsers.some((u) => u.username.toLowerCase() === cleanUsername)) {
      res.status(400).json({
        ok: false,
        errors: [`Username "${cleanUsername}" sudah digunakan oleh akun lain.`],
      });
      return;
    }
    const created: AdminUserAccount = {
      id: incoming.id || `usr-${Date.now()}`,
      username: cleanUsername,
      password: incoming.password.trim(),
      fullName: incoming.fullName.trim(),
      nip: incoming.nip?.trim() || '-',
      jabatan: incoming.jabatan?.trim() || 'Staf / Operator Kelurahan',
      unitBidang: incoming.unitBidang?.trim() || 'Pelayanan Terpadu Kelurahan Panaikang',
      phone: incoming.phone?.trim() || '',
      roleLevel: incoming.roleLevel || 'operator',
      isMasterLurah: Boolean(incoming.isMasterLurah || incoming.roleLevel === 'master_admin'),
      isActive: incoming.isActive ?? true,
      allowedAdminTabs: Array.isArray(incoming.allowedAdminTabs)
        ? incoming.allowedAdminTabs
        : ['pengurusan_warga', 'laporan'],
      allowedServiceCategories: Array.isArray(incoming.allowedServiceCategories)
        ? incoming.allowedServiceCategories
        : ['adminduk', 'surat_keterangan'],
      actionPermissions: incoming.actionPermissions || {
        canCreate: true,
        canEdit: true,
        canDelete: false,
        canVerifyAndIssueLetter: false,
        canConfigureCatalog: false,
        canManageWhatsApp: false,
        canExportPrintPdf: true,
      },
      createdAt: incoming.createdAt || '08 Okt 2026',
      updatedAt: '08 Okt 2026',
      notes: incoming.notes?.trim() || '',
    };
    db.adminUsers = [...db.adminUsers, created];
    saveDatabase(db);
    res.status(201).json({ ok: true, data: created });
  });

  app.put('/api/admin-users/:id', (req, res) => {
    const { id } = req.params;
    const idx = db.adminUsers.findIndex((u) => u.id === id);
    if (idx === -1) {
      res.status(404).json({ ok: false, errors: ['Akun user admin tidak ditemukan.'] });
      return;
    }
    const existing = db.adminUsers[idx];
    const incoming = req.body as Partial<AdminUserAccount>;
    const nextUsername = incoming.username
      ? incoming.username.trim().toLowerCase()
      : existing.username;
    if (
      db.adminUsers.some(
        (u) => u.id !== id && u.username.toLowerCase() === nextUsername
      )
    ) {
      res.status(400).json({
        ok: false,
        errors: [`Username "${nextUsername}" sudah digunakan oleh akun lain.`],
      });
      return;
    }
    const merged: AdminUserAccount = {
      ...existing,
      ...incoming,
      id: existing.id,
      username: nextUsername,
      password:
        incoming.password && incoming.password.trim().length > 0
          ? incoming.password.trim()
          : existing.password,
      updatedAt: '08 Okt 2026 · Diperbarui',
    };
    db.adminUsers[idx] = merged;
    saveDatabase(db);
    res.json({ ok: true, data: merged });
  });

  app.delete('/api/admin-users/:id', (req, res) => {
    const { id } = req.params;
    const target = db.adminUsers.find((u) => u.id === id);
    if (!target) {
      res.status(404).json({ ok: false, errors: ['Akun user admin tidak ditemukan.'] });
      return;
    }
    if (target.isMasterLurah && db.adminUsers.filter((u) => u.isMasterLurah).length <= 1) {
      res.status(400).json({
        ok: false,
        errors: ['Akun Master Admin (Lurah) utama tidak dapat dihapus.'],
      });
      return;
    }
    db.adminUsers = db.adminUsers.filter((u) => u.id !== id);
    saveDatabase(db);
    res.json({ ok: true, deletedId: id });
  });

  // 1A. Back-End Katalog & Pengurusan Layanan Warga (7 Kategori & 44 Sub-Menu)
  app.get('/api/warga-services/catalog', (_req, res) => {
    res.json({
      ok: true,
      data: db.serviceCatalog || SERVICE_CATEGORY_GROUPS,
    });
  });

  app.put('/api/warga-services/catalog', (req, res) => {
    const incoming = Array.isArray(req.body)
      ? (req.body as ServiceCategoryGroup[])
      : Array.isArray(req.body?.serviceCatalog)
      ? (req.body.serviceCatalog as ServiceCategoryGroup[])
      : null;
    if (!incoming || incoming.length === 0) {
      res.status(400).json({ ok: false, errors: ['Format katalog layanan warga tidak valid.'] });
      return;
    }
    db.serviceCatalog = incoming;
    saveDatabase(db);
    res.json({ ok: true, data: db.serviceCatalog });
  });

  app.get('/api/warga-services/submissions', (_req, res) => {
    res.json({
      ok: true,
      data: db.reports,
    });
  });

  // 1B. WhatsApp Recipients CRUD (Managed by Lurah / Administrator)
  app.get('/api/whatsapp-recipients', (_req, res) => {
    res.json({ ok: true, data: db.whatsappRecipients });
  });

  app.put('/api/whatsapp-recipients', (req, res) => {
    const incoming = Array.isArray(req.body)
      ? (req.body as WhatsAppRecipient[])
      : Array.isArray(req.body?.whatsappRecipients)
      ? (req.body.whatsappRecipients as WhatsAppRecipient[])
      : null;
    if (!incoming) {
      res.status(400).json({ ok: false, errors: ['Format daftar nomor WhatsApp tidak valid.'] });
      return;
    }
    db.whatsappRecipients = incoming;
    saveDatabase(db);
    res.json({ ok: true, data: db.whatsappRecipients });
  });

  // 2. Update Kelurahan Profile (Edit, Validate & Save)
  app.put('/api/profile', (req, res) => {
    const incoming = req.body as KelurahanProfile;
    const errors = validateProfile(incoming);
    if (errors.length > 0) {
      res.status(400).json({ ok: false, errors });
      return;
    }

    db.profile = {
      ...db.profile,
      ...incoming,
      misi: incoming.misi.map((m) => m.trim()).filter(Boolean),
    };
    saveDatabase(db);
    res.json({ ok: true, data: db.profile });
  });

  // 2B. Data RT & RW CRUD
  app.put('/api/rw-groups', (req, res) => {
    const incoming = Array.isArray(req.body)
      ? (req.body as RwGroup[])
      : Array.isArray(req.body?.rwGroups)
      ? (req.body.rwGroups as RwGroup[])
      : null;
    if (!incoming) {
      res.status(400).json({ ok: false, errors: ['Format data RW/RT tidak valid.'] });
      return;
    }
    db.rwGroups = incoming;
    db.profile.totalRw = incoming.length;
    db.profile.totalRt = incoming.reduce((acc, rw) => acc + (rw.rtList?.length || 0), 0);
    saveDatabase(db);
    res.json({ ok: true, data: db.rwGroups, profile: db.profile });
  });

  app.post('/api/rw-groups', (req, res) => {
    const incoming = req.body as Partial<RwGroup>;
    if (!incoming.rwCode || !incoming.rwName || !incoming.ketuaRwName) {
      res.status(400).json({
        ok: false,
        errors: ['Kode RW, Nama RW, dan Nama Ketua RW wajib diisi.'],
      });
      return;
    }
    const newRw: RwGroup = {
      id: `rw-${Date.now()}`,
      rwCode: incoming.rwCode.trim(),
      rwName: incoming.rwName.trim(),
      ketuaRwName: incoming.ketuaRwName.trim(),
      phone: incoming.phone?.trim() || '',
      areaDescription: incoming.areaDescription?.trim() || 'Wilayah Kelurahan Panaikang',
      rtList: Array.isArray(incoming.rtList) ? incoming.rtList : [],
    };
    db.rwGroups = [...db.rwGroups, newRw];
    db.profile.totalRw = db.rwGroups.length;
    db.profile.totalRt = db.rwGroups.reduce((acc, rw) => acc + (rw.rtList?.length || 0), 0);
    saveDatabase(db);
    res.status(201).json({ ok: true, data: newRw, rwGroups: db.rwGroups });
  });

  app.put('/api/rw-groups/:id', (req, res) => {
    const { id } = req.params;
    const idx = db.rwGroups.findIndex((rw) => rw.id === id);
    if (idx === -1) {
      res.status(404).json({ ok: false, errors: ['Data RW tidak ditemukan.'] });
      return;
    }
    const merged: RwGroup = {
      ...db.rwGroups[idx],
      ...req.body,
      rtList: Array.isArray(req.body.rtList) ? req.body.rtList : db.rwGroups[idx].rtList,
    };
    if (!merged.rwCode || !merged.rwName || !merged.ketuaRwName) {
      res.status(400).json({
        ok: false,
        errors: ['Kode RW, Nama RW, dan Nama Ketua RW wajib diisi.'],
      });
      return;
    }
    db.rwGroups[idx] = merged;
    db.profile.totalRw = db.rwGroups.length;
    db.profile.totalRt = db.rwGroups.reduce((acc, rw) => acc + (rw.rtList?.length || 0), 0);
    saveDatabase(db);
    res.json({ ok: true, data: merged, rwGroups: db.rwGroups });
  });

  app.delete('/api/rw-groups/:id', (req, res) => {
    const { id } = req.params;
    db.rwGroups = db.rwGroups.filter((rw) => rw.id !== id);
    db.profile.totalRw = db.rwGroups.length;
    db.profile.totalRt = db.rwGroups.reduce((acc, rw) => acc + (rw.rtList?.length || 0), 0);
    saveDatabase(db);
    res.json({ ok: true, deletedId: id, rwGroups: db.rwGroups });
  });

  // 3. Citizen Reports CRUD
  app.post('/api/reports', (req, res) => {
    const incoming = req.body as Partial<CitizenReport>;
    const errors = validateReport(incoming);
    if (errors.length > 0) {
      res.status(400).json({ ok: false, errors });
      return;
    }

    const nextNum = 149 + db.reports.length;
    const newReport: CitizenReport = {
      id: `rep-${Date.now()}`,
      ticketCode: incoming.ticketCode || `PNK-2026-0${nextNum}`,
      title: incoming.title!.trim(),
      description: incoming.description!.trim(),
      category: incoming.category || 'Sampah Liar & TPS',
      urgency: incoming.urgency || 'Normal',
      status: incoming.status || 'Menunggu Verifikasi',
      reporterName: incoming.reporterName!.trim(),
      reporterPhone: incoming.reporterPhone?.trim() || '0812-xxxx-xxxx',
      rw: incoming.rw || 'RW 02',
      rt: incoming.rt || 'RT 01',
      locationName: incoming.locationName!.trim(),
      mapX: typeof incoming.mapX === 'number' ? incoming.mapX : 50,
      mapY: typeof incoming.mapY === 'number' ? incoming.mapY : 48,
      coordinatesLabel: incoming.coordinatesLabel || '-5.1379, 119.4470',
      createdAt: incoming.createdAt || '06 Okt 2026 · Baru Saja',
      updatedAt: '06 Okt 2026 · Baru Saja',
      assignedTeam: incoming.assignedTeam || `Koordinator Kebersihan ${incoming.rw || 'RW 02'}`,
      responseNote:
        incoming.responseNote ||
        'Laporan baru telah masuk dan tervalidasi dalam sistem Satu Data Panaikang.',
      upvotes: typeof incoming.upvotes === 'number' ? incoming.upvotes : 1,
      imageUrl: incoming.imageUrl || '/images/dokumentasi_drainase_bersih_1791349273322.jpg',
      verifiedBy: incoming.verifiedBy,
      verifiedAt: incoming.verifiedAt,
      completedAt: incoming.completedAt,
      completionPhotoUrl: incoming.completionPhotoUrl,
      followUpPhotos: Array.isArray(incoming.followUpPhotos) ? incoming.followUpPhotos : [],
      serviceCategoryId: incoming.serviceCategoryId,
      serviceCategoryTitle: incoming.serviceCategoryTitle,
      serviceSubItemId: incoming.serviceSubItemId,
      serviceSubItemLabel: incoming.serviceSubItemLabel,
      documentCode: incoming.documentCode,
      officialHeaderTitle: incoming.officialHeaderTitle,
      processingUnit: incoming.processingUnit,
      applicantNik: incoming.applicantNik,
      specificFieldsData: incoming.specificFieldsData,
      letterRegisterNumber: incoming.letterRegisterNumber,
      signedByOfficer: incoming.signedByOfficer,
    };

    db.reports = [newReport, ...db.reports];
    saveDatabase(db);
    res.status(201).json({ ok: true, data: newReport });
  });

  app.put('/api/reports/:id', (req, res) => {
    const { id } = req.params;
    const idx = db.reports.findIndex((r) => r.id === id);
    if (idx === -1) {
      res.status(404).json({ ok: false, errors: ['Data laporan tidak ditemukan.'] });
      return;
    }

    const updatedFields = { ...db.reports[idx], ...req.body };
    const errors = validateReport(updatedFields);
    if (errors.length > 0) {
      res.status(400).json({ ok: false, errors });
      return;
    }

    db.reports[idx] = {
      ...updatedFields,
      updatedAt: '06 Okt 2026 · Diperbarui',
    };
    saveDatabase(db);
    res.json({ ok: true, data: db.reports[idx] });
  });

  app.delete('/api/reports/:id', (req, res) => {
    const { id } = req.params;
    const exists = db.reports.some((r) => r.id === id);
    if (!exists) {
      res.status(404).json({ ok: false, errors: ['Data laporan tidak ditemukan.'] });
      return;
    }
    db.reports = db.reports.filter((r) => r.id !== id);
    saveDatabase(db);
    res.json({ ok: true, deletedId: id });
  });

  // 3B. Automatic Multi-Recipient WhatsApp Dispatch for Citizen Reports
  app.post('/api/reports/dispatch-whatsapp', (req, res) => {
    const activeRecipients = (db.whatsappRecipients || []).filter((r) => r.isActive);
    const ticketCode = req.body?.ticketCode || req.body?.report?.ticketCode || '';
    res.json({
      ok: true,
      ticketCode,
      totalDispatched: activeRecipients.length,
      dispatchedAt: new Date().toISOString(),
    });
  });

  // 4. Waste Bank Units (BSU) CRUD
  app.post('/api/waste-units', (req, res) => {
    const incoming = req.body as Partial<WasteBankUnit>;
    const errors = validateWasteUnit(incoming);
    if (errors.length > 0) {
      res.status(400).json({ ok: false, errors });
      return;
    }

    const newUnit: WasteBankUnit = {
      id: `bsu-${Date.now()}`,
      rw: incoming.rw!.trim(),
      unitName: incoming.unitName!.trim(),
      coordinator: incoming.coordinator!.trim(),
      locationLabel: incoming.locationLabel?.trim() || 'Kawasan Kelurahan Panaikang',
      mapX: typeof incoming.mapX === 'number' ? incoming.mapX : 55,
      mapY: typeof incoming.mapY === 'number' ? incoming.mapY : 55,
      organikKg: Number(incoming.organikKg) || 0,
      anorganikKg: Number(incoming.anorganikKg) || 0,
      residuKg: Number(incoming.residuKg) || 0,
      activeHouseholds: Number(incoming.activeHouseholds) || 50,
      pickupSchedule: incoming.pickupSchedule?.trim() || 'Senin, Rabu, Jumat · 06:30 WITA',
      lastUpdated: '06 Okt 2026',
    };

    db.wasteUnits = [...db.wasteUnits, newUnit];
    saveDatabase(db);
    res.status(201).json({ ok: true, data: newUnit });
  });

  app.put('/api/waste-units/:id', (req, res) => {
    const { id } = req.params;
    const idx = db.wasteUnits.findIndex((u) => u.id === id);
    if (idx === -1) {
      res.status(404).json({ ok: false, errors: ['Unit Bank Sampah tidak ditemukan.'] });
      return;
    }

    const merged = {
      ...db.wasteUnits[idx],
      ...req.body,
      organikKg: Number(req.body.organikKg ?? db.wasteUnits[idx].organikKg),
      anorganikKg: Number(req.body.anorganikKg ?? db.wasteUnits[idx].anorganikKg),
      residuKg: Number(req.body.residuKg ?? db.wasteUnits[idx].residuKg),
      activeHouseholds: Number(req.body.activeHouseholds ?? db.wasteUnits[idx].activeHouseholds),
    };

    const errors = validateWasteUnit(merged);
    if (errors.length > 0) {
      res.status(400).json({ ok: false, errors });
      return;
    }

    db.wasteUnits[idx] = {
      ...merged,
      lastUpdated: '06 Okt 2026',
    };
    saveDatabase(db);
    res.json({ ok: true, data: db.wasteUnits[idx] });
  });

  app.delete('/api/waste-units/:id', (req, res) => {
    const { id } = req.params;
    db.wasteUnits = db.wasteUnits.filter((u) => u.id !== id);
    saveDatabase(db);
    res.json({ ok: true, deletedId: id });
  });

  // 5. Waste Weighing Logs CRUD
  app.post('/api/waste-logs', (req, res) => {
    const { rw, organikKg, anorganikKg, residuKg, officerName, notes } = req.body;
    const org = Number(organikKg) || 0;
    const anorg = Number(anorganikKg) || 0;
    const resKg = Number(residuKg) || 0;

    if (org < 0 || anorg < 0 || resKg < 0 || org + anorg + resKg <= 0) {
      res.status(400).json({
        ok: false,
        errors: ['Total timbangan sampah harus lebih dari 0 kg dan tidak boleh bernilai negatif.'],
      });
      return;
    }

    const targetUnit = db.wasteUnits.find((u) => u.rw === rw);
    const newLog: WasteLogEntry = {
      id: `log-${Date.now()}`,
      date: '06 Okt 2026 · Baru Saja',
      rw: rw || 'RW 02',
      unitName: targetUnit ? targetUnit.unitName : `BSU ${rw}`,
      organikKg: org,
      anorganikKg: anorg,
      residuKg: resKg,
      officerName: officerName?.trim() || `Petugas BSU ${rw}`,
      notes: notes?.trim() || `Penimbangan harian terpilah ${rw}.`,
    };

    db.wasteLogs = [newLog, ...db.wasteLogs];
    db.wasteUnits = db.wasteUnits.map((u) =>
      u.rw === rw
        ? {
            ...u,
            organikKg: u.organikKg + org,
            anorganikKg: u.anorganikKg + anorg,
            residuKg: u.residuKg + resKg,
            lastUpdated: '06 Okt 2026',
          }
        : u
    );
    saveDatabase(db);
    res.status(201).json({ ok: true, data: { log: newLog, wasteUnits: db.wasteUnits } });
  });

  app.put('/api/waste-logs/:id', (req, res) => {
    const { id } = req.params;
    const idx = db.wasteLogs.findIndex((l) => l.id === id);
    if (idx === -1) {
      res.status(404).json({ ok: false, errors: ['Log penimbangan tidak ditemukan.'] });
      return;
    }
    const prevLog = db.wasteLogs[idx];
    const org = Number(req.body.organikKg ?? prevLog.organikKg) || 0;
    const anorg = Number(req.body.anorganikKg ?? prevLog.anorganikKg) || 0;
    const resKg = Number(req.body.residuKg ?? prevLog.residuKg) || 0;
    if (org < 0 || anorg < 0 || resKg < 0 || org + anorg + resKg <= 0) {
      res.status(400).json({
        ok: false,
        errors: ['Total timbangan sampah harus lebih dari 0 kg dan tidak boleh bernilai negatif.'],
      });
      return;
    }

    const updatedLog: WasteLogEntry = {
      ...prevLog,
      ...req.body,
      organikKg: org,
      anorganikKg: anorg,
      residuKg: resKg,
      officerName: (req.body.officerName ?? prevLog.officerName ?? '').trim(),
      notes: (req.body.notes ?? prevLog.notes ?? '').trim(),
    };
    db.wasteLogs[idx] = updatedLog;
    saveDatabase(db);
    res.json({ ok: true, data: updatedLog });
  });

  app.delete('/api/waste-logs/:id', (req, res) => {
    const { id } = req.params;
    db.wasteLogs = db.wasteLogs.filter((l) => l.id !== id);
    saveDatabase(db);
    res.json({ ok: true, deletedId: id });
  });

  // 6. Cleanup Events (Kerja Bakti) CRUD
  app.post('/api/cleanup-events', (req, res) => {
    const incoming = req.body as Partial<CleanupEvent>;
    const errors = validateCleanupEvent(incoming);
    if (errors.length > 0) {
      res.status(400).json({ ok: false, errors });
      return;
    }

    const isCompleted = incoming.status === 'Tuntas';
    const rawDocs =
      isCompleted && Array.isArray(incoming.documentationPhotos) && incoming.documentationPhotos.length > 0
        ? incoming.documentationPhotos
        : isCompleted && incoming.imageUrl
        ? [incoming.imageUrl]
        : [];

    const created: CleanupEvent = {
      id: `kb-${Date.now()}`,
      title: incoming.title!.trim(),
      date: incoming.date!.trim(),
      timeRange: incoming.timeRange?.trim() || '06:30 – 09:30 WITA',
      rw: incoming.rw || 'RW 01',
      rtScope: incoming.rtScope || 'Seluruh RT',
      locationName: incoming.locationName!.trim(),
      mapX: typeof incoming.mapX === 'number' ? incoming.mapX : 45,
      mapY: typeof incoming.mapY === 'number' ? incoming.mapY : 50,
      coordinator: incoming.coordinator?.trim() || `Koordinator ${incoming.rw || 'RW 01'}`,
      status: incoming.status || 'Terjadwal',
      targetParticipants: Number(incoming.targetParticipants) || 80,
      registeredParticipants: Number(incoming.registeredParticipants) || 10,
      collectedWasteKg: isCompleted ? Number(incoming.collectedWasteKg) || 0 : 0,
      focusAreas:
        Array.isArray(incoming.focusAreas) && incoming.focusAreas.length > 0
          ? incoming.focusAreas
          : ['Pembersihan saluran drainase dan jalan lingkungan'],
      equipmentNeeded:
        Array.isArray(incoming.equipmentNeeded) && incoming.equipmentNeeded.length > 0
          ? incoming.equipmentNeeded
          : ['Sapu lidi', 'Cangkul', 'Kantong pilah sampah'],
      imageUrl: isCompleted ? incoming.imageUrl || rawDocs[0] || '' : '',
      documentationPhotos: isCompleted ? rawDocs : [],
      summaryNote:
        incoming.summaryNote?.trim() || 'Kegiatan gotong royong rutin warga Kelurahan Panaikang.',
    };

    db.cleanupEvents = [created, ...db.cleanupEvents];
    saveDatabase(db);
    res.status(201).json({ ok: true, data: created });
  });

  app.put('/api/cleanup-events/:id', (req, res) => {
    const { id } = req.params;
    const idx = db.cleanupEvents.findIndex((e) => e.id === id);
    if (idx === -1) {
      res.status(404).json({ ok: false, errors: ['Jadwal kerja bakti tidak ditemukan.'] });
      return;
    }

    const nextStatus = req.body.status ?? db.cleanupEvents[idx].status;
    const isCompleted = nextStatus === 'Tuntas';
    const incomingDocs = Array.isArray(req.body.documentationPhotos)
      ? req.body.documentationPhotos
      : db.cleanupEvents[idx].documentationPhotos || [];

    const merged: CleanupEvent = {
      ...db.cleanupEvents[idx],
      ...req.body,
      status: nextStatus,
      targetParticipants: Number(
        req.body.targetParticipants ?? db.cleanupEvents[idx].targetParticipants
      ),
      registeredParticipants: Number(
        req.body.registeredParticipants ?? db.cleanupEvents[idx].registeredParticipants
      ),
      collectedWasteKg: isCompleted
        ? Number(req.body.collectedWasteKg ?? db.cleanupEvents[idx].collectedWasteKg)
        : 0,
      imageUrl: isCompleted
        ? req.body.imageUrl ?? db.cleanupEvents[idx].imageUrl ?? incomingDocs[0] ?? ''
        : '',
      documentationPhotos: isCompleted ? incomingDocs : [],
    };

    const errors = validateCleanupEvent(merged);
    if (errors.length > 0) {
      res.status(400).json({ ok: false, errors });
      return;
    }

    db.cleanupEvents[idx] = merged;
    saveDatabase(db);
    res.json({ ok: true, data: db.cleanupEvents[idx] });
  });

  app.delete('/api/cleanup-events/:id', (req, res) => {
    const { id } = req.params;
    db.cleanupEvents = db.cleanupEvents.filter((e) => e.id !== id);
    saveDatabase(db);
    res.json({ ok: true, deletedId: id });
  });

  // 7. Informasi Seputar Kelurahan Panaikang & Instagram @kelurahan.panaikang CRUD
  app.post('/api/infos', (req, res) => {
    const incoming = req.body as Partial<KelurahanInfoItem>;
    const errors = validateKelurahanInfo(incoming);
    if (errors.length > 0) {
      res.status(400).json({ ok: false, errors });
      return;
    }

    const cleanContent = incoming.content!.trim();
    const rawHashtags = Array.isArray(incoming.hashtags)
      ? incoming.hashtags
      : ['#KelurahanPanaikang', '#PanaikangSmartEnvironment', '#KotaMakassar'];

    const created: KelurahanInfoItem = {
      id: `info-${Date.now()}`,
      title: incoming.title!.trim(),
      category: incoming.category?.trim() || 'Pengumuman Kelurahan',
      summary:
        incoming.summary?.trim() ||
        (cleanContent.length > 130 ? `${cleanContent.slice(0, 130)}...` : cleanContent),
      content: cleanContent,
      imageUrl: incoming.imageUrl!.trim(),
      publishedAt: incoming.publishedAt?.trim() || '06 Okt 2026',
      author: incoming.author?.trim() || 'Lurah Panaikang',
      instagramHandle: incoming.instagramHandle?.trim() || '@kelurahan.panaikang',
      instagramPostUrl:
        incoming.instagramPostUrl?.trim() || 'https://www.instagram.com/kelurahan.panaikang/',
      instagramLikes: typeof incoming.instagramLikes === 'number' ? incoming.instagramLikes : 128,
      instagramCommentsCount:
        typeof incoming.instagramCommentsCount === 'number' ? incoming.instagramCommentsCount : 19,
      isInstagramSynced: incoming.isInstagramSynced ?? true,
      hashtags: rawHashtags,
    };

    db.kelurahanInfos = [created, ...db.kelurahanInfos];
    saveDatabase(db);
    res.status(201).json({ ok: true, data: created });
  });

  app.post('/api/infos/sync-instagram', (_req, res) => {
    const legacyIds = new Set(['info-1', 'info-2', 'info-3', 'info-4', 'info-5', 'info-6']);
    const customPosts = db.kelurahanInfos.filter(
      (i) => !legacyIds.has(i.id) && !INITIAL_KELURAHAN_INFOS.some((init) => init.id === i.id)
    );
    db.kelurahanInfos = [...customPosts, ...INITIAL_KELURAHAN_INFOS];
    saveDatabase(db);
    res.json({
      ok: true,
      handle: '@kelurahan.panaikang',
      syncedAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WITA',
      data: db.kelurahanInfos,
    });
  });

  app.put('/api/infos/:id', (req, res) => {
    const { id } = req.params;
    const idx = db.kelurahanInfos.findIndex((item) => item.id === id);
    if (idx === -1) {
      res.status(404).json({ ok: false, errors: ['Data informasi kelurahan tidak ditemukan.'] });
      return;
    }

    const merged: KelurahanInfoItem = {
      ...db.kelurahanInfos[idx],
      ...req.body,
    };
    if (!merged.summary || !merged.summary.trim()) {
      const cleanContent = (merged.content || '').trim();
      merged.summary =
        cleanContent.length > 130 ? `${cleanContent.slice(0, 130)}...` : cleanContent;
    }

    const errors = validateKelurahanInfo(merged);
    if (errors.length > 0) {
      res.status(400).json({ ok: false, errors });
      return;
    }

    db.kelurahanInfos[idx] = merged;
    saveDatabase(db);
    res.json({ ok: true, data: db.kelurahanInfos[idx] });
  });

  app.delete('/api/infos/:id', (req, res) => {
    const { id } = req.params;
    db.kelurahanInfos = db.kelurahanInfos.filter((item) => item.id !== id);
    saveDatabase(db);
    res.json({ ok: true, deletedId: id });
  });

  // Vite middleware for development or static serving for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Panaikang Smart Environment Full-Stack Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
