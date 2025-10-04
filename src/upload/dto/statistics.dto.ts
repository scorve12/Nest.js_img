// src/upload/dto/statistics.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { DisasterType } from '../entities/upload.entity';

export class MonthlyUploadStats {
  @ApiProperty({ description: '년도', example: 2025 })
  year: number;

  @ApiProperty({ description: '월', example: 10 })
  month: number;

  @ApiProperty({ description: '업로드 수', example: 15 })
  count: number;
}

export class DisasterTypeStats {
  @ApiProperty({ enum: DisasterType, description: '재난 유형' })
  type: DisasterType;

  @ApiProperty({ description: '발생 횟수', example: 25 })
  count: number;
}

export class UploadStatisticsResponse {
  @ApiProperty({ description: '전체 업로드 수', example: 100 })
  totalUploads: number;

  @ApiProperty({ type: [MonthlyUploadStats], description: '월별 업로드 통계' })
  monthlyStats: MonthlyUploadStats[];

  @ApiProperty({ type: [DisasterTypeStats], description: '재난 유형별 통계' })
  disasterTypeStats: DisasterTypeStats[];
}
