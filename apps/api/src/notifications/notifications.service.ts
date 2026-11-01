/**
 * EKUSA Digital Platform - Notifications Service
 * Notification management and FCM integration
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

interface NotificationData {
  userId: string;
  category: string;
  priority: string;
  title: string;
  body: string;
  data?: Record<string, any>;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async create(data: NotificationData) {
    // Create notification record
    const notification = await this.prisma.notification.create({
      data: {
        userId: data.userId,
        category: data.category as any,
        priority: data.priority as any,
        title: data.title,
        body: data.body,
        data: data.data,
      },
    });

    // Send push notification if user has devices
    await this.sendPushNotification(data.userId, notification);

    return notification;
  }

  async list(userId: string, params: { category?: string; unreadOnly?: boolean; page?: number; limit?: number }) {
    const { category, unreadOnly, page = 1, limit = 20 } = params;

    const where: any = { userId };
    if (category && category !== 'all') where.category = category;
    if (unreadOnly) where.read = false;

    const [items, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { sentAt: 'desc' },
        take: limit,
        skip: (page - 1) * limit,
      }),
      this.prisma.notification.count({ where }),
    ]);

    return { items, page, limit, total, totalPages: Math.ceil(total / limit) };
  }

  async markRead(id: string, userId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
    });

    if (!notification || notification.userId !== userId) {
      return { success: false };
    }

    await this.prisma.notification.update({
      where: { id },
      data: { read: true, readAt: new Date() },
    });

    return { success: true };
  }

  async markAllRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true, readAt: new Date() },
    });

    return { success: true };
  }

  private async sendPushNotification(userId: string, notification: any) {
    // Get user's active devices with push tokens
    const devices = await this.prisma.device.findMany({
      where: { userId, deviceStatus: 'active', pushToken: { not: null } },
      select: { pushToken: true },
    });

    if (devices.length === 0) {
      this.logger.debug(`No active devices with push tokens for user ${userId}`);
      return;
    }

    const pushTokens = devices.map((d: any) => d.pushToken!).filter(Boolean);

    // In production, send to FCM
    // For now, just log
    this.logger.log(`Would send push notification to ${pushTokens.length} devices for user ${userId}`);
    this.logger.debug(`Notification: ${notification.title} - ${notification.body}`);
  }

  async broadcastToAudience(data: {
    audience: { type: string; value: string }[];
    title: string;
    body: string;
    category: string;
    priority: string;
    data?: Record<string, any>;
  }) {
    // In production, resolve audience to user IDs and send notifications
    this.logger.log(`Broadcast notification to audience: ${JSON.stringify(data.audience)}`);
  }
}