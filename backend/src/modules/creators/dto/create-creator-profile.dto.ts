import {
  IsString,
  IsOptional,
  IsArray,
  MaxLength,
  IsUrl,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCreatorProfileDto {
  @ApiProperty({ example: 'john-doe-travels' })
  @IsString()
  displayName: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  bio?: string;

  @ApiPropertyOptional({ example: 'https://mywebsite.com' })
  @IsOptional()
  @IsString()
  websiteUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  instagramHandle?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  youtubeHandle?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  tiktokHandle?: string;

  @ApiPropertyOptional({ example: ['adventure', 'beaches', 'backpacking'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  specialties?: string[];

  @ApiPropertyOptional({ example: ['Thailand', 'Bali', 'Japan'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  destinationsFocused?: string[];

  @ApiPropertyOptional({ example: ['English', 'Spanish'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  languages?: string[];
}
