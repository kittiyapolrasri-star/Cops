import { IsString, IsEnum, IsNumber, IsOptional, IsBoolean, IsArray, IsEmail, IsInt } from 'class-validator';
import { TipCategory } from '@prisma/client';

export class CreateTipDto {
    @IsEnum(TipCategory)
    category: TipCategory;

    @IsNumber()
    @IsOptional()
    latitude?: number;

    @IsNumber()
    @IsOptional()
    longitude?: number;

    @IsString()
    @IsOptional()
    address?: string;

    @IsString()
    description: string;

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    photos?: string[];

    @IsString()
    @IsOptional()
    contactPhone?: string;

    @IsEmail()
    @IsOptional()
    contactEmail?: string;

    @IsBoolean()
    @IsOptional()
    isAnonymous?: boolean;

    @IsString()
    @IsOptional()
    stationId?: string;

    @IsInt()
    @IsOptional()
    priority?: number;
}
