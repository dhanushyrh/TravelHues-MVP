import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  ManyToMany,
  JoinTable,
  Index,
} from 'typeorm';
import { ProductType } from '../../common/enums';
import { CreatorProfile } from './creator-profile.entity';
import { Destination } from './destination.entity';
import { OrderItem } from './order-item.entity';
import { Review } from './review.entity';
import { Tag } from './tag.entity';
import { Media } from './media.entity';

@Entity('products')
@Index(['creatorId', 'type'])
@Index(['destinationId', 'type'])
@Index(['isPublished', 'type'])
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ nullable: true, type: 'text' })
  description: string;

  @Column({ type: 'enum', enum: ProductType })
  type: ProductType;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ nullable: true })
  currency: string;

  @Column({ nullable: true })
  thumbnailUrl: string;

  @Column({ type: 'simple-array', nullable: true })
  imageUrls: string[];

  @Column({ default: false })
  isPublished: boolean;

  @Column({ nullable: true })
  publishedAt: Date;

  @Column({ default: false })
  isFeatured: boolean;

  @Column({ default: 0 })
  totalSales: number;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  averageRating: number;

  @Column({ default: 0 })
  reviewCount: number;

  @Column({ nullable: true })
  stripeProductId: string;

  @Column({ nullable: true })
  stripePriceId: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => CreatorProfile, (creator) => creator.products, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'creatorId' })
  creator: CreatorProfile;

  @Column()
  creatorId: string;

  @ManyToOne(() => Destination, (destination) => destination.products, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'destinationId' })
  destination: Destination;

  @Column({ nullable: true })
  destinationId: string;

  @OneToMany(() => OrderItem, (item) => item.product)
  orderItems: OrderItem[];

  @OneToMany(() => Review, (review) => review.product)
  reviews: Review[];

  @OneToMany(() => Media, (media) => media.product)
  mediaFiles: Media[];

  @ManyToMany(() => Tag, (tag) => tag.products)
  @JoinTable({
    name: 'product_tags',
    joinColumn: { name: 'productId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'tagId', referencedColumnName: 'id' },
  })
  tags: Tag[];
}
