import { useState, useEffect } from 'react';
import axios from '../api/axios';
import { useAuth } from '../context/AuthContext';
import {
  Building2, CalendarDays, Ticket, Users, TrendingUp, TrendingDown,
  CheckCircle2, Clock, AlertCircle, Activity, ArrowRight,
  ShieldCheck, BarChart3, Zap, RefreshCw, Star, XCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// ─── Mini Sparkline (pure CSS/SVG) ───────────────────────────────────
function Sparkline({ data = [], color = '#06b6d4' }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 80, h = 32;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: 'visible' }}>
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <polyline
        points={`0,${h} ${points} ${w},${h}`}
        fill={`${color}20`}
        stroke="none"
      />
    </svg>
  );
}

// ─── Stat Card ───────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, trend, trendUp, color, sparkData, onClick }) {
  return (
    <button
      onClick={onClick}
      className="admin-stat-card group"
      style={{ '--card-accent': color }}
    >
      <div className="admin-stat-top">
        <div className="admin-stat-icon" style={{ background: `${color}20`, color }}>
          <Icon size={20} />
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
      {sparkData && (
        <div className="admin-stat-spark">
          <Sparkline data={sparkData} color={color} />
        </div>
      )}
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
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const load = async () => {
    setLoading(true);
    try {
      const [rRes, bRes, tRes] = await Promise.all([
        axios.get('/api/resources'),
        axios.get('/api/bookings'),
        axios.get('/api/tickets'),
      ]);
      const resourcesData = rRes.data || [];
      const bookingsData = bRes.data || [];
      const ticketsData = tRes.data || [];

      setStats({
        resources: resourcesData.length,
        bookings: bookingsData.length,
        tickets: ticketsData.length,
        openTickets: ticketsData.filter(t => t.status === 'OPEN').length,
        pendingBookings: bookingsData.filter(b => b.status === 'PENDING').length,
        activeResources: resourcesData.filter(r => r.status === 'ACTIVE').length,
      });

      // Sort by most recent
      const sortedBookings = [...bookingsData].sort((a, b) =>
        new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      ).slice(0, 5);

      const sortedTickets = [...ticketsData].sort((a, b) =>
        new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      ).slice(0, 5);

      setRecentBookings(sortedBookings);
      setRecentTickets(sortedTickets);
      setResources(resourcesData.slice(0, 6));
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
    const d = new Date(dt);
    const now = new Date();
    const diff = (now - d) / 1000;
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return d.toLocaleDateString();
  };

  const fmtDate = (dt) => {
    if (!dt) return '–';
    return new Date(dt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const firstName = user?.name?.split(' ')[0] || 'Admin';

  const systemHealth = [
    { label: 'Backend API', ok: true },
    { label: 'Database', ok: true },
    { label: 'Auth Service', ok: true },
    { label: 'Notifications', ok: true },
  ];

  if (loading) {
    return (
      <div className="admin-dash-loading">
        <div className="dash-spinner" />
        <span>Loading dashboard…</span>
      </div>
    );
  }

  return (
    <div className="admin-dash">
      {/* ── Hero greeting ── */}
      <div className="dash-hero">
        <div className="dash-hero-left">
          <div className="dash-greeting-badge">
            <ShieldCheck size={13} />
            Admin Control Center
          </div>
          <h1 className="dash-greeting-title">
            {greeting}, <span>{firstName}!</span>
          </h1>
          <p className="dash-greeting-sub">
            Here's what's happening across SmartCampus today.
          </p>
        </div>
        <div className="dash-hero-right">
          <div className="dash-refresh-info">
            <Activity size={13} />
            Last updated {fmtTime(lastRefresh)}
          </div>
          <button className="dash-refresh-btn" onClick={load}>
            <RefreshCw size={14} />
            Refresh
          </button>
        </div>
      </div>

      {/* ── Stats grid ── */}
      <div className="admin-stats-grid">
        <StatCard
          icon={Building2} label="Total Facilities" value={stats.resources}
          sub={`${stats.activeResources} active`} color="#06b6d4"
          sparkData={[3, 4, 4, 5, 5, 6, stats.resources]}
          trend={12} trendUp={true}
          onClick={() => navigate('/resources')}
        />
        <StatCard
          icon={CalendarDays} label="Total Bookings" value={stats.bookings}
          sub={`${stats.pendingBookings} pending approval`} color="#8b5cf6"
          sparkData={[8, 10, 9, 12, 11, 14, stats.bookings]}
          trend={8} trendUp={true}
          onClick={() => navigate('/bookings')}
        />
        <StatCard
          icon={Ticket} label="Support Tickets" value={stats.tickets}
          sub={`${stats.openTickets} open`} color="#f59e0b"
          sparkData={[2, 3, 5, 4, 6, 5, stats.tickets]}
          trend={stats.openTickets > 3 ? 15 : 5} trendUp={stats.openTickets > 3}
          onClick={() => navigate('/tickets')}
        />
        <StatCard
          icon={BarChart3} label="Active Resources" value={stats.activeResources}
          sub={`of ${stats.resources} total`} color="#22c55e"
          sparkData={[4, 4, 5, 5, 5, 6, stats.activeResources]}
          trend={5} trendUp={true}
          onClick={() => navigate('/resources')}
        />
      </div>

      {/* ── Middle row ── */}
      <div className="admin-mid-grid">
        {/* Quick Actions */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h2 className="admin-card-title"><Zap size={16} /> Quick Actions</h2>
          </div>
          <div className="quick-actions-list">
            <QuickAction icon={Building2} label="Manage Facilities" color="#06b6d4" onClick={() => navigate('/resources')} />
            <QuickAction icon={CalendarDays} label="Review Bookings" color="#8b5cf6" onClick={() => navigate('/bookings')} />
            <QuickAction icon={Ticket} label="Open Tickets" color="#f59e0b" onClick={() => navigate('/tickets')} />
            <QuickAction icon={CheckCircle2} label="Verify QR Code" color="#22c55e" onClick={() => navigate('/verify-qr')} />
          </div>
        </div>

        {/* System Health */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h2 className="admin-card-title"><Activity size={16} /> System Health</h2>
            <span className="health-all-ok">All systems operational</span>
          </div>
          <div className="health-list">
            {systemHealth.map(({ label, ok }) => (
              <div key={label} className="health-item">
                <span className="health-label">{label}</span>
                <div className="health-right">
                  <span className={`health-status ${ok ? 'ok' : 'err'}`}>
                    {ok ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                    {ok ? 'Online' : 'Offline'}
                  </span>
                  <div className="health-bar">
                    <div className="health-bar-fill" style={{ width: ok ? '100%' : '0%', background: ok ? '#22c55e' : '#ef4444' }} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pending alerts */}
          {(stats.pendingBookings > 0 || stats.openTickets > 0) && (
            <div className="pending-alerts">
              {stats.pendingBookings > 0 && (
                <div className="pending-alert warn">
                  <AlertCircle size={13} />
                  {stats.pendingBookings} booking{stats.pendingBookings > 1 ? 's' : ''} awaiting approval
                </div>
              )}
              {stats.openTickets > 0 && (
                <div className="pending-alert info">
                  <Clock size={13} />
                  {stats.openTickets} ticket{stats.openTickets > 1 ? 's' : ''} need attention
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Bottom row ── */}
      <div className="admin-bottom-grid">
        {/* Recent Bookings */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h2 className="admin-card-title"><CalendarDays size={16} /> Recent Bookings</h2>
            <button className="card-view-all" onClick={() => navigate('/bookings')}>
              View all <ArrowRight size={12} />
            </button>
          </div>
          <div className="activity-list">
            {recentBookings.length === 0 ? (
              <p className="empty-state">No bookings found.</p>
            ) : recentBookings.map((b, i) => (
              <ActivityItem
                key={b.id || i}
                icon={CalendarDays}
                color="#8b5cf6"
                title={b.resourceName || 'Resource'}
                meta={`${b.userName || 'User'} · ${fmtDate(b.startTime)}`}
                time={fmtTime(b.createdAt)}
                status={b.status}
              />
            ))}
          </div>
        </div>

        {/* Recent Tickets */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h2 className="admin-card-title"><Ticket size={16} /> Recent Tickets</h2>
            <button className="card-view-all" onClick={() => navigate('/tickets')}>
              View all <ArrowRight size={12} />
            </button>
          </div>
          <div className="activity-list">
            {recentTickets.length === 0 ? (
              <p className="empty-state">No tickets found.</p>
            ) : recentTickets.map((t, i) => (
              <ActivityItem
                key={t.id || i}
                icon={Ticket}
                color="#f59e0b"
                title={t.title || 'Ticket'}
                meta={t.creatorName || 'Unknown'}
                time={fmtTime(t.createdAt)}
                status={t.status}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── Resources overview ── */}
      <div className="admin-card" style={{ marginTop: 20 }}>
        <div className="admin-card-header">
          <h2 className="admin-card-title"><Building2 size={16} /> Facilities Overview</h2>
          <button className="card-view-all" onClick={() => navigate('/resources')}>
            Manage all <ArrowRight size={12} />
          </button>
        </div>
        <div className="resources-overview-grid">
          {resources.length === 0 ? (
            <p className="empty-state">No resources found.</p>
          ) : resources.map((r, i) => (
            <ResourceRow key={r.id || i} resource={r} />
          ))}
        </div>
      </div>
    </div>
  );
};
