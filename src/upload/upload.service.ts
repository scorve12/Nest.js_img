// src/upload/upload.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  CreateBucketCommand,
  HeadBucketCommand,
} from '@aws-sdk/client-s3';

@Injectable()
export class UploadService implements OnModuleInit {
  private s3Client: S3Client;
  private bucketName: string;

  constructor(private configService: ConfigService) {
    const endpoint = this.configService.get<string>('AWS_ENDPOINT');
    const region = this.configService.get<string>('AWS_REGION');
    const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>('AWS_SECRET_ACCESS_KEY');

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

    this.bucketName = this.configService.get<string>('AWS_S3_BUCKET') || 'images';
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
    } catch (error) {
      if (error.name === 'NotFound') {
        await this.s3Client.send(
          new CreateBucketCommand({ Bucket: this.bucketName }),
        );
        console.log(`Bucket ${this.bucketName} created`);
      }
    }
  }

  async uploadImage(file: Express.Multer.File) {
    const key = `images/${Date.now()}-${file.originalname}`;

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    });

    await this.s3Client.send(command);

    const endpoint = this.configService.get<string>('AWS_ENDPOINT');
    const url = `${endpoint}/${this.bucketName}/${key}`;

    return {
      url,
      key,
      size: file.size,
      mimetype: file.mimetype,
    };
  }
}