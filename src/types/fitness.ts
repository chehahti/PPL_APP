export type MuscleCategory = 'PULL' | 'PUSH' | 'LEGS' | 'CARDIO';

export type MuscleSubGroup = 
  // PUSH
  | 'CHEST_MID' // Pectoraux moyens / sternal
  | 'CHEST_UPPER' // Pectoraux haut / claviculaire
  | 'DELT_FRONT' // Épaules faisceau antérieur
  | 'DELT_LATERAL' // Épaules faisceau latéral
  | 'TRICEPS_GENERAL' // Triceps chefs latéral/médial
  | 'TRICEPS_LONG_HEAD' // Triceps chef long
  // PULL
  | 'BACK_LATS' // Grand dorsal (largeur / tirage vertical)
  | 'BACK_THICKNESS' // Rhomboïdes / trapèzes moyens (tirage horizontal)
  | 'DELT_REAR' // Deltoïde postérieur (arrière d'épaule)
  | 'BICEPS_BRACHIAL' // Biceps brachial
  | 'BICEPS_BRACHIORADIALIS' // Brachio-radial (long supinateur / prise marteau)
  // LEGS
  | 'LEGS_QUADS' // Quadriceps
  | 'LEGS_HAMSTRINGS' // Ischio-jambiers
  | 'LEGS_POSTERIOR_CHAIN' // Chaîne postérieure / Fessiers & Ischios
  | 'LEGS_CALVES' // Mollets
  // CARDIO
  | 'CARDIO_INCLINE'
  // CUSTOM
  | 'CUSTOM_EXO';

export interface ExerciseDefinition {
  id: string;
  name: string;
  category: MuscleCategory;
  subGroup: MuscleSubGroup;
  subGroupNameFr: string;
  targetMuscleFr: string;
  defaultMinWeight: number;
  defaultMaxWeight: number;
  currentMaxWeight: number; // The 100% reference load
  unit: 'kg' | 'lbs';
  equipment: string;
  description?: string;
  instructionFr: string;
  isCustom?: boolean;
}

export interface SetRecord {
  setNumber: 1 | 2 | 3;
  percentage: number; // 60%, 80%, 100%
  targetReps: string; // '12', '10', 'Max reps'
  actualReps: number;
  calculatedWeight: number;
  actualWeight: number;
  completed: boolean;
}

export interface ExerciseSessionState {
  exerciseId: string;
  exerciseName: string;
  category: MuscleCategory;
  subGroup: MuscleSubGroup;
  subGroupNameFr: string;
  targetMuscleFr?: string;
  equipment?: string;
  instructionFr?: string;
  baseMaxWeight: number;
  sets: [SetRecord, SetRecord, SetRecord];
  replacedFromId?: string;
  notes?: string;
}

export interface CardioSessionState {
  id: string;
  name: string;
  durationMinutes: number;
  distanceKm: number;
  inclinePercentage: number;
  speedKmh: number;
  caloriesBurned?: number;
  completed: boolean;
  notes?: string;
  imageUrl?: string;
}

export interface CompletedWorkout {
  id: string;
  date: string; // ISO string
  category: MuscleCategory;
  durationSeconds: number;
  exercises: ExerciseSessionState[];
  cardio?: CardioSessionState;
  totalVolumeKg: number;
  notes?: string;
}

export interface ExerciseProgressPoint {
  date: string;
  weight: number;
  reps: number;
  estimated1RM: number;
  workoutId: string;
}

export interface AppSettings {
  athleteName?: string;
  athleteWeight?: number;
  defaultRestDuration: number; // 90 for 1m30, 120 for 2m
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  weightRoundingIncrement: number; // e.g., 0.5, 1.0, 2.5
  weightUnit: 'kg' | 'lbs';
  autoIncrementWeightOnSuccess: boolean;
  autoIncrementStepKg: number;
}
