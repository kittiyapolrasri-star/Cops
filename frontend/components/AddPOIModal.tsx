'use client';

import { useState, useEffect } from 'react';
import { X, MapPin, Save, Loader2 } from 'lucide-react';
import { poiApi, organizationApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store/auth';

const categoryOptions = [
    { value: 'BANK', label: 'ธนาคาร', emoji: '🏦' },
    { value: 'GOLD_SHOP', label: 'ร้านทอง', emoji: '💎' },
    { value: 'VIP_RESIDENCE', label: 'บ้าน VIP', emoji: '🏠' },
    { value: 'ATM', label: 'ตู้ ATM', emoji: '🏧' },
    { value: 'CONVENIENCE_STORE', label: 'ร้านสะดวกซื้อ', emoji: '🏪' },
    { value: 'GAS_STATION', label: 'ปั๊มน้ำมัน', emoji: '⛽' },
    { value: 'SCHOOL', label: 'โรงเรียน', emoji: '🏫' },
    { value: 'HOSPITAL', label: 'โรงพยาบาล', emoji: '🏥' },
    { value: 'TEMPLE', label: 'วัด', emoji: '⛪' },
    { value: 'MARKET', label: 'ตลาด', emoji: '🛒' },
    { value: 'MALL', label: 'ห้างสรรพสินค้า', emoji: '🏬' },
    { value: 'OTHER', label: 'อื่นๆ', emoji: '📍' },
];

const priorityOptions = [
    { value: 'LOW', label: 'ต่ำ', color: 'gray' },
    { value: 'MEDIUM', label: 'ปานกลาง', color: 'blue' },
    { value: 'HIGH', label: 'สูง', color: 'orange' },
    { value: 'CRITICAL', label: 'วิกฤต', color: 'red' },
];

interface AddPOIModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    editingPoi?: any;
}

export default function AddPOIModal({ isOpen, onClose, onSuccess, editingPoi }: AddPOIModalProps) {
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [stations, setStations] = useState<any[]>([]);
    const [formData, setFormData] = useState({
        name: '',
        category: 'OTHER',
        priority: 'MEDIUM',
        latitude: 0,
        longitude: 0,
        address: '',
        description: '',
        contactName: '',
        contactPhone: '',
        openHours: '',
        stationId: '',
    });

    useEffect(() => {
        fetchStations();
    }, []);

    useEffect(() => {
        if (editingPoi) {
            setFormData({
                name: editingPoi.name || '',
                category: editingPoi.category || 'OTHER',
                priority: editingPoi.priority || 'MEDIUM',
                latitude: editingPoi.latitude || 0,
                longitude: editingPoi.longitude || 0,
                address: editingPoi.address || '',
                description: editingPoi.description || '',
                contactName: editingPoi.contactName || '',
                contactPhone: editingPoi.contactPhone || '',
                openHours: editingPoi.openHours || '',
                stationId: editingPoi.stationId || editingPoi.station?.id || '',
            });
        } else {
            // Reset form and set default station
            setFormData({
                name: '',
                category: 'OTHER',
                priority: 'MEDIUM',
                latitude: 0,
                longitude: 0,
                address: '',
                description: '',
                contactName: '',
                contactPhone: '',
                openHours: '',
                stationId: user?.station?.id || '',
            });
        }
    }, [editingPoi, user]);

    const fetchStations = async () => {
        try {
            const res = await organizationApi.getStations();
            setStations(res.data || []);
        } catch (error) {
            console.error('Failed to fetch stations', error);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'latitude' || name === 'longitude' ? parseFloat(value) || 0 : value,
        }));
    };

    const handleGetCurrentLocation = () => {
        if (!navigator.geolocation) {
            alert('เบราว์เซอร์ไม่รองรับ GPS');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setFormData(prev => ({
                    ...prev,
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                }));
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
            alert('กรุณากรอกชื่อสถานที่');
            return;
        }
        if (!formData.stationId) {
            alert('กรุณาเลือกสถานี');
            return;
        }
        if (formData.latitude === 0 && formData.longitude === 0) {
            alert('กรุณาระบุพิกัด');
            return;
        }

        try {
            setLoading(true);

            if (editingPoi) {
                await poiApi.update(editingPoi.id, formData);
            } else {
                await poiApi.create(formData);
            }

            onSuccess();
        } catch (error: any) {
            console.error('Failed to save POI', error);
            alert(error.response?.data?.message || 'เกิดข้อผิดพลาด');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-gray-900 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-gray-700 shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700 bg-gray-800/50">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-emerald-400" />
                        {editingPoi ? 'แก้ไขสถานที่' : 'เพิ่มสถานที่ใหม่'}
                    </h2>
                    <button onClick={onClose} className="p-1 hover:bg-gray-700 rounded transition">
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Name */}
                        <div className="md:col-span-2">
                            <label className="block text-sm text-gray-400 mb-1">ชื่อสถานที่ *</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-emerald-500 focus:outline-none"
                                placeholder="เช่น ธนาคารกรุงไทย สาขาเมืองนครสวรรค์"
                            />
                        </div>

                        {/* Category */}
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">ประเภท *</label>
                            <select
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-emerald-500 focus:outline-none"
                            >
                                {categoryOptions.map(opt => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.emoji} {opt.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Priority */}
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">ระดับความสำคัญ</label>
                            <select
                                name="priority"
                                value={formData.priority}
                                onChange={handleChange}
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-emerald-500 focus:outline-none"
                            >
                                {priorityOptions.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>

                        {/* Station */}
                        <div className="md:col-span-2">
                            <label className="block text-sm text-gray-400 mb-1">สถานีที่รับผิดชอบ *</label>
                            <select
                                name="stationId"
                                value={formData.stationId}
                                onChange={handleChange}
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-emerald-500 focus:outline-none"
                            >
                                <option value="">-- เลือกสถานี --</option>
                                {stations.map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Coordinates */}
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">ละติจูด *</label>
                            <input
                                type="number"
                                name="latitude"
                                value={formData.latitude}
                                onChange={handleChange}
                                step="any"
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-emerald-500 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">ลองจิจูด *</label>
                            <input
                                type="number"
                                name="longitude"
                                value={formData.longitude}
                                onChange={handleChange}
                                step="any"
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-emerald-500 focus:outline-none"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <button
                                type="button"
                                onClick={handleGetCurrentLocation}
                                className="text-sm text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                            >
                                <MapPin className="w-3 h-3" />
                                ใช้ตำแหน่งปัจจุบัน
                            </button>
                        </div>

                        {/* Address */}
                        <div className="md:col-span-2">
                            <label className="block text-sm text-gray-400 mb-1">ที่อยู่</label>
                            <input
                                type="text"
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-emerald-500 focus:outline-none"
                                placeholder="เช่น 123/45 ถ.สวรรค์วิถี ต.ปากน้ำโพ"
                            />
                        </div>

                        {/* Contact */}
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">ชื่อผู้ติดต่อ</label>
                            <input
                                type="text"
                                name="contactName"
                                value={formData.contactName}
                                onChange={handleChange}
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-emerald-500 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">เบอร์โทร</label>
                            <input
                                type="text"
                                name="contactPhone"
                                value={formData.contactPhone}
                                onChange={handleChange}
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-emerald-500 focus:outline-none"
                            />
                        </div>

                        {/* Open Hours */}
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">เวลาเปิด-ปิด</label>
                            <input
                                type="text"
                                name="openHours"
                                value={formData.openHours}
                                onChange={handleChange}
                                placeholder="เช่น 08:30-16:30"
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-emerald-500 focus:outline-none"
                            />
                        </div>

                        {/* Description */}
                        <div className="md:col-span-2">
                            <label className="block text-sm text-gray-400 mb-1">หมายเหตุ</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows={3}
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-emerald-500 focus:outline-none resize-none"
                            />
                        </div>
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
                        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition"
                    >
                        {loading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Save className="w-4 h-4" />
                        )}
                        {editingPoi ? 'บันทึก' : 'เพิ่มสถานที่'}
                    </button>
                </div>
            </div>
        </div>
    );
}
