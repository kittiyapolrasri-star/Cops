import { Module } from '@nestjs/common';
import { CitizenTipService } from './citizen-tip.service';
import { CitizenTipController } from './citizen-tip.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [CitizenTipController],
    providers: [CitizenTipService],
    exports: [CitizenTipService],
})
export class CitizenTipModule { }
