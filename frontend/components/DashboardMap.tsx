'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useAuthStore } from '@/lib/store/auth';

// Custom patrol marker icon
const patrolIcon = new L.DivIcon({
    html: `<div class="relative">
    <div class="w-10 h-10 bg-blue-600 rounded-full border-4 border-white shadow-lg flex items-center justify-center">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z"/><circle cx="12" cy="10" r="3"/></svg>
    </div>
    <div class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-blue-600 rotate-45"></div>
  </div>`,
    className: '',
    iconSize: [40, 48],
    iconAnchor: [20, 48],
    popupAnchor: [0, -48],
});

// Risk zone colors
const getRiskColor = (level: string) => {
    switch (level) {
        case 'CRITICAL': return '#dc2626';
        case 'HIGH': return '#ef4444';
        case 'MEDIUM': return '#f59e0b';
        case 'LOW': return '#22c55e';
        default: return '#3b82f6';
    }
};

// Demo data
const demoPatrols = [
    { id: '1', lat: 14.3378, lng: 100.8657, name: 'ด.ต.สมศักดิ์', status: 'active' },
    { id: '2', lat: 14.3390, lng: 100.8670, name: 'ส.ต.อ.สมหญิง', status: 'active' },
    { id: '3', lat: 14.3365, lng: 100.8645, name: 'จ.ส.ต.สมชาย', status: 'active' },
];

const demoRiskZones = [
    { id: '1', lat: 14.3385, lng: 100.8665, name: 'ซอยเปลี่ยว ม.3', level: 'HIGH', radius: 50 },
    { id: '2', lat: 14.3372, lng: 100.8650, name: 'ตลาดสดหนองแค', level: 'MEDIUM', radius: 40 },
    { id: '3', lat: 14.3390, lng: 100.8640, name: 'สี่แยกไฟแดง', level: 'MEDIUM', radius: 30 },
    { id: '4', lat: 14.3365, lng: 100.8680, name: 'สวนสาธารณะ', level: 'LOW', radius: 50 },
];

function MapController({ center }: { center: [number, number] }) {
    const map = useMap();
    useEffect(() => {
        map.setView(center, 16);
    }, [center, map]);
    return null;
}

export default function DashboardMap() {
    const [mounted, setMounted] = useState(false);
    const center: [number, number] = [14.3378, 100.8657]; // Nongkhae Station

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-gray-100">
                <div className="text-center">
                    <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">กำลังโหลดแผนที่...</p>
                </div>
            </div>
        );
    }

    return (
        <MapContainer
            center={center}
            zoom={16}
            className="w-full h-full"
            zoomControl={false}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapController center={center} />

            {/* Risk Zones */}
            {demoRiskZones.map((zone) => (
                <Circle
                    key={zone.id}
                    center={[zone.lat, zone.lng]}
                    radius={zone.radius}
                    pathOptions={{
                        color: getRiskColor(zone.level),
                        fillColor: getRiskColor(zone.level),
                        fillOpacity: 0.2,
                        weight: 2,
                    }}
                >
                    <Popup>
                        <div className="text-center">
                            <p className="font-semibold">{zone.name}</p>
                            <span className={`inline-block px-2 py-0.5 text-xs rounded-full text-white mt-1`}
                                style={{ backgroundColor: getRiskColor(zone.level) }}>
                                {zone.level}
                            </span>
                        </div>
                    </Popup>
                </Circle>
            ))}

            {/* Patrol Officers */}
            {demoPatrols.map((patrol) => (
                <Marker
                    key={patrol.id}
                    position={[patrol.lat, patrol.lng]}
                    icon={patrolIcon}
                >
                    <Popup>
                        <div className="text-center">
                            <div className="w-12 h-12 bg-blue-100 rounded-full mx-auto mb-2 flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-600"><circle cx="12" cy="8" r="4" /><path d="M20 21a8 8 0 1 0-16 0" /></svg>
                            </div>
                            <p className="font-semibold text-gray-800">{patrol.name}</p>
                            <div className="flex items-center justify-center gap-1 mt-1">
                                <span className="w-2 h-2 rounded-full bg-green-500" />
                                <span className="text-xs text-green-600">กำลังลาดตระเวน</span>
                            </div>
                        </div>
                    </Popup>
                </Marker>
            ))}
        </MapContainer>
    );
}
