import React, { useState, useEffect } from 'react';
import { IndianRupee, Download, Plus, CheckCircle, XCircle, Search, Eye } from 'lucide-react';
import { collection, query, where, onSnapshot, doc, updateDoc, deleteDoc, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { PaymentVerificationRequest, PaymentRecord } from '../types';
import { toast } from 'sonner';
import { format, addMonths } from 'date-fns';

export default function PaymentsManagementTab({ profile, gymInfo, exportToCSV }: { profile: any; gymInfo: any; exportToCSV: any }) {
  const [requests, setRequests] = useState<PaymentVerificationRequest[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);

  useEffect(() => {
    if (!profile?.gymId) return;
    
    const unsub1 = onSnapshot(query(collection(db, 'paymentRequests'), where('gymId', '==', profile.gymId)), (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as PaymentVerificationRequest));
      data.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setRequests(data);
    });

    const unsub2 = onSnapshot(query(collection(db, 'payments'), where('gymId', '==', profile.gymId)), (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as PaymentRecord));
      data.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setPayments(data);
    });

    return () => { unsub1(); unsub2(); };
  }, [profile?.gymId]);

  const handleApprove = async (req: PaymentVerificationRequest) => {
    try {
      // update user membership
      const userRef = doc(db, 'users', req.userId);
      const newExpiry = addMonths(new Date(), req.planDurationMonths || 1).toISOString();
      await updateDoc(userRef, {
        membershipStatus: 'active',
        membershipExpiry: newExpiry,
        updatedAt: new Date().toISOString()
      });

      // record payment
      await addDoc(collection(db, 'payments'), {
        gymId: req.gymId,
        userId: req.userId,
        amount: req.amountPaid,
        method: req.paymentMethod,
        date: new Date().toISOString(),
        status: 'paid'
      });

      // update request status
      await updateDoc(doc(db, 'paymentRequests', req.id!), {
        status: 'approved',
        reviewedAt: new Date().toISOString()
      });

      toast.success('Payment approved and membership extended!');
    } catch(e) {
      toast.error('Failed to approve');
    }
  };

  const handleReject = async (req: PaymentVerificationRequest) => {
    try {
      await updateDoc(doc(db, 'paymentRequests', req.id!), {
        status: 'rejected',
        reviewedAt: new Date().toISOString()
      });
      toast.success('Payment rejected');
    } catch(e) {
       toast.error('Failed to reject');
    }
  };

  return (
    <div className="space-y-12">
      <div>
        <h3 className="font-headline text-xl font-black uppercase tracking-tight mb-4">Pending Verifications</h3>
        <div className="bg-surface-container rounded-2xl border border-white/5 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-surface-container-highest/50 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                  <tr>
                    <th className="px-6 py-4">Submitted</th>
                    <th className="px-6 py-4">Member Name</th>
                    <th className="px-6 py-4">Amount & Method</th>
                    <th className="px-6 py-4">Plan Duration</th>
                    <th className="px-6 py-4">Note / Screenshot</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {requests.filter(r => r.status === 'pending').map((req) => (
                    <tr key={req.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4 text-xs font-bold">{format(new Date(req.createdAt), 'MMM dd, HH:mm')}</td>
                      <td className="px-6 py-4 font-headline uppercase italic font-bold">{req.userName}</td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-black text-green-400 font-mono">₹{req.amountPaid}</div>
                        <div className="text-[10px] text-on-surface-variant uppercase tracking-widest">{req.paymentMethod}</div>
                      </td>
                      <td className="px-6 py-4 text-xs font-bold text-on-surface">{req.planDurationMonths || 1} Month(s)</td>
                      <td className="px-6 py-4">
                         <div className="text-xs text-on-surface-variant max-w-xs truncate">{req.transactionNote || '-'}</div>
                         {req.screenshotUrl && <a href={req.screenshotUrl} target="_blank" className="text-[10px] uppercase tracking-widest text-primary flex items-center mt-1">View Screenshot <Eye size={12} className="ml-1"/></a>}
                      </td>
                      <td className="px-6 py-4">
                         <div className="flex gap-2 justify-end">
                            <button onClick={() => handleApprove(req)} className="bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white px-3 py-1.5 rounded text-[10px] uppercase font-black tracking-widest transition-colors flex items-center gap-1"><CheckCircle size={14}/> Approve</button>
                            <button onClick={() => handleReject(req)} className="bg-error/10 text-error hover:bg-error hover:text-white px-3 py-1.5 rounded text-[10px] uppercase font-black tracking-widest transition-colors flex items-center gap-1"><XCircle size={14}/> Reject</button>
                         </div>
                      </td>
                    </tr>
                  ))}
                  {requests.filter(r => r.status === 'pending').length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-on-surface-variant text-sm italic">
                        No pending verification requests.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
        </div>
      </div>

      <div>
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-4">
            <h3 className="font-headline text-xl font-bold uppercase tracking-tight">Payment History</h3>
            <div className="flex gap-4 w-full md:w-auto">
              <button 
                onClick={() => exportToCSV(payments, 'payment_records')}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-surface-container-highest rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 transition-all"
              >
                <Download size={14} />
                Export CSV
              </button>
            </div>
          </div>
          <div className="bg-surface-container-low rounded-lg overflow-hidden border border-white/5">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-surface-container-highest/50 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                  <tr>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4">Method</th>
                    <th className="px-6 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 whitespace-nowrap">
                  {payments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4 text-xs text-on-surface-variant text-bold">
                        {format(new Date(payment.date), 'MMM dd, yyyy HH:mm')}
                      </td>
                      <td className="px-6 py-4 font-mono font-black text-white">
                        ₹{payment.amount}
                      </td>
                      <td className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                        {payment.method}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded ${
                          payment.status === 'paid' ? 'bg-green-500/10 text-green-500' : 
                          payment.status === 'failed' ? 'bg-error/10 text-error' : 'bg-primary/10 text-primary'
                        }`}>
                          {payment.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {payments.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-on-surface-variant text-sm">
                        No payment records found. 
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
      </div>
    </div>
  );
}
