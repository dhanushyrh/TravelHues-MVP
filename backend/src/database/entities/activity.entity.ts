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

  // Relations
  @OneToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productId' })
  product: Product;

  @Column()
  productId: string;
}
