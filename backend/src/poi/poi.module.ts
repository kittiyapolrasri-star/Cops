import { Module } from '@nestjs/common';
import { PoiService } from './poi.service';
import { PoiController } from './poi.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [PoiController],
    providers: [PoiService],
    exports: [PoiService],
})
export class PoiModule { }
