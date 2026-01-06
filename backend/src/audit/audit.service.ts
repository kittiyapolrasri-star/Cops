import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditAction } from '@prisma/client';

interface AuditLogInput {
    action: AuditAction;
    entity: string;
    entityId?: string;
    userId?: string;
    userName?: string;
    ipAddress?: string;
    userAgent?: string;
    details?: any;
}

@Injectable()
export class AuditService {
    constructor(private prisma: PrismaService) { }

    // Create audit log entry
    async log(input: AuditLogInput) {
        return this.prisma.auditLog.create({
            data: {
                action: input.action,
                entity: input.entity,
                entityId: input.entityId,
                userId: input.userId,
                userName: input.userName,
                ipAddress: input.ipAddress,
                userAgent: input.userAgent,
                details: input.details,
            },
        });
    }

    // Get recent logs
    async getRecent(limit: number = 50) {
        return this.prisma.auditLog.findMany({
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
    }

    // Get logs by user
    async getByUser(userId: string, limit: number = 50) {
        return this.prisma.auditLog.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
    }

    // Get logs by entity
    async getByEntity(entity: string, entityId?: string, limit: number = 50) {
        return this.prisma.auditLog.findMany({
            where: {
                entity,
                ...(entityId && { entityId }),
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
    }

    // Get logs with filters
    async findAll(filters?: {
        userId?: string;
        action?: AuditAction;
        entity?: string;
        fromDate?: Date;
        toDate?: Date;
        limit?: number;
    }) {
        const limit = filters?.limit || 100;

        return this.prisma.auditLog.findMany({
            where: {
                ...(filters?.userId && { userId: filters.userId }),
                ...(filters?.action && { action: filters.action }),
                ...(filters?.entity && { entity: filters.entity }),
                ...(filters?.fromDate && {
                    createdAt: { gte: filters.fromDate },
                }),
                ...(filters?.toDate && {
                    createdAt: { lte: filters.toDate },
                }),
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
    }

    // Get statistics
    async getStats(days: number = 7) {
        const fromDate = new Date();
        fromDate.setDate(fromDate.getDate() - days);

        const [total, byAction, byEntity] = await Promise.all([
            this.prisma.auditLog.count({
                where: { createdAt: { gte: fromDate } },
            }),
            this.prisma.auditLog.groupBy({
                by: ['action'],
                where: { createdAt: { gte: fromDate } },
                _count: { id: true },
            }),
            this.prisma.auditLog.groupBy({
                by: ['entity'],
                where: { createdAt: { gte: fromDate } },
                _count: { id: true },
            }),
        ]);

        return {
            total,
            byAction: byAction.reduce((acc, item) => {
                acc[item.action] = item._count.id;
                return acc;
            }, {} as Record<string, number>),
            byEntity: byEntity.reduce((acc, item) => {
                acc[item.entity] = item._count.id;
                return acc;
            }, {} as Record<string, number>),
        };
    }
}
