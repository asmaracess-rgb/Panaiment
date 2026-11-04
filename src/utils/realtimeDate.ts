/**
 * Utility untuk pemformatan tanggal dan waktu real-time berbahasa Indonesia (WITA / Asia/Makassar, UTC+8).
 * Menjamin waktu login administrator, log audit, dan transaksi selalu sinkron dengan waktu real Makassar
 * meskipun server berjalan di zona waktu container berbeda.
 */

const MONTH_NAMES_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
];

const MONTH_NAMES_FULL = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const DAY_NAMES = [
  'Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'
];

const WEEKDAY_MAP: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

function getWitaParts(d: Date = new Date()): {
  year: number;
  monthIndex: number;
  day: string;
  weekdayIndex: number;
  hours: string;
  minutes: string;
  seconds: string;
} {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Makassar',
      year: 'numeric',
      month: 'numeric',
      day: '2-digit',
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
    const parts = formatter.formatToParts(d);
    const map: Record<string, string> = {};
    for (const part of parts) {
      if (part.type !== 'literal') {
        map[part.type] = part.value;
      }
    }
    const year = Number(map.year) || d.getFullYear();
    const monthIndex = Math.max(0, Math.min(11, (Number(map.month) || d.getMonth() + 1) - 1));
    const day = (map.day || String(d.getDate())).padStart(2, '0');
    const rawHour = map.hour === '24' ? '00' : (map.hour || String(d.getHours()));
    const hours = rawHour.padStart(2, '0');
    const minutes = (map.minute || String(d.getMinutes())).padStart(2, '0');
    const seconds = (map.second || String(d.getSeconds())).padStart(2, '0');
    const weekdayIndex = WEEKDAY_MAP[map.weekday] ?? d.getDay();
    return { year, monthIndex, day, weekdayIndex, hours, minutes, seconds };
  } catch {
    // Fallback manual UTC+8 (WITA) calculation
    const utcMs = d.getTime() + d.getTimezoneOffset() * 60000;
    const witaDate = new Date(utcMs + 8 * 3600000);
    return {
      year: witaDate.getFullYear(),
      monthIndex: witaDate.getMonth(),
      day: String(witaDate.getDate()).padStart(2, '0'),
      weekdayIndex: witaDate.getDay(),
      hours: String(witaDate.getHours()).padStart(2, '0'),
      minutes: String(witaDate.getMinutes()).padStart(2, '0'),
      seconds: String(witaDate.getSeconds()).padStart(2, '0'),
    };
  }
}

/**
 * Mengembalikan string tanggal & jam real-time WITA saat ini, contoh: "04 Nov 2026 · 17:25 WITA"
 */
export function getRealtimeDateTimeString(d: Date = new Date()): string {
  const { day, monthIndex, year, hours, minutes } = getWitaParts(d);
  const month = MONTH_NAMES_SHORT[monthIndex];
  return `${day} ${month} ${year} · ${hours}:${minutes} WITA`;
}

/**
 * Mengembalikan string tanggal & jam lengkap dengan detik real-time WITA, contoh: "04 Nov 2026 · 17:25:08 WITA"
 */
export function getRealtimeDateTimeWithSecondsString(d: Date = new Date()): string {
  const { day, monthIndex, year, hours, minutes, seconds } = getWitaParts(d);
  const month = MONTH_NAMES_SHORT[monthIndex];
  return `${day} ${month} ${year} · ${hours}:${minutes}:${seconds} WITA`;
}

/**
 * Mengembalikan string tanggal saat ini (WITA), contoh: "04 Nov 2026"
 */
export function getRealtimeDateString(d: Date = new Date()): string {
  const { day, monthIndex, year } = getWitaParts(d);
  const month = MONTH_NAMES_SHORT[monthIndex];
  return `${day} ${month} ${year}`;
}

/**
 * Mengembalikan string jam saat ini (WITA), contoh: "17:25 WITA"
 */
export function getRealtimeTimeString(d: Date = new Date()): string {
  const { hours, minutes } = getWitaParts(d);
  return `${hours}:${minutes} WITA`;
}

/**
 * Mengembalikan string jam dengan detik saat ini (WITA), contoh: "17:25:08 WITA"
 */
export function getRealtimeTimeWithSecondsString(d: Date = new Date()): string {
  const { hours, minutes, seconds } = getWitaParts(d);
  return `${hours}:${minutes}:${seconds} WITA`;
}

/**
 * Mengembalikan string tanggal lengkap dengan hari (WITA), contoh: "Rabu, 04 November 2026"
 */
export function getRealtimeFullDateString(d: Date = new Date()): string {
  const { day, monthIndex, year, weekdayIndex } = getWitaParts(d);
  const dayName = DAY_NAMES[weekdayIndex];
  const month = MONTH_NAMES_FULL[monthIndex];
  return `${dayName}, ${day} ${month} ${year}`;
}

/**
 * Mengembalikan objek Date saat ini
 */
export function getRealtimeNow(): Date {
  return new Date();
}

/**
 * Mengembalikan string hari, tanggal lengkap & jam dengan detik WITA, contoh: "Rabu, 04 November 2026 · 17:25:08 WITA"
 */
export function getRealtimeFullDateTimeWita(d: Date = new Date()): string {
  const { day, monthIndex, year, weekdayIndex, hours, minutes, seconds } = getWitaParts(d);
  const dayName = DAY_NAMES[weekdayIndex];
  const month = MONTH_NAMES_FULL[monthIndex];
  return `${dayName}, ${day} ${month} ${year} · ${hours}:${minutes}:${seconds} WITA`;
}

/**
 * Mengecek apakah string waktu login/log adalah tanggal masa depan atau tidak sinkron dengan tanggal real-time WITA saat ini
 */
export function isStaleOrFutureLoginString(str?: string): boolean {
  if (!str) return false;
  const nowParts = getWitaParts(new Date());
  const currentMonthShort = MONTH_NAMES_SHORT[nowParts.monthIndex];
  // Jika string memuat bulan masa depan (mis. "Nov 2026" saat bulan berjalan berbeda) atau tahun berbeda
  for (let i = 0; i < MONTH_NAMES_SHORT.length; i++) {
    const m = MONTH_NAMES_SHORT[i];
    if (str.includes(` ${m} `)) {
      if (i > nowParts.monthIndex && str.includes(String(nowParts.year))) {
        return true;
      }
      if (i === nowParts.monthIndex && m === currentMonthShort) {
        const dayMatch = str.match(/^(\d{1,2})\s+/);
        if (dayMatch && Number(dayMatch[1]) > Number(nowParts.day)) {
          return true;
        }
      }
    }
  }
  return false;
}


