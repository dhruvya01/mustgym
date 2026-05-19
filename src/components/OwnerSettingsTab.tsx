import React, { useState } from 'react';
import { Building2, Shield, QrCode, Share2, Copy, Palette, Instagram, Facebook, Globe, Twitter, ListChecks, FileText, Check, Webhook, Activity } from 'lucide-react';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { toast } from 'sonner';
import { GYM_THEMES } from '../lib/themes';

export default function OwnerSettingsTab({ gymInfo }: { gymInfo: any }) {
  const [localGym, setLocalGym] = React.useState(gymInfo || {});
  const [logoPreviewError, setLogoPreviewError] = useState(false);

  React.useEffect(() => {
    if (gymInfo) {
      setLocalGym(gymInfo);
    }
  }, [gymInfo]);

  React.useEffect(() => {
    setLogoPreviewError(false);
  }, [localGym.logoUrl]);

  if (!gymInfo) return null;

  const amenitiesList = [
    'WiFi', 'Parking', 'Showers', 'Lockers', 'Water Cooler', 
    'Cafe', 'Personal Training', 'Group Classes', 'Air Conditioning', 'Steam Room'
  ];

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
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2">Facility Logo URL</label>
                <input 
                  type="text" 
                  value={localGym.logoUrl || ''}
                  onChange={(e) => setLocalGym({...localGym, logoUrl: e.target.value})}
                  onBlur={async (e) => {
                    if (e.target.value !== gymInfo.logoUrl) {
                      try { await updateDoc(doc(db, 'gyms', gymInfo.id), { logoUrl: e.target.value }); toast.success('Branding logo updated'); } catch (e) {}
                    }
                  }}
                  className="w-full bg-background/50 border border-white/5 rounded-xl py-3 px-4 text-xs font-bold outline-none focus:border-primary/50 transition-colors placeholder:text-neutral-600"
                  placeholder="e.g. https://res.cloudinary.com/... or any URL"
                />
                <span className="block text-[10px] text-on-surface-variant mt-2 leading-relaxed">
                  Provide any direct image link (from <strong>Cloudinary</strong>, Imgur, or your website). Make sure the URL starts with secure <span className="text-primary font-mono select-all">https://</span>.
                </span>
              </div>

              {/* Real-time Brand Preview Block */}
              <div className="p-4 rounded-xl bg-background/30 border border-white/5 space-y-3">
                <span className="block text-[9px] font-black uppercase tracking-[0.2em] text-on-surface-variant">Live Branding Preview</span>
                
                <div className="flex items-center gap-4">
                  {/* Option 1: Launcher Card view */}
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 bg-surface-container rounded-xl flex items-center justify-center border border-white/10 shadow-lg overflow-hidden shrink-0">
                      {localGym.logoUrl && !logoPreviewError ? (
                        <img 
                          src={localGym.logoUrl} 
                          alt="Gym Logo" 
                          onError={() => setLogoPreviewError(true)} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <img src="/logo.svg" alt="MustGym" className="w-8 h-8 object-contain" />
                      )}
                    </div>
                    <span className="text-[8px] font-bold text-on-surface-variant uppercase tracking-wider mt-1.5">Large Card</span>
                  </div>

                  {/* Option 2: Dashboard circular view */}
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center border border-white/10 overflow-hidden shrink-0">
                      {localGym.logoUrl && !logoPreviewError ? (
                        <img 
                          src={localGym.logoUrl} 
                          alt="Gym Logo" 
                          onError={() => setLogoPreviewError(true)} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <img src="/logo.svg" alt="MustGym" className="w-5 h-5 object-contain" />
                      )}
                    </div>
                    <span className="text-[8px] font-bold text-on-surface-variant uppercase tracking-wider mt-1.5">Dashboard</span>
                  </div>

                  <div className="flex-1 text-left min-w-0">
                    {localGym.logoUrl ? (
                      logoPreviewError ? (
                        <span className="block text-[10px] font-bold text-error uppercase tracking-wider">⚠️ Invalid or Broken Link</span>
                      ) : (
                        <span className="block text-[10px] font-bold text-green-500 uppercase tracking-wider">✓ Logo Active</span>
                      )
                    ) : (
                      <span className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Default Brand</span>
                    )}
                    <span className="block text-[9px] text-on-surface-variant/80 mt-0.5 truncate leading-tight">
                      {localGym.logoUrl ? (logoPreviewError ? 'Please check the URL address' : 'Rendering from host server...') : 'Standard system branding'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="md:col-span-2 border-l border-white/5 pl-6">
              <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-4">Global App Theme</label>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                {GYM_THEMES.map(theme => {
                   const isSelected = (localGym.themeId || 'kinetic-orange') === theme.id;
                   return (
                     <button
                       key={theme.id}
                       onClick={async () => {
                         setLocalGym({...localGym, themeId: theme.id});
                         try { 
                           await updateDoc(doc(db, 'gyms', gymInfo.id), { themeId: theme.id }); 
                           toast.success('App theme updated universally'); 
                         } catch (e) { 
                           console.error("Theme update error:", e);
                           toast.error('Failed to update theme: ' + (e as Error).message); 
                         }
                       }}
                       className={`p-3 rounded-xl border flex items-center justify-between transition-all ${isSelected ? 'border-primary bg-primary/10' : 'border-white/5 bg-background/50 hover:bg-white/5'}`}
                     >
                       <span className="text-xs font-bold text-on-surface">{theme.name}</span>
                       <div className="w-4 h-4 rounded-full shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]" style={{ backgroundColor: theme.colors['--color-primary'] }} />
                     </button>
                   );
                })}
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

        {/* Social & Web Presence */}
        <div className="bg-surface-container-high p-6 rounded-2xl border border-white/5 shadow-xl lg:col-span-2 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500/5 rounded-full blur-3xl pointer-events-none" />
          <h4 className="text-sm font-black uppercase tracking-[0.2em] text-pink-500 mb-6 flex items-center gap-2 relative z-10">
            <Globe size={16} /> Social Presence
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
            <div>
              <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2 flex items-center gap-2"><Instagram size={12} /> Instagram</label>
              <input 
                type="text" 
                value={localGym.socialLinks?.instagram || ''}
                onChange={(e) => setLocalGym({...localGym, socialLinks: {...(localGym.socialLinks || {}), instagram: e.target.value}})}
                onBlur={async (e) => {
                  try { await updateDoc(doc(db, 'gyms', gymInfo.id), { 'socialLinks.instagram': e.target.value }); toast.success('Updated Instagram URL'); } catch (err) {}
                }}
                className="w-full bg-background/50 border border-white/5 rounded-xl py-3 px-4 text-sm font-bold outline-none focus:border-pink-500/50"
                placeholder="https://instagram.com/..."
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2 flex items-center gap-2"><Facebook size={12} /> Facebook</label>
              <input 
                type="text" 
                value={localGym.socialLinks?.facebook || ''}
                onChange={(e) => setLocalGym({...localGym, socialLinks: {...(localGym.socialLinks || {}), facebook: e.target.value}})}
                onBlur={async (e) => {
                  try { await updateDoc(doc(db, 'gyms', gymInfo.id), { 'socialLinks.facebook': e.target.value }); toast.success('Updated Facebook URL'); } catch (err) {}
                }}
                className="w-full bg-background/50 border border-white/5 rounded-xl py-3 px-4 text-sm font-bold outline-none focus:border-blue-500/50"
                placeholder="https://facebook.com/..."
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2 flex items-center gap-2"><Twitter size={12} /> TargetPlatform/X</label>
              <input 
                type="text" 
                value={localGym.socialLinks?.twitter || ''}
                onChange={(e) => setLocalGym({...localGym, socialLinks: {...(localGym.socialLinks || {}), twitter: e.target.value}})}
                onBlur={async (e) => {
                  try { await updateDoc(doc(db, 'gyms', gymInfo.id), { 'socialLinks.twitter': e.target.value }); toast.success('Updated target URL'); } catch (err) {}
                }}
                className="w-full bg-background/50 border border-white/5 rounded-xl py-3 px-4 text-sm font-bold outline-none focus:border-white/50"
                placeholder="https://x.com/..."
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2 flex items-center gap-2"><Globe size={12} /> Website</label>
              <input 
                type="text" 
                value={localGym.socialLinks?.website || ''}
                onChange={(e) => setLocalGym({...localGym, socialLinks: {...(localGym.socialLinks || {}), website: e.target.value}})}
                onBlur={async (e) => {
                  try { await updateDoc(doc(db, 'gyms', gymInfo.id), { 'socialLinks.website': e.target.value }); toast.success('Updated Website URL'); } catch (err) {}
                }}
                className="w-full bg-background/50 border border-white/5 rounded-xl py-3 px-4 text-sm font-bold outline-none focus:border-primary/50"
                placeholder="https://..."
              />
            </div>
          </div>
        </div>

        {/* Amenities & Rules */}
        <div className="bg-surface-container-high p-6 rounded-2xl border border-white/5 shadow-xl lg:col-span-2 relative overflow-hidden">
          <div className="absolute top-0 right-1/2 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
          <h4 className="text-sm font-black uppercase tracking-[0.2em] text-cyan-400 mb-6 flex items-center gap-2 relative z-10">
            <ListChecks size={16} /> Amenities & Operating Rules
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
            <div>
              <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-4"><ListChecks size={12} className="inline mr-1" /> Available Amenities</label>
              <div className="flex flex-wrap gap-2">
                {amenitiesList.map(amenity => {
                  const isSelected = localGym.amenities?.includes(amenity);
                  return (
                    <button
                      key={amenity}
                      onClick={async () => {
                        const current = localGym.amenities || [];
                        const next = isSelected ? current.filter((a: string) => a !== amenity) : [...current, amenity];
                        setLocalGym({ ...localGym, amenities: next });
                        try { await updateDoc(doc(db, 'gyms', gymInfo.id), { amenities: next }); toast.success('Updated amenities'); } catch (err) { }
                      }}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${isSelected ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'bg-background/50 text-on-surface-variant border border-white/5 hover:bg-white/5'}`}
                    >
                      {isSelected && <Check size={12} />}
                      {amenity}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-4"><FileText size={12} className="inline mr-1"/> Facility Rules & Etiquette</label>
              <textarea 
                value={localGym.facilityRules || ''}
                onChange={(e) => setLocalGym({...localGym, facilityRules: e.target.value})}
                onBlur={async (e) => {
                  if (e.target.value !== gymInfo.facilityRules) {
                    try { await updateDoc(doc(db, 'gyms', gymInfo.id), { facilityRules: e.target.value }); toast.success('Updated Rules'); } catch (err) {}
                  }
                }}
                className="w-full bg-background/50 border border-white/5 rounded-xl py-3 px-4 text-sm outline-none focus:border-cyan-500/50 min-h-[120px] resize-y"
                placeholder="List your gym rules here..."
              />
            </div>
          </div>
        </div>

        {/* Developer & API Integrations */}
        <div className="bg-surface-container-high p-6 rounded-2xl border border-white/5 shadow-xl lg:col-span-2 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />
          <h4 className="text-sm font-black uppercase tracking-[0.2em] text-purple-400 mb-6 flex items-center gap-2 relative z-10">
            <Webhook size={16} /> Advanced Event Webhooks
          </h4>
          <p className="text-[10px] text-on-surface-variant font-bold mb-6">Connect your gym to Zapier, Make, or custom servers, to trigger actions in real-time when events occur in the system.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
            <div className="bg-background/40 p-5 rounded-xl border border-white/5 group hover:border-purple-500/30 transition-all">
              <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-3 flex items-center gap-2"><Activity size={12} className="text-purple-400" /> New Member Joined</label>
              <input 
                type="text" 
                value={localGym.webhooks?.newMember || ''}
                onChange={(e) => setLocalGym({...localGym, webhooks: {...(localGym.webhooks || {}), newMember: e.target.value}})}
                onBlur={async (e) => {
                  try { await updateDoc(doc(db, 'gyms', gymInfo.id), { 'webhooks.newMember': e.target.value }); toast.success('Webhook Saved'); } catch (err) {}
                }}
                className="w-full bg-background/80 border border-white/5 rounded-xl py-3 px-4 text-xs font-mono outline-none focus:border-purple-500/50 block"
                placeholder="https://hooks.zapier.com/..."
              />
            </div>
            <div className="bg-background/40 p-5 rounded-xl border border-white/5 group hover:border-purple-500/30 transition-all">
              <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-3 flex items-center gap-2"><QrCode size={12} className="text-purple-400" /> Member Check-In</label>
              <input 
                type="text" 
                value={localGym.webhooks?.checkIn || ''}
                onChange={(e) => setLocalGym({...localGym, webhooks: {...(localGym.webhooks || {}), checkIn: e.target.value}})}
                onBlur={async (e) => {
                  try { await updateDoc(doc(db, 'gyms', gymInfo.id), { 'webhooks.checkIn': e.target.value }); toast.success('Webhook Saved'); } catch (err) {}
                }}
                className="w-full bg-background/80 border border-white/5 rounded-xl py-3 px-4 text-xs font-mono outline-none focus:border-purple-500/50 block"
                placeholder="https://hooks.zapier.com/..."
              />
            </div>
            <div className="bg-background/40 p-5 rounded-xl border border-white/5 group hover:border-purple-500/30 transition-all">
              <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-3 flex items-center gap-2"><Shield size={12} className="text-purple-400" /> Payment Received</label>
              <input 
                type="text" 
                value={localGym.webhooks?.payment || ''}
                onChange={(e) => setLocalGym({...localGym, webhooks: {...(localGym.webhooks || {}), payment: e.target.value}})}
                onBlur={async (e) => {
                  try { await updateDoc(doc(db, 'gyms', gymInfo.id), { 'webhooks.payment': e.target.value }); toast.success('Webhook Saved'); } catch (err) {}
                }}
                className="w-full bg-background/80 border border-white/5 rounded-xl py-3 px-4 text-xs font-mono outline-none focus:border-purple-500/50 block"
                placeholder="https://hooks.zapier.com/..."
              />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
