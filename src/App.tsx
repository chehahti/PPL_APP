/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Dumbbell, Timer, Flame, Sparkles, Smartphone, Download } from 'lucide-react';
import { AppSettings, CompletedWorkout, ExerciseDefinition } from './types/fitness';
import { StorageService, DEFAULT_SETTINGS } from './services/storageService';
import { audioService } from './services/audioService';
import { notificationService } from './services/notificationService';
import { Navbar } from './components/Navbar';
import { WorkoutTab } from './components/WorkoutTab';
import { ProgressionTab } from './components/ProgressionTab';
import { SettingsTab } from './components/SettingsTab';
import { RestTimerModal } from './components/RestTimerModal';
import { AddToHomeScreenModal } from './components/AddToHomeScreenModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<'training' | 'progression' | 'settings'>('training');
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [exercises, setExercises] = useState<ExerciseDefinition[]>([]);
  const [history, setHistory] = useState<CompletedWorkout[]>([]);
  const [resetCount, setResetCount] = useState<number>(0);

  // Rest Timer State (Timestamp-based to continue perfectly in background)
  const [timerSecondsLeft, setTimerSecondsLeft] = useState<number>(0);
  const [timerTotalDuration, setTimerTotalDuration] = useState<number>(90);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [isTimerModalOpen, setIsTimerModalOpen] = useState<boolean>(false);
  const timerEndTimeRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<number | null>(null);

  // PWA Add to Home Screen State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState<boolean>(false);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);

  // Initialize data from local storage & check standalone PWA mode
  const refreshData = () => {
    setSettings(StorageService.getSettings());
    setExercises(StorageService.getExercises());
    setHistory(StorageService.getHistory());
  };

  useEffect(() => {
    refreshData();

    // Check if app is running in Standalone / PWA mode
    const checkStandalone = () => {
      const isStandaloneMode = 
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true ||
        document.referrer.includes('android-app://');
      setIsStandalone(Boolean(isStandaloneMode));
    };
    checkStandalone();

    // Check existing timer in localStorage
    try {
      const savedEndTime = localStorage.getItem('ppl_timer_end_time');
      const savedTotal = localStorage.getItem('ppl_timer_total');
      if (savedEndTime && savedTotal) {
        const endTime = parseInt(savedEndTime, 10);
        const total = parseInt(savedTotal, 10);
        const now = Date.now();
        if (endTime > now) {
          const remaining = Math.ceil((endTime - now) / 1000);
          timerEndTimeRef.current = endTime;
          setTimerTotalDuration(total);
          setTimerSecondsLeft(remaining);
          setIsTimerRunning(true);
        } else {
          localStorage.removeItem('ppl_timer_end_time');
        }
      }
    } catch {
      //
    }

    // Capture PWA beforeinstallprompt event for Android / Chrome
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Global click listener to unlock Web Audio API on first interaction
    const unlockAudioContext = () => {
      audioService.unlock();
      window.removeEventListener('click', unlockAudioContext);
      window.removeEventListener('touchstart', unlockAudioContext);
    };
    window.addEventListener('click', unlockAudioContext);
    window.addEventListener('touchstart', unlockAudioContext);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('click', unlockAudioContext);
      window.removeEventListener('touchstart', unlockAudioContext);
    };
  }, []);

  // Timer Tick Interval with Timestamp Accuracy (handles background / lock screen)
  useEffect(() => {
    const handleTimerTick = () => {
      if (!timerEndTimeRef.current) return;
      const now = Date.now();
      const diffMs = timerEndTimeRef.current - now;
      const remainingSecs = Math.max(0, Math.ceil(diffMs / 1000));

      if (remainingSecs <= 0) {
        // Timer Finished!
        setIsTimerRunning(false);
        setTimerSecondsLeft(0);
        timerEndTimeRef.current = null;
        try {
          localStorage.removeItem('ppl_timer_end_time');
        } catch {}

        if (settings.soundEnabled) audioService.playFinishChime();
        if (settings.vibrationEnabled) audioService.vibrate([400, 200, 400, 200, 600]);
        notificationService.sendTimerCompletedNotification();
      } else {
        setTimerSecondsLeft(remainingSecs);
      }
    };

    if (isTimerRunning && timerEndTimeRef.current) {
      // Run frequent tick to ensure smooth UI and immediate sync
      timerIntervalRef.current = window.setInterval(handleTimerTick, 250);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }

    // Immediate check when coming back from background
    const handleVisibilityOrFocusChange = () => {
      if (document.visibilityState === 'visible' && isTimerRunning && timerEndTimeRef.current) {
        handleTimerTick();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityOrFocusChange);
    window.addEventListener('focus', handleVisibilityOrFocusChange);

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocusChange);
      window.removeEventListener('focus', handleVisibilityOrFocusChange);
    };
  }, [isTimerRunning, settings.soundEnabled, settings.vibrationEnabled]);

  // Timer Control Handlers
  const handleStartTimer = (durationSeconds = 90) => {
    audioService.unlock();
    notificationService.requestPermission().catch(() => {});

    const endTime = Date.now() + durationSeconds * 1000;
    timerEndTimeRef.current = endTime;
    try {
      localStorage.setItem('ppl_timer_end_time', endTime.toString());
      localStorage.setItem('ppl_timer_total', durationSeconds.toString());
    } catch {}

    setTimerTotalDuration(durationSeconds);
    setTimerSecondsLeft(durationSeconds);
    setIsTimerRunning(true);
    setIsTimerModalOpen(true);
    if (settings.soundEnabled) audioService.playTick();
  };

  const handlePauseTimer = () => {
    timerEndTimeRef.current = null;
    try {
      localStorage.removeItem('ppl_timer_end_time');
    } catch {}
    setIsTimerRunning(false);
  };

  const handleResumeTimer = () => {
    audioService.unlock();
    const remaining = timerSecondsLeft > 0 ? timerSecondsLeft : (timerTotalDuration || 90);
    const endTime = Date.now() + remaining * 1000;
    timerEndTimeRef.current = endTime;
    try {
      localStorage.setItem('ppl_timer_end_time', endTime.toString());
      localStorage.setItem('ppl_timer_total', (timerTotalDuration || 90).toString());
    } catch {}

    setTimerSecondsLeft(remaining);
    setIsTimerRunning(true);
  };

  const handleResetTimer = () => {
    timerEndTimeRef.current = null;
    try {
      localStorage.removeItem('ppl_timer_end_time');
    } catch {}
    setIsTimerRunning(false);
    setTimerSecondsLeft(timerTotalDuration);
  };

  const handleAdjustTimer = (delta: number) => {
    const newRemaining = Math.max(0, timerSecondsLeft + delta);
    const newTotal = Math.max(0, timerTotalDuration + delta);
    setTimerSecondsLeft(newRemaining);
    setTimerTotalDuration(newTotal);

    if (isTimerRunning) {
      const endTime = Date.now() + newRemaining * 1000;
      timerEndTimeRef.current = endTime;
      try {
        localStorage.setItem('ppl_timer_end_time', endTime.toString());
        localStorage.setItem('ppl_timer_total', newTotal.toString());
      } catch {}
    }
  };

  const handleUpdateSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    StorageService.saveSettings(newSettings);
  };

  const handleResetAllData = () => {
    StorageService.resetAllData();
    refreshData();
    setResetCount((prev) => prev + 1);
    setIsTimerRunning(false);
    setTimerSecondsLeft(0);
    timerEndTimeRef.current = null;
    try {
      localStorage.removeItem('ppl_timer_end_time');
      localStorage.removeItem('ppl_timer_total');
    } catch {}
  };

  const formatTimerShort = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="min-h-screen bg-[#09090D] text-zinc-100 antialiased font-sans selection:bg-[#D4FF00] selection:text-black flex flex-col">
      {/* Modern Trending Athletic Header */}
      <header
        id="app-top-header"
        className="sticky top-0 z-30 bg-[#09090D]/90 backdrop-blur-2xl border-b border-white/[0.08] px-4 py-3 shadow-2xl"
      >
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-950 border border-white/15 flex items-center justify-center shadow-inner relative overflow-hidden group">
              <div className="absolute inset-0 bg-[#D4FF00]/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <Dumbbell className="w-4 h-4 text-[#D4FF00]" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-black tracking-wider text-white font-display">
                PPL
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#D4FF00] shadow-[0_0_8px_#D4FF00] animate-pulse" />
            </div>
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-2">
            {!isStandalone && (
              <button
                id="btn-header-install"
                onClick={() => setIsInstallModalOpen(true)}
                title="Installer l'application sur le téléphone"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-white/10 hover:border-white/20 transition-all shadow-xs active:scale-95"
              >
                <Smartphone className="w-3.5 h-3.5 text-[#D4FF00]" />
                <span className="hidden xs:inline sm:inline text-[11px] font-bold tracking-wider uppercase">App</span>
              </button>
            )}

            {/* Quick Rest Timer Trigger Button in Header */}
            <button
              id="btn-header-timer"
              onClick={() => {
                if (timerSecondsLeft > 0) {
                  setIsTimerModalOpen(true);
                } else {
                  handleStartTimer(settings.defaultRestDuration);
                }
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all active:scale-95 ${
                isTimerRunning
                  ? 'bg-[#D4FF00] text-black border-[#D4FF00] font-black shadow-[0_0_20px_rgba(212,255,0,0.35)] animate-pulse'
                  : 'bg-zinc-900/90 text-zinc-300 border-white/10 hover:border-white/20 hover:text-white'
              }`}
            >
              <Timer className={`w-3.5 h-3.5 ${isTimerRunning ? 'text-black fill-current' : 'text-[#D4FF00]'}`} />
              <span className="font-mono text-xs font-bold">
                {isTimerRunning ? formatTimerShort(timerSecondsLeft) : 'Chrono'}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-lg w-full mx-auto px-4 pt-3">
        {activeTab === 'training' && (
          <WorkoutTab
            key={`workout-tab-session-${resetCount}`}
            settings={settings}
            onOpenTimer={(preset) => handleStartTimer(preset || settings.defaultRestDuration)}
            onWorkoutCompleted={refreshData}
          />
        )}

        {activeTab === 'progression' && (
          <ProgressionTab
            history={history}
            exercises={exercises}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsTab
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            onResetAll={handleResetAllData}
            onOpenInstallModal={() => setIsInstallModalOpen(true)}
          />
        )}
      </main>

      {/* Persistent Bottom Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isTimerActive={isTimerRunning}
        timerSecondsLeft={timerSecondsLeft}
        onOpenTimer={() => setIsTimerModalOpen(true)}
      />

      {/* Rest Timer Modal with Full Controls & Presets */}
      <RestTimerModal
        isOpen={isTimerModalOpen}
        onClose={() => setIsTimerModalOpen(false)}
        secondsLeft={timerSecondsLeft}
        totalDuration={timerTotalDuration}
        isRunning={isTimerRunning}
        onStart={handleStartTimer}
        onPause={handlePauseTimer}
        onResume={handleResumeTimer}
        onReset={handleResetTimer}
        onAdjustTime={handleAdjustTimer}
      />

      {/* PWA Add to Home Screen Modal Guide & 1-Click Installer */}
      <AddToHomeScreenModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
        deferredPrompt={deferredPrompt}
        onInstallSuccess={() => {
          setIsStandalone(true);
        }}
      />
    </div>
  );
}
