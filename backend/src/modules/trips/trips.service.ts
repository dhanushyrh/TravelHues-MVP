import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Trip } from '../../database/entities/trip.entity';
import { TripMember } from '../../database/entities/trip-member.entity';
import { TripDay } from '../../database/entities/trip-day.entity';
import { TripItem } from '../../database/entities/trip-item.entity';
import { User } from '../../database/entities/user.entity';
import { TripMemberRole, InviteStatus, TripStatus } from '../../common/enums';
import { CreateTripDto } from './dto/create-trip.dto';
import { UpdateTripDto } from './dto/update-trip.dto';
import { InviteMemberDto } from './dto/invite-member.dto';
import { CreateTripDayDto } from './dto/create-trip-day.dto';
import { CreateTripItemDto } from './dto/create-trip-item.dto';
import { PaginatedResponseDto, PaginationDto } from '../../common/dto/pagination.dto';

@Injectable()
export class TripsService {
  constructor(
    @InjectRepository(Trip)
    private readonly tripRepository: Repository<Trip>,
    @InjectRepository(TripMember)
    private readonly memberRepository: Repository<TripMember>,
    @InjectRepository(TripDay)
    private readonly dayRepository: Repository<TripDay>,
    @InjectRepository(TripItem)
    private readonly itemRepository: Repository<TripItem>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(userId: string, dto: CreateTripDto): Promise<Trip> {
    const trip = this.tripRepository.create({
      ...dto,
      ownerId: userId,
      shareCode: uuidv4().split('-')[0].toUpperCase(),
    });

    const savedTrip = await this.tripRepository.save(trip);

    // Add owner as member
    const ownerMember = this.memberRepository.create({
      tripId: savedTrip.id,
      userId,
      role: TripMemberRole.OWNER,
      inviteStatus: InviteStatus.ACCEPTED,
      acceptedAt: new Date(),
    });
    await this.memberRepository.save(ownerMember);

    return this.findById(savedTrip.id, userId);
  }

  async findUserTrips(
    userId: string,
    pagination: PaginationDto,
  ): Promise<PaginatedResponseDto<Trip>> {
    const { page = 1, limit = 20 } = pagination;
    const skip = (page - 1) * limit;

    const qb = this.tripRepository
      .createQueryBuilder('t')
      .innerJoin('trip_members', 'tm', 'tm."tripId" = t.id')
      .where('tm."userId" = :userId', { userId })
      .andWhere('tm."inviteStatus" = :status', { status: InviteStatus.ACCEPTED })
      .leftJoinAndSelect('t.members', 'members')
      .leftJoinAndSelect('members.user', 'memberUser')
      .orderBy('t.updatedAt', 'DESC')
      .skip(skip)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();
    return PaginatedResponseDto.create(data, total, page, limit);
  }

  async findById(id: string, userId?: string): Promise<Trip> {
    const trip = await this.tripRepository.findOne({
      where: { id },
      relations: ['owner', 'members', 'members.user', 'days', 'days.items'],
    });

    if (!trip) {
      throw new NotFoundException('Trip not found');
    }

    if (!trip.isPublic && userId) {
      await this.checkAccess(id, userId);
    } else if (!trip.isPublic && !userId) {
      throw new ForbiddenException('This trip is private');
    }

    return trip;
  }

  async update(id: string, userId: string, dto: UpdateTripDto): Promise<Trip> {
    await this.checkWriteAccess(id, userId);

    const trip = await this.tripRepository.findOne({ where: { id } });
    Object.assign(trip, dto);
    await this.tripRepository.save(trip);

    return this.findById(id, userId);
  }

  async remove(id: string, userId: string): Promise<void> {
    const trip = await this.tripRepository.findOne({ where: { id } });
    if (!trip) throw new NotFoundException('Trip not found');

    if (trip.ownerId !== userId) {
      throw new ForbiddenException('Only the trip owner can delete this trip');
    }

    await this.tripRepository.remove(trip);
  }

  async inviteMember(tripId: string, userId: string, dto: InviteMemberDto): Promise<TripMember> {
    await this.checkWriteAccess(tripId, userId);

    let inviteeId = dto.userId;

    if (!inviteeId && dto.email) {
      const user = await this.userRepository.findOne({
        where: { email: dto.email.toLowerCase() },
      });
      if (user) {
        inviteeId = user.id;
      }
    }

    if (!inviteeId && !dto.email) {
      throw new BadRequestException('Either userId or email is required');
    }

    if (inviteeId) {
      const existing = await this.memberRepository.findOne({
        where: { tripId, userId: inviteeId },
      });
      if (existing) {
        throw new ConflictException('User is already a member of this trip');
      }
    }

    const member = this.memberRepository.create({
      tripId,
      userId: inviteeId || null,
      role: dto.role,
      inviteStatus: inviteeId ? InviteStatus.PENDING : InviteStatus.PENDING,
      inviteEmail: dto.email,
      inviteToken: uuidv4(),
      inviteExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });

    return this.memberRepository.save(member);
  }

  async updateMemberRole(
    tripId: string,
    requestUserId: string,
    targetUserId: string,
    role: TripMemberRole,
  ): Promise<TripMember> {
    await this.checkOwnerAccess(tripId, requestUserId);

    const member = await this.memberRepository.findOne({
      where: { tripId, userId: targetUserId },
    });

    if (!member) {
      throw new NotFoundException('Member not found in this trip');
    }

    if (member.role === TripMemberRole.OWNER) {
      throw new ForbiddenException('Cannot change the role of the trip owner');
    }

    member.role = role;
    return this.memberRepository.save(member);
  }

  async removeMember(
    tripId: string,
    requestUserId: string,
    targetUserId: string,
  ): Promise<void> {
    const trip = await this.tripRepository.findOne({ where: { id: tripId } });
    if (!trip) throw new NotFoundException('Trip not found');

    // Owner can remove anyone, members can only remove themselves
    if (requestUserId !== targetUserId) {
      await this.checkOwnerAccess(tripId, requestUserId);
    }

    const member = await this.memberRepository.findOne({
      where: { tripId, userId: targetUserId },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    if (member.role === TripMemberRole.OWNER) {
      throw new ForbiddenException('Cannot remove the trip owner');
    }

    await this.memberRepository.remove(member);
  }

  async addDay(tripId: string, userId: string, dto: CreateTripDayDto): Promise<TripDay> {
    await this.checkWriteAccess(tripId, userId);

    const existingDay = await this.dayRepository.findOne({
      where: { tripId, dayNumber: dto.dayNumber },
    });

    if (existingDay) {
      throw new ConflictException(`Day ${dto.dayNumber} already exists for this trip`);
    }

    const day = this.dayRepository.create({ ...dto, tripId });
    return this.dayRepository.save(day);
  }

  async updateDay(
    tripId: string,
    dayId: string,
    userId: string,
    dto: Partial<CreateTripDayDto>,
  ): Promise<TripDay> {
    await this.checkWriteAccess(tripId, userId);

    const day = await this.dayRepository.findOne({
      where: { id: dayId, tripId },
    });

    if (!day) {
      throw new NotFoundException('Trip day not found');
    }

    Object.assign(day, dto);
    return this.dayRepository.save(day);
  }

  async removeDay(tripId: string, dayId: string, userId: string): Promise<void> {
    await this.checkWriteAccess(tripId, userId);

    const day = await this.dayRepository.findOne({
      where: { id: dayId, tripId },
    });

    if (!day) {
      throw new NotFoundException('Trip day not found');
    }

    await this.dayRepository.remove(day);
  }

  async addItem(
    tripId: string,
    dayId: string,
    userId: string,
    dto: CreateTripItemDto,
  ): Promise<TripItem> {
    await this.checkWriteAccess(tripId, userId);

    const day = await this.dayRepository.findOne({ where: { id: dayId, tripId } });
    if (!day) {
      throw new NotFoundException('Trip day not found');
    }

    const item = this.itemRepository.create({ ...dto, dayId });
    return this.itemRepository.save(item);
  }

  async updateItem(
    tripId: string,
    dayId: string,
    itemId: string,
    userId: string,
    dto: Partial<CreateTripItemDto>,
  ): Promise<TripItem> {
    await this.checkWriteAccess(tripId, userId);

    const day = await this.dayRepository.findOne({ where: { id: dayId, tripId } });
    if (!day) throw new NotFoundException('Trip day not found');

    const item = await this.itemRepository.findOne({ where: { id: itemId, dayId } });
    if (!item) throw new NotFoundException('Trip item not found');

    Object.assign(item, dto);
    return this.itemRepository.save(item);
  }

  async removeItem(
    tripId: string,
    dayId: string,
    itemId: string,
    userId: string,
  ): Promise<void> {
    await this.checkWriteAccess(tripId, userId);

    const day = await this.dayRepository.findOne({ where: { id: dayId, tripId } });
    if (!day) throw new NotFoundException('Trip day not found');

    const item = await this.itemRepository.findOne({ where: { id: itemId, dayId } });
    if (!item) throw new NotFoundException('Trip item not found');

    await this.itemRepository.remove(item);
  }

  private async checkAccess(tripId: string, userId: string): Promise<TripMember> {
    const member = await this.memberRepository.findOne({
      where: { tripId, userId, inviteStatus: InviteStatus.ACCEPTED },
    });

    if (!member) {
      throw new ForbiddenException('You do not have access to this trip');
    }

    return member;
  }

  private async checkWriteAccess(tripId: string, userId: string): Promise<TripMember> {
    const member = await this.memberRepository.findOne({
      where: { tripId, userId, inviteStatus: InviteStatus.ACCEPTED },
    });

    if (!member) {
      throw new ForbiddenException('You do not have access to this trip');
    }

    if (member.role === TripMemberRole.VIEWER) {
      throw new ForbiddenException('Viewers cannot modify this trip');
    }

    return member;
  }

  private async checkOwnerAccess(tripId: string, userId: string): Promise<void> {
    const trip = await this.tripRepository.findOne({ where: { id: tripId } });
    if (!trip) throw new NotFoundException('Trip not found');

    if (trip.ownerId !== userId) {
      throw new ForbiddenException('Only the trip owner can perform this action');
    }
  }
}
