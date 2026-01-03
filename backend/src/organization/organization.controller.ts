import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { OrganizationService } from './organization.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('organization')
@UseGuards(JwtAuthGuard)
export class OrganizationController {
    constructor(private organizationService: OrganizationService) { }

    // Bureaus
    @Post('bureaus')
    @UseGuards(RolesGuard)
    @Roles(UserRole.HQ)
    createBureau(@Body() body: { name: string; code: string }) {
        return this.organizationService.createBureau(body.name, body.code);
    }

    @Get('bureaus')
    findAllBureaus() {
        return this.organizationService.findAllBureaus();
    }

    // Provinces
    @Post('provinces')
    @UseGuards(RolesGuard)
    @Roles(UserRole.BUREAU, UserRole.HQ)
    createProvince(@Body() body: { name: string; code: string; bureauId: string }) {
        return this.organizationService.createProvince(body.name, body.code, body.bureauId);
    }

    @Get('provinces')
    findAllProvinces(@Query('bureauId') bureauId?: string) {
        return this.organizationService.findAllProvinces(bureauId);
    }

    // Stations
    @Post('stations')
    @UseGuards(RolesGuard)
    @Roles(UserRole.PROVINCE, UserRole.BUREAU, UserRole.HQ)
    createStation(@Body() body: { name: string; code: string; address?: string; latitude?: number; longitude?: number; provinceId: string }) {
        return this.organizationService.createStation(body);
    }

    @Get('stations')
    findAllStations(@Query('provinceId') provinceId?: string) {
        return this.organizationService.findAllStations(provinceId);
    }

    @Get('stations/:id')
    findStationById(@Param('id') id: string) {
        return this.organizationService.findStationById(id);
    }

    // Hierarchy
    @Get('hierarchy')
    getHierarchyTree() {
        return this.organizationService.getHierarchyTree();
    }

    // Stats
    @Get('stats')
    getStats() {
        return this.organizationService.getStats();
    }
}
