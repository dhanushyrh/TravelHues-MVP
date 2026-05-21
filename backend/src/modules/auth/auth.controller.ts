import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Req,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { RegisterCreatorDto } from './dto/register-creator.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { User } from '../../database/entities/user.entity';
import { ConfigService } from '@nestjs/config';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register a new user account' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Post('register/creator')
  @ApiOperation({ summary: 'Register as a creator using an admin-issued invite token' })
  @ApiResponse({ status: 201, description: 'Creator account created' })
  @ApiResponse({ status: 400, description: 'Invalid or expired invite token' })
  async registerCreator(@Body() dto: RegisterCreatorDto) {
    return this.authService.registerCreator(dto);
  }

  @Public()
  @Get('invites/:token/validate')
  @ApiOperation({ summary: 'Validate a creator invite token (returns email if valid)' })
  async validateInvite(@Param('token') token: string) {
    return this.authService.validateInviteToken(token);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  @ApiResponse({ status: 200, description: 'Tokens refreshed successfully' })
  async refresh(@Body() dto: RefreshTokenDto) {
    let payload: any;
    try {
      const { JwtService } = await import('@nestjs/jwt');
      // Decode without verification to get userId, actual verification happens in service
      const decoded = this.authService['jwtService'].decode(dto.refreshToken) as any;
      if (!decoded?.sub) {
        throw new Error('Invalid token');
      }
      return this.authService.refreshTokens(decoded.sub, dto.refreshToken);
    } catch {
      const { UnauthorizedException } = await import('@nestjs/common');
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout and invalidate refresh token' })
  async logout(@CurrentUser() user: User) {
    await this.authService.logout(user.id);
  }

  @Public()
  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Initiate Google OAuth login' })
  googleAuth() {
    // Guard handles redirect
  }

  @Public()
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Google OAuth callback' })
  async googleCallback(@Req() req: Request, @Res() res: Response) {
    const user = req.user as User;
    const tokens = await this.authService.generateTokens(user);
    const frontendUrl = this.configService.get<string>('app.frontendUrl');
    const redirectUrl = `${frontendUrl}/auth/callback?accessToken=${tokens.accessToken}&refreshToken=${tokens.refreshToken}`;
    res.redirect(redirectUrl);
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset email' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.authService.forgotPassword(dto.email);
    return { message: 'If an account with that email exists, a password reset email has been sent' };
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password with token' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.authService.resetPassword(dto.token, dto.newPassword);
    return { message: 'Password has been reset successfully' };
  }

  @Public()
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify email address with token' })
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    await this.authService.verifyEmail(dto.token);
    return { message: 'Email verified successfully' };
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current authenticated user' })
  async getMe(@CurrentUser() user: User) {
    return user;
  }
}
