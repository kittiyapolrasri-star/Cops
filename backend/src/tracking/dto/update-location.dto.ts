import { IsNumber, IsOptional } from 'class-validator';

export class UpdateLocationDto {
    @IsNumber()
    latitude: number;

    @IsNumber()
    longitude: number;

    @IsNumber()
    @IsOptional()
    accuracy?: number;

    @IsNumber()
    @IsOptional()
    speed?: number;

    @IsNumber()
    @IsOptional()
    heading?: number;
}
