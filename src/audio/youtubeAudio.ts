// YouTube Audio Engine wrapping the official YouTube IFrame Player API

declare global {
  interface Window {
    onYouTubeIframeAPIReady?: () => void;
    YT?: {
      Player: new (
        elementId: string | HTMLElement,
        options: {
          height?: string | number;
          width?: string | number;
          videoId?: string;
          playerVars?: {
            autoplay?: 0 | 1;
            controls?: 0 | 1;
            disablekb?: 0 | 1;
            enablejsapi?: 0 | 1;
            fs?: 0 | 1;
            origin?: string;
            rel?: 0 | 1;
            modestbranding?: 0 | 1;
            playsinline?: 0 | 1;
          };
          events?: {
            onReady?: (event: { target: YTPlayerInstance }) => void;
            onStateChange?: (event: { data: number }) => void;
            onError?: (event: { data: number }) => void;
          };
        }
      ) => YTPlayerInstance;
      PlayerState: {
        UNSTARTED: number;
        ENDED: number;
        PLAYING: number;
        PAUSED: number;
        BUFFERING: number;
        CUED: number;
      };
    };
  }
}

export interface YTPlayerInstance {
  playVideo: () => void;
  pauseVideo: () => void;
  stopVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead?: boolean) => void;
  setVolume: (volume: number) => void;
  getVolume: () => number;
  mute: () => void;
  unMute: () => void;
  isMuted: () => boolean;
  getPlayerState: () => number;
  getCurrentTime: () => number;
  getDuration: () => number;
  loadVideoById: (videoId: string, startSeconds?: number) => void;
  cueVideoById: (videoId: string, startSeconds?: number) => void;
  destroy: () => void;
}

class YouTubeAudioEngine {
  private player: YTPlayerInstance | null = null;
  private isReady = false;
  private queuedVideoId: string | null = null;
  private currentVideoId: string | null = null;
  private volume = 70;
  private onEndedCallback: (() => void) | null = null;
  private onStateChangeCallback: ((state: 'playing' | 'paused' | 'buffering' | 'ended' | 'idle') => void) | null = null;
  private onErrorCallback: ((error: string) => void) | null = null;

  constructor() {
    this.loadScript();
  }

  private loadScript() {
    if (typeof window === 'undefined') return;
    if (window.YT && window.YT.Player) {
      this.initPlayer();
      return;
    }

    const prevCallback = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (prevCallback) prevCallback();
      this.initPlayer();
    };

    if (!document.getElementById('youtube-iframe-api-tag')) {
      const tag = document.createElement('script');
      tag.id = 'youtube-iframe-api-tag';
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);
    }
  }

  public attachContainer(containerId: string) {
    if (window.YT && window.YT.Player) {
      this.createPlayer(containerId);
    } else {
      const interval = setInterval(() => {
        if (window.YT && window.YT.Player) {
          clearInterval(interval);
          this.createPlayer(containerId);
        }
      }, 100);
    }
  }

  private initPlayer() {
    // If container already exists in DOM
    const el = document.getElementById('youtube-audio-player-host');
    if (el) {
      this.createPlayer('youtube-audio-player-host');
    }
  }

  private createPlayer(containerId: string) {
    if (this.player || !window.YT) return;

    try {
      this.player = new window.YT.Player(containerId, {
        height: '100',
        width: '100',
        playerVars: {
          autoplay: 1,
          controls: 0,
          disablekb: 1,
          enablejsapi: 1,
          playsinline: 1,
          rel: 0
        },
        events: {
          onReady: () => {
            this.isReady = true;
            this.player?.setVolume(this.volume);
            if (this.queuedVideoId) {
              const vid = this.queuedVideoId;
              this.queuedVideoId = null;
              this.playVideo(vid);
            }
          },
          onStateChange: (e) => {
            if (!window.YT) return;
            switch (e.data) {
              case window.YT.PlayerState.PLAYING:
                if (this.onStateChangeCallback) this.onStateChangeCallback('playing');
                break;
              case window.YT.PlayerState.PAUSED:
                if (this.onStateChangeCallback) this.onStateChangeCallback('paused');
                break;
              case window.YT.PlayerState.BUFFERING:
                if (this.onStateChangeCallback) this.onStateChangeCallback('buffering');
                break;
              case window.YT.PlayerState.ENDED:
                if (this.onStateChangeCallback) this.onStateChangeCallback('ended');
                if (this.onEndedCallback) this.onEndedCallback();
                break;
            }
          },
          onError: (e) => {
            console.warn('[YouTube Player error]', e.data);
            if (this.onErrorCallback) {
              this.onErrorCallback('No se pudo reproducir este video. Pasando al siguiente...');
            }
          }
        }
      });
    } catch (err) {
      console.error('Error creating YouTube player', err);
    }
  }

  public setCallbacks(
    onEnded: () => void,
    onStateChange: (state: 'playing' | 'paused' | 'buffering' | 'ended' | 'idle') => void,
    onError: (msg: string) => void
  ) {
    this.onEndedCallback = onEnded;
    this.onStateChangeCallback = onStateChange;
    this.onErrorCallback = onError;
  }

  public playVideo(youtubeId: string) {
    this.currentVideoId = youtubeId;
    if (!this.isReady || !this.player) {
      this.queuedVideoId = youtubeId;
      return;
    }

    try {
      this.player.loadVideoById(youtubeId);
      this.player.playVideo();
    } catch {
      this.queuedVideoId = youtubeId;
    }
  }

  public pause() {
    if (this.player && this.isReady) {
      try {
        this.player.pauseVideo();
      } catch {}
    }
  }

  public resume() {
    if (this.player && this.isReady) {
      try {
        this.player.playVideo();
      } catch {}
    }
  }

  public stop() {
    this.queuedVideoId = null;
    if (this.player && this.isReady) {
      try {
        this.player.stopVideo();
      } catch {}
    }
    if (this.onStateChangeCallback) this.onStateChangeCallback('idle');
  }

  public setVolume(val: number) {
    // val 0 to 1
    this.volume = Math.round(Math.max(0, Math.min(1, val)) * 100);
    if (this.player && this.isReady) {
      try {
        this.player.setVolume(this.volume);
      } catch {}
    }
  }

  public seekTo(seconds: number) {
    if (this.player && this.isReady) {
      try {
        this.player.seekTo(seconds, true);
      } catch {}
    }
  }

  public getCurrentTime(): number {
    if (this.player && this.isReady) {
      try {
        return this.player.getCurrentTime() || 0;
      } catch {
        return 0;
      }
    }
    return 0;
  }

  public getDuration(): number {
    if (this.player && this.isReady) {
      try {
        return this.player.getDuration() || 0;
      } catch {
        return 0;
      }
    }
    return 0;
  }
}

export const youtubeAudio = new YouTubeAudioEngine();
