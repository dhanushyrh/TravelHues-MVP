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
import { TipCategory } from '../../common/enums';
import { CreatorProfile } from './creator-profile.entity';
import { Destination } from './destination.entity';

@Entity('tips')
@Index(['creatorId', 'createdAt'])
@Index(['destinationId', 'category'])
export class Tip {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text' })
  body: string;

  @Column({ type: 'enum', enum: TipCategory })
  category: TipCategory;

  @Column({ default: 0 })
  likeCount: number;

  @Column({ default: 0 })
  viewCount: number;

  @Column({ default: true })
  isPublished: boolean;

  @Column({ nullable: true })
  imageUrl: string;

  @Column({ nullable: true })
  estimatedCost: string;

  @Column({ type: 'simple-array', nullable: true })
  tags: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => CreatorProfile, (creator) => creator.tips, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'creatorId' })
  creator: CreatorProfile;

  @Column()
  creatorId: string;

  @ManyToOne(() => Destination, (destination) => destination.tips, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'destinationId' })
  destination: Destination;

  @Column({ nullable: true })
  destinationId: string;
}
