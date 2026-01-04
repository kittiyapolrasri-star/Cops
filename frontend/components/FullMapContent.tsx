'use client';

import { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { trackingApi, riskzoneApi, organizationApi } from '@/lib/api';
import { Building2, Radio, AlertTriangle, MapPin, Eye, EyeOff, Search, X, Crosshair } from 'lucide-react';
import { searchLocation } from '@/lib/geocoding';

// ==================== ICONS ====================

const createStationIcon = (name: string, patrolCount: number, isSelected: boolean) => {
    const bgColor = isSelected ? '#10b981' : '#3b82f6';
    const borderColor = isSelected ? '#34d399' : '#60a5fa';
    return new L.DivIcon({
        html: `
            <div class="relative group cursor-pointer">
                <div class="w-8 h-8 rounded-lg ${isSelected ? 'scale-125' : ''}" style="background: ${bgColor}; border: 2px solid ${borderColor}; box-shadow: 0 0 12px ${bgColor}50;">
                    <div class="w-full h-full flex items-center justify-center">
                        <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
                        </svg>
                    </div>
                    ${patrolCount > 0 ? `
                        <div class="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center border border-white text-[8px] font-bold text-white">
                            ${patrolCount}
                        </div>
                    ` : ''}
                </div>
            </div>
        `,
        className: '',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -20],
    });
};

const createPatrolIcon = (rank: string, isActive: boolean) => {
    const color = isActive ? '#00ffff' : '#666666';
    return new L.DivIcon({
        html: `
            <div class="relative">
                <div class="w-6 h-6 bg-black/70 rounded-full border-2 flex items-center justify-center" style="border-color: ${color}; box-shadow: 0 0 10px ${color};">
                    <div class="w-2 h-2 rounded-full ${isActive ? 'animate-pulse' : ''}" style="background: ${color};"></div>
                </div>
            </div>
        `,
        className: '',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
        popupAnchor: [0, -15],
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

// ==================== MAP COMPONENTS ====================

function MapController({ center, zoom }: { center: [number, number], zoom: number }) {
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
    useEffect(() => { onZoomChange(map.getZoom()); }, [map, onZoomChange]);
    return null;
}

// ==================== MAIN COMPONENT ====================

export default function FullMapContent() {
    const [patrols, setPatrols] = useState<any[]>([]);
    const [riskZones, setRiskZones] = useState<any[]>([]);
    const [stations, setStations] = useState<any[]>([]);
    const [provinces, setProvinces] = useState<any[]>([]);
    const [bureaus, setBureaus] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Map state
    const [center, setCenter] = useState<[number, number]>([13.7563, 100.5018]);
    const [zoom, setZoom] = useState(6);
    const [currentZoom, setCurrentZoom] = useState(6);
    const [selectedStation, setSelectedStation] = useState<any>(null);

    // Filter state
    const [selectedProvince, setSelectedProvince] = useState<string>('');
    const [selectedBureau, setSelectedBureau] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState('');

    // Visibility toggles
    const [showStations, setShowStations] = useState(true);
    const [showPatrols, setShowPatrols] = useState(true);
    const [showRiskZones, setShowRiskZones] = useState(true);

    // Fetch data
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [patrolRes, riskRes, stationRes, bureauRes] = await Promise.all([
                    trackingApi.getActivePatrols(),
                    riskzoneApi.getAll(),
                    organizationApi.getStations(),
                    organizationApi.getBureaus()
                ]);

                if (patrolRes.data) setPatrols(patrolRes.data);
                if (riskRes.data) setRiskZones(riskRes.data);
                if (stationRes.data) setStations(stationRes.data);
                if (bureauRes.data) {
                    setBureaus(bureauRes.data);
                    const allProvinces = bureauRes.data.flatMap((b: any) => b.provinces || []);
                    setProvinces(allProvinces);
                }
            } catch (err) {
                console.error("Map data fetch error", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
        const interval = setInterval(fetchData, 15000);
        return () => clearInterval(interval);
    }, []);

    // Patrol count per station
    const patrolCountByStation = useMemo(() => {
        const counts: Record<string, number> = {};
        patrols.forEach(p => {
            const stationId = p.user?.stationId;
            if (stationId) counts[stationId] = (counts[stationId] || 0) + 1;
        });
        return counts;
    }, [patrols]);

    // Filtered stations
    const filteredStations = useMemo(() => {
        let result = stations;
        if (selectedProvince) {
            result = result.filter(s => s.provinceId === selectedProvince);
        }
        if (selectedBureau) {
            const bureauProvinces = provinces.filter(p => p.bureauId === selectedBureau).map(p => p.id);
            result = result.filter(s => bureauProvinces.includes(s.provinceId));
        }
        return result;
    }, [stations, selectedProvince, selectedBureau, provinces]);

    // Province center lookup
    useEffect(() => {
        if (selectedProvince) {
            const provinceStations = stations.filter(s => s.provinceId === selectedProvince);
            if (provinceStations.length > 0) {
                setCenter([provinceStations[0].latitude, provinceStations[0].longitude]);
                setZoom(10);
            }
        }
    }, [selectedProvince, stations]);

    // Station click handler
    const handleStationClick = (station: any) => {
        setSelectedStation(station);
        setCenter([station.latitude, station.longitude]);
        setZoom(14);
    };

    // Reset view
    const resetView = () => {
        setCenter([13.7563, 100.5018]);
        setZoom(6);
        setSelectedProvince('');
        setSelectedBureau('');
        setSelectedStation(null);
    };

    if (loading) {
        return (
            <div className="h-screen w-full bg-gray-950 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-emerald-500 font-mono tracking-widest text-sm">LOADING MAP DATA...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-64px)] w-full relative bg-gray-950">
            {/* Top Controls */}
            <div className="absolute top-4 left-4 right-4 z-[500] flex gap-3">
                {/* Search */}
                <div className="flex-1 flex gap-2 max-w-md">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="ค้นหาสถานที่..."
                            className="w-full pl-10 pr-4 py-2 bg-gray-900/95 border border-gray-700 rounded-lg text-white text-sm"
                        />
                    </div>
                </div>

                {/* Bureau Filter */}
                <select
                    value={selectedBureau}
                    onChange={(e) => { setSelectedBureau(e.target.value); setSelectedProvince(''); }}
                    className="px-3 py-2 bg-gray-900/95 border border-gray-700 rounded-lg text-white text-sm"
                >
                    <option value="">ทุกภาค</option>
                    {bureaus.map(b => (
                        <option key={b.id} value={b.id}>{b.name.replace('กองบัญชาการตำรวจ', '')}</option>
                    ))}
                </select>

                {/* Province Filter */}
                <select
                    value={selectedProvince}
                    onChange={(e) => setSelectedProvince(e.target.value)}
                    className="px-3 py-2 bg-gray-900/95 border border-gray-700 rounded-lg text-white text-sm"
                >
                    <option value="">ทุกจังหวัด</option>
                    {provinces
                        .filter(p => !selectedBureau || p.bureauId === selectedBureau)
                        .map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                </select>

                {/* Reset Button */}
                <button
                    onClick={resetView}
                    className="px-3 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-white text-sm flex items-center gap-2"
                >
                    <Crosshair className="w-4 h-4" />
                    รีเซ็ต
                </button>
            </div>

            {/* Legend Panel */}
            <div className="absolute top-20 right-4 z-[500] bg-gray-900/95 backdrop-blur-md border border-gray-700 rounded-xl p-3 shadow-2xl w-48">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2 font-bold">MAP LAYERS</p>

                <div className="space-y-1.5">
                    <button
                        onClick={() => setShowStations(!showStations)}
                        className={`flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-xs transition ${showStations ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-800 text-gray-500'}`}
                    >
                        <Building2 className="w-3 h-3" />
                        <span className="flex-1 text-left">สถานี ({filteredStations.length})</span>
                        {showStations ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                    </button>

                    <button
                        onClick={() => setShowPatrols(!showPatrols)}
                        className={`flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-xs transition ${showPatrols ? 'bg-cyan-500/20 text-cyan-400' : 'bg-gray-800 text-gray-500'}`}
                    >
                        <Radio className="w-3 h-3" />
                        <span className="flex-1 text-left">สายตรวจ ({patrols.length})</span>
                    </button>

                    <button
                        onClick={() => setShowRiskZones(!showRiskZones)}
                        className={`flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-xs transition ${showRiskZones ? 'bg-amber-500/20 text-amber-400' : 'bg-gray-800 text-gray-500'}`}
                    >
                        <AlertTriangle className="w-3 h-3" />
                        <span className="flex-1 text-left">จุดเสี่ยง ({riskZones.length})</span>
                    </button>
                </div>

                <div className="mt-3 pt-2 border-t border-gray-800 text-[10px] text-gray-500">
                    Zoom: {currentZoom} |
                    {currentZoom < 8 && ' 🌏 ประเทศ'}
                    {currentZoom >= 8 && currentZoom < 10 && ' 🗺️ ภาค'}
                    {currentZoom >= 10 && currentZoom < 12 && ' 🏛️ จังหวัด'}
                    {currentZoom >= 12 && currentZoom < 14 && ' 🏢 อำเภอ'}
                    {currentZoom >= 14 && ' 📍 สถานี'}
                </div>
            </div>

            {/* Selected Station Info */}
            {selectedStation && (
                <div className="absolute bottom-4 left-4 z-[500] bg-gray-900/95 backdrop-blur-md border border-gray-700 rounded-xl p-4 max-w-sm shadow-2xl">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <p className="text-xs text-blue-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                                <Building2 className="w-3 h-3" /> สถานีตำรวจ
                            </p>
                            <p className="text-white font-bold">{selectedStation.name}</p>
                            <p className="text-gray-400 text-sm mt-1">{selectedStation.address}</p>
                            <div className="flex gap-3 mt-3">
                                <div className="text-center">
                                    <p className="text-emerald-400 font-bold text-lg">{patrolCountByStation[selectedStation.id] || 0}</p>
                                    <p className="text-gray-500 text-[10px]">สายตรวจ</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-amber-400 font-bold text-lg">{riskZones.filter(z => z.stationId === selectedStation.id).length}</p>
                                    <p className="text-gray-500 text-[10px]">จุดเสี่ยง</p>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => setSelectedStation(null)}
                            className="text-gray-500 hover:text-white transition p-1"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* Stats Bar */}
            <div className="absolute bottom-4 right-4 z-[500] flex gap-3">
                <div className="bg-gray-900/95 border border-gray-700 rounded-lg px-3 py-2 text-center">
                    <p className="text-lg font-bold text-blue-400">{stations.length}</p>
                    <p className="text-[10px] text-gray-500">สถานี</p>
                </div>
                <div className="bg-gray-900/95 border border-gray-700 rounded-lg px-3 py-2 text-center">
                    <p className="text-lg font-bold text-cyan-400">{patrols.length}</p>
                    <p className="text-[10px] text-gray-500">ลาดตระเวน</p>
                </div>
                <div className="bg-gray-900/95 border border-gray-700 rounded-lg px-3 py-2 text-center">
                    <p className="text-lg font-bold text-emerald-400">{provinces.length}</p>
                    <p className="text-[10px] text-gray-500">จังหวัด</p>
                </div>
            </div>

            {/* Map */}
            <MapContainer
                center={center}
                zoom={zoom}
                className="w-full h-full"
                zoomControl={false}
                style={{ background: '#0a0a0a' }}
            >
                <TileLayer
                    attribution='&copy; OpenStreetMap &copy; CARTO'
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    maxZoom={20}
                />

                <MapController center={center} zoom={zoom} />
                <ZoomHandler onZoomChange={setCurrentZoom} />

                {/* Stations */}
                {showStations && filteredStations.map((station) => (
                    <Marker
                        key={station.id}
                        position={[station.latitude, station.longitude]}
                        icon={createStationIcon(
                            station.name,
                            patrolCountByStation[station.id] || 0,
                            selectedStation?.id === station.id
                        )}
                        eventHandlers={{
                            click: () => handleStationClick(station)
                        }}
                    >
                        <Popup>
                            <div className="p-2">
                                <h4 className="font-bold text-white text-sm">{station.name}</h4>
                                <p className="text-xs text-gray-400">{station.province?.name}</p>
                            </div>
                        </Popup>
                    </Marker>
                ))}

                {/* Risk Zones */}
                {showRiskZones && currentZoom >= 12 && riskZones
                    .filter(z => !selectedProvince || filteredStations.some(s => s.id === z.stationId))
                    .map((zone) => (
                        <Circle
                            key={zone.id}
                            center={[zone.latitude, zone.longitude]}
                            radius={zone.radius || 100}
                            pathOptions={{
                                color: getRiskColor(zone.riskLevel),
                                fillColor: getRiskColor(zone.riskLevel),
                                fillOpacity: 0.2,
                                weight: 2,
                            }}
                        >
                            <Popup>
                                <div className="p-2">
                                    <h4 className="font-bold text-white text-sm">{zone.name}</h4>
                                    <p className="text-xs text-gray-400">{zone.description}</p>
                                </div>
                            </Popup>
                        </Circle>
                    ))}

                {/* Patrols */}
                {showPatrols && currentZoom >= 10 && patrols.map((patrol) => {
                    const loc = patrol.locations?.[0];
                    if (!loc) return null;
                    return (
                        <Marker
                            key={patrol.id}
                            position={[loc.latitude, loc.longitude]}
                            icon={createPatrolIcon(patrol.user?.rank || '', true)}
                        >
                            <Popup>
                                <div className="p-2">
                                    <p className="font-bold text-white text-sm">{patrol.user?.rank} {patrol.user?.firstName}</p>
                                    <p className="text-xs text-emerald-400">ON DUTY</p>
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}
            </MapContainer>
        </div>
    );
}
