import { 
  ExerciseDefinition, 
  CompletedWorkout, 
  AppSettings, 
  MuscleCategory, 
  ExerciseSessionState, 
  CardioSessionState 
} from '../types/fitness';
import { INITIAL_EXERCISES, ALL_EXERCISES_DATABASE } from '../data/defaultExercises';
import { calculatePyramidWeights, determineNextSessionMaxWeight } from '../utils/fitnessCalculations';

const STORAGE_KEYS = {
  EXERCISES: 'ppl_fitness_exercises_v1',
  WORKOUT_HISTORY: 'ppl_fitness_history_v1',
  SETTINGS: 'ppl_fitness_settings_v1',
  ACTIVE_WORKOUT: 'ppl_fitness_active_workout_v1',
};

export const DEFAULT_SETTINGS: AppSettings = {
  defaultRestDuration: 90, // 1m30 (90 seconds)
  soundEnabled: true,
  vibrationEnabled: true,
  weightRoundingIncrement: 0.5,
  weightUnit: 'kg',
  autoIncrementWeightOnSuccess: true,
  autoIncrementStepKg: 1.0,
};

export class StorageService {
  // Get all registered exercises
  static getExercises(): ExerciseDefinition[] {
    if (typeof window === 'undefined') return INITIAL_EXERCISES;
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.EXERCISES);
      if (stored) {
        const parsed: ExerciseDefinition[] = JSON.parse(stored);
        return parsed.map(ex => {
          const defaultEx = INITIAL_EXERCISES.find(d => d.id === ex.id) || ALL_EXERCISES_DATABASE.find(d => d.id === ex.id);
          return {
            ...ex,
            instructionFr: defaultEx?.instructionFr || ex.instructionFr || '',
            equipment: defaultEx?.equipment || ex.equipment || '',
            targetMuscleFr: defaultEx?.targetMuscleFr || ex.targetMuscleFr || ''
          };
        });
      }
    } catch {
      // fallback
    }
    this.saveExercises(INITIAL_EXERCISES);
    return INITIAL_EXERCISES;
  }

  static saveExercises(exercises: ExerciseDefinition[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEYS.EXERCISES, JSON.stringify(exercises));
    } catch {
      // error saving
    }
  }

  // Update specific exercise (e.g. new max weight for N+1)
  static updateExerciseMaxWeight(exerciseId: string, newMaxWeight: number): void {
    const exercises = this.getExercises();
    const updated = exercises.map(ex => {
      if (ex.id === exerciseId) {
        return {
          ...ex,
          currentMaxWeight: Math.max(0.5, Math.round(newMaxWeight * 2) / 2)
        };
      }
      return ex;
    });
    this.saveExercises(updated);
  }

  // Calculate the 3 pyramidal sets for an exercise based on max weight and rounding increment
  static calculatePyramidSets(
    exercise: ExerciseDefinition | { currentMaxWeight: number },
    rounding = 0.5
  ) {
    const { set1Weight, set2Weight, set3Weight } = calculatePyramidWeights(exercise.currentMaxWeight, rounding);

    return [
      {
        setNumber: 1 as const,
        percentage: 60,
        targetReps: '12 reps',
        actualReps: 12,
        calculatedWeight: set1Weight,
        actualWeight: set1Weight,
        completed: false,
      },
      {
        setNumber: 2 as const,
        percentage: 80,
        targetReps: '10 reps',
        actualReps: 10,
        calculatedWeight: set2Weight,
        actualWeight: set2Weight,
        completed: false,
      },
      {
        setNumber: 3 as const,
        percentage: 100,
        targetReps: 'Max reps',
        actualReps: 8,
        calculatedWeight: set3Weight,
        actualWeight: set3Weight,
        completed: false,
      }
    ];
  }

  // Initialize a new active workout session for a given category
  static createNewWorkoutState(category: MuscleCategory, rounding = 0.5): ExerciseSessionState[] {
    const allExos = this.getExercises();
    const filtered = allExos.filter(e => e.category === category);

    return filtered.map(exo => ({
      exerciseId: exo.id,
      exerciseName: exo.name,
      category: exo.category,
      subGroup: exo.subGroup,
      subGroupNameFr: exo.subGroupNameFr,
      targetMuscleFr: exo.targetMuscleFr,
      equipment: exo.equipment,
      instructionFr: exo.instructionFr,
      baseMaxWeight: exo.currentMaxWeight,
      sets: this.calculatePyramidSets(exo, rounding) as [any, any, any]
    }));
  }

  // Get active workout if any in progress
  static getActiveWorkout(): {
    category: MuscleCategory;
    startTime: number;
    exercises: ExerciseSessionState[];
    cardio?: CardioSessionState;
  } | null {
    if (typeof window === 'undefined') return null;
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.ACTIVE_WORKOUT);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && Array.isArray(parsed.exercises)) {
          parsed.exercises = parsed.exercises.map((exo: ExerciseSessionState) => {
            const def = INITIAL_EXERCISES.find(d => d.id === exo.exerciseId) || ALL_EXERCISES_DATABASE.find(d => d.id === exo.exerciseId);
            return {
              ...exo,
              instructionFr: def?.instructionFr || exo.instructionFr,
              equipment: def?.equipment || exo.equipment,
              targetMuscleFr: def?.targetMuscleFr || exo.targetMuscleFr,
              subGroupNameFr: def?.subGroupNameFr || exo.subGroupNameFr
            };
          });
        }
        return parsed;
      }
    } catch {
      //
    }
    return null;
  }

  static saveActiveWorkout(data: {
    category: MuscleCategory;
    startTime: number;
    exercises: ExerciseSessionState[];
    cardio?: CardioSessionState;
  } | null): void {
    if (typeof window === 'undefined') return;
    try {
      if (!data) {
        localStorage.removeItem(STORAGE_KEYS.ACTIVE_WORKOUT);
      } else {
        localStorage.setItem(STORAGE_KEYS.ACTIVE_WORKOUT, JSON.stringify(data));
      }
    } catch {
      //
    }
  }

  // Get workout history
  static getHistory(): CompletedWorkout[] {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.WORKOUT_HISTORY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      //
    }
    // Start with a genuinely clean history for the user
    return [];
  }

  static getWorkoutHistory(): CompletedWorkout[] {
    return this.getHistory();
  }

  static saveHistory(history: CompletedWorkout[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEYS.WORKOUT_HISTORY, JSON.stringify(history));
    } catch {
      //
    }
  }

  // Finish and save a completed workout, applying N+1 load propagation
  static completeWorkout(workout: CompletedWorkout, settingsOrAutoIncrement?: AppSettings | boolean): void {
    const history = this.getHistory();
    history.unshift(workout);
    this.saveHistory(history);

    const settings = typeof settingsOrAutoIncrement === 'object' 
      ? settingsOrAutoIncrement 
      : { ...this.getSettings(), autoIncrementWeightOnSuccess: !!settingsOrAutoIncrement };

    // CRITICAL: Update base max weights for next session (Séance N+1)
    const exercises = this.getExercises();
    const updatedExercises = [...exercises];

    workout.exercises.forEach(sessionExo => {
      const set3 = sessionExo.sets[2];
      if (set3 && set3.completed) {
        const idx = updatedExercises.findIndex(e => e.id === sessionExo.exerciseId);
        if (idx !== -1) {
          const newMax = determineNextSessionMaxWeight(
            set3,
            updatedExercises[idx].currentMaxWeight,
            {
              autoIncrementWeightOnSuccess: settings.autoIncrementWeightOnSuccess,
              autoIncrementStepKg: settings.autoIncrementStepKg
            }
          );
          updatedExercises[idx] = {
            ...updatedExercises[idx],
            currentMaxWeight: newMax
          };
        }
      }
    });

    this.saveExercises(updatedExercises);
    this.saveActiveWorkout(null);
  }

  static saveCompletedWorkout(workout: CompletedWorkout, autoIncrement = true): void {
    this.completeWorkout(workout, autoIncrement);
  }

  // Settings
  static getSettings(): AppSettings {
    if (typeof window === 'undefined') return DEFAULT_SETTINGS;
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (stored) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      }
    } catch {
      //
    }
    return DEFAULT_SETTINGS;
  }

  static saveSettings(settings: AppSettings): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch {
      //
    }
  }

  // Find all replacement exercises targeting the exact same sub-group
  static getVariantsForExercise(subGroup: string, currentExerciseId: string): ExerciseDefinition[] {
    return ALL_EXERCISES_DATABASE.filter(
      item => item.subGroup === subGroup && item.id !== currentExerciseId
    );
  }

  // Reset all to defaults
  static resetAllData(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEYS.EXERCISES);
    localStorage.removeItem(STORAGE_KEYS.WORKOUT_HISTORY);
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_WORKOUT);
  }
}
