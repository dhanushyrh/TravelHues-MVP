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
import { DestinationsService } from './destinations.service';
import { CreateDestinationDto } from './dto/create-destination.dto';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole, DestinationType } from '../../common/enums';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { ParseUuidPipe } from '../../common/pipes/parse-uuid.pipe';

@ApiTags('Destinations')
@Controller('destinations')
export class DestinationsController {
  constructor(private readonly destinationsService: DestinationsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List all destinations with optional filters' })
  @ApiQuery({ name: 'type', enum: DestinationType, required: false })
  @ApiQuery({ name: 'continent', required: false })
  @ApiQuery({ name: 'search', required: false })
  async listDestinations(
    @Query() pagination: PaginationDto,
    @Query('type') type?: DestinationType,
    @Query('continent') continent?: string,
    @Query('search') search?: string,
  ) {
    return this.destinationsService.findAll(pagination, { type, continent, search });
  }

  @Public()
  @Get('countries')
  @ApiOperation({ summary: 'List all countries' })
  async listCountries(@Query() pagination: PaginationDto) {
    return this.destinationsService.findCountries(pagination);
  }

  @Public()
  @Get(':slug')
  @ApiOperation({ summary: 'Get destination details by slug' })
  async getDestination(@Param('slug') slug: string) {
    const destination = await this.destinationsService.findBySlug(slug);
    const stats = await this.destinationsService.getDestinationStats(slug);
    return { ...destination, stats };
  }

  @Public()
  @Get(':slug/content')
  @ApiOperation({ summary: 'Get content for a destination' })
  async getDestinationContent(
    @Param('slug') slug: string,
    @Query() pagination: PaginationDto,
  ) {
    const destination = await this.destinationsService.findBySlug(slug);
    return { destinationId: destination.id, message: 'Use /content?destinationId=' + destination.id };
  }

  @Public()
  @Get(':slug/products')
  @ApiOperation({ summary: 'Get products available in a destination' })
  async getDestinationProducts(
    @Param('slug') slug: string,
    @Query() pagination: PaginationDto,
  ) {
    const destination = await this.destinationsService.findBySlug(slug);
    return { destinationId: destination.id, message: 'Use /products?destinationId=' + destination.id };
  }

  @Public()
  @Get(':slug/creators')
  @ApiOperation({ summary: 'Get creators active in a destination' })
  async getDestinationCreators(
    @Param('slug') slug: string,
    @Query() pagination: PaginationDto,
  ) {
    const destination = await this.destinationsService.findBySlug(slug);
    return { destinationId: destination.id, message: 'Use /creators?destination=' + destination.name };
  }

  @Public()
  @Get(':slug/tips')
  @ApiOperation({ summary: 'Get tips for a destination' })
  async getDestinationTips(
    @Param('slug') slug: string,
    @Query() pagination: PaginationDto,
  ) {
    const destination = await this.destinationsService.findBySlug(slug);
    return { destinationId: destination.id, message: 'Use /tips?destinationId=' + destination.id };
  }

  @Post()
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new destination (Admin only)' })
  async createDestination(@Body() dto: CreateDestinationDto) {
    return this.destinationsService.create(dto);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update a destination (Admin only)' })
  async updateDestination(
    @Param('id', ParseUuidPipe) id: string,
    @Body() dto: Partial<CreateDestinationDto>,
  ) {
    return this.destinationsService.update(id, dto);
  }
}
