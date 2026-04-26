import { useState, useEffect } from 'react';
import axios from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { X, Send, Paperclip, Edit2, Trash2 } from 'lucide-react';

export const TicketDetailsModal = ({ ticket, onClose }) => {
    const { user } = useAuth();

    // Create mode state
    const [isEditingTicket, setIsEditingTicket] = useState(false);
    const [formData, setFormData] = useState({ 
        title: '', 
        description: '', 
        resourceName: '',
        resourceId: '',
        category: '',
        priority: 'MEDIUM',
        preferredContact: 'EMAIL'
    });
    const [resources, setResources] = useState([]);
    const [loadingResources, setLoadingResources] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [filePreviews, setFilePreviews] = useState([]);

    // View mode state
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [status, setStatus] = useState(ticket?.status || 'OPEN');
    
    // Status update details
    const [statusReason, setStatusReason] = useState('');
    const [pendingStatus, setPendingStatus] = useState('');

    // Comment edit details
    const [editingCommentId, setEditingCommentId] = useState(null);
    const [editingCommentText, setEditingCommentText] = useState('');

    useEffect(() => {
        if (!ticket?.isNew && ticket?.id && !isEditingTicket) {
            fetchComments();
        } 
        
        if (ticket?.isNew || isEditingTicket) {
            // Fetch resources for the dropdown
            setLoadingResources(true);
            axios.get('/api/resources', { withCredentials: true })
                .then(res => {
                    setResources(res.data);
                })
                .catch(err => {
                    console.error('Failed to fetch resources', err);
                })
                .finally(() => setLoadingResources(false));
                
            if (isEditingTicket) {
                setFormData({
                    title: ticket.title,
                    description: ticket.description,
                    resourceName: ticket.resourceName || '',
                    resourceId: ticket.resourceId || '',
                    category: ticket.category || '',
                    priority: ticket.priority || 'MEDIUM',
                    preferredContact: ticket.preferredContact || 'EMAIL'
                });
            }
        }
    }, [ticket, isEditingTicket]);

    const fetchComments = async () => {
        try {
            const res = await axios.get(`/api/tickets/${ticket.id}/comments`, { withCredentials: true });
            setComments(res.data);
        } catch (err) {
            console.error("Failed to fetch comments", err);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        
        // Validate required fields
        if (!formData.title.trim()) {
            alert('Please enter a title');
            return;
        }
        if (!formData.description.trim()) {
            alert('Please enter a description');
            return;
        }
        
        try {
            const formDataToSend = new FormData();
            formDataToSend.append('title', formData.title.trim());
            formDataToSend.append('description', formData.description.trim());
            
            // Only append resourceName and resourceId if they have values
            if (formData.resourceName && formData.resourceName.trim()) {
                formDataToSend.append('resourceName', formData.resourceName.trim());
            }
            if (formData.resourceId && formData.resourceId.trim()) {
                formDataToSend.append('resourceId', formData.resourceId.trim());
            }
            if (formData.category) formDataToSend.append('category', formData.category);
            if (formData.priority) formDataToSend.append('priority', formData.priority);
            if (formData.preferredContact) formDataToSend.append('preferredContact', formData.preferredContact);
            
            if (selectedFiles.length > 0) {
                selectedFiles.forEach(file => {
                    formDataToSend.append('images', file);
                });
            }

            console.log('Creating ticket with data:', {
                title: formData.title,
                description: formData.description,
                resourceName: formData.resourceName,
                resourceId: formData.resourceId,
                hasImage: selectedFiles.length > 0
            });

            const response = await axios.post('/api/tickets', formDataToSend, { 
                withCredentials: true
                // Don't manually set Content-Type - axios will add it with the correct boundary
            });
            
            console.log('Ticket created successfully:', response.data);
            alert('✅ Ticket created successfully!');
            onClose();
        } catch (err) {
            console.error('Ticket creation error:', err);
            console.error('Error response:', err.response);
            const errorMsg = err.response?.data?.message || err.response?.data || 'Failed to create ticket. Please try again.';
            alert('❌ ' + (typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg)));
        }
    };

    const handleEditTicket = async (e) => {
        e.preventDefault();
        try {
            await axios.put(`/api/tickets/${ticket.id}`, formData, { withCredentials: true });
            alert('✅ Ticket updated successfully!');
            setIsEditingTicket(false);
            onClose(); 
        } catch (err) {
            const errorMsg = err.response?.data?.error || 'Failed to update ticket';
            alert('❌ ' + errorMsg);
        }
    };

    const handleDeleteTicket = async () => {
        if (!window.confirm("Are you sure you want to delete this ticket? This cannot be undone.")) return;
        try {
            await axios.delete(`/api/tickets/${ticket.id}`, { withCredentials: true });
            alert('✅ Ticket deleted successfully!');
            onClose();
        } catch (err) {
            const errorMsg = err.response?.data?.error || 'Failed to delete ticket';
            alert('❌ ' + errorMsg);
        }
    };

    const handleStatusMenuChange = (e) => {
        const newStatus = e.target.value;
        setPendingStatus(newStatus);
        if (newStatus !== 'RESOLVED' && newStatus !== 'REJECTED') {
            handleStatusCommit(newStatus, '');
        }
    };

    const handleStatusCommit = async (commitStatus, reason) => {
        try {
            if (commitStatus === 'RESOLVED') {
                await axios.put(`/api/tickets/${ticket.id}/resolve`, { resolutionNotes: reason }, { withCredentials: true });
            } else {
                await axios.put(`/api/tickets/${ticket.id}/status`, { status: commitStatus, rejectionReason: reason }, { withCredentials: true });
            }
            setStatus(commitStatus);
            setPendingStatus('');
            setStatusReason('');
            onClose(); // Optional: or just show success msg
        } catch (err) {
            alert("Status update failed");
        }
    };

    const handleAssign = async (technicianId) => {
        try {
            await axios.patch(`/api/tickets/${ticket.id}/assign`, { technicianId }, { withCredentials: true });
            onClose();
        } catch (err) {
            alert("Assignment failed");
        }
    };

    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;
        try {
            await axios.post(`/api/tickets/${ticket.id}/comments`, { text: newComment }, { withCredentials: true });
            setNewComment('');
            fetchComments();
        } catch (err) {
            alert("Failed to add comment");
        }
    };

    const handleDeleteComment = async (commentId) => {
        if (!window.confirm("Delete this comment?")) return;
        try {
            await axios.delete(`/api/tickets/comments/${commentId}`, { withCredentials: true });
            fetchComments();
        } catch (err) {
            alert("Failed to delete comment");
        }
    };

    const handleSaveEditComment = async (commentId) => {
        if (!editingCommentText.trim()) return;
        try {
            await axios.put(`/api/tickets/comments/${commentId}`, { text: editingCommentText }, { withCredentials: true });
            setEditingCommentId(null);
            setEditingCommentText('');
            fetchComments();
        } catch (err) {
            alert("Failed to edit comment");
        }
    };

    const handleFileChange = (e) => {
        let files = Array.from(e.target.files);
        if (files.length === 0) return;
        
        if (selectedFiles.length + files.length > 3) {
            alert('You can only upload a maximum of 3 images.');
            files = files.slice(0, 3 - selectedFiles.length);
        }

        const validFiles = files.filter(file => {
            if (file.size > 5 * 1024 * 1024) {
                alert(`${file.name} is too large (max 5MB)`);
                return false;
            }
            if (!file.type.startsWith('image/')) {
                alert(`${file.name} is not an image`);
                return false;
            }
            return true;
        });

        setSelectedFiles(prev => [...prev, ...validFiles]);

        validFiles.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFilePreviews(prev => [...prev, reader.result]);
            };
            reader.readAsDataURL(file);
        });
    };

    const removeFile = (indexToRemove) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== indexToRemove));
        setFilePreviews(prev => prev.filter((_, i) => i !== indexToRemove));
    };

    // --- Create Mode Form ---
    if (ticket?.isNew || isEditingTicket) {
        return (
            <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-md flex items-center justify-center z-50 p-4">
                <div className="bg-white/90 backdrop-blur-xl border border-white rounded-3xl w-full max-w-lg shadow-[0_20px_60px_rgba(0,0,0,0.1)] animate-in fade-in zoom-in-95 text-gray-800 flex flex-col max-h-[90vh]">
                    <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 rounded-t-3xl shrink-0">
                        <h2 className="text-xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                            {isEditingTicket ? 'Edit Issue' : 'Raise New Issue'}
                        </h2>
                        <button type="button" onClick={() => isEditingTicket ? setIsEditingTicket(false) : onClose()} className="p-1 rounded-xl hover:bg-gray-200/50 transition-colors">
                            <X className="w-5 h-5 text-gray-500 hover:text-gray-900" />
                        </button>
                    </div>
                    <form onSubmit={isEditingTicket ? handleEditTicket : handleCreate} className="flex flex-col flex-grow overflow-hidden">
                        <div className="p-5 space-y-4 overflow-y-auto custom-scrollbar flex-grow">
                        <div>
                            <label className="block text-sm font-bold mb-1.5 text-gray-700">Title <span className="text-purple-600">*</span></label>
                            <input 
                                required 
                                type="text" 
                                value={formData.title} 
                                onChange={e => setFormData({ ...formData, title: e.target.value })} 
                                className="w-full p-2.5 bg-gray-50/50 text-gray-900 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all placeholder-gray-400 shadow-sm hover:border-purple-300"
                                placeholder="e.g., Projector not working" 
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold mb-1.5 text-gray-700">Select Facility/Equipment <span className="font-normal text-gray-500">(Optional)</span></label>
                            {loadingResources ? (
                                <div className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-500 text-sm animate-pulse">
                                    Loading facilities...
                                </div>
                            ) : (
                                <select 
                                    value={formData.resourceId} 
                                    onChange={e => {
                                        const selectedResource = resources.find(r => r.id === e.target.value);
                                        setFormData({ 
                                            ...formData, 
                                            resourceId: e.target.value,
                                            resourceName: selectedResource ? selectedResource.name : ''
                                        });
                                    }}
                                    className="w-full p-2.5 bg-gray-50/50 text-gray-900 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all shadow-sm hover:border-purple-300"
                                >
                                    <option value="">General Campus Issue</option>
                                    {resources.map(r => (
                                        <option key={r.id} value={r.id}>{r.name} ({r.type})</option>
                                    ))}
                                </select>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-bold mb-1.5 text-gray-700">Description <span className="text-purple-600">*</span></label>
                            <textarea 
                                required 
                                rows="3" 
                                value={formData.description} 
                                onChange={e => setFormData({ ...formData, description: e.target.value })} 
                                className="w-full p-2.5 bg-gray-50/50 text-gray-900 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all placeholder-gray-400 shadow-sm resize-none hover:border-purple-300"
                                placeholder="Describe the issue in detail..."
                            ></textarea>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            <div>
                                <label className="block text-sm font-bold mb-1.5 text-gray-700">Category</label>
                                <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full p-2.5 bg-gray-50/50 text-gray-900 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-sm hover:border-purple-300">
                                    <option value="">General</option>
                                    <option value="ELECTRICAL">Electrical</option>
                                    <option value="PLUMBING">Plumbing</option>
                                    <option value="IT">IT / Network</option>
                                    <option value="HVAC">HVAC / AC</option>
                                    <option value="STRUCTURAL">Structural</option>
                                    <option value="OTHER">Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-1.5 text-gray-700">Priority</label>
                                <select value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})} className="w-full p-2.5 bg-gray-50/50 text-gray-900 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-sm hover:border-purple-300">
                                    <option value="LOW">Low</option>
                                    <option value="MEDIUM">Medium</option>
                                    <option value="HIGH">High</option>
                                    <option value="CRITICAL">Critical</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-1.5 text-gray-700">Contact</label>
                                <select value={formData.preferredContact} onChange={e => setFormData({...formData, preferredContact: e.target.value})} className="w-full p-2.5 bg-gray-50/50 text-gray-900 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-sm hover:border-purple-300">
                                    <option value="EMAIL">Email</option>
                                    <option value="PHONE">Phone</option>
                                    <option value="IN_PERSON">In Person</option>
                                </select>
                            </div>
                        </div>
                        
                        {/* Attachment Upload */}
                        {!isEditingTicket && (
                            <div>
                                <label className="block text-sm font-bold mb-2 text-gray-700">Attach Image <span className="font-normal text-gray-500">(Optional, Max 3)</span></label>
                                <div className="bg-gray-50/50 border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:border-purple-400 hover:bg-purple-50 transition-all cursor-pointer group">
                                    {filePreviews.length === 0 ? (
                                        <>
                                            <input
                                                type="file"
                                                multiple
                                                accept="image/*"
                                                onChange={handleFileChange}
                                                className="hidden"
                                                id="file-upload"
                                            />
                                            <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
                                                <div className="p-3 bg-white shadow-sm border border-gray-100 rounded-full mb-2 group-hover:scale-110 transition-transform">
                                                    <Paperclip className="w-5 h-5 text-purple-600" />
                                                </div>
                                                <p className="text-sm font-bold text-gray-700 group-hover:text-purple-700">Click to upload images</p>
                                                <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 5MB (Max 3)</p>
                                            </label>
                                        </>
                                    ) : (
                                        <div className="flex flex-col gap-4">
                                            <div className="flex flex-wrap gap-4 justify-center">
                                                {filePreviews.map((preview, idx) => (
                                                    <div key={idx} className="relative group/img">
                                                        <img src={preview} alt={`Preview ${idx + 1}`} className="h-20 w-20 object-cover rounded-xl border border-gray-200 shadow-md transform group-hover/img:scale-105 transition-all" />
                                                        <button
                                                            type="button"
                                                            onClick={() => removeFile(idx)}
                                                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 shadow-lg opacity-0 group-hover/img:opacity-100 transition-opacity"
                                                        >
                                                            <X className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                            {filePreviews.length < 3 && (
                                                <div>
                                                    <input
                                                        type="file"
                                                        multiple
                                                        accept="image/*"
                                                        onChange={handleFileChange}
                                                        className="hidden"
                                                        id="file-upload-more"
                                                    />
                                                    <label htmlFor="file-upload-more" className="cursor-pointer text-sm text-purple-600 font-bold hover:text-purple-700 inline-flex items-center gap-1 bg-white border border-gray-200 shadow-sm px-4 py-2 rounded-xl transition-all hover:shadow-md">
                                                        <Paperclip className="w-4 h-4" /> Add More
                                                    </label>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                        
                        </div>
                        
                        <div className="p-5 border-t border-gray-100 bg-gray-50/50 rounded-b-3xl shrink-0 flex justify-end gap-3">
                            <button 
                                type="button" 
                                onClick={() => isEditingTicket ? setIsEditingTicket(false) : onClose()}
                                className="px-5 py-2.5 text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl font-bold transition-all shadow-sm"
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit" 
                                className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 font-bold shadow-[0_5px_15px_rgba(168,85,247,0.3)] transition-all hover:scale-[1.02]"
                            >
                                {isEditingTicket ? 'Save Changes' : 'Submit Ticket'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    }

    // --- View Mode Form ---
    return (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div className="bg-white/95 backdrop-blur-xl border border-white rounded-3xl w-full max-w-2xl shadow-[0_20px_60px_rgba(0,0,0,0.1)] flex flex-col max-h-[90vh] text-gray-800">
                <div className="p-6 border-b border-gray-100 flex flex-col gap-4 bg-gray-50/50 rounded-t-3xl">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-2xl font-extrabold mb-1 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">{ticket.title}</h2>
                            <p className="text-gray-500 text-sm">Opened by <span className="font-bold text-gray-800">{ticket.creatorName}</span> • <span className="text-purple-600 font-medium">{ticket.resourceName || 'General Campus'}</span></p>
                        </div>
                        <div className="flex items-center gap-4">
                            {(user.role === 'ADMIN' || user.role === 'TECHNICIAN') && (
                                <select value={pendingStatus || status} onChange={handleStatusMenuChange} className="text-sm border border-gray-200 p-1.5 rounded-xl font-bold bg-white text-gray-800 outline-none focus:ring-2 focus:ring-purple-500 transition-all shadow-sm hover:border-purple-300">
                                    <option value="OPEN">Open</option>
                                    <option value="IN_PROGRESS">In Progress</option>
                                    <option value="RESOLVED">Resolved</option>
                                    <option value="CLOSED">Closed</option>
                                    <option value="REJECTED">Rejected</option>
                                </select>
                            )}
                            {user.role === 'ADMIN' && (
                                <div className="flex items-center gap-2">
                                    <select
                                        onChange={(e) => handleAssign(e.target.value)}
                                        value={ticket.assignedTechnicianId || ''}
                                        className="text-sm border border-purple-200 p-1.5 rounded-xl font-bold bg-purple-50 text-purple-700 outline-none focus:ring-2 focus:ring-purple-500 transition-all shadow-sm cursor-pointer hover:bg-purple-100 min-w-[180px]"
                                    >
                                        <option value="" disabled className="bg-white">
                                            {loadingTechs ? 'Loading Users...' : errorTechs ? errorTechs : 'Assign Tech...'}
                                        </option>
                                        
                                        {technicians.map(tech => (
                                            <option key={tech.id} value={tech.id} className="bg-white">
                                                {tech.name} [{tech.role}]
                                            </option>
                                        ))}
                                    </select>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); fetchAllUsers(); }}
                                        className="p-1.5 hover:bg-purple-100 rounded-lg text-purple-600 transition-colors"
                                        title="Refresh User List"
                                    >
                                        <RefreshCw className={`w-4 h-4 ${loadingTechs ? 'animate-spin' : ''}`} />
                                    </button>
                                </div>
                            )}
                            {user.id === ticket.creatorId && status === 'OPEN' && (
                                <>
                                    <button onClick={() => setIsEditingTicket(true)} className="p-1.5 rounded-xl hover:bg-blue-50 text-blue-500 transition-colors" title="Edit Ticket">
                                        <Edit2 className="w-5 h-5" />
                                    </button>
                                    <button onClick={handleDeleteTicket} className="p-1.5 rounded-xl hover:bg-red-50 text-red-500 transition-colors" title="Delete Ticket">
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </>
                            )}
                            <button onClick={onClose} className="p-1 rounded-xl hover:bg-gray-200/50 transition-colors">
                                <X className="w-6 h-6 text-gray-400 hover:text-gray-800" />
                            </button>
                        </div>
                    </div>
                    
                    {(pendingStatus === 'RESOLVED' || pendingStatus === 'REJECTED') && (
                        <div className={`${pendingStatus === 'RESOLVED' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} border p-4 rounded-2xl flex flex-col gap-3 mt-2 animate-in fade-in slide-in-from-top-2 shadow-sm`}>
                            <label className={`text-sm font-bold ${pendingStatus === 'RESOLVED' ? 'text-green-700' : 'text-red-700'}`}>
                                {pendingStatus === 'RESOLVED' ? 'Resolution Notes (Required)' : 'Rejection Reason (Required)'}
                            </label>
                            <textarea
                                value={statusReason}
                                onChange={e => setStatusReason(e.target.value)}
                                className="w-full p-2.5 bg-white text-gray-900 border border-gray-200 rounded-xl outline-none text-sm placeholder-gray-400 focus:border-gray-300 transition-all resize-none shadow-sm"
                                placeholder={pendingStatus === 'RESOLVED' ? 'What was done to fix this issue?' : 'Why is this ticket being rejected?'}
                            />
                            <div className="flex gap-2 justify-end mt-1">
                                <button onClick={() => setPendingStatus('')} className="px-4 py-1.5 bg-white border border-gray-200 text-gray-600 font-semibold text-sm rounded-xl hover:bg-gray-50 transition-colors shadow-sm">Cancel</button>
                                <button onClick={() => handleStatusCommit(pendingStatus, statusReason)} className={`px-5 py-1.5 text-white text-sm font-bold rounded-xl cursor-pointer transition-all shadow-md ${pendingStatus === 'RESOLVED' ? 'bg-green-600 hover:bg-green-500 hover:shadow-green-500/20' : 'bg-red-600 hover:bg-red-500 hover:shadow-red-500/20'}`}>
                                    Apply Status
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-6 overflow-y-auto flex-grow space-y-6 custom-scrollbar bg-white/50">
                    {user.role === 'ADMIN' && (ticket.edited || ticket.isEdited) && (
                        <div className="bg-orange-50 border border-orange-200 p-5 rounded-3xl shadow-sm mb-4">
                            <h4 className="font-extrabold text-orange-800 flex items-center gap-2 mb-3">
                                <Edit2 className="w-4 h-4" /> User Edited This Ticket
                            </h4>
                            <p className="text-sm text-orange-700 mb-2"><strong>Original Title:</strong> {ticket.originalTitle}</p>
                            <div className="text-sm text-orange-700">
                                <strong>Original Description:</strong>
                                <p className="mt-1 whitespace-pre-wrap bg-orange-100/50 p-3 rounded-xl border border-orange-200/50 font-medium">
                                    {ticket.originalDescription}
                                </p>
                            </div>
                        </div>
                    )}
                    
                    <div className="bg-blue-50/80 border border-blue-100 p-5 rounded-3xl relative overflow-hidden shadow-sm">
                        <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-blue-400 to-blue-600"></div>
                        <h4 className="font-extrabold text-blue-900 mb-2">Description</h4>
                        <p className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed font-medium">{ticket.description}</p>
                        
                        {ticket.resolutionNotes && (
                            <div className="mt-5 pt-5 border-t border-blue-200/50">
                                <h4 className="font-extrabold mb-2 text-green-700 flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                                    Resolution Notes
                                </h4>
                                <p className="whitespace-pre-wrap text-sm text-green-800 leading-relaxed bg-green-100/50 p-4 rounded-2xl border border-green-200/50 font-medium">{ticket.resolutionNotes}</p>
                            </div>
                        )}
                        {ticket.rejectionReason && (
                            <div className="mt-5 pt-5 border-t border-blue-200/50">
                                <h4 className="font-extrabold mb-2 text-red-700 flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]"></div>
                                    Rejection Reason
                                </h4>
                                <p className="whitespace-pre-wrap text-sm text-red-800 leading-relaxed bg-red-100/50 p-4 rounded-2xl border border-red-200/50 font-medium">{ticket.rejectionReason}</p>
                            </div>
                        )}
                    </div>

                    {/* Display attached images if exist */}
                    {ticket.imageUrls && ticket.imageUrls.length > 0 && (
                        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
                            <h4 className="font-extrabold mb-4 text-gray-800 flex items-center gap-2 text-sm">
                                <Paperclip className="w-4 h-4 text-purple-600" />
                                Attachments ({ticket.imageUrls.length})
                            </h4>
                            <div className="flex flex-wrap gap-4">
                                {ticket.imageUrls.map((url, i) => (
                                    <img
                                        key={i}
                                        src={url}
                                        alt={`Attachment ${i + 1}`}
                                        className="max-h-40 rounded-2xl shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition-all hover:scale-[1.02]"
                                        onClick={() => window.open(url, '_blank')}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="space-y-4">
                        <h4 className="font-extrabold text-gray-800 border-b border-gray-100 pb-3 flex items-center justify-between">
                            <span>Comments</span>
                            <span className="text-xs font-bold bg-gray-100 text-gray-500 px-3 py-1 rounded-full">{comments.length}</span>
                        </h4>
                        <div className="space-y-4">
                            {comments.map(c => (
                                <div key={c.id} className={`p-5 rounded-3xl border shadow-sm ${c.authorId === user.id ? 'bg-purple-50/50 border-purple-100 ml-8' : 'bg-white border-gray-100 mr-8'} hover:shadow-md transition-all group relative`}>
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm ${c.authorId === user.id ? 'bg-gradient-to-br from-purple-500 to-indigo-600' : 'bg-gradient-to-br from-gray-500 to-gray-600'}`}>
                                                {c.authorName.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <span className="font-bold text-sm text-gray-900 block">{c.authorName}</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-gray-500 font-medium">{new Date(c.createdAt).toLocaleString()}</span>
                                                    {c.updatedAt && c.updatedAt !== c.createdAt && <span className="text-[10px] text-gray-400 font-bold italic bg-gray-100 px-1.5 py-0.5 rounded-md">edited</span>}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity absolute right-4 top-4 bg-white/90 backdrop-blur-sm p-1 rounded-xl border border-gray-100 shadow-sm">
                                            {user.id === c.authorId && (
                                                <button onClick={() => { setEditingCommentId(c.id); setEditingCommentText(c.text); }} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                                                    <Edit2 className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                            {(user.id === c.authorId || user.role === 'ADMIN') && (
                                                <button onClick={() => handleDeleteComment(c.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    {editingCommentId === c.id ? (
                                        <div className="flex flex-col gap-3 mt-4 ml-11">
                                            <textarea 
                                                value={editingCommentText} 
                                                onChange={e => setEditingCommentText(e.target.value)} 
                                                className="w-full text-sm p-3 bg-white text-gray-800 border border-purple-300 rounded-2xl outline-none focus:ring-2 focus:ring-purple-500 shadow-inner resize-none" 
                                            />
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => setEditingCommentId(null)} className="text-xs px-4 py-2 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-colors">Cancel</button>
                                                <button onClick={() => handleSaveEditComment(c.id)} className="text-xs px-4 py-2 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-500 shadow-md shadow-purple-500/20 transition-all">Save Edit</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-700 whitespace-pre-wrap pl-11 leading-relaxed font-medium">{c.text}</p>
                                    )}
                                </div>
                            ))}
                            {comments.length === 0 && (
                                <div className="py-10 text-center bg-gray-50/50 rounded-3xl border border-gray-200 border-dashed">
                                    <p className="text-sm text-gray-500 font-medium">No comments yet. Start the conversation!</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t border-gray-100 bg-white rounded-b-3xl">
                    <form onSubmit={handleAddComment} className="flex gap-3 items-center bg-gray-50 p-1.5 rounded-full border border-gray-200 shadow-inner">
                        <div className="flex-grow pl-3 relative">
                            <input
                                type="text"
                                value={newComment}
                                onChange={e => setNewComment(e.target.value)}
                                placeholder="Type your message..."
                                className="w-full py-2 px-2 bg-transparent text-gray-800 outline-none placeholder-gray-400 font-medium"
                            />
                        </div>
                        <button 
                            type="submit" 
                            disabled={!newComment.trim()}
                            className={`p-2.5 rounded-full transition-all flex items-center justify-center ${newComment.trim() ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md hover:scale-105' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                        >
                            <Send className="w-4 h-4 ml-0.5" />
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};
