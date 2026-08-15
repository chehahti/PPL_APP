import React, { useState, useRef } from 'react';
import { 
  Settings, 
  Volume2, 
  VolumeX, 
  Vibrate, 
  RotateCcw, 
  Check, 
  Info,
  Dumbbell,
  User,
  Download,
  Upload,
  ShieldCheck,
  Zap,
  Timer,
  Database,
  Smartphone,
  Sparkles,
  Sliders
} from 'lucide-react';
import { AppSettings } from '../types/fitness';
import { StorageService } from '../services/storageService';

interface SettingsTabProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  onResetAll: () => void;
  onOpenInstallModal?: () => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  settings,
  onUpdateSettings,
  onResetAll,
  onOpenInstallModal
}) => {
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isResetSuccess, setIsResetSuccess] = useState(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Export data JSON
  const handleExportData = () => {
    const data = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      settings,
      exercises: StorageService.getExercises(),
      history: StorageService.getWorkoutHistory()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ppl_fitness_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setExportNotice('Sauvegarde exportée avec succès !');
    setTimeout(() => setExportNotice(null), 3000);
  };

  // Import data JSON
  const handleImportFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        if (json.exercises && Array.isArray(json.exercises)) {
          StorageService.saveExercises(json.exercises);
        }
        if (json.history && Array.isArray(json.history)) {
          StorageService.saveHistory(json.history);
        }
        if (json.settings) {
          onUpdateSettings(json.settings);
        }
        setExportNotice('Données importées avec succès !');
        setTimeout(() => {
          setExportNotice(null);
          window.location.reload();
        }, 1500);
      } catch {
        setExportNotice('Fichier de sauvegarde invalide.');
        setTimeout(() => setExportNotice(null), 3000);
      }
    };
    reader.readAsText(file);
  };

  const allExercises = StorageService.getExercises();
  const allHistory = StorageService.getWorkoutHistory();

  return (
    <div id="settings-tab-container" className="pb-28 pt-2 space-y-4 text-white">
      {/* Header */}
      <div className="flex justify-between items-center px-1 pt-1">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#D4FF00]" />
            <span className="text-zinc-400 text-[10px] font-black tracking-widest uppercase font-mono">
              Configuration
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white font-display mt-0.5">
            Paramètres
          </h1>
          <p className="text-xs text-zinc-400 font-medium mt-0.5">
            Personnalisation des charges, chronomètres et sauvegarde
          </p>
        </div>

        <div className="p-3 bg-[#121217] border border-white/10 rounded-2xl">
          <Sliders className="w-5 h-5 text-[#D4FF00]" />
        </div>
      </div>

      {/* PWA & Mobile App Card */}
      <div className="bg-[#121217] border border-white/[0.08] rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center text-[#D4FF00] shadow-xs">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-base text-white font-display">Application Mobile (PWA)</h3>
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#D4FF00]/15 text-[#D4FF00] border border-[#D4FF00]/30">Vercel Ready</span>
              </div>
              <p className="text-[11px] text-zinc-400">Installez l'application sur votre écran d'accueil sans passer par les stores</p>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-zinc-900/80 rounded-2xl border border-white/[0.08]">
          <div className="text-xs text-zinc-300">
            <div className="font-bold text-white flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#D4FF00]" />
              <span>Simuler une vraie application native</span>
            </div>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Plein écran autonome, icône HD, hors-ligne et zéro barre d'URL Safari/Chrome.
            </p>
          </div>

          <button
            onClick={onOpenInstallModal}
            className="w-full sm:w-auto px-4 py-3 bg-[#D4FF00] hover:bg-[#b8e600] text-black text-xs font-black rounded-xl shadow-[0_0_15px_rgba(212,255,0,0.2)] flex items-center justify-center gap-2 transition-transform active:scale-95 shrink-0 uppercase tracking-wider"
          >
            <Smartphone className="w-4 h-4" />
            <span>Ajouter à l'écran d'accueil</span>
          </button>
        </div>
      </div>

      {/* Profil Athlète Card */}
      <div className="bg-[#121217] border border-white/[0.08] rounded-3xl p-5 sm:p-6 shadow-xl">
        <div className="flex items-center gap-3 pb-4 border-b border-white/[0.08]">
          <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-white/10 flex items-center justify-center text-[#D4FF00]">
            <User className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-black text-base text-white font-display">Profil Athlète & Objectif</h3>
            <p className="text-[11px] text-zinc-400">Personnalisation des séances et calculs relatifs</p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block mb-1.5">
              Nom / Prénom de l'athlète
            </label>
            <input
              type="text"
              value={settings.athleteName || ''}
              placeholder="Ex: Athlète"
              onChange={(e) => onUpdateSettings({ ...settings, athleteName: e.target.value })}
              className="w-full bg-zinc-900 border border-white/15 text-white text-xs font-bold rounded-2xl px-3.5 py-2.5 outline-none focus:border-[#D4FF00] transition-colors"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block mb-1.5">
              Poids de corps actuel (kg)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="0.5"
                min="30"
                max="250"
                value={settings.athleteWeight || ''}
                placeholder="75.0"
                onChange={(e) => onUpdateSettings({ ...settings, athleteWeight: parseFloat(e.target.value) || undefined })}
                className="w-full bg-zinc-900 border border-white/15 text-white text-xs font-mono font-bold rounded-2xl px-3.5 py-2.5 outline-none focus:border-[#D4FF00] transition-colors"
              />
              <span className="text-xs font-bold text-white bg-zinc-800 border border-white/10 px-3 py-2.5 rounded-2xl font-mono">
                KG
              </span>
            </div>
          </div>
        </div>

        <div className="mt-4 p-3 bg-zinc-900/80 rounded-2xl border border-white/[0.08] flex items-center gap-3">
          <Zap className="w-4 h-4 text-[#D4FF00] shrink-0" />
          <div className="text-xs text-zinc-300">
            <span className="font-bold text-white">Programme Actif : </span>
            Push / Pull / Legs (PPL) + Finisher Cardio Incliné
          </div>
        </div>
      </div>

      {/* Méthode PPL & Entraînement Card */}
      <div className="bg-[#121217] border border-white/[0.08] rounded-3xl p-5 sm:p-6 shadow-xl">
        <div className="flex items-center gap-3 pb-4 border-b border-white/[0.08]">
          <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-white/10 flex items-center justify-center text-[#D4FF00]">
            <Dumbbell className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-black text-base text-white font-display">Méthode PPL & Chrono</h3>
            <p className="text-[11px] text-zinc-400">Règles de calcul pyramidal et temps de récupération</p>
          </div>
        </div>

        <div className="mt-4 space-y-4">
          {/* Rest Duration Preset */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className="text-xs font-bold text-white uppercase tracking-wider">Timer de repos standard</div>
                <div className="text-[11px] text-zinc-400">Temps déclenché automatiquement après chaque série</div>
              </div>
              <span className="text-xs font-mono font-bold text-[#D4FF00]">
                {Math.floor(settings.defaultRestDuration / 60)}m {settings.defaultRestDuration % 60 ? '30s' : '00s'}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {[
                { val: 60, label: '1m00' },
                { val: 90, label: '1m30' },
                { val: 120, label: '2m00' },
                { val: 180, label: '3m00' }
              ].map((item) => (
                <button
                  key={item.val}
                  onClick={() => onUpdateSettings({ ...settings, defaultRestDuration: item.val })}
                  className={`py-2.5 rounded-2xl text-xs font-bold transition-all border ${
                    settings.defaultRestDuration === item.val
                      ? 'bg-[#D4FF00] text-black border-[#D4FF00] font-black shadow-xs'
                      : 'bg-zinc-900 text-zinc-300 border-white/10 hover:bg-zinc-800 hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Weight Increments */}
          <div className="pt-3 border-t border-white/[0.08]">
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className="text-xs font-bold text-white uppercase tracking-wider">Palier d'arrondi des charges</div>
                <div className="text-[11px] text-zinc-400">Incrémentation pour le calcul des 60% et 80%</div>
              </div>
              <span className="text-xs font-mono font-bold text-[#D4FF00]">
                {settings.weightRoundingIncrement} kg
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                { val: 0.5, label: '0.5 kg (Précis)' },
                { val: 1.0, label: '1.0 kg (Standard)' },
                { val: 2.5, label: '2.5 kg (Disques)' }
              ].map((item) => (
                <button
                  key={item.val}
                  onClick={() => onUpdateSettings({ ...settings, weightRoundingIncrement: item.val })}
                  className={`py-2.5 rounded-2xl text-xs font-bold transition-all border ${
                    settings.weightRoundingIncrement === item.val
                      ? 'bg-[#D4FF00] text-black border-[#D4FF00] font-black shadow-xs'
                      : 'bg-zinc-900 text-zinc-300 border-white/10 hover:bg-zinc-800 hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Surcharge Progressive Automatique */}
          <div className="flex items-center justify-between pt-3 border-t border-white/[0.08]">
            <div className="pr-2">
              <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <span>Surcharge progressive auto (N ➔ N+1)</span>
                <span className="text-[9px] bg-[#D4FF00]/20 text-[#D4FF00] border border-[#D4FF00]/30 px-2 py-0.5 rounded font-mono font-bold">Actif</span>
              </div>
              <div className="text-[11px] text-zinc-400 mt-0.5">
                Définit automatiquement les charges 100% de la séance suivante selon les performances réalisées
              </div>
            </div>
            <button
              onClick={() => onUpdateSettings({ ...settings, autoIncrementWeightOnSuccess: !settings.autoIncrementWeightOnSuccess })}
              className={`w-12 h-6 rounded-full transition-colors relative p-0.5 shrink-0 ${
                settings.autoIncrementWeightOnSuccess ? 'bg-[#D4FF00]' : 'bg-zinc-800 border border-white/10'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full transition-transform ${
                  settings.autoIncrementWeightOnSuccess ? 'translate-x-6 bg-black' : 'translate-x-0 bg-zinc-400'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Audio & Vibrations Card */}
      <div className="bg-[#121217] border border-white/[0.08] rounded-3xl p-5 sm:p-6 shadow-xl">
        <div className="flex items-center gap-3 pb-4 border-b border-white/[0.08]">
          <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-white/10 flex items-center justify-center text-[#D4FF00]">
            <Volume2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-black text-base text-white font-display">Alertes & Retour Sensoriel</h3>
            <p className="text-[11px] text-zinc-400">Signaux audio et vibrations pour le rythme d'entraînement</p>
          </div>
        </div>

        <div className="mt-4 space-y-4">
          {/* Sound Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {settings.soundEnabled ? <Volume2 className="w-4 h-4 text-[#D4FF00]" /> : <VolumeX className="w-4 h-4 text-zinc-500" />}
              <div>
                <div className="text-xs font-bold text-white uppercase tracking-wider">Alertes sonores & Bips</div>
                <div className="text-[11px] text-zinc-400">Signal sonore à la validation de série et fin de repos</div>
              </div>
            </div>
            <button
              onClick={() => onUpdateSettings({ ...settings, soundEnabled: !settings.soundEnabled })}
              className={`w-12 h-6 rounded-full transition-colors relative p-0.5 shrink-0 ${
                settings.soundEnabled ? 'bg-[#D4FF00]' : 'bg-zinc-800 border border-white/10'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full transition-transform ${
                  settings.soundEnabled ? 'translate-x-6 bg-black' : 'translate-x-0 bg-zinc-400'
                }`}
              />
            </button>
          </div>

          {/* Vibration Toggle */}
          <div className="flex items-center justify-between pt-3 border-t border-white/[0.08]">
            <div className="flex items-center gap-2.5">
              <Vibrate className={`w-4 h-4 ${settings.vibrationEnabled ? 'text-[#D4FF00]' : 'text-zinc-500'}`} />
              <div>
                <div className="text-xs font-bold text-white uppercase tracking-wider">Vibrations haptiques</div>
                <div className="text-[11px] text-zinc-400">Retour tactile sur les boutons de validation</div>
              </div>
            </div>
            <button
              onClick={() => onUpdateSettings({ ...settings, vibrationEnabled: !settings.vibrationEnabled })}
              className={`w-12 h-6 rounded-full transition-colors relative p-0.5 shrink-0 ${
                settings.vibrationEnabled ? 'bg-[#D4FF00]' : 'bg-zinc-800 border border-white/10'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full transition-transform ${
                  settings.vibrationEnabled ? 'translate-x-6 bg-black' : 'translate-x-0 bg-zinc-400'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Sauvegardes & Gestion des Données Card */}
      <div className="bg-[#121217] border border-white/[0.08] rounded-3xl p-5 sm:p-6 shadow-xl">
        <div className="flex items-center gap-3 pb-4 border-b border-white/[0.08]">
          <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-white/10 flex items-center justify-center text-[#D4FF00]">
            <Database className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-black text-base text-white font-display">Base de Données & Sauvegardes</h3>
            <p className="text-[11px] text-zinc-400">Persistance locale, export et restauration</p>
          </div>
        </div>

        {/* Database Status Info */}
        <div className="grid grid-cols-2 gap-2.5 my-4">
          <div className="p-3 bg-zinc-900/80 rounded-2xl border border-white/[0.08]">
            <span className="text-[10px] text-zinc-400 uppercase font-bold">Exercices Enregistrés</span>
            <div className="text-lg font-bold font-mono text-white mt-0.5">
              {allExercises.length} mouvements
            </div>
          </div>
          <div className="p-3 bg-zinc-900/80 rounded-2xl border border-white/[0.08]">
            <span className="text-[10px] text-zinc-400 uppercase font-bold">Séances Validées</span>
            <div className="text-lg font-bold font-mono text-white mt-0.5">
              {allHistory.length} entraînements
            </div>
          </div>
        </div>

        {/* Action Buttons: Export & Import */}
        <div className="grid grid-cols-2 gap-2 pt-2">
          <button
            onClick={handleExportData}
            className="flex items-center justify-center gap-2 p-3 bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs rounded-2xl border border-white/10 transition-colors active:scale-95"
          >
            <Download className="w-4 h-4 text-[#D4FF00]" />
            <span>Exporter (JSON)</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center gap-2 p-3 bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs rounded-2xl border border-white/10 transition-colors active:scale-95"
          >
            <Upload className="w-4 h-4 text-[#38BDF8]" />
            <span>Importer Sauvegarde</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImportFile}
            className="hidden"
          />
        </div>

        {exportNotice && (
          <div className="mt-3 p-3 bg-zinc-900 border border-[#D4FF00]/40 rounded-2xl text-xs font-bold text-[#D4FF00] flex items-center gap-2 animate-fadeIn">
            <Check className="w-4 h-4 text-[#D4FF00]" />
            <span>{exportNotice}</span>
          </div>
        )}
      </div>

      {/* Danger Zone: Reset Card */}
      <div className="bg-[#121217] border border-red-500/20 rounded-3xl p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="text-xs font-bold text-red-400 uppercase tracking-wider">Réinitialiser les Données</div>
            <div className="text-[11px] text-zinc-400">Effacer l'historique et restaurer les charges initiales propres</div>
          </div>
          
          {showResetConfirm ? (
            <div className="flex items-center gap-2">
              <button
                id="btn-confirm-reset-yes"
                onClick={() => {
                  onResetAll();
                  setShowResetConfirm(false);
                  setIsResetSuccess(true);
                  setTimeout(() => setIsResetSuccess(false), 3000);
                }}
                className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-2xl text-xs font-bold transition-all active:scale-95 shadow-sm flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Confirmer</span>
              </button>
              <button
                id="btn-confirm-reset-cancel"
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-2xl text-xs font-semibold transition-all border border-white/10"
              >
                Annuler
              </button>
            </div>
          ) : (
            <button
              id="btn-trigger-reset"
              onClick={() => setShowResetConfirm(true)}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-red-950/30 hover:bg-red-900/50 text-red-400 border border-red-500/30 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all active:scale-95 shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{isResetSuccess ? 'Données Réinitialisées ✓' : 'Réinitialiser'}</span>
            </button>
          )}
        </div>

        {isResetSuccess && (
          <div className="mt-3 p-3 bg-zinc-900 border border-white/10 rounded-2xl flex items-center gap-2 text-xs text-white font-medium animate-fadeIn">
            <Check className="w-4 h-4 text-[#D4FF00]" />
            <span>Toutes les données et l'historique ont été réinitialisés avec succès !</span>
          </div>
        )}
      </div>
    </div>
  );
};
