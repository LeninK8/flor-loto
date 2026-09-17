// Web Audio API ambient synthesizer for the 4 vinyl discs

class VinylSynthEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private crackleGain: GainNode | null = null;
  private isPlaying = false;
  private currentTrackIndex: number | null = null;
  private activeIntervals: number[] = [];
  private activeNodes: (AudioNode | { stop?: () => void; disconnect: () => void })[] = [];
  private crackleSource: AudioBufferSourceNode | null = null;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.35, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // Create vinyl crackle buffer
      this.crackleGain = this.ctx.createGain();
      this.crackleGain.gain.setValueAtTime(0.045, this.ctx.currentTime);
      this.crackleGain.connect(this.masterGain);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  private startCrackle() {
    if (!this.ctx || !this.crackleGain) return;
    try {
      // 2 seconds looping buffer of gentle vinyl noise + pops
      const bufferSize = this.ctx.sampleRate * 2;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < bufferSize; i++) {
        // Pink-ish noise
        const white = Math.random() * 2 - 1;
        b0 = 0.99765 * b0 + white * 0.0555179;
        b1 = 0.96300 * b1 + white * 0.0750759;
        b2 = 0.57000 * b2 + white * 0.1538520;
        let sample = (b0 + b1 + b2) * 0.1;
        // Random clicks/pops
        if (Math.random() < 0.0008) {
          sample += (Math.random() * 2 - 1) * 0.8;
        }
        data[i] = sample;
      }

      this.crackleSource = this.ctx.createBufferSource();
      this.crackleSource.buffer = buffer;
      this.crackleSource.loop = true;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 3200;

      this.crackleSource.connect(filter);
      filter.connect(this.crackleGain);
      this.crackleSource.start();
      this.activeNodes.push(this.crackleSource);
    } catch {
      // Ignore crackle error if audio context is blocked
    }
  }

  public playTrack(trackIndex: number) {
    this.stop();
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    this.isPlaying = true;
    this.currentTrackIndex = trackIndex;
    this.startCrackle();

    switch (trackIndex) {
      case 0:
        this.playTrack0(); // Warm ambient piano chords & soft bell
        break;
      case 1:
        this.playTrack1(); // Water ripple glass bells & pad
        break;
      case 2:
        this.playTrack2(); // Mystical singing bowl & sine meditation
        break;
      case 3:
      default:
        this.playTrack3(); // Lofi music box & nostalgic night breeze
        break;
    }
  }

  private playTone(freq: number, time: number, duration: number, type: OscillatorType = 'sine', gain = 0.15) {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, time);

    g.gain.setValueAtTime(0.0001, time);
    g.gain.exponentialRampToValueAtTime(gain, time + 0.04);
    g.gain.exponentialRampToValueAtTime(0.0001, time + duration);

    osc.connect(g);
    g.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + duration);
    this.activeNodes.push(osc, g);
  }

  // Track 0: Warm ambient Rhodes/chords
  private playTrack0() {
    if (!this.ctx) return;
    const chords = [
      [220, 261.63, 329.63, 392.00], // Am7
      [174.61, 220, 261.63, 329.63], // Fmaj7
      [196.00, 246.94, 293.66, 349.23], // G7
      [164.81, 196.00, 246.94, 293.66]  // Em7
    ];
    let step = 0;

    const playChordStep = () => {
      if (!this.ctx || !this.isPlaying) return;
      const now = this.ctx.currentTime;
      const currentNotes = chords[step % chords.length];
      currentNotes.forEach((freq, idx) => {
        this.playTone(freq, now + idx * 0.08, 4.2, 'triangle', 0.06);
      });
      // Soft high bell
      if (step % 2 === 0) {
        this.playTone(currentNotes[2] * 2, now + 1.2, 2.5, 'sine', 0.035);
      }
      step++;
    };

    playChordStep();
    const interval = window.setInterval(playChordStep, 4200);
    this.activeIntervals.push(interval);
  }

  // Track 1: Water ripples & glass marimba
  private playTrack1() {
    if (!this.ctx) return;
    const pentatonic = [293.66, 329.63, 369.99, 440.00, 493.88, 587.33, 659.25, 739.99]; // D Major Pentatonic
    
    // Warm continuous drone
    const droneOsc = this.ctx.createOscillator();
    const droneGain = this.ctx.createGain();
    droneOsc.type = 'sine';
    droneOsc.frequency.setValueAtTime(146.83, this.ctx.currentTime); // D3
    droneGain.gain.setValueAtTime(0.04, this.ctx.currentTime);
    droneOsc.connect(droneGain);
    droneGain.connect(this.masterGain!);
    droneOsc.start();
    this.activeNodes.push(droneOsc, droneGain);

    const playDrops = () => {
      if (!this.ctx || !this.isPlaying) return;
      const now = this.ctx.currentTime;
      const noteCount = 2 + Math.floor(Math.random() * 3);
      for (let i = 0; i < noteCount; i++) {
        const note = pentatonic[Math.floor(Math.random() * pentatonic.length)];
        this.playTone(note, now + i * 0.35 + Math.random() * 0.1, 1.8, 'sine', 0.04);
      }
    };

    playDrops();
    const interval = window.setInterval(playDrops, 2600);
    this.activeIntervals.push(interval);
  }

  // Track 2: Mystical singing bowl & lotus drone
  private playTrack2() {
    if (!this.ctx) return;
    // Harmonic bowl drone (432Hz inspired soothing scale)
    const baseFreq = 216; // A3 harmonic
    const harmonics = [1, 1.5, 2.02, 2.76, 3.5];

    harmonics.forEach((h, i) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreq * h, this.ctx.currentTime);
      
      // Gentle modulation
      gain.gain.setValueAtTime(0.035 / (i + 1), this.ctx.currentTime);
      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start();
      this.activeNodes.push(osc, gain);
    });

    // Occasional singing bowl chime strike
    const chimeStrike = () => {
      if (!this.ctx || !this.isPlaying) return;
      const now = this.ctx.currentTime;
      this.playTone(432, now, 6.0, 'sine', 0.08);
      this.playTone(864, now + 0.02, 4.5, 'sine', 0.03);
    };

    chimeStrike();
    const interval = window.setInterval(chimeStrike, 6500);
    this.activeIntervals.push(interval);
  }

  // Track 3: Lofi music box
  private playTrack3() {
    if (!this.ctx) return;
    const melody = [
      392.00, 440.00, 523.25, 587.33, 659.25, 587.33, 523.25, 440.00,
      329.63, 392.00, 440.00, 523.25, 440.00, 392.00, 329.63, 293.66
    ];
    let noteIndex = 0;

    const tick = () => {
      if (!this.ctx || !this.isPlaying) return;
      const now = this.ctx.currentTime;
      const freq = melody[noteIndex % melody.length];
      // Music box metallic bell tone
      this.playTone(freq, now, 1.6, 'sine', 0.05);
      this.playTone(freq * 2.01, now, 0.9, 'triangle', 0.015);
      noteIndex++;
    };

    tick();
    const interval = window.setInterval(tick, 580);
    this.activeIntervals.push(interval);
  }

  public stop() {
    this.isPlaying = false;
    this.currentTrackIndex = null;
    this.activeIntervals.forEach(id => clearInterval(id));
    this.activeIntervals = [];

    this.activeNodes.forEach(node => {
      try {
        if ('stop' in node && typeof node.stop === 'function') {
          node.stop();
        }
        node.disconnect();
      } catch {
        // already disconnected
      }
    });
    this.activeNodes = [];

    if (this.crackleSource) {
      try {
        this.crackleSource.stop();
        this.crackleSource.disconnect();
      } catch {
        // already stopped
      }
      this.crackleSource = null;
    }
  }

  public setVolume(val: number) {
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(Math.max(0, Math.min(1, val)), this.ctx.currentTime, 0.05);
    }
  }

  public getStatus() {
    return {
      isPlaying: this.isPlaying,
      trackIndex: this.currentTrackIndex
    };
  }
}

export const synthAudio = new VinylSynthEngine();
