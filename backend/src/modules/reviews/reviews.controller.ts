import { Controller, Get, Post, Body, Param, UseGuards, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { User } from '../../database/entities/user.entity';
import { IsString, IsInt, Min, Max, IsOptional } from 'class-validator';

class CreateReviewDto {
  @IsString() targetType: 'PRODUCT' | 'CREATOR';
  @IsString() targetId: string;
  @IsInt() @Min(1) @Max(5) rating: number;
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() content?: string;
}

@ApiTags('reviews')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'List reviews for a product or creator' })
  findAll(
    @Query('targetType') targetType: string,
    @Query('targetId') targetId: string,
    @Query() pagination: PaginationDto,
  ) {
    return this.reviewsService.findAll(targetType, targetId, pagination);
  }

  @Post()
  @ApiOperation({ summary: 'Create review' })
  create(@Body() dto: CreateReviewDto, @CurrentUser() user: User) {
    return this.reviewsService.create(dto, user.id);
  }
}
