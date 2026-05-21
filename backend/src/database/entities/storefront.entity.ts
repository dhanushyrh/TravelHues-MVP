import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { CreatorProfile } from './creator-profile.entity';

@Entity('storefronts')
export class Storefront {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  bannerImageUrl: string;

  @Column({ nullable: true, type: 'text' })
  tagline: string;

  @Column({ nullable: true, type: 'text' })
  aboutText: string;

  @Column({ nullable: true })
  primaryColor: string;

  @Column({ nullable: true })
  accentColor: string;

  @Column({ type: 'jsonb', nullable: true })
  layout: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  featuredProducts: string[]; // product IDs

  @Column({ type: 'jsonb', nullable: true })
  featuredContent: string[]; // content IDs

  @Column({ type: 'jsonb', nullable: true })
  socialLinks: {
    instagram?: string;
    youtube?: string;
    tiktok?: string;
    twitter?: string;
    website?: string;
  };

  @Column({ type: 'jsonb', nullable: true })
  seo: {
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
  };

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: 0 })
  totalVisits: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToOne(() => CreatorProfile, (creator) => creator.storefront, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'creatorId' })
  creator: CreatorProfile;

  @Column()
  creatorId: string;
}
