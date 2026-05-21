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

  async findAll(recipientId: string, pagination: PaginationDto) {
    const { page = 1, limit = 20 } = pagination;
    const [data, total] = await this.notificationRepository.findAndCount({
      where: { recipientId },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: (page - 1) * limit,
    });
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async getUnreadCount(recipientId: string) {
    const count = await this.notificationRepository.count({
      where: { recipientId, isRead: false },
    });
    return { count };
  }

  async markRead(id: string, recipientId: string) {
    await this.notificationRepository.update(
      { id, recipientId },
      { isRead: true, readAt: new Date() },
    );
    return { success: true };
  }

  async markAllRead(recipientId: string) {
    await this.notificationRepository.update(
      { recipientId, isRead: false },
      { isRead: true, readAt: new Date() },
    );
    return { success: true };
  }

  async create(
    recipientId: string,
    type: NotificationType,
    title: string,
    body: string,
    data?: Record<string, any>,
    senderId?: string,
  ) {
    const notification = this.notificationRepository.create({
      recipientId,
      type,
      title,
      body,
      data,
      senderId,
    });
    return this.notificationRepository.save(notification);
  }
}
