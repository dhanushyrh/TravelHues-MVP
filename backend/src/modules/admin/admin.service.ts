import {
  Injectable,
  ConflictException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { CreatorInvite } from '../../database/entities/creator-invite.entity';
import { User } from '../../database/entities/user.entity';
import { InviteStatus } from '../../common/enums';
import { CreateInviteDto } from './dto/create-invite.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

const INVITE_EXPIRY_DAYS = 7;

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(CreatorInvite)
    private readonly inviteRepository: Repository<CreatorInvite>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
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
}
