'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { trackingApi, riskzoneApi } from '@/lib/api';

// --- ICONS ---
const createPatrolIcon = (rank: string) => {
    // Neon Cyberpunk Marker
    return new L.DivIcon({
        html: `<div class="relative group">
       <div class="w-10 h-10 bg-black/60 backdrop-blur-md rounded-full border-[3px] border-[#00ffff] shadow-[0_0_15px_#00ffff] flex items-center justify-center transform transition-transform group-hover:scale-110">
         <div class="w-3 h-3 bg-[#00ffff] rounded-full animate-pulse shadow-[0_0_10px_#00ffff]"></div>
       </div>
       <div class="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-black/90 px-3 py-1 rounded border border-[#00ffff]/30 shadow-[0_0_10px_rgba(0,255,255,0.2)]">
         <span class="text-[10px] font-bold text-[#00ffff] tracking-widest whitespace-nowrap drop-shadow-[0_0_5px_rgba(0,255,255,0.5)]">
           ${rank}
         </span>
       </div>
     </div>`,
        className: '',
        iconSize: [40, 40],
        iconAnchor: [20, 20],
        popupAnchor: [0, -25],
    });
};

const getRiskColor = (level: string) => {
    switch (level) {
        case 'CRITICAL': return '#ff0055'; // Neon Red/Pink
        case 'HIGH': return '#ff5500'; // Neon Orange
        case 'MEDIUM': return '#ffcc00'; // Neon Yellow
        case 'LOW': return '#00ffcc'; // Neon Cyan
        default: return '#888888';
    }
};

function MapController({ center }: { center: [number, number] }) {
    const map = useMap();
    useEffect(() => {
        // Only fly to if center changes significantly
        map.flyTo(center, map.getZoom());
    }, [center, map]);
    return null;
}

export default function DashboardMap() {
    const [patrols, setPatrols] = useState<any[]>([]);
    const [riskZones, setRiskZones] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Default center (Saraburi / Nongkhae)
    const [center, setCenter] = useState<[number, number]>([14.3378, 100.8657]);

    const fetchData = async () => {
        try {
            const [patrolRes, riskRes] = await Promise.all([
                trackingApi.getActivePatrols(),
                riskzoneApi.getAll()
            ]);

            if (patrolRes.data) setPatrols(patrolRes.data);
            if (riskRes.data) setRiskZones(riskRes.data);
        } catch (err) {
            console.error("Map data fetch error", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 10000); // 10s Real-time update
        return () => clearInterval(interval);
    }, []);

    if (loading && patrols.length === 0 && riskZones.length === 0) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-[#0a0a0a]">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-xs text-emerald-500 font-mono tracking-widest">INITIALIZING SATELLITE LINK...</p>
                </div>
            </div>
        );
    }

    return (
        <MapContainer
            center={center}
            zoom={14}
            className="w-full h-full"
            zoomControl={false}
            style={{ background: '#0a0a0a' }}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                maxZoom={20}
            />

            {/* Risk Zones */}
            {riskZones.map((zone) => (
                <Circle
                    key={zone.id}
                    center={[zone.latitude, zone.longitude]}
                    radius={zone.radius || 100}
                    pathOptions={{
                        color: getRiskColor(zone.riskLevel),
                        fillColor: getRiskColor(zone.riskLevel),
                        fillOpacity: 0.2,
                        weight: 2,
                        dashArray: '4, 8',
                    }}
                >
                    <Popup className="dark-popup">
                        <div className="p-2 min-w-[150px]">
                            <h4 className="font-bold text-white text-sm">{zone.name}</h4>
                            <p className="text-xs text-gray-400 mt-1">{zone.description}</p>
                            <div className="mt-2 flex gap-2">
                                <span className="text-[10px] px-2 py-0.5 rounded bg-white/10 text-white border border-white/10">
                                    {zone.riskLevel}
                                </span>
                            </div>
                        </div>
                    </Popup>
                </Circle>
            ))}

            {/* Active Patrols */}
            {patrols.map((patrol) => {
                // Using location history or current location
                const loc = patrol.currentLocation;
                if (!loc) return null;

                return (
                    <Marker
                        key={patrol.id}
                        position={[loc.latitude, loc.longitude]}
                        icon={createPatrolIcon(patrol.user.rank)}
                    >
                        <Popup>
                            <div className="p-2">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center border border-gray-600">
                                        <span className="text-xs font-bold text-white">{patrol.user.firstName.charAt(0)}</span>
                                    </div>
                                    <div>
                                        <p className="font-bold text-white text-sm">{patrol.user.rank} {patrol.user.firstName}</p>
                                        <p className="text-[10px] text-emerald-400">ACTIVE DUTY</p>
                                    </div>
                                </div>
                                <div className="text-[10px] text-gray-400 font-mono">
                                    Last ping: {new Date(loc.timestamp).toLocaleTimeString()}
                                </div>
                            </div>
                        </Popup>
                    </Marker>
                );
            })}
        </MapContainer>
    );
}
