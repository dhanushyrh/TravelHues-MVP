import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from '../../database/entities/review.entity';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review) private readonly reviewRepository: Repository<Review>,
  ) {}

  async findAll(targetType: string, targetId: string, pagination: PaginationDto) {
    const { page = 1, limit = 20 } = pagination;
    const [data, total] = await this.reviewRepository.findAndCount({
      where: { targetType: targetType as any, targetId },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: (page - 1) * limit,
    });
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async create(dto: { targetType: string; targetId: string; rating: number; title?: string; content?: string }, userId: string) {
    const review = this.reviewRepository.create({ ...dto, userId } as any);
    return this.reviewRepository.save(review);
  }
}
