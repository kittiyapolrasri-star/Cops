import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateLocationDto } from './dto/update-location.dto';

@Injectable()
export class TrackingService {
    constructor(private prisma: PrismaService) { }

    // Start a new patrol route
    async startPatrol(userId: string) {
        // End any active patrol first
        await this.prisma.patrolRoute.updateMany({
            where: { userId, isActive: true },
            data: { isActive: false, endedAt: new Date() },
        });

        return this.prisma.patrolRoute.create({
            data: {
                userId,
                isActive: true,
            },
            include: { user: { select: { firstName: true, lastName: true, rank: true } } },
        });
    }

    // End current patrol
    async endPatrol(userId: string) {
        const route = await this.prisma.patrolRoute.findFirst({
            where: { userId, isActive: true },
        });

        if (!route) {
            throw new NotFoundException('ไม่พบการลาดตระเวนที่กำลังดำเนินการ');
        }

        return this.prisma.patrolRoute.update({
            where: { id: route.id },
            data: { isActive: false, endedAt: new Date() },
        });
    }

    // Update location (breadcrumb)
    async updateLocation(userId: string, locationDto: UpdateLocationDto) {
        let route = await this.prisma.patrolRoute.findFirst({
            where: { userId, isActive: true },
        });

        // Auto-start patrol if not active
        if (!route) {
            route = await this.prisma.patrolRoute.create({
                data: { userId, isActive: true },
            });
        }

        return this.prisma.patrolLocation.create({
            data: {
                patrolRouteId: route.id,
                latitude: locationDto.latitude,
                longitude: locationDto.longitude,
                accuracy: locationDto.accuracy,
                speed: locationDto.speed,
                heading: locationDto.heading,
            },
        });
    }

    // Get active patrols (for dashboard)
    async getActivePatrols(stationId?: string) {
        return this.prisma.patrolRoute.findMany({
            where: {
                isActive: true,
                ...(stationId && { user: { stationId } }),
            },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        rank: true,
                        avatar: true,
                        station: true,
                    },
                },
                locations: {
                    orderBy: { timestamp: 'desc' },
                    take: 1,
                },
            },
        });
    }

    // Get latest locations for all active patrols
    async getLatestLocations(stationId?: string) {
        const patrols = await this.getActivePatrols(stationId);

        return patrols.map(patrol => ({
            userId: patrol.user.id,
            user: patrol.user,
            patrolRouteId: patrol.id,
            location: patrol.locations[0] || null,
            startedAt: patrol.startedAt,
        }));
    }

    // Get patrol history
    async getPatrolHistory(userId: string, date?: Date) {
        const startOfDay = date || new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(startOfDay);
        endOfDay.setHours(23, 59, 59, 999);

        return this.prisma.patrolRoute.findMany({
            where: {
                userId,
                startedAt: {
                    gte: startOfDay,
                    lte: endOfDay,
                },
            },
            include: {
                locations: {
                    orderBy: { timestamp: 'asc' },
                },
            },
            orderBy: { startedAt: 'desc' },
        });
    }

    // Get route details with all locations
    async getRouteDetails(routeId: string) {
        return this.prisma.patrolRoute.findUnique({
            where: { id: routeId },
            include: {
                user: { select: { firstName: true, lastName: true, rank: true } },
                locations: { orderBy: { timestamp: 'asc' } },
            },
        });
    }

    // Get historical patrols (last 24 hours) for Time Mode
    async getHistoricalPatrols(stationId?: string, hours: number = 24) {
        const since = new Date();
        since.setHours(since.getHours() - hours);

        return this.prisma.patrolRoute.findMany({
            where: {
                startedAt: { gte: since },
                ...(stationId && { user: { stationId } }),
            },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        rank: true,
                        avatar: true,
                        stationId: true,
                        station: { select: { name: true, provinceId: true } },
                    },
                },
                locations: {
                    orderBy: { timestamp: 'desc' },
                    take: 50, // Last 50 locations per patrol
                },
            },
            orderBy: { startedAt: 'desc' },
        });
    }
}
