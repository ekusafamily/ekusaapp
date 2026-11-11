/**
 * EKUSA Digital Platform - Roles Guard
 * Role-based access control for admin endpoints.
 * Uses a short-lived in-memory cache to avoid re-querying roles on every request.
 */

import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { PrismaService } from '../../prisma/prisma.service';

interface CacheEntry {
  roles: string[];
  expiresAt: number;
}

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

const roleCache = new Map<string, CacheEntry>();

function getCachedRoles(userId: string): string[] | null {
  const entry = roleCache.get(userId);
  if (entry && Date.now() < entry.expiresAt) return entry.roles;
  roleCache.delete(userId);
  return null;
}

function setCachedRoles(userId: string, roles: string[]): void {
  roleCache.set(userId, { roles, expiresAt: Date.now() + CACHE_TTL_MS });
}

export function invalidateRoleCache(userId: string): void {
  roleCache.delete(userId);
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const userId = request.user?.sub || request.user?.id;

    if (!userId) {
      throw new ForbiddenException('User not authenticated');
    }

    const cachedRoles = getCachedRoles(userId);
    let userRoleNames: string[];

    if (cachedRoles) {
      userRoleNames = cachedRoles;
    } else {
      const userRoles = await this.prisma.userRole.findMany({
        where: { userId },
        include: { role: true },
      });
      userRoleNames = userRoles.map((ur: any) => ur.role.name);
      setCachedRoles(userId, userRoleNames);
    }

    const hasRole = requiredRoles.some(role => userRoleNames.includes(role));

    if (!hasRole) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}