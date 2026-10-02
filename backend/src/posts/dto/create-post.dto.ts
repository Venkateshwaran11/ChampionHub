import { IsEnum, IsNotEmpty, IsString, IsUUID, IsOptional, IsDateString } from 'class-validator';
import { Platform } from '@prisma/client';

export class CreatePostDto {
    @IsUUID()
    clientId:string;

    @IsEnum(Platform)
    platform:Platform;

    @IsString()
    @IsNotEmpty()
    caption:string;
    
    @IsOptional()
    @IsDateString()
    scheduledAt?: string;
}