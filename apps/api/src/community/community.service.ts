/**
 * EKUSA Digital Platform - Community Service
 * Community group management
 */

import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CommunityType } from '@prisma/client';

@Injectable()
export class CommunityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async list(params: { type?: string; isPublic?: boolean; page?: number; limit?: number }) {
    const { type, isPublic } = params;
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.max(1, Number(params.limit) || 20);

    const where: any = {};
    if (type && type !== 'all') where.type = type as CommunityType;
    if (isPublic !== undefined) where.isPublic = isPublic;

    const [items, total] = await Promise.all([
      this.prisma.community.findMany({
        where,
        include: {
          creator: { select: { id: true, username: true, profile: { select: { displayName: true } } } },
          _count: { select: { members: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: (page - 1) * limit,
      }),
      this.prisma.community.count({ where }),
    ]);

    return { items, page, limit, total, totalPages: Math.ceil(total / limit) };
  }

  async get(id: string) {
    const community = await this.prisma.community.findUnique({
      where: { id },
      include: {
        creator: { select: { id: true, username: true, profile: { select: { displayName: true } } } },
        _count: { select: { members: true } },
        members: { take: 10, include: { user: { select: { id: true, username: true, profile: { select: { displayName: true } } } } } },
      },
    });

    if (!community) throw new NotFoundException('Community not found');
    return community;
  }

  async join(id: string, userId: string) {
    const community = await this.prisma.community.findUnique({ where: { id } });
    if (!community) throw new NotFoundException('Community not found');

    const existing = await this.prisma.communityMember.findUnique({
      where: { communityId_userId: { communityId: id, userId } },
    });

    if (existing) {
      if (existing.role === 'member') throw new BadRequestException('Already a member');
      // Reactivate if left
      await this.prisma.communityMember.update({
        where: { id: existing.id },
        data: { role: 'member' },
      });
      return { success: true };
    }

    await this.prisma.communityMember.create({
      data: { communityId: id, userId, role: 'member' },
    });

    await this.auditService.log({
      adminUserId: userId,
      action: 'community_joined',
      targetType: 'community',
      targetId: id,
    });

    return { success: true };
  }

  async leave(id: string, userId: string) {
    const membership = await this.prisma.communityMember.findUnique({
      where: { communityId_userId: { communityId: id, userId } },
    });

    if (!membership) throw new NotFoundException('Not a member of this community');

    // Prevent creator from leaving their own community
    const community = await this.prisma.community.findUnique({ where: { id } });
    if (community?.createdBy === userId) {
      throw new BadRequestException('Creator cannot leave their own community');
    }

    await this.prisma.communityMember.delete({ where: { id: membership.id } });

    await this.auditService.log({
      adminUserId: userId,
      action: 'community_left',
      targetType: 'community',
      targetId: id,
    });

    return { success: true };
  }

  // Admin
  async create(adminUserId: string, data: { name: string; description: string; type: string; isPublic: boolean; avatarObjectKey?: string | null }) {
    const community = await this.prisma.community.create({
      data: {
        name: data.name,
        description: data.description,
        type: data.type as CommunityType,
        isPublic: data.isPublic,
        avatarObjectKey: data.avatarObjectKey,
        createdBy: adminUserId,
      },
    });

    // Add creator as admin
    await this.prisma.communityMember.create({
      data: { communityId: community.id, userId: adminUserId, role: 'admin' },
    });

    await this.auditService.log({
      adminUserId,
      action: 'community_created',
      targetType: 'community',
      targetId: community.id,
    });

    return community;
  }

  async update(id: string, adminUserId: string, data: Partial<{ name: string; description: string; type: string; isPublic: boolean; avatarObjectKey?: string | null }>) {
    const community = await this.prisma.community.findUnique({ where: { id } });
    if (!community) throw new NotFoundException('Community not found');

    const updateData: any = { ...data };
    if (data.type) updateData.type = data.type as CommunityType;

    const updated = await this.prisma.community.update({ where: { id }, data: updateData });

    await this.auditService.log({
      adminUserId,
      action: 'community_updated',
      targetType: 'community',
      targetId: id,
    });

    return updated;
  }
}