import { useState, useEffect } from 'react';
import axios from '../api/axios';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '../context/AuthContext';
import {
    Plus, Check, X as XIcon, Calendar, Clock, Filter,
    Users, Copy, CheckCheck, Trash2, QrCode, FileText,
    ChevronDown, ScanLine, ShieldCheck, AlertCircle
} from 'lucide-react';
import { BookingForm } from '../components/BookingForm';
import { ToastContainer } from '../components/Toast';
import { useToast } from '../components/useToast';

/* ── Status config ── */
const STATUS = {
    APPROVED: { label: 'Approved', dot: '#10b981', badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200/60', bar: 'bg-emerald-400' },
    PENDING:  { label: 'Pending',  dot: '#f59e0b', badge: 'bg-amber-50  text-amber-700  ring-amber-200/60',   bar: 'bg-amber-400'   },
    REJECTED: { label: 'Rejected', dot: '#ef4444', badge: 'bg-rose-50   text-rose-700   ring-rose-200/60',    bar: 'bg-rose-400'    },
    CANCELLED:{ label: 'Cancelled',dot: '#94a3b8', badge: 'bg-slate-50  text-slate-500  ring-slate-200/60',   bar: 'bg-slate-300'   },
};
const getStatus = (s) => STATUS[s] || STATUS.CANCELLED;

/* ── Small meta row ── */
const MetaRow = ({ icon: Icon, children }) => (
    <div className="flex items-center gap-2.5 text-[13px] text-slate-500 font-medium">
        <Icon className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
        <span className="leading-snug">{children}</span>
    </div>
);

export const BookingsPage = () => {
    const { user } = useAuth();
    const { toasts, showToast, removeToast } = useToast();
    const [bookings, setBookings] = useState([]);
    const [filteredBookings, setFilteredBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [filterStatus, setFilterStatus] = useState('ALL');
    const [rejectionReason, setRejectionReason] = useState('');
    const [rejectingBookingId, setRejectingBookingId] = useState(null);
    const [copiedQR, setCopiedQR] = useState(null);
    const [expandedQR, setExpandedQR] = useState(null);
    const [attendanceCounts, setAttendanceCounts] = useState({});
    const [viewingAttendance, setViewingAttendance] = useState(null);
    const [attendanceList, setAttendanceList] = useState([]);
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    const fetchBookings = async () => {
        try {
            setLoading(true);
            const url = (user.role === 'ADMIN' || user.role === 'TECHNICIAN')
                ? '/api/bookings' : '/api/bookings/my-bookings';
            const res = await axios.get(url, { withCredentials: true });
            setBookings(res.data);
            const counts = {};
            for (const booking of res.data) {
                if (booking.status === 'APPROVED') {
                    try {
                        const ar = await axios.get(`/api/bookings/${booking.id}/attendance`, { withCredentials: true });
                        counts[booking.id] = ar.data.totalAttendees || 0;
                    } catch { counts[booking.id] = 0; }
                }
            }
            setAttendanceCounts(counts);
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    useEffect(() => { fetchBookings(); }, [user.role]);

    useEffect(() => {
        const refresh = async () => {
            try {
                const url = (user.role === 'ADMIN' || user.role === 'TECHNICIAN')
                    ? '/api/bookings' : '/api/bookings/my-bookings';
                const res = await axios.get(url, { withCredentials: true });
                const counts = {};
                for (const b of res.data) {
                    if (b.status === 'APPROVED') {
                        try {
                            const ar = await axios.get(`/api/bookings/${b.id}/attendance`, { withCredentials: true });
                            counts[b.id] = ar.data.totalAttendees || 0;
                        } catch { counts[b.id] = 0; }
                    }
                }
                setAttendanceCounts(counts);
            } catch (e) { console.error(e); }
        };
        refresh();
        const id = setInterval(refresh, 5000);
        return () => clearInterval(id);
    }, [user.role]);

    useEffect(() => {
        setFilteredBookings(filterStatus === 'ALL' ? bookings : bookings.filter(b => b.status === filterStatus));
    }, [bookings, filterStatus]);

    const handleStatusUpdate = async (id, status, reason = '') => {
        try {
            if (status === 'CANCELLED') {
                await axios.patch(`/api/bookings/${id}/cancel`, {}, { withCredentials: true });
            } else {
                const payload = { status };
                if (status === 'REJECTED' && reason) payload.rejectionReason = reason;
                await axios.put(`/api/bookings/${id}/approve`, payload, { withCredentials: true });
            }
            setRejectingBookingId(null); setRejectionReason('');
            fetchBookings();
        } catch { showToast('Failed to update status.', 'error'); }
    };

    const copyQRCode = (qrData, bookingId) => {
        const qrUrl = `${import.meta.env.VITE_NETWORK_URL || window.location.origin}/verify-qr?qrData=${encodeURIComponent(qrData)}`;
        const doCopy = (text) => {
            const ta = document.createElement('textarea');
            ta.value = text; ta.style.cssText = 'position:fixed;left:-9999px;top:-9999px';
            document.body.appendChild(ta); ta.focus(); ta.select();
            try { document.execCommand('copy'); setCopiedQR(bookingId); setTimeout(() => setCopiedQR(null), 2000); }
            catch { showToast('Failed to copy.', 'warning'); }
            document.body.removeChild(ta);
        };
        if (navigator.clipboard && window.isSecureContext)
            navigator.clipboard.writeText(qrUrl).then(() => { setCopiedQR(bookingId); setTimeout(() => setCopiedQR(null), 2000); }).catch(() => doCopy(qrUrl));
        else doCopy(qrUrl);
    };

    const handleDeleteBooking = (id, resourceName) => setDeleteConfirm({ id, resourceName });
    const confirmDelete = async () => {
        try {
            await axios.delete(`/api/bookings/${deleteConfirm.id}`, { withCredentials: true });
            setDeleteConfirm(null); fetchBookings();
        } catch (e) { showToast(e.response?.data?.error || 'Failed to delete.', 'error'); setDeleteConfirm(null); }
    };

    const viewAttendance = async (bookingId) => {
        try {
            const res = await axios.get(`/api/bookings/${bookingId}/attendance`, { withCredentials: true });
            setAttendanceList(res.data.attendanceList || []);
            setViewingAttendance(res.data);
        } catch { showToast('Failed to fetch attendance.', 'error'); }
    };

    /* ── Filter tabs ── */
    const TABS = ['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'];
    const tabCounts = TABS.reduce((acc, t) => {
        acc[t] = t === 'ALL' ? bookings.length : bookings.filter(b => b.status === t).length;
        return acc;
    }, {});

    return (
        <>
        <div className="min-h-screen bg-[#f8f9fc] px-6 py-8 md:px-10 lg:px-14 w-full max-w-[1440px] mx-auto">

            {/* ── Page Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 mb-8">
                <div>
                    <p className="text-[11px] font-bold tracking-[0.18em] uppercase text-indigo-500 mb-1.5">
                        {user.role === 'ADMIN' ? 'Administration' : user.role === 'TECHNICIAN' ? 'Technician View' : 'My Workspace'}
                    </p>
                    <h1 className="text-[28px] font-black text-slate-900 tracking-tight leading-none">
                        {user.role === 'ADMIN' ? 'Manage Bookings' : user.role === 'TECHNICIAN' ? 'All Bookings' : 'My Bookings'}
                    </h1>
                    <p className="text-slate-400 text-[13.5px] font-medium mt-1.5">
                        {filteredBookings.length} {filterStatus === 'ALL' ? 'total' : filterStatus.toLowerCase()} reservation{filteredBookings.length !== 1 ? 's' : ''}
                    </p>
                </div>
                {user.role === 'USER' && (
                    <button
                        onClick={() => setIsFormOpen(true)}
                        className="flex items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl font-bold text-[13.5px] transition-all duration-200 shadow-lg shadow-indigo-200 hover:shadow-indigo-300 hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap"
                    >
                        <Plus className="w-4 h-4" strokeWidth={2.5} />
                        New Booking
                    </button>
                )}
            </div>

            {/* ── Admin QR Banner ── */}
            {user.role === 'ADMIN' && (
                <div className="mb-7 flex items-center gap-4 px-5 py-4 bg-white rounded-2xl border border-indigo-100 shadow-sm shadow-indigo-50">
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-md shadow-indigo-200">
                        <ScanLine className="w-5 h-5 text-white" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-[13px] font-bold text-slate-800 mb-0.5">QR Code Check-in Verification</p>
                        <p className="text-[12.5px] text-slate-400 leading-snug">
                            Navigate to the <span className="font-semibold text-indigo-600">Verify QR</span> page to authenticate approved bookings and manage campus check-ins.
                        </p>
                    </div>
                </div>
            )}

            {/* ── Filter Tabs ── */}
            <div className="mb-7 flex items-center gap-1.5 bg-white border border-slate-100 rounded-2xl p-1.5 w-fit shadow-sm overflow-x-auto">
                {TABS.map(tab => {
                    const active = filterStatus === tab;
                    const cfg = tab !== 'ALL' ? getStatus(tab) : null;
                    return (
                        <button
                            key={tab}
                            onClick={() => setFilterStatus(tab)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[12.5px] font-bold transition-all duration-200 whitespace-nowrap
                                ${active
                                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                                }`}
                        >
                            {cfg && (
                                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: active ? 'rgba(255,255,255,0.7)' : cfg.dot }} />
                            )}
                            {tab === 'ALL' ? 'All' : tab.charAt(0) + tab.slice(1).toLowerCase()}
                            <span className={`text-[10.5px] font-black px-1.5 py-0.5 rounded-md min-w-[18px] text-center ${active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                {tabCounts[tab]}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* ── Loading ── */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-28 gap-3">
                    <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                    <p className="text-[13px] text-slate-400 font-medium">Loading reservations…</p>
                </div>
            ) : filteredBookings.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-28 gap-4">
                    <div className="w-16 h-16 bg-white rounded-2xl border border-dashed border-slate-200 flex items-center justify-center shadow-sm">
                        <Calendar className="w-7 h-7 text-slate-300" />
                    </div>
                    <div className="text-center">
                        <p className="font-bold text-slate-700 text-[15px]">No bookings found</p>
                        <p className="text-slate-400 text-[13px] mt-1">
                            {filterStatus !== 'ALL' ? `No ${filterStatus.toLowerCase()} bookings at the moment.` : "You don't have any bookings yet."}
                        </p>
                    </div>
                    {user.role === 'USER' && (
                        <button onClick={() => setIsFormOpen(true)}
                            className="mt-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-[13px] font-bold hover:bg-indigo-700 transition shadow-md shadow-indigo-200">
                            Create First Booking
                        </button>
                    )}
                </div>
            ) : (
                /* ── Grid ── */
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {filteredBookings.map((booking) => {
                        const st = getStatus(booking.status);
                        const isQROpen = expandedQR === booking.id;
                        const checkedIn = attendanceCounts[booking.id] ?? 0;
                        const total = booking.expectedAttendees;

                        return (
                            <div
                                key={booking.id}
                                className="group bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg hover:shadow-slate-100 transition-all duration-300 flex flex-col overflow-hidden hover:-translate-y-0.5"
                            >
                                {/* ── Top accent bar ── */}
                                <div className={`h-[3px] w-full ${st.bar}`} />

                                {/* ── Card Body ── */}
                                <div className="px-5 pt-5 pb-4 flex flex-col flex-1 gap-4">

                                    {/* Header row */}
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0 flex-1">
                                            <h3 className="text-[15.5px] font-bold text-slate-900 leading-snug truncate">
                                                {booking.resourceName}
                                            </h3>
                                            <p className="text-[12px] text-slate-400 font-medium mt-0.5 truncate">
                                                {booking.userName || 'Unknown User'}
                                            </p>
                                        </div>
                                        <span className={`flex-shrink-0 inline-flex items-center gap-1.5 text-[10.5px] px-2.5 py-1 rounded-lg font-bold ring-1 ${st.badge}`}>
                                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: st.dot }} />
                                            {st.label.toUpperCase()}
                                        </span>
                                    </div>

                                    {/* Meta info */}
                                    <div className="space-y-2.5">
                                        <MetaRow icon={Calendar}>
                                            {new Date(booking.startTime).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                                        </MetaRow>
                                        <MetaRow icon={Clock}>
                                            {new Date(booking.startTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                                            {' – '}
                                            {new Date(booking.endTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                                        </MetaRow>
                                        {total != null && (
                                            <div className="flex items-center justify-between">
                                                <MetaRow icon={Users}>
                                                    {booking.status === 'APPROVED' ? (
                                                        <span><span className="font-bold text-indigo-600">{checkedIn}</span> <span className="text-slate-400">/</span> {total} checked in</span>
                                                    ) : (
                                                        <span>{total} attendee{total !== 1 ? 's' : ''}</span>
                                                    )}
                                                </MetaRow>
                                                {booking.status === 'APPROVED' && checkedIn > 0 && (
                                                    <button onClick={() => viewAttendance(booking.id)}
                                                        className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg transition-colors">
                                                        View list
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                        {booking.purpose && (
                                            <MetaRow icon={FileText}>
                                                <span className="line-clamp-1">{booking.purpose}</span>
                                            </MetaRow>
                                        )}
                                    </div>

                                    {/* Attendance progress bar */}
                                    {booking.status === 'APPROVED' && total > 0 && (
                                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                                                style={{ width: `${Math.min((checkedIn / total) * 100, 100)}%` }}
                                            />
                                        </div>
                                    )}

                                    {/* Rejection reason */}
                                    {booking.rejectionReason && (
                                        <div className="flex items-start gap-2 p-3 bg-rose-50 border border-rose-100 rounded-xl">
                                            <AlertCircle className="w-3.5 h-3.5 text-rose-500 flex-shrink-0 mt-0.5" />
                                            <p className="text-[12px] text-rose-700 font-medium leading-snug">
                                                <span className="font-bold">Reason:</span> {booking.rejectionReason}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* ── Card Footer / Actions ── */}
                                <div className="px-5 pb-5 flex flex-col gap-2.5 border-t border-slate-50 pt-4">

                                    {/* QR Section */}
                                    {booking.status === 'APPROVED' && booking.qrValidationData && (
                                        <div className="rounded-xl overflow-hidden border border-slate-100">
                                            <button
                                                onClick={() => setExpandedQR(isQROpen ? null : booking.id)}
                                                className="w-full flex items-center justify-between gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[12.5px] font-bold transition-colors"
                                            >
                                                <span className="flex items-center gap-2">
                                                    <QrCode className="w-3.5 h-3.5" />
                                                    Check-in QR Code
                                                </span>
                                                <ChevronDown className={`w-3.5 h-3.5 opacity-70 transition-transform duration-200 ${isQROpen ? 'rotate-180' : ''}`} />
                                            </button>
                                            {isQROpen && (
                                                <div className="flex flex-col items-center gap-3 p-4 bg-slate-50">
                                                    <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                                                        <QRCodeSVG
                                                            value={`${import.meta.env.VITE_NETWORK_URL || window.location.origin}/verify-qr?qrData=${encodeURIComponent(booking.qrValidationData)}`}
                                                            size={120}
                                                            level="M"
                                                        />
                                                    </div>
                                                    <p className="text-[11.5px] font-semibold text-slate-500">Scan to check in at this venue</p>
                                                    <button
                                                        onClick={() => copyQRCode(booking.qrValidationData, booking.id)}
                                                        className={`w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-[12px] font-bold border transition-all duration-200
                                                            ${copiedQR === booking.id
                                                                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                                                : 'bg-white border-slate-200 text-slate-700 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700'}`}
                                                    >
                                                        {copiedQR === booking.id
                                                            ? <><CheckCheck className="w-3.5 h-3.5" /> Link Copied!</>
                                                            : <><Copy className="w-3.5 h-3.5" /> Copy QR Link</>}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Admin Actions */}
                                    {user.role === 'ADMIN' && (
                                        <div className="flex flex-col gap-2">
                                            {booking.status === 'PENDING' && (
                                                <div className="grid grid-cols-2 gap-2">
                                                    <button onClick={() => handleStatusUpdate(booking.id, 'APPROVED')}
                                                        className="flex items-center justify-center gap-1.5 py-2.5 bg-emerald-50 hover:bg-emerald-500 text-emerald-700 hover:text-white border border-emerald-200 hover:border-emerald-500 rounded-xl text-[12px] font-bold transition-all duration-200">
                                                        <Check className="w-3.5 h-3.5" /> Approve
                                                    </button>
                                                    <button onClick={() => setRejectingBookingId(booking.id)}
                                                        className="flex items-center justify-center gap-1.5 py-2.5 bg-rose-50 hover:bg-rose-500 text-rose-600 hover:text-white border border-rose-200 hover:border-rose-500 rounded-xl text-[12px] font-bold transition-all duration-200">
                                                        <XIcon className="w-3.5 h-3.5" /> Reject
                                                    </button>
                                                </div>
                                            )}
                                            <button onClick={() => handleDeleteBooking(booking.id, booking.resourceName)}
                                                className="flex items-center justify-center gap-1.5 py-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 rounded-xl text-[12px] font-bold transition-all duration-200">
                                                <Trash2 className="w-3.5 h-3.5" /> Delete Booking
                                            </button>
                                        </div>
                                    )}

                                    {/* User Actions */}
                                    {user.role === 'USER' && (
                                        <div className="flex items-center justify-between">
                                            {(booking.status === 'PENDING' || booking.status === 'APPROVED') ? (
                                                <button onClick={() => handleStatusUpdate(booking.id, 'CANCELLED')}
                                                    className="text-[12.5px] text-slate-400 font-semibold hover:text-rose-500 transition-colors">
                                                    Cancel booking
                                                </button>
                                            ) : <div />}
                                            <button onClick={() => handleDeleteBooking(booking.id, booking.resourceName)}
                                                className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>

        {/* ── Reject Modal ── */}
        {rejectingBookingId && (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-200">
                    <div className="h-1 bg-gradient-to-r from-rose-500 to-pink-500" />
                    <div className="p-6">
                        <div className="mb-5">
                            <h3 className="text-[17px] font-bold text-slate-900 mb-1">Reject Booking</h3>
                            <p className="text-[13px] text-slate-400">Provide a clear reason so the requester can understand the decision.</p>
                        </div>
                        <textarea
                            value={rejectionReason}
                            onChange={e => setRejectionReason(e.target.value)}
                            placeholder="e.g. Resource unavailable due to scheduled maintenance…"
                            rows="4"
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl text-[13.5px] text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-400 resize-none transition"
                        />
                        <div className="flex gap-3 mt-4">
                            <button onClick={() => { setRejectingBookingId(null); setRejectionReason(''); }}
                                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-[13px] hover:bg-slate-50 transition">
                                Cancel
                            </button>
                            <button onClick={() => {
                                if (!rejectionReason.trim()) { showToast('Please provide a reason.', 'warning'); return; }
                                handleStatusUpdate(rejectingBookingId, 'REJECTED', rejectionReason);
                            }}
                                className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white font-semibold text-[13px] hover:bg-rose-700 transition shadow-md shadow-rose-100">
                                Confirm Rejection
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* ── Delete Modal ── */}
        {deleteConfirm && (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-200">
                    <div className="h-1 bg-gradient-to-r from-rose-500 to-pink-500" />
                    <div className="p-7 text-center">
                        <div className="w-14 h-14 rounded-2xl bg-rose-50 flex items-center justify-center mx-auto mb-5">
                            <Trash2 className="w-7 h-7 text-rose-500" />
                        </div>
                        <h3 className="text-[17px] font-bold text-slate-900 mb-1.5">Delete Booking</h3>
                        <p className="text-[13px] text-slate-400 mb-1">You're about to permanently delete</p>
                        <p className="text-[14px] font-semibold text-slate-800 mb-1">"{deleteConfirm.resourceName}"</p>
                        <p className="text-[12px] text-rose-400 font-medium mb-6">This action cannot be undone.</p>
                        <div className="flex gap-3">
                            <button onClick={() => setDeleteConfirm(null)}
                                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-[13px] hover:bg-slate-50 transition">
                                Cancel
                            </button>
                            <button onClick={confirmDelete}
                                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 text-white font-semibold text-[13px] hover:from-rose-600 hover:to-pink-600 transition shadow-md shadow-rose-100">
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* ── Attendance Modal ── */}
        {viewingAttendance && (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 fade-in duration-200">
                    <div className="h-1 bg-gradient-to-r from-indigo-500 to-violet-500" />
                    {/* Header */}
                    <div className="px-6 py-5 border-b border-slate-100">
                        <div className="flex items-start justify-between mb-3">
                            <div>
                                <h3 className="text-[16px] font-bold text-slate-900">Attendance List</h3>
                                <p className="text-[12.5px] text-slate-400 mt-0.5">{viewingAttendance.booking?.resourceName}</p>
                            </div>
                            <button onClick={() => setViewingAttendance(null)} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition">
                                <XIcon className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-indigo-50 rounded-xl">
                            <Users className="w-5 h-5 text-indigo-600" />
                            <div>
                                <span className="text-[18px] font-black text-indigo-700">{viewingAttendance.totalAttendees}</span>
                                <span className="text-slate-400 text-[13px] font-medium"> / {viewingAttendance.expectedAttendees} students checked in</span>
                            </div>
                            <div className="ml-auto flex-shrink-0">
                                <div className="w-20 h-2 bg-white rounded-full overflow-hidden">
                                    <div className="h-full bg-indigo-500 rounded-full transition-all"
                                        style={{ width: `${Math.min((viewingAttendance.totalAttendees / viewingAttendance.expectedAttendees) * 100, 100)}%` }} />
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* List */}
                    <div className="flex-1 overflow-y-auto px-6 py-4">
                        {attendanceList.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 gap-2">
                                <Users className="w-10 h-10 text-slate-200" />
                                <p className="text-[13px] text-slate-400 font-medium">No students checked in yet</p>
                            </div>
                        ) : (
                            <div className="space-y-2.5">
                                {attendanceList.map((a, i) => (
                                    <div key={a.id} className="flex items-center gap-3.5 p-3.5 bg-slate-50 rounded-xl border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/30 transition-colors">
                                        <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white text-[12px] font-black flex items-center justify-center flex-shrink-0 shadow-sm shadow-indigo-200">
                                            {i + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-slate-800 text-[13.5px] truncate">{a.userName}</p>
                                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                                {a.studentId && <span className="text-[11px] text-indigo-600 font-semibold bg-indigo-50 px-1.5 py-0.5 rounded-md">{a.studentId}</span>}
                                                {a.userEmail && <span className="text-[11px] text-slate-400 truncate">{a.userEmail}</span>}
                                            </div>
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                            <p className="text-[10px] text-slate-400 font-medium">Checked in</p>
                                            <p className="text-[12.5px] font-bold text-slate-700">
                                                {new Date(a.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="px-6 py-4 border-t border-slate-100">
                        <button onClick={() => setViewingAttendance(null)}
                            className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[13px] transition">
                            Close
                        </button>
                    </div>
                </div>
            </div>
        )}

        {isFormOpen && (
            <BookingForm onClose={() => { setIsFormOpen(false); fetchBookings(); }} showToast={showToast} />
        )}

        <ToastContainer toasts={toasts} removeToast={removeToast} />
        </>
    );
};
