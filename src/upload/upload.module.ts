// src/upload/upload.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';
import { Upload } from './entities/upload.entity';
import { UploadMarker } from './entities/upload-marker.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Upload, UploadMarker]),
    MulterModule.register({
      limits: {
        fileSize: 300 * 1024 * 1024, // 300MB
        files: 1,
      },
    }),
  ],
  controllers: [UploadController],
  providers: [UploadService],
})
export class UploadModule {}