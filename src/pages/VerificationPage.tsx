import React, { useState } from 'react';
import { auth } from '../lib/firebase';
import { sendEmailVerification, signOut } from 'firebase/auth';
import { motion } from 'motion/react';
import { Mail, RefreshCw, LogOut, CheckCircle } from 'lucide-react';
import { SEO } from '../components/SEO';

export default function VerificationPage() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleResend = async () => {
    if (!auth.currentUser) return;
    setLoading(true);
    setError('');
    try {
      await sendEmailVerification(auth.currentUser);
      setSent(true);
      setTimeout(() => setSent(false), 5000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <SEO title="Verify Email" />
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-surface-container rounded-3xl p-8 border border-white/5 shadow-2xl text-center"
      >
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <Mail className="text-primary" size={40} />
        </div>

        <h1 className="font-headline font-black text-3xl italic tracking-tighter text-white mb-4 uppercase">
          VERIFY YOUR <span className="text-primary">IDENTITY</span>
        </h1>
        
        <p className="text-on-surface-variant text-sm leading-relaxed mb-8">
          We've sent a verification link to <span className="text-white font-bold">{auth.currentUser?.email}</span>. 
          Please check your inbox and click the link to activate your elite profile.
        </p>

        <div className="space-y-4">
          <button 
            onClick={handleRefresh}
            className="w-full kinetic-gradient py-4 rounded-xl font-headline font-extrabold text-on-primary-fixed uppercase tracking-widest text-xs flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
          >
            <CheckCircle size={18} />
            I've Verified My Email
          </button>

          <button 
            onClick={handleResend}
            disabled={loading || sent}
            className="w-full py-4 rounded-xl font-headline font-bold text-primary border border-primary/20 uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-primary/5 transition-all disabled:opacity-50"
          >
            <RefreshCw className={loading ? 'animate-spin' : ''} size={18} />
            {sent ? 'Link Sent!' : 'Resend Verification Link'}
          </button>

          {error && <p className="text-error text-[10px] font-bold uppercase tracking-widest mt-2">{error}</p>}

          <button 
            onClick={() => signOut(auth)}
            className="w-full py-4 rounded-xl font-headline font-bold text-on-surface-variant uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:text-error transition-all"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>

        <div className="mt-8 pt-8 border-t border-white/5 space-y-4">
          <p className="text-[10px] text-outline font-bold uppercase tracking-[0.2em]">
            Check your spam folder if you don't see it
          </p>
          <p className="text-[8px] font-black text-primary/40 uppercase tracking-[0.4em]">
            MADE BY DHRUVYA @ REGULUS
          </p>
        </div>
      </motion.div>
    </div>
  );
}
