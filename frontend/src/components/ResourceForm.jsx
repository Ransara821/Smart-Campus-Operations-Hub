import { useState } from 'react';
import axios from '../api/axios';
import { X, CheckCircle2 } from 'lucide-react';

export const ResourceForm = ({ resource, onClose }) => {
    const [formData, setFormData] = useState({
        name: resource?.name || '',
        type: resource?.type || 'LECTURE_HALL',
        capacity: resource?.capacity || 1,
        location: resource?.location || '',
        status: resource?.status || 'ACTIVE',
        description: resource?.description || '',
        imageUrl: resource?.imageUrl || ''
    });

    const [loading, setLoading] = useState(false);
    const [showToast, setShowToast] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const payload = {
            name: (formData.name || '').trim(),
            type: formData.type || 'LECTURE_HALL',
            capacity: parseInt(formData.capacity) || 1,
            location: (formData.location || '').trim(),
            status: formData.status || 'ACTIVE',
            description: (formData.description || '').trim(),
            imageUrl: (formData.imageUrl || '').trim()
        };

        if (!payload.name || !payload.type || !payload.location || !payload.status) {
            alert('Please fill all required fields: Name, Type, Location, and Status');
            setLoading(false);
            return;
        }

        try {
            let response;
            if (resource?.id) {
                response = await axios.put(`/api/resources/${resource.id}`, payload, { withCredentials: true });
            } else {
                response = await axios.post(`/api/resources`, payload, { withCredentials: true });
            }
            console.log('Success! Response:', response.data);
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

    // Convert uploaded file to Base64 and store in imageUrl
    const handleImageFile = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) {
            alert('Image is larger than 2MB. Please choose a smaller image for best performance.');
        }
        const reader = new FileReader();
        reader.onloadend = () => {
            setFormData(prev => ({ ...prev, imageUrl: reader.result }));
        };
        reader.readAsDataURL(file);
    };

    return (
        <>
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-xl">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-800">
                        {resource ? 'Edit Resource' : 'Add New Resource'}
                    </h2>
                    <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                    <div className="grid grid-cols-2 gap-4">

                        {/* Name */}
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                            <input
                                required type="text" value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                placeholder="e.g., Lecture Hall 106"
                            />
                        </div>

                        {/* Type */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                            <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none">
                                <option value="LECTURE_HALL">Lecture Hall</option>
                                <option value="LAB">Lab</option>
                                <option value="EQUIPMENT">Equipment</option>
                            </select>
                        </div>

                        {/* Capacity */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Capacity *</label>
                            <input
                                required type="number" min="1" value={formData.capacity}
                                onChange={e => setFormData({ ...formData, capacity: parseInt(e.target.value) || 1 })}
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                placeholder="50"
                            />
                        </div>

                        {/* Location */}
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Location *</label>
                            <input
                                required type="text" value={formData.location}
                                onChange={e => setFormData({ ...formData, location: e.target.value })}
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                placeholder="e.g., Building A, Floor 2"
                            />
                        </div>

                        {/* Status */}
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
                            <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none">
                                <option value="ACTIVE">Active</option>
                                <option value="MAINTENANCE">Maintenance</option>
                                <option value="INACTIVE">Inactive</option>
                            </select>
                        </div>

                        {/* Description */}
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <textarea
                                rows="3" value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                placeholder="e.g., Large auditorium with projector and sound system"
                            />
                        </div>

                        {/* ── Image Section ── */}
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Resource Image</label>

                            {/* Live preview with remove button */}
                            {formData.imageUrl && (
                                <div className="relative mb-3 rounded-xl overflow-hidden border border-gray-200 h-44 bg-gray-50">
                                    <img
                                        src={formData.imageUrl}
                                        alt="Preview"
                                        className="w-full h-full object-cover"
                                        onError={e => { e.target.style.display = 'none'; }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, imageUrl: '' }))}
                                        className="absolute top-2 right-2 bg-white/90 hover:bg-white text-gray-600 rounded-full p-1 shadow-md transition"
                                        title="Remove image"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            )}

                            {/* File upload drop zone */}
                            <label className="flex flex-col items-center justify-center gap-1 w-full p-4 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition text-sm text-gray-500">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-gray-300 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span className="font-medium text-gray-600">
                                    {formData.imageUrl ? 'Click to replace image' : 'Click to upload an image'}
                                </span>
                                <span className="text-xs text-gray-400">PNG, JPG, WEBP up to 2MB</span>
                                <input type="file" accept="image/*" className="hidden" onChange={handleImageFile} />
                            </label>

                            {/* URL fallback */}
                            <div className="mt-3">
                                <p className="text-xs text-gray-400 mb-1 text-center">— or paste an image URL —</p>
                                <input
                                    type="url"
                                    value={formData.imageUrl.startsWith('data:') ? '' : formData.imageUrl}
                                    onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm"
                                    placeholder="https://images.unsplash.com/..."
                                />
                            </div>
                        </div>

                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                        <button type="button" onClick={onClose}
                            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition">
                            Cancel
                        </button>
                        <button type="submit" disabled={loading}
                            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium transition disabled:opacity-50">
                            {loading ? 'Saving...' : 'Save Resource'}
                        </button>
                    </div>
                </form>
            </div>
        </div>

            {/* Success Toast */}
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
                        {/* Progress bar */}
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
