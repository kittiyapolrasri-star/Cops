import { Module } from '@nestjs/common';
import { RiskzoneService } from './riskzone.service';
import { RiskzoneController } from './riskzone.controller';

@Module({
    providers: [RiskzoneService],
    controllers: [RiskzoneController],
    exports: [RiskzoneService],
})
export class RiskzoneModule { }
