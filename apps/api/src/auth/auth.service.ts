/**
 * EKUSA Digital Platform - Auth Service
 * Core authentication logic
 */

import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';

export interface TokenPayload {
  sub: string;
  username: string;
  accountStatus: string;
}

export interface Tokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(data: {
    username: string;
    email?: string;
    phoneNumber?: string;
    password: string;
  }): Promise<{ user: any; tokens: Tokens }> {
    // Check for existing username
    const existingUser = await this.prisma.user.findUnique({
      where: { username: data.username },
    });
    if (existingUser) {
      throw new ConflictException('Username already taken');
    }

    // Check email if provided
    if (data.email) {
      const existingEmail = await this.prisma.user.findUnique({
        where: { email: data.email },
      });
      if (existingEmail) {
        throw new ConflictException('Email already registered');
      }
    }

    // Check phone if provided
    if (data.phoneNumber) {
      const existingPhone = await this.prisma.user.findUnique({
        where: { phoneNumber: data.phoneNumber },
      });
      if (existingPhone) {
        throw new ConflictException('Phone number already registered');
      }
    }

    // Hash password
    const passwordHash = await argon2.hash(data.password, {
      type: argon2.argon2id,
      memoryCost: 2 ** 16,
      timeCost: 3,
      parallelism: 1,
    });

    // Create user with verified status
    const user = await this.prisma.user.create({
      data: {
        username: data.username,
        email: data.email,
        phoneNumber: data.phoneNumber,
        passwordHash,
        accountStatus: 'verified_member',
      },
    });

    // Create empty profile
    await this.prisma.profile.create({
      data: {
        userId: user.id,
        displayName: data.username,
      },
    });

    // Assign ordinary_member role if available
    const ordinaryMemberRole = await this.prisma.role.findUnique({
      where: { name: 'ordinary_member' },
    });
    if (ordinaryMemberRole) {
      await this.prisma.userRole.create({
        data: {
          userId: user.id,
          roleId: ordinaryMemberRole.id,
          assignedBy: user.id,
        },
      });
    }

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.username, user.accountStatus);

    // Store refresh token
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    return {
      user: this.sanitizeUser(user),
      tokens,
    };
  }

  async login(identifier: string, password: string): Promise<{ user: any; tokens: Tokens }> {
    // Find user by username or email
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { username: identifier },
          { email: identifier },
        ],
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isValid = await argon2.verify(user.passwordHash, password);
    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check account status
    if (user.accountStatus === 'suspended') {
      throw new UnauthorizedException('Account suspended');
    }
    if (user.accountStatus === 'deactivated') {
      throw new UnauthorizedException('Account deactivated');
    }

    // Automatically ensure user is verified
    if (user.accountStatus === 'registered') {
      user.accountStatus = 'verified_member';
      await this.prisma.user.update({
        where: { id: user.id },
        data: { accountStatus: 'verified_member' },
      });
    }

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.username, user.accountStatus);

    // Store refresh token
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    return {
      user: this.sanitizeUser(user),
      tokens,
    };
  }

  async refreshTokens(userId: string, refreshToken: string): Promise<Tokens> {
    // Find and validate refresh token
    const session = await this.prisma.authSession.findUnique({
      where: { refreshToken },
    });

    if (!session || (userId && session.userId !== userId)) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (session.revokedAt) {
      throw new UnauthorizedException('Refresh token revoked');
    }

    if (new Date() > session.expiresAt) {
      throw new UnauthorizedException('Refresh token expired');
    }

    // Get user
    const targetUserId = userId || session.userId;
    const user = await this.prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Revoke old refresh token
    await this.prisma.authSession.update({
      where: { id: session.id },
      data: { revokedAt: new Date() },
    });

    // Generate new tokens
    const tokens = await this.generateTokens(user.id, user.username, user.accountStatus);

    // Store new refresh token
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    return tokens;
  }

  async logout(userId: string, refreshToken?: string): Promise<void> {
    if (refreshToken) {
      const session = await this.prisma.authSession.findUnique({
        where: { refreshToken },
      });

      if (session && (!userId || session.userId === userId)) {
        await this.prisma.authSession.update({
          where: { id: session.id },
          data: { revokedAt: new Date() },
        });
        return;
      }
    }

    // Fallback: revoke all active sessions for this user
    await this.logoutAllDevices(userId);
  }

  async logoutAllDevices(userId: string): Promise<void> {
    await this.prisma.authSession.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal if email exists
      return;
    }

    // Generate reset token (in production, send via email)
    const resetToken = uuidv4();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store reset token (you'd typically use a separate table or Redis)
    // For now, we'll add a field to user or use a separate model
    // TODO: Implement password reset token storage
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    // TODO: Validate reset token and update password
    throw new BadRequestException('Password reset not yet implemented');
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isValid = await argon2.verify(user.passwordHash, currentPassword);
    if (!isValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const newPasswordHash = await argon2.hash(newPassword, {
      type: argon2.argon2id,
      memoryCost: 2 ** 16,
      timeCost: 3,
      parallelism: 1,
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });

    // Revoke all other sessions
    await this.logoutAllDevices(userId);
  }

  async validateUser(userId: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return this.sanitizeUser(user);
  }

  private async generateTokens(userId: string, username: string, accountStatus: string): Promise<Tokens> {
    const payload: TokenPayload = { sub: userId, username, accountStatus };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = uuidv4();
    const expiresIn = 15 * 60; // 15 minutes in seconds

    return { accessToken, refreshToken, expiresIn };
  }

  private async storeRefreshToken(userId: string, refreshToken: string): Promise<void> {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await this.prisma.authSession.create({
      data: {
        userId,
        refreshToken,
        expiresAt,
      },
    });
  }

  private sanitizeUser(user: any) {
    const { passwordHash, ...sanitized } = user;
    return sanitized;
  }
}