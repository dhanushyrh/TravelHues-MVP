import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Product } from './product.entity';

@Entity('activities')
export class Activity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  durationHours: number;

  @Column({ nullable: true })
  maxGroupSize: number;

  @Column({ nullable: true })
  minAge: number;

  @Column({ nullable: true })
  difficultyLevel: string;

  @Column({ nullable: true })
  meetingPoint: string;

  @Column({ type: 'simple-array', nullable: true })
  includes: string[];

  @Column({ type: 'simple-array', nullable: true })
  excludes: string[];

  @Column({ nullable: true })
  cancellationPolicy: string;

  @Column({ nullable: true })
  languages: string;

  @Column({ type: 'jsonb', nullable: true })
  schedule: Record<string, any>;

  @Column({ default: true })
  isInstantBooking: boolean;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitude: number;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  website: string;

  @Column({ nullable: true })
  phoneNumber: string;

  @Column({ type: 'jsonb', nullable: true })
  openingHours: Record<string, string>;

  @Column({ nullable: true })
  priceRange: string;

  @Column({ nullable: true })
  osmId: string;

  @Column({ nullable: true })
  subCategory: string;

  @Column({ type: 'simple-array', nullable: true })
  seasonality: string[];

  @Column({ nullable: true })
  ageGroup: string;

  @Column({ nullable: true })
  affiliateLink: string;

  @Column({ nullable: true })
  estimatedCost: string;

  // Relations
  @OneToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productId' })
  product: Product;

  @Column()
  productId: string;
}
