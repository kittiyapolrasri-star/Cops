'use client';

import { useState } from 'react';
import {
    X,
    Navigation,
    ZoomIn,
    Copy,
    Share2,
    MapPin,
    Clock,
    User,
    Building2,
    AlertTriangle,
    Shield,
    Phone,
    Mail,
    Calendar,
    Hash,
    Target,
    CheckCircle,
    XCircle,
    Siren,
    Radio,
    Eye,
} from 'lucide-react';

// ==================== TYPES ====================

export type DetailItemType = 'station' | 'poi' | 'riskzone' | 'crime' | 'sos' | 'patrol';

interface LocationDetailPanelProps {
    isOpen: boolean;
    onClose: () => void;
    item: any;
    type: DetailItemType;
    onZoomTo?: (lat: number, lng: number) => void;
}

// ==================== HELPERS ====================

const formatDate = (date: string | Date) => {
    if (!date) return '-';
    return new Date(date).toLocaleString('th-TH', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
};

const openGoogleMaps = (lat: number, lng: number) => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
};

const shareLocation = (name: string, lat: number, lng: number) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    if (navigator.share) {
        navigator.share({ title: name, url });
    } else {
        copyToClipboard(url);
    }
};

// ==================== TYPE CONFIGS ====================

const typeConfig: Record<DetailItemType, { icon: any; color: string; label: string }> = {
    station: { icon: Building2, color: 'blue', label: 'สถานี' },
    poi: { icon: MapPin, color: 'purple', label: 'สถานที่สำคัญ' },
    riskzone: { icon: AlertTriangle, color: 'red', label: 'พื้นที่เสี่ยง' },
    crime: { icon: Shield, color: 'orange', label: 'คดีอาชญากรรม' },
    sos: { icon: Siren, color: 'red', label: 'SOS ฉุกเฉิน' },
    patrol: { icon: Radio, color: 'green', label: 'สายตรวจ' },
};

const riskLevelColors: Record<string, string> = {
    CRITICAL: 'bg-red-500',
    HIGH: 'bg-orange-500',
    MEDIUM: 'bg-yellow-500',
    LOW: 'bg-green-500',
};

const sosStatusColors: Record<string, string> = {
    ACTIVE: 'bg-red-500 animate-pulse',
    RESPONDING: 'bg-yellow-500',
    RESOLVED: 'bg-green-500',
};

// ==================== MAIN COMPONENT ====================

export default function LocationDetailPanel({
    isOpen,
    onClose,
    item,
    type,
    onZoomTo,
}: LocationDetailPanelProps) {
    const [activeTab, setActiveTab] = useState<'overview' | 'stats' | 'history'>('overview');

    if (!isOpen || !item) return null;

    const config = typeConfig[type];
    const Icon = config.icon;

    // Get coordinates
    const lat = item.latitude || item.lat || 0;
    const lng = item.longitude || item.lng || 0;

    // Get name based on type
    const getName = () => {
        switch (type) {
            case 'station': return item.name;
            case 'poi': return item.name;
            case 'riskzone': return item.name;
            case 'crime': return `คดี ${item.caseNumber}`;
            case 'sos': return `SOS - ${item.type}`;
            case 'patrol': return `${item.user?.rank} ${item.user?.firstName}`;
            default: return 'Unknown';
        }
    };

    // Get category/subtitle based on type
    const getSubtitle = () => {
        switch (type) {
            case 'station': return item.province?.name || 'สถานีตำรวจ';
            case 'poi': return item.category || 'POI';
            case 'riskzone': return `ระดับ: ${item.riskLevel}`;
            case 'crime': return item.type || 'อาชญากรรม';
            case 'sos': return item.status || 'ACTIVE';
            case 'patrol': return item.user?.station?.name || 'สายตรวจ';
            default: return '';
        }
    };

    return (
        <div className="fixed right-0 top-0 h-full w-[360px] bg-slate-900 text-white shadow-2xl z-[9999] flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="relative h-40 bg-gradient-to-b from-slate-800 to-slate-900">
                {/* Static Map Preview Placeholder */}
                <div className="absolute inset-0 bg-slate-800 flex items-center justify-center">
                    <div className="text-center">
                        <Icon className={`w-12 h-12 mx-auto text-${config.color}-400 mb-2`} />
                        <span className="text-xs text-slate-500">📍 {lat.toFixed(4)}, {lng.toFixed(4)}</span>
                    </div>
                </div>

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 p-2 bg-slate-900/80 hover:bg-slate-800 rounded-full transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Status Badge */}
                {type === 'sos' && item.status && (
                    <div className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-bold ${sosStatusColors[item.status] || 'bg-gray-500'}`}>
                        {item.status}
                    </div>
                )}
                {type === 'riskzone' && item.riskLevel && (
                    <div className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-bold ${riskLevelColors[item.riskLevel] || 'bg-gray-500'}`}>
                        {item.riskLevel}
                    </div>
                )}
            </div>

            {/* Title Section */}
            <div className="px-4 py-3 border-b border-slate-700">
                <h2 className="text-lg font-bold">{getName()}</h2>
                <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-0.5 rounded text-xs bg-${config.color}-500/20 text-${config.color}-400`}>
                        {config.label}
                    </span>
                    <span className="text-sm text-slate-400">{getSubtitle()}</span>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-700">
                {(['overview', 'stats', 'history'] as const).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === tab
                                ? 'text-cyan-400 border-b-2 border-cyan-400'
                                : 'text-slate-400 hover:text-white'
                            }`}
                    >
                        {tab === 'overview' ? 'ภาพรวม' : tab === 'stats' ? 'สถิติ' : 'ประวัติ'}
                    </button>
                ))}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-around py-3 border-b border-slate-700 bg-slate-800/50">
                <button
                    onClick={() => openGoogleMaps(lat, lng)}
                    className="flex flex-col items-center gap-1 text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                    <div className="p-2 bg-cyan-500/20 rounded-full">
                        <Navigation className="w-5 h-5" />
                    </div>
                    <span className="text-xs">นำทาง</span>
                </button>
                <button
                    onClick={() => onZoomTo?.(lat, lng)}
                    className="flex flex-col items-center gap-1 text-slate-400 hover:text-white transition-colors"
                >
                    <div className="p-2 bg-slate-600/50 rounded-full">
                        <ZoomIn className="w-5 h-5" />
                    </div>
                    <span className="text-xs">ซูม</span>
                </button>
                <button
                    onClick={() => copyToClipboard(`${lat}, ${lng}`)}
                    className="flex flex-col items-center gap-1 text-slate-400 hover:text-white transition-colors"
                >
                    <div className="p-2 bg-slate-600/50 rounded-full">
                        <Copy className="w-5 h-5" />
                    </div>
                    <span className="text-xs">คัดลอก</span>
                </button>
                <button
                    onClick={() => shareLocation(getName(), lat, lng)}
                    className="flex flex-col items-center gap-1 text-slate-400 hover:text-white transition-colors"
                >
                    <div className="p-2 bg-slate-600/50 rounded-full">
                        <Share2 className="w-5 h-5" />
                    </div>
                    <span className="text-xs">แชร์</span>
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {activeTab === 'overview' && (
                    <>
                        {/* Address */}
                        {item.address && (
                            <div className="flex items-start gap-3">
                                <MapPin className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="text-sm">{item.address}</p>
                                </div>
                            </div>
                        )}

                        {/* GPS Coordinates */}
                        <div className="flex items-start gap-3">
                            <Target className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="text-sm font-mono">{lat.toFixed(6)}, {lng.toFixed(6)}</p>
                            </div>
                        </div>

                        {/* Description */}
                        {item.description && (
                            <div className="flex items-start gap-3">
                                <Eye className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="text-sm text-slate-300">{item.description}</p>
                                </div>
                            </div>
                        )}

                        {/* Type-Specific Details */}
                        {type === 'station' && (
                            <>
                                <div className="flex items-center gap-3">
                                    <Radio className="w-5 h-5 text-green-400 flex-shrink-0" />
                                    <p className="text-sm">สายตรวจ Active: <span className="text-green-400 font-bold">{item.patrolCount || 0}</span> นาย</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <AlertTriangle className="w-5 h-5 text-orange-400 flex-shrink-0" />
                                    <p className="text-sm">พื้นที่เสี่ยง: <span className="text-orange-400 font-bold">{item.riskZoneCount || 0}</span> จุด</p>
                                </div>
                            </>
                        )}

                        {type === 'poi' && (
                            <>
                                <div className="flex items-center gap-3">
                                    <Hash className="w-5 h-5 text-purple-400 flex-shrink-0" />
                                    <p className="text-sm">หมวด: <span className="text-purple-400">{item.category}</span></p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Shield className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                                    <p className="text-sm">ความสำคัญ: <span className="text-yellow-400">{item.priority}</span></p>
                                </div>
                            </>
                        )}

                        {type === 'riskzone' && (
                            <>
                                <div className="flex items-center gap-3">
                                    <Target className="w-5 h-5 text-red-400 flex-shrink-0" />
                                    <p className="text-sm">รัศมี: <span className="text-red-400 font-bold">{item.radius || 50}</span> เมตร</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <CheckCircle className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                                    <p className="text-sm">Check-in ที่ต้องการ: <span className="text-cyan-400 font-bold">{item.requiredCheckIns || 0}</span> ครั้ง/วัน</p>
                                </div>
                            </>
                        )}

                        {type === 'crime' && (
                            <>
                                <div className="flex items-center gap-3">
                                    <Hash className="w-5 h-5 text-orange-400 flex-shrink-0" />
                                    <p className="text-sm">หมายเลขคดี: <span className="text-orange-400 font-mono">{item.caseNumber}</span></p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Calendar className="w-5 h-5 text-slate-400 flex-shrink-0" />
                                    <p className="text-sm">วันเกิดเหตุ: {formatDate(item.occurredAt)}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    {item.isResolved ? (
                                        <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                                    ) : (
                                        <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                                    )}
                                    <p className="text-sm">สถานะ: <span className={item.isResolved ? 'text-green-400' : 'text-red-400'}>{item.isResolved ? 'ดำเนินการแล้ว' : 'รอดำเนินการ'}</span></p>
                                </div>
                            </>
                        )}

                        {type === 'sos' && (
                            <>
                                <div className="flex items-center gap-3">
                                    <User className="w-5 h-5 text-slate-400 flex-shrink-0" />
                                    <p className="text-sm">ผู้แจ้ง: {item.user?.rank} {item.user?.firstName} {item.user?.lastName}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Clock className="w-5 h-5 text-slate-400 flex-shrink-0" />
                                    <p className="text-sm">เวลาแจ้ง: {formatDate(item.createdAt)}</p>
                                </div>
                                {item.message && (
                                    <div className="flex items-start gap-3">
                                        <Siren className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                                        <p className="text-sm text-red-300">{item.message}</p>
                                    </div>
                                )}
                            </>
                        )}

                        {type === 'patrol' && (
                            <>
                                <div className="flex items-center gap-3">
                                    <Building2 className="w-5 h-5 text-blue-400 flex-shrink-0" />
                                    <p className="text-sm">สังกัด: {item.user?.station?.name}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Clock className="w-5 h-5 text-slate-400 flex-shrink-0" />
                                    <p className="text-sm">เริ่มลาดตระเวน: {formatDate(item.startedAt)}</p>
                                </div>
                            </>
                        )}

                        {/* Created At */}
                        {item.createdAt && type !== 'sos' && (
                            <div className="flex items-center gap-3 pt-2 border-t border-slate-700">
                                <Calendar className="w-5 h-5 text-slate-500 flex-shrink-0" />
                                <p className="text-xs text-slate-500">สร้างเมื่อ: {formatDate(item.createdAt)}</p>
                            </div>
                        )}
                    </>
                )}

                {activeTab === 'stats' && (
                    <div className="text-center py-8 text-slate-500">
                        <Shield className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>ยังไม่มีข้อมูลสถิติ</p>
                    </div>
                )}

                {activeTab === 'history' && (
                    <div className="text-center py-8 text-slate-500">
                        <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>ยังไม่มีประวัติ</p>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-slate-700 bg-slate-800/50 text-center">
                <p className="text-xs text-slate-500">ID: {item.id?.slice(0, 8) || 'N/A'}</p>
            </div>
        </div>
    );
}
