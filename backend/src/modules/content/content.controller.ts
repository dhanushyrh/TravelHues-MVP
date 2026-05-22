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
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { ContentService } from './content.service';
import { CreateContentDto } from './dto/create-content.dto';
import { UpdateContentDto } from './dto/update-content.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole, ContentType } from '../../common/enums';
import { User } from '../../database/entities/user.entity';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { ParseUuidPipe } from '../../common/pipes/parse-uuid.pipe';

import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
@ApiTags('Content')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('content')
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get content feed (paginated, filterable)' })
  @ApiQuery({ name: 'destinationId', required: false })
  @ApiQuery({ name: 'type', enum: ContentType, required: false })
  @ApiQuery({ name: 'creatorId', required: false })
  async getFeed(
    @Query() pagination: PaginationDto,
    @Query('destinationId') destinationId?: string,
    @Query('type') type?: ContentType,
    @Query('creatorId') creatorId?: string,
    @CurrentUser() user?: User,
  ) {
    return this.contentService.findFeed(pagination, {
      destinationId,
      type,
      creatorId,
      userId: user?.id,
    });
  }

  @Post()
  @Roles(UserRole.CREATOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create new content (creator only)' })
  async create(@CurrentUser() user: User, @Body() dto: CreateContentDto) {
    return this.contentService.create(user.id, dto);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get content by ID' })
  async findOne(@Param('id', ParseUuidPipe) id: string) {
    return this.contentService.findById(id);
  }

  @Patch(':id')
  @Roles(UserRole.CREATOR, UserRole.ADMIN)
  @ApiOperation({ summary: "Update creator's own content" })
  async update(
    @Param('id', ParseUuidPipe) id: string,
    @CurrentUser() user: User,
    @Body() dto: UpdateContentDto,
  ) {
    return this.contentService.update(id, user.id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(UserRole.CREATOR, UserRole.ADMIN)
  @ApiOperation({ summary: "Delete creator's own content" })
  async remove(
    @Param('id', ParseUuidPipe) id: string,
    @CurrentUser() user: User,
  ) {
    await this.contentService.remove(id, user.id);
  }

  @Post(':id/like')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Like a piece of content' })
  async likeContent(
    @Param('id', ParseUuidPipe) id: string,
    @CurrentUser() user: User,
  ) {
    await this.contentService.likeContent(id, user.id);
  }

  @Delete(':id/like')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Unlike a piece of content' })
  async unlikeContent(
    @Param('id', ParseUuidPipe) id: string,
    @CurrentUser() user: User,
  ) {
    await this.contentService.unlikeContent(id, user.id);
  }

  @Public()
  @Get(':id/comments')
  @ApiOperation({ summary: 'Get comments for a piece of content' })
  async getComments(
    @Param('id', ParseUuidPipe) id: string,
    @Query() pagination: PaginationDto,
  ) {
    return this.contentService.getComments(id, pagination);
  }

  @Post(':id/comments')
  @ApiOperation({ summary: 'Add a comment to content' })
  async addComment(
    @Param('id', ParseUuidPipe) id: string,
    @CurrentUser() user: User,
    @Body() dto: CreateCommentDto,
  ) {
    return this.contentService.addComment(id, user.id, dto);
  }
}
