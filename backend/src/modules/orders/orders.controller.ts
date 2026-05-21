import { Controller, Get, Post, Param, Body, UseGuards, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { User } from '../../database/entities/user.entity';

@ApiTags('orders')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @ApiOperation({ summary: 'Get user orders' })
  findAll(@CurrentUser() user: User, @Query() pagination: PaginationDto) {
    return this.ordersService.findAll(user.id, pagination);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order by ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.ordersService.findOne(id, user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create order (checkout)' })
  create(@Body() body: { items: { productId: string; quantity: number }[] }, @CurrentUser() user: User) {
    return this.ordersService.create(user.id, body.items);
  }
}
