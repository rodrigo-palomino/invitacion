import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mail, Heart, Camera, MapPin, Navigation, RotateCcw, Volume2, VolumeX, Shirt, Baby, Sparkles as SparklesIcon } from 'lucide-react';

/* ============================================================
   CONFIGURACIÓN (edita aquí tus datos)
   ============================================================ */
const INTRO_TEXT_1 = 'Damos gracias a Dios por este regalo.';
const INTRO_TEXT_2 = 'Una vida que crece dentro de mami y se alimenta...';

const NAMES = 'Gianmarco & Yanina';
const EVENT_DAY = 'Domingo';
const EVENT_NUM = '08';
const EVENT_MONTH = 'Noviembre 2026';
const EVENT_TIME = '3:30 PM';
const PLACE_NAME = 'Dirección';
const PLACE_ADDRESS = 'Loma del Pilar 322, Surco';
const MAP_URL = 'https://maps.app.goo.gl/QFQttud35NGKKUJY6';
const TARGET_DATE = new Date('2026-11-08T00:00:00').getTime();

/* Música de fondo: sube tu archivo a public/musica.mp3 (si no existe, el botón no aparece) */
const MUSIC_SRC = '/musica.mp3';
const MUSIC_VOLUME = 0.55;

/* Ajustes de las ilustraciones nuevas */
const FRAME_SIZE = 60;         // ancho del marco de la foto (en cqw)
const FRAME_INSET = '21%';     // qué tanto se mete la foto dentro del marco (sube si el hueco es más chico)
const PEEK_FACES_LEFT = true;  // true si tu "oso-asomado.png" mira hacia la izquierda

// Escenas: 0 hero · 1 mensaje · 2 niña · 3 niño · 4 invita · 5 detalles · 6 vestimenta · 7 final
const DURATIONS = [6, 7.5, 5.5, 5.5, 7.5, 9, 10, 0];
const LAST = DURATIONS.length - 1;

const FLAP_TRIANGLE = 'polygon(0 0, 50% 100%, 100% 0)';
const ASSETS = [
  '/oso-nino.png', '/oso-nina.png', '/globos.png', '/pajaro-azul.png', '/pajaro-rosa.png',
  '/foto-papas.jpg', '/polo-rosa.png', '/polo-celeste.png', '/sello.png', '/fondo-acuarela.jpg',
  '/globo-rosa.png', '/globo-durazno.png', '/globo-nude.png', '/globo-celeste.png',
  '/oso-nina-durmiendo.png', '/oso-nino-durmiendo.png', '/oso-asomado.png',
  '/marco-foto.png', '/zapatitos.png', '/estrella-1.png', '/estrella-2.png',
];

const hideOnError = (e) => {
  e.currentTarget.style.display = 'none';
};
const D = (s) => ({ animationDelay: `${s}s` });

/* ============================================================
   ¿EXISTE LA IMAGEN? (si no la subiste todavía, se usa un respaldo)
   ============================================================ */
const imgCache = {};
const probe = (src, cb) => {
  if (src in imgCache) {
    cb && cb(imgCache[src]);
    return;
  }
  const img = new Image();
  img.onload = () => { imgCache[src] = true; cb && cb(true); };
  img.onerror = () => { imgCache[src] = false; cb && cb(false); };
  img.src = src;
};
const useImageOk = (src) => {
  const [ok, setOk] = useState(imgCache[src] === true);
  useEffect(() => {
    let alive = true;
    probe(src, (v) => alive && setOk(v));
    return () => { alive = false; };
  }, [src]);
  return ok;
};

/* ============================================================
   PIEZAS REUTILIZABLES
   ============================================================ */

/* Texto que aparece palabra por palabra */
const Words = ({ text, start = 0, step = 0.1, className = '' }) => (
  <span className={className}>
    {text.split(' ').map((w, i) => (
      <React.Fragment key={i}>
        <span className="word" style={D(start + i * step)}>{w}</span>{' '}
      </React.Fragment>
    ))}
  </span>
);

/* Osito que entra desde el borde y luego se mece */
const Bear = ({ src, alt, enter = 'right', style, delay = 0.4, flip = false }) => (
  <div className={`absolute bear-wrap bear-in-${enter}`} style={{ ...style, animationDelay: `${delay}s` }}>
    <div style={{ transform: flip ? 'scaleX(-1)' : undefined }}>
      <img src={src} alt={alt} draggable={false} className="bear-sway block w-full h-auto" onError={hideOnError} />
    </div>
  </div>
);

/* Osito asomándose por el borde (usa oso-asomado.png si existe) */
const PeekBear = ({ side = 'right', fallback, style, delay }) => {
  const ok = useImageOk('/oso-asomado.png');
  const flip = ok ? (side === 'left') === PEEK_FACES_LEFT : false;
  return (
    <Bear
      src={ok ? '/oso-asomado.png' : fallback}
      alt="Osito"
      enter={side}
      delay={delay}
      flip={flip}
      style={style}
    />
  );
};

/* Nubes con borde ondulado y dos capas que se mueven distinto (paralaje) */
const bumps = (offset, fill) => (
  <g fill={fill}>
    {Array.from({ length: 11 }).map((_, i) => (
      <circle key={i} cx={i * 50 + offset} cy={i % 2 ? 42 : 36} r={i % 2 ? 30 : 36} />
    ))}
    <rect x="-40" y="46" width="500" height="40" />
  </g>
);

const CloudBand = ({ position = 'bottom' }) => {
  const top = position === 'top';
  return (
    <div
      aria-hidden="true"
      className={`absolute inset-x-0 pointer-events-none ${top ? 'top-0' : 'bottom-0'}`}
      style={{ transform: top ? 'scaleY(-1)' : undefined }}
    >
      <svg
        viewBox="0 0 400 70"
        className="absolute cloud-back block h-auto"
        style={{ left: '-5%', width: '110%', top: '-9%' }}
      >
        {bumps(25, '#fdeef2')}
      </svg>
      <svg
        viewBox="0 0 400 70"
        className="relative cloud-front block h-auto"
        style={{ left: '-3%', width: '106%' }}
      >
        {bumps(0, '#ffffff')}
      </svg>
    </div>
  );
};

/* Estrellitas que titilan (usa estrella-1/2.png si las tienes) */
const SPARKS = [
  [8, 11, '#f7a1bb', 4], [88, 9, '#8cc3e6', 5], [20, 36, '#8cc3e6', 3.2], [82, 44, '#f7a1bb', 3.8],
  [12, 64, '#f7a1bb', 4.4], [90, 70, '#8cc3e6', 3.4], [50, 22, '#ffffff', 3.6], [66, 58, '#ffffff', 3],
];
const Sparkles = () => {
  const s1 = useImageOk('/estrella-1.png');
  const s2 = useImageOk('/estrella-2.png');
  return (
    <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
      {SPARKS.map(([x, y, c, s], i) => {
        const src = i % 2 === 0 ? (s1 ? '/estrella-1.png' : null) : (s2 ? '/estrella-2.png' : null);
        const pos = { left: `${x}%`, top: `${y}%`, animationDelay: `${i * -0.7}s` };
        return src ? (
          <img key={i} src={src} alt="" className="absolute twinkle" style={{ ...pos, width: `${s * 1.7}cqw`, height: 'auto' }} />
        ) : (
          <svg key={i} viewBox="0 0 24 24" className="absolute twinkle" style={{ ...pos, width: `${s}cqw`, height: `${s}cqw`, fill: c }}>
            <path d="M12 0l2.6 9.4L24 12l-9.4 2.6L12 24l-2.6-9.4L0 12l9.4-2.6z" />
          </svg>
        );
      })}
    </div>
  );
};

const BOKEH = [[-10, 6, 60], [68, 16, 52], [18, 44, 70], [78, 56, 58], [2, 76, 54], [58, 84, 66]];

/* Globos sueltos: cada uno sube y se mece por su cuenta (y reacciona al toque) */
const LOOSE = [
  { src: '/globo-rosa.png', left: 2, bottom: 6, w: 23, delay: 0.3, dur: 3.8 },
  { src: '/globo-celeste.png', left: 26, bottom: 16, w: 22, delay: 0.5, dur: 4.4 },
  { src: '/globo-durazno.png', left: 50, bottom: 10, w: 23, delay: 0.7, dur: 4.1 },
  { src: '/globo-nude.png', left: 73, bottom: 3, w: 22, delay: 0.9, dur: 3.6 },
];

const Balloons = ({ box, rack, delay = 0, interactive = false }) => {
  const loose = useImageOk('/globo-rosa.png');
  const [taps, setTaps] = useState({});

  if (!loose) {
    return (
      <div className="absolute balloons-in" style={{ ...rack, animationDelay: `${delay}s` }}>
        <img src="/globos.png" alt="" draggable={false} className="block w-full h-auto balloons-sway" onError={hideOnError} />
      </div>
    );
  }
  return (
    <div className="absolute" style={{ ...box, pointerEvents: 'none' }}>
      {LOOSE.map((b, i) => (
        <div
          key={b.src}
          className="absolute balloons-in"
          style={{
            left: `${b.left}%`,
            bottom: `${b.bottom}cqw`,
            width: `${b.w}cqw`,
            animationDelay: `${delay + b.delay}s`,
            pointerEvents: interactive ? 'auto' : 'none',
            cursor: interactive ? 'pointer' : 'default',
          }}
          onClick={interactive ? () => setTaps((t) => ({ ...t, [i]: (t[i] || 0) + 1 })) : undefined}
        >
          <div className="balloon-sway-i" style={{ animationDuration: `${b.dur}s` }}>
            <img
              key={taps[i] || 0}
              src={b.src}
              alt=""
              draggable={false}
              className={`block w-full h-auto ${taps[i] ? 'balloon-wiggle' : ''}`}
              onError={hideOnError}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

/* Sello de cera dibujado en SVG (por si no tienes sello.png) */
const SEAL_PATH = (() => {
  const pts = [];
  const n = 28;
  for (let i = 0; i < n * 2; i++) {
    const a = (i / (n * 2)) * Math.PI * 2;
    const r = i % 2 === 0 ? 47 : 41 + ((i * 7) % 5) * 0.8;
    pts.push(`${(50 + Math.cos(a) * r).toFixed(1)},${(50 + Math.sin(a) * r).toFixed(1)}`);
  }
  return `M${pts.join('L')}Z`;
})();

const WaxSeal = () => (
  <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full" style={{ filter: 'drop-shadow(0 1.2cqw 1.6cqw rgba(120,30,60,.35))' }}>
    <defs>
      <radialGradient id="waxG" cx="35%" cy="30%" r="80%">
        <stop offset="0" stopColor="#f9a8c4" />
        <stop offset=".6" stopColor="#e5628f" />
        <stop offset="1" stopColor="#c23f6c" />
      </radialGradient>
    </defs>
    <path d={SEAL_PATH} fill="url(#waxG)" />
    <circle cx="50" cy="50" r="30" fill="none" stroke="rgba(255,255,255,.35)" strokeWidth="1.5" />
    <path d="M50 67C29 52 33 35 44 35c4 0 6 3 6 6 0-3 2-6 6-6 11 0 15 17-6 32z" fill="#c23f6c" stroke="rgba(255,255,255,.55)" strokeWidth="1.2" />
  </svg>
);

/* Confeti suave (solo en la escena final) */
const CONFETTI = Array.from({ length: 30 }, (_, i) => {
  const r = (n) => {
    const x = Math.sin(i * 12.9898 + n * 78.233) * 43758.5453;
    return x - Math.floor(x);
  };
  const colors = ['#f7a1bb', '#8cc3e6', '#f6c77b', '#f48fb1', '#a9d4ef'];
  return {
    left: r(1) * 100,
    delay: 0.3 + r(2) * 2.2,
    dur: 3.6 + r(3) * 2.6,
    dx: (r(4) - 0.5) * 30,
    rot: 360 + r(5) * 540,
    size: 1.6 + r(6) * 1.6,
    color: colors[i % colors.length],
    round: i % 3 === 0,
  };
});
const Confetti = () => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
    {CONFETTI.map((p, i) => (
      <span
        key={i}
        className="confetti"
        style={{
          left: `${p.left}%`,
          width: `${p.size}cqw`,
          height: `${p.round ? p.size : p.size * 1.6}cqw`,
          background: p.color,
          borderRadius: p.round ? '50%' : '1px',
          animationDelay: `${p.delay}s`,
          animationDuration: `${p.dur}s`,
          '--dx': `${p.dx}cqw`,
          '--rot': `${p.rot}deg`,
        }}
      />
    ))}
  </div>
);

/* ---------- Destello de estrellitas desde un punto ---------- */
const STAR_PATH = 'M12 0l2.6 9.4L24 12l-9.4 2.6L12 24l-2.6-9.4L0 12l9.4-2.6z';
const HEART_PATH = 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z';
const BURST_ANGLES = Array.from({ length: 8 }, (_, i) => (i / 8) * Math.PI * 2);

const Burst = ({ style, delay = 0, radius = 16, size = 3, colors = ['#f7a1bb', '#8cc3e6', '#f6c77b'] }) => (
  <div className="absolute pointer-events-none" style={style} aria-hidden="true">
    {BURST_ANGLES.map((a, i) => (
      <svg
        key={i}
        viewBox="0 0 24 24"
        className="burst-item"
        style={{
          width: `${size}cqw`,
          height: `${size}cqw`,
          marginLeft: `${-size / 2}cqw`,
          marginTop: `${-size / 2}cqw`,
          fill: colors[i % colors.length],
          animationDelay: `${delay + (i % 2) * 0.06}s`,
          '--bx': `${(Math.cos(a) * radius).toFixed(1)}cqw`,
          '--by': `${(Math.sin(a) * radius).toFixed(1)}cqw`,
        }}
      >
        <path d={STAR_PATH} />
      </svg>
    ))}
  </div>
);

/* ---------- Ambiente continuo: nubecitas que cruzan y corazones que suben ---------- */
const DRIFT_CLOUDS = [
  { top: 14, w: 30, dur: 75, delay: -12, op: 0.75 },
  { top: 40, w: 38, dur: 100, delay: -55, op: 0.55 },
  { top: 66, w: 28, dur: 85, delay: -30, op: 0.7 },
];
const RISERS = [
  { left: 8, size: 3.6, dur: 17, delay: -3, sx: 6, c: '#f7a1bb' },
  { left: 24, size: 2.8, dur: 21, delay: -11, sx: -5, c: '#8cc3e6' },
  { left: 41, size: 4.2, dur: 19, delay: -7, sx: 7, c: '#f9b0c6' },
  { left: 58, size: 3, dur: 23, delay: -16, sx: -6, c: '#a9d4ef' },
  { left: 73, size: 3.8, dur: 18, delay: -1, sx: 5, c: '#f7a1bb' },
  { left: 88, size: 2.6, dur: 22, delay: -13, sx: -4, c: '#8cc3e6' },
];
const Ambient = () => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden z-[5]" aria-hidden="true">
    {DRIFT_CLOUDS.map((c, i) => (
      <svg
        key={i}
        viewBox="0 0 120 50"
        className="drift-cloud"
        style={{ top: `${c.top}%`, width: `${c.w}cqw`, opacity: c.op, animationDuration: `${c.dur}s`, animationDelay: `${c.delay}s` }}
      >
        <g fill="#fff">
          <circle cx="30" cy="30" r="18" />
          <circle cx="56" cy="22" r="22" />
          <circle cx="84" cy="30" r="17" />
          <rect x="24" y="30" width="64" height="18" rx="9" />
        </g>
      </svg>
    ))}
    {RISERS.map((h, i) => (
      <svg
        key={i}
        viewBox="0 0 24 24"
        className="riser"
        style={{ left: `${h.left}%`, width: `${h.size}cqw`, height: `${h.size}cqw`, fill: h.c, animationDuration: `${h.dur}s`, animationDelay: `${h.delay}s`, '--sx': `${h.sx}cqw` }}
      >
        <path d={HEART_PATH} />
      </svg>
    ))}
  </div>
);

/* ---------- Corazones que salen del sobre al abrirse ---------- */
const PUFFS = Array.from({ length: 12 }, (_, i) => {
  const a = ((-70 + (i / 11) * 140) * Math.PI) / 180;
  const d = 32 + ((i * 37) % 20);
  return {
    hx: Math.sin(a) * d * 0.8,
    hy: -Math.cos(a) * d,
    rot: (i % 2 ? 1 : -1) * (20 + ((i * 13) % 40)),
    size: 4 + ((i * 5) % 4),
    c: ['#f48fb1', '#7fb6e0', '#f7a1bb', '#f6c77b'][i % 4],
    delay: 0.55 + (i % 4) * 0.08,
  };
});
const HeartPuff = () => (
  <div className="absolute z-[55] pointer-events-none" style={{ left: '50%', top: '52%' }} aria-hidden="true">
    {PUFFS.map((p, i) => (
      <svg
        key={i}
        viewBox="0 0 24 24"
        className="heart-puff"
        style={{
          width: `${p.size}cqw`,
          height: `${p.size}cqw`,
          marginLeft: `${-p.size / 2}cqw`,
          fill: p.c,
          animationDelay: `${p.delay}s`,
          '--hx': `${p.hx.toFixed(1)}cqw`,
          '--hy': `${p.hy.toFixed(1)}cqw`,
          '--hr': `${p.rot}deg`,
        }}
      >
        <path d={HEART_PATH} />
      </svg>
    ))}
  </div>
);

/* ============================================================
   CONTADOR
   ============================================================ */
const getTimeLeft = () => {
  const d = Math.max(0, TARGET_DATE - Date.now());
  return {
    days: Math.floor(d / 86400000),
    hours: Math.floor((d % 86400000) / 3600000),
    minutes: Math.floor((d % 3600000) / 60000),
    seconds: Math.floor((d % 60000) / 1000),
  };
};

const Countdown = ({ delay = 0 }) => {
  const [t, setT] = useState(getTimeLeft);
  useEffect(() => {
    const id = setInterval(() => setT(getTimeLeft()), 1000);
    return () => clearInterval(id);
  }, []);
  const items = [['Días', t.days], ['Hrs', t.hours], ['Min', t.minutes], ['Seg', t.seconds]];
  return (
    <div className="flex justify-center" style={{ gap: '3cqw' }}>
      {items.map(([label, value], i) => (
        <div key={label} className="cd-chip pop" style={D(delay + i * 0.12)}>
          <span key={value} className="cd-num tick">{String(value).padStart(2, '0')}</span>
          <span className="cd-lab">{label}</span>
        </div>
      ))}
    </div>
  );
};

/* ============================================================
   ESCENAS DE LA HISTORIA
   ============================================================ */

/* 0 · ¿Niño o Niña? */
const SceneHero = () => (
  <>
    <div className="absolute inset-x-0 flex flex-col items-center text-center" style={{ top: '7cqh' }}>
      <div className="pop" style={D(0.2)}><span className="f-script g-blue s-hero">¿Niño</span></div>
      <div className="rise f-script s-o" style={D(0.8)}>o</div>
      <div className="pop" style={D(1)}><span className="f-script g-pink s-hero">Niña?</span></div>
    </div>

    <Balloons
      delay={0.2}
      box={{ left: '8cqw', width: '84cqw', height: '64cqw', bottom: '34cqw' }}
      rack={{ left: '13cqw', width: '74cqw', bottom: '26cqw' }}
    />

    <Bear src="/oso-nina.png" alt="Oso niña" enter="up" delay={0.5} style={{ left: '3cqw', bottom: '7cqw', width: '40cqw' }} />
    <Bear src="/oso-nino.png" alt="Oso niño" enter="up" delay={0.8} style={{ right: '3cqw', bottom: '7cqw', width: '40cqw' }} />
    <CloudBand position="bottom" />
  </>
);

/* 1 · Mensaje (con zapatitos que se balancean) */
const SceneMessage = () => {
  const shoes = useImageOk('/zapatitos.png');
  return (
    <>
      <CloudBand position="top" />
      {shoes && (
        <div className="absolute rise" style={{ ...D(0.2), left: '50%', top: '3cqw', width: '30cqw', marginLeft: '-15cqw' }}>
          <img src="/zapatitos.png" alt="" draggable={false} className="block w-full h-auto shoes-swing" onError={hideOnError} />
        </div>
      )}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center text-center"
        style={{ padding: shoes ? '44cqw 9cqw 18cqw' : '18cqw 9cqw' }}
      >
        {!shoes && (
          <div className="pop" style={D(0.2)}>
            <Heart className="heart-beat" style={{ width: '14cqw', height: '14cqw', color: '#f48fb1' }} fill="currentColor" />
          </div>
        )}
        <p className="f-script c-rose s-h2" style={{ marginTop: shoes ? 0 : '6cqw' }}>
          <Words text={INTRO_TEXT_1} start={0.7} step={0.13} />
        </p>
        <p className="f-body c-body s-body" style={{ marginTop: '6cqw' }}>
          <Words text={INTRO_TEXT_2} start={2.3} step={0.13} />
        </p>
      </div>
      <Bear src="/oso-nino.png" alt="Oso niño" enter="left" delay={3.2} style={{ left: '-3cqw', bottom: '4cqw', width: '30cqw' }} />
      <CloudBand position="bottom" />
    </>
  );
};

/* 2 y 3 · "Niña" / "Niño" con osito dormido */
const SceneGuess = ({ lead, word, gradient, tint, src, fallback }) => {
  const ok = useImageOk(src);
  return (
    <>
      <div className="absolute inset-0" style={{ background: tint }} />
      <CloudBand position="top" />
      <div className="absolute inset-x-0 flex flex-col items-center text-center" style={{ top: '27cqw', padding: '0 10cqw' }}>
        <p className="f-body c-body s-body" style={{ lineHeight: 1.3 }}>
          <Words text={lead} start={0.4} step={0.12} />
        </p>
        <div className="pop relative" style={{ ...D(1.4), marginTop: '3cqw' }}>
          <span className={`f-script ${gradient} s-hero`}>{word}</span>
          <Burst style={{ left: '50%', top: '55%' }} delay={1.9} radius={20} size={4} />
        </div>
      </div>

      <div
        className="absolute bear-in-up"
        style={{ ...D(0.5), left: '50%', bottom: '12cqw', width: ok ? '78cqw' : '44cqw', marginLeft: ok ? '-39cqw' : '-22cqw' }}
      >
        <img src={ok ? src : fallback} alt="" draggable={false} className={`block w-full h-auto ${ok ? 'breathe' : 'float-y'}`} onError={hideOnError} />
        {ok && (
          <div className="absolute" style={{ right: '8%', top: '4%' }} aria-hidden="true">
            <span className="zzz f-script" style={D(1.2)}>z</span>
            <span className="zzz f-script" style={D(2.0)}>z</span>
            <span className="zzz f-script" style={D(2.8)}>z</span>
          </div>
        )}
      </div>
      <CloudBand position="bottom" />
    </>
  );
};

/* 4 · Quién invita (foto con marco) */
const SceneHost = () => {
  const frame = useImageOk('/marco-foto.png');
  const size = frame ? FRAME_SIZE : 50;
  return (
    <>
      <CloudBand position="top" />
      <div
        className="absolute inset-0 flex flex-col items-center justify-center text-center"
        style={{ padding: '16cqw 8cqw 18cqw' }}
      >
        <div className="pop relative" style={{ ...D(0.2), width: `${size}cqw`, height: `${size}cqw` }}>
          {!frame && (
            <div
              className="absolute rounded-full"
              style={{
                inset: '-9cqw',
                background: 'radial-gradient(circle, rgba(247,161,187,.55) 0%, rgba(140,195,230,.35) 55%, rgba(255,255,255,0) 72%)',
              }}
            />
          )}
          <div
            className="absolute rounded-full overflow-hidden bg-[#f9f3ef] flex flex-col items-center justify-center"
            style={
              frame
                ? { inset: FRAME_INSET }
                : { inset: 0, border: '2.4cqw solid #fff', boxShadow: '0 2cqw 6cqw rgba(140,115,101,.28)' }
            }
          >
            <div className="absolute inset-0 flex flex-col items-center justify-center text-[#cbb6a9] text-center px-4">
              <Camera style={{ width: '10cqw', height: '10cqw', opacity: 0.5 }} />
              <span style={{ fontSize: '3cqw', marginTop: '1cqw' }}>foto-papas.jpg</span>
            </div>
            <img src="/foto-papas.jpg" alt="Gianmarco y Yanina" className="relative w-full h-full object-cover" onError={hideOnError} />
          </div>
          {frame && (
            <img src="/marco-foto.png" alt="" draggable={false} className="absolute inset-0 w-full h-full object-contain pointer-events-none float-y" onError={hideOnError} />
          )}
          {!frame && (
            <>
              <Heart className="absolute heart-beat" style={{ right: '-3cqw', bottom: '0', width: '10cqw', height: '10cqw', color: '#f48fb1' }} fill="currentColor" />
              <Heart className="absolute float-y" style={{ left: '-3cqw', top: '4cqw', width: '8cqw', height: '8cqw', color: '#7fb6e0' }} fill="currentColor" />
            </>
          )}
          <div className="absolute orbit pointer-events-none" style={{ inset: '-7cqw' }} aria-hidden="true">
            {[['50%', '0%', '#f7a1bb'], ['100%', '50%', '#8cc3e6'], ['50%', '100%', '#f6c77b'], ['0%', '50%', '#f9b0c6']].map(([l, t, c], i) => (
              <svg key={i} viewBox="0 0 24 24" className="absolute" style={{ left: l, top: t, width: '4.4cqw', height: '4.4cqw', marginLeft: '-2.2cqw', marginTop: '-2.2cqw', fill: c }}>
                <path d={STAR_PATH} />
              </svg>
            ))}
          </div>
        </div>

        <p className="f-script c-brown s-h3" style={{ marginTop: frame ? '3cqw' : '7cqw' }}>
          <Words text={NAMES} start={0.9} step={0.2} />
        </p>
        <p className="f-body c-body s-small-text" style={{ marginTop: '3cqw' }}>
          <Words text="tienen el gusto de invitarte a su" start={1.7} step={0.1} />
        </p>
        <div className="pop" style={{ ...D(2.8), marginTop: '3cqw' }}>
          <span className="f-script g-blue s-h1" style={{ display: 'inline-block', lineHeight: 1.05 }}>
            Revelación<br />de Género
          </span>
        </div>
      </div>
      <Bear src="/oso-nina.png" alt="Oso niña" enter="right" delay={3.4} style={{ right: '-3cqw', bottom: '4cqw', width: '28cqw' }} />
      <CloudBand position="bottom" />
    </>
  );
};

/* 5 · Fecha, hora y lugar */
const SceneDetails = () => (
  <>
    <CloudBand position="top" />
    <PeekBear side="right" fallback="/oso-nina.png" delay={0.3} style={{ right: '-4cqw', top: '10cqw', width: '34cqw' }} />

    <div
      className="absolute inset-0 flex flex-col items-center justify-center text-center"
      style={{ padding: '34cqw 7cqw 26cqw' }}
    >
      <p className="f-body c-body s-small-text rise" style={D(0.3)}>Acompáñanos a saber si es</p>
      <div className="pop" style={{ ...D(0.7), marginTop: '1cqw' }}>
        <span className="f-script g-pink s-h1" style={{ display: 'inline-block' }}>
          Niña <span className="f-script c-brown" style={{ fontSize: '0.7em' }}>o</span> <span className="g-blue" style={{ display: 'inline-block' }}>Niño</span>
        </span>
      </div>

      <div className="rise flex items-center justify-center" style={{ ...D(1.5), gap: '3.5cqw', marginTop: '7cqw' }}>
        <div className="f-body c-body s-small-text" style={{ lineHeight: 1.25 }}>
          {EVENT_DAY}<br />{EVENT_MONTH.split(' ')[0]}
        </div>
        <div className="relative">
          <div className="f-body g-rose s-date">{EVENT_NUM}</div>
          <Burst style={{ left: '50%', top: '50%' }} delay={2} radius={18} size={3.4} />
        </div>
        <div className="f-body c-body s-small-text" style={{ lineHeight: 1.25 }}>
          Hora:<br />{EVENT_TIME}
        </div>
      </div>
      <p className="f-body c-brown s-small-text rise" style={{ ...D(1.9), marginTop: '1cqw' }}>{EVENT_MONTH.split(' ')[1]}</p>

      <div className="rise flex flex-col items-center" style={{ ...D(2.6), marginTop: '8cqw' }}>
        <MapPin className="float-y" style={{ width: '9cqw', height: '9cqw', color: '#e57f9a' }} fill="#fbd0dc" />
        <p className="f-body c-body s-body" style={{ marginTop: '1.5cqw' }}>{PLACE_NAME}</p>
        <p className="f-body c-brown s-small-text" style={{ marginTop: '1cqw', textTransform: 'none' }}>{PLACE_ADDRESS}</p>
      </div>
    </div>

    <Bear src="/oso-nino.png" alt="Oso niño" enter="left" delay={0.7} style={{ left: '-3cqw', bottom: '4cqw', width: '30cqw' }} />
    <CloudBand position="bottom" />
  </>
);

/* 6 · Código de vestimenta: duelo Team Niña VS Team Niño */
const TeamBlock = ({ side, word, sub, bring, ink, Icon, shirt, shirtAlt, tilt, deep, delay, style }) => {
  const ok = useImageOk(shirt);
  const left = side === 'left';

  const shirtEl = (
    <div
      className={left ? 'shirt-in-left' : 'shirt-in-right'}
      style={{ ...D(delay), width: 'min(38cqw, 17cqh)', flexShrink: 0 }}
    >
      <div className="float-y" style={{ animationDelay: `${delay + 1}s` }}>
        {ok ? (
          <img
            src={shirt}
            alt={shirtAlt}
            draggable={false}
            className="block w-full h-auto"
            style={{ transform: `rotate(${tilt}deg)`, filter: 'drop-shadow(0 2cqw 3cqw rgba(0,0,0,.22))' }}
          />
        ) : (
          <Shirt style={{ width: '100%', height: 'auto', color: deep, transform: `rotate(${tilt}deg)` }} strokeWidth={1.4} />
        )}
      </div>
    </div>
  );

  const textEl = (
    <div className="flex flex-col items-center text-center" style={{ flex: 1, minWidth: 0 }}>
      <span className="f-body vs-label rise" style={{ ...D(delay + 0.3), color: deep }}>Team</span>
      <span
        className="f-script vs-word pop"
        style={{ ...D(delay + 0.4), color: '#fff', textShadow: `0 .9cqw 0 ${deep}, 0 2cqw 4cqw rgba(0,0,0,.18)` }}
      >
        {word}
      </span>
      <span className="vs-pill rise" style={{ ...D(delay + 1), color: deep }}>{sub}</span>
      <span className="vs-bring rise" style={{ ...D(delay + 1.3), color: ink }}>
        <Icon style={{ width: '4.4cqw', height: '4.4cqw', flexShrink: 0 }} />
        <span>{bring}</span>
      </span>
    </div>
  );

  return (
    <div className="absolute flex items-center" style={{ left: '4cqw', right: '4cqw', gap: '2cqw', ...style }}>
      {left ? <>{shirtEl}{textEl}</> : <>{textEl}{shirtEl}</>}
    </div>
  );
};

const SceneDress = () => (
  <>
    <div className="absolute inset-0 shake" style={D(2.6)}>
      {/* Dos mitades que entran desde los lados y se encuentran en diagonal */}
      <div
        className="absolute inset-0 panel-in-left"
        style={{ ...D(0.05), background: 'linear-gradient(160deg,#fde6ee 0%,#f9b0c6 100%)', clipPath: 'polygon(0 0, 100% 0, 100% 46%, 0 58%)' }}
      />
      <div
        className="absolute inset-0 panel-in-right"
        style={{ ...D(0.2), background: 'linear-gradient(20deg,#d6ecf9 0%,#8cc3e6 100%)', clipPath: 'polygon(0 58%, 100% 46%, 100% 100%, 0 100%)' }}
      />

      {/* Línea blanca que se dibuja sobre la unión */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none slash-wipe"
        style={{ ...D(0.9), filter: 'drop-shadow(0 0 1.5cqw rgba(255,255,255,.9))' }}
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <line x1="-2" y1="58.24" x2="102" y2="45.76" stroke="#fff" strokeWidth="6" vectorEffect="non-scaling-stroke" strokeLinecap="round" />
      </svg>

      <CloudBand position="top" />
      <CloudBand position="bottom" />

      <p
        className="absolute inset-x-0 text-center f-script s-h3 rise"
        style={{ ...D(0.5), top: '10.5cqh', color: '#9c3a5e' }}
      >
        ¿De qué equipo eres?
      </p>

      <TeamBlock
        side="left"
        word="Niña"
        sub="Viste rosa o fucsia"
        bring="Traer artículos de limpieza para bebés"
        ink="#a83a63"
        Icon={SparklesIcon}
        shirt="/polo-rosa.png"
        shirtAlt="Polo rosa"
        tilt={-6}
        deep="#c9507a"
        delay={0.9}
        style={{ top: '17cqh', height: '27cqh' }}
      />
      <TeamBlock
        side="right"
        word="Niño"
        sub="Viste celeste o azul"
        bring="Traer pañales"
        ink="#2f6590"
        Icon={Baby}
        shirt="/polo-celeste.png"
        shirtAlt="Polo celeste"
        tilt={6}
        deep="#3f78a6"
        delay={1.8}
        style={{ top: '59cqh', height: '29cqh' }}
      />

      {/* VS: golpea el centro con onda expansiva y destellos */}
      <div className="absolute" style={{ left: '50%', top: '52%', width: 0, height: 0 }}>
        <span className="vs-ring" style={D(2.7)} />
        <span className="vs-ring" style={D(3.1)} />
        <div className="vs-slam" style={D(2.6)}>
          <div className="vs-badge vs-pulse">
            <span className="f-body vs-text">VS</span>
          </div>
        </div>
        <Burst
          style={{ left: 0, top: 0 }}
          delay={2.75}
          radius={27}
          size={4.4}
          colors={['#f7a1bb', '#8cc3e6', '#ffffff', '#f6c77b']}
        />
      </div>
    </div>
  </>
);

/* 7 · Final: confeti, cuenta regresiva, mapa y globos que se tocan */
const SceneFinal = ({ onReplay }) => (
  <>
    <Confetti />

    {/* Globos y ositos van detrás del texto para no tapar los botones */}
    <Balloons
      interactive
      delay={0.6}
      box={{ left: '10cqw', width: '80cqw', height: '60cqw', bottom: '30cqw' }}
      rack={{ left: '17cqw', width: '66cqw', bottom: '20cqw' }}
    />
    <Bear src="/oso-nina.png" alt="Oso niña" enter="up" delay={0.9} style={{ left: '3cqw', bottom: '6cqw', width: '34cqw' }} />
    <Bear src="/oso-nino.png" alt="Oso niño" enter="up" delay={1.1} style={{ right: '3cqw', bottom: '6cqw', width: '34cqw' }} />
    <CloudBand position="bottom" />

    <div
      className="absolute inset-x-0 z-[2] flex flex-col items-center text-center"
      style={{ top: 'calc(env(safe-area-inset-top, 0px) + 6cqh)' }}
    >
      <div className="pop" style={D(0.2)}><span className="f-script g-blue s-big">¿Niño</span></div>
      <div className="pop" style={{ ...D(0.5), marginTop: '-1cqw' }}><span className="f-script g-pink s-big">Niña?</span></div>
      <p className="f-script c-rose s-h2 rise" style={{ ...D(1), marginTop: '1cqw' }}>¡Te esperamos!</p>

      <div style={{ marginTop: '5cqw' }}><Countdown delay={1.3} /></div>

      <a href={MAP_URL} target="_blank" rel="noopener noreferrer" className="map-btn rise" style={{ ...D(2), marginTop: '6cqw' }}>
        <Navigation style={{ width: '5cqw', height: '5cqw' }} />
        Ver en mapa
      </a>
      <button type="button" onClick={onReplay} className="replay-btn rise" style={{ ...D(2.3), marginTop: '2cqw' }}>
        <RotateCcw style={{ width: '4cqw', height: '4cqw' }} />
        Ver de nuevo
      </button>
    </div>
  </>
);

/* ============================================================
   APP
   ============================================================ */
const App = () => {
  const [phase, setPhase] = useState('cover'); // cover → opening → story
  const [ready, setReady] = useState(false);
  const [sealLoaded, setSealLoaded] = useState(false);
  const [scene, setScene] = useState(0);
  const [prev, setPrev] = useState(null);
  const sceneRef = useRef(0);
  const stageRef = useRef(null);
  const [bursts, setBursts] = useState([]);

  /* Música: empieza al tocar el sobre (los navegadores exigen un toque del usuario) */
  const audioRef = useRef(null);
  const fadeRef = useRef(null);
  const [musicOk, setMusicOk] = useState(true);
  const [musicOn, setMusicOn] = useState(false);

  const fadeTo = useCallback((target, ms = 1500, done) => {
    const a = audioRef.current;
    if (!a) return;
    clearInterval(fadeRef.current);
    const from = a.volume;
    const steps = 20;
    let i = 0;
    fadeRef.current = setInterval(() => {
      i += 1;
      a.volume = Math.max(0, Math.min(1, from + (target - from) * (i / steps)));
      if (i >= steps) {
        clearInterval(fadeRef.current);
        if (done) done();
      }
    }, ms / steps);
  }, []);

  const startMusic = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    a.volume = 0;
    const onPlaying = () => {
      setMusicOn(true);
      fadeTo(MUSIC_VOLUME, 2000);
    };
    const p = a.play();
    if (p && p.then) p.then(onPlaying).catch(() => setMusicOn(false));
    else onPlaying();
  }, [fadeTo]);

  const stopMusic = useCallback(() => {
    setMusicOn(false);
    fadeTo(0, 500, () => {
      if (audioRef.current) audioRef.current.pause();
    });
  }, [fadeTo]);

  /* Si cambian de pestaña o bloquean el teléfono, la música se pausa y luego sigue */
  useEffect(() => {
    const onVis = () => {
      const a = audioRef.current;
      if (!a || !musicOn) return;
      if (document.hidden) a.pause();
      else a.play().catch(() => {});
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [musicOn]);

  useEffect(
    () => () => {
      clearInterval(fadeRef.current);
      if (audioRef.current) audioRef.current.pause();
    },
    []
  );

  const opened = phase === 'opening';
  const inStory = phase === 'story';

  /* Precarga (también llena el caché que usan los "respaldos") */
  useEffect(() => {
    ASSETS.forEach((src) => probe(src));
  }, []);

  /* Portada: el sobre se puede tocar cuando termina de llegar */
  useEffect(() => {
    const id = setTimeout(() => setReady(true), 1800);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    if (phase !== 'opening') return;
    const id = setTimeout(() => setPhase('story'), 2300);
    return () => clearTimeout(id);
  }, [phase]);

  /* Cambio de escena con crossfade */
  const go = useCallback((n) => {
    const next = Math.max(0, Math.min(LAST, n));
    if (next === sceneRef.current) return;
    setPrev(sceneRef.current);
    sceneRef.current = next;
    setScene(next);
  }, []);

  useEffect(() => {
    if (prev === null) return;
    const id = setTimeout(() => setPrev(null), 750);
    return () => clearTimeout(id);
  }, [prev, scene]);

  /* Avance automático */
  useEffect(() => {
    if (!inStory || scene >= LAST) return;
    const id = setTimeout(() => go(scene + 1), DURATIONS[scene] * 1000);
    return () => clearTimeout(id);
  }, [inStory, scene, go]);

  /* Teclado (escritorio) */
  useEffect(() => {
    if (!inStory) return;
    const onKey = (e) => {
      if (e.key === 'ArrowRight' || e.key === ' ') go(sceneRef.current + 1);
      if (e.key === 'ArrowLeft') go(sceneRef.current - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [inStory, go]);

  const handleOpen = () => {
    if (!ready || phase !== 'cover') return;
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(15);
    startMusic();
    setPhase('opening');
  };

  /* Cada toque en la historia deja un destello de estrellitas */
  const onStagePointerDown = (e) => {
    if (!inStory || !stageRef.current) return;
    const rect = stageRef.current.getBoundingClientRect();
    const id = `${Date.now()}-${Math.random()}`;
    setBursts((b) => [...b.slice(-3), { id, x: e.clientX - rect.left, y: e.clientY - rect.top }]);
    setTimeout(() => setBursts((b) => b.filter((x) => x.id !== id)), 1100);
  };

  const renderScene = (i) => {
    switch (i) {
      case 0: return <SceneHero />;
      case 1: return <SceneMessage />;
      case 2:
        return (
          <SceneGuess
            lead="Algunos sueñan con una"
            word="Niña"
            gradient="g-pink"
            tint="linear-gradient(180deg, rgba(249,176,198,.38) 0%, rgba(253,239,242,.15) 70%)"
            src="/oso-nina-durmiendo.png"
            fallback="/oso-nina.png"
          />
        );
      case 3:
        return (
          <SceneGuess
            lead="Otros esperan con ilusión un"
            word="Niño"
            gradient="g-blue"
            tint="linear-gradient(180deg, rgba(159,208,238,.42) 0%, rgba(228,238,246,.15) 70%)"
            src="/oso-nino-durmiendo.png"
            fallback="/oso-nino.png"
          />
        );
      case 4: return <SceneHost />;
      case 5: return <SceneDetails />;
      case 6: return <SceneDress />;
      default: return <SceneFinal onReplay={() => go(0)} />;
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center" style={{ background: '#efe3df' }}>
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;700&family=Lobster+Two:ital,wght@1,700&display=swap');

          .stage { container-type: size; touch-action: manipulation; -webkit-tap-highlight-color: transparent; user-select: none; -webkit-user-select: none; }

          /* ---------- Tipografía (en cqw: escala con el ancho del teléfono) ---------- */
          .f-script { font-family: 'Lobster Two', 'Pacifico', cursive; font-style: italic; font-weight: 700; }
          .f-body { font-family: 'Baloo 2', 'Nunito', system-ui, sans-serif; font-weight: 700; letter-spacing: .03em; text-transform: uppercase; }
          .g-blue, .g-pink, .g-rose { -webkit-background-clip: text; background-clip: text; color: transparent; padding: 0 .12em .08em; }
          .g-blue { background-image: linear-gradient(180deg, #9fd0ee 0%, #4f88b5 100%); }
          .g-pink { background-image: linear-gradient(180deg, #f9b0c6 0%, #dd5a82 100%); }
          .g-rose { background-image: linear-gradient(180deg, #f08fae 0%, #b9476c 100%); }
          .c-rose { color: #c9507a; }
          .c-brown { color: #8c7365; }
          .c-body { color: #6f4a58; }

          .s-hero { font-size: min(22vw, 100px); font-size: 24cqw; line-height: .95; display: inline-block; }
          .s-big { font-size: min(15vw, 70px); font-size: 16cqw; line-height: .95; display: inline-block; }
          .s-o { font-size: min(8vw, 36px); font-size: 8cqw; color: #a48879; line-height: 1; }
          .s-h1 { font-size: min(12vw, 56px); font-size: 13.5cqw; }
          .s-h2 { font-size: min(8.4vw, 40px); font-size: 9cqw; line-height: 1.15; }
          .s-h3 { font-size: min(8vw, 38px); font-size: 9cqw; line-height: 1.1; }
          .s-body { font-size: min(4.6vw, 22px); font-size: 4.8cqw; line-height: 1.35; }
          .s-small-text { font-size: min(3.6vw, 17px); font-size: 3.8cqw; letter-spacing: .12em; }
          .s-date { font-size: min(20vw, 90px); font-size: 22cqw; line-height: .9; }
          .s-cover { font-size: min(9vw, 40px); font-size: 10cqw; line-height: 1.1; }
          .s-pill { font-size: min(3.8vw, 18px); font-size: 3.9cqw; }

          /* ---------- Animaciones de entrada (todas con "both": sin parpadeos) ---------- */
          @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
          @keyframes rise { from { opacity: 0; transform: translate3d(0, 5cqw, 0); } to { opacity: 1; transform: translate3d(0,0,0); } }
          @keyframes pop {
            0%   { opacity: 0; transform: scale(.6) translate3d(0, 2cqw, 0); }
            60%  { opacity: 1; transform: scale(1.06) translate3d(0,0,0); }
            100% { opacity: 1; transform: scale(1) translate3d(0,0,0); }
          }
          @keyframes wordIn { from { opacity: 0; transform: translate3d(0, .45em, 0); } to { opacity: 1; transform: translate3d(0,0,0); } }
          @keyframes sceneIn { from { opacity: 0; } to { opacity: 1; } }
          @keyframes sceneOut { from { opacity: 1; transform: translate3d(0,0,0); } to { opacity: 0; transform: translate3d(0, -3cqh, 0); } }

          @keyframes bearRight { from { opacity: 0; transform: translate3d(70%, 0, 0) rotate(8deg); } to { opacity: 1; transform: translate3d(0,0,0) rotate(0); } }
          @keyframes bearLeft  { from { opacity: 0; transform: translate3d(-70%, 0, 0) rotate(-8deg); } to { opacity: 1; transform: translate3d(0,0,0) rotate(0); } }
          @keyframes bearUp    { from { opacity: 0; transform: translate3d(0, 60%, 0); } to { opacity: 1; transform: translate3d(0,0,0); } }
          @keyframes balloonsUp { from { opacity: 0; transform: translate3d(0, 45cqh, 0); } to { opacity: 1; transform: translate3d(0,0,0); } }

          .rise { animation: rise .9s cubic-bezier(.2,.8,.2,1) both; }
          .pop  { animation: pop .9s cubic-bezier(.2,.8,.2,1) both; }
          .word { display: inline-block; animation: wordIn .6s cubic-bezier(.2,.8,.2,1) both; }
          .scene-in  { animation: sceneIn .7s ease-out both; }
          .scene-out { animation: sceneOut .7s ease-in both; pointer-events: none; }
          .bear-in-right { animation: bearRight 1.4s cubic-bezier(.22,1,.36,1) both; }
          .bear-in-left  { animation: bearLeft 1.4s cubic-bezier(.22,1,.36,1) both; }
          .bear-in-up    { animation: bearUp 1.5s cubic-bezier(.22,1,.36,1) both; }
          .balloons-in   { animation: balloonsUp 1.9s cubic-bezier(.22,1,.36,1) both; }

          /* ---------- Movimiento continuo (solo transform/opacity) ---------- */
          @keyframes sway { 0% { transform: rotate(-2.2deg) translate3d(0,0,0); } 100% { transform: rotate(2.2deg) translate3d(0,-1.2cqw,0); } }
          @keyframes balloonSway { 0% { transform: rotate(-1.8deg) translate3d(0,0,0); } 100% { transform: rotate(1.8deg) translate3d(0,-2cqw,0); } }
          @keyframes balloonSwayI { 0% { transform: rotate(-4deg) translate3d(0,0,0); } 100% { transform: rotate(4deg) translate3d(0,-2.4cqw,0); } }
          @keyframes wiggle { 0% { transform: scale(1) rotate(0); } 30% { transform: scale(1.18) rotate(-7deg) translate3d(0,-2cqw,0); } 60% { transform: scale(.94) rotate(5deg); } 100% { transform: scale(1) rotate(0); } }
          @keyframes floatY { 0%,100% { transform: translate3d(0,0,0); } 50% { transform: translate3d(0,-1.8cqw,0); } }
          @keyframes floatSoft { 0%,100% { transform: translate3d(0,0,0); } 50% { transform: translate3d(0,-1.6cqw,0); } }
          @keyframes twinkle { 0%,100% { opacity: .15; transform: scale(.55) rotate(0deg); } 50% { opacity: 1; transform: scale(1) rotate(20deg); } }
          @keyframes bokeh { from { transform: translate3d(0,0,0) scale(1); } to { transform: translate3d(4cqw,-6cqw,0) scale(1.08); } }
          @keyframes heartBeat { 0%,100% { transform: scale(1); } 15% { transform: scale(1.14); } 30% { transform: scale(1); } 45% { transform: scale(1.1); } }
          @keyframes fill { from { transform: scaleX(0); } to { transform: scaleX(1); } }
          @keyframes shoesSwing { 0%,100% { transform: rotate(-5deg); } 50% { transform: rotate(5deg); } }
          @keyframes zzz { 0% { opacity: 0; transform: translate3d(0,0,0) scale(.6); } 30% { opacity: 1; } 100% { opacity: 0; transform: translate3d(5cqw,-9cqw,0) scale(1.3); } }
          @keyframes cloudA { from { transform: translate3d(-2.2cqw,0,0); } to { transform: translate3d(2.2cqw,0,0); } }
          @keyframes cloudB { from { transform: translate3d(1.4cqw,0,0); } to { transform: translate3d(-1.4cqw,0,0); } }
          @keyframes confetti {
            0%   { transform: translate3d(0,-8cqh,0) rotate(0deg); opacity: 0; }
            8%   { opacity: 1; }
            100% { transform: translate3d(var(--dx),108cqh,0) rotate(var(--rot)); opacity: 1; }
          }
          @keyframes birdRight {
            0%   { transform: translate3d(-20cqw, 0, 0) rotate(-6deg); opacity: 0; }
            12%  { opacity: 1; } 88% { opacity: 1; }
            100% { transform: translate3d(125cqw, -10cqw, 0) rotate(6deg); opacity: 0; }
          }
          @keyframes birdLeft {
            0%   { transform: translate3d(125cqw, 0, 0) rotate(6deg); opacity: 0; }
            12%  { opacity: 1; } 88% { opacity: 1; }
            100% { transform: translate3d(-25cqw, -12cqw, 0) rotate(-6deg); opacity: 0; }
          }

          .bear-wrap { will-change: transform; }
          .bear-sway { transform-origin: 50% 92%; animation: sway 3.4s ease-in-out infinite alternate; }
          .balloons-sway { transform-origin: 50% 100%; animation: balloonSway 4s ease-in-out infinite alternate; }
          .balloon-sway-i { transform-origin: 50% 100%; animation: balloonSwayI 4s ease-in-out infinite alternate; }
          .balloon-wiggle { transform-origin: 50% 100%; animation: wiggle .7s ease-out both; }
          .float-y { animation: floatY 3.4s ease-in-out infinite; }
          .float-soft { animation: floatSoft 3.5s ease-in-out infinite; }
          .twinkle { animation: twinkle 3.4s ease-in-out infinite both; }
          .heart-beat { animation: heartBeat 1.8s ease-in-out infinite; }
          .shoes-swing { transform-origin: 50% 0%; animation: shoesSwing 3.2s ease-in-out infinite; }
          .zzz { position: absolute; right: 0; top: 0; font-size: 7cqw; color: #8c7365; opacity: 0; animation: zzz 3.2s ease-out infinite both; }
          .cloud-back  { animation: cloudA 9s ease-in-out infinite alternate; will-change: transform; }
          .cloud-front { animation: cloudB 12s ease-in-out infinite alternate; will-change: transform; }
          .confetti { position: absolute; top: 0; animation: confetti linear both; will-change: transform; }
          .bokeh { position: absolute; border-radius: 50%; background: radial-gradient(circle, rgba(255,255,255,.75) 0%, rgba(255,255,255,0) 68%); animation: bokeh 14s ease-in-out infinite alternate; will-change: transform; }
          .bird { position: absolute; left: 0; width: 11cqw; will-change: transform; }
          .bird-a { top: 14%; animation: birdRight 15s linear 1s infinite both; }
          .bird-b { top: 30%; animation: birdLeft 19s linear 5s infinite both; }

          /* ---------- Integración extra ---------- */
          @keyframes burstOut { 0% { opacity: 0; transform: translate3d(0,0,0) scale(.2) rotate(0deg); } 20% { opacity: 1; } 100% { opacity: 0; transform: translate3d(var(--bx),var(--by),0) scale(1) rotate(120deg); } }
          @keyframes driftAcross { from { transform: translate3d(-45cqw,0,0); } to { transform: translate3d(140cqw,0,0); } }
          @keyframes heartRise { 0% { opacity: 0; transform: translate3d(0,0,0) scale(.8); } 12% { opacity: .55; } 85% { opacity: .55; } 100% { opacity: 0; transform: translate3d(var(--sx),-118cqh,0) scale(1.1); } }
          @keyframes heartPuff { 0% { opacity: 0; transform: translate3d(0,0,0) scale(.3) rotate(0deg); } 15% { opacity: 1; } 100% { opacity: 0; transform: translate3d(var(--hx),var(--hy),0) scale(1.1) rotate(var(--hr)); } }
          @keyframes orbit { to { transform: rotate(360deg); } }
          @keyframes breathe { 0%,100% { transform: scale(1,1); } 50% { transform: scale(1.015,1.035); } }
          @keyframes flap { from { transform: scale(1,1); } to { transform: scale(1.05,.78); } }
          @keyframes glowPulse { 0%,100% { opacity: .55; transform: scale(1); } 50% { opacity: 1; transform: scale(1.08); } }
          @keyframes tick { from { opacity: .4; transform: translate3d(0,-12%,0) scale(.88); } to { opacity: 1; transform: translate3d(0,0,0) scale(1); } }
          @keyframes ring { 0% { transform: scale(1); opacity: .7; } 100% { transform: scale(1.3,1.55); opacity: 0; } }
          .burst-item { position: absolute; left: 0; top: 0; animation: burstOut .9s cubic-bezier(.2,.8,.3,1) both; }
          .drift-cloud { position: absolute; left: 0; animation: driftAcross linear infinite both; will-change: transform; }
          .riser { position: absolute; bottom: -6cqw; animation: heartRise linear infinite both; }
          .heart-puff { position: absolute; left: 0; top: 0; animation: heartPuff 1.5s cubic-bezier(.2,.8,.3,1) both; }
          .orbit { animation: orbit 22s linear infinite; }
          .breathe { transform-origin: 50% 100%; animation: breathe 4s ease-in-out infinite; }
          .bird-flap { transform-origin: 50% 60%; animation: flap .45s ease-in-out infinite alternate; }
          .glow-pulse { animation: glowPulse 3.6s ease-in-out infinite; }
          .tick { display: inline-block; animation: tick .35s ease-out both; }
          .map-btn { position: relative; }
          .map-btn::after { content: ''; position: absolute; inset: 0; border-radius: 9999px; border: 2px solid rgba(140,115,101,.55); pointer-events: none; animation: ring 2.6s ease-out 3s infinite both; }

          /* ---------- Duelo Team Niña VS Team Niño ---------- */
          @keyframes panelL { from { transform: translate3d(-100%,0,0); } to { transform: translate3d(0,0,0); } }
          @keyframes panelR { from { transform: translate3d(100%,0,0); } to { transform: translate3d(0,0,0); } }
          @keyframes shirtInLeft {
            0%   { opacity: 0; transform: translate3d(-80cqw,0,0) rotate(-40deg) scale(.6); }
            60%  { opacity: 1; transform: translate3d(3cqw,0,0) rotate(8deg) scale(1.08); }
            100% { opacity: 1; transform: translate3d(0,0,0) rotate(0deg) scale(1); }
          }
          @keyframes shirtInRight {
            0%   { opacity: 0; transform: translate3d(80cqw,0,0) rotate(40deg) scale(.6); }
            60%  { opacity: 1; transform: translate3d(-3cqw,0,0) rotate(-8deg) scale(1.08); }
            100% { opacity: 1; transform: translate3d(0,0,0) rotate(0deg) scale(1); }
          }
          @keyframes slashWipe { from { clip-path: inset(0 100% 0 0); } to { clip-path: inset(0 0 0 0); } }
          @keyframes vsSlam {
            0%   { opacity: 0; transform: scale(3) rotate(-20deg); }
            55%  { opacity: 1; transform: scale(.88) rotate(4deg); }
            75%  { transform: scale(1.08) rotate(-2deg); }
            100% { opacity: 1; transform: scale(1) rotate(0deg); }
          }
          @keyframes vsPulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.07); } }
          @keyframes vsRing { 0% { opacity: 0; transform: scale(1); } 10% { opacity: .8; } 100% { opacity: 0; transform: scale(2.6); } }
          @keyframes shake {
            0%,100% { transform: translate3d(0,0,0); }
            15% { transform: translate3d(-1cqw,.6cqw,0); }
            30% { transform: translate3d(1cqw,-.6cqw,0); }
            45% { transform: translate3d(-.7cqw,-.4cqw,0); }
            60% { transform: translate3d(.7cqw,.4cqw,0); }
            80% { transform: translate3d(-.3cqw,0,0); }
          }
          .panel-in-left  { animation: panelL .8s cubic-bezier(.22,1,.36,1) both; }
          .panel-in-right { animation: panelR .8s cubic-bezier(.22,1,.36,1) both; }
          .shirt-in-left  { animation: shirtInLeft 1s cubic-bezier(.22,1,.36,1) both; }
          .shirt-in-right { animation: shirtInRight 1s cubic-bezier(.22,1,.36,1) both; }
          .slash-wipe { animation: slashWipe .6s ease-out both; }
          .vs-slam { position: absolute; left: -12cqw; top: -12cqw; width: 24cqw; height: 24cqw; animation: vsSlam .7s ease-out both; }
          .vs-pulse { animation: vsPulse 1.6s ease-in-out 3.4s infinite; }
          .vs-ring { position: absolute; left: -12cqw; top: -12cqw; width: 24cqw; height: 24cqw; border-radius: 50%; border: .8cqw solid rgba(255,255,255,.85); animation: vsRing 2.2s ease-out infinite both; }
          .shake { animation: shake .45s ease-out both; }
          .vs-badge { width: 100%; height: 100%; border-radius: 50%; background: radial-gradient(circle at 35% 30%, #fff, #fdf2f6 60%, #f3e0e6); border: 1.2cqw solid #fff; box-shadow: 0 0 0 1cqw rgba(255,255,255,.5), 0 3cqw 7cqw rgba(140,115,101,.35); display: flex; align-items: center; justify-content: center; }
          .vs-text { font-size: 9cqw; line-height: 1; letter-spacing: .02em; background-image: linear-gradient(135deg, #e0587f, #4f88b5); -webkit-background-clip: text; background-clip: text; color: transparent; padding-right: .04em; }
          .vs-label { font-size: 4.4cqw; letter-spacing: .35em; line-height: 1; margin-right: -.35em; }
          .vs-word { font-size: min(19cqw, 10cqh); line-height: 1; display: inline-block; padding: 0 .08em; }
          .vs-bring { display: inline-flex; align-items: center; justify-content: center; gap: 1.2cqw; margin-top: 2.2cqw; padding: 1.2cqw 3cqw; border-radius: 3.5cqw; background: rgba(255,255,255,.55); font-family: 'Baloo 2', system-ui, sans-serif; font-weight: 700; font-size: 3.4cqw; line-height: 1.15; }
          .vs-pill { display: inline-block; margin-top: 2cqw; background: #fff; border-radius: 9999px; padding: 1.5cqw 3.8cqw; font-family: 'Baloo 2', system-ui, sans-serif; font-weight: 700; font-size: 3.6cqw; letter-spacing: .02em; box-shadow: 0 1.5cqw 3.5cqw rgba(0,0,0,.14); }

          /* ---------- Portada (sobre) ---------- */
          @keyframes deliver {
            0%   { transform: translate3d(0,-80cqh,0) scale(.6) rotate(-8deg); opacity: 0; }
            100% { transform: translate3d(0,0,0) scale(1) rotate(0); opacity: 1; }
          }
          @keyframes shadowGrow { from { transform: scale(.3); opacity: 0; } to { transform: scale(1); opacity: .4; } }
          @keyframes coverText { 0%,65% { opacity: 0; transform: translate3d(0,3cqw,0); } 100% { opacity: 1; transform: translate3d(0,0,0); } }
          @keyframes flash { 0% { opacity: 0; transform: scale(.6); } 40% { opacity: 1; transform: scale(1.2); } 100% { opacity: 0; transform: scale(1.6); } }
          @keyframes coverOut { from { opacity: 1; transform: scale(1); } to { opacity: 0; transform: scale(1.06); } }
          .deliver { animation: deliver 1.6s cubic-bezier(.22,1.15,.36,1) both; will-change: transform; }
          .shadow-grow { animation: shadowGrow 1.6s cubic-bezier(.22,1,.36,1) both; }
          .cover-text { animation: coverText 2s ease-out both; }
          .flash { animation: flash 1.2s ease-out 1s both; }
          .cover-out { animation: coverOut .8s ease-in 1.2s both; }

          /* ---------- Contador y botones ---------- */
          .cd-chip { width: 17cqw; height: 17cqw; border-radius: 9999px; background: rgba(255,255,255,.94); border: .8cqw solid #f9f3ef; box-shadow: 0 2cqw 5cqw rgba(140,115,101,.16); display: flex; flex-direction: column; align-items: center; justify-content: center; }
          .cd-num { font-family: 'Baloo 2', system-ui, sans-serif; font-weight: 700; font-size: 6.2cqw; line-height: 1; color: #8c7365; font-variant-numeric: tabular-nums; }
          .cd-lab { font-family: 'Baloo 2', system-ui, sans-serif; font-weight: 600; font-size: 2.6cqw; letter-spacing: .08em; text-transform: uppercase; color: #a48879; margin-top: .6cqw; }
          .map-btn { display: inline-flex; align-items: center; justify-content: center; gap: 2.5cqw; min-height: 48px; padding: 3.4cqw 9cqw; border-radius: 9999px; background: #8c7365; color: #fff; font-family: 'Baloo 2', system-ui, sans-serif; font-weight: 700; font-size: 4.4cqw; letter-spacing: .04em; box-shadow: 0 2cqw 5cqw rgba(140,115,101,.35); transition: transform .2s ease, background .2s ease; }
          .map-btn:active { transform: scale(.96); background: #735e53; }
          .replay-btn { display: inline-flex; align-items: center; gap: 1.5cqw; min-height: 44px; padding: 2cqw 5cqw; color: #8c7365; font-family: 'Baloo 2', system-ui, sans-serif; font-weight: 600; font-size: 3.8cqw; }
          .replay-btn:active { opacity: .6; }

          @media (prefers-reduced-motion: reduce) {
            .bear-sway, .balloons-sway, .balloon-sway-i, .float-y, .float-soft, .twinkle, .heart-beat, .bokeh, .bird,
            .shoes-swing, .zzz, .cloud-back, .cloud-front, .drift-cloud, .riser, .orbit, .breathe, .bird-flap, .glow-pulse, .burst-item, .heart-puff, .map-btn::after, .vs-pulse, .vs-ring, .shake { animation: none !important; }
            .vs-ring { display: none; }
            .burst-item, .heart-puff, .riser { display: none; }
            .confetti { display: none; }
            .rise, .pop, .word, .bear-in-right, .bear-in-left, .bear-in-up, .balloons-in, .deliver, .panel-in-left, .panel-in-right, .shirt-in-left, .shirt-in-right, .vs-slam, .slash-wipe { animation-name: fadeIn !important; animation-duration: .6s !important; }
          }
        `}
      </style>

      <div ref={stageRef} onPointerDown={onStagePointerDown} className="stage relative w-full h-[100dvh] max-w-[460px] overflow-hidden bg-[#f9f3ef] md:h-[min(94dvh,920px)] md:rounded-[2rem] md:shadow-[0_30px_80px_rgba(140,115,101,0.35)]">
        {/* ---------- Fondo acuarela: cielo celeste → rosa ---------- */}
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(180deg, #bfe6ee 0%, #e4eef6 34%, #fbdfe6 70%, #fdeff2 100%)' }}
        >
          <img
            src="/fondo-acuarela.jpg"
            alt=""
            className="w-full h-full object-cover opacity-60"
            style={{ mixBlendMode: 'multiply' }}
            onError={hideOnError}
          />
        </div>
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          {BOKEH.map(([x, y, s], i) => (
            <span key={i} className="bokeh" style={{ left: `${x}%`, top: `${y}%`, width: `${s}cqw`, height: `${s}cqw`, animationDelay: `${i * -2.3}s` }} />
          ))}
        </div>
        <Sparkles />
        <Ambient />
        <audio ref={audioRef} src={MUSIC_SRC} loop preload="auto" onError={() => setMusicOk(false)} />

        {/* ---------- PORTADA: SOBRE ---------- */}
        {!inStory && (
          <div className={`absolute inset-0 z-20 flex flex-col items-center justify-center ${opened ? 'cover-out' : ''}`}>
            <div
              className="relative z-40 flex flex-col items-center text-center transition-all duration-700"
              style={{ marginBottom: '12cqw', padding: '0 6cqw', opacity: opened ? 0 : 1, transform: opened ? 'translateY(-4cqw)' : 'none' }}
            >
              <div className="cover-text flex flex-col items-center">
                <h2 className="f-script c-brown s-cover" style={{ marginBottom: '4cqw' }}>Tienes una sorpresa mágica</h2>
                <p
                  className="float-soft inline-flex items-center bg-white/90 rounded-full s-pill c-brown"
                  style={{ gap: '2.5cqw', padding: '2.6cqw 6cqw', fontWeight: 600, boxShadow: '0 2cqw 5cqw rgba(140,115,101,.18)', border: '1px solid #efe4de' }}
                >
                  <Mail style={{ width: '5cqw', height: '5cqw', color: '#f48fb1' }} /> Toca el sobre para descubrirla
                </p>
                {musicOk && (
                  <p className="rise f-body c-brown inline-flex items-center" style={{ ...D(2.2), gap: '1.5cqw', fontSize: '3cqw', marginTop: '3.5cqw', opacity: 0.85 }}>
                    <Volume2 style={{ width: '4cqw', height: '4cqw' }} /> Con música
                  </p>
                )}
              </div>
            </div>

            <div className="deliver relative flex flex-col items-center z-30 w-full">
              <div className={`relative flex flex-col items-center w-full ${ready ? 'float-soft' : ''}`}>
                <div
                  className="absolute pointer-events-none"
                  style={{ left: '50%', top: '55%', width: '110cqw', height: '80cqw', transform: 'translate(-50%,-50%)' }}
                  aria-hidden="true"
                >
                  <div
                    className="glow-pulse w-full h-full rounded-full"
                    style={{ background: 'radial-gradient(circle, rgba(255,255,255,.85) 0%, rgba(249,176,198,.35) 40%, rgba(255,255,255,0) 70%)' }}
                  />
                </div>

                <button
                  type="button"
                  onClick={handleOpen}
                  disabled={!ready || phase !== 'cover'}
                  aria-label="Abrir el sobre"
                  className="relative block mx-auto outline-none rounded-xl"
                  style={{
                    width: '78cqw',
                    aspectRatio: '8 / 5',
                    marginTop: '4cqw',
                    perspective: '1200px',
                    cursor: ready && phase === 'cover' ? 'pointer' : 'default',
                  }}
                >
                  <div className="absolute inset-0 rounded-xl" style={{ background: 'linear-gradient(135deg,#e6d5cb,#d9c5ba)', boxShadow: '0 4cqw 9cqw rgba(140,115,101,.35)' }} />

                  {/* Carta */}
                  <div
                    className="absolute z-[5] bg-white rounded-lg shadow-md"
                    style={{
                      left: '5%', right: '5%', top: '8%', bottom: '8%', padding: '3cqw',
                      transform: opened ? 'translate3d(0,-70%,0) scale(1.08)' : 'translate3d(0,0,0) scale(1)',
                      opacity: opened ? 1 : 0,
                      transition: 'transform 1.1s cubic-bezier(0.45,0,0.2,1) 0.5s, opacity 0.2s ease 0.45s',
                    }}
                  >
                    <div className="w-full h-full flex items-center justify-center rounded-lg" style={{ border: '2px dashed #fbcfe0', background: 'rgba(253,242,248,.4)' }}>
                      <Heart className="heart-beat" style={{ width: '12cqw', height: '12cqw', color: '#f48fb1' }} fill="currentColor" />
                    </div>
                  </div>

                  {/* Bolsillo */}
                  <div
                    className="absolute inset-0 z-10 pointer-events-none rounded-xl"
                    style={{ clipPath: 'polygon(0 0, 50% 50%, 100% 0, 100% 100%, 0 100%)', background: 'linear-gradient(to top,#efe4de,#e6d5cb)' }}
                  />

                  {/* Solapa 3D */}
                  <div
                    className="absolute top-0 left-0 w-full"
                    style={{
                      height: '50%',
                      transformOrigin: 'top',
                      transformStyle: 'preserve-3d',
                      transform: opened ? 'rotateX(180deg)' : 'rotateX(0deg)',
                      zIndex: opened ? 2 : 20,
                      transition: 'transform 0.9s cubic-bezier(0.45,0,0.2,1), z-index 0s linear 0.45s',
                    }}
                  >
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom,#d9c5ba,#cbb6a9)', clipPath: FLAP_TRIANGLE, backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }} />
                    <div className="absolute inset-0" style={{ background: '#efe4de', clipPath: FLAP_TRIANGLE, transform: 'rotateY(180deg)', backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }} />
                    <div
                      className="absolute"
                      style={{ left: '50%', top: '100%', width: '15cqw', height: '15cqw', transform: 'translate(-50%,-50%) translateZ(1px)', backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
                    >
                      {!sealLoaded && <WaxSeal />}
                      <img src="/sello.png" alt="" className="relative w-full h-full object-contain" onLoad={() => setSealLoaded(true)} onError={hideOnError} />
                    </div>
                  </div>
                </button>
              </div>
              <div className="shadow-grow rounded-full" style={{ width: '64cqw', height: '7cqw', marginTop: '6cqw', background: 'rgba(0,0,0,.1)', filter: 'blur(14px)' }} />
            </div>
          </div>
        )}

        {opened && (
          <div
            className="absolute inset-0 z-[60] pointer-events-none flash"
            style={{ background: 'radial-gradient(circle at 50% 50%, #fff 0%, rgba(255,255,255,.85) 45%, rgba(255,255,255,0) 75%)' }}
          />
        )}

        {opened && <HeartPuff />}

        {/* ---------- HISTORIA ---------- */}
        {inStory && (
          <>
            {/* La escena anterior sigue montada mientras se desvanece (misma key = no se reinicia) */}
            {[prev, scene]
              .filter((v) => v !== null)
              .map((i) => (
                <div key={i} className={`absolute inset-0 z-10 ${i === scene ? 'scene-in' : 'scene-out'}`}>
                  {renderScene(i)}
                </div>
              ))}

            {/* Pajaritos cruzando por encima */}
            <div className="absolute inset-0 z-[15] pointer-events-none overflow-hidden" aria-hidden="true">
              <div className="bird bird-a"><img src="/pajaro-azul.png" alt="" className="bird-flap block w-full h-auto" onError={hideOnError} /></div>
              <div className="bird bird-b"><img src="/pajaro-rosa.png" alt="" className="bird-flap block w-full h-auto" onError={hideOnError} /></div>
            </div>

            {/* Zonas de toque: izquierda = atrás, derecha = siguiente */}
            {scene < LAST && (
              <>
                <button type="button" tabIndex={-1} aria-label="Escena anterior" className="absolute left-0 top-0 h-full z-30" style={{ width: '30%' }} onClick={() => go(scene - 1)} />
                <button type="button" tabIndex={-1} aria-label="Siguiente escena" className="absolute right-0 top-0 h-full z-30" style={{ width: '70%' }} onClick={() => go(scene + 1)} />
              </>
            )}

            {/* Barras de progreso */}
            <div
              className="absolute left-0 right-0 z-40 flex pointer-events-none"
              style={{ top: 'calc(env(safe-area-inset-top, 0px) + 10px)', padding: '0 4cqw', gap: '1.2cqw' }}
            >
              {DURATIONS.map((_, i) => {
                const full = i < scene || (i === LAST && scene === LAST);
                return (
                  <div key={i} className="flex-1 overflow-hidden rounded-full" style={{ height: 3, background: 'rgba(140,115,101,.22)' }}>
                    <div
                      key={`${i}-${scene}`}
                      className="h-full origin-left"
                      style={{
                        background: 'linear-gradient(90deg,#8cc3e6,#f7a1bb)',
                        transform: full ? 'scaleX(1)' : 'scaleX(0)',
                        animation: i === scene && i !== LAST ? `fill ${DURATIONS[i]}s linear both` : undefined,
                      }}
                    />
                  </div>
                );
              })}
            </div>

            {/* Música: silenciar / activar */}
            {musicOk && (
              <button
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => (musicOn ? stopMusic() : startMusic())}
                aria-label={musicOn ? 'Silenciar música' : 'Activar música'}
                className="absolute z-50 flex items-center justify-center rounded-full"
                style={{
                  top: 'calc(env(safe-area-inset-top, 0px) + 22px)',
                  right: '4cqw',
                  width: '11cqw',
                  height: '11cqw',
                  minWidth: 40,
                  minHeight: 40,
                  background: 'rgba(255,255,255,.88)',
                  color: '#8c7365',
                  boxShadow: '0 1.5cqw 4cqw rgba(140,115,101,.25)',
                }}
              >
                {musicOn ? <Volume2 style={{ width: '5.5cqw', height: '5.5cqw' }} /> : <VolumeX style={{ width: '5.5cqw', height: '5.5cqw' }} />}
              </button>
            )}

            {/* Destellos al tocar */}
            {bursts.map((b) => (
              <Burst key={b.id} style={{ left: b.x, top: b.y, zIndex: 45 }} radius={12} size={3.2} />
            ))}
          </>
        )}
      </div>
    </div>
  );
};

export default App;