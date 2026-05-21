import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import slugify from 'slugify';
import { Destination } from '../../database/entities/destination.entity';
import { DestinationType } from '../../common/enums';
import { CreateDestinationDto } from './dto/create-destination.dto';
import { PaginationDto, PaginatedResponseDto } from '../../common/dto/pagination.dto';

@Injectable()
export class DestinationsService {
  constructor(
    @InjectRepository(Destination)
    private readonly destinationRepository: Repository<Destination>,
  ) {}

  async create(dto: CreateDestinationDto): Promise<Destination> {
    const baseSlug = slugify(dto.name, { lower: true, strict: true });
    const slug = await this.generateUniqueSlug(baseSlug);

    const destination = this.destinationRepository.create({ ...dto, slug });
    return this.destinationRepository.save(destination);
  }

  async findAll(
    pagination: PaginationDto,
    filters: {
      type?: DestinationType;
      continent?: string;
      search?: string;
    } = {},
  ): Promise<PaginatedResponseDto<Destination>> {
    const { page = 1, limit = 20 } = pagination;
    const skip = (page - 1) * limit;

    const qb = this.destinationRepository
      .createQueryBuilder('d')
      .where('d.isActive = :isActive', { isActive: true });

    if (filters.type) {
      qb.andWhere('d.type = :type', { type: filters.type });
    }

    if (filters.continent) {
      qb.andWhere('d.continent ILIKE :continent', { continent: filters.continent });
    }

    if (filters.search) {
      qb.andWhere('d.name ILIKE :search', { search: `%${filters.search}%` });
    }

    qb.orderBy('d.name', 'ASC').skip(skip).take(limit);

    const [data, total] = await qb.getManyAndCount();
    return PaginatedResponseDto.create(data, total, page, limit);
  }

  async findCountries(pagination: PaginationDto): Promise<PaginatedResponseDto<Destination>> {
    return this.findAll(pagination, { type: DestinationType.COUNTRY });
  }

  async findBySlug(slug: string): Promise<Destination> {
    const destination = await this.destinationRepository.findOne({
      where: { slug, isActive: true },
      relations: ['parent', 'children'],
    });

    if (!destination) {
      throw new NotFoundException('Destination not found');
    }

    return destination;
  }

  async findById(id: string): Promise<Destination> {
    const destination = await this.destinationRepository.findOne({
      where: { id, isActive: true },
    });

    if (!destination) {
      throw new NotFoundException('Destination not found');
    }

    return destination;
  }

  async update(id: string, dto: Partial<CreateDestinationDto>): Promise<Destination> {
    const destination = await this.findById(id);
    Object.assign(destination, dto);
    return this.destinationRepository.save(destination);
  }

  async getDestinationStats(slug: string): Promise<{
    totalContent: number;
    totalProducts: number;
    totalCreators: number;
  }> {
    const destination = await this.findBySlug(slug);
    return {
      totalContent: destination.totalContent,
      totalProducts: destination.totalProducts,
      totalCreators: destination.totalCreators,
    };
  }

  async incrementContentCount(destinationId: string): Promise<void> {
    await this.destinationRepository.increment({ id: destinationId }, 'totalContent', 1);
  }

  async incrementProductCount(destinationId: string): Promise<void> {
    await this.destinationRepository.increment({ id: destinationId }, 'totalProducts', 1);
  }

  private async generateUniqueSlug(baseSlug: string): Promise<string> {
    let slug = baseSlug;
    let count = 0;

    while (true) {
      const existing = await this.destinationRepository.findOne({ where: { slug } });
      if (!existing) break;
      count++;
      slug = `${baseSlug}-${count}`;
    }

    return slug;
  }
}
