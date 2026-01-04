'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { trackingApi, riskzoneApi, organizationApi } from '@/lib/api';
import {
    createStationIcon,
    createPatrolIcon,
    createSelectedIcon,
    getRiskColor,
    getThreatCategoryColor,
    MAP_TILES,
    ZOOM_LEVELS,
    THAILAND_CENTER,
} from '@/lib/mapUtils';
import MapSearchBar from './MapSearchBar';
import { Building2, Radio, AlertTriangle, MapPin, Eye, EyeOff, Shield, Users, Clock, Zap } from 'lucide-react';

// ==================== MAP COMPONENTS ====================

function MapController({ center, zoom }: { center: [number, number]; zoom?: number }) {
    const map = useMap();
    useEffect(() => {
        if (center[0] !== 0 && center[1] !== 0) {
            map.flyTo(center, zoom || 14, { duration: 1.5 });
        }
    }, [center, zoom, map]);
    return null;
}

function ZoomHandler({ onZoomChange }: { onZoomChange: (zoom: number) => void }) {
    const map = useMapEvents({
        zoomend: () => onZoomChange(map.getZoom()),
        load: () => onZoomChange(map.getZoom()),
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
    const [center, setCenter] = useState<[number, number]>(THAILAND_CENTER);
    const [currentZoom, setCurrentZoom] = useState(6);
    const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);
    const [selectedStation, setSelectedStation] = useState<string | null>(null);

    // ===== VISIBILITY TOGGLES (Layer Controls) =====
    const [showStations, setShowStations] = useState(true);
    const [showPatrols, setShowPatrols] = useState(true);
    const [showRiskZones, setShowRiskZones] = useState(true);

    // ===== THREAT CATEGORY FILTERS =====
    const [threatFilters, setThreatFilters] = useState({
        DRUGS: true,
        WEAPONS: true,
        TRAFFIC: true,
        VIOLENT: true,
        THEFT: true,
        OTHER: true,
    });

    // ===== TIME MODE =====
    const [timeMode, setTimeMode] = useState<'live' | 'historical'>('live');

    // Zoom-based visibility thresholds
    const zoomShowStations = currentZoom >= 8;
    const zoomShowPatrols = currentZoom >= 10;
    const zoomShowRiskZones = currentZoom >= 9;
    const zoomShowRiskDetails = currentZoom >= 13;

    // Fetch data
    const fetchData = useCallback(async () => {
        try {
            const [patrolRes, riskRes, stationRes] = await Promise.all([
                trackingApi.getActivePatrols(),
                riskzoneApi.getAll(),
                organizationApi.getStations(),
            ]);

            if (patrolRes.data) setPatrols(patrolRes.data);
            if (riskRes.data) setRiskZones(riskRes.data);
            if (stationRes.data) setStations(stationRes.data);
        } catch (err) {
            console.error('Map data fetch error', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 10000);
        return () => clearInterval(interval);
    }, [fetchData]);

    // Listen for flyToLocation events from PriorityFeed
    useEffect(() => {
        const handleFlyTo = (event: CustomEvent<{ lat: number; lng: number; zoom?: number }>) => {
            const { lat, lng, zoom } = event.detail;
            if (lat && lng) {
                setCenter([lat, lng]);
                if (zoom) setCurrentZoom(zoom);
            }
        };
        window.addEventListener('flyToLocation', handleFlyTo as EventListener);
        return () => window.removeEventListener('flyToLocation', handleFlyTo as EventListener);
    }, []);

    // Count patrols per station
    const patrolCountByStation = useMemo(() => {
        const counts: Record<string, number> = {};
        patrols.forEach((p) => {
            const stationId = p.user?.stationId;
            if (stationId) counts[stationId] = (counts[stationId] || 0) + 1;
        });
        return counts;
    }, [patrols]);

    // Patrols with location
    const patrolsWithLocation = useMemo(
        () =>
            patrols
                .map((p) => ({ ...p, currentLocation: p.locations?.[0] || null }))
                .filter((p) => p.currentLocation),
        [patrols]
    );

    // Filtered risk zones by threat category
    const filteredRiskZones = useMemo(() => {
        return riskZones.filter((zone) => {
            const category = zone.category || 'OTHER';
            return threatFilters[category as keyof typeof threatFilters] ?? threatFilters.OTHER;
        });
    }, [riskZones, threatFilters]);

    // Handle search selection
    const handleSearchSelect = (result: SearchResult) => {
        if (result.lat && result.lng) {
            setCenter([result.lat, result.lng]);
            setSelectedResult(result);
            if (result.type === 'station') setSelectedStation(result.id);
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
            data: station,
        });
    };

    // Toggle threat filter
    const toggleThreatFilter = (category: string) => {
        setThreatFilters((prev) => ({
            ...prev,
            [category]: !prev[category as keyof typeof prev],
        }));
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

            {/* ===== LEGEND & LAYER CONTROLS ===== */}
            <div className="absolute top-4 right-4 z-[500] bg-gray-900/95 backdrop-blur-md border border-gray-700 rounded-xl p-3 shadow-2xl max-w-[200px]">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2 font-bold">Map Layers</p>

                {/* Layer Toggles */}
                <div className="space-y-1.5 mb-3">
                    <button
                        onClick={() => setShowStations(!showStations)}
                        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition ${showStations ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-800 text-gray-500'
                            }`}
                    >
                        <Building2 className="w-3.5 h-3.5" />
                        <span>สถานี ({stations.length})</span>
                        {showStations ? <Eye className="w-3 h-3 ml-auto" /> : <EyeOff className="w-3 h-3 ml-auto" />}
                    </button>

                    <button
                        onClick={() => setShowPatrols(!showPatrols)}
                        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition ${showPatrols ? 'bg-cyan-500/20 text-cyan-400' : 'bg-gray-800 text-gray-500'
                            }`}
                    >
                        <Radio className="w-3.5 h-3.5" />
                        <span>สายตรวจ ({patrolsWithLocation.length})</span>
                        {showPatrols ? <Eye className="w-3 h-3 ml-auto" /> : <EyeOff className="w-3 h-3 ml-auto" />}
                    </button>

                    <button
                        onClick={() => setShowRiskZones(!showRiskZones)}
                        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition ${showRiskZones ? 'bg-rose-500/20 text-rose-400' : 'bg-gray-800 text-gray-500'
                            }`}
                    >
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>จุดเสี่ยง ({filteredRiskZones.length})</span>
                        {showRiskZones ? <Eye className="w-3 h-3 ml-auto" /> : <EyeOff className="w-3 h-3 ml-auto" />}
                    </button>
                </div>

                {/* Threat Category Filters */}
                <div className="border-t border-gray-700 pt-2">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5 font-bold">Threat Types</p>
                    <div className="flex flex-wrap gap-1">
                        {Object.entries(threatFilters).map(([category, enabled]) => {
                            const { color, emoji } = getThreatCategoryColor(category);
                            return (
                                <button
                                    key={category}
                                    onClick={() => toggleThreatFilter(category)}
                                    className={`px-1.5 py-0.5 rounded text-[10px] transition ${enabled ? 'opacity-100' : 'opacity-40'
                                        }`}
                                    style={{ backgroundColor: enabled ? `${color}30` : '#374151', color: enabled ? color : '#6b7280' }}
                                    title={category}
                                >
                                    {emoji}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Time Mode Toggle */}
                <div className="border-t border-gray-700 pt-2 mt-2">
                    <div className="flex gap-1">
                        <button
                            onClick={() => setTimeMode('live')}
                            className={`flex-1 flex items-center justify-center gap-1 px-2 py-1 rounded text-[10px] transition ${timeMode === 'live' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-800 text-gray-500'
                                }`}
                        >
                            <Zap className="w-3 h-3" />
                            Live
                        </button>
                        <button
                            onClick={() => setTimeMode('historical')}
                            className={`flex-1 flex items-center justify-center gap-1 px-2 py-1 rounded text-[10px] transition ${timeMode === 'historical' ? 'bg-amber-500/20 text-amber-400' : 'bg-gray-800 text-gray-500'
                                }`}
                        >
                            <Clock className="w-3 h-3" />
                            24h
                        </button>
                    </div>
                </div>

                {/* Zoom Indicator */}
                <div className="border-t border-gray-700 pt-2 mt-2 flex items-center justify-between text-[10px] text-gray-500">
                    <span>Zoom: {currentZoom}</span>
                    <span>🗺️ {timeMode === 'live' ? 'Real-time' : 'Historical'}</span>
                </div>
            </div>

            {/* ===== MAP CONTAINER ===== */}
            <MapContainer
                center={THAILAND_CENTER}
                zoom={6}
                className="w-full h-full"
                zoomControl={false}
                style={{ background: '#0a0a0a' }}
            >
                <TileLayer
                    url={MAP_TILES.dark}
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                />

                <MapController center={center} zoom={currentZoom} />
                <ZoomHandler onZoomChange={setCurrentZoom} />

                {/* Stations */}
                {showStations &&
                    zoomShowStations &&
                    stations
                        .filter((s) => s.latitude && s.longitude)
                        .map((station) => (
                            <Marker
                                key={station.id}
                                position={[station.latitude, station.longitude]}
                                icon={createStationIcon(
                                    station.name,
                                    patrolCountByStation[station.id] || 0,
                                    selectedStation === station.id,
                                    false
                                )}
                                eventHandlers={{ click: () => handleStationClick(station) }}
                            >
                                <Popup className="custom-popup">
                                    <div className="bg-gray-900 text-white p-3 rounded-lg min-w-[200px]">
                                        <h3 className="font-bold text-sm mb-1">{station.name}</h3>
                                        <p className="text-xs text-gray-400">{station.province?.name}</p>
                                        <div className="flex gap-2 mt-2 text-xs">
                                            <span className="bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded">
                                                สายตรวจ: {patrolCountByStation[station.id] || 0}
                                            </span>
                                        </div>
                                    </div>
                                </Popup>
                            </Marker>
                        ))}

                {/* Patrols */}
                {showPatrols &&
                    zoomShowPatrols &&
                    patrolsWithLocation.map((patrol) => (
                        <Marker
                            key={patrol.id}
                            position={[patrol.currentLocation.latitude, patrol.currentLocation.longitude]}
                            icon={createPatrolIcon(patrol.user?.rank || 'N/A', true)}
                        >
                            <Popup>
                                <div className="bg-gray-900 text-white p-2 rounded">
                                    <p className="font-bold text-sm">
                                        {patrol.user?.rank} {patrol.user?.firstName}
                                    </p>
                                    <p className="text-xs text-gray-400">{patrol.user?.station?.name}</p>
                                </div>
                            </Popup>
                        </Marker>
                    ))}

                {/* Risk Zones */}
                {showRiskZones &&
                    zoomShowRiskZones &&
                    filteredRiskZones
                        .filter((zone) => zone.latitude && zone.longitude)
                        .map((zone) => {
                            const baseRadius = zone.radius || 200;
                            const scaledRadius = zoomShowRiskDetails ? baseRadius : baseRadius * 0.5;
                            return (
                                <Circle
                                    key={zone.id}
                                    center={[zone.latitude, zone.longitude]}
                                    radius={scaledRadius}
                                    pathOptions={{
                                        color: getRiskColor(zone.riskLevel),
                                        fillColor: getRiskColor(zone.riskLevel),
                                        fillOpacity: 0.3,
                                        weight: 2,
                                    }}
                                >
                                    <Popup>
                                        <div className="bg-gray-900 text-white p-2 rounded">
                                            <p className="font-bold text-sm">{zone.name}</p>
                                            <p className="text-xs text-gray-400">ระดับ: {zone.riskLevel}</p>
                                            <p className="text-xs text-gray-400">ตรวจ: {zone.requiredFrequency}x/วัน</p>
                                        </div>
                                    </Popup>
                                </Circle>
                            );
                        })}

                {/* Selected Location Marker */}
                {selectedResult && selectedResult.type === 'location' && (
                    <Marker position={[selectedResult.lat, selectedResult.lng]} icon={createSelectedIcon()}>
                        <Popup>
                            <div className="bg-gray-900 text-white p-2 rounded">
                                <p className="font-bold text-sm">{selectedResult.name}</p>
                            </div>
                        </Popup>
                    </Marker>
                )}
            </MapContainer>

            {/* ===== SELECTED STATION INFO PANEL ===== */}
            {selectedStation && selectedResult?.data && (
                <div className="absolute bottom-4 left-4 z-[500] bg-gray-900/95 backdrop-blur-md border border-gray-700 rounded-xl p-4 shadow-2xl max-w-[280px]">
                    <button
                        onClick={() => {
                            setSelectedStation(null);
                            setSelectedResult(null);
                        }}
                        className="absolute top-2 right-2 text-gray-500 hover:text-white"
                    >
                        ✕
                    </button>
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-500 uppercase tracking-wider">สถานี</p>
                            <h3 className="font-bold text-white text-sm">{selectedResult.data.name}</h3>
                            <p className="text-xs text-gray-400">{selectedResult.data.province?.name}</p>
                        </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-700 grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-gray-800 rounded p-2">
                            <p className="text-gray-500">สายตรวจ</p>
                            <p className="text-emerald-400 font-bold">{patrolCountByStation[selectedStation] || 0}</p>
                        </div>
                        <div className="bg-gray-800 rounded p-2">
                            <p className="text-gray-500">พิกัด</p>
                            <p className="text-gray-300 font-mono text-[10px]">
                                {selectedResult.data.latitude?.toFixed(4)}, {selectedResult.data.longitude?.toFixed(4)}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
