import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContentController } from './content.controller';
import { ContentService } from './content.service';
import { Content } from '../../database/entities/content.entity';
import { ContentLike } from '../../database/entities/content-like.entity';
import { Comment } from '../../database/entities/comment.entity';
import { CreatorProfile } from '../../database/entities/creator-profile.entity';
import { Follow } from '../../database/entities/follow.entity';
import { Tag } from '../../database/entities/tag.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Content, ContentLike, Comment, CreatorProfile, Follow, Tag]),
  ],
  controllers: [ContentController],
  providers: [ContentService],
  exports: [ContentService],
})
export class ContentModule {}
