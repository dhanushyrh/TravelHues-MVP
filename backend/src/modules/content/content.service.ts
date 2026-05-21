import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Content } from '../../database/entities/content.entity';
import { ContentLike } from '../../database/entities/content-like.entity';
import { Comment } from '../../database/entities/comment.entity';
import { CreatorProfile } from '../../database/entities/creator-profile.entity';
import { Follow } from '../../database/entities/follow.entity';
import { Tag } from '../../database/entities/tag.entity';
import { ContentType } from '../../common/enums';
import { CreateContentDto } from './dto/create-content.dto';
import { UpdateContentDto } from './dto/update-content.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { PaginationDto, PaginatedResponseDto } from '../../common/dto/pagination.dto';

@Injectable()
export class ContentService {
  constructor(
    @InjectRepository(Content)
    private readonly contentRepository: Repository<Content>,
    @InjectRepository(ContentLike)
    private readonly likeRepository: Repository<ContentLike>,
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
    @InjectRepository(CreatorProfile)
    private readonly creatorRepository: Repository<CreatorProfile>,
    @InjectRepository(Follow)
    private readonly followRepository: Repository<Follow>,
    @InjectRepository(Tag)
    private readonly tagRepository: Repository<Tag>,
  ) {}

  async create(userId: string, dto: CreateContentDto): Promise<Content> {
    const creator = await this.creatorRepository.findOne({ where: { userId } });
    if (!creator) {
      throw new ForbiddenException('You must be a creator to post content');
    }

    let tags: Tag[] = [];
    if (dto.tagIds?.length) {
      tags = await this.tagRepository.findByIds(dto.tagIds);
    }

    const content = this.contentRepository.create({
      ...dto,
      creatorId: creator.id,
      tags,
      publishedAt: dto.isPublished ? new Date() : null,
    });

    const saved = await this.contentRepository.save(content);

    if (dto.isPublished) {
      await this.creatorRepository.increment({ id: creator.id }, 'totalContent', 1);
    }

    return saved;
  }

  async findFeed(
    pagination: PaginationDto,
    filters: {
      destinationId?: string;
      type?: ContentType;
      creatorId?: string;
      userId?: string; // for personalized feed
    } = {},
  ): Promise<PaginatedResponseDto<Content>> {
    const { page = 1, limit = 20 } = pagination;
    const skip = (page - 1) * limit;

    const qb = this.contentRepository
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.creator', 'creator')
      .leftJoinAndSelect('creator.user', 'creatorUser')
      .leftJoinAndSelect('c.destination', 'destination')
      .leftJoinAndSelect('c.tags', 'tags')
      .where('c.isPublished = :isPublished', { isPublished: true });

    if (filters.destinationId) {
      qb.andWhere('c.destinationId = :destinationId', {
        destinationId: filters.destinationId,
      });
    }

    if (filters.type) {
      qb.andWhere('c.type = :type', { type: filters.type });
    }

    if (filters.creatorId) {
      qb.andWhere('c.creatorId = :creatorId', { creatorId: filters.creatorId });
    }

    // Personalized feed: show content from followed creators first
    if (filters.userId) {
      qb.addSelect(
        `CASE WHEN EXISTS (
          SELECT 1 FROM follows f
          JOIN creator_profiles cp ON cp."userId" = f."followingId"
          WHERE f."followerId" = :userId AND cp.id = c."creatorId"
        ) THEN 1 ELSE 0 END`,
        'isFollowed',
      )
        .setParameter('userId', filters.userId)
        .orderBy('isFollowed', 'DESC')
        .addOrderBy('c.createdAt', 'DESC');
    } else {
      qb.orderBy('c.createdAt', 'DESC');
    }

    qb.skip(skip).take(limit);

    const [data, total] = await qb.getManyAndCount();
    return PaginatedResponseDto.create(data, total, page, limit);
  }

  async findById(id: string): Promise<Content> {
    const content = await this.contentRepository.findOne({
      where: { id },
      relations: ['creator', 'creator.user', 'destination', 'tags'],
    });

    if (!content) {
      throw new NotFoundException('Content not found');
    }

    // Increment view count asynchronously
    this.contentRepository.increment({ id }, 'viewCount', 1).catch(() => {});

    return content;
  }

  async update(
    id: string,
    userId: string,
    dto: UpdateContentDto,
  ): Promise<Content> {
    const content = await this.findById(id);

    const creator = await this.creatorRepository.findOne({ where: { userId } });
    if (!creator || content.creatorId !== creator.id) {
      throw new ForbiddenException('You can only edit your own content');
    }

    const wasPublished = content.isPublished;

    if (dto.tagIds !== undefined) {
      const tags = dto.tagIds.length
        ? await this.tagRepository.findByIds(dto.tagIds)
        : [];
      content.tags = tags;
      delete (dto as any).tagIds;
    }

    if (dto.isPublished && !wasPublished) {
      content.publishedAt = new Date();
      await this.creatorRepository.increment({ id: creator.id }, 'totalContent', 1);
    }

    Object.assign(content, dto);
    return this.contentRepository.save(content);
  }

  async remove(id: string, userId: string): Promise<void> {
    const content = await this.findById(id);
    const creator = await this.creatorRepository.findOne({ where: { userId } });

    if (!creator || content.creatorId !== creator.id) {
      throw new ForbiddenException('You can only delete your own content');
    }

    if (content.isPublished) {
      await this.creatorRepository.decrement({ id: creator.id }, 'totalContent', 1);
    }

    await this.contentRepository.remove(content);
  }

  async likeContent(contentId: string, userId: string): Promise<void> {
    const content = await this.contentRepository.findOne({ where: { id: contentId } });
    if (!content) {
      throw new NotFoundException('Content not found');
    }

    const existingLike = await this.likeRepository.findOne({
      where: { contentId, userId },
    });

    if (existingLike) {
      throw new ConflictException('Already liked this content');
    }

    const like = this.likeRepository.create({ contentId, userId });
    await this.likeRepository.save(like);
    await this.contentRepository.increment({ id: contentId }, 'likeCount', 1);
  }

  async unlikeContent(contentId: string, userId: string): Promise<void> {
    const like = await this.likeRepository.findOne({
      where: { contentId, userId },
    });

    if (!like) {
      throw new NotFoundException('Like not found');
    }

    await this.likeRepository.remove(like);
    await this.contentRepository.decrement({ id: contentId }, 'likeCount', 1);
  }

  async getComments(
    contentId: string,
    pagination: PaginationDto,
  ): Promise<PaginatedResponseDto<Comment>> {
    const { page = 1, limit = 20 } = pagination;
    const skip = (page - 1) * limit;

    const [data, total] = await this.commentRepository.findAndCount({
      where: { contentId, parentId: null, isDeleted: false },
      relations: ['author', 'replies', 'replies.author'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return PaginatedResponseDto.create(data, total, page, limit);
  }

  async addComment(
    contentId: string,
    userId: string,
    dto: CreateCommentDto,
  ): Promise<Comment> {
    const content = await this.contentRepository.findOne({ where: { id: contentId } });
    if (!content) {
      throw new NotFoundException('Content not found');
    }

    if (dto.parentId) {
      const parentComment = await this.commentRepository.findOne({
        where: { id: dto.parentId, contentId },
      });
      if (!parentComment) {
        throw new NotFoundException('Parent comment not found');
      }
    }

    const comment = this.commentRepository.create({
      ...dto,
      contentId,
      authorId: userId,
    });

    const saved = await this.commentRepository.save(comment);
    await this.contentRepository.increment({ id: contentId }, 'commentCount', 1);

    return saved;
  }
}
