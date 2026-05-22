import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Product } from './product.entity';

@Entity('stays')
export class Stay {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  propertyType: string; // hotel, hostel, airbnb, villa

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  checkInTime: string;

  @Column({ nullable: true })
  checkOutTime: string;

  @Column({ nullable: true })
  maxGuests: number;

  @Column({ nullable: true })
  bedrooms: number;

  @Column({ nullable: true })
  bathrooms: number;

  @Column({ type: 'simple-array', nullable: true })
  amenities: string[];

  @Column({ nullable: true })
  cancellationPolicy: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  pricePerNight: number;

  @Column({ default: false })
  isPetFriendly: boolean;

  @Column({ default: false })
  isSmoking: boolean;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitude: number;

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

  @Column({ type: 'jsonb', nullable: true })
  availability: Record<string, any>;

  // Relations
  @OneToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productId' })
  product: Product;

  @Column()
  productId: string;
}
