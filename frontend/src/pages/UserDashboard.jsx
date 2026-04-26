import { useState, useEffect } from 'react';
import axios from '../api/axios';
import { useAuth } from '../context/AuthContext';
import {
  CalendarDays, Ticket, Bell, Building2, TrendingUp, TrendingDown,
  CheckCircle2, Clock, AlertCircle, Activity, ArrowRight,
  RefreshCw, Plus, GraduationCap, Wrench, Zap,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

// ─── Shared helpers ──────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="dash-chart-tooltip">
      {label && <p className="dash-chart-tooltip-label">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || p.fill, margin: 0, fontSize: '0.78rem', fontWeight: 600 }}>
          {p.name}: <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub, trend, trendUp, color, onClick }) {
  return (
    <button onClick={onClick} className="admin-stat-card" style={{ '--card-accent': color }}>
      <div className="admin-stat-top">
        <div className="admin-stat-icon" style={{ background: `${color}18`, color }}>
          <Icon size={22} />
        </div>
        {trend !== undefined && (
          <div className={`admin-stat-trend ${trendUp ? 'up' : 'down'}`}>
            {trendUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {trend}%
          </div>
        )}
      </div>
      <div className="admin-stat-value">{value ?? '–'}</div>
      <div className="admin-stat-label">{label}</div>
      {sub && <div className="admin-stat-sub">{sub}</div>}
    </button>
  );
}

function ActivityItem({ icon: Icon, color, title, meta, time, status }) {
  const statusMap = {
    APPROVED: { label: 'Approved', cls: 'status-success' },
    PENDING:  { label: 'Pending',  cls: 'status-warning' },
    REJECTED: { label: 'Rejected', cls: 'status-danger'  },
    OPEN:        { label: 'Open',        cls: 'status-info'    },
    IN_PROGRESS: { label: 'In Progress', cls: 'status-warning' },
    RESOLVED:    { label: 'Resolved',    cls: 'status-success' },
  };
  const s = statusMap[status] || { label: status, cls: 'status-info' };
  return (
    <div className="activity-item">
      <div className="activity-icon" style={{ background: `${color}15`, color }}>
        <Icon size={15} />
      </div>
      <div className="activity-body">
        <span className="activity-title">{title}</span>
        <span className="activity-meta">{meta}</span>
      </div>
      <div className="activity-right">
        {status && <span className={`activity-status ${s.cls}`}>{s.label}</span>}
        <span className="activity-time">{time}</span>
      </div>
    </div>
  );
}

function QuickAction({ icon: Icon, label, color, onClick }) {
  return (
    <button onClick={onClick} className="quick-action-btn" style={{ '--qa-color': color }}>
      <div className="qa-icon" style={{ background: `${color}15`, color }}><Icon size={18} /></div>
      <span>{label}</span>
      <ArrowRight size={14} className="qa-arrow" />
    </button>
  );
}

// ─── User Dashboard ──────────────────────────────────────────────────
export const UserDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats]               = useState({ bookings: 0, tickets: 0, notifications: 0, resources: 0 });
  const [recentBookings, setRecentBookings] = useState([]);
  const [recentTickets, setRecentTickets]   = useState([]);
  const [recentNotifs, setRecentNotifs]     = useState([]);
  const [bookingChartData, setBookingChartData] = useState([]);
  const [ticketChartData, setTicketChartData]   = useState([]);
  const [trendData, setTrendData]       = useState([]);
  const [loading, setLoading]           = useState(true);
  const [lastRefresh, setLastRefresh]   = useState(new Date());

  const isTech = user?.role === 'TECHNICIAN';

  const load = async () => {
    setLoading(true);
    try {
      const bookingUrl  = isTech ? '/api/bookings' : '/api/bookings/my-bookings';
      const ticketParam = isTech ? '?context=assigned' : '?context=my-tickets';

      const [bRes, tRes, nRes, rRes] = await Promise.all([
        axios.get(bookingUrl, { withCredentials: true }).catch(() => ({ data: [] })),
        axios.get(`/api/tickets${ticketParam}`, { withCredentials: true }).catch(() => ({ data: [] })),
        axios.get('/api/notifications?unreadOnly=false', { withCredentials: true }).catch(() => ({ data: [] })),
        axios.get('/api/resources', { withCredentials: true }).catch(() => ({ data: [] })),
      ]);

      const bd = bRes.data || [], td = tRes.data || [], nd = nRes.data || [], rd = rRes.data || [];
      const unread = nd.filter(n => !n.isRead).length;

      setStats({
        bookings:      bd.length,
        tickets:       td.length,
        notifications: unread,
        resources:     rd.filter(r => r.status === 'ACTIVE').length,
        pendingBookings: bd.filter(b => b.status === 'PENDING').length,
        approvedBookings: bd.filter(b => b.status === 'APPROVED').length,
        openTickets: td.filter(t => t.status === 'OPEN').length,
      });

      // Booking status bar data
      const bGroups = { PENDING: 0, APPROVED: 0, REJECTED: 0 };
      bd.forEach(b => { if (bGroups[b.status] !== undefined) bGroups[b.status]++; });
      setBookingChartData([
        { name: 'Pending',  value: bGroups.PENDING,  fill: '#f59e0b' },
        { name: 'Approved', value: bGroups.APPROVED, fill: '#22c55e' },
        { name: 'Rejected', value: bGroups.REJECTED, fill: '#ef4444' },
      ]);

      // Ticket status donut data
      const tGroups = { OPEN: 0, IN_PROGRESS: 0, RESOLVED: 0 };
      td.forEach(t => { if (tGroups[t.status] !== undefined) tGroups[t.status]++; });
      setTicketChartData([
        { name: 'Open',        value: tGroups.OPEN,        fill: '#3b82f6' },
        { name: 'In Progress', value: tGroups.IN_PROGRESS, fill: '#f59e0b' },
        { name: 'Resolved',    value: tGroups.RESOLVED,    fill: '#22c55e' },
      ]);

      // 7-day area trend (bookings + notifications)
      const trend = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(); d.setDate(d.getDate() - (6 - i));
        const ds = d.toDateString();
        return {
          day: d.toLocaleDateString('en-US', { weekday: 'short' }),
          Bookings: bd.filter(b => b.createdAt && new Date(b.createdAt).toDateString() === ds).length,
          Tickets:  td.filter(t => t.createdAt && new Date(t.createdAt).toDateString() === ds).length,
        };
      });
      setTrendData(trend);

      setRecentBookings([...bd].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)).slice(0, 5));
      setRecentTickets([...td].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)).slice(0, 5));
      setRecentNotifs([...nd].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)).slice(0, 4));
      setLastRefresh(new Date());
    } catch (err) {
      console.error('UserDashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const fmtTime = (dt) => {
    if (!dt) return '–';
    const diff = (new Date() - new Date(dt)) / 1000;
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return new Date(dt).toLocaleDateString();
  };
  const fmtDate = (dt) => dt
    ? new Date(dt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '–';

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const firstName = user?.name?.split(' ')[0] || 'there';
  const totalTickets = ticketChartData.reduce((s, d) => s + d.value, 0);

  const roleLabel = isTech ? 'Technician Portal' : 'Student Portal';
  const RoleIcon  = isTech ? Wrench : GraduationCap;
  const roleColor = isTech ? '#8b5cf6' : '#06b6d4';

  if (loading) return (
    <div className="admin-dash-loading"><div className="dash-spinner" /><span>Loading dashboard…</span></div>
  );

  return (
    <div className="admin-dash">
      {/* Hero */}
      <div className="dash-hero" style={{ '--hero-accent': roleColor }}>
        <div className="dash-hero-left">
          <div className="dash-greeting-badge" style={{ borderColor: `${roleColor}30`, color: roleColor, background: `${roleColor}10` }}>
            <RoleIcon size={13} /> {roleLabel}
          </div>
          <h1 className="dash-greeting-title">{greeting}, <span style={{ color: roleColor }}>{firstName}!</span></h1>
          <p className="dash-greeting-sub">
            {isTech
              ? "Here's your assigned tickets and workload for today."
              : "Here's a summary of your bookings, tickets, and campus activity."}
          </p>
        </div>
        <div className="dash-hero-right">
          <div className="dash-refresh-info"><Activity size={13} /> Last updated {fmtTime(lastRefresh)}</div>
          <button className="dash-refresh-btn" onClick={load}><RefreshCw size={14} /> Refresh</button>
        </div>
      </div>

      {/* Stats */}
      <div className="admin-stats-grid">
        <StatCard icon={CalendarDays} label={isTech ? 'All Bookings' : 'My Bookings'} value={stats.bookings}
          sub={`${stats.pendingBookings} pending`} color="#8b5cf6" trend={stats.approvedBookings > 0 ? 8 : 0} trendUp
          onClick={() => navigate('/bookings')} />
        <StatCard icon={Ticket} label={isTech ? 'Assigned Tickets' : 'My Tickets'} value={stats.tickets}
          sub={`${stats.openTickets} open`} color="#f59e0b" trend={stats.openTickets > 2 ? 12 : 4} trendUp={stats.openTickets <= 2}
          onClick={() => navigate('/tickets')} />
        <StatCard icon={Bell} label="Notifications" value={stats.notifications}
          sub="unread messages" color="#ef4444" trend={stats.notifications > 0 ? stats.notifications : 0} trendUp={stats.notifications === 0}
          onClick={() => navigate('/notifications')} />
        <StatCard icon={Building2} label="Active Facilities" value={stats.resources}
          sub="available to book" color="#22c55e" trend={5} trendUp
          onClick={() => navigate('/resources')} />
      </div>

      {/* Charts */}
      <div className="admin-charts-grid">
        {/* Area – 7-day trend */}
        <div className="admin-card admin-chart-wide">
          <div className="admin-card-header">
            <h2 className="admin-card-title"><Activity size={16} /> My 7-Day Activity</h2>
            <div className="chart-legend">
              <span className="legend-dot" style={{ background: '#8b5cf6' }} /> Bookings
              <span className="legend-dot" style={{ background: '#f59e0b', marginLeft: 14 }} /> Tickets
            </div>
          </div>
          <ResponsiveContainer width="100%" height={190}>
            <AreaChart data={trendData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="ubk" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="utk" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="Bookings" stroke="#8b5cf6" strokeWidth={2.5} fill="url(#ubk)" dot={false} activeDot={{ r: 4 }} />
              <Area type="monotone" dataKey="Tickets"  stroke="#f59e0b" strokeWidth={2.5} fill="url(#utk)" dot={false} activeDot={{ r: 4 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Bar – booking status */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h2 className="admin-card-title"><CalendarDays size={16} /> Booking Status</h2>
          </div>
          <ResponsiveContainer width="100%" height={190}>
            <BarChart data={bookingChartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }} barSize={36}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: '#f8fafc' }} />
              <Bar dataKey="value" name="Count" radius={[6, 6, 0, 0]}>
                {bookingChartData.map((e, i) => <Cell key={i} fill={e.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Donut – ticket status */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h2 className="admin-card-title"><Ticket size={16} /> Ticket Status</h2>
          </div>
          <div className="donut-wrapper">
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={ticketChartData} cx="50%" cy="50%" innerRadius={48} outerRadius={70}
                  dataKey="value" paddingAngle={3} startAngle={90} endAngle={-270}>
                  {ticketChartData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="donut-center">
              <span className="donut-total">{totalTickets}</span>
              <span className="donut-sub">Total</span>
            </div>
          </div>
          <div className="chart-legend chart-legend-col">
            {ticketChartData.map(d => (
              <span key={d.name} className="legend-item">
                <span className="legend-dot" style={{ background: d.fill }} />
                {d.name}: <strong>{d.value}</strong>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="admin-card">
        <div className="admin-card-header"><h2 className="admin-card-title"><Zap size={16} /> Quick Actions</h2></div>
        <div className="quick-actions-list quick-actions-grid">
          <QuickAction icon={Plus}          label="New Booking"       color="#8b5cf6" onClick={() => navigate('/bookings')} />
          <QuickAction icon={Ticket}        label="New Ticket"        color="#f59e0b" onClick={() => navigate('/tickets')} />
          <QuickAction icon={Building2}     label="Browse Facilities" color="#06b6d4" onClick={() => navigate('/resources')} />
          <QuickAction icon={Bell}          label="Notifications"     color="#ef4444" onClick={() => navigate('/notifications')} />
          {!isTech && <QuickAction icon={CheckCircle2} label="My Approvals" color="#22c55e" onClick={() => navigate('/bookings')} />}
          {isTech  && <QuickAction icon={Wrench}       label="My Work Queue" color="#22c55e" onClick={() => navigate('/tickets')} />}
        </div>
      </div>

      {/* Recent Bookings + Tickets */}
      <div className="admin-bottom-grid">
        <div className="admin-card">
          <div className="admin-card-header">
            <h2 className="admin-card-title"><CalendarDays size={16} /> Recent Bookings</h2>
            <button className="card-view-all" onClick={() => navigate('/bookings')}>View all <ArrowRight size={12} /></button>
          </div>
          <div className="activity-list">
            {recentBookings.length === 0
              ? <p className="empty-state">No bookings yet. <button className="empty-cta" onClick={() => navigate('/bookings')}>Make one →</button></p>
              : recentBookings.map((b, i) => (
                  <ActivityItem key={b.id || i} icon={CalendarDays} color="#8b5cf6"
                    title={b.resourceName || 'Resource'}
                    meta={fmtDate(b.startTime)}
                    time={fmtTime(b.createdAt)} status={b.status} />
                ))}
          </div>
        </div>

        <div className="admin-card">
          <div className="admin-card-header">
            <h2 className="admin-card-title"><Ticket size={16} /> Recent Tickets</h2>
            <button className="card-view-all" onClick={() => navigate('/tickets')}>View all <ArrowRight size={12} /></button>
          </div>
          <div className="activity-list">
            {recentTickets.length === 0
              ? <p className="empty-state">No tickets yet. <button className="empty-cta" onClick={() => navigate('/tickets')}>Submit one →</button></p>
              : recentTickets.map((t, i) => (
                  <ActivityItem key={t.id || i} icon={Ticket} color="#f59e0b"
                    title={t.title || 'Ticket'}
                    meta={t.description?.slice(0, 50) || ''}
                    time={fmtTime(t.createdAt)} status={t.status} />
                ))}
          </div>
        </div>
      </div>

      {/* Notifications panel */}
      <div className="admin-card">
        <div className="admin-card-header">
          <h2 className="admin-card-title"><Bell size={16} /> Recent Notifications</h2>
          <button className="card-view-all" onClick={() => navigate('/notifications')}>View all <ArrowRight size={12} /></button>
        </div>
        <div className="activity-list">
          {recentNotifs.length === 0
            ? <p className="empty-state">No notifications yet.</p>
            : recentNotifs.map((n, i) => (
                <div key={n.id || i} className={`notif-row ${n.isRead ? '' : 'notif-unread'}`}>
                  <div className="notif-dot-col">
                    {!n.isRead && <span className="notif-unread-dot" />}
                  </div>
                  <div className="activity-body">
                    <span className="activity-title">{n.title || 'Notification'}</span>
                    <span className="activity-meta">{n.message || ''}</span>
                  </div>
                  <span className="activity-time">{fmtTime(n.createdAt)}</span>
                </div>
              ))}
        </div>
      </div>
    </div>
  );
};
