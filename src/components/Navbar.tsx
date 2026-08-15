import React from 'react';
import { Dumbbell, TrendingUp, Settings, Timer } from 'lucide-react';

interface NavbarProps {
  activeTab: 'training' | 'progression' | 'settings';
  setActiveTab: (tab: 'training' | 'progression' | 'settings') => void;
  isTimerActive: boolean;
  timerSecondsLeft: number;
  onOpenTimer: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  isTimerActive,
  timerSecondsLeft,
  onOpenTimer
}) => {
  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <nav
      id="bottom-navigation-bar"
      className="fixed bottom-0 left-0 right-0 z-40 bg-[#09090D]/90 backdrop-blur-2xl border-t border-white/[0.08] pb-safe shadow-[0_-10px_30px_rgba(0,0,0,0.5)]"
    >
      <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-around relative">
        {/* Floating active timer pill if running with neon pulse */}
        {isTimerActive && (
          <button
            id="floating-nav-timer-pill"
            onClick={onOpenTimer}
            className="absolute -top-11 left-1/2 -translate-x-1/2 bg-[#D4FF00] text-black font-black px-4 py-1.5 rounded-full shadow-[0_0_25px_rgba(212,255,0,0.5)] flex items-center gap-1.5 text-xs animate-bounce transition-all active:scale-95 border border-[#D4FF00]"
          >
            <Timer className="w-3.5 h-3.5 text-black fill-current" />
            <span className="font-mono font-black tracking-tight">Repos : {formatTimer(timerSecondsLeft)}</span>
          </button>
        )}

        {/* Tab 1: Training */}
        <button
          id="nav-tab-training"
          onClick={() => setActiveTab('training')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
            activeTab === 'training'
              ? 'text-white'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <div className={`w-10 h-8 rounded-xl flex items-center justify-center transition-all ${
            activeTab === 'training'
              ? 'bg-zinc-800/90 text-[#D4FF00] border border-white/10 shadow-inner'
              : 'text-zinc-500'
          }`}>
            <Dumbbell className={`w-5 h-5 ${activeTab === 'training' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          </div>
          <span className={`text-[10px] font-bold uppercase tracking-wider mt-1 ${
            activeTab === 'training' ? 'text-[#D4FF00] font-black' : 'text-zinc-500'
          }`}>Séance</span>
        </button>

        {/* Tab 2: Progression / Stats */}
        <button
          id="nav-tab-progression"
          onClick={() => setActiveTab('progression')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
            activeTab === 'progression'
              ? 'text-white'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <div className={`w-10 h-8 rounded-xl flex items-center justify-center transition-all ${
            activeTab === 'progression'
              ? 'bg-zinc-800/90 text-[#D4FF00] border border-white/10 shadow-inner'
              : 'text-zinc-500'
          }`}>
            <TrendingUp className={`w-5 h-5 ${activeTab === 'progression' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          </div>
          <span className={`text-[10px] font-bold uppercase tracking-wider mt-1 ${
            activeTab === 'progression' ? 'text-[#D4FF00] font-black' : 'text-zinc-500'
          }`}>Stats</span>
        </button>

        {/* Tab 3: Settings */}
        <button
          id="nav-tab-settings"
          onClick={() => setActiveTab('settings')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
            activeTab === 'settings'
              ? 'text-white'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <div className={`w-10 h-8 rounded-xl flex items-center justify-center transition-all ${
            activeTab === 'settings'
              ? 'bg-zinc-800/90 text-[#D4FF00] border border-white/10 shadow-inner'
              : 'text-zinc-500'
          }`}>
            <Settings className={`w-5 h-5 ${activeTab === 'settings' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          </div>
          <span className={`text-[10px] font-bold uppercase tracking-wider mt-1 ${
            activeTab === 'settings' ? 'text-[#D4FF00] font-black' : 'text-zinc-500'
          }`}>Config</span>
        </button>
      </div>
    </nav>
  );
};
