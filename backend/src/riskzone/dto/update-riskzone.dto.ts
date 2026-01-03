import { PartialType } from '@nestjs/mapped-types';
import { CreateRiskZoneDto } from './create-riskzone.dto';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateRiskZoneDto extends PartialType(CreateRiskZoneDto) {
    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}
