import React, { useState, useEffect } from 'react';
import { Bell, X, Info, AlertTriangle, CheckCircle, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, auth } from '../lib/firebase';
import { collection, query, where, onSnapshot, orderBy, updateDoc, doc, deleteDoc, writeBatch } from 'firebase/firestore';
import { cn } from '../lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  read: boolean;
  createdAt: string;
}

export function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', auth.currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Notification[];
      setNotifications(docs);
    }, (error) => {
      setTimeout(() => {
        handleFirestoreError(error, OperationType.LIST, 'notifications');
      }, 0);
    });

    return () => unsubscribe();
  }, []);

  const markAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, 'notifications', id), { read: true });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    const batch = writeBatch(db);
    notifications.filter(n => !n.read).forEach(n => {
      batch.update(doc(db, 'notifications', n.id), { read: true });
    });
    await batch.commit();
  };

  const deleteNotification = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'notifications', id));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="text-warning" size={18} />;
      case 'success': return <CheckCircle className="text-success" size={18} />;
      case 'error': return <AlertTriangle className="text-error" size={18} />;
      default: return <Info className="text-primary" size={18} />;
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-on-surface-variant hover:text-primary transition-colors rounded-lg hover:bg-white/5"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-primary text-on-primary-fixed text-[10px] font-black flex items-center justify-center rounded-full border-2 border-background">
            {unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-[100] bg-black/20 backdrop-blur-sm md:bg-transparent"
            />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="fixed inset-x-4 top-20 bottom-20 md:absolute md:inset-auto md:right-0 md:top-full md:mt-4 md:w-96 md:max-h-[500px] z-[110] bg-surface-container-high border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden"
            >
              <div className="p-5 border-b border-white/5 flex justify-between items-center bg-surface-container-highest/50">
                <div>
                  <h3 className="font-headline font-bold text-on-surface uppercase tracking-widest text-xs">Notifications</h3>
                  <p className="text-[10px] text-on-surface-variant font-medium mt-0.5">
                    {unreadCount} unread messages
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button 
                      onClick={markAllAsRead}
                      className="text-[10px] font-bold text-primary hover:text-primary-dim transition-colors uppercase tracking-tighter"
                    >
                      Mark all read
                    </button>
                  )}
                  <button onClick={() => setIsOpen(false)} className="p-1.5 hover:bg-white/5 rounded-lg text-on-surface-variant">
                    <X size={16} />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {notifications.length === 0 ? (
                  <div className="h-40 flex flex-col items-center justify-center text-center p-6">
                    <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mb-3">
                      <Bell className="text-on-surface-variant/30" size={24} />
                    </div>
                    <p className="text-xs font-headline font-bold text-on-surface-variant uppercase tracking-widest">No notifications yet</p>
                    <p className="text-[10px] text-on-surface-variant/50 mt-1 uppercase">We'll notify you when something important happens</p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <motion.div
                      key={n.id}
                      layout
                      className={cn(
                        "group p-4 rounded-2xl transition-all relative flex gap-4",
                        n.read ? "opacity-60 grayscale-[0.5]" : "bg-white/5 border border-white/5 shadow-lg"
                      )}
                      onClick={() => !n.read && markAsRead(n.id)}
                    >
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-inner",
                        n.type === 'warning' ? "bg-warning/10" : 
                        n.type === 'success' ? "bg-success/10" : 
                        n.type === 'error' ? "bg-error/10" : "bg-primary/10"
                      )}>
                        {getIcon(n.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="text-xs font-headline font-bold text-on-surface uppercase tracking-tight truncate pr-4">
                            {n.title}
                          </h4>
                          <span className="text-[9px] font-medium text-on-surface-variant/50 whitespace-nowrap">
                            {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-[11px] text-on-surface-variant leading-relaxed line-clamp-2">
                          {n.message}
                        </p>
                      </div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(n.id);
                        }}
                        className="absolute top-2 right-2 p-1.5 opacity-0 group-hover:opacity-100 hover:bg-error/10 hover:text-error rounded-lg transition-all text-on-surface-variant/30"
                      >
                        <Trash2 size={14} />
                      </button>
                      {!n.read && (
                        <div className="absolute left-2 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-full shadow-[0_0_8px_rgba(var(--primary-rgb),0.5)]" />
                      )}
                    </motion.div>
                  ))
                )}
              </div>

              <div className="p-4 bg-surface-container-highest/30 border-t border-white/5">
                <p className="text-[9px] font-black text-center text-primary/40 uppercase tracking-[0.3em]">
                  Elite Performance System
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
