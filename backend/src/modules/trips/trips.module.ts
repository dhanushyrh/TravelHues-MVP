import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TripsController } from './trips.controller';
import { TripsService } from './trips.service';
import { Trip } from '../../database/entities/trip.entity';
import { TripMember } from '../../database/entities/trip-member.entity';
import { TripDay } from '../../database/entities/trip-day.entity';
import { TripItem } from '../../database/entities/trip-item.entity';
import { User } from '../../database/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Trip, TripMember, TripDay, TripItem, User])],
  controllers: [TripsController],
  providers: [TripsService],
  exports: [TripsService],
})
export class TripsModule {}
