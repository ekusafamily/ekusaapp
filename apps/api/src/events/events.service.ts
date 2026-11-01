/**
 * EKUSA Digital Platform - Events Service
 * Event management and registration logic
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
import { NotificationsService } from '../notifications/notifications.service';
import { EventCategory } from '@prisma/client';

@Injectable()
export class EventsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async list(params: {
    category?: string;
    status?: string;
    campus?: string;
    upcoming?: boolean;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: string;
    userId?: string;
  }) {
    const { category, status, campus, upcoming, sortBy = 'startAt', sortOrder = 'asc', userId } = params;
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.max(1, Number(params.limit) || 20);

    const where: any = {};
    if (category && category !== 'all') where.category = category as EventCategory;
    if (status && status !== 'all') where.status = status;
    if (campus) where.venue = { contains: campus, mode: 'insensitive' };
    if (upcoming) where.startAt = { gte: new Date() };

    // For non-admin users, only show published events
    if (userId) {
      where.status = 'published';
    }

    const [items, total] = await Promise.all([
      this.prisma.event.findMany({
        where,
        include: {
          creator: {
            select: { id: true, username: true, profile: { select: { displayName: true } } },
          },
          registrations: userId ? { where: { userId } } : false,
          _count: { select: { registrations: true } },
        },
        orderBy: { [sortBy]: sortOrder },
        take: limit,
        skip: (page - 1) * limit,
      }),
      this.prisma.event.count({ where }),
    ]);

    return {
      items: items.map(item => ({
        ...item,
        createdByName: item.creator.profile?.displayName || item.creator.username,
        registrationCount: item._count.registrations,
        registrationStatus: item.registrations?.[0]?.registrationStatus || null,
      })),
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  async get(id: string, userId?: string) {
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: {
        creator: {
          select: { id: true, username: true, profile: { select: { displayName: true } } },
        },
        registrations: userId ? { where: { userId } } : false,
        _count: { select: { registrations: true } },
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    return {
      ...event,
      createdByName: event.creator.profile?.displayName || event.creator.username,
      registrationCount: event._count.registrations,
      registrationStatus: event.registrations?.[0]?.registrationStatus || null,
    };
  }

  async register(eventId: string, userId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: { registrations: { where: { userId } } },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (event.status !== 'published') {
      throw new ForbiddenException('Event is not open for registration');
    }

    if (event.registrationDeadline < new Date()) {
      throw new BadRequestException('Registration deadline has passed');
    }

    if (event.startAt < new Date()) {
      throw new BadRequestException('Event has already started');
    }

    // Check capacity
    if (event.capacity) {
      const currentRegistrations = await this.prisma.eventRegistration.count({
        where: { eventId, registrationStatus: 'registered' },
      });
      if (currentRegistrations >= event.capacity) {
        throw new BadRequestException('Event is at full capacity');
      }
    }

    // Check existing registration
    const existing = event.registrations.find(r => r.userId === userId);
    if (existing) {
      if (existing.registrationStatus === 'registered') {
        throw new ConflictException('Already registered for this event');
      }
      // Reactivate cancelled registration
      await this.prisma.eventRegistration.update({
        where: { id: existing.id },
        data: { registrationStatus: 'registered' },
      });
      return { success: true, reactivated: true };
    }

    // Create registration
    await this.prisma.eventRegistration.create({
      data: {
        eventId,
        userId,
        registrationStatus: 'registered',
      },
    });

    await this.auditService.log({
      adminUserId: userId,
      action: 'event_registration',
      targetType: 'event_registration',
      targetId: eventId,
    });

    // Send confirmation notification
    await this.notificationsService.create({
      userId,
      category: 'event_registration',
      priority: 'normal',
      title: 'Event Registration Confirmed',
      body: `You have successfully registered for ${event.title}`,
      data: { eventId },
    });

    return { success: true };
  }

  async cancelRegistration(eventId: string, userId: string) {
    const registration = await this.prisma.eventRegistration.findUnique({
      where: { eventId_userId: { eventId, userId } },
    });

    if (!registration) {
      throw new NotFoundException('Registration not found');
    }

    if (registration.registrationStatus === 'cancelled') {
      throw new BadRequestException('Registration already cancelled');
    }

    await this.prisma.eventRegistration.update({
      where: { id: registration.id },
      data: { registrationStatus: 'cancelled' },
    });

    await this.auditService.log({
      adminUserId: userId,
      action: 'event_registration_cancelled',
      targetType: 'event_registration',
      targetId: eventId,
    });

    return { success: true };
  }

  async create(data: {
    title: string;
    description: string;
    category: string;
    venue: string;
    startAt: Date;
    endAt: Date;
    registrationDeadline: Date;
    capacity?: number;
    eligibility?: string;
    registrationFee: number;
  }, adminUserId: string) {
    if (data.endAt <= data.startAt) {
      throw new BadRequestException('End time must be after start time');
    }
    if (data.registrationDeadline > data.startAt) {
      throw new BadRequestException('Registration deadline must be before event start');
    }

    const event = await this.prisma.event.create({
      data: {
        title: data.title,
        description: data.description,
        category: data.category as EventCategory,
        venue: data.venue,
        startAt: data.startAt,
        endAt: data.endAt,
        registrationDeadline: data.registrationDeadline,
        capacity: data.capacity,
        eligibility: data.eligibility,
        registrationFee: data.registrationFee,
        status: 'draft',
        createdBy: adminUserId,
      },
    });

    await this.auditService.log({
      adminUserId,
      action: 'event_created',
      targetType: 'event',
      targetId: event.id,
    });

    return event;
  }

  async update(id: string, data: Partial<{
    title: string;
    description: string;
    category: string;
    venue: string;
    startAt: Date;
    endAt: Date;
    registrationDeadline: Date;
    capacity?: number;
    eligibility?: string;
    registrationFee: number;
  }>, adminUserId: string) {
    const event = await this.prisma.event.findUnique({ where: { id } });
    if (!event) throw new NotFoundException('Event not found');

    if (data.startAt && data.endAt && data.endAt <= data.startAt) {
      throw new BadRequestException('End time must be after start time');
    }

    const updateData: any = { ...data };
    if (data.category) updateData.category = data.category as EventCategory;

    const updated = await this.prisma.event.update({
      where: { id },
      data: updateData,
    });

    await this.auditService.log({
      adminUserId,
      action: 'event_updated',
      targetType: 'event',
      targetId: id,
    });

    return updated;
  }

  async getParticipants(eventId: string, adminUserId: string, params: { page?: number; limit?: number }) {
    const event = await this.prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw new NotFoundException('Event not found');

    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.max(1, Number(params.limit) || 50);

    const [items, total] = await Promise.all([
      this.prisma.eventRegistration.findMany({
        where: { eventId },
        include: {
          user: {
            select: { id: true, username: true, profile: { select: { displayName: true, campus: true, course: true } }, membership: { select: { membershipStatus: true } } },
          },
        },
        orderBy: { registeredAt: 'asc' },
        take: limit,
        skip: (page - 1) * limit,
      }),
      this.prisma.eventRegistration.count({ where: { eventId } }),
    ]);

    return { items, page, limit, total, totalPages: Math.ceil(total / limit) };
  }

  async recordAttendance(eventId: string, userId: string, attendanceStatus: 'present' | 'absent' | 'excused', adminUserId: string) {
    const registration = await this.prisma.eventRegistration.findUnique({
      where: { eventId_userId: { eventId, userId } },
    });

    if (!registration) {
      throw new NotFoundException('Registration not found');
    }

    await this.prisma.eventRegistration.update({
      where: { id: registration.id },
      data: { attendanceStatus },
    });

    await this.auditService.log({
      adminUserId,
      action: 'event_attendance_recorded',
      targetType: 'event_registration',
      targetId: registration.id,
      changes: { attendanceStatus: { before: null, after: attendanceStatus } },
    });

    return { success: true };
  }
}