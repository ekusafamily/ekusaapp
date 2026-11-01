/**
 * EKUSA Digital Platform - Notifications Service
 * Notification management and FCM integration
 */

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { App, initializeApp, getApps, cert } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import * as fs from 'fs';
import * as path from 'path';
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
export class NotificationsService implements OnModuleInit {
  private firebaseApp: App | null = null;
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  onModuleInit() {
    this.initFirebase();
  }

  private initFirebase() {
    try {
      const existingApps = getApps();
      if (existingApps.length > 0) {
        this.firebaseApp = existingApps[0]!;
        return;
      }

      const serviceAccountPath = this.configService.get<string>('FIREBASE_SERVICE_ACCOUNT_PATH');
      const serviceAccountJson = this.configService.get<string>('FIREBASE_SERVICE_ACCOUNT_JSON');

      let credentialObj: any = null;

      if (serviceAccountJson) {
        const parsed = JSON.parse(serviceAccountJson);
        credentialObj = cert(parsed);
      } else if (serviceAccountPath) {
        let resolvedPath = path.isAbsolute(serviceAccountPath)
          ? serviceAccountPath
          : path.resolve(process.cwd(), serviceAccountPath);

        if (!fs.existsSync(resolvedPath)) {
          const rootFallback = path.resolve(process.cwd(), '../../', serviceAccountPath);
          if (fs.existsSync(rootFallback)) {
            resolvedPath = rootFallback;
          }
        }

        if (fs.existsSync(resolvedPath)) {
          const fileContent = fs.readFileSync(resolvedPath, 'utf8');
          credentialObj = cert(JSON.parse(fileContent));
        } else {
          this.logger.warn(`Firebase service account file not found at: ${resolvedPath}`);
        }
      }

      if (credentialObj) {
        this.firebaseApp = initializeApp({ credential: credentialObj });
        this.logger.log('Firebase Admin initialized successfully with FCM V1');
      } else {
        this.logger.warn('Firebase Admin not initialized: Set FIREBASE_SERVICE_ACCOUNT_PATH or FIREBASE_SERVICE_ACCOUNT_JSON in .env');
      }
    } catch (error) {
      this.logger.error('Failed to initialize Firebase Admin', error);
    }
  }

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
    const { category, unreadOnly } = params;
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.max(1, Number(params.limit) || 20);

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

    if (pushTokens.length === 0) return;
    if (!this.firebaseApp) {
      this.logger.warn(`Firebase Admin not initialized. Skipping FCM send to ${pushTokens.length} devices.`);
      return;
    }
    try {
      const stringData: Record<string, string> = {};
      if (notification.data && typeof notification.data === 'object') {
        for (const [key, val] of Object.entries(notification.data)) {
          stringData[key] = typeof val === 'string' ? val : JSON.stringify(val);
        }
      }
      stringData.notificationId = notification.id || '';
      stringData.category = notification.category || 'default';

      const response = await getMessaging(this.firebaseApp).sendEachForMulticast({
        tokens: pushTokens,
        notification: {
          title: notification.title,
          body: notification.body,
        },
        data: stringData,
        android: {
          priority: notification.priority === 'urgent' || notification.priority === 'high' ? 'high' : 'normal',
          notification: {
            channelId: notification.category || 'default',
            sound: 'default',
          },
        },
      });

      this.logger.log(`FCM Multicast sent: ${response.successCount} succeeded, ${response.failureCount} failed`);
    } catch (error) {
      this.logger.error(`Error sending FCM push notification to user ${userId}`, error);
    }



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