import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import slugify from 'slugify';
import { CreatorProfile } from '../../database/entities/creator-profile.entity';
import { User } from '../../database/entities/user.entity';
import { Storefront } from '../../database/entities/storefront.entity';
import { UserRole } from '../../common/enums';
import { CreateCreatorProfileDto } from './dto/create-creator-profile.dto';
import { UpdateCreatorProfileDto } from './dto/update-creator-profile.dto';
import { CompleteOnboardingDto } from './dto/complete-onboarding.dto';
import { PaginationDto, PaginatedResponseDto } from '../../common/dto/pagination.dto';

@Injectable()
export class CreatorsService {
  constructor(
    @InjectRepository(CreatorProfile)
    private readonly creatorRepository: Repository<CreatorProfile>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Storefront)
    private readonly storefrontRepository: Repository<Storefront>,
  ) {}

  async applyToBeCreator(userId: string, dto: CreateCreatorProfileDto): Promise<CreatorProfile> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const existing = await this.creatorRepository.findOne({ where: { userId } });
    if (existing) {
      throw new ConflictException('Creator profile already exists');
    }

    const baseSlug = slugify(dto.displayName, { lower: true, strict: true });
    const slug = await this.generateUniqueSlug(baseSlug);

    const profile = this.creatorRepository.create({
      ...dto,
      userId,
      slug,
      isApproved: true, // Auto-approve for MVP; add manual review later
    });

    const savedProfile = await this.creatorRepository.save(profile);

    // Upgrade user role to creator
    await this.userRepository.update(userId, { role: UserRole.CREATOR });

    // Create default storefront
    const storefront = this.storefrontRepository.create({ creatorId: savedProfile.id });
    await this.storefrontRepository.save(storefront);

    return savedProfile;
  }

  async findOwnProfile(userId: string): Promise<CreatorProfile> {
    const profile = await this.creatorRepository.findOne({
      where: { userId },
      relations: ['user'],
    });
    if (!profile) {
      throw new NotFoundException('Creator profile not found');
    }
    return profile;
  }

  async findById(id: string): Promise<CreatorProfile> {
    const profile = await this.creatorRepository.findOne({
      where: { id },
      relations: ['user'],
    });
    if (!profile) {
      throw new NotFoundException('Creator not found');
    }
    return profile;
  }

  async findBySlug(slug: string): Promise<CreatorProfile> {
    const profile = await this.creatorRepository.findOne({
      where: { slug },
      relations: ['user'],
    });
    if (!profile) {
      throw new NotFoundException('Creator not found');
    }
    return profile;
  }

  async findAll(
    pagination: PaginationDto,
    filters: {
      destination?: string;
      specialty?: string;
      search?: string;
    } = {},
  ): Promise<PaginatedResponseDto<CreatorProfile>> {
    const { page = 1, limit = 20 } = pagination;
    const skip = (page - 1) * limit;

    const qb = this.creatorRepository
      .createQueryBuilder('cp')
      .leftJoinAndSelect('cp.user', 'user')
      .where('cp.isApproved = :isApproved', { isApproved: true });

    if (filters.search) {
      qb.andWhere(
        '(cp.displayName ILIKE :search OR cp.bio ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    if (filters.specialty) {
      qb.andWhere(':specialty = ANY(cp.specialties)', {
        specialty: filters.specialty,
      });
    }

    if (filters.destination) {
      qb.andWhere(':destination = ANY(cp.destinationsFocused)', {
        destination: filters.destination,
      });
    }

    qb.orderBy('cp.totalFollowers', 'DESC').skip(skip).take(limit);

    const [data, total] = await qb.getManyAndCount();
    return PaginatedResponseDto.create(data, total, page, limit);
  }

  async completeOnboarding(userId: string, dto: CompleteOnboardingDto): Promise<CreatorProfile> {
    const profile = await this.findOwnProfile(userId);

    profile.displayName = dto.displayName;
    if (dto.tagline !== undefined) profile.tagline = dto.tagline;
    if (dto.bio !== undefined) profile.bio = dto.bio;
    if (dto.location !== undefined) profile.location = dto.location;
    if (dto.specialties) profile.specialties = dto.specialties;
    if (dto.destinations) profile.destinationsFocused = dto.destinations;
    if (dto.avatarUrl) profile.profileImageUrl = dto.avatarUrl;
    if (dto.websiteUrl) profile.websiteUrl = dto.websiteUrl;
    if (dto.socialLinks) {
      if (dto.socialLinks.instagram) profile.instagramHandle = dto.socialLinks.instagram;
      if (dto.socialLinks.youtube) profile.youtubeHandle = dto.socialLinks.youtube;
    }

    if (!profile.slug) {
      const base = slugify(dto.displayName, { lower: true, strict: true });
      profile.slug = await this.generateUniqueSlug(base, profile.id);
    }

    profile.isOnboardingComplete = true;
    return this.creatorRepository.save(profile);
  }

  async updateProfile(userId: string, dto: UpdateCreatorProfileDto): Promise<CreatorProfile> {
    const profile = await this.findOwnProfile(userId);

    if (dto.displayName && dto.displayName !== profile.displayName) {
      const baseSlug = slugify(dto.displayName, { lower: true, strict: true });
      const slug = await this.generateUniqueSlug(baseSlug, profile.id);
      (dto as any).slug = slug;
    }

    Object.assign(profile, dto);
    return this.creatorRepository.save(profile);
  }

  private async generateUniqueSlug(baseSlug: string, excludeId?: string): Promise<string> {
    let slug = baseSlug;
    let count = 0;

    while (true) {
      const qb = this.creatorRepository
        .createQueryBuilder('cp')
        .where('cp.slug = :slug', { slug });

      if (excludeId) {
        qb.andWhere('cp.id != :excludeId', { excludeId });
      }

      const existing = await qb.getOne();
      if (!existing) break;

      count++;
      slug = `${baseSlug}-${count}`;
    }

    return slug;
  }

  async getCreatorStats(creatorId: string): Promise<{
    totalFollowers: number;
    totalContent: number;
    totalProducts: number;
    totalSales: number;
    averageRating: number;
  }> {
    const profile = await this.creatorRepository.findOne({
      where: { id: creatorId },
    });

    if (!profile) {
      throw new NotFoundException('Creator not found');
    }

    // Get average rating from products
    const ratingResult = await this.creatorRepository
      .createQueryBuilder('cp')
      .leftJoin('cp.products', 'p')
      .leftJoin('p.reviews', 'r')
      .where('cp.id = :creatorId', { creatorId })
      .select('AVG(r.rating)', 'avgRating')
      .getRawOne();

    return {
      totalFollowers: profile.totalFollowers,
      totalContent: profile.totalContent,
      totalProducts: profile.totalProducts,
      totalSales: profile.totalSales,
      averageRating: parseFloat(ratingResult?.avgRating) || 0,
    };
  }

  async incrementContentCount(creatorId: string): Promise<void> {
    await this.creatorRepository.increment({ id: creatorId }, 'totalContent', 1);
  }

  async decrementContentCount(creatorId: string): Promise<void> {
    await this.creatorRepository.decrement({ id: creatorId }, 'totalContent', 1);
  }

  async incrementProductCount(creatorId: string): Promise<void> {
    await this.creatorRepository.increment({ id: creatorId }, 'totalProducts', 1);
  }

  async decrementProductCount(creatorId: string): Promise<void> {
    await this.creatorRepository.decrement({ id: creatorId }, 'totalProducts', 1);
  }
}
