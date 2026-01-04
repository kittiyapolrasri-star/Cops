'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, MapPin, X, Radio, AlertTriangle, Building2 } from 'lucide-react';
import { searchLocation, GeocodingResult } from '@/lib/geocoding';

interface SearchResult {
    type: 'location' | 'station' | 'riskzone' | 'patrol';
    id: string;
    name: string;
    lat: number;
    lng: number;
    data?: any;
}

interface MapSearchBarProps {
    onSelect: (result: SearchResult) => void;
    stations?: any[];
    riskZones?: any[];
    patrols?: any[];
}

export default function MapSearchBar({ onSelect, stations = [], riskZones = [], patrols = [] }: MapSearchBarProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const debounceRef = useRef<NodeJS.Timeout>();

    // Search logic
    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);

        if (!query || query.length < 2) {
            setResults([]);
            return;
        }

        debounceRef.current = setTimeout(async () => {
            setIsLoading(true);
            const combinedResults: SearchResult[] = [];

            // Search local data first (stations, zones, patrols)
            const lowerQuery = query.toLowerCase();

            // Filter stations
            stations.filter(s => s.name?.toLowerCase().includes(lowerQuery))
                .forEach(s => combinedResults.push({
                    type: 'station',
                    id: s.id,
                    name: s.name,
                    lat: s.latitude,
                    lng: s.longitude,
                    data: s
                }));

            // Filter risk zones
            riskZones.filter(z => z.name?.toLowerCase().includes(lowerQuery))
                .forEach(z => combinedResults.push({
                    type: 'riskzone',
                    id: z.id,
                    name: z.name,
                    lat: z.latitude,
                    lng: z.longitude,
                    data: z
                }));

            // Filter patrols by name
            patrols.filter(p =>
                p.user?.firstName?.toLowerCase().includes(lowerQuery) ||
                p.user?.lastName?.toLowerCase().includes(lowerQuery)
            ).forEach(p => combinedResults.push({
                type: 'patrol',
                id: p.id,
                name: `${p.user?.rank || ''} ${p.user?.firstName || ''} ${p.user?.lastName || ''}`,
                lat: p.locations?.[0]?.latitude,
                lng: p.locations?.[0]?.longitude,
                data: p
            }));

            // Search Nominatim for locations
            const geoResults = await searchLocation(query);
            geoResults.forEach((r: GeocodingResult) => combinedResults.push({
                type: 'location',
                id: String(r.place_id),
                name: r.display_name,
                lat: parseFloat(r.lat),
                lng: parseFloat(r.lon),
            }));

            setResults(combinedResults);
            setIsLoading(false);
        }, 300);

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [query, stations, riskZones, patrols]);

    const handleSelect = (result: SearchResult) => {
        onSelect(result);
        setQuery(result.name.split(',')[0]); // Show short name
        setIsOpen(false);
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'station': return <Building2 className="w-4 h-4 text-sky-400" />;
            case 'riskzone': return <AlertTriangle className="w-4 h-4 text-amber-400" />;
            case 'patrol': return <Radio className="w-4 h-4 text-emerald-400" />;
            default: return <MapPin className="w-4 h-4 text-gray-400" />;
        }
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'station': return 'สถานี';
            case 'riskzone': return 'จุดเสี่ยง';
            case 'patrol': return 'สายตรวจ';
            default: return 'สถานที่';
        }
    };

    return (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[500] w-80">
            {/* Search Input */}
            <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                    <Search className="w-4 h-4" />
                </div>
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setIsOpen(true);
                    }}
                    onFocus={() => setIsOpen(true)}
                    placeholder="ค้นหาสถานที่, สถานี, จุดเสี่ยง..."
                    className="w-full pl-10 pr-10 py-3 bg-gray-900/95 backdrop-blur-md border border-gray-700 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 shadow-xl"
                />
                {query && (
                    <button
                        onClick={() => { setQuery(''); setResults([]); }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* Results Dropdown */}
            {isOpen && (query.length >= 2 || results.length > 0) && (
                <div className="mt-2 bg-gray-900/95 backdrop-blur-md border border-gray-700 rounded-xl shadow-2xl overflow-hidden max-h-80 overflow-y-auto">
                    {isLoading ? (
                        <div className="p-4 text-center text-gray-500 text-sm">
                            <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                            กำลังค้นหา...
                        </div>
                    ) : results.length === 0 ? (
                        <div className="p-4 text-center text-gray-500 text-sm">
                            ไม่พบผลลัพธ์
                        </div>
                    ) : (
                        results.map((result) => (
                            <button
                                key={`${result.type}-${result.id}`}
                                onClick={() => handleSelect(result)}
                                className="w-full px-4 py-3 flex items-start gap-3 hover:bg-white/5 transition text-left border-b border-gray-800 last:border-0"
                            >
                                <div className="mt-0.5">{getIcon(result.type)}</div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-white text-sm font-medium truncate">{result.name.split(',')[0]}</p>
                                    <p className="text-gray-500 text-xs truncate">
                                        {getTypeLabel(result.type)}
                                        {result.type === 'location' && result.name.split(',').slice(1, 3).join(',')}
                                    </p>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            )}

            {/* Close overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-[-1]"
                    onClick={() => setIsOpen(false)}
                />
            )}
        </div>
    );
}
