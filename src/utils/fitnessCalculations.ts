import { ExerciseSessionState, SetRecord } from '../types/fitness';

/**
 * Rounds a weight value to the nearest increment (e.g. 0.5kg, 1.0kg, 2.5kg).
 * Handles JavaScript floating-point precision quirks safely.
 */
export function roundWeight(value: number, increment = 0.5): number {
  if (value <= 0 || isNaN(value)) return 0;
  const safeIncrement = increment > 0 ? increment : 0.5;
  const inv = 1 / safeIncrement;
  return Math.round((value + Number.EPSILON) * inv) / inv;
}

/**
 * Calculates the 3 pyramidal weights for an exercise:
 * - Série 1 (60%): 12 reps
 * - Série 2 (80%): 10 reps
 * - Série 3 (100%): Max reps (référence)
 */
export function calculatePyramidWeights(maxWeight: number, increment = 0.5): {
  set1Weight: number;
  set2Weight: number;
  set3Weight: number;
} {
  const cleanMax = Math.max(0, maxWeight || 0);
  return {
    set1Weight: roundWeight(cleanMax * 0.60, increment),
    set2Weight: roundWeight(cleanMax * 0.80, increment),
    set3Weight: roundWeight(cleanMax * 1.00, increment),
  };
}

/**
 * Calculates the estimated 1RM (One-Rep Max) using the standard Epley formula:
 * 1RM = Weight * (1 + Reps / 30)
 * If reps === 1, returns the exact weight.
 * If weight <= 0 or reps <= 0, returns 0.
 */
export function calculateEstimated1RM(weight: number, reps: number): number {
  if (weight <= 0 || reps <= 0) return 0;
  if (reps === 1) return weight;
  const epley = weight * (1 + reps / 30);
  return Math.round(epley * 10) / 10;
}

/**
 * Calculates the total training volume / tonnage in kg for all completed sets.
 * Volume = SUM(actualWeight * actualReps) for every completed set.
 */
export function calculateTotalVolume(exercises: ExerciseSessionState[]): number {
  if (!exercises || !Array.isArray(exercises)) return 0;
  
  let total = 0;
  for (const exo of exercises) {
    if (!exo.sets || !Array.isArray(exo.sets)) continue;
    for (const s of exo.sets) {
      if (s.completed && s.actualWeight > 0 && s.actualReps > 0) {
        total += s.actualWeight * s.actualReps;
      }
    }
  }
  return Math.round(total * 10) / 10;
}

/**
 * Estimates calories burned during incline treadmill walking / running
 * based on the ACSM metabolic equation for walking/running:
 * MET calculation includes incline work component.
 */
export function calculateCardioCalories(params: {
  weightKg?: number;
  durationMinutes: number;
  speedKmh: number;
  inclinePercentage: number;
}): number {
  const { weightKg = 75, durationMinutes, speedKmh, inclinePercentage } = params;
  if (durationMinutes <= 0 || speedKmh <= 0) return 0;

  // Speed in m/min = speed in km/h * (1000 / 60)
  const speedMMin = speedKmh * (1000 / 60);
  const grade = Math.max(0, inclinePercentage) / 100;

  // ACSM Walking VO2 (ml/kg/min) = (0.1 * speed) + (1.8 * speed * grade) + 3.5
  const vo2 = (0.1 * speedMMin) + (1.8 * speedMMin * grade) + 3.5;
  
  // METs = VO2 / 3.5
  const mets = vo2 / 3.5;

  // Calories = METs * 3.5 * weightKg / 200 * durationMinutes
  const totalKcal = (mets * 3.5 * Math.max(30, weightKg) / 200) * durationMinutes;
  return Math.round(totalKcal);
}

/**
 * Calculates the percentage progression between an initial value and a current value.
 * Handles zero and boundary cases safely.
 */
export function calculateProgressPercentage(initialVal: number, currentVal: number): number {
  if (initialVal <= 0) {
    return currentVal > 0 ? 100 : 0;
  }
  const delta = currentVal - initialVal;
  return Math.round((delta / initialVal) * 1000) / 10;
}

/**
 * Evaluates the new 100% max reference weight for the subsequent workout (Séance N+1).
 * If set 3 was completed with >= 10 reps and autoIncrement is enabled,
 * it increments the reference load by the step (e.g. +1.0kg).
 */
export function determineNextSessionMaxWeight(
  set3: SetRecord,
  baseMaxWeight: number,
  options: {
    autoIncrementWeightOnSuccess: boolean;
    autoIncrementStepKg?: number;
  }
): number {
  if (!set3 || !set3.completed) {
    return baseMaxWeight;
  }

  let nextWeight = set3.actualWeight;

  if (options.autoIncrementWeightOnSuccess && set3.actualReps >= 10) {
    const step = options.autoIncrementStepKg ?? 1.0;
    nextWeight += step;
  }

  return Math.max(0.5, Math.round(nextWeight * 2) / 2);
}
