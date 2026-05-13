import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Only show if the user hasn't dismissed it recently
      try {
        const dismissed = localStorage.getItem('pwa-prompt-dismissed');
        if (!dismissed) {
          setIsVisible(true);
        }
      } catch (err) {
        // If localStorage is blocked, just show it
        setIsVisible(true);
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
      setDeferredPrompt(null);
      setIsVisible(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    try {
      localStorage.setItem('pwa-prompt-dismissed', 'true');
    } catch (err) {
      console.warn('LocalStorage blocked, cannot save PWA prompt dismissal');
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-6 left-6 right-6 z-[100] md:left-auto md:right-8 md:bottom-8 md:w-96"
        >
          <div className="bg-surface-container-high border border-white/10 rounded-3xl p-5 shadow-2xl backdrop-blur-xl relative overflow-hidden">
            {/* Background Accent */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
            
            <button 
              onClick={handleDismiss}
              className="absolute top-3 right-3 p-2 text-on-surface-variant hover:text-on-surface transition-colors"
            >
              <X size={18} />
            </button>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-on-primary-fixed shadow-lg shadow-primary/20 shrink-0">
                <Smartphone size={24} />
              </div>
              
              <div className="flex-1 pr-6">
                <h3 className="font-headline font-bold text-on-surface text-lg leading-tight mb-1">
                  Install MustGym
                </h3>
                <p className="text-on-surface-variant text-xs leading-relaxed">
                  Add to your home screen for the full elite experience and faster access.
                </p>
              </div>
            </div>

            <div className="mt-5 flex gap-3">
              <button
                onClick={handleInstall}
                className="flex-1 kinetic-gradient py-3 rounded-xl font-headline font-bold uppercase tracking-widest text-[10px] text-on-primary-fixed flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"
              >
                <Download size={14} />
                Install App
              </button>
              <button
                onClick={handleDismiss}
                className="px-5 py-3 rounded-xl bg-surface-container-highest text-on-surface-variant font-headline font-bold uppercase tracking-widest text-[10px] hover:bg-white/5 transition-colors"
              >
                Later
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
