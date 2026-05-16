import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, doc, updateDoc, deleteDoc, onSnapshot, where, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { motion } from 'motion/react';
import { Shield, MapPin, Mail, Phone, CalendarDays, Key, Trash2, CheckCircle, LayoutDashboard, Database, Activity, RefreshCw, PlusCircle, Loader2, Save, Users } from 'lucide-react';
import { SEO } from '../components/SEO';
import { toast } from 'sonner';
import { UserProfile } from '../types';
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { BulkMemberImport } from '../components/BulkMemberImport';
import { Download } from 'lucide-react';
import { subMinutes, parseISO, isAfter } from 'date-fns';

export default function SuperAdminPage({ profile }: { profile: UserProfile | null }) {
  const [gyms, setGyms] = useState<any[]>([]);
  const [owners, setOwners] = useState<any[]>([]);
  const [liveAttendance, setLiveAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'gyms' | 'system' | 'add_gym' | 'bulk_import'>('gyms');
  const [searchQuery, setSearchQuery] = useState('');

  const [newOwner, setNewOwner] = useState({
    fullName: '', email: '', phone: '', password: '', confirmPassword: '',
    gymName: '', logoUrl: '', address: '', city: '', state: '', country: '', location: '',
    branches: 1, activeMembers: 0, plan: 'starter',
    startDate: new Date().toISOString().slice(0,10),
    expiryDate: new Date(Date.now() + 30*24*60*60*1000).toISOString().slice(0,10),
    paymentStatus: 'active', isTrial: false, isLifetime: false
  });

  useEffect(() => {
    if (profile?.email !== 'tgfhiyfvhtfghug@gmail.com') return;

    const gymsUnsub = onSnapshot(collection(db, 'gyms'), (snapshot) => {
      setGyms(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const ownersUnsub = onSnapshot(query(collection(db, 'users'), where('role', '==', 'owner')), (snapshot) => {
      setOwners(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    // Global live attendance listener
    const twoAndHalfHoursAgo = subMinutes(new Date(), 150).toISOString();
    const qLive = query(
      collection(db, 'attendance'),
      where('timestamp', '>=', twoAndHalfHoursAgo)
    );
    
    const liveUnsub = onSnapshot(qLive, (snapshot) => {
      setLiveAttendance(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      gymsUnsub();
      ownersUnsub();
      liveUnsub();
    };
  }, [profile]);

  if (profile?.email !== 'tgfhiyfvhtfghug@gmail.com') {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Shield size={64} className="text-error mb-6" />
        <h2 className="font-headline text-3xl font-black uppercase italic mb-2">Maximum Security Clearance Required</h2>
        <p className="text-on-surface-variant max-w-md">This zone is restricted to platform administrators only.</p>
      </div>
    );
  }

  const handleUpgradePlan = async (gymId: string, newPlan: string) => {
    try {
      await updateDoc(doc(db, 'gyms', gymId), {
        subscriptionTier: newPlan,
        subscriptionStatus: 'active'
      });
      toast.success('Gym subscription upgraded to ' + newPlan.toUpperCase());
    } catch (err: any) {
      toast.error('Failed to upgrade plan: ' + err.message);
    }
  };

  const handleSuspendGym = async (gymId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'suspended' ? 'active' : 'suspended';
      await updateDoc(doc(db, 'gyms', gymId), {
        subscriptionStatus: newStatus
      });
      toast.success(`Gym marked as ${newStatus}`);
    } catch (err: any) {
      toast.error('Failed to change gym status: ' + err.message);
    }
  };

  const handleVerifyOwner = async (ownerId: string) => {
    try {
      await updateDoc(doc(db, 'users', ownerId), {
        membershipStatus: 'active'
      });
      toast.success('Owner account verified');
    } catch (err: any) {
      toast.error('Failed to verify owner: ' + err.message);
    }
  };

  const handleDeleteGym = async (gymId: string, ownerId: string) => {
    if (!window.confirm('Are you absolutely sure you want to delete this gym? This action cannot be undone.')) return;
    try {
      await deleteDoc(doc(db, 'gyms', gymId));
      if (ownerId) {
          await updateDoc(doc(db, 'users', ownerId), {
              gymId: '',
              role: 'member'
          });
      }
      toast.success('Gym deleted successfully');
    } catch (err: any) {
      toast.error('Failed to delete gym: ' + err.message);
    }
  };
  
  const testConnection = async () => {
      try {
          const snapshot = await getDocs(query(collection(db, 'users'), where('email', '==', 'tgfhiyfvhtfghug@gmail.com')));
          if (!snapshot.empty) {
              toast.success('Database connection successful. Read latency: OK');
          } else {
              toast.warning('Connection successful, but admin user record not found in users collection.');
          }
      } catch(err: any) {
          toast.error('Connection test failed: ' + err.message);
      }
  }

  const handleCreateGymOwner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newOwner.password !== newOwner.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setSubmitting(true);
    try {
      const firebaseConfig = (await import('../../firebase-applet-config.json')).default;
      const secondaryApp = initializeApp(firebaseConfig, "SecondaryApp" + Date.now());
      const secondaryAuth = getAuth(secondaryApp);

      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, newOwner.email, newOwner.password);
      const newUid = userCredential.user.uid;

      const gymId = `MGYM-${Math.floor(10000 + Math.random() * 90000)}`;

      let maxMembers = 100;
      let hasAI = false;
      let hasMultiLocation = false;

      if (newOwner.plan === 'pro') {
         maxMembers = 300;
         hasAI = true;
      } else if (newOwner.plan === 'elite') {
         maxMembers = 999999;
         hasAI = true;
         hasMultiLocation = true;
      } else if (newOwner.plan === 'custom') {
         maxMembers = parseInt(prompt("Enter max members for custom plan:", "500") || "500");
         hasAI = window.confirm("Enable AI features?");
         hasMultiLocation = window.confirm("Enable Multi-Location?");
      }

      await setDoc(doc(db, 'gyms', gymId), {
          name: newOwner.gymName,
          logoUrl: newOwner.logoUrl,
          address: newOwner.address,
          city: newOwner.city,
          state: newOwner.state,
          country: newOwner.country,
          location: newOwner.location,
          branches: parseInt(newOwner.branches.toString()),
          activeMembers: parseInt(newOwner.activeMembers.toString()),
          ownerId: newUid,
          subscriptionTier: newOwner.plan,
          subscriptionStatus: newOwner.paymentStatus,
          limits: { maxMembers, hasAI, hasMultiLocation },
          startDate: newOwner.startDate,
          expiryDate: newOwner.expiryDate,
          isTrial: newOwner.isTrial,
          isLifetime: newOwner.isLifetime,
          createdAt: new Date().toISOString()
      });

      await setDoc(doc(db, 'users', newUid), {
          role: 'owner',
          gymId: gymId,
          displayName: newOwner.fullName,
          email: newOwner.email,
          phoneNumber: newOwner.phone,
          membershipStatus: 'active',
          createdAt: new Date().toISOString()
      });

      await secondaryAuth.signOut();
      
      toast.success("Gym and Owner created successfully! Gym ID: " + gymId);
      setActiveTab('gyms'); 
      setNewOwner({
        fullName: '', email: '', phone: '', password: '', confirmPassword: '',
        gymName: '', logoUrl: '', address: '', city: '', state: '', country: '', location: '',
        branches: 1, activeMembers: 0, plan: 'starter',
        startDate: new Date().toISOString().slice(0,10),
        expiryDate: new Date(Date.now() + 30*24*60*60*1000).toISOString().slice(0,10),
        paymentStatus: 'active', isTrial: false, isLifetime: false
      });
    } catch (err: any) {
      toast.error('Failed to create gym owner: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async (email: string) => {
    try {
      const auth = getAuth();
      await sendPasswordResetEmail(auth, email);
      toast.success('Password reset email sent to ' + email);
    } catch (err: any) {
      toast.error('Failed to send reset email: ' + err.message);
    }
  };

  return (
    <div className="space-y-12 pb-20">
      <SEO title="Platform Control" />
      
      {/* Header */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="font-headline font-bold uppercase tracking-[0.1em] text-error text-[10px] sm:text-sm mb-1 block flex items-center gap-2">
            <Shield size={14} className="text-error" /> PLATFORM SUPERUSER
          </span>
          <h2 className="font-headline font-black text-3xl sm:text-5xl leading-none uppercase italic">
            App <span className="text-error">Master</span>
          </h2>
        </div>
      </section>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-white/5 rounded-xl border border-white/10 w-max mb-8 flex-wrap">
        {[
          { id: 'gyms', label: 'Gym Directory', icon: LayoutDashboard },
          { id: 'add_gym', label: 'Add Gym Owner', icon: PlusCircle },
          { id: 'bulk_import', label: 'Bulk Members', icon: Download },
          { id: 'system', label: 'System Health', icon: Activity },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg text-[10px] sm:text-xs font-bold uppercase tracking-widest transition-all ${
              activeTab === tab.id
                ? 'bg-error text-white shadow-lg'
                : 'text-on-surface-variant hover:text-white hover:bg-white/5'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'bulk_import' && (
        <div className="max-w-4xl max-w-full">
           <BulkMemberImport onSuccess={() => setActiveTab('gyms')} />
        </div>
      )}

      {activeTab === 'gyms' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-headline font-black uppercase text-white">Gym Directory</h3>
            <input 
              type="text" 
              placeholder="Search by ID, Name, or Email..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-primary text-sm w-full max-w-sm"
            />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {gyms.filter(gym => {
              const owner = owners.find(o => o.gymId === gym.id) || owners.find(o => o.uid === gym.ownerId);
              const searchLower = searchQuery.toLowerCase();
              return gym.id.toLowerCase().includes(searchLower) || 
                     gym.name.toLowerCase().includes(searchLower) || 
                     (owner?.email || '').toLowerCase().includes(searchLower);
            }).map(gym => {
              const owner = owners.find(o => o.gymId === gym.id) || owners.find(o => o.uid === gym.ownerId);
              
              const gymLiveAttendance = liveAttendance.filter(a => {
                const checkInTime = parseISO(a.timestamp);
                const twoAndHalfHoursAgo = subMinutes(new Date(), 150);
                return a.gymId === gym.id && isAfter(checkInTime, twoAndHalfHoursAgo) && !a.checkOutTime;
              });
              const liveOccupancy = new Set(gymLiveAttendance.map(a => a.userId)).size;
              
              return (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={gym.id} 
                  className="bg-surface-container border border-white/5 rounded-2xl p-6 relative overflow-hidden flex flex-col gap-6"
                >
                  {/* Status Indicator */}
                  <div className={`absolute top-0 left-0 w-full h-1 ${gym.subscriptionStatus === 'active' ? 'bg-primary' : 'bg-amber-500'}`} />

                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-headline text-2xl font-black uppercase text-white truncate">{gym.name}</h3>
                      <p className="text-xs font-mono text-on-surface-variant flex items-center gap-1 mt-1">
                        <Key size={12} /> ID: <span className="text-white bg-white/10 px-1 rounded">{gym.id}</span>
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                       <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${gym.subscriptionStatus === 'active' ? 'bg-primary/20 text-primary' : 'bg-amber-500/20 text-amber-500'}`}>
                         {gym.subscriptionStatus === 'active' ? 'ACTIVE' : 'TRIAL/PENDING'}
                       </span>
                       <span className="flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-white/10 text-white">
                         <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                         {liveOccupancy} LIVE
                       </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm mt-2">
                    {owner && (
                      <>
                        <div className="col-span-2 space-y-2 mb-2 p-3 bg-black/20 rounded-xl">
                          <div className="flex items-center justify-between">
                             <p className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider">Owner Details</p>
                             <button
                               onClick={() => handleResetPassword(owner.email)}
                               className="text-[10px] text-primary hover:underline uppercase tracking-widest font-bold"
                             >
                               Reset Password
                             </button>
                          </div>
                          <p className="flex items-center gap-2 text-white"><Mail size={14} className="text-primary"/> {owner.email}</p>
                          <p className="flex items-center gap-2 text-white"><Phone size={14} className="text-primary"/> {owner.phoneNumber || 'N/A'}</p>
                          <p className="flex items-center gap-2 text-white"><CheckCircle size={14} className={owner.membershipStatus === 'active' ? 'text-primary' : 'text-amber-500'}/> Status: {owner.membershipStatus}</p>
                        </div>
                      </>
                    )}
                    <div className="flex items-center gap-2 text-on-surface-variant">
                      <MapPin size={14} /> <span className="truncate">{gym.address}</span>
                    </div>
                    <div className="flex items-center gap-2 text-on-surface-variant">
                      <CalendarDays size={14} /> Created: {new Date(gym.createdAt).toLocaleDateString()}
                    </div>
                    <div className="col-span-2 flex items-center gap-2 text-on-surface-variant">
                      <Database size={14} /> Plan: <strong className="text-white uppercase">{gym.subscriptionTier}</strong>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 mt-auto pt-4 border-t border-white/5">
                    {owner?.membershipStatus === 'pending' && (
                      <button 
                        onClick={() => handleVerifyOwner(owner.id)}
                        className="flex-1 py-2 bg-primary/20 text-primary hover:bg-primary/30 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-1"
                      >
                        <CheckCircle size={14} /> Verify Owner
                      </button>
                    )}
                    
                    <select 
                      onChange={(e) => handleUpgradePlan(gym.id, e.target.value)}
                      value={gym.subscriptionTier}
                      className="flex-1 py-2 bg-surface border border-white/10 rounded-lg text-[10px] font-black uppercase tracking-widest text-white px-2 outline-none"
                    >
                      <option value="starter">Starter</option>
                      <option value="pro">Pro</option>
                      <option value="enterprise">Enterprise</option>
                      <option value="elite">Elite</option>
                      <option value="custom">Custom</option>
                    </select>

                    <button 
                      onClick={() => handleSuspendGym(gym.id, gym.subscriptionStatus)}
                      className={`py-2 px-4 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors ${gym.subscriptionStatus === 'suspended' ? 'bg-primary/20 text-primary' : 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20'}`}
                    >
                      {gym.subscriptionStatus === 'suspended' ? 'Unsuspend' : 'Suspend'}
                    </button>

                    <button 
                      onClick={() => handleDeleteGym(gym.id, owner?.id)}
                      className="py-2 px-4 bg-error/10 text-error hover:bg-error/20 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors flex items-center justify-center"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'add_gym' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface-container border border-white/5 rounded-2xl p-8"
        >
          <div className="flex items-center gap-3 text-white mb-8 border-b border-white/5 pb-4">
            <PlusCircle size={24} className="text-primary" />
            <h3 className="text-xl font-headline font-black uppercase">Onboard New Gym</h3>
          </div>

          <form onSubmit={handleCreateGymOwner} className="space-y-12">
            {/* Owner Section */}
            <div className="space-y-6">
              <h4 className="text-sm font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                <Shield size={16} /> Owner Credentials
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-on-surface-variant font-bold mb-2">Full Name</label>
                  <input type="text" required value={newOwner.fullName} onChange={e => setNewOwner({...newOwner, fullName: e.target.value})} className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors" placeholder="John Doe" />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-on-surface-variant font-bold mb-2">Email Address</label>
                  <input type="email" required value={newOwner.email} onChange={e => setNewOwner({...newOwner, email: e.target.value})} className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors" placeholder="gym@example.com" />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-on-surface-variant font-bold mb-2">Phone Number</label>
                  <input type="tel" value={newOwner.phone} onChange={e => setNewOwner({...newOwner, phone: e.target.value})} className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors" placeholder="+1..." />
                </div>
                <div />
                <div>
                  <label className="block text-xs uppercase tracking-wider text-on-surface-variant font-bold mb-2">Password</label>
                  <input type="password" required value={newOwner.password} onChange={e => setNewOwner({...newOwner, password: e.target.value})} className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors" placeholder="••••••••" />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-on-surface-variant font-bold mb-2">Confirm Password</label>
                  <input type="password" required value={newOwner.confirmPassword} onChange={e => setNewOwner({...newOwner, confirmPassword: e.target.value})} className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors" placeholder="••••••••" />
                </div>
              </div>
            </div>

            {/* Gym Section */}
            <div className="space-y-6 border-t border-white/5 pt-8">
              <h4 className="text-sm font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                <LayoutDashboard size={16} /> Gym details
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-on-surface-variant font-bold mb-2">Gym Name</label>
                  <input type="text" required value={newOwner.gymName} onChange={e => setNewOwner({...newOwner, gymName: e.target.value})} className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors" placeholder="Titan Fitness" />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-on-surface-variant font-bold mb-2">Logo URL (Optional)</label>
                  <input type="url" value={newOwner.logoUrl} onChange={e => setNewOwner({...newOwner, logoUrl: e.target.value})} className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors" placeholder="https://..." />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs uppercase tracking-wider text-on-surface-variant font-bold mb-2">Google Maps Location Link</label>
                  <input type="url" value={newOwner.location} onChange={e => setNewOwner({...newOwner, location: e.target.value})} className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors" placeholder="https://maps.google.com/..." />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs uppercase tracking-wider text-on-surface-variant font-bold mb-2">Street Address</label>
                  <input type="text" required value={newOwner.address} onChange={e => setNewOwner({...newOwner, address: e.target.value})} className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors" placeholder="123 Iron St" />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-on-surface-variant font-bold mb-2">City</label>
                  <input type="text" value={newOwner.city} onChange={e => setNewOwner({...newOwner, city: e.target.value})} className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors" placeholder="Los Angeles" />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-on-surface-variant font-bold mb-2">State</label>
                  <input type="text" value={newOwner.state} onChange={e => setNewOwner({...newOwner, state: e.target.value})} className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors" placeholder="CA" />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-on-surface-variant font-bold mb-2">Country</label>
                  <input type="text" value={newOwner.country} onChange={e => setNewOwner({...newOwner, country: e.target.value})} className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors" placeholder="USA" />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-on-surface-variant font-bold mb-2">Number of Branches</label>
                  <input type="number" min="1" value={newOwner.branches} onChange={e => setNewOwner({...newOwner, branches: parseInt(e.target.value)})} className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors" />
                </div>
              </div>
            </div>

            {/* Subscription Section */}
            <div className="space-y-6 border-t border-white/5 pt-8">
              <h4 className="text-sm font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                <Database size={16} /> Plan & Limits
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-on-surface-variant font-bold mb-2">Subscription Tier</label>
                  <select value={newOwner.plan} onChange={e => setNewOwner({...newOwner, plan: e.target.value})} className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors">
                    <option value="starter">Starter Plan (100 members, basic)</option>
                    <option value="pro">Pro Plan (300 members, AI enabled)</option>
                    <option value="elite">Elite Plan (Unlimited, Multi-location)</option>
                    <option value="custom">Custom Plan</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-on-surface-variant font-bold mb-2">Payment Status</label>
                  <select value={newOwner.paymentStatus} onChange={e => setNewOwner({...newOwner, paymentStatus: e.target.value})} className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors">
                    <option value="active">Active / Paid</option>
                    <option value="pending">Pending</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-on-surface-variant font-bold mb-2">Start Date</label>
                  <input type="date" value={newOwner.startDate} onChange={e => setNewOwner({...newOwner, startDate: e.target.value})} className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors" />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-on-surface-variant font-bold mb-2">Expiry Date</label>
                  <input type="date" value={newOwner.expiryDate} onChange={e => setNewOwner({...newOwner, expiryDate: e.target.value})} className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors" />
                </div>
                
                <div className="md:col-span-2 flex gap-6 mt-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={newOwner.isTrial} onChange={e => setNewOwner({...newOwner, isTrial: e.target.checked})} className="w-5 h-5 accent-primary bg-black/20 border border-white/10 rounded" />
                    <span className="text-sm font-bold uppercase tracking-wider text-white">Trial Mode</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={newOwner.isLifetime} onChange={e => setNewOwner({...newOwner, isLifetime: e.target.checked})} className="w-5 h-5 accent-primary bg-black/20 border border-white/10 rounded" />
                    <span className="text-sm font-bold uppercase tracking-wider text-white">Lifetime Access</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="pt-8 border-t border-white/5 flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="bg-primary text-on-primary-fixed px-8 py-4 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-primary-dim transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Deploy Gym Environment
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {activeTab === 'system' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-surface-container rounded-2xl p-8 border border-white/5 space-y-6">
                <div className="flex items-center gap-3 text-primary mb-4">
                    <Activity size={24} />
                    <h3 className="text-xl font-headline font-black uppercase">App Testing & Diagnostics</h3>
                </div>
                <p className="text-sm text-on-surface-variant">Run system tests to verify connection strings, latencies, and critical paths are operational.</p>
                
                <button
                    onClick={testConnection}
                    className="w-full py-4 bg-primary text-on-primary-fixed rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-primary-dim transition-colors flex justify-center items-center gap-2 mb-4"
                >
                    <RefreshCw size={16} /> Run Firebase Connection Test
                </button>

                <button
                    onClick={() => {
                        window.open(window.location.origin + '/onboarding', '_blank');
                    }}
                    className="w-full py-4 bg-surface border-2 border-primary text-primary rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-primary/10 transition-colors flex justify-center items-center gap-2"
                >
                    Test Gym Registration Flow
                </button>
            </div>
            
            <div className="bg-surface-container rounded-2xl p-8 border border-white/5 space-y-6">
               <div className="flex items-center gap-3 text-error mb-4">
                    <Database size={24} />
                    <h3 className="text-xl font-headline font-black uppercase">System Stats</h3>
                </div>
                <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 bg-black/20 rounded-lg">
                        <span className="text-sm text-on-surface-variant font-bold uppercase tracking-wider">Total Gyms</span>
                        <span className="font-mono text-2xl font-black text-white">{gyms.length}</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-black/20 rounded-lg">
                        <span className="text-sm text-on-surface-variant font-bold uppercase tracking-wider">Total Owners</span>
                        <span className="font-mono text-2xl font-black text-white">{owners.length}</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-black/20 rounded-lg border border-primary/20 bg-primary/5">
                        <span className="text-sm text-primary font-bold uppercase tracking-wider flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                            Platform Live Members
                        </span>
                        <span className="font-mono text-2xl font-black text-primary">
                            {(() => {
                                const activeLive = liveAttendance.filter(a => {
                                    const checkInTime = parseISO(a.timestamp);
                                    const twoAndHalfHoursAgo = subMinutes(new Date(), 150);
                                    return isAfter(checkInTime, twoAndHalfHoursAgo) && !a.checkOutTime;
                                });
                                return new Set(activeLive.map(a => a.userId)).size;
                            })()}
                        </span>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}
