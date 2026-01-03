import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCheckInDto } from './dto/create-checkin.dto';

@Injectable()
export class CheckinService {
    constructor(private prisma: PrismaService) { }

    // Create a new check-in
    async create(userId: string, createCheckInDto: CreateCheckInDto) {
        const { latitude, longitude, riskZoneId, note, photo } = createCheckInDto;

        // Find nearby risk zone if not provided
        let targetRiskZoneId = riskZoneId;
        if (!riskZoneId) {
            const nearbyZone = await this.findNearbyRiskZone(latitude, longitude);
            if (nearbyZone) {
                targetRiskZoneId = nearbyZone.id;
            }
        }

        const checkIn = await this.prisma.checkIn.create({
            data: {
                userId,
                latitude,
                longitude,
                riskZoneId: targetRiskZoneId,
                note,
                photo,
            },
            include: {
                user: { select: { firstName: true, lastName: true, rank: true, avatar: true } },
                riskZone: true,
            },
        });

        return checkIn;
    }

    // Find nearby risk zone within radius
    async findNearbyRiskZone(lat: number, lng: number, radiusMeters: number = 50) {
        // Get all active risk zones
        const zones = await this.prisma.riskZone.findMany({
            where: { isActive: true },
        });

        // Calculate distance using Haversine formula
        for (const zone of zones) {
            const distance = this.calculateDistance(lat, lng, zone.latitude, zone.longitude);
            if (distance <= zone.radius) {
                return zone;
            }
        }

        return null;
    }

    // Haversine formula to calculate distance between two points
    private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
        const R = 6371000; // Earth's radius in meters
        const dLat = this.toRad(lat2 - lat1);
        const dLon = this.toRad(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    private toRad(deg: number): number {
        return deg * (Math.PI / 180);
    }

    // Get check-ins for a user
    async findByUser(userId: string, date?: Date) {
        const startOfDay = date || new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(startOfDay);
        endOfDay.setHours(23, 59, 59, 999);

        return this.prisma.checkIn.findMany({
            where: {
                userId,
                timestamp: {
                    gte: startOfDay,
                    lte: endOfDay,
                },
            },
            include: {
                riskZone: true,
            },
            orderBy: { timestamp: 'desc' },
        });
    }

    // Get check-ins for a risk zone
    async findByRiskZone(riskZoneId: string, date?: Date) {
        const startOfDay = date || new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(startOfDay);
        endOfDay.setHours(23, 59, 59, 999);

        return this.prisma.checkIn.findMany({
            where: {
                riskZoneId,
                timestamp: {
                    gte: startOfDay,
                    lte: endOfDay,
                },
            },
            include: {
                user: { select: { firstName: true, lastName: true, rank: true } },
            },
            orderBy: { timestamp: 'desc' },
        });
    }

    // Get frequency stats for risk zones
    async getFrequencyStats(stationId: string, date?: Date) {
        const startOfDay = date || new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(startOfDay);
        endOfDay.setHours(23, 59, 59, 999);

        // Get all risk zones for the station
        const riskZones = await this.prisma.riskZone.findMany({
            where: { stationId, isActive: true },
            include: {
                checkIns: {
                    where: {
                        timestamp: {
                            gte: startOfDay,
                            lte: endOfDay,
                        },
                    },
                },
            },
        });

        return riskZones.map(zone => ({
            id: zone.id,
            name: zone.name,
            riskLevel: zone.riskLevel,
            latitude: zone.latitude,
            longitude: zone.longitude,
            requiredCheckIns: zone.requiredCheckIns,
            actualCheckIns: zone.checkIns.length,
            percentage: Math.min(100, (zone.checkIns.length / zone.requiredCheckIns) * 100),
            status: zone.checkIns.length >= zone.requiredCheckIns ? 'COMPLETE' : 'PENDING',
        }));
    }

    // Get recent check-ins for dashboard feed
    async getRecentCheckIns(stationId?: string, limit: number = 20) {
        return this.prisma.checkIn.findMany({
            where: {
                ...(stationId && { user: { stationId } }),
            },
            include: {
                user: { select: { firstName: true, lastName: true, rank: true, avatar: true, station: true } },
                riskZone: true,
            },
            orderBy: { timestamp: 'desc' },
            take: limit,
        });
    }
}
