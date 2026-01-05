import { IsString, IsEnum, IsNumber, IsOptional, IsBoolean, IsDateString, IsInt } from 'class-validator';
import { CrimeType, CrimeSource } from '@prisma/client';

export class CreateCrimeDto {
    @IsString()
    @IsOptional()
    caseNumber?: string;

    @IsEnum(CrimeType)
    type: CrimeType;

    @IsEnum(CrimeSource)
    source: CrimeSource;

    @IsNumber()
    latitude: number;

    @IsNumber()
    longitude: number;

    @IsString()
    @IsOptional()
    address?: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsDateString()
    occurredAt: string;

    @IsString()
    @IsOptional()
    suspectInfo?: string;

    @IsInt()
    @IsOptional()
    victimCount?: number;

    @IsNumber()
    @IsOptional()
    damageValue?: number;

    @IsString()
    stationId: string;

    @IsBoolean()
    @IsOptional()
    isResolved?: boolean;
}
