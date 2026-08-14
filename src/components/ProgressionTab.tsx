import React, { useState, useMemo } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Area,
  AreaChart,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  Award, 
  Calendar, 
  Dumbbell, 
  ChevronRight, 
  Flame, 
  Activity,
  Filter,
  BarChart3,
  Layers,
  Sparkles,
  ArrowUpRight
} from 'lucide-react';
import { CompletedWorkout, MuscleCategory, ExerciseDefinition } from '../types/fitness';
import { StorageService } from '../services/storageService';

interface ProgressionTabProps {
  history: CompletedWorkout[];
  exercises: ExerciseDefinition[];
}

interface MuscleGroupStat {
  id: string;
  name: string;
  category: MuscleCategory;
  color: string;
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

export const ProgressionTab: React.FC<ProgressionTabProps> = ({
  history,
  exercises
}) => {
  const [selectedCategory, setSelectedCategory] = useState<MuscleCategory | 'ALL'>('ALL');
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>(
    exercises[0]?.id || 'push_developpe_couche'
  );

  // Selected muscle group for inspection
  const [selectedMuscleGroupId, setSelectedMuscleGroupId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'progression' | 'category'>('progression');

  // Calculate average progression percentage per muscle group based STRICTLY on real history
  const muscleProgressionData = useMemo<MuscleGroupStat[]>(() => {
    const sortedHistory = [...history].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Group definitions
    const groups: {
      id: string;
      name: string;
      category: MuscleCategory;
      color: string;
      matcher: (exo: ExerciseDefinition) => boolean;
    }[] = [
      {
        id: 'pecs',
        name: 'Pectoraux',
        category: 'PUSH',
        color: '#A3FF12', // Neon Lime
        matcher: (exo) => (exo.subGroup || '').includes('CHEST') || exo.name.toLowerCase().includes('couché') || exo.name.toLowerCase().includes('incliné') || exo.name.toLowerCase().includes('pec') || exo.name.toLowerCase().includes('écarté')
      },
      {
        id: 'dos',
        name: 'Dos & Lats',
        category: 'PULL',
        color: '#38bdf8', // Sky blue
        matcher: (exo) => (exo.subGroup || '').includes('BACK') || exo.name.toLowerCase().includes('tirage') || exo.name.toLowerCase().includes('rowing') || exo.name.toLowerCase().includes('traction')
      },
      {
        id: 'epaules',
        name: 'Épaules (Deltoïdes)',
        category: 'PUSH',
        color: '#fb923c', // Amber / Orange
        matcher: (exo) => (exo.subGroup || '').includes('DELT') || exo.name.toLowerCase().includes('élévation') || exo.name.toLowerCase().includes('épaules') || exo.name.toLowerCase().includes('oiseau') || exo.name.toLowerCase().includes('face pull')
      },
      {
        id: 'biceps',
        name: 'Biceps & Avant-bras',
        category: 'PULL',
        color: '#a78bfa', // Violet
        matcher: (exo) => (exo.subGroup || '').includes('BICEPS') || exo.name.toLowerCase().includes('curl')
      },
      {
        id: 'triceps',
        name: 'Triceps',
        category: 'PUSH',
        color: '#f43f5e', // Rose
        matcher: (exo) => (exo.subGroup || '').includes('TRICEPS') || exo.name.toLowerCase().includes('triceps') || exo.name.toLowerCase().includes('front') || exo.name.toLowerCase().includes('dips')
      },
      {
        id: 'quads',
        name: 'Quadriceps',
        category: 'LEGS',
        color: '#34d399', // Emerald
        matcher: (exo) => (exo.subGroup || '').includes('QUADS') || exo.name.toLowerCase().includes('squat') || exo.name.toLowerCase().includes('presse') || exo.name.toLowerCase().includes('extension') || exo.name.toLowerCase().includes('fentes')
      },
      {
        id: 'ischios_fessiers',
        name: 'Ischios & Chaîne post.',
        category: 'LEGS',
        color: '#facc15', // Yellow
        matcher: (exo) => (exo.subGroup || '').includes('HAMSTRINGS') || (exo.subGroup || '').includes('POSTERIOR') || exo.name.toLowerCase().includes('terre') || exo.name.toLowerCase().includes('deadlift') || exo.name.toLowerCase().includes('leg curl') || exo.name.toLowerCase().includes('thrust')
      }
    ];

    const result = groups.map((g) => {
      const groupExercises = exercises.filter(g.matcher);
      const exercisesList: {
        name: string;
        initialWeight: number;
        currentWeight: number;
        percent: number;
      }[] = [];

      groupExercises.forEach((exo) => {
        // Collect recorded performances from completed real workouts
        const historyPerformances: number[] = [];
        sortedHistory.forEach((w) => {
          const match = w.exercises.find((e) => e.exerciseId === exo.id);
          if (match) {
            const completedSets = match.sets.filter((s) => s.completed);
            if (completedSets.length > 0) {
              const maxVal = Math.max(...completedSets.map((s) => s.actualWeight));
              historyPerformances.push(maxVal);
            }
          }
        });

        // Determine baseline vs progression:
        // If 0 workouts: initial = currentMaxWeight, current = currentMaxWeight, percent = 0%
        // If 1 workout: initial = 1st workout weight, current = 1st workout weight, percent = 0% (baseline established)
        // If >= 2 workouts: real gain from 1st workout to latest workout
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
        color: g.color,
        avgProgressionPercent,
        initialAvgWeight,
        currentAvgWeight,
        exerciseCount: exercisesList.length,
        exercisesList
      };
    });

    return result;
  }, [history, exercises]);

  // Sorted muscle progression list
  const sortedMuscleProgression = useMemo(() => {
    const list = [...muscleProgressionData];
    if (sortBy === 'progression') {
      return list.sort((a, b) => b.avgProgressionPercent - a.avgProgressionPercent);
    }
    return list;
  }, [muscleProgressionData, sortBy]);

  // Active muscle group details
  const activeMuscleGroup = useMemo(() => {
    if (!selectedMuscleGroupId) return null;
    return muscleProgressionData.find((m) => m.id === selectedMuscleGroupId) || null;
  }, [muscleProgressionData, selectedMuscleGroupId]);

  // Overall average progression across all muscles
  const overallAverageGain = useMemo(() => {
    if (history.length === 0 || muscleProgressionData.length === 0) return 0;
    const sum = muscleProgressionData.reduce((acc, m) => acc + m.avgProgressionPercent, 0);
    return Math.round((sum / muscleProgressionData.length) * 10) / 10;
  }, [history.length, muscleProgressionData]);

  // Filtered exercises for dropdown
  const filteredExercises = useMemo(() => {
    if (selectedCategory === 'ALL') return exercises;
    return exercises.filter(e => e.category === selectedCategory);
  }, [exercises, selectedCategory]);

  const selectedExercise = useMemo(() => {
    return exercises.find(e => e.id === selectedExerciseId) || exercises[0];
  }, [exercises, selectedExerciseId]);

  // Extract chart data points for the selected exercise across workout history
  const chartData = useMemo(() => {
    if (!selectedExercise) return [];

    // Chronological order (oldest first for chart)
    const sortedHistory = [...history].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const points: { date: string; fullDate: string; maxWeight: number; reps: number; volume: number }[] = [];

    sortedHistory.forEach(workout => {
      const match = workout.exercises.find(e => e.exerciseId === selectedExercise.id);
      if (match) {
        const set3 = match.sets[2];
        const completedSets = match.sets.filter(s => s.completed);
        if (completedSets.length > 0) {
          const maxVal = Math.max(...completedSets.map(s => s.actualWeight));
          const repsVal = set3 && set3.completed ? set3.actualReps : completedSets[completedSets.length - 1].actualReps;
          const volumeVal = match.sets.reduce(
            (sum, s) => s.completed ? sum + (s.actualWeight * s.actualReps) : sum,
            0
          );

          const d = new Date(workout.date);
          const dateLabel = `${d.getDate()}/${d.getMonth() + 1}`;

          points.push({
            date: dateLabel,
            fullDate: d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }),
            maxWeight: maxVal,
            reps: repsVal,
            volume: volumeVal
          });
        }
      }
    });

    // If no real historical sessions recorded yet, show single baseline point at 0 diff
    if (points.length === 0 && selectedExercise) {
      points.push({
        date: 'Départ',
        fullDate: 'Base initiale',
        maxWeight: selectedExercise.currentMaxWeight,
        reps: 8,
        volume: 0
      });
    }

    return points;
  }, [history, selectedExercise]);

  // Personal Record & Progression Stats
  const stats = useMemo(() => {
    if (chartData.length <= 1) {
      return {
        pr: selectedExercise?.currentMaxWeight || 0,
        initial: selectedExercise?.currentMaxWeight || 0,
        diff: 0,
        percent: 0
      };
    }
    const weights = chartData.map(p => p.maxWeight);
    const pr = Math.max(...weights);
    const initial = weights[0];
    const diff = Math.round((pr - initial) * 10) / 10;
    const percent = initial > 0 ? Math.round((diff / initial) * 100) : 0;

    return { pr, initial, diff, percent };
  }, [chartData, selectedExercise]);

  // Total global stats
  const globalStats = useMemo(() => {
    const totalVolume = history.reduce((sum, w) => sum + w.totalVolumeKg, 0);
    const totalWorkouts = history.length;
    return { totalVolume, totalWorkouts };
  }, [history]);

  return (
    <div id="progression-tab-container" className="pb-28 pt-2 space-y-4">
      {/* Bento Header */}
      <div className="flex justify-between items-end px-1 pt-1">
        <div className="flex flex-col">
          <span className="text-[#A3FF12] text-xs font-bold tracking-widest uppercase flex items-center gap-1.5">
            Analytique & Stats
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#F5F5F5]">
            PROGRESSION
          </h1>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-zinc-500 block uppercase font-bold tracking-wider">Séances</span>
          <span className="text-lg font-mono font-bold text-[#F5F5F5]">
            {globalStats.totalWorkouts} faites
          </span>
        </div>
      </div>

      {/* Top Global Bento Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-[#1A1A1A] border border-[#262626] rounded-3xl p-4 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
            <span>Séances</span>
            <Activity className="w-3.5 h-3.5 text-[#A3FF12]" />
          </div>
          <div className="text-2xl font-extrabold text-[#F5F5F5] font-mono mt-2">
            {globalStats.totalWorkouts}
          </div>
          <span className="text-[10px] text-zinc-500 mt-1">Total enregistré</span>
        </div>

        <div className="bg-[#1A1A1A] border border-[#262626] rounded-3xl p-4 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
            <span>Volume Total</span>
            <Flame className="w-3.5 h-3.5 text-[#A3FF12]" />
          </div>
          <div className="text-2xl font-extrabold text-[#A3FF12] font-mono mt-2">
            {globalStats.totalVolume > 1000 ? `${(globalStats.totalVolume / 1000).toFixed(1)} t` : `${globalStats.totalVolume} kg`}
          </div>
          <span className="text-[10px] text-zinc-500 mt-1">Cumulé sur le PPL</span>
        </div>

        <div className="col-span-2 sm:col-span-1 bg-[#1A1A1A] border border-[#262626] rounded-3xl p-4 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
            <span>Progression Moyenne</span>
            <Award className="w-3.5 h-3.5 text-[#A3FF12]" />
          </div>
          <div className="text-2xl font-extrabold text-[#A3FF12] font-mono mt-2">
            {overallAverageGain >= 0 ? `+${overallAverageGain}%` : `${overallAverageGain}%`}
          </div>
          <span className="text-[10px] text-zinc-500 mt-1">Tous muscles confondus</span>
        </div>
      </div>

      {/* ================= NOUVEAU : GRAPHIQUE PROGRESSION PAR GROUPE MUSCULAIRE ================= */}
      <div id="muscle-progression-card" className="bg-[#1A1A1A] border border-[#262626] rounded-3xl p-5 shadow-xl space-y-4">
        {/* Card Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#262626]">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[#A3FF12]" />
              <h3 className="font-bold text-lg text-[#F5F5F5] tracking-tight">
                Moyenne de Progression par Muscle
              </h3>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Comparatif du gain de force moyen (%) par zone anatomique
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSortBy(sortBy === 'progression' ? 'category' : 'progression')}
              className="text-[11px] font-bold px-3 py-1.5 rounded-xl bg-[#222222] hover:bg-[#282828] border border-zinc-700 text-zinc-300 transition-colors flex items-center gap-1.5"
            >
              <Filter className="w-3 h-3 text-[#A3FF12]" />
              <span>Trier : {sortBy === 'progression' ? '% Décroissant' : 'Par Catégorie'}</span>
            </button>
          </div>
        </div>

        {/* Recharts Bar Chart - Progression % par Muscle */}
        <div className="h-64 sm:h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={sortedMuscleProgression}
              margin={{ top: 20, right: 10, left: -20, bottom: 25 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
              <XAxis
                dataKey="name"
                stroke="#a1a1aa"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#262626' }}
                interval={0}
                angle={-20}
                textAnchor="end"
              />
              <YAxis
                stroke="#71717a"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#262626' }}
                unit="%"
              />
              <Tooltip
                cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                contentStyle={{
                  backgroundColor: '#121212',
                  borderColor: '#262626',
                  borderRadius: '1rem',
                  fontSize: '12px',
                  color: '#F5F5F5',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.8)'
                }}
                formatter={(value: any, name: any, item: any) => {
                  const stat = item?.payload as MuscleGroupStat;
                  return [
                    `+${value}% (Moy. ${stat?.currentAvgWeight} kg vs ${stat?.initialAvgWeight} kg)`,
                    'Progression Moyenne'
                  ];
                }}
              />
              <Bar 
                dataKey="avgProgressionPercent" 
                radius={[8, 8, 0, 0]}
                onClick={(entry) => setSelectedMuscleGroupId(selectedMuscleGroupId === entry.id ? null : entry.id)}
                className="cursor-pointer"
              >
                {sortedMuscleProgression.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color} 
                    opacity={selectedMuscleGroupId && selectedMuscleGroupId !== entry.id ? 0.4 : 1}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Interactive Muscle Group Cards Bento Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-2">
          {sortedMuscleProgression.map((m) => {
            const isSelected = selectedMuscleGroupId === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setSelectedMuscleGroupId(isSelected ? null : m.id)}
                className={`p-3.5 rounded-2xl border text-left transition-all ${
                  isSelected 
                    ? 'bg-[#262626] border-[#A3FF12] ring-1 ring-[#A3FF12]/30 shadow-lg' 
                    : 'bg-[#202020] hover:bg-[#242424] border-[#2d2d2d]'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span 
                      className="w-2.5 h-2.5 rounded-full" 
                      style={{ backgroundColor: m.color }}
                    />
                    <span className="text-xs font-bold text-[#F5F5F5]">
                      {m.name}
                    </span>
                  </div>
                  <span className={`text-xs font-black px-2 py-0.5 rounded-lg border font-mono ${
                    m.avgProgressionPercent > 0 
                      ? 'bg-[#A3FF12]/10 text-[#A3FF12] border-[#A3FF12]/30' 
                      : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                  }`}>
                    {m.avgProgressionPercent >= 0 ? `+${m.avgProgressionPercent}%` : `${m.avgProgressionPercent}%`}
                  </span>
                </div>

                {/* Progress Mini Bar */}
                <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden my-2">
                  <div 
                    className="h-full rounded-full transition-all duration-500"
                    style={{ 
                      width: `${Math.min(Math.max(m.avgProgressionPercent * 3, 8), 100)}%`,
                      backgroundColor: m.color 
                    }}
                  />
                </div>

                <div className="flex items-center justify-between text-[10px] text-zinc-400">
                  <span>{m.exerciseCount} exercices</span>
                  <span className="font-mono text-zinc-300">
                    {m.initialAvgWeight}kg → <strong className="text-[#F5F5F5]">{m.currentAvgWeight}kg</strong>
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Muscle Group Drilldown Details */}
        {activeMuscleGroup && (
          <div className="p-4 bg-[#141414] rounded-2xl border border-zinc-800 space-y-3 mt-2 animate-fadeIn">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <span 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: activeMuscleGroup.color }}
                />
                <span className="text-xs font-bold text-[#F5F5F5] uppercase tracking-wider">
                  Détail : {activeMuscleGroup.name}
                </span>
              </div>
              <span className="text-xs font-mono font-bold text-[#A3FF12]">
                Moyenne : +{activeMuscleGroup.avgProgressionPercent}%
              </span>
            </div>

            <div className="space-y-2">
              {activeMuscleGroup.exercisesList.map((exo, idx) => (
                <div 
                  key={idx} 
                  className="flex items-center justify-between p-2.5 bg-[#1F1F1F] rounded-xl border border-zinc-800/80 text-xs"
                >
                  <span className="text-zinc-200 font-medium">{exo.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-zinc-400 text-[11px]">
                      {exo.initialWeight}kg → <strong className="text-[#F5F5F5] font-bold">{exo.currentWeight}kg</strong>
                    </span>
                    <span className={`font-mono text-[11px] font-bold px-2 py-0.5 rounded-md ${
                      exo.percent > 0 
                        ? 'bg-[#A3FF12]/15 text-[#A3FF12]' 
                        : 'bg-zinc-800 text-zinc-400'
                    }`}>
                      {exo.percent >= 0 ? `+${exo.percent}%` : `${exo.percent}%`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main Progression Chart Bento Card */}
      <div className="bg-[#1A1A1A] border border-[#262626] rounded-3xl p-5 shadow-xl">
        {/* Header & Exercise Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#262626]">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#A3FF12]" />
              <h3 className="font-bold text-lg text-[#F5F5F5] tracking-tight">
                Courbe de Charge Max (100%)
              </h3>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Historique des paliers 100% et propagation vers N+1
            </p>
          </div>

          {/* Exercise Dropdown */}
          <div className="flex items-center gap-2">
            <select
              id="select-progression-exercise"
              value={selectedExerciseId}
              onChange={(e) => setSelectedExerciseId(e.target.value)}
              className="bg-[#222222] border border-zinc-700 text-zinc-200 text-xs font-semibold rounded-2xl px-3 py-2 outline-none focus:border-[#A3FF12] transition-colors cursor-pointer w-full sm:w-auto"
            >
              {exercises.map((exo) => (
                <option key={exo.id} value={exo.id}>
                  [{exo.category}] {exo.name} ({exo.currentMaxWeight}kg)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Selected Exercise Badge */}
        <div className="flex items-center justify-between mt-4 mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-zinc-300">
              {selectedExercise?.name}
            </span>
            <span className="text-[10px] font-bold text-[#A3FF12] bg-[#A3FF12]/10 px-2.5 py-0.5 rounded-full border border-[#A3FF12]/30">
              {selectedExercise?.subGroupNameFr}
            </span>
          </div>

          <div className="text-right">
            <span className="text-[11px] text-zinc-500">Record Actuel (100%) : </span>
            <strong className="text-sm font-mono text-[#A3FF12] font-bold">
              {selectedExercise?.currentMaxWeight} kg
            </strong>
          </div>
        </div>

        {/* Recharts Area Chart in Bento Neon Lime */}
        <div className="h-64 w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorMaxWeight" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#A3FF12" stopOpacity={0.35}/>
                  <stop offset="95%" stopColor="#A3FF12" stopOpacity={0.0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
              <XAxis 
                dataKey="date" 
                stroke="#71717a" 
                fontSize={11} 
                tickLine={false} 
                axisLine={{ stroke: '#262626' }}
              />
              <YAxis 
                stroke="#71717a" 
                fontSize={11} 
                domain={['dataMin - 5', 'dataMax + 5']} 
                tickLine={false}
                axisLine={{ stroke: '#262626' }}
                unit="kg"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#121212',
                  borderColor: '#262626',
                  borderRadius: '1rem',
                  fontSize: '12px',
                  color: '#F5F5F5',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.8)'
                }}
                formatter={(value: any) => [`${value} kg`, 'Charge Max (100%)']}
                labelFormatter={(label, items) => {
                  const item = items[0]?.payload;
                  return item?.fullDate ? `${item.fullDate}` : `Séance ${label}`;
                }}
              />
              <Area 
                type="monotone" 
                dataKey="maxWeight" 
                stroke="#A3FF12" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorMaxWeight)" 
                dot={{ r: 4, fill: '#A3FF12', strokeWidth: 2, stroke: '#050505' }}
                activeDot={{ r: 6, fill: '#A3FF12', stroke: '#ffffff', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Workout History Bento Card */}
      <div className="bg-[#1A1A1A] border border-[#262626] rounded-3xl p-5 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-[#262626]">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#A3FF12]" />
            <h3 className="font-bold text-base text-[#F5F5F5]">Journal des Séances</h3>
          </div>
          <span className="text-xs text-zinc-500 font-mono">{history.length} séances</span>
        </div>

        <div className="mt-4 space-y-2.5">
          {history.length === 0 ? (
            <div className="text-center py-8 text-zinc-500 text-xs">
              Aucune séance terminée pour le moment.
            </div>
          ) : (
            history.slice(0, 8).map((workout) => {
              const d = new Date(workout.date);
              const formattedDate = d.toLocaleDateString('fr-FR', {
                weekday: 'short',
                day: 'numeric',
                month: 'short'
              });
              const mins = Math.floor(workout.durationSeconds / 60);

              return (
                <div
                  key={workout.id}
                  id={`history-item-${workout.id}`}
                  className="p-3.5 bg-[#222222] hover:bg-[#262626] rounded-2xl border border-zinc-800/80 flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-xl bg-[#A3FF12]/10 text-[#A3FF12] border border-[#A3FF12]/30">
                      {workout.category}
                    </span>
                    <div>
                      <div className="text-xs font-bold text-[#F5F5F5] capitalize">
                        {formattedDate}
                      </div>
                      <div className="text-[10px] text-zinc-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
                        <span>{workout.exercises.length} exercices</span>
                        <span>•</span>
                        <span>{mins > 0 ? `${mins} min` : 'Muscu'}</span>
                        {workout.cardio && workout.cardio.completed && (
                          <>
                            <span>•</span>
                            <span className="text-[#A3FF12] font-semibold flex items-center gap-0.5">
                              <Flame className="w-3 h-3 inline" />
                              Cardio {workout.cardio.durationMinutes}m
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs font-mono font-bold text-[#A3FF12]">
                      {workout.totalVolumeKg.toLocaleString()} kg
                    </div>
                    <div className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider">Volume total</div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
