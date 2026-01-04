// Nominatim Geocoding API Helper (Free - OpenStreetMap)
// Rate limit: 1 request per second

export interface GeocodingResult {
    place_id: number;
    lat: string;
    lon: string;
    display_name: string;
    type: string;
}

export async function searchLocation(query: string): Promise<GeocodingResult[]> {
    if (!query || query.length < 2) return [];

    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?` +
            `format=json&q=${encodeURIComponent(query)}&countrycodes=th&limit=5`,
            {
                headers: {
                    'Accept-Language': 'th,en',
                    'User-Agent': 'COPS-System/1.0'
                }
            }
        );

        if (!response.ok) return [];
        return await response.json();
    } catch (error) {
        console.error('Geocoding error:', error);
        return [];
    }
}

export async function reverseGeocode(lat: number, lon: number): Promise<string> {
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?` +
            `format=json&lat=${lat}&lon=${lon}`,
            {
                headers: {
                    'Accept-Language': 'th,en',
                    'User-Agent': 'COPS-System/1.0'
                }
            }
        );

        if (!response.ok) return '';
        const data = await response.json();
        return data.display_name || '';
    } catch (error) {
        console.error('Reverse geocoding error:', error);
        return '';
    }
}
