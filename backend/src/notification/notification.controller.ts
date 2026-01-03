import { Controller, Get, Patch, Param, Query, UseGuards, Request } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
    constructor(private notificationService: NotificationService) { }

    @Get()
    findAll(@Request() req, @Query('limit') limit?: string) {
        return this.notificationService.findAll(
            req.user.sub,
            req.user.stationId,
            limit ? parseInt(limit) : 50
        );
    }

    @Get('unread-count')
    getUnreadCount(@Request() req) {
        return this.notificationService.getUnreadCount(req.user.sub, req.user.stationId);
    }

    @Patch(':id/read')
    markAsRead(@Param('id') id: string) {
        return this.notificationService.markAsRead(id);
    }

    @Patch('read-all')
    markAllAsRead(@Request() req) {
        return this.notificationService.markAllAsRead(req.user.sub, req.user.stationId);
    }
}
