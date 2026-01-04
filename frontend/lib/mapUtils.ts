import L from 'leaflet';

// ==================== STATION ICON ====================
export const createStationIcon = (
    name: string,
    patrolCount: number,
    isSelected: boolean,
    isDimmed: boolean = false
) => {
    const bgColor = isSelected ? '#10b981' : isDimmed ? '#374151' : '#3b82f6';
    const borderColor = isSelected ? '#34d399' : isDimmed ? '#4b5563' : '#60a5fa';
    const opacity = isDimmed ? '0.5' : '1';

    return new L.DivIcon({
        html: `
            <div class="relative group cursor-pointer" style="opacity: ${opacity};">
                <div class="w-9 h-9 rounded-lg ${isSelected ? 'scale-110' : ''}" style="background: ${bgColor}; border: 2px solid ${borderColor}; box-shadow: 0 0 15px ${bgColor}40;">
                    <div class="w-full h-full flex items-center justify-center">
                        <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
                        </svg>
                    </div>
                    ${patrolCount > 0 ? `
                        <div class="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center border border-white shadow-md">
                            <span class="text-[8px] font-bold text-white">${patrolCount}</span>
                        </div>
                    ` : ''}
                </div>
                <div class="absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-black/90 px-2 py-0.5 rounded text-[9px] text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition pointer-events-none z-[1000]">
                    ${name.replace('สถานีตำรวจภูธร', 'สภ.').replace('สภ.เมือง', 'สภ.')}
                </div>
            </div>
        `,
        className: '',
        iconSize: [36, 36],
        iconAnchor: [18, 18],
        popupAnchor: [0, -22],
    });
};

// ==================== PATROL ICON ====================
export const createPatrolIcon = (rank: string, isActive: boolean) => {
    const color = isActive ? '#00ffff' : '#666666';
    return new L.DivIcon({
        html: `
            <div class="relative group">
                <div class="w-8 h-8 bg-black/60 backdrop-blur-md rounded-full border-2 shadow-[0_0_12px_${color}] flex items-center justify-center" style="border-color: ${color};">
                    <div class="w-2 h-2 rounded-full ${isActive ? 'animate-pulse' : ''}" style="background: ${color}; box-shadow: 0 0 8px ${color};"></div>
                </div>
                <div class="absolute -bottom-5 left-1/2 -translate-x-1/2 bg-black/90 px-1.5 py-0.5 rounded text-[8px] font-bold whitespace-nowrap" style="color: ${color};">
                    ${rank}
                </div>
            </div>
        `,
        className: '',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -20],
    });
};

// ==================== SELECTED LOCATION ICON ====================
export const createSelectedIcon = () => {
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
