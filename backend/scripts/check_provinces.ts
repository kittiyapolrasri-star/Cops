
import * as fs from 'fs';

// ==================== DATA ====================
const provincesData = [
    { code: 'BKK', name: 'กรุงเทพมหานคร', bureau: 'BMA', lat: 13.7563, lng: 100.5018 },
    { code: 'AYA', name: 'พระนครศรีอยุธยา', bureau: 'PPH1', lat: 14.3532, lng: 100.5685 },
    { code: 'ANG', name: 'อ่างทอง', bureau: 'PPH1', lat: 14.5896, lng: 100.4550 },
    { code: 'LPB', name: 'ลพบุรี', bureau: 'PPH1', lat: 14.7995, lng: 100.6534 },
    { code: 'SBI', name: 'สระบุรี', bureau: 'PPH1', lat: 14.5289, lng: 100.9108 },
    { code: 'STI', name: 'สิงห์บุรี', bureau: 'PPH1', lat: 14.8936, lng: 100.3967 },
    { code: 'CNT', name: 'ชัยนาท', bureau: 'PPH1', lat: 15.1851, lng: 100.1251 },
    { code: 'NBI', name: 'นนทบุรี', bureau: 'PPH1', lat: 13.8621, lng: 100.5144 },
    { code: 'PTN', name: 'ปทุมธานี', bureau: 'PPH1', lat: 14.0208, lng: 100.5250 },
    { code: 'CBI', name: 'ชลบุรี', bureau: 'PPH2', lat: 13.3611, lng: 100.9847 },
    { code: 'RYG', name: 'ระยอง', bureau: 'PPH2', lat: 12.6833, lng: 101.2378 },
    { code: 'CTI', name: 'จันทบุรี', bureau: 'PPH2', lat: 12.6114, lng: 102.1039 },
    { code: 'TRT', name: 'ตราด', bureau: 'PPH2', lat: 12.2428, lng: 102.5175 },
    { code: 'CCO', name: 'ฉะเชิงเทรา', bureau: 'PPH2', lat: 13.6904, lng: 101.0779 },
    { code: 'PKN', name: 'ปราจีนบุรี', bureau: 'PPH2', lat: 14.0509, lng: 101.3717 },
    { code: 'SKW', name: 'สระแก้ว', bureau: 'PPH2', lat: 13.8240, lng: 102.0645 },
    { code: 'SPK', name: 'สมุทรปราการ', bureau: 'PPH2', lat: 13.5990, lng: 100.5998 },
    { code: 'NKR', name: 'นครราชสีมา', bureau: 'PPH3', lat: 14.9799, lng: 102.0978 },
    { code: 'BRM', name: 'บุรีรัมย์', bureau: 'PPH3', lat: 14.9930, lng: 103.1029 },
    { code: 'SRN', name: 'สุรินทร์', bureau: 'PPH3', lat: 14.8819, lng: 103.4936 },
    { code: 'SSK', name: 'ศรีสะเกษ', bureau: 'PPH3', lat: 15.1186, lng: 104.3220 },
    { code: 'UBN', name: 'อุบลราชธานี', bureau: 'PPH3', lat: 15.2287, lng: 104.8564 },
    { code: 'YST', name: 'ยโสธร', bureau: 'PPH3', lat: 15.7944, lng: 104.1453 },
    { code: 'CYP', name: 'ชัยภูมิ', bureau: 'PPH3', lat: 15.8068, lng: 102.0288 },
    { code: 'AMN', name: 'อำนาจเจริญ', bureau: 'PPH3', lat: 15.8656, lng: 104.6258 },
    { code: 'KKN', name: 'ขอนแก่น', bureau: 'PPH4', lat: 16.4419, lng: 102.8360 },
    { code: 'UDN', name: 'อุดรธานี', bureau: 'PPH4', lat: 17.4156, lng: 102.7872 },
    { code: 'LEI', name: 'เลย', bureau: 'PPH4', lat: 17.4860, lng: 101.7223 },
    { code: 'NKP', name: 'หนองคาย', bureau: 'PPH4', lat: 17.8782, lng: 102.7420 },
    { code: 'MKM', name: 'มหาสารคาม', bureau: 'PPH4', lat: 16.1851, lng: 103.3028 },
    { code: 'ROI', name: 'ร้อยเอ็ด', bureau: 'PPH4', lat: 16.0538, lng: 103.6520 },
    { code: 'KSN', name: 'กาฬสินธุ์', bureau: 'PPH4', lat: 16.4314, lng: 103.5058 },
    { code: 'SKN', name: 'สกลนคร', bureau: 'PPH4', lat: 17.1545, lng: 104.1348 },
    { code: 'NPM', name: 'นครพนม', bureau: 'PPH4', lat: 17.3920, lng: 104.7697 },
    { code: 'MUK', name: 'มุกดาหาร', bureau: 'PPH4', lat: 16.5453, lng: 104.7233 },
    { code: 'NBP', name: 'หนองบัวลำภู', bureau: 'PPH4', lat: 17.2041, lng: 102.4260 },
    { code: 'BKN', name: 'บึงกาฬ', bureau: 'PPH4', lat: 18.3609, lng: 103.6466 },
    { code: 'CMI', name: 'เชียงใหม่', bureau: 'PPH5', lat: 18.7883, lng: 98.9853 },
    { code: 'CRI', name: 'เชียงราย', bureau: 'PPH5', lat: 19.9105, lng: 99.8406 },
    { code: 'LPN', name: 'ลำพูน', bureau: 'PPH5', lat: 18.5744, lng: 99.0087 },
    { code: 'LPG', name: 'ลำปาง', bureau: 'PPH5', lat: 18.2888, lng: 99.4909 },
    { code: 'PRE', name: 'แพร่', bureau: 'PPH5', lat: 18.1445, lng: 100.1403 },
    { code: 'NAN', name: 'น่าน', bureau: 'PPH5', lat: 18.7756, lng: 100.7730 },
    { code: 'PYO', name: 'พะเยา', bureau: 'PPH5', lat: 19.1664, lng: 99.9019 },
    { code: 'MSN', name: 'แม่ฮ่องสอน', bureau: 'PPH5', lat: 19.3020, lng: 97.9654 },
    { code: 'NSN', name: 'นครสวรรค์', bureau: 'PPH6', lat: 15.7030, lng: 100.1369 },
    { code: 'UTI', name: 'อุทัยธานี', bureau: 'PPH6', lat: 15.3792, lng: 100.0245 },
    { code: 'KPT', name: 'กำแพงเพชร', bureau: 'PPH6', lat: 16.4827, lng: 99.5226 },
    { code: 'TAK', name: 'ตาก', bureau: 'PPH6', lat: 16.8839, lng: 99.1258 },
    { code: 'SKT', name: 'สุโขทัย', bureau: 'PPH6', lat: 17.0156, lng: 99.8230 },
    { code: 'PLK', name: 'พิษณุโลก', bureau: 'PPH6', lat: 16.8211, lng: 100.2659 },
    { code: 'PCB', name: 'พิจิตร', bureau: 'PPH6', lat: 16.4429, lng: 100.3487 },
    { code: 'PBN', name: 'เพชรบูรณ์', bureau: 'PPH6', lat: 16.4189, lng: 101.1591 },
    { code: 'UTT', name: 'อุตรดิตถ์', bureau: 'PPH6', lat: 17.6200, lng: 100.0993 },
    { code: 'NKP', name: 'นครปฐม', bureau: 'PPH7', lat: 13.8196, lng: 100.0445 },
    { code: 'SPB', name: 'สุพรรณบุรี', bureau: 'PPH7', lat: 14.4744, lng: 100.1177 },
    { code: 'KRI', name: 'กาญจนบุรี', bureau: 'PPH7', lat: 14.0227, lng: 99.5328 },
    { code: 'RAT', name: 'ราชบุรี', bureau: 'PPH7', lat: 13.5283, lng: 99.8134 },
    { code: 'PKI', name: 'เพชรบุรี', bureau: 'PPH7', lat: 13.1119, lng: 99.9397 },
    { code: 'PKK', name: 'ประจวบคีรีขันธ์', bureau: 'PPH7', lat: 11.8120, lng: 99.7972 },
    { code: 'SKS', name: 'สมุทรสงคราม', bureau: 'PPH7', lat: 13.4098, lng: 100.0022 },
    { code: 'SKM', name: 'สมุทรสาคร', bureau: 'PPH7', lat: 13.5475, lng: 100.2744 },
    { code: 'NRT', name: 'นครศรีธรรมราช', bureau: 'PPH8', lat: 8.4333, lng: 99.9667 },
    { code: 'SNI', name: 'สุราษฎร์ธานี', bureau: 'PPH8', lat: 9.1436, lng: 99.3309 },
    { code: 'CPN', name: 'ชุมพร', bureau: 'PPH8', lat: 10.4930, lng: 99.1800 },
    { code: 'RNG', name: 'ระนอง', bureau: 'PPH8', lat: 9.9658, lng: 98.6348 },
    { code: 'PNA', name: 'พังงา', bureau: 'PPH8', lat: 8.4506, lng: 98.5284 },
    { code: 'PKT', name: 'ภูเก็ต', bureau: 'PPH8', lat: 7.8804, lng: 98.3923 },
    { code: 'KBI', name: 'กระบี่', bureau: 'PPH8', lat: 8.0863, lng: 98.9063 },
    { code: 'SKA', name: 'สงขลา', bureau: 'PPH9', lat: 7.1756, lng: 100.6143 },
    { code: 'STN', name: 'สตูล', bureau: 'PPH9', lat: 6.6238, lng: 100.0674 },
    { code: 'TRG', name: 'ตรัง', bureau: 'PPH9', lat: 7.5645, lng: 99.6239 },
    { code: 'PLG', name: 'พัทลุง', bureau: 'PPH9', lat: 7.6172, lng: 100.0709 },
    { code: 'PTN', name: 'ปัตตานี', bureau: 'PPH9', lat: 6.8696, lng: 101.2501 },
    { code: 'YLA', name: 'ยะลา', bureau: 'PPH9', lat: 6.5411, lng: 101.2804 },
    { code: 'NWT', name: 'นราธิวาส', bureau: 'PPH9', lat: 6.4255, lng: 101.8253 },
];

const provinceNameMap: Record<string, string> = {
    'กรุงเทพมหานคร': 'Bangkok',
    'พระนครศรีอยุธยา': 'Phra Nakhon Si Ayutthaya',
    'อ่างทอง': 'Ang Thong',
    'ลพบุรี': 'Lop Buri',
    'สระบุรี': 'Saraburi',
    'สิงห์บุรี': 'Sing Buri',
    'ชัยนาท': 'Chai Nat',
    'นนทบุรี': 'Nonthaburi',
    'ปทุมธานี': 'Pathum Thani',
    'ชลบุรี': 'Chon Buri',
    'ระยอง': 'Rayong',
    'จันทบุรี': 'Chanthaburi',
    'ตราด': 'Trat',
    'ฉะเชิงเทรา': 'Chachoengsao',
    'ปราจีนบุรี': 'Prachin Buri',
    'สระแก้ว': 'Sa Kaeo',
    'สมุทรปราการ': 'Samut Prakan',
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
    'เชียงราย': 'Chiang Rai',
    'ลำพูน': 'Lamphun',
    'ลำปาง': 'Lampang',
    'แพร่': 'Phrae',
    'น่าน': 'Nan',
    'พะเยา': 'Phayao',
    'แม่ฮ่องสอน': 'Mae Hong Son',
    'นครสวรรค์': 'Nakhon Sawan',
    'อุทัยธานี': 'Uthai Thani',
    'กำแพงเพชร': 'Kamphaeng Phet',
    'ตาก': 'Tak',
    'สุโขทัย': 'Sukhothai',
    'พิษณุโลก': 'Phitsanulok',
    'พิจิตร': 'Phichit',
    'เพชรบูรณ์': 'Phetchabun',
    'อุตรดิตถ์': 'Uttaradit',
    'นครปฐม': 'Nakhon Pathom',
    'สุพรรณบุรี': 'Suphan Buri',
    'กาญจนบุรี': 'Kanchanaburi',
    'ราชบุรี': 'Ratchaburi',
    'เพชรบุรี': 'Phetchaburi',
    'ประจวบคีรีขันธ์': 'Prachuap Khiri Khan',
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

function calculateCentroid(vs: number[][]): [number, number] {
    let x = 0, y = 0, area = 0;
    for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
        let xi = vs[i][0], yi = vs[i][1];
        let xj = vs[j][0], yj = vs[j][1];
        let f = xi * yj - xj * yi;
        x += (xi + xj) * f;
        y += (yi + yj) * f;
        area += f * 3;
    }
    return [y / area, x / area]; // [lat, lng]
}

async function main() {
    console.log("Fetching GeoJSON...");
    const res = await fetch('https://raw.githubusercontent.com/apisit/thailand.json/master/thailand.json');
    const geojson = await res.json();

    // Find Bangkok Name
    const bkkFeature = geojson.features.find((f: any) => f.properties.name.includes('Bangkok'));

    console.log("Generating CORRECTED COORDINATES...");
    console.log("const provincesData = [");

    for (const p of provincesData) {
        let engName = provinceNameMap[p.name];
        if (p.code === 'BKK' && bkkFeature) engName = bkkFeature.properties.name;

        if (!engName) {
            console.warn(`// [WARN] No English name mapping for ${p.name}`);
            continue;
        }

        const feature = geojson.features.find((f: any) => f.properties.name === engName);
        if (!feature) {
            console.warn(`// [WARN] No GeoJSON feature found for ${engName} (${p.name})`);
            // Keep original
            console.log(`    { code: '${p.code}', name: '${p.name}', bureau: '${p.bureau}', lat: ${p.lat}, lng: ${p.lng} },`);
            continue;
        }

        // Calculate Centroid
        let geometry = feature.geometry;
        let coordinates = geometry.coordinates;
        let isMultiPolygon = geometry.type === "MultiPolygon";
        const polygons = isMultiPolygon ? coordinates : [coordinates];

        // Find largest polygon ring
        let validPolygons: number[][][] = [];
        for (const polyContainer of polygons) {
            validPolygons.push(polyContainer[0]);
        }
        validPolygons.sort((a, b) => b.length - a.length);
        const mainPoly = validPolygons[0];

        let finalLat = p.lat;
        let finalLng = p.lng;

        if (mainPoly) {
            const centroid = calculateCentroid(mainPoly);
            // Check for NaN
            if (!isNaN(centroid[0]) && !isNaN(centroid[1])) {
                finalLat = Number(centroid[0].toFixed(4));
                finalLng = Number(centroid[1].toFixed(4));
            }
        }

        console.log(`    { code: '${p.code}', name: '${p.name}', bureau: '${p.bureau}', lat: ${finalLat}, lng: ${finalLng} },`);
    }

    console.log("];");
}

main().catch(err => console.error(err));
