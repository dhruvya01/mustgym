import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, getDocs, where, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserProfile, AttendanceRecord, EquipmentUsage, PaymentRecord } from '../types';
import { motion } from 'motion/react';
import { 
  TrendingUp, Users, Activity, IndianRupee, Dumbbell, Clock, 
  ChevronLeft, Filter, Download, Calendar, ArrowUpRight, ArrowDownRight, 
  BarChart3, PieChart as PieChartIcon, LineChart as LineChartIcon
} from 'lucide-react';
import { 
  format, subDays, startOfDay, endOfDay, eachDayOfInterval, 
  isSameDay, parseISO, startOfMonth, endOfMonth, eachMonthOfInterval,
  isSameMonth, subMonths, getHours, startOfHour, isWithinInterval
} from 'date-fns';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, Legend
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';

const COLORS = ['#ff4d00', '#22c55e', '#3b82f6', '#f59e0b', '#a855f7', '#ec4899', '#06b6d4'];

export default function AnalyticsPage({ profile }: { profile: UserProfile | null }) {
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    start: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd')
  });
  
  const [members, setMembers] = useState<UserProfile[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [usage, setUsage] = useState<EquipmentUsage[]>([]);
  
  const navigate = useNavigate();

  useEffect(() => {
    if (!profile || (profile.role !== 'admin' && profile.role !== 'owner')) {
      navigate('/');
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const gymId = profile.gymId;
        
        if (gymId) {
          const gymQuery = query(collection(db, 'gyms'));
          const gymDocs = await getDocs(gymQuery);
          const gymDoc = gymDocs.docs.find(d => d.id === gymId);
          if (gymDoc && gymDoc.data().subscriptionTier === 'starter') {
            navigate('/admin');
            return;
          }
        }
        
        const membersReq = profile.role === 'admin' 
          ? getDocs(collection(db, 'users'))
          : getDocs(query(collection(db, 'users'), where('gymId', '==', gymId)));
          
        const attendanceReq = profile.role === 'admin'
          ? getDocs(collection(db, 'attendance'))
          : getDocs(query(collection(db, 'attendance'), where('gymId', '==', gymId)));
          
        const paymentsReq = profile.role === 'admin'
          ? getDocs(collection(db, 'payments'))
          : getDocs(query(collection(db, 'payments'), where('gymId', '==', gymId)));
          
        const usageReq = profile.role === 'admin'
          ? getDocs(collection(db, 'equipmentUsage'))
          : getDocs(query(collection(db, 'equipmentUsage'), where('gymId', '==', gymId)));

        const [mSnap, aSnap, pSnap, uSnap] = await Promise.all([
          membersReq, attendanceReq, paymentsReq, usageReq
        ]);

        setMembers(mSnap.docs.map(doc => doc.data() as UserProfile));
        setAttendance(aSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as AttendanceRecord)));
        setPayments(pSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as PaymentRecord)));
        setUsage(uSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as EquipmentUsage)));
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, 'analytics');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [profile, navigate]);

  // Filters
  const filteredData = useMemo(() => {
    const startDate = startOfDay(parseISO(dateRange.start));
    const endDate = endOfDay(parseISO(dateRange.end));
    const interval = { start: startDate, end: endDate };

    return {
      attendance: attendance.filter(a => isWithinInterval(parseISO(a.timestamp), interval)),
      payments: payments.filter(p => isWithinInterval(parseISO(p.date), interval)),
      usage: usage.filter(u => isWithinInterval(parseISO(u.timestamp), interval)),
      members: members // Members are mostly fixed, but we'll use join date if needed
    };
  }, [attendance, payments, usage, members, dateRange]);

  // 1. Attendance Trends (Daily)
  const attendanceTrends = useMemo(() => {
    const days = eachDayOfInterval({ 
      start: parseISO(dateRange.start), 
      end: parseISO(dateRange.end) 
    });
    
    return days.map(day => ({
      date: format(day, 'MMM dd'),
      count: filteredData.attendance.filter(a => isSameDay(parseISO(a.timestamp), day)).length
    }));
  }, [filteredData.attendance, dateRange]);

  // 2. Retention Rate Over Time (Monthly)
  // Logic: (Members active at start + New members) vs (Members at end)
  // Simplified: Retention % = (Existing Members / Total Members) over time
  const retentionTrends = useMemo(() => {
    const months = eachMonthOfInterval({
      start: subMonths(new Date(), 5),
      end: new Date()
    });

    return months.map(month => {
      const start = startOfMonth(month);
      const end = endOfMonth(month);
      
      const totalInMonth = members.filter(m => {
        const joinDate = parseISO(m.createdAt || m.membershipExpiry || new Date().toISOString());
        return joinDate <= end;
      }).length;

      const activeInMonth = members.filter(m => {
        const joinDate = parseISO(m.createdAt || m.membershipExpiry || new Date().toISOString());
        return joinDate <= end && m.membershipStatus === 'active';
      }).length;

      const rate = totalInMonth === 0 ? 100 : (activeInMonth / totalInMonth) * 100;
      
      return {
        month: format(month, 'MMM yy'),
        rate: Math.round(rate)
      };
    });
  }, [members]);

  // 3. Most Frequently Used Equipment
  const equipmentUsageStats = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredData.usage.forEach(u => {
      counts[u.equipmentName] = (counts[u.equipmentName] || 0) + 1;
    });
    
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [filteredData.usage]);

  // 4. Popular Class Times (Hourly Trends)
  const hourlyTrends = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      label: `${i}:00`,
      count: 0
    }));

    filteredData.attendance.forEach(a => {
      const hour = getHours(parseISO(a.timestamp));
      hours[hour].count++;
    });

    // Filter to typical gym hours 5am - 11pm
    return hours.filter(h => h.hour >= 5 && h.hour <= 23);
  }, [filteredData.attendance]);

  // 5. Payment Status Summary
  const paymentStats = useMemo(() => {
    const statusCounts = {
      paid: filteredData.payments.filter(p => p.status === 'paid').length,
      pending: filteredData.payments.filter(p => p.status === 'pending').length,
      failed: filteredData.payments.filter(p => p.status === 'failed').length
    };

    return [
      { name: 'Paid', value: statusCounts.paid, color: '#22c55e' },
      { name: 'Pending', value: statusCounts.pending, color: '#f59e0b' },
      { name: 'Failed', value: statusCounts.failed, color: '#ef4444' }
    ].filter(s => s.value > 0);
  }, [filteredData.payments]);

  // Summary Metrics
  const summary = useMemo(() => {
    const totalRevenue = filteredData.payments
      .filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + p.amount, 0);
    
    const avgAttendance = filteredData.attendance.length / attendanceTrends.length;
    
    const growth = members.filter(m => {
      const joinDate = parseISO(m.createdAt || new Date().toISOString());
      return isWithinInterval(joinDate, { 
        start: parseISO(dateRange.start), 
        end: parseISO(dateRange.end) 
      });
    }).length;

    return {
      revenue: totalRevenue,
      avgAttendance: Math.round(avgAttendance),
      newMembers: growth,
      totalVisits: filteredData.attendance.length
    };
  }, [filteredData, attendanceTrends, dateRange, members]);

  if (loading) {
    return (
      <div className="min-h-screen pt-24 pb-12 flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
        <p className="text-on-surface-variant font-headline font-bold uppercase tracking-widest text-[10px]">Processing Big Data Analytics...</p>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-20 px-6 max-w-7xl mx-auto space-y-10">
      {/* Header */}
      <section className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <button 
            onClick={() => navigate('/admin')}
            className="flex items-center gap-2 text-primary font-bold uppercase tracking-widest text-[10px] mb-4 hover:underline"
          >
            <ChevronLeft size={14} />
            Back to Command Center
          </button>
          <h1 className="font-headline font-black text-4xl sm:text-6xl uppercase italic leading-none">
            Elite <br/><span className="text-primary-dim">Analytics.</span>
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-4 bg-surface-container-low p-4 rounded-2xl border border-white/5 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-outline" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Range:</span>
          </div>
          <input 
            type="date" 
            value={dateRange.start}
            onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
            className="bg-surface-container-highest border-none text-on-surface py-2 px-3 rounded-lg text-xs font-bold"
          />
          <span className="text-outline">to</span>
          <input 
            type="date" 
            value={dateRange.end}
            onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
            className="bg-surface-container-highest border-none text-on-surface py-2 px-3 rounded-lg text-xs font-bold"
          />
        </div>
      </section>

      {/* Summary Bento Grid */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface-container-low p-6 rounded-2xl border border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <IndianRupee size={48} />
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-2">Total Revenue</p>
          <div className="flex items-baseline gap-2">
            <p className="font-headline text-3xl font-black italic">₹{summary.revenue.toLocaleString('en-IN')}</p>
          </div>
          <div className="mt-2 text-[9px] font-bold text-green-500 flex items-center gap-1 uppercase tracking-widest">
            <TrendingUp size={10} />
            Target tracking active
          </div>
        </div>

        <div className="bg-surface-container-low p-6 rounded-2xl border border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <Activity size={48} />
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-2">Total Visits</p>
          <p className="font-headline text-3xl font-black italic">{summary.totalVisits}</p>
          <div className="mt-2 text-[9px] font-bold text-on-surface-variant flex items-center gap-1 uppercase tracking-widest">
            Avg {summary.avgAttendance}/day
          </div>
        </div>

        <div className="bg-surface-container-low p-6 rounded-2xl border border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <Users size={48} />
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-2">Acquisitions</p>
          <p className="font-headline text-3xl font-black italic">+{summary.newMembers}</p>
          <div className="mt-2 text-[9px] font-bold text-primary flex items-center gap-1 uppercase tracking-widest">
            <TrendingUp size={10} />
            New signups in range
          </div>
        </div>

        <div className="bg-surface-container-low p-6 rounded-2xl border border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <Dumbbell size={48} />
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-2">Equipment Load</p>
          <p className="font-headline text-3xl font-black italic">{filteredData.usage.length}</p>
          <div className="mt-2 text-[9px] font-bold text-on-surface-variant flex items-center gap-1 uppercase tracking-widest">
            Logged machine sessions
          </div>
        </div>
      </section>

      {/* Main Charts Area */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Attendance Trends */}
        <div className="lg:col-span-2 bg-surface-container-low p-8 rounded-3xl border border-white/5 space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Activity className="text-primary" size={24} />
              <h3 className="font-headline font-black text-xl uppercase italic">Attendance Velocity</h3>
            </div>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={attendanceTrends}>
                <defs>
                  <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ff4d00" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ff4d00" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis dataKey="date" stroke="#ffffff20" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#ffffff20" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1a1a1a', border: 'none', borderRadius: '12px', fontSize: '12px' }}
                  itemStyle={{ color: '#ff4d00' }}
                  cursor={{ stroke: '#ff4d00' }}
                />
                <Area type="monotone" dataKey="count" stroke="#ff4d00" fillOpacity={1} fill="url(#colorVisits)" strokeWidth={4} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Status Summary */}
        <div className="bg-surface-container-low p-8 rounded-3xl border border-white/5 space-y-6">
          <div className="flex items-center gap-3">
            <IndianRupee className="text-primary" size={24} />
            <h3 className="font-headline font-black text-xl uppercase italic">Billing Status</h3>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={paymentStats}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {paymentStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1a1a1a', border: 'none', borderRadius: '12px', fontSize: '12px' }}
                />
                <Legend 
                  verticalAlign="bottom" 
                  align="center"
                  wrapperStyle={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 'bold', paddingTop: '20px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-4 pt-4 border-t border-white/5">
            {paymentStats.map((stat, i) => (
              <div key={i} className="flex justify-between items-center text-xs">
                <span className="text-on-surface-variant font-bold uppercase tracking-widest">{stat.name}</span>
                <span className="font-mono font-bold" style={{ color: stat.color }}>{stat.value} Records</span>
              </div>
            ))}
          </div>
        </div>

        {/* Member Retention Rate */}
        <div className="lg:col-span-1 bg-surface-container-low p-8 rounded-3xl border border-white/5 space-y-6">
          <div className="flex items-center gap-3">
            <Users className="text-primary" size={24} />
            <h3 className="font-headline font-black text-xl uppercase italic">Retention Trend</h3>
          </div>
          <p className="text-[10px] text-on-surface-variant leading-relaxed">Percentage of active members relative to historical totals over the last 6 months.</p>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={retentionTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis dataKey="month" stroke="#ffffff20" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis domain={[0, 100]} stroke="#ffffff20" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}%`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1a1a1a', border: 'none', borderRadius: '12px', fontSize: '12px' }}
                />
                <Line type="monotone" dataKey="rate" stroke="#ff4d00" strokeWidth={4} dot={{ fill: '#ff4d00', strokeWidth: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Popular Hours */}
        <div className="lg:col-span-1 bg-surface-container-low p-8 rounded-3xl border border-white/5 space-y-6">
          <div className="flex items-center gap-3">
            <Clock className="text-primary" size={24} />
            <h3 className="font-headline font-black text-xl uppercase italic">Peak Hours</h3>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis dataKey="label" stroke="#ffffff20" fontSize={8} tickLine={false} axisLine={false} />
                <YAxis hide />
                <Tooltip 
                   contentStyle={{ backgroundColor: '#1a1a1a', border: 'none', borderRadius: '12px', fontSize: '12px' }}
                />
                <Bar dataKey="count" fill="#ff4d00" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-between items-center pt-2">
            <div className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant italic">Busy</div>
            <div className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant italic">Quiet</div>
          </div>
        </div>

        {/* Machine Utilization */}
        <div className="lg:col-span-1 bg-surface-container-low p-8 rounded-3xl border border-white/5 space-y-6">
          <div className="flex items-center gap-3">
            <Dumbbell className="text-primary" size={24} />
            <h3 className="font-headline font-black text-xl uppercase italic">Machine Usage</h3>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={equipmentUsageStats} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" stroke="#ffffff40" fontSize={9} width={80} axisLine={false} tickLine={false} />
                <Tooltip 
                   contentStyle={{ backgroundColor: '#1a1a1a', border: 'none', borderRadius: '12px', fontSize: '12px' }}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </section>

      {/* Raw Data Insights Table */}
      <section className="bg-surface-container-low p-8 rounded-3xl border border-white/5 overflow-hidden">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <BarChart3 className="text-primary" size={24} />
            <h3 className="font-headline font-black text-xl uppercase italic">Utilization Breakdown</h3>
          </div>
          <button className="flex items-center gap-2 text-outline font-bold uppercase tracking-widest text-[10px] hover:text-white transition-colors">
            <Download size={14} />
            Export Analysis
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-white/5 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
              <tr>
                <th className="px-6 py-4">Metric Category</th>
                <th className="px-6 py-4">Performance Value</th>
                <th className="px-6 py-4">Growth / Status</th>
                <th className="px-6 py-4">Strategic Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              <tr className="hover:bg-white/[0.02] transition-colors">
                <td className="px-6 py-5 text-sm font-bold">Member Retention</td>
                <td className="px-6 py-5 font-mono text-sm">{retentionTrends[retentionTrends.length - 1]?.rate}%</td>
                <td className="px-6 py-5">
                  <span className="text-[10px] font-black uppercase tracking-widest bg-green-500/10 text-green-500 px-2 py-1 rounded">Healthy</span>
                </td>
                <td className="px-6 py-5 text-xs text-on-surface-variant">Launch loyalty program for Elite members.</td>
              </tr>
              <tr className="hover:bg-white/[0.02] transition-colors">
                <td className="px-6 py-5 text-sm font-bold">Revenue Recovery</td>
                <td className="px-6 py-5 font-mono text-sm">₹{filteredData.payments.filter(p => p.status === 'failed').reduce((sum, p) => sum + p.amount, 0).toLocaleString()}</td>
                <td className="px-6 py-5">
                  <span className="text-[10px] font-black uppercase tracking-widest bg-error/10 text-error px-2 py-1 rounded">Leakage</span>
                </td>
                <td className="px-6 py-5 text-xs text-on-surface-variant">Automate payment reminders for {filteredData.payments.filter(p => p.status === 'failed').length} failed bills.</td>
              </tr>
              <tr className="hover:bg-white/[0.02] transition-colors">
                <td className="px-6 py-5 text-sm font-bold">Peak Utilization</td>
                <td className="px-6 py-5 font-mono text-sm">{hourlyTrends.sort((a,b) => b.count - a.count)[0]?.label}</td>
                <td className="px-6 py-5">
                  <span className="text-[10px] font-black uppercase tracking-widest bg-primary/10 text-primary px-2 py-1 rounded">High Load</span>
                </td>
                <td className="px-6 py-5 text-xs text-on-surface-variant">Consider off-peak membership tiers to distribute load.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
