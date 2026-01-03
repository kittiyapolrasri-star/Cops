import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { RiskzoneService } from './riskzone.service';
import { CreateRiskZoneDto } from './dto/create-riskzone.dto';
import { UpdateRiskZoneDto } from './dto/update-riskzone.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('riskzones')
@UseGuards(JwtAuthGuard)
export class RiskzoneController {
    constructor(private riskzoneService: RiskzoneService) { }

    @Post()
    @UseGuards(RolesGuard)
    @Roles(UserRole.STATION, UserRole.PROVINCE, UserRole.BUREAU, UserRole.HQ)
    create(@Body() createRiskZoneDto: CreateRiskZoneDto) {
        return this.riskzoneService.create(createRiskZoneDto);
    }

    @Get()
    findAll(@Query('stationId') stationId?: string) {
        return this.riskzoneService.findAll(stationId);
    }

    @Get('heatmap')
    getHeatmapData(@Query('stationId') stationId?: string) {
        return this.riskzoneService.getHeatmapData(stationId);
    }

    @Get('geojson')
    getGeoJSON(@Query('stationId') stationId?: string) {
        return this.riskzoneService.getGeoJSON(stationId);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.riskzoneService.findById(id);
    }

    @Patch(':id')
    @UseGuards(RolesGuard)
    @Roles(UserRole.STATION, UserRole.PROVINCE, UserRole.BUREAU, UserRole.HQ)
    update(@Param('id') id: string, @Body() updateRiskZoneDto: UpdateRiskZoneDto) {
        return this.riskzoneService.update(id, updateRiskZoneDto);
    }

    @Delete(':id')
    @UseGuards(RolesGuard)
    @Roles(UserRole.STATION, UserRole.PROVINCE, UserRole.BUREAU, UserRole.HQ)
    remove(@Param('id') id: string) {
        return this.riskzoneService.remove(id);
    }
}
