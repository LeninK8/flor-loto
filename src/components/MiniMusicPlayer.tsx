import React, { useEffect, useState } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Disc,
  ListMusic,
  Repeat,
  Radio,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { PLAYLIST } from './diorama/turntableModels';
import { PlaybackState } from '../types';
import { youtubeAudio } from '../audio/youtubeAudio';

interface MiniMusicPlayerProps {
  selectedIndex: number | null;
  playbackState: PlaybackState;
  autoPlayNext: boolean;
  onToggleAutoPlayNext: () => void;
  onSelectTrack: (index: number) => void;
  onNextTrack: () => void;
  onPrevTrack: () => void;
  onPlayPause: () => void;
  onEject: () => void;
}

export const MiniMusicPlayer: React.FC<MiniMusicPlayerProps> = ({
  selectedIndex,
  playbackState,
  autoPlayNext,
  onToggleAutoPlayNext,
  onSelectTrack,
  onNextTrack,
  onPrevTrack,
  onPlayPause,
  onEject
}) => {
  const [volume, setVolume] = useState(70);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  const currentTrack = selectedIndex !== null ? PLAYLIST[selectedIndex] : null;
  const isPlaying = playbackState === 'playing';

  // Time ticker
  useEffect(() => {
    let interval: number;
    if (isPlaying) {
      interval = window.setInterval(() => {
        setCurrentTime(youtubeAudio.getCurrentTime());
        const dur = youtubeAudio.getDuration();
        if (dur > 0) setDuration(dur);
      }, 500);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setVolume(val);
    if (isMuted && val > 0) setIsMuted(false);
    youtubeAudio.setVolume(val / 100);
  };

  const handleToggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      youtubeAudio.setVolume(volume / 100);
    } else {
      setIsMuted(true);
      youtubeAudio.setVolume(0);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const pos = Number(e.target.value);
    setCurrentTime(pos);
    youtubeAudio.seekTo(pos);
  };

  const formatTime = (secs: number) => {
    if (!secs || isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div id="mini-music-player-panel" className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[95%] max-w-2xl">
      {/* Playlist Drawer */}
      {showPlaylist && (
        <div
          id="music-playlist-drawer"
          className="mb-3 max-h-72 overflow-y-auto rounded-2xl bg-neutral-950/90 backdrop-blur-xl border border-white/10 shadow-2xl p-4 text-white text-xs scrollbar-thin scrollbar-thumb-white/20"
        >
          <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-2">
            <div className="flex items-center gap-2">
              <ListMusic className="w-4 h-4 text-emerald-400" />
              <span className="font-medium tracking-wide">Colección de 16 Discos (Cuco)</span>
            </div>
            <span className="text-[11px] text-white/50">{PLAYLIST.length} temas disponibles</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {PLAYLIST.map((track, idx) => {
              const isCurrent = selectedIndex === idx;
              return (
                <button
                  key={track.id}
                  id={`playlist-track-btn-${idx}`}
                  onClick={() => {
                    onSelectTrack(idx);
                    setShowPlaylist(false);
                  }}
                  className={`flex items-center gap-3 p-2 rounded-xl text-left transition-all ${
                    isCurrent
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium'
                      : 'hover:bg-white/5 text-white/80 hover:text-white'
                  }`}
                >
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 border border-white/20 shadow-sm"
                    style={{ backgroundColor: track.color }}
                  >
                    <span className="text-[10px] font-bold text-white drop-shadow">
                      {idx + 1}
                    </span>
                  </div>
                  <div className="truncate flex-1">
                    <p className="truncate leading-tight">{track.title}</p>
                    <p className="text-[10px] opacity-60 truncate">{track.artist || 'Cuco'}</p>
                  </div>
                  {isCurrent && isPlaying && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Mini Controller Card */}
      <div className="rounded-2xl bg-neutral-950/85 backdrop-blur-xl border border-white/15 shadow-2xl p-3 sm:p-4 text-white">
        {/* Top bar: Track info and controls toggle */}
        <div className="flex items-center justify-between gap-3">
          {/* Track icon and title */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div
              className={`w-11 h-11 rounded-full shrink-0 flex items-center justify-center border-2 border-white/20 shadow-md ${
                isPlaying ? 'animate-spin' : ''
              }`}
              style={{
                backgroundColor: currentTrack?.color || '#334155',
                animationDuration: '4s'
              }}
            >
              <Disc className="w-6 h-6 text-white/90" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold truncate leading-tight">
                  {currentTrack ? currentTrack.title : 'Selecciona un disco en 3D'}
                </p>
                {currentTrack && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/10 text-white/70 shrink-0">
                    Disco {selectedIndex! + 1}/16
                  </span>
                )}
              </div>
              <p className="text-xs text-white/60 truncate">
                {currentTrack?.artist || 'Haz clic sobre los vinilos o usa los controles'}
              </p>
            </div>
          </div>

          {/* Quick buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Auto play toggle */}
            <button
              id="autoplay-toggle-btn"
              onClick={onToggleAutoPlayNext}
              title={autoPlayNext ? 'Auto-avance activado (pasa al siguiente disco al terminar)' : 'Auto-avance desactivado'}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs transition-colors ${
                autoPlayNext
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium'
                  : 'bg-white/5 text-white/50 hover:bg-white/10'
              }`}
            >
              <Repeat className={`w-3.5 h-3.5 ${autoPlayNext ? 'text-emerald-400' : 'text-white/40'}`} />
              <span className="hidden sm:inline">Auto-Siguiente</span>
            </button>

            {/* Playlist drawer toggle */}
            <button
              id="playlist-toggle-btn"
              onClick={() => setShowPlaylist(!showPlaylist)}
              className={`p-2 rounded-xl text-xs transition-colors ${
                showPlaylist ? 'bg-white/20 text-white' : 'bg-white/5 hover:bg-white/10 text-white/80'
              }`}
              title="Ver los 16 discos"
            >
              <ListMusic className="w-4 h-4" />
            </button>

            {/* Expand / Minimize toggle */}
            <button
              id="expand-player-btn"
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70"
            >
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Expanded Controls: Progress scrubber, Playback buttons, Volume */}
        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-white/10 space-y-2.5">
            {/* Scrubber */}
            <div className="flex items-center gap-2 text-[11px] text-white/50">
              <span className="w-9 text-right font-mono">{formatTime(currentTime)}</span>
              <input
                id="music-scrubber-slider"
                type="range"
                min="0"
                max={duration || 100}
                value={currentTime}
                onChange={handleSeek}
                disabled={!currentTrack}
                className="flex-1 h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-emerald-400"
              />
              <span className="w-9 font-mono">{formatTime(duration)}</span>
            </div>

            {/* Playback Controls Row */}
            <div className="flex items-center justify-between">
              {/* Left: Eject / Stop */}
              <button
                id="eject-disc-btn"
                onClick={onEject}
                title="Expulsar vinilo al suelo"
                disabled={!currentTrack}
                className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-white/70 hover:text-white disabled:opacity-40 flex items-center gap-1.5 transition-colors"
              >
                <Disc className="w-3.5 h-3.5 text-amber-300" />
                <span className="hidden sm:inline">Expulsar</span>
              </button>

              {/* Center: Previous - Play/Pause - Next */}
              <div className="flex items-center gap-3">
                <button
                  id="prev-disc-btn"
                  onClick={onPrevTrack}
                  title="Disco anterior"
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all hover:scale-105 active:scale-95"
                >
                  <SkipBack className="w-4 h-4" />
                </button>

                <button
                  id="play-pause-btn"
                  onClick={onPlayPause}
                  title={isPlaying ? 'Pausar música' : 'Reproducir música'}
                  className="p-3 rounded-full bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold shadow-lg shadow-emerald-500/30 transition-all hover:scale-105 active:scale-95"
                >
                  {isPlaying ? (
                    <Pause className="w-5 h-5 fill-current" />
                  ) : (
                    <Play className="w-5 h-5 fill-current ml-0.5" />
                  )}
                </button>

                <button
                  id="next-disc-btn"
                  onClick={onNextTrack}
                  title="Siguiente disco"
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all hover:scale-105 active:scale-95"
                >
                  <SkipForward className="w-4 h-4" />
                </button>
              </div>

              {/* Right: Volume slider */}
              <div className="flex items-center gap-2 w-28 sm:w-32 justify-end">
                <button
                  id="mute-unmute-btn"
                  onClick={handleToggleMute}
                  className="text-white/70 hover:text-white transition-colors"
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-4 h-4 text-red-400" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </button>
                <input
                  id="volume-slider"
                  type="range"
                  min="0"
                  max="100"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-16 sm:w-20 h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
