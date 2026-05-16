import React, { useState } from 'react';
import { Building2, Shield, QrCode, Share2, Copy, Palette } from 'lucide-react';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { toast } from 'sonner';

export default function OwnerSettingsTab({ gymInfo }: { gymInfo: any }) {
  const [localGym, setLocalGym] = React.useState(gymInfo || {});
  React.useEffect(() => {
    if (gymInfo) setLocalGym(gymInfo);
  }, [gymInfo]);

  if (!gymInfo) return null;

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
          <Building2 size={24} className="text-primary" />
        </div>
        <div>
          <h3 className="font-headline font-black text-3xl uppercase italic">
            Platform Configuration
          </h3>
          <p className="text-on-surface-variant text-sm">
            Manage gym operations, branding, and core infrastructure.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Gym Information */}
        <div className="bg-surface-container-high p-6 rounded-2xl border border-white/5 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
          <h4 className="text-sm font-black uppercase tracking-[0.2em] text-primary mb-6 flex items-center gap-2 relative z-10">
            <Building2 size={16} /> Facility Information
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 relative z-10">
            <div>
              <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2">Facility Name</label>
              <input 
                type="text" 
                value={localGym.name || ''}
                onChange={(e) => setLocalGym({...localGym, name: e.target.value})}
                onBlur={async (e) => {
                  if (e.target.value && e.target.value !== gymInfo.name) {
                    try {
                      await updateDoc(doc(db, 'gyms', gymInfo.id), { name: e.target.value });
                      toast.success('Facility name updated');
                    } catch (error) { toast.error('Failed to update'); }
                  }
                }}
                className="w-full bg-background/50 border border-white/5 rounded-xl py-3 px-4 text-sm font-bold focus:border-primary/50 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2">Branch Name</label>
              <input 
                type="text" 
                value={localGym.branchName || ''}
                onChange={(e) => setLocalGym({...localGym, branchName: e.target.value})}
                onBlur={async (e) => {
                  if (e.target.value !== gymInfo.branchName) {
                    try {
                      await updateDoc(doc(db, 'gyms', gymInfo.id), { branchName: e.target.value });
                      toast.success('Branch name updated');
                    } catch (error) { toast.error('Failed to update'); }
                  }
                }}
                className="w-full bg-background/50 border border-white/5 rounded-xl py-3 px-4 text-sm font-bold focus:border-primary/50 outline-none"
                placeholder="e.g. Downtown Central"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2">Address</label>
              <input 
                type="text" 
                value={localGym.address || ''}
                onChange={(e) => setLocalGym({...localGym, address: e.target.value})}
                onBlur={async (e) => {
                  if (e.target.value !== gymInfo.address) {
                    try { await updateDoc(doc(db, 'gyms', gymInfo.id), { address: e.target.value }); toast.success('Updated'); } catch (e) {}
                  }
                }}
                className="w-full bg-background/50 border border-white/5 rounded-xl py-3 px-4 text-sm font-bold outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2">City</label>
              <input 
                type="text" 
                value={localGym.city || ''}
                onChange={(e) => setLocalGym({...localGym, city: e.target.value})}
                onBlur={async (e) => {
                  if (e.target.value !== gymInfo.city) {
                    try { await updateDoc(doc(db, 'gyms', gymInfo.id), { city: e.target.value }); toast.success('Updated'); } catch (e) {}
                  }
                }}
                className="w-full bg-background/50 border border-white/5 rounded-xl py-3 px-4 text-sm font-bold outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2">State</label>
              <input 
                type="text" 
                value={localGym.state || ''}
                onChange={(e) => setLocalGym({...localGym, state: e.target.value})}
                onBlur={async (e) => {
                  if (e.target.value !== gymInfo.state) {
                    try { await updateDoc(doc(db, 'gyms', gymInfo.id), { state: e.target.value }); toast.success('Updated'); } catch (e) {}
                  }
                }}
                className="w-full bg-background/50 border border-white/5 rounded-xl py-3 px-4 text-sm font-bold outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2">Phone</label>
              <input 
                type="text" 
                value={localGym.phone || ''}
                onChange={(e) => setLocalGym({...localGym, phone: e.target.value})}
                onBlur={async (e) => {
                  if (e.target.value !== gymInfo.phone) {
                    try { await updateDoc(doc(db, 'gyms', gymInfo.id), { phone: e.target.value }); toast.success('Updated'); } catch (e) {}
                  }
                }}
                className="w-full bg-background/50 border border-white/5 rounded-xl py-3 px-4 text-sm font-bold outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2">WhatsApp Line</label>
              <input 
                type="text" 
                value={localGym.whatsapp || ''}
                onChange={(e) => setLocalGym({...localGym, whatsapp: e.target.value})}
                onBlur={async (e) => {
                  if (e.target.value !== gymInfo.whatsapp) {
                    try { await updateDoc(doc(db, 'gyms', gymInfo.id), { whatsapp: e.target.value }); toast.success('Updated'); } catch (e) {}
                  }
                }}
                className="w-full bg-background/50 border border-white/5 rounded-xl py-3 px-4 text-sm font-bold outline-none"
              />
            </div>
            <div className="md:col-span-2 space-y-4">
              <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2">Weekly Schedule</label>
              <div className="space-y-2">
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day, idx) => {
                  const schedule = localGym.weeklyTimings?.[day] || { isOpen: true, open: '06:00', close: '22:00' };
                  return (
                    <div key={day} className="flex items-center gap-4 bg-background/50 p-3 rounded-xl border border-white/5">
                      <div className="flex items-center gap-2 w-32">
                        <input 
                          type="checkbox" 
                          checked={schedule.isOpen}
                          onChange={async (e) => {
                            const newTimings = { ...(localGym.weeklyTimings || {}) };
                            newTimings[day] = { ...schedule, isOpen: e.target.checked };
                            const newGym = { ...localGym, weeklyTimings: newTimings };
                            setLocalGym(newGym);
                            try { await updateDoc(doc(db, 'gyms', gymInfo.id), { weeklyTimings: newTimings }); toast.success('Schedule updated'); } catch (err) { toast.error('Failed to update schedule'); }
                          }}
                          className="w-4 h-4 rounded border-white/10 bg-background accent-primary"
                        />
                        <span className={`text-sm font-bold ${schedule.isOpen ? 'text-white' : 'text-on-surface-variant line-through'}`}>{day}</span>
                      </div>
                      
                      {schedule.isOpen ? (
                        <div className="flex items-center gap-2 flex-1">
                          <input 
                            type="time" 
                            value={schedule.open}
                            onChange={async (e) => {
                              const newTimings = { ...(localGym.weeklyTimings || {}) };
                              newTimings[day] = { ...schedule, open: e.target.value };
                              const newGym = { ...localGym, weeklyTimings: newTimings };
                              setLocalGym(newGym);
                              try { await updateDoc(doc(db, 'gyms', gymInfo.id), { weeklyTimings: newTimings }); toast.success('Schedule updated'); } catch (err) { toast.error('Failed to update schedule'); }
                            }}
                            className="bg-transparent border border-white/10 rounded-lg px-2 py-1 text-sm font-bold outline-none focus:border-primary/50 text-white"
                          />
                          <span className="text-on-surface-variant text-xs">to</span>
                          <input 
                            type="time" 
                            value={schedule.close}
                            onChange={async (e) => {
                              const newTimings = { ...(localGym.weeklyTimings || {}) };
                              newTimings[day] = { ...schedule, close: e.target.value };
                              const newGym = { ...localGym, weeklyTimings: newTimings };
                              setLocalGym(newGym);
                              try { await updateDoc(doc(db, 'gyms', gymInfo.id), { weeklyTimings: newTimings }); toast.success('Schedule updated'); } catch (err) { toast.error('Failed to update schedule'); }
                            }}
                            className="bg-transparent border border-white/10 rounded-lg px-2 py-1 text-sm font-bold outline-none focus:border-primary/50 text-white"
                          />
                        </div>
                      ) : (
                        <div className="flex-1 text-xs font-bold text-error uppercase tracking-widest">Closed</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Subscriptions & Limits */}
        <div className="space-y-6">
          <div className="bg-surface-container-high p-6 rounded-2xl border border-white/5 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
            <h4 className="text-sm font-black uppercase tracking-[0.2em] text-blue-400 mb-6 flex items-center gap-2 relative z-10">
              <Shield size={16} /> License & Limits
            </h4>
            <div className="grid grid-cols-2 gap-4 relative z-10">
              <div className="bg-background/40 p-4 rounded-xl border border-white/5">
                <p className="text-[8px] font-black text-on-surface-variant uppercase tracking-widest mb-1">Current License</p>
                <span className="font-headline font-black text-xl text-blue-400 uppercase italic leading-none block">{gymInfo.subscriptionTier || 'Starter'}</span>
                {/* Upgrade logic usually opens modal, omitted here or handle as needed */}
              </div>
              <div className="bg-background/40 p-4 rounded-xl border border-white/5">
                <p className="text-[8px] font-black text-on-surface-variant uppercase tracking-widest mb-1">Total Capacity</p>
                <input 
                  type="number"
                  value={localGym.capacity || 100}
                  onChange={(e) => setLocalGym({...localGym, capacity: Number(e.target.value)})}
                  onBlur={async (e) => {
                    if (Number(e.target.value) !== gymInfo.capacity) {
                      try { await updateDoc(doc(db, 'gyms', gymInfo.id), { capacity: Number(e.target.value) }); toast.success('Updated'); } catch (e) {}
                    }
                  }}
                  className="w-full bg-transparent font-headline font-black text-2xl text-white outline-none"
                />
              </div>
            </div>
          </div>

          {/* Core Networking */}
          <div className="bg-surface-container-high p-6 rounded-2xl border border-white/5 shadow-xl relative overflow-hidden">
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-green-500/5 rounded-full blur-3xl pointer-events-none" />
            <h4 className="text-sm font-black uppercase tracking-[0.2em] text-green-500 mb-6 flex items-center gap-2 relative z-10">
              <QrCode size={16} /> Core Network
            </h4>
            
            <div className="space-y-4 relative z-10">
              <div className="bg-background/40 p-4 rounded-xl border border-white/5 flex items-center justify-between">
                <div>
                  <p className="text-[8px] font-black text-on-surface-variant uppercase tracking-widest mb-1">Infrastructure ID</p>
                  <p className="font-mono text-sm font-bold text-white tracking-widest">{gymInfo.id}</p>
                </div>
                <button onClick={() => { navigator.clipboard.writeText(gymInfo.id); toast.success('Copied ID'); }} className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/50 hover:text-white">
                  <Copy size={16} />
                </button>
              </div>

              <div className="bg-background/40 p-4 rounded-xl border border-white/5 flex items-center justify-between">
                <div className="max-w-[70%]">
                  <p className="text-[8px] font-black text-on-surface-variant uppercase tracking-widest mb-1">Member Access Portal</p>
                  <p className="font-mono text-[10px] text-white/70 truncate">{`${window.location.origin}/memberlogin?gym=${gymInfo.id}`}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => {
                    const link = `${window.location.origin}/memberlogin?gym=${gymInfo.id}`;
                    window.open(`https://wa.me/?text=${encodeURIComponent(`Join ${gymInfo.name} on MustGym App! Login here: ${link}`)}`, '_blank');
                  }} className="p-2 hover:bg-green-500/20 text-green-500 rounded-lg transition-colors">
                    <Share2 size={16} />
                  </button>
                  <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/memberlogin?gym=${gymInfo.id}`); toast.success('Copied URL'); }} className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/50 hover:text-white">
                    <Copy size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Branding */}
        <div className="bg-surface-container-high p-6 rounded-2xl border border-white/5 shadow-xl lg:col-span-2 relative overflow-hidden">
          <div className="absolute top-0 right-1/2 w-64 h-64 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />
          <h4 className="text-sm font-black uppercase tracking-[0.2em] text-orange-500 mb-6 flex items-center gap-2 relative z-10">
            <Palette size={16} /> Brand Experience
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
            <div>
              <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2">Logo URL</label>
              <input 
                type="text" 
                value={localGym.logoUrl || ''}
                onChange={(e) => setLocalGym({...localGym, logoUrl: e.target.value})}
                onBlur={async (e) => {
                  if (e.target.value !== gymInfo.logoUrl) {
                    try { await updateDoc(doc(db, 'gyms', gymInfo.id), { logoUrl: e.target.value }); toast.success('Updated'); } catch (e) {}
                  }
                }}
                className="w-full bg-background/50 border border-white/5 rounded-xl py-3 px-4 text-sm font-bold outline-none"
                placeholder="https://..."
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2">Theme Identity Color (HEX)</label>
              <div className="flex gap-2">
                  <input 
                  type="color" 
                  value={localGym.brandingColor || '#FF8F6F'}
                  onChange={(e) => setLocalGym({...localGym, brandingColor: e.target.value})}
                  onBlur={async (e) => {
                    if (e.target.value !== gymInfo.brandingColor) {
                      try { await updateDoc(doc(db, 'gyms', gymInfo.id), { brandingColor: e.target.value }); toast.success('Updated Theme'); } catch (e) {}
                    }
                  }}
                  className="h-11 w-11 rounded-lg border-0 bg-transparent p-0 cursor-pointer"
                />
                <input 
                  type="text" 
                  readOnly
                  value={gymInfo.brandingColor || '#FF8F6F'}
                  className="flex-1 bg-background/50 border border-white/5 rounded-xl py-3 px-4 text-sm font-bold outline-none font-mono"
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2">Welcome Dispatch Message</label>
              <input 
                type="text" 
                value={localGym.welcomeMessage || ''}
                onChange={(e) => setLocalGym({...localGym, welcomeMessage: e.target.value})}
                onBlur={async (e) => {
                  if (e.target.value !== gymInfo.welcomeMessage) {
                    try { await updateDoc(doc(db, 'gyms', gymInfo.id), { welcomeMessage: e.target.value }); toast.success('Updated'); } catch (e) {}
                  }
                }}
                className="w-full bg-background/50 border border-white/5 rounded-xl py-3 px-4 text-sm font-bold outline-none"
                placeholder="Welcome to the Elite club!"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
