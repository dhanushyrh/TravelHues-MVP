import { PartialType } from '@nestjs/swagger';
import { CreateCreatorProfileDto } from './create-creator-profile.dto';
import {
  IsOptional,
  IsNumber,
  IsPositive,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class UpdateCreatorProfileDto extends PartialType(CreateCreatorProfileDto) {
  @ApiPropertyOptional({ example: 9.99 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  subscriptionPriceMonthly?: number;

  @ApiPropertyOptional({ example: 99.99 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  subscriptionPriceYearly?: number;

  @ApiPropertyOptional()
  @IsOptional()
  profileImageUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  coverImageUrl?: string;
}
