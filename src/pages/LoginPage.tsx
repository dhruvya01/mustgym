import React, { useState } from 'react';
import { signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { motion, AnimatePresence } from 'motion/react';
import { Chrome, Lock, Mail, ArrowLeft, Zap } from 'lucide-react';
import { cn } from '../lib/utils';
import { SEO } from '../components/SEO';
import { TermsModal } from '../components/TermsModal';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Link } from 'react-router-dom';

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

  const [showPlans, setShowPlans] = useState(false);

  const [resetMessage, setResetMessage] = useState('');

  const handlePasswordReset = async () => {
    if (!ownerEmail) {
      setError('Please enter your admin email to reset your password.');
      return;
    }
    try {
      setError('');
      setResetMessage('');
      
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: ownerEmail })
      });
      
      const responseText = await response.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        // Fallback to Firebase's default email if the backend isn't there (e.g., on Firebase Hosting)
        console.warn('Backend API not found. Falling back to default Firebase Auth.');
        const { sendPasswordResetEmail } = await import('firebase/auth');
        await sendPasswordResetEmail(auth, ownerEmail);
        setResetMessage('Password reset email sent. Please check your inbox.');
        return;
      }
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send password reset email.');
      }
      
      setResetMessage('Password reset email sent. Please check your inbox.');
    } catch (err: any) {
      setError(err.message || 'Error connecting to the server.');
    }
  };

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

  return (
    <main className="min-h-screen flex flex-col md:flex-row relative overflow-hidden bg-[#050505] selection:bg-[#00f0ff]/30 selection:text-white">
      <SEO title="Login | MustGym" />
      
      {/* Glowing Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#00f0ff]/10 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#39ff14]/5 rounded-full blur-[120px] pointer-events-none z-0" />

      {/* Visual Side */}
      <div className="hidden md:flex md:w-5/12 relative items-center justify-center p-12 overflow-hidden border-r border-white/5 bg-[#0a0a0a]">
        <div className="absolute inset-0 z-0">
          <img 
            className="w-full h-full object-cover opacity-20 grayscale mix-blend-overlay" 
            src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1470&auto=format&fit=crop" 
            alt="Gym Interior"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/80 to-transparent"></div>
        </div>
        <div className="relative z-10 w-full">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h1 className="font-headline font-black text-6xl lg:text-8xl italic tracking-tighter text-white leading-none mb-6">
              MUST<br/><span className="text-[#00f0ff]">GYM</span>
            </h1>
            <div className="flex items-center gap-2 mb-8">
              <Zap className="text-[#39ff14]" size={24} />
              <div className="h-1 w-20 bg-gradient-to-r from-[#00f0ff] to-[#39ff14]" />
            </div>
            <p className="text-gray-400 font-bold text-sm uppercase tracking-[0.2em] max-w-xs leading-relaxed">
              Run Your Gym <br/>Without a Reception Desk.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Auth Side */}
      <div className="flex-1 flex flex-col p-6 md:p-12 z-10 relative">
        <div className="w-full max-w-md mx-auto flex-1 flex flex-col justify-center">
          
          <Link 
            to="/" 
            className="absolute top-6 left-6 md:top-12 flex items-center gap-2 text-gray-500 hover:text-white transition-colors font-bold text-xs uppercase tracking-widest"
          >
            <ArrowLeft size={16} />
            Back to Home
          </Link>
          
          <div className="md:hidden mt-12 mb-12 flex justify-center">
            <h1 className="font-headline font-black text-4xl italic tracking-tighter text-white">MUST<span className="text-[#00f0ff]">GYM</span></h1>
          </div>
          
          <div className="mb-10 text-center md:text-left">
            <h2 className="font-headline font-black text-3xl sm:text-4xl tracking-tighter mb-2 text-white">
              Access <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00f0ff] to-[#39ff14]">Portal</span>
            </h2>
            <p className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.2em]">
              Select your entrance to the system
            </p>
          </div>

          {/* Portal Switcher */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-white/5 rounded-xl border border-white/10 mb-8">
            <button 
              onClick={() => setActivePortal('member')}
              className={cn(
                "py-3 rounded-lg font-bold text-[10px] uppercase tracking-widest transition-all",
                activePortal === 'member' ? "bg-[#111] text-white shadow-lg border border-white/10" : "text-gray-500 hover:text-white"
              )}
            >
              Member Portal
            </button>
            <button 
              onClick={() => setActivePortal('owner')}
              className={cn(
                "py-3 rounded-lg font-bold text-[10px] uppercase tracking-widest transition-all",
                activePortal === 'owner' ? "bg-[#111] text-white shadow-lg border border-white/10" : "text-gray-500 hover:text-white"
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
                  <div className="bg-[#111] p-6 rounded-2xl border border-white/5">
                    <label className="block text-[10px] font-bold text-[#00f0ff] uppercase tracking-[0.2em] mb-3 ml-1">Establishment ID</label>
                    <input 
                      type="text"
                      placeholder="e.g. GYM-XXXXXX"
                      value={gymId}
                      onChange={(e) => setGymId(e.target.value.toUpperCase())}
                      className="w-full bg-[#050505] border border-white/10 rounded-xl py-4 px-4 text-white font-bold focus:outline-none focus:border-[#00f0ff]/50 transition-all uppercase tracking-widest text-center placeholder:text-gray-600"
                    />
                    <p className="text-[9px] text-gray-500 mt-3 text-center uppercase tracking-tighter font-medium">
                      Enter the ID provided by your gym to sync your data.
                    </p>
                  </div>
                  
                  <button 
                    onClick={handleGoogleLogin}
                    disabled={!gymId}
                    className="flex items-center justify-center gap-4 w-full py-5 bg-[#00f0ff] text-black rounded-xl hover:bg-[#00d0ff] transition-all group active:scale-[0.98] shadow-[0_0_20px_rgba(0,240,255,0.2)] disabled:opacity-50 disabled:grayscale"
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
                    {showPlans ? (
                      <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                        {/* Starter */}
                        <div className="bg-[#111] p-6 rounded-2xl border border-white/5 relative overflow-hidden transition-all hover:border-gray-500">
                          <h3 className="text-white font-bold text-lg mb-1 tracking-wide uppercase">Starter</h3>
                          <p className="text-gray-500 text-xs mb-3">Perfect for boutique gyms just getting started.</p>
                          <div className="text-2xl font-black text-white mb-4">
                            ₹999<span className="text-xs text-gray-500 font-bold">/mo</span>
                          </div>
                          <ul className="text-left text-xs space-y-2 mb-6 text-gray-400">
                            <li className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-gray-500" /> QR Check-ins & Attendance</li>
                            <li className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-gray-500" /> Up to 100 members</li>
                            <li className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-gray-500" /> Admin Dashboard</li>
                          </ul>
                          <a 
                            href="https://wa.me/917889686144?text=Hi!%20I%20want%20to%20subscribe%20to%20MustGym%20STARTER%20plan%20and%20get%20my%20owner%20account."
                            target="_blank" rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 w-full py-3 bg-white/5 text-white border border-white/10 rounded-xl hover:bg-white/10 transition-all font-bold tracking-wide"
                          >
                            Continue
                          </a>
                        </div>

                        {/* Pro */}
                        <div className="bg-[#111] p-6 rounded-2xl border border-[#00f0ff]/30 text-center relative overflow-hidden">
                          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#00f0ff] to-[#00d0ff]" />
                          <div className="absolute top-2 right-2 bg-[#00f0ff] text-black px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest">Popular</div>
                          <h3 className="text-white font-bold text-lg mb-1 text-left tracking-wide uppercase text-[#00f0ff]">Pro</h3>
                          <p className="text-gray-400 text-xs mb-3 text-left">For growing establishments seeking deeper insights.</p>
                          <div className="text-2xl font-black text-[#00f0ff] mb-4 text-left">
                            ₹1,999<span className="text-xs text-gray-500 font-bold">/mo</span>
                          </div>
                          <ul className="text-left text-xs space-y-2 mb-6 text-gray-300">
                            <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#00f0ff]" /> Everything in Starter</li>
                            <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#00f0ff]" /> Live Occupancy Tracking</li>
                            <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#00f0ff]" /> AI Workout Generator</li>
                            <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#00f0ff]" /> Gamification & Streaks</li>
                          </ul>
                          <a 
                            href="https://wa.me/917889686144?text=Hi!%20I%20want%20to%20subscribe%20to%20MustGym%20PRO%20plan%20and%20get%20my%20owner%20account."
                            target="_blank" rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 w-full py-3 bg-[#00f0ff] text-black rounded-xl hover:bg-[#00d0ff] shadow-[0_4px_20px_rgba(0,240,255,0.2)] transition-all font-bold tracking-wide"
                          >
                            Continue
                          </a>
                        </div>

                        {/* Elite */}
                        <div className="bg-[#111] p-6 rounded-2xl border border-white/5 relative overflow-hidden transition-all hover:border-[#39ff14]/40">
                          <h3 className="text-white font-bold text-lg mb-1 tracking-wide uppercase text-[#39ff14]">Elite</h3>
                          <p className="text-gray-500 text-xs mb-3">Advanced AI tools for multi-location empires.</p>
                          <div className="text-2xl font-black text-white mb-4">
                            ₹4,999<span className="text-xs text-gray-500 font-bold">/mo</span>
                          </div>
                          <ul className="text-left text-xs space-y-2 mb-6 text-gray-400">
                            <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#39ff14]" /> Everything in Pro</li>
                            <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#39ff14]" /> Unlimited Members</li>
                            <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#39ff14]" /> Multi-location support</li>
                            <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#39ff14]" /> Custom White-label setup</li>
                          </ul>
                          <a 
                            href="https://wa.me/917889686144?text=Hi!%20I%20want%20to%20subscribe%20to%20MustGym%20ELITE%20plan%20and%20get%20my%20owner%20account."
                            target="_blank" rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 w-full py-3 bg-white/5 text-white border border-white/10 hover:border-[#39ff14]/30 hover:text-[#39ff14] rounded-xl transition-all font-bold tracking-wide"
                          >
                            Continue
                          </a>
                        </div>

                        <button
                          onClick={() => setShowPlans(false)}
                          className="w-full text-center text-xs text-gray-500 hover:text-white uppercase tracking-widest font-bold py-2 mt-2 sticky bottom-0 bg-[#050505] pb-4"
                        >
                          Back to Login
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="bg-[#111] p-6 rounded-2xl border border-white/5 space-y-4">
                          <div>
                            <label className="block text-[10px] font-bold text-[#00f0ff] uppercase tracking-[0.2em] mb-3 ml-1">Admin Email</label>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Mail size={18} className="text-gray-500" />
                              </div>
                              <input 
                                type="email"
                                placeholder="owner@gym.com"
                                value={ownerEmail}
                                onChange={(e) => setOwnerEmail(e.target.value)}
                                className="w-full bg-[#050505] border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white font-headline text-sm focus:outline-none focus:border-[#00f0ff]/50 transition-all placeholder:text-gray-600"
                              />
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between items-center mb-3 ml-1">
                              <label className="block text-[10px] font-bold text-[#00f0ff] uppercase tracking-[0.2em] mb-0">Password</label>
                              <button 
                                onClick={handlePasswordReset}
                                className="text-[10px] text-gray-500 hover:text-white transition-colors"
                              >
                                Forgot?
                              </button>
                            </div>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Lock size={18} className="text-gray-500" />
                              </div>
                              <input 
                                type="password"
                                placeholder="••••••••"
                                value={ownerPassword}
                                onChange={(e) => setOwnerPassword(e.target.value)}
                                className="w-full bg-[#050505] border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white font-headline text-sm focus:outline-none focus:border-[#00f0ff]/50 transition-all placeholder:text-gray-600"
                              />
                            </div>
                            {resetMessage && (
                              <p className="text-[10px] text-[#39ff14] mt-2 ml-1">{resetMessage}</p>
                            )}
                          </div>
                        </div>
                        
                        <button 
                          onClick={handleOwnerLogin}
                          disabled={!ownerEmail || !ownerPassword}
                          className="flex items-center justify-center gap-4 w-full py-5 bg-[#00f0ff] text-black rounded-xl hover:bg-[#00d0ff] transition-all group active:scale-[0.98] shadow-[0_0_20px_rgba(0,240,255,0.2)] disabled:opacity-50 disabled:grayscale"
                        >
                          <span className="text-sm font-black uppercase italic tracking-tighter">Owner Login</span>
                        </button>

                        <button 
                          onClick={() => setShowPlans(true)}
                          className="flex items-center justify-center gap-4 w-full py-3 border border-white/10 text-white rounded-xl hover:bg-white/5 transition-all group active:scale-[0.98]"
                        >
                          <span className="text-xs font-bold uppercase tracking-widest text-[10px]">View Subscription Plans</span>
                        </button>
                      </>
                    )}
                </motion.div>
              )}
            </AnimatePresence>

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-red-400 text-xs font-bold uppercase tracking-widest text-center leading-relaxed">
                  {error}
                </p>
              </div>
            )}
          </div>

          <div className="mt-12 text-center opacity-40">
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-relaxed">
              Encrypted Auth Pipeline <br/> Secure Performance Logging Enabled
            </p>
          </div>
        </div>
      </div>

      <footer className="fixed bottom-6 left-6 right-6 flex flex-col sm:flex-row justify-between items-center gap-4 pointer-events-none z-10">
        <div className="flex flex-col items-center sm:items-start">
          <div className="text-[10px] font-bold text-gray-600 uppercase tracking-[0.3em]">
            MULTIGYM_SUPPORT_v3.0
          </div>
        </div>
        <div className="flex gap-6 pointer-events-auto">
          <button 
            onClick={() => setShowTerms(true)}
            className="text-[10px] font-bold text-gray-500 hover:text-[#00f0ff] transition-colors uppercase tracking-[0.2em]"
          >
            TERMS & PRIVACY
          </button>
        </div>
      </footer>

      <TermsModal isOpen={showTerms} onClose={() => setShowTerms(false)} />
    </main>
  );
}
