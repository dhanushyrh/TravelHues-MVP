import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { MediaType } from '../../common/enums';
import { User } from './user.entity';
import { Content } from './content.entity';
import { Product } from './product.entity';

@Entity('media')
export class Media {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  originalName: string;

  @Column()
  mimeType: string;

  @Column()
  size: number; // in bytes

  @Column({ type: 'enum', enum: MediaType })
  type: MediaType;

  @Column()
  url: string;

  @Column()
  key: string; // S3/MinIO object key

  @Column({ nullable: true })
  bucket: string;

  @Column({ nullable: true })
  thumbnailUrl: string;

  @Column({ nullable: true })
  width: number;

  @Column({ nullable: true })
  height: number;

  @Column({ nullable: true })
  duration: number; // for video in seconds

  @Column({ default: false })
  isProcessed: boolean;

  @Column({ nullable: true })
  processedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  // Relations
  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'uploadedById' })
  uploadedBy: User;

  @Column({ nullable: true })
  uploadedById: string;

  @ManyToOne(() => Content, (content) => content.mediaFiles, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'contentId' })
  content: Content;

  @Column({ nullable: true })
  contentId: string;

  @ManyToOne(() => Product, (product) => product.mediaFiles, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'productId' })
  product: Product;

  @Column({ nullable: true })
  productId: string;
}
