// src/upload/dto/upload-marker.dto.ts
import { IsString, IsUUID, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class UploadMarkerDto {
  @ApiProperty({
    description: '업로드 ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  uploadId: string;

  @ApiProperty({
    description: '마커 위도',
    example: 37.5665,
    type: Number,
  })
  @IsNumber()
  @Type(() => Number)
  markerLatitude: number;

  @ApiProperty({
    description: '마커 경도',
    example: 126.978,
    type: Number,
  })
  @IsNumber()
  @Type(() => Number)
  markerLongitude: number;

  @ApiProperty({
    description: '마커 주소',
    example: '서울특별시 강남구',
  })
  @IsString()
  markerAddress: string;
}
