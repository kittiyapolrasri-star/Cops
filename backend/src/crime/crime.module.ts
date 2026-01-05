import { Module } from '@nestjs/common';
import { CrimeService } from './crime.service';
import { CrimeController } from './crime.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [CrimeController],
    providers: [CrimeService],
    exports: [CrimeService],
})
export class CrimeModule { }
