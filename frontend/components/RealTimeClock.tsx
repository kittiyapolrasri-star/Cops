'use client';

import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

export default function RealTimeClock() {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => {
            setTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('th-TH', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
        });
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('th-TH', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    return (
        <div className="bg-black/70 backdrop-blur-xl rounded-xl px-3 py-2 border border-cyan-500/30 flex items-center gap-2 shadow-lg shadow-cyan-900/20">
            <Clock className="w-4 h-4 text-cyan-400" />
            <div>
                <p className="text-base font-bold text-white font-mono tracking-wider">{formatTime(time)}</p>
                <p className="text-[9px] text-gray-500 uppercase tracking-wider">{formatDate(time)}</p>
            </div>
        </div>
    );
}
