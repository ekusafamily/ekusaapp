/**
 * EKUSA Digital Platform - Roles Service
 * Role and permission management
 */

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { invalidateRoleCache } from '../auth/guards/roles.guard';

@Injectable()
export class RolesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async list() {
    return this.prisma.role.findMany({
      include: {
        rolePermissions: { include: { permission: true } },
        _count: { select: { userRoles: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async create(adminUserId: string, data: { name: string; displayName: string; description?: string; permissions: string[] }) {
    const existing = await this.prisma.role.findUnique({ where: { name: data.name } });
    if (existing) throw new ConflictException('Role name already exists');

    const permissions = await this.prisma.permission.findMany({
      where: { name: { in: data.permissions } },
    });

    if (permissions.length !== data.permissions.length) {
      throw new BadRequestException('One or more permissions do not exist');
    }

    const role = await this.prisma.role.create({
      data: {
        name: data.name,
        displayName: data.displayName,
        description: data.description,
        permissions: data.permissions,
        rolePermissions: {
          create: permissions.map(p => ({ permissionId: p.id })),
        },
      },
      include: { rolePermissions: { include: { permission: true } } },
    });

    await this.auditService.log({
      adminUserId,
      action: 'role_created',
      targetType: 'role',
      targetId: role.id,
    });

    return role;
  }

  async assign(adminUserId: string, userId: string, roleId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const role = await this.prisma.role.findUnique({ where: { id: roleId } });
    if (!role) throw new NotFoundException('Role not found');

    const existing = await this.prisma.userRole.findUnique({
      where: { userId_roleId: { userId, roleId } },
    });

    if (existing) throw new ConflictException('User already has this role');

    const userRole = await this.prisma.userRole.create({
      data: { userId, roleId, assignedBy: adminUserId },
      include: { role: true },
    });

    invalidateRoleCache(userId);

    await this.auditService.log({
      adminUserId,
      action: 'role_assigned',
      targetType: 'user_role',
      targetId: `${userId}_${roleId}`,
      changes: { role: { before: null, after: role.name } },
    });

    return userRole;
  }

  async revoke(adminUserId: string, userId: string, roleId: string) {
    const userRole = await this.prisma.userRole.findUnique({
      where: { userId_roleId: { userId, roleId } },
    });

    if (!userRole) throw new NotFoundException('User does not have this role');

    await this.prisma.userRole.delete({
      where: { userId_roleId: { userId, roleId } },
    });

    invalidateRoleCache(userId);

    await this.auditService.log({
      adminUserId,
      action: 'role_revoked',
      targetType: 'user_role',
      targetId: `${userId}_${roleId}`,
      changes: { role: { before: userRole.roleId, after: null } },
    });

    return { success: true };
  }
}