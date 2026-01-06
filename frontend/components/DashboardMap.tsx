'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, GeoJSON, useMap, useMapEvents, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { trackingApi, riskzoneApi, organizationApi, poiApi, crimeApi, sosApi, patrolPlanApi } from '@/lib/api';
import {
    createStationIcon,
    createPatrolIcon,
    createSelectedIcon,
    getRiskColor,
    getThreatCategoryColor,
    MAP_TILES,
    ZOOM_LEVELS,
    THAILAND_CENTER,
    THAILAND_GEOJSON_URL,
    provinceNameMap,
} from '@/lib/mapUtils';
import MapSearchBar from './MapSearchBar';
import LocationDetailPanel, { DetailItemType } from './LocationDetailPanel';
import {
    Building2,
    Radio,
    AlertTriangle,
    MapPin,
    Eye,
    EyeOff,
    Shield,
    Users,
    Clock,
    Zap,
    ChevronDown,
    RotateCcw,
    X,
    Flame,
    Siren,
    LandPlot,
    Crosshair,
    Layers,
    Navigation,
} from 'lucide-react';

// ==================== MAP COMPONENTS ====================

function MapController({ center, zoom, trigger }: { center: [number, number]; zoom: number; trigger: number }) {
    const map = useMap();
    useEffect(() => {
        if (center[0] !== 0 && center[1] !== 0 && trigger > 0) {
            map.flyTo(center, zoom, { duration: 1.5 });
        }
    }, [center[0], center[1], zoom, trigger, map]);
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

// Handler to close detail panel when clicking on map background
function MapClickHandler({ onMapClick }: { onMapClick: () => void }) {
    useMapEvents({
        click: (e) => {
            // Only trigger if clicking on map background (not on markers)
            if (e.originalEvent.target === e.target.getContainer()) {
                onMapClick();
            }
        },
    });
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
    const [bureaus, setBureaus] = useState<any[]>([]);
    const [provinces, setProvinces] = useState<any[]>([]);
    const [geoJsonData, setGeoJsonData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // ===== NEW LAYER DATA =====
    const [pois, setPois] = useState<any[]>([]);
    const [crimes, setCrimes] = useState<any[]>([]);
    const [sosAlerts, setSosAlerts] = useState<any[]>([]);

    // Map state
    const [center, setCenter] = useState<[number, number]>(THAILAND_CENTER);
    const [currentZoom, setCurrentZoom] = useState(6);
    const [flyTrigger, setFlyTrigger] = useState(0); // Increment to force fly animation
    const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);
    const [selectedStation, setSelectedStation] = useState<string | null>(null);

    // ===== DETAIL PANEL STATE =====
    const [detailPanelOpen, setDetailPanelOpen] = useState(false);
    const [detailItem, setDetailItem] = useState<any>(null);
    const [detailType, setDetailType] = useState<DetailItemType>('station');

    // ===== HIERARCHY FILTERS =====
    const [selectedBureau, setSelectedBureau] = useState<string>('');
    const [selectedProvince, setSelectedProvince] = useState<string>('');

    // ===== VISIBILITY TOGGLES =====
    const [showStations, setShowStations] = useState(true);
    const [showPatrols, setShowPatrols] = useState(true);
    const [showRiskZones, setShowRiskZones] = useState(true);
    // New layer toggles
    const [showPois, setShowPois] = useState(false);
    const [showCrimes, setShowCrimes] = useState(false);
    const [showSos, setShowSos] = useState(true);
    const [showHeatmap, setShowHeatmap] = useState(false);

    // ===== USER LOCATION =====
    const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
    const [isLocating, setIsLocating] = useState(false);

    // ===== SEARCH FILTERS =====
    const [searchRadius, setSearchRadius] = useState<number>(0); // 0 = no filter, in km
    const [crimeMonthFilter, setCrimeMonthFilter] = useState<number>(0); // 0 = all, 3/6/12 months

    // ===== PATROL PLAN DISPLAY =====
    const [showPatrolRoute, setShowPatrolRoute] = useState(false);
    const [patrolPlans, setPatrolPlans] = useState<any[]>([]);

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

    // ===== INTERCEPT POINTS (Layer 6) =====
    const [showInterceptPoints, setShowInterceptPoints] = useState(false);
    const [selectedSOS, setSelectedSOS] = useState<any>(null);

    // Zoom thresholds
    const zoomShowStations = currentZoom >= 8;
    const zoomShowPatrols = currentZoom >= 10;
    const zoomShowRiskZones = currentZoom >= 9;
    const zoomShowRiskDetails = currentZoom >= 13;

    // Fetch data based on time mode
    const fetchData = useCallback(async () => {
        try {
            // Fetch patrols based on time mode (live vs historical)
            const patrolPromise = timeMode === 'live'
                ? trackingApi.getActivePatrols()
                : trackingApi.getHistoricalPatrols(undefined, 24);

            const [patrolRes, riskRes, stationRes, bureauRes, provinceRes, poiRes, crimeRes, sosRes, planRes] = await Promise.all([
                patrolPromise,
                riskzoneApi.getAll(),
                organizationApi.getStations(),
                organizationApi.getBureaus(),
                organizationApi.getProvinces(),
                poiApi.getAll(),
                crimeApi.getHeatmap(),
                sosApi.getActive(),
                patrolPlanApi.getAll(),
            ]);

            if (patrolRes.data) setPatrols(patrolRes.data);
            if (riskRes.data) setRiskZones(riskRes.data);
            if (stationRes.data) setStations(stationRes.data);
            if (bureauRes.data) setBureaus(bureauRes.data);
            if (provinceRes.data) setProvinces(provinceRes.data);
            if (poiRes.data) setPois(poiRes.data);
            if (crimeRes.data) setCrimes(crimeRes.data);
            if (sosRes.data) setSosAlerts(sosRes.data);
            if (planRes.data) setPatrolPlans(planRes.data);
        } catch (err) {
            console.error('Map data fetch error', err);
        } finally {
            setLoading(false);
        }
    }, [timeMode]);

    // Fetch GeoJSON
    useEffect(() => {
        fetch(THAILAND_GEOJSON_URL)
            .then((res) => res.json())
            .then((data) => setGeoJsonData(data))
            .catch(console.error);
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
                setCurrentZoom(zoom || ZOOM_LEVELS.STATION);
                setFlyTrigger((prev) => prev + 1);
            }
        };
        window.addEventListener('flyToLocation', handleFlyTo as EventListener);
        return () => window.removeEventListener('flyToLocation', handleFlyTo as EventListener);
    }, []);

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
        return result;
    }, [stations, selectedProvince, selectedBureau, filteredProvinces]);

    // Count patrols per station
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

    // Filtered risk zones by threat category and province
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

    // Filtered crimes by date (3/6/12 months)
    const filteredCrimes = useMemo(() => {
        if (crimeMonthFilter === 0) return crimes;
        const cutoffDate = new Date();
        cutoffDate.setMonth(cutoffDate.getMonth() - crimeMonthFilter);
        return crimes.filter((c: any) => {
            const crimeDate = new Date(c.occurredAt);
            return crimeDate >= cutoffDate;
        });
    }, [crimes, crimeMonthFilter]);

    // Find nearest patrols to a given location
    const findNearestPatrols = useCallback((lat: number, lng: number, count: number = 5) => {
        return filteredPatrols
            .map((p) => ({
                ...p,
                distance: calculateDistance(lat, lng, p.currentLocation.latitude, p.currentLocation.longitude),
            }))
            .sort((a, b) => a.distance - b.distance)
            .slice(0, count);
    }, [filteredPatrols]);

    // Calculate intercept points for SOS response (Layer 6)
    // Suggests optimal positions where patrols should move to intercept/respond
    const calculateInterceptPoints = useCallback((sosLat: number, sosLng: number): {
        point: [number, number];
        direction: string;
        distance: number;
        assignedPatrol?: any;
    }[] => {
        // Calculate 4 cardinal intercept points (N, S, E, W) around SOS location
        const interceptRadius = 0.5; // km from SOS
        const directions = [
            { name: 'เหนือ', bearing: 0 },
            { name: 'ตะวันออก', bearing: 90 },
            { name: 'ใต้', bearing: 180 },
            { name: 'ตะวันตก', bearing: 270 },
        ];

        const R = 6371; // Earth's radius in km
        const d = interceptRadius / R;
        const lat1 = sosLat * Math.PI / 180;
        const lon1 = sosLng * Math.PI / 180;

        const nearbyPatrols = findNearestPatrols(sosLat, sosLng, 8);

        return directions.map((dir, idx) => {
            const brng = dir.bearing * Math.PI / 180;
            const lat2 = Math.asin(Math.sin(lat1) * Math.cos(d) + Math.cos(lat1) * Math.sin(d) * Math.cos(brng));
            const lon2 = lon1 + Math.atan2(Math.sin(brng) * Math.sin(d) * Math.cos(lat1), Math.cos(d) - Math.sin(lat1) * Math.sin(lat2));

            const interceptPoint: [number, number] = [lat2 * 180 / Math.PI, lon2 * 180 / Math.PI];

            // Assign the closest unassigned patrol to this intercept point
            const assignedPatrol = nearbyPatrols[idx] || null;

            return {
                point: interceptPoint,
                direction: dir.name,
                distance: interceptRadius,
                assignedPatrol,
            };
        });
    }, [findNearestPatrols]);

    // Province info for selected province
    const provinceInfo = useMemo(() => {
        if (!selectedProvince) return null;
        const prov = provinces.find((p) => p.id === selectedProvince);
        if (!prov) return null;
        return {
            ...prov,
            stationCount: filteredStations.length,
            patrolCount: filteredPatrols.length,
            riskCount: filteredRiskZones.length,
        };
    }, [selectedProvince, provinces, filteredStations, filteredPatrols, filteredRiskZones]);

    // Handle province selection
    const handleProvinceSelect = (provinceId: string) => {
        setSelectedProvince(provinceId);
        setSelectedStation(null);
        setSelectedResult(null);

        if (!provinceId) {
            // Reset if cleared
            return;
        }

        // Province doesn't have lat/lng in DB, calculate from stations in this province
        const provinceStations = stations.filter((s) => s.provinceId === provinceId && s.latitude && s.longitude);
        if (provinceStations.length > 0) {
            const avgLat = provinceStations.reduce((sum, s) => sum + s.latitude, 0) / provinceStations.length;
            const avgLng = provinceStations.reduce((sum, s) => sum + s.longitude, 0) / provinceStations.length;
            setCenter([avgLat, avgLng]);
            setCurrentZoom(ZOOM_LEVELS.PROVINCE);
            setFlyTrigger((prev) => prev + 1);
        } else {
            // No stations with coordinates, try to find any station to at least identify the region
            console.warn(`Province ${provinceId} has no stations with coordinates`);
        }
    };

    // Handle bureau selection
    const handleBureauSelect = (bureauId: string) => {
        setSelectedBureau(bureauId);
        setSelectedProvince('');
        setSelectedStation(null);
        setSelectedResult(null);

        if (!bureauId) {
            // Reset to Thailand view
            setCenter(THAILAND_CENTER);
            setCurrentZoom(6);
            setFlyTrigger((prev) => prev + 1);
        } else {
            // Calculate center from stations in this bureau's provinces
            const bureauProvinceIds = provinces.filter((p) => p.bureauId === bureauId).map((p) => p.id);
            const bureauStations = stations.filter((s) => bureauProvinceIds.includes(s.provinceId) && s.latitude && s.longitude);

            if (bureauStations.length > 0) {
                const avgLat = bureauStations.reduce((sum, s) => sum + s.latitude, 0) / bureauStations.length;
                const avgLng = bureauStations.reduce((sum, s) => sum + s.longitude, 0) / bureauStations.length;
                setCenter([avgLat, avgLng]);
                setCurrentZoom(ZOOM_LEVELS.REGION);
                setFlyTrigger((prev) => prev + 1);
            } else {
                console.warn(`Bureau ${bureauId} has no stations with coordinates`);
            }
        }
    };

    // Handle search selection
    const handleSearchSelect = (result: SearchResult) => {
        if (result.lat && result.lng) {
            setCenter([result.lat, result.lng]);
            setSelectedResult(result);

            // Set zoom level based on result type
            if (result.type === 'station') {
                setSelectedStation(result.id);
                setCurrentZoom(ZOOM_LEVELS.STATION);
            } else if (result.type === 'riskzone') {
                setCurrentZoom(ZOOM_LEVELS.DISTRICT);
            } else if (result.type === 'patrol') {
                setCurrentZoom(ZOOM_LEVELS.STREET);
            } else {
                setCurrentZoom(ZOOM_LEVELS.DISTRICT);
            }

            setFlyTrigger((prev) => prev + 1);
        }
    };

    // Handle station click
    const handleStationClick = (station: any) => {
        setCenter([station.latitude, station.longitude]);
        setCurrentZoom(ZOOM_LEVELS.STATION);
        setSelectedStation(station.id);
        setSelectedResult({
            type: 'station',
            id: station.id,
            name: station.name,
            lat: station.latitude,
            lng: station.longitude,
            data: station,
        });
        setFlyTrigger((prev) => prev + 1);
    };

    // Reset view
    const resetView = () => {
        setSelectedBureau('');
        setSelectedProvince('');
        setSelectedStation(null);
        setSelectedResult(null);
        setCenter(THAILAND_CENTER);
        setCurrentZoom(6);
        setFlyTrigger((prev) => prev + 1);
    };

    // Toggle threat filter
    const toggleThreatFilter = (category: string) => {
        setThreatFilters((prev) => ({
            ...prev,
            [category]: !prev[category as keyof typeof prev],
        }));
    };

    // Open detail panel
    const openDetailPanel = (item: any, type: DetailItemType) => {
        setDetailItem(item);
        setDetailType(type);
        setDetailPanelOpen(true);
    };

    // Handle zoom from detail panel
    const handleDetailZoom = (lat: number, lng: number) => {
        setCenter([lat, lng]);
        setCurrentZoom(16);
        setFlyTrigger((prev) => prev + 1);
    };

    // Get user's current location
    const getUserLocation = () => {
        if (!navigator.geolocation) {
            alert('เบราว์เซอร์ไม่รองรับ Geolocation');
            return;
        }

        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const newLocation: [number, number] = [position.coords.latitude, position.coords.longitude];
                setUserLocation(newLocation);
                setCenter(newLocation);
                setCurrentZoom(15);
                setFlyTrigger((prev) => prev + 1);
                setIsLocating(false);
            },
            (error) => {
                console.error('Geolocation error:', error);
                alert('ไม่สามารถหาตำแหน่งได้: ' + error.message);
                setIsLocating(false);
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    // Heatmap data from crimes
    const heatmapData = useMemo(() => {
        return crimes
            .filter((c: any) => c.latitude && c.longitude)
            .map((c: any) => ({
                lat: c.latitude,
                lng: c.longitude,
                intensity: c.type === 'VIOLENT' ? 1 : c.type === 'DRUGS' ? 0.8 : 0.5,
            }));
    }, [crimes]);

    // Calculate distance between two points (Haversine formula)
    const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
        const R = 6371; // km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    };

    // Filter data by radius from user location or center
    const filterByRadius = useCallback((items: any[], radiusKm: number) => {
        if (radiusKm === 0 || !items) return items;
        const refPoint = userLocation || center;
        return items.filter((item: any) => {
            if (!item.latitude || !item.longitude) return false;
            const dist = calculateDistance(refPoint[0], refPoint[1], item.latitude, item.longitude);
            return dist <= radiusKm;
        });
    }, [userLocation, center]);

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
            {/* ===== TOP FILTER BAR ===== */}
            <div className="absolute top-4 left-56 z-[500] flex gap-2">
                {/* Bureau Filter */}
                <div className="relative">
                    <select
                        value={selectedBureau}
                        onChange={(e) => handleBureauSelect(e.target.value)}
                        className="bg-black/70 backdrop-blur-md border border-gray-700 rounded-xl px-3 py-2 text-xs text-white appearance-none cursor-pointer pr-7 focus:outline-none focus:border-emerald-500 min-w-[100px]"
                    >
                        <option value="">ทุกภาค</option>
                        {bureaus.map((b) => (
                            <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500 pointer-events-none" />
                </div>

                {/* Province Filter */}
                <div className="relative">
                    <select
                        value={selectedProvince}
                        onChange={(e) => handleProvinceSelect(e.target.value)}
                        className="bg-black/70 backdrop-blur-md border border-gray-700 rounded-xl px-3 py-2 text-xs text-white appearance-none cursor-pointer pr-7 focus:outline-none focus:border-emerald-500 min-w-[100px]"
                    >
                        <option value="">ทุกจังหวัด</option>
                        {filteredProvinces.map((p) => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500 pointer-events-none" />
                </div>

                {/* Reset Button */}
                {(selectedBureau || selectedProvince) && (
                    <button
                        onClick={resetView}
                        className="bg-black/70 backdrop-blur-md border border-gray-700 rounded-xl px-3 py-2 text-xs text-gray-400 hover:text-white hover:border-gray-500 transition flex items-center gap-1"
                    >
                        <RotateCcw className="w-3 h-3" />
                        รีเซ็ต
                    </button>
                )}
            </div>

            {/* Search Bar */}
            <MapSearchBar
                onSelect={handleSearchSelect}
                stations={stations}
                riskZones={riskZones}
                patrols={filteredPatrols}
            />

            {/* ===== LEGEND & LAYER CONTROLS (Hidden on mobile, visible md+) ===== */}
            <div className="absolute top-4 right-4 z-[500] bg-gray-900/95 backdrop-blur-md border border-gray-700 rounded-xl p-3 shadow-2xl max-w-[180px] hidden md:block">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2 font-bold">Map Layers</p>

                {/* Layer Toggles */}
                <div className="space-y-1 mb-2">
                    <button
                        onClick={() => setShowStations(!showStations)}
                        className={`w-full flex items-center gap-2 px-2 py-1 rounded-lg text-[10px] transition ${showStations ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-800 text-gray-500'
                            }`}
                    >
                        <Building2 className="w-3 h-3" />
                        <span>สถานี ({filteredStations.length})</span>
                    </button>

                    <button
                        onClick={() => setShowPatrols(!showPatrols)}
                        className={`w-full flex items-center gap-2 px-2 py-1 rounded-lg text-[10px] transition ${showPatrols ? 'bg-cyan-500/20 text-cyan-400' : 'bg-gray-800 text-gray-500'
                            }`}
                    >
                        <Radio className="w-3 h-3" />
                        <span>สายตรวจ ({filteredPatrols.length})</span>
                    </button>

                    <button
                        onClick={() => setShowRiskZones(!showRiskZones)}
                        className={`w-full flex items-center gap-2 px-2 py-1 rounded-lg text-[10px] transition ${showRiskZones ? 'bg-rose-500/20 text-rose-400' : 'bg-gray-800 text-gray-500'
                            }`}
                    >
                        <AlertTriangle className="w-3 h-3" />
                        <span>จุดเสี่ยง ({filteredRiskZones.length})</span>
                    </button>

                    {/* New Layers */}
                    <button
                        onClick={() => setShowPois(!showPois)}
                        className={`w-full flex items-center gap-2 px-2 py-1 rounded-lg text-[10px] transition ${showPois ? 'bg-purple-500/20 text-purple-400' : 'bg-gray-800 text-gray-500'
                            }`}
                    >
                        <LandPlot className="w-3 h-3" />
                        <span>POI ({pois.length})</span>
                    </button>

                    <button
                        onClick={() => setShowCrimes(!showCrimes)}
                        className={`w-full flex items-center gap-2 px-2 py-1 rounded-lg text-[10px] transition ${showCrimes ? 'bg-orange-500/20 text-orange-400' : 'bg-gray-800 text-gray-500'
                            }`}
                    >
                        <Flame className="w-3 h-3" />
                        <span>อาชญากรรม ({crimes.length})</span>
                    </button>

                    <button
                        onClick={() => setShowSos(!showSos)}
                        className={`w-full flex items-center gap-2 px-2 py-1 rounded-lg text-[10px] transition ${showSos ? 'bg-red-500/20 text-red-400 animate-pulse' : 'bg-gray-800 text-gray-500'
                            }`}
                    >
                        <Siren className="w-3 h-3" />
                        <span>SOS ({sosAlerts.length})</span>
                    </button>

                    <button
                        onClick={() => setShowHeatmap(!showHeatmap)}
                        className={`w-full flex items-center gap-2 px-2 py-1 rounded-lg text-[10px] transition ${showHeatmap ? 'bg-gradient-to-r from-yellow-500/20 via-orange-500/20 to-red-500/20 text-orange-400' : 'bg-gray-800 text-gray-500'
                            }`}
                    >
                        <Layers className="w-3 h-3" />
                        <span>Heatmap</span>
                    </button>

                    <button
                        onClick={() => setShowPatrolRoute(!showPatrolRoute)}
                        className={`w-full flex items-center gap-2 px-2 py-1 rounded-lg text-[10px] transition ${showPatrolRoute ? 'bg-cyan-500/20 text-cyan-400' : 'bg-gray-800 text-gray-500'
                            }`}
                    >
                        <Navigation className="w-3 h-3" />
                        <span>เส้นทางตรวจ ({patrolPlans.length})</span>
                    </button>
                </div>

                {/* Crime Date Filter */}
                <div className="border-t border-gray-700 pt-2">
                    <p className="text-[9px] text-gray-500 uppercase mb-1">ช่วงเวลาคดี</p>
                    <select
                        value={crimeMonthFilter}
                        onChange={(e) => setCrimeMonthFilter(Number(e.target.value))}
                        className="w-full bg-gray-800 text-white text-[10px] px-2 py-1 rounded-lg border border-gray-600 focus:outline-none focus:border-cyan-500"
                    >
                        <option value={0}>ทั้งหมด</option>
                        <option value={3}>3 เดือน</option>
                        <option value={6}>6 เดือน</option>
                        <option value={12}>12 เดือน</option>
                    </select>
                    {crimeMonthFilter > 0 && (
                        <p className="text-[9px] text-orange-400 mt-1">
                            แสดง {filteredCrimes.length} คดี จาก {crimes.length}
                        </p>
                    )}
                </div>

                {/* Threat Filters */}
                <div className="border-t border-gray-700 pt-2">
                    <p className="text-[9px] text-gray-500 uppercase mb-1">Threats</p>
                    <div className="flex flex-wrap gap-1">
                        {Object.entries(threatFilters).map(([cat, enabled]) => {
                            const { color, emoji } = getThreatCategoryColor(cat);
                            return (
                                <button
                                    key={cat}
                                    onClick={() => toggleThreatFilter(cat)}
                                    className={`px-1 py-0.5 rounded text-[9px] transition ${enabled ? 'opacity-100' : 'opacity-40'}`}
                                    style={{ backgroundColor: enabled ? `${color}30` : '#374151', color: enabled ? color : '#6b7280' }}
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
                            className={`flex-1 flex items-center justify-center gap-1 px-1 py-1 rounded text-[9px] transition ${timeMode === 'live' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-800 text-gray-500'
                                }`}
                        >
                            <Zap className="w-2.5 h-2.5" />Live
                        </button>
                        <button
                            onClick={() => setTimeMode('historical')}
                            className={`flex-1 flex items-center justify-center gap-1 px-1 py-1 rounded text-[9px] transition ${timeMode === 'historical' ? 'bg-amber-500/20 text-amber-400' : 'bg-gray-800 text-gray-500'
                                }`}
                        >
                            <Clock className="w-2.5 h-2.5" />24h
                        </button>
                    </div>
                </div>

                <div className="border-t border-gray-700 pt-1 mt-2 text-[9px] text-gray-600 text-center">
                    Zoom: {currentZoom}
                </div>
            </div>

            {/* ===== PROVINCE INFO PANEL ===== */}
            {provinceInfo && (
                <div className="absolute top-36 left-56 z-[400] bg-black/90 backdrop-blur-md border border-emerald-500/50 rounded-xl p-3 shadow-2xl">
                    <div className="flex items-center gap-2 mb-2">
                        <MapPin className="w-4 h-4 text-emerald-400" />
                        <h3 className="font-bold text-white text-sm">{provinceInfo.name}</h3>
                    </div>
                    <div className="flex gap-2 text-center text-[10px]">
                        <div className="bg-gray-800 rounded px-2 py-1">
                            <p className="text-blue-400 font-bold">{provinceInfo.stationCount}</p>
                            <p className="text-gray-500">สถานี</p>
                        </div>
                        <div className="bg-gray-800 rounded px-2 py-1">
                            <p className="text-cyan-400 font-bold">{provinceInfo.patrolCount}</p>
                            <p className="text-gray-500">สายตรวจ</p>
                        </div>
                        <div className="bg-gray-800 rounded px-2 py-1">
                            <p className="text-rose-400 font-bold">{provinceInfo.riskCount}</p>
                            <p className="text-gray-500">จุดเสี่ยง</p>
                        </div>
                    </div>
                </div>
            )}

            {/* ===== FLOATING CONTROLS (Right Side) ===== */}
            <div className="absolute right-[200px] top-1/2 -translate-y-1/2 z-[450] flex flex-col gap-2">
                {/* My Location Button */}
                <button
                    onClick={getUserLocation}
                    disabled={isLocating}
                    className={`p-3 rounded-full shadow-lg transition-all ${isLocating
                        ? 'bg-blue-600 animate-pulse'
                        : userLocation
                            ? 'bg-blue-600 hover:bg-blue-500'
                            : 'bg-gray-800 hover:bg-gray-700'
                        } text-white`}
                    title="ตำแหน่งของฉัน"
                >
                    <Crosshair className={`w-5 h-5 ${isLocating ? 'animate-spin' : ''}`} />
                </button>

                {/* Zoom Controls */}
                <button
                    onClick={() => { setCurrentZoom(Math.min(currentZoom + 1, 18)); setFlyTrigger(t => t + 1); }}
                    className="p-3 bg-gray-800 hover:bg-gray-700 rounded-full shadow-lg text-white"
                    title="ซูมเข้า"
                >
                    <span className="text-lg font-bold">+</span>
                </button>
                <button
                    onClick={() => { setCurrentZoom(Math.max(currentZoom - 1, 5)); setFlyTrigger(t => t + 1); }}
                    className="p-3 bg-gray-800 hover:bg-gray-700 rounded-full shadow-lg text-white"
                    title="ซูมออก"
                >
                    <span className="text-lg font-bold">−</span>
                </button>
            </div>

            {/* ===== RADIUS FILTER (Bottom Center) ===== */}
            <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-[450] bg-gray-900/95 backdrop-blur-md rounded-full px-4 py-2 border border-gray-700 flex items-center gap-3">
                <span className="text-xs text-gray-400">รัศมี:</span>
                <select
                    value={searchRadius}
                    onChange={(e) => setSearchRadius(Number(e.target.value))}
                    className="bg-gray-800 text-white text-xs px-2 py-1 rounded-lg border border-gray-600 focus:outline-none focus:border-cyan-500"
                >
                    <option value={0}>ทั้งหมด</option>
                    <option value={1}>1 กม.</option>
                    <option value={3}>3 กม.</option>
                    <option value={5}>5 กม.</option>
                    <option value={10}>10 กม.</option>
                    <option value={20}>20 กม.</option>
                </select>
                {searchRadius > 0 && (
                    <span className="text-xs text-cyan-400">
                        จากตำแหน่ง{userLocation ? 'ของคุณ' : 'กลางแผนที่'}
                    </span>
                )}
            </div>

            {/* ===== MAP CONTAINER ===== */}
            <MapContainer
                center={THAILAND_CENTER}
                zoom={6}
                className="w-full h-full"
                zoomControl={false}
                style={{ background: '#0a0a0a' }}
            >
                <TileLayer url={MAP_TILES.dark} attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' />
                <MapController center={center} zoom={currentZoom} trigger={flyTrigger} />
                <ZoomHandler onZoomChange={setCurrentZoom} />
                <MapClickHandler onMapClick={() => setDetailPanelOpen(false)} />

                {/* GeoJSON Province Boundaries */}
                {geoJsonData && <GeoJSON data={geoJsonData} style={geoJsonStyle} />}

                {/* User Location Marker */}
                {userLocation && (
                    <Marker
                        position={userLocation}
                        icon={L.divIcon({
                            className: 'user-location-marker',
                            html: `
                                <div style="position: relative;">
                                    <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 40px; height: 40px; background: rgba(59, 130, 246, 0.3); border-radius: 50%; animation: pulse 2s ease-out infinite;"></div>
                                    <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 16px; height: 16px; background: #3b82f6; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(59, 130, 246, 0.7);"></div>
                                </div>
                            `,
                            iconSize: [40, 40],
                            iconAnchor: [20, 20],
                        })}
                        zIndexOffset={2000}
                    >
                        <Popup>
                            <div className="bg-gray-900 text-white p-2 rounded text-center">
                                <p className="font-bold text-sm text-blue-400">📍 ตำแหน่งของคุณ</p>
                                <p className="text-xs text-gray-400 font-mono">
                                    {userLocation[0].toFixed(6)}, {userLocation[1].toFixed(6)}
                                </p>
                            </div>
                        </Popup>
                    </Marker>
                )}

                {/* Search Radius Circle */}
                {searchRadius > 0 && (userLocation || center) && (
                    <Circle
                        center={userLocation || center}
                        radius={searchRadius * 1000}
                        pathOptions={{
                            color: '#06b6d4',
                            fillColor: '#06b6d4',
                            fillOpacity: 0.1,
                            weight: 2,
                            dashArray: '5, 10',
                        }}
                    />
                )}

                {/* Crime Heatmap Layer */}
                {showHeatmap && heatmapData.map((point: any, idx: number) => (
                    <Circle
                        key={`heat-${idx}`}
                        center={[point.lat, point.lng]}
                        radius={200 * point.intensity}
                        pathOptions={{
                            color: 'transparent',
                            fillColor: point.intensity > 0.7 ? '#ef4444' : point.intensity > 0.5 ? '#f97316' : '#eab308',
                            fillOpacity: 0.4 * point.intensity,
                            weight: 0,
                        }}
                    />
                ))}

                {/* Patrol Plan Routes */}
                {showPatrolRoute && patrolPlans.map((plan: any) => {
                    const checkpoints = plan.checkpoints || [];
                    if (checkpoints.length < 2) return null;

                    // Sort by sequence and create path
                    const sortedPoints = [...checkpoints]
                        .sort((a: any, b: any) => a.sequence - b.sequence)
                        .map((cp: any) => [cp.latitude, cp.longitude] as [number, number]);

                    return (
                        <React.Fragment key={`route-${plan.id}`}>
                            {/* Route Line */}
                            <Polyline
                                positions={sortedPoints}
                                pathOptions={{
                                    color: '#06b6d4',
                                    weight: 3,
                                    opacity: 0.8,
                                    dashArray: '10, 10',
                                }}
                            />
                            {/* Checkpoint Markers */}
                            {checkpoints.map((cp: any) => (
                                <Marker
                                    key={cp.id}
                                    position={[cp.latitude, cp.longitude]}
                                    icon={L.divIcon({
                                        className: 'checkpoint-marker',
                                        html: `<div style="background: #06b6d4; color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">${cp.sequence}</div>`,
                                        iconSize: [24, 24],
                                        iconAnchor: [12, 12],
                                    })}
                                >
                                    <Popup>
                                        <div className="bg-gray-900 text-white p-2 rounded min-w-[150px]">
                                            <p className="font-bold text-sm text-cyan-400">📍 {cp.name}</p>
                                            <p className="text-xs text-gray-400">ลำดับที่ {cp.sequence}</p>
                                            <p className="text-xs text-gray-400">รัศมี {cp.radius || 50}m</p>
                                            {cp.stayDuration && (
                                                <p className="text-xs text-gray-400">อยู่ {cp.stayDuration} นาที</p>
                                            )}
                                        </div>
                                    </Popup>
                                </Marker>
                            ))}
                        </React.Fragment>
                    );
                })}

                {/* Stations */}
                {showStations && zoomShowStations && filteredStations.filter((s) => s.latitude && s.longitude).map((station) => (
                    <Marker
                        key={station.id}
                        position={[station.latitude, station.longitude]}
                        icon={createStationIcon(station.name, patrolCountByStation[station.id] || 0, selectedStation === station.id, false)}
                        eventHandlers={{ click: () => handleStationClick(station) }}
                    >
                        {/* Simple tooltip-style popup */}
                        <Popup className="station-tooltip" closeButton={false} autoPan={false}>
                            <div className="bg-gray-900 text-white px-2 py-1 rounded text-xs">
                                <span className="font-bold">{station.name.replace('สถานีตำรวจภูธร', 'สภ.')}</span>
                                <span className="text-gray-400 ml-2">({patrolCountByStation[station.id] || 0} สายตรวจ)</span>
                            </div>
                        </Popup>
                    </Marker>
                ))}

                {/* Historical Patrol Trails (Time Mode) */}
                {timeMode === 'historical' && filteredPatrols.map((patrol) => {
                    const locations = patrol.locations?.map((l: any) => [l.latitude, l.longitude]) || [];
                    if (locations.length < 2) return null;
                    return (
                        <Polyline
                            key={`trail-${patrol.id}`}
                            positions={locations}
                            pathOptions={{
                                color: '#f59e0b', // Amber for history
                                weight: 3,
                                opacity: 0.6,
                                dashArray: '5, 10'
                            }}
                        />
                    );
                })}

                {/* Patrols */}
                {showPatrols && zoomShowPatrols && filteredPatrols.map((patrol) => (
                    <Marker
                        key={patrol.id}
                        position={
                            timeMode === 'historical' && patrol.locations?.[0]
                                ? [patrol.locations[0].latitude, patrol.locations[0].longitude]
                                : [patrol.currentLocation?.latitude || patrol.latitude, patrol.currentLocation?.longitude || patrol.longitude]
                        }
                        icon={createPatrolIcon(patrol.user?.rank || 'N/A', timeMode === 'live')}
                    >
                        <Popup>
                            <div className="bg-gray-900 text-white p-2 rounded">
                                <p className="font-bold text-sm">{patrol.user?.rank} {patrol.user?.firstName}</p>
                                <p className="text-xs text-gray-400">{patrol.user?.station?.name}</p>
                                {timeMode === 'historical' && (
                                    <p className="text-xs text-amber-500 mt-1">🕒 Historical Path</p>
                                )}
                            </div>
                        </Popup>
                    </Marker>
                ))}

                {/* Risk Zones */}
                {showRiskZones && zoomShowRiskZones && filteredRiskZones.filter((zone) => zone.latitude && zone.longitude).map((zone) => {
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
                                    <p className="text-xs text-gray-400">ตรวจ: {zone.requiredCheckIns || 1}x/วัน</p>
                                </div>
                            </Popup>
                        </Circle>
                    );
                })}

                {/* POI Markers */}
                {showPois && pois.filter((poi: any) => poi.latitude && poi.longitude).map((poi: any) => (
                    <Marker
                        key={poi.id}
                        position={[poi.latitude, poi.longitude]}
                        icon={L.divIcon({
                            className: 'custom-marker',
                            html: `<div style="background: #8b5cf6; color: white; border-radius: 50%; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; font-size: 14px; border: 2px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); cursor: pointer;">📍</div>`,
                            iconSize: [28, 28],
                            iconAnchor: [14, 14],
                        })}
                        eventHandlers={{
                            click: () => openDetailPanel(poi, 'poi'),
                        }}
                    >
                        <Popup>
                            <div className="bg-gray-900 text-white p-3 rounded min-w-[200px]">
                                <p className="font-bold text-sm">{poi.name}</p>
                                <p className="text-xs text-purple-400">{poi.category}</p>
                                <p className="text-xs text-gray-400 mt-1">{poi.address}</p>
                                <button
                                    onClick={(e) => { e.stopPropagation(); openDetailPanel(poi, 'poi'); }}
                                    className="mt-2 w-full bg-purple-600 hover:bg-purple-500 text-white text-xs py-1.5 rounded transition-colors"
                                >
                                    ดูรายละเอียด
                                </button>
                            </div>
                        </Popup>
                    </Marker>
                ))}

                {/* Crime Heatmap (as circles) */}
                {showCrimes && filteredCrimes.filter((crime: any) => crime.latitude && crime.longitude).map((crime: any) => (
                    <Circle
                        key={crime.id}
                        center={[crime.latitude, crime.longitude]}
                        radius={100}
                        pathOptions={{
                            color: '#f97316',
                            fillColor: '#f97316',
                            fillOpacity: 0.4,
                            weight: 1,
                        }}
                        eventHandlers={{
                            click: () => openDetailPanel(crime, 'crime'),
                        }}
                    >
                        <Popup>
                            <div className="bg-gray-900 text-white p-3 rounded min-w-[200px]">
                                <p className="font-bold text-sm">🔶 {crime.type}</p>
                                <p className="text-xs text-gray-400 mt-1">{crime.address}</p>
                                <p className="text-xs text-orange-400 mt-1">
                                    {new Date(crime.occurredAt).toLocaleDateString('th-TH')}
                                </p>
                                <button
                                    onClick={(e) => { e.stopPropagation(); openDetailPanel(crime, 'crime'); }}
                                    className="mt-2 w-full bg-orange-600 hover:bg-orange-500 text-white text-xs py-1.5 rounded transition-colors"
                                >
                                    ดูรายละเอียดคดี
                                </button>
                            </div>
                        </Popup>
                    </Circle>
                ))}

                {/* SOS Alerts (Pulsing markers) */}
                {showSos && sosAlerts.map((sos: any) => (
                    <Marker
                        key={sos.id}
                        position={[sos.latitude, sos.longitude]}
                        icon={L.divIcon({
                            className: 'sos-marker',
                            html: `
                                <div style="position: relative; cursor: pointer;">
                                    <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 40px; height: 40px; background: rgba(239,68,68,0.3); border-radius: 50%; animation: sos-pulse 1.5s ease-out infinite;"></div>
                                    <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 28px; height: 28px; background: #ef4444; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 0 15px rgba(239,68,68,0.7);">
                                        <span style="color: white; font-weight: bold; font-size: 12px;">SOS</span>
                                    </div>
                                </div>
                            `,
                            iconSize: [40, 40],
                            iconAnchor: [20, 20],
                        })}
                        zIndexOffset={1000}
                        eventHandlers={{
                            click: () => openDetailPanel(sos, 'sos'),
                        }}
                    >
                        <Popup>
                            <div className="bg-gray-900 text-white p-3 rounded min-w-[250px]">
                                <p className="font-bold text-sm text-red-400">🚨 SOS Alert</p>
                                <p className="text-xs text-white mt-1">{sos.user?.firstName} {sos.user?.lastName}</p>
                                <p className="text-xs text-gray-400">{sos.type}</p>
                                {sos.message && <p className="text-xs text-gray-400 mt-1">{sos.message}</p>}

                                {/* Nearest Patrols */}
                                <div className="mt-2 pt-2 border-t border-gray-700">
                                    <p className="text-[10px] text-cyan-400 uppercase mb-1">🚔 สายตรวจใกล้เคียง</p>
                                    {findNearestPatrols(sos.latitude, sos.longitude, 3).length > 0 ? (
                                        <div className="space-y-1">
                                            {findNearestPatrols(sos.latitude, sos.longitude, 3).map((p: any, idx: number) => (
                                                <div key={p.id} className="flex justify-between items-center text-[10px]">
                                                    <span className="text-white">{idx + 1}. {p.user?.rank} {p.user?.firstName}</span>
                                                    <span className="text-cyan-400 font-mono">{p.distance.toFixed(1)} km</span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-[10px] text-gray-500">ไม่พบสายตรวจในพื้นที่</p>
                                    )}
                                </div>

                                <button
                                    onClick={(e) => { e.stopPropagation(); openDetailPanel(sos, 'sos'); }}
                                    className="mt-2 w-full bg-red-600 hover:bg-red-500 text-white text-xs py-1.5 rounded transition-colors"
                                >
                                    ดูรายละเอียดฉุกเฉิน
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedSOS(sos);
                                        setShowInterceptPoints(true);
                                    }}
                                    className="mt-1 w-full bg-amber-600 hover:bg-amber-500 text-white text-xs py-1.5 rounded transition-colors"
                                >
                                    🎯 แสดงจุดสะกัด
                                </button>
                            </div>
                        </Popup>
                    </Marker>
                ))}

                {/* Intercept Points for SOS (Layer 6) */}
                {showInterceptPoints && selectedSOS && (
                    <>
                        {/* Intercept radius circle */}
                        <Circle
                            center={[selectedSOS.latitude, selectedSOS.longitude]}
                            radius={500}
                            pathOptions={{
                                color: '#f59e0b',
                                fillColor: '#f59e0b',
                                fillOpacity: 0.1,
                                weight: 2,
                                dashArray: '5, 5',
                            }}
                        />
                        {/* Intercept point markers */}
                        {calculateInterceptPoints(selectedSOS.latitude, selectedSOS.longitude).map((ip, idx) => (
                            <React.Fragment key={`intercept-${idx}`}>
                                <Marker
                                    position={ip.point}
                                    icon={L.divIcon({
                                        className: 'intercept-marker',
                                        html: `
                                            <div style="background: #f59e0b; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">
                                                <span style="color: white; font-weight: bold; font-size: 10px;">${idx + 1}</span>
                                            </div>
                                        `,
                                        iconSize: [24, 24],
                                        iconAnchor: [12, 12],
                                    })}
                                >
                                    <Popup>
                                        <div className="bg-gray-900 text-white p-2 rounded min-w-[150px]">
                                            <p className="font-bold text-sm text-amber-400">🎯 จุดสะกัด {ip.direction}</p>
                                            <p className="text-xs text-gray-400">{ip.distance} km จาก SOS</p>
                                            {ip.assignedPatrol && (
                                                <p className="text-xs text-cyan-400 mt-1">
                                                    👮 {ip.assignedPatrol.user?.rank} {ip.assignedPatrol.user?.firstName}
                                                </p>
                                            )}
                                        </div>
                                    </Popup>
                                </Marker>
                                {/* Line from intercept point to assigned patrol */}
                                {ip.assignedPatrol && (
                                    <Polyline
                                        positions={[
                                            ip.point,
                                            [ip.assignedPatrol.currentLocation.latitude, ip.assignedPatrol.currentLocation.longitude]
                                        ]}
                                        pathOptions={{
                                            color: '#06b6d4',
                                            weight: 2,
                                            dashArray: '3, 6',
                                            opacity: 0.7,
                                        }}
                                    />
                                )}
                            </React.Fragment>
                        ))}
                    </>
                )}

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
                <div className="absolute bottom-4 left-56 z-[500] bg-gray-900/95 backdrop-blur-md border border-gray-700 rounded-xl p-4 shadow-2xl max-w-[260px]">
                    <button onClick={() => { setSelectedStation(null); setSelectedResult(null); }} className="absolute top-2 right-2 text-gray-500 hover:text-white">
                        <X className="w-4 h-4" />
                    </button>
                    <div className="flex items-start gap-3">
                        <div className="w-9 h-9 bg-blue-500 rounded-lg flex items-center justify-center">
                            <Building2 className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <p className="text-[9px] text-gray-500 uppercase tracking-wider">สถานี</p>
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
                            <p className="text-gray-300 font-mono text-[9px]">
                                {selectedResult.data.latitude?.toFixed(3)}, {selectedResult.data.longitude?.toFixed(3)}
                            </p>
                        </div>
                    </div>
                    {/* Open Full Details Button */}
                    <button
                        onClick={() => openDetailPanel({ ...selectedResult.data, patrolCount: patrolCountByStation[selectedStation] || 0 }, 'station')}
                        className="mt-3 w-full bg-cyan-600 hover:bg-cyan-500 text-white text-xs py-2 rounded-lg transition-colors"
                    >
                        ดูรายละเอียดทั้งหมด
                    </button>
                </div>
            )}

            {/* ===== LOCATION DETAIL PANEL ===== */}
            <LocationDetailPanel
                isOpen={detailPanelOpen}
                onClose={() => setDetailPanelOpen(false)}
                item={detailItem}
                type={detailType}
                onZoomTo={handleDetailZoom}
            />
        </div>
    );
}
