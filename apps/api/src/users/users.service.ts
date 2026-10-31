/**
 * EKUSA Digital Platform - Users Service
 * User profile management and search
 */

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        membership: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.sanitizeUser(user);
  }

  async updateProfile(userId: string, data: {
    displayName?: string;
    bio?: string;
    avatarObjectKey?: string | null;
    campus?: string;
    course?: string;
    yearOfStudy?: number | null;
  }) {
    // Update or create profile
    const profile = await this.prisma.profile.upsert({
      where: { userId },
      update: {
        displayName: data.displayName,
        bio: data.bio,
        avatarObjectKey: data.avatarObjectKey,
        campus: data.campus,
        course: data.course,
        yearOfStudy: data.yearOfStudy,
      },
      create: {
        userId,
        displayName: data.displayName || '',
        bio: data.bio,
        avatarObjectKey: data.avatarObjectKey,
        campus: data.campus,
        course: data.course,
        yearOfStudy: data.yearOfStudy,
      },
    });

    return profile;
  }

  async getPublicProfile(username: string) {
    const user = await this.prisma.user.findUnique({
      where: { username },
      include: {
        profile: true,
        membership: {
          select: {
            membershipStatus: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.sanitizePublicUser(user);
  }

  async searchUsers(query: string, limit = 20, offset = 0) {
    const users = await this.prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: query, mode: 'insensitive' } },
          { profile: { displayName: { contains: query, mode: 'insensitive' } } },
        ],
        accountStatus: { notIn: ['suspended', 'deactivated'] },
      },
      include: {
        profile: {
          select: {
            displayName: true,
            avatarObjectKey: true,
            campus: true,
          },
        },
        membership: {
          select: {
            membershipStatus: true,
          },
        },
      },
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
    });

    const total = await this.prisma.user.count({
      where: {
        OR: [
          { username: { contains: query, mode: 'insensitive' } },
          { profile: { displayName: { contains: query, mode: 'insensitive' } } },
        ],
        accountStatus: { notIn: ['suspended', 'deactivated'] },
      },
    });

    return {
      items: users.map(u => this.sanitizePublicUser(u)),
      total,
      page: Math.floor(offset / limit) + 1,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async uploadAvatar(userId: string, file: Express.Multer.File): Promise<string> {
    // In production, upload to S3/MinIO and return the object key
    // For now, generate a mock object key
    const ext = file.originalname.split('.').pop() || 'jpg';
    const objectKey = `avatars/${userId}/${crypto.randomUUID()}.${ext}`;

    // TODO: Actually upload to S3
    // await this.s3Service.upload(objectKey, file.buffer, file.mimetype);

    // Update profile with new avatar
    await this.prisma.profile.update({
      where: { userId },
      data: { avatarObjectKey: objectKey },
    });

    return objectKey;
  }

  async getAvatarUrl(objectKey: string): string {
    const s3Endpoint = this.configService.get<string>('S3_ENDPOINT') || 'http://localhost:9000';
    const bucket = this.configService.get<string>('S3_BUCKET') || 'ekusa';
    return `${s3Endpoint}/${bucket}/${objectKey}`;
  }

  private sanitizeUser(user: any) {
    const { passwordHash, ...sanitized } = user;
    return {
      ...sanitized,
      profile: user.profile,
      membership: user.membership,
      isVerifiedMember: user.membership?.membershipStatus === 'verified',
    };
  }

  private sanitizePublicUser(user: any) {
    const { passwordHash, email, phoneNumber, accountStatus, createdAt, updatedAt, ...sanitized } = user;
    return {
      id: user.id,
      username: user.username,
      displayName: user.profile?.displayName || user.username,
      bio: user.profile?.bio,
      avatarUrl: user.profile?.avatarObjectKey ? this.getAvatarUrl(user.profile.avatarObjectKey) : null,
      campus: user.profile?.campus,
      course: user.profile?.course,
      yearOfStudy: user.profile?.yearOfStudy,
      membershipStatus: user.membership?.membershipStatus || 'none',
      isVerifiedMember: user.membership?.membershipStatus === 'verified',
      createdAt: user.createdAt,
    };
  }
}