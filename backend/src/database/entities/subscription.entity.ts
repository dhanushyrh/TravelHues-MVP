import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { SubscriptionStatus, SubscriptionPlanType } from '../../common/enums';
import { User } from './user.entity';
import { SubscriptionPlan } from './subscription-plan.entity';
import { CreatorProfile } from './creator-profile.entity';

@Entity('subscriptions')
@Index(['subscriberId', 'status'])
@Index(['creatorId', 'status'])
export class Subscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: SubscriptionStatus, default: SubscriptionStatus.ACTIVE })
  status: SubscriptionStatus;

  @Column({ type: 'enum', enum: SubscriptionPlanType })
  planType: SubscriptionPlanType;

  @Column({ nullable: true })
  stripeSubscriptionId: string;

  @Column({ nullable: true })
  stripeCustomerId: string;

  @Column({ nullable: true })
  currentPeriodStart: Date;

  @Column({ nullable: true })
  currentPeriodEnd: Date;

  @Column({ nullable: true })
  cancelledAt: Date;

  @Column({ nullable: true })
  cancelAtPeriodEnd: boolean;

  @Column({ nullable: true })
  trialStart: Date;

  @Column({ nullable: true })
  trialEnd: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.subscriptions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'subscriberId' })
  subscriber: User;

  @Column()
  subscriberId: string;

  @ManyToOne(() => SubscriptionPlan, (plan) => plan.subscriptions, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'planId' })
  plan: SubscriptionPlan;

  @Column({ nullable: true })
  planId: string;

  // For user->creator subscriptions
  @ManyToOne(() => CreatorProfile, (creator) => creator.subscribers, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'creatorId' })
  creator: CreatorProfile;

  @Column({ nullable: true })
  creatorId: string;
}
