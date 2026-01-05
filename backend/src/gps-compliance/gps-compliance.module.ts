import { Module } from '@nestjs/common';
import { GpsComplianceService } from './gps-compliance.service';
import { GpsComplianceController } from './gps-compliance.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [GpsComplianceController],
    providers: [GpsComplianceService],
    exports: [GpsComplianceService],
})
export class GpsComplianceModule { }
