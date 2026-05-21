import { IsEmail, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TripMemberRole } from '../../../common/enums';

export class InviteMemberDto {
  @ApiPropertyOptional({ description: 'Invite by user ID' })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({ description: 'Invite by email' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ enum: TripMemberRole, default: TripMemberRole.VIEWER })
  @IsEnum(TripMemberRole)
  role: TripMemberRole;
}
