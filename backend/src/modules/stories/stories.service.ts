import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Story } from '../../database/entities/story.entity';
import { Product } from '../../database/entities/product.entity';
import { Tip } from '../../database/entities/tip.entity';
import { Content } from '../../database/entities/content.entity';
import { Destination } from '../../database/entities/destination.entity';
import { CreatorProfile } from '../../database/entities/creator-profile.entity';
import { StoryStatus, DestinationType } from '../../common/enums';
import { CreateStoryDto } from './dto/create-story.dto';
import { UpdateStoryDto } from './dto/update-story.dto';
import { PaginatedResponseDto, PaginationDto } from '../../common/dto/pagination.dto';

@Injectable()
export class StoriesService {
  constructor(
    @InjectRepository(Story)
    private readonly storyRepository: Repository<Story>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Tip)
    private readonly tipRepository: Repository<Tip>,
    @InjectRepository(Content)
    private readonly contentRepository: Repository<Content>,
    @InjectRepository(Destination)
    private readonly destinationRepository: Repository<Destination>,
    @InjectRepository(CreatorProfile)
    private readonly creatorRepository: Repository<CreatorProfile>,
  ) {}

  async create(userId: string, dto: CreateStoryDto): Promise<Story> {
    const creator = await this.creatorRepository.findOne({ where: { userId } });
    if (!creator) {
      throw new ForbiddenException('Creator profile not found');
    }

    const country = await this.destinationRepository.findOne({
      where: { id: dto.countryId, type: DestinationType.COUNTRY, isActive: true },
    });
    if (!country) {
      throw new BadRequestException('Country not found or not enabled');
    }

    const story = this.storyRepository.create({
      title: dto.title,
      description: dto.description,
      coverImageUrl: dto.coverImageUrl,
      countryId: dto.countryId,
      creatorId: creator.id,
    });

    const saved = await this.storyRepository.save(story);
    return this.findById(saved.id, creator.id);
  }

  async findByCreator(
    userId: string,
    pagination: PaginationDto,
  ): Promise<PaginatedResponseDto<Story>> {
    const creator = await this.creatorRepository.findOne({ where: { userId } });
    if (!creator) throw new ForbiddenException('Creator profile not found');

    const { page = 1, limit = 20 } = pagination;
    const [data, total] = await this.storyRepository.findAndCount({
      where: { creatorId: creator.id },
      relations: ['country'],
      order: { updatedAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return PaginatedResponseDto.create(data, total, page, limit);
  }

  async findById(id: string, creatorId?: string): Promise<Story> {
    const story = await this.storyRepository.findOne({
      where: { id },
      relations: ['country', 'creator', 'products', 'tips', 'content'],
    });

    if (!story) throw new NotFoundException('Story not found');

    if (creatorId && story.creatorId !== creatorId) {
      // Allow public view of published stories
      if (!story.isPublished) {
        throw new ForbiddenException('Access denied');
      }
    }

    return story;
  }

  async findByIdForUser(id: string, userId: string): Promise<Story> {
    const creator = await this.creatorRepository.findOne({ where: { userId } });
    if (!creator) throw new ForbiddenException('Creator profile not found');
    return this.findById(id, creator.id);
  }

  async update(id: string, userId: string, dto: UpdateStoryDto): Promise<Story> {
    const creator = await this.creatorRepository.findOne({ where: { userId } });
    if (!creator) throw new ForbiddenException('Creator profile not found');

    const story = await this.storyRepository.findOne({ where: { id, creatorId: creator.id } });
    if (!story) throw new NotFoundException('Story not found');

    if (dto.countryId && dto.countryId !== story.countryId) {
      const country = await this.destinationRepository.findOne({
        where: { id: dto.countryId, type: DestinationType.COUNTRY, isActive: true },
      });
      if (!country) throw new BadRequestException('Country not found or not enabled');
    }

    Object.assign(story, dto);
    await this.storyRepository.save(story);
    return this.findById(id, creator.id);
  }

  async publish(id: string, userId: string): Promise<Story> {
    const creator = await this.creatorRepository.findOne({ where: { userId } });
    if (!creator) throw new ForbiddenException('Creator profile not found');

    const story = await this.storyRepository.findOne({ where: { id, creatorId: creator.id } });
    if (!story) throw new NotFoundException('Story not found');

    story.isPublished = !story.isPublished;
    story.status = story.isPublished ? StoryStatus.PUBLISHED : StoryStatus.DRAFT;
    await this.storyRepository.save(story);
    return this.findById(id, creator.id);
  }

  async remove(id: string, userId: string): Promise<void> {
    const creator = await this.creatorRepository.findOne({ where: { userId } });
    if (!creator) throw new ForbiddenException('Creator profile not found');

    const story = await this.storyRepository.findOne({ where: { id, creatorId: creator.id } });
    if (!story) throw new NotFoundException('Story not found');

    await this.storyRepository.remove(story);
  }

  async addProduct(id: string, userId: string, productId: string): Promise<Story> {
    const creator = await this.creatorRepository.findOne({ where: { userId } });
    if (!creator) throw new ForbiddenException('Creator profile not found');

    const story = await this.storyRepository.findOne({
      where: { id, creatorId: creator.id },
      relations: ['products'],
    });
    if (!story) throw new NotFoundException('Story not found');

    const product = await this.productRepository.findOne({
      where: { id: productId, creatorId: creator.id },
    });
    if (!product) throw new NotFoundException('Product not found');

    const alreadyAdded = story.products.some((p) => p.id === productId);
    if (!alreadyAdded) {
      story.products.push(product);
      await this.storyRepository.save(story);
    }

    return this.findById(id, creator.id);
  }

  async removeProduct(id: string, userId: string, productId: string): Promise<Story> {
    const creator = await this.creatorRepository.findOne({ where: { userId } });
    if (!creator) throw new ForbiddenException('Creator profile not found');

    const story = await this.storyRepository.findOne({
      where: { id, creatorId: creator.id },
      relations: ['products'],
    });
    if (!story) throw new NotFoundException('Story not found');

    story.products = story.products.filter((p) => p.id !== productId);
    await this.storyRepository.save(story);
    return this.findById(id, creator.id);
  }

  async addTip(id: string, userId: string, tipId: string): Promise<Story> {
    const creator = await this.creatorRepository.findOne({ where: { userId } });
    if (!creator) throw new ForbiddenException('Creator profile not found');

    const story = await this.storyRepository.findOne({
      where: { id, creatorId: creator.id },
      relations: ['tips'],
    });
    if (!story) throw new NotFoundException('Story not found');

    const tip = await this.tipRepository.findOne({
      where: { id: tipId, creatorId: creator.id },
    });
    if (!tip) throw new NotFoundException('Tip not found');

    if (!story.tips.some((t) => t.id === tipId)) {
      story.tips.push(tip);
      await this.storyRepository.save(story);
    }

    return this.findById(id, creator.id);
  }

  async removeTip(id: string, userId: string, tipId: string): Promise<Story> {
    const creator = await this.creatorRepository.findOne({ where: { userId } });
    if (!creator) throw new ForbiddenException('Creator profile not found');

    const story = await this.storyRepository.findOne({
      where: { id, creatorId: creator.id },
      relations: ['tips'],
    });
    if (!story) throw new NotFoundException('Story not found');

    story.tips = story.tips.filter((t) => t.id !== tipId);
    await this.storyRepository.save(story);
    return this.findById(id, creator.id);
  }

  async addContent(id: string, userId: string, contentId: string): Promise<Story> {
    const creator = await this.creatorRepository.findOne({ where: { userId } });
    if (!creator) throw new ForbiddenException('Creator profile not found');

    const story = await this.storyRepository.findOne({
      where: { id, creatorId: creator.id },
      relations: ['content'],
    });
    if (!story) throw new NotFoundException('Story not found');

    const content = await this.contentRepository.findOne({
      where: { id: contentId, creatorId: creator.id },
    });
    if (!content) throw new NotFoundException('Content not found');

    if (!story.content.some((c) => c.id === contentId)) {
      story.content.push(content);
      await this.storyRepository.save(story);
    }

    return this.findById(id, creator.id);
  }

  async removeContent(id: string, userId: string, contentId: string): Promise<Story> {
    const creator = await this.creatorRepository.findOne({ where: { userId } });
    if (!creator) throw new ForbiddenException('Creator profile not found');

    const story = await this.storyRepository.findOne({
      where: { id, creatorId: creator.id },
      relations: ['content'],
    });
    if (!story) throw new NotFoundException('Story not found');

    story.content = story.content.filter((c) => c.id !== contentId);
    await this.storyRepository.save(story);
    return this.findById(id, creator.id);
  }

  async getPublicStories(
    countryId?: string,
    pagination?: PaginationDto,
  ): Promise<PaginatedResponseDto<Story>> {
    const { page = 1, limit = 20 } = pagination || {};
    const where: any = { isPublished: true };
    if (countryId) where.countryId = countryId;

    const [data, total] = await this.storyRepository.findAndCount({
      where,
      relations: ['country', 'creator'],
      order: { updatedAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return PaginatedResponseDto.create(data, total, page, limit);
  }
}
