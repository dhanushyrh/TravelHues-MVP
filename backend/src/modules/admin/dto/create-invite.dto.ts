import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateInviteDto {
  @ApiProperty({ example: 'creator@example.com' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ example: 'Invited from Instagram DMs' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
