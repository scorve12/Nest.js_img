// src/upload/upload.service.ts
import { Injectable, OnModuleInit, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  S3Client,
  PutObjectCommand,
  CreateBucketCommand,
  HeadBucketCommand,
  PutBucketPolicyCommand,
} from '@aws-sdk/client-s3';
import { Upload } from './entities/upload.entity';
import { UploadFileDto } from './dto/upload-file.dto';
import { DisasterType } from './entities/upload.entity';
import { UploadMarker } from './entities/upload-marker.entity';
import { UploadMarkerDto } from './dto/upload-marker.dto';

@Injectable()
export class UploadService implements OnModuleInit {
  private s3Client: S3Client;
  private bucketName: string;

  constructor(
    private configService: ConfigService,
    @InjectRepository(Upload)
    private uploadRepository: Repository<Upload>,
    @InjectRepository(UploadMarker)
    private uploadMarkerRepository: Repository<UploadMarker>,
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
    await this.ensureBucketExists();
  }

  private async ensureBucketExists() {
    try {
      await this.s3Client.send(
        new HeadBucketCommand({ Bucket: this.bucketName }),
      );
      console.log(`Bucket ${this.bucketName} exists`);
    } catch (error) {
      if (error instanceof Error && error.name === 'NotFound') {
        await this.s3Client.send(
          new CreateBucketCommand({ Bucket: this.bucketName }),
        );
        console.log(`Bucket ${this.bucketName} created`);
      } else {
        throw error;
      }
    }

    // 항상 public 정책 설정 시도
    await this.setPublicPolicy();
  }

  private async setPublicPolicy() {
    try {
      const policy = {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: { AWS: ['*'] },
            Action: ['s3:GetObject'],
            Resource: [`arn:aws:s3:::${this.bucketName}/*`],
          },
        ],
      };

      await this.s3Client.send(
        new PutBucketPolicyCommand({
          Bucket: this.bucketName,
          Policy: JSON.stringify(policy),
        }),
      );
      console.log(`Bucket ${this.bucketName} set to public`);
    } catch (error) {
      console.error('Failed to set public policy:', error);
    }
  }

  private getFileExtension(originalName: string): string {
    const parts = originalName.split('.');
    return parts.length > 1 ? `.${parts[parts.length - 1]}` : '';
  }

  private generateUrl(key: string): string {
    const publicEndpoint =
      this.configService.get<string>('AWS_PUBLIC_ENDPOINT') ||
      'http://localhost:9000';
    return `${publicEndpoint}/${this.bucketName}/${key}`;
  }

  async uploadFile(file: Express.Multer.File, uploadFileDto: UploadFileDto) {
    const extension = this.getFileExtension(file.originalname);

    const upload = this.uploadRepository.create({
      key: '',
      size: file.size,
      mimetype: file.mimetype,
      type: uploadFileDto.type,
      address: uploadFileDto.address,
      latitude: uploadFileDto.latitude,
      longitude: uploadFileDto.longitude,
      description: uploadFileDto.description,
      metadata: {
        extension,
        encoding: file.encoding,
      },
    });

    await this.uploadRepository.save(upload);

    const filename = `${upload.id}${extension}`;
    const key = `uploads/${filename}`;

    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      });

      await this.s3Client.send(command);

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
        description: upload.description,
        metadata: upload.metadata,
        createdAt: upload.createdAt,
        updatedAt: upload.updatedAt,
      };
    } catch (error) {
      await this.uploadRepository.remove(upload);
      console.error('Error uploading file to S3:', error);
      throw error;
    }
  }

  async getList(type?: DisasterType, page: number = 1, limit: number = 10) {
    const query = this.uploadRepository.createQueryBuilder('upload');

    if (type) {
      query.where('upload.type = :type', { type });
    }

    query
      .orderBy('upload.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [items, total] = await query.getManyAndCount();

    const itemsWithUrl = items.map((item) => ({
      ...item,
      url: this.generateUrl(item.key),
    }));

    return {
      items: itemsWithUrl,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getOne(id: string) {
    const upload = await this.uploadRepository.findOne({
      where: { id },
    });

    if (!upload) {
      throw new NotFoundException(`Upload with ID ${id} not found`);
    }

    return {
      ...upload,
      url: this.generateUrl(upload.key),
    };
  }

  async getStatistics() {
    // 전체 업로드 수
    const totalUploads = await this.uploadRepository.count();

    // 월별 업로드 통계
    const monthlyStatsRaw = await this.uploadRepository
      .createQueryBuilder('upload')
      .select('EXTRACT(YEAR FROM upload.createdAt)', 'year')
      .addSelect('EXTRACT(MONTH FROM upload.createdAt)', 'month')
      .addSelect('COUNT(*)', 'count')
      .groupBy('year')
      .addGroupBy('month')
      .orderBy('year', 'DESC')
      .addOrderBy('month', 'DESC')
      .getRawMany();

    const monthlyStats = monthlyStatsRaw.map((row) => ({
      year: parseInt(row.year),
      month: parseInt(row.month),
      count: parseInt(row.count),
    }));

    // 재난 유형별 통계
    const disasterTypeStatsRaw = await this.uploadRepository
      .createQueryBuilder('upload')
      .select('upload.type', 'type')
      .addSelect('COUNT(*)', 'count')
      .groupBy('upload.type')
      .orderBy('count', 'DESC')
      .getRawMany();

    const disasterTypeStats = disasterTypeStatsRaw.map((row) => ({
      type: row.type,
      count: parseInt(row.count),
    }));

    return {
      totalUploads,
      monthlyStats,
      disasterTypeStats,
    };
  }

  async createMarker(uploadMarkerDto: UploadMarkerDto) {
    // uploadId가 유효한지 확인
    const upload = await this.uploadRepository.findOne({
      where: { id: uploadMarkerDto.uploadId },
    });

    if (!upload) {
      throw new NotFoundException(
        `Upload with ID ${uploadMarkerDto.uploadId} not found`,
      );
    }

    const marker = this.uploadMarkerRepository.create(uploadMarkerDto);
    await this.uploadMarkerRepository.save(marker);
    return marker;
  }

  async getMarkers() {
    return await this.uploadMarkerRepository.find({
      relations: ['upload'],
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async getMarkersByUploadId(uploadId: string) {
    // uploadId가 유효한지 확인
    const upload = await this.uploadRepository.findOne({
      where: { id: uploadId },
    });

    if (!upload) {
      throw new NotFoundException(`Upload with ID ${uploadId} not found`);
    }

    const markers = await this.uploadMarkerRepository.find({
      where: { uploadId },
      order: {
        createdAt: 'DESC',
      },
    });

    return markers;
  }

  async getMarker(id: string) {
    const marker = await this.uploadMarkerRepository.findOne({
      where: { id },
      relations: ['upload'],
    });

    if (!marker) {
      throw new NotFoundException(`Marker with ID ${id} not found`);
    }

    return marker;
  }
}