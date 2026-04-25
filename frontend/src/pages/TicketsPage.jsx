import { useState, useEffect } from 'react';
import axios from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { TicketDetailsModal } from '../components/TicketDetailsModal';
import { Plus, Wrench, AlertCircle, CheckCircle2, XCircle, ChevronRight, Layers, Clock } from 'lucide-react';

export const TicketsPage = () => {
    const { user } = useAuth();
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [filter, setFilter] = useState('ALL');

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

    const getStatusIcon = (status) => {
        switch (status) {
            case 'OPEN': return <AlertCircle className="w-5 h-5 text-blue-500" />;
            case 'IN_PROGRESS': return <Wrench className="w-5 h-5 text-amber-500" />;
            case 'RESOLVED': return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
            case 'CLOSED': return <CheckCircle2 className="w-5 h-5 text-emerald-600" />;
            case 'REJECTED': return <XCircle className="w-5 h-5 text-red-500" />;
            default: return null;
        }
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
    });

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-slate-50 text-slate-800 font-sans">
            <div className="p-8 w-full max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                        {user.role === 'TECHNICIAN' ? 'Assigned Tickets' :
                            user.role === 'ADMIN' ? 'All Tickets' : 'Maintenance Tickets'}
                    </h1>
                    <button
                        onClick={handleCreateNew}
                        className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 group"
                    >
                        <Plus className="w-4 h-4" />
                        <span className="font-bold text-sm">Raise Issue</span>
                    </button>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
                    {[
                        { label: 'Total Tickets', count: stats.total, icon: Layers, color: 'text-slate-600', bg: 'bg-slate-100', border: 'border-slate-200' },
                        { label: 'Open', count: stats.open, icon: AlertCircle, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100/50' },
                        { label: 'In Progress', count: stats.inProgress, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100/50' },
                        { label: 'Closed', count: stats.closed, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100/50' }
                    ].map((stat, idx) => {
                        const Icon = stat.icon;
                        return (
                            <div key={idx} className={`bg-white border rounded-2xl p-6 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden group ${stat.border}`}>
                                {/* Watermark Background Icon */}
                                <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.06] transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-all duration-500 pointer-events-none">
                                    <Icon className={`w-28 h-28 ${stat.color}`} />
                                </div>
                                
                                <div className="relative z-10">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className={`p-2.5 rounded-xl ${stat.bg} ${stat.color} ring-1 ring-inset ring-black/5`}>
                                            <Icon className="w-5 h-5" />
                                        </div>
                                        <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">{stat.label}</span>
                                    </div>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-4xl font-extrabold text-slate-900 tracking-tight">{stat.count}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Filters */}
                <div className="flex gap-2 mb-6">
                    {['ALL', 'OPEN', 'IN_PROGRESS', 'CLOSED'].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
                                filter === f 
                                    ? 'bg-slate-900 text-white shadow-sm' 
                                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                            }`}
                        >
                            {f === 'ALL' ? 'All' : f === 'OPEN' ? 'Open' : f === 'IN_PROGRESS' ? 'In Progress' : 'Closed'}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <ul className="divide-y divide-slate-100">
                            {filteredTickets.map(ticket => (
                                <li
                                    key={ticket.id}
                                    className="hover:bg-slate-50 transition-all duration-200 cursor-pointer p-5 sm:p-6 flex justify-between items-center group relative"
                                    onClick={() => setSelectedTicket(ticket)}
                                >
                                    <div className="flex items-start gap-4 sm:gap-5 flex-1">
                                        <div className="mt-1 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-slate-500 group-hover:bg-white group-hover:shadow-sm transition-all">
                                            {getStatusIcon(ticket.status)}
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-900 mb-1.5 group-hover:text-blue-600 transition-colors">{ticket.title}</h3>
                                            <div className="flex items-center gap-2 mb-3">
                                                <p className="text-xs text-slate-600 font-semibold bg-slate-100 px-2 py-1 rounded-md">
                                                    {ticket.resourceName || 'General Campus'} 
                                                </p>
                                                <span className="text-slate-300">•</span>
                                                <p className="text-xs text-slate-500 font-medium">
                                                    {new Date(ticket.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                                                </p>
                                            </div>
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                                                ticket.status === 'OPEN' ? 'bg-blue-100 text-blue-700' :
                                                ticket.status === 'IN_PROGRESS' ? 'bg-amber-100 text-amber-700' :
                                                ['RESOLVED', 'CLOSED'].includes(ticket.status) ? 'bg-emerald-100 text-emerald-700' :
                                                ticket.status === 'REJECTED' ? 'bg-red-100 text-red-700' : 
                                                'bg-slate-100 text-slate-600'
                                            }`}>
                                                {ticket.status.replace('_', ' ')}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        {ticket.assignedTechnicianName && (
                                            <div className="hidden md:flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm">
                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
                                                <span className="text-xs text-slate-500 font-medium">
                                                    <span className="text-slate-900 font-bold">{ticket.assignedTechnicianName}</span>
                                                </span>
                                            </div>
                                        )}
                                        <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-slate-600 transition-colors" />
                                    </div>
                                </li>
                            ))}
                            {filteredTickets.length === 0 && (
                                <li className="px-12 py-32 flex flex-col items-center text-center text-slate-400">
                                    <AlertCircle className="w-16 h-16 mb-4 opacity-20 text-slate-500" />
                                    <p className="text-xl font-bold text-slate-600">No tickets found.</p>
                                    <p className="text-sm mt-2 font-medium text-slate-400">New issues will appear here once submitted.</p>
                                </li>
                            )}
                        </ul>
                    </div>
                )}

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
        </div>
    );
};
