import React, { useState, useEffect } from 'react';
import { 
  Smartphone, 
  Share2, 
  CheckCircle2, 
  X, 
  Sparkles, 
  Download, 
  Globe, 
  ShieldCheck,
  Zap
} from 'lucide-react';

interface AddToHomeScreenModalProps {
  isOpen: boolean;
  onClose: () => void;
  deferredPrompt: any;
  onInstallSuccess?: () => void;
}

export const AddToHomeScreenModal: React.FC<AddToHomeScreenModalProps> = ({
  isOpen,
  onClose,
  deferredPrompt,
  onInstallSuccess
}) => {
  const [platform, setPlatform] = useState<'ios' | 'android' | 'desktop'>('android');
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [installing, setInstalling] = useState<boolean>(false);
  const [showSuccessToast, setShowSuccessToast] = useState<boolean>(false);

  useEffect(() => {
    // Detect Standalone Mode
    const checkStandalone = () => {
      const isStandaloneMode = 
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true ||
        document.referrer.includes('android-app://');
      setIsStandalone(Boolean(isStandaloneMode));
    };
    checkStandalone();

    // Detect OS
    const ua = window.navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(ua)) {
      setPlatform('ios');
    } else if (/android/.test(ua)) {
      setPlatform('android');
    } else {
      setPlatform('desktop');
    }
  }, []);

  if (!isOpen) return null;

  const handleNativeInstall = async () => {
    if (deferredPrompt) {
      setInstalling(true);
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          setShowSuccessToast(true);
          if (onInstallSuccess) onInstallSuccess();
          setTimeout(() => {
            onClose();
          }, 2000);
        }
      } catch (err) {
        console.error('Install prompt error:', err);
      } finally {
        setInstalling(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div 
        id="modal-add-to-home-screen"
        className="bg-[#121217] border border-white/10 rounded-3xl max-w-md w-full p-6 text-white shadow-2xl relative overflow-hidden max-h-[92vh] flex flex-col justify-between"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors z-10"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="overflow-y-auto pr-1 space-y-5">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-white/10 text-[#D4FF00] flex items-center justify-center shadow-xs shrink-0">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-lg font-black tracking-tight text-white font-display">
                  Ajouter à l'écran d'accueil
                </h2>
                <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-md bg-[#D4FF00]/15 text-[#D4FF00] border border-[#D4FF00]/30">
                  PWA
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Utilisez PPL Fitness comme une véritable application mobile
              </p>
            </div>
          </div>

          {/* Already in standalone mode */}
          {isStandalone && (
            <div className="p-3.5 bg-zinc-900 border border-[#D4FF00]/30 rounded-2xl flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-[#D4FF00] shrink-0" />
              <div className="text-xs text-zinc-200">
                <span className="font-bold text-white">Mode Application Actif !</span>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  L'application est déjà lancée en mode plein écran autonome.
                </p>
              </div>
            </div>
          )}

          {/* Platform Switcher Tabs */}
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-zinc-900 border border-white/[0.08] rounded-2xl">
            <button
              onClick={() => setPlatform('ios')}
              className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                platform === 'ios'
                  ? 'bg-zinc-800 text-[#D4FF00] border border-white/10 shadow-xs font-black'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <span>iPhone / iPad</span>
            </button>
            <button
              onClick={() => setPlatform('android')}
              className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                platform === 'android'
                  ? 'bg-zinc-800 text-[#D4FF00] border border-white/10 shadow-xs font-black'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <span>Android</span>
            </button>
            <button
              onClick={() => setPlatform('desktop')}
              className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                platform === 'desktop'
                  ? 'bg-zinc-800 text-[#D4FF00] border border-white/10 shadow-xs font-black'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <span>PC / Mac</span>
            </button>
          </div>

          {/* iOS Safari Tutorial Guide */}
          {platform === 'ios' && (
            <div className="space-y-3 bg-zinc-900/80 border border-white/[0.08] p-4 rounded-2xl">
              <div className="text-xs font-bold text-[#D4FF00] uppercase tracking-wider flex items-center gap-1.5">
                <Share2 className="w-3.5 h-3.5" />
                <span>Guide d'installation iOS (Safari)</span>
              </div>

              <div className="space-y-3 pt-1">
                {/* Step 1 */}
                <div className="flex items-start gap-3 p-3 bg-zinc-950 rounded-xl border border-white/10">
                  <span className="w-6 h-6 rounded-lg bg-[#D4FF00] text-black font-black text-xs flex items-center justify-center shrink-0">
                    1
                  </span>
                  <div className="text-xs">
                    <span className="text-white font-bold">Ouvrez dans Safari</span>
                    <p className="text-zinc-400 text-[11px] mt-0.5">
                      Puis touchez le bouton <strong>Partager</strong> <span className="inline-block px-1.5 py-0.5 bg-zinc-800 rounded text-zinc-200 font-mono text-[10px]">⎋ Partager</span> en bas de l'écran.
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex items-start gap-3 p-3 bg-zinc-950 rounded-xl border border-white/10">
                  <span className="w-6 h-6 rounded-lg bg-[#D4FF00] text-black font-black text-xs flex items-center justify-center shrink-0">
                    2
                  </span>
                  <div className="text-xs">
                    <span className="text-white font-bold">Sur l'écran d'accueil</span>
                    <p className="text-zinc-400 text-[11px] mt-0.5">
                      Faites défiler la liste vers le bas et touchez <strong className="text-white">"Sur l'écran d'accueil"</strong> <span className="inline-block px-1.5 py-0.5 bg-zinc-800 rounded text-zinc-200 font-mono text-[10px]">➕</span>.
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex items-start gap-3 p-3 bg-zinc-950 rounded-xl border border-white/10">
                  <span className="w-6 h-6 rounded-lg bg-[#D4FF00] text-black font-black text-xs flex items-center justify-center shrink-0">
                    3
                  </span>
                  <div className="text-xs">
                    <span className="text-white font-bold">Confirmez "Ajouter"</span>
                    <p className="text-zinc-400 text-[11px] mt-0.5">
                      Touchez <strong className="text-white">Ajouter</strong> en haut à droite. L'icône PPL Fitness apparaît instantanément sur votre écran d'accueil !
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Android Chrome Tutorial / 1-Click Install */}
          {platform === 'android' && (
            <div className="space-y-3 bg-zinc-900/80 border border-white/[0.08] p-4 rounded-2xl">
              <div className="text-xs font-bold text-[#D4FF00] uppercase tracking-wider flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" />
                <span>Installation Android & Chrome</span>
              </div>

              {deferredPrompt ? (
                <div className="space-y-3 pt-1">
                  <p className="text-xs text-zinc-300">
                    Votre navigateur prend en charge l'installation directe en 1 clic :
                  </p>
                  <button
                    onClick={handleNativeInstall}
                    disabled={installing}
                    className="w-full py-3.5 bg-[#D4FF00] hover:bg-[#b8e600] text-black font-black text-xs rounded-2xl shadow-[0_0_20px_rgba(212,255,0,0.3)] flex items-center justify-center gap-2 transition-transform active:scale-95 uppercase tracking-wider"
                  >
                    <Download className="w-4 h-4" />
                    <span>{installing ? 'Installation...' : 'Installer sur mon téléphone'}</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-3 pt-1">
                  <div className="flex items-start gap-3 p-3 bg-zinc-950 rounded-xl border border-white/10">
                    <span className="w-6 h-6 rounded-lg bg-[#D4FF00] text-black font-black text-xs flex items-center justify-center shrink-0">
                      1
                    </span>
                    <div className="text-xs">
                      <span className="text-white font-bold">Menu du navigateur</span>
                      <p className="text-zinc-400 text-[11px] mt-0.5">
                        Touchez les <strong>3 petits points</strong> <span className="inline-block px-1.5 py-0.5 bg-zinc-800 rounded text-zinc-200 font-mono text-[10px]">⋮</span> en haut à droite de Chrome.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-zinc-950 rounded-xl border border-white/10">
                    <span className="w-6 h-6 rounded-lg bg-[#D4FF00] text-black font-black text-xs flex items-center justify-center shrink-0">
                      2
                    </span>
                    <div className="text-xs">
                      <span className="text-white font-bold">Installer l'application</span>
                      <p className="text-zinc-400 text-[11px] mt-0.5">
                        Appuyez sur <strong className="text-white">"Installer l'application"</strong> ou <strong className="text-white">"Ajouter à l'écran d'accueil"</strong>.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Desktop Tutorial */}
          {platform === 'desktop' && (
            <div className="space-y-3 bg-zinc-900/80 border border-white/[0.08] p-4 rounded-2xl">
              <div className="text-xs font-bold text-[#D4FF00] uppercase tracking-wider flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5" />
                <span>Installation sur PC / Mac</span>
              </div>

              {deferredPrompt ? (
                <div className="space-y-2 pt-1">
                  <p className="text-xs text-zinc-300">
                    Installer PPL Fitness en tant qu'application autonome sur votre ordinateur :
                  </p>
                  <button
                    onClick={handleNativeInstall}
                    disabled={installing}
                    className="w-full py-3.5 bg-[#D4FF00] hover:bg-[#b8e600] text-black font-black text-xs rounded-2xl shadow-[0_0_20px_rgba(212,255,0,0.3)] flex items-center justify-center gap-2 transition-transform active:scale-95 uppercase tracking-wider"
                  >
                    <Download className="w-4 h-4" />
                    <span>{installing ? 'Installation...' : 'Installer sur le bureau'}</span>
                  </button>
                </div>
              ) : (
                <div className="text-xs text-zinc-300 space-y-2 p-3 bg-zinc-950 rounded-xl border border-white/10">
                  <p>
                    Dans Google Chrome ou Microsoft Edge, cliquez sur l'icône <span className="inline-block px-1.5 py-0.5 bg-zinc-800 rounded text-zinc-200 font-mono text-[10px]">⊞ Installer</span> dans la barre d'adresse à droite.
                  </p>
                  <p className="text-[11px] text-zinc-400">
                    L'application s'ouvrira dans sa propre fenêtre indépendante sans barre d'onglets.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Features Highlights */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="p-3 bg-zinc-900/80 border border-white/[0.08] rounded-2xl">
              <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                <Sparkles className="w-3.5 h-3.5 text-[#D4FF00]" />
                <span>Plein Écran Total</span>
              </div>
              <p className="text-[10px] text-zinc-400 mt-1">
                Aucune barre d'URL ni interface navigateur gênante.
              </p>
            </div>

            <div className="p-3 bg-zinc-900/80 border border-white/[0.08] rounded-2xl">
              <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                <ShieldCheck className="w-3.5 h-3.5 text-[#D4FF00]" />
                <span>100% Hors-Ligne</span>
              </div>
              <p className="text-[10px] text-zinc-400 mt-1">
                Fonctionne même sans connexion internet à la salle.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="pt-4 mt-4 border-t border-white/[0.08] flex items-center justify-between">
          <span className="text-[11px] text-zinc-500 font-medium font-mono">
            Vercel / PWA Ready
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold rounded-xl transition-colors border border-white/10"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
