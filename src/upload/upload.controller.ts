// src/upload/upload.controller.ts
import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  Body,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';
import { UploadFileDto } from './dto/upload-file.dto';

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 100 * 1024 * 1024 }), // 100MB
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