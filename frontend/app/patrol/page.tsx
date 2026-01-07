'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuthStore } from '@/lib/store/auth';
import { trackingApi, checkinApi, incidentApi, sosApi, poiApi, uploadApi } from '@/lib/api';
import {
    MapPin,
    Radio,
    Camera,
    Mic,
    AlertTriangle,
    Navigation,
    X,
    Send,
    ArrowLeft,
    Loader,
    Siren,
    Plus,
    Building2,
} from 'lucide-react';
import dynamic from 'next/dynamic';

const PatrolMap = dynamic(() => import('@/components/PatrolMap'), { ssr: false });

interface Location {
    latitude: number;
    longitude: number;
    accuracy: number;
    timestamp: Date;
}

export default function PatrolPage() {
    const router = useRouter();
    const { user, isAuthenticated, checkAuth } = useAuthStore();

    const [isPatrolling, setIsPatrolling] = useState(false);
    const [location, setLocation] = useState<Location | null>(null);
    const [watchId, setWatchId] = useState<number | null>(null);
    const [showIncidentModal, setShowIncidentModal] = useState(false);
    const [incidentType, setIncidentType] = useState<'PREVENTION' | 'SUPPRESSION' | null>(null);
    const [checkIns, setCheckIns] = useState<number>(0);
    const [patrolTime, setPatrolTime] = useState<string>('00:00:00');
    const [patrolStartTime, setPatrolStartTime] = useState<Date | null>(null);
    const [showSOSModal, setShowSOSModal] = useState(false);
    const [showPOIModal, setShowPOIModal] = useState(false);
    const [sosLoading, setSosLoading] = useState(false);

    useEffect(() => {
        checkAuth();
        if (!isAuthenticated) {
            router.push('/login');
        }
    }, [isAuthenticated, router, checkAuth]);

    // Patrol timer
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isPatrolling && patrolStartTime) {
            interval = setInterval(() => {
                const diff = Date.now() - patrolStartTime.getTime();
                const hours = Math.floor(diff / 3600000);
                const mins = Math.floor((diff % 3600000) / 60000);
                const secs = Math.floor((diff % 60000) / 1000);
                setPatrolTime(
                    `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
                );
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isPatrolling, patrolStartTime]);

    const updateServerLocation = async (loc: Location) => {
        try {
            await trackingApi.updateLocation({
                latitude: loc.latitude,
                longitude: loc.longitude,
                accuracy: loc.accuracy
            });
        } catch (err) {
            console.error("Failed to update location", err);
        }
    };

    // Use ref to track patrolling state for the geolocation callback (avoids closure issues)
    const isPatrollingRef = useRef(false);

    const startPatrol = useCallback(async () => {
        if ('geolocation' in navigator) {
            try {
                await trackingApi.startPatrol();

                // Set ref BEFORE starting watchPosition to avoid race condition
                isPatrollingRef.current = true;

                const id = navigator.geolocation.watchPosition(
                    (position) => {
                        const newLoc = {
                            latitude: position.coords.latitude,
                            longitude: position.coords.longitude,
                            accuracy: position.coords.accuracy,
                            timestamp: new Date(),
                        };
                        setLocation(newLoc);
                        // Use ref instead of state to check patrolling status
                        if (isPatrollingRef.current) {
                            updateServerLocation(newLoc);
                        }
                    },
                    (error) => {
                        console.error('Geolocation error:', error);
                        alert('ไม่สามารถเข้าถึงตำแหน่งได้ กรุณาอนุญาตการเข้าถึง GPS');
                    },
                    {
                        enableHighAccuracy: true,
                        maximumAge: 10000,
                        timeout: 5000,
                    }
                );
                setWatchId(id);
                setIsPatrolling(true);
                setPatrolStartTime(new Date());
            } catch (err) {
                isPatrollingRef.current = false; // Reset on error
                alert('ไม่สามารถเริ่มลาดตระเวนได้: ' + (err as any).message);
            }
        } else {
            alert('เบราว์เซอร์นี้ไม่รองรับ Geolocation');
        }
    }, []);

    const endPatrol = useCallback(async () => {
        try {
            // Stop sending location updates immediately
            isPatrollingRef.current = false;

            await trackingApi.endPatrol();
            if (watchId !== null) {
                navigator.geolocation.clearWatch(watchId);
                setWatchId(null);
            }
            setIsPatrolling(false);
            setPatrolStartTime(null);
            setPatrolTime('00:00:00');
        } catch (err) {
            alert('เกิดข้อผิดพลาดในการจบภารกิจ');
        }
    }, [watchId]);

    const handleCheckIn = async () => {
        if (location) {
            try {
                await checkinApi.create({
                    latitude: location.latitude,
                    longitude: location.longitude,
                    note: 'Manual Check-in'
                });
                setCheckIns(prev => prev + 1);
                alert('เช็คอินสำเร็จ!');
            } catch (err) {
                alert('เช็คอินล้มเหลว ลองใหม่อีกครั้ง');
            }
        } else {
            alert('ไม่พบตำแหน่ง กรุณารอสักครู่');
        }
    };

    // SOS Emergency Handler
    const handleSOS = async (type: string, message?: string) => {
        if (!location) {
            alert('ไม่พบตำแหน่ง กรุณารอสักครู่');
            return;
        }
        setSosLoading(true);
        try {
            await sosApi.create({
                type,
                latitude: location.latitude,
                longitude: location.longitude,
                message,
            });
            setShowSOSModal(false);
            alert('🚨 ส่งสัญญาณฉุกเฉินสำเร็จ! กำลังแจ้งหน่วยใกล้เคียง...');
        } catch (err) {
            alert('ส่งสัญญาณล้มเหลว ลองใหม่อีกครั้ง');
        } finally {
            setSosLoading(false);
        }
    };

    // POI Create Handler  
    const handleCreatePOI = async (data: { name: string; category: string; description?: string }) => {
        if (!location) {
            alert('ไม่พบตำแหน่ง กรุณารอสักครู่');
            return;
        }
        try {
            await poiApi.create({
                ...data,
                latitude: location.latitude,
                longitude: location.longitude,
            });
            setShowPOIModal(false);
            alert('✅ บันทึกจุดสำคัญสำเร็จ!');
        } catch (err) {
            alert('บันทึกล้มเหลว ลองใหม่อีกครั้ง');
        }
    };

    if (!isAuthenticated) {
        return null;
    }

    return (
        <div className="min-h-screen bg-[#050505] text-white font-sans">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-[#050505]/90 backdrop-blur-md border-b border-white/5 px-4 py-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link
                            href="/dashboard"
                            className="w-10 h-10 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition border border-white/5"
                        >
                            <ArrowLeft className="w-5 h-5 text-gray-400" />
                        </Link>
                        <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10 relative">
                            <Image src="/Logo.jpeg" alt="C.O.P.S." fill className="object-cover" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-white tracking-wide">{user?.rank} {user?.firstName}</p>
                            <p className="text-[10px] text-gray-500 uppercase tracking-widest">Patrol Unit</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {isPatrolling && (
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-xs font-bold text-emerald-500 tracking-wider">ON DUTY</span>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* Map area */}
            <div className="pt-16 h-[50vh] relative">
                <PatrolMap location={location} />
                {/* Overlay Gradients */}
                <div className="absolute top-0 inset-x-0 h-16 bg-gradient-to-b from-[#050505] to-transparent pointer-events-none z-[400]" />
                <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-[#050505] to-transparent pointer-events-none z-[400]" />
            </div>

            {/* Status panel */}
            <div className="bg-[#0a0a0a] border-t border-b border-white/5 p-4 relative z-10">
                <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                        <p className="text-2xl font-bold text-sky-400 font-mono tracking-tighter">{patrolTime}</p>
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Duration</p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                        <p className="text-2xl font-bold text-emerald-400 font-mono">{checkIns}</p>
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Check-ins</p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                        <p className="text-xl font-bold text-amber-400 font-mono mt-1">
                            {location ? `±${Math.round(location.accuracy)}m` : '--'}
                        </p>
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">GPS Acc</p>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="p-4 space-y-3 bg-[#050505]">
                {/* Patrol toggle */}
                <button
                    onClick={isPatrolling ? endPatrol : startPatrol}
                    className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition shadow-lg ${isPatrolling
                        ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-900/20'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-900/20'
                        }`}
                >
                    <Radio className="w-6 h-6 animate-pulse" />
                    {isPatrolling ? 'END PATROL' : 'START PATROL'}
                </button>

                {/* Check-in button */}
                <button
                    onClick={handleCheckIn}
                    disabled={!isPatrolling}
                    className="w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 bg-white/10 hover:bg-white/20 text-white disabled:opacity-50 disabled:cursor-not-allowed transition border border-white/10 backdrop-blur-md"
                >
                    <MapPin className="w-6 h-6" />
                    CHECK-IN POINT
                </button>

                {/* Incident Report buttons */}
                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={() => { setIncidentType('PREVENTION'); setShowIncidentModal(true); }}
                        disabled={!isPatrolling}
                        className="py-4 rounded-xl font-bold flex flex-col items-center gap-2 bg-amber-600/20 hover:bg-amber-600/30 text-amber-500 border border-amber-600/30 disabled:opacity-30 transition"
                    >
                        <Camera className="w-6 h-6" />
                        <span className="text-sm tracking-wider">PREVENTION</span>
                    </button>
                    <button
                        onClick={() => { setIncidentType('SUPPRESSION'); setShowIncidentModal(true); }}
                        disabled={!isPatrolling}
                        className="py-4 rounded-xl font-bold flex flex-col items-center gap-2 bg-rose-600/20 hover:bg-rose-600/30 text-rose-500 border border-rose-600/30 disabled:opacity-30 transition"
                    >
                        <AlertTriangle className="w-6 h-6" />
                        <span className="text-sm tracking-wider">SUPPRESSION</span>
                    </button>
                </div>

                {/* SOS Emergency Button */}
                <button
                    onClick={() => setShowSOSModal(true)}
                    className="w-full py-5 rounded-xl font-bold text-lg flex items-center justify-center gap-3 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800 text-white shadow-lg shadow-red-900/30 transition animate-pulse border-2 border-red-400/50"
                >
                    <Siren className="w-7 h-7" />
                    🚨 SOS EMERGENCY
                </button>

                {/* POI Create Button */}
                <button
                    onClick={() => setShowPOIModal(true)}
                    disabled={!isPatrolling}
                    className="w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 border border-purple-600/30 disabled:opacity-30 transition"
                >
                    <Plus className="w-6 h-6" />
                    <Building2 className="w-5 h-5" />
                    บันทึกจุดสำคัญ (POI)
                </button>
            </div>

            {/* Incident Modal */}
            {showIncidentModal && (
                <IncidentModal
                    type={incidentType!}
                    location={location}
                    onClose={() => { setShowIncidentModal(false); setIncidentType(null); }}
                    onSubmit={async (data) => {
                        try {
                            await incidentApi.create(data);
                            setShowIncidentModal(false);
                            setIncidentType(null);
                            alert('ส่งรายงานสำเร็จ!');
                        } catch (err) {
                            alert('ส่งรายงานล้มเหลว');
                        }
                    }}
                />
            )}

            {/* SOS Modal */}
            {showSOSModal && (
                <SOSModal
                    location={location}
                    loading={sosLoading}
                    onClose={() => setShowSOSModal(false)}
                    onSubmit={handleSOS}
                />
            )}

            {/* POI Modal */}
            {showPOIModal && (
                <POIModal
                    location={location}
                    onClose={() => setShowPOIModal(false)}
                    onSubmit={handleCreatePOI}
                />
            )}
        </div>
    );
}

// Incident Modal Component - Refined Dark Theme
function IncidentModal({
    type,
    location,
    onClose,
    onSubmit,
}: {
    type: 'PREVENTION' | 'SUPPRESSION';
    location: Location | null;
    onClose: () => void;
    onSubmit: (data: any) => Promise<void>;
}) {
    const [description, setDescription] = useState('');
    const [selectedItems, setSelectedItems] = useState<string[]>([]);
    const [submitting, setSubmitting] = useState(false);

    const suppressionCategories = [
        {
            category: 'TRAFFIC',
            title: 'VEHICLES',
            items: ['No Plate', 'Loud Exhaust', 'Modified'],
        },
        {
            category: 'DRUGS',
            title: 'DRUGS',
            items: ['Meth', 'Ice', 'Ketamine', 'Cannabis'],
        },
        {
            category: 'WEAPONS',
            title: 'WEAPONS',
            items: ['Knife', 'Homemade Gun', 'Licensed Gun', 'War Weapon'],
        },
    ];

    const toggleItem = (item: string) => {
        setSelectedItems(prev =>
            prev.includes(item)
                ? prev.filter(i => i !== item)
                : [...prev, item]
        );
    };

    // Helper function to get category for an item
    const getCategoryForItem = (item: string): string => {
        for (const cat of suppressionCategories) {
            if (cat.items.includes(item)) {
                return cat.category;
            }
        }
        return 'OTHERS';
    };

    const handleSubmit = async () => {
        if (!location) {
            alert("Waiting for location...");
            return;
        }
        setSubmitting(true);

        // Build items array with proper category mapping
        const items = selectedItems.map(item => ({
            category: getCategoryForItem(item),
            itemType: item,
        }));

        await onSubmit({
            type,
            description,
            latitude: location.latitude,
            longitude: location.longitude,
            items: items.length > 0 ? items : undefined,
        });
        setSubmitting(false);
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-end justify-center">
            <div className="w-full max-w-lg bg-[#0a0a0a] rounded-t-3xl max-h-[90vh] overflow-y-auto border-t border-white/10 shadow-2xl shadow-black">
                {/* Header */}
                <div className="sticky top-0 bg-[#0a0a0a]/90 backdrop-blur-md px-6 py-5 border-b border-white/5 flex items-center justify-between z-10">
                    <h2 className={`text-xl font-bold tracking-tight ${type === 'PREVENTION' ? 'text-amber-500' : 'text-rose-500'}`}>
                        {type === 'PREVENTION' ? 'PREVENTION REPORT' : 'SUPPRESSION REPORT'}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition text-gray-400">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Location info */}
                    <div className="flex items-center gap-3 text-xs font-mono text-gray-400 bg-white/5 p-4 rounded-xl border border-white/5">
                        <Navigation className="w-4 h-4 text-emerald-500" />
                        <span>
                            {location
                                ? `LAT: ${location.latitude.toFixed(6)} | LNG: ${location.longitude.toFixed(6)}`
                                : 'ACQUIRING SATELLITE SIGNAL...'}
                        </span>
                    </div>

                    {type === 'SUPPRESSION' && (
                        <div className="space-y-4">
                            {suppressionCategories.map((category) => (
                                <div key={category.category} className="space-y-2">
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">{category.title}</p>
                                    <div className="flex flex-wrap gap-2">
                                        {category.items.map((item) => (
                                            <button
                                                key={item}
                                                onClick={() => toggleItem(item)}
                                                className={`px-4 py-2 rounded-lg text-xs font-bold transition border ${selectedItems.includes(item)
                                                    ? 'bg-white text-black border-white'
                                                    : 'bg-white/5 text-gray-400 border-white/5 hover:border-white/20'
                                                    }`}
                                            >
                                                {item}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Description */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 pl-1">
                            Details / Remarks
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-white/20 transition resize-none"
                            rows={3}
                            placeholder="Type details here..."
                        />
                    </div>

                    {/* Media Buttons */}
                    <div className="grid grid-cols-2 gap-3">
                        <button className="py-4 rounded-xl bg-white/5 hover:bg-white/10 flex flex-col items-center justify-center gap-2 transition border border-white/5 group">
                            <Camera className="w-5 h-5 text-gray-400 group-hover:text-white" />
                            <span className="text-[10px] uppercase font-bold text-gray-500 group-hover:text-white">Photo</span>
                        </button>
                        <button className="py-4 rounded-xl bg-white/5 hover:bg-white/10 flex flex-col items-center justify-center gap-2 transition border border-white/5 group">
                            <Mic className="w-5 h-5 text-gray-400 group-hover:text-white" />
                            <span className="text-[10px] uppercase font-bold text-gray-500 group-hover:text-white">Voice Note</span>
                        </button>
                    </div>

                    {/* Submit */}
                    <button
                        onClick={handleSubmit}
                        disabled={submitting || !location}
                        className="w-full py-5 rounded-2xl bg-white hover:bg-gray-200 text-black font-bold text-lg flex items-center justify-center gap-3 transition shadow-xl shadow-white/5 disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                    >
                        {submitting ? (
                            <Loader className="w-6 h-6 animate-spin" />
                        ) : (
                            <>
                                <Send className="w-6 h-6" />
                                <span>SUBMIT REPORT</span>
                            </>
                        )}
                    </button>

                    <div className="h-4"></div>
                </div>
            </div>
        </div>
    );
}

// SOS Modal Component
function SOSModal({
    location,
    loading,
    onClose,
    onSubmit,
}: {
    location: Location | null;
    loading: boolean;
    onClose: () => void;
    onSubmit: (type: string, message?: string) => void;
}) {
    const [message, setMessage] = useState('');
    const [selectedType, setSelectedType] = useState('EMERGENCY');

    const sosTypes = [
        { type: 'EMERGENCY', label: 'ฉุกเฉินทั่วไป', emoji: '🚨', color: 'red' },
        { type: 'UNDER_ATTACK', label: 'ถูกโจมตี', emoji: '⚠️', color: 'rose' },
        { type: 'NEED_BACKUP', label: 'ต้องการกำลังเสริม', emoji: '🆘', color: 'orange' },
        { type: 'MEDICAL', label: 'เหตุทางการแพทย์', emoji: '🏥', color: 'green' },
        { type: 'SUSPECT_PURSUIT', label: 'ไล่ล่าผู้ต้องสงสัย', emoji: '🏃', color: 'purple' },
    ];

    return (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-[#0a0a0a] rounded-2xl border border-red-500/30 shadow-2xl shadow-red-900/20 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-red-600 to-rose-700 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Siren className="w-7 h-7 text-white animate-pulse" />
                        <h2 className="text-xl font-bold text-white">SOS EMERGENCY</h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition">
                        <X className="w-5 h-5 text-white" />
                    </button>
                </div>

                <div className="p-6 space-y-5">
                    {/* Location */}
                    <div className="flex items-center gap-2 text-xs font-mono text-gray-400 bg-white/5 p-3 rounded-xl">
                        <Navigation className="w-4 h-4 text-red-500" />
                        {location ? `${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}` : 'กำลังหาตำแหน่ง...'}
                    </div>

                    {/* SOS Type Selection */}
                    <div className="space-y-2">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">ประเภทเหตุฉุกเฉิน</p>
                        <div className="grid grid-cols-1 gap-2">
                            {sosTypes.map((sos) => (
                                <button
                                    key={sos.type}
                                    onClick={() => setSelectedType(sos.type)}
                                    className={`py-3 px-4 rounded-xl text-left flex items-center gap-3 transition border ${selectedType === sos.type
                                            ? 'bg-red-600/30 border-red-500 text-white'
                                            : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20'
                                        }`}
                                >
                                    <span className="text-2xl">{sos.emoji}</span>
                                    <span className="font-bold">{sos.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Message */}
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">ข้อความเพิ่มเติม</p>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500/50 resize-none"
                            rows={2}
                            placeholder="รายละเอียดเพิ่มเติม (ไม่บังคับ)..."
                        />
                    </div>

                    {/* Submit */}
                    <button
                        onClick={() => onSubmit(selectedType, message)}
                        disabled={loading || !location}
                        className="w-full py-5 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800 text-white font-bold text-lg flex items-center justify-center gap-3 transition disabled:opacity-50"
                    >
                        {loading ? (
                            <Loader className="w-6 h-6 animate-spin" />
                        ) : (
                            <>
                                <Siren className="w-6 h-6" />
                                ส่งสัญญาณ SOS
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

// POI Modal Component
function POIModal({
    location,
    onClose,
    onSubmit,
}: {
    location: Location | null;
    onClose: () => void;
    onSubmit: (data: { name: string; category: string; description?: string }) => void;
}) {
    const [name, setName] = useState('');
    const [category, setCategory] = useState('BANK');
    const [description, setDescription] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const categories = [
        { value: 'BANK', label: 'ธนาคาร', emoji: '🏦' },
        { value: 'GOLD_SHOP', label: 'ร้านทอง', emoji: '💍' },
        { value: 'ATM', label: 'ตู้ ATM', emoji: '🏧' },
        { value: 'CONVENIENCE', label: 'ร้านสะดวกซื้อ', emoji: '🏪' },
        { value: 'SCHOOL', label: 'โรงเรียน', emoji: '🏫' },
        { value: 'TEMPLE', label: 'วัด', emoji: '🛕' },
        { value: 'HOSPITAL', label: 'โรงพยาบาล', emoji: '🏥' },
        { value: 'VIP_RESIDENCE', label: 'บ้านบุคคลสำคัญ', emoji: '🏠' },
        { value: 'OTHER', label: 'อื่นๆ', emoji: '📍' },
    ];

    const handleSubmit = async () => {
        if (!name.trim()) {
            alert('กรุณาระบุชื่อสถานที่');
            return;
        }
        setSubmitting(true);
        await onSubmit({ name, category, description });
        setSubmitting(false);
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-end justify-center">
            <div className="w-full max-w-lg bg-[#0a0a0a] rounded-t-3xl max-h-[90vh] overflow-y-auto border-t border-purple-500/30 shadow-2xl">
                {/* Header */}
                <div className="sticky top-0 bg-[#0a0a0a]/90 backdrop-blur-md px-6 py-5 border-b border-white/5 flex items-center justify-between z-10">
                    <div className="flex items-center gap-3">
                        <Building2 className="w-6 h-6 text-purple-400" />
                        <h2 className="text-xl font-bold text-purple-400">บันทึกจุดสำคัญ</h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition text-gray-400">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 space-y-5">
                    {/* Location */}
                    <div className="flex items-center gap-2 text-xs font-mono text-gray-400 bg-white/5 p-3 rounded-xl">
                        <Navigation className="w-4 h-4 text-purple-500" />
                        {location ? `${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}` : 'กำลังหาตำแหน่ง...'}
                    </div>

                    {/* Name */}
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">ชื่อสถานที่ *</p>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                            placeholder="เช่น ธนาคารกรุงไทย สาขาทองหล่อ"
                        />
                    </div>

                    {/* Category */}
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">ประเภท</p>
                        <div className="grid grid-cols-3 gap-2">
                            {categories.map((cat) => (
                                <button
                                    key={cat.value}
                                    onClick={() => setCategory(cat.value)}
                                    className={`py-3 px-2 rounded-xl flex flex-col items-center gap-1 transition border ${category === cat.value
                                            ? 'bg-purple-600/30 border-purple-500 text-white'
                                            : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20'
                                        }`}
                                >
                                    <span className="text-xl">{cat.emoji}</span>
                                    <span className="text-[10px] font-bold">{cat.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">รายละเอียด</p>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none"
                            rows={2}
                            placeholder="รายละเอียดเพิ่มเติม (ไม่บังคับ)..."
                        />
                    </div>

                    {/* Submit */}
                    <button
                        onClick={handleSubmit}
                        disabled={submitting || !location || !name.trim()}
                        className="w-full py-5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-lg flex items-center justify-center gap-3 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {submitting ? (
                            <Loader className="w-6 h-6 animate-spin" />
                        ) : (
                            <>
                                <Plus className="w-6 h-6" />
                                บันทึกจุดสำคัญ
                            </>
                        )}
                    </button>

                    <div className="h-4"></div>
                </div>
            </div>
        </div>
    );
}
