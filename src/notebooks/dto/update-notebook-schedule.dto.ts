import {
  IsOptional,
  IsString,
  IsBoolean,
  IsArray,
  IsObject,
  IsEnum,
} from 'class-validator';
import {
  ScheduleType,
  ScheduleStatus,
} from '../entities/notebook-schedule.entity';

export class UpdateNotebookScheduleDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(ScheduleType)
  @IsOptional()
  type?: ScheduleType;

  @IsEnum(ScheduleStatus)
  @IsOptional()
  status?: ScheduleStatus;

  @IsBoolean()
  @IsOptional()
  isEnabled?: boolean;

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
