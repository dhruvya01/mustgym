import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserProfile, WorkoutPlan } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Lock, ChevronRight, Sparkles, Loader2, Plus, X, Dumbbell, Trash2, Check, Utensils, Clock, Flame } from 'lucide-react';
import { generateWorkoutPlan, generateDietPlan } from '../services/gemini';
import { cn } from '../lib/utils';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';
import { SEO } from '../components/SEO';
import { toast } from 'sonner';
import { deleteDoc, doc } from 'firebase/firestore';
import { DietPlan } from '../types';

export default function Workouts({ profile }: { profile: UserProfile | null }) {
  const [activeTab, setActiveTab] = useState<'workouts' | 'diet'>('workouts');
  const [plans, setPlans] = useState<WorkoutPlan[]>([]);
  const [dietPlans, setDietPlans] = useState<DietPlan[]>([]);
  const [equipment, setEquipment] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<WorkoutPlan | null>(null);
  const [selectedDietPlan, setSelectedDietPlan] = useState<DietPlan | null>(null);
  
  const [preferences, setPreferences] = useState('');
  const [fitnessLevel, setFitnessLevel] = useState('Intermediate');
  const [goals, setGoals] = useState('Muscle Gain');
  const [workoutDays, setWorkoutDays] = useState('4');
  const [dietType, setDietType] = useState('nonveg');
  const [gymTier, setGymTier] = useState<string>('starter');

  // Manual Form State
  const [manualPlan, setManualPlan] = useState({
    title: '',
    description: '',
    exercises: [{ name: '', sets: 3, reps: '10-12', notes: '' }]
  });

  useEffect(() => {
    if (!profile?.uid || !profile?.gymId) return;

    setLoading(true);

    // Fetch Workout Plans
    const workoutPath = 'workoutPlans';
    const workoutQ = query(
      collection(db, workoutPath), 
      where('userId', '==', profile.uid),
      where('gymId', '==', profile.gymId)
    );

    const unsubWorkouts = onSnapshot(workoutQ, (snapshot) => {
      const fetchedPlans = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WorkoutPlan));
      fetchedPlans.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setPlans(fetchedPlans);
      setLoading(false);
    }, (error) => {
      setLoading(false);
      setTimeout(() => {
        handleFirestoreError(error, OperationType.LIST, workoutPath);
      }, 0);
    });

    // Fetch Diet Plans
    const dietPath = 'dietPlans';
    const dietQ = query(
      collection(db, dietPath), 
      where('userId', '==', profile.uid),
      where('gymId', '==', profile.gymId)
    );

    const unsubDiet = onSnapshot(dietQ, (snapshot) => {
      const fetchedDietPlans = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DietPlan));
      fetchedDietPlans.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setDietPlans(fetchedDietPlans);
      setLoading(false);
    }, (error) => {
      setLoading(false);
      setTimeout(() => {
        handleFirestoreError(error, OperationType.LIST, dietPath);
      }, 0);
    });

    // Fetch available equipment for this gym
    if (profile?.gymId) {
      const gymRef = doc(db, 'gyms', profile.gymId);
      const unsubGym = onSnapshot(gymRef, (snapshot) => {
        if (snapshot.exists()) {
          setGymTier(snapshot.data()?.subscriptionTier || 'starter');
        }
      });

      const equipQ = query(collection(db, 'equipment'), where('gymId', '==', profile.gymId));
      const unsubEquip = onSnapshot(equipQ, (snapshot) => {
        const equipNames = snapshot.docs
          .map(doc => doc.data().name)
          .filter(name => !!name);
        setEquipment(equipNames);
      }, (error) => {
        setTimeout(() => {
          handleFirestoreError(error, OperationType.LIST, 'equipment');
        }, 0);
      });
      return () => {
        unsubWorkouts();
        unsubDiet();
        unsubEquip();
        unsubGym();
      };
    }

    return () => {
      unsubWorkouts();
      unsubDiet();
    };
  }, [profile?.uid, profile?.gymId, activeTab]);

  const handleGenerate = async () => {
    if (!profile || !profile.gymId) return;
    setGenerating(true);
    try {
      if (activeTab === 'workouts') {
        const newPlanData = await generateWorkoutPlan(profile.uid, preferences, fitnessLevel, goals, equipment, parseInt(workoutDays));
        const plan: any = {
          userId: profile.uid,
          title: newPlanData.title,
          description: newPlanData.description,
          exercises: newPlanData.exercises,
          days: newPlanData.days,
          createdAt: new Date().toISOString(),
          gymId: profile.gymId
        };
        await addDoc(collection(db, 'workoutPlans'), plan);
        toast.success('AI Workout Plan generated!');
      } else {
        const newPlanData = await generateDietPlan(profile.uid, preferences, fitnessLevel, goals, dietType);
        const plan: any = {
          userId: profile.uid,
          title: newPlanData.title,
          description: newPlanData.description,
          meals: newPlanData.meals,
          createdAt: new Date().toISOString(),
          gymId: profile.gymId
        };
        await addDoc(collection(db, 'dietPlans'), plan);
        toast.success('AI Indian Diet Plan generated!');
      }
      setShowGenerator(false);
    } catch (error: any) {
      toast.error(error.message || 'An error occurred during generation.');
    } finally {
      setGenerating(false);
    }
  };

  const handleManualSubmit = async () => {
    if (!profile || !manualPlan.title || !profile.gymId) return;
    try {
      const plan: any = {
        userId: profile.uid,
        title: manualPlan.title,
        description: manualPlan.description,
        exercises: manualPlan.exercises.filter(ex => ex.name),
        createdAt: new Date().toISOString(),
        gymId: profile.gymId
      };
      await addDoc(collection(db, 'workoutPlans'), plan);
      setShowManualForm(false);
      setManualPlan({
        title: '',
        description: '',
        exercises: [{ name: '', sets: 3, reps: '10-12', notes: '' }]
      });
      toast.success('Custom Workout Plan saved!');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'workoutPlans');
    }
  };

  const handleDeletePlan = async (e: React.MouseEvent, planId: string) => {
    e.stopPropagation();
    // Removed window.confirm as it's prohibited in iframe
    try {
      const collectionName = activeTab === 'workouts' ? 'workoutPlans' : 'dietPlans';
      await deleteDoc(doc(db, collectionName, planId));
      toast.success(`${activeTab === 'workouts' ? 'Workout' : 'Diet'} plan deleted`);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${activeTab === 'workouts' ? 'workoutPlans' : 'dietPlans'}/${planId}`);
    }
  };

  const addExerciseField = () => {
    setManualPlan({
      ...manualPlan,
      exercises: [...manualPlan.exercises, { name: '', sets: 3, reps: '10-12', notes: '' }]
    });
  };

  const removeExerciseField = (index: number) => {
    const newExercises = manualPlan.exercises.filter((_, i) => i !== index);
    setManualPlan({ ...manualPlan, exercises: newExercises });
  };

  const updateExerciseField = (index: number, field: string, value: any) => {
    const newExercises = [...manualPlan.exercises];
    newExercises[index] = { ...newExercises[index], [field]: value };
    setManualPlan({ ...manualPlan, exercises: newExercises });
  };

  return (
    <div className="space-y-12">
      <SEO 
        title={activeTab === 'workouts' ? "AI Workout Plans" : "AI Indian Diet Plans"} 
        description={activeTab === 'workouts' ? "Generate and view your personalized AI-powered workout plans." : "Generate and view your personalized AI-powered Indian diet plans."} 
      />
      
      {/* Tab Switcher */}
      <div className="flex gap-4 border-b border-white/5">
        <button 
          onClick={() => { setActiveTab('workouts'); }}
          className={cn(
            "pb-4 px-2 font-headline font-bold uppercase tracking-widest text-xs transition-all border-b-2",
            activeTab === 'workouts' ? "border-primary text-primary" : "border-transparent text-on-surface-variant hover:text-on-surface"
          )}
        >
          Workout Splits
        </button>
        <button 
          onClick={() => { setActiveTab('diet'); }}
          className={cn(
            "pb-4 px-2 font-headline font-bold uppercase tracking-widest text-xs transition-all border-b-2",
            activeTab === 'diet' ? "border-primary text-primary" : "border-transparent text-on-surface-variant hover:text-on-surface"
          )}
        >
          Diet Plans
        </button>
      </div>

      {/* Header */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-6">
        <div>
          <span className="font-headline font-bold uppercase tracking-[0.1em] text-primary text-[10px] sm:text-sm mb-1 sm:mb-2 block">
            {activeTab === 'workouts' ? 'Workout Architecture' : 'Nutrition Architecture'}
          </span>
          <h2 className="font-headline font-black text-3xl sm:text-5xl md:text-6xl leading-none uppercase italic">
            Your <br/><span className="text-primary-dim">{activeTab === 'workouts' ? 'Training Floor.' : 'Fuel Station.'}</span>
          </h2>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          {activeTab === 'workouts' && (
            <button 
              onClick={() => setShowManualForm(true)}
              className="bg-surface-container-highest text-on-surface font-headline font-bold uppercase px-6 py-3 sm:py-4 rounded-lg flex items-center justify-center gap-3 hover:bg-white/10 active:scale-95 transition-all border border-white/5 text-xs sm:text-sm"
            >
              <Plus size={18} />
              Manual Split
            </button>
          )}
          <button 
            onClick={() => {
              if (gymTier === 'starter') {
                toast.error('AI features require Professional or Elite plan. Contact Gym Owner.');
                return;
              }
              setShowGenerator(true);
            }}
            className={cn(
              "font-headline font-bold uppercase px-6 sm:px-8 py-3 sm:py-4 rounded-lg flex items-center justify-center gap-3 active:scale-95 transition-all text-xs sm:text-sm",
              gymTier === 'starter' 
                ? "bg-surface-container-highest text-on-surface-variant hover:bg-white/5 border border-white/5" 
                : "kinetic-gradient text-on-primary-fixed hover:opacity-90 shadow-xl"
            )}
          >
            {gymTier === 'starter' ? <Lock size={18} /> : <Sparkles size={18} />}
            AI {activeTab === 'workouts' ? 'Generator' : 'Diet Generator'}
          </button>
        </div>
      </section>

      {/* Gym Floor Inventory (Only for Workouts) */}
      {activeTab === 'workouts' && equipment.length > 0 && (
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface-container-low p-6 rounded-2xl border border-white/5"
        >
          <div className="flex items-center gap-2 mb-4">
            <Dumbbell className="text-primary" size={18} />
            <h4 className="font-headline font-bold uppercase tracking-widest text-[10px] text-on-surface-variant">Gym Floor Inventory</h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {equipment.map((name, i) => (
              <span key={i} className="px-3 py-1 bg-surface-container-highest rounded-full text-[10px] font-bold uppercase tracking-wider text-on-surface border border-white/5">
                {name}
              </span>
            ))}
          </div>
          <p className="text-[9px] text-on-surface-variant mt-3 uppercase tracking-tighter font-medium italic">
            * AI will only suggest exercises using the equipment listed above.
          </p>
        </motion.section>
      )}

      {/* Manual Split Modal */}
      <AnimatePresence>
        {showManualForm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowManualForm(false)}
              className="absolute inset-0 bg-background/90 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-surface-container p-6 sm:p-8 rounded-xl max-w-2xl w-full shadow-2xl border border-white/5 max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-headline font-black text-xl sm:text-2xl uppercase italic">Create Manual Split</h3>
                <button onClick={() => setShowManualForm(false)}>
                  <X size={24} className="text-on-surface-variant" />
                </button>
              </div>
              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-primary mb-2">Plan Title</label>
                  <input 
                    type="text" 
                    value={manualPlan.title}
                    onChange={(e) => setManualPlan({ ...manualPlan, title: e.target.value })}
                    placeholder="e.g. Push Day, Full Body A"
                    className="w-full bg-surface-container-highest border-none text-on-surface py-3 px-4 rounded-lg focus:ring-2 focus:ring-primary/40"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-primary mb-2">Description</label>
                  <textarea 
                    value={manualPlan.description}
                    onChange={(e) => setManualPlan({ ...manualPlan, description: e.target.value })}
                    placeholder="Briefly describe the focus of this split"
                    className="w-full bg-surface-container-highest border-none text-on-surface py-3 px-4 rounded-lg focus:ring-2 focus:ring-primary/40 h-20 resize-none"
                  />
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-primary">Exercises</label>
                    <button 
                      onClick={addExerciseField}
                      className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-1 hover:underline"
                    >
                      <Plus size={12} /> Add Exercise
                    </button>
                  </div>
                  
                  {manualPlan.exercises.map((ex, idx) => (
                    <div key={idx} className="bg-surface-container-highest p-4 rounded-lg space-y-3 relative group">
                      {manualPlan.exercises.length > 1 && (
                        <button 
                          onClick={() => removeExerciseField(idx)}
                          className="absolute top-2 right-2 text-on-surface-variant hover:text-error opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={16} />
                        </button>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="md:col-span-1">
                          <input 
                            type="text" 
                            placeholder="Exercise Name"
                            value={ex.name}
                            onChange={(e) => updateExerciseField(idx, 'name', e.target.value)}
                            className="w-full bg-surface-container/50 border-none text-xs py-2 px-3 rounded focus:ring-1 focus:ring-primary/40"
                          />
                        </div>
                        <div className="flex gap-2">
                          <input 
                            type="number" 
                            placeholder="Sets"
                            value={ex.sets}
                            onChange={(e) => updateExerciseField(idx, 'sets', parseInt(e.target.value))}
                            className="w-full bg-surface-container/50 border-none text-xs py-2 px-3 rounded focus:ring-1 focus:ring-primary/40"
                          />
                          <input 
                            type="text" 
                            placeholder="Reps"
                            value={ex.reps}
                            onChange={(e) => updateExerciseField(idx, 'reps', e.target.value)}
                            className="w-full bg-surface-container/50 border-none text-xs py-2 px-3 rounded focus:ring-1 focus:ring-primary/40"
                          />
                        </div>
                        <div className="md:col-span-1">
                          <input 
                            type="text" 
                            placeholder="Notes (optional)"
                            value={ex.notes}
                            onChange={(e) => updateExerciseField(idx, 'notes', e.target.value)}
                            className="w-full bg-surface-container/50 border-none text-xs py-2 px-3 rounded focus:ring-1 focus:ring-primary/40"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <button 
                  onClick={handleManualSubmit}
                  className="kinetic-gradient w-full py-4 rounded-lg font-headline font-bold uppercase tracking-widest text-on-primary-fixed flex items-center justify-center gap-2"
                >
                  <Check size={20} />
                  Save Custom Plan
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* AI Generator Modal */}
      <AnimatePresence>
        {showGenerator && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !generating && setShowGenerator(false)}
              className="absolute inset-0 bg-background/90 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-surface-container p-6 sm:p-8 rounded-xl max-w-lg w-full shadow-2xl border border-white/5"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-headline font-black text-xl sm:text-2xl uppercase italic">
                  AI {activeTab === 'workouts' ? 'Workout' : 'Indian Diet'} Generator
                </h3>
                <button onClick={() => setShowGenerator(false)} disabled={generating}>
                  <X size={24} className="text-on-surface-variant" />
                </button>
              </div>
              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-primary mb-2">Fitness Level</label>
                  <select 
                    value={fitnessLevel}
                    onChange={(e) => setFitnessLevel(e.target.value)}
                    className="w-full bg-surface-container-highest border-none text-on-surface py-3 px-4 rounded-lg focus:ring-2 focus:ring-primary/40"
                  >
                    <option>Beginner</option>
                    <option>Intermediate</option>
                    <option>Advanced</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-primary mb-2">Primary Goal</label>
                  <select 
                    value={goals}
                    onChange={(e) => setGoals(e.target.value)}
                    className="w-full bg-surface-container-highest border-none text-on-surface py-3 px-4 rounded-lg focus:ring-2 focus:ring-primary/40"
                  >
                    <option>Muscle Gain</option>
                    <option>Fat Loss</option>
                    <option>Strength</option>
                    <option>Endurance</option>
                    {activeTab === 'diet' && <option>Weight Maintenance</option>}
                    {activeTab === 'diet' && <option>General Health</option>}
                  </select>
                </div>
                {activeTab === 'diet' && (
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-primary mb-2">Diet Preference</label>
                    <select 
                      value={dietType}
                      onChange={(e) => setDietType(e.target.value)}
                      className="w-full bg-surface-container-highest border-none text-on-surface py-3 px-4 rounded-lg focus:ring-2 focus:ring-primary/40"
                    >
                      <option value="veg">Vegetarian</option>
                      <option value="nonveg">Non-Vegetarian</option>
                      <option value="vegan">Vegan</option>
                    </select>
                  </div>
                )}
                {activeTab === 'workouts' && (
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-primary mb-2">Days per Week</label>
                    <select 
                      value={workoutDays}
                      onChange={(e) => setWorkoutDays(e.target.value)}
                      className="w-full bg-surface-container-highest border-none text-on-surface py-3 px-4 rounded-lg focus:ring-2 focus:ring-primary/40"
                    >
                      <option value="2">2 Days</option>
                      <option value="3">3 Days</option>
                      <option value="4">4 Days</option>
                      <option value="5">5 Days</option>
                      <option value="6">6 Days</option>
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-primary mb-2">
                    {activeTab === 'workouts' ? 'Preferences / Injuries' : 'Preferences / Restrictions'}
                  </label>
                  <textarea 
                    value={preferences}
                    onChange={(e) => setPreferences(e.target.value)}
                    placeholder={activeTab === 'workouts' ? "e.g. No squats, focus on shoulders, 4 days a week" : "e.g. Vegetarian, No dairy, focus on high protein, love spicy food"}
                    className="w-full bg-surface-container-highest border-none text-on-surface py-3 px-4 rounded-lg focus:ring-2 focus:ring-primary/40 h-24 resize-none"
                  />
                  {activeTab === 'workouts' && (
                    <p className="text-[9px] text-on-surface-variant mt-2 uppercase tracking-tighter font-medium italic">
                      Note: AI will strictly use the {equipment.length} machines added by the gym owner.
                    </p>
                  )}
                </div>
                <button 
                  onClick={handleGenerate}
                  disabled={generating}
                  className="kinetic-gradient w-full py-4 rounded-lg font-headline font-bold uppercase tracking-widest text-on-primary-fixed flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {generating ? <Loader2 className="animate-spin" /> : <Sparkles size={20} />}
                  {generating ? (activeTab === 'workouts' ? 'Synthesizing...' : 'Calculating Macros...') : `Generate ${activeTab === 'workouts' ? 'Plan' : 'Indian Diet'}`}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Plan Details Modal */}
      <AnimatePresence>
        {selectedPlan && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedPlan(null)}
              className="absolute inset-0 bg-background/90 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-surface-container p-8 rounded-xl max-w-2xl w-full shadow-2xl border border-white/5 max-h-[80vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-headline font-black text-2xl uppercase italic">{selectedPlan.title}</h3>
                <button onClick={() => setSelectedPlan(null)}>
                  <X size={24} className="text-on-surface-variant" />
                </button>
              </div>
              <p className="text-on-surface-variant mb-8">{selectedPlan.description}</p>
              <div className="space-y-6">
                {selectedPlan.days ? (
                  selectedPlan.days.map((day, dIdx) => (
                    <div key={dIdx} className="space-y-4">
                      <div className="border-b border-white/10 pb-2">
                        <h4 className="font-headline font-bold text-xl uppercase tracking-tight text-primary">{day.dayName}</h4>
                        {day.focus && <p className="text-sm text-on-surface-variant uppercase tracking-widest">{day.focus}</p>}
                      </div>
                      <div className="space-y-4">
                        {day.exercises.map((ex, i) => (
                          <div key={i} className="bg-surface-container-highest p-4 rounded-lg flex items-center gap-4">
                            <div className="w-10 h-10 bg-primary/10 rounded flex items-center justify-center text-primary font-headline font-bold">
                              {i + 1}
                            </div>
                            <div className="flex-1">
                              <h5 className="font-bold uppercase tracking-tight">{ex.name}</h5>
                              <p className="text-xs text-on-surface-variant">{ex.notes}</p>
                            </div>
                            <div className="text-right">
                              <div className="font-headline font-black text-primary">{ex.sets} Sets</div>
                              <div className="text-xs font-bold uppercase text-on-surface-variant">{ex.reps} Reps</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  selectedPlan.exercises?.map((ex, i) => (
                    <div key={i} className="bg-surface-container-highest p-4 rounded-lg flex items-center gap-4">
                      <div className="w-10 h-10 bg-primary/10 rounded flex items-center justify-center text-primary font-headline font-bold">
                        {i + 1}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold uppercase tracking-tight">{ex.name}</h4>
                        <p className="text-xs text-on-surface-variant">{ex.notes}</p>
                      </div>
                      <div className="text-right">
                        <div className="font-headline font-black text-primary">{ex.sets} Sets</div>
                        <div className="text-xs font-bold uppercase text-on-surface-variant">{ex.reps} Reps</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <button 
                onClick={() => setSelectedPlan(null)}
                className="w-full mt-8 py-4 bg-white/5 hover:bg-white/10 rounded-lg font-headline font-bold uppercase tracking-widest transition-colors"
              >
                Close View
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Diet Plan Details Modal */}
      <AnimatePresence>
        {selectedDietPlan && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedDietPlan(null)}
              className="absolute inset-0 bg-background/90 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-surface-container p-8 rounded-xl max-w-2xl w-full shadow-2xl border border-white/5 max-h-[80vh] overflow-y-auto custom-scrollbar"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-headline font-black text-2xl uppercase italic">{selectedDietPlan.title}</h3>
                <button onClick={() => setSelectedDietPlan(null)}>
                  <X size={24} className="text-on-surface-variant" />
                </button>
              </div>
              <p className="text-on-surface-variant mb-8">{selectedDietPlan.description}</p>
              <div className="space-y-6">
                {selectedDietPlan.meals.map((meal, i) => (
                  <div key={i} className="bg-surface-container-highest p-6 rounded-xl border border-white/5">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                          <Clock size={20} />
                        </div>
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-widest text-primary">{meal.time}</span>
                          <h4 className="font-headline font-bold text-lg uppercase">{meal.name}</h4>
                        </div>
                      </div>
                      {meal.calories && (
                        <div className="text-right">
                          <div className="font-headline font-black text-primary">{meal.calories} kcal</div>
                          <div className="text-[10px] font-bold uppercase text-on-surface-variant">{meal.protein || 'N/A'} Protein</div>
                        </div>
                      )}
                    </div>
                    <ul className="space-y-2 mb-4">
                      {meal.items.map((item, j) => (
                        <li key={j} className="flex items-center gap-2 text-sm text-on-surface">
                          <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                          {item}
                        </li>
                      ))}
                    </ul>
                    {meal.notes && (
                      <div className="text-xs text-on-surface-variant italic bg-black/20 p-3 rounded-lg">
                        {meal.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <button 
                onClick={() => setSelectedDietPlan(null)}
                className="w-full mt-8 py-4 bg-white/5 hover:bg-white/10 rounded-lg font-headline font-bold uppercase tracking-widest transition-colors"
              >
                Close View
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Plans Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full flex justify-center py-12">
            <Loader2 className="animate-spin text-primary" size={48} />
          </div>
        ) : activeTab === 'workouts' ? (
          plans.length === 0 ? (
            <div className="col-span-full bg-surface-container-low p-12 rounded-lg text-center border-2 border-dashed border-white/5">
              <p className="text-on-surface-variant font-medium mb-6">No workout plans found. Use the AI Generator to create your first elite schedule.</p>
              <button 
                onClick={() => {
                  if (gymTier === 'starter') {
                    toast.error('AI features require Professional or Elite plan. Contact Gym Owner.');
                    return;
                  }
                  setShowGenerator(true);
                }}
                className={cn(
                  "font-headline font-bold uppercase tracking-widest flex items-center gap-2 mx-auto transition-transform",
                  gymTier === 'starter' ? "text-on-surface-variant cursor-not-allowed" : "text-primary hover:scale-105"
                )}
              >
                {gymTier === 'starter' ? <Lock size={20} /> : <Plus size={20} />}
                Create Plan
              </button>
            </div>
          ) : (
            plans.map((plan, idx) => (
              <motion.div 
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                onClick={() => setSelectedPlan(plan)}
                className="bg-surface-container-low p-4 sm:p-6 rounded-lg hover:bg-surface-container transition-colors cursor-pointer group border-l-4 border-transparent hover:border-primary"
              >
                <div className="flex justify-between items-start mb-4 sm:mb-6">
                  <span className="font-headline font-extrabold text-xl sm:text-2xl text-outline-variant group-hover:text-primary transition-colors">
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={(e) => handleDeletePlan(e, plan.id!)}
                      className="p-2 text-on-surface-variant hover:text-error transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                    <ChevronRight size={16} className="text-outline-variant group-hover:text-primary transition-colors" />
                  </div>
                </div>
                <h5 className="font-headline font-bold text-lg sm:text-xl uppercase mb-2">{plan.title}</h5>
                <p className="text-xs text-on-surface-variant mb-4 line-clamp-2">{plan.description}</p>
                <div className="space-y-2">
                  {plan.exercises.slice(0, 3).map((ex, i) => (
                    <div key={i} className="flex justify-between text-xs font-body text-on-surface-variant">
                      <span>{ex.name}</span>
                      <span className="text-on-surface">{ex.sets}x{ex.reps}</span>
                    </div>
                  ))}
                  {plan.exercises.length > 3 && (
                    <p className="text-[10px] text-primary font-bold uppercase mt-2">+{plan.exercises.length - 3} more exercises</p>
                  )}
                </div>
              </motion.div>
            ))
          )
        ) : (
          dietPlans.length === 0 ? (
            <div className="col-span-full bg-surface-container-low p-12 rounded-lg text-center border-2 border-dashed border-white/5">
              <p className="text-on-surface-variant font-medium mb-6">No diet plans found. Let AI craft your personalized Indian nutrition strategy.</p>
              <button 
                onClick={() => {
                  if (gymTier === 'starter') {
                    toast.error('AI features require Professional or Elite plan. Contact Gym Owner.');
                    return;
                  }
                  setShowGenerator(true);
                }}
                className={cn(
                  "font-headline font-bold uppercase tracking-widest flex items-center gap-2 mx-auto transition-transform",
                  gymTier === 'starter' ? "text-on-surface-variant cursor-not-allowed" : "text-primary hover:scale-105"
                )}
              >
                {gymTier === 'starter' ? <Lock size={20} /> : <Plus size={20} />}
                Create Diet Plan
              </button>
            </div>
          ) : (
            dietPlans.map((plan, idx) => (
              <motion.div 
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                onClick={() => setSelectedDietPlan(plan)}
                className="bg-surface-container-low p-4 sm:p-6 rounded-lg hover:bg-surface-container transition-colors cursor-pointer group border-l-4 border-transparent hover:border-primary"
              >
                <div className="flex justify-between items-start mb-4 sm:mb-6">
                  <span className="font-headline font-extrabold text-xl sm:text-2xl text-outline-variant group-hover:text-primary transition-colors">
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={(e) => handleDeletePlan(e, plan.id!)}
                      className="p-2 text-on-surface-variant hover:text-error transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                    <ChevronRight size={16} className="text-outline-variant group-hover:text-primary transition-colors" />
                  </div>
                </div>
                <h5 className="font-headline font-bold text-lg sm:text-xl uppercase mb-2">{plan.title}</h5>
                <p className="text-xs text-on-surface-variant mb-4 line-clamp-2">{plan.description}</p>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1 text-[10px] font-bold uppercase text-on-surface-variant">
                    <Utensils size={12} className="text-primary" />
                    {plan.meals.length} Meals
                  </div>
                  <div className="flex items-center gap-1 text-[10px] font-bold uppercase text-on-surface-variant">
                    <Flame size={12} className="text-primary" />
                    {plan.meals.reduce((sum, m) => sum + (m.calories || 0), 0)} Total kcal
                  </div>
                </div>
              </motion.div>
            ))
          )
        )}
      </section>
    </div>
  );
}

