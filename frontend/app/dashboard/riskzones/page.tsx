'use client';

import { useState, useEffect } from 'react';
import { riskzoneApi, organizationApi, checkinApi } from '@/lib/api';
import {
    Shield,
    AlertTriangle,
    MapPin,
    Plus,
    Loader,
    Eye,
    Clock,
    CheckCircle,
    BarChart3
} from 'lucide-react';

interface RiskZone {
    id: string;
    name: string;
    description: string;
    latitude: number;
    longitude: number;
    radius: number;
    riskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    requiredCheckIns: number;
    station?: { name: string };
    isActive: boolean;
}

export default function RiskZonesPage() {
    const [riskZones, setRiskZones] = useState<RiskZone[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState<'ALL' | 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'>('ALL');
    const [checkInFrequency, setCheckInFrequency] = useState<any[]>([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [zonesRes, freqRes] = await Promise.all([
                riskzoneApi.getAll(),
                checkinApi.getRecent()
            ]);
            if (zonesRes.data) setRiskZones(zonesRes.data);
            if (freqRes.data) setCheckInFrequency(freqRes.data);
        } catch (error) {
            console.error('Failed to fetch risk zones:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredZones = riskZones.filter(z => {
        if (filter === 'ALL') return true;
        return z.riskLevel === filter;
    });

    const getCheckInCount = (zoneId: string) => {
        const freq = checkInFrequency.find(f => f.zoneId === zoneId);
        return freq?.count || 0;
    };

    const getRiskColor = (level: string) => {
        switch (level) {
            case 'CRITICAL': return 'text-rose-500 bg-rose-500/10 border-rose-500/30';
            case 'HIGH': return 'text-orange-500 bg-orange-500/10 border-orange-500/30';
            case 'MEDIUM': return 'text-amber-500 bg-amber-500/10 border-amber-500/30';
            case 'LOW': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30';
            default: return 'text-gray-500 bg-gray-500/10 border-gray-500/30';
        }
    };

    const stats = {
        total: riskZones.length,
        critical: riskZones.filter(z => z.riskLevel === 'CRITICAL').length,
        high: riskZones.filter(z => z.riskLevel === 'HIGH').length,
        medium: riskZones.filter(z => z.riskLevel === 'MEDIUM').length,
        low: riskZones.filter(z => z.riskLevel === 'LOW').length,
    };

    return (
        <div className="p-6 space-y-6 text-white bg-gray-950 min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-rose-500 flex items-center gap-2">
                        <Shield className="w-8 h-8 text-amber-500" />
                        Risk Zones Management
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">Monitor and manage high-risk patrol areas</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-5 gap-4">
                <div className="p-4 rounded-xl bg-gray-900 border border-gray-800">
                    <div className="flex items-center gap-2 mb-2">
                        <MapPin className="w-4 h-4 text-blue-400" />
                        <span className="text-xs font-medium text-gray-400">TOTAL ZONES</span>
                    </div>
                    <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <div className="p-4 rounded-xl bg-gray-900 border border-rose-500/30">
                    <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-4 h-4 text-rose-500" />
                        <span className="text-xs font-medium text-gray-400">CRITICAL</span>
                    </div>
                    <p className="text-2xl font-bold text-rose-500">{stats.critical}</p>
                </div>
                <div className="p-4 rounded-xl bg-gray-900 border border-orange-500/30">
                    <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-4 h-4 text-orange-500" />
                        <span className="text-xs font-medium text-gray-400">HIGH</span>
                    </div>
                    <p className="text-2xl font-bold text-orange-500">{stats.high}</p>
                </div>
                <div className="p-4 rounded-xl bg-gray-900 border border-amber-500/30">
                    <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                        <span className="text-xs font-medium text-gray-400">MEDIUM</span>
                    </div>
                    <p className="text-2xl font-bold text-amber-500">{stats.medium}</p>
                </div>
                <div className="p-4 rounded-xl bg-gray-900 border border-emerald-500/30">
                    <div className="flex items-center gap-2 mb-2">
                        <Shield className="w-4 h-4 text-emerald-500" />
                        <span className="text-xs font-medium text-gray-400">LOW</span>
                    </div>
                    <p className="text-2xl font-bold text-emerald-500">{stats.low}</p>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 bg-gray-900 p-1 rounded-lg w-fit">
                {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((level) => (
                    <button
                        key={level}
                        onClick={() => setFilter(level as any)}
                        className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${filter === level
                            ? 'bg-gray-700 text-white shadow'
                            : 'text-gray-400 hover:text-white'
                            }`}
                    >
                        {level}
                    </button>
                ))}
            </div>

            {/* Risk Zones List */}
            <div className="grid gap-4">
                {isLoading ? (
                    <div className="p-12 text-center text-gray-500">
                        <Loader className="w-8 h-8 animate-spin mx-auto mb-2" />
                        Loading risk zones...
                    </div>
                ) : filteredZones.length === 0 ? (
                    <div className="p-12 text-center text-gray-500 bg-gray-900/50 rounded-xl border border-dashed border-gray-800">
                        <Shield className="w-12 h-12 mx-auto mb-2 opacity-20" />
                        No risk zones found
                    </div>
                ) : (
                    filteredZones.map((zone) => {
                        const checkInCount = getCheckInCount(zone.id);
                        const progress = zone.requiredCheckIns > 0
                            ? Math.min((checkInCount / zone.requiredCheckIns) * 100, 100)
                            : 0;

                        return (
                            <div
                                key={zone.id}
                                className={`p-5 rounded-xl bg-gray-900 border ${getRiskColor(zone.riskLevel)} transition hover:border-opacity-50`}
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 space-y-2">
                                        <div className="flex items-center gap-3">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${getRiskColor(zone.riskLevel)}`}>
                                                {zone.riskLevel}
                                            </span>
                                            <span className="text-gray-500 text-xs flex items-center gap-1">
                                                <MapPin className="w-3 h-3" />
                                                {zone.station?.name || 'Unknown Station'}
                                            </span>
                                        </div>

                                        <h3 className="font-bold text-lg text-white">{zone.name}</h3>
                                        <p className="text-gray-400 text-sm">{zone.description}</p>

                                        {/* Check-in Progress */}
                                        <div className="mt-4 pt-4 border-t border-gray-800">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                                    <CheckCircle className="w-3 h-3" />
                                                    Today's Check-ins
                                                </span>
                                                <span className="text-xs font-bold text-white">
                                                    {checkInCount} / {zone.requiredCheckIns}
                                                </span>
                                            </div>
                                            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full transition-all duration-500 ${progress >= 100 ? 'bg-emerald-500' :
                                                        progress >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                                                        }`}
                                                    style={{ width: `${progress}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        <p className="text-xs text-gray-500 mb-1">Radius</p>
                                        <p className="text-lg font-bold text-white">{zone.radius}m</p>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
