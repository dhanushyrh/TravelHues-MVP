import { Controller, Get, Post, Delete, Param, Body, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../../database/entities/user.entity';

@ApiTags('subscriptions')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get('plans')
  @Public()
  @ApiOperation({ summary: 'List all subscription plans' })
  getPlans() {
    return this.subscriptionsService.getPlans();
  }

  @Get('my')
  @ApiOperation({ summary: 'Get current user subscriptions' })
  getMine(@CurrentUser() user: User) {
    return this.subscriptionsService.getUserSubscriptions(user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Subscribe to a plan' })
  subscribe(@Body() body: { planId: string; creatorId?: string }, @CurrentUser() user: User) {
    return this.subscriptionsService.subscribe(user.id, body.planId, body.creatorId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Cancel subscription' })
  cancel(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.subscriptionsService.cancel(id, user.id);
  }
}
