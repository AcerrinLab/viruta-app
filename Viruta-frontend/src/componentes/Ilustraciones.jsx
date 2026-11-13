// Ilustraciones del acceso: una para quien encarga un mueble y otra para el taller.
// Son vectores propios, livianos y en los colores del sistema Warm Craft Minimal.

const MADERA = '#D4A373';
const MADERA_CLARA = '#E2C8A2';
const NOGAL = '#6E4E37';
const CREMA = '#FAF8F5';

/** Cliente: un living con su estante a medida y el celular mostrandolo en realidad aumentada. */
export function IlustracionCliente() {
  const verde = '#2B4C38';
  return (
    <svg viewBox="0 0 400 440" role="img" aria-label="Un estante a medida en un living, visto a través del celular" className="ilustracion">
      <defs>
        <linearGradient id="cl-pared" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F4F1EA" />
          <stop offset="1" stopColor="#E9E4D8" />
        </linearGradient>
        <linearGradient id="cl-luz" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.9" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="cl-veta" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={MADERA} />
          <stop offset="0.5" stopColor="#DDB083" />
          <stop offset="1" stopColor={MADERA} />
        </linearGradient>
      </defs>

      {/* Ambiente */}
      <rect x="28" y="40" width="344" height="300" rx="28" fill="url(#cl-pared)" />
      <rect x="236" y="70" width="104" height="126" rx="10" fill="#DCE7E0" />
      <path d="M236 70h104v126H236z" fill="url(#cl-luz)" />
      <path d="M288 70v126M236 133h104" stroke="#ffffff" strokeWidth="5" />
      <path d="M28 300h344v12a28 28 0 0 1-28 28H56a28 28 0 0 1-28-28z" fill="#E2D8C6" />

      {/* Planta */}
      <path d="M318 300h34l-5 -34h-24z" fill={CREMA} stroke="#D8D2C6" strokeWidth="2" />
      <path d="M335 266c-2-22-16-30-24-34 8 12 6 24 24 34zM335 266c4-26 20-34 30-36-10 14-10 28-30 36zM335 266c0-20 4-34 2-48-8 14-8 30-2 48z" fill={verde} opacity="0.85" />

      {/* Estante a medida */}
      <g>
        <rect x="70" y="96" width="132" height="204" rx="4" fill={NOGAL} opacity="0.18" transform="translate(8 6)" />
        <rect x="70" y="96" width="12" height="204" rx="3" fill="url(#cl-veta)" />
        <rect x="190" y="96" width="12" height="204" rx="3" fill="url(#cl-veta)" />
        <rect x="70" y="96" width="132" height="12" rx="3" fill={MADERA} />
        <rect x="76" y="160" width="120" height="9" rx="2" fill={MADERA} />
        <rect x="76" y="224" width="120" height="9" rx="2" fill={MADERA} />
        <rect x="70" y="288" width="132" height="12" rx="3" fill={MADERA} />
        <path d="M86 104c30 3 64-2 108 2M84 296c40-3 70 2 112-1" stroke="#B9875A" strokeWidth="1.2" fill="none" opacity="0.6" />
        {/* Libros y objetos */}
        <rect x="90" y="124" width="10" height="36" rx="2" fill={verde} />
        <rect x="102" y="130" width="9" height="30" rx="2" fill={MADERA_CLARA} />
        <rect x="113" y="120" width="11" height="40" rx="2" fill="#8FA89A" />
        <rect x="128" y="136" width="9" height="28" rx="2" fill={NOGAL} transform="rotate(-14 132 150)" />
        <circle cx="172" cy="146" r="12" fill={CREMA} stroke="#D8D2C6" strokeWidth="2" />
        <path d="M172 134c-4-10 2-16 8-18-2 6 0 12-8 18z" fill={verde} />
        <rect x="92" y="200" width="40" height="24" rx="5" fill={CREMA} stroke="#D8D2C6" strokeWidth="2" />
        <rect x="142" y="190" width="10" height="34" rx="2" fill={verde} opacity="0.75" />
        <rect x="154" y="194" width="10" height="30" rx="2" fill={MADERA_CLARA} />
        <rect x="166" y="198" width="22" height="26" rx="11" fill="#C9BBA4" />
        <rect x="96" y="252" width="80" height="36" rx="6" fill={NOGAL} opacity="0.2" />
      </g>

      {/* Celular con la vista en el espacio */}
      <g transform="rotate(-8 268 300)">
        <rect x="200" y="196" width="132" height="224" rx="24" fill="#1C1C1A" />
        <rect x="208" y="204" width="116" height="208" rx="18" fill="#EEF3EF" />
        <rect x="248" y="210" width="36" height="8" rx="4" fill="#1C1C1A" />
        {/* el mueble dentro de la pantalla */}
        <g opacity="0.95">
          <rect x="236" y="260" width="6" height="104" rx="2" fill={MADERA} />
          <rect x="290" y="260" width="6" height="104" rx="2" fill={MADERA} />
          <rect x="236" y="260" width="60" height="6" rx="2" fill={MADERA} />
          <rect x="239" y="292" width="54" height="5" rx="1" fill={MADERA} />
          <rect x="239" y="326" width="54" height="5" rx="1" fill={MADERA} />
          <rect x="236" y="358" width="60" height="6" rx="2" fill={MADERA} />
        </g>
        {/* marco de AR y cotas */}
        <path d="M226 252v-10h12M306 252v-10h-12M226 372v10h12M306 372v10h-12" stroke={verde} strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M236 392h60" stroke={verde} strokeWidth="2" strokeDasharray="4 4" />
        <rect x="248" y="384" width="36" height="16" rx="8" fill={verde} />
        <text x="266" y="395.5" textAnchor="middle" fontSize="9" fontWeight="700" fill="#ffffff" fontFamily="Plus Jakarta Sans, system-ui, sans-serif">80 cm</text>
      </g>

      {/* Destellos de vidrio */}
      <circle cx="56" cy="66" r="5" fill="#ffffff" opacity="0.9" />
      <circle cx="350" cy="48" r="3" fill="#ffffff" opacity="0.9" />
    </svg>
  );
}

/** Carpinteria: el banco de trabajo con una tabla, la escuadra, el serrucho y virutas. */
export function IlustracionTaller() {
  return (
    <svg viewBox="0 0 400 440" role="img" aria-label="Banco de trabajo de una carpintería con herramientas y virutas" className="ilustracion">
      <defs>
        <linearGradient id="tl-pared" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F7F0E5" />
          <stop offset="1" stopColor="#EADFCC" />
        </linearGradient>
        <linearGradient id="tl-tabla" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={MADERA} />
          <stop offset="0.55" stopColor="#E0B68A" />
          <stop offset="1" stopColor="#C9945F" />
        </linearGradient>
        <pattern id="tl-agujeros" width="20" height="20" patternUnits="userSpaceOnUse">
          <circle cx="10" cy="10" r="2" fill="#C9B79C" />
        </pattern>
      </defs>

      <rect x="28" y="40" width="344" height="300" rx="28" fill="url(#tl-pared)" />

      {/* Panel de herramientas */}
      <rect x="64" y="70" width="272" height="132" rx="12" fill="#E4D5BE" />
      <rect x="64" y="70" width="272" height="132" rx="12" fill="url(#tl-agujeros)" />
      {/* martillo */}
      <g transform="rotate(-12 110 130)">
        <rect x="104" y="96" width="9" height="78" rx="4" fill={MADERA} />
        <rect x="88" y="88" width="40" height="16" rx="4" fill="#4A4A46" />
      </g>
      {/* serrucho */}
      <g>
        <path d="M150 92h96l-8 70H150z" fill="#C8CCC9" />
        <path d="M150 162l6-6 6 6 6-6 6 6 6-6 6 6 6-6 6 6 6-6 6 6 6-6 6 6 6-6 6 6" stroke="#9EA3A0" strokeWidth="2" fill="none" />
        <path d="M246 92h26a10 10 0 0 1 10 10v22a10 10 0 0 1-10 10h-26z" fill={NOGAL} />
        <rect x="256" y="104" width="16" height="18" rx="6" fill="#E4D5BE" />
      </g>
      {/* escuadra */}
      <path d="M296 84v100h-8V92h-0z" fill={NOGAL} />
      <path d="M296 176h28v8h-36z" fill="#B8BDBA" />
      <path d="M300 96h4M300 110h4M300 124h4M300 138h4M300 152h4" stroke={CREMA} strokeWidth="1.5" />

      {/* Banco */}
      <rect x="44" y="236" width="312" height="22" rx="6" fill={NOGAL} />
      <rect x="44" y="236" width="312" height="6" rx="3" fill="#8A6648" />
      <rect x="66" y="258" width="20" height="104" rx="4" fill="#5A3F2C" />
      <rect x="314" y="258" width="20" height="104" rx="4" fill="#5A3F2C" />
      <rect x="66" y="320" width="268" height="12" rx="4" fill="#5A3F2C" opacity="0.85" />

      {/* Tabla sobre el banco */}
      <rect x="84" y="214" width="214" height="22" rx="3" fill="url(#tl-tabla)" />
      <path d="M92 222c40-4 90 4 140-1 22-2 40 1 60 0M96 230c50 2 100-3 190 1" stroke="#B57E4C" strokeWidth="1.2" fill="none" opacity="0.7" />
      <ellipse cx="190" cy="226" rx="7" ry="3.5" fill="none" stroke="#A86F3F" strokeWidth="1.2" opacity="0.7" />
      {/* lapiz y marca */}
      <path d="M150 214v22" stroke="#1C1C1A" strokeWidth="1.5" strokeDasharray="3 3" />
      <g transform="rotate(-24 230 206)">
        <rect x="206" y="202" width="52" height="7" rx="2" fill="#E9B949" />
        <path d="M258 202l9 3.5-9 3.5z" fill={MADERA_CLARA} />
        <rect x="200" y="202" width="7" height="7" rx="1.5" fill="#D98C7A" />
      </g>
      {/* sargento */}
      <path d="M270 200v44" stroke="#4A4A46" strokeWidth="5" strokeLinecap="round" />
      <path d="M262 204h20M262 240h20" stroke="#4A4A46" strokeWidth="6" strokeLinecap="round" />

      {/* Virutas */}
      {/* Virutas: tiras finas enruladas, como salen del cepillo */}
      <defs>
        <path id="tl-rulo" d="M0 0c10-2 22 4 22 14s-10 16-18 12-8-14 0-16 12 4 10 10-8 6-9 1" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </defs>
      <g>
        <use href="#tl-rulo" x="96" y="292" stroke={MADERA} strokeWidth="3.4" />
        <use href="#tl-rulo" x="140" y="344" stroke={MADERA_CLARA} strokeWidth="3.4" transform="rotate(30 150 354)" />
        <use href="#tl-rulo" x="236" y="290" stroke="#C9945F" strokeWidth="3" transform="rotate(-20 246 300)" />
        <use href="#tl-rulo" x="282" y="350" stroke={MADERA} strokeWidth="3.4" transform="rotate(60 292 360)" />
        <use href="#tl-rulo" x="190" y="362" stroke={MADERA_CLARA} strokeWidth="3" />
        <use href="#tl-rulo" x="104" y="196" stroke={MADERA_CLARA} strokeWidth="2.6" transform="rotate(-40 112 206)" />
        <use href="#tl-rulo" x="300" y="208" stroke={MADERA} strokeWidth="2.6" transform="rotate(15 310 216)" />
      </g>
      <path d="M28 340h344" stroke="#D8C8AE" strokeWidth="2" />

      <circle cx="350" cy="58" r="4" fill="#ffffff" opacity="0.9" />
      <circle cx="54" cy="210" r="3" fill="#ffffff" opacity="0.9" />
    </svg>
  );
}
