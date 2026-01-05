'use client';

import { useState, useEffect } from 'react';
import { patrolPlanApi, organizationApi, userApi } from '@/lib/api';
import {
    ClipboardList,
    Plus,
    Search,
    Calendar,
    Clock,
    Users,
    MapPin,
    CheckCircle2,
    XCircle,
    Play,
    Pause,
    Edit,
    Trash2,
    Eye,
    ChevronDown,
    ChevronRight,
    Route,
} from 'lucide-react';
import AddPatrolPlanModal from '@/components/AddPatrolPlanModal';

interface PatrolPlan {
    id: string;
    name: string;
    description?: string;
    startTime: string;
    endTime: string;
    repeatDaily: boolean;
    isActive: boolean;
    station?: { id: string; name: string };
    createdBy?: { firstName: string; lastName: string; rank?: string };
    checkpoints: any[];
    assignments: any[];
    _count?: { checkpoints: number; assignments: number };
    createdAt: string;
}

const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
};

const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
};

export default function PatrolPlansPage() {
    const [plans, setPlans] = useState<PatrolPlan[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStation, setSelectedStation] = useState('');
    const [stations, setStations] = useState<any[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState<PatrolPlan | null>(null);
    const [expandedPlan, setExpandedPlan] = useState<string | null>(null);
    const [stats, setStats] = useState<any>(null);

    const fetchPlans = async () => {
        try {
            setLoading(true);
            const params: any = {};
            if (selectedStation) params.stationId = selectedStation;

            const [plansRes, statsRes] = await Promise.all([
                patrolPlanApi.getAll(params),
                patrolPlanApi.getStats(selectedStation || undefined),
            ]);

            setPlans(plansRes.data || []);
            setStats(statsRes.data);
        } catch (error) {
            console.error('Failed to fetch plans', error);
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
        fetchPlans();
    }, [selectedStation]);

    const handleDelete = async (id: string) => {
        if (!confirm('ต้องการลบแผนการตรวจนี้หรือไม่?')) return;

        try {
            await patrolPlanApi.delete(id);
            fetchPlans();
        } catch (error) {
            console.error('Failed to delete plan', error);
        }
    };

    const handleEdit = (plan: PatrolPlan) => {
        setEditingPlan(plan);
        setIsModalOpen(true);
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setEditingPlan(null);
    };

    const handleModalSuccess = () => {
        handleModalClose();
        fetchPlans();
    };

    const toggleExpand = (id: string) => {
        setExpandedPlan(expandedPlan === id ? null : id);
    };

    const filteredPlans = plans.filter(plan =>
        plan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        plan.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        plan.station?.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gray-900 p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <ClipboardList className="w-6 h-6 text-sky-400" />
                        แผนการตรวจ
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">
                        Layer 4: ออกแบบและมอบหมายแผนการตรวจ
                    </p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 bg-sky-600 hover:bg-sky-500 text-white px-4 py-2 rounded-lg transition"
                >
                    <Plus className="w-4 h-4" />
                    สร้างแผนใหม่
                </button>
            </div>

            {/* Stats */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                        <p className="text-gray-400 text-xs flex items-center gap-1">
                            <ClipboardList className="w-3 h-3" />
                            แผนทั้งหมด
                        </p>
                        <p className="text-2xl font-bold text-white">{stats.totalPlans}</p>
                    </div>
                    <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                        <p className="text-gray-400 text-xs flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            Checkpoints
                        </p>
                        <p className="text-2xl font-bold text-white">{stats.totalCheckpoints}</p>
                    </div>
                    <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                        <p className="text-gray-400 text-xs flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            มอบหมาย
                        </p>
                        <p className="text-2xl font-bold text-white">{stats.totalAssignments}</p>
                    </div>
                    <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                        <p className="text-gray-400 text-xs flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            เช็คอินวันนี้
                        </p>
                        <p className="text-2xl font-bold text-emerald-400">{stats.todayCompletions}</p>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="flex flex-wrap gap-4 mb-6">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                        type="text"
                        placeholder="ค้นหาแผน..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-sky-500"
                    />
                </div>

                <select
                    value={selectedStation}
                    onChange={(e) => setSelectedStation(e.target.value)}
                    className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-sky-500"
                >
                    <option value="">ทุกสถานี</option>
                    {stations.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                </select>
            </div>

            {/* Plans List */}
            <div className="space-y-4">
                {loading ? (
                    <div className="bg-gray-800 rounded-xl p-8 text-center border border-gray-700">
                        <div className="animate-spin w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                        <p className="text-gray-400">กำลังโหลด...</p>
                    </div>
                ) : filteredPlans.length === 0 ? (
                    <div className="bg-gray-800 rounded-xl p-8 text-center border border-gray-700">
                        <ClipboardList className="w-12 h-12 mx-auto mb-2 text-gray-600" />
                        <p className="text-gray-500">ไม่พบแผนการตรวจ</p>
                    </div>
                ) : (
                    filteredPlans.map((plan) => (
                        <div
                            key={plan.id}
                            className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden hover:border-gray-600 transition"
                        >
                            {/* Plan Header */}
                            <div
                                className="flex items-center justify-between px-5 py-4 cursor-pointer"
                                onClick={() => toggleExpand(plan.id)}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`p-2 rounded-lg ${plan.isActive ? 'bg-sky-500/20' : 'bg-gray-700'}`}>
                                        <Route className={`w-5 h-5 ${plan.isActive ? 'text-sky-400' : 'text-gray-500'}`} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white flex items-center gap-2">
                                            {plan.name}
                                            {plan.repeatDaily && (
                                                <span className="text-[10px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full">
                                                    ทุกวัน
                                                </span>
                                            )}
                                        </h3>
                                        <p className="text-sm text-gray-400 flex items-center gap-3">
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {formatTime(plan.startTime)} - {formatTime(plan.endTime)}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <MapPin className="w-3 h-3" />
                                                {plan._count?.checkpoints || plan.checkpoints?.length || 0} จุด
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Users className="w-3 h-3" />
                                                {plan._count?.assignments || plan.assignments?.length || 0} คน
                                            </span>
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${plan.isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-700 text-gray-500'}`}>
                                        {plan.isActive ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                                    </span>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleEdit(plan); }}
                                            className="p-1.5 hover:bg-gray-600 rounded text-gray-400 hover:text-white transition"
                                            title="แก้ไข"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDelete(plan.id); }}
                                            className="p-1.5 hover:bg-red-500/20 rounded text-gray-400 hover:text-red-400 transition"
                                            title="ลบ"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                    {expandedPlan === plan.id ? (
                                        <ChevronDown className="w-5 h-5 text-gray-500" />
                                    ) : (
                                        <ChevronRight className="w-5 h-5 text-gray-500" />
                                    )}
                                </div>
                            </div>

                            {/* Expanded Content */}
                            {expandedPlan === plan.id && (
                                <div className="px-5 pb-4 border-t border-gray-700 pt-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Checkpoints */}
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
                                                <MapPin className="w-4 h-4" />
                                                จุดตรวจ ({plan.checkpoints?.length || 0})
                                            </h4>
                                            {plan.checkpoints?.length > 0 ? (
                                                <div className="space-y-2">
                                                    {plan.checkpoints.map((cp, index) => (
                                                        <div key={cp.id} className="flex items-center gap-3 bg-gray-900/50 rounded-lg px-3 py-2">
                                                            <span className="w-6 h-6 rounded-full bg-sky-500/20 text-sky-400 text-xs flex items-center justify-center font-bold">
                                                                {cp.sequence || index + 1}
                                                            </span>
                                                            <div className="flex-1">
                                                                <p className="text-sm text-white">{cp.name}</p>
                                                                {cp.expectedTime && (
                                                                    <p className="text-xs text-gray-500">
                                                                        คาดถึง: {formatTime(cp.expectedTime)}
                                                                    </p>
                                                                )}
                                                            </div>
                                                            {cp.poi && (
                                                                <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded">
                                                                    POI
                                                                </span>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-sm text-gray-500">ยังไม่มีจุดตรวจ</p>
                                            )}
                                        </div>

                                        {/* Assignments */}
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
                                                <Users className="w-4 h-4" />
                                                ผู้รับมอบหมาย ({plan.assignments?.length || 0})
                                            </h4>
                                            {plan.assignments?.length > 0 ? (
                                                <div className="space-y-2">
                                                    {plan.assignments.map((assignment) => (
                                                        <div key={assignment.id} className="flex items-center gap-3 bg-gray-900/50 rounded-lg px-3 py-2">
                                                            <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                                                                {assignment.user?.avatar ? (
                                                                    <img src={assignment.user.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                                                                ) : (
                                                                    <span className="text-xs text-gray-400">
                                                                        {assignment.user?.firstName?.charAt(0) || '?'}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="flex-1">
                                                                <p className="text-sm text-white">
                                                                    {assignment.user?.rank} {assignment.user?.firstName} {assignment.user?.lastName}
                                                                </p>
                                                                <p className="text-xs text-gray-500">
                                                                    {formatDate(assignment.scheduledDate)}
                                                                </p>
                                                            </div>
                                                            <span className={`text-xs px-2 py-0.5 rounded ${assignment.status === 'COMPLETED'
                                                                ? 'bg-emerald-500/20 text-emerald-400'
                                                                : assignment.status === 'IN_PROGRESS'
                                                                    ? 'bg-amber-500/20 text-amber-400'
                                                                    : 'bg-gray-700 text-gray-400'
                                                                }`}>
                                                                {assignment.status === 'COMPLETED' ? 'เสร็จสิ้น' :
                                                                    assignment.status === 'IN_PROGRESS' ? 'กำลังทำ' :
                                                                        assignment.status === 'MISSED' ? 'พลาด' : 'รอดำเนินการ'}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-sm text-gray-500">ยังไม่มีผู้รับมอบหมาย</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Meta */}
                                    <div className="mt-4 pt-4 border-t border-gray-700 flex items-center justify-between text-xs text-gray-500">
                                        <span>สถานี: {plan.station?.name || '-'}</span>
                                        <span>สร้างโดย: {plan.createdBy?.rank} {plan.createdBy?.firstName}</span>
                                        <span>สร้างเมื่อ: {formatDate(plan.createdAt)}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <AddPatrolPlanModal
                    isOpen={isModalOpen}
                    onClose={handleModalClose}
                    onSuccess={handleModalSuccess}
                    editingPlan={editingPlan}
                />
            )}
        </div>
    );
}
