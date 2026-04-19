import { useState, useEffect } from 'react';
import axios from '../api/axios';
import { ResourceCard } from '../components/ResourceCard';
import { ResourceForm } from '../components/ResourceForm';
import { Plus, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const ResourcesPage = () => {
    const { user } = useAuth();
    const [resources, setResources] = useState([]);
    const [search, setSearch] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingResource, setEditingResource] = useState(null);

    useEffect(() => {
        fetchResources();
    }, [search]);

    const fetchResources = async () => {
        try {
            // Add timestamp to prevent caching
            const timestamp = new Date().getTime();
            const res = await axios.get(`/api/resources?search=${search}&_t=${timestamp}`, { 
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
        <div className="p-8 w-full max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-800">Facilities & Assets</h1>
                {user?.role === 'ADMIN' && (
                    <button
                        onClick={handleCreate}
                        className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
                    >
                        <Plus className="w-5 h-5" />
                        Add Resource
                    </button>
                )}
            </div>

            <div className="relative mb-8 max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="text-gray-400 w-5 h-5" />
                </div>
                <input
                    type="text"
                    placeholder="Search resources..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                {resources.map(resource => (
                    <ResourceCard 
                        key={resource.id} 
                        resource={resource} 
                        onEdit={() => handleEdit(resource)}
                        onDelete={() => handleDelete(resource.id)}
                    />
                ))}
                {resources.length === 0 && (
                    <div className="col-span-fulltext-center text-gray-500 py-10">
                        No resources found. Try adding some!
                    </div>
                )}
            </div>

            {isFormOpen && (
                <ResourceForm resource={editingResource} onClose={handleFormClose} />
            )}
        </div>
    );
};
