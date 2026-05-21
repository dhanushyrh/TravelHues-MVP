import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { SubscriptionPlanType, BillingPeriod, CreatorTier } from '../../common/enums';
import { Subscription } from './subscription.entity';

@Entity('subscription_plans')
export class SubscriptionPlan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true, type: 'text' })
  description: string;

  @Column({ type: 'enum', enum: SubscriptionPlanType })
  type: SubscriptionPlanType;

  @Column({ type: 'enum', enum: BillingPeriod })
  billingPeriod: BillingPeriod;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ default: 'USD' })
  currency: string;

  @Column({ nullable: true })
  stripePriceId: string;

  @Column({ nullable: true })
  stripeProductId: string;

  @Column({ nullable: true, type: 'enum', enum: CreatorTier })
  creatorTier: CreatorTier;

  @Column({ type: 'jsonb', nullable: true })
  features: Record<string, any>;

  @Column({ nullable: true })
  maxProducts: number;

  @Column({ nullable: true })
  maxContent: number;

  @Column({ nullable: true })
  commissionRate: number; // percentage

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  trialDays: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToMany(() => Subscription, (subscription) => subscription.plan)
  subscriptions: Subscription[];
}
