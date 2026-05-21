import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { TipsService } from './tips.service';
import { CreateTipDto } from './dto/create-tip.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { UserRole, TipCategory } from '../../common/enums';
import { User } from '../../database/entities/user.entity';

@ApiTags('tips')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('tips')
export class TipsController {
  constructor(private readonly tipsService: TipsService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'List travel tips (filter by destination/category)' })
  findAll(
    @Query() pagination: PaginationDto,
    @Query('destinationId') destinationId?: string,
    @Query('category') category?: string,
    @Query('creatorId') creatorId?: string,
  ) {
    return this.tipsService.findAll(pagination, {
      destinationId,
      category: category as TipCategory | undefined,
      creatorId,
    });
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get tip by ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.tipsService.findById(id);
  }

  @Post()
  @Roles(UserRole.CREATOR)
  @ApiOperation({ summary: 'Create travel tip (creator only)' })
  create(@Body() dto: CreateTipDto, @CurrentUser() user: User) {
    return this.tipsService.create(user.id, dto);
  }

  @Patch(':id')
  @Roles(UserRole.CREATOR)
  @ApiOperation({ summary: 'Update tip (creator, own tips only)' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: Partial<CreateTipDto>,
    @CurrentUser() user: User,
  ) {
    return this.tipsService.update(id, user.id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.CREATOR)
  @ApiOperation({ summary: 'Delete tip (creator, own tips only)' })
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.tipsService.remove(id, user.id);
  }

  @Post(':id/like')
  @ApiOperation({ summary: 'Like a tip' })
  like(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.tipsService.likeTip(id, user.id);
  }
}
