// src/upload/entities/upload.entity.ts
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum DisasterType {
  FLOOD = '홍수',
  EARTHQUAKE = '지진',
  TYPHOON = '태풍',
  FIRE = '화재',
  LANDSLIDE = '산사태',
}

@Entity('uploads')
export class Upload {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  key: string;

  @Column('jsonb', { nullable: true })
  metadata: Record<string, any>;

  @Column({
    type: 'enum',
    enum: DisasterType,
  })
  type: DisasterType;

  @Column('decimal', { precision: 10, scale: 8, nullable: true })
  latitude: number;

  @Column('decimal', { precision: 11, scale: 8, nullable: true })
  longitude: number;

  @Column({ nullable: true })
  address: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column()
  size: number;

  @Column()
  mimetype: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}