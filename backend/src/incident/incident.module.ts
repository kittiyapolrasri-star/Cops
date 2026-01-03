import { Module } from '@nestjs/common';
import { IncidentService } from './incident.service';
import { IncidentController } from './incident.controller';
import { NotificationModule } from '../notification/notification.module';

@Module({
    imports: [NotificationModule],
    providers: [IncidentService],
    controllers: [IncidentController],
    exports: [IncidentService],
})
export class IncidentModule { }
