import { Edit2, Users, MapPin, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const ResourceCard = ({ resource, onEdit, onDelete }) => {
    const { user } = useAuth();

    const getStatusColor = (status) => {
        switch (status) {
            case 'ACTIVE': return 'bg-green-100 text-green-800';
            case 'MAINTENANCE': return 'bg-yellow-100 text-yellow-800';
            case 'INACTIVE': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 border border-gray-100 overflow-hidden group">
            {resource.imageUrl ? (
                <img src={resource.imageUrl} alt={resource.name} className="w-full h-48 object-cover" />
            ) : (
                <div className="w-full h-48 bg-gray-100 flex items-center justify-center text-gray-400">
                    No Image
                </div>
            )}
            <div className="p-5">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-primary-600 transition-colors">
                        {resource.name}
                    </h3>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(resource.status)}`}>
                        {resource.status}
                    </span>
                </div>

                <p className="text-sm font-medium text-gray-500 mb-4">{resource.type}</p>

                <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                    <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>Capacity {resource.capacity}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span className="truncate max-w-[120px]">{resource.location}</span>
                    </div>
                </div>

                {user?.role === 'ADMIN' && (
                    <div className="flex gap-2 pt-4 border-t border-gray-100">
                        <button
                            onClick={onEdit}
                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg font-medium text-sm transition-colors"
                        >
                            <Edit2 className="w-4 h-4" />
                            Edit
                        </button>
                        <button
                            onClick={onDelete}
                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg font-medium text-sm transition-colors"
                        >
                            <Trash2 className="w-4 h-4" />
                            Delete
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
