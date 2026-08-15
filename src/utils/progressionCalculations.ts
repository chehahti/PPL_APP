import { CompletedWorkout, ExerciseDefinition, MuscleCategory } from '../types/fitness';

export interface MuscleGroupStat {
  id: string;
  name: string;
  category: MuscleCategory;
  avgProgressionPercent: number;
  initialAvgWeight: number;
  currentAvgWeight: number;
  exerciseCount: number;
  exercisesList: {
    name: string;
    initialWeight: number;
    currentWeight: number;
    percent: number;
  }[];
}

export interface ExerciseHistoryPoint {
  date: string;
  maxWeight: number;
  fullDate: string;
}

export interface GlobalStats {
  totalVolume: number;
  totalWorkouts: number;
  pushCount: number;
  pullCount: number;
  legsCount: number;
  cardioCount: number;
}

/**
 * Computes overall stats from workout history
 */
export function computeGlobalStats(history: CompletedWorkout[]): GlobalStats {
  if (!history || !Array.isArray(history)) {
    return { totalVolume: 0, totalWorkouts: 0, pushCount: 0, pullCount: 0, legsCount: 0, cardioCount: 0 };
  }

  const totalVolume = history.reduce((sum, w) => sum + (w.totalVolumeKg || 0), 0);
  const totalWorkouts = history.length;
  const pushCount = history.filter(w => w.category === 'PUSH').length;
  const pullCount = history.filter(w => w.category === 'PULL').length;
  const legsCount = history.filter(w => w.category === 'LEGS').length;
  const cardioCount = history.filter(w => w.category === 'CARDIO' || !!w.cardio?.completed).length;

  return {
    totalVolume: Math.round(totalVolume * 10) / 10,
    totalWorkouts,
    pushCount,
    pullCount,
    legsCount,
    cardioCount
  };
}

/**
 * Extracts date/maxWeight chronological chart data points for an exercise
 */
export function computeExerciseHistoryPoints(
  history: CompletedWorkout[],
  exercise: ExerciseDefinition | undefined
): ExerciseHistoryPoint[] {
  if (!exercise) return [];

  const sortedHistory = [...(history || [])].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const points: ExerciseHistoryPoint[] = [];

  sortedHistory.forEach((w) => {
    const match = w.exercises?.find(e => e.exerciseId === exercise.id);
    if (match) {
      const completedSets = match.sets?.filter(s => s.completed) || [];
      if (completedSets.length > 0) {
        const maxWeight = Math.max(...completedSets.map(s => s.actualWeight));
        const d = new Date(w.date);
        const day = d.getDate();
        const month = d.getMonth() + 1;
        points.push({
          date: `${day}/${month}`,
          maxWeight: maxWeight > 0 ? maxWeight : exercise.currentMaxWeight,
          fullDate: d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
        });
      }
    }
  });

  if (points.length === 0) {
    points.push({
      date: 'Base',
      maxWeight: exercise.currentMaxWeight,
      fullDate: 'Charge de référence actuelle'
    });
  }

  return points;
}

/**
 * Anatomical muscle group definitions and progress computations
 */
export function computeMuscleGroupProgress(
  history: CompletedWorkout[],
  exercises: ExerciseDefinition[]
): MuscleGroupStat[] {
  const sortedHistory = [...(history || [])].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const groups: {
    id: string;
    name: string;
    category: MuscleCategory;
    matcher: (exo: ExerciseDefinition) => boolean;
  }[] = [
    {
      id: 'pecs',
      name: 'Pectoraux',
      category: 'PUSH',
      matcher: (exo) =>
        (exo.subGroup || '').includes('CHEST') ||
        exo.name.toLowerCase().includes('couché') ||
        exo.name.toLowerCase().includes('incliné') ||
        exo.name.toLowerCase().includes('pec') ||
        exo.name.toLowerCase().includes('écarté')
    },
    {
      id: 'dos',
      name: 'Dos & Lats',
      category: 'PULL',
      matcher: (exo) =>
        (exo.subGroup || '').includes('BACK') ||
        exo.name.toLowerCase().includes('tirage') ||
        exo.name.toLowerCase().includes('rowing') ||
        exo.name.toLowerCase().includes('traction')
    },
    {
      id: 'epaules',
      name: 'Épaules (Deltoïdes)',
      category: 'PUSH',
      matcher: (exo) =>
        (exo.subGroup || '').includes('DELT') ||
        exo.name.toLowerCase().includes('élévation') ||
        exo.name.toLowerCase().includes('épaules') ||
        exo.name.toLowerCase().includes('oiseau') ||
        exo.name.toLowerCase().includes('face pull')
    },
    {
      id: 'biceps',
      name: 'Biceps & Avant-bras',
      category: 'PULL',
      matcher: (exo) =>
        (exo.subGroup || '').includes('BICEPS') ||
        exo.name.toLowerCase().includes('curl')
    },
    {
      id: 'triceps',
      name: 'Triceps',
      category: 'PUSH',
      matcher: (exo) =>
        (exo.subGroup || '').includes('TRICEPS') ||
        exo.name.toLowerCase().includes('triceps') ||
        exo.name.toLowerCase().includes('front') ||
        exo.name.toLowerCase().includes('dips')
    },
    {
      id: 'quads',
      name: 'Quadriceps',
      category: 'LEGS',
      matcher: (exo) =>
        (exo.subGroup || '').includes('QUADS') ||
        exo.name.toLowerCase().includes('squat') ||
        exo.name.toLowerCase().includes('presse') ||
        exo.name.toLowerCase().includes('extension') ||
        exo.name.toLowerCase().includes('fentes')
    },
    {
      id: 'ischios_fessiers',
      name: 'Ischios & Fessiers',
      category: 'LEGS',
      matcher: (exo) =>
        (exo.subGroup || '').includes('HAMSTRINGS') ||
        (exo.subGroup || '').includes('POSTERIOR') ||
        exo.name.toLowerCase().includes('terre') ||
        exo.name.toLowerCase().includes('deadlift') ||
        exo.name.toLowerCase().includes('leg curl') ||
        exo.name.toLowerCase().includes('thrust')
    },
    {
      id: 'mollets',
      name: 'Mollets',
      category: 'LEGS',
      matcher: (exo) =>
        (exo.subGroup || '').includes('CALVES') ||
        exo.name.toLowerCase().includes('mollet') ||
        exo.name.toLowerCase().includes('calf')
    }
  ];

  return groups.map((g) => {
    const groupExercises = (exercises || []).filter(g.matcher);
    const exercisesList: {
      name: string;
      initialWeight: number;
      currentWeight: number;
      percent: number;
    }[] = [];

    groupExercises.forEach((exo) => {
      const historyPerformances: number[] = [];
      sortedHistory.forEach((w) => {
        const match = w.exercises?.find((e) => e.exerciseId === exo.id);
        if (match) {
          const completedSets = match.sets?.filter((s) => s.completed) || [];
          if (completedSets.length > 0) {
            const maxVal = Math.max(...completedSets.map((s) => s.actualWeight));
            historyPerformances.push(maxVal);
          }
        }
      });

      let initial = exo.currentMaxWeight;
      let current = exo.currentMaxWeight;
      let percent = 0;

      if (historyPerformances.length === 1) {
        initial = historyPerformances[0];
        current = historyPerformances[0];
        percent = 0;
      } else if (historyPerformances.length >= 2) {
        initial = historyPerformances[0];
        current = historyPerformances[historyPerformances.length - 1];
        const diff = current - initial;
        percent = initial > 0 ? Math.round(((diff) / initial) * 100 * 10) / 10 : 0;
      }

      exercisesList.push({
        name: exo.name,
        initialWeight: initial,
        currentWeight: current,
        percent
      });
    });

    const totalPercent = exercisesList.reduce((sum, e) => sum + e.percent, 0);
    const avgProgressionPercent = exercisesList.length > 0
      ? Math.round((totalPercent / exercisesList.length) * 10) / 10
      : 0;

    const totalInitial = exercisesList.reduce((sum, e) => sum + e.initialWeight, 0);
    const totalCurrent = exercisesList.reduce((sum, e) => sum + e.currentWeight, 0);

    const initialAvgWeight = exercisesList.length > 0 ? Math.round((totalInitial / exercisesList.length) * 10) / 10 : 0;
    const currentAvgWeight = exercisesList.length > 0 ? Math.round((totalCurrent / exercisesList.length) * 10) / 10 : 0;

    return {
      id: g.id,
      name: g.name,
      category: g.category,
      avgProgressionPercent,
      initialAvgWeight,
      currentAvgWeight,
      exerciseCount: exercisesList.length,
      exercisesList
    };
  });
}
