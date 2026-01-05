import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTipDto } from './dto/create-tip.dto';
import { UpdateTipDto } from './dto/update-tip.dto';
import { TipStatus, TipCategory } from '@prisma/client';

@Injectable()
export class CitizenTipService {
    constructor(private prisma: PrismaService) { }

    // ==================== PUBLIC (NO AUTH) ====================

    async createPublic(createDto: CreateTipDto) {
        // Auto-assign to nearest station if location provided
        let stationId = createDto.stationId;

        if (!stationId && createDto.latitude && createDto.longitude) {
            const nearestStation = await this.findNearestStation(
                createDto.latitude,
                createDto.longitude
            );
            stationId = nearestStation?.id;
        }

        const tip = await this.prisma.citizenTip.create({
            data: {
                ...createDto,
                stationId,
            },
        });

        return {
            tipCode: tip.tipCode,
            message: 'ส่งเบาะแสสำเร็จ กรุณาบันทึกรหัสนี้เพื่อติดตามสถานะ',
        };
    }

    async trackByCode(tipCode: string) {
        const tip = await this.prisma.citizenTip.findUnique({
            where: { tipCode },
            select: {
                tipCode: true,
                category: true,
                status: true,
                createdAt: true,
                actionNote: true,
                actionTakenAt: true,
            },
        });

        if (!tip) {
            throw new NotFoundException('ไม่พบเบาะแสนี้');
        }

        return tip;
    }

    // ==================== ADMIN (WITH AUTH) ====================

    async findAll(filters?: {
        stationId?: string;
        status?: TipStatus;
        category?: TipCategory;
        priority?: number;
    }) {
        return this.prisma.citizenTip.findMany({
            where: {
                ...(filters?.stationId && { stationId: filters.stationId }),
                ...(filters?.status && { status: filters.status }),
                ...(filters?.category && { category: filters.category }),
                ...(filters?.priority !== undefined && { priority: filters.priority }),
            },
            include: {
                station: { select: { id: true, name: true } },
                assignedTo: {
                    select: { id: true, firstName: true, lastName: true, rank: true },
                },
            },
            orderBy: [
                { priority: 'desc' },
                { createdAt: 'desc' },
            ],
        });
    }

    async findById(id: string) {
        const tip = await this.prisma.citizenTip.findUnique({
            where: { id },
            include: {
                station: { include: { province: true } },
                assignedTo: {
                    select: { id: true, firstName: true, lastName: true, rank: true, phone: true },
                },
            },
        });

        if (!tip) {
            throw new NotFoundException('ไม่พบเบาะแส');
        }

        return tip;
    }

    async update(id: string, updateDto: UpdateTipDto) {
        await this.findById(id);

        return this.prisma.citizenTip.update({
            where: { id },
            data: updateDto,
            include: {
                station: true,
                assignedTo: {
                    select: { id: true, firstName: true, lastName: true, rank: true },
                },
            },
        });
    }

    async updateStatus(id: string, status: TipStatus, actionNote?: string) {
        await this.findById(id);

        const now = new Date();
        return this.prisma.citizenTip.update({
            where: { id },
            data: {
                status,
                actionNote,
                ...(status === TipStatus.VERIFIED && { verifiedAt: now }),
                ...(status === TipStatus.RESOLVED && { actionTakenAt: now }),
            },
        });
    }

    async assignTo(id: string, userId: string) {
        await this.findById(id);

        return this.prisma.citizenTip.update({
            where: { id },
            data: {
                assignedToId: userId,
                status: TipStatus.INVESTIGATING,
            },
            include: {
                assignedTo: {
                    select: { id: true, firstName: true, lastName: true, rank: true },
                },
            },
        });
    }

    async delete(id: string) {
        await this.findById(id);
        return this.prisma.citizenTip.delete({ where: { id } });
    }

    // ==================== STATISTICS ====================

    async getStats(stationId?: string) {
        const where = stationId ? { stationId } : {};

        const [total, byStatus, byCategory, pending, urgent] = await Promise.all([
            this.prisma.citizenTip.count({ where }),
            this.prisma.citizenTip.groupBy({
                by: ['status'],
                where,
                _count: { id: true },
            }),
            this.prisma.citizenTip.groupBy({
                by: ['category'],
                where,
                _count: { id: true },
            }),
            this.prisma.citizenTip.count({
                where: { ...where, status: TipStatus.PENDING },
            }),
            this.prisma.citizenTip.count({
                where: { ...where, priority: 2 },
            }),
        ]);

        return {
            total,
            pending,
            urgent,
            byStatus: byStatus.reduce((acc, item) => {
                acc[item.status] = item._count.id;
                return acc;
            }, {} as Record<string, number>),
            byCategory: byCategory.reduce((acc, item) => {
                acc[item.category] = item._count.id;
                return acc;
            }, {} as Record<string, number>),
        };
    }

    // ==================== HELPER ====================

    private async findNearestStation(lat: number, lng: number) {
        // Simple bounding box for nearby stations
        const stations = await this.prisma.station.findMany({
            where: {
                latitude: { not: null },
                longitude: { not: null },
            },
            select: {
                id: true,
                name: true,
                latitude: true,
                longitude: true,
            },
        });

        if (stations.length === 0) return null;

        // Calculate distance and find nearest
        let nearest = stations[0];
        let minDistance = this.calculateDistance(lat, lng, nearest.latitude!, nearest.longitude!);

        for (const station of stations) {
            const distance = this.calculateDistance(lat, lng, station.latitude!, station.longitude!);
            if (distance < minDistance) {
                minDistance = distance;
                nearest = station;
            }
        }

        return nearest;
    }

    private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
        const R = 6371;
        const dLat = this.toRad(lat2 - lat1);
        const dLng = this.toRad(lng2 - lng1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    private toRad(deg: number): number {
        return deg * (Math.PI / 180);
    }
}
