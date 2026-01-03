import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TrackingModule } from './tracking/tracking.module';
import { CheckinModule } from './checkin/checkin.module';
import { IncidentModule } from './incident/incident.module';
import { RiskzoneModule } from './riskzone/riskzone.module';
import { UploadModule } from './upload/upload.module';
import { NotificationModule } from './notification/notification.module';
import { OrganizationModule } from './organization/organization.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        PrismaModule,
        AuthModule,
        UsersModule,
        TrackingModule,
        CheckinModule,
        IncidentModule,
        RiskzoneModule,
        UploadModule,
        NotificationModule,
        OrganizationModule,
    ],
})
export class AppModule { }
