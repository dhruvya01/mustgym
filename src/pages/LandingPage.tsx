import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Activity, Dumbbell, Users, BarChart3, ChevronRight, CheckCircle2, 
  Smartphone, QrCode, TrendingUp, Zap, Shield, PlayCircle,
  Menu, X, Calendar, DollarSign, SmartphoneNfc, ArrowRight,
  MessageCircle, Star, Quote
} from 'lucide-react';
import { SEO } from '../components/SEO';

const WHATSAPP_URL = "https://wa.me/917889686144?text=Hi,%20I'm%20interested%20in%20booking%20a%20demo%20for%20MustGym.";

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-body overflow-x-hidden selection:bg-[#00f0ff]/30 selection:text-white">
      <SEO 
        title="MustGym | AI-Powered Gym Management" 
        description="Run your gym without a reception desk. Complete gym management suite with QR attendance, AI training plans, member gamification, and real-time business analytics."
      />
      
      {/* Navbar */}
      <nav className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? 'bg-[#050505]/80 backdrop-blur-xl border-b border-white/10 py-3' : 'bg-transparent py-5'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="font-headline font-black text-2xl italic tracking-tighter text-white">
              MUST<span className="text-[#00f0ff]">GYM</span>
            </h1>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-gray-400 hover:text-white transition-colors text-sm font-medium">Features</a>
            <a href="#pricing" className="text-gray-400 hover:text-white transition-colors text-sm font-medium">Pricing</a>
            <a href="#faq" className="text-gray-400 hover:text-white transition-colors text-sm font-medium">FAQ</a>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <Link to="/login" className="text-gray-400 hover:text-[#00f0ff] font-medium text-sm transition-colors">
              Member Login
            </Link>
            <Link to="/login" className="text-white hover:text-[#00f0ff] font-medium text-sm transition-colors border border-white/10 px-4 py-2 rounded-lg hover:border-[#00f0ff]/50 bg-white/5 backdrop-blur-sm">
              Gym Owner Login
            </Link>
            <a 
              href={WHATSAPP_URL}
              target="_blank" rel="noopener noreferrer"
              className="bg-[#00f0ff] hover:bg-[#00d0ff] text-black px-5 py-2.5 rounded-lg font-bold text-sm transition-all hover:shadow-[0_0_20px_rgba(0,240,255,0.4)] flex items-center gap-2"
            >
              <Zap size={16} /> Book Demo
            </a>
          </div>

          <button className="md:hidden text-white" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-40 bg-[#050505]/95 backdrop-blur-xl pt-24 px-6 md:hidden flex flex-col gap-6"
          >
            <Link to="/login" className="text-xl font-bold border-b border-white/10 pb-4">Member Login</Link>
            <Link to="/login" className="text-xl font-bold border-b border-white/10 pb-4">Gym Owner Login</Link>
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="text-xl font-bold text-[#00f0ff] flex items-center gap-2">Book Demo on WhatsApp</a>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden flex items-center min-h-[90vh]">
        {/* Glowing Orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#00f0ff]/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#39ff14]/10 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full mt-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
            >
              <motion.div variants={fadeInUp} className="flex flex-wrap gap-3 mb-6">
                <span className="px-3 py-1 rounded-full bg-[#00f0ff]/10 border border-[#00f0ff]/20 text-[#00f0ff] text-xs font-bold flex items-center gap-1">
                  <Zap size={14} /> AI Powered
                </span>
                <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-gray-300 text-xs font-bold">
                  Real-Time Analytics
                </span>
                <span className="px-3 py-1 rounded-full bg-[#39ff14]/10 border border-[#39ff14]/20 text-[#39ff14] text-xs font-bold">
                  QR Check-ins
                </span>
              </motion.div>

              <motion.h1 variants={fadeInUp} className="text-5xl md:text-7xl font-black font-headline tracking-tighter leading-[1.1] mb-6">
                Run Your Gym <br/>
                Without a <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00f0ff] to-[#0080ff]">Reception Desk.</span>
              </motion.h1>

              <motion.p variants={fadeInUp} className="text-lg md:text-xl text-gray-400 mb-8 max-w-xl leading-relaxed">
                A seamless, automated operating system for modern fitness centers. Features instant QR check-ins, live occupancy, automated revenue tracking, and gamified member engagement.
              </motion.p>
              
              <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row items-center gap-4">
                <a
                  href={WHATSAPP_URL}
                  target="_blank" rel="noopener noreferrer"
                  className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#00f0ff] text-black hover:bg-[#00d0ff] px-8 py-4 rounded-xl font-bold tracking-wide transition-all shadow-[0_0_20px_rgba(0,240,255,0.2)] hover:shadow-[0_0_30px_rgba(0,240,255,0.4)] hover:-translate-y-1"
                >
                  <MessageCircle size={20} /> Book Free Demo
                </a>
                <Link
                  to="/login"
                  className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#111] hover:bg-[#1a1a1a] text-white border border-white/10 px-8 py-4 rounded-xl font-bold tracking-wide transition-all shadow-xl"
                >
                  Gym Owner Login
                </Link>
              </motion.div>

              <motion.p variants={fadeInUp} className="mt-8 text-sm text-gray-500 font-medium border-l-2 border-[#00f0ff]/50 pl-4 py-1">
                Designed for modern gyms, fitness studios, <br className="hidden sm:block"/>and premium training centers in India.
              </motion.p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="relative hidden lg:block"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-[#00f0ff]/20 to-transparent blur-3xl -z-10 rounded-full" />
              <div className="glass-panel border border-[#00f0ff]/20 rounded-2xl p-4 overflow-hidden relative shadow-2xl flex items-center align-middle justify-center bg-[#0a0a0a]/80 backdrop-blur-xl h-[400px]">
                  {/* Abstract Dashboard Mockup */}
                  <div className="absolute top-4 left-4 right-4 h-12 border-b border-white/5 flex items-center px-4 justify-between">
                    <div className="flex gap-2"><div className="w-3 h-3 rounded-full bg-red-500/80"></div><div className="w-3 h-3 rounded-full bg-yellow-500/80"></div><div className="w-3 h-3 rounded-full bg-green-500/80"></div></div>
                    <div className="h-4 w-32 bg-white/10 rounded-full animate-pulse"></div>
                  </div>
                  
                  <div className="w-full mt-16 grid grid-cols-2 gap-4 px-4 pb-4">
                     <div className="h-32 bg-white/5 rounded-xl border border-white/5 p-4 flex flex-col justify-between">
                       <span className="text-gray-400 text-xs uppercase tracking-wider font-bold">Live Occupancy</span>
                       <div className="flex items-end gap-2"><span className="text-4xl font-bold text-[#39ff14]">42</span><span className="text-xs text-gray-500 mb-1">/ 100</span></div>
                       <div className="h-1.5 w-full bg-white/10 rounded-full mt-2 overflow-hidden"><div className="h-full w-[42%] bg-[#39ff14] rounded-full"></div></div>
                     </div>
                     <div className="h-32 bg-white/5 rounded-xl border border-white/5 p-4 flex flex-col justify-between">
                       <span className="text-gray-400 text-xs uppercase tracking-wider font-bold">Today's Revenue</span>
                       <div className="text-2xl font-bold text-white">₹12,450</div>
                       <svg className="w-full h-8" viewBox="0 0 100 30"><path d="M0 30 Q 20 20, 40 25 T 100 5 L 100 30 Z" fill="rgba(0, 240, 255, 0.15)" /><path d="M0 30 Q 20 20, 40 25 T 100 5" fill="none" stroke="#00f0ff" strokeWidth="2" /></svg>
                     </div>
                     <div className="col-span-2 h-20 bg-gradient-to-r from-[#00f0ff]/10 to-transparent rounded-xl border border-[#00f0ff]/20 p-4 flex items-center justify-between">
                        <div>
                           <div className="text-white text-sm font-bold">New Member Signed Up</div>
                           <div className="text-[#00f0ff] text-xs">Arjun Kapoor • PRO Plan</div>
                        </div>
                        <div className="bg-[#00f0ff]/20 text-[#00f0ff] font-bold px-3 py-1 rounded-lg text-xs">+ ₹1,999</div>
                     </div>
                  </div>
              </div>

               {/* Floating elements */}
               <motion.div 
                 animate={{ y: [-10, 10, -10] }}
                 transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
                 className="absolute -bottom-6 -left-6 bg-[#111] border border-[#39ff14]/30 rounded-2xl p-4 flex items-center gap-4 shadow-2xl z-20"
               >
                 <div className="w-12 h-12 rounded-full bg-[#39ff14]/10 border border-[#39ff14]/20 flex items-center justify-center text-[#39ff14]"><QrCode size={20} /></div>
                 <div>
                   <div className="text-sm font-bold text-white">Rahul Check-in</div>
                   <div className="text-xs text-[#39ff14]">Just now • Gym Floor</div>
                 </div>
               </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <motion.div 
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={fadeInUp}
            className="mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-black font-headline tracking-tighter mb-4 text-gray-400">
              Most Gyms Still Run Like It's 2015.
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: 'Manual Attendance Tracking', icon: Calendar, color: 'text-red-400', bg: 'bg-red-400/10' },
              { title: 'Payment & Renewal Confusion', icon: DollarSign, color: 'text-orange-400', bg: 'bg-orange-400/10' },
              { title: 'Zero Member Engagement', icon: Users, color: 'text-gray-400', bg: 'bg-gray-400/10' }
            ].map((item, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="bg-[#0f0f0f] p-8 rounded-2xl border border-white/5 opacity-60 grayscale hover:grayscale-0 hover:opacity-100 transition-all hover:-translate-y-1"
              >
                <div className={`w-14 h-14 rounded-2xl ${item.bg} flex items-center justify-center mb-6 mx-auto`}>
                  <item.icon className={item.color} size={28} />
                </div>
                <h3 className="text-lg font-bold text-gray-300">{item.title}</h3>
              </motion.div>
            ))}
          </div>

          <motion.div 
             initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.6 }}
             className="mt-20 inline-flex items-center gap-4 bg-gradient-to-r from-[#00f0ff]/10 to-[#39ff14]/10 border border-[#00f0ff]/20 rounded-full px-10 py-5 shadow-2xl"
          >
            <span className="text-xl md:text-2xl font-bold text-white tracking-tight">MustGym <span className="text-[#00f0ff]">automates everything.</span></span>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 relative overflow-hidden bg-[#0A0A0A]">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[#00f0ff]/5 blur-[150px] rounded-full pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-20 max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-black font-headline tracking-tighter mb-6">
              A Complete <span className="text-[#00f0ff]">Operating System</span> <br/>for Fitness Centers
            </h2>
            <p className="text-gray-400 text-lg">Everything you need to scale your fitness business, bundled into one beautifully designed platform.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: SmartphoneNfc, title: 'QR Check-in System', desc: 'Secure, fast access using dynamic QR codes on member phones.' },
              { icon: Dumbbell, title: 'AI Workout Generator', desc: 'Auto-create routines based on your gym\'s actual equipment.' },
              { icon: Activity, title: 'Live Gym Occupancy', desc: 'Members check how crowded the gym is before visiting.' },
              { icon: TrendingUp, title: 'Analytics Dashboard', desc: 'Track renewals, drop-offs, and growth in real-time.' },
              { icon: Shield, title: 'Multi-Admin System', desc: 'Role-based access for trainers, managers, and owners.' },
              { icon: Star, title: 'Gamification & Rewards', desc: 'Badges, streaks, and leaderboards to keep members hooked.' }
            ].map((feature, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="group bg-[#111] p-8 rounded-3xl border border-white/5 hover:border-[#00f0ff]/40 hover:bg-[#151515] transition-all duration-300 relative overflow-hidden flex flex-col h-full hover:shadow-[0_0_30px_rgba(0,240,255,0.05)] hover:-translate-y-1"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#00f0ff]/10 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-[#00f0ff]/10 transition-all text-gray-300 group-hover:text-[#00f0ff]">
                  <feature.icon size={26} />
                </div>
                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-white transition-colors">{feature.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed flex-1 group-hover:text-gray-300 transition-colors">{feature.desc}</p>
                <div className="mt-6 flex items-center gap-2 text-xs font-bold text-[#00f0ff] opacity-0 group-hover:opacity-100 transition-opacity">
                  Explore Feature <ArrowRight size={14} />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Dashboard Showcase & Member Experience */}
      <section className="py-24 relative overflow-hidden border-y border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
           <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black font-headline tracking-tighter mb-4">
              Manage your gym from <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#39ff14] to-[#00f0ff]">anywhere.</span>
            </h2>
            <p className="text-gray-400">Admin dashboard for you, sleek mobile app for your members.</p>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-12 items-center mb-24">
             <motion.div 
               initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
               className="space-y-8"
             >
                <div className="space-y-4">
                  <h3 className="text-2xl lg:text-3xl font-black tracking-tight text-white">Owner's Command Center</h3>
                  <p className="text-gray-400 leading-relaxed">Everything you need to track revenue, attendance patterns, and member growth in one glowing dashboard. Leave the paperwork behind.</p>
                </div>
                <ul className="space-y-4">
                   {['Real-time occupancy tracking', 'Revenue forecasting', 'One-click renewal reminders', 'Automated Whatsapp integration'].map((t, i) => (
                    <li key={i} className="flex flex-start gap-3 text-white font-medium">
                      <CheckCircle2 size={24} className="text-[#00f0ff] shrink-0" /> {t}
                    </li>
                  ))}
                </ul>
                <Link to="/login" className="inline-flex items-center gap-2 bg-[#00f0ff]/10 text-[#00f0ff] border border-[#00f0ff]/20 px-6 py-3 rounded-lg font-bold hover:bg-[#00f0ff]/20 transition-colors">
                  Try Admin Dashboard
                </Link>
             </motion.div>
             <motion.div 
               initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
               className="relative rounded-3xl border border-white/10 bg-[#111] shadow-2xl overflow-hidden aspect-video group"
             >
                {/* Simulated Macbook Frame */}
                <div className="h-8 bg-[#1a1a1a] border-b border-white/10 flex items-center px-4 gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/80"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/80"></div>
                </div>
                <div className="grid grid-cols-4 h-full">
                   <div className="col-span-1 bg-[#050505] border-r border-white/5 p-4 flex flex-col gap-2">
                     <div className="h-6 w-1/2 bg-white/10 rounded mb-4"></div>
                     <div className="h-8 w-full bg-[#00f0ff]/10 rounded mb-1 border border-[#00f0ff]/20"></div>
                     <div className="h-8 w-full bg-white/5 rounded mb-1"></div>
                     <div className="h-8 w-full bg-white/5 rounded"></div>
                   </div>
                   <div className="col-span-3 p-6 bg-[#0a0a0a] space-y-4">
                     <div className="flex justify-between items-end">
                       <span className="h-6 w-32 bg-white/10 rounded"></span>
                       <span className="h-8 w-24 bg-[#00f0ff] rounded-lg"></span>
                     </div>
                     <div className="grid grid-cols-3 gap-4">
                        <div className="h-20 bg-[#111] rounded-xl border border-white/5 p-3"><div className="h-3 w-1/2 bg-gray-500 rounded mb-2"></div><div className="h-6 w-3/4 bg-white rounded"></div></div>
                        <div className="h-20 bg-[#111] rounded-xl border border-white/5 p-3"><div className="h-3 w-1/2 bg-gray-500 rounded mb-2"></div><div className="h-6 w-3/4 bg-white rounded"></div></div>
                        <div className="h-20 bg-[#111] rounded-xl border border-white/5 p-3"><div className="h-3 w-1/2 bg-gray-500 rounded mb-2"></div><div className="h-6 w-3/4 bg-white rounded"></div></div>
                     </div>
                     <div className="h-32 bg-[#111] rounded-xl border border-white/5 w-full flex items-end p-4">
                         <svg className="w-full h-full" viewBox="0 0 100 40" preserveAspectRatio="none"><path d="M0 40 L 0 30 Q 20 25, 40 20 T 80 15 L 100 5 L 100 40 Z" fill="rgba(0, 240, 255, 0.2)"/><path d="M0 30 Q 20 25, 40 20 T 80 15 L 100 5" fill="none" stroke="#00f0ff" strokeWidth="2"/></svg>
                     </div>
                   </div>
                </div>
                 <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm cursor-pointer">
                    <div className="bg-[#00f0ff] text-black px-6 py-2 rounded-full font-bold flex items-center gap-2">View Demo <ChevronRight size={16}/></div>
                 </div>
             </motion.div>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center flex-col-reverse lg:flex-row-reverse">
             <motion.div 
               initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
               className="space-y-8"
             >
                <div className="space-y-4">
                  <h3 className="text-2xl lg:text-3xl font-black tracking-tight text-white">The Premium Member App</h3>
                  <p className="text-gray-400 leading-relaxed">Give your members a reason to keep coming back. Gamified tracking, AI diet plans, and lightning-fast QR check-ins all in their browser.</p>
                </div>
                <ul className="space-y-4">
                   {['Instant QR code access generation', 'Personalized AI workout schedules', 'Diet plan tracking based on Indian cuisine', 'Leaderboards & Streaks'].map((t, i) => (
                    <li key={i} className="flex flex-start gap-3 text-white font-medium">
                      <CheckCircle2 size={24} className="text-[#39ff14] shrink-0" /> {t}
                    </li>
                  ))}
                </ul>
             </motion.div>
             <motion.div 
               initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
               className="flex justify-center relative"
             >
                <div className="absolute inset-0 bg-gradient-to-tr from-[#39ff14]/20 to-transparent blur-3xl rounded-full" />
                {/* Simulated Phone Mockup */}
                <div className="w-64 h-[500px] bg-[#0a0a0a] rounded-[2.5rem] border-[6px] border-[#1a1a1a] shadow-2xl relative overflow-hidden flex flex-col z-10">
                   <div className="absolute top-0 inset-x-0 h-6 bg-[#1a1a1a] rounded-b-xl w-32 mx-auto"></div>
                   <div className="flex-1 p-4 pt-10 flex flex-col gap-4">
                      <div className="flex justify-between items-center text-white"><span className="text-xs font-bold">Good Morning!</span><div className="w-8 h-8 rounded-full bg-gray-700"></div></div>
                      <div className="h-32 rounded-2xl bg-gradient-to-br from-[#39ff14]/20 to-[#00f0ff]/20 border border-white/10 flex items-center justify-center flex-col text-center p-4">
                        <QrCode size={40} className="text-white mb-2" />
                        <span className="text-xs font-bold text-white">Tap to Check-in</span>
                      </div>
                      <div className="flex gap-2">
                        <div className="flex-1 h-20 bg-[#111] rounded-xl border border-white/5 flex flex-col items-center justify-center p-2"><Star size={20} className="text-yellow-400 mb-1"/><span className="text-xs text-white">450 pts</span></div>
                        <div className="flex-1 h-20 bg-[#111] rounded-xl border border-white/5 flex flex-col items-center justify-center p-2"><Activity size={20} className="text-[#00f0ff] mb-1"/><span className="text-xs text-white">Live: 42</span></div>
                      </div>
                      <div className="h-full w-full bg-[#111] rounded-xl border border-white/5 p-3 space-y-3">
                         <div className="h-3 w-1/3 bg-gray-500 rounded"></div>
                         <div className="flex gap-2 items-center"><div className="w-8 h-8 rounded-lg bg-gray-700"></div><div className="flex-1 h-2 bg-gray-800 rounded"></div></div>
                         <div className="flex gap-2 items-center"><div className="w-8 h-8 rounded-lg bg-gray-700"></div><div className="flex-1 h-2 bg-gray-800 rounded"></div></div>
                      </div>
                   </div>
                </div>
             </motion.div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-32 relative bg-[#050505]">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#00f0ff]/50 to-transparent" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black font-headline tracking-tighter mb-4">
              Simple, Transparent <span className="text-[#00f0ff]">Pricing</span>
            </h2>
            <p className="text-gray-400 text-lg">Scale without limits. Choose the blueprint that fits your facility.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 items-center max-w-6xl mx-auto">
            {/* Starter */}
            <motion.div 
               whileHover={{ y: -8 }}
               className="bg-[#0c0c0c] rounded-3xl p-8 border border-white/5 hover:border-gray-500 transition-all relative h-fit"
            >
              <h3 className="text-xl font-bold mb-2 tracking-wide uppercase">STARTER</h3>
              <p className="text-sm text-gray-500 mb-6 min-h-[40px]">Perfect for boutique gyms just getting started.</p>
              <div className="flex items-baseline gap-1 mb-6 pb-6 border-b border-white/5">
                <span className="text-4xl font-black">₹999</span><span className="text-gray-500">/mo</span>
              </div>
              <ul className="space-y-4 mb-8">
                {['QR Check-ins', 'Attendance Tracking', 'Up to 100 members', 'Admin Dashboard', 'Email Support'].map((feature, i) => (
                  <li key={i} className="flex flex-start gap-3 text-sm text-gray-300">
                    <CheckCircle2 size={18} className="text-gray-500 shrink-0" /> {feature}
                  </li>
                ))}
              </ul>
              <a href="https://wa.me/917889686144?text=Hi!%20I%20want%20to%20subscribe%20to%20MustGym%20STARTER%20plan%20and%20get%20my%20owner%20account." target="_blank" rel="noopener noreferrer" className="block w-full py-4 text-center rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 font-bold transition-colors">Continue</a>
            </motion.div>

            {/* Pro */}
            <motion.div 
               whileHover={{ scale: 1.02, y: -8 }}
               className="bg-[#111] rounded-3xl p-8 border hover:border-[#00f0ff]/50 border-[#00f0ff]/30 shadow-[0_0_30px_rgba(0,240,255,0.05)] hover:shadow-[0_0_50px_rgba(0,240,255,0.1)] relative transform md:-translate-y-4 z-10 transition-all"
            >
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#00f0ff] text-black px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest shadow-lg shadow-[#00f0ff]/20">Most Popular</div>
              <h3 className="text-xl font-bold mb-2 text-[#00f0ff] tracking-wide uppercase">PRO</h3>
              <p className="text-sm text-gray-400 mb-6 min-h-[40px]">For growing establishments seeking deeper insights.</p>
              <div className="flex items-baseline gap-1 mb-6 pb-6 border-b border-white/5">
                <span className="text-5xl font-black">₹1,999</span><span className="text-gray-500">/mo</span>
              </div>
              <ul className="space-y-4 mb-8">
                {['Everything in Starter', 'AI Workout Generator', 'AI Diet Plans', 'Gamification & Streaks', 'Live Occupancy tracking', 'Up to 300 members'].map((feature, i) => (
                  <li key={i} className="flex flex-start gap-3 text-sm text-white">
                    <CheckCircle2 size={18} className="text-[#00f0ff] shrink-0" /> {feature}
                  </li>
                ))}
              </ul>
              <a href="https://wa.me/917889686144?text=Hi!%20I%20want%20to%20subscribe%20to%20MustGym%20PRO%20plan%20and%20get%20my%20owner%20account." target="_blank" rel="noopener noreferrer" className="block w-full py-4 text-center rounded-xl bg-[#00f0ff] hover:bg-[#00d0ff] text-black font-bold transition-colors shadow-[0_4px_20px_rgba(0,240,255,0.2)]">Continue</a>
            </motion.div>

            {/* Elite */}
            <motion.div 
               whileHover={{ y: -8 }}
               className="bg-[#0c0c0c] rounded-3xl p-8 border border-white/5 hover:border-[#39ff14]/40 transition-all relative h-fit"
            >
              <h3 className="text-xl font-bold mb-2 tracking-wide uppercase text-[#39ff14]">ELITE</h3>
              <p className="text-sm text-gray-500 mb-6 min-h-[40px]">Advanced AI tools for multi-location empires.</p>
              <div className="flex items-baseline gap-1 mb-6 pb-6 border-b border-white/5">
                <span className="text-4xl font-black">₹4,999</span><span className="text-gray-500">/mo</span>
              </div>
              <ul className="space-y-4 mb-8">
                {['Everything in Pro', 'Multi-location support', 'Advanced analytics', 'Unlimited members', 'Priority WhatsApp support', 'Custom White-label setup'].map((feature, i) => (
                  <li key={i} className="flex flex-start gap-3 text-sm text-gray-300">
                    <CheckCircle2 size={18} className="text-[#39ff14] shrink-0" /> {feature}
                  </li>
                ))}
              </ul>
              <a href="https://wa.me/917889686144?text=Hi!%20I%20want%20to%20subscribe%20to%20MustGym%20ELITE%20plan%20and%20get%20my%20owner%20account." target="_blank" rel="noopener noreferrer" className="block w-full py-4 text-center rounded-xl bg-white/5 hover:bg-[#39ff14]/10 border border-white/10 hover:border-[#39ff14]/30 hover:text-[#39ff14] font-bold transition-colors">Continue</a>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Demo CTA Section */}
      <section className="py-32 relative overflow-hidden bg-[#050505]">
        <div className="absolute inset-0 bg-gradient-to-br from-[#00f0ff]/10 via-transparent to-[#39ff14]/10 opacity-50" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#00f0ff]/5 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} whileInView={{ scale: 1, opacity: 1 }} viewport={{ once: true }}>
            <h2 className="text-4xl md:text-7xl font-black font-headline tracking-tighter mb-6 text-white drop-shadow-2xl">
              See MustGym <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00f0ff] to-[#39ff14]">Live.</span>
            </h2>
            <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto font-medium">
              Book a free WhatsApp demo and see how your gym can run smarter, attract more members, and scale easily.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-6">
               <a
                  href={WHATSAPP_URL}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-3 bg-[#00f0ff] text-black hover:bg-[#00d0ff] px-10 py-5 rounded-2xl font-black uppercase tracking-widest transition-all shadow-[0_0_40px_rgba(0,240,255,0.3)] hover:-translate-y-1"
                >
                  <MessageCircle size={24} /> Book Demo on WhatsApp
                </a>
                <Link
                  to="/login"
                  className="flex items-center justify-center gap-3 bg-white/5 hover:bg-white/10 text-white border border-white/10 px-10 py-5 rounded-2xl font-black uppercase tracking-widest backdrop-blur-sm transition-all focus:ring-2 focus:ring-white/20 hover:border-white/20"
                >
                  Create Account <ChevronRight size={20}/>
                </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-24 bg-[#0A0A0A] border-t border-white/5">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
           <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black font-headline tracking-tighter mb-4">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-4">
            {[
              { q: "How does QR check-in work?", a: "Members simply open their MustGym web app and scan the dynamic QR code displayed at your reception desk using their phone. It instantly marks attendance and checks subscription validity." },
              { q: "Do members need to download an app from Play Store?", a: "No! MustGym is a Progressive Web App (PWA). Members just login via their browser and can 'Add to Home Screen' instantly without manual updates." },
              { q: "Can I use my own branding?", a: "Yes, Pro and Elite plans allow you to upload your own gym logo, choose custom primary colors, and brand the member experience as your own." },
              { q: "Do you support multiple branches?", a: "Absolutely. The Elite plan allows you to manage multiple branches from a single owner account, track consolidated revenue, and assign branch-specific managers." },
              { q: "How long does onboarding take?", a: "Setup is instant. You create an account, enter your gym details, add your subscription tiers, and you can start checking members in within 5 minutes." },
            ].map((faq, i) => (
              <details key={i} className="group bg-[#111] rounded-2xl border border-white/5 [&_summary::-webkit-details-marker]:hidden hover:border-white/10 transition-colors">
                <summary className="flex items-center justify-between p-6 cursor-pointer font-bold select-none text-lg">
                  {faq.q}
                  <ChevronRight size={20} className="text-[#00f0ff] group-open:rotate-90 transition-transform" />
                </summary>
                <div className="px-6 pb-6 text-gray-400 text-sm leading-relaxed border-t border-white/5 pt-4">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#050505] border-t border-white/5 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-1 md:col-span-2">
              <h2 className="font-headline font-black text-3xl italic tracking-tighter text-white mb-4">
                MUST<span className="text-[#00f0ff]">GYM</span>
              </h2>
              <p className="text-gray-500 text-sm max-w-sm mb-6 leading-relaxed">
                Automating gym operations across India. Focus on training, we'll handle the management.
              </p>
              <div className="text-xs text-gray-400 font-bold tracking-widest uppercase flex flex-col gap-1 mt-2">
                <div>Built by <a href="https://reguluslabs.in" target="_blank" rel="noopener noreferrer" className="text-white hover:text-[#00f0ff] transition-colors">RegulusLabs.in</a></div>
                <div className="text-gray-500">Dhruvya Malhotra</div>
              </div>
            </div>
            
            <div>
              <h4 className="font-bold text-white mb-6 uppercase tracking-widest text-xs">Product</h4>
              <ul className="space-y-4 text-sm text-gray-400">
                <li><a href="#features" className="hover:text-[#00f0ff] transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-[#00f0ff] transition-colors">Pricing</a></li>
                <li><Link to="/login" className="hover:text-[#00f0ff] transition-colors">Gym Owner Login</Link></li>
                <li><Link to="/login" className="hover:text-[#00f0ff] transition-colors">Member App</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white mb-6 uppercase tracking-widest text-xs">Support</h4>
              <ul className="space-y-4 text-sm text-gray-400">
                <li><a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="hover:text-[#00f0ff] transition-colors flex items-center gap-2"><MessageCircle size={16}/> WhatsApp</a></li>
                <li><a href="mailto:support@mustgym.com" className="hover:text-[#00f0ff] transition-colors">Email Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-white/5 text-center text-sm text-gray-600 flex flex-col sm:flex-row justify-between items-center gap-4">
             <span>© {new Date().getFullYear()} MustGym. All rights reserved. | Dhruvya Malhotra</span>
             <div className="flex gap-4">
               <a href="#" className="hover:text-white transition-colors">Twitter</a>
               <a href="#" className="hover:text-white transition-colors">Instagram</a>
               <a href="#" className="hover:text-white transition-colors">LinkedIn</a>
             </div>
          </div>
        </div>
      </footer>

      {/* Floating WhatsApp Button */}
      <motion.a 
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1, type: "spring" }}
        href={WHATSAPP_URL}
        target="_blank" rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#39ff14] hover:bg-[#2be00d] rounded-full flex mx-auto items-center justify-center shadow-[0_0_20px_rgba(57,255,20,0.4)] hover:scale-110 transition-transform"
      >
        <MessageCircle size={28} className="text-black" />
      </motion.a>
    </div>
  );
}
