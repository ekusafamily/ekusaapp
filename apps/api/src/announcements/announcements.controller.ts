/**
 * EKUSA Digital Platform - Announcements Controller
 * Official announcement management endpoints
 */

import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { AnnouncementsService } from './announcements.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { createAnnouncementRequestSchema } from '@ekusa/validation';

@ApiTags('Announcements')
@Controller('announcements')
export class AnnouncementsController {
  constructor(private readonly announcementsService: AnnouncementsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'List accessible announcements' })
  async list(@Request() req: any, @Query() params: {
    category?: string;
    status?: string;
    priority?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: string;
  }) {
    return this.announcementsService.list({ ...params, userId: req.user.sub });
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get announcement detail' })
  async get(@Param('id') id: string, @Request() req: any) {
    return this.announcementsService.get(id, req.user.sub);
  }

  @Post(':id/read')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Mark announcement as read' })
  async markRead(@Param('id') id: string, @Request() req: any) {
    return this.announcementsService.markRead(id, req.user.sub);
  }

  // Admin endpoints
  @Post('admin/announcements')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'communication_officer', 'chairperson', 'vice_chairperson')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create announcement (admin)' })
  async create(@Request() req: any, @Body() data: {
    title: string;
    body: string;
    category: string;
    priority: string;
    targets: Array<{ type: string; value: string }>;
    scheduledAt?: string;
    expiresAt?: string;
    pinned?: boolean;
  }) {
    return this.announcementsService.create(data, req.user.sub);
  }

  @Patch('admin/announcements/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'communication_officer', 'chairperson', 'vice_chairperson')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update announcement (admin)' })
  async update(@Param('id') id: string, @Request() req: any, @Body() data: Partial<{
    title: string;
    body: string;
    category: string;
    priority: string;
    targets: Array<{ type: string; value: string }>;
    scheduledAt?: string;
    expiresAt?: string;
    pinned?: boolean;
  }>) {
    return this.announcementsService.update(id, data, req.user.sub);
  }

  @Post('admin/announcements/:id/publish')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'communication_officer', 'chairperson', 'vice_chairperson')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Publish announcement (admin)' })
  async publish(@Param('id') id: string, @Request() req: any) {
    return this.announcementsService.publish(id, req.user.sub);
  }

  @Post('admin/announcements/:id/archive')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'communication_officer', 'chairperson', 'vice_chairperson')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Archive announcement (admin)' })
  async archive(@Param('id') id: string, @Request() req: any) {
    return this.announcementsService.archive(id, req.user.sub);
  }

  @Get('admin/announcements/:id/stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'communication_officer', 'chairperson', 'vice_chairperson')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get announcement statistics (admin)' })
  async getStats(@Param('id') id: string, @Request() req: any) {
    return this.announcementsService.getStats(id, req.user.sub);
  }

  @Get('admin/announcements')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'communication_officer', 'chairperson', 'vice_chairperson')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'List all announcements (admin)' })
  async listAdmin(@Query() params: { status?: string; page?: number; limit?: number }) {
    return this.announcementsService.list({ ...params, status: params.status || 'all' });
  }
}