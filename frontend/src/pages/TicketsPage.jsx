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
        <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-blue-50/50 via-indigo-50/50 to-purple-50/50 text-gray-800">
            <div className="p-8 w-full max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 tracking-tight drop-shadow-sm">
                        {user.role === 'TECHNICIAN' ? 'Assigned Tickets' :
                            user.role === 'ADMIN' ? 'All Tickets' : 'My Tickets'}
                    </h1>
                    <button
                        onClick={handleCreateNew}
                        className="flex items-center gap-2 px-5 py-2.5 bg-white/70 hover:bg-white border border-white text-purple-700 rounded-2xl backdrop-blur-xl transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] shadow-sm group"
                    >
                        <Plus className="w-5 h-5 text-purple-500 group-hover:scale-110 transition-transform" />
                        <span className="font-bold">Raise Issue</span>
                    </button>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                    </div>
                ) : (
                    <div className="bg-white/50 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-white/80 overflow-hidden">
                        <ul className="divide-y divide-gray-100/50">
                            {tickets.map(ticket => (
                                <li
                                    key={ticket.id}
                                    className="hover:bg-white/80 transition-all duration-300 cursor-pointer p-6 flex justify-between items-center group relative overflow-hidden"
                                    onClick={() => setSelectedTicket(ticket)}
                                >
                                    <div className="absolute left-0 top-0 w-1 h-full bg-gradient-to-b from-blue-400 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <div className="flex items-start gap-5">
                                        <div className="mt-1 p-2.5 rounded-2xl bg-white/60 shadow-sm border border-gray-100 group-hover:bg-white transition-colors">
                                            {getStatusIcon(ticket.status)}
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors">{ticket.title}</h3>
                                            <div className="flex items-center gap-3 mb-2">
                                                <p className="text-sm text-gray-500 font-semibold bg-gray-100/50 px-2 py-0.5 rounded-lg border border-gray-200/50">
                                                    {ticket.resourceName || 'General Campus'} 
                                                </p>
                                                <span className="text-gray-300">•</span>
                                                <p className="text-xs text-gray-400 font-medium tracking-wide">
                                                    CREATED {new Date(ticket.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${
                                                ticket.status === 'OPEN' ? 'bg-blue-50 text-blue-600 border-blue-200 shadow-sm' :
                                                ticket.status === 'IN_PROGRESS' ? 'bg-yellow-50 text-yellow-700 border-yellow-200 shadow-sm' :
                                                ticket.status === 'RESOLVED' ? 'bg-green-50 text-green-700 border-green-200 shadow-sm' :
                                                ticket.status === 'CLOSED' ? 'bg-gray-100 text-gray-600 border-gray-200 shadow-sm' :
                                                ticket.status === 'REJECTED' ? 'bg-red-50 text-red-600 border-red-200 shadow-sm' : 
                                                'bg-gray-100 text-gray-600 border-gray-200 shadow-sm'
                                            }`}>
                                                {ticket.status}
                                            </span>
                                        </div>
                                    </div>
                                    {ticket.assignedTechnicianName && (
                                        <div className="hidden md:flex items-center gap-2 bg-white/60 px-4 py-2 rounded-2xl border border-gray-100 shadow-sm">
                                            <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse hidden md:block"></div>
                                            <span className="text-sm text-gray-500 font-medium">
                                                Assigned: <span className="text-purple-700 font-bold ml-1">{ticket.assignedTechnicianName}</span>
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
