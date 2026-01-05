'use client';

import { useEffect, useState } from 'react';
import { sosApi, organizationApi, userApi } from '@/lib/api';
import { AlertTriangle, Clock, User, Phone, MapPin, CheckCircle2, XCircle, ChevronDown, Search, Siren, Radio } from 'lucide-react';

interface SOSAlert {
    id: string;
    type: string;
    status: string;
    latitude: number;
    longitude: number;
    address?: string;
    message?: string;
    createdAt: string;
    respondedAt?: string;
    resolvedAt?: string;
    resolutionNote?: string;
    user: {
        id: string;
        firstName: string;
        lastName: string;
        rank?: string;
        phone?: string;
    };
    station?: { id: string; name: string };
    respondedBy?: { id: string; firstName: string; lastName: string; rank?: string };
    responses?: any[];
}

const sosTypeConfig: Record<string, { label: string; color: string; emoji: string }> = {
    EMERGENCY: { label: 'ฉุกเฉินทั่วไป', color: '#ef4444', emoji: '🚨' },
    UNDER_ATTACK: { label: 'ถูกโจมตี', color: '#dc2626', emoji: '⚠️' },
    NEED_BACKUP: { label: 'ต้องการกำลังเสริม', color: '#f97316', emoji: '🆘' },
    MEDICAL: { label: 'เหตุทางการแพทย์', color: '#22c55e', emoji: '🏥' },
    VEHICLE_BREAKDOWN: { label: 'รถเสีย', color: '#eab308', emoji: '🚗' },
    SUSPECT_PURSUIT: { label: 'ไล่ล่าผู้ต้องสงสัย', color: '#8b5cf6', emoji: '🏃' },
};

const sosStatusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
    ACTIVE: { label: 'กำลังแจ้งเหตุ', color: '#ef4444', bgColor: 'bg-red-500/20' },
    RESPONDING: { label: 'กำลังตอบรับ', color: '#f97316', bgColor: 'bg-orange-500/20' },
    RESOLVED: { label: 'แก้ไขแล้ว', color: '#22c55e', bgColor: 'bg-green-500/20' },
    FALSE_ALARM: { label: 'แจ้งเหตุผิดพลาด', color: '#6b7280', bgColor: 'bg-gray-500/20' },
    CANCELLED: { label: 'ยกเลิก', color: '#6b7280', bgColor: 'bg-gray-500/20' },
};

export default function SOSPage() {
    const [alerts, setAlerts] = useState<SOSAlert[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [stations, setStations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedStation, setSelectedStation] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');
    const [selectedType, setSelectedType] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedId, setExpandedId] = useState<string | null>(null);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 10000); // Auto-refresh every 10s
        return () => clearInterval(interval);
    }, [selectedStation, selectedStatus, selectedType]);

    const fetchData = async () => {
        try {
            const [alertsRes, statsRes, stationsRes] = await Promise.all([
                sosApi.getAll({
                    stationId: selectedStation || undefined,
                    status: selectedStatus || undefined,
                    type: selectedType || undefined
                }),
                sosApi.getStats(selectedStation || undefined),
                organizationApi.getStations(),
            ]);

            if (alertsRes.data) setAlerts(alertsRes.data);
            if (statsRes.data) setStats(statsRes.data);
            if (stationsRes.data) setStations(stationsRes.data);
        } catch (error) {
            console.error('Failed to fetch SOS data', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRespond = async (alertId: string) => {
        try {
            await sosApi.respond(alertId, { message: 'กำลังเดินทางไป' });
            fetchData();
        } catch (error) {
            console.error('Failed to respond', error);
        }
    };

    const handleResolve = async (alertId: string) => {
        const note = prompt('บันทึกการแก้ไข:');
        if (note !== null) {
            try {
                await sosApi.resolve(alertId, note);
                fetchData();
            } catch (error) {
                console.error('Failed to resolve', error);
            }
        }
    };

    const handleMarkFalseAlarm = async (alertId: string) => {
        try {
            await sosApi.markFalseAlarm(alertId, 'แจ้งเหตุผิดพลาด');
            fetchData();
        } catch (error) {
            console.error('Failed to mark false alarm', error);
        }
    };

    const filteredAlerts = alerts.filter(alert => {
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            if (!alert.user?.firstName?.toLowerCase().includes(q) &&
                !alert.user?.lastName?.toLowerCase().includes(q) &&
                !alert.address?.toLowerCase().includes(q) &&
                !alert.message?.toLowerCase().includes(q)) {
                return false;
            }
        }
        return true;
    });

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: '2-digit' });
    };

    if (loading) {
        return (
            <div className="p-6 flex items-center justify-center h-64">
                <div className="animate-spin w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Siren className="w-7 h-7 text-red-500" />
                        SOS Emergency
                    </h1>
                    <p className="text-gray-400 text-sm">ระบบแจ้งเหตุฉุกเฉิน</p>
                </div>
            </div>

            {/* Stats */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-red-500/20 to-red-600/10 border border-red-500/30 rounded-xl p-4">
                        <p className="text-red-400 text-sm">Active Alerts</p>
                        <p className="text-3xl font-bold text-white">{stats.active || 0}</p>
                    </div>
                    <div className="bg-gradient-to-br from-green-500/20 to-green-600/10 border border-green-500/30 rounded-xl p-4">
                        <p className="text-green-400 text-sm">Resolved</p>
                        <p className="text-3xl font-bold text-white">{stats.resolved || 0}</p>
                    </div>
                    <div className="bg-gradient-to-br from-gray-500/20 to-gray-600/10 border border-gray-500/30 rounded-xl p-4">
                        <p className="text-gray-400 text-sm">Total</p>
                        <p className="text-3xl font-bold text-white">{stats.total || 0}</p>
                    </div>
                    <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/30 rounded-xl p-4">
                        <p className="text-blue-400 text-sm">Avg Response</p>
                        <p className="text-3xl font-bold text-white">{stats.avgResponseTimeMinutes || 0} <span className="text-sm">min</span></p>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="flex flex-wrap gap-3 items-center">
                <div className="relative flex-1 max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                        type="text"
                        placeholder="ค้นหาชื่อ, ที่อยู่..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
                    />
                </div>

                <select
                    value={selectedStation}
                    onChange={(e) => setSelectedStation(e.target.value)}
                    className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
                >
                    <option value="">ทุกสถานี</option>
                    {stations.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                </select>

                <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
                >
                    <option value="">ทุกสถานะ</option>
                    {Object.entries(sosStatusConfig).map(([key, config]) => (
                        <option key={key} value={key}>{config.label}</option>
                    ))}
                </select>

                <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
                >
                    <option value="">ทุกประเภท</option>
                    {Object.entries(sosTypeConfig).map(([key, config]) => (
                        <option key={key} value={key}>{config.emoji} {config.label}</option>
                    ))}
                </select>
            </div>

            {/* Alerts List */}
            <div className="space-y-3">
                {filteredAlerts.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        <Siren className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p>ไม่มี SOS Alert</p>
                    </div>
                ) : (
                    filteredAlerts.map((alert) => {
                        const typeConfig = sosTypeConfig[alert.type] || sosTypeConfig.EMERGENCY;
                        const statusConfig = sosStatusConfig[alert.status] || sosStatusConfig.ACTIVE;
                        const isExpanded = expandedId === alert.id;
                        const isActive = alert.status === 'ACTIVE' || alert.status === 'RESPONDING';

                        return (
                            <div
                                key={alert.id}
                                className={`bg-gray-800 border rounded-xl overflow-hidden transition-all ${isActive ? 'border-red-500/50 shadow-lg shadow-red-500/20' : 'border-gray-700'}`}
                            >
                                {/* Card Header */}
                                <div
                                    className={`px-4 py-3 flex items-center justify-between cursor-pointer ${isActive ? 'bg-red-500/10' : ''}`}
                                    onClick={() => setExpandedId(isExpanded ? null : alert.id)}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="text-2xl">{typeConfig.emoji}</div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-white">
                                                    {alert.user?.rank} {alert.user?.firstName} {alert.user?.lastName}
                                                </span>
                                                <span className={`text-xs px-2 py-0.5 rounded-full ${statusConfig.bgColor}`} style={{ color: statusConfig.color }}>
                                                    {statusConfig.label}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-gray-400">
                                                <span>{typeConfig.label}</span>
                                                <span>•</span>
                                                <span>{formatDate(alert.createdAt)} {formatTime(alert.createdAt)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {isActive && (
                                            <>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleRespond(alert.id); }}
                                                    className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-xs rounded-lg transition"
                                                >
                                                    ตอบรับ
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleResolve(alert.id); }}
                                                    className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white text-xs rounded-lg transition"
                                                >
                                                    แก้ไขแล้ว
                                                </button>
                                            </>
                                        )}
                                        <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                    </div>
                                </div>

                                {/* Expanded Details */}
                                {isExpanded && (
                                    <div className="border-t border-gray-700 px-4 py-4 space-y-3">
                                        {alert.message && (
                                            <p className="text-gray-300 text-sm">{alert.message}</p>
                                        )}

                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <p className="text-gray-500">ที่อยู่</p>
                                                <p className="text-white flex items-center gap-1">
                                                    <MapPin className="w-4 h-4 text-gray-500" />
                                                    {alert.address || `${alert.latitude?.toFixed(4)}, ${alert.longitude?.toFixed(4)}`}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500">โทรศัพท์</p>
                                                <p className="text-white flex items-center gap-1">
                                                    <Phone className="w-4 h-4 text-gray-500" />
                                                    {alert.user?.phone || '-'}
                                                </p>
                                            </div>
                                        </div>

                                        {alert.respondedBy && (
                                            <div className="bg-gray-700/50 rounded-lg p-3">
                                                <p className="text-xs text-gray-500 mb-1">ผู้ตอบรับ</p>
                                                <p className="text-white text-sm">
                                                    {alert.respondedBy.rank} {alert.respondedBy.firstName} {alert.respondedBy.lastName}
                                                </p>
                                                {alert.respondedAt && (
                                                    <p className="text-xs text-gray-400 mt-1">
                                                        ตอบรับเมื่อ {formatDate(alert.respondedAt)} {formatTime(alert.respondedAt)}
                                                    </p>
                                                )}
                                            </div>
                                        )}

                                        {alert.resolutionNote && (
                                            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                                                <p className="text-xs text-green-400 mb-1">บันทึกการแก้ไข</p>
                                                <p className="text-white text-sm">{alert.resolutionNote}</p>
                                            </div>
                                        )}

                                        {isActive && (
                                            <div className="flex gap-2 pt-2">
                                                <button
                                                    onClick={() => handleMarkFalseAlarm(alert.id)}
                                                    className="px-3 py-1 bg-gray-600 hover:bg-gray-500 text-white text-xs rounded-lg transition"
                                                >
                                                    แจ้งเหตุผิดพลาด
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
