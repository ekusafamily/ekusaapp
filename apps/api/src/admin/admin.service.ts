/**
 * EKUSA Digital Platform - Admin Service
 * Admin dashboard and settings
 */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardStats() {
    const [
      totalUsers,
      verifiedMembers,
      pendingMemberships,
      recentAnnouncements,
      upcomingEvents,
      eventRegistrations,
      openWelfareRequests,
      recentAuditLogs,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { accountStatus: 'verified_member' } }),
      this.prisma.membership.count({ where: { membershipStatus: 'pending' } }),
      this.prisma.announcement.findMany({ where: { status: 'published' }, orderBy: { publishedAt: 'desc' }, take: 5 }),
      this.prisma.event.count({ where: { status: 'published', startAt: { gte: new Date() } } }),
      this.prisma.eventRegistration.count({ where: { registrationStatus: 'registered' } }),
      this.prisma.welfareRequest.count({ where: { status: { in: ['submitted', 'under_review', 'in_progress'] } } }),
      this.prisma.auditLog.findMany({ take: 10, orderBy: { createdAt: 'desc' }, include: { adminUser: { select: { username: true } } } }),
    ]);

    return {
      totalUsers,
      verifiedMembers,
      pendingMemberships,
      recentAnnouncements,
      upcomingEvents,
      eventRegistrations,
      openWelfareRequests,
      recentAuditLogs,
    };
  }

  async getSettings() {
    // In production, this would come from a settings table
    return {
      appName: 'EKUSA Digital Platform',
      maintenanceMode: false,
      registrationEnabled: true,
      maxFileUploadSize: 5 * 1024 * 1024,
      allowedImageTypes: ['jpeg', 'png', 'webp'],
      membershipAutoApprove: false,
      eventRegistrationEnabled: true,
      welfareEnabled: true,
      messagingEnabled: true,
    };
  }

  async updateSettings(adminUserId: string, data: Record<string, any>) {
    // In production, update settings table
    // For now, just return the data
    return data;
  }
}