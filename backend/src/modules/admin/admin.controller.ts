import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { CreateInviteDto } from './dto/create-invite.dto';
import { UpsertSubscriptionPlanDto } from './dto/upsert-subscription-plan.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { ParseUuidPipe } from '../../common/pipes/parse-uuid.pipe';
import { UserRole, InviteStatus, DestinationType } from '../../common/enums';
import { User } from '../../database/entities/user.entity';
import { CreateDestinationDto } from '../destinations/dto/create-destination.dto';

@ApiTags('admin')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ── Invite management ──────────────────────────────────────────────────────

  @Post('invites')
  @ApiOperation({ summary: 'Create creator invite for a specific email (admin only)' })
  createInvite(@Body() dto: CreateInviteDto, @CurrentUser() user: User) {
    return this.adminService.createInvite(dto, user.id);
  }

  @Get('invites')
  @ApiOperation({ summary: 'List all creator invites (admin only)' })
  @ApiQuery({ name: 'status', enum: InviteStatus, required: false })
  listInvites(
    @Query() pagination: PaginationDto,
    @Query('status') status?: InviteStatus,
  ) {
    return this.adminService.listInvites(pagination, status);
  }

  @Get('invites/stats')
  @ApiOperation({ summary: 'Get invite statistics (admin only)' })
  inviteStats() {
    return this.adminService.getInviteStats();
  }

  @Get('invites/:id')
  @ApiOperation({ summary: 'Get invite details (admin only)' })
  getInvite(@Param('id', ParseUuidPipe) id: string) {
    return this.adminService.getInvite(id);
  }

  @Delete('invites/:id')
  @ApiOperation({ summary: 'Revoke a pending invite (admin only)' })
  revokeInvite(@Param('id', ParseUuidPipe) id: string, @CurrentUser() user: User) {
    return this.adminService.revokeInvite(id, user.id);
  }

  // ── Destination management ─────────────────────────────────────────────────

  @Get('destinations')
  @ApiOperation({ summary: 'List all destinations with optional filters (admin only)' })
  @ApiQuery({ name: 'type', enum: DestinationType, required: false })
  @ApiQuery({ name: 'parentId', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'includeInactive', required: false, type: Boolean })
  listAllDestinations(
    @Query() pagination: PaginationDto,
    @Query('type') type?: DestinationType,
    @Query('parentId') parentId?: string,
    @Query('search') search?: string,
    @Query('includeInactive') includeInactive?: string,
  ) {
    return this.adminService.listAllDestinations({
      type,
      parentId,
      search,
      includeInactive: includeInactive !== 'false',
      page: pagination.page,
      limit: pagination.limit,
    });
  }

  @Get('destinations/tree')
  @ApiOperation({ summary: 'Get destination hierarchy tree (countries > cities > regions) (admin only)' })
  getDestinationTree() {
    return this.adminService.getDestinationTree();
  }

  @Post('destinations')
  @ApiOperation({ summary: 'Create a new destination (admin only)' })
  createDestination(@Body() dto: CreateDestinationDto) {
    return this.adminService.createDestination(dto);
  }

  @Patch('destinations/:id')
  @ApiOperation({ summary: 'Update a destination (admin only)' })
  updateDestination(
    @Param('id', ParseUuidPipe) id: string,
    @Body() dto: Partial<CreateDestinationDto>,
  ) {
    return this.adminService.updateDestination(id, dto);
  }

  @Patch('destinations/:id/toggle-status')
  @ApiOperation({ summary: 'Toggle destination active status (admin only)' })
  toggleDestinationStatus(@Param('id', ParseUuidPipe) id: string) {
    return this.adminService.toggleDestinationStatus(id);
  }

  @Delete('destinations/:id')
  @ApiOperation({ summary: 'Hard delete a destination (admin only)' })
  deleteDestination(@Param('id', ParseUuidPipe) id: string) {
    return this.adminService.deleteDestination(id);
  }

  // ── Subscription plan management ───────────────────────────────────────────

  @Get('subscription-plans')
  @ApiOperation({ summary: 'List all subscription plans ordered by price (admin only)' })
  listAllPlans() {
    return this.adminService.listAllPlans();
  }

  @Post('subscription-plans')
  @ApiOperation({ summary: 'Create a new subscription plan (admin only)' })
  createPlan(@Body() dto: UpsertSubscriptionPlanDto) {
    return this.adminService.createPlan(dto);
  }

  @Patch('subscription-plans/:id')
  @ApiOperation({ summary: 'Update a subscription plan (admin only)' })
  updatePlan(
    @Param('id', ParseUuidPipe) id: string,
    @Body() dto: Partial<UpsertSubscriptionPlanDto>,
  ) {
    return this.adminService.updatePlan(id, dto);
  }

  @Patch('subscription-plans/:id/toggle-status')
  @ApiOperation({ summary: 'Toggle subscription plan active status (admin only)' })
  togglePlanStatus(@Param('id', ParseUuidPipe) id: string) {
    return this.adminService.togglePlanStatus(id);
  }

  @Delete('subscription-plans/:id')
  @ApiOperation({ summary: 'Delete a subscription plan (admin only)' })
  deletePlan(@Param('id', ParseUuidPipe) id: string) {
    return this.adminService.deletePlan(id);
  }
}
