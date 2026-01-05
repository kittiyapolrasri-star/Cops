import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationGateway } from './notification.gateway';

interface CreateAlertDto {
    title: string;
    message: string;
    type: string;
    data?: any;
    userId?: string;
    stationId?: string;
}

@Injectable()
export class NotificationService {
    constructor(
        private prisma: PrismaService,
        private notificationGateway: NotificationGateway,
    ) { }

    async createAlert(dto: CreateAlertDto) {
        const notification = await this.prisma.notification.create({
            data: {
                title: dto.title,
                message: dto.message,
                type: dto.type,
                data: dto.data,
                userId: dto.userId,
                stationId: dto.stationId,
            },
        });

        // Broadcast via WebSocket
        this.notificationGateway.broadcastNotification(notification);

        return notification;
    }

    // Helper to build OR conditions for notification queries
    private buildNotificationConditions(userId?: string, stationId?: string) {
        const conditions: any[] = [];

        // Add user-specific notifications if userId is provided
        if (userId) {
            conditions.push({ userId });
        }

        // Add station-specific notifications if stationId is provided
        if (stationId) {
            conditions.push({ stationId });
        }

        // Always include broadcast notifications (where both userId and stationId are null)
        conditions.push({ userId: null, stationId: null });

        return conditions;
    }

    async findAll(userId?: string, stationId?: string, limit: number = 50) {
        const conditions = this.buildNotificationConditions(userId, stationId);

        return this.prisma.notification.findMany({
            where: {
                OR: conditions,
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
    }

    async markAsRead(id: string) {
        return this.prisma.notification.update({
            where: { id },
            data: { isRead: true },
        });
    }

    async markAllAsRead(userId: string, stationId?: string) {
        const conditions = this.buildNotificationConditions(userId, stationId);

        return this.prisma.notification.updateMany({
            where: {
                OR: conditions,
                isRead: false,
            },
            data: { isRead: true },
        });
    }

    async getUnreadCount(userId?: string, stationId?: string) {
        const conditions = this.buildNotificationConditions(userId, stationId);

        const count = await this.prisma.notification.count({
            where: {
                OR: conditions,
                isRead: false,
            },
        });

        return { count };
    }
}

