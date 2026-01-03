import { IsString, IsNumber, IsOptional, IsEnum, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { IncidentType, IncidentCategory } from '@prisma/client';

export class CreateIncidentItemDto {
    @IsEnum(IncidentCategory)
    category: IncidentCategory;

    @IsString()
    itemType: string;

    @IsNumber()
    @IsOptional()
    quantity?: number;

    @IsString()
    @IsOptional()
    unit?: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    @IsOptional()
    photo?: string;
}

export class CreateIncidentDto {
    @IsEnum(IncidentType)
    type: IncidentType;

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

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateIncidentItemDto)
    @IsOptional()
    items?: CreateIncidentItemDto[];
}
