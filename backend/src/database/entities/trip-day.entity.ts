import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Trip } from './trip.entity';
import { TripItem } from './trip-item.entity';

@Entity('trip_days')
export class TripDay {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  dayNumber: number;

  @Column({ nullable: true, type: 'date' })
  date: Date;

  @Column({ nullable: true })
  title: string;

  @Column({ nullable: true, type: 'text' })
  notes: string;

  @Column({ nullable: true })
  location: string;

  @Column({ nullable: true })
  accommodation: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  estimatedCost: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  actualCost: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Trip, (trip) => trip.days, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tripId' })
  trip: Trip;

  @Column()
  tripId: string;

  @OneToMany(() => TripItem, (item) => item.day, { cascade: true })
  items: TripItem[];
}
