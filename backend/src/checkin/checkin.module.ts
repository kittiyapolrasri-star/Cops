import { Module } from '@nestjs/common';
import { CheckinService } from './checkin.service';
import { CheckinController } from './checkin.controller';

@Module({
    providers: [CheckinService],
    controllers: [CheckinController],
    exports: [CheckinService],
})
export class CheckinModule { }
