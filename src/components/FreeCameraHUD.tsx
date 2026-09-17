import React, { useState } from 'react';
import {
  Compass,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  MoveUp,
  MoveDown,
  Info,
  Maximize2
} from 'lucide-react';

interface FreeCameraHUDProps {
  cameraFocus: 'default' | 'turntable' | 'lotus' | 'cat' | 'free';
  onSelectFocus: (focus: 'default' | 'turntable' | 'lotus' | 'cat' | 'free') => void;
  manualMoveVector: React.MutableRefObject<{ x: number; y: number; z: number }>;
}

export const FreeCameraHUD: React.FC<FreeCameraHUDProps> = ({
  cameraFocus,
  onSelectFocus,
  manualMoveVector
}) => {
  const [showHelp, setShowHelp] = useState(false);
  const [showTouchPad, setShowTouchPad] = useState(true);

  // Touch/Mouse button press handlers for continuous movement
  const startMove = (x: number, y: number, z: number) => {
    onSelectFocus('free');
    manualMoveVector.current = { x, y, z };
  };

  const stopMove = () => {
    manualMoveVector.current = { x: 0, y: 0, z: 0 };
  };

  return (
    <>
      {/* Top right camera perspective pills */}
      <div id="camera-controls-bar" className="fixed top-4 right-4 z-40 flex flex-col items-end gap-2">
        <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-neutral-950/75 backdrop-blur-xl border border-white/15 shadow-xl text-white text-xs">
          <button
            id="focus-free-btn"
            onClick={() => onSelectFocus('free')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition-all ${
              cameraFocus === 'free'
                ? 'bg-amber-500/30 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'hover:bg-white/10 text-white/70'
            }`}
            title="Cámara libre: muévete por donde sea con WASD o los controles táctiles"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Cámara Libre</span>
          </button>

          <button
            id="focus-default-btn"
            onClick={() => onSelectFocus('default')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              cameraFocus === 'default'
                ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 font-medium'
                : 'hover:bg-white/10 text-white/70'
            }`}
          >
            General
          </button>

          <button
            id="focus-turntable-btn"
            onClick={() => onSelectFocus('turntable')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              cameraFocus === 'turntable'
                ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 font-medium'
                : 'hover:bg-white/10 text-white/70'
            }`}
          >
            Tocadiscos
          </button>

          <button
            id="focus-lotus-btn"
            onClick={() => onSelectFocus('lotus')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              cameraFocus === 'lotus'
                ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 font-medium'
                : 'hover:bg-white/10 text-white/70'
            }`}
          >
            Loto
          </button>

          <button
            id="focus-cat-btn"
            onClick={() => onSelectFocus('cat')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              cameraFocus === 'cat'
                ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 font-medium'
                : 'hover:bg-white/10 text-white/70'
            }`}
          >
            Gato
          </button>

          <button
            id="toggle-camera-help-btn"
            onClick={() => setShowHelp(!showHelp)}
            className="p-1.5 rounded-xl hover:bg-white/10 text-white/60 hover:text-white"
            title="Ayuda de controles"
          >
            <Info className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Help tooltip popover */}
        {showHelp && (
          <div
            id="camera-help-popover"
            className="max-w-xs p-3 rounded-2xl bg-neutral-950/90 backdrop-blur-xl border border-white/15 text-white text-xs shadow-2xl space-y-2 animate-in fade-in"
          >
            <p className="font-semibold text-amber-300 flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5" /> Navegación libre por donde sea
            </p>
            <ul className="text-white/80 space-y-1 text-[11px] list-disc list-inside">
              <li><strong className="text-white">W / S / A / D o Flechas:</strong> Moverte hacia adelante, atrás y lados.</li>
              <li><strong className="text-white">Espacio / Q:</strong> Elevar o descender la cámara.</li>
              <li><strong className="text-white">Shift:</strong> Acelerar vuelo.</li>
              <li><strong className="text-white">Arrastrar ratón / dedo:</strong> Rotar vista y mirar en 360°.</li>
              <li><strong className="text-white">Rueda / Pinzar:</strong> Acercar o alejar el zoom.</li>
            </ul>
          </div>
        )}
      </div>

      {/* Floating On-Screen D-Pad for Touch/Free flying anywhere */}
      <div id="free-camera-dpad" className="fixed bottom-36 right-4 z-30 flex flex-col items-center">
        {showTouchPad ? (
          <div className="p-3 rounded-3xl bg-neutral-950/70 backdrop-blur-md border border-white/15 shadow-2xl flex flex-col items-center gap-1 text-white">
            <div className="flex items-center justify-between w-full px-1 mb-1">
              <span className="text-[10px] text-white/60 font-medium tracking-wide flex items-center gap-1">
                <Compass className="w-3 h-3 text-amber-400" /> Vuelo libre
              </span>
              <button
                onClick={() => setShowTouchPad(false)}
                className="text-white/40 hover:text-white text-[10px]"
              >
                ✕
              </button>
            </div>

            {/* Forward */}
            <button
              onPointerDown={() => startMove(0, 0, 1)}
              onPointerUp={stopMove}
              onPointerLeave={stopMove}
              className="p-2.5 rounded-xl bg-white/10 active:bg-amber-500/40 text-white active:text-amber-200 transition-colors shadow-sm"
              title="Avanzar (W)"
            >
              <ArrowUp className="w-4 h-4" />
            </button>

            {/* Left - Center (Up/Down) - Right */}
            <div className="flex items-center gap-1">
              <button
                onPointerDown={() => startMove(-1, 0, 0)}
                onPointerUp={stopMove}
                onPointerLeave={stopMove}
                className="p-2.5 rounded-xl bg-white/10 active:bg-amber-500/40 text-white active:text-amber-200 transition-colors shadow-sm"
                title="Izquierda (A)"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>

              <div className="flex flex-col gap-1">
                <button
                  onPointerDown={() => startMove(0, 1, 0)}
                  onPointerUp={stopMove}
                  onPointerLeave={stopMove}
                  className="p-1 rounded-lg bg-emerald-500/20 active:bg-emerald-500/40 text-emerald-300"
                  title="Subir (Espacio)"
                >
                  <MoveUp className="w-3 h-3" />
                </button>
                <button
                  onPointerDown={() => startMove(0, -1, 0)}
                  onPointerUp={stopMove}
                  onPointerLeave={stopMove}
                  className="p-1 rounded-lg bg-emerald-500/20 active:bg-emerald-500/40 text-emerald-300"
                  title="Bajar (Q)"
                >
                  <MoveDown className="w-3 h-3" />
                </button>
              </div>

              <button
                onPointerDown={() => startMove(1, 0, 0)}
                onPointerUp={stopMove}
                onPointerLeave={stopMove}
                className="p-2.5 rounded-xl bg-white/10 active:bg-amber-500/40 text-white active:text-amber-200 transition-colors shadow-sm"
                title="Derecha (D)"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Backward */}
            <button
              onPointerDown={() => startMove(0, 0, -1)}
              onPointerUp={stopMove}
              onPointerLeave={stopMove}
              className="p-2.5 rounded-xl bg-white/10 active:bg-amber-500/40 text-white active:text-amber-200 transition-colors shadow-sm"
              title="Retroceder (S)"
            >
              <ArrowDown className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowTouchPad(true)}
            className="p-2.5 rounded-2xl bg-neutral-950/70 backdrop-blur-md border border-white/15 text-white/70 hover:text-white shadow-xl"
            title="Mostrar control de vuelo libre"
          >
            <Compass className="w-4 h-4 text-amber-400" />
          </button>
        )}
      </div>
    </>
  );
};
