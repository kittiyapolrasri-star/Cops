import { PrismaClient, UserRole, RiskLevel } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting C.O.P.S. Seed...');
    console.log('');

    // Create Bureau
    const bureau = await prisma.bureau.upsert({
        where: { code: 'PPH1' },
        update: {},
        create: {
            name: 'กองบัญชาการตำรวจภูธรภาค 1',
            code: 'PPH1',
        },
    });
    console.log('✅ Bureau:', bureau.name);

    // Create Province
    const saraburi = await prisma.province.upsert({
        where: { code: 'SBI' },
        update: {},
        create: {
            name: 'ตำรวจภูธรจังหวัดสระบุรี',
            code: 'SBI',
            bureauId: bureau.id,
        },
    });
    console.log('✅ Province:', saraburi.name);

    // ==================== STATIONS (สถานีตำรวจในจังหวัดสระบุรี) ====================
    const stationsData = [
        { code: 'SBI-MU', name: 'สถานีตำรวจภูธรเมืองสระบุรี', address: 'ถ.พหลโยธิน ต.ปากเพรียว อ.เมืองสระบุรี', lat: 14.5333, lng: 100.9167 },
        { code: 'SBI-NK', name: 'สถานีตำรวจภูธรหนองแค', address: 'ถ.พหลโยธิน ต.หนองแค อ.หนองแค', lat: 14.3378, lng: 100.8657 },
        { code: 'SBI-KK', name: 'สถานีตำรวจภูธรแก่งคอย', address: 'ถ.มิตรภาพ ต.แก่งคอย อ.แก่งคอย', lat: 14.5889, lng: 101.0563 },
        { code: 'SBI-WM', name: 'สถานีตำรวจภูธรวังม่วง', address: 'อ.วังม่วง จ.สระบุรี', lat: 14.7089, lng: 101.0917 },
        { code: 'SBI-MC', name: 'สถานีตำรวจภูธรมวกเหล็ก', address: 'ถ.มิตรภาพ อ.มวกเหล็ก', lat: 14.6450, lng: 101.2017 },
        { code: 'SBI-PN', name: 'สถานีตำรวจภูธรพระพุทธบาท', address: 'อ.พระพุทธบาท จ.สระบุรี', lat: 14.7206, lng: 100.7900 },
        { code: 'SBI-BD', name: 'สถานีตำรวจภูธรบ้านหมอ', address: 'อ.บ้านหมอ จ.สระบุรี', lat: 14.6358, lng: 100.7028 },
        { code: 'SBI-NH', name: 'สถานีตำรวจภูธรหนองแซง', address: 'อ.หนองแซง จ.สระบุรี', lat: 14.3606, lng: 100.7556 },
        { code: 'SBI-NL', name: 'สถานีตำรวจภูธรหนองโดน', address: 'อ.หนองโดน จ.สระบุรี', lat: 14.4689, lng: 100.6953 },
        { code: 'SBI-DN', name: 'สถานีตำรวจภูธรดอนพุด', address: 'อ.ดอนพุด จ.สระบุรี', lat: 14.3847, lng: 100.6408 },
        { code: 'SBI-WH', name: 'สถานีตำรวจภูธรวิหารแดง', address: 'อ.วิหารแดง จ.สระบุรี', lat: 14.4022, lng: 100.9781 },
        { code: 'SBI-NP', name: 'สถานีตำรวจภูธรเสาไห้', address: 'อ.เสาไห้ จ.สระบุรี', lat: 14.5547, lng: 100.8342 },
        { code: 'SBI-CH', name: 'สถานีตำรวจภูธรเฉลิมพระเกียรติ', address: 'อ.เฉลิมพระเกียรติ จ.สระบุรี', lat: 14.6192, lng: 100.8844 },
    ];

    const stations: Record<string, any> = {};
    for (const s of stationsData) {
        const station = await prisma.station.upsert({
            where: { code: s.code },
            update: {},
            create: {
                name: s.name,
                code: s.code,
                address: s.address,
                latitude: s.lat,
                longitude: s.lng,
                provinceId: saraburi.id,
            },
        });
        stations[s.code] = station;
    }
    console.log('✅ Created', stationsData.length, 'Police Stations');

    // ==================== USERS ====================
    const hashedPassword = await bcrypt.hash('1234', 10);

    // Admin (HQ level)
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

    // Province Commander (ผู้บังคับการตำรวจภูธรจังหวัด)
    await prisma.user.upsert({
        where: { username: 'province_cmd' },
        update: {},
        create: {
            username: 'province_cmd',
            password: hashedPassword,
            firstName: 'ประสิทธิ์',
            lastName: 'รักษาสันติ',
            rank: 'พ.ต.อ.',
            position: 'ผบก.ภ.จว.สระบุรี',
            role: UserRole.PROVINCE,
        },
    });

    // Station Commanders (ผกก. แต่ละสถานี)
    const commanders = [
        { username: 'cmd_meung', firstName: 'วิชัย', lastName: 'ศรีสุข', position: 'ผกก.สภ.เมืองสระบุรี', station: 'SBI-MU' },
        { username: 'cmd_nk', firstName: 'สมชาย', lastName: 'รักษาความสงบ', position: 'ผกก.สภ.หนองแค', station: 'SBI-NK' },
        { username: 'cmd_kk', firstName: 'สุรศักดิ์', lastName: 'พิทักษ์', position: 'ผกก.สภ.แก่งคอย', station: 'SBI-KK' },
    ];

    for (const cmd of commanders) {
        await prisma.user.upsert({
            where: { username: cmd.username },
            update: {},
            create: {
                username: cmd.username,
                password: hashedPassword,
                firstName: cmd.firstName,
                lastName: cmd.lastName,
                rank: 'พ.ต.ท.',
                position: cmd.position,
                role: UserRole.STATION,
                stationId: stations[cmd.station]?.id,
            },
        });
    }

    // Patrol Officers (สายตรวจ)
    const patrols = [
        { username: 'patrol_nk1', firstName: 'สมศักดิ์', lastName: 'ยุทธการ', station: 'SBI-NK' },
        { username: 'patrol_nk2', firstName: 'สมหญิง', lastName: 'ปฏิบัติการ', station: 'SBI-NK' },
        { username: 'patrol_nk3', firstName: 'วีระ', lastName: 'ตรวจการ', station: 'SBI-NK' },
        { username: 'patrol_mu1', firstName: 'ประกาศ', lastName: 'สันติภาพ', station: 'SBI-MU' },
        { username: 'patrol_mu2', firstName: 'กิตติ', lastName: 'รักษาราษฎร์', station: 'SBI-MU' },
        { username: 'patrol_kk1', firstName: 'อนุชา', lastName: 'ปกป้อง', station: 'SBI-KK' },
    ];

    for (const p of patrols) {
        await prisma.user.upsert({
            where: { username: p.username },
            update: {},
            create: {
                username: p.username,
                password: hashedPassword,
                firstName: p.firstName,
                lastName: p.lastName,
                rank: 'ด.ต.',
                position: 'สายตรวจ',
                role: UserRole.PATROL,
                stationId: stations[p.station]?.id,
            },
        });
    }
    console.log('✅ Created Users (Admin + Province + 3 Commanders + 6 Patrol Officers)');

    // ==================== RISK ZONES (จุดเสี่ยง) ====================
    const riskZonesData = [
        // หนองแค
        { name: 'ซอยเปลี่ยว ม.3', desc: 'พื้นที่มืด มักมีกลุ่มวัยรุ่นมั่วสุม', lat: 14.3385, lng: 100.8665, level: RiskLevel.HIGH, checks: 4, station: 'SBI-NK' },
        { name: 'ตลาดสดหนองแค', desc: 'จุดเสี่ยงลักทรัพย์', lat: 14.3372, lng: 100.8650, level: RiskLevel.MEDIUM, checks: 3, station: 'SBI-NK' },
        { name: 'สี่แยกไฟแดงหน้าธนาคาร', desc: 'จุดเกิดอุบัติเหตุบ่อย', lat: 14.3390, lng: 100.8640, level: RiskLevel.MEDIUM, checks: 2, station: 'SBI-NK' },
        { name: 'สวนสาธารณะหนองแค', desc: 'พื้นที่พักผ่อน ตรวจตราช่วงค่ำ', lat: 14.3365, lng: 100.8680, level: RiskLevel.LOW, checks: 2, station: 'SBI-NK' },
        // เมืองสระบุรี
        { name: 'สถานีรถไฟสระบุรี', desc: 'จุดเสี่ยงลักทรัพย์/มิจฉาชีพ', lat: 14.5350, lng: 100.9100, level: RiskLevel.HIGH, checks: 4, station: 'SBI-MU' },
        { name: 'ตลาดโต้รุ่งสระบุรี', desc: 'ชุมชนหนาแน่น เสี่ยงทะเลาะวิวาท', lat: 14.5320, lng: 100.9150, level: RiskLevel.MEDIUM, checks: 3, station: 'SBI-MU' },
        { name: 'หน้าห้างโรบินสัน', desc: 'จุดจอดรถ เสี่ยงลักทรัพย์', lat: 14.5280, lng: 100.9200, level: RiskLevel.MEDIUM, checks: 2, station: 'SBI-MU' },
        // แก่งคอย
        { name: 'ทางเข้าเขื่อนป่าสักฯ', desc: 'เส้นทางท่องเที่ยว', lat: 14.5900, lng: 101.0600, level: RiskLevel.LOW, checks: 2, station: 'SBI-KK' },
        { name: 'ตลาดแก่งคอย', desc: 'จุดขายของ ตรวจตราปกติ', lat: 14.5880, lng: 101.0550, level: RiskLevel.MEDIUM, checks: 2, station: 'SBI-KK' },
    ];

    for (const zone of riskZonesData) {
        await prisma.riskZone.upsert({
            where: { id: `zone-${zone.name.replace(/\s/g, '-')}` },
            update: {},
            create: {
                name: zone.name,
                description: zone.desc,
                latitude: zone.lat,
                longitude: zone.lng,
                riskLevel: zone.level,
                requiredCheckIns: zone.checks,
                stationId: stations[zone.station]?.id,
            },
        });
    }
    console.log('✅ Created', riskZonesData.length, 'Risk Zones');

    // ==================== SUMMARY ====================
    console.log('');
    console.log('🎉 ===== SEED COMPLETED SUCCESSFULLY =====');
    console.log('');
    console.log('📊 Summary:');
    console.log(`   • Bureaus: 1 (ภ.1)`);
    console.log(`   • Provinces: 1 (สระบุรี)`);
    console.log(`   • Stations: ${stationsData.length}`);
    console.log(`   • Users: ${2 + commanders.length + patrols.length}`);
    console.log(`   • Risk Zones: ${riskZonesData.length}`);
    console.log('');
    console.log('📋 Login Credentials (Password: 1234):');
    console.log('   ┌───────────────┬─────────────────┬────────────────────┐');
    console.log('   │ Username      │ Role            │ Station            │');
    console.log('   ├───────────────┼─────────────────┼────────────────────┤');
    console.log('   │ admin         │ HQ (สตช.)       │ -                  │');
    console.log('   │ province_cmd  │ Province (ภจว.) │ -                  │');
    console.log('   │ cmd_meung     │ Station (ผกก.)  │ สภ.เมืองสระบุรี   │');
    console.log('   │ cmd_nk        │ Station (ผกก.)  │ สภ.หนองแค         │');
    console.log('   │ cmd_kk        │ Station (ผกก.)  │ สภ.แก่งคอย        │');
    console.log('   │ patrol_nk1    │ Patrol          │ สภ.หนองแค         │');
    console.log('   │ patrol_mu1    │ Patrol          │ สภ.เมืองสระบุรี   │');
    console.log('   │ patrol_kk1    │ Patrol          │ สภ.แก่งคอย        │');
    console.log('   └───────────────┴─────────────────┴────────────────────┘');
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
