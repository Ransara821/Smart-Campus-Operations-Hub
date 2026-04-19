import { useState, useEffect } from 'react';
import axios from '../api/axios';
import { X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const BookingForm = ({ onClose, showToast }) => {
    const { user } = useAuth();
    const [resources, setResources] = useState([]);
    const [formData, setFormData] = useState({
        resourceId: '',
        resourceName: '',
        startTime: '',
        endTime: '',
        purpose: '',
        expectedAttendees: 1
    });
    const [loading, setLoading] = useState(false);
    const [loadingResources, setLoadingResources] = useState(true);

    useEffect(() => {
        // Fetch active resources for booking
        setLoadingResources(true);
        // Add timestamp to prevent caching
        const timestamp = new Date().getTime();
        axios.get(`/api/resources?_t=${timestamp}`, { 
            withCredentials: true,
            headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            }
        })
            .then(res => {
                console.log('Resources loaded:', res.data);
                const activeResources = res.data.filter(r => r.status === 'ACTIVE');
                console.log('Active resources:', activeResources);
                setResources(activeResources);
            })
            .catch(err => {
                console.error('Error loading resources:', err);
                showToast?.('Failed to load facilities. Please refresh the page.', 'error');
            })
            .finally(() => setLoadingResources(false));
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const selectedResource = resources.find(r => r.id === formData.resourceId);
            const payload = {
                ...formData,
                resourceName: selectedResource?.name || formData.resourceName
            };

            await axios.post('/api/bookings', payload, {
                withCredentials: true
            });
            onClose();
        } catch (err) {
            console.error(err);
            showToast?.(err.response?.data?.error || 'Failed to create booking. There might be a conflict.', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-xl animate-in fade-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-800">Request a Booking</h2>
                    <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Facility / Resource</label>
                        {loadingResources ? (
                            <div className="w-full p-2 border border-gray-300 rounded-lg text-gray-500">
                                Loading facilities...
                            </div>
                        ) : resources.length === 0 ? (
                            <div className="w-full p-2 border border-red-300 bg-red-50 rounded-lg text-red-600 text-sm">
                                No active facilities available. Please contact admin.
                            </div>
                        ) : (
                            <select required
                                value={formData.resourceId}
                                onChange={e => setFormData({ ...formData, resourceId: e.target.value })}
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none">
                                <option value="" disabled>Select a facility...</option>
                                {resources.map(r => (
                                    <option key={r.id} value={r.id}>{r.name} ({r.type})</option>
                                ))}
                            </select>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                            <input required type="datetime-local"
                                value={formData.startTime}
                                onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                            <input required type="datetime-local"
                                value={formData.endTime}
                                onChange={e => setFormData({ ...formData, endTime: e.target.value })}
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Expected Attendees</label>
                        <input required type="number" min="1"
                            value={formData.expectedAttendees}
                            onChange={e => setFormData({ ...formData, expectedAttendees: parseInt(e.target.value) })}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                            placeholder="Number of people" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Purpose of Booking</label>
                        <textarea required rows="3"
                            value={formData.purpose}
                            onChange={e => setFormData({ ...formData, purpose: e.target.value })}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                            placeholder="E.g. Group study, Student Club Meeting..."></textarea>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition">
                            Cancel
                        </button>
                        <button type="submit" disabled={loading || !formData.resourceId} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium transition disabled:opacity-50">
                            {loading ? 'Submitting...' : 'Submit Request'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
