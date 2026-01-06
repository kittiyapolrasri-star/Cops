import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Query,
    UseGuards,
    Request,
} from '@nestjs/common';
import { SosService } from './sos.service';
import { CreateSOSDto } from './dto/create-sos.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SOSStatus, SOSType } from '@prisma/client';

@Controller('sos')
@UseGuards(JwtAuthGuard)
export class SosController {
    constructor(private readonly sosService: SosService) { }

    @Post()
    create(@Body() createDto: CreateSOSDto, @Request() req: any) {
        return this.sosService.create(createDto, req.user.sub);
    }

    @Get()
    findAll(
        @Query('stationId') stationId?: string,
        @Query('status') status?: SOSStatus,
        @Query('type') type?: SOSType,
        @Query('userId') userId?: string,
    ) {
        return this.sosService.findAll({ stationId, status, type, userId });
    }

    @Get('active')
    findActive(@Query('stationId') stationId?: string) {
        return this.sosService.findActive(stationId);
    }

    @Get('stats')
    getStats(@Query('stationId') stationId?: string) {
        return this.sosService.getStats(stationId);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.sosService.findById(id);
    }

    @Post(':id/respond')
    respond(
        @Param('id') id: string,
        @Body() body: { message?: string; latitude?: number; longitude?: number; eta?: number },
        @Request() req: any,
    ) {
        return this.sosService.respond(id, req.user.sub, body);
    }

    @Patch(':id/resolve')
    resolve(
        @Param('id') id: string,
        @Body() body: { resolutionNote?: string },
    ) {
        return this.sosService.resolve(id, body.resolutionNote);
    }

    @Patch(':id/false-alarm')
    markFalseAlarm(
        @Param('id') id: string,
        @Body() body: { note?: string },
    ) {
        return this.sosService.markFalseAlarm(id, body.note);
    }

    @Patch(':id/cancel')
    cancel(@Param('id') id: string, @Request() req: any) {
        return this.sosService.cancel(id, req.user.sub);
    }
}
