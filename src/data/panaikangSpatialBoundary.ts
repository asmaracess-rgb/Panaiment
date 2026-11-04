export interface LatLngPoint {
  lat: number;
  lng: number;
}

export interface RwSpatialZone {
  rw: string;
  name: string;
  color: string;
  center: LatLngPoint;
  paths: LatLngPoint[];
}

/**
 * Titik Tengah Geografis Resmi Kelurahan Panaikang, Kecamatan Panakkukang, Kota Makassar
 * (Sesuai batas administrasi Google Maps & OpenStreetMap Relation #12534215)
 */
export const PANAIKANG_CENTER: LatLngPoint = {
  lat: -5.137261,
  lng: 119.46088,
};

export const PANAIKANG_DEFAULT_ZOOM = 15;

/**
 * Titik Koordinat Presisi Kantor Lurah Panaikang
 * Jl. H. Kalla, Kompleks Panaikang Indah, Kelurahan Panaikang, Kec. Panakkukang, Kota Makassar
 */
export const KANTOR_LURAH_COORDINATE: LatLngPoint = {
  lat: -5.138977,
  lng: 119.458652,
};

/**
 * Polygon Batas Administrasi Resmi Kelurahan Panaikang (148 Titik Koordinat Presisi)
 * - Selatan/Barat Daya: Mengikuti koridor Jl. Urip Sumoharjo (berbatasan langsung dengan Kel. Karampuang & Kel. Tello Baru)
 * - Utara/Barat Laut: Mengikuti alur Kanal / Sungai Pampang (berbatasan langsung dengan Kel. Pampang)
 * - Timur/Tenggara: Mengikuti alur Sungai Tello hingga Jembatan Tello (berbatasan dengan Kel. Tello Baru & Kec. Tamalanrea)
 * - Barat: Berbatasan dengan Kel. Sinrijala & Kel. Pampang di titik temu Kanal Pampang – Jl. Urip Sumoharjo
 */
export const PANAIKANG_PERIMETER_POLYGON: LatLngPoint[] = [
  { lat: -5.138499, lng: 119.444898 },
  { lat: -5.13872, lng: 119.445747 },
  { lat: -5.139432, lng: 119.448072 },
  { lat: -5.140412, lng: 119.450878 },
  { lat: -5.141675, lng: 119.454854 },
  { lat: -5.142485, lng: 119.457472 },
  { lat: -5.142979, lng: 119.458878 },
  { lat: -5.143203, lng: 119.45957 },
  { lat: -5.143676, lng: 119.461033 },
  { lat: -5.143879, lng: 119.46168 },
  { lat: -5.144712, lng: 119.464326 },
  { lat: -5.145563, lng: 119.466928 },
  { lat: -5.146073, lng: 119.468611 },
  { lat: -5.14536, lng: 119.468831 },
  { lat: -5.14502, lng: 119.469253 },
  { lat: -5.144534, lng: 119.470091 },
  { lat: -5.144307, lng: 119.47018 },
  { lat: -5.143821, lng: 119.470042 },
  { lat: -5.143109, lng: 119.469676 },
  { lat: -5.143141, lng: 119.469505 },
  { lat: -5.142526, lng: 119.469075 },
  { lat: -5.142145, lng: 119.468993 },
  { lat: -5.14136, lng: 119.469725 },
  { lat: -5.1405, lng: 119.470378 },
  { lat: -5.140016, lng: 119.470072 },
  { lat: -5.139387, lng: 119.469346 },
  { lat: -5.138935, lng: 119.468831 },
  { lat: -5.138751, lng: 119.468763 },
  { lat: -5.138359, lng: 119.468677 },
  { lat: -5.138003, lng: 119.468788 },
  { lat: -5.13769, lng: 119.468973 },
  { lat: -5.137432, lng: 119.469262 },
  { lat: -5.136671, lng: 119.470483 },
  { lat: -5.135793, lng: 119.472004 },
  { lat: -5.135136, lng: 119.47267 },
  { lat: -5.134431, lng: 119.473563 },
  { lat: -5.134234, lng: 119.473841 },
  { lat: -5.133983, lng: 119.474605 },
  { lat: -5.133375, lng: 119.476096 },
  { lat: -5.133062, lng: 119.476694 },
  { lat: -5.132817, lng: 119.476823 },
  { lat: -5.13251, lng: 119.476916 },
  { lat: -5.132227, lng: 119.476897 },
  { lat: -5.132019, lng: 119.476799 },
  { lat: -5.131816, lng: 119.47646 },
  { lat: -5.131681, lng: 119.476275 },
  { lat: -5.131356, lng: 119.47471 },
  { lat: -5.131221, lng: 119.474266 },
  { lat: -5.130945, lng: 119.473742 },
  { lat: -5.130478, lng: 119.473009 },
  { lat: -5.129539, lng: 119.471376 },
  { lat: -5.128772, lng: 119.469983 },
  { lat: -5.128156, lng: 119.469066 },
  { lat: -5.128556, lng: 119.468895 },
  { lat: -5.128758, lng: 119.468886 },
  { lat: -5.128949, lng: 119.468891 },
  { lat: -5.129115, lng: 119.468846 },
  { lat: -5.129244, lng: 119.468773 },
  { lat: -5.129244, lng: 119.468655 },
  { lat: -5.129179, lng: 119.468525 },
  { lat: -5.12907, lng: 119.468456 },
  { lat: -5.12888, lng: 119.468431 },
  { lat: -5.128653, lng: 119.468435 },
  { lat: -5.128527, lng: 119.468264 },
  { lat: -5.128519, lng: 119.468098 },
  { lat: -5.128702, lng: 119.468008 },
  { lat: -5.128908, lng: 119.467964 },
  { lat: -5.12909, lng: 119.467988 },
  { lat: -5.129236, lng: 119.467829 },
  { lat: -5.1292, lng: 119.467655 },
  { lat: -5.129009, lng: 119.467594 },
  { lat: -5.128748, lng: 119.467549 },
  { lat: -5.128543, lng: 119.467393 },
  { lat: -5.12852, lng: 119.467241 },
  { lat: -5.128609, lng: 119.467099 },
  { lat: -5.128766, lng: 119.466995 },
  { lat: -5.128936, lng: 119.46699 },
  { lat: -5.129218, lng: 119.46702 },
  { lat: -5.129354, lng: 119.466983 },
  { lat: -5.129432, lng: 119.466885 },
  { lat: -5.129479, lng: 119.466657 },
  { lat: -5.129601, lng: 119.466418 },
  { lat: -5.129659, lng: 119.466324 },
  { lat: -5.129764, lng: 119.466296 },
  { lat: -5.129856, lng: 119.466289 },
  { lat: -5.130046, lng: 119.466264 },
  { lat: -5.130223, lng: 119.46614 },
  { lat: -5.130311, lng: 119.465977 },
  { lat: -5.130237, lng: 119.465422 },
  { lat: -5.130258, lng: 119.465333 },
  { lat: -5.130371, lng: 119.465227 },
  { lat: -5.130899, lng: 119.4651 },
  { lat: -5.131093, lng: 119.465029 },
  { lat: -5.131358, lng: 119.464668 },
  { lat: -5.131656, lng: 119.464095 },
  { lat: -5.131915, lng: 119.463534 },
  { lat: -5.132498, lng: 119.462119 },
  { lat: -5.132669, lng: 119.461168 },
  { lat: -5.132733, lng: 119.460655 },
  { lat: -5.133001, lng: 119.460428 },
  { lat: -5.133381, lng: 119.460241 },
  { lat: -5.133656, lng: 119.459834 },
  { lat: -5.133713, lng: 119.459566 },
  { lat: -5.133543, lng: 119.458997 },
  { lat: -5.133624, lng: 119.458525 },
  { lat: -5.133681, lng: 119.458143 },
  { lat: -5.133495, lng: 119.457679 },
  { lat: -5.133406, lng: 119.457436 },
  { lat: -5.133478, lng: 119.457297 },
  { lat: -5.133883, lng: 119.457224 },
  { lat: -5.134207, lng: 119.457354 },
  { lat: -5.134669, lng: 119.457403 },
  { lat: -5.134879, lng: 119.457395 },
  { lat: -5.13509, lng: 119.457265 },
  { lat: -5.135219, lng: 119.456907 },
  { lat: -5.135357, lng: 119.456086 },
  { lat: -5.135689, lng: 119.455403 },
  { lat: -5.136199, lng: 119.455029 },
  { lat: -5.136272, lng: 119.454704 },
  { lat: -5.136191, lng: 119.454443 },
  { lat: -5.135697, lng: 119.453996 },
  { lat: -5.134952, lng: 119.453264 },
  { lat: -5.134863, lng: 119.452939 },
  { lat: -5.135098, lng: 119.452492 },
  { lat: -5.135487, lng: 119.451817 },
  { lat: -5.136062, lng: 119.451232 },
  { lat: -5.136539, lng: 119.451028 },
  { lat: -5.136855, lng: 119.450703 },
  { lat: -5.137034, lng: 119.450362 },
  { lat: -5.136985, lng: 119.450085 },
  { lat: -5.136572, lng: 119.449687 },
  { lat: -5.136143, lng: 119.449402 },
  { lat: -5.13577, lng: 119.449329 },
  { lat: -5.1353, lng: 119.449329 },
  { lat: -5.134628, lng: 119.449378 },
  { lat: -5.134434, lng: 119.449174 },
  { lat: -5.134329, lng: 119.448939 },
  { lat: -5.134539, lng: 119.448703 },
  { lat: -5.135228, lng: 119.448687 },
  { lat: -5.135576, lng: 119.448573 },
  { lat: -5.135722, lng: 119.44837 },
  { lat: -5.135803, lng: 119.448142 },
  { lat: -5.135737, lng: 119.447744 },
  { lat: -5.135608, lng: 119.447321 },
  { lat: -5.135689, lng: 119.447077 },
  { lat: -5.136677, lng: 119.44576 },
  { lat: -5.137308, lng: 119.445369 },
  { lat: -5.138499, lng: 119.444898 },
];

/**
 * Pembagian Wilayah 7 RW (RW 01 – RW 07) yang dipotong (clipped) secara presisi
 * mengikuti garis batas administrasi resmi Kelurahan Panaikang tanpa melewati batas kelurahan lain.
 */
export const RW_ZONES: RwSpatialZone[] = [
  {
    rw: 'RW 01',
    name: 'Koridor Barat Urip Sumoharjo, Kampus UMI & Nipah Mall',
    color: '#0284C7',
    center: { lat: -5.137821, lng: 119.448856 },
    paths: [
      { lat: -5.138499, lng: 119.444898 },
      { lat: -5.13872, lng: 119.445747 },
      { lat: -5.139432, lng: 119.448072 },
      { lat: -5.140412, lng: 119.450878 },
      { lat: -5.140705, lng: 119.4518 },
      { lat: -5.135504, lng: 119.4518 },
      { lat: -5.136062, lng: 119.451232 },
      { lat: -5.136539, lng: 119.451028 },
      { lat: -5.136855, lng: 119.450703 },
      { lat: -5.137034, lng: 119.450362 },
      { lat: -5.136985, lng: 119.450085 },
      { lat: -5.136572, lng: 119.449687 },
      { lat: -5.136143, lng: 119.449402 },
      { lat: -5.13577, lng: 119.449329 },
      { lat: -5.1353, lng: 119.449329 },
      { lat: -5.134628, lng: 119.449378 },
      { lat: -5.134434, lng: 119.449174 },
      { lat: -5.134329, lng: 119.448939 },
      { lat: -5.134539, lng: 119.448703 },
      { lat: -5.135228, lng: 119.448687 },
      { lat: -5.135576, lng: 119.448573 },
      { lat: -5.135722, lng: 119.44837 },
      { lat: -5.135803, lng: 119.448142 },
      { lat: -5.135737, lng: 119.447744 },
      { lat: -5.135608, lng: 119.447321 },
      { lat: -5.135689, lng: 119.447077 },
      { lat: -5.136677, lng: 119.44576 },
      { lat: -5.137308, lng: 119.445369 },
      { lat: -5.138499, lng: 119.444898 },
    ],
  },
  {
    rw: 'RW 02',
    name: 'Koridor Poros Urip Sumoharjo, Kodam & TMP Panaikang',
    color: '#0D9488',
    center: { lat: -5.138479, lng: 119.454205 },
    paths: [
      { lat: -5.140705, lng: 119.4518 },
      { lat: -5.141675, lng: 119.454854 },
      { lat: -5.142184, lng: 119.4565 },
      { lat: -5.135287, lng: 119.4565 },
      { lat: -5.135357, lng: 119.456086 },
      { lat: -5.135689, lng: 119.455403 },
      { lat: -5.136199, lng: 119.455029 },
      { lat: -5.136272, lng: 119.454704 },
      { lat: -5.136191, lng: 119.454443 },
      { lat: -5.135697, lng: 119.453996 },
      { lat: -5.134952, lng: 119.453264 },
      { lat: -5.134863, lng: 119.452939 },
      { lat: -5.135098, lng: 119.452492 },
      { lat: -5.135487, lng: 119.451817 },
      { lat: -5.135504, lng: 119.4518 },
    ],
  },
  {
    rw: 'RW 03',
    name: 'Kawasan Kantor Lurah Panaikang, Jl. H. Kalla & Panaikang Indah',
    color: '#16A34A',
    center: { lat: -5.138332, lng: 119.458783 },
    paths: [
      { lat: -5.142184, lng: 119.4565 },
      { lat: -5.142485, lng: 119.457472 },
      { lat: -5.142979, lng: 119.458878 },
      { lat: -5.143203, lng: 119.45957 },
      { lat: -5.143601, lng: 119.4608 },
      { lat: -5.132715, lng: 119.4608 },
      { lat: -5.132733, lng: 119.460655 },
      { lat: -5.133001, lng: 119.460428 },
      { lat: -5.133381, lng: 119.460241 },
      { lat: -5.133656, lng: 119.459834 },
      { lat: -5.133713, lng: 119.459566 },
      { lat: -5.133543, lng: 119.458997 },
      { lat: -5.133624, lng: 119.458525 },
      { lat: -5.133681, lng: 119.458143 },
      { lat: -5.133495, lng: 119.457679 },
      { lat: -5.133406, lng: 119.457436 },
      { lat: -5.133478, lng: 119.457297 },
      { lat: -5.133883, lng: 119.457224 },
      { lat: -5.134207, lng: 119.457354 },
      { lat: -5.134669, lng: 119.457403 },
      { lat: -5.134879, lng: 119.457395 },
      { lat: -5.13509, lng: 119.457265 },
      { lat: -5.135219, lng: 119.456907 },
      { lat: -5.135287, lng: 119.4565 },
    ],
  },
  {
    rw: 'RW 04',
    name: 'Kawasan Campagaya, Kompleks Kesehatan & PDAM Panaikang',
    color: '#D97706',
    center: { lat: -5.13819, lng: 119.462875 },
    paths: [
      { lat: -5.143601, lng: 119.4608 },
      { lat: -5.143676, lng: 119.461033 },
      { lat: -5.143879, lng: 119.46168 },
      { lat: -5.144712, lng: 119.464326 },
      { lat: -5.144867, lng: 119.4648 },
      { lat: -5.131261, lng: 119.4648 },
      { lat: -5.131358, lng: 119.464668 },
      { lat: -5.131656, lng: 119.464095 },
      { lat: -5.131915, lng: 119.463534 },
      { lat: -5.132498, lng: 119.462119 },
      { lat: -5.132669, lng: 119.461168 },
      { lat: -5.132715, lng: 119.4608 },
    ],
  },
  {
    rw: 'RW 05',
    name: 'Koridor Urip Sumoharjo Timur & Kawasan Jembatan Tello',
    color: '#9333EA',
    center: { lat: -5.141592, lng: 119.467214 },
    paths: [
      { lat: -5.1375, lng: 119.4648 },
      { lat: -5.144867, lng: 119.4648 },
      { lat: -5.145563, lng: 119.466928 },
      { lat: -5.146073, lng: 119.468611 },
      { lat: -5.14536, lng: 119.468831 },
      { lat: -5.14502, lng: 119.469253 },
      { lat: -5.144534, lng: 119.470091 },
      { lat: -5.144307, lng: 119.47018 },
      { lat: -5.143821, lng: 119.470042 },
      { lat: -5.143109, lng: 119.469676 },
      { lat: -5.143141, lng: 119.469505 },
      { lat: -5.142526, lng: 119.469075 },
      { lat: -5.142145, lng: 119.468993 },
      { lat: -5.14136, lng: 119.469725 },
      { lat: -5.1405, lng: 119.470378 },
      { lat: -5.140016, lng: 119.470072 },
      { lat: -5.139387, lng: 119.469346 },
      { lat: -5.138935, lng: 119.468831 },
      { lat: -5.138751, lng: 119.468763 },
      { lat: -5.138359, lng: 119.468677 },
      { lat: -5.138003, lng: 119.468788 },
      { lat: -5.13769, lng: 119.468973 },
      { lat: -5.1375, lng: 119.469186 },
    ],
  },
  {
    rw: 'RW 06',
    name: 'Kawasan Panaikang Utara & Bantaran Kanal Pampang',
    color: '#2563EB',
    center: { lat: -5.133306, lng: 119.467755 },
    paths: [
      { lat: -5.1375, lng: 119.4648 },
      { lat: -5.1375, lng: 119.469186 },
      { lat: -5.137432, lng: 119.469262 },
      { lat: -5.136671, lng: 119.470483 },
      { lat: -5.136661, lng: 119.4705 },
      { lat: -5.129057, lng: 119.4705 },
      { lat: -5.128772, lng: 119.469983 },
      { lat: -5.128156, lng: 119.469066 },
      { lat: -5.128556, lng: 119.468895 },
      { lat: -5.128758, lng: 119.468886 },
      { lat: -5.128949, lng: 119.468891 },
      { lat: -5.129115, lng: 119.468846 },
      { lat: -5.129244, lng: 119.468773 },
      { lat: -5.129244, lng: 119.468655 },
      { lat: -5.129179, lng: 119.468525 },
      { lat: -5.12907, lng: 119.468456 },
      { lat: -5.12888, lng: 119.468431 },
      { lat: -5.128653, lng: 119.468435 },
      { lat: -5.128527, lng: 119.468264 },
      { lat: -5.128519, lng: 119.468098 },
      { lat: -5.128702, lng: 119.468008 },
      { lat: -5.128908, lng: 119.467964 },
      { lat: -5.12909, lng: 119.467988 },
      { lat: -5.129236, lng: 119.467829 },
      { lat: -5.1292, lng: 119.467655 },
      { lat: -5.129009, lng: 119.467594 },
      { lat: -5.128748, lng: 119.467549 },
      { lat: -5.128543, lng: 119.467393 },
      { lat: -5.12852, lng: 119.467241 },
      { lat: -5.128609, lng: 119.467099 },
      { lat: -5.128766, lng: 119.466995 },
      { lat: -5.128936, lng: 119.46699 },
      { lat: -5.129218, lng: 119.46702 },
      { lat: -5.129354, lng: 119.466983 },
      { lat: -5.129432, lng: 119.466885 },
      { lat: -5.129479, lng: 119.466657 },
      { lat: -5.129601, lng: 119.466418 },
      { lat: -5.129659, lng: 119.466324 },
      { lat: -5.129764, lng: 119.466296 },
      { lat: -5.129856, lng: 119.466289 },
      { lat: -5.130046, lng: 119.466264 },
      { lat: -5.130223, lng: 119.46614 },
      { lat: -5.130311, lng: 119.465977 },
      { lat: -5.130237, lng: 119.465422 },
      { lat: -5.130258, lng: 119.465333 },
      { lat: -5.130371, lng: 119.465227 },
      { lat: -5.130899, lng: 119.4651 },
      { lat: -5.131093, lng: 119.465029 },
      { lat: -5.131261, lng: 119.4648 },
    ],
  },
  {
    rw: 'RW 07',
    name: 'Kawasan Panaikang Timur & Bantaran Sungai Tello',
    color: '#E11D48',
    center: { lat: -5.132737, lng: 119.472771 },
    paths: [
      { lat: -5.136661, lng: 119.4705 },
      { lat: -5.135793, lng: 119.472004 },
      { lat: -5.135136, lng: 119.47267 },
      { lat: -5.134431, lng: 119.473563 },
      { lat: -5.134234, lng: 119.473841 },
      { lat: -5.133983, lng: 119.474605 },
      { lat: -5.133375, lng: 119.476096 },
      { lat: -5.133062, lng: 119.476694 },
      { lat: -5.132817, lng: 119.476823 },
      { lat: -5.13251, lng: 119.476916 },
      { lat: -5.132227, lng: 119.476897 },
      { lat: -5.132019, lng: 119.476799 },
      { lat: -5.131816, lng: 119.47646 },
      { lat: -5.131681, lng: 119.476275 },
      { lat: -5.131356, lng: 119.47471 },
      { lat: -5.131221, lng: 119.474266 },
      { lat: -5.130945, lng: 119.473742 },
      { lat: -5.130478, lng: 119.473009 },
      { lat: -5.129539, lng: 119.471376 },
      { lat: -5.129057, lng: 119.4705 },
    ],
  },
];

/**
 * Titik Penanda 4 Mata Angin Batas Resmi Kelurahan Panaikang
 * Diposisikan tepat pada garis batas administrasi Kelurahan Panaikang
 */
export const BOUNDARY_POINTS: Record<
  'utara' | 'timur' | 'selatan' | 'barat',
  {
    title: string;
    directionLabel: string;
    pos: LatLngPoint;
    color: string;
    badgeBg: string;
    borderRing: string;
  }
> = {
  utara: {
    title: 'Batas Wilayah Bagian Utara',
    directionLabel: 'Utara',
    pos: { lat: -5.128556, lng: 119.468895 },
    color: 'bg-sky-600',
    badgeBg: 'bg-sky-600',
    borderRing: 'ring-sky-400',
  },
  timur: {
    title: 'Batas Wilayah Bagian Timur',
    directionLabel: 'Timur',
    pos: { lat: -5.13251, lng: 119.476916 },
    color: 'bg-amber-600',
    badgeBg: 'bg-amber-600',
    borderRing: 'ring-amber-400',
  },
  selatan: {
    title: 'Batas Wilayah Bagian Selatan',
    directionLabel: 'Selatan',
    pos: { lat: -5.143203, lng: 119.45957 },
    color: 'bg-emerald-600',
    badgeBg: 'bg-emerald-600',
    borderRing: 'ring-emerald-400',
  },
  barat: {
    title: 'Batas Wilayah Bagian Barat',
    directionLabel: 'Barat',
    pos: { lat: -5.138499, lng: 119.444898 },
    color: 'bg-purple-600',
    badgeBg: 'bg-purple-600',
    borderRing: 'ring-purple-400',
  },
};

/**
 * Ray-casting Point-in-Polygon check untuk memastikan setiap titik fasilitas/laporan
 * berada di dalam batas resmi Kelurahan Panaikang (tidak masuk ke kelurahan tetangga).
 */
export function isPointInsidePolygon(point: LatLngPoint, polygon: LatLngPoint[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lng;
    const yi = polygon[i].lat;
    const xj = polygon[j].lng;
    const yj = polygon[j].lat;

    const intersect =
      yi > point.lat !== yj > point.lat &&
      point.lng < ((xj - xi) * (point.lat - yi)) / (yj - yi + 1e-12) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

export function isPointInsidePanaikang(lat: number, lng: number): boolean {
  return isPointInsidePolygon({ lat, lng }, PANAIKANG_PERIMETER_POLYGON);
}

/**
 * Menentukan koordinat di dalam batas resmi Kelurahan Panaikang berdasarkan label koordinat,
 * kode RW (RW 01 - RW 07), atau posisi relatif mapX/mapY.
 */
export function resolvePanaikangCoordinate(
  coordinatesLabel?: string,
  mapX: number = 50,
  mapY: number = 50,
  rwHint?: string
): LatLngPoint {
  // 1. Jika memiliki koordinat eksplisit yang valid DAN berada di dalam polygon resmi Kelurahan Panaikang
  if (coordinatesLabel && coordinatesLabel.includes(',')) {
    const parts = coordinatesLabel.split(',');
    if (parts.length === 2) {
      const lat = parseFloat(parts[0].trim());
      const lng = parseFloat(parts[1].trim());
      if (!Number.isNaN(lat) && !Number.isNaN(lng) && isPointInsidePanaikang(lat, lng)) {
        return { lat, lng };
      }
    }
  }

  // 2. Jika memiliki informasi RW, tempatkan di sekitar titik tengah (centroid) RW tersebut di dalam polygon
  if (rwHint) {
    const digits = rwHint.replace(/\D/g, '');
    const rwNum = parseInt(digits, 10);
    if (!Number.isNaN(rwNum) && rwNum >= 1 && rwNum <= 7) {
      const targetZone = RW_ZONES[rwNum - 1];
      if (targetZone) {
        const offsetLat = ((50 - (mapY % 100)) / 100) * 0.0018;
        const offsetLng = (((mapX % 100) - 50) / 100) * 0.0022;
        const candidate = {
          lat: Number((targetZone.center.lat + offsetLat).toFixed(6)),
          lng: Number((targetZone.center.lng + offsetLng).toFixed(6)),
        };
        if (isPointInsidePanaikang(candidate.lat, candidate.lng)) {
          return candidate;
        }
        return targetZone.center;
      }
    }
  }

  // 3. Pemetaan proporsional ke dalam zona RW berdasarkan nilai mapX/mapY, dijamin tetap di dalam polygon Kelurahan Panaikang
  const zoneIndex = Math.min(
    RW_ZONES.length - 1,
    Math.max(0, Math.floor((Math.abs(mapX) % 100) / (100 / RW_ZONES.length)))
  );
  const fallbackZone = RW_ZONES[zoneIndex] || RW_ZONES[2];
  const offsetLat = ((50 - (mapY % 100)) / 100) * 0.0014;
  const offsetLng = (((mapX % 100) - 50) / 100) * 0.0018;
  const candidate = {
    lat: Number((fallbackZone.center.lat + offsetLat).toFixed(6)),
    lng: Number((fallbackZone.center.lng + offsetLng).toFixed(6)),
  };
  if (isPointInsidePanaikang(candidate.lat, candidate.lng)) {
    return candidate;
  }
  return fallbackZone.center;
}
