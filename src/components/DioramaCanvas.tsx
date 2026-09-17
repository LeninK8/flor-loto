import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CONFIG, PALETTE, POSITIONS, amortiguar } from './diorama/mathUtils';
import {
  createWater, createTerrain, createRocks, createGrassAndMoss,
  createBushes, createTreeTrunk
} from './diorama/environmentModels';
import {
  createLotus, createLilyPads, createClosedLotusBuds,
  createMagicalStone, createCat, createRings, createBubbleTea, createMakiPlate
} from './diorama/creatureModels';
import {
  createTurntable, createVinylDiscs, createFireflies, PLAYLIST
} from './diorama/turntableModels';
import { TurntableManager } from './diorama/TurntableManager';
import { LightMode, PlaybackState } from '../types';

interface DioramaCanvasProps {
  lightMode: LightMode;
  onTrackChange: (index: number | null, state: PlaybackState) => void;
  onAlert: (msg: string) => void;
  onDiscClicked?: () => void;
  selectedTrackIndex: number | null;
  turntableManagerRef: React.MutableRefObject<TurntableManager | null>;
  cameraFocus: 'default' | 'turntable' | 'lotus' | 'cat' | 'free';
  manualMoveVector?: React.MutableRefObject<{ x: number; y: number; z: number }>;
}

export const DioramaCanvas: React.FC<DioramaCanvasProps> = ({
  lightMode,
  onTrackChange,
  onAlert,
  onDiscClicked,
  turntableManagerRef,
  cameraFocus,
  manualMoveVector
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const targetCamPos = useRef<THREE.Vector3>(new THREE.Vector3(3.05, 2.95, 6.85));
  const targetCamTarget = useRef<THREE.Vector3>(new THREE.Vector3(-0.05, 0.22, 0.30));

  // Smooth one-time transition when clicking a perspective button (never blocks user control)
  const isTransitioningRef = useRef(false);
  const transitionStartCamPos = useRef(new THREE.Vector3());
  const transitionStartTarget = useRef(new THREE.Vector3());
  const transitionProgress = useRef(0);

  // Lights ref to update on day/night mode switch
  const lightsRef = useRef<{
    hemi: THREE.HemisphereLight;
    luna: THREE.DirectionalLight;
    relleno: THREE.DirectionalLight;
    loto: THREE.PointLight;
    piedra: THREE.PointLight;
    lampara: THREE.PointLight;
    chispa1: THREE.PointLight;
    chispa2: THREE.PointLight;
    aguaMalla: THREE.Mesh;
    firefliesGroup: THREE.Group;
    lamparaBulb: THREE.Mesh;
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
  } | null>(null);

  // Update camera focus point without blocking manual control
  useEffect(() => {
    if (cameraFocus === 'free') {
      isTransitioningRef.current = false;
      return;
    }

    switch (cameraFocus) {
      case 'turntable':
        targetCamPos.current.set(POSITIONS.turntable.x + 0.8, 1.2, POSITIONS.turntable.z + 1.2);
        targetCamTarget.current.set(POSITIONS.turntable.x, 0.25, POSITIONS.turntable.z);
        break;
      case 'lotus':
        targetCamPos.current.set(POSITIONS.lotus.x + 1.0, 0.85, POSITIONS.lotus.z + 1.2);
        targetCamTarget.current.set(POSITIONS.lotus.x, 0.2, POSITIONS.lotus.z);
        break;
      case 'cat':
        targetCamPos.current.set(POSITIONS.cat.x + 1.1, 0.75, POSITIONS.cat.z + 1.0);
        targetCamTarget.current.set(POSITIONS.cat.x, 0.25, POSITIONS.cat.z);
        break;
      case 'default':
        targetCamPos.current.set(3.05, 2.95, 6.85);
        targetCamTarget.current.set(-0.05, 0.22, 0.30);
        break;
    }

    if (controlsRef.current) {
      transitionStartCamPos.current.copy(controlsRef.current.object.position);
      transitionStartTarget.current.copy(controlsRef.current.target);
      transitionProgress.current = 0;
      isTransitioningRef.current = true;
    }
  }, [cameraFocus]);

  // Update lighting mode
  useEffect(() => {
    if (!lightsRef.current) return;
    const { hemi, luna, relleno, loto, piedra, lampara, chispa1, chispa2, aguaMalla, firefliesGroup, lamparaBulb, renderer, scene } = lightsRef.current;
    const isNight = lightMode === 'noche';

    const TEMAS = {
      noche: {
        fondo: 0x0c1620, nieblaColor: 0x0d1b22, niebla: 0.055, hemi: 0.50, luna: 0.90,
        relleno: 0.35, loto: 0.90, piedra: 0.55, lampara: 0.85, exposicion: 1.02,
        agua: PALETTE.water, luciernagas: 1.0
      },
      dia: {
        fondo: 0xc3d3e0, nieblaColor: 0xb9cbd8, niebla: 0.022, hemi: 1.15, luna: 1.35,
        relleno: 0.65, loto: 0.18, piedra: 0.20, lampara: 0.25, exposicion: 1.06,
        agua: 0x22403f, luciernagas: 0.12
      }
    };

    const T = isNight ? TEMAS.noche : TEMAS.dia;
    scene.background = new THREE.Color(T.fondo);
    scene.fog = new THREE.FogExp2(T.nieblaColor, T.niebla);
    hemi.intensity = T.hemi;
    luna.intensity = T.luna;
    relleno.intensity = T.relleno;
    loto.intensity = T.loto;
    piedra.intensity = T.piedra;
    lampara.intensity = T.lampara;
    chispa1.intensity = 0.35 * T.luciernagas;
    chispa2.intensity = 0.28 * T.luciernagas;
    renderer.toneMappingExposure = T.exposicion;
    if (aguaMalla) (aguaMalla.material as THREE.MeshPhysicalMaterial).color.setHex(T.agua);
    firefliesGroup.visible = T.luciernagas > 0.3;
    if (lamparaBulb) lamparaBulb.visible = isNight;
  }, [lightMode]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0c1620);
    scene.fog = new THREE.FogExp2(0x0d1b22, 0.055);

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 120);
    camera.position.set(3.05, 2.95, 6.85);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.02;
    renderer.shadowMap.enabled = CONFIG.shadows;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.replaceChildren(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(-0.05, 0.22, 0.30);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    // Completely unconstrained camera movement: free distance, full rotation and free panning
    controls.minDistance = 0.01;
    controls.maxDistance = 150;
    controls.maxPolarAngle = Math.PI - 0.001;
    controls.minPolarAngle = 0.001;
    controls.screenSpacePanning = true;
    controls.enablePan = true;
    controls.panSpeed = 1.3;
    controls.rotateSpeed = 0.9;
    controls.zoomSpeed = 1.4;
    controls.mouseButtons = {
      LEFT: THREE.MOUSE.ROTATE,
      MIDDLE: THREE.MOUSE.DOLLY,
      RIGHT: THREE.MOUSE.PAN
    };
    controls.touches = {
      ONE: THREE.TOUCH.ROTATE,
      TWO: THREE.TOUCH.DOLLY_PAN
    };
    controls.addEventListener('start', () => {
      isTransitioningRef.current = false;
    });
    controlsRef.current = controls;

    // Keys pressed for free fly camera (WASD / Arrows / Q / E / Space / Shift)
    const keysPressed: { [code: string]: boolean } = {};
    const onKeyDown = (e: KeyboardEvent) => {
      // Don't capture when typing in inputs
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return;
      keysPressed[e.code] = true;
      keysPressed[e.key.toLowerCase()] = true;
      isTransitioningRef.current = false;
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keysPressed[e.code] = false;
      keysPressed[e.key.toLowerCase()] = false;
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    // Lights
    const hemi = new THREE.HemisphereLight(0x8fb3c9, 0x10201c, 0.5);
    scene.add(hemi);

    const luna = new THREE.DirectionalLight(0xbfd6ff, 0.9);
    luna.position.set(-5.5, 8.5, -4.0);
    if (CONFIG.shadows) {
      luna.castShadow = true;
      luna.shadow.mapSize.set(2048, 2048);
      luna.shadow.camera.near = 1; luna.shadow.camera.far = 26;
      luna.shadow.camera.left = -6; luna.shadow.camera.right = 6;
      luna.shadow.camera.top = 6; luna.shadow.camera.bottom = -6;
      luna.shadow.bias = -0.0009;
      luna.shadow.radius = 2;
    }
    scene.add(luna);

    const relleno = new THREE.DirectionalLight(0x4e7f8c, 0.35);
    relleno.position.set(6, 3, 5);
    scene.add(relleno);

    const lotoLight = new THREE.PointLight(0xffe9d6, 0.9, 3.2, 2);
    lotoLight.position.set(POSITIONS.lotus.x, 0.55, POSITIONS.lotus.z);
    scene.add(lotoLight);

    const piedraLight = new THREE.PointLight(0x62e39a, 0.55, 1.5, 2);
    piedraLight.position.set(POSITIONS.magicalStone.x, 0.28, POSITIONS.magicalStone.z);
    scene.add(piedraLight);

    const lamparaLight = new THREE.PointLight(0xffb45e, 0.85, 2.4, 2);
    lamparaLight.position.set(POSITIONS.turntable.x - 0.1, 0.42, POSITIONS.turntable.z + 0.1);
    scene.add(lamparaLight);

    const chispa1 = new THREE.PointLight(0xffd88a, 0.35, 1.6, 2);
    const chispa2 = new THREE.PointLight(0xffd88a, 0.28, 1.4, 2);
    scene.add(chispa1, chispa2);

    // Build World Geometry
    const { aguaMalla, aguaBase } = createWater();
    scene.add(aguaMalla);

    const terrain = createTerrain();
    scene.add(terrain);

    const rocks = createRocks();
    scene.add(rocks);

    const grassAndMoss = createGrassAndMoss();
    scene.add(grassAndMoss);

    const bushes = createBushes();
    scene.add(bushes);

    const treeTrunk = createTreeTrunk();
    scene.add(treeTrunk);

    const { mainGroup: lotusGroup, florMalla: lotusFlower } = createLotus();
    scene.add(lotusGroup);

    const { group: lilyPadsGroup, colocados: lilyPadSpots } = createLilyPads();
    scene.add(lilyPadsGroup);

    const closedLotusGroup = createClosedLotusBuds(lilyPadSpots);
    scene.add(closedLotusGroup);

    const { group: stoneGroup, piedra: stoneMesh } = createMagicalStone();
    scene.add(stoneGroup);

    const catGroup = createCat();
    scene.add(catGroup);

    const ringsGroup = createRings();
    scene.add(ringsGroup);

    const bubbleTeaGroup = createBubbleTea();
    scene.add(bubbleTeaGroup);

    const makiPlateGroup = createMakiPlate();
    scene.add(makiPlateGroup);

    const { group: turntableGroup, platoMalla, brazo, boton, lampara: lamparaBulb } = createTurntable();
    scene.add(turntableGroup);

    const { group: vinylGroup, discos } = createVinylDiscs();
    scene.add(vinylGroup);

    const { group: firefliesGroup, luciernagas } = createFireflies();
    scene.add(firefliesGroup);

    // Setup Turntable Manager
    const ttManager = new TurntableManager(
      turntableGroup,
      { platoMalla, brazo, boton },
      discos,
      onTrackChange,
      onAlert
    );
    turntableManagerRef.current = ttManager;

    lightsRef.current = {
      hemi, luna, relleno, loto: lotoLight, piedra: piedraLight,
      lampara: lamparaLight, chispa1, chispa2, aguaMalla,
      firefliesGroup, lamparaBulb, renderer, scene
    };

    // Interaction handlers
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let discoHover: THREE.Mesh | null = null;
    let pointerPress: { x: number; y: number; time: number; dragging?: boolean } | null = null;

    const updatePointer = (e: MouseEvent | Touch) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    };

    const getDiscUnderPointer = () => {
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(discos, false);
      return hits.length ? (hits[0].object as THREE.Mesh) : null;
    };

    const onPointerDown = (e: PointerEvent) => {
      pointerPress = { x: e.clientX, y: e.clientY, time: performance.now() };
    };

    const onPointerMove = (e: PointerEvent) => {
      updatePointer(e);
      if (pointerPress && Math.hypot(e.clientX - pointerPress.x, e.clientY - pointerPress.y) > 6) {
        pointerPress.dragging = true;
      }
      const disc = pointerPress?.dragging ? null : getDiscUnderPointer();
      if (disc !== discoHover) {
        discoHover = disc;
        renderer.domElement.style.cursor = disc ? 'pointer' : 'default';
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      if (!pointerPress) return;
      const moved = Math.hypot(e.clientX - pointerPress.x, e.clientY - pointerPress.y) > 6 || pointerPress.dragging;
      const isQuickTap = performance.now() - pointerPress.time < 600;
      pointerPress = null;

      if (moved || !isQuickTap) return;
      updatePointer(e);
      const disc = getDiscUnderPointer();
      if (disc) {
        const index = disc.userData.indice as number;
        ttManager.seleccionar(index);
        if (onDiscClicked) onDiscClicked();
      }
    };

    const dom = renderer.domElement;
    dom.addEventListener('pointerdown', onPointerDown);
    dom.addEventListener('pointermove', onPointerMove);
    dom.addEventListener('pointerup', onPointerUp);

    // Animation Loop
    let animationFrameId: number;
    let prevTime = 0;

    const animate = (ms: number) => {
      animationFrameId = requestAnimationFrame(animate);
      const t = ms / 1000;
      const dt = Math.min(t - prevTime, 0.05) || 0;
      prevTime = t;

      // Free flight vector from keyboard or on-screen joystick
      const isW = keysPressed['KeyW'] || keysPressed['w'] || keysPressed['ArrowUp'];
      const isS = keysPressed['KeyS'] || keysPressed['s'] || keysPressed['ArrowDown'];
      const isA = keysPressed['KeyA'] || keysPressed['a'] || keysPressed['ArrowLeft'];
      const isD = keysPressed['KeyD'] || keysPressed['d'] || keysPressed['ArrowRight'];
      const isUp = keysPressed['KeyE'] || keysPressed['e'] || keysPressed['Space'] || keysPressed[' '];
      const isDown = keysPressed['KeyQ'] || keysPressed['q'] || keysPressed['ControlLeft'] || keysPressed['ControlRight'];
      const isBoost = keysPressed['ShiftLeft'] || keysPressed['ShiftRight'] || keysPressed['shift'];

      const moveDelta = new THREE.Vector3();
      const forward = new THREE.Vector3();
      camera.getWorldDirection(forward); // true 3D camera look direction

      const right = new THREE.Vector3();
      right.crossVectors(forward, camera.up).normalize();

      const up = new THREE.Vector3(0, 1, 0);

      const speed = (isBoost ? 8.5 : 4.2) * dt;

      if (isW) moveDelta.addScaledVector(forward, speed);
      if (isS) moveDelta.addScaledVector(forward, -speed);
      if (isA) moveDelta.addScaledVector(right, -speed);
      if (isD) moveDelta.addScaledVector(right, speed);
      if (isUp) moveDelta.addScaledVector(up, speed);
      if (isDown) moveDelta.addScaledVector(up, -speed);

      // On-screen joystick / touch movement
      if (manualMoveVector?.current) {
        const mv = manualMoveVector.current;
        if (mv.z !== 0) moveDelta.addScaledVector(forward, mv.z * speed * 1.4);
        if (mv.x !== 0) moveDelta.addScaledVector(right, mv.x * speed * 1.4);
        if (mv.y !== 0) moveDelta.addScaledVector(up, mv.y * speed * 1.4);
      }

      if (moveDelta.lengthSq() > 0) {
        camera.position.add(moveDelta);
        controls.target.add(moveDelta);
        isTransitioningRef.current = false;
      } else if (isTransitioningRef.current) {
        transitionProgress.current += dt * 1.8;
        const p = Math.min(1, transitionProgress.current);
        const ease = 0.5 - Math.cos(p * Math.PI) / 2;
        camera.position.lerpVectors(transitionStartCamPos.current, targetCamPos.current, ease);
        controls.target.lerpVectors(transitionStartTarget.current, targetCamTarget.current, ease);
        if (p >= 1) {
          isTransitioningRef.current = false;
        }
      }

      controls.update();

      // Water wave motion
      const p = aguaMalla.geometry.attributes.position;
      for (let i = 0; i < p.count; i++) {
        const x = aguaBase[i * 3], z = aguaBase[i * 3 + 2];
        p.setY(i, Math.sin(x * 2.1 + t * 0.55) * 0.004 + Math.sin(z * 2.7 - t * 0.42) * 0.0035 + Math.sin((x + z) * 3.6 + t * 0.9) * 0.0018);
      }
      p.needsUpdate = true;
      aguaMalla.geometry.computeVertexNormals();

      // Fireflies motion
      luciernagas.forEach((f, i) => {
        const d = f.userData;
        d.a += d.va * dt;
        const r = d.r + Math.sin(t * d.vr + d.fase) * 0.35;
        f.position.set(
          Math.cos(d.a) * r,
          d.y + Math.sin(t * d.vy + d.fase) * 0.22,
          Math.sin(d.a) * r
        );
        const brillo = 0.45 + 0.55 * Math.pow(Math.max(0, Math.sin(t * 1.3 + d.fase)), 2);
        (f.material as THREE.SpriteMaterial).opacity = brillo;
        f.scale.setScalar(d.escala * (0.85 + brillo * 0.3));
        if (i === 0) chispa1.position.copy(f.position);
        if (i === 1) chispa2.position.copy(f.position);
      });

      // Lotus breathing float
      lotusFlower.rotation.z = Math.sin(t * 0.42) * 0.018;
      lotusFlower.position.y = 0.19 + Math.sin(t * 0.55) * 0.006;
      lotoLight.intensity = (lightMode === 'noche' ? 0.9 : 0.18) * (0.88 + 0.12 * Math.sin(t * 1.1));

      // Stone rotation and pulsing glow
      stoneMesh.rotation.y += dt * 0.25;
      (stoneMesh.material as THREE.MeshPhysicalMaterial).emissiveIntensity = 0.75 + Math.sin(t * 1.6) * 0.25;

      // Turntable controller update
      ttManager.update(dt);

      // Hover feedback on discs
      discos.forEach(d => {
        const isHovered = (d === discoHover) && ttManager.enPlato !== d.userData.indice;
        d.userData.hoverT = amortiguar(d.userData.hoverT, isHovered ? 1 : 0, 10, dt);
        const s = 1 + d.userData.hoverT * 0.06;
        d.scale.set(s, 1, s);
        if (!ttManager.anim && ttManager.enPlato !== d.userData.indice) {
          d.position.y = d.userData.casa.y + d.userData.hoverT * 0.022;
        }
      });

      renderer.render(scene, camera);
    };

    animationFrameId = requestAnimationFrame(animate);

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      dom.removeEventListener('pointerdown', onPointerDown);
      dom.removeEventListener('pointermove', onPointerMove);
      dom.removeEventListener('pointerup', onPointerUp);
      renderer.dispose();
    };
  }, []);

  return <div ref={containerRef} className="w-full h-full select-none cursor-grab active:cursor-grabbing" />;
};
