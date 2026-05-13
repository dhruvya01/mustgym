import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShieldCheck, ScrollText, Scale } from 'lucide-react';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TermsModal({ isOpen, onClose }: TermsModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-background/95 backdrop-blur-xl"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-surface-container border border-white/10 w-full max-w-2xl max-h-[80vh] overflow-hidden rounded-2xl shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-surface-container-high">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <ScrollText className="text-primary" size={24} />
                </div>
                <div>
                  <h2 className="font-headline font-black text-xl italic tracking-tighter text-white uppercase">
                    Terms & <span className="text-primary">Conditions</span>
                  </h2>
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Last Updated: April 2026</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-white/5 rounded-lg text-on-surface-variant transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-8 custom-scrollbar">
              <section className="space-y-4">
                <div className="flex items-center gap-2 text-primary">
                  <ShieldCheck size={18} />
                  <h3 className="font-headline font-bold uppercase tracking-widest text-sm italic">1. Acceptance of Terms</h3>
                </div>
                <p className="text-sm text-on-surface-variant leading-relaxed">
                  By accessing and using the MustGym application, you agree to be bound by these Terms and Conditions. If you do not agree with any part of these terms, you must not use our services.
                </p>
              </section>

              <section className="space-y-4">
                <div className="flex items-center gap-2 text-primary">
                  <Scale size={18} />
                  <h3 className="font-headline font-bold uppercase tracking-widest text-sm italic">2. User Responsibilities</h3>
                </div>
                <ul className="space-y-3 text-sm text-on-surface-variant list-disc pl-5">
                  <li>Users must be at least 18 years old or have parental consent.</li>
                  <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
                  <li>You agree to provide accurate and complete information during registration.</li>
                  <li>Any misuse of the digital membership card or QR scanning system may lead to immediate suspension.</li>
                </ul>
              </section>

              <section className="space-y-4">
                <div className="flex items-center gap-2 text-primary">
                  <ShieldCheck size={18} />
                  <h3 className="font-headline font-bold uppercase tracking-widest text-sm italic">3. Health & Safety</h3>
                </div>
                <p className="text-sm text-on-surface-variant leading-relaxed">
                  Exercise involves inherent risks. You acknowledge that you are in good physical condition and have no medical reason or impairment that would prevent you from intended exercise. Consult a physician before starting any new fitness program.
                </p>
              </section>

              <section className="space-y-4">
                <div className="flex items-center gap-2 text-primary">
                  <ScrollText size={18} />
                  <h3 className="font-headline font-bold uppercase tracking-widest text-sm italic">4. Privacy Policy</h3>
                </div>
                <p className="text-sm text-on-surface-variant leading-relaxed">
                  Your privacy is important to us. We collect and process your data (including biometric attendance and workout progress) to provide our services. We do not sell your personal information to third parties.
                </p>
              </section>

              <section className="space-y-4">
                <div className="flex items-center gap-2 text-primary">
                  <ShieldCheck size={18} />
                  <h3 className="font-headline font-bold uppercase tracking-widest text-sm italic">5. Intellectual Property</h3>
                </div>
                <p className="text-sm text-on-surface-variant leading-relaxed">
                  All content, including the app design, workout plans, and branding, is the property of MustGym and its partners. Unauthorized reproduction is strictly prohibited.
                </p>
              </section>

              <div className="p-4 bg-primary/5 rounded-xl border border-primary/10 text-center">
                <p className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">
                  Developed by Dhruvya @ Regulus
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-white/5 bg-surface-container-low flex justify-end">
              <button 
                onClick={onClose}
                className="px-8 py-3 bg-primary text-on-primary-fixed font-headline font-bold uppercase tracking-widest text-xs rounded-lg shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
              >
                I Understand
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
