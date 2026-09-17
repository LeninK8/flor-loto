import * as THREE from 'three';
import {
  CONFIG, PALETTE, POSITIONS, rnd, rango, alturaSuelo, reservar
} from './mathUtils';
import { TrackInfo } from '../../types';

export const PLATO_LOCAL = new THREE.Vector3(-0.045, 0.098, 0.012);

export const PLAYLIST: TrackInfo[] = [
  { id: 'track_01', title: 'Bossa No Sé', artist: 'Cuco ft. Jean Carter', youtubeId: 'WETqSfvkZB8', loop: false, color: '#e64980', description: 'Bossa No Sé' },
  { id: 'track_02', title: 'Hydrocodone', artist: 'Cuco', youtubeId: '4MULjbUhIz4', loop: false, color: '#4dabf7', description: 'Hydrocodone' },
  { id: 'track_03', title: 'Keeping Tabs', artist: 'Cuco ft. Suscat0', youtubeId: 'MwmqapFpICY', loop: false, color: '#ffd43b', description: 'Keeping Tabs' },
  { id: 'track_04', title: 'Lover Is a Day', artist: 'Cuco', youtubeId: 'MyVGaFzhhwE', loop: false, color: '#f06595', description: 'Lover Is a Day' },
  { id: 'track_05', title: 'Amor de Siempre', artist: 'Cuco', youtubeId: 'awOtVH2gNaQ', loop: false, color: '#ff6b6b', description: 'Amor de Siempre' },
  { id: 'track_06', title: 'We Had to End It', artist: 'Cuco', youtubeId: 'y9LlnLTH87U', loop: false, color: '#845ef7', description: 'We Had to End It' },
  { id: 'track_07', title: 'Sunnyside', artist: 'Cuco', youtubeId: 'cIQQ5i5ZUUk', loop: false, color: '#ff922b', description: 'Sunnyside' },
  { id: 'track_08', title: 'First of the Year', artist: 'Cuco', youtubeId: 'aiPvwSokvRI', loop: false, color: '#20c997', description: 'First of the Year' },
  { id: 'track_09', title: 'Summertime Hightime', artist: 'Cuco ft. J-Kwe$t', youtubeId: 'Z0CQf3JDKAY', loop: false, color: '#fab005', description: 'Summertime Hightime' },
  { id: 'track_10', title: 'Neon Baby', artist: 'Cuco', youtubeId: '_jRZQ1KgAwg', loop: false, color: '#cc5de8', description: 'Neon Baby' },
  { id: 'track_11', title: 'Feelings', artist: 'Cuco', youtubeId: 'Bb437c63HSo', loop: false, color: '#51cf66', description: 'Feelings' },
  { id: 'track_12', title: "Winter's Ballad", artist: 'Cuco', youtubeId: '-2yAEUp9v6M', loop: false, color: '#339af0', description: "Winter's Ballad" },
  { id: 'track_13', title: 'Lucy', artist: 'Cuco ft. J-Kwe$t', youtubeId: 'rcNSXsBSWFE', loop: false, color: '#ff8787', description: 'Lucy' },
  { id: 'track_14', title: 'Far Away From Home', artist: 'Cuco', youtubeId: 'Ki07TlWyjco', loop: false, color: '#94d82d', description: 'Far Away From Home' },
  { id: 'track_15', title: 'Lava Lamp', artist: 'Cuco', youtubeId: 'QohJk098UXk', loop: false, color: '#f76707', description: 'Lava Lamp' },
  { id: 'track_16', title: 'Dontmakemefallinlove', artist: 'Cuco', youtubeId: 'fqaAP1D02nc', loop: false, color: '#e599f7', description: 'Dontmakemefallinlove' }
];

function texturaMadera() {
  const c = document.createElement('canvas'); c.width = 512; c.height = 512;
  const g = c.getContext('2d')!;
  g.fillStyle = '#3d2b1d'; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 240; i++) {
    const y = Math.random() * 512;
    g.strokeStyle = 'rgba(' + (90 + Math.random() * 60 | 0) + ',' + (64 + Math.random() * 40 | 0) + ',' + (42 + Math.random() * 30 | 0) + ',0.22)';
    g.lineWidth = 0.6 + Math.random() * 2.4;
    g.beginPath();
    for (let x = 0; x <= 512; x += 16) g.lineTo(x, y + Math.sin(x * 0.02 + i) * 3.5 + Math.sin(x * 0.005) * 8);
    g.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

function rectRedondeado(ancho: number, fondo: number, radio: number) {
  const s = new THREE.Shape();
  const w = ancho / 2, h = fondo / 2, r = radio;
  s.moveTo(-w + r, -h);
  s.lineTo(w - r, -h); s.quadraticCurveTo(w, -h, w, -h + r);
  s.lineTo(w, h - r);  s.quadraticCurveTo(w, h, w - r, h);
  s.lineTo(-w + r, h); s.quadraticCurveTo(-w, h, -w, h - r);
  s.lineTo(-w, -h + r); s.quadraticCurveTo(-w, -h, -w + r, -h);
  return s;
}

export function createTurntable() {
  const p = POSITIONS.turntable;
  const base = alturaSuelo(p.x, p.z);
  const group = new THREE.Group();

  const geoBase = new THREE.ExtrudeGeometry(rectRedondeado(0.44, 0.36, 0.035), {
    depth: 0.085, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.008, bevelSegments: 3, curveSegments: 8
  });
  geoBase.rotateX(-Math.PI / 2);
  const madera = texturaMadera();
  const cuerpo = new THREE.Mesh(geoBase, new THREE.MeshStandardMaterial({
    map: madera, color: 0xb08a63, roughness: 0.62, metalness: 0.05 }));
  cuerpo.castShadow = true; cuerpo.receiveShadow = true;
  group.add(cuerpo);

  const plato = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.138, 0.016, 48),
    new THREE.MeshStandardMaterial({ color: 0x8d9095, roughness: 0.28, metalness: 0.92 }));
  plato.position.copy(PLATO_LOCAL);
  plato.castShadow = true; plato.receiveShadow = true;
  group.add(plato);

  const mat = new THREE.Mesh(new THREE.CylinderGeometry(0.133, 0.133, 0.003, 44),
    new THREE.MeshStandardMaterial({ color: 0x20242a, roughness: 0.95 }));
  mat.position.set(PLATO_LOCAL.x, PLATO_LOCAL.y + 0.0095, PLATO_LOCAL.z);
  group.add(mat);

  const eje = new THREE.Mesh(new THREE.CylinderGeometry(0.0035, 0.0035, 0.036, 10),
    new THREE.MeshStandardMaterial({ color: 0xc8ccd0, roughness: 0.2, metalness: 0.95 }));
  eje.position.set(PLATO_LOCAL.x, PLATO_LOCAL.y + 0.026, PLATO_LOCAL.z);
  group.add(eje);

  const brazo = new THREE.Group();
  brazo.position.set(0.155, 0.098, -0.118);
  const pivote = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.028, 0.036, 18),
    new THREE.MeshStandardMaterial({ color: 0x9aa0a6, roughness: 0.3, metalness: 0.9 }));
  pivote.position.y = 0.012; pivote.castShadow = true;
  brazo.add(pivote);

  const tubo = new THREE.Mesh(new THREE.CylinderGeometry(0.0055, 0.0055, 0.21, 10),
    new THREE.MeshStandardMaterial({ color: 0xb9bec3, roughness: 0.25, metalness: 0.9 }));
  tubo.rotation.z = Math.PI / 2;
  tubo.position.set(-0.098, 0.03, 0);
  tubo.castShadow = true;
  brazo.add(tubo);

  const contrapeso = new THREE.Mesh(new THREE.CylinderGeometry(0.017, 0.017, 0.026, 14),
    new THREE.MeshStandardMaterial({ color: 0x3a3f45, roughness: 0.4, metalness: 0.7 }));
  contrapeso.rotation.z = Math.PI / 2; contrapeso.position.set(0.038, 0.03, 0);
  brazo.add(contrapeso);

  const cabezal = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.016, 0.018),
    new THREE.MeshStandardMaterial({ color: 0x2b2f34, roughness: 0.5 }));
  cabezal.position.set(-0.206, 0.026, 0); cabezal.castShadow = true;
  brazo.add(cabezal);

  const aguja = new THREE.Mesh(new THREE.ConeGeometry(0.0022, 0.012, 6),
    new THREE.MeshStandardMaterial({ color: 0xdfe3e6, roughness: 0.2, metalness: 0.9 }));
  aguja.position.set(-0.214, 0.013, 0); aguja.rotation.x = Math.PI;
  brazo.add(aguja);
  brazo.rotation.y = 0.55;
  group.add(brazo);

  const perilla = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.018, 0.014, 18),
    new THREE.MeshStandardMaterial({ color: 0x2f333a, roughness: 0.45, metalness: 0.4 }));
  perilla.position.set(0.16, 0.092, 0.115); perilla.castShadow = true;
  const marca = new THREE.Mesh(new THREE.BoxGeometry(0.002, 0.002, 0.012),
    new THREE.MeshStandardMaterial({ color: PALETTE.goldPale, roughness: 0.3, metalness: 0.8 }));
  marca.position.set(0.16, 0.100, 0.122);

  const boton = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.008, 14),
    new THREE.MeshStandardMaterial({
      color: 0xd8a24e, roughness: 0.35, metalness: 0.5,
      emissive: new THREE.Color(0x3a2404), emissiveIntensity: 0.4
    }));
  boton.position.set(0.105, 0.089, 0.132);

  const interruptor = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.007, 0.011),
    new THREE.MeshStandardMaterial({ color: 0x4a4f55, roughness: 0.4, metalness: 0.6 }));
  interruptor.position.set(0.055, 0.089, 0.135); interruptor.rotation.x = -0.25;
  group.add(perilla, marca, boton, interruptor);

  const bombilla = new THREE.Mesh(new THREE.SphereGeometry(0.012, 12, 10),
    new THREE.MeshBasicMaterial({ color: 0xffcb84 }));
  bombilla.position.set(-0.19, 0.115, 0.13);
  group.add(bombilla);

  group.position.set(p.x, base, p.z);
  group.rotation.y = Math.atan2(-p.x, -p.z) - 0.35;
  group.name = 'Turntable';

  return { group, platoMalla: plato, brazo, boton, lampara: bombilla };
}

function texturaVinilo(colorEtiqueta: string, numero: number) {
  const c = document.createElement('canvas'); c.width = c.height = 512;
  const g = c.getContext('2d')!;
  g.fillStyle = '#0c0c0e'; g.fillRect(0, 0, 512, 512);
  for (let r = 250; r > 150; r -= 2.2) {
    g.beginPath(); g.arc(256, 256, r, 0, Math.PI * 2);
    g.strokeStyle = 'rgba(255,255,255,' + (0.015 + Math.random() * 0.03) + ')';
    g.lineWidth = 1; g.stroke();
  }
  g.beginPath(); g.arc(256, 256, 150, 0, Math.PI * 2); g.fillStyle = colorEtiqueta; g.fill();
  g.beginPath(); g.arc(256, 256, 150, 0, Math.PI * 2); g.strokeStyle = 'rgba(0,0,0,0.35)'; g.lineWidth = 3; g.stroke();
  g.beginPath(); g.arc(256, 256, 128, 0, Math.PI * 2); g.strokeStyle = 'rgba(255,255,255,0.28)'; g.lineWidth = 2; g.stroke();
  g.fillStyle = 'rgba(255,255,255,0.86)';
  g.font = 'italic 92px Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(String(numero), 256, 250);
  g.beginPath(); g.arc(256, 256, 13, 0, Math.PI * 2); g.fillStyle = '#07080a'; g.fill();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

export function createVinylDiscs() {
  const group = new THREE.Group();
  const discos: THREE.Mesh[] = [];
  const tt = POSITIONS.turntable;
  const radio = Math.hypot(tt.x, tt.z);
  const tanX = -tt.z / radio, tanZ = tt.x / radio;
  const normX = tt.x / radio, normZ = tt.z / radio;
  const cuantos = Math.min(CONFIG.vinylCount, PLAYLIST.length);
  const geo = new THREE.CylinderGeometry(0.145, 0.145, 0.004, 64);
  const matCanto = new THREE.MeshStandardMaterial({ color: 0x111214, roughness: 0.45, metalness: 0.1 });

  for (let i = 0; i < cuantos; i++) {
    const tex = texturaVinilo(PLAYLIST[i].color, i + 1);
    const cara = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.34, metalness: 0.15 });
    const disco = new THREE.Mesh(geo, [matCanto, cara, cara]);

    // Arrange in 2 rows of 8 discs adjacent to the turntable
    const row = Math.floor(i / 8); // 0 or 1
    const col = i % 8; // 0 to 7
    const tangentOffset = 0.52 + col * 0.28;
    const radialOffset = (row === 0 ? 0.15 : -0.28);

    const x = tt.x + tanX * tangentOffset + normX * radialOffset;
    const z = tt.z + tanZ * tangentOffset + normZ * radialOffset;
    const y = alturaSuelo(x, z) + 0.005 + row * 0.002;

    disco.position.set(x, y, z);
    disco.rotation.set(rango(-0.04, 0.04), rnd() * Math.PI * 2, rango(-0.04, 0.04));
    disco.castShadow = true; disco.receiveShadow = true;
    disco.name = 'Vinyl_' + (i + 1);
    disco.userData = {
      indice: i,
      casa: disco.position.clone(),
      casaQuat: disco.quaternion.clone(),
      hoverT: 0
    };
    group.add(disco);
    discos.push(disco);
    reservar(x, z, 0.15);
  }
  return { group, discos };
}

export function createFireflies() {
  const group = new THREE.Group();
  const luciernagas: THREE.Sprite[] = [];
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d')!;
  const rad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  rad.addColorStop(0, 'rgba(255,248,205,1)');
  rad.addColorStop(0.25, 'rgba(255,226,140,0.55)');
  rad.addColorStop(1, 'rgba(255,214,120,0)');
  g.fillStyle = rad; g.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(c);

  for (let i = 0; i < CONFIG.fireflyCount; i++) {
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
      map: tex, color: 0xffe9a8, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false
    }));
    const esc = rango(0.05, 0.085);
    sprite.scale.setScalar(esc);
    sprite.userData = {
      r: rango(1.6, 3.6), a: rnd() * Math.PI * 2, va: rango(0.05, 0.16) * (rnd() < 0.5 ? -1 : 1),
      y: rango(0.25, 0.95), vy: rango(0.25, 0.7), fase: rnd() * Math.PI * 2,
      vr: rango(0.1, 0.3), escala: esc
    };
    luciernagas.push(sprite);
    group.add(sprite);
  }

  // Bruma sobre el agua
  const bruma = new THREE.Mesh(
    new THREE.CircleGeometry(CONFIG.pondRadius * 0.95, 40),
    new THREE.MeshBasicMaterial({
      map: tex, color: 0x9fc4c0, transparent: true, opacity: 0.10,
      blending: THREE.AdditiveBlending, depthWrite: false
    }));
  bruma.rotation.x = -Math.PI / 2; bruma.position.y = 0.09;
  bruma.name = 'Mist';
  group.add(bruma);

  return { group, luciernagas };
}
