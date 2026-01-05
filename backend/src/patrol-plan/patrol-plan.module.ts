import { Module } from '@nestjs/common';
import { PatrolPlanService } from './patrol-plan.service';
import { PatrolPlanController } from './patrol-plan.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [PatrolPlanController],
    providers: [PatrolPlanService],
    exports: [PatrolPlanService],
})
export class PatrolPlanModule { }
