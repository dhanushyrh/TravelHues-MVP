import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Product } from './product.entity';

@Entity('packages')
export class Package {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  totalDays: number;

  @Column({ nullable: true })
  destinations: string;

  @Column({ type: 'simple-array', nullable: true })
  includes: string[];

  @Column({ type: 'simple-array', nullable: true })
  excludes: string[];

  @Column({ nullable: true })
  maxGroupSize: number;

  @Column({ default: false })
  flightIncluded: boolean;

  @Column({ default: false })
  accommodationIncluded: boolean;

  @Column({ default: false })
  mealsIncluded: boolean;

  @Column({ nullable: true })
  departureCity: string;

  @Column({ nullable: true })
  returnCity: string;

  @Column({ nullable: true })
  validityPeriod: string;

  @Column({ nullable: true })
  cancellationPolicy: string;

  @Column({ nullable: true })
  minParticipants: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  pricePerPerson: number;

  @Column({ type: 'jsonb', nullable: true })
  schedule: Record<string, any>;

  // Relations
  @OneToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productId' })
  product: Product;

  @Column()
  productId: string;
}
