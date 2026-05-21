import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tip } from '../../database/entities/tip.entity';
import { CreatorProfile } from '../../database/entities/creator-profile.entity';
import { TipCategory } from '../../common/enums';
import { CreateTipDto } from './dto/create-tip.dto';
import { PaginationDto, PaginatedResponseDto } from '../../common/dto/pagination.dto';

@Injectable()
export class TipsService {
  constructor(
    @InjectRepository(Tip)
    private readonly tipRepository: Repository<Tip>,
    @InjectRepository(CreatorProfile)
    private readonly creatorRepository: Repository<CreatorProfile>,
  ) {}

  async create(userId: string, dto: CreateTipDto): Promise<Tip> {
    const creator = await this.creatorRepository.findOne({ where: { userId } });
    if (!creator) {
      throw new ForbiddenException('You must be a creator to post tips');
    }

    const tip = this.tipRepository.create({
      ...dto,
      creatorId: creator.id,
      isPublished: dto.isPublished !== false,
    });

    return this.tipRepository.save(tip);
  }

  async findAll(
    pagination: PaginationDto,
    filters: {
      destinationId?: string;
      category?: TipCategory;
      creatorId?: string;
      search?: string;
    } = {},
  ): Promise<PaginatedResponseDto<Tip>> {
    const { page = 1, limit = 20 } = pagination;
    const skip = (page - 1) * limit;

    const qb = this.tipRepository
      .createQueryBuilder('t')
      .leftJoinAndSelect('t.creator', 'creator')
      .leftJoinAndSelect('creator.user', 'creatorUser')
      .leftJoinAndSelect('t.destination', 'destination')
      .where('t.isPublished = :isPublished', { isPublished: true });

    if (filters.destinationId) {
      qb.andWhere('t.destinationId = :destinationId', {
        destinationId: filters.destinationId,
      });
    }

    if (filters.category) {
      qb.andWhere('t.category = :category', { category: filters.category });
    }

    if (filters.creatorId) {
      qb.andWhere('t.creatorId = :creatorId', { creatorId: filters.creatorId });
    }

    if (filters.search) {
      qb.andWhere(
        '(t.title ILIKE :search OR t.body ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    qb.orderBy('t.likeCount', 'DESC')
      .addOrderBy('t.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();
    return PaginatedResponseDto.create(data, total, page, limit);
  }

  async findById(id: string): Promise<Tip> {
    const tip = await this.tipRepository.findOne({
      where: { id },
      relations: ['creator', 'creator.user', 'destination'],
    });

    if (!tip) {
      throw new NotFoundException('Tip not found');
    }

    await this.tipRepository.increment({ id }, 'viewCount', 1);
    return tip;
  }

  async update(id: string, userId: string, dto: Partial<CreateTipDto>): Promise<Tip> {
    const tip = await this.findById(id);
    const creator = await this.creatorRepository.findOne({ where: { userId } });

    if (!creator || tip.creatorId !== creator.id) {
      throw new ForbiddenException('You can only edit your own tips');
    }

    Object.assign(tip, dto);
    return this.tipRepository.save(tip);
  }

  async remove(id: string, userId: string): Promise<void> {
    const tip = await this.findById(id);
    const creator = await this.creatorRepository.findOne({ where: { userId } });

    if (!creator || tip.creatorId !== creator.id) {
      throw new ForbiddenException('You can only delete your own tips');
    }

    await this.tipRepository.remove(tip);
  }

  async likeTip(id: string, userId: string): Promise<void> {
    const tip = await this.tipRepository.findOne({ where: { id } });
    if (!tip) {
      throw new NotFoundException('Tip not found');
    }

    // Simple like without tracking per-user (add TipLike entity if needed)
    await this.tipRepository.increment({ id }, 'likeCount', 1);
  }
}
