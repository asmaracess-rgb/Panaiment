/**
 * Utility untuk pemformatan tanggal dan waktu real-time berbahasa Indonesia (WITA / Makassar).
 * Menggantikan nilai hardcoded tanggal masa lalu dengan waktu saat data di-submit secara presisi.
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

/**
 * Mengembalikan string tanggal & jam saat ini, contoh: "01 Nov 2026 · 18:45 WITA"
 */
export function getRealtimeDateTimeString(d: Date = new Date()): string {
  const day = String(d.getDate()).padStart(2, '0');
  const month = MONTH_NAMES_SHORT[d.getMonth()];
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${day} ${month} ${year} · ${hours}:${minutes} WITA`;
}

/**
 * Mengembalikan string tanggal saat ini, contoh: "01 Nov 2026"
 */
export function getRealtimeDateString(d: Date = new Date()): string {
  const day = String(d.getDate()).padStart(2, '0');
  const month = MONTH_NAMES_SHORT[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

/**
 * Mengembalikan string jam saat ini, contoh: "18:45 WITA"
 */
export function getRealtimeTimeString(d: Date = new Date()): string {
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes} WITA`;
}

/**
 * Mengembalikan string tanggal lengkap dengan hari, contoh: "Minggu, 01 November 2026"
 */
export function getRealtimeFullDateString(d: Date = new Date()): string {
  const dayName = DAY_NAMES[d.getDay()];
  const day = String(d.getDate()).padStart(2, '0');
  const month = MONTH_NAMES_FULL[d.getMonth()];
  const year = d.getFullYear();
  return `${dayName}, ${day} ${month} ${year}`;
}
