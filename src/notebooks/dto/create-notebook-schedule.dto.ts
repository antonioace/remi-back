import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsArray,
  IsObject,
  IsEnum,
} from 'class-validator';
import { ScheduleType } from '../entities/notebook-schedule.entity';

export class CreateNotebookScheduleDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(ScheduleType)
  @IsNotEmpty()
  type: ScheduleType;

  @IsString()
  @IsOptional()
  date?: string;

  @IsString()
  @IsOptional()
  startDate?: string;

  @IsString()
  @IsOptional()
  endDate?: string;

  @IsObject()
  @IsOptional()
  interval?: { days: number; hours: number; minutes: number };

  @IsArray()
  @IsOptional()
  channels?: string[];
}
