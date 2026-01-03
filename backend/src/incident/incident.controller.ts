import { Controller, Get, Post, Body, Param, Patch, Query, UseGuards, Request } from '@nestjs/common';
import { IncidentService } from './incident.service';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { IncidentType } from '@prisma/client';

@Controller('incidents')
@UseGuards(JwtAuthGuard)
export class IncidentController {
    constructor(private incidentService: IncidentService) { }

    @Post()
    create(@Request() req, @Body() createIncidentDto: CreateIncidentDto) {
        return this.incidentService.create(req.user.sub, createIncidentDto);
    }

    @Get()
    findAll(
        @Query('stationId') stationId?: string,
        @Query('type') type?: IncidentType,
        @Query('limit') limit?: string
    ) {
        return this.incidentService.findAll(stationId, type, limit ? parseInt(limit) : 50);
    }

    @Get('my')
    getMyIncidents(@Request() req, @Query('date') date?: string) {
        return this.incidentService.findByUser(
            req.user.sub,
            date ? new Date(date) : undefined
        );
    }

    @Get('feed')
    getFeed(@Query('stationId') stationId?: string, @Query('limit') limit?: string) {
        return this.incidentService.getFeed(stationId, limit ? parseInt(limit) : 20);
    }

    @Get('stats')
    getStats(
        @Query('stationId') stationId?: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string
    ) {
        return this.incidentService.getStats(
            stationId,
            startDate ? new Date(startDate) : undefined,
            endDate ? new Date(endDate) : undefined
        );
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.incidentService.findById(id);
    }

    @Patch(':id/resolve')
    resolve(@Param('id') id: string) {
        return this.incidentService.resolve(id);
    }
}
