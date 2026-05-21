import {
  IsString,
  IsEnum,
  IsOptional,
  IsArray,
  IsBoolean,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TipCategory } from '../../../common/enums';

export class CreateTipDto {
  @ApiProperty({ example: 'Best street food spots in Bangkok' })
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title: string;

  @ApiProperty({ example: 'Head to Chinatown for the best Pad See Ew...' })
  @IsString()
  @MinLength(10)
  body: string;

  @ApiProperty({ enum: TipCategory })
  @IsEnum(TipCategory)
  category: TipCategory;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  destinationId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({ example: '$5-10 per meal' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  estimatedCost?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}
