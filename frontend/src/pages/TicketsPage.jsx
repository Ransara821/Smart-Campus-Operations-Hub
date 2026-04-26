import { useState, useEffect } from 'react';
import axios from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { TicketDetailsModal } from '../components/TicketDetailsModal';
import { Plus, Wrench, AlertCircle, CheckCircle2, XCircle, ChevronRight, Layers, Clock, Search, UserRound } from 'lucide-react';

export const TicketsPage = () => {
    const { user } = useAuth();
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [filter, setFilter] = useState('ALL');
    const [search, setSearch] = useState('');

    const fetchTickets = async () => {
        try {
            setLoading(true);
            let contextStr = '';
            if (user.role === 'USER') contextStr = '?context=my-tickets';
            if (user.role === 'TECHNICIAN') contextStr = '?context=assigned';

            const res = await axios.get(`/api/tickets${contextStr}`, { withCredentials: true });
            setTickets(res.data);
        } catch (error) {
            console.error("Failed to fetch tickets", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTickets();
    }, [user.role]);

    const handleCreateNew = () => {
        setSelectedTicket({ isNew: true });
    };

    const getStatusMeta = (status) => {
        const map = {
            OPEN: {
                label: 'Open',
                Icon: AlertCircle,
                iconColor: 'text-blue-600',
                pill: 'bg-blue-50 border-blue-200 text-blue-700',
                dot: 'bg-blue-500',
                accent: 'bg-blue-500'
            },
            IN_PROGRESS: {
                label: 'In Progress',
                Icon: Wrench,
                iconColor: 'text-amber-600',
                pill: 'bg-amber-50 border-amber-200 text-amber-700',
                dot: 'bg-amber-500',
                accent: 'bg-amber-500'
            },
            RESOLVED: {
                label: 'Resolved',
                Icon: CheckCircle2,
                iconColor: 'text-emerald-600',
                pill: 'bg-emerald-50 border-emerald-200 text-emerald-700',
                dot: 'bg-emerald-500',
                accent: 'bg-emerald-500'
            },
            CLOSED: {
                label: 'Closed',
                Icon: CheckCircle2,
                iconColor: 'text-slate-600',
                pill: 'bg-slate-100 border-slate-200 text-slate-700',
                dot: 'bg-slate-500',
                accent: 'bg-slate-400'
            },
            REJECTED: {
                label: 'Rejected',
                Icon: XCircle,
                iconColor: 'text-rose-600',
                pill: 'bg-rose-50 border-rose-200 text-rose-700',
                dot: 'bg-rose-500',
                accent: 'bg-rose-500'
            }
        };
        return map[status] || map.OPEN;
    };

    const stats = {
        total: tickets.length,
        open: tickets.filter(t => t.status === 'OPEN').length,
        inProgress: tickets.filter(t => t.status === 'IN_PROGRESS').length,
        closed: tickets.filter(t => ['CLOSED', 'RESOLVED', 'REJECTED'].includes(t.status)).length
    };

    const filteredTickets = tickets.filter(ticket => {
        if (filter === 'ALL') return true;
        if (filter === 'OPEN') return ticket.status === 'OPEN';
        if (filter === 'IN_PROGRESS') return ticket.status === 'IN_PROGRESS';
        if (filter === 'CLOSED') return ['CLOSED', 'RESOLVED', 'REJECTED'].includes(ticket.status);
        return true;
    }).filter(ticket => {
        if (!search.trim()) return true;
        const q = search.trim().toLowerCase();
        return (
            ticket.title?.toLowerCase().includes(q) ||
            ticket.resourceName?.toLowerCase().includes(q) ||
            ticket.assignedTechnicianName?.toLowerCase().includes(q)
        );
    });

    const roleBadgeClass =
        user.role === 'ADMIN'
            ? 'bg-violet-100 text-violet-700 border-violet-200'
            : user.role === 'TECHNICIAN'
                ? 'bg-amber-100 text-amber-700 border-amber-200'
                : 'bg-emerald-100 text-emerald-700 border-emerald-200';

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-slate-50 text-slate-800">
            <div className="p-6 md:p-8 w-full max-w-7xl mx-auto space-y-6">
                <header className="bg-white rounded-2xl border border-slate-200 shadow-sm px-6 py-5">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div className="space-y-2">
                            <div className="flex items-center gap-3 flex-wrap">
                                <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
                                    {user.role === 'TECHNICIAN'
                                        ? 'Assigned Tickets'
                                        : user.role === 'ADMIN'
                                            ? 'All Tickets'
                                            : 'Maintenance Tickets'}
                                </h1>
                                <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase border ${roleBadgeClass}`}>
                                    {user.role}
                                </span>
                            </div>
                            <p className="text-sm text-slate-500">
                                Track, prioritize, and manage campus issues from one place.
                            </p>
                        </div>
                        <button
                            onClick={handleCreateNew}
                            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition-colors shadow-sm"
                        >
                            <Plus className="w-4 h-4" />
                            <span className="text-sm font-semibold">Raise New Ticket</span>
                        </button>
                    </div>
                </header>

                <section className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                    {[
                        { key: 'total', label: 'Total Tickets', count: stats.total, Icon: Layers, color: 'text-slate-600', bg: 'bg-slate-100' },
                        { key: 'open', label: 'Open', count: stats.open, Icon: AlertCircle, color: 'text-blue-600', bg: 'bg-blue-100' },
                        { key: 'inProgress', label: 'In Progress', count: stats.inProgress, Icon: Clock, color: 'text-amber-600', bg: 'bg-amber-100' },
                        { key: 'closed', label: 'Closed', count: stats.closed, Icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-100' }
                    ].map(stat => {
                        const Icon = stat.Icon;
                        return (
                            <div key={stat.key} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{stat.label}</p>
                                        <p className="mt-2 text-3xl font-bold text-slate-900">{stat.count}</p>
                                    </div>
                                    <div className={`p-2 rounded-lg ${stat.bg}`}>
                                        <Icon className={`w-5 h-5 ${stat.color}`} />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </section>

                <section className="bg-white rounded-2xl border border-slate-200 shadow-sm">
                    <div className="p-4 md:p-5 border-b border-slate-100 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div className="flex flex-wrap gap-2">
                            {['ALL', 'OPEN', 'IN_PROGRESS', 'CLOSED'].map((f) => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={`px-3.5 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                                        filter === f
                                            ? 'bg-slate-900 text-white'
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                                >
                                    {f === 'ALL' ? 'All' : f === 'OPEN' ? 'Open' : f === 'IN_PROGRESS' ? 'In Progress' : 'Closed'}
                                </button>
                            ))}
                        </div>
                        <div className="relative w-full md:w-72">
                            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search by title, resource, assignee"
                                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-slate-200 focus:border-slate-300"
                            />
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex justify-center items-center h-64">
                            <div className="animate-spin rounded-full h-10 w-10 border-2 border-slate-300 border-b-slate-800" />
                        </div>
                    ) : (
                        <ul className="divide-y divide-slate-100">
                            {filteredTickets.map(ticket => {
                                const statusMeta = getStatusMeta(ticket.status);
                                const StatusIcon = statusMeta.Icon;
                                return (
                                    <li
                                        key={ticket.id}
                                        className="group relative px-4 md:px-6 py-4 hover:bg-slate-50 cursor-pointer transition-colors"
                                        onClick={() => setSelectedTicket(ticket)}
                                    >
                                        <div className={`absolute left-0 top-0 h-full w-1 ${statusMeta.accent}`} />
                                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pl-2">
                                            <div className="min-w-0 flex items-start gap-4">
                                                <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-200">
                                                    <StatusIcon className={`w-5 h-5 ${statusMeta.iconColor}`} />
                                                </div>
                                                <div className="min-w-0">
                                                    <h3 className="text-base md:text-lg font-semibold text-slate-900 truncate">{ticket.title}</h3>
                                                    <div className="mt-2 flex flex-wrap items-center gap-2">
                                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold uppercase border ${statusMeta.pill}`}>
                                                            <span className={`w-1.5 h-1.5 rounded-full ${statusMeta.dot}`} />
                                                            {statusMeta.label}
                                                        </span>
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                                                            <Layers className="w-3 h-3" />
                                                            {ticket.resourceName || 'General Campus'}
                                                        </span>
                                                        <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 px-1">
                                                            <Clock className="w-3 h-3" />
                                                            {new Date(ticket.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between lg:justify-end gap-3 lg:gap-4">
                                                {ticket.assignedTechnicianName && (
                                                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200">
                                                        <div className="w-6 h-6 rounded-full bg-white border border-slate-200 flex items-center justify-center">
                                                            <UserRound className="w-3.5 h-3.5 text-slate-500" />
                                                        </div>
                                                        <span className="text-sm font-medium text-slate-700">{ticket.assignedTechnicianName}</span>
                                                    </div>
                                                )}
                                                <div className="flex w-9 h-9 rounded-full items-center justify-center bg-white border border-slate-200 text-slate-400 group-hover:text-slate-700 transition-colors">
                                                    <ChevronRight className="w-4.5 h-4.5" />
                                                </div>
                                            </div>
                                        </div>
                                    </li>
                                );
                            })}
                            {filteredTickets.length === 0 && (
                                <li className="px-8 py-20 flex flex-col items-center text-center">
                                    <AlertCircle className="w-12 h-12 mb-3 text-slate-300" />
                                    <p className="text-lg font-semibold text-slate-700">No tickets found</p>
                                    <p className="text-sm mt-1 text-slate-500">
                                        {search ? 'Try adjusting your search or filters.' : 'New issues will appear here once submitted.'}
                                    </p>
                                </li>
                            )}
                        </ul>
                    )}
                </section>
            </div>

            {selectedTicket && (
                <TicketDetailsModal
                    ticket={selectedTicket}
                    onClose={() => {
                        setSelectedTicket(null);
                        fetchTickets();
                    }}
                />
            )}
        </div>
    );
};
