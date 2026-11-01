/**
 * EKUSA Digital Platform - Users Service
 * User profile management and search with Supabase Storage integration
 */

import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { StorageService } from '../storage/storage.service';
import * as crypto from 'crypto';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly storageService: StorageService,
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
      items: users.map((u: any) => this.sanitizePublicUser(u)),
      total,
      page: Math.floor(offset / limit) + 1,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async uploadAvatar(userId: string, file: Express.Multer.File): Promise<string> {
    const ext = file.originalname.split('.').pop() || 'jpg';
    const objectKey = `avatars/${userId}/${crypto.randomUUID()}.${ext}`;

    // Upload to Supabase Storage bucket 'ekusa-storage'
    await this.storageService.uploadFile('ekusa-storage', objectKey, file.buffer, file.mimetype, false);

    // Update profile with avatar object key
    await this.prisma.profile.update({
      where: { userId },
      data: { avatarObjectKey: objectKey },
    });

    return objectKey;
  }

  async getAvatarUrl(objectKey: string): Promise<string> {
    return this.storageService.getPublicUrl('ekusa-storage', objectKey);
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
    return {
      id: user.id,
      username: user.username,
      displayName: user.profile?.displayName || user.username,
      bio: user.profile?.bio,
      avatarUrl: user.profile?.avatarObjectKey ? `https://${this.configService.get<string>('SUPABASE_URL')?.replace('https://', '')}/storage/v1/object/public/ekusa-storage/${user.profile.avatarObjectKey}` : null,
      campus: user.profile?.campus,
      course: user.profile?.course,
      yearOfStudy: user.profile?.yearOfStudy,
      membershipStatus: user.membership?.membershipStatus || 'none',
      isVerifiedMember: user.membership?.membershipStatus === 'verified',
      createdAt: user.createdAt,
    };
  }
}