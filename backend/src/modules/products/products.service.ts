import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../../database/entities/product.entity';
import { Activity } from '../../database/entities/activity.entity';
import { Stay } from '../../database/entities/stay.entity';
import { Itinerary } from '../../database/entities/itinerary.entity';
import { ItineraryDay } from '../../database/entities/itinerary-day.entity';
import { Review } from '../../database/entities/review.entity';
import { CreatorProfile } from '../../database/entities/creator-profile.entity';
import { Tag } from '../../database/entities/tag.entity';
import { ProductType } from '../../common/enums';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductFilterDto } from './dto/product-filter.dto';
import { PaginatedResponseDto } from '../../common/dto/pagination.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Activity)
    private readonly activityRepository: Repository<Activity>,
    @InjectRepository(Stay)
    private readonly stayRepository: Repository<Stay>,
    @InjectRepository(Itinerary)
    private readonly itineraryRepository: Repository<Itinerary>,
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
    @InjectRepository(CreatorProfile)
    private readonly creatorRepository: Repository<CreatorProfile>,
    @InjectRepository(Tag)
    private readonly tagRepository: Repository<Tag>,
    @InjectRepository(ItineraryDay)
    private readonly itineraryDayRepository: Repository<ItineraryDay>,
  ) {}

  async create(userId: string, dto: CreateProductDto): Promise<Product> {
    const creator = await this.creatorRepository.findOne({ where: { userId } });
    if (!creator) {
      throw new ForbiddenException('You must be a creator to create products');
    }

    let tags: Tag[] = [];
    if (dto.tagIds?.length) {
      tags = await this.tagRepository.findByIds(dto.tagIds);
    }

    const { activityDetails, stayDetails, itineraryDetails, tagIds, ...productData } = dto;

    const product = this.productRepository.create({
      ...productData,
      creatorId: creator.id,
      tags,
      publishedAt: dto.isPublished ? new Date() : null,
    });

    const savedProduct = await this.productRepository.save(product);

    // Create type-specific details
    if (dto.type === ProductType.ACTIVITY && activityDetails) {
      const activity = this.activityRepository.create({
        ...activityDetails,
        productId: savedProduct.id,
      });
      await this.activityRepository.save(activity);
    } else if (dto.type === ProductType.STAY && stayDetails) {
      const stay = this.stayRepository.create({
        ...stayDetails,
        productId: savedProduct.id,
      });
      await this.stayRepository.save(stay);
    } else if (dto.type === ProductType.ITINERARY && itineraryDetails) {
      const { days, ...itineraryMeta } = itineraryDetails as any;
      const itinerary = this.itineraryRepository.create({
        ...itineraryMeta,
        productId: savedProduct.id,
      });
      const savedItinerary = await this.itineraryRepository.save(itinerary);

      if (days?.length) {
        const dayEntities = (days as any[]).map((day: any, idx: number) =>
          this.itineraryDayRepository.create({
            ...day,
            dayNumber: day.dayNumber ?? idx + 1,
            itineraryId: savedItinerary.id,
          }),
        );
        await this.itineraryDayRepository.save(dayEntities);
      }
    }

    if (dto.isPublished) {
      await this.creatorRepository.increment({ id: creator.id }, 'totalProducts', 1);
    }

    return this.findById(savedProduct.id);
  }

  async findAll(filters: ProductFilterDto): Promise<PaginatedResponseDto<Product>> {
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'DESC' } = filters;
    const skip = (page - 1) * limit;

    const qb = this.productRepository
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.creator', 'creator')
      .leftJoinAndSelect('creator.user', 'creatorUser')
      .leftJoinAndSelect('p.destination', 'destination')
      .leftJoinAndSelect('p.tags', 'tags')
      .where('p.isPublished = :isPublished', { isPublished: true });

    if (filters.type) {
      qb.andWhere('p.type = :type', { type: filters.type });
    }

    if (filters.destinationId) {
      qb.andWhere('p.destinationId = :destinationId', {
        destinationId: filters.destinationId,
      });
    }

    if (filters.creatorId) {
      qb.andWhere('p.creatorId = :creatorId', { creatorId: filters.creatorId });
    }

    if (filters.minPrice !== undefined) {
      qb.andWhere('p.price >= :minPrice', { minPrice: filters.minPrice });
    }

    if (filters.maxPrice !== undefined) {
      qb.andWhere('p.price <= :maxPrice', { maxPrice: filters.maxPrice });
    }

    if (filters.search) {
      qb.andWhere(
        '(p.title ILIKE :search OR p.description ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    const allowedSortFields = ['createdAt', 'price', 'averageRating', 'totalSales'];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
    qb.orderBy(`p.${sortField}`, sortOrder as 'ASC' | 'DESC').skip(skip).take(limit);

    const [data, total] = await qb.getManyAndCount();
    return PaginatedResponseDto.create(data, total, page, limit);
  }

  async findById(id: string): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: ['creator', 'creator.user', 'destination', 'tags'],
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async update(id: string, userId: string, dto: UpdateProductDto): Promise<Product> {
    const product = await this.findById(id);
    const creator = await this.creatorRepository.findOne({ where: { userId } });

    if (!creator || product.creatorId !== creator.id) {
      throw new ForbiddenException('You can only update your own products');
    }

    const wasPublished = product.isPublished;

    if (dto.tagIds !== undefined) {
      const tags = dto.tagIds.length
        ? await this.tagRepository.findByIds(dto.tagIds)
        : [];
      product.tags = tags;
    }

    if (dto.isPublished && !wasPublished) {
      product.publishedAt = new Date();
      await this.creatorRepository.increment({ id: creator.id }, 'totalProducts', 1);
    }

    const { tagIds, activityDetails, stayDetails, itineraryDetails, ...updateData } = dto as any;
    Object.assign(product, updateData);
    return this.productRepository.save(product);
  }

  async remove(id: string, userId: string): Promise<void> {
    const product = await this.findById(id);
    const creator = await this.creatorRepository.findOne({ where: { userId } });

    if (!creator || product.creatorId !== creator.id) {
      throw new ForbiddenException('You can only delete your own products');
    }

    if (product.isPublished) {
      await this.creatorRepository.decrement({ id: creator.id }, 'totalProducts', 1);
    }

    await this.productRepository.remove(product);
  }

  async getReviews(
    productId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<PaginatedResponseDto<Review>> {
    const [data, total] = await this.reviewRepository.findAndCount({
      where: { productId, isVisible: true },
      relations: ['user'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return PaginatedResponseDto.create(data, total, page, limit);
  }
}
