import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { CreatorsService } from './creators.service';
import { CreateCreatorProfileDto } from './dto/create-creator-profile.dto';
import { UpdateCreatorProfileDto } from './dto/update-creator-profile.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums';
import { User } from '../../database/entities/user.entity';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { ParseUuidPipe } from '../../common/pipes/parse-uuid.pipe';

@ApiTags('Creators')
@ApiBearerAuth()
@Controller('creators')
export class CreatorsController {
  constructor(private readonly creatorsService: CreatorsService) {}

  @Post('apply')
  @ApiOperation({ summary: 'Apply to become a creator' })
  async apply(
    @CurrentUser() user: User,
    @Body() dto: CreateCreatorProfileDto,
  ) {
    return this.creatorsService.applyToBeCreator(user.id, dto);
  }

  @Get('me')
  @Roles(UserRole.CREATOR, UserRole.ADMIN)
  @ApiOperation({ summary: "Get creator's own profile" })
  async getMyProfile(@CurrentUser() user: User) {
    return this.creatorsService.findOwnProfile(user.id);
  }

  @Patch('me')
  @Roles(UserRole.CREATOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update creator profile' })
  async updateMyProfile(
    @CurrentUser() user: User,
    @Body() dto: UpdateCreatorProfileDto,
  ) {
    return this.creatorsService.updateProfile(user.id, dto);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'List all creators with optional filters' })
  @ApiQuery({ name: 'destination', required: false })
  @ApiQuery({ name: 'specialty', required: false })
  @ApiQuery({ name: 'search', required: false })
  async listCreators(
    @Query() pagination: PaginationDto,
    @Query('destination') destination?: string,
    @Query('specialty') specialty?: string,
    @Query('search') search?: string,
  ) {
    return this.creatorsService.findAll(pagination, { destination, specialty, search });
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get public creator profile with stats' })
  async getCreatorProfile(@Param('id', ParseUuidPipe) id: string) {
    const profile = await this.creatorsService.findById(id);
    const stats = await this.creatorsService.getCreatorStats(id);
    return { ...profile, stats };
  }

  @Public()
  @Get(':id/content')
  @ApiOperation({ summary: "Get creator's content" })
  async getCreatorContent(
    @Param('id', ParseUuidPipe) id: string,
    @Query() pagination: PaginationDto,
  ) {
    // Content is handled by ContentModule but we return the creator's content here
    const profile = await this.creatorsService.findById(id);
    return { creatorId: id, message: 'Use /content?creatorId=' + id };
  }

  @Public()
  @Get(':id/products')
  @ApiOperation({ summary: "Get creator's products" })
  async getCreatorProducts(
    @Param('id', ParseUuidPipe) id: string,
    @Query() pagination: PaginationDto,
  ) {
    const profile = await this.creatorsService.findById(id);
    return { creatorId: id, message: 'Use /products?creatorId=' + id };
  }

  @Public()
  @Get(':id/tips')
  @ApiOperation({ summary: "Get creator's tips" })
  async getCreatorTips(
    @Param('id', ParseUuidPipe) id: string,
    @Query() pagination: PaginationDto,
  ) {
    const profile = await this.creatorsService.findById(id);
    return { creatorId: id, message: 'Use /tips?creatorId=' + id };
  }
}
