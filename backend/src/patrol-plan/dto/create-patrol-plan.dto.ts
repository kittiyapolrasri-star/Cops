import {
    IsString,
    IsBoolean,
    IsOptional,
    IsDateString,
    IsArray,
    ValidateNested,
    IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';

class CheckpointDto {
    @IsString()
    name: string;

    @IsNumber()
    latitude: number;

    @IsNumber()
    longitude: number;

    @IsNumber()
    @IsOptional()
    radius?: number;

    @IsNumber()
    @IsOptional()
    sequence?: number;

    @IsDateString()
    @IsOptional()
    expectedTime?: string;

    @IsNumber()
    @IsOptional()
    stayDuration?: number;

    @IsString()
    @IsOptional()
    poiId?: string;
}

export class CreatePatrolPlanDto {
    @IsString()
    name: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    stationId: string;

    @IsDateString()
    startTime: string;

    @IsDateString()
    endTime: string;

    @IsBoolean()
    @IsOptional()
    repeatDaily?: boolean;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CheckpointDto)
    @IsOptional()
    checkpoints?: CheckpointDto[];

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}
