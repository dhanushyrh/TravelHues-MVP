import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StoriesController } from './stories.controller';
import { StoriesService } from './stories.service';
import { Story } from '../../database/entities/story.entity';
import { Product } from '../../database/entities/product.entity';
import { Tip } from '../../database/entities/tip.entity';
import { Content } from '../../database/entities/content.entity';
import { Destination } from '../../database/entities/destination.entity';
import { CreatorProfile } from '../../database/entities/creator-profile.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Story, Product, Tip, Content, Destination, CreatorProfile]),
  ],
  controllers: [StoriesController],
  providers: [StoriesService],
  exports: [StoriesService],
})
export class StoriesModule {}
