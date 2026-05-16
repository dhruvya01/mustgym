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
    <div className="h-full flex flex-col space-y-6 lg:pb-12">
      <SEO title="Gym Leaderboard" description="See where you stand among your peers." />
      
      {/* Header Info */}
      <section className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 relative">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary/20 blur-[100px] rounded-full pointer-events-none" />
        <div>
          <span className="font-headline font-bold uppercase tracking-[0.2em] text-primary text-[10px] sm:text-xs mb-2 block">Competitive Ranks</span>
          <h2 className="font-headline font-black text-4xl sm:text-6xl uppercase italic leading-none text-white tracking-tighter">
            Gym <br/><span className="text-primary">Leaderboard</span>
          </h2>
        </div>
        
        {/* User Summary Card */}
        {profile && (
          <div className="bg-surface-container/80 backdrop-blur-md p-4 rounded-xl border border-white/10 flex items-center gap-6 min-w-[280px]">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">My XP</span>
              <span className="font-headline text-2xl font-black text-yellow-500">{profile.xp || 0}</span>
            </div>
            <div className="w-px h-10 bg-white/10" />
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">My Streak</span>
              <span className="font-headline text-2xl font-black text-orange-500">{profile.attendanceStreak || 0}</span>
            </div>
          </div>
        )}
      </section>

      {/* Tabs */}
      <div className="flex overflow-x-auto pb-4 hide-scrollbar gap-2 w-full snap-x">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isActive = category === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className={cn(
                "snap-start whitespace-nowrap px-4 py-3 flex items-center gap-2 rounded-full font-bold uppercase tracking-widest text-[10px] sm:text-[11px] transition-all",
                isActive ? `bg-surface-bright text-white border border-primary text-primary` : "bg-surface-container-low text-on-surface-variant hover:text-white border border-transparent"
              )}
            >
              <Icon size={14} className={isActive ? cat.color : ""} />
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Podium Top 3 */}
      {sortedMembers.length > 0 && (
        <div className="flex justify-center items-end gap-2 sm:gap-6 mt-8 mb-8 h-[220px]">
          {/* #2 Rank */}
          {sortedMembers[1] && (
            <motion.div 
              initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center cursor-pointer hover:-translate-y-2 transition-transform w-[90px] sm:w-[120px]"
              onClick={() => setSelectedMember(sortedMembers[1])}
            >
              <div className="relative mb-3 flex flex-col items-center">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border-4 border-slate-300 relative z-10 shadow-[0_0_15px_rgba(203,213,225,0.2)]">
                  <img src={sortedMembers[1].photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${sortedMembers[1].id}`} alt="Rank 2" className="w-full h-full object-cover" />
                </div>
                <div className="absolute -bottom-3 bg-slate-300 text-black font-black text-[10px] px-2 py-0.5 rounded-full z-20 shadow-lg">2ND</div>
              </div>
              <div className="bg-gradient-to-t from-slate-300/20 to-transparent border-t border-slate-300/30 w-full h-[100px] rounded-t-lg flex flex-col items-center justify-start pt-4 text-center px-1">
                <span className="text-[10px] font-bold text-white uppercase truncate px-1 w-full">{sortedMembers[1].displayName?.split(' ')[0] || 'User'}</span>
                <span className="font-headline font-black text-slate-300 text-lg mt-1">{formatValue(category, sortedMembers[1][category] || 0)}</span>
              </div>
            </motion.div>
          )}

          {/* #1 Rank */}
          {sortedMembers[0] && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center z-10 cursor-pointer hover:-translate-y-2 transition-transform w-[110px] sm:w-[140px]"
              onClick={() => setSelectedMember(sortedMembers[0])}
            >
              <div className="relative mb-3 flex flex-col items-center">
                <Trophy size={28} className="text-yellow-500 mb-1 drop-shadow-[0_0_10px_rgba(234,179,8,0.8)] animate-pulse" />
                <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-full overflow-hidden border-4 border-yellow-500 relative z-10 shadow-[0_0_30px_rgba(234,179,8,0.4)]">
                  <img src={sortedMembers[0].photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${sortedMembers[0].id}`} alt="Rank 1" className="w-full h-full object-cover" />
                </div>
                <div className="absolute -bottom-3 bg-yellow-500 text-black font-black text-xs px-3 py-1 rounded-full z-20 shadow-lg">1ST</div>
              </div>
              <div className="bg-gradient-to-t from-yellow-500/30 to-transparent border-t border-yellow-500/50 w-full h-[130px] rounded-t-xl flex flex-col items-center justify-start pt-5 text-center px-1">
                <span className="text-xs font-bold text-white uppercase truncate px-2 w-full drop-shadow-md">{sortedMembers[0].displayName?.split(' ')[0] || 'User'}</span>
                <span className="font-headline font-black text-yellow-500 text-2xl mt-1 drop-shadow-md">{formatValue(category, sortedMembers[0][category] || 0)}</span>
              </div>
            </motion.div>
          )}

          {/* #3 Rank */}
          {sortedMembers[2] && (
            <motion.div 
              initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center cursor-pointer hover:-translate-y-2 transition-transform w-[90px] sm:w-[120px]"
              onClick={() => setSelectedMember(sortedMembers[2])}
            >
              <div className="relative mb-3 flex flex-col items-center">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden border-4 border-amber-700 relative z-10 shadow-[0_0_15px_rgba(180,83,9,0.2)]">
                  <img src={sortedMembers[2].photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${sortedMembers[2].id}`} alt="Rank 3" className="w-full h-full object-cover" />
                </div>
                <div className="absolute -bottom-3 bg-amber-700 text-white font-black text-[10px] px-2 py-0.5 rounded-full z-20 shadow-lg">3RD</div>
              </div>
              <div className="bg-gradient-to-t from-amber-700/20 to-transparent border-t border-amber-700/30 w-full h-[80px] rounded-t-lg flex flex-col items-center justify-start pt-3 text-center px-1">
                <span className="text-[10px] font-bold text-white uppercase truncate px-1 w-full">{sortedMembers[2].displayName?.split(' ')[0] || 'User'}</span>
                <span className="font-headline font-black text-amber-600 text-lg mt-1">{formatValue(category, sortedMembers[2][category] || 0)}</span>
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* List for Rank 4+ */}
      <div className="flex-1 overflow-y-auto space-y-3 pb-8">
        {sortedMembers.slice(3).map((member, index) => {
          const rank = index + 4;
          return (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => setSelectedMember(member)}
              className="bg-surface-container rounded-xl p-4 flex items-center justify-between border border-white/5 hover:bg-surface-bright transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-4">
                <div className="w-8 text-center font-headline font-black text-on-surface-variant text-xl">
                  {rank}
                </div>
                <img src={member.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.id}`} alt="avatar" className="w-10 h-10 rounded-full border border-white/10" />
                <div className="flex flex-col">
                  <span className="font-bold text-white text-sm group-hover:text-primary transition-colors">{member.displayName || 'Unknown Member'}</span>
                  {member.membershipStatus === 'active' && <span className="text-[8px] uppercase tracking-widest text-green-500 font-bold">Active Member</span>}
                </div>
              </div>
              <div className="font-headline font-black text-xl text-primary">
                {formatValue(category, member[category] || 0)}
              </div>
            </motion.div>
          );
        })}
        {sortedMembers.length === 0 && (
          <div className="text-center p-12 text-on-surface-variant border-2 border-dashed border-white/10 rounded-xl">
            <Trophy size={48} className="mx-auto mb-4 opacity-20" />
            <p className="font-headline font-bold uppercase tracking-widest text-xs">No active scores for this category yet</p>
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
            <div className="absolute inset-0 bg-background/90 backdrop-blur-md" onClick={() => setSelectedMember(null)} />
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="relative bg-surface-container max-w-lg w-full rounded-3xl overflow-hidden shadow-2xl border border-white/10 flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="relative h-32 bg-surface-container-high border-b border-white/5">
                <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent pointer-events-none" />
                <button onClick={() => setSelectedMember(null)} className="absolute top-4 right-4 z-10 p-2 bg-black/40 rounded-full hover:bg-black/60 transition">
                  <X size={20} className="text-white" />
                </button>
              </div>
              
              {/* Profile Avatar */}
              <div className="flex flex-col items-center -mt-16 relative z-10 px-6">
                <img src={selectedMember.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedMember.id}`} alt="avatar" className="w-32 h-32 rounded-full border-4 border-surface-container shrink-0 shadow-xl bg-surface-container object-cover" />
                <h3 className="font-headline font-black text-2xl uppercase mt-3 text-center">{selectedMember.displayName || 'Member'}</h3>
                <div className="flex gap-2 items-center mt-2 flex-wrap justify-center">
                  <span className="px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-500 font-black text-[10px] uppercase tracking-widest flex items-center gap-1 border border-yellow-500/20">
                    <Trophy size={10} /> {selectedMember.xp || 0} XP
                  </span>
                  <span className="px-3 py-1 rounded-full bg-orange-500/10 text-orange-500 font-black text-[10px] uppercase tracking-widest flex items-center gap-1 border border-orange-500/20">
                    <Flame size={10} /> {selectedMember.attendanceStreak || 0} Streak
                  </span>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="p-6 overflow-y-auto">
                <h4 className="font-headline font-bold text-xs uppercase tracking-widest text-on-surface-variant mb-4">Personal Records</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="bg-surface-container-low p-3 rounded-xl border border-white/5 flex flex-col items-center justify-center text-center">
                    <span className="text-[9px] font-bold text-blue-400 uppercase tracking-widest mb-1">Bench</span>
                    <span className="font-headline font-black text-xl text-white">{selectedMember.benchPR || 0}<span className="text-xs text-on-surface-variant">kg</span></span>
                  </div>
                  <div className="bg-surface-container-low p-3 rounded-xl border border-white/5 flex flex-col items-center justify-center text-center">
                    <span className="text-[9px] font-bold text-green-500 uppercase tracking-widest mb-1">Squat</span>
                    <span className="font-headline font-black text-xl text-white">{selectedMember.squatPR || 0}<span className="text-xs text-on-surface-variant">kg</span></span>
                  </div>
                  <div className="bg-surface-container-low p-3 rounded-xl border border-white/5 flex flex-col items-center justify-center text-center">
                    <span className="text-[9px] font-bold text-purple-500 uppercase tracking-widest mb-1">Deadlift</span>
                    <span className="font-headline font-black text-xl text-white">{selectedMember.deadliftPR || 0}<span className="text-xs text-on-surface-variant">kg</span></span>
                  </div>
                  <div className="bg-surface-container-low p-3 rounded-xl border border-white/5 flex flex-col items-center justify-center text-center">
                    <span className="text-[9px] font-bold text-yellow-500 uppercase tracking-widest mb-1">OHP</span>
                    <span className="font-headline font-black text-xl text-white">{selectedMember.overhead_pressPR || 0}<span className="text-xs text-on-surface-variant">kg</span></span>
                  </div>
                  <div className="bg-surface-container-low p-4 rounded-xl border border-primary/20 flex flex-col items-center justify-center text-center col-span-2 sm:col-span-4 mt-2">
                    <span className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1 shadow-[0_0_10px_rgba(255,143,111,0.2)]">Total Base Strength</span>
                    <span className="font-headline font-black text-3xl text-primary">{selectedMember.totalStrength || 0}<span className="text-base text-primary/50">kg</span></span>
                  </div>
                </div>

                {/* Achievements / Consistency */}
                {(selectedMember.attendanceStreak > 0 || selectedMember.xp > 0 || selectedMember.totalStrength > 0) && (
                  <div className="mt-6 p-4 rounded-xl bg-gradient-to-br from-surface-bright to-surface-container border border-white/10 flex flex-wrap gap-2">
                    {selectedMember.totalStrength >= 300 && (
                      <div className="flex items-center gap-2 bg-primary/10 px-3 py-1.5 rounded-full border border-primary/20">
                        <Award className="text-primary" size={14} />
                        <span className="text-[10px] font-bold text-primary uppercase tracking-widest">300kg Club</span>
                      </div>
                    )}
                    {selectedMember.attendanceStreak >= 7 && (
                      <div className="flex items-center gap-2 bg-orange-500/10 px-3 py-1.5 rounded-full border border-orange-500/20">
                        <Flame className="text-orange-500" size={14} />
                        <span className="text-[10px] font-bold text-orange-500 uppercase tracking-widest">7-Day Streak</span>
                      </div>
                    )}
                    {selectedMember.xp >= 1000 && (
                      <div className="flex items-center gap-2 bg-yellow-500/10 px-3 py-1.5 rounded-full border border-yellow-500/20">
                        <Trophy className="text-yellow-500" size={14} />
                        <span className="text-[10px] font-bold text-yellow-500 uppercase tracking-widest">Pro Member</span>
                      </div>
                    )}
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
