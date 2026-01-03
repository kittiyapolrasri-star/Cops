'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/store/auth';
import {
    Users,
    MapPin,
    FileText,
    AlertTriangle,
    TrendingUp,
    Clock,
    CheckCircle,
    Radio,
} from 'lucide-react';
import dynamic from 'next/dynamic';

// Dynamic import for map (no SSR)
const DashboardMap = dynamic(() => import('@/components/DashboardMap'), { ssr: false });
const FeedStream = dynamic(() => import('@/components/FeedStream'), { ssr: false });

export default function DashboardPage() {
    const { user } = useAuthStore();
    const [stats, setStats] = useState({
        activePatrols: 0,
        totalCheckIns: 0,
        incidents: 0,
        riskZones: 0,
    });

    // Mock stats for demo
    useEffect(() => {
        setStats({
            activePatrols: 5,
            totalCheckIns: 24,
            incidents: 3,
            riskZones: 8,
        });
    }, []);

    const statCards = [
        {
            title: 'สายตรวจออนไลน์',
            value: stats.activePatrols,
            icon: Radio,
            color: 'bg-green-500',
            change: '+2 จากเมื่อวาน',
        },
        {
            title: 'เช็คอินวันนี้',
            value: stats.totalCheckIns,
            icon: CheckCircle,
            color: 'bg-blue-500',
            change: '85% ของเป้าหมาย',
        },
        {
            title: 'รายงานเหตุการณ์',
            value: stats.incidents,
            icon: FileText,
            color: 'bg-yellow-500',
            change: '2 งานป้องกัน, 1 งานปราบ',
        },
        {
            title: 'พื้นที่เสี่ยง',
            value: stats.riskZones,
            icon: AlertTriangle,
            color: 'bg-red-500',
            change: '3 ต้องตรวจเพิ่ม',
        },
    ];

    return (
        <div className="space-y-6">
            {/* Welcome banner */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white shadow-lg">
                <h1 className="text-2xl font-bold mb-2">
                    สวัสดี, {user?.rank} {user?.firstName}
                </h1>
                <p className="text-blue-100">
                    ยินดีต้อนรับเข้าสู่ระบบสายตรวจอัจฉริยะ C.O.P.S. -
                    {new Date().toLocaleDateString('th-TH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
            </div>

            {/* Stats cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((stat, index) => (
                    <div
                        key={index}
                        className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm card-hover"
                    >
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{stat.title}</p>
                                <p className="text-3xl font-bold text-gray-800 dark:text-white mt-1">
                                    {stat.value}
                                </p>
                                <p className="text-xs text-gray-400 mt-2">{stat.change}</p>
                            </div>
                            <div className={`p-3 rounded-lg ${stat.color}`}>
                                <stat.icon className="w-6 h-6 text-white" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Main content area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Map */}
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-blue-500" />
                            แผนที่ยุทธวิธี (Live)
                        </h3>
                    </div>
                    <div className="h-[400px]">
                        <DashboardMap />
                    </div>
                </div>

                {/* Feed Stream */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                            <Radio className="w-5 h-5 text-green-500" />
                            กิจกรรมล่าสุด
                            <span className="w-2 h-2 rounded-full bg-green-500 pulse-live ml-2" />
                        </h3>
                    </div>
                    <div className="h-[400px] overflow-y-auto">
                        <FeedStream />
                    </div>
                </div>
            </div>

            {/* Frequency progress */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-blue-500" />
                    ความถี่การตรวจพื้นที่เสี่ยงวันนี้
                </h3>
                <div className="space-y-4">
                    {[
                        { name: 'ซอยเปลี่ยว ม.3', progress: 75, target: '3/4 ครั้ง', level: 'HIGH' },
                        { name: 'ตลาดสดหนองแค', progress: 100, target: '3/3 ครั้ง', level: 'MEDIUM' },
                        { name: 'สี่แยกไฟแดงหน้าธนาคาร', progress: 50, target: '1/2 ครั้ง', level: 'MEDIUM' },
                        { name: 'สวนสาธารณะ', progress: 100, target: '2/2 ครั้ง', level: 'LOW' },
                    ].map((zone, index) => (
                        <div key={index}>
                            <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                    <span className={`w-2 h-2 rounded-full ${zone.level === 'HIGH' ? 'bg-red-500' :
                                            zone.level === 'MEDIUM' ? 'bg-yellow-500' : 'bg-green-500'
                                        }`} />
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        {zone.name}
                                    </span>
                                </div>
                                <span className="text-xs text-gray-500">{zone.target}</span>
                            </div>
                            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all duration-500 ${zone.progress >= 100 ? 'bg-green-500' :
                                            zone.progress >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                                        }`}
                                    style={{ width: `${Math.min(zone.progress, 100)}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
