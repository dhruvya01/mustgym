import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, addDoc, deleteDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { ShieldCheck, Smartphone, Loader2, ArrowLeft, Dumbbell, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { SEO } from '../components/SEO';

export default function DemoPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [seedingText, setSeedingText] = useState('');

  const subtractDays = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d;
  };

  const seedDemoDatabase = async (ownerUid: string, memberUid: string) => {
    try {
      const gymId = 'DEMO_' + ownerUid;
      
      setSeedingText('Preparing isolated gym database sandbox...');
      const gymRef = doc(db, 'gyms', gymId);
      const gymSnap = await getDoc(gymRef);
      
      if (!gymSnap.exists()) {
        setSeedingText('Initializing interactive gym templates...');
        await setDoc(gymRef, {
          name: "Iron Forge Arena (Demo)",
          ownerId: ownerUid,
          logoUrl: "/logo.svg",
          branchName: "Koramangala HQ",
          address: "80 Feet Rd, Bengaluru",
          city: "Bengaluru",
          state: "Karnataka",
          phone: "+91 98765 00000",
          whatsapp: "+91 98765 00000",
          email: "ironforge-demo@mustgym.com",
          capacity: 100,
          openTimings: "05:00 AM",
          closeTimings: "10:00 PM",
          themeId: "kinetic-orange",
          subscriptionTier: "elite",
          subscriptionStatus: "active",
          createdAt: new Date().toISOString()
        });

        await setDoc(doc(db, 'users', ownerUid), {
          uid: ownerUid,
          email: 'dhruvyamalhotra143@gmail.com',
          displayName: 'Demo Gym Owner',
          role: 'owner',
          gymId: gymId,
          createdAt: new Date().toISOString()
        });

        await setDoc(doc(db, 'users', memberUid), {
          uid: memberUid,
          email: 'demo-member@mustgym.com',
          displayName: 'Vikram Sharma',
          role: 'member',
          gymId: gymId,
          membershipStatus: 'active',
          membershipType: 'elite',
          membershipExpiry: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          phoneNumber: '9876543210',
          currentWeight: 78,
          height: '180 cm',
          goal: 'Clean Bulk & Muscle Gym',
          xp: 640,
          attendanceStreak: 6,
          createdAt: subtractDays(30).toISOString()
        });

        // 4. Create secondary gym members
        const mockMems = [
          { uid: 'DEMO_M1_' + ownerUid, name: 'Priya Sharma', phone: '9812345678', xp: 250, streak: 3 },
          { uid: 'DEMO_M2_' + ownerUid, name: 'Sneha Mehta', phone: '9988776655', xp: 480, streak: 5 },
          { uid: 'DEMO_M3_' + ownerUid, name: 'Kabir Dev', phone: '9123456789', xp: 120, streak: 1 }
        ];

        for (const m of mockMems) {
          await setDoc(doc(db, 'users', m.uid), {
            uid: m.uid,
            email: `${m.name.toLowerCase().replace(/\s+/g, '')}@gmail.com`,
            displayName: m.name,
            role: 'member',
            gymId: gymId,
            membershipStatus: 'active',
            membershipType: 'standard',
            membershipExpiry: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            phoneNumber: m.phone,
            currentWeight: 65,
            height: '170 cm',
            goal: 'General Wellness',
            xp: m.xp,
            attendanceStreak: m.streak,
            createdAt: subtractDays(20).toISOString()
          });

          await setDoc(doc(db, 'members', 'PRE_' + m.uid), {
            gymId: gymId,
            fullName: m.name,
            phone: m.phone,
            membershipPlan: 'Standard',
            expiryDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            branch: 'Koramangala HQ',
            authLinked: true,
            uid: m.uid,
            createdAt: subtractDays(20).toISOString()
          });
        }

        setSeedingText('Configuring fitness equipment telemetry analytics...');
        const equipmentData = [
          { name: 'Commercial Treadmill Alpha', category: 'Cardio', status: 'Working' },
          { name: 'Commercial Elliptical Pro', category: 'Cardio', status: 'Working' },
          { name: 'Smith Chest Press Machine', category: 'Strength', status: 'Working' },
          { name: 'Aesthetic Pec Dec Fly', category: 'Strength', status: 'Maintenance' }
        ];

        for (const [idx, eq] of equipmentData.entries()) {
          const eqId = `EQ_DEMO_${idx}_${ownerUid}`;
          await setDoc(doc(db, 'equipment', eqId), {
            id: eqId,
            name: eq.name,
            gymId: gymId,
            category: eq.category,
            status: eq.status,
            lastMaintained: subtractDays(2).toISOString(),
            createdAt: subtractDays(30).toISOString()
          });
        }

        setSeedingText('Generating fiscal reports and membership ledger payments...');
        const paymentData = [
          { name: 'Vikram Sharma', amount: 4999 },
          { name: 'Sneha Mehta', amount: 4999 }
        ];

        for (const [idx, pay] of paymentData.entries()) {
          const pId = `PAY_DEMO_${idx}_${ownerUid}`;
          await setDoc(doc(db, 'payments', pId), {
            id: pId,
            gymId: gymId,
            userId: idx === 0 ? memberUid : `DEMO_M${idx}_${ownerUid}`,
            userName: pay.name,
            amount: pay.amount,
            status: 'paid',
            timestamp: subtractDays(idx).toISOString(),
            createdAt: subtractDays(idx).toISOString()
          });
        }

        setSeedingText('Broadcasting regional staff announcements...');
        await addDoc(collection(db, 'announcements'), {
          gymId: gymId,
          title: '🔥 Unleash Your Prime (Sandbox)',
          content: 'Keep training! Double points awarded for completing sets on Pec Dec replacement fly machines today!',
          type: 'info',
          createdAt: new Date().toISOString()
        });

        const attendanceRecords = [
          { date: subtractDays(2), name: 'Vikram Sharma', uid: memberUid },
          { date: subtractDays(1), name: 'Priya Sharma', uid: 'DEMO_M1_' + ownerUid },
          { date: new Date(), name: 'Sneha Mehta', uid: 'DEMO_M2_' + ownerUid }
        ];

        for (const [idx, r] of attendanceRecords.entries()) {
          await addDoc(collection(db, 'attendance'), {
            userId: r.uid,
            userName: r.name,
            gymId: gymId,
            timestamp: r.date.toISOString(),
            terminalId: 'AUTOSCAN_GATE',
            isDuplicate: false,
            entryCount: 1
          });
        }
      }
    } catch (e: any) {
      console.error(e);
      toast.error('Error styling sandbox database: ' + e.message);
    }
  };

  const handleLaunchDemo = async (role: 'owner' | 'member') => {
    setLoading(true);
    setSeedingText(`Authenticating as demo ${role}...`);
    
    // Using two specific demo emails to distinguish roles
    const email = role === 'owner' ? 'dhruvyamalhotra143@gmail.com' : 'demo-member@mustgym.com';
    const password = role === 'owner' ? 'qwerty66' : 'demopassword123';
    
    try {
      // Sign out of any existing session first to ensure clean state
      if (auth.currentUser) {
        await signOut(auth);
      }

      let userCredential;
      try {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
      } catch (signInErr: any) {
        if (signInErr.code === 'auth/user-not-found' || signInErr.code === 'auth/invalid-credential' || signInErr.code === 'auth/wrong-password') {
          userCredential = await createUserWithEmailAndPassword(auth, email, password);
        } else {
          throw signInErr;
        }
      }

      // Hardcode reliable UID mappings for demo
      const ownerUid = role === 'owner' ? userCredential.user.uid : 'DEMO_OWNER_FIXED_UUID';
      const memberUid = role === 'member' ? userCredential.user.uid : 'DEMO_MEMBER_FIXED_UUID';

      await seedDemoDatabase(ownerUid, memberUid);

      toast.success(`Welcome to the ${role === 'owner' ? 'Owner' : 'Member'} Demo!`);
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Demo auth failed:', err);
      if (err.code === 'auth/network-request-failed' || err.message?.includes('Network issue')) {
         toast.error(
          <div className="flex flex-col gap-2">
            <span className="font-bold">Sandbox Authentication Blocked</span>
            <span className="text-sm">Your browser is blocking Firebase Auth inside this preview window (likely due to third-party cookie restrictions or Incognito mode).</span>
            <button 
              onClick={() => window.open(window.location.href, '_blank')}
              className="bg-primary text-black px-3 py-1.5 rounded text-xs font-bold mt-1 uppercase"
            >
              Open safely in new tab
            </button>
          </div>,
          { duration: 10000 }
         );
      } else {
         toast.error('Could not authenticate sandbox session: ' + err.message);
      }
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-6 text-center">
        <SEO title="Preparing Sandbox | MustGym" />
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center max-w-sm"
        >
          <div className="w-20 h-20 bg-[#00f0ff]/10 border-2 border-[#00f0ff]/50 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-[#00f0ff]/10 mb-8 animate-pulse">
            <Dumbbell size={38} className="text-[#00f0ff]" />
          </div>
          
          <h2 className="font-headline font-black text-2xl uppercase italic tracking-tighter text-white">
            MUST<span className="text-[#00f0ff]">GYM</span> <span className="text-[#39ff14]">SANDBOX</span>
          </h2>
          
          <p className="text-neutral-400 text-xs mt-3 flex items-center gap-2">
            <Loader2 size={12} className="animate-spin text-[#39ff14]" />
            {seedingText}
          </p>

          <div className="w-48 bg-white/5 h-1 rounded-full mt-6 overflow-hidden">
            <motion.div 
              animate={{ x: [-200, 200] }} 
              transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
              className="w-1/2 bg-gradient-to-r from-[#00f0ff] to-[#39ff14] h-full"
            />
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col p-6">
      <SEO title="MustGym Demo Selector" />
      
      <button 
        onClick={() => navigate('/')} 
        className="self-start p-2 hover:bg-neutral-900 rounded-lg text-neutral-400 hover:text-white transition-colors flex items-center gap-2 mb-8"
      >
        <ArrowLeft size={16} /> Back
      </button>

      <div className="max-w-4xl mx-auto w-full flex flex-col items-center text-center">
        <div className="mb-4 inline-flex items-center gap-2 px-3 py-1 rounded bg-[#39ff14]/10 border border-[#39ff14]/20 text-xs font-bold text-[#39ff14] uppercase tracking-wider">
          <Sparkles size={12} /> Live Interactive Sandbox
        </div>
        <h1 className="text-4xl md:text-5xl font-headline font-black uppercase italic tracking-tight mb-4">
          Choose Your <span className="text-primary">Demo Path</span>
        </h1>
        <p className="text-neutral-400 max-w-xl mx-auto mb-16 text-sm">
          Experience the full capabilities of MustGym. Choose to explore the administrative command center as a gym owner, or dive into the gamified fitness experience as a gym member.
        </p>

        <div className="grid md:grid-cols-2 gap-6 w-full max-w-3xl">
          {/* Owner Pathway */}
          <motion.button
            whileHover={{ y: -5 }}
            onClick={() => handleLaunchDemo('owner')}
            className="flex flex-col items-center text-center bg-surface border border-white/10 p-8 rounded-3xl hover:border-primary/50 transition-colors group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 border border-primary/20 group-hover:scale-110 transition-transform">
              <ShieldCheck size={32} className="text-primary" />
            </div>
            <h2 className="text-2xl font-headline font-bold uppercase italic mb-2">Gym Owner</h2>
            <p className="text-on-surface-variant text-sm mb-6">
              Full access to member management, payment tracking, equipment status, and analytics dashboard.
            </p>
            <span className="mt-auto px-6 py-2.5 bg-primary text-on-primary-fixed uppercase font-black text-xs tracking-widest rounded-lg group-hover:opacity-90">
              Launch Owner Demo
            </span>
          </motion.button>

          {/* Member Pathway */}
          <motion.button
            whileHover={{ y: -5 }}
            onClick={() => handleLaunchDemo('member')}
            className="flex flex-col items-center text-center bg-surface border border-white/10 p-8 rounded-3xl hover:border-[#39ff14]/50 transition-colors group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-[#39ff14]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="w-16 h-16 bg-[#39ff14]/10 rounded-2xl flex items-center justify-center mb-6 border border-[#39ff14]/20 group-hover:scale-110 transition-transform">
              <Smartphone size={32} className="text-[#39ff14]" />
            </div>
            <h2 className="text-2xl font-headline font-bold uppercase italic mb-2">Gym Member</h2>
            <p className="text-on-surface-variant text-sm mb-6">
              Experience the custom PWA with workout logging, QR scanning, progress tracking, and gamified XP.
            </p>
            <span className="mt-auto px-6 py-2.5 bg-[#39ff14] text-black uppercase font-black text-xs tracking-widest rounded-lg group-hover:opacity-90">
              Launch Member Demo
            </span>
          </motion.button>
        </div>
      </div>
    </div>
  );
}
