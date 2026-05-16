import React, { useState, useEffect } from 'react';
import { Megaphone, Plus, Trash2, AlertTriangle, CalendarDays, Info, Activity } from 'lucide-react';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Announcement } from '../types';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export default function AnnouncementsManagementTab({ profile, gymInfo }: { profile: any; gymInfo: any }) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState<Partial<Announcement>>({
    title: '',
    message: '',
    type: 'info',
    priority: 'normal',
    imageUrl: '',
    expiryDate: ''
  });

  useEffect(() => {
    if (!profile?.gymId) return;
    const q = query(collection(db, 'announcements'), where('gymId', '==', profile.gymId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Announcement));
      data.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setAnnouncements(data);
    });
    return () => unsubscribe();
  }, [profile?.gymId]);

  const handleCreate = async () => {
    if (!form.title || !form.message || !profile?.gymId) return toast.error('Check required fields');
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'announcements'), {
        gymId: profile.gymId,
        title: form.title,
        message: form.message,
        content: form.message,
        type: form.type || 'info',
        priority: form.priority || 'normal',
        imageUrl: form.imageUrl || '',
        createdAt: new Date().toISOString(),
        expiryDate: form.expiryDate || '',
        createdBy: profile.uid,
      });
      toast.success('Announcement broadcasted');
      setShowModal(false);
      setForm({ title: '', message: '', type: 'info', priority: 'normal', imageUrl: '', expiryDate: '' });
    } catch (e: any) {
      console.error(e);
      toast.error('Failed to post announcement: ' + e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteAnnouncement = async (id: string) => {
    if(!window.confirm('Delete this announcement?')) return;
    try {
      await deleteDoc(doc(db, 'announcements', id));
      toast.success('Deleted');
    } catch(e) {
      toast.error('Failed to delete');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-surface-container-high p-6 rounded-2xl border border-white/5">
        <div>
          <h3 className="font-headline text-2xl font-black uppercase tracking-tight flex items-center gap-2">
            <Megaphone className="text-primary" /> Gym Announcements
          </h3>
          <p className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold mt-1">
            Broadcast messages, alerts, and events to all members.
          </p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-primary text-on-primary-fixed px-5 py-2.5 rounded-xl font-bold uppercase text-[10px] tracking-widest hover:scale-105 transition-all flex items-center gap-2 w-full md:w-auto mt-4 md:mt-0"
        >
          <Plus size={16} /> Broadcast 
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {announcements.map((ann) => (
          <div key={ann.id} className="bg-surface-container-low rounded-xl border border-white/5 relative group overflow-hidden flex flex-col">
            {ann.imageUrl && (
              <div className="h-32 w-full overflow-hidden shrink-0">
                 <img src={ann.imageUrl} alt={ann.title} className="w-full h-full object-cover opacity-80" />
              </div>
            )}
            <div className="p-6 flex-1 flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div className="flex gap-2">
                    <div className={cn(
                    "px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest flex items-center gap-1",
                    ann.type === 'alert' ? "bg-error/10 text-error" : 
                    ann.type === 'event' ? "bg-primary/10 text-primary" : 
                    ann.type === 'maintenance' ? "bg-yellow-500/10 text-yellow-500" :
                    "bg-blue-500/10 text-blue-500"
                    )}>
                    {ann.type === 'alert' && <AlertTriangle size={12}/>}
                    {ann.type === 'event' && <CalendarDays size={12}/>}
                    {ann.type === 'maintenance' && <Activity size={12}/>}
                    {ann.type === 'info' && <Info size={12}/>}
                    {ann.type}
                    </div>
                </div>
                <button 
                  onClick={() => deleteAnnouncement(ann.id!)}
                  className="p-1.5 text-on-surface-variant hover:text-error hover:bg-error/10 rounded transition-all opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <h4 className="font-headline font-bold text-lg mb-2">{ann.title}</h4>
              <p className="text-sm text-on-surface-variant mb-4 flex-1 whitespace-pre-wrap">{ann.message}</p>
              
              <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-outline">
                <span>Posted {format(new Date(ann.createdAt), 'MMM dd')}</span>
                {ann.expiryDate && (
                  <span className="text-error">Expires {format(new Date(ann.expiryDate), 'MMM dd')}</span>
                )}
              </div>
            </div>
            {ann.priority === 'high' && <div className="absolute top-0 left-0 w-1 h-full bg-error pointer-events-none" />}
          </div>
        ))}

        {announcements.length === 0 && (
          <div className="col-span-full py-20 text-center bg-surface-container-low rounded-xl border border-dashed border-white/10">
            <Megaphone size={48} className="mx-auto text-outline mb-4 opacity-20" />
            <h3 className="font-headline font-black text-xl mb-1 uppercase italic text-white">No active broadcasts</h3>
            <p className="text-on-surface-variant text-sm">Post an announcement to keep your members informed.</p>
          </div>
        )}
      </div>

       <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-background/90 backdrop-blur-sm" onClick={() => setShowModal(false)} />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative bg-surface-container max-w-lg w-full rounded-2xl p-6 shadow-2xl border border-white/10">
              <h3 className="font-headline font-black text-2xl uppercase tracking-tight mb-6 flex items-center gap-2"><Megaphone size={24} className="text-primary"/> New Broadcast</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-primary mb-1">Title</label>
                  <input type="text" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full bg-background border border-white/5 rounded-lg p-3 text-sm focus:border-primary/50 outline-none" placeholder="e.g. Holiday Hours" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-primary mb-1">Message</label>
                  <textarea value={form.message} onChange={e => setForm({...form, message: e.target.value})} className="w-full bg-background border border-white/5 rounded-lg p-3 text-sm focus:border-primary/50 outline-none h-24" placeholder="Important details..." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-primary mb-1">Type</label>
                    <select value={form.type} onChange={e => setForm({...form, type: e.target.value as any})} className="w-full bg-background border border-white/5 rounded-lg p-3 text-sm focus:border-primary/50 outline-none">
                      <option value="info">Information</option>
                      <option value="alert">Alert / Warning</option>
                      <option value="event">Event</option>
                      <option value="maintenance">Maintenance</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-primary mb-1">Priority</label>
                    <select value={form.priority} onChange={e => setForm({...form, priority: e.target.value as any})} className="w-full bg-background border border-white/5 rounded-lg p-3 text-sm focus:border-primary/50 outline-none">
                      <option value="low">Low (Standard)</option>
                      <option value="normal">Normal (Highlighted)</option>
                      <option value="high">High (Urgent)</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-primary mb-1">Image URL (Optional)</label>
                    <input type="text" value={form.imageUrl} onChange={e => setForm({...form, imageUrl: e.target.value})} className="w-full bg-background border border-white/5 rounded-lg p-3 text-sm focus:border-primary/50 outline-none" placeholder="https://..." />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-primary mb-1">Auto-Expire Date (Optional)</label>
                    <input type="date" value={form.expiryDate} onChange={e => setForm({...form, expiryDate: e.target.value})} className="w-full bg-background border border-white/5 rounded-lg p-3 text-sm focus:border-primary/50 outline-none" />
                  </div>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button onClick={() => setShowModal(false)} className="px-4 py-2 rounded-lg text-sm font-bold text-on-surface-variant hover:bg-white/5 transition-colors">Cancel</button>
                <button disabled={isSubmitting} onClick={handleCreate} className="bg-primary text-on-primary px-6 py-2 rounded-lg text-sm font-bold uppercase tracking-widest">{isSubmitting ? 'Posting...' : 'Broadcast Now'}</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
