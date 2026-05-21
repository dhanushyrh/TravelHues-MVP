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
import { DestinationType } from '../../common/enums';
import { Content } from './content.entity';
import { Product } from './product.entity';
import { Tip } from './tip.entity';

@Entity('destinations')
export class Destination {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  @Index({ unique: true })
  slug: string;

  @Column({ type: 'enum', enum: DestinationType })
  type: DestinationType;

  @Column({ nullable: true, type: 'text' })
  description: string;

  @Column({ nullable: true })
  coverImageUrl: string;

  @Column({ nullable: true })
  flagImageUrl: string;

  @Column({ nullable: true })
  continent: string;

  @Column({ nullable: true })
  countryCode: string;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitude: number;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: 0 })
  totalContent: number;

  @Column({ default: 0 })
  totalProducts: number;

  @Column({ default: 0 })
  totalCreators: number;

  @Column({ nullable: true })
  visaRequirements: string;

  @Column({ nullable: true })
  currency: string;

  @Column({ nullable: true })
  timezone: string;

  @Column({ nullable: true })
  bestTimeToVisit: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Self-referencing for hierarchy (country -> city -> region)
  @ManyToOne(() => Destination, (destination) => destination.children, {
    nullable: true,
  })
  @JoinColumn({ name: 'parentId' })
  parent: Destination;

  @Column({ nullable: true })
  parentId: string;

  @OneToMany(() => Destination, (destination) => destination.parent)
  children: Destination[];

  // Relations
  @OneToMany(() => Content, (content) => content.destination)
  content: Content[];

  @OneToMany(() => Product, (product) => product.destination)
  products: Product[];

  @OneToMany(() => Tip, (tip) => tip.destination)
  tips: Tip[];
}
