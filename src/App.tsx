/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Dumbbell, Timer, Flame, Sparkles, Smartphone, Download } from 'lucide-react';
import { AppSettings, CompletedWorkout, ExerciseDefinition } from './types/fitness';
import { StorageService, DEFAULT_SETTINGS } from './services/storageService';
import { audioService } from './services/audioService';
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

  // Rest Timer State
  const [timerSecondsLeft, setTimerSecondsLeft] = useState<number>(0);
  const [timerTotalDuration, setTimerTotalDuration] = useState<number>(90);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [isTimerModalOpen, setIsTimerModalOpen] = useState<boolean>(false);
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

    // Capture PWA beforeinstallprompt event for Android / Chrome
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Timer Tick Interval
  useEffect(() => {
    if (isTimerRunning && timerSecondsLeft > 0) {
      timerIntervalRef.current = window.setInterval(() => {
        setTimerSecondsLeft((prev) => {
          if (prev <= 1) {
            // Timer Finished!
            setIsTimerRunning(false);
            if (settings.soundEnabled) audioService.playFinishChime();
            if (settings.vibrationEnabled) audioService.vibrate([300, 150, 300]);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isTimerRunning, timerSecondsLeft, settings.soundEnabled, settings.vibrationEnabled]);

  // Timer Control Handlers
  const handleStartTimer = (durationSeconds = 90) => {
    setTimerTotalDuration(durationSeconds);
    setTimerSecondsLeft(durationSeconds);
    setIsTimerRunning(true);
    setIsTimerModalOpen(true);
    if (settings.soundEnabled) audioService.playTick();
  };

  const handlePauseTimer = () => {
    setIsTimerRunning(false);
  };

  const handleResumeTimer = () => {
    if (timerSecondsLeft > 0) {
      setIsTimerRunning(true);
    } else {
      handleStartTimer(timerTotalDuration || 90);
    }
  };

  const handleResetTimer = () => {
    setIsTimerRunning(false);
    setTimerSecondsLeft(timerTotalDuration);
  };

  const handleAdjustTimer = (delta: number) => {
    setTimerSecondsLeft((prev) => Math.max(0, prev + delta));
    setTimerTotalDuration((prev) => Math.max(0, prev + delta));
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
  };

  const formatTimerShort = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[#F5F5F5] antialiased font-sans selection:bg-[#A3FF12] selection:text-black flex flex-col">
      {/* Bento Grid Header */}
      <header
        id="app-top-header"
        className="sticky top-0 z-30 bg-[#0A0A0A]/90 backdrop-blur-xl border-b border-[#262626] px-4 py-3"
      >
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#1A1A1A] border border-[#262626] flex items-center justify-center shadow-lg relative overflow-hidden group">
              <div className="absolute inset-0 bg-[#A3FF12]/10 rounded-2xl"></div>
              <Dumbbell className="w-5 h-5 text-[#A3FF12] relative z-10" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-base font-extrabold tracking-tight text-[#F5F5F5]">
                  PPL FITNESS
                </h1>
                <span className="text-[9px] font-mono font-black px-1.5 py-0.5 rounded-full bg-[#A3FF12]/15 text-[#A3FF12] border border-[#A3FF12]/30 uppercase tracking-wider">
                  Bento
                </span>
              </div>
              <p className="text-[10px] text-zinc-400 font-medium tracking-wide uppercase mt-0.5">
                Push • Pull • Legs • Pyramidal
              </p>
            </div>
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-2">
            {!isStandalone && (
              <button
                id="btn-header-install"
                onClick={() => setIsInstallModalOpen(true)}
                title="Ajouter à l'écran d'accueil"
                className="flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-bold bg-[#1A1A1A] hover:bg-[#242424] text-[#A3FF12] border border-[#262626] hover:border-[#A3FF12]/40 transition-all shadow-sm"
              >
                <Smartphone className="w-4 h-4 text-[#A3FF12]" />
                <span className="hidden xs:inline sm:inline text-[11px] font-bold">App</span>
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
              className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold border transition-all ${
                isTimerRunning
                  ? 'bg-[#A3FF12] text-black border-[#A3FF12] shadow-lg shadow-[#A3FF12]/20 animate-pulse'
                  : 'bg-[#1A1A1A] text-zinc-300 border-[#262626] hover:border-zinc-700 hover:text-white'
              }`}
            >
              <Timer className={`w-4 h-4 ${isTimerRunning ? 'text-black' : 'text-[#A3FF12]'}`} />
              <span className="font-mono">
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
