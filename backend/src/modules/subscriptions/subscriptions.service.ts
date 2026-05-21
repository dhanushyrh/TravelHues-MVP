import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subscription } from '../../database/entities/subscription.entity';
import { SubscriptionPlan } from '../../database/entities/subscription-plan.entity';
import { SubscriptionStatus } from '../../common/enums';

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectRepository(Subscription) private readonly subscriptionRepository: Repository<Subscription>,
    @InjectRepository(SubscriptionPlan) private readonly planRepository: Repository<SubscriptionPlan>,
  ) {}

  async getPlans() {
    return this.planRepository.find({
      where: { isActive: true },
      order: { sortOrder: 'ASC' },
    });
  }

  async getUserSubscriptions(userId: string) {
    return this.subscriptionRepository.find({
      where: { subscriberId: userId, status: SubscriptionStatus.ACTIVE },
      relations: ['plan'],
    });
  }

  async subscribe(userId: string, planId: string, creatorId?: string) {
    const plan = await this.planRepository.findOne({ where: { id: planId, isActive: true } });
    if (!plan) throw new NotFoundException('Subscription plan not found');

    const existing = await this.subscriptionRepository.findOne({
      where: { subscriberId: userId, planId, creatorId: creatorId ?? null, status: SubscriptionStatus.ACTIVE },
    });
    if (existing) throw new ConflictException('Already subscribed to this plan');

    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + (plan.billingPeriod === 'yearly' ? 12 : 1));

    const subscription = this.subscriptionRepository.create({
      subscriberId: userId,
      planId,
      creatorId,
      status: SubscriptionStatus.ACTIVE,
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
    });

    return this.subscriptionRepository.save(subscription);
  }

  async cancel(id: string, userId: string) {
    const subscription = await this.subscriptionRepository.findOne({
      where: { id, subscriberId: userId },
    });
    if (!subscription) throw new NotFoundException('Subscription not found');

    subscription.status = SubscriptionStatus.CANCELLED;
    subscription.cancelAtPeriodEnd = true;
    return this.subscriptionRepository.save(subscription);
  }
}
