import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Media } from '../../database/entities/media.entity';
import { StorageService } from './storage.service';
import { MediaType } from '../../common/enums';

@Injectable()
export class MediaService {
  constructor(
    @InjectRepository(Media) private readonly mediaRepository: Repository<Media>,
    private readonly storageService: StorageService,
  ) {}

  async upload(file: Express.Multer.File, userId: string, folder = 'uploads'): Promise<Media> {
    const { key, url } = await this.storageService.upload(file.buffer, file.mimetype, folder);

    const type = file.mimetype.startsWith('video/')
      ? MediaType.VIDEO
      : file.mimetype.startsWith('image/')
        ? MediaType.IMAGE
        : MediaType.DOCUMENT;

    const media = this.mediaRepository.create({
      uploadedById: userId,
      type,
      url,
      key,
      originalName: file.originalname,
      size: file.size,
      mimeType: file.mimetype,
    });

    return this.mediaRepository.save(media);
  }

  async delete(id: string, userId: string): Promise<void> {
    const media = await this.mediaRepository.findOne({ where: { id, uploadedById: userId } });
    if (!media) throw new NotFoundException('Media not found');
    await this.storageService.delete(media.key);
    await this.mediaRepository.remove(media);
  }
}
