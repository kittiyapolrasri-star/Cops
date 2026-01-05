import { IsString, IsNumber, IsOptional, IsDateString } from 'class-validator';

export class CreateCheckpointDto {
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
