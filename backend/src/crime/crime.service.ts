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

    // ==================== CRIME CLOCK (นาฬิกาอาชญากรรม) ====================

    async getCrimeClock(stationId?: string, months: number = 6) {
        const fromDate = new Date();
        fromDate.setMonth(fromDate.getMonth() - months);

        const crimes = await this.prisma.crimeRecord.findMany({
            where: {
                ...(stationId && { stationId }),
                occurredAt: { gte: fromDate },
            },
            select: {
                occurredAt: true,
                type: true,
            },
        });

        // Initialize hourly counts (0-23)
        const hourlyData: { hour: number; count: number; types: Record<string, number> }[] =
            Array.from({ length: 24 }, (_, i) => ({ hour: i, count: 0, types: {} }));

        // Initialize daily counts (0=Sunday, 6=Saturday)
        const dailyData: { day: number; dayName: string; count: number }[] = [
            { day: 0, dayName: 'อา.', count: 0 },
            { day: 1, dayName: 'จ.', count: 0 },
            { day: 2, dayName: 'อ.', count: 0 },
            { day: 3, dayName: 'พ.', count: 0 },
            { day: 4, dayName: 'พฤ.', count: 0 },
            { day: 5, dayName: 'ศ.', count: 0 },
            { day: 6, dayName: 'ส.', count: 0 },
        ];

        // Process crimes
        crimes.forEach((crime) => {
            const date = new Date(crime.occurredAt);
            const hour = date.getHours();
            const day = date.getDay();

            // Update hourly data
            hourlyData[hour].count++;
            hourlyData[hour].types[crime.type] = (hourlyData[hour].types[crime.type] || 0) + 1;

            // Update daily data
            dailyData[day].count++;
        });

        // Find peak hours
        const sortedByHour = [...hourlyData].sort((a, b) => b.count - a.count);
        const peakHours = sortedByHour.slice(0, 3).map(h => h.hour);

        // Find peak days
        const sortedByDay = [...dailyData].sort((a, b) => b.count - a.count);
        const peakDays = sortedByDay.slice(0, 2).map(d => d.dayName);

        // Group hours into time periods
        const timePeriods = [
            { name: 'ดึก', range: '00:00-06:00', hours: [0, 1, 2, 3, 4, 5], count: 0 },
            { name: 'เช้า', range: '06:00-12:00', hours: [6, 7, 8, 9, 10, 11], count: 0 },
            { name: 'บ่าย', range: '12:00-18:00', hours: [12, 13, 14, 15, 16, 17], count: 0 },
            { name: 'ค่ำ', range: '18:00-24:00', hours: [18, 19, 20, 21, 22, 23], count: 0 },
        ];

        timePeriods.forEach(period => {
            period.count = period.hours.reduce((sum, h) => sum + hourlyData[h].count, 0);
        });

        return {
            hourly: hourlyData,
            daily: dailyData,
            timePeriods,
            peakHours,
            peakDays,
            total: crimes.length,
            periodMonths: months,
        };
    }

    // ==================== NEARBY STATIONS (Buffer Zone) ====================

    async getNearbyStations(latitude: number, longitude: number, radiusKm: number = 10) {
        // Haversine approximation for nearby stations
        const latDelta = radiusKm / 111; // 1 degree ≈ 111km
        const lngDelta = radiusKm / (111 * Math.cos(latitude * Math.PI / 180));

        const stations = await this.prisma.station.findMany({
            where: {
                latitude: {
                    gte: latitude - latDelta,
                    lte: latitude + latDelta,
                },
                longitude: {
                    gte: longitude - lngDelta,
                    lte: longitude + lngDelta,
                },
            },
            include: {
                province: { select: { name: true } },
            },
        });

        // Calculate actual distance and filter
        return stations
            .map(s => {
                const R = 6371;
                const dLat = (s.latitude! - latitude) * Math.PI / 180;
                const dLng = (s.longitude! - longitude) * Math.PI / 180;
                const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                    Math.cos(latitude * Math.PI / 180) * Math.cos(s.latitude! * Math.PI / 180) *
                    Math.sin(dLng / 2) * Math.sin(dLng / 2);
                const distance = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                return { ...s, distanceKm: Math.round(distance * 10) / 10 };
            })
            .filter(s => s.distanceKm <= radiusKm)
            .sort((a, b) => a.distanceKm - b.distanceKm);
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
