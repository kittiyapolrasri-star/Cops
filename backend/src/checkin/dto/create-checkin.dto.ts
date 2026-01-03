import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateCheckInDto {
    @IsNumber()
    latitude: number;

    @IsNumber()
    longitude: number;

    @IsString()
    @IsOptional()
    riskZoneId?: string;

    @IsString()
    @IsOptional()
    note?: string;

    @IsString()
    @IsOptional()
    photo?: string;
}
