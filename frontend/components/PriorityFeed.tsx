'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, MapPin, Clock, ChevronRight, X, Siren } from 'lucide-react';
import { incidentApi } from '@/lib/api';

interface IncidentItem {
    id: string;
    category: string;
    itemType: string;
    quantity?: number;
    unit?: string;
}

interface Incident {
    id: string;
    type: string;
    description: string;
    latitude: number;
    longitude: number;
    createdAt: string;
    isResolved: boolean;
    photoUrl?: string;
    audioUrl?: string;
    items?: IncidentItem[];
    user?: {
        firstName?: string;
        lastName?: string;
        station?: {
            name?: string;
        };
    };
}

interface PriorityFeedProps {
    onFlyTo?: (lat: number, lng: number) => void;
    isCollapsed?: boolean;
    onToggle?: () => void;
}

// Get primary category from incident items
const getIncidentCategory = (incident: Incident): string => {
    if (incident.items && incident.items.length > 0) {
        return incident.items[0].category;
    }
    return 'OTHER';
};

export default function PriorityFeed({ onFlyTo, isCollapsed = false, onToggle }: PriorityFeedProps) {
    const [incidents, setIncidents] = useState<Incident[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchIncidents = async () => {
            try {
                const response = await incidentApi.getAll();
                // Sort by date descending, filter unresolved, take latest 10
                const sorted = (response.data || [])
                    .filter((i: Incident) => !i.isResolved)
                    .sort((a: Incident, b: Incident) =>
                        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                    )
                    .slice(0, 10);
                setIncidents(sorted);
            } catch (error) {
                console.error('Failed to fetch incidents:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchIncidents();
        const interval = setInterval(fetchIncidents, 15000); // Refresh every 15s
        return () => clearInterval(interval);
    }, []);

    const handleClick = (incident: Incident) => {
        if (onFlyTo && incident.latitude && incident.longitude) {
            onFlyTo(incident.latitude, incident.longitude);
        }
    };

    const getTimeAgo = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return 'เมื่อกี้';
        if (diffMins < 60) return `${diffMins} นาที`;
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours} ชม.`;
        return `${Math.floor(diffHours / 24)} วัน`;
    };

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case 'DRUGS': return '💊';
            case 'WEAPONS': return '🔫';
            case 'TRAFFIC': return '🚗';
            case 'OTHERS': return '📋';
            default: return '📋';
        }
    };

    const getCategoryColor = (category: string) => {
        switch (category) {
            case 'DRUGS': return 'border-l-red-500 bg-red-500/5';
            case 'WEAPONS': return 'border-l-orange-500 bg-orange-500/5';
            case 'TRAFFIC': return 'border-l-yellow-500 bg-yellow-500/5';
            case 'OTHERS': return 'border-l-blue-500 bg-blue-500/5';
            default: return 'border-l-blue-500 bg-blue-500/5';
        }
    };

    if (isCollapsed) {
        return (
            <button
                onClick={onToggle}
                className="absolute bottom-4 right-4 z-[500] bg-black/70 backdrop-blur-xl rounded-full p-4 border border-rose-500/30 shadow-lg shadow-rose-500/20 hover:bg-black/80 transition-all group"
            >
                <div className="relative">
                    <Siren className="w-6 h-6 text-rose-400" />
                    {incidents.length > 0 && (
                        <span className="absolute -top-2 -right-2 bg-rose-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                            {incidents.length}
                        </span>
                    )}
                </div>
            </button>
        );
    }

    return (
        <div className="absolute bottom-4 right-4 z-[500] w-80 max-h-[280px] bg-black/70 backdrop-blur-xl rounded-xl border border-white/10 shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-rose-500/10 to-transparent">
                <div className="flex items-center gap-2">
                    <Siren className="w-4 h-4 text-rose-400" />
                    <h3 className="text-sm font-bold text-white tracking-wide">PRIORITY FEED</h3>
                    <span className="text-[10px] bg-rose-500/20 text-rose-400 px-2 py-0.5 rounded-full font-medium">
                        {incidents.length}
                    </span>
                </div>
                {onToggle && (
                    <button onClick={onToggle} className="p-1 hover:bg-white/10 rounded transition">
                        <X className="w-4 h-4 text-gray-400" />
                    </button>
                )}
            </div>

            {/* Feed List */}
            <div className="overflow-y-auto max-h-[200px] custom-scrollbar">
                {loading ? (
                    <div className="p-8 text-center text-gray-500">
                        <div className="animate-spin w-6 h-6 border-2 border-gray-600 border-t-white rounded-full mx-auto mb-2"></div>
                        <p className="text-xs">กำลังโหลด...</p>
                    </div>
                ) : incidents.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-xs">ไม่มีเหตุการณ์</p>
                    </div>
                ) : (
                    <div className="divide-y divide-white/5">
                        {incidents.map((incident) => {
                            const category = getIncidentCategory(incident);
                            return (
                                <button
                                    key={incident.id}
                                    onClick={() => handleClick(incident)}
                                    className={`w-full text-left px-4 py-3 hover:bg-white/5 transition-all border-l-2 ${getCategoryColor(category)} group`}
                                >
                                    <div className="flex items-start gap-3">
                                        {incident.photoUrl ? (
                                            <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-800 flex-shrink-0">
                                                <img src={incident.photoUrl} alt="" className="w-full h-full object-cover" />
                                            </div>
                                        ) : (
                                            <span className="text-lg">{getCategoryIcon(category)}</span>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-white font-medium truncate group-hover:text-emerald-400 transition">
                                                {incident.description || 'รายงานเหตุการณ์'}
                                            </p>
                                            <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-500">
                                                <span className="flex items-center gap-1">
                                                    <MapPin className="w-3 h-3" />
                                                    {incident.user?.station?.name?.replace('สถานีตำรวจภูธร', 'สน.').replace('สน.เมือง', 'สน.') || 'ไม่ระบุ'}
                                                </span>
                                                <span>•</span>
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {getTimeAgo(incident.createdAt)}
                                                </span>
                                            </div>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Footer hint */}
            <div className="px-4 py-2 border-t border-white/5 bg-white/[0.02]">
                <p className="text-[10px] text-gray-500 text-center">คลิกเพื่อบินไปจุดเกิดเหตุ</p>
            </div>
        </div>
    );
}
