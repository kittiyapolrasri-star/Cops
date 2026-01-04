'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, GeoJSON, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { trackingApi, riskzoneApi, organizationApi } from '@/lib/api';
import {
    createStationIcon,
    createPatrolIcon,
    getRiskColor,
    getThreatCategoryColor,
    MAP_TILES,
    ZOOM_LEVELS,
    THAILAND_CENTER,
    THAILAND_GEOJSON_URL,
    provinceNameMap,
} from '@/lib/mapUtils';
import {
    Building2,
    Radio,
    AlertTriangle,
    MapPin,
    Eye,
    EyeOff,
    Search,
    X,
    ChevronDown,
    Users,
    Clock,
    Zap,
    RotateCcw,
    Filter,
} from 'lucide-react';

// ==================== MAP COMPONENTS ====================

function MapController({ center, zoom }: { center: [number, number]; zoom: number }) {
    const map = useMap();
    useEffect(() => {
        if (center[0] !== 0 && center[1] !== 0) {
            map.flyTo(center, zoom, { duration: 1.2 });
        }
    }, [center, zoom, map]);
    return null;
}

function ZoomHandler({ onZoomChange }: { onZoomChange: (zoom: number) => void }) {
    const map = useMapEvents({
        zoomend: () => onZoomChange(map.getZoom()),
    });
    return null;
}

// ==================== MAIN COMPONENT ====================

export default function FullMapContent() {
    const [patrols, setPatrols] = useState<any[]>([]);
    const [riskZones, setRiskZones] = useState<any[]>([]);
    const [stations, setStations] = useState<any[]>([]);
    const [bureaus, setBureaus] = useState<any[]>([]);
    const [provinces, setProvinces] = useState<any[]>([]);
    const [geoJsonData, setGeoJsonData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Map state
    const [center, setCenter] = useState<[number, number]>(THAILAND_CENTER);
    const [currentZoom, setCurrentZoom] = useState(6);
    const [selectedStation, setSelectedStation] = useState<any>(null);

    // Filters
    const [selectedBureau, setSelectedBureau] = useState<string>('');
    const [selectedProvince, setSelectedProvince] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState('');

    // Visibility toggles
    const [showStations, setShowStations] = useState(true);
    const [showPatrols, setShowPatrols] = useState(true);
    const [showRiskZones, setShowRiskZones] = useState(true);

    // Threat filters
    const [threatFilters, setThreatFilters] = useState({
        DRUGS: true,
        WEAPONS: true,
        TRAFFIC: true,
        VIOLENT: true,
        THEFT: true,
        OTHER: true,
    });

    // Time mode
    const [timeMode, setTimeMode] = useState<'live' | 'historical'>('live');

    // Zoom thresholds
    const zoomShowStations = currentZoom >= 8;
    const zoomShowPatrols = currentZoom >= 10;
    const zoomShowRiskZones = currentZoom >= 9;

    // Fetch data
    const fetchData = useCallback(async () => {
        try {
            const [patrolRes, riskRes, stationRes, bureauRes, provinceRes] = await Promise.all([
                trackingApi.getActivePatrols(),
                riskzoneApi.getAll(),
                organizationApi.getStations(),
                organizationApi.getBureaus(),
                organizationApi.getProvinces(),
            ]);

            if (patrolRes.data) setPatrols(patrolRes.data);
            if (riskRes.data) setRiskZones(riskRes.data);
            if (stationRes.data) setStations(stationRes.data);
            if (bureauRes.data) setBureaus(bureauRes.data);
            if (provinceRes.data) setProvinces(provinceRes.data);
        } catch (err) {
            console.error('Map data fetch error', err);
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch GeoJSON
    useEffect(() => {
        fetch(THAILAND_GEOJSON_URL)
            .then((res) => res.json())
            .then((data) => setGeoJsonData(data))
            .catch(console.error);
    }, []);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 15000);
        return () => clearInterval(interval);
    }, [fetchData]);

    // Filtered provinces by bureau
    const filteredProvinces = useMemo(() => {
        if (!selectedBureau) return provinces;
        return provinces.filter((p) => p.bureauId === selectedBureau);
    }, [provinces, selectedBureau]);

    // Filtered stations
    const filteredStations = useMemo(() => {
        let result = stations;
        if (selectedProvince) {
            result = result.filter((s) => s.provinceId === selectedProvince);
        } else if (selectedBureau) {
            const provIds = filteredProvinces.map((p) => p.id);
            result = result.filter((s) => provIds.includes(s.provinceId));
        }
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = result.filter(
                (s) => s.name?.toLowerCase().includes(q) || s.code?.toLowerCase().includes(q)
            );
        }
        return result;
    }, [stations, selectedProvince, selectedBureau, filteredProvinces, searchQuery]);

    // Patrol count by station
    const patrolCountByStation = useMemo(() => {
        const counts: Record<string, number> = {};
        patrols.forEach((p) => {
            const stationId = p.user?.stationId;
            if (stationId) counts[stationId] = (counts[stationId] || 0) + 1;
        });
        return counts;
    }, [patrols]);

    // Patrols with location, filtered
    const filteredPatrols = useMemo(() => {
        let result = patrols
            .map((p) => ({ ...p, currentLocation: p.locations?.[0] || null }))
            .filter((p) => p.currentLocation);

        if (selectedProvince) {
            result = result.filter((p) => p.user?.station?.provinceId === selectedProvince);
        } else if (selectedBureau) {
            const provIds = filteredProvinces.map((p) => p.id);
            result = result.filter((p) => provIds.includes(p.user?.station?.provinceId));
        }
        return result;
    }, [patrols, selectedProvince, selectedBureau, filteredProvinces]);

    // Filtered risk zones by threat category
    const filteredRiskZones = useMemo(() => {
        let result = riskZones;
        if (selectedProvince) {
            result = result.filter((z) => z.station?.provinceId === selectedProvince);
        }
        return result.filter((zone) => {
            const category = zone.category || 'OTHER';
            return threatFilters[category as keyof typeof threatFilters] ?? threatFilters.OTHER;
        });
    }, [riskZones, selectedProvince, threatFilters]);

    // Province info for selected province
    const provinceInfo = useMemo(() => {
        if (!selectedProvince) return null;
        const prov = provinces.find((p) => p.id === selectedProvince);
        if (!prov) return null;
        const stationCount = filteredStations.length;
        const patrolCount = filteredPatrols.length;
        const riskCount = filteredRiskZones.length;
        return { ...prov, stationCount, patrolCount, riskCount };
    }, [selectedProvince, provinces, filteredStations, filteredPatrols, filteredRiskZones]);

    // Handle province selection
    const handleProvinceSelect = (provinceId: string) => {
        setSelectedProvince(provinceId);
        const prov = provinces.find((p) => p.id === provinceId);
        if (prov?.latitude && prov?.longitude) {
            setCenter([prov.latitude, prov.longitude]);
            setCurrentZoom(ZOOM_LEVELS.PROVINCE);
        }
    };

    // Handle bureau selection
    const handleBureauSelect = (bureauId: string) => {
        setSelectedBureau(bureauId);
        setSelectedProvince('');
        if (!bureauId) {
            setCenter(THAILAND_CENTER);
            setCurrentZoom(6);
        }
    };

    // Handle station click
    const handleStationClick = (station: any) => {
        setSelectedStation(station);
        setCenter([station.latitude, station.longitude]);
        setCurrentZoom(ZOOM_LEVELS.STATION);
    };

    // Reset view
    const resetView = () => {
        setSelectedBureau('');
        setSelectedProvince('');
        setSearchQuery('');
        setSelectedStation(null);
        setCenter(THAILAND_CENTER);
        setCurrentZoom(6);
    };

    // GeoJSON style function
    const geoJsonStyle = useCallback(
        (feature: any) => {
            if (!selectedProvince || !feature?.properties?.name) {
                return { fillOpacity: 0, weight: 0.5, color: '#374151' };
            }
            const thaiName = Object.entries(provinceNameMap).find(
                ([_th, en]) => en.toLowerCase() === feature.properties.name.toLowerCase()
            )?.[0];
            const matchingProv = provinces.find((p) => p.name === thaiName);
            const isSelected = matchingProv?.id === selectedProvince;
            return {
                fillColor: isSelected ? '#10b981' : 'transparent',
                fillOpacity: isSelected ? 0.3 : 0,
                weight: isSelected ? 3 : 0.5,
                color: isSelected ? '#34d399' : '#374151',
            };
        },
        [selectedProvince, provinces]
    );

    // Toggle threat filter
    const toggleThreatFilter = (category: string) => {
        setThreatFilters((prev) => ({
            ...prev,
            [category]: !prev[category as keyof typeof prev],
        }));
    };

    if (loading) {
        return (
            <div className="h-[calc(100vh-64px)] w-full flex items-center justify-center bg-gray-950">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-emerald-400 font-mono tracking-widest">LOADING TACTICAL MAP...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-64px)] w-full relative bg-gray-950">
            {/* ===== TOP CONTROLS ===== */}
            <div className="absolute top-4 left-4 right-4 z-[500] flex gap-3">
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                        type="text"
                        placeholder="ค้นหาสถานี, สถานที่, จุดเสี่ยง..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-black/70 backdrop-blur-md border border-gray-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {/* Bureau Filter */}
                <div className="relative">
                    <select
                        value={selectedBureau}
                        onChange={(e) => handleBureauSelect(e.target.value)}
                        className="bg-black/70 backdrop-blur-md border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white appearance-none cursor-pointer pr-8 focus:outline-none focus:border-emerald-500 min-w-[140px]"
                    >
                        <option value="">ทุกกภาค</option>
                        {bureaus.map((b) => (
                            <option key={b.id} value={b.id}>
                                {b.name}
                            </option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                </div>

                {/* Province Filter */}
                <div className="relative">
                    <select
                        value={selectedProvince}
                        onChange={(e) => handleProvinceSelect(e.target.value)}
                        className="bg-black/70 backdrop-blur-md border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white appearance-none cursor-pointer pr-8 focus:outline-none focus:border-emerald-500 min-w-[140px]"
                    >
                        <option value="">ทุกจังหวัด</option>
                        {filteredProvinces.map((p) => (
                            <option key={p.id} value={p.id}>
                                {p.name}
                            </option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                </div>

                {/* Reset Button */}
                <button
                    onClick={resetView}
                    className="bg-black/70 backdrop-blur-md border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-gray-400 hover:text-white hover:border-gray-600 transition flex items-center gap-2"
                >
                    <RotateCcw className="w-4 h-4" />
                    รีเซ็ต
                </button>
            </div>

            {/* ===== LEGEND PANEL ===== */}
            <div className="absolute top-20 right-4 z-[500] bg-black/80 backdrop-blur-md border border-gray-700 rounded-xl p-3 shadow-2xl w-48">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2 font-bold">MAP LAYERS</p>

                {/* Layer Toggles */}
                <div className="space-y-1.5 mb-3">
                    <button
                        onClick={() => setShowStations(!showStations)}
                        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition ${showStations ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-800 text-gray-500'
                            }`}
                    >
                        <Building2 className="w-3.5 h-3.5" />
                        สถานี ({filteredStations.length})
                    </button>

                    <button
                        onClick={() => setShowPatrols(!showPatrols)}
                        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition ${showPatrols ? 'bg-cyan-500/20 text-cyan-400' : 'bg-gray-800 text-gray-500'
                            }`}
                    >
                        <Radio className="w-3.5 h-3.5" />
                        สายตรวจ ({filteredPatrols.length})
                    </button>

                    <button
                        onClick={() => setShowRiskZones(!showRiskZones)}
                        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition ${showRiskZones ? 'bg-rose-500/20 text-rose-400' : 'bg-gray-800 text-gray-500'
                            }`}
                    >
                        <AlertTriangle className="w-3.5 h-3.5" />
                        จุดเสี่ยง ({filteredRiskZones.length})
                    </button>
                </div>

                {/* Threat Filters */}
                <div className="border-t border-gray-700 pt-2">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5 font-bold">Threats</p>
                    <div className="flex flex-wrap gap-1">
                        {Object.entries(threatFilters).map(([cat, enabled]) => {
                            const { color, emoji } = getThreatCategoryColor(cat);
                            return (
                                <button
                                    key={cat}
                                    onClick={() => toggleThreatFilter(cat)}
                                    className={`px-1.5 py-0.5 rounded text-[10px] transition ${enabled ? 'opacity-100' : 'opacity-40'
                                        }`}
                                    style={{
                                        backgroundColor: enabled ? `${color}30` : '#374151',
                                        color: enabled ? color : '#6b7280',
                                    }}
                                >
                                    {emoji}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Time Mode */}
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

                <div className="border-t border-gray-700 pt-2 mt-2 text-[10px] text-gray-500 text-center">
                    Zoom: {currentZoom}
                </div>
            </div>

            {/* ===== PROVINCE INFO PANEL ===== */}
            {provinceInfo && (
                <div className="absolute top-20 left-4 z-[500] bg-black/80 backdrop-blur-md border border-emerald-500/50 rounded-xl p-4 shadow-2xl w-56">
                    <div className="flex items-center gap-2 mb-3">
                        <MapPin className="w-5 h-5 text-emerald-400" />
                        <h3 className="font-bold text-white">{provinceInfo.name}</h3>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-gray-800 rounded-lg p-2">
                            <p className="text-lg font-bold text-blue-400">{provinceInfo.stationCount}</p>
                            <p className="text-[10px] text-gray-500">สถานี</p>
                        </div>
                        <div className="bg-gray-800 rounded-lg p-2">
                            <p className="text-lg font-bold text-cyan-400">{provinceInfo.patrolCount}</p>
                            <p className="text-[10px] text-gray-500">สายตรวจ</p>
                        </div>
                        <div className="bg-gray-800 rounded-lg p-2">
                            <p className="text-lg font-bold text-rose-400">{provinceInfo.riskCount}</p>
                            <p className="text-[10px] text-gray-500">จุดเสี่ยง</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setSelectedProvince('')}
                        className="w-full mt-3 text-xs text-gray-400 hover:text-white transition"
                    >
                        ✕ ปิด
                    </button>
                </div>
            )}

            {/* ===== MAP CONTAINER ===== */}
            <MapContainer
                center={THAILAND_CENTER}
                zoom={6}
                className="w-full h-full"
                zoomControl={false}
                style={{ background: '#0a0a0a' }}
            >
                <TileLayer url={MAP_TILES.dark} attribution="&copy; OpenStreetMap" />
                <MapController center={center} zoom={currentZoom} />
                <ZoomHandler onZoomChange={setCurrentZoom} />

                {/* GeoJSON Province Boundaries */}
                {geoJsonData && <GeoJSON data={geoJsonData} style={geoJsonStyle} />}

                {/* Stations */}
                {showStations &&
                    zoomShowStations &&
                    filteredStations
                        .filter((s) => s.latitude && s.longitude)
                        .map((station) => (
                            <Marker
                                key={station.id}
                                position={[station.latitude, station.longitude]}
                                icon={createStationIcon(
                                    station.name,
                                    patrolCountByStation[station.id] || 0,
                                    selectedStation?.id === station.id,
                                    false
                                )}
                                eventHandlers={{ click: () => handleStationClick(station) }}
                            >
                                <Popup className="custom-popup">
                                    <div className="bg-gray-900 text-white p-3 rounded-lg">
                                        <h3 className="font-bold">{station.name}</h3>
                                        <p className="text-xs text-gray-400">{station.province?.name}</p>
                                    </div>
                                </Popup>
                            </Marker>
                        ))}

                {/* Patrols */}
                {showPatrols &&
                    zoomShowPatrols &&
                    filteredPatrols.map((patrol) => (
                        <Marker
                            key={patrol.id}
                            position={[patrol.currentLocation.latitude, patrol.currentLocation.longitude]}
                            icon={createPatrolIcon(patrol.user?.rank || 'N/A', true)}
                        >
                            <Popup>
                                <div className="bg-gray-900 text-white p-2 rounded">
                                    <p className="font-bold">
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
                        .map((zone) => (
                            <Circle
                                key={zone.id}
                                center={[zone.latitude, zone.longitude]}
                                radius={zone.radius || 200}
                                pathOptions={{
                                    color: getRiskColor(zone.riskLevel),
                                    fillColor: getRiskColor(zone.riskLevel),
                                    fillOpacity: 0.3,
                                    weight: 2,
                                }}
                            >
                                <Popup>
                                    <div className="bg-gray-900 text-white p-2 rounded">
                                        <p className="font-bold">{zone.name}</p>
                                        <p className="text-xs text-gray-400">ระดับ: {zone.riskLevel}</p>
                                    </div>
                                </Popup>
                            </Circle>
                        ))}
            </MapContainer>

            {/* ===== STATION INFO PANEL ===== */}
            {selectedStation && (
                <div className="absolute bottom-4 left-4 z-[500] bg-black/90 backdrop-blur-md border border-gray-700 rounded-xl p-4 shadow-2xl w-72">
                    <button
                        onClick={() => setSelectedStation(null)}
                        className="absolute top-2 right-2 text-gray-500 hover:text-white"
                    >
                        <X className="w-4 h-4" />
                    </button>
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-500 uppercase">สถานี</p>
                            <h3 className="font-bold text-white">{selectedStation.name}</h3>
                            <p className="text-xs text-gray-400">{selectedStation.province?.name}</p>
                        </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-700 grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-gray-800 rounded p-2">
                            <p className="text-gray-500">สายตรวจ</p>
                            <p className="text-emerald-400 font-bold">
                                {patrolCountByStation[selectedStation.id] || 0}
                            </p>
                        </div>
                        <div className="bg-gray-800 rounded p-2">
                            <p className="text-gray-500">พิกัด</p>
                            <p className="text-gray-300 font-mono text-[9px]">
                                {selectedStation.latitude?.toFixed(4)},{selectedStation.longitude?.toFixed(4)}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* ===== STATS BAR (Bottom) ===== */}
            <div className="absolute bottom-4 right-4 z-[500] flex gap-2">
                <div className="bg-black/80 backdrop-blur-md border border-gray-700 rounded-xl px-3 py-2 flex items-center gap-3">
                    <div className="text-center">
                        <p className="text-lg font-bold text-blue-400">{filteredStations.length}</p>
                        <p className="text-[9px] text-gray-500">สถานี</p>
                    </div>
                    <div className="h-8 w-px bg-gray-700" />
                    <div className="text-center">
                        <p className="text-lg font-bold text-cyan-400">{filteredPatrols.length}</p>
                        <p className="text-[9px] text-gray-500">สายตรวจ</p>
                    </div>
                    <div className="h-8 w-px bg-gray-700" />
                    <div className="text-center">
                        <p className="text-lg font-bold text-rose-400">{filteredRiskZones.length}</p>
                        <p className="text-[9px] text-gray-500">จุดเสี่ยง</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
