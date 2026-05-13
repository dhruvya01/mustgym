import React from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { QrCode, Shield, Zap, Activity, ChevronRight, Info } from 'lucide-react';
import { SEO } from '../components/SEO';

export default function ScannerPortal() {
  const navigate = useNavigate();

  const features = [
    {
      icon: Zap,
      title: "Instant Check-in",
      description: "Scan the gym terminal to start your session automatically."
    },
    {
      icon: Activity,
      title: "Live Tracking",
      description: "Monitor your workout duration in real-time after scanning."
    },
    {
      icon: Shield,
      title: "Secure Access",
      description: "Encrypted digital verification for elite members only."
    }
  ];

  return (
    <div className="space-y-8 pb-10">
      <SEO title="Scanner Portal" />
      
      {/* Hero Section */}
      <section className="relative pt-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="h-[1px] w-12 bg-primary" />
            <span className="font-headline font-bold uppercase tracking-[0.3em] text-primary text-[10px]">Access Terminal</span>
          </div>
          <h2 className="font-headline font-black text-4xl sm:text-6xl md:text-7xl leading-[0.85] uppercase italic tracking-tighter mb-6">
            DIGITAL<br/>
            <span className="text-primary-dim">VERIFICATION.</span>
          </h2>
          <p className="text-on-surface-variant font-medium text-sm max-w-md leading-relaxed mb-8">
            Use your device's camera to scan the official MustGym QR code located at the entrance or on gym equipment.
          </p>
        </motion.div>
      </section>

      {/* Main Action Card */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="relative group"
      >
        <div className="absolute -inset-1 bg-gradient-to-r from-primary to-primary-dim rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
        <button 
          onClick={() => navigate('/scan')}
          className="relative w-full bg-surface-container-low border border-white/10 rounded-3xl p-8 sm:p-12 flex flex-col items-center text-center overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-700">
            <QrCode size={200} />
          </div>
          
          <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-8 group-hover:scale-110 transition-transform duration-500">
            <QrCode size={40} />
          </div>
          
          <h3 className="font-headline font-black text-2xl sm:text-4xl uppercase italic mb-4">Launch Scanner</h3>
          <p className="text-on-surface-variant text-xs sm:text-sm font-medium max-w-xs mb-8">
            Ready to train? Open the camera interface to verify your membership.
          </p>
          
          <div className="flex items-center gap-2 bg-primary text-on-primary-fixed px-8 py-4 rounded-xl font-headline font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20 group-hover:shadow-primary/40 transition-all">
            Open Camera
            <ChevronRight size={16} />
          </div>
        </button>
      </motion.div>

      {/* Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {features.map((f, i) => {
          const Icon = f.icon;
          return (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + (i * 0.1) }}
              className="bg-surface-container-low p-6 rounded-2xl border border-white/5"
            >
              <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-primary mb-4">
                <Icon size={20} />
              </div>
              <h4 className="font-headline font-bold text-sm uppercase mb-2 tracking-tight">{f.title}</h4>
              <p className="text-[10px] text-on-surface-variant leading-relaxed font-medium">
                {f.description}
              </p>
            </motion.div>
          );
        })}
      </div>

      {/* Help Footer */}
      <section className="bg-surface-container-highest/30 p-6 rounded-2xl border border-white/5 flex items-start gap-4">
        <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-500 shrink-0">
          <Info size={16} />
        </div>
        <div>
          <h5 className="text-[10px] font-black uppercase tracking-widest text-white mb-1">Trouble Scanning?</h5>
          <p className="text-[10px] text-on-surface-variant leading-relaxed">
            Ensure you have granted camera permissions in your browser settings. If the QR code is damaged, please ask the front desk for manual check-in.
          </p>
        </div>
      </section>
    </div>
  );
}
