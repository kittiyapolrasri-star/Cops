import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ComplianceStatus } from '@prisma/client';

@Injectable()
export class GpsComplianceService {
    constructor(private prisma: PrismaService) { }

    // ==================== GPS LOGGING ====================

    async logPosition(userId: string, data: {
        latitude: number;
        longitude: number;
        accuracy?: number;
        speed?: number;
        heading?: number;
        altitude?: number;
        battery?: number;
        isCharging?: boolean;
    }) {
        return this.prisma.gPSLog.create({
            data: {
                userId,
                ...data,
            },
        });
    }

    async getUserHistory(userId: string, hours: number = 8) {
        const since = new Date();
        since.setHours(since.getHours() - hours);

        return this.prisma.gPSLog.findMany({
            where: {
                userId,
                timestamp: { gte: since },
            },
            orderBy: { timestamp: 'asc' },
        });
    }

    async getLatestPositions(stationId?: string) {
        // Get latest position for each active user
        const users = await this.prisma.user.findMany({
            where: {
                isActive: true,
                ...(stationId && { stationId }),
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                rank: true,
                stationId: true,
            },
        });

        const positions = await Promise.all(
            users.map(async (user) => {
                const latest = await this.prisma.gPSLog.findFirst({
                    where: { userId: user.id },
                    orderBy: { timestamp: 'desc' },
                });
                return { ...user, latestPosition: latest };
            })
        );

        return positions.filter(p => p.latestPosition !== null);
    }

    // ==================== DUTY ZONES ====================

    async createDutyZone(data: {
        name: string;
        description?: string;
        coordinates: any;
        stationId: string;
    }) {
        return this.prisma.dutyZone.create({
            data,
            include: { station: { select: { id: true, name: true } } },
        });
    }

    async getDutyZones(stationId?: string) {
        return this.prisma.dutyZone.findMany({
            where: {
                ...(stationId && { stationId }),
                isActive: true,
            },
            include: { station: { select: { id: true, name: true } } },
        });
    }

    async updateDutyZone(id: string, data: {
        name?: string;
        description?: string;
        coordinates?: any;
        isActive?: boolean;
    }) {
        return this.prisma.dutyZone.update({
            where: { id },
            data,
        });
    }

    async deleteDutyZone(id: string) {
        return this.prisma.dutyZone.delete({ where: { id } });
    }

    // ==================== VIOLATIONS ====================

    async createViolation(userId: string, data: {
        type: ComplianceStatus;
        latitude?: number;
        longitude?: number;
        note?: string;
    }) {
        return this.prisma.complianceViolation.create({
            data: {
                userId,
                ...data,
            },
            include: {
                user: { select: { id: true, firstName: true, lastName: true, rank: true } },
            },
        });
    }

    async endViolation(id: string) {
        const violation = await this.prisma.complianceViolation.findUnique({
            where: { id },
        });

        if (!violation) {
            throw new NotFoundException('ไม่พบการฝ่าฝืน');
        }

        const endedAt = new Date();
        const duration = Math.round((endedAt.getTime() - violation.startedAt.getTime()) / 60000);

        return this.prisma.complianceViolation.update({
            where: { id },
            data: { endedAt, duration },
        });
    }

    async getViolations(filters?: {
        userId?: string;
        stationId?: string;
        type?: ComplianceStatus;
        isAcknowledged?: boolean;
    }) {
        return this.prisma.complianceViolation.findMany({
            where: {
                ...(filters?.userId && { userId: filters.userId }),
                ...(filters?.type && { type: filters.type }),
                ...(filters?.isAcknowledged !== undefined && { isAcknowledged: filters.isAcknowledged }),
                ...(filters?.stationId && { user: { stationId: filters.stationId } }),
            },
            include: {
                user: {
                    select: { id: true, firstName: true, lastName: true, rank: true, station: { select: { id: true, name: true } } },
                },
                acknowledgedBy: {
                    select: { id: true, firstName: true, lastName: true, rank: true },
                },
            },
            orderBy: { startedAt: 'desc' },
            take: 100,
        });
    }

    async acknowledgeViolation(id: string, acknowledgedById: string) {
        return this.prisma.complianceViolation.update({
            where: { id },
            data: {
                isAcknowledged: true,
                acknowledgedById,
                acknowledgedAt: new Date(),
            },
        });
    }

    // ==================== STATS ====================

    async getStats(stationId?: string) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const where = {
            ...(stationId && { user: { stationId } }),
        };

        const [
            totalViolationsToday,
            activeUsers,
            offlineUsers,
            byType,
        ] = await Promise.all([
            this.prisma.complianceViolation.count({
                where: { ...where, startedAt: { gte: today } },
            }),
            this.getActiveUserCount(stationId),
            this.getOfflineUserCount(stationId),
            this.prisma.complianceViolation.groupBy({
                by: ['type'],
                where: { ...where, startedAt: { gte: today } },
                _count: { id: true },
            }),
        ]);

        return {
            totalViolationsToday,
            activeUsers,
            offlineUsers,
            byType: byType.reduce((acc, item) => {
                acc[item.type] = item._count.id;
                return acc;
            }, {} as Record<string, number>),
        };
    }

    private async getActiveUserCount(stationId?: string): Promise<number> {
        const fiveMinutesAgo = new Date();
        fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);

        const activeGpsLogs = await this.prisma.gPSLog.groupBy({
            by: ['userId'],
            where: {
                timestamp: { gte: fiveMinutesAgo },
                ...(stationId && { user: { stationId } }),
            },
        });

        return activeGpsLogs.length;
    }

    private async getOfflineUserCount(stationId?: string): Promise<number> {
        const fiveMinutesAgo = new Date();
        fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);

        const totalUsers = await this.prisma.user.count({
            where: {
                isActive: true,
                role: 'PATROL',
                ...(stationId && { stationId }),
            },
        });

        const activeCount = await this.getActiveUserCount(stationId);

        return totalUsers - activeCount;
    }
}
