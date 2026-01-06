import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting seed...');

    // 1. Seed Organizations
    const orgData = JSON.parse(
        fs.readFileSync(path.join(__dirname, 'seed-data/organizations.json'), 'utf-8'),
    );

    for (const bureau of orgData) {
        const createdBureau = await prisma.bureau.upsert({
            where: { code: bureau.code },
            update: {},
            create: {
                code: bureau.code,
                name: bureau.name,
                provinces: {
                    create: bureau.provinces.map((province: any) => ({
                        code: province.code,
                        name: province.name,
                        stations: {
                            create: province.stations.map((station: any) => ({
                                code: station.code,
                                name: station.name,
                                address: station.address,
                                latitude: station.latitude,
                                longitude: station.longitude,
                            })),
                        },
                    })),
                },
            },
        });
        console.log(`Created Bureau: ${createdBureau.name}`);
    }

    // 2. Seed Users
    const userData = JSON.parse(
        fs.readFileSync(path.join(__dirname, 'seed-data/users.json'), 'utf-8'),
    );

    for (const user of userData) {
        const hashedPassword = await bcrypt.hash(user.password, 10);

        let stationId = null;
        if (user.stationCode) {
            const station = await prisma.station.findUnique({
                where: { code: user.stationCode },
            });
            stationId = station?.id;
        }

        const createdUser = await prisma.user.upsert({
            where: { username: user.username },
            update: {
                password: hashedPassword,
                stationId: stationId,
            },
            create: {
                username: user.username,
                password: hashedPassword,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                rank: user.rank,
                position: user.position,
                stationId: stationId,
            },
        });
        console.log(`Created User: ${createdUser.username}`);
    }

    // 3. Seed POIs
    const poiData = JSON.parse(
        fs.readFileSync(path.join(__dirname, 'seed-data/poi.json'), 'utf-8'),
    );

    for (const poi of poiData) {
        const station = await prisma.station.findUnique({
            where: { code: poi.stationCode },
        });

        if (station) {
            // Get a random patrol user to be the creator
            const creator = await prisma.user.findFirst({
                where: { role: 'PATROL' }
            });

            if (creator) {
                await prisma.pointOfInterest.create({
                    data: {
                        name: poi.name,
                        description: poi.description,
                        category: poi.category,
                        priority: poi.priority,
                        latitude: poi.latitude,
                        longitude: poi.longitude,
                        address: poi.address,
                        contactInfo: poi.contactInfo,
                        stationId: station.id,
                        createdById: creator.id,
                    },
                });
                console.log(`Created POI: ${poi.name}`);
            }
        }
    }

    console.log('✅ Seeding completed.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
