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
import { PoiService } from './poi.service';
import { CreatePoiDto } from './dto/create-poi.dto';
import { UpdatePoiDto } from './dto/update-poi.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { POICategory, POIPriority } from '@prisma/client';

@Controller('api/poi')
@UseGuards(JwtAuthGuard)
export class PoiController {
    constructor(private readonly poiService: PoiService) { }

    @Post()
    create(@Body() createPoiDto: CreatePoiDto, @Request() req: any) {
        return this.poiService.create(createPoiDto, req.user.sub);
    }

    @Get()
    findAll(
        @Query('stationId') stationId?: string,
        @Query('category') category?: POICategory,
        @Query('priority') priority?: POIPriority,
        @Query('isActive') isActive?: string,
    ) {
        return this.poiService.findAll({
            stationId,
            category,
            priority,
            isActive: isActive === 'false' ? false : true,
        });
    }

    @Get('stats')
    getStats(@Query('stationId') stationId?: string) {
        return this.poiService.getStats(stationId);
    }

    @Get('nearby')
    findNearby(
        @Query('lat') lat: string,
        @Query('lng') lng: string,
        @Query('radius') radius?: string,
        @Query('category') category?: POICategory,
    ) {
        return this.poiService.findNearby(
            parseFloat(lat),
            parseFloat(lng),
            radius ? parseFloat(radius) : 5,
            category,
        );
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.poiService.findById(id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updatePoiDto: UpdatePoiDto) {
        return this.poiService.update(id, updatePoiDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.poiService.delete(id);
    }
}
