import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePoiDto } from './dto/create-poi.dto';
import { UpdatePoiDto } from './dto/update-poi.dto';
import { POICategory, POIPriority } from '@prisma/client';

@Injectable()
export class PoiService {
    constructor(private prisma: PrismaService) { }

    async create(createPoiDto: CreatePoiDto, userId: string) {
        return this.prisma.pointOfInterest.create({
            data: {
                ...createPoiDto,
                createdById: userId,
            },
            include: {
                station: true,
                createdBy: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        rank: true,
                    },
                },
            },
        });
    }

    async findAll(filters?: {
        stationId?: string;
        category?: POICategory;
        priority?: POIPriority;
        isActive?: boolean;
    }) {
        return this.prisma.pointOfInterest.findMany({
            where: {
                ...(filters?.stationId && { stationId: filters.stationId }),
                ...(filters?.category && { category: filters.category }),
                ...(filters?.priority && { priority: filters.priority }),
                isActive: filters?.isActive ?? true,
            },
            include: {
                station: {
                    select: {
                        id: true,
                        name: true,
                        province: {
                            select: { id: true, name: true },
                        },
                    },
                },
                createdBy: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        rank: true,
                    },
                },
            },
            orderBy: [
                { priority: 'desc' },
                { createdAt: 'desc' },
            ],
        });
    }

    async findById(id: string) {
        const poi = await this.prisma.pointOfInterest.findUnique({
            where: { id },
            include: {
                station: {
                    include: {
                        province: true,
                    },
                },
                createdBy: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        rank: true,
                    },
                },
            },
        });

        if (!poi) {
            throw new NotFoundException('ไม่พบสถานที่สำคัญ');
        }

        return poi;
    }

    async update(id: string, updatePoiDto: UpdatePoiDto) {
        await this.findById(id);

        return this.prisma.pointOfInterest.update({
            where: { id },
            data: updatePoiDto,
            include: {
                station: true,
                createdBy: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        rank: true,
                    },
                },
            },
        });
    }

    async delete(id: string) {
        await this.findById(id);

        return this.prisma.pointOfInterest.update({
            where: { id },
            data: { isActive: false },
        });
    }

    async findNearby(lat: number, lng: number, radiusKm: number = 5, category?: POICategory) {
        // Simple bounding box calculation for nearby POIs
        // 1 degree latitude ≈ 111km
        const latDelta = radiusKm / 111;
        const lngDelta = radiusKm / (111 * Math.cos(lat * Math.PI / 180));

        const pois = await this.prisma.pointOfInterest.findMany({
            where: {
                latitude: {
                    gte: lat - latDelta,
                    lte: lat + latDelta,
                },
                longitude: {
                    gte: lng - lngDelta,
                    lte: lng + lngDelta,
                },
                isActive: true,
                ...(category && { category }),
            },
            include: {
                station: {
                    select: { id: true, name: true },
                },
            },
            orderBy: { priority: 'desc' },
        });

        // Calculate actual distance and filter
        return pois.map(poi => {
            const distance = this.calculateDistance(lat, lng, poi.latitude, poi.longitude);
            return { ...poi, distance };
        }).filter(poi => poi.distance <= radiusKm)
            .sort((a, b) => a.distance - b.distance);
    }

    async getStats(stationId?: string) {
        const where = stationId ? { stationId, isActive: true } : { isActive: true };

        const [total, byCategory, byPriority] = await Promise.all([
            this.prisma.pointOfInterest.count({ where }),
            this.prisma.pointOfInterest.groupBy({
                by: ['category'],
                where,
                _count: { id: true },
            }),
            this.prisma.pointOfInterest.groupBy({
                by: ['priority'],
                where,
                _count: { id: true },
            }),
        ]);

        return {
            total,
            byCategory: byCategory.reduce((acc, item) => {
                acc[item.category] = item._count.id;
                return acc;
            }, {} as Record<string, number>),
            byPriority: byPriority.reduce((acc, item) => {
                acc[item.priority] = item._count.id;
                return acc;
            }, {} as Record<string, number>),
        };
    }

    // Haversine formula to calculate distance between two points
    private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
        const R = 6371; // Earth's radius in km
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
