import { useState, useEffect } from 'react';
import axios from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { TicketDetailsModal } from '../components/TicketDetailsModal';
import { Plus, Wrench, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';

export const TicketsPage = () => {
    const { user } = useAuth();
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTicket, setSelectedTicket] = useState(null);

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
            case 'IN_PROGRESS': return <Wrench className="w-5 h-5 text-yellow-500" />;
            case 'RESOLVED': return <CheckCircle2 className="w-5 h-5 text-green-500" />;
            case 'CLOSED': return <CheckCircle2 className="w-5 h-5 text-gray-500" />;
            case 'REJECTED': return <XCircle className="w-5 h-5 text-red-500" />;
            default: return null;
        }
    };

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-slate-50 text-slate-800 font-sans">
            <div className="p-8 w-full max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                        {user.role === 'TECHNICIAN' ? 'Assigned Tickets' :
                            user.role === 'ADMIN' ? 'All Tickets' : 'My Tickets'}
                    </h1>
                    <button
                        onClick={handleCreateNew}
                        className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 group"
                    >
                        <Plus className="w-4 h-4" />
                        <span className="font-bold text-sm">Raise Issue</span>
                    </button>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <ul className="divide-y divide-slate-100">
                            {tickets.map(ticket => (
                                <li
                                    key={ticket.id}
                                    className="hover:bg-slate-50 transition-all duration-200 cursor-pointer p-5 sm:p-6 flex justify-between items-center group relative"
                                    onClick={() => setSelectedTicket(ticket)}
                                >
                                    <div className="flex items-start gap-4 sm:gap-5">
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
                                                ticket.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-700' :
                                                ticket.status === 'CLOSED' ? 'bg-slate-100 text-slate-600' :
                                                ticket.status === 'REJECTED' ? 'bg-red-100 text-red-700' : 
                                                'bg-slate-100 text-slate-600'
                                            }`}>
                                                {ticket.status.replace('_', ' ')}
                                            </span>
                                        </div>
                                    </div>
                                    {ticket.assignedTechnicianName && (
                                        <div className="hidden md:flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm">
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
                                            <span className="text-xs text-slate-500 font-medium">
                                                <span className="text-slate-900 font-bold">{ticket.assignedTechnicianName}</span>
                                            </span>
                                        </div>
                                    )}
                                </li>
                            ))}
                            {tickets.length === 0 && (
                                <li className="px-12 py-32 flex flex-col items-center text-center text-gray-400">
                                    <AlertCircle className="w-16 h-16 mb-4 opacity-20 text-indigo-500" />
                                    <p className="text-xl font-bold text-gray-600">No tickets found.</p>
                                    <p className="text-sm mt-2 font-medium text-gray-400">New issues will appear here once submitted.</p>
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
