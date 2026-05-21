import { Controller, Get, Post, Param, Body, UseGuards, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ReviewsService, CreateReviewInput } from './reviews.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { User } from '../../database/entities/user.entity';
import { IsString, IsInt, Min, Max, IsOptional } from 'class-validator';

class CreateReviewDto implements CreateReviewInput {
  @IsString() productId: string;
  @IsInt() @Min(1) @Max(5) rating: number;
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() body?: string;
}

@ApiTags('reviews')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'List reviews for a product' })
  findAll(@Query('productId') productId: string, @Query() pagination: PaginationDto) {
    return this.reviewsService.findAll(productId, pagination);
  }

  @Post()
  @ApiOperation({ summary: 'Create review for a product' })
  create(@Body() dto: CreateReviewDto, @CurrentUser() user: User) {
    return this.reviewsService.create(dto, user.id);
  }
}
