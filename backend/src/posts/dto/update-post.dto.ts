import { IsEnum, IsOptional, IsString, IsInt, IsDateString } from 'class-validator';
import { Platform } from '@prisma/client';

export class UpdatePostDto {
  @IsOptional()
  @IsString()
  caption?: string;

  @IsOptional()
  @IsEnum(Platform)
  platform?: Platform;

  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @IsInt()
  version: number;
}