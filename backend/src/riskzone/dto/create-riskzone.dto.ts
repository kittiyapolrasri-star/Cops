import { IsString, IsNumber, IsOptional, IsEnum, IsInt, Min } from 'class-validator';
import { RiskLevel, RiskCategory } from '@prisma/client';

export class CreateRiskZoneDto {
    @IsString()
    name: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsEnum(RiskCategory)
    @IsOptional()
    category?: RiskCategory;

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
