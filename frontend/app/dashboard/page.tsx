'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/store/auth';
import { api, checkinApi, incidentApi, riskzoneApi, trackingApi } from '@/lib/api';
import {
    Users,
    MapPin,
    FileText,
    AlertTriangle,
    CheckCircle,
    Radio,
    Bell,
    Activity,
    Shield,
    Layers,
} from 'lucide-react';
import Image from 'next/image';
import dynamic from 'next/dynamic';

const DashboardMap = dynamic(() => import('@/components/DashboardMap'), { ssr: false });
const FeedStream = dynamic(() => import('@/components/FeedStream'), { ssr: false });
const NotificationBell = dynamic(() => import('@/components/NotificationBell'), { ssr: false });

export default function DashboardPage() {
    const { user } = useAuthStore();
    const [currentTime, setCurrentTime] = useState(new Date());

    // Real stats state
    const [stats, setStats] = useState({
        activePatrols: 0,
        checkinsToday: 0,
        incidentsToday: 0,
        riskZones: 0,
    });

    // Fetch real data
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [activePatrols, incidentsStats, riskZones, checkins] = await Promise.all([
                    trackingApi.getActivePatrols(),
                    incidentApi.getStats(),
                    riskzoneApi.getAll(),
                    checkinApi.getRecent(undefined, 100) // Getting recent checkins to count for today roughly
                ]);

                // Simple mock counting for checkins today since stats endpoint might not exist yet
                const todayCheckins = checkins.data.filter((c: any) => {
                    const date = new Date(c.timestamp);
                    const today = new Date();
                    return date.getDate() === today.getDate() && date.getMonth() === today.getMonth();
                }).length;

                setStats({
                    activePatrols: activePatrols.data.length || 0,
                    checkinsToday: todayCheckins, // Using calculated value
                    incidentsToday: incidentsStats.data?.total || 0,
                    riskZones: riskZones.data.length || 0,
                });
            } catch (error) {
                console.error("Failed to fetch dashboard stats", error);
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 30000); // Refresh every 30s
        return () => clearInterval(interval);
    }, []);

    // Timer
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const statCards = [
        {
            title: 'ACTIVE PATROLS',
            value: stats.activePatrols,
            icon: Radio,
            color: 'text-emerald-400',
            border: 'border-emerald-500/20',
            bg_glow: 'shadow-[0_0_20px_-5px_rgba(52,211,153,0.1)]',
        },
        {
            title: 'CHECK-INS',
            value: stats.checkinsToday,
            icon: MapPin,
            color: 'text-sky-400',
            border: 'border-sky-500/20',
            bg_glow: 'shadow-[0_0_20px_-5px_rgba(56,189,248,0.1)]',
        },
        {
            title: 'INCIDENTS',
            value: stats.incidentsToday,
            icon: AlertTriangle,
            color: 'text-rose-400',
            border: 'border-rose-500/20',
            bg_glow: 'shadow-[0_0_20px_-5px_rgba(251,113,133,0.1)]',
        },
        {
            title: 'RISK ZONES',
            value: stats.riskZones,
            icon: Shield,
            color: 'text-amber-400',
            border: 'border-amber-500/20',
            bg_glow: 'shadow-[0_0_20px_-5px_rgba(251,191,36,0.1)]',
        },
    ];

    return (
        <div className="min-h-screen bg-[#050505] text-gray-200 font-sans selection:bg-gray-800">
            {/* Header */}
            <header className="px-8 py-5 border-b border-white/5 bg-[#050505]/80 backdrop-blur-md sticky top-0 z-40">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">

                        <div>
                            <h1 className="text-2xl font-bold text-white tracking-tight">C.O.P.S. <span className="font-light text-gray-500">Center</span></h1>
                            <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold opacity-70">Command Operations</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-8">
                        {/* Notification Bell */}
                        <NotificationBell />

                        {/* Live Status */}
                        <div className="flex items-center gap-3">
                            <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                            </span>
                            <span className="text-sm font-bold text-emerald-500 tracking-wider">SYSTEM ONLINE</span>
                        </div>

                        <div className="h-8 w-px bg-white/10"></div>

                        {/* Time */}
                        <div className="text-right">
                            <p className="text-2xl font-bold text-white font-mono leading-none">
                                {currentTime.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                            <p className="text-xs text-gray-500 font-medium uppercase mt-1">
                                {currentTime.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </p>
                        </div>

                        <div className="h-8 w-px bg-white/10"></div>

                        {/* Profile */}
                        <div className="flex items-center gap-4">
                            <div className="text-right hidden md:block">
                                <p className="text-sm font-bold text-white">{user?.rank} {user?.firstName}</p>
                                <p className="text-xs text-gray-500">{user?.role}</p>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-gray-900 border border-white/10 flex items-center justify-center">
                                <span className="text-sm font-bold text-white">{user?.firstName?.charAt(0)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="p-4 space-y-4">
                {/* KPI Cards */}
                <div className="grid grid-cols-4 gap-6">
                    {statCards.map((stat, index) => (
                        <div
                            key={index}
                            className={`glass-card p-6 rounded-2xl relative overflow-hidden group hover:border-white/20 ${stat.bg_glow}`}
                        >
                            <div className="relative z-10 flex items-start justify-between">
                                <div>
                                    <p className="text-xs text-gray-500 font-bold tracking-widest mb-2">{stat.title}</p>
                                    <p className="text-4xl font-bold text-white">{stat.value}</p>
                                </div>
                                <div className={`p-3 rounded-xl bg-white/5 border border-white/5 ${stat.color}`}>
                                    <stat.icon className="w-6 h-6" />
                                </div>
                            </div>
                            {/* Decorative gradient */}
                            <div className={`absolute -bottom-10 -right-10 w-32 h-32 bg-gradient-to-br from-white/5 to-transparent rounded-full blur-2xl group-hover:bg-white/10 transition duration-500`} />
                        </div>
                    ))}
                </div>

                {/* Ops Grid - Map 80%, Feed 20% */}
                <div className="flex gap-4 h-[calc(100vh-280px)] min-h-[500px]">
                    {/* Map - 80% */}
                    <div className="flex-[4] glass-panel rounded-xl overflow-hidden flex flex-col relative">
                        <div className="absolute top-3 left-3 z-[400] bg-black/80 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-lg flex items-center gap-2">
                            <Activity className="w-3 h-3 text-emerald-500 animate-pulse" />
                            <span className="text-[10px] font-bold text-white tracking-wide">LIVE SURVEILLANCE</span>
                        </div>

                        <div className="flex-1 bg-[#111]">
                            <DashboardMap />
                        </div>
                    </div>

                    {/* Feed - 20% */}
                    <div className="w-72 flex-shrink-0 glass-panel rounded-xl flex flex-col overflow-hidden">
                        <div className="p-3 border-b border-white/5 bg-white/[0.02]">
                            <h3 className="text-xs font-bold text-white tracking-wider flex items-center gap-2">
                                <Layers className="w-3 h-3 text-gray-400" />
                                INCIDENT FEED
                            </h3>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            <FeedStream />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
