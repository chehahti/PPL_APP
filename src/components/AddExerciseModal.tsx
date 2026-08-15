import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Dumbbell, 
  Check, 
  X, 
  Layers, 
  Sparkles,
  ChevronRight,
  Filter
} from 'lucide-react';
import { ExerciseDefinition, MuscleCategory, ExerciseSessionState } from '../types/fitness';
import { ALL_EXERCISES_DATABASE, INITIAL_EXERCISES } from '../data/defaultExercises';
import { StorageService } from '../services/storageService';

interface AddExerciseModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: MuscleCategory;
  onAddExercise: (newExo: ExerciseSessionState) => void;
  existingExerciseIds: string[];
  weightRoundingIncrement?: number;
}

export const AddExerciseModal: React.FC<AddExerciseModalProps> = ({
  isOpen,
  onClose,
  category,
  onAddExercise,
  existingExerciseIds,
  weightRoundingIncrement = 0.5
}) => {
  const [tab, setTab] = useState<'library' | 'custom'>('library');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<MuscleCategory | 'ALL'>(category);

  // Custom exercise form state
  const [customName, setCustomName] = useState('');
  const [customSubGroup, setCustomSubGroup] = useState('Autre');
  const [customTargetMuscle, setCustomTargetMuscle] = useState('');
  const [customEquipment, setCustomEquipment] = useState('Haltères / Poulie');
  const [customMaxWeight, setCustomMaxWeight] = useState<number>(30);

  // Filter available exercises from all database
  const availableExercises = useMemo(() => {
    return ALL_EXERCISES_DATABASE.filter(exo => {
      const matchCat = selectedCategoryFilter === 'ALL' || exo.category === selectedCategoryFilter;
      const matchQuery = 
        exo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exo.subGroupNameFr.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exo.targetMuscleFr.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchQuery;
    });
  }, [selectedCategoryFilter, searchQuery]);

  if (!isOpen) return null;

  const handleSelectFromLibrary = (exo: ExerciseDefinition) => {
    const sets = StorageService.calculatePyramidSets(exo, weightRoundingIncrement);
    const sessionExo: ExerciseSessionState = {
      exerciseId: exo.id,
      exerciseName: exo.name,
      category: exo.category,
      subGroup: exo.subGroup,
      subGroupNameFr: exo.subGroupNameFr,
      targetMuscleFr: exo.targetMuscleFr,
      equipment: exo.equipment,
      instructionFr: exo.instructionFr,
      baseMaxWeight: exo.currentMaxWeight,
      sets: sets as [any, any, any]
    };
    onAddExercise(sessionExo);
    onClose();
  };

  const handleCreateCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;

    const id = `custom_${Date.now()}`;
    const cleanWeight = Math.max(1, Number(customMaxWeight) || 20);

    const customDef: ExerciseDefinition = {
      id,
      name: customName.trim(),
      category,
      subGroup: 'CUSTOM_EXO',
      subGroupNameFr: customSubGroup.trim() || 'Exercice Personnalisé',
      targetMuscleFr: customTargetMuscle.trim() || 'Muscles ciblés',
      defaultMinWeight: Math.round(cleanWeight * 0.7),
      defaultMaxWeight: cleanWeight,
      currentMaxWeight: cleanWeight,
      unit: 'kg',
      equipment: customEquipment.trim() || 'Libre',
      instructionFr: 'Exécution propre et contrôlée avec charge progressive.'
    };

    const sets = StorageService.calculatePyramidSets(customDef, weightRoundingIncrement);
    const sessionExo: ExerciseSessionState = {
      exerciseId: customDef.id,
      exerciseName: customDef.name,
      category: customDef.category,
      subGroup: customDef.subGroup,
      subGroupNameFr: customDef.subGroupNameFr,
      targetMuscleFr: customDef.targetMuscleFr,
      equipment: customDef.equipment,
      instructionFr: customDef.instructionFr,
      baseMaxWeight: customDef.currentMaxWeight,
      sets: sets as [any, any, any]
    };

    onAddExercise(sessionExo);
    onClose();
    setCustomName('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div 
        id="modal-add-exercise"
        className="bg-[#121217] border border-white/10 rounded-3xl max-w-lg w-full text-white shadow-2xl relative overflow-hidden max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="p-5 border-b border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#D4FF00] text-black flex items-center justify-center font-bold shadow-[0_0_15px_rgba(212,255,0,0.3)]">
              <Plus className="w-5 h-5 stroke-[3]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight text-white font-display">
                Ajouter un exercice
              </h2>
              <p className="text-xs text-zinc-400">
                Séance en cours : <span className="text-[#D4FF00] font-bold">{category}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switcher: Bibliothèque / Personnalisé */}
        <div className="grid grid-cols-2 p-2 bg-zinc-900 border-b border-white/[0.08] gap-2">
          <button
            onClick={() => setTab('library')}
            className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              tab === 'library'
                ? 'bg-zinc-800 text-[#D4FF00] border border-white/10 shadow-xs font-black'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Dumbbell className="w-3.5 h-3.5" />
            <span>Bibliothèque d'exercices</span>
          </button>

          <button
            onClick={() => setTab('custom')}
            className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              tab === 'custom'
                ? 'bg-zinc-800 text-[#D4FF00] border border-white/10 shadow-xs font-black'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Créer un exercice</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {tab === 'library' ? (
            <>
              {/* Search & Category Filter */}
              <div className="space-y-2">
                <div className="relative">
                  <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Rechercher un exercice (nom, muscle, poulie...)"
                    className="w-full bg-zinc-900 border border-white/15 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#D4FF00]"
                  />
                </div>

                {/* Filter tags */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                  {(['ALL', 'PUSH', 'PULL', 'LEGS'] as const).map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategoryFilter(cat)}
                      className={`px-3 py-1 rounded-xl text-[11px] font-bold shrink-0 transition-all ${
                        selectedCategoryFilter === cat
                          ? 'bg-[#D4FF00] text-black font-black shadow-xs'
                          : 'bg-zinc-900 text-zinc-400 hover:text-white border border-white/10'
                      }`}
                    >
                      {cat === 'ALL' ? 'Tous' : cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Exercises List */}
              <div className="space-y-2">
                {availableExercises.length === 0 ? (
                  <div className="text-center py-8 text-zinc-500 text-xs">
                    Aucun exercice trouvé pour cette recherche.
                  </div>
                ) : (
                  availableExercises.map((exo) => {
                    const isAlreadyInSession = existingExerciseIds.includes(exo.id);

                    return (
                      <div
                        key={exo.id}
                        onClick={() => !isAlreadyInSession && handleSelectFromLibrary(exo)}
                        className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                          isAlreadyInSession
                            ? 'bg-zinc-900/40 border-white/5 opacity-50 cursor-not-allowed'
                            : 'bg-zinc-900/80 hover:bg-zinc-800 border-white/[0.08] hover:border-[#D4FF00]/50 cursor-pointer shadow-xs'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-white/10 flex items-center justify-center shrink-0">
                            <Dumbbell className="w-5 h-5 text-[#D4FF00]" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-bold text-white truncate">
                                {exo.name}
                              </h4>
                              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">
                                {exo.category}
                              </span>
                            </div>
                            <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                              {exo.subGroupNameFr} • {exo.equipment}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs font-mono font-bold text-[#D4FF00]">
                            {exo.currentMaxWeight} kg
                          </span>
                          {isAlreadyInSession ? (
                            <span className="text-[10px] text-zinc-500 font-bold bg-zinc-800 px-2 py-1 rounded-lg">
                              Déjà ajouté
                            </span>
                          ) : (
                            <button
                              type="button"
                              className="w-8 h-8 rounded-xl bg-[#D4FF00] text-black flex items-center justify-center hover:bg-[#b8e600] transition-colors"
                            >
                              <Plus className="w-4 h-4 stroke-[3]" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          ) : (
            /* Custom Exercise Form */
            <form onSubmit={handleCreateCustom} className="space-y-4 pt-1">
              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Nom de l'exercice *
                </label>
                <input
                  type="text"
                  required
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="Ex : Dips aux barres parallèles, Dips lestés..."
                  className="w-full bg-zinc-900 border border-white/15 rounded-2xl px-4 py-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#D4FF00]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                    Faisceau / Muscle
                  </label>
                  <input
                    type="text"
                    value={customSubGroup}
                    onChange={(e) => setCustomSubGroup(e.target.value)}
                    placeholder="Ex : Triceps, Bas Pectoraux..."
                    className="w-full bg-zinc-900 border border-white/15 rounded-2xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#D4FF00]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                    Équipement
                  </label>
                  <input
                    type="text"
                    value={customEquipment}
                    onChange={(e) => setCustomEquipment(e.target.value)}
                    placeholder="Ex : Poids du corps + ceinture"
                    className="w-full bg-zinc-900 border border-white/15 rounded-2xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#D4FF00]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Charge Max 100% (Série 3 de référence) - kg
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    max="500"
                    value={customMaxWeight}
                    onChange={(e) => setCustomMaxWeight(Number(e.target.value))}
                    className="w-32 bg-zinc-900 border border-white/15 rounded-2xl px-4 py-2.5 text-base font-mono font-bold text-[#D4FF00] focus:outline-none focus:border-[#D4FF00]"
                  />
                  <div className="text-[11px] text-zinc-400">
                    Série 1 : <strong className="text-white">{Math.round(customMaxWeight * 0.6)}kg</strong> (12r) • Série 2 : <strong className="text-white">{Math.round(customMaxWeight * 0.8)}kg</strong> (10r)
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-[#D4FF00] hover:bg-[#b8e600] text-black font-extrabold text-xs rounded-2xl shadow-[0_0_20px_rgba(212,255,0,0.3)] flex items-center justify-center gap-2 uppercase tracking-wider transition-transform active:scale-95 mt-4"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Ajouter à la séance active</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
