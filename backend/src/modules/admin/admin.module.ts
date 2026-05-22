import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { CreatorInvite } from '../../database/entities/creator-invite.entity';
import { User } from '../../database/entities/user.entity';
import { CreatorProfile } from '../../database/entities/creator-profile.entity';
import { Destination } from '../../database/entities/destination.entity';
import { SubscriptionPlan } from '../../database/entities/subscription-plan.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CreatorInvite, User, CreatorProfile, Destination, SubscriptionPlan])],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
