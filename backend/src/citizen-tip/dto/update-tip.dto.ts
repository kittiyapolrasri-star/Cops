import { PartialType } from '@nestjs/mapped-types';
import { CreateTipDto } from './create-tip.dto';
import { IsString, IsEnum, IsOptional } from 'class-validator';
import { TipStatus } from '@prisma/client';

export class UpdateTipDto extends PartialType(CreateTipDto) {
    @IsEnum(TipStatus)
    @IsOptional()
    status?: TipStatus;

    @IsString()
    @IsOptional()
    actionNote?: string;

    @IsString()
    @IsOptional()
    assignedToId?: string;
}
