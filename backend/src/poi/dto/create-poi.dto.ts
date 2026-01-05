import { IsString, IsEnum, IsNumber, IsOptional, IsArray, IsBoolean } from 'class-validator';
import { POICategory, POIPriority } from '@prisma/client';

export class CreatePoiDto {
    @IsString()
    name: string;

    @IsEnum(POICategory)
    category: POICategory;

    @IsEnum(POIPriority)
    @IsOptional()
    priority?: POIPriority;

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

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    photos?: string[];

    @IsString()
    @IsOptional()
    contactName?: string;

    @IsString()
    @IsOptional()
    contactPhone?: string;

    @IsString()
    @IsOptional()
    openHours?: string;

    @IsString()
    stationId: string;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}
