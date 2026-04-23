import { useState, useEffect } from 'react';
import axios from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { TicketDetailsModal } from '../components/TicketDetailsModal';
import { Plus, Wrench, AlertCircle, CheckCircle2, XCircle, ChevronRight } from 'lucide-react';

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
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    {[
                        { label: 'Total Tickets', count: stats.total, color: 'text-slate-900' },
                        { label: 'Open', count: stats.open, color: 'text-blue-600' },
                        { label: 'In Progress', count: stats.inProgress, color: 'text-amber-600' },
                        { label: 'Closed', count: stats.closed, color: 'text-emerald-600' }
                    ].map((stat, idx) => (
                        <div key={idx} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-between">
                            <span className="text-sm font-semibold text-slate-500">{stat.label}</span>
                            <span className={`text-3xl font-bold mt-2 ${stat.color}`}>{stat.count}</span>
                        </div>
                    ))}
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
                                    className="hover:bg-slate-50/80 transition-colors duration-150 cursor-pointer px-5 py-4 flex items-center justify-between group relative border-l-2 border-transparent hover:border-slate-300"
                                    onClick={() => setSelectedTicket(ticket)}
                                >
                                    {/* Left Side: Icon & Info */}
                                    <div className="flex items-center gap-4 flex-1 min-w-0">
                                        <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-slate-50 border border-slate-100 group-hover:bg-white group-hover:shadow-sm transition-all">
                                            {getStatusIcon(ticket.status)}
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <h3 className="text-[15px] font-semibold text-slate-900 truncate mb-0.5 group-hover:text-slate-700 transition-colors">
                                                {ticket.title}
                                            </h3>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[13px] text-slate-500 font-medium truncate max-w-[160px]">
                                                    {ticket.resourceName || 'General Campus'} 
                                                </span>
                                                <span className="text-slate-300">•</span>
                                                <span className="text-xs text-slate-400 font-medium">
                                                    {new Date(ticket.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Right Side: Status, Assignee, Chevron */}
                                    <div className="flex items-center gap-6 flex-shrink-0 ml-4">
                                        <span className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                                            ticket.status === 'OPEN' ? 'bg-blue-50 text-blue-600 border border-blue-100/50' :
                                            ticket.status === 'IN_PROGRESS' ? 'bg-amber-50 text-amber-600 border border-amber-100/50' :
                                            ['RESOLVED', 'CLOSED'].includes(ticket.status) ? 'bg-emerald-50 text-emerald-600 border border-emerald-100/50' :
                                            ticket.status === 'REJECTED' ? 'bg-red-50 text-red-600 border border-red-100/50' : 
                                            'bg-slate-50 text-slate-600 border border-slate-100/50'
                                        }`}>
                                            {ticket.status.replace('_', ' ')}
                                        </span>

                                        {ticket.assignedTechnicianName && (
                                            <div className="hidden md:flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-slate-200 to-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600">
                                                    {ticket.assignedTechnicianName.charAt(0).toUpperCase()}
                                                </div>
                                                <span className="text-[13px] text-slate-600 font-medium max-w-[120px] truncate">
                                                    {ticket.assignedTechnicianName}
                                                </span>
                                            </div>
                                        )}
                                        
                                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
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
