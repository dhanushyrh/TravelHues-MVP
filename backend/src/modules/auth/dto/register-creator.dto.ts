import { IsEmail, IsString, MinLength, MaxLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterCreatorDto {
  @ApiProperty({ example: 'abc123-invite-token' })
  @IsString()
  inviteToken: string;

  @ApiProperty({ example: 'creator@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Arjun' })
  @IsString()
  @MaxLength(50)
  firstName: string;

  @ApiProperty({ example: 'Sharma' })
  @IsString()
  @MaxLength(50)
  lastName: string;

  @ApiProperty({ example: 'Str0ng!Pass' })
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
  })
  password: string;
}
