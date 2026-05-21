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
import { ContentType } from '../../common/enums';
import { CreatorProfile } from './creator-profile.entity';
import { Destination } from './destination.entity';
import { ContentLike } from './content-like.entity';
import { Comment } from './comment.entity';
import { Tag } from './tag.entity';
import { Media } from './media.entity';

@Entity('content')
@Index(['creatorId', 'createdAt'])
@Index(['destinationId', 'createdAt'])
export class Content {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ nullable: true, type: 'text' })
  description: string;

  @Column({ type: 'enum', enum: ContentType })
  type: ContentType;

  @Column({ nullable: true })
  thumbnailUrl: string;

  @Column({ nullable: true })
  videoUrl: string;

  @Column({ type: 'simple-array', nullable: true })
  imageUrls: string[];

  @Column({ default: 0 })
  viewCount: number;

  @Column({ default: 0 })
  likeCount: number;

  @Column({ default: 0 })
  commentCount: number;

  @Column({ default: 0 })
  shareCount: number;

  @Column({ default: false })
  isPublished: boolean;

  @Column({ nullable: true })
  publishedAt: Date;

  @Column({ default: false })
  isFeatured: boolean;

  @Column({ nullable: true })
  duration: number; // in seconds for reels

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ nullable: true })
  location: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => CreatorProfile, (creator) => creator.content, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'creatorId' })
  creator: CreatorProfile;

  @Column()
  creatorId: string;

  @ManyToOne(() => Destination, (destination) => destination.content, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'destinationId' })
  destination: Destination;

  @Column({ nullable: true })
  destinationId: string;

  @OneToMany(() => ContentLike, (like) => like.content)
  likes: ContentLike[];

  @OneToMany(() => Comment, (comment) => comment.content)
  comments: Comment[];

  @OneToMany(() => Media, (media) => media.content)
  mediaFiles: Media[];

  @ManyToMany(() => Tag, (tag) => tag.content)
  @JoinTable({
    name: 'content_tags',
    joinColumn: { name: 'contentId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'tagId', referencedColumnName: 'id' },
  })
  tags: Tag[];
}
