// src/upload/dto/upload-file.dto.ts
import { IsEnum, IsOptional, IsNumber, IsString } from 'class-validator';
import { DisasterType } from '../entities/upload.entity';

export class UploadFileDto {
  @IsEnum(DisasterType)
  type: DisasterType;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;
}