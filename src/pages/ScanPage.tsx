import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { collection, addDoc, query, where, getDocs, orderBy, limit, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserProfile, AttendanceRecord } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { X, CheckCircle2, AlertCircle, Camera, Lock, StopCircle, Clock, Activity, Zap, Loader2, Shield, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';
import { startOfDay, endOfDay, differenceInDays, parseISO, isAfter, subHours, subMinutes, formatDistanceToNow } from 'date-fns';
import { addPoints } from '../services/gamificationService';

export default function ScanPage({ profile }: { profile: UserProfile | null }) {
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(true);
  const [cameraReady, setCameraReady] = useState(false);
  const [isHalted, setIsHalted] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [activeSession, setActiveSession] = useState<AttendanceRecord | null>(null);
  const [elapsedTime, setElapsedTime] = useState<string>('');
  const [stoppingSession, setStoppingSession] = useState(false);
  const [showMyPass, setShowMyPass] = useState(false);
  const navigate = useNavigate();
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const isProcessingRef = useRef(false);

  // Handle terminal from URL query parameter
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const terminalId = params.get('terminal');
    const gymId = params.get('gymId');
    
    if (!profile || isProcessingRef.current || checkingStatus || isHalted) return;

    if (terminalId || gymId) {
      const targetTerminal = terminalId || 'MAIN_GATE';
      // If we have a gymId from URL, verify it matches user's gym
      if (gymId && profile.gymId !== gymId) {
        setError(`This QR code belongs to another studio. Your current studio is ${profile.gymId}.`);
        return;
      }
      onScanSuccess(targetTerminal);
    }
  }, [profile, checkingStatus, isHalted]);

  useEffect(() => {
    const checkHaltStatus = async () => {
      if (!profile || profile.role === 'admin' || !profile.gymId) {
        setCheckingStatus(false);
        return;
      }

      // 1. Check if already halted
      if (profile.membershipStatus === 'halted') {
        setIsHalted(true);
        setCheckingStatus(false);
        return;
      }

      try {
        // 2. Check last attendance and active session
        const q = query(
          collection(db, 'attendance'),
          where('userId', '==', profile.uid),
          where('gymId', '==', profile.gymId)
        );
        const snapshot = await getDocs(q);
        
        if (!snapshot.empty) {
          const records = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AttendanceRecord));
          records.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          const lastRecord = records[0];
          
          // Check for active session
          const checkInTime = parseISO(lastRecord.timestamp);
          const isRecent = isAfter(checkInTime, subMinutes(new Date(), 150));
          if (isRecent && !lastRecord.checkOutTime) {
            setActiveSession(lastRecord);
          }

          const lastDate = new Date(lastRecord.timestamp);
          const daysDiff = differenceInDays(new Date(), lastDate);

          if (daysDiff >= 2) {
            // Halt the membership
            await updateDoc(doc(db, 'users', profile.uid), {
              membershipStatus: 'halted'
            });
            setIsHalted(true);
          }
        }
      } catch (err) {
        console.error("Error checking status:", err);
      } finally {
        setCheckingStatus(false);
      }
    };

    checkHaltStatus();
  }, [profile]);

  useEffect(() => {
    let interval: any = null;
    if (activeSession) {
      interval = setInterval(() => {
        setElapsedTime(formatDistanceToNow(parseISO(activeSession.timestamp)));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeSession]);

  const handleStopSession = async () => {
    if (!activeSession) return;
    setStoppingSession(true);
    try {
      await updateDoc(doc(db, 'attendance', activeSession.id!), {
        checkOutTime: new Date().toISOString()
      });
      setActiveSession(null);
      setScanResult('session_ended');
      setTimeout(() => {
        navigate('/scanner');
      }, 1500);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `attendance/${activeSession.id}`);
    } finally {
      setStoppingSession(false);
    }
  };

  const startScanner = React.useCallback(async () => {
    if (checkingStatus || isHalted || !isScanning || scanResult) return;
    
    // Small delay to ensure DOM is ready and AnimatePresence has finished
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const element = document.getElementById("reader");
    if (!element) {
      console.warn("Reader element not found, retrying...");
      setTimeout(startScanner, 500);
      return;
    }

    try {
      // Clean up any existing instance
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        try {
          await html5QrCodeRef.current.stop();
        } catch (e) {
          console.error("Error stopping existing scanner", e);
        }
      }

      const html5QrCode = new Html5Qrcode("reader");
      html5QrCodeRef.current = html5QrCode;

      // Try with environment-facing camera first
      try {
        await html5QrCode.start(
          { facingMode: "environment" },
          {
            fps: 15,
            qrbox: { width: 250, height: 250 },
          },
          onScanSuccess,
          onScanFailure
        );
      } catch (e) {
        console.warn("Retrying scanner with just camera permission...", e);
        // Fallback: Just open the camera without specific constraints
        await html5QrCode.start(
          { facingMode: "user" },
          {
            fps: 15,
            qrbox: { width: 250, height: 250 },
          },
          onScanSuccess,
          onScanFailure
        );
      }
      setCameraReady(true);
      setError(null);
    } catch (err: any) {
      console.error("Scanner initialization failed", err);
      setCameraReady(false);
      setError("Camera access denied or failed. Please ensure you have granted camera permissions in your browser settings.");
    }
  }, [checkingStatus, isHalted, isScanning, scanResult]);

  useEffect(() => {
    if (checkingStatus || isHalted) return;
    
    startScanner();

    return () => {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        html5QrCodeRef.current.stop().then(() => {
          html5QrCodeRef.current?.clear();
        }).catch(err => console.error("Failed to stop scanner", err));
      }
    };
  }, [checkingStatus, isHalted, startScanner]);

  async function onScanSuccess(decodedText: string) {
    if (!profile || !profile.gymId || isProcessingRef.current) return;
    
    isProcessingRef.current = true;

    // Stop the scanner immediately for speed and to prevent loops
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      try {
        await html5QrCodeRef.current.stop();
      } catch (e) {
        console.error("Failed to stop scanner on success", e);
      }
    }

    setIsScanning(false);
    
    // Handle URL-based QR codes
    let terminalId = decodedText;
    try {
      if (decodedText.startsWith('http')) {
        const url = new URL(decodedText);
        const terminalParam = url.searchParams.get('terminal');
        if (terminalParam) {
          terminalId = terminalParam;
        }
      }
    } catch (e) {
      // Not a valid URL, use as plain text
    }

    setScanResult(terminalId);
    
    try {
      const path = 'attendance';
      const now = new Date();
      const todayStart = startOfDay(now).toISOString();
      const todayEnd = endOfDay(now).toISOString();

      // Check for expired membership
      if (profile.membershipStatus === 'expired' || (profile.membershipExpiry && new Date(profile.membershipExpiry) < now)) {
        if (profile.gymId) {
          // Create a live alert for the owner
          await addDoc(collection(db, 'live_alerts'), {
            type: 'expired_scan',
            title: 'Expired Membership Scan',
            message: `${profile.displayName} attempted to check in with an expired membership.`,
            userId: profile.uid,
            userName: profile.displayName,
            timestamp: now.toISOString(),
            resolved: false,
            gymId: profile.gymId
          });
        }

        // Also notify the user
        await addDoc(collection(db, 'notifications'), {
          userId: profile.uid,
          title: 'Membership Expired',
          message: 'Your membership has expired. Please renew at the front desk to continue using the studio.',
          type: 'error',
          read: false,
          createdAt: now.toISOString(),
          gymId: profile.gymId
        });

        setError("Your membership has expired. Please contact the owner for renewal.");
        setIsScanning(false);
        isProcessingRef.current = false;
        return;
      }

      // Check if this terminal corresponds to an equipment
      const equipQuery = query(
        collection(db, 'equipment'),
        where('gymId', '==', profile.gymId),
        where('id', '==', terminalId)
      );
      const equipSnapshot = await getDocs(equipQuery);
      
      if (!equipSnapshot.empty) {
        const equipData = equipSnapshot.docs[0].data();
        await addDoc(collection(db, 'equipmentUsage'), {
          equipmentId: terminalId,
          equipmentName: equipData.name,
          userId: profile.uid,
          timestamp: now.toISOString(),
          gymId: profile.gymId
        });
        setScanResult(`used_${equipData.name}`);
        setTimeout(() => {
          navigate('/scanner');
        }, 1500);
        return;
      }

      // Check for existing records today for attendance
      const q = query(
        collection(db, path),
        where('userId', '==', profile.uid),
        where('gymId', '==', profile.gymId || 'NO_GYM'),
        where('timestamp', '>=', todayStart),
        where('timestamp', '<=', todayEnd)
      );
      
      const querySnapshot = await getDocs(q);
      const existingCount = querySnapshot.size;
      const isDuplicate = existingCount > 0;

      const record: any = {
        userId: profile.uid,
        userName: profile.displayName,
        timestamp: now.toISOString(),
        terminalId: terminalId || 'MAIN_ENTRANCE',
        isDuplicate,
        entryCount: existingCount + 1,
        gymId: profile.gymId
      };

      await addDoc(collection(db, path), record);
      
      // Award points for check-in
      await addPoints(profile.uid, profile.gymId!, 10);
      
      setTimeout(() => {
        navigate('/scanner');
      }, 1500);
    } catch (err: any) {
      isProcessingRef.current = false;
      handleFirestoreError(err, OperationType.CREATE, 'attendance');
      setError(err.message || "Failed to record attendance");
    }
  }

  function onScanFailure(error: any) {
    // Silent failure for continuous scanning
  }

  return (
    <div className="fixed inset-0 z-[60] bg-black flex flex-col">
      {/* Header */}
      <header className="flex justify-between items-center px-6 py-4 w-full bg-black/40 backdrop-blur-md border-b border-white/5 z-30">
        <button 
          onClick={() => navigate('/scanner')}
          className="text-white hover:bg-white/10 p-2 rounded-full transition-colors"
        >
          <X size={24} />
        </button>
        <h1 className="font-headline uppercase tracking-[0.1em] font-black text-lg italic text-white">SCAN TERMINAL</h1>
        <div className="w-8 h-8 rounded-full overflow-hidden border border-primary/40">
          <img 
            src={profile?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.uid}`} 
            alt="Profile" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
      </header>

      <main className="flex-1 relative flex flex-col items-center justify-center overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 -left-20 w-64 h-64 bg-primary/10 rounded-full blur-[100px] animate-pulse" />
          <div className="absolute bottom-1/4 -right-20 w-64 h-64 bg-primary/5 rounded-full blur-[100px] animate-pulse delay-700" />
        </div>

        <AnimatePresence mode="wait">
          {checkingStatus ? (
            <motion.div 
              key="checking"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center"
            >
              <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
              <p className="text-primary font-black text-[10px] uppercase tracking-widest">Verifying Status...</p>
            </motion.div>
          ) : isHalted ? (
            <motion.div 
              key="halted"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="z-40 flex flex-col items-center text-center p-10 bg-surface-container rounded-3xl shadow-2xl border border-error/20 mx-6"
            >
              <div className="w-20 h-20 bg-error/20 rounded-full flex items-center justify-center mb-6">
                <Lock size={48} className="text-error" />
              </div>
              <h2 className="font-headline text-3xl font-black text-white uppercase italic mb-2 tracking-tighter">MEMBERSHIP HALTED</h2>
              <p className="text-on-surface-variant font-medium text-sm mb-8">
                Your membership has been halted due to inactivity. Please visit the trainer or owner to reactivate your access.
              </p>
              <button 
                onClick={() => navigate(-1)}
                className="kinetic-gradient w-full py-4 rounded-xl font-black uppercase tracking-widest text-xs"
              >
                GO BACK
              </button>
            </motion.div>
          ) : activeSession ? (
            <motion.div 
              key="active-session"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="z-40 flex flex-col items-center text-center p-8 bg-surface-container rounded-3xl shadow-2xl border border-primary/20 mx-6 w-full max-w-sm"
            >
              <div className="relative mb-8">
                <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center">
                  <Activity size={48} className="text-primary animate-pulse" />
                </div>
                <div className="absolute -top-2 -right-2 bg-primary text-on-primary-fixed text-[10px] font-black px-2 py-1 rounded-full flex items-center gap-1">
                  <Zap size={10} fill="currentColor" />
                  LIVE
                </div>
              </div>

              <h2 className="font-headline text-3xl font-black text-white uppercase italic mb-2 tracking-tighter">SESSION ACTIVE</h2>
              <div className="flex items-center gap-2 text-on-surface-variant mb-8">
                <Clock size={14} />
                <span className="text-sm font-bold uppercase tracking-widest">{elapsedTime || 'Just started'}</span>
              </div>

              <div className="w-full space-y-4">
                <button 
                  onClick={handleStopSession}
                  disabled={stoppingSession}
                  className="w-full py-5 bg-error text-on-error-fixed font-headline font-black uppercase tracking-widest text-sm rounded-2xl flex items-center justify-center gap-3 shadow-xl shadow-error/20 active:scale-95 transition-all disabled:opacity-50"
                >
                  {stoppingSession ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    <>
                      <StopCircle size={20} />
                      Stop Session
                    </>
                  )}
                </button>
                
                <button 
                  onClick={() => setActiveSession(null)}
                  className="w-full py-4 bg-white/5 text-on-surface-variant font-headline font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-white/10 transition-all"
                >
                  Continue Scanning
                </button>
              </div>
            </motion.div>
          ) : scanResult ? (
            <motion.div 
              key="success"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="z-40 flex flex-col items-center text-center p-10 bg-surface-container rounded-3xl shadow-2xl border border-primary/20 mx-6"
            >
              <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-6">
                <CheckCircle2 size={48} className="text-green-500" />
              </div>
              <h2 className="font-headline text-3xl font-black text-white uppercase italic mb-2 tracking-tighter">
                {scanResult === 'session_ended' ? 'SESSION ENDED' : scanResult.startsWith('used_') ? 'MACHINE SYNCED' : 'ACCESS GRANTED'}
              </h2>
              <p className="text-on-surface-variant font-medium text-sm uppercase tracking-widest">
                {scanResult === 'session_ended' ? 'GREAT WORKOUT!' : scanResult.startsWith('used_') ? scanResult.replace('used_', '').toUpperCase() : 'SYNCING SESSION DATA...'}
              </p>
            </motion.div>
          ) : error ? (
            <motion.div 
              key="error"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="z-40 flex flex-col items-center text-center p-10 bg-surface-container rounded-3xl shadow-2xl border border-error/20 mx-6"
            >
              <AlertCircle size={64} className="text-error mb-6" />
              <h2 className="font-headline text-2xl font-black text-white uppercase italic mb-2">SCAN ERROR</h2>
              <p className="text-on-surface-variant font-medium mb-8 text-sm">{error}</p>
              <button 
                onClick={() => { setError(null); setIsScanning(true); setScanResult(null); isProcessingRef.current = false; }}
                className="kinetic-gradient w-full py-4 rounded-xl font-black uppercase tracking-widest text-xs"
              >
                RETRY SCAN
              </button>
            </motion.div>
          ) : (
            <div key="scanner" className="w-full h-full flex flex-col items-center justify-center">
              {/* Camera Viewport */}
              <div className="relative w-full h-full bg-black">
                <div id="reader" className="w-full h-full object-cover" />
                
                {/* Scanner Overlay */}
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center pointer-events-none">
                  {/* Darkened area around the box */}
                  <div className="absolute inset-0 bg-black/40" style={{
                    clipPath: 'polygon(0% 0%, 0% 100%, 50% 100%, 50% calc(50% - 125px), calc(50% - 125px) calc(50% - 125px), calc(50% - 125px) calc(50% + 125px), calc(50% + 125px) calc(50% + 125px), calc(50% + 125px) calc(50% - 125px), 50% calc(50% - 125px), 50% 100%, 100% 100%, 100% 0%)'
                  }} />

                  {/* Scanning Box */}
                  <div className="relative w-[250px] h-[250px]">
                    {/* Corners */}
                    <div className="absolute top-0 left-0 w-10 h-10 border-t-4 border-l-4 border-primary rounded-tl-xl" />
                    <div className="absolute top-0 right-0 w-10 h-10 border-t-4 border-r-4 border-primary rounded-tr-xl" />
                    <div className="absolute bottom-0 left-0 w-10 h-10 border-b-4 border-l-4 border-primary rounded-bl-xl" />
                    <div className="absolute bottom-0 right-0 w-10 h-10 border-b-4 border-r-4 border-primary rounded-br-xl" />
                    
                    {/* Scanning Line */}
                    <motion.div 
                      animate={{ top: ['0%', '100%'] }}
                      transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                      className="absolute inset-x-0 h-1 bg-primary/60 shadow-[0_0_20px_#ff8f6f] z-30"
                    />
                  </div>

                  {/* Instructions */}
                  <div className="mt-12 text-center px-10">
                    <h2 className="font-headline text-2xl font-black text-white uppercase italic tracking-tighter mb-2">ALIGN QR CODE</h2>
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-white/60 text-[10px] font-bold uppercase tracking-[0.2em]">Scanning</span>
                      <motion.div 
                        animate={{ opacity: [0, 1, 0] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                        className="w-1 h-1 bg-primary rounded-full"
                      />
                      <motion.div 
                        animate={{ opacity: [0, 1, 0] }}
                        transition={{ repeat: Infinity, duration: 1.5, delay: 0.5 }}
                        className="w-1 h-1 bg-primary rounded-full"
                      />
                      <motion.div 
                        animate={{ opacity: [0, 1, 0] }}
                        transition={{ repeat: Infinity, duration: 1.5, delay: 1 }}
                        className="w-1 h-1 bg-primary rounded-full"
                      />
                    </div>
                  </div>
                </div>

                {!cameraReady && !error && (
                  <div className="absolute inset-0 z-50 bg-black flex flex-col items-center justify-center p-6 text-center">
                    <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-6" />
                    <p className="text-primary font-black text-xs uppercase tracking-widest animate-pulse mb-8">Initializing Camera...</p>
                    
                    <div className="space-y-4 w-full max-w-xs">
                      <button 
                        onClick={() => startScanner()}
                        className="w-full py-3 bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-white/60 hover:bg-white/20 transition-all"
                      >
                        Retry Initialization
                      </button>
                      
                      <p className="text-[9px] text-on-surface-variant font-medium leading-relaxed">
                        If the camera doesn't open, ensure you've allowed camera access in your browser settings.
                      </p>
                      
                      <a 
                        href={window.location.href} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="block w-full py-3 border border-primary/20 rounded-xl text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/5 transition-all"
                      >
                        Open in New Tab
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Status Bar */}
      <footer className="bg-black/80 backdrop-blur-md border-t border-white/5 p-6 flex flex-col items-center gap-4 z-40">
        <button 
          onClick={() => setShowMyPass(true)}
          className="w-full max-w-xs py-4 bg-primary text-on-primary-fixed font-headline font-black uppercase tracking-widest text-sm rounded-2xl flex items-center justify-center gap-3 shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
        >
          <User size={20} />
          My Digital Pass
        </button>
        <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-full border border-white/10">
          <Camera size={14} className="text-primary" />
          <span className="text-[9px] font-black text-white/60 uppercase tracking-widest">Scanner Active</span>
        </div>
      </footer>

      {/* Profile QR Modal */}
      <AnimatePresence>
        {showMyPass && profile && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMyPass(false)}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white p-10 rounded-2xl max-w-sm w-full shadow-2xl flex flex-col items-center text-center"
            >
              <button 
                onClick={() => setShowMyPass(false)}
                className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-900 bg-neutral-100 p-2 rounded-full transition-colors"
              >
                <X size={20} />
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
              <p className="text-neutral-500 text-[10px] mb-8 uppercase tracking-[0.2em] font-black">MUSTGYM ACCESS IDENTITY</p>
              
              <div className="p-4 bg-white rounded-2xl shadow-inner border-2 border-neutral-100 mb-8">
                <QRCodeSVG value={`USER_ID:${profile.uid}`} size={200} includeMargin={true} />
              </div>
              
              <div className="flex items-center gap-2 px-6 py-3 bg-neutral-100 rounded-full mb-4">
                <Shield size={14} className="text-primary" />
                <span className="text-neutral-600 text-[10px] font-black uppercase tracking-widest">Secure Gym Passport</span>
              </div>
              
              <p className="text-neutral-400 text-[10px] font-medium uppercase tracking-tight max-w-[200px]">
                Show this code to the front desk or scan at the entry kiosk.
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
