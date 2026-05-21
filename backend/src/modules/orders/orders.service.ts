import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../../database/entities/order.entity';
import { OrderItem } from '../../database/entities/order-item.entity';
import { Product } from '../../database/entities/product.entity';
import { OrderStatus } from '../../common/enums';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order) private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderItem) private readonly orderItemRepository: Repository<OrderItem>,
    @InjectRepository(Product) private readonly productRepository: Repository<Product>,
  ) {}

  async findAll(userId: string, pagination: PaginationDto) {
    const { page = 1, limit = 20 } = pagination;
    const [data, total] = await this.orderRepository.findAndCount({
      where: { userId },
      relations: ['items', 'items.product'],
      order: { createdAt: 'DESC' },
      take: limit,
      skip: (page - 1) * limit,
    });
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string, userId: string) {
    const order = await this.orderRepository.findOne({
      where: { id, userId },
      relations: ['items', 'items.product'],
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async create(userId: string, items: { productId: string; quantity: number }[]) {
    const products = await Promise.all(
      items.map(async (item) => {
        const product = await this.productRepository.findOne({
          where: { id: item.productId, isPublished: true },
        });
        if (!product) throw new NotFoundException(`Product ${item.productId} not found`);
        return { product, quantity: item.quantity };
      }),
    );

    const subtotal = products.reduce(
      (sum, { product, quantity }) => sum + Number(product.price) * quantity,
      0,
    );

    const order = this.orderRepository.create({
      userId,
      status: OrderStatus.PENDING,
      subtotal,
      tax: Math.round(subtotal * 0.18),
      total: Math.round(subtotal * 1.18),
      currency: 'INR',
    });

    const savedOrder = await this.orderRepository.save(order);

    const orderItems = products.map(({ product, quantity }) =>
      this.orderItemRepository.create({
        orderId: savedOrder.id,
        productId: product.id,
        quantity,
        unitPrice: product.price,
        totalPrice: Number(product.price) * quantity,
        currency: 'INR',
        productTitle: product.title,
        productSnapshot: { id: product.id, title: product.title, price: product.price, type: product.type },
      }),
    );

    await this.orderItemRepository.save(orderItems);
    return this.findOne(savedOrder.id, userId);
  }
}
