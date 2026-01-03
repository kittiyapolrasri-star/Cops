'use client';

import { Shield, AlertTriangle, MapPin } from 'lucide-react';

export default function RiskZonesPage() {
    return (
        <div className="min-h-screen bg-[#050505] p-8 text-white">
            <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20">
                    <Shield className="w-8 h-8 text-amber-500" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white">Risk Zones Management</h1>
                    <p className="text-gray-400">Identify and manage high-risk areas for suppression operations.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Stats */}
                <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/5 backdrop-blur-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <AlertTriangle className="w-5 h-5 text-rose-500" />
                        <span className="text-sm font-medium text-gray-400">CRITICAL ZONES</span>
                    </div>
                    <p className="text-3xl font-bold">12</p>
                </div>

                <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/5 backdrop-blur-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <MapPin className="w-5 h-5 text-amber-500" />
                        <span className="text-sm font-medium text-gray-400">TOTAL MONITORED</span>
                    </div>
                    <p className="text-3xl font-bold">45</p>
                </div>

                <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/5 backdrop-blur-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <Shield className="w-5 h-5 text-emerald-500" />
                        <span className="text-sm font-medium text-gray-400">COVERAGE RATE</span>
                    </div>
                    <p className="text-3xl font-bold">88%</p>
                </div>
            </div>

            <div className="mt-8 p-12 rounded-2xl border border-dashed border-white/10 flex flex-col items-center justify-center text-center bg-white/[0.01]">
                <Shield className="w-16 h-16 text-gray-600 mb-4 opacity-50" />
                <h3 className="text-xl font-bold text-gray-500 mb-2">Interactive Map System</h3>
                <p className="text-gray-600 max-w-md">The advanced risk zone polygon editor is currently under development. Please check back in Phase 2.</p>
            </div>
        </div>
    );
}
