import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { Product } from '../../database/entities/product.entity';
import { Activity } from '../../database/entities/activity.entity';
import { Stay } from '../../database/entities/stay.entity';
import { Itinerary } from '../../database/entities/itinerary.entity';
import { Review } from '../../database/entities/review.entity';
import { CreatorProfile } from '../../database/entities/creator-profile.entity';
import { Tag } from '../../database/entities/tag.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Product,
      Activity,
      Stay,
      Itinerary,
      Review,
      CreatorProfile,
      Tag,
    ]),
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
