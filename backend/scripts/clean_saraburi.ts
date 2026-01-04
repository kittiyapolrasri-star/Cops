import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    console.log('🧹 Cleaning Saraburi Data (Aggressive Mode)...');

    // 1. Delete Stations linked to Saraburi (by code OR province name)
    const delStations = await prisma.station.deleteMany({
        where: {
            OR: [
                { code: { startsWith: 'SRI-' } },
                { code: { startsWith: 'SBI-' } }, // FOUND THE CULPRIT!
                { province: { name: { contains: 'สระบุรี' } } },
                { province: { code: 'SRI' } }
            ]
        }
    });
    console.log(`✅ Deleted ${delStations.count} Stations (Including SBI-001).`);

    // 2. Delete ALL Saraburi Provinces (Code SRI, or Name contains สระบุรี)
    const delProvinces = await prisma.province.deleteMany({
        where: {
            OR: [
                { code: 'SRI' },
                { name: { contains: 'สระบุรี' } }
            ]
        }
    });
    console.log(`✅ Deleted ${delProvinces.count} Provinces.`);

    console.log('✨ Database Cleaned. Ready for Seed.');
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
