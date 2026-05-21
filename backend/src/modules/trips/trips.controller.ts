import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { TripsService } from './trips.service';
import { CreateTripDto } from './dto/create-trip.dto';
import { UpdateTripDto } from './dto/update-trip.dto';
import { InviteMemberDto } from './dto/invite-member.dto';
import { CreateTripDayDto } from './dto/create-trip-day.dto';
import { CreateTripItemDto } from './dto/create-trip-item.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../../database/entities/user.entity';
import { TripMemberRole } from '../../common/enums';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { ParseUuidPipe } from '../../common/pipes/parse-uuid.pipe';
import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

class UpdateMemberRoleDto {
  @ApiProperty({ enum: TripMemberRole })
  @IsEnum(TripMemberRole)
  role: TripMemberRole;
}

@ApiTags('Trips')
@ApiBearerAuth()
@Controller('trips')
export class TripsController {
  constructor(private readonly tripsService: TripsService) {}

  @Get()
  @ApiOperation({ summary: "Get user's trips" })
  async getUserTrips(
    @CurrentUser() user: User,
    @Query() pagination: PaginationDto,
  ) {
    return this.tripsService.findUserTrips(user.id, pagination);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new trip' })
  async create(@CurrentUser() user: User, @Body() dto: CreateTripDto) {
    return this.tripsService.create(user.id, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a trip by ID' })
  async findOne(
    @Param('id', ParseUuidPipe) id: string,
    @CurrentUser() user: User,
  ) {
    return this.tripsService.findById(id, user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a trip' })
  async update(
    @Param('id', ParseUuidPipe) id: string,
    @CurrentUser() user: User,
    @Body() dto: UpdateTripDto,
  ) {
    return this.tripsService.update(id, user.id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a trip (owner only)' })
  async remove(
    @Param('id', ParseUuidPipe) id: string,
    @CurrentUser() user: User,
  ) {
    await this.tripsService.remove(id, user.id);
  }

  // Members
  @Post(':id/members')
  @ApiOperation({ summary: 'Invite a member to a trip' })
  async inviteMember(
    @Param('id', ParseUuidPipe) id: string,
    @CurrentUser() user: User,
    @Body() dto: InviteMemberDto,
  ) {
    return this.tripsService.inviteMember(id, user.id, dto);
  }

  @Patch(':id/members/:userId')
  @ApiOperation({ summary: 'Update member role' })
  async updateMemberRole(
    @Param('id', ParseUuidPipe) id: string,
    @Param('userId', ParseUuidPipe) targetUserId: string,
    @CurrentUser() user: User,
    @Body() dto: UpdateMemberRoleDto,
  ) {
    return this.tripsService.updateMemberRole(id, user.id, targetUserId, dto.role);
  }

  @Delete(':id/members/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a member from a trip' })
  async removeMember(
    @Param('id', ParseUuidPipe) id: string,
    @Param('userId', ParseUuidPipe) targetUserId: string,
    @CurrentUser() user: User,
  ) {
    await this.tripsService.removeMember(id, user.id, targetUserId);
  }

  // Days
  @Post(':id/days')
  @ApiOperation({ summary: 'Add a day to a trip' })
  async addDay(
    @Param('id', ParseUuidPipe) id: string,
    @CurrentUser() user: User,
    @Body() dto: CreateTripDayDto,
  ) {
    return this.tripsService.addDay(id, user.id, dto);
  }

  @Patch(':id/days/:dayId')
  @ApiOperation({ summary: 'Update a trip day' })
  async updateDay(
    @Param('id', ParseUuidPipe) id: string,
    @Param('dayId', ParseUuidPipe) dayId: string,
    @CurrentUser() user: User,
    @Body() dto: Partial<CreateTripDayDto>,
  ) {
    return this.tripsService.updateDay(id, dayId, user.id, dto);
  }

  @Delete(':id/days/:dayId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a trip day' })
  async removeDay(
    @Param('id', ParseUuidPipe) id: string,
    @Param('dayId', ParseUuidPipe) dayId: string,
    @CurrentUser() user: User,
  ) {
    await this.tripsService.removeDay(id, dayId, user.id);
  }

  // Items
  @Post(':id/days/:dayId/items')
  @ApiOperation({ summary: 'Add an item to a trip day' })
  async addItem(
    @Param('id', ParseUuidPipe) id: string,
    @Param('dayId', ParseUuidPipe) dayId: string,
    @CurrentUser() user: User,
    @Body() dto: CreateTripItemDto,
  ) {
    return this.tripsService.addItem(id, dayId, user.id, dto);
  }

  @Patch(':id/days/:dayId/items/:itemId')
  @ApiOperation({ summary: 'Update a trip item' })
  async updateItem(
    @Param('id', ParseUuidPipe) id: string,
    @Param('dayId', ParseUuidPipe) dayId: string,
    @Param('itemId', ParseUuidPipe) itemId: string,
    @CurrentUser() user: User,
    @Body() dto: Partial<CreateTripItemDto>,
  ) {
    return this.tripsService.updateItem(id, dayId, itemId, user.id, dto);
  }

  @Delete(':id/days/:dayId/items/:itemId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove an item from a trip day' })
  async removeItem(
    @Param('id', ParseUuidPipe) id: string,
    @Param('dayId', ParseUuidPipe) dayId: string,
    @Param('itemId', ParseUuidPipe) itemId: string,
    @CurrentUser() user: User,
  ) {
    await this.tripsService.removeItem(id, dayId, itemId, user.id);
  }
}
