import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation, Outlet } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc, getDocFromServer, updateDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from './lib/firebase';
import { UserProfile } from './types';
import { Home, Dumbbell, Activity, Settings, QrCode, LogOut, Menu, User as UserIcon, Shield, X, Utensils, Bell, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import { ErrorBoundary } from './components/ErrorBoundary';
import { handleFirestoreError, OperationType } from './lib/firestore-errors';
import { PWAInstallPrompt } from './components/PWAInstallPrompt';
import { signOut, sendEmailVerification } from 'firebase/auth';
import { HelmetProvider, Helmet } from 'react-helmet-async';
import { Toaster, toast } from 'sonner';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { NotificationCenter } from './components/NotificationCenter';
import { differenceInDays, parseISO, format } from 'date-fns';

// Pages
import LoginPage from './pages/LoginPage';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import Workouts from './pages/Workouts';
import Progress from './pages/Progress';
import SettingsPage from './pages/SettingsPage';
import ScanPage from './pages/ScanPage';
import AdminPage from './pages/AdminPage';
import VerificationPage from './pages/VerificationPage';
import ProfilePage from './pages/ProfilePage';
import ScannerPortal from './pages/ScannerPortal';
import Challenges from './pages/Challenges';
import OnboardingPage from './pages/OnboardingPage';
import AnalyticsPage from './pages/AnalyticsPage';

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration. The client is offline.");
    }
  }
}

const MemberProtectedRoute = ({ children, profile }: { children: React.ReactNode, profile: UserProfile | null }) => {
  if (profile?.role === 'member' && (profile.membershipStatus === 'pending' || profile.membershipStatus === 'halted')) {
    return <Navigate to="/dashboard" />;
  }
  return <>{children}</>;
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    testConnection();

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        // Listen to profile
        const path = `users/${firebaseUser.uid}`;
        const docRef = doc(db, 'users', firebaseUser.uid);
        
        const unsubProfile = onSnapshot(docRef, async (docSnap) => {
          if (docSnap.exists()) {
            setProfile(docSnap.data() as UserProfile);
            setLoading(false);
          } else {
            // New user - handle auto-onboarding from login portal
            const pendingGymId = sessionStorage.getItem('pending_gym_id');
            const portalIntent = sessionStorage.getItem('portal_intent');
            
            const newProfile: UserProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || '',
              photoURL: firebaseUser.photoURL || '',
              role: portalIntent === 'owner' ? 'owner' : 'member',
              membershipStatus: portalIntent === 'owner' ? 'active' : 'pending',
              createdAt: new Date().toISOString()
            };
            if (pendingGymId) {
              newProfile.gymId = pendingGymId;
            }

            // Verify gym exists if trying to join
            if (pendingGymId) {
              const gymSnap = await getDoc(doc(db, 'gyms', pendingGymId));
              if (!gymSnap.exists()) {
                toast.error('The gym ID you entered is invalid. Please complete onboarding.');
                delete newProfile.gymId;
                newProfile.membershipStatus = 'pending';
              } else {
                toast.success(`Welcome to ${gymSnap.data().name}!`);
              }
            }

            try {
              await setDoc(docRef, newProfile);
              setProfile(newProfile);
            } catch (err) {
              handleFirestoreError(err, OperationType.CREATE, path);
            }
            
            // Cleanup session
            sessionStorage.removeItem('pending_gym_id');
            sessionStorage.removeItem('portal_intent');
            setLoading(false);
          }
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, path);
          setLoading(false);
        });

        // Add unsubProfile to window or ignore since App mostly stays mounted
        // Alternatively, return an effect cleanup (we can't easily within onAuthStateChanged unless we handle it outside)
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!profile || !user) return;

    // Check for membership expiry
    const checkMembership = async () => {
      if (profile.membershipExpiry) {
        const expiryDate = parseISO(profile.membershipExpiry);
        const daysLeft = differenceInDays(expiryDate, new Date());

        if (daysLeft <= 7 && daysLeft > 0) {
          // Check if we already notified today
          const lastCheck = localStorage.getItem(`expiry_check_${user.uid}`);
          const today = format(new Date(), 'yyyy-MM-dd');

          if (lastCheck !== today) {
            // Create a notification in Firestore
            const q = query(
              collection(db, 'notifications'),
              where('userId', '==', user.uid) // Filter by title client-side to avoid composite index
            );
            const existingQuery = await getDocs(q);
            const existingStatus = existingQuery.docs.some(doc => doc.data().title === 'Membership Expiring Soon');
            
            if (!existingStatus) {
              await addDoc(collection(db, 'notifications'), {
                userId: user.uid,
                title: 'Membership Expiring Soon',
                message: `Your ${profile.membershipType} membership will expire in ${daysLeft} days on ${format(expiryDate, 'MMM dd, yyyy')}. Please renew to keep your elite status.`,
                type: 'warning',
                read: false,
                createdAt: new Date().toISOString()
              });
            }
            localStorage.setItem(`expiry_check_${user.uid}`, today);
          }
        }
      }
    };

    checkMembership();
  }, [profile, user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center relative overflow-hidden">
        {/* Background Glows */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 flex flex-col items-center"
        >
          <div className="w-24 h-24 bg-primary rounded-[2rem] flex items-center justify-center shadow-2xl shadow-primary/20 mb-8">
            <Dumbbell size={48} className="text-on-primary-fixed" />
          </div>
          
          <motion.h1 
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="text-on-surface font-headline font-black text-3xl sm:text-4xl uppercase italic tracking-tighter"
          >
            MUST<span className="text-primary">GYM</span>
          </motion.h1>
          
          <div className="mt-8 flex gap-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{ scaleY: [1, 2, 1], opacity: [0.3, 1, 0.3] }}
                transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }}
                className="w-1.5 h-4 bg-primary rounded-full"
              />
            ))}
          </div>
        </motion.div>

        <p className="absolute bottom-12 text-on-surface-variant font-headline font-bold uppercase tracking-[0.3em] text-[10px]">
          Elite Performance Tracking
        </p>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <HelmetProvider>
        <Router>
          <div className="min-h-screen bg-background text-on-surface font-body selection:bg-primary selection:text-on-primary">
            <Toaster position="top-center" expand={false} richColors theme="dark" />
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={!user ? <LandingPage /> : <Navigate to="/dashboard" />} />
              <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/dashboard" />} />
              
              {/* Protected Routes */}
              <Route element={user ? <Layout profile={profile}><Outlet /></Layout> : <Navigate to="/login" />}>
                <Route path="/dashboard" element={
                  profile?.role === 'owner' ? (
                    <Navigate to="/admin" />
                  ) : profile && !profile.gymId && profile.role !== 'admin' ? (
                    <Navigate to="/onboarding" />
                  ) : (
                    <Dashboard profile={profile} />
                  )
                } />
                <Route path="/onboarding" element={
                  profile && !profile.gymId
                    ? <OnboardingPage profile={profile} onProfileUpdate={(p) => setProfile(p)} />
                    : <Navigate to="/dashboard" />
                } />
                <Route path="/workouts" element={<MemberProtectedRoute profile={profile}><Workouts profile={profile} /></MemberProtectedRoute>} />
            <Route path="/analytics" element={<MemberProtectedRoute profile={profile}><AnalyticsPage profile={profile} /></MemberProtectedRoute>} />
                <Route path="/progress" element={<MemberProtectedRoute profile={profile}><Progress profile={profile} /></MemberProtectedRoute>} />
                <Route path="/settings" element={<SettingsPage profile={profile} />} />
                <Route path="/profile" element={<MemberProtectedRoute profile={profile}><ProfilePage profile={profile} /></MemberProtectedRoute>} />
                <Route path="/scanner" element={<ScannerPortal />} />
                <Route path="/scan" element={<MemberProtectedRoute profile={profile}><ScanPage profile={profile} /></MemberProtectedRoute>} />
                <Route path="/challenges" element={<MemberProtectedRoute profile={profile}><Challenges profile={profile} /></MemberProtectedRoute>} />
                <Route path="/admin" element={profile?.role === 'admin' || profile?.role === 'owner' ? <AdminPage profile={profile} /> : <Navigate to="/dashboard" />} />
              </Route>

              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
            <PWAInstallPrompt />
        </div>
      </Router>
    </HelmetProvider>
  </ErrorBoundary>
  );
}

function Layout({ children, profile }: { children: React.ReactNode, profile: UserProfile | null }) {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const baseNavItems = [
    { path: '/dashboard', icon: Home, label: 'Home' },
    { path: '/challenges', icon: Trophy, label: 'Challenges' },
    { path: '/workouts', icon: Dumbbell, label: 'Workouts' },
    { path: '/scan', icon: QrCode, label: 'Scan', primary: true },
    { path: '/progress', icon: Activity, label: 'Progress' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

  const restrictedNavItems = [
    { path: '/dashboard', icon: Home, label: 'Home' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

  const ownerNavItems = [
    { path: '/admin', icon: Shield, label: 'Dashboard' },
    { path: '/scan', icon: QrCode, label: 'Scan', primary: true },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

  const isRestricted = profile?.role === 'member' && (profile?.membershipStatus === 'pending' || profile?.membershipStatus === 'halted');
  const navItems = profile?.role === 'owner' ? ownerNavItems : (isRestricted ? restrictedNavItems : baseNavItems);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Sidebar Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 z-[60] bg-background/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 w-[280px] z-[70] bg-surface-container border-r border-white/5 p-6 flex flex-col pt-[env(safe-area-inset-top)]"
            >
              <div className="flex justify-between items-center mb-10">
                <h2 className="font-headline font-black text-xl italic tracking-tighter text-white">
                  MUST<span className="text-primary">GYM</span>
                </h2>
                <button 
                  onClick={() => setIsMenuOpen(false)}
                  className="p-2 hover:bg-white/5 rounded-lg text-on-surface-variant"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 space-y-2">
                {navItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-4 p-4 rounded-xl transition-all duration-200 font-headline font-bold uppercase tracking-widest text-xs",
                        isActive ? "bg-primary text-on-primary-fixed" : "text-on-surface-variant hover:bg-white/5 hover:text-white"
                      )}
                    >
                      <Icon size={20} />
                      {item.label}
                    </Link>
                  );
                })}
                {profile?.role === 'admin' && (
                  <Link
                    to="/admin"
                    onClick={() => setIsMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-xl transition-all duration-200 font-headline font-bold uppercase tracking-widest text-xs",
                      location.pathname === '/admin' ? "bg-primary text-on-primary-fixed" : "text-on-surface-variant hover:bg-white/5 hover:text-white"
                    )}
                  >
                    <Shield size={20} />
                    Admin Panel
                  </Link>
                )}
              </div>

              <div className="pt-6 border-t border-white/5">
                <button 
                  onClick={() => { 
                    signOut(auth); 
                    setIsMenuOpen(false);
                    toast.info('Signed out successfully');
                  }}
                  className="w-full flex items-center gap-4 p-4 rounded-xl text-error hover:bg-error/10 transition-all font-headline font-bold uppercase tracking-widest text-xs"
                >
                  <LogOut size={20} />
                  Sign Out
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Top Bar */}
      <header className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-xl border-b border-white/5 pt-[env(safe-area-inset-top)]">
        <div className="flex justify-between items-center px-4 sm:px-6 h-14 sm:h-16 max-w-7xl mx-auto w-full">
          <div className="flex items-center gap-2 sm:gap-4">
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-primary hover:bg-white/5 p-2 rounded-lg transition-colors"
            >
              <Menu size={20} />
            </button>
            <h1 className="font-headline font-black text-base sm:text-xl italic tracking-tighter text-white whitespace-nowrap">
              MUST<span className="text-primary">GYM</span>
            </h1>
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            <NotificationCenter />
            {(profile?.role === 'admin' || profile?.role === 'owner') && (
              <Link to="/admin" className="text-primary-dim hover:text-primary transition-colors">
                <Shield size={18} />
              </Link>
            )}
            <Link to="/profile" className="w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden border border-white/10 hover:border-primary transition-colors">
              <img 
                src={profile?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.uid}`} 
                alt="Profile" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 pt-14 sm:pt-16 pb-16 sm:pb-24">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="p-3 sm:p-6 max-w-7xl mx-auto w-full"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 w-full z-50 bg-background/80 backdrop-blur-xl border-t border-white/5 pb-[env(safe-area-inset-bottom)]">
        <div className="flex justify-around items-center h-14 sm:h-20 px-2 sm:px-4 max-w-7xl mx-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            
            return (
              <Link 
                key={item.path}
                to={item.path}
                className={cn(
                  "flex flex-col items-center justify-center transition-all duration-200 flex-1",
                  item.primary ? "bg-primary/10 rounded-lg py-1 text-primary" : "text-on-surface-variant hover:text-primary",
                  isActive && !item.primary && "text-primary"
                )}
              >
                <Icon size={isActive ? 20 : 18} strokeWidth={isActive ? 2.5 : 2} />
                <span className="font-headline text-[7px] sm:text-[10px] font-bold uppercase tracking-widest mt-1">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
