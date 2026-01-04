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
    // ===== กองบัญชาการตำรวจนครบาล (BMA) =====
    { code: 'BKK', name: 'กรุงเทพมหานคร', bureau: 'BMA', lat: 13.7563, lng: 100.5018 },

    // ===== ภาค 1 (ภาคกลาง) =====
    { code: 'AYA', name: 'พระนครศรีอยุธยา', bureau: 'PPH1', lat: 14.3532, lng: 100.5685 },
    { code: 'ANG', name: 'อ่างทอง', bureau: 'PPH1', lat: 14.5896, lng: 100.4550 },
    { code: 'LPB', name: 'ลพบุรี', bureau: 'PPH1', lat: 14.7995, lng: 100.6534 },
    { code: 'SBI', name: 'สระบุรี', bureau: 'PPH1', lat: 14.5289, lng: 100.9108 },
    { code: 'STI', name: 'สิงห์บุรี', bureau: 'PPH1', lat: 14.8936, lng: 100.3967 },
    { code: 'CNT', name: 'ชัยนาท', bureau: 'PPH1', lat: 15.1851, lng: 100.1251 },
    { code: 'NBI', name: 'นนทบุรี', bureau: 'PPH1', lat: 13.8621, lng: 100.5144 },
    { code: 'PTN', name: 'ปทุมธานี', bureau: 'PPH1', lat: 14.0208, lng: 100.5250 },

    // ===== ภาค 2 (ภาคตะวันออก) =====
    { code: 'CBI', name: 'ชลบุรี', bureau: 'PPH2', lat: 13.3611, lng: 100.9847 },
    { code: 'RYG', name: 'ระยอง', bureau: 'PPH2', lat: 12.6833, lng: 101.2378 },
    { code: 'CTI', name: 'จันทบุรี', bureau: 'PPH2', lat: 12.6114, lng: 102.1039 },
    { code: 'TRT', name: 'ตราด', bureau: 'PPH2', lat: 12.2428, lng: 102.5175 },
    { code: 'CCO', name: 'ฉะเชิงเทรา', bureau: 'PPH2', lat: 13.6904, lng: 101.0779 },
    { code: 'PKN', name: 'ปราจีนบุรี', bureau: 'PPH2', lat: 14.0509, lng: 101.3717 },
    { code: 'SKW', name: 'สระแก้ว', bureau: 'PPH2', lat: 13.8240, lng: 102.0645 },
    { code: 'SPK', name: 'สมุทรปราการ', bureau: 'PPH2', lat: 13.5990, lng: 100.5998 },

    // ===== ภาค 3 (ภาคตะวันออกเฉียงเหนือตอนล่าง) =====
    { code: 'NKR', name: 'นครราชสีมา', bureau: 'PPH3', lat: 14.9799, lng: 102.0978 },
    { code: 'BRM', name: 'บุรีรัมย์', bureau: 'PPH3', lat: 14.9930, lng: 103.1029 },
    { code: 'SRN', name: 'สุรินทร์', bureau: 'PPH3', lat: 14.8819, lng: 103.4936 },
    { code: 'SSK', name: 'ศรีสะเกษ', bureau: 'PPH3', lat: 15.1186, lng: 104.3220 },
    { code: 'UBN', name: 'อุบลราชธานี', bureau: 'PPH3', lat: 15.2287, lng: 104.8564 },
    { code: 'YST', name: 'ยโสธร', bureau: 'PPH3', lat: 15.7944, lng: 104.1453 },
    { code: 'CYP', name: 'ชัยภูมิ', bureau: 'PPH3', lat: 15.8068, lng: 102.0288 },
    { code: 'AMN', name: 'อำนาจเจริญ', bureau: 'PPH3', lat: 15.8656, lng: 104.6258 },

    // ===== ภาค 4 (ภาคตะวันออกเฉียงเหนือตอนบน) =====
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

    // ===== ภาค 5 (ภาคเหนือตอนบน) =====
    { code: 'CMI', name: 'เชียงใหม่', bureau: 'PPH5', lat: 18.7883, lng: 98.9853 },
    { code: 'CRI', name: 'เชียงราย', bureau: 'PPH5', lat: 19.9105, lng: 99.8406 },
    { code: 'LPN', name: 'ลำพูน', bureau: 'PPH5', lat: 18.5744, lng: 99.0087 },
    { code: 'LPG', name: 'ลำปาง', bureau: 'PPH5', lat: 18.2888, lng: 99.4909 },
    { code: 'PRE', name: 'แพร่', bureau: 'PPH5', lat: 18.1445, lng: 100.1403 },
    { code: 'NAN', name: 'น่าน', bureau: 'PPH5', lat: 18.7756, lng: 100.7730 },
    { code: 'PYO', name: 'พะเยา', bureau: 'PPH5', lat: 19.1664, lng: 99.9019 },
    { code: 'MSN', name: 'แม่ฮ่องสอน', bureau: 'PPH5', lat: 19.3020, lng: 97.9654 },

    // ===== ภาค 6 (ภาคเหนือตอนล่าง) =====
    { code: 'NSN', name: 'นครสวรรค์', bureau: 'PPH6', lat: 15.7030, lng: 100.1369 },
    { code: 'UTI', name: 'อุทัยธานี', bureau: 'PPH6', lat: 15.3792, lng: 100.0245 },
    { code: 'KPT', name: 'กำแพงเพชร', bureau: 'PPH6', lat: 16.4827, lng: 99.5226 },
    { code: 'TAK', name: 'ตาก', bureau: 'PPH6', lat: 16.8839, lng: 99.1258 },
    { code: 'SKT', name: 'สุโขทัย', bureau: 'PPH6', lat: 17.0156, lng: 99.8230 },
    { code: 'PLK', name: 'พิษณุโลก', bureau: 'PPH6', lat: 16.8211, lng: 100.2659 },
    { code: 'PCB', name: 'พิจิตร', bureau: 'PPH6', lat: 16.4429, lng: 100.3487 },
    { code: 'PBN', name: 'เพชรบูรณ์', bureau: 'PPH6', lat: 16.4189, lng: 101.1591 },
    { code: 'UTT', name: 'อุตรดิตถ์', bureau: 'PPH6', lat: 17.6200, lng: 100.0993 },

    // ===== ภาค 7 (ภาคกลางตอนล่าง/ตะวันตก) =====
    { code: 'NKP', name: 'นครปฐม', bureau: 'PPH7', lat: 13.8196, lng: 100.0445 },
    { code: 'SPB', name: 'สุพรรณบุรี', bureau: 'PPH7', lat: 14.4744, lng: 100.1177 },
    { code: 'KRI', name: 'กาญจนบุรี', bureau: 'PPH7', lat: 14.0227, lng: 99.5328 },
    { code: 'RAT', name: 'ราชบุรี', bureau: 'PPH7', lat: 13.5283, lng: 99.8134 },
    { code: 'PKI', name: 'เพชรบุรี', bureau: 'PPH7', lat: 13.1119, lng: 99.9397 },
    { code: 'PKK', name: 'ประจวบคีรีขันธ์', bureau: 'PPH7', lat: 11.8120, lng: 99.7972 },
    { code: 'SKS', name: 'สมุทรสงคราม', bureau: 'PPH7', lat: 13.4098, lng: 100.0022 },
    { code: 'SKM', name: 'สมุทรสาคร', bureau: 'PPH7', lat: 13.5475, lng: 100.2744 },

    // ===== ภาค 8 (ภาคใต้ตอนบน) =====
    { code: 'NST', name: 'นครศรีธรรมราช', bureau: 'PPH8', lat: 8.4328, lng: 99.9631 },
    { code: 'SKA', name: 'สุราษฎร์ธานี', bureau: 'PPH8', lat: 9.1382, lng: 99.3217 },
    { code: 'CPN', name: 'ชุมพร', bureau: 'PPH8', lat: 10.4930, lng: 99.1800 },
    { code: 'RNG', name: 'ระนอง', bureau: 'PPH8', lat: 9.9619, lng: 98.6083 },
    { code: 'PNA', name: 'พังงา', bureau: 'PPH8', lat: 8.4501, lng: 98.5255 },
    { code: 'PKT', name: 'ภูเก็ต', bureau: 'PPH8', lat: 7.8804, lng: 98.3923 },
    { code: 'KBI', name: 'กระบี่', bureau: 'PPH8', lat: 8.0863, lng: 98.9063 },

    // ===== ภาค 9 (ภาคใต้ตอนล่าง) =====
    { code: 'SGK', name: 'สงขลา', bureau: 'PPH9', lat: 7.1897, lng: 100.5951 },
    { code: 'STN', name: 'สตูล', bureau: 'PPH9', lat: 6.6238, lng: 100.0673 },
    { code: 'TRG', name: 'ตรัง', bureau: 'PPH9', lat: 7.5593, lng: 99.6114 },
    { code: 'PTL', name: 'พัทลุง', bureau: 'PPH9', lat: 7.6167, lng: 100.0833 },
    { code: 'PTN', name: 'ปัตตานี', bureau: 'PPH9', lat: 6.8664, lng: 101.2508 },
    { code: 'YLA', name: 'ยะลา', bureau: 'PPH9', lat: 6.5410, lng: 101.2803 },
    { code: 'NWT', name: 'นราธิวาส', bureau: 'PPH9', lat: 6.4254, lng: 101.8253 },
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
            update: {},
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
