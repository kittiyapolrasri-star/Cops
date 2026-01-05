import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSOSDto } from './dto/create-sos.dto';
import { SOSStatus, SOSType } from '@prisma/client';

@Injectable()
export class SosService {
    constructor(private prisma: PrismaService) { }

    // ==================== CREATE ALERT ====================

    async create(createDto: CreateSOSDto, userId: string) {
        // Auto-assign to user's station or find nearest
        let stationId = createDto.stationId;

        if (!stationId) {
            const user = await this.prisma.user.findUnique({
                where: { id: userId },
                select: { stationId: true },
            });
            stationId = user?.stationId || undefined;
        }

        const alert = await this.prisma.sOSAlert.create({
            data: {
                ...createDto,
                userId,
                stationId,
            },
            include: {
                user: {
                    select: { id: true, firstName: true, lastName: true, rank: true, phone: true },
                },
                station: { select: { id: true, name: true } },
            },
        });

        // TODO: Send real-time notification to station/nearby officers

        return alert;
    }

    // ==================== FIND ALERTS ====================

    async findAll(filters?: {
        stationId?: string;
        status?: SOSStatus;
        type?: SOSType;
        userId?: string;
    }) {
        return this.prisma.sOSAlert.findMany({
            where: {
                ...(filters?.stationId && { stationId: filters.stationId }),
                ...(filters?.status && { status: filters.status }),
                ...(filters?.type && { type: filters.type }),
                ...(filters?.userId && { userId: filters.userId }),
            },
            include: {
                user: {
                    select: { id: true, firstName: true, lastName: true, rank: true, phone: true },
                },
                station: { select: { id: true, name: true } },
                respondedBy: {
                    select: { id: true, firstName: true, lastName: true, rank: true },
                },
                responses: {
                    include: {
                        user: { select: { id: true, firstName: true, lastName: true, rank: true } },
                    },
                    orderBy: { createdAt: 'desc' },
                    take: 5,
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findActive(stationId?: string) {
        return this.prisma.sOSAlert.findMany({
            where: {
                status: { in: [SOSStatus.ACTIVE, SOSStatus.RESPONDING] },
                ...(stationId && { stationId }),
            },
            include: {
                user: {
                    select: { id: true, firstName: true, lastName: true, rank: true, phone: true },
                },
                station: { select: { id: true, name: true } },
                responses: {
                    include: {
                        user: { select: { id: true, firstName: true, lastName: true, rank: true } },
                    },
                    orderBy: { createdAt: 'desc' },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findById(id: string) {
        const alert = await this.prisma.sOSAlert.findUnique({
            where: { id },
            include: {
                user: {
                    select: { id: true, firstName: true, lastName: true, rank: true, phone: true },
                },
                station: { include: { province: true } },
                respondedBy: {
                    select: { id: true, firstName: true, lastName: true, rank: true, phone: true },
                },
                responses: {
                    include: {
                        user: { select: { id: true, firstName: true, lastName: true, rank: true, phone: true } },
                    },
                    orderBy: { createdAt: 'asc' },
                },
            },
        });

        if (!alert) {
            throw new NotFoundException('ไม่พบ SOS Alert');
        }

        return alert;
    }

    // ==================== RESPOND TO ALERT ====================

    async respond(alertId: string, userId: string, data: { message?: string; latitude?: number; longitude?: number; eta?: number }) {
        const alert = await this.findById(alertId);

        if (alert.status === SOSStatus.RESOLVED || alert.status === SOSStatus.CANCELLED) {
            throw new BadRequestException('Alert นี้ปิดไปแล้ว');
        }

        // Create response
        const response = await this.prisma.sOSResponse.create({
            data: {
                alertId,
                userId,
                ...data,
            },
            include: {
                user: { select: { id: true, firstName: true, lastName: true, rank: true } },
            },
        });

        // Update alert status if first response
        if (alert.status === SOSStatus.ACTIVE) {
            await this.prisma.sOSAlert.update({
                where: { id: alertId },
                data: {
                    status: SOSStatus.RESPONDING,
                    respondedById: userId,
                    respondedAt: new Date(),
                },
            });
        }

        return response;
    }

    // ==================== RESOLVE/CANCEL ====================

    async resolve(id: string, resolutionNote?: string) {
        await this.findById(id);

        return this.prisma.sOSAlert.update({
            where: { id },
            data: {
                status: SOSStatus.RESOLVED,
                resolvedAt: new Date(),
                resolutionNote,
            },
        });
    }

    async markFalseAlarm(id: string, note?: string) {
        await this.findById(id);

        return this.prisma.sOSAlert.update({
            where: { id },
            data: {
                status: SOSStatus.FALSE_ALARM,
                resolvedAt: new Date(),
                resolutionNote: note || 'แจ้งเหตุผิดพลาด',
            },
        });
    }

    async cancel(id: string, userId: string) {
        const alert = await this.findById(id);

        // Only alert owner or admin can cancel
        if (alert.userId !== userId) {
            throw new BadRequestException('ไม่สามารถยกเลิก SOS ของผู้อื่นได้');
        }

        return this.prisma.sOSAlert.update({
            where: { id },
            data: {
                status: SOSStatus.CANCELLED,
                resolvedAt: new Date(),
            },
        });
    }

    // ==================== STATS ====================

    async getStats(stationId?: string) {
        const where = stationId ? { stationId } : {};

        const [total, active, resolved, byType, avgResponseTime] = await Promise.all([
            this.prisma.sOSAlert.count({ where }),
            this.prisma.sOSAlert.count({
                where: { ...where, status: { in: [SOSStatus.ACTIVE, SOSStatus.RESPONDING] } },
            }),
            this.prisma.sOSAlert.count({
                where: { ...where, status: SOSStatus.RESOLVED },
            }),
            this.prisma.sOSAlert.groupBy({
                by: ['type'],
                where,
                _count: { id: true },
            }),
            this.calculateAvgResponseTime(stationId),
        ]);

        return {
            total,
            active,
            resolved,
            avgResponseTimeMinutes: avgResponseTime,
            byType: byType.reduce((acc, item) => {
                acc[item.type] = item._count.id;
                return acc;
            }, {} as Record<string, number>),
        };
    }

    private async calculateAvgResponseTime(stationId?: string): Promise<number> {
        const alerts = await this.prisma.sOSAlert.findMany({
            where: {
                ...(stationId && { stationId }),
                respondedAt: { not: null },
            },
            select: {
                createdAt: true,
                respondedAt: true,
            },
            take: 100,
            orderBy: { createdAt: 'desc' },
        });

        if (alerts.length === 0) return 0;

        const totalMinutes = alerts.reduce((sum, alert) => {
            const diffMs = new Date(alert.respondedAt!).getTime() - new Date(alert.createdAt).getTime();
            return sum + diffMs / 60000;
        }, 0);

        return Math.round(totalMinutes / alerts.length);
    }
}
