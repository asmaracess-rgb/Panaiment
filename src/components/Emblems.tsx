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
 * Lambang Resmi Kelurahan Panaikang
 * Replikasi presisi tinggi sesuai logo resmi yang diunggah:
 * - Kubah lingkaran merah marun (#7D1010) dengan cincin kuning emas (#E8A317) dan garis tepi coklat tua (#461708)
 * - Bintang emas besar bersudut lima di bagian atas tengah
 * - Perspektif jalan raya coklat tua meruncing ke tengah bawah bintang dengan bahu jalan emas dan 4 garis marka putus-putus emas
 * - Tangkai bulir padi kuning emas melengkung di sisi kiri
 * - Tangkai kapas hijau dengan 3 kuntum bunga kapas krem-putih & 3 daun hijau di sisi kanan
 * - Pita marun melengkung di bagian bawah bertuliskan 2 baris "KELURAHAN" dan "PANAIKANG" berwarna emas bertepi coklat tua
 */
export const EmblemKelurahanPanaikang: React.FC<{ className?: string }> = ({
  className = 'w-28 h-32',
}) => {
  const uid = React.useId().replace(/:/g, '');
  const kelurahanArcId = `kelurahanArc-${uid}`;
  const panaikangArcId = `panaikangArc-${uid}`;

  return (
    <svg
      viewBox="45 35 410 420"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Lambang Kelurahan Panaikang"
    >
      <defs>
        <path id={kelurahanArcId} d="M 106,368 Q 250,336 394,368" />
        <path id={panaikangArcId} d="M 102,414 Q 250,382 398,414" />
      </defs>

      {/* ================= 1. MAIN CIRCULAR MEDALLION DOME ================= */}
      {/* Outer Dark Brown Border */}
      <circle cx="250" cy="222" r="174" fill="#461708" />
      {/* Golden-Amber Outer Ring */}
      <circle cx="250" cy="222" r="165" fill="#E8A317" />
      {/* Inner Dark Brown Ring */}
      <circle cx="250" cy="222" r="153" fill="#461708" />
      {/* Deep Crimson-Maroon Inner Field */}
      <circle cx="250" cy="222" r="146" fill="#7D1010" />

      {/* ================= 2. CENTER PERSPECTIVE HIGHWAY / ROAD ================= */}
      {/* Outer Dark Brown Road Frame */}
      <path
        d="M 244 172 Q 250 166 256 172 L 392 326 L 108 326 Z"
        fill="#461708"
      />
      {/* Golden-Amber Left & Right Perspective Road Shoulders */}
      <path
        d="M 246 176 Q 250 172 254 176 L 384 324 L 116 324 Z"
        fill="#E8A317"
      />
      {/* Dark Chocolate Brown Road Asphalt Surface */}
      <path
        d="M 247 182 Q 250 179 253 182 L 362 326 L 138 326 Z"
        fill="#481B09"
        stroke="#461708"
        strokeWidth="5"
        strokeLinejoin="round"
      />

      {/* 4 Golden-Amber Center Dashed Lane Markings */}
      <rect x="247" y="198" width="6" height="15" rx="3" fill="#E8A317" />
      <rect x="246" y="223" width="8" height="20" rx="3.5" fill="#E8A317" />
      <rect x="244.5" y="254" width="11" height="25" rx="4" fill="#E8A317" />
      <rect x="243" y="291" width="14" height="30" rx="4.5" fill="#E8A317" />

      {/* ================= 3. TOP 5-POINTED GOLDEN STAR ================= */}
      <polygon
        points="250,72 264,106 301,109 273,133 281,169 250,150 219,169 227,133 199,109 236,106"
        fill="#E8A317"
        stroke="#461708"
        strokeWidth="7"
        strokeLinejoin="round"
      />

      {/* ================= 4. LEFT SIDE: GOLDEN PADDY STALK (TANGKAI PADI) ================= */}
      {/* Curved Stem */}
      <path
        d="M 159 306 C 122 258, 120 186, 152 132"
        stroke="#461708"
        strokeWidth="12"
        strokeLinecap="round"
      />
      <path
        d="M 159 306 C 122 258, 120 186, 152 132"
        stroke="#E8A317"
        strokeWidth="5.5"
        strokeLinecap="round"
      />

      {/* Paddy Grains (Left Outer Side, Bottom to Top) */}
      <path
        d="M 134 268 C 110 262, 104 238, 114 222 C 128 232, 136 250, 134 268 Z"
        fill="#E8A317"
        stroke="#461708"
        strokeWidth="5.5"
        strokeLinejoin="round"
      />
      <path
        d="M 129 238 C 106 228, 104 204, 116 188 C 128 200, 133 218, 129 238 Z"
        fill="#E8A317"
        stroke="#461708"
        strokeWidth="5.5"
        strokeLinejoin="round"
      />
      <path
        d="M 130 206 C 110 194, 110 170, 124 156 C 134 168, 136 188, 130 206 Z"
        fill="#E8A317"
        stroke="#461708"
        strokeWidth="5.5"
        strokeLinejoin="round"
      />
      <path
        d="M 136 176 C 120 162, 122 140, 136 128 C 144 142, 144 160, 136 176 Z"
        fill="#E8A317"
        stroke="#461708"
        strokeWidth="5.5"
        strokeLinejoin="round"
      />
      {/* Top Tip Paddy Grain */}
      <path
        d="M 145 146 C 138 128, 148 108, 166 102 C 168 120, 158 138, 145 146 Z"
        fill="#E8A317"
        stroke="#461708"
        strokeWidth="5.5"
        strokeLinejoin="round"
      />

      {/* Paddy Grains (Right Inner Side, Bottom to Top) */}
      <path
        d="M 138 272 C 154 264, 166 248, 164 230 C 148 238, 138 254, 138 272 Z"
        fill="#E8A317"
        stroke="#461708"
        strokeWidth="5.5"
        strokeLinejoin="round"
      />
      <path
        d="M 133 242 C 150 234, 162 218, 162 200 C 146 208, 135 224, 133 242 Z"
        fill="#E8A317"
        stroke="#461708"
        strokeWidth="5.5"
        strokeLinejoin="round"
      />
      <path
        d="M 134 210 C 152 202, 164 186, 164 170 C 148 178, 136 194, 134 210 Z"
        fill="#E8A317"
        stroke="#461708"
        strokeWidth="5.5"
        strokeLinejoin="round"
      />
      <path
        d="M 140 180 C 156 172, 168 158, 168 142 C 152 150, 142 164, 140 180 Z"
        fill="#E8A317"
        stroke="#461708"
        strokeWidth="5.5"
        strokeLinejoin="round"
      />

      {/* ================= 5. RIGHT SIDE: COTTON BRANCH & LEAVES (KAPAS) ================= */}
      {/* Top Cotton Blossom (3-lobed cream cloud) */}
      <path
        d="M 322 162 C 308 158, 306 138, 320 132 C 324 114, 348 112, 356 128 C 372 132, 372 154, 356 160 C 346 166, 332 166, 322 162 Z"
        fill="#FAF0D7"
        stroke="#461708"
        strokeWidth="6"
        strokeLinejoin="round"
      />

      {/* Middle-Left Cotton Blossom */}
      <path
        d="M 318 220 C 306 216, 306 198, 318 192 C 322 178, 342 178, 348 192 C 358 198, 356 216, 342 220 C 334 224, 324 224, 318 220 Z"
        fill="#FAF0D7"
        stroke="#461708"
        strokeWidth="6"
        strokeLinejoin="round"
      />

      {/* Middle-Right Cotton Blossom */}
      <path
        d="M 358 214 C 348 208, 350 190, 362 184 C 368 172, 386 174, 390 188 C 398 196, 394 214, 380 216 C 372 218, 364 218, 358 214 Z"
        fill="#FAF0D7"
        stroke="#461708"
        strokeWidth="6"
        strokeLinejoin="round"
      />

      {/* Green Leaves on Lower Cotton Stem */}
      <path
        d="M 350 264 C 332 256, 326 240, 334 230 C 346 236, 354 248, 350 264 Z"
        fill="#5B8427"
        stroke="#461708"
        strokeWidth="5.5"
        strokeLinejoin="round"
      />
      <path
        d="M 356 248 C 368 234, 382 228, 392 234 C 386 246, 372 252, 356 248 Z"
        fill="#5B8427"
        stroke="#461708"
        strokeWidth="5.5"
        strokeLinejoin="round"
      />
      <path
        d="M 350 280 C 364 264, 382 258, 394 264 C 386 278, 368 286, 350 280 Z"
        fill="#5B8427"
        stroke="#461708"
        strokeWidth="5.5"
        strokeLinejoin="round"
      />

      {/* Main Cotton Green Stem & Calyxes */}
      <path
        d="M 323 308 C 344 276, 356 226, 344 156"
        stroke="#461708"
        strokeWidth="11"
        strokeLinecap="round"
      />
      <path
        d="M 323 308 C 344 276, 356 226, 344 156"
        stroke="#5B8427"
        strokeWidth="5.5"
        strokeLinecap="round"
      />
      <path
        d="M 349 232 L 336 214"
        stroke="#461708"
        strokeWidth="9"
        strokeLinecap="round"
      />
      <path
        d="M 349 232 L 336 214"
        stroke="#5B8427"
        strokeWidth="4.5"
        strokeLinecap="round"
      />
      <path
        d="M 351 224 L 368 206"
        stroke="#461708"
        strokeWidth="9"
        strokeLinecap="round"
      />
      <path
        d="M 351 224 L 368 206"
        stroke="#5B8427"
        strokeWidth="4.5"
        strokeLinecap="round"
      />

      {/* ================= 6. BOTTOM ARCHED BANNER: KELURAHAN PANAIKANG ================= */}
      <path
        d="M 94 342 C 90 318, 175 300, 250 300 C 325 300, 410 318, 406 342 L 412 394 C 414 420, 394 434, 368 431 C 310 423, 190 423, 132 431 C 106 434, 86 420, 88 394 Z"
        fill="#7D1010"
        stroke="#461708"
        strokeWidth="8.5"
        strokeLinejoin="round"
      />

      {/* Line 1: KELURAHAN */}
      <text
        fill="#E8A317"
        stroke="#461708"
        strokeWidth="9"
        paintOrder="stroke fill"
        strokeLinejoin="round"
        fontSize="36"
        fontWeight="900"
        letterSpacing="2"
      >
        <textPath href={`#${kelurahanArcId}`} startOffset="50%" textAnchor="middle">
          KELURAHAN
        </textPath>
      </text>

      {/* Line 2: PANAIKANG */}
      <text
        fill="#E8A317"
        stroke="#461708"
        strokeWidth="9"
        paintOrder="stroke fill"
        strokeLinejoin="round"
        fontSize="38"
        fontWeight="900"
        letterSpacing="2"
      >
        <textPath href={`#${panaikangArcId}`} startOffset="50%" textAnchor="middle">
          PANAIKANG
        </textPath>
      </text>
    </svg>
  );
};

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
