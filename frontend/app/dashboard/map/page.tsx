'use client';

import dynamic from 'next/dynamic';

// Dynamic import with SSR disabled for Leaflet
const FullMapContent = dynamic(
    () => import('@/components/FullMapContent'),
    {
        ssr: false,
        loading: () => (
            <div className="h-screen w-full bg-gray-950 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-emerald-500 font-mono tracking-widest text-sm">LOADING MAP...</p>
                </div>
            </div>
        )
    }
);

export default function FullMapPage() {
    return <FullMapContent />;
}
