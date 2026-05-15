import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, query, where, orderBy, onSnapshot, addDoc, updateDoc, doc, deleteDoc, getDocs, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Challenge, ChallengeParticipant, UserProfile } from '../types';
import { Trophy, Target, Calendar, Users, ChevronRight, Plus, Loader2, CheckCircle2, TrendingUp, X, Award, Lock } from 'lucide-react';
import { format, isAfter, isBefore, parseISO } from 'date-fns';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';
import { cn } from '../lib/utils';
import { SEO } from '../components/SEO';
import { toast } from 'sonner';

export default function Challenges({ profile }: { profile: UserProfile | null }) {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [participations, setParticipations] = useState<ChallengeParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [gymTier, setGymTier] = useState<string>('starter');

  useEffect(() => {
    if (!profile?.gymId) return;

    const gymRef = doc(db, 'gyms', profile.gymId);
    const unsubGym = onSnapshot(gymRef, (snapshot) => {
      if (snapshot.exists()) {
        setGymTier(snapshot.data()?.subscriptionTier || 'starter');
      }
    });

    const qChallenges = query(collection(db, 'challenges'), where('gymId', '==', profile.gymId));
    const unsubChallenges = onSnapshot(qChallenges, (snapshot) => {
      setChallenges(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Challenge)));
      setLoading(false);
    }, (error) => {
      setTimeout(() => {
        handleFirestoreError(error, OperationType.LIST, 'challenges');
      }, 0);
    });

    const qParticipants = query(
      collection(db, 'challengeParticipants'), 
      where('userId', '==', profile.uid),
      where('gymId', '==', profile.gymId)
    );
    const unsubParticipations = onSnapshot(qParticipants, (snapshot) => {
      setParticipations(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChallengeParticipant)));
    }, (error) => {
      setTimeout(() => {
        handleFirestoreError(error, OperationType.LIST, 'challengeParticipants');
      }, 0);
    });

    return () => {
      unsubGym();
      unsubChallenges();
      unsubParticipations();
    };
  }, [profile?.uid, profile?.gymId]);

  const handleJoin = async (challenge: Challenge) => {
    if (!profile || !profile.gymId) return;
    try {
      const participant: any = {
        challengeId: challenge.id!,
        userId: profile.uid,
        userName: profile.displayName || 'Anonymous Member',
        progress: 0,
        completed: false,
        joinedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        gymId: profile.gymId
      };
      await addDoc(collection(db, 'challengeParticipants'), participant);
      toast.success(`Joined ${challenge.title}! Let's go!`);
    } catch (error) {
      console.error(error);
      toast.error('Failed to join challenge');
    }
  };

  const handleLogProgress = async (participation: ChallengeParticipant, amount: number) => {
    try {
      const challenge = challenges.find(c => c.id === participation.challengeId);
      if (!challenge) return;

      const newProgress = participation.progress + amount;
      const isCompleted = newProgress >= challenge.target;

      await updateDoc(doc(db, 'challengeParticipants', participation.id!), {
        progress: newProgress,
        completed: isCompleted,
        updatedAt: new Date().toISOString()
      });

      if (isCompleted && !participation.completed) {
        toast.success(`🏆 Challenge Completed: ${challenge.title}!`);
        // In a real app, we'd also award a badge here
        if (challenge.badgeId) {
            await addDoc(collection(db, 'userBadges'), {
                userId: profile?.uid,
                badgeId: challenge.badgeId,
                earnedAt: new Date().toISOString()
            });
        }
      } else {
        toast.success('Progress updated!');
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to update progress');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  const activeChallenges = challenges.filter(c => isAfter(parseISO(c.endDate), new Date()));
  const pastChallenges = challenges.filter(c => isBefore(parseISO(c.endDate), new Date()));

  if (gymTier === 'starter') {
    return (
      <div className="space-y-10 pb-20 relative">
        <SEO title="Fitness Challenges" />
        
        {/* Lock Overlay */}
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md rounded-3xl">
          <div className="text-center p-8 bg-surface-container-high rounded-3xl border border-white/10 max-w-sm">
            <div className="w-16 h-16 bg-primary/20 flex items-center justify-center rounded-full mx-auto mb-4">
              <Lock className="text-primary w-8 h-8" />
            </div>
            <h3 className="font-headline font-black text-2xl uppercase italic mb-2">Pro Feature</h3>
            <p className="text-sm text-on-surface-variant font-medium">
              Challenges and Leaderboards require a Professional or Elite gym subscription. Contact your Gym Admin for upgrades.
            </p>
          </div>
        </div>

        <header className="relative pt-4 opacity-30 pointer-events-none">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="max-w-3xl"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="h-[1px] w-12 bg-primary" />
              <span className="font-headline font-bold uppercase tracking-[0.3em] text-primary text-[10px]">Peak Performance</span>
            </div>
            <h2 className="font-headline font-black text-4xl sm:text-7xl lg:text-8xl leading-none uppercase italic tracking-tighter mb-6">
              FITNESS<br/>
              <span className="text-primary-dim">CHALLENGES</span>
            </h2>
          </motion.div>
        </header>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-20">
      <SEO title="Fitness Challenges" />

      <header className="relative pt-4">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="max-w-3xl"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="h-[1px] w-12 bg-primary" />
            <span className="font-headline font-bold uppercase tracking-[0.3em] text-primary text-[10px]">Peak Performance</span>
          </div>
          <h2 className="font-headline font-black text-4xl sm:text-7xl lg:text-8xl leading-none uppercase italic tracking-tighter mb-6">
            FITNESS<br/>
            <span className="text-primary-dim">CHALLENGES</span>
          </h2>
          <p className="text-on-surface-variant font-medium text-sm max-w-lg leading-relaxed">
            Push your boundaries, compete with the community, and earn exclusive elite badges.
          </p>
        </motion.div>
      </header>

      {/* Challenge Grid */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="font-headline font-black text-2xl uppercase italic tracking-tight">Active Challenges</h3>
          {(profile?.role === 'admin' || profile?.role === 'owner') && (
            <button 
              onClick={() => {
                if (gymTier === 'starter') {
                  toast.error('Custom Challenges require Professional or Elite plan.');
                  return;
                }
                setShowCreateModal(true);
              }}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-transform",
                gymTier === 'starter' 
                  ? "bg-surface-container-highest text-on-surface-variant cursor-not-allowed" 
                  : "bg-primary text-on-primary-fixed hover:scale-105"
              )}
            >
              {gymTier === 'starter' ? <Lock size={16} /> : <Plus size={16} />}
              New Challenge
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeChallenges.map((challenge, index) => {
            const participation = participations.find(p => p.challengeId === challenge.id);
            return (
              <ChallengeCard 
                key={challenge.id} 
                challenge={challenge} 
                participation={participation} 
                onJoin={() => handleJoin(challenge)}
                onLog={(amount) => handleLogProgress(participation!, amount)}
                index={index}
              />
            );
          })}
          {activeChallenges.length === 0 && (
            <div className="col-span-full py-20 text-center bg-surface-container-low rounded-3xl border border-dashed border-white/10">
              <p className="text-on-surface-variant font-medium italic">No active challenges at the moment. Check back soon!</p>
            </div>
          )}
        </div>
      </section>

      {/* Leaderboard Section (Optional) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-12">
            <ChallengeLeaderboard challenges={activeChallenges} gymId={profile?.gymId} />
        </div>
      </section>

      <AnimatePresence>
        {showCreateModal && (
          <CreateChallengeModal 
            profile={profile}
            onClose={() => setShowCreateModal(false)} 
            onCreated={() => setShowCreateModal(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function ChallengeCard({ challenge, participation, onJoin, onLog, index }: { 
  challenge: Challenge, 
  participation?: ChallengeParticipant, 
  onJoin: () => void,
  onLog: (amount: number) => void,
  index: number,
  key?: any
}) {
  const [logValue, setLogValue] = useState("");
  const progressPercent = participation 
    ? Math.min(Math.round((participation.progress / challenge.target) * 100), 100)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-surface-container-low rounded-3xl border border-white/5 overflow-hidden group hover:border-primary/20 transition-all"
    >
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-start">
          <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
            <Trophy size={24} />
          </div>
          <div className="px-3 py-1 bg-white/5 rounded-full text-[8px] font-black uppercase tracking-widest text-on-surface-variant">
            {challenge.type}
          </div>
        </div>

        <div>
          <h4 className="font-headline font-bold text-xl uppercase italic group-hover:text-primary transition-colors">{challenge.title}</h4>
          <p className="text-xs text-on-surface-variant mt-2 line-clamp-2">{challenge.description}</p>
        </div>

        <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
            <div className="flex items-center gap-1.5">
                <Target size={14} className="text-primary" />
                <span>{challenge.target} {challenge.type === 'attendance' ? 'Sessions' : challenge.type}</span>
            </div>
            <div className="flex items-center gap-1.5">
                <Calendar size={14} className="text-primary" />
                <span>Ends {format(parseISO(challenge.endDate), 'MMM dd')}</span>
            </div>
        </div>

        {participation ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                <span className="text-on-surface-variant">Your Progress</span>
                <span className={cn(participation.completed ? "text-green-500" : "text-primary")}>
                    {participation.progress} / {challenge.target} ({progressPercent}%)
                </span>
              </div>
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  className={cn("h-full transition-all duration-1000", participation.completed ? "bg-green-500" : "bg-primary")}
                />
              </div>
            </div>

            {!participation.completed && (
              <div className="flex gap-2">
                <input 
                  type="number" 
                  placeholder="Amt"
                  value={logValue}
                  onChange={(e) => setLogValue(e.target.value)}
                  className="w-20 bg-white/5 border border-white/10 rounded-xl px-3 text-[10px] font-bold text-white focus:outline-none focus:border-primary"
                />
                <button 
                  onClick={() => {
                    const val = parseFloat(logValue);
                    if (!isNaN(val) && val > 0) {
                      onLog(val);
                      setLogValue("");
                    }
                  }}
                  className="flex-1 kinetic-gradient h-10 rounded-xl text-[10px] font-black uppercase tracking-widest text-on-primary-fixed"
                >
                  Log Work
                </button>
              </div>
            )}
            
            {participation.completed && (
               <div className="flex items-center justify-center gap-2 py-2 bg-green-500/10 rounded-xl text-green-500">
                  <CheckCircle2 size={16} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Goal Achieved</span>
               </div>
            )}
          </div>
        ) : (
          <button 
            onClick={onJoin}
            className="w-full h-12 border border-primary/20 bg-primary/5 hover:bg-primary hover:text-on-primary-fixed rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
          >
            Join Challenge
          </button>
        )}
      </div>
    </motion.div>
  );
}

function ChallengeLeaderboard({ challenges, gymId }: { challenges: Challenge[], gymId?: string }) {
    const [selectedId, setSelectedId] = useState<string | null>(challenges[0]?.id || null);
    const [leaderboard, setLeaderboard] = useState<ChallengeParticipant[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!selectedId || !gymId) return;
        setLoading(true);
        const q = query(
            collection(db, 'challengeParticipants'),
            where('challengeId', '==', selectedId),
            where('gymId', '==', gymId),
            orderBy('progress', 'desc'),
            limit(10)
        );
        const unsub = onSnapshot(q, (snapshot) => {
            setLeaderboard(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChallengeParticipant)));
            setLoading(false);
        }, (error) => {
          setTimeout(() => {
            handleFirestoreError(error, OperationType.LIST, 'challengeParticipants');
          }, 0);
        });
        return unsub;
    }, [selectedId]);

    if (challenges.length === 0) return null;

    return (
        <div className="bg-surface-container-low rounded-3xl border border-white/5 overflow-hidden">
            <div className="p-8 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-3">
                    <TrendingUp size={24} className="text-primary" />
                    <div>
                        <h4 className="font-headline font-black text-2xl uppercase italic tracking-tight">Elite Leaderboard</h4>
                        <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest">Daily rankings of current challengers</p>
                    </div>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
                    {challenges.map(c => (
                        <button 
                            key={c.id}
                            onClick={() => setSelectedId(c.id!)}
                            className={cn(
                                "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shrink-0",
                                selectedId === c.id ? "bg-primary text-on-primary-fixed" : "bg-white/5 text-on-surface-variant hover:bg-white/10"
                            )}
                        >
                            {c.title}
                        </button>
                    ))}
                </div>
            </div>

            <div className="p-4">
                {loading ? (
                    <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" /></div>
                ) : (
                    <div className="space-y-1">
                        {leaderboard.map((entry, i) => (
                            <div 
                                key={entry.id}
                                className={cn(
                                    "flex items-center gap-4 p-4 rounded-2xl transition-all",
                                    i === 0 ? "bg-primary/10 border border-primary/20 shadow-[0_0_15px_rgba(255,143,111,0.1)]" : "hover:bg-white/5"
                                )}
                            >
                                <div className={cn(
                                    "w-8 h-8 rounded-full flex items-center justify-center font-headline font-black italic",
                                    i === 0 ? "bg-primary text-on-primary-fixed" : 
                                    i === 1 ? "bg-silver-gradient text-black" :
                                    i === 2 ? "bg-orange-500 text-white" : "bg-white/5 text-on-surface-variant"
                                )}>
                                    {i + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-headline font-bold text-sm uppercase truncate">{entry.userName}</p>
                                    <p className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold">Member</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-headline font-black text-xl text-primary">{entry.progress}</p>
                                    <p className="text-[8px] font-black uppercase tracking-widest text-on-surface-variant">Units</p>
                                </div>
                            </div>
                        ))}
                        {leaderboard.length === 0 && (
                            <div className="py-10 text-center text-on-surface-variant italic font-medium">No one has joined this challenge yet.</div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

function CreateChallengeModal({ profile, onClose, onCreated }: { profile: UserProfile | null, onClose: () => void, onCreated: () => void }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'attendance',
    target: 30,
    startDate: '',
    endDate: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.gymId) return;
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'challenges'), {
        ...formData,
        target: Number(formData.target),
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString(),
        gymId: profile.gymId
      });
      toast.success('Challenge created successfully!');
      onCreated();
    } catch (error) {
      console.error(error);
      toast.error('Failed to create challenge');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-background/80 backdrop-blur-md"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-surface-container w-full max-w-lg rounded-3xl border border-white/10 shadow-2xl relative z-10 overflow-hidden"
      >
        <div className="p-8 border-b border-white/5 flex justify-between items-center">
            <h3 className="font-headline font-black text-2xl uppercase italic">Initiate Challenge</h3>
            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
            <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Challenge Title</label>
                <input 
                    required
                    type="text" 
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="E.G. 30 DAY SHRED"
                    className="w-full bg-surface-container-high border border-white/5 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-primary"
                />
            </div>
            <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Mission Description</label>
                <textarea 
                    required
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="WHAT ARE THE OBJECTIVES?"
                    className="w-full bg-surface-container-high border border-white/5 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-primary min-h-[100px]"
                />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Type</label>
                    <select 
                        value={formData.type}
                        onChange={(e) => setFormData({...formData, type: e.target.value})}
                        className="w-full bg-surface-container-high border border-white/5 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-primary"
                    >
                        <option value="attendance">Attendance</option>
                        <option value="steps">Steps</option>
                        <option value="weight">Weight</option>
                        <option value="sets">Sets</option>
                    </select>
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Target Units</label>
                    <input 
                        required
                        type="number" 
                        value={formData.target}
                        onChange={(e) => setFormData({...formData, target: Number(e.target.value)})}
                        className="w-full bg-surface-container-high border border-white/5 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-primary"
                    />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Start Date</label>
                    <input 
                        required
                        type="date" 
                        value={formData.startDate}
                        onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                        className="w-full bg-surface-container-high border border-white/5 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-primary"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">End Date</label>
                    <input 
                        required
                        type="date" 
                        value={formData.endDate}
                        onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                        className="w-full bg-surface-container-high border border-white/5 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-primary"
                    />
                </div>
            </div>
            <button 
                type="submit"
                disabled={submitting}
                className="w-full kinetic-gradient py-4 rounded-xl font-black uppercase tracking-[0.2em] text-on-primary-fixed shadow-xl shadow-primary/20 active:scale-[0.98] transition-all disabled:opacity-50"
            >
                {submitting ? <Loader2 className="animate-spin mx-auto" /> : "Deploy Challenge"}
            </button>
        </form>
      </motion.div>
    </div>
  );
}
