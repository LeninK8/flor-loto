export interface TrackInfo {
  id: string;
  title: string;
  artist?: string;
  youtubeId: string;
  audioUrl?: string;
  loop: boolean;
  color: string;
  description?: string;
}

export type PlaybackState = 'idle' | 'loading' | 'playing' | 'paused' | 'error';
export type TurntablePhase = 'idle' | 'eject' | 'insert' | 'cue' | 'playing';
export type LightMode = 'noche' | 'dia';
