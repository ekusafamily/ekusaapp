/**
 * EKUSA Digital Platform - Leadership Service
 * Leadership directory and positions
 */

import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class LeadershipService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async getDirectory() {
    const positions = await this.prisma.leadershipPosition.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
      include: {
        leaders: {
          where: { isActive: true },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                profile: { select: { displayName: true, avatarObjectKey: true } },
              },
            },
          },
        },
      },
    });

    return positions.map((pos: any) => ({
      ...pos,
      leaders: pos.leaders.map((l: any) => ({
        ...l,
        userName: l.user.profile?.displayName || l.user.username,
        userAvatarUrl: l.user.profile?.avatarObjectKey,
      })),
    }));
  }

  async getPositions() {
    return this.prisma.leadershipPosition.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    });
  }

  async createPosition(adminUserId: string, data: { title: string; description?: string; order: number; isActive: boolean }) {
    const position = await this.prisma.leadershipPosition.create({ data });

    await this.auditService.log({
      adminUserId,
      action: 'leadership_position_created',
      targetType: 'leadership_position',
      targetId: position.id,
    });

    return position;
  }

  async assignLeader(adminUserId: string, data: { userId: string; positionId: string; startDate: Date; endDate?: Date | null; contactInfo?: string | null }) {
    const position = await this.prisma.leadershipPosition.findUnique({ where: { id: data.positionId } });
    if (!position) throw new NotFoundException('Position not found');

    const user = await this.prisma.user.findUnique({ where: { id: data.userId } });
    if (!user) throw new NotFoundException('User not found');

    // Check if user already holds this position
    const existing = await this.prisma.leader.findUnique({
      where: { userId_positionId: { userId: data.userId, positionId: data.positionId } },
    });

    if (existing) {
      if (existing.isActive) throw new BadRequestException('User already holds this position');
      // Reactivate
      return this.prisma.leader.update({
        where: { id: existing.id },
        data: { ...data, isActive: true },
      });
    }

    const leader = await this.prisma.leader.create({ data });

    await this.auditService.log({
      adminUserId,
      action: 'leader_assigned',
      targetType: 'leader',
      targetId: leader.id,
    });

    return leader;
  }
}