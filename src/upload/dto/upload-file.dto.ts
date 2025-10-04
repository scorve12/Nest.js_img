// src/upload/dto/upload-file.dto.ts
import { IsEnum, IsOptional, IsNumber, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { DisasterType } from '../entities/upload.entity';

export class UploadFileDto {
  @ApiProperty({
    enum: DisasterType,
    description: '재난 유형',
    example: DisasterType.FLOOD,
  })
  @IsEnum(DisasterType)
  type: DisasterType;

  @ApiProperty({
    required: false,
    description: '주소',
    example: '서울특별시 강남구',
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({
    required: false,
    description: '위도',
    example: 37.5665,
  })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiProperty({
    required: false,
    description: '경도',
    example: 126.9780,
  })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiProperty({
    required: false,
    description: '설명',
    example: '재난 현장에 대한 상세 설명',
  })
  @IsOptional()
  @IsString()
  description?: string;
}