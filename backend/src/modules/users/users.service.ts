import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../database/entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id, isActive: true },
      relations: ['creatorProfile'],
    });
    return user;
  }

  async findByIdOrFail(id: string): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findByEmail(email: string): Promise<User> {
    return this.userRepository.findOne({
      where: { email: email.toLowerCase().trim(), isActive: true },
    });
  }

  async getPublicProfile(id: string): Promise<Partial<User>> {
    const user = await this.userRepository.findOne({
      where: { id, isActive: true },
      relations: ['creatorProfile'],
      select: [
        'id',
        'firstName',
        'lastName',
        'avatarUrl',
        'bio',
        'location',
        'website',
        'role',
        'createdAt',
      ],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateProfile(userId: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.findByIdOrFail(userId);

    Object.assign(user, dto);
    return this.userRepository.save(user);
  }

  async softDelete(userId: string): Promise<void> {
    const user = await this.findByIdOrFail(userId);
    await this.userRepository.update(userId, {
      isActive: false,
      email: `deleted_${userId}_${user.email}`, // Prevent email conflicts
    });
  }

  async uploadAvatar(userId: string, avatarUrl: string): Promise<User> {
    await this.findByIdOrFail(userId);
    await this.userRepository.update(userId, { avatarUrl });
    return this.findById(userId);
  }

  async countFollowers(userId: string): Promise<number> {
    return this.userRepository
      .createQueryBuilder('user')
      .innerJoin('follows', 'f', 'f."followingId" = user.id')
      .where('f."followingId" = :userId', { userId })
      .getCount();
  }

  async countFollowing(userId: string): Promise<number> {
    return this.userRepository
      .createQueryBuilder('user')
      .innerJoin('follows', 'f', 'f."followerId" = user.id')
      .where('f."followerId" = :userId', { userId })
      .getCount();
  }
}
