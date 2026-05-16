import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { collection, query, getDocs, doc, updateDoc, orderBy, onSnapshot, setDoc, deleteDoc, where, limit, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserProfile, AttendanceRecord, Equipment, PaymentRecord, Announcement, MembershipTier } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Users, Activity, Search, CheckCircle, XCircle, Clock, QrCode, X, Dumbbell, Plus, IndianRupee, Calendar, TrendingUp, AlertTriangle, PieChart as PieChartIcon, BarChart3, Megaphone, Download, Eye, Trash2, Loader2, Lock, Sparkles, BrainCircuit, LogOut, Globe, Building2, Copy, ArrowUpRight, Share2, MessageCircle, Star, Target, Camera, Scan, Shield } from 'lucide-react';
import { format, isSameDay, subDays, startOfMonth, endOfMonth, isWithinInterval, subMonths, eachDayOfInterval, isSameMonth, subHours, subMinutes, isAfter, startOfDay, endOfDay } from 'date-fns';
import { addPoints } from '../services/gamificationService';
import { cn } from '../lib/utils';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';
import { QRCodeSVG } from 'qrcode.react';
import { SEO } from '../components/SEO';
import { toast } from 'sonner';
import { generateAdminInsights } from '../services/gemini';
import { BulkMemberImport } from '../components/BulkMemberImport';
import Challenges from './Challenges';
import OwnerSettingsTab from '../components/OwnerSettingsTab';
import MachineManagementTab from '../components/MachineManagementTab';
import PaymentsManagementTab from '../components/PaymentsManagementTab';
import AnnouncementsManagementTab from '../components/AnnouncementsManagementTab';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area 
} from 'recharts';

const TierLock = ({ requiredTier, currentTier, onUpgrade }: { requiredTier: 'professional' | 'elite', currentTier: string, onUpgrade: () => void }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 bg-surface-container-low border border-white/5 rounded-2xl text-center">
      <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
        <Lock size={32} className="text-primary" />
      </div>
      <h3 className="text-2xl font-black font-headline uppercase italic mb-2">Feature Locked</h3>
      <p className="text-on-surface-variant max-w-md mx-auto mb-8 text-sm">
        This feature requires the <span className="text-primary font-bold">{requiredTier.toUpperCase()}</span> plan. You are currently on the {currentTier.toUpperCase()} plan. Upgrade to unlock powerful new capabilities for your gym.
      </p>
      <button 
        onClick={onUpgrade}
        className="bg-primary text-on-primary-fixed px-8 py-3 rounded-xl font-black uppercase tracking-widest text-xs hover:opacity-90 transition-opacity"
      >
        View Plans
      </button>
    </div>
  );
};

export default function AdminPage({ profile }: { profile: UserProfile | null }) {
  const navigate = useNavigate();
  const [members, setMembers] = useState<UserProfile[]>([]);
  const [preRegistered, setPreRegistered] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [tiers, setTiers] = useState<MembershipTier[]>([]);
  const [gymInfo, setGymInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [attendanceSearchTerm, setAttendanceSearchTerm] = useState('');
  const [attendanceDateFilter, setAttendanceDateFilter] = useState('');
  const [showQR, setShowQR] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const html5QrCodeRef = React.useRef<Html5Qrcode | null>(null);

  const handleMemberCheckIn = async (userId: string) => {
    const member = members.find(m => m.uid === userId);
    if (!member || member.gymId !== profile?.gymId) {
        toast.error("Verified identity does not belong to this gym.");
        return;
    }

    if (member.membershipStatus !== 'active') {
        toast.error(`Member status is ${member.membershipStatus.toUpperCase()}. Access restricted.`);
        return;
    }

    try {
        const now = new Date();
        const twoAndHalfHoursAgo = subMinutes(now, 150).toISOString();
        
        // Find if user has an active session
        let activeSession: any = null;
        try {
            const qActive = query(
                collection(db, 'attendance'),
                where('userId', '==', userId),
                where('timestamp', '>=', twoAndHalfHoursAgo)
            );
            const activeSnap = await getDocs(qActive);
            const recentRecords = activeSnap.docs
                .map(d => ({ id: d.id, ...(d.data() as any) }))
                .filter(d => d.gymId === profile?.gymId && !d.checkOutTime)
                .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
                
            if (recentRecords.length > 0) {
                activeSession = recentRecords[0];
            }
        } catch(e) {
            console.warn("Index missing for active session check", e);
        }

        if (activeSession) {
            // Smart Check-Out
            await updateDoc(doc(db, 'attendance', activeSession.id), {
                checkOutTime: now.toISOString()
            });
            await addPoints(userId, profile.gymId!, 5); // 5 points for checkout
            toast.success(`See you later, ${member.displayName}! Checked out successfully.`);
            return;
        }

        const todayStart = startOfDay(now).toISOString();
        const todayEnd = endOfDay(now).toISOString();
        
        let isDuplicate = false;
        let entryCount = 1;
        try {
            const q = query(
                collection(db, 'attendance'),
                where('userId', '==', userId),
                where('timestamp', '>=', todayStart),
                where('timestamp', '<=', todayEnd)
            );
            const snap = await getDocs(q);
            const todayRecords = snap.docs.filter(d => d.data().gymId === profile?.gymId);
            isDuplicate = todayRecords.length > 0;
            entryCount = todayRecords.length + 1;
        } catch (e) {
            console.warn("Index missing for duplicate check, proceeding anyway", e);
        }

        await addDoc(collection(db, 'attendance'), {
            userId,
            userName: member.displayName,
            timestamp: now.toISOString(),
            terminalId: 'ADMIN_SCANNER',
            isDuplicate,
            entryCount,
            gymId: profile?.gymId
        });

        await addPoints(userId, profile.gymId!, 10);
        toast.success(`Access Granted: Welcome back, ${member.displayName}!`);
    } catch (err) {
        console.error(err);
        toast.error("Failed to record attendance.");
    }
  };
  const [activeTab, setActiveTab] = useState<'members' | 'equipment' | 'payments' | 'attendance' | 'analytics' | 'announcements' | 'ai' | 'settings' | 'tiers' | 'leaderboard'>('analytics');
  const [newEquipName, setNewEquipName] = useState('');

  // Tiers Helper
  const currentTier = gymInfo?.subscriptionTier || 'starter';
  const hasPro = currentTier === 'professional' || currentTier === 'elite';
  const hasElite = currentTier === 'elite';

  // System Settings State
  const [publicUrl, setPublicUrl] = useState(window.location.origin);
  const [savingSettings, setSavingSettings] = useState(false);

  // AI Insights State
  const [aiInsights, setAiInsights] = useState<{ title: string, suggestion: string }[]>([]);
  const [generatingAI, setGeneratingAI] = useState(false);

  // Member Detail State
  const [selectedMember, setSelectedMember] = useState<UserProfile | null>(null);
  const [liveAlerts, setLiveAlerts] = useState<any[]>([]);

  // Announcement Form State
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    content: '',
    type: 'info' as const
  });

  // Payment Form State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    userId: '',
    amount: '',
    status: 'paid' as const
  });

  const [showTierModal, setShowTierModal] = useState(false);
  const [editingTier, setEditingTier] = useState<Partial<MembershipTier> | null>(null);

  // Add Member State
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [addMemberForm, setAddMemberForm] = useState({
    name: '',
    email: '',
    phone: '',
    weight: '',
    height: '',
    goal: '',
    tier: '',
    gymId: ''
  });
  const [addingMember, setAddingMember] = useState(false);

  useEffect(() => {
    if (!profile || (profile.role !== 'admin' && profile.role !== 'owner')) return;
    if (!profile.gymId) {
      setLoading(false);
      return;
    }

    const membersPath = 'users';
    const attendancePath = 'attendance';
    const equipmentPath = 'equipment';
    const paymentsPath = 'payments';
    const announcementsPath = 'announcements';

    // Gym Info
    let unsubGym = () => {};
    if (profile.gymId) {
      unsubGym = onSnapshot(doc(db, 'gyms', profile.gymId), (snapshot) => {
        if (snapshot.exists()) {
          setGymInfo(snapshot.data());
        }
      }, (error) => {
        setTimeout(() => {
          handleFirestoreError(error, OperationType.GET, `gyms/${profile.gymId}`);
        }, 0);
      });
    }

    const membersQuery = query(collection(db, membersPath), where('gymId', '==', profile.gymId));

    const unsubMembers = onSnapshot(membersQuery, (snapshot) => {
      const fetchedMembers = snapshot.docs.map(doc => doc.data() as UserProfile);
      setMembers(fetchedMembers);
    }, (error) => {
      setTimeout(() => {
        handleFirestoreError(error, OperationType.LIST, membersPath);
      }, 0);
    });

    const preRegisteredQuery = query(collection(db, 'members'), where('gymId', '==', profile.gymId));
    const unsubPreRegistered = onSnapshot(preRegisteredQuery, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPreRegistered(fetched);
    }, (error) => {
      setTimeout(() => {
        handleFirestoreError(error, OperationType.LIST, 'members');
      }, 0);
    });

    const attendanceQuery = query(collection(db, attendancePath), where('gymId', '==', profile.gymId));

    const unsubAttendance = onSnapshot(attendanceQuery, (snapshot) => {
      const fetchedAttendance = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AttendanceRecord));
      fetchedAttendance.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setAttendance(fetchedAttendance);
    }, (error) => {
      setTimeout(() => {
        handleFirestoreError(error, OperationType.LIST, attendancePath);
      }, 0);
    });

    const equipmentQuery = query(collection(db, equipmentPath), where('gymId', '==', profile.gymId));

    const unsubEquipment = onSnapshot(equipmentQuery, (snapshot) => {
      const fetchedEquip = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Equipment));
      setEquipment(fetchedEquip);
    }, (error) => {
      setTimeout(() => {
        handleFirestoreError(error, OperationType.LIST, equipmentPath);
      }, 0);
    });

    const paymentsQuery = query(collection(db, paymentsPath), where('gymId', '==', profile.gymId));

    const unsubPayments = onSnapshot(paymentsQuery, (snapshot) => {
      const fetchedPayments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PaymentRecord));
      fetchedPayments.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setPayments(fetchedPayments);
      setLoading(false);
    }, (error) => {
      setLoading(false);
      setTimeout(() => {
        handleFirestoreError(error, OperationType.LIST, paymentsPath);
      }, 0);
    });

    const announcementsQuery = query(collection(db, announcementsPath), where('gymId', '==', profile.gymId));

    const unsubAnnouncements = onSnapshot(announcementsQuery, (snapshot) => {
      const fetchedAnnouncements = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Announcement));
      fetchedAnnouncements.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setAnnouncements(fetchedAnnouncements);
    }, (error) => {
      setTimeout(() => {
        handleFirestoreError(error, OperationType.LIST, announcementsPath);
      }, 0);
    });

    const tiersQuery = query(collection(db, 'membershipTiers'), where('gymId', '==', profile.gymId));

    const unsubTiers = onSnapshot(tiersQuery, (snapshot) => {
      const fetchedTiers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MembershipTier));
      setTiers(fetchedTiers);
    }, (error) => {
      setTimeout(() => {
        handleFirestoreError(error, OperationType.LIST, 'membershipTiers');
      }, 0);
    });

    const unsubSettings = onSnapshot(doc(db, 'system_settings', 'config'), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data.publicUrl) setPublicUrl(data.publicUrl);
      }
    }, (error) => {
      setTimeout(() => {
        handleFirestoreError(error, OperationType.GET, 'system_settings/config');
      }, 0);
    });

    const alertsQuery = query(collection(db, 'live_alerts'), where('gymId', '==', profile.gymId), where('resolved', '==', false));

    const unsubAlerts = onSnapshot(alertsQuery, (snapshot) => {
      const fetchedAlerts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // @ts-ignore
      fetchedAlerts.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setLiveAlerts(fetchedAlerts);
      
      // Show toast for new alerts
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added' && !loading) {
          const alert = change.doc.data();
          toast.error(`LIVE ALERT: ${alert.title}`, {
            description: alert.message,
            duration: 10000,
          });
        }
      });
    }, (error) => {
      setTimeout(() => {
        handleFirestoreError(error, OperationType.LIST, 'live_alerts');
      }, 0);
    });

    return () => {
      unsubGym();
      unsubMembers();
      unsubPreRegistered();
      unsubAttendance();
      unsubEquipment();
      unsubPayments();
      unsubAnnouncements();
      unsubSettings();
      unsubAlerts();
      unsubTiers();
    };
  }, [profile, loading]);

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      await setDoc(doc(db, 'system_settings', 'config'), {
        publicUrl: publicUrl.trim().replace(/\/$/, '') // Remove trailing slash
      }, { merge: true });
      toast.success('System settings updated');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'system_settings/config');
      toast.error('Failed to save settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const addEquipment = async () => {
    if (!newEquipName.trim() || !profile?.gymId) return;
    try {
      const id = Date.now().toString();
      await setDoc(doc(db, 'equipment', id), {
        id,
        name: newEquipName,
        status: 'available',
        gymId: profile.gymId
      });
      setNewEquipName('');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'equipment');
    }
  };

  const deleteEquipment = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'equipment', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `equipment/${id}`);
    }
  };

  const addPayment = async () => {
    if (!paymentForm.userId || !paymentForm.amount || !profile?.gymId) return;
    try {
      const id = Date.now().toString();
      const payment: any = {
        userId: paymentForm.userId,
        amount: parseFloat(paymentForm.amount),
        currency: 'INR',
        status: paymentForm.status,
        date: new Date().toISOString(),
        gymId: profile.gymId
      };
      await setDoc(doc(db, 'payments', id), payment);
      setShowPaymentModal(false);
      setPaymentForm({ userId: '', amount: '', status: 'paid' });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'payments');
    }
  };

  const updatePaymentStatus = async (id: string, status: PaymentRecord['status']) => {
    try {
      await updateDoc(doc(db, 'payments', id), { status });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `payments/${id}`);
    }
  };

  const addAnnouncement = async () => {
    if (!announcementForm.title || !announcementForm.content || !profile?.gymId) return;
    try {
      const id = Date.now().toString();
      const announcement: any = {
        title: announcementForm.title,
        content: announcementForm.content,
        type: announcementForm.type,
        createdAt: new Date().toISOString(),
        createdBy: profile.uid,
        gymId: profile.gymId
      };
      await setDoc(doc(db, 'announcements', id), announcement);
      setShowAnnouncementModal(false);
      setAnnouncementForm({ title: '', content: '', type: 'info' });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'announcements');
    }
  };

  const deleteAnnouncement = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'announcements', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `announcements/${id}`);
    }
  };

  const resolveAlert = async (id: string) => {
    try {
      await updateDoc(doc(db, 'live_alerts', id), { resolved: true });
      toast.success('Alert resolved');
    } catch (error) {
      console.error('Error resolving alert:', error);
    }
  };

  const handleUpgradePlan = async (tier: 'starter' | 'professional' | 'elite') => {
    if (!profile?.gymId) return;
    try {
      await updateDoc(doc(db, 'gyms', profile.gymId), {
        subscriptionTier: tier
      });
      toast.success(`Successfully updated to ${tier.toUpperCase()} plan`);
      setShowUpgradeModal(false);
    } catch (error) {
      toast.error('Failed to change plan');
      console.error(error);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalGymId = profile?.gymId || addMemberForm.gymId;
    if (!finalGymId) {
      toast.error('Gym ID is required');
      return;
    }
    setAddingMember(true);
    try {
      // Use Firebase's random push ID approach by generating a random UID since they aren't logging in
      const generatedUid = 'manual_' + Math.random().toString(36).substring(2, 15);
      const newMember: any = {
        uid: generatedUid,
        email: addMemberForm.email || `${generatedUid}@manual.member`,
        displayName: addMemberForm.name,
        role: 'member',
        membershipStatus: 'active',
        gymId: finalGymId,
        membershipType: addMemberForm.tier,
        createdAt: new Date().toISOString(),
      };
      
      if (addMemberForm.phone) newMember.phoneNumber = addMemberForm.phone;
      if (addMemberForm.weight) newMember.currentWeight = parseFloat(addMemberForm.weight);
      if (addMemberForm.height) newMember.height = addMemberForm.height;
      if (addMemberForm.goal) newMember.goal = addMemberForm.goal;

      await setDoc(doc(db, 'users', generatedUid), newMember);
      toast.success('Member added successfully!');
      setShowAddMemberModal(false);
      setAddMemberForm({ name: '', email: '', phone: '', weight: '', height: '', goal: '', tier: '', gymId: '' });
    } catch (error) {
      console.error(error);
      handleFirestoreError(error, OperationType.CREATE, 'users');
    } finally {
      setAddingMember(false);
    }
  };

  const addTier = async (tier: MembershipTier) => {
    if (!profile?.gymId) return;
    try {
      await setDoc(doc(db, 'membershipTiers', tier.id), { ...tier, gymId: profile.gymId });
      toast.success('Tier updated successfully');
    } catch (error) {
      toast.error('Failed to update tier');
    }
  };

  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) return;
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(obj => 
      Object.values(obj).map(val => 
        typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val
      ).join(',')
    ).join('\n');
    
    const csvContent = `data:text/csv;charset=utf-8,${headers}\n${rows}`;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${filename}_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const updateStatus = async (uid: string, status: string) => {
    try {
      await updateDoc(doc(db, 'users', uid), { membershipStatus: status });
      toast.success(`Member status updated to ${status}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
      toast.error('Failed to update status');
    }
  };

  const combinedMembers = [
    ...members.filter(m => m.role === 'member'),
    ...preRegistered.filter(p => !p.authLinked).map(p => ({
      uid: p.id,
      displayName: p.fullName,
      email: p.phone,
      phoneNumber: p.phone,
      role: 'member',
      membershipStatus: 'pre-registered',
      membershipType: p.membershipPlan,
      createdAt: p.createdAt
    }))
  ] as any[];

  const filteredMembers = combinedMembers.filter(m => 
    m.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    m.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.phoneNumber?.includes(searchTerm)
  );

  // Analytics Calculations
  const now = new Date();
  const last7Days = eachDayOfInterval({ start: subDays(now, 6), end: now });
  const attendanceByDay = last7Days.map(day => ({
    date: format(day, 'MMM dd'),
    count: attendance.filter(a => isSameDay(new Date(a.timestamp), day)).length
  }));

  const last6Months = Array.from({ length: 6 }).map((_, i) => subMonths(now, i)).reverse();
  const revenueByMonth = last6Months.map(month => ({
    month: format(month, 'MMM'),
    amount: payments
      .filter(p => p.status === 'paid' && isSameMonth(new Date(p.date), month))
      .reduce((sum, p) => sum + p.amount, 0)
  }));

  const membershipDistribution = [
    { name: 'Active', value: members.filter(m => m.membershipStatus === 'active').length, color: '#22c55e' },
    { name: 'Halted', value: members.filter(m => m.membershipStatus === 'halted').length, color: '#f59e0b' },
    { name: 'Expired', value: members.filter(m => m.membershipStatus === 'expired').length, color: '#ef4444' },
    { name: 'Pending', value: members.filter(m => !m.membershipStatus || m.membershipStatus === 'pending').length, color: '#6366f1' }
  ];

  const atRiskMembers = members.filter(m => {
    if (m.membershipStatus !== 'active') return false;
    const lastAttendance = attendance.find(a => a.userId === m.uid);
    if (!lastAttendance) return true;
    const daysSinceLastVisit = (now.getTime() - new Date(lastAttendance.timestamp).getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceLastVisit >= 2;
  });

  const totalRevenueThisMonth = payments
    .filter(p => p.status === 'paid' && isSameMonth(new Date(p.date), now))
    .reduce((sum, p) => sum + p.amount, 0);

  const liveCount = new Set(
    attendance
      .filter(a => {
        const checkInTime = new Date(a.timestamp);
        const twoAndHalfHoursAgo = subMinutes(now, 150);
        return isAfter(checkInTime, twoAndHalfHoursAgo) && !a.checkOutTime;
      })
      .map(a => a.userId)
  ).size;

  const handleGenerateAI = async () => {
    setGeneratingAI(true);
    try {
      const metrics = {
        totalMembers: members.length,
        activeMembers: members.filter(m => m.membershipStatus === 'active').length,
        haltedMembers: members.filter(m => m.membershipStatus === 'halted').length,
        pendingMembers: members.filter(m => !m.membershipStatus || m.membershipStatus === 'pending').length,
        revenueThisMonth: totalRevenueThisMonth,
        attendanceToday: new Set(attendance.filter(a => isSameDay(new Date(a.timestamp), new Date())).map(a => a.userId)).size,
        atRiskCount: atRiskMembers.length
      };
      const result = await generateAdminInsights(metrics);
      setAiInsights(result.insights);
      toast.success('AI Insights generated!');
    } catch (error) {
      toast.error('Failed to generate AI insights');
    } finally {
      setGeneratingAI(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40">
        <Loader2 className="text-primary animate-spin mb-4" size={48} />
        <p className="text-on-surface-variant font-headline font-bold uppercase tracking-widest text-xs">Syncing with Command Center...</p>
      </div>
    );
  }

  if (!profile || (profile.role !== 'admin' && profile.role !== 'owner') || !profile.gymId) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Lock size={64} className="text-error mb-6" />
        <h2 className="font-headline text-3xl font-black uppercase italic mb-2">Access Denied</h2>
        <p className="text-on-surface-variant max-w-md">This terminal is restricted to administrative personnel only. Your credentials do not have the required clearance.</p>
      </div>
    );
  }

  if (profile.role === 'owner' && profile.membershipStatus === 'pending') {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Lock size={64} className="text-amber-500 mb-6" />
        <h2 className="font-headline text-3xl font-black uppercase italic mb-2">Awaiting Verification</h2>
        <p className="text-on-surface-variant max-w-md">Your owner account is currently pending manual verification. Please complete the WhatsApp verification step to gain access to the Command Center.</p>
        <button 
          onClick={() => window.open(`https://wa.me/917889686144?text=${encodeURIComponent(`Hi, I've registered my gym (${gymInfo?.name || profile.gymId}) and am awaiting verification.\nEmail: ${profile.email}`)}`, '_blank')} 
          className="mt-8 bg-primary hover:bg-primary-bright px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-on-primary-fixed text-xs transition-colors"
        >
          Complete Verification via WhatsApp
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-20">
      <SEO title="Admin Command Center" />
      {/* Header */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-6">
        <div>
          <span className="font-headline font-bold uppercase tracking-[0.1em] text-primary text-[10px] sm:text-sm mb-1 sm:mb-2 block">
            {gymInfo ? gymInfo.name : 'Command Center'}
          </span>
          <h2 className="font-headline font-black text-3xl sm:text-5xl md:text-6xl leading-none uppercase italic">
            Gym <br/><span className="text-primary-dim">Operations.</span>
          </h2>
          {profile?.gymId && (
            <p className="text-[10px] font-mono text-on-surface-variant mt-2 uppercase tracking-widest">
              Gym ID: <span className="text-primary">{profile.gymId}</span> (Share this with your members)
            </p>
          )}
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <button 
            onClick={() => setShowScanner(true)}
            className="bg-primary text-on-primary-fixed font-headline font-bold uppercase px-6 sm:px-8 py-3 sm:py-4 rounded-lg flex items-center justify-center gap-3 hover:opacity-90 active:scale-95 transition-all shadow-xl text-xs sm:text-sm"
          >
            <Scan size={18} />
            Scan Member
          </button>
          <button 
            onClick={() => setShowQR(true)}
            className="bg-surface-container-highest border border-white/10 text-white font-headline font-bold uppercase px-6 sm:px-8 py-3 sm:py-4 rounded-lg flex items-center justify-center gap-3 hover:bg-white/10 active:scale-95 transition-all shadow-xl text-xs sm:text-sm"
          >
            <QrCode size={18} />
            Terminal QR
          </button>
        </div>
      </section>

      {/* Admin QR Scanner Modal */}
      <AnimatePresence>
        {showScanner && (
          <div className="fixed inset-0 z-[110] flex flex-col pt-16 sm:pt-0 items-center justify-center p-0 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/95 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full h-full sm:h-auto sm:max-w-md bg-surface-container overflow-hidden sm:rounded-3xl shadow-2xl border-x border-y border-white/5"
            >
              <div className="absolute top-0 inset-x-0 z-50 p-6 flex justify-between items-center bg-gradient-to-b from-black/60 to-transparent">
                  <h3 className="font-headline font-black text-xl uppercase italic text-white leading-none">MEMBER SCANNER</h3>
                  <button 
                    onClick={() => {
                        if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
                            html5QrCodeRef.current.stop();
                        }
                        setShowScanner(false);
                        setIsScanning(false);
                    }}
                    className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                  >
                    <X size={24} />
                  </button>
              </div>

              <div className="relative aspect-square sm:aspect-auto sm:h-[400px] bg-black group">
                  <div id="admin-reader" className="w-full h-full" />
                  
                  {/* Scanner overlay */}
                  <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                      <div className="w-[200px] h-[200px] relative">
                          <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-primary rounded-tl-lg" />
                          <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-primary rounded-tr-lg" />
                          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-primary rounded-bl-lg" />
                          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-primary rounded-br-lg" />
                          
                          <motion.div 
                            animate={{ top: ['0%', '100%'] }}
                            transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                            className="absolute inset-x-0 h-0.5 bg-primary/60 shadow-[0_0_15px_rgba(255,143,111,0.8)]"
                          />
                      </div>
                      <p className="mt-8 text-white/60 text-[10px] font-black uppercase tracking-[0.3em]">Align Member Pass</p>
                  </div>

                  {!isScanning && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-black/60 backdrop-blur-sm">
                          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-6 animate-pulse">
                              <Camera size={32} />
                          </div>
                          <h4 className="font-headline font-black text-xl text-white uppercase italic mb-2 tracking-tighter">Ready to Verify</h4>
                          <p className="text-on-surface-variant text-xs mb-8">Click start to initialize your device's camera for verifying member digital passes.</p>
                          <button 
                            onClick={async () => {
                                setIsScanning(true);
                                try {
                                    const scanner = new Html5Qrcode("admin-reader");
                                    html5QrCodeRef.current = scanner;
                                    await scanner.start(
                                        { facingMode: { ideal: "environment" } },
                                        { fps: 15, qrbox: { width: 250, height: 250 } },
                                        async (decodedText) => {
                                            if (decodedText.startsWith('USER_ID:')) {
                                                const userId = decodedText.split('USER_ID:')[1];
                                                await handleMemberCheckIn(userId);
                                                scanner.stop();
                                                setShowScanner(false);
                                                setIsScanning(false);
                                            } else {
                                                toast.error("Invalid QR code format detected.");
                                            }
                                        },
                                        () => {}
                                    );
                                } catch (err) {
                                    console.error(err);
                                    toast.error("Could not access camera.");
                                    setIsScanning(false);
                                }
                            }}
                            className="kinetic-gradient px-12 py-4 rounded-xl font-headline font-black uppercase tracking-widest text-on-primary-fixed shadow-xl shadow-primary/20"
                          >
                            Start Scanner
                          </button>
                      </div>
                  )}
              </div>

              <div className="p-8 bg-surface-container flex flex-col items-center">
                  <div className="flex items-center gap-4 text-on-surface-variant">
                      <Shield size={16} />
                      <span className="text-[10px] font-bold uppercase tracking-widest leading-none">Security Protocol Enforced</span>
                  </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* QR Modal */}
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
              className="relative bg-white p-12 rounded-3xl max-w-sm w-full shadow-2xl flex flex-col items-center text-center overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-primary" />
              <button 
                onClick={() => setShowQR(false)}
                className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-900 bg-neutral-100 p-2 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
              
              <div className="mb-6">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-primary/20">
                   <Building2 className="text-primary" size={32} />
                </div>
                <h3 className="font-headline font-black text-2xl uppercase italic mb-1 text-neutral-900 leading-none">{gymInfo?.name?.toUpperCase() || 'ACCESS TERMINAL'}</h3>
                <p className="text-neutral-500 text-[10px] uppercase tracking-widest font-black opacity-80">Official Gatekeeper Entry</p>
              </div>
              
              <div className="p-5 bg-white rounded-2xl shadow-[inset_0_2px_10px_rgba(0,0,0,0.05)] border-2 border-neutral-50 mb-8 transform hover:scale-[1.02] transition-transform duration-500">
                <QRCodeSVG 
                    value={`${window.location.origin}/scan?gymId=${profile?.gymId}&terminal=MAIN_GATE`} 
                    size={220} 
                    includeMargin={true}
                    level="H"
                />
              </div>
              
              <div className="w-full space-y-4">
                  <div className="flex items-center gap-2 justify-center py-2 px-4 bg-neutral-50 rounded-lg text-neutral-400 font-mono text-[9px] truncate">
                      {window.location.origin}/scan?gymId={profile?.gymId}
                  </div>
                  <p className="text-neutral-500 text-[10px] font-medium leading-relaxed uppercase tracking-tighter">
                      Members can scan this with their phone camera or the MustGym app to mark attendance.
                  </p>
                  <button 
                    onClick={() => {
                        const url = `${window.location.origin}/scan?gymId=${profile?.gymId}`;
                        navigator.clipboard.writeText(url);
                        toast.success("Terminal URL copied!");
                    }}
                    className="w-full py-3 bg-neutral-900 text-white rounded-xl font-headline font-bold uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:bg-neutral-800 transition-all active:scale-95"
                  >
                    <Copy size={12} />
                    Copy Access Link
                  </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Stats Overview */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-surface-container-low p-4 sm:p-6 rounded-lg border-l-4 border-primary">
          <div className="flex justify-between items-start mb-2 sm:mb-4">
            <Users className="text-primary" size={18} />
            <span className="text-[10px] font-bold text-green-500">Live</span>
          </div>
          <div className="font-headline text-2xl sm:text-4xl font-black">{liveCount}</div>
          <div className="text-[8px] sm:text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Members In Gym</div>
        </div>
        <div className="bg-surface-container-low p-4 sm:p-6 rounded-lg border-l-4 border-primary">
          <div className="flex justify-between items-start mb-2 sm:mb-4">
            <Activity className="text-primary" size={18} />
            <span className="text-[10px] font-bold text-primary">Today</span>
          </div>
          <div className="font-headline text-2xl sm:text-4xl font-black">
            {new Set(attendance.filter(a => isSameDay(new Date(a.timestamp), new Date())).map(a => a.userId)).size}
          </div>
          <div className="text-[8px] sm:text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Today's Attendance</div>
        </div>
        <div className="bg-surface-container-low p-4 sm:p-6 rounded-lg border-l-4 border-primary">
          <div className="flex justify-between items-start mb-2 sm:mb-4">
            <IndianRupee className="text-primary" size={18} />
            <span className="text-[10px] font-bold text-green-500">MTD</span>
          </div>
          <div className="font-headline text-2xl sm:text-4xl font-black">
            ₹{totalRevenueThisMonth.toLocaleString('en-IN')}
          </div>
          <div className="text-[8px] sm:text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Monthly Revenue</div>
        </div>
        <div className="bg-surface-container-low p-4 sm:p-6 rounded-lg border-l-4 border-primary">
          <div className="flex justify-between items-start mb-2 sm:mb-4">
            <AlertTriangle className="text-error" size={18} />
            <span className="text-[10px] font-bold text-error">Risk</span>
          </div>
          <div className="font-headline text-2xl sm:text-4xl font-black">
            {atRiskMembers.length}
          </div>
          <div className="text-[8px] sm:text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Inactive Members</div>
        </div>
      </section>

      {/* Live Alerts Section */}
      <AnimatePresence>
        {liveAlerts.length > 0 && (
          <motion.section 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-2 px-1">
              <div className="w-2 h-2 bg-error rounded-full animate-pulse" />
              <h3 className="font-headline font-black text-xs uppercase tracking-[0.2em] text-error">Critical Live Alerts</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {liveAlerts.map((alert) => (
                <motion.div 
                  key={alert.id}
                  layout
                  className="bg-error/5 border border-error/20 p-5 rounded-2xl flex gap-4 relative overflow-hidden group"
                >
                  <div className="absolute top-0 left-0 w-1 h-full bg-error" />
                  <div className="w-10 h-10 bg-error/10 rounded-xl flex items-center justify-center shrink-0">
                    <AlertTriangle className="text-error" size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-headline font-bold text-white uppercase tracking-tight mb-1">{alert.title}</h4>
                    <p className="text-[11px] text-on-surface-variant leading-relaxed mb-3">{alert.message}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-bold text-error/60 uppercase">{format(new Date(alert.timestamp), 'HH:mm:ss')}</span>
                      <button 
                        onClick={() => resolveAlert(alert.id)}
                        className="text-[9px] font-black text-error uppercase tracking-widest hover:underline"
                      >
                        Mark Resolved
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Tabs */}
      <div className="flex border-b border-white/5 overflow-x-auto no-scrollbar">
        <button 
          onClick={() => setActiveTab('analytics')}
          className={cn(
            "px-4 sm:px-6 py-2 sm:py-3 font-headline font-bold uppercase tracking-widest text-[10px] sm:text-xs transition-all border-b-2 whitespace-nowrap flex items-center gap-2",
            activeTab === 'analytics' ? "border-primary text-primary" : "border-transparent text-on-surface-variant hover:text-on-surface"
          )}
        >
          {!hasPro && <Lock size={12} />}
          Analytics
        </button>
        <button 
          onClick={() => setActiveTab('ai')}
          className={cn(
            "px-4 sm:px-6 py-2 sm:py-3 font-headline font-bold uppercase tracking-widest text-[10px] sm:text-xs transition-all border-b-2 whitespace-nowrap flex items-center gap-2",
            activeTab === 'ai' ? "border-primary text-primary" : "border-transparent text-on-surface-variant hover:text-on-surface"
          )}
        >
          {!hasElite ? <Lock size={12} /> : <Sparkles size={12} />}
          AI Insights
        </button>
        <button 
          onClick={() => setActiveTab('members')}
          className={cn(
            "px-4 sm:px-6 py-2 sm:py-3 font-headline font-bold uppercase tracking-widest text-[10px] sm:text-xs transition-all border-b-2",
            activeTab === 'members' ? "border-primary text-primary" : "border-transparent text-on-surface-variant hover:text-on-surface"
          )}
        >
          Members
        </button>
        <button 
          onClick={() => setActiveTab('equipment')}
          className={cn(
            "px-4 sm:px-6 py-2 sm:py-3 font-headline font-bold uppercase tracking-widest text-[10px] sm:text-xs transition-all border-b-2 flex items-center gap-2",
            activeTab === 'equipment' ? "border-primary text-primary" : "border-transparent text-on-surface-variant hover:text-on-surface"
          )}
        >
          {!hasElite && <Lock size={12} />}
          Equipment
        </button>
        <button 
          onClick={() => setActiveTab('payments')}
          className={cn(
            "px-4 sm:px-6 py-2 sm:py-3 font-headline font-bold uppercase tracking-widest text-[10px] sm:text-xs transition-all border-b-2",
            activeTab === 'payments' ? "border-primary text-primary" : "border-transparent text-on-surface-variant hover:text-on-surface"
          )}
        >
          Payments
        </button>
        <button 
          onClick={() => setActiveTab('attendance')}
          className={cn(
            "px-4 sm:px-6 py-2 sm:py-3 font-headline font-bold uppercase tracking-widest text-[10px] sm:text-xs transition-all border-b-2",
            activeTab === 'attendance' ? "border-primary text-primary" : "border-transparent text-on-surface-variant hover:text-on-surface"
          )}
        >
          Attendance
        </button>
        <button 
          onClick={() => setActiveTab('announcements')}
          className={cn(
            "px-4 sm:px-6 py-2 sm:py-3 font-headline font-bold uppercase tracking-widest text-[10px] sm:text-xs transition-all border-b-2",
            activeTab === 'announcements' ? "border-primary text-primary" : "border-transparent text-on-surface-variant hover:text-on-surface"
          )}
        >
          Announcements
        </button>
        <button 
          onClick={() => setActiveTab('leaderboard')}
          className={cn(
            "px-4 sm:px-6 py-2 sm:py-3 font-headline font-bold uppercase tracking-widest text-[10px] sm:text-xs transition-all border-b-2 whitespace-nowrap",
            activeTab === 'leaderboard' ? "border-primary text-primary" : "border-transparent text-on-surface-variant hover:text-on-surface"
          )}
        >
          Leaderboard
        </button>
        <button 
          onClick={() => setActiveTab('settings')}
          className={cn(
            "px-4 sm:px-6 py-2 sm:py-3 font-headline font-bold uppercase tracking-widest text-[10px] sm:text-xs transition-all border-b-2 flex items-center gap-2",
            activeTab === 'settings' ? "border-primary text-primary" : "border-transparent text-on-surface-variant hover:text-on-surface"
          )}
        >
          <Lock size={12} />
          System Settings
        </button>
      </div>

      {/* Payment Modal */}
      <AnimatePresence>
        {showPaymentModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPaymentModal(false)}
              className="absolute inset-0 bg-background/90 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-surface-container p-8 rounded-xl max-w-lg w-full shadow-2xl border border-white/5"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-headline font-black text-2xl uppercase italic">Record Payment</h3>
                <button onClick={() => setShowPaymentModal(false)}>
                  <X size={24} className="text-on-surface-variant" />
                </button>
              </div>
              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-primary mb-2">Member</label>
                  <select 
                    value={paymentForm.userId}
                    onChange={(e) => setPaymentForm({ ...paymentForm, userId: e.target.value })}
                    className="w-full bg-surface-container-highest border-none text-on-surface py-3 px-4 rounded-lg focus:ring-2 focus:ring-primary/40"
                  >
                    <option value="">Select Member</option>
                    {members.map(m => (
                      <option key={m.uid} value={m.uid}>{m.displayName || m.email}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-primary mb-2">Amount (INR)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-outline font-bold">₹</span>
                    <input 
                      type="number" 
                      placeholder="0.00"
                      value={paymentForm.amount}
                      onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                      className="w-full bg-surface-container-highest border-none text-on-surface py-3 pl-10 pr-4 rounded-lg focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-primary mb-2">Status</label>
                  <select 
                    value={paymentForm.status}
                    onChange={(e) => setPaymentForm({ ...paymentForm, status: e.target.value as any })}
                    className="w-full bg-surface-container-highest border-none text-on-surface py-3 px-4 rounded-lg focus:ring-2 focus:ring-primary/40"
                  >
                    <option value="paid">Paid</option>
                    <option value="pending">Pending</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>
                <button 
                  onClick={addPayment}
                  className="kinetic-gradient w-full py-4 rounded-lg font-headline font-bold uppercase tracking-widest text-on-primary-fixed flex items-center justify-center gap-2"
                >
                  <Plus size={20} />
                  Record Payment
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Upgrade Plan Modal */}
      <AnimatePresence>
        {showUpgradeModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowUpgradeModal(false)}
              className="fixed inset-0 bg-background/90 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-5xl bg-surface p-6 sm:p-8 rounded-3xl border border-white/10 shadow-2xl my-8 z-10"
            >
              <button 
                onClick={() => setShowUpgradeModal(false)}
                className="absolute top-4 right-4 p-2 bg-surface-container-high hover:bg-surface-container-highest rounded-full transition-colors text-on-surface"
              >
                <X size={20} />
              </button>
              
              <div className="text-center mb-8 pt-4">
                <h2 className="text-3xl font-black font-headline uppercase italic mb-2">Choose Your Plan</h2>
                <p className="text-on-surface-variant max-w-xl mx-auto">Select the right subscription to supercharge your gym operations.</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                {/* STARTER */}
                <div className={cn("p-6 rounded-2xl border-2 flex flex-col h-full", gymInfo?.subscriptionTier === 'starter' ? "border-white/30 bg-surface-container-high" : "border-white/10 bg-surface-container")}>
                  <div className="mb-6">
                    <h3 className="text-xl font-black uppercase mb-2 flex items-center gap-2">
                      <span>🏋️</span> Starter 
                      {gymInfo?.subscriptionTier === 'starter' && <span className="text-[10px] bg-white/10 px-2 py-1 rounded text-white ml-auto">Current</span>}
                    </h3>
                    <div className="text-3xl font-black mb-1">₹1,999<span className="text-sm text-on-surface-variant font-medium">/month</span></div>
                    <p className="text-[10px] text-on-surface-variant font-medium min-h-[30px]">Perfect for boutique gyms just getting started</p>
                  </div>
                  
                  <ul className="text-sm space-y-3 mb-8 flex-grow text-on-surface-variant">
                    <li className="flex items-start gap-2"><CheckCircle size={16} className="text-primary mt-0.5 shrink-0" /> QR Check-in/Check-out</li>
                    <li className="flex items-start gap-2"><CheckCircle size={16} className="text-primary mt-0.5 shrink-0" /> Member Dashboard</li>
                    <li className="flex items-start gap-2"><CheckCircle size={16} className="text-primary mt-0.5 shrink-0" /> Admin Portal</li>
                    <li className="flex items-start gap-2"><CheckCircle size={16} className="text-primary mt-0.5 shrink-0" /> Payment Tracking</li>
                    <li className="flex items-start gap-2"><CheckCircle size={16} className="text-primary mt-0.5 shrink-0" /> Up to 150 members</li>
                    <li className="flex items-start gap-2"><CheckCircle size={16} className="text-primary mt-0.5 shrink-0" /> WhatsApp Support</li>
                  </ul>

                  <div className="mt-auto">
                    <div className="text-[10px] text-center mb-4 text-on-surface-variant font-bold border-t border-white/5 pt-4">
                      Setup: ₹8,000 (First 10 gyms: <span className="text-primary">FREE</span>)
                    </div>
                    {gymInfo?.subscriptionTier === 'starter' ? (
                      <button disabled className="w-full py-3 rounded-xl bg-white/5 text-white/50 font-bold uppercase text-xs">Current Plan</button>
                    ) : (
                      <a href="https://wa.me/917889686144?text=Hi%2C%20I%20want%20to%20start%20my%20gym%20on%20the%20Starter%20plan." target="_blank" rel="noopener noreferrer" className="block w-full py-3 rounded-xl bg-surface-container-highest hover:bg-white/10 border border-white/10 text-center font-bold uppercase text-xs transition-colors">Start Free Trial</a>
                    )}
                  </div>
                </div>
                
                {/* PROFESSIONAL */}
                <div className={cn("p-6 rounded-2xl border-2 flex flex-col h-full transform scale-105 shadow-2xl relative", gymInfo?.subscriptionTier === 'professional' ? "border-primary bg-primary/10" : "border-primary/50 bg-surface-container-high")}>
                  <div className="absolute -top-3 inset-x-0 flex justify-center">
                    <span className="bg-primary text-on-primary font-black uppercase text-[10px] tracking-widest px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
                      <Star size={10} fill="currentColor" /> Most Popular
                    </span>
                  </div>
                  <div className="mb-6 mt-2">
                    <h3 className="text-xl font-black uppercase mb-2 flex items-center gap-2 text-primary">
                      <span>💪</span> Professional
                      {gymInfo?.subscriptionTier === 'professional' && <span className="text-[10px] bg-primary/20 px-2 py-1 rounded text-primary ml-auto">Current</span>}
                    </h3>
                    <div className="text-3xl font-black mb-1 text-white">₹4,999<span className="text-sm text-on-surface-variant font-medium">/month</span></div>
                    <p className="text-[10px] text-primary font-bold min-h-[30px]">(Founding Member: ₹2,999/month)</p>
                  </div>
                  
                  <p className="text-xs font-bold mb-3 uppercase tracking-wider text-white">Everything in Starter PLUS:</p>
                  <ul className="text-sm space-y-3 mb-8 flex-grow text-on-surface-variant">
                    <li className="flex items-start gap-2"><CheckCircle size={16} className="text-primary mt-0.5 shrink-0" /> AI Workout Generator</li>
                    <li className="flex items-start gap-2"><CheckCircle size={16} className="text-primary mt-0.5 shrink-0" /> AI Diet Plans (Indian)</li>
                    <li className="flex items-start gap-2"><CheckCircle size={16} className="text-primary mt-0.5 shrink-0" /> Full Gamification System</li>
                    <li className="flex items-start gap-2"><CheckCircle size={16} className="text-primary mt-0.5 shrink-0" /> Fitness Challenges</li>
                    <li className="flex items-start gap-2"><CheckCircle size={16} className="text-primary mt-0.5 shrink-0" /> Progress Tracking</li>
                    <li className="flex items-start gap-2"><CheckCircle size={16} className="text-primary mt-0.5 shrink-0" /> Business Analytics</li>
                    <li className="flex items-start gap-2"><CheckCircle size={16} className="text-primary mt-0.5 shrink-0" /> Up to 500 members</li>
                    <li className="flex items-start gap-2"><CheckCircle size={16} className="text-primary mt-0.5 shrink-0" /> Custom Branding</li>
                  </ul>

                  <div className="mt-auto">
                    <div className="text-[10px] text-center mb-4 text-on-surface-variant font-bold border-t border-white/5 pt-4">
                      Setup: ₹12,000 (First 10 gyms: <span className="text-primary">FREE</span>)
                    </div>
                    {gymInfo?.subscriptionTier === 'professional' ? (
                      <button disabled className="w-full py-3 rounded-xl bg-primary/20 text-primary font-bold uppercase text-xs">Current Plan</button>
                    ) : (
                      <a href="https://wa.me/917889686144?text=Hi%2C%20I%20want%20to%20upgrade%20my%20gym%20plan%20to%20Professional" target="_blank" rel="noopener noreferrer" className="block w-full py-3 rounded-xl bg-primary text-on-primary text-center font-bold uppercase text-xs transition-transform hover:scale-[1.02] shadow-xl shadow-primary/20">Book a Demo</a>
                    )}
                  </div>
                </div>

                {/* ELITE */}
                <div className={cn("p-6 rounded-2xl border-2 flex flex-col h-full", gymInfo?.subscriptionTier === 'elite' ? "border-secondary bg-secondary/10" : "border-white/10 bg-surface-container")}>
                  <div className="mb-6">
                    <h3 className="text-xl font-black uppercase mb-2 flex items-center gap-2 text-secondary">
                      <span>🏆</span> Elite
                      {gymInfo?.subscriptionTier === 'elite' && <span className="text-[10px] bg-secondary/20 px-2 py-1 rounded text-secondary ml-auto">Current</span>}
                    </h3>
                    <div className="text-3xl font-black mb-1">₹9,999<span className="text-sm text-on-surface-variant font-medium">/month</span></div>
                    <p className="text-[10px] text-on-surface-variant font-medium min-h-[30px]">For premium chains and large facilities</p>
                  </div>
                  
                  <p className="text-xs font-bold mb-3 uppercase tracking-wider text-secondary">Everything in Pro PLUS:</p>
                  <ul className="text-sm space-y-3 mb-8 flex-grow text-on-surface-variant">
                    <li className="flex items-start gap-2"><CheckCircle size={16} className="text-secondary mt-0.5 shrink-0" /> AI Business Insights</li>
                    <li className="flex items-start gap-2"><CheckCircle size={16} className="text-secondary mt-0.5 shrink-0" /> Multi-Location Support</li>
                    <li className="flex items-start gap-2"><CheckCircle size={16} className="text-secondary mt-0.5 shrink-0" /> Equipment Management</li>
                    <li className="flex items-start gap-2"><CheckCircle size={16} className="text-secondary mt-0.5 shrink-0" /> Financial Ledger</li>
                    <li className="flex items-start gap-2"><CheckCircle size={16} className="text-secondary mt-0.5 shrink-0" /> Unlimited Members</li>
                    <li className="flex items-start gap-2"><CheckCircle size={16} className="text-secondary mt-0.5 shrink-0" /> Dedicated Account Manager</li>
                    <li className="flex items-start gap-2"><CheckCircle size={16} className="text-secondary mt-0.5 shrink-0" /> Priority Support</li>
                    <li className="flex items-start gap-2"><CheckCircle size={16} className="text-secondary mt-0.5 shrink-0" /> Monthly Strategy Call</li>
                  </ul>

                  <div className="mt-auto">
                    <div className="text-[10px] text-center mb-4 text-on-surface-variant font-bold border-t border-white/5 pt-4">
                      Setup: ₹25,000
                    </div>
                    {gymInfo?.subscriptionTier === 'elite' ? (
                      <button disabled className="w-full py-3 rounded-xl bg-secondary/20 text-secondary font-bold uppercase text-xs">Current Plan</button>
                    ) : (
                      <a href="https://wa.me/917889686144?text=Hi%2C%20I%20want%20to%20upgrade%20my%20gym%20plan%20to%20Elite" target="_blank" rel="noopener noreferrer" className="block w-full py-3 rounded-xl bg-surface-container-highest hover:bg-white/10 border border-white/10 text-center font-bold uppercase text-xs transition-colors">Contact Sales</a>
                    )}
                  </div>
                </div>
              </div>

              {/* ADD-ONS Section */}
              <div className="bg-surface-container-low rounded-2xl p-6 md:p-8 border border-white/5">
                <h3 className="text-xl font-black uppercase italic mb-6 flex items-center gap-2"><Target className="text-primary" size={24} /> Add-Ons</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <h4 className="font-bold text-white mb-1">White-Label Branding</h4>
                    <p className="text-xs text-primary font-black mb-2">₹30,000</p>
                    <p className="text-xs text-on-surface-variant">Remove our branding, use your domain</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-white mb-1">Custom Integrations</h4>
                    <p className="text-xs text-primary font-black mb-2">From ₹15,000</p>
                    <p className="text-xs text-on-surface-variant">WhatsApp API, Payment gateways, Custom reports</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-white mb-1">Staff Training Session</h4>
                    <p className="text-xs text-primary font-black mb-2">₹5,000</p>
                    <p className="text-xs text-on-surface-variant">2-hour deep dive for your team</p>
                  </div>
                </div>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Announcement Modal */}
      <AnimatePresence>
        {showAnnouncementModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAnnouncementModal(false)}
              className="absolute inset-0 bg-background/90 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-surface-container p-8 rounded-xl max-w-lg w-full shadow-2xl border border-white/5"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-headline font-black text-2xl uppercase italic">Post Announcement</h3>
                <button onClick={() => setShowAnnouncementModal(false)}>
                  <X size={24} className="text-on-surface-variant" />
                </button>
              </div>
              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-primary mb-2">Title</label>
                  <input 
                    type="text" 
                    placeholder="e.g., Holiday Hours"
                    value={announcementForm.title}
                    onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
                    className="w-full bg-surface-container-highest border-none text-on-surface py-3 px-4 rounded-lg focus:ring-2 focus:ring-primary/40"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-primary mb-2">Content</label>
                  <textarea 
                    placeholder="Write your message here..."
                    value={announcementForm.content}
                    onChange={(e) => setAnnouncementForm({ ...announcementForm, content: e.target.value })}
                    rows={4}
                    className="w-full bg-surface-container-highest border-none text-on-surface py-3 px-4 rounded-lg focus:ring-2 focus:ring-primary/40 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-primary mb-2">Type</label>
                  <div className="flex gap-2">
                    {(['info', 'alert', 'event'] as const).map((type) => (
                      <button
                        key={type}
                        onClick={() => setAnnouncementForm({ ...announcementForm, type })}
                        className={cn(
                          "flex-1 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all border",
                          announcementForm.type === type 
                            ? "bg-primary border-primary text-on-primary-fixed" 
                            : "bg-surface-container-highest border-transparent text-on-surface-variant"
                        )}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
                <button 
                  onClick={addAnnouncement}
                  className="kinetic-gradient w-full py-4 rounded-lg font-headline font-bold uppercase tracking-widest text-on-primary-fixed flex items-center justify-center gap-2"
                >
                  <Megaphone size={20} />
                  Post Announcement
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Member Detail Modal */}
      <AnimatePresence>
        {selectedMember && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedMember(null)}
              className="absolute inset-0 bg-background/90 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-surface-container p-8 rounded-xl max-w-2xl w-full shadow-2xl border border-white/5 max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
              <button 
                onClick={() => setSelectedMember(null)}
                className="absolute top-4 right-4 text-on-surface-variant hover:text-on-surface"
              >
                <X size={24} />
              </button>

              <div className="flex flex-col md:flex-row gap-8 mb-8">
                <div className="w-32 h-32 rounded-2xl overflow-hidden border-2 border-primary/20 shrink-0 mx-auto md:mx-0">
                  <img 
                    src={selectedMember.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedMember.uid}`} 
                    alt="" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="text-center md:text-left">
                  <h3 className="font-headline font-black text-3xl uppercase italic mb-1">{selectedMember.displayName || 'Anonymous'}</h3>
                  <p className="text-on-surface-variant text-sm mb-4">{selectedMember.email}</p>
                  <div className="flex flex-wrap justify-center md:justify-start gap-3">
                    <span className={cn(
                      "text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full",
                      selectedMember.membershipStatus === 'active' ? "bg-green-500/10 text-green-500" : "bg-error/10 text-error"
                    )}>
                      {selectedMember.membershipStatus || 'Pending'}
                    </span>
                    <select 
                        value={selectedMember.membershipType || 'standard'}
                        onChange={async (e) => {
                            const newType = e.target.value;
                            try {
                                await updateDoc(doc(db, 'users', selectedMember.uid), {
                                    membershipType: newType
                                });
                                setSelectedMember({ ...selectedMember, membershipType: newType as any });
                                toast.success('Membership tier updated');
                            } catch (err) {
                                toast.error('Failed to update tier');
                            }
                        }}
                        className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-primary/10 text-primary border-none focus:ring-0 cursor-pointer"
                    >
                        <option value="elite">Elite Plan</option>
                        <option value="standard">Standard Plan</option>
                        <option value="basic">Basic Plan</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Stats */}
                <div className="space-y-4">
                  <h4 className="font-headline font-bold uppercase tracking-widest text-xs text-primary">Member Stats</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-surface-container-highest p-4 rounded-lg">
                      <div className="text-2xl font-black font-headline">
                        {attendance.filter(a => a.userId === selectedMember.uid).length}
                      </div>
                      <div className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Total Visits</div>
                    </div>
                    <div className="bg-surface-container-highest p-4 rounded-lg">
                      <div className="text-2xl font-black font-headline text-primary">
                        ₹{payments.filter(p => p.userId === selectedMember.uid && p.status === 'paid').reduce((sum, p) => sum + p.amount, 0).toLocaleString('en-IN')}
                      </div>
                      <div className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Total Paid</div>
                    </div>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="space-y-4">
                  <h4 className="font-headline font-bold uppercase tracking-widest text-xs text-primary">Recent Visits</h4>
                  <div className="space-y-2 max-h-[150px] overflow-y-auto pr-2 custom-scrollbar">
                    {attendance
                      .filter(a => a.userId === selectedMember.uid)
                      .slice(0, 5)
                      .map((record, i) => (
                        <div key={i} className="flex justify-between items-center p-2 bg-white/5 rounded text-xs">
                          <span className="text-on-surface font-medium">{format(new Date(record.timestamp), 'MMM dd, yyyy')}</span>
                          <span className="text-on-surface-variant">{format(new Date(record.timestamp), 'HH:mm')}</span>
                        </div>
                      ))}
                    {attendance.filter(a => a.userId === selectedMember.uid).length === 0 && (
                      <p className="text-xs text-on-surface-variant italic">No visits recorded yet.</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-white/5 flex gap-4">
                <button 
                  onClick={() => { setSelectedMember(null); setActiveTab('payments'); }}
                  className="flex-1 py-3 bg-surface-container-highest rounded-lg font-bold uppercase text-[10px] tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                >
                  <IndianRupee size={14} />
                  View Payments
                </button>
                <button 
                  onClick={() => { setSelectedMember(null); setActiveTab('attendance'); setAttendanceSearchTerm(selectedMember.email); }}
                  className="flex-1 py-3 bg-surface-container-highest rounded-lg font-bold uppercase text-[10px] tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                >
                  <Clock size={14} />
                  Full History
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* AI Insights View */}
      {activeTab === 'ai' && (
        <div className="space-y-8">
          {!hasElite ? (
            <TierLock requiredTier="elite" currentTier={currentTier} onUpgrade={() => setShowUpgradeModal(true)} />
          ) : (
            <>
              <div className="bg-surface-container-low p-8 rounded-2xl border border-white/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                  <BrainCircuit size={160} />
                </div>
                <div className="relative z-10 max-w-2xl">
                  <h3 className="font-headline font-black text-3xl uppercase italic mb-4">AI Business Intelligence</h3>
                  <p className="text-on-surface-variant mb-8">
                    Our AI analyzes your gym's real-time data to provide strategic insights on member retention, revenue growth, and operational efficiency.
                  </p>
                  <button 
                    onClick={handleGenerateAI}
                    disabled={generatingAI}
                    className="kinetic-gradient text-on-primary-fixed font-headline font-bold uppercase px-8 py-4 rounded-xl flex items-center gap-3 hover:opacity-90 active:scale-95 transition-all shadow-xl disabled:opacity-50"
                  >
                    {generatingAI ? <Loader2 className="animate-spin" /> : <Sparkles size={20} />}
                    {generatingAI ? 'Analyzing Data...' : 'Generate Strategic Insights'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {aiInsights.length > 0 ? (
                  aiInsights.map((insight, idx) => (
                    <motion.div 
                      key={idx}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="bg-surface-container-low p-6 rounded-xl border border-white/5 hover:bg-surface-container transition-colors group"
                    >
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform">
                        <BrainCircuit size={20} />
                      </div>
                      <h4 className="font-headline font-bold text-lg uppercase mb-2 group-hover:text-primary transition-colors">{insight.title}</h4>
                      <p className="text-sm text-on-surface-variant leading-relaxed">{insight.suggestion}</p>
                    </motion.div>
                  ))
                ) : !generatingAI && (
                  <div className="col-span-full py-20 text-center border-2 border-dashed border-white/5 rounded-2xl">
                    <p className="text-on-surface-variant italic">Click the button above to generate AI-powered insights for your gym.</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Analytics View */}
      {activeTab === 'analytics' && (
        <div className="space-y-8">
          {!hasPro ? (
            <TierLock requiredTier="professional" currentTier={currentTier} onUpgrade={() => setShowUpgradeModal(true)} />
          ) : (
            <>
              <div className="flex justify-end">
                <button 
                  onClick={() => navigate('/analytics')}
                  className="bg-primary/10 text-primary border border-primary/20 px-6 py-3 rounded-xl font-headline font-black uppercase tracking-widest text-xs flex items-center gap-2 hover:bg-primary/20 transition-all shadow-lg"
                >
                  <ArrowUpRight size={16} />
                  Open Global Advanced Dashboard
                </button>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Revenue Chart */}
            <div className="bg-surface-container-low p-6 rounded-xl border border-white/5">
              <div className="flex items-center gap-2 mb-6">
                <TrendingUp className="text-primary" size={20} />
                <h4 className="font-headline font-bold uppercase tracking-tight">Revenue Trends</h4>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueByMonth}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ff4d00" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#ff4d00" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                    <XAxis dataKey="month" stroke="#ffffff40" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#ffffff40" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value}`} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1a1a1a', border: 'none', borderRadius: '8px', fontSize: '12px' }}
                      itemStyle={{ color: '#ff4d00' }}
                    />
                    <Area type="monotone" dataKey="amount" stroke="#ff4d00" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={3} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Attendance Chart */}
            <div className="bg-surface-container-low p-6 rounded-xl border border-white/5">
              <div className="flex items-center gap-2 mb-6">
                <BarChart3 className="text-primary" size={20} />
                <h4 className="font-headline font-bold uppercase tracking-tight">Weekly Attendance</h4>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={attendanceByDay}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                    <XAxis dataKey="date" stroke="#ffffff40" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#ffffff40" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip 
                      cursor={{ fill: '#ffffff05' }}
                      contentStyle={{ backgroundColor: '#1a1a1a', border: 'none', borderRadius: '8px', fontSize: '12px' }}
                    />
                    <Bar dataKey="count" fill="#ff4d00" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Membership Distribution */}
            <div className="bg-surface-container-low p-6 rounded-xl border border-white/5 lg:col-span-1">
              <div className="flex items-center gap-2 mb-6">
                <PieChartIcon className="text-primary" size={20} />
                <h4 className="font-headline font-bold uppercase tracking-tight">Member Status</h4>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={membershipDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {membershipDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1a1a1a', border: 'none', borderRadius: '8px', fontSize: '12px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-4 mt-4">
                {membershipDistribution.map((item) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">{item.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Inactive Members (Churn Risk) */}
            <div className="bg-surface-container-low p-6 rounded-xl border border-white/5 lg:col-span-2">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="text-error" size={20} />
                  <h4 className="font-headline font-bold uppercase tracking-tight">Inactive Members (2+ Days)</h4>
                </div>
                <div className="flex gap-2">
                  {atRiskMembers.some(m => m.membershipStatus === 'active') && (
                    <button 
                      onClick={async () => {
                        const activeAtRisk = atRiskMembers.filter(m => m.membershipStatus === 'active');
                        for (const m of activeAtRisk) {
                          await updateStatus(m.uid, 'halted');
                        }
                        toast.success(`Halted ${activeAtRisk.length} inactive members`);
                      }}
                      className="bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-1 rounded text-[8px] font-black uppercase tracking-widest hover:bg-amber-500/20 transition-all"
                    >
                      Halt All
                    </button>
                  )}
                  <span className="text-[10px] font-black uppercase tracking-widest bg-error/10 text-error px-2 py-1 rounded">Churn Risk</span>
                </div>
              </div>
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {atRiskMembers.map((member) => {
                  const lastVisit = attendance.find(a => a.userId === member.uid);
                  return (
                    <div key={member.uid} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg overflow-hidden border border-white/10">
                          <img 
                            src={member.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.uid}`} 
                            alt="" 
                            className="w-full h-full object-cover" 
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div>
                          <div className="text-sm font-bold">{member.displayName || 'Anonymous'}</div>
                          <div className="text-[10px] text-on-surface-variant">
                            Last seen: {lastVisit ? format(new Date(lastVisit.timestamp), 'MMM dd') : 'Never'}
                          </div>
                        </div>
                      </div>
                      <button 
                        onClick={() => { setActiveTab('members'); setSearchTerm(member.email); }}
                        className="text-[10px] font-bold uppercase tracking-widest text-primary hover:underline"
                      >
                        Contact
                      </button>
                    </div>
                  );
                })}
                {atRiskMembers.length === 0 && (
                  <div className="text-center py-12 text-on-surface-variant text-sm italic">
                    All active members have visited recently. Great job!
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* System Health */}
          <div className="bg-surface-container-low p-6 rounded-xl border border-white/5">
            <div className="flex items-center gap-2 mb-6">
              <Activity className="text-primary" size={20} />
              <h4 className="font-headline font-bold uppercase tracking-tight">System Health</h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-white/5 rounded-lg">
                <div className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">Database</div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-sm font-bold">Operational</span>
                </div>
              </div>
              <div className="p-4 bg-white/5 rounded-lg">
                <div className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">Auth Service</div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-sm font-bold">Operational</span>
                </div>
              </div>
              <div className="p-4 bg-white/5 rounded-lg">
                <div className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">AI Engine</div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-sm font-bold">Operational</span>
                </div>
              </div>
            </div>
          </div>
          </>
          )}
        </div>
      )}

      {/* Member Management */}
      {activeTab === 'members' && (
        <section className="space-y-6">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
            <h3 className="font-headline text-xl font-bold uppercase tracking-tight">Member Directory</h3>
            <div className="flex flex-wrap gap-2 w-full md:w-auto">
              <button
                onClick={() => {
                  const link = `${window.location.origin}/memberlogin?gym=${profile?.gymId}`;
                  navigator.clipboard.writeText(link);
                  toast.success('Member Invite Link copied to clipboard!');
                }}
                className="bg-surface-container-highest text-on-surface border border-white/10 px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-2"
              >
                <Share2 size={16} />
                Invite Link
              </button>
              {members.some(m => m.membershipStatus === 'pending' || !m.membershipStatus) && (
                <button 
                  onClick={async () => {
                    const pending = members.filter(m => m.membershipStatus === 'pending' || !m.membershipStatus);
                    for (const m of pending) {
                      await updateStatus(m.uid, 'active');
                    }
                    toast.success(`Approved ${pending.length} members`);
                  }}
                  className="bg-green-500/10 text-green-500 border border-green-500/20 px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-green-500/20 transition-all"
                >
                  Approve All Pending
                </button>
              )}
              <div className="relative flex-1 md:w-48">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" size={18} />
                <input 
                  type="text" 
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-surface-container-highest border-none text-on-surface py-2 pl-10 pr-4 rounded-lg focus:ring-2 focus:ring-primary/40 text-sm"
                />
              </div>
              <button 
                onClick={() => setShowBulkImportModal(true)}
                className="bg-primary/20 text-primary border border-primary/20 px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-primary/30 transition-colors flex items-center gap-2 whitespace-nowrap"
              >
                <Download size={16} />
                Bulk Import
              </button>
              <button 
                onClick={() => {
                  const tier = gymInfo?.subscriptionTier || 'starter';
                  const limits: Record<string, number> = { starter: 150, professional: 500, elite: Infinity };
                  const maxMembers = limits[tier] || 150;
                  if (members.length >= maxMembers) {
                    toast.error(`Member limit reached for ${tier} plan (${maxMembers}). Please upgrade your plan.`);
                    return;
                  }
                  setShowAddMemberModal(true);
                }}
                className="bg-primary text-on-primary px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-primary/90 transition-colors flex items-center gap-2 whitespace-nowrap"
              >
                <Plus size={16} />
                Add Member
              </button>
            </div>
          </div>

          <div className="bg-surface-container-low rounded-lg overflow-hidden border border-white/5">
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-surface-container-highest/50 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                  <tr>
                    <th className="px-6 py-4">Member</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4">Joined</th>
                    <th className="px-6 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredMembers.filter(m => m.role === 'member').map((member) => (
                    <tr key={member.uid} className="hover:bg-white/5 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg overflow-hidden border border-white/10">
                            <img 
                              src={member.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.uid}`} 
                              alt="" 
                              className="w-full h-full object-cover" 
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          <div>
                            <div className="text-sm font-bold">{member.displayName || 'Anonymous'}</div>
                            <div className="text-[10px] text-on-surface-variant">{member.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded whitespace-nowrap",
                          member.membershipStatus === 'active' ? "bg-green-500/10 text-green-500" : 
                          member.membershipStatus === 'pre-registered' ? "bg-primary/20 text-primary border border-primary/20" :
                          member.membershipStatus === 'halted' ? "bg-amber-500/10 text-amber-500" :
                          member.membershipStatus === 'expired' ? "bg-error/10 text-error" : 
                          "bg-primary/10 text-primary"
                        )}>
                          {member.membershipStatus || 'pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs font-medium uppercase text-on-surface-variant">
                        {member.membershipType || 'Standard'}
                      </td>
                      <td className="px-6 py-4 text-xs text-on-surface-variant">
                        {member.createdAt ? format(new Date(member.createdAt), 'MMM dd, yyyy') : 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          {member.phoneNumber && (
                            <a
                              href={`https://wa.me/${member.phoneNumber.replace(/[^0-9]/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 hover:bg-green-500/10 text-on-surface-variant hover:text-green-500 rounded transition-colors"
                              title="Message via WhatsApp"
                            >
                              <MessageCircle size={18} />
                            </a>
                          )}
                          <button 
                            onClick={() => setSelectedMember(member)}
                            className="p-1.5 hover:bg-primary/10 text-on-surface-variant hover:text-primary rounded transition-colors"
                            title="View Details"
                          >
                            <Eye size={18} />
                          </button>
                          {member.membershipStatus !== 'pre-registered' && (
                            <>
                              <button 
                                onClick={() => updateStatus(member.uid, 'active')}
                                className="p-1.5 hover:bg-green-500/10 text-on-surface-variant hover:text-green-500 rounded transition-colors"
                                title={member.membershipStatus === 'halted' ? "Reactivate Membership" : "Activate Membership"}
                              >
                                {member.membershipStatus === 'halted' ? <CheckCircle size={18} className="text-amber-500" /> : <CheckCircle size={18} />}
                              </button>
                              <button 
                                onClick={() => updateStatus(member.uid, 'halted')}
                                className="p-1.5 hover:bg-amber-500/10 text-on-surface-variant hover:text-amber-500 rounded transition-colors"
                                title="Suspend Membership"
                              >
                                <Lock size={18} />
                              </button>
                              <button 
                                onClick={() => updateStatus(member.uid, 'expired')}
                                className="p-1.5 hover:bg-error/10 text-on-surface-variant hover:text-error rounded transition-colors"
                                title="Expire Membership"
                              >
                                <XCircle size={18} />
                              </button>
                              <button 
                                onClick={async () => {
                                  if (window.confirm('Are you sure you want to permanently remove this member?')) {
                                    try {
                                  await deleteDoc(doc(db, 'users', member.uid));
                                  toast.success('Member removed');
                                } catch(e) {
                                  toast.error('Failed to remove member');
                                }
                              }
                            }}
                            className="p-1.5 hover:bg-error/10 text-error/50 hover:text-error rounded transition-colors"
                            title="Remove Member"
                          >
                            <Trash2 size={18} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-white/5">
              {filteredMembers.filter(m => m.role === 'member').map((member) => (
                <div key={member.uid} className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg overflow-hidden border border-white/10">
                        <img 
                          src={member.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.uid}`} 
                          alt="" 
                          className="w-full h-full object-cover" 
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div>
                        <div className="text-sm font-bold">{member.displayName || 'Anonymous'}</div>
                        <div className="text-[10px] text-on-surface-variant">{member.email}</div>
                      </div>
                    </div>
                    <span className={cn(
                      "text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded whitespace-nowrap",
                      member.membershipStatus === 'active' ? "bg-green-500/10 text-green-500" : 
                      member.membershipStatus === 'pre-registered' ? "bg-primary/20 text-primary border border-primary/20" :
                      member.membershipStatus === 'halted' ? "bg-amber-500/10 text-amber-500" :
                      member.membershipStatus === 'expired' ? "bg-error/10 text-error" : 
                      "bg-primary/10 text-primary"
                    )}>
                      {member.membershipStatus || 'pending'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <div className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest">
                      {member.membershipType || 'Standard'} • Joined {member.createdAt ? format(new Date(member.createdAt), 'MMM dd') : 'N/A'}
                    </div>
                    <div className="flex gap-2">
                      {member.phoneNumber && (
                        <a
                          href={`https://wa.me/${member.phoneNumber.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 bg-green-500/10 text-green-500 rounded flex items-center justify-center"
                        >
                          <MessageCircle size={18} />
                        </a>
                      )}
                      <button 
                        onClick={() => setSelectedMember(member)}
                        className="p-2 bg-primary/10 text-primary rounded"
                      >
                        <Eye size={18} />
                      </button>
                      {member.membershipStatus !== 'pre-registered' && (
                        <>
                          <button 
                            onClick={() => updateStatus(member.uid, 'active')}
                            className="p-2 bg-green-500/10 text-green-500 rounded"
                          >
                            <CheckCircle size={18} />
                          </button>
                          <button 
                            onClick={() => updateStatus(member.uid, 'halted')}
                            className="p-2 bg-amber-500/10 text-amber-500 rounded"
                          >
                            <Lock size={18} />
                          </button>
                          <button 
                            onClick={() => updateStatus(member.uid, 'expired')}
                            className="p-2 bg-error/10 text-error rounded"
                          >
                            <XCircle size={18} />
                          </button>
                          <button 
                            onClick={async () => {
                              if (window.confirm('Are you sure you want to permanently remove this member?')) {
                                try {
                                  await deleteDoc(doc(db, 'users', member.uid));
                                  toast.success('Member removed');
                                } catch(e) {
                                  toast.error('Failed to remove member');
                                }
                              }
                            }}
                            className="p-2 bg-error/10 text-error/50 rounded"
                          >
                            <Trash2 size={18} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Equipment Management */}
      {activeTab === 'equipment' && (
        <section>
          <MachineManagementTab profile={profile} gymInfo={gymInfo} />
        </section>
      )}

      {/* Payment Management */}
      {activeTab === 'payments' && (
        <section>
          <PaymentsManagementTab profile={profile} gymInfo={gymInfo} exportToCSV={exportToCSV} />
        </section>
      )}

      {/* Attendance History */}
      {activeTab === 'attendance' && (
        <section className="space-y-6">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
            <h3 className="font-headline text-xl font-bold uppercase tracking-tight">Attendance History</h3>
            <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
              <button 
                onClick={() => exportToCSV(attendance, 'attendance_history')}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-surface-container-highest rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 transition-all"
              >
                <Download size={14} />
                Export CSV
              </button>
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" size={18} />
                <input 
                  type="text" 
                  placeholder="Search member..."
                  value={attendanceSearchTerm}
                  onChange={(e) => setAttendanceSearchTerm(e.target.value)}
                  className="w-full bg-surface-container-highest border-none text-on-surface py-2 pl-10 pr-4 rounded-lg focus:ring-2 focus:ring-primary/40 text-sm"
                />
              </div>
              <div className="relative flex-1 sm:w-48">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" size={18} />
                <input 
                  type="date" 
                  value={attendanceDateFilter}
                  onChange={(e) => setAttendanceDateFilter(e.target.value)}
                  className="w-full bg-surface-container-highest border-none text-on-surface py-2 pl-10 pr-4 rounded-lg focus:ring-2 focus:ring-primary/40 text-sm"
                />
              </div>
              {(attendanceSearchTerm || attendanceDateFilter) && (
                <button 
                  onClick={() => { setAttendanceSearchTerm(''); setAttendanceDateFilter(''); }}
                  className="text-xs font-bold uppercase text-primary hover:underline"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          <div className="bg-surface-container-low rounded-lg overflow-hidden border border-white/5">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-surface-container-highest/50 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                  <tr>
                    <th className="px-6 py-4">Member</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Time</th>
                    <th className="px-6 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {attendance
                    .filter(record => {
                      const member = members.find(m => m.uid === record.userId);
                      const matchesSearch = !attendanceSearchTerm || 
                        member?.displayName?.toLowerCase().includes(attendanceSearchTerm.toLowerCase()) ||
                        member?.email.toLowerCase().includes(attendanceSearchTerm.toLowerCase());
                      
                      const recordDate = format(new Date(record.timestamp), 'yyyy-MM-dd');
                      const matchesDate = !attendanceDateFilter || recordDate === attendanceDateFilter;
                      
                      return matchesSearch && matchesDate;
                    })
                    .map((record) => {
                      const member = members.find(m => m.uid === record.userId);
                      return (
                        <tr key={record.id} className="hover:bg-white/5 transition-colors group">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg overflow-hidden border border-white/10">
                                <img 
                                  src={member?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${record.userId}`} 
                                  alt="" 
                                  className="w-full h-full object-cover" 
                                  referrerPolicy="no-referrer"
                                />
                              </div>
                              <div>
                                <div className="text-sm font-bold">{member?.displayName || 'Unknown Member'}</div>
                                <div className="text-[10px] text-on-surface-variant">{member?.email || 'N/A'}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm font-medium">
                            {format(new Date(record.timestamp), 'MMM dd, yyyy')}
                          </td>
                          <td className="px-6 py-4 text-sm text-on-surface-variant">
                            {format(new Date(record.timestamp), 'HH:mm:ss')}
                          </td>
                          <td className="px-6 py-4">
                            {record.isDuplicate ? (
                              <div className="flex flex-col">
                                <span className="bg-amber-500/10 text-amber-500 text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded w-fit">
                                  Re-entry ({record.entryCount})
                                </span>
                                <span className="text-[8px] text-amber-500/60 font-bold uppercase mt-1">Duplicate Entry</span>
                              </div>
                            ) : (
                              <span className="bg-green-500/10 text-green-500 text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded">
                                Checked In
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  {attendance.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-on-surface-variant text-sm">
                        No attendance records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* Announcements Management */}
      {activeTab === 'announcements' && (
        <AnnouncementsManagementTab profile={profile} gymInfo={gymInfo} />
      )}

      {/* Leaderboard */}
      {activeTab === 'leaderboard' && (
        <section className="h-[80vh] overflow-y-auto">
          <Challenges profile={profile} />
        </section>
      )}

      {/* Gym Settings for Owners / System Settings for Admins */}
      {activeTab === 'settings' && (
        <section className="space-y-12">
          <div className="bg-surface-container-low p-8 rounded-2xl border border-white/5">
            <div className="flex flex-col md:flex-row md:items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                {profile?.role === 'admin' ? <Globe size={24} className="text-primary" /> : <Building2 size={24} className="text-primary" />}
              </div>
              <div>
                <h3 className="font-headline font-black text-3xl uppercase italic">
                  {profile?.role === 'admin' ? 'System Configuration' : 'Gym Profile'}
                </h3>
                <p className="text-on-surface-variant text-sm">
                  {profile?.role === 'admin' 
                    ? 'Manage global application parameters and access URLs.' 
                    : 'Configure your establishment details and member access.'}
                </p>
              </div>
            </div>

            {(profile?.role === 'owner' || profile?.role === 'admin') && gymInfo && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
                <div className="space-y-6">
                  <div className="bg-primary/5 p-6 rounded-2xl border border-primary/20">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-4">Establishment Identity</h4>
                    <div className="space-y-4">
                      
                      <div className="bg-background/40 p-4 rounded-xl border border-white/5 mb-4">
                        <p className="text-[8px] font-black text-outline uppercase tracking-widest mb-1">Current Plan</p>
                        <div className="flex items-center gap-2">
                          <span className="font-headline font-black text-lg text-primary uppercase italic">{gymInfo.subscriptionTier || 'Starter'}</span>
                        </div>
                        <button
                          onClick={() => setShowUpgradeModal(true)}
                          className="mt-3 bg-surface-container-high hover:bg-surface-container-highest px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors inline-block text-on-surface border border-white/5"
                        >
                          Upgrade Plan
                        </button>
                      </div>

                      <div className="flex justify-between items-center bg-background/40 p-4 rounded-xl border border-white/5">
                        <div>
                          <p className="text-[8px] font-black text-outline uppercase tracking-widest mb-1">Unique Gym Identifier</p>
                          <p className="font-mono text-lg font-bold text-white tracking-widest">{gymInfo.id}</p>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => {
                              navigator.clipboard.writeText(gymInfo.id);
                              toast.success('Gym ID copied to clipboard');
                            }}
                            className="p-2 hover:bg-primary/10 rounded-lg text-primary transition-colors hover-scale"
                            title="Copy Gym ID"
                          >
                            <Copy size={20} />
                          </button>
                        </div>
                      </div>

                      <div className="flex justify-between items-center bg-background/40 p-4 rounded-xl border border-white/5">
                        <div>
                          <p className="text-[8px] font-black text-outline uppercase tracking-widest mb-1">Member Login Link</p>
                          <p className="font-mono text-[10px] sm:text-xs text-on-surface-variant truncate max-w-[200px] sm:max-w-xs">{`${window.location.origin}/memberlogin?gym=${gymInfo.id}`}</p>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => {
                              const link = `${window.location.origin}/memberlogin?gym=${gymInfo.id}`;
                              navigator.clipboard.writeText(link);
                              toast.success('Member Login Link copied to clipboard');
                            }}
                            className="p-2 hover:bg-primary/10 rounded-lg text-primary transition-colors hover-scale"
                            title="Copy Member Login Link"
                          >
                            <Copy size={20} />
                          </button>
                          <button 
                            onClick={() => {
                              const link = `${window.location.origin}/memberlogin?gym=${gymInfo.id}`;
                              window.open(link, '_blank');
                            }}
                            className="p-2 hover:bg-primary/10 rounded-lg text-primary transition-colors hover-scale"
                            title="Open Member Login Link"
                          >
                            <ArrowUpRight size={20} />
                          </button>
                        </div>
                      </div>
                      <p className="text-[10px] text-on-surface-variant font-medium leading-relaxed italic">
                        Share this unique ID with your members so they can join your establishment's virtual portal.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-surface-container-highest p-6 rounded-2xl border border-white/5 space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant mb-2 ml-1">Gym Metadata</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[8px] font-bold text-outline-variant uppercase tracking-widest mb-2 ml-1">Gym Display Name</label>
                      <input 
                        type="text" 
                        defaultValue={gymInfo.name}
                        onBlur={async (e) => {
                          if (e.target.value && e.target.value !== gymInfo.name) {
                            try {
                              await updateDoc(doc(db, 'gyms', gymInfo.id), { name: e.target.value });
                              toast.success('Gym name updated');
                            } catch (error) {
                              toast.error('Failed to update name');
                            }
                          }
                        }}
                        className="w-full bg-background border border-white/5 rounded-xl py-3 px-4 text-sm font-bold focus:border-primary/50 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] font-bold text-outline-variant uppercase tracking-widest mb-2 ml-1">Gym Access Code (Optional)</label>
                      <input 
                        type="text" 
                        defaultValue={gymInfo.inviteCode || ''}
                        onBlur={async (e) => {
                          if (e.target.value !== gymInfo.inviteCode) {
                            try {
                              await updateDoc(doc(db, 'gyms', gymInfo.id), { inviteCode: e.target.value });
                              toast.success('Access code updated');
                            } catch (error) {
                              toast.error('Failed to update access code');
                            }
                          }
                        }}
                        className="w-full bg-background border border-white/5 rounded-xl py-3 px-4 text-sm font-bold focus:border-primary/50 outline-none"
                        placeholder="e.g. JOINMEM2024"
                      />
                      <p className="text-[10px] text-on-surface-variant mt-1 ml-1">Members using this code get instant approval.</p>
                    </div>
                    <div>
                      <label className="block text-[8px] font-bold text-outline-variant uppercase tracking-widest mb-2 ml-1">Physical Address</label>
                      <input 
                        type="text" 
                        defaultValue={gymInfo.address}
                        onBlur={async (e) => {
                          if (e.target.value !== gymInfo.address) {
                            try {
                              await updateDoc(doc(db, 'gyms', gymInfo.id), { address: e.target.value });
                              toast.success('Address updated');
                            } catch (error) {
                              toast.error('Failed to update address');
                            }
                          }
                        }}
                        className="w-full bg-background border border-white/5 rounded-xl py-3 px-4 text-sm font-bold focus:border-primary/50 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] font-bold text-outline-variant uppercase tracking-widest mb-2 ml-1">Gym Phone Number</label>
                      <input 
                        type="tel" 
                        defaultValue={gymInfo.phone || ''}
                        onBlur={async (e) => {
                          if (e.target.value !== gymInfo.phone) {
                            try {
                              await updateDoc(doc(db, 'gyms', gymInfo.id), { phone: e.target.value });
                              toast.success('Phone updated');
                            } catch (error) {
                              toast.error('Failed to update phone');
                            }
                          }
                        }}
                        className="w-full bg-background border border-white/5 rounded-xl py-3 px-4 text-sm font-bold focus:border-primary/50 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] font-bold text-outline-variant uppercase tracking-widest mb-2 ml-1">Gym Open Timings</label>
                      <input 
                        type="text" 
                        defaultValue={gymInfo.openTimings || ''}
                        onBlur={async (e) => {
                          if (e.target.value !== gymInfo.openTimings) {
                            try {
                              await updateDoc(doc(db, 'gyms', gymInfo.id), { openTimings: e.target.value });
                              toast.success('Open timings updated');
                            } catch (error) {
                              toast.error('Failed to update open timings');
                            }
                          }
                        }}
                        className="w-full bg-background border border-white/5 rounded-xl py-3 px-4 text-sm font-bold focus:border-primary/50 outline-none"
                        placeholder="e.g. 06:00 AM - 10:00 PM (Mon-Sat)"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    <div>
                      <label className="block text-[8px] font-bold text-outline-variant uppercase tracking-widest mb-2 ml-1">Branches</label>
                      <input 
                        type="number" 
                        defaultValue={gymInfo.branches || 1}
                        onBlur={async (e) => {
                          if (Number(e.target.value) !== gymInfo.branches) {
                            try {
                              await updateDoc(doc(db, 'gyms', gymInfo.id), { branches: Number(e.target.value) });
                              toast.success('Branches updated');
                            } catch (error) {
                              toast.error('Failed to update branches');
                            }
                          }
                        }}
                        className="w-full bg-background border border-white/5 rounded-xl py-3 px-4 text-sm font-bold focus:border-primary/50 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] font-bold text-outline-variant uppercase tracking-widest mb-2 ml-1">Expected Members</label>
                      <input 
                        type="number" 
                        defaultValue={gymInfo.expectedMembers || 50}
                        onBlur={async (e) => {
                          if (Number(e.target.value) !== gymInfo.expectedMembers) {
                            try {
                              await updateDoc(doc(db, 'gyms', gymInfo.id), { expectedMembers: Number(e.target.value) });
                              toast.success('Expected members updated');
                            } catch (error) {
                              toast.error('Failed to update expected members');
                            }
                          }
                        }}
                        className="w-full bg-background border border-white/5 rounded-xl py-3 px-4 text-sm font-bold focus:border-primary/50 outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-surface-container p-6 rounded-2xl border border-white/5 text-center">
                <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-1">Total Members</p>
                <p className="text-3xl font-headline font-black text-white">{members.length}</p>
              </div>
               <div className="bg-surface-container p-6 rounded-2xl border border-white/5 text-center">
                <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-1">Membership Plans</p>
                <p className="text-3xl font-headline font-black text-white">{tiers.length || 3}</p>
              </div>
            </div>

            {(profile?.role === 'admin' || profile?.role === 'owner') && (
              <div className="bg-surface-container rounded-3xl p-8 border border-white/5">
                <div className="space-y-6">
                  <div>
                    <h3 className="font-headline font-black text-xl italic uppercase tracking-tight">Personal Details</h3>
                    <p className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold">Update your owner profile</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[8px] font-bold text-outline-variant uppercase tracking-widest mb-2 ml-1">Full Name</label>
                      <input 
                        type="text" 
                        defaultValue={profile.displayName}
                        onBlur={async (e) => {
                          if (e.target.value && e.target.value !== profile.displayName) {
                            try {
                              await updateDoc(doc(db, 'users', profile.uid), { displayName: e.target.value });
                              toast.success('Name updated');
                            } catch (error) {
                              toast.error('Failed to update name');
                            }
                          }
                        }}
                        className="w-full bg-background border border-white/5 rounded-xl py-3 px-4 text-sm font-bold focus:border-primary/50 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] font-bold text-outline-variant uppercase tracking-widest mb-2 ml-1">Phone Number</label>
                      <input 
                        type="tel" 
                        defaultValue={profile.phoneNumber}
                        onBlur={async (e) => {
                          if (e.target.value !== profile.phoneNumber) {
                            try {
                              await updateDoc(doc(db, 'users', profile.uid), { phoneNumber: e.target.value });
                              toast.success('Phone number updated');
                            } catch (error) {
                              toast.error('Failed to update phone number');
                            }
                          }
                        }}
                        className="w-full bg-background border border-white/5 rounded-xl py-3 px-4 text-sm font-bold focus:border-primary/50 outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-12 border-t border-white/5 max-w-full">
              <div className="flex justify-between items-center px-1 mb-8">
                <div>
                  <h3 className="font-headline font-black text-2xl uppercase italic tracking-tight">Membership Architecture</h3>
                  <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest">Define access levels and benefits per tier</p>
                </div>
                <button 
                  onClick={() => {
                    setEditingTier({
                      name: '',
                      price: 0,
                      benefits: ['Gym Access'],
                      accessLevel: 1
                    });
                    setShowTierModal(true);
                  }}
                  className="bg-primary text-on-primary px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-primary/90 transition-colors flex items-center gap-2"
                >
                  <Plus size={16} /> Add Custom Plan
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {(tiers.length > 0 ? tiers : [{id: 'elite', name: 'Elite', price: 4999, benefits: ['Full Access', 'Personal Training (2/mo)', 'Priority Booking', 'Locker Access'], accessLevel: 3}, {id: 'standard', name: 'Standard', price: 2499, benefits: ['Full Access', 'Group Classes', 'Standard Support'], accessLevel: 2}, {id: 'basic', name: 'Basic', price: 999, benefits: ['Gym Access (Off-peak)', 'Basic App Tracking'], accessLevel: 1}]).map((tier) => (
                  <div key={tier.id} className="bg-surface-container-highest rounded-3xl border border-white/5 overflow-hidden group hover:border-primary/20 transition-all flex flex-col">
                    <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                      <h4 className="font-headline font-black text-2xl uppercase italic">{tier.name}</h4>
                      <Dumbbell className={cn(
                        "text-primary group-hover:scale-110 transition-transform",
                        tier.name.toLowerCase().includes('elite') ? "text-yellow-500" : tier.name.toLowerCase().includes('standard') ? "text-primary" : "text-on-surface-variant"
                      )} />
                    </div>
                    <div className="p-8 flex-1 space-y-6">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-headline font-black">₹{tier.price}</span>
                        <span className="text-[10px] font-bold uppercase text-on-surface-variant">/ Plan</span>
                      </div>
                      
                      <div className="space-y-3">
                        <p className="text-[10px] font-black uppercase tracking-widest text-primary">Key Benefits</p>
                        <ul className="space-y-2">
                          {(tier.benefits || ['Gym Access']).map((b, i) => (
                            <li key={i} className="flex items-center gap-2 text-xs text-on-surface-variant">
                              <CheckCircle size={14} className="text-green-500 shrink-0" />
                              {b}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="pt-4 mt-auto">
                          <button 
                            onClick={() => {
                              setEditingTier(tier);
                              setShowTierModal(true);
                            }}
                            className="w-full py-3 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-on-surface-variant transition-all"
                          >
                            Modify Tier Data
                          </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Tier Modal */}
      <AnimatePresence>
        {showTierModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowTierModal(false)}
              className="absolute inset-0 bg-background/90 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-surface-container p-8 rounded-xl max-w-lg w-full shadow-2xl border border-white/5"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-headline font-black text-2xl uppercase italic">{editingTier?.id ? 'Modify Tier Plan' : 'Add Custom Plan'}</h3>
                <button onClick={() => setShowTierModal(false)}>
                  <X size={24} className="text-on-surface-variant" />
                </button>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-primary mb-2">Plan Name</label>
                  <input 
                    type="text"
                    value={editingTier?.name || ''}
                    onChange={(e) => setEditingTier(prev => prev ? { ...prev, name: e.target.value } : null)}
                    className="w-full bg-surface-container-highest border-none text-on-surface py-3 px-4 rounded-lg focus:ring-2 focus:ring-primary/40"
                    placeholder="e.g. 6 Months Plan"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-primary mb-2">Price (₹)</label>
                  <input 
                    type="number"
                    value={editingTier?.price || 0}
                    onChange={(e) => setEditingTier(prev => prev ? { ...prev, price: parseFloat(e.target.value) } : null)}
                    className="w-full bg-surface-container-highest border-none text-on-surface py-3 px-4 rounded-lg focus:ring-2 focus:ring-primary/40"
                  />
                </div>
                
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-primary mb-2">Benefits (comma separated)</label>
                  <input 
                    type="text"
                    defaultValue={editingTier?.benefits?.join(', ') || ''}
                    onChange={(e) => setEditingTier(prev => prev ? { ...prev, benefits: e.target.value.split(',').map(b => b.trim()).filter(Boolean) } : null)}
                    className="w-full bg-surface-container-highest border-none text-on-surface py-3 px-4 rounded-lg focus:ring-2 focus:ring-primary/40"
                    placeholder="E.g. Gym Access, 2 Personal Trainings, Locker"
                  />
                </div>
                
                <button 
                  onClick={() => {
                    if (editingTier && editingTier.name && editingTier.price !== undefined) {
                      addTier({
                        id: editingTier.id || `custom-${Date.now()}`,
                        name: editingTier.name,
                        price: editingTier.price,
                        benefits: editingTier.benefits || ['Gym Access'],
                        accessLevel: editingTier.accessLevel || 1,
                        gymId: profile?.gymId
                      } as MembershipTier);
                      setShowTierModal(false);
                    } else {
                      toast.error('Please enter name and price');
                    }
                  }}
                  className="w-full py-4 bg-primary text-on-primary-fixed rounded-xl font-bold uppercase tracking-widest text-sm hover:opacity-90 transition-all"
                >
                  Save Tier Plan
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAddMemberModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-surface-container rounded-3xl w-full max-w-lg overflow-hidden border border-white/10"
            >
              <div className="flex justify-between items-center p-6 border-b border-white/5 bg-surface-container-high">
                <h2 className="font-headline text-xl font-bold uppercase italic tracking-tight flex items-center gap-2">
                  <Plus size={24} className="text-primary" />
                  Add New Member
                </h2>
                <button 
                  onClick={() => setShowAddMemberModal(false)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-6">
                <form onSubmit={handleAddMember} className="space-y-4">
                  {profile?.role === 'admin' && (
                    <div>
                      <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.2em] mb-2 ml-1 text-xs text-primary">Gym ID (System Admin Only)</label>
                      <input 
                        type="text" 
                        required
                        value={addMemberForm.gymId}
                        onChange={(e) => setAddMemberForm({...addMemberForm, gymId: e.target.value})}
                        className="w-full bg-surface-container-highest border border-primary/30 text-white py-3 px-4 rounded-xl focus:ring-2 focus:ring-primary/50 font-mono text-sm"
                        placeholder="GYM-12345"
                      />
                    </div>
                  )}
                  <div>
                    <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.2em] mb-2 ml-1 text-xs">Full Name</label>
                    <input 
                      type="text" 
                      required
                      value={addMemberForm.name}
                      onChange={(e) => setAddMemberForm({...addMemberForm, name: e.target.value})}
                      className="w-full bg-surface-container-highest border-none text-white py-3 px-4 rounded-xl focus:ring-2 focus:ring-primary/50"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.2em] mb-2 ml-1 text-xs">Email Address (Optional)</label>
                    <input 
                      type="email" 
                      value={addMemberForm.email}
                      onChange={(e) => setAddMemberForm({...addMemberForm, email: e.target.value})}
                      className="w-full bg-surface-container-highest border-none text-white py-3 px-4 rounded-xl focus:ring-2 focus:ring-primary/50"
                      placeholder="john@example.com"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.2em] mb-2 ml-1 text-xs">Phone Number</label>
                      <input 
                        type="tel" 
                        value={addMemberForm.phone}
                        onChange={(e) => setAddMemberForm({...addMemberForm, phone: e.target.value})}
                        className="w-full bg-surface-container-highest border-none text-white py-3 px-4 rounded-xl focus:ring-2 focus:ring-primary/50"
                        placeholder="+1 234 567 8900"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.2em] mb-2 ml-1 text-xs">Membership Tier</label>
                      <select
                        required
                        value={addMemberForm.tier}
                        onChange={(e) => setAddMemberForm({...addMemberForm, tier: e.target.value})}
                        className="w-full bg-surface-container-highest border-none text-white py-3 px-4 rounded-xl focus:ring-2 focus:ring-primary/50 appearance-none"
                      >
                        <option value="">Select a tier...</option>
                        {tiers.length > 0 ? tiers.map(t => (
                          <option key={t.id} value={t.name}>{t.name}</option>
                        )) : (
                          <>
                            <option value="basic">Basic</option>
                            <option value="standard">Standard</option>
                            <option value="elite">Elite</option>
                          </>
                        )}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.2em] mb-2 ml-1 text-xs">Weight (kg)</label>
                      <input 
                        type="number" 
                        value={addMemberForm.weight}
                        onChange={(e) => setAddMemberForm({...addMemberForm, weight: e.target.value})}
                        className="w-full bg-surface-container-highest border-none text-white py-3 px-4 rounded-xl focus:ring-2 focus:ring-primary/50"
                        placeholder="75"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.2em] mb-2 ml-1 text-xs">Height</label>
                      <input 
                        type="text" 
                        value={addMemberForm.height}
                        onChange={(e) => setAddMemberForm({...addMemberForm, height: e.target.value})}
                        className="w-full bg-surface-container-highest border-none text-white py-3 px-4 rounded-xl focus:ring-2 focus:ring-primary/50"
                        placeholder="180cm / 5'11"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.2em] mb-2 ml-1 text-xs">Fitness Goal</label>
                    <input 
                      type="text" 
                      value={addMemberForm.goal}
                      onChange={(e) => setAddMemberForm({...addMemberForm, goal: e.target.value})}
                      className="w-full bg-surface-container-highest border-none text-white py-3 px-4 rounded-xl focus:ring-2 focus:ring-primary/50"
                      placeholder="e.g. Muscle Gain, Weight Loss"
                    />
                  </div>
                  <div className="pt-4 flex gap-3">
                    <button 
                      type="button"
                      onClick={() => setShowAddMemberModal(false)}
                      className="flex-1 py-3 px-4 rounded-xl font-bold uppercase tracking-widest text-xs border border-white/10 hover:bg-white/5 transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      disabled={addingMember || !addMemberForm.name || !addMemberForm.tier}
                      className="flex-1 py-3 px-4 rounded-xl font-bold uppercase tracking-widest text-xs kinetic-gradient text-on-primary-fixed disabled:opacity-50 hover-scale"
                    >
                      {addingMember ? 'Adding...' : 'Add Member'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bulk Import Modal */}
      <AnimatePresence>
        {showBulkImportModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-background/90 backdrop-blur-md">
            <div className="relative w-full max-w-4xl bg-surface-container border border-white/5 shadow-2xl rounded-2xl max-h-[90vh] overflow-y-auto">
              <button 
                onClick={() => setShowBulkImportModal(false)}
                className="absolute top-4 right-4 p-2 bg-surface-container-high hover:bg-surface-container-highest rounded-full transition-colors text-on-surface z-10"
              >
                <X size={20} />
              </button>
              <div className="p-6">
                <BulkMemberImport gymId={profile?.gymId} onSuccess={() => setShowBulkImportModal(false)} />
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

