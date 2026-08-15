import React from 'react';
import { X, Check, Target, Info, Dumbbell } from 'lucide-react';
import { ExerciseDefinition, ExerciseSessionState } from '../types/fitness';
import { StorageService } from '../services/storageService';

interface ReplaceExerciseModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentExercise: ExerciseSessionState | null;
  onSelectVariant: (variant: ExerciseDefinition) => void;
}

export const ReplaceExerciseModal: React.FC<ReplaceExerciseModalProps> = ({
  isOpen,
  onClose,
  currentExercise,
  onSelectVariant
}) => {
  if (!isOpen || !currentExercise) return null;

  const variants = StorageService.getVariantsForExercise(
    currentExercise.subGroup,
    currentExercise.exerciseId
  );

  return (
    <div
      id="replace-exercise-overlay"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4"
    >
      <div
        id="replace-exercise-panel"
        className="w-full max-w-lg bg-[#121217] border border-white/10 rounded-t-3xl sm:rounded-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden text-white animate-in slide-in-from-bottom-6 duration-200"
      >
        {/* Header */}
        <div className="p-5 border-b border-white/[0.08] flex items-start justify-between bg-[#121217]">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#D4FF00] mb-1">
              <Target className="w-3.5 h-3.5" />
              <span>Substitution Anatomique</span>
            </div>
            <h3 className="text-lg font-black text-white font-display">
              Remplacer : {currentExercise.exerciseName}
            </h3>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#D4FF00]/15 text-[#D4FF00] border border-[#D4FF00]/30">
                Zone : {currentExercise.subGroupNameFr}
              </span>
            </div>
          </div>

          <button
            id="btn-close-replace-modal"
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-full bg-zinc-800 border border-white/10 transition-colors"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Informative Note */}
        <div className="px-5 py-3 bg-zinc-900/80 border-b border-white/[0.08] flex items-center gap-2 text-xs text-zinc-300">
          <Info className="w-4 h-4 text-[#D4FF00] shrink-0" />
          <span>
            Toutes les variantes ciblent strictement le même faisceau (<strong className="text-white">{currentExercise.subGroupNameFr}</strong>).
          </span>
        </div>

        {/* Variants List */}
        <div className="p-5 overflow-y-auto space-y-3 flex-1 bg-[#121217]">
          {variants.length === 0 ? (
            <div className="text-center py-10 text-zinc-500 text-xs">
              <p>Aucune variante enregistrée pour ce sous-groupe spécifique.</p>
            </div>
          ) : (
            variants.map((variant) => (
              <div
                key={variant.id}
                id={`variant-card-${variant.id}`}
                onClick={() => onSelectVariant(variant)}
                className="group p-4 rounded-2xl bg-zinc-900/80 hover:bg-zinc-800 border border-white/[0.08] hover:border-[#D4FF00]/60 transition-all cursor-pointer flex flex-col justify-between gap-3 active:scale-[0.99] shadow-xs"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-zinc-800 border border-white/10 shrink-0 flex items-center justify-center group-hover:bg-[#D4FF00] group-hover:text-black transition-all text-[#D4FF00]">
                      <Dumbbell className="w-5 h-5" />
                    </div>

                    <div className="min-w-0">
                      <h4 className="font-bold text-sm text-white group-hover:text-[#D4FF00] transition-colors truncate">
                        {variant.name}
                      </h4>
                      <p className="text-xs text-zinc-400 mt-0.5 truncate">
                        {variant.targetMuscleFr} • <span className="text-zinc-300">{variant.equipment}</span>
                      </p>
                    </div>
                  </div>

                  <button
                    id={`btn-select-variant-${variant.id}`}
                    className="shrink-0 p-2.5 rounded-xl bg-zinc-800 group-hover:bg-[#D4FF00] group-hover:text-black text-zinc-300 transition-all"
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                  </button>
                </div>

                {variant.instructionFr && (
                  <p className="text-xs text-zinc-300 italic bg-zinc-950 p-2.5 rounded-xl border border-white/10">
                    💡 {variant.instructionFr}
                  </p>
                )}

                <div className="flex items-center justify-between text-xs text-zinc-400 pt-1 border-t border-white/[0.08]">
                  <span>Charge max 100% : <strong className="text-[#D4FF00] font-mono font-black">{variant.currentMaxWeight} kg</strong></span>
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">60% • 80% • 100%</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#121217] border-t border-white/[0.08] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold uppercase tracking-wider transition-colors border border-white/10"
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
};
