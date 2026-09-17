import * as THREE from 'three';
import { amortiguar, easeInOut, lerp } from './mathUtils';
import { PLATO_LOCAL, PLAYLIST } from './turntableModels';
import { TurntablePhase } from '../../types';
import { youtubeAudio } from '../../audio/youtubeAudio';
import { synthAudio } from '../../audio/synthAudio';

export interface DiscAnim {
  disco: THREE.Mesh;
  t: number;
  dur: number;
  desde: THREE.Vector3;
  hasta: THREE.Vector3;
  qDesde: THREE.Quaternion;
  qHasta: THREE.Quaternion;
}

export class TurntableManager {
  public fase: TurntablePhase = 'idle';
  public t = 0;
  public enPlato: number | null = null;
  public entrante: number | null = null;
  public anim: DiscAnim | null = null;
  public brazoDentro = 0;
  public brazoAlto = 1;
  public giro = 0;
  public isPaused = false;

  private turntableGroup: THREE.Group;
  private tocadiscos: {
    platoMalla: THREE.Mesh;
    brazo: THREE.Group;
    boton: THREE.Mesh;
  };
  private discos: THREE.Mesh[];
  private onTrackChange: (index: number | null, state: 'idle' | 'loading' | 'playing' | 'paused') => void;
  private onAlert: (msg: string) => void;

  constructor(
    turntableGroup: THREE.Group,
    tocadiscos: { platoMalla: THREE.Mesh; brazo: THREE.Group; boton: THREE.Mesh },
    discos: THREE.Mesh[],
    onTrackChange: (index: number | null, state: 'idle' | 'loading' | 'playing' | 'paused') => void,
    onAlert: (msg: string) => void
  ) {
    this.turntableGroup = turntableGroup;
    this.tocadiscos = tocadiscos;
    this.discos = discos;
    this.onTrackChange = onTrackChange;
    this.onAlert = onAlert;
  }

  public siguienteDisco() {
    const nextIndex = this.enPlato !== null ? (this.enPlato + 1) % PLAYLIST.length : 0;
    this.seleccionar(nextIndex);
  }

  public anteriorDisco() {
    const prevIndex = this.enPlato !== null ? (this.enPlato - 1 + PLAYLIST.length) % PLAYLIST.length : 0;
    this.seleccionar(prevIndex);
  }

  public pause() {
    this.isPaused = true;
    youtubeAudio.pause();
    synthAudio.stop();
    if (this.enPlato !== null) {
      this.onTrackChange(this.enPlato, 'paused');
    }
  }

  public resume() {
    this.isPaused = false;
    if (this.enPlato !== null) {
      youtubeAudio.resume();
      this.onTrackChange(this.enPlato, 'playing');
    }
  }

  public seleccionar(indice: number) {
    if (indice < 0 || indice >= this.discos.length) return;
    if (this.entrante === indice || (this.enPlato === indice && this.fase === 'playing' && !this.isPaused)) return;

    this.isPaused = false;
    youtubeAudio.stop();
    synthAudio.stop();
    this.onTrackChange(indice, 'loading');
    this.entrante = indice;
    this.fase = 'eject';
    this.t = 0;

    if (this.enPlato !== null) {
      const d = this.discos[this.enPlato];
      this.anim = this.crearAnim(d, d.userData.casa, d.userData.casaQuat, 0.75);
    } else {
      this.anim = null;
    }
  }

  public stopPlayback() {
    youtubeAudio.stop();
    synthAudio.stop();
    this.giro = 0;
    this.isPaused = false;
    this.fase = 'eject';
    this.t = 0;
    if (this.enPlato !== null) {
      const d = this.discos[this.enPlato];
      this.anim = this.crearAnim(d, d.userData.casa, d.userData.casaQuat, 0.75);
      this.enPlato = null;
    }
    this.entrante = null;
    this.onTrackChange(null, 'idle');
  }

  private crearAnim(disco: THREE.Mesh, destino: THREE.Vector3, quatDestino: THREE.Quaternion, duracion: number): DiscAnim {
    return {
      disco,
      t: 0,
      dur: duracion,
      desde: disco.position.clone(),
      hasta: destino.clone(),
      qDesde: disco.quaternion.clone(),
      qHasta: quatDestino.clone()
    };
  }

  private posicionPlato(): THREE.Vector3 {
    const v = PLATO_LOCAL.clone();
    v.y += 0.0135;
    this.turntableGroup.updateMatrixWorld();
    return this.turntableGroup.localToWorld(v);
  }

  public update(dt: number) {
    if (this.anim) {
      const a = this.anim;
      a.t = Math.min(1, a.t + dt / a.dur);
      const e = easeInOut(a.t);
      a.disco.position.lerpVectors(a.desde, a.hasta, e);
      a.disco.position.y += Math.sin(Math.PI * a.t) * 0.16;
      a.disco.quaternion.copy(a.qDesde).slerp(a.qHasta, e);
      if (a.t >= 1) this.anim = null;
    }

    switch (this.fase) {
      case 'eject':
        this.brazoDentro = amortiguar(this.brazoDentro, 0, 7, dt);
        this.brazoAlto = amortiguar(this.brazoAlto, 1, 9, dt);
        this.giro *= Math.max(0, 1 - dt * 2.2);
        if (!this.anim && this.brazoAlto > 0.85) {
          if (this.entrante !== null) {
            const d = this.discos[this.entrante];
            const destino = this.posicionPlato();
            const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, d.rotation.y, 0));
            this.anim = this.crearAnim(d, destino, q, 0.85);
            if (this.enPlato !== null) this.enPlato = null;
            this.fase = 'insert';
          } else {
            this.fase = 'idle';
          }
        }
        break;

      case 'insert':
        if (!this.anim) {
          this.enPlato = this.entrante;
          this.entrante = null;
          this.fase = 'cue';
          this.t = 0;
        }
        break;

      case 'cue':
        this.t += dt;
        this.brazoDentro = amortiguar(this.brazoDentro, 1, 4.5, dt);
        if (this.t > 0.45) this.brazoAlto = amortiguar(this.brazoAlto, 0, 5, dt);
        if (this.t > 1.05 && this.enPlato !== null) {
          this.fase = 'playing';
          try {
            const track = PLAYLIST[this.enPlato];
            youtubeAudio.playVideo(track.youtubeId);
            this.onTrackChange(this.enPlato, 'playing');
          } catch {
            this.onAlert('El navegador requiere interacción para activar el audio.');
          }
        }
        break;

      case 'playing':
        if (this.isPaused) {
          this.giro = amortiguar(this.giro, 0, 3.0, dt);
        } else {
          this.giro = amortiguar(this.giro, 1, 2.5, dt);
        }
        break;
    }

    if (this.tocadiscos.brazo) {
      this.tocadiscos.brazo.rotation.y = lerp(0.55, -0.02, this.brazoDentro);
      this.tocadiscos.brazo.rotation.z = lerp(0, 0.075, this.brazoAlto);
    }

    const vel = this.giro * 3.49; // ~33.3 RPM
    if (this.tocadiscos.platoMalla) this.tocadiscos.platoMalla.rotation.y += vel * dt;
    if (this.enPlato !== null && !this.anim) this.discos[this.enPlato].rotation.y += vel * dt;
    if (this.tocadiscos.boton) {
      (this.tocadiscos.boton.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.4 + this.giro * 1.5;
    }
  }
}
