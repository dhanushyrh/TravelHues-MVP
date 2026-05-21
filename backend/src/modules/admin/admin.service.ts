import {
  Injectable,
  ConflictException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import slugify from 'slugify';
import { CreatorInvite } from '../../database/entities/creator-invite.entity';
import { User } from '../../database/entities/user.entity';
import { Destination } from '../../database/entities/destination.entity';
import { SubscriptionPlan } from '../../database/entities/subscription-plan.entity';
import { InviteStatus, DestinationType } from '../../common/enums';
import { CreateInviteDto } from './dto/create-invite.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { CreateDestinationDto } from '../destinations/dto/create-destination.dto';
import { UpsertSubscriptionPlanDto } from './dto/upsert-subscription-plan.dto';

const INVITE_EXPIRY_DAYS = 7;

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(CreatorInvite)
    private readonly inviteRepository: Repository<CreatorInvite>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Destination)
    private readonly destinationRepository: Repository<Destination>,
    @InjectRepository(SubscriptionPlan)
    private readonly planRepository: Repository<SubscriptionPlan>,
  ) {}

  async createInvite(dto: CreateInviteDto, adminId: string): Promise<CreatorInvite> {
    // Check if email already has an active pending invite
    const existing = await this.inviteRepository.findOne({
      where: { email: dto.email.toLowerCase(), status: InviteStatus.PENDING },
    });
    if (existing && existing.expiresAt > new Date()) {
      throw new ConflictException('An active invite already exists for this email');
    }

    // Check if the email is already a registered creator
    const existingUser = await this.userRepository.findOne({
      where: { email: dto.email.toLowerCase() },
    });
    if (existingUser) {
      throw new ConflictException('A user with this email already exists');
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + INVITE_EXPIRY_DAYS);

    const invite = this.inviteRepository.create({
      email: dto.email.toLowerCase(),
      token: uuidv4(),
      status: InviteStatus.PENDING,
      expiresAt,
      createdById: adminId,
      notes: dto.notes,
    });

    return this.inviteRepository.save(invite);
  }

  async listInvites(pagination: PaginationDto, status?: InviteStatus) {
    const { page = 1, limit = 20 } = pagination;
    const where = status ? { status } : {};

    const [data, total] = await this.inviteRepository.findAndCount({
      where,
      relations: ['createdBy', 'usedByUser'],
      order: { createdAt: 'DESC' },
      take: limit,
      skip: (page - 1) * limit,
    });

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async getInvite(id: string): Promise<CreatorInvite> {
    const invite = await this.inviteRepository.findOne({
      where: { id },
      relations: ['createdBy', 'usedByUser'],
    });
    if (!invite) throw new NotFoundException('Invite not found');
    return invite;
  }

  async revokeInvite(id: string, adminId: string): Promise<CreatorInvite> {
    const invite = await this.inviteRepository.findOne({ where: { id } });
    if (!invite) throw new NotFoundException('Invite not found');
    if (invite.status !== InviteStatus.PENDING) {
      throw new ForbiddenException(`Cannot revoke an invite with status: ${invite.status}`);
    }

    invite.status = InviteStatus.REVOKED;
    invite.revokedAt = new Date();
    return this.inviteRepository.save(invite);
  }

  async getInviteStats() {
    const [total, pending, used, revoked, expired] = await Promise.all([
      this.inviteRepository.count(),
      this.inviteRepository.count({ where: { status: InviteStatus.PENDING } }),
      this.inviteRepository.count({ where: { status: InviteStatus.USED } }),
      this.inviteRepository.count({ where: { status: InviteStatus.REVOKED } }),
      this.inviteRepository.count({ where: { status: InviteStatus.EXPIRED } }),
    ]);
    return { total, pending, used, revoked, expired };
  }

  // Called by auth service during creator registration
  async validateAndUseInvite(token: string, email: string, userId: string): Promise<CreatorInvite> {
    const invite = await this.inviteRepository.findOne({ where: { token } });

    if (!invite) throw new NotFoundException('Invalid invite token');
    if (invite.status !== InviteStatus.PENDING) {
      throw new ForbiddenException(`Invite has already been ${invite.status}`);
    }
    if (invite.expiresAt < new Date()) {
      invite.status = InviteStatus.EXPIRED;
      await this.inviteRepository.save(invite);
      throw new ForbiddenException('Invite has expired');
    }
    if (invite.email !== email.toLowerCase()) {
      throw new ForbiddenException('Invite email does not match the provided email');
    }

    invite.status = InviteStatus.USED;
    invite.usedAt = new Date();
    invite.usedByUserId = userId;
    return this.inviteRepository.save(invite);
  }

  async validateInviteToken(token: string) {
    const invite = await this.inviteRepository.findOne({ where: { token } });
    if (!invite) return { valid: false, reason: 'not_found' };
    if (invite.status === InviteStatus.USED) return { valid: false, reason: 'already_used' };
    if (invite.status === InviteStatus.REVOKED) return { valid: false, reason: 'revoked' };
    if (invite.expiresAt < new Date() || invite.status === InviteStatus.EXPIRED) {
      return { valid: false, reason: 'expired' };
    }
    return { valid: true, email: invite.email, expiresAt: invite.expiresAt };
  }

  // ── Destination management ─────────────────────────────────────────────────

  async listAllDestinations(
    filters: {
      type?: DestinationType;
      parentId?: string;
      search?: string;
      includeInactive?: boolean;
      page?: number;
      limit?: number;
    },
  ) {
    const { type, parentId, search, includeInactive = true, page = 1, limit = 20 } = filters;

    const qb = this.destinationRepository
      .createQueryBuilder('destination')
      .leftJoinAndSelect('destination.parent', 'parent')
      .leftJoinAndSelect('destination.children', 'children')
      .orderBy('destination.name', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    if (!includeInactive) {
      qb.andWhere('destination.isActive = :isActive', { isActive: true });
    }
    if (type) {
      qb.andWhere('destination.type = :type', { type });
    }
    if (parentId) {
      qb.andWhere('destination.parentId = :parentId', { parentId });
    }
    if (search) {
      qb.andWhere('destination.name ILIKE :search', { search: `%${search}%` });
    }

    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit };
  }

  async createDestination(dto: CreateDestinationDto): Promise<Destination> {
    const baseSlug = slugify(dto.name, { lower: true, strict: true });
    let slug = baseSlug;
    let counter = 1;

    while (await this.destinationRepository.findOne({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const destination = this.destinationRepository.create({ ...dto, slug });
    return this.destinationRepository.save(destination);
  }

  async updateDestination(id: string, dto: Partial<CreateDestinationDto>): Promise<Destination> {
    const destination = await this.destinationRepository.findOne({ where: { id } });
    if (!destination) throw new NotFoundException('Destination not found');

    if (dto.name && dto.name !== destination.name) {
      const baseSlug = slugify(dto.name, { lower: true, strict: true });
      let slug = baseSlug;
      let counter = 1;

      while (true) {
        const existing = await this.destinationRepository.findOne({ where: { slug } });
        if (!existing || existing.id === id) break;
        slug = `${baseSlug}-${counter}`;
        counter++;
      }

      destination.slug = slug;
    }

    Object.assign(destination, dto);
    return this.destinationRepository.save(destination);
  }

  async toggleDestinationStatus(id: string): Promise<Destination> {
    const destination = await this.destinationRepository.findOne({ where: { id } });
    if (!destination) throw new NotFoundException('Destination not found');

    destination.isActive = !destination.isActive;
    return this.destinationRepository.save(destination);
  }

  async deleteDestination(id: string): Promise<{ success: boolean }> {
    const destination = await this.destinationRepository.findOne({ where: { id } });
    if (!destination) throw new NotFoundException('Destination not found');

    await this.destinationRepository.remove(destination);
    return { success: true };
  }

  async getDestinationTree(): Promise<Destination[]> {
    return this.destinationRepository.find({
      where: { type: DestinationType.COUNTRY },
      relations: ['children', 'children.children'],
      order: { name: 'ASC' },
    });
  }

  // ── Subscription plan management ───────────────────────────────────────────

  async listAllPlans(): Promise<SubscriptionPlan[]> {
    return this.planRepository.find({
      order: { price: 'ASC' },
    });
  }

  async createPlan(dto: UpsertSubscriptionPlanDto): Promise<SubscriptionPlan> {
    const plan = this.planRepository.create(dto);
    return this.planRepository.save(plan);
  }

  async updatePlan(id: string, dto: Partial<UpsertSubscriptionPlanDto>): Promise<SubscriptionPlan> {
    const plan = await this.planRepository.findOne({ where: { id } });
    if (!plan) throw new NotFoundException('Subscription plan not found');

    Object.assign(plan, dto);
    return this.planRepository.save(plan);
  }

  async togglePlanStatus(id: string): Promise<SubscriptionPlan> {
    const plan = await this.planRepository.findOne({ where: { id } });
    if (!plan) throw new NotFoundException('Subscription plan not found');

    plan.isActive = !plan.isActive;
    return this.planRepository.save(plan);
  }

  async deletePlan(id: string): Promise<{ success: boolean }> {
    const plan = await this.planRepository.findOne({ where: { id } });
    if (!plan) throw new NotFoundException('Subscription plan not found');

    await this.planRepository.remove(plan);
    return { success: true };
  }
}
