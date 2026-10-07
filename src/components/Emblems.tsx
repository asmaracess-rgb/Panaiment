import React from 'react';

/**
 * Lambang Pemerintah Kota Makassar
 * Replikasi vektor presisi tinggi sesuai gambar prototipe yang dilampirkan:
 * - Mahkota benteng bata merah di bagian atas
 * - Perisai putih dengan bingkai merah-emas
 * - Lingkaran tengah dengan perahu Phinisi, sinar matahari emas, dan gelombang laut biru-putih
 * - Untaian padi & kapas hijau-emas mengapit lingkaran
 * - Pita merah melengkung di bawah bertuliskan "KOTA MAKASSAR"
 */
export const EmblemKotaMakassar: React.FC<{ className?: string }> = ({
  className = 'w-28 h-32',
}) => (
  <svg
    viewBox="0 0 180 200"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-label="Lambang Pemerintah Kota Makassar"
  >
    <defs>
      {/* Curved path for KOTA MAKASSAR ribbon text */}
      <path id="makassarRibbonPath" d="M 24,158 Q 90,192 156,158" />
      <linearGradient id="shieldGold" x1="30" y1="30" x2="150" y2="160" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FDE047" />
        <stop offset="0.5" stopColor="#EAB308" />
        <stop offset="1" stopColor="#CA8A04" />
      </linearGradient>
      <linearGradient id="sunBurst" x1="90" y1="54" x2="90" y2="112" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FEF08A" />
        <stop offset="1" stopColor="#FACC15" />
      </linearGradient>
    </defs>

    {/* ================= 1. TOP RED BRICK FORT CROWN (BENTENG) ================= */}
    <g>
      {/* Base Fort Body */}
      <path
        d="M54 14H68V20H82V14H98V20H112V14H126V36H54V14Z"
        fill="#C81E1E"
        stroke="#450A0A"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      {/* Brick Mortar Horizontal Lines */}
      <line x1="55" y1="21" x2="125" y2="21" stroke="#FECACA" strokeWidth="1.3" />
      <line x1="55" y1="27" x2="125" y2="27" stroke="#FECACA" strokeWidth="1.3" />
      <line x1="55" y1="32.5" x2="125" y2="32.5" stroke="#FECACA" strokeWidth="1.3" />
      {/* Brick Mortar Vertical Staggered Lines */}
      <line x1="68" y1="21" x2="68" y2="27" stroke="#FECACA" strokeWidth="1.2" />
      <line x1="90" y1="21" x2="90" y2="27" stroke="#FECACA" strokeWidth="1.2" />
      <line x1="112" y1="21" x2="112" y2="27" stroke="#FECACA" strokeWidth="1.2" />
      <line x1="78" y1="27" x2="78" y2="32.5" stroke="#FECACA" strokeWidth="1.2" />
      <line x1="102" y1="27" x2="102" y2="32.5" stroke="#FECACA" strokeWidth="1.2" />
      {/* Gold Collar under Fort */}
      <rect
        x="58"
        y="34"
        width="64"
        height="4"
        rx="1.5"
        fill="#FACC15"
        stroke="#78350F"
        strokeWidth="1.2"
      />
    </g>

    {/* ================= 2. MAIN SHIELD BODY ================= */}
    {/* Outer Dark Red & Gold Shield Border */}
    <path
      d="M36 38H144V98C144 134 90 158 90 158C90 158 36 134 36 98V38Z"
      fill="#FFFFFF"
      stroke="#7F1D1D"
      strokeWidth="4.5"
      strokeLinejoin="round"
    />
    <path
      d="M40 42H140V97C140 130 90 152 90 152C90 152 40 130 40 97V42Z"
      fill="#FFFFFF"
      stroke="url(#shieldGold)"
      strokeWidth="3"
      strokeLinejoin="round"
    />

    {/* ================= 3. GREEN & GOLD WREATH INSIDE SHIELD ================= */}
    {/* Left Wreath Branch */}
    <path
      d="M84 136C56 128 48 102 52 68"
      stroke="#15803D"
      strokeWidth="3.5"
      strokeLinecap="round"
    />
    {/* Left Laurel Leaves & Paddy Grains */}
    <ellipse cx="50" cy="74" rx="6" ry="3" transform="rotate(-40 50 74)" fill="#16A34A" />
    <ellipse cx="49" cy="84" rx="6.5" ry="3.2" transform="rotate(-30 49 84)" fill="#15803D" />
    <ellipse cx="51" cy="95" rx="6.5" ry="3.2" transform="rotate(-20 51 95)" fill="#16A34A" />
    <ellipse cx="55" cy="106" rx="6.5" ry="3.2" transform="rotate(-10 55 106)" fill="#15803D" />
    <ellipse cx="61" cy="117" rx="6.5" ry="3.2" transform="rotate(10 61 117)" fill="#16A34A" />
    <ellipse cx="70" cy="126" rx="6" ry="3" transform="rotate(25 70 126)" fill="#15803D" />
    {/* Inner Golden Paddy Dots on Left */}
    <circle cx="57" cy="72" r="2.3" fill="#EAB308" />
    <circle cx="55" cy="81" r="2.3" fill="#EAB308" />
    <circle cx="56" cy="90" r="2.3" fill="#EAB308" />
    <circle cx="59" cy="100" r="2.3" fill="#EAB308" />
    <circle cx="64" cy="109" r="2.3" fill="#EAB308" />

    {/* Right Wreath Branch */}
    <path
      d="M96 136C124 128 132 102 128 68"
      stroke="#15803D"
      strokeWidth="3.5"
      strokeLinecap="round"
    />
    {/* Right Laurel Leaves & Cotton Blossoms */}
    <ellipse cx="130" cy="74" rx="6" ry="3" transform="rotate(40 130 74)" fill="#16A34A" />
    <ellipse cx="131" cy="84" rx="6.5" ry="3.2" transform="rotate(30 131 84)" fill="#15803D" />
    <ellipse cx="129" cy="95" rx="6.5" ry="3.2" transform="rotate(20 129 95)" fill="#16A34A" />
    <ellipse cx="125" cy="106" rx="6.5" ry="3.2" transform="rotate(10 125 106)" fill="#15803D" />
    <ellipse cx="119" cy="117" rx="6.5" ry="3.2" transform="rotate(-10 119 117)" fill="#16A34A" />
    <ellipse cx="110" cy="126" rx="6" ry="3" transform="rotate(-25 110 126)" fill="#15803D" />
    {/* Cotton Blossoms on Right */}
    <circle cx="123" cy="72" r="2.6" fill="#FFFFFF" stroke="#15803D" strokeWidth="1.2" />
    <circle cx="125" cy="82" r="2.6" fill="#FFFFFF" stroke="#15803D" strokeWidth="1.2" />
    <circle cx="124" cy="92" r="2.6" fill="#FFFFFF" stroke="#15803D" strokeWidth="1.2" />
    <circle cx="121" cy="102" r="2.6" fill="#FFFFFF" stroke="#15803D" strokeWidth="1.2" />

    {/* Wreath Tie at Bottom */}
    <rect x="83" y="131" width="14" height="7" rx="2" fill="#C81E1E" stroke="#7F1D1D" strokeWidth="1" />
    <line x1="86" y1="131" x2="86" y2="138" stroke="#FACC15" strokeWidth="1.5" />
    <line x1="94" y1="131" x2="94" y2="138" stroke="#FACC15" strokeWidth="1.5" />

    {/* ================= 4. CENTER MEDALLION WITH PHINISI SAILBOAT ================= */}
    <circle
      cx="90"
      cy="88"
      r="31"
      fill="url(#sunBurst)"
      stroke="#CA8A04"
      strokeWidth="2.5"
    />
    {/* Sun Rays inside Medallion */}
    <g stroke="#EAB308" strokeWidth="1.2" opacity="0.8">
      <line x1="90" y1="58" x2="90" y2="95" />
      <line x1="68" y1="66" x2="90" y2="95" />
      <line x1="112" y1="66" x2="90" y2="95" />
      <line x1="61" y1="80" x2="90" y2="95" />
      <line x1="119" y1="80" x2="90" y2="95" />
    </g>

    {/* Sea Waves in Lower Medallion */}
    <path
      d="M62 100C70 97 78 102 86 99C94 96 102 102 110 99C114 98 116 99 118 100C114 111 103 118 90 118C77 118 66 111 62 100Z"
      fill="#0D3868"
    />
    <path
      d="M65 104C73 102 81 106 89 104C97 102 105 106 115 104"
      stroke="#FFFFFF"
      strokeWidth="2.2"
      strokeLinecap="round"
    />
    <path
      d="M70 110C78 108 86 112 94 110C101 108 106 111 110 110"
      stroke="#38BDF8"
      strokeWidth="2"
      strokeLinecap="round"
    />

    {/* Phinisi Sailboat */}
    {/* Hull */}
    <path
      d="M67 95L75 102H105L113 92L106 95H67Z"
      fill="#0F172A"
    />
    {/* Masts */}
    <line x1="87" y1="62" x2="87" y2="96" stroke="#0F172A" strokeWidth="2.2" />
    <line x1="97" y1="67" x2="97" y2="96" stroke="#0F172A" strokeWidth="1.8" />
    {/* Main Sails */}
    <path
      d="M86 63L71 92H86V63Z"
      fill="#FFFFFF"
      stroke="#1E293B"
      strokeWidth="1.3"
      strokeLinejoin="round"
    />
    <path
      d="M88 66L96 92H88V66Z"
      fill="#F8FAFC"
      stroke="#1E293B"
      strokeWidth="1.2"
      strokeLinejoin="round"
    />
    <path
      d="M98 69L110 92H98V69Z"
      fill="#FFFFFF"
      stroke="#1E293B"
      strokeWidth="1.2"
      strokeLinejoin="round"
    />

    {/* ================= 5. BOTTOM RED SWALLOWTAIL RIBBON: KOTA MAKASSAR ================= */}
    {/* Left & Right Swallowtail Fork Ends */}
    <path
      d="M10 144L28 136L32 154L16 162L18 151L10 144Z"
      fill="#991B1B"
      stroke="#450A0A"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
    <path
      d="M170 144L152 136L148 154L164 162L162 151L170 144Z"
      fill="#991B1B"
      stroke="#450A0A"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
    {/* Main Curved Red Ribbon Body */}
    <path
      d="M22 142C55 174 125 174 158 142L152 162C120 192 60 192 28 162L22 142Z"
      fill="#C81E1E"
      stroke="#450A0A"
      strokeWidth="2.2"
      strokeLinejoin="round"
    />
    {/* Inner White/Gold Trim Line on Ribbon */}
    <path
      d="M25 145C56 175 124 175 155 145"
      stroke="#FCA5A5"
      strokeWidth="1"
      fill="none"
    />
    {/* Curved Text: KOTA MAKASSAR */}
    <text
      fill="#FFFFFF"
      fontSize="11.5"
      fontWeight="800"
      letterSpacing="1.1"
    >
      <textPath href="#makassarRibbonPath" startOffset="50%" textAnchor="middle">
        KOTA MAKASSAR
      </textPath>
    </text>
  </svg>
);

/**
 * Lambang Kelurahan Panaikang
 * Replikasi vektor presisi tinggi sesuai gambar prototipe yang dilampirkan:
 * - Lingkaran merah marun gelap dengan bingkai kuning emas tebal dan garis tepi marun tua
 * - Bintang emas besar bersudut lima di bagian atas disertai sayap garis horison emas kiri-kanan
 * - Perspektif jalan raya coklat tua di tengah dengan garis putus-putus kuning di tengah dan bahu jalan kuning
 * - Tangkai bulir padi kuning emas melengkung di sisi kiri
 * - Tangkai bunga kapas putih & daun hijau melengkung di sisi kanan
 * - Pita marun berbingkai emas di bagian bawah bertuliskan 2 baris "KELURAHAN" dan "PANAIKANG"
 */
export const EmblemKelurahanPanaikang: React.FC<{ className?: string }> = ({
  className = 'w-28 h-32',
}) => (
  <svg
    viewBox="0 0 180 200"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-label="Lambang Kelurahan Panaikang"
  >
    <defs>
      {/* Arched text paths matching the convex upward curve of the KELURAHAN PANAIKANG banner */}
      <path id="panaikangLine1" d="M 24,149 Q 90,135 156,149" />
      <path id="panaikangLine2" d="M 20,169 Q 90,155 160,169" />
      <radialGradient id="maroonField" cx="50%" cy="45%" r="55%">
        <stop offset="0%" stopColor="#7F1D1D" />
        <stop offset="100%" stopColor="#4C0D0D" />
      </radialGradient>
    </defs>

    {/* ================= 1. CIRCULAR MEDALLION BASE ================= */}
    {/* Outer Dark Maroon Rim */}
    <circle cx="90" cy="84" r="68" fill="#4A0E0E" />
    {/* Thick Golden-Yellow Ring */}
    <circle
      cx="90"
      cy="84"
      r="64"
      fill="url(#maroonField)"
      stroke="#EAB308"
      strokeWidth="5.5"
    />
    {/* Inner Subtle Maroon Ring */}
    <circle
      cx="90"
      cy="84"
      r="60"
      fill="none"
      stroke="#4A0E0E"
      strokeWidth="1.5"
    />

    {/* ================= 2. HORIZON GOLD WINGS & PERSPECTIVE ROAD ================= */}
    {/* Gold Horizon Wings Left & Right of Road Top */}
    <path
      d="M54 57H79L75 63H52L54 57Z"
      fill="#EAB308"
      stroke="#4A0E0E"
      strokeWidth="1.2"
    />
    <path
      d="M101 57H126L128 63H105L101 57Z"
      fill="#EAB308"
      stroke="#4A0E0E"
      strokeWidth="1.2"
    />

    {/* Center Perspective Highway / Road */}
    <path
      d="M80 57H100L132 132H48L80 57Z"
      fill="#431407"
      stroke="#FACC15"
      strokeWidth="3"
      strokeLinejoin="round"
    />
    {/* 3 Yellow Dashed Center Road Markings */}
    <rect x="88.5" y="63" width="3" height="11" rx="1" fill="#FACC15" />
    <rect x="88" y="81" width="4" height="15" rx="1" fill="#FACC15" />
    <rect x="87.5" y="104" width="5" height="19" rx="1.2" fill="#FACC15" />

    {/* ================= 3. TOP 5-POINTED GOLDEN STAR ================= */}
    <polygon
      points="90,23 96.5,37 112,38.5 100.5,48.5 104,63.5 90,55.5 76,63.5 79.5,48.5 68,38.5 83.5,37"
      fill="#FACC15"
      stroke="#4A0E0E"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    {/* Subtle Star Inner Highlight */}
    <polygon
      points="90,26 95,38 108,39 98,47.5 101,60 90,53"
      fill="#CA8A04"
      opacity="0.35"
    />

    {/* ================= 4. LEFT SIDE: GOLDEN PADDY STALK (PADI) ================= */}
    {/* Stem */}
    <path
      d="M54 126C36 102 36 68 52 44"
      stroke="#FACC15"
      strokeWidth="3"
      strokeLinecap="round"
    />
    {/* Outer & Inner Grain Pairs along Left Curve */}
    <ellipse cx="37" cy="98" rx="6.5" ry="3.2" transform="rotate(-40 37 98)" fill="#FACC15" stroke="#4A0E0E" strokeWidth="1" />
    <ellipse cx="35" cy="86" rx="6.5" ry="3.2" transform="rotate(-32 35 86)" fill="#FACC15" stroke="#4A0E0E" strokeWidth="1" />
    <ellipse cx="36" cy="74" rx="6.5" ry="3.2" transform="rotate(-24 36 74)" fill="#FACC15" stroke="#4A0E0E" strokeWidth="1" />
    <ellipse cx="39" cy="62" rx="6.5" ry="3.2" transform="rotate(-18 39 62)" fill="#FACC15" stroke="#4A0E0E" strokeWidth="1" />
    <ellipse cx="45" cy="51" rx="6" ry="3" transform="rotate(-12 45 51)" fill="#FACC15" stroke="#4A0E0E" strokeWidth="1" />

    <ellipse cx="47" cy="103" rx="6" ry="3" transform="rotate(20 47 103)" fill="#EAB308" stroke="#4A0E0E" strokeWidth="1" />
    <ellipse cx="45" cy="91" rx="6" ry="3" transform="rotate(25 45 91)" fill="#EAB308" stroke="#4A0E0E" strokeWidth="1" />
    <ellipse cx="45" cy="79" rx="6" ry="3" transform="rotate(30 45 79)" fill="#EAB308" stroke="#4A0E0E" strokeWidth="1" />
    <ellipse cx="48" cy="67" rx="5.5" ry="2.8" transform="rotate(35 48 67)" fill="#EAB308" stroke="#4A0E0E" strokeWidth="1" />

    {/* ================= 5. RIGHT SIDE: COTTON BRANCH & GREEN LEAVES (KAPAS) ================= */}
    {/* Stem */}
    <path
      d="M126 126C144 102 144 68 128 44"
      stroke="#15803D"
      strokeWidth="3.2"
      strokeLinecap="round"
    />
    {/* Green Leaves */}
    <ellipse cx="127" cy="53" rx="6.5" ry="3.5" transform="rotate(-25 127 53)" fill="#22C55E" stroke="#052E16" strokeWidth="1" />
    <ellipse cx="131" cy="78" rx="7" ry="3.8" transform="rotate(-30 131 78)" fill="#16A34A" stroke="#052E16" strokeWidth="1" />
    <ellipse cx="144" cy="92" rx="7" ry="3.8" transform="rotate(30 144 92)" fill="#22C55E" stroke="#052E16" strokeWidth="1" />
    <ellipse cx="129" cy="102" rx="7.5" ry="4" transform="rotate(-25 129 102)" fill="#16A34A" stroke="#052E16" strokeWidth="1" />

    {/* Fluffy White Cotton Blossom 1 (Upper Right) */}
    <g>
      <circle cx="138" cy="64" r="5" fill="#FFFFFF" stroke="#14532D" strokeWidth="1.2" />
      <circle cx="144" cy="66" r="4.5" fill="#FFFFFF" stroke="#14532D" strokeWidth="1.2" />
      <circle cx="140" cy="70" r="4.5" fill="#FFFFFF" stroke="#14532D" strokeWidth="1.2" />
      <path d="M135 71L140 68L145 71" stroke="#15803D" strokeWidth="2" strokeLinecap="round" />
    </g>

    {/* Fluffy White Cotton Blossom 2 (Mid-Lower Right) */}
    <g>
      <circle cx="142" cy="79" r="5" fill="#FFFFFF" stroke="#14532D" strokeWidth="1.2" />
      <circle cx="148" cy="82" r="4.5" fill="#FFFFFF" stroke="#14532D" strokeWidth="1.2" />
      <circle cx="144" cy="86" r="4.5" fill="#FFFFFF" stroke="#14532D" strokeWidth="1.2" />
      <path d="M139 87L144 84L149 87" stroke="#15803D" strokeWidth="2" strokeLinecap="round" />
    </g>

    {/* ================= 6. BOTTOM ARCHED BANNER: KELURAHAN PANAIKANG ================= */}
    {/* Outer Dark Rim of Banner */}
    <path
      d="M15 133Q90 116 165 133L160 180Q90 164 20 180L15 133Z"
      fill="#4A0E0E"
      stroke="#3B0707"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    {/* Maroon Banner Body with Golden-Yellow Border */}
    <path
      d="M18 135Q90 119 162 135L157 177Q90 162 23 177L18 135Z"
      fill="#6D1414"
      stroke="#EAB308"
      strokeWidth="3.5"
      strokeLinejoin="round"
    />

    {/* Line 1: KELURAHAN */}
    <text
      fill="#FACC15"
      fontSize="14.5"
      fontWeight="800"
      letterSpacing="1.2"
    >
      <textPath href="#panaikangLine1" startOffset="50%" textAnchor="middle">
        KELURAHAN
      </textPath>
    </text>

    {/* Line 2: PANAIKANG */}
    <text
      fill="#FACC15"
      fontSize="16"
      fontWeight="900"
      letterSpacing="1.4"
    >
      <textPath href="#panaikangLine2" startOffset="50%" textAnchor="middle">
        PANAIKANG
      </textPath>
    </text>
  </svg>
);

/**
 * Green Leaf SVG used above the "i" in PANAIKANG and flanking "Selamat Datang"
 */
export const LeafAccent: React.FC<{ className?: string; flip?: boolean }> = ({
  className = 'w-8 h-8',
  flip = false,
}) => (
  <svg
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`${className} ${flip ? '-scale-x-100' : ''}`}
    aria-hidden="true"
  >
    <path
      d="M8 40C8 20 22 8 42 8C42 28 30 40 8 40Z"
      fill="url(#leafGrad)"
    />
    <path
      d="M8 40C18 30 28 20 40 10"
      stroke="#BBF7D0"
      strokeWidth="2.2"
      strokeLinecap="round"
    />
    <defs>
      <linearGradient id="leafGrad" x1="8" y1="8" x2="42" y2="40" gradientUnits="userSpaceOnUse">
        <stop stopColor="#4ADE80" />
        <stop offset="1" stopColor="#15803D" />
      </linearGradient>
    </defs>
  </svg>
);

/**
 * Card 1 Icon: Untuk Warga (Three community silhouettes)
 */
export const IconUntukWarga: React.FC<{ className?: string }> = ({ className = 'w-14 h-14' }) => (
  <svg viewBox="0 0 64 56" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Left Person */}
    <circle cx="16" cy="18" r="6.5" fill="white" opacity="0.92" />
    <path
      d="M5 42C5 34.5 9.8 30 16 30C20.2 30 23.5 32 25.2 35.5"
      fill="white"
      opacity="0.92"
    />
    <path d="M4 44C4 35.5 9 30 16 30C23 30 27 35.5 27 44H4Z" fill="white" opacity="0.9" />
    {/* Right Person */}
    <circle cx="48" cy="18" r="6.5" fill="white" opacity="0.92" />
    <path d="M37 44C37 35.5 41 30 48 30C55 30 60 35.5 60 44H37Z" fill="white" opacity="0.9" />
    {/* Center Foreground Person */}
    <circle cx="32" cy="14" r="8.5" fill="white" />
    <path
      d="M17 48C17 37.5 23.2 30 32 30C40.8 30 47 37.5 47 48H17Z"
      fill="white"
      stroke="#0284C7"
      strokeWidth="1.5"
    />
  </svg>
);

/**
 * Card 2 Icon: Dashboard Lurah (Executive leader with tie + bar chart)
 */
export const IconDashboardLurah: React.FC<{ className?: string }> = ({ className = 'w-14 h-14' }) => (
  <svg viewBox="0 0 68 56" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Person Head */}
    <circle cx="24" cy="14" r="8" fill="white" />
    {/* Person Suit Shoulders with Tie */}
    <path
      d="M9 46C9 35.5 15.2 28 24 28C32.8 28 39 35.5 39 46H9Z"
      fill="white"
    />
    {/* Tie Cutout */}
    <path d="M24 29L21.5 38L24 43L26.5 38L24 29Z" fill="#2E7D32" />
    {/* Bar Chart Board on Right */}
    <rect x="37" y="22" width="24" height="22" rx="2.5" fill="white" stroke="#2E7D32" strokeWidth="1.5" />
    <rect x="41" y="34" width="3.5" height="7" rx="1" fill="#2E7D32" />
    <rect x="47" y="29" width="3.5" height="12" rx="1" fill="#2E7D32" />
    <rect x="53" y="26" width="3.5" height="15" rx="1" fill="#2E7D32" />
  </svg>
);

/**
 * Card 3 Icon: Peta Digital (Location pin on folded map)
 */
export const IconPetaDigital: React.FC<{ className?: string }> = ({ className = 'w-14 h-14' }) => (
  <svg viewBox="0 0 64 56" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Folded Map Base */}
    <path
      d="M14 30L26 26L38 30L50 26L56 46L42 50L30 46L16 50L8 46L14 30Z"
      fill="white"
      fillOpacity="0.2"
      stroke="white"
      strokeWidth="3"
      strokeLinejoin="round"
    />
    <line x1="26" y1="26" x2="23" y2="48" stroke="white" strokeWidth="2.5" />
    <line x1="38" y1="30" x2="41" y2="50" stroke="white" strokeWidth="2.5" />
    <line x1="12" y1="38" x2="53" y2="38" stroke="white" strokeWidth="2.2" />
    {/* Map Pin on Top */}
    <path
      d="M32 6C24.8 6 19 11.8 19 19C19 28.5 32 39 32 39C32 39 45 28.5 45 19C45 11.8 39.2 6 32 6Z"
      fill="white"
      stroke="#00838F"
      strokeWidth="2"
    />
    <circle cx="32" cy="19" r="5" fill="#00838F" />
  </svg>
);

/**
 * Card 4 Icon: Monitoring Sampah (Recycle 3-arrow symbol)
 */
export const IconMonitoringSampah: React.FC<{ className?: string }> = ({ className = 'w-14 h-14' }) => (
  <svg viewBox="0 0 64 56" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Top Recycle Arrow */}
    <path
      d="M26 12L32 5L38 12L35 19L23 19L26 12Z"
      fill="white"
    />
    <path
      d="M32 7L42 22H34L28 11L32 7Z"
      fill="white"
    />
    {/* Right Recycle Arrow */}
    <path
      d="M45 25L53 39L45 45H35V37H44L40 28L45 25Z"
      fill="white"
    />
    {/* Left Recycle Arrow */}
    <path
      d="M19 25L11 39L19 45H29V37H20L24 28L19 25Z"
      fill="white"
    />
    {/* Arrowheads */}
    <polygon points="43,19 48,25 39,26" fill="white" />
    <polygon points="34,34 30,41 34,48" fill="white" />
    <polygon points="16,28 22,21 25,29" fill="white" />
  </svg>
);

/**
 * Card 5 Icon: Monitoring Kerja Bakti (Broom with sparkles)
 */
export const IconMonitoringKerjaBakti: React.FC<{ className?: string }> = ({
  className = 'w-14 h-14',
}) => (
  <svg viewBox="0 0 64 56" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Broom Handle */}
    <path
      d="M48 6L30 24"
      stroke="white"
      strokeWidth="4.5"
      strokeLinecap="round"
    />
    {/* Broom Collar */}
    <path
      d="M25 21L33 29L29 33L21 25L25 21Z"
      fill="white"
    />
    {/* Broom Bristles */}
    <path
      d="M20 26L32 38L23 48C17 46 12 41 10 35L20 26Z"
      fill="white"
    />
    <line x1="15" y1="39" x2="21" y2="33" stroke="#5E35B1" strokeWidth="1.8" strokeLinecap="round" />
    <line x1="19" y1="43" x2="25" y2="37" stroke="#5E35B1" strokeWidth="1.8" strokeLinecap="round" />
    {/* Sparkles */}
    <path d="M16 14L18 19L23 21L18 23L16 28L14 23L9 21L14 19L16 14Z" fill="white" />
    <path d="M44 26L45.5 30L49.5 31.5L45.5 33L44 37L42.5 33L38.5 31.5L42.5 30L44 26Z" fill="white" />
    <path d="M37 40L38 43L41 44L38 45L37 48L36 45L33 44L36 43L37 40Z" fill="white" />
  </svg>
);
