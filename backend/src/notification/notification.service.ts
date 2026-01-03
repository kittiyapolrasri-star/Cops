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

    async findAll(userId?: string, stationId?: string, limit: number = 50) {
        return this.prisma.notification.findMany({
            where: {
                OR: [
                    { userId },
                    { stationId },
                    { userId: null, stationId: null }, // Broadcast notifications
                ],
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
        return this.prisma.notification.updateMany({
            where: {
                OR: [
                    { userId },
                    { stationId },
                    { userId: null, stationId: null },
                ],
                isRead: false,
            },
            data: { isRead: true },
        });
    }

    async getUnreadCount(userId?: string, stationId?: string) {
        return this.prisma.notification.count({
            where: {
                OR: [
                    { userId },
                    { stationId },
                    { userId: null, stationId: null },
                ],
                isRead: false,
            },
        });
    }
}
