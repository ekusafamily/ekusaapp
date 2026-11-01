/**
 * EKUSA Digital Platform - Events Controller
 * Event management and registration endpoints
 */

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { EventsService } from './events.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { createEventRequestSchema } from '@ekusa/validation';

@ApiTags('Events')
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'List accessible events' })
  async list(@Request() req: any, @Query() params: {
    category?: string;
    status?: string;
    campus?: string;
    upcoming?: boolean;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: string;
  }) {
    return this.eventsService.list({ ...params, userId: req.user.sub });
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get event detail' })
  async get(@Param('id') id: string, @Request() req: any) {
    return this.eventsService.get(id, req.user.sub);
  }

  @Post(':id/register')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Register for event' })
  async register(@Param('id') id: string, @Request() req: any) {
    return this.eventsService.register(id, req.user.sub);
  }

  @Delete(':id/register')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Cancel event registration' })
  async cancelRegistration(@Param('id') id: string, @Request() req: any) {
    return this.eventsService.cancelRegistration(id, req.user.sub);
  }

  // Admin endpoints
  @Post('admin/events')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'event_coordinator', 'chairperson', 'vice_chairperson')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create event (admin)' })
  async create(@Request() req: any, @Body() data: {
    title: string;
    description: string;
    category: string;
    venue: string;
    startAt: string;
    endAt: string;
    registrationDeadline: string;
    capacity?: number;
    eligibility?: string;
    registrationFee: number;
  }) {
    return this.eventsService.create({
      ...data,
      startAt: new Date(data.startAt),
      endAt: new Date(data.endAt),
      registrationDeadline: new Date(data.registrationDeadline),
    }, req.user.sub);
  }

  @Patch('admin/events/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'event_coordinator', 'chairperson', 'vice_chairperson')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update event (admin)' })
  async update(@Param('id') id: string, @Request() req: any, @Body() data: Partial<{
    title: string;
    description: string;
    category: string;
    venue: string;
    startAt: string;
    endAt: string;
    registrationDeadline: string;
    capacity?: number;
    eligibility?: string;
    registrationFee: number;
  }>) {
    const parsedData: any = { ...data };
    if (data.startAt) parsedData.startAt = new Date(data.startAt);
    if (data.endAt) parsedData.endAt = new Date(data.endAt);
    if (data.registrationDeadline) parsedData.registrationDeadline = new Date(data.registrationDeadline);
    return this.eventsService.update(id, parsedData, req.user.sub);
  }

  @Get('admin/events/:id/participants')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'event_coordinator', 'chairperson', 'vice_chairperson')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get event participants (admin)' })
  async getParticipants(@Param('id') id: string, @Request() req: any, @Query() params: { page?: number; limit?: number }) {
    return this.eventsService.getParticipants(id, req.user.sub, params);
  }

  @Patch('admin/events/:id/attendance')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'event_coordinator')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Record attendance (admin)' })
  async recordAttendance(@Param('id') id: string, @Request() req: any, @Body() data: { userId: string; attendanceStatus: 'present' | 'absent' | 'excused' }) {
    return this.eventsService.recordAttendance(id, data.userId, data.attendanceStatus, req.user.sub);
  }
}

@ApiTags('Admin - Events')
@Controller('admin/events')
export class AdminEventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'event_coordinator', 'chairperson', 'vice_chairperson')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'List events (admin)' })
  async list(@Query() params: {
    category?: string;
    status?: string;
    campus?: string;
    upcoming?: boolean;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: string;
  }) {
    return this.eventsService.list(params);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'event_coordinator', 'chairperson', 'vice_chairperson')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create event (admin)' })
  async create(@Request() req: any, @Body() data: {
    title: string;
    description: string;
    category: string;
    venue: string;
    startAt: string;
    endAt: string;
    registrationDeadline: string;
    capacity?: number;
    eligibility?: string;
    registrationFee: number;
  }) {
    return this.eventsService.create({
      ...data,
      startAt: new Date(data.startAt),
      endAt: new Date(data.endAt),
      registrationDeadline: new Date(data.registrationDeadline),
    }, req.user.sub);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'event_coordinator', 'chairperson', 'vice_chairperson')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update event (admin)' })
  async update(@Param('id') id: string, @Request() req: any, @Body() data: Partial<{
    title: string;
    description: string;
    category: string;
    venue: string;
    startAt: string;
    endAt: string;
    registrationDeadline: string;
    capacity?: number;
    eligibility?: string;
    registrationFee: number;
  }>) {
    const parsedData: any = { ...data };
    if (data.startAt) parsedData.startAt = new Date(data.startAt);
    if (data.endAt) parsedData.endAt = new Date(data.endAt);
    if (data.registrationDeadline) parsedData.registrationDeadline = new Date(data.registrationDeadline);
    return this.eventsService.update(id, parsedData, req.user.sub);
  }

  @Get(':id/participants')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'event_coordinator', 'chairperson', 'vice_chairperson')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get event participants (admin)' })
  async getParticipants(@Param('id') id: string, @Request() req: any, @Query() params: { page?: number; limit?: number }) {
    return this.eventsService.getParticipants(id, req.user.sub, params);
  }

  @Patch(':id/attendance')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'event_coordinator')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Record attendance (admin)' })
  async recordAttendance(@Param('id') id: string, @Request() req: any, @Body() data: { userId: string; attendanceStatus: 'present' | 'absent' | 'excused' }) {
    return this.eventsService.recordAttendance(id, data.userId, data.attendanceStatus, req.user.sub);
  }
}