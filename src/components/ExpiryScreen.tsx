import React, { useState } from 'react';
import { AlertTriangle, IndianRupee, UploadCloud, MessageCircle, Clock } from 'lucide-react';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { toast } from 'sonner';
import { motion } from 'motion/react';
import { PaymentVerificationRequest } from '../types';

export function ExpiryScreen({ profile, gymInfo }: { profile: any, gymInfo: any }) {
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    amountPaid: '',
    paymentMethod: 'UPI',
    transactionNote: '',
    planDurationMonths: 1
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.uid || !profile?.gymId) return;
    
    if (!form.amountPaid || isNaN(Number(form.amountPaid))) {
      return toast.error('Please enter a valid amount');
    }

    setIsSubmitting(true);
    try {
      const payload: PaymentVerificationRequest = {
        gymId: profile.gymId,
        userId: profile.uid,
        userName: profile.displayName || 'Member',
        amountPaid: Number(form.amountPaid),
        paymentMethod: form.paymentMethod as any,
        transactionNote: form.transactionNote,
        status: 'pending',
        createdAt: new Date().toISOString(),
        planDurationMonths: Number(form.planDurationMonths)
      };

      await addDoc(collection(db, 'paymentRequests'), payload);
      toast.success('Payment request submitted. Awaiting approval.');
      setShowPaymentForm(false);
    } catch (error) {
      toast.error('Failed to submit request');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 md:p-12 min-h-[70vh] flex flex-col items-center justify-center text-center">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-surface-container rounded-3xl p-8 border border-error/20 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-error/10 rounded-full blur-3xl pointer-events-none" />
        
        <AlertTriangle className="w-16 h-16 text-error mx-auto mb-6" />
        <h2 className="text-3xl font-black font-headline text-white mb-2 uppercase italic tracking-tighter">Membership Expired</h2>
        <p className="text-on-surface-variant text-sm mb-8 leading-relaxed">
          Your access to {gymInfo?.name || 'the gym'} has been restricted. Please renew your membership to continue your fitness journey and restore access to the app features.
        </p>

        {!showPaymentForm ? (
          <div className="space-y-3">
            <button 
              onClick={() => setShowPaymentForm(true)}
              className="w-full bg-primary text-on-primary-fixed py-4 rounded-xl font-bold uppercase tracking-widest text-xs hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
            >
              <IndianRupee size={16} /> I Have Already Paid
            </button>
            <button 
              onClick={() => {
                const phone = gymInfo?.whatsapp || gymInfo?.phone;
                if (phone) {
                  window.open(`https://wa.me/${phone}?text=Hi, I would like to renew my membership.`);
                } else {
                  toast.error('No contact details available for this gym.');
                }
              }}
              className="w-full bg-white/5 border border-white/10 text-white py-4 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-white/10 transition-all flex items-center justify-center gap-2"
            >
              <MessageCircle size={16} /> Contact Gym Support
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="text-left space-y-4">
            <h4 className="font-headline font-black text-lg text-primary uppercase italic">Verify Payment</h4>
            <div>
              <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2 ml-1">Amount Paid (₹)</label>
              <input 
                type="number" 
                required
                value={form.amountPaid}
                onChange={e => setForm({...form, amountPaid: e.target.value})}
                className="w-full bg-background border border-white/5 rounded-xl py-3 px-4 text-sm font-bold focus:border-primary/50 outline-none"
              />
            </div>
            <div>
               <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2 ml-1">Payment Method</label>
               <select 
                  value={form.paymentMethod}
                  onChange={e => setForm({...form, paymentMethod: e.target.value})}
                  className="w-full bg-background border border-white/5 rounded-xl py-3 px-4 text-sm font-bold focus:border-primary/50 outline-none"
                >
                  <option value="UPI">UPI / GPay / PhonePe</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cash">Cash (In-person)</option>
                  <option value="Card">Card Swipe</option>
                </select>
            </div>
             <div>
               <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2 ml-1">Plan Duration (Months)</label>
               <select 
                  value={form.planDurationMonths}
                  onChange={e => setForm({...form, planDurationMonths: Number(e.target.value)})}
                  className="w-full bg-background border border-white/5 rounded-xl py-3 px-4 text-sm font-bold focus:border-primary/50 outline-none"
                >
                  <option value={1}>1 Month</option>
                  <option value={3}>3 Months</option>
                  <option value={6}>6 Months</option>
                  <option value={12}>1 Year</option>
                </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2 ml-1">Transaction Note (Optional)</label>
              <input 
                type="text" 
                value={form.transactionNote}
                onChange={e => setForm({...form, transactionNote: e.target.value})}
                placeholder="e.g. UTR or Ref number"
                className="w-full bg-background border border-white/5 rounded-xl py-3 px-4 text-sm focus:border-primary/50 outline-none"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button 
                type="button" 
                onClick={() => setShowPaymentForm(false)}
                className="flex-1 bg-white/5 hover:bg-white/10 text-white py-3 rounded-xl font-bold uppercase tracking-widest text-xs transition-colors"
                disabled={isSubmitting}
              >
                Back
              </button>
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="flex-1 bg-primary text-on-primary-fixed py-3 rounded-xl font-bold uppercase tracking-widest text-xs hover:scale-[1.02] transition-all flex justify-center items-center gap-2"
              >
                {isSubmitting ? <Clock className="animate-spin" size={16}/> : 'Submit Details'}
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
}
