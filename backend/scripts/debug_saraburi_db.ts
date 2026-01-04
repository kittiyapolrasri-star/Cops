import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    console.log('🔍 AUDITING SARABURI DATA...');

    // 1. Audit Provinces
    console.log('\n----- Checking Provinces -----');
    const provinces = await prisma.province.findMany({
        where: {
            OR: [
                { name: { contains: 'สระบุรี' } },
                { code: 'SRI' },
                { code: { contains: 'Sar' } } // Flexible check
            ]
        },
        include: { _count: { select: { stations: true } } }
    });

    if (provinces.length === 0) {
        console.log('❌ NO PROVINCES FOUND matching Saraburi!');
    }
    provinces.forEach(p => {
        console.log(`Province: [${p.code}] ${p.name} (ID: ${p.id})`);
        console.log(`   -> Linked Stations: ${p._count.stations}`);
    });

    // 2. Audit Stations
    console.log('\n----- Checking Stations -----');
    const stations = await prisma.station.findMany({
        where: {
            OR: [
                { code: { startsWith: 'SRI-' } },
                { code: { startsWith: 'SBI-' } }, // Check for ghost code
                { name: { contains: 'สระบุรี' } },
                { province: { name: { contains: 'สระบุรี' } } }
            ]
        },
        include: { province: true }
    });

    console.log(`Total Matches: ${stations.length}`);
    stations.forEach(s => {
        console.log(`Station: [${s.code}] ${s.name} (ID: ${s.id})`);
        console.log(`   -> Linked to Prov: ${s.province?.name} (${s.provinceId})`);
        if (!s.province) console.log('   -> ❌ ORPHAN STATION (No Province Link)');
    });

    console.log('\n----- Audit Complete -----');
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
