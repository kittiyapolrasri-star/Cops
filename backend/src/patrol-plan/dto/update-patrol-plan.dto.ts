import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreatePatrolPlanDto } from './create-patrol-plan.dto';

export class UpdatePatrolPlanDto extends PartialType(
    OmitType(CreatePatrolPlanDto, ['checkpoints'] as const),
) { }
