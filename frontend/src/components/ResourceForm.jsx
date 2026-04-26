import { useState, useEffect } from 'react';
import axios from '../api/axios';
import { X, CheckCircle2, Building2, FlaskConical, Wrench, Users, MapPin, FileText, ImageIcon, Sparkles } from 'lucide-react';

const TYPE_OPTIONS = [
    { value: 'LECTURE_HALL', label: 'Lecture Hall', icon: Building2, color: 'blue' },
    { value: 'LAB',          label: 'Lab',          icon: FlaskConical, color: 'purple' },
    { value: 'EQUIPMENT',    label: 'Equipment',    icon: Wrench,       color: 'orange' },
];

const STATUS_OPTIONS = [
    { value: 'ACTIVE',       label: 'Active',       dot: 'bg-emerald-400' },
    { value: 'MAINTENANCE',  label: 'Maintenance',  dot: 'bg-amber-400'   },
    { value: 'INACTIVE',     label: 'Inactive',     dot: 'bg-gray-400'    },
];

const inputBase = "w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 outline-none transition-all focus:bg-white focus:border-blue-400 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.12)] text-sm";

export const ResourceForm = ({ resource, onClose }) => {
    const [formData, setFormData] = useState({
        name:        resource?.name        || '',
        type:        resource?.type        || 'LECTURE_HALL',
        capacity:    resource?.capacity    || 1,
        location:    resource?.location    || '',
        status:      resource?.status      || 'ACTIVE',
        description: resource?.description || '',
        imageUrl:    resource?.imageUrl    || ''
    });

    const [loading, setLoading]       = useState(false);
    const [showToast, setShowToast]   = useState(false);
    const [urlImgError, setUrlImgError] = useState(false);

    // Reset URL error whenever the imageUrl changes
    useEffect(() => { setUrlImgError(false); }, [formData.imageUrl]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const payload = {
            name:        (formData.name        || '').trim(),
            type:        formData.type         || 'LECTURE_HALL',
            capacity:    parseInt(formData.capacity) || 1,
            location:    (formData.location    || '').trim(),
            status:      formData.status       || 'ACTIVE',
            description: (formData.description || '').trim(),
            imageUrl:    (formData.imageUrl    || '').trim()
        };

        if (!payload.name || !payload.type || !payload.location || !payload.status) {
            alert('Please fill all required fields: Name, Type, Location, and Status');
            setLoading(false);
            return;
        }

        try {
            if (resource?.id) {
                await axios.put(`/api/resources/${resource.id}`, payload, { withCredentials: true });
            } else {
                await axios.post(`/api/resources`, payload, { withCredentials: true });
            }
            setShowToast(true);
            setTimeout(() => {
                setShowToast(false);
                onClose();
                window.location.reload();
            }, 2000);
        } catch (err) {
            const errorMsg = err.response?.data?.error
                || err.response?.data?.message
                || (err.response?.data ? JSON.stringify(err.response.data) : '')
                || err.message
                || 'Failed to save resource. Please check all required fields.';
            alert('Error: ' + errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const handleImageFile = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) {
            alert('Image is larger than 2MB. Please choose a smaller image for best performance.');
        }
        const reader = new FileReader();
        reader.onloadend = () => setFormData(prev => ({ ...prev, imageUrl: reader.result }));
        reader.readAsDataURL(file);
    };

    const isEdit = Boolean(resource?.id);

    return (
        <>
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col" style={{ maxHeight: '92vh' }}>

                {/* ── Gradient Header ── */}
                <div className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 px-7 pt-7 pb-10 flex-shrink-0">
                    {/* decorative circles */}
                    <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                    <div className="absolute bottom-0 left-8 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 pointer-events-none" />

                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
                    >
                        <X className="w-4 h-4" />
                    </button>

                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <p className="text-white/60 text-xs font-medium uppercase tracking-widest">
                                {isEdit ? 'Editing resource' : 'New resource'}
                            </p>
                            <h2 className="text-white text-xl font-bold leading-tight">
                                {isEdit ? resource.name : 'Add Resource'}
                            </h2>
                        </div>
                    </div>
                </div>

                {/* ── Form ── */}
                <form
                    onSubmit={handleSubmit}
                    className="overflow-y-auto flex-1 px-7 pb-7"
                    style={{ paddingTop: '1.75rem' }}
                >
                    <div className="space-y-5">

                        {/* Name */}
                        <div>
                            <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                <FileText className="w-3.5 h-3.5" /> Resource Name <span className="text-red-400">*</span>
                            </label>
                            <input
                                required
                                type="text"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                className={inputBase}
                                placeholder="e.g., Lecture Hall 106"
                            />
                        </div>

                        {/* Type — pill selector */}
                        <div>
                            <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                <Building2 className="w-3.5 h-3.5" /> Resource Type <span className="text-red-400">*</span>
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                {TYPE_OPTIONS.map(({ value, label, icon: Icon, color }) => {
                                    const active = formData.type === value;
                                    const colors = {
                                        blue:   active ? 'border-blue-500 bg-blue-50 text-blue-700'   : 'border-gray-200 text-gray-500 hover:border-blue-300',
                                        purple: active ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-gray-200 text-gray-500 hover:border-purple-300',
                                        orange: active ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-200 text-gray-500 hover:border-orange-300',
                                    };
                                    return (
                                        <button
                                            key={value}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, type: value })}
                                            className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 transition-all text-xs font-semibold ${colors[color]}`}
                                        >
                                            <Icon className="w-5 h-5" />
                                            {label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Capacity + Location */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                    <Users className="w-3.5 h-3.5" /> Capacity <span className="text-red-400">*</span>
                                </label>
                                <input
                                    required
                                    type="number"
                                    min="1"
                                    value={formData.capacity}
                                    onChange={e => setFormData({ ...formData, capacity: parseInt(e.target.value) || 1 })}
                                    className={inputBase}
                                    placeholder="50"
                                />
                            </div>
                            <div>
                                <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                    <MapPin className="w-3.5 h-3.5" /> Location <span className="text-red-400">*</span>
                                </label>
                                <input
                                    required
                                    type="text"
                                    value={formData.location}
                                    onChange={e => setFormData({ ...formData, location: e.target.value })}
                                    className={inputBase}
                                    placeholder="Building A, Floor 2"
                                />
                            </div>
                        </div>

                        {/* Status — pill selector */}
                        <div>
                            <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                Status <span className="text-red-400">*</span>
                            </label>
                            <div className="flex gap-2">
                                {STATUS_OPTIONS.map(({ value, label, dot }) => {
                                    const active = formData.status === value;
                                    return (
                                        <button
                                            key={value}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, status: value })}
                                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 text-xs font-semibold transition-all ${
                                                active
                                                    ? 'border-gray-800 bg-gray-900 text-white'
                                                    : 'border-gray-200 text-gray-500 hover:border-gray-400'
                                            }`}
                                        >
                                            <span className={`w-2 h-2 rounded-full ${dot}`} />
                                            {label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                <FileText className="w-3.5 h-3.5" /> Description
                            </label>
                            <textarea
                                rows="3"
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                className={inputBase + ' resize-none'}
                                placeholder="Large auditorium with projector and sound system…"
                            />
                        </div>

                        {/* Image */}
                        <div>
                            <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                <ImageIcon className="w-3.5 h-3.5" /> Resource Image
                            </label>

                            {/* Image preview */}
                            {formData.imageUrl && !formData.imageUrl.startsWith('data:') && (
                                <div className={`relative mb-3 rounded-2xl overflow-hidden border h-40 ${urlImgError ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-gray-50'}`}>
                                    {urlImgError ? (
                                        <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                                            <ImageIcon className="w-8 h-8 text-red-300" />
                                            <p className="text-xs font-semibold text-red-400">Cannot load image</p>
                                            <p className="text-[11px] text-red-300 text-center px-4">Make sure the URL is a direct link to an image file<br/>(ending in .jpg, .png, .webp, etc.)</p>
                                        </div>
                                    ) : (
                                        <img
                                            src={formData.imageUrl}
                                            alt="Preview"
                                            className="w-full h-full object-cover"
                                            referrerPolicy="no-referrer"
                                            onError={() => setUrlImgError(true)}
                                        />
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, imageUrl: '' }))}
                                        className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1 transition"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            )}

                            {formData.imageUrl.startsWith('data:') && (
                                <div className="relative mb-3 rounded-2xl overflow-hidden border border-gray-200 h-40 bg-gray-50">
                                    <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                                    <button
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, imageUrl: '' }))}
                                        className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1 transition"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            )}

                            <label className="flex flex-col items-center justify-center gap-1.5 w-full py-5 border-2 border-dashed border-gray-200 rounded-2xl cursor-pointer hover:border-blue-400 hover:bg-blue-50/40 transition group">
                                <div className="w-10 h-10 rounded-full bg-gray-100 group-hover:bg-blue-100 flex items-center justify-center transition">
                                    <ImageIcon className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition" />
                                </div>
                                <span className="text-sm font-medium text-gray-600 group-hover:text-blue-600 transition">
                                    {formData.imageUrl ? 'Click to replace image' : 'Click to upload an image'}
                                </span>
                                <span className="text-xs text-gray-400">PNG, JPG, WEBP · max 2 MB</span>
                                <input type="file" accept="image/*" className="hidden" onChange={handleImageFile} />
                            </label>

                            <div className="mt-3 flex items-center gap-3">
                                <div className="flex-1 h-px bg-gray-200" />
                                <span className="text-xs text-gray-400 whitespace-nowrap">or paste a direct image URL</span>
                                <div className="flex-1 h-px bg-gray-200" />
                            </div>
                            <input
                                type="text"
                                value={formData.imageUrl.startsWith('data:') ? '' : formData.imageUrl}
                                onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
                                className={`${inputBase} mt-2 ${urlImgError ? 'border-red-300 focus:border-red-400 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.12)]' : ''}`}
                                placeholder="https://example.com/image.jpg"
                            />
                            {urlImgError && (
                                <p className="mt-1.5 text-[11px] text-red-400 flex items-center gap-1">
                                    <span>⚠</span> URL must point directly to an image file, not a webpage.
                                </p>
                            )}
                        </div>
                    </div>

                    {/* ── Footer ── */}
                    <div className="flex gap-3 mt-7 pt-6 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold text-sm hover:shadow-lg hover:shadow-blue-500/30 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Resource'}
                        </button>
                    </div>
                </form>
            </div>
        </div>

        {/* ── Success Toast ── */}
        {showToast && (
            <div className="fixed top-6 left-0 right-0 z-[9999] flex justify-center pointer-events-none">
                <div className="animate-[slideDown_0.4s_ease_forwards]" style={{ minWidth: '320px' }}>
                    <div className="flex items-center gap-4 px-6 py-4 rounded-2xl bg-white border border-green-100"
                        style={{ boxShadow: '0 8px 32px 0 rgba(34,197,94,0.22), 0 2px 8px 0 rgba(0,0,0,0.08)' }}>
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg">
                            <CheckCircle2 className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                            <p className="font-bold text-gray-800 text-base leading-tight">Resource Saved!</p>
                            <p className="text-sm text-gray-500 mt-0.5">Changes have been applied successfully.</p>
                        </div>
                        <div className="w-1.5 h-10 rounded-full bg-gradient-to-b from-green-400 to-emerald-500 ml-1" />
                    </div>
                    <div className="mt-1.5 h-1 rounded-full bg-green-100 overflow-hidden mx-2">
                        <div className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full animate-[shrink_2s_linear_forwards]" />
                    </div>
                </div>
            </div>
        )}

        <style>{`
            @keyframes slideDown {
                from { opacity: 0; transform: translateY(-24px); }
                to   { opacity: 1; transform: translateY(0); }
            }
            @keyframes shrink {
                from { width: 100%; }
                to   { width: 0%; }
            }
        `}</style>
        </>
    );
};
