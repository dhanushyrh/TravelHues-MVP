import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { User } from './user.entity';
import { Content } from './content.entity';

@Entity('content_likes')
@Unique(['userId', 'contentId'])
export class ContentLike {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn()
  createdAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.contentLikes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;

  @ManyToOne(() => Content, (content) => content.likes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'contentId' })
  content: Content;

  @Column()
  contentId: string;
}
