'use client';

import { Radio } from 'lucide-react';

export default function StatsPage() {
    return (
        <div className="min-h-screen bg-[#050505] p-8 text-white flex flex-col items-center justify-center border border-dashed border-white/10 m-4 rounded-3xl">
            <div className="p-4 bg-sky-500/10 rounded-full mb-4">
                <Radio className="w-12 h-12 text-sky-500" />
            </div>
            <h1 className="text-2xl font-bold tracking-widest text-white mb-2">ANALYTICS CENTER</h1>
            <p className="text-gray-500 text-sm">Detailed charts and performance metrics module.</p>
        </div>
    );
}
