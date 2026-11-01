/**
 * EKUSA Digital Platform - Welfare Service
 * Welfare request management
 */

import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class WelfareService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async submit(userId: string, data: {
    category: string;
    subject: string;
    description: string;
  }) {
    const request = await this.prisma.welfareRequest.create({
      data: {
        userId,
        category: data.category as any,
        subject: data.subject,
        description: data.description,
        status: 'submitted',
      },
      include: {
        user: { select: { username: true, profile: { select: { displayName: true } } } },
      },
    });

    await this.auditService.log({
      adminUserId: userId,
      action: 'welfare_request_submitted',
      targetType: 'welfare_request',
      targetId: request.id,
    });

    // Notify welfare officers
    await this.notifyWelfareOfficers(request);

    return request;
  }

  async getMyRequests(userId: string, params: { status?: string; page?: number; limit?: number }) {
    const { status } = params;
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.max(1, Number(params.limit) || 20);

    const where: any = { userId };
    if (status && status !== 'all') where.status = status;

    const [items, total] = await Promise.all([
      this.prisma.welfareRequest.findMany({
        where,
        include: {
          assignedOfficer: {
            select: { id: true, username: true, profile: { select: { displayName: true } } },
          },
          updates: {
            include: {
              author: { select: { id: true, username: true, profile: { select: { displayName: true } } } },
            },
            orderBy: { createdAt: 'desc' },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: (page - 1) * limit,
      }),
      this.prisma.welfareRequest.count({ where }),
    ]);

    return { items, page, limit, total, totalPages: Math.ceil(total / limit) };
  }

  async list(params: { status?: string; category?: string; page?: number; limit?: number }) {
    const { status, category } = params;
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.max(1, Number(params.limit) || 20);

    const where: any = {};
    if (status && status !== 'all') where.status = status;
    if (category && category !== 'all') where.category = category;

    const [items, total] = await Promise.all([
      this.prisma.welfareRequest.findMany({
        where,
        include: {
          user: { select: { id: true, username: true, profile: { select: { displayName: true } } } },
          assignedOfficer: { select: { id: true, username: true, profile: { select: { displayName: true } } } },
          _count: { select: { updates: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: (page - 1) * limit,
      }),
      this.prisma.welfareRequest.count({ where }),
    ]);

    return { items, page, limit, total, totalPages: Math.ceil(total / limit) };
  }

  async update(id: string, adminUserId: string, data: { status?: string; assignedOfficerId?: string | null }) {
    const request = await this.prisma.welfareRequest.findUnique({ where: { id } });
    if (!request) throw new NotFoundException('Welfare request not found');

    const updateData: any = {};
    if (data.status) updateData.status = data.status;
    if (data.assignedOfficerId !== undefined) updateData.assignedOfficerId = data.assignedOfficerId;
    if (data.status === 'resolved' || data.status === 'closed') {
      updateData.closedAt = new Date();
    }

    const updated = await this.prisma.welfareRequest.update({
      where: { id },
      data: updateData,
    });

    await this.auditService.log({
      adminUserId,
      action: 'welfare_request_updated',
      targetType: 'welfare_request',
      targetId: id,
      changes: { status: { before: request.status, after: data.status } },
    });

    // Notify user of status change
    if (data.status && data.status !== request.status) {
      await this.notificationsService.create({
        userId: request.userId,
        category: 'welfare_update',
        priority: 'normal',
        title: 'Welfare Request Update',
        body: `Your request "${request.subject}" status changed to ${data.status}`,
        data: { requestId: id },
      });
    }

    return updated;
  }

  async addUpdate(id: string, adminUserId: string, message: string) {
    const request = await this.prisma.welfareRequest.findUnique({ where: { id } });
    if (!request) throw new NotFoundException('Welfare request not found');

    const update = await this.prisma.welfareUpdate.create({
      data: {
        requestId: id,
        authorId: adminUserId,
        message,
      },
      include: {
        author: { select: { id: true, username: true, profile: { select: { displayName: true } } } },
      },
    });

    // Update request status if it was submitted
    if (request.status === 'submitted') {
      await this.prisma.welfareRequest.update({
        where: { id },
        data: { status: 'under_review' },
      });
    }

    await this.auditService.log({
      adminUserId,
      action: 'welfare_request_update_added',
      targetType: 'welfare_request',
      targetId: id,
    });

    // Notify user
    await this.notificationsService.create({
      userId: request.userId,
      category: 'welfare_update',
      priority: 'normal',
      title: 'New Update on Your Welfare Request',
      body: `Officer replied to "${request.subject}"`,
      data: { requestId: id },
    });

    return update;
  }

  private async notifyWelfareOfficers(request: any) {
    // Find welfare officers
    const officers = await this.prisma.userRole.findMany({
      where: { role: { name: 'welfare_officer' } },
      include: { user: true },
    });

    for (const officer of officers) {
      await this.notificationsService.create({
        userId: officer.userId,
        category: 'welfare_update',
        priority: request.category === 'emergency' ? 'high' : 'normal',
        title: 'New Welfare Request',
        body: `${request.user.profile?.displayName || request.user.username} submitted: ${request.subject}`,
        data: { requestId: request.id },
      });
    }
  }
}