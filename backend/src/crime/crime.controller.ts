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
import { CrimeService } from './crime.service';
import { CreateCrimeDto } from './dto/create-crime.dto';
import { UpdateCrimeDto } from './dto/update-crime.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CrimeType, CrimeSource } from '@prisma/client';

@Controller('api/crimes')
@UseGuards(JwtAuthGuard)
export class CrimeController {
    constructor(private readonly crimeService: CrimeService) { }

    @Post()
    create(@Body() createDto: CreateCrimeDto, @Request() req: any) {
        return this.crimeService.create(createDto, req.user.sub);
    }

    @Get()
    findAll(
        @Query('stationId') stationId?: string,
        @Query('type') type?: CrimeType,
        @Query('source') source?: CrimeSource,
        @Query('fromDate') fromDate?: string,
        @Query('toDate') toDate?: string,
        @Query('isResolved') isResolved?: string,
    ) {
        return this.crimeService.findAll({
            stationId,
            type,
            source,
            fromDate: fromDate ? new Date(fromDate) : undefined,
            toDate: toDate ? new Date(toDate) : undefined,
            isResolved: isResolved ? isResolved === 'true' : undefined,
        });
    }

    @Get('stats')
    getStats(
        @Query('stationId') stationId?: string,
        @Query('months') months?: string,
    ) {
        return this.crimeService.getStats(stationId, months ? parseInt(months) : 3);
    }

    @Get('heatmap')
    getHeatmap(
        @Query('stationId') stationId?: string,
        @Query('type') type?: CrimeType,
        @Query('months') months?: string,
    ) {
        return this.crimeService.getHeatmapData({
            stationId,
            type,
            months: months ? parseInt(months) : 3,
        });
    }

    @Get('clusters')
    getClusters(
        @Query('stationId') stationId?: string,
        @Query('type') type?: CrimeType,
        @Query('months') months?: string,
    ) {
        return this.crimeService.getClusterData({
            stationId,
            type,
            months: months ? parseInt(months) : 3,
        });
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.crimeService.findById(id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateDto: UpdateCrimeDto) {
        return this.crimeService.update(id, updateDto);
    }

    @Patch(':id/resolve')
    resolve(@Param('id') id: string) {
        return this.crimeService.resolve(id);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.crimeService.delete(id);
    }

    @Post('bulk')
    bulkCreate(@Body() records: CreateCrimeDto[], @Request() req: any) {
        return this.crimeService.bulkCreate(records, req.user.sub);
    }
}
