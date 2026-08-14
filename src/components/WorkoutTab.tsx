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
  ChevronRight
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
import { ReplaceExerciseModal } from './ReplaceExerciseModal';

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
    notes: 'Zone 2 cardio - Allure constante et posture droite',
    imageUrl: 'https://images.unsplash.com/photo-1538805060514-97d9cc17730c?w=700&auto=format&fit=crop&q=80'
  });

  const [replacingExercise, setReplacingExercise] = useState<ExerciseSessionState | null>(null);
  const [isReplaceModalOpen, setIsReplaceModalOpen] = useState(false);
  const [inspectingExercise, setInspectingExercise] = useState<ExerciseSessionState | null>(null);
  const [workoutStartTime, setWorkoutStartTime] = useState<number>(Date.now());
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [completedSummary, setCompletedSummary] = useState<CompletedWorkout | null>(null);

  // Initialize exercises for the selected category
  const loadCategory = (category: MuscleCategory) => {
    setCurrentCategory(category);
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
    const baseMet = 3.5 + (cardioState.speedKmh * 0.1) + (cardioState.speedKmh * 1.8 * (cardioState.inclinePercentage / 100));
    const athleteWeight = settings.athleteWeight || 75;
    const estimated = Math.round(baseMet * athleteWeight * (cardioState.durationMinutes / 60) * (5 / 3.5));
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

  // Adjust weight for a set
  const handleAdjustSetWeight = (exoIndex: number, setIndex: number, delta: number) => {
    const updated = [...exercises];
    const s = updated[exoIndex].sets[setIndex];
    const newWeight = Math.max(0, Math.round((s.actualWeight + delta) * 2) / 2);
    s.actualWeight = newWeight;
    setExercises(updated);
  };

  // Adjust reps for a set
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
    const totalVolume = exercises.reduce((sum, exo) => {
      return sum + exo.sets.reduce((sSum, s) => {
        return s.completed ? sSum + (s.actualWeight * s.actualReps) : sSum;
      }, 0);
    }, 0);

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
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#A3FF12', '#ffffff', '#262626']
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
  const liveTotalVolume = exercises.reduce((sum, exo) => {
    return sum + exo.sets.reduce((sSum, s) => {
      return s.completed ? sSum + (s.actualWeight * s.actualReps) : sSum;
    }, 0);
  }, 0);

  const completedSetsCount = exercises.reduce((sum, exo) => {
    return sum + exo.sets.filter(s => s.completed).length;
  }, 0);
  const totalSetsCount = exercises.length * 3;

  return (
    <div id="workout-tab-container" className="pb-28 pt-2 space-y-4">
      {/* Top Session Bento Header */}
      <div className="flex justify-between items-end px-1 pt-1">
        <div className="flex flex-col">
          <span className="text-[#A3FF12] text-xs font-bold tracking-widest uppercase">Séance En Cours</span>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#F5F5F5] flex items-center gap-2">
            <span>PPL</span>
            <span className="text-[#A3FF12]">•</span>
            <span>{currentCategory}</span>
          </h1>
        </div>

        {/* Live Session Timer Pill */}
        <div className="flex items-center gap-2 bg-[#1A1A1A] border border-[#262626] px-3.5 py-1.5 rounded-full shadow-inner">
          <Clock className="w-3.5 h-3.5 text-[#A3FF12] animate-pulse" />
          <span className="font-mono text-sm font-bold text-[#F5F5F5]">{formatElapsed(elapsedSeconds)}</span>
        </div>
      </div>

      {/* Category Selector Pills (PUSH / PULL / LEGS) */}
      <div className="grid grid-cols-3 gap-2 p-1 bg-[#1A1A1A] rounded-2xl border border-[#262626]">
        {(['PUSH', 'PULL', 'LEGS'] as MuscleCategory[]).map((cat) => (
          <button
            key={cat}
            id={`btn-category-${cat}`}
            onClick={() => loadCategory(cat)}
            className={`py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-200 ${
              currentCategory === cat
                ? 'bg-[#A3FF12] text-black shadow-lg shadow-[#A3FF12]/20 font-black'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#262626]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Bento Progress & Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="bg-[#1A1A1A] border border-[#262626] p-3.5 rounded-2xl flex flex-col justify-between">
          <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Séries Validées</div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-black font-mono text-[#A3FF12]">{completedSetsCount}</span>
            <span className="text-xs text-zinc-500 font-mono font-bold">/ {totalSetsCount}</span>
          </div>
        </div>

        <div className="bg-[#1A1A1A] border border-[#262626] p-3.5 rounded-2xl flex flex-col justify-between">
          <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Tonnage Total</div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-black font-mono text-[#F5F5F5]">{liveTotalVolume}</span>
            <span className="text-xs text-zinc-500 font-bold">kg</span>
          </div>
        </div>

        <div className="bg-[#1A1A1A] border border-[#262626] p-3.5 rounded-2xl flex flex-col justify-between">
          <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Minuteur Repos</div>
          <button
            onClick={() => onOpenTimer(settings.defaultRestDuration)}
            className="mt-1 flex items-center justify-between py-1 px-2.5 rounded-xl bg-[#262626] hover:bg-[#A3FF12] hover:text-black text-[#A3FF12] font-bold text-xs transition-colors"
          >
            <span className="flex items-center gap-1">
              <Timer className="w-3.5 h-3.5" />
              <span>{settings.defaultRestDuration}s</span>
            </span>
            <Play className="w-3 h-3 fill-current" />
          </button>
        </div>

        <div className="bg-[#1A1A1A] border border-[#262626] p-3.5 rounded-2xl flex flex-col justify-between">
          <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Finisher Cardio</div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs font-bold text-zinc-300">Marche Inclinée</span>
            <button
              onClick={() => setCardioState(c => ({ ...c, completed: !c.completed }))}
              className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
                cardioState.completed
                  ? 'bg-[#A3FF12] text-black shadow-sm'
                  : 'border border-zinc-700 hover:border-[#A3FF12] text-transparent'
              }`}
            >
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            </button>
          </div>
        </div>
      </div>

      {/* PPL BENTO EXERCISES LIST */}
      <div id="ppl-exercises-list" className="space-y-4">
        {exercises.map((exo, exoIdx) => {
          const isAllCompleted = exo.sets.every(s => s.completed);

          return (
            <div
              key={exo.exerciseId}
              id={`exercise-card-${exo.exerciseId}`}
              className={`bg-[#1A1A1A] border rounded-3xl p-4 sm:p-5 shadow-xl transition-all flex flex-col gap-4 ${
                isAllCompleted ? 'border-[#A3FF12]/40 ring-1 ring-[#A3FF12]/20' : 'border-[#262626]'
              }`}
            >
              {/* Exercise Header with Anatomical Badge */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {/* Anatomical Icon Badge */}
                  <div
                    onClick={() => setInspectingExercise(exo)}
                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-zinc-900 border border-zinc-700/80 shrink-0 flex items-center justify-center relative group cursor-pointer shadow-md hover:border-[#A3FF12]/60 hover:bg-zinc-800 transition-all"
                    title="Voir la fiche technique & consignes"
                  >
                    <Dumbbell className="w-6 h-6 text-[#A3FF12] group-hover:scale-110 transition-transform" />
                    <div className="absolute -bottom-1 -right-1 bg-black/80 border border-zinc-700 p-0.5 rounded-full text-[#A3FF12]">
                      <Info className="w-3 h-3" />
                    </div>
                  </div>

                  {/* Title & Info */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold text-[#A3FF12] bg-[#A3FF12]/10 px-2 py-0.5 rounded-md border border-[#A3FF12]/20">
                        #{exoIdx + 1}
                      </span>
                      <h2 className="text-base sm:text-lg font-bold text-[#F5F5F5] tracking-tight truncate">
                        {exo.exerciseName}
                      </h2>
                    </div>
                    <p className="text-xs text-zinc-400 mt-0.5 truncate">
                      Faisceau : <span className="text-zinc-200 font-medium">{exo.subGroupNameFr}</span>
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-zinc-400">
                        Base 100% : <span className="font-mono text-[#A3FF12] font-bold">{exo.baseMaxWeight} kg</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Replace Button with Exact Sub-Group Matching */}
                <button
                  id={`btn-replace-${exo.exerciseId}`}
                  onClick={() => handleOpenReplace(exo)}
                  className="bg-[#262626] hover:bg-zinc-800 text-[10px] px-3 py-1.5 rounded-full border border-zinc-700 font-bold uppercase tracking-wider text-zinc-300 hover:text-white transition-all active:scale-95 flex items-center gap-1 shrink-0"
                  title="Remplacer par une variante ciblant le même faisceau"
                >
                  <ArrowRightLeft className="w-3 h-3 text-[#A3FF12]" />
                  <span className="hidden sm:inline">Remplacer</span>
                </button>
              </div>

              {/* Pyramidal 3-Column Bento Grid Sets */}
              <div className="grid grid-cols-3 gap-2">
                {exo.sets.map((setRecord, sIdx) => {
                  const setLabels = [
                    { tag: 'S1: 60%', repTarget: '12 Reps' },
                    { tag: 'S2: 80%', repTarget: '10 Reps' },
                    { tag: 'S3: 100%', repTarget: 'Max Reps' }
                  ];
                  const info = setLabels[sIdx];
                  const isCompleted = setRecord.completed;

                  return (
                    <div
                      key={setRecord.setNumber}
                      id={`set-bento-card-${exo.exerciseId}-${sIdx}`}
                      className={`rounded-2xl p-2.5 sm:p-3 border flex flex-col items-center justify-between text-center transition-all relative overflow-hidden ${
                        isCompleted
                          ? 'bg-[#A3FF12]/10 border-[#A3FF12]/60 ring-1 ring-[#A3FF12]/50'
                          : sIdx === 2
                          ? 'bg-[#222] border-zinc-700 hover:border-[#A3FF12]/40'
                          : 'bg-[#222] border-zinc-800/80'
                      }`}
                    >
                      {/* Set Tag */}
                      <div className="w-full flex items-center justify-between mb-1">
                        <span className={`text-[9px] sm:text-[10px] uppercase font-black tracking-wider ${
                          isCompleted || sIdx === 2 ? 'text-[#A3FF12]' : 'text-zinc-500'
                        }`}>
                          {info.tag}
                        </span>

                        <button
                          onClick={() => handleToggleSet(exoIdx, sIdx)}
                          className={`w-5 h-5 rounded-md flex items-center justify-center transition-all ${
                            isCompleted
                              ? 'bg-[#A3FF12] text-black shadow-sm'
                              : 'border border-zinc-600 hover:border-[#A3FF12] text-transparent'
                          }`}
                          title="Valider la série"
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </button>
                      </div>

                      {/* Weight Display & Stepper */}
                      <div className="my-1 flex flex-col items-center">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleAdjustSetWeight(exoIdx, sIdx, -settings.weightRoundingIncrement)}
                            className="w-5 h-5 rounded bg-[#1A1A1A] hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center text-[10px] active:scale-90"
                          >
                            <Minus className="w-2.5 h-2.5" />
                          </button>
                          
                          <span className="font-mono text-base sm:text-lg font-black text-[#F5F5F5] min-w-[3rem]">
                            {setRecord.actualWeight}
                            <span className="text-[10px] text-zinc-500 font-sans font-normal ml-0.5">kg</span>
                          </span>

                          <button
                            onClick={() => handleAdjustSetWeight(exoIdx, sIdx, settings.weightRoundingIncrement)}
                            className="w-5 h-5 rounded bg-[#1A1A1A] hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center text-[10px] active:scale-90"
                          >
                            <Plus className="w-2.5 h-2.5" />
                          </button>
                        </div>

                        {/* Reps Counter & Stepper */}
                        <div className="flex items-center gap-1.5 mt-1.5 bg-[#1A1A1A] px-2 py-0.5 rounded-full border border-zinc-800">
                          <button
                            onClick={() => handleAdjustSetReps(exoIdx, sIdx, -1)}
                            className="text-zinc-400 hover:text-white text-xs"
                          >
                            -
                          </button>
                          <span className="text-xs font-mono font-bold text-zinc-200">
                            {setRecord.actualReps} <span className="text-[9px] text-zinc-500">reps</span>
                          </span>
                          <button
                            onClick={() => handleAdjustSetReps(exoIdx, sIdx, 1)}
                            className="text-zinc-400 hover:text-white text-xs"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Rep Target Hint */}
                      <div className="text-[9px] text-zinc-500 font-medium">
                        Cible : {info.repTarget}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Base Max Weight Quick Adjust Footer for Set 3 */}
              <div className="flex items-center justify-between text-xs text-zinc-400 pt-2 border-t border-zinc-800/80">
                <span className="text-[11px]">Ajuster la charge 100% :</span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleAdjustBaseMaxWeight(exoIdx, exo.baseMaxWeight - 2.5)}
                    className="px-2 py-1 bg-[#262626] hover:bg-zinc-700 text-zinc-300 rounded-lg text-[10px] font-mono font-bold"
                  >
                    -2.5kg
                  </button>
                  <span className="font-mono text-xs font-bold text-[#A3FF12]">{exo.baseMaxWeight} kg</span>
                  <button
                    onClick={() => handleAdjustBaseMaxWeight(exoIdx, exo.baseMaxWeight + 2.5)}
                    className="px-2 py-1 bg-[#262626] hover:bg-zinc-700 text-zinc-300 rounded-lg text-[10px] font-mono font-bold"
                  >
                    +2.5kg
                  </button>
                </div>
              </div>

              {/* Fast completion button for entire exercise */}
              <button
                onClick={() => {
                  const updated = [...exercises];
                  const shouldComplete = !isAllCompleted;
                  updated[exoIdx].sets.forEach(s => s.completed = shouldComplete);
                  setExercises(updated);
                  if (shouldComplete && settings.soundEnabled) audioService.playTick();
                }}
                className={`w-full py-2.5 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all border ${
                  isAllCompleted
                    ? 'bg-[#A3FF12]/15 text-[#A3FF12] border-[#A3FF12]/30'
                    : 'bg-[#222222] text-zinc-300 border-zinc-800 hover:bg-[#262626]'
                }`}
              >
                {isAllCompleted ? 'Exercice Complété ✓' : 'Valider la Série Suivante'}
              </button>
            </div>
          );
        })}
      </div>

      {/* FINISHER CARDIO SECTION */}
      <div id="integrated-cardio-finisher" className="bg-[#1A1A1A] border border-[#262626] rounded-3xl p-5 shadow-xl transition-all">
        <div className="flex items-center justify-between pb-3 border-b border-[#262626]">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-700/80 shrink-0 relative">
              <img
                src={cardioState.imageUrl || "https://images.unsplash.com/photo-1538805060514-97d9cc17730c?w=700&auto=format&fit=crop&q=80"}
                alt="Marche Inclinée"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-[#F5F5F5]">Finisher Cardio : Marche Inclinée</h3>
              <p className="text-[11px] text-zinc-400">Post-séance {currentCategory} • Zone 2 Brûlage des graisses</p>
            </div>
          </div>
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
            cardioState.completed
              ? 'bg-[#A3FF12] text-black border-[#A3FF12]'
              : 'bg-[#A3FF12]/10 text-[#A3FF12] border-[#A3FF12]/30'
          }`}>
            {cardioState.completed ? 'Validé ✓' : 'Finisher Optionnel'}
          </span>
        </div>

        {/* Bento Grid Metrics for Cardio Finisher */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 my-4">
          <div className="p-3 bg-[#222222] rounded-2xl border border-zinc-800 flex flex-col justify-between">
            <div className="text-[10px] text-zinc-500 uppercase font-bold">Inclinaison (%)</div>
            <div className="flex items-center justify-between mt-2">
              <button 
                onClick={() => setCardioState(c => ({ ...c, inclinePercentage: Math.max(0, c.inclinePercentage - 1) }))}
                className="w-7 h-7 flex items-center justify-center text-zinc-400 hover:text-white bg-[#1A1A1A] border border-zinc-700 rounded-lg text-xs"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="text-lg font-bold font-mono text-[#A3FF12]">{cardioState.inclinePercentage}%</span>
              <button 
                onClick={() => setCardioState(c => ({ ...c, inclinePercentage: Math.min(20, c.inclinePercentage + 1) }))}
                className="w-7 h-7 flex items-center justify-center text-zinc-400 hover:text-white bg-[#1A1A1A] border border-zinc-700 rounded-lg text-xs"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="p-3 bg-[#222222] rounded-2xl border border-zinc-800 flex flex-col justify-between">
            <div className="text-[10px] text-zinc-500 uppercase font-bold">Vitesse (km/h)</div>
            <div className="flex items-center justify-between mt-2">
              <button 
                onClick={() => setCardioState(c => ({ ...c, speedKmh: Math.max(1, Math.round((c.speedKmh - 0.2) * 10) / 10) }))}
                className="w-7 h-7 flex items-center justify-center text-zinc-400 hover:text-white bg-[#1A1A1A] border border-zinc-700 rounded-lg text-xs"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="text-lg font-bold font-mono text-[#A3FF12]">{cardioState.speedKmh}</span>
              <button 
                onClick={() => setCardioState(c => ({ ...c, speedKmh: Math.min(10, Math.round((c.speedKmh + 0.2) * 10) / 10) }))}
                className="w-7 h-7 flex items-center justify-center text-zinc-400 hover:text-white bg-[#1A1A1A] border border-zinc-700 rounded-lg text-xs"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="p-3 bg-[#222222] rounded-2xl border border-zinc-800 flex flex-col justify-between">
            <div className="text-[10px] text-zinc-500 uppercase font-bold">Durée (min)</div>
            <div className="flex items-center justify-between mt-2">
              <button 
                onClick={() => setCardioState(c => ({ ...c, durationMinutes: Math.max(5, c.durationMinutes - 5) }))}
                className="w-7 h-7 flex items-center justify-center text-zinc-400 hover:text-white bg-[#1A1A1A] border border-zinc-700 rounded-lg text-xs"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="text-lg font-bold font-mono text-[#F5F5F5]">{cardioState.durationMinutes}</span>
              <button 
                onClick={() => setCardioState(c => ({ ...c, durationMinutes: Math.min(90, c.durationMinutes + 5) }))}
                className="w-7 h-7 flex items-center justify-center text-zinc-400 hover:text-white bg-[#1A1A1A] border border-zinc-700 rounded-lg text-xs"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="p-3 bg-[#222222] rounded-2xl border border-zinc-800 flex flex-col justify-between">
            <div className="text-[10px] text-zinc-500 uppercase font-bold">Calories Estimées</div>
            <div className="mt-2 text-center">
              <span className="text-lg font-bold font-mono text-[#A3FF12]">~{cardioState.caloriesBurned}</span>
              <span className="text-xs text-zinc-500 ml-1">kcal</span>
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
          className={`w-full py-3 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all border flex items-center justify-center gap-2 ${
            cardioState.completed
              ? 'bg-[#A3FF12] text-black border-[#A3FF12] shadow-md shadow-[#A3FF12]/20 font-black'
              : 'bg-[#222222] text-zinc-300 border-zinc-800 hover:bg-[#262626]'
          }`}
        >
          <Check className="w-4 h-4 stroke-[2.5]" />
          <span>{cardioState.completed ? 'Finisher Validé (25 min @ 10%)' : 'Valider le Finisher Cardio'}</span>
        </button>
      </div>

      {/* Primary Finish Workout Bento Button */}
      <div className="pt-2">
        <button
          id="btn-finish-workout"
          onClick={handleFinishWorkout}
          className="w-full py-4 rounded-2xl bg-[#A3FF12] text-black font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 shadow-2xl shadow-[#A3FF12]/20 hover:bg-[#b5ff33] active:scale-[0.99] transition-all"
        >
          <Award className="w-5 h-5 text-black stroke-[2.5]" />
          <span>Valider la Séance (N ➔ N+1)</span>
        </button>
        <p className="text-center text-[10px] text-zinc-500 uppercase font-bold tracking-wider mt-2">
          Enregistrement sécurisé dans la base locale
        </p>
      </div>

      {/* Exercise Detail Modal (Photo & Instructions) */}
      {inspectingExercise && (
        <div 
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
          onClick={() => setInspectingExercise(null)}
        >
          <div 
            className="w-full max-w-lg bg-[#141414] border border-[#262626] rounded-t-3xl sm:rounded-3xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl text-[#F5F5F5]"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-[#262626]">
              <div>
                <span className="text-[10px] font-mono font-bold text-[#A3FF12] uppercase tracking-widest">
                  Fiche Technique • {inspectingExercise.category}
                </span>
                <h3 className="text-xl font-black text-[#F5F5F5] mt-0.5">
                  {inspectingExercise.exerciseName}
                </h3>
              </div>
              <button
                onClick={() => setInspectingExercise(null)}
                className="p-2 rounded-full bg-[#222] border border-zinc-700 text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Exercise Specs Bento */}
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="p-3.5 bg-[#1F1F1F] rounded-2xl border border-zinc-800">
                <span className="text-[10px] text-zinc-500 uppercase font-bold">Faisceau Cible</span>
                <div className="text-xs font-bold text-[#A3FF12] mt-1">
                  {inspectingExercise.subGroupNameFr}
                </div>
              </div>

              <div className="p-3.5 bg-[#1F1F1F] rounded-2xl border border-zinc-800">
                <span className="text-[10px] text-zinc-500 uppercase font-bold">Équipement Requis</span>
                <div className="text-xs font-bold text-[#F5F5F5] mt-1 truncate">
                  {inspectingExercise.equipment || 'Charges libres / Machine'}
                </div>
              </div>
            </div>

            {/* Technique Instructions */}
            <div className="mt-4 p-4 bg-[#1F1F1F] rounded-2xl border border-zinc-800">
              <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider block mb-1.5">
                Consignes d'Exécution & Posture
              </span>
              <p className="text-xs text-zinc-200 leading-relaxed">
                {inspectingExercise.instructionFr || 'Maintenez une contraction volontaire contrôlée à chaque répétition avec un tempo maîtrisé.'}
              </p>
            </div>

            {/* Pyramid Protocol Breakdown */}
            <div className="mt-4 p-4 bg-[#0F0F0F] rounded-2xl border border-zinc-800/80">
              <span className="text-[10px] text-[#A3FF12] uppercase font-bold tracking-wider block mb-2">
                Protocole Pyramidal PPL
              </span>
              <div className="space-y-1.5 text-xs text-zinc-300 font-mono">
                <div className="flex justify-between">
                  <span>Série 1 (60%) :</span>
                  <span className="text-white font-bold">{Math.round(inspectingExercise.baseMaxWeight * 0.6 * 2) / 2} kg × 12 reps</span>
                </div>
                <div className="flex justify-between">
                  <span>Série 2 (80%) :</span>
                  <span className="text-white font-bold">{Math.round(inspectingExercise.baseMaxWeight * 0.8 * 2) / 2} kg × 10 reps</span>
                </div>
                <div className="flex justify-between">
                  <span>Série 3 (100%) :</span>
                  <span className="text-[#A3FF12] font-bold">{inspectingExercise.baseMaxWeight} kg × Max reps</span>
                </div>
              </div>
            </div>

            {/* Action */}
            <div className="mt-5">
              <button
                onClick={() => setInspectingExercise(null)}
                className="w-full py-3 bg-[#A3FF12] text-black font-bold rounded-2xl text-xs uppercase tracking-wider"
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
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#121212] border border-[#262626] rounded-3xl p-6 shadow-2xl text-[#F5F5F5] flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-2xl bg-[#A3FF12]/15 border border-[#A3FF12]/40 flex items-center justify-center text-[#A3FF12] mb-3">
              <Sparkles className="w-8 h-8" />
            </div>

            <span className="text-[10px] font-bold uppercase tracking-widest text-[#A3FF12]">Mission Accomplie</span>
            <h3 className="text-2xl font-black text-[#F5F5F5] mt-1">
              Séance {completedSummary.category} Validée !
            </h3>
            <p className="text-xs text-zinc-400 mt-1 max-w-xs">
              Excellente intensité. Vos séries 100% sont devenues les nouvelles bases de calcul pour la séance N+1.
            </p>

            <div className="grid grid-cols-2 gap-3 w-full my-4 text-left">
              <div className="p-4 bg-[#1A1A1A] rounded-2xl border border-[#262626]">
                <span className="text-[10px] text-zinc-500 uppercase font-bold">Volume Total</span>
                <div className="text-xl font-black text-[#A3FF12] font-mono mt-0.5">
                  {completedSummary.totalVolumeKg.toLocaleString()} kg
                </div>
              </div>

              <div className="p-4 bg-[#1A1A1A] rounded-2xl border border-[#262626]">
                <span className="text-[10px] text-zinc-500 uppercase font-bold">Durée Musculation</span>
                <div className="text-xl font-black text-[#F5F5F5] font-mono mt-0.5">
                  {formatElapsed(completedSummary.durationSeconds)}
                </div>
              </div>
            </div>

            {completedSummary.cardio && completedSummary.cardio.completed && (
              <div className="w-full mb-4 p-3.5 bg-[#1A1A1A] rounded-2xl border border-[#A3FF12]/30 flex items-center justify-between text-left">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#A3FF12]/15 flex items-center justify-center text-[#A3FF12]">
                    <Flame className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-[#A3FF12]">Finisher Cardio Validé</span>
                    <p className="text-xs font-bold text-[#F5F5F5]">
                      {completedSummary.cardio.durationMinutes} min • {completedSummary.cardio.distanceKm} km (Pente {completedSummary.cardio.inclinePercentage}%)
                    </p>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-[#A3FF12]">
                  ~{completedSummary.cardio.caloriesBurned} kcal
                </span>
              </div>
            )}

            <div className="flex gap-2 w-full">
              <button
                onClick={() => handleStartFreshSession('PUSH')}
                className="flex-1 py-3 bg-[#262626] hover:bg-zinc-800 text-zinc-200 font-bold rounded-2xl text-xs uppercase tracking-wider transition-colors"
              >
                Nouvelle Séance
              </button>
              <button
                onClick={() => setIsSummaryModalOpen(false)}
                className="flex-1 py-3 bg-[#A3FF12] text-black font-black rounded-2xl text-xs uppercase tracking-wider transition-colors shadow-lg shadow-[#A3FF12]/20"
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
