import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreatorsController } from './creators.controller';
import { CreatorsService } from './creators.service';
import { CreatorProfile } from '../../database/entities/creator-profile.entity';
import { User } from '../../database/entities/user.entity';
import { Storefront } from '../../database/entities/storefront.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CreatorProfile, User, Storefront])],
  controllers: [CreatorsController],
  providers: [CreatorsService],
  exports: [CreatorsService],
})
export class CreatorsModule {}
