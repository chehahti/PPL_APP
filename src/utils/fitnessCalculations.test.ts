import { describe, it, expect } from 'vitest';
import {
  roundWeight,
  calculatePyramidWeights,
  calculateEstimated1RM,
  calculateTotalVolume,
  calculateCardioCalories,
  calculateProgressPercentage,
  determineNextSessionMaxWeight
} from './fitnessCalculations';
import { ExerciseSessionState, SetRecord } from '../types/fitness';

describe('fitnessCalculations', () => {
  describe('roundWeight', () => {
    it('rounds to default increment of 0.5 kg', () => {
      expect(roundWeight(14.2)).toBe(14.0);
      expect(roundWeight(14.3)).toBe(14.5);
      expect(roundWeight(14.74)).toBe(14.5);
      expect(roundWeight(14.76)).toBe(15.0);
      expect(roundWeight(65.0)).toBe(65.0);
    });

    it('rounds to 1.0 kg increment', () => {
      expect(roundWeight(14.4, 1.0)).toBe(14.0);
      expect(roundWeight(14.6, 1.0)).toBe(15.0);
      expect(roundWeight(52.8, 1.0)).toBe(53.0);
    });

    it('rounds to 2.5 kg increment (Olympic plates)', () => {
      expect(roundWeight(52.0, 2.5)).toBe(52.5);
      expect(roundWeight(51.0, 2.5)).toBe(50.0);
      expect(roundWeight(53.8, 2.5)).toBe(55.0);
      expect(roundWeight(73.0, 2.5)).toBe(72.5);
    });

    it('handles zero, negative, and NaN safely', () => {
      expect(roundWeight(0)).toBe(0);
      expect(roundWeight(-5)).toBe(0);
      expect(roundWeight(NaN)).toBe(0);
    });
  });

  describe('calculatePyramidWeights', () => {
    it('calculates exact 60%, 80%, 100% weights for Développé Couché (55 kg)', () => {
      const weights = calculatePyramidWeights(55, 0.5);
      // 55 * 0.6 = 33.0 kg
      // 55 * 0.8 = 44.0 kg
      // 55 * 1.0 = 55.0 kg
      expect(weights.set1Weight).toBe(33.0);
      expect(weights.set2Weight).toBe(44.0);
      expect(weights.set3Weight).toBe(55.0);
    });

    it('calculates weights for Tirage Vertical (65 kg)', () => {
      const weights = calculatePyramidWeights(65, 0.5);
      // 65 * 0.6 = 39.0 kg
      // 65 * 0.8 = 52.0 kg
      // 65 * 1.0 = 65.0 kg
      expect(weights.set1Weight).toBe(39.0);
      expect(weights.set2Weight).toBe(52.0);
      expect(weights.set3Weight).toBe(65.0);
    });

    it('calculates weights for Curl Biceps (14 kg)', () => {
      const weights = calculatePyramidWeights(14, 0.5);
      // 14 * 0.6 = 8.4 -> rounded 8.5 kg
      // 14 * 0.8 = 11.2 -> rounded 11.0 kg
      // 14 * 1.0 = 14.0 kg
      expect(weights.set1Weight).toBe(8.5);
      expect(weights.set2Weight).toBe(11.0);
      expect(weights.set3Weight).toBe(14.0);
    });

    it('handles 0 or invalid max weight gracefully', () => {
      const weights = calculatePyramidWeights(0, 0.5);
      expect(weights.set1Weight).toBe(0);
      expect(weights.set2Weight).toBe(0);
      expect(weights.set3Weight).toBe(0);
    });
  });

  describe('calculateEstimated1RM', () => {
    it('calculates Epley 1RM formula accurately', () => {
      // 100 kg for 10 reps -> 100 * (1 + 10/30) = 133.3 kg
      expect(calculateEstimated1RM(100, 10)).toBe(133.3);
      // 80 kg for 8 reps -> 80 * (1 + 8/30) = 101.3 kg
      expect(calculateEstimated1RM(80, 8)).toBe(101.3);
    });

    it('returns exact weight for 1 rep', () => {
      expect(calculateEstimated1RM(90, 1)).toBe(90);
    });

    it('returns 0 for non-positive values', () => {
      expect(calculateEstimated1RM(0, 10)).toBe(0);
      expect(calculateEstimated1RM(100, 0)).toBe(0);
      expect(calculateEstimated1RM(-50, 5)).toBe(0);
    });
  });

  describe('calculateTotalVolume', () => {
    it('calculates total tonnage only for completed sets', () => {
      const sampleExercises: ExerciseSessionState[] = [
        {
          exerciseId: 'exo1',
          exerciseName: 'Développé couché',
          category: 'PUSH',
          subGroup: 'CHEST_MID',
          subGroupNameFr: 'Pectoraux',
          baseMaxWeight: 55,
          sets: [
            {
              setNumber: 1,
              percentage: 60,
              targetReps: '12 reps',
              actualReps: 12,
              calculatedWeight: 33,
              actualWeight: 33,
              completed: true // 33 * 12 = 396
            },
            {
              setNumber: 2,
              percentage: 80,
              targetReps: '10 reps',
              actualReps: 10,
              calculatedWeight: 44,
              actualWeight: 44,
              completed: true // 44 * 10 = 440
            },
            {
              setNumber: 3,
              percentage: 100,
              targetReps: 'Max reps',
              actualReps: 8,
              calculatedWeight: 55,
              actualWeight: 55,
              completed: false // Not completed -> omitted
            }
          ]
        },
        {
          exerciseId: 'exo2',
          exerciseName: 'Élévations latérales',
          category: 'PUSH',
          subGroup: 'DELT_LATERAL',
          subGroupNameFr: 'Épaules',
          baseMaxWeight: 10,
          sets: [
            {
              setNumber: 1,
              percentage: 60,
              targetReps: '12 reps',
              actualReps: 12,
              calculatedWeight: 6,
              actualWeight: 6,
              completed: true // 6 * 12 = 72
            },
            {
              setNumber: 2,
              percentage: 80,
              targetReps: '10 reps',
              actualReps: 10,
              calculatedWeight: 8,
              actualWeight: 8,
              completed: false // omitted
            },
            {
              setNumber: 3,
              percentage: 100,
              targetReps: 'Max reps',
              actualReps: 10,
              calculatedWeight: 10,
              actualWeight: 10,
              completed: true // 10 * 10 = 100
            }
          ]
        }
      ];

      // Total expected = 396 + 440 + 72 + 100 = 1008 kg
      expect(calculateTotalVolume(sampleExercises)).toBe(1008);
    });

    it('returns 0 when no sets are completed or empty array', () => {
      expect(calculateTotalVolume([])).toBe(0);
    });
  });

  describe('calculateCardioCalories', () => {
    it('estimates calories for incline walking session', () => {
      const kcal = calculateCardioCalories({
        weightKg: 75,
        durationMinutes: 25,
        speedKmh: 5.2,
        inclinePercentage: 10
      });

      // For 25 min at 5.2 km/h, 10% incline for 75kg person, calories should be around ~210-260 kcal
      expect(kcal).toBeGreaterThan(180);
      expect(kcal).toBeLessThanOrEqual(280);
    });

    it('returns 0 if duration or speed is 0', () => {
      expect(calculateCardioCalories({ weightKg: 75, durationMinutes: 0, speedKmh: 5, inclinePercentage: 10 })).toBe(0);
      expect(calculateCardioCalories({ weightKg: 75, durationMinutes: 20, speedKmh: 0, inclinePercentage: 10 })).toBe(0);
    });
  });

  describe('calculateProgressPercentage', () => {
    it('calculates positive and negative deltas correctly', () => {
      expect(calculateProgressPercentage(50, 55)).toBe(10); // +10%
      expect(calculateProgressPercentage(50, 60)).toBe(20); // +20%
      expect(calculateProgressPercentage(50, 45)).toBe(-10); // -10%
      expect(calculateProgressPercentage(50, 50)).toBe(0); // 0%
    });

    it('handles zero initial value safely', () => {
      expect(calculateProgressPercentage(0, 50)).toBe(100);
      expect(calculateProgressPercentage(0, 0)).toBe(0);
    });
  });

  describe('determineNextSessionMaxWeight', () => {
    const baseSet3: SetRecord = {
      setNumber: 3,
      percentage: 100,
      targetReps: 'Max reps',
      actualReps: 10,
      calculatedWeight: 55,
      actualWeight: 55,
      completed: true
    };

    it('increments weight when set 3 is completed with >= 10 reps and autoIncrement is true', () => {
      const nextMax = determineNextSessionMaxWeight(
        { ...baseSet3, actualReps: 10, actualWeight: 55 },
        55,
        { autoIncrementWeightOnSuccess: true, autoIncrementStepKg: 1.0 }
      );
      expect(nextMax).toBe(56.0); // 55 + 1.0
    });

    it('supports custom step increments (e.g. 2.5 kg)', () => {
      const nextMax = determineNextSessionMaxWeight(
        { ...baseSet3, actualReps: 12, actualWeight: 70 },
        70,
        { autoIncrementWeightOnSuccess: true, autoIncrementStepKg: 2.5 }
      );
      expect(nextMax).toBe(72.5); // 70 + 2.5
    });

    it('does not increment if actual reps < 10, keeps actual weight achieved', () => {
      const nextMax = determineNextSessionMaxWeight(
        { ...baseSet3, actualReps: 8, actualWeight: 55 },
        55,
        { autoIncrementWeightOnSuccess: true, autoIncrementStepKg: 1.0 }
      );
      expect(nextMax).toBe(55.0);
    });

    it('does not increment if autoIncrement is disabled', () => {
      const nextMax = determineNextSessionMaxWeight(
        { ...baseSet3, actualReps: 12, actualWeight: 55 },
        55,
        { autoIncrementWeightOnSuccess: false }
      );
      expect(nextMax).toBe(55.0);
    });

    it('returns baseMaxWeight if set3 was not completed', () => {
      const nextMax = determineNextSessionMaxWeight(
        { ...baseSet3, completed: false },
        55,
        { autoIncrementWeightOnSuccess: true }
      );
      expect(nextMax).toBe(55);
    });
  });
});
