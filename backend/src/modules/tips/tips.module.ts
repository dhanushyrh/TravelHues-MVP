import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TipsController } from './tips.controller';
import { TipsService } from './tips.service';
import { Tip } from '../../database/entities/tip.entity';
import { CreatorProfile } from '../../database/entities/creator-profile.entity';
import { Destination } from '../../database/entities/destination.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Tip, CreatorProfile, Destination])],
  controllers: [TipsController],
  providers: [TipsService],
  exports: [TipsService],
})
export class TipsModule {}
