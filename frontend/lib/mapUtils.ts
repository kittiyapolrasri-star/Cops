import L from 'leaflet';

// ==================== STATION ICON (Police Building) ====================
export const createStationIcon = (
    name: string,
    patrolCount: number,
    isSelected: boolean,
    isDimmed: boolean = false
) => {
    const bgColor = isSelected ? '#10b981' : isDimmed ? '#374151' : '#1e40af';
    const borderColor = isSelected ? '#34d399' : isDimmed ? '#4b5563' : '#3b82f6';
    const opacity = isDimmed ? '0.5' : '1';

    return new L.DivIcon({
        html: `
            <div class="relative group cursor-pointer" style="opacity: ${opacity};">
                <div class="w-10 h-10 rounded-lg flex items-center justify-center" style="background: linear-gradient(135deg, ${bgColor} 0%, #1e3a8a 100%); border: 2px solid ${borderColor}; box-shadow: 0 4px 12px ${bgColor}60;">
                    <!-- Police Building SVG -->
                    <svg class="w-6 h-6" viewBox="0 0 24 24" fill="white">
                        <!-- Building Base -->
                        <path d="M4 21V9l8-5 8 5v12H4z" fill="white" opacity="0.9"/>
                        <!-- Roof -->
                        <path d="M2 9l10-7 10 7" stroke="white" stroke-width="2" fill="none"/>
                        <!-- Police Shield Emblem -->
                        <path d="M12 10c-2 0-3 1.5-3 3.5s1.2 3.5 3 4.5c1.8-1 3-2.5 3-4.5s-1-3.5-3-3.5z" fill="${bgColor}" stroke="white" stroke-width="0.5"/>
                        <!-- Star on shield -->
                        <polygon points="12,11.5 12.5,13 14,13 12.8,14 13.3,15.5 12,14.5 10.7,15.5 11.2,14 10,13 11.5,13" fill="gold" transform="scale(0.7) translate(5.5, 3)"/>
                        <!-- Windows -->
                        <rect x="6" y="14" width="2" height="3" fill="${bgColor}" opacity="0.7"/>
                        <rect x="16" y="14" width="2" height="3" fill="${bgColor}" opacity="0.7"/>
                        <!-- Door -->
                        <rect x="10" y="17" width="4" height="4" fill="${bgColor}" rx="0.5"/>
                    </svg>
                </div>
                ${patrolCount > 0 ? `
                    <div class="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-white shadow-lg">
                        <span class="text-[9px] font-bold text-white">${patrolCount}</span>
                    </div>
                ` : ''}
                <div class="absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-black/95 px-2 py-1 rounded text-[10px] text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition pointer-events-none z-[1000] font-medium">
                    🏢 ${name.replace('สถานีตำรวจภูธร', 'สภ.').replace('สภ.เมือง', 'สภ.')}
                </div>
            </div>
        `,
        className: '',
        iconSize: [40, 40],
        iconAnchor: [20, 20],
        popupAnchor: [0, -24],
    });
};

// ==================== PATROL ICON (Police Car) ====================
export const createPatrolIcon = (rank: string, isActive: boolean) => {
    const color = isActive ? '#00ffff' : '#666666';
    const glowColor = isActive ? 'rgba(0,255,255,0.5)' : 'transparent';

    return new L.DivIcon({
        html: `
            <div class="relative group">
                <div class="w-10 h-10 rounded-full flex items-center justify-center" style="background: radial-gradient(circle, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.95) 100%); border: 2px solid ${color}; box-shadow: 0 0 15px ${glowColor};">
                    <!-- Police Car SVG -->
                    <svg class="w-6 h-6" viewBox="0 0 24 24" fill="${color}">
                        <!-- Siren light -->
                        ${isActive ? `
                            <ellipse cx="12" cy="5" rx="2" ry="1.5" fill="#ef4444" class="animate-pulse"/>
                            <ellipse cx="12" cy="5" rx="3" ry="2" fill="none" stroke="#ef4444" stroke-width="0.5" opacity="0.5"/>
                        ` : ''}
                        <!-- Car body -->
                        <path d="M5 14l2-4h10l2 4v4H5v-4z" fill="${color}" opacity="0.9"/>
                        <!-- Car roof -->
                        <path d="M7 10l1.5-3h7l1.5 3H7z" fill="${color}"/>
                        <!-- Windows -->
                        <path d="M8 10l1-2h6l1 2H8z" fill="rgba(255,255,255,0.3)"/>
                        <!-- Wheels -->
                        <circle cx="7" cy="18" r="2" fill="#333" stroke="${color}" stroke-width="0.5"/>
                        <circle cx="17" cy="18" r="2" fill="#333" stroke="${color}" stroke-width="0.5"/>
                        <!-- Headlights -->
                        <rect x="4" y="14" width="1.5" height="1" fill="#ffff00" rx="0.3"/>
                        <rect x="18.5" y="14" width="1.5" height="1" fill="#ffff00" rx="0.3"/>
                    </svg>
                </div>
                <div class="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-black/95 px-2 py-0.5 rounded text-[9px] font-bold whitespace-nowrap" style="color: ${color};">
                    🚔 ${rank}
                </div>
                ${isActive ? '<div class="absolute top-0 right-0 w-2 h-2 bg-green-500 rounded-full animate-ping"></div>' : ''}
            </div>
        `,
        className: '',
        iconSize: [40, 40],
        iconAnchor: [20, 20],
        popupAnchor: [0, -24],
    });
};

// ==================== SELECTED LOCATION ICON (Pin Marker) ====================
export const createSelectedIcon = () => {
    return new L.DivIcon({
        html: `
            <div class="relative animate-bounce">
                <!-- Pin Drop Marker -->
                <svg class="w-10 h-12" viewBox="0 0 24 30" fill="none">
                    <!-- Drop shadow -->
                    <ellipse cx="12" cy="28" rx="4" ry="1.5" fill="rgba(0,0,0,0.3)"/>
                    <!-- Pin body -->
                    <path d="M12 0C6.5 0 2 4.5 2 10c0 7.5 10 18 10 18s10-10.5 10-18c0-5.5-4.5-10-10-10z" fill="#10b981"/>
                    <!-- Pin highlight -->
                    <path d="M12 0C6.5 0 2 4.5 2 10c0 7.5 10 18 10 18" stroke="#34d399" stroke-width="1" fill="none" opacity="0.5"/>
                    <!-- Inner circle -->
                    <circle cx="12" cy="10" r="5" fill="white"/>
                    <!-- Center dot -->
                    <circle cx="12" cy="10" r="2" fill="#10b981"/>
                </svg>
            </div>
        `,
        className: '',
        iconSize: [40, 48],
        iconAnchor: [20, 48],
        popupAnchor: [0, -48],
    });
};

// ==================== RISK ZONE COLORS ====================
export const getRiskColor = (level: string): string => {
    switch (level) {
        case 'CRITICAL': return '#ff0055';
        case 'HIGH': return '#ff5500';
        case 'MEDIUM': return '#ffcc00';
        case 'LOW': return '#00ffcc';
        default: return '#888888';
    }
};

// ==================== POI ICON (Point of Interest) ====================
export const createPOIIcon = (category: string, priority: string = 'NORMAL') => {
    const categories: Record<string, { color: string; icon: string; emoji: string }> = {
        SCHOOL: { color: '#3b82f6', icon: 'school', emoji: '🏫' },
        TEMPLE: { color: '#f59e0b', icon: 'temple', emoji: '🛕' },
        HOSPITAL: { color: '#22c55e', icon: 'hospital', emoji: '🏥' },
        BANK: { color: '#8b5cf6', icon: 'bank', emoji: '🏦' },
        MARKET: { color: '#ec4899', icon: 'market', emoji: '🏪' },
        GAS_STATION: { color: '#ef4444', icon: 'gas', emoji: '⛽' },
        GOVERNMENT: { color: '#1e40af', icon: 'gov', emoji: '🏛️' },
        ENTERTAINMENT: { color: '#a855f7', icon: 'ent', emoji: '🎭' },
        OTHER: { color: '#6b7280', icon: 'other', emoji: '📍' },
    };

    const cat = categories[category] || categories.OTHER;
    const priorityBorder = priority === 'HIGH' ? '#ef4444' : priority === 'URGENT' ? '#f97316' : cat.color;

    return new L.DivIcon({
        html: `
            <div class="relative group cursor-pointer">
                <div class="w-8 h-8 rounded-lg flex items-center justify-center shadow-lg" style="background: ${cat.color}; border: 2px solid ${priorityBorder};">
                    <span class="text-sm">${cat.emoji}</span>
                </div>
                <div class="absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-black/95 px-2 py-0.5 rounded text-[9px] text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition pointer-events-none z-[1000]">
                    ${cat.emoji} POI
                </div>
            </div>
        `,
        className: '',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -20],
    });
};

// ==================== CRIME ICON ====================
export const createCrimeIcon = (type: string, isResolved: boolean = false) => {
    const crimeTypes: Record<string, { color: string; emoji: string }> = {
        THEFT: { color: '#7c3aed', emoji: '🏃' },
        ASSAULT: { color: '#ef4444', emoji: '👊' },
        DRUGS: { color: '#dc2626', emoji: '💊' },
        FRAUD: { color: '#f59e0b', emoji: '💰' },
        TRAFFIC: { color: '#eab308', emoji: '🚗' },
        BURGLARY: { color: '#6366f1', emoji: '🏠' },
        ROBBERY: { color: '#be123c', emoji: '🔪' },
        OTHER: { color: '#6b7280', emoji: '⚠️' },
    };

    const crime = crimeTypes[type] || crimeTypes.OTHER;
    const opacity = isResolved ? '0.5' : '1';

    return new L.DivIcon({
        html: `
            <div class="relative group" style="opacity: ${opacity};">
                <div class="w-7 h-7 rounded-full flex items-center justify-center shadow-lg ${isResolved ? '' : 'animate-pulse'}" style="background: ${crime.color}; border: 2px solid white;">
                    <span class="text-xs">${crime.emoji}</span>
                </div>
                ${!isResolved ? '<div class="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping"></div>' : ''}
            </div>
        `,
        className: '',
        iconSize: [28, 28],
        iconAnchor: [14, 14],
        popupAnchor: [0, -18],
    });
};

// ==================== SOS ICON (Emergency Alert) ====================
export const createSOSIcon = (type: string = 'EMERGENCY', status: string = 'ACTIVE') => {
    const isActive = status === 'ACTIVE' || status === 'RESPONDING';

    return new L.DivIcon({
        html: `
            <div class="relative">
                ${isActive ? '<div class="absolute inset-0 w-12 h-12 bg-red-500 rounded-full animate-ping opacity-50"></div>' : ''}
                <div class="relative w-10 h-10 rounded-full flex items-center justify-center shadow-2xl ${isActive ? 'animate-pulse' : ''}" style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); border: 3px solid white; box-shadow: 0 0 20px rgba(239,68,68,0.8);">
                    <svg class="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <!-- Siren icon -->
                        <path d="M12 2L2 8l2 2v8h16v-8l2-2L12 2z"/>
                        <circle cx="12" cy="12" r="3" fill="white"/>
                    </svg>
                </div>
                <div class="absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-red-600 px-2 py-0.5 rounded text-[10px] text-white font-bold whitespace-nowrap">
                    🚨 SOS
                </div>
            </div>
        `,
        className: '',
        iconSize: [48, 48],
        iconAnchor: [24, 24],
        popupAnchor: [0, -28],
    });
};

// ==================== MY LOCATION ICON ====================
export const createMyLocationIcon = () => {
    return new L.DivIcon({
        html: `
            <div class="relative">
                <div class="absolute inset-0 w-10 h-10 bg-blue-500 rounded-full animate-ping opacity-30"></div>
                <div class="relative w-8 h-8 rounded-full flex items-center justify-center shadow-lg" style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); border: 3px solid white;">
                    <svg class="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <!-- Person icon -->
                        <circle cx="12" cy="7" r="4"/>
                        <path d="M12 14c-5 0-8 2.5-8 5v2h16v-2c0-2.5-3-5-8-5z"/>
                    </svg>
                </div>
            </div>
        `,
        className: '',
        iconSize: [40, 40],
        iconAnchor: [20, 20],
        popupAnchor: [0, -24],
    });
};

// ==================== THREAT CATEGORY COLORS ====================
export const getThreatCategoryColor = (category: string): { color: string; label: string; emoji: string } => {
    switch (category) {
        case 'DRUGS':
            return { color: '#dc2626', label: 'ยาเสพติด', emoji: '💊' };
        case 'WEAPONS':
            return { color: '#ea580c', label: 'อาวุธ', emoji: '🔫' };
        case 'TRAFFIC':
            return { color: '#eab308', label: 'จราจร', emoji: '🚗' };
        case 'VIOLENT':
            return { color: '#be123c', label: 'ประทุษร้าย', emoji: '⚠️' };
        case 'THEFT':
            return { color: '#7c3aed', label: 'ลักทรัพย์', emoji: '🏃' };
        default:
            return { color: '#6b7280', label: 'อื่นๆ', emoji: '📋' };
    }
};

// ==================== DEFAULT MAP CENTER (Thailand) ====================
export const THAILAND_CENTER: [number, number] = [13.7563, 100.5018]; // Bangkok
export const THAILAND_BOUNDS = {
    north: 20.5,
    south: 5.5,
    east: 106,
    west: 97.5,
};

// ==================== ZOOM LEVELS ====================
export const ZOOM_LEVELS = {
    COUNTRY: 6,
    REGION: 8,
    PROVINCE: 10,
    DISTRICT: 12,
    STATION: 14,
    STREET: 16,
};

// ==================== MAP TILE STYLES ====================
export const MAP_TILES = {
    dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    light: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
};

// ==================== TIME FORMATTING ====================
export const getTimeAgo = (dateStr: string): string => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'เมื่อกี้';
    if (diffMins < 60) return `${diffMins} นาที`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} ชม.`;
    return `${Math.floor(diffHours / 24)} วัน`;
};

// ==================== PROVINCE NAME MAPPING ====================
export const provinceNameMap: Record<string, string> = {
    'กรุงเทพมหานคร': 'Bangkok',
    'พระนครศรีอยุธยา': 'Phra Nakhon Si Ayutthaya',
    'อ่างทอง': 'Ang Thong',
    'ลพบุรี': 'Lop Buri',
    'สระบุรี': 'Saraburi',
    'สิงห์บุรี': 'Sing Buri',
    'ชัยนาท': 'Chai Nat',
    'นนทบุรี': 'Nonthaburi',
    'ปทุมธานี': 'Pathum Thani',
    'สมุทรปราการ': 'Samut Prakan',
    'นครปฐม': 'Nakhon Pathom',
    'สุพรรณบุรี': 'Suphan Buri',
    'กาญจนบุรี': 'Kanchanaburi',
    'ราชบุรี': 'Ratchaburi',
    'เพชรบุรี': 'Phetchaburi',
    'ประจวบคีรีขันธ์': 'Prachuap Khiri Khan',
    'ชลบุรี': 'Chon Buri',
    'ระยอง': 'Rayong',
    'จันทบุรี': 'Chanthaburi',
    'ตราด': 'Trat',
    'ฉะเชิงเทรา': 'Chachoengsao',
    'ปราจีนบุรี': 'Prachin Buri',
    'นครนายก': 'Nakhon Nayok',
    'สระแก้ว': 'Sa Kaeo',
    'นครราชสีมา': 'Nakhon Ratchasima',
    'บุรีรัมย์': 'Buri Ram',
    'สุรินทร์': 'Surin',
    'ศรีสะเกษ': 'Si Sa Ket',
    'อุบลราชธานี': 'Ubon Ratchathani',
    'ยโสธร': 'Yasothon',
    'ชัยภูมิ': 'Chaiyaphum',
    'อำนาจเจริญ': 'Amnat Charoen',
    'ขอนแก่น': 'Khon Kaen',
    'อุดรธานี': 'Udon Thani',
    'เลย': 'Loei',
    'หนองคาย': 'Nong Khai',
    'มหาสารคาม': 'Maha Sarakham',
    'ร้อยเอ็ด': 'Roi Et',
    'กาฬสินธุ์': 'Kalasin',
    'สกลนคร': 'Sakon Nakhon',
    'นครพนม': 'Nakhon Phanom',
    'มุกดาหาร': 'Mukdahan',
    'หนองบัวลำภู': 'Nong Bua Lam Phu',
    'บึงกาฬ': 'Bueng Kan',
    'เชียงใหม่': 'Chiang Mai',
    'ลำพูน': 'Lamphun',
    'ลำปาง': 'Lampang',
    'อุตรดิตถ์': 'Uttaradit',
    'แพร่': 'Phrae',
    'น่าน': 'Nan',
    'พะเยา': 'Phayao',
    'เชียงราย': 'Chiang Rai',
    'แม่ฮ่องสอน': 'Mae Hong Son',
    'นครสวรรค์': 'Nakhon Sawan',
    'อุทัยธานี': 'Uthai Thani',
    'กำแพงเพชร': 'Kamphaeng Phet',
    'ตาก': 'Tak',
    'สุโขทัย': 'Sukhothai',
    'พิษณุโลก': 'Phitsanulok',
    'พิจิตร': 'Phichit',
    'เพชรบูรณ์': 'Phetchabun',
    'สมุทรสงคราม': 'Samut Songkhram',
    'สมุทรสาคร': 'Samut Sakhon',
    'นครศรีธรรมราช': 'Nakhon Si Thammarat',
    'สุราษฎร์ธานี': 'Surat Thani',
    'ชุมพร': 'Chumphon',
    'ระนอง': 'Ranong',
    'พังงา': 'Phangnga',
    'ภูเก็ต': 'Phuket',
    'กระบี่': 'Krabi',
    'สงขลา': 'Songkhla',
    'สตูล': 'Satun',
    'ตรัง': 'Trang',
    'พัทลุง': 'Phatthalung',
    'ปัตตานี': 'Pattani',
    'ยะลา': 'Yala',
    'นราธิวาส': 'Narathiwat',
};

// ==================== GEOJSON URL ====================
export const THAILAND_GEOJSON_URL = 'https://raw.githubusercontent.com/apisit/thailand.json/master/thailand.json';
