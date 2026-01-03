'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';

interface Location {
    latitude: number;
    longitude: number;
    accuracy: number;
    timestamp: Date;
}

// User location marker - white/gray theme
const userIcon = new L.DivIcon({
    html: `<div class="relative">
    <div class="w-10 h-10 bg-white rounded-full border-4 border-gray-600 shadow-lg flex items-center justify-center" style="border: 4px solid #4b5563; box-shadow: 0 2px 8px rgba(0,0,0,0.5);">
      <div class="w-3 h-3 bg-gray-800 rounded-full"></div>
    </div>
    <div class="absolute inset-0 bg-white rounded-full animate-ping opacity-25"></div>
  </div>`,
    className: '',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
});

function MapController({ center }: { center: [number, number] | null }) {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.setView(center, 17);
        }
    }, [center, map]);
    return null;
}

export default function PatrolMap({ location }: { location: Location | null }) {
    const [mounted, setMounted] = useState(false);
    const defaultCenter: [number, number] = [14.3378, 100.8657]; // Nongkhae default
    const center: [number, number] | null = location
        ? [location.latitude, location.longitude]
        : null;

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-gray-800">
                <div className="text-center">
                    <div className="animate-spin w-8 h-8 border-4 border-gray-400 border-t-transparent rounded-full mx-auto mb-2" />
                    <p className="text-sm text-gray-400">กำลังโหลดแผนที่...</p>
                </div>
            </div>
        );
    }

    return (
        <MapContainer
            center={center || defaultCenter}
            zoom={17}
            className="w-full h-full"
            zoomControl={true}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png"
            />
            {center && (
                <>
                    <MapController center={center} />
                    {/* Accuracy circle */}
                    <Circle
                        center={center}
                        radius={location?.accuracy || 10}
                        pathOptions={{
                            color: '#ffffff',
                            fillColor: '#ffffff',
                            fillOpacity: 0.1,
                            weight: 2,
                        }}
                    />
                    {/* User marker */}
                    <Marker position={center} icon={userIcon}>
                        <Popup>
                            <div className="text-center">
                                <p className="font-semibold text-gray-800">ตำแหน่งของคุณ</p>
                                <p className="text-xs text-gray-500">
                                    ความแม่นยำ: ±{Math.round(location?.accuracy || 0)} เมตร
                                </p>
                            </div>
                        </Popup>
                    </Marker>
                </>
            )}
        </MapContainer>
    );
}
