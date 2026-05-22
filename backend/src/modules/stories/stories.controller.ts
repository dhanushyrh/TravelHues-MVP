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
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { StoriesService } from './stories.service';
import { CreateStoryDto } from './dto/create-story.dto';
import { UpdateStoryDto } from './dto/update-story.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums';
import { User } from '../../database/entities/user.entity';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { ParseUuidPipe } from '../../common/pipes/parse-uuid.pipe';

@ApiTags('Stories')
@ApiBearerAuth()
@Controller('stories')
export class StoriesController {
  constructor(private readonly storiesService: StoriesService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List public stories (optionally filtered by country)' })
  async getPublic(
    @Query() pagination: PaginationDto,
    @Query('countryId') countryId?: string,
  ) {
    return this.storiesService.getPublicStories(countryId, pagination);
  }

  @Get('me')
  @Roles(UserRole.CREATOR, UserRole.ADMIN)
  @ApiOperation({ summary: "List creator's own stories" })
  async getMyStories(
    @CurrentUser() user: User,
    @Query() pagination: PaginationDto,
  ) {
    return this.storiesService.findByCreator(user.id, pagination);
  }

  @Post()
  @Roles(UserRole.CREATOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new story' })
  async create(@CurrentUser() user: User, @Body() dto: CreateStoryDto) {
    return this.storiesService.create(user.id, dto);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get story detail by ID' })
  async getById(@Param('id', ParseUuidPipe) id: string) {
    return this.storiesService.findById(id);
  }

  @Patch(':id')
  @Roles(UserRole.CREATOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update story metadata' })
  async update(
    @Param('id', ParseUuidPipe) id: string,
    @CurrentUser() user: User,
    @Body() dto: UpdateStoryDto,
  ) {
    return this.storiesService.update(id, user.id, dto);
  }

  @Patch(':id/publish')
  @Roles(UserRole.CREATOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Toggle story publish status' })
  async togglePublish(
    @Param('id', ParseUuidPipe) id: string,
    @CurrentUser() user: User,
  ) {
    return this.storiesService.publish(id, user.id);
  }

  @Delete(':id')
  @Roles(UserRole.CREATOR, UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a story' })
  async remove(
    @Param('id', ParseUuidPipe) id: string,
    @CurrentUser() user: User,
  ) {
    return this.storiesService.remove(id, user.id);
  }

  @Post(':id/products/:productId')
  @Roles(UserRole.CREATOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Add a product to a story' })
  async addProduct(
    @Param('id', ParseUuidPipe) id: string,
    @Param('productId', ParseUuidPipe) productId: string,
    @CurrentUser() user: User,
  ) {
    return this.storiesService.addProduct(id, user.id, productId);
  }

  @Delete(':id/products/:productId')
  @Roles(UserRole.CREATOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Remove a product from a story' })
  async removeProduct(
    @Param('id', ParseUuidPipe) id: string,
    @Param('productId', ParseUuidPipe) productId: string,
    @CurrentUser() user: User,
  ) {
    return this.storiesService.removeProduct(id, user.id, productId);
  }

  @Post(':id/tips/:tipId')
  @Roles(UserRole.CREATOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Add a tip to a story' })
  async addTip(
    @Param('id', ParseUuidPipe) id: string,
    @Param('tipId', ParseUuidPipe) tipId: string,
    @CurrentUser() user: User,
  ) {
    return this.storiesService.addTip(id, user.id, tipId);
  }

  @Delete(':id/tips/:tipId')
  @Roles(UserRole.CREATOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Remove a tip from a story' })
  async removeTip(
    @Param('id', ParseUuidPipe) id: string,
    @Param('tipId', ParseUuidPipe) tipId: string,
    @CurrentUser() user: User,
  ) {
    return this.storiesService.removeTip(id, user.id, tipId);
  }

  @Post(':id/content/:contentId')
  @Roles(UserRole.CREATOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Add a content item to a story' })
  async addContent(
    @Param('id', ParseUuidPipe) id: string,
    @Param('contentId', ParseUuidPipe) contentId: string,
    @CurrentUser() user: User,
  ) {
    return this.storiesService.addContent(id, user.id, contentId);
  }

  @Delete(':id/content/:contentId')
  @Roles(UserRole.CREATOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Remove a content item from a story' })
  async removeContent(
    @Param('id', ParseUuidPipe) id: string,
    @Param('contentId', ParseUuidPipe) contentId: string,
    @CurrentUser() user: User,
  ) {
    return this.storiesService.removeContent(id, user.id, contentId);
  }
}
