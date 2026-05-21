import { IsString, IsOptional, IsUUID, MinLength, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCommentDto {
  @ApiProperty({ example: 'Amazing content! Thanks for sharing.' })
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  body: string;

  @ApiPropertyOptional({ description: 'Parent comment ID for replies' })
  @IsOptional()
  @IsUUID()
  parentId?: string;
}
