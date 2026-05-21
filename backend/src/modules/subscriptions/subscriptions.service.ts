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
      order: { price: 'ASC' },
    });
  }

  async getUserSubscriptions(subscriberId: string) {
    return this.subscriptionRepository.find({
      where: { subscriberId, status: SubscriptionStatus.ACTIVE },
      relations: ['plan'],
    });
  }

  async subscribe(subscriberId: string, planId: string, creatorId?: string) {
    const plan = await this.planRepository.findOne({ where: { id: planId, isActive: true } });
    if (!plan) throw new NotFoundException('Subscription plan not found');

    const existing = await this.subscriptionRepository.findOne({
      where: {
        subscriberId,
        planId,
        ...(creatorId ? { creatorId } : {}),
        status: SubscriptionStatus.ACTIVE,
      },
    });
    if (existing) throw new ConflictException('Already subscribed to this plan');

    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + (plan.billingPeriod === 'yearly' ? 12 : 1));

    const subscription = this.subscriptionRepository.create({
      subscriberId,
      planId,
      planType: plan.type,
      creatorId,
      status: SubscriptionStatus.ACTIVE,
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
    });

    return this.subscriptionRepository.save(subscription);
  }

  async cancel(id: string, subscriberId: string) {
    const subscription = await this.subscriptionRepository.findOne({
      where: { id, subscriberId },
    });
    if (!subscription) throw new NotFoundException('Subscription not found');

    subscription.status = SubscriptionStatus.CANCELLED;
    subscription.cancelAtPeriodEnd = true;
    subscription.cancelledAt = new Date();
    return this.subscriptionRepository.save(subscription);
  }
}
