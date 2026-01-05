'use client';

import { useEffect, useState } from 'react';
import { incidentApi } from '@/lib/api';
import { MapPin, AlertTriangle, Camera, Clock, Radio, Shield, Loader } from 'lucide-react';

interface FeedItem {
    id: string;
    type: string;
    description?: string;
    latitude: number;
    longitude: number;
    createdAt: string;
    isResolved: boolean;
    user?: {
        rank: string;
        firstName: string;
        lastName: string;
    };
}

function formatTimeAgo(dateString: string) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
}

function FeedItemCard({ item }: { item: FeedItem }) {
    const isSuppression = item.type === 'SUPPRESSION';
    const isPrevention = item.type === 'PREVENTION';

    // Determine style based on type
    let color = 'text-gray-400';
    let border = 'border-l-2 border-gray-700';
    let bg = 'hover:bg-gray-800/50';
    let icon = <MapPin className="w-4 h-4" />;

    if (isSuppression) {
        color = 'text-rose-400';
        border = 'border-l-2 border-rose-500';
        bg = 'bg-rose-900/10 hover:bg-rose-900/20';
        icon = <AlertTriangle className="w-4 h-4" />;
    } else if (isPrevention) {
        color = 'text-amber-400';
        border = 'border-l-2 border-amber-500';
        bg = 'bg-amber-900/10 hover:bg-amber-900/20';
        icon = <Shield className="w-4 h-4" />;
    }

    return (
        <div className={`p-4 border-b border-white/5 transition-colors ${bg} ${border}`}>
            <div className="flex gap-3">
                <div className="flex-shrink-0 mt-1">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-black/40 border border-white/10 ${color}`}>
                        {icon}
                    </div>
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                        <p className="text-xs font-bold text-gray-300 uppercase tracking-wide">
                            {item.user ? `${item.user.rank} ${item.user.firstName}` : 'Unknown Officer'}
                        </p>
                        <span className="text-[10px] text-gray-500 font-mono">{formatTimeAgo(item.createdAt)}</span>
                    </div>

                    <p className="text-sm text-white mt-1 font-medium leading-relaxed">
                        {item.description || 'No description provided'}
                    </p>

                    <div className="flex items-center gap-2 mt-2">
                        <span className={`text-[10px] px-2 py-0.5 rounded border ${isSuppression ? 'border-rose-500/30 text-rose-400' : 'border-gray-700 text-gray-500'}`}>
                            {item.type}
                        </span>
                        {item.latitude && (
                            <span className="text-[10px] text-gray-600 flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function FeedStream() {
    const [feed, setFeed] = useState<FeedItem[]>([]);
    const [loading, setLoading] = useState(true);

    // Fetch real data
    const fetchFeed = async () => {
        try {
            const response = await incidentApi.getFeed(undefined, 20); // Get last 20 incidents
            if (response.data && Array.isArray(response.data)) {
                setFeed(response.data);
            }
        } catch (err) {
            console.error("Failed to fetch feed", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFeed();
        const interval = setInterval(fetchFeed, 10000); // 10s Update
        return () => clearInterval(interval);
    }, []);

    if (loading && feed.length === 0) {
        return (
            <div className="flex items-center justify-center h-40">
                <Loader className="w-6 h-6 text-gray-500 animate-spin" />
            </div>
        );
    }

    if (feed.length === 0) {
        return (
            <div className="p-8 text-center">
                <p className="text-gray-500 text-sm">No recent activity</p>
            </div>
        );
    }

    return (
        <div>
            {feed.map((item) => (
                <FeedItemCard key={item.id} item={item} />
            ))}
        </div>
    );
}
