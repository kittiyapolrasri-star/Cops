import { IsString, IsNumber, IsOptional, IsEnum, IsInt, Min } from 'class-validator';
import { RiskLevel } from '@prisma/client';

export class CreateRiskZoneDto {
    @IsString()
    name: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsNumber()
    latitude: number;

    @IsNumber()
    longitude: number;

    @IsNumber()
    @IsOptional()
    radius?: number;

    @IsEnum(RiskLevel)
    @IsOptional()
    riskLevel?: RiskLevel;

    @IsInt()
    @Min(1)
    @IsOptional()
    requiredCheckIns?: number;

    @IsString()
    stationId: string;
}
