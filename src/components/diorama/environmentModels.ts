import * as THREE from 'three';
import {
  CONFIG, PALETTE, POSITIONS, rnd, rango, fbm, clamp, radioEstanque,
  alturaSuelo, puntoEnTierra, reservar
} from './mathUtils';

export function discoPolar(radio: number, anillos: number, segmentos: number) {
  const pos: number[] = [], uv: number[] = [], idx: number[] = [];
  pos.push(0, 0, 0); uv.push(0.5, 0.5);
  for (let i = 1; i <= anillos; i++) {
    const r = radio * Math.pow(i / anillos, 0.92);
    for (let j = 0; j < segmentos; j++) {
      const a = (j / segmentos) * Math.PI * 2;
      pos.push(Math.cos(a) * r, 0, Math.sin(a) * r);
      uv.push(0.5 + Math.cos(a) * r / (2 * radio), 0.5 + Math.sin(a) * r / (2 * radio));
    }
  }
  for (let j = 0; j < segmentos; j++) {
    const b = 1 + j, c = 1 + (j + 1) % segmentos;
    idx.push(0, b, c);
  }
  for (let i = 1; i < anillos; i++) {
    const a0 = 1 + (i - 1) * segmentos, a1 = 1 + i * segmentos;
    for (let j = 0; j < segmentos; j++) {
      const jn = (j + 1) % segmentos;
      idx.push(a0 + j, a1 + j, a0 + jn, a0 + jn, a1 + j, a1 + jn);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

export function createWater() {
  const geo = discoPolar(1, 22, 80);
  const gp = geo.attributes.position;
  for (let i = 0; i < gp.count; i++) {
    const x = gp.getX(i), z = gp.getZ(i), rr = Math.hypot(x, z);
    if (rr < 1e-5) continue;
    const f = radioEstanque(Math.atan2(z, x)) + 0.14;
    gp.setX(i, x * f); gp.setZ(i, z * f);
  }
  const aguaBase = new Float32Array(gp.array);
  const mat = new THREE.MeshPhysicalMaterial({
    color: PALETTE.water, roughness: 0.07, metalness: 0.2,
    transparent: true, opacity: 0.9, clearcoat: 0.85, clearcoatRoughness: 0.12,
    side: THREE.DoubleSide
  });
  const aguaMalla = new THREE.Mesh(geo, mat);
  aguaMalla.position.y = CONFIG.waterLevel;
  aguaMalla.receiveShadow = true;
  aguaMalla.name = 'Water';
  return { aguaMalla, aguaBase };
}

export function createTerrain() {
  const N = 128, L = 11;
  const geo = new THREE.PlaneGeometry(L, L, N, N);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  const col: number[] = [];
  const cSeco = new THREE.Color(PALETTE.soilDry),
        cHumedo = new THREE.Color(PALETTE.soilWet),
        cMusgo = new THREE.Color(PALETTE.moss),
        cPiedra = new THREE.Color(PALETTE.stone),
        cFondo = new THREE.Color(PALETTE.waterDeep),
        tmp = new THREE.Color();

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i);
    const y = alturaSuelo(x, z);
    pos.setY(i, y);
    const r = Math.hypot(x, z);
    if (r < CONFIG.pondRadius - 0.02) {
      const p = clamp(-y / CONFIG.pondDepth, 0, 1);
      tmp.copy(cHumedo).lerp(cFondo, p * 0.9);
    } else {
      const m = clamp(fbm(x * 0.9 + 20, z * 0.9 + 20, 4) * 1.5 - 0.25, 0, 1);
      tmp.copy(cSeco).lerp(cMusgo, m);
      const mojado = clamp(1 - (r - CONFIG.pondRadius) / 0.45, 0, 1);
      tmp.lerp(cHumedo, mojado * 0.75);
      const pendiente = Math.abs(alturaSuelo(x + 0.12, z) - y) + Math.abs(alturaSuelo(x, z + 0.12) - y);
      tmp.lerp(cPiedra, clamp(pendiente * 2.2, 0, 0.45));
    }
    const grano = 0.9 + fbm(x * 6.5, z * 6.5, 2) * 0.24;
    col.push(tmp.r * grano, tmp.g * grano, tmp.b * grano);
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  geo.computeVertexNormals();
  const malla = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
    vertexColors: true, roughness: 0.96, metalness: 0.0, flatShading: false
  }));
  malla.receiveShadow = true;
  malla.name = 'Terrain';
  return malla;
}

export function createRocks() {
  const geo = new THREE.IcosahedronGeometry(1, 1);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const f = 0.76 + fbm(p.getX(i) * 2.4 + 7, p.getZ(i) * 2.4 + 7, 2) * 0.5;
    p.setXYZ(i, p.getX(i) * f, p.getY(i) * f * 0.78, p.getZ(i) * f);
  }
  geo.computeVertexNormals();
  const mat = new THREE.MeshStandardMaterial({ roughness: 0.92, metalness: 0.02, flatShading: true });
  const inst = new THREE.InstancedMesh(geo, mat, 18);
  inst.castShadow = true; inst.receiveShadow = true; inst.name = 'Rocks';
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(),
        v = new THREE.Vector3(), s = new THREE.Vector3(), c = new THREE.Color();
  let n = 0;
  for (let i = 0; i < 18; i++) {
    const p2 = (i < 15) ? puntoEnTierra(0.15) : {
      x: Math.cos(rnd() * Math.PI * 2) * (CONFIG.pondRadius - 0.25),
      z: Math.sin(rnd() * Math.PI * 2) * (CONFIG.pondRadius - 0.25),
      y: -0.12
    };
    if (!p2) continue;
    const esc = rango(0.035, 0.105);
    v.set(p2.x, p2.y + esc * 0.35, p2.z);
    e.set(rango(-0.3, 0.3), rnd() * Math.PI * 2, rango(-0.3, 0.3));
    q.setFromEuler(e);
    s.set(esc * rango(0.85, 1.3), esc * rango(0.7, 1.1), esc * rango(0.85, 1.3));
    m.compose(v, q, s);
    inst.setMatrixAt(n, m);
    c.setHex(PALETTE.stone).offsetHSL(rango(-0.03, 0.05), rango(-0.05, 0.05), rango(-0.16, 0.08));
    inst.setColorAt(n, c);
    reservar(p2.x, p2.z, esc * 1.4);
    n++;
  }
  inst.count = n;
  return inst;
}

export function createGrassAndMoss() {
  const group = new THREE.Group();
  const hoja = new THREE.ConeGeometry(0.011, 0.085, 3, 1, false);
  hoja.translate(0, 0.0425, 0);
  const matHierba = new THREE.MeshStandardMaterial({ roughness: 0.9, metalness: 0, flatShading: true });
  const hierba = new THREE.InstancedMesh(hoja, matHierba, 900);
  hierba.name = 'Grass';
  let mata: { x: number; z: number; y: number } | null = null;
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(),
        v = new THREE.Vector3(), s = new THREE.Vector3(), c = new THREE.Color();
  let n = 0;
  for (let i = 0; i < 900; i++) {
    let p: { x: number; z: number; y: number } | null;
    if (mata && rnd() < 0.62) {
      const a = rnd() * Math.PI * 2, d = rango(0.02, 0.14);
      const x = mata.x + Math.cos(a) * d, z = mata.z + Math.sin(a) * d;
      p = { x, z, y: alturaSuelo(x, z) };
    } else {
      p = puntoEnTierra(0.02, 12);
      mata = p;
    }
    if (!p) continue;
    v.set(p.x, p.y, p.z);
    e.set(rango(-0.35, 0.35), rnd() * Math.PI * 2, rango(-0.35, 0.35));
    q.setFromEuler(e);
    const alto = rango(0.5, 1.5);
    s.set(rango(0.7, 1.2), alto, rango(0.7, 1.2));
    m.compose(v, q, s); hierba.setMatrixAt(n, m);
    c.setHex(PALETTE.moss).offsetHSL(rango(-0.04, 0.04), rango(-0.1, 0.1), rango(-0.1, 0.12));
    hierba.setColorAt(n, c); n++;
  }
  hierba.count = n;
  group.add(hierba);

  const parche = new THREE.SphereGeometry(1, 10, 6);
  const musgo = new THREE.InstancedMesh(parche,
    new THREE.MeshStandardMaterial({ roughness: 0.98, metalness: 0 }), 34);
  musgo.receiveShadow = true; musgo.name = 'Moss';
  let k = 0;
  for (let i = 0; i < 34; i++) {
    const p = puntoEnTierra(0.0, 14);
    if (!p) continue;
    const r = rango(0.1, 0.26);
    v.set(p.x, p.y + 0.005, p.z);
    q.setFromEuler(e.set(0, rnd() * Math.PI * 2, 0));
    s.set(r, rango(0.010, 0.022), r * rango(0.7, 1.25));
    m.compose(v, q, s); musgo.setMatrixAt(k, m);
    c.setHex(PALETTE.mossPale).offsetHSL(rango(-0.03, 0.03), rango(-0.12, 0.05), rango(-0.22, 0.02));
    musgo.setColorAt(k, c); k++;
  }
  musgo.count = k;
  group.add(musgo);
  return group;
}

export function createBushes() {
  const group = new THREE.Group();
  const geoHoja = new THREE.IcosahedronGeometry(0.072, 0);
  geoHoja.scale(1, 0.42, 1.5);
  const geoRama = new THREE.CylinderGeometry(0.004, 0.012, 1, 5, 1);
  geoRama.translate(0, 0.5, 0);
  const matRama = new THREE.MeshStandardMaterial({ color: 0x2c241d, roughness: 0.95 });
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(),
        v = new THREE.Vector3(), s = new THREE.Vector3(), c = new THREE.Color();

  POSITIONS.bushes.forEach((b, indice) => {
    const base = alturaSuelo(b.x, b.z);
    const arbusto = new THREE.Group();
    arbusto.name = 'Bush_' + indice;
    arbusto.position.set(b.x, base, b.z);

    const nRamas = 4 + Math.floor(rnd() * 3);
    const dirs: { a: number; inc: number; largo: number }[] = [];
    for (let i = 0; i < nRamas; i++) {
      const a = (i / nRamas) * Math.PI * 2 + rango(-0.4, 0.4);
      const inc = rango(0.35, 0.95);
      const largo = rango(0.26, 0.46) * b.s;
      const rama = new THREE.Mesh(geoRama, matRama);
      rama.scale.set(b.s * rango(0.7, 1.1), largo, b.s * rango(0.7, 1.1));
      rama.rotation.set(Math.cos(a) * inc, 0, -Math.sin(a) * inc);
      rama.castShadow = true;
      arbusto.add(rama);
      dirs.push({ a, inc, largo });
    }

    const nHojas = Math.round(86 * b.s);
    const hojas = new THREE.InstancedMesh(geoHoja,
      new THREE.MeshStandardMaterial({ roughness: 0.82, metalness: 0, side: THREE.DoubleSide }), nHojas);
    hojas.castShadow = true;
    for (let i = 0; i < nHojas; i++) {
      const d = dirs[i % dirs.length];
      const t = rango(0.45, 1.10);
      const disp = 0.07 * b.s;
      v.set(Math.sin(d.a) * Math.sin(d.inc) * d.largo * t + rango(-disp, disp),
            Math.cos(d.inc) * d.largo * t + rango(-disp, disp) + 0.02,
            Math.cos(d.a) * Math.sin(d.inc) * d.largo * t + rango(-disp, disp));
      q.setFromEuler(e.set(rnd() * Math.PI, rnd() * Math.PI * 2, rnd() * Math.PI));
      const es = b.s * rango(0.7, 1.35);
      s.set(es, es, es);
      m.compose(v, q, s); hojas.setMatrixAt(i, m);
      c.setHex(rnd() < 0.45 ? PALETTE.leafDark : PALETTE.leaf)
       .offsetHSL(rango(-0.03, 0.04), rango(-0.08, 0.1), rango(-0.06, 0.09));
      hojas.setColorAt(i, c);
    }
    arbusto.add(hojas);
    group.add(arbusto);
  });
  return group;
}

function texturaCorte() {
  const c = document.createElement('canvas'); c.width = c.height = 320;
  const g = c.getContext('2d')!;
  g.fillStyle = '#6f5c40'; g.fillRect(0, 0, 320, 320);
  const cx = 160, cy = 160;
  for (let r = 152; r > 2; r -= 1.4) {
    const on = Math.sin(r * 0.55 + Math.sin(r * 0.13) * 2.2) > 0.1;
    g.beginPath();
    g.strokeStyle = on ? 'rgba(58,46,32,0.55)' : 'rgba(158,133,98,0.35)';
    g.lineWidth = 1.5 + Math.sin(r * 0.31) * 0.9;
    for (let a = 0; a <= Math.PI * 2 + 0.1; a += 0.09) {
      const rr = r * (1 + 0.035 * Math.sin(a * 3.1 + r * 0.05) + 0.02 * Math.sin(a * 7.3));
      const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr * 0.94;
      a === 0 ? g.moveTo(x, y) : g.lineTo(x, y);
    }
    g.stroke();
  }
  const rad = g.createRadialGradient(cx, cy, 2, cx, cy, 60);
  rad.addColorStop(0, 'rgba(50,38,26,0.75)'); rad.addColorStop(1, 'rgba(50,38,26,0)');
  g.fillStyle = rad; g.beginPath(); g.arc(cx, cy, 60, 0, Math.PI * 2); g.fill();

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createTreeTrunk() {
  const ALTO = 0.92, ANILLOS = 18, SEG = 24;
  const base = alturaSuelo(POSITIONS.trunk.x, POSITIONS.trunk.z);
  const perfil: THREE.Vector3[][] = [];
  for (let i = 0; i <= ANILLOS; i++) {
    const t = i / ANILLOS;
    const radio = 0.30 * (1 - 0.30 * t) + 0.21 * Math.exp(-t * 5.0);
    const cx = 0.27 * t * t, cz = -0.13 * t * t;
    const giro = t * 0.5;
    const anillo: THREE.Vector3[] = [];
    for (let j = 0; j < SEG; j++) {
      const a = (j / SEG) * Math.PI * 2 + giro;
      const rr = radio * (1 + 0.20 * (fbm(Math.cos(a) * 2.1 + 4, Math.sin(a) * 2.1 + t * 2.6 + 4, 3) - 0.5) * 2);
      anillo.push(new THREE.Vector3(cx + Math.cos(a) * rr, t * ALTO, cz + Math.sin(a) * rr));
    }
    perfil.push(anillo);
  }

  const pos: number[] = [], col: number[] = [], idx: number[] = [];
  const cCorteza = new THREE.Color(PALETTE.bark), cClara = new THREE.Color(PALETTE.barkPale),
        cMusgo = new THREE.Color(0x4f6344), tmp = new THREE.Color();

  for (let i = 0; i <= ANILLOS; i++) {
    for (let j = 0; j < SEG; j++) {
      const v = perfil[i][j];
      pos.push(v.x, v.y, v.z);
      const n = fbm(v.x * 7 + 2, v.y * 7 + 2, 3);
      tmp.copy(cCorteza).lerp(cClara, clamp(n * 1.5 - 0.3, 0, 0.75));
      const musgoso = clamp((fbm(v.x * 3.4 + 30, v.y * 2.2 + 30, 3) - 0.42) * 3.4, 0, 1) * clamp(1 - v.y / ALTO * 1.1, 0, 1) * (v.z < 0 ? 1 : 0.35);
      tmp.lerp(cMusgo, musgoso * 0.85);
      col.push(tmp.r, tmp.g, tmp.b);
    }
  }
  for (let i = 0; i < ANILLOS; i++) {
    for (let j = 0; j < SEG; j++) {
      const jn = (j + 1) % SEG, a = i * SEG + j, b = i * SEG + jn, c2 = (i + 1) * SEG + j, d = (i + 1) * SEG + jn;
      idx.push(a, c2, b, b, c2, d);
    }
  }
  const geoLado = new THREE.BufferGeometry();
  geoLado.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geoLado.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  geoLado.setIndex(idx); geoLado.computeVertexNormals();
  const tronco = new THREE.Mesh(geoLado, new THREE.MeshStandardMaterial({
    vertexColors: true, roughness: 0.94, metalness: 0, flatShading: true }));
  tronco.castShadow = true; tronco.receiveShadow = true;

  const arriba = perfil[ANILLOS];
  const centro = new THREE.Vector3();
  arriba.forEach(v => centro.add(v)); centro.divideScalar(SEG);
  let rMax = 0;
  arriba.forEach(v => { rMax = Math.max(rMax, Math.hypot(v.x - centro.x, v.z - centro.z)); });
  const cpos: number[] = [], cuv: number[] = [], cidx: number[] = [];
  cpos.push(centro.x, centro.y + 0.012, centro.z); cuv.push(0.5, 0.5);
  arriba.forEach(v => {
    cpos.push(v.x, v.y + 0.004 + (fbm(v.x * 9, v.z * 9, 2) - 0.5) * 0.012, v.z);
    cuv.push(0.5 + (v.x - centro.x) / (2.05 * rMax), 0.5 + (v.z - centro.z) / (2.05 * rMax));
  });
  for (let j = 0; j < SEG; j++) cidx.push(0, 1 + j, 1 + (j + 1) % SEG);
  const geoCorte = new THREE.BufferGeometry();
  geoCorte.setAttribute('position', new THREE.Float32BufferAttribute(cpos, 3));
  geoCorte.setAttribute('uv', new THREE.Float32BufferAttribute(cuv, 2));
  geoCorte.setIndex(cidx); geoCorte.computeVertexNormals();
  const corte = new THREE.Mesh(geoCorte, new THREE.MeshStandardMaterial({
    map: texturaCorte(), roughness: 0.88, metalness: 0 }));
  corte.receiveShadow = true;

  const group = new THREE.Group();
  group.add(tronco, corte);

  const geoRaiz = new THREE.CylinderGeometry(0.02, 0.075, 1, 7, 1);
  geoRaiz.translate(0, -0.5, 0);
  const matRaiz = new THREE.MeshStandardMaterial({ color: PALETTE.bark, roughness: 0.95, flatShading: true });
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + rango(-0.3, 0.3);
    const raiz = new THREE.Mesh(geoRaiz, matRaiz);
    raiz.scale.set(rango(0.8, 1.25), rango(0.34, 0.58), rango(0.8, 1.25));
    raiz.position.set(Math.cos(a) * 0.16, 0.10, Math.sin(a) * 0.16);
    raiz.rotation.set(Math.sin(a) * 1.25, 0, -Math.cos(a) * 1.25);
    raiz.castShadow = true;
    group.add(raiz);
  }
  group.position.set(POSITIONS.trunk.x, base - 0.04, POSITIONS.trunk.z);
  group.rotation.y = -0.6;
  return group;
}
