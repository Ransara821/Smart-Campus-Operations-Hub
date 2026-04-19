import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from '../api/axios';
import { Bell, BellOff, CheckCircle2, X, Calendar, Ticket, AlertCircle } from 'lucide-react';

export const NotificationsPage = () => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // 'all' | 'unread'

    useEffect(() => {
        loadNotifications();
    }, [filter]);

    const loadNotifications = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`/api/notifications?unreadOnly=${filter === 'unread'}`, {
                withCredentials: true
            });
            console.log('Loaded notifications:', res.data);
            setNotifications(res.data);
        } catch (error) {
            console.error('Failed to load notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (notificationId) => {
        try {
            await axios.patch(`/api/notifications/${notificationId}/read`, {}, {
                withCredentials: true
            });
            console.log('Marked notification as read:', notificationId);
            
            // Update UI immediately
            setNotifications(prev =>
                prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
            );
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            console.log('Marking all notifications as read...');
            await axios.patch('/api/notifications/read-all', {}, {
                withCredentials: true
            });
            console.log('✅ All notifications marked as read');
            
            // Update UI immediately
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'BOOKING':
                return <Calendar className="w-5 h-5 text-blue-600" />;
            case 'TICKET':
                return <Ticket className="w-5 h-5 text-purple-600" />;
            default:
                return <Bell className="w-5 h-5 text-gray-600" />;
        }
    };

    const formatTimestamp = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    const unreadCount = notifications.filter(n => !n.isRead).length;

    if (loading) {
        return (
            <div className="container mx-auto p-6">
                <div className="flex items-center justify-center py-20">
                    <div className="text-gray-500">Loading notifications...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-6 max-w-4xl">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                        <Bell className="w-8 h-8 text-primary-600" />
                        Notifications
                    </h1>
                    <p className="text-gray-600 mt-1">
                        {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
                    </p>
                </div>
                {unreadCount > 0 && (
                    <button
                        onClick={markAllAsRead}
                        className="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition flex items-center gap-2"
                    >
                        <CheckCircle2 className="w-4 h-4" />
                        Mark All Read
                    </button>
                )}
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 mb-6 border-b border-gray-200">
                <button
                    onClick={() => setFilter('all')}
                    className={`px-4 py-2 font-medium transition border-b-2 ${
                        filter === 'all'
                            ? 'text-primary-600 border-primary-600'
                            : 'text-gray-600 border-transparent hover:text-gray-900'
                    }`}
                >
                    All ({notifications.length})
                </button>
                <button
                    onClick={() => setFilter('unread')}
                    className={`px-4 py-2 font-medium transition border-b-2 ${
                        filter === 'unread'
                            ? 'text-primary-600 border-primary-600'
                            : 'text-gray-600 border-transparent hover:text-gray-900'
                    }`}
                >
                    Unread ({unreadCount})
                </button>
            </div>

            {/* Notifications List */}
            {notifications.length === 0 ? (
                <div className="text-center py-20">
                    <BellOff className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-600 mb-2">
                        {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
                    </h3>
                    <p className="text-gray-500">
                        {filter === 'unread' 
                            ? "You're all caught up! Check back later for updates."
                            : "You'll see notifications about bookings, tickets, and more here."}
                    </p>
                </div>
            ) : (
                <div className="space-y-2">
                    {notifications.map((notification) => (
                        <div
                            key={notification.id}
                            onClick={() => {
                                if (!notification.isRead) {
                                    markAsRead(notification.id);
                                }
                            }}
                            className={`p-4 rounded-lg border transition cursor-pointer ${
                                notification.isRead
                                    ? 'bg-white border-gray-200 hover:bg-gray-50 opacity-75'
                                    : 'bg-blue-50 border-blue-300 hover:bg-blue-100 shadow-sm'
                            }`}
                        >
                            <div className="flex gap-4">
                                {/* Icon */}
                                <div className="flex-shrink-0 mt-1">
                                    {getNotificationIcon(notification.relatedEntityType)}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                        <h3 className={`font-semibold ${
                                            notification.isRead ? 'text-gray-600' : 'text-gray-900'
                                        }`}>
                                            {notification.title}
                                        </h3>
                                        {!notification.isRead && (
                                            <div className="flex items-center gap-1">
                                                <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0"></div>
                                                <span className="text-xs font-semibold text-blue-600 uppercase">New</span>
                                            </div>
                                        )}
                                        {notification.isRead && (
                                            <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                                        )}
                                    </div>
                                    <p className={`mt-1 text-sm leading-relaxed ${
                                        notification.isRead ? 'text-gray-500' : 'text-gray-700'
                                    }`}>
                                        {notification.message}
                                    </p>
                                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                        <span>{formatTimestamp(notification.createdAt)}</span>
                                        <span className={`px-2 py-0.5 rounded font-medium ${
                                            notification.isRead 
                                                ? 'bg-gray-100 text-gray-500'
                                                : 'bg-blue-100 text-blue-700'
                                        }`}>
                                            {notification.relatedEntityType}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
