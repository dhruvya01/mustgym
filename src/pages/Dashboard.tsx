import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { UserProfile, AttendanceRecord, WorkoutPlan, Announcement } from '../types';
import { Play, Flame, TrendingUp, ChevronRight, Dumbbell, QrCode, Activity, Smartphone, Copy, Check, Loader2, Megaphone, Info, AlertCircle, Calendar, X, CreditCard, Clock, Users, Quote, Zap, Lock, Trophy, Shield, Bell, LogOut } from 'lucide-react';
import { BarChart, Bar, ResponsiveContainer, XAxis, Tooltip, Cell, AreaChart, Area } from 'recharts';
import { Link } from 'react-router-dom';
import { collection, query, where, orderBy, limit, onSnapshot, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { SEO } from '../components/SEO';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';
import { format, subDays, isSameDay, parseISO, subHours, isAfter } from 'date-fns';
import { cn } from '../lib/utils';
import { toast } from 'sonner';
import { addPoints, getGamificationData } from '../services/gamificationService';

export default function Dashboard({ profile }: { profile: UserProfile | null }) {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [points, setPoints] = useState(0);
  const [level, setLevel] = useState(1);
  const [liveAttendance, setLiveAttendance] = useState<AttendanceRecord[]>([]);
  const [latestPlan, setLatestPlan] = useState<WorkoutPlan | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [waterIntake, setWaterIntake] = useState(0);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);
  const [copied, setCopied] = useState(false);
  const [gymInfo, setGymInfo] = useState<any>(null);

  const quotes = [
    "The only bad workout is the one that didn't happen.",
    "Your body can stand almost anything. It's your mind that you have to convince.",
    "Fitness is not about being better than someone else. It's about being better than you were yesterday.",
    "Action is the foundational key to all success.",
    "Don't stop when you're tired. Stop when you're done."
  ];
  const [quote] = useState(quotes[Math.floor(Math.random() * quotes.length)]);

  const peakHoursData = [
    { hour: '6am', count: 40 },
    { hour: '9am', count: 70 },
    { hour: '12pm', count: 45 },
    { hour: '3pm', count: 30 },
    { hour: '6pm', count: 95 },
    { hour: '9pm', count: 50 },
  ];

  useEffect(() => {
    if (!profile?.uid || !profile?.gymId) {
      setLoading(false);
      return;
    }

    const attendancePath = 'attendance';
    const qAttendance = query(
      collection(db, attendancePath),
      where('userId', '==', profile.uid),
      where('gymId', '==', profile.gymId)
    );

    const unsubAttendance = onSnapshot(qAttendance, (snapshot) => {
      const records = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AttendanceRecord));
      records.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setAttendance(records.slice(0, 30));
    }, (error) => {
      setTimeout(() => {
        handleFirestoreError(error, OperationType.LIST, attendancePath);
      }, 0);
    });

    const plansPath = 'workoutPlans';
    const qPlans = query(
      collection(db, plansPath),
      where('userId', '==', profile.uid),
      where('gymId', '==', profile.gymId)
    );

    const unsubPlans = onSnapshot(qPlans, (snapshot) => {
      if (!snapshot.empty) {
        const plans = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WorkoutPlan));
        plans.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setLatestPlan(plans[0]);
      }
      setLoading(false);
    }, (error) => {
      setLoading(false);
      setTimeout(() => {
        handleFirestoreError(error, OperationType.LIST, plansPath);
      }, 0);
    });

    const announcementsPath = 'announcements';
    let unsubAnnouncements = () => {};
    let unsubGym = () => {};
    
    if (profile.gymId) {
      unsubGym = onSnapshot(doc(db, 'gyms', profile.gymId), (snapshot) => {
        if (snapshot.exists()) {
          setGymInfo({ id: snapshot.id, ...snapshot.data() });
        }
      }, (error) => {
        setTimeout(() => {
          handleFirestoreError(error, OperationType.GET, `gyms/${profile.gymId}`);
        }, 0);
      });

      const qAnnouncements = query(
        collection(db, announcementsPath),
        where('gymId', '==', profile.gymId)
      );

      unsubAnnouncements = onSnapshot(qAnnouncements, (snapshot) => {
        const records = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Announcement));
        records.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setAnnouncements(records.slice(0, 3));
      }, (error) => {
        setTimeout(() => {
          handleFirestoreError(error, OperationType.LIST, announcementsPath);
        }, 0);
      });
    }

    // Live Capacity Query: Fetch all check-ins from the last 24 hours for this gym
    const liveAttendancePath = 'attendance';
    let unsubLive = () => {};
    
    if (profile.gymId) {
      const yesterday = subDays(new Date(), 1).toISOString();
      const qLive = query(
        collection(db, liveAttendancePath),
        where('gymId', '==', profile.gymId),
        where('timestamp', '>=', yesterday)
      );

      unsubLive = onSnapshot(qLive, (snapshot) => {
        const records = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AttendanceRecord));
        setLiveAttendance(records);
      }, (error) => {
        setTimeout(() => {
          handleFirestoreError(error, OperationType.LIST, liveAttendancePath);
        }, 0);
      });
    }

    const qNotifications = query(
      collection(db, 'notifications'),
      where('userId', '==', profile.uid) // fetch all for this user, filter and sort client-side
    );

    const unsubNotifications = onSnapshot(qNotifications, (snapshot) => {
      let docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      docs = docs.filter(doc => !doc.read);
      docs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setNotifications(docs.slice(0, 2));
    }, (error) => {
      setTimeout(() => {
        handleFirestoreError(error, OperationType.LIST, 'notifications');
      }, 0);
    });

    // Load water intake from local storage
    const savedWater = localStorage.getItem(`water_${profile.uid}_${format(new Date(), 'yyyy-MM-dd')}`);
    if (savedWater) setWaterIntake(parseInt(savedWater));

    // Fetch gamification data
    if (profile.uid) {
      getGamificationData(profile.uid).then(data => {
        if (data) {
          setPoints(data.totalPoints);
          setLevel(data.level);
        }
      });
    }

    return () => {
      unsubAttendance();
      unsubPlans();
      unsubGym?.();
      unsubAnnouncements?.();
      unsubLive?.();
      unsubNotifications();
    };
  }, [profile?.uid, profile?.gymId]);

  const handleCheckOut = async (recordId: string) => {
    setCheckingOut(true);
    try {
      await updateDoc(doc(db, 'attendance', recordId), {
        checkOutTime: new Date().toISOString()
      });
      // Award points for completing a workout/session
      await addPoints(profile!.uid, 20);
      toast.success('Successfully checked out. +20 Points!');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `attendance/${recordId}`);
      toast.error('Failed to check out');
    } finally {
      setCheckingOut(false);
    }
  };

  // Calculate Live Capacity
  const calculateLiveCapacity = () => {
    const threeHoursAgo = subHours(new Date(), 3);
    const activeUserIds = new Set(
      liveAttendance
        .filter(record => {
          const checkInTime = parseISO(record.timestamp);
          const isRecent = isAfter(checkInTime, threeHoursAgo);
          const hasNotCheckedOut = !record.checkOutTime;
          return isRecent && hasNotCheckedOut;
        })
        .map(record => record.userId)
    );
    return activeUserIds.size;
  };

  const liveCount = calculateLiveCapacity();
  const maxCapacity = 50; // Example max capacity
  const loadPercentage = Math.min(Math.round((liveCount / maxCapacity) * 100), 100);

  // Find current user's active session
  const activeSession = attendance.find(record => {
    const checkInTime = parseISO(record.timestamp);
    const isRecent = isAfter(checkInTime, subHours(new Date(), 3));
    return isRecent && !record.checkOutTime;
  });

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.origin);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Calculate streak
  const calculateStreak = () => {
    if (attendance.length === 0) return 0;
    let streak = 0;
    let currentDate = new Date();
    
    // Check if attended today or yesterday to continue streak
    const lastAttendance = parseISO(attendance[0].timestamp);
    if (!isSameDay(lastAttendance, currentDate) && !isSameDay(lastAttendance, subDays(currentDate, 1))) {
      return 0;
    }

    // Simple streak calculation based on consecutive days
    const uniqueDays = Array.from(new Set(attendance.map(a => format(parseISO(a.timestamp), 'yyyy-MM-dd'))));
    for (let i = 0; i < uniqueDays.length; i++) {
      const day = parseISO(uniqueDays[i] as string);
      const expectedDay = subDays(parseISO(uniqueDays[0] as string), i);
      if (isSameDay(day, expectedDay)) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  };

  const streak = calculateStreak();

  const handleWaterUpdate = (val: number) => {
    const newVal = Math.max(0, waterIntake + val);
    setWaterIntake(newVal);
    localStorage.setItem(`water_${profile?.uid}_${format(new Date(), 'yyyy-MM-dd')}`, newVal.toString());
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-10">
      <SEO title="Elite Dashboard" />
      
      {profile?.role === 'admin' && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
              <Shield className="text-primary" size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-widest text-on-surface">Admin Access Active</h3>
              <p className="text-[10px] text-on-surface-variant">You have full administrative privileges</p>
            </div>
          </div>
          <Link 
            to="/admin"
            className="px-4 py-2 bg-primary text-on-primary-fixed text-[10px] font-black uppercase tracking-widest rounded-lg hover:scale-105 transition-transform"
          >
            Go to Admin Panel
          </Link>
        </motion.div>
      )}

      {profile?.membershipStatus === 'pending' && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-6 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left"
        >
          <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center shrink-0">
            <Clock className="text-amber-500" size={24} />
          </div>
          <div className="flex-1">
            <h4 className="font-headline font-black text-sm uppercase italic text-white mb-1">Access Pending Approval</h4>
            <p className="text-[10px] text-on-surface-variant font-medium leading-relaxed uppercase tracking-widest">
              You've selected a gym, but your membership is currently awaiting validation from the owner. Contact management to expedite activation.
            </p>
          </div>
          <div className="px-4 py-2 bg-amber-500/20 rounded-lg text-amber-500 text-[8px] font-black uppercase tracking-widest">
            Awaiting Verification
          </div>
        </motion.div>
      )}

      {profile?.membershipStatus === 'halted' && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-6 bg-error/10 border border-error/20 rounded-2xl flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left"
        >
          <div className="w-12 h-12 bg-error/20 rounded-xl flex items-center justify-center shrink-0">
            <Lock className="text-error" size={24} />
          </div>
          <div className="flex-1">
            <h4 className="font-headline font-black text-sm uppercase italic text-white mb-1">Membership Suspended</h4>
            <p className="text-[10px] text-on-surface-variant font-medium leading-relaxed uppercase tracking-widest">
              Your membership access has been halted by the gym administration. Please contact your gym owner to resolve any underlying issues.
            </p>
          </div>
          <div className="px-4 py-2 bg-error/20 rounded-lg text-error text-[8px] font-black uppercase tracking-widest">
            Access Revoked
          </div>
        </motion.div>
      )}
      
      {profile?.role === 'member' && profile?.membershipStatus === 'active' && (
        <React.Fragment>
          {/* Hero Section: Personal Greeting */}
          <section className="relative pt-4">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="max-w-3xl"
            >
              <div className="flex items-center gap-3 mb-4">
                {gymInfo?.logoUrl ? (
                  <img src={gymInfo.logoUrl} alt={gymInfo?.name} className="w-8 h-8 rounded-lg object-cover border border-white/10" />
                ) : (
                  <div className="w-8 h-8 bg-primary/20 flex items-center justify-center rounded-lg border border-primary/30">
                    <Dumbbell className="text-primary w-4 h-4" />
                  </div>
                )}
                <span className="font-headline font-bold uppercase tracking-[0.3em] text-primary text-[10px] break-words">
                  {gymInfo?.name ? `${gymInfo.name.toUpperCase()} MEMBER` : 'ELITE MEMBER ACCESS'}
                </span>
                
                {gymInfo?.subscriptionTier && (
                   <span className="ml-2 px-2 py-0.5 bg-white/10 text-white rounded text-[8px] font-bold uppercase tracking-widest border border-white/5">
                     {gymInfo.subscriptionTier} Plan
                   </span>
                )}
              </div>
          <h2 className="font-headline font-black text-3xl sm:text-6xl md:text-8xl leading-[0.85] uppercase italic tracking-tighter mb-4">
            WELCOME,<br/>
            <span className="text-primary-dim">{profile?.displayName?.split(' ')[0] || 'CHAMPION'}</span>
          </h2>
          <p className="text-on-surface-variant font-medium text-sm max-w-md leading-relaxed">
            Your journey to peak performance continues. You've logged <span className="text-white font-bold">{attendance.length}</span> sessions this month. Keep the momentum.
          </p>
        </motion.div>
      </section>

      {/* Stats Bento Grid */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
        {gymInfo?.subscriptionTier !== 'starter' && (
          <motion.div 
            whileHover={{ y: -5 }}
            className="bg-surface-container p-3 sm:p-6 rounded-2xl border border-white/5 flex flex-col justify-between aspect-square md:aspect-auto"
          >
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-orange-500/10 rounded-xl flex items-center justify-center mb-2 sm:mb-4">
              <Flame className={cn("text-orange-500", streak > 0 && "animate-pulse")} size={16} />
            </div>
            <div>
              <div className="text-[7px] sm:text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">Streak</div>
              <div className="font-headline font-black text-xl sm:text-3xl">{streak} <span className="text-[8px] sm:text-xs font-bold text-on-surface-variant">DAYS</span></div>
            </div>
          </motion.div>
        )}

        <motion.div 
          whileHover={{ y: -5 }}
          className={cn("bg-surface-container p-3 sm:p-6 rounded-2xl border border-white/5 flex flex-col justify-between aspect-square md:aspect-auto", gymInfo?.subscriptionTier === 'starter' ? "col-span-2 md:col-span-4" : "")}
        >
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary/10 rounded-xl flex items-center justify-center mb-2 sm:mb-4">
            <Trophy className="text-primary" size={16} />
          </div>
          <div>
            <div className="text-[7px] sm:text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">Sessions</div>
            <div className="font-headline font-black text-xl sm:text-3xl">{attendance.length} <span className="text-[8px] sm:text-xs font-bold text-on-surface-variant">TOTAL</span></div>
          </div>
        </motion.div>

        {gymInfo?.subscriptionTier !== 'starter' && (
          <motion.div 
            whileHover={{ y: -5 }}
            className="bg-surface-container p-3 sm:p-6 rounded-2xl border border-white/5 flex flex-col justify-between aspect-square md:aspect-auto"
          >
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-500/10 rounded-xl flex items-center justify-center mb-2 sm:mb-4">
              <Dumbbell className="text-blue-500" size={16} />
            </div>
            <div>
              <div className="text-[7px] sm:text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">Training Goal</div>
              <div className="font-headline font-black text-sm sm:text-lg uppercase truncate">{latestPlan?.title.split(' ')[0] || 'STRENGTH'}</div>
            </div>
          </motion.div>
        )}

        {gymInfo?.subscriptionTier !== 'starter' && (
          <motion.div 
            whileHover={{ y: -5 }}
            className="bg-surface-container p-3 sm:p-6 rounded-2xl border border-white/5 flex flex-col justify-between aspect-square md:aspect-auto"
          >
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-yellow-500/10 rounded-xl flex items-center justify-center mb-2 sm:mb-4">
              <Zap className="text-yellow-500" size={16} />
            </div>
            <div>
              <div className="text-[7px] sm:text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">Level {level}</div>
              <div className="font-headline font-black text-xl sm:text-3xl">{points} <span className="text-[8px] sm:text-xs font-bold text-on-surface-variant">PTS</span></div>
            </div>
          </motion.div>
        )}
      </section>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-8">
        {/* Left Column: Training & Live Status */}
        <div className="lg:col-span-8 space-y-4 sm:space-y-8">
           {/* Compact Training Status */}
          <section className="bg-surface-container-low p-4 sm:p-6 rounded-2xl border border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary shrink-0">
                <Dumbbell size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-primary animate-pulse" />
                  <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Current Phase</span>
                </div>
                <h3 className="font-headline font-black text-lg sm:text-xl uppercase italic leading-tight">
                  {gymInfo?.subscriptionTier === 'starter' ? 'Self-Guided Training' : (latestPlan?.title || 'Hypertrophy')}
                </h3>
              </div>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              {activeSession ? (
                <button 
                  onClick={() => handleCheckOut(activeSession.id!)}
                  disabled={checkingOut}
                  className="bg-error/10 text-error border border-error/20 font-headline font-bold uppercase py-3 px-6 rounded-lg flex items-center gap-2 text-[10px] tracking-widest active:scale-95 transition-all whitespace-nowrap flex-1 sm:flex-none justify-center"
                >
                  {checkingOut ? <Loader2 className="animate-spin" size={14} /> : <LogOut size={14} />}
                  Check Out
                </button>
              ) : gymInfo?.subscriptionTier === 'starter' ? (
                <button disabled className="bg-white/5 text-on-surface-variant border border-white/10 font-headline font-bold uppercase py-3 px-6 rounded-lg flex items-center gap-2 text-[10px] tracking-widest whitespace-nowrap flex-1 sm:flex-none justify-center opacity-70 cursor-not-allowed cursor-help" title="AI Workouts require PRO Plan">
                  Pro Feature
                  <Lock size={14} />
                </button>
              ) : (
                <Link to="/workouts" className="kinetic-gradient text-on-primary-fixed font-headline font-bold uppercase py-3 px-6 rounded-lg flex items-center gap-2 text-[10px] tracking-widest shadow-lg active:scale-95 transition-all whitespace-nowrap flex-1 sm:flex-none justify-center">
                  {latestPlan ? "Resume Training" : "Generate Plan"}
                  <Play size={14} fill="currentColor" />
                </Link>
              )}
            </div>
          </section>

          {/* Live Gym Status & Peak Hours */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div className="bg-surface-container-low p-4 sm:p-6 rounded-2xl border border-white/5">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div className="flex items-center gap-2">
                  <Users size={16} className="text-primary" />
                  <h4 className="font-headline font-bold uppercase tracking-widest text-[10px] sm:text-xs">Live Capacity</h4>
                </div>
                <div className="flex items-center gap-1.5 bg-green-500/10 px-2 py-1 rounded text-[7px] sm:text-[8px] font-black uppercase text-green-500">
                  <div className="w-1 h-1 rounded-full bg-green-500 animate-pulse" />
                  Optimal
                </div>
              </div>
              <div className="flex items-end gap-3 mb-3 sm:mb-4">
                <span className="font-headline font-black text-4xl sm:text-5xl">{liveCount}</span>
                <span className="text-on-surface-variant font-bold text-[10px] sm:text-xs mb-1 sm:mb-2 uppercase tracking-widest">Members In Gym</span>
              </div>
              <div className="w-full bg-surface-container-highest h-1.5 sm:h-2 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${loadPercentage}%` }}
                  className="bg-primary h-full"
                />
              </div>
              <p className="mt-3 sm:mt-4 text-[9px] sm:text-[10px] text-on-surface-variant font-medium italic">
                Current load is {loadPercentage}% of max capacity. {loadPercentage < 70 ? 'Great time for a session!' : 'Gym is quite busy right now.'}
              </p>
            </div>

            <div className="bg-surface-container-low p-4 sm:p-6 rounded-2xl border border-white/5 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Activity size={16} className="text-primary" />
                  <h4 className="font-headline font-bold uppercase tracking-widest text-[10px] sm:text-xs">Water Intake</h4>
                </div>
                <span className="text-[10px] font-black text-primary uppercase tracking-widest">{waterIntake} / 12 Glasses</span>
              </div>
              <div className="flex justify-between gap-1 mb-4">
                {[...Array(12)].map((_, i) => (
                  <div 
                    key={i} 
                    className={cn(
                      "flex-1 h-8 rounded-sm transition-all duration-500",
                      i < waterIntake ? "bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" : "bg-white/5"
                    )}
                  />
                ))}
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => handleWaterUpdate(-1)}
                  className="flex-1 py-2 bg-surface-container-highest rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-white/10"
                >
                  - Remove
                </button>
                <button 
                  onClick={() => handleWaterUpdate(1)}
                  className="flex-1 py-2 bg-blue-500 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-blue-600 shadow-lg shadow-blue-500/20"
                >
                  + Add Glass
                </button>
              </div>
            </div>
          </section>

          {/* Personal Records */}
          <section className="grid grid-cols-1 gap-4 sm:gap-6">
            <div className="bg-surface-container-low p-6 rounded-2xl border border-white/5">
              <div className="flex items-center gap-2 mb-6">
                <Trophy size={18} className="text-amber-500" />
                <h4 className="font-headline font-bold uppercase tracking-widest text-xs">Personal Records</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { exercise: 'Bench Press', weight: '85kg', date: '2 days ago' },
                  { exercise: 'Deadlift', weight: '140kg', date: '1 week ago' },
                  { exercise: 'Squat', weight: '110kg', date: '3 days ago' },
                ].map((pr, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 group hover:bg-white/10 transition-all">
                    <div>
                      <div className="text-xs font-bold uppercase tracking-tight">{pr.exercise}</div>
                      <div className="text-[9px] text-on-surface-variant uppercase tracking-widest">{pr.date}</div>
                    </div>
                    <div className="text-lg font-headline font-black text-primary group-hover:scale-110 transition-transform">{pr.weight}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Alerts, Motivation & Quick Actions */}
        <div className="lg:col-span-4 space-y-4 sm:space-y-8">
          {/* Notifications Section */}
          {notifications.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h4 className="font-headline font-bold uppercase tracking-widest text-[10px] text-on-surface-variant">Recent Alerts</h4>
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              </div>
              <div className="space-y-2">
                {notifications.map((n) => (
                  <motion.div 
                    key={n.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={cn(
                      "p-4 rounded-2xl border flex items-start gap-4 transition-all",
                      n.type === 'warning' ? "bg-warning/10 border-warning/20" : 
                      n.type === 'error' ? "bg-error/10 border-error/20" : "bg-primary/10 border-primary/20"
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                      n.type === 'warning' ? "bg-warning/20 text-warning" : 
                      n.type === 'error' ? "bg-error/20 text-error" : "bg-primary/20 text-primary"
                    )}>
                      {n.type === 'warning' ? <AlertCircle size={16} /> : n.type === 'error' ? <X size={16} /> : <Bell size={16} />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-black uppercase tracking-tight text-on-surface truncate">{n.title}</p>
                      <p className="text-[10px] text-on-surface-variant leading-tight line-clamp-2 mt-0.5">{n.message}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>
          )}

          {/* Motivation Card */}
          <section className="bg-primary rounded-3xl p-6 sm:p-8 text-on-primary-fixed relative overflow-hidden group">
            <Quote className="absolute -top-4 -right-4 w-20 sm:w-24 h-20 sm:h-24 opacity-10 rotate-12 group-hover:rotate-0 transition-transform duration-700" />
            <div className="relative z-10">
              <div className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-4 sm:mb-6">Daily Motivation</div>
              <p className="font-headline font-black text-xl sm:text-2xl uppercase italic leading-tight mb-6 sm:mb-8">
                "{quote}"
              </p>
              <div className="flex items-center gap-2">
                <div className="w-6 h-[1px] bg-on-primary-fixed opacity-40" />
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">MustGym Philosophy</span>
              </div>
            </div>
          </section>

          {/* Quick Actions Grid */}
          <section className="grid grid-cols-1 gap-2 sm:gap-3">
            <Link to="/scan" className="bg-surface-container-low p-4 sm:p-5 rounded-2xl flex items-center justify-between group hover:bg-surface-bright transition-all border border-white/5">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                  <QrCode size={20} />
                </div>
                <div>
                  <h4 className="font-headline font-bold uppercase text-xs sm:text-sm">Scan Entry</h4>
                  <p className="text-[9px] sm:text-[10px] text-on-surface-variant font-medium">Quick check-in</p>
                </div>
              </div>
              <ChevronRight size={18} className="text-outline group-hover:text-primary transition-colors" />
            </Link>
            
            <Link to="/progress" className="bg-surface-container-low p-4 sm:p-5 rounded-2xl flex items-center justify-between group hover:bg-surface-bright transition-all border border-white/5">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-500/10 rounded-xl flex items-center justify-center text-green-500 group-hover:scale-110 transition-transform">
                  <Activity size={20} />
                </div>
                <div>
                  <h4 className="font-headline font-bold uppercase text-xs sm:text-sm">Analytics</h4>
                  <p className="text-[9px] sm:text-[10px] text-on-surface-variant font-medium">Track evolution</p>
                </div>
              </div>
              <ChevronRight size={18} className="text-outline group-hover:text-primary transition-colors" />
            </Link>

            <Link to="/settings" className="bg-surface-container-low p-4 sm:p-5 rounded-2xl flex items-center justify-between group hover:bg-surface-bright transition-all border border-white/5">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                  <CreditCard size={20} />
                </div>
                <div>
                  <h4 className="font-headline font-bold uppercase text-xs sm:text-sm">Member ID</h4>
                  <p className="text-[9px] sm:text-[10px] text-on-surface-variant font-medium">Digital access</p>
                </div>
              </div>
              <ChevronRight size={18} className="text-outline group-hover:text-primary transition-colors" />
            </Link>
          </section>
        </div>
      </div>

      {/* Announcements Ticker/Feed */}
      {announcements.length > 0 && (
        <section className="pt-10 border-t border-white/5">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Megaphone size={20} className="text-primary" />
              <h4 className="font-headline font-black uppercase tracking-tighter text-2xl italic">Studio <span className="text-primary">Feed</span></h4>
            </div>
            <Link to="/announcements" className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors">View All</Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {announcements.map((announcement) => (
              <motion.div 
                key={announcement.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="bg-surface-container-low p-6 rounded-2xl border border-white/5 relative overflow-hidden group hover:bg-surface-container transition-colors"
              >
                <div className={cn(
                  "absolute top-0 left-0 w-1 h-full",
                  announcement.type === 'alert' ? "bg-error" : 
                  announcement.type === 'event' ? "bg-primary" : "bg-blue-500"
                )} />
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-40">{announcement.type}</span>
                  <div className="h-[1px] flex-1 bg-white/5" />
                  <span className="text-[9px] font-bold uppercase tracking-widest opacity-40">{format(new Date(announcement.createdAt), 'MMM dd')}</span>
                </div>
                <h5 className="font-headline font-bold text-lg mb-3 group-hover:text-primary transition-colors leading-tight uppercase">{announcement.title}</h5>
                <p className="text-xs text-on-surface-variant line-clamp-2 leading-relaxed font-medium">{announcement.content}</p>
              </motion.div>
            ))}
          </div>
        </section>
      )}
      </React.Fragment>
      )}
    </div>
  );
}

