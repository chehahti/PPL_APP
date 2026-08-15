import { describe, it, expect, beforeEach } from 'vitest';
import { StorageService, DEFAULT_SETTINGS } from './storageService';
import { CompletedWorkout, ExerciseDefinition } from '../types/fitness';
import { INITIAL_EXERCISES, ALL_EXERCISES_DATABASE } from '../data/defaultExercises';

describe('StorageService', () => {
  beforeEach(() => {
    // Clear mock localStorage before each test
    StorageService.resetAllData();
  });

  describe('getExercises and saveExercises', () => {
    it('returns default INITIAL_EXERCISES when storage is empty', () => {
      const exercises = StorageService.getExercises();
      expect(exercises).toBeDefined();
      expect(exercises.length).toBe(INITIAL_EXERCISES.length);
      expect(exercises[0].id).toBe(INITIAL_EXERCISES[0].id);
    });

    it('persists and retrieves updated exercises list', () => {
      const customList: ExerciseDefinition[] = [
        {
          id: 'test_exo',
          name: 'Test Exo',
          category: 'PUSH',
          subGroup: 'CHEST_MID',
          subGroupNameFr: 'Pectoraux',
          targetMuscleFr: 'Grand pectoral',
          defaultMinWeight: 20,
          defaultMaxWeight: 40,
          currentMaxWeight: 40,
          unit: 'kg',
          equipment: 'Haltères',
          instructionFr: 'Test instruction'
        }
      ];

      StorageService.saveExercises(customList);
      const retrieved = StorageService.getExercises();
      expect(retrieved.length).toBe(1);
      expect(retrieved[0].name).toBe('Test Exo');
      expect(retrieved[0].currentMaxWeight).toBe(40);
    });

    it('updates specific exercise max weight with updateExerciseMaxWeight', () => {
      StorageService.updateExerciseMaxWeight('push_developpe_couche', 60.5);
      const exercises = StorageService.getExercises();
      const bench = exercises.find(e => e.id === 'push_developpe_couche');
      expect(bench).toBeDefined();
      expect(bench?.currentMaxWeight).toBe(60.5);
    });
  });

  describe('calculatePyramidSets', () => {
    it('generates 3 sets with percentages 60%, 80%, 100% and proper rep targets', () => {
      const sampleExo: ExerciseDefinition = {
        id: 'test_bench',
        name: 'Bench Press',
        category: 'PUSH',
        subGroup: 'CHEST_MID',
        subGroupNameFr: 'Pectoraux',
        targetMuscleFr: 'Pecs',
        defaultMinWeight: 40,
        defaultMaxWeight: 60,
        currentMaxWeight: 60,
        unit: 'kg',
        equipment: 'Barre',
        instructionFr: 'Instruction'
      };

      const sets = StorageService.calculatePyramidSets(sampleExo, 0.5);
      expect(sets.length).toBe(3);

      // Set 1: 60% of 60kg = 36kg, 12 reps
      expect(sets[0].setNumber).toBe(1);
      expect(sets[0].percentage).toBe(60);
      expect(sets[0].calculatedWeight).toBe(36.0);
      expect(sets[0].actualWeight).toBe(36.0);
      expect(sets[0].targetReps).toBe('12 reps');
      expect(sets[0].completed).toBe(false);

      // Set 2: 80% of 60kg = 48kg, 10 reps
      expect(sets[1].setNumber).toBe(2);
      expect(sets[1].percentage).toBe(80);
      expect(sets[1].calculatedWeight).toBe(48.0);
      expect(sets[1].actualWeight).toBe(48.0);
      expect(sets[1].targetReps).toBe('10 reps');
      expect(sets[1].completed).toBe(false);

      // Set 3: 100% of 60kg = 60kg, Max reps
      expect(sets[2].setNumber).toBe(3);
      expect(sets[2].percentage).toBe(100);
      expect(sets[2].calculatedWeight).toBe(60.0);
      expect(sets[2].actualWeight).toBe(60.0);
      expect(sets[2].targetReps).toBe('Max reps');
      expect(sets[2].completed).toBe(false);
    });
  });

  describe('createNewWorkoutState', () => {
    it('builds full exercise session states for PUSH category', () => {
      const pushExercises = StorageService.createNewWorkoutState('PUSH', 0.5);
      expect(pushExercises.length).toBeGreaterThan(0);
      pushExercises.forEach(exo => {
        expect(exo.category).toBe('PUSH');
        expect(exo.sets.length).toBe(3);
        expect(exo.baseMaxWeight).toBeGreaterThan(0);
      });
    });

    it('builds full exercise session states for PULL category', () => {
      const pullExercises = StorageService.createNewWorkoutState('PULL', 0.5);
      expect(pullExercises.length).toBeGreaterThan(0);
      pullExercises.forEach(exo => {
        expect(exo.category).toBe('PULL');
        expect(exo.sets.length).toBe(3);
      });
    });

    it('builds full exercise session states for LEGS category', () => {
      const legsExercises = StorageService.createNewWorkoutState('LEGS', 0.5);
      expect(legsExercises.length).toBeGreaterThan(0);
      legsExercises.forEach(exo => {
        expect(exo.category).toBe('LEGS');
        expect(exo.sets.length).toBe(3);
      });
    });
  });

  describe('getVariantsForExercise', () => {
    it('returns variants targeting the exact same subGroup while excluding the current exercise', () => {
      const variants = StorageService.getVariantsForExercise('CHEST_MID', 'push_developpe_couche');
      expect(variants.length).toBeGreaterThan(0);
      variants.forEach(v => {
        expect(v.subGroup).toBe('CHEST_MID');
        expect(v.id).not.toBe('push_developpe_couche');
      });
    });

    it('returns empty array when no other variants exist for an unknown subGroup', () => {
      const variants = StorageService.getVariantsForExercise('UNKNOWN_SUBGROUP', 'some_id');
      expect(variants).toEqual([]);
    });
  });

  describe('completeWorkout and N+1 load progression', () => {
    it('saves completed workout to history and updates exercise max weights for N+1 when successful', () => {
      const initialExercises = StorageService.getExercises();
      const bench = initialExercises.find(e => e.id === 'push_developpe_couche');
      expect(bench).toBeDefined();
      const initialBenchMax = bench!.currentMaxWeight; // 55kg

      const sampleCompletedWorkout: CompletedWorkout = {
        id: 'workout_123',
        date: new Date().toISOString(),
        category: 'PUSH',
        durationSeconds: 2700,
        totalVolumeKg: 1500,
        exercises: [
          {
            exerciseId: 'push_developpe_couche',
            exerciseName: 'Développé couché',
            category: 'PUSH',
            subGroup: 'CHEST_MID',
            subGroupNameFr: 'Pectoraux',
            baseMaxWeight: initialBenchMax,
            sets: [
              {
                setNumber: 1,
                percentage: 60,
                targetReps: '12 reps',
                actualReps: 12,
                calculatedWeight: 33,
                actualWeight: 33,
                completed: true
              },
              {
                setNumber: 2,
                percentage: 80,
                targetReps: '10 reps',
                actualReps: 10,
                calculatedWeight: 44,
                actualWeight: 44,
                completed: true
              },
              {
                setNumber: 3,
                percentage: 100,
                targetReps: 'Max reps',
                actualReps: 10, // Succeeded with 10 reps on 100%!
                calculatedWeight: 55,
                actualWeight: 55,
                completed: true
              }
            ]
          }
        ]
      };

      StorageService.completeWorkout(sampleCompletedWorkout, {
        ...DEFAULT_SETTINGS,
        autoIncrementWeightOnSuccess: true,
        autoIncrementStepKg: 1.0
      });

      // History must contain the saved workout
      const history = StorageService.getHistory();
      expect(history.length).toBe(1);
      expect(history[0].id).toBe('workout_123');

      // Bench press reference load for N+1 should now be 55 + 1.0 = 56.0 kg
      const updatedExercises = StorageService.getExercises();
      const updatedBench = updatedExercises.find(e => e.id === 'push_developpe_couche');
      expect(updatedBench?.currentMaxWeight).toBe(initialBenchMax + 1.0);
    });
  });

  describe('settings management', () => {
    it('loads default settings and persists updates', () => {
      const settings = StorageService.getSettings();
      expect(settings.defaultRestDuration).toBe(90);
      expect(settings.weightRoundingIncrement).toBe(0.5);

      StorageService.saveSettings({
        ...settings,
        athleteName: 'Alexandre',
        defaultRestDuration: 120
      });

      const updated = StorageService.getSettings();
      expect(updated.athleteName).toBe('Alexandre');
      expect(updated.defaultRestDuration).toBe(120);
    });
  });
});
