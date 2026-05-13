import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Activity, Dumbbell, Users, BarChart3, ChevronRight, CheckCircle2 } from 'lucide-react';
import { SEO } from '../components/SEO';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-on-surface font-body overflow-x-hidden selection:bg-primary selection:text-on-primary">
      <SEO 
        title="MustGym | Professional Gym Management System" 
        description="Complete gym management suite with QR attendance, AI training plans, member gamification, and business analytics. Built for modern fitness centers."
      />
      
      {/* Navigation */}
      <nav className="fixed w-full z-50 bg-background/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="font-headline font-black text-2xl italic tracking-tighter text-white">
              MUST<span className="text-primary">GYM</span>
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <Link 
              to="/login"
              className="text-on-surface-variant hover:text-white font-headline font-bold text-xs uppercase tracking-widest transition-colors hidden sm:block"
            >
              Client Login
            </Link>
            <Link 
              to="/login"
              className="bg-primary hover:bg-primary-bright text-on-primary-fixed px-6 py-2.5 rounded-full font-headline font-bold text-xs uppercase tracking-widest transition-all hover:shadow-[0_0_20px_rgba(var(--primary-rgb),0.4)]"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        {/* Background elements */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-block py-1 px-3 rounded-full bg-primary/10 border border-primary/20 text-primary font-headline font-bold text-[10px] uppercase tracking-[0.2em] mb-6">
              The Next Generation of Fitness Tracking
            </span>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black font-headline tracking-tighter italic uppercase text-white mb-6 leading-[0.9]">
              Elite Gym<br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary-bright">
                Management
              </span>
            </h1>
            <p className="max-w-2xl mx-auto text-lg md:text-xl text-on-surface-variant font-medium mb-10 leading-relaxed">
              Transform your fitness center with AI-powered workout plans, seamless QR check-ins, member gamification, and real-time business analytics.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/login"
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-primary hover:bg-primary-bright text-on-primary-fixed px-8 py-4 rounded-full font-headline font-black text-sm uppercase tracking-widest transition-all hover:scale-105"
              >
                Start Free Trial
                <ChevronRight size={18} />
              </Link>
              <Link
                to="/login"
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-surface-container hover:bg-surface-container-high text-white border border-white/10 px-8 py-4 rounded-full font-headline font-bold text-sm uppercase tracking-widest transition-all"
              >
                Book a Demo
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 border-y border-white/5 bg-surface-container-lowest">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-white/5">
            {[
              { label: 'Active Facilities', value: '500+' },
              { label: 'Members Managed', value: '2M+' },
              { label: 'Workouts Tracked', value: '15M+' },
              { label: 'Uptime Reliability', value: '99.9%' },
            ].map((stat, i) => (
              <div key={i} className="text-center px-4">
                <div className="text-3xl md:text-4xl font-black font-headline text-white mb-2">{stat.value}</div>
                <div className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Showcase */}
      <section className="py-24 relative overflow-hidden bg-mesh">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-black font-headline tracking-tighter italic uppercase text-white mb-6">
              Everything you need to <span className="text-primary">scale</span>
            </h2>
            <p className="text-on-surface-variant max-w-2xl mx-auto">
              Replace 4 different tools with one unified command center designed specifically for modern gym operations.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: <Activity className="text-primary" size={32} />,
                title: 'Smart Attendance',
                desc: 'Lightning-fast QR code check-ins for members. Real-time capacity tracking for owners.'
              },
              {
                icon: <Dumbbell className="text-primary" size={32} />,
                title: 'AI Workout Plans',
                desc: 'Generate personalized training regimes for members based on their goals and your available equipment.'
              },
              {
                icon: <Users className="text-primary" size={32} />,
                title: 'Gamification',
                desc: 'Keep members engaged through leaderboards, attendance streaks, and monthly challenges.'
              },
              {
                icon: <BarChart3 className="text-primary" size={32} />,
                title: 'Business Analytics',
                desc: 'Track revenue, member retention, active hours, and growth metrics from a unified dashboard.'
              }
            ].map((feature, i) => (
              <div key={i} className="bg-surface-container-low p-8 rounded-2xl border border-white/5 hover:border-primary/30 transition-colors group">
                <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold font-headline text-white mb-3">{feature.title}</h3>
                <p className="text-on-surface-variant text-sm leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof / CTA */}
      <section className="py-24 relative">
        <div className="absolute inset-0 bg-primary/5" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <h2 className="text-4xl md:text-6xl font-black font-headline tracking-tighter italic uppercase text-white mb-8">
            Ready to upgrade your facility?
          </h2>
          <p className="text-xl text-on-surface-variant mb-12">
            Join the fastest-growing network of automated fitness centers. Let us handle the software so you can focus on the hardware.
          </p>
          <ul className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-12">
            {['No credit card required', '14-day free trial', 'Cancel anytime'].map((benefit, i) => (
              <li key={i} className="flex items-center gap-2 text-sm font-medium text-white/80">
                <CheckCircle2 className="text-primary" size={18} />
                {benefit}
              </li>
            ))}
          </ul>
          <Link
            to="/login"
            className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-bright text-on-primary-fixed px-10 py-5 rounded-full font-headline font-black text-lg uppercase tracking-widest transition-all hover:scale-105 shadow-xl shadow-primary/20"
          >
            Create Your Account
            <ChevronRight size={24} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-surface-container border-t border-white/5 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <h2 className="font-headline font-black text-xl italic tracking-tighter text-white">
              MUST<span className="text-primary">GYM</span>
            </h2>
            <span className="text-on-surface-variant text-sm ml-2">© {new Date().getFullYear()}</span>
          </div>
          <div className="flex gap-6">
            <Link to="/login" className="text-on-surface-variant hover:text-white text-sm">Terms of Service</Link>
            <Link to="/login" className="text-on-surface-variant hover:text-white text-sm">Privacy Policy</Link>
            <Link to="/login" className="text-on-surface-variant hover:text-white text-sm">Contact Support</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
