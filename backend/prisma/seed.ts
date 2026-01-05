import { PrismaClient, UserRole, RiskLevel } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// ==================== ALL 77 THAI PROVINCES ====================
// Organized by Police Bureau (กองบัญชาการตำรวจภูธร)

const bureausData = [
    { code: 'BMA', name: 'กองบัญชาการตำรวจนครบาล' }, // Bangkok Metropolitan
    { code: 'PPH1', name: 'กองบัญชาการตำรวจภูธรภาค 1' },
    { code: 'PPH2', name: 'กองบัญชาการตำรวจภูธรภาค 2' },
    { code: 'PPH3', name: 'กองบัญชาการตำรวจภูธรภาค 3' },
    { code: 'PPH4', name: 'กองบัญชาการตำรวจภูธรภาค 4' },
    { code: 'PPH5', name: 'กองบัญชาการตำรวจภูธรภาค 5' },
    { code: 'PPH6', name: 'กองบัญชาการตำรวจภูธรภาค 6' },
    { code: 'PPH7', name: 'กองบัญชาการตำรวจภูธรภาค 7' },
    { code: 'PPH8', name: 'กองบัญชาการตำรวจภูธรภาค 8' },
    { code: 'PPH9', name: 'กองบัญชาการตำรวจภูธรภาค 9' },
];

const provincesData: { code: string; name: string; bureau: string; lat: number; lng: number }[] = [
    { code: 'BKK', name: 'กรุงเทพมหานคร', bureau: 'BMA', lat: 13.7713, lng: 100.6201 },
    { code: 'AYA', name: 'พระนครศรีอยุธยา', bureau: 'PPH1', lat: 14.3407, lng: 100.5279 },
    { code: 'ANG', name: 'อ่างทอง', bureau: 'PPH1', lat: 14.6235, lng: 100.3551 },
    { code: 'LPB', name: 'ลพบุรี', bureau: 'PPH1', lat: 15.0745, lng: 100.9141 },

    { code: 'STI', name: 'สิงห์บุรี', bureau: 'PPH1', lat: 14.9213, lng: 100.3529 },
    { code: 'CNT', name: 'ชัยนาท', bureau: 'PPH1', lat: 15.1364, lng: 100.0253 },
    { code: 'NBI', name: 'นนทบุรี', bureau: 'PPH1', lat: 13.9267, lng: 100.389 },
    { code: 'PTM', name: 'ปทุมธานี', bureau: 'PPH1', lat: 14.0615, lng: 100.6792 },
    { code: 'SRI', name: 'สระบุรี', bureau: 'PPH1', lat: 14.528, lng: 100.911 },
    { code: 'CBI', name: 'ชลบุรี', bureau: 'PPH2', lat: 13.1971, lng: 101.211 },
    { code: 'RYG', name: 'ระยอง', bureau: 'PPH2', lat: 12.8517, lng: 101.4225 },
    { code: 'CTI', name: 'จันทบุรี', bureau: 'PPH2', lat: 12.8632, lng: 102.12 },
    { code: 'TRT', name: 'ตราด', bureau: 'PPH2', lat: 12.3578, lng: 102.5342 },
    { code: 'CCO', name: 'ฉะเชิงเทรา', bureau: 'PPH2', lat: 13.6039, lng: 101.4463 },
    { code: 'PKN', name: 'ปราจีนบุรี', bureau: 'PPH2', lat: 14.0749, lng: 101.6251 },
    { code: 'SKW', name: 'สระแก้ว', bureau: 'PPH2', lat: 13.7773, lng: 102.2935 },
    { code: 'SPK', name: 'สมุทรปราการ', bureau: 'PPH2', lat: 13.5979, lng: 100.706 },
    { code: 'NKR', name: 'นครราชสีมา', bureau: 'PPH3', lat: 14.9577, lng: 102.1169 },
    { code: 'BRM', name: 'บุรีรัมย์', bureau: 'PPH3', lat: 14.8233, lng: 102.9718 },
    { code: 'SRN', name: 'สุรินทร์', bureau: 'PPH3', lat: 14.8841, lng: 103.6685 },
    { code: 'SSK', name: 'ศรีสะเกษ', bureau: 'PPH3', lat: 14.8569, lng: 104.3788 },
    { code: 'UBN', name: 'อุบลราชธานี', bureau: 'PPH3', lat: 15.1775, lng: 105.1197 },
    { code: 'YST', name: 'ยโสธร', bureau: 'PPH3', lat: 15.8898, lng: 104.3385 },
    { code: 'CYP', name: 'ชัยภูมิ', bureau: 'PPH3', lat: 16.0095, lng: 101.8025 },
    { code: 'AMN', name: 'อำนาจเจริญ', bureau: 'PPH3', lat: 15.8702, lng: 104.7681 },
    { code: 'KKN', name: 'ขอนแก่น', bureau: 'PPH4', lat: 16.4038, lng: 102.5878 },
    { code: 'UDN', name: 'อุดรธานี', bureau: 'PPH4', lat: 17.4254, lng: 102.8557 },
    { code: 'LEI', name: 'เลย', bureau: 'PPH4', lat: 17.4089, lng: 101.6301 },
    { code: 'NKI', name: 'หนองคาย', bureau: 'PPH4', lat: 17.9406, lng: 102.8422 },
    { code: 'MKM', name: 'มหาสารคาม', bureau: 'PPH4', lat: 15.9934, lng: 103.1796 },
    { code: 'ROI', name: 'ร้อยเอ็ด', bureau: 'PPH4', lat: 15.9232, lng: 103.8262 },
    { code: 'KSN', name: 'กาฬสินธุ์', bureau: 'PPH4', lat: 16.6316, lng: 103.6283 },
    { code: 'SKN', name: 'สกลนคร', bureau: 'PPH4', lat: 17.3888, lng: 103.8213 },
    { code: 'NPM', name: 'นครพนม', bureau: 'PPH4', lat: 17.3724, lng: 104.4349 },
    { code: 'MUK', name: 'มุกดาหาร', bureau: 'PPH4', lat: 16.5568, lng: 104.5253 },
    { code: 'NBP', name: 'หนองบัวลำภู', bureau: 'PPH4', lat: 17.1736, lng: 102.2974 },
    { code: 'BKN', name: 'บึงกาฬ', bureau: 'PPH4', lat: 18.146, lng: 103.721 },
    { code: 'CMI', name: 'เชียงใหม่', bureau: 'PPH5', lat: 18.7905, lng: 98.7342 },
    { code: 'CRI', name: 'เชียงราย', bureau: 'PPH5', lat: 19.8441, lng: 99.8662 },
    { code: 'LPN', name: 'ลำพูน', bureau: 'PPH5', lat: 18.1417, lng: 98.9654 },
    { code: 'LPG', name: 'ลำปาง', bureau: 'PPH5', lat: 18.3523, lng: 99.5255 },
    { code: 'PRE', name: 'แพร่', bureau: 'PPH5', lat: 18.1947, lng: 100.0648 },
    { code: 'NAN', name: 'น่าน', bureau: 'PPH5', lat: 18.8448, lng: 100.8254 },
    { code: 'PYO', name: 'พะเยา', bureau: 'PPH5', lat: 19.228, lng: 100.1853 },
    { code: 'MSN', name: 'แม่ฮ่องสอน', bureau: 'PPH5', lat: 18.7549, lng: 98.0268 },
    { code: 'NSN', name: 'นครสวรรค์', bureau: 'PPH6', lat: 15.6924, lng: 100.1321 },
    { code: 'UTI', name: 'อุทัยธานี', bureau: 'PPH6', lat: 15.3389, lng: 99.4601 },
    { code: 'KPT', name: 'กำแพงเพชร', bureau: 'PPH6', lat: 16.3294, lng: 99.5026 },
    { code: 'TAK', name: 'ตาก', bureau: 'PPH6', lat: 16.6981, lng: 98.7962 },
    { code: 'SKT', name: 'สุโขทัย', bureau: 'PPH6', lat: 17.2479, lng: 99.6987 },
    { code: 'PLK', name: 'พิษณุโลก', bureau: 'PPH6', lat: 16.9707, lng: 100.53 },
    { code: 'PCB', name: 'พิจิตร', bureau: 'PPH6', lat: 16.2367, lng: 100.3572 },
    { code: 'PBN', name: 'เพชรบูรณ์', bureau: 'PPH6', lat: 16.2692, lng: 101.147 },
    { code: 'UTT', name: 'อุตรดิตถ์', bureau: 'PPH6', lat: 17.7423, lng: 100.5092 },
    { code: 'NPT', name: 'นครปฐม', bureau: 'PPH7', lat: 13.9241, lng: 100.1093 },
    { code: 'SPB', name: 'สุพรรณบุรี', bureau: 'PPH7', lat: 14.6079, lng: 99.898 },
    { code: 'KRI', name: 'กาญจนบุรี', bureau: 'PPH7', lat: 14.5845, lng: 99.0404 },
    { code: 'RAT', name: 'ราชบุรี', bureau: 'PPH7', lat: 13.5318, lng: 99.5738 },
    { code: 'PKI', name: 'เพชรบุรี', bureau: 'PPH7', lat: 12.9369, lng: 99.6133 },
    { code: 'PKK', name: 'ประจวบคีรีขันธ์', bureau: 'PPH7', lat: 11.9215, lng: 99.6265 },
    { code: 'SKS', name: 'สมุทรสงคราม', bureau: 'PPH7', lat: 13.3938, lng: 99.9562 },
    { code: 'SKM', name: 'สมุทรสาคร', bureau: 'PPH7', lat: 13.5707, lng: 100.2159 },
    { code: 'NRT', name: 'นครศรีธรรมราช', bureau: 'PPH8', lat: 8.3727, lng: 99.7779 },
    { code: 'SNI', name: 'สุราษฎร์ธานี', bureau: 'PPH8', lat: 9.0311, lng: 99.0627 },
    { code: 'CPN', name: 'ชุมพร', bureau: 'PPH8', lat: 10.3666, lng: 99.0698 },
    { code: 'RNG', name: 'ระนอง', bureau: 'PPH8', lat: 10.0009, lng: 98.7192 },
    { code: 'PNA', name: 'พังงา', bureau: 'PPH8', lat: 8.6796, lng: 98.4235 },
    { code: 'PKT', name: 'ภูเก็ต', bureau: 'PPH8', lat: 7.9747, lng: 98.3415 },
    { code: 'KBI', name: 'กระบี่', bureau: 'PPH8', lat: 8.1532, lng: 99.0141 },
    { code: 'SKA', name: 'สงขลา', bureau: 'PPH9', lat: 6.804, lng: 100.5818 },
    { code: 'STN', name: 'สตูล', bureau: 'PPH9', lat: 6.8502, lng: 99.9644 },
    { code: 'TRG', name: 'ตรัง', bureau: 'PPH9', lat: 7.5279, lng: 99.6167 },
    { code: 'PLG', name: 'พัทลุง', bureau: 'PPH9', lat: 7.513, lng: 100.0321 },
    { code: 'PTN', name: 'ปัตตานี', bureau: 'PPH9', lat: 6.7305, lng: 101.3526 },
    { code: 'YLA', name: 'ยะลา', bureau: 'PPH9', lat: 6.1833, lng: 101.2248 },
    { code: 'NWT', name: 'นราธิวาส', bureau: 'PPH9', lat: 6.1719, lng: 101.7215 },
];



async function main() {
    console.log('🌱 Starting C.O.P.S. Seed - ALL 77 PROVINCES');
    console.log('');

    // Create all Bureaus
    const bureaus: Record<string, any> = {};
    for (const b of bureausData) {
        const bureau = await prisma.bureau.upsert({
            where: { code: b.code },
            update: { name: b.name },
            create: { name: b.name, code: b.code },
        });
        bureaus[b.code] = bureau;
    }
    console.log(`✅ Created ${bureausData.length} Bureaus`);

    // Create all Provinces
    const provinces: Record<string, any> = {};
    for (const p of provincesData) {
        const province = await prisma.province.upsert({
            where: { code: p.code },
            update: { name: p.name },
            create: {
                name: p.name,
                code: p.code,
                bureauId: bureaus[p.bureau]?.id,
            },
        });
        provinces[p.code] = { ...province, lat: p.lat, lng: p.lng };
    }
    console.log(`✅ Created ${provincesData.length} Provinces`);

    // Create 1 sample station per province
    let stationCount = 0;
    for (const p of provincesData) {
        const stationCode = `${p.code}-001`;
        await prisma.station.upsert({
            where: { code: stationCode },
            update: {
                latitude: p.lat,
                longitude: p.lng,
            },
            create: {
                name: `สถานีตำรวจภูธรเมือง${p.name.replace('จังหวัด', '').replace('กรุงเทพมหานคร', 'กรุงเทพ')}`,
                code: stationCode,
                address: p.name,
                latitude: p.lat,
                longitude: p.lng,
                provinceId: provinces[p.code]?.id,
            },
        });
        stationCount++;
    }
    console.log(`✅ Created ${stationCount} Sample Stations (1 per province)`);

    // ===== SARABURI REAL STATIONS (DEMO) =====
    console.log('📍 Seeding Saraburi Stations (Detailed Mode)...');
    const saraburiStations = [
        { code: 'SRI-001', name: 'สภ.เมืองสระบุรี', lat: 14.528, lng: 100.911, address: 'อ.เมือง จ.สระบุรี' },
        { code: 'SRI-002', name: 'สภ.แก่งคอย', lat: 14.586, lng: 101.000, address: 'อ.แก่งคอย จ.สระบุรี' },
        { code: 'SRI-003', name: 'สภ.มวกเหล็ก', lat: 14.650, lng: 101.200, address: 'อ.มวกเหล็ก จ.สระบุรี' },
        { code: 'SRI-004', name: 'สภ.พระพุทธบาท', lat: 14.730, lng: 100.790, address: 'อ.พระพุทธบาท จ.สระบุรี' },
        { code: 'SRI-005', name: 'สภ.หนองแค', lat: 14.330, lng: 100.860, address: 'อ.หนองแค จ.สระบุรี' },
        { code: 'SRI-006', name: 'สภ.วิหารแดง', lat: 14.360, lng: 100.990, address: 'อ.วิหารแดง จ.สระบุรี' },
        { code: 'SRI-007', name: 'สภ.บ้านหมอ', lat: 14.610, lng: 100.730, address: 'อ.บ้านหมอ จ.สระบุรี' },
        { code: 'SRI-008', name: 'สภ.เสาไห้', lat: 14.550, lng: 100.850, address: 'อ.เสาไห้ จ.สระบุรี' },
        { code: 'SRI-009', name: 'สภ.เฉลิมพระเกียรติ', lat: 14.580, lng: 100.910, address: 'อ.เฉลิมพระเกียรติ จ.สระบุรี' },
        { code: 'SRI-010', name: 'สภ.วังม่วง', lat: 14.850, lng: 101.150, address: 'อ.วังม่วง จ.สระบุรี' },
    ];

    // Ensure Single Saraburi Province Exists (Since we removed it from Main Loop to avoid duplication)
    const saraburiProv = await prisma.province.upsert({
        where: { code: 'SRI' },
        update: {},
        create: {
            name: 'สระบุรี',
            code: 'SRI',
            bureauId: (await prisma.bureau.findUnique({ where: { code: 'PPH1' } }))?.id || '', // PPH1 is Region 1
        }
    });

    if (saraburiProv) {
        for (const s of saraburiStations) {
            await prisma.station.upsert({
                where: { code: s.code },
                update: {
                    name: s.name,
                    latitude: s.lat,
                    longitude: s.lng,
                    address: s.address,
                    provinceId: saraburiProv.id, // FORCE UPDATE link to this correct province
                },
                create: {
                    name: s.name,
                    code: s.code,
                    address: s.address,
                    latitude: s.lat,
                    longitude: s.lng,
                    provinceId: saraburiProv.id,
                },
            });
        }
        console.log(`✅ Added ${saraburiStations.length} Real Stations to Saraburi (FIXED)`);
        stationCount += saraburiStations.length; // Add to total count
    }

    // Create Admin User
    const hashedPassword = await bcrypt.hash('1234', 10);

    await prisma.user.upsert({
        where: { username: 'admin' },
        update: {},
        create: {
            username: 'admin',
            password: hashedPassword,
            firstName: 'ผู้ดูแล',
            lastName: 'ระบบ',
            rank: 'พ.ต.อ.',
            position: 'ผู้บังคับการ',
            role: UserRole.HQ,
        },
    });
    console.log('✅ Created Admin User');

    // Summary
    console.log('');
    console.log('🎉 ===== SEED COMPLETED =====');
    console.log('');
    console.log('📊 Summary:');
    console.log(`   • Bureaus: ${bureausData.length} (ภาค 1-9 + นครบาล)`);
    console.log(`   • Provinces: ${provincesData.length} (ครบ 77 จังหวัด)`);
    console.log(`   • Stations: ${stationCount} (1 ต่อจังหวัด)`);
    console.log('');
    console.log('📋 Login: admin / 1234');
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
