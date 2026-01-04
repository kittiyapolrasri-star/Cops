'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/lib/store/auth';
import { checkinApi, incidentApi, riskzoneApi, trackingApi } from '@/lib/api';
import { Activity, Clock } from 'lucide-react';
import dynamic from 'next/dynamic';

// Dynamic imports (no SSR for map components)
const DashboardMap = dynamic(() => import('@/components/DashboardMap'), { ssr: false });
const FloatingStatsHUD = dynamic(() => import('@/components/FloatingStatsHUD'), { ssr: false });
const PriorityFeed = dynamic(() => import('@/components/PriorityFeed'), { ssr: false });
const NotificationBell = dynamic(() => import('@/components/NotificationBell'), { ssr: false });

export default function DashboardPage() {
    const { user } = useAuthStore();
    const [currentTime, setCurrentTime] = useState(new Date());
    const [feedCollapsed, setFeedCollapsed] = useState(false);
    const [mapRef, setMapRef] = useState<any>(null);

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
                    checkinApi.getRecent(undefined, 100)
                ]);

                const todayCheckins = checkins.data.filter((c: any) => {
                    const date = new Date(c.timestamp);
                    const today = new Date();
                    return date.getDate() === today.getDate() && date.getMonth() === today.getMonth();
                }).length;

                setStats({
                    activePatrols: activePatrols.data.length || 0,
                    checkinsToday: todayCheckins,
                    incidentsToday: incidentsStats.data?.total || 0,
                    riskZones: riskZones.data.length || 0,
                });
            } catch (error) {
                console.error("Failed to fetch dashboard stats", error);
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, []);

    // Timer
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Auto-fly handler for PriorityFeed
    const handleFlyTo = useCallback((lat: number, lng: number) => {
        // This will be passed to the map component
        // For now, we'll emit a custom event that the map can listen to
        const event = new CustomEvent('flyToLocation', { detail: { lat, lng, zoom: 15 } });
        window.dispatchEvent(event);
    }, []);

    return (
        <div className="h-[calc(100vh-64px)] w-full relative overflow-hidden bg-[#050505]">
            {/* ===== FULL-SCREEN MAP (God's Eye View) ===== */}
            <div className="absolute inset-0">
                <DashboardMap />
            </div>

            {/* ===== FLOATING STATS HUD (Top Center) ===== */}
            <FloatingStatsHUD stats={stats} />

            {/* GOD'S EYE VIEW badge removed - DashboardMap has its own top-left filter bar */}

            {/* ===== HEADER INFO (Top Right) ===== */}
            <div className="absolute top-4 right-4 z-[500] flex items-center gap-3">
                {/* Notification Bell */}
                <div className="bg-black/70 backdrop-blur-xl rounded-xl p-2 border border-white/10">
                    <NotificationBell />
                </div>

                {/* User Profile */}
                <div className="bg-black/70 backdrop-blur-xl rounded-xl px-4 py-2 border border-white/10 flex items-center gap-3">
                    <div className="text-right">
                        <p className="text-sm font-bold text-white">{user?.rank} {user?.firstName}</p>
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider">{user?.role}</p>
                    </div>
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-sky-500 flex items-center justify-center">
                        <span className="text-sm font-bold text-white">{user?.firstName?.charAt(0)}</span>
                    </div>
                </div>
            </div>

            {/* ===== PRIORITY FEED (Bottom Right - Collapsible) ===== */}
            <PriorityFeed
                onFlyTo={handleFlyTo}
                isCollapsed={feedCollapsed}
                onToggle={() => setFeedCollapsed(!feedCollapsed)}
            />

            {/* Bottom-left info removed - DashboardMap has province info panel */}
        </div>
    );
}
