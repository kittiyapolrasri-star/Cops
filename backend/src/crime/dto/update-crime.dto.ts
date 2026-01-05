import { PartialType } from '@nestjs/mapped-types';
import { CreateCrimeDto } from './create-crime.dto';

export class UpdateCrimeDto extends PartialType(CreateCrimeDto) { }
