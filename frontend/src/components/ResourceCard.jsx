import { useState, useEffect } from 'react';
import { Edit2, Users, MapPin, Trash2, Check, AlertCircle, Power } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const ResourceCard = ({ resource, onEdit, onDelete }) => {
    const { user } = useAuth();
    const [imgError, setImgError] = useState(false);

    // Reset error state whenever the URL changes so the new URL gets a fresh attempt
    useEffect(() => {
        setImgError(false);
    }, [resource.imageUrl]);

    const getStatusConfig = (status) => {
        switch (status) {
            case 'ACTIVE': 
                return {
                    bg: 'bg-gradient-to-r from-green-50 to-emerald-50',
                    border: 'border-gray-200',
                    badge: 'bg-gradient-to-r from-green-400 to-emerald-400',
                    text: 'text-green-700',
                    icon: Check
                };
            case 'MAINTENANCE': 
                return {
                    bg: 'bg-gradient-to-r from-yellow-50 to-orange-50',
                    border: 'border-gray-200',
                    badge: 'bg-gradient-to-r from-yellow-400 to-orange-400',
                    text: 'text-yellow-700',
                    icon: AlertCircle
                };
            case 'INACTIVE': 
                return {
                    bg: 'bg-gradient-to-r from-gray-50 to-slate-50',
                    border: 'border-gray-200',
                    badge: 'bg-gradient-to-r from-gray-400 to-slate-400',
                    text: 'text-gray-700',
                    icon: Power
                };
            default: 
                return {
                    bg: 'bg-white',
                    border: 'border-gray-200',
                    badge: 'bg-gradient-to-r from-gray-400 to-gray-500',
                    text: 'text-gray-700',
                    icon: Check
                };
        }
    };

    const statusConfig = getStatusConfig(resource.status);
    const StatusIcon = statusConfig.icon;

    return (
        <div className={`group relative bg-white rounded-2xl overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/10 border-2 ${statusConfig.border} transform hover:-translate-y-2`}>
            {/* Image Container with Gradient Overlay */}
            <div className="relative h-56 overflow-hidden bg-gradient-to-br from-blue-100 to-purple-100">
                {resource.imageUrl && !imgError ? (
                    <>
                        <img
                            src={resource.imageUrl}
                            alt={resource.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            referrerPolicy="no-referrer"
                            onError={() => {
                                console.warn('Image failed to load:', resource.imageUrl);
                                setImgError(true);
                            }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </>
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-200 to-purple-200 flex items-center justify-center">
                        <div className="text-center">
                            <div className="w-12 h-12 bg-white/30 rounded-full flex items-center justify-center mx-auto mb-2">
                                <MapPin className="w-6 h-6 text-white" />
                            </div>
                            <p className="text-white/70 text-sm font-medium">No Image Available</p>
                        </div>
                    </div>
                )}
                
                {/* Status Badge - Floating */}
                <div className={`absolute top-4 right-4 ${statusConfig.badge} text-white px-3 py-1.5 rounded-full font-bold text-xs flex items-center gap-1.5 shadow-lg backdrop-blur-sm`}>
                    <StatusIcon className="w-3.5 h-3.5" />
                    {resource.status}
                </div>
            </div>

            {/* Content Section */}
            <div className="p-6">
                {/* Title */}
                <h3 className="text-xl font-bold text-gray-900 mb-1 line-clamp-2 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 group-hover:bg-clip-text transition-all duration-300">
                    {resource.name}
                </h3>

                {/* Resource Type Badge */}
                <div className="inline-block mb-4">
                    <span className="text-xs font-semibold px-3 py-1 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 rounded-full">
                        {resource.type}
                    </span>
                </div>

                {/* Divider */}
                <div className="w-12 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mb-4"></div>

                {/* Info Grid */}
                <div className="space-y-3 mb-5">
                    <div className="flex items-center gap-3 text-gray-700 group/item cursor-pointer">
                        <div className="p-2 bg-blue-100 rounded-lg group-hover/item:bg-blue-200 transition-colors">
                            <Users className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-500 font-medium">Capacity</p>
                            <p className="font-semibold text-gray-900">{resource.capacity} People</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 text-gray-700 group/item cursor-pointer">
                        <div className="p-2 bg-purple-100 rounded-lg group-hover/item:bg-purple-200 transition-colors">
                            <MapPin className="w-4 h-4 text-purple-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-500 font-medium">Location</p>
                            <p className="font-semibold text-gray-900 truncate">{resource.location}</p>
                        </div>
                    </div>
                </div>

                {/* Admin Actions */}
                {user?.role === 'ADMIN' && (
                    <>
                        <div className="border-t-2 border-gray-100 my-5"></div>
                        <div className="flex flex-col gap-2">
                            <button
                                onClick={onEdit}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-blue-700 text-blue-700 rounded-xl font-semibold text-sm tracking-widest hover:bg-blue-50 transition-all duration-300 active:scale-95"
                            >
                                <Edit2 className="w-4 h-4" />
                                EDIT
                            </button>
                            <button
                                onClick={onDelete}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-red-500 text-red-500 rounded-xl font-semibold text-sm tracking-widest hover:bg-red-50 transition-all duration-300 active:scale-95"
                            >
                                <Trash2 className="w-4 h-4" />
                                DELETE
                            </button>
                        </div>
                    </>
                )}
            </div>

            {/* Decorative Corner Accent */}
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-400/0 to-purple-400/0 group-hover:from-blue-400/10 group-hover:to-purple-400/10 rounded-bl-full transition-all duration-500 pointer-events-none"></div>
        </div>
    );
};
