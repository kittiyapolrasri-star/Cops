import { PrismaClient, UserRole, RiskLevel } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting seed...');

    // Create Bureau
    const bureau = await prisma.bureau.upsert({
        where: { code: 'BUR001' },
        update: {},
        create: {
            name: 'กองบัญชาการตำรวจภูธรภาค 1',
            code: 'BUR001',
        },
    });
    console.log('✅ Created Bureau:', bureau.name);

    // Create Province
    const province = await prisma.province.upsert({
        where: { code: 'SBI' },
        update: {},
        create: {
            name: 'จังหวัดสระบุรี',
            code: 'SBI',
            bureauId: bureau.id,
        },
    });
    console.log('✅ Created Province:', province.name);

    // Create Station
    const station = await prisma.station.upsert({
        where: { code: 'NK001' },
        update: {},
        create: {
            name: 'สถานีตำรวจภูธรหนองแค',
            code: 'NK001',
            address: 'อ.หนองแค จ.สระบุรี',
            latitude: 14.3378,
            longitude: 100.8657,
            provinceId: province.id,
        },
    });
    console.log('✅ Created Station:', station.name);

    // Create Users
    const hashedPassword = await bcrypt.hash('1234', 10);

    // Admin (HQ level)
    const admin = await prisma.user.upsert({
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
    console.log('✅ Created Admin:', admin.username);

    // Station Commander
    const commander = await prisma.user.upsert({
        where: { username: 'commander' },
        update: {},
        create: {
            username: 'commander',
            password: hashedPassword,
            firstName: 'สมชาย',
            lastName: 'รักษาความสงบ',
            rank: 'พ.ต.ท.',
            position: 'ผกก.สภ.หนองแค',
            role: UserRole.STATION,
            stationId: station.id,
        },
    });
    console.log('✅ Created Commander:', commander.username);

    // Patrol Officers
    const patrol1 = await prisma.user.upsert({
        where: { username: 'patrol1' },
        update: {},
        create: {
            username: 'patrol1',
            password: hashedPassword,
            firstName: 'สมศักดิ์',
            lastName: 'ยุทธการ',
            rank: 'ด.ต.',
            position: 'สายตรวจ',
            role: UserRole.PATROL,
            stationId: station.id,
        },
    });
    console.log('✅ Created Patrol Officer:', patrol1.username);

    const patrol2 = await prisma.user.upsert({
        where: { username: 'patrol2' },
        update: {},
        create: {
            username: 'patrol2',
            password: hashedPassword,
            firstName: 'สมหญิง',
            lastName: 'ปฏิบัติการ',
            rank: 'ส.ต.อ.',
            position: 'สายตรวจ',
            role: UserRole.PATROL,
            stationId: station.id,
        },
    });
    console.log('✅ Created Patrol Officer:', patrol2.username);

    // Create Risk Zones
    const riskZones = [
        {
            name: 'ซอยเปลี่ยว ม.3',
            description: 'พื้นที่มืด มักมีกลุ่มวัยรุ่นมั่วสุม',
            latitude: 14.3385,
            longitude: 100.8665,
            riskLevel: RiskLevel.HIGH,
            requiredCheckIns: 4,
        },
        {
            name: 'ตลาดสดหนองแค',
            description: 'จุดเสี่ยงลักทรัพย์',
            latitude: 14.3372,
            longitude: 100.8650,
            riskLevel: RiskLevel.MEDIUM,
            requiredCheckIns: 3,
        },
        {
            name: 'สี่แยกไฟแดงหน้าธนาคาร',
            description: 'จุดเกิดอุบัติเหตุบ่อย',
            latitude: 14.3390,
            longitude: 100.8640,
            riskLevel: RiskLevel.MEDIUM,
            requiredCheckIns: 2,
        },
        {
            name: 'สวนสาธารณะ',
            description: 'พื้นที่พักผ่อน ตรวจตราช่วงค่ำ',
            latitude: 14.3365,
            longitude: 100.8680,
            riskLevel: RiskLevel.LOW,
            requiredCheckIns: 2,
        },
    ];

    for (const zone of riskZones) {
        await prisma.riskZone.create({
            data: {
                ...zone,
                stationId: station.id,
            },
        });
    }
    console.log('✅ Created', riskZones.length, 'Risk Zones');

    console.log('');
    console.log('🎉 Seed completed successfully!');
    console.log('');
    console.log('📋 Login Credentials:');
    console.log('   Admin (HQ):     username: admin,     password: 1234');
    console.log('   Commander:      username: commander, password: 1234');
    console.log('   Patrol Officer: username: patrol1,   password: 1234');
    console.log('   Patrol Officer: username: patrol2,   password: 1234');
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
