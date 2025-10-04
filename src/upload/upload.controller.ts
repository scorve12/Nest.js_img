// src/upload/upload.controller.ts
import {
  Controller,
  Post,
  Get,
  Param,
  Query,
  UseInterceptors,
  UploadedFile,
  Body,
  ParseUUIDPipe,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody, ApiQuery } from '@nestjs/swagger';
import { UploadService } from './upload.service';
import { UploadFileDto } from './dto/upload-file.dto';
import { DisasterType } from './entities/upload.entity';

@ApiTags('Upload')
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Get('list')
  @ApiOperation({ summary: '업로드 목록 조회' })
  @ApiQuery({ name: 'type', required: false, enum: DisasterType })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getList(
    @Query('type') type?: DisasterType,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return await this.uploadService.getList(type, page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: '업로드 상세 조회' })
  async getOne(@Param('id', ParseUUIDPipe) id: string) {
    return await this.uploadService.getOne(id);
  }

  @Post()
  @ApiOperation({ summary: '파일 업로드' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        type: {
          type: 'string',
          enum: Object.values(DisasterType),
        },
        address: {
          type: 'string',
        },
        latitude: {
          type: 'number',
        },
        longitude: {
          type: 'number',
        },
        description: {
          type: 'string',
        },
      },
      required: ['file', 'type'],
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 500 * 1024 * 1024, // 500MB
      },
    }),
  )
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() uploadFileDto: UploadFileDto,
  ) {
    if (!file) {
      throw new BadRequestException('파일이 업로드되지 않았습니다.');
    }

    // 파일 타입 검증 (.ksplat 포함)
    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'video/mp4',
      'video/avi',
      'video/quicktime',
      'video/x-ms-wmv',
      'application/octet-stream', // .ksplat 및 기타 바이너리 파일
    ];

    const allowedExtensions = [
      '.jpg',
      '.jpeg',
      '.png',
      '.gif',
      '.mp4',
      '.avi',
      '.mov',
      '.wmv',
      '.ksplat',
    ];

    const fileExtension = file.originalname
      .toLowerCase()
      .substring(file.originalname.lastIndexOf('.'));

    if (
      !allowedMimeTypes.includes(file.mimetype) &&
      !allowedExtensions.includes(fileExtension)
    ) {
      throw new BadRequestException(
        '허용되지 않는 파일 형식입니다. (jpg, jpeg, png, gif, mp4, avi, mov, wmv, ksplat만 가능)',
      );
    }

    if (!allowedExtensions.includes(fileExtension)) {
      throw new BadRequestException(
        `허용되지 않는 파일 확장자입니다. (${allowedExtensions.join(', ')}만 가능)`,
      );
    }

    return await this.uploadService.uploadFile(file, uploadFileDto);
  }
}