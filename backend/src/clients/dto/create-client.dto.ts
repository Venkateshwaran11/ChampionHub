import { IsNotEmpty, IsString, IsArray, IsUUID, IsOptional } from 'class-validator';

export class createClientDto {
    @IsString()
    @IsNotEmpty()
    brandName: string;

    @IsOptional()
    @IsArray()
    @IsUUID('4', { each: true })
    reviewerIds?: string[];
}