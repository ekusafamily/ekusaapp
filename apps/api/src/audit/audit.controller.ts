/**
 * EKUSA Digital Platform - Audit Controller
 * Audit logging endpoints
 */

import {
  Controller,
  Get,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Admin')
@Controller('admin/audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'List audit logs (admin)' })
  async list(@Query() params: {
    adminUserId?: string;
    action?: string;
    targetType?: string;
    targetId?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
    sortOrder?: string;
  }) {
    const parsedParams: any = { ...params };
    if (params.startDate) parsedParams.startDate = new Date(params.startDate);
    if (params.endDate) parsedParams.endDate = new Date(params.endDate);
    return this.auditService.list(parsedParams);
  }
}