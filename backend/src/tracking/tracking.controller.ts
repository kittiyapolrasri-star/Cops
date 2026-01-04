import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { TrackingService } from './tracking.service';
import { UpdateLocationDto } from './dto/update-location.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('tracking')
@UseGuards(JwtAuthGuard)
export class TrackingController {
    constructor(private trackingService: TrackingService) { }

    @Post('start')
    startPatrol(@Request() req) {
        return this.trackingService.startPatrol(req.user.sub);
    }

    @Post('end')
    endPatrol(@Request() req) {
        return this.trackingService.endPatrol(req.user.sub);
    }

    @Post('location')
    updateLocation(@Request() req, @Body() locationDto: UpdateLocationDto) {
        return this.trackingService.updateLocation(req.user.sub, locationDto);
    }

    @Get('active')
    getActivePatrols(@Query('stationId') stationId?: string) {
        return this.trackingService.getActivePatrols(stationId);
    }

    @Get('latest')
    getLatestLocations(@Query('stationId') stationId?: string) {
        return this.trackingService.getLatestLocations(stationId);
    }

    @Get('history')
    getPatrolHistory(@Request() req, @Query('date') date?: string) {
        return this.trackingService.getPatrolHistory(
            req.user.sub,
            date ? new Date(date) : undefined
        );
    }

    @Get('historical')
    getHistoricalPatrols(
        @Query('stationId') stationId?: string,
        @Query('hours') hours?: string
    ) {
        return this.trackingService.getHistoricalPatrols(
            stationId,
            hours ? parseInt(hours) : 24
        );
    }

    @Get('route/:id')
    getRouteDetails(@Param('id') id: string) {
        return this.trackingService.getRouteDetails(id);
    }
}
