import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { motion } from 'motion/react';
import { Lock, Eye, EyeOff, ArrowRight, Zap, CheckCircle2 } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { toast } from 'sonner';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const oobCode = searchParams.get('oobCode');
  const navigate = useNavigate();
  
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oobCode) {
      setError('Invalid or missing reset code. Please try resetting your password again.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Optional: Verify the code first (it throws if invalid/expired)
      await verifyPasswordResetCode(auth, oobCode);
      
      // Confirm the new password
      await confirmPasswordReset(auth, oobCode, newPassword);
      
      setIsSuccess(true);
      toast.success('Password reset successfully!');
      
      // After a short delay, redirect to login
      setTimeout(() => {
        navigate('/login');
      }, 3000);
      
    } catch (err: any) {
      setError(err.message || 'Failed to reset password. The link might be expired or invalid.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <Helmet>
        <title>Reset Password | MUSTGYM</title>
      </Helmet>

      {/* Decorative Effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-surface-container/50 backdrop-blur-xl border border-white/10 rounded-3xl p-8 sm:p-10 shadow-2xl">
          <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mb-6 mx-auto">
            <Lock className="text-primary" size={32} />
          </div>
          
          <h2 className="text-2xl sm:text-3xl font-headline font-black text-center text-white mb-2 uppercase italic tracking-tighter">
            New <span className="text-primary">Password</span>
          </h2>
          
          <p className="text-on-surface-variant text-center mb-8 text-sm">
            {isSuccess 
              ? "Your password has been successfully updated!" 
              : "Please enter your new password below."}
          </p>

          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }} 
              animate={{ opacity: 1, height: 'auto' }} 
              className="bg-error/10 border border-error/20 text-error px-4 py-3 rounded-xl mb-6 text-sm"
            >
              {error}
            </motion.div>
          )}

          {isSuccess ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-6"
            >
              <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-6">
                <CheckCircle2 size={40} className="text-green-500" />
              </div>
              <p className="text-on-surface-variant text-sm mb-6">Redirecting to login...</p>
              <button 
                onClick={() => navigate('/login')}
                className="w-full py-4 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold uppercase tracking-widest text-sm transition-all"
              >
                Back to Login
              </button>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block">
                  New Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-on-surface-variant group-focus-within:text-primary transition-colors">
                    <Lock size={20} />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-black/20 border border-white/10 text-white placeholder-on-surface-variant/50 text-sm rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none pl-12 pr-12 py-3.5 transition-all"
                    placeholder="At least 6 characters"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-on-surface-variant hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isLoading}
                className="w-full py-4 bg-primary hover:bg-primary-dim text-on-primary-fixed rounded-xl font-black uppercase tracking-widest text-sm transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-on-primary-fixed border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Zap size={18} className="text-on-primary-fixed group-hover:animate-pulse" />
                    Reset Password
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </motion.button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
