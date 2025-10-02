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
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  ParseUUIDPipe,
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
      },
      required: ['file', 'type'],
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 300 * 1024 * 1024 }), // 300MB
          new FileTypeValidator({
            fileType: /\/(jpg|jpeg|png|gif|mp4|avi|mov|wmv)$/,
          }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Body() uploadFileDto: UploadFileDto,
  ) {
    return await this.uploadService.uploadFile(file, uploadFileDto);
  }
}