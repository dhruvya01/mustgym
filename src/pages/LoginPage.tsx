import React, { useState } from 'react';
import { signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { motion, AnimatePresence } from 'motion/react';
import { Chrome, Lock, Mail } from 'lucide-react';
import { cn } from '../lib/utils';
import { SEO } from '../components/SEO';
import { TermsModal } from '../components/TermsModal';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export default function LoginPage() {
  const [error, setError] = useState('');
  const [showTerms, setShowTerms] = useState(false);
  
  // Extract gym parameter from URL if it exists
  const gymParams = new URLSearchParams(window.location.search);
  const initialGymParam = gymParams.get('gym') || '';
  
  const [activePortal, setActivePortal] = useState<'member' | 'owner'>(initialGymParam ? 'member' : 'member');
  const [gymId, setGymId] = useState(initialGymParam.toUpperCase());
  
  // Owner Login State
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('');

  const handleGoogleLogin = async () => {
    try {
      if (activePortal === 'member' && gymId) {
        sessionStorage.setItem('pending_gym_id', gymId);
      } else {
        sessionStorage.removeItem('pending_gym_id');
      }
      
      // Also store intent for onboarding
      sessionStorage.setItem('portal_intent', activePortal);

      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      if (err.code === 'auth/operation-not-allowed') {
        setError('Google Sign-In is not enabled in your Firebase Console.');
      } else {
        setError(err.message);
      }
    }
  };

  const handleOwnerLogin = async () => {
    try {
      setError('');
      sessionStorage.setItem('portal_intent', 'owner');
      await signInWithEmailAndPassword(auth, ownerEmail, ownerPassword);
    } catch (err: any) {
      if (err.code === 'auth/invalid-credential') {
        setError('Invalid email or password.');
      } else {
        setError(err.message);
      }
    }
  };

  const handleOwnerSignup = async () => {
    try {
      setError('');
      sessionStorage.setItem('portal_intent', 'owner');
      const userCredential = await createUserWithEmailAndPassword(auth, ownerEmail, ownerPassword);
      // Let the Onboarding components handle creating the firestore profile.
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <main className="min-h-screen flex flex-col md:flex-row relative overflow-hidden bg-mesh">
      <SEO title="Login" />
      
      {/* Visual Side */}
      <div className="hidden md:flex md:w-5/12 relative items-center justify-center p-12 overflow-hidden border-r border-white/5">
        <div className="absolute inset-0 z-0">
          <img 
            className="w-full h-full object-cover opacity-30 grayscale" 
            src="https://picsum.photos/seed/gym/1920/1080?grayscale" 
            alt="Gym Interior"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent"></div>
        </div>
        <div className="relative z-10 w-full">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h1 className="font-headline font-black text-6xl lg:text-8xl italic tracking-tighter text-white leading-none mb-6">
              MUST<br/><span className="text-primary italic">GYM</span>
            </h1>
            <div className="h-1 w-20 bg-primary mb-8" />
            <p className="text-on-surface-variant font-headline font-bold text-sm uppercase tracking-[0.2em] max-w-xs leading-relaxed">
              Multi-Gym Management <br/>& Elite Performance Tracking.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Auth Side */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 z-10">
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-md"
        >
          <div className="md:hidden mb-12 flex justify-center">
            <h1 className="font-headline font-black text-4xl italic tracking-tighter text-primary">MUSTGYM</h1>
          </div>
          
          <div className="mb-10 text-center md:text-left">
            <h2 className="font-headline font-black text-3xl sm:text-4xl tracking-tighter mb-2 uppercase italic">
              Access <span className="text-primary">Portal</span>
            </h2>
            <p className="text-on-surface-variant text-[10px] font-bold uppercase tracking-[0.2em]">
              Select your entrance to the system
            </p>
          </div>

          {/* Portal Switcher */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-surface-container rounded-xl mb-8">
            <button 
              onClick={() => setActivePortal('member')}
              className={cn(
                "py-3 rounded-lg font-headline font-bold text-[10px] uppercase tracking-widest transition-all",
                activePortal === 'member' ? "bg-primary text-on-primary-fixed shadow-lg shadow-primary/20" : "text-on-surface-variant hover:text-white"
              )}
            >
              Member Portal
            </button>
            <button 
              onClick={() => setActivePortal('owner')}
              className={cn(
                "py-3 rounded-lg font-headline font-bold text-[10px] uppercase tracking-widest transition-all",
                activePortal === 'owner' ? "bg-primary text-on-primary-fixed shadow-lg shadow-primary/20" : "text-on-surface-variant hover:text-white"
              )}
            >
              Owner Portal
            </button>
          </div>

          <div className="space-y-6">
            <AnimatePresence mode="wait">
              {activePortal === 'member' ? (
                <motion.div 
                  key="member"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  <div className="bg-surface-container-low p-6 rounded-2xl border border-white/5">
                    <label className="block text-[10px] font-bold text-primary uppercase tracking-[0.2em] mb-3 ml-1">Establishment ID</label>
                    <input 
                      type="text"
                      placeholder="e.g. GYM-XXXXXX"
                      value={gymId}
                      onChange={(e) => setGymId(e.target.value.toUpperCase())}
                      className="w-full bg-surface-container-highest border border-white/5 rounded-xl py-4 px-4 text-white font-headline font-bold focus:outline-none focus:border-primary/50 transition-all uppercase tracking-widest text-center placeholder:text-outline-variant"
                    />
                    <p className="text-[9px] text-on-surface-variant mt-3 text-center uppercase tracking-tighter font-medium">
                      Enter the ID provided by your gym to sync your data.
                    </p>
                  </div>
                  
                  <button 
                    onClick={handleGoogleLogin}
                    disabled={!gymId}
                    className="flex items-center justify-center gap-4 w-full py-5 bg-white text-black rounded-xl hover:bg-primary transition-all group active:scale-[0.98] disabled:opacity-50 disabled:grayscale"
                  >
                    <Chrome size={24} className="group-hover:scale-110 transition-transform" />
                    <span className="text-sm font-black uppercase italic tracking-tighter">Enter Member Portal</span>
                  </button>
                </motion.div>
              ) : (
                <motion.div 
                  key="owner"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                >
                  <div className="bg-surface-container-low p-6 rounded-2xl border border-white/5 space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-primary uppercase tracking-[0.2em] mb-3 ml-1">Admin Email</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <Mail size={18} className="text-outline-variant" />
                        </div>
                        <input 
                          type="email"
                          placeholder="owner@gym.com"
                          value={ownerEmail}
                          onChange={(e) => setOwnerEmail(e.target.value)}
                          className="w-full bg-surface-container-highest border border-white/5 rounded-xl py-4 pl-12 pr-4 text-white font-headline text-sm focus:outline-none focus:border-primary/50 transition-all placeholder:text-outline-variant"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-primary uppercase tracking-[0.2em] mb-3 ml-1">Password</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <Lock size={18} className="text-outline-variant" />
                        </div>
                        <input 
                          type="password"
                          placeholder="••••••••"
                          value={ownerPassword}
                          onChange={(e) => setOwnerPassword(e.target.value)}
                          className="w-full bg-surface-container-highest border border-white/5 rounded-xl py-4 pl-12 pr-4 text-white font-headline text-sm focus:outline-none focus:border-primary/50 transition-all placeholder:text-outline-variant"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <button 
                    onClick={handleOwnerLogin}
                    disabled={!ownerEmail || !ownerPassword}
                    className="flex items-center justify-center gap-4 w-full py-5 bg-primary text-on-primary-fixed rounded-xl hover:bg-primary-bright transition-all group active:scale-[0.98] shadow-2xl shadow-primary/20 disabled:opacity-50"
                  >
                    <span className="text-sm font-black uppercase italic tracking-tighter">Owner Login</span>
                  </button>

                  <button 
                    onClick={handleOwnerSignup}
                    disabled={!ownerEmail || !ownerPassword}
                    className="flex items-center justify-center gap-4 w-full py-3 border border-white/10 text-white rounded-xl hover:bg-white/5 transition-all group active:scale-[0.98] disabled:opacity-50"
                  >
                    <span className="text-xs font-bold uppercase tracking-widest text-[10px]">Create Account</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {error && (
              <div className="p-4 bg-error/10 border border-error/20 rounded-lg">
                <p className="text-error text-xs font-bold uppercase tracking-widest text-center leading-relaxed">
                  {error}
                </p>
              </div>
            )}
          </div>

          <div className="mt-12 text-center opacity-40">
            <p className="text-[10px] text-outline-variant font-bold uppercase tracking-widest leading-relaxed">
              Encrypted Auth Pipeline <br/> Secure Performance Logging Enabled
            </p>
          </div>
        </motion.div>
      </div>

      <footer className="fixed bottom-6 left-6 right-6 flex flex-col sm:flex-row justify-between items-center gap-4 pointer-events-none">
        <div className="flex flex-col items-center sm:items-start">
          <div className="text-[10px] font-bold text-outline-variant uppercase tracking-[0.3em]">
            MULTIGYM_SUPPORT_v3.0
          </div>
        </div>
        <div className="flex gap-6 pointer-events-auto">
          <button 
            onClick={() => setShowTerms(true)}
            className="text-[10px] font-bold text-outline-variant hover:text-primary transition-colors uppercase tracking-[0.2em]"
          >
            TERMS & PRIVACY
          </button>
        </div>
      </footer>

      <TermsModal isOpen={showTerms} onClose={() => setShowTerms(false)} />
    </main>
  );
}
