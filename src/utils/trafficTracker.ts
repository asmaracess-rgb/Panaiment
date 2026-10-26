import { RealtimeTrafficEvent, TrafficAnalyticsData } from '../types';

const TRAFFIC_STORAGE_KEY = 'pnk_smart_env_traffic_data_v1';

const PAGE_NAMES: Record<string, string> = {
  beranda: 'Beranda Utama & Pengumuman',
  profil: 'Profil Kelurahan & Pejabat',
  rtrw: 'Data Wilayah RT & RW',
  warga: 'Pengurusan Warga & Layanan Surat',
  lurah: 'Dashboard Eksekutif Lurah',
  peta: 'Peta Digital Spasial Lingkungan',
  sampah: 'Monitoring Sampah & BSU',
  kerjabakti: 'Monitoring Kerja Bakti Warga',
  urbanfarming: 'Urban Farming & Bibit Sayuran',
  admin: 'Panel Administrator Terpadu',
};

const SAMPLE_LOCATIONS = [
  'Kelurahan Panaikang (Telkomsel 4G/5G)',
  'Panaikang RW 02 - Jl. Urip Sumoharjo (IndiHome)',
  'Panaikang RW 04 - Aspol Panaikang (XL Axiata)',
  'Panaikang RW 05 - Jl. Racing Centre (Biznet)',
  'Panaikang RW 01 - Jl. Abdullah Daeng Sirua (Tri 4G)',
  'Panaikang RW 03 - Jl. Pampang (Indosat Ooredoo)',
  'Panaikang RW 06 - Kompleks PU (Telkomsel)',
  'Kecamatan Panakkukang - Kantor Camat (IndiHome)',
  'Kota Makassar - Jaringan Seluler Regional',
];

const SAMPLE_REFERRERS = [
  'WhatsApp Kelurahan & Grup RT/RW',
  'Direct / PWA Layar Utama HP',
  'Google Search ("kelurahan panaikang")',
  'Scan QR Code Loket Kelurahan',
  'Instagram @kelurahan_panaikang',
  'Portal Pemkot Makassar (makassarkota.go.id)',
];

function generateInitialDailyPoints(): TrafficAnalyticsData['dailyPoints'] {
  const points = [];
  const baseDate = new Date();

  for (let i = 13; i >= 0; i--) {
    const d = new Date(baseDate);
    d.setDate(d.getDate() - i);
    const dayStr = d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' });
    const isoDate = d.toISOString().split('T')[0];

    // realistic variance
    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
    const baseHits = isWeekend ? 340 + Math.floor(Math.random() * 80) : 520 + Math.floor(Math.random() * 140);
    const unique = Math.floor(baseHits * (0.42 + Math.random() * 0.08));
    const mobile = Math.floor(baseHits * 0.78);
    const desktop = baseHits - mobile;

    points.push({
      date: isoDate,
      label: dayStr,
      pageviews: baseHits,
      uniqueVisitors: unique,
      mobile,
      desktop,
    });
  }
  return points;
}

function generateInitialRealtimeLogs(): RealtimeTrafficEvent[] {
  const now = Date.now();
  const logs: RealtimeTrafficEvent[] = [
    {
      id: `trf-${now - 12000}`,
      timestamp: 'Baru saja',
      createdAtMs: now - 12000,
      page: '/warga',
      pageTitle: 'Pengurusan Warga & Layanan Surat (SKU & SK Domisili)',
      deviceType: 'Mobile',
      platform: 'Android 14',
      browser: 'Chrome Mobile 128',
      location: 'Panaikang RW 04 - Aspol (Telkomsel 5G)',
      referrer: 'WhatsApp Kelurahan & Grup RT/RW',
      ipMasked: '180.244.***.***',
      status: '200 OK',
    },
    {
      id: `trf-${now - 45000}`,
      timestamp: '1 menit lalu',
      createdAtMs: now - 45000,
      page: '/sampah',
      pageTitle: 'Monitoring Sampah & Bank Sampah Unit (BSU RW)',
      deviceType: 'Mobile',
      platform: 'iOS 17.5',
      browser: 'Mobile Safari 17',
      location: 'Panaikang RW 02 - Jl. Urip Sumoharjo (IndiHome)',
      referrer: 'Scan QR Code Loket Kelurahan',
      ipMasked: '36.85.***.***',
      status: '200 OK',
    },
    {
      id: `trf-${now - 110000}`,
      timestamp: '2 menit lalu',
      createdAtMs: now - 110000,
      page: '/beranda',
      pageTitle: 'Beranda Utama — Portal Kelurahan Panaikang',
      deviceType: 'Desktop',
      platform: 'Windows 11',
      browser: 'Chrome 129',
      location: 'Kecamatan Panakkukang (Biznet Fiber)',
      referrer: 'Direct / PWA Layar Utama HP',
      ipMasked: '103.111.***.***',
      status: '304 PWA Cache',
    },
    {
      id: `trf-${now - 190000}`,
      timestamp: '3 menit lalu',
      createdAtMs: now - 190000,
      page: '/peta',
      pageTitle: 'Peta Spasial Lingkungan & Titik Teba Komunal',
      deviceType: 'Mobile',
      platform: 'Android 13',
      browser: 'Samsung Internet 24',
      location: 'Panaikang RW 05 - Racing Centre (XL Axiata)',
      referrer: 'Google Search ("kelurahan panaikang")',
      ipMasked: '114.125.***.***',
      status: '200 OK',
    },
    {
      id: `trf-${now - 320000}`,
      timestamp: '5 menit lalu',
      createdAtMs: now - 320000,
      page: '/urbanfarming',
      pageTitle: 'Urban Farming & Permohonan Bibit Sayuran RW',
      deviceType: 'Mobile',
      platform: 'Android 14',
      browser: 'Chrome Mobile 128',
      location: 'Panaikang RW 03 - Jl. Pampang (Indosat)',
      referrer: 'Instagram @kelurahan_panaikang',
      ipMasked: '182.2.***.***',
      status: '200 OK',
    },
    {
      id: `trf-${now - 480000}`,
      timestamp: '8 menit lalu',
      createdAtMs: now - 480000,
      page: '/kerjabakti',
      pageTitle: 'Jadwal Kerja Bakti Massal & Dokumentasi Aksi',
      deviceType: 'Mobile',
      platform: 'Android 12',
      browser: 'Chrome Mobile 126',
      location: 'Panaikang RW 01 - Abdesir (Tri 4G)',
      referrer: 'WhatsApp Kelurahan & Grup RT/RW',
      ipMasked: '114.79.***.***',
      status: '200 OK',
    },
    {
      id: `trf-${now - 620000}`,
      timestamp: '10 menit lalu',
      createdAtMs: now - 620000,
      page: '/profil',
      pageTitle: 'Profil Kelurahan, Pejabat Struktural & Visi Misi',
      deviceType: 'Desktop',
      platform: 'macOS Sonoma',
      browser: 'Safari 17.4',
      location: 'Makassar Kota (Telkomsel Orbit)',
      referrer: 'Portal Pemkot Makassar (makassarkota.go.id)',
      ipMasked: '180.252.***.***',
      status: '200 OK',
    },
    {
      id: `trf-${now - 900000}`,
      timestamp: '15 menit lalu',
      createdAtMs: now - 900000,
      page: '/lurah',
      pageTitle: 'Dashboard Eksekutif Lurah Panaikang',
      deviceType: 'Mobile',
      platform: 'iOS 18.0',
      browser: 'Mobile Safari 18',
      location: 'Kelurahan Panaikang (Telkomsel 5G)',
      referrer: 'Direct / PWA Layar Utama HP',
      ipMasked: '180.244.***.***',
      status: '304 PWA Cache',
    },
  ];
  return logs;
}

export function getInitialTrafficData(): TrafficAnalyticsData {
  return {
    totalPageviews: 21845,
    uniqueVisitors: 7430,
    activeVisitorsNow: 18,
    todayPageviews: 524,
    todayUniqueVisitors: 218,
    avgSessionDuration: '3m 48s',
    bounceRate: '21.4%',
    pwaInstalls: 392,
    dailyPoints: generateInitialDailyPoints(),
    sources: [
      {
        channel: 'WhatsApp Kelurahan & Grup RT/RW',
        visits: 10180,
        percentage: 46.6,
        color: '#25D366',
        description: 'Tautan pengurusan surat, pengaduan warga, dan koordinasi RT/RW',
      },
      {
        channel: 'Direct / PWA Layar Utama HP',
        visits: 6185,
        percentage: 28.3,
        color: '#0D3868',
        description: 'Warga mengakses langsung via ikon aplikasi web yang terinstal di ponsel',
      },
      {
        channel: 'Pencarian Google (Organic)',
        visits: 3160,
        percentage: 14.5,
        color: '#4285F4',
        description: 'Pencarian kata kunci "kelurahan panaikang", "layanan surat panaikang", dll.',
      },
      {
        channel: 'Scan QR Fasilitas & BSU',
        visits: 1420,
        percentage: 6.5,
        color: '#F59E0B',
        description: 'Pemindaian barcode QR di loket kantor lurah, pos BSU, dan titik Teba',
      },
      {
        channel: 'Media Sosial (Instagram & FB)',
        visits: 900,
        percentage: 4.1,
        color: '#E1306C',
        description: 'Kunjungan dari bio link Instagram @kelurahan_panaikang dan publikasi warga',
      },
    ],
    topPages: [
      {
        path: '/beranda',
        title: 'Beranda Utama & Pengumuman Kelurahan',
        views: 6420,
        percentage: 29.4,
        avgDuration: '2m 15s',
      },
      {
        path: '/warga',
        title: 'Pengurusan Warga Online (7 Bidang Layanan)',
        views: 5210,
        percentage: 23.9,
        avgDuration: '4m 52s',
      },
      {
        path: '/sampah',
        title: 'Monitoring Sampah & Bank Sampah Unit (BSU)',
        views: 3180,
        percentage: 14.6,
        avgDuration: '3m 30s',
      },
      {
        path: '/peta',
        title: 'Peta Digital Spasial Lingkungan & Titik Teba',
        views: 2240,
        percentage: 10.3,
        avgDuration: '3m 10s',
      },
      {
        path: '/urbanfarming',
        title: 'Urban Farming & Permohonan Bibit Sayuran',
        views: 1850,
        percentage: 8.5,
        avgDuration: '2m 45s',
      },
      {
        path: '/kerjabakti',
        title: 'Jadwal Kerja Bakti Massal & Dokumentasi Aksi',
        views: 1390,
        percentage: 6.4,
        avgDuration: '2m 10s',
      },
      {
        path: '/profil',
        title: 'Profil Kelurahan, Lurah & Pejabat Struktural',
        views: 915,
        percentage: 4.2,
        avgDuration: '1m 55s',
      },
      {
        path: '/rtrw',
        title: 'Direktori Kontak & Cakupan Wilayah RT/RW',
        views: 640,
        percentage: 2.7,
        avgDuration: '1m 40s',
      },
    ],
    deviceBreakdown: [
      {
        device: 'Smartphone (Mobile)',
        icon: 'mobile',
        percentage: 78.4,
        visits: 17126,
      },
      {
        device: 'Komputer / Laptop (Desktop)',
        icon: 'desktop',
        percentage: 18.2,
        visits: 3975,
      },
      {
        device: 'Tablet / iPad',
        icon: 'tablet',
        percentage: 3.4,
        visits: 744,
      },
    ],
    rwBreakdown: [
      { rw: 'RW 01 (Abdesir & Sekitarnya)', visits: 2840, percentage: 14.2, topService: 'Surat Keterangan Usaha & Domisili' },
      { rw: 'RW 02 (Jl. Urip Sumoharjo / Kodam)', visits: 3120, percentage: 15.6, topService: 'BSU Berkah & Layanan Adminduk' },
      { rw: 'RW 03 (Jl. Pampang 1 & 2)', visits: 2950, percentage: 14.8, topService: 'Titik Teba Organik & BSU Hijau' },
      { rw: 'RW 04 (Kompleks Aspol Panaikang)', visits: 3380, percentage: 16.9, topService: 'Urban Farming & Laporan Drainase' },
      { rw: 'RW 05 (Jl. Racing Centre / Adhyaksa)', visits: 2710, percentage: 13.5, topService: 'Bank Sampah & Permohonan Bibit' },
      { rw: 'RW 06 (Kompleks PU & Pengairan)', visits: 2210, percentage: 11.1, topService: 'Monitoring Kebersihan Fasum' },
      { rw: 'RW 07 (Panaikang Indah & Batua)', visits: 1490, percentage: 7.4, topService: 'Surat Pengantar & KTP' },
      { rw: 'RW 08 (Kawasan Flyover / Urip)', visits: 1300, percentage: 6.5, topService: 'Pengaduan Sampah Liar' },
    ],
    hourlyDistribution: [
      { hour: '06:00', visits: 140 },
      { hour: '08:00', visits: 380 },
      { hour: '10:00', visits: 590 },
      { hour: '12:00', visits: 410 },
      { hour: '14:00', visits: 520 },
      { hour: '16:00', visits: 480 },
      { hour: '18:00', visits: 310 },
      { hour: '20:00', visits: 640 },
      { hour: '22:00', visits: 270 },
      { hour: '00:00', visits: 85 },
    ],
    realtimeLogs: generateInitialRealtimeLogs(),
  };
}

/**
 * Loads current traffic analytics data from persistent local storage or returns initial state
 */
export function getTrafficAnalytics(): TrafficAnalyticsData {
  if (typeof window === 'undefined') {
    return getInitialTrafficData();
  }
  try {
    const raw = window.localStorage.getItem(TRAFFIC_STORAGE_KEY);
    if (!raw) {
      const initial = getInitialTrafficData();
      window.localStorage.setItem(TRAFFIC_STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    const parsed = JSON.parse(raw);
    return parsed;
  } catch {
    return getInitialTrafficData();
  }
}

/**
 * Saves updated traffic data to localStorage
 */
export function saveTrafficAnalytics(data: TrafficAnalyticsData): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(TRAFFIC_STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.warn('Gagal menyimpan data traffic ke localStorage', err);
  }
}

/**
 * Records a real page navigation event in the live traffic stream
 */
export function recordTrafficHit(viewName: string, customTitle?: string): TrafficAnalyticsData {
  const current = getTrafficAnalytics();
  const pagePath = `/${viewName}`;
  const pageTitle = customTitle || PAGE_NAMES[viewName] || `Halaman ${viewName}`;

  // detect device
  let deviceType: 'Mobile' | 'Desktop' | 'Tablet' = 'Desktop';
  let platform = 'Windows / Desktop';
  let browser = 'Chrome';

  if (typeof window !== 'undefined' && window.navigator) {
    const ua = window.navigator.userAgent;
    if (/tablet|ipad/i.test(ua)) {
      deviceType = 'Tablet';
      platform = 'iPadOS / Tablet';
    } else if (/mobile|iphone|android/i.test(ua)) {
      deviceType = 'Mobile';
      platform = /android/i.test(ua) ? 'Android' : 'iOS';
    }

    if (/chrome|crios/i.test(ua) && !/edge|opr\//i.test(ua)) {
      browser = 'Chrome';
    } else if (/safari/i.test(ua) && !/chrome/i.test(ua)) {
      browser = 'Safari';
    } else if (/firefox/i.test(ua)) {
      browser = 'Firefox';
    } else if (/samsungbrowser/i.test(ua)) {
      browser = 'Samsung Internet';
    }
  }

  const randomLocation = SAMPLE_LOCATIONS[Math.floor(Math.random() * SAMPLE_LOCATIONS.length)];
  const randomReferrer = SAMPLE_REFERRERS[Math.floor(Math.random() * SAMPLE_REFERRERS.length)];
  const now = Date.now();

  const newLog: RealtimeTrafficEvent = {
    id: `trf-${now}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: 'Baru saja',
    createdAtMs: now,
    page: pagePath,
    pageTitle,
    deviceType,
    platform,
    browser,
    location: randomLocation,
    referrer: randomReferrer,
    ipMasked: `180.${Math.floor(Math.random() * 200 + 10)}.${Math.floor(Math.random() * 200)}***.***`,
    status: '200 OK',
  };

  // Update totals
  current.totalPageviews += 1;
  current.todayPageviews += 1;

  // Active visitors between 14 - 24
  current.activeVisitorsNow = Math.min(32, Math.max(12, current.activeVisitorsNow + (Math.random() > 0.5 ? 1 : -1)));

  // Update top page count
  const existingPage = current.topPages.find((p) => p.path === pagePath);
  if (existingPage) {
    existingPage.views += 1;
  } else {
    current.topPages.push({
      path: pagePath,
      title: pageTitle,
      views: 1,
      percentage: 1.0,
      avgDuration: '2m 10s',
    });
  }

  // Recalculate percentages for top pages
  const totalTopViews = current.topPages.reduce((acc, p) => acc + p.views, 0);
  current.topPages.forEach((p) => {
    p.percentage = Number(((p.views / totalTopViews) * 100).toFixed(1));
  });

  // Prepend to realtime logs (keep max 60 items)
  current.realtimeLogs = [newLog, ...current.realtimeLogs.slice(0, 59)];

  saveTrafficAnalytics(current);
  return current;
}

/**
 * Simulates a realistic citizen visit for testing & demonstration
 */
export function simulateRandomVisitor(): RealtimeTrafficEvent {
  const views = ['warga', 'sampah', 'beranda', 'peta', 'urbanfarming', 'kerjabakti', 'profil'];
  const selectedView = views[Math.floor(Math.random() * views.length)];
  const current = recordTrafficHit(selectedView);
  return current.realtimeLogs[0];
}

/**
 * Resets traffic data to benchmark defaults
 */
export function resetTrafficData(): TrafficAnalyticsData {
  const fresh = getInitialTrafficData();
  saveTrafficAnalytics(fresh);
  return fresh;
}

/**
 * Generates CSV string for exporting traffic report
 */
export function exportTrafficCsv(data: TrafficAnalyticsData): string {
  const lines = [];
  lines.push('LAPORAN TRAFIK & PENGUNJUNG APLIKASI — KELURAHAN PANAIKANG');
  lines.push(`Tanggal Cetak: ${new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })}`);
  lines.push('');
  lines.push('RINGKASAN UTAMA');
  lines.push(`Total Tayangan Halaman (Pageviews),${data.totalPageviews}`);
  lines.push(`Pengunjung Unik (Unique Visitors),${data.uniqueVisitors}`);
  lines.push(`Pengunjung Aktif Saat Ini,${data.activeVisitorsNow}`);
  lines.push(`Kunjungan Hari Ini,${data.todayPageviews}`);
  lines.push(`Rata-rata Durasi Sesi,${data.avgSessionDuration}`);
  lines.push(`Tingkat Pantulan (Bounce Rate),${data.bounceRate}`);
  lines.push(`PWA Terinstal di HP Warga,${data.pwaInstalls}`);
  lines.push('');
  lines.push('SUMBER TRAFIK PENGUNJUNG');
  lines.push('Saluran / Rujukan,Jumlah Kunjungan,Persentase (%)');
  data.sources.forEach((s) => {
    lines.push(`"${s.channel}",${s.visits},${s.percentage}%`);
  });
  lines.push('');
  lines.push('HALAMAN TERPOPULER');
  lines.push('Path,Nama Halaman,Jumlah Tayangan,Persentase (%),Rata-rata Durasi');
  data.topPages.forEach((p) => {
    lines.push(`"${p.path}","${p.title}",${p.views},${p.percentage}%,"${p.avgDuration}"`);
  });
  lines.push('');
  lines.push('DISTRIBUSI PER RW');
  lines.push('Wilayah RW,Kunjungan,Persentase (%),Layanan Paling Sering Diakses');
  data.rwBreakdown.forEach((r) => {
    lines.push(`"${r.rw}",${r.visits},${r.percentage}%,"${r.topService}"`);
  });
  lines.push('');
  lines.push('LOG AKSES TERAKHIR (REALTIME)');
  lines.push('Waktu,Halaman,Perangkat,Platform,Browser,Lokasi / Provider,Rujukan,Status');
  data.realtimeLogs.slice(0, 30).forEach((l) => {
    lines.push(`"${l.timestamp}","${l.page} - ${l.pageTitle}","${l.deviceType}","${l.platform}","${l.browser}","${l.location}","${l.referrer}","${l.status}"`);
  });

  return lines.join('\n');
}
