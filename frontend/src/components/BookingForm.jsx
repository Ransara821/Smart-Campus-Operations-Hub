import { useState, useEffect } from 'react';
import axios from '../api/axios';
import { X, Building2, Clock3, Users, FileText, Loader2, ChevronDown, CalendarDays, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

/* ── Reusable field wrapper ── */
const Field = ({ label, icon: Icon, children }) => (
    <div className="flex flex-col gap-2">
        <label className="flex items-center gap-2 text-[11px] font-bold tracking-[0.12em] uppercase text-slate-400">
            {Icon && <Icon className="w-3.5 h-3.5" />}
            {label}
        </label>
        {children}
    </div>
);

const inputCls = `
    w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/60
    text-[13.5px] font-medium text-slate-800 placeholder-slate-300
    focus:outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-50
    transition-all duration-200
`.replace(/\s+/g, ' ').trim();

export const BookingForm = ({ onClose, showToast }) => {
    const { user } = useAuth();
    const [resources, setResources] = useState([]);
    const [formData, setFormData] = useState({
        resourceId: '', resourceName: '',
        startTime: '', endTime: '',
        purpose: '', expectedAttendees: 1
    });
    const [loading, setLoading] = useState(false);
    const [loadingResources, setLoadingResources] = useState(true);

    useEffect(() => {
        setLoadingResources(true);
        const ts = Date.now();
        axios.get(`/api/resources?_t=${ts}`, {
            withCredentials: true,
            headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate', 'Pragma': 'no-cache', 'Expires': '0' }
        })
            .then(res => setResources(res.data.filter(r => r.status === 'ACTIVE')))
            .catch(() => showToast?.('Failed to load facilities.', 'error'))
            .finally(() => setLoadingResources(false));
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const selectedResource = resources.find(r => r.id === formData.resourceId);
            await axios.post('/api/bookings', {
                ...formData,
                resourceName: selectedResource?.name || formData.resourceName
            }, { withCredentials: true });
            onClose();
        } catch (err) {
            showToast?.(err.response?.data?.error || 'Failed to create booking. There might be a conflict.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const selectedResource = resources.find(r => r.id === formData.resourceId);

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div
                className="bg-white w-full max-w-lg rounded-[1.75rem] overflow-hidden shadow-2xl shadow-slate-900/20 animate-in fade-in zoom-in-95 duration-200"
                style={{ border: '1px solid rgba(226,232,240,0.8)' }}
            >
                {/* ── Top gradient bar ── */}
                <div className="h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500" />

                {/* ── Header ── */}
                <div className="px-7 pt-6 pb-5 flex items-start justify-between border-b border-slate-100">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center shadow-sm shadow-indigo-200">
                                <Sparkles className="w-3.5 h-3.5 text-white" />
                            </div>
                            <span className="text-[10.5px] font-bold tracking-[0.18em] uppercase text-indigo-500">
                                New Request
                            </span>
                        </div>
                        <h2 className="text-[19px] font-black text-slate-900 tracking-tight">Request a Booking</h2>
                        <p className="text-[12.5px] text-slate-400 font-medium mt-0.5">
                            Reserve a campus facility or resource
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all duration-150 -mt-1 -mr-1"
                    >
                        <X className="w-4.5 h-4.5" />
                    </button>
                </div>

                {/* ── Form ── */}
                <form onSubmit={handleSubmit} className="px-7 pt-6 pb-7 space-y-5">

                    {/* Facility select */}
                    <Field label="Facility / Resource" icon={Building2}>
                        {loadingResources ? (
                            <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-[13px] text-slate-400 font-medium">
                                <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                                Loading available facilities…
                            </div>
                        ) : resources.length === 0 ? (
                            <div className="px-4 py-3 rounded-xl border border-rose-200 bg-rose-50 text-[13px] text-rose-600 font-medium">
                                No active facilities available. Contact your administrator.
                            </div>
                        ) : (
                            <div className="relative">
                                <select
                                    required
                                    value={formData.resourceId}
                                    onChange={e => setFormData({ ...formData, resourceId: e.target.value })}
                                    className={`${inputCls} appearance-none pr-10 cursor-pointer`}
                                >
                                    <option value="" disabled>Select a facility…</option>
                                    {resources.map(r => (
                                        <option key={r.id} value={r.id}>{r.name} ({r.type})</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                            </div>
                        )}
                        {/* Selected resource preview pill */}
                        {selectedResource && (
                            <div className="flex items-center gap-2 px-3 py-2 bg-indigo-50 border border-indigo-100 rounded-xl">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0"></span>
                                <span className="text-[12px] font-semibold text-indigo-700 truncate">{selectedResource.name}</span>
                                <span className="text-[11px] text-indigo-400 font-medium ml-auto flex-shrink-0">{selectedResource.type}</span>
                            </div>
                        )}
                    </Field>

                    {/* Start / End time */}
                    <div className="grid grid-cols-2 gap-4">
                        <Field label="Start Time" icon={CalendarDays}>
                            <input
                                required
                                type="datetime-local"
                                value={formData.startTime}
                                onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                                className={inputCls}
                            />
                        </Field>
                        <Field label="End Time" icon={Clock3}>
                            <input
                                required
                                type="datetime-local"
                                value={formData.endTime}
                                onChange={e => setFormData({ ...formData, endTime: e.target.value })}
                                className={inputCls}
                            />
                        </Field>
                    </div>

                    {/* Expected Attendees */}
                    <Field label="Expected Attendees" icon={Users}>
                        <div className="flex items-center gap-3">
                            <input
                                required
                                type="number"
                                min="1"
                                value={formData.expectedAttendees}
                                onChange={e => setFormData({ ...formData, expectedAttendees: parseInt(e.target.value) || 1 })}
                                className={`${inputCls} w-32`}
                            />
                            <div className="flex items-center gap-2 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                                {[1, 5, 10, 20, 50].map(n => (
                                    <button
                                        key={n}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, expectedAttendees: n })}
                                        className={`text-[11px] font-bold px-2 py-1 rounded-lg transition-all ${formData.expectedAttendees === n
                                            ? 'bg-indigo-600 text-white shadow-sm'
                                            : 'text-slate-500 hover:bg-slate-200'
                                            }`}
                                    >
                                        {n}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </Field>

                    {/* Purpose */}
                    <Field label="Purpose of Booking" icon={FileText}>
                        <textarea
                            required
                            rows="3"
                            value={formData.purpose}
                            onChange={e => setFormData({ ...formData, purpose: e.target.value })}
                            placeholder="e.g. Group study session, Student club meeting, Project presentation…"
                            className={`${inputCls} resize-none`}
                        />
                        <p className="text-[11px] text-slate-400 font-medium -mt-1">
                            Be specific — this helps the admin approve your request faster.
                        </p>
                    </Field>

                    {/* Divider */}
                    <div className="h-px bg-slate-100 -mx-7"></div>

                    {/* Actions */}
                    <div className="flex items-center justify-between gap-3 pt-1">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-[13px] hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 active:scale-[0.98]"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !formData.resourceId || loadingResources}
                            className="group flex items-center gap-2.5 px-7 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[13.5px] shadow-lg shadow-indigo-200 hover:shadow-indigo-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.97]"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Submitting…
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-4 h-4 opacity-80" />
                                    Submit Request
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
