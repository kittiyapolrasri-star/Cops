import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRiskZoneDto } from './dto/create-riskzone.dto';
import { UpdateRiskZoneDto } from './dto/update-riskzone.dto';

@Injectable()
export class RiskzoneService {
    constructor(private prisma: PrismaService) { }

    async create(createRiskZoneDto: CreateRiskZoneDto) {
        return this.prisma.riskZone.create({
            data: createRiskZoneDto,
            include: { station: true },
        });
    }

    async findAll(stationId?: string) {
        return this.prisma.riskZone.findMany({
            where: {
                isActive: true,
                ...(stationId && { stationId }),
            },
            include: { station: true },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findById(id: string) {
        const zone = await this.prisma.riskZone.findUnique({
            where: { id },
            include: { station: true, checkIns: { take: 10, orderBy: { timestamp: 'desc' } } },
        });

        if (!zone) {
            throw new NotFoundException('ไม่พบพื้นที่เสี่ยง');
        }

        return zone;
    }

    async update(id: string, updateRiskZoneDto: UpdateRiskZoneDto) {
        await this.findById(id);
        return this.prisma.riskZone.update({
            where: { id },
            data: updateRiskZoneDto,
            include: { station: true },
        });
    }

    async remove(id: string) {
        await this.findById(id);
        return this.prisma.riskZone.update({
            where: { id },
            data: { isActive: false },
        });
    }

    // Get heatmap data
    async getHeatmapData(stationId?: string) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const endOfDay = new Date(today);
        endOfDay.setHours(23, 59, 59, 999);

        const zones = await this.prisma.riskZone.findMany({
            where: {
                isActive: true,
                ...(stationId && { stationId }),
            },
            include: {
                checkIns: {
                    where: {
                        timestamp: { gte: today, lte: endOfDay },
                    },
                },
            },
        });

        return zones.map(zone => ({
            id: zone.id,
            lat: zone.latitude,
            lng: zone.longitude,
            weight: zone.checkIns.length,
            name: zone.name,
            riskLevel: zone.riskLevel,
            required: zone.requiredCheckIns,
            actual: zone.checkIns.length,
        }));
    }

    // Get all zones as GeoJSON
    async getGeoJSON(stationId?: string) {
        const zones = await this.findAll(stationId);

        return {
            type: 'FeatureCollection',
            features: zones.map(zone => ({
                type: 'Feature',
                properties: {
                    id: zone.id,
                    name: zone.name,
                    description: zone.description,
                    riskLevel: zone.riskLevel,
                    radius: zone.radius,
                    requiredCheckIns: zone.requiredCheckIns,
                },
                geometry: {
                    type: 'Point',
                    coordinates: [zone.longitude, zone.latitude],
                },
            })),
        };
    }
}
