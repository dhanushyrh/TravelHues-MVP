import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { TripStatus } from '../../common/enums';
import { User } from './user.entity';
import { TripMember } from './trip-member.entity';
import { TripDay } from './trip-day.entity';

@Entity('trips')
@Index(['ownerId', 'status'])
export class Trip {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ nullable: true, type: 'text' })
  description: string;

  @Column({ nullable: true })
  coverImageUrl: string;

  @Column({ type: 'enum', enum: TripStatus, default: TripStatus.PLANNING })
  status: TripStatus;

  @Column({ nullable: true, type: 'date' })
  startDate: Date;

  @Column({ nullable: true, type: 'date' })
  endDate: Date;

  @Column({ type: 'simple-array', nullable: true })
  destinations: string[];

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  estimatedBudget: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  actualBudget: number;

  @Column({ default: 'USD' })
  currency: string;

  @Column({ default: false })
  isPublic: boolean;

  @Column({ nullable: true })
  shareCode: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.trips, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ownerId' })
  owner: User;

  @Column()
  ownerId: string;

  @OneToMany(() => TripMember, (member) => member.trip, { cascade: true })
  members: TripMember[];

  @OneToMany(() => TripDay, (day) => day.trip, { cascade: true })
  days: TripDay[];
}
