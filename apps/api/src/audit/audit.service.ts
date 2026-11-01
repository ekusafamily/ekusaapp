/**
 * EKUSA Digital Platform - Audit Service
 * Audit logging for administrative actions
 */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface AuditLogData {
  adminUserId: string;
  action: string;
  targetType: string;
  targetId: string;
  changes?: Record<string, { before: any; after: any }>;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(data: AuditLogData) {
    return this.prisma.auditLog.create({
      data: {
        adminUserId: data.adminUserId,
        action: data.action,
        targetType: data.targetType,
        targetId: data.targetId,
        changes: data.changes,
        metadata: data.metadata,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      },
    });
  }

  async list(params: {
    adminUserId?: string;
    action?: string;
    targetType?: string;
    targetId?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
    sortOrder?: 'asc' | 'desc';
  }) {
    const { adminUserId, action, targetType, targetId, startDate, endDate, sortOrder = 'desc' } = params;
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.max(1, Number(params.limit) || 50);

    const where: any = {};
    if (adminUserId) where.adminUserId = adminUserId;
    if (action) where.action = action;
    if (targetType) where.targetType = targetType;
    if (targetId) where.targetId = targetId;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        include: {
          adminUser: {
            select: { id: true, username: true, profile: { select: { displayName: true } } },
          },
        },
        orderBy: { createdAt: sortOrder as 'asc' | 'desc' },
        take: limit,
        skip: (page - 1) * limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { items, page, limit, total, totalPages: Math.ceil(total / limit) };
  }
}