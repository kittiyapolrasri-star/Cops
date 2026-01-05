'use client';

import { useState, useEffect } from 'react';
import { X, ClipboardList, Save, Loader2, Plus, Trash2, MapPin, GripVertical } from 'lucide-react';
import { patrolPlanApi, organizationApi, poiApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store/auth';

interface Checkpoint {
    id?: string;
    name: string;
    latitude: number;
    longitude: number;
    radius: number;
    sequence: number;
    expectedTime?: string;
    stayDuration?: number;
    poiId?: string;
}

interface AddPatrolPlanModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    editingPlan?: any;
}

export default function AddPatrolPlanModal({ isOpen, onClose, onSuccess, editingPlan }: AddPatrolPlanModalProps) {
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [stations, setStations] = useState<any[]>([]);
    const [pois, setPois] = useState<any[]>([]);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        stationId: '',
        startTime: '',
        endTime: '',
        repeatDaily: false,
        isActive: true,
    });
    const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);

    useEffect(() => {
        fetchStations();
    }, []);

    useEffect(() => {
        if (formData.stationId) {
            fetchPOIs(formData.stationId);
        }
    }, [formData.stationId]);

    useEffect(() => {
        if (editingPlan) {
            setFormData({
                name: editingPlan.name || '',
                description: editingPlan.description || '',
                stationId: editingPlan.stationId || editingPlan.station?.id || '',
                startTime: formatDateTimeLocal(editingPlan.startTime),
                endTime: formatDateTimeLocal(editingPlan.endTime),
                repeatDaily: editingPlan.repeatDaily || false,
                isActive: editingPlan.isActive ?? true,
            });
            setCheckpoints(editingPlan.checkpoints?.map((cp: any, index: number) => ({
                id: cp.id,
                name: cp.name,
                latitude: cp.latitude,
                longitude: cp.longitude,
                radius: cp.radius || 50,
                sequence: cp.sequence || index + 1,
                expectedTime: cp.expectedTime ? formatDateTimeLocal(cp.expectedTime) : '',
                stayDuration: cp.stayDuration || 5,
                poiId: cp.poiId || '',
            })) || []);
        } else {
            setFormData({
                name: '',
                description: '',
                stationId: user?.station?.id || '',
                startTime: getTodayDateTime(8, 0), // 08:00
                endTime: getTodayDateTime(16, 0),  // 16:00
                repeatDaily: false,
                isActive: true,
            });
            setCheckpoints([]);
        }
    }, [editingPlan, user]);

    const formatDateTimeLocal = (dateStr: string) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toISOString().slice(0, 16);
    };

    const getTodayDateTime = (hours: number, minutes: number) => {
        const date = new Date();
        date.setHours(hours, minutes, 0, 0);
        return date.toISOString().slice(0, 16);
    };

    const fetchStations = async () => {
        try {
            const res = await organizationApi.getStations();
            setStations(res.data || []);
        } catch (error) {
            console.error('Failed to fetch stations', error);
        }
    };

    const fetchPOIs = async (stationId: string) => {
        try {
            const res = await poiApi.getAll({ stationId });
            setPois(res.data || []);
        } catch (error) {
            console.error('Failed to fetch POIs', error);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
        }));
    };

    const addCheckpoint = () => {
        setCheckpoints(prev => [...prev, {
            name: `จุดที่ ${prev.length + 1}`,
            latitude: 0,
            longitude: 0,
            radius: 50,
            sequence: prev.length + 1,
            stayDuration: 5,
        }]);
    };

    const updateCheckpoint = (index: number, field: string, value: any) => {
        setCheckpoints(prev => prev.map((cp, i) =>
            i === index ? { ...cp, [field]: value } : cp
        ));
    };

    const removeCheckpoint = (index: number) => {
        setCheckpoints(prev => prev.filter((_, i) => i !== index).map((cp, i) => ({
            ...cp,
            sequence: i + 1,
        })));
    };

    const selectPOIForCheckpoint = (index: number, poiId: string) => {
        const poi = pois.find(p => p.id === poiId);
        if (poi) {
            setCheckpoints(prev => prev.map((cp, i) =>
                i === index ? {
                    ...cp,
                    name: poi.name,
                    latitude: poi.latitude,
                    longitude: poi.longitude,
                    poiId: poi.id,
                } : cp
            ));
        }
    };

    const getCurrentLocation = (index: number) => {
        if (!navigator.geolocation) {
            alert('เบราว์เซอร์ไม่รองรับ GPS');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setCheckpoints(prev => prev.map((cp, i) =>
                    i === index ? {
                        ...cp,
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                    } : cp
                ));
            },
            (error) => {
                console.error('GPS error:', error);
                alert('ไม่สามารถรับตำแหน่งได้');
            }
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            alert('กรุณากรอกชื่อแผน');
            return;
        }
        if (!formData.stationId) {
            alert('กรุณาเลือกสถานี');
            return;
        }
        if (!formData.startTime || !formData.endTime) {
            alert('กรุณาระบุเวลาเริ่มต้นและสิ้นสุด');
            return;
        }

        try {
            setLoading(true);

            const payload = {
                ...formData,
                checkpoints: checkpoints.map(cp => ({
                    name: cp.name,
                    latitude: cp.latitude,
                    longitude: cp.longitude,
                    radius: cp.radius,
                    sequence: cp.sequence,
                    expectedTime: cp.expectedTime || undefined,
                    stayDuration: cp.stayDuration,
                    poiId: cp.poiId || undefined,
                })),
            };

            if (editingPlan) {
                await patrolPlanApi.update(editingPlan.id, payload);
            } else {
                await patrolPlanApi.create(payload);
            }

            onSuccess();
        } catch (error: any) {
            console.error('Failed to save plan', error);
            alert(error.response?.data?.message || 'เกิดข้อผิดพลาด');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-gray-900 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden border border-gray-700 shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700 bg-gray-800/50">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <ClipboardList className="w-5 h-5 text-sky-400" />
                        {editingPlan ? 'แก้ไขแผนการตรวจ' : 'สร้างแผนใหม่'}
                    </h2>
                    <button onClick={onClose} className="p-1 hover:bg-gray-700 rounded transition">
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                    {/* Basic Info */}
                    <div className="space-y-4 mb-6">
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">ชื่อแผน *</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-sky-500 focus:outline-none"
                                placeholder="เช่น แผนตรวจรอบเช้า สน.เมืองนครสวรรค์"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">สถานี *</label>
                                <select
                                    name="stationId"
                                    value={formData.stationId}
                                    onChange={handleChange}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-sky-500 focus:outline-none"
                                >
                                    <option value="">-- เลือกสถานี --</option>
                                    {stations.map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex items-center gap-4 pt-6">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        name="repeatDaily"
                                        checked={formData.repeatDaily}
                                        onChange={handleChange}
                                        className="w-4 h-4 rounded bg-gray-700 border-gray-600"
                                    />
                                    <span className="text-gray-300">ทำซ้ำทุกวัน</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        name="isActive"
                                        checked={formData.isActive}
                                        onChange={handleChange}
                                        className="w-4 h-4 rounded bg-gray-700 border-gray-600"
                                    />
                                    <span className="text-gray-300">เปิดใช้งาน</span>
                                </label>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">เวลาเริ่ม *</label>
                                <input
                                    type="datetime-local"
                                    name="startTime"
                                    value={formData.startTime}
                                    onChange={handleChange}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-sky-500 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">เวลาสิ้นสุด *</label>
                                <input
                                    type="datetime-local"
                                    name="endTime"
                                    value={formData.endTime}
                                    onChange={handleChange}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-sky-500 focus:outline-none"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm text-gray-400 mb-1">หมายเหตุ</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows={2}
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-sky-500 focus:outline-none resize-none"
                            />
                        </div>
                    </div>

                    {/* Checkpoints */}
                    <div className="border-t border-gray-700 pt-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-medium text-white flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-sky-400" />
                                จุดตรวจ ({checkpoints.length})
                            </h3>
                            <button
                                type="button"
                                onClick={addCheckpoint}
                                className="flex items-center gap-1 text-sm text-sky-400 hover:text-sky-300"
                            >
                                <Plus className="w-4 h-4" />
                                เพิ่มจุด
                            </button>
                        </div>

                        {checkpoints.length === 0 ? (
                            <div className="text-center py-6 bg-gray-800/50 rounded-lg border border-dashed border-gray-700">
                                <MapPin className="w-8 h-8 mx-auto text-gray-600 mb-2" />
                                <p className="text-gray-500 text-sm">ยังไม่มีจุดตรวจ</p>
                                <button
                                    type="button"
                                    onClick={addCheckpoint}
                                    className="mt-2 text-sm text-sky-400 hover:text-sky-300"
                                >
                                    + เพิ่มจุดตรวจแรก
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {checkpoints.map((cp, index) => (
                                    <div key={index} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                                        <div className="flex items-start gap-3">
                                            <div className="flex flex-col items-center gap-1">
                                                <span className="w-7 h-7 rounded-full bg-sky-500/20 text-sky-400 text-sm flex items-center justify-center font-bold">
                                                    {cp.sequence}
                                                </span>
                                                <GripVertical className="w-4 h-4 text-gray-600" />
                                            </div>

                                            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                                                <div>
                                                    <input
                                                        type="text"
                                                        value={cp.name}
                                                        onChange={(e) => updateCheckpoint(index, 'name', e.target.value)}
                                                        placeholder="ชื่อจุด"
                                                        className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-1.5 text-white text-sm focus:border-sky-500 focus:outline-none"
                                                    />
                                                </div>
                                                <div>
                                                    <select
                                                        value={cp.poiId || ''}
                                                        onChange={(e) => selectPOIForCheckpoint(index, e.target.value)}
                                                        className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-1.5 text-white text-sm focus:border-sky-500 focus:outline-none"
                                                    >
                                                        <option value="">-- เลือกจาก POI --</option>
                                                        {pois.map(poi => (
                                                            <option key={poi.id} value={poi.id}>{poi.name}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="number"
                                                        value={cp.latitude}
                                                        onChange={(e) => updateCheckpoint(index, 'latitude', parseFloat(e.target.value) || 0)}
                                                        step="any"
                                                        placeholder="Lat"
                                                        className="flex-1 bg-gray-900 border border-gray-600 rounded px-3 py-1.5 text-white text-sm focus:border-sky-500 focus:outline-none"
                                                    />
                                                    <input
                                                        type="number"
                                                        value={cp.longitude}
                                                        onChange={(e) => updateCheckpoint(index, 'longitude', parseFloat(e.target.value) || 0)}
                                                        step="any"
                                                        placeholder="Lng"
                                                        className="flex-1 bg-gray-900 border border-gray-600 rounded px-3 py-1.5 text-white text-sm focus:border-sky-500 focus:outline-none"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => getCurrentLocation(index)}
                                                        className="px-2 bg-gray-900 border border-gray-600 rounded text-gray-400 hover:text-white text-xs"
                                                        title="GPS"
                                                    >
                                                        📍
                                                    </button>
                                                </div>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="number"
                                                        value={cp.radius}
                                                        onChange={(e) => updateCheckpoint(index, 'radius', parseInt(e.target.value) || 50)}
                                                        placeholder="รัศมี (ม.)"
                                                        className="w-24 bg-gray-900 border border-gray-600 rounded px-3 py-1.5 text-white text-sm focus:border-sky-500 focus:outline-none"
                                                    />
                                                    <input
                                                        type="number"
                                                        value={cp.stayDuration || ''}
                                                        onChange={(e) => updateCheckpoint(index, 'stayDuration', parseInt(e.target.value) || 0)}
                                                        placeholder="อยู่ (นาที)"
                                                        className="w-24 bg-gray-900 border border-gray-600 rounded px-3 py-1.5 text-white text-sm focus:border-sky-500 focus:outline-none"
                                                    />
                                                </div>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => removeCheckpoint(index)}
                                                className="p-1.5 hover:bg-red-500/20 rounded text-gray-500 hover:text-red-400 transition"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </form>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-700 bg-gray-800/50">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-gray-400 hover:text-white transition"
                    >
                        ยกเลิก
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="flex items-center gap-2 bg-sky-600 hover:bg-sky-500 disabled:bg-sky-800 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition"
                    >
                        {loading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Save className="w-4 h-4" />
                        )}
                        {editingPlan ? 'บันทึก' : 'สร้างแผน'}
                    </button>
                </div>
            </div>
        </div>
    );
}
