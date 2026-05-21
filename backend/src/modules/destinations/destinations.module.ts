import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DestinationsController } from './destinations.controller';
import { DestinationsService } from './destinations.service';
import { Destination } from '../../database/entities/destination.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Destination])],
  controllers: [DestinationsController],
  providers: [DestinationsService],
  exports: [DestinationsService],
})
export class DestinationsModule {}
