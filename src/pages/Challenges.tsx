import React, { useEffect, useState, useMemo } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserProfile } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Activity, Medal, Flame, TrendingUp, X, Award, Zap, Crosshair } from 'lucide-react';
import { cn } from '../lib/utils';
import { SEO } from '../components/SEO';

type LeaderboardCategory = 'attendanceStreak' | 'benchPR' | 'squatPR' | 'deadliftPR' | 'totalStrength' | 'xp';

const CATEGORIES: { id: LeaderboardCategory; label: string; icon: any; color: string }[] = [
  { id: 'attendanceStreak', label: 'Streak 🔥', icon: Flame, color: 'text-orange-500' },
  { id: 'totalStrength', label: 'Total Strength', icon: Activity, color: 'text-primary' },
  { id: 'benchPR', label: 'Bench Press', icon: Crosshair, color: 'text-blue-400' },
  { id: 'squatPR', label: 'Squat', icon: Zap, color: 'text-green-500' },
  { id: 'deadliftPR', label: 'Deadlift', icon: TrendingUp, color: 'text-purple-500' },
  { id: 'xp', label: 'Gym XP', icon: Trophy, color: 'text-yellow-500' },
];

export default function Challenges({ profile }: { profile: UserProfile | null }) {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<LeaderboardCategory>('attendanceStreak');
  const [selectedMember, setSelectedMember] = useState<any | null>(null);

  useEffect(() => {
    if (!profile?.gymId) return;

    // Fetch all members of this gym
    const q = query(collection(db, 'users'), where('gymId', '==', profile.gymId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMembers(fetched);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [profile?.gymId]);

  const sortedMembers = useMemo(() => {
    return [...members]
      .filter(m => m[category] !== undefined && m[category] > 0)
      .sort((a, b) => {
        const valA = a[category] || 0;
        const valB = b[category] || 0;
        return valB - valA;
      });
  }, [members, category]);

  const formatValue = (cat: LeaderboardCategory, val: number) => {
    if (cat.includes('PR') || cat === 'totalStrength') return `${val}kg`;
    if (cat === 'attendanceStreak') return `${val} Days`;
    return `${val} XP`;
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col space-y-8 lg:pb-12">
      <SEO title="Gym Leaderboard" description="See where you stand among your peers." />
      
      {/* Header Info */}
      <section className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 relative">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-primary/20 blur-[120px] rounded-full pointer-events-none" />
        <div>
          <span className="font-headline font-bold uppercase tracking-[0.3em] text-primary text-[10px] sm:text-xs mb-3 block flex items-center gap-2">
            <Trophy size={14} /> Competitive Ranks
          </span>
          <h2 className="font-headline font-black text-5xl sm:text-7xl uppercase italic leading-none text-white tracking-tighter drop-shadow-lg">
            Gym <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-orange-500">Leaderboard</span>
          </h2>
        </div>
        
        {/* User Summary Card */}
        {profile && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-surface-container-high/80 backdrop-blur-xl p-5 rounded-2xl border border-white/10 flex items-center gap-8 min-w-[300px] shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
            <div className="flex flex-col relative z-10">
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.2em] mb-1">My Rank XP</span>
              <span className="font-headline text-3xl font-black text-yellow-500 drop-shadow-md">{profile.xp || 0}</span>
            </div>
            <div className="w-px h-12 bg-white/10 relative z-10" />
            <div className="flex flex-col relative z-10">
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.2em] mb-1">Fire Streak</span>
              <span className="font-headline text-3xl font-black text-orange-500 drop-shadow-md flex items-center gap-1">
                {profile.attendanceStreak || 0} <Flame size={20} className="text-orange-500" />
              </span>
            </div>
          </motion.div>
        )}
      </section>

      {/* Tabs - Modern Sticky behavior */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md pt-2 pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="flex overflow-x-auto hide-scrollbar gap-3 w-full snap-x pb-2">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isActive = category === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={cn(
                  "snap-start whitespace-nowrap px-5 py-3 flex items-center gap-2.5 rounded-full font-bold uppercase tracking-widest text-[10px] sm:text-xs transition-all",
                  isActive 
                    ? `bg-primary text-on-primary-fixed shadow-[0_0_20px_rgba(255,143,111,0.4)] scale-105 transform` 
                    : "bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-white border border-white/5 hover:border-white/10"
                )}
              >
                <Icon size={16} className={isActive ? "" : cat.color} />
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Podium Top 3 */}
      {sortedMembers.length > 0 && (
        <div className="flex justify-center flex-wrap sm:flex-nowrap items-end gap-4 sm:gap-8 mt-12 mb-16 px-2">
          {/* #2 Rank */}
          {sortedMembers[1] && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
              className="flex flex-col items-center cursor-pointer hover:-translate-y-3 transition-transform w-[110px] sm:w-[140px] order-2 sm:order-1"
              onClick={() => setSelectedMember(sortedMembers[1])}
            >
              <div className="relative mb-4 flex flex-col items-center">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-[4px] border-slate-300 relative z-10 shadow-[0_0_25px_rgba(203,213,225,0.3)] bg-surface-container">
                  <img src={sortedMembers[1].photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${sortedMembers[1].id}`} alt="Rank 2" className="w-full h-full object-cover" />
                </div>
                <div className="absolute -bottom-4 bg-gradient-to-b from-slate-200 to-slate-400 text-slate-900 font-black text-xs px-4 py-1 rounded-full z-20 shadow-xl border border-white/20">2ND</div>
              </div>
              <div className="bg-gradient-to-t from-slate-400/20 to-transparent border-t-2 border-slate-300/40 w-full h-[120px] rounded-t-2xl flex flex-col items-center justify-start pt-6 text-center px-2 backdrop-blur-sm">
                <span className="text-xs font-bold text-white uppercase truncate w-full tracking-widest">{sortedMembers[1].displayName?.split(' ')[0] || 'User'}</span>
                <span className="font-headline font-black text-slate-300 text-2xl mt-1 drop-shadow-md">{formatValue(category, sortedMembers[1][category] || 0)}</span>
              </div>
            </motion.div>
          )}

          {/* #1 Rank */}
          {sortedMembers[0] && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.7, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              className="flex flex-col items-center z-20 cursor-pointer hover:-translate-y-3 transition-transform w-[140px] sm:w-[180px] order-1 sm:order-2"
              onClick={() => setSelectedMember(sortedMembers[0])}
            >
              <div className="relative mb-4 flex flex-col items-center">
                <motion.div 
                  animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 2 }}
                >
                  <Trophy size={36} className="text-yellow-400 mb-2 drop-shadow-[0_0_15px_rgba(250,204,21,0.8)]" />
                </motion.div>
                <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full overflow-hidden border-[6px] border-yellow-400 relative z-10 shadow-[0_0_40px_rgba(250,204,21,0.5)] bg-surface-container">
                  <img src={sortedMembers[0].photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${sortedMembers[0].id}`} alt="Rank 1" className="w-full h-full object-cover" />
                </div>
                <div className="absolute -bottom-5 bg-gradient-to-b from-yellow-300 to-yellow-600 text-yellow-950 font-black text-sm px-6 py-1.5 rounded-full z-20 shadow-xl border border-yellow-200">1ST</div>
              </div>
              <div className="bg-gradient-to-t from-yellow-500/30 via-yellow-500/10 to-transparent border-t-2 border-yellow-400/60 w-full h-[150px] rounded-t-2xl flex flex-col items-center justify-start pt-8 text-center px-2 backdrop-blur-sm relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
                <span className="text-sm font-bold text-white uppercase truncate w-full tracking-widest relative z-10">{sortedMembers[0].displayName?.split(' ')[0] || 'User'}</span>
                <span className="font-headline font-black text-yellow-400 text-4xl mt-1 drop-shadow-xl relative z-10">{formatValue(category, sortedMembers[0][category] || 0)}</span>
              </div>
            </motion.div>
          )}

          {/* #3 Rank */}
          {sortedMembers[2] && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}
              className="flex flex-col items-center cursor-pointer hover:-translate-y-3 transition-transform w-[100px] sm:w-[130px] order-3 sm:order-3"
              onClick={() => setSelectedMember(sortedMembers[2])}
            >
              <div className="relative mb-4 flex flex-col items-center">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border-[4px] border-orange-700 relative z-10 shadow-[0_0_20px_rgba(194,65,12,0.3)] bg-surface-container">
                  <img src={sortedMembers[2].photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${sortedMembers[2].id}`} alt="Rank 3" className="w-full h-full object-cover" />
                </div>
                <div className="absolute -bottom-4 bg-gradient-to-b from-orange-600 to-orange-800 text-orange-100 font-black text-xs px-4 py-1 rounded-full z-20 shadow-xl border border-white/20">3RD</div>
              </div>
              <div className="bg-gradient-to-t from-orange-700/20 to-transparent border-t-2 border-orange-700/40 w-full h-[100px] rounded-t-2xl flex flex-col items-center justify-start pt-6 text-center px-2 backdrop-blur-sm">
                <span className="text-[10px] sm:text-xs font-bold text-white uppercase truncate w-full tracking-widest">{sortedMembers[2].displayName?.split(' ')[0] || 'User'}</span>
                <span className="font-headline font-black text-orange-500 text-xl mt-1 drop-shadow-md">{formatValue(category, sortedMembers[2][category] || 0)}</span>
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* List for Rank 4+ */}
      <div className="flex-1 overflow-y-auto space-y-3 pb-24 lg:pb-8 relative">
        {sortedMembers.slice(3).map((member, index) => {
          const rank = index + 4;
          return (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => setSelectedMember(member)}
              className="bg-surface-container/60 backdrop-blur-sm rounded-2xl p-4 flex items-center justify-between border border-white/5 hover:border-primary/30 hover:bg-surface-container hover:shadow-lg hover:shadow-primary/5 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-4 sm:gap-6">
                <div className="w-10 flex justify-center">
                  <span className="font-headline font-black text-on-surface-variant text-2xl group-hover:text-white transition-colors">
                    {rank}
                  </span>
                </div>
                <div className="relative">
                  <img src={member.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.id}`} alt="avatar" className="w-12 h-12 rounded-full border-2 border-white/10 group-hover:border-primary/50 transition-colors object-cover" />
                  {member.membershipStatus === 'active' && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-surface-container" />
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-white text-base group-hover:text-primary transition-colors tracking-wide">{member.displayName || 'Unknown Member'}</span>
                  <span className="text-[10px] uppercase tracking-widest text-on-surface-variant">
                    {member.attendanceStreak ? `${member.attendanceStreak} Day Streak` : 'No Streak'}
                  </span>
                </div>
              </div>
              <div className="font-headline font-black text-2xl text-primary drop-shadow-[0_0_10px_rgba(255,143,111,0.2)]">
                {formatValue(category, member[category] || 0)}
              </div>
            </motion.div>
          );
        })}
        {sortedMembers.length === 0 && (
          <div className="text-center p-16 text-on-surface-variant border-2 border-dashed border-white/10 rounded-2xl bg-surface-container/30">
            <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }}>
              <Trophy size={64} className="mx-auto mb-6 opacity-20" />
            </motion.div>
            <p className="font-headline font-bold uppercase tracking-[0.2em] text-sm text-white/50">No active scores for this category yet</p>
          </div>
        )}
      </div>

      {/* Member Profile Modal */}
      <AnimatePresence>
        {selectedMember && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6"
          >
            <div className="absolute inset-0 bg-background/95 backdrop-blur-xl" onClick={() => setSelectedMember(null)} />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="relative bg-surface-base max-w-lg w-full rounded-[2rem] overflow-hidden shadow-2xl border border-white/10 flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="relative h-40 bg-surface-container-high border-b border-white/5 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent pointer-events-none z-10" />
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 mix-blend-overlay" />
                <button onClick={() => setSelectedMember(null)} className="absolute top-4 right-4 z-20 p-2.5 bg-black/40 backdrop-blur-md rounded-full hover:bg-primary hover:text-on-primary-fixed transition-all text-white">
                  <X size={20} />
                </button>
              </div>
              
              {/* Profile Avatar */}
              <div className="flex flex-col items-center -mt-20 relative z-20 px-6">
                <div className="relative">
                  <img src={selectedMember.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedMember.id}`} alt="avatar" className="w-36 h-36 rounded-full border-[6px] border-surface-base shrink-0 shadow-2xl bg-surface-container object-cover relative z-10" />
                  <div className="absolute inset-0 rounded-full shadow-[0_0_30px_rgba(255,143,111,0.3)] z-0" />
                </div>
                <h3 className="font-headline font-black text-3xl uppercase mt-4 text-center tracking-tight">{selectedMember.displayName || 'Member'}</h3>
                <div className="flex gap-3 items-center mt-3 flex-wrap justify-center">
                  <span className="px-4 py-1.5 rounded-full bg-yellow-500/10 text-yellow-500 font-bold text-[11px] uppercase tracking-widest flex items-center gap-1.5 border border-yellow-500/20">
                    <Trophy size={14} /> {selectedMember.xp || 0} XP
                  </span>
                  <span className="px-4 py-1.5 rounded-full bg-orange-500/10 text-orange-500 font-bold text-[11px] uppercase tracking-widest flex items-center gap-1.5 border border-orange-500/20">
                    <Flame size={14} /> {selectedMember.attendanceStreak || 0} Streak
                  </span>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="p-6 overflow-y-auto mt-2">
                <h4 className="font-headline font-bold text-xs uppercase tracking-[0.2em] text-on-surface-variant mb-4 flex items-center gap-2">
                  <Activity size={14} className="text-primary" /> Personal Records
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-surface-container p-4 rounded-2xl border border-white/5 flex flex-col items-center justify-center text-center">
                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1.5 opacity-80">Bench</span>
                    <span className="font-headline font-black text-2xl text-white drop-shadow-md">{selectedMember.benchPR || 0}<span className="text-xs text-on-surface-variant ml-0.5">kg</span></span>
                  </div>
                  <div className="bg-surface-container p-4 rounded-2xl border border-white/5 flex flex-col items-center justify-center text-center">
                    <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest mb-1.5 opacity-80">Squat</span>
                    <span className="font-headline font-black text-2xl text-white drop-shadow-md">{selectedMember.squatPR || 0}<span className="text-xs text-on-surface-variant ml-0.5">kg</span></span>
                  </div>
                  <div className="bg-surface-container p-4 rounded-2xl border border-white/5 flex flex-col items-center justify-center text-center">
                    <span className="text-[10px] font-bold text-purple-500 uppercase tracking-widest mb-1.5 opacity-80">Deadlift</span>
                    <span className="font-headline font-black text-2xl text-white drop-shadow-md">{selectedMember.deadliftPR || 0}<span className="text-xs text-on-surface-variant ml-0.5">kg</span></span>
                  </div>
                  <div className="bg-surface-container p-4 rounded-2xl border border-white/5 flex flex-col items-center justify-center text-center">
                    <span className="text-[10px] font-bold text-yellow-500 uppercase tracking-widest mb-1.5 opacity-80">OHP</span>
                    <span className="font-headline font-black text-2xl text-white drop-shadow-md">{selectedMember.overhead_pressPR || 0}<span className="text-xs text-on-surface-variant ml-0.5">kg</span></span>
                  </div>
                  <div className="bg-gradient-to-br from-surface-container-high to-surface-container p-5 rounded-2xl border border-primary/20 flex flex-col items-center justify-center text-center col-span-2 sm:col-span-4 mt-2 shadow-[0_0_30px_rgba(255,143,111,0.05)] relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
                    <span className="text-[11px] font-bold text-primary uppercase tracking-[0.2em] mb-2 relative z-10 flex items-center gap-2">
                       Total Base Strength
                    </span>
                    <span className="font-headline font-black text-4xl text-white relative z-10">{selectedMember.totalStrength || 0}<span className="text-base text-white/40 ml-1">kg</span></span>
                  </div>
                </div>

                {/* Achievements / Consistency */}
                {(selectedMember.attendanceStreak > 0 || selectedMember.xp > 0 || selectedMember.totalStrength > 0) && (
                  <div className="mt-8">
                    <h4 className="font-headline font-bold text-xs uppercase tracking-[0.2em] text-on-surface-variant mb-4 flex items-center gap-2">
                      <Medal size={14} className="text-yellow-500" /> Member Badges
                    </h4>
                    <div className="flex flex-wrap gap-3">
                      {selectedMember.totalStrength >= 300 && (
                        <div className="flex items-center gap-2 bg-gradient-to-r from-primary/20 to-primary/5 px-4 py-2 rounded-xl border border-primary/30 shadow-sm">
                          <Award className="text-primary" size={18} />
                          <span className="text-[11px] font-bold text-white uppercase tracking-widest">300kg Club</span>
                        </div>
                      )}
                      {selectedMember.attendanceStreak >= 7 && (
                        <div className="flex items-center gap-2 bg-gradient-to-r from-orange-500/20 to-orange-500/5 px-4 py-2 rounded-xl border border-orange-500/30 shadow-sm">
                          <Flame className="text-orange-500" size={18} />
                          <span className="text-[11px] font-bold text-white uppercase tracking-widest">7-Day Streak</span>
                        </div>
                      )}
                      {selectedMember.xp >= 1000 && (
                        <div className="flex items-center gap-2 bg-gradient-to-r from-yellow-500/20 to-yellow-500/5 px-4 py-2 rounded-xl border border-yellow-500/30 shadow-sm">
                          <Trophy className="text-yellow-500" size={18} />
                          <span className="text-[11px] font-bold text-white uppercase tracking-widest">Pro Member</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
