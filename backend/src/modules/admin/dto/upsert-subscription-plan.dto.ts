import {
  IsString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsObject,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SubscriptionPlanType, BillingPeriod, CreatorTier } from '@common/enums';

export class UpsertSubscriptionPlanDto {
  @ApiProperty({ example: 'Pro Creator Plan' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Full access for professional creators' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: SubscriptionPlanType })
  @IsEnum(SubscriptionPlanType)
  type: SubscriptionPlanType;

  @ApiProperty({ enum: BillingPeriod })
  @IsEnum(BillingPeriod)
  billingPeriod: BillingPeriod;

  @ApiProperty({ example: 999, minimum: 0 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional({ example: 'INR', default: 'INR' })
  @IsOptional()
  @IsString()
  currency?: string = 'INR';

  @ApiPropertyOptional({ enum: CreatorTier })
  @IsOptional()
  @IsEnum(CreatorTier)
  creatorTier?: CreatorTier;

  @ApiPropertyOptional({ example: { unlimitedUploads: true, analytics: true } })
  @IsOptional()
  @IsObject()
  features?: Record<string, any>;

  @ApiPropertyOptional({ example: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxProducts?: number;

  @ApiPropertyOptional({ example: 200 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxContent?: number;

  @ApiPropertyOptional({ example: 10, minimum: 0, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  commissionRate?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: 14 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  trialDays?: number;
}
