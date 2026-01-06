import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting seed...');

    // 1. Seed Organizations (Iterative Upsert for Robustness)
    const orgData = JSON.parse(
        fs.readFileSync(path.join(__dirname, 'seed-data/organizations.json'), 'utf-8'),
    );

    for (const bureau of orgData) {
        const bureauRecord = await prisma.bureau.upsert({
            where: { code: bureau.code },
            update: { name: bureau.name },
            create: { code: bureau.code, name: bureau.name },
        });
        console.log(`✓ Bureau: ${bureauRecord.name}`);

        if (bureau.provinces) {
            for (const province of bureau.provinces) {
                const provinceRecord = await prisma.province.upsert({
                    where: { code: province.code },
                    update: { name: province.name, bureauId: bureauRecord.id },
                    create: { code: province.code, name: province.name, bureauId: bureauRecord.id },
                });

                if (province.stations) {
                    for (const station of province.stations) {
                        await prisma.station.upsert({
                            where: { code: station.code },
                            update: { name: station.name, address: station.address, latitude: station.latitude, longitude: station.longitude, provinceId: provinceRecord.id },
                            create: { code: station.code, name: station.name, address: station.address, latitude: station.latitude, longitude: station.longitude, provinceId: provinceRecord.id },
                        });
                    }
                }
            }
        }
    }

    // 2. Seed Users
    const userData = JSON.parse(
        fs.readFileSync(path.join(__dirname, 'seed-data/users.json'), 'utf-8'),
    );

    for (const user of userData) {
        const hashedPassword = await bcrypt.hash(user.password, 10);
        let stationId = null;
        if (user.stationCode) {
            const station = await prisma.station.findUnique({ where: { code: user.stationCode } });
            stationId = station?.id;
        }

        await prisma.user.upsert({
            where: { username: user.username },
            update: { password: hashedPassword, stationId, role: user.role, firstName: user.firstName, lastName: user.lastName, rank: user.rank, position: user.position },
            create: { username: user.username, password: hashedPassword, firstName: user.firstName, lastName: user.lastName, role: user.role, rank: user.rank, position: user.position, stationId },
        });
        console.log(`✓ User: ${user.username}`);
    }

    // 3. Seed POIs
    const poiData = JSON.parse(
        fs.readFileSync(path.join(__dirname, 'seed-data/poi.json'), 'utf-8'),
    );

    for (const poi of poiData) {
        const station = await prisma.station.findUnique({ where: { code: poi.stationCode } });
        const creator = await prisma.user.findFirst({ where: { role: 'PATROL' } });

        if (station && creator) {
            const existing = await prisma.pointOfInterest.findFirst({ where: { name: poi.name, stationId: station.id } });
            if (!existing) {
                await prisma.pointOfInterest.create({
                    data: { name: poi.name, description: poi.description, category: poi.category, priority: poi.priority, latitude: poi.latitude, longitude: poi.longitude, address: poi.address, stationId: station.id, createdById: creator.id },
                });
                console.log(`✓ POI: ${poi.name}`);
            }
        }
    }

    // 4. Seed Crime Records
    const crimeData = JSON.parse(
        fs.readFileSync(path.join(__dirname, 'seed-data/crimes.json'), 'utf-8'),
    );

    for (const crime of crimeData) {
        const station = await prisma.station.findUnique({ where: { code: crime.stationCode } });
        const reporter = await prisma.user.findFirst({ where: { role: 'PATROL' } });

        if (station) {
            const existing = await prisma.crimeRecord.findFirst({ where: { caseNumber: crime.caseNumber } });
            if (!existing) {
                await prisma.crimeRecord.create({
                    data: {
                        caseNumber: crime.caseNumber,
                        type: crime.type,
                        source: crime.source,
                        latitude: crime.latitude,
                        longitude: crime.longitude,
                        address: crime.address,
                        description: crime.description,
                        occurredAt: new Date(crime.occurredAt),
                        suspectInfo: crime.suspectInfo,
                        victimCount: crime.victimCount,
                        damageValue: crime.damageValue,
                        isResolved: crime.isResolved,
                        stationId: station.id,
                        reportedById: reporter?.id,
                    },
                });
                console.log(`✓ Crime: ${crime.caseNumber}`);
            }
        }
    }

    // 5. Seed Risk Zones
    const riskzoneData = JSON.parse(
        fs.readFileSync(path.join(__dirname, 'seed-data/riskzones.json'), 'utf-8'),
    );

    for (const zone of riskzoneData) {
        const station = await prisma.station.findUnique({ where: { code: zone.stationCode } });

        if (station) {
            const existing = await prisma.riskZone.findFirst({ where: { name: zone.name, stationId: station.id } });
            if (!existing) {
                await prisma.riskZone.create({
                    data: {
                        name: zone.name,
                        description: zone.description,
                        latitude: zone.latitude,
                        longitude: zone.longitude,
                        radius: zone.radius,
                        riskLevel: zone.riskLevel,
                        requiredCheckIns: zone.requiredCheckIns,
                        stationId: station.id,
                    },
                });
                console.log(`✓ RiskZone: ${zone.name}`);
            }
        }
    }

    // 6. Seed Citizen Tips
    const tipData = JSON.parse(
        fs.readFileSync(path.join(__dirname, 'seed-data/citizen-tips.json'), 'utf-8'),
    );

    for (const tip of tipData) {
        const station = await prisma.station.findUnique({ where: { code: tip.stationCode } });

        if (station) {
            await prisma.citizenTip.create({
                data: {
                    tipCode: `TIP-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
                    category: tip.category,
                    latitude: tip.latitude,
                    longitude: tip.longitude,
                    address: tip.address,
                    description: tip.description,
                    contactPhone: tip.contactPhone,
                    contactEmail: tip.contactEmail,
                    isAnonymous: tip.isAnonymous,
                    priority: tip.priority,
                    status: tip.status,
                    stationId: station.id,
                },
            });
            console.log(`✓ CitizenTip: ${tip.category}`);
        }
    }

    // 7. Seed SOS Alerts
    const sosData = JSON.parse(
        fs.readFileSync(path.join(__dirname, 'seed-data/sos-alerts.json'), 'utf-8'),
    );

    for (const sos of sosData) {
        const user = await prisma.user.findUnique({ where: { username: sos.userUsername } });
        const station = await prisma.station.findUnique({ where: { code: sos.stationCode } });

        if (user && station) {
            await prisma.sOSAlert.create({
                data: {
                    type: sos.type,
                    latitude: sos.latitude,
                    longitude: sos.longitude,
                    address: sos.address,
                    message: sos.message,
                    status: sos.status,
                    resolutionNote: sos.resolutionNote,
                    userId: user.id,
                    stationId: station.id,
                },
            });
            console.log(`✓ SOS: ${sos.type}`);
        }
    }

    // 8. Seed Incidents
    const incidentData = JSON.parse(
        fs.readFileSync(path.join(__dirname, 'seed-data/incidents.json'), 'utf-8'),
    );

    for (const incident of incidentData) {
        const user = await prisma.user.findUnique({ where: { username: incident.userUsername } });

        if (user) {
            await prisma.incident.create({
                data: {
                    type: incident.type,
                    description: incident.description,
                    latitude: incident.latitude,
                    longitude: incident.longitude,
                    isResolved: incident.isResolved || false,
                    userId: user.id,
                },
            });
            console.log(`✓ Incident: ${incident.type}`);
        }
    }

    // 9. Seed Duty Zones (for GPS Compliance)
    const dutyZoneData = JSON.parse(
        fs.readFileSync(path.join(__dirname, 'seed-data/duty-zones.json'), 'utf-8'),
    );

    for (const zone of dutyZoneData) {
        const station = await prisma.station.findUnique({ where: { code: zone.stationCode } });

        if (station) {
            const existing = await prisma.dutyZone.findFirst({ where: { name: zone.name, stationId: station.id } });
            if (!existing) {
                await prisma.dutyZone.create({
                    data: {
                        name: zone.name,
                        description: zone.description,
                        coordinates: zone.coordinates,
                        stationId: station.id,
                    },
                });
                console.log(`✓ DutyZone: ${zone.name}`);
            }
        }
    }

    // 10. Seed Patrol Plans with Checkpoints
    const patrolPlanData = JSON.parse(
        fs.readFileSync(path.join(__dirname, 'seed-data/patrol-plans.json'), 'utf-8'),
    );

    for (const plan of patrolPlanData) {
        const station = await prisma.station.findUnique({ where: { code: plan.stationCode } });
        const creator = await prisma.user.findFirst({
            where: { stationId: station?.id, role: { in: ['STATION', 'HQ'] } }
        }) || await prisma.user.findFirst({ where: { role: 'HQ' } });

        if (station && creator) {
            // Parse time strings into Date objects
            const today = new Date();
            const [startHour, startMin] = plan.startTime.split(':').map(Number);
            const [endHour, endMin] = plan.endTime.split(':').map(Number);

            const startTime = new Date(today);
            startTime.setHours(startHour, startMin, 0, 0);

            const endTime = new Date(today);
            endTime.setHours(endHour, endMin, 0, 0);
            // If end time is before start time, it's next day
            if (endTime <= startTime) {
                endTime.setDate(endTime.getDate() + 1);
            }

            // Check if plan already exists
            const existing = await prisma.patrolPlan.findFirst({
                where: { name: plan.name, stationId: station.id }
            });

            if (!existing) {
                const createdPlan = await prisma.patrolPlan.create({
                    data: {
                        name: plan.name,
                        description: plan.description,
                        stationId: station.id,
                        createdById: creator.id,
                        startTime,
                        endTime,
                        repeatDaily: plan.repeatDaily || false,
                    },
                });

                // Create checkpoints for this plan
                if (plan.checkpoints && plan.checkpoints.length > 0) {
                    for (const cp of plan.checkpoints) {
                        await prisma.patrolCheckpoint.create({
                            data: {
                                planId: createdPlan.id,
                                name: cp.name,
                                latitude: cp.latitude,
                                longitude: cp.longitude,
                                radius: cp.radius || 50,
                                sequence: cp.sequence,
                                stayDuration: cp.stayDuration,
                            },
                        });
                    }
                }

                console.log(`✓ PatrolPlan: ${plan.name} (${plan.checkpoints?.length || 0} checkpoints)`);
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
