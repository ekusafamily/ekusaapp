/**
 * EKUSA Digital Platform - Welfare Controller
 * Welfare request management endpoints
 */

import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { WelfareService } from './welfare.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { submitWelfareRequestSchema } from '@ekusa/validation';

@ApiTags('Welfare')
@Controller('welfare')
export class WelfareController {
  constructor(private readonly welfareService: WelfareService) {}

  @Post('requests')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Submit welfare request' })
  async submit(@Request() req: any, @Body() data: {
    category: string;
    subject: string;
    description: string;
  }) {
    return this.welfareService.submit(req.user.sub, data);
  }

  @Get('requests/me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'View own welfare requests' })
  async getMyRequests(@Request() req: any, @Query() params: { status?: string; page?: number; limit?: number }) {
    return this.welfareService.getMyRequests(req.user.sub, params);
  }

  // Admin endpoints (nested under welfare)
  @Get('admin/welfare/requests')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'welfare_officer', 'chairperson', 'vice_chairperson')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'List welfare requests (admin)' })
  async list(@Query() params: { status?: string; category?: string; page?: number; limit?: number }) {
    return this.welfareService.list(params);
  }

  @Patch('admin/welfare/requests/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'welfare_officer')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update welfare request (admin)' })
  async update(@Param('id') id: string, @Request() req: any, @Body() data: { status?: string; assignedOfficerId?: string | null }) {
    return this.welfareService.update(id, req.user.sub, data);
  }

  @Post('admin/welfare/requests/:id/updates')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'welfare_officer')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Add update to welfare request (admin)' })
  async addUpdate(@Param('id') id: string, @Request() req: any, @Body() data: { message: string }) {
    return this.welfareService.addUpdate(id, req.user.sub, data.message);
  }
}

@ApiTags('Admin - Welfare')
@Controller('admin/welfare')
export class AdminWelfareController {
  constructor(private readonly welfareService: WelfareService) {}

  @Get('requests')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'welfare_officer', 'chairperson', 'vice_chairperson')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'List welfare requests (admin)' })
  async list(@Query() params: { status?: string; category?: string; page?: number; limit?: number }) {
    return this.welfareService.list(params);
  }

  @Get('officers')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'welfare_officer', 'chairperson', 'vice_chairperson')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'List assignable welfare officers (admin)' })
  async listOfficers() {
    return this.welfareService.listOfficers();
  }

  @Get('requests/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'welfare_officer', 'chairperson', 'vice_chairperson')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get welfare request details (admin)' })
  async getById(@Param('id') id: string) {
    return this.welfareService.getById(id);
  }

  @Patch('requests/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'welfare_officer')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update welfare request (admin)' })
  async update(@Param('id') id: string, @Request() req: any, @Body() data: { status?: string; assignedOfficerId?: string | null }) {
    return this.welfareService.update(id, req.user.sub, data);
  }

  @Post('requests/:id/updates')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'welfare_officer')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Add update to welfare request (admin)' })
  async addUpdate(@Param('id') id: string, @Request() req: any, @Body() data: { message: string }) {
    return this.welfareService.addUpdate(id, req.user.sub, data.message);
  }
}