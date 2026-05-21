import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';
import { StorageService } from './storage.service';
import { Media } from '../../database/entities/media.entity';
import * as multer from 'multer';

@Module({
  imports: [
    TypeOrmModule.forFeature([Media]),
    MulterModule.register({ storage: multer.memoryStorage(), limits: { fileSize: 100 * 1024 * 1024 } }),
  ],
  controllers: [MediaController],
  providers: [MediaService, StorageService],
  exports: [MediaService, StorageService],
})
export class MediaModule {}
