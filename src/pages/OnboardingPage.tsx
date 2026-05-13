import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, updateDoc, setDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserProfile, Gym } from '../types';
import { motion } from 'motion/react';
import { Building2, Users, ArrowRight, CheckCircle2, Search, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { SEO } from '../components/SEO';

interface OnboardingPageProps {
  profile: UserProfile | null;
  onProfileUpdate: (updatedProfile: UserProfile) => void;
}

export default function OnboardingPage({ profile, onProfileUpdate }: OnboardingPageProps) {
  const initialIntent = sessionStorage.getItem('portal_intent') === 'owner' ? 'create' : sessionStorage.getItem('portal_intent') === 'member' ? 'join' : 'choice';
  const initialGymId = sessionStorage.getItem('pending_gym_id') || '';

  const [step, setStep] = useState<'choice' | 'join' | 'create' | 'pricing'>(initialIntent);
  const [gymId, setGymId] = useState(initialGymId);
  const [gymName, setGymName] = useState('');
  const [gymAddress, setGymAddress] = useState('');
  const [fullName, setFullName] = useState(profile?.displayName || '');
  const [phone, setPhone] = useState(profile?.phoneNumber || '');
  const [branchCount, setBranchCount] = useState(1);
  const [estimatedMembers, setEstimatedMembers] = useState(50);
  const [selectedTier, setSelectedTier] = useState<'starter' | 'professional' | 'elite'>('starter');
  const [customPlans, setCustomPlans] = useState([
    { id: '1-month', name: '1 Month', price: 1200 },
    { id: '3-months', name: '3 Months', price: 3000 }
  ]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  if (!profile) return null;

  const addCustomPlan = () => {
    setCustomPlans([...customPlans, { id: `custom-${Date.now()}`, name: '', price: 0 }]);
  };

  const removeCustomPlan = (id: string) => {
    setCustomPlans(customPlans.filter(p => p.id !== id));
  };
  
  const generateGymId = (name: string) => {
    const base = name.replace(/[^A-Za-z0-9]/g, '').toUpperCase().substring(0, 8);
    const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${base}-${suffix}`;
  };

  const handleJoinGym = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gymId) return;

    setLoading(true);
    try {
      const gymRef = doc(db, 'gyms', gymId);
      const gymSnap = await getDoc(gymRef);

      if (gymSnap.exists()) {
        const updatedProfile = {
          ...profile,
          gymId,
          role: 'member' as const,
          membershipStatus: 'pending' as const
        };
        await updateDoc(doc(db, 'users', profile.uid), updatedProfile);
        onProfileUpdate(updatedProfile);
        toast.success(`Joined ${gymSnap.data().name}! Awaiting owner approval.`);
        navigate('/');
      } else {
        toast.error('Invalid Gym ID. Please check with your gym owner.');
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to join gym.');
    } finally {
      setLoading(false);
    }
  };

  const handlePricing = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gymName) return;
    setStep('pricing');
  };

  const handleCreateGymWithTier = async (tier: 'starter' | 'professional' | 'elite') => {
    setLoading(true);
    setSelectedTier(tier);
    try {
      const newGymId = generateGymId(gymName);

      const newGym: Gym = {
        id: newGymId,
        name: gymName,
        ownerId: profile.uid,
        address: gymAddress,
        branches: branchCount,
        expectedMembers: estimatedMembers,
        createdAt: new Date().toISOString(),
        subscriptionTier: tier,
        subscriptionStatus: tier === 'starter' ? 'active' : 'trial' // First 10 gyms free setup maybe? let's default to trial or active
      };

      await setDoc(doc(db, 'gyms', newGymId), newGym);

      for (const p of customPlans) {
        if (p.name && p.price > 0) {
          const tierRef = doc(collection(db, 'membershipTiers'));
          await setDoc(tierRef, {
            name: p.name,
            price: Number(p.price),
            features: [],
            isActive: true,
            gymId: newGymId
          });
        }
      }

      const updatedProfile = {
        ...profile,
        gymId: newGymId,
        displayName: fullName,
        phoneNumber: phone,
        role: 'owner' as const,
        membershipStatus: 'active' as const
      };
      await updateDoc(doc(db, 'users', profile.uid), updatedProfile);
      onProfileUpdate(updatedProfile);
      
      toast.success(`Gym created! Your ID is: ${newGymId}`);
      navigate('/admin');
    } catch (error) {
      console.error(error);
      toast.error('Failed to create gym.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-mesh py-12 px-6 flex items-center justify-center">
      <SEO title="Onboarding" />
      <div className="max-w-xl w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface-container rounded-[2rem] border border-white/5 p-8 md:p-12 shadow-2xl"
        >
          {step === 'choice' && (
            <div className="space-y-8">
              <div className="text-center">
                <h1 className="font-headline font-black text-3xl italic tracking-tighter text-white mb-2 uppercase">
                  Complete Your <span className="text-primary">Profile</span>
                </h1>
                <p className="text-on-surface-variant font-medium uppercase tracking-widest text-[10px]">
                  Select your role to continue to the dashboard
                </p>
              </div>

              <div className="grid gap-4">
                <button
                  onClick={() => setStep('join')}
                  className="group flex items-center gap-6 p-6 bg-white/5 hover:bg-primary/10 rounded-2xl border border-white/5 hover:border-primary/30 transition-all text-left"
                >
                  <div className="w-16 h-16 rounded-xl bg-white/10 group-hover:bg-primary/20 flex items-center justify-center transition-colors">
                    <Users size={32} className="text-on-surface-variant group-hover:text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-headline font-bold text-lg text-white uppercase italic">I'm a Member</h3>
                    <p className="text-xs text-on-surface-variant font-medium">Join an existing gym using a Gym ID provided by your owner.</p>
                  </div>
                  <ArrowRight size={20} className="text-on-surface-variant group-hover:text-primary transition-colors" />
                </button>

                <button
                  onClick={() => setStep('create')}
                  className="group flex items-center gap-6 p-6 bg-white/5 hover:bg-primary/10 rounded-2xl border border-white/5 hover:border-primary/30 transition-all text-left"
                >
                  <div className="w-16 h-16 rounded-xl bg-white/10 group-hover:bg-primary/20 flex items-center justify-center transition-colors">
                    <Building2 size={32} className="text-on-surface-variant group-hover:text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-headline font-bold text-lg text-white uppercase italic">I'm a Gym Owner</h3>
                    <p className="text-xs text-on-surface-variant font-medium">Create a new gym profile and manage your members & operations.</p>
                  </div>
                  <ArrowRight size={20} className="text-on-surface-variant group-hover:text-primary transition-colors" />
                </button>
              </div>
            </div>
          )}

          {step === 'join' && (
            <div className="space-y-8">
              <button 
                onClick={() => setStep('choice')}
                className="text-[10px] font-bold text-primary uppercase tracking-widest hover:underline"
              >
                ← Back to Selection
              </button>
              
              <div>
                <h1 className="font-headline font-black text-3xl italic tracking-tighter text-white mb-2 uppercase">
                  Join a <span className="text-primary">Gym</span>
                </h1>
                <p className="text-on-surface-variant font-medium uppercase tracking-widest text-[10px]">
                  Enter the specific Gym ID provided by your establishment
                </p>
              </div>

              <form onSubmit={handleJoinGym} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.2em] mb-2 ml-1">Gym Identification ID</label>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-outline" size={18} />
                    <input
                      type="text"
                      required
                      value={gymId}
                      onChange={(e) => setGymId(e.target.value.toUpperCase())}
                      placeholder="e.g. GYM-X9Y2Z1"
                      className="w-full bg-surface-container-highest border border-white/5 rounded-xl py-4 pl-12 pr-4 text-white font-headline font-bold focus:outline-none focus:border-primary/50 transition-colors uppercase tracking-widest"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !gymId}
                  className="w-full py-4 bg-primary text-on-primary-fixed rounded-xl font-headline font-black uppercase italic tracking-tighter disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? 'Validating...' : 'Join Gym'}
                  {!loading && <CheckCircle2 size={18} />}
                </button>
              </form>
            </div>
          )}

          {step === 'create' && (
            <div className="space-y-8">
              <button 
                onClick={() => setStep('choice')}
                className="text-[10px] font-bold text-primary uppercase tracking-widest hover:underline"
              >
                ← Back to Selection
              </button>
              
              <div>
                <h1 className="font-headline font-black text-3xl italic tracking-tighter text-white mb-2 uppercase">
                  Establish Your <span className="text-primary">Gym</span>
                </h1>
                <p className="text-on-surface-variant font-medium uppercase tracking-widest text-[10px]">
                  Define your elite fitness studio details
                </p>
              </div>

              <form onSubmit={handlePricing} className="space-y-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.2em] mb-2 ml-1 text-xs">Full Name</label>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. John Doe"
                        className="w-full bg-surface-container-highest border border-white/5 rounded-xl py-4 px-4 text-white font-headline focus:outline-none focus:border-primary/50 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.2em] mb-2 ml-1 text-xs">Phone Number</label>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="e.g. +1 555-1234"
                        className="w-full bg-surface-container-highest border border-white/5 rounded-xl py-4 px-4 text-white font-headline focus:outline-none focus:border-primary/50 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.2em] mb-2 ml-1 text-xs">Gym Name</label>
                    <input
                      type="text"
                      required
                      value={gymName}
                      onChange={(e) => setGymName(e.target.value)}
                      placeholder="e.g. ELITE PERFORMANCE LAB"
                      className="w-full bg-surface-container-highest border border-white/5 rounded-xl py-4 px-4 text-white font-headline font-bold focus:outline-none focus:border-primary/50 transition-colors"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.2em] mb-2 ml-1 text-xs">Branches</label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={branchCount}
                        onChange={(e) => setBranchCount(Number(e.target.value))}
                        className="w-full bg-surface-container-highest border border-white/5 rounded-xl py-4 px-4 text-white font-headline focus:outline-none focus:border-primary/50 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.2em] mb-2 ml-1 text-xs">Expected Members</label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={estimatedMembers}
                        onChange={(e) => setEstimatedMembers(Number(e.target.value))}
                        className="w-full bg-surface-container-highest border border-white/5 rounded-xl py-4 px-4 text-white font-headline focus:outline-none focus:border-primary/50 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2 ml-1">
                      <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.2em] text-xs">Membership Plans</label>
                      <button 
                        type="button" 
                        onClick={addCustomPlan}
                        className="text-[10px] bg-primary/20 hover:bg-primary/30 text-primary px-2 py-1 rounded transition-colors flex items-center gap-1 uppercase tracking-widest font-bold"
                      >
                        <Plus size={12} /> Add Plan
                      </button>
                    </div>
                    <div className="space-y-3">
                      {customPlans.map((plan, index) => (
                        <div key={plan.id} className="flex items-center gap-3">
                          <input
                            type="text"
                            required
                            value={plan.name}
                            onChange={(e) => {
                              const newPlans = [...customPlans];
                              newPlans[index].name = e.target.value;
                              setCustomPlans(newPlans);
                            }}
                            placeholder="Plan Name (e.g. 1 Month)"
                            className="flex-1 bg-surface-container-highest border border-white/5 rounded-xl py-3 px-4 text-white font-headline text-sm focus:outline-none focus:border-primary/50 transition-colors"
                          />
                          <input
                            type="number"
                            required
                            min="0"
                            value={plan.price || ''}
                            onChange={(e) => {
                              const newPlans = [...customPlans];
                              newPlans[index].price = Number(e.target.value);
                              setCustomPlans(newPlans);
                            }}
                            placeholder="Price"
                            className="w-24 bg-surface-container-highest border border-white/5 rounded-xl py-3 px-4 text-white font-headline text-sm focus:outline-none focus:border-primary/50 transition-colors"
                          />
                          <button
                            type="button"
                            onClick={() => removeCustomPlan(plan.id)}
                            className="p-3 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-xl transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                      {customPlans.length === 0 && (
                        <p className="text-xs text-on-surface-variant italic">No plans added. You can add them later.</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.2em] mb-2 ml-1 text-xs">Address / Location</label>
                    <input
                      type="text"
                      value={gymAddress}
                      onChange={(e) => setGymAddress(e.target.value)}
                      placeholder="e.g. 123 Fitness Ave, Mumbai"
                      className="w-full bg-surface-container-highest border border-white/5 rounded-xl py-4 px-4 text-white font-headline focus:outline-none focus:border-primary/50 transition-colors"
                    />
                  </div>
                </div>

                <div className="p-4 bg-primary/5 rounded-xl border border-primary/10">
                  <p className="text-[10px] text-primary font-bold uppercase tracking-widest leading-relaxed">
                    Note: A unique Gym ID will be automatically generated for you sequentially based on your Gym Name to easily share with clients.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading || !gymName}
                  className="w-full py-4 bg-primary text-on-primary-fixed rounded-xl font-headline font-black uppercase italic tracking-tighter disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? 'Establishing...' : 'Create Gym'}
                  {!loading && <Building2 size={18} />}
                </button>
              </form>
            </div>
          )}

          {step === 'pricing' && (
            <div className="space-y-8 w-[80vw] max-w-5xl -mx-4 sm:mx-0">
              <button 
                onClick={() => setStep('create')}
                className="text-[10px] font-bold text-primary uppercase tracking-widest hover:underline"
              >
                ← Back to Details
              </button>
              
              <div className="text-center">
                <h1 className="font-headline font-black text-4xl italic tracking-tighter text-white mb-2 uppercase">
                  Choose Your <span className="text-primary">Plan</span>
                </h1>
                <p className="text-on-surface-variant font-medium uppercase tracking-widest text-xs">
                  Unlock features based on your gym's size and needs
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Starter Tier */}
                <div className="bg-surface-container-highest border border-white/5 rounded-2xl p-6 flex flex-col hover:border-primary/50 transition-colors">
                  <div className="mb-4">
                    <h3 className="text-xl font-black font-headline uppercase italic text-white flex items-center gap-2">
                       🏋️ STARTER
                    </h3>
                  </div>
                  <div className="mb-6">
                    <div className="text-3xl font-black font-headline text-primary">₹1,999<span className="text-sm text-on-surface-variant font-medium">/month</span></div>
                    <p className="text-xs text-on-surface-variant mt-2">Perfect for boutique gyms just getting started</p>
                  </div>
                  <ul className="space-y-3 mb-8 flex-1">
                    {['QR Check-in/Check-out', 'Member Dashboard', 'Admin Portal', 'Payment Tracking', 'Up to 150 members', 'WhatsApp Support'].map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-on-surface">
                        <CheckCircle2 size={16} className="text-primary shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mb-6 bg-primary/10 rounded-lg p-3 text-center border border-primary/20">
                    <p className="text-xs text-primary font-bold">Setup: ₹8,000</p>
                    <p className="text-[10px] text-primary/70 uppercase tracking-widest mt-1">First 10 gyms: FREE</p>
                  </div>
                  <button 
                    onClick={() => handleCreateGymWithTier('starter')}
                    disabled={loading}
                    className="w-full py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold uppercase tracking-widest text-xs transition-colors"
                  >
                    Start Free Trial
                  </button>
                </div>

                {/* Professional Tier */}
                <div className="bg-primary/5 border-2 border-primary/50 rounded-2xl p-6 flex flex-col relative transform lg:-translate-y-4 shadow-2xl shadow-primary/20">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-on-primary px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
                    ⭐ Most Popular
                  </div>
                  <div className="mb-4">
                    <h3 className="text-xl font-black font-headline uppercase italic text-white flex items-center gap-2">
                       💪 PROFESSIONAL
                    </h3>
                  </div>
                  <div className="mb-6">
                    <div className="text-3xl font-black font-headline text-primary">₹4,999<span className="text-sm text-on-surface-variant font-medium">/month</span></div>
                    <p className="text-xs text-primary font-bold mt-1">(Founding Member: ₹2,999/month)</p>
                  </div>
                  <ul className="space-y-3 mb-8 flex-1">
                    <li className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest pb-2 border-b border-white/5">Everything in Starter PLUS:</li>
                    {['AI Workout Generator', 'AI Diet Plans (Indian)', 'Full Gamification System', 'Fitness Challenges', 'Progress Tracking', 'Business Analytics', 'Up to 500 members', 'Custom Branding'].map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-on-surface">
                        <CheckCircle2 size={16} className="text-primary shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mb-6 bg-primary/10 rounded-lg p-3 text-center border border-primary/20">
                    <p className="text-xs text-primary font-bold">Setup: ₹12,000</p>
                    <p className="text-[10px] text-primary/70 uppercase tracking-widest mt-1">First 10 gyms: FREE</p>
                  </div>
                  <button 
                    onClick={() => handleCreateGymWithTier('professional')}
                    disabled={loading}
                    className="w-full py-4 bg-primary text-on-primary-fixed rounded-xl font-black uppercase tracking-widest text-sm hover:opacity-90 transition-opacity shadow-lg shadow-primary/30"
                  >
                    Book a Demo
                  </button>
                </div>

                {/* Elite Tier */}
                <div className="bg-surface-container-highest border border-white/5 rounded-2xl p-6 flex flex-col hover:border-primary/50 transition-colors">
                  <div className="mb-4">
                    <h3 className="text-xl font-black font-headline uppercase italic text-white flex items-center gap-2">
                       🏆 ELITE
                    </h3>
                  </div>
                  <div className="mb-6">
                    <div className="text-3xl font-black font-headline text-white">₹9,999<span className="text-sm text-on-surface-variant font-medium">/month</span></div>
                    <p className="text-xs text-on-surface-variant mt-2">For premium chains and large facilities</p>
                  </div>
                  <ul className="space-y-3 mb-8 flex-1">
                    <li className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest pb-2 border-b border-white/5">Everything in Professional PLUS:</li>
                    {['AI Business Insights', 'Multi-Location Support', 'Equipment Management', 'Financial Ledger', 'Unlimited Members', 'Dedicated Account Manager', 'Priority Support', 'Monthly Strategy Call'].map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-on-surface">
                        <CheckCircle2 size={16} className="text-white shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mb-6 bg-white/5 rounded-lg p-3 text-center border border-white/10">
                    <p className="text-xs text-white font-bold">Setup: ₹25,000</p>
                  </div>
                  <button 
                    onClick={() => handleCreateGymWithTier('elite')}
                    disabled={loading}
                    className="w-full py-3 bg-white hover:bg-white/90 text-background rounded-xl font-black uppercase tracking-widest text-xs transition-colors"
                  >
                    Contact Sales
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-8 border-t border-white/5">
                <div className="bg-surface-container border border-white/5 rounded-xl p-4">
                  <h4 className="text-sm font-bold text-white mb-1">White-Label Branding</h4>
                  <div className="text-xs text-primary font-bold mb-2">₹30,000</div>
                  <p className="text-[10px] text-on-surface-variant">Remove our branding, use your domain</p>
                </div>
                <div className="bg-surface-container border border-white/5 rounded-xl p-4">
                  <h4 className="text-sm font-bold text-white mb-1">Custom Integrations</h4>
                  <div className="text-xs text-primary font-bold mb-2">From ₹15,000</div>
                  <p className="text-[10px] text-on-surface-variant">WhatsApp API, Payment gateways, Custom reports</p>
                </div>
                <div className="bg-surface-container border border-white/5 rounded-xl p-4">
                  <h4 className="text-sm font-bold text-white mb-1">Staff Training Session</h4>
                  <div className="text-xs text-primary font-bold mb-2">₹5,000</div>
                  <p className="text-[10px] text-on-surface-variant">2-hour deep dive for your team</p>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </main>
  );
}
