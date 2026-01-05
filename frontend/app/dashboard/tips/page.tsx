'use client';

import { useState, useEffect } from 'react';
import { citizenTipApi, organizationApi, userApi } from '@/lib/api';
import {
    MessageCircle,
    Search,
    Eye,
    User,
    Clock,
    MapPin,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    ChevronDown,
    ChevronRight,
    Phone,
    Mail,
} from 'lucide-react';

// Category config
const categoryConfig: Record<string, { label: string; emoji: string; color: string }> = {
    DRUG_ACTIVITY: { label: 'กิจกรรมยาเสพติด', emoji: '💊', color: 'purple' },
    SUSPICIOUS_PERSON: { label: 'บุคคลต้องสงสัย', emoji: '🕵️', color: 'orange' },
    ILLEGAL_GAMBLING: { label: 'การพนัน', emoji: '🎰', color: 'yellow' },
    NOISE_COMPLAINT: { label: 'เสียงรบกวน', emoji: '📢', color: 'blue' },
    TRAFFIC_HAZARD: { label: 'อันตรายจราจร', emoji: '🚧', color: 'red' },
    THEFT_CONCERN: { label: 'ความเสี่ยงลักทรัพย์', emoji: '🔓', color: 'pink' },
    VIOLENCE: { label: 'ความรุนแรง', emoji: '⚠️', color: 'red' },
    ILLEGAL_BUSINESS: { label: 'ธุรกิจผิดกฎหมาย', emoji: '🏭', color: 'gray' },
    MISSING_PERSON: { label: 'บุคคลสูญหาย', emoji: '🔍', color: 'indigo' },
    OTHER: { label: 'อื่นๆ', emoji: '📝', color: 'gray' },
};

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
    PENDING: { label: 'รอตรวจสอบ', color: 'text-amber-400', bgColor: 'bg-amber-500/20' },
    VERIFIED: { label: 'ยืนยันแล้ว', color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
    INVESTIGATING: { label: 'กำลังสืบสวน', color: 'text-purple-400', bgColor: 'bg-purple-500/20' },
    ACTIONABLE: { label: 'นำไปใช้ได้', color: 'text-sky-400', bgColor: 'bg-sky-500/20' },
    RESOLVED: { label: 'ดำเนินการแล้ว', color: 'text-emerald-400', bgColor: 'bg-emerald-500/20' },
    DISMISSED: { label: 'ยกเลิก', color: 'text-gray-400', bgColor: 'bg-gray-500/20' },
};

const priorityConfig: Record<number, { label: string; color: string }> = {
    0: { label: 'ปกติ', color: 'gray' },
    1: { label: 'สูง', color: 'orange' },
    2: { label: 'ด่วน', color: 'red' },
};

interface CitizenTip {
    id: string;
    tipCode: string;
    category: string;
    status: string;
    latitude?: number;
    longitude?: number;
    address?: string;
    description: string;
    photos: string[];
    contactPhone?: string;
    contactEmail?: string;
    isAnonymous: boolean;
    priority: number;
    station?: { id: string; name: string };
    assignedTo?: { id: string; firstName: string; lastName: string; rank?: string };
    actionNote?: string;
    createdAt: string;
    updatedAt: string;
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

export default function TipsPage() {
    const [tips, setTips] = useState<CitizenTip[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');
    const [stations, setStations] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [selectedStation, setSelectedStation] = useState('');
    const [expandedTip, setExpandedTip] = useState<string | null>(null);
    const [stats, setStats] = useState<any>(null);

    const fetchTips = async () => {
        try {
            setLoading(true);
            const params: any = {};
            if (selectedStation) params.stationId = selectedStation;
            if (selectedCategory) params.category = selectedCategory;
            if (selectedStatus) params.status = selectedStatus;

            const [tipsRes, statsRes] = await Promise.all([
                citizenTipApi.getAll(params),
                citizenTipApi.getStats(selectedStation || undefined),
            ]);

            setTips(tipsRes.data || []);
            setStats(statsRes.data);
        } catch (error) {
            console.error('Failed to fetch tips', error);
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

    const fetchUsers = async () => {
        try {
            const res = await userApi.getAll();
            setUsers(res.data || []);
        } catch (error) {
            console.error('Failed to fetch users', error);
        }
    };

    useEffect(() => {
        fetchStations();
        fetchUsers();
    }, []);

    useEffect(() => {
        fetchTips();
    }, [selectedStation, selectedCategory, selectedStatus]);

    const handleStatusChange = async (id: string, newStatus: string) => {
        try {
            await citizenTipApi.updateStatus(id, newStatus);
            fetchTips();
        } catch (error) {
            console.error('Failed to update status', error);
        }
    };

    const handleAssign = async (id: string, userId: string) => {
        try {
            await citizenTipApi.assign(id, userId);
            fetchTips();
        } catch (error) {
            console.error('Failed to assign', error);
        }
    };

    const toggleExpand = (id: string) => {
        setExpandedTip(expandedTip === id ? null : id);
    };

    const filteredTips = tips.filter(tip =>
        tip.tipCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tip.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tip.address?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gray-900 p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <MessageCircle className="w-6 h-6 text-purple-400" />
                        เบาะแสจากประชาชน
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">
                        Layer 7: รับและจัดการเบาะแสจากประชาชน
                    </p>
                </div>
            </div>

            {/* Stats */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-6">
                    <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                        <p className="text-gray-400 text-xs">ทั้งหมด</p>
                        <p className="text-2xl font-bold text-white">{stats.total}</p>
                    </div>
                    <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                        <p className="text-gray-400 text-xs flex items-center gap-1">
                            <Clock className="w-3 h-3 text-amber-400" />
                            รอตรวจสอบ
                        </p>
                        <p className="text-2xl font-bold text-amber-400">{stats.pending}</p>
                    </div>
                    <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                        <p className="text-gray-400 text-xs flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-red-400" />
                            ด่วน
                        </p>
                        <p className="text-2xl font-bold text-red-400">{stats.urgent}</p>
                    </div>
                    {Object.entries(stats.byStatus || {}).slice(0, 2).map(([status, count]) => (
                        <div key={status} className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                            <p className={`text-gray-400 text-xs ${statusConfig[status]?.color || ''}`}>
                                {statusConfig[status]?.label || status}
                            </p>
                            <p className="text-2xl font-bold text-white">{count as number}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Filters */}
            <div className="flex flex-wrap gap-4 mb-6">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                        type="text"
                        placeholder="ค้นหารหัส, คำอธิบาย..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                    />
                </div>

                <select
                    value={selectedStation}
                    onChange={(e) => setSelectedStation(e.target.value)}
                    className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                >
                    <option value="">ทุกสถานี</option>
                    {stations.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                </select>

                <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                >
                    <option value="">ทุกหมวดหมู่</option>
                    {Object.entries(categoryConfig).map(([key, config]) => (
                        <option key={key} value={key}>{config.emoji} {config.label}</option>
                    ))}
                </select>

                <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                >
                    <option value="">ทุกสถานะ</option>
                    {Object.entries(statusConfig).map(([key, config]) => (
                        <option key={key} value={key}>{config.label}</option>
                    ))}
                </select>
            </div>

            {/* List */}
            <div className="space-y-4">
                {loading ? (
                    <div className="bg-gray-800 rounded-xl p-8 text-center border border-gray-700">
                        <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                        <p className="text-gray-400">กำลังโหลด...</p>
                    </div>
                ) : filteredTips.length === 0 ? (
                    <div className="bg-gray-800 rounded-xl p-8 text-center border border-gray-700">
                        <MessageCircle className="w-12 h-12 mx-auto mb-2 text-gray-600" />
                        <p className="text-gray-500">ไม่พบเบาะแส</p>
                    </div>
                ) : (
                    filteredTips.map((tip) => {
                        const cat = categoryConfig[tip.category] || categoryConfig.OTHER;
                        const status = statusConfig[tip.status] || statusConfig.PENDING;
                        const priority = priorityConfig[tip.priority] || priorityConfig[0];

                        return (
                            <div
                                key={tip.id}
                                className={`bg-gray-800 rounded-xl border ${tip.priority === 2 ? 'border-red-500/50' : 'border-gray-700'} overflow-hidden`}
                            >
                                {/* Tip Header */}
                                <div
                                    className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-gray-700/30 transition"
                                    onClick={() => toggleExpand(tip.id)}
                                >
                                    <div className="flex items-center gap-4">
                                        <span className="text-2xl">{cat.emoji}</span>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono text-white text-sm">{tip.tipCode.slice(0, 8)}...</span>
                                                {tip.priority > 0 && (
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-medium bg-${priority.color}-500/20 text-${priority.color}-400`}>
                                                        {priority.label}
                                                    </span>
                                                )}
                                                {tip.isAnonymous && (
                                                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-gray-600 text-gray-300">
                                                        ไม่ระบุตัวตน
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-400 mt-1 line-clamp-1">
                                                {tip.description}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.bgColor} ${status.color}`}>
                                            {status.label}
                                        </span>
                                        <span className="text-gray-500 text-sm">
                                            {formatDate(tip.createdAt)}
                                        </span>
                                        {expandedTip === tip.id ? (
                                            <ChevronDown className="w-5 h-5 text-gray-500" />
                                        ) : (
                                            <ChevronRight className="w-5 h-5 text-gray-500" />
                                        )}
                                    </div>
                                </div>

                                {/* Expanded Content */}
                                {expandedTip === tip.id && (
                                    <div className="px-5 pb-5 border-t border-gray-700 pt-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {/* Details */}
                                            <div className="space-y-3">
                                                <div>
                                                    <p className="text-xs text-gray-500 mb-1">รายละเอียด</p>
                                                    <p className="text-gray-300 text-sm">{tip.description}</p>
                                                </div>
                                                {tip.address && (
                                                    <div>
                                                        <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                                                            <MapPin className="w-3 h-3" /> ที่อยู่
                                                        </p>
                                                        <p className="text-gray-300 text-sm">{tip.address}</p>
                                                    </div>
                                                )}
                                                {!tip.isAnonymous && (tip.contactPhone || tip.contactEmail) && (
                                                    <div>
                                                        <p className="text-xs text-gray-500 mb-1">ติดต่อกลับ</p>
                                                        <div className="flex gap-4">
                                                            {tip.contactPhone && (
                                                                <span className="text-sm text-gray-300 flex items-center gap-1">
                                                                    <Phone className="w-3 h-3" /> {tip.contactPhone}
                                                                </span>
                                                            )}
                                                            {tip.contactEmail && (
                                                                <span className="text-sm text-gray-300 flex items-center gap-1">
                                                                    <Mail className="w-3 h-3" /> {tip.contactEmail}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                                {tip.actionNote && (
                                                    <div>
                                                        <p className="text-xs text-gray-500 mb-1">หมายเหตุการดำเนินการ</p>
                                                        <p className="text-emerald-400 text-sm">{tip.actionNote}</p>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Actions */}
                                            <div className="space-y-4">
                                                <div>
                                                    <p className="text-xs text-gray-500 mb-2">อัปเดตสถานะ</p>
                                                    <select
                                                        value={tip.status}
                                                        onChange={(e) => handleStatusChange(tip.id, e.target.value)}
                                                        className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
                                                    >
                                                        {Object.entries(statusConfig).map(([key, config]) => (
                                                            <option key={key} value={key}>{config.label}</option>
                                                        ))}
                                                    </select>
                                                </div>

                                                <div>
                                                    <p className="text-xs text-gray-500 mb-2">มอบหมายให้</p>
                                                    <select
                                                        value={tip.assignedTo?.id || ''}
                                                        onChange={(e) => handleAssign(tip.id, e.target.value)}
                                                        className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
                                                    >
                                                        <option value="">-- เลือกผู้รับผิดชอบ --</option>
                                                        {users.map(u => (
                                                            <option key={u.id} value={u.id}>
                                                                {u.rank} {u.firstName} {u.lastName}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    {tip.assignedTo && (
                                                        <p className="text-xs text-emerald-400 mt-1">
                                                            ปัจจุบัน: {tip.assignedTo.rank} {tip.assignedTo.firstName}
                                                        </p>
                                                    )}
                                                </div>

                                                {tip.photos?.length > 0 && (
                                                    <div>
                                                        <p className="text-xs text-gray-500 mb-2">รูปภาพ ({tip.photos.length})</p>
                                                        <div className="flex gap-2 flex-wrap">
                                                            {tip.photos.map((photo, idx) => (
                                                                <img
                                                                    key={idx}
                                                                    src={photo}
                                                                    alt={`Photo ${idx + 1}`}
                                                                    className="w-16 h-16 object-cover rounded border border-gray-600"
                                                                />
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Meta */}
                                        <div className="mt-4 pt-4 border-t border-gray-700 flex items-center justify-between text-xs text-gray-500">
                                            <span>หมวดหมู่: {cat.label}</span>
                                            <span>สถานี: {tip.station?.name || 'ยังไม่ระบุ'}</span>
                                            <span>รหัส: {tip.tipCode}</span>
                                        </div>
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
