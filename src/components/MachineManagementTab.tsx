import React, { useState, useEffect } from 'react';
import { Plus, Wrench, Settings, Search, Edit3, Trash2, CalendarDays } from 'lucide-react';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Machine } from '../types';
import { toast } from 'sonner';

export default function MachineManagementTab({ profile, gymInfo }: { profile: any; gymInfo: any }) {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [search, setSearch] = useState('');

  const [form, setForm] = useState<Partial<Machine>>({
    name: '', type: 'Cardio', brand: '', setupDate: new Date().toISOString().split('T')[0], condition: 'Excellent', notes: '', imageUrl: ''
  });

  useEffect(() => {
    if (!profile?.gymId) return;
    const q = query(collection(db, 'equipment'), where('gymId', '==', profile.gymId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMachines(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Machine)));
    });
    return () => unsubscribe();
  }, [profile?.gymId]);

  const handleSave = async () => {
    if (!form.name || !form.type || !profile?.gymId) return toast.error('Name and Type required.');
    try {
      await addDoc(collection(db, 'equipment'), {
        ...form,
        gymId: profile.gymId
      });
      toast.success('Machine added');
      setShowAddModal(false);
      setForm({ name: '', type: 'Cardio', brand: '', setupDate: new Date().toISOString().split('T')[0], condition: 'Excellent', notes: '', imageUrl: '' });
    } catch(e) {
      toast.error('Failed to add machine');
    }
  };

  const updateCondition = async (id: string, condition: string) => {
    try {
      await updateDoc(doc(db, 'equipment', id), { condition });
      toast.success('Condition updated');
    } catch(e) {
      toast.error('Failed to update condition');
    }
  };

  const deleteMachine = async (id: string) => {
    if(!window.confirm('Delete this machine?')) return;
    try {
      await deleteDoc(doc(db, 'equipment', id));
      toast.success('Machine deleted');
    } catch(e) {
      toast.error('Failed to delete machine');
    }
  };

  const filteredMachines = machines.filter(m => m.name.toLowerCase().includes(search.toLowerCase()) || m.type.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-surface-container-high p-6 rounded-2xl border border-white/5">
        <div>
          <h3 className="font-headline text-2xl font-black uppercase tracking-tight flex items-center gap-2">
            <Settings className="text-primary" /> Machine Management
          </h3>
          <p className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold mt-1">
            Track equipment condition, servicing, and inventory.
          </p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" size={16} />
            <input 
              type="text" 
              placeholder="Search machines..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-background border border-white/10 text-on-surface py-2.5 pl-10 pr-4 rounded-xl focus:border-primary/50 text-sm outline-none"
            />
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-primary text-on-primary-fixed px-5 py-2.5 rounded-xl font-bold uppercase text-[10px] tracking-widest hover:scale-105 transition-all flex items-center gap-2"
          >
            <Plus size={16} /> Add 
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMachines.map(machine => (
          <div key={machine.id} className="bg-surface-container rounded-2xl border border-white/5 overflow-hidden group hover:border-primary/30 transition-all flex flex-col">
            <div className="h-40 bg-surface-container-high relative overflow-hidden flex items-center justify-center">
              {machine.imageUrl ? (
                <img src={machine.imageUrl} alt={machine.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
              ) : (
                <Wrench size={48} className="text-white/10" />
              )}
               <div className="absolute top-3 right-3">
                 <span className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest border ${
                  machine.condition === 'Excellent' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 
                  machine.condition === 'Good' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' : 
                  machine.condition === 'Needs Maintenance' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20 animate-pulse' : 
                  'bg-red-500/10 text-red-500 border-red-500/20'
                 }`}>
                   {machine.condition}
                 </span>
               </div>
            </div>
            <div className="p-5 flex-1 flex flex-col">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-headline font-black text-xl uppercase tracking-tight">{machine.name}</h4>
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">{machine.brand} • {machine.type}</span>
                </div>
              </div>
              
              <div className="mt-4 space-y-2 bg-background/50 p-3 rounded-lg border border-white/5">
                <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                  <CalendarDays size={14} className="text-primary" /> 
                  <span className="font-bold">Setup:</span> {new Date(machine.setupDate).toLocaleDateString()}
                </div>
                {machine.lastServiceDate && (
                  <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                    <Wrench size={14} className="text-blue-500" /> 
                    <span className="font-bold">Last Service:</span> {new Date(machine.lastServiceDate).toLocaleDateString()}
                  </div>
                )}
              </div>

              {machine.notes && (
                <p className="mt-3 text-xs text-on-surface-variant italic line-clamp-2">{machine.notes}</p>
              )}

              <div className="mt-auto pt-4 flex gap-2">
                <select 
                  value={machine.condition}
                  onChange={(e) => updateCondition(machine.id!, e.target.value)}
                  className="flex-1 bg-surface-container-high border border-white/5 rounded-lg py-2 px-2 text-[10px] font-bold uppercase tracking-widest text-on-surface outline-none"
                >
                  <option value="Excellent">Excellent</option>
                  <option value="Good">Good</option>
                  <option value="Needs Maintenance">Needs Maint.</option>
                  <option value="Out of Order">Out of Order</option>
                </select>
                <button onClick={() => deleteMachine(machine.id!)} className="p-2 border border-error/20 bg-error/10 text-error rounded-lg hover:bg-error hover:text-white transition-colors">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}

        {filteredMachines.length === 0 && (
          <div className="col-span-full py-12 text-center border-2 border-dashed border-white/10 rounded-2xl bg-surface-container/30">
            <Wrench size={48} className="mx-auto text-on-surface-variant opacity-50 mb-4" />
            <h3 className="font-headline font-black text-xl text-white uppercase italic tracking-tight">No Machines Found</h3>
            <p className="text-sm text-on-surface-variant mt-1">Start adding your equipment inventory.</p>
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-background/90 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
          <div className="relative bg-surface-container max-w-lg w-full rounded-2xl p-6 shadow-2xl border border-white/10">
            <h3 className="font-headline font-black text-2xl uppercase tracking-tight mb-6">Add Machine</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-primary mb-1">Name</label>
                  <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full bg-background border border-white/5 rounded-lg p-3 text-sm focus:border-primary/50 outline-none" placeholder="e.g. Leg Press" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-primary mb-1">Brand</label>
                  <input type="text" value={form.brand} onChange={e => setForm({...form, brand: e.target.value})} className="w-full bg-background border border-white/5 rounded-lg p-3 text-sm focus:border-primary/50 outline-none" placeholder="e.g. Cybex" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-primary mb-1">Type</label>
                  <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="w-full bg-background border border-white/5 rounded-lg p-3 text-sm focus:border-primary/50 outline-none">
                    <option value="Cardio">Cardio</option>
                    <option value="Strength">Strength (Machines)</option>
                    <option value="Free Weights">Free Weights</option>
                    <option value="Cables">Cables</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-primary mb-1">Condition</label>
                  <select value={form.condition} onChange={e => setForm({...form, condition: e.target.value as any})} className="w-full bg-background border border-white/5 rounded-lg p-3 text-sm focus:border-primary/50 outline-none">
                    <option value="Excellent">Excellent</option>
                    <option value="Good">Good</option>
                    <option value="Needs Maintenance">Needs Maintenance</option>
                    <option value="Out of Order">Out of Order</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-primary mb-1">Setup Date</label>
                  <input type="date" value={form.setupDate} onChange={e => setForm({...form, setupDate: e.target.value})} className="w-full bg-background border border-white/5 rounded-lg p-3 text-sm focus:border-primary/50 outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-primary mb-1">Image URL</label>
                   <input type="text" value={form.imageUrl} onChange={e => setForm({...form, imageUrl: e.target.value})} className="w-full bg-background border border-white/5 rounded-lg p-3 text-sm focus:border-primary/50 outline-none" placeholder="https://..." />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-primary mb-1">Notes</label>
                <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className="w-full bg-background border border-white/5 rounded-lg p-3 text-sm focus:border-primary/50 outline-none h-20" placeholder="..." />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setShowAddModal(false)} className="px-4 py-2 rounded-lg text-sm font-bold text-on-surface-variant hover:bg-white/5 transition-colors">Cancel</button>
              <button onClick={handleSave} className="bg-primary text-on-primary px-6 py-2 rounded-lg text-sm font-bold uppercase tracking-widest">Save Machine</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
