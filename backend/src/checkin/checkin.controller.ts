import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { CheckinService } from './checkin.service';
import { CreateCheckInDto } from './dto/create-checkin.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('checkin')
@UseGuards(JwtAuthGuard)
export class CheckinController {
    constructor(private checkinService: CheckinService) { }

    @Post()
    create(@Request() req, @Body() createCheckInDto: CreateCheckInDto) {
        return this.checkinService.create(req.user.sub, createCheckInDto);
    }

    @Get('my')
    getMyCheckIns(@Request() req, @Query('date') date?: string) {
        return this.checkinService.findByUser(
            req.user.sub,
            date ? new Date(date) : undefined
        );
    }

    @Get('zone/:id')
    getZoneCheckIns(@Param('id') id: string, @Query('date') date?: string) {
        return this.checkinService.findByRiskZone(
            id,
            date ? new Date(date) : undefined
        );
    }

    @Get('frequency')
    getFrequencyStats(@Query('stationId') stationId: string, @Query('date') date?: string) {
        return this.checkinService.getFrequencyStats(
            stationId,
            date ? new Date(date) : undefined
        );
    }

    @Get('recent')
    getRecentCheckIns(@Query('stationId') stationId?: string, @Query('limit') limit?: string) {
        return this.checkinService.getRecentCheckIns(
            stationId,
            limit ? parseInt(limit) : 20
        );
    }
}
