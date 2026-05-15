import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { UserProfile, AttendanceRecord, WorkoutPlan, Announcement } from '../types';
import { Play, Flame, QrCode, Activity, Dumbbell, Bell, Users, Trophy, ChevronRight, Target, Shield, Clock, Zap, Cpu, ScanLine, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, query, where, orderBy, limit, onSnapshot, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { SEO } from '../components/SEO';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';
import { format, subDays, isSameDay } from 'date-fns';
import { cn } from '../lib/utils';
import { toast } from 'sonner';
import { getGamificationData, getLeaderboard } from '../services/gamificationService';

export default function Dashboard({ profile }: { profile: UserProfile | null }) {
  const navigate = useNavigate();
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [liveAttendance, setLiveAttendance] = useState<AttendanceRecord[]>([]);
  const [latestPlan, setLatestPlan] = useState<WorkoutPlan | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [gymInfo, setGymInfo] = useState<any>(null);
  
  const [points, setPoints] = useState(0);
  const [level, setLevel] = useState(1);
  const [streak, setStreak] = useState(0);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.uid || !profile?.gymId) return;

    // Gym Info
    const unsubGym = onSnapshot(doc(db, 'gyms', profile.gymId), (snapshot) => {
      if (snapshot.exists()) setGymInfo({ id: snapshot.id, ...snapshot.data() });
    });

    // Attendance (for streaks)
    const qAttendance = query(
      collection(db, 'attendance'),
      where('userId', '==', profile.uid),
      where('gymId', '==', profile.gymId)
    );
    const unsubAttendance = onSnapshot(qAttendance, (snapshot) => {
      const records = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AttendanceRecord));
      records.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setAttendance(records);
      
      // Calculate streak
      let currentStreak = 0;
      let lastDate = new Date();
      
      // Simple streak logic for demo
      const uniqueDates = [...new Set(records.map(r => format(new Date(r.timestamp), 'yyyy-MM-dd')))];
      for (const d of uniqueDates) {
        if (isSameDay(new Date(d), lastDate) || isSameDay(new Date(d), subDays(lastDate, 1))) {
          currentStreak++;
          lastDate = new Date(d);
        } else {
          break;
        }
      }
      setStreak(currentStreak);
    });

    // Live Gym Status (Last 24h checkins)
    const yesterday = subDays(new Date(), 1).toISOString();
    const qLive = query(
      collection(db, 'attendance'),
      where('gymId', '==', profile.gymId),
      where('timestamp', '>=', yesterday)
    );
    const unsubLive = onSnapshot(qLive, (snapshot) => {
      setLiveAttendance(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AttendanceRecord)));
    });

    // Latest Workout Plan
    const qPlans = query(collection(db, 'workoutPlans'), where('userId', '==', profile.uid), where('gymId', '==', profile.gymId));
    const unsubPlans = onSnapshot(qPlans, (snapshot) => {
      if (!snapshot.empty) {
        const plans = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WorkoutPlan));
        plans.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setLatestPlan(plans[0]);
      }
      setLoading(false);
    });

    // Gamification & Leaderboard
    getGamificationData(profile.uid).then(data => {
      if (data) {
        setPoints(data.totalPoints);
        setLevel(data.level);
      }
    });

    getLeaderboard(profile.gymId).then(data => {
      setLeaderboard(data.slice(0, 3));
    });

    return () => {
      unsubGym();
      unsubAttendance();
      unsubLive();
      unsubPlans();
    };
  }, [profile?.uid, profile?.gymId]);

  if (!profile) return null;

  // Membership handling
  if (profile.role === 'member' && profile.membershipStatus === 'pending') {
    return (
      <div className="p-6 md:p-12 min-h-[60vh] flex flex-col items-center justify-center text-center">
        <SEO title="Pending Approval" />
        <Clock className="w-20 h-20 text-yellow-500 mb-6 animate-pulse" />
        <h2 className="text-3xl font-black font-headline text-white mb-4 uppercase italic tracking-tighter">Awaiting Approval</h2>
        <p className="text-on-surface-variant max-w-sm mb-8 text-sm">Your membership request is under review by {gymInfo?.name || 'the gym owner'}. You will gain access once approved.</p>
        <button onClick={() => window.location.reload()} className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-full font-bold uppercase tracking-widest text-xs transition-colors">
          Refresh Status
        </button>
      </div>
    );
  }

  if (profile.role === 'member' && profile.membershipStatus === 'halted') {
    return (
      <div className="p-6 md:p-12 min-h-[60vh] flex flex-col items-center justify-center text-center">
        <SEO title="Account Suspended" />
        <Shield className="w-20 h-20 text-red-500 mb-6" />
        <h2 className="text-3xl font-black font-headline text-white mb-4 uppercase italic tracking-tighter">Account Suspended</h2>
        <p className="text-on-surface-variant max-w-sm mb-8 text-sm">Your access to {gymInfo?.name} has been temporarily suspended. Please contact the management.</p>
      </div>
    );
  }

  const liveOccupancy = liveAttendance.length;
  const occupancyPercentage = gymInfo?.expectedMembers ? Math.min(100, Math.round((liveOccupancy / gymInfo.expectedMembers) * 100)) : 0;
  
  let occupancyStatus = "Quiet";
  let occupancyColor = "text-green-500";
  let occupancyBg = "bg-green-500/20";
  if (occupancyPercentage > 40) { occupancyStatus = "Moderate"; occupancyColor = "text-yellow-500"; occupancyBg = "bg-yellow-500/20"; }
  if (occupancyPercentage > 80) { occupancyStatus = "Busy"; occupancyColor = "text-red-500"; occupancyBg = "bg-red-500/20"; }

  // Dummy Diet Data
  const dietOverview = [
    { meal: 'Breakfast', foods: 'Poha, 2 Boiled Eggs', cals: 320 },
    { meal: 'Lunch', foods: '2 Roti, Dal Tadka, Chicken Breast', cals: 550 },
    { meal: 'Dinner', foods: 'Paneer Bhurji, Salad', cals: 400 },
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-white pb-24 overflow-x-hidden">
      <SEO title="Dashboard" />
      
      {/* Dynamic Header */}
      <header className="relative pt-12 pb-6 px-6">
        <div className="absolute top-0 left-0 w-full h-48 bg-gradient-to-b from-[#00f0ff]/10 to-transparent pointer-events-none" />
        <div className="relative z-10 flex justify-between items-start">
          <div className="flex items-center gap-4">
            <div className="relative">
              {profile.photoURL ? (
                <img src={profile.photoURL} alt="Profile" className="w-16 h-16 rounded-full border-2 border-[#00f0ff] object-cover" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-[#00f0ff]/20 border-2 border-[#00f0ff] flex items-center justify-center">
                  <span className="text-xl font-bold">{profile.displayName?.[0] || 'M'}</span>
                </div>
              )}
              <div className="absolute -bottom-2 -right-2 bg-black border border-[#00f0ff] px-2 py-0.5 rounded-full text-[10px] font-bold text-[#00f0ff]">
                LVL {level}
              </div>
            </div>
            <div>
              <p className="text-[#00f0ff] font-bold text-[10px] uppercase tracking-widest">{gymInfo?.name || 'Studio'}</p>
              <h1 className="text-2xl font-headline font-black uppercase italic tracking-tighter">Hi, {profile.displayName?.split(' ')[0]}</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="bg-white/10 px-2 py-0.5 rounded text-[10px] font-medium border border-white/5">{profile.membershipStatus === 'active' ? 'PRO' : 'BASIC'} Member</span>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <Link to="/settings" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/70 hover:text-white transition-colors relative">
              <Bell size={20} />
              <div className="absolute top-2 right-2 w-2 h-2 bg-[#39ff14] rounded-full shadow-[0_0_10px_#39ff14]" />
            </Link>
          </div>
        </div>

        {/* Gamification Strip */}
        <div className="flex items-center justify-between mt-8 gap-4 overflow-x-auto pb-2 noscrollbar">
          <div className="flex-1 min-w-[120px] bg-gradient-to-br from-white/10 to-white/5 rounded-2xl p-4 border border-white/10 backdrop-blur-md">
            <div className="flex items-center gap-2 text-white/60 mb-2">
              <Zap size={14} className="text-[#39ff14]" />
              <span className="text-[10px] uppercase font-bold tracking-widest">XP Points</span>
            </div>
            <div className="text-2xl font-black font-headline italic tracking-tighter text-[#39ff14] shadow-[#39ff14]/50 drop-shadow-sm">{points.toLocaleString()}</div>
          </div>
          
          <div className="flex-1 min-w-[120px] bg-gradient-to-br from-white/10 to-white/5 rounded-2xl p-4 border border-white/10 backdrop-blur-md">
            <div className="flex items-center gap-2 text-white/60 mb-2">
              <Flame size={14} className="text-[#00f0ff]" />
              <span className="text-[10px] uppercase font-bold tracking-widest">Day Streak</span>
            </div>
            <div className="text-2xl font-black font-headline italic tracking-tighter text-[#00f0ff] shadow-[#00f0ff]/50 drop-shadow-sm">{streak}</div>
          </div>
        </div>
      </header>

      <main className="px-6 space-y-8">
        
        {/* QUICK ACTIONS */}
        <section className="grid grid-cols-4 gap-3">
          {[
            { icon: ScanLine, label: 'Scan In', to: '/scan', color: 'from-[#00f0ff]/20 to-[#00f0ff]/5', border: 'border-[#00f0ff]/30', text: 'text-[#00f0ff]' },
            { icon: Dumbbell, label: 'Workout', to: '/workouts', color: 'from-white/10 to-white/5', border: 'border-white/10', text: 'text-white' },
            { icon: Trophy, label: 'Quests', to: '/challenges', color: 'from-[#39ff14]/20 to-[#39ff14]/5', border: 'border-[#39ff14]/30', text: 'text-[#39ff14]' },
            { icon: Activity, label: 'Stats', to: '/progress', color: 'from-white/10 to-white/5', border: 'border-white/10', text: 'text-white' },
          ].map((action, i) => (
            <Link key={i} to={action.to} className={cn("flex flex-col items-center justify-center p-3 rounded-2xl bg-gradient-to-b border backdrop-blur-sm transition-transform hover:scale-105 active:scale-95", action.color, action.border)}>
              <action.icon size={22} className={cn("mb-2", action.text)} />
              <span className="text-[9px] font-bold uppercase tracking-wider">{action.label}</span>
            </Link>
          ))}
        </section>

        {/* LIVE GYM STATUS */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold uppercase tracking-widest text-white/80">Live Gym Status</h2>
            <div className={cn("px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5", occupancyBg, occupancyColor)}>
              <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", `bg-current`)} />
              {occupancyStatus}
            </div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-3xl p-5 backdrop-blur-sm">
            <div className="flex justify-between items-end mb-2">
              <div>
                <p className="text-3xl font-black font-headline tracking-tighter italic">{liveOccupancy}</p>
                <p className="text-xs text-white/50 font-medium">Members Active Now</p>
              </div>
              <Activity size={24} className="text-white/20" />
            </div>
            {/* Heatmap Bar */}
            <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden mt-4">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(5, occupancyPercentage)}%` }}
                className={cn("h-full", occupancyPercentage > 80 ? "bg-red-500" : occupancyPercentage > 40 ? "bg-yellow-500" : "bg-[#39ff14]")}
              />
            </div>
          </div>
        </section>

        {/* AI WORKOUT SECTION */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold uppercase tracking-widest text-white/80 flex items-center gap-2">
              <Cpu size={16} className="text-[#00f0ff]" /> AI Workout Focus
            </h2>
            <Link to="/workouts" className="text-[10px] font-bold text-[#00f0ff] uppercase tracking-widest hover:underline">View All</Link>
          </div>
          <div className="bg-gradient-to-br from-[#00f0ff]/10 to-transparent border border-[#00f0ff]/20 rounded-3xl p-1 relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-[#00f0ff]/20 blur-2xl rounded-full" />
            
            <div className="bg-[#050505]/80 backdrop-blur-xl rounded-[22px] p-5">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="text-[10px] font-bold text-[#00f0ff] uppercase tracking-widest mb-1">RECOMMENDED TODAY</div>
                  <h3 className="text-xl font-black font-headline italic tracking-tighter uppercase">{latestPlan?.name || 'Full Body Hypertrophy'}</h3>
                </div>
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                  <Play size={18} className="text-white ml-0.5" />
                </div>
              </div>
              
              <div className="space-y-3">
                {(latestPlan?.exercises.slice(0, 2) || [
                  { name: 'Barbell Squats', sets: 4, reps: '8-10' },
                  { name: 'Romanian Deadlifts', sets: 3, reps: '10-12' }
                ]).map((ex: any, i: number) => (
                  <div key={i} className="flex justify-between items-center bg-white/5 rounded-xl p-3 border border-white/5">
                    <span className="text-sm font-bold">{ex.name}</span>
                    <span className="text-[10px] text-white/60 font-mono">{ex.sets} Sets × {ex.reps} Reps</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* AI DIET PLAN (Indian Focused) */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold uppercase tracking-widest text-white/80 flex items-center gap-2">
              <Target size={16} className="text-[#39ff14]" /> AI Diet Plan
            </h2>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-3xl p-5 backdrop-blur-sm">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full border-4 border-[#39ff14] border-t-white/10 flex items-center justify-center">
                  <span className="text-xs font-bold text-[#39ff14]">1.2k</span>
                </div>
                <div>
                  <p className="text-[10px] text-white/50 uppercase font-bold tracking-widest">Eaten today</p>
                  <p className="text-sm font-bold">Target: 2,400 kcal</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {dietOverview.map((meal, i) => (
                <div key={i} className="flex items-start justify-between border-t border-white/5 pt-3 first:border-0 first:pt-0">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-white">{meal.meal}</h4>
                    <p className="text-[11px] text-white/60 mt-0.5">{meal.foods}</p>
                  </div>
                  <div className="text-[10px] font-mono font-bold text-[#39ff14] bg-[#39ff14]/10 px-2 py-1 rounded">
                    {meal.cals} cal
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* LEADERBOARD (Top 3) */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold uppercase tracking-widest text-white/80 flex items-center gap-2">
              <Trophy size={16} className="text-yellow-500" /> Gym Leaders
            </h2>
            <Link to="/progress" className="text-[10px] font-bold text-yellow-500 uppercase tracking-widest hover:underline">Full Rank</Link>
          </div>
          
          <div className="bg-white/5 border border-white/10 rounded-3xl p-5 backdrop-blur-sm">
            {leaderboard.length > 0 ? (
              <div className="space-y-4">
                {leaderboard.map((lb, i) => (
                  <div key={lb.userId} className="flex items-center gap-4">
                    <div className={cn("w-6 text-center font-black font-headline italic tracking-tighter", i === 0 ? "text-yellow-500" : i === 1 ? "text-gray-300" : "text-amber-600")}>
                      #{i + 1}
                    </div>
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-sm font-bold">
                      {lb.userId.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-white">Member {lb.userId.slice(0, 4)}</p>
                      <p className="text-[10px] text-white/50 uppercase tracking-widest">Level {lb.level}</p>
                    </div>
                    <div className="text-xs font-mono font-bold text-white/80">
                      {lb.totalPoints} XP
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-center text-white/50 py-4 uppercase tracking-widest">Climb the ranks by working out!</p>
            )}
          </div>
        </section>
        
      </main>
    </div>
  );
}
