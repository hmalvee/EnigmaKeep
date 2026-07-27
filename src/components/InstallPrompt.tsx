import { useState, useEffect } from 'react';
import { Download, X, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);

      const dismissed = localStorage.getItem('pwa_install_dismissed');
      const dismissedTime = dismissed ? parseInt(dismissed) : 0;
      const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);

      if (!dismissed || daysSinceDismissed > 7) {
        setTimeout(() => setShowPrompt(true), 5000);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();

    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('PWA installed');
    }

    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    localStorage.setItem('pwa_install_dismissed', Date.now().toString());
    setShowPrompt(false);
  };

  if (!showPrompt || !deferredPrompt) return null;

  return (
    <div className="fixed bottom-6 left-6 right-6 md:left-auto md:right-6 md:w-96 z-50 animate-slideIn">
      <div className="bg-surface border border-line rounded-2xl shadow-2xl p-6">
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 p-1 text-muted hover:text-ink transition-colors"
        >
          <X size={18} />
        </button>

        <div className="flex items-start gap-4 mb-4">
          <div className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center flex-shrink-0">
            <Smartphone className="text-accent-ink" size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-ink mb-1">Install EnigmaKeep</h3>
            <p className="text-sm text-muted">
              Add to your home screen for quick access and offline support
            </p>
          </div>
        </div>

        <div className="space-y-2 mb-4 text-sm text-muted">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-accent rounded-full"></div>
            <span>Works offline</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-accent rounded-full"></div>
            <span>Faster loading</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-accent rounded-full"></div>
            <span>App-like experience</span>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleDismiss}
            className="btn-ghost flex-1"
          >
            Maybe Later
          </button>
          <button
            onClick={handleInstall}
            className="btn-primary flex-1 gap-2"
          >
            <Download size={18} />
            Install
          </button>
        </div>
      </div>
    </div>
  );
}
