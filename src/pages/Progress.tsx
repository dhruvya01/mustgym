import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, onSnapshot, addDoc, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserProfile, AttendanceRecord, PersonalRecord } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, TrendingUp, Trophy, Activity, ChevronLeft, ChevronRight, Flame, Plus, Dumbbell, History, X, Loader2 } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, subDays, isYesterday, isSameMonth, parseISO } from 'date-fns';
import { cn } from '../lib/utils';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';
import { SEO } from '../components/SEO';
import { toast } from 'sonner';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

export default function Progress({ profile }: { profile: UserProfile | null }) {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [personalRecords, setPersonalRecords] = useState<PersonalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [streak, setStreak] = useState(0);
  const [showPRModal, setShowPRModal] = useState(false);
  const [savingPR, setSavingPR] = useState(false);
  const [prForm, setPrForm] = useState({
    lift: 'bench' as 'bench' | 'deadlift' | 'squat' | 'overhead_press' | 'body_weight',
    weight: '',
    notes: ''
  });

  useEffect(() => {
    if (!profile?.uid || !profile?.gymId) {
      setLoading(false);
      return;
    }

    setLoading(true);

    // Attendance Listener
    const attendancePath = 'attendance';
    const attendanceQ = query(
      collection(db, attendancePath), 
      where('userId', '==', profile.uid),
      where('gymId', '==', profile.gymId)
    );

    const unsubAttendance = onSnapshot(attendanceQ, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AttendanceRecord));
      fetched.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setAttendance(fetched);
      calculateStreak(fetched);
    }, (error) => {
      setTimeout(() => {
        handleFirestoreError(error, OperationType.LIST, attendancePath);
      }, 0);
    });

    // PR Listener
    const prPath = 'personalRecords';
    const prQ = query(
      collection(db, prPath),
      where('userId', '==', profile.uid),
      where('gymId', '==', profile.gymId)
    );

    const unsubPR = onSnapshot(prQ, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PersonalRecord));
      fetched.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      setPersonalRecords(fetched);
      setLoading(false);
    }, (error) => {
      setLoading(false);
      setTimeout(() => {
        handleFirestoreError(error, OperationType.LIST, prPath);
      }, 0);
    });

    return () => {
      unsubAttendance();
      unsubPR();
    };
  }, [profile?.uid, profile?.gymId]);

  const calculateStreak = (records: AttendanceRecord[]) => {
    if (records.length === 0) {
      setStreak(0);
      return;
    }

    const sortedDates = records
      .map(r => new Date(r.timestamp))
      .sort((a, b) => b.getTime() - a.getTime());

    // Remove duplicates (multiple check-ins on same day)
    const uniqueDates: Date[] = [];
    sortedDates.forEach(date => {
      if (!uniqueDates.some(d => isSameDay(d, date))) {
        uniqueDates.push(date);
      }
    });

    if (uniqueDates.length === 0) {
      setStreak(0);
      return;
    }

    let currentStreak = 0;
    let checkDate = new Date();

    // If no attendance today, check if there was attendance yesterday to continue streak
    const attendedToday = uniqueDates.some(d => isSameDay(d, checkDate));
    const attendedYesterday = uniqueDates.some(d => isSameDay(d, subDays(checkDate, 1)));

    if (!attendedToday && !attendedYesterday) {
      setStreak(0);
      return;
    }

    if (!attendedToday && attendedYesterday) {
      checkDate = subDays(checkDate, 1);
    }

    for (let i = 0; i < uniqueDates.length; i++) {
      if (isSameDay(uniqueDates[i], checkDate)) {
        currentStreak++;
        checkDate = subDays(checkDate, 1);
      } else {
        break;
      }
    }

    setStreak(currentStreak);
  };

  const monthDays = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth)
  });

  const getAttendanceForDay = (day: Date) => {
    return attendance.find(a => isSameDay(new Date(a.timestamp), day));
  };

  const handleAddPR = async () => {
    if (!profile || !prForm.weight || !profile.gymId) return;
    setSavingPR(true);
    try {
      const parsedWeight = parseFloat(prForm.weight);
      const newPR: any = {
        userId: profile.uid,
        lift: prForm.lift,
        weight: parsedWeight,
        date: new Date().toISOString(),
        notes: prForm.notes,
        gymId: profile.gymId
      };
      await addDoc(collection(db, 'personalRecords'), newPR);
      
      const userRef = doc(db, 'users', profile.uid);
      const userDoc = await getDoc(userRef);
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const prKey = `${prForm.lift}PR`;
        const currentScore = userData[prKey] || 0;
        
        let updates: any = {};
        if (prForm.lift !== 'body_weight' && parsedWeight > currentScore) {
            updates[prKey] = parsedWeight;
            updates.xp = (userData.xp || 0) + 50; 
        } else if (prForm.lift === 'body_weight') {
            updates[prKey] = parsedWeight; 
        } else {
            updates.xp = (userData.xp || 0) + 10; 
        }
        
        updates.attendanceStreak = streak;

        const getPR = (key: string, newValue: number, lift: string) => prForm.lift === lift ? newValue : (userData[key] || 0);
        updates.totalStrength = getPR('benchPR', updates.benchPR || getPR('benchPR', parsedWeight, 'bench'), 'bench') + 
                                getPR('squatPR', updates.squatPR || getPR('squatPR', parsedWeight, 'squat'), 'squat') + 
                                getPR('deadliftPR', updates.deadliftPR || getPR('deadliftPR', parsedWeight, 'deadlift'), 'deadlift');
        
        await updateDoc(userRef, updates);
      }

      toast.success(`${prForm.lift.toUpperCase().replace('_', ' ')} PR updated!`);
      setShowPRModal(false);
      setPrForm({ lift: 'bench', weight: '', notes: '' });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'personalRecords');
    } finally {
      setSavingPR(false);
    }
  };

  useEffect(() => {
     if (profile?.uid && streak > 0) {
        updateDoc(doc(db, 'users', profile.uid), { attendanceStreak: streak }).catch(console.error);
     }
  }, [streak, profile?.uid]);

  const getLatestPR = (lift: string) => {
    const liftRecords = personalRecords.filter(r => r.lift === lift);
    if (liftRecords.length === 0) return null;
    return liftRecords[liftRecords.length - 1];
  };

  const getPreviousPR = (lift: string) => {
    const liftRecords = personalRecords.filter(r => r.lift === lift);
    if (liftRecords.length < 2) return null;
    return liftRecords[liftRecords.length - 2];
  };

  const getChartData = () => {
    const dates = Array.from(new Set(personalRecords.map(r => format(parseISO(r.date), 'MMM dd'))));
    return dates.map(date => {
      const dataPoint: any = { date };
      ['bench', 'deadlift', 'squat', 'overhead_press', 'body_weight'].forEach(lift => {
        const record = personalRecords.filter(r => r.lift === lift && format(parseISO(r.date), 'MMM dd') === date).pop();
        if (record) {
          dataPoint[lift] = record.weight;
        } else {
          // Find the last known weight for this lift before this date
          const lastRecord = personalRecords
            .filter(r => r.lift === lift && parseISO(r.date) < parseISO(personalRecords.find(pr => format(parseISO(pr.date), 'MMM dd') === date)?.date || ''))
            .pop();
          if (lastRecord) dataPoint[lift] = lastRecord.weight;
        }
      });
      return dataPoint;
    });
  };

  return (
    <div className="space-y-12">
      <SEO title="Performance Progress" description="Track your gym attendance, streaks, and fitness evolution." />
      
      {/* PR Modal */}
      <AnimatePresence>
        {showPRModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPRModal(false)}
              className="absolute inset-0 bg-background/90 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-surface-container p-8 rounded-xl max-w-md w-full shadow-2xl border border-white/5"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-headline font-black text-2xl uppercase italic">Update Personal Record</h3>
                <button onClick={() => setShowPRModal(false)}>
                  <X size={24} className="text-on-surface-variant hover:text-white transition-colors" />
                </button>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-primary mb-2">Select Lift</label>
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                    {(['bench', 'deadlift', 'squat', 'overhead_press', 'body_weight'] as const).map((lift) => (
                      <button
                        key={lift}
                        onClick={() => setPrForm({ ...prForm, lift })}
                        className={cn(
                          "py-3 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all border",
                          prForm.lift === lift 
                            ? "bg-primary border-primary text-on-primary-fixed shadow-[0_0_15px_rgba(255,143,111,0.3)]" 
                            : "bg-surface-container-highest border-transparent text-on-surface-variant hover:border-white/10"
                        )}
                      >
                        {lift.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-primary mb-2">Weight (kg)</label>
                  <div className="relative">
                    <Dumbbell className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" size={18} />
                    <input 
                      type="number" 
                      placeholder="Enter weight..."
                      value={prForm.weight}
                      onChange={(e) => setPrForm({ ...prForm, weight: e.target.value })}
                      className="w-full bg-surface-container-highest border-none text-on-surface py-4 pl-12 pr-4 rounded-lg focus:ring-2 focus:ring-primary/40 text-lg font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-primary mb-2">Notes (Optional)</label>
                  <textarea 
                    placeholder="How did it feel? Any spotter?"
                    value={prForm.notes}
                    onChange={(e) => setPrForm({ ...prForm, notes: e.target.value })}
                    className="w-full bg-surface-container-highest border-none text-on-surface py-4 px-4 rounded-lg focus:ring-2 focus:ring-primary/40 resize-none h-24"
                  />
                </div>

                <button 
                  onClick={handleAddPR}
                  disabled={savingPR || !prForm.weight}
                  className="kinetic-gradient w-full py-4 rounded-lg font-headline font-bold uppercase tracking-widest text-on-primary-fixed flex items-center justify-center gap-2 disabled:opacity-50 shadow-xl"
                >
                  {savingPR ? <Loader2 className="animate-spin" size={20} /> : <Plus size={20} />}
                  Update Record
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Header */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-6">
        <div>
          <span className="font-headline font-bold uppercase tracking-[0.1em] text-primary text-[10px] sm:text-sm mb-1 sm:mb-2 block">Performance Analytics</span>
          <h2 className="font-headline font-black text-3xl sm:text-5xl md:text-6xl leading-none uppercase italic">
            Your <br/><span className="text-primary-dim">Evolution.</span>
          </h2>
        </div>
        <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4">
          <button 
            onClick={() => setShowPRModal(true)}
            className="kinetic-gradient px-6 py-3 sm:py-4 rounded-lg font-headline font-bold uppercase tracking-widest text-on-primary-fixed flex items-center justify-center gap-3 shadow-xl hover:opacity-90 active:scale-95 transition-all text-xs sm:text-sm"
          >
            <Trophy size={18} />
            Update PR
          </button>
          <div className="flex gap-3 sm:gap-4">
            <div className={cn(
              "px-4 sm:px-6 py-3 sm:py-4 rounded-lg border flex items-center gap-3 flex-1 sm:flex-none",
              profile?.membershipStatus === 'active' ? "bg-green-500/10 border-green-500/20" : 
              profile?.membershipStatus === 'halted' ? "bg-amber-500/10 border-amber-500/20" :
              "bg-surface-container-low border-white/5"
            )}>
              <div className={cn(
                "w-2 h-2 sm:w-3 sm:h-3 rounded-full animate-pulse shrink-0",
                profile?.membershipStatus === 'active' ? "bg-green-500" : 
                profile?.membershipStatus === 'halted' ? "bg-amber-500" : "bg-outline"
              )} />
              <div>
                <div className="text-[8px] sm:text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Status</div>
                <div className={cn(
                  "font-headline font-black text-lg sm:text-2xl uppercase italic leading-none",
                  profile?.membershipStatus === 'active' ? "text-green-500" : 
                  profile?.membershipStatus === 'halted' ? "text-amber-500" : "text-white"
                )}>
                  {profile?.membershipStatus || 'Pending'}
                </div>
              </div>
            </div>
            <div className="bg-surface-container-low px-4 sm:px-6 py-3 sm:py-4 rounded-lg border border-white/5 flex items-center gap-3 flex-1 sm:flex-none">
              <Flame className={cn("text-orange-500 shrink-0", streak > 0 && "animate-pulse")} size={20} />
              <div>
                <div className="text-[8px] sm:text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Streak</div>
                <div className="font-headline font-black text-lg sm:text-2xl leading-none">{streak} Days</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PR Tracking Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="font-headline text-xl font-bold uppercase tracking-tight">Personal <span className="text-primary">Records</span></h3>
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
            <TrendingUp size={14} className="text-primary" />
            Live Tracking
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-6">
          {(['bench', 'deadlift', 'squat', 'overhead_press', 'body_weight'] as const).map((lift) => {
            const latest = getLatestPR(lift);
            const previous = getPreviousPR(lift);
            const diff = latest && previous ? latest.weight - previous.weight : 0;

            return (
              <motion.div 
                key={lift}
                whileHover={{ y: -5 }}
                className="bg-surface-container-low p-3 sm:p-5 rounded-xl border border-white/5 relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Dumbbell size={60} />
                </div>
                
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-2 sm:mb-4">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary break-words max-w-[80%]">{lift.replace('_', ' ')}</span>
                    {diff !== 0 && (
                      <span className={cn(
                        "text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-1",
                        diff > 0 ? "bg-green-500/10 text-green-500" : "bg-error/10 text-error"
                      )}>
                        {diff > 0 ? '+' : ''}{diff}kg
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="font-headline text-3xl sm:text-5xl font-black text-white">{latest?.weight || 0}</span>
                    <span className="font-headline text-base sm:text-xl font-bold text-on-surface-variant uppercase">kg</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                    <Calendar size={12} />
                    {latest ? format(parseISO(latest.date), 'MMM dd, yyyy') : 'No record yet'}
                  </div>

                  {previous && (
                    <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Previous PR</span>
                      <span className="text-xs font-bold text-on-surface">{previous.weight}kg</span>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* PR Chart */}
        {personalRecords.length > 0 && (
          <div className="bg-surface-container-low p-4 sm:p-8 rounded-xl border border-white/5">
            <div className="flex items-center gap-3 mb-6 sm:mb-8">
              <History className="text-primary" size={20} />
              <h4 className="font-headline font-bold uppercase tracking-tight text-sm sm:text-base">Strength Progression</h4>
            </div>
            <div className="h-60 sm:h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={getChartData()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    stroke="#ffffff40" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false}
                    tick={{ fill: '#ffffff40' }}
                  />
                  <YAxis 
                    stroke="#ffffff40" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(value) => `${value}kg`}
                    tick={{ fill: '#ffffff40' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1a1a1a', 
                      border: '1px solid rgba(255,255,255,0.05)', 
                      borderRadius: '12px',
                      fontSize: '12px',
                      boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
                    }}
                    itemStyle={{ fontWeight: 'bold' }}
                    cursor={{ stroke: '#ff8f6f', strokeWidth: 1, strokeDasharray: '5 5' }}
                  />
                  <Legend 
                    verticalAlign="top" 
                    align="right" 
                    iconType="circle"
                    wrapperStyle={{ paddingBottom: '20px', fontSize: '10px', textTransform: 'uppercase', fontWeight: 'bold' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="bench" 
                    stroke="#ff8f6f" 
                    strokeWidth={3} 
                    dot={{ r: 4, fill: '#ff8f6f', strokeWidth: 0 }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                    name="Bench Press"
                    connectNulls
                  />
                  <Line 
                    type="monotone" 
                    dataKey="deadlift" 
                    stroke="#6366f1" 
                    strokeWidth={3} 
                    dot={{ r: 4, fill: '#6366f1', strokeWidth: 0 }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                    name="Deadlift"
                    connectNulls
                  />
                  <Line 
                    type="monotone" 
                    dataKey="squat" 
                    stroke="#22c55e" 
                    strokeWidth={3} 
                    dot={{ r: 4, fill: '#22c55e', strokeWidth: 0 }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                    name="Squat"
                    connectNulls
                  />
                  <Line 
                    type="monotone" 
                    dataKey="overhead_press" 
                    stroke="#eab308" 
                    strokeWidth={3} 
                    dot={{ r: 4, fill: '#eab308', strokeWidth: 0 }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                    name="OHP"
                    connectNulls
                  />
                  <Line 
                    type="monotone" 
                    dataKey="body_weight" 
                    stroke="#ec4899" 
                    strokeWidth={3} 
                    dot={{ r: 4, fill: '#ec4899', strokeWidth: 0 }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                    name="Body Weight"
                    connectNulls
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
        {/* Calendar Section */}
        <div className="lg:col-span-8">
          <div className="bg-surface-container-low p-3 sm:p-6 rounded-lg shadow-lg">
            <div className="flex justify-between items-center mb-4 sm:mb-8">
              <div className="flex flex-col">
                <span className="font-headline text-lg sm:text-2xl font-bold uppercase">{format(currentMonth, 'MMMM yyyy')}</span>
                <span className="text-[9px] sm:text-[10px] text-primary font-bold tracking-[0.2em] uppercase">Attendance Log</span>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
                  className="p-2 hover:bg-surface-container-highest transition-colors rounded"
                >
                  <ChevronLeft size={20} />
                </button>
                <button 
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
                  className="p-2 hover:bg-surface-container-highest transition-colors rounded"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center py-2 text-on-surface-variant font-headline text-[10px] font-bold uppercase tracking-widest">
                  {day}
                </div>
              ))}
              {/* Add empty cells for padding start of month */}
              {Array.from({ length: startOfMonth(currentMonth).getDay() }).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square" />
              ))}
              {monthDays.map((day, idx) => {
                const attended = getAttendanceForDay(day);
                const today = isToday(day);
                
                return (
                  <div 
                    key={idx}
                    className={cn(
                      "aspect-square flex flex-col items-center justify-center relative rounded-sm transition-colors group cursor-pointer",
                      today ? "bg-primary/10 ring-1 ring-primary ring-inset" : "bg-surface-container-highest/30 hover:bg-surface-container-highest"
                    )}
                  >
                    <span className={cn(
                      "font-headline font-bold text-sm",
                      today ? "text-primary" : "text-on-surface"
                    )}>
                      {format(day, 'd')}
                    </span>
                    {attended && (
                      <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="mt-1 w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_#ff8f6f]"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Stats Sidebar */}
        <div className="lg:col-span-4 flex flex-col gap-4 sm:gap-6">
          <div className="bg-surface-container p-4 sm:p-6 rounded-lg relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/20 transition-all duration-500"></div>
            <span className="text-on-surface-variant font-headline text-[10px] font-bold uppercase tracking-widest mb-2 block">Monthly Performance</span>
            <div className="flex items-baseline gap-2">
              <span className="font-headline text-4xl sm:text-6xl font-black text-white">
                {new Set(attendance
                  .filter(a => isSameMonth(new Date(a.timestamp), currentMonth))
                  .map(a => format(new Date(a.timestamp), 'yyyy-MM-dd'))
                ).size}
              </span>
              <span className="font-headline text-primary font-bold uppercase text-xs sm:text-sm">Days Total</span>
            </div>
            <div className="mt-4 w-full bg-surface-container-highest h-1.5 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((attendance.length / 20) * 100, 100)}%` }}
                className="bg-gradient-to-r from-primary to-primary-container h-full"
              />
            </div>
            <p className="mt-3 text-on-surface-variant text-[10px] sm:text-xs font-medium italic">
              Target: 20 sessions / month
            </p>
          </div>

          <div className="bg-primary rounded-lg p-4 sm:p-6 text-on-primary-fixed">
            <Trophy size={24} className="mb-3 sm:mb-4" />
            <h3 className="font-headline font-black text-xl sm:text-2xl uppercase leading-tight">Elite Status</h3>
            <p className="text-xs sm:text-sm opacity-80 mb-3 sm:mb-4">You are in the top 5% of members this month!</p>
            <div className="flex items-baseline gap-2">
              <span className="font-headline text-3xl sm:text-5xl font-black">
                {new Set(attendance.map(a => format(new Date(a.timestamp), 'yyyy-MM-dd'))).size}
              </span>
              <span className="font-headline text-base sm:text-xl font-bold uppercase">Total Sessions</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Sessions */}
      <section>
        <h3 className="font-headline text-xl font-bold uppercase tracking-tight mb-6">Recent <span className="text-primary">Sessions</span></h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {attendance.slice(0, 6).map((record, idx) => (
            <div key={idx} className="bg-surface-container p-4 flex items-center gap-4 group cursor-pointer hover:bg-surface-bright transition-colors rounded-lg border border-white/5">
              <div className="w-12 h-12 bg-surface-container-highest flex items-center justify-center rounded">
                <Activity className="text-primary" size={20} />
              </div>
              <div>
                <div className="text-[10px] text-on-surface-variant font-bold uppercase tracking-tighter">
                  {format(new Date(record.timestamp), 'MMM dd • hh:mm a')}
                </div>
                <div className="font-bold text-white uppercase tracking-tight">
                  {record.terminalId || 'Main Entrance'}
                </div>
              </div>
            </div>
          ))}
          {attendance.length === 0 && (
            <div className="col-span-full py-12 text-center bg-surface-container-low rounded-lg border-2 border-dashed border-white/5">
              <p className="text-on-surface-variant font-medium">No sessions logged yet. Head to the gym and scan in!</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

