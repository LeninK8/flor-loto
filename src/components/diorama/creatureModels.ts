import * as THREE from 'three';
import {
  CONFIG, PALETTE, POSITIONS, rnd, rango, fbm, clamp, alturaSuelo
} from './mathUtils';

interface PetalParams {
  largo: number;
  ancho: number;
  phi0: number;
  phi1: number;
  copa: number;
  curva: number;
  alturaBase: number;
  radioBase: number;
  torsion: number;
  variacion: number;
}

function geometriaPetalo(o: PetalParams) {
  const NL = 24, NW = 12;
  const ds = o.largo / NL;
  const R: number[] = [], Y: number[] = [], NX: number[] = [], NY: number[] = [], W: number[] = [];
  let r = o.radioBase, y = o.alturaBase;
  for (let i = 0; i <= NL; i++) {
    const t = i / NL;
    const phi = o.phi0 + (o.phi1 - o.phi0) * Math.pow(t, o.curva);
    R.push(r); Y.push(y);
    NX.push(Math.cos(phi)); NY.push(-Math.sin(phi));
    W.push(o.ancho * (0.45 + 0.55 * Math.sin(Math.PI * Math.pow(t, 0.55))) * (1 - Math.pow(t, 4)));
    r += Math.sin(phi) * ds; y += Math.cos(phi) * ds;
  }
  const cBase = new THREE.Color(PALETTE.petalBase), cMedio = new THREE.Color(PALETTE.petal),
        cPunta = new THREE.Color(PALETTE.petalTip), tmp = new THREE.Color();
  const pos: number[] = [], col: number[] = [], idx: number[] = [];
  for (let i = 0; i <= NL; i++) {
    const t = i / NL;
    for (let j = 0; j <= NW; j++) {
      const v = (j / NW) * 2 - 1;
      const copa = o.copa * v * v * W[i];
      const giro = o.torsion * t * t * W[i];
      pos.push(R[i] + copa * NX[i], Y[i] + copa * NY[i] + giro * 0.22, v * W[i] + giro);
      tmp.copy(cMedio)
         .lerp(cBase, clamp(1 - t * 3.0, 0, 1) * 0.9)
         .lerp(cPunta, clamp((t - 0.30) * 1.5, 0, 1) * (0.30 + 0.45 * v * v));
      const sombra = (0.80 + 0.22 * (1 - Math.pow(t, 1.3))) * (1 - 0.10 * v * v) * o.variacion;
      col.push(tmp.r * sombra, tmp.g * sombra, tmp.b * sombra);
    }
  }
  for (let i = 0; i < NL; i++) for (let j = 0; j < NW; j++) {
    const a = i * (NW + 1) + j, b = a + 1, c = a + (NW + 1), d = c + 1;
    idx.push(a, c, b, b, c, d);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

const matPetalo = new THREE.MeshStandardMaterial({
  vertexColors: true, roughness: 0.48, metalness: 0, side: THREE.DoubleSide,
  emissive: new THREE.Color(0x2b3322), emissiveIntensity: 0.35
});
const matSepalo = new THREE.MeshStandardMaterial({
  color: 0x7e9070, vertexColors: true, roughness: 0.8, metalness: 0, side: THREE.DoubleSide
});

const CAPAS_LOTO = [
  { n: 6,  largo: 1.00, ancho: 0.17, phi0: 0.72, phi1: 2.30, copa: 0.20, base: 0.00, radio: 0.075, curva: 1.30, sepalo: true },
  { n: 16, largo: 1.05, ancho: 0.20, phi0: 0.62, phi1: 1.92, copa: 0.30, base: 0.02, radio: 0.070, curva: 1.16 },
  { n: 14, largo: 0.94, ancho: 0.19, phi0: 0.52, phi1: 1.60, copa: 0.34, base: 0.05, radio: 0.062, curva: 1.14 },
  { n: 12, largo: 0.80, ancho: 0.17, phi0: 0.44, phi1: 1.26, copa: 0.38, base: 0.09, radio: 0.054, curva: 1.12 },
  { n: 10, largo: 0.64, ancho: 0.15, phi0: 0.36, phi1: 0.94, copa: 0.42, base: 0.13, radio: 0.046, curva: 1.10 },
  { n: 8,  largo: 0.46, ancho: 0.12, phi0: 0.30, phi1: 0.66, copa: 0.46, base: 0.17, radio: 0.038, curva: 1.08 }
];

function fusionar(items: { geo: THREE.BufferGeometry; matriz: THREE.Matrix4 }[]) {
  let nv = 0, ni = 0;
  items.forEach(it => { nv += it.geo.attributes.position.count; ni += it.geo.index!.count; });
  const pos = new Float32Array(nv * 3), col = new Float32Array(nv * 3), idx = new Uint32Array(ni);
  const v = new THREE.Vector3();
  let vo = 0, io = 0;
  items.forEach(it => {
    const P = it.geo.attributes.position, C = it.geo.attributes.color, I = it.geo.index!;
    for (let i = 0; i < P.count; i++) {
      v.set(P.getX(i), P.getY(i), P.getZ(i)).applyMatrix4(it.matriz);
      pos[(vo + i) * 3] = v.x; pos[(vo + i) * 3 + 1] = v.y; pos[(vo + i) * 3 + 2] = v.z;
      col[(vo + i) * 3] = C.getX(i); col[(vo + i) * 3 + 1] = C.getY(i); col[(vo + i) * 3 + 2] = C.getZ(i);
    }
    for (let i = 0; i < I.count; i++) idx[io + i] = I.getX(i) + vo;
    vo += P.count; io += I.count;
    it.geo.dispose();
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.setIndex(new THREE.BufferAttribute(idx, 1));
  g.computeVertexNormals();
  return g;
}

export function createLotusFlower(escala: number, abierto: boolean) {
  const flor = new THREE.Group();
  const petalos: { geo: THREE.BufferGeometry; matriz: THREE.Matrix4 }[] = [];
  const sepalos: { geo: THREE.BufferGeometry; matriz: THREE.Matrix4 }[] = [];
  const m = new THREE.Matrix4();

  CAPAS_LOTO.forEach((capa, ci) => {
    if (!abierto && capa.sepalo) return;
    for (let i = 0; i < capa.n; i++) {
      const g = geometriaPetalo({
        largo: capa.largo * rango(0.93, 1.08),
        ancho: capa.ancho * rango(0.92, 1.12),
        phi0: abierto ? capa.phi0 : capa.phi0 * 0.35,
        phi1: abierto ? capa.phi1 + rango(-0.1, 0.1) : Math.min(capa.phi1, 0.14 + ci * 0.035),
        copa: capa.copa, curva: capa.curva,
        alturaBase: capa.base, radioBase: capa.radio * (abierto ? 1 : 0.6),
        torsion: rango(-0.22, 0.22), variacion: rango(0.92, 1.08)
      });
      m.makeRotationY((i / capa.n) * Math.PI * 2 + ci * 0.47 + rango(-0.05, 0.05));
      (capa.sepalo ? sepalos : petalos).push({ geo: g, matriz: m.clone() });
    }
  });

  if (petalos.length) {
    const malla = new THREE.Mesh(fusionar(petalos), matPetalo);
    malla.castShadow = true; malla.receiveShadow = true; malla.name = 'Petals';
    flor.add(malla);
  }
  if (sepalos.length) {
    const malla = new THREE.Mesh(fusionar(sepalos), matSepalo);
    malla.castShadow = true; malla.receiveShadow = true; malla.name = 'Sepals';
    flor.add(malla);
  }

  if (abierto) {
    const recep = new THREE.Mesh(
      new THREE.SphereGeometry(0.105, 24, 14, 0, Math.PI * 2, 0, Math.PI * 0.55),
      new THREE.MeshStandardMaterial({
        color: 0xcfd19c, roughness: 0.62, metalness: 0.05,
        emissive: new THREE.Color(0x3a3a18), emissiveIntensity: 0.5
      }));
    recep.scale.y = 0.8; recep.position.y = 0.175; recep.castShadow = true;
    flor.add(recep);

    const mm = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(),
          v = new THREE.Vector3(), sc = new THREE.Vector3();

    const geoHueco = new THREE.CylinderGeometry(0.011, 0.011, 0.02, 6);
    const matHueco = new THREE.MeshStandardMaterial({ color: 0x6f7042, roughness: 0.9 });
    const huecos = new THREE.InstancedMesh(geoHueco, matHueco, 9);
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2, rr = i === 0 ? 0 : 0.055;
      v.set(Math.sin(a) * rr, 0.245, Math.cos(a) * rr);
      q.identity(); sc.set(1, 1, 1);
      mm.compose(v, q, sc); huecos.setMatrixAt(i, mm);
    }
    flor.add(huecos);

    const geoHilo = new THREE.CylinderGeometry(0.0035, 0.006, 1, 4);
    geoHilo.translate(0, 0.5, 0);
    const geoPunta = new THREE.SphereGeometry(0.012, 6, 5);
    const matHilo = new THREE.MeshStandardMaterial({ color: PALETTE.stamen, roughness: 0.55 });
    const matPunta = new THREE.MeshStandardMaterial({
      color: PALETTE.goldPale, roughness: 0.4,
      emissive: new THREE.Color(0x6a5220), emissiveIntensity: 0.6
    });

    const anillos = [{ n: 16, r: 0.075 }, { n: 24, r: 0.110 }, { n: 32, r: 0.145 }];
    let total = 0;
    anillos.forEach(a => total += a.n);
    const hilos = new THREE.InstancedMesh(geoHilo, matHilo, total);
    const puntas = new THREE.InstancedMesh(geoPunta, matPunta, total);
    hilos.castShadow = true;
    let k = 0;
    anillos.forEach((anillo, ia) => {
      for (let i = 0; i < anillo.n; i++) {
        const a = (i / anillo.n) * Math.PI * 2 + ia * 0.3;
        const largo = 0.20 - ia * 0.02 + rango(0, 0.04);
        const inc = 0.25 + ia * 0.28 + rango(0, 0.12);
        q.setFromEuler(e.set(Math.cos(a) * inc, 0, -Math.sin(a) * inc));
        v.set(Math.sin(a) * anillo.r, 0.17, Math.cos(a) * anillo.r);
        sc.set(1, largo, 1);
        mm.compose(v, q, sc); hilos.setMatrixAt(k, mm);
        v.set(Math.sin(a) * (anillo.r + Math.sin(inc) * largo), 0.17 + Math.cos(inc) * largo,
              Math.cos(a) * (anillo.r + Math.sin(inc) * largo));
        q.identity(); sc.set(0.75, 1.5, 0.75);
        mm.compose(v, q, sc); puntas.setMatrixAt(k, mm);
        k++;
      }
    });
    flor.add(hilos, puntas);
  }

  flor.scale.setScalar(escala);
  return flor;
}

export function createLotusStem(destino: { x: number; z: number }, alturaFlor: number) {
  const curva = new THREE.CatmullRomCurve3([
    new THREE.Vector3(destino.x + 0.10, -0.45, destino.z + 0.12),
    new THREE.Vector3(destino.x + 0.05, -0.22, destino.z + 0.06),
    new THREE.Vector3(destino.x - 0.02, -0.02, destino.z + 0.01),
    new THREE.Vector3(destino.x, alturaFlor * 0.55, destino.z),
    new THREE.Vector3(destino.x, alturaFlor, destino.z)
  ]);
  const tallo = new THREE.Mesh(
    new THREE.TubeGeometry(curva, 26, 0.017, 7, false),
    new THREE.MeshStandardMaterial({ color: 0x5d7a4e, roughness: 0.85 }));
  tallo.castShadow = true; tallo.name = 'LotusStem';
  return tallo;
}

export function createLotus() {
  const altura = 0.19;
  const flor = createLotusFlower(CONFIG.lotusScale, true);
  flor.position.set(POSITIONS.lotus.x, altura, POSITIONS.lotus.z);
  flor.name = 'MainLotus';
  const group = new THREE.Group();
  group.add(flor, createLotusStem(POSITIONS.lotus, altura));
  return { mainGroup: group, florMalla: flor };
}

export function createLilyPads() {
  const group = new THREE.Group();
  const matBase = { roughness: 0.72, metalness: 0.02, side: THREE.DoubleSide };
  const colocados: { x: number; z: number; r: number }[] = [];
  for (let i = 0; i < 16; i++) {
    const radio = rango(0.22, 0.42);
    const hueco = rango(0.28, 0.6);
    const forma = new THREE.Shape();
    forma.moveTo(0, 0);
    forma.absarc(0, 0, 1, hueco / 2, Math.PI * 2 - hueco / 2, false);
    forma.lineTo(0, 0);
    const geo = new THREE.ShapeGeometry(forma, 40);
    geo.rotateX(-Math.PI / 2);
    const p = geo.attributes.position;
    for (let k = 0; k < p.count; k++) {
      const x = p.getX(k), z = p.getZ(k);
      const rr = Math.hypot(x, z);
      if (rr > 0.01) {
        const f = 1 + 0.10 * (fbm(x * 3 + i * 7, z * 3 + i * 7, 2) - 0.5) * 2;
        p.setX(k, x * f); p.setZ(k, z * f);
      }
      p.setY(k, Math.pow(rr, 2.4) * 0.16);
    }
    geo.computeVertexNormals();

    let x = 0, z = 0, ok = false;
    for (let intento = 0; intento < 50 && !ok; intento++) {
      const a = rnd() * Math.PI * 2, rr = rango(0.42, CONFIG.pondRadius - radio - 0.16);
      x = Math.cos(a) * rr; z = Math.sin(a) * rr;
      const dLoto = Math.hypot(x - POSITIONS.lotus.x, z - POSITIONS.lotus.z);
      ok = dLoto > radio + 0.34 && colocados.every(c => Math.hypot(c.x - x, c.z - z) > (c.r + radio) * 0.95);
    }
    if (!ok) continue;
    colocados.push({ x, z, r: radio });
    const mat = new THREE.MeshStandardMaterial(Object.assign({}, matBase, {
      color: new THREE.Color(rnd() < 0.4 ? 0x3f6340 : 0x4c7048).offsetHSL(rango(-0.03, 0.03), rango(-0.08, 0.06), rango(-0.08, 0.06))
    }));
    const hoja = new THREE.Mesh(geo, mat);
    hoja.scale.set(radio, radio * rango(0.8, 1.25), radio);
    hoja.position.set(x, 0.012 + i * 0.0012, z);
    hoja.rotation.y = rnd() * Math.PI * 2;
    hoja.receiveShadow = true; hoja.castShadow = true;
    group.add(hoja);
  }
  return { group, colocados };
}

export function createClosedLotusBuds(ocupados: { x: number; z: number; r: number }[]) {
  const group = new THREE.Group();
  const sitios: { x: number; z: number }[] = [];
  for (let i = 0; i < 3; i++) {
    for (let intento = 0; intento < 60; intento++) {
      const a = rnd() * Math.PI * 2, rr = rango(0.75, CONFIG.pondRadius - 0.45);
      const x = Math.cos(a) * rr, z = Math.sin(a) * rr;
      if (Math.hypot(x - POSITIONS.lotus.x, z - POSITIONS.lotus.z) < 0.65) continue;
      if (!ocupados.every(c => Math.hypot(c.x - x, c.z - z) > c.r + 0.16)) continue;
      if (!sitios.every(c => Math.hypot(c.x - x, c.z - z) > 0.5)) continue;
      sitios.push({ x, z });
      const esc = CONFIG.lotusScale * rango(0.30, 0.45);
      const alto = rango(0.13, 0.26);
      const brote = createLotusFlower(esc, false);
      brote.position.set(x, alto, z);
      brote.rotation.z = rango(-0.22, 0.22);
      brote.rotation.x = rango(-0.18, 0.18);
      brote.name = 'LotusBud_' + i;
      group.add(brote, createLotusStem({ x, z }, alto));
      break;
    }
  }
  return group;
}

export function createMagicalStone() {
  const p = POSITIONS.magicalStone;
  const base = alturaSuelo(p.x, p.z);
  const geo = new THREE.IcosahedronGeometry(0.085, 1);
  const a = geo.attributes.position;
  for (let i = 0; i < a.count; i++) {
    const f = 0.82 + fbm(a.getX(i) * 6 + 3, a.getZ(i) * 6 + 3, 2) * 0.4;
    a.setXYZ(i, a.getX(i) * f, a.getY(i) * f * 1.25, a.getZ(i) * f);
  }
  geo.computeVertexNormals();
  const piedra = new THREE.Mesh(geo, new THREE.MeshPhysicalMaterial({
    color: 0x3f9e6b, roughness: 0.22, metalness: 0.05, transparent: true, opacity: 0.88,
    clearcoat: 0.9, clearcoatRoughness: 0.1,
    emissive: new THREE.Color(0x1d7a4c), emissiveIntensity: 0.9, flatShading: true }));
  piedra.castShadow = true;
  const nucleo = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 10),
    new THREE.MeshBasicMaterial({ color: 0xa9ffcf }));
  piedra.add(nucleo);

  const soporte = new THREE.Mesh(
    new THREE.TorusGeometry(0.075, 0.016, 8, 22, Math.PI * 1.35),
    new THREE.MeshStandardMaterial({ color: 0x3f5342, roughness: 0.85 }));
  soporte.rotation.x = Math.PI * 0.5; soporte.rotation.z = 0.5;
  soporte.position.y = 0.012;
  soporte.receiveShadow = true;
  piedra.position.y = 0.085;

  const group = new THREE.Group();
  group.add(piedra, soporte);
  group.position.set(p.x, base + 0.01, p.z);
  group.name = 'MagicalStone';
  return { group, piedra };
}

export function createCat() {
  const p = POSITIONS.cat;
  const base = alturaSuelo(p.x, p.z);
  const matPelo = new THREE.MeshStandardMaterial({ color: PALETTE.catFur, roughness: 0.88, metalness: 0 });
  const matVientre = new THREE.MeshStandardMaterial({ color: PALETTE.catBelly, roughness: 0.9 });
  const matOscuro = new THREE.MeshStandardMaterial({ color: 0x5e6165, roughness: 0.9 });
  const matRosa = new THREE.MeshStandardMaterial({ color: 0xc8969a, roughness: 0.7 });

  const g = new THREE.Group();
  g.name = 'Cat';

  const torso = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 16), matPelo);
  torso.scale.set(0.105, 0.155, 0.125);
  torso.position.set(0, 0.155, 0);
  torso.rotation.x = -0.12;
  g.add(torso);

  const pecho = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), matVientre);
  pecho.scale.set(0.072, 0.095, 0.06);
  pecho.position.set(0, 0.135, 0.075);
  g.add(pecho);

  [-1, 1].forEach(s => {
    const cadera = new THREE.Mesh(new THREE.SphereGeometry(1, 14, 12), matPelo);
    cadera.scale.set(0.048, 0.055, 0.082);
    cadera.position.set(s * 0.078, 0.055, -0.018);
    g.add(cadera);
    const pataT = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 10), matPelo);
    pataT.scale.set(0.034, 0.026, 0.055);
    pataT.position.set(s * 0.082, 0.026, 0.045);
    g.add(pataT);
  });

  const geoPata = new THREE.CylinderGeometry(0.023, 0.026, 1, 10);
  geoPata.translate(0, 0.5, 0);
  [-1, 1].forEach(s => {
    const pata = new THREE.Mesh(geoPata, matPelo);
    pata.scale.set(1, 0.155, 1);
    pata.position.set(s * 0.048, 0.0, 0.082);
    pata.rotation.x = 0.06;
    g.add(pata);
    const zarpa = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 10), matVientre);
    zarpa.scale.set(0.028, 0.02, 0.036);
    zarpa.position.set(s * 0.048, 0.018, 0.098);
    g.add(zarpa);
  });

  const cabeza = new THREE.Mesh(new THREE.SphereGeometry(1, 22, 18), matPelo);
  cabeza.scale.set(0.082, 0.076, 0.078);
  cabeza.position.set(0, 0.305, 0.028);
  g.add(cabeza);

  const hocico = new THREE.Mesh(new THREE.SphereGeometry(1, 14, 12), matVientre);
  hocico.scale.set(0.042, 0.03, 0.032);
  hocico.position.set(0, 0.286, 0.088);
  g.add(hocico);

  const nariz = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 8), matRosa);
  nariz.scale.set(0.012, 0.009, 0.008);
  nariz.position.set(0, 0.297, 0.112);
  g.add(nariz);

  [-1, 1].forEach(s => {
    const oreja = new THREE.Mesh(new THREE.ConeGeometry(0.036, 0.062, 4), matPelo);
    oreja.position.set(s * 0.052, 0.372, 0.012);
    oreja.rotation.set(-0.12, Math.PI * 0.25, s * 0.26);
    g.add(oreja);
    const dentro = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.038, 4), matRosa);
    dentro.position.set(s * 0.052, 0.368, 0.028);
    dentro.rotation.set(-0.12, Math.PI * 0.25, s * 0.26);
    g.add(dentro);
  });

  [-1, 1].forEach(s => {
    const ojo = new THREE.Mesh(new THREE.SphereGeometry(0.019, 14, 12),
      new THREE.MeshStandardMaterial({
        color: PALETTE.catEye, roughness: 0.18, metalness: 0.1,
        emissive: new THREE.Color(0x2f6f28), emissiveIntensity: 0.55
      }));
    ojo.position.set(s * 0.035, 0.318, 0.072);
    ojo.scale.set(1, 1.08, 0.7);
    g.add(ojo);
    const pupila = new THREE.Mesh(new THREE.SphereGeometry(0.008, 10, 8),
      new THREE.MeshBasicMaterial({ color: 0x0d1410 }));
    pupila.scale.set(0.5, 1.5, 0.5);
    pupila.position.set(s * 0.035, 0.318, 0.085);
    g.add(pupila);
    const brillo = new THREE.Mesh(new THREE.SphereGeometry(0.0035, 8, 6),
      new THREE.MeshBasicMaterial({ color: 0xffffff }));
    brillo.position.set(s * 0.035 + 0.006, 0.325, 0.087);
    g.add(brillo);
  });

  const curvaCola = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.02, 0.05, -0.1),
    new THREE.Vector3(0.12, 0.035, -0.12),
    new THREE.Vector3(0.18, 0.03, -0.02),
    new THREE.Vector3(0.155, 0.028, 0.08),
    new THREE.Vector3(0.075, 0.026, 0.115)
  ]);
  const cola = new THREE.Mesh(new THREE.TubeGeometry(curvaCola, 34, 0.019, 8, false), matPelo);
  g.add(cola);
  const puntaCola = new THREE.Mesh(new THREE.SphereGeometry(0.019, 10, 8), matOscuro);
  puntaCola.position.copy(curvaCola.getPoint(1));
  g.add(puntaCola);

  g.traverse(o => { if ((o as THREE.Mesh).isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  g.position.set(p.x, base, p.z);
  g.rotation.y = Math.atan2(POSITIONS.lotus.x - p.x, POSITIONS.lotus.z - p.z);

  // Varita
  const madera = new THREE.MeshStandardMaterial({ color: 0x6b4f34, roughness: 0.72 });
  const mango = new THREE.MeshStandardMaterial({ color: 0x4f3927, roughness: 0.8 });
  const v = new THREE.Group();
  v.name = 'Wand';
  const cuerpo = new THREE.Mesh(new THREE.CylinderGeometry(0.0055, 0.0022, 0.24, 7), madera);
  cuerpo.position.y = 0.12;
  v.add(cuerpo);
  const nudo = new THREE.Mesh(new THREE.SphereGeometry(0.011, 10, 8), mango);
  nudo.scale.set(1, 1.5, 1); nudo.position.y = 0.018; v.add(nudo);
  for (let i = 0; i < 3; i++) {
    const anillo = new THREE.Mesh(new THREE.TorusGeometry(0.0062, 0.0016, 6, 12), mango);
    anillo.rotation.x = Math.PI / 2; anillo.position.y = 0.042 + i * 0.016;
    v.add(anillo);
  }
  v.traverse(o => { if ((o as THREE.Mesh).isMesh) o.castShadow = true; });
  v.position.set(0.048, 0.012, 0.098);
  v.rotation.set(0.38, 0, -0.30);
  g.add(v);

  return g;
}

export function createRings() {
  const p = POSITIONS.rings;
  const matOro = new THREE.MeshStandardMaterial({ color: PALETTE.gold, roughness: 0.28, metalness: 0.95 });
  const matOroViejo = new THREE.MeshStandardMaterial({ color: 0x9c7f45, roughness: 0.45, metalness: 0.9 });
  const group = new THREE.Group();
  group.name = 'Rings';

  const disposicion = [
    { dx:  0.000, dz:  0.000, r: 0.020, t: 0.0045, mat: matOro,      tumbado: true },
    { dx:  0.055, dz:  0.022, r: 0.016, t: 0.0036, mat: matOroViejo, tumbado: true },
    { dx: -0.048, dz:  0.036, r: 0.018, t: 0.0038, mat: matOro,      tumbado: true },
    { dx:  0.010, dz:  0.068, r: 0.014, t: 0.0032, mat: matOroViejo, tumbado: false }
  ];
  disposicion.forEach((d) => {
    const anillo = new THREE.Mesh(new THREE.TorusGeometry(d.r, d.t, 10, 34), d.mat);
    const x = p.x + d.dx, z = p.z + d.dz;
    const y = alturaSuelo(x, z);
    if (d.tumbado) {
      anillo.rotation.set(Math.PI / 2 + rango(-0.06, 0.06), rango(0, Math.PI), rango(-0.1, 0.1));
      anillo.position.set(x, y + d.t + 0.002, z);
    } else {
      anillo.rotation.set(Math.PI * 0.5 - 0.75, 0.4, 0.1);
      anillo.position.set(x, y + d.r * 0.72, z);
      const guijarro = new THREE.Mesh(new THREE.IcosahedronGeometry(0.013, 0),
        new THREE.MeshStandardMaterial({ color: PALETTE.stone, roughness: 0.95, flatShading: true }));
      guijarro.position.set(x + 0.007, y + 0.007, z - 0.009);
      guijarro.castShadow = true; guijarro.receiveShadow = true;
      group.add(guijarro);
    }
    anillo.castShadow = true; anillo.receiveShadow = true;
    group.add(anillo);
  });
  return group;
}

export function createBubbleTea() {
  const p = POSITIONS.bubbleTea;
  const base = alturaSuelo(p.x, p.z);
  const g = new THREE.Group();
  g.name = 'BubbleTea';

  const vaso = new THREE.Mesh(
    new THREE.CylinderGeometry(0.050, 0.038, 0.145, 26, 1, true),
    new THREE.MeshPhysicalMaterial({
      color: 0xdff0f2, roughness: 0.06, metalness: 0,
      transparent: true, opacity: 0.24, side: THREE.DoubleSide, clearcoat: 1
    }));
  vaso.position.y = 0.0725;
  g.add(vaso);

  const fondo = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.038, 0.004, 26),
    new THREE.MeshPhysicalMaterial({ color: 0xdff0f2, roughness: 0.06, transparent: true, opacity: 0.32 }));
  fondo.position.y = 0.002; g.add(fondo);

  const te = new THREE.Mesh(new THREE.CylinderGeometry(0.0465, 0.0362, 0.105, 26),
    new THREE.MeshStandardMaterial({ color: 0xc9a07a, roughness: 0.35, transparent: true, opacity: 0.92 }));
  te.position.y = 0.055; g.add(te);

  const geoBoba = new THREE.SphereGeometry(0.0095, 10, 8);
  const matBoba = new THREE.MeshStandardMaterial({ color: 0x241a16, roughness: 0.4 });
  for (let i = 0; i < 11; i++) {
    const a = rnd() * Math.PI * 2, rr = rnd() * 0.026;
    const b = new THREE.Mesh(geoBoba, matBoba);
    b.position.set(Math.cos(a) * rr, 0.012 + rnd() * 0.018, Math.sin(a) * rr);
    g.add(b);
  }

  const tapa = new THREE.Mesh(new THREE.CylinderGeometry(0.053, 0.051, 0.012, 26),
    new THREE.MeshStandardMaterial({ color: 0xeef3f2, roughness: 0.35, transparent: true, opacity: 0.75 }));
  tapa.position.y = 0.148; g.add(tapa);

  const domo = new THREE.Mesh(new THREE.SphereGeometry(0.051, 20, 10, 0, Math.PI * 2, 0, Math.PI * 0.42),
    new THREE.MeshPhysicalMaterial({ color: 0xeef3f2, roughness: 0.08, transparent: true, opacity: 0.35 }));
  domo.position.y = 0.152; g.add(domo);

  const pajilla = new THREE.Mesh(new THREE.CylinderGeometry(0.0075, 0.0075, 0.24, 10),
    new THREE.MeshStandardMaterial({ color: 0xd08a9c, roughness: 0.4 }));
  pajilla.position.set(0.012, 0.145, 0.006);
  pajilla.rotation.z = -0.22;
  g.add(pajilla);

  g.traverse(o => { if ((o as THREE.Mesh).isMesh) o.castShadow = true; });
  g.position.set(p.x, base, p.z);
  g.rotation.y = rango(0, Math.PI * 2);
  return g;
}

export function createMakiPlate() {
  const p = POSITIONS.makiPlate;
  const base = alturaSuelo(p.x, p.z);
  const g = new THREE.Group();
  g.name = 'MakiPlate';

  const plato = new THREE.Mesh(new THREE.CylinderGeometry(0.105, 0.085, 0.012, 34),
    new THREE.MeshStandardMaterial({ color: 0x2b3336, roughness: 0.35, metalness: 0.05 }));
  plato.position.y = 0.006; plato.receiveShadow = true; g.add(plato);

  const geoNori = new THREE.CylinderGeometry(0.029, 0.029, 0.034, 20, 1, true);
  const geoArroz = new THREE.CylinderGeometry(0.0272, 0.0272, 0.0345, 20);
  const geoRelleno = new THREE.CylinderGeometry(0.0085, 0.0085, 0.036, 12);
  const matNori = new THREE.MeshStandardMaterial({ color: 0x1b2a22, roughness: 0.75, side: THREE.DoubleSide });
  const matArroz = new THREE.MeshStandardMaterial({ color: 0xece6d8, roughness: 0.85 });
  const matSalmon = new THREE.MeshStandardMaterial({ color: 0xd88b6a, roughness: 0.6 });

  const sitios = [[0, 0], [0.055, 0.012], [-0.05, 0.022], [0.022, -0.052], [-0.028, -0.046]];
  sitios.forEach(s => {
    const rollo = new THREE.Group();
    rollo.add(new THREE.Mesh(geoNori, matNori));
    rollo.add(new THREE.Mesh(geoArroz, matArroz));
    rollo.add(new THREE.Mesh(geoRelleno, matSalmon));
    rollo.position.set(s[0], 0.029, s[1]);
    rollo.rotation.y = rnd() * Math.PI;
    rollo.traverse(o => { if ((o as THREE.Mesh).isMesh) o.castShadow = true; });
    g.add(rollo);
  });

  g.position.set(p.x, base, p.z);
  g.rotation.y = rango(0, Math.PI);
  return g;
}
