'use client';

import { useState, useEffect } from 'react';
import { incidentApi, trackingApi, checkinApi, userApi, organizationApi, riskzoneApi } from '@/lib/api';
import {
    BarChart3,
    TrendingUp,
    TrendingDown,
    Users,
    MapPin,
    AlertTriangle,
    Clock,
    CheckCircle,
    Radio,
    Shield,
    Activity,
    FileText
} from 'lucide-react';

interface DashboardStats {
    totalUsers: number;
    activePatrols: number;
    totalIncidents: number;
    activeIncidents: number;
    resolvedIncidents: number;
    totalRiskZones: number;
    totalCheckIns: number;
    totalStations: number;
}

export default function StatsPage() {
    const [stats, setStats] = useState<DashboardStats>({
        totalUsers: 0,
        activePatrols: 0,
        totalIncidents: 0,
        activeIncidents: 0,
        resolvedIncidents: 0,
        totalRiskZones: 0,
        totalCheckIns: 0,
        totalStations: 0
    });
    const [recentIncidents, setRecentIncidents] = useState<any[]>([]);
    const [recentCheckIns, setRecentCheckIns] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchAllStats();
    }, []);

    const fetchAllStats = async () => {
        try {
            const [
                usersRes,
                patrolsRes,
                incidentsRes,
                riskzonesRes,
                checkinsRes,
                stationsRes
            ] = await Promise.all([
                userApi.getAll(),
                trackingApi.getActivePatrols(),
                incidentApi.getAll(),
                riskzoneApi.getAll(),
                checkinApi.getRecent(),
                organizationApi.getStations()
            ]);

            const incidents = incidentsRes.data || [];

            setStats({
                totalUsers: usersRes.data?.length || 0,
                activePatrols: patrolsRes.data?.length || 0,
                totalIncidents: incidents.length,
                activeIncidents: incidents.filter((i: any) => i.status === 'ACTIVE').length,
                resolvedIncidents: incidents.filter((i: any) => i.status === 'RESOLVED').length,
                totalRiskZones: riskzonesRes.data?.length || 0,
                totalCheckIns: checkinsRes.data?.length || 0,
                totalStations: stationsRes.data?.length || 0
            });

            setRecentIncidents(incidents.slice(0, 5));
            setRecentCheckIns(checkinsRes.data?.slice(0, 5) || []);
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('th-TH', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-sky-500 font-mono tracking-widest text-sm">LOADING ANALYTICS...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6 text-white bg-gray-950 min-h-screen">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-sky-400 to-indigo-500 flex items-center gap-2">
                    <BarChart3 className="w-8 h-8 text-sky-500" />
                    Analytics Dashboard
                </h1>
                <p className="text-gray-400 text-sm mt-1">Real-time system statistics and performance metrics</p>
            </div>

            {/* Main Stats Grid */}
            <div className="grid grid-cols-4 gap-4">
                <StatCard
                    icon={Users}
                    label="Total Personnel"
                    value={stats.totalUsers}
                    color="indigo"
                />
                <StatCard
                    icon={Radio}
                    label="Active Patrols"
                    value={stats.activePatrols}
                    color="cyan"
                    pulse
                />
                <StatCard
                    icon={Shield}
                    label="Stations"
                    value={stats.totalStations}
                    color="blue"
                />
                <StatCard
                    icon={MapPin}
                    label="Risk Zones"
                    value={stats.totalRiskZones}
                    color="amber"
                />
            </div>

            {/* Incidents Stats */}
            <div className="grid grid-cols-3 gap-4">
                <StatCard
                    icon={FileText}
                    label="Total Incidents"
                    value={stats.totalIncidents}
                    color="gray"
                    large
                />
                <StatCard
                    icon={AlertTriangle}
                    label="Active Cases"
                    value={stats.activeIncidents}
                    color="rose"
                    large
                    pulse={stats.activeIncidents > 0}
                />
                <StatCard
                    icon={CheckCircle}
                    label="Resolved"
                    value={stats.resolvedIncidents}
                    color="emerald"
                    large
                />
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-2 gap-6">
                {/* Recent Incidents */}
                <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-800 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-rose-500" />
                        <h3 className="font-bold text-white">Recent Incidents</h3>
                    </div>
                    <div className="divide-y divide-gray-800">
                        {recentIncidents.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">No incidents yet</div>
                        ) : (
                            recentIncidents.map((incident) => (
                                <div key={incident.id} className="px-5 py-3 hover:bg-gray-800/30 transition">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium text-white text-sm">{incident.title}</p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {incident.reportedBy?.rank} {incident.reportedBy?.firstName}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${incident.status === 'ACTIVE'
                                                    ? 'bg-rose-500/20 text-rose-400'
                                                    : 'bg-emerald-500/20 text-emerald-400'
                                                }`}>
                                                {incident.status}
                                            </span>
                                            <p className="text-xs text-gray-500 mt-1">{formatDate(incident.createdAt)}</p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Recent Check-ins */}
                <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-800 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                        <h3 className="font-bold text-white">Recent Check-ins</h3>
                    </div>
                    <div className="divide-y divide-gray-800">
                        {recentCheckIns.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">No check-ins yet</div>
                        ) : (
                            recentCheckIns.map((checkin) => (
                                <div key={checkin.id} className="px-5 py-3 hover:bg-gray-800/30 transition">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium text-white text-sm">
                                                {checkin.riskZone?.name || 'Unknown Zone'}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {checkin.user?.rank} {checkin.user?.firstName}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-emerald-400 text-xs font-bold">✓ Checked</span>
                                            <p className="text-xs text-gray-500 mt-1">{formatDate(checkin.createdAt)}</p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* System Status */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                    <Activity className="w-4 h-4 text-emerald-500" />
                    <h3 className="font-bold text-white">System Health</h3>
                </div>
                <div className="grid grid-cols-4 gap-4">
                    <div className="text-center">
                        <div className="w-3 h-3 bg-emerald-500 rounded-full mx-auto mb-2 animate-pulse" />
                        <p className="text-xs text-gray-400">API Server</p>
                        <p className="text-sm font-bold text-emerald-400">Online</p>
                    </div>
                    <div className="text-center">
                        <div className="w-3 h-3 bg-emerald-500 rounded-full mx-auto mb-2 animate-pulse" />
                        <p className="text-xs text-gray-400">Database</p>
                        <p className="text-sm font-bold text-emerald-400">Connected</p>
                    </div>
                    <div className="text-center">
                        <div className="w-3 h-3 bg-emerald-500 rounded-full mx-auto mb-2 animate-pulse" />
                        <p className="text-xs text-gray-400">WebSocket</p>
                        <p className="text-sm font-bold text-emerald-400">Active</p>
                    </div>
                    <div className="text-center">
                        <div className="w-3 h-3 bg-emerald-500 rounded-full mx-auto mb-2 animate-pulse" />
                        <p className="text-xs text-gray-400">GPS Tracking</p>
                        <p className="text-sm font-bold text-emerald-400">Running</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({
    icon: Icon,
    label,
    value,
    color,
    pulse = false,
    large = false
}: {
    icon: any;
    label: string;
    value: number;
    color: string;
    pulse?: boolean;
    large?: boolean;
}) {
    const colorClasses: Record<string, string> = {
        indigo: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30',
        cyan: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
        blue: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
        amber: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
        rose: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
        emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
        gray: 'text-gray-400 bg-gray-500/10 border-gray-500/30',
    };

    return (
        <div className={`p-5 rounded-xl bg-gray-900 border ${colorClasses[color]} ${large ? 'py-6' : ''}`}>
            <div className="flex items-center gap-2 mb-3">
                <Icon className={`w-5 h-5 ${pulse ? 'animate-pulse' : ''}`} />
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">{label}</span>
            </div>
            <p className={`font-bold ${large ? 'text-4xl' : 'text-3xl'}`}>{value}</p>
        </div>
    );
}
