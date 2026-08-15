import React, { useEffect } from 'react';
import { Play, Pause, RotateCcw, Plus, Minus, X, Bell, Zap } from 'lucide-react';
import { audioService } from '../services/audioService';

interface RestTimerModalProps {
  isOpen: boolean;
  onClose: () => void;
  secondsLeft: number;
  totalDuration: number;
  isRunning: boolean;
  onStart: (duration: number) => void;
  onPause: () => void;
  onResume: () => void;
  onReset: () => void;
  onAdjustTime: (deltaSeconds: number) => void;
}

export const RestTimerModal: React.FC<RestTimerModalProps> = ({
  isOpen,
  onClose,
  secondsLeft,
  totalDuration,
  isRunning,
  onStart,
  onPause,
  onResume,
  onReset,
  onAdjustTime
}) => {
  // Beep during the last 3 seconds
  useEffect(() => {
    if (isRunning && secondsLeft > 0 && secondsLeft <= 3) {
      audioService.playWarningBeep();
    }
  }, [secondsLeft, isRunning]);

  if (!isOpen) return null;

  const progressPercent = totalDuration > 0 ? ((totalDuration - secondsLeft) / totalDuration) * 100 : 0;
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const formattedTime = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

  return (
    <div
      id="rest-timer-overlay"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
    >
      <div
        id="rest-timer-card"
        className="w-full max-w-sm bg-[#121217] border border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col items-center relative text-white animate-in zoom-in-95 duration-150"
      >
        {/* Close / Minimize button */}
        <button
          id="btn-close-timer-modal"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white rounded-full bg-zinc-800 border border-white/10 transition-colors"
          aria-label="Fermer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-2 text-[#D4FF00] text-xs font-bold uppercase tracking-wider">
          <Zap className="w-4 h-4 fill-current" />
          <span>Timer de Récupération</span>
        </div>

        {/* Circular Progress Ring with Neon Accent */}
        <div className="relative w-48 h-48 flex items-center justify-center my-2">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            {/* Background track */}
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="transparent"
              stroke="#27272a"
              strokeWidth="6"
            />
            {/* Active progress */}
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="transparent"
              stroke={secondsLeft <= 5 ? '#ef4444' : '#D4FF00'}
              strokeWidth="6"
              strokeDasharray={263.89}
              strokeDashoffset={263.89 - (263.89 * progressPercent) / 100}
              strokeLinecap="round"
              className="transition-all duration-300 ease-linear shadow-[0_0_15px_rgba(212,255,0,0.5)]"
            />
          </svg>

          {/* Time display */}
          <div className="absolute flex flex-col items-center">
            <span className="text-4xl font-black tracking-tight font-mono text-white">
              {formattedTime}
            </span>
            <span className={`text-[10px] uppercase tracking-widest font-bold mt-1 ${
              secondsLeft <= 5 ? 'text-red-400 animate-pulse' : 'text-[#D4FF00]'
            }`}>
              {isRunning ? 'En cours' : secondsLeft === 0 ? 'Terminé !' : 'En pause'}
            </span>
          </div>
        </div>

        {/* Adjust time buttons */}
        <div className="flex items-center gap-3 my-3">
          <button
            id="btn-timer-minus-15"
            onClick={() => onAdjustTime(-15)}
            className="flex items-center gap-1 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-white/10 rounded-xl text-xs font-bold text-zinc-300 transition-colors"
          >
            <Minus className="w-3.5 h-3.5" /> 15s
          </button>
          <button
            id="btn-timer-plus-15"
            onClick={() => onAdjustTime(15)}
            className="flex items-center gap-1 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-white/10 rounded-xl text-xs font-bold text-[#D4FF00] transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> 15s
          </button>
        </div>

        {/* Preset Duration Buttons */}
        <div className="grid grid-cols-3 gap-2 w-full my-3">
          <button
            id="btn-timer-preset-90"
            onClick={() => onStart(90)}
            className={`py-2 px-1 rounded-2xl text-xs font-bold transition-all border ${
              totalDuration === 90 && isRunning
                ? 'bg-[#D4FF00] text-black border-[#D4FF00] font-black shadow-[0_0_12px_rgba(212,255,0,0.3)]'
                : 'bg-zinc-900 text-zinc-300 border-white/10 hover:bg-zinc-800'
            }`}
          >
            1m 30s
            <div className="text-[10px] opacity-75 font-normal">Standard</div>
          </button>

          <button
            id="btn-timer-preset-120"
            onClick={() => onStart(120)}
            className={`py-2 px-1 rounded-2xl text-xs font-bold transition-all border ${
              totalDuration === 120 && isRunning
                ? 'bg-[#D4FF00] text-black border-[#D4FF00] font-black shadow-[0_0_12px_rgba(212,255,0,0.3)]'
                : 'bg-zinc-900 text-zinc-300 border-white/10 hover:bg-zinc-800'
            }`}
          >
            2m 00s
            <div className="text-[10px] opacity-75 font-normal">Lourd / 100%</div>
          </button>

          <button
            id="btn-timer-preset-180"
            onClick={() => onStart(180)}
            className={`py-2 px-1 rounded-2xl text-xs font-bold transition-all border ${
              totalDuration === 180 && isRunning
                ? 'bg-[#D4FF00] text-black border-[#D4FF00] font-black shadow-[0_0_12px_rgba(212,255,0,0.3)]'
                : 'bg-zinc-900 text-zinc-300 border-white/10 hover:bg-zinc-800'
            }`}
          >
            3m 00s
            <div className="text-[10px] opacity-75 font-normal">Complet</div>
          </button>
        </div>

        {/* Main Controls */}
        <div className="flex items-center gap-3 w-full mt-2">
          <button
            id="btn-timer-reset"
            onClick={onReset}
            className="p-3.5 bg-zinc-800 hover:bg-zinc-700 rounded-2xl text-zinc-300 hover:text-white border border-white/10 transition-colors"
            title="Réinitialiser"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          {isRunning ? (
            <button
              id="btn-timer-pause"
              onClick={onPause}
              className="flex-1 py-3.5 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-2xl flex items-center justify-center gap-2 border border-white/10 transition-colors uppercase tracking-wider text-xs"
            >
              <Pause className="w-4 h-4 fill-current text-[#D4FF00]" />
              <span>Mettre en pause</span>
            </button>
          ) : (
            <button
              id="btn-timer-start-resume"
              onClick={secondsLeft > 0 ? onResume : () => onStart(90)}
              className="flex-1 py-3.5 bg-[#D4FF00] hover:bg-[#b8e600] text-black font-black rounded-2xl flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(212,255,0,0.3)] transition-all active:scale-[0.98] uppercase tracking-wider text-xs"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{secondsLeft > 0 && secondsLeft < totalDuration ? 'Reprendre' : 'Lancer le repos'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
