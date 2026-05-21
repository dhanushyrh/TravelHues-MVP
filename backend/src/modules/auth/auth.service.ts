import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { UsersService } from '../users/users.service';
import { AdminService } from '../admin/admin.service';
import { CreatorProfile } from '../../database/entities/creator-profile.entity';
import { User } from '../../database/entities/user.entity';
import { UserRole, CreatorTier } from '../../common/enums';
import { RegisterDto } from './dto/register.dto';
import { RegisterCreatorDto } from './dto/register-creator.dto';
import { LoginDto } from './dto/login.dto';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse extends TokenPair {
  user: Partial<User>;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly SALT_ROUNDS = 12;

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(CreatorProfile)
    private readonly creatorProfileRepository: Repository<CreatorProfile>,
    private readonly usersService: UsersService,
    private readonly adminService: AdminService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const existingUser = await this.usersService.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException('An account with this email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, this.SALT_ROUNDS);
    const emailVerificationToken = uuidv4();

    const user = this.userRepository.create({
      email: dto.email.toLowerCase().trim(),
      passwordHash,
      firstName: dto.firstName.trim(),
      lastName: dto.lastName.trim(),
      phone: dto.phone,
      emailVerificationToken,
      role: UserRole.USER,
      isEmailVerified: false,
    });

    const savedUser = await this.userRepository.save(user);

    // In production: send verification email
    this.logger.log(`Email verification token for ${dto.email}: ${emailVerificationToken}`);

    const tokens = await this.generateTokens(savedUser);
    await this.storeRefreshToken(savedUser.id, tokens.refreshToken);

    const { passwordHash: _, refreshTokenHash: __, emailVerificationToken: ___, ...safeUser } =
      savedUser as any;

    return { ...tokens, user: safeUser };
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.validateUser(dto.email, dto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    const tokens = await this.generateTokens(user);
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    const { passwordHash: _, refreshTokenHash: __, ...safeUser } = user as any;

    return { ...tokens, user: safeUser };
  }

  async refreshTokens(userId: string, refreshToken: string): Promise<TokenPair> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'email', 'role', 'isActive', 'refreshTokenHash'],
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Access denied');
    }

    if (!user.refreshTokenHash) {
      throw new UnauthorizedException('No active session found');
    }

    const isValid = await bcrypt.compare(refreshToken, user.refreshTokenHash);
    if (!isValid) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const tokens = await this.generateTokens(user);
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    return tokens;
  }

  async logout(userId: string): Promise<void> {
    await this.userRepository.update(userId, { refreshTokenHash: null });
  }

  async generateTokens(user: Pick<User, 'id' | 'email' | 'role'>): Promise<TokenPair> {
    const payload = { sub: user.id, email: user.email, role: user.role };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('jwt.secret'),
        expiresIn: this.configService.get<string>('jwt.expiresIn'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
        expiresIn: this.configService.get<string>('jwt.refreshExpiresIn'),
      }),
    ]);

    return { accessToken, refreshToken };
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { email: email.toLowerCase().trim() },
      select: [
        'id',
        'email',
        'firstName',
        'lastName',
        'role',
        'isActive',
        'isEmailVerified',
        'avatarUrl',
        'passwordHash',
      ],
    });

    if (!user || !user.passwordHash) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return null;
    }

    return user;
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.usersService.findByEmail(email);

    // Always return success to prevent email enumeration
    if (!user) {
      this.logger.log(`Password reset requested for non-existent email: ${email}`);
      return;
    }

    const resetToken = uuidv4();
    const resetExpiry = new Date();
    resetExpiry.setHours(resetExpiry.getHours() + 1); // 1 hour expiry

    await this.userRepository.update(user.id, {
      passwordResetToken: resetToken,
      passwordResetExpiry: resetExpiry,
    });

    // In production: send password reset email
    this.logger.log(`Password reset token for ${email}: ${resetToken}`);
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { passwordResetToken: token },
      select: ['id', 'passwordResetToken', 'passwordResetExpiry'],
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    if (user.passwordResetExpiry < new Date()) {
      throw new BadRequestException('Reset token has expired');
    }

    const passwordHash = await bcrypt.hash(newPassword, this.SALT_ROUNDS);

    await this.userRepository.update(user.id, {
      passwordHash,
      passwordResetToken: null,
      passwordResetExpiry: null,
      refreshTokenHash: null, // Invalidate all sessions
    });
  }

  async verifyEmail(token: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { emailVerificationToken: token },
      select: ['id', 'emailVerificationToken', 'isEmailVerified'],
    });

    if (!user) {
      throw new BadRequestException('Invalid email verification token');
    }

    if (user.isEmailVerified) {
      throw new BadRequestException('Email is already verified');
    }

    await this.userRepository.update(user.id, {
      isEmailVerified: true,
      emailVerificationToken: null,
    });
  }

  async handleGoogleAuth(profile: {
    googleId: string;
    email: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
  }): Promise<User> {
    let user = await this.userRepository.findOne({
      where: { googleId: profile.googleId },
    });

    if (!user) {
      // Check if email already registered
      user = await this.usersService.findByEmail(profile.email);

      if (user) {
        // Link Google account to existing user
        await this.userRepository.update(user.id, {
          googleId: profile.googleId,
          isEmailVerified: true,
          avatarUrl: user.avatarUrl || profile.avatarUrl,
        });
        user.googleId = profile.googleId;
      } else {
        // Create new user from Google profile
        user = this.userRepository.create({
          email: profile.email.toLowerCase(),
          googleId: profile.googleId,
          firstName: profile.firstName,
          lastName: profile.lastName,
          avatarUrl: profile.avatarUrl,
          isEmailVerified: true,
          role: UserRole.USER,
        });
        user = await this.userRepository.save(user);
      }
    }

    return user;
  }

  async registerCreator(dto: RegisterCreatorDto): Promise<AuthResponse> {
    // Validate invite before creating user
    const inviteCheck = await this.adminService.validateInviteToken(dto.inviteToken);
    if (!inviteCheck.valid) {
      const messages: Record<string, string> = {
        not_found: 'Invalid invite token',
        already_used: 'This invite has already been used',
        revoked: 'This invite has been revoked',
        expired: 'This invite has expired',
      };
      throw new BadRequestException(messages[inviteCheck.reason] ?? 'Invalid invite');
    }
    if (inviteCheck.email !== dto.email.toLowerCase()) {
      throw new BadRequestException('Email does not match the invite');
    }

    const existingUser = await this.usersService.findByEmail(dto.email);
    if (existingUser) throw new ConflictException('An account with this email already exists');

    const passwordHash = await bcrypt.hash(dto.password, this.SALT_ROUNDS);

    const user = await this.userRepository.save(
      this.userRepository.create({
        email: dto.email.toLowerCase().trim(),
        passwordHash,
        firstName: dto.firstName.trim(),
        lastName: dto.lastName.trim(),
        role: UserRole.CREATOR,
        isEmailVerified: true, // Invite validates the email
      }),
    );

    // Create empty creator profile
    await this.creatorProfileRepository.save(
      this.creatorProfileRepository.create({
        userId: user.id,
        displayName: `${user.firstName} ${user.lastName}`.trim(),
        tier: CreatorTier.BASIC,
        isOnboardingComplete: false,
      }),
    );

    // Mark invite as used
    await this.adminService.validateAndUseInvite(dto.inviteToken, dto.email, user.id);

    const tokens = await this.generateTokens(user);
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    const { passwordHash: _, refreshTokenHash: __, ...safeUser } = user as any;
    return { ...tokens, user: safeUser };
  }

  async validateInviteToken(token: string) {
    return this.adminService.validateInviteToken(token);
  }

  private async storeRefreshToken(userId: string, refreshToken: string): Promise<void> {
    const hash = await bcrypt.hash(refreshToken, this.SALT_ROUNDS);
    await this.userRepository.update(userId, { refreshTokenHash: hash });
  }
}
