import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Product } from './product.entity';
import { ItineraryDay } from './itinerary-day.entity';

@Entity('itineraries')
export class Itinerary {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  totalDays: number;

  @Column({ nullable: true })
  totalNights: number;

  @Column({ nullable: true })
  startingCity: string;

  @Column({ nullable: true })
  endingCity: string;

  @Column({ nullable: true })
  difficultyLevel: string;

  @Column({ type: 'simple-array', nullable: true })
  destinations: string[];

  @Column({ type: 'simple-array', nullable: true })
  includes: string[];

  @Column({ type: 'simple-array', nullable: true })
  excludes: string[];

  @Column({ nullable: true })
  bestSeason: string;

  @Column({ type: 'text', nullable: true })
  packingList: string;

  @Column({ nullable: true })
  estimatedBudget: string;

  @Column({ default: false })
  isCustomizable: boolean;

  // Relations
  @OneToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productId' })
  product: Product;

  @Column()
  productId: string;

  @OneToMany(() => ItineraryDay, (day) => day.itinerary, {
    cascade: true,
    eager: true,
  })
  days: ItineraryDay[];
}
