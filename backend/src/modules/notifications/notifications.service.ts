import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '../../database/entities/notification.entity';
import { NotificationType } from '../../common/enums';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
  ) {}

  async findAll(userId: string, pagination: PaginationDto) {
    const { page = 1, limit = 20 } = pagination;
    const [data, total] = await this.notificationRepository.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: (page - 1) * limit,
    });
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async getUnreadCount(userId: string) {
    const count = await this.notificationRepository.count({
      where: { userId, isRead: false },
    });
    return { count };
  }

  async markRead(id: string, userId: string) {
    await this.notificationRepository.update({ id, userId }, { isRead: true, readAt: new Date() });
    return { success: true };
  }

  async markAllRead(userId: string) {
    await this.notificationRepository.update({ userId, isRead: false }, { isRead: true, readAt: new Date() });
    return { success: true };
  }

  async create(userId: string, type: NotificationType, title: string, body: string, data?: Record<string, any>) {
    const notification = this.notificationRepository.create({ userId, type, title, body, data });
    return this.notificationRepository.save(notification);
  }
}
