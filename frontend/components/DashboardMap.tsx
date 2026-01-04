'use client';

import { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { trackingApi, riskzoneApi, organizationApi } from '@/lib/api';
import MapSearchBar from './MapSearchBar';
import { Building2, Radio, AlertTriangle, MapPin, Eye, EyeOff } from 'lucide-react';

// ==================== ICONS ====================

// Station Icon with patrol count
const createStationIcon = (name: string, patrolCount: number, isSelected: boolean) => {
    const bgColor = isSelected ? '#10b981' : '#3b82f6';
    const borderColor = isSelected ? '#34d399' : '#60a5fa';
    return new L.DivIcon({
        html: `
            <div class="relative group cursor-pointer">
                <div class="w-12 h-12 rounded-xl ${isSelected ? 'scale-110' : ''}" style="background: ${bgColor}; border: 3px solid ${borderColor}; box-shadow: 0 0 20px ${bgColor}40;">
                    <div class="w-full h-full flex items-center justify-center">
                        <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
                        </svg>
                    </div>
                    ${patrolCount > 0 ? `
                        <div class="absolute -top-2 -right-2 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-white shadow-lg">
                            <span class="text-[10px] font-bold text-white">${patrolCount}</span>
                        </div>
                    ` : ''}
                </div>
                <div class="absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-black/90 px-2 py-1 rounded text-[10px] text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition pointer-events-none">
                    ${name.replace('สถานีตำรวจภูธร', 'สภ.')}
                </div>
            </div>
        `,
        className: '',
        iconSize: [48, 48],
        iconAnchor: [24, 24],
        popupAnchor: [0, -30],
    });
};

// Patrol Icon  
const createPatrolIcon = (rank: string, isActive: boolean) => {
    const color = isActive ? '#00ffff' : '#666666';
    return new L.DivIcon({
        html: `
            <div class="relative group">
                <div class="w-10 h-10 bg-black/60 backdrop-blur-md rounded-full border-[3px] shadow-[0_0_15px_${color}] flex items-center justify-center" style="border-color: ${color};">
                    <div class="w-3 h-3 rounded-full ${isActive ? 'animate-pulse' : ''}" style="background: ${color}; box-shadow: 0 0 10px ${color};"></div>
                </div>
                <div class="absolute -bottom-7 left-1/2 -translate-x-1/2 bg-black/90 px-2 py-0.5 rounded text-[9px] font-bold whitespace-nowrap" style="color: ${color};">
                    ${rank}
                </div>
            </div>
        `,
        className: '',
        iconSize: [40, 40],
        iconAnchor: [20, 20],
        popupAnchor: [0, -25],
    });
};

// Selected location icon
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

// Risk Zone colors
const getRiskColor = (level: string) => {
    switch (level) {
        case 'CRITICAL': return '#ff0055';
        case 'HIGH': return '#ff5500';
        case 'MEDIUM': return '#ffcc00';
        case 'LOW': return '#00ffcc';
        default: return '#888888';
    }
};

// ==================== MAP COMPONENTS ====================

// Map controller for flyTo
function MapController({ center, zoom }: { center: [number, number], zoom?: number }) {
    const map = useMap();
    useEffect(() => {
        if (center[0] !== 0 && center[1] !== 0) {
            map.flyTo(center, zoom || 14, { duration: 1.5 });
        }
    }, [center, zoom, map]);
    return null;
}

// Zoom level handler
function ZoomHandler({ onZoomChange }: { onZoomChange: (zoom: number) => void }) {
    const map = useMapEvents({
        zoomend: () => {
            onZoomChange(map.getZoom());
        },
        load: () => {
            onZoomChange(map.getZoom());
        }
    });

    useEffect(() => {
        onZoomChange(map.getZoom());
    }, [map, onZoomChange]);

    return null;
}

// ==================== INTERFACES ====================

interface SearchResult {
    type: 'location' | 'station' | 'riskzone' | 'patrol';
    id: string;
    name: string;
    lat: number;
    lng: number;
    data?: any;
}

// ==================== MAIN COMPONENT ====================

export default function DashboardMap() {
    const [patrols, setPatrols] = useState<any[]>([]);
    const [riskZones, setRiskZones] = useState<any[]>([]);
    const [stations, setStations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Map state
    const [center, setCenter] = useState<[number, number]>([14.5333, 100.9167]); // Saraburi center
    const [currentZoom, setCurrentZoom] = useState(11);
    const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);
    const [selectedStation, setSelectedStation] = useState<string | null>(null);

    // Visibility toggles
    const [showStations, setShowStations] = useState(true);
    const [showPatrols, setShowPatrols] = useState(true);
    const [showRiskZones, setShowRiskZones] = useState(true);

    // Zoom-based visibility
    const zoomShowStations = currentZoom < 14;
    const zoomShowPatrols = currentZoom >= 12;
    const zoomShowRiskZones = currentZoom >= 13;
    const zoomShowRiskDetails = currentZoom >= 15;

    // Fetch data
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

    // Count patrols per station
    const patrolCountByStation = useMemo(() => {
        const counts: Record<string, number> = {};
        patrols.forEach(p => {
            const stationId = p.user?.stationId;
            if (stationId) {
                counts[stationId] = (counts[stationId] || 0) + 1;
            }
        });
        return counts;
    }, [patrols]);

    // Patrols with location
    const patrolsWithLocation = useMemo(() =>
        patrols.map(p => ({
            ...p,
            currentLocation: p.locations?.[0] || null
        })).filter(p => p.currentLocation),
        [patrols]
    );

    // Handle search selection
    const handleSearchSelect = (result: SearchResult) => {
        if (result.lat && result.lng) {
            setCenter([result.lat, result.lng]);
            setSelectedResult(result);
            if (result.type === 'station') {
                setSelectedStation(result.id);
            }
        }
    };

    // Handle station click
    const handleStationClick = (station: any) => {
        setCenter([station.latitude, station.longitude]);
        setSelectedStation(station.id);
        setSelectedResult({
            type: 'station',
            id: station.id,
            name: station.name,
            lat: station.latitude,
            lng: station.longitude,
            data: station
        });
    };

    if (loading && stations.length === 0) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-[#0a0a0a]">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-xs text-emerald-500 font-mono tracking-widest">INITIALIZING TACTICAL MAP...</p>
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

            {/* Legend Panel */}
            <div className="absolute top-4 right-4 z-[500] bg-gray-900/95 backdrop-blur-md border border-gray-700 rounded-xl p-3 shadow-2xl">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2 font-bold">Map Legend</p>

                <div className="space-y-2">
                    {/* Toggle: Stations */}
                    <button
                        onClick={() => setShowStations(!showStations)}
                        className={`flex items-center gap-2 w-full px-2 py-1.5 rounded-lg transition ${showStations ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-800 text-gray-500'}`}
                    >
                        <Building2 className="w-4 h-4" />
                        <span className="text-xs font-medium flex-1 text-left">สถานี</span>
                        {showStations ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                    </button>

                    {/* Toggle: Patrols */}
                    <button
                        onClick={() => setShowPatrols(!showPatrols)}
                        className={`flex items-center gap-2 w-full px-2 py-1.5 rounded-lg transition ${showPatrols ? 'bg-cyan-500/20 text-cyan-400' : 'bg-gray-800 text-gray-500'}`}
                    >
                        <Radio className="w-4 h-4" />
                        <span className="text-xs font-medium flex-1 text-left">สายตรวจ</span>
                        <span className="text-[10px] bg-cyan-500/30 px-1.5 rounded">{patrolsWithLocation.length}</span>
                    </button>

                    {/* Toggle: Risk Zones */}
                    <button
                        onClick={() => setShowRiskZones(!showRiskZones)}
                        className={`flex items-center gap-2 w-full px-2 py-1.5 rounded-lg transition ${showRiskZones ? 'bg-amber-500/20 text-amber-400' : 'bg-gray-800 text-gray-500'}`}
                    >
                        <AlertTriangle className="w-4 h-4" />
                        <span className="text-xs font-medium flex-1 text-left">จุดเสี่ยง</span>
                        <span className="text-[10px] bg-amber-500/30 px-1.5 rounded">{riskZones.length}</span>
                    </button>
                </div>

                {/* Zoom level indicator */}
                <div className="mt-3 pt-2 border-t border-gray-800">
                    <p className="text-[10px] text-gray-500">Zoom: {currentZoom}</p>
                    <p className="text-[9px] text-gray-600 mt-1">
                        {currentZoom < 12 && '📍 ภาพรวมจังหวัด'}
                        {currentZoom >= 12 && currentZoom < 14 && '🏢 ระดับอำเภอ'}
                        {currentZoom >= 14 && currentZoom < 16 && '🚔 ระดับสถานี'}
                        {currentZoom >= 16 && '📌 ระดับถนน'}
                    </p>
                </div>
            </div>

            {/* Map Container */}
            <MapContainer
                center={center}
                zoom={11}
                className="w-full h-full"
                zoomControl={false}
                style={{ background: '#0a0a0a' }}
            >
                <TileLayer
                    attribution='&copy; OpenStreetMap &copy; CARTO'
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    maxZoom={20}
                />

                <MapController center={center} zoom={currentZoom < 14 ? 14 : undefined} />
                <ZoomHandler onZoomChange={setCurrentZoom} />

                {/* ==================== STATIONS ==================== */}
                {showStations && stations.map((station) => (
                    <Marker
                        key={station.id}
                        position={[station.latitude, station.longitude]}
                        icon={createStationIcon(
                            station.name,
                            patrolCountByStation[station.id] || 0,
                            selectedStation === station.id
                        )}
                        eventHandlers={{
                            click: () => handleStationClick(station)
                        }}
                    >
                        <Popup>
                            <div className="p-3 min-w-[200px]">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center">
                                        <Building2 className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white text-sm">
                                            {station.name.replace('สถานีตำรวจภูธร', 'สภ.')}
                                        </h4>
                                        <p className="text-[10px] text-gray-400">{station.code}</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-xs mt-3">
                                    <div className="bg-white/10 rounded p-2 text-center">
                                        <p className="text-emerald-400 font-bold">{patrolCountByStation[station.id] || 0}</p>
                                        <p className="text-gray-500 text-[10px]">สายตรวจ</p>
                                    </div>
                                    <div className="bg-white/10 rounded p-2 text-center">
                                        <p className="text-amber-400 font-bold">
                                            {riskZones.filter(z => z.stationId === station.id).length}
                                        </p>
                                        <p className="text-gray-500 text-[10px]">จุดเสี่ยง</p>
                                    </div>
                                </div>
                                <p className="text-[10px] text-gray-500 mt-2">{station.address}</p>
                            </div>
                        </Popup>
                    </Marker>
                ))}

                {/* ==================== RISK ZONES ==================== */}
                {showRiskZones && zoomShowRiskZones && riskZones.map((zone) => (
                    <Circle
                        key={zone.id}
                        center={[zone.latitude, zone.longitude]}
                        radius={zoomShowRiskDetails ? (zone.radius || 100) : (zone.radius || 100) * 2}
                        pathOptions={{
                            color: getRiskColor(zone.riskLevel),
                            fillColor: getRiskColor(zone.riskLevel),
                            fillOpacity: zoomShowRiskDetails ? 0.3 : 0.15,
                            weight: zoomShowRiskDetails ? 2 : 1,
                            dashArray: zoomShowRiskDetails ? undefined : '4, 8',
                        }}
                    >
                        <Popup>
                            <div className="p-2 min-w-[150px]">
                                <h4 className="font-bold text-white text-sm">{zone.name}</h4>
                                <p className="text-xs text-gray-400 mt-1">{zone.description}</p>
                                <div className="mt-2 flex gap-2">
                                    <span
                                        className="text-[10px] px-2 py-0.5 rounded font-bold"
                                        style={{
                                            background: getRiskColor(zone.riskLevel) + '30',
                                            color: getRiskColor(zone.riskLevel)
                                        }}
                                    >
                                        {zone.riskLevel}
                                    </span>
                                    <span className="text-[10px] px-2 py-0.5 rounded bg-white/10 text-white">
                                        ตรวจ {zone.requiredCheckIns} ครั้ง/วัน
                                    </span>
                                </div>
                            </div>
                        </Popup>
                    </Circle>
                ))}

                {/* ==================== PATROLS ==================== */}
                {showPatrols && zoomShowPatrols && patrolsWithLocation.map((patrol) => {
                    const loc = patrol.currentLocation;
                    if (!loc) return null;

                    return (
                        <Marker
                            key={patrol.id}
                            position={[loc.latitude, loc.longitude]}
                            icon={createPatrolIcon(patrol.user?.rank || '', patrol.isActive)}
                        >
                            <Popup>
                                <div className="p-3">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center border-2 border-cyan-500">
                                            <span className="text-sm font-bold text-cyan-400">
                                                {patrol.user?.firstName?.charAt(0)}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="font-bold text-white text-sm">
                                                {patrol.user?.rank} {patrol.user?.firstName}
                                            </p>
                                            <p className="text-[10px] text-emerald-400 flex items-center gap-1">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                                ON DUTY
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-[10px] text-gray-400 font-mono bg-white/5 rounded p-2">
                                        <p>📍 {loc.latitude.toFixed(6)}, {loc.longitude.toFixed(6)}</p>
                                        <p>🕐 {new Date(loc.timestamp).toLocaleTimeString()}</p>
                                    </div>
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}

                {/* ==================== SELECTED LOCATION ==================== */}
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
                            <p className="text-xs text-emerald-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                                {selectedResult.type === 'station' && <><Building2 className="w-3 h-3" /> สถานี</>}
                                {selectedResult.type === 'riskzone' && <><AlertTriangle className="w-3 h-3" /> จุดเสี่ยง</>}
                                {selectedResult.type === 'patrol' && <><Radio className="w-3 h-3" /> สายตรวจ</>}
                                {selectedResult.type === 'location' && <><MapPin className="w-3 h-3" /> สถานที่</>}
                            </p>
                            <p className="text-white font-bold">{selectedResult.name.split(',')[0]}</p>
                            {selectedResult.data?.address && (
                                <p className="text-gray-400 text-sm mt-1">{selectedResult.data.address}</p>
                            )}
                            <p className="text-gray-500 text-xs mt-2 font-mono">
                                {selectedResult.lat.toFixed(6)}, {selectedResult.lng.toFixed(6)}
                            </p>
                        </div>
                        <button
                            onClick={() => { setSelectedResult(null); setSelectedStation(null); }}
                            className="text-gray-500 hover:text-white transition p-1"
                        >
                            ✕
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
