'use client';

import { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { trackingApi, riskzoneApi, organizationApi } from '@/lib/api';
import MapSearchBar from './MapSearchBar';

// --- ICONS ---
const createPatrolIcon = (rank: string) => {
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

const createSelectedIcon = () => {
    return new L.DivIcon({
        html: `<div class="w-8 h-8 bg-emerald-500 rounded-full border-4 border-white shadow-[0_0_20px_#10b981] flex items-center justify-center animate-bounce">
         <div class="w-2 h-2 bg-white rounded-full"></div>
       </div>`,
        className: '',
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -35],
    });
};

const getRiskColor = (level: string) => {
    switch (level) {
        case 'CRITICAL': return '#ff0055';
        case 'HIGH': return '#ff5500';
        case 'MEDIUM': return '#ffcc00';
        case 'LOW': return '#00ffcc';
        default: return '#888888';
    }
};

// Map controller for flyTo
function MapController({ center, zoom }: { center: [number, number], zoom?: number }) {
    const map = useMap();
    useEffect(() => {
        if (center[0] !== 0 && center[1] !== 0) {
            map.flyTo(center, zoom || 15, { duration: 1.5 });
        }
    }, [center, zoom, map]);
    return null;
}

interface SearchResult {
    type: 'location' | 'station' | 'riskzone' | 'patrol';
    id: string;
    name: string;
    lat: number;
    lng: number;
    data?: any;
}

export default function DashboardMap() {
    const [patrols, setPatrols] = useState<any[]>([]);
    const [riskZones, setRiskZones] = useState<any[]>([]);
    const [stations, setStations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Default center (Saraburi / Nongkhae)
    const [center, setCenter] = useState<[number, number]>([14.3378, 100.8657]);
    const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);

    const fetchData = async () => {
        try {
            const [patrolRes, riskRes, stationRes] = await Promise.all([
                trackingApi.getActivePatrols(),
                riskzoneApi.getAll(),
                organizationApi.getStations()
            ]);

            if (patrolRes.data) setPatrols(patrolRes.data);
            if (riskRes.data) setRiskZones(riskRes.data);
            if (stationRes.data) setStations(stationRes.data);
        } catch (err) {
            console.error("Map data fetch error", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 10000);
        return () => clearInterval(interval);
    }, []);

    const handleSearchSelect = (result: SearchResult) => {
        if (result.lat && result.lng) {
            setCenter([result.lat, result.lng]);
            setSelectedResult(result);
        }
    };

    // Transform patrols for search (add currentLocation)
    const patrolsWithLocation = useMemo(() =>
        patrols.map(p => ({
            ...p,
            currentLocation: p.locations?.[0] || null
        })),
        [patrols]
    );

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
        <div className="w-full h-full relative">
            {/* Search Bar */}
            <MapSearchBar
                onSelect={handleSearchSelect}
                stations={stations}
                riskZones={riskZones}
                patrols={patrolsWithLocation}
            />

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

                <MapController center={center} />

                {/* Risk Zones */}
                {riskZones.map((zone) => (
                    <Circle
                        key={zone.id}
                        center={[zone.latitude, zone.longitude]}
                        radius={zone.radius || 100}
                        pathOptions={{
                            color: selectedResult?.id === zone.id ? '#10b981' : getRiskColor(zone.riskLevel),
                            fillColor: getRiskColor(zone.riskLevel),
                            fillOpacity: selectedResult?.id === zone.id ? 0.4 : 0.2,
                            weight: selectedResult?.id === zone.id ? 4 : 2,
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
                {patrolsWithLocation.map((patrol) => {
                    const loc = patrol.currentLocation;
                    if (!loc) return null;

                    return (
                        <Marker
                            key={patrol.id}
                            position={[loc.latitude, loc.longitude]}
                            icon={createPatrolIcon(patrol.user?.rank || '')}
                        >
                            <Popup>
                                <div className="p-2">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center border border-gray-600">
                                            <span className="text-xs font-bold text-white">{patrol.user?.firstName?.charAt(0)}</span>
                                        </div>
                                        <div>
                                            <p className="font-bold text-white text-sm">{patrol.user?.rank} {patrol.user?.firstName}</p>
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

                {/* Selected Location Marker */}
                {selectedResult && selectedResult.type === 'location' && (
                    <Marker
                        position={[selectedResult.lat, selectedResult.lng]}
                        icon={createSelectedIcon()}
                    >
                        <Popup>
                            <div className="p-2">
                                <p className="font-bold text-white text-sm">{selectedResult.name.split(',')[0]}</p>
                                <p className="text-xs text-gray-400">{selectedResult.name.split(',').slice(1, 3).join(',')}</p>
                            </div>
                        </Popup>
                    </Marker>
                )}
            </MapContainer>

            {/* Selected Info Panel */}
            {selectedResult && (
                <div className="absolute bottom-4 left-4 z-[500] bg-gray-900/95 backdrop-blur-md border border-gray-700 rounded-xl p-4 max-w-sm shadow-2xl">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <p className="text-xs text-emerald-400 uppercase tracking-wider mb-1">
                                {selectedResult.type === 'station' && '📍 สถานี'}
                                {selectedResult.type === 'riskzone' && '⚠️ จุดเสี่ยง'}
                                {selectedResult.type === 'patrol' && '🚔 สายตรวจ'}
                                {selectedResult.type === 'location' && '📌 สถานที่'}
                            </p>
                            <p className="text-white font-bold">{selectedResult.name.split(',')[0]}</p>
                            {selectedResult.data?.description && (
                                <p className="text-gray-400 text-sm mt-1">{selectedResult.data.description}</p>
                            )}
                            <p className="text-gray-500 text-xs mt-2 font-mono">
                                {selectedResult.lat.toFixed(6)}, {selectedResult.lng.toFixed(6)}
                            </p>
                        </div>
                        <button
                            onClick={() => setSelectedResult(null)}
                            className="text-gray-500 hover:text-white transition"
                        >
                            ✕
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
