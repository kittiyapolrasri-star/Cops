'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth';
import {
    MapPin,
    Radio,
    Camera,
    Mic,
    CheckCircle,
    AlertTriangle,
    Shield,
    Navigation,
    Clock,
    X,
    Send,
    Plus,
    ChevronRight,
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

    const startPatrol = useCallback(() => {
        if ('geolocation' in navigator) {
            const id = navigator.geolocation.watchPosition(
                (position) => {
                    setLocation({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        accuracy: position.coords.accuracy,
                        timestamp: new Date(),
                    });
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
        } else {
            alert('เบราว์เซอร์นี้ไม่รองรับ Geolocation');
        }
    }, []);

    const endPatrol = useCallback(() => {
        if (watchId !== null) {
            navigator.geolocation.clearWatch(watchId);
            setWatchId(null);
        }
        setIsPatrolling(false);
        setPatrolStartTime(null);
        setPatrolTime('00:00:00');
    }, [watchId]);

    const handleCheckIn = () => {
        if (location) {
            setCheckIns(prev => prev + 1);
            // TODO: Call API to create check-in
            alert('เช็คอินสำเร็จ!');
        } else {
            alert('ไม่พบตำแหน่ง กรุณารอสักครู่');
        }
    };

    if (!isAuthenticated) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-blue-900 to-indigo-900 px-4 py-3 shadow-lg">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
                            <Shield className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium">{user?.rank} {user?.firstName}</p>
                            <p className="text-xs text-blue-300">สายตรวจ</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {isPatrolling && (
                            <div className="flex items-center gap-2 px-3 py-1 bg-green-600 rounded-full text-sm">
                                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                                <span>LIVE</span>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* Map area */}
            <div className="pt-16 h-[50vh]">
                <PatrolMap location={location} />
            </div>

            {/* Status panel */}
            <div className="bg-gray-800 border-t border-gray-700 p-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                        <p className="text-2xl font-bold text-blue-400">{patrolTime}</p>
                        <p className="text-xs text-gray-400">เวลาลาดตระเวน</p>
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-green-400">{checkIns}</p>
                        <p className="text-xs text-gray-400">เช็คอินวันนี้</p>
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-yellow-400">
                            {location ? `±${Math.round(location.accuracy)}m` : '--'}
                        </p>
                        <p className="text-xs text-gray-400">ความแม่นยำ</p>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="p-4 space-y-4">
                {/* Patrol toggle */}
                <button
                    onClick={isPatrolling ? endPatrol : startPatrol}
                    className={`w-full py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-3 transition ${isPatrolling
                            ? 'bg-red-600 hover:bg-red-700'
                            : 'bg-green-600 hover:bg-green-700'
                        }`}
                >
                    <Radio className="w-6 h-6" />
                    {isPatrolling ? 'สิ้นสุดการลาดตระเวน' : 'เริ่มลาดตระเวน'}
                </button>

                {/* Check-in button */}
                <button
                    onClick={handleCheckIn}
                    disabled={!isPatrolling}
                    className="w-full py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                    <MapPin className="w-6 h-6" />
                    เช็คอินจุดตรวจ
                </button>

                {/* Incident Report buttons */}
                <div className="grid grid-cols-2 gap-4">
                    <button
                        onClick={() => { setIncidentType('PREVENTION'); setShowIncidentModal(true); }}
                        disabled={!isPatrolling}
                        className="py-4 rounded-xl font-medium flex flex-col items-center gap-2 bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                        <Camera className="w-6 h-6" />
                        <span>งานป้องกัน</span>
                    </button>
                    <button
                        onClick={() => { setIncidentType('SUPPRESSION'); setShowIncidentModal(true); }}
                        disabled={!isPatrolling}
                        className="py-4 rounded-xl font-medium flex flex-col items-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                        <AlertTriangle className="w-6 h-6" />
                        <span>งานปราบปราม</span>
                    </button>
                </div>
            </div>

            {/* Incident Modal */}
            {showIncidentModal && (
                <IncidentModal
                    type={incidentType!}
                    location={location}
                    onClose={() => { setShowIncidentModal(false); setIncidentType(null); }}
                    onSubmit={() => {
                        setShowIncidentModal(false);
                        setIncidentType(null);
                        alert('บันทึกรายงานสำเร็จ!');
                    }}
                />
            )}
        </div>
    );
}

// Incident Modal Component
function IncidentModal({
    type,
    location,
    onClose,
    onSubmit,
}: {
    type: 'PREVENTION' | 'SUPPRESSION';
    location: Location | null;
    onClose: () => void;
    onSubmit: () => void;
}) {
    const [description, setDescription] = useState('');
    const [selectedItems, setSelectedItems] = useState<string[]>([]);

    const suppressionCategories = [
        {
            category: 'TRAFFIC',
            title: '🚗 ยานพาหนะ',
            items: ['ไม่ติดแผ่นป้ายทะเบียน', 'ท่อไอเสียเสียงดัง', 'ดัดแปลงสภาพผิดกฎหมาย'],
        },
        {
            category: 'DRUGS',
            title: '💊 ยาเสพติด',
            items: ['ยาบ้า', 'ไอซ์', 'เค/ยาไอซ์', 'กัญชา', 'อื่นๆ'],
        },
        {
            category: 'WEAPONS',
            title: '🔫 อาวุธ',
            items: ['อาวุธมีด', 'ปืนไทยประดิษฐ์', 'ปืนมีทะเบียน', 'ปืนสงคราม'],
        },
        {
            category: 'OTHERS',
            title: '📦 อื่นๆ',
            items: ['สิ่งผิดกฎหมายอื่นๆ'],
        },
    ];

    const toggleItem = (item: string) => {
        setSelectedItems(prev =>
            prev.includes(item)
                ? prev.filter(i => i !== item)
                : [...prev, item]
        );
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-end justify-center">
            <div className="w-full max-w-lg bg-gray-800 rounded-t-2xl max-h-[80vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-gray-800 px-4 py-3 border-b border-gray-700 flex items-center justify-between">
                    <h2 className="text-lg font-semibold">
                        {type === 'PREVENTION' ? '📸 งานป้องกัน' : '⚠️ งานปราบปราม'}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-700 rounded-full">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-4 space-y-4">
                    {/* Location info */}
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Navigation className="w-4 h-4" />
                        <span>
                            {location
                                ? `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`
                                : 'กำลังหาตำแหน่ง...'}
                        </span>
                    </div>

                    {type === 'SUPPRESSION' && (
                        <>
                            <p className="text-sm text-gray-400">เลือกประเภทของกลาง:</p>
                            {suppressionCategories.map((category) => (
                                <div key={category.category} className="space-y-2">
                                    <p className="text-sm font-medium text-gray-300">{category.title}</p>
                                    <div className="flex flex-wrap gap-2">
                                        {category.items.map((item) => (
                                            <button
                                                key={item}
                                                onClick={() => toggleItem(item)}
                                                className={`px-3 py-1.5 rounded-full text-sm transition ${selectedItems.includes(item)
                                                        ? 'bg-blue-600 text-white'
                                                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                                    }`}
                                            >
                                                {selectedItems.includes(item) && <span className="mr-1">✓</span>}
                                                {item}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </>
                    )}

                    {/* Description */}
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">
                            {type === 'PREVENTION' ? 'รายละเอียดเหตุการณ์' : 'หมายเหตุ'}
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows={3}
                            placeholder="พิมพ์รายละเอียด..."
                        />
                    </div>

                    {/* Photo button */}
                    <button className="w-full py-3 rounded-lg bg-gray-700 hover:bg-gray-600 flex items-center justify-center gap-2 transition">
                        <Camera className="w-5 h-5" />
                        <span>ถ่ายรูป / แนบรูปภาพ</span>
                    </button>

                    {/* Voice button */}
                    <button className="w-full py-3 rounded-lg bg-gray-700 hover:bg-gray-600 flex items-center justify-center gap-2 transition">
                        <Mic className="w-5 h-5" />
                        <span>บันทึกเสียง (Speech-to-Text)</span>
                    </button>

                    {/* Submit */}
                    <button
                        onClick={onSubmit}
                        className="w-full py-4 rounded-xl bg-green-600 hover:bg-green-700 font-semibold flex items-center justify-center gap-2 transition"
                    >
                        <Send className="w-5 h-5" />
                        <span>ส่งรายงาน</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
