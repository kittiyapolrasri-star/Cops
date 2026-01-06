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
} from '@nestjs/common';
import { CitizenTipService } from './citizen-tip.service';
import { CreateTipDto } from './dto/create-tip.dto';
import { UpdateTipDto } from './dto/update-tip.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TipStatus, TipCategory } from '@prisma/client';

@Controller('tips')
export class CitizenTipController {
    constructor(private readonly tipService: CitizenTipService) { }

    // ==================== PUBLIC ENDPOINTS (NO AUTH) ====================

    @Post('submit')
    submitTip(@Body() createDto: CreateTipDto) {
        return this.tipService.createPublic(createDto);
    }

    @Get('track/:tipCode')
    trackTip(@Param('tipCode') tipCode: string) {
        return this.tipService.trackByCode(tipCode);
    }

    // ==================== ADMIN ENDPOINTS (WITH AUTH) ====================

    @UseGuards(JwtAuthGuard)
    @Get()
    findAll(
        @Query('stationId') stationId?: string,
        @Query('status') status?: TipStatus,
        @Query('category') category?: TipCategory,
        @Query('priority') priority?: string,
    ) {
        return this.tipService.findAll({
            stationId,
            status,
            category,
            priority: priority ? parseInt(priority) : undefined,
        });
    }

    @UseGuards(JwtAuthGuard)
    @Get('stats')
    getStats(@Query('stationId') stationId?: string) {
        return this.tipService.getStats(stationId);
    }

    @UseGuards(JwtAuthGuard)
    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.tipService.findById(id);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id')
    update(@Param('id') id: string, @Body() updateDto: UpdateTipDto) {
        return this.tipService.update(id, updateDto);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id/status')
    updateStatus(
        @Param('id') id: string,
        @Body() body: { status: TipStatus; actionNote?: string },
    ) {
        return this.tipService.updateStatus(id, body.status, body.actionNote);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id/assign')
    assignTo(
        @Param('id') id: string,
        @Body() body: { userId: string },
    ) {
        return this.tipService.assignTo(id, body.userId);
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.tipService.delete(id);
    }
}
