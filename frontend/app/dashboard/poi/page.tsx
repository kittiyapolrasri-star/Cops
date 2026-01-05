'use client';

import { useState, useEffect } from 'react';
import { poiApi, organizationApi } from '@/lib/api';
import {
    MapPin,
    Plus,
    Search,
    Building2,
    Fuel,
    School,
    Hospital,
    Home,
    CreditCard,
    ShoppingBag,
    MoreHorizontal,
    Edit,
    Trash2,
    Eye,
    Filter,
} from 'lucide-react';
import AddPOIModal from '@/components/AddPOIModal';

// POI Category config
const categoryConfig: Record<string, { label: string; icon: any; color: string; emoji: string }> = {
    BANK: { label: 'ธนาคาร', icon: Building2, color: 'blue', emoji: '🏦' },
    GOLD_SHOP: { label: 'ร้านทอง', icon: ShoppingBag, color: 'yellow', emoji: '💎' },
    VIP_RESIDENCE: { label: 'บ้าน VIP', icon: Home, color: 'purple', emoji: '🏠' },
    ATM: { label: 'ตู้ ATM', icon: CreditCard, color: 'green', emoji: '🏧' },
    CONVENIENCE_STORE: { label: 'ร้านสะดวกซื้อ', icon: ShoppingBag, color: 'orange', emoji: '🏪' },
    GAS_STATION: { label: 'ปั๊มน้ำมัน', icon: Fuel, color: 'red', emoji: '⛽' },
    SCHOOL: { label: 'โรงเรียน', icon: School, color: 'indigo', emoji: '🏫' },
    HOSPITAL: { label: 'โรงพยาบาล', icon: Hospital, color: 'pink', emoji: '🏥' },
    TEMPLE: { label: 'วัด', icon: Building2, color: 'amber', emoji: '⛪' },
    MARKET: { label: 'ตลาด', icon: ShoppingBag, color: 'emerald', emoji: '🛒' },
    MALL: { label: 'ห้างสรรพสินค้า', icon: Building2, color: 'cyan', emoji: '🏬' },
    OTHER: { label: 'อื่นๆ', icon: MoreHorizontal, color: 'gray', emoji: '📍' },
};

const priorityConfig: Record<string, { label: string; color: string }> = {
    LOW: { label: 'ต่ำ', color: 'gray' },
    MEDIUM: { label: 'ปานกลาง', color: 'blue' },
    HIGH: { label: 'สูง', color: 'orange' },
    CRITICAL: { label: 'วิกฤต', color: 'red' },
};

interface POI {
    id: string;
    name: string;
    category: string;
    priority: string;
    latitude: number;
    longitude: number;
    address?: string;
    description?: string;
    contactName?: string;
    contactPhone?: string;
    openHours?: string;
    station?: { id: string; name: string; province?: { name: string } };
    createdBy?: { firstName: string; lastName: string; rank?: string };
    createdAt: string;
}

export default function POIPage() {
    const [pois, setPois] = useState<POI[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [selectedPriority, setSelectedPriority] = useState<string>('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPoi, setEditingPoi] = useState<POI | null>(null);
    const [stats, setStats] = useState<any>(null);

    const fetchPOIs = async () => {
        try {
            setLoading(true);
            const params: any = {};
            if (selectedCategory) params.category = selectedCategory;
            if (selectedPriority) params.priority = selectedPriority;

            const [poisRes, statsRes] = await Promise.all([
                poiApi.getAll(params),
                poiApi.getStats(),
            ]);

            setPois(poisRes.data || []);
            setStats(statsRes.data);
        } catch (error) {
            console.error('Failed to fetch POIs', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPOIs();
    }, [selectedCategory, selectedPriority]);

    const handleDelete = async (id: string) => {
        if (!confirm('ต้องการลบสถานที่นี้หรือไม่?')) return;

        try {
            await poiApi.delete(id);
            fetchPOIs();
        } catch (error) {
            console.error('Failed to delete POI', error);
        }
    };

    const handleEdit = (poi: POI) => {
        setEditingPoi(poi);
        setIsModalOpen(true);
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setEditingPoi(null);
    };

    const handleModalSuccess = () => {
        handleModalClose();
        fetchPOIs();
    };

    const filteredPOIs = pois.filter(poi =>
        poi.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        poi.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        poi.station?.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gray-900 p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <MapPin className="w-6 h-6 text-emerald-400" />
                        สถานที่สำคัญ (POI)
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">
                        Layer 2: ปักหมุดสถานที่สำคัญในพื้นที่
                    </p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg transition"
                >
                    <Plus className="w-4 h-4" />
                    เพิ่มสถานที่
                </button>
            </div>

            {/* Stats */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
                    <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                        <p className="text-gray-400 text-xs">ทั้งหมด</p>
                        <p className="text-2xl font-bold text-white">{stats.total}</p>
                    </div>
                    {Object.entries(stats.byCategory || {}).slice(0, 5).map(([cat, count]) => (
                        <div key={cat} className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                            <p className="text-gray-400 text-xs flex items-center gap-1">
                                <span>{categoryConfig[cat]?.emoji || '📍'}</span>
                                {categoryConfig[cat]?.label || cat}
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
                        placeholder="ค้นหาชื่อ, ที่อยู่, สถานี..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                    />
                </div>

                <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
                >
                    <option value="">ทุกประเภท</option>
                    {Object.entries(categoryConfig).map(([key, config]) => (
                        <option key={key} value={key}>{config.emoji} {config.label}</option>
                    ))}
                </select>

                <select
                    value={selectedPriority}
                    onChange={(e) => setSelectedPriority(e.target.value)}
                    className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
                >
                    <option value="">ทุกระดับ</option>
                    {Object.entries(priorityConfig).map(([key, config]) => (
                        <option key={key} value={key}>{config.label}</option>
                    ))}
                </select>
            </div>

            {/* Table */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center">
                        <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                        <p className="text-gray-400">กำลังโหลด...</p>
                    </div>
                ) : filteredPOIs.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        <MapPin className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>ไม่พบสถานที่</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-900/50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">ประเภท</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">ชื่อ</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">ที่อยู่</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">สถานี</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">ระดับ</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">ผู้บันทึก</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">จัดการ</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700">
                                {filteredPOIs.map((poi) => {
                                    const cat = categoryConfig[poi.category] || categoryConfig.OTHER;
                                    const priority = priorityConfig[poi.priority] || priorityConfig.MEDIUM;

                                    return (
                                        <tr key={poi.id} className="hover:bg-gray-700/50 transition">
                                            <td className="px-4 py-3">
                                                <span className="text-xl" title={cat.label}>{cat.emoji}</span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <p className="text-white font-medium">{poi.name}</p>
                                                {poi.contactPhone && (
                                                    <p className="text-xs text-gray-500">{poi.contactPhone}</p>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-gray-400 text-sm max-w-[200px] truncate">
                                                {poi.address || '-'}
                                            </td>
                                            <td className="px-4 py-3 text-gray-400 text-sm">
                                                {poi.station?.name || '-'}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium bg-${priority.color}-500/20 text-${priority.color}-400`}>
                                                    {priority.label}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-gray-400 text-sm">
                                                {poi.createdBy ? `${poi.createdBy.rank || ''} ${poi.createdBy.firstName}` : '-'}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleEdit(poi)}
                                                        className="p-1.5 hover:bg-gray-600 rounded text-gray-400 hover:text-white transition"
                                                        title="แก้ไข"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(poi.id)}
                                                        className="p-1.5 hover:bg-red-500/20 rounded text-gray-400 hover:text-red-400 transition"
                                                        title="ลบ"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <AddPOIModal
                    isOpen={isModalOpen}
                    onClose={handleModalClose}
                    onSuccess={handleModalSuccess}
                    editingPoi={editingPoi}
                />
            )}
        </div>
    );
}
