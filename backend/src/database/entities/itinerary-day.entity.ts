import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Itinerary } from './itinerary.entity';

@Entity('itinerary_days')
export class ItineraryDay {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  dayNumber: number;

  @Column({ nullable: true })
  title: string;

  @Column({ nullable: true, type: 'text' })
  description: string;

  @Column({ nullable: true })
  location: string;

  @Column({ nullable: true })
  accommodation: string;

  @Column({ type: 'jsonb', nullable: true })
  activities: Array<{
    time: string;
    title: string;
    description: string;
    duration: string;
    cost: string;
  }>;

  @Column({ nullable: true })
  meals: string;

  @Column({ nullable: true })
  transport: string;

  @Column({ nullable: true })
  imageUrl: string;

  @Column({ nullable: true })
  estimatedCost: string;

  @Column({ nullable: true })
  tips: string;

  // Relations
  @ManyToOne(() => Itinerary, (itinerary) => itinerary.days, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'itineraryId' })
  itinerary: Itinerary;

  @Column()
  itineraryId: string;
}
