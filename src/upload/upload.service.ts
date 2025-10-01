// src/upload/upload.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  S3Client,
  PutObjectCommand,
  CreateBucketCommand,
  HeadBucketCommand,
} from '@aws-sdk/client-s3';
import { Upload } from './entities/upload.entity';
import { UploadFileDto } from './dto/upload-file.dto';

@Injectable()
export class UploadService implements OnModuleInit {
  private s3Client: S3Client;
  private bucketName: string;

  constructor(
    private configService: ConfigService,
    @InjectRepository(Upload)
    private uploadRepository: Repository<Upload>,
  ) {
    const endpoint = this.configService.get<string>('AWS_ENDPOINT');
    const region = this.configService.get<string>('AWS_REGION');
    const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>(
      'AWS_SECRET_ACCESS_KEY',
    );

    if (!endpoint || !region || !accessKeyId || !secretAccessKey) {
      throw new Error('Missing required AWS configuration');
    }

    this.s3Client = new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      endpoint,
      forcePathStyle: true,
    });

    this.bucketName =
      this.configService.get<string>('AWS_S3_BUCKET') || 'images';
  }

  async onModuleInit() {
    await this.createBucketIfNotExists();
  }

  private async createBucketIfNotExists() {
    try {
      await this.s3Client.send(
        new HeadBucketCommand({ Bucket: this.bucketName }),
      );
      console.log(`Bucket ${this.bucketName} already exists`);
    } catch (error: any) {
      if (error.name === 'NotFound') {
        await this.s3Client.send(
          new CreateBucketCommand({ Bucket: this.bucketName }),
        );
        console.log(`Bucket ${this.bucketName} created`);
      }
    }
  }

  private getFileExtension(originalName: string): string {
    const parts = originalName.split('.');
    return parts.length > 1 ? `.${parts[parts.length - 1]}` : '';
  }

  private generateUrl(key: string): string {
    const endpoint = this.configService.get<string>('AWS_ENDPOINT');
    return `${endpoint}/${this.bucketName}/${key}`;
  }

  async uploadFile(file: Express.Multer.File, uploadFileDto: UploadFileDto) {
    const extension = this.getFileExtension(file.originalname);

    // DB에 먼저 저장하여 UUID 생성
    const upload = this.uploadRepository.create({
      key: '', // 임시값
      size: file.size,
      mimetype: file.mimetype,
      type: uploadFileDto.type,
      address: uploadFileDto.address,
      latitude: uploadFileDto.latitude,
      longitude: uploadFileDto.longitude,
      metadata: {
        extension,
        encoding: file.encoding,
      },
    });

    await this.uploadRepository.save(upload);

    // UUID를 사용하여 key 생성
    const filename = `${upload.id}${extension}`;
    const key = `uploads/${filename}`;

    // S3에 업로드
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    });

    await this.s3Client.send(command);

    // key 업데이트
    upload.key = key;
    await this.uploadRepository.save(upload);

    return {
      id: upload.id,
      url: this.generateUrl(key),
      key,
      type: upload.type,
      size: file.size,
      mimetype: file.mimetype,
      address: upload.address,
      latitude: upload.latitude,
      longitude: upload.longitude,
      metadata: upload.metadata,
      createdAt: upload.createdAt,
      updatedAt: upload.updatedAt,
    };
  }
}