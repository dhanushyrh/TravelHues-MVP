import {
  IsString,
  IsEnum,
  IsOptional,
  IsArray,
  IsBoolean,
  IsUUID,
  IsNumber,
  IsPositive,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProductType } from '../../../common/enums';

export class ActivityDetailsDto {
  @IsOptional()
  @IsNumber()
  durationHours?: number;

  @IsOptional()
  @IsNumber()
  maxGroupSize?: number;

  @IsOptional()
  @IsString()
  difficultyLevel?: string;

  @IsOptional()
  @IsString()
  meetingPoint?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  includes?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  excludes?: string[];

  @IsOptional()
  @IsString()
  cancellationPolicy?: string;

  @IsOptional()
  @IsBoolean()
  isInstantBooking?: boolean;
}

export class StayDetailsDto {
  @IsOptional()
  @IsString()
  propertyType?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsNumber()
  maxGuests?: number;

  @IsOptional()
  @IsNumber()
  bedrooms?: number;

  @IsOptional()
  @IsNumber()
  bathrooms?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  amenities?: string[];

  @IsOptional()
  @IsNumber()
  @IsPositive()
  pricePerNight?: number;
}

export class ItineraryActivityDto {
  @IsOptional() @IsString() time?: string;
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() duration?: string;
  @IsOptional() @IsString() cost?: string;
}

export class ItineraryDayDto {
  @IsOptional() @IsNumber()  dayNumber?: number;
  @IsOptional() @IsString()  title?: string;
  @IsOptional() @IsString()  description?: string;
  @IsOptional() @IsString()  location?: string;
  @IsOptional() @IsString()  accommodation?: string;
  @IsOptional() @IsString()  transport?: string;
  @IsOptional() @IsString()  meals?: string;
  @IsOptional() @IsString()  estimatedCost?: string;
  @IsOptional() @IsString()  tips?: string;
  @IsOptional() @IsString()  imageUrl?: string;
  @IsOptional() @IsArray()   activities?: ItineraryActivityDto[];
}

export class ItineraryDetailsDto {
  @IsOptional() @IsNumber()  totalDays?: number;
  @IsOptional() @IsNumber()  totalNights?: number;
  @IsOptional() @IsString()  startingCity?: string;
  @IsOptional() @IsString()  endingCity?: string;
  @IsOptional() @IsString()  difficultyLevel?: string;
  @IsOptional() @IsString()  bestSeason?: string;
  @IsOptional() @IsString()  estimatedBudget?: string;
  @IsOptional() @IsString()  packingList?: string;
  @IsOptional() @IsBoolean() isCustomizable?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  destinations?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  includes?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  excludes?: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItineraryDayDto)
  days?: ItineraryDayDto[];
}

export class CreateProductDto {
  @ApiProperty({ example: 'Bali Sunrise Trek' })
  @IsString()
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @ApiProperty({ enum: ProductType })
  @IsEnum(ProductType)
  type: ProductType;

  @ApiProperty({ example: 49.99 })
  @IsNumber()
  @IsPositive()
  price: number;

  @ApiPropertyOptional({ example: 'USD' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  thumbnailUrl?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  imageUrls?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  destinationId?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  tagIds?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @ApiPropertyOptional({ description: 'Activity-specific details' })
  @IsOptional()
  @ValidateNested()
  @Type(() => ActivityDetailsDto)
  activityDetails?: ActivityDetailsDto;

  @ApiPropertyOptional({ description: 'Stay-specific details' })
  @IsOptional()
  @ValidateNested()
  @Type(() => StayDetailsDto)
  stayDetails?: StayDetailsDto;

  @ApiPropertyOptional({ description: 'Itinerary-specific details' })
  @IsOptional()
  @ValidateNested()
  @Type(() => ItineraryDetailsDto)
  itineraryDetails?: ItineraryDetailsDto;
}
