import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCrimeDto } from './dto/create-crime.dto';
import { UpdateCrimeDto } from './dto/update-crime.dto';
import { CrimeType, CrimeSource } from '@prisma/client';

@Injectable()
export class CrimeService {
    constructor(private prisma: PrismaService) { }

    async create(createDto: CreateCrimeDto, userId?: string) {
        return this.prisma.crimeRecord.create({
            data: {
                ...createDto,
                occurredAt: new Date(createDto.occurredAt),
                reportedById: userId,
            },
            include: {
                station: { select: { id: true, name: true } },
                reportedBy: {
                    select: { id: true, firstName: true, lastName: true, rank: true },
                },
            },
        });
    }

    async findAll(filters?: {
        stationId?: string;
        type?: CrimeType;
        source?: CrimeSource;
        fromDate?: Date;
        toDate?: Date;
        isResolved?: boolean;
    }) {
        return this.prisma.crimeRecord.findMany({
            where: {
                ...(filters?.stationId && { stationId: filters.stationId }),
                ...(filters?.type && { type: filters.type }),
                ...(filters?.source && { source: filters.source }),
                ...(filters?.isResolved !== undefined && { isResolved: filters.isResolved }),
                ...(filters?.fromDate && {
                    occurredAt: { gte: filters.fromDate },
                }),
                ...(filters?.toDate && {
                    occurredAt: { lte: filters.toDate },
                }),
            },
            include: {
                station: { select: { id: true, name: true } },
                reportedBy: {
                    select: { id: true, firstName: true, lastName: true, rank: true },
                },
            },
            orderBy: { occurredAt: 'desc' },
            take: 500, // Limit for performance
        });
    }

    async findById(id: string) {
        const record = await this.prisma.crimeRecord.findUnique({
            where: { id },
            include: {
                station: { include: { province: true } },
                reportedBy: {
                    select: { id: true, firstName: true, lastName: true, rank: true },
                },
            },
        });

        if (!record) {
            throw new NotFoundException('ไม่พบข้อมูลอาชญากรรม');
        }

        return record;
    }

    async update(id: string, updateDto: UpdateCrimeDto) {
        await this.findById(id);

        return this.prisma.crimeRecord.update({
            where: { id },
            data: {
                ...updateDto,
                occurredAt: updateDto.occurredAt ? new Date(updateDto.occurredAt) : undefined,
            },
            include: {
                station: true,
                reportedBy: {
                    select: { id: true, firstName: true, lastName: true, rank: true },
                },
            },
        });
    }

    async delete(id: string) {
        await this.findById(id);
        return this.prisma.crimeRecord.delete({ where: { id } });
    }

    async resolve(id: string) {
        await this.findById(id);
        return this.prisma.crimeRecord.update({
            where: { id },
            data: {
                isResolved: true,
                resolvedAt: new Date(),
            },
        });
    }

    // ==================== HEAT MAP DATA ====================

    async getHeatmapData(filters?: {
        stationId?: string;
        type?: CrimeType;
        months?: number;
    }) {
        const fromDate = new Date();
        fromDate.setMonth(fromDate.getMonth() - (filters?.months || 3));

        const crimes = await this.prisma.crimeRecord.findMany({
            where: {
                ...(filters?.stationId && { stationId: filters.stationId }),
                ...(filters?.type && { type: filters.type }),
                occurredAt: { gte: fromDate },
            },
            select: {
                latitude: true,
                longitude: true,
                type: true,
            },
        });

        // Format for heat map: [[lat, lng, intensity], ...]
        return crimes.map(c => [c.latitude, c.longitude, 1]);
    }

    async getClusterData(filters?: {
        stationId?: string;
        type?: CrimeType;
        months?: number;
    }) {
        const fromDate = new Date();
        fromDate.setMonth(fromDate.getMonth() - (filters?.months || 3));

        return this.prisma.crimeRecord.findMany({
            where: {
                ...(filters?.stationId && { stationId: filters.stationId }),
                ...(filters?.type && { type: filters.type }),
                occurredAt: { gte: fromDate },
            },
            select: {
                id: true,
                latitude: true,
                longitude: true,
                type: true,
                occurredAt: true,
                address: true,
                description: true,
                isResolved: true,
            },
        });
    }

    // ==================== STATISTICS ====================

    async getStats(stationId?: string, months: number = 3) {
        const fromDate = new Date();
        fromDate.setMonth(fromDate.getMonth() - months);

        const where = {
            ...(stationId && { stationId }),
            occurredAt: { gte: fromDate },
        };

        const [total, resolved, byType, bySource, byMonth] = await Promise.all([
            this.prisma.crimeRecord.count({ where }),
            this.prisma.crimeRecord.count({ where: { ...where, isResolved: true } }),
            this.prisma.crimeRecord.groupBy({
                by: ['type'],
                where,
                _count: { id: true },
            }),
            this.prisma.crimeRecord.groupBy({
                by: ['source'],
                where,
                _count: { id: true },
            }),
            this.getMonthlyStats(stationId, months),
        ]);

        return {
            total,
            resolved,
            unresolved: total - resolved,
            resolutionRate: total > 0 ? Math.round((resolved / total) * 100) : 0,
            byType: byType.reduce((acc, item) => {
                acc[item.type] = item._count.id;
                return acc;
            }, {} as Record<string, number>),
            bySource: bySource.reduce((acc, item) => {
                acc[item.source] = item._count.id;
                return acc;
            }, {} as Record<string, number>),
            byMonth,
        };
    }

    private async getMonthlyStats(stationId?: string, months: number = 6) {
        const result: { month: string; count: number }[] = [];

        for (let i = 0; i < months; i++) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
            const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);

            const count = await this.prisma.crimeRecord.count({
                where: {
                    ...(stationId && { stationId }),
                    occurredAt: {
                        gte: startOfMonth,
                        lte: endOfMonth,
                    },
                },
            });

            result.push({
                month: startOfMonth.toLocaleDateString('th-TH', { month: 'short', year: '2-digit' }),
                count,
            });
        }

        return result.reverse();
    }

    // ==================== IMPORT ====================

    async bulkCreate(records: CreateCrimeDto[], userId?: string) {
        const created = await this.prisma.crimeRecord.createMany({
            data: records.map(r => ({
                ...r,
                occurredAt: new Date(r.occurredAt),
                reportedById: userId,
            })),
            skipDuplicates: true,
        });

        return { imported: created.count };
    }
}
