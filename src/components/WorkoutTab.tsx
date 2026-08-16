import React, { useState, useEffect } from 'react';
import { 
  Dumbbell, 
  ArrowRightLeft, 
  Check, 
  Timer, 
  Flame, 
  Award, 
  Sparkles, 
  Plus, 
  Minus, 
  RotateCcw,
  Activity,
  HeartPulse,
  TrendingUp,
  Clock,
  Play,
  Info,
  X,
  Layers,
  ChevronRight,
  ChevronLeft,
  Trash2,
  List,
  LayoutGrid,
  Zap,
  Target
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { 
  MuscleCategory, 
  ExerciseSessionState, 
  CardioSessionState, 
  ExerciseDefinition, 
  AppSettings,
  CompletedWorkout 
} from '../types/fitness';
import { StorageService } from '../services/storageService';
import { audioService } from '../services/audioService';
import { calculateTotalVolume, calculateCardioCalories } from '../utils/fitnessCalculations';
import { ReplaceExerciseModal } from './ReplaceExerciseModal';
import { AddExerciseModal } from './AddExerciseModal';

interface WorkoutTabProps {
  settings: AppSettings;
  onOpenTimer: (presetSeconds?: number) => void;
  onWorkoutCompleted: () => void;
}

export const WorkoutTab: React.FC<WorkoutTabProps> = ({
  settings,
  onOpenTimer,
  onWorkoutCompleted
}) => {
  const [currentCategory, setCurrentCategory] = useState<MuscleCategory>('PUSH');
  const [exercises, setExercises] = useState<ExerciseSessionState[]>([]);
  const [cardioState, setCardioState] = useState<CardioSessionState>({
    id: 'cardio_incline_walk',
    name: 'Marche inclinée (Incline Treadmill Walk)',
    durationMinutes: 25,
    distanceKm: 2.2,
    inclinePercentage: 10,
    speedKmh: 5.2,
    caloriesBurned: 210,
    completed: false,
    notes: 'Zone 2 cardio - Allure constante et posture droite'
  });

  // Page-by-page / Single-exercise step navigation
  const [activeExerciseIndex, setActiveExerciseIndex] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'page' | 'list'>('page');

  // Modals state
  const [replacingExercise, setReplacingExercise] = useState<ExerciseSessionState | null>(null);
  const [isReplaceModalOpen, setIsReplaceModalOpen] = useState(false);
  const [isAddExerciseModalOpen, setIsAddExerciseModalOpen] = useState(false);
  const [inspectingExercise, setInspectingExercise] = useState<ExerciseSessionState | null>(null);

  // Time tracking
  const [workoutStartTime, setWorkoutStartTime] = useState<number>(Date.now());
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [completedSummary, setCompletedSummary] = useState<CompletedWorkout | null>(null);

  // Initialize exercises for the selected category
  const loadCategory = (category: MuscleCategory) => {
    setCurrentCategory(category);
    setActiveExerciseIndex(0);
    if (category === 'CARDIO') return;

    const newExos = StorageService.createNewWorkoutState(category, settings.weightRoundingIncrement);
    setExercises(newExos);
  };

  useEffect(() => {
    // Check if there is an active workout saved
    const active = StorageService.getActiveWorkout();
    if (active && active.exercises.length > 0) {
      setCurrentCategory(active.category);
      setExercises(active.exercises);
      setWorkoutStartTime(active.startTime);
      if (active.cardio) setCardioState(active.cardio);
    } else {
      loadCategory('PUSH');
    }
  }, []);

  // Elapsed timer
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - workoutStartTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [workoutStartTime]);

  // Persist active workout state on change
  useEffect(() => {
    if (exercises.length > 0) {
      StorageService.saveActiveWorkout({
        category: currentCategory,
        startTime: workoutStartTime,
        exercises,
        cardio: cardioState
      });
    }
  }, [exercises, cardioState, currentCategory, workoutStartTime]);

  // Recompute calorie burn for cardio
  useEffect(() => {
    const estimated = calculateCardioCalories({
      weightKg: settings.athleteWeight || 75,
      durationMinutes: cardioState.durationMinutes,
      speedKmh: cardioState.speedKmh,
      inclinePercentage: cardioState.inclinePercentage
    });
    setCardioState(prev => ({ ...prev, caloriesBurned: Math.max(10, estimated) }));
  }, [cardioState.durationMinutes, cardioState.inclinePercentage, cardioState.speedKmh, settings.athleteWeight]);

  // Toggle set completed
  const handleToggleSet = (exoIndex: number, setIndex: number) => {
    const updated = [...exercises];
    const targetSet = updated[exoIndex].sets[setIndex];
    const willBeCompleted = !targetSet.completed;
    targetSet.completed = willBeCompleted;
    setExercises(updated);

    if (willBeCompleted) {
      if (settings.soundEnabled) audioService.playTick();
      if (settings.vibrationEnabled) audioService.vibrate(80);

      // Auto-trigger rest timer
      const restTime = setIndex === 2 ? 120 : settings.defaultRestDuration;
      onOpenTimer(restTime);
    }
  };

  // Direct Weight Input Handler
  const handleSetWeightDirect = (exoIndex: number, setIndex: number, rawVal: string) => {
    const parsed = parseFloat(rawVal);
    const updated = [...exercises];
    const s = updated[exoIndex].sets[setIndex];
    s.actualWeight = isNaN(parsed) ? 0 : parsed;

    if (setIndex === 2 && !isNaN(parsed) && parsed > 0) {
      updated[exoIndex].baseMaxWeight = parsed;
    }

    setExercises(updated);
  };

  // Direct Reps Input Handler
  const handleSetRepsDirect = (exoIndex: number, setIndex: number, rawVal: string) => {
    const parsed = parseInt(rawVal, 10);
    const updated = [...exercises];
    const s = updated[exoIndex].sets[setIndex];
    s.actualReps = isNaN(parsed) ? 0 : Math.max(0, parsed);
    setExercises(updated);
  };

  // Adjust weight with step buttons
  const handleAdjustSetWeight = (exoIndex: number, setIndex: number, delta: number) => {
    const updated = [...exercises];
    const s = updated[exoIndex].sets[setIndex];
    const newWeight = Math.max(0, Math.round((s.actualWeight + delta) * 2) / 2);
    s.actualWeight = newWeight;

    if (setIndex === 2) {
      updated[exoIndex].baseMaxWeight = newWeight;
    }

    setExercises(updated);
  };

  // Adjust reps with step buttons
  const handleAdjustSetReps = (exoIndex: number, setIndex: number, delta: number) => {
    const updated = [...exercises];
    const s = updated[exoIndex].sets[setIndex];
    s.actualReps = Math.max(1, s.actualReps + delta);
    setExercises(updated);
  };

  // Adjust base 100% max weight directly and recompute sets
  const handleAdjustBaseMaxWeight = (exoIndex: number, newMax: number) => {
    const updated = [...exercises];
    const exo = updated[exoIndex];
    exo.baseMaxWeight = Math.max(1, Math.round(newMax * 2) / 2);
    
    // Recompute pyramid
    const sets = StorageService.calculatePyramidSets(
      { currentMaxWeight: exo.baseMaxWeight },
      settings.weightRoundingIncrement
    );
    exo.sets = sets as [any, any, any];
    setExercises(updated);
  };

  // Add exercise to active session
  const handleAddExerciseToSession = (newExo: ExerciseSessionState) => {
    const updated = [...exercises, newExo];
    setExercises(updated);
    setActiveExerciseIndex(updated.length - 1);
    if (settings.soundEnabled) audioService.playTick();
  };

  // Remove exercise from active session
  const handleRemoveExercise = (exoIndex: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (exercises.length <= 1) return;
    const updated = exercises.filter((_, idx) => idx !== exoIndex);
    setExercises(updated);
    if (activeExerciseIndex >= updated.length) {
      setActiveExerciseIndex(Math.max(0, updated.length - 1));
    }
  };

  // Open replace modal
  const handleOpenReplace = (exo: ExerciseSessionState) => {
    setReplacingExercise(exo);
    setIsReplaceModalOpen(true);
  };

  // Apply replacement variant
  const handleSelectVariant = (variant: ExerciseDefinition) => {
    if (!replacingExercise) return;
    
    const updated = exercises.map(ex => {
      if (ex.exerciseId === replacingExercise.exerciseId) {
        const newSets = StorageService.calculatePyramidSets(
          variant,
          settings.weightRoundingIncrement
        );
        return {
          exerciseId: variant.id,
          exerciseName: variant.name,
          category: variant.category,
          subGroup: variant.subGroup,
          subGroupNameFr: variant.subGroupNameFr,
          targetMuscleFr: variant.targetMuscleFr,
          equipment: variant.equipment,
          instructionFr: variant.instructionFr,
          baseMaxWeight: variant.currentMaxWeight,
          sets: newSets as [any, any, any],
          replacedFromId: replacingExercise.exerciseId
        };
      }
      return ex;
    });

    setExercises(updated);
    setIsReplaceModalOpen(false);
    setReplacingExercise(null);
  };

  // Finish Workout
  const handleFinishWorkout = () => {
    const totalVolume = calculateTotalVolume(exercises);

    const completedRecord: CompletedWorkout = {
      id: `workout_${Date.now()}`,
      date: new Date().toISOString(),
      category: currentCategory,
      durationSeconds: elapsedSeconds,
      exercises,
      cardio: cardioState,
      totalVolumeKg: totalVolume
    };

    // Save to storage and calculate N+1
    StorageService.saveCompletedWorkout(completedRecord, settings.autoIncrementWeightOnSuccess);

    // Audio celebration
    if (settings.soundEnabled) audioService.playSuccess();

    // Trigger visual confetti
    try {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#D4FF00', '#FFFFFF', '#38BDF8', '#F59E0B']
      });
    } catch {
      // ignore
    }

    setCompletedSummary(completedRecord);
    setIsSummaryModalOpen(true);
    onWorkoutCompleted();
  };

  const handleStartFreshSession = (cat: MuscleCategory) => {
    setIsSummaryModalOpen(false);
    setCurrentCategory(cat);
    setActiveExerciseIndex(0);
    setWorkoutStartTime(Date.now());
    const freshExos = StorageService.createNewWorkoutState(cat, settings.weightRoundingIncrement);
    setExercises(freshExos);
    setCardioState({
      id: 'cardio_incline_walk',
      name: 'Marche inclinée (Incline Treadmill Walk)',
      durationMinutes: 25,
      distanceKm: 2.2,
      inclinePercentage: 10,
      speedKmh: 5.2,
      caloriesBurned: 210,
      completed: false,
      notes: 'Zone 2 cardio - Allure constante et posture droite',
      imageUrl: 'https://images.unsplash.com/photo-1538805060514-97d9cc17730c?w=700&auto=format&fit=crop&q=80'
    });
  };

  // Format elapsed time string
  const formatElapsed = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Calculate live workout volume
  const liveTotalVolume = calculateTotalVolume(exercises);

  const completedSetsCount = exercises.reduce((sum, exo) => {
    return sum + exo.sets.filter(s => s.completed).length;
  }, 0);
  const totalSetsCount = exercises.length * 3;
  const progressPercent = totalSetsCount > 0 ? Math.round((completedSetsCount / totalSetsCount) * 100) : 0;

  const currentExercise = exercises[activeExerciseIndex] || exercises[0];

  const categorySubtitles: Record<MuscleCategory, string> = {
    PUSH: 'Pectoraux • Épaules • Triceps',
    PULL: 'Grand Dorsal • Arrière Épaules • Biceps',
    LEGS: 'Quadriceps • Ischios • Mollets',
    CARDIO: 'Zone 2 • Marche Inclinée'
  };

  return (
    <div id="workout-tab-container" className="pb-28 pt-2 space-y-4">
      {/* Top Session Header */}
      <div className="px-1 pt-1">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#D4FF00] animate-pulse" />
          <span className="text-zinc-400 text-[10px] font-black tracking-widest uppercase font-mono">
            Séance en cours
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white font-display mt-0.5">
          {currentCategory}
        </h1>
        <p className="text-xs text-zinc-400 font-medium mt-0.5">
          {categorySubtitles[currentCategory]}
        </p>
      </div>

      {/* Modern High-End PPL Category Switcher */}
      <div className="grid grid-cols-3 gap-2 p-1.5 bg-[#121217] rounded-2xl border border-white/[0.08] shadow-inner">
        {(['PUSH', 'PULL', 'LEGS'] as MuscleCategory[]).map((cat) => {
          const isActive = currentCategory === cat;
          return (
            <button
              key={cat}
              id={`btn-category-${cat}`}
              onClick={() => loadCategory(cat)}
              className={`py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-200 flex flex-col items-center justify-center relative overflow-hidden ${
                isActive
                  ? 'bg-[#D4FF00] text-black shadow-[0_0_20px_rgba(212,255,0,0.3)] font-black scale-[1.02]'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
              }`}
            >
              <span>{cat}</span>
            </button>
          );
        })}
      </div>

      {/* Modern Bento HUD: Live Progression, Volume & Rest Shortcut */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {/* Metric 1: Series Progress */}
        <div className="bg-[#121217] border border-white/[0.08] p-3.5 rounded-2xl flex flex-col justify-between relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Séries Validées</span>
            <Target className="w-3.5 h-3.5 text-[#D4FF00]" />
          </div>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="text-2xl font-black font-mono text-white">{completedSetsCount}</span>
            <span className="text-xs text-zinc-500 font-mono font-bold">/ {totalSetsCount}</span>
            <span className="ml-auto text-[11px] font-mono font-bold text-[#D4FF00]">{progressPercent}%</span>
          </div>
          {/* Visual Mini Progress Bar */}
          <div className="w-full h-1 bg-zinc-800 rounded-full mt-2 overflow-hidden">
            <div 
              className="h-full bg-[#D4FF00] rounded-full transition-all duration-500" 
              style={{ width: `${progressPercent}%` }} 
            />
          </div>
        </div>

        {/* Metric 2: Live Tonnage */}
        <div className="bg-[#121217] border border-white/[0.08] p-3.5 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Tonnage Total</span>
            <Zap className="w-3.5 h-3.5 text-[#38BDF8]" />
          </div>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="text-2xl font-black font-mono text-white">{liveTotalVolume.toLocaleString()}</span>
            <span className="text-xs text-zinc-500 font-bold">kg</span>
          </div>
          <span className="text-[10px] text-zinc-500 font-medium mt-1">Volume de charge effectif</span>
        </div>

        {/* Metric 3: Quick Rest Timer Button */}
        <div className="bg-[#121217] border border-white/[0.08] p-3.5 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Repos Cible</span>
            <Timer className="w-3.5 h-3.5 text-[#F59E0B]" />
          </div>
          <button
            onClick={() => onOpenTimer(settings.defaultRestDuration)}
            className="mt-2 flex items-center justify-between py-1.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs transition-colors border border-white/10"
          >
            <span className="flex items-center gap-1.5">
              <Play className="w-3 h-3 fill-current text-[#D4FF00]" />
              <span>{settings.defaultRestDuration}s</span>
            </span>
            <span className="text-[10px] text-zinc-400 font-mono font-normal">Lancer</span>
          </button>
        </div>

        {/* Metric 4: Cardio Finisher Quick Check */}
        <div className="bg-[#121217] border border-white/[0.08] p-3.5 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Finisher Cardio</span>
            <Flame className="w-3.5 h-3.5 text-[#EC4899]" />
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs font-bold text-zinc-300">Marche Inclinée</span>
            <button
              onClick={() => setCardioState(c => ({ ...c, completed: !c.completed }))}
              className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all ${
                cardioState.completed
                  ? 'bg-[#D4FF00] text-black shadow-[0_0_12px_rgba(212,255,0,0.5)]'
                  : 'bg-zinc-800/80 border border-white/10 hover:border-white/30 text-transparent'
              }`}
            >
              <Check className="w-4 h-4 stroke-[3]" />
            </button>
          </div>
        </div>
      </div>

      {/* View Switcher & Action Toolbar */}
      <div className="flex items-center justify-between gap-2 px-1 pt-1">
        <div className="flex items-center gap-1 bg-[#121217] p-1 rounded-2xl border border-white/[0.08]">
          <button
            onClick={() => setViewMode('page')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              viewMode === 'page'
                ? 'bg-zinc-800 text-white font-black border border-white/10 shadow-xs'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5 text-[#D4FF00]" />
            <span>Mode Focus</span>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              viewMode === 'list'
                ? 'bg-zinc-800 text-white font-black border border-white/10 shadow-xs'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <List className="w-3.5 h-3.5 text-[#D4FF00]" />
            <span>Vue Complète</span>
          </button>
        </div>

        {/* Add Exercise Button */}
        <button
          id="btn-open-add-exercise"
          onClick={() => setIsAddExerciseModalOpen(true)}
          className="px-3.5 py-2 bg-[#D4FF00] hover:bg-[#b8e600] text-black font-black text-xs rounded-2xl flex items-center gap-1.5 shadow-[0_0_15px_rgba(212,255,0,0.25)] transition-all active:scale-95"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Ajouter un exo</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* MODE 1: PAGE PAR PAGE (STEP-BY-STEP SINGLE EXERCISE FOCUS)                */}
      {/* ========================================================================= */}
      {viewMode === 'page' && (
        <div className="space-y-3 animate-fadeIn">
          {/* Step / Pagination Pill Indicators */}
          <div className="flex items-center justify-between bg-[#121217] p-2 rounded-2xl border border-white/[0.08]">
            <button
              disabled={activeExerciseIndex === 0}
              onClick={() => setActiveExerciseIndex(prev => Math.max(0, prev - 1))}
              className="p-1.5 text-zinc-400 hover:text-white disabled:opacity-20 disabled:hover:text-zinc-600 transition-colors"
              title="Étape précédente"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {/* Quick jump pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto max-w-[220px] sm:max-w-xs py-1 no-scrollbar">
              {exercises.map((ex, idx) => {
                const isExoDone = ex.sets.every(s => s.completed);
                const isActive = activeExerciseIndex === idx;

                return (
                  <button
                    key={ex.exerciseId}
                    onClick={() => setActiveExerciseIndex(idx)}
                    className={`w-7 h-7 rounded-xl text-xs font-bold font-mono transition-all flex items-center justify-center ${
                      isActive
                        ? 'bg-[#D4FF00] text-black font-black shadow-[0_0_10px_rgba(212,255,0,0.4)] scale-110'
                        : isExoDone
                        ? 'bg-zinc-800 text-[#D4FF00] border border-[#D4FF00]/40 font-bold'
                        : 'bg-zinc-900 text-zinc-500 hover:text-white hover:bg-zinc-800'
                    }`}
                    title={`Exercice ${idx + 1} : ${ex.exerciseName}`}
                  >
                    {isExoDone ? '✓' : idx + 1}
                  </button>
                );
              })}

              {/* Finisher Cardio Pill (Final Step) */}
              <button
                onClick={() => setActiveExerciseIndex(exercises.length)}
                className={`px-2 h-7 rounded-xl text-xs font-bold font-mono transition-all flex items-center justify-center gap-1 ${
                  activeExerciseIndex === exercises.length
                    ? 'bg-[#D4FF00] text-black font-black shadow-[0_0_10px_rgba(212,255,0,0.4)] scale-105'
                    : cardioState.completed
                    ? 'bg-zinc-800 text-[#D4FF00] border border-[#D4FF00]/40 font-bold'
                    : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800'
                }`}
                title="Dernière étape : Finisher Cardio"
              >
                <Flame className="w-3.5 h-3.5" />
                <span>{cardioState.completed ? '✓' : 'Cardio'}</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-zinc-400">
                {activeExerciseIndex < exercises.length
                  ? `${activeExerciseIndex + 1} / ${exercises.length + 1}`
                  : `Finisher (${exercises.length + 1} / ${exercises.length + 1})`}
              </span>
              <button
                disabled={activeExerciseIndex === exercises.length}
                onClick={() => setActiveExerciseIndex(prev => Math.min(exercises.length, prev + 1))}
                className="p-1.5 text-zinc-400 hover:text-white disabled:opacity-20 disabled:hover:text-zinc-600 transition-colors"
                title="Étape suivante"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {activeExerciseIndex < exercises.length && currentExercise ? (
            /* MAIN ATHLETIC CARD FOR ACTIVE EXERCISE */
            <div 
              id={`active-exercise-card-${currentExercise.exerciseId}`}
              className="bg-gradient-to-b from-[#16161E] to-[#101015] text-white border border-white/[0.1] rounded-3xl p-5 sm:p-7 shadow-2xl relative overflow-hidden"
            >
            {/* Ambient subtle glow overlay */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4FF00]/[0.03] rounded-full blur-3xl pointer-events-none" />

            {/* Header: Number, Title, Muscle, Replace and Info */}
            <div className="flex items-start justify-between gap-3 border-b border-white/[0.08] pb-4 relative z-10">
              <div className="flex items-center gap-3.5 min-w-0">
                <div 
                  onClick={() => setInspectingExercise(currentExercise)}
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-zinc-900 border border-white/15 shrink-0 flex items-center justify-center cursor-pointer hover:border-[#D4FF00]/50 transition-all relative group"
                  title="Voir la fiche technique"
                >
                  <Dumbbell className="w-7 h-7 text-[#D4FF00]" />
                  <div className="absolute -bottom-1 -right-1 bg-black text-[#D4FF00] p-1 rounded-full text-[10px] border border-white/10 shadow-xs">
                    <Info className="w-3 h-3" />
                  </div>
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-black uppercase px-2 py-0.5 bg-[#D4FF00] text-black rounded-md">
                      Exo #{activeExerciseIndex + 1}
                    </span>
                    <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                      {currentExercise.category}
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-white font-display tracking-tight mt-1 truncate">
                    {currentExercise.exerciseName}
                  </h2>
                  <p className="text-xs sm:text-sm font-medium text-zinc-400 truncate mt-0.5">
                    {currentExercise.subGroupNameFr} • <span className="text-zinc-500">{currentExercise.equipment}</span>
                  </p>
                </div>
              </div>

              {/* Action buttons on card header */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => handleOpenReplace(currentExercise)}
                  className="p-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-white/10 rounded-xl text-xs font-bold transition-all flex items-center gap-1 active:scale-95"
                  title="Remplacer par une variante"
                >
                  <ArrowRightLeft className="w-4 h-4 text-[#D4FF00]" />
                  <span className="hidden sm:inline">Remplacer</span>
                </button>

                {exercises.length > 1 && (
                  <button
                    onClick={(e) => handleRemoveExercise(activeExerciseIndex, e)}
                    className="p-2 bg-zinc-900 hover:bg-red-950/40 text-zinc-400 hover:text-red-400 border border-white/10 rounded-xl transition-all"
                    title="Supprimer de la séance"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Base Max Weight Banner with Reference Adjuster */}
            <div className="flex items-center justify-between bg-zinc-900/90 border border-white/[0.08] rounded-2xl px-4 py-3 my-4 relative z-10">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-[#D4FF00]" />
                <span className="text-xs font-bold text-zinc-300">Charge 100% de référence (Série 3) :</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleAdjustBaseMaxWeight(activeExerciseIndex, currentExercise.baseMaxWeight - 2.5)}
                  className="w-7 h-7 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-white/10 flex items-center justify-center font-bold text-xs active:scale-95"
                >
                  -
                </button>
                <span className="font-mono text-base font-black text-white">
                  {currentExercise.baseMaxWeight} <span className="text-xs font-normal text-zinc-400">kg</span>
                </span>
                <button
                  onClick={() => handleAdjustBaseMaxWeight(activeExerciseIndex, currentExercise.baseMaxWeight + 2.5)}
                  className="w-7 h-7 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-white/10 flex items-center justify-center font-bold text-xs active:scale-95"
                >
                  +
                </button>
              </div>
            </div>

            {/* 3 PYRAMIDAL SETS CARDS WITH DIRECT NUMERIC INPUT & TACTILE STEPPERS */}
            <div className="space-y-3.5 my-4 relative z-10">
              {currentExercise.sets.map((setRecord, sIdx) => {
                const setLabels = [
                  { tag: 'Série 1 (60%)', badge: 'Échauffement', target: '12 reps cibles', color: 'border-sky-500/30 text-sky-400 bg-sky-500/10' },
                  { tag: 'Série 2 (80%)', badge: 'Préparation', target: '10 reps cibles', color: 'border-amber-500/30 text-amber-400 bg-amber-500/10' },
                  { tag: 'Série 3 (100%)', badge: 'Surcharge Max 🔥', target: 'Max reps (Échec)', color: 'border-[#D4FF00]/40 text-[#D4FF00] bg-[#D4FF00]/10' }
                ];
                const info = setLabels[sIdx];
                const isCompleted = setRecord.completed;

                return (
                  <div
                    key={setRecord.setNumber}
                    className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isCompleted
                        ? 'bg-[#182612] border-[#D4FF00] ring-1 ring-[#D4FF00]/50 shadow-[0_0_15px_rgba(212,255,0,0.15)]'
                        : sIdx === 2
                        ? 'bg-zinc-900/90 border-[#D4FF00]/30 shadow-md'
                        : 'bg-zinc-900/60 border-white/[0.08]'
                    }`}
                  >
                    {/* Left: Set info */}
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-xl font-mono font-black text-xs flex items-center justify-center shrink-0 ${
                        isCompleted
                          ? 'bg-[#D4FF00] text-black shadow-xs'
                          : sIdx === 2
                          ? 'bg-zinc-800 text-[#D4FF00] border border-[#D4FF00]/30'
                          : 'bg-zinc-800 text-zinc-400'
                      }`}>
                        S{sIdx + 1}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-white">
                            {info.tag}
                          </span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${info.color}`}>
                            {info.badge}
                          </span>
                        </div>
                        <div className="text-[11px] text-zinc-400 font-medium mt-0.5">
                          {info.target}
                        </div>
                      </div>
                    </div>

                    {/* Middle: Direct inputs for Weight (kg) & Reps */}
                    <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
                      {/* Weight Input Box */}
                      <div className="flex flex-col items-center">
                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                          Poids (kg)
                        </label>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleAdjustSetWeight(activeExerciseIndex, sIdx, -settings.weightRoundingIncrement)}
                            className="w-7 h-9 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-white/10 flex items-center justify-center text-xs active:scale-95"
                          >
                            <Minus className="w-3 h-3" />
                          </button>

                          <input
                            type="number"
                            step="0.5"
                            inputMode="decimal"
                            value={setRecord.actualWeight === 0 ? '' : setRecord.actualWeight}
                            onChange={(e) => handleSetWeightDirect(activeExerciseIndex, sIdx, e.target.value)}
                            placeholder="0"
                            className="w-20 sm:w-24 text-center font-mono font-black text-lg sm:text-xl bg-zinc-950 border border-white/20 rounded-xl py-1 text-white focus:border-[#D4FF00] focus:ring-1 focus:ring-[#D4FF00] focus:outline-none shadow-inner"
                          />

                          <button
                            type="button"
                            onClick={() => handleAdjustSetWeight(activeExerciseIndex, sIdx, settings.weightRoundingIncrement)}
                            className="w-7 h-9 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-white/10 flex items-center justify-center text-xs active:scale-95"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Reps Input Box */}
                      <div className="flex flex-col items-center">
                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                          Répétitions
                        </label>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleAdjustSetReps(activeExerciseIndex, sIdx, -1)}
                            className="w-7 h-9 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-white/10 flex items-center justify-center text-xs active:scale-95"
                          >
                            <Minus className="w-3 h-3" />
                          </button>

                          <input
                            type="number"
                            step="1"
                            min="0"
                            inputMode="numeric"
                            value={setRecord.actualReps === 0 ? '' : setRecord.actualReps}
                            onChange={(e) => handleSetRepsDirect(activeExerciseIndex, sIdx, e.target.value)}
                            placeholder="0"
                            className="w-16 sm:w-20 text-center font-mono font-black text-lg sm:text-xl bg-zinc-950 border border-white/20 rounded-xl py-1 text-white focus:border-[#D4FF00] focus:ring-1 focus:ring-[#D4FF00] focus:outline-none shadow-inner"
                          />

                          <button
                            type="button"
                            onClick={() => handleAdjustSetReps(activeExerciseIndex, sIdx, 1)}
                            className="w-7 h-9 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-white/10 flex items-center justify-center text-xs active:scale-95"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Big Validate Button */}
                      <div className="flex flex-col items-center">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                          Valider
                        </span>
                        <button
                          type="button"
                          onClick={() => handleToggleSet(activeExerciseIndex, sIdx)}
                          className={`w-12 h-10 rounded-xl flex items-center justify-center transition-all active:scale-90 ${
                            isCompleted
                              ? 'bg-[#D4FF00] text-black shadow-[0_0_15px_rgba(212,255,0,0.5)]'
                              : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white border border-white/10'
                          }`}
                        >
                          <Check className="w-5 h-5 stroke-[3]" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Step Navigation Footer Controls */}
            <div className="flex items-center gap-3 pt-3 border-t border-white/[0.08] relative z-10">
              <button
                disabled={activeExerciseIndex === 0}
                onClick={() => setActiveExerciseIndex(prev => Math.max(0, prev - 1))}
                className="py-3 px-4 rounded-2xl bg-zinc-900 hover:bg-zinc-800 disabled:opacity-30 text-zinc-300 font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 border border-white/10"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Précédent</span>
              </button>

              {activeExerciseIndex < exercises.length - 1 ? (
                <button
                  onClick={() => setActiveExerciseIndex(prev => prev + 1)}
                  className="flex-1 py-3.5 rounded-2xl bg-[#D4FF00] hover:bg-[#b8e600] text-black font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(212,255,0,0.25)] active:scale-95"
                >
                  <span>Exercice Suivant (#{activeExerciseIndex + 2})</span>
                  <ChevronRight className="w-4 h-4 stroke-[3]" />
                </button>
              ) : (
                <button
                  onClick={() => setActiveExerciseIndex(exercises.length)}
                  className="flex-1 py-3.5 rounded-2xl bg-[#D4FF00] hover:bg-[#b8e600] text-black font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(212,255,0,0.25)] active:scale-95"
                >
                  <Flame className="w-4 h-4 text-black" />
                  <span>Passer au Finisher Cardio (Dernière étape) ➔</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          /* FINISHER CARDIO AS THE FINAL PAGE IN FOCUS MODE */
          <div 
            id="integrated-cardio-finisher" 
            className="bg-gradient-to-b from-[#16161E] to-[#101015] text-white border border-[#D4FF00]/40 rounded-3xl p-5 sm:p-7 shadow-2xl relative overflow-hidden animate-fadeIn"
          >
            {/* Ambient subtle glow overlay */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4FF00]/[0.04] rounded-full blur-3xl pointer-events-none" />

            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.08] relative z-10">
              <div className="flex items-center gap-3.5">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-zinc-900 border border-white/15 shrink-0 flex items-center justify-center relative">
                  <Flame className="w-7 h-7 text-[#D4FF00]" />
                  <div className="absolute -bottom-1 -right-1 bg-black text-[#D4FF00] p-1 rounded-full text-[10px] border border-white/10 shadow-xs">
                    <HeartPulse className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-black uppercase px-2 py-0.5 bg-[#D4FF00] text-black rounded-md">
                      Étape #{exercises.length + 1} (Finisher)
                    </span>
                    <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Cardio Zone 2</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-white font-display tracking-tight mt-0.5">
                    Finisher : Marche Inclinée
                  </h2>
                  <p className="text-xs text-zinc-400">Post-séance {currentCategory} • Maintien musculaire & brûlage lipidique</p>
                </div>
              </div>

              <span className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${
                cardioState.completed
                  ? 'bg-[#D4FF00] text-black border-[#D4FF00] font-black shadow-[0_0_10px_rgba(212,255,0,0.3)]'
                  : 'bg-zinc-800 text-zinc-300 border-white/10'
              }`}>
                {cardioState.completed ? 'Validé ✓' : 'Finisher'}
              </span>
            </div>

            {/* Bento Grid Metrics for Cardio Finisher */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-5 relative z-10">
              <div className="p-3.5 bg-zinc-900/90 rounded-2xl border border-white/[0.08] flex flex-col justify-between">
                <div className="text-[10px] text-zinc-400 uppercase font-bold">Inclinaison (%)</div>
                <div className="flex items-center justify-between mt-2">
                  <button 
                    onClick={() => setCardioState(c => ({ ...c, inclinePercentage: Math.max(0, c.inclinePercentage - 1) }))}
                    className="w-7 h-7 flex items-center justify-center text-zinc-300 hover:text-white bg-zinc-800 border border-white/10 rounded-lg text-xs"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-lg font-bold font-mono text-white">{cardioState.inclinePercentage}%</span>
                  <button 
                    onClick={() => setCardioState(c => ({ ...c, inclinePercentage: Math.min(20, c.inclinePercentage + 1) }))}
                    className="w-7 h-7 flex items-center justify-center text-zinc-300 hover:text-white bg-zinc-800 border border-white/10 rounded-lg text-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="p-3.5 bg-zinc-900/90 rounded-2xl border border-white/[0.08] flex flex-col justify-between">
                <div className="text-[10px] text-zinc-400 uppercase font-bold">Vitesse (km/h)</div>
                <div className="flex items-center justify-between mt-2">
                  <button 
                    onClick={() => setCardioState(c => ({ ...c, speedKmh: Math.max(1, Math.round((c.speedKmh - 0.2) * 10) / 10) }))}
                    className="w-7 h-7 flex items-center justify-center text-zinc-300 hover:text-white bg-zinc-800 border border-white/10 rounded-lg text-xs"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-lg font-bold font-mono text-white">{cardioState.speedKmh}</span>
                  <button 
                    onClick={() => setCardioState(c => ({ ...c, speedKmh: Math.min(10, Math.round((c.speedKmh + 0.2) * 10) / 10) }))}
                    className="w-7 h-7 flex items-center justify-center text-zinc-300 hover:text-white bg-zinc-800 border border-white/10 rounded-lg text-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="p-3.5 bg-zinc-900/90 rounded-2xl border border-white/[0.08] flex flex-col justify-between">
                <div className="text-[10px] text-zinc-400 uppercase font-bold">Durée (min)</div>
                <div className="flex items-center justify-between mt-2">
                  <button 
                    onClick={() => setCardioState(c => ({ ...c, durationMinutes: Math.max(5, c.durationMinutes - 5) }))}
                    className="w-7 h-7 flex items-center justify-center text-zinc-300 hover:text-white bg-zinc-800 border border-white/10 rounded-lg text-xs"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-lg font-bold font-mono text-white">{cardioState.durationMinutes}</span>
                  <button 
                    onClick={() => setCardioState(c => ({ ...c, durationMinutes: Math.min(90, c.durationMinutes + 5) }))}
                    className="w-7 h-7 flex items-center justify-center text-zinc-300 hover:text-white bg-zinc-800 border border-white/10 rounded-lg text-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="p-3.5 bg-zinc-900/90 rounded-2xl border border-white/[0.08] flex flex-col justify-between">
                <div className="text-[10px] text-zinc-400 uppercase font-bold">Calories Estimées</div>
                <div className="mt-2 text-center">
                  <span className="text-lg font-bold font-mono text-[#D4FF00]">~{cardioState.caloriesBurned}</span>
                  <span className="text-xs text-zinc-400 ml-1">kcal</span>
                </div>
              </div>
            </div>

            {/* Validation Button for Cardio */}
            <button
              onClick={() => {
                const next = !cardioState.completed;
                setCardioState(c => ({ ...c, completed: next }));
                if (next && settings.soundEnabled) audioService.playTick();
              }}
              className={`w-full py-3.5 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all border flex items-center justify-center gap-2 active:scale-95 relative z-10 ${
                cardioState.completed
                  ? 'bg-[#D4FF00] text-black border-[#D4FF00] shadow-[0_0_15px_rgba(212,255,0,0.3)] font-black'
                  : 'bg-zinc-800 text-zinc-300 border-white/10 hover:bg-zinc-700 hover:text-white'
              }`}
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>{cardioState.completed ? 'Finisher Validé (25 min @ 10%)' : 'Valider le Finisher Cardio'}</span>
            </button>

            {/* Focus Page Navigation Buttons on Final Step */}
            <div className="flex items-center gap-2 pt-5 border-t border-white/[0.08] mt-6 relative z-10">
              <button
                onClick={() => setActiveExerciseIndex(exercises.length - 1)}
                className="px-4 py-3.5 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-white/10 font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 active:scale-95"
              >
                <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
                <span>Exercice #{exercises.length}</span>
              </button>

              <button
                onClick={handleFinishWorkout}
                className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-[#D4FF00] to-[#b8e600] text-black font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(212,255,0,0.35)] active:scale-95"
              >
                <Award className="w-4 h-4 text-black stroke-[2.5]" />
                <span>Valider la Séance (N ➔ N+1)</span>
              </button>
            </div>
          </div>
        )}
      </div>
    )}

      {/* ========================================================================= */}
      {/* MODE 2: VUE LISTE COMPLÈTE (TOUS LES EXOS DANS LE THÈME ATHLÉTIQUE)        */}
      {/* ========================================================================= */}
      {viewMode === 'list' && (
        <div id="ppl-exercises-list" className="space-y-4 animate-fadeIn">
          {exercises.map((exo, exoIdx) => {
            const isAllCompleted = exo.sets.every(s => s.completed);

            return (
              <div
                key={exo.exerciseId}
                id={`exercise-card-${exo.exerciseId}`}
                className={`bg-[#121217] text-white border rounded-3xl p-5 sm:p-6 shadow-xl transition-all flex flex-col gap-4 ${
                  isAllCompleted ? 'border-[#D4FF00]/60 ring-1 ring-[#D4FF00]/40' : 'border-white/[0.08]'
                }`}
              >
                {/* Exercise Header */}
                <div className="flex items-start justify-between gap-3 border-b border-white/[0.08] pb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      onClick={() => setInspectingExercise(exo)}
                      className="w-12 h-12 rounded-2xl bg-zinc-900 border border-white/10 shrink-0 flex items-center justify-center cursor-pointer hover:border-[#D4FF00]/50 transition-all"
                      title="Voir la fiche technique"
                    >
                      <Dumbbell className="w-6 h-6 text-[#D4FF00]" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-black bg-[#D4FF00] text-black px-2 py-0.5 rounded-md">
                          #{exoIdx + 1}
                        </span>
                        <h2 className="text-base sm:text-lg font-black text-white font-display tracking-tight truncate">
                          {exo.exerciseName}
                        </h2>
                      </div>
                      <p className="text-xs text-zinc-400 truncate mt-0.5">
                        {exo.subGroupNameFr} • <span className="text-zinc-500">{exo.equipment}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenReplace(exo)}
                      className="bg-zinc-900 hover:bg-zinc-800 text-[10px] px-2.5 py-1.5 rounded-xl font-bold uppercase tracking-wider text-zinc-300 border border-white/10 transition-all flex items-center gap-1"
                    >
                      <ArrowRightLeft className="w-3 h-3 text-[#D4FF00]" />
                      <span className="hidden sm:inline">Remplacer</span>
                    </button>
                    {exercises.length > 1 && (
                      <button
                        onClick={(e) => handleRemoveExercise(exoIdx, e)}
                        className="p-1.5 bg-zinc-900 hover:bg-red-950/40 text-zinc-400 hover:text-red-400 border border-white/10 rounded-xl"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* 3 Sets Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {exo.sets.map((setRecord, sIdx) => {
                    const setLabels = [
                      { tag: 'S1 (60%)', repTarget: '12 reps' },
                      { tag: 'S2 (80%)', repTarget: '10 reps' },
                      { tag: 'S3 (100%)', repTarget: 'Max reps' }
                    ];
                    const info = setLabels[sIdx];
                    const isCompleted = setRecord.completed;

                    return (
                      <div
                        key={setRecord.setNumber}
                        className={`rounded-2xl p-3 border flex flex-col justify-between transition-all ${
                          isCompleted
                            ? 'bg-[#182612] border-[#D4FF00] ring-1 ring-[#D4FF00]/30'
                            : 'bg-zinc-900/70 border-white/[0.08]'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] uppercase font-black tracking-wider text-zinc-300">
                            {info.tag}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleToggleSet(exoIdx, sIdx)}
                            className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
                              isCompleted
                                ? 'bg-[#D4FF00] text-black shadow-xs'
                                : 'border border-white/20 hover:border-[#D4FF00] text-transparent'
                            }`}
                          >
                            <Check className="w-4 h-4 stroke-[3]" />
                          </button>
                        </div>

                        {/* Direct input for weight & reps */}
                        <div className="grid grid-cols-2 gap-2 my-1">
                          <div>
                            <span className="text-[9px] text-zinc-400 font-bold uppercase">Poids (kg)</span>
                            <input
                              type="number"
                              step="0.5"
                              inputMode="decimal"
                              value={setRecord.actualWeight === 0 ? '' : setRecord.actualWeight}
                              onChange={(e) => handleSetWeightDirect(exoIdx, sIdx, e.target.value)}
                              className="w-full text-center font-mono font-black text-sm bg-zinc-950 border border-white/20 rounded-lg py-1 text-white focus:border-[#D4FF00] focus:outline-none"
                            />
                          </div>

                          <div>
                            <span className="text-[9px] text-zinc-400 font-bold uppercase">Reps</span>
                            <input
                              type="number"
                              step="1"
                              inputMode="numeric"
                              value={setRecord.actualReps === 0 ? '' : setRecord.actualReps}
                              onChange={(e) => handleSetRepsDirect(exoIdx, sIdx, e.target.value)}
                              className="w-full text-center font-mono font-black text-sm bg-zinc-950 border border-white/20 rounded-lg py-1 text-white focus:border-[#D4FF00] focus:outline-none"
                            />
                          </div>
                        </div>

                        <div className="text-[9px] text-zinc-500 font-medium text-center mt-1">
                          Cible : {info.repTarget}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* FINISHER CARDIO SECTION (IN LIST MODE AT THE BOTTOM)                      */}
      {/* ========================================================================= */}
      {viewMode === 'list' && (
        <>
          <div id="integrated-cardio-finisher-list" className="bg-[#121217] border border-white/[0.08] rounded-3xl p-5 shadow-xl transition-all">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-zinc-900 border border-white/10 shrink-0 flex items-center justify-center relative">
                  <Flame className="w-6 h-6 text-[#D4FF00]" />
                  <div className="absolute -bottom-1 -right-1 bg-black text-[#D4FF00] p-1 rounded-full text-[10px] border border-white/10 shadow-xs">
                    <HeartPulse className="w-3 h-3" />
                  </div>
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-white font-display">Finisher Cardio : Marche Inclinée</h3>
                  <p className="text-[11px] text-zinc-400">Post-séance {currentCategory} • Zone 2 Brûlage des graisses</p>
                </div>
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                cardioState.completed
                  ? 'bg-[#D4FF00] text-black border-[#D4FF00] font-black'
                  : 'bg-zinc-800 text-zinc-300 border-white/10'
              }`}>
                {cardioState.completed ? 'Validé ✓' : 'Finisher Optionnel'}
              </span>
            </div>

            {/* Bento Grid Metrics for Cardio Finisher */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 my-4">
              <div className="p-3 bg-zinc-900/80 rounded-2xl border border-white/[0.08] flex flex-col justify-between">
                <div className="text-[10px] text-zinc-400 uppercase font-bold">Inclinaison (%)</div>
                <div className="flex items-center justify-between mt-2">
                  <button 
                    onClick={() => setCardioState(c => ({ ...c, inclinePercentage: Math.max(0, c.inclinePercentage - 1) }))}
                    className="w-7 h-7 flex items-center justify-center text-zinc-300 hover:text-white bg-zinc-800 border border-white/10 rounded-lg text-xs"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-lg font-bold font-mono text-white">{cardioState.inclinePercentage}%</span>
                  <button 
                    onClick={() => setCardioState(c => ({ ...c, inclinePercentage: Math.min(20, c.inclinePercentage + 1) }))}
                    className="w-7 h-7 flex items-center justify-center text-zinc-300 hover:text-white bg-zinc-800 border border-white/10 rounded-lg text-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="p-3 bg-zinc-900/80 rounded-2xl border border-white/[0.08] flex flex-col justify-between">
                <div className="text-[10px] text-zinc-400 uppercase font-bold">Vitesse (km/h)</div>
                <div className="flex items-center justify-between mt-2">
                  <button 
                    onClick={() => setCardioState(c => ({ ...c, speedKmh: Math.max(1, Math.round((c.speedKmh - 0.2) * 10) / 10) }))}
                    className="w-7 h-7 flex items-center justify-center text-zinc-300 hover:text-white bg-zinc-800 border border-white/10 rounded-lg text-xs"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-lg font-bold font-mono text-white">{cardioState.speedKmh}</span>
                  <button 
                    onClick={() => setCardioState(c => ({ ...c, speedKmh: Math.min(10, Math.round((c.speedKmh + 0.2) * 10) / 10) }))}
                    className="w-7 h-7 flex items-center justify-center text-zinc-300 hover:text-white bg-zinc-800 border border-white/10 rounded-lg text-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="p-3 bg-zinc-900/80 rounded-2xl border border-white/[0.08] flex flex-col justify-between">
                <div className="text-[10px] text-zinc-400 uppercase font-bold">Durée (min)</div>
                <div className="flex items-center justify-between mt-2">
                  <button 
                    onClick={() => setCardioState(c => ({ ...c, durationMinutes: Math.max(5, c.durationMinutes - 5) }))}
                    className="w-7 h-7 flex items-center justify-center text-zinc-300 hover:text-white bg-zinc-800 border border-white/10 rounded-lg text-xs"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-lg font-bold font-mono text-white">{cardioState.durationMinutes}</span>
                  <button 
                    onClick={() => setCardioState(c => ({ ...c, durationMinutes: Math.min(90, c.durationMinutes + 5) }))}
                    className="w-7 h-7 flex items-center justify-center text-zinc-300 hover:text-white bg-zinc-800 border border-white/10 rounded-lg text-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="p-3 bg-zinc-900/80 rounded-2xl border border-white/[0.08] flex flex-col justify-between">
                <div className="text-[10px] text-zinc-400 uppercase font-bold">Calories Estimées</div>
                <div className="mt-2 text-center">
                  <span className="text-lg font-bold font-mono text-[#D4FF00]">~{cardioState.caloriesBurned}</span>
                  <span className="text-xs text-zinc-400 ml-1">kcal</span>
                </div>
              </div>
            </div>

            {/* Validation Button for Cardio */}
            <button
              onClick={() => {
                const next = !cardioState.completed;
                setCardioState(c => ({ ...c, completed: next }));
                if (next && settings.soundEnabled) audioService.playTick();
              }}
              className={`w-full py-3.5 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all border flex items-center justify-center gap-2 active:scale-95 ${
                cardioState.completed
                  ? 'bg-[#D4FF00] text-black border-[#D4FF00] shadow-[0_0_15px_rgba(212,255,0,0.3)] font-black'
                  : 'bg-zinc-800 text-zinc-300 border-white/10 hover:bg-zinc-700 hover:text-white'
              }`}
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>{cardioState.completed ? 'Finisher Validé (25 min @ 10%)' : 'Valider le Finisher Cardio'}</span>
            </button>
          </div>

          {/* Primary Finish Workout Button */}
          <div className="pt-2">
            <button
              id="btn-finish-workout"
              onClick={handleFinishWorkout}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#D4FF00] to-[#b8e600] text-black font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(212,255,0,0.35)] hover:shadow-[0_0_40px_rgba(212,255,0,0.5)] active:scale-[0.98] transition-all"
            >
              <Award className="w-5 h-5 text-black stroke-[2.5]" />
              <span>Valider la Séance (N ➔ N+1)</span>
            </button>
            <p className="text-center text-[10px] text-zinc-500 uppercase font-bold tracking-wider mt-2">
              Calcul automatique de la surcharge progressive pour la prochaine séance
            </p>
          </div>
        </>
      )}

      {/* Add Exercise Modal */}
      <AddExerciseModal
        isOpen={isAddExerciseModalOpen}
        onClose={() => setIsAddExerciseModalOpen(false)}
        category={currentCategory}
        onAddExercise={handleAddExerciseToSession}
        existingExerciseIds={exercises.map(e => e.exerciseId)}
        weightRoundingIncrement={settings.weightRoundingIncrement}
      />

      {/* Exercise Detail Modal (Photo & Instructions) */}
      {inspectingExercise && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
          onClick={() => setInspectingExercise(null)}
        >
          <div 
            className="w-full max-w-lg bg-[#121217] border border-white/10 rounded-t-3xl sm:rounded-3xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl text-white"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-white/[0.08]">
              <div>
                <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest">
                  Fiche Technique • {inspectingExercise.category}
                </span>
                <h3 className="text-xl font-black text-white font-display mt-0.5">
                  {inspectingExercise.exerciseName}
                </h3>
              </div>
              <button
                onClick={() => setInspectingExercise(null)}
                className="p-2 rounded-full bg-zinc-800 border border-white/10 text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Exercise Specs Bento */}
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="p-3.5 bg-zinc-900/80 rounded-2xl border border-white/[0.08]">
                <span className="text-[10px] text-zinc-400 uppercase font-bold">Faisceau Cible</span>
                <div className="text-xs font-bold text-white mt-1">
                  {inspectingExercise.subGroupNameFr}
                </div>
              </div>

              <div className="p-3.5 bg-zinc-900/80 rounded-2xl border border-white/[0.08]">
                <span className="text-[10px] text-zinc-400 uppercase font-bold">Équipement Requis</span>
                <div className="text-xs font-bold text-white mt-1 truncate">
                  {inspectingExercise.equipment || 'Charges libres / Machine'}
                </div>
              </div>
            </div>

            {/* Technique Instructions */}
            <div className="mt-4 p-4 bg-zinc-900/80 rounded-2xl border border-white/[0.08]">
              <span className="text-[10px] text-[#D4FF00] uppercase font-bold tracking-wider block mb-1.5">
                Consignes d'Exécution & Posture
              </span>
              <p className="text-xs text-zinc-300 leading-relaxed">
                {inspectingExercise.instructionFr || 'Maintenez une contraction volontaire contrôlée à chaque répétition avec un tempo maîtrisé.'}
              </p>
            </div>

            {/* Pyramid Protocol Breakdown */}
            <div className="mt-4 p-4 bg-black/70 border border-white/10 rounded-2xl">
              <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider block mb-2">
                Protocole Pyramidal PPL
              </span>
              <div className="space-y-1.5 text-xs font-mono">
                <div className="flex justify-between text-zinc-300">
                  <span>Série 1 (60%) :</span>
                  <span className="text-sky-400 font-bold">{Math.round(inspectingExercise.baseMaxWeight * 0.6 * 2) / 2} kg × 12 reps</span>
                </div>
                <div className="flex justify-between text-zinc-300">
                  <span>Série 2 (80%) :</span>
                  <span className="text-amber-400 font-bold">{Math.round(inspectingExercise.baseMaxWeight * 0.8 * 2) / 2} kg × 10 reps</span>
                </div>
                <div className="flex justify-between text-zinc-300">
                  <span>Série 3 (100%) :</span>
                  <span className="text-[#D4FF00] font-bold">{inspectingExercise.baseMaxWeight} kg × Max reps</span>
                </div>
              </div>
            </div>

            {/* Action */}
            <div className="mt-5">
              <button
                onClick={() => setInspectingExercise(null)}
                className="w-full py-3 bg-[#D4FF00] text-black font-black rounded-2xl text-xs uppercase tracking-wider hover:bg-[#b8e600]"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Replace Exercise Modal */}
      <ReplaceExerciseModal
        isOpen={isReplaceModalOpen}
        onClose={() => setIsReplaceModalOpen(false)}
        currentExercise={replacingExercise}
        onSelectVariant={handleSelectVariant}
      />

      {/* Celebration & Summary Modal */}
      {isSummaryModalOpen && completedSummary && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#121217] border border-[#D4FF00]/40 rounded-3xl p-6 shadow-2xl text-white flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-2xl bg-[#D4FF00]/10 border border-[#D4FF00]/30 flex items-center justify-center text-[#D4FF00] mb-3 shadow-[0_0_20px_rgba(212,255,0,0.3)]">
              <Sparkles className="w-8 h-8" />
            </div>

            <span className="text-[10px] font-bold uppercase tracking-widest text-[#D4FF00]">Mission Accomplie</span>
            <h3 className="text-2xl font-black text-white font-display mt-1">
              Séance {completedSummary.category} Validée !
            </h3>
            <p className="text-xs text-zinc-400 mt-1 max-w-xs">
              Excellente intensité. Vos séries 100% sont devenues les nouvelles bases de calcul pour la séance N+1.
            </p>

            <div className="grid grid-cols-2 gap-3 w-full my-4 text-left">
              <div className="p-4 bg-zinc-900/90 rounded-2xl border border-white/10">
                <span className="text-[10px] text-zinc-400 uppercase font-bold">Volume Total</span>
                <div className="text-xl font-black text-[#D4FF00] font-mono mt-0.5">
                  {completedSummary.totalVolumeKg.toLocaleString()} kg
                </div>
              </div>

              <div className="p-4 bg-zinc-900/90 rounded-2xl border border-white/10">
                <span className="text-[10px] text-zinc-400 uppercase font-bold">Durée Musculation</span>
                <div className="text-xl font-black text-white font-mono mt-0.5">
                  {formatElapsed(completedSummary.durationSeconds)}
                </div>
              </div>
            </div>

            {completedSummary.cardio && completedSummary.cardio.completed && (
              <div className="w-full mb-4 p-3.5 bg-zinc-900/90 rounded-2xl border border-white/10 flex items-center justify-between text-left">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#D4FF00]/20 text-[#D4FF00] flex items-center justify-center">
                    <Flame className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-zinc-300">Finisher Cardio Validé</span>
                    <p className="text-xs font-bold text-white">
                      {completedSummary.cardio.durationMinutes} min • {completedSummary.cardio.distanceKm} km (Pente {completedSummary.cardio.inclinePercentage}%)
                    </p>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-[#D4FF00]">
                  ~{completedSummary.cardio.caloriesBurned} kcal
                </span>
              </div>
            )}

            <div className="flex gap-2 w-full">
              <button
                onClick={() => handleStartFreshSession('PUSH')}
                className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-2xl text-xs uppercase tracking-wider transition-colors border border-white/10"
              >
                Nouvelle Séance
              </button>
              <button
                onClick={() => setIsSummaryModalOpen(false)}
                className="flex-1 py-3 bg-[#D4FF00] hover:bg-[#b8e600] text-black font-black rounded-2xl text-xs uppercase tracking-wider transition-colors shadow-xs"
              >
                Consulter les Stats
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
