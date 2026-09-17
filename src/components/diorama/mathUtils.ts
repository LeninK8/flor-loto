import * as THREE from 'three';

export const CONFIG = {
  pondDiameter: 5.0,
  get pondRadius() { return this.pondDiameter / 2; },
  terrainRadius: 4.15,
  shoreWidth: 0.55,
  waterLevel: 0,
  pondDepth: 0.62,
  nightMode: true,
  fireflyCount: 12,
  vinylCount: 16,
  audioEnabled: true,
  lotusScale: 0.28,
  shadows: true,
};

export const POSITIONS = {
  lotus:        { x:  0.10, z:  0.25 },
  trunk:        { x: -2.75, z: -1.75 },
  magicalStone: { x:  1.44, z:  2.19 },
  cat:          { x: -2.53, z:  2.36 },
  rings:        { x: -2.18, z:  2.08 },
  bubbleTea:    { x: -2.27, z:  2.69 },
  makiPlate:    { x: -2.81, z:  2.01 },
  turntable:    { x:  2.72, z:  1.55 },
  vinylShelf:   { x:  2.20, z:  2.45 },
  bushes: [
    { x: -3.30, z: -0.35, s: 1.00 },
    { x: -1.55, z: -3.05, s: 0.86 },
    { x:  1.15, z: -3.15, s: 1.06 },
    { x:  3.15, z: -1.35, s: 0.92 },
    { x:  1.05, z:  3.20, s: 0.80 },
    { x: -0.35, z:  3.30, s: 0.98 },
    { x: -3.45, z:  1.15, s: 0.72 }
  ]
};

export const PALETTE = {
  water:      0x16292c,
  waterDeep:  0x0a1618,
  soilDry:    0x3a352c,
  soilWet:    0x201f1b,
  moss:       0x44553f,
  mossPale:   0x6b7d5e,
  stone:      0x5b6260,
  bark:       0x342a22,
  barkPale:   0x554c42,
  wood:       0x8a7352,
  leaf:       0x33502f,
  leafDark:   0x24361f,
  petal:      0xf0e2e2,
  petalTip:   0xe3bdc9,
  petalBase:  0xb9c7a4,
  stamen:     0xe4d6a4,
  catFur:     0x8b8f93,
  catBelly:   0xb3b6b8,
  catEye:     0x7bc56a,
  gold:       0xc9a464,
  goldPale:   0xe3cf9b
};

export function mulberry32(a: number) {
  return function() {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

export const rnd = mulberry32(20260917);
export const rango = (a: number, b: number) => a + rnd() * (b - a);

export function hash2(x: number, y: number) {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

export function noise2(x: number, y: number) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash2(xi, yi), b = hash2(xi + 1, yi), c = hash2(xi, yi + 1), d = hash2(xi + 1, yi + 1);
  return (a * (1 - u) + b * u) * (1 - v) + (c * (1 - u) + d * u) * v;
}

export function fbm(x: number, y: number, oct = 4) {
  let s = 0, amp = 0.5, f = 1;
  for (let i = 0; i < oct; i++) {
    s += amp * noise2(x * f, y * f);
    amp *= 0.5; f *= 2;
  }
  return s;
}

export const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const easeInOut = (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
export const amortiguar = (actual: number, objetivo: number, k: number, dt: number) =>
  actual + (objetivo - actual) * (1 - Math.exp(-k * dt));

export function radioEstanque(ang: number) {
  return CONFIG.pondRadius * (1 + 0.032 * (fbm(Math.cos(ang) * 1.35 + 41, Math.sin(ang) * 1.35 + 41, 3) - 0.5) * 2.2);
}

export function terrainHeight(x: number, z: number) {
  const r = Math.hypot(x, z);
  const ang = Math.atan2(z, x);
  const rEstanque = radioEstanque(ang);
  const contorno = CONFIG.terrainRadius * (1 + 0.092 * (fbm(Math.cos(ang) * 1.25 + 11, Math.sin(ang) * 1.25 + 11, 3) - 0.5) * 2.2);
  let y: number;
  if (r < rEstanque) {
    const t = r / rEstanque;
    y = 0.004 - CONFIG.pondDepth * (1 - t * t) + (fbm(x * 1.4 + 5, z * 1.4 + 5, 3) - 0.5) * 0.06 * (1 - t * t);
  } else {
    const t = clamp((r - rEstanque) / CONFIG.shoreWidth, 0, 1);
    const orilla = 0.22 * t * t * (3 - 2 * t);
    y = 0.004 + orilla + ((fbm(x * 0.85 + 2, z * 0.85 + 2, 4) - 0.5) * 0.26 + (fbm(x * 2.7, z * 2.7, 3) - 0.5) * 0.09) * t;
  }
  if (r > contorno) {
    y -= Math.pow(r - contorno, 1.2) * 2.8;
  }
  return { y, borde: contorno };
}

export const alturaSuelo = (x: number, z: number) => terrainHeight(x, z).y;

export const ZONAS_LIBRES: { x: number; z: number; r: number }[] = [];
export function reservar(x: number, z: number, r: number) {
  ZONAS_LIBRES.push({ x, z, r });
}
export function libre(x: number, z: number) {
  for (let i = 0; i < ZONAS_LIBRES.length; i++) {
    const o = ZONAS_LIBRES[i];
    if (Math.hypot(x - o.x, z - o.z) < o.r) return false;
  }
  return true;
}

export function puntoEnTierra(margenInterior = 0.0, intentos = 60) {
  for (let i = 0; i < intentos; i++) {
    const a = rnd() * Math.PI * 2;
    const r = CONFIG.pondRadius + margenInterior + Math.pow(rnd(), 0.8) * (CONFIG.terrainRadius - CONFIG.pondRadius - margenInterior - 0.35);
    const x = Math.cos(a) * r, z = Math.sin(a) * r;
    const info = terrainHeight(x, z);
    if (r > info.borde - 0.25) continue;
    if (!libre(x, z)) continue;
    return { x, z, y: info.y };
  }
  return null;
}
