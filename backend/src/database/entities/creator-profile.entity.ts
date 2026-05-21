import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { CreatorTier } from '../../common/enums';
import { User } from './user.entity';
import { Content } from './content.entity';
import { Product } from './product.entity';
import { Tip } from './tip.entity';
import { Subscription } from './subscription.entity';
import { Storefront } from './storefront.entity';

@Entity('creator_profiles')
export class CreatorProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  @Index({ unique: true })
  slug: string;

  @Column({ nullable: true })
  displayName: string;

  @Column({ nullable: true, type: 'text' })
  bio: string;

  @Column({ nullable: true })
  profileImageUrl: string;

  @Column({ nullable: true })
  coverImageUrl: string;

  @Column({ type: 'enum', enum: CreatorTier, default: CreatorTier.BASIC })
  tier: CreatorTier;

  @Column({ default: false })
  isVerified: boolean;

  @Column({ default: false })
  isApproved: boolean;

  @Column({ nullable: true })
  approvedAt: Date;

  @Column({ nullable: true })
  websiteUrl: string;

  @Column({ nullable: true })
  instagramHandle: string;

  @Column({ nullable: true })
  youtubeHandle: string;

  @Column({ nullable: true })
  tiktokHandle: string;

  @Column({ type: 'simple-array', nullable: true })
  specialties: string[];

  @Column({ type: 'simple-array', nullable: true })
  destinationsFocused: string[];

  @Column({ type: 'simple-array', nullable: true })
  languages: string[];

  @Column({ default: 0 })
  totalFollowers: number;

  @Column({ default: 0 })
  totalContent: number;

  @Column({ default: 0 })
  totalProducts: number;

  @Column({ default: 0 })
  totalSales: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalRevenue: number;

  @Column({ nullable: true })
  stripeAccountId: string;

  @Column({ default: false })
  stripeAccountEnabled: boolean;

  @Column({ nullable: true })
  subscriptionPriceMonthly: number;

  @Column({ nullable: true })
  subscriptionPriceYearly: number;

  @Column({ nullable: true })
  stripeSubscriptionPriceIdMonthly: string;

  @Column({ nullable: true })
  stripeSubscriptionPriceIdYearly: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToOne(() => User, (user) => user.creatorProfile)
  @JoinColumn()
  user: User;

  @Column()
  userId: string;

  @OneToMany(() => Content, (content) => content.creator)
  content: Content[];

  @OneToMany(() => Product, (product) => product.creator)
  products: Product[];

  @OneToMany(() => Tip, (tip) => tip.creator)
  tips: Tip[];

  @OneToMany(() => Subscription, (subscription) => subscription.creator)
  subscribers: Subscription[];

  @OneToOne(() => Storefront, (storefront) => storefront.creator)
  storefront: Storefront;
}
