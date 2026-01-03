'use client';

import { useState, useEffect } from 'react';
import { incidentApi } from '@/lib/api';
import { format } from 'date-fns';
import {
    AlertTriangle,
    Search,
    Filter,
    CheckCircle,
    Clock,
    MapPin,
    MoreVertical,
    FileText,
    Loader
} from 'lucide-react';

interface Incident {
    id: string;
    type: 'PREVENTION' | 'SUPPRESSION';
    title: string;
    description: string;
    latitude: number;
    longitude: number;
    status: 'ACTIVE' | 'RESOLVED';
    reportedBy: {
        username: string;
        firstName: string;
        lastName: string;
        rank: string;
    };
    createdAt: string;
}

export default function IncidentsPage() {
    const [incidents, setIncidents] = useState<Incident[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'RESOLVED'>('ALL');

    useEffect(() => {
        fetchIncidents();
    }, []);

    const fetchIncidents = async () => {
        try {
            const res = await incidentApi.getAll();
            setIncidents(res.data);
        } catch (error) {
            console.error('Failed to fetch incidents', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleResolve = async (id: string) => {
        if (!confirm('Are you sure you want to close this case?')) return;
        try {
            await incidentApi.resolve(id);
            // Optimistic update
            setIncidents(prev => prev.map(inc =>
                inc.id === id ? { ...inc, status: 'RESOLVED' } : inc
            ));
        } catch (error) {
            alert('Failed to resolve incident');
        }
    };

    const filteredIncidents = incidents.filter(inc => {
        if (filter === 'ALL') return true;
        return inc.status === filter;
    });

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    };

    return (
        <div className="p-6 space-y-6 text-white bg-gray-900 min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-rose-500 to-amber-500 flex items-center gap-2">
                        <AlertTriangle className="w-8 h-8 text-rose-500" />
                        Incident Management
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">Track and resolve reported incidents</p>
                </div>

                <div className="flex bg-gray-800 p-1 rounded-lg">
                    <button
                        onClick={() => setFilter('ALL')}
                        className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${filter === 'ALL' ? 'bg-gray-700 text-white shadow' : 'text-gray-400 hover:text-white'}`}
                    >
                        All
                    </button>
                    <button
                        onClick={() => setFilter('ACTIVE')}
                        className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${filter === 'ACTIVE' ? 'bg-rose-900/50 text-rose-200 shadow' : 'text-gray-400 hover:text-white'}`}
                    >
                        Active
                    </button>
                    <button
                        onClick={() => setFilter('RESOLVED')}
                        className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${filter === 'RESOLVED' ? 'bg-emerald-900/50 text-emerald-200 shadow' : 'text-gray-400 hover:text-white'}`}
                    >
                        Resolved
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="grid gap-4">
                {isLoading ? (
                    <div className="p-12 text-center text-gray-500">
                        <Loader className="w-8 h-8 animate-spin mx-auto mb-2" />
                        Loading incidents...
                    </div>
                ) : filteredIncidents.length === 0 ? (
                    <div className="p-12 text-center text-gray-500 bg-gray-800/20 rounded-xl border border-dashed border-gray-800">
                        <FileText className="w-12 h-12 mx-auto mb-2 opacity-20" />
                        No incidents found
                    </div>
                ) : (
                    filteredIncidents.map((incident) => (
                        <div
                            key={incident.id}
                            className={`p-4 rounded-xl border transition ${incident.status === 'ACTIVE'
                                    ? 'bg-gradient-to-r from-gray-900 to-gray-800 border-l-4 border-l-rose-500 border-gray-800'
                                    : 'bg-gray-900 border-l-4 border-l-emerald-500 border-gray-800 opacity-75'
                                }`}
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${incident.type === 'SUPPRESSION' ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'
                                            }`}>
                                            {incident.type}
                                        </span>
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${incident.status === 'ACTIVE' ? 'bg-red-500 text-white animate-pulse' : 'bg-emerald-500/20 text-emerald-400'
                                            }`}>
                                            {incident.status}
                                        </span>
                                        <span className="text-gray-500 text-xs flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {formatDate(incident.createdAt)}
                                        </span>
                                    </div>
                                    <h3 className="font-bold text-lg text-white">{incident.title}</h3>
                                    <p className="text-gray-400 text-sm">{incident.description}</p>

                                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                        <div className="flex items-center gap-1">
                                            <div className="w-5 h-5 rounded-full bg-gray-700 flex items-center justify-center text-gray-300 font-bold">
                                                {incident.reportedBy?.firstName?.[0]}
                                            </div>
                                            <span>
                                                {incident.reportedBy?.rank} {incident.reportedBy?.firstName} {incident.reportedBy?.lastName}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <MapPin className="w-3 h-3" />
                                            {incident.latitude.toFixed(6)}, {incident.longitude.toFixed(6)}
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    {incident.status === 'ACTIVE' && (
                                        <button
                                            onClick={() => handleResolve(incident.id)}
                                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition shadow-lg shadow-emerald-900/20 flex items-center gap-2"
                                        >
                                            <CheckCircle className="w-4 h-4" />
                                            Close Case
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
