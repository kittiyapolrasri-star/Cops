import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { NotificationService } from '../notification/notification.service';
import { IncidentType } from '@prisma/client';

@Injectable()
export class IncidentService {
    constructor(
        private prisma: PrismaService,
        private notificationService: NotificationService,
    ) { }

    async create(userId: string, createIncidentDto: CreateIncidentDto) {
        const { items, ...incidentData } = createIncidentDto;

        const incident = await this.prisma.incident.create({
            data: {
                ...incidentData,
                userId,
                items: {
                    create: items || [],
                },
            },
            include: {
                user: { select: { firstName: true, lastName: true, rank: true, avatar: true, station: true } },
                items: true,
            },
        });

        // Send notification for Suppression incidents (important arrests)
        if (incident.type === IncidentType.SUPPRESSION) {
            const hasWeapons = items?.some(item => item.category === 'WEAPONS');
            const hasDrugs = items?.some(item => item.category === 'DRUGS');

            if (hasWeapons || hasDrugs) {
                await this.notificationService.createAlert({
                    title: hasWeapons ? '🔫 พบอาวุธ!' : '💊 พบยาเสพติด!',
                    message: `${incident.user.rank} ${incident.user.firstName} ${incident.user.lastName} รายงานการตรวจยึดของกลาง`,
                    type: 'incident',
                    data: { incidentId: incident.id },
                    stationId: incident.user.station?.id,
                });
            }
        }

        return incident;
    }

    async findAll(stationId?: string, type?: IncidentType, limit: number = 50) {
        return this.prisma.incident.findMany({
            where: {
                ...(type && { type }),
                ...(stationId && { user: { stationId } }),
            },
            include: {
                user: { select: { firstName: true, lastName: true, rank: true, avatar: true, station: true } },
                items: true,
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
    }

    async findById(id: string) {
        const incident = await this.prisma.incident.findUnique({
            where: { id },
            include: {
                user: { select: { firstName: true, lastName: true, rank: true, avatar: true, station: true } },
                items: true,
            },
        });

        if (!incident) {
            throw new NotFoundException('ไม่พบรายงานเหตุการณ์');
        }

        return incident;
    }

    async findByUser(userId: string, date?: Date) {
        const startOfDay = date || new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(startOfDay);
        endOfDay.setHours(23, 59, 59, 999);

        return this.prisma.incident.findMany({
            where: {
                userId,
                createdAt: {
                    gte: startOfDay,
                    lte: endOfDay,
                },
            },
            include: {
                items: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async resolve(id: string) {
        const incident = await this.findById(id);

        return this.prisma.incident.update({
            where: { id },
            data: { isResolved: true, resolvedAt: new Date() },
        });
    }

    // Get statistics
    async getStats(stationId?: string, startDate?: Date, endDate?: Date) {
        const start = startDate || new Date(new Date().setDate(new Date().getDate() - 30));
        const end = endDate || new Date();

        const incidents = await this.prisma.incident.findMany({
            where: {
                createdAt: { gte: start, lte: end },
                ...(stationId && { user: { stationId } }),
            },
            include: { items: true },
        });

        const preventionCount = incidents.filter(i => i.type === 'PREVENTION').length;
        const suppressionCount = incidents.filter(i => i.type === 'SUPPRESSION').length;

        const itemStats = {
            TRAFFIC: 0,
            DRUGS: 0,
            WEAPONS: 0,
            OTHERS: 0,
        };

        incidents.forEach(incident => {
            incident.items.forEach(item => {
                itemStats[item.category]++;
            });
        });

        return {
            total: incidents.length,
            prevention: preventionCount,
            suppression: suppressionCount,
            items: itemStats,
        };
    }

    // Get feed for dashboard
    async getFeed(stationId?: string, limit: number = 20) {
        return this.prisma.incident.findMany({
            where: {
                ...(stationId && { user: { stationId } }),
            },
            include: {
                user: { select: { firstName: true, lastName: true, rank: true, avatar: true, station: true } },
                items: true,
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
    }
}
