import {
  Controller, Get, Post, Delete, Body, Param, Query, UseGuards, ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { CreateInviteDto } from './dto/create-invite.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { UserRole, InviteStatus } from '../../common/enums';
import { User } from '../../database/entities/user.entity';

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
  getInvite(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.getInvite(id);
  }

  @Delete('invites/:id')
  @ApiOperation({ summary: 'Revoke a pending invite (admin only)' })
  revokeInvite(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.adminService.revokeInvite(id, user.id);
  }
}
