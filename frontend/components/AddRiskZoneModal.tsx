'use client';

import { useState, useEffect } from 'react';
import { X, Save, MapPin, AlertTriangle, Shield, Loader } from 'lucide-react';
import { riskzoneApi, organizationApi } from '@/lib/api';

interface AddRiskZoneModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function AddRiskZoneModal({ isOpen, onClose, onSuccess }: AddRiskZoneModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [stations, setStations] = useState<any[]>([]);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        category: 'OTHER',
        latitude: '',
        longitude: '',
        radius: 100,
        riskLevel: 'MEDIUM',
        requiredCheckIns: 3,
        stationId: ''
    });

    useEffect(() => {
        if (isOpen) {
            organizationApi.getStations().then(res => {
                setStations(res.data || []);
                if (res.data?.length > 0 && !formData.stationId) {
                    setFormData(prev => ({ ...prev, stationId: res.data[0].id }));
                }
            }).catch(console.error);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!formData.stationId) {
            setError('กรุณาเลือกสถานี');
            return;
        }

        setIsLoading(true);

        try {
            await riskzoneApi.create({
                ...formData,
                latitude: parseFloat(formData.latitude),
                longitude: parseFloat(formData.longitude),
                radius: Number(formData.radius),
                requiredCheckIns: Number(formData.requiredCheckIns)
            });
            onSuccess();
            onClose();
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.message || 'Failed to create risk zone');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-gray-900 border border-gray-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="p-4 border-b border-gray-800 flex items-center justify-between bg-gray-900/50">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <Shield className="w-5 h-5 text-amber-500" />
                        Add New Risk Zone
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">

                    {error && (
                        <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 text-sm flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" />
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">Zone Name</label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500 transition"
                            placeholder="e.g. Red Light District A"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1">สถานี</label>
                            <select
                                required
                                value={formData.stationId}
                                onChange={e => setFormData({ ...formData, stationId: e.target.value })}
                                className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500 transition"
                            >
                                <option value="">เลือกสถานี...</option>
                                {stations.map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1">ประเภทภัย</label>
                            <select
                                value={formData.category}
                                onChange={e => setFormData({ ...formData, category: e.target.value })}
                                className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500 transition"
                            >
                                <option value="DRUGS">💊 ยาเสพติด</option>
                                <option value="WEAPONS">🔫 อาวุธ</option>
                                <option value="TRAFFIC">🚗 จราจร</option>
                                <option value="VIOLENT">⚠️ ประทุษร้าย</option>
                                <option value="THEFT">🏃 ลักทรัพย์</option>
                                <option value="OTHER">📋 อื่นๆ</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">Description</label>
                        <textarea
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500 transition h-20 resize-none"
                            placeholder="Details about risks and instructions..."
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1">Latitude</label>
                            <input
                                type="number"
                                step="any"
                                required
                                value={formData.latitude}
                                onChange={e => setFormData({ ...formData, latitude: e.target.value })}
                                className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500 transition"
                                placeholder="13.xxx"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1">Longitude</label>
                            <input
                                type="number"
                                step="any"
                                required
                                value={formData.longitude}
                                onChange={e => setFormData({ ...formData, longitude: e.target.value })}
                                className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500 transition"
                                placeholder="100.xxx"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1">Risk Level</label>
                            <select
                                value={formData.riskLevel}
                                onChange={e => setFormData({ ...formData, riskLevel: e.target.value })}
                                className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500 transition"
                            >
                                <option value="LOW">LOW (สีเขียว)</option>
                                <option value="MEDIUM">MEDIUM (สีเหลือง)</option>
                                <option value="HIGH">HIGH (สีส้ม)</option>
                                <option value="CRITICAL">CRITICAL (สีแดง)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1">Radius (meters)</label>
                            <input
                                type="number"
                                required
                                value={formData.radius}
                                onChange={e => setFormData({ ...formData, radius: Number(e.target.value) })}
                                className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500 transition"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">Required Check-ins (per day)</label>
                        <input
                            type="number"
                            required
                            value={formData.requiredCheckIns}
                            onChange={e => setFormData({ ...formData, requiredCheckIns: Number(e.target.value) })}
                            className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500 transition"
                        />
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800 transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="px-4 py-2 rounded-lg text-sm font-bold text-black bg-amber-500 hover:bg-amber-400 transition flex items-center gap-2"
                        >
                            {isLoading ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Create Zone
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
