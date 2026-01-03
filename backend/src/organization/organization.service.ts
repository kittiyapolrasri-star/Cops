import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OrganizationService {
    constructor(private prisma: PrismaService) { }

    // Bureaus
    async createBureau(name: string, code: string) {
        return this.prisma.bureau.create({ data: { name, code } });
    }

    async findAllBureaus() {
        return this.prisma.bureau.findMany({
            include: { provinces: { include: { stations: true } } },
            orderBy: { name: 'asc' },
        });
    }

    // Provinces
    async createProvince(name: string, code: string, bureauId: string) {
        return this.prisma.province.create({ data: { name, code, bureauId } });
    }

    async findAllProvinces(bureauId?: string) {
        return this.prisma.province.findMany({
            where: bureauId ? { bureauId } : {},
            include: { bureau: true, stations: true },
            orderBy: { name: 'asc' },
        });
    }

    // Stations
    async createStation(data: { name: string; code: string; address?: string; latitude?: number; longitude?: number; provinceId: string }) {
        return this.prisma.station.create({
            data,
            include: { province: { include: { bureau: true } } },
        });
    }

    async findAllStations(provinceId?: string) {
        return this.prisma.station.findMany({
            where: provinceId ? { provinceId } : {},
            include: { province: { include: { bureau: true } } },
            orderBy: { name: 'asc' },
        });
    }

    async findStationById(id: string) {
        const station = await this.prisma.station.findUnique({
            where: { id },
            include: {
                province: { include: { bureau: true } },
                users: { where: { isActive: true } },
                riskZones: { where: { isActive: true } },
            },
        });

        if (!station) {
            throw new NotFoundException('ไม่พบสถานี');
        }

        return station;
    }

    // Get hierarchy tree
    async getHierarchyTree() {
        return this.prisma.bureau.findMany({
            include: {
                provinces: {
                    include: {
                        stations: {
                            include: {
                                _count: { select: { users: true, riskZones: true } },
                            },
                        },
                    },
                },
            },
            orderBy: { name: 'asc' },
        });
    }

    // Stats for dashboard
    async getStats() {
        const [bureaus, provinces, stations, users, riskZones] = await Promise.all([
            this.prisma.bureau.count(),
            this.prisma.province.count(),
            this.prisma.station.count(),
            this.prisma.user.count({ where: { isActive: true } }),
            this.prisma.riskZone.count({ where: { isActive: true } }),
        ]);

        return { bureaus, provinces, stations, users, riskZones };
    }
}
