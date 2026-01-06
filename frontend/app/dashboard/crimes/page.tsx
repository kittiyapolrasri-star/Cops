'use client';

import { useState, useEffect } from 'react';
import { crimeApi, organizationApi } from '@/lib/api';
import {
    Flame,
    Plus,
    Search,
    Calendar,
    MapPin,
    Check,
    XCircle,
    Eye,
    Filter,
    TrendingUp,
    BarChart3,
    Clock,
} from 'lucide-react';
import CrimeClock from '@/components/CrimeClock';

// Crime type config
const crimeTypeConfig: Record<string, { label: string; color: string; emoji: string }> = {
    THEFT: { label: 'ลักทรัพย์', color: 'yellow', emoji: '🛍️' },
    ROBBERY: { label: 'ชิงทรัพย์', color: 'red', emoji: '💰' },
    BURGLARY: { label: 'งัดแงะ', color: 'orange', emoji: '🔓' },
    ASSAULT: { label: 'ทำร้ายร่างกาย', color: 'pink', emoji: '🤕' },
    DRUG_OFFENSE: { label: 'ยาเสพติด', color: 'purple', emoji: '💊' },
    TRAFFIC_ACCIDENT: { label: 'อุบัติเหตุจราจร', color: 'blue', emoji: '🚗' },
    FRAUD: { label: 'ฉ้อโกง', color: 'indigo', emoji: '📋' },
    MURDER: { label: 'ฆาตกรรม', color: 'red', emoji: '⚠️' },
    SEXUAL_ASSAULT: { label: 'ความผิดทางเพศ', color: 'pink', emoji: '🚨' },
    ARSON: { label: 'วางเพลิง', color: 'orange', emoji: '🔥' },
    OTHER: { label: 'อื่นๆ', color: 'gray', emoji: '📍' },
};

const crimeSourceConfig: Record<string, { label: string; color: string }> = {
    HOTLINE_191: { label: 'สายด่วน 191', color: 'red' },
    INVESTIGATION: { label: 'ห้องสืบสวน', color: 'blue' },
    PATROL_REPORT: { label: 'รายงานสายตรวจ', color: 'green' },
    CITIZEN_TIP: { label: 'เบาะแสประชาชน', color: 'purple' },
};

interface CrimeRecord {
    id: string;
    caseNumber?: string;
    type: string;
    source: string;
    latitude: number;
    longitude: number;
    address?: string;
    description?: string;
    occurredAt: string;
    suspectInfo?: string;
    victimCount?: number;
    damageValue?: number;
    isResolved: boolean;
    station?: { id: string; name: string };
    reportedBy?: { firstName: string; lastName: string; rank?: string };
    createdAt: string;
}

const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('th-TH', {
        day: 'numeric',
        month: 'short',
        year: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    });
};

export default function CrimesPage() {
    const [crimes, setCrimes] = useState<CrimeRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedType, setSelectedType] = useState('');
    const [selectedSource, setSelectedSource] = useState('');
    const [showResolved, setShowResolved] = useState<boolean | undefined>(undefined);
    const [stations, setStations] = useState<any[]>([]);
    const [selectedStation, setSelectedStation] = useState('');
    const [stats, setStats] = useState<any>(null);

    const fetchCrimes = async () => {
        try {
            setLoading(true);
            const params: any = {};
            if (selectedStation) params.stationId = selectedStation;
            if (selectedType) params.type = selectedType;
            if (selectedSource) params.source = selectedSource;
            if (showResolved !== undefined) params.isResolved = showResolved;

            const [crimesRes, statsRes] = await Promise.all([
                crimeApi.getAll(params),
                crimeApi.getStats(selectedStation || undefined),
            ]);

            setCrimes(crimesRes.data || []);
            setStats(statsRes.data);
        } catch (error) {
            console.error('Failed to fetch crimes', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStations = async () => {
        try {
            const res = await organizationApi.getStations();
            setStations(res.data || []);
        } catch (error) {
            console.error('Failed to fetch stations', error);
        }
    };

    useEffect(() => {
        fetchStations();
    }, []);

    useEffect(() => {
        fetchCrimes();
    }, [selectedStation, selectedType, selectedSource, showResolved]);

    const handleResolve = async (id: string) => {
        if (!confirm('ยืนยันว่าคดีนี้ดำเนินการเสร็จสิ้นแล้ว?')) return;
        try {
            await crimeApi.resolve(id);
            fetchCrimes();
        } catch (error) {
            console.error('Failed to resolve', error);
        }
    };

    const filteredCrimes = crimes.filter(crime =>
        crime.caseNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        crime.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        crime.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        crime.station?.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gray-900 p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Flame className="w-6 h-6 text-orange-400" />
                        Crime Mapping
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">
                        Layer 3: บันทึกและวิเคราะห์เหตุอาชญากรรม
                    </p>
                </div>
            </div>

            {/* Stats */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
                    <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                        <p className="text-gray-400 text-xs">ทั้งหมด (3 เดือน)</p>
                        <p className="text-2xl font-bold text-white">{stats.total}</p>
                    </div>
                    <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                        <p className="text-gray-400 text-xs flex items-center gap-1">
                            <Check className="w-3 h-3 text-emerald-400" />
                            ดำเนินการแล้ว
                        </p>
                        <p className="text-2xl font-bold text-emerald-400">{stats.resolved}</p>
                    </div>
                    <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                        <p className="text-gray-400 text-xs flex items-center gap-1">
                            <XCircle className="w-3 h-3 text-red-400" />
                            รอดำเนินการ
                        </p>
                        <p className="text-2xl font-bold text-red-400">{stats.unresolved}</p>
                    </div>
                    <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                        <p className="text-gray-400 text-xs flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            อัตราแก้ไข
                        </p>
                        <p className="text-2xl font-bold text-sky-400">{stats.resolutionRate}%</p>
                    </div>
                    {/* Top crimes by type */}
                    {Object.entries(stats.byType || {}).slice(0, 2).map(([type, count]) => (
                        <div key={type} className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                            <p className="text-gray-400 text-xs flex items-center gap-1">
                                <span>{crimeTypeConfig[type]?.emoji || '📍'}</span>
                                {crimeTypeConfig[type]?.label || type}
                            </p>
                            <p className="text-2xl font-bold text-white">{count as number}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Crime Clock */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <CrimeClock stationId={selectedStation || undefined} months={6} />
                <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                    <div className="flex items-center gap-2 mb-4">
                        <Clock className="w-5 h-5 text-orange-400" />
                        <h3 className="font-bold text-white">Crime Insights</h3>
                    </div>
                    <div className="space-y-3 text-sm text-gray-400">
                        <p>• ใช้ข้อมูลนาฬิกาอาชญากรรมเพื่อวางแผนสายตรวจ</p>
                        <p>• เพิ่มการลาดตระเวนในช่วงเวลาที่เกิดเหตุบ่อย</p>
                        <p>• ประเมินความเสี่ยงตามวันในสัปดาห์</p>
                        <p>• เชื่อมโยงกับแผนการตรวจ (Layer 4)</p>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4 mb-6">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                        type="text"
                        placeholder="ค้นหาเลขคดี, ที่อยู่..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
                    />
                </div>

                <select
                    value={selectedStation}
                    onChange={(e) => setSelectedStation(e.target.value)}
                    className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-orange-500"
                >
                    <option value="">ทุกสถานี</option>
                    {stations.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                </select>

                <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-orange-500"
                >
                    <option value="">ทุกประเภท</option>
                    {Object.entries(crimeTypeConfig).map(([key, config]) => (
                        <option key={key} value={key}>{config.emoji} {config.label}</option>
                    ))}
                </select>

                <select
                    value={selectedSource}
                    onChange={(e) => setSelectedSource(e.target.value)}
                    className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-orange-500"
                >
                    <option value="">ทุกแหล่งข้อมูล</option>
                    {Object.entries(crimeSourceConfig).map(([key, config]) => (
                        <option key={key} value={key}>{config.label}</option>
                    ))}
                </select>

                <select
                    value={showResolved === undefined ? '' : showResolved.toString()}
                    onChange={(e) => setShowResolved(e.target.value === '' ? undefined : e.target.value === 'true')}
                    className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-orange-500"
                >
                    <option value="">ทุกสถานะ</option>
                    <option value="false">รอดำเนินการ</option>
                    <option value="true">ดำเนินการแล้ว</option>
                </select>
            </div>

            {/* Table */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center">
                        <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                        <p className="text-gray-400">กำลังโหลด...</p>
                    </div>
                ) : filteredCrimes.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        <Flame className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>ไม่พบข้อมูล</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-900/50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">ประเภท</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">เลขคดี</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">เกิดเหตุ</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">ที่อยู่</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">แหล่งข้อมูล</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">สถานี</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">สถานะ</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">จัดการ</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700">
                                {filteredCrimes.map((crime) => {
                                    const typeConfig = crimeTypeConfig[crime.type] || crimeTypeConfig.OTHER;
                                    const sourceConfig = crimeSourceConfig[crime.source] || { label: crime.source, color: 'gray' };

                                    return (
                                        <tr key={crime.id} className="hover:bg-gray-700/50 transition">
                                            <td className="px-4 py-3">
                                                <span className="text-xl" title={typeConfig.label}>{typeConfig.emoji}</span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <p className="text-white font-mono text-sm">{crime.caseNumber || '-'}</p>
                                            </td>
                                            <td className="px-4 py-3 text-gray-300 text-sm">
                                                {formatDate(crime.occurredAt)}
                                            </td>
                                            <td className="px-4 py-3 text-gray-400 text-sm max-w-[200px] truncate">
                                                {crime.address || '-'}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium bg-${sourceConfig.color}-500/20 text-${sourceConfig.color}-400`}>
                                                    {sourceConfig.label}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-gray-400 text-sm">
                                                {crime.station?.name || '-'}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${crime.isResolved ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                                                    {crime.isResolved ? 'ดำเนินการแล้ว' : 'รอดำเนินการ'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                {!crime.isResolved && (
                                                    <button
                                                        onClick={() => handleResolve(crime.id)}
                                                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs rounded transition"
                                                    >
                                                        ปิดคดี
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
