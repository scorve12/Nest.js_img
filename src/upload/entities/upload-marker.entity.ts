// src/upload/entities/upload-marker.entity.ts
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('marker')
export class UploadMarker {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('decimal', { precision: 10, scale: 8 })
  markerLatitude: number;

  @Column('decimal', { precision: 11, scale: 8 })
  markerLongitude: number;

  @Column()
  markerAddress: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
