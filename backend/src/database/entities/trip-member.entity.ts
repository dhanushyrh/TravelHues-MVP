import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { TripMemberRole, InviteStatus } from '../../common/enums';
import { User } from './user.entity';
import { Trip } from './trip.entity';

@Entity('trip_members')
@Unique(['tripId', 'userId'])
export class TripMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: TripMemberRole,
    default: TripMemberRole.VIEWER,
  })
  role: TripMemberRole;

  @Column({
    type: 'enum',
    enum: InviteStatus,
    default: InviteStatus.PENDING,
  })
  inviteStatus: InviteStatus;

  @Column({ nullable: true })
  inviteEmail: string;

  @Column({ nullable: true })
  inviteToken: string;

  @Column({ nullable: true })
  inviteExpiresAt: Date;

  @Column({ nullable: true })
  acceptedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Trip, (trip) => trip.members, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tripId' })
  trip: Trip;

  @Column()
  tripId: string;

  @ManyToOne(() => User, (user) => user.tripMemberships, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ nullable: true })
  userId: string;
}
