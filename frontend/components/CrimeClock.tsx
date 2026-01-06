'use client';

import { useEffect, useState } from 'react';
import { crimeApi } from '@/lib/api';
import { Clock, Calendar, TrendingUp, AlertTriangle } from 'lucide-react';

interface CrimeClockData {
    hourly: { hour: number; count: number; types: Record<string, number> }[];
    daily: { day: number; dayName: string; count: number }[];
    timePeriods: { name: string; range: string; count: number }[];
    peakHours: number[];
    peakDays: string[];
    total: number;
    periodMonths: number;
}

interface CrimeClockProps {
    stationId?: string;
    months?: number;
    className?: string;
}

export default function CrimeClock({ stationId, months = 6, className = '' }: CrimeClockProps) {
    const [data, setData] = useState<CrimeClockData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, [stationId, months]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const res = await crimeApi.getCrimeClock({ stationId, months });
            setData(res.data);
        } catch (error) {
            console.error('Failed to fetch crime clock data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading || !data) {
        return (
            <div className={`bg-gray-900/50 rounded-xl p-6 ${className}`}>
                <div className="flex items-center justify-center h-40">
                    <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                </div>
            </div>
        );
    }

    const maxHourCount = Math.max(...data.hourly.map(h => h.count), 1);
    const maxDayCount = Math.max(...data.daily.map(d => d.count), 1);
    const maxPeriodCount = Math.max(...data.timePeriods.map(p => p.count), 1);

    const getIntensityColor = (count: number, max: number) => {
        const ratio = count / max;
        if (ratio > 0.7) return 'bg-red-500';
        if (ratio > 0.4) return 'bg-orange-500';
        if (ratio > 0.1) return 'bg-yellow-500';
        return 'bg-green-500';
    };

    const formatHour = (hour: number) => {
        return `${hour.toString().padStart(2, '0')}:00`;
    };

    return (
        <div className={`bg-gray-900/50 rounded-xl p-6 ${className}`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-cyan-400" />
                    <h3 className="font-bold text-white">นาฬิกาอาชญากรรม</h3>
                </div>
                <span className="text-xs text-gray-500">{data.periodMonths} เดือน | {data.total} คดี</span>
            </div>

            {/* Time Periods Grid */}
            <div className="grid grid-cols-4 gap-2 mb-6">
                {data.timePeriods.map((period) => (
                    <div
                        key={period.name}
                        className="relative bg-gray-800 rounded-lg p-3 text-center overflow-hidden"
                    >
                        <div
                            className={`absolute bottom-0 left-0 right-0 ${getIntensityColor(period.count, maxPeriodCount)} opacity-30`}
                            style={{ height: `${(period.count / maxPeriodCount) * 100}%` }}
                        />
                        <div className="relative z-10">
                            <p className="text-lg font-bold text-white">{period.count}</p>
                            <p className="text-xs text-gray-400">{period.name}</p>
                            <p className="text-[10px] text-gray-500">{period.range}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Hourly Distribution */}
            <div className="mb-6">
                <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> รายชั่วโมง (24 ชม.)
                </p>
                <div className="flex gap-0.5 h-16">
                    {data.hourly.map((h) => (
                        <div
                            key={h.hour}
                            className="flex-1 flex flex-col justify-end group relative"
                        >
                            <div
                                className={`w-full rounded-t ${getIntensityColor(h.count, maxHourCount)} transition-all group-hover:opacity-80`}
                                style={{ height: `${Math.max((h.count / maxHourCount) * 100, 5)}%` }}
                            />
                            {/* Tooltip */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                                <div className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-[10px] whitespace-nowrap">
                                    <p className="text-white font-bold">{formatHour(h.hour)}</p>
                                    <p className="text-gray-400">{h.count} คดี</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="flex justify-between text-[9px] text-gray-500 mt-1">
                    <span>00:00</span>
                    <span>06:00</span>
                    <span>12:00</span>
                    <span>18:00</span>
                    <span>24:00</span>
                </div>
            </div>

            {/* Daily Distribution */}
            <div className="mb-6">
                <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> รายวัน
                </p>
                <div className="flex gap-1">
                    {data.daily.map((d) => (
                        <div key={d.day} className="flex-1 text-center">
                            <div className="mb-1">
                                <div
                                    className={`h-8 rounded ${getIntensityColor(d.count, maxDayCount)}`}
                                    style={{ opacity: 0.3 + (d.count / maxDayCount) * 0.7 }}
                                />
                            </div>
                            <p className="text-[10px] text-gray-400">{d.dayName}</p>
                            <p className="text-xs text-white font-bold">{d.count}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Insights */}
            <div className="bg-gray-800/50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" /> สรุป
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-400" />
                        <div>
                            <p className="text-gray-400">ช่วงเวลาเสี่ยง</p>
                            <p className="text-white font-bold">
                                {data.peakHours.map(h => formatHour(h)).join(', ')}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-orange-400" />
                        <div>
                            <p className="text-gray-400">วันที่เกิดมาก</p>
                            <p className="text-white font-bold">
                                {data.peakDays.join(', ')}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
