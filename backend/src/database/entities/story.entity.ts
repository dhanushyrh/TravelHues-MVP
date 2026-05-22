import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  ManyToMany,
  JoinColumn,
  JoinTable,
  Index,
} from 'typeorm';
import { StoryStatus } from '../../common/enums';
import { CreatorProfile } from './creator-profile.entity';
import { Destination } from './destination.entity';
import { Product } from './product.entity';
import { Tip } from './tip.entity';
import { Content } from './content.entity';

@Entity('stories')
@Index(['creatorId', 'status'])
@Index(['countryId', 'status'])
export class Story {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ nullable: true, type: 'text' })
  description: string;

  @Column({ nullable: true })
  coverImageUrl: string;

  @Column({ type: 'enum', enum: StoryStatus, default: StoryStatus.DRAFT })
  status: StoryStatus;

  @Column({ default: false })
  isPublished: boolean;

  @Column({ default: 0 })
  viewCount: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => CreatorProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'creatorId' })
  creator: CreatorProfile;

  @Column()
  creatorId: string;

  @ManyToOne(() => Destination, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'countryId' })
  country: Destination;

  @Column()
  countryId: string;

  @ManyToMany(() => Product)
  @JoinTable({
    name: 'story_products',
    joinColumn: { name: 'storyId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'productId', referencedColumnName: 'id' },
  })
  products: Product[];

  @ManyToMany(() => Tip)
  @JoinTable({
    name: 'story_tips',
    joinColumn: { name: 'storyId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'tipId', referencedColumnName: 'id' },
  })
  tips: Tip[];

  @ManyToMany(() => Content)
  @JoinTable({
    name: 'story_content',
    joinColumn: { name: 'storyId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'contentId', referencedColumnName: 'id' },
  })
  content: Content[];
}
