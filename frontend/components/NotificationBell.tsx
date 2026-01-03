'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, AlertCircle, Info } from 'lucide-react';
import { socket } from '@/lib/socket';
import { notificationApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store/auth';

interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'incident' | 'alert' | 'info';
    isRead: boolean;
    createdAt: string;
}

export default function NotificationBell() {
    const { user } = useAuthStore();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);

    // Audio ref for ping sound
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        // Initialize audio
        if (typeof window !== 'undefined') {
            audioRef.current = new Audio('/sounds/ping.mp3');
            audioRef.current.volume = 0.5;
        }

        // Fetch initial notifications
        fetchNotifications();

        // Connect socket
        socket.connect();

        if (user) {
            socket.emit('join', {
                userId: user.id,
                stationId: user.station?.id
            });
        }

        // Listen for new notifications
        socket.on('notification', (newNotification: Notification) => {
            setNotifications(prev => [newNotification, ...prev]);
            setUnreadCount(prev => prev + 1);

            // Play sound
            if (audioRef.current) {
                audioRef.current.play().catch(e => console.log('Audio play failed', e));
            }
        });

        return () => {
            socket.off('notification');
            socket.disconnect();
        };
    }, [user]);

    const fetchNotifications = async () => {
        try {
            const res = await notificationApi.getAll(10);
            setNotifications(res.data);
            const countRes = await notificationApi.getUnreadCount();
            setUnreadCount(countRes.data.count);
        } catch (error) {
            console.error('Failed to fetch notifications', error);
        }
    };

    const handleMarkAsRead = async (id: string) => {
        try {
            await notificationApi.markAsRead(id);
            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, isRead: true } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Failed to mark as read', error);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await notificationApi.markAllAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Failed to mark all as read', error);
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'incident': return <AlertCircle className="w-5 h-5 text-rose-500" />;
            case 'alert': return <AlertCircle className="w-5 h-5 text-amber-500" />;
            default: return <Info className="w-5 h-5 text-blue-500" />;
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-lg hover:bg-white/10 transition text-gray-400 hover:text-white"
            >
                <Bell className={`w-5 h-5 ${unreadCount > 0 ? 'animate-swing' : ''}`} />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-[#1a1a1a] animate-pulse"></span>
                )}
            </button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute right-0 mt-3 w-80 bg-gray-900 border border-gray-800 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                        <div className="p-4 border-b border-gray-800 flex items-center justify-between bg-black/20">
                            <h3 className="font-bold text-white text-sm">Notifications</h3>
                            {unreadCount > 0 && (
                                <button
                                    onClick={handleMarkAllRead}
                                    className="text-xs text-emerald-400 hover:text-emerald-300 font-medium"
                                >
                                    Mark all read
                                </button>
                            )}
                        </div>
                        <div className="max-h-[400px] overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="p-8 text-center text-gray-500 text-xs">
                                    <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                    No notifications
                                </div>
                            ) : (
                                notifications.map((n) => (
                                    <div
                                        key={n.id}
                                        onClick={() => !n.isRead && handleMarkAsRead(n.id)}
                                        className={`p-4 border-b border-gray-800 hover:bg-white/5 transition cursor-pointer flex gap-3 ${!n.isRead ? 'bg-white/[0.02]' : ''}`}
                                    >
                                        <div className="mt-1 flex-shrink-0">
                                            {getIcon(n.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm ${!n.isRead ? 'text-white font-medium' : 'text-gray-400'}`}>
                                                {n.title}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                                {n.message}
                                            </p>
                                            <p className="text-[10px] text-gray-600 mt-2">
                                                {formatDate(n.createdAt)}
                                            </p>
                                        </div>
                                        {!n.isRead && (
                                            <div className="w-2 h-2 rounded-full bg-emerald-500 mt-2 flex-shrink-0"></div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
