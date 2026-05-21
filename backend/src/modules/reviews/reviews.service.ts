import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from '../../database/entities/review.entity';
import { PaginationDto } from '../../common/dto/pagination.dto';

export interface CreateReviewInput {
  productId: string;
  rating: number;
  title?: string;
  body?: string;
}

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review) private readonly reviewRepository: Repository<Review>,
  ) {}

  async findAll(productId: string, pagination: PaginationDto) {
    const { page = 1, limit = 20 } = pagination;
    const [data, total] = await this.reviewRepository.findAndCount({
      where: { productId, isVisible: true },
      relations: ['user'],
      order: { createdAt: 'DESC' },
      take: limit,
      skip: (page - 1) * limit,
    });
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async create(dto: CreateReviewInput, userId: string) {
    const existing = await this.reviewRepository.findOne({
      where: { userId, productId: dto.productId },
    });
    if (existing) throw new ConflictException('You have already reviewed this product');

    const review = this.reviewRepository.create({ ...dto, userId });
    return this.reviewRepository.save(review);
  }
}
