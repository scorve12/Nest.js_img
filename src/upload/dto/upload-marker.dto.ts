// src/upload/dto/upload-marker.dto.ts
import { IsNumber, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UploadMarkerDto {
  @ApiProperty({
    description: '마커 위도',
    example: 37.5665,
  })
  @IsNumber()
  markerLatitude: number;

  @ApiProperty({
    description: '마커 경도',
    example: 126.978,
  })
  @IsNumber()
  markerLongitude: number;

  @ApiProperty({
    description: '마커 주소',
    example: '서울특별시 강남구',
  })
  @IsString()
  markerAddress: string;
}
