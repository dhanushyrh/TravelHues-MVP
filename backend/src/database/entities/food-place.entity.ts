import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { Product } from './product.entity';

@Entity('food_places')
export class FoodPlace {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true }) address: string;
  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true }) latitude: number;
  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true }) longitude: number;
  @Column({ nullable: true }) cuisine: string;
  @Column({ nullable: true }) priceRange: string;
  @Column({ nullable: true }) website: string;
  @Column({ nullable: true }) phoneNumber: string;
  @Column({ type: 'jsonb', nullable: true }) openingHours: Record<string, string>;
  @Column({ type: 'simple-array', nullable: true }) features: string[];
  @Column({ default: true }) hasDineIn: boolean;
  @Column({ default: false }) hasTakeaway: boolean;
  @Column({ default: false }) hasDelivery: boolean;
  @Column({ nullable: true }) osmId: string;

  @OneToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productId' })
  product: Product;

  @Column()
  productId: string;
}
