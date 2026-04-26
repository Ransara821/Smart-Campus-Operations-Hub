import { useState, useEffect } from 'react';
import axios from '../api/axios';
import { useAuth } from '../context/AuthContext';
import {
  Building2, CalendarDays, Ticket, Users, TrendingUp, TrendingDown,
  CheckCircle2, Clock, AlertCircle, Activity, ArrowRight,
  ShieldCheck, Zap, RefreshCw, Star, XCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

// ─── Custom Chart Tooltip ─────────────────────────────────────────────
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

// ─── Stat Card ───────────────────────────────────────────────────────
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

// ─── Recent Activity Item ─────────────────────────────────────────────
function ActivityItem({ icon: Icon, color, title, meta, time, status }) {
  const statusMap = {
    APPROVED: { label: 'Approved', cls: 'status-success' },
    PENDING: { label: 'Pending', cls: 'status-warning' },
    REJECTED: { label: 'Rejected', cls: 'status-danger' },
    OPEN: { label: 'Open', cls: 'status-info' },
    IN_PROGRESS: { label: 'In Progress', cls: 'status-warning' },
    RESOLVED: { label: 'Resolved', cls: 'status-success' },
    ACTIVE: { label: 'Active', cls: 'status-success' },
    MAINTENANCE: { label: 'Maintenance', cls: 'status-warning' },
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

// ─── Quick Action Button ──────────────────────────────────────────────
function QuickAction({ icon: Icon, label, color, onClick }) {
  return (
    <button onClick={onClick} className="quick-action-btn" style={{ '--qa-color': color }}>
      <div className="qa-icon" style={{ background: `${color}15`, color }}>
        <Icon size={18} />
      </div>
      <span>{label}</span>
      <ArrowRight size={14} className="qa-arrow" />
    </button>
  );
}

// ─── Resource Status Badge ────────────────────────────────────────────
function ResourceRow({ resource }) {
  const statusColor = {
    ACTIVE: '#22c55e', MAINTENANCE: '#f59e0b', INACTIVE: '#ef4444'
  }[resource.status] || '#94a3b8';
  const typeIcon = { LECTURE_HALL: Building2, LAB: Zap, EQUIPMENT: Star }[resource.type] || Building2;
  const TypeIcon = typeIcon;
  return (
    <div className="resource-row">
      <div className="resource-row-icon" style={{ background: `${statusColor}15`, color: statusColor }}>
        <TypeIcon size={14} />
      </div>
      <div className="resource-row-info">
        <span className="resource-row-name">{resource.name}</span>
        <span className="resource-row-type">{resource.type?.replace('_', ' ')} • {resource.location}</span>
      </div>
      <div className="resource-row-right">
        <span className="resource-row-cap">Cap: {resource.capacity}</span>
        <span className="resource-status-dot" style={{ background: statusColor }} title={resource.status} />
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────
export const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState({ resources: 0, bookings: 0, tickets: 0, users: 0 });
  const [recentBookings, setRecentBookings] = useState([]);
  const [recentTickets, setRecentTickets] = useState([]);
  const [resources, setResources] = useState([]);
  const [bookingChartData, setBookingChartData] = useState([]);
  const [ticketChartData, setTicketChartData] = useState([]);
  const [trendData, setTrendData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const load = async () => {
    setLoading(true);
    try {
      const [rRes, bRes, tRes, uRes] = await Promise.all([
        axios.get('/api/resources'),
        axios.get('/api/bookings'),
        axios.get('/api/tickets'),
        axios.get('/api/users').catch(() => ({ data: [] })),
      ]);
      const rd = rRes.data || [], bd = bRes.data || [], td = tRes.data || [], ud = uRes.data || [];

      setStats({
        resources: rd.length, bookings: bd.length, tickets: td.length, users: ud.length,
        openTickets: td.filter(t => t.status === 'OPEN').length,
        pendingBookings: bd.filter(b => b.status === 'PENDING').length,
        activeResources: rd.filter(r => r.status === 'ACTIVE').length,
      });

      const bGroups = { PENDING: 0, APPROVED: 0, REJECTED: 0 };
      bd.forEach(b => { if (bGroups[b.status] !== undefined) bGroups[b.status]++; });
      setBookingChartData([
        { name: 'Pending', value: bGroups.PENDING, fill: '#f59e0b' },
        { name: 'Approved', value: bGroups.APPROVED, fill: '#22c55e' },
        { name: 'Rejected', value: bGroups.REJECTED, fill: '#ef4444' },
      ]);

      const tGroups = { OPEN: 0, IN_PROGRESS: 0, RESOLVED: 0 };
      td.forEach(t => { if (tGroups[t.status] !== undefined) tGroups[t.status]++; });
      setTicketChartData([
        { name: 'Open', value: tGroups.OPEN, fill: '#3b82f6' },
        { name: 'In Progress', value: tGroups.IN_PROGRESS, fill: '#f59e0b' },
        { name: 'Resolved', value: tGroups.RESOLVED, fill: '#22c55e' },
      ]);

      const trend = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(); d.setDate(d.getDate() - (6 - i));
        const ds = d.toDateString();
        return {
          day: d.toLocaleDateString('en-US', { weekday: 'short' }),
          Bookings: bd.filter(b => b.createdAt && new Date(b.createdAt).toDateString() === ds).length,
          Tickets: td.filter(t => t.createdAt && new Date(t.createdAt).toDateString() === ds).length,
        };
      });
      setTrendData(trend);

      setRecentBookings([...bd].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)).slice(0, 5));
      setRecentTickets([...td].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)).slice(0, 5));
      setResources(rd.slice(0, 6));
      setLastRefresh(new Date());
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const fmtTime = (dt) => {
    if (!dt) return '–';
    const d = new Date(dt), now = new Date(), diff = (now - d) / 1000;
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return d.toLocaleDateString();
  };
  const fmtDate = (dt) => dt ? new Date(dt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '–';

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const firstName = user?.name?.split(' ')[0] || 'Admin';
  const totalTickets = ticketChartData.reduce((s, d) => s + d.value, 0);

  const systemHealth = [
    { label: 'Backend API', ok: true }, { label: 'Database', ok: true },
    { label: 'Auth Service', ok: true }, { label: 'Notifications', ok: true },
  ];

  if (loading) return (
    <div className="admin-dash-loading"><div className="dash-spinner" /><span>Loading dashboard…</span></div>
  );

  return (
    <div className="admin-dash">
      {/* Hero */}
      <div className="dash-hero">
        <div className="dash-hero-left">
          <div className="dash-greeting-badge"><ShieldCheck size={13} /> Admin Control Center</div>
          <h1 className="dash-greeting-title">{greeting}, <span>{firstName}!</span></h1>
          <p className="dash-greeting-sub">Here's what's happening across SmartCampus today.</p>
        </div>
        <div className="dash-hero-right">
          <div className="dash-refresh-info"><Activity size={13} /> Last updated {fmtTime(lastRefresh)}</div>
          <button className="dash-refresh-btn" onClick={load}><RefreshCw size={14} /> Refresh</button>
        </div>
      </div>

      {/* Stats */}
      <div className="admin-stats-grid">
        <StatCard icon={Building2} label="Total Facilities" value={stats.resources} sub={`${stats.activeResources} active`} color="#06b6d4" trend={12} trendUp onClick={() => navigate('/resources')} />
        <StatCard icon={CalendarDays} label="Total Bookings" value={stats.bookings} sub={`${stats.pendingBookings} pending`} color="#8b5cf6" trend={8} trendUp onClick={() => navigate('/bookings')} />
        <StatCard icon={Ticket} label="Support Tickets" value={stats.tickets} sub={`${stats.openTickets} open`} color="#f59e0b" trend={stats.openTickets > 3 ? 15 : 5} trendUp={stats.openTickets <= 3} onClick={() => navigate('/tickets')} />
        <StatCard icon={Users} label="Total Users" value={stats.users} sub="registered accounts" color="#22c55e" trend={5} trendUp onClick={() => navigate('/users')} />
      </div>

      {/* Charts row */}
      <div className="admin-charts-grid">
        {/* Area – 7-day trend */}
        <div className="admin-card admin-chart-wide">
          <div className="admin-card-header">
            <h2 className="admin-card-title"><Activity size={16} /> 7-Day Activity Trend</h2>
            <div className="chart-legend">
              <span className="legend-dot" style={{ background: '#8b5cf6' }} /> Bookings
              <span className="legend-dot" style={{ background: '#f59e0b', marginLeft: 14 }} /> Tickets
            </div>
          </div>
          <ResponsiveContainer width="100%" height={190}>
            <AreaChart data={trendData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gbk" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.25} /><stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gtk" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25} /><stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="Bookings" stroke="#8b5cf6" strokeWidth={2.5} fill="url(#gbk)" dot={false} activeDot={{ r: 4 }} />
              <Area type="monotone" dataKey="Tickets" stroke="#f59e0b" strokeWidth={2.5} fill="url(#gtk)" dot={false} activeDot={{ r: 4 }} />
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
          <QuickAction icon={Building2} label="Manage Facilities" color="#06b6d4" onClick={() => navigate('/resources')} />
          <QuickAction icon={CalendarDays} label="Review Bookings" color="#8b5cf6" onClick={() => navigate('/bookings')} />
          <QuickAction icon={Ticket} label="Open Tickets" color="#f59e0b" onClick={() => navigate('/tickets')} />
          <QuickAction icon={CheckCircle2} label="Verify QR Code" color="#22c55e" onClick={() => navigate('/verify-qr')} />
          <QuickAction icon={Users} label="Manage Users" color="#3b82f6" onClick={() => navigate('/users')} />
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
            {recentBookings.length === 0 ? <p className="empty-state">No bookings found.</p>
              : recentBookings.map((b, i) => (
                <ActivityItem key={b.id || i} icon={CalendarDays} color="#8b5cf6"
                  title={b.resourceName || 'Resource'} meta={`${b.userName || 'User'} · ${fmtDate(b.startTime)}`}
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
            {recentTickets.length === 0 ? <p className="empty-state">No tickets found.</p>
              : recentTickets.map((t, i) => (
                <ActivityItem key={t.id || i} icon={Ticket} color="#f59e0b"
                  title={t.title || 'Ticket'} meta={t.creatorName || 'Unknown'}
                  time={fmtTime(t.createdAt)} status={t.status} />
              ))}
          </div>
        </div>
      </div>

      {/* Facilities Overview */}
      <div className="admin-card">
        <div className="admin-card-header">
          <h2 className="admin-card-title"><Building2 size={16} /> Facilities Overview</h2>
          <button className="card-view-all" onClick={() => navigate('/resources')}>Manage all <ArrowRight size={12} /></button>
        </div>
        <div className="resources-overview-grid">
          {resources.length === 0 ? <p className="empty-state">No resources found.</p>
            : resources.map((r, i) => <ResourceRow key={r.id || i} resource={r} />)}
        </div>
      </div>
    </div>
  );
};
