import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { BullModule } from '@nestjs/bullmq';
import { ScheduleModule } from '@nestjs/schedule';
import configuration from './config/configuration';
import { validationSchema } from './config/validation.schema';
import { databaseConfig } from './config/database.config';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { CreatorsModule } from './modules/creators/creators.module';
import { DestinationsModule } from './modules/destinations/destinations.module';
import { ContentModule } from './modules/content/content.module';
import { TipsModule } from './modules/tips/tips.module';
import { ProductsModule } from './modules/products/products.module';
import { TripsModule } from './modules/trips/trips.module';
import { OrdersModule } from './modules/orders/orders.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { MediaModule } from './modules/media/media.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ReviewsModule } from './modules/reviews/reviews.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema,
      validationOptions: { allowUnknown: false, abortEarly: true },
    }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: databaseConfig,
    }),

    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: config.get<number>('app.throttle.ttl', 60000),
          limit: config.get<number>('app.throttle.limit', 100),
        },
      ],
    }),

    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get<string>('redis.host', 'localhost'),
          port: config.get<number>('redis.port', 6379),
          password: config.get<string>('redis.password'),
        },
        defaultJobOptions: {
          removeOnComplete: 100,
          removeOnFail: 50,
          attempts: 3,
          backoff: { type: 'exponential', delay: 2000 },
        },
      }),
    }),

    ScheduleModule.forRoot(),

    AuthModule,
    UsersModule,
    CreatorsModule,
    DestinationsModule,
    ContentModule,
    TipsModule,
    ProductsModule,
    TripsModule,
    OrdersModule,
    PaymentsModule,
    SubscriptionsModule,
    MediaModule,
    NotificationsModule,
    ReviewsModule,
  ],
})
export class AppModule {}
