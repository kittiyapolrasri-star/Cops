import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    Query,
    UseGuards,
    Request,
} from '@nestjs/common';
import { GpsComplianceService } from './gps-compliance.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ComplianceStatus } from '@prisma/client';

@Controller('api/gps-compliance')
@UseGuards(JwtAuthGuard)
export class GpsComplianceController {
    constructor(private readonly gpsService: GpsComplianceService) { }

    // ==================== GPS LOGGING ====================

    @Post('log')
    logPosition(
        @Body() body: {
            latitude: number;
            longitude: number;
            accuracy?: number;
            speed?: number;
            heading?: number;
            altitude?: number;
            battery?: number;
            isCharging?: boolean;
        },
        @Request() req: any,
    ) {
        return this.gpsService.logPosition(req.user.sub, body);
    }

    @Get('history/:userId')
    getUserHistory(
        @Param('userId') userId: string,
        @Query('hours') hours?: string,
    ) {
        return this.gpsService.getUserHistory(userId, hours ? parseInt(hours) : 8);
    }

    @Get('latest')
    getLatestPositions(@Query('stationId') stationId?: string) {
        return this.gpsService.getLatestPositions(stationId);
    }

    // ==================== DUTY ZONES ====================

    @Post('zones')
    createDutyZone(
        @Body() body: {
            name: string;
            description?: string;
            coordinates: any;
            stationId: string;
        },
    ) {
        return this.gpsService.createDutyZone(body);
    }

    @Get('zones')
    getDutyZones(@Query('stationId') stationId?: string) {
        return this.gpsService.getDutyZones(stationId);
    }

    @Patch('zones/:id')
    updateDutyZone(
        @Param('id') id: string,
        @Body() body: {
            name?: string;
            description?: string;
            coordinates?: any;
            isActive?: boolean;
        },
    ) {
        return this.gpsService.updateDutyZone(id, body);
    }

    @Delete('zones/:id')
    deleteDutyZone(@Param('id') id: string) {
        return this.gpsService.deleteDutyZone(id);
    }

    // ==================== VIOLATIONS ====================

    @Get('violations')
    getViolations(
        @Query('userId') userId?: string,
        @Query('stationId') stationId?: string,
        @Query('type') type?: ComplianceStatus,
        @Query('isAcknowledged') isAcknowledged?: string,
    ) {
        return this.gpsService.getViolations({
            userId,
            stationId,
            type,
            isAcknowledged: isAcknowledged ? isAcknowledged === 'true' : undefined,
        });
    }

    @Patch('violations/:id/acknowledge')
    acknowledgeViolation(@Param('id') id: string, @Request() req: any) {
        return this.gpsService.acknowledgeViolation(id, req.user.sub);
    }

    // ==================== STATS ====================

    @Get('stats')
    getStats(@Query('stationId') stationId?: string) {
        return this.gpsService.getStats(stationId);
    }
}
