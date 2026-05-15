import React, { useState, useEffect } from 'react';
import { auth, db } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { doc, updateDoc, onSnapshot, collection, query, where } from 'firebase/firestore';
import { UserProfile, MembershipTier } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { User, CreditCard, Award, Bell, Mail, Lock, Fingerprint, Globe, Ruler, LogOut, Edit2, ChevronRight, X, Loader2, Shield, QrCode, UserCircle, Share2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { Link } from 'react-router-dom';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';
import { QRCodeSVG } from 'qrcode.react';
import { SEO } from '../components/SEO';
import { toast } from 'sonner';
import { HelpCircle, Info, FileText } from 'lucide-react';
import { TermsModal } from '../components/TermsModal';

export default function SettingsPage({ profile }: { profile: UserProfile | null }) {
  const [saving, setSaving] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [tiers, setTiers] = useState<MembershipTier[]>([]);

  const handleLogout = () => {
    signOut(auth);
  };

  const [showMembershipCard, setShowMembershipCard] = useState(false);
  const [showSubscriptionDetails, setShowSubscriptionDetails] = useState(false);
  const [showMobileTest, setShowMobileTest] = useState(false);
  const [publicUrl, setPublicUrl] = useState(window.location.origin);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'system_settings', 'config'), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data.publicUrl) setPublicUrl(data.publicUrl);
      }
    }, (error) => {
      setTimeout(() => {
        handleFirestoreError(error, OperationType.GET, 'system_settings/config');
      }, 0);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!profile?.gymId) return;
    const q = query(collection(db, 'membershipTiers'), where('gymId', '==', profile.gymId));
    const unsub = onSnapshot(q, (snapshot) => {
      setTiers(snapshot.docs.map(d => ({id: d.id, ...d.data()}) as MembershipTier));
    });
    return () => unsub();
  }, [profile?.gymId]);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'MustGym',
          text: 'Join the elite fitness community at MustGym by Regulus Labs!',
          url: window.location.origin,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      navigator.clipboard.writeText(window.location.origin);
      toast.success('App link copied to clipboard!');
    }
  };

  const sections = [
    {
      title: 'App Distribution',
      items: [
        { icon: Share2, label: 'Share App', description: 'Invite others to join the studio', onClick: handleShare },
      ]
    },
    {
      title: 'Membership',
      items: [
        { icon: CreditCard, label: 'Digital Membership Card', onClick: () => setShowMembershipCard(true) },
        { icon: Award, label: 'Subscription Details', value: profile?.membershipType?.toUpperCase() || 'STANDARD', onClick: () => setShowSubscriptionDetails(true) },
      ]
    },
    {
      title: 'Account',
      items: [
        { icon: UserCircle, label: 'Elite Identity', description: 'Customize your avatar & symbols', link: '/profile' },
        { icon: Bell, label: 'Notification Settings', description: 'Manage workout alerts' },
      ]
    },
    {
      title: 'Support',
      items: [
        { icon: HelpCircle, label: 'Help Center', description: 'FAQs and tutorials' },
        { icon: FileText, label: 'Terms & Conditions', onClick: () => setShowTerms(true) },
        { icon: Info, label: 'About MustGym', value: 'v2.0.4' },
      ]
    }
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-10 pb-20">
      <SEO title="Settings" />
      <TermsModal isOpen={showTerms} onClose={() => setShowTerms(false)} />
      {/* Profile Header Section */}
      <section>
        <div className="flex items-center gap-6 p-6 bg-surface-container-low rounded-lg border border-white/5">
          <div className="relative">
            <Link to="/profile" className="block">
              <div className="w-20 h-20 rounded-lg overflow-hidden border-2 border-primary/30 hover:border-primary transition-colors">
                <img 
                  src={profile?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.uid}`} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            </Link>
            <Link 
              to="/profile"
              className="absolute -bottom-1 -right-1 bg-primary p-1.5 rounded-sm shadow-lg hover:scale-110 transition-transform"
            >
              <Edit2 size={14} className="text-on-primary" />
            </Link>
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight text-on-surface">{profile?.displayName || 'Elite Member'}</h1>
            <div className="flex gap-2 mt-1">
              <div className="inline-flex items-center px-2 py-0.5 bg-primary/10 rounded text-primary text-[10px] font-black uppercase tracking-[0.1em]">
                {profile?.membershipType || 'ELITE MEMBER'}
              </div>
              <div className="inline-flex items-center px-2 py-0.5 bg-surface-container-highest rounded text-on-surface-variant text-[10px] font-black uppercase tracking-[0.1em]">
                {profile?.role || 'MEMBER'}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Membership Card Modal */}
      <AnimatePresence>
        {showMembershipCard && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMembershipCard(false)}
              className="absolute inset-0 bg-background/90 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-surface-container p-8 rounded-xl max-w-sm w-full shadow-2xl border border-white/5 text-center"
            >
              <button 
                onClick={() => setShowMembershipCard(false)}
                className="absolute top-4 right-4 text-on-surface-variant hover:text-on-surface"
              >
                <X size={24} />
              </button>

              <div className="mb-6">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <QrCode size={32} className="text-primary" />
                </div>
                <h3 className="font-headline font-black text-2xl uppercase italic">Membership Card</h3>
                <p className="text-xs text-on-surface-variant mt-1">Scan at the front desk for entry</p>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-inner border-4 border-neutral-100 mb-6 inline-block">
                <QRCodeSVG value={profile?.uid || 'anonymous'} size={180} />
              </div>

              <div className="space-y-2">
                <p className="text-sm font-bold uppercase tracking-widest">{profile?.displayName || 'Elite Member'}</p>
                <p className="text-[10px] text-on-surface-variant font-medium tracking-[0.2em] uppercase">ID: {profile?.uid.slice(0, 8)}...</p>
              </div>

              <div className="mt-8 pt-6 border-t border-white/5">
                <div className={cn(
                  "inline-flex items-center px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest",
                  profile?.membershipStatus === 'active' ? "bg-green-500/10 text-green-500" : "bg-error/10 text-error"
                )}>
                  Status: {profile?.membershipStatus || 'Pending'}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Subscription Details Modal */}
      <AnimatePresence>
        {showSubscriptionDetails && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSubscriptionDetails(false)}
              className="absolute inset-0 bg-background/90 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-surface-container p-8 rounded-xl max-w-sm w-full shadow-2xl border border-white/5"
            >
              <button 
                onClick={() => setShowSubscriptionDetails(false)}
                className="absolute top-4 right-4 text-on-surface-variant hover:text-on-surface"
              >
                <X size={24} />
              </button>

              <div className="mb-8">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Award size={32} className="text-primary" />
                </div>
                <h3 className="font-headline font-black text-2xl uppercase italic text-center">Membership Plans</h3>
                <p className="text-xs text-on-surface-variant mt-1 text-center">Elite access to MustGym</p>
              </div>

              <div className="space-y-3">
                {tiers.length > 0 ? (
                  tiers.map((plan, i) => (
                    <div 
                      key={i}
                      className={cn(
                        "p-4 rounded-xl border flex items-center justify-between transition-all",
                        "bg-surface-container-highest border-white/5" // Default styling
                      )}
                    >
                      <div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-primary mb-0.5">{plan.name}</div>
                        <div className="text-sm font-bold">{plan.benefits?.length ? `${plan.benefits.length} Benefits` : 'No Benefits'}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-black font-headline text-white">₹{plan.price}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  [
                    { duration: '1 Month', price: '₹1,200', tag: 'Flexible' },
                    { duration: '3 Months', price: '₹3,300', tag: 'Popular', highlight: true },
                    { duration: '6 Months', price: '₹6,000', tag: 'Value' },
                    { duration: '12 Months', price: '₹11,000', tag: 'Best Deal' },
                  ].map((plan, i) => (
                    <div 
                      key={i}
                      className={cn(
                        "p-4 rounded-xl border flex items-center justify-between transition-all",
                        plan.highlight ? "bg-primary/10 border-primary/30" : "bg-surface-container-highest border-white/5"
                      )}
                    >
                      <div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-primary mb-0.5">{plan.tag}</div>
                        <div className="text-sm font-bold">{plan.duration}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-black font-headline text-white">{plan.price}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-8 p-4 bg-primary/5 rounded-lg border border-primary/10">
                <p className="text-[9px] text-on-surface-variant leading-relaxed text-center uppercase font-bold tracking-tighter">
                  Contact the front desk or use the payment section to renew your elite membership.
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Settings Sections */}
      <div className="space-y-10">
        {sections.map((section, idx) => (
          <section key={idx}>
            <h2 className="text-[11px] font-black tracking-[0.2em] text-on-surface-variant uppercase mb-4 pl-1">{section.title}</h2>
            <div className="bg-surface-container rounded-lg overflow-hidden border border-white/5">
              {section.items.map((item, i) => (
                <div key={i}>
                  {item.link ? (
                    <Link 
                      to={item.link}
                      className="w-full flex items-center justify-between p-4 hover:bg-surface-bright transition-all group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="text-primary">
                          <item.icon size={20} />
                        </div>
                        <div className="text-left">
                          <span className="block text-sm font-medium">{item.label}</span>
                          {item.description && <span className="block text-[10px] text-on-surface-variant">{item.description}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {item.value && <span className="text-[10px] text-on-surface-variant font-bold">{item.value}</span>}
                        <ChevronRight size={18} className="text-outline group-hover:text-primary transition-colors" />
                      </div>
                    </Link>
                  ) : (
                    <button 
                      onClick={item.onClick}
                      className="w-full flex items-center justify-between p-4 hover:bg-surface-bright transition-all group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="text-primary">
                          <item.icon size={20} />
                        </div>
                        <div className="text-left">
                          <span className="block text-sm font-medium">{item.label}</span>
                          {item.description && <span className="block text-[10px] text-on-surface-variant">{item.description}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {item.value && <span className="text-[10px] text-on-surface-variant font-bold">{item.value}</span>}
                        <ChevronRight size={18} className="text-outline group-hover:text-primary transition-colors" />
                      </div>
                    </button>
                  )}
                  {i < section.items.length - 1 && <div className="h-[1px] mx-4 bg-outline-variant/10" />}
                </div>
              ))}
            </div>
          </section>
        ))}

        {/* Logout */}
        <div className="pt-4 pb-12">
          <button 
            onClick={handleLogout}
            className="w-full py-4 bg-primary text-on-primary-fixed font-bold tracking-widest text-[11px] uppercase rounded-lg hover:bg-primary-dim transition-all active:scale-95 duration-200 shadow-xl shadow-primary/10 flex items-center justify-center gap-2"
          >
            <LogOut size={18} />
            Logout from Session
          </button>
          <div className="mt-6 text-center space-y-2">
            <p className="text-[9px] text-on-surface-variant font-medium tracking-[0.1em]">MustGym App v4.8.2-PRO</p>
            <p className="text-[8px] font-black text-primary/40 uppercase tracking-[0.4em]">MADE BY DHRUVYA MALHOTRA @ REGULUS LABS</p>
          </div>
        </div>
      </div>
    </div>
  );
}

