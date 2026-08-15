import { describe, it, expect } from 'vitest';
import {
  computeGlobalStats,
  computeExerciseHistoryPoints,
  computeMuscleGroupProgress
} from './progressionCalculations';
import { CompletedWorkout, ExerciseDefinition } from '../types/fitness';
import { INITIAL_EXERCISES } from '../data/defaultExercises';

describe('progressionCalculations', () => {
  const sampleHistory: CompletedWorkout[] = [
    {
      id: 'w1',
      date: '2026-08-01T10:00:00.000Z',
      category: 'PUSH',
      durationSeconds: 3000,
      totalVolumeKg: 2000,
      exercises: [
        {
          exerciseId: 'push_developpe_couche',
          exerciseName: 'Développé couché',
          category: 'PUSH',
          subGroup: 'CHEST_MID',
          subGroupNameFr: 'Pectoraux',
          baseMaxWeight: 55,
          sets: [
            { setNumber: 1, percentage: 60, targetReps: '12', actualReps: 12, calculatedWeight: 33, actualWeight: 33, completed: true },
            { setNumber: 2, percentage: 80, targetReps: '10', actualReps: 10, calculatedWeight: 44, actualWeight: 44, completed: true },
            { setNumber: 3, percentage: 100, targetReps: 'Max', actualReps: 10, calculatedWeight: 55, actualWeight: 55, completed: true }
          ]
        }
      ]
    },
    {
      id: 'w2',
      date: '2026-08-05T10:00:00.000Z',
      category: 'PUSH',
      durationSeconds: 3200,
      totalVolumeKg: 2200,
      exercises: [
        {
          exerciseId: 'push_developpe_couche',
          exerciseName: 'Développé couché',
          category: 'PUSH',
          subGroup: 'CHEST_MID',
          subGroupNameFr: 'Pectoraux',
          baseMaxWeight: 56,
          sets: [
            { setNumber: 1, percentage: 60, targetReps: '12', actualReps: 12, calculatedWeight: 33.5, actualWeight: 33.5, completed: true },
            { setNumber: 2, percentage: 80, targetReps: '10', actualReps: 10, calculatedWeight: 45, actualWeight: 45, completed: true },
            { setNumber: 3, percentage: 100, targetReps: 'Max', actualReps: 10, calculatedWeight: 56, actualWeight: 60, completed: true }
          ]
        }
      ]
    },
    {
      id: 'w3',
      date: '2026-08-08T10:00:00.000Z',
      category: 'PULL',
      durationSeconds: 2800,
      totalVolumeKg: 1800,
      exercises: []
    }
  ];

  describe('computeGlobalStats', () => {
    it('aggregates total volume, workout count, and category distributions', () => {
      const stats = computeGlobalStats(sampleHistory);
      // Total volume: 2000 + 2200 + 1800 = 6000 kg
      expect(stats.totalVolume).toBe(6000);
      expect(stats.totalWorkouts).toBe(3);
      expect(stats.pushCount).toBe(2);
      expect(stats.pullCount).toBe(1);
      expect(stats.legsCount).toBe(0);
    });

    it('handles empty history gracefully', () => {
      const stats = computeGlobalStats([]);
      expect(stats.totalVolume).toBe(0);
      expect(stats.totalWorkouts).toBe(0);
      expect(stats.pushCount).toBe(0);
    });
  });

  describe('computeExerciseHistoryPoints', () => {
    const benchExo = INITIAL_EXERCISES.find(e => e.id === 'push_developpe_couche')!;

    it('extracts chronological weight data points for an exercise', () => {
      const points = computeExerciseHistoryPoints(sampleHistory, benchExo);
      expect(points.length).toBe(2);
      expect(points[0].maxWeight).toBe(55);
      expect(points[1].maxWeight).toBe(60);
    });

    it('returns a fallback base point when exercise has no workout history', () => {
      const unusedExo: ExerciseDefinition = {
        id: 'unused_exo',
        name: 'Unused Exo',
        category: 'LEGS',
        subGroup: 'LEGS_QUADS',
        subGroupNameFr: 'Quadriceps',
        targetMuscleFr: 'Quads',
        defaultMinWeight: 50,
        defaultMaxWeight: 80,
        currentMaxWeight: 80,
        unit: 'kg',
        equipment: 'Barre',
        instructionFr: 'Descendre à 90°'
      };

      const points = computeExerciseHistoryPoints(sampleHistory, unusedExo);
      expect(points.length).toBe(1);
      expect(points[0].date).toBe('Base');
      expect(points[0].maxWeight).toBe(80);
    });
  });

  describe('computeMuscleGroupProgress', () => {
    it('computes progression percentages across anatomical muscle groups', () => {
      const muscleStats = computeMuscleGroupProgress(sampleHistory, INITIAL_EXERCISES);
      expect(muscleStats.length).toBeGreaterThan(0);

      const pecsGroup = muscleStats.find(g => g.id === 'pecs');
      expect(pecsGroup).toBeDefined();
      expect(pecsGroup?.category).toBe('PUSH');
      expect(pecsGroup?.exerciseCount).toBeGreaterThan(0);

      // Bench press progressed from 55kg to 60kg -> diff = 5kg / 55kg = +9.1%
      const benchItem = pecsGroup?.exercisesList.find(e => e.name.includes('couché'));
      expect(benchItem).toBeDefined();
      expect(benchItem?.initialWeight).toBe(55);
      expect(benchItem?.currentWeight).toBe(60);
      expect(benchItem?.percent).toBe(9.1);
    });
  });
});
