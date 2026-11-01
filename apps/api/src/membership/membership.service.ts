/**
 * EKUSA Digital Platform - Membership Service
 * Membership application and verification logic
 */

import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class MembershipService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async apply(userId: string, data: {
    registrationNumber: string;
    campus: string;
    course: string;
    yearOfStudy: number;
    contactInfo?: string;
  }) {
    // Check if user already has a membership application
    const existing = await this.prisma.membership.findUnique({
      where: { userId },
    });

    if (existing) {
      if (existing.membershipStatus === 'pending') {
        throw new ConflictException('Membership application already pending');
      }
      if (existing.membershipStatus === 'verified') {
        throw new ConflictException('Already a verified member');
      }
      // Allow resubmission for rejected/suspended
    }

    // Check if registration number is already used
    const regNumberExists = await this.prisma.membership.findUnique({
      where: { registrationNumber: data.registrationNumber },
    });

    if (regNumberExists && regNumberExists.userId !== userId) {
      throw new ConflictException('Registration number already in use');
    }

    const membership = await this.prisma.membership.upsert({
      where: { userId },
      create: {
        userId,
        registrationNumber: data.registrationNumber,
        campus: data.campus,
        course: data.course,
        yearOfStudy: data.yearOfStudy,
        contactInfo: data.contactInfo,
        membershipStatus: 'pending',
      },
      update: {
        registrationNumber: data.registrationNumber,
        campus: data.campus,
        course: data.course,
        yearOfStudy: data.yearOfStudy,
        contactInfo: data.contactInfo,
        membershipStatus: 'pending',
        submittedAt: new Date(),
        reviewedAt: null,
        reviewedBy: null,
        rejectionReason: null,
      },
    });

    // Update user account status
    await this.prisma.user.update({
      where: { id: userId },
      data: { accountStatus: 'membership_pending' },
    });

    // Audit log
    await this.auditService.log({
      adminUserId: userId,
      action: 'membership_application_submitted',
      targetType: 'membership',
      targetId: membership.id,
      changes: {
        membershipStatus: { before: 'none', after: 'pending' },
      },
    });

    return membership;
  }

  async getMyStatus(userId: string) {
    const membership = await this.prisma.membership.findUnique({
      where: { userId },
      include: {
        reviewer: {
          select: {
            id: true,
            username: true,
            profile: { select: { displayName: true } },
          },
        },
      },
    });

    if (!membership) {
      return { membershipStatus: 'none' };
    }

    return membership;
  }

  async listApplications(params: {
    status?: string;
    campus?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: string;
  }) {
    const { status, campus, sortBy = 'submittedAt', sortOrder = 'desc' } = params;
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.max(1, Number(params.limit) || 20);

    const where: any = {};
    if (status && status !== 'all') {
      where.membershipStatus = status;
    }
    if (campus) {
      where.campus = campus;
    }

    const [items, total] = await Promise.all([
      this.prisma.membership.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true,
              accountStatus: true,
              createdAt: true,
            },
          },
          reviewer: {
            select: {
              id: true,
              username: true,
              profile: { select: { displayName: true } },
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        take: limit,
        skip: (page - 1) * limit,
      }),
      this.prisma.membership.count({ where }),
    ]);

    return {
      items,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getApplication(id: string) {
    const membership = await this.prisma.membership.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            phoneNumber: true,
            accountStatus: true,
            createdAt: true,
            profile: true,
          },
        },
        reviewer: {
          select: {
            id: true,
            username: true,
            profile: { select: { displayName: true } },
          },
        },
      },
    });

    if (!membership) {
      throw new NotFoundException('Membership application not found');
    }

    return membership;
  }

  async approve(id: string, adminUserId: string) {
    const membership = await this.prisma.membership.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!membership) {
      throw new NotFoundException('Membership application not found');
    }

    if (membership.membershipStatus === 'verified') {
      throw new BadRequestException('Already approved');
    }

    const updated = await this.prisma.membership.update({
      where: { id },
      data: {
        membershipStatus: 'verified',
        reviewedAt: new Date(),
        reviewedBy: adminUserId,
      },
    });

    // Update user account status
    await this.prisma.user.update({
      where: { id: membership.userId },
      data: { accountStatus: 'verified_member' },
    });

    // Audit log
    await this.auditService.log({
      adminUserId,
      action: 'membership_approved',
      targetType: 'membership',
      targetId: id,
      changes: {
        membershipStatus: { before: membership.membershipStatus, after: 'verified' },
      },
    });

    return updated;
  }

  async reject(id: string, adminUserId: string, rejectionReason: string) {
    const membership = await this.prisma.membership.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!membership) {
      throw new NotFoundException('Membership application not found');
    }

    if (membership.membershipStatus === 'rejected') {
      throw new BadRequestException('Already rejected');
    }

    const updated = await this.prisma.membership.update({
      where: { id },
      data: {
        membershipStatus: 'rejected',
        reviewedAt: new Date(),
        reviewedBy: adminUserId,
        rejectionReason,
      },
    });

    // Update user account status (but don't deactivate the account)
    await this.prisma.user.update({
      where: { id: membership.userId },
      data: { accountStatus: 'rejected' },
    });

    // Audit log
    await this.auditService.log({
      adminUserId,
      action: 'membership_rejected',
      targetType: 'membership',
      targetId: id,
      changes: {
        membershipStatus: { before: membership.membershipStatus, after: 'rejected' },
        rejectionReason: { before: null, after: rejectionReason },
      },
    });

    return updated;
  }
}