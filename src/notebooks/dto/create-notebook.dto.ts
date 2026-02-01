import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsObject,
  IsUUID,
  IsDateString,
} from 'class-validator';

export class CreateNotebookDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsNotEmpty()
  textContent: string;

  @IsObject()
  @IsOptional()
  content?: Record<string, unknown>;

  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsDateString()
  @IsOptional()
  assignedAt?: string;

  @IsString()
  @IsOptional()
  timezone?: string;
}
