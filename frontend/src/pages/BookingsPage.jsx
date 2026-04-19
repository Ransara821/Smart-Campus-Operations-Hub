import { useState, useEffect } from 'react';
import axios from '../api/axios';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '../context/AuthContext';
import { Plus, Check, X as XIcon, Calendar, Clock, Filter, Users, Copy, CheckCheck, Trash2, QrCode, FileText } from 'lucide-react';
import { BookingForm } from '../components/BookingForm';
import { ToastContainer } from '../components/Toast';
import { useToast } from '../components/useToast';

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
    const [attendanceCounts, setAttendanceCounts] = useState({});
    const [viewingAttendance, setViewingAttendance] = useState(null);
    const [attendanceList, setAttendanceList] = useState([]);
    const [deleteConfirm, setDeleteConfirm] = useState(null); // { id, resourceName }

    // For Admin and Technician, fetch all. For User, fetch my-bookings.
    const fetchBookings = async () => {
        try {
            setLoading(true);
            const url = (user.role === 'ADMIN' || user.role === 'TECHNICIAN')
                ? '/api/bookings'
                : '/api/bookings/my-bookings';

            const res = await axios.get(url, { withCredentials: true });
            setBookings(res.data);
            
            // Fetch attendance counts for each approved booking
            const counts = {};
            for (const booking of res.data) {
                if (booking.status === 'APPROVED') {
                    try {
                        const attendanceRes = await axios.get(`/api/bookings/${booking.id}/attendance`, { withCredentials: true });
                        counts[booking.id] = attendanceRes.data.totalAttendees || 0;
                    } catch (err) {
                        counts[booking.id] = 0;
                    }
                }
            }
            setAttendanceCounts(counts);
        } catch (error) {
            console.error("Failed to fetch bookings", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBookings();
    }, [user.role]);
    
    // Separate effect for auto-refresh - fetch counts every 5 seconds
    useEffect(() => {
        const fetchAttendanceCountsInterval = async () => {
            try {
                const url = (user.role === 'ADMIN' || user.role === 'TECHNICIAN')
                    ? '/api/bookings'
                    : '/api/bookings/my-bookings';

                console.log('🔄 Fetching bookings from:', url);
                const res = await axios.get(url, { withCredentials: true });
                console.log('📦 Total bookings:', res.data.length);
                
                const counts = {};
                let approvedCount = 0;
                
                for (const booking of res.data) {
                    if (booking.status === 'APPROVED') {
                        approvedCount++;
                        try {
                            console.log(`  📊 Fetching attendance for ${booking.resourceName} (ID: ${booking.id})`);
                            const attendanceRes = await axios.get(`/api/bookings/${booking.id}/attendance`, { withCredentials: true });
                            const newCount = attendanceRes.data.totalAttendees || 0;
                            counts[booking.id] = newCount;
                            console.log(`     Result: ${newCount}/${booking.expectedAttendees}`);
                        } catch (err) {
                            console.error(`     ❌ Failed to fetch attendance for ${booking.id}:`, err.response?.data || err.message);
                            counts[booking.id] = 0;
                        }
                    }
                }
                
                console.log(`✅ Processed ${approvedCount} approved bookings`);
                
                setAttendanceCounts(prevCounts => {
                    // Log changes
                    const bookingIds = new Set([...Object.keys(prevCounts), ...Object.keys(counts)]);
                    let changesDetected = false;
                    bookingIds.forEach(id => {
                        if (prevCounts[id] !== counts[id]) {
                            const booking = res.data.find(b => b.id === id);
                            console.log(`🔔 ATTENDANCE CHANGED for ${booking?.resourceName || id}: ${prevCounts[id] || 0} → ${counts[id]}/${booking?.expectedAttendees || '?'}`);
                            changesDetected = true;
                        }
                    });
                    if (!changesDetected) {
                        console.log('   No changes detected');
                    }
                    return counts;
                });
            } catch (error) {
                console.error("❌ Failed to refresh attendance counts:", error.response?.data || error.message);
            }
        };
        
        // Run immediately on mount
        console.log('🚀 Starting attendance auto-refresh');
        fetchAttendanceCountsInterval();
        
        // Set up interval for auto-refresh every 5 seconds
        const intervalId = setInterval(() => {
            console.log('\n⏰ Auto-refresh triggered (5s interval)');
            fetchAttendanceCountsInterval();
        }, 5000);
        
        return () => {
            console.log('🛑 Stopping auto-refresh');
            clearInterval(intervalId);
        };
    }, [user.role]);

    useEffect(() => {
        // Apply filters
        if (filterStatus === 'ALL') {
            setFilteredBookings(bookings);
        } else {
            setFilteredBookings(bookings.filter(b => b.status === filterStatus));
        }
    }, [bookings, filterStatus]);

    const handleStatusUpdate = async (id, status, reason = '') => {
        try {
            if (status === 'CANCELLED') {
                await axios.patch(`/api/bookings/${id}/cancel`, {}, { withCredentials: true });
            } else {
                const payload = { status };
                if (status === 'REJECTED' && reason) {
                    payload.rejectionReason = reason;
                }
                await axios.put(`/api/bookings/${id}/approve`, payload, { withCredentials: true });
            }
            setRejectingBookingId(null);
            setRejectionReason('');
            fetchBookings();
        } catch (error) {
            showToast('Failed to update status. Please try again.', 'error');
        }
    };

    const handleRejectClick = (bookingId) => {
        setRejectingBookingId(bookingId);
    };

    const confirmReject = () => {
        if (!rejectionReason.trim()) {
            showToast('Please provide a reason for rejection.', 'warning');
            return;
        }
        handleStatusUpdate(rejectingBookingId, 'REJECTED', rejectionReason);
    };

    const copyQRCode = (qrData, bookingId) => {
        // Copy the full URL, not just the token
        const qrUrl = `${import.meta.env.VITE_NETWORK_URL || window.location.origin}/verify-qr?qrData=${encodeURIComponent(qrData)}`;
        console.log('Copying QR URL:', qrUrl);
        
        // Try modern clipboard API first, fallback to textarea method
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(qrUrl)
                .then(() => {
                    console.log('✅ QR URL copied successfully (Clipboard API)');
                    setCopiedQR(bookingId);
                    setTimeout(() => setCopiedQR(null), 2000);
                })
                .catch(err => {
                    console.error('❌ Clipboard API failed:', err);
                    fallbackCopy(qrUrl, bookingId);
                });
        } else {
            // Fallback for non-secure contexts (HTTP)
            fallbackCopy(qrUrl, bookingId);
        }
    };

    const fallbackCopy = (text, bookingId) => {
        // Create temporary textarea
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            const successful = document.execCommand('copy');
            if (successful) {
                console.log('✅ QR URL copied successfully (fallback method)');
                setCopiedQR(bookingId);
                setTimeout(() => setCopiedQR(null), 2000);
            } else {
                console.error('❌ Fallback copy failed');
                showToast('Failed to copy. Please copy manually.', 'warning');
            }
        } catch (err) {
            console.error('❌ Fallback copy error:', err);
            showToast('Failed to copy. Please copy manually.', 'warning');
        } finally {
            document.body.removeChild(textArea);
        }
    };

    const handleDeleteBooking = (bookingId, resourceName) => {
        setDeleteConfirm({ id: bookingId, resourceName });
    };

    const confirmDelete = async () => {
        try {
            await axios.delete(`/api/bookings/${deleteConfirm.id}`, { withCredentials: true });
            setDeleteConfirm(null);
            fetchBookings();
        } catch (error) {
            showToast(error.response?.data?.error || 'Failed to delete booking.', 'error');
            setDeleteConfirm(null);
        }
    };
    
    const viewAttendance = async (bookingId) => {
        try {
            const res = await axios.get(`/api/bookings/${bookingId}/attendance`, { withCredentials: true });
            setAttendanceList(res.data.attendanceList || []);
            setViewingAttendance(res.data);
        } catch (error) {
            showToast('Failed to fetch attendance data.', 'error');
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'APPROVED': return 'bg-green-100 text-green-800';
            case 'PENDING': return 'bg-yellow-100 text-yellow-800';
            case 'REJECTED': return 'bg-red-100 text-red-800';
            case 'CANCELLED': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <>
        <div className="p-8 w-full max-w-[1400px] mx-auto bg-[#fafafa]/30 min-h-screen">
            <div className="flex justify-between items-start mb-8">
                <div>
                    <h1 className="text-[36px] font-extrabold text-gray-900 tracking-tight leading-tight mb-2">
                        {user.role === 'ADMIN' ? 'Manage Bookings' : 
                         user.role === 'TECHNICIAN' ? 'All Bookings' : 'My Bookings'}
                    </h1>
                    <p className="text-gray-500 text-[15px] font-medium">Manage your facility and equipment reservations.</p>
                </div>
                {user.role === 'USER' && (
                    <button 
                        onClick={() => setIsFormOpen(true)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-[#1a56db] text-white rounded-xl font-bold text-[15px] hover:bg-[#1e4ebd] transition shadow-md"
                    >
                        <Plus className="w-5 h-5 flex-shrink-0" strokeWidth={2.5} />
                        New Booking
                    </button>
                )}
            </div>

            {/* QR Verification Info Banner for Admin only */}
            {user.role === 'ADMIN' && (
                <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 border-l-4 border-purple-500 rounded-lg">
                    <div className="flex items-start gap-3">
                        <div className="bg-purple-500 rounded-full p-2 flex-shrink-0">
                            <QRCodeSVG value="demo" size={24} className="opacity-0" />
                            <span className="absolute text-white text-xl">📱</span>
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-800 mb-1">QR Code Verification</h3>
                            <p className="text-sm text-gray-600">
                                Go to <span className="font-bold text-purple-700">Verify QR</span> page to scan or enter QR code data for approved bookings. 
                                All booking details will be displayed for check-in validation.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="mb-8 flex items-center justify-between bg-gray-50/80 px-6 py-4 rounded-2xl border border-gray-100">
                <div className="flex items-center gap-4">
                    <span className="text-sm font-bold text-gray-600">Filter By:</span>
                    <select 
                        value={filterStatus} 
                        onChange={e => setFilterStatus(e.target.value)}
                        className="px-4 py-2 bg-white rounded-xl text-sm font-bold text-gray-700 shadow-sm border border-gray-100 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer appearance-none min-w-[130px]"
                    >
                        <option value="ALL">All</option>
                        <option value="PENDING">Pending</option>
                        <option value="APPROVED">Approved</option>
                        <option value="REJECTED">Rejected</option>
                        <option value="CANCELLED">Cancelled</option>
                    </select>
                </div>
                <span className="text-[13px] font-bold text-gray-500">
                    Showing {filteredBookings.length} bookings
                </span>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                     <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1a56db]"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredBookings.map((booking, index) => (
                        <div key={booking.id} className="relative bg-white rounded-2xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.05)] border border-gray-100/60 p-6 flex flex-col h-full overflow-hidden hover:shadow-[0_6px_24px_-4px_rgba(26,86,219,0.12)] transition-all duration-300 group/card">
                            {/* Status-based left accent bar */}
                            <div className={`absolute left-0 top-0 bottom-0 w-[4px] rounded-r-sm ${
                                booking.status === 'APPROVED' ? 'bg-green-400' :
                                booking.status === 'PENDING'  ? 'bg-yellow-400' :
                                booking.status === 'REJECTED' ? 'bg-red-400' :
                                'bg-gray-300'
                            }`}></div>

                            {/* Card Header */}
                            <div className="flex justify-between items-start mb-5 w-full pl-3">
                                <div className="pr-3 flex-1 min-w-0">
                                    <h3 className="text-[17px] font-bold text-gray-900 mb-0.5 leading-snug break-words">
                                        {booking.resourceName}
                                    </h3>
                                    <p className="text-[12px] font-medium text-gray-400">{booking.userName || 'Unknown User'}</p>
                                </div>
                                <span className={`flex-shrink-0 text-[10px] px-2.5 py-1 rounded-full font-extrabold uppercase tracking-widest ${getStatusColor(booking.status)}`}>
                                    {booking.status}
                                </span>
                            </div>

                            {/* Card Details — all rows left-aligned with icons */}
                            <div className="flex-grow flex flex-col pl-3 mb-5 space-y-3">
                                {/* Date */}
                                <div className="flex items-center gap-3">
                                    <Calendar className="w-[15px] h-[15px] text-[#1a56db] flex-shrink-0" />
                                    <span className="text-[13px] font-medium text-gray-600">
                                        {new Date(booking.startTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </span>
                                </div>

                                {/* Time */}
                                <div className="flex items-center gap-3">
                                    <Clock className="w-[15px] h-[15px] text-[#1a56db] flex-shrink-0" />
                                    <span className="text-[13px] font-medium text-gray-600">
                                        {new Date(booking.startTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} – {new Date(booking.endTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                                    </span>
                                </div>

                                {/* Attendees */}
                                {(booking.expectedAttendees !== undefined && booking.expectedAttendees !== null) && (
                                    <div className="flex items-center gap-3">
                                        <Users className="w-[15px] h-[15px] text-[#1a56db] flex-shrink-0" />
                                        <span className="text-[13px] font-medium text-gray-600 flex-1">
                                            {booking.status === 'APPROVED' && attendanceCounts[booking.id] !== undefined ? (
                                                <><span className="font-bold text-[#1a56db]">{attendanceCounts[booking.id]}</span> <span className="text-gray-400">/</span> {booking.expectedAttendees} Attendees</>
                                            ) : (
                                                <>{booking.expectedAttendees} Attendees</>
                                            )}
                                        </span>
                                        {booking.status === 'APPROVED' && attendanceCounts[booking.id] > 0 && (
                                            <button
                                                onClick={() => viewAttendance(booking.id)}
                                                className="text-[11px] text-[#1a56db] hover:text-white hover:bg-[#1a56db] font-bold uppercase tracking-wide bg-blue-50 px-2 py-1 rounded-md transition-all duration-200"
                                            >
                                                View
                                            </button>
                                        )}
                                    </div>
                                )}

                                {/* Purpose */}
                                {booking.purpose && (
                                    <div className="flex items-start gap-3">
                                        <FileText className="w-[15px] h-[15px] text-[#1a56db] flex-shrink-0 mt-[1px]" />
                                        <span className="text-[13px] font-medium text-gray-600 line-clamp-2">{booking.purpose}</span>
                                    </div>
                                )}

                                {/* Rejection reason */}
                                {booking.rejectionReason && (
                                    <div className="p-3 bg-red-50 rounded-xl border border-red-100">
                                        <p className="text-xs text-red-700">
                                            <span className="font-bold">Reason:</span> {booking.rejectionReason}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Actions and QR */}
                            <div className="mt-auto flex flex-col gap-2 pl-3 border-t border-gray-50 pt-4">

                                {/* Show Check-in QR — primary blue button */}
                                {booking.status === 'APPROVED' && booking.qrValidationData && (
                                    <details className="group rounded-xl overflow-hidden mb-1">
                                        <summary className="flex items-center justify-center gap-2 px-4 py-2.5 text-[13px] font-bold text-white bg-[#1a56db] hover:bg-[#1648c0] active:bg-[#1240ab] rounded-xl transition-all duration-200 list-none cursor-pointer shadow-sm hover:shadow-md hover:shadow-blue-200">
                                            <QrCode className="w-[15px] h-[15px]" />
                                            Show Check-in QR
                                        </summary>
                                        <div className="mt-2 p-4 flex flex-col items-center bg-gray-50 border border-gray-100 rounded-xl">
                                            <div className="bg-white p-2 rounded-xl shadow-sm border border-gray-100 mb-3">
                                                <QRCodeSVG 
                                                    value={`${import.meta.env.VITE_NETWORK_URL || window.location.origin}/verify-qr?qrData=${encodeURIComponent(booking.qrValidationData)}`}
                                                    size={110} 
                                                    level="M" 
                                                />
                                            </div>
                                            <p className="text-[11px] font-semibold text-[#1a56db] mb-3 text-center">📱 Scan to check in</p>
                                            <button
                                                onClick={() => copyQRCode(booking.qrValidationData, booking.id)}
                                                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-[#1a56db] hover:text-white hover:border-[#1a56db] transition-all duration-200 text-xs font-bold"
                                            >
                                                {copiedQR === booking.id
                                                    ? <><CheckCheck className="w-[14px] h-[14px] text-green-500" /> <span className="text-green-600">Copied!</span></>
                                                    : <><Copy className="w-[14px] h-[14px]" /> Copy QR Link</>}
                                            </button>
                                        </div>
                                    </details>
                                )}

                                {/* Admin Actions */}
                                {user.role === 'ADMIN' && (
                                    <div className="space-y-2 w-full">
                                        {booking.status === 'PENDING' && (
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleStatusUpdate(booking.id, 'APPROVED')}
                                                    className="flex items-center gap-1.5 flex-1 justify-center px-3 py-2 bg-green-50 text-green-700 font-bold text-xs rounded-xl border border-green-100 hover:bg-green-500 hover:text-white hover:border-green-500 transition-all duration-200"
                                                >
                                                    <Check className="w-3.5 h-3.5" /> APPROVE
                                                </button>
                                                <button
                                                    onClick={() => handleRejectClick(booking.id)}
                                                    className="flex items-center gap-1.5 flex-1 justify-center px-3 py-2 bg-red-50 text-red-600 font-bold text-xs rounded-xl border border-red-100 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all duration-200"
                                                >
                                                    <XIcon className="w-3.5 h-3.5" /> REJECT
                                                </button>
                                            </div>
                                        )}
                                        <button 
                                            onClick={() => handleDeleteBooking(booking.id, booking.resourceName)} 
                                            className="flex items-center gap-1.5 justify-center w-full px-3 py-2 bg-white border border-red-100 text-red-500 rounded-xl hover:bg-red-500 hover:text-white hover:border-red-500 transition-all duration-200 text-xs font-bold"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                            DELETE
                                        </button>
                                    </div>
                                )}

                                {/* User Action Row */}
                                {user.role === 'USER' && (
                                    <div className="flex justify-between items-center w-full">
                                        {(booking.status === 'PENDING' || booking.status === 'APPROVED') ? (
                                            <button
                                                onClick={() => handleStatusUpdate(booking.id, 'CANCELLED')}
                                                className="text-gray-500 text-[13px] font-semibold hover:text-red-500 hover:underline transition-all duration-200"
                                            >
                                                Cancel Booking
                                            </button>
                                        ) : <div />}
                                        <button 
                                            onClick={() => handleDeleteBooking(booking.id, booking.resourceName)} 
                                            className="ml-auto p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200"
                                            title="Delete Booking"
                                        >
                                            <Trash2 className="w-[17px] h-[17px]" strokeWidth={2} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    {filteredBookings.length === 0 && (
                        <div className="col-span-full py-16 px-6 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                             <div className="flex flex-col items-center justify-center space-y-3">
                                 <Calendar className="w-12 h-12 text-gray-300" />
                                 <h3 className="text-lg font-bold text-gray-700">No bookings found</h3>
                                 <p className="text-sm text-gray-500">
                                     {filterStatus !== 'ALL' ? `You don't have any ${filterStatus.toLowerCase()} bookings at the moment.` : "You don't have any bookings yet."}
                                 </p>
                             </div>
                        </div>
                    )}
                </div>
            )}

            {/* Rejection Reason Modal */}
            {rejectingBookingId && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
                        <div className="p-6 border-b border-gray-100">
                            <h3 className="text-xl font-bold text-gray-800">Reject Booking</h3>
                            <p className="text-sm text-gray-500 mt-1">Please provide a reason for rejection</p>
                        </div>
                        <div className="p-6">
                            <textarea
                                value={rejectionReason}
                                onChange={e => setRejectionReason(e.target.value)}
                                placeholder="E.g., Resource unavailable, conflict with scheduled maintenance..."
                                rows="4"
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                            ></textarea>
                        </div>
                        <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
                            <button
                                onClick={() => { setRejectingBookingId(null); setRejectionReason(''); }}
                                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmReject}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition"
                            >
                                Reject Booking
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isFormOpen && (
                <BookingForm
                    onClose={() => { setIsFormOpen(false); fetchBookings(); }}
                    showToast={showToast}
                />
            )}

            {/* ── Delete Confirmation Modal ── */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
                        {/* Red top bar */}
                        <div className="h-1.5 bg-gradient-to-r from-red-500 to-rose-500" />
                        <div className="p-6">
                            {/* Icon */}
                            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-red-50 mx-auto mb-4">
                                <Trash2 className="w-7 h-7 text-red-500" />
                            </div>
                            {/* Text */}
                            <h3 className="text-xl font-bold text-gray-900 text-center mb-1">Delete Booking</h3>
                            <p className="text-sm text-gray-500 text-center mb-1">
                                Are you sure you want to delete
                            </p>
                            <p className="text-sm font-semibold text-gray-800 text-center mb-5">
                                &ldquo;{deleteConfirm.resourceName}&rdquo;?
                            </p>
                            <p className="text-xs text-red-400 text-center mb-6">This action cannot be undone.</p>
                            {/* Buttons */}
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setDeleteConfirm(null)}
                                    className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-rose-500 text-white font-semibold text-sm hover:from-red-600 hover:to-rose-600 transition shadow-md shadow-red-200"
                                >
                                    Yes, Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Attendance List Modal */}
            {viewingAttendance && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-gray-100">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="text-xl font-bold text-gray-800">Attendance List</h3>
                                <button
                                    onClick={() => setViewingAttendance(null)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <XIcon className="w-5 h-5" />
                                </button>
                            </div>
                            <p className="text-sm text-gray-600">{viewingAttendance.booking?.resourceName}</p>
                            <div className="mt-3 flex items-center gap-3 text-sm">
                                <Users className="w-5 h-5 text-blue-600" />
                                <span className="font-bold text-blue-600 text-lg">
                                    {viewingAttendance.totalAttendees} / {viewingAttendance.expectedAttendees}
                                </span>
                                <span className="text-gray-600">students checked in</span>
                            </div>
                        </div>
                        
                        <div className="p-6 overflow-y-auto flex-1">
                            {attendanceList.length === 0 ? (
                                <p className="text-center text-gray-500 py-8">No students have checked in yet.</p>
                            ) : (
                                <div className="space-y-3">
                                    {attendanceList.map((attendance, index) => (
                                        <div key={attendance.id} className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                            <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                                                {index + 1}
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-semibold text-gray-800">{attendance.userName}</p>
                                                {attendance.studentId && (
                                                    <p className="text-xs text-blue-600 font-medium">🆔 {attendance.studentId}</p>
                                                )}
                                                {attendance.userEmail && (
                                                    <p className="text-xs text-gray-500">📧 {attendance.userEmail}</p>
                                                )}
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs text-gray-500">Checked in at</p>
                                                <p className="text-sm font-medium text-gray-700">
                                                    {new Date(attendance.checkedInAt).toLocaleTimeString([], { 
                                                        hour: '2-digit', 
                                                        minute: '2-digit' 
                                                    })}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        
                        <div className="p-6 border-t border-gray-100 flex justify-end">
                            <button
                                onClick={() => setViewingAttendance(null)}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium transition"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>

        {/* ── Global Toast Notifications ── */}
        <ToastContainer toasts={toasts} removeToast={removeToast} />
        </>
    );
};
