'use client';

import { FileText } from 'lucide-react';

export default function IncidentsPage() {
    return (
        <div className="min-h-screen bg-[#050505] p-8 text-white flex flex-col items-center justify-center border border-dashed border-white/10 m-4 rounded-3xl">
            <div className="p-4 bg-rose-500/10 rounded-full mb-4">
                <FileText className="w-12 h-12 text-rose-500" />
            </div>
            <h1 className="text-2xl font-bold tracking-widest text-white mb-2">INCIDENT LOGS</h1>
            <p className="text-gray-500 text-sm">Advanced filtering and report generation coming soon.</p>
        </div>
    );
}
