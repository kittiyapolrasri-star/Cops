import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuditAction } from '@prisma/client';

@Controller('audit')
@UseGuards(JwtAuthGuard)
export class AuditController {
    constructor(private readonly auditService: AuditService) { }

    @Get()
    findAll(
        @Query('userId') userId?: string,
        @Query('action') action?: AuditAction,
        @Query('entity') entity?: string,
        @Query('fromDate') fromDate?: string,
        @Query('toDate') toDate?: string,
        @Query('limit') limit?: string,
    ) {
        return this.auditService.findAll({
            userId,
            action,
            entity,
            fromDate: fromDate ? new Date(fromDate) : undefined,
            toDate: toDate ? new Date(toDate) : undefined,
            limit: limit ? parseInt(limit) : 100,
        });
    }

    @Get('recent')
    getRecent(@Query('limit') limit?: string) {
        return this.auditService.getRecent(limit ? parseInt(limit) : 50);
    }

    @Get('stats')
    getStats(@Query('days') days?: string) {
        return this.auditService.getStats(days ? parseInt(days) : 7);
    }

    @Get('by-user')
    getByUser(
        @Query('userId') userId: string,
        @Query('limit') limit?: string,
    ) {
        return this.auditService.getByUser(userId, limit ? parseInt(limit) : 50);
    }

    @Get('by-entity')
    getByEntity(
        @Query('entity') entity: string,
        @Query('entityId') entityId?: string,
        @Query('limit') limit?: string,
    ) {
        return this.auditService.getByEntity(entity, entityId, limit ? parseInt(limit) : 50);
    }
}
