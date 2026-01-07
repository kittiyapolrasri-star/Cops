'use client';

import { Radio, MapPin, AlertTriangle, Shield, Clock, Target } from 'lucide-react';

interface FloatingStatsHUDProps {
    stats: {
        activePatrols: number;
        checkinsToday: number;
        incidentsToday: number;
        riskZones: number;
    };
}

export default function FloatingStatsHUD({ stats }: FloatingStatsHUDProps) {
    const cards = [
        {
            label: 'สายตรวจ',
            value: stats.activePatrols,
            icon: Radio,
            color: 'emerald',
            subLabel: 'Active'
        },
        {
            label: 'เช็คอิน',
            value: stats.checkinsToday,
            icon: MapPin,
            color: 'sky',
            subLabel: 'Today'
        },
        {
            label: 'เหตุการณ์',
            value: stats.incidentsToday,
            icon: AlertTriangle,
            color: 'rose',
            subLabel: 'Reported'
        },
        {
            label: 'จุดเสี่ยง',
            value: stats.riskZones,
            icon: Shield,
            color: 'amber',
            subLabel: 'Zones'
        },
    ];

    const getColorClasses = (color: string) => {
        const colors: Record<string, { text: string; bg: string; border: string; glow: string }> = {
            emerald: {
                text: 'text-emerald-400',
                bg: 'bg-emerald-500/10',
                border: 'border-emerald-500/30',
                glow: 'shadow-emerald-500/20'
            },
            sky: {
                text: 'text-sky-400',
                bg: 'bg-sky-500/10',
                border: 'border-sky-500/30',
                glow: 'shadow-sky-500/20'
            },
            rose: {
                text: 'text-rose-400',
                bg: 'bg-rose-500/10',
                border: 'border-rose-500/30',
                glow: 'shadow-rose-500/20'
            },
            amber: {
                text: 'text-amber-400',
                bg: 'bg-amber-500/10',
                border: 'border-amber-500/30',
                glow: 'shadow-amber-500/20'
            },
        };
        return colors[color] || colors.emerald;
    };

    return (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[450] flex gap-2">
            {cards.map((card, index) => {
                const colors = getColorClasses(card.color);
                return (
                    <div
                        key={index}
                        className={`
                            bg-black/60 backdrop-blur-xl rounded-xl px-4 py-3
                            border ${colors.border}
                            shadow-lg ${colors.glow}
                            hover:bg-black/70 transition-all duration-300
                            hover:scale-105 cursor-default
                            min-w-[100px]
                        `}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${colors.bg}`}>
                                <card.icon className={`w-4 h-4 ${colors.text}`} />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-white leading-none">{card.value}</p>
                                <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider mt-0.5">
                                    {card.label}
                                </p>
                            </div>
                        </div>
                    </div>
                );
            })}

            {/* Live Indicator */}
            <div className="bg-black/60 backdrop-blur-xl rounded-xl px-4 py-3 border border-emerald-500/30 flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <span className="text-xs font-bold text-emerald-400 tracking-wider">LIVE</span>
            </div>
        </div>
    );
}
