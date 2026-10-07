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
} from './src/data/initialData.ts';
import {
  KelurahanProfile,
  CitizenReport,
  WasteBankUnit,
  WasteLogEntry,
  CleanupEvent,
  KelurahanInfoItem,
  RwGroup,
} from './src/types.ts';

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
  lastModified: string;
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
      const parsed = JSON.parse(raw) as DatabaseSchema;
      if (parsed && parsed.profile && Array.isArray(parsed.reports)) {
        let changed = false;
        if (!Array.isArray(parsed.rwGroups) || parsed.rwGroups.length === 0) {
          parsed.rwGroups = INITIAL_RW_GROUPS;
          changed = true;
        }
        // Ensure initial reports include follow-up verification & completion photo examples
        parsed.reports = parsed.reports.map((rep) => {
          const initRep = INITIAL_REPORTS.find((r) => r.id === rep.id);
          if (initRep) {
            return {
              ...initRep,
              ...rep,
              verifiedBy: rep.verifiedBy ?? initRep.verifiedBy,
              verifiedAt: rep.verifiedAt ?? initRep.verifiedAt,
              completedAt: rep.completedAt ?? initRep.completedAt,
              completionPhotoUrl: rep.completionPhotoUrl ?? initRep.completionPhotoUrl,
              followUpPhotos:
                Array.isArray(rep.followUpPhotos) && rep.followUpPhotos.length > 0
                  ? rep.followUpPhotos
                  : initRep.followUpPhotos,
            };
          }
          return rep;
        });

        if (!Array.isArray(parsed.cleanupEvents) || parsed.cleanupEvents.length === 0) {
          parsed.cleanupEvents = INITIAL_CLEANUP_EVENTS;
          changed = true;
        } else {
          // Ensure scheduled cleanup events do not use photos, and seed completed initial events if missing
          const existingIds = new Set(parsed.cleanupEvents.map((e) => e.id));
          for (const initEv of INITIAL_CLEANUP_EVENTS) {
            if (!existingIds.has(initEv.id)) {
              parsed.cleanupEvents.push(initEv);
              changed = true;
            }
          }
          parsed.cleanupEvents = parsed.cleanupEvents.map((ev) => {
            if (ev.status !== 'Tuntas') {
              if (ev.imageUrl !== '' || (ev.documentationPhotos && ev.documentationPhotos.length > 0)) {
                changed = true;
              }
              return {
                ...ev,
                imageUrl: '',
                documentationPhotos: [],
              };
            }
            const initEv = INITIAL_CLEANUP_EVENTS.find((i) => i.id === ev.id);
            const fallbackImg = initEv?.imageUrl || '/images/ig_post_6_Dd-xlSLvXKn.jpg';
            const docs =
              Array.isArray(ev.documentationPhotos) && ev.documentationPhotos.length > 0
                ? ev.documentationPhotos
                : initEv?.documentationPhotos && initEv.documentationPhotos.length > 0
                ? initEv.documentationPhotos
                : [ev.imageUrl || fallbackImg];
            return {
              ...ev,
              imageUrl: ev.imageUrl || docs[0],
              documentationPhotos: docs,
            };
          });
        }
        if (!Array.isArray(parsed.wasteUnits) || parsed.wasteUnits.length === 0) {
          parsed.wasteUnits = INITIAL_WASTE_UNITS;
          changed = true;
        }
        if (!Array.isArray(parsed.kelurahanInfos) || parsed.kelurahanInfos.length === 0) {
          parsed.kelurahanInfos = INITIAL_KELURAHAN_INFOS;
          changed = true;
        } else {
          // Remove legacy synthetic info-1..info-6 items so only real @kelurahan.panaikang posts & custom admin posts remain
          const legacyIds = new Set(['info-1', 'info-2', 'info-3', 'info-4', 'info-5', 'info-6']);
          const filtered = parsed.kelurahanInfos.filter((item) => !legacyIds.has(item.id));
          if (filtered.length !== parsed.kelurahanInfos.length) {
            parsed.kelurahanInfos = filtered;
            changed = true;
          }

          // Ensure all 12 real @kelurahan.panaikang posts are synced with their exact real images & captions
          const customPosts = parsed.kelurahanInfos.filter(
            (item) => !INITIAL_KELURAHAN_INFOS.some((init) => init.id === item.id)
          );
          const syncedOfficialPosts = INITIAL_KELURAHAN_INFOS.map((initItem) => {
            const existing = parsed.kelurahanInfos.find((i) => i.id === initItem.id);
            if (existing) {
              return {
                ...initItem,
                ...existing,
                imageUrl: initItem.imageUrl,
                instagramHandle: '@kelurahan.panaikang',
                instagramPostUrl: initItem.instagramPostUrl,
                isInstagramSynced: true,
              };
            }
            changed = true;
            return initItem;
          });
          parsed.kelurahanInfos = [...customPosts, ...syncedOfficialPosts];
        }
        if (changed) {
          saveDatabase(parsed);
        }
        return parsed;
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
    lastModified: new Date().toISOString(),
  };
  saveDatabase(initialDb);
  return initialDb;
}

function saveDatabase(db: DatabaseSchema): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    db.lastModified = new Date().toISOString();
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

  app.use(express.json({ limit: '10mb' }));

  let db = loadDatabase();

  // ================= API ROUTES =================

  // 0. Administrator Authentication (Login & Logout)
  app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body as { username?: string; password?: string };
    const cleanUser = (username || '').trim().toLowerCase();
    const cleanPass = (password || '').trim();

    if (!cleanUser || !cleanPass) {
      res.status(400).json({
        ok: false,
        error: 'Username/NIP dan kata sandi wajib diisi.',
      });
      return;
    }

    const validPasswords = ['panaikang2026', 'admin123', 'makassar2026'];

    if (
      (cleanUser === 'admin' ||
        cleanUser === 'lurah' ||
        cleanUser === 'lurah.panaikang' ||
        cleanUser === '198804122010101002') &&
      validPasswords.includes(cleanPass)
    ) {
      res.json({
        ok: true,
        session: {
          token: `pnk-adm-${Date.now()}`,
          username: 'admin',
          fullName: db.profile.lurahName,
          nip: db.profile.lurahNip,
          role: 'Administrator Utama · Lurah Panaikang',
          loginAt: new Date().toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
          }) + ' WITA',
        },
      });
      return;
    }

    if (
      (cleanUser === 'operator' ||
        cleanUser === 'sekretaris' ||
        cleanUser === 'staf.panaikang') &&
      validPasswords.includes(cleanPass)
    ) {
      res.json({
        ok: true,
        session: {
          token: `pnk-opr-${Date.now()}`,
          username: 'operator',
          fullName: db.profile.sekretarisName,
          nip: '19850819 200901 2 004',
          role: 'Operator Satu Data · Sekretaris Kelurahan',
          loginAt: new Date().toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
          }) + ' WITA',
        },
      });
      return;
    }

    res.status(401).json({
      ok: false,
      error: 'Username/NIP atau kata sandi yang dimasukkan tidak sesuai. Silakan coba kembali.',
    });
  });

  app.post('/api/auth/logout', (_req, res) => {
    res.json({ ok: true });
  });

  // 1. Get Full Application Data
  app.get('/api/data', (_req, res) => {
    res.json({
      ok: true,
      data: db,
    });
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
    const incoming = req.body as RwGroup[];
    if (!Array.isArray(incoming)) {
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
