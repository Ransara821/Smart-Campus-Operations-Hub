import { useState, useEffect } from 'react';
import axios from '../api/axios';
import { ResourceCard } from '../components/ResourceCard';
import { ResourceForm } from '../components/ResourceForm';
import { Plus, Search, X, Filter, Trash2, AlertTriangle, CheckCircle2, Building2, Users, MapPin } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const ResourcesPage = () => {
    const { user } = useAuth();
    const [resources, setResources] = useState([]);
    const [search, setSearch] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({
        type: '',
        minCapacity: '',
        maxCapacity: '',
        location: ''
    });
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingResource, setEditingResource] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [showDeleteToast, setShowDeleteToast] = useState(false);

    const resourceTypes = [
        { value: 'LECTURE_HALL', label: 'Lecture Hall' },
        { value: 'LAB', label: 'Lab' },
        { value: 'EQUIPMENT', label: 'Equipment' },
    ];

    useEffect(() => {
        fetchResources();
    }, [search, filters]);

    const fetchResources = async () => {
        try {
            // Add timestamp to prevent caching
            const timestamp = new Date().getTime();
            const params = new URLSearchParams({
                search: search,
                _t: timestamp
            });

            // Add filter parameters
            if (filters.type) params.append('type', filters.type);
            if (filters.minCapacity) params.append('minCapacity', filters.minCapacity);
            if (filters.maxCapacity) params.append('maxCapacity', filters.maxCapacity);
            if (filters.location) params.append('location', filters.location);

            const res = await axios.get(`/api/resources?${params.toString()}`, { 
                withCredentials: true,
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                }
            });
            setResources(res.data);
        } catch (error) {
            console.error("Failed to fetch resources", error);
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const clearFilters = () => {
        setFilters({
            type: '',
            minCapacity: '',
            maxCapacity: '',
            location: ''
        });
        setSearch('');
    };

    const hasActiveFilters = search || filters.type || filters.minCapacity || filters.maxCapacity || filters.location;

    const handleEdit = (resource) => {
        setEditingResource(resource);
        setIsFormOpen(true);
    };

    const handleCreate = () => {
        setEditingResource(null);
        setIsFormOpen(true);
    };

    const handleDelete = (resourceId) => {
        setDeleteConfirm(resourceId);
    };

    const confirmDelete = async () => {
        try {
            await axios.delete(`/api/resources/${deleteConfirm}`, { withCredentials: true });
            setDeleteConfirm(null);
            setShowDeleteToast(true);
            setTimeout(() => setShowDeleteToast(false), 2500);
            fetchResources();
        } catch (error) {
            alert('Failed to delete resource');
            console.error(error);
        }
    };

    const handleFormClose = () => {
        setIsFormOpen(false);
        setEditingResource(null);
        fetchResources(); // Refresh list after edit/create
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 p-6 md:p-8 w-full">
            <div className="max-w-7xl mx-auto">
                {/* Header Section */}
                <div className="mb-10">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div>
                            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                                Facilities & Assets
                            </h1>
                            <p className="text-gray-600 text-lg">Manage and explore your campus resources</p>
                        </div>
                        {user?.role === 'ADMIN' && (
                            <button
                                onClick={handleCreate}
                                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-300 font-semibold transform hover:scale-105 active:scale-95"
                            >
                                <Plus className="w-5 h-5" />
                                Add Resource
                            </button>
                        )}
                    </div>
                </div>

                {/* Search Bar + Filters Toggle */}
                <div className="mb-6 flex items-center gap-3 max-w-2xl">
                    <div className="relative flex-1">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Search className="text-blue-400 w-5 h-5" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search resources by name or location..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-12 w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:ring-0 focus:border-blue-500 outline-none transition-colors text-gray-700 placeholder-gray-400 shadow-sm hover:shadow-md"
                        />
                    </div>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="flex items-center gap-2 px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-700 font-medium hover:border-blue-500 hover:text-blue-600 transition-all whitespace-nowrap shadow-sm hover:shadow-md"
                    >
                        <Filter className="w-4 h-4" />
                        Advanced Filters
                    </button>
                    {hasActiveFilters && (
                        <button
                            onClick={clearFilters}
                            className="flex items-center gap-1 px-3 py-2 bg-red-50 text-red-600 rounded-lg font-medium hover:bg-red-100 transition-all text-sm"
                        >
                            <X className="w-4 h-4" />
                            Clear All
                        </button>
                    )}
                </div>

                {/* Advanced Filters Panel */}
                {showFilters && (
                    <div className="mb-8 overflow-hidden rounded-2xl border border-gray-100 shadow-lg"
                        style={{ animation: 'slideDown 0.3s ease forwards' }}>

                        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Filter className="w-4 h-4 text-white/80" />
                                <span className="text-white font-bold tracking-wide text-sm uppercase">Filter Resources</span>
                            </div>
                            {hasActiveFilters && (
                                <span className="bg-white/20 text-white text-xs font-semibold px-2.5 py-1 rounded-full">Active</span>
                            )}
                        </div>

                        <div className="bg-white px-6 py-5">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

                                {/* Type */}
                                <div className="space-y-1.5">
                                    <label className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                                        <Building2 className="w-3 h-3" /> Type
                                    </label>
                                    <select
                                        name="type"
                                        value={filters.type}
                                        onChange={handleFilterChange}
                                        className="w-full px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm text-gray-700 outline-none focus:border-blue-400 focus:bg-white focus:shadow-[0_0_0_3px_rgba(59,130,246,0.1)] transition-all appearance-none cursor-pointer"
                                    >
                                        <option value="">All Types</option>
                                        {resourceTypes.map(t => (
                                            <option key={t.value} value={t.value}>{t.label}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Capacity Range */}
                                <div className="space-y-1.5">
                                    <label className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                                        <Users className="w-3 h-3" /> Capacity Range
                                    </label>
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-semibold">MIN</span>
                                            <input
                                                type="number"
                                                name="minCapacity"
                                                placeholder="0"
                                                value={filters.minCapacity}
                                                onChange={handleFilterChange}
                                                min="0"
                                                className="w-full pl-12 pr-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm text-gray-700 outline-none focus:border-blue-400 focus:bg-white focus:shadow-[0_0_0_3px_rgba(59,130,246,0.1)] transition-all placeholder-gray-300"
                                            />
                                        </div>
                                        <div className="relative flex-1">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-semibold">MAX</span>
                                            <input
                                                type="number"
                                                name="maxCapacity"
                                                placeholder="∞"
                                                value={filters.maxCapacity}
                                                onChange={handleFilterChange}
                                                min="0"
                                                className="w-full pl-12 pr-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm text-gray-700 outline-none focus:border-blue-400 focus:bg-white focus:shadow-[0_0_0_3px_rgba(59,130,246,0.1)] transition-all placeholder-gray-300"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Location */}
                                <div className="space-y-1.5">
                                    <label className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                                        <MapPin className="w-3 h-3" /> Location
                                    </label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                                        <input
                                            type="text"
                                            name="location"
                                            placeholder="Search location…"
                                            value={filters.location}
                                            onChange={handleFilterChange}
                                            className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm text-gray-700 outline-none focus:border-blue-400 focus:bg-white focus:shadow-[0_0_0_3px_rgba(59,130,246,0.1)] transition-all placeholder-gray-300"
                                        />
                                    </div>
                                </div>

                            </div>
                        </div>

                        <style>{`
                            @keyframes slideDown {
                                from { opacity: 0; transform: translateY(-10px); }
                                to   { opacity: 1; transform: translateY(0); }
                            }
                        `}</style>
                    </div>
                )}

                {/* Resources Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
                    {resources.map(resource => (
                        <ResourceCard 
                            key={resource.id} 
                            resource={resource} 
                            onEdit={() => handleEdit(resource)}
                            onDelete={() => handleDelete(resource.id)}
                        />
                    ))}
                    {resources.length === 0 && (
                        <div className="col-span-full flex flex-col items-center justify-center py-16">
                            <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mb-4">
                                <Search className="w-8 h-8 text-gray-400" />
                            </div>
                            <p className="text-gray-600 text-lg font-medium">No resources found</p>
                            <p className="text-gray-500 text-sm mt-1">Try adjusting your filters or search criteria</p>
                        </div>
                    )}
                </div>
            </div>

            {isFormOpen && (
                <ResourceForm resource={editingResource} onClose={handleFormClose} />
            )}

            {/* ── Delete Success Toast ── */}
            {showDeleteToast && (
                <div className="fixed top-6 left-0 right-0 z-[9999] flex justify-center pointer-events-none">
                    <div style={{ minWidth: '320px', animation: 'slideDown 0.4s ease forwards' }}>
                        <div className="flex items-center gap-4 px-6 py-4 rounded-2xl bg-white border border-red-100"
                            style={{ boxShadow: '0 8px 32px 0 rgba(239,68,68,0.18), 0 2px 8px 0 rgba(0,0,0,0.08)' }}>
                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-red-400 to-rose-500 flex items-center justify-center shadow-lg">
                                <CheckCircle2 className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1">
                                <p className="font-bold text-gray-800 text-base leading-tight">Resource Deleted!</p>
                                <p className="text-sm text-gray-500 mt-0.5">The resource has been permanently removed.</p>
                            </div>
                            <div className="w-1.5 h-10 rounded-full bg-gradient-to-b from-red-400 to-rose-500 ml-1" />
                        </div>
                        <div className="mt-1.5 h-1 rounded-full bg-red-100 overflow-hidden mx-2">
                            <div className="h-full bg-gradient-to-r from-red-400 to-rose-500 rounded-full"
                                style={{ animation: 'shrink 2.5s linear forwards' }} />
                        </div>
                    </div>
                </div>
            )}

            {/* ── Delete Confirmation Modal ── */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div
                        className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl"
                        style={{ animation: 'popIn 0.3s cubic-bezier(0.34,1.56,0.64,1) forwards' }}
                    >
                        {/* Red header strip */}
                        <div className="relative bg-gradient-to-br from-red-500 to-rose-600 px-6 pt-8 pb-10 flex flex-col items-center">
                            <div className="absolute top-0 right-0 w-28 h-28 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                            <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mb-3 shadow-lg">
                                <Trash2 className="w-8 h-8 text-white" />
                            </div>
                            <h2 className="text-white text-xl font-bold">Delete Resource</h2>
                        </div>

                        {/* Body */}
                        <div className="px-6 pt-6 pb-3 text-center -mt-5">
                            <div className="inline-flex items-center gap-1.5 bg-red-50 text-red-500 text-xs font-semibold px-3 py-1 rounded-full mb-4">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                This action cannot be undone
                            </div>
                            <p className="text-gray-600 text-sm leading-relaxed">
                                Are you sure you want to permanently delete this resource? All associated data will be removed from the system.
                            </p>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 px-6 pb-6 pt-4">
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                className="flex-1 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 text-white font-semibold text-sm hover:shadow-lg hover:shadow-red-500/30 transition-all flex items-center justify-center gap-2"
                            >
                                <Trash2 className="w-4 h-4" />
                                Delete
                            </button>
                        </div>
                    </div>

                    <style>{`
                        @keyframes popIn {
                            from { opacity: 0; transform: scale(0.85); }
                            to   { opacity: 1; transform: scale(1); }
                        }
                        @keyframes slideDown {
                            from { opacity: 0; transform: translateY(-24px); }
                            to   { opacity: 1; transform: translateY(0); }
                        }
                        @keyframes shrink {
                            from { width: 100%; }
                            to   { width: 0%; }
                        }
                    `}</style>
                </div>
            )}
        </div>
    );
};
