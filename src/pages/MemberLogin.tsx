import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, getDoc, setDoc, query, collection, where, getDocs, updateDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { Dumbbell, ArrowRight, Loader2, Key, Phone } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

export default function MemberLogin() {
  const [searchParams] = useSearchParams();
  let initialGymId = searchParams.get('gym') || '';
  
  // Try to extract gymId from redirect path if gym param is missing
  if (!initialGymId) {
    const redirect = searchParams.get('redirect');
    if (redirect) {
      try {
        const url = new URL(redirect, window.location.origin);
        initialGymId = url.searchParams.get('gymId') || url.searchParams.get('gym') || '';
      } catch (e) {
        // Fallback for non-URL paths
        const match = redirect.match(/[?&](gymId|gym)=([^&]+)/);
        if (match) initialGymId = match[2];
      }
    }
  }
  
  const [gymId, setGymId] = useState(initialGymId);
  const [phone, setPhone] = useState('');
  const [gymInfo, setGymInfo] = useState<{ id: string; name: string; logoUrl?: string } | null>(null);
  const [preRegisteredMember, setPreRegisteredMember] = useState<any | null>(null);
  
  const [step, setStep] = useState<'enter_gym' | 'verify_phone' | 'login'>(initialGymId ? 'verify_phone' : 'enter_gym');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (initialGymId) {
      verifyGym(initialGymId);
    }
  }, [initialGymId]);

  const verifyGym = async (idToVerify: string) => {
    if (!idToVerify.trim()) {
      toast.error('Please enter a valid Gym ID');
      return;
    }
    setLoading(true);
    try {
      const docRef = doc(db, 'gyms', idToVerify.trim().toUpperCase());
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setGymInfo({ id: docSnap.id, name: data.name, logoUrl: data.logoUrl });
        setGymId(docSnap.id);
        setStep('verify_phone');
      } else {
        toast.error('Gym not found. Please check the ID and try again.');
      }
    } catch (error: any) {
      toast.error('Error finding gym: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const verifyPhone = async () => {
    if (!phone.trim()) {
       toast.error('Please enter your phone number.');
       return;
    }
    if (!gymInfo) return;

    setLoading(true);
    try {
      // Find member by phone and gymId
      // First try to check `members` collection for pre-registered profile
      const membersQuery = query(
        collection(db, 'members'),
        where('gymId', '==', gymInfo.id),
        where('phone', '==', phone.trim())
      );
      
      const snapshot = await getDocs(membersQuery);
      if (!snapshot.empty) {
        const memberData = snapshot.docs[0].data();
        setPreRegisteredMember({ id: snapshot.docs[0].id, ...memberData });
        setStep('login');
        return;
      }

      // Check if they are already an active user from old system
      const usersQuery = query(
        collection(db, 'users'),
        where('gymId', '==', gymInfo.id),
        where('phoneNumber', '==', phone.trim())
      );
      const userSnap = await getDocs(usersQuery);
      if (!userSnap.empty) {
         setStep('login');
         return;
      }
      
      toast.error("No pre-registered profile found for this phone number. Ask your Gym Owner to invite you.");
    } catch(err: any) {
      toast.error("Error verifying phone: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (!gymInfo) return;
    
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      // Check if user already exists in users collection
      const userRef = doc(db, 'users', result.user.uid);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        if (!preRegisteredMember) {
           toast.error("You cannot sign up without a pre-registered profile.");
           await auth.signOut();
           setLoading(false);
           return;
        }
        
        if (preRegisteredMember.authLinked) {
           toast.error("This phone number is already linked to a different Google account.");
           await auth.signOut();
           setLoading(false);
           return;
        }

        // Link the pre-registered profile
        await updateDoc(doc(db, 'members', preRegisteredMember.id), {
           authLinked: true,
           uid: result.user.uid
        });

        // Create new active member
        await setDoc(userRef, {
          uid: result.user.uid,
          email: result.user.email,
          phoneNumber: phone,
          displayName: preRegisteredMember.fullName || result.user.displayName || "Member",
          photoURL: result.user.photoURL,
          role: 'member',
          gymId: gymInfo.id,
          membershipStatus: 'active',
          membershipType: preRegisteredMember.membershipPlan || 'standard',
          membershipExpiry: preRegisteredMember.expiryDate || null,
          branch: preRegisteredMember.branch || '',
          createdAt: new Date().toISOString()
        });
        toast.success(`Welcome to ${gymInfo.name}! Your account is now active.`);
      } else {
        const data = userSnap.data();
        if (data.gymId !== gymInfo.id) {
          toast.error(`You are already a member of a different gym.`);
          await auth.signOut();
          setLoading(false);
          return;
        }
        
        if (preRegisteredMember && !preRegisteredMember.authLinked) {
            await updateDoc(doc(db, 'members', preRegisteredMember.id), {
               authLinked: true,
               uid: result.user.uid
            });
        }

        if (data.membershipStatus === 'halted') {
          toast.error('Your membership is suspended.');
        } else {
          toast.success('Welcome back!');
        }
      }
      
      const redirectPath = searchParams.get('redirect');
      if (redirectPath) {
        navigate(redirectPath);
      } else {
        // Navigate to gym-specific dashboard
        navigate(`/member-dashboard/${gymInfo.id}`);
      }
      
    } catch (error: any) {
      toast.error('Authentication failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 relative overflow-hidden text-white">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-primary-dim/20 blur-[120px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-surface-container/50 backdrop-blur-xl border border-white/10 rounded-3xl p-8 sm:p-10 shadow-2xl">
          <div className="flex justify-center mb-10">
            {gymInfo?.logoUrl ? (
              <img src={gymInfo.logoUrl} alt={gymInfo.name} className="h-16 w-16 rounded-2xl object-cover border border-white/10" />
            ) : (
              <img src="/logo.svg" alt="MustGym" className="h-16 w-16 rounded-2xl object-cover" />
            )}
          </div>

          <h1 className="text-3xl font-headline font-black text-center mb-2 tracking-tight uppercase italic">
            {gymInfo ? `Join ${gymInfo.name}` : `Member Portal`}
          </h1>
          <p className="text-on-surface-variant text-center mb-8 font-medium">
            {gymInfo ? 'Authenticate to access your dashboard' : 'Enter your Gym ID to continue'}
          </p>

          <AnimatePresence mode="wait">
            {step === 'enter_gym' && (
              <motion.div
                key="enter_gym"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-widest text-on-surface-variant mb-2 ml-1">Gym ID</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Key size={18} className="text-on-surface-variant" />
                    </div>
                    <input
                      type="text"
                      className="w-full bg-black/40 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-mono uppercase"
                      placeholder="MGYM-XXXXX"
                      value={gymId}
                      onChange={(e) => setGymId(e.target.value.toUpperCase())}
                    />
                  </div>
                </div>

                <button
                  onClick={() => verifyGym(gymId)}
                  disabled={loading || !gymId}
                  className="w-full bg-primary text-on-primary-fixed hover:bg-primary-dim py-4 rounded-xl font-black uppercase tracking-widest text-sm transition-all shadow-[0_0_20px_rgba(0,240,255,0.2)] hover:shadow-[0_0_30px_rgba(0,240,255,0.4)] hover:-translate-y-0.5 mt-4 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 size={18} className="animate-spin" /> : <>Continue <ArrowRight size={18} /></>}
                </button>
              </motion.div>
            )}

            {step === 'verify_phone' && (
              <motion.div
                key="verify_phone"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-widest text-on-surface-variant mb-2 ml-1">Your registered Phone Number</label>
                  <div className="relative">
                     <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                       <Phone size={18} className="text-on-surface-variant" />
                     </div>
                     <input
                       type="tel"
                       className="w-full bg-black/40 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-mono"
                       placeholder="e.g. 7006000000"
                       value={phone}
                       onChange={(e) => setPhone(e.target.value)}
                     />
                  </div>
                </div>

                <button
                  onClick={verifyPhone}
                  disabled={loading || !phone}
                  className="w-full bg-primary text-on-primary-fixed hover:bg-primary-dim py-4 rounded-xl font-black uppercase tracking-widest text-sm transition-all shadow-[0_0_20px_rgba(0,240,255,0.2)] hover:shadow-[0_0_30px_rgba(0,240,255,0.4)] hover:-translate-y-0.5 mt-4 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 size={18} className="animate-spin" /> : <>Verify <ArrowRight size={18} /></>}
                </button>
                <button 
                  onClick={() => setStep('enter_gym')}
                  className="w-full text-center text-xs text-on-surface-variant hover:text-white mt-4 uppercase tracking-widest font-bold"
                >
                  Wrong Gym? Go Back
                </button>
              </motion.div>
            )}

            {step === 'login' && gymInfo && (
              <motion.div
                key="login"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                {preRegisteredMember && (
                  <div className="p-4 rounded-xl border border-white/10 bg-white/5 mb-6 text-center">
                    <p className="text-sm font-bold">Profile Found!</p>
                    <p className="text-xs text-on-surface-variant mt-1">Hello, {preRegisteredMember.fullName}.<br/>Link your Google account to activate.</p>
                  </div>
                )}

                <div className="relative flex items-center justify-center my-8">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
                  <div className="relative bg-[#050505] px-4 text-xs font-bold uppercase tracking-widest text-on-surface-variant">Secure Login</div>
                </div>

                <button
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="w-full bg-white text-black hover:bg-gray-100 py-4 px-6 rounded-xl font-bold transition-all shadow-xl hover:-translate-y-0.5 flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {loading ? <Loader2 size={24} className="animate-spin text-black" /> : (
                    <>
                      <svg className="w-6 h-6" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                      </svg>
                      Continue with Google
                    </>
                  )}
                </button>
                
                <button 
                  onClick={() => setStep('verify_phone')}
                  className="w-full text-center text-xs text-on-surface-variant hover:text-white mt-4 uppercase tracking-widest font-bold"
                >
                  Go Back
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
