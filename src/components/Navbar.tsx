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
      className="fixed bottom-0 left-0 right-0 z-40 bg-[#0A0A0A]/90 backdrop-blur-xl border-t border-[#262626] pb-safe"
    >
      <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-around relative">
        {/* Floating active timer pill if running */}
        {isTimerActive && (
          <button
            id="floating-nav-timer-pill"
            onClick={onOpenTimer}
            className="absolute -top-11 left-1/2 -translate-x-1/2 bg-[#A3FF12] text-black font-black px-4 py-1.5 rounded-full shadow-xl shadow-[#A3FF12]/20 flex items-center gap-1.5 text-xs animate-pulse transition-all active:scale-95 border border-[#A3FF12]"
          >
            <Timer className="w-3.5 h-3.5 text-black" />
            <span className="font-mono">Repos : {formatTimer(timerSecondsLeft)}</span>
          </button>
        )}

        <button
          id="nav-tab-training"
          onClick={() => setActiveTab('training')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
            activeTab === 'training'
              ? 'text-[#A3FF12]'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <div className={`w-10 h-8 rounded-xl flex items-center justify-center transition-all ${
            activeTab === 'training' ? 'bg-[#A3FF12]/15 border border-[#A3FF12]/30' : ''
          }`}>
            <Dumbbell className={`w-5 h-5 ${activeTab === 'training' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider mt-0.5">Train</span>
        </button>

        <button
          id="nav-tab-progression"
          onClick={() => setActiveTab('progression')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
            activeTab === 'progression'
              ? 'text-[#A3FF12]'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <div className={`w-10 h-8 rounded-xl flex items-center justify-center transition-all ${
            activeTab === 'progression' ? 'bg-[#A3FF12]/15 border border-[#A3FF12]/30' : ''
          }`}>
            <TrendingUp className={`w-5 h-5 ${activeTab === 'progression' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider mt-0.5">Stats</span>
        </button>

        <button
          id="nav-tab-settings"
          onClick={() => setActiveTab('settings')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
            activeTab === 'settings'
              ? 'text-[#A3FF12]'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <div className={`w-10 h-8 rounded-xl flex items-center justify-center transition-all ${
            activeTab === 'settings' ? 'bg-[#A3FF12]/15 border border-[#A3FF12]/30' : ''
          }`}>
            <Settings className={`w-5 h-5 ${activeTab === 'settings' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider mt-0.5">Config</span>
        </button>
      </div>
    </nav>
  );
};

