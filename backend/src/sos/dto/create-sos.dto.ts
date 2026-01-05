import { IsString, IsEnum, IsNumber, IsOptional, IsArray } from 'class-validator';
import { SOSType } from '@prisma/client';

export class CreateSOSDto {
    @IsEnum(SOSType)
    @IsOptional()
    type?: SOSType;

    @IsNumber()
    latitude: number;

    @IsNumber()
    longitude: number;

    @IsString()
    @IsOptional()
    address?: string;

    @IsString()
    @IsOptional()
    message?: string;

    @IsString()
    @IsOptional()
    audioUrl?: string;

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    photos?: string[];

    @IsString()
    @IsOptional()
    stationId?: string;
}
