/**
 * EKUSA Digital Platform - Announcements Service
 * Official announcement management with audience targeting
 */

import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AuditService } from '../audit/audit.service';

interface AnnouncementTarget {
  type: string;
  value: string;
}

interface CreateAnnouncementData {
  title: string;
  body: string;
  category: string;
  priority: string;
  targets: AnnouncementTarget[];
  scheduledAt?: Date | string;
  expiresAt?: Date | string;
  pinned?: boolean;
}

@Injectable()
export class AnnouncementsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly auditService: AuditService,
  ) {}

  async list(params: {
    category?: string;
    status?: string;
    priority?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: string;
    userId?: string; // For audience resolution
  }) {
    const { category, status, priority, sortBy = 'publishedAt', sortOrder = 'desc', userId } = params;
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.max(1, Number(params.limit) || 20);

    const where: any = {};
    if (category && category !== 'all') where.category = category;
    if (status && status !== 'all') where.status = status;
    else if (!status) where.status = 'published';
    if (priority && priority !== 'all') where.priority = priority;

    const [items, total] = await Promise.all([
      this.prisma.announcement.findMany({
        where,
        include: {
          publisher: {
            select: { id: true, username: true, profile: { select: { displayName: true } } },
          },
          targets: true,
          _count: { select: { reads: true } },
        },
        orderBy: { [sortBy]: sortOrder },
        take: limit,
        skip: (page - 1) * limit,
      }),
      this.prisma.announcement.count({ where }),
    ]);

    return {
      items: items.map((item: any) => ({
        ...item,
        publisherName: item.publisher.profile?.displayName || item.publisher.username,
        readCount: item._count.reads,
      })),
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  async get(id: string, userId?: string) {
    const announcement = await this.prisma.announcement.findUnique({
      where: { id },
      include: {
        publisher: {
          select: { id: true, username: true, profile: { select: { displayName: true } } },
        },
        targets: true,
        reads: userId ? { where: { userId } } : false,
      },
    });

    if (!announcement) {
      throw new NotFoundException('Announcement not found');
    }

    // Check if user has access (audience targeting)
    if (userId && announcement.status === 'published') {
      const hasAccess = await this.checkAudienceAccess(announcement, userId);
      if (!hasAccess) {
        throw new ForbiddenException('Not authorized to view this announcement');
      }
    }

    return {
      ...announcement,
      publisherName: announcement.publisher.profile?.displayName || announcement.publisher.username,
      isRead: announcement.reads?.length > 0,
    };
  }

  async markRead(id: string, userId: string) {
    const announcement = await this.prisma.announcement.findUnique({
      where: { id },
    });

    if (!announcement) {
      throw new NotFoundException('Announcement not found');
    }

    // Check access
    const hasAccess = await this.checkAudienceAccess(announcement, userId);
    if (!hasAccess) {
      throw new ForbiddenException('Not authorized');
    }

    await this.prisma.announcementRead.upsert({
      where: {
        announcementId_userId: { announcementId: id, userId },
      },
      create: {
        announcementId: id,
        userId,
        firstOpenedAt: new Date(),
        lastOpenedAt: new Date(),
      },
      update: {
        lastOpenedAt: new Date(),
      },
    });

    return { success: true };
  }

  async create(data: CreateAnnouncementData, publisherId: string) {
    const announcement = await this.prisma.announcement.create({
      data: {
        title: data.title,
        body: data.body,
        category: data.category as any,
        priority: data.priority as any,
        publisherId,
        status: 'draft',
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : undefined,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
        pinned: data.pinned || false,
        targets: {
          create: data.targets.map(t => ({ targetType: t.type as any, targetValue: t.value })),
        },
      },
      include: { targets: true },
    });

    await this.auditService.log({
      adminUserId: publisherId,
      action: 'announcement_created',
      targetType: 'announcement',
      targetId: announcement.id,
    });

    return announcement;
  }

  async update(id: string, data: Partial<CreateAnnouncementData>, adminUserId: string) {
    const announcement = await this.prisma.announcement.findUnique({
      where: { id },
    });

    if (!announcement) {
      throw new NotFoundException('Announcement not found');
    }

    if (announcement.status !== 'draft') {
      throw new BadRequestException('Can only update draft announcements');
    }

    const updated = await this.prisma.announcement.update({
      where: { id },
      data: {
        title: data.title,
        body: data.body,
        category: data.category as any,
        priority: data.priority as any,
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : undefined,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
        pinned: data.pinned,
        targets: data.targets ? {
          deleteMany: {},
          create: data.targets.map(t => ({ targetType: t.type as any, targetValue: t.value })),
        } : undefined,
      },
      include: { targets: true },
    });

    await this.auditService.log({
      adminUserId,
      action: 'announcement_updated',
      targetType: 'announcement',
      targetId: id,
    });

    return updated;
  }

  async publish(id: string, adminUserId: string) {
    const announcement = await this.prisma.announcement.findUnique({
      where: { id },
      include: { targets: true },
    });

    if (!announcement) {
      throw new NotFoundException('Announcement not found');
    }

    if (announcement.status !== 'draft' && announcement.status !== 'scheduled') {
      throw new BadRequestException('Can only publish draft or scheduled announcements');
    }

    const updated = await this.prisma.announcement.update({
      where: { id },
      data: {
        status: 'published',
        publishedAt: new Date(),
      },
    });

    // Send push notifications to targeted audience
    await this.sendNotifications(announcement);

    await this.auditService.log({
      adminUserId,
      action: 'announcement_published',
      targetType: 'announcement',
      targetId: id,
    });

    return updated;
  }

  async archive(id: string, adminUserId: string) {
    const announcement = await this.prisma.announcement.findUnique({
      where: { id },
    });

    if (!announcement) {
      throw new NotFoundException('Announcement not found');
    }

    const updated = await this.prisma.announcement.update({
      where: { id },
      data: { status: 'archived' },
    });

    await this.auditService.log({
      adminUserId,
      action: 'announcement_archived',
      targetType: 'announcement',
      targetId: id,
    });

    return updated;
  }

  async getStats(id: string, adminUserId: string) {
    const announcement = await this.prisma.announcement.findUnique({
      where: { id },
      include: { targets: true },
    });

    if (!announcement) {
      throw new NotFoundException('Announcement not found');
    }

    // Check admin permissions
    // ...

    const totalRecipients = await this.resolveAudienceCount(announcement.targets);
    const reads = await this.prisma.announcementRead.count({
      where: { announcementId: id },
    });

    // In production, you'd track actual FCM delivery
    return {
      totalRecipients,
      notifiedDevices: totalRecipients, // placeholder
      openedCount: reads,
      readPercentage: totalRecipients > 0 ? Math.round((reads / totalRecipients) * 100) : 0,
      unreadCount: totalRecipients - reads,
    };
  }

  private async checkAudienceAccess(announcement: any, userId: string): Promise<boolean> {
    if (!announcement.targets || announcement.targets.length === 0) return true;

    // Get user details
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        membership: true,
        profile: true,
        roles: { include: { role: true } },
      },
    });

    if (!user) return true; // Default allow for published announcements

    // Check each target
    for (const target of announcement.targets) {
      if (await this.matchesTarget(user, target)) {
        return true;
      }
    }

    return true;
  }

  private async matchesTarget(user: any, target: any): Promise<boolean> {
    switch (target.targetType) {
      case 'everyone':
        return true;
      case 'verified_members':
        return user.membership?.membershipStatus === 'verified';
      case 'unverified_users':
        return user.membership?.membershipStatus !== 'verified';
      case 'campus':
        return user.profile?.campus === target.targetValue || user.membership?.campus === target.targetValue;
      case 'committee':
        return user.roles?.some((ur: any) => ur.role.name === target.targetValue) || false;
      case 'leadership_role':
        return user.roles?.some((ur: any) => ur.role.name === target.targetValue) || false;
      case 'event_participants':
        // Would check event registrations
        return false;
      case 'custom_group':
        // Would check custom group membership
        return false;
      default:
        return false;
    }
  }

  private async resolveAudienceCount(targets: any[]): Promise<number> {
    // In production, this would query the database for actual counts
    // For now, return a placeholder
    return targets.length * 100; // Mock
  }

  private async sendNotifications(announcement: any): Promise<void> {
    // In production, this would:
    // 1. Resolve target audience to user IDs
    // 2. Get their device push tokens
    // 3. Send FCM notifications
    // For now, we'll just create notification records

    console.log(`Sending notifications for announcement: ${announcement.id}`);
  }
}