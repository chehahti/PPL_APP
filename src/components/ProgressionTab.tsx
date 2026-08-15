import React, { useState, useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  Award, 
  Calendar, 
  Dumbbell, 
  Activity, 
  Filter, 
  BarChart3, 
  Flame, 
  Zap, 
  Target, 
  ChevronRight, 
  Info 
} from 'lucide-react';
import { CompletedWorkout, MuscleCategory, ExerciseDefinition } from '../types/fitness';
import { 
  MuscleGroupStat, 
  computeGlobalStats, 
  computeExerciseHistoryPoints, 
  computeMuscleGroupProgress 
} from '../utils/progressionCalculations';

interface ProgressionTabProps {
  history: CompletedWorkout[];
  exercises: ExerciseDefinition[];
}

export const ProgressionTab: React.FC<ProgressionTabProps> = ({
  history,
  exercises
}) => {
  const [selectedCategory, setSelectedCategory] = useState<MuscleCategory | 'ALL'>('ALL');
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>(
    exercises[0]?.id || 'push_developpe_couche'
  );

  // Selected muscle group for drilldown inspection
  const [selectedMuscleGroupId, setSelectedMuscleGroupId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'progression' | 'name'>('progression');

  // Calculate average progression percentage per muscle group based STRICTLY on real history
  const muscleProgressionData = useMemo<MuscleGroupStat[]>(() => {
    return computeMuscleGroupProgress(history, exercises);
  }, [history, exercises]);

  // Sorted muscle progression list
  const sortedMuscleProgression = useMemo(() => {
    const list = [...muscleProgressionData];
    if (sortBy === 'progression') {
      return list.sort((a, b) => b.avgProgressionPercent - a.avgProgressionPercent);
    }
    return list.sort((a, b) => a.name.localeCompare(b.name));
  }, [muscleProgressionData, sortBy]);

  // Active muscle group details for drilldown
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

  const selectedExercise = useMemo(() => {
    return exercises.find(e => e.id === selectedExerciseId) || exercises[0];
  }, [exercises, selectedExerciseId]);

  // Extract chart data points for the selected exercise across workout history
  const chartData = useMemo(() => {
    return computeExerciseHistoryPoints(history, selectedExercise);
  }, [history, selectedExercise]);

  const globalStats = useMemo(() => {
    return computeGlobalStats(history);
  }, [history]);

  return (
    <div id="progression-tab-container" className="pb-28 pt-2 space-y-4 text-white">
      {/* Header */}
      <div className="flex justify-between items-center px-1 pt-1">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#38BDF8] animate-pulse" />
            <span className="text-zinc-400 text-[10px] font-black tracking-widest uppercase font-mono">
              Analytique & Stats
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white font-display mt-0.5">
            Progression
          </h1>
          <p className="text-xs text-zinc-400 font-medium mt-0.5">
            Suivi de vos gains de charge et de surcharge progressive
          </p>
        </div>

        <div className="p-3 bg-[#121217] border border-white/10 rounded-2xl">
          <TrendingUp className="w-5 h-5 text-[#D4FF00]" />
        </div>
      </div>

      {/* Global Highlights Bento Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        <div className="bg-[#121217] border border-white/[0.08] rounded-3xl p-4 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
            <span>Séances Faites</span>
            <Activity className="w-3.5 h-3.5 text-[#D4FF00]" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white font-mono mt-2">
            {globalStats.totalWorkouts}
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 font-mono mt-1">
            <span>P:{globalStats.pushCount}</span>
            <span>•</span>
            <span>T:{globalStats.pullCount}</span>
            <span>•</span>
            <span>L:{globalStats.legsCount}</span>
          </div>
        </div>

        <div className="bg-[#121217] border border-white/[0.08] rounded-3xl p-4 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
            <span>Volume Total</span>
            <Zap className="w-3.5 h-3.5 text-[#38BDF8]" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#38BDF8] font-mono mt-2">
            {globalStats.totalVolume > 1000 ? `${(globalStats.totalVolume / 1000).toFixed(1)} t` : `${globalStats.totalVolume} kg`}
          </div>
          <span className="text-[10px] text-zinc-500 mt-1">Cumulé sur le cycle PPL</span>
        </div>

        <div className="col-span-2 sm:col-span-1 bg-[#121217] border border-white/[0.08] rounded-3xl p-4 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
            <span>Gain Moyen</span>
            <Award className="w-3.5 h-3.5 text-[#D4FF00]" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#D4FF00] font-mono mt-2">
            {overallAverageGain >= 0 ? `+${overallAverageGain}%` : `${overallAverageGain}%`}
          </div>
          <span className="text-[10px] text-zinc-500 mt-1">Tous muscles confondus</span>
        </div>
      </div>

      {/* ================= GRAPHIQUE MOYENNE DE PROGRESSION PAR MUSCLE ================= */}
      <div id="muscle-progression-card" className="bg-[#121217] border border-white/[0.08] rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        {/* Card Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/[0.08]">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[#D4FF00]" />
              <h3 className="font-black text-base sm:text-lg text-white font-display tracking-tight">
                Moyenne de Progression par Muscle
              </h3>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Comparatif du gain de charge moyen (%) par groupe musculaire
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSortBy(sortBy === 'progression' ? 'name' : 'progression')}
              className="text-[11px] font-bold px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors flex items-center gap-1.5 border border-white/10"
            >
              <Filter className="w-3 h-3 text-[#D4FF00]" />
              <span>Trier : {sortBy === 'progression' ? '% Gain' : 'Nom (A-Z)'}</span>
            </button>
          </div>
        </div>

        {/* Recharts Bar Chart - Progression % par Muscle */}
        <div className="h-60 sm:h-64 w-full pt-1">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={sortedMuscleProgression}
              margin={{ top: 15, right: 10, left: -20, bottom: 25 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis
                dataKey="name"
                stroke="#a1a1aa"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#3f3f46' }}
                interval={0}
                angle={-20}
                textAnchor="end"
              />
              <YAxis
                stroke="#a1a1aa"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#3f3f46' }}
                unit="%"
              />
              <Tooltip
                cursor={{ fill: 'rgba(212, 255, 0, 0.05)' }}
                contentStyle={{
                  backgroundColor: '#09090D',
                  borderColor: '#27272a',
                  borderRadius: '1rem',
                  fontSize: '12px',
                  color: '#ffffff',
                  boxShadow: '0 20px 35px -5px rgba(0, 0, 0, 0.5)'
                }}
                formatter={(value: any, name: any, item: any) => {
                  const stat = item?.payload as MuscleGroupStat;
                  return [
                    `+${value}% (Moyenne ${stat?.currentAvgWeight} kg vs départ ${stat?.initialAvgWeight} kg)`,
                    'Progression'
                  ];
                }}
              />
              <Bar 
                dataKey="avgProgressionPercent" 
                radius={[6, 6, 0, 0]}
                onClick={(entry) => setSelectedMuscleGroupId(selectedMuscleGroupId === entry.id ? null : entry.id)}
                className="cursor-pointer"
              >
                {sortedMuscleProgression.map((entry, index) => {
                  const isSelected = selectedMuscleGroupId === entry.id;
                  return (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={isSelected ? '#D4FF00' : '#38BDF8'}
                      opacity={selectedMuscleGroupId && !isSelected ? 0.35 : 0.9}
                    />
                  );
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Interactive Muscle Group Cards Bento Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-2">
          {sortedMuscleProgression.map((m) => {
            const isSelected = selectedMuscleGroupId === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setSelectedMuscleGroupId(isSelected ? null : m.id)}
                className={`p-3.5 rounded-2xl border text-left transition-all ${
                  isSelected 
                    ? 'bg-zinc-800 text-white border-[#D4FF00] shadow-[0_0_15px_rgba(212,255,0,0.2)]' 
                    : 'bg-zinc-900/80 hover:bg-zinc-800 text-white border-white/[0.08]'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-white">
                    {m.name}
                  </span>
                  <span className={`text-xs font-mono font-black px-2 py-0.5 rounded-lg border ${
                    isSelected 
                      ? 'bg-[#D4FF00] text-black border-[#D4FF00]' 
                      : m.avgProgressionPercent > 0 
                        ? 'bg-[#D4FF00]/10 text-[#D4FF00] border-[#D4FF00]/30' 
                        : 'bg-zinc-800 text-zinc-400 border-white/10'
                  }`}>
                    {m.avgProgressionPercent >= 0 ? `+${m.avgProgressionPercent}%` : `${m.avgProgressionPercent}%`}
                  </span>
                </div>

                {/* Progress Mini Bar */}
                <div className="w-full h-1.5 rounded-full overflow-hidden my-2 bg-zinc-800">
                  <div 
                    className="h-full rounded-full bg-[#D4FF00] transition-all duration-500"
                    style={{ 
                      width: `${Math.min(Math.max(m.avgProgressionPercent * 4, 6), 100)}%`
                    }}
                  />
                </div>

                <div className="flex items-center justify-between text-[10px] text-zinc-400">
                  <span>{m.exerciseCount} exos</span>
                  <span className="font-mono">
                    {m.initialAvgWeight}kg → <strong className="text-white">{m.currentAvgWeight}kg</strong>
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Muscle Group Drilldown Details */}
        {activeMuscleGroup && (
          <div className="p-4 bg-zinc-900/90 rounded-2xl border border-white/10 space-y-3 mt-2">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Dumbbell className="w-4 h-4 text-[#D4FF00]" />
                <span className="text-xs font-black text-white uppercase tracking-wider">
                  Détail par exercice : {activeMuscleGroup.name}
                </span>
              </div>
              <span className="text-xs font-mono font-bold text-[#D4FF00]">
                Moyenne : +{activeMuscleGroup.avgProgressionPercent}%
              </span>
            </div>

            <div className="space-y-2">
              {activeMuscleGroup.exercisesList.map((exo, idx) => (
                <div 
                  key={idx} 
                  className="flex items-center justify-between p-2.5 bg-zinc-950 rounded-xl border border-white/10 text-xs shadow-xs"
                >
                  <span className="text-zinc-200 font-bold">{exo.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-zinc-400 text-[11px]">
                      {exo.initialWeight}kg → <strong className="text-white font-bold">{exo.currentWeight}kg</strong>
                    </span>
                    <span className={`font-mono text-[11px] font-bold px-2 py-0.5 rounded-md ${
                      exo.percent > 0 
                        ? 'bg-[#D4FF00]/15 text-[#D4FF00] border border-[#D4FF00]/30' 
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

      {/* Main Single-Exercise Progression Chart */}
      <div className="bg-[#121217] border border-white/[0.08] rounded-3xl p-5 sm:p-6 shadow-xl">
        {/* Header & Exercise Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/[0.08]">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#38BDF8]" />
              <h3 className="font-black text-base sm:text-lg text-white font-display tracking-tight">
                Historique de Charge Maximale (100%)
              </h3>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Évolution de la charge sur la série 3 au fil des entraînements
            </p>
          </div>

          {/* Exercise Dropdown */}
          <div className="flex items-center gap-2">
            <select
              id="select-progression-exercise"
              value={selectedExerciseId}
              onChange={(e) => setSelectedExerciseId(e.target.value)}
              className="bg-zinc-900 border border-white/15 text-white text-xs font-bold rounded-2xl px-3 py-2 outline-none focus:border-[#D4FF00] transition-colors cursor-pointer w-full sm:w-auto"
            >
              {exercises.map((exo) => (
                <option key={exo.id} value={exo.id} className="bg-zinc-900 text-white">
                  [{exo.category}] {exo.name} ({exo.currentMaxWeight}kg)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Selected Exercise Badge */}
        <div className="flex items-center justify-between mt-4 mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-white">
              {selectedExercise?.name}
            </span>
            <span className="text-[10px] font-bold text-[#D4FF00] bg-[#D4FF00]/10 px-2.5 py-0.5 rounded-full border border-[#D4FF00]/30">
              {selectedExercise?.subGroupNameFr}
            </span>
          </div>

          <div className="text-right">
            <span className="text-[11px] text-zinc-400">Charge Actuelle : </span>
            <strong className="text-sm font-mono text-[#D4FF00] font-black">
              {selectedExercise?.currentMaxWeight} kg
            </strong>
          </div>
        </div>

        {/* Recharts Area Chart in Neon Gradient */}
        <div className="h-60 sm:h-64 w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorMaxWeight" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#D4FF00" stopOpacity={0.35}/>
                  <stop offset="95%" stopColor="#D4FF00" stopOpacity={0.0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis 
                dataKey="date" 
                stroke="#a1a1aa" 
                fontSize={11} 
                tickLine={false} 
                axisLine={{ stroke: '#3f3f46' }}
              />
              <YAxis 
                stroke="#a1a1aa" 
                fontSize={11} 
                domain={['dataMin - 5', 'dataMax + 5']} 
                tickLine={false}
                axisLine={{ stroke: '#3f3f46' }}
                unit="kg"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#09090D',
                  borderColor: '#27272a',
                  borderRadius: '1rem',
                  fontSize: '12px',
                  color: '#ffffff',
                  boxShadow: '0 20px 35px -5px rgba(0, 0, 0, 0.5)'
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
                stroke="#D4FF00" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorMaxWeight)" 
                dot={{ r: 4, fill: '#D4FF00', strokeWidth: 2, stroke: '#09090D' }}
                activeDot={{ r: 6, fill: '#D4FF00', stroke: '#ffffff', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Workout History Journal */}
      <div className="bg-[#121217] border border-white/[0.08] rounded-3xl p-5 sm:p-6 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#D4FF00]" />
            <h3 className="font-black text-base text-white font-display">Journal des Séances Récentes</h3>
          </div>
          <span className="text-xs text-zinc-400 font-mono">{history.length} séances</span>
        </div>

        <div className="mt-4 space-y-2.5">
          {history.length === 0 ? (
            <div className="text-center py-8 text-zinc-500 text-xs">
              Aucune séance enregistrée pour le moment.
            </div>
          ) : (
            history.slice(0, 10).map((workout) => {
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
                  className="p-3.5 bg-zinc-900/80 hover:bg-zinc-800 rounded-2xl border border-white/[0.08] flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-xl bg-[#D4FF00] text-black shadow-xs">
                      {workout.category}
                    </span>
                    <div>
                      <div className="text-xs font-bold text-white capitalize">
                        {formattedDate}
                      </div>
                      <div className="text-[10px] text-zinc-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
                        <span>{workout.exercises.length} exercices</span>
                        <span>•</span>
                        <span>{mins > 0 ? `${mins} min` : 'Muscu'}</span>
                        {workout.cardio && workout.cardio.completed && (
                          <>
                            <span>•</span>
                            <span className="text-[#D4FF00] font-bold flex items-center gap-0.5">
                              <Flame className="w-3 h-3 inline text-[#EC4899]" />
                              Cardio {workout.cardio.durationMinutes}m
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs font-mono font-black text-white">
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
