import React, { useState, useRef, useEffect } from 'react';
import { DioramaCanvas } from './components/DioramaCanvas';
import { TurntableManager } from './components/diorama/TurntableManager';
import { LightMode, PlaybackState } from './types';
import { Moon, Sun, Eye, EyeOff } from 'lucide-react';
import { MiniMusicPlayer } from './components/MiniMusicPlayer';
import { FreeCameraHUD } from './components/FreeCameraHUD';
import { youtubeAudio } from './audio/youtubeAudio';

export default function App() {
  const [lightMode, setLightMode] = useState<LightMode>('noche');
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number | null>(null);
  const [playbackState, setPlaybackState] = useState<PlaybackState>('idle');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [cameraFocus, setCameraFocus] = useState<'default' | 'turntable' | 'lotus' | 'cat' | 'free'>('free');
  const [autoPlayNext, setAutoPlayNext] = useState<boolean>(true);
  const [isZenMode, setIsZenMode] = useState<boolean>(false);

  const turntableManagerRef = useRef<TurntableManager | null>(null);
  const toastTimerRef = useRef<number | null>(null);
  const manualMoveVector = useRef<{ x: number; y: number; z: number }>({ x: 0, y: 0, z: 0 });
  const autoPlayNextRef = useRef<boolean>(true);

  useEffect(() => {
    autoPlayNextRef.current = autoPlayNext;
  }, [autoPlayNext]);

  // Sync body attribute for CSS variables
  useEffect(() => {
    document.body.setAttribute('data-modo', lightMode);
  }, [lightMode]);

  // Hotkey 'H' to toggle Clean Screen / Zen Mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return;
      if (e.key === 'h' || e.key === 'H') {
        setIsZenMode((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const showAlert = (msg: string) => {
    setToastMessage(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // Wire up YouTube Audio Player
  useEffect(() => {
    youtubeAudio.attachContainer('youtube-audio-player-host');
    youtubeAudio.setCallbacks(
      () => {
        // onEnded handler
        if (autoPlayNextRef.current && turntableManagerRef.current) {
          showAlert('Disco terminado. Cambiando al siguiente automáticamente...');
          turntableManagerRef.current.siguienteDisco();
        }
      },
      (state) => {
        if (state === 'playing') setPlaybackState('playing');
        else if (state === 'paused') setPlaybackState('paused');
        else if (state === 'ended' && !autoPlayNextRef.current) setPlaybackState('idle');
      },
      (errorMsg) => {
        showAlert(errorMsg);
      }
    );
  }, []);

  const handleTrackChange = (index: number | null, state: PlaybackState) => {
    setCurrentTrackIndex(index);
    setPlaybackState(state);
  };

  const handleTogglePlayPause = () => {
    if (!turntableManagerRef.current) return;
    if (playbackState === 'playing') {
      turntableManagerRef.current.pause();
    } else if (playbackState === 'paused' && currentTrackIndex !== null) {
      turntableManagerRef.current.resume();
    } else if (currentTrackIndex === null) {
      turntableManagerRef.current.seleccionar(0);
    }
  };

  const handleSelectVinyl = (index: number) => {
    if (turntableManagerRef.current) {
      turntableManagerRef.current.seleccionar(index);
    }
  };

  const handleNextTrack = () => {
    if (turntableManagerRef.current) {
      turntableManagerRef.current.siguienteDisco();
    }
  };

  const handlePrevTrack = () => {
    if (turntableManagerRef.current) {
      turntableManagerRef.current.anteriorDisco();
    }
  };

  const handleEject = () => {
    if (turntableManagerRef.current) {
      turntableManagerRef.current.stopPlayback();
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden select-none bg-[var(--lienzo)] text-[var(--tinta)] font-sans">
      {/* Off-screen YouTube Audio Player Container */}
      <div
        id="youtube-audio-player-host"
        className="fixed -top-96 -left-96 pointer-events-none opacity-0 w-10 h-10 overflow-hidden"
        aria-hidden="true"
      />

      {/* 3D Diorama Canvas */}
      <DioramaCanvas
        lightMode={lightMode}
        onTrackChange={handleTrackChange}
        onAlert={showAlert}
        selectedTrackIndex={currentTrackIndex}
        turntableManagerRef={turntableManagerRef}
        cameraFocus={cameraFocus}
        manualMoveVector={manualMoveVector}
      />

      {/* Floating Restore UI Button (Shown in Clean Screen / Zen Mode) */}
      {isZenMode && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 pointer-events-auto animate-in fade-in duration-300">
          <button
            onClick={() => setIsZenMode(false)}
            aria-label="Restaurar interfaz"
            title="Mostrar interfaz (Presiona H o haz clic)"
            className="h-10 px-3.5 rounded-2xl flex items-center gap-2 bg-neutral-950/85 hover:bg-neutral-900 border border-white/20 text-white backdrop-blur-xl shadow-2xl transition-all hover:scale-105 active:scale-95 text-xs font-medium cursor-pointer"
          >
            <Eye className="w-4 h-4 text-emerald-400" />
            <span>Restaurar interfaz</span>
            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-white/70">H</span>
          </button>
        </div>
      )}

      {/* Camera Perspectives and Free Navigation HUD (Hidden in Clean Screen Mode) */}
      {!isZenMode && (
        <FreeCameraHUD
          cameraFocus={cameraFocus}
          onSelectFocus={(focus) => setCameraFocus(focus)}
          manualMoveVector={manualMoveVector}
        />
      )}

      {/* Top Left Header & Mode Selector (Hidden in Clean Screen Mode) */}
      {!isZenMode && (
        <div className="fixed top-4 left-4 z-30 flex flex-col gap-2 pointer-events-auto">
          <div className="flex items-center gap-2">
            {/* Project Title Card */}
            <div className="px-3.5 py-2 rounded-2xl bg-neutral-950/75 border border-white/15 text-white backdrop-blur-xl shadow-xl flex items-center gap-2.5">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <div>
                <h1 className="font-serif-garamond text-base sm:text-lg leading-none font-semibold text-white tracking-wide">
                  Loto del pantano
                </h1>
                <p className="text-[10px] text-white/60 tracking-wider uppercase mt-0.5">
                  Diorama 3D &middot; 16 Vinilos de Cuco
                </p>
              </div>
            </div>

            {/* Day / Night Mode Button */}
            <button
              id="luz"
              onClick={() => setLightMode(lightMode === 'noche' ? 'dia' : 'noche')}
              aria-label="Cambiar entre modo noche e iluminado"
              title={lightMode === 'noche' ? 'Cambiar a modo diurno' : 'Cambiar a modo nocturno'}
              className="h-11 px-3.5 rounded-2xl flex items-center gap-2 bg-neutral-950/75 border border-white/15 text-white backdrop-blur-xl transition-all hover:scale-105 active:scale-95 shadow-xl text-xs font-medium cursor-pointer"
            >
              {lightMode === 'noche' ? (
                <>
                  <Moon className="w-4 h-4 text-amber-300" />
                  <span className="hidden sm:inline text-xs">Noche</span>
                </>
              ) : (
                <>
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span className="hidden sm:inline text-xs">Día</span>
                </>
              )}
            </button>

            {/* Clean Screen / Hide UI Button */}
            <button
              onClick={() => {
                setIsZenMode(true);
                showAlert('Pantalla limpia activada. Presiona H para restaurar la interfaz.');
              }}
              aria-label="Ocultar interfaz / Pantalla limpia"
              title="Ocultar interfaz para ver la creación 3D limpia (Tecla H)"
              className="h-11 px-3.5 rounded-2xl flex items-center gap-2 bg-neutral-950/75 hover:bg-neutral-900 border border-white/15 text-white backdrop-blur-xl transition-all hover:scale-105 active:scale-95 shadow-xl text-xs font-medium cursor-pointer group"
            >
              <EyeOff className="w-4 h-4 text-emerald-300 group-hover:text-emerald-200" />
              <span className="hidden sm:inline text-xs">Pantalla limpia</span>
            </button>
          </div>

          {/* Keyboard Flight Hints */}
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-neutral-950/50 border border-white/10 text-[11px] text-white/70 backdrop-blur-md w-fit">
            <span className="font-mono bg-white/10 px-1 py-0.5 rounded text-[10px] text-amber-300">WASD</span>
            <span>Vuelo</span>
            <span className="text-white/30">&middot;</span>
            <span className="font-mono bg-white/10 px-1 py-0.5 rounded text-[10px] text-emerald-300">Espacio/Q</span>
            <span>Altura</span>
            <span className="text-white/30">&middot;</span>
            <span className="font-mono bg-white/10 px-1 py-0.5 rounded text-[10px]">Ratón</span>
            <span>Giro 360&deg;</span>
            <span className="text-white/30">&middot;</span>
            <span className="font-mono bg-white/10 px-1 py-0.5 rounded text-[10px] text-cyan-300">H</span>
            <span>Ocultar UI</span>
          </div>
        </div>
      )}

      {/* Top Banner Alert Toast */}
      {toastMessage && (
        <div
          id="alerta"
          role="status"
          className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-2xl text-xs font-medium tracking-wide bg-neutral-900/90 border border-white/20 text-white backdrop-blur-2xl shadow-2xl transition-all duration-300 pointer-events-none max-w-md text-center animate-in fade-in"
        >
          {toastMessage}
        </div>
      )}

      {/* Mini Music Player (Bottom Center) with Play/Pause, Next/Prev, Auto-Advance, Volume & Playlist (Hidden in Clean Screen Mode) */}
      {!isZenMode && (
        <MiniMusicPlayer
          selectedIndex={currentTrackIndex}
          playbackState={playbackState}
          autoPlayNext={autoPlayNext}
          onToggleAutoPlayNext={() => setAutoPlayNext(!autoPlayNext)}
          onSelectTrack={handleSelectVinyl}
          onNextTrack={handleNextTrack}
          onPrevTrack={handlePrevTrack}
          onPlayPause={handleTogglePlayPause}
          onEject={handleEject}
        />
      )}
    </div>
  );
}
