import React, { useEffect, useState } from 'react';
import { UserProfile, AttendanceRecord, WorkoutPlan, Announcement, PersonalRecord } from '../types';
import { Play, QrCode, Activity, Dumbbell, Droplets, Target, Shield, Clock, Plus, Minus, Trophy, X, User as UserIcon, StopCircle, Zap } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { collection, query, where, getDocs, orderBy, limit, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { SEO } from '../components/SEO';
import { motion, AnimatePresence } from 'motion/react';
import { QRCodeSVG } from 'qrcode.react';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';
import { format, subDays, isSameDay, parseISO, subMinutes, isAfter } from 'date-fns';
import { cn } from '../lib/utils';
import { getGamificationData } from '../services/gamificationService';
import { toast } from 'sonner';

export default function Dashboard({ profile }: { profile: UserProfile | null }) {
  const { gymId: routeGymId } = useParams<{ gymId: string }>();
  const navigate = useNavigate();
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [liveAttendance, setLiveAttendance] = useState<AttendanceRecord[]>([]);
  const [latestPlan, setLatestPlan] = useState<WorkoutPlan | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [personalRecords, setPersonalRecords] = useState<PersonalRecord[]>([]);
  const [gymInfo, setGymInfo] = useState<any>(null);
  
  const [waterGlasses, setWaterGlasses] = useState(0);
  const [points, setPoints] = useState(0);
  const [level, setLevel] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showQR, setShowQR] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const currentGymId = routeGymId || profile?.gymId;

  useEffect(() => {
    if (!profile?.uid || !currentGymId) {
      setLoading(false);
      return;
    }

    const unsubGym = onSnapshot(doc(db, 'gyms', currentGymId), (snapshot) => {
      if (snapshot.exists()) {
        setGymInfo({ id: snapshot.id, ...snapshot.data() });
      }
    });

    const attendancePath = 'attendance';
    const qAttendance = query(
      collection(db, attendancePath),
      where('userId', '==', profile.uid),
      where('gymId', '==', currentGymId)
    );
    const unsubAttendance = onSnapshot(qAttendance, (snapshot) => {
      const records = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AttendanceRecord));
      records.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setAttendance(records);
    });

    const yesterday = subDays(new Date(), 1).toISOString();
    const qLive = query(
      collection(db, 'attendance'),
      where('gymId', '==', currentGymId),
      where('timestamp', '>=', yesterday)
    );
    const unsubLive = onSnapshot(qLive, (snapshot) => {
      setLiveAttendance(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AttendanceRecord)));
    });

    const qPlans = query(collection(db, 'workoutPlans'), where('userId', '==', profile.uid), where('gymId', '==', currentGymId));
    const unsubPlans = onSnapshot(qPlans, (snapshot) => {
      if (!snapshot.empty) {
        const plans = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WorkoutPlan));
        plans.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setLatestPlan(plans[0]);
      }
    });

    const qAnnouncements = query(collection(db, 'announcements'), where('gymId', '==', currentGymId), limit(3));
    const unsubAnnouncements = onSnapshot(qAnnouncements, (snapshot) => {
      const ann = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Announcement));
      ann.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setAnnouncements(ann);
    });

    const qPRs = query(collection(db, 'personalRecords'), where('userId', '==', profile.uid), where('gymId', '==', currentGymId));
    const unsubPRs = onSnapshot(qPRs, (snapshot) => {
      const prs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PersonalRecord));
      prs.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      setPersonalRecords(prs);
      setLoading(false);
    });

    getGamificationData(profile.uid).then(data => {
      if (data) {
        setPoints(data.totalPoints);
        setLevel(data.level);
      }
    });

    return () => {
      unsubGym();
      unsubAttendance();
      unsubLive();
      unsubPlans();
      unsubAnnouncements();
      unsubPRs();
    };
  }, [profile?.uid, currentGymId]);

  if (!profile) return null;

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
      <div className="p-6 md:p-12 flex flex-col items-center justify-center text-center">
        <SEO title="Account Suspended" />
        <Shield className="w-20 h-20 text-red-500 mb-6" />
        <h2 className="text-3xl font-black font-headline text-white mb-4 uppercase italic tracking-tighter">Account Suspended</h2>
        <p className="text-on-surface-variant max-w-sm mb-8 text-sm">Your access to {gymInfo?.name} has been temporarily suspended. Please contact the management.</p>
      </div>
    );
  }

  const getLatestPR = (lift: 'bench' | 'deadlift' | 'squat') => {
    const liftRecords = personalRecords.filter(r => r.lift === lift);
    return liftRecords.length > 0 ? liftRecords[liftRecords.length - 1].weight : 0;
  };

  const activeSession = attendance.find(a => {
    const checkInTime = parseISO(a.timestamp);
    const twoAndHalfHoursAgo = subMinutes(new Date(), 150);
    return isAfter(checkInTime, twoAndHalfHoursAgo) && !a.checkOutTime;
  });

  const handleCheckOut = async () => {
    if (!activeSession) return;
    setIsCheckingOut(true);
    try {
      await updateDoc(doc(db, 'attendance', activeSession.id!), {
        checkOutTime: new Date().toISOString()
      });
      toast.success('Session ended. Great workout!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to end session');
    } finally {
      setIsCheckingOut(false);
    }
  };

  const currentLiveAttendance = liveAttendance.filter(a => {
    const checkInTime = parseISO(a.timestamp);
    const twoAndHalfHoursAgo = subMinutes(new Date(), 150);
    return isAfter(checkInTime, twoAndHalfHoursAgo) && !a.checkOutTime;
  });

  const liveOccupancy = new Set(currentLiveAttendance.map(a => a.userId)).size;
  const occupancyPercentage = gymInfo?.expectedMembers ? Math.min(100, Math.round((liveOccupancy / gymInfo.expectedMembers) * 100)) : 0;

  return (
    <div className="space-y-8 pb-12">
      <SEO title="Dashboard" />
      
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            {gymInfo?.logoUrl ? (
              <img src={gymInfo.logoUrl} alt={gymInfo?.name} className="w-8 h-8 rounded-lg object-cover border border-white/10" />
            ) : (
              <img src="/logo.svg" alt="MustGym" className="w-8 h-8 rounded-lg object-cover" />
            )}
            <div className="flex flex-col">
               <span className="font-headline font-bold uppercase tracking-[0.3em] text-primary text-[10px] break-words">
                 {gymInfo?.name ? `${gymInfo.name.toUpperCase()} MEMBER` : 'ELITE MEMBER ACCESS'}
               </span>
               <span className="text-[10px] text-on-surface-variant font-medium tracking-widest uppercase mt-0.5">
                 {profile.membershipType ? `Plan: ${profile.membershipType}` : ''}
                 {(profile as any).branch ? ` • Branch: ${(profile as any).branch}` : ''}
               </span>
            </div>
          </div>
          <h2 className="font-headline font-black text-4xl sm:text-6xl md:text-7xl uppercase italic leading-none break-words mt-3">
            Welcome <br/><span className="text-primary-dim">{profile.displayName?.split(' ')[0] || 'Member'}</span>
          </h2>
          {activeSession && (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="mt-4 flex items-center gap-2 text-primary"
            >
              <Zap size={16} fill="currentColor" className="animate-pulse" />
              <span className="text-xs font-black uppercase tracking-[0.2em] italic">Your session starts now, go hard!</span>
            </motion.div>
          )}
          {gymInfo?.openTimings && !activeSession && (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="mt-4 flex items-center gap-2 text-on-surface-variant bg-surface-container-low px-4 py-2 rounded-full border border-white/5 inline-flex"
            >
              <Clock size={16} className="text-primary" />
              <span className="text-[10px] font-bold uppercase tracking-[0.1em]">Open Hours: {gymInfo.openTimings}</span>
            </motion.div>
          )}
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link 
            to="/scan"
            className="kinetic-gradient px-6 py-4 rounded-xl font-headline font-black uppercase tracking-widest text-on-primary-fixed flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(255,143,111,0.3)] hover:shadow-[0_0_40px_rgba(255,143,111,0.5)] transition-all active:scale-95 text-sm sm:text-base cursor-pointer"
          >
            <QrCode size={24} /> {activeSession ? 'Scan QR' : 'Scan Entry'}
          </Link>
          {activeSession && (
            <button 
              onClick={handleCheckOut}
              disabled={isCheckingOut}
              className="bg-error/10 text-error border border-error/20 px-6 py-4 rounded-xl font-headline font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-error/20 active:scale-95 transition-all text-sm sm:text-base disabled:opacity-50"
            >
              <StopCircle size={24} /> {isCheckingOut ? 'Ending...' : 'Check Out'}
            </button>
          )}
          <button 
            onClick={() => setShowQR(true)}
            className="bg-surface-container-highest border border-white/10 px-6 py-4 rounded-xl font-headline font-black uppercase tracking-widest text-on-surface flex items-center justify-center gap-3 hover:bg-white/10 transition-all active:scale-95 text-sm sm:text-base"
          >
            <UserIcon size={24} /> My Pass
          </button>
        </div>
      </section>

      {/* User QR Modal */}
      <AnimatePresence>
        {showQR && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowQR(false)}
              className="absolute inset-0 bg-background/90 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white p-10 rounded-2xl max-w-sm w-full shadow-2xl flex flex-col items-center text-center"
            >
              <button 
                onClick={() => setShowQR(false)}
                className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-900"
              >
                <X size={24} />
              </button>
              
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-primary mb-6 shadow-xl">
                 <img 
                    src={profile.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.uid}`} 
                    alt="" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                 />
              </div>
              
              <h3 className="font-headline font-black text-2xl uppercase italic mb-1 text-neutral-900">{profile.displayName || 'MEMBER PASS'}</h3>
              <p className="text-neutral-500 text-[10px] mb-8 uppercase tracking-[0.2em] font-black">{gymInfo?.name ? `${gymInfo.name} • ` : ''}MUSTGYM ACCESS</p>
              
              <div className="p-4 bg-white rounded-2xl shadow-inner border-2 border-neutral-100 mb-8">
                <QRCodeSVG value={`USER_ID:${profile.uid}`} size={200} includeMargin={true} />
              </div>
              
              <div className="flex items-center gap-2 px-6 py-3 bg-neutral-100 rounded-full mb-4">
                <Shield size={14} className="text-primary" />
                <span className="text-neutral-600 text-[10px] font-black uppercase tracking-widest">Secure Digital Identity</span>
              </div>
              
              <p className="text-neutral-400 text-[10px] font-medium uppercase tracking-tight max-w-[200px]">
                Show this code to your trainer or scan it at the gym entry terminal.
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left Column (Main Content) */}
        <div className="md:col-span-8 space-y-6">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-surface-container-low p-6 rounded-2xl border border-white/5 relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/20 rounded-full blur-2xl group-hover:bg-primary/30 transition-all opacity-50" />
              <div className="flex justify-between items-start mb-4 relative z-10">
                <h3 className="font-headline font-bold text-lg uppercase italic text-white flex items-center gap-2">
                  <Activity size={18} className="text-primary" /> Live Gym Load
                </h3>
                <span className="px-2 py-1 bg-primary/20 text-primary text-[10px] font-bold uppercase tracking-widest rounded flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" /> Live
                </span>
              </div>
              <div className="relative z-10 flex items-baseline gap-2 mb-2">
                <span className="font-headline font-black text-5xl text-white tracking-tighter">{liveOccupancy}</span>
                <span className="text-xs uppercase font-bold text-on-surface-variant tracking-widest">Members</span>
              </div>
              <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden relative z-10">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(5, occupancyPercentage)}%` }}
                  className={cn("h-full", occupancyPercentage > 80 ? "bg-red-500" : occupancyPercentage > 50 ? "bg-yellow-500" : "bg-green-500")}
                />
              </div>
            </div>

            <div className="bg-surface-container-low p-6 rounded-2xl border border-white/5 relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Trophy size={60} />
               </div>
               <div className="relative z-10">
                 <h3 className="font-headline font-bold text-lg uppercase italic text-white mb-4 flex items-center gap-2">
                    <Target size={18} className="text-primary" /> Gamification Hub
                 </h3>
                 <div className="flex justify-between items-end">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">Current Level</p>
                      <span className="font-headline font-black text-4xl text-primary">{level}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">Total Points</p>
                      <span className="font-headline font-bold text-2xl text-white">{points.toLocaleString()} XP</span>
                    </div>
                 </div>
               </div>
            </div>
          </div>

          <div className="bg-surface-container-low p-6 rounded-2xl border border-white/5">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-headline font-bold text-xl uppercase italic text-white flex items-center gap-2">
                <Droplets size={20} className="text-blue-500" /> Hydration Tracker
              </h3>
              <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Daily 12 Glasses</span>
            </div>
            <div className="flex items-center justify-between gap-4">
               <button 
                  onClick={() => setWaterGlasses(Math.max(0, waterGlasses - 1))}
                  className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 text-white transition-colors"
               >
                 <Minus size={18} />
               </button>
               <div className="flex-1 max-w-sm flex items-center justify-center gap-1 sm:gap-2 flex-wrap">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div 
                      key={i} 
                      className={cn(
                        "w-4 h-6 sm:w-6 sm:h-8 rounded", 
                        i < waterGlasses ? "bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" : "bg-white/10"
                      )}
                    />
                  ))}
               </div>
               <button 
                  onClick={() => setWaterGlasses(Math.min(12, waterGlasses + 1))}
                  className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center hover:bg-blue-600 transition-colors shadow-[0_0_15px_rgba(59,130,246,0.3)]"
               >
                 <Plus size={18} />
               </button>
            </div>
          </div>

          <div className="bg-surface-container-low p-6 rounded-2xl border border-white/5">
            <h3 className="font-headline font-bold text-xl uppercase italic text-white mb-6 flex items-center gap-2">
              <Dumbbell size={20} className="text-primary" /> PR Brief <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant self-end ml-2 pb-1 bg-surface-container-highest px-2 rounded">Quick View</span>
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-surface-container-highest p-4 rounded-xl text-center">
                <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant mb-1 mt-1">Bench</div>
                <div className="font-headline font-black text-2xl sm:text-3xl text-white">{getLatestPR('bench')}<span className="text-xs uppercase text-on-surface-variant ml-1">kg</span></div>
              </div>
              <div className="bg-surface-container-highest p-4 rounded-xl text-center">
                <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant mb-1 mt-1">Squat</div>
                <div className="font-headline font-black text-2xl sm:text-3xl text-white">{getLatestPR('squat')}<span className="text-xs uppercase text-on-surface-variant ml-1">kg</span></div>
              </div>
              <div className="bg-surface-container-highest p-4 rounded-xl text-center">
                <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant mb-1 mt-1">Deadlift</div>
                <div className="font-headline font-black text-2xl sm:text-3xl text-white">{getLatestPR('deadlift')}<span className="text-xs uppercase text-on-surface-variant ml-1">kg</span></div>
              </div>
            </div>
          </div>

          {latestPlan && (
            <div className="bg-surface-container-low p-6 rounded-2xl border border-white/5 group hover:border-primary/20 transition-all">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-headline font-bold text-xl uppercase italic text-white mb-1 flex items-center gap-2">
                    Phase Tracking
                  </h3>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-primary">{latestPlan.title}</p>
                </div>
                <Link to="/workouts" className="bg-primary/20 text-primary w-10 h-10 rounded-full flex items-center justify-center hover:bg-primary hover:text-white transition-colors">
                  <Play size={16} className="ml-1" />
                </Link>
              </div>
              <p className="text-xs text-on-surface-variant mb-4 line-clamp-2">{latestPlan.description}</p>
              <div className="flex flex-wrap gap-2">
                {latestPlan.exercises.slice(0, 3).map((ex, i) => (
                  <span key={i} className="text-[10px] font-bold uppercase tracking-widest bg-surface-container-highest text-on-surface px-2 py-1 rounded">
                    {ex.name}
                  </span>
                ))}
                {latestPlan.exercises.length > 3 && (
                  <span className="text-[10px] font-bold uppercase tracking-widest bg-surface-container-highest text-on-surface px-2 py-1 rounded">
                    +{latestPlan.exercises.length - 3} more
                  </span>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Right Column (Sidebar) */}
        <div className="md:col-span-4 space-y-6">
          
          <div className="bg-surface-container-low p-6 rounded-2xl border border-white/5">
            <h3 className="font-headline font-bold text-lg uppercase italic text-white mb-4">Announcements</h3>
            {announcements.length > 0 ? (
              <div className="space-y-4">
                {announcements.map((ann, i) => (
                  <div key={i} className="pb-4 border-b border-white/5 last:border-0 last:pb-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={cn(
                        "w-2 h-2 rounded-full",
                        ann.type === 'alert' ? "bg-red-500" : ann.type === 'event' ? "bg-yellow-500" : "bg-blue-500"
                      )} />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                        {format(new Date(ann.createdAt), 'MMM dd')}
                      </span>
                    </div>
                    <h4 className="font-bold text-sm text-white mb-1">{ann.title}</h4>
                    <p className="text-xs text-on-surface-variant line-clamp-2">{ann.content}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-on-surface-variant italic font-medium">No recent announcements.</p>
            )}
          </div>

          <div className="bg-surface-container-low p-6 rounded-2xl border border-white/5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-headline font-bold text-lg uppercase italic text-white flex items-center gap-2">
                 Recent Visits
              </h3>
              <Link to="/progress" className="text-[10px] font-bold uppercase tracking-widest text-primary hover:underline">View All</Link>
            </div>
            
            {attendance.length > 0 ? (
              <div className="space-y-3">
                {attendance.slice(0, 4).map((record, i) => (
                  <div key={i} className="flex justify-between items-center bg-surface-container-highest p-3 rounded-xl border border-white/5 overflow-hidden">
                     <div className="text-[10px] font-bold uppercase tracking-widest text-white truncate max-w-[120px]">
                       {format(new Date(record.timestamp), 'MMM dd')}
                     </div>
                     <span className="text-[9px] font-mono font-bold text-on-surface-variant bg-black/20 px-2 py-0.5 rounded">
                       {format(new Date(record.timestamp), 'hh:mm a')}
                     </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-on-surface-variant italic font-medium">No recorded visits yet. Scan your entry pass!</p>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

