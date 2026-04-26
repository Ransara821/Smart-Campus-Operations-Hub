import { useState, useEffect } from 'react';
import axios from '../api/axios';
import { ResourceCard } from '../components/ResourceCard';
import { ResourceForm } from '../components/ResourceForm';
import { Plus, Search, X, Filter } from 'lucide-react';
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

    const handleDelete = async (resourceId) => {
        if (!window.confirm('Are you sure you want to delete this resource?')) return;
        try {
            await axios.delete(`/api/resources/${resourceId}`, { withCredentials: true });
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
                    <div className="mb-8 p-6 bg-white border-2 border-gray-200 rounded-xl shadow-sm">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">Filter Resources</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* Resource Type Filter */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Resource Type
                                </label>
                                <select
                                    name="type"
                                    value={filters.type}
                                    onChange={handleFilterChange}
                                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-0 focus:border-blue-500 outline-none transition-colors text-gray-700"
                                >
                                    <option value="">All Types</option>
                                    {resourceTypes.map(type => (
                                        <option key={type.value} value={type.value}>{type.label}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Min Capacity Filter */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Min Capacity
                                </label>
                                <input
                                    type="number"
                                    name="minCapacity"
                                    placeholder="From"
                                    value={filters.minCapacity}
                                    onChange={handleFilterChange}
                                    min="0"
                                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-0 focus:border-blue-500 outline-none transition-colors text-gray-700 placeholder-gray-400"
                                />
                            </div>

                            {/* Max Capacity Filter */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Max Capacity
                                </label>
                                <input
                                    type="number"
                                    name="maxCapacity"
                                    placeholder="To"
                                    value={filters.maxCapacity}
                                    onChange={handleFilterChange}
                                    min="0"
                                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-0 focus:border-blue-500 outline-none transition-colors text-gray-700 placeholder-gray-400"
                                />
                            </div>

                            {/* Location Filter */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Location
                                </label>
                                <input
                                    type="text"
                                    name="location"
                                    placeholder="Search location..."
                                    value={filters.location}
                                    onChange={handleFilterChange}
                                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-0 focus:border-blue-500 outline-none transition-colors text-gray-700 placeholder-gray-400"
                                />
                            </div>
                        </div>
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
        </div>
    );
};
